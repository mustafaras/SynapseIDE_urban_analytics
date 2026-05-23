import type { MapExplorerLayoutPreferences, MapExplorerState } from "../useMapExplorerStore";
import { sanitizeSourceHandlesForPersistence } from "../../services/map/sources/MapSourceRegistry";

export type PersistedMapExplorerState = Pick<
  MapExplorerState,
  | "center"
  | "zoom"
  | "bearing"
  | "pitch"
  | "activeBaseLayer"
  | "pins"
  | "bookmarks"
  | "annotations"
  | "annotationToolSettings"
  | "selectedFeatureIds"
  | "activeAoiId"
  | "activeAnalysisResultLayerIds"
  | "sourceHandles"
  | "layoutPreferences"
>;

export type NormalizeMapExplorerLayoutPreferences = (
  input: Partial<MapExplorerLayoutPreferences> | undefined,
) => MapExplorerLayoutPreferences;

export function partializeMapExplorerState(
  state: MapExplorerState,
  normalizeLayoutPreferences: NormalizeMapExplorerLayoutPreferences,
): PersistedMapExplorerState {
  return {
    center: state.center,
    zoom: state.zoom,
    bearing: state.bearing,
    pitch: state.pitch,
    activeBaseLayer: state.activeBaseLayer,
    pins: state.pins,
    bookmarks: state.bookmarks,
    annotations: state.annotations,
    annotationToolSettings: state.annotationToolSettings,
    selectedFeatureIds: state.selectedFeatureIds,
    activeAoiId: state.activeAoiId,
    activeAnalysisResultLayerIds: state.activeAnalysisResultLayerIds,
    sourceHandles: sanitizeSourceHandlesForPersistence(state.sourceHandles),
    layoutPreferences: normalizeLayoutPreferences(state.layoutPreferences),
  };
}