import type { OverlayLayerConfig, ViewportState } from "@/centerpanel/components/map/mapTypes";
import type { MapScientificQAState } from "./MapScientificQA";
import {
  buildMapCompositionLegendItems,
  buildMapPublicationReadiness,
  type MapCompositionLegendItem,
  type MapPublicationReadiness,
} from "./MapExportService";
import { enqueuePendingInsert } from "@/services/reporting/storage";
import type {
  PendingReportInsert,
  ReportCitationRecord,
  ReportDocument,
  ReportSection,
  ReportStructuredEvidenceBlock,
} from "@/services/reporting/types";

export const MAP_REPORT_HANDOFF_VERSION = 1;
export const MAP_REPORT_EVIDENCE_BLOCK_VERSION = 1;

export type MapReportHandoffScope = "map-view" | "layer" | "feature";
export type MapReportSnapshotFrame = "current-view" | "landscape" | "square" | "portrait";
export type MapReportSnapshotFit = "contain" | "cover";

export interface MapReportHandoffOptions {
  includeMethods: boolean;
  includeDataLineage: boolean;
  includeQaWarnings: boolean;
  snapshotFrame: MapReportSnapshotFrame;
  snapshotFit: MapReportSnapshotFit;
}

export const DEFAULT_MAP_REPORT_HANDOFF_OPTIONS: MapReportHandoffOptions = {
  includeMethods: true,
  includeDataLineage: true,
  includeQaWarnings: true,
  snapshotFrame: "current-view",
  snapshotFit: "contain",
};

export interface MapReportHandoffFeatureTarget {
  layerId?: string;
  featureId?: string;
  properties?: Record<string, unknown>;
  coordinate?: [number, number];
}

export type MapReportHandoffSource =
  | { scope: "map-view"; title?: string }
  | { scope: "layer"; layerId: string; title?: string }
  | ({ scope: "feature"; title?: string } & MapReportHandoffFeatureTarget);

export interface MapReportSnapshotInput {
  dataUrl?: string;
  filename?: string;
  width?: number;
  height?: number;
  scaleBarLabel?: string | null;
  northArrowBearing?: number | null;
  attributionText?: string;
  legendItems?: MapCompositionLegendItem[];
}

export interface MapReportHandoffInput {
  overlayLayers: OverlayLayerConfig[];
  viewport: ViewportState;
  currentMapBounds?: [number, number, number, number] | null;
  baseLayerName?: string;
  selectedFeatureIds?: Record<string, string[]>;
  scientificQA?: MapScientificQAState | null;
  source?: MapReportHandoffSource;
  snapshot?: MapReportSnapshotInput | null;
  options?: Partial<MapReportHandoffOptions>;
  createdAt?: string;
}

