// VoxCity 3D — Grid loader for .csv and .json voxel data
import type { GridBounds, Voxel, VoxelGrid, VoxelMaterial } from "./types";

/* ------------------------------------------------------------------ */
/*  Default material palette                                          */
/* ------------------------------------------------------------------ */

export const DEFAULT_MATERIALS: readonly VoxelMaterial[] = [
  { id: 0, name: "Air",        category: "air",        color: "#00000000", opacity: 0 },
  { id: 1, name: "Ground",     category: "ground",     color: "#C2B280",   opacity: 1 },
  { id: 2, name: "Building",   category: "building",   color: "#B0B0B0",   opacity: 1 },
  { id: 3, name: "Vegetation", category: "vegetation", color: "#4CAF50",   opacity: 0.85 },
  { id: 4, name: "Water",      category: "water",      color: "#2196F3",   opacity: 0.7 },
] as const;

/* ------------------------------------------------------------------ */
/*  CSV parser                                                        */
/* ------------------------------------------------------------------ */

/**
 * Parse a VoxCity CSV voxel grid.
 *
 * Expected columns (header row required): x, y, z, material_id
 * Additional columns are silently ignored.
 */
export function parseCSV(
  csv: string,
  opts?: { id?: string; name?: string; materials?: readonly VoxelMaterial[] },
): VoxelGrid {
  const lines = csv.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) throw new Error("VoxGridLoader: CSV has no data rows");

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const xi = header.indexOf("x");
  const yi = header.indexOf("y");
  const zi = header.indexOf("z");
  const mi = header.indexOf("material_id");
  if (xi < 0 || yi < 0 || zi < 0 || mi < 0) {
    throw new Error("VoxGridLoader: CSV must have x, y, z, material_id columns");
  }

  const voxels: Voxel[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const x = Number(cols[xi]);
    const y = Number(cols[yi]);
    const z = Number(cols[zi]);
    const materialId = Math.round(Number(cols[mi]));
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    voxels.push({ x, y, z, materialId });
  }

  if (voxels.length === 0) throw new Error("VoxGridLoader: no valid voxels in CSV");

  const materials = opts?.materials ?? DEFAULT_MATERIALS;
  return buildGrid(voxels, materials, opts?.id, opts?.name);
}

/* ------------------------------------------------------------------ */
/*  JSON parser                                                       */
/* ------------------------------------------------------------------ */

/** VoxCity .json schema (top-level). */
interface VoxJsonFile {
  id?: string;
  name?: string;
  resolution?: number;
  materials?: VoxelMaterial[];
  voxels: Array<{ x: number; y: number; z: number; material_id: number }>;
}

/**
 * Parse a VoxCity JSON file.
 */
export function parseJSON(raw: string, opts?: { id?: string; name?: string }): VoxelGrid {
  let data: VoxJsonFile;
  try {
    data = JSON.parse(raw) as VoxJsonFile;
  } catch {
    throw new Error("VoxGridLoader: invalid JSON");
  }

  if (!Array.isArray(data.voxels) || data.voxels.length === 0) {
    throw new Error("VoxGridLoader: JSON must contain a non-empty 'voxels' array");
  }

  const voxels: Voxel[] = data.voxels.map(v => ({
    x: Number(v.x),
    y: Number(v.y),
    z: Number(v.z),
    materialId: Math.round(Number(v.material_id)),
  }));

  const materials = data.materials ?? DEFAULT_MATERIALS;
  const id = opts?.id ?? data.id;
  const name = opts?.name ?? data.name;
  return buildGrid(voxels, materials, id, name, data.resolution);
}

/* ------------------------------------------------------------------ */
/*  Auto-detect format                                                */
/* ------------------------------------------------------------------ */

/**
 * Auto-detect file format by content and parse accordingly.
 */
export function loadFromString(
  content: string,
  opts?: { id?: string; name?: string; materials?: readonly VoxelMaterial[] },
): VoxelGrid {
  const trimmed = content.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJSON(content, opts);
  }
  return parseCSV(content, opts);
}

/**
 * Load a voxel grid from a File (Blob).
 */
export async function loadFromFile(
  file: File,
  opts?: { id?: string; materials?: readonly VoxelMaterial[] },
): Promise<VoxelGrid> {
  const text = await file.text();
  return loadFromString(text, {
    name: file.name,
    ...(opts?.id ? { id: opts.id } : {}),
    ...(opts?.materials ? { materials: opts.materials } : {}),
  });
}

/* ------------------------------------------------------------------ */
/*  Validation                                                        */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validate grid integrity: no duplicate positions, consistent resolution.
 */
export function validateGrid(grid: VoxelGrid): ValidationResult {
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const v of grid.voxels) {
    const key = `${v.x},${v.y},${v.z}`;
    if (seen.has(key)) {
      warnings.push(`Duplicate voxel at (${v.x}, ${v.y}, ${v.z})`);
    }
    seen.add(key);
  }

  // Check resolution consistency — sample pairwise distances
  if (grid.voxels.length >= 2) {
    const xs = [...new Set(grid.voxels.map(v => v.x))].sort((a, b) => a - b);
    if (xs.length >= 2) {
      const step = xs[1] - xs[0];
      for (let i = 2; i < Math.min(xs.length, 50); i++) {
        const diff = Math.abs(xs[i] - xs[i - 1] - step);
        if (diff > step * 0.01) {
          warnings.push(`Inconsistent X spacing at index ${i}: expected ${step}, got ${xs[i] - xs[i - 1]}`);
          break;
        }
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

function computeBounds(voxels: readonly Voxel[]): GridBounds {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const v of voxels) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
    if (v.z < minZ) minZ = v.z;
    if (v.z > maxZ) maxZ = v.z;
  }
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

function inferResolution(voxels: readonly Voxel[]): number {
  if (voxels.length < 2) return 1;
  const xs = [...new Set(voxels.map(v => v.x))].sort((a, b) => a - b);
  if (xs.length >= 2) return Math.abs(xs[1] - xs[0]) || 1;
  return 1;
}

function buildGrid(
  voxels: Voxel[],
  materials: readonly VoxelMaterial[],
  id?: string,
  name?: string,
  resolution?: number,
): VoxelGrid {
  const bounds = computeBounds(voxels);
  return {
    id: id ?? crypto.randomUUID(),
    name: name ?? "Untitled grid",
    resolution: resolution ?? inferResolution(voxels),
    voxels,
    materials,
    bounds,
    count: voxels.length,
  };
}
