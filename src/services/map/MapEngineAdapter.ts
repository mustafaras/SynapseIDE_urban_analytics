import type {
  AnalysisOutputMode,
  AnalysisResultMetadata,
  AnalysisResultQASummary,
  LayerProvenance,
  LayerQaStatus,
  MapEvidenceArtifact,
  MapEvidenceQAState,
  MapEvidenceScalar,
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import { createMapWorkflowResultEvidenceArtifact } from "@/centerpanel/components/map/mapEvidenceArtifacts";
import { withNormalizedLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import {
  buildHotSpotDecoratedCollection,
  buildLisaDecoratedCollection,
  HOT_SPOT_CATEGORY_FIELD,
  HOT_SPOT_CATEGORY_LABEL_FIELD,
  HOT_SPOT_COLORS,
  HOT_SPOT_GI_FIELD,
  HOT_SPOT_P_VALUE_FIELD,
  HOT_SPOT_Z_SCORE_FIELD,
  LISA_CLUSTER_COLORS,
  LISA_CLUSTER_FIELD,
} from "@/centerpanel/components/map/spatialStatsVizUtils";
import type {
  AnalysisDomain,
  AnalysisEngineId,
  AnalysisMapOutputBridge,
  AnalysisTemporalFrame,
  AnalysisVisualizationSpec,
  AnalyticalFlowId,
  ChartOutput,
  CompletedAnalysisRun,
  DataOutput,
  MapOutput,
  SpatialStatsEngineId,
  SpatialStatsMapOutputBridge,
  SpatialStatsSummaryMetric,
  SpatialStatsVisualizationSpec,
  StatisticalSummaryValue,
} from "@/features/urbanAnalytics/lib/types";
import {
  type ClassifiedTile,
  LAND_COVER_CLASSES,
  type LandCoverClass,
  type ObjectDetectionResult,
} from "@/engine/geoai/cv";
import type { GeneratedSQL } from "@/engine/geoai/nlp/types";
import type {
  AgentBasedModelResult,
  CellularAutomataResult,
  CompositeIndicatorResult,
  FacilityOptimisationResult,
} from "@/engine/simulation";
import type { HotSpotResult } from "@/engine/spatial-stats/autocorrelation/GetisOrdGi";
import type { LISAResult } from "@/engine/spatial-stats/autocorrelation/LocalMoransI";
import type { EmergingHotSpotResult } from "@/engine/spatial-stats/spatiotemporal/EmergingHotSpots";
import { diagnosticLabels } from "@/engine/spatial-stats/regression/OLS";
import { gwrParameterSurfaces } from "@/engine/spatial-stats/regression/GWR";
import type {
  ClusterResult,
  GlobalAutocorrelationResult,
  GWRResult,
  OLSResult,
  PCAResult,
  RegressionDiagnostics,
} from "@/engine/spatial-stats/types";
import {
  type ClassificationMethod,
  type ClassificationResult,
  classifyNumericValues,
  findClassificationClassIndex,
} from "@/utils/classification";
import {
  type ColorRampName,
  getColorRampColors,
} from "@/utils/colorRamps";
import { type LngLat, sphericalPolygonArea } from "@/utils/geodesic";
import {
  buildFeatureCollectionMetadata,
  parseGeoJSONText,
} from "./MapDataImporter";

const ANALYSIS_CLASS_INDEX_FIELD = "__analysisClassIndex";
const ANALYSIS_CLASS_LABEL_FIELD = "__analysisClassLabel";
const ANALYSIS_VALUE_FIELD = "__analysisValue";
const LAND_COVER_CLASS_FIELD = "__landCoverClass";
const LAND_COVER_INDEX_FIELD = "__landCoverIndex";
const LAND_COVER_CONFIDENCE_FIELD = "land_cover_confidence";
const DETECTION_CLASS_FIELD = "__detectionClass";
const DETECTION_LABEL_FIELD = "__detectionLabel";
const DETECTION_EXTENT_FIELD = "__detectionExtent";
const QUERY_MATCH_FIELD = "__queryMatch";
const TEMPORAL_STEP_FIELD = "time_step";
const TEMPORAL_LABEL_FIELD = "time_label";
const EMERGING_CATEGORY_FIELD = "emerging_hotspot_category";
const EMERGING_LABEL_FIELD = "emerging_hotspot_label";
const EMERGING_REASON_FIELD = "emerging_hotspot_reason";
const EMERGING_TREND_FIELD = "mann_kendall_trend";
const EMERGING_TREND_Z_FIELD = "mann_kendall_z";
const EMERGING_TREND_P_FIELD = "mann_kendall_p";
const EMERGING_TREND_TAU_FIELD = "mann_kendall_tau";
const EMERGING_HOT_COUNT_FIELD = "hot_step_count";
const EMERGING_COLD_COUNT_FIELD = "cold_step_count";
const ABM_WEIGHT_FIELD = "__agentWeight";
const FACILITY_SITE_ID_FIELD = "__facilitySiteId";
const FACILITY_SITE_LABEL_FIELD = "__facilitySiteLabel";
const FACILITY_SITE_COVERAGE_FIELD = "__facilityCoverageRatio";
const FACILITY_MODEL_FIELD = "__facilityModel";
const LABEL_FIELD_STYLE_KEY = "__labelField";
const LABEL_SIZE_STYLE_KEY = "__labelSize";
const LABEL_COLOR_STYLE_KEY = "__labelColor";
const LABEL_HALO_COLOR_STYLE_KEY = "__labelHaloColor";
const LABEL_HALO_WIDTH_STYLE_KEY = "__labelHaloWidth";
const COMPANION_CIRCLE_STYLE_KEY = "__companionCircle";
const COMPANION_CIRCLE_RADIUS_STYLE_KEY = "__companionCircleRadius";
const COMPANION_CIRCLE_COLOR_STYLE_KEY = "__companionCircleColor";
const COMPANION_CIRCLE_OPACITY_STYLE_KEY = "__companionCircleOpacity";
const COMPANION_CIRCLE_STROKE_COLOR_STYLE_KEY = "__companionCircleStrokeColor";
const COMPANION_CIRCLE_STROKE_WIDTH_STYLE_KEY = "__companionCircleStrokeWidth";
const NO_DATA_CLASS_INDEX = -1;
const NO_DATA_LABEL = "No data";
const NO_DATA_COLOR = "#525252";
const DEFAULT_LAYER_OPACITY = 0.92;
const DEFAULT_OUTLINE_COLOR = "#111827";
const TEMPORAL_DEFAULT_COLOR_RAMP = "YlOrRd";

export const LAND_COVER_COLORS: Record<LandCoverClass, string> = {
  built_up: "#E74C3C",
  vegetation: "#27AE60",
  water: "#3498DB",
  bare_soil: "#D4A574",
  road: "#95A5A6",
  agriculture: "#F1C40F",
};

export const DETECTION_COLOR_PALETTE = [
  "#E74C3C",
  "#3498DB",
  "#2ECC71",
  "#F59E0B",
  "#8B5CF6",
  "#14B8A6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#84CC16",
] as const;

const ANALYSIS_DOMAINS: Record<AnalysisEngineId, AnalysisDomain> = {
  LocalMoransI: "spatial-stats",
  GetisOrdGi: "spatial-stats",
  EmergingHotSpots: "spatial-stats",
  GlobalMoransI: "spatial-stats",
  OLS: "spatial-stats",
  GWR: "spatial-stats",
  PCA: "spatial-stats",
  ClusterAnalysis: "spatial-stats",
  LandCoverClassifier: "geoai",
  ObjectDetector: "geoai",
  QueryToSQL: "geoai",
  CompositeIndicator: "indicator",
  CellularAutomata: "simulation",
  ABM: "simulation",
  FacilityOptimisation: "simulation",
  BuildingExtrusion: "voxcity",
  SunlightSimulation: "voxcity",
};

const ENGINE_TITLES: Record<AnalysisEngineId, string> = {
  LocalMoransI: "Local Moran's I",
  GetisOrdGi: "Getis-Ord Gi*",
  EmergingHotSpots: "Emerging Hot Spots",
  GlobalMoransI: "Global Moran's I",
  OLS: "OLS Residuals",
  GWR: "GWR Local R²",
  PCA: "PCA Component Scores",
  ClusterAnalysis: "Cluster Typology",
  LandCoverClassifier: "Land Cover Classification",
  ObjectDetector: "Object Detection",
  QueryToSQL: "Spatial Query Results",
  CompositeIndicator: "Composite Indicator",
  CellularAutomata: "Cellular Automata",
  ABM: "Agent-Based Model",
  FacilityOptimisation: "Facility Optimisation",
  BuildingExtrusion: "Building Extrusion",
  SunlightSimulation: "Sunlight Simulation",
};

const OLS_DEFAULTS = {
  method: "standard-deviation",
  classCount: 5,
  colorRamp: "RdBu",
} satisfies {
  method: ClassificationMethod;
  classCount: number;
  colorRamp: ColorRampName;
};

const GWR_DEFAULTS = {
  method: "quantile",
  classCount: 5,
  colorRamp: "Blues",
} satisfies {
  method: ClassificationMethod;
  classCount: number;
  colorRamp: ColorRampName;
};

const PCA_DEFAULTS = {
  method: "quantile",
  classCount: 5,
  colorRamp: "PuOr",
} satisfies {
  method: ClassificationMethod;
  classCount: number;
  colorRamp: ColorRampName;
};

const RERUN_REGISTRY = new Map<string, AnalysisRerunHandler>();

type GeoJsonPayload = GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry;

export interface AnalysisAdapterResult {
  layer: OverlayLayerConfig;
  visualization: AnalysisVisualizationSpec;
  evidenceArtifact: MapEvidenceArtifact;
}

export type SpatialStatsAdapterResult = AnalysisAdapterResult;

export interface AdapterBaseInput {
  layerId?: string;
  layerName?: string;
  runId?: string;
  sourceRunId?: string;
  runTimestamp?: string;
  algorithmWorkflowId?: string;
  workflowId?: string;
  parameters?: Record<string, unknown>;
  sourceLayerIds?: string[];
  sourceDataVersion?: string;
  sourceKind?: OverlayLayerConfig["sourceKind"];
  outputMode?: AnalysisOutputMode;
  qaSummary?: Partial<AnalysisResultQASummary>;
  evidenceArtifactId?: string;
  provenance?: LayerProvenance;
  caveats?: string[];
  reproducibilityManifest?: MapReproducibilityManifest;
}

export interface FeatureCollectionAdapterInput extends AdapterBaseInput {
  featureCollection: GeoJSON.FeatureCollection;
}

export interface FeatureCollectionAnalysisAdapterInput extends FeatureCollectionAdapterInput {
  engine: AnalysisEngineId;
  visualization: AnalysisVisualizationSpec;
  style?: Record<string, unknown>;
  statisticalSummary?: Record<string, StatisticalSummaryValue>;
  opacity?: number;
  layerType?: OverlayLayerConfig["type"];
}

export interface LISAAdapterInput extends FeatureCollectionAdapterInput {
  result: LISAResult;
  significanceThreshold?: number;
}

export interface HotSpotAdapterInput extends FeatureCollectionAdapterInput {
  result: HotSpotResult;
  significanceThreshold?: number;
}

export interface EmergingHotSpotAdapterInput extends FeatureCollectionAdapterInput {
  result: EmergingHotSpotResult;
  significanceThreshold?: number;
}

export interface GlobalMoranAdapterInput extends AdapterBaseInput {
  result: GlobalAutocorrelationResult;
}

export interface OLSAdapterInput extends FeatureCollectionAdapterInput {
  result: OLSResult;
  diagnostics?: RegressionDiagnostics;
}

export interface GWRAdapterInput extends FeatureCollectionAdapterInput {
  result: GWRResult;
  parameterLabels?: string[];
}

export interface PCAAdapterInput extends FeatureCollectionAdapterInput {
  result: PCAResult;
  componentIndex?: number;
}

export interface ClusterAdapterInput extends FeatureCollectionAdapterInput {
  result: ClusterResult;
  labelPrefix?: string;
}

export interface LandCoverAdapterInput extends AdapterBaseInput {
  result: ClassifiedTile;
  bounds: [number, number, number, number];
  classLabels?: readonly LandCoverClass[];
  cellIdPrefix?: string;
}

export interface DetectionAdapterInput extends AdapterBaseInput {
  result: ObjectDetectionResult;
  confidenceThreshold?: number;
  classColors?: Record<string, string>;
}

export interface QueryResultAdapterInput extends FeatureCollectionAdapterInput {
  result: GeneratedSQL;
  queryText?: string;
  executionScope?: "live-project-data" | "imported-worker-spatial-table" | "explicit-demo-data";
  sourceTableIds?: string[];
}

export interface CAAdapterInput extends AdapterBaseInput {
  result: CellularAutomataResult;
  colorRamp?: ColorRampName;
}

export interface CompositeIndicatorAdapterInput extends AdapterBaseInput {
  result: CompositeIndicatorResult;
  colorRamp?: ColorRampName;
}

export interface ABMAdapterInput extends AdapterBaseInput {
  result: AgentBasedModelResult;
}

export interface FacilityOptimisationAdapterInput extends AdapterBaseInput {
  result: FacilityOptimisationResult;
}

export type AnalysisRerunHandler =
  | (() => Promise<AnalysisAdapterResult | null>)
  | (() => AnalysisAdapterResult | null);

export type SpatialStatsRerunHandler = AnalysisRerunHandler;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function isAnalysisEngine(value: unknown): value is AnalysisEngineId {
  return value === "LocalMoransI" ||
    value === "GetisOrdGi" ||
    value === "EmergingHotSpots" ||
    value === "GlobalMoransI" ||
    value === "OLS" ||
    value === "GWR" ||
    value === "PCA" ||
    value === "ClusterAnalysis" ||
    value === "LandCoverClassifier" ||
    value === "ObjectDetector" ||
    value === "QueryToSQL" ||
    value === "CompositeIndicator" ||
    value === "CellularAutomata" ||
    value === "ABM" ||
    value === "FacilityOptimisation" ||
    value === "BuildingExtrusion" ||
    value === "SunlightSimulation";
}

function isSpatialStatsEngine(value: unknown): value is SpatialStatsEngineId {
  return (
    value === "LocalMoransI" ||
    value === "GetisOrdGi" ||
    value === "EmergingHotSpots" ||
    value === "GlobalMoransI" ||
    value === "OLS" ||
    value === "GWR" ||
    value === "PCA" ||
    value === "ClusterAnalysis"
  );
}

function isAnalysisBridge(value: unknown): value is AnalysisMapOutputBridge {
  return (
    typeof value === "object" &&
    value !== null &&
    ((value as { domain?: unknown }).domain === "spatial-stats" ||
      (value as { domain?: unknown }).domain === "geoai" ||
      (value as { domain?: unknown }).domain === "indicator" ||
      (value as { domain?: unknown }).domain === "simulation" ||
      (value as { domain?: unknown }).domain === "voxcity") &&
    isAnalysisEngine((value as { engine?: unknown }).engine)
  );
}

function isSpatialStatsBridge(value: unknown): value is SpatialStatsMapOutputBridge {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { domain?: unknown }).domain === "spatial-stats" &&
    isSpatialStatsEngine((value as { engine?: unknown }).engine)
  );
}

