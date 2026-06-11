import type maplibregl from "maplibre-gl";

import type { OverlayLayerConfig } from "../mapTypes";
import { resolveOverlayLayerCrsSummary } from "../mapLayerMetadata";
import type { GisStatusKey } from "../mapTokens";
import type {
  MapPublishInventoryEntry,
  MapPublishReadinessItem,
  MapPublishTabId,
} from "../publish";
import {
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  type MapCompositionOptions,
  type MapPublicationReadiness,
  type MapPublicationReadinessCheck,
  type MapPublicationReadinessCriterion,
  type MapPublicationReadinessSeverity,
} from "../../../../services/map/MapExportService";
import type { MapExportTarget } from "../../../../services/map/MapDataExporter";
import type { SourceHandle } from "../../../../services/map/contracts/gisContracts";
import type {
  MapReportHandoffOptions,
  MapReportHandoffSource,
} from "../../../../services/map/MapReportHandoffService";

export function readinessSeverityToGisStatus(status: MapPublicationReadinessSeverity): GisStatusKey {
  if (status === "blocked") return "blocked";
  if (status === "warning") return "caveat";
  return "ready";
}

export function findReadinessCheck(
  readiness: MapPublicationReadiness,
  criterion: MapPublicationReadinessCriterion,
): MapPublicationReadinessCheck | null {
  return readiness.checks.find((check) => check.criterion === criterion) ?? null;
}

function publishReadinessItem(input: {
  id: string;
  label: string;
  status: GisStatusKey;
  detail: string;
  required?: boolean | undefined;
  title?: string | undefined;
}): MapPublishReadinessItem {
  const item: MapPublishReadinessItem = {
    id: input.id,
    label: input.label,
    status: input.status,
    detail: input.detail,
  };
  if (input.required !== undefined) item.required = input.required;
  if (input.title?.trim()) item.title = input.title.trim();
  return item;
}

function publishReadinessItemFromCheck(input: {
  id: string;
  label: string;
  readiness: MapPublicationReadiness;
  criterion: MapPublicationReadinessCriterion;
  fallbackDetail: string;
  required?: boolean | undefined;
}): MapPublishReadinessItem {
  const check = findReadinessCheck(input.readiness, input.criterion);
  return publishReadinessItem({
    id: input.id,
    label: input.label,
    status: check ? readinessSeverityToGisStatus(check.status) : "unknown",
    detail: check?.message ?? input.fallbackDetail,
    required: input.required ?? check?.required,
    title: check?.recommendedFix,
  });
}

export function uniquePublishStrings(values: readonly (string | null | undefined)[], limit = 12): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= limit) break;
  }
  return result;
}

export function collectLayerEvidenceIds(layer: OverlayLayerConfig): string[] {
  return uniquePublishStrings([
    layer.metadata?.evidenceArtifactId,
    layer.metadata?.analysisResult?.evidenceArtifactId,
    layer.metadata?.registry?.evidenceArtifactId,
  ], 8);
}

export function formatCompactList(values: readonly string[], emptyLabel: string, limit = 3): string {
  if (values.length === 0) return emptyLabel;
  const head = values.slice(0, limit).join(", ");
  const remainder = values.length - limit;
  return remainder > 0 ? `${head}, +${remainder}` : head;
}

export function formatPublishBounds(bounds: [number, number, number, number] | null | undefined): string {
  if (!bounds) return "Current view bounds not captured yet";
  return bounds.map((value) => value.toFixed(5).replace(/0+$/g, "").replace(/\.$/, "")).join(", ");
}

