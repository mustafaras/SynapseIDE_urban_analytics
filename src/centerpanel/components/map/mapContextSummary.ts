/* ================================================================== */
/*  Map Explorer Context Summary                                       */
/*                                                                     */
/*  Lightweight, ID-only spatial context Map Explorer publishes to     */
/*  Urban Analytics, Synapse IDE, and any future cross-module          */
/*  consumer. Never carries GeoJSON, maplibre instances, or raw        */
/*  feature payloads.                                                  */
/*                                                                     */
/*  Tri-modal sync rule: large geometries and raw datasets must stay   */
/*  in the map store and services, not flow through context payloads. */
/* ================================================================== */

import type {
  BaseLayerId,
  DrawnFeature,
  LayerQaStatus,
  MapLayerRegistryLayerSummary,
  OverlayLayerConfig,
} from "./mapTypes";
import {
  normalizeLayerRegistryMetadata,
  resolveOverlayLayerCrs as resolveNormalizedOverlayLayerCrs,
  resolveOverlayLayerQueryable as resolveNormalizedOverlayLayerQueryable,
} from "./mapLayerMetadata";
import type {
  MapScientificQAIssueSeverity,
  MapScientificQAState,
} from "../../../services/map/MapScientificQA";
import type { MapExplorerState } from "../../../stores/useMapExplorerStore";

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface MapExplorerViewportSummary {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  baseLayerId: BaseLayerId;
}

export type MapExplorerAoiGeometryFamily =
  | "polygon"
  | "multipolygon"
  | "linestring"
  | "multilinestring"
  | "point"
  | "multipoint"
  | "geometrycollection"
  | "other";

export interface MapExplorerAoiReference {
  aoiId: string;
  geometryFamily: MapExplorerAoiGeometryFamily;
  bbox?: [number, number, number, number];
}

export interface MapExplorerLayerSelectionCount {
  layerId: string;
  count: number;
}

export interface MapExplorerSelectionSummary {
  totalSelectedFeatures: number;
  layerCounts: readonly MapExplorerLayerSelectionCount[];
}

export interface MapExplorerQAStatusSummary {
  status: LayerQaStatus;
  checkedAt: string | null;
  layerCount: number;
  blockedLayerCount: number;
  issueCounts: Record<MapScientificQAIssueSeverity, number>;
}

export interface MapExplorerContextSummary {
  contextId: string;
  updatedAt: string;
  viewport: MapExplorerViewportSummary;
  currentBounds: [number, number, number, number] | null;
  currentBoundsUpdatedAt: string | null;
  activeAoi: MapExplorerAoiReference | null;
  visibleLayerIds: readonly string[];
  selectedLayerIds: readonly string[];
  activeAnalysisResultLayerIds: readonly string[];
  selection: MapExplorerSelectionSummary;
  qa: MapExplorerQAStatusSummary;
}

/**
 * Explicit subset of `MapExplorerState` consumed by the builder.
 * Keeps the builder testable without constructing the full store.
 */
