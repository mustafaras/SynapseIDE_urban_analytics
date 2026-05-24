import type { MapCommandKind } from "@/services/map/contracts/gisContracts";
import type { DrawnFeature, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";

/**
 * Inverse-operation data captured at apply time so a routed command can be
 * reverted. Kept transient (never persisted) because `layer.remove` holds a
 * full layer config — see {@link MAP_ACTION_HISTORY_LIMIT}.
 */
export type MapRevertToken =
  | { kind: "layer.remove"; layer: OverlayLayerConfig; orderedLayerIds: string[] }
  | { kind: "layer.style"; layerId: string; previousStyle: Record<string, unknown> | undefined }
  | { kind: "workflow.apply"; outputLayerId: string }
  | { kind: "report.handoff"; reportItemId: string }
  | { kind: "aoi.edit"; featureId: string; previousFeature: DrawnFeature };

export interface MapActionHistoryEntry {
  commandId: string;
  kind: MapCommandKind;
  title: string;
  reviewEventId: string;
  appliedAt: string;
  revertable: boolean;
  reverted: boolean;
  revertToken?: MapRevertToken;
}

export interface MapActionHistory {
  entries: MapActionHistoryEntry[];
}

/** Most-recent-first cap so revert tokens (which can carry a layer config) never grow unbounded. */
export const MAP_ACTION_HISTORY_LIMIT = 100;

export function createMapActionHistory(): MapActionHistory {
  return { entries: [] };
}

export function recordMapActionHistoryEntry(
  history: MapActionHistory,
  entry: MapActionHistoryEntry,
): MapActionHistory {
  return { entries: [entry, ...history.entries].slice(0, MAP_ACTION_HISTORY_LIMIT) };
}

export function getMapActionHistoryEntry(
  history: MapActionHistory,
  commandId: string,
): MapActionHistoryEntry | null {
  return history.entries.find((entry) => entry.commandId === commandId) ?? null;
}

/** An entry that can still be reverted: revertable, not yet reverted, and holding a token. */
export function findRevertableEntry(
  history: MapActionHistory,
  commandId: string,
): MapActionHistoryEntry | null {
  const entry = getMapActionHistoryEntry(history, commandId);
  return entry && entry.revertable && !entry.reverted && entry.revertToken ? entry : null;
}

export function markMapActionReverted(
  history: MapActionHistory,
  commandId: string,
): MapActionHistory {
  return {
    entries: history.entries.map((entry) =>
      entry.commandId === commandId ? { ...entry, reverted: true } : entry,
    ),
  };
}

export function listMapActionHistory(history: MapActionHistory): MapActionHistoryEntry[] {
  return history.entries;
}
