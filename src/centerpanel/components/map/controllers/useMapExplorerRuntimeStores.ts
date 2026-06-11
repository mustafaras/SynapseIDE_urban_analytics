import { useMemo } from "react";

import {
  selectLayoutPreferences,
  selectMapBearing,
  selectMapCenter,
  selectMapPitch,
  selectMapZoom,
  useMapExplorerStore,
} from "../../../../stores/useMapExplorerStore";
import { selectMapExplorerContextSummary } from "../mapContextSummary";
import { useMapToolbarPreferencesStore } from "../../../../stores/useMapToolbarPreferencesStore";
import { useFlowStore } from "../../../../stores/useFlowStore";
import { useAppStore } from "../../../../stores/appStore";
import { useMapLayerRuntime } from "./useMapLayerRuntime";
import { useProjectRegistryOptional } from "../../../registry/state";
import { useUrbanContextSummary } from "../../../../features/urbanAnalytics/useUrbanContextStore";
import { useViewportSyncStore } from "../../../../services/map/MapSyncService";

export function useMapExplorerRuntimeStores() {
  const activeBaseLayer = useMapExplorerStore((s) => s.activeBaseLayer);
  const setBaseLayer = useMapExplorerStore((s) => s.setBaseLayer);
  const activeFlow = useFlowStore((s) => s.activeFlow);
  const completedRuns = useFlowStore((s) => s.completedRuns);
  const upsertCompletedRun = useFlowStore((s) => s.upsertCompletedRun);
  const pins = useMapExplorerStore((s) => s.pins);
  const addPin = useMapExplorerStore((s) => s.addPin);
  const removePin = useMapExplorerStore((s) => s.removePin);
  const clearPins = useMapExplorerStore((s) => s.clearPins);
  const bookmarks = useMapExplorerStore((s) => s.bookmarks);
  const addMapBookmark = useMapExplorerStore((s) => s.addMapBookmark);
  const renameMapBookmark = useMapExplorerStore((s) => s.renameMapBookmark);
  const removeMapBookmark = useMapExplorerStore((s) => s.removeMapBookmark);
  const restoreMapBookmark = useMapExplorerStore((s) => s.restoreMapBookmark);
  const annotations = useMapExplorerStore((s) => s.annotations);
  const annotationToolSettings = useMapExplorerStore((s) => s.annotationToolSettings);
  const selectedAnnotationId = useMapExplorerStore((s) => s.selectedAnnotationId);
  const setAnnotationToolSettings = useMapExplorerStore((s) => s.setAnnotationToolSettings);
  const addMapAnnotation = useMapExplorerStore((s) => s.addMapAnnotation);
  const updateMapAnnotation = useMapExplorerStore((s) => s.updateMapAnnotation);
  const moveMapAnnotation = useMapExplorerStore((s) => s.moveMapAnnotation);
  const removeMapAnnotation = useMapExplorerStore((s) => s.removeMapAnnotation);
  const setSelectedAnnotationId = useMapExplorerStore((s) => s.setSelectedAnnotationId);
  const activeTool = useMapExplorerStore((s) => s.activeTool);
  const setActiveTool = useMapExplorerStore((s) => s.setActiveTool);
  const center = useMapExplorerStore(selectMapCenter);
  const zoom = useMapExplorerStore(selectMapZoom);
  const bearing = useMapExplorerStore(selectMapBearing);
  const pitch = useMapExplorerStore(selectMapPitch);
  const setViewport = useMapExplorerStore((s) => s.setViewport);
  const restoreProjectState = useMapExplorerStore((s) => s.restoreProjectState);
  const clearProjectContent = useMapExplorerStore((s) => s.clearProjectContent);
  const replaceOverlayLayers = useMapExplorerStore((s) => s.replaceOverlayLayers);
  const currentMapBounds = useMapExplorerStore((s) => s.currentMapBounds);
  const setCurrentMapBounds = useMapExplorerStore((s) => s.setCurrentMapBounds);
  const contextSummary = useMapExplorerStore(selectMapExplorerContextSummary);
  const urbanContextSummary = useUrbanContextSummary();
  const viewportSyncEnabled = useViewportSyncStore((s) => s.enabled);
  const viewportSyncStatus = useViewportSyncStore((s) => s.statusLabel);
  const setActiveAnalysisResultLayers = useMapExplorerStore((s) => s.setActiveAnalysisResultLayers);
  const activeAnalysisResultLayerIds = useMapExplorerStore((s) => s.activeAnalysisResultLayerIds);
  const scientificQA = useMapExplorerStore((s) => s.scientificQA);
  const setScientificQA = useMapExplorerStore((s) => s.setScientificQA);
  const reviewSession = useMapExplorerStore((s) => s.reviewSession);
  const addMapReviewEvent = useMapExplorerStore((s) => s.addMapReviewEvent);
  const updateMapReviewEventStatus = useMapExplorerStore((s) => s.updateMapReviewEventStatus);
  const clearMapReviewSession = useMapExplorerStore((s) => s.clearMapReviewSession);
  const mapEvidenceArtifacts = useMapExplorerStore((s) => s.mapEvidenceArtifacts);
  const upsertMapEvidenceArtifact = useMapExplorerStore((s) => s.upsertMapEvidenceArtifact);
  const sourceHandles = useMapExplorerStore((s) => s.sourceHandles);
  const upsertSourceHandle = useMapExplorerStore((s) => s.upsertSourceHandle);
  const clearSourceHandles = useMapExplorerStore((s) => s.clearSourceHandles);
  const copilotActionProposals = useMapExplorerStore((s) => s.copilotActionProposals);
  const copilotAuditTrail = useMapExplorerStore((s) => s.copilotAuditTrail);
  const layoutPreferences = useMapExplorerStore(selectLayoutPreferences);
  const setLayoutPreferences = useMapExplorerStore((s) => s.setLayoutPreferences);
  const restoreDefaultLayoutPreferences = useMapExplorerStore((s) => s.restoreDefaultLayoutPreferences);
  const activeTaskLensId = useMapToolbarPreferencesStore((s) => s.taskLens);
  const toolbarDensity = useMapToolbarPreferencesStore((s) => s.density);

  const {
    overlayLayers,
    addOverlayLayer,
    updateLayerMetadata,
    removeOverlayLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    reorderLayers,
  } = useMapLayerRuntime();

  const activeDrawTool = useMapExplorerStore((s) => s.activeDrawTool);
  const setActiveDrawTool = useMapExplorerStore((s) => s.setActiveDrawTool);
  const drawnFeatures = useMapExplorerStore((s) => s.drawnFeatures);
  const addDrawnFeature = useMapExplorerStore((s) => s.addDrawnFeature);
  const removeDrawnFeature = useMapExplorerStore((s) => s.removeDrawnFeature);
  const updateDrawnFeature = useMapExplorerStore((s) => s.updateDrawnFeature);
  const clearDrawnFeatures = useMapExplorerStore((s) => s.clearDrawnFeatures);
  const selectedFeatureId = useMapExplorerStore((s) => s.selectedFeatureId);
  const selectedFeatureIds = useMapExplorerStore((s) => s.selectedFeatureIds);
  const setSelectedFeatureId = useMapExplorerStore((s) => s.setSelectedFeatureId);
  const setSelectedFeatures = useMapExplorerStore((s) => s.setSelectedFeatures);
  const clearSelectedFeatures = useMapExplorerStore((s) => s.clearSelectedFeatures);
  const activeAoiId = useMapExplorerStore((s) => s.activeAoiId);

  const activeMeasureTool = useMapExplorerStore((s) => s.activeMeasureTool);
  const setActiveMeasureTool = useMapExplorerStore((s) => s.setActiveMeasureTool);
  const measurements = useMapExplorerStore((s) => s.measurements);
  const addMeasurement = useMapExplorerStore((s) => s.addMeasurement);
  const removeMeasurement = useMapExplorerStore((s) => s.removeMeasurement);
  const clearMeasurements = useMapExplorerStore((s) => s.clearMeasurements);
  const measureUnit = useMapExplorerStore((s) => s.measureUnit);
  const setMeasureUnit = useMapExplorerStore((s) => s.setMeasureUnit);
  const currentTimestep = useMapExplorerStore((s) => s.currentTimestep);
  const mapIsPlaying = useMapExplorerStore((s) => s.isPlaying);
  const mapPlaybackSpeed = useMapExplorerStore((s) => s.playbackSpeed);
  const setCurrentTimestep = useMapExplorerStore((s) => s.setCurrentTimestep);
  const setIsPlaying = useMapExplorerStore((s) => s.setIsPlaying);
  const setPlaybackSpeed = useMapExplorerStore((s) => s.setPlaybackSpeed);

  const projectRegistry = useProjectRegistryOptional();
  const selectedProjectId = projectRegistry?.state.selectedProjectId ?? null;
  const selectedProject = selectedProjectId
    ? projectRegistry?.state.projects.find((project) => project.id === selectedProjectId) ?? null
    : null;
  const appUser = useAppStore((s) => s.user);
  const autoSaveEnabled = useAppStore((s) => s.user?.preferences.autoSave ?? true);
  const mapStartDialogContext = useMemo(() => ({
    selectedProjectId,
    layerCount: overlayLayers.length,
    pinCount: pins.length,
    drawnFeatureCount: drawnFeatures.length,
    annotationCount: annotations.length,
    measurementCount: measurements.length,
  }), [
    annotations.length,
    drawnFeatures.length,
    measurements.length,
    overlayLayers.length,
    pins.length,
    selectedProjectId,
  ]);

  return {
    activeAoiId,
    activeAnalysisResultLayerIds,
    activeBaseLayer,
    activeDrawTool,
    activeFlow,
    activeMeasureTool,
    activeTaskLensId,
    activeTool,
    addDrawnFeature,
    addMapAnnotation,
    addMapBookmark,
    addMapReviewEvent,
    addMeasurement,
    addOverlayLayer,
    addPin,
    annotationToolSettings,
    annotations,
    appUser,
    autoSaveEnabled,
    bearing,
    bookmarks,
    center,
    clearDrawnFeatures,
    clearMapReviewSession,
    clearMeasurements,
    clearPins,
    clearProjectContent,
    clearSelectedFeatures,
    clearSourceHandles,
    completedRuns,
    contextSummary,
    copilotActionProposals,
    copilotAuditTrail,
    currentMapBounds,
    currentTimestep,
    drawnFeatures,
    layoutPreferences,
    mapEvidenceArtifacts,
    mapIsPlaying,
    mapPlaybackSpeed,
    mapStartDialogContext,
    measureUnit,
    measurements,
    moveMapAnnotation,
    overlayLayers,
    pins,
    pitch,
    removeDrawnFeature,
    removeMapAnnotation,
    removeMapBookmark,
    removeMeasurement,
    removeOverlayLayer,
    removePin,
    renameMapBookmark,
    reorderLayers,
    replaceOverlayLayers,
    restoreDefaultLayoutPreferences,
    restoreMapBookmark,
    restoreProjectState,
    reviewSession,
    scientificQA,
    selectedAnnotationId,
    selectedFeatureId,
    selectedFeatureIds,
    selectedProject,
    selectedProjectId,
    setActiveAnalysisResultLayers,
    setActiveDrawTool,
    setActiveMeasureTool,
    setActiveTool,
    setAnnotationToolSettings,
    setBaseLayer,
    setCurrentMapBounds,
    setCurrentTimestep,
    setIsPlaying,
    setLayerOpacity,
    setLayoutPreferences,
    setMeasureUnit,
    setPlaybackSpeed,
    setScientificQA,
    setSelectedAnnotationId,
    setSelectedFeatureId,
    setSelectedFeatures,
    setViewport,
    sourceHandles,
    toggleLayerVisibility,
    toolbarDensity,
    updateDrawnFeature,
    updateLayerMetadata,
    updateMapAnnotation,
    updateMapReviewEventStatus,
    upsertCompletedRun,
    upsertMapEvidenceArtifact,
    upsertSourceHandle,
    urbanContextSummary,
    viewportSyncEnabled,
    viewportSyncStatus,
    zoom,
  };
}