export interface MapExplorerContextSummaryInput {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  activeBaseLayer: BaseLayerId;
  overlayLayers: readonly OverlayLayerConfig[];
  drawnFeatures: readonly DrawnFeature[];
  activeAoiId: string | undefined;
  selectedFeatureIds: Readonly<Record<string, readonly string[]>>;
  activeAnalysisResultLayerIds: readonly string[];
  scientificQA: MapScientificQAState | null;
  currentMapBounds: [number, number, number, number] | null;
  currentMapBoundsUpdatedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Layer summarizer (single source of truth)                          */
/*                                                                     */
/*  Used both by `MAP_LAYER_REGISTRY_EVENT` payloads in the store and  */
/*  by context summary selectors. Centralised here so the two surfaces */
/*  cannot drift apart.                                                */
/* ------------------------------------------------------------------ */

export function resolveOverlayLayerCrs(layer: OverlayLayerConfig): string | undefined {
  return resolveNormalizedOverlayLayerCrs(layer);
}

export function resolveOverlayLayerQueryable(layer: OverlayLayerConfig): boolean {
  return resolveNormalizedOverlayLayerQueryable(layer);
}

export function summarizeOverlayLayer(layer: OverlayLayerConfig): MapLayerRegistryLayerSummary {
  const registry = normalizeLayerRegistryMetadata(layer);
  const crs = registry.crsSummary.crs;
  const featureCount = registry.featureCount;
  const { license, attribution } = registry.licenseAttribution;

  return {
    layerId: layer.id,
    name: layer.name,
    layerType: layer.type,
    group: layer.group ?? "data",
    visible: layer.visible,
    opacity: layer.opacity,
    queryable: registry.queryable,
    sourceKind: registry.sourceKind,
    qaStatus: registry.qaStatus,
    crsStatus: registry.crsSummary.status,
    geometryType: registry.geometrySummary.geometryType,
    schemaFieldCount: registry.schemaSummary.fieldCount,
    publicationReadiness: registry.publicationReadiness.status,
    metadataReady: registry.readiness.metadataReady,
    provenanceLabel: registry.provenance.label,
    ...(crs ? { crs } : {}),
    ...(featureCount != null ? { featureCount } : {}),
    ...(license ? { license } : {}),
    ...(attribution ? { attribution } : {}),
    ...(registry.evidenceArtifactId ? { evidenceArtifactId: registry.evidenceArtifactId } : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  Context summary builder                                            */
/* ------------------------------------------------------------------ */

const EMPTY_ISSUE_COUNTS: Record<MapScientificQAIssueSeverity, number> = {
  info: 0,
  warning: 0,
  error: 0,
  blocker: 0,
};

const EPOCH = "1970-01-01T00:00:00.000Z";

function resolveAoiGeometryFamily(geometry: DrawnFeature["geometry"]): MapExplorerAoiGeometryFamily {
  switch (geometry.type) {
    case "Polygon": return "polygon";
    case "MultiPolygon": return "multipolygon";
    case "LineString": return "linestring";
    case "MultiLineString": return "multilinestring";
    case "Point": return "point";
    case "MultiPoint": return "multipoint";
    case "GeometryCollection": return "geometrycollection";
    default: return "other";
  }
}

function isAoiCandidate(feature: DrawnFeature): boolean {
  return feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon";
}

function computeAoiBbox(geometry: DrawnFeature["geometry"]): [number, number, number, number] | undefined {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let touched = false;

  const visit = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const x = coords[0];
      const y = coords[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      touched = true;
      return;
    }
    for (const child of coords) {
      visit(child);
    }
  };

  if ("coordinates" in geometry) {
    visit(geometry.coordinates);
  }

  return touched ? [minX, minY, maxX, maxY] : undefined;
}

function resolveActiveAoi(
  drawnFeatures: readonly DrawnFeature[],
  activeAoiId: string | undefined,
): MapExplorerAoiReference | null {
  const preferred = activeAoiId
    ? drawnFeatures.find((feature) => feature.id === activeAoiId && isAoiCandidate(feature))
    : undefined;
  const aoi = preferred ?? drawnFeatures.find(isAoiCandidate);
  if (!aoi) return null;
  const bbox = computeAoiBbox(aoi.geometry);
  return {
    aoiId: aoi.id,
    geometryFamily: resolveAoiGeometryFamily(aoi.geometry),
    ...(bbox ? { bbox } : {}),
  };
}

function summarizeSelection(
  selectedFeatureIds: Readonly<Record<string, readonly string[]>>,
): MapExplorerSelectionSummary {
  const layerCounts: MapExplorerLayerSelectionCount[] = [];
  let total = 0;
  for (const layerId of Object.keys(selectedFeatureIds).sort()) {
    const ids = selectedFeatureIds[layerId];
    if (!ids || ids.length === 0) continue;
    layerCounts.push({ layerId, count: ids.length });
    total += ids.length;
  }
  return { totalSelectedFeatures: total, layerCounts };
}

function summarizeQA(qa: MapScientificQAState | null): MapExplorerQAStatusSummary {
  if (!qa) {
    return {
      status: "unchecked",
      checkedAt: null,
      layerCount: 0,
      blockedLayerCount: 0,
      issueCounts: { ...EMPTY_ISSUE_COUNTS },
    };
  }
  const blockedLayerCount = qa.layerSummaries.filter((summary) => summary.status === "error").length;
  return {
    status: qa.status,
    checkedAt: qa.checkedAt,
    layerCount: qa.layerSummaries.length,
    blockedLayerCount,
    issueCounts: { ...EMPTY_ISSUE_COUNTS, ...qa.metadata.issueCounts },
  };
}

function roundFloat(value: number, decimals = 5): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildContextSignature(summary: Omit<MapExplorerContextSummary, "contextId" | "updatedAt">): string {
  const parts: string[] = [
    `c=${roundFloat(summary.viewport.center[0])},${roundFloat(summary.viewport.center[1])}`,
    `z=${roundFloat(summary.viewport.zoom, 3)}`,
    `b=${roundFloat(summary.viewport.bearing, 2)}`,
    `p=${roundFloat(summary.viewport.pitch, 2)}`,
    `bl=${summary.viewport.baseLayerId}`,
    `bx=${summary.currentBounds ? summary.currentBounds.map((v) => roundFloat(v)).join(",") : "-"}`,
    `bxu=${summary.currentBoundsUpdatedAt ?? "-"}`,
    `aoi=${summary.activeAoi ? `${summary.activeAoi.aoiId}:${summary.activeAoi.geometryFamily}` : "-"}`,
    `vis=${[...summary.visibleLayerIds].sort().join("|")}`,
    `sel=${[...summary.selectedLayerIds].sort().join("|")}`,
    `arl=${[...summary.activeAnalysisResultLayerIds].sort().join("|")}`,
    `selc=${summary.selection.totalSelectedFeatures}:${summary.selection.layerCounts.map((c) => `${c.layerId}=${c.count}`).join(",")}`,
    `qa=${summary.qa.status}/${summary.qa.checkedAt ?? "-"}/${summary.qa.layerCount}/${summary.qa.blockedLayerCount}/${summary.qa.issueCounts.info}-${summary.qa.issueCounts.warning}-${summary.qa.issueCounts.error}-${summary.qa.issueCounts.blocker}`,
  ];
  return fnv1aHex(parts.join("§"));
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function resolveUpdatedAt(input: MapExplorerContextSummaryInput): string {
  const candidates = [
    input.currentMapBoundsUpdatedAt,
    input.scientificQA?.checkedAt,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
  if (candidates.length === 0) return EPOCH;
  return candidates.reduce((latest, current) => (current > latest ? current : latest), candidates[0]);
}

/**
 * Build a deterministic, lightweight context summary from the provided
 * map state slice. Pure: same input → identical output (including
 * `contextId`).
 */
export function buildMapExplorerContextSummary(
  input: MapExplorerContextSummaryInput,
): MapExplorerContextSummary {
  const visibleLayerIds = input.overlayLayers
    .filter((layer) => layer.visible)
    .map((layer) => layer.id);
  const selectedLayerIds = input.overlayLayers.map((layer) => layer.id);
  const activeAoi = resolveActiveAoi(input.drawnFeatures, input.activeAoiId);
  const selection = summarizeSelection(input.selectedFeatureIds);
  const qa = summarizeQA(input.scientificQA);

  const partial: Omit<MapExplorerContextSummary, "contextId" | "updatedAt"> = {
    viewport: {
      center: [input.center[0], input.center[1]],
      zoom: input.zoom,
      bearing: input.bearing,
      pitch: input.pitch,
      baseLayerId: input.activeBaseLayer,
    },
    currentBounds: input.currentMapBounds,
    currentBoundsUpdatedAt: input.currentMapBoundsUpdatedAt,
    activeAoi,
    visibleLayerIds,
    selectedLayerIds,
    activeAnalysisResultLayerIds: [...input.activeAnalysisResultLayerIds],
    selection,
    qa,
  };

  return {
    contextId: buildContextSignature(partial),
    updatedAt: resolveUpdatedAt(input),
    ...partial,
  };
}

/* ------------------------------------------------------------------ */
/*  Selectors                                                          */
/*                                                                     */
/*  Memoized by `contextId` so consumers using `useMapExplorerStore`   */
/*  with these selectors get a stable reference until content changes. */
/* ------------------------------------------------------------------ */

let cachedContextSummary: MapExplorerContextSummary | null = null;

function projectStateToInput(state: MapExplorerState): MapExplorerContextSummaryInput {
  return {
    center: state.center,
    zoom: state.zoom,
    bearing: state.bearing,
    pitch: state.pitch,
    activeBaseLayer: state.activeBaseLayer,
    overlayLayers: state.overlayLayers,
    drawnFeatures: state.drawnFeatures,
    activeAoiId: state.activeAoiId,
    selectedFeatureIds: state.selectedFeatureIds,
    activeAnalysisResultLayerIds: state.activeAnalysisResultLayerIds,
    scientificQA: state.scientificQA,
    currentMapBounds: state.currentMapBounds,
    currentMapBoundsUpdatedAt: state.currentMapBoundsUpdatedAt,
  };
}

export function selectMapExplorerContextSummary(state: MapExplorerState): MapExplorerContextSummary {
  const next = buildMapExplorerContextSummary(projectStateToInput(state));
  if (cachedContextSummary && cachedContextSummary.contextId === next.contextId) {
    return cachedContextSummary;
  }
  cachedContextSummary = next;
  return next;
}

/** Test-only hook: reset memoization between cases. */
export function _resetMapContextSummaryCacheForTests(): void {
  cachedContextSummary = null;
}

export function selectMapExplorerLayerSummaries(state: MapExplorerState): MapLayerRegistryLayerSummary[] {
  return state.overlayLayers.map(summarizeOverlayLayer);
}

export function selectMapExplorerVisibleLayerSummaries(state: MapExplorerState): MapLayerRegistryLayerSummary[] {
  const summaries: MapLayerRegistryLayerSummary[] = [];
  for (const layer of state.overlayLayers) {
    if (layer.visible) summaries.push(summarizeOverlayLayer(layer));
  }
  return summaries;
}
