/**
 * BuildingExtruder — High-performance polygon-to-2.5D extrusion engine.
 *
 * Converts 2D building footprints into extruded 3D meshes suitable for
 * instanced rendering in Three.js. Supports LOD toggling (basic / enriched),
 * deterministic height fallback, and thematic attribute metadata.
 *
 * Height derivation rules (deterministic, in order):
 *  1. Try each key in HeightStrategy.attributeKeys — first valid positive number wins.
 *  2. If a floorsKey is defined and yields a valid number, use floors × floorHeight.
 *  3. Fall back to defaultHeight.
 *
 * Invalid footprints (< 3 vertices, zero area, self-intersecting) are skipped
 * with a descriptive reason and counted in ExtrusionResult.skipped.
 */

import {
  type BuildingAttributes,
  type BuildingFeature,
  type BuildingFootprint,
  DEFAULT_HEIGHT_STRATEGY,
  type ExtrudedBuilding,
  type ExtrusionProgressCallback,
  type ExtrusionResult,
  type HeightStrategy,
  type LODLevel,
  type Ring,
} from "./buildingTypes";

/* ================================================================== */
/*  §1  GEOMETRY UTILITIES                                            */
/* ================================================================== */

/** Signed area of a ring (positive = CCW). */
export function signedArea(ring: Ring): number {
  let area = 0;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return area * 0.5;
}

/** Absolute area. */
export function polygonArea(ring: Ring): number {
  return Math.abs(signedArea(ring));
}

/** Centroid of a simple polygon. */
export function centroid(ring: Ring): [number, number] {
  let cx = 0;
  let cy = 0;
  let a = 0;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * cross;
    cy += (ring[j][1] + ring[i][1]) * cross;
    a += cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) {
    // Degenerate — return average of vertices
    const sx = ring.reduce((s, p) => s + p[0], 0);
    const sy = ring.reduce((s, p) => s + p[1], 0);
    return [sx / (n || 1), sy / (n || 1)];
  }
  const f = 1 / (6 * a);
  return [cx * f, cy * f];
}

/** Ensure ring is CCW. Returns a new array if reversed. */
function ensureCCW(ring: Ring): Ring {
  return signedArea(ring) < 0 ? [...ring].reverse() : ring;
}

/** Ensure ring is CW. Returns a new array if reversed. */
function ensureCW(ring: Ring): Ring {
  return signedArea(ring) > 0 ? [...ring].reverse() : ring;
}

/** Strip closing vertex if it duplicates the first. */
function openRing(ring: Ring): Ring {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    Math.abs(first[0] - last[0]) < 1e-10 &&
    Math.abs(first[1] - last[1]) < 1e-10
  ) {
    return ring.slice(0, -1);
  }
  return ring;
}

/* ================================================================== */
/*  §2  EAR-CLIP TRIANGULATION                                       */
/* ================================================================== */

/**
 * Simple ear-clipping triangulation for a 2D polygon (no holes variant).
 * Returns triangle indices into the provided ring.
 */
function earClipTriangulate(ring: Ring): number[] {
  const n = ring.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];

  // Build linked index list
  const idx = Array.from({ length: n }, (_, i) => i);
  const tris: number[] = [];

  let safety = n * n; // prevent infinite loops on degenerate input
  while (idx.length > 3 && safety-- > 0) {
    let earFound = false;
    for (let i = 0; i < idx.length; i++) {
      const prev = idx[(i - 1 + idx.length) % idx.length];
      const curr = idx[i];
      const next = idx[(i + 1) % idx.length];

      // Convex vertex check (CCW winding)
      const ax = ring[prev][0], ay = ring[prev][1];
      const bx = ring[curr][0], by = ring[curr][1];
      const cx = ring[next][0], cy = ring[next][1];
      const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (cross <= 0) continue; // reflex

      // Check no other vertex inside this triangle
      let inside = false;
      for (let j = 0; j < idx.length; j++) {
        const vi = idx[j];
        if (vi === prev || vi === curr || vi === next) continue;
        if (pointInTriangle(ring[vi][0], ring[vi][1], ax, ay, bx, by, cx, cy)) {
          inside = true;
          break;
        }
      }
      if (inside) continue;

      tris.push(prev, curr, next);
      idx.splice(i, 1);
      earFound = true;
      break;
    }
    if (!earFound) break; // degenerate
  }
  if (idx.length === 3) {
    tris.push(idx[0], idx[1], idx[2]);
  }
  return tris;
}

function pointInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/* ================================================================== */
/*  §3  HEIGHT RESOLUTION                                             */
/* ================================================================== */

export interface ResolvedHeight {
  height: number;
  source: "attribute" | "floors" | "default";
}

/**
 * Resolve building height using the deterministic fallback strategy.
 *
 * 1. Probe attributeKeys in order — first positive finite number wins.
 * 2. If floorsKey produces a valid number, height = floors × floorHeight.
 * 3. Otherwise use defaultHeight.
 */