export interface MapReportStructuredReference {
  id: string;
  kind: "map-view" | "layer" | "feature" | "analysis-result";
  label: string;
  layerId?: string;
  featureId?: string;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  crs?: string;
  timestamp?: string;
  citationId?: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface MapReportReproducibilityItem {
  label: string;
  value: string;
}

export interface MapReportLayerEvidenceItem {
  layerId: string;
  name: string;
  type: OverlayLayerConfig["type"];
  visible: boolean;
  opacity: number;
  sourceName: string;
  crs: string;
  legendItemCount: number;
  featureCount: number | null;
  geometryType: string | null;
  qaStatus: string | null;
  sourceKind?: OverlayLayerConfig["sourceKind"];
  license?: string;
  citationId?: string;
  evidenceArtifactId?: string;
  dataVersion?: string;
}

export interface MapReportEvidenceBlockPayload {
  composition: {
    title: string;
    baseLayerName: string;
    scope: MapReportHandoffScope;
    viewport: {
      center: [number, number];
      zoom: number;
      bearing: number;
      pitch: number;
      bounds: [number, number, number, number] | null;
    };
    visibleExtent: [number, number, number, number] | null;
    layerStack: MapReportLayerEvidenceItem[];
    legendItems: MapCompositionLegendItem[];
    scaleBarLabel: string;
    northArrowLabel: string;
    attributionText: string;
    crsSummary: {
      displayCrs: string;
      layerCrs: Array<{ layerId: string; crs: string }>;
      missingLayerIds: string[];
      notes: string[];
    };
    exportSnapshotReference: {
      assetId: string;
      title: string;
      filename: string | null;
      width: number | null;
      height: number | null;
      hasEmbeddedImage: boolean;
    };
  };
  qa: {
    readinessId: string;
    status: MapPublicationReadiness["status"];
    checkedAt: string;
    blockerCount: number;
    warningCount: number;
    caveatCount: number;
    issueIds: string[];
    blockers: string[];
    warnings: string[];
    caveats: string[];
  };
  provenance: {
    citationIds: string[];
    structuredReferenceIds: string[];
    evidenceArtifactIds: string[];
    sourceNames: string[];
    licenses: string[];
    reproducibilityManifestIds: string[];
    ideArtifactIds: string[];
    mapReviewEventIds: string[];
    generatedBy: "MapReportHandoffService";
  };
  caveats: string[];
  reproducibility: MapReportReproducibilityItem[];
}

export interface MapReportEvidenceBlock extends ReportStructuredEvidenceBlock<MapReportEvidenceBlockPayload> {
  sourceModule: "map";
  kind: "map-report-evidence";
  version: typeof MAP_REPORT_EVIDENCE_BLOCK_VERSION;
  payload: MapReportEvidenceBlockPayload;
}

export interface MapReportHandoffDraft {
  id: string;
  version: number;
  scope: MapReportHandoffScope;
  title: string;
  createdAt: string;
  snapshot: {
    assetId: string;
    title: string;
    caption: string;
    dataUrl?: string;
    filename?: string;
    width?: number;
    height?: number;
    visibleLayerNames: string[];
    legendItems: MapCompositionLegendItem[];
    scaleBarLabel: string;
    northArrowLabel: string;
    attributionText: string;
  };
  narrative: string;
  citations: ReportCitationRecord[];
  references: MapReportStructuredReference[];
  caveats: string[];
  publicationReadiness: MapPublicationReadiness;
  reproducibility: MapReportReproducibilityItem[];
  evidenceBlock: MapReportEvidenceBlock;
  options: MapReportHandoffOptions;
}

export interface MapReportHandoffInsertOptions {
  mapReviewEventIds?: string[];
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "map";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(5).replace(/0+$/g, "").replace(/\.$/, "") : "n/a";
}

function formatBounds(bounds?: [number, number, number, number] | null): string {
  if (!bounds) return "Not captured";
  return `[${bounds.map(formatCoordinate).join(", ")}]`;
}

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstAvailable(...values: unknown[]): string | null {
  for (const value of values) {
    const resolved = safeString(value);
    if (resolved) return resolved;
  }
  return null;
}

function yearFromTimestamp(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.getUTCFullYear() : fallback;
}

function getLayerCrs(layer: OverlayLayerConfig): string {
  return firstAvailable(
    layer.metadata?.datasetContext?.crs,
    layer.metadata?.columnar?.crs,
    layer.metadata?.externalService?.crs,
    layer.metadata?.eoSource?.crs,
  ) ?? "EPSG:4326 assumed";
}

function getLayerSourceName(layer: OverlayLayerConfig): string {
  return firstAvailable(
    layer.provenance?.sourceName,
    layer.metadata?.datasetContext?.source,
    layer.metadata?.datasetContext?.datasetTitle,
    layer.metadata?.externalService?.title,
    layer.metadata?.externalService?.endpoint,
    layer.metadata?.eoSource?.provider,
    layer.provenance?.label,
    layer.sourceKind,
  ) ?? "Map Explorer layer metadata";
}

function getLayerSourceUrl(layer: OverlayLayerConfig): string | undefined {
  return firstAvailable(
    layer.provenance?.sourceUrl,
    layer.metadata?.externalService?.endpoint,
    layer.metadata?.externalService?.urlTemplate,
    layer.metadata?.eoSource?.sourceUrl,
  ) ?? undefined;
}

function getLayerTimestamp(layer: OverlayLayerConfig): string | undefined {
  return firstAvailable(
    layer.metadata?.updatedAt,
    layer.metadata?.analysisResult?.runTimestamp,
    layer.metadata?.datasetContext?.updateDate,
    layer.metadata?.externalService?.refreshedAt,
    layer.provenance?.generatedAt,
    layer.provenance?.collectedAt,
  ) ?? undefined;
}

function getLayerCitation(layer: OverlayLayerConfig, createdAt: string): ReportCitationRecord {
  const citationId = `map-layer-${slugify(layer.id)}`;
  const sourceName = getLayerSourceName(layer);
  const timestamp = getLayerTimestamp(layer);
  const sourceUrl = getLayerSourceUrl(layer);
  const fallbackYear = new Date(createdAt).getUTCFullYear();

  return {
    id: citationId,
    type: "dataset",
    title: firstAvailable(layer.metadata?.datasetContext?.layerTitle, layer.metadata?.datasetContext?.datasetTitle, layer.name) ?? layer.name,
    authors: [{ given: "", family: sourceName }],
    year: yearFromTimestamp(timestamp, fallbackYear),
    publisher: sourceName,
    ...(sourceUrl ? { url: sourceUrl } : {}),
    accessedAt: createdAt,
  };
}

function getFeatureTitle(properties?: Record<string, unknown>, fallback = "selected feature"): string {
  return firstAvailable(
    properties?.detection_class,
    properties?.land_cover_class,
    properties?.cluster_label,
    properties?.query_intent,
    properties?.name,
    properties?.label,
    properties?.id,
    properties?.feature_id,
  ) ?? fallback;
}

function getScopeTitle(source: MapReportHandoffSource | undefined, focusLayer: OverlayLayerConfig | null): string {
  if (source?.title?.trim()) return source.title.trim();
  if (source?.scope === "layer" && focusLayer) return `${focusLayer.name} map finding`;
  if (source?.scope === "feature") return `${getFeatureTitle(source.properties)} feature finding`;
  return "Current map evidence";
}

function buildLayerReferences(layers: OverlayLayerConfig[], createdAt: string): MapReportStructuredReference[] {
  return layers.map((layer) => {
    const citation = getLayerCitation(layer, createdAt);
    const analysis = layer.metadata?.analysisResult;
    const sourceUrl = getLayerSourceUrl(layer);
    const license = layer.provenance?.license ?? layer.metadata?.datasetContext?.license;
    const timestamp = getLayerTimestamp(layer);
    return {
      id: `ref-${citation.id}`,
      kind: analysis ? "analysis-result" : "layer",
      label: layer.name,
      layerId: layer.id,
      sourceName: getLayerSourceName(layer),
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(license ? { license } : {}),
      crs: getLayerCrs(layer),
      ...(timestamp ? { timestamp } : {}),
      citationId: citation.id,
      metadata: {
        type: layer.type,
        group: layer.group ?? null,
        sourceKind: layer.sourceKind ?? null,
        visible: layer.visible,
        opacity: layer.opacity,
        evidenceArtifactId: getLayerEvidenceArtifactId(layer),
        featureCount: layer.metadata?.featureCount ?? null,
        geometryType: layer.metadata?.geometryType ?? null,
        qaStatus: layer.metadata?.scientificQA?.status ?? layer.qaStatus ?? null,
        analysisEngine: analysis?.engine ?? null,
        analysisRunId: analysis?.runId ?? null,
        dataVersion: layer.metadata?.dataVersion ?? analysis?.sourceDataVersion ?? null,
      },
    };
  });
}

function buildFeatureReference(source: MapReportHandoffSource | undefined, focusLayer: OverlayLayerConfig | null): MapReportStructuredReference | null {
  if (!source || source.scope !== "feature") return null;
  const featureId = source.featureId ?? "map-feature";
  const layerId = source.layerId ?? focusLayer?.id;
  return {
    id: `ref-map-feature-${slugify(`${source.layerId ?? focusLayer?.id ?? "layer"}-${featureId}`)}`,
    kind: "feature",
    label: getFeatureTitle(source.properties),
    ...(layerId ? { layerId } : {}),
    featureId,
    sourceName: focusLayer ? getLayerSourceName(focusLayer) : "Map popup selection",
    crs: focusLayer ? getLayerCrs(focusLayer) : "EPSG:4326 assumed",
    ...(focusLayer ? { citationId: getLayerCitation(focusLayer, new Date().toISOString()).id } : {}),
    metadata: {
      longitude: source.coordinate?.[0] ?? null,
      latitude: source.coordinate?.[1] ?? null,
      propertyCount: Object.keys(source.properties ?? {}).length,
    },
  };
}

function buildCaveats(input: {
  layers: OverlayLayerConfig[];
  source?: MapReportHandoffSource | undefined;
  scientificQA?: MapScientificQAState | null | undefined;
  options: MapReportHandoffOptions;
}): string[] {
  const caveats: string[] = [];

  for (const layer of input.layers) {
    if (layer.sourceKind === "demo") {
      caveats.push(`${layer.name} is flagged as demo/sample data and should not be interpreted as authoritative field evidence.`);
    }
    if (layer.metadata?.analysisResult?.stale) {
      caveats.push(`${layer.name} is marked stale relative to its analysis inputs; rerun before final publication.`);
    }
    if (layer.metadata?.scientificQA?.badges.includes("missing_crs")) {
      caveats.push(`${layer.name} has missing or assumed CRS metadata; distance and area interpretation should be reviewed.`);
    }
    if (layer.metadata?.scientificQA?.badges.includes("uncertain_output")) {
      caveats.push(`${layer.name} carries an uncertain-output QA badge; treat classes or scores as screening evidence.`);
    }
    caveats.push(...(layer.metadata?.scientificQA?.caveats ?? []).map((caveat) => `${layer.name}: ${caveat}`));
  }

  if (input.source?.scope === "feature") {
    caveats.push("Feature-level handoff preserves the clicked attributes as context; it does not imply the feature is representative of the full layer.");
  }

  if (input.options.includeQaWarnings && input.scientificQA) {
    for (const issue of input.scientificQA.issues.filter((issue) => issue.severity !== "info").slice(0, 8)) {
      caveats.push(`${issue.severity.toUpperCase()}: ${issue.title}${issue.layerName ? ` (${issue.layerName})` : ""}. ${issue.explanation}`);
    }
  }

  if (caveats.length === 0) {
    caveats.push("No blocking scientific QA caveats were present in the captured map context; retain source metadata with the exported report item.");
  }

  return unique(caveats).slice(0, 12);
}

function summarizeLayerForLineage(layer: OverlayLayerConfig): string {
  const analysis = layer.metadata?.analysisResult;
  const parts = [
    layer.name,
    `source=${getLayerSourceName(layer)}`,
    `crs=${getLayerCrs(layer)}`,
    layer.metadata?.dataVersion ? `version=${layer.metadata.dataVersion}` : null,
    analysis ? `engine=${analysis.engine}` : null,
    analysis?.runId ? `run=${analysis.runId}` : null,
  ].filter(Boolean);
  return parts.join("; ");
}

function buildReproducibility(input: {
  layers: OverlayLayerConfig[];
  viewport: ViewportState;
  currentMapBounds?: [number, number, number, number] | null | undefined;
  baseLayerName?: string | undefined;
  selectedFeatureIds?: Record<string, string[]> | undefined;
  source?: MapReportHandoffSource | undefined;
  options: MapReportHandoffOptions;
  publicationReadiness?: MapPublicationReadiness | undefined;
}): MapReportReproducibilityItem[] {
  const selectedLayerCounts = Object.entries(input.selectedFeatureIds ?? {})
    .filter(([, ids]) => ids.length > 0)
    .map(([layerId, ids]) => `${layerId}: ${ids.length}`)
    .join("; ");
  const items: MapReportReproducibilityItem[] = [
    { label: "Capture scope", value: input.source?.scope ?? "map-view" },
    { label: "Base layer", value: input.baseLayerName ?? "Current base map" },
    { label: "Viewport center", value: `${formatCoordinate(input.viewport.center[0])}, ${formatCoordinate(input.viewport.center[1])}` },
    { label: "Viewport zoom/bearing/pitch", value: `${input.viewport.zoom.toFixed(2)} / ${input.viewport.bearing.toFixed(2)} / ${input.viewport.pitch.toFixed(2)}` },
    { label: "Viewport bounds", value: formatBounds(input.currentMapBounds) },
    { label: "Visible layers", value: input.layers.map((layer) => `${layer.name} (${Math.round(layer.opacity * 100)}%)`).join("; ") || "None" },
    { label: "Selected features", value: selectedLayerCounts || "None" },
    { label: "Snapshot frame", value: `${input.options.snapshotFrame}; ${input.options.snapshotFit === "cover" ? "fill frame without stretching" : "full map without stretching"}` },
  ];

  if (input.options.includeMethods) {
    const methods = input.layers
      .map((layer) => layer.metadata?.analysisResult?.parameterSummary ?? layer.provenance?.method)
      .filter((value): value is string => Boolean(value));
    items.push({ label: "Methods", value: unique(methods).join("; ") || "Layer styling and map viewport captured without additional analytic transformation." });
  }

  if (input.options.includeDataLineage) {
    items.push({ label: "Data lineage", value: input.layers.map(summarizeLayerForLineage).join(" | ") || "No visible overlay lineage recorded." });
  }

  if (input.publicationReadiness) {
    items.push(
      { label: "Publication readiness", value: input.publicationReadiness.status },
      { label: "Readiness checked", value: input.publicationReadiness.checkedAt },
      { label: "Readiness blockers", value: input.publicationReadiness.blockers.map((check) => check.message).join(" | ") || "None" },
      { label: "Readiness warnings", value: input.publicationReadiness.warnings.map((check) => check.message).join(" | ") || "None" },
    );
  }

  return items;
}

function buildNarrative(input: {
  title: string;
  layers: OverlayLayerConfig[];
  citations: ReportCitationRecord[];
  source?: MapReportHandoffSource | undefined;
  baseLayerName?: string | undefined;
  currentMapBounds?: [number, number, number, number] | null | undefined;
}): string {
  const layerNames = input.layers.map((layer) => layer.name);
  const citationTokens = input.citations.slice(0, 4).map((citation) => `{{cite:${citation.id}}}`).join(" ");
  const scopePhrase = input.source?.scope === "layer"
    ? "the selected layer"
    : input.source?.scope === "feature"
      ? "the selected map feature"
      : "the current visible map view";
  const layerPhrase = layerNames.length > 0
    ? `${layerNames.length} visible layer${layerNames.length === 1 ? "" : "s"}: ${layerNames.join(", ")}`
    : "the base map with no visible overlay layer";
  const featurePhrase = input.source?.scope === "feature"
    ? ` The clicked feature is titled "${getFeatureTitle(input.source.properties)}" and is carried forward as a feature-level reference.`
    : "";

  return `${input.title} summarizes ${scopePhrase} using ${layerPhrase} over ${input.baseLayerName ?? "the active base layer"}. The capture includes the map frame, legend, scale bar, north arrow, attribution, and the viewport bounds ${formatBounds(input.currentMapBounds)} for reproducibility.${featurePhrase} Interpret this map evidence alongside the structured layer references and QA caveats recorded below. ${citationTokens}`.trim();
}

function buildReferenceTableRows(references: MapReportStructuredReference[]): Array<Record<string, string | number | boolean | null>> {
  return references.map((reference) => ({
    Type: reference.kind,
    ID: reference.layerId ?? reference.featureId ?? reference.id,
    Label: reference.label,
    Source: reference.sourceName ?? "n/a",
    CRS: reference.crs ?? "n/a",
    Timestamp: reference.timestamp ?? "n/a",
    Citation: reference.citationId ?? "n/a",
    Evidence: typeof reference.metadata.evidenceArtifactId === "string" ? reference.metadata.evidenceArtifactId : "n/a",
  }));
}

function getLayerEvidenceArtifactId(layer: OverlayLayerConfig): string | null {
  return firstAvailable(
    layer.metadata?.evidenceArtifactId,
    layer.metadata?.registry?.evidenceArtifactId,
    layer.metadata?.analysisResult?.evidenceArtifactId,
  );
}

function getLayerReproducibilityManifestIds(layer: OverlayLayerConfig): string[] {
  return unique([
    layer.metadata?.reproducibilityManifest?.manifestId,
    layer.metadata?.analysisResult?.reproducibilityManifest?.manifestId,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0));
}

function getLayerIdeArtifactIds(layer: OverlayLayerConfig): string[] {
  return unique([
    ...(layer.metadata?.reproducibilityManifest?.handoffReferences.ideArtifactIds ?? []),
    ...(layer.metadata?.analysisResult?.reproducibilityManifest?.handoffReferences.ideArtifactIds ?? []),
  ]);
}

function buildLayerEvidenceItem(
  layer: OverlayLayerConfig,
  references: MapReportStructuredReference[],
  legendItems: MapCompositionLegendItem[],
): MapReportLayerEvidenceItem {
  const reference = references.find((entry) => entry.layerId === layer.id);
  const evidenceArtifactId = getLayerEvidenceArtifactId(layer);
  const license = layer.provenance?.license ?? layer.metadata?.datasetContext?.license ?? layer.metadata?.externalService?.license;
  const item: MapReportLayerEvidenceItem = {
    layerId: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    opacity: layer.opacity,
    sourceName: getLayerSourceName(layer),
    crs: getLayerCrs(layer),
    legendItemCount: legendItems.length,
    featureCount: layer.metadata?.featureCount ?? layer.metadata?.geometrySummary?.featureCount ?? null,
    geometryType: layer.metadata?.geometryType ?? layer.metadata?.geometrySummary?.geometryType ?? null,
    qaStatus: layer.metadata?.scientificQA?.status ?? layer.qaStatus ?? null,
  };
  if (layer.sourceKind) item.sourceKind = layer.sourceKind;
  if (license) item.license = license;
  if (reference?.citationId) item.citationId = reference.citationId;
  if (evidenceArtifactId) item.evidenceArtifactId = evidenceArtifactId;
  if (layer.metadata?.dataVersion) item.dataVersion = layer.metadata.dataVersion;
  return item;
}

function buildCrsEvidenceSummary(layers: OverlayLayerConfig[]): MapReportEvidenceBlockPayload["composition"]["crsSummary"] {
  const layerCrs = layers.map((layer) => ({ layerId: layer.id, crs: getLayerCrs(layer) }));
  const missingLayerIds = layers
    .filter((layer) => layer.metadata?.scientificQA?.badges.includes("missing_crs") || getLayerCrs(layer) === "EPSG:4326 assumed")
    .map((layer) => layer.id);
  const notes = missingLayerIds.length > 0
    ? ["One or more layers have missing or assumed CRS metadata; analytical distance and area claims require projected CRS review."]
    : ["CRS values are recorded as source metadata for report traceability; Map Explorer does not infer analytical CRS suitability from this block."];
  return {
    displayCrs: "EPSG:4326 display coordinates",
    layerCrs,
    missingLayerIds,
    notes,
  };
}

function buildEvidenceSummaryRows(block: MapReportEvidenceBlock): Array<Record<string, string | number | boolean | null>> {
  const payload = block.payload;
  return [
    { Field: "Evidence block ID", Value: block.id },
    { Field: "Snapshot asset", Value: payload.composition.exportSnapshotReference.assetId },
    { Field: "Visible extent", Value: payload.composition.visibleExtent ? formatBounds(payload.composition.visibleExtent) : "Not captured" },
    { Field: "Layer count", Value: payload.composition.layerStack.length },
    { Field: "Legend items", Value: payload.composition.legendItems.length },
    { Field: "CRS summary", Value: payload.composition.crsSummary.layerCrs.map((entry) => `${entry.layerId}: ${entry.crs}`).join("; ") || "No layer CRS metadata" },
    { Field: "Evidence artifact IDs", Value: payload.provenance.evidenceArtifactIds.join("; ") || "None linked" },
    { Field: "QA status", Value: payload.qa.status },
    { Field: "Caveat count", Value: payload.qa.caveatCount },
    { Field: "Attribution", Value: payload.composition.attributionText },
  ];
}

function buildMapReportEvidenceBlock(input: {
  draftId: string;
  title: string;
  scope: MapReportHandoffScope;
  createdAt: string;
  layers: OverlayLayerConfig[];
  viewport: ViewportState;
  currentMapBounds?: [number, number, number, number] | null | undefined;
  baseLayerName?: string | undefined;
  references: MapReportStructuredReference[];
  citations: ReportCitationRecord[];
  caveats: string[];
  publicationReadiness: MapPublicationReadiness;
  reproducibility: MapReportReproducibilityItem[];
  legendItems: MapCompositionLegendItem[];
  snapshot: MapReportHandoffDraft["snapshot"];
  mapReviewEventIds?: string[] | undefined;
}): MapReportEvidenceBlock {
  const evidenceArtifactIds = unique(input.layers.map(getLayerEvidenceArtifactId).filter((value): value is string => Boolean(value)));
  const sourceNames = unique(input.layers.map(getLayerSourceName));
  const licenses = unique(input.layers
    .map((layer) => layer.provenance?.license ?? layer.metadata?.datasetContext?.license ?? layer.metadata?.externalService?.license)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0));
  const reproducibilityManifestIds = unique(input.layers.flatMap(getLayerReproducibilityManifestIds));
  const ideArtifactIds = unique(input.layers.flatMap(getLayerIdeArtifactIds));
  const issueIds = unique(input.publicationReadiness.checks.flatMap((check) => check.issueIds));
  const mapReviewEventIds = unique(input.mapReviewEventIds ?? []);
  const payload: MapReportEvidenceBlockPayload = {
    composition: {
      title: input.title,
      baseLayerName: input.baseLayerName ?? "Current base map",
      scope: input.scope,
      viewport: {
        center: input.viewport.center,
        zoom: input.viewport.zoom,
        bearing: input.viewport.bearing,
        pitch: input.viewport.pitch,
        bounds: input.currentMapBounds ?? null,
      },
      visibleExtent: input.currentMapBounds ?? null,
      layerStack: input.layers.map((layer) => buildLayerEvidenceItem(layer, input.references, input.legendItems)),
      legendItems: input.legendItems,
      scaleBarLabel: input.snapshot.scaleBarLabel,
      northArrowLabel: input.snapshot.northArrowLabel,
      attributionText: input.snapshot.attributionText,
      crsSummary: buildCrsEvidenceSummary(input.layers),
      exportSnapshotReference: {
        assetId: input.snapshot.assetId,
        title: input.snapshot.title,
        filename: input.snapshot.filename ?? null,
        width: input.snapshot.width ?? null,
        height: input.snapshot.height ?? null,
        hasEmbeddedImage: Boolean(input.snapshot.dataUrl),
      },
    },
    qa: {
      readinessId: input.publicationReadiness.id,
      status: input.publicationReadiness.status,
      checkedAt: input.publicationReadiness.checkedAt,
      blockerCount: input.publicationReadiness.blockers.length,
      warningCount: input.publicationReadiness.warnings.length,
      caveatCount: input.caveats.length,
      issueIds,
      blockers: input.publicationReadiness.blockers.map((check) => check.message),
      warnings: input.publicationReadiness.warnings.map((check) => check.message),
      caveats: input.caveats,
    },
    provenance: {
      citationIds: input.citations.map((citation) => citation.id),
      structuredReferenceIds: input.references.map((reference) => reference.id),
      evidenceArtifactIds,
      sourceNames,
      licenses,
      reproducibilityManifestIds,
      ideArtifactIds,
      mapReviewEventIds,
      generatedBy: "MapReportHandoffService",
    },
    caveats: input.caveats,
    reproducibility: input.reproducibility,
  };

