import type {
  MapCommandPreflight,
  MapCommandResult,
} from "@/services/map/contracts/gisContracts";
import { recordMapTelemetryEvent } from "@/services/map/observability";
import type {
  DrawnFeature,
  DrawnGeometryValidation,
  LayerMetadata,
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  summarizeDrawnGeometryValidation,
  validateDrawnGeometry,
} from "@/services/map/DrawnGeometryValidation";
import type {
  MapReviewAuditCategory,
  MapReviewTimelineEventInput,
  MapReviewTimelineEventStatus,
  MapReviewTimelineEventType,
} from "@/services/map/MapReviewSessionService";
import type { MapRedoToken, MapRevertToken } from "./MapActionHistoryService";

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
  opacity?: number;
  metadataPatch?: Partial<LayerMetadata>;
  styleMode?: string;
  styleHash?: string;
  legendEntryCount?: number;
  noDataClass?: boolean;
  warnings?: readonly string[];
}
export interface MapWorkflowApplyCommand {
  kind: "workflow.apply";
  workflowId: string;
  outputLayer: OverlayLayerConfig;
  replaceLayerId?: string;
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
export interface MapAoiEditCommand {
  kind: "aoi.edit";
  featureId: string;
  previousFeature: DrawnFeature;
  nextFeature: DrawnFeature;
  validation?: DrawnGeometryValidation;
  blockers?: string[];
  caveats?: string[];
}

export type MapActionCommand =
  | MapLayerRemoveCommand
  | MapLayerStyleCommand
  | MapWorkflowApplyCommand
  | MapReportHandoffCommand
  | MapAoiEditCommand;

export type RoutedCommandKind = MapActionCommand["kind"];

export const MAP_REGISTERED_COMMAND_KINDS = [
  "layer.remove",
  "layer.style",
  "workflow.apply",
  "report.handoff",
  "aoi.edit",
] as const satisfies readonly RoutedCommandKind[];

/** Side-effect boundary the executor drives. Backed by the store in the app, by fakes in tests. */
export interface MapActionEffects {
  getLayer: (id: string) => OverlayLayerConfig | null;
  getLayerOrder: () => string[];
  addLayer: (layer: OverlayLayerConfig) => void;
  removeLayer: (id: string) => void;
  setLayerOrder: (orderedIds: string[]) => void;
  setLayerStyle: (id: string, style: Record<string, unknown>) => void;
  removeReportItem: (id: string) => void;
  getDrawnFeature?: (id: string) => DrawnFeature | null;
  updateDrawnFeature?: (id: string, patch: Partial<DrawnFeature>) => void;
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
  redoToken?: MapRedoToken;
}

/* -------------------------------------------------------------------- */
/*  preview                                                             */
/* -------------------------------------------------------------------- */

export function previewMapCommand(
  command: MapActionCommand,
  effects: Pick<MapActionEffects, "getLayer" | "getDrawnFeature" | "updateDrawnFeature">,
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
      if (command.replaceLayerId && !effects.getLayer(command.replaceLayerId)) {
        return blocked(`Layer "${command.replaceLayerId}" is no longer available to replace.`);
      }
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
    case "aoi.edit": {
      if (!effects.getDrawnFeature || !effects.updateDrawnFeature) {
        return blocked("AOI edit effects are unavailable in this map surface.");
      }
      const current = effects.getDrawnFeature(command.featureId);
      if (!current) {
        return blocked(`AOI "${command.featureId}" is no longer available to edit.`);
      }
      const validation = command.validation ?? validateDrawnGeometry(command.nextFeature.geometry);
      const caveats = [
        "AOI edits use EPSG:4326 display coordinates; area and distance interpretation still require CRS preflight.",
        ...validation.caveats,
        ...(command.caveats ?? []),
      ];
      if (command.blockers?.length) {
        return { ok: false, blockers: command.blockers, caveats };
      }
      if (validation.status === "blocked") {
        return {
          ok: false,
          blockers: [`AOI edit blocked: ${summarizeDrawnGeometryValidation(validation)}`],
          caveats,
        };
      }
      return { ok: true, blockers: [], caveats };
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
  let redoToken: MapRedoToken | undefined;
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
      redoToken = { kind: "layer.remove", layerId: command.layerId };
      break;
    }
    case "layer.style": {
      const layer = effects.getLayer(command.layerId);
      if (!layer) {
        return blockedOutcome(command, commandId, createdAt, blocked(`Layer "${command.layerId}" is no longer available to restyle.`), targetName);
      }
      const nextLayer: OverlayLayerConfig = {
        ...layer,
        style: command.style,
        ...(typeof command.opacity === "number" ? { opacity: command.opacity } : {}),
        ...(command.metadataPatch ? { metadata: { ...(layer.metadata ?? {}), ...command.metadataPatch } } : {}),
      };
      revertToken = { kind: "layer.style", layerId: command.layerId, previousStyle: layer.style, previousLayer: layer };
      redoToken = { kind: "layer.style", layerId: command.layerId, nextStyle: command.style, nextLayer };
      effects.addLayer(nextLayer);
      break;
    }
    case "workflow.apply": {
      const replacedLayer = command.replaceLayerId ? effects.getLayer(command.replaceLayerId) : null;
      if (command.replaceLayerId && !replacedLayer) {
        return blockedOutcome(command, commandId, createdAt, blocked(`Layer "${command.replaceLayerId}" is no longer available to replace.`), targetName);
      }
      if (command.replaceLayerId && command.replaceLayerId !== command.outputLayer.id) {
        effects.removeLayer(command.replaceLayerId);
      }
      effects.addLayer(command.outputLayer);
      revertToken = replacedLayer
        ? { kind: "workflow.apply", outputLayerId: command.outputLayer.id, replacedLayer }
        : { kind: "workflow.apply", outputLayerId: command.outputLayer.id };
      redoToken = {
        kind: "workflow.apply",
        outputLayer: command.outputLayer,
        ...(command.replaceLayerId ? { replaceLayerId: command.replaceLayerId } : {}),
      };
      if (command.manifest) manifest = command.manifest;
      break;
    }
    case "report.handoff": {
      break;
    }
    case "aoi.edit": {
      if (!effects.updateDrawnFeature) {
        return blockedOutcome(command, commandId, createdAt, blocked("AOI edit effects are unavailable in this map surface."), targetName);
      }
      const validation = command.validation ?? validateDrawnGeometry(command.nextFeature.geometry);
      effects.updateDrawnFeature(command.featureId, {
        geometry: command.nextFeature.geometry,
        properties: {
          ...command.nextFeature.properties,
          validation,
        },
      });
      revertToken = { kind: "aoi.edit", featureId: command.featureId, previousFeature: command.previousFeature };
      redoToken = { kind: "aoi.edit", featureId: command.featureId, nextFeature: { ...command.nextFeature, properties: { ...command.nextFeature.properties, validation } } };
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
  const outcome: MapActionOutcome = {
    result,
    preflight,
    reviewEvent: buildCommandReviewEvent(command, result, preflight, targetName),
    ...(revertToken ? { revertToken } : {}),
    ...(redoToken ? { redoToken } : {}),
  };
  recordCommandTelemetry(command, result, preflight, targetName);
  return outcome;
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
  recordCommandTelemetry(command, result, preflight, targetName);
  return { result, preflight, reviewEvent: buildCommandReviewEvent(command, result, preflight, targetName) };
}

function recordCommandTelemetry(
  command: MapActionCommand,
  result: MapCommandResult,
  preflight: MapCommandPreflight,
  targetName: string,
): void {
  recordMapTelemetryEvent({
    kind: "command.run",
    severity: result.status === "applied" ? "info" : "warning",
    source: "map-command",
    message: `Map command ${command.kind} ${result.status} for ${targetName}.`,
    code: `MAP_COMMAND_${result.status.toUpperCase()}`,
    recoverable: result.status === "blocked",
    ...(result.status === "blocked" ? { recoveryLabel: "Review blockers" } : {}),
    entityIds: {
      commandId: result.commandId,
    },
    details: {
      commandId: result.commandId,
      commandKind: command.kind,
      status: result.status,
      targetName,
      layerIds: commandLayerIds(command),
      blockerCount: preflight.blockers.length,
      caveatCount: preflight.caveats.length,
      revertable: result.revertable,
      ...(result.manifest ? { manifestId: result.manifest.manifestId } : {}),
    },
    fingerprint: `command:${result.commandId}:${command.kind}:${result.status}`,
  });
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
      if (token.previousLayer) {
        effects.addLayer(token.previousLayer);
      } else {
        effects.setLayerStyle(token.layerId, token.previousStyle ?? {});
      }
      break;
    case "workflow.apply":
      if (token.replacedLayer) {
        if (token.outputLayerId !== token.replacedLayer.id) {
          effects.removeLayer(token.outputLayerId);
        }
        effects.addLayer(token.replacedLayer);
      } else {
        effects.removeLayer(token.outputLayerId);
      }
      break;
    case "report.handoff":
      effects.removeReportItem(token.reportItemId);
      break;
    case "aoi.edit":
      effects.updateDrawnFeature?.(token.featureId, {
        geometry: token.previousFeature.geometry,
        properties: token.previousFeature.properties,
      });
      break;
  }
}

export function redoMapCommand(token: MapRedoToken, effects: MapActionEffects): void {
  switch (token.kind) {
    case "layer.remove":
      effects.removeLayer(token.layerId);
      break;
    case "layer.style":
      if (token.nextLayer) {
        effects.addLayer(token.nextLayer);
      } else {
        effects.setLayerStyle(token.layerId, token.nextStyle);
      }
      break;
    case "workflow.apply":
      if (token.replaceLayerId && token.replaceLayerId !== token.outputLayer.id) {
        effects.removeLayer(token.replaceLayerId);
      }
      effects.addLayer(token.outputLayer);
      break;
    case "aoi.edit":
      effects.updateDrawnFeature?.(token.featureId, {
        geometry: token.nextFeature.geometry,
        properties: token.nextFeature.properties,
      });
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
  "aoi.edit": { type: "workflow-action", category: "action-audit", verb: "Edited AOI" },
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
  const commandDetails = buildCommandDetails(command);
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
      ...commandDetails,
    },
    undo: result.revertable ? { available: true, actionLabel: "Revert" } : { available: false },
  };
}