function isMapReproducibilityManifest(value: unknown): value is MapReproducibilityManifest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { manifestId?: unknown }).manifestId === "string" &&
    typeof (value as { workflowId?: unknown }).workflowId === "string" &&
    typeof (value as { version?: unknown }).version === "number"
  );
}

function normalizeRunTimestamp(value?: string): string {
  return value && value.trim().length > 0 ? value : new Date().toISOString();
}

function buildLayerId(engine: AnalysisEngineId, input: AdapterBaseInput): string {
  if (input.layerId && input.layerId.trim().length > 0) {
    return input.layerId;
  }
  if (input.runId && input.runId.trim().length > 0) {
    return `${engine}-${input.runId}`;
  }
  return `${engine}-${Date.now()}`;
}

function buildLayerName(engine: AnalysisEngineId, explicit?: string): string {
  return explicit && explicit.trim().length > 0 ? explicit : ENGINE_TITLES[engine];
}

function resolveEngineDomain(engine: AnalysisEngineId): AnalysisDomain {
  return ANALYSIS_DOMAINS[engine];
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatNumber(value: number, digits = 4): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(2, digits),
  });
}

function stableNumber(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function formatParameterValue(value: unknown): string {
  if (value == null) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? formatNumber(value, 3) : String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const preview = value.slice(0, 4).map((entry) => formatParameterValue(entry)).join(", ");
    return value.length > 4 ? `[${preview}, ...]` : `[${preview}]`;
  }
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 72 ? `${serialized.slice(0, 69)}...` : serialized;
  } catch {
    return String(value);
  }
}