export function buildPublishReadinessItems(input: {
  readiness: MapPublicationReadiness;
  visibleLayers: OverlayLayerConfig[];
  composition: MapCompositionOptions;
  evidenceIds: readonly string[];
}): MapPublishReadinessItem[] {
  const crsSummaries = input.visibleLayers.map((layer) => resolveOverlayLayerCrsSummary(layer));
  const knownCrsValues = uniquePublishStrings(crsSummaries.map((summary) => summary.crs), 6);
  const missingCrsCount = crsSummaries.filter((summary) => summary.status !== "known").length;
  const crsCheck = findReadinessCheck(input.readiness, "crs-measurement");
  const crsDetail = [
    knownCrsValues.length > 0 ? `CRS: ${formatCompactList(knownCrsValues, "none")}.` : "CRS: no declared layer CRS.",
    missingCrsCount > 0 ? `${missingCrsCount} visible layer${missingCrsCount === 1 ? "" : "s"} missing CRS readiness.` : null,
    crsCheck?.message,
  ].filter((value): value is string => Boolean(value)).join(" ");
  const caveatDetail = input.readiness.caveats.length > 0
    ? `${input.readiness.caveats.length} QA/source caveat${input.readiness.caveats.length === 1 ? "" : "s"} will travel with the output.`
    : input.readiness.warnings.length > 0
      ? `${input.readiness.warnings.length} readiness warning${input.readiness.warnings.length === 1 ? "" : "s"} will be reviewed before output.`
      : "No QA caveat is currently required by publication readiness.";
  const caveatStatus: GisStatusKey =
    input.readiness.blockers.length > 0
      ? "blocked"
      : input.readiness.caveats.length > 0 || input.readiness.warnings.length > 0
        ? "caveat"
        : "ready";
  const evidenceDetail = input.evidenceIds.length > 0
    ? `${input.evidenceIds.length} evidence ID${input.evidenceIds.length === 1 ? "" : "s"}: ${formatCompactList(input.evidenceIds, "none", 4)}.`
    : "No evidence IDs are attached; output will rely on layer and project metadata only.";

  return [
    publishReadinessItemFromCheck({
      id: "title",
      label: "Title",
      readiness: input.readiness,
      criterion: "title",
      fallbackDetail: input.composition.title.trim() ? `Title recorded: ${input.composition.title.trim()}.` : "A publication title is required.",
      required: true,
    }),
    publishReadinessItemFromCheck({
      id: "visible-layers",
      label: "Visible layers",
      readiness: input.readiness,
      criterion: "visible-layer",
      fallbackDetail: `${input.visibleLayers.length} visible layer${input.visibleLayers.length === 1 ? "" : "s"}.`,
      required: true,
    }),
    publishReadinessItem({
      id: "crs",
      label: "CRS",
      status: crsCheck ? readinessSeverityToGisStatus(crsCheck.status) : missingCrsCount > 0 ? "caveat" : "ready",
      detail: crsDetail,
      required: true,
      title: crsCheck?.recommendedFix,
    }),
    publishReadinessItemFromCheck({
      id: "legend",
      label: "Legend",
      readiness: input.readiness,
      criterion: "legend",
      fallbackDetail: input.composition.includeLegend ? "Legend is enabled." : "Legend is disabled.",
      required: true,
    }),
    publishReadinessItemFromCheck({
      id: "scale-bar",
      label: "Scale bar",
      readiness: input.readiness,
      criterion: "scale-bar",
      fallbackDetail: input.composition.includeScaleBar ? "Scale bar is enabled." : "Scale bar is disabled.",
      required: true,
    }),
    publishReadinessItemFromCheck({
      id: "north-arrow",
      label: "North arrow",
      readiness: input.readiness,
      criterion: "north-arrow",
      fallbackDetail: input.composition.includeNorthArrow ? "North arrow is enabled." : "North arrow is disabled.",
      required: true,
    }),
    publishReadinessItemFromCheck({
      id: "attribution",
      label: "Attribution",
      readiness: input.readiness,
      criterion: "attribution-license",
      fallbackDetail: input.composition.includeAttribution ? "Attribution is enabled." : "Attribution is disabled.",
      required: true,
    }),
    publishReadinessItem({
      id: "qa-caveats",
      label: "QA caveats",
      status: caveatStatus,
      detail: caveatDetail,
      title: input.readiness.caveats.slice(0, 4).join(" "),
    }),
    publishReadinessItem({
      id: "evidence-ids",
      label: "Evidence IDs",
      status: input.evidenceIds.length > 0 ? "ready" : "caveat",
      detail: evidenceDetail,
    }),
  ];
}

function restoreStatusToGisStatus(status: SourceHandle["restoreStatus"]): GisStatusKey {
  if (status === "restored") return "ready";
  if (status === "unavailable") return "blocked";
  return "caveat";
}

function isVectorExportableLayer(layer: OverlayLayerConfig): boolean {
  return (layer.type === "geojson" || layer.type === "heatmap") && Boolean(layer.sourceData);
}

