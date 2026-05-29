export const MAP_LABEL_SPEC_VERSION = 1;
export const STYLE_LABEL_SPEC_KEY = "labelSpec";

export type MapLabelPlacement = "center" | "above" | "below" | "left" | "right" | "line";
export type MapLabelCollisionPolicy = "hide-on-overlap" | "priority-by-field" | "allow-overlap";

export interface MapLabelScaleRange {
  minZoom: number;
  maxZoom: number;
}

export interface SerializedMapLabelSpec {
  version: typeof MAP_LABEL_SPEC_VERSION;
  enabled: boolean;
  field: string;
  fontFamily: string;
  size: number;
  color: string;
  haloColor: string;
  haloWidth: number;
  placement: MapLabelPlacement;
  collisionPolicy: MapLabelCollisionPolicy;
  scaleRange: MapLabelScaleRange;
  updatedAt: string;
  priorityField?: string;
}

export interface MapLabelSpecInput {
  enabled: boolean;
  field?: string | null;
  fontFamily?: string | null;
  size?: number | null;
  color?: string | null;
  haloColor?: string | null;
  haloWidth?: number | null;
  placement?: MapLabelPlacement | null;
  collisionPolicy?: MapLabelCollisionPolicy | null;
  minZoom?: number | null;
  maxZoom?: number | null;
  priorityField?: string | null;
}

export interface MapLabelCollisionCandidate {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority?: number | null;
}

export interface MapLabelCollisionResult {
  policy: MapLabelCollisionPolicy;
  visible: MapLabelCollisionCandidate[];
  hidden: MapLabelCollisionCandidate[];
}

export interface MapLibreLabelLayerFragments {
  layout: Record<string, unknown>;
  paint: Record<string, unknown>;
  minzoom: number;
  maxzoom: number;
}

const DEFAULT_LABEL_FONT = "Open Sans Regular";
const DEFAULT_LABEL_COLOR = "rgb(249, 250, 251)";
const DEFAULT_LABEL_HALO_COLOR = "rgba(17,24,39,0.92)";
const DEFAULT_LABEL_SIZE = 11;
const DEFAULT_LABEL_HALO_WIDTH = 1.4;
const MAPLIBRE_MIN_ZOOM = 0;
const MAPLIBRE_MAX_ZOOM = 24;

const PLACEMENT_LAYOUT: Record<MapLabelPlacement, {
  anchor: string;
  offset: [number, number];
  symbolPlacement?: "point" | "line";
}> = {
  center: { anchor: "center", offset: [0, 0], symbolPlacement: "point" },
  above: { anchor: "bottom", offset: [0, -0.65], symbolPlacement: "point" },
  below: { anchor: "top", offset: [0, 0.65], symbolPlacement: "point" },
  left: { anchor: "right", offset: [-0.45, 0], symbolPlacement: "point" },
  right: { anchor: "left", offset: [0.45, 0], symbolPlacement: "point" },
  line: { anchor: "center", offset: [0, 0], symbolPlacement: "line" },
};

