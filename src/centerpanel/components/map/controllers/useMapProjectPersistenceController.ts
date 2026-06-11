import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";

import type {
  DrawnFeature,
  MapBookmark,
  MapPin,
  OverlayLayerConfig,
} from "../mapTypes";
import {
  clearPersistedMapProjectSnapshots,
  getRestorableOverlayLayers,
  loadProjectMapState,
  type MapProjectSnapshot,
  saveProjectMapState,
} from "../../../../services/map/MapPersistenceService";
import type { MapReviewTimelineEventInput } from "../../../../services/map/MapReviewSessionService";
import { toastError, toastInfo, toastSuccess, toastWarning } from "../../../../ui/toast/api";
import {
  MAP_AUTOSAVE_ERROR_NOTICE_COOLDOWN_MS,
  MAP_QUOTA_WARNING_NOTICE_COOLDOWN_MS,
  type MapProjectSaveTrigger,
} from "./mapExplorerControllerHelpers";
import { useMapExplorerStore } from "../../../../stores/useMapExplorerStore";

interface UseMapProjectPersistenceControllerArgs {
  activeBaseLayer: string;
  annotations: unknown[];
  announce: (message: string) => void;
  autoSaveEnabled: boolean;
  bookmarks: MapBookmark[];
  clearProjectContent: () => void;
  clearSelectedFeatures: () => void;
  clearSourceHandles: () => void;
  closeMapStartDialog: (action: "project-load", announcement?: string) => void;
  currentProjectSaveTrigger: MapProjectSaveTrigger;
  drawnFeatures: DrawnFeature[];
  fitToBounds: (bounds: [number, number, number, number]) => void;
  getCurrentViewportState: () => MapProjectSnapshot["viewport"];
  isLoadingProject: boolean;
  isSavingProject: boolean;
  lastAutoSaveTriggerRef: MutableRefObject<MapProjectSaveTrigger | null>;
  lastSavedAt: string | null;
  lastSavedProjectTriggerRef: MutableRefObject<MapProjectSaveTrigger | null>;
  mapInstanceRef: MutableRefObject<maplibregl.Map | null>;
  mapStartDialogOpen: boolean;
  open: boolean;
  overlayLayers: OverlayLayerConfig[];
  pins: MapPin[];
  recordMapReviewEvent: (event: MapReviewTimelineEventInput) => void;
  reducedMotion: boolean;
  replaceOverlayLayers: (layers: OverlayLayerConfig[]) => void;
  resetLayerRuntimeState: () => void;
  restoreProjectState: (snapshot: {
    viewport: MapProjectSnapshot["viewport"];
    activeBaseLayer: MapProjectSnapshot["activeBaseLayer"];
    pins: MapProjectSnapshot["pins"];
    bookmarks: MapProjectSnapshot["bookmarks"];
    annotations: MapProjectSnapshot["annotations"];
    drawnFeatures: MapProjectSnapshot["drawnFeatures"];
    overlayLayers: OverlayLayerConfig[];
    sourceHandles: MapProjectSnapshot["sourceHandles"];
    measurements: [];
    skipViewport: boolean;
  }) => void;
  selectedProject: { bbox?: [number, number, number, number]; name?: string } | null | undefined;
  selectedProjectId: string | null;
  setIsLoadingProject: Dispatch<SetStateAction<boolean>>;
  setIsSavingProject: Dispatch<SetStateAction<boolean>>;
  setLastSavedAt: Dispatch<SetStateAction<string | null>>;
  sourceHandles: MapProjectSnapshot["sourceHandles"];
}

