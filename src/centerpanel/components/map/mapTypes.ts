/* ================================================================== */
/*  Shared types and constants for Map Explorer sub-components         */
/* ================================================================== */

import type maplibregl from "maplibre-gl";
import type {
  AnalysisEngineId,
  AnalysisVisualizationSpec,
  StatisticalSummaryValue,
} from "@/features/urbanAnalytics/lib/types";
import type { EOLayerContextMetadata } from "@/services/data/eo/types";

export type BaseLayerId = "streets" | "satellite" | "dark" | "terrain";

export type MapExplorerMode = "embedded" | "modal" | "presentation";

export interface MapPin {
  id: string;
  lng: number;
  lat: number;
  label?: string;
}

export interface BaseLayerConfig {
  name: string;
  url: string | maplibregl.StyleSpecification;
}

/** Viewport state persisted across modal close/reopen cycles */
export interface ViewportState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

/** Metadata about an overlay layer (lightweight — safe to persist) */
export type AnalysisOutputMode = "live" | "demo" | "synthetic" | "unknown";

export type AnalysisResultQAStatus = "unchecked" | "passed" | "warning" | "error" | "blocked";

export interface AnalysisResultQASummary {
  status: AnalysisResultQAStatus;
  issueIds: string[];
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  caveats: string[];
  uncertaintyNotes: string[];
  checkedAt?: string;
}

export interface AnalysisResultHandoffHints {
  reportCompatible: boolean;
  dashboardCompatible: boolean;
  ideCompatible: boolean;
  reportInsertionHint: string;
  dashboardBindingHint: string;
  ideArtifactHint: string;
}

export interface AnalysisResultMetadata {
  engine: AnalysisEngineId;
  runId?: string;
  sourceRunId?: string;
  algorithmWorkflowId?: string;
  runTimestamp: string;
  parameterSummary: string;
  inputParameters: Record<string, unknown>;
  statisticalSummary: Record<string, StatisticalSummaryValue>;
  sourceLayerIds?: string[];
  sourceDataVersion?: string;
  outputMode?: AnalysisOutputMode;
  qaSummary?: AnalysisResultQASummary;
  caveats?: string[];
  evidenceArtifactId?: string;
  handoffHints?: AnalysisResultHandoffHints;
  reproducibilityManifest?: MapReproducibilityManifest;
  rerunToken?: string;
  stale?: boolean;
  visualization: AnalysisVisualizationSpec;
}

export interface DatasetLayerContextMetadata {
  datasetId?: string;
  datasetTitle?: string;
  datasetCity?: string;
  layerId?: string;
  layerTitle?: string;
  source?: string;
  license?: string;
  crs?: string;
  updateDate?: string;
  thematicCoverage?: string[];
  spatialExtent?: string;
  schemaSummary?: string[];
  packageLayerCount?: number;
  packageFeatureCount?: number;
}

export interface ColumnarLayerMetadata {
  format: "arrow" | "geoparquet";
  geometryColumn?: string;
  geometryEncoding?: "wkb" | "geojson" | "wkt" | "lonlat" | "coordinates";
  rowCount?: number;
  estimatedMemoryBytes?: number;
  transferSizeBytes?: number;
  workerTableName?: string;
  geoParquetVersion?: string;
  geometryTypes?: string[];
  crs?: string;
}

export interface ExternalServiceLayerMetadata {
  kind: "wms" | "wmts" | "wfs" | "xyz" | "overpass" | "cityjson";
  endpoint: string;
  title?: string;
  serviceVersion?: string;
  layerName?: string;
  urlTemplate?: string;
  bounds?: [number, number, number, number];
  crs?: string;
  refreshedAt?: string;
  dependencyStatus?: "live" | "cached" | "stale" | "offline" | "unknown";
  lastRequestAt?: string;
  cacheTtlMs?: number;
  cacheHit?: boolean;
  staleAt?: string;
  offlineReason?: string;
  credentialMode?: "not-required" | "browser-managed" | "unknown";
  corsMode?: "browser-fetch" | "tile-client" | "unknown";
  license?: string;
  attribution?: string;
  caveats?: string[];
}

