import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getViewportSyncStatusLabel,
  markViewportSyncIdle,
  publishViewportSync,
  resetViewportSyncService,
  setViewportSyncEnabled,
  subscribeToViewportSync,
  useViewportSyncStore,
  viewportSyncTokens,
} from "../MapSyncService";

describe("MapSyncService", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetViewportSyncService();
  });

  it("debounces viewport sync publications per source and updates status", () => {
    vi.useFakeTimers();
    setViewportSyncEnabled(true);

    const received: Array<{ source: string; zoom: number; center: [number, number] }> = [];
    const unsubscribe = subscribeToViewportSync((event) => {
      received.push({ source: event.source, zoom: event.zoom, center: event.center });
    });

    publishViewportSync({
      source: "map-2d",
      center: [29.01, 41.01],
      zoom: 11,
      bearing: 0,
      pitch: 0,
    });
    publishViewportSync({
      source: "map-2d",
      center: [29.02, 41.02],
      zoom: 12,
      bearing: 10,
      pitch: 20,
    });

    vi.advanceTimersByTime(viewportSyncTokens.debounceMs - 1);
    expect(received).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(received).toEqual([
      { source: "map-2d", zoom: 12, center: [29.02, 41.02] },
    ]);
    expect(useViewportSyncStore.getState().lastEvent?.source).toBe("map-2d");
    expect(getViewportSyncStatusLabel()).toBe("Synced with 3D");

    markViewportSyncIdle();
    expect(getViewportSyncStatusLabel()).toBe(viewportSyncTokens.idleStatus);

    unsubscribe();
  });

  it("does not emit while sync is disabled", () => {
    vi.useFakeTimers();

    const listener = vi.fn();
    subscribeToViewportSync(listener);

    publishViewportSync({
      source: "voxcity-3d",
      center: [29, 41],
      zoom: 13,
      bearing: 25,
      pitch: 35,
    });

    vi.advanceTimersByTime(viewportSyncTokens.debounceMs);
    expect(listener).not.toHaveBeenCalled();
    expect(getViewportSyncStatusLabel()).toBe(viewportSyncTokens.disabledStatus);
  });
});