function finiteNumber(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalizeScaleRange(minZoom: number | null | undefined, maxZoom: number | null | undefined): MapLabelScaleRange {
  const min = clamp(finiteNumber(minZoom, 8), MAPLIBRE_MIN_ZOOM, MAPLIBRE_MAX_ZOOM);
  const max = clamp(finiteNumber(maxZoom, MAPLIBRE_MAX_ZOOM), MAPLIBRE_MIN_ZOOM, MAPLIBRE_MAX_ZOOM);
  if (max < min) {
    return { minZoom: max, maxZoom: min };
  }
  return { minZoom: min, maxZoom: max };
}

export function buildSerializedMapLabelSpec(
  input: MapLabelSpecInput,
  updatedAt = new Date().toISOString(),
): SerializedMapLabelSpec | null {
  const field = cleanText(input.field);
  if (!input.enabled || !field) return null;

  const collisionPolicy = input.collisionPolicy ?? "hide-on-overlap";
  const priorityField = collisionPolicy === "priority-by-field"
    ? cleanText(input.priorityField)
    : null;

  const spec: SerializedMapLabelSpec = {
    version: MAP_LABEL_SPEC_VERSION,
    enabled: true,
    field,
    fontFamily: cleanText(input.fontFamily) ?? DEFAULT_LABEL_FONT,
    size: clamp(finiteNumber(input.size, DEFAULT_LABEL_SIZE), 8, 28),
    color: cleanText(input.color) ?? DEFAULT_LABEL_COLOR,
    haloColor: cleanText(input.haloColor) ?? DEFAULT_LABEL_HALO_COLOR,
    haloWidth: clamp(finiteNumber(input.haloWidth, DEFAULT_LABEL_HALO_WIDTH), 0, 5),
    placement: input.placement ?? "above",
    collisionPolicy,
    scaleRange: normalizeScaleRange(input.minZoom, input.maxZoom),
    updatedAt,
  };
  if (priorityField) spec.priorityField = priorityField;
  return spec;
}

export function getSerializedMapLabelSpecFromStyle(
  style: Record<string, unknown> | undefined,
): SerializedMapLabelSpec | null {
  const candidate = style?.[STYLE_LABEL_SPEC_KEY];
  if (typeof candidate !== "object" || candidate === null) return null;
  const record = candidate as Partial<SerializedMapLabelSpec>;
  if (record.version !== MAP_LABEL_SPEC_VERSION) return null;
  if (record.enabled !== true || typeof record.field !== "string" || !record.field.trim()) return null;
  if (!record.scaleRange || typeof record.scaleRange !== "object") return null;
  return record as SerializedMapLabelSpec;
}

export function isLabelVisibleAtZoom(spec: SerializedMapLabelSpec, zoom: number): boolean {
  if (!Number.isFinite(zoom)) return false;
  return zoom >= spec.scaleRange.minZoom && zoom <= spec.scaleRange.maxZoom;
}

function overlaps(
  left: MapLabelCollisionCandidate,
  right: MapLabelCollisionCandidate,
  paddingPx: number,
): boolean {
  const leftMinX = left.x - paddingPx;
  const leftMaxX = left.x + left.width + paddingPx;
  const leftMinY = left.y - paddingPx;
  const leftMaxY = left.y + left.height + paddingPx;
  const rightMinX = right.x - paddingPx;
  const rightMaxX = right.x + right.width + paddingPx;
  const rightMinY = right.y - paddingPx;
  const rightMaxY = right.y + right.height + paddingPx;
  return leftMinX < rightMaxX && leftMaxX > rightMinX && leftMinY < rightMaxY && leftMaxY > rightMinY;
}

export function cullOverlappingLabelCandidates(
  candidates: readonly MapLabelCollisionCandidate[],
  policy: MapLabelCollisionPolicy,
  paddingPx = 2,
): MapLabelCollisionResult {
  const populated = candidates.filter((candidate) => candidate.text.trim().length > 0);
  if (policy === "allow-overlap") {
    return { policy, visible: [...populated], hidden: [] };
  }

  const ordered = populated
    .map((candidate, index) => ({ candidate, index }))
    .sort((left, right) => {
      if (policy !== "priority-by-field") return left.index - right.index;
      const leftPriority = finiteNumber(left.candidate.priority, 0);
      const rightPriority = finiteNumber(right.candidate.priority, 0);
      return rightPriority - leftPriority || left.index - right.index;
    });

  const visible: MapLabelCollisionCandidate[] = [];
  const hidden: MapLabelCollisionCandidate[] = [];
  for (const entry of ordered) {
    const collides = visible.some((accepted) => overlaps(accepted, entry.candidate, paddingPx));
    if (collides) {
      hidden.push(entry.candidate);
    } else {
      visible.push(entry.candidate);
    }
  }
  return { policy, visible, hidden };
}

export function buildMapLibreLabelFragments(spec: SerializedMapLabelSpec): MapLibreLabelLayerFragments {
  const placement = PLACEMENT_LAYOUT[spec.placement];
  const allowOverlap = spec.collisionPolicy === "allow-overlap";
  const layout: Record<string, unknown> = {
    "text-field": ["to-string", ["coalesce", ["get", spec.field], ""]],
    "text-size": spec.size,
    "text-font": [spec.fontFamily],
    "text-anchor": placement.anchor,
    "text-offset": placement.offset,
    "text-allow-overlap": allowOverlap,
    "text-ignore-placement": allowOverlap,
  };
  if (placement.symbolPlacement) layout["symbol-placement"] = placement.symbolPlacement;
  if (spec.collisionPolicy === "priority-by-field" && spec.priorityField) {
    layout["symbol-sort-key"] = ["*", -1, ["to-number", ["coalesce", ["get", spec.priorityField], 0], 0]];
  }
  return {
    layout,
    paint: {
      "text-color": spec.color,
      "text-halo-color": spec.haloColor,
      "text-halo-width": spec.haloWidth,
    },
    minzoom: spec.scaleRange.minZoom,
    maxzoom: spec.scaleRange.maxZoom,
  };
}
