import { openNewTab as ideOpenNewTab, type SupportedLang } from "@/services/editorBridge";
import { busTimestamp, synapseBus } from "@/services/synapseBus";
import { createMapEvidenceArtifact } from "@/centerpanel/components/map/mapEvidenceArtifacts";
import type {
  MapEvidenceArtifact,
  MapEvidenceQA,
  MapEvidenceScalar,
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import type {
  MapCompositionOptions,
  MapPublicationReadiness,
} from "./MapExportService";
import type { MapScientificQAState } from "./MapScientificQA";

export const MAP_CODE_ARTIFACT_REQUEST_VERSION = 1;
export const MAX_MAP_CODE_ARTIFACT_BYTES = 32 * 1024;

const MAX_LAYER_COUNT = 48;
const MAX_TEXT_LIST = 24;

export type MapCodeArtifactKind =
  | "workflow-script"
  | "workflow-notebook"
  | "map-manifest"
  | "sql-query"
  | "export-package-note";

export type MapCodeArtifactLanguage = "python" | "json" | "markdown" | "sql";

export interface MapCodeArtifactAoiReference {
  aoiId: string | null;
  label: string | null;
  bbox: [number, number, number, number] | null;
  source: "active-aoi" | "map-view" | "none";
}

export interface MapCodeArtifactLayerReference {
  layerId: string;
  name: string;
  visible: boolean;
  sourceKind: string | null;
  geometryType: string | null;
  featureCount: number | null;
  crs: string | null;
  qaStatus: string | null;
  evidenceArtifactId: string | null;
  workerTableName: string | null;
}

export interface MapCodeArtifactProvenance {
  sourceModule: "map-explorer";
  generatedAt: string;
  mapContextId: string;
  sourceSummary: string;
  layerIds: string[];
  layerReferences: MapCodeArtifactLayerReference[];
  aoiReference: MapCodeArtifactAoiReference;
  workflowId: string | null;
  runId: string | null;
  publicationReadinessStatus: string | null;
  qaStatus: string | null;
  qaIssueIds: string[];
  caveats: string[];
  sourceEvidenceArtifactIds: string[];
  crsByLayer: Array<{ layerId: string; crs: string | null }>;
}

export interface MapCodeArtifactRequest {
  version: typeof MAP_CODE_ARTIFACT_REQUEST_VERSION;
  artifactId: string;
  requestId: string;
  kind: MapCodeArtifactKind;
  title: string;
  summary: string;
  layerIds: string[];
  aoiReference: MapCodeArtifactAoiReference;
  workflowId: string | null;
  language: MapCodeArtifactLanguage;
  targetFileSuggestion: string;
  content: string;
  provenance: MapCodeArtifactProvenance;
  safetyNotes: string[];
  evidenceArtifact: MapEvidenceArtifact;
}

export interface MapCodeArtifactRequestInput {
  contextSummary: MapExplorerContextSummary;
  overlayLayers: readonly OverlayLayerConfig[];
  mapEvidenceArtifacts?: readonly MapEvidenceArtifact[];
  scientificQA?: MapScientificQAState | null;
  requestedLayerId?: string | null;
  workflowManifest?: MapReproducibilityManifest | null;
  publicationReadiness?: MapPublicationReadiness | null;
  compositionOptions?: MapCompositionOptions | null;
  now?: string;
}

export interface MapCodeArtifactSizeAssessment {
  bytes: number;
  withinBudget: boolean;
  budget: number;
}

export interface DispatchMapCodeArtifactRequestOptions {
  routeThroughBridge?: boolean;
  publishEvidenceEvent?: boolean;
}

export interface DispatchMapCodeArtifactRequestResult {
  artifactId: string;
  evidenceArtifactId: string;
  tabId: string | null;
  bytes: number;
  bridgeRouted: boolean;
  evidenceEventPublished: boolean;
}

const BRIDGE_LANGUAGE: Record<MapCodeArtifactLanguage, SupportedLang> = {
  python: "python",
  json: "json",
  markdown: "markdown",
  sql: "sql",
};

function utf8ByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

export function assessMapCodeArtifactRequestSize(
  request: Pick<MapCodeArtifactRequest, "content">,
): MapCodeArtifactSizeAssessment {
  const bytes = utf8ByteLength(request.content);
  return {
    bytes,
    withinBudget: bytes <= MAX_MAP_CODE_ARTIFACT_BYTES,
    budget: MAX_MAP_CODE_ARTIFACT_BYTES,
  };
}

function uniqueStrings(values: Iterable<string | null | undefined>, limit = MAX_TEXT_LIST): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= limit) break;
  }
  return result;
}

