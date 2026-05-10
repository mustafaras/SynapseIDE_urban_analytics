/**
 * CityJSONLoader — Semantic 3D city model ingestion engine.
 *
 * Parses CityJSON v2.0 documents, converts CityObjects into renderable
 * geometry with preserved semantic surfaces (roof, wall, ground, etc.),
 * and exposes metadata for thematic mapping and attribute queries.
 *
 * Architecture: designed for extensibility — future 3D Tiles and IFC
 * loaders can implement the same ParsedCityObject output contract.
 */

import type {
  CityJSONDocument,
  CityJSONLoadResult,
  CityJSONProgressCallback,
  CityJSONSummary,
  ParsedCityObject,
  ParsedSurface,
  RawCityObject,
  RawGeometry,
  SemanticSurfaceType,
} from "./cityJsonTypes";

/* ================================================================== */
/*  §1  VERTEX TRANSFORM                                              */
/* ================================================================== */

/**
 * Resolve a vertex index to world coordinates, applying the optional
 * CityJSON affine transform (scale + translate).
 */
function resolveVertex(
  idx: number,
  vertices: [number, number, number][],
  scale: [number, number, number] | null,
  translate: [number, number, number] | null,
): [number, number, number] {
  const v = vertices[idx];
  if (!v) return [0, 0, 0];
  if (scale && translate) {
    return [
      v[0] * scale[0] + translate[0],
      v[1] * scale[1] + translate[1],
      v[2] * scale[2] + translate[2],
    ];
  }
  return [v[0], v[1], v[2]];
}

/* ================================================================== */
/*  §2  TRIANGULATION                                                 */
/* ================================================================== */

/**
 * Ear-clip triangulation for a simple polygon (no holes).
 * Operates on 3D coordinates — projects to the dominant 2D plane first.
 */
function triangulatePolygon(coords: [number, number, number][]): number[] {
  const n = coords.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];

  // Determine dominant axis for 2D projection
  const normal = computeFaceNormal(coords);
  const absX = Math.abs(normal[0]);
  const absY = Math.abs(normal[1]);
  const absZ = Math.abs(normal[2]);

  let u: 0 | 1 | 2;
  let v: 0 | 1 | 2;
  if (absZ >= absX && absZ >= absY) {
    u = 0; v = 1; // project onto XY
  } else if (absY >= absX) {
    u = 0; v = 2; // project onto XZ
  } else {
    u = 1; v = 2; // project onto YZ
  }

  // Determine winding direction of the 2D projection.
  // The ear-clip expects CCW (positive cross products). If the polygon
  // projects as CW (negative signed area), flip the expectation.
  let signedArea2D = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea2D += coords[i][u] * coords[j][v] - coords[j][u] * coords[i][v];
  }
  const windingSign = signedArea2D >= 0 ? 1 : -1;

  // Build index list
  const indices: number[] = [];
  const remaining = Array.from({ length: n }, (_, i) => i);

  let safety = n * 3;
  while (remaining.length > 2 && safety-- > 0) {
    let earFound = false;
    const len = remaining.length;
    for (let i = 0; i < len; i++) {
      const prev = remaining[(i - 1 + len) % len];
      const curr = remaining[i];
      const next = remaining[(i + 1) % len];

      const ax = coords[prev][u], ay = coords[prev][v];
      const bx = coords[curr][u], by = coords[curr][v];
      const cx = coords[next][u], cy = coords[next][v];

      // Cross product — sign must match winding direction
      const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (cross * windingSign <= 0) continue;

      // Check no other vertex inside triangle
      let inside = false;
      for (let j = 0; j < len; j++) {
        if (j === (i - 1 + len) % len || j === i || j === (i + 1) % len) continue;
        const p = remaining[j];
        if (pointInTriangle2D(
          coords[p][u], coords[p][v],
          ax, ay, bx, by, cx, cy,
        )) {
          inside = true;
          break;
        }
      }
      if (inside) continue;

      indices.push(prev, curr, next);
      remaining.splice(i, 1);
      earFound = true;
      break;
    }
    if (!earFound) break;
  }
  return indices;
}