export function resolveHeight(
  attrs: BuildingAttributes,
  strategy: HeightStrategy = DEFAULT_HEIGHT_STRATEGY,
): ResolvedHeight {
  // 1. Direct height attributes
  for (const key of strategy.attributeKeys) {
    const val = Number(attrs[key]);
    if (Number.isFinite(val) && val > 0) {
      return { height: val, source: "attribute" };
    }
  }
  // 2. Floors-based derivation
  if (strategy.floorsKey) {
    const floors = Number(attrs[strategy.floorsKey]);
    if (Number.isFinite(floors) && floors > 0) {
      return {
        height: floors * (strategy.floorHeight ?? 3.2),
        source: "floors",
      };
    }
  }
  // 3. Default
  return { height: strategy.defaultHeight, source: "default" };
}

/* ================================================================== */
/*  §4  SINGLE-BUILDING EXTRUSION                                     */
/* ================================================================== */

/**
 * Validate and normalise a building footprint.
 * Returns null + reason if the footprint is invalid.
 */
function validateFootprint(
  fp: BuildingFootprint,
): { outer: Ring; holes: Ring[]; repaired: boolean } | { error: string } {
  let outer = openRing(fp.outer);
  if (outer.length < 3) return { error: "footprint has fewer than 3 vertices" };

  const area = polygonArea(outer);
  if (area < 1e-8) return { error: "footprint area is effectively zero" };

  // Ensure correct winding
  const wasReversed = signedArea(outer) < 0;
  outer = ensureCCW(outer);

  const holes: Ring[] = [];
  if (fp.holes) {
    for (const h of fp.holes) {
      const oh = openRing(h);
      if (oh.length >= 3) holes.push(ensureCW(oh));
    }
  }

  return { outer, holes, repaired: wasReversed };
}

/**
 * Extrude a single building footprint to 2.5D geometry.
 *
 * **Basic LOD**: flat-top box extrusion — floor cap + roof cap + walls.
 * **Enriched LOD**: adds per-floor horizontal edge lines as extra triangles
 * and slightly refined normals.
 */
export function extrudeBuilding(
  feature: BuildingFeature,
  lod: LODLevel,
  strategy: HeightStrategy = DEFAULT_HEIGHT_STRATEGY,
): ExtrudedBuilding | { skipped: true; id: string; reason: string } {
  const fp = validateFootprint(feature.footprint);
  if ("error" in fp) {
    return { skipped: true, id: feature.id, reason: fp.error };
  }

  const { outer, repaired } = fp;
  const resolved = resolveHeight(feature.attributes, strategy);
  const h = resolved.height;

  const n = outer.length;
  const triIndices = earClipTriangulate(outer);
  const capTriCount = triIndices.length / 3;

  // --- Count geometry ---
  // Walls: 2 triangles per edge = n * 6 indices, n * 4 vertices
  const wallVertCount = n * 4;
  const wallIdxCount = n * 6;
  // Floor + roof caps: capTriCount * 3 indices each, n vertices each
  const capVertCount = n * 2;
  const capIdxCount = capTriCount * 3 * 2;

  // Enriched LOD: add floor-line strips (thin quads at each floor level)
  let floorStripVerts = 0;
  let floorStripIdxCount = 0;
  const floorHeights: number[] = [];
  if (lod === "enriched" && h > (strategy.floorHeight ?? 3.2)) {
    const fh = strategy.floorHeight ?? 3.2;
    for (let fz = fh; fz < h - 0.5; fz += fh) {
      floorHeights.push(fz);
    }
    // Each floor line: n edges → n quads → n * 4 verts, n * 6 indices
    floorStripVerts = floorHeights.length * n * 4;
    floorStripIdxCount = floorHeights.length * n * 6;
  }

  const totalVerts = wallVertCount + capVertCount + floorStripVerts;
  const totalIdx = wallIdxCount + capIdxCount + floorStripIdxCount;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIdx);

  let vi = 0; // vertex write cursor
  let ii = 0; // index write cursor

  // Helper: push vertex
  const pushVert = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    const base = vi * 3;
    positions[base] = x;
    positions[base + 1] = y;
    positions[base + 2] = z;
    normals[base] = nx;
    normals[base + 1] = ny;
    normals[base + 2] = nz;
    return vi++;
  };

  // --- FLOOR CAP (z = 0) --- face-down normal (0, -1, 0)
  const floorBase = vi;
  for (let i = 0; i < n; i++) {
    pushVert(outer[i][0], 0, outer[i][1], 0, -1, 0);
  }
  // Reverse winding for floor (facing down)
  for (let t = 0; t < triIndices.length; t += 3) {
    indices[ii++] = floorBase + triIndices[t + 2];
    indices[ii++] = floorBase + triIndices[t + 1];
    indices[ii++] = floorBase + triIndices[t];
  }

  // --- ROOF CAP (z = h) --- face-up normal (0, 1, 0)
  const roofBase = vi;
  for (let i = 0; i < n; i++) {
    pushVert(outer[i][0], h, outer[i][1], 0, 1, 0);
  }
  for (let t = 0; t < triIndices.length; t += 3) {
    indices[ii++] = roofBase + triIndices[t];
    indices[ii++] = roofBase + triIndices[t + 1];
    indices[ii++] = roofBase + triIndices[t + 2];
  }

  // --- WALLS --- each edge becomes a quad (2 triangles)
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = outer[i][0], az = outer[i][1];
    const bx = outer[j][0], bz = outer[j][1];

    // Outward-facing normal
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const nx = dz / len;
    const nz = -dx / len;

    const v0 = pushVert(ax, 0, az, nx, 0, nz);
    const v1 = pushVert(bx, 0, bz, nx, 0, nz);
    const v2 = pushVert(bx, h, bz, nx, 0, nz);
    const v3 = pushVert(ax, h, az, nx, 0, nz);

    indices[ii++] = v0;
    indices[ii++] = v1;
    indices[ii++] = v2;
    indices[ii++] = v0;
    indices[ii++] = v2;
    indices[ii++] = v3;
  }

  // --- ENRICHED LOD: Floor line strips ---
  if (lod === "enriched") {
    const STRIP_H = 0.08; // thin horizontal band
    for (const fz of floorHeights) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ax = outer[i][0], az = outer[i][1];
        const bx = outer[j][0], bz = outer[j][1];

        const dx = bx - ax;
        const dz2 = bz - az;
        const len = Math.sqrt(dx * dx + dz2 * dz2) || 1;
        const nx = (dz2 / len) * 1.001; // tiny offset to avoid z-fighting
        const nz = (-dx / len) * 1.001;

        const v0 = pushVert(ax + nx * 0.01, fz, az + nz * 0.01, nx, 0, nz);
        const v1 = pushVert(bx + nx * 0.01, fz, bz + nz * 0.01, nx, 0, nz);
        const v2 = pushVert(bx + nx * 0.01, fz + STRIP_H, bz + nz * 0.01, nx, 0, nz);
        const v3 = pushVert(ax + nx * 0.01, fz + STRIP_H, az + nz * 0.01, nx, 0, nz);

        indices[ii++] = v0;
        indices[ii++] = v1;
        indices[ii++] = v2;
        indices[ii++] = v0;
        indices[ii++] = v2;
        indices[ii++] = v3;
      }
    }
  }

  const c = centroid(outer);

  return {
    id: feature.id,
    height: h,
    heightSource: resolved.source,
    centroid: c,
    area: polygonArea(outer),
    positions: positions.slice(0, vi * 3),
    indices: indices.slice(0, ii),
    normals: normals.slice(0, vi * 3),
    attributes: { ...feature.attributes },
    repaired,
  };
}