function buildParameterSummary(parameters: Record<string, unknown>): string {
  const entries = Object.entries(parameters);
  if (entries.length === 0) {
    return "No input parameters recorded";
  }

  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${formatParameterValue(value)}`)
    .join("; ");
}

function humanizeMetricKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function buildSummaryMetrics(summary: Record<string, StatisticalSummaryValue>): SpatialStatsSummaryMetric[] {
  return Object.entries(summary).map(([key, value]) => ({
    label: humanizeMetricKey(key),
    value,
  }));
}

function normalizeGeoJsonPayload(payload: unknown): GeoJSON.FeatureCollection {
  if (payload == null) {
    return emptyFeatureCollection();
  }
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed.length === 0 ? emptyFeatureCollection() : parseGeoJSONText(trimmed);
  }
  return parseGeoJSONText(JSON.stringify(payload));
}

function normalizeGeometryHint(geometryType?: string): "point" | "line" | "polygon" | "mixed" | "unknown" {
  const value = geometryType?.toLowerCase() ?? "";
  if (value.includes("point")) return "point";
  if (value.includes("line")) return "line";
  if (value.includes("polygon")) return "polygon";
  if (value.includes("mixed")) return "mixed";
  return "unknown";
}

function buildMatchExpression(
  field: string,
  entries: Array<[string | number, string]>,
  fallback: string,
): unknown[] {
  const expression: unknown[] = ["match", ["get", field]];
  for (const [key, color] of entries) {
    expression.push(key, color);
  }
  expression.push(fallback);
  return expression;
}

function buildColorStyle(
  geometryType: string | undefined,
  expression: unknown,
): Record<string, unknown> {
  const hint = normalizeGeometryHint(geometryType);

  if (hint === "point") {
    return {
      "circle-color": expression,
      "circle-radius": 7,
      "circle-stroke-color": DEFAULT_OUTLINE_COLOR,
      "circle-stroke-width": 1,
    };
  }

  if (hint === "line") {
    return {
      "line-color": expression,
      "line-width": 3,
    };
  }

  return {
    "fill-color": expression,
    "fill-outline-color": DEFAULT_OUTLINE_COLOR,
  };
}

function humanizeLandCoverClass(value: LandCoverClass): string {
  switch (value) {
    case "built_up":
      return "Built-up";
    case "bare_soil":
      return "Bare Soil";
    default:
      return value
        .replace(/_/g, " ")
        .replace(/^./, (char) => char.toUpperCase());
  }
}

function buildInterpolateColorExpression(
  field: string,
  minValue: number,
  maxValue: number,
  colors: string[],
): unknown[] {
  const safeMax = maxValue <= minValue ? minValue + 1 : maxValue;
  const expression: unknown[] = [
    "interpolate",
    ["linear"],
    ["to-number", ["coalesce", ["get", field], minValue]],
  ];

  colors.forEach((color, index) => {
    const ratio = colors.length === 1 ? 0 : index / (colors.length - 1);
    expression.push(minValue + (safeMax - minValue) * ratio, color);
  });

  return expression;
}

function buildLandCoverStyle(geometryType?: string): Record<string, unknown> {
  return buildCategoricalStyle(
    geometryType,
    LAND_COVER_CLASS_FIELD,
    [...LAND_COVER_CLASSES],
    LAND_COVER_CLASSES.map((className) => LAND_COVER_COLORS[className]),
  );
}

function buildDetectionClassColors(
  classes: string[],
  explicit?: Record<string, string>,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  classes.forEach((className, index) => {
    resolved[className] = explicit?.[className] ?? DETECTION_COLOR_PALETTE[index % DETECTION_COLOR_PALETTE.length]!;
  });
  return resolved;
}

function buildDetectionStyle(
  geometryType: string | undefined,
  colors: Record<string, string>,
): Record<string, unknown> {
  const expression = buildMatchExpression(
    DETECTION_CLASS_FIELD,
    Object.entries(colors),
    DETECTION_COLOR_PALETTE[0],
  );
  const hint = normalizeGeometryHint(geometryType);

  if (hint === "point") {
    return {
      "circle-color": expression,
      "circle-radius": 6,
      "circle-stroke-color": DEFAULT_OUTLINE_COLOR,
      "circle-stroke-width": 1,
      [LABEL_FIELD_STYLE_KEY]: DETECTION_LABEL_FIELD,
      [LABEL_SIZE_STYLE_KEY]: 11,
      [LABEL_COLOR_STYLE_KEY]: "#F9FAFB",
      [LABEL_HALO_COLOR_STYLE_KEY]: "rgba(17,24,39,0.9)",
      [LABEL_HALO_WIDTH_STYLE_KEY]: 1.25,
    };
  }

  if (hint === "line") {
    return {
      "line-color": expression,
      "line-width": 2,
      [LABEL_FIELD_STYLE_KEY]: DETECTION_LABEL_FIELD,
      [LABEL_SIZE_STYLE_KEY]: 11,
      [LABEL_COLOR_STYLE_KEY]: "#F9FAFB",
      [LABEL_HALO_COLOR_STYLE_KEY]: "rgba(17,24,39,0.9)",
      [LABEL_HALO_WIDTH_STYLE_KEY]: 1.25,
    };
  }

  return {
    "fill-color": expression,
    "fill-outline-color": expression,
    [LABEL_FIELD_STYLE_KEY]: DETECTION_LABEL_FIELD,
    [LABEL_SIZE_STYLE_KEY]: 11,
    [LABEL_COLOR_STYLE_KEY]: "#F9FAFB",
    [LABEL_HALO_COLOR_STYLE_KEY]: "rgba(17,24,39,0.9)",
    [LABEL_HALO_WIDTH_STYLE_KEY]: 1.25,
  };
}

function buildQueryHighlightStyle(geometryType?: string): Record<string, unknown> {
  const highlight = "#F59E0B";
  const hint = normalizeGeometryHint(geometryType);

  if (hint === "point") {
    return {
      "circle-color": highlight,
      "circle-radius": 7,
      "circle-stroke-color": "#111827",
      "circle-stroke-width": 1,
    };
  }

  if (hint === "line") {
    return {
      "line-color": highlight,
      "line-width": 3,
    };
  }

  return {
    "fill-color": highlight,
    "fill-outline-color": highlight,
  };
}

function buildTemporalStyle(
  geometryType: string | undefined,
  valueField?: string,
  minValue?: number,
  maxValue?: number,
  colorRamp: ColorRampName = TEMPORAL_DEFAULT_COLOR_RAMP,
): Record<string, unknown> {
  if (!valueField || minValue == null || maxValue == null) {
    return buildColorStyle(geometryType, getColorRampColors(colorRamp, 5)[4] ?? "#F59E0B");
  }

  return buildColorStyle(
    geometryType,
    buildInterpolateColorExpression(valueField, minValue, maxValue, getColorRampColors(colorRamp, 5)),
  );
}

function buildAbmHeatmapStyle(weightField: string): Record<string, unknown> {
  return {
    "heatmap-weight": ["coalesce", ["to-number", ["get", weightField]], 1],
    "heatmap-intensity": 0.95,
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 12, 12, 28],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(37,99,235,0)",
      0.2,
      "#2563EB",
      0.45,
      "#10B981",
      0.7,
      "#F59E0B",
      1,
      "#DC2626",
    ],
    [COMPANION_CIRCLE_STYLE_KEY]: true,
    [COMPANION_CIRCLE_RADIUS_STYLE_KEY]: 4,
    [COMPANION_CIRCLE_COLOR_STYLE_KEY]: "rgba(255,255,255,0.75)",
    [COMPANION_CIRCLE_OPACITY_STYLE_KEY]: 0.55,
    [COMPANION_CIRCLE_STROKE_COLOR_STYLE_KEY]: "rgba(17,24,39,0.7)",
    [COMPANION_CIRCLE_STROKE_WIDTH_STYLE_KEY]: 0.8,
  };
}

function buildFacilityCatchmentStyle(geometryType?: string): Record<string, unknown> {
  return buildColorStyle(
    geometryType,
    buildInterpolateColorExpression(
      FACILITY_SITE_COVERAGE_FIELD,
      0,
      1,
      ["#1F2937", "#0EA5E9", "#10B981", "#F59E0B"],
    ),
  );
}

function buildFacilitySiteStyle(geometryType?: string): Record<string, unknown> {
  const hint = normalizeGeometryHint(geometryType);
  const expression = buildInterpolateColorExpression(
    FACILITY_SITE_COVERAGE_FIELD,
    0,
    1,
    ["#64748B", "#0EA5E9", "#F59E0B"],
  );

  if (hint === "point") {
    return {
      "circle-color": expression,
      "circle-radius": 7,
      "circle-stroke-color": DEFAULT_OUTLINE_COLOR,
      "circle-stroke-width": 1.2,
      [LABEL_FIELD_STYLE_KEY]: FACILITY_SITE_LABEL_FIELD,
      [LABEL_SIZE_STYLE_KEY]: 11,
      [LABEL_COLOR_STYLE_KEY]: "#F9FAFB",
      [LABEL_HALO_COLOR_STYLE_KEY]: "rgba(17,24,39,0.9)",
      [LABEL_HALO_WIDTH_STYLE_KEY]: 1.25,
    };
  }

  return buildColorStyle(geometryType, expression);
}

function buildLegendEntriesFromCounts(
  counts: Record<string, number>,
  colors: Record<string, string>,
  labels?: Record<string, string>,
): AnalysisVisualizationSpec["legendEntries"] {
  return Object.entries(counts).map(([value, count]) => ({
    value,
    label: labels?.[value] ?? humanizeMetricKey(value),
    color: colors[value],
    count,
  }));
}

function getStringParameter(input: AdapterBaseInput, key: string): string | null {
  const value = input.parameters?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueTextList(values: Array<string | null | undefined>, limit = 12): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeTextArray(value: unknown, limit = 12): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueTextList(
    value.map((entry) => (typeof entry === "string" ? entry : null)),
    limit,
  );
}

function safeEvidencePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "output";
}

function isAnalysisOutputMode(value: unknown): value is AnalysisOutputMode {
  return value === "live" || value === "demo" || value === "synthetic" || value === "unknown";
}

function normalizeAnalysisOutputModeToken(value: string | null): AnalysisOutputMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (
    normalized === "demo" ||
    normalized === "demo-data" ||
    normalized === "demo-mode" ||
    normalized === "demo-source" ||
    normalized === "explicit-demo-data"
  ) {
    return "demo";
  }
  if (normalized === "synthetic" || normalized === "synthetic-data" || normalized === "simulation-synthetic") {
    return "synthetic";
  }
  if (normalized === "live" || normalized === "real" || normalized === "live-project-data" || normalized === "real-source") {
    return "live";
  }
  if (normalized === "unknown" || normalized === "legacy") {
    return "unknown";
  }
  return null;
}

function resolveAnalysisOutputMode(input: AdapterBaseInput): AnalysisOutputMode {
  if (input.outputMode) return input.outputMode;
  if (input.sourceKind === "demo") return "demo";

  const candidate =
    normalizeAnalysisOutputModeToken(getStringParameter(input, "outputMode")) ??
    normalizeAnalysisOutputModeToken(getStringParameter(input, "runtimeMode")) ??
    normalizeAnalysisOutputModeToken(getStringParameter(input, "sourceRuntimeMode")) ??
    normalizeAnalysisOutputModeToken(getStringParameter(input, "executionMode")) ??
    normalizeAnalysisOutputModeToken(getStringParameter(input, "datasetMode")) ??
    normalizeAnalysisOutputModeToken(getStringParameter(input, "executionScope")) ??
    normalizeAnalysisOutputModeToken(getStringParameter(input, "sourceKind"));

  return candidate ?? "unknown";
}

function resolveAlgorithmWorkflowId(engine: AnalysisEngineId, input: AdapterBaseInput): string {
  return input.algorithmWorkflowId?.trim()
    || input.workflowId?.trim()
    || input.reproducibilityManifest?.workflowId
    || getStringParameter(input, "workflowId")
    || getStringParameter(input, "algorithmId")
    || getStringParameter(input, "modelId")
    || engine;
}

function resolveSourceRunId(input: AdapterBaseInput, layerId: string): string {
  return input.sourceRunId?.trim()
    || input.runId?.trim()
    || getStringParameter(input, "sourceRunId")
    || getStringParameter(input, "runId")
    || layerId;
}

function buildEvidenceArtifactId(engine: AnalysisEngineId, input: AdapterBaseInput, layerId: string): string {
  return input.evidenceArtifactId?.trim()
    || `map-evidence-engine-${safeEvidencePart(engine)}-${safeEvidencePart(input.runId ?? layerId)}`;
}

function modeCaveat(outputMode: AnalysisOutputMode): string | null {
  if (outputMode === "demo") {
    return "Demo output: this layer is for demonstration and must not be represented as observed analytical evidence.";
  }
  if (outputMode === "synthetic") {
    return "Synthetic output: inputs or scenarios were generated and must remain labelled before interpretation.";
  }
  if (outputMode === "unknown") {
    return "Execution mode is not declared; treat analytical readiness as unknown until source provenance is reviewed.";
  }
  return null;
}

function buildEngineCaveats(
  engine: AnalysisEngineId,
  input: AdapterBaseInput,
  visualization: AnalysisVisualizationSpec,
): string[] {
  const caveats: Array<string | null> = [];
  if (isSpatialStatsEngine(engine)) {
    caveats.push("Spatial-statistics interpretation depends on the declared spatial weights, CRS, and feature preparation choices.");
    if (engine === "LocalMoransI" || engine === "GetisOrdGi" || engine === "EmergingHotSpots") {
      caveats.push("Local significance classes should be reviewed with multiple-testing and neighbourhood-definition caveats.");
    }
    if (engine === "OLS" || engine === "GWR") {
      caveats.push("Regression surfaces require residual diagnostics and model specification review before policy interpretation.");
    }
  }
  if (engine === "LandCoverClassifier") {
    caveats.push("Land-cover classes are model predictions; inspect confidence and class definitions before reporting.");
  }
  if (engine === "ObjectDetector") {
    caveats.push("Object detections can contain false positives and false negatives; confidence thresholds are analytical caveats.");
  }
  if (engine === "QueryToSQL") {
    caveats.push("NL query outputs reflect the reviewed generated SQL and visible queryable layer scope, not a full data audit.");
  }
  if (engine === "CompositeIndicator") {
    caveats.push("Composite indicator outputs depend on selected indicators, normalization, weighting, and sensitivity assumptions.");
  }
  if (engine === "CellularAutomata" || engine === "ABM" || engine === "FacilityOptimisation") {
    caveats.push("Simulation output is scenario/model dependent and should be interpreted with parameter and validation limits.");
  }
  if (visualization.kind === "temporal") {
    caveats.push("Temporal playback preserves frame references; compare frames only when source schema and units are compatible.");
  }
  return uniqueTextList(caveats, 8);
}

function buildAnalysisCaveats(params: {
  engine: AnalysisEngineId;
  input: AdapterBaseInput;
  outputMode: AnalysisOutputMode;
  visualization: AnalysisVisualizationSpec;
}): string[] {
  const manifestCaveats = params.input.reproducibilityManifest?.qaSummary.caveats ?? [];
  return uniqueTextList([
    modeCaveat(params.outputMode),
    ...normalizeTextArray(params.input.caveats, 8),
    ...manifestCaveats,
    ...buildEngineCaveats(params.engine, params.input, params.visualization),
  ], 12);
}

function normalizeQaStatus(value: unknown, fallback: AnalysisResultQASummary["status"]): AnalysisResultQASummary["status"] {
  if (value === "unchecked" || value === "passed" || value === "warning" || value === "error" || value === "blocked") {
    return value;
  }
  return fallback;
}

function normalizePartialQASummary(value: unknown): Partial<AnalysisResultQASummary> | undefined {
  if (!isRecord(value)) return undefined;
  const summary: Partial<AnalysisResultQASummary> = {};
  const status = normalizeQaStatus(value.status, "unchecked");
  summary.status = status;
  summary.issueIds = normalizeTextArray(value.issueIds, 64);
  summary.caveats = normalizeTextArray(value.caveats, 12);
  summary.uncertaintyNotes = normalizeTextArray(value.uncertaintyNotes, 12);
  if (typeof value.blockerCount === "number" && Number.isFinite(value.blockerCount)) {
    summary.blockerCount = Math.max(0, Math.floor(value.blockerCount));
  }
  if (typeof value.warningCount === "number" && Number.isFinite(value.warningCount)) {
    summary.warningCount = Math.max(0, Math.floor(value.warningCount));
  }
  if (typeof value.infoCount === "number" && Number.isFinite(value.infoCount)) {
    summary.infoCount = Math.max(0, Math.floor(value.infoCount));
  }
  if (typeof value.checkedAt === "string" && value.checkedAt.trim().length > 0) {
    summary.checkedAt = value.checkedAt;
  }
  return summary;
}

function buildAnalysisQASummary(params: {
  input: AdapterBaseInput;
  outputMode: AnalysisOutputMode;
  caveats: string[];
}): AnalysisResultQASummary {
  const manifestQA = params.input.reproducibilityManifest?.qaSummary;
  const inputQA = params.input.qaSummary;
  const fallbackStatus: AnalysisResultQASummary["status"] = params.outputMode === "demo" || params.outputMode === "synthetic" || params.caveats.length > 0
    ? "warning"
    : "unchecked";
  const manifestStatus = manifestQA?.status === "blocked" ? "blocked" : manifestQA?.status;
  const status = normalizeQaStatus(inputQA?.status ?? manifestStatus, fallbackStatus);
  const issueIds = uniqueTextList([
    ...(inputQA?.issueIds ?? []),
    ...(manifestQA?.issueIds ?? []),
  ], 64);
  const caveats = uniqueTextList([
    ...(inputQA?.caveats ?? []),
    ...(manifestQA?.caveats ?? []),
    ...params.caveats,
  ], 12);
  const uncertaintyNotes = uniqueTextList([
    ...(inputQA?.uncertaintyNotes ?? []),
    ...caveats,
  ], 12);
  const blockerCount = inputQA?.blockerCount ?? manifestQA?.blockerCount ?? (status === "blocked" || status === "error" ? issueIds.length : 0);
  const warningCount = inputQA?.warningCount ?? manifestQA?.warningCount ?? (status === "warning" ? Math.max(1, caveats.length) : 0);
  const infoCount = inputQA?.infoCount ?? manifestQA?.infoCount ?? 0;
  const checkedAt = inputQA?.checkedAt ?? params.input.reproducibilityManifest?.createdAt;
  const summary: AnalysisResultQASummary = {
    status,
    issueIds,
    blockerCount,
    warningCount,
    infoCount,
    caveats,
    uncertaintyNotes,
  };
  if (checkedAt) summary.checkedAt = checkedAt;
  return summary;
}

function qaStatusToLayerQaStatus(status: AnalysisResultQASummary["status"]): LayerQaStatus {
  if (status === "blocked" || status === "error") return "error";
  if (status === "warning") return "warning";
  if (status === "passed") return "passed";
  return "unchecked";
}

function qaStatusToEvidenceState(status: AnalysisResultQASummary["status"]): MapEvidenceQAState {
  if (status === "blocked") return "blocked";
  if (status === "error") return "error";
  if (status === "warning") return "warning";
  if (status === "passed") return "passed";
  return "unchecked";
}

function buildHandoffHints(engine: AnalysisEngineId, layerId: string): NonNullable<AnalysisResultMetadata["handoffHints"]> {
  const label = ENGINE_TITLES[engine];
  return {
    reportCompatible: true,
    dashboardCompatible: true,
    ideCompatible: true,
    reportInsertionHint: `Reference ${layerId} as a ${label} map evidence layer; do not copy sourceData into reports.`,
    dashboardBindingHint: `Bind dashboards to scalar summaries or layer id ${layerId}, preserving evidenceArtifactId.`,
    ideArtifactHint: `Generate code or manifests from adapter metadata for ${layerId}; keep geometry referenced by layer id.`,
  };
}

function metadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function metadataOutputMode(metadata: Record<string, unknown> | undefined): AnalysisOutputMode | undefined {
  const value = metadata?.outputMode;
  return isAnalysisOutputMode(value) ? value : undefined;
}

function metadataQASummary(metadata: Record<string, unknown> | undefined): Partial<AnalysisResultQASummary> | undefined {
  return normalizePartialQASummary(metadata?.qaSummary);
}

function metadataCaveats(metadata: Record<string, unknown> | undefined): string[] {
  return normalizeTextArray(metadata?.caveats, 12);
}

function evidenceScalar(value: unknown): MapEvidenceScalar | null {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function buildAnalysisEvidenceMetadata(
  analysisResult: AnalysisResultMetadata,
  featureMetadata: ReturnType<typeof buildFeatureCollectionMetadata>,
): Record<string, MapEvidenceScalar> {
  const metadata: Record<string, MapEvidenceScalar> = {
    engine: analysisResult.engine,
    domain: resolveEngineDomain(analysisResult.engine),
    algorithmWorkflowId: analysisResult.algorithmWorkflowId ?? analysisResult.engine,
    outputMode: analysisResult.outputMode ?? "unknown",
    sourceLayerCount: analysisResult.sourceLayerIds?.length ?? 0,
    caveatCount: analysisResult.caveats?.length ?? 0,
    qaStatus: analysisResult.qaSummary?.status ?? "unchecked",
    qaWarningCount: analysisResult.qaSummary?.warningCount ?? 0,
    qaBlockerCount: analysisResult.qaSummary?.blockerCount ?? 0,
  };
  if (analysisResult.sourceRunId) metadata.sourceRunId = analysisResult.sourceRunId;
  if (analysisResult.runId) metadata.runId = analysisResult.runId;
  if (analysisResult.reproducibilityManifest?.manifestId) {
    metadata.manifestId = analysisResult.reproducibilityManifest.manifestId;
  }
  const featureCount = evidenceScalar(featureMetadata.featureCount);
  if (featureCount !== null) metadata.featureCount = featureCount;
  const geometryType = evidenceScalar(featureMetadata.geometryType);
  if (geometryType !== null) metadata.geometryType = geometryType;
  return metadata;
}

function buildAnalysisMapOutputMetadata(layer: OverlayLayerConfig): Record<string, unknown> | undefined {
  const analysis = layer.metadata?.analysisResult;
  if (!analysis) return undefined;
  const metadata: Record<string, unknown> = {
    evidenceArtifactId: analysis.evidenceArtifactId,
    sourceRunId: analysis.sourceRunId,
    algorithmWorkflowId: analysis.algorithmWorkflowId,
    outputMode: analysis.outputMode,
    qaSummary: analysis.qaSummary,
    caveats: analysis.caveats,
    handoffHints: analysis.handoffHints,
    sourceLayerIds: analysis.sourceLayerIds,
    sourceKind: layer.sourceKind,
  };
  if (analysis.reproducibilityManifest) {
    metadata.reproducibilityManifest = cloneJson(analysis.reproducibilityManifest);
  }
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

function buildAnalysisEvidenceArtifact(params: {
  engine: AnalysisEngineId;
  input: AdapterBaseInput;
  layerId: string;
  layerName: string;
  featureMetadata: ReturnType<typeof buildFeatureCollectionMetadata>;
  analysisResult: AnalysisResultMetadata;
}): MapEvidenceArtifact {
  const sourceLayerIds = params.analysisResult.sourceLayerIds ?? [];
  const qaSummary = params.analysisResult.qaSummary;
  const manifest = params.analysisResult.reproducibilityManifest;
  const evidenceInput = {
    ...(params.analysisResult.evidenceArtifactId ? { id: params.analysisResult.evidenceArtifactId } : {}),
    title: `${params.layerName} evidence`,
    summary: `${ENGINE_TITLES[params.engine]} adapter output for map layer ${params.layerId}.`,
    workflowId: params.analysisResult.algorithmWorkflowId ?? params.engine,
    ...(params.analysisResult.sourceRunId || params.analysisResult.runId
      ? { runId: params.analysisResult.sourceRunId ?? params.analysisResult.runId }
      : {}),
    sourceLayerIds,
    derivedLayerId: params.layerId,
    linkedLayerIds: [params.layerId],
    crsSummary: manifest
      ? {
          displayCrs: manifest.crsSummary.displayCrs,
          sourceLayerCrs: manifest.crsSummary.sourceLayerCrs,
          missingLayerIds: manifest.crsSummary.missingLayerIds,
          notes: manifest.crsSummary.notes,
        }
      : {
          displayCrs: "EPSG:4326",
          sourceLayerCrs: sourceLayerIds.map((layerId) => ({ layerId, crs: null })),
          missingLayerIds: sourceLayerIds,
          notes: ["Adapter output stores source layer IDs only; inspect source layers for analytical CRS declarations."],
        },
    geometrySummary: {
      geometryTypes: params.featureMetadata.geometryType ? [params.featureMetadata.geometryType] : [],
      ...(typeof params.featureMetadata.featureCount === "number" ? { featureCount: params.featureMetadata.featureCount } : {}),
      ...(params.featureMetadata.bounds ? { bounds: params.featureMetadata.bounds } : {}),
      source: "workflow-summary" as const,
      notes: ["Map evidence stores adapter metadata and layer references only; raw GeoJSON remains on the map layer."],
    },
    ...(qaSummary
      ? {
          qa: {
            state: qaStatusToEvidenceState(qaSummary.status),
            issueIds: qaSummary.issueIds,
            issueCount: qaSummary.issueIds.length,
            blockerCount: qaSummary.blockerCount,
            caveats: qaSummary.caveats,
            ...(qaSummary.checkedAt ? { checkedAt: qaSummary.checkedAt } : {}),
          },
        }
      : {}),
    metadata: buildAnalysisEvidenceMetadata(params.analysisResult, params.featureMetadata),
    createdAt: params.analysisResult.runTimestamp,
  };

  return createMapWorkflowResultEvidenceArtifact(evidenceInput);
}

function resolveAnalysisSourceKind(input: AdapterBaseInput): NonNullable<OverlayLayerConfig["sourceKind"]> {
  if (input.sourceKind) return input.sourceKind;

  if (resolveAnalysisOutputMode(input) === "demo") {
    return "demo";
  }

  return "derived";
}

function buildAnalysisProvenance(
  engine: AnalysisEngineId,
  input: AdapterBaseInput,
  fallback: string,
): LayerProvenance {
  if (input.provenance) {
    return cloneJson(input.provenance);
  }

  const sourceTitle =
    getStringParameter(input, "sourceTitle") ??
    getStringParameter(input, "imageId") ??
    getStringParameter(input, "scenarioName") ??
    getStringParameter(input, "datasetMode") ??
    fallback;
  const sourceUrl = getStringParameter(input, "sourceUrl") ?? undefined;

  return {
    label: `${ENGINE_TITLES[engine]} · ${sourceTitle}`,
    ...(sourceUrl ? { sourceUrl } : {}),
    method: "Engine-to-map adapter metadata; no model recomputation required for layer inspection.",
    generatedAt: normalizeRunTimestamp(input.runTimestamp),
    ...(input.sourceLayerIds ? { sourceLayerIds: [...input.sourceLayerIds] } : {}),
    ...(input.caveats ? { notes: [...input.caveats] } : {}),
  };
}

function computeGeometryAreaSquareMetres(geometry: GeoJSON.Geometry | null): number {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates as LngLat[][];
    const outer = sphericalPolygonArea(rings[0] ?? []);
    const holes = rings.slice(1).reduce((sum, ring) => sum + sphericalPolygonArea(ring), 0);
    return Math.max(0, outer - holes);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.reduce((sum, polygon) => {
      const rings = polygon as LngLat[][];
      const outer = sphericalPolygonArea(rings[0] ?? []);
      const holes = rings.slice(1).reduce((holeSum, ring) => holeSum + sphericalPolygonArea(ring), 0);
      return sum + Math.max(0, outer - holes);
    }, 0);
  }
  return 0;
}

function sanitizeBoundingBox(
  bbox: [number, number, number, number],
): [number, number, number, number] | null {
  const [west, south, east, north] = bbox;
  if (
    !Number.isFinite(west) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(north) ||
    east <= west ||
    north <= south
  ) {
    return null;
  }
  return [west, south, east, north];
}

function buildBoundingBoxPolygon(
  bbox: [number, number, number, number],
): GeoJSON.Polygon {
  const [west, south, east, north] = bbox;
  return {
    type: "Polygon",
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]],
  };
}

function buildDetectionLabel(className: string, confidence: number): string {
  return `${className} ${(confidence * 100).toFixed(1)}%`;
}

function computeNumericDomainFromCollections(
  collections: GeoJSON.FeatureCollection[],
  field?: string,
): [number, number] | null {
  if (!field) {
    return null;
  }

  let minValue = Infinity;
  let maxValue = -Infinity;

  collections.forEach((collection) => {
    collection.features.forEach((feature) => {
      const value = toFiniteNumber(feature.properties?.[field]);
      if (value == null) {
        return;
      }
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    });
  });

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return null;
  }

  return [minValue, maxValue <= minValue ? minValue + 1 : maxValue];
}

function buildTemporalFrameLabel(step: number | string, explicit?: string): string {
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }

  return typeof step === "number" && Number.isInteger(step)
    ? `Step ${step}`
    : String(step);
}

function buildEmergingTemporalFrames(
  featureCollection: GeoJSON.FeatureCollection,
  result: EmergingHotSpotResult,
  significanceThreshold: number,
): AnalysisTemporalFrame[] {
  if (featureCollection.features.length !== result.locations.length) {
    throw new RangeError(
      `EmergingHotSpots expects ${featureCollection.features.length} features but received ${result.locations.length} classified locations.`,
    );
  }

  return result.timeSteps.map((timeStep) => {
    if (timeStep.hotSpotResult.featureProperties.length !== featureCollection.features.length) {
      throw new RangeError(
        `EmergingHotSpots time step "${timeStep.key}" has ${timeStep.hotSpotResult.featureProperties.length} observations but ${featureCollection.features.length} features were supplied.`,
      );
    }

    const rawCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: featureCollection.features.map((feature, index) => {
        const observation = timeStep.hotSpotResult.featureProperties[index]!;
        const location = result.locations[index]!;

        return {
          ...cloneJson(feature),
          properties: {
            ...(cloneJson(feature.properties ?? {}) as GeoJSON.GeoJsonProperties),
            index: observation.index,
            value: observation.value,
            gi_star: observation.giStar,
            z_score: observation.zScore,
            p_value: observation.pValue,
            confidence_level: observation.confidence,
            [TEMPORAL_STEP_FIELD]: timeStep.key,
            [TEMPORAL_LABEL_FIELD]: timeStep.label,
            [EMERGING_CATEGORY_FIELD]: location.category,
            [EMERGING_LABEL_FIELD]: location.categoryLabel,
            [EMERGING_REASON_FIELD]: location.diagnostics.classificationReason,
            [EMERGING_TREND_FIELD]: location.diagnostics.mannKendall.trend,
            [EMERGING_TREND_Z_FIELD]: location.diagnostics.mannKendall.zScore,
            [EMERGING_TREND_P_FIELD]: location.diagnostics.mannKendall.pValue,
            [EMERGING_TREND_TAU_FIELD]: location.diagnostics.mannKendall.tau,
            [EMERGING_HOT_COUNT_FIELD]: location.diagnostics.hotCount,
            [EMERGING_COLD_COUNT_FIELD]: location.diagnostics.coldCount,
          },
        };
      }),
    };

    return {
      key: timeStep.key,
      label: timeStep.label,
      data: buildHotSpotDecoratedCollection(rawCollection, significanceThreshold).decoratedCollection,
    };
  });
}

function normalizeTemporalFrames(frames: CellularAutomataResult["frames"]): AnalysisTemporalFrame[] {
  return frames.map((frame) => {
    const label = buildTemporalFrameLabel(frame.step, frame.label);
    return {
      key: String(frame.step),
      label,
      data: {
        type: "FeatureCollection",
        features: frame.featureCollection.features.map((feature) => ({
          ...cloneJson(feature),
          properties: {
            ...(cloneJson(feature.properties ?? {}) as GeoJSON.GeoJsonProperties),
            [TEMPORAL_STEP_FIELD]: frame.step,
            [TEMPORAL_LABEL_FIELD]: label,
          },
        })),
      },
    };
  });
}

function buildAnalysisMetadata(params: {
  engine: AnalysisEngineId;
  input: AdapterBaseInput;
  layerId: string;
  visualization: AnalysisVisualizationSpec;
  statisticalSummary: Record<string, StatisticalSummaryValue>;
  rerunToken?: string;
}): AnalysisResultMetadata {
  const parameters = cloneJson(params.input.parameters ?? {});
  const outputMode = resolveAnalysisOutputMode(params.input);
  const caveats = buildAnalysisCaveats({
    engine: params.engine,
    input: params.input,
    outputMode,
    visualization: params.visualization,
  });
  const qaSummary = buildAnalysisQASummary({
    input: params.input,
    outputMode,
    caveats,
  });
  const sourceRunId = resolveSourceRunId(params.input, params.layerId);
  const algorithmWorkflowId = resolveAlgorithmWorkflowId(params.engine, params.input);
  const evidenceArtifactId = buildEvidenceArtifactId(params.engine, params.input, params.layerId);
  return {
    engine: params.engine,
    runTimestamp: normalizeRunTimestamp(params.input.runTimestamp),
    parameterSummary: buildParameterSummary(parameters),
    inputParameters: parameters,
    statisticalSummary: cloneJson(params.statisticalSummary),
    sourceRunId,
    algorithmWorkflowId,
    outputMode,
    qaSummary,
    caveats,
    evidenceArtifactId,
    handoffHints: buildHandoffHints(params.engine, params.layerId),
    stale: false,
    visualization: cloneJson(params.visualization),
    ...(params.input.runId ? { runId: params.input.runId } : {}),
    sourceLayerIds: [...(params.input.sourceLayerIds ?? [])],
    ...(params.input.sourceDataVersion ? { sourceDataVersion: params.input.sourceDataVersion } : {}),
    ...(params.input.reproducibilityManifest ? { reproducibilityManifest: cloneJson(params.input.reproducibilityManifest) } : {}),
    ...(params.rerunToken ? { rerunToken: params.rerunToken } : {}),
  };
}

function buildLayerResult(params: {
  engine: AnalysisEngineId;
  input: AdapterBaseInput;
  featureCollection: GeoJSON.FeatureCollection;
  style?: Record<string, unknown>;
  visualization: AnalysisVisualizationSpec;
  statisticalSummary: Record<string, StatisticalSummaryValue>;
  provenance?: LayerProvenance;
  rerunToken?: string;
  opacity?: number;
  layerType?: OverlayLayerConfig["type"];
  queryable?: boolean;
}): AnalysisAdapterResult {
  const metadata = buildFeatureCollectionMetadata(params.featureCollection);
  const layerId = buildLayerId(params.engine, params.input);
  const layerName = buildLayerName(params.engine, params.input.layerName);
  const analysisResult = buildAnalysisMetadata({
    engine: params.engine,
    input: params.input,
    layerId,
    visualization: params.visualization,
    statisticalSummary: params.statisticalSummary,
    ...(params.rerunToken ? { rerunToken: params.rerunToken } : {}),
  });
  const evidenceArtifact = buildAnalysisEvidenceArtifact({
    engine: params.engine,
    input: params.input,
    layerId,
    layerName,
    featureMetadata: metadata,
    analysisResult,
  });

  const layer = withNormalizedLayerRegistryMetadata({
    id: layerId,
    name: layerName,
    type: params.layerType ?? "geojson",
    visible: true,
    opacity: params.opacity ?? DEFAULT_LAYER_OPACITY,
    sourceData: cloneJson(params.featureCollection),
    group: "analysis",
    sourceKind: resolveAnalysisSourceKind(params.input),
    provenance: params.provenance ?? buildAnalysisProvenance(params.engine, params.input, params.visualization.title),
    qaStatus: qaStatusToLayerQaStatus(analysisResult.qaSummary?.status ?? "unchecked"),
    queryable: params.queryable ?? true,
    metadata: {
      ...metadata,
      updatedAt: analysisResult.runTimestamp,
      analysisResult,
      evidenceArtifactId: analysisResult.evidenceArtifactId,
      ...(analysisResult.reproducibilityManifest ? { reproducibilityManifest: analysisResult.reproducibilityManifest } : {}),
    },
    ...(params.style ? { style: cloneJson(params.style) } : {}),
  });

  return {
    layer,
    visualization: cloneJson(params.visualization),
    evidenceArtifact,
  };
}

export function adaptFeatureCollectionAnalysisResult(
  input: FeatureCollectionAnalysisAdapterInput,
): AnalysisAdapterResult {
  return buildLayerResult({
    engine: input.engine,
    input,
    featureCollection: input.featureCollection,
    visualization: input.visualization,
    statisticalSummary: input.statisticalSummary ?? {},
    ...(input.style ? { style: input.style } : {}),
    ...(typeof input.opacity === "number" ? { opacity: input.opacity } : {}),
    ...(input.layerType ? { layerType: input.layerType } : {}),
  });
}

function joinObservationProperties<T>(
  engine: AnalysisEngineId,
  featureCollection: GeoJSON.FeatureCollection,
  observations: T[],
  mapObservation: (observation: T, index: number) => GeoJSON.GeoJsonProperties,
): GeoJSON.FeatureCollection {
  if (featureCollection.features.length !== observations.length) {
    throw new RangeError(
      `${engine} feature join expects ${featureCollection.features.length} records but received ${observations.length}.`,
    );
  }

  return {
    type: "FeatureCollection",
    features: featureCollection.features.map((feature, index) => ({
      ...cloneJson(feature),
      properties: {
        ...(cloneJson(feature.properties ?? {}) as GeoJSON.GeoJsonProperties),
        ...mapObservation(observations[index]!, index),
      },
    })),
  };
}

function buildLisaStyle(geometryType?: string): Record<string, unknown> {
  return buildColorStyle(
    geometryType,
    buildMatchExpression(
      LISA_CLUSTER_FIELD,
      Object.entries(LISA_CLUSTER_COLORS),
      LISA_CLUSTER_COLORS.NS,
    ),
  );
}

function buildHotSpotStyle(geometryType?: string): Record<string, unknown> {
  return buildColorStyle(
    geometryType,
    buildMatchExpression(
      HOT_SPOT_CATEGORY_FIELD,
      Object.entries(HOT_SPOT_COLORS),
      HOT_SPOT_COLORS["not-significant"],
    ),
  );
}

function buildClassifiedCollection(
  featureCollection: GeoJSON.FeatureCollection,
  valueField: string,
  method: ClassificationMethod,
  classCount: number,
  colorRamp: ColorRampName,
): {
  collection: GeoJSON.FeatureCollection;
  classification: ClassificationResult;
  colors: string[];
} {
  const values = featureCollection.features
    .map((feature) => toFiniteNumber(feature.properties?.[valueField]))
    .filter((value): value is number => value != null);

  if (values.length === 0) {
    throw new Error(`Cannot classify field "${valueField}" because it contains no numeric values.`);
  }

  const classification = classifyNumericValues(values, {
    method,
    classCount,
  });
  const colors = getColorRampColors(colorRamp, classification.classes.length);

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: featureCollection.features.map((feature) => {
      const value = toFiniteNumber(feature.properties?.[valueField]);
      const classIndex = value == null
        ? NO_DATA_CLASS_INDEX
        : findClassificationClassIndex(value, classification);
      const classLabel = classIndex >= 0
        ? classification.classes[classIndex]?.label ?? NO_DATA_LABEL
        : NO_DATA_LABEL;

      return {
        ...cloneJson(feature),
        properties: {
          ...(cloneJson(feature.properties ?? {}) as GeoJSON.GeoJsonProperties),
          [ANALYSIS_VALUE_FIELD]: value,
          [ANALYSIS_CLASS_INDEX_FIELD]: classIndex,
          [ANALYSIS_CLASS_LABEL_FIELD]: classLabel,
        },
      };
    }),
  };

  return {
    collection,
    classification,
    colors,
  };
}

function buildClassifiedStyle(
  geometryType: string | undefined,
  colors: string[],
): Record<string, unknown> {
  return buildColorStyle(
    geometryType,
    buildMatchExpression(
      ANALYSIS_CLASS_INDEX_FIELD,
      colors.map((color, index) => [index, color] as [number, string]),
      NO_DATA_COLOR,
    ),
  );
}

function buildCategoricalStyle(
  geometryType: string | undefined,
  field: string,
  categories: string[],
  colors: string[],
): Record<string, unknown> {
  return buildColorStyle(
    geometryType,
    buildMatchExpression(
      field,
      categories.map((category, index) => [category, colors[index] ?? NO_DATA_COLOR]),
      NO_DATA_COLOR,
    ),
  );
}

function buildMapOutputType(visualization: AnalysisVisualizationSpec): MapOutput["type"] {
  if (visualization.kind === "stat-summary") {
    return "flow_map";
  }
  if (visualization.kind === "agent-density") {
    return "heatmap";
  }
  return "choropleth";
}

function buildOutputBridge(layer: OverlayLayerConfig): AnalysisMapOutputBridge {
  const analysisResult = layer.metadata?.analysisResult;
  if (!analysisResult) {
    throw new Error("Analysis layers must include analysisResult metadata.");
  }

  return {
    domain: resolveEngineDomain(analysisResult.engine),
    engine: analysisResult.engine,
    runTimestamp: analysisResult.runTimestamp,
    parameters: cloneJson(analysisResult.inputParameters),
    statisticalSummary: cloneJson(analysisResult.statisticalSummary),
    visualization: cloneJson(analysisResult.visualization),
    ...(analysisResult.runId ? { runId: analysisResult.runId } : {}),
    ...(analysisResult.sourceLayerIds ? { sourceLayerIds: [...analysisResult.sourceLayerIds] } : {}),
    ...(analysisResult.sourceDataVersion ? { sourceDataVersion: analysisResult.sourceDataVersion } : {}),
    ...(layer.metadata?.geometryType ? { geometryType: layer.metadata.geometryType } : {}),
    ...(layer.type ? { layerType: layer.type } : {}),
    ...(layer.opacity !== undefined ? { opacity: layer.opacity } : {}),
    ...(analysisResult.rerunToken ? { rerunToken: analysisResult.rerunToken } : {}),
  };
}

function applyBridgeToLayer(
  output: MapOutput,
  bridge: AnalysisMapOutputBridge,
): AnalysisAdapterResult {
  let featureCollection = normalizeGeoJsonPayload(output.geojson);
  let style = output.style ? cloneJson(output.style) : undefined;

  if (bridge.visualization.kind === "lisa-cluster") {
    featureCollection = buildLisaDecoratedCollection(
      featureCollection,
      bridge.visualization.significanceThreshold ?? 0.05,
    ).decoratedCollection;
    style ??= buildLisaStyle(bridge.geometryType);
  } else if (bridge.visualization.kind === "hotspot") {
    featureCollection = buildHotSpotDecoratedCollection(
      featureCollection,
      bridge.visualization.significanceThreshold ?? 0.05,
    ).decoratedCollection;
    style ??= buildHotSpotStyle(bridge.geometryType);
  } else if (
    bridge.visualization.kind === "choropleth" &&
    bridge.visualization.valueField &&
    bridge.visualization.classificationMethod &&
    bridge.visualization.classCount &&
    bridge.visualization.colorRamp
  ) {
    const classified = buildClassifiedCollection(
      featureCollection,
      bridge.visualization.valueField,
      bridge.visualization.classificationMethod as ClassificationMethod,
      bridge.visualization.classCount,
      bridge.visualization.colorRamp as ColorRampName,
    );
    featureCollection = classified.collection;
    style ??= buildClassifiedStyle(bridge.geometryType, classified.colors);
  } else if (bridge.visualization.kind === "land-cover") {
    style ??= buildLandCoverStyle(bridge.geometryType);
  } else if (bridge.visualization.kind === "detection") {
    const colors = (bridge.visualization.legendEntries ?? []).reduce<Record<string, string>>((entries, entry) => {
      if (entry.color) {
        entries[String(entry.value)] = entry.color;
      }
      return entries;
    }, {});
    style ??= buildDetectionStyle(bridge.geometryType, colors);
  } else if (bridge.visualization.kind === "query-highlight") {
    style ??= buildQueryHighlightStyle(bridge.geometryType);
  } else if (bridge.visualization.kind === "temporal") {
    if (
      bridge.visualization.temporalFrames &&
      bridge.visualization.temporalFrames.length > 0 &&
      featureCollection.features.length === 0
    ) {
      featureCollection = cloneJson(bridge.visualization.temporalFrames[0].data);
    }
    style ??= buildTemporalStyle(
      bridge.geometryType,
      bridge.visualization.valueField,
      bridge.visualization.minValue,
      bridge.visualization.maxValue,
      (bridge.visualization.colorRamp as ColorRampName | undefined) ?? TEMPORAL_DEFAULT_COLOR_RAMP,
    );
  } else if (bridge.visualization.kind === "agent-density") {
    style ??= buildAbmHeatmapStyle(bridge.visualization.valueField ?? ABM_WEIGHT_FIELD);
  } else if (bridge.visualization.kind === "facility-allocation") {
    const geometryHint = normalizeGeometryHint(bridge.geometryType);
    style ??= geometryHint === "point"
      ? buildFacilitySiteStyle(bridge.geometryType)
      : buildFacilityCatchmentStyle(bridge.geometryType);
  }

  const outputMetadata = output.metadata;
  const persistedManifest = outputMetadata?.reproducibilityManifest;
  const sourceRunId = metadataString(outputMetadata, "sourceRunId");
  const algorithmWorkflowId = metadataString(outputMetadata, "algorithmWorkflowId");
  const outputMode = metadataOutputMode(outputMetadata);
  const evidenceArtifactId = metadataString(outputMetadata, "evidenceArtifactId");
  const sourceKind = metadataString(outputMetadata, "sourceKind");
  const restoredCaveats = metadataCaveats(outputMetadata);
  const restoredQASummary = metadataQASummary(outputMetadata);
  const restoredInput: AdapterBaseInput = {
    layerId: output.id,
    layerName: output.layerName ?? output.title,
    runTimestamp: bridge.runTimestamp,
    parameters: bridge.parameters,
    ...(bridge.runId ? { runId: bridge.runId } : {}),
    ...(sourceRunId ? { sourceRunId } : {}),
    ...(algorithmWorkflowId ? { algorithmWorkflowId } : {}),
    ...(bridge.sourceLayerIds ? { sourceLayerIds: [...bridge.sourceLayerIds] } : {}),
    ...(bridge.sourceDataVersion ? { sourceDataVersion: bridge.sourceDataVersion } : {}),
    ...(outputMode ? { outputMode } : {}),
    ...(evidenceArtifactId ? { evidenceArtifactId } : {}),
    ...(sourceKind === "demo" ? { sourceKind: "demo" as const } : {}),
    ...(restoredCaveats.length > 0 ? { caveats: restoredCaveats } : {}),
    ...(restoredQASummary ? { qaSummary: restoredQASummary } : {}),
    ...(isMapReproducibilityManifest(persistedManifest)
      ? { reproducibilityManifest: cloneJson(persistedManifest) }
      : {}),
  };

  const analysisResult = buildAnalysisMetadata({
    engine: bridge.engine,
    input: restoredInput,
    layerId: output.id,
    visualization: bridge.visualization,
    statisticalSummary: bridge.statisticalSummary,
    ...(bridge.rerunToken ? { rerunToken: bridge.rerunToken } : {}),
  });
  const featureMetadata = buildFeatureCollectionMetadata(featureCollection);
  const evidenceArtifact = buildAnalysisEvidenceArtifact({
    engine: bridge.engine,
    input: restoredInput,
    layerId: output.id,
    layerName: output.layerName ?? output.title,
    featureMetadata,
    analysisResult,
  });

  const layer = withNormalizedLayerRegistryMetadata({
    id: output.id,
    name: output.layerName ?? output.title,
    type: bridge.layerType ?? (bridge.visualization.kind === "agent-density" ? "heatmap" : "geojson"),
    visible: true,
    opacity: bridge.opacity ?? DEFAULT_LAYER_OPACITY,
    sourceData: featureCollection,
    group: "analysis",
    sourceKind: resolveAnalysisSourceKind(restoredInput),
    qaStatus: qaStatusToLayerQaStatus(analysisResult.qaSummary?.status ?? "unchecked"),
    metadata: {
      ...featureMetadata,
      updatedAt: bridge.runTimestamp,
      analysisResult,
      evidenceArtifactId: analysisResult.evidenceArtifactId,
      ...(analysisResult.reproducibilityManifest ? { reproducibilityManifest: analysisResult.reproducibilityManifest } : {}),
    },
    ...(style ? { style } : {}),
  });

  return {
    layer,
    visualization: cloneJson(bridge.visualization),
    evidenceArtifact,
  };
}

function sanitizeFieldToken(label: string): string {
  const token = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return token.length > 0 ? token : "parameter";
}

function withRerunToken(
  result: SpatialStatsAdapterResult,
  rerunToken: string,
): SpatialStatsAdapterResult {
  const analysisResult = result.layer.metadata?.analysisResult;
  if (!analysisResult) {
    return result;
  }

  return {
    ...result,
    layer: {
      ...result.layer,
      metadata: {
        ...(result.layer.metadata ?? {}),
        analysisResult: {
          ...analysisResult,
          rerunToken,
        },
      },
    },
  };
}

export function adaptLISAResult(input: LISAAdapterInput): SpatialStatsAdapterResult {
  const joined = joinObservationProperties(
    "LocalMoransI",
    input.featureCollection,
    input.result.featureProperties,
    (observation) => ({
      index: observation.index,
      value: observation.value,
      z_value: observation.zValue,
      spatial_lag: observation.spatialLag,
      local_i: observation.localI,
      p_value: observation.pValue,
      significant: observation.significant,
      cluster_type: observation.clusterType,
    }),
  );

  const significanceThreshold = input.significanceThreshold ?? input.result.alpha;
  const decorated = buildLisaDecoratedCollection(joined, significanceThreshold).decoratedCollection;
  const visualization: SpatialStatsVisualizationSpec = {
    kind: "lisa-cluster",
    title: buildLayerName("LocalMoransI", input.layerName),
    significanceThreshold,
  };
  const statisticalSummary: Record<string, StatisticalSummaryValue> = {
    hhCount: input.result.summary.HH,
    hlCount: input.result.summary.HL,
    lhCount: input.result.summary.LH,
    llCount: input.result.summary.LL,
    notSignificantCount: input.result.summary["not-significant"],
    alpha: input.result.alpha,
    permutations: input.result.permutations,
    correction: input.result.correction,
  };

  return buildLayerResult({
    engine: "LocalMoransI",
    input,
    featureCollection: decorated,
    style: buildLisaStyle(buildFeatureCollectionMetadata(decorated).geometryType),
    visualization,
    statisticalSummary,
  });
}

export function adaptHotSpotResult(input: HotSpotAdapterInput): SpatialStatsAdapterResult {
  const joined = joinObservationProperties(
    "GetisOrdGi",
    input.featureCollection,
    input.result.featureProperties,
    (observation) => ({
      index: observation.index,
      value: observation.value,
      gi_star: observation.giStar,
      z_score: observation.zScore,
      p_value: observation.pValue,
      confidence_level: observation.confidence,
    }),
  );

  const significanceThreshold = input.significanceThreshold ?? 0.05;
  const decorated = buildHotSpotDecoratedCollection(joined, significanceThreshold).decoratedCollection;
  const visualization: SpatialStatsVisualizationSpec = {
    kind: "hotspot",
    title: buildLayerName("GetisOrdGi", input.layerName),
    significanceThreshold,
  };
  const statisticalSummary: Record<string, StatisticalSummaryValue> = {
    hot99Count: input.result.summary["hot-99"],
    hot95Count: input.result.summary["hot-95"],
    hot90Count: input.result.summary["hot-90"],
    notSignificantCount: input.result.summary["not-significant"],
    cold90Count: input.result.summary["cold-90"],
    cold95Count: input.result.summary["cold-95"],
    cold99Count: input.result.summary["cold-99"],
    globalMean: input.result.globalMean,
    globalStd: input.result.globalStd,
  };

  return buildLayerResult({
    engine: "GetisOrdGi",
    input,
    featureCollection: decorated,
    style: buildHotSpotStyle(buildFeatureCollectionMetadata(decorated).geometryType),
    visualization,
    statisticalSummary,
  });
}

export function adaptEmergingHotSpotResult(
  input: EmergingHotSpotAdapterInput,
): SpatialStatsAdapterResult {
  const significanceThreshold = input.significanceThreshold ?? input.result.significanceThreshold;
  const temporalFrames = buildEmergingTemporalFrames(
    input.featureCollection,
    input.result,
    significanceThreshold,
  );
  const firstFrame = cloneJson(temporalFrames[0]?.data ?? emptyFeatureCollection());
  const legendEntries = buildLegendEntriesFromCounts(
    input.result.summary,
    input.result.legend.reduce<Record<string, string>>((entries, entry) => {
      entries[entry.category] = entry.color;
      return entries;
    }, {}),
    input.result.legend.reduce<Record<string, string>>((entries, entry) => {
      entries[entry.category] = entry.label;
      return entries;
    }, {}),
  );

  const visualization: SpatialStatsVisualizationSpec = {
    kind: "temporal",
    title: buildLayerName("EmergingHotSpots", input.layerName),
    timeProperty: TEMPORAL_STEP_FIELD,
    temporalFrames,
    ...(legendEntries === undefined ? {} : { legendEntries }),
    popupFields: [
      TEMPORAL_LABEL_FIELD,
      HOT_SPOT_CATEGORY_LABEL_FIELD,
      EMERGING_LABEL_FIELD,
      EMERGING_TREND_FIELD,
      EMERGING_TREND_P_FIELD,
      HOT_SPOT_GI_FIELD,
      HOT_SPOT_Z_SCORE_FIELD,
      HOT_SPOT_P_VALUE_FIELD,
    ],
  };

  const statisticalSummary: Record<string, StatisticalSummaryValue> = {
    newCount: input.result.summary.new,
    consecutiveCount: input.result.summary.consecutive,
    intensifyingCount: input.result.summary.intensifying,
    persistentCount: input.result.summary.persistent,
    diminishingCount: input.result.summary.diminishing,
    sporadicCount: input.result.summary.sporadic,
    oscillatingCount: input.result.summary.oscillating,
    historicalCount: input.result.summary.historical,
    unclassifiedCount: input.result.unclassifiedCount,
    featureCount: input.result.featureCount,
    timeStepCount: input.result.timeStepCount,
    significanceThreshold: input.result.significanceThreshold,
    trendAlpha: input.result.trendAlpha,
  };

  return buildLayerResult({
    engine: "EmergingHotSpots",
    input,
    featureCollection: firstFrame,
    style: buildHotSpotStyle(buildFeatureCollectionMetadata(firstFrame).geometryType),
    visualization,
    statisticalSummary,
    opacity: 0.9,
  });
}

export function adaptGlobalMoranResult(input: GlobalMoranAdapterInput): SpatialStatsAdapterResult {
  const summaryMetrics = buildSummaryMetrics({
    observed: input.result.observed,
    expected: input.result.expected,
    variance: input.result.variance,
    zScore: input.result.zScore,
    pValue: input.result.pValue,
    permutations: input.result.permutations,
  });

  const visualization: SpatialStatsVisualizationSpec = {
    kind: "stat-summary",
    title: buildLayerName("GlobalMoransI", input.layerName),
    summaryMetrics,
  };

  return buildLayerResult({
    engine: "GlobalMoransI",
    input,
    featureCollection: emptyFeatureCollection(),
    visualization,
    statisticalSummary: {
      observed: input.result.observed,
      expected: input.result.expected,
      variance: input.result.variance,
      zScore: input.result.zScore,
      pValue: input.result.pValue,
      permutations: input.result.permutations,
    },
    opacity: 1,
  });
}

export function adaptOLSResult(input: OLSAdapterInput): SpatialStatsAdapterResult {
  if (input.featureCollection.features.length !== input.result.n) {
    throw new RangeError(
      `OLS feature join expects ${input.featureCollection.features.length} records but received ${input.result.n}.`,
    );
  }

  const residualValues = Array.from(input.result.residuals);
  const meanResidual = residualValues.reduce((sum, value) => sum + value, 0) / residualValues.length;
  const residualStd = Math.sqrt(
    residualValues.reduce((sum, value) => sum + (value - meanResidual) ** 2, 0) /
      Math.max(residualValues.length, 1),
  );

  const joined = joinObservationProperties(
    "OLS",
    input.featureCollection,
    input.featureCollection.features,
    (_feature, index) => ({
      residual: input.result.residuals[index],
      fitted_value: input.result.fittedValues[index],
      abs_residual: Math.abs(input.result.residuals[index]),
      standardized_residual: residualStd > 0 ? input.result.residuals[index] / residualStd : 0,
    }),
  );

  const classified = buildClassifiedCollection(
    joined,
    "residual",
    OLS_DEFAULTS.method,
    OLS_DEFAULTS.classCount,
    OLS_DEFAULTS.colorRamp,
  );

  const diagnosticsSummary = input.diagnostics
    ? diagnosticLabels(input.diagnostics)
        .slice(0, 4)
        .reduce<Record<string, StatisticalSummaryValue>>((summary, item) => {
          summary[item.key] = item.pValue == null ? item.statistic : item.pValue;
          return summary;
        }, {})
    : {};

  const visualization: SpatialStatsVisualizationSpec = {
    kind: "choropleth",
    title: buildLayerName("OLS", input.layerName),
    valueField: "residual",
    classificationMethod: classified.classification.method,
    classCount: classified.classification.classCount,
    colorRamp: OLS_DEFAULTS.colorRamp,
  };

  return buildLayerResult({
    engine: "OLS",
    input,
    featureCollection: classified.collection,
    style: buildClassifiedStyle(buildFeatureCollectionMetadata(classified.collection).geometryType, classified.colors),
    visualization,
    statisticalSummary: {
      rSquared: input.result.rSquared,
      adjustedRSquared: input.result.adjRSquared,
      aic: input.result.aic,
      bic: input.result.bic,
      observations: input.result.n,
      predictors: input.result.k,
      ...diagnosticsSummary,
    },
  });
}

export function adaptGWRResult(input: GWRAdapterInput): SpatialStatsAdapterResult {
  if (input.featureCollection.features.length !== input.result.n) {
    throw new RangeError(
      `GWR feature join expects ${input.featureCollection.features.length} records but received ${input.result.n}.`,
    );
  }

  const parameterSurfaces = gwrParameterSurfaces(input.result, input.parameterLabels);
  const joined = joinObservationProperties(
    "GWR",
    input.featureCollection,
    input.featureCollection.features,
    (_feature, index) => {
      const parameterFields = parameterSurfaces.reduce<Record<string, unknown>>((properties, surface) => {
        const token = sanitizeFieldToken(surface.name);
        properties[`coef_${token}`] = surface.coefficients[index];
        properties[`se_${token}`] = surface.standardErrors[index];
        properties[`t_${token}`] = surface.tStatistics[index];
        return properties;
      }, {});

      return {
        local_r_squared: input.result.localRSquared[index],
        residual: input.result.residuals[index],
        fitted_value: input.result.fittedValues[index],
        leverage: input.result.hatDiag[index],
        ...parameterFields,
      };
    },
  );

  const classified = buildClassifiedCollection(
    joined,
    "local_r_squared",
    GWR_DEFAULTS.method,
    GWR_DEFAULTS.classCount,
    GWR_DEFAULTS.colorRamp,
  );
  const localR2Values = Array.from(input.result.localRSquared);
  const minLocalR2 = Math.min(...localR2Values);
  const maxLocalR2 = Math.max(...localR2Values);

  const visualization: SpatialStatsVisualizationSpec = {
    kind: "choropleth",
    title: buildLayerName("GWR", input.layerName),
    valueField: "local_r_squared",
    classificationMethod: classified.classification.method,
    classCount: classified.classification.classCount,
    colorRamp: GWR_DEFAULTS.colorRamp,
  };

  return buildLayerResult({
    engine: "GWR",
    input,
    featureCollection: classified.collection,
    style: buildClassifiedStyle(buildFeatureCollectionMetadata(classified.collection).geometryType, classified.colors),
    visualization,
    statisticalSummary: {
      bandwidth: input.result.bandwidth,
      kernel: input.result.kernel,
      aicc: input.result.aicc,
      effectiveParams: input.result.effectiveParams,
      sigma2: input.result.sigma2,
      minLocalR2,
      maxLocalR2,
      observations: input.result.n,
    },
  });
}

export function adaptPCAResult(input: PCAAdapterInput): SpatialStatsAdapterResult {
  const componentIndex = Math.max(0, input.componentIndex ?? 0);
  const selectedComponent = Math.min(componentIndex, input.result.scores[0]?.length ? input.result.scores[0]!.length - 1 : 0);

  if (input.featureCollection.features.length !== input.result.scores.length) {
    throw new RangeError(
      `PCA feature join expects ${input.featureCollection.features.length} records but received ${input.result.scores.length}.`,
    );
  }

  const joined = joinObservationProperties(
    "PCA",
    input.featureCollection,
    input.result.scores,
    (scores) => scores.reduce<Record<string, unknown>>((properties, value, index) => {
      properties[`component_${index + 1}_score`] = value;
      return properties;
    }, {}),
  );

  const valueField = `component_${selectedComponent + 1}_score`;
  const classified = buildClassifiedCollection(
    joined,
    valueField,
    PCA_DEFAULTS.method,
    PCA_DEFAULTS.classCount,
    PCA_DEFAULTS.colorRamp,
  );

  const visualization: SpatialStatsVisualizationSpec = {
    kind: "choropleth",
    title: buildLayerName("PCA", input.layerName),
    valueField,
    classificationMethod: classified.classification.method,
    classCount: classified.classification.classCount,
    colorRamp: PCA_DEFAULTS.colorRamp,
  };

  return buildLayerResult({
    engine: "PCA",
    input,
    featureCollection: classified.collection,
    style: buildClassifiedStyle(buildFeatureCollectionMetadata(classified.collection).geometryType, classified.colors),
    visualization,
    statisticalSummary: {
      selectedComponent: selectedComponent + 1,
      eigenvalue: input.result.eigenvalues[selectedComponent] ?? null,
      varianceExplained: input.result.varianceExplained[selectedComponent] ?? null,
      cumulativeVariance: input.result.cumulativeVariance[selectedComponent] ?? null,
      kaiserComponents: input.result.kaiserComponents,
    },
  });
}

export function adaptClusterResult(input: ClusterAdapterInput): SpatialStatsAdapterResult {
  if (input.featureCollection.features.length !== input.result.labels.length) {
    throw new RangeError(
      `ClusterAnalysis feature join expects ${input.featureCollection.features.length} records but received ${input.result.labels.length}.`,
    );
  }

  const labelPrefix = input.labelPrefix?.trim().length ? input.labelPrefix.trim() : "Cluster";
  const joined = joinObservationProperties(
    "ClusterAnalysis",
    input.featureCollection,
    input.result.labels,
    (label, index) => ({
      cluster_id: label + 1,
      cluster_label: `${labelPrefix} ${label + 1}`,
      silhouette_score: input.result.silhouetteScores[index] ?? null,
    }),
  );

  const categories = Array.from({ length: input.result.k }, (_, index) => `${labelPrefix} ${index + 1}`);
  const colors = getColorRampColors("Paired", Math.max(input.result.k, 3)).slice(0, input.result.k);
  const visualization: SpatialStatsVisualizationSpec = {
    kind: "choropleth",
    title: buildLayerName("ClusterAnalysis", input.layerName),
    valueField: "cluster_id",
    labelField: "cluster_label",
    classificationMethod: "cluster-category",
    classCount: input.result.k,
    colorRamp: "Paired",
    showLabels: true,
  };

  return buildLayerResult({
    engine: "ClusterAnalysis",
    input,
    featureCollection: joined,
    style: buildCategoricalStyle(
      buildFeatureCollectionMetadata(joined).geometryType,
      "cluster_label",
      categories,
      colors,
    ),
    visualization,
    statisticalSummary: {
      clusterCount: input.result.k,
      meanSilhouette: input.result.meanSilhouette,
      totalWcss: input.result.totalWcss,
    },
  });
}

export function adaptLandCoverResult(input: LandCoverAdapterInput): AnalysisAdapterResult {
  const bounds = sanitizeBoundingBox(input.bounds);
  if (!bounds) {
    throw new RangeError("LandCoverClassifier requires finite bounds in [west, south, east, north] order.");
  }
  const layerId = buildLayerId("LandCoverClassifier", input);

  const pixelCount = input.result.width * input.result.height;
  if (input.result.labels.length !== pixelCount) {
    throw new RangeError(
      `LandCoverClassifier expected ${pixelCount} labels but received ${input.result.labels.length}.`,
    );
  }

  const classLabels = [...(input.classLabels ?? LAND_COVER_CLASSES)];
  const [west, south, east, north] = bounds;
  const cellWidth = (east - west) / input.result.width;
  const cellHeight = (north - south) / input.result.height;
  const counts: Record<string, number> = Object.fromEntries(
    classLabels.map((label) => [label, 0]),
  );
  const classAreas: Record<string, number> = Object.fromEntries(
    classLabels.map((label) => [label, 0]),
  );
  const confidences: number[] = [];

  const features: GeoJSON.Feature[] = [];

  for (let row = 0; row < input.result.height; row += 1) {
    const top = north - row * cellHeight;
    const bottom = north - (row + 1) * cellHeight;

    for (let column = 0; column < input.result.width; column += 1) {
      const index = row * input.result.width + column;
      const classIndex = input.result.labels[index];
      const className = classLabels[classIndex];

      if (!className) {
        throw new RangeError(`LandCoverClassifier produced unknown class index ${classIndex} at cell ${index}.`);
      }

      const left = west + column * cellWidth;
      const right = west + (column + 1) * cellWidth;
      const confidenceIndex = classIndex * pixelCount + index;
      const confidence = toFiniteNumber(input.result.probabilities[confidenceIndex]);
      counts[className] = (counts[className] ?? 0) + 1;
      if (confidence != null) {
        confidences.push(confidence);
      }
      const geometry: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [[
          [left, bottom],
          [right, bottom],
          [right, top],
          [left, top],
          [left, bottom],
        ]],
      };
      classAreas[className] = (classAreas[className] ?? 0) + computeGeometryAreaSquareMetres(geometry);

      features.push({
        type: "Feature",
        properties: {
          cell_id: `${input.cellIdPrefix ?? "land-cover"}-${row}-${column}`,
          row,
          column,
          land_cover_class: humanizeLandCoverClass(className),
          [LAND_COVER_CLASS_FIELD]: className,
          [LAND_COVER_INDEX_FIELD]: classIndex,
          [LAND_COVER_CONFIDENCE_FIELD]: confidence,
        },
        geometry,
      });
    }
  }

  const featureCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  const labelMap = Object.fromEntries(classLabels.map((label) => [label, humanizeLandCoverClass(label)]));
  const legendEntries = buildLegendEntriesFromCounts(counts, LAND_COVER_COLORS, labelMap);
  const visualization: AnalysisVisualizationSpec = {
    kind: "land-cover",
    title: buildLayerName("LandCoverClassifier", input.layerName),
    valueField: LAND_COVER_CLASS_FIELD,
    labelField: "land_cover_class",
    ...(legendEntries ? { legendEntries } : {}),
  };
  const meanConfidence = confidences.length > 0
    ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    : null;
  const adapterInput: LandCoverAdapterInput = {
    ...input,
    layerId,
    parameters: {
      ...(input.parameters ?? {}),
      bounds: [...input.bounds],
      width: input.result.width,
      height: input.result.height,
    },
  };

  return buildLayerResult({
    engine: "LandCoverClassifier",
    input: adapterInput,
    featureCollection,
    style: buildLandCoverStyle("Polygon"),
    visualization,
    statisticalSummary: {
      cellCount: pixelCount,
      width: input.result.width,
      height: input.result.height,
      meanConfidence: meanConfidence ?? null,
      totalAreaHa: stableNumber(Object.values(classAreas).reduce((sum, value) => sum + value, 0) / 10_000, 4),
      ...counts,
    },
    opacity: 0.9,
  });
}

export function adaptDetectionResult(input: DetectionAdapterInput): AnalysisAdapterResult {
  const layerId = buildLayerId("ObjectDetector", input);
  const threshold = Math.max(0, Math.min(1, input.confidenceThreshold ?? 0.4));
  const filteredDetections = input.result.detections.filter((detection) => {
    const confidence = toFiniteNumber(detection.confidence);
    return confidence != null && confidence >= threshold && sanitizeBoundingBox(detection.bbox) != null;
  });

  const orderedClasses = [
    ...(input.result.classLabels ?? []).filter((label) => filteredDetections.some((detection) => detection.className === label)),
    ...filteredDetections
      .map((detection) => detection.className)
      .filter((className, index, classes) => classes.indexOf(className) === index),
  ].filter((className, index, classes) => classes.indexOf(className) === index);
  const classColors = buildDetectionClassColors(orderedClasses, input.classColors);
  const counts: Record<string, number> = Object.fromEntries(orderedClasses.map((className) => [className, 0]));

  const featureCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: filteredDetections.map((detection, index) => {
      const bbox = sanitizeBoundingBox(detection.bbox)!;
      const [west, south, east, north] = bbox;
      const detectionId = detection.id ?? `detection-${index + 1}`;
      counts[detection.className] = (counts[detection.className] ?? 0) + 1;

      return {
        type: "Feature",
        id: detectionId,
        properties: {
          detection_id: detectionId,
          detection_class: detection.className,
          [DETECTION_CLASS_FIELD]: detection.className,
          confidence: detection.confidence,
          [DETECTION_LABEL_FIELD]: buildDetectionLabel(detection.className, detection.confidence),
          [DETECTION_EXTENT_FIELD]: `${west.toFixed(6)}, ${south.toFixed(6)}, ${east.toFixed(6)}, ${north.toFixed(6)}`,
          bbox_west: west,
          bbox_south: south,
          bbox_east: east,
          bbox_north: north,
          ...(cloneJson(detection.properties ?? {}) as GeoJSON.GeoJsonProperties),
        },
        geometry: buildBoundingBoxPolygon(bbox),
      };
    }),
  };

  const detectionLegendEntries = buildLegendEntriesFromCounts(counts, classColors);
  const visualization: AnalysisVisualizationSpec = {
    kind: "detection",
    title: buildLayerName("ObjectDetector", input.layerName),
    valueField: DETECTION_CLASS_FIELD,
    labelField: DETECTION_LABEL_FIELD,
    showLabels: true,
    confidenceThreshold: threshold,
    ...(detectionLegendEntries ? { legendEntries: detectionLegendEntries } : {}),
  };
  const adapterInput: DetectionAdapterInput = {
    ...input,
    layerId,
    parameters: {
      ...(input.parameters ?? {}),
      confidenceThreshold: threshold,
      modelId: input.result.modelId,
      imageId: input.result.imageId,
    },
  };

  return buildLayerResult({
    engine: "ObjectDetector",
    input: adapterInput,
    featureCollection,
    style: buildDetectionStyle("Polygon", classColors),
    visualization,
    statisticalSummary: {
      detectionCount: filteredDetections.length,
      threshold,
      classCount: orderedClasses.length,
      modelId: input.result.modelId ?? null,
      imageId: input.result.imageId ?? null,
    },
    opacity: 0.34,
  });
}

export function adaptQueryResult(input: QueryResultAdapterInput): AnalysisAdapterResult {
  const layerId = buildLayerId("QueryToSQL", input);
  const executionScope =
    input.executionScope ??
    (getStringParameter(input, "datasetMode") === "demo-data"
      ? "explicit-demo-data"
      : "live-project-data");
  const sourceTableIds =
    input.sourceTableIds && input.sourceTableIds.length > 0
      ? [...input.sourceTableIds]
      : input.result.referencedLayers.length > 0
        ? [...input.result.referencedLayers]
        : [...(input.sourceLayerIds ?? [])];
  const featureCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: input.featureCollection.features.map((feature, index) => ({
      ...cloneJson(feature),
      properties: {
        ...(cloneJson(feature.properties ?? {}) as GeoJSON.GeoJsonProperties),
        [QUERY_MATCH_FIELD]: true,
        query_match: true,
        query_match_rank: index + 1,
        query_intent: input.result.parse.intent,
        query_safe: input.result.safe,
        query_execution_scope: executionScope,
      },
    })),
  };

  const visualization: AnalysisVisualizationSpec = {
    kind: "query-highlight",
    title: buildLayerName("QueryToSQL", input.layerName),
    valueField: QUERY_MATCH_FIELD,
  };
  const adapterInput: QueryResultAdapterInput = {
    ...input,
    layerId,
    sourceKind: executionScope === "explicit-demo-data" ? "demo" : "derived",
    sourceLayerIds: input.sourceLayerIds ?? sourceTableIds,
    parameters: {
      ...(input.parameters ?? {}),
      query: input.queryText,
      sql: input.result.sql,
      safe: input.result.safe,
      intent: input.result.parse.intent,
      referencedLayers: input.result.referencedLayers,
      spatialFunctions: input.result.spatialFunctions,
      executionScope,
      sourceTableIds,
    },
  };

  return buildLayerResult({
    engine: "QueryToSQL",
    input: adapterInput,
    featureCollection,
    style: buildQueryHighlightStyle(buildFeatureCollectionMetadata(featureCollection).geometryType),
    visualization,
    statisticalSummary: {
      matchedFeatures: featureCollection.features.length,
      safe: input.result.safe,
      intent: input.result.parse.intent,
      referencedLayerCount: input.result.referencedLayers.length,
      spatialFunctionCount: input.result.spatialFunctions.length,
      rejectionReason: input.result.rejectionReason ?? null,
      executionScope,
      sourceTableCount: sourceTableIds.length,
    },
    opacity: 0.38,
  });
}

function buildFacilityCatchmentCollection(
  result: FacilityOptimisationResult,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: result.catchments.map((catchment) => {
      const site = result.chosenSites.find((entry) => entry.siteId === catchment.siteId);
      const coverageRatio =
        catchment.demandWithinCatchment > 0
          ? catchment.demandServedWithinCatchment / catchment.demandWithinCatchment
          : 0;

      return {
        type: "Feature",
        id: catchment.siteId,
        geometry: cloneJson(catchment.geometry),
        properties: {
          site_id: catchment.siteId,
          site_label: catchment.label,
          radius_km: catchment.radiusKm,
          demand_within_catchment: catchment.demandWithinCatchment,
          served_demand: catchment.demandServedWithinCatchment,
          assigned_demand: site?.assignedDemand ?? catchment.demandWithinCatchment,
          covered_demand: site?.coveredDemand ?? catchment.demandServedWithinCatchment,
          [FACILITY_SITE_ID_FIELD]: catchment.siteId,
          [FACILITY_SITE_LABEL_FIELD]: catchment.label,
          [FACILITY_SITE_COVERAGE_FIELD]: stableNumber(coverageRatio),
          [FACILITY_MODEL_FIELD]: result.model,
        },
      };
    }),
  };
}

function buildFacilitySiteCollection(
  result: FacilityOptimisationResult,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: result.chosenSites.map((site, index) => ({
      type: "Feature",
      id: site.siteId,
      geometry: {
        type: "Point",
        coordinates: [site.lng, site.lat],
      },
      properties: {
        site_id: site.siteId,
        site_label: site.label,
        selected_rank: index + 1,
        category: site.category ?? null,
        fixed_open: site.fixedOpen,
        assigned_demand: site.assignedDemand,
        covered_demand: site.coveredDemand,
        assigned_demand_count: site.assignedDemandCount,
        mean_assigned_distance_km: site.meanAssignedDistanceKm,
        max_assigned_distance_km: site.maxAssignedDistanceKm,
        [FACILITY_SITE_ID_FIELD]: site.siteId,
        [FACILITY_SITE_LABEL_FIELD]: site.label,
        [FACILITY_SITE_COVERAGE_FIELD]:
          site.assignedDemand > 0
            ? stableNumber(site.coveredDemand / site.assignedDemand)
            : 0,
        [FACILITY_MODEL_FIELD]: result.model,
      },
    })),
  };
}

export function adaptFacilityCatchmentsResult(
  input: FacilityOptimisationAdapterInput,
): AnalysisAdapterResult {
  const featureCollection = buildFacilityCatchmentCollection(input.result);
  const visualization: AnalysisVisualizationSpec = {
    kind: "facility-allocation",
    title: buildLayerName("FacilityOptimisation", input.layerName),
    valueField: FACILITY_SITE_COVERAGE_FIELD,
    labelField: FACILITY_SITE_LABEL_FIELD,
  };

  return buildLayerResult({
    engine: "FacilityOptimisation",
    input: {
      ...input,
      parameters: {
        ...(input.parameters ?? {}),
        model: input.result.model,
        selectedSiteCount: input.result.selectedSiteCount,
        serviceRadiusKm: input.result.serviceRadiusKm,
        ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
      },
    },
    featureCollection,
    style: buildFacilityCatchmentStyle(buildFeatureCollectionMetadata(featureCollection).geometryType),
    visualization,
    statisticalSummary: {
      model: input.result.model,
      selectedSiteCount: input.result.selectedSiteCount,
      totalDemand: input.result.demandSummary.totalDemand,
      servedDemand: input.result.demandSummary.demandServed,
      coveredDemand: input.result.demandSummary.coveredDemand,
      meanTravelBurdenKm: input.result.demandSummary.meanTravelBurdenKm,
      coverageGap: input.result.equityDiagnostics.coverageGap,
      meanTravelGapKm: input.result.equityDiagnostics.meanTravelGapKm,
      ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
    },
    opacity: 0.42,
  });
}

export function adaptFacilitySitesResult(
  input: FacilityOptimisationAdapterInput,
): AnalysisAdapterResult {
  const featureCollection = buildFacilitySiteCollection(input.result);
  const visualization: AnalysisVisualizationSpec = {
    kind: "facility-allocation",
    title: buildLayerName("FacilityOptimisation", input.layerName),
    valueField: FACILITY_SITE_COVERAGE_FIELD,
    labelField: FACILITY_SITE_LABEL_FIELD,
    showLabels: true,
  };

  return buildLayerResult({
    engine: "FacilityOptimisation",
    input: {
      ...input,
      parameters: {
        ...(input.parameters ?? {}),
        model: input.result.model,
        selectedSiteCount: input.result.selectedSiteCount,
        serviceRadiusKm: input.result.serviceRadiusKm,
        ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
      },
    },
    featureCollection,
    style: buildFacilitySiteStyle(buildFeatureCollectionMetadata(featureCollection).geometryType),
    visualization,
    statisticalSummary: {
      model: input.result.model,
      selectedSiteCount: input.result.selectedSiteCount,
      totalDemand: input.result.demandSummary.totalDemand,
      servedDemand: input.result.demandSummary.demandServed,
      coveredDemand: input.result.demandSummary.coveredDemand,
      meanTravelBurdenKm: input.result.demandSummary.meanTravelBurdenKm,
      maximinCoverageScore: input.result.equityDiagnostics.maximinCoverageScore,
      weightedTravelGini: input.result.equityDiagnostics.weightedTravelGini,
      ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
    },
    opacity: 0.96,
  });
}

export function adaptCompositeIndicatorResult(
  input: CompositeIndicatorAdapterInput,
): AnalysisAdapterResult {
  const topUnit = input.result.units[0];
  const bottomUnit = input.result.units[input.result.units.length - 1];
  const colorRamp = input.colorRamp ?? "Greens";
  const visualization: AnalysisVisualizationSpec = {
    kind: "choropleth",
    title: buildLayerName("CompositeIndicator", input.layerName),
    valueField: input.result.valueField,
    classificationMethod: "quantile",
    classCount: 5,
    colorRamp,
    labelField: "unit_label",
    popupFields: [
      "unit_label",
      input.result.valueField,
      input.result.confidenceLowerField,
      input.result.confidenceUpperField,
      input.result.rankField,
    ],
  };

  return buildLayerResult({
    engine: "CompositeIndicator",
    input: {
      ...input,
      parameters: {
        ...(input.parameters ?? {}),
        normalizationMethod: input.result.normalizationMethod,
        weightingMethod: input.result.weightingMethod,
        aggregationMethod: input.result.aggregationMethod,
        selectedIndicatorCount: input.result.selectedIndicators.length,
        sensitivityRuns: input.result.sensitivity.runs,
        ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
      },
    },
    featureCollection: cloneJson(input.result.featureCollection),
    visualization,
    statisticalSummary: {
      unitCount: input.result.datasetSummary.unitCount,
      selectedIndicatorCount: input.result.datasetSummary.selectedIndicatorCount,
      missingCellCount: input.result.datasetSummary.missingCellCount,
      imputedCellCount: input.result.datasetSummary.imputedCellCount,
      topKStability: input.result.sensitivity.topKStability,
      meanKendallTauToBaseline: input.result.sensitivity.meanKendallTauToBaseline,
      meanAbsoluteRankShift: input.result.sensitivity.meanAbsoluteRankShift,
      robustnessTier: input.result.sensitivity.robustnessTier,
      topUnit: topUnit?.label ?? null,
      topScore: topUnit?.scorePercent ?? null,
      bottomUnit: bottomUnit?.label ?? null,
      bottomScore: bottomUnit?.scorePercent ?? null,
      ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
    },
    opacity: 0.9,
  });
}

export function adaptCAResult(input: CAAdapterInput): AnalysisAdapterResult {
  if (input.result.frames.length === 0) {
    throw new RangeError("CellularAutomata requires at least one frame.");
  }
  const layerId = buildLayerId("CellularAutomata", input);

  const temporalFrames = normalizeTemporalFrames(input.result.frames);
  const firstFrame = cloneJson(temporalFrames[0]!.data);
  const domain = computeNumericDomainFromCollections(
    temporalFrames.map((frame) => frame.data),
    input.result.valueField,
  );
  const colorRamp = input.colorRamp ?? TEMPORAL_DEFAULT_COLOR_RAMP;
  const visualization: AnalysisVisualizationSpec = {
    kind: "temporal",
    title: buildLayerName("CellularAutomata", input.layerName),
    colorRamp,
    timeProperty: TEMPORAL_STEP_FIELD,
    temporalFrames,
    ...(input.result.valueField ? { valueField: input.result.valueField } : {}),
    ...(domain ? { minValue: domain[0], maxValue: domain[1] } : {}),
  };
  const startSummary = input.result.stepSummaries[0] ?? input.result.frames[0]?.summary ?? null;
  const endSummary =
    input.result.stepSummaries[input.result.stepSummaries.length - 1] ??
    input.result.frames[input.result.frames.length - 1]?.summary ??
    null;
  const startState = input.result.predictedStates[0];
  const endState = input.result.predictedStates[input.result.predictedStates.length - 1];
  let changedCellCount = 0;
  let growthCellCount = 0;
  let declineCellCount = 0;
  if (startState && endState && startState.values.length === endState.values.length) {
    for (let index = 0; index < startState.values.length; index += 1) {
      const startValue = startState.values[index] ?? 0;
      const endValue = endState.values[index] ?? 0;
      if (startValue !== endValue) {
        changedCellCount += 1;
      }
      if (endValue > startValue) {
        growthCellCount += 1;
      } else if (endValue < startValue) {
        declineCellCount += 1;
      }
    }
  } else if (startSummary && endSummary) {
    growthCellCount = Math.max(0, endSummary.totalUrbanCells - startSummary.totalUrbanCells);
    changedCellCount = growthCellCount;
  }
  const adapterInput: CAAdapterInput = {
    ...input,
    layerId,
    parameters: {
      ...(input.parameters ?? {}),
      frameCount: temporalFrames.length,
      valueField: input.result.valueField,
      ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
    },
  };

  return buildLayerResult({
    engine: "CellularAutomata",
    input: adapterInput,
    featureCollection: firstFrame,
    style: buildTemporalStyle(
      buildFeatureCollectionMetadata(firstFrame).geometryType,
      input.result.valueField,
      domain?.[0],
      domain?.[1],
      colorRamp,
    ),
    visualization,
    statisticalSummary: {
      frameCount: temporalFrames.length,
      firstStep: temporalFrames[0]!.key,
      lastStep: temporalFrames[temporalFrames.length - 1]!.key,
      featuresPerFrame: firstFrame.features.length,
      changedCellCount,
      growthCellCount,
      declineCellCount,
      valueField: input.result.valueField ?? null,
      ...(input.result.scenarioName ? { scenarioName: input.result.scenarioName } : {}),
      ...(input.result.validation
        ? {
            figureOfMerit: input.result.validation.figureOfMerit,
            overallAccuracy: input.result.validation.overallAccuracy,
            kappa: input.result.validation.kappa,
            kappaChange: input.result.validation.kappaChange,
            fitQuality: input.result.validation.fitQuality,
          }
        : {}),
    },
    opacity: 0.88,
  });
}

export function adaptABMResult(input: ABMAdapterInput): AnalysisAdapterResult {
  const layerId = buildLayerId("ABM", input);
  const featureCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: input.result.agents.features.map((feature) => {
      const existingWeight = input.result.weightField
        ? toFiniteNumber(feature.properties?.[input.result.weightField])
        : null;

      return {
        ...cloneJson(feature),
        properties: {
          ...(cloneJson(feature.properties ?? {}) as GeoJSON.GeoJsonProperties),
          [ABM_WEIGHT_FIELD]: existingWeight ?? 1,
        },
      };
    }),
  };
  const geometryType = buildFeatureCollectionMetadata(featureCollection).geometryType;

  if (featureCollection.features.length > 0 && normalizeGeometryHint(geometryType) !== "point") {
    throw new RangeError("ABM heatmap outputs require point geometries.");
  }

  const weights = featureCollection.features
    .map((feature) => toFiniteNumber(feature.properties?.[ABM_WEIGHT_FIELD]))
    .filter((value): value is number => value != null);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
  const visualization: AnalysisVisualizationSpec = {
    kind: "agent-density",
    title: buildLayerName("ABM", input.layerName),
    valueField: ABM_WEIGHT_FIELD,
    ...(minWeight != null ? { minValue: minWeight } : {}),
    ...(maxWeight != null ? { maxValue: maxWeight } : {}),
  };
  const adapterInput: ABMAdapterInput = {
    ...input,
    layerId,
    parameters: {
      ...(input.parameters ?? {}),
      weightField: input.result.weightField,
    },
  };

  return buildLayerResult({
    engine: "ABM",
    input: adapterInput,
    featureCollection,
    style: buildAbmHeatmapStyle(ABM_WEIGHT_FIELD),
    visualization,
    statisticalSummary: {
      agentCount: featureCollection.features.length,
      totalWeight,
      minWeight,
      maxWeight,
      weightField: input.result.weightField ?? null,
    },
    opacity: 0.92,
    layerType: "heatmap",
  });
}

export function attachAnalysisRerun(
  result: AnalysisAdapterResult,
  rerunHandler: AnalysisRerunHandler,
  rerunToken = `${result.layer.id}::rerun`,
): AnalysisAdapterResult {
  RERUN_REGISTRY.set(rerunToken, rerunHandler);
  return withRerunToken(result, rerunToken);
}

export function attachSpatialStatsRerun(
  result: SpatialStatsAdapterResult,
  rerunHandler: SpatialStatsRerunHandler,
  rerunToken = `${result.layer.id}::rerun`,
): SpatialStatsAdapterResult {
  return attachAnalysisRerun(result, rerunHandler, rerunToken);
}

export function hasAnalysisRerun(rerunToken?: string | null): boolean {
  return Boolean(rerunToken && RERUN_REGISTRY.has(rerunToken));
}

export function hasSpatialStatsRerun(rerunToken?: string | null): boolean {
  return hasAnalysisRerun(rerunToken);
}

export function clearAnalysisRerun(rerunToken?: string | null): void {
  if (!rerunToken) {
    return;
  }
  RERUN_REGISTRY.delete(rerunToken);
}

export function clearSpatialStatsRerun(rerunToken?: string | null): void {
  clearAnalysisRerun(rerunToken);
}

export async function rerunAnalysisResult(
  rerunToken: string,
): Promise<AnalysisAdapterResult | null> {
  const handler = RERUN_REGISTRY.get(rerunToken);
  if (!handler) {
    return null;
  }

  const result = await handler();
  return result ? withRerunToken(result, rerunToken) : null;
}

export async function rerunSpatialStatsResult(
  rerunToken: string,
): Promise<SpatialStatsAdapterResult | null> {
  return rerunAnalysisResult(rerunToken);
}

function formatSummaryValue(value: StatisticalSummaryValue): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/g, "").replace(/\.$/, "");
  }
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  return value == null ? "n/a" : String(value);
}

function humanizeSummaryKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function buildAnalysisRunNarrative(result: AnalysisAdapterResult): string {
  const analysis = result.layer.metadata?.analysisResult;
  if (!analysis) {
    throw new Error("Analysis runs require analysis metadata.");
  }

  const title = ENGINE_TITLES[analysis.engine] ?? result.layer.name;
  const parameterSummary = analysis.parameterSummary ? ` Parameters: ${analysis.parameterSummary}.` : "";
  const summaryEntries = Object.entries(analysis.statisticalSummary)
    .slice(0, 4)
    .map(([key, value]) => `${humanizeSummaryKey(key)} ${formatSummaryValue(value)}`);
  const summary = summaryEntries.length ? ` Key metrics: ${summaryEntries.join("; ")}.` : "";

  return `${title} produced ${result.layer.name}.${parameterSummary}${summary}`;
}

export function createAnalysisCompletedRun(
  result: AnalysisAdapterResult,
  options?: {
    flowId?: AnalyticalFlowId;
    runId?: string;
    insertedAt?: string;
    label?: string;
    paragraph?: string;
    paragraphPreview?: string;
    paragraphFull?: string;
    mapOutputs?: MapOutput[];
    chartOutputs?: ChartOutput[];
    dataOutputs?: DataOutput[];
    outputOptions?: {
      rerunHandler?: AnalysisRerunHandler;
      rerunToken?: string;
    };
  },
): CompletedAnalysisRun {
  const analysis = result.layer.metadata?.analysisResult;
  if (!analysis) {
    throw new Error("Analysis runs require analysis metadata.");
  }

  const narrative = buildAnalysisRunNarrative(result);

  return {
    runId: options?.runId ?? analysis.runId ?? `${result.layer.id}:${normalizeRunTimestamp(analysis.runTimestamp)}`,
    flowId: options?.flowId ?? "review",
    label: options?.label ?? result.layer.name,
    insertedAt: options?.insertedAt ?? normalizeRunTimestamp(analysis.runTimestamp),
    paragraph: options?.paragraph ?? narrative,
    paragraphPreview: options?.paragraphPreview ?? narrative,
    paragraphFull: options?.paragraphFull ?? narrative,
    mapOutputs: cloneJson(options?.mapOutputs ?? [createAnalysisMapOutput(result, options?.outputOptions)]),
    chartOutputs: cloneJson(options?.chartOutputs ?? []),
    dataOutputs: cloneJson(options?.dataOutputs ?? []),
  };
}

export function createPublishedDataCompletedRun(input: {
  runId: string;
  flowId?: AnalyticalFlowId;
  label: string;
  insertedAt?: string;
  paragraph: string;
  paragraphPreview?: string;
  paragraphFull?: string;
  mapOutputs?: MapOutput[];
  chartOutputs?: ChartOutput[];
  dataOutputs?: DataOutput[];
}): CompletedAnalysisRun {
  const insertedAt = normalizeRunTimestamp(input.insertedAt);
  return {
    runId: input.runId,
    flowId: input.flowId ?? "review",
    label: input.label,
    insertedAt,
    paragraph: input.paragraph,
    paragraphPreview: input.paragraphPreview ?? input.paragraph,
    paragraphFull: input.paragraphFull ?? input.paragraph,
    mapOutputs: cloneJson(input.mapOutputs ?? []),
    chartOutputs: cloneJson(input.chartOutputs ?? []),
    dataOutputs: cloneJson(input.dataOutputs ?? []),
  };
}

export function createSpatialStatsCompletedRun(
  result: SpatialStatsAdapterResult,
  options?: {
    flowId?: AnalyticalFlowId;
    runId?: string;
    insertedAt?: string;
    label?: string;
    paragraph?: string;
    paragraphPreview?: string;
    paragraphFull?: string;
    mapOutputs?: MapOutput[];
    chartOutputs?: ChartOutput[];
    dataOutputs?: DataOutput[];
    outputOptions?: {
      rerunHandler?: SpatialStatsRerunHandler;
      rerunToken?: string;
    };
  },
): CompletedAnalysisRun {
  return createAnalysisCompletedRun(result, options);
}

export function createAnalysisMapOutput(
  result: AnalysisAdapterResult,
  options?: {
    rerunHandler?: AnalysisRerunHandler;
    rerunToken?: string;
  },
): MapOutput {
  const outputResult = options?.rerunHandler
    ? attachAnalysisRerun(result, options.rerunHandler, options.rerunToken)
    : result;
  const metadata = buildAnalysisMapOutputMetadata(outputResult.layer);

  return {
    id: outputResult.layer.id,
    type: buildMapOutputType(outputResult.visualization),
    geojson: cloneJson((outputResult.layer.sourceData as GeoJsonPayload | undefined) ?? emptyFeatureCollection()),
    title: outputResult.layer.name,
    layerName: outputResult.layer.name,
    engineBridge: buildOutputBridge(outputResult.layer),
    ...(metadata ? { metadata } : {}),
    ...(outputResult.layer.style ? { style: cloneJson(outputResult.layer.style) } : {}),
  };
}

export function createSpatialStatsMapOutput(
  result: SpatialStatsAdapterResult,
  options?: {
    rerunHandler?: SpatialStatsRerunHandler;
    rerunToken?: string;
  },
): MapOutput {
  return createAnalysisMapOutput(result, options);
}

export function isAnalysisMapOutput(
  output: MapOutput,
): output is MapOutput & { engineBridge: AnalysisMapOutputBridge } {
  return isAnalysisBridge(output.engineBridge);
}

export function isSpatialStatsMapOutput(output: MapOutput): output is MapOutput & { engineBridge: SpatialStatsMapOutputBridge } {
  return isSpatialStatsBridge(output.engineBridge);
}

export function adaptAnalysisMapOutput(output: MapOutput): AnalysisAdapterResult | null {
  if (!isAnalysisMapOutput(output)) {
    return null;
  }
  return applyBridgeToLayer(output, output.engineBridge);
}

export function adaptSpatialStatsMapOutput(output: MapOutput): SpatialStatsAdapterResult | null {
  const adapted = adaptAnalysisMapOutput(output);
  return adapted && isSpatialStatsEngine(adapted.layer.metadata?.analysisResult?.engine)
    ? adapted
    : null;
}

export function extractAnalysisLayersFromRun(run: CompletedAnalysisRun): AnalysisAdapterResult[] {
  return run.mapOutputs
    .map((output) => adaptAnalysisMapOutput(output))
    .filter((result): result is AnalysisAdapterResult => result !== null);
}

export function extractSpatialStatsLayersFromRun(run: CompletedAnalysisRun): SpatialStatsAdapterResult[] {
  return extractAnalysisLayersFromRun(run).filter((result): result is SpatialStatsAdapterResult =>
    isSpatialStatsEngine(result.layer.metadata?.analysisResult?.engine),
  );
}

export function collectPendingAnalysisLayers(
  runs: CompletedAnalysisRun[],
  existingLayerIds: Iterable<string>,
): AnalysisAdapterResult[] {
  const seen = new Set(existingLayerIds);
  const pending: AnalysisAdapterResult[] = [];

  for (const run of runs) {
    for (const adapted of extractAnalysisLayersFromRun(run)) {
      if (seen.has(adapted.layer.id)) {
        continue;
      }
      pending.push(adapted);
      seen.add(adapted.layer.id);
    }
  }

  return pending;
}

export function collectPendingSpatialStatsLayers(
  runs: CompletedAnalysisRun[],
  existingLayerIds: Iterable<string>,
): SpatialStatsAdapterResult[] {
  return collectPendingAnalysisLayers(runs, existingLayerIds).filter((result): result is SpatialStatsAdapterResult =>
    isSpatialStatsEngine(result.layer.metadata?.analysisResult?.engine),
  );
}
