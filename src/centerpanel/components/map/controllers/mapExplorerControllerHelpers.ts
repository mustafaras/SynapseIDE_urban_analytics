type ImportedGeoJSONLayer = import("../../../../services/map/MapDataImporter").ImportedGeoJSONLayer;
type ImportedRasterLayer = import("../../../../services/map/MapDataImporter").ImportedRasterLayer;

export type DispatchFeedbackTone = "info" | "busy" | "success" | "error";

export interface DispatchFeedbackState {
  tone: DispatchFeedbackTone;
  title: string;
  description: string;
}

export interface MapProjectSaveTrigger {
  activeBaseLayer: string;
  annotations: readonly unknown[];
  bearing: number;
  bookmarks: readonly unknown[];
  center: readonly [number, number];
  drawnFeatures: readonly unknown[];
  overlayLayers: readonly unknown[];
  pins: readonly unknown[];
  pitch: number;
  selectedProjectId: string | null;
  sourceHandles: readonly unknown[];
  zoom: number;
}

export const MAP_RENDER_ERROR_NOTICE_COOLDOWN_MS = 60_000;
export const MAP_QUOTA_WARNING_NOTICE_COOLDOWN_MS = 5 * 60_000;
export const MAP_AUTOSAVE_ERROR_NOTICE_COOLDOWN_MS = 2 * 60_000;

export function isImportedRasterLayer(result: ImportedGeoJSONLayer | ImportedRasterLayer): result is ImportedRasterLayer {
  return "inspection" in result && "histogram" in result;
}

export function sameMapProjectSaveTrigger(
  previous: MapProjectSaveTrigger | null,
  next: MapProjectSaveTrigger,
): boolean {
  return Boolean(previous)
    && previous.activeBaseLayer === next.activeBaseLayer
    && previous.annotations === next.annotations
    && previous.bearing === next.bearing
    && previous.bookmarks === next.bookmarks
    && previous.center === next.center
    && previous.drawnFeatures === next.drawnFeatures
    && previous.overlayLayers === next.overlayLayers
    && previous.pins === next.pins
    && previous.pitch === next.pitch
    && previous.selectedProjectId === next.selectedProjectId
    && previous.sourceHandles === next.sourceHandles
    && previous.zoom === next.zoom;
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function feedbackAccent(tone: DispatchFeedbackTone): string {
  switch (tone) {
    case "success":
      return "var(--syn-status-valid, #34d399)";
    case "error":
      return "var(--syn-status-error, #f87171)";
    case "busy":
      return "var(--syn-status-running, #60a5fa)";
    default:
      return "var(--syn-status-info, #38bdf8)";
  }
}

export function waitForMapCanvasCaptureMode(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export function restoreFocusToElement(element: HTMLElement | null): void {
  if (!element || !element.isConnected) {
    return;
  }
  window.requestAnimationFrame(() => {
    if (element.isConnected) {
      element.focus({ preventScroll: true });
    }
  });
}
