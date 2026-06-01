import type {
  MapScientificQAIssue,
  MapScientificQAIssueCategory,
  MapScientificQAIssueSeverity,
  MapScientificQAState,
} from "@/services/map/MapScientificQA";
import {
  resolveOverlayLayerCrsSummary,
  resolveOverlayLayerSourceKind,
} from "../mapLayerMetadata";
import type { LayerSourceKind, OverlayLayerConfig } from "../mapTypes";

export type MapProblemSeverity = MapScientificQAIssueSeverity;

export type MapProblemKind =
  | "crs-blocker"
  | "geometry-validity"
  | "no-data"
  | "vertical-datum"
  | "temporal-metadata"
  | "source-provenance"
  | "external-provider"
  | "runtime-mode"
  | "schema"
  | "scale"
  | "workflow-readiness"
  | "publication-readiness"
  | "qa-caveat";

export type MapProblemActionKind =
  | "show-details"
  | "inspect-layer"
  | "declare-crs"
  | "repair-geometry"
  | "open-source"
  | "review-readiness"
  | "review-mode";

export interface MapProblemActionTarget {
  kind: MapProblemActionKind;
  label: string;
  targetId?: string;
  disabledReason?: string;
}

export interface MapProblemRow {
  id: string;
  kind: MapProblemKind;
  severity: MapProblemSeverity;
  title: string;
  affectedLabel: string;
  reason: string;
  actionTarget: MapProblemActionTarget;
  sourceLabel?: string;
  affectedLayerId?: string;
  affectedSourceId?: string;
  qaIssueId?: string;
  qaIssueCode?: string;
  qaCategory?: MapScientificQAIssueCategory;
}

export interface MapProblemGroup {
  severity: MapProblemSeverity;
  label: string;
  rows: MapProblemRow[];
}

export interface MapProblemsModel {
  rows: MapProblemRow[];
  groups: MapProblemGroup[];
  counts: Record<MapProblemSeverity, number>;
}

export interface BuildMapProblemsModelInput {
  qaState: MapScientificQAState | null;
  overlayLayers: OverlayLayerConfig[];
}

export const MAP_PROBLEM_SEVERITY_LABELS: Record<MapProblemSeverity, string> = {
  blocker: "Blocker",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const PROBLEM_SEVERITY_ORDER: readonly MapProblemSeverity[] = ["blocker", "error", "warning", "info"];

const PROBLEM_SEVERITY_RANK: Record<MapProblemSeverity, number> = {
  blocker: 0,
  error: 1,
  warning: 2,
  info: 3,
};

const PROBLEM_KIND_LABELS: Record<MapProblemKind, string> = {
  "crs-blocker": "CRS",
  "geometry-validity": "Geometry",
  "no-data": "NoData",
  "vertical-datum": "Vertical datum",
  "temporal-metadata": "Temporal metadata",
  "source-provenance": "Source/provenance",
  "external-provider": "External provider",
  "runtime-mode": "Mode label",
  schema: "Schema",
  scale: "Scale",
  "workflow-readiness": "Workflow readiness",
  "publication-readiness": "Publication readiness",
  "qa-caveat": "QA caveat",
};

function safeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "problem";
}

function layerById(layers: OverlayLayerConfig[]): Map<string, OverlayLayerConfig> {
  return new Map(layers.map((layer) => [layer.id, layer]));
}

function compactText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function sourceKindLabel(kind: LayerSourceKind): string {
  switch (kind) {
    case "demo":
      return "Demo / synthetic";
    case "external":
      return "External service";
    case "derived":
      return "Generated output";
    case "imported":
      return "Imported source";
    case "project":
    default:
      return "Project source";
  }
}

function resolveSourceLabel(layer: OverlayLayerConfig): string {
  const metadata = layer.metadata;
  return compactText(metadata?.externalService?.title)
    ?? compactText(metadata?.externalService?.layerName)
    ?? compactText(metadata?.externalService?.endpoint)
    ?? compactText(metadata?.importSource?.sourceName)
    ?? compactText(metadata?.datasetContext?.datasetTitle)
    ?? compactText(metadata?.datasetContext?.source)
    ?? compactText(metadata?.eoSource?.provider)
    ?? compactText(layer.provenance?.sourceName)
    ?? compactText(layer.provenance?.label)
    ?? sourceKindLabel(resolveOverlayLayerSourceKind(layer));
}

function actionTarget(kind: MapProblemActionKind, label: string, targetId?: string): MapProblemActionTarget {
  const action: MapProblemActionTarget = { kind, label };
  if (targetId) action.targetId = targetId;
  return action;
}