export function useMapProjectPersistenceController({
  activeBaseLayer,
  annotations,
  announce,
  autoSaveEnabled,
  bookmarks,
  clearProjectContent,
  clearSelectedFeatures,
  clearSourceHandles,
  closeMapStartDialog,
  currentProjectSaveTrigger,
  drawnFeatures,
  fitToBounds,
  getCurrentViewportState,
  isLoadingProject,
  isSavingProject,
  lastAutoSaveTriggerRef,
  lastSavedAt,
  lastSavedProjectTriggerRef,
  mapInstanceRef,
  mapStartDialogOpen,
  open,
  overlayLayers,
  pins,
  recordMapReviewEvent,
  reducedMotion,
  replaceOverlayLayers,
  resetLayerRuntimeState,
  restoreProjectState,
  selectedProject,
  selectedProjectId,
  setIsLoadingProject,
  setIsSavingProject,
  setLastSavedAt,
  sourceHandles,
}: UseMapProjectPersistenceControllerArgs) {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringProjectRef = useRef(false);
  const lastProjectSaveErrorRef = useRef<{ key: string; timestamp: number } | null>(null);
  const previousProjectIdRef = useRef<string | null>(selectedProjectId);
  const quotaWarningShownRef = useRef<{ key: string; timestamp: number } | null>(null);

  const applyProjectSnapshot = useCallback((snapshot: MapProjectSnapshot) => {
    isRestoringProjectRef.current = true;
    const explicitFit = useMapExplorerStore.getState().lastExplicitFitRequest;
    const skipViewportRestore = explicitFit !== null;

    restoreProjectState({
      viewport: snapshot.viewport,
      activeBaseLayer: snapshot.activeBaseLayer,
      pins: snapshot.pins,
      bookmarks: snapshot.bookmarks,
      annotations: snapshot.annotations,
      drawnFeatures: snapshot.drawnFeatures,
      overlayLayers: getRestorableOverlayLayers(snapshot),
      sourceHandles: snapshot.sourceHandles,
      measurements: [],
      skipViewport: skipViewportRestore,
    });

    if (!skipViewportRestore) {
      const map = mapInstanceRef.current;
      if (map) {
        const nextView = {
          center: snapshot.viewport.center,
          zoom: snapshot.viewport.zoom,
          bearing: snapshot.viewport.bearing,
          pitch: snapshot.viewport.pitch,
        };

        if (reducedMotion) {
          map.jumpTo(nextView);
        } else {
          map.easeTo({
            ...nextView,
            duration: 700,
            essential: true,
          });
        }
      }
    }

    window.setTimeout(() => {
      isRestoringProjectRef.current = false;
    }, 0);
  }, [mapInstanceRef, reducedMotion, restoreProjectState]);

  const handleProjectSave = useCallback(async (projectIdOverride?: string | null, options?: {
    silent?: boolean;
    reason?: "manual" | "autosave" | "project-switch";
  }) => {
    const projectId = projectIdOverride ?? selectedProjectId;
    if (!projectId) {
      if (!options?.silent) {
        toastInfo("Select a project before saving map state.");
      }
      return false;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setIsSavingProject(true);
    try {
      const result = await saveProjectMapState({
        projectId,
        activeBaseLayer,
        viewport: getCurrentViewportState(),
        pins,
        bookmarks,
        annotations,
        drawnFeatures,
        overlayLayers,
        sourceHandles,
      });

      setLastSavedAt(result.snapshot.savedAt);
      lastSavedProjectTriggerRef.current = currentProjectSaveTrigger;
      lastAutoSaveTriggerRef.current = currentProjectSaveTrigger;

      if (result.quota.warning) {
        const now = Date.now();
        const warningKey = `${projectId}:${Math.floor(result.quota.projectedPercentUsed * 10)}`;
        const previousWarning = quotaWarningShownRef.current;
        const shouldShowQuotaWarning = !previousWarning
          || previousWarning.key !== warningKey
          || (!options?.silent && now - previousWarning.timestamp > MAP_QUOTA_WARNING_NOTICE_COOLDOWN_MS);
        if (shouldShowQuotaWarning) {
          quotaWarningShownRef.current = { key: warningKey, timestamp: now };
          toastWarning(
            `Map storage is ${Math.round(result.quota.projectedPercentUsed * 100)}% full. Further saves may fail soon.`,
          );
        }
      } else {
        quotaWarningShownRef.current = null;
      }

      if (!options?.silent) {
        toastSuccess(
          `Saved ${result.persistedFeatureCount.toLocaleString()} map feature${result.persistedFeatureCount === 1 ? "" : "s"} to project ${projectId}.`,
        );
        recordMapReviewEvent({
          type: "snapshot",
          status: "recorded",
          timestamp: result.snapshot.savedAt,
          title: "Project map state saved",
          summary: `Persisted map viewport, layers, drawings, bookmarks, annotations, and ${result.persistedFeatureCount.toLocaleString()} feature reference(s) to project ${projectId}.`,
          layerIds: overlayLayers.map((layer) => layer.id),
          details: {
            projectId,
            persistedFeatureCount: result.persistedFeatureCount,
            storageWarning: result.quota.warning,
          },
        });
      }
      announce(`Project map state saved for ${projectId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Project map save failed.";
      const now = Date.now();
      const errorKey = `${projectId}:${message}`;
      const previousError = lastProjectSaveErrorRef.current;
      const shouldNotify = !options?.silent
        || !previousError
        || previousError.key !== errorKey
        || now - previousError.timestamp > MAP_AUTOSAVE_ERROR_NOTICE_COOLDOWN_MS;
      if (shouldNotify) {
        lastProjectSaveErrorRef.current = { key: errorKey, timestamp: now };
        if (options?.silent) {
          toastWarning(message);
        } else {
          toastError(message);
        }
        announce(`Project save failed: ${message}`);
      }
      return false;
    } finally {
      setIsSavingProject(false);
    }
  }, [
    activeBaseLayer,
    announce,
    annotations,
    bookmarks,
    currentProjectSaveTrigger,
    drawnFeatures,
    getCurrentViewportState,
    lastAutoSaveTriggerRef,
    lastProjectSaveErrorRef,
    lastSavedProjectTriggerRef,
    overlayLayers,
    pins,
    quotaWarningShownRef,
    recordMapReviewEvent,
    selectedProjectId,
    setIsSavingProject,
    setLastSavedAt,
    sourceHandles,
  ]);

  const handleProjectLoad = useCallback(async (projectIdOverride?: string | null, options?: {
    silent?: boolean;
  }) => {
    if (mapStartDialogOpen) {
      closeMapStartDialog("project-load", "Map launch dialog dismissed");
    }

    const projectId = projectIdOverride ?? selectedProjectId;
    if (!projectId) {
      if (!options?.silent) {
        toastInfo("Select a project before loading map state.");
      }
      return false;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setIsLoadingProject(true);
    try {
      const result = await loadProjectMapState(projectId);
      if (!result.snapshot) {
        setLastSavedAt(null);
        lastSavedProjectTriggerRef.current = null;
        clearProjectContent();
        const explicitFit = useMapExplorerStore.getState().lastExplicitFitRequest;
        if (selectedProject?.bbox && !explicitFit) {
          fitToBounds(selectedProject.bbox);
        }
        if (!options?.silent) {
          toastInfo(`No saved map state was found for project ${projectId}.`);
        }
        announce(`No saved map state for ${projectId}`);
        return false;
      }

      applyProjectSnapshot(result.snapshot);
      setLastSavedAt(result.snapshot.savedAt);
      if (!options?.silent) {
        toastSuccess(
          `Restored ${result.restoredFeatureCount.toLocaleString()} feature${result.restoredFeatureCount === 1 ? "" : "s"} from project ${projectId}.`,
        );
      }
      announce(`Project map state loaded for ${projectId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Project map load failed.";
      toastError(message);
      announce(`Project load failed: ${message}`);
      return false;
    } finally {
      setIsLoadingProject(false);
    }
  }, [
    announce,
    applyProjectSnapshot,
    clearProjectContent,
    closeMapStartDialog,
    fitToBounds,
    lastSavedProjectTriggerRef,
    mapStartDialogOpen,
    selectedProject?.bbox,
    selectedProjectId,
    setIsLoadingProject,
    setLastSavedAt,
  ]);

  const handleClearLayerCache = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const activeLayerCount = overlayLayers.length;
    const removedProjectSnapshots = clearPersistedMapProjectSnapshots();

    if (activeLayerCount > 0) {
      replaceOverlayLayers([]);
    }
    clearSourceHandles();
    clearSelectedFeatures();
    resetLayerRuntimeState();
    setLastSavedAt(null);
    lastAutoSaveTriggerRef.current = null;
    lastSavedProjectTriggerRef.current = null;

    const layerLabel = activeLayerCount === 1 ? "layer" : "layers";
    const snapshotLabel = removedProjectSnapshots === 1 ? "snapshot" : "snapshots";
    const message = activeLayerCount === 0 && removedProjectSnapshots === 0
      ? "Map Explorer layer cache is already clean."
      : `Cleared ${activeLayerCount.toLocaleString()} active ${layerLabel} and ${removedProjectSnapshots.toLocaleString()} cached project map ${snapshotLabel}.`;

    if (activeLayerCount === 0 && removedProjectSnapshots === 0) {
      toastInfo(message);
    } else {
      toastSuccess(message);
    }
    announce(message);
  }, [
    announce,
    clearSelectedFeatures,
    clearSourceHandles,
    lastAutoSaveTriggerRef,
    lastSavedProjectTriggerRef,
    overlayLayers.length,
    replaceOverlayLayers,
    setLastSavedAt,
    resetLayerRuntimeState,
  ]);

  const handleProjectSaveRef = useRef(handleProjectSave);
  const handleProjectLoadRef = useRef(handleProjectLoad);

  useEffect(() => {
    handleProjectSaveRef.current = handleProjectSave;
  }, [handleProjectSave]);

  useEffect(() => {
    handleProjectLoadRef.current = handleProjectLoad;
  }, [handleProjectLoad]);

  useEffect(() => {
    if (!lastSavedAt || isSavingProject || isLoadingProject || isRestoringProjectRef.current) {
      return;
    }
    if (lastSavedProjectTriggerRef.current == null) {
      lastSavedProjectTriggerRef.current = currentProjectSaveTrigger;
    }
  }, [currentProjectSaveTrigger, isLoadingProject, isSavingProject, lastSavedAt, lastSavedProjectTriggerRef]);

  useEffect(() => {
    if (!open || !selectedProjectId) {
      previousProjectIdRef.current = selectedProjectId;
      return undefined;
    }

    let cancelled = false;
    const previousProjectId = previousProjectIdRef.current;
    previousProjectIdRef.current = selectedProjectId;

    void (async () => {
      if (previousProjectId && previousProjectId !== selectedProjectId && autoSaveEnabled) {
        await handleProjectSaveRef.current(previousProjectId, {
          silent: true,
          reason: "project-switch",
        });
      }

      if (!cancelled) {
        await handleProjectLoadRef.current(selectedProjectId, { silent: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoSaveEnabled, open, previousProjectIdRef, selectedProjectId]);

  useEffect(() => {
    if (
      !open ||
      !selectedProjectId ||
      !autoSaveEnabled ||
      isLoadingProject ||
      isSavingProject ||
      isRestoringProjectRef.current
    ) {
      return undefined;
    }

    const nextAutoSaveTrigger = {
      activeBaseLayer,
      annotations,
      bearing: currentProjectSaveTrigger.bearing,
      bookmarks,
      center: currentProjectSaveTrigger.center,
      drawnFeatures,
      overlayLayers,
      pins,
      pitch: currentProjectSaveTrigger.pitch,
      selectedProjectId,
      sourceHandles,
      zoom: currentProjectSaveTrigger.zoom,
    };
    const previousAutoSaveTrigger = lastAutoSaveTriggerRef.current;
    if (
      previousAutoSaveTrigger?.activeBaseLayer === nextAutoSaveTrigger.activeBaseLayer &&
      previousAutoSaveTrigger.annotations === nextAutoSaveTrigger.annotations &&
      previousAutoSaveTrigger.bearing === nextAutoSaveTrigger.bearing &&
      previousAutoSaveTrigger.bookmarks === nextAutoSaveTrigger.bookmarks &&
      previousAutoSaveTrigger.center === nextAutoSaveTrigger.center &&
      previousAutoSaveTrigger.drawnFeatures === nextAutoSaveTrigger.drawnFeatures &&
      previousAutoSaveTrigger.overlayLayers === nextAutoSaveTrigger.overlayLayers &&
      previousAutoSaveTrigger.pins === nextAutoSaveTrigger.pins &&
      previousAutoSaveTrigger.pitch === nextAutoSaveTrigger.pitch &&
      previousAutoSaveTrigger.selectedProjectId === nextAutoSaveTrigger.selectedProjectId &&
      previousAutoSaveTrigger.sourceHandles === nextAutoSaveTrigger.sourceHandles &&
      previousAutoSaveTrigger.zoom === nextAutoSaveTrigger.zoom
    ) {
      return undefined;
    }
    lastAutoSaveTriggerRef.current = nextAutoSaveTrigger;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void handleProjectSave(selectedProjectId, {
        silent: true,
        reason: "autosave",
      });
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    activeBaseLayer,
    annotations,
    autoSaveEnabled,
    bookmarks,
    currentProjectSaveTrigger,
    drawnFeatures,
    handleProjectSave,
    isLoadingProject,
    isSavingProject,
    lastAutoSaveTriggerRef,
    open,
    overlayLayers,
    pins,
    selectedProjectId,
    sourceHandles,
  ]);

  return {
    handleClearLayerCache,
    handleProjectLoad,
    handleProjectSave,
  };
}