function safeSlug(value: string | null | undefined, fallback: string): string {
  const slug = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return slug || fallback;
}

function stampFromIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safeSlug(value, "now");
  const pad = (entry: number) => `${entry}`.padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}_${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;
}

function nowIso(value: string | undefined): string {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function quoteSql(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function getLayerCrs(layer: OverlayLayerConfig): string | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  return registry.crsSummary.crs ?? null;
}

function getGeometryType(layer: OverlayLayerConfig): string | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  return registry.geometrySummary.geometryType ?? layer.metadata?.geometryType ?? null;
}

function getFeatureCount(layer: OverlayLayerConfig): number | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  return registry.geometrySummary.featureCount ?? layer.metadata?.featureCount ?? null;
}

function layerReference(layer: OverlayLayerConfig): MapCodeArtifactLayerReference {
  const registry = normalizeLayerRegistryMetadata(layer);
  return {
    layerId: layer.id,
    name: layer.name,
    visible: layer.visible,
    sourceKind: layer.sourceKind ?? registry.sourceKind ?? null,
    geometryType: getGeometryType(layer),
    featureCount: getFeatureCount(layer),
    crs: getLayerCrs(layer),
    qaStatus: layer.qaStatus ?? registry.qaStatus ?? null,
    evidenceArtifactId: layer.metadata?.evidenceArtifactId ?? registry.evidenceArtifactId ?? null,
    workerTableName: layer.metadata?.columnar?.workerTableName ?? null,
  };
}

function resolveRequestLayers(input: MapCodeArtifactRequestInput): OverlayLayerConfig[] {
  const requestedLayer = input.requestedLayerId
    ? input.overlayLayers.find((layer) => layer.id === input.requestedLayerId)
    : null;
  if (requestedLayer) return [requestedLayer];

  const manifestLayerIds = uniqueStrings([
    ...(input.workflowManifest?.sourceLayerIds ?? []),
    ...(input.workflowManifest?.outputLayerIds ?? []),
  ], MAX_LAYER_COUNT);
  if (manifestLayerIds.length > 0) {
    const manifestLayers = input.overlayLayers.filter((layer) => manifestLayerIds.includes(layer.id));
    if (manifestLayers.length > 0) return manifestLayers.slice(0, MAX_LAYER_COUNT);
  }

  return input.overlayLayers.filter((layer) => layer.visible).slice(0, MAX_LAYER_COUNT);
}

function buildAoiReference(contextSummary: MapExplorerContextSummary): MapCodeArtifactAoiReference {
  if (contextSummary.activeAoi) {
    return {
      aoiId: contextSummary.activeAoi.aoiId,
      label: contextSummary.activeAoi.aoiId,
      bbox: contextSummary.activeAoi.bbox ?? null,
      source: "active-aoi",
    };
  }
  if (contextSummary.currentBounds) {
    return {
      aoiId: null,
      label: "Current map view",
      bbox: contextSummary.currentBounds,
      source: "map-view",
    };
  }
  return {
    aoiId: null,
    label: null,
    bbox: null,
    source: "none",
  };
}

function qaIssueIds(input: MapCodeArtifactRequestInput, layerIds: readonly string[]): string[] {
  const qaIds = input.scientificQA?.issues
    .filter((issue) => !issue.layerId || layerIds.includes(issue.layerId))
    .map((issue) => issue.id) ?? [];
  const contextIssueCounts = Object.entries(input.contextSummary.qa.issueCounts)
    .filter(([, count]) => count > 0)
    .map(([severity, count]) => `map-context-${severity}-${count}`);
  return uniqueStrings([...qaIds, ...contextIssueCounts], 64);
}

