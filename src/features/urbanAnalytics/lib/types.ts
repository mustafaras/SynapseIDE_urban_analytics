/**
 * Urban Analytics Workbench — Core Type System
 *
 * Defines all TypeScript types, interfaces, and union types for the
 * urban analytics domain model. This file is the single source of truth
 * for the entire application's type system.
 */

import type { Geometry } from 'geojson';
import type { LearningPathId, MethodologyExplainerId } from '@/features/education/types';

// ---------------------------------------------------------------------------
// Primitives & Aliases
// ---------------------------------------------------------------------------

/** Bounding box as [west, south, east, north] in decimal degrees. */
export type BoundingBox = [number, number, number, number];

/** Coordinate Reference System identifier (EPSG code or proj4 string). */
export type CoordinateReferenceSystem = 'EPSG:4326' | 'EPSG:3857' | (string & {});

// ---------------------------------------------------------------------------
// Enumerative Union Types
// ---------------------------------------------------------------------------

/** Spatial scale of analysis — determines appropriate methods and data resolution. */
export type UrbanScale =
  | 'parcel'
  | 'block'
  | 'neighborhood'
  | 'district'
  | 'city'
  | 'metropolitan'
  | 'regional'
  | 'national';

/** Type of analysis session. */
export type SessionType =
  | 'baseline'
  | 'field_survey'
  | 'desk_study'
  | 'stakeholder'
  | 'scenario_modeling'
  | 'monitoring'
  | 'reporting';

/** Origin of a geospatial dataset. */
export type DataSource =
  | 'osm'
  | 'census'
  | 'sentinel'
  | 'landsat'
  | 'gtfs'
  | 'iot_sensor'
  | 'lidar'
  | 'cadastral'
  | 'field_survey'
  | 'model_output'
  | 'voxcity'
  | 'google_maps'
  | 'custom';

/** File / transfer format for geospatial data. */
export type GeoDataFormat =
  | 'geojson'
  | 'arrow'
  | 'geoparquet'
  | 'shapefile'
  | 'geopackage'
  | 'geotiff'
  | 'csv'
  | 'parquet'
  | 'netcdf'
  | 'las'
  | 'laz'
  | 'pbf'
  | 'mbtiles'
  | 'pmtiles'
  | 'cog'
  | 'gtfs'
  | 'osm_pbf'
  | 'cityjson'
  | 'ifc'
  | '3dtiles';

/**
 * Thematic and methodological tags for cards, datasets, and study areas.
 * Organised across ~60 domain topics and analytical methods.
 */
export type UrbanTag =
  // Mobility
  | 'mobility'
  | 'transit'
  | 'pedestrian'
  | 'cycling'
  | 'freight'
  | 'parking'
  | 'traffic'
  // Land Use
  | 'land_use'
  | 'zoning'
  | 'density'
  | 'sprawl'
  | 'mixed_use'
  // Green Infrastructure
  | 'green_infra'
  | 'uli'
  | 'canopy'
  | 'biodiversity'
  | 'parks'
  // Climate
  | 'climate'
  | 'heat_island'
  | 'flood'
  | 'air_quality'
  | 'carbon'
  | 'sea_level_rise'
  // Equity & Social
  | 'equity'
  | 'vulnerability'
  | 'gentrification'
  | 'displacement'
  | 'segregation'
  | 'accessibility'
  // Housing
  | 'housing'
  | 'affordability'
  | 'vacancy'
  | 'informal'
  // Economic
  | 'economic'
  | 'employment'
  | 'retail'
  | 'innovation'
  | 'tourism'
  // Health
  | 'health'
  | 'noise'
  | 'safety'
  | 'crime'
  // Infrastructure
  | 'water'
  | 'energy'
  | 'waste'
  | 'circular'
  | 'telecom'
  // Heritage & Placemaking
  | 'heritage'
  | 'placemaking'
  // Governance
  | 'governance'
  | 'participation'
  | 'sdg'
  | 'policy'
  // Analytical Methods
  | 'network_analysis'
  | 'spatial_autocorrelation'
  | 'spatial_stats'
  | 'remote_sensing'
  | 'agent_based'
  | 'cellular_automata'
  | 'machine_learning'
  | 'voxcity'
  | 'built_form'
  | '3d_modeling'
  | 'environmental_analysis'
  | 'solar'
  | 'point_cloud'
  | 'morphology'
  | 'indicators'
  | 'scenario'
  | 'data_engineering';

/**
 * Urban indicator kinds — ~50 metrics across morphology, accessibility,
 * environment, socioeconomics, resilience, and SDG 11.
 */
export type UrbanIndicatorKind =
  // Morphology
  | 'FAR'
  | 'GSI'
  | 'OSR'
  | 'MXI'
  | 'BCR'
  | 'FSI'
  | 'building_height_avg'
  | 'building_height_max'
  | 'block_area'
  | 'street_width_avg'
  | 'street_connectivity_alpha'
  | 'street_connectivity_beta'
  | 'street_connectivity_gamma'
  | 'intersection_density'
  // Accessibility
  | 'walk_score'
  | 'transit_score'
  | 'bike_score'
  | 'isochrone_area'
  | 'gravity_accessibility'
  | 'cumulative_opportunities'
  | 'fifteen_min_coverage'
  | 'transit_frequency'
  | 'service_area_ratio'
  // Environment
  | 'NDVI'
  | 'NDBI'
  | 'NDWI'
  | 'SAVI'
  | 'EVI'
  | 'LST'
  | 'UHI_intensity'
  | 'tree_canopy_pct'
  | 'green_space_per_capita'
  | 'impervious_pct'
  | 'pm25_avg'
  | 'noise_db_avg'
  // Socioeconomic
  | 'pop_density'
  | 'gini_coefficient'
  | 'shannon_entropy'
  | 'simpson_diversity'
  | 'jobs_housing_balance'
  | 'displacement_risk'
  | 'rent_burden'
  | 'poverty_rate'
  // Resilience
  | 'flood_exposure'
  | 'seismic_risk'
  | 'social_vulnerability_index'
  | 'adaptive_capacity'
  | 'compound_risk'
  | 'infrastructure_resilience'
  | 'climate_migration_pressure'
  // SDG 11 indicators
  | 'sdg_11_1_1'
  | 'sdg_11_2_1'
  | 'sdg_11_3_1'
  | 'sdg_11_5_1'
  | 'sdg_11_6_1'
  | 'sdg_11_6_2'
  | 'sdg_11_7_1'
  // Prompt 36 — Transport & Mobility
  | 'vehicleKmTravelled'
  | 'modeSplit'
  | 'transitServiceFrequency'
  | 'cycleLaneConnectivity'
  | 'parkingUtilisation'
  | 'averageCommuteTime'
  | 'roadSafetyIndex'
  | 'lastMileAccess'
  // Prompt 36 — Energy & Climate
  | 'buildingEnergyIntensity'
  | 'renewableEnergyShare'
  | 'carbonFootprintPerCapita'
  | 'urbanAlbedo'
  | 'coolingDegreeDays'
  | 'evapotranspiration'
  | 'embodiedCarbon'
  // Prompt 36 — Urban Form & Landscape Ecology
  | 'spacematrixPosition'
  | 'blockDensityProfile'
  | 'edgeDensity'
  | 'patchRichness'
  | 'fractalDimension'
  | 'skyViewFactor'
  | 'streetWallContinuity'
  | 'buildingHeightVariance'
  // Prompt 36 — Social Infrastructure & Liveability
  | 'socialCohesionIndex'
  | 'culturalFacilityAccess'
  | 'childFriendlyScore'
  | 'ageFriendlyScore'
  | 'foodDesertIndex'
  | 'publicSpaceQuality'
  | 'nighttimeEconomy'
  // Prompt 36 — Water & Infrastructure
  | 'waterConsumptionPerCapita'
  | 'stormwaterRunoffCoeff'
  | 'sewerCapacityRatio'
  | 'roadPavementCondition'
  | 'utilityReliability'
  | 'greenInfrastructureRatio'
  // Prompt 36 — Governance & Innovation
  | 'planningPermitEfficiency'
  | 'openDataMaturity'
  | 'smartCityReadiness'
  | 'publicParticipationRate'
  | 'intermodalIntegration'
  // Prompt 36 — Heritage & Culture
  | 'heritageDensity'
  | 'facadeIntactness'
  | 'culturalLandscapeDiversity'
  | 'intangibleHeritageVitality'
  // Prompt 36 — Pandemic Resilience
  | 'publicSpacePerCapita_adj'
  | 'essentialServiceProximity'
  | 'housingDensityRisk'
  | 'digitalAccessEquity';

