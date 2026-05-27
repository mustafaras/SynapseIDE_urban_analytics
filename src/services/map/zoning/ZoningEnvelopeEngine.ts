/**
 * ZoningEnvelopeEngine — deterministic buildable-area + zoning-envelope geometry.
 *
 * Setbacks are computed in projected CRS (metres). Geographic CRS is blocked.
 *
 * Algorithm: shrink each parcel polygon ring inward by `minSetbackMetres` using
 * a simple negative-buffer (Sutherland-Hodgman inset via per-edge offset), then
 * compute the area of the resulting inset polygon. When the inset collapses
 * (setback ≥ effective width/height) the buildable area is 0 with a caveat.
 *
 * This is a deterministic, no-dependency implementation. For large-scale
 * production use the geos-wasm backend (Prompt 13) can replace the inner loop.
 */
import type { Feature, Polygon, Position } from "geojson";
import type { CrsPreflightResult } from "@/services/map/contracts/gisContracts";
import { CrsPreflight } from "@/services/map/crs/CrsPreflight";
import { shoelaceRingArea } from "./ZoningRuleEngine";
import type { ZoningRule } from "./ZoningRuleEngine";

/* ------------------------------------------------------------------ */
/*  Public types                                                        */
/* ------------------------------------------------------------------ */

export interface ZoningEnvelopeInput {
  parcel: Feature<Polygon>;
  rule: ZoningRule;
  /** Declared CRS of the parcel data, e.g. "EPSG:32635". */
  declaredCrs: string | null;
}

export interface ZoningEnvelopeResult {
  /** Inset polygon representing the buildable area (null when collapsed or CRS blocked). */
  envelopeGeometry: Feature<Polygon> | null;
  buildableAreaM2: number;
  /** Parcel area before setbacks. */
  parcelAreaM2: number;
  /** Setback used in metres. */
  setbackMetres: number;
  /** Max floor area under the rule over the buildable footprint. */
  capacityMaxFloorAreaM2: number;
  /** True when the setback collapses the polygon to zero area. */
  collapsed: boolean;
  crsResult: CrsPreflightResult;
  caveats: string[];
}

/* ------------------------------------------------------------------ */
/*  Internal geometry helpers                                           */
/* ------------------------------------------------------------------ */

/** Normalise a ring to counter-clockwise winding (positive area via shoelace). */
function normaliseWinding(ring: Position[]): Position[] {
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % n]!;
    area += (x1 * y2) - (x2 * y1);
  }
  // If clockwise (negative signed area), reverse
  return area < 0 ? [...ring].reverse() : ring;
}

/**
 * Inset a single closed ring by `d` metres along each edge normal.
 *
 * Returns the inset ring vertices. Collapses to empty array when the inset
 * eliminates all area (very narrow parcels or large setbacks).
 *
 * Algorithm: for each edge compute the inward-facing unit normal, shift both
 * endpoints by d along that normal (offset lines), then intersect adjacent
 * offset lines to find the new vertex. Skips the closing duplicate point.
 */
export function insetRing(ring: Position[], d: number): Position[] {
  // Ensure CCW winding for consistent inward normals
  const pts = normaliseWinding(ring);
  // Remove the closing duplicate if present
  const closed =
    pts.length > 1 &&
    pts[0]![0] === pts[pts.length - 1]![0] &&
    pts[0]![1] === pts[pts.length - 1]![1];
  const verts = closed ? pts.slice(0, -1) : pts;
  const n = verts.length;
  if (n < 3) return [];

  // For each edge, compute the offset line (moved inward by d) + store the inward normal
  const offsets: Array<{ p: Position; q: Position; nx: number; ny: number }> = [];
  for (let i = 0; i < n; i++) {
    const a = verts[i]!;
    const b = verts[(i + 1) % n]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-10) {
      offsets.push({ p: [a[0], a[1]], q: [b[0], b[1]], nx: 0, ny: 0 });
      continue;
    }
    // Inward unit normal for a CCW ring: rotate edge direction 90° CCW → (-dy, dx)
    const nx = -dy / len;
    const ny = dx / len;
    offsets.push({
      p: [a[0] + nx * d, a[1] + ny * d],
      q: [b[0] + nx * d, b[1] + ny * d],
      nx,
      ny,
    });
  }

  // Intersect consecutive offset lines to get new vertices
  const result: Position[] = [];
  for (let i = 0; i < n; i++) {
    const e1 = offsets[i]!;
    const e2 = offsets[(i + 1) % n]!;
    const pt = lineIntersect(e1.p, e1.q, e2.p, e2.q);
    if (pt === null) {
      // Parallel edges — use the midpoint of the shared endpoint pair
      result.push([(e1.q[0] + e2.p[0]) / 2, (e1.q[1] + e2.p[1]) / 2]);
    } else {
      result.push(pt);
    }
  }

  if (result.length < 3) return [];

  // Validate: each result vertex must lie on the inward side of every offset line.
  // When opposite-edge setbacks overlap (d > inradius), some vertices end up on the
  // outward side — that means the polygon has self-inverted and should be treated as collapsed.
  const COLLAPSE_TOL = d * 0.01 + 1e-6;
  for (const v of result) {
    for (const off of offsets) {
      // Signed distance from v to offset line (positive = inward side)
      const sdist = (v[0] - off.p[0]) * off.nx + (v[1] - off.p[1]) * off.ny;
      if (sdist < -COLLAPSE_TOL) return [];
    }
  }

  // Validate: inset area must be positive (per-vertex check above handles the collapse)
  const insetArea = shoelaceRingArea(result);
  if (insetArea < 1e-6) return [];

  // Close the ring
  result.push([...result[0]!]);
  return result;
}