function layerCrsLabel(layer: OverlayLayerConfig): string {
  const summary = resolveOverlayLayerCrsSummary(layer);
  if (summary.status === "known" && summary.crs) return summary.crs;
  if (summary.crs) return `${summary.crs} (${summary.status})`;
  return "CRS missing";
}

function layerInventoryDetail(layer: OverlayLayerConfig): string {
  const geometry = layer.metadata?.geometryType ?? layer.type;
  const featureCount = typeof layer.metadata?.featureCount === "number"
    ? `${layer.metadata.featureCount.toLocaleString()} features`
    : null;
  return [geometry, featureCount, layerCrsLabel(layer)].filter(Boolean).join(" · ");
}

function layerProvenanceCaveats(layer: OverlayLayerConfig): string[] {
  const out: string[] = [];
  const crs = resolveOverlayLayerCrsSummary(layer);
  if (crs.status !== "known") {
    out.push(`${layer.name}: CRS ${crs.status === "user-declared" ? "is user-declared (caveat)" : "is missing"}.`);
  }
  const qa = String(layer.qaStatus ?? "").toLowerCase();
  if (qa === "blocked" || qa === "failed") {
    out.push(`${layer.name}: QA is ${qa}.`);
  }
  return out;
}

function shortPublishId(value: string, max = 30): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function buildDataExportInventory(input: {
  overlayLayers: OverlayLayerConfig[];
  target: MapExportTarget;
  pinCount: number;
  drawingCount: number;
}): { included: MapPublishInventoryEntry[]; excluded: MapPublishInventoryEntry[]; caveats: string[] } {
  const included: MapPublishInventoryEntry[] = [];
  const excluded: MapPublishInventoryEntry[] = [];
  const caveats: string[] = [];

  if (input.target === "pins") {
    if (input.pinCount > 0) {
      included.push({ id: "pins", label: "Pins", status: "ready", detail: `${input.pinCount.toLocaleString()} pin(s) → Point features.` });
    } else {
      excluded.push({ id: "pins", label: "Pins", status: "caveat", detail: "No pins placed to export." });
    }
    return { included, excluded, caveats };
  }
  if (input.target === "drawings") {
    if (input.drawingCount > 0) {
      included.push({ id: "drawings", label: "Drawings", status: "ready", detail: `${input.drawingCount.toLocaleString()} drawn feature(s).` });
    } else {
      excluded.push({ id: "drawings", label: "Drawings", status: "caveat", detail: "No drawn features to export." });
    }
    return { included, excluded, caveats };
  }

  let hiddenCount = 0;
  for (const layer of input.overlayLayers) {
    if (!layer.visible) {
      hiddenCount += 1;
      continue;
    }
    if (isVectorExportableLayer(layer)) {
      included.push({ id: layer.id, label: layer.name, status: "ready", detail: layerInventoryDetail(layer) });
      caveats.push(...layerProvenanceCaveats(layer));
    } else {
      const reason = !(layer.type === "geojson" || layer.type === "heatmap")
        ? `${layer.type} layer — not vector-exportable to GeoJSON/GeoParquet.`
        : "No in-memory source geometry; reload the source before export.";
      excluded.push({ id: layer.id, label: layer.name, status: "caveat", detail: reason });
    }
  }
  if (hiddenCount > 0) {
    excluded.push({
      id: "hidden-layers",
      label: `${hiddenCount} hidden layer${hiddenCount === 1 ? "" : "s"}`,
      status: "caveat",
      detail: "Hidden layers are not part of a visible-layers data export.",
    });
  }
  return { included, excluded, caveats: uniquePublishStrings(caveats, 6) };
}

function isOfflineEmbeddableLayer(layer: OverlayLayerConfig): boolean {
  const persistence = layer.metadata?.persistence?.sourcePersistence ?? (layer.sourceData ? "inline" : "metadata");
  return persistence === "inline" && Boolean(layer.sourceData);
}

export function buildOfflinePackageInventory(input: {
  overlayLayers: OverlayLayerConfig[];
  sourceHandles: readonly SourceHandle[];
}): {
  included: MapPublishInventoryEntry[];
  excluded: MapPublishInventoryEntry[];
  sourceRestore: MapPublishInventoryEntry[];
  caveats: string[];
} {
  const included: MapPublishInventoryEntry[] = [];
  const excluded: MapPublishInventoryEntry[] = [];
  const caveats: string[] = [];

  for (const layer of input.overlayLayers) {
    if (isOfflineEmbeddableLayer(layer)) {
      included.push({ id: layer.id, label: layer.name, status: "ready", detail: "Inline source — embedded only if ≤ 1 MB; otherwise referenced." });
    } else {
      const reason = layer.sourceData
        ? "Non-inline source — referenced, not embedded; not recoverable from the package alone."
        : "Metadata-only / external source — referenced, not recoverable from the package alone.";
      excluded.push({ id: layer.id, label: layer.name, status: "caveat", detail: reason });
    }
  }

  const sourceRestore: MapPublishInventoryEntry[] = input.sourceHandles.map((handle) => ({
    id: handle.sourceId,
    label: shortPublishId(handle.sourceId),
    status: restoreStatusToGisStatus(handle.restoreStatus),
    detail: `${handle.storageMode} · ${handle.restoreStatus}${handle.caveats[0] ? ` · ${handle.caveats[0]}` : ""}`,
  }));

  for (const handle of input.sourceHandles) {
    caveats.push(...handle.caveats);
  }
  if (excluded.length > 0) {
    caveats.push("Referenced (non-embedded) sources require the original file or service on restore; they are not recoverable from the package alone.");
  }
  return { included, excluded, sourceRestore, caveats: uniquePublishStrings(caveats, 6) };
}

export function buildReportHandoffInventory(input: {
  overlayLayers: OverlayLayerConfig[];
  snapshotCaptured: boolean;
  readinessCaveats: readonly string[];
}): { included: MapPublishInventoryEntry[]; excluded: MapPublishInventoryEntry[]; caveats: string[] } {
  const included: MapPublishInventoryEntry[] = [];
  const excluded: MapPublishInventoryEntry[] = [];
  let hiddenCount = 0;

  for (const layer of input.overlayLayers) {
    if (layer.visible) {
      included.push({ id: layer.id, label: layer.name, status: "ready", detail: `Rendered into the report snapshot image · ${layerCrsLabel(layer)}.` });
    } else {
      hiddenCount += 1;
    }
  }
  if (hiddenCount > 0) {
    excluded.push({
      id: "hidden-layers",
      label: `${hiddenCount} hidden layer${hiddenCount === 1 ? "" : "s"}`,
      status: "caveat",
      detail: "Hidden layers do not appear in the report snapshot.",
    });
  }

  const caveats: string[] = [...input.readinessCaveats];
  if (!input.snapshotCaptured) {
    caveats.unshift("Report snapshot is metadata-only until a snapshot image is captured; no map image is embedded yet.");
  }
  return { included, excluded, caveats: uniquePublishStrings(caveats, 6) };
}

export function publishTabLabel(tabId: MapPublishTabId): string {
  if (tabId === "publish-data-export") return "Data Export";
  if (tabId === "publish-report") return "Report";
  if (tabId === "publish-offline-package") return "Offline Package";
  if (tabId === "publish-review-package") return "Review Package";
  return "Figure";
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getReportHandoffPageDimensionsMm(
  frame: MapReportHandoffOptions["snapshotFrame"],
  map: maplibregl.Map | null,
): { width: number; height: number } {
  if (frame === "landscape") return { width: 297, height: 210 };
  if (frame === "portrait") return { width: 210, height: 297 };
  if (frame === "square") return { width: 240, height: 240 };

  const rect = map?.getContainer().getBoundingClientRect();
  const aspect = rect && rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 16 / 9;
  const height = 210;
  return {
    width: clampNumber(Math.round(height * aspect), 180, 380),
    height,
  };
}

export function buildReportHandoffComposition(
  source: MapReportHandoffSource,
  options: MapReportHandoffOptions,
  map: maplibregl.Map | null,
): MapCompositionOptions {
  const dimensions = getReportHandoffPageDimensionsMm(options.snapshotFrame, map);
  return {
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
    format: "png",
    dpi: 72,
    pageSize: "custom",
    customWidthMm: dimensions.width,
    customHeightMm: dimensions.height,
    mapFit: options.snapshotFit,
    title: source.title ?? "Map report handoff",
    subtitle: `${source.scope.replace("-", " ")} evidence snapshot`,
    includeInsetMap: false,
  };
}