function qaCaveats(input: MapCodeArtifactRequestInput, layerIds: readonly string[]): string[] {
  const issueCaveats = input.scientificQA?.issues
    .filter((issue) => !issue.layerId || layerIds.includes(issue.layerId))
    .map((issue) => issue.explanation || issue.title) ?? [];
  const layerCaveats = input.overlayLayers
    .filter((layer) => layerIds.includes(layer.id))
    .flatMap((layer) => [
      ...(layer.metadata?.scientificQA?.caveats ?? []),
      ...(layer.metadata?.publicationReadiness?.caveats ?? []),
      ...(layer.metadata?.reproducibilityManifest?.qaSummary.caveats ?? []),
    ]);
  const readinessCaveats = input.publicationReadiness?.caveats ?? [];
  return uniqueStrings([...issueCaveats, ...layerCaveats, ...readinessCaveats], 24);
}

function sourceEvidenceArtifactIds(
  layerReferences: readonly MapCodeArtifactLayerReference[],
  artifacts: readonly MapEvidenceArtifact[] | undefined,
): string[] {
  return uniqueStrings([
    ...layerReferences.map((layer) => layer.evidenceArtifactId),
    ...(artifacts ?? [])
      .filter((artifact) => artifact.kind !== "ide-code-reference")
      .flatMap((artifact) => artifact.linkedLayerIds.some((layerId) => layerReferences.some((layer) => layer.layerId === layerId))
        ? [artifact.artifactId]
        : []),
  ], 48);
}

function buildProvenance(input: MapCodeArtifactRequestInput, generatedAt: string): MapCodeArtifactProvenance {
  const layers = resolveRequestLayers(input);
  const layerReferences = layers.map(layerReference);
  const layerIds = layerReferences.map((layer) => layer.layerId);
  const caveats = qaCaveats(input, layerIds);
  return {
    sourceModule: "map-explorer",
    generatedAt,
    mapContextId: input.contextSummary.contextId,
    sourceSummary: `${layerIds.length} layer reference(s), AOI ${input.contextSummary.activeAoi?.aoiId ?? "map view"}, QA ${input.scientificQA?.status ?? input.contextSummary.qa.status ?? "unchecked"}`,
    layerIds,
    layerReferences,
    aoiReference: buildAoiReference(input.contextSummary),
    workflowId: input.workflowManifest?.workflowId ?? null,
    runId: input.workflowManifest?.workflowId ?? null,
    publicationReadinessStatus: input.publicationReadiness?.status ?? null,
    qaStatus: input.scientificQA?.status ?? input.contextSummary.qa.status ?? null,
    qaIssueIds: qaIssueIds(input, layerIds),
    caveats,
    sourceEvidenceArtifactIds: sourceEvidenceArtifactIds(layerReferences, input.mapEvidenceArtifacts),
    crsByLayer: layerReferences.map((layer) => ({ layerId: layer.layerId, crs: layer.crs })),
  };
}

function bridgeFilename(kind: MapCodeArtifactKind, input: MapCodeArtifactRequestInput, generatedAt: string): string {
  const stamp = stampFromIso(generatedAt);
  const workflowSlug = safeSlug(input.workflowManifest?.workflowKind ?? input.workflowManifest?.workflowId, "workflow");
  const contextSlug = safeSlug(input.contextSummary.contextId, "context");
  const layerSlug = safeSlug(input.requestedLayerId ?? resolveRequestLayers(input)[0]?.id, "layer");
  switch (kind) {
    case "workflow-script":
      return `map_workflow_${workflowSlug}_${stamp}.py`;
    case "workflow-notebook":
      return `map_workflow_${workflowSlug}_${stamp}.ipynb`;
    case "map-manifest":
      return `map_context_${contextSlug}_${stamp}.manifest.json`;
    case "sql-query":
      return `map_layer_${layerSlug}_${stamp}.sql`;
    case "export-package-note":
      return `map_export_package_${stamp}.md`;
  }
}

function artifactId(kind: MapCodeArtifactKind, input: MapCodeArtifactRequestInput, generatedAt: string): string {
  const base = kind === "sql-query"
    ? input.requestedLayerId ?? resolveRequestLayers(input)[0]?.id ?? input.contextSummary.contextId
    : input.workflowManifest?.workflowId ?? input.contextSummary.contextId;
  return `map-code-${kind}-${safeSlug(base, "artifact")}-${stampFromIso(generatedAt)}`;
}