export interface ImportLayerSourceMetadata {
  format: "geojson" | "csv" | "arrow" | "geoparquet" | "kml" | "kmz" | "gpx" | "shapefile" | "geopackage";
  fileName: string;
  sourceName: string;
  sourceId?: string;
  importedAt: string;
  importedFeatureCount: number;
  totalRecords?: number;
  skippedRecordCount?: number;
  fileSizeBytes?: number;
  sourceUri?: string;
  declaredCrs?: string;
  license?: string;
  attribution?: string;
  sourceConfidence: "declared" | "derived-from-file" | "unknown";
  workerTransferStatus?: "not-required" | "prepared" | "ready" | "failed";
  workerTableName?: string;
  caveats: string[];
}

export interface LayerCartographyReviewMetadata {
  status: "unchecked" | "needs-review" | "reviewed";
  reviewedAt?: string;
  recommendationIds: string[];
  appliedRecommendationIds: string[];
  dismissedRecommendationIds?: string[];
  lastAppliedTitle?: string;
  legendPersisted?: boolean;
}

export interface MapTopologyRepairMetadata {
  version: 1;
  repairedAt: string;
  sourceLayerId: string;
  engine: "geos-wasm";
  operations: string[];
  findingCodes: string[];
  sourceFeatureCount: number;
  outputFeatureCount: number;
  repairedFeatureCount: number;
  removedFeatureCount: number;
  caveats: string[];
  manifestId: string;
}

export type MapDefinitionFilterOperator =
  | "equals"
  | "not-equals"
  | "contains"
  | "greater-than"
  | "less-than";

export interface MapLayerDefinitionFilter {
  field: string;
  operator: MapDefinitionFilterOperator;
  value: string;
}

export interface MapLayerContentsState {
  groupId: string;
  groupLabel: string;
  minZoom?: number;
  maxZoom?: number;
  definitionFilter?: MapLayerDefinitionFilter;
  selectable: boolean;
  editable: boolean;
  updatedAt: string;
}

export type LayerPersistenceSource = "inline" | "url" | "metadata";

export type LayerRestoreState =
  | "restored"
  | "external-reference"
  | "metadata-only"
  | "stale-reference";

export interface LayerPersistenceMetadata {
  snapshotVersion: number;
  savedAt: string;
  sourcePersistence: LayerPersistenceSource;
  restoreState: LayerRestoreState;
  restoreWarnings: string[];
  sourceId?: string;
  sourceStorageMode?: import("@/services/map/contracts/gisContracts").SourceStorageMode;
  sourceRestoreStatus?: import("@/services/map/contracts/gisContracts").SourceRestoreStatus;
  sourceRef?: string;
}

export type LayerMetadataSource =
  | "explicit"
  | "user-declared"
  | "import-source"
  | "dataset-context"
  | "columnar"
  | "eo-source"
  | "external-service"
  | "analysis-result"
  | "feature-collection"
  | "legacy-default"
  | "unknown";

export type LayerCrsStatus = "known" | "missing" | "unknown";

export interface LayerCrsSummary {
  crs: string | null;
  status: LayerCrsStatus;
  source: LayerMetadataSource;
  notes: string[];
}

export interface LayerGeometrySummary {
  geometryType: string;
  geometryTypes: string[];
  featureCount: number | null;
  source: LayerMetadataSource;
  notes: string[];
  bounds?: [number, number, number, number];
}

export type LayerSchemaFieldRole = "geometry" | "attribute" | "identifier" | "temporal" | "unknown";

export interface LayerSchemaFieldSummary {
  name: string;
  role: LayerSchemaFieldRole;
  type?: string;
  nullable?: boolean;
}

export interface LayerSchemaSummary {
  fieldCount: number;
  fields: LayerSchemaFieldSummary[];
  source: LayerMetadataSource;
  notes: string[];
  geometryField?: string;
}

export interface LayerLicenseAttributionSummary {
  license: string | null;
  attribution: string | null;
  sourceName: string | null;
  requiresAttribution: boolean;
  source: LayerMetadataSource;
  notes: string[];
  sourceUrl?: string;
}

export type LayerPublicationReadinessStatus = "ready" | "ready-with-caveats" | "needs-review" | "blocked";

export interface LayerPublicationReadiness {
  status: LayerPublicationReadinessStatus;
  missingFields: string[];
  blockingIssueIds: string[];
  caveats: string[];
  checkedAt?: string;
}

export type LayerRenderMode = "full" | "preview";

export interface LayerRenderBudgetMetadata {
  mode: LayerRenderMode;
  featureCount: number;
  coordinateCount: number;
  propertyFieldCount: number;
  estimatedRenderBytes: number;
  renderFeatureLimit: number;
  renderCoordinateLimit: number;
  estimatedRenderByteLimit: number;
  previewFeatureCount?: number;
  previewCoordinateCount?: number;
  warnings: string[];
}