function pointInTriangle2D(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function computeFaceNormal(coords: [number, number, number][]): [number, number, number] {
  let nx = 0, ny = 0, nz = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const curr = coords[i];
    const next = coords[(i + 1) % n];
    nx += (curr[1] - next[1]) * (curr[2] + next[2]);
    ny += (curr[2] - next[2]) * (curr[0] + next[0]);
    nz += (curr[0] - next[0]) * (curr[1] + next[1]);
  }
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < 1e-10) return [0, 0, 1];
  return [nx / len, ny / len, nz / len];
}

/* ================================================================== */
/*  §3  SURFACE PARSING                                               */
/* ================================================================== */

/**
 * Parse a single CityJSON boundary polygon (array of rings — first is outer,
 * rest are holes) into triangulated geometry.
 */
function parseBoundaryPolygon(
  boundary: number[][],
  vertices: [number, number, number][],
  scale: [number, number, number] | null,
  translate: [number, number, number] | null,
): { positions: number[]; indices: number[]; normals: number[] } | null {
  if (!boundary || boundary.length === 0) return null;

  const outerRing = boundary[0];
  if (!outerRing || outerRing.length < 3) return null;

  // Resolve outer ring vertices
  const coords: [number, number, number][] = outerRing.map(
    (idx) => resolveVertex(idx, vertices, scale, translate),
  );

  // Triangulate
  const triIndices = triangulatePolygon(coords);
  if (triIndices.length === 0) return null;

  // Build flat arrays
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const normal = computeFaceNormal(coords);

  // Add all vertices
  for (const c of coords) {
    positions.push(c[0], c[1], c[2]);
    normals.push(normal[0], normal[1], normal[2]);
  }

  // Copy triangle indices
  for (const idx of triIndices) {
    indices.push(idx);
  }

  return { positions, indices, normals };
}

/**
 * Parse a CityJSON geometry object (MultiSurface, Solid, etc.) into
 * an array of ParsedSurface with semantic annotations.
 */
function parseGeometry(
  geom: RawGeometry,
  vertices: [number, number, number][],
  scale: [number, number, number] | null,
  translate: [number, number, number] | null,
): ParsedSurface[] {
  const surfaces: ParsedSurface[] = [];

  const semanticSurfaces = geom.semantics?.surfaces ?? [];
  const semanticValues = geom.semantics?.values ?? [];

  if (geom.type === "MultiSurface" || geom.type === "CompositeSurface") {
    // boundaries: number[][][] — array of polygons, each polygon is array of rings
    const boundaries = geom.boundaries as number[][][];
    const values = semanticValues as (number | null)[];

    for (let i = 0; i < boundaries.length; i++) {
      const polygon = boundaries[i];
      const result = parseBoundaryPolygon(polygon, vertices, scale, translate);
      if (!result) continue;

      const semanticIdx = values[i] ?? null;
      const semanticType: SemanticSurfaceType | null =
        semanticIdx !== null && semanticSurfaces[semanticIdx]
          ? semanticSurfaces[semanticIdx].type
          : null;

      surfaces.push({
        semanticType,
        positions: new Float32Array(result.positions),
        indices: new Uint32Array(result.indices),
        normals: new Float32Array(result.normals),
      });
    }
  } else if (geom.type === "Solid") {
    // boundaries: number[][][][] — array of shells, each shell is array of polygons
    const shells = geom.boundaries as number[][][][];
    const shellValues = semanticValues as (number | null)[][];

    for (let s = 0; s < shells.length; s++) {
      const shell = shells[s];
      const values = shellValues[s] ?? [];

      for (let i = 0; i < shell.length; i++) {
        const polygon = shell[i];
        const result = parseBoundaryPolygon(polygon, vertices, scale, translate);
        if (!result) continue;

        const semanticIdx = values[i] ?? null;
        const semanticType: SemanticSurfaceType | null =
          semanticIdx !== null && semanticSurfaces[semanticIdx]
            ? semanticSurfaces[semanticIdx].type
            : null;

        surfaces.push({
          semanticType,
          positions: new Float32Array(result.positions),
          indices: new Uint32Array(result.indices),
          normals: new Float32Array(result.normals),
        });
      }
    }
  } else if (geom.type === "MultiSolid") {
    // boundaries: number[][][][][] — array of solids
    const solids = geom.boundaries as unknown as number[][][][][];
    for (const solid of solids) {
      for (const shell of solid) {
        for (let i = 0; i < shell.length; i++) {
          const polygon = shell[i];
          const result = parseBoundaryPolygon(polygon, vertices, scale, translate);
          if (!result) continue;

          surfaces.push({
            semanticType: null,
            positions: new Float32Array(result.positions),
            indices: new Uint32Array(result.indices),
            normals: new Float32Array(result.normals),
          });
        }
      }
    }
  }

  return surfaces;
}