function headerLines(title: string, provenance: MapCodeArtifactProvenance, prefix: "#" | "--"): string[] {
  const layerList = provenance.layerReferences
    .map((layer) => `${layer.layerId}${layer.crs ? ` (${layer.crs})` : ""}`)
    .join(", ") || "none";
  return [
    `${prefix} ${title}`,
    `${prefix} Generated by: Map Explorer`,
    `${prefix} Artifact ID: ${provenance.mapContextId}`,
    `${prefix} Generated at: ${provenance.generatedAt}`,
    `${prefix} Map context: ${provenance.mapContextId}`,
    `${prefix} Layers: ${layerList}`,
    `${prefix} AOI: ${provenance.aoiReference.label ?? provenance.aoiReference.source}`,
    `${prefix} Workflow: ${provenance.workflowId ?? "none"}`,
    `${prefix} QA: ${provenance.qaStatus ?? "unchecked"}; issues=${provenance.qaIssueIds.length}; caveats=${provenance.caveats.length}`,
    `${prefix} Payload policy: references only; raw geometry and source payloads are not embedded.`,
  ];
}

function buildWorkflowScriptContent(requestTitle: string, input: MapCodeArtifactRequestInput, provenance: MapCodeArtifactProvenance): string {
  const manifest = input.workflowManifest;
  const manifestJson = json(manifest ?? {
    workflowId: provenance.workflowId,
    layerIds: provenance.layerIds,
    aoiReference: provenance.aoiReference,
  });
  const layerList = provenance.layerReferences.map((layer) => ({
    layer_id: layer.layerId,
    name: layer.name,
    crs: layer.crs,
    worker_table_name: layer.workerTableName,
  }));
  return [
    ...headerLines(requestTitle, provenance, "#"),
    "",
    "from __future__ import annotations",
    "",
    "import json",
    "from dataclasses import dataclass",
    "from typing import Any",
    "",
    "MAP_WORKFLOW_MANIFEST: dict[str, Any] = json.loads(r'''",
    manifestJson,
    "''')",
    "",
    "MAP_LAYER_REFS = json.loads(r'''",
    json(layerList),
    "''')",
    "",
    "@dataclass(frozen=True)",
    "class MapArtifactContext:",
    "    map_context_id: str",
    "    layer_ids: list[str]",
    "    workflow_id: str | None",
    "",
    "def load_map_artifact_context() -> MapArtifactContext:",
    `    return MapArtifactContext(map_context_id=${JSON.stringify(provenance.mapContextId)}, layer_ids=[layer["layer_id"] for layer in MAP_LAYER_REFS], workflow_id=MAP_WORKFLOW_MANIFEST.get("workflowId"))`,
    "",
    "def main() -> None:",
    "    context = load_map_artifact_context()",
    "    print(f\"Map context: {context.map_context_id}\")",
    "    print(f\"Layers: {', '.join(context.layer_ids) or 'none'}\")",
    "    print(\"Review CRS, QA caveats, and layer references before running analysis.\")",
    "",
    "if __name__ == \"__main__\":",
    "    main()",
    "",
  ].join("\n");
}

function buildNotebookContent(scriptContent: string, provenance: MapCodeArtifactProvenance): string {
  return json({
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "# Map Explorer Reproducibility Notebook\n",
          `\n- Map context: ${provenance.mapContextId}\n`,
          `- Layers: ${provenance.layerIds.join(", ") || "none"}\n`,
          `- QA: ${provenance.qaStatus ?? "unchecked"}; ${provenance.caveats.length} caveat(s)\n`,
          "\nRaw geometry is intentionally not embedded; resolve layers by ID before execution.\n",
        ],
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: scriptContent.split("\n").map((line, index, lines) => `${line}${index < lines.length - 1 ? "\n" : ""}`),
      },
    ],
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
        version: "3.x",
      },
      synapse: {
        sourceModule: "map-explorer",
        mapContextId: provenance.mapContextId,
        layerIds: provenance.layerIds,
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  });
}