/** Analytical workflow identifiers. */
export type AnalyticalFlowId =
  | 'site_suitability'
  | 'accessibility'
  | 'vulnerability'
  | 'emerging_hot_spot'
  | 'object_detection'
  | 'indicator_composite'
  | 'scenario_comparison'
  | 'equity_audit'
  | 'change_detection'
  | 'urban_growth_ca'
  | 'facility_optimisation'
  | 'system_dynamics'
  | 'walkability'
  | 'fifteen_min_city'
  | 'urban_morphology'
  | 'transit_gap'
  | 'heat_island'
  | 'green_deficit'
  | 'voxcity_3d'
  | 'cityjson_loader'
  | 'sunlight_sim'
  | 'review';

/** Section identifiers for the navigation rail and card filtering. */
export type SectionId =
  | 'all'
  | 'project_scoping'
  | 'baseline_assessment'
  | 'urban_indicators'
  | 'kpi_dashboard'
  | 'vulnerability'
  | 'rapid_assessment'
  | 'typology'
  | 'intervention_design'
  | 'policy_instruments'
  | 'implementation'
  | 'change_detection'
  | 'monitoring_eval'
  | 'reports_briefs'
  | 'neighborhood_analysis'
  | 'regional_analysis'
  | 'transport_networks'
  | 'gis_methods'
  | 'remote_sensing'
  | 'spatial_stats'
  | 'data_engineering'
  | 'built_form'
  | 'stakeholder_engagement'
  | 'handouts'
  | 'voxcity'
  | 'simulation';

// ---------------------------------------------------------------------------
// Core Domain Interfaces
// ---------------------------------------------------------------------------

/** Free-text note slots for an analysis session report. */
export interface SessionNoteSlots {
  objective: string;
  methodology: string;
  findings: string;
  recommendations: string;
  dataRefs: string;
  limitations: string;
}

/** Reference to a geospatial dataset used in analysis. */
export interface DatasetRef {
  id: string;
  name: string;
  source: DataSource;
  format: GeoDataFormat;
  layers: string[];
  temporalExtent?: [string, string];
  spatialResolution?: string;
  crs: CoordinateReferenceSystem;
  license?: string;
  url?: string;
}

/** A single computed indicator value. */
export interface IndicatorResultComponent {
  key: string;
  label: string;
  value: number;
  unit?: string;
}

/**
 * Scientific QA status for a computed indicator result.
 * - `valid`    — all required inputs were positive and finite; no warnings.
 * - `warning`  — computation succeeded but one or more caveats apply (e.g. a
 *                denominator input was zero and a safe fallback was used).
 * - `blocked`  — computation could not produce a meaningful result because all
 *                required positive inputs were invalid or absent.
 * - `degraded` — result was produced but significant input missingness or
 *                quality issues reduce interpretive confidence.
 */
export type IndicatorQAStatus = 'valid' | 'warning' | 'blocked' | 'degraded';

/**
 * QA record attached to a computed indicator result. Preserves how the
 * result was computed, whether inputs were sufficient, and any warnings that
 * should be surfaced before the result is used in reports or dashboards.
 */
export interface IndicatorResultQA {
  /** Overall QA status. */
  status: IndicatorQAStatus;
  /** Number of scalar input fields evaluated by the calculator. */
  inputCount: number;
  /**
   * Fraction of inputs that were considered invalid (0–1).
   * 0 = no invalid inputs; 1 = all inputs were invalid.
   * Computed as: (failing required-positive inputs) / (total inputs).
   */
  missingnessRate: number;
  /** Human-readable warning messages. Empty array for clean valid results. */
  warnings: string[];
  /** Identifier of the calculator function that produced this result. */
  sourceCalculator: string;
  /** ISO 8601 timestamp when the computation was performed. */
  computedAt: string;
}

/** A single computed indicator value. */
export interface IndicatorResult {
  id: string;
  kind: UrbanIndicatorKind;
  when: string;
  value: number;
  unit: string;
  displayValue?: string;
  classification?: string;
  summary?: string;
  components?: IndicatorResultComponent[];
  geometry?: Geometry;
  metadata?: Record<string, unknown>;
  /** QA record — present on results produced by QA-hardened calculators. */
  qa?: IndicatorResultQA;
}

/** Snapshot of an analysis session. */
export interface AnalysisSession {
  id: string;
  when: string;
  type: SessionType;
  noteSlots: SessionNoteSlots;
  datasets: string[];
  completedFlows: AnalyticalFlowId[];
  completedRuns: string[];
  snapshots: string[];
  sessionMsTotal: number;
}

/** Task item within a study area project. */
export interface UrbanTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 1 | 2 | 3 | 4 | 5;
  dueDate?: string;
  assignee?: string;
  relatedFlowId?: AnalyticalFlowId;
  notes?: string;
}