/* ================================================================== */
/*  §4  CITY OBJECT PARSING                                           */
/* ================================================================== */

/**
 * Parse a single CityObject into a renderable ParsedCityObject.
 * Selects the highest-LOD geometry if multiple are present.
 */
function parseCityObject(
  id: string,
  raw: RawCityObject,
  vertices: [number, number, number][],
  scale: [number, number, number] | null,
  translate: [number, number, number] | null,
): ParsedCityObject | null {
  if (!raw.geometry || raw.geometry.length === 0) return null;

  // Pick geometry with highest LOD
  const geom = raw.geometry.reduce((best, curr) => {
    const bestLod = parseFloat(best.lod) || 0;
    const currLod = parseFloat(curr.lod) || 0;
    return currLod > bestLod ? curr : best;
  }, raw.geometry[0]);

  const surfaces = parseGeometry(geom, vertices, scale, translate);
  if (surfaces.length === 0) return null;

  // Compute bounding box from all surface positions
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const s of surfaces) {
    for (let i = 0; i < s.positions.length; i += 3) {
      const x = s.positions[i], y = s.positions[i + 1], z = s.positions[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }

  return {
    id,
    type: raw.type,
    attributes: raw.attributes ?? {},
    surfaces,
    bbox: [minX, minY, minZ, maxX, maxY, maxZ],
    children: raw.children ?? [],
    parents: raw.parents ?? [],
    lod: geom.lod,
  };
}

/* ================================================================== */
/*  §5  SUMMARY GENERATION                                            */
/* ================================================================== */

function buildSummary(
  doc: CityJSONDocument,
  objects: ParsedCityObject[],
  parseTimeMs: number,
): CityJSONSummary {
  const objectTypeCounts: Record<string, number> = {};
  const semanticSurfaceCounts: Record<string, number> = {};
  const attributeKeySet = new Set<string>();

  for (const obj of objects) {
    objectTypeCounts[obj.type] = (objectTypeCounts[obj.type] ?? 0) + 1;
    for (const s of obj.surfaces) {
      if (s.semanticType) {
        semanticSurfaceCounts[s.semanticType] = (semanticSurfaceCounts[s.semanticType] ?? 0) + 1;
      }
    }
    for (const key of Object.keys(obj.attributes)) {
      attributeKeySet.add(key);
    }
  }

  // Compute global bbox
  let bbox: [number, number, number, number, number, number] | null = null;
  if (doc.metadata?.geographicalExtent) {
    bbox = doc.metadata.geographicalExtent;
  } else if (objects.length > 0) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const obj of objects) {
      if (obj.bbox[0] < minX) minX = obj.bbox[0];
      if (obj.bbox[1] < minY) minY = obj.bbox[1];
      if (obj.bbox[2] < minZ) minZ = obj.bbox[2];
      if (obj.bbox[3] > maxX) maxX = obj.bbox[3];
      if (obj.bbox[4] > maxY) maxY = obj.bbox[4];
      if (obj.bbox[5] > maxZ) maxZ = obj.bbox[5];
    }
    bbox = [minX, minY, minZ, maxX, maxY, maxZ];
  }

  return {
    version: doc.version ?? "unknown",
    referenceSystem: doc.metadata?.referenceSystem ?? null,
    objectCount: objects.length,
    objectTypeCounts,
    semanticSurfaceCounts,
    attributeKeys: [...attributeKeySet].sort(),
    vertexCount: doc.vertices.length,
    bbox,
    parseTimeMs,
  };
}