function problemKindForIssue(issue: MapScientificQAIssue): MapProblemKind {
  switch (issue.category) {
    case "crs":
      return "crs-blocker";
    case "geometry":
    case "geometry-type":
    case "coordinates":
      return "geometry-validity";
    case "missingness":
      return "no-data";
    case "temporal":
      return "temporal-metadata";
    case "lineage":
    case "source-provenance":
    case "attribution-license":
      return "source-provenance";
    case "sample-data":
      return "runtime-mode";
    case "schema":
      return "schema";
    case "scale":
      return "scale";
    case "workflow-readiness":
      return "workflow-readiness";
    case "export-readiness":
      return "publication-readiness";
    default:
      return "qa-caveat";
  }
}

function actionForIssue(issue: MapScientificQAIssue, kind: MapProblemKind): MapProblemActionTarget {
  if (kind === "crs-blocker" && (issue.code === "missing_crs" || issue.code === "unknown_crs")) {
    return actionTarget("declare-crs", "Declare CRS", issue.layerId);
  }
  if (kind === "geometry-validity") {
    return actionTarget("repair-geometry", "Repair geometry", issue.layerId);
  }
  if (kind === "source-provenance" || kind === "external-provider" || kind === "no-data") {
    return actionTarget("open-source", "Open source", issue.layerId);
  }
  if (kind === "runtime-mode") {
    return actionTarget("review-mode", "Review mode label", issue.layerId);
  }
  if (kind === "publication-readiness") {
    return actionTarget("review-readiness", "Review readiness", issue.layerId);
  }
  return actionTarget("show-details", "Open QA details", issue.layerId);
}

function affectedLabelForIssue(issue: MapScientificQAIssue, layers: Map<string, OverlayLayerConfig>): string {
  if (issue.layerName) return issue.layerName;
  if (issue.layerId) return layers.get(issue.layerId)?.name ?? issue.layerId;
  return "Visible map stack";
}

function problemFromIssue(issue: MapScientificQAIssue, layers: Map<string, OverlayLayerConfig>): MapProblemRow {
  const kind = problemKindForIssue(issue);
  const layer = issue.layerId ? layers.get(issue.layerId) : undefined;
  const row: MapProblemRow = {
    id: `qa-issue:${issue.id}`,
    kind,
    severity: issue.severity,
    title: issue.title,
    affectedLabel: affectedLabelForIssue(issue, layers),
    reason: issue.explanation,
    actionTarget: actionForIssue(issue, kind),
    qaIssueId: issue.id,
    qaIssueCode: issue.code,
    qaCategory: issue.category,
  };
  if (issue.layerId) row.affectedLayerId = issue.layerId;
  if (layer) {
    row.sourceLabel = resolveSourceLabel(layer);
    const sourceId = compactText(layer.metadata?.sourceId) ?? compactText(layer.metadata?.persistence?.sourceId);
    if (sourceId) row.affectedSourceId = sourceId;
  }
  return row;
}

function makeLayerProblem(input: {
  layer: OverlayLayerConfig;
  kind: MapProblemKind;
  severity: MapProblemSeverity;
  code: string;
  title: string;
  reason: string;
  action: MapProblemActionTarget;
}): MapProblemRow {
  const sourceId = compactText(input.layer.metadata?.sourceId) ?? compactText(input.layer.metadata?.persistence?.sourceId);
  const row: MapProblemRow = {
    id: `layer:${input.layer.id}:${safeId(input.code)}`,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    affectedLabel: input.layer.name,
    affectedLayerId: input.layer.id,
    sourceLabel: resolveSourceLabel(input.layer),
    reason: input.reason,
    actionTarget: input.action,
  };
  if (sourceId) row.affectedSourceId = sourceId;
  return row;
}

function issueExists(rows: MapProblemRow[], layerId: string, code: string): boolean {
  return rows.some((row) => row.affectedLayerId === layerId && row.qaIssueCode === code);
}

function issueKindExists(rows: MapProblemRow[], layerId: string, kind: MapProblemKind): boolean {
  return rows.some((row) => row.affectedLayerId === layerId && row.kind === kind);
}

