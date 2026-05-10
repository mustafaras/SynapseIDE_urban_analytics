import { create } from "zustand";

export type ViewportSyncSource = "map-2d" | "voxcity-3d";

export interface ViewportSyncPayload {
  source: ViewportSyncSource;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface ViewportSyncEvent extends ViewportSyncPayload {
  id: number;
  emittedAt: string;
}

interface ViewportSyncStoreState {
  enabled: boolean;
  lastEvent: ViewportSyncEvent | null;
  lastSource: ViewportSyncSource | null;
  statusLabel: string;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  markIdle: () => void;
}

const VIEWPORT_SYNC_DEBOUNCE_MS = 100;

const listeners = new Set<(event: ViewportSyncEvent) => void>();
const pendingPayloads = new Map<ViewportSyncSource, ViewportSyncPayload>();
const pendingTimers = new Map<ViewportSyncSource, ReturnType<typeof setTimeout>>();
let nextEventId = 1;

const idleStatus = "3D sync ready";
const disabledStatus = "3D link off";

const statusLabelBySource: Record<ViewportSyncSource, string> = {
  "map-2d": "Synced with 3D",
  "voxcity-3d": "Synced with 3D",
};

export const useViewportSyncStore = create<ViewportSyncStoreState>((set) => ({
  enabled: false,
  lastEvent: null,
  lastSource: null,
  statusLabel: disabledStatus,
  setEnabled: (enabled) => {
    if (!enabled) {
      clearViewportSyncTimers();
      set({ enabled: false, statusLabel: disabledStatus });
      return;
    }

    set({ enabled: true, statusLabel: idleStatus });
  },
  toggleEnabled: () => {
    const { enabled, setEnabled } = useViewportSyncStore.getState();
    setEnabled(!enabled);
  },
  markIdle: () => {
    const { enabled } = useViewportSyncStore.getState();
    set({ statusLabel: enabled ? idleStatus : disabledStatus });
  },
}));

function clearViewportSyncTimers(): void {
  pendingTimers.forEach((timerId) => {
    clearTimeout(timerId);
  });
  pendingTimers.clear();
  pendingPayloads.clear();
}

function flushViewportSync(source: ViewportSyncSource): ViewportSyncEvent | null {
  pendingTimers.delete(source);
  const payload = pendingPayloads.get(source);
  pendingPayloads.delete(source);

  if (!payload || !useViewportSyncStore.getState().enabled) {
    return null;
  }

  const event: ViewportSyncEvent = {
    ...payload,
    id: nextEventId++,
    emittedAt: new Date().toISOString(),
  };

  useViewportSyncStore.setState({
    lastEvent: event,
    lastSource: source,
    statusLabel: statusLabelBySource[source],
  });

  listeners.forEach((listener) => listener(event));
  return event;
}

export function setViewportSyncEnabled(enabled: boolean): void {
  useViewportSyncStore.getState().setEnabled(enabled);
}

export function toggleViewportSyncEnabled(): void {
  useViewportSyncStore.getState().toggleEnabled();
}

export function markViewportSyncIdle(): void {
  useViewportSyncStore.getState().markIdle();
}

export function acknowledgeViewportSync(source: ViewportSyncSource): void {
  useViewportSyncStore.setState({
    lastSource: source,
    statusLabel: statusLabelBySource[source],
  });
}

export function subscribeToViewportSync(listener: (event: ViewportSyncEvent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishViewportSync(payload: ViewportSyncPayload): void {
  if (!useViewportSyncStore.getState().enabled) {
    return;
  }

  pendingPayloads.set(payload.source, payload);
  const existingTimer = pendingTimers.get(payload.source);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  pendingTimers.set(
    payload.source,
    setTimeout(() => {
      flushViewportSync(payload.source);
    }, VIEWPORT_SYNC_DEBOUNCE_MS),
  );
}

export function getViewportSyncStatusLabel(): string {
  return useViewportSyncStore.getState().statusLabel;
}

export function resetViewportSyncService(): void {
  clearViewportSyncTimers();
  listeners.clear();
  nextEventId = 1;
  useViewportSyncStore.setState({
    enabled: false,
    lastEvent: null,
    lastSource: null,
    statusLabel: disabledStatus,
  });
}

export const viewportSyncTokens = {
  debounceMs: VIEWPORT_SYNC_DEBOUNCE_MS,
  idleStatus,
  disabledStatus,
};