function buildCommandDetails(command: MapActionCommand): Record<string, unknown> {
  switch (command.kind) {
    case "layer.style":
      return {
        ...(command.styleMode ? { styleMode: command.styleMode } : {}),
        ...(command.styleHash ? { styleHash: command.styleHash } : {}),
        ...(typeof command.legendEntryCount === "number" ? { legendEntryCount: command.legendEntryCount } : {}),
        ...(typeof command.noDataClass === "boolean" ? { noDataClass: command.noDataClass } : {}),
        ...(command.warnings?.length ? { warnings: command.warnings } : {}),
      };
    case "workflow.apply":
      return {
        workflowId: command.workflowId,
        outputLayerId: command.outputLayer.id,
        ...(command.replaceLayerId ? { replaceLayerId: command.replaceLayerId } : {}),
        ...(command.manifest ? { manifestId: command.manifest.manifestId } : {}),
      };
    case "aoi.edit": {
      const validation = command.validation ?? validateDrawnGeometry(command.nextFeature.geometry);
      return {
        featureId: command.featureId,
        validationStatus: validation.status,
        validationIssueCodes: validation.issueCodes,
        geometryType: command.nextFeature.geometry.type,
      };
    }
    default:
      return {};
  }
}

function commandLayerIds(command: MapActionCommand): string[] {
  switch (command.kind) {
    case "layer.remove":
    case "layer.style":
    case "report.handoff":
      return [command.layerId];
    case "workflow.apply":
      return Array.from(new Set([
        command.outputLayer.id,
        ...(command.replaceLayerId ? [command.replaceLayerId] : []),
      ]));
    case "aoi.edit":
      return [];
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
    case "aoi.edit":
      return command.nextFeature.properties.label || command.featureId;
  }
}

let commandCounter = 0;
function createCommandId(): string {
  commandCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `mapcmd-${Date.now().toString(36)}-${commandCounter}-${random}`;
}