  return {
    id: `${input.draftId}-evidence-block`,
    sourceModule: "map",
    kind: "map-report-evidence",
    title: input.title,
    version: MAP_REPORT_EVIDENCE_BLOCK_VERSION,
    createdAt: input.createdAt,
    artifactIds: evidenceArtifactIds,
    summary: `${input.layers.length} map layer(s), ${input.citations.length} citation(s), ${input.caveats.length} caveat(s), and publication readiness ${input.publicationReadiness.status}.`,
    metadata: {
      reportDraftId: input.draftId,
      snapshotAssetId: input.snapshot.assetId,
      publicationReadinessStatus: input.publicationReadiness.status,
      blockerCount: input.publicationReadiness.blockers.length,
      warningCount: input.publicationReadiness.warnings.length,
      caveatCount: input.caveats.length,
      layerIds: input.layers.map((layer) => layer.id),
      citationIds: input.citations.map((citation) => citation.id),
      evidenceArtifactIds,
      mapReviewEventIds,
      reproducibilityManifestIds,
      ideArtifactIds,
    },
    payload,
  };
}

function withMapReviewEventIds(block: MapReportEvidenceBlock, mapReviewEventIds: string[]): MapReportEvidenceBlock {
  const mergedReviewEventIds = unique([
    ...block.payload.provenance.mapReviewEventIds,
    ...mapReviewEventIds,
  ]);
  if (mergedReviewEventIds.length === block.payload.provenance.mapReviewEventIds.length) {
    return block;
  }
  return {
    ...block,
    metadata: {
      ...block.metadata,
      mapReviewEventIds: mergedReviewEventIds,
    },
    payload: {
      ...block.payload,
      provenance: {
        ...block.payload.provenance,
        mapReviewEventIds: mergedReviewEventIds,
      },
    },
  };
}