/** Line-line intersection of infinite lines through (p1→p2) and (p3→p4). Returns null for parallel. */
function lineIntersect(
  p1: Position,
  p2: Position,
  p3: Position,
  p4: Position,
): Position | null {
  const d1x = p2[0] - p1[0];
  const d1y = p2[1] - p1[1];
  const d2x = p4[0] - p3[0];
  const d2y = p4[1] - p3[1];
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null;
  const dx = p3[0] - p1[0];
  const dy = p3[1] - p1[1];
  const t = (dx * d2y - dy * d2x) / denom;
  return [p1[0] + t * d1x, p1[1] + t * d1y];
}

/* ------------------------------------------------------------------ */
/*  CRS preflight operation                                             */
/* ------------------------------------------------------------------ */

const ENVELOPE_OP = {
  id: "zoning-envelope",
  label: "Zoning envelope computation (setback inset)",
  metric: "area" as const,
  executionKind: "planar" as const,
};

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Compute the buildable-area envelope for a parcel under a zoning rule.
 *
 * Steps:
 *  1. CRS-gate — block geographic / missing CRS (no silent degree-math).
 *  2. Inset the parcel outer ring by `rule.minSetbackMetres`.
 *  3. Compute buildable area from the inset polygon.
 *  4. Derive capacity: maxFAR × buildableAreaM2.
 */
export function computeZoningEnvelope(input: ZoningEnvelopeInput): ZoningEnvelopeResult {
  const { parcel, rule, declaredCrs } = input;
  const parcelId = parcel.id ?? parcel.properties?.id ?? "unknown";

  const crsResult = CrsPreflight.preflight(
    ENVELOPE_OP,
    [{ id: String(parcelId), crs: declaredCrs }],
  );

  const caveats: string[] = [...crsResult.caveats];

  if (crsResult.blocked) {
    caveats.unshift(
      crsResult.reason ??
        "Zoning envelope requires a projected CRS — declare or reproject the parcel layer.",
    );
    return {
      envelopeGeometry: null,
      buildableAreaM2: 0,
      parcelAreaM2: 0,
      setbackMetres: rule.minSetbackMetres,
      capacityMaxFloorAreaM2: 0,
      collapsed: false,
      crsResult,
      caveats,
    };
  }

  const outerRing = parcel.geometry.coordinates[0];
  if (!outerRing || outerRing.length < 4) {
    caveats.push("Parcel ring has fewer than 3 vertices — cannot compute envelope.");
    return {
      envelopeGeometry: null,
      buildableAreaM2: 0,
      parcelAreaM2: 0,
      setbackMetres: rule.minSetbackMetres,
      capacityMaxFloorAreaM2: 0,
      collapsed: true,
      crsResult,
      caveats,
    };
  }

  const parcelAreaM2 = shoelaceRingArea(outerRing);
  const setback = rule.minSetbackMetres;

  const insetRingCoords = insetRing(outerRing, setback);
  const collapsed = insetRingCoords.length < 4;

  if (collapsed) {
    caveats.push(
      `Setback of ${setback} m collapses the parcel — no buildable area remains.`,
    );
  }

  const buildableAreaM2 = collapsed ? 0 : shoelaceRingArea(insetRingCoords.slice(0, -1));
  const capacityMaxFloorAreaM2 = buildableAreaM2 * rule.maxFAR;

  const envelopeGeometry: Feature<Polygon> | null = collapsed
    ? null
    : {
        type: "Feature",
        id: `envelope-${String(parcelId)}`,
        geometry: {
          type: "Polygon",
          coordinates: [insetRingCoords],
        },
        properties: {
          parcelId: String(parcelId),
          ruleId: rule.id,
          zoneCode: rule.zoneCode,
          setbackMetres: setback,
          buildableAreaM2,
          capacityMaxFloorAreaM2,
        },
      };

  return {
    envelopeGeometry,
    buildableAreaM2,
    parcelAreaM2,
    setbackMetres: setback,
    capacityMaxFloorAreaM2,
    collapsed,
    crsResult,
    caveats,
  };
}

/**
 * Batch-compute zoning envelopes for multiple parcels.
 * All parcels share the same declared CRS and rule.
 */
export function computeZoningEnvelopeBatch(
  parcels: Feature<Polygon>[],
  rule: ZoningRule,
  declaredCrs: string | null,
): ZoningEnvelopeResult[] {
  return parcels.map((parcel) => computeZoningEnvelope({ parcel, rule, declaredCrs }));
}

export const ZoningEnvelopeEngine = {
  computeZoningEnvelope,
  computeZoningEnvelopeBatch,
  insetRing,
} as const;