export interface MapLayerReadinessSummary {
  layerId: string;
  status: LayerPublicationReadinessStatus;
  geometryReady: boolean;
  crsReady: boolean;
  metadataReady: boolean;
  queryReady: boolean;
  temporalReady: boolean;
  workerReady: boolean;
  missingFields: string[];
  blockingIssueIds: string[];
  caveats: string[];
}

export interface LayerRegistryCompatibilitySummary {
  legacy: boolean;
  source: "explicit" | "normalized";
  missingMetadata: string[];
}

export interface LayerRegistryMetadata {
  sourceKind: LayerSourceKind;
  provenance: LayerProvenance;
  crsSummary: LayerCrsSummary;
  geometrySummary: LayerGeometrySummary;
  featureCount: number | null;
  schemaSummary: LayerSchemaSummary;
  licenseAttribution: LayerLicenseAttributionSummary;
  qaStatus: LayerQaStatus;
  queryable: boolean;
  publicationReadiness: LayerPublicationReadiness;
  readiness: MapLayerReadinessSummary;
  compatibility: LayerRegistryCompatibilitySummary;
  evidenceArtifactId?: string;
}

export interface MapReprojectionCacheLayerMetadata {
  entries: number;
  maxEntries: number;
  hits: number;
  misses: number;
  bypasses: number;
  evictions: number;
  hitRate: number;
  projectedFeatureCount: number;
  projectedCoordinateCount: number;
  sourceIds: string[];
  targetCrs: string | null;
  lastRunAt: string;
}

export const MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL = "tiled (simplified)" as const;

export type MapVectorTileSourceMode = "pmtiles" | "on-the-fly";

export type MapVectorTileGeneralizationMode = "none" | "zoom-dependent";

export interface MapVectorTileZoomLevelMetadata {
  zoom: number;
  tolerance: number;
  tileCount: number;
  featureCount: number;
  originalCoordinateCount: number | null;
  simplifiedCoordinateCount: number | null;
  simplificationRatio: number | null;
}

export interface MapVectorTileLayerMetadata {
  version: 1;
  sourceMode: MapVectorTileSourceMode;
  sourceFormat: "geojson" | "pmtiles";
  generalization: MapVectorTileGeneralizationMode;
  caveatLabel: typeof MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL;
  caveats: string[];
  minZoom: number;
  maxZoom: number;
  tileSize: number;
  originalFeatureCount: number | null;
  originalCoordinateCount: number | null;
  zoomLevels: MapVectorTileZoomLevelMetadata[];
  sourceId?: string;
  sourceLayer?: string;
  sourceUrl?: string;
  activeZoom?: number;
  activeTileCount?: number;
  activeFeatureCount?: number;
  activeCoordinateCount?: number;
}

export interface LayerMetadata {
  featureCount?: number;
  geometryType?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  fields?: string[];
  importFormat?: "geojson" | "csv" | "arrow" | "geoparquet" | "kml" | "kmz" | "gpx";
  updatedAt?: string;
  dataVersion?: string;
  importSource?: ImportLayerSourceMetadata;
  analysisResult?: AnalysisResultMetadata;
  datasetContext?: DatasetLayerContextMetadata;
  columnar?: ColumnarLayerMetadata;
  eoSource?: EOLayerContextMetadata;
  externalService?: ExternalServiceLayerMetadata;
  scientificQA?: LayerScientificQAMetadata;
  cartographyReview?: LayerCartographyReviewMetadata;
  topologyRepair?: MapTopologyRepairMetadata;
  contents?: MapLayerContentsState;
  persistence?: LayerPersistenceMetadata;
  sourceId?: string;
  sourceStorageMode?: import("@/services/map/contracts/gisContracts").SourceStorageMode;
  sourceRestoreStatus?: import("@/services/map/contracts/gisContracts").SourceRestoreStatus;
  schemaSummary?: LayerSchemaSummary;
  crsSummary?: LayerCrsSummary;
  geometrySummary?: LayerGeometrySummary;
  licenseAttribution?: LayerLicenseAttributionSummary;
  publicationReadiness?: LayerPublicationReadiness;
  reproducibilityManifest?: MapReproducibilityManifest;
  evidenceArtifactId?: string;
  temporalEvidence?: MapTemporalEvidenceMetadata;
  scenarioComparison?: MapScenarioComparisonEvidenceMetadata;
  voxCitySync?: MapVoxCitySyncMetadata;
  rendering?: LayerRenderBudgetMetadata;
  registry?: LayerRegistryMetadata;
  reprojectionCache?: MapReprojectionCacheLayerMetadata;
  vectorTiles?: MapVectorTileLayerMetadata;
}