function allLayerCaveats(layer: OverlayLayerConfig): string[] {
  const metadata = layer.metadata;
  return [
    ...(metadata?.importSource?.caveats ?? []),
    ...(metadata?.externalService?.caveats ?? []),
    ...(metadata?.raster?.caveats ?? []),
    ...(metadata?.vectorTiles?.caveats ?? []),
    ...(metadata?.temporalEvidence?.caveats ?? []),
    ...(metadata?.temporalEvidence?.qa.caveats ?? []),
    ...(metadata?.temporalEvidence?.qa.uncertaintyNotes ?? []),
    ...(metadata?.voxCitySync?.caveats ?? []),
    ...(metadata?.voxCitySync?.projection.assumptions ?? []),
    ...(metadata?.voxCitySync?.qa.caveats ?? []),
    ...(metadata?.voxCitySync?.qa.uncertaintyNotes ?? []),
    ...(metadata?.publicationReadiness?.caveats ?? []),
    ...(metadata?.registry?.publicationReadiness.caveats ?? []),
    ...(metadata?.crsSummary?.notes ?? []),
    ...(metadata?.registry?.crsSummary.notes ?? []),
  ].map((entry) => entry.trim()).filter(Boolean);
}

function addSupplementalLayerProblems(rows: MapProblemRow[], layer: OverlayLayerConfig): void {
  const crsSummary = resolveOverlayLayerCrsSummary(layer);
  if (crsSummary.status !== "known" && !issueExists(rows, layer.id, "missing_crs")) {
    rows.push(makeLayerProblem({
      layer,
      kind: "crs-blocker",
      severity: "warning",
      code: "missing-crs-metadata",
      title: "Missing CRS metadata",
      reason: crsSummary.notes[0] ?? "CRS is not declared; analytical distance and area claims require projection metadata.",
      action: actionTarget("declare-crs", "Declare CRS", layer.id),
    }));
  }

  if (crsSummary.source === "user-declared") {
    rows.push(makeLayerProblem({
      layer,
      kind: "crs-blocker",
      severity: "warning",
      code: "user-declared-crs-caveat",
      title: "User-declared CRS remains caveated",
      reason: crsSummary.notes[0] ?? "The CRS was asserted by a user and has not been verified from source metadata.",
      action: actionTarget("declare-crs", "Review CRS declaration", layer.id),
    }));
  }

  const raster = layer.metadata?.raster;
  if (raster) {
    rows.push(makeLayerProblem({
      layer,
      kind: "no-data",
      severity: "warning",
      code: raster.noData == null ? "raster-nodata-missing" : "raster-nodata-present",
      title: raster.noData == null ? "Raster noData metadata is missing" : "Raster noData class must stay visible",
      reason: raster.noData == null
        ? "The raster source does not declare a noData value, so missing pixels cannot be audited before analysis or export."
        : `The raster declares noData=${raster.noData}; legends, reports, and analysis caveats must keep that class visible.`,
      action: actionTarget("open-source", "Inspect raster source", layer.id),
    }));

    if (raster.sampled) {
      rows.push(makeLayerProblem({
        layer,
        kind: "no-data",
        severity: "warning",
        code: "raster-sampled-statistics",
        title: "Raster statistics are sampled",
        reason: `Raster evidence uses a ${raster.sampleWidth}x${raster.sampleHeight} sample; full-resolution statistics should carry a caveat until computed.`,
        action: actionTarget("open-source", "Inspect raster source", layer.id),
      }));
    }
  }

  const externalService = layer.metadata?.externalService;
  if (externalService) {
    const dependencyStatus = externalService.dependencyStatus ?? "unknown";
    const severity: MapProblemSeverity = dependencyStatus === "offline"
      ? "error"
      : dependencyStatus === "stale" || dependencyStatus === "unknown"
        ? "warning"
        : "info";
    rows.push(makeLayerProblem({
      layer,
      kind: "external-provider",
      severity,
      code: `external-provider-${dependencyStatus}`,
      title: "External provider dependency",
      reason: externalService.offlineReason
        ?? externalService.caveats?.[0]
        ?? `External ${externalService.kind.toUpperCase()} source status is ${dependencyStatus}; provider, CORS, rate-limit, and attribution caveats remain review requirements.`,
      action: actionTarget("open-source", "Open provider details", layer.id),
    }));
  }

  const restoreState = layer.metadata?.persistence?.restoreState;
  if (restoreState === "metadata-only" || restoreState === "stale-reference" || restoreState === "external-reference") {
    rows.push(makeLayerProblem({
      layer,
      kind: "source-provenance",
      severity: restoreState === "metadata-only" ? "warning" : "info",
      code: `source-restore-${restoreState}`,
      title: restoreState === "metadata-only" ? "Metadata-only source" : "Source restore caveat",
      reason: layer.metadata?.persistence?.restoreWarnings[0]
        ?? `Source restore state is ${restoreState}; source bytes are not treated as silently available.`,
      action: actionTarget("open-source", "Open source health", layer.id),
    }));
  }

  const sourceKind = resolveOverlayLayerSourceKind(layer);
  const isDemo = sourceKind === "demo" || layer.metadata?.datasetContext?.isDemo === true || layer.metadata?.eoSource?.isDemo === true;
  if (isDemo) {
    rows.push(makeLayerProblem({
      layer,
      kind: "runtime-mode",
      severity: "warning",
      code: "demo-synthetic-mode",
      title: "Demo / synthetic mode",
      reason: "This layer is demo or synthetic data and must not be presented as observational project evidence.",
      action: actionTarget("review-mode", "Review mode label", layer.id),
    }));
  } else if (sourceKind === "derived" || layer.group === "analysis" || layer.metadata?.analysisResult) {
    rows.push(makeLayerProblem({
      layer,
      kind: "runtime-mode",
      severity: "info",
      code: "generated-analysis-output",
      title: "Generated analytical output",
      reason: "This layer is generated from an analytical process; lineage and source layer references must stay attached before publication.",
      action: actionTarget("review-mode", "Review lineage", layer.id),
    }));
  }

  const verticalCaveat = allLayerCaveats(layer).find((entry) => /vertical|datum/i.test(entry));
  if (verticalCaveat) {
    rows.push(makeLayerProblem({
      layer,
      kind: "vertical-datum",
      severity: "warning",
      code: "vertical-datum-caveat",
      title: "Vertical datum caveat",
      reason: verticalCaveat,
      action: actionTarget("open-source", "Inspect vertical assumptions", layer.id),
    }));
  }

  const temporal = layer.metadata?.temporalEvidence;
  if (temporal && (temporal.sourceFields.length === 0 || !temporal.timeField || temporal.qa.caveats.length > 0)) {
    rows.push(makeLayerProblem({
      layer,
      kind: "temporal-metadata",
      severity: temporal.qa.state === "blocked" ? "error" : "warning",
      code: "temporal-metadata-gap",
      title: "Temporal metadata needs review",
      reason: temporal.qa.caveats[0]
        ?? temporal.caveats[0]
        ?? "Temporal playback metadata is incomplete; source fields and time field should be auditable before temporal comparison.",
      action: actionTarget("open-source", "Inspect temporal metadata", layer.id),
    }));
  }

  const readiness = layer.metadata?.publicationReadiness ?? layer.metadata?.registry?.publicationReadiness;
  if (readiness?.status === "blocked" && !issueKindExists(rows, layer.id, "publication-readiness")) {
    const missingField = readiness.missingFields[0];
    rows.push(makeLayerProblem({
      layer,
      kind: "publication-readiness",
      severity: "error",
      code: "publication-readiness-blocked",
      title: "Publication readiness blocked",
      reason: readiness.caveats[0]
        ?? (missingField ? `Publication readiness is blocked by ${missingField}.` : "Publication readiness is blocked by QA or missing metadata."),
      action: actionTarget("review-readiness", "Review readiness", layer.id),
    }));
  }
}