function buildMapManifestContent(requestTitle: string, input: MapCodeArtifactRequestInput, provenance: MapCodeArtifactProvenance): string {
  return json({
    schema: "synapse.map.context.manifest",
    version: MAP_CODE_ARTIFACT_REQUEST_VERSION,
    title: requestTitle,
    createdAt: provenance.generatedAt,
    mapContext: {
      contextId: input.contextSummary.contextId,
      updatedAt: input.contextSummary.updatedAt,
      viewport: input.contextSummary.viewport,
      currentBounds: input.contextSummary.currentBounds,
      visibleLayerIds: input.contextSummary.visibleLayerIds,
      selectedLayerIds: input.contextSummary.selectedLayerIds,
      activeAnalysisResultLayerIds: input.contextSummary.activeAnalysisResultLayerIds,
      selection: input.contextSummary.selection,
    },
    aoi: provenance.aoiReference,
    layers: provenance.layerReferences,
    workflowManifest: input.workflowManifest ?? null,
    publication: input.publicationReadiness ? {
      status: input.publicationReadiness.status,
      blockers: input.publicationReadiness.blockers.map((blocker) => blocker.message),
      warnings: input.publicationReadiness.warnings.map((warning) => warning.message),
      caveats: input.publicationReadiness.caveats,
    } : null,
    qa: {
      status: provenance.qaStatus,
      issueIds: provenance.qaIssueIds,
      caveats: provenance.caveats,
      crsByLayer: provenance.crsByLayer,
    },
    provenance,
  });
}

function buildSqlContent(requestTitle: string, provenance: MapCodeArtifactProvenance): string {
  const rows = provenance.layerReferences.length > 0
    ? provenance.layerReferences.map((layer) => `  (${quoteSql(layer.layerId)}, ${quoteSql(layer.name)}, ${quoteSql(layer.crs ?? "unknown")}, ${quoteSql(layer.workerTableName ?? "")})`).join(",\n")
    : "  ('<layer-id>', '<layer-name>', '<crs>', '<worker-table>')";
  const primary = provenance.layerReferences[0];
  const tableName = primary?.workerTableName || "spatial_features";
  return [
    ...headerLines(requestTitle, provenance, "--"),
    "",
    "WITH map_layer_refs(layer_id, layer_name, crs, worker_table_name) AS (",
    "  VALUES",
    rows,
    "),",
    "target_layer AS (",
    "  SELECT * FROM map_layer_refs LIMIT 1",
    ")",
    "SELECT *",
    `FROM ${tableName.replace(/[^a-zA-Z0-9_\.]/g, "_")}`,
    "WHERE layer_id = (SELECT layer_id FROM target_layer)",
    "LIMIT 1000;",
    "",
    "-- Replace the FROM table with the DuckDB/worker table registered for the layer when available.",
  ].join("\n");
}

function buildExportNoteContent(requestTitle: string, input: MapCodeArtifactRequestInput, provenance: MapCodeArtifactProvenance): string {
  const readiness = input.publicationReadiness;
  const composition = input.compositionOptions;
  return [
    `# ${requestTitle}`,
    "",
    "Generated by Map Explorer as an explicit Synapse IDE artifact request.",
    "",
    "## Provenance",
    `- Map context: ${provenance.mapContextId}`,
    `- Generated at: ${provenance.generatedAt}`,
    `- Layers: ${provenance.layerIds.join(", ") || "none"}`,
    `- AOI: ${provenance.aoiReference.label ?? provenance.aoiReference.source}`,
    `- QA status: ${provenance.qaStatus ?? "unchecked"}`,
    "",
    "## Publication Readiness",
    `- Status: ${readiness?.status ?? "unknown"}`,
    `- Blockers: ${readiness?.blockers.length ?? 0}`,
    `- Warnings: ${readiness?.warnings.length ?? 0}`,
    `- Caveats: ${readiness?.caveats.length ?? provenance.caveats.length}`,
    "",
    "## Composition",
    "```json",
    json(composition ?? null),
    "```",
    "",
    "## Caveats",
    ...(provenance.caveats.length > 0 ? provenance.caveats.map((caveat) => `- ${caveat}`) : ["- No caveats were supplied by the current map state."]),
    "",
    "This note intentionally stores layer IDs, CRS summaries, QA caveats, and composition options only. It does not embed rendered images or raw spatial data.",
    "",
  ].join("\n");
}

function evidenceQaFromProvenance(provenance: MapCodeArtifactProvenance): MapEvidenceQA {
  const blockerCount = provenance.qaStatus === "error" || provenance.qaStatus === "blocked" ? provenance.qaIssueIds.length : 0;
  return {
    state: blockerCount > 0 ? "blocked" : provenance.caveats.length > 0 ? "warning" : "unchecked",
    issueIds: provenance.qaIssueIds,
    issueCount: provenance.qaIssueIds.length,
    blockerCount,
    caveats: provenance.caveats,
    checkedAt: provenance.generatedAt,
  };
}