export type MapReproducibilityManifestStatus = "preview" | "applied" | "blocked";

export interface MapReproducibilityLayerReference {
  layerId: string;
  role: "source" | "preview" | "derived-output" | "comparison-source";
  name?: string;
  sourceKind?: LayerSourceKind;
  featureCount?: number;
}

export interface MapReproducibilityAoiReference {
  source: string;
  label?: string;
  aoiId?: string;
  viewportBounds?: [number, number, number, number];
  selectedLayerIds: string[];
  selectedFeatureCount: number;
  drawnPolygonCount: number;
  geocodedPlaceLabel?: string;
}

export interface MapReproducibilityCrsSummary {
  status: "known" | "mixed" | "missing" | "not-applicable";
  sourceCrs?: string | null;
  displayCrs: string;
  executionCrs?: string | null;
  executionKind?: import("@/services/map/contracts/gisContracts").CrsExecutionKind;
  sourceLayerCrs: Array<{
    layerId: string;
    crs: string | null;
  }>;
  missingLayerIds: string[];
  notes: string[];
}

export interface MapReproducibilityQASummary {
  status: LayerQaStatus | "blocked";
  issueIds: string[];
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  blockers: string[];
  warnings: string[];
  caveats: string[];
  categorySummaries?: LayerScientificQACategorySummary[];
}

export interface MapReproducibilityExpectedOutput {
  layerName: string | null;
  geometryClass: string;
  featureCount: number;
  bounds: [number, number, number, number] | null;
  outputLayerGroup: string;
  needsWorker: boolean;
  reportCompatible: boolean;
  dashboardCompatible: boolean;
  ideCompatible: boolean;
}

export interface MapReproducibilityHandoffReferences {
  reportItemIds: string[];
  dashboardBindingIds: string[];
  ideArtifactIds: string[];
}

export interface MapReproducibilityManifest {
  version: number;
  manifestId: string;
  workflowId: string;
  status: MapReproducibilityManifestStatus;
  createdAt: string;
  mapContextId: string;
  operation: string;
  workflowKind: string;
  inputLayerIds: string[];
  sourceLayerIds: string[];
  outputLayerIds: string[];
  sourceLayers: MapReproducibilityLayerReference[];
  outputLayers: MapReproducibilityLayerReference[];
  aoiReference: MapReproducibilityAoiReference;
  viewportBounds: [number, number, number, number] | null;
  parameters: Record<string, unknown>;
  crsSummary: MapReproducibilityCrsSummary;
  qaSummary: MapReproducibilityQASummary;
  expectedOutput: MapReproducibilityExpectedOutput;
  handoffReferences: MapReproducibilityHandoffReferences;
  qaIssueIds: string[];
  sourceDataVersions: Record<string, string | null>;
  engine: "MapWorkflowService" | "MapEngineAdapter";
  engineVersion: string;
}

export interface LayerProvenance {
  label: string;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  method?: string;
  collectedAt?: string;
  generatedAt?: string;
  sourceLayerIds?: string[];
  notes?: string[];
}

export type LayerQaStatus = "unchecked" | "passed" | "warning" | "error";

export type LayerSourceKind = "project" | "imported" | "external" | "derived" | "demo";

export type LayerScientificQABadge =
  | "invalid_geometry"
  | "missing_crs"
  | "sample_data"
  | "stale_result"
  | "uncertain_output";

export type LayerScientificQACategory =
  | "crs"
  | "geometry-validity"
  | "schema"
  | "scale"
  | "missingness"
  | "source-provenance"
  | "attribution-license"
  | "workflow-readiness"
  | "export-readiness";

export type LayerScientificQASeverity = "pass" | "warning" | "blocked" | "unknown";

export interface LayerScientificQACategorySummary {
  category: LayerScientificQACategory;
  severity: LayerScientificQASeverity;
  issueIds: string[];
  affectedLayerIds: string[];
  reasons: string[];
  recommendedFixes: string[];
}