/* ================================================================== */
/*  §5  BATCH EXTRUSION                                               */
/* ================================================================== */

/** Default batch size for yielding to the event loop. */
const BATCH_SIZE = 200;

/**
 * Extrude a collection of buildings.
 *
 * Processes in batches of `batchSize` to avoid blocking the main thread,
 * reporting progress via the optional callback.
 */
export async function extrudeBuildings(
  features: readonly BuildingFeature[],
  opts?: {
    lod?: LODLevel;
    strategy?: HeightStrategy;
    batchSize?: number;
    onProgress?: ExtrusionProgressCallback;
  },
): Promise<ExtrusionResult> {
  const t0 = performance.now();
  const lod = opts?.lod ?? "basic";
  const strategy = opts?.strategy ?? DEFAULT_HEIGHT_STRATEGY;
  const batchSize = opts?.batchSize ?? BATCH_SIZE;

  const buildings: ExtrudedBuilding[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (let i = 0; i < features.length; i++) {
    const result = extrudeBuilding(features[i], lod, strategy);
    if ("skipped" in result) {
      skipped.push({ id: result.id, reason: result.reason });
    } else {
      buildings.push(result);
    }

    // Yield to event loop periodically
    if ((i + 1) % batchSize === 0) {
      opts?.onProgress?.(i + 1, features.length);
      await yieldToMain();
    }
  }

  opts?.onProgress?.(features.length, features.length);

  return {
    buildings,
    skipped,
    durationMs: performance.now() - t0,
    lod,
  };
}

/**
 * Synchronous extrusion for testing or worker contexts.
 */
export function extrudeBuildingsSync(
  features: readonly BuildingFeature[],
  opts?: {
    lod?: LODLevel;
    strategy?: HeightStrategy;
  },
): ExtrusionResult {
  const t0 = performance.now();
  const lod = opts?.lod ?? "basic";
  const strategy = opts?.strategy ?? DEFAULT_HEIGHT_STRATEGY;

  const buildings: ExtrudedBuilding[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const f of features) {
    const result = extrudeBuilding(f, lod, strategy);
    if ("skipped" in result) {
      skipped.push({ id: result.id, reason: result.reason });
    } else {
      buildings.push(result);
    }
  }

  return {
    buildings,
    skipped,
    durationMs: performance.now() - t0,
    lod,
  };
}

/* ================================================================== */
/*  §6  HELPERS                                                       */
/* ================================================================== */

/** Yield to the browser event loop. */
function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
