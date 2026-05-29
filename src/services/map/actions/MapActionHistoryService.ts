import type { MapCommandKind } from "@/services/map/contracts/gisContracts";
import type { DrawnFeature, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";

/**
 * Inverse-operation data captured at apply time so a routed command can be
 * reverted. Kept transient (never persisted) because `layer.remove` holds a
 * full layer config — see {@link MAP_ACTION_HISTORY_LIMIT}.
 */
export type MapRevertToken =
  | { kind: "layer.remove"; layer: OverlayLayerConfig; orderedLayerIds: string[] }
  | { kind: "layer.style"; layerId: string; previousStyle: Record<string, unknown> | undefined; previousLayer?: OverlayLayerConfig }
  | { kind: "workflow.apply"; outputLayerId: string; replacedLayer?: OverlayLayerConfig }
  | { kind: "report.handoff"; reportItemId: string }
  | { kind: "aoi.edit"; featureId: string; previousFeature: DrawnFeature };

export type MapRedoToken =
  | { kind: "layer.remove"; layerId: string }
  | { kind: "layer.style"; layerId: string; nextStyle: Record<string, unknown>; nextLayer?: OverlayLayerConfig }
  | { kind: "workflow.apply"; outputLayer: OverlayLayerConfig; replaceLayerId?: string }
  | { kind: "aoi.edit"; featureId: string; nextFeature: DrawnFeature };

export interface MapActionHistoryEntry {
  commandId: string;
  kind: MapCommandKind;
  title: string;
  reviewEventId: string;
  appliedAt: string;
  revertable: boolean;
  reverted: boolean;
  revertToken?: MapRevertToken;
  redoToken?: MapRedoToken;
}

export interface MapActionHistory {
  entries: MapActionHistoryEntry[];
  undoStack: MapActionHistoryEntry[];
  redoStack: MapActionHistoryEntry[];
}

export interface MapUndoRedoSummary {
  canUndo: boolean;
  canRedo: boolean;
  undoDepth: number;
  redoDepth: number;
  undoLabel: string | null;
  redoLabel: string | null;
}

/** Most-recent-first cap so revert tokens (which can carry a layer config) never grow unbounded. */
export const MAP_ACTION_HISTORY_LIMIT = 100;
export const MAP_UNDO_REDO_COALESCE_WINDOW_MS = 900;

export function createMapActionHistory(): MapActionHistory {
  return { entries: [], undoStack: [], redoStack: [] };
}

export function recordMapActionHistoryEntry(
  history: MapActionHistory,
  entry: MapActionHistoryEntry,
): MapActionHistory {
  const entries = [entry, ...history.entries].slice(0, MAP_ACTION_HISTORY_LIMIT);
  if (!isUndoRedoCapable(entry)) {
    return { ...history, entries, redoStack: [] };
  }

  const coalescedUndoStack = coalesceUndoStack(history.undoStack, entry);
  const undoStack = coalescedUndoStack ?? [entry, ...history.undoStack].slice(0, MAP_ACTION_HISTORY_LIMIT);
  return { entries, undoStack, redoStack: [] };
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

export function findUndoableEntry(history: MapActionHistory): MapActionHistoryEntry | null {
  return history.undoStack.find(isUndoRedoCapable) ?? null;
}

export function findRedoableEntry(history: MapActionHistory): MapActionHistoryEntry | null {
  return history.redoStack.find(isRedoCapable) ?? null;
}

export function summarizeMapUndoRedo(history: MapActionHistory): MapUndoRedoSummary {
  const undoEntry = findUndoableEntry(history);
  const redoEntry = findRedoableEntry(history);
  return {
    canUndo: undoEntry !== null,
    canRedo: redoEntry !== null,
    undoDepth: history.undoStack.filter(isUndoRedoCapable).length,
    redoDepth: history.redoStack.filter(isRedoCapable).length,
    undoLabel: undoEntry?.title ?? null,
    redoLabel: redoEntry?.title ?? null,
  };
}

export function markMapActionReverted(
  history: MapActionHistory,
  commandId: string,
): MapActionHistory {
  return markMapActionUndone(history, commandId);
}

export function markMapActionUndone(
  history: MapActionHistory,
  commandId: string,
): MapActionHistory {
  const entry = history.undoStack.find((candidate) => candidate.commandId === commandId) ?? getMapActionHistoryEntry(history, commandId);
  return {
    entries: history.entries.map((entry) =>
      entry.commandId === commandId ? { ...entry, reverted: true } : entry,
    ),
    undoStack: history.undoStack.filter((candidate) => candidate.commandId !== commandId),
    redoStack: entry && isUndoRedoCapable(entry)
      ? [{ ...entry, reverted: true }, ...history.redoStack.filter((candidate) => candidate.commandId !== commandId)].slice(0, MAP_ACTION_HISTORY_LIMIT)
      : history.redoStack,
  };
}

export function markMapActionRedone(
  history: MapActionHistory,
  commandId: string,
): MapActionHistory {
  const entry = history.redoStack.find((candidate) => candidate.commandId === commandId) ?? getMapActionHistoryEntry(history, commandId);
  return {
    entries: history.entries.map((entry) =>
      entry.commandId === commandId ? { ...entry, reverted: false } : entry,
    ),
    undoStack: entry && isRedoCapable(entry)
      ? [{ ...entry, reverted: false }, ...history.undoStack.filter((candidate) => candidate.commandId !== commandId)].slice(0, MAP_ACTION_HISTORY_LIMIT)
      : history.undoStack,
    redoStack: history.redoStack.filter((candidate) => candidate.commandId !== commandId),
  };
}

export function listMapActionHistory(history: MapActionHistory): MapActionHistoryEntry[] {
  return history.entries;
}

function isUndoRedoCapable(entry: MapActionHistoryEntry): boolean {
  return entry.revertable && !entry.reverted && Boolean(entry.revertToken && entry.redoToken);
}

function isRedoCapable(entry: MapActionHistoryEntry): boolean {
  return entry.revertable && entry.reverted && Boolean(entry.revertToken && entry.redoToken);
}

function coalesceUndoStack(
  undoStack: MapActionHistoryEntry[],
  entry: MapActionHistoryEntry,
): MapActionHistoryEntry[] | null {
  const previous = undoStack[0];
  if (!previous || !canCoalesceUndoEntries(previous, entry)) return null;
  const merged: MapActionHistoryEntry = {
    ...entry,
    revertToken: previous.revertToken,
  };
  return [merged, ...undoStack.slice(1)].slice(0, MAP_ACTION_HISTORY_LIMIT);
}

function canCoalesceUndoEntries(previous: MapActionHistoryEntry, next: MapActionHistoryEntry): boolean {
  if (!isUndoRedoCapable(previous) || !isUndoRedoCapable(next)) return false;
  if (previous.kind !== next.kind) return false;
  if (previous.kind !== "layer.style" && previous.kind !== "aoi.edit") return false;
  if (getActionTargetId(previous) !== getActionTargetId(next)) return false;
  const previousTime = Date.parse(previous.appliedAt);
  const nextTime = Date.parse(next.appliedAt);
  if (!Number.isFinite(previousTime) || !Number.isFinite(nextTime)) return false;
  return nextTime >= previousTime && nextTime - previousTime <= MAP_UNDO_REDO_COALESCE_WINDOW_MS;
}

function getActionTargetId(entry: MapActionHistoryEntry): string | null {
  const token = entry.revertToken ?? entry.redoToken;
  if (!token) return null;
  switch (token.kind) {
    case "layer.remove":
      return "layer" in token ? token.layer.id : token.layerId;
    case "layer.style":
      return token.layerId;
    case "workflow.apply":
      return "outputLayerId" in token ? token.outputLayerId : token.outputLayer.id;
    case "aoi.edit":
      return token.featureId;
    case "report.handoff":
      return token.reportItemId;
  }
}
