import type { MapQuickActionId } from "./mapExperience";

export type MapStartDialogReason =
  | "first-open"
  | "no-project"
  | "no-layers"
  | "user-requested"
  | "restored-session";

export type MapStartDialogHandoff = "continue" | "import" | "project-load" | "demo-pack";
export type MapStartDialogDismissal = "dismiss" | "close" | "escape";
export type MapStartDialogAction = MapStartDialogHandoff | MapStartDialogDismissal;

export interface MapStartDialogState {
  open: boolean;
  reason: MapStartDialogReason | null;
  dismissedAt: string | null;
  lastAction: MapStartDialogAction | null;
}

export interface MapStartDialogContext {
  selectedProjectId?: string | null;
  layerCount: number;
  pinCount: number;
  drawnFeatureCount: number;
  annotationCount: number;
  measurementCount: number;
}

const LEGACY_DISMISSED_AT = "1970-01-01T00:00:00.000Z";
const REASONS = new Set<MapStartDialogReason>([
  "first-open",
  "no-project",
  "no-layers",
  "user-requested",
  "restored-session",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readReason(value: unknown): MapStartDialogReason | null {
  return typeof value === "string" && REASONS.has(value as MapStartDialogReason)
    ? value as MapStartDialogReason
    : null;
}

function hasPositiveCount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function readNestedDismissedAt(record: Record<string, unknown>, key: string): string | null {
  const nested = record[key];
  if (!isRecord(nested)) {
    return null;
  }
  return readString(nested.dismissedAt);
}

export function hasMapStartDialogWorkspaceContent(context: MapStartDialogContext): boolean {
  return hasPositiveCount(context.layerCount) ||
    hasPositiveCount(context.pinCount) ||
    hasPositiveCount(context.drawnFeatureCount) ||
    hasPositiveCount(context.annotationCount) ||
    hasPositiveCount(context.measurementCount);
}

export function resolveInitialMapStartDialogReason(
  context: MapStartDialogContext,
): MapStartDialogReason | null {
  if (hasMapStartDialogWorkspaceContent(context)) {
    return null;
  }

  if (!context.selectedProjectId || context.selectedProjectId.trim().length === 0) {
    return "no-project";
  }

  return "no-layers";
}

export function normalizeLegacyMapStartDialogDismissedAt(input: unknown): string | null {
  if (!isRecord(input)) {
    return null;
  }

  const directDismissedAt =
    readString(input.mapStartDialogDismissedAt) ??
    readString(input.cockpitDismissedAt) ??
    readString(input.launchDialogDismissedAt) ??
    readNestedDismissedAt(input, "mapStartDialog") ??
    readNestedDismissedAt(input, "startDialog") ??
    readNestedDismissedAt(input, "launchDialog");
  if (directDismissedAt) {
    return directDismissedAt;
  }

  const legacyClosed =
    input.showCockpit === false ||
    input.showLaunchDialog === false ||
    input.showMapStartDialog === false ||
    input.launchDialogOpen === false ||
    input.startDialogOpen === false;

  return legacyClosed ? LEGACY_DISMISSED_AT : null;
}

export function normalizeMapStartDialogState(input: unknown): MapStartDialogState {
  const dismissedAt = normalizeLegacyMapStartDialogDismissedAt(input);
  if (!isRecord(input)) {
    return { open: false, reason: null, dismissedAt, lastAction: null };
  }

  const normalizedDismissedAt = readString(input.dismissedAt) ?? dismissedAt;
  if (normalizedDismissedAt) {
    return { open: false, reason: null, dismissedAt: normalizedDismissedAt, lastAction: null };
  }

  const reason = readReason(input.reason);
  return {
    open: input.open === true && reason !== null,
    reason: input.open === true ? reason : null,
    dismissedAt: null,
    lastAction: null,
  };
}

export function createInitialMapStartDialogState(
  context: MapStartDialogContext,
  previousState?: unknown,
): MapStartDialogState {
  const normalizedPrevious = normalizeMapStartDialogState(previousState);
  if (normalizedPrevious.dismissedAt) {
    return normalizedPrevious;
  }

  const reason = resolveInitialMapStartDialogReason(context);
  return {
    open: reason !== null,
    reason,
    dismissedAt: null,
    lastAction: null,
  };
}

export function openMapStartDialog(reason: MapStartDialogReason): MapStartDialogState {
  return {
    open: true,
    reason,
    dismissedAt: null,
    lastAction: null,
  };
}

export function dismissMapStartDialog(
  state: MapStartDialogState,
  action: MapStartDialogAction,
  dismissedAt = new Date().toISOString(),
): MapStartDialogState {
  if (!state.open && state.dismissedAt) {
    return state;
  }

  return {
    open: false,
    reason: null,
    dismissedAt,
    lastAction: action,
  };
}

export function getMapStartDialogQuickActionHandoff(actionId: MapQuickActionId): MapStartDialogHandoff {
  return actionId === "import-data" ? "import" : "continue";
}
