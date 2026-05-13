/**
 * VoxCity cross-view selection bus.
 *
 * Lets the 2D Map Explorer footprint overlay and the 3D VoxCity viewer
 * publish "I just selected building X" events to each other without
 * importing each other's components directly. The Zustand store also
 * exposes the current selection so listeners that mount after an event
 * still pick up the latest state.
 */

import { create } from "zustand";

import type {
  MapVoxCityBuildingReference,
  MapVoxCityProjectionMode,
  MapVoxCityRuntimeMode,
  MapVoxCitySourceKind,
  MapVoxCitySyncHandoffMetadata,
  MapVoxCitySyncMetadata,
  MapVoxCitySourceReference,
  MapVoxCityVoxelReference,
  ViewportState,
} from "@/centerpanel/components/map/mapTypes";
import {
  DEFAULT_VOXCITY_GEO_ANCHOR,
  type VoxCityGeoAnchor,
  type VoxCityProjectionMode,
} from "./voxCityProjection";

export type VoxCitySelectionSource = "map-2d" | "voxcity-3d";

const MAX_SYNC_REFERENCE_COUNT = 80;
const MAP_DISPLAY_CRS = "EPSG:4326" as const;

export interface VoxCitySelectionEvent {
  /** Stable string identifier for the building (matches BuildingFeature.id). */
  buildingId: string;
  /** Which view originated the selection. */
  source: VoxCitySelectionSource;
  /** Optional human label (defaults to buildingId in consumers). */
  label?: string;
  /** Geographic point [lon, lat] for centring the other view, when known. */
  coordinate?: [number, number];
  /** Monotonically increasing event id — useful for de-dup. */
  id: number;
  /** ISO timestamp the event was emitted at. */
  emittedAt: string;
}

export interface VoxCitySyncSourceInput {
  id: string;
  title: string;
  kind: MapVoxCitySourceKind;
  runtimeMode: MapVoxCityRuntimeMode;
  provider: string;
  sourceRef: string;
  sourceLayerId?: string;
  sourceUpdatedAt?: string | null;
  sourceUrl?: string | null;
  crs?: string | null;
  featureCount: number;
  bbox: [number, number, number, number] | null;
  geometryAssumptions: readonly string[];
}

export interface VoxCitySyncProjectionInput {
  mode?: VoxCityProjectionMode | MapVoxCityProjectionMode;
  sourceCrs?: string | null;
  targetCrs?: typeof MAP_DISPLAY_CRS;
  anchor?: VoxCityGeoAnchor | null;
  assumptions?: readonly string[];
}

export interface BuildMapVoxCitySyncMetadataInput {
  syncId?: string;
  createdAt?: string;
  sourceView?: VoxCitySelectionSource;
  targetView?: VoxCitySelectionSource;
  mapLayerId?: string | null;
  outputLayerId?: string | null;
  selectedFeatureIds?: readonly string[];
  selectedBuildingIds?: readonly string[];
  buildingReferences?: readonly Omit<MapVoxCityBuildingReference, "selected">[];
  voxelReferences?: readonly MapVoxCityVoxelReference[];
  source: VoxCitySyncSourceInput;
  projection?: VoxCitySyncProjectionInput;
  selectionEvent?: VoxCitySelectionEvent | null;
  viewport?: ViewportState | null;
  aoiId?: string | null;
  scenarioId?: string | null;
  linkedRunId?: string | null;
  linkedArtifactIds?: readonly string[];
  handoff?: Partial<MapVoxCitySyncHandoffMetadata>;
}

interface SelectionStoreState {
  selected: VoxCitySelectionEvent | null;
  /** Clear the active selection. */
  clear: () => void;
}

const listeners = new Set<(event: VoxCitySelectionEvent | null) => void>();
let nextEventId = 1;

function nowIso(): string {
  return new Date().toISOString();
}

function safeReferencePart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96) || "ref";
}

function compactText(value: unknown, maxLength = 180): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

function uniqueIds(values: readonly unknown[] | undefined, limit = MAX_SYNC_REFERENCE_COUNT): string[] {
  if (!values) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const id = compactText(value);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= limit) break;
  }
  return ids;
}

