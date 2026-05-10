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

export type VoxCitySelectionSource = "map-2d" | "voxcity-3d";

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

interface SelectionStoreState {
  selected: VoxCitySelectionEvent | null;
  /** Clear the active selection. */
  clear: () => void;
}

const listeners = new Set<(event: VoxCitySelectionEvent | null) => void>();
let nextEventId = 1;

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