export interface LayerScientificQAMetadata {
  status: LayerQaStatus;
  issueIds: string[];
  badges: LayerScientificQABadge[];
  checkedAt: string;
  featureIssueCount: number;
  usedWorker: boolean;
  caveats: string[];
  categorySummaries?: LayerScientificQACategorySummary[];
  signature: string;
}

export type MapEvidenceArtifactKind =
  | "layer"
  | "aoi"
  | "selection"
  | "workflow-result"
  | "qa-finding"
  | "publication-export"
  | "report-handoff"
  | "report-snapshot"
  | "dashboard-binding"
  | "education-reference"
  | "nl-query"
  | "cartography-review"
  | "external-service"
  | "voxcity-handoff"
  | "temporal-state"
  | "scenario-comparison"
  | "ide-code-reference";

export type MapEvidenceSourceModule =
  | "map-explorer"
  | "urban-analytics"
  | "synapse-ide"
  | "ide"
  | "reporting"
  | "dashboard"
  | "education"
  | "external-service";

export type MapEvidenceArtifactState =
  | "draft"
  | "active"
  | "published"
  | "stale"
  | "blocked"
  | "archived";

export type MapEvidenceQAState = "unchecked" | "passed" | "warning" | "error" | "blocked";

export type MapEvidenceScalar = string | number | boolean | null;

export interface MapEvidenceCrsSummary {
  declaredCrs?: string;
  displayCrs?: string;
  sourceLayerCrs: Array<{
    layerId: string;
    crs: string | null;
  }>;
  missingLayerIds: string[];
  notes: string[];
}

export interface MapEvidenceGeometrySummary {
  geometryTypes: string[];
  featureCount?: number;
  vertexCount?: number;
  bounds?: [number, number, number, number];
  source: "metadata" | "aoi-summary" | "qa-summary" | "workflow-summary" | "unknown";
  notes: string[];
}

export interface MapEvidenceExportReference {
  exportId?: string;
  filename?: string;
  format?: string;
  mimeType?: string;
  fileId?: string;
}

export interface MapEvidenceReportReference {
  reportInsertId?: string;
  reportDraftId?: string;
  snapshotAssetId?: string;
  sectionIds: string[];
}

export interface MapTemporalEvidenceTimeRange {
  startIndex: number;
  endIndex: number;
  startKey?: string;
  endKey?: string;
  startLabel?: string;
  endLabel?: string;
}

export interface MapTemporalEvidenceStep {
  index: number;
  key?: string;
  label?: string;
}

export interface MapTemporalEvidencePlayback {
  speed: PlaybackSpeed;
  isPlaying: boolean;
  frameAdvanceMs: number;
}

export interface MapTemporalEvidenceLayerReferences {
  activeLayerId: string;
  sourceId: string;
  layerId: string;
  sourceLayerIds: string[];
  derivedLayerId?: string;
}

export interface MapTemporalEvidenceFrameReference {
  frameIndex: number;
  sourceId: string;
  layerId: string;
  frameKey?: string;
  frameLabel?: string;
}

export interface MapTemporalEvidenceQA {
  state: MapEvidenceQAState;
  caveats: string[];
  uncertaintyNotes: string[];
}

export interface MapTemporalEvidenceMetadata {
  version: 1;
  temporalEvidenceId: string;
  mode: TemporalMode;
  activeLayerId: string;
  layerName?: string;
  frameCount: number;
  timeRange: MapTemporalEvidenceTimeRange;
  step: MapTemporalEvidenceStep;
  sourceFields: string[];
  timeField?: string;
  playback: MapTemporalEvidencePlayback;
  playbackParameters: Record<string, MapEvidenceScalar>;
  layerReferences: MapTemporalEvidenceLayerReferences;
  reportExportFrameReference: MapTemporalEvidenceFrameReference;
  qa: MapTemporalEvidenceQA;
  caveats: string[];
}

export interface MapScenarioComparisonCandidateReference {
  scenarioId: string;
  scenarioName: string;
  runId: string | null;
  flowId: string | null;
  assumptionCount: number;
}

export interface MapScenarioComparisonMetricReference {
  indicatorId: string;
  label: string;
  unit?: string;
  direction?: string;
}

export interface MapScenarioComparisonMetricDelta {
  scenarioId: string;
  indicatorId: string;
  baselineValue: number;
  candidateValue: number;
  absoluteDelta: number;
  percentDelta: number | null;
  improvementDelta: number;
}