function metadataForRequest(
  request: Omit<MapCodeArtifactRequest, "evidenceArtifact">,
  bytes: number,
): Record<string, MapEvidenceScalar> {
  return {
    artifactKind: request.kind,
    language: request.language,
    targetFileSuggestion: request.targetFileSuggestion,
    bytes,
    mapContextId: request.provenance.mapContextId,
    workflowId: request.workflowId,
    layerCount: request.layerIds.length,
    qaStatus: request.provenance.qaStatus,
    qaIssueCount: request.provenance.qaIssueIds.length,
    caveatCount: request.provenance.caveats.length,
    publicationReadinessStatus: request.provenance.publicationReadinessStatus,
  };
}

function createRequest(
  kind: MapCodeArtifactKind,
  language: MapCodeArtifactLanguage,
  title: string,
  summary: string,
  input: MapCodeArtifactRequestInput,
  buildContent: (requestTitle: string, input: MapCodeArtifactRequestInput, provenance: MapCodeArtifactProvenance) => string,
): MapCodeArtifactRequest {
  const generatedAt = nowIso(input.now);
  const provenance = buildProvenance(input, generatedAt);
  const id = artifactId(kind, input, generatedAt);
  const targetFileSuggestion = bridgeFilename(kind, input, generatedAt);
  const baseRequest = {
    version: MAP_CODE_ARTIFACT_REQUEST_VERSION,
    artifactId: id,
    requestId: `${id}-request`,
    kind,
    title,
    summary,
    layerIds: provenance.layerIds,
    aoiReference: provenance.aoiReference,
    workflowId: provenance.workflowId,
    language,
    targetFileSuggestion,
    content: buildContent(title, input, provenance),
    provenance,
    safetyNotes: [
      "Generated artifact opens in a new IDE tab only after an explicit user action.",
      "Layer data is referenced by ID; raw coordinates, GeoJSON, source payloads, and rendered images are not embedded.",
      "Review CRS, QA caveats, and workflow parameters before execution or publication.",
    ],
  } satisfies Omit<MapCodeArtifactRequest, "evidenceArtifact">;
  const bytes = utf8ByteLength(baseRequest.content);
  const evidenceArtifact = createMapEvidenceArtifact({
    id: `map-ide-artifact-${id}`,
    kind: "ide-code-reference",
    title,
    summary,
    state: "active",
    sourceModule: "map-explorer",
    sourceId: id,
    linkedLayerIds: provenance.layerIds,
    sourceLayerIds: provenance.layerIds,
    linkedAoiId: provenance.aoiReference.aoiId ?? undefined,
    linkedWorkflowId: provenance.workflowId ?? undefined,
    linkedFileIds: [targetFileSuggestion],
    linkedArtifactIds: provenance.sourceEvidenceArtifactIds,
    qaIssueIds: provenance.qaIssueIds,
    ideArtifactId: id,
    tags: ["ide", kind],
    qa: evidenceQaFromProvenance(provenance),
    provenance: {
      sourceModule: "map-explorer",
      sourceName: title,
      sourceKind: "generated",
      createdAt: generatedAt,
      method: `MapCodeArtifactRequest:${kind}`,
      sourceLayerIds: provenance.layerIds,
      workflowId: provenance.workflowId ?? undefined,
      inputArtifactIds: provenance.sourceEvidenceArtifactIds,
      parentArtifactIds: provenance.sourceEvidenceArtifactIds,
      notes: [summary, ...baseRequest.safetyNotes],
      crsSummary: {
        displayCrs: "EPSG:4326",
        sourceLayerCrs: provenance.crsByLayer,
        missingLayerIds: provenance.crsByLayer.filter((entry) => !entry.crs).map((entry) => entry.layerId),
        notes: ["Generated IDE artifact preserves CRS by layer reference; computations must project before analytical distance/area work."],
      },
    },
    metadata: metadataForRequest(baseRequest, bytes),
    createdAt: generatedAt,
  });
  return { ...baseRequest, evidenceArtifact };
}