function dedupeRows(rows: MapProblemRow[]): MapProblemRow[] {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

function sortRows(rows: MapProblemRow[]): MapProblemRow[] {
  return [...rows].sort((left, right) => {
    const severityDiff = PROBLEM_SEVERITY_RANK[left.severity] - PROBLEM_SEVERITY_RANK[right.severity];
    if (severityDiff !== 0) return severityDiff;
    const affectedDiff = left.affectedLabel.localeCompare(right.affectedLabel);
    if (affectedDiff !== 0) return affectedDiff;
    return left.title.localeCompare(right.title);
  });
}

function buildGroups(rows: MapProblemRow[]): MapProblemGroup[] {
  return PROBLEM_SEVERITY_ORDER
    .map((severity) => ({
      severity,
      label: MAP_PROBLEM_SEVERITY_LABELS[severity],
      rows: rows.filter((row) => row.severity === severity),
    }))
    .filter((group) => group.rows.length > 0);
}

export function getMapProblemKindLabel(kind: MapProblemKind): string {
  return PROBLEM_KIND_LABELS[kind];
}

export function buildMapProblemsModel(input: BuildMapProblemsModelInput): MapProblemsModel {
  const layers = layerById(input.overlayLayers);
  const rows = input.qaState?.issues.map((issue) => problemFromIssue(issue, layers)) ?? [];

  for (const layer of input.overlayLayers) {
    addSupplementalLayerProblems(rows, layer);
  }

  const sortedRows = sortRows(dedupeRows(rows));
  return {
    rows: sortedRows,
    groups: buildGroups(sortedRows),
    counts: {
      blocker: sortedRows.filter((row) => row.severity === "blocker").length,
      error: sortedRows.filter((row) => row.severity === "error").length,
      warning: sortedRows.filter((row) => row.severity === "warning").length,
      info: sortedRows.filter((row) => row.severity === "info").length,
    },
  };
}