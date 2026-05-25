/**
 * mapEvidencePublisher.ts — Urban to Map Evidence Publication Service (Prompt 17)
 *
 * Publishes spatial outputs from completed Urban Analytics workflow runs to
 * Map Explorer.  Each published output becomes an `OverlayLayerConfig` visible
 * in the map layer panel and an immutable `map-layer` evidence artifact in the
 * Urban Analytics context registry.
 *
 * Ownership: Urban Analytics.
 * Map Explorer integration: write-only via `useMapExplorerStore.getState()`.
 * Evidence registry integration: write-only via `useUrbanContextStore.getState()`.
 * Manifest integration: update-only via `useFlowStore.getState()`.
 *
 * Cross-module boundary rules:
 * - Never store GeoJSON payloads in evidence artifacts — ID references only.
 * - Never subscribe to Map Explorer in this module — use getState() point reads.
 * - Synthetic runtime mode runs are publication-ineligible by design.
 */

import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import { buildMapPublicationEvidenceArtifact } from '@/services/map/MapPublicationOutputBindingService';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useFlowStore } from '@/stores/useFlowStore';

import type {
  AnalysisLegendEntry,
  CompletedAnalysisRun,
  MapOutput,
  UrbanEvidenceArtifact,
  UrbanEvidenceQAState,
  UrbanEvidenceScalar,
  UrbanToMapEvidencePublication,
  UrbanToMapPublicationCrsSummary,
  UrbanToMapPublicationEligibility,
  UrbanToMapPublicationQaSummary,
  UrbanToMapPublicationStyleLegendMetadata,
  UrbanToMapPublicationUncertaintyNotes,
  UrbanWorkflowRunManifest,
} from '../lib/types';
import { useUrbanContextStore } from '../useUrbanContextStore';
import type { UrbanEvidenceArtifactDraft } from '../context/evidenceArtifacts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PUBLICATION_LAYER_OPACITY = 0.85;
const PUBLICATION_LAYER_GROUP = 'analysis' as const;
const PUBLICATION_DISPLAY_CRS = 'EPSG:4326' as const;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function newPublicationId(): string {
  return `urban-pub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeReferencePart(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 72) || 'ref';
}

function resolvePublicationArtifactId(runId: string, outputId: string): string {
  return `urban-map-artifact-${safeReferencePart(runId)}-${safeReferencePart(outputId)}`;
}

function resolveLayerId(runId: string, outputId: string): string {
  return `urban-pub-${safeReferencePart(runId)}-${safeReferencePart(outputId)}`;
}

function resolveLayerType(mapOutput: MapOutput): OverlayLayerConfig['type'] {
  if (mapOutput.engineBridge?.layerType === 'heatmap') return 'heatmap';
  if (mapOutput.type === 'heatmap') return 'heatmap';
  return 'geojson';
}

function resolveLayerOpacity(mapOutput: MapOutput): number {
  const opacity = mapOutput.engineBridge?.opacity;
  if (typeof opacity !== 'number' || !Number.isFinite(opacity)) return PUBLICATION_LAYER_OPACITY;
  return Math.max(0, Math.min(1, opacity));
}

function resolveSourceKind(
  manifest: UrbanWorkflowRunManifest | null,
): NonNullable<OverlayLayerConfig['sourceKind']> {
  if (!manifest) return 'derived';
  if (manifest.runtimeMode === 'demo') return 'demo';
  return 'derived';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isFeatureCollection(value: unknown): value is GeoJSON.FeatureCollection {
  return isRecord(value) && value.type === 'FeatureCollection' && Array.isArray(value.features);
}

function getRenderabilityBlocker(mapOutput: MapOutput): string | null {
  if (mapOutput.type === '3d_scene') {
    return `Map output "${mapOutput.id}" is a 3D scene and cannot be published as a 2D Map Explorer overlay yet.`;
  }

  if (!isFeatureCollection(mapOutput.geojson)) {
    return `Map output "${mapOutput.id}" does not contain a GeoJSON FeatureCollection payload.`;
  }

  if (mapOutput.geojson.features.length === 0) {
    return `Map output "${mapOutput.id}" has an empty FeatureCollection and would create a blank map layer.`;
  }

  return null;
}

function resolveFeatureCount(geojson: unknown): number | null {
  return isFeatureCollection(geojson) ? geojson.features.length : null;
}

function resolveGeometryType(geojson: unknown): string | null {
  if (!isFeatureCollection(geojson)) return null;
  const features = geojson.features;
  const firstGeomType = features.find((f) => f.geometry?.type)?.geometry?.type;
  return firstGeomType ?? null;
}

function collectCoordsFromGeometry(
  geometry: GeoJSON.Geometry | null | undefined,
  sink: Array<[number, number]>,
): void {
  if (!geometry) return;

  const collectFromPositionArray = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      sink.push([coords[0], coords[1]]);
      return;
    }
    for (const nested of coords) {
      collectFromPositionArray(nested);
    }
  };

  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries) {
      collectCoordsFromGeometry(child, sink);
    }
    return;
  }

  collectFromPositionArray(geometry.coordinates);
}

function resolveBounds(geojson: unknown): [number, number, number, number] | null {
  if (!isFeatureCollection(geojson)) return null;
  const features = geojson.features;
  const coords: Array<[number, number]> = [];

  for (const feature of features) {
    collectCoordsFromGeometry(feature.geometry, coords);
  }

  if (coords.length === 0) return null;

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getLayerCrs(layer: OverlayLayerConfig): string | null {
  return firstText(
    layer.metadata?.datasetContext?.crs,
    layer.metadata?.columnar?.crs,
    layer.metadata?.externalService?.crs,
    layer.metadata?.eoSource?.crs,
    layer.metadata?.crsSummary?.crs,
    layer.metadata?.registry?.crsSummary.crs,
  );
}

function buildCrsSummary(
  mapOutput: MapOutput,
  existingLayers: readonly OverlayLayerConfig[],
): UrbanToMapPublicationCrsSummary {
  const sourceLayerIds = mapOutput.engineBridge?.sourceLayerIds ?? [];
  const layerById = new Map(existingLayers.map((layer) => [layer.id, layer]));
  const sourceLayerCrs = sourceLayerIds.map((layerId) => {
    const layer = layerById.get(layerId);
    return {
      layerId,
      crs: layer ? getLayerCrs(layer) : null,
    };
  });
  const distinct = [...new Set(sourceLayerCrs.map((entry) => entry.crs).filter((crs): crs is string => Boolean(crs)))];
  const missingLayerIds = sourceLayerCrs.filter((entry) => !entry.crs).map((entry) => entry.layerId);
  const notes: string[] = [];

  if (sourceLayerIds.length === 0) {
    notes.push('No source layer IDs were recorded for this map output; analytical CRS provenance is unknown.');
  }
  if (missingLayerIds.length > 0) {
    notes.push(`Missing CRS metadata for source layer(s): ${missingLayerIds.join(', ')}.`);
  }
  if (distinct.length > 1) {
    notes.push(`Multiple source CRS values were observed: ${distinct.join(', ')}.`);
  }
  notes.push('Map Explorer renders GeoJSON coordinates in EPSG:4326 display space; this does not validate the analytical CRS used upstream.');

  return {
    declaredCrs: distinct.length === 1 ? distinct[0]! : null,
    displayCrs: PUBLICATION_DISPLAY_CRS,
    sourceLayerCrs,
    missingLayerIds,
    notes,
  };
}

function normalizeLegendEntry(entry: unknown): AnalysisLegendEntry | null {
  if (!isRecord(entry)) return null;
  const rawLabel = entry.label;
  const rawValue = entry.value ?? rawLabel;
  const label = typeof rawLabel === 'string' && rawLabel.trim()
    ? rawLabel.trim()
    : typeof rawValue === 'string' || typeof rawValue === 'number'
      ? String(rawValue)
      : null;
  if (!label) return null;

  const value = typeof rawValue === 'number' || typeof rawValue === 'string' ? rawValue : label;
  const normalized: AnalysisLegendEntry = { value, label };
  if (typeof entry.color === 'string' && entry.color.trim()) normalized.color = entry.color.trim();
  if (typeof entry.count === 'number' && Number.isFinite(entry.count)) normalized.count = entry.count;
  return normalized;
}

function legendEntriesFromStyle(style: Record<string, unknown> | undefined): AnalysisLegendEntry[] {
  if (!style) return [];
  const explicitLegend = style.legendEntries ?? style.legend ?? style.classes;
  if (!Array.isArray(explicitLegend)) return [];
  return explicitLegend
    .map(normalizeLegendEntry)
    .filter((entry): entry is AnalysisLegendEntry => entry != null);
}

function buildStyleLegendMetadata(mapOutput: MapOutput): UrbanToMapPublicationStyleLegendMetadata {
  const visualization = mapOutput.engineBridge?.visualization;
  const analysisLegend = visualization?.legendEntries ?? [];
  const styleLegend = legendEntriesFromStyle(mapOutput.style);
  const legendEntries = analysisLegend.length > 0 ? analysisLegend : styleLegend;
  const legendSource: UrbanToMapPublicationStyleLegendMetadata['legendSource'] = analysisLegend.length > 0
    ? 'analysis-visualization'
    : styleLegend.length > 0
      ? 'style'
      : 'fallback';

  return {
    layerType: resolveLayerType(mapOutput),
    opacity: resolveLayerOpacity(mapOutput),
    styleKeys: Object.keys(mapOutput.style ?? {}).sort(),
    legendSource,
    legendEntries: legendEntries.map((entry) => ({ ...entry })),
    valueField: visualization?.valueField ?? null,
    classificationMethod: visualization?.classificationMethod ?? null,
    colorRamp: visualization?.colorRamp ?? null,
  };
}

function formatCrsSummary(crsSummary: UrbanToMapPublicationCrsSummary): string {
  const declared = crsSummary.declaredCrs ?? 'unknown source CRS';
  return `${declared}; display ${crsSummary.displayCrs}`;
}

function uniqueText(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildPublicationQaSummary(
  manifest: UrbanWorkflowRunManifest | null,
  crsSummary: UrbanToMapPublicationCrsSummary,
  sourceLayers: readonly OverlayLayerConfig[],
): UrbanToMapPublicationQaSummary {
  const runtimeMode = manifest?.runtimeMode ?? 'unknown';
  const warnings: string[] = [];
  const blockers: string[] = [];
  const caveats: string[] = [];

  if (runtimeMode === 'demo') {
    warnings.push('Published from a demo-mode run; data does not represent real analytical output.');
  }
  if (runtimeMode === 'unknown') {
    caveats.push('Run mode is unknown because no verified run manifest was recorded.');
  }
  if (manifest?.dataFitness?.status === 'blocked') {
    blockers.push('Data fitness was blocked at run time.');
    caveats.push('Results should not be treated as analytically valid until the blocked data-fitness issue is resolved.');
  }
  if (manifest?.dataFitness?.status === 'warning') {
    caveats.push('Data fitness had warnings at run time. Verify with supporting evidence before reporting.');
  }
  if (crsSummary.missingLayerIds.length > 0) {
    warnings.push(`CRS metadata is missing for source layer(s): ${crsSummary.missingLayerIds.join(', ')}.`);
  }
  for (const layer of sourceLayers) {
    const scientificQA = layer.metadata?.scientificQA;
    if (scientificQA?.status === 'error' || layer.qaStatus === 'error') {
      blockers.push(`Source layer ${layer.name} has blocking map QA.`);
    } else if (scientificQA?.status === 'warning' || layer.qaStatus === 'warning') {
      warnings.push(`Source layer ${layer.name} has map QA warnings.`);
    }
    caveats.push(...(scientificQA?.caveats ?? []));
  }

  const status: UrbanToMapPublicationQaSummary['status'] = blockers.length > 0
    ? 'blocked'
    : warnings.length > 0 || manifest?.dataFitness?.status === 'warning'
      ? 'warning'
      : 'unknown';

  return {
    status,
    warnings: uniqueText(warnings),
    blockers: uniqueText(blockers),
    caveats: uniqueText(caveats),
  };
}

function buildUncertaintyNotes(
  manifest: UrbanWorkflowRunManifest | null,
): UrbanToMapPublicationUncertaintyNotes {
  const runtimeMode = manifest?.runtimeMode ?? 'unknown';
  const notes: string[] = [];
  if (runtimeMode === 'demo') {
    notes.push('Demo-mode run: spatial outputs are illustrative, not derived from live project data.');
  }
  if (runtimeMode === 'unknown') {
    notes.push('Runtime mode is unknown; treat the layer as unverified evidence.');
  }
  if (manifest?.readiness?.reasons.length) {
    notes.push(`Readiness notes: ${manifest.readiness.reasons.join('; ')}`);
  }
  return {
    notes,
    runtimeMode,
    isDemo: runtimeMode === 'demo',
  };
}

function evidenceQaStateFromPublication(qaSummary: UrbanToMapPublicationQaSummary): UrbanEvidenceQAState {
  if (qaSummary.status === 'blocked') return 'blocked';
  if (qaSummary.status === 'warning') return 'warning';
  return 'unvalidated';
}

function metadataStringList(values: readonly string[]): string | null {
  return values.length > 0 ? values.join(' | ') : null;
}

function buildLayerProvenance(
  run: CompletedAnalysisRun,
  mapOutput: MapOutput,
): NonNullable<OverlayLayerConfig['provenance']> {
  const bridge = mapOutput.engineBridge;
  return {
    label: mapOutput.title,
    method: bridge
      ? `Urban Analytics workflow run — engine: ${bridge.engine}, domain: ${bridge.domain}.`
      : 'Urban Analytics workflow run — no engine bridge metadata recorded.',
    generatedAt: run.insertedAt,
    ...(bridge?.sourceLayerIds?.length ? { sourceLayerIds: [...bridge.sourceLayerIds] } : {}),
  };
}

function buildLayerMetadata(
  mapOutput: MapOutput,
  featureCount: number | null,
  geometryType: string | null,
  studyAreaBounds?: [number, number, number, number] | null,
): NonNullable<OverlayLayerConfig['metadata']> {
  const bridge = mapOutput.engineBridge;
  // Study area bounds take priority over GeoJSON-derived bounds.
  const bounds = studyAreaBounds ?? resolveBounds(mapOutput.geojson);

  const base: NonNullable<OverlayLayerConfig['metadata']> = {
    ...(featureCount != null ? { featureCount } : {}),
    ...(geometryType ? { geometryType } : {}),
    ...(bounds ? { bounds } : {}),
  };

  if (!bridge) {
    return base;
  }

  return {
    ...base,
    analysisResult: {
      engine: bridge.engine,
      runTimestamp: bridge.runTimestamp ?? new Date().toISOString(),
      parameterSummary: bridge.parameters
        ? Object.entries(bridge.parameters)
            .map(([k, v]) => `${k}=${String(v)}`)
            .join('; ')
        : 'No parameter summary recorded',
      inputParameters: bridge.parameters ?? {},
      statisticalSummary: bridge.statisticalSummary ?? {},
      stale: false,
      visualization: bridge.visualization,
      ...(bridge.runId ? { runId: bridge.runId } : {}),
      ...(bridge.sourceLayerIds ? { sourceLayerIds: [...bridge.sourceLayerIds] } : {}),
    },
  };
}

function buildOverlayLayer(
  mapOutput: MapOutput,
  run: CompletedAnalysisRun,
  manifest: UrbanWorkflowRunManifest | null,
  styleLegendMetadata: UrbanToMapPublicationStyleLegendMetadata,
  crsSummary: UrbanToMapPublicationCrsSummary,
  studyAreaName?: string | null,
  studyAreaBounds?: [number, number, number, number] | null,
): OverlayLayerConfig {
  const layerId = resolveLayerId(run.runId, mapOutput.id);
  const featureCount = resolveFeatureCount(mapOutput.geojson);
  const geometryType = resolveGeometryType(mapOutput.geojson);
  const baseName = mapOutput.layerName ?? mapOutput.title;
  const layerName = studyAreaName ? `${baseName} — ${studyAreaName}` : baseName;

  const layer: OverlayLayerConfig = {
    id: layerId,
    name: layerName,
    type: resolveLayerType(mapOutput),
    visible: true,
    opacity: styleLegendMetadata.opacity,
    sourceData: mapOutput.geojson as GeoJSON.FeatureCollection,
    style: mapOutput.style ?? {},
    sourceKind: resolveSourceKind(manifest),
    group: PUBLICATION_LAYER_GROUP,
    metadata: {
      ...buildLayerMetadata(mapOutput, featureCount, geometryType, studyAreaBounds),
      crsSummary: {
        crs: crsSummary.declaredCrs,
        status: crsSummary.declaredCrs && crsSummary.missingLayerIds.length === 0 ? 'known' : 'missing',
        source: 'analysis-result',
        notes: crsSummary.notes,
      },
    },
    provenance: buildLayerProvenance(run, mapOutput),
    qaStatus: 'unchecked',
  };

  return layer;
}

function buildManifestReferenceId(run: CompletedAnalysisRun, manifest: UrbanWorkflowRunManifest | null): string | null {
  return manifest ? `urban-run-manifest:${run.runId}` : null;
}

function buildSourceSignature(
  mapOutput: MapOutput,
  existingLayers: readonly OverlayLayerConfig[],
): string {
  const layerById = new Map(existingLayers.map((layer) => [layer.id, layer]));
  return JSON.stringify((mapOutput.engineBridge?.sourceLayerIds ?? []).map((layerId) => {
    const layer = layerById.get(layerId);
    return {
      layerId,
      dataVersion: layer?.metadata?.dataVersion ?? null,
      updatedAt: layer?.metadata?.updatedAt ?? null,
      crs: layer ? getLayerCrs(layer) : null,
      qa: layer?.metadata?.scientificQA?.signature ?? layer?.qaStatus ?? null,
    };
  }));
}

function buildEvidenceArtifactDraft(
  mapOutput: MapOutput,
  run: CompletedAnalysisRun,
  manifest: UrbanWorkflowRunManifest | null,
  layerId: string,
  contextId: string,
  artifactId: string,
  publicationId: string,
  styleLegendMetadata: UrbanToMapPublicationStyleLegendMetadata,
  crsSummary: UrbanToMapPublicationCrsSummary,
  qaSummary: UrbanToMapPublicationQaSummary,
  uncertaintyNotes: UrbanToMapPublicationUncertaintyNotes,
  sourceSignature: string,
  supersedesArtifactId?: string,
): UrbanEvidenceArtifactDraft {
  const runtimeMode = manifest?.runtimeMode ?? 'unknown';
  const sourceLayerIds = mapOutput.engineBridge?.sourceLayerIds ?? [];
  const manifestReferenceId = buildManifestReferenceId(run, manifest);
  const qaState = evidenceQaStateFromPublication(qaSummary);
  const warnings = [...qaSummary.warnings, ...qaSummary.blockers];
  const limitations = [...qaSummary.caveats, ...crsSummary.notes, ...uncertaintyNotes.notes];
  const metadata: Record<string, UrbanEvidenceScalar> = {
    publicationId,
    publicationLayerId: layerId,
    publicationRunId: run.runId,
    publicationOutputId: mapOutput.id,
    publicationRuntimeMode: runtimeMode,
    publicationIsDemo: runtimeMode === 'demo',
    publicationIsSynthetic: runtimeMode === 'synthetic',
    publicationManifestId: manifestReferenceId,
    publicationSourceLayerIds: metadataStringList(sourceLayerIds),
    publicationSourceSignature: sourceSignature,
    publicationLayerType: styleLegendMetadata.layerType,
    publicationOpacity: styleLegendMetadata.opacity,
    publicationStyleKeys: metadataStringList(styleLegendMetadata.styleKeys),
    publicationLegendSource: styleLegendMetadata.legendSource,
    publicationLegendEntryCount: styleLegendMetadata.legendEntries.length,
    publicationCrsDeclared: crsSummary.declaredCrs,
    publicationCrsDisplay: crsSummary.displayCrs,
    publicationMissingCrsLayerIds: metadataStringList(crsSummary.missingLayerIds),
    publicationCrsNotes: metadataStringList(crsSummary.notes),
    publicationQaStatus: qaSummary.status,
    publicationUncertaintyNotes: metadataStringList(uncertaintyNotes.notes),
    ...(supersedesArtifactId ? { supersedesArtifactId } : {}),
  };

  const draft: UrbanEvidenceArtifactDraft = {
    id: artifactId,
    artifactId,
    kind: 'map-layer',
    title: `Map layer: ${mapOutput.title}`,
    summary: uncertaintyNotes.isDemo
      ? `Demo-mode spatial output published to Map Explorer from run ${run.runId}.`
      : `Spatial output published to Map Explorer from run ${run.runId}.`,
    sourceModule: 'urban-analytics',
    sourceId: layerId,
    state: 'published',
    linkedContextId: contextId,
    linkedRunId: run.runId,
    linkedLayerIds: [layerId, ...sourceLayerIds],
    ...(supersedesArtifactId ? { linkedArtifactIds: [supersedesArtifactId] } : {}),
    mapLayerId: layerId,
    ...(manifest?.flowId ? { flowId: manifest.flowId } : {}),
    qa: {
      state: qaState,
      warnings,
      limitations,
    },
    provenance: {
      sourceModule: 'urban-analytics',
      createdAt: new Date().toISOString(),
      sourceId: layerId,
      runId: run.runId,
      ...(manifest?.flowId ? { flowId: manifest.flowId } : {}),
      contextId,
      layerIds: [layerId, ...sourceLayerIds],
      filePaths: [],
      inputArtifactIds: [],
      parentArtifactIds: supersedesArtifactId ? [supersedesArtifactId] : [],
    },
    metadata,
  };
  return draft;
}

function buildPublicationRecord(
  mapOutput: MapOutput,
  run: CompletedAnalysisRun,
  manifest: UrbanWorkflowRunManifest | null,
  layer: OverlayLayerConfig,
  artifactId: string,
  publicationId: string,
  styleLegendMetadata: UrbanToMapPublicationStyleLegendMetadata,
  crsSummary: UrbanToMapPublicationCrsSummary,
  qaSummary: UrbanToMapPublicationQaSummary,
  uncertaintyNotes: UrbanToMapPublicationUncertaintyNotes,
): UrbanToMapEvidencePublication {
  const runtimeMode = manifest?.runtimeMode ?? 'unknown';
  const featureCount = resolveFeatureCount(mapOutput.geojson);
  const geometryType = resolveGeometryType(mapOutput.geojson);
  const publishedAt = new Date().toISOString();

  return {
    publicationId,
    artifactId,
    runId: run.runId,
    outputLayerReference: {
      mapLayerId: layer.id,
      mapOutputId: mapOutput.id,
      layerName: layer.name,
      sourceLayerIds: mapOutput.engineBridge?.sourceLayerIds ?? [],
    },
    styleLegendMetadata,
    crsSummary,
    qaSummary,
    uncertaintyNotes,
    figureMetadata: {
      title: mapOutput.title,
      caption: `Urban Analytics spatial output published at ${publishedAt}. ${formatCrsSummary(crsSummary)}.`,
      crsSummary: formatCrsSummary(crsSummary),
      featureCount,
      geometryType,
      sourceSummary: manifest
        ? `Run ${run.runId} · flow ${manifest.flowId} · mode ${runtimeMode}`
        : `Run ${run.runId} · no manifest recorded`,
    },
    publishedAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a specific `MapOutput` from a completed run is eligible for
 * publication to Map Explorer.
 *
 * Ineligible cases:
 * - Run has no `mapOutputs`.
 * - The requested output ID does not exist in `run.mapOutputs`.
 * - Manifest exists and `runtimeMode === 'synthetic'` (synthetic data must
 *   never be published as spatial layers without explicit audit controls).
 * - Output is not renderable as a 2D Map Explorer layer: invalid GeoJSON,
 *   empty FeatureCollection, or `3d_scene` pending a 3D publication contract.
 */
export function assessPublicationEligibility(
  run: CompletedAnalysisRun,
  outputId: string,
  manifest: UrbanWorkflowRunManifest | null,
): UrbanToMapPublicationEligibility {
  const reasons: string[] = [];

  if (!run.mapOutputs || run.mapOutputs.length === 0) {
    reasons.push('Run has no spatial map outputs.');
    return { eligible: false, reasons };
  }

  const output = run.mapOutputs.find((o) => o.id === outputId);
  if (!output) {
    reasons.push(`No map output with id "${outputId}" found on run "${run.runId}".`);
    return { eligible: false, reasons };
  }

  if (manifest?.runtimeMode === 'synthetic') {
    reasons.push(
      'Synthetic-mode runs cannot be published to Map Explorer. ' +
        'Synthetic data is for internal testing only and must not appear as map layers.',
    );
    return { eligible: false, reasons };
  }

  const renderabilityBlocker = getRenderabilityBlocker(output);
  if (renderabilityBlocker) {
    reasons.push(renderabilityBlocker);
    return { eligible: false, reasons };
  }

  return { eligible: true, reasons: [] };
}

export interface PublishUrbanRunOutputResult {
  eligible: boolean;
  reasons: string[];
  publications: UrbanToMapEvidencePublication[];
}

/**
 * Publish all spatial map outputs from a completed Urban Analytics run to
 * Map Explorer.
 *
 * For each eligible `MapOutput`:
 * 1. Builds an `OverlayLayerConfig` and calls `addOverlayLayer`.
 * 2. Marks the layer as an active analysis result layer.
 * 3. Registers a `map-layer` evidence artifact in the Urban Analytics context.
 * 4. Updates the sidecar manifest's `mapArtifactIds` list.
 * 5. Returns a `UrbanToMapEvidencePublication` record.
 *
 * Returns early with `eligible: false` if no outputs are eligible.
 * Individual output ineligibility is skipped and included in result reasons.
 */
export function publishUrbanRunOutputsToMap(
  run: CompletedAnalysisRun,
): PublishUrbanRunOutputResult {
  const flowStore = useFlowStore.getState();
  const manifest = flowStore.lookupManifest(run.runId);

  const ineligibleOutputIds: string[] = [];
  const ineligibleReasons: string[] = [];
  const eligibleOutputs: MapOutput[] = [];

  for (const output of run.mapOutputs ?? []) {
    const check = assessPublicationEligibility(run, output.id, manifest);
    if (check.eligible) {
      eligibleOutputs.push(output);
    } else {
      ineligibleOutputIds.push(output.id);
      ineligibleReasons.push(...check.reasons);
      if (check.reasons.length > 0) {
        console.warn(
          `[mapEvidencePublisher] Skipping output "${output.id}" on run "${run.runId}": ${check.reasons.join('; ')}`,
        );
      }
    }
  }

  if (eligibleOutputs.length === 0) {
    return {
      eligible: false,
      reasons: [...new Set(ineligibleReasons)].length > 0
        ? [...new Set(ineligibleReasons)]
        : ineligibleOutputIds.length > 0
          ? [`All ${ineligibleOutputIds.length} output(s) were ineligible for publication.`]
          : ['Run has no spatial map outputs.'],
      publications: [],
    };
  }

  const mapStore = useMapExplorerStore.getState();
  const urbanContextStore = useUrbanContextStore.getState();
  const contextId = urbanContextStore.context?.contextId ?? null;
  if (!contextId) {
    return {
      eligible: false,
      reasons: ['An active Urban Analysis Context is required before publishing map-derived evidence.'],
      publications: [],
    };
  }
  const studyAreaName = urbanContextStore.context?.studyAreaName ?? null;
  const studyAreaBounds = urbanContextStore.context?.studyAreaBounds ?? null;

  const publications: UrbanToMapEvidencePublication[] = [];
  const newLayerIds: string[] = [];

  for (const output of eligibleOutputs) {
    const sourceSignature = buildSourceSignature(output, mapStore.overlayLayers);
    const baseArtifactId = resolvePublicationArtifactId(run.runId, output.id);
    const styleLegendMetadata = buildStyleLegendMetadata(output);
    const crsSummary = buildCrsSummary(output, mapStore.overlayLayers);
    const sourceLayerIds = output.engineBridge?.sourceLayerIds ?? [];
    const sourceLayers = mapStore.overlayLayers.filter((layer) => sourceLayerIds.includes(layer.id));
    const qaSummary = buildPublicationQaSummary(manifest, crsSummary, sourceLayers);
    const uncertaintyNotes = buildUncertaintyNotes(manifest);
    const layer = buildOverlayLayer(
      output,
      run,
      manifest,
      styleLegendMetadata,
      crsSummary,
      studyAreaName,
      studyAreaBounds,
    );
    const existingLayer = mapStore.overlayLayers.find((entry) => entry.id === layer.id) ?? null;
    if (!existingLayer) {
      mapStore.addOverlayLayer(layer);
    }
    newLayerIds.push(layer.id);

    const currentArtifacts = useUrbanContextStore.getState().evidenceArtifacts;
    const existingArtifact = currentArtifacts.find((artifact) =>
      artifact.kind === 'map-layer'
      && artifact.state === 'published'
      && artifact.metadata?.publicationRunId === run.runId
      && artifact.metadata?.publicationOutputId === output.id
      && artifact.metadata?.publicationSourceSignature === sourceSignature,
    ) ?? null;
    const supersededArtifact = existingArtifact
      ? null
      : currentArtifacts.find((artifact) =>
          artifact.kind === 'map-layer'
          && artifact.state === 'published'
          && artifact.metadata?.publicationRunId === run.runId
          && artifact.metadata?.publicationOutputId === output.id,
        ) ?? null;
    const publicationId = typeof existingArtifact?.metadata?.publicationId === 'string'
      ? existingArtifact.metadata.publicationId
      : newPublicationId();
    const artifactId = existingArtifact?.id
      ?? (supersededArtifact
        ? `${baseArtifactId}-revision-${safeReferencePart(publicationId)}`
        : baseArtifactId);
    if (supersededArtifact) {
      urbanContextStore.markEvidenceArtifactStale(
        supersededArtifact.id,
        `Source layer state changed after publication of run ${run.runId}.`,
      );
    }
    const registeredArtifact = existingArtifact ?? urbanContextStore.registerEvidenceArtifact(buildEvidenceArtifactDraft(
      output,
      run,
      manifest,
      layer.id,
      contextId,
      artifactId,
      publicationId,
      styleLegendMetadata,
      crsSummary,
      qaSummary,
      uncertaintyNotes,
      sourceSignature,
      supersededArtifact?.id,
    ));

    const hasMapArtifact = mapStore.mapEvidenceArtifacts.some((artifact) =>
      artifact.sourceId === layer.id,
    );
    if (!hasMapArtifact) {
      mapStore.upsertMapEvidenceArtifact(buildMapPublicationEvidenceArtifact({
        layer,
        sourceModule: 'urban-analytics',
        urbanEvidenceId: registeredArtifact.id,
        linkedArtifactIds: [registeredArtifact.id],
        linkedRunId: run.runId,
        ...(manifest?.flowId ? { linkedWorkflowId: manifest.flowId } : {}),
        runtimeMode: manifest?.runtimeMode ?? 'unknown',
        ...(buildManifestReferenceId(run, manifest) ? { manifestReferenceId: buildManifestReferenceId(run, manifest)! } : {}),
        crsSummary: {
          ...(crsSummary.declaredCrs ? { declaredCrs: crsSummary.declaredCrs } : {}),
          displayCrs: crsSummary.displayCrs,
          sourceLayerCrs: crsSummary.sourceLayerCrs,
          missingLayerIds: crsSummary.missingLayerIds,
          notes: crsSummary.notes,
        },
        contextId,
        qa: {
          state: qaSummary.status === 'blocked'
            ? 'blocked'
            : qaSummary.status === 'warning' ? 'warning' : 'unchecked',
          issueIds: [],
          issueCount: 0,
          blockerCount: qaSummary.blockers.length,
          caveats: uniqueText([...qaSummary.warnings, ...qaSummary.blockers, ...qaSummary.caveats]),
        },
      }));
    }

    const publication = buildPublicationRecord(
      output,
      run,
      manifest,
      existingLayer ?? layer,
      registeredArtifact.id,
      publicationId,
      styleLegendMetadata,
      crsSummary,
      qaSummary,
      uncertaintyNotes,
    );
    publications.push(publication);
  }

  // Mark all newly published layers as active analysis result layers.
  const existing = mapStore.activeAnalysisResultLayerIds ?? [];
  const deduped = [...new Set([...existing, ...newLayerIds])];
  mapStore.setActiveAnalysisResultLayers(deduped);

  // Update the sidecar manifest's mapArtifactIds if a manifest exists.
  if (manifest) {
    const artifactIds = publications.map((p) => p.artifactId);
    const updatedManifest: UrbanWorkflowRunManifest = {
      ...manifest,
      mapArtifactIds: [...new Set([...manifest.mapArtifactIds, ...artifactIds])],
    };
    flowStore.registerManifest(updatedManifest);
  }

  return {
    eligible: true,
    reasons: [],
    publications,
  };
}

export interface SupersedePublishedUrbanMapEvidenceInput {
  layerId: string;
  layer?: OverlayLayerConfig | null;
  reason?: string;
  changedAt?: string;
}

/**
 * Transition published Urban map evidence after a linked map layer changes.
 * Only lifecycle/QA state on the prior claim changes; the current claim is a
 * new artifact linked back to the stale record.
 */
export function supersedePublishedUrbanMapEvidenceForLayerChange(
  input: SupersedePublishedUrbanMapEvidenceInput,
): UrbanEvidenceArtifact[] {
  const urbanStore = useUrbanContextStore.getState();
  const changedAt = input.changedAt ?? new Date().toISOString();
  const reason = input.reason ?? `Map source layer ${input.layerId} changed after evidence publication.`;
  const layerQa = input.layer?.metadata?.scientificQA;
  const affected = urbanStore.evidenceArtifacts.filter((artifact) =>
    artifact.kind === 'map-layer'
    && artifact.state === 'published'
    && (
      artifact.mapLayerId === input.layerId
      || artifact.linkedLayerIds.includes(input.layerId)
      || artifact.provenance.layerIds.includes(input.layerId)
    ),
  );
  const supersedingArtifacts: UrbanEvidenceArtifact[] = [];

  for (const artifact of affected) {
    const dependencyChanged = artifact.mapLayerId !== input.layerId;
    const removed = input.layer == null;
    const blocked = removed || dependencyChanged || input.layer?.qaStatus === 'error' || layerQa?.status === 'error';
    urbanStore.markEvidenceArtifactStale(artifact.id, reason);
    const successorId = `${artifact.id}-revision-${safeReferencePart(newPublicationId())}`;
    const successor = urbanStore.registerEvidenceArtifact({
      id: successorId,
      artifactId: successorId,
      kind: artifact.kind,
      title: artifact.title,
      summary: `Superseding evidence reference after map source change: ${artifact.title}.`,
      state: blocked ? 'blocked' : 'published',
      sourceModule: artifact.sourceModule,
      ...(artifact.sourceId ? { sourceId: artifact.sourceId } : {}),
      ...(artifact.linkedContextId ? { linkedContextId: artifact.linkedContextId } : {}),
      ...(artifact.linkedStudyAreaId ? { linkedStudyAreaId: artifact.linkedStudyAreaId } : {}),
      ...(artifact.linkedRunId ? { linkedRunId: artifact.linkedRunId } : {}),
      linkedLayerIds: artifact.linkedLayerIds,
      linkedFilePaths: artifact.linkedFilePaths,
      linkedArtifactIds: [...artifact.linkedArtifactIds, artifact.id],
      ...(artifact.cardId ? { cardId: artifact.cardId } : {}),
      ...(artifact.flowId ? { flowId: artifact.flowId } : {}),
      ...(artifact.indicatorKind ? { indicatorKind: artifact.indicatorKind } : {}),
      ...(artifact.mapLayerId ? { mapLayerId: artifact.mapLayerId } : {}),
      tags: artifact.tags,
      provenance: {
        ...artifact.provenance,
        createdAt: changedAt,
        parentArtifactIds: [...artifact.provenance.parentArtifactIds, artifact.id],
      },
      qa: {
        state: blocked ? 'blocked' : 'warning',
        warnings: uniqueText([
          ...artifact.qa.warnings,
          reason,
          ...(layerQa?.caveats ?? []),
        ]),
        limitations: uniqueText([
          ...artifact.qa.limitations,
          ...(dependencyChanged
            ? ['A linked source layer changed; rerun or republish the derived layer before analytical use.']
            : []),
          ...(removed
            ? ['The published map layer was removed; restore or republish it before analytical use.']
            : []),
        ]),
      },
      ...(artifact.dataFitness ? { dataFitness: artifact.dataFitness } : {}),
      metadata: {
        ...(artifact.metadata ?? {}),
        supersedesArtifactId: artifact.id,
        sourceChangedAt: changedAt,
        sourceChangedLayerId: input.layerId,
        sourceDataVersion: input.layer?.metadata?.dataVersion ?? null,
        publicationQaStatus: blocked ? 'blocked' : 'warning',
      },
      createdAt: changedAt,
      updatedAt: changedAt,
    });
    supersedingArtifacts.push(successor);
  }

  return supersedingArtifacts;
}