export function buildMapReportHandoffDraft(input: MapReportHandoffInput): MapReportHandoffDraft {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const options = { ...DEFAULT_MAP_REPORT_HANDOFF_OPTIONS, ...input.options };
  const visibleLayers = input.overlayLayers.filter((layer) => layer.visible);
  const source = input.source ?? { scope: "map-view" as const };
  const targetLayerId = source.scope === "layer" || source.scope === "feature" ? source.layerId : undefined;
  const focusLayer = targetLayerId ? input.overlayLayers.find((layer) => layer.id === targetLayerId) ?? null : null;
  const reportLayers = focusLayer
    ? [focusLayer, ...visibleLayers.filter((layer) => layer.id !== focusLayer.id)]
    : visibleLayers;
  const title = getScopeTitle(source, focusLayer);
  const handoffId = `map-handoff-${slugify(`${source.scope}-${title}-${createdAt}`)}`;
  const layerReferences = buildLayerReferences(reportLayers, createdAt);
  const featureReference = buildFeatureReference(source, focusLayer);
  const references = featureReference ? [featureReference, ...layerReferences] : layerReferences;
  const citations = layerReferences
    .map((reference) => reportLayers.find((layer) => layer.id === reference.layerId))
    .filter((layer): layer is OverlayLayerConfig => Boolean(layer))
    .map((layer) => getLayerCitation(layer, createdAt));
  const legendItems = input.snapshot?.legendItems ?? buildMapCompositionLegendItems(reportLayers);
  const scaleBarLabel = input.snapshot?.scaleBarLabel ?? "Scale bar rendered from current map view";
  const northArrowLabel = input.snapshot?.northArrowBearing == null
    ? "North arrow rendered"
    : `North arrow rendered at ${input.snapshot.northArrowBearing.toFixed(1)} degrees bearing`;
  const attributionText = input.snapshot?.attributionText
    ?? (unique(reportLayers.map((layer) => layer.provenance?.attribution ?? getLayerSourceName(layer))).join("; ") || "Map data attribution captured from active sources");
  const assetId = `${handoffId}-snapshot`;
  const baseCaveats = buildCaveats({ layers: reportLayers, source, scientificQA: input.scientificQA, options });
  const publicationReadiness = buildMapPublicationReadiness({
    mode: "report-handoff",
    overlayLayers: reportLayers,
    composition: {
      title,
      includeTitleBlock: true,
      includeScaleBar: true,
      includeNorthArrow: true,
      includeLegend: true,
      includeAttribution: true,
      attributionText,
    },
    scientificQA: input.scientificQA,
    legendItems,
    snapshot: {
      scaleBarLabel,
      northArrowBearing: input.snapshot?.northArrowBearing ?? input.viewport.bearing,
      attributionText,
      legendItems,
    },
    caveats: baseCaveats,
    includeQaWarningCaveats: options.includeQaWarnings,
    now: new Date(createdAt),
  });
  const caveats = unique([...baseCaveats, ...publicationReadiness.caveats]).slice(0, 12);
  const reproducibility = buildReproducibility({
    layers: reportLayers,
    viewport: input.viewport,
    currentMapBounds: input.currentMapBounds,
    baseLayerName: input.baseLayerName,
    selectedFeatureIds: input.selectedFeatureIds,
    source,
    options,
    publicationReadiness,
  });
  const snapshot: MapReportHandoffDraft["snapshot"] = {
    assetId,
    title: `${title} map snapshot`,
    caption: `Static map capture for ${title}. Visible overlays: ${reportLayers.map((layer) => layer.name).join(", ") || "none"}. ${scaleBarLabel}; ${northArrowLabel}. Attribution: ${attributionText}.`,
    ...(input.snapshot?.dataUrl ? { dataUrl: input.snapshot.dataUrl } : {}),
    ...(input.snapshot?.filename ? { filename: input.snapshot.filename } : {}),
    ...(input.snapshot?.width ? { width: input.snapshot.width } : {}),
    ...(input.snapshot?.height ? { height: input.snapshot.height } : {}),
    visibleLayerNames: reportLayers.map((layer) => layer.name),
    legendItems,
    scaleBarLabel,
    northArrowLabel,
    attributionText,
  };
  const evidenceBlock = buildMapReportEvidenceBlock({
    draftId: handoffId,
    title,
    scope: source.scope,
    createdAt,
    layers: reportLayers,
    viewport: input.viewport,
    currentMapBounds: input.currentMapBounds,
    baseLayerName: input.baseLayerName,
    references,
    citations,
    caveats,
    publicationReadiness,
    reproducibility,
    legendItems,
    snapshot,
  });

  return {
    id: handoffId,
    version: MAP_REPORT_HANDOFF_VERSION,
    scope: source.scope,
    title,
    createdAt,
    snapshot,
    narrative: buildNarrative({
      title,
      layers: reportLayers,
      citations,
      source,
      baseLayerName: input.baseLayerName,
      currentMapBounds: input.currentMapBounds,
    }),
    citations,
    references,
    caveats,
    publicationReadiness,
    reproducibility,
    evidenceBlock,
    options,
  };
}