export function buildWorkflowScriptRequest(input: MapCodeArtifactRequestInput): MapCodeArtifactRequest {
  return createRequest(
    "workflow-script",
    "python",
    "Map workflow reproducibility script",
    "Python scaffold with map layer, AOI, workflow manifest, CRS, and QA provenance references.",
    input,
    buildWorkflowScriptContent,
  );
}

export function buildWorkflowNotebookRequest(input: MapCodeArtifactRequestInput): MapCodeArtifactRequest {
  const script = buildWorkflowScriptRequest(input);
  return createRequest(
    "workflow-notebook",
    "json",
    "Map workflow reproducibility notebook",
    "Jupyter notebook scaffold generated from a map workflow manifest with references only.",
    input,
    (_title, _input, provenance) => buildNotebookContent(script.content, provenance),
  );
}

export function buildMapManifestRequest(input: MapCodeArtifactRequestInput): MapCodeArtifactRequest {
  return createRequest(
    "map-manifest",
    "json",
    "Map context manifest",
    "JSON manifest preserving current map context, layer references, AOI, CRS summaries, QA caveats, and publication readiness.",
    input,
    buildMapManifestContent,
  );
}

export function buildSqlQueryRequest(input: MapCodeArtifactRequestInput): MapCodeArtifactRequest {
  return createRequest(
    "sql-query",
    "sql",
    "Map layer SQL query scaffold",
    "Read-only SQL scaffold that references map layers by ID and worker table names when available.",
    input,
    (title, _input, provenance) => buildSqlContent(title, provenance),
  );
}

export function buildExportPackageNoteRequest(input: MapCodeArtifactRequestInput): MapCodeArtifactRequest {
  return createRequest(
    "export-package-note",
    "markdown",
    "Map export package note",
    "Markdown note for a publication/export package with composition, readiness, provenance, and caveats.",
    input,
    buildExportNoteContent,
  );
}

export async function dispatchMapCodeArtifactRequest(
  request: MapCodeArtifactRequest,
  options: DispatchMapCodeArtifactRequestOptions = {},
): Promise<DispatchMapCodeArtifactRequestResult> {
  const sizing = assessMapCodeArtifactRequestSize(request);
  if (!sizing.withinBudget) {
    throw new Error(`Map code artifact request exceeds ${MAX_MAP_CODE_ARTIFACT_BYTES} bytes (got ${sizing.bytes}); reduce content or split the request.`);
  }

  let tabId: string | null = null;
  let bridgeRouted = false;
  if (options.routeThroughBridge ?? true) {
    try {
      const result = await ideOpenNewTab({
        filename: request.targetFileSuggestion,
        code: request.content,
        language: BRIDGE_LANGUAGE[request.language],
      });
      tabId = result.tabId;
      bridgeRouted = true;
    } catch (error) {
      bridgeRouted = false;
      if (typeof console !== "undefined") {
        console.warn("[MapCodeArtifactRequestService] IDE bridge dispatch failed", error);
      }
    }
  }

  let evidenceEventPublished = false;
  if (options.publishEvidenceEvent ?? true) {
    synapseBus.emit("evidence.artifact.register", {
      artifactId: request.evidenceArtifact.artifactId,
      artifactType: "code",
      sourceModule: "map-explorer",
      title: request.title,
      summary: request.summary.slice(0, 256),
      relatedFilePaths: [request.targetFileSuggestion],
      relatedLayerIds: request.layerIds,
      ...(request.workflowId ? { relatedRunIds: [request.workflowId] } : {}),
      relatedArtifactIds: request.provenance.sourceEvidenceArtifactIds,
      language: request.language,
      artifactKind: request.kind,
      manifestMetadata: {
        mapContextId: request.provenance.mapContextId,
        workflowId: request.workflowId,
        layerCount: request.layerIds.length,
        qaStatus: request.provenance.qaStatus,
        publicationReadinessStatus: request.provenance.publicationReadinessStatus,
      },
      sizeBytes: sizing.bytes,
      source: "map-explorer",
      requestedAt: busTimestamp(),
    });
    evidenceEventPublished = true;
  }

  return {
    artifactId: request.artifactId,
    evidenceArtifactId: request.evidenceArtifact.artifactId,
    tabId,
    bytes: sizing.bytes,
    bridgeRouted,
    evidenceEventPublished,
  };
}