/* ================================================================== */
/*  §6  DOCUMENT VALIDATION                                           */
/* ================================================================== */

/** Validate a CityJSON document structure. Returns null if valid, error string otherwise. */
export function validateCityJSON(data: unknown): string | null {
  if (!data || typeof data !== "object") return "Input is not an object";
  const doc = data as Record<string, unknown>;
  if (doc.type !== "CityJSON") return `Expected type "CityJSON", got "${String(doc.type)}"`;
  if (typeof doc.version !== "string") return "Missing or invalid version field";
  if (!doc.CityObjects || typeof doc.CityObjects !== "object") return "Missing CityObjects field";
  if (!Array.isArray(doc.vertices)) return "Missing or invalid vertices array";
  return null;
}

/* ================================================================== */
/*  §7  MAIN LOADER                                                   */
/* ================================================================== */

const BATCH_SIZE = 100;

/** Yield to the event loop. */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Parse a CityJSON document string into renderable geometry.
 */
export async function loadCityJSON(
  json: string,
  onProgress?: CityJSONProgressCallback,
): Promise<CityJSONLoadResult> {
  const t0 = performance.now();

  onProgress?.("Parsing JSON", 0, 1);
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON: could not parse input");
  }

  const validationError = validateCityJSON(data);
  if (validationError) throw new Error(`Invalid CityJSON: ${validationError}`);

  const doc = data as CityJSONDocument;
  const scale = doc.transform?.scale ?? null;
  const translate = doc.transform?.translate ?? null;

  const entries = Object.entries(doc.CityObjects);
  const total = entries.length;
  const objects: ParsedCityObject[] = [];

  onProgress?.("Converting objects", 0, total);

  for (let i = 0; i < entries.length; i++) {
    const [id, raw] = entries[i];
    const parsed = parseCityObject(id, raw, doc.vertices, scale, translate);
    if (parsed) objects.push(parsed);

    if ((i + 1) % BATCH_SIZE === 0) {
      onProgress?.("Converting objects", i + 1, total);
      await yieldToMain();
    }
  }

  onProgress?.("Converting objects", total, total);

  const parseTimeMs = performance.now() - t0;
  const summary = buildSummary(doc, objects, parseTimeMs);

  onProgress?.("Complete", total, total);

  return { objects, summary };
}

/**
 * Synchronous variant for testing or worker contexts.
 */
export function loadCityJSONSync(json: string): CityJSONLoadResult {
  const t0 = performance.now();

  const data = JSON.parse(json) as unknown;
  const validationError = validateCityJSON(data);
  if (validationError) throw new Error(`Invalid CityJSON: ${validationError}`);

  const doc = data as CityJSONDocument;
  const scale = doc.transform?.scale ?? null;
  const translate = doc.transform?.translate ?? null;

  const entries = Object.entries(doc.CityObjects);
  const objects: ParsedCityObject[] = [];

  for (const [id, raw] of entries) {
    const parsed = parseCityObject(id, raw, doc.vertices, scale, translate);
    if (parsed) objects.push(parsed);
  }

  const parseTimeMs = performance.now() - t0;
  const summary = buildSummary(doc, objects, parseTimeMs);
  return { objects, summary };
}

/**
 * Load a CityJSON File object (from file input or drag-and-drop).
 */
export async function loadCityJSONFile(
  file: File,
  onProgress?: CityJSONProgressCallback,
): Promise<CityJSONLoadResult> {
  onProgress?.("Reading file", 0, file.size);
  const text = await file.text();
  onProgress?.("Reading file", file.size, file.size);
  return loadCityJSON(text, onProgress);
}
