import type {
  MapCommandPreflight,
  MapCommandResult,
} from "@/services/map/contracts/gisContracts";
import type {
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type {
  MapReviewAuditCategory,
  MapReviewTimelineEventInput,
  MapReviewTimelineEventStatus,
  MapReviewTimelineEventType,
} from "@/services/map/MapReviewSessionService";
import type { MapRevertToken } from "./MapActionHistoryService";

/**
 * MapActionExecutor — one preview → apply → revert lifecycle for high-impact map
 * commands. Every routed action funnels through here so it is preflighted,
 * audited (one review-timeline event), and (where practical) revertable.
 *
 * The executor performs no I/O itself: callers inject a {@link MapActionEffects}
 * boundary (usually backed by the Zustand store) so the same logic is unit
 * testable and the store stays the single source of truth.
 */

export interface MapLayerRemoveCommand {
  kind: "layer.remove";
  layerId: string;
}
export interface MapLayerStyleCommand {
  kind: "layer.style";
  layerId: string;
  style: Record<string, unknown>;
}
export interface MapWorkflowApplyCommand {
  kind: "workflow.apply";
  workflowId: string;
  outputLayer: OverlayLayerConfig;
  canApply: boolean;
  manifest?: MapReproducibilityManifest;
  blockers?: string[];
  caveats?: string[];
}
export interface MapReportHandoffCommand {
  kind: "report.handoff";
  layerId: string;
  reportItemId: string;
  reportTitle: string;
  publishable: boolean;
  blockers?: string[];
}

export type MapActionCommand =
  | MapLayerRemoveCommand
  | MapLayerStyleCommand
  | MapWorkflowApplyCommand
  | MapReportHandoffCommand;

export type RoutedCommandKind = MapActionCommand["kind"];

/** Side-effect boundary the executor drives. Backed by the store in the app, by fakes in tests. */
export interface MapActionEffects {
  getLayer: (id: string) => OverlayLayerConfig | null;
  getLayerOrder: () => string[];
  addLayer: (layer: OverlayLayerConfig) => void;
  removeLayer: (id: string) => void;
  setLayerOrder: (orderedIds: string[]) => void;
  setLayerStyle: (id: string, style: Record<string, unknown>) => void;
  removeReportItem: (id: string) => void;
}

export interface MapActionOptions {
  idFactory?: () => string;
  now?: () => string;
}

export interface MapActionOutcome {
  result: MapCommandResult;
  preflight: MapCommandPreflight;
  reviewEvent: MapReviewTimelineEventInput;
  revertToken?: MapRevertToken;
}

/* -------------------------------------------------------------------- */
/*  preview                                                             */
/* -------------------------------------------------------------------- */

export function previewMapCommand(
  command: MapActionCommand,
  effects: Pick<MapActionEffects, "getLayer">,
): MapCommandPreflight {
  switch (command.kind) {
    case "layer.remove": {
      const layer = effects.getLayer(command.layerId);
      if (!layer) return blocked(`Layer "${command.layerId}" is no longer available to remove.`);
      const caveats = layer.metadata?.analysisResult
        ? ["Removing a derived analysis layer; its lineage stays in the review timeline."]
        : [];
      return { ok: true, blockers: [], caveats };
    }
    case "layer.style": {
      const layer = effects.getLayer(command.layerId);
      if (!layer) return blocked(`Layer "${command.layerId}" is no longer available to restyle.`);
      return { ok: true, blockers: [], caveats: [] };
    }
    case "workflow.apply": {
      if (!command.canApply) {
        return {
          ok: false,
          blockers: command.blockers?.length ? command.blockers : ["Workflow preview is not ready to apply."],
          caveats: command.caveats ?? [],
        };
      }
      return { ok: true, blockers: [], caveats: command.caveats ?? [] };
    }
    case "report.handoff": {
      if (!command.publishable) {
        return {
          ok: false,
          blockers: command.blockers?.length ? command.blockers : ["Layer is not publication-ready for report handoff."],
          caveats: [],
        };
      }
      return { ok: true, blockers: [], caveats: [] };
    }
  }
}

function blocked(reason: string): MapCommandPreflight {
  return { ok: false, blockers: [reason], caveats: [] };
}

/* -------------------------------------------------------------------- */
/*  apply                                                               */
/* -------------------------------------------------------------------- */

export function applyMapCommand(
  command: MapActionCommand,
  effects: MapActionEffects,
  options: MapActionOptions = {},
): MapActionOutcome {
  const createdAt = options.now?.() ?? new Date().toISOString();
  const commandId = options.idFactory?.() ?? createCommandId();
  const targetName = resolveTargetName(command, effects);
  const preflight = previewMapCommand(command, effects);

  if (!preflight.ok) {
    return blockedOutcome(command, commandId, createdAt, preflight, targetName);
  }

  let revertToken: MapRevertToken | undefined;
  let manifest: MapReproducibilityManifest | undefined;

  switch (command.kind) {
    case "layer.remove": {
      const layer = effects.getLayer(command.layerId);
      if (!layer) {
        return blockedOutcome(command, commandId, createdAt, blocked(`Layer "${command.layerId}" is no longer available to remove.`), targetName);
      }
      const orderedLayerIds = effects.getLayerOrder();
      effects.removeLayer(command.layerId);
      revertToken = { kind: "layer.remove", layer, orderedLayerIds };
      break;
    }
    case "layer.style": {
      const layer = effects.getLayer(command.layerId);
      if (!layer) {
        return blockedOutcome(command, commandId, createdAt, blocked(`Layer "${command.layerId}" is no longer available to restyle.`), targetName);
      }
      revertToken = { kind: "layer.style", layerId: command.layerId, previousStyle: layer.style };
      effects.setLayerStyle(command.layerId, command.style);
      break;
    }
    case "workflow.apply": {
      effects.addLayer(command.outputLayer);
      revertToken = { kind: "workflow.apply", outputLayerId: command.outputLayer.id };
      if (command.manifest) manifest = command.manifest;
      break;
    }
    case "report.handoff": {
      revertToken = { kind: "report.handoff", reportItemId: command.reportItemId };
      break;
    }
  }

  const result: MapCommandResult = {
    commandId,
    kind: command.kind,
    status: "applied",
    revertable: revertToken !== undefined,
    createdAt,
    reviewEventId: commandId,
    ...(manifest ? { manifest } : {}),
  };
  return {
    result,
    preflight,
    reviewEvent: buildCommandReviewEvent(command, result, preflight, targetName),
    ...(revertToken ? { revertToken } : {}),
  };
}

function blockedOutcome(
  command: MapActionCommand,
  commandId: string,
  createdAt: string,
  preflight: MapCommandPreflight,
  targetName: string,
): MapActionOutcome {
  const result: MapCommandResult = {
    commandId,
    kind: command.kind,
    status: "blocked",
    revertable: false,
    createdAt,
    reviewEventId: commandId,
  };
  return { result, preflight, reviewEvent: buildCommandReviewEvent(command, result, preflight, targetName) };
}

/* -------------------------------------------------------------------- */
/*  revert                                                              */
/* -------------------------------------------------------------------- */

export function revertMapCommand(token: MapRevertToken, effects: MapActionEffects): void {
  switch (token.kind) {
    case "layer.remove": {
      effects.addLayer(token.layer);
      // Re-added layers append; restore the original slot without dropping any
      // layers added between the remove and this revert.
      const surviving = effects.getLayerOrder().filter((id) => id !== token.layer.id);
      const originalIndex = token.orderedLayerIds.indexOf(token.layer.id);
      const insertAt = originalIndex < 0 ? surviving.length : Math.min(originalIndex, surviving.length);
      surviving.splice(insertAt, 0, token.layer.id);
      effects.setLayerOrder(surviving);
      break;
    }
    case "layer.style":
      effects.setLayerStyle(token.layerId, token.previousStyle ?? {});
      break;
    case "workflow.apply":
      effects.removeLayer(token.outputLayerId);
      break;
    case "report.handoff":
      effects.removeReportItem(token.reportItemId);
      break;
  }
}

/* -------------------------------------------------------------------- */
/*  review-event building                                               */
/* -------------------------------------------------------------------- */

interface CommandEventMeta {
  type: MapReviewTimelineEventType;
  category: MapReviewAuditCategory;
  verb: string;
}

const COMMAND_EVENT_META: Record<RoutedCommandKind, CommandEventMeta> = {
  "layer.remove": { type: "layer-change", category: "layer-registry", verb: "Removed layer" },
  "layer.style": { type: "layer-change", category: "cartography-review", verb: "Restyled layer" },
  "workflow.apply": { type: "workflow-action", category: "workflow-apply", verb: "Applied workflow" },
  "report.handoff": { type: "report-handoff", category: "export-report-handoff", verb: "Report handoff" },
};

function buildCommandReviewEvent(
  command: MapActionCommand,
  result: MapCommandResult,
  preflight: MapCommandPreflight,
  targetName: string,
): MapReviewTimelineEventInput {
  const meta = COMMAND_EVENT_META[command.kind];
  const status: MapReviewTimelineEventStatus =
    result.status === "blocked" ? "failed" : result.status === "reverted" ? "undone" : "applied";
  const summary =
    result.status === "blocked"
      ? `Blocked: ${preflight.blockers.join(" ")}`
      : `${meta.verb} ${targetName} via the map command lifecycle.${preflight.caveats.length ? ` ${preflight.caveats.join(" ")}` : ""}`;
  return {
    id: result.reviewEventId,
    type: meta.type,
    category: meta.category,
    status,
    title: `${meta.verb}: ${targetName}`,
    summary,
    layerIds: commandLayerIds(command),
    reportItemIds: command.kind === "report.handoff" ? [command.reportItemId] : [],
    details: {
      commandId: result.commandId,
      commandKind: command.kind,
      revertable: result.revertable,
      blockers: preflight.blockers,
      caveats: preflight.caveats,
    },
    undo: result.revertable ? { available: true, actionLabel: "Revert" } : { available: false },
  };
}

function commandLayerIds(command: MapActionCommand): string[] {
  switch (command.kind) {
    case "layer.remove":
    case "layer.style":
    case "report.handoff":
      return [command.layerId];
    case "workflow.apply":
      return [command.outputLayer.id];
  }
}

function resolveTargetName(command: MapActionCommand, effects: Pick<MapActionEffects, "getLayer">): string {
  switch (command.kind) {
    case "layer.remove":
    case "layer.style":
      return effects.getLayer(command.layerId)?.name ?? command.layerId;
    case "workflow.apply":
      return command.outputLayer.name ?? command.workflowId;
    case "report.handoff":
      return command.reportTitle;
  }
}

let commandCounter = 0;
function createCommandId(): string {
  commandCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `mapcmd-${Date.now().toString(36)}-${commandCounter}-${random}`;
}