export interface MapScenarioComparisonHandoffMetadata {
  reportHandoffId: string;
  dashboardBindingId: string;
  reportCompatible: boolean;
  dashboardCompatible: boolean;
  refreshMode: "static";
  liveStateLabel: string;
}

export interface MapScenarioComparisonEvidenceMetadata {
  version: 1;
  comparisonId: string;
  runId: string | null;
  createdAt: string;
  baseline: {
    label: string;
    runId: string | null;
    description: string | null;
  };
  candidates: MapScenarioComparisonCandidateReference[];
  indicatorsCompared: MapScenarioComparisonMetricReference[];
  activeScenarioId: string;
  comparisonMetric: MapScenarioComparisonMetricReference;
  deltaMode: "absolute" | "percent";
  deltas: MapScenarioComparisonMetricDelta[];
  mapOutputIds: string[];
  chartOutputIds: string[];
  dataOutputIds: string[];
  outputLayerIds: string[];
  sourceRunIds: string[];
  evidenceArtifactIds: string[];
  uncertaintyNotes: string[];
  limitations: string[];
  policyInterpretationMode: "guidance";
  guidanceSummary: string;
  handoff: MapScenarioComparisonHandoffMetadata;
}

export type MapVoxCitySourceKind = "map-layer" | "cityjson" | "sample" | "handoff" | "unknown";

export type MapVoxCityRuntimeMode = "real" | "sample";

export type MapVoxCityProjectionMode = "anchored" | "passthrough" | "unknown";

export interface MapVoxCitySourceReference {
  id: string;
  title: string;
  kind: MapVoxCitySourceKind;
  runtimeMode: MapVoxCityRuntimeMode;
  provider: string;
  sourceRef: string;
  sourceLayerId?: string;
  sourceUpdatedAt?: string | null;
  sourceUrl?: string | null;
  crs: string | null;
  featureCount: number;
  bbox: [number, number, number, number] | null;
}

export interface MapVoxCityBuildingReference {
  buildingId: string;
  selected: boolean;
  sourceFeatureId?: string;
  label?: string;
  coordinate?: [number, number];
}

export interface MapVoxCityVoxelReference {
  voxelId: string;
  buildingId?: string;
  gridId?: string;
  label?: string;
}

export interface MapVoxCityProjectionReference {
  mode: MapVoxCityProjectionMode;
  sourceCrs: string | null;
  targetCrs: "EPSG:4326";
  anchor?: {
    longitude: number;
    latitude: number;
  };
  assumptions: string[];
}

export interface MapVoxCitySyncQA {
  state: MapEvidenceQAState;
  sampleData: boolean;
  projectionStatus: "known" | "assumed" | "unknown";
  caveats: string[];
  uncertaintyNotes: string[];
}

export interface MapVoxCitySyncHandoffMetadata {
  reportHandoffId: string;
  dashboardBindingId: string;
  ideArtifactId: string;
  reportCompatible: boolean;
  dashboardCompatible: boolean;
  ideCompatible: boolean;
  refreshMode: "static-reference";
}

export interface MapVoxCitySyncMetadata {
  version: 1;
  syncId: string;
  createdAt: string;
  sourceView: "map-2d" | "voxcity-3d";
  targetView?: "map-2d" | "voxcity-3d";
  mapLayerId: string | null;
  outputLayerId?: string;
  selectedFeatureIds: string[];
  selectedBuildingIds: string[];
  buildingReferences: MapVoxCityBuildingReference[];
  voxelReferences: MapVoxCityVoxelReference[];
  source: MapVoxCitySourceReference;
  projection: MapVoxCityProjectionReference;
  viewport?: ViewportState;
  aoiId?: string;
  scenarioId?: string;
  linkedRunId?: string;
  linkedArtifactIds: string[];
  handoff: MapVoxCitySyncHandoffMetadata;
  qa: MapVoxCitySyncQA;
  caveats: string[];
}

export interface MapEvidenceProvenance {
  sourceModule: MapEvidenceSourceModule;
  sourceName?: string;
  sourceKind?: LayerSourceKind | "generated";
  sourceUrl?: string;
  license?: string;
  createdAt: string;
  updatedAt?: string;
  method?: string;
  sourceLayerIds: string[];
  derivedLayerId?: string;
  crsSummary?: MapEvidenceCrsSummary;
  geometrySummary?: MapEvidenceGeometrySummary;
  workflowId?: string;
  runId?: string;
  exportReference?: MapEvidenceExportReference;
  reportReference?: MapEvidenceReportReference;
  layerProvenance: LayerProvenance[];
  inputArtifactIds: string[];
  parentArtifactIds: string[];
  notes: string[];
}

export interface MapEvidenceQA {
  state: MapEvidenceQAState;
  issueIds: string[];
  issueCount: number;
  blockerCount: number;
  caveats: string[];
  categorySummaries?: LayerScientificQACategorySummary[];
  checkedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface MapEvidenceArtifact {
  id: string;
  artifactId: string;
  kind: MapEvidenceArtifactKind;
  title: string;
  summary?: string;
  state: MapEvidenceArtifactState;
  sourceModule: MapEvidenceSourceModule;
  sourceId?: string;
  linkedLayerIds: string[];
  sourceLayerIds: string[];
  derivedLayerId?: string;
  linkedAoiId?: string;
  linkedRunId?: string;
  linkedWorkflowId?: string;
  linkedFileIds: string[];
  linkedArtifactIds: string[];
  qaIssueIds: string[];
  reportInsertId?: string;
  reportSnapshotId?: string;
  dashboardBindingId?: string;
  ideArtifactId?: string;
  urbanEvidenceId?: string;
  exportId?: string;
  tags: string[];
  provenance: MapEvidenceProvenance;
  qa: MapEvidenceQA;
  metadata?: Record<string, MapEvidenceScalar>;
  temporal?: MapTemporalEvidenceMetadata;
  scenarioComparison?: MapScenarioComparisonEvidenceMetadata;
  voxCitySync?: MapVoxCitySyncMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MapLayerRegistryLayerSummary {
  layerId: string;
  name: string;
  layerType: OverlayLayerConfig["type"];
  group: LayerGroupId;
  visible: boolean;
  opacity: number;
  sourceKind?: LayerSourceKind;
  runtimeMode?: AnalysisOutputMode;
  qaStatus?: LayerQaStatus;
  queryable: boolean;
  crs?: string;
  crsStatus?: LayerCrsStatus;
  geometryType?: string;
  featureCount?: number;
  schemaFieldCount?: number;
  license?: string;
  attribution?: string;
  publicationReadiness?: LayerPublicationReadinessStatus;
  evidenceArtifactId?: string;
  metadataReady?: boolean;
  provenanceLabel?: string;
}

export type MapLayerRegistryOperation =
  | "add"
  | "remove"
  | "toggle"
  | "opacity"
  | "update"
  | "reorder"
  | "replace";

export interface MapLayerRegistryChangeDetail {
  operation: MapLayerRegistryOperation;
  layerId?: string;
  layers: MapLayerRegistryLayerSummary[];
  previousLayers: MapLayerRegistryLayerSummary[];
  timestamp: string;
}

export const MAP_LAYER_REGISTRY_EVENT = "synapse-map-layer-registry-change";

/** Overlay geometry type hint for UI icons */
export type OverlayGeometryType = "point" | "line" | "polygon" | "mixed" | "unknown";

/** Layer group categories for the layer manager UI */
export type LayerGroupId = "base" | "data" | "analysis" | "voxcity";

/** Runtime source payload for overlay layers */
export type OverlaySourceData =
  | string
  | GeoJSON.FeatureCollection
  | GeoJSON.Feature
  | GeoJSON.Geometry;

/** Overlay layer configuration (kept in-memory; not persisted to localStorage) */
export interface OverlayLayerConfig {
  id: string;
  name: string;
  type: "geojson" | "heatmap" | "raster-tile" | "vector-tile";
  visible: boolean;
  opacity: number;
  sourceData?: OverlaySourceData;
  style?: Record<string, unknown>;
  metadata?: LayerMetadata;
  provenance?: LayerProvenance;
  qaStatus?: LayerQaStatus;
  queryable?: boolean;
  sourceKind?: LayerSourceKind;
  group?: LayerGroupId;
}

/** Active tool types for the map toolbar */
export type MapToolId = "select" | "pin" | "draw" | "measure" | "annotate" | null;

/* ================================================================== */
/*  Bookmarks and annotations                                          */
/* ================================================================== */

export const MAP_BOOKMARK_LIMIT = 50;
export const MAP_ANNOTATION_LIMIT = 200;
export const MAP_COPILOT_PROPOSAL_LIMIT = 50;
export const MAP_COPILOT_AUDIT_TRAIL_LIMIT = 200;

export const MAP_ANNOTATION_COLOR_PALETTE = [
  "#3794ff",
  "#F9FAFB",
  "#22C55E",
  "#38BDF8",
  "#A78BFA",
  "#F43F5E",
] as const;

export interface MapBookmark {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  layers: string[];
  timestamp: string;
  activeVisualization?: string | null;
}

export interface MapAnnotationStyleSettings {
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  rotation: number;
  hasBackground: boolean;
  leaderLine: boolean;
}

export interface MapAnnotationProperties extends MapAnnotationStyleSettings {
  text: string;
  createdAt: string;
  updatedAt: string;
  leaderTarget?: [number, number] | null;
}

export interface MapAnnotation extends GeoJSON.Feature<GeoJSON.Point, MapAnnotationProperties> {
  id: string;
}

/* ================================================================== */
/*  Drawing types                                                      */
/* ================================================================== */

/** Drawing sub-tool identifiers */
export type DrawToolId = "point" | "linestring" | "polygon" | "rectangle" | "circle";

/* ================================================================== */
/*  Measurement types                                                  */
/* ================================================================== */

/** Measurement sub-tool identifiers */
export type MeasureToolId = "measure-distance" | "measure-area";

/** Supported measurement unit systems */
export type MeasureUnit = "metric" | "imperial";

export type MeasurementCalculationMethod = "geodesic-wgs84";

export interface MeasurementAssumptions {
  method: MeasurementCalculationMethod;
  crsBasis: "EPSG:4326";
  coordinateBasis: "map-display-coordinates";
  distanceModel: "haversine";
  areaModel: "spherical-polygon" | "not-applicable";
  unitBase: "metres";
  caveats: string[];
}

/** A completed measurement stored in the Zustand store */
export interface Measurement {
  id: string;
  type: MeasureToolId;
  coordinates: [number, number][];
  value: number; // metres or m²
  label: string;
  timestamp: string;
  assumptions?: MeasurementAssumptions;
}

export type DrawnGeometryValidationStatus = "valid" | "warning" | "blocked" | "unknown";

export interface DrawnGeometryValidation {
  status: DrawnGeometryValidationStatus;
  issueCodes: string[];
  caveats: string[];
  checkedAt: string;
}

/** Custom style overrides for a drawn feature */
export interface FeatureStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

/** A single user-drawn feature stored in the Zustand store */
export interface DrawnFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: {
    label: string;
    createdAt: string;
    style?: FeatureStyle;
    validation?: DrawnGeometryValidation;
  };
}

/* ================================================================== */
/*  Pending fit-bounds request (typed cross-module sync contract)      */
/* ================================================================== */

/**
 * Durable, typed request for the Map Explorer canvas to fit a target extent.
 *
 * This contract replaces ad-hoc `synapse:map:fitBounds` window events for
 * Urban Analytics study-area sync, so a request is not lost when Map
 * Explorer opens after the request was issued. Map Explorer consumes the
 * latest pending request when its canvas becomes ready.
 */
export interface PendingFitBoundsRequest {
  /** [west, south, east, north] in EPSG:4326 display coordinates. */
  bounds: [number, number, number, number];
  /** Source/origin tag for telemetry and debugging. */
  source: string;
  /** Optional Map Explorer AOI feature id this fit is associated with. */
  aoiId?: string;
  /** Stable monotonic ID so subscribers can detect a new request even
   *  when the same bounds are re-requested. */
  requestId: string;
  /** ISO timestamp when the request was queued. */
  requestedAt: string;
}

export interface PendingFitBoundsRequestInput {
  bounds: [number, number, number, number];
  source: string;
  aoiId?: string;
}

/* ================================================================== */
/*  Temporal player types                                              */
/* ================================================================== */

/** Supported playback speed multipliers */
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/** Temporal data mode */
export type TemporalMode = "snapshot" | "continuous";

/** Time range bounds for the temporal player */
export interface TemporalTimeRange {
  start: number; // normalised index (0-based)
  end: number;   // normalised index (exclusive)
}

export const BASE_STYLES: Record<BaseLayerId, BaseLayerConfig> = {
  streets: {
    name: "OpenStreetMap",
    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  },
  dark: {
    name: "Dark Matter",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  satellite: {
    name: "Satellite",
    url: {
      version: 8,
      name: "Satellite",
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri, Maxar, Earthstar Geographics",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "esri-satellite-layer",
          type: "raster",
          source: "esri-satellite",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    } as maplibregl.StyleSpecification,
  },
  terrain: {
    name: "Positron",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
};