export function buildPendingReportInsertFromMapHandoff(
  draft: MapReportHandoffDraft,
  options: MapReportHandoffInsertOptions = {},
): PendingReportInsert {
  const referenceRows = buildReferenceTableRows(draft.references);
  const mapReviewEventIds = unique(options.mapReviewEventIds ?? []);
  const reviewEventFields = mapReviewEventIds.length > 0 ? { mapReviewEventIds } : {};
  const evidenceBlock = withMapReviewEventIds(draft.evidenceBlock, mapReviewEventIds);
  const structuredEvidenceBlockIds = [evidenceBlock.id];
  const reproducibilityItems = [
    ...draft.reproducibility.map((item) => `${item.label}: ${item.value}`),
    ...mapReviewEventIds.map((id) => `Map review event ID: ${id}`),
  ];
  const sections: ReportSection[] = [
    {
      id: `${draft.id}-finding-section`,
      title: `${draft.title} - Map Finding`,
      kind: "evidence",
      origin: "generated",
      generated: true,
      badgeLabel: "Map handoff",
      ...reviewEventFields,
      structuredEvidenceBlockIds,
      summary: draft.narrative.slice(0, 180),
      citationIds: draft.citations.map((citation) => citation.id),
      blocks: [
        {
          kind: "figure",
          assetId: draft.snapshot.assetId,
          title: draft.snapshot.title,
          caption: draft.snapshot.caption,
          assetType: "map",
          ...(draft.snapshot.dataUrl ? { dataUrl: draft.snapshot.dataUrl, mimeType: "image/png" } : {}),
          ...(draft.snapshot.width ? { width: draft.snapshot.width } : {}),
          ...(draft.snapshot.height ? { height: draft.snapshot.height } : {}),
        },
        { kind: "paragraph", text: draft.narrative },
        { kind: "bullet_list", items: draft.caveats },
      ],
    },
    {
      id: `${draft.id}-reproducibility-section`,
      title: `${draft.title} - Reproducibility`,
      kind: "methodology",
      origin: "generated",
      generated: true,
      badgeLabel: "Reproducibility block",
      ...reviewEventFields,
      structuredEvidenceBlockIds,
      citationIds: draft.citations.map((citation) => citation.id),
      blocks: [
        {
          kind: "bullet_list",
          items: reproducibilityItems,
        },
        {
          kind: "table",
          assetId: `${draft.id}-map-evidence-block`,
          title: "Structured map evidence block",
          caption: "Composition, QA, provenance, and snapshot references preserved as structured report metadata without raw spatial or rendered payloads.",
          columns: ["Field", "Value"],
          rows: buildEvidenceSummaryRows(evidenceBlock),
        },
        {
          kind: "table",
          assetId: `${draft.id}-structured-references`,
          title: "Structured map references",
          caption: "Layer, feature, analysis, and citation references serialized with the report handoff payload.",
          columns: ["Type", "ID", "Label", "Source", "CRS", "Timestamp", "Citation", "Evidence"],
          rows: referenceRows,
        },
      ],
    },
  ];

  return {
    id: draft.id,
    insertedAt: draft.createdAt,
    source: `map-report-handoff:${draft.scope}`,
    suggestedTitle: draft.title,
    ...reviewEventFields,
    citations: draft.citations,
    sections,
    structuredEvidenceBlocks: [evidenceBlock],
  };
}

export function buildReportDocumentFromMapHandoff(draft: MapReportHandoffDraft): ReportDocument {
  const insert = buildPendingReportInsertFromMapHandoff(draft);
  return {
    id: `${draft.id}-pdf-report`,
    name: draft.title,
    description: "Focused map evidence handoff with snapshot, structured citations, caveats, and reproducibility metadata.",
    templateId: "technical_report",
    citationStyle: "apa7",
    createdAt: draft.createdAt,
    updatedAt: draft.createdAt,
    metadata: {
      audience: "Map analyst",
      useCase: "Map evidence handoff",
    },
    citations: insert.citations,
    sections: insert.sections,
    sectionOrder: insert.sections.map((section) => section.id),
    linkedRunIds: [],
    ...(insert.structuredEvidenceBlocks ? { structuredEvidenceBlocks: insert.structuredEvidenceBlocks } : {}),
  };
}

export function enqueueMapReportHandoff(
  draft: MapReportHandoffDraft,
  options: MapReportHandoffInsertOptions = {},
): PendingReportInsert {
  const insert = buildPendingReportInsertFromMapHandoff(draft, options);
  enqueuePendingInsert(insert);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reporting/pending-changed"));
  }
  return insert;
}