import type { DrawnFeature, MapEvidenceArtifact, OverlayLayerConfig, ViewportState } from "../../centerpanel/components/map/mapTypes";
import type { SourceHandle } from "../../services/map/contracts/gisContracts";
import { summarizeOverlayLayer } from "../../centerpanel/components/map/mapContextSummary";
import {
  selectMapEvidenceArtifactsByAoi as filterMapEvidenceArtifactsByAoi,
  selectMapEvidenceArtifactsByLayer as filterMapEvidenceArtifactsByLayer,
  selectMapEvidenceArtifactsBySource as filterMapEvidenceArtifactsBySource,
  selectMapEvidenceArtifactsByWorkflow as filterMapEvidenceArtifactsByWorkflow,
} from "../../centerpanel/components/map/mapEvidenceArtifacts";
import type { MapExplorerLayoutPreferences, MapExplorerState } from "../useMapExplorerStore";

export const selectMapCenter = (state: MapExplorerState): [number, number] => state.center;
export const selectMapZoom = (state: MapExplorerState): number => state.zoom;
export const selectMapBearing = (state: MapExplorerState): number => state.bearing;
export const selectMapPitch = (state: MapExplorerState): number => state.pitch;
export const selectOverlayLayers = (state: MapExplorerState): OverlayLayerConfig[] => state.overlayLayers;
export const selectSourceHandles = (state: MapExplorerState): SourceHandle[] => state.sourceHandles;
export const selectLayoutPreferences = (state: MapExplorerState): MapExplorerLayoutPreferences => state.layoutPreferences;

let previousViewportInput: Pick<MapExplorerState, "center" | "zoom" | "bearing" | "pitch"> | null = null;
let previousViewportResult: ViewportState | null = null;

export function selectMapViewport(state: MapExplorerState): ViewportState {
  if (
    previousViewportInput &&
    previousViewportResult &&
    previousViewportInput.center === state.center &&
    previousViewportInput.zoom === state.zoom &&
    previousViewportInput.bearing === state.bearing &&
    previousViewportInput.pitch === state.pitch
  ) {
    return previousViewportResult;
  }

  previousViewportInput = {
    center: state.center,
    zoom: state.zoom,
    bearing: state.bearing,
    pitch: state.pitch,
  };
  previousViewportResult = {
    center: state.center,
    zoom: state.zoom,
    bearing: state.bearing,
    pitch: state.pitch,
  };
  return previousViewportResult;
}

let previousVisibleLayersInput: OverlayLayerConfig[] | null = null;
let previousVisibleLayersResult: OverlayLayerConfig[] = [];

export function selectVisibleOverlayLayers(state: MapExplorerState): OverlayLayerConfig[] {
  if (previousVisibleLayersInput === state.overlayLayers) {
    return previousVisibleLayersResult;
  }

  previousVisibleLayersInput = state.overlayLayers;
  previousVisibleLayersResult = state.overlayLayers.filter((layer) => layer.visible);
  return previousVisibleLayersResult;
}

let previousVisibleLayerSummariesInput: OverlayLayerConfig[] | null = null;
let previousVisibleLayerSummariesResult: ReturnType<typeof summarizeOverlayLayer>[] = [];

export function selectVisibleLayerSummaries(state: MapExplorerState): ReturnType<typeof summarizeOverlayLayer>[] {
  if (previousVisibleLayerSummariesInput === state.overlayLayers) {
    return previousVisibleLayerSummariesResult;
  }

  previousVisibleLayerSummariesInput = state.overlayLayers;
  previousVisibleLayerSummariesResult = state.overlayLayers
    .filter((layer) => layer.visible)
    .map(summarizeOverlayLayer);
  return previousVisibleLayerSummariesResult;
}

function isAoiGeometry(feature: Pick<DrawnFeature, "geometry">): boolean {
  return feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon";
}

let previousActiveAoiFeatures: DrawnFeature[] | null = null;
let previousActiveAoiId: string | undefined;
let previousActiveAoiHasCache = false;
let previousActiveAoiResult: DrawnFeature | null = null;

export function selectActiveAoi(state: MapExplorerState): DrawnFeature | null {
  if (
    previousActiveAoiHasCache &&
    previousActiveAoiFeatures === state.drawnFeatures &&
    previousActiveAoiId === state.activeAoiId
  ) {
    return previousActiveAoiResult;
  }

  previousActiveAoiFeatures = state.drawnFeatures;
  previousActiveAoiId = state.activeAoiId;
  previousActiveAoiHasCache = true;

  const activeAoi = state.activeAoiId
    ? state.drawnFeatures.find((feature) => feature.id === state.activeAoiId && isAoiGeometry(feature))
    : undefined;
  previousActiveAoiResult = activeAoi ?? state.drawnFeatures.find(isAoiGeometry) ?? null;
  return previousActiveAoiResult;
}

export function selectSelectedFeatureCount(state: MapExplorerState): number {
  return Object.values(state.selectedFeatureIds).reduce((total, featureIds) => total + featureIds.length, 0);
}

let previousSelectedFeatureLayerIdsInput: Record<string, string[]> | null = null;
let previousSelectedFeatureLayerIdsResult: string[] = [];

export function selectSelectedFeatureLayerIds(state: MapExplorerState): string[] {
  if (previousSelectedFeatureLayerIdsInput === state.selectedFeatureIds) {
    return previousSelectedFeatureLayerIdsResult;
  }

  previousSelectedFeatureLayerIdsInput = state.selectedFeatureIds;
  previousSelectedFeatureLayerIdsResult = Object.keys(state.selectedFeatureIds);
  return previousSelectedFeatureLayerIdsResult;
}

export function selectSourceHandleById(sourceId: string | null | undefined) {
  return (state: MapExplorerState): SourceHandle | null => {
    if (!sourceId) return null;
    return state.sourceHandles.find((handle) => handle.sourceId === sourceId) ?? null;
  };
}

export function selectMapEvidenceArtifacts(state: MapExplorerState): MapEvidenceArtifact[] {
  return state.mapEvidenceArtifacts;
}

export function selectMapEvidenceArtifactsForLayer(layerId: string | null | undefined) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsByLayer(state.mapEvidenceArtifacts, layerId);
}

export function selectMapEvidenceArtifactsForAoi(aoiId: string | null | undefined) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsByAoi(state.mapEvidenceArtifacts, aoiId);
}

export function selectMapEvidenceArtifactsForWorkflow(workflowId: string | null | undefined) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsByWorkflow(state.mapEvidenceArtifacts, workflowId);
}

export function selectMapEvidenceArtifactsForSource(sourceModule: MapEvidenceArtifact["sourceModule"]) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsBySource(state.mapEvidenceArtifacts, sourceModule);
}