/** Top-level study area — the primary project entity. */
export interface StudyArea {
  id: string;
  name: string;
  description: string;
  bbox: BoundingBox;
  geometry?: Geometry;
  crs: CoordinateReferenceSystem;
  scale: UrbanScale;
  tags: UrbanTag[];
  datasets: DatasetRef[];
  sessions: AnalysisSession[];
  indicators?: IndicatorResult[];
  tasks?: UrbanTask[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Session Flags
// ---------------------------------------------------------------------------

/** Boolean flags indicating data-quality or process alerts for a session. */
export interface SessionFlags {
  dataQualityAlert: boolean;
  crsInconsistency: boolean;
  temporalMismatch: boolean;
  coverageGap: boolean;
  stakeholderFeedbackPending: boolean;
  deadlineApproaching: boolean;
  indicatorOutOfRange: boolean;
  validationRequired: boolean;
  dataSensitivity: boolean;
  ethicsApprovalNeeded: boolean;
}

// ---------------------------------------------------------------------------
// Method Validity and Capability Metadata (Prompt 06)
// ---------------------------------------------------------------------------

/** Truthful implementation status for Urban Analytics methods and workflows. */
export type UrbanMethodCapabilityStatus =
  | 'implemented'
  | 'demo_mode'
  | 'residual_gap'
  | 'environment_dependent'
  | 'deferred';

export type UrbanMethodReadinessStatus =
  | 'ready'
  | 'ready-with-caveats'
  | 'needs-context'
  | 'blocked'
  | 'demo-only';

export type UrbanMethodMaturityLevel =
  | 'reference'
  | 'established'
  | 'emerging'
  | 'experimental'
  | 'teaching'
  | 'unknown';

export type UrbanMethodFamily =
  | 'indicator'
  | 'spatial-statistics'
  | 'gis-operation'
  | 'network-analysis'
  | 'remote-sensing'
  | 'vulnerability-risk'
  | 'equity-audit'
  | 'optimization'
  | 'simulation'
  | 'scenario-analysis'
  | '3d-urban-modeling'
  | 'data-engineering'
  | 'reporting'
  | 'review'
  | 'unknown';

export type UrbanMethodRequiredDataType =
  | 'aoi'
  | 'vector-point-layer'
  | 'vector-line-layer'
  | 'vector-polygon-layer'
  | 'raster-layer'
  | 'tabular-attributes'
  | 'indicator-series'
  | 'network-graph'
  | 'remote-imagery'
  | 'cityjson'
  | 'building-footprints'
  | 'completed-run'
  | 'configuration-parameters';

export type UrbanMethodGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

export type UrbanMethodTemporalStructure =
  | 'not-required'
  | 'single-snapshot'
  | 'time-series'
  | 'before-after'
  | 'panel';

/**
 * Defensible-use envelope for a method, indicator, or workflow.
 *
 * This stores small metadata only. It describes where a method can be used,
 * what inputs it requires, and where interpretation becomes unsafe.
 */
export interface UrbanMethodValidityEnvelope {
  validSpatialScales: UrbanScale[];
  recommendedScales?: UrbanScale[];
  requiredDataTypes: UrbanMethodRequiredDataType[];
  requiredFields: string[];
  requiredGeometryTypes?: UrbanMethodGeometryType[];
  requiredCrs?: CoordinateReferenceSystem[];
  requiresProjectedCrs?: boolean;
  crsAssumptions: string[];
  requiredTemporalStructure?: UrbanMethodTemporalStructure;
  temporalAssumptions: string[];
  methodFamily: UrbanMethodFamily;
  maturityLevel: UrbanMethodMaturityLevel;
  capabilityStatus: UrbanMethodCapabilityStatus;
  minimumFeatureCount?: number;
  assumptions: string[];
  limitations: string[];
  failureModes: string[];
  interpretationWarnings: string[];
  misuseWarnings: string[];
  peerReferenceIds: string[];
  ethicalGuardrails?: string[];
}

export type UrbanLearningPathStepSource =
  | 'concept'
  | 'assumption'
  | 'limitation'
  | 'interpretation'
  | 'workflow';

export type UrbanLearningIntermediateValueSource = 'methodology' | 'workflow' | 'indicator';

export interface UrbanLearningPathIntermediateValueReference {
  label: string;
  description: string;
  source: UrbanLearningIntermediateValueSource;
}

export interface UrbanLearningPathStepReference {
  id: string;
  title: string;
  source: UrbanLearningPathStepSource;
  note: string;
}

export interface UrbanLearningPathReferenceInput {
  methodId: string;
  workflowId?: AnalyticalFlowId;
  pathId?: LearningPathId;
  explainerId?: MethodologyExplainerId;
  concepts: string[];
  prerequisites: string[];
  intermediateValues: UrbanLearningPathIntermediateValueReference[];
  evidenceArtifactIds?: string[];
  interpretationPrompts: string[];
  teachingSteps?: UrbanLearningPathStepReference[];
}

export interface UrbanLearningPathReference {
  methodId: string;
  workflowId?: AnalyticalFlowId;
  pathId?: LearningPathId;
  explainerId?: MethodologyExplainerId;
  concepts: string[];
  prerequisites: string[];
  intermediateValues: UrbanLearningPathIntermediateValueReference[];
  evidenceArtifactIds: string[];
  interpretationPrompts: string[];
  teachingSteps: UrbanLearningPathStepReference[];
}

// ---------------------------------------------------------------------------
// Card (knowledge-base entry)
// ---------------------------------------------------------------------------

/** A knowledge card displayed in the methods library. */
export interface Card {
  id: string;
  title: string;
  sectionId: SectionId;
  summary: string;
  tags: UrbanTag[];
  examples?: string[];
  evidence?: string[];
  prompts?: string[];
  datasets?: string[];
  tools?: string[];
  methodology?: string;
  limitations?: string;
  sdgAlignment?: string[];
  validityEnvelope?: UrbanMethodValidityEnvelope;
  capabilityStatus?: UrbanMethodCapabilityStatus;
  learningPath?: UrbanLearningPathReferenceInput;
}

// ---------------------------------------------------------------------------
// Analytical Run Outputs
// ---------------------------------------------------------------------------

export type SpatialStatsEngineId =
  | 'LocalMoransI'
  | 'GetisOrdGi'
  | 'EmergingHotSpots'
  | 'GlobalMoransI'
  | 'OLS'
  | 'GWR'
  | 'PCA'
  | 'ClusterAnalysis';

export type GeoAIEngineId =
  | 'LandCoverClassifier'
  | 'ObjectDetector'
  | 'QueryToSQL';

export type IndicatorEngineId =
  | 'CompositeIndicator';

export type SimulationEngineId =
  | 'CellularAutomata'
  | 'ABM'
  | 'FacilityOptimisation';

export type VoxCityEngineId =
  | 'BuildingExtrusion'
  | 'SunlightSimulation';

export type AnalysisEngineId =
  | SpatialStatsEngineId
  | GeoAIEngineId
  | IndicatorEngineId
  | SimulationEngineId
  | VoxCityEngineId;

export type AnalysisDomain = 'spatial-stats' | 'geoai' | 'indicator' | 'simulation' | 'voxcity';

export type StatisticalSummaryValue = string | number | boolean | null;

export type SpatialStatsVisualizationKind =
  | 'lisa-cluster'
  | 'hotspot'
  | 'temporal'
  | 'choropleth'
  | 'stat-summary';

export type AnalysisVisualizationKind =
  | SpatialStatsVisualizationKind
  | 'land-cover'
  | 'detection'
  | 'query-highlight'
  | 'temporal'
  | 'agent-density'
  | 'facility-allocation';

export interface SpatialStatsSummaryMetric {
  label: string;
  value: StatisticalSummaryValue;
}

export interface AnalysisLegendEntry {
  value: string | number;
  label: string;
  color?: string;
  count?: number;
}

export interface AnalysisTemporalFrame {
  key: string;
  label: string;
  data: GeoJSON.FeatureCollection;
}

export interface AnalysisVisualizationSpec {
  kind: AnalysisVisualizationKind;
  title: string;
  valueField?: string;
  labelField?: string;
  classificationMethod?: string;
  classCount?: number;
  colorRamp?: string;
  significanceThreshold?: number;
  confidenceThreshold?: number;
  showLabels?: boolean;
  summaryMetrics?: SpatialStatsSummaryMetric[];
  legendEntries?: AnalysisLegendEntry[];
  popupFields?: string[];
  minValue?: number;
  maxValue?: number;
  timeProperty?: string;
  temporalFrames?: AnalysisTemporalFrame[];
}

export interface SpatialStatsVisualizationSpec extends AnalysisVisualizationSpec {
  kind: SpatialStatsVisualizationKind;
}

export interface AnalysisMapOutputBridge {
  domain: AnalysisDomain;
  engine: AnalysisEngineId;
  runId?: string;
  runTimestamp: string;
  parameters: Record<string, unknown>;
  statisticalSummary: Record<string, StatisticalSummaryValue>;
  sourceLayerIds?: string[];
  sourceDataVersion?: string;
  geometryType?: string;
  layerType?: 'geojson' | 'heatmap' | 'raster-tile' | 'vector-tile';
  opacity?: number;
  rerunToken?: string;
  visualization: AnalysisVisualizationSpec;
}

export interface SpatialStatsMapOutputBridge extends AnalysisMapOutputBridge {
  domain: 'spatial-stats';
  engine: SpatialStatsEngineId;
  visualization: SpatialStatsVisualizationSpec;
}

/** Map visualisation output from an analytical run. */
export interface MapOutput {
  id: string;
  type: 'choropleth' | 'heatmap' | 'isochrone' | 'point_cluster' | 'flow_map' | '3d_scene';
  geojson: unknown;
  style?: Record<string, unknown>;
  title: string;
  layerName?: string;
  engineBridge?: AnalysisMapOutputBridge;
  metadata?: Record<string, unknown>;
  scenarioComparison?: UrbanScenarioComparisonOutputMetadata;
}

/** Chart output from an analytical run. */
export interface ChartOutput {
  id: string;
  type: 'bar' | 'line' | 'scatter' | 'radar' | 'histogram' | 'boxplot' | 'treemap';
  data: unknown;
  title: string;
  metadata?: Record<string, unknown>;
  scenarioComparison?: UrbanScenarioComparisonOutputMetadata;
}

/** Tabular data output from an analytical run. */
export interface DataOutput {
  id: string;
  format: string;
  rows: number;
  columns: string[];
  preview: unknown[];
  metadata?: Record<string, unknown>;
  scenarioComparison?: UrbanScenarioComparisonOutputMetadata;
}

/** A completed analytical workflow execution. */
export interface CompletedAnalysisRun {
  runId: string;
  flowId: AnalyticalFlowId;
  label: string;
  insertedAt: string;
  paragraph: string;
  paragraphPreview: string;
  paragraphFull: string;
  mapOutputs: MapOutput[];
  chartOutputs: ChartOutput[];
  dataOutputs: DataOutput[];
}

// ---------------------------------------------------------------------------
// Workflow Run Manifest (Prompt 14)
// ---------------------------------------------------------------------------

/**
 * Execution mode for a workflow run.
 *
 * - `live`      — real spatial data, real computation, outputs are analytically valid.
 * - `demo`      — pre-seeded or demonstration data; outputs must be labeled as demo.
 * - `synthetic` — synthetically generated inputs; explicitly not real-world evidence.
 * - `unknown`   — mode could not be determined (e.g. legacy run with no manifest).
 */
export type UrbanWorkflowRuntimeMode = 'live' | 'demo' | 'synthetic' | 'unknown';

/** Readiness gate status for workflow execution preflight. */
export type UrbanWorkflowReadinessStatus =
  | 'ready'
  | 'warning'
  | 'blocked'
  | 'demo_only'
  | 'unknown';

/** A normalized readiness issue emitted by preflight checks. */
export interface UrbanWorkflowReadinessIssue {
  code: string;
  severity: 'warning' | 'blocked' | 'unknown';
  message: string;
}

/**
 * Workflow readiness snapshot captured immediately before run execution.
 *
 * Scientific contract:
 * - `blocked` means execution was intentionally prevented.
 * - `demo_only` means execution can proceed only under explicit demo labeling.
 * - `unknown` means key metadata could not be verified (not equivalent to ready).
 */
export interface UrbanWorkflowReadinessResult {
  status: UrbanWorkflowReadinessStatus;
  runtimeMode: UrbanWorkflowRuntimeMode;
  reasons: string[];
  remediationActions: string[];
  issues: UrbanWorkflowReadinessIssue[];
  checkedAt: string;
}

/**
 * Reproducible run manifest for an analytical workflow execution.
 *
 * Recorded as a sidecar alongside `CompletedAnalysisRun` so that the existing
 * completed-run shape is not broken. Every manifest carries the full
 * provenance trail: what ran, with which data, under which assumptions, and
 * what evidence it produced.
 *
 * Scientific contract:
 *  - `contextId` is null for legacy runs that predate the context kernel.
 *  - `methodValidity` and `dataFitness` are null when not evaluated — never
 *    fabricate these values.
 *  - `runtimeMode === 'unknown'` for legacy runs whose mode cannot be inferred.
 *  - Absent QA (`indicatorResultIds` empty) means no indicators were computed,
 *    not that computation succeeded silently.
 *
 * Ownership: Urban Analytics (`src/features/urbanAnalytics/lib/runManifest.ts`)
 * Consumed by: Prompt 15 readiness gates, Prompt 17 map publication, Prompt 18
 *   IDE code generation, Prompt 20 report blocks, Prompt 24 scenario comparison.
 */
export interface UrbanWorkflowRunManifest {
  /** Unique run identifier — must match the paired `CompletedAnalysisRun.runId`. */
  runId: string;
  /** Flow that produced this run. */
  flowId: AnalyticalFlowId;
  /**
   * Urban Analysis Context active at execution time.
   * Null for legacy runs that predate the context kernel (Prompt 02).
   */
  contextId: string | null;
  /**
   * Raw step-level inputs collected during the workflow wizard.
   * Stored as `unknown` values — consumers must validate before use.
   */
  inputs: Record<string, unknown>;
  /**
   * Method configuration parameters (weighting, normalization, thresholds, etc.)
   * Separate from inputs so parameter sensitivity analysis can isolate them.
   */
  parameters: Record<string, unknown>;
  /**
   * Snapshot of the method validity envelope at execution time.
   * Null when no validity envelope was available for the flow.
   */
  methodValidity: UrbanMethodValidityEnvelope | null;
  /**
   * Data fitness profile evaluated at execution time.
   * Null when fitness was not evaluated — treat as unknown, not as ready.
   */
  dataFitness: UrbanDataFitnessProfile | null;
  /** Map artifact IDs published to Map Explorer from this run. */
  mapArtifactIds: string[];
  /** Code artifact IDs generated for this run via the IDE bridge. */
  codeArtifactIds: string[];
  /** Report insert IDs created from this run. */
  reportInsertIds: string[];
  /** Dashboard binding IDs created from this run. */
  dashboardBindingIds: string[];
  /**
   * Indicator result IDs computed during this run.
   * Empty array means no indicators were computed — not that computation succeeded silently.
   */
  indicatorResultIds: string[];
  /**
   * Execution mode for this run.
   * Controls how consumers should label or guard against non-real outputs.
   */
  runtimeMode: UrbanWorkflowRuntimeMode;
  /** Readiness gate snapshot captured before run execution. */
  readiness: UrbanWorkflowReadinessResult | null;
  /** ISO 8601 timestamp when the manifest was created. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Urban Analysis Context Kernel (Prompt 02)
// ---------------------------------------------------------------------------

/**
 * Scientific context for an active urban analysis session.
 *
 * This is the single shared state contract that ties together method
 * recommendations, data fitness scoring, workflow manifests, map handoffs,
 * IDE code generation, and report/dashboard bindings. All consumers reference
 * this context instead of passing panel-local state through side-channels.
 *
 * Ownership: Urban Analytics (`src/features/urbanAnalytics/useUrbanContextStore.ts`)
 * Planned consumers (future prompts):
 *   - Prompt 03: persistence / restore
 *   - Prompt 04: evidence artifact linking (contextId ref)
 *   - Prompt 05: data fitness profile (activeLayerIds, activeAoiId)
 *   - Prompt 06: method validity (activeScale, activeFlowId)
 *   - Prompt 16: Map Explorer incoming adapter (activeAoiId, activeLayerIds)
 *   - Prompt 17: map evidence publication (activeRunId → map overlay)
 *   - Prompt 18: IDE code artifact generation (activeCodeArtifactId)
 *   - Prompt 20: reporting evidence blocks (activeRunId, selectedIndicatorKinds)
 *   - Prompt 21: dashboard bindings (activeFlowId, activeRunId)
 */
export interface UrbanAnalysisContext {
  /** Unique identifier for this context instance. */
  contextId: string;
  /** ID of the associated study area project (null = no project bound). */
  studyAreaId: string | null;
  /** Human-readable label for the study area, e.g. "Istanbul, Turkey" (null = not set). */
  studyAreaName: string | null;
  /** Geographic bounding box of the study area [minLng, minLat, maxLng, maxLat] in EPSG:4326. Null = not set. */
  studyAreaBounds: [number, number, number, number] | null;
  /** Free-text analytical question driving this session. */
  activeQuestion: string;
  /** Spatial scale at which analysis is being conducted. */
  activeScale: UrbanScale | null;
  /** Active AOI layer ID — references a Map Explorer AOI bookmark or drawn feature. */
  activeAoiId: string | null;
  /** Active map layer IDs contributing spatial evidence to this context. */
  activeLayerIds: string[];
  /** Indicator kinds selected for computation in this analytical context. */
  selectedIndicatorKinds: UrbanIndicatorKind[];
  /** Active workflow flow ID (null = no flow running). */
  activeFlowId: AnalyticalFlowId | null;
  /** ID of the active or most recently completed analysis run. */
  activeRunId: string | null;
  /** Code artifact ID staged or generated for this context via IDE bridge. */
  activeCodeArtifactId: string | null;
  /** ISO 8601 timestamp of last mutation. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Map Explorer Incoming Context Adapter (Prompt 16)
// ---------------------------------------------------------------------------

export type UrbanMapQaStatus = 'passed' | 'warning' | 'blocked' | 'unknown';

export interface MapToUrbanAoiReference {
  aoiId: string | null;
  bounds: BoundingBox | null;
}

export interface MapToUrbanLayerGeometrySummary {
  layerId: string;
  geometryType: string;
}

export interface MapToUrbanLayerFieldSummary {
  layerId: string;
  fields: string[];
  temporalFields: string[];
}

export interface MapToUrbanLayerFeatureCountSummary {
  layerId: string;
  featureCount: number | null;
}

export interface MapToUrbanCrsSummary {
  distinct: string[];
  missingLayerIds: string[];
  byLayer: Array<{
    layerId: string;
    crs: string | null;
  }>;
}

export interface MapToUrbanQaSummary {
  status: UrbanMapQaStatus;
  issueCount: number;
  warningCount: number;
  blockerCount: number;
  checkedAt: string | null;
  signature: string | null;
}

export interface MapToUrbanLayerSelectionSummary {
  layerId: string;
  selectedFeatureCount: number;
}

export interface MapToUrbanFeatureCountSummary {
  total: number;
  byLayer: MapToUrbanLayerFeatureCountSummary[];
}

/**
 * Lightweight Map Explorer context package consumed by Urban Analytics.
 *
 * Contract goals:
 *  - references and scalar summaries only (no heavy GeoJSON payloads)
 *  - explicit QA and CRS visibility for scientific readiness
 *  - stable enough to register provenance in evidence artifacts
 */
export interface MapToUrbanContextSummary {
  createdAt: string;
  aoiReference: MapToUrbanAoiReference;
  layerIds: string[];
  activeAnalysisResultLayerIds: string[];
  geometryTypeSummary: MapToUrbanLayerGeometrySummary[];
  fieldSummary: MapToUrbanLayerFieldSummary[];
  temporalFields: string[];
  featureCountSummary: MapToUrbanFeatureCountSummary;
  crsSummary: MapToUrbanCrsSummary;
  qaSummary: MapToUrbanQaSummary;
  selectionSummary: MapToUrbanLayerSelectionSummary[];
  recommendationHints: string[];
}

// ---------------------------------------------------------------------------
// Urban Data Fitness and QA Profile (Prompt 05)
// ---------------------------------------------------------------------------

/** Conservative readiness state for data-method compatibility. */
export type UrbanDataFitnessStatus = 'ready' | 'warning' | 'blocked' | 'unknown';

export type UrbanDataFitnessGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'unknown';

export type UrbanDataFitnessIssueSeverity = 'info' | 'warning' | 'blocked' | 'unknown';

export type UrbanDataFitnessIssueCategory =
  | 'geometry'
  | 'crs'
  | 'temporal'
  | 'missingness'
  | 'scale'
  | 'license'
  | 'sample-size'
  | 'fields'
  | 'lineage'
  | 'uncertainty';

export type UrbanGeometryValidityFit = 'excellent' | 'usable' | 'limited' | 'invalid' | 'unknown';

export type UrbanCrsAvailabilityFit =
  | 'projected'
  | 'geographic'
  | 'available'
  | 'missing'
  | 'mismatch'
  | 'unknown';

export type UrbanTemporalCoverageFit =
  | 'current'
  | 'historical'
  | 'stale'
  | 'mixed'
  | 'not-required'
  | 'unknown';

export type UrbanMissingnessFit =
  | 'complete'
  | 'minor-gaps'
  | 'major-gaps'
  | 'not-evaluated'
  | 'unknown';

export type UrbanScaleSuitabilityFit =
  | 'native'
  | 'aggregated'
  | 'downscaled'
  | 'suitable'
  | 'mismatch'
  | 'unknown';

export type UrbanLicenseStatusFit =
  | 'clear'
  | 'restricted'
  | 'missing'
  | 'demo'
  | 'unknown';

export interface UrbanDataFitnessIssue {
  code: string;
  category: UrbanDataFitnessIssueCategory;
  severity: UrbanDataFitnessIssueSeverity;
  message: string;
  layerId?: string;
  runId?: string;
  field?: string;
  detail?: Record<string, UrbanEvidenceScalar>;
}

export interface UrbanDataFitnessDimension<TFit extends string = string> {
  status: UrbanDataFitnessStatus;
  fit: TFit;
  score: number | null;
  notes: string[];
}

export interface UrbanDataFitnessSampleSize {
  status: UrbanDataFitnessStatus;
  featureCount: number | null;
  minimumRequired: number | null;
  notes: string[];
}

export interface UrbanDataFitnessFieldAvailability {
  status: UrbanDataFitnessStatus;
  requiredFields: string[];
  presentFields: string[];
  missingFields: string[];
  notes: string[];
}

/**
 * Conservative data fitness profile for Urban Analytics workflows.
 *
 * `score` is null when required metadata is unknown; callers must not treat a
 * null score as readiness. Formal outputs should only proceed automatically
 * when `status === "ready"` or when downstream policy explicitly accepts
 * `warning` with recorded caveats.
 */
export interface UrbanDataFitnessProfile {
  status: UrbanDataFitnessStatus;
  grade: UrbanDataFitnessGrade;
  score: number | null;
  geometryFit: UrbanGeometryValidityFit;
  crsFit: UrbanCrsAvailabilityFit;
  temporalFit: UrbanTemporalCoverageFit;
  completenessFit: UrbanMissingnessFit;
  scaleFit: UrbanScaleSuitabilityFit;
  licenseStatus: UrbanLicenseStatusFit;
  geometry: UrbanDataFitnessDimension<UrbanGeometryValidityFit>;
  crs: UrbanDataFitnessDimension<UrbanCrsAvailabilityFit>;
  temporalCoverage: UrbanDataFitnessDimension<UrbanTemporalCoverageFit>;
  missingness: UrbanDataFitnessDimension<UrbanMissingnessFit>;
  scaleSuitability: UrbanDataFitnessDimension<UrbanScaleSuitabilityFit>;
  license: UrbanDataFitnessDimension<UrbanLicenseStatusFit>;
  sampleSize: UrbanDataFitnessSampleSize;
  fieldAvailability: UrbanDataFitnessFieldAvailability;
  blockedReasons: string[];
  missingInputs: string[];
  uncertaintyNotes: string[];
  issues: UrbanDataFitnessIssue[];
  sourceLayerIds: string[];
  sourceRunIds: string[];
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Urban to Map Evidence Publication (Prompt 17)
// ---------------------------------------------------------------------------

/** Eligibility check result for publishing a run's spatial output to Map Explorer. */
export interface UrbanToMapPublicationEligibility {
  eligible: boolean;
  /** Non-empty when `eligible === false`. */
  reasons: string[];
}

/** Summary of QA state for a publication event. */
export interface UrbanToMapPublicationQaSummary {
  status: UrbanMapQaStatus;
  warnings: string[];
  blockers: string[];
  caveats: string[];
}

/** Uncertainty context for the published layer. */
export interface UrbanToMapPublicationUncertaintyNotes {
  notes: string[];
  runtimeMode: UrbanWorkflowRuntimeMode;
  isDemo: boolean;
}

/** Style and legend metadata preserved with a map publication event. */
export interface UrbanToMapPublicationStyleLegendMetadata {
  layerType: 'geojson' | 'heatmap';
  opacity: number;
  styleKeys: string[];
  legendSource: 'analysis-visualization' | 'style' | 'fallback';
  legendEntries: AnalysisLegendEntry[];
  valueField: string | null;
  classificationMethod: string | null;
  colorRamp: string | null;
}

/** CRS provenance summary for a published map layer. */
export interface UrbanToMapPublicationCrsSummary {
  declaredCrs: string | null;
  displayCrs: CoordinateReferenceSystem;
  sourceLayerCrs: Array<{
    layerId: string;
    crs: string | null;
  }>;
  missingLayerIds: string[];
  notes: string[];
}

/** Report-ready figure metadata for the published layer. */
export interface UrbanToMapPublicationFigureMetadata {
  title: string;
  caption: string;
  crsSummary: string | null;
  featureCount: number | null;
  geometryType: string | null;
  sourceSummary: string;
}

/**
 * Immutable record of a single Urban Analytics spatial output published to Map Explorer.
 *
 * Created and returned by `publishUrbanRunOutputsToMap`. After creation this
 * record is stored inside the evidence artifact's `metadata` field and the
 * sidecar manifest's `mapArtifactIds` list.
 */
export interface UrbanToMapEvidencePublication {
  /** Unique publication event ID. */
  publicationId: string;
  /** Evidence artifact ID registered in Urban Analytics context. */
  artifactId: string;
  /** Run that produced the spatial output. */
  runId: string;
  /** Map layer reference on Map Explorer. */
  outputLayerReference: {
    mapLayerId: string;
    mapOutputId: string;
    layerName: string;
    sourceLayerIds: string[];
  };
  styleLegendMetadata: UrbanToMapPublicationStyleLegendMetadata;
  crsSummary: UrbanToMapPublicationCrsSummary;
  qaSummary: UrbanToMapPublicationQaSummary;
  uncertaintyNotes: UrbanToMapPublicationUncertaintyNotes;
  figureMetadata: UrbanToMapPublicationFigureMetadata;
  /** ISO 8601 timestamp of publication. */
  publishedAt: string;
}

// ---------------------------------------------------------------------------
// Urban Code Artifact Request (Prompt 18)
// ---------------------------------------------------------------------------

/**
 * Languages that the IDE bridge accepts for Urban Analytics code artifacts.
 *
 * The set is intentionally narrow: each language corresponds to a generator
 * shape supported by `urbanCodeArtifactRequestService`. Adding a new
 * language requires a paired generator + bridge wrapper.
 */
export type UrbanCodeArtifactLanguage =
  | 'python'
  | 'json'
  | 'markdown'
  | 'typescript';

/**
 * Kind of artifact the IDE will receive — informational, used by the IDE to
 * pick rendering / open behaviour.
 */
export type UrbanCodeArtifactKind =
  | 'analysis-script'
  | 'reproducibility-manifest'
  | 'method-note'
  | 'adapter-snippet';

/**
 * Origin of an Urban code artifact — drives provenance attribution and
 * routing through the IDE bridge.
 *
 *   - `method-card` — generated from a method/indicator card surface.
 *   - `workflow-run` — generated from a completed workflow run manifest.
 *   - `manual` — explicit user request without a tied method/run.
 */
export type UrbanCodeArtifactOrigin = 'method-card' | 'workflow-run' | 'manual';

/**
 * Provenance carried with every Urban code artifact request.
 *
 * Stores references and scalar attribution only — never raw payloads.
 * Authoritative copies of inputs/outputs remain in their owning store
 * (`useFlowStore` for runs, the indicator/method registry for cards).
 */
export interface UrbanCodeArtifactProvenance {
  /** Module that issued the request — always `'urban-analytics'` for now. */
  sourceModule: UrbanEvidenceSourceModule;
  /** ISO 8601 timestamp when the artifact request was generated. */
  generatedAt: string;
  /** Human-readable summary of what produced the artifact. */
  sourceSummary: string;
  /** Optional Urban Analysis Context ID active at generation time. */
  contextId?: string;
  /** Optional Urban study area ID at generation time. */
  studyAreaId?: string;
  /** Optional Urban study area human-readable name. */
  studyAreaName?: string;
  /** Optional method/indicator/method-card identifier. */
  methodId?: string;
  /** Optional human-readable method name. */
  methodName?: string;
  /** Optional flow id this artifact corresponds to. */
  flowId?: AnalyticalFlowId;
  /** Optional indicator kind for indicator-driven artifacts. */
  indicatorKind?: UrbanIndicatorKind;
  /** Optional run id for workflow-run-driven artifacts. */
  runId?: string;
  /** Optional run-manifest reference; consumers can look it up via the flow store. */
  runManifestId?: string;
  /**
   * Source evidence artifact IDs that justify this code artifact (e.g. data
   * fitness, study area, completed run). Lightweight ID references only.
   */
  sourceEvidenceIds: string[];
  /**
   * Map layer IDs referenced by the generated code (for example, layers the
   * script will read from or publish to). ID references only — no geometry.
   */
  layerIds: string[];
}

/**
 * Output expectations the generated artifact declares.
 *
 * Consumers (IDE preview, AI panel, downstream evidence-tray surfaces) use
 * this to label what the script is expected to produce without having to
 * parse the source.
 */
export interface UrbanCodeArtifactOutputContract {
  /** Suggested file paths the script will write to. Optional. */
  outputPaths?: string[];
  /** Map layer IDs the script intends to publish back. Optional. */
  publishedLayerIds?: string[];
  /** Indicator IDs the script is expected to compute. Optional. */
  indicatorIds?: string[];
  /** Free-form scientific summary of what the artifact computes. */
  summary?: string;
}

/**
 * Typed Urban → Synapse IDE code artifact request.
 *
 * Created by `urbanCodeArtifactRequestService.build*Request()` and routed
 * through the IDE bridge by `dispatch*` actions. Storage is intentionally
 * lightweight (scalar metadata + bounded text payload) so the request can
 * be embedded inside an Urban evidence artifact without bulk duplication.
 *
 * Scientific contract:
 *   - Generated content always carries a header with method / context / run
 *     attribution and an explicit limitations block — see generators.
 *   - Bridge actions never silently insert content into the active editor;
 *     they always open a NEW tab so the user retains explicit control.
 *   - Code size is capped at `MAX_URBAN_CODE_ARTIFACT_BYTES` (32 KB).
 */
export interface UrbanCodeArtifactRequest {
  /** Stable artifact request ID. Used to correlate request → evidence → IDE tab. */
  artifactId: string;
  /** Optional Urban Analysis Context ID. */
  contextId?: string;
  /** Optional run ID this artifact corresponds to. */
  runId?: string;
  /** Optional method/indicator/method-card identifier. */
  methodId?: string;
  /** Output language. Drives bridge routing and editor mode. */
  language: UrbanCodeArtifactLanguage;
  /** Artifact kind hint for IDE rendering. */
  kind: UrbanCodeArtifactKind;
  /** Origin classification for telemetry and provenance attribution. */
  origin: UrbanCodeArtifactOrigin;
  /** Suggested target filename — extension must match `language`. */
  targetFilename: string;
  /**
   * Generated content. ≤ `MAX_URBAN_CODE_ARTIFACT_BYTES` bytes. Larger
   * artifacts are rejected by the bridge and the user is offered an
   * explicit fallback (download / preview only).
   */
  content: string;
  /** Human-readable title surfaced by IDE tab tooltip and evidence tray. */
  title: string;
  /** Short summary surfaced by IDE tab tooltip and evidence tray. */
  summary: string;
  /** Provenance carried with the request. */
  provenance: UrbanCodeArtifactProvenance;
  /** Output contract declared by the generator. */
  outputContract: UrbanCodeArtifactOutputContract;
  /** Safety / limitation notes copied into the generated header. */
  safetyNotes: string[];
}

/** Ceiling on the byte size of a generated artifact's `content` field. */
export const MAX_URBAN_CODE_ARTIFACT_BYTES = 32 * 1024;

// ---------------------------------------------------------------------------
// IDE → Urban Artifact Recognition (Prompt 19)
// ---------------------------------------------------------------------------

/** Languages Urban Analytics can recognize from Synapse IDE file references. */
export type UrbanIdeArtifactLanguage =
  | UrbanCodeArtifactLanguage
  | 'sql'
  | 'ipynb'
  | 'geojson'
  | 'yaml'
  | 'plaintext'
  | 'unknown';

/** File/artifact kinds accepted by the Urban-side IDE reference recognizer. */
export type UrbanIdeArtifactKind =
  | 'urban-manifest'
  | 'geojson-layer'
  | 'notebook'
  | 'python-script'
  | 'sql-query'
  | 'project-manifest'
  | 'unsupported';

/** Result status for IDE → Urban artifact recognition. */
export type UrbanIdeArtifactRecognitionStatus =
  | 'recognized'
  | 'unsupported'
  | 'invalid';

/**
 * Scalar manifest metadata supplied by the IDE side when it has already parsed
 * a safe manifest header. Urban Analytics never reads editor buffers directly.
 */
export interface UrbanIdeArtifactManifestMetadata {
  schemaVersion?: string;
  contextId?: string;
  runId?: string;
  runIds?: string[];
  flowId?: AnalyticalFlowId;
  methodId?: string;
  methodName?: string;
  runtimeMode?: UrbanWorkflowRuntimeMode;
  studyAreaId?: string;
  studyAreaName?: string;
  layerIds?: string[];
  evidenceIds?: string[];
  codeArtifactIds?: string[];
  mapArtifactIds?: string[];
  artifactIds?: string[];
  summary?: string;
  createdAt?: string;
  generatedAt?: string;
}

/**
 * Incoming Synapse IDE reference payload.
 *
 * Contract: this is a reference envelope only. It may include IDs, scalar
 * metadata, and filename/path hints, but not editor buffer content, GeoJSON
 * payloads, raw tabular rows, or other bulk data.
 */
export interface UrbanIdeArtifactRecognitionPayload {
  filePath: string;
  language?: string;
  artifactKind?: UrbanIdeArtifactKind;
  manifestMetadata?: UrbanIdeArtifactManifestMetadata;
  relatedLayerIds?: string[];
  relatedRunIds?: string[];
  relatedArtifactIds?: string[];
  sourceModule?: UrbanEvidenceSourceModule;
  title?: string;
  summary?: string;
  contentHash?: string;
  sizeBytes?: number;
  receivedAt?: string;
}

/** Explainable recommendation produced from an IDE artifact reference. */
export interface UrbanIdeArtifactRecommendation {
  id: string;
  target: 'method' | 'workflow';
  label: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  targetId?: string;
}

/** Outcome returned by the Urban-side IDE artifact recognizer. */
export interface UrbanIdeArtifactRecognitionResult {
  ok: boolean;
  status: UrbanIdeArtifactRecognitionStatus;
  artifactKind: UrbanIdeArtifactKind;
  language: UrbanIdeArtifactLanguage;
  evidenceArtifactId: string | null;
  recommendations: UrbanIdeArtifactRecommendation[];
  contextUpdated: boolean;
  recommendationTriggered: boolean;
  warnings: string[];
  reason?: string;
}

// ---------------------------------------------------------------------------
// Urban Report Evidence Blocks (Prompt 20)
// ---------------------------------------------------------------------------

/** Lightweight map/figure reference carried into a report evidence block. */
export interface UrbanReportMapFigureReference {
  assetId: string;
  title: string;
  caption: string;
  layerIds: string[];
  mapLayerId?: string;
  sourceRunId?: string;
}

/**
 * Structured report-ready evidence block.
 *
 * This object is the Urban-side source of truth before conversion into the
 * reporting service's `PendingReportInsert`. It stores narrative-ready text
 * only when that text is backed by provenance, QA state, assumptions, and
 * limitations.
 */
export interface UrbanReportEvidenceBlock {
  reportInsertId: string;
  artifactId: string;
  runId: string | null;
  title: string;
  methodSummary: string;
  dataSummary: string;
  qaSummary: string;
  assumptions: string[];
  limitations: string[];
  mapFigureReference: UrbanReportMapFigureReference | null;
  citationNotes: string[];
  scenarioComparison?: UrbanScenarioComparisonHandoffMetadata;
  provenance: {
    sourceModule: UrbanEvidenceSourceModule;
    contextId: string | null;
    studyAreaId: string | null;
    flowId: AnalyticalFlowId | null;
    methodId: string | null;
    methodName: string | null;
    layerIds: string[];
    filePaths: string[];
    linkedArtifactIds: string[];
    generatedAt: string;
  };
}

// ---------------------------------------------------------------------------
// Urban Dashboard Bindings (Prompt 21)
// ---------------------------------------------------------------------------

export type UrbanDashboardWidgetType =
  | 'kpi'
  | 'map'
  | 'chart'
  | 'table'
  | 'text'
  | 'comparison'
  | 'live_indicator';

export type UrbanDashboardBindingKind =
  | 'metric'
  | 'series'
  | 'table'
  | 'map'
  | 'comparison'
  | 'text'
  | 'live';

/**
 * Truthful refresh semantics for Urban-origin dashboard bindings.
 *
 * `static` means the dashboard receives a snapshot/reference at binding time.
 * `manual` means the user must explicitly regenerate the binding.
 * `live` is reserved for genuinely reactive sources and should not be used for
 * workflow run outputs unless a live subscription exists.
 */
export type UrbanDashboardRefreshMode = 'static' | 'manual' | 'live';

export interface UrbanDashboardBindingProvenance {
  sourceModule: UrbanEvidenceSourceModule;
  contextId: string | null;
  studyAreaId: string | null;
  flowId: AnalyticalFlowId | null;
  runId: string | null;
  methodId: string | null;
  methodName: string | null;
  indicatorKind: UrbanIndicatorKind | null;
  layerIds: string[];
  filePaths: string[];
  linkedArtifactIds: string[];
  generatedAt: string;
}

export interface UrbanDashboardBindingQA {
  state: UrbanEvidenceQAState;
  warnings: string[];
  limitations: string[];
}

/**
 * Urban-side dashboard binding descriptor.
 *
 * This is reference metadata only. Dashboard widgets remain owned by
 * `src/features/dashboard`; Urban Analytics records which artifact/run/indicator
 * produced a binding and how it should be interpreted.
 */
export interface UrbanDashboardBinding {
  bindingId: string;
  artifactId: string;
  indicatorKind: UrbanIndicatorKind | null;
  runId: string | null;
  widgetType: UrbanDashboardWidgetType;
  bindingKind: UrbanDashboardBindingKind;
  refreshMode: UrbanDashboardRefreshMode;
  title: string;
  description: string;
  provenance: UrbanDashboardBindingProvenance;
  qa: UrbanDashboardBindingQA;
  scenarioComparison?: UrbanScenarioComparisonHandoffMetadata;
}

export type Urban3DScenarioSimulationType =
  | 'building_extrusion'
  | 'sunlight_exposure'
  | 'scenario_compare';

export interface Urban3DScenarioSpatialReference {
  crs: string | null;
  bbox: [number, number, number, number] | null;
}

export interface Urban3DScenarioOutputReferences {
  runId: string;
  mapLayerId: string | null;
  dataOutputIds: string[];
  chartOutputIds: string[];
}

/**
 * Metadata contract for 3D scenario evidence references.
 *
 * This contract is intentionally reference-only. It must never carry heavy
 * mesh payloads, raw voxel arrays, or full geometry buffers.
 */
export interface Urban3DScenarioEvidenceMetadata {
  modelReference: string;
  spatialReference: Urban3DScenarioSpatialReference;
  scenarioParameters: Record<string, UrbanEvidenceScalar>;
  simulationType: Urban3DScenarioSimulationType;
  assumptions: string[];
  uncertainty: string[];
  outputReferences: Urban3DScenarioOutputReferences;
}

/**
 * Policy interpretation contract for scenario-comparison outputs.
 *
 * Scientific contract:
 * - Interpretation mode is guidance-only.
 * - Guidance must never be phrased as a guaranteed policy outcome.
 */
export interface UrbanScenarioPolicyInterpretation {
  mode: 'guidance';
  summary: string;
  guidance: string[];
  assumptions: string[];
  uncertaintyNotes: string[];
  recommendedFollowUps: string[];
}

/** Baseline reference captured for a scenario-comparison run. */
export interface UrbanScenarioComparisonBaselineReference {
  label: string;
  runId: string | null;
  description: string | null;
}

/** Candidate scenario reference captured for a scenario-comparison run. */
export interface UrbanScenarioComparisonCandidateReference {
  scenarioId: string;
  scenarioName: string;
  runId: string | null;
  flowId: AnalyticalFlowId | null;
  assumptions: string[];
}

/** Indicator definition included in a scenario comparison. */
export interface UrbanScenarioComparisonIndicatorDefinition {
  indicatorId: string;
  label: string;
  unit: string;
  direction: 'maximize' | 'minimize' | 'neutral';
}

/** Scenario-vs-baseline delta for a single indicator. */
export interface UrbanScenarioComparisonDelta {
  deltaId: string;
  scenarioId: string;
  indicatorId: string;
  baselineValue: number;
  candidateValue: number;
  absoluteDelta: number;
  percentDelta: number | null;
  improvementDelta: number;
}

/** Evidence references carried by scenario comparison metadata. */
export interface UrbanScenarioComparisonEvidenceReferences {
  artifactIds: string[];
  mapOutputIds: string[];
  chartOutputIds: string[];
  dataOutputIds: string[];
}

/**
 * Structured scenario-comparison metadata for policy interpretation workflows.
 *
 * Stores scalar references only. Does not embed heavy geometries or raw arrays.
 */
export interface UrbanScenarioComparison {
  comparisonId: string;
  runId: string;
  flowId: 'scenario_comparison';
  createdAt: string;
  baseline: UrbanScenarioComparisonBaselineReference;
  candidateRuns: UrbanScenarioComparisonCandidateReference[];
  indicatorsCompared: UrbanScenarioComparisonIndicatorDefinition[];
  deltas: UrbanScenarioComparisonDelta[];
  uncertaintyNotes: string[];
  policyInterpretation: UrbanScenarioPolicyInterpretation;
  limitations: string[];
  evidence: UrbanScenarioComparisonEvidenceReferences;
}

export type UrbanScenarioComparisonOutputRole =
  | 'map_delta'
  | 'chart_radar'
  | 'chart_parallel'
  | 'data_tradeoff_matrix';

/** Scenario-comparison metadata attached to map/chart/data outputs. */
export interface UrbanScenarioComparisonOutputMetadata {
  outputRole: UrbanScenarioComparisonOutputRole;
  comparison: UrbanScenarioComparison;
}

/**
 * Compact handoff payload used by report and dashboard descriptors.
 *
 * Keeps interpretation metadata visible without duplicating full delta matrices.
 */
export interface UrbanScenarioComparisonHandoffMetadata {
  comparisonId: string;
  baselineLabel: string;
  candidateCount: number;
  indicatorCount: number;
  deltaCount: number;
  policyInterpretationMode: UrbanScenarioPolicyInterpretation['mode'];
  guidanceSummary: string;
  uncertaintyNotes: string[];
  limitationCount: number;
}

// ---------------------------------------------------------------------------
// Urban Evidence Artifact Model (Prompt 04)
// ---------------------------------------------------------------------------

/** Evidence object kinds recognized by Urban Analytics. */
export type UrbanEvidenceArtifactKind =
  | 'method-card'
  | 'dataset'
  | 'indicator'
  | 'map-layer'
  | 'workflow-run'
  | 'code-artifact'
  | 'report-insert'
  | 'dashboard-binding'
  | 'education-link'
  | 'qa-finding';

/** Module that produced or registered an Urban evidence artifact. */
export type UrbanEvidenceSourceModule =
  | 'urban-analytics'
  | 'map-explorer'
  | 'synapse-ide'
  | 'ide'
  | 'reporting'
  | 'dashboard'
  | 'education';

/** Lifecycle state for lightweight Urban evidence references. */
export type UrbanEvidenceArtifactState =
  | 'draft'
  | 'active'
  | 'published'
  | 'stale'
  | 'blocked'
  | 'archived'
  | 'invalid';

/** Scientific QA state attached to an evidence artifact. */
export type UrbanEvidenceQAState =
  | 'unvalidated'
  | 'valid'
  | 'warning'
  | 'stale'
  | 'invalid'
  | 'blocked';

export type UrbanEvidenceScalar = string | number | boolean | null;

/**
 * Provenance for an Urban evidence artifact.
 *
 * Stores references and scalar provenance only. Source payloads such as
 * GeoJSON, raw dataset rows, map render state, screenshots, and generated
 * files remain owned by their producing module.
 */
export interface UrbanEvidenceProvenance {
  sourceModule: UrbanEvidenceSourceModule;
  createdAt: string;
  sourceId?: string;
  sourceTitle?: string;
  sourceUri?: string;
  contextId?: string;
  runId?: string;
  flowId?: AnalyticalFlowId;
  methodId?: string;
  methodName?: string;
  layerIds: string[];
  filePaths: string[];
  inputArtifactIds: string[];
  parentArtifactIds: string[];
  notes?: string;
}

/** QA metadata for an Urban evidence artifact. */
export interface UrbanEvidenceQA {
  state: UrbanEvidenceQAState;
  confidence?: number;
  warnings: string[];
  limitations: string[];
  reviewedAt?: string;
  reviewedBy?: string;
  staleReason?: string;
  invalidReason?: string;
}

/**
 * Lightweight Urban evidence record.
 *
 * The canonical identity is `id`; `artifactId` mirrors the same value for
 * compatibility with earlier plan language. This record stores references,
 * provenance, QA state, and small scalar metadata only.
 */
export interface UrbanEvidenceArtifact {
  id: string;
  artifactId: string;
  kind: UrbanEvidenceArtifactKind;
  title: string;
  summary?: string;
  state: UrbanEvidenceArtifactState;
  sourceModule: UrbanEvidenceSourceModule;
  sourceId?: string;
  linkedContextId?: string;
  linkedStudyAreaId?: string;
  linkedRunId?: string;
  linkedLayerIds: string[];
  linkedFilePaths: string[];
  linkedArtifactIds: string[];
  cardId?: string;
  flowId?: AnalyticalFlowId;
  indicatorKind?: UrbanIndicatorKind;
  mapLayerId?: string;
  codeArtifactId?: string;
  reportInsertId?: string;
  dashboardBindingId?: string;
  educationLinkId?: string;
  tags: UrbanTag[];
  provenance: UrbanEvidenceProvenance;
  qa: UrbanEvidenceQA;
  dataFitness?: UrbanDataFitnessProfile;
  metadata?: Record<string, UrbanEvidenceScalar>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Reproducible Package Export (Prompt 25)
// ---------------------------------------------------------------------------

export type UrbanReproducibleReferenceSource =
  | 'context'
  | 'evidence-artifact'
  | 'run-manifest';

export type UrbanReproduciblePackageWarningCode =
  | 'missing_active_context'
  | 'missing_active_run_reference'
  | 'missing_active_code_artifact_reference'
  | 'missing_run_manifest'
  | 'missing_map_layer_reference'
  | 'missing_code_artifact_reference'
  | 'missing_report_binding_reference'
  | 'missing_dashboard_binding_reference'
  | 'missing_study_area_reference';

export interface UrbanReproduciblePackageWarning {
  code: UrbanReproduciblePackageWarningCode;
  severity: 'warning' | 'error';
  message: string;
  referenceId?: string;
}

export interface UrbanReproducibleDataReference {
  referenceId: string;
  source: UrbanReproducibleReferenceSource;
  artifactId?: string;
  runId?: string;
  layerId?: string;
  filePath?: string;
  key?: string;
  description: string;
}

export interface UrbanReproducibleMapLayerReference {
  referenceId: string;
  source: UrbanReproducibleReferenceSource;
  layerId?: string;
  mapArtifactId?: string;
  artifactId?: string;
  runId?: string;
  presentInMapExplorer: boolean | null;
}

export interface UrbanReproducibleCodeArtifactReference {
  referenceId: string;
  source: UrbanReproducibleReferenceSource;
  codeArtifactId: string;
  artifactId?: string;
  runId?: string;
  filePath?: string;
}

export interface UrbanReproducibleReportBindingReference {
  referenceId: string;
  source: UrbanReproducibleReferenceSource;
  reportInsertId: string;
  artifactId?: string;
  runId?: string;
}

export interface UrbanReproducibleDashboardBindingReference {
  referenceId: string;
  source: UrbanReproducibleReferenceSource;
  dashboardBindingId: string;
  artifactId?: string;
  runId?: string;
}

export interface UrbanReproducibleEnvironmentNotes {
  exportMode: 'manifest_only';
  exportedBy: 'urban-analytics';
  userAgent: string | null;
  runtimeModes: UrbanWorkflowRuntimeMode[];
  manifestCount: number;
  evidenceCount: number;
  mapLayerRegistryCount: number | null;
}

/**
 * Manifest-first reproducibility package.
 *
 * Contract:
 * - Exports references + metadata snapshots only.
 * - Does not embed heavy geometry, raster payloads, meshes, or binary blobs.
 */
export interface UrbanReproduciblePackage {
  packageId: string;
  context: UrbanAnalysisContext;
  runManifests: UrbanWorkflowRunManifest[];
  evidenceArtifacts: UrbanEvidenceArtifact[];
  dataReferences: UrbanReproducibleDataReference[];
  mapLayerReferences: UrbanReproducibleMapLayerReference[];
  codeArtifactReferences: UrbanReproducibleCodeArtifactReference[];
  reportBindings: UrbanReproducibleReportBindingReference[];
  dashboardBindings: UrbanReproducibleDashboardBindingReference[];
  environmentNotes: UrbanReproducibleEnvironmentNotes;
  limitations: string[];
  validationWarnings: UrbanReproduciblePackageWarning[];
  createdAt: string;
}