function uniqueNotes(values: readonly unknown[] | undefined, limit = 16): string[] {
  if (!values) return [];
  const notes: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const note = compactText(value, 400);
    if (!note || seen.has(note)) continue;
    seen.add(note);
    notes.push(note);
    if (notes.length >= limit) break;
  }
  return notes;
}

function normalizeSourceReference(source: VoxCitySyncSourceInput): MapVoxCitySourceReference {
  const reference: MapVoxCitySourceReference = {
    id: compactText(source.id) ?? "voxcity-source",
    title: compactText(source.title) ?? "VoxCity source",
    kind: source.kind,
    runtimeMode: source.runtimeMode,
    provider: compactText(source.provider) ?? "VoxCity",
    sourceRef: compactText(source.sourceRef) ?? source.id,
    crs: compactText(source.crs) ?? null,
    featureCount: Number.isFinite(source.featureCount) ? Math.max(0, Math.floor(source.featureCount)) : 0,
    bbox: source.bbox,
  };
  const sourceLayerId = compactText(source.sourceLayerId);
  const sourceUpdatedAt = compactText(source.sourceUpdatedAt);
  const sourceUrl = compactText(source.sourceUrl);
  if (sourceLayerId) reference.sourceLayerId = sourceLayerId;
  if (sourceUpdatedAt) reference.sourceUpdatedAt = sourceUpdatedAt;
  if (sourceUrl) reference.sourceUrl = sourceUrl;
  return reference;
}

function inferProjectionMode(
  source: MapVoxCitySourceReference,
  explicitMode: VoxCitySyncProjectionInput["mode"] | undefined,
): MapVoxCityProjectionMode {
  if (explicitMode === "anchored" || explicitMode === "passthrough" || explicitMode === "unknown") {
    return explicitMode;
  }
  if (source.kind === "sample" || source.runtimeMode === "sample") return "anchored";
  if (source.crs?.toUpperCase().includes("4326")) return "passthrough";
  return "unknown";
}

function buildProjectionReference(
  source: MapVoxCitySourceReference,
  projection: VoxCitySyncProjectionInput | undefined,
): MapVoxCitySyncMetadata["projection"] {
  const mode = inferProjectionMode(source, projection?.mode);
  const sourceCrs = compactText(projection?.sourceCrs) ?? source.crs;
  const anchor = projection?.anchor ?? (mode === "anchored" ? DEFAULT_VOXCITY_GEO_ANCHOR : null);
  const assumptions = uniqueNotes([
    ...(projection?.assumptions ?? []),
    ...(mode === "anchored"
      ? [`Local VoxCity coordinates are anchored near ${DEFAULT_VOXCITY_GEO_ANCHOR.longitude}, ${DEFAULT_VOXCITY_GEO_ANCHOR.latitude}; use as an approximate display reference, not a surveyed CRS transform.`]
      : []),
    ...(mode === "unknown"
      ? ["Source CRS or 2D/3D transform is not fully declared; verify projection assumptions before analytical interpretation."]
      : []),
  ]);

  const reference: MapVoxCitySyncMetadata["projection"] = {
    mode,
    sourceCrs,
    targetCrs: projection?.targetCrs ?? MAP_DISPLAY_CRS,
    assumptions,
  };
  if (anchor) {
    reference.anchor = {
      longitude: anchor.longitude,
      latitude: anchor.latitude,
    };
  }
  return reference;
}

function normalizeBuildingReferences(
  inputReferences: readonly Omit<MapVoxCityBuildingReference, "selected">[] | undefined,
  selectedBuildingIds: readonly string[],
  selectionEvent: VoxCitySelectionEvent | null | undefined,
): MapVoxCityBuildingReference[] {
  const selectedSet = new Set(selectedBuildingIds);
  const references: MapVoxCityBuildingReference[] = [];
  const seen = new Set<string>();

  for (const reference of inputReferences ?? []) {
    const buildingId = compactText(reference.buildingId);
    if (!buildingId || seen.has(buildingId)) continue;
    seen.add(buildingId);
    const entry: MapVoxCityBuildingReference = {
      buildingId,
      selected: selectedSet.has(buildingId),
    };
    const sourceFeatureId = compactText(reference.sourceFeatureId);
    const label = compactText(reference.label);
    if (sourceFeatureId) entry.sourceFeatureId = sourceFeatureId;
    if (label) entry.label = label;
    if (reference.coordinate) entry.coordinate = [...reference.coordinate];
    references.push(entry);
    if (references.length >= MAX_SYNC_REFERENCE_COUNT) break;
  }

  const eventBuildingId = compactText(selectionEvent?.buildingId);
  if (eventBuildingId && !seen.has(eventBuildingId) && references.length < MAX_SYNC_REFERENCE_COUNT) {
    const entry: MapVoxCityBuildingReference = {
      buildingId: eventBuildingId,
      selected: true,
    };
    const label = compactText(selectionEvent?.label);
    if (label) entry.label = label;
    if (selectionEvent?.coordinate) entry.coordinate = [...selectionEvent.coordinate];
    references.push(entry);
  }

  return references;
}

function normalizeVoxelReferences(
  voxelReferences: readonly MapVoxCityVoxelReference[] | undefined,
): MapVoxCityVoxelReference[] {
  const references: MapVoxCityVoxelReference[] = [];
  const seen = new Set<string>();
  for (const reference of voxelReferences ?? []) {
    const voxelId = compactText(reference.voxelId);
    if (!voxelId || seen.has(voxelId)) continue;
    seen.add(voxelId);
    const entry: MapVoxCityVoxelReference = { voxelId };
    const buildingId = compactText(reference.buildingId);
    const gridId = compactText(reference.gridId);
    const label = compactText(reference.label);
    if (buildingId) entry.buildingId = buildingId;
    if (gridId) entry.gridId = gridId;
    if (label) entry.label = label;
    references.push(entry);
    if (references.length >= MAX_SYNC_REFERENCE_COUNT) break;
  }
  return references;
}

function buildDefaultHandoff(syncId: string, handoff: Partial<MapVoxCitySyncHandoffMetadata> | undefined): MapVoxCitySyncHandoffMetadata {
  const idPart = safeReferencePart(syncId);
  return {
    reportHandoffId: compactText(handoff?.reportHandoffId) ?? `voxcity-report-${idPart}`,
    dashboardBindingId: compactText(handoff?.dashboardBindingId) ?? `voxcity-dashboard-${idPart}`,
    ideArtifactId: compactText(handoff?.ideArtifactId) ?? `voxcity-ide-${idPart}`,
    reportCompatible: handoff?.reportCompatible ?? true,
    dashboardCompatible: handoff?.dashboardCompatible ?? true,
    ideCompatible: handoff?.ideCompatible ?? true,
    refreshMode: "static-reference",
  };
}

function resolveQa(params: {
  source: MapVoxCitySourceReference;
  projection: MapVoxCitySyncMetadata["projection"];
  hasMapLayerId: boolean;
  geometryAssumptions: readonly string[];
}): MapVoxCitySyncMetadata["qa"] {
  const sampleData = params.source.runtimeMode === "sample" || params.source.kind === "sample";
  const projectionStatus = params.projection.mode === "passthrough"
    ? "known"
    : params.projection.mode === "anchored"
      ? "assumed"
      : "unknown";
  const caveats = uniqueNotes([
    ...params.geometryAssumptions,
    ...params.projection.assumptions,
    ...(sampleData
      ? ["Sample/demo source is active; keep 2D/3D outputs labelled as exploratory until project geometry replaces it."]
      : []),
    ...(!params.hasMapLayerId
      ? ["No source map layer id is available for this VoxCity source; reference the output layer and source id instead."]
      : []),
  ]);
  const uncertaintyNotes = uniqueNotes([
    "2D/3D visual alignment depends on stable feature identifiers and projection assumptions.",
    ...(projectionStatus === "unknown"
      ? ["Projection transform is not fully declared, so spatial interpretation must remain qualified."]
      : []),
  ]);

  return {
    state: sampleData || projectionStatus !== "known" || caveats.length > 0 ? "warning" : "passed",
    sampleData,
    projectionStatus,
    caveats,
    uncertaintyNotes,
  };
}

export function buildMapVoxCitySyncMetadata(
  input: BuildMapVoxCitySyncMetadataInput,
): MapVoxCitySyncMetadata {
  const createdAt = input.createdAt ?? nowIso();
  const source = normalizeSourceReference(input.source);
  const outputLayerId = compactText(input.outputLayerId);
  const mapLayerId = compactText(input.mapLayerId) ?? source.sourceLayerId ?? outputLayerId ?? null;
  const selectedFeatureIds = uniqueIds(input.selectedFeatureIds);
  const selectedBuildingIds = uniqueIds([
    ...(input.selectedBuildingIds ?? []),
    ...(input.selectionEvent?.buildingId ? [input.selectionEvent.buildingId] : []),
  ]);
  const projection = buildProjectionReference(source, input.projection);
  const qa = resolveQa({
    source,
    projection,
    hasMapLayerId: Boolean(mapLayerId),
    geometryAssumptions: input.source.geometryAssumptions,
  });
  const syncId = compactText(input.syncId)
    ?? `voxcity-sync-${safeReferencePart(input.scenarioId ?? input.linkedRunId ?? source.id)}`;
  const handoff = buildDefaultHandoff(syncId, input.handoff);

  const metadata: MapVoxCitySyncMetadata = {
    version: 1,
    syncId,
    createdAt,
    sourceView: input.sourceView ?? input.selectionEvent?.source ?? "map-2d",
    mapLayerId,
    selectedFeatureIds,
    selectedBuildingIds,
    buildingReferences: normalizeBuildingReferences(input.buildingReferences, selectedBuildingIds, input.selectionEvent),
    voxelReferences: normalizeVoxelReferences(input.voxelReferences),
    source,
    projection,
    linkedArtifactIds: uniqueIds(input.linkedArtifactIds),
    handoff,
    qa,
    caveats: uniqueNotes([...qa.caveats, ...qa.uncertaintyNotes]),
  };
  const targetView = input.targetView;
  const viewport = input.viewport;
  const aoiId = compactText(input.aoiId);
  const scenarioId = compactText(input.scenarioId);
  const linkedRunId = compactText(input.linkedRunId);
  if (targetView) metadata.targetView = targetView;
  if (outputLayerId) metadata.outputLayerId = outputLayerId;
  if (viewport) {
    metadata.viewport = {
      center: [...viewport.center],
      zoom: viewport.zoom,
      bearing: viewport.bearing,
      pitch: viewport.pitch,
    };
  }
  if (aoiId) metadata.aoiId = aoiId;
  if (scenarioId) metadata.scenarioId = scenarioId;
  if (linkedRunId) metadata.linkedRunId = linkedRunId;
  return metadata;
}

export const useVoxCitySelectionStore = create<SelectionStoreState>((set) => ({
  selected: null,
  clear: () => {
    set({ selected: null });
    listeners.forEach((listener) => listener(null));
  },
}));

/**
 * Emit a selection event. The store is updated and all subscribed
 * listeners are notified. If the same building is selected by the same
 * source twice in a row, the event is still emitted so the receiver can
 * re-trigger a highlight (e.g. flash animation).
 */
export function publishVoxCitySelection(
  payload: Omit<VoxCitySelectionEvent, "id" | "emittedAt">,
): VoxCitySelectionEvent {
  const event: VoxCitySelectionEvent = {
    ...payload,
    id: nextEventId++,
    emittedAt: new Date().toISOString(),
  };
  useVoxCitySelectionStore.setState({ selected: event });
  listeners.forEach((listener) => listener(event));
  return event;
}

/** Imperatively clear the active selection. */
export function clearVoxCitySelection(): void {
  useVoxCitySelectionStore.getState().clear();
}

/**
 * Subscribe to all selection events. Returns an unsubscribe function.
 * The listener will only fire on new events — not on initial subscribe.
 */
export function subscribeToVoxCitySelection(
  listener: (event: VoxCitySelectionEvent | null) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For tests — full reset. */
export function resetVoxCitySelectionService(): void {
  listeners.clear();
  nextEventId = 1;
  useVoxCitySelectionStore.setState({ selected: null });
}
