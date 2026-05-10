import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { giStar } from "@/engine/spatial-stats/autocorrelation/GetisOrdGi";
import { type CorrectionMethod, localMoransI } from "@/engine/spatial-stats/autocorrelation/LocalMoransI";
import { buildWeights } from "@/engine/spatial-stats/autocorrelation/SpatialWeights";
import {
  analyseEmergingHotSpots,
  type EmergingHotSpotCategory,
  type EmergingHotSpotLegendEntry,
} from "@/engine/spatial-stats/spatiotemporal/EmergingHotSpots";
import type {
  Coordinate,
  HotSpotConfidence,
  LISAClusterType,
  SpatialFeature,
  WeightsMethod,
} from "@/engine/spatial-stats/types";
import {
  adaptEmergingHotSpotResult,
  adaptHotSpotResult,
  adaptLISAResult,
  type SpatialStatsAdapterResult,
} from "./MapEngineAdapter";

export type SpatialStatsContiguityMethod = Extract<WeightsMethod, "queen" | "rook">;

interface BaseSpatialStatsExecutionInput {
  sourceLayer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  valueField: string;
  weightsMethod: SpatialStatsContiguityMethod;
  significanceThreshold: number;
  runId?: string;
  runTimestamp?: string;
  layerId?: string;
  layerName?: string;
}

export interface LisaSpatialStatsExecutionInput extends BaseSpatialStatsExecutionInput {
  alpha: number;
  correction: CorrectionMethod;
  permutations: number;
}

export interface HotSpotSpatialStatsExecutionInput extends BaseSpatialStatsExecutionInput {
  selfWeight: boolean;
}

export interface EmergingHotSpotSpatialStatsExecutionInput {
  sourceLayer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  timeFields: string[];
  weightsMethod: SpatialStatsContiguityMethod;
  significanceThreshold: number;
  selfWeight: boolean;
  runId?: string;
  runTimestamp?: string;
  layerId?: string;
  layerName?: string;
}

export interface LisaSpatialStatsExecutionResult {
  adaptedResult: SpatialStatsAdapterResult;
  summary: Record<LISAClusterType, number>;
  validFeatureCount: number;
  skippedFeatureCount: number;
}

export interface HotSpotSpatialStatsExecutionResult {
  adaptedResult: SpatialStatsAdapterResult;
  summary: Record<HotSpotConfidence, number>;
  validFeatureCount: number;
  skippedFeatureCount: number;
}

export interface EmergingHotSpotSpatialStatsExecutionResult {
  adaptedResult: SpatialStatsAdapterResult;
  summary: Record<EmergingHotSpotCategory, number>;
  legend: EmergingHotSpotLegendEntry[];
  unclassifiedCount: number;
  validFeatureCount: number;
  skippedFeatureCount: number;
  timeStepCount: number;
}

export interface PreparedSpatialDataset {
  featureCollection: GeoJSON.FeatureCollection;
  spatialFeatures: SpatialFeature[];
  values: Float64Array;
  validFeatureCount: number;
  skippedFeatureCount: number;
}

export interface PreparedSpatiotemporalDataset {
  featureCollection: GeoJSON.FeatureCollection;
  spatialFeatures: SpatialFeature[];
  timeSteps: Array<{
    key: string;
    label: string;
    values: Float64Array;
  }>;
  validFeatureCount: number;
  skippedFeatureCount: number;
}

function slugifyToken(value: string): string {
  const token = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return token.length > 0 ? token : "value";
}

function createNonce(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSpatialStatsExecutionIdentity(
  prefix: "lisa" | "hotspot" | "emerging-hotspot",
  sourceLayerId: string,
  valueField: string,
): { runId: string; layerId: string } {
  const nonce = createNonce();
  const suffix = nonce.slice(-8);
  const slug = `${slugifyToken(sourceLayerId)}-${slugifyToken(valueField)}`;
  return {
    runId: `${prefix}-${nonce}`,
    layerId: `analysis-${prefix}-${slug}-${suffix}`,
  };
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

function normalizeCoordinate(position: unknown): Coordinate | null {
  if (!Array.isArray(position) || position.length < 2) {
    return null;
  }
  const x = Number(position[0]);
  const y = Number(position[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return [x, y];
}

function normalizeRing(ring: unknown): Coordinate[] | null {
  if (!Array.isArray(ring) || ring.length < 4) {
    return null;
  }

  const coordinates: Coordinate[] = [];
  for (const position of ring) {
    const coordinate = normalizeCoordinate(position);
    if (!coordinate) {
      return null;
    }
    coordinates.push(coordinate);
  }

  return coordinates;
}

function extractPolygonRings(geometry: GeoJSON.Geometry | null | undefined): Coordinate[][] | null {
  if (!geometry) {
    return null;
  }

  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates
      .map((ring) => normalizeRing(ring))
      .filter((ring): ring is Coordinate[] => ring !== null);
    return rings.length > 0 ? rings : null;
  }

  if (geometry.type === "MultiPolygon") {
    const rings = geometry.coordinates.flatMap((polygon) =>
      polygon
        .map((ring) => normalizeRing(ring))
        .filter((ring): ring is Coordinate[] => ring !== null),
    );
    return rings.length > 0 ? rings : null;
  }

  return null;
}

function computeCentroid(rings: Coordinate[][]): Coordinate {
  const points = rings.flat();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return [0, 0];
  }

  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function resolveFeatureId(feature: GeoJSON.Feature, index: number): string | number {
  if (feature.id != null) {
    return feature.id;
  }
  const propertyId = feature.properties?.id;
  if (typeof propertyId === "string" || typeof propertyId === "number") {
    return propertyId;
  }
  return `feature-${index + 1}`;
}

export function prepareSpatialDataset(
  featureCollection: GeoJSON.FeatureCollection,
  valueField: string,
): PreparedSpatialDataset {
  const preparedFeatures: GeoJSON.Feature[] = [];
  const spatialFeatures: SpatialFeature[] = [];
  const values: number[] = [];
  let skippedFeatureCount = 0;

  featureCollection.features.forEach((feature, index) => {
    const value = toFiniteNumber(feature.properties?.[valueField]);
    const rings = extractPolygonRings(feature.geometry);
    if (value == null || !rings || rings.length === 0) {
      skippedFeatureCount += 1;
      return;
    }

    const id = resolveFeatureId(feature, index);
    preparedFeatures.push(feature.id == null ? { ...feature, id } : feature);
    spatialFeatures.push({
      id,
      centroid: computeCentroid(rings),
      rings,
    });
    values.push(value);
  });

  return {
    featureCollection: {
      type: "FeatureCollection",
      features: preparedFeatures,
    },
    spatialFeatures,
    values: new Float64Array(values),
    validFeatureCount: preparedFeatures.length,
    skippedFeatureCount,
  };
}

function naturalTimeFieldSort(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

export function prepareSpatiotemporalDataset(
  featureCollection: GeoJSON.FeatureCollection,
  timeFields: string[],
): PreparedSpatiotemporalDataset {
  const orderedTimeFields = [...new Set(timeFields)].sort(naturalTimeFieldSort);
  const preparedFeatures: GeoJSON.Feature[] = [];
  const spatialFeatures: SpatialFeature[] = [];
  const valuesByField = orderedTimeFields.map(() => [] as number[]);
  let skippedFeatureCount = 0;

  featureCollection.features.forEach((feature, index) => {
    const rings = extractPolygonRings(feature.geometry);
    if (!rings || rings.length === 0) {
      skippedFeatureCount += 1;
      return;
    }

    const values = orderedTimeFields.map((field) => toFiniteNumber(feature.properties?.[field]));
    if (values.some((value) => value == null)) {
      skippedFeatureCount += 1;
      return;
    }

    const id = resolveFeatureId(feature, index);
    preparedFeatures.push(feature.id == null ? { ...feature, id } : feature);
    spatialFeatures.push({
      id,
      centroid: computeCentroid(rings),
      rings,
    });

    values.forEach((value, valueIndex) => {
      valuesByField[valueIndex]!.push(value as number);
    });
  });

  return {
    featureCollection: {
      type: "FeatureCollection",
      features: preparedFeatures,
    },
    spatialFeatures,
    timeSteps: orderedTimeFields.map((field, fieldIndex) => ({
      key: field,
      label: field,
      values: new Float64Array(valuesByField[fieldIndex]!),
    })),
    validFeatureCount: preparedFeatures.length,
    skippedFeatureCount,
  };
}

export function resolveSourceDataVersion(layer: OverlayLayerConfig): string | undefined {
  return layer.metadata?.dataVersion ?? layer.metadata?.updatedAt;
}

export function buildLisaLayerName(sourceLayer: OverlayLayerConfig, valueField: string): string {
  return `Local Moran's I - ${sourceLayer.name} - ${valueField}`;
}

export function buildHotSpotLayerName(sourceLayer: OverlayLayerConfig, valueField: string): string {
  return `Getis-Ord Gi* - ${sourceLayer.name} - ${valueField}`;
}

export function buildEmergingHotSpotLayerName(
  sourceLayer: OverlayLayerConfig,
  timeFields: string[],
): string {
  const suffix =
    timeFields.length <= 3
      ? timeFields.join(", ")
      : `${timeFields[0]}, ${timeFields[1]}, ...`;
  return `Emerging Hot Spots - ${sourceLayer.name} - ${suffix}`;
}

export function assertPreparedDataset(dataset: PreparedSpatialDataset, valueField: string): void {
  if (dataset.validFeatureCount < 3) {
    throw new RangeError(
      `At least 3 polygon features with numeric values in "${valueField}" are required to run this analysis.`,
    );
  }
}

export function assertPreparedSpatiotemporalDataset(
  dataset: PreparedSpatiotemporalDataset,
  timeFields: string[],
): void {
  if (timeFields.length < 3) {
    throw new RangeError("Select at least 3 numeric fields to build a temporal hot spot sequence.");
  }
  if (dataset.validFeatureCount < 3) {
    throw new RangeError(
      `At least 3 polygon features with complete numeric values across ${timeFields.length} time fields are required to run this analysis.`,
    );
  }
}

export function executeLisaSpatialStats(
  input: LisaSpatialStatsExecutionInput,
): LisaSpatialStatsExecutionResult {
  const dataset = prepareSpatialDataset(input.featureCollection, input.valueField);
  assertPreparedDataset(dataset, input.valueField);

  const weights = buildWeights(dataset.spatialFeatures, input.weightsMethod, {
    rowStandardize: true,
  });
  const result = localMoransI(dataset.values, weights, {
    permutations: input.permutations,
    alpha: input.alpha,
    correction: input.correction,
  });

  const sourceDataVersion = resolveSourceDataVersion(input.sourceLayer);

  return {
    adaptedResult: adaptLISAResult({
      featureCollection: dataset.featureCollection,
      result,
      significanceThreshold: input.significanceThreshold,
      layerName: input.layerName ?? buildLisaLayerName(input.sourceLayer, input.valueField),
      parameters: {
        alpha: input.alpha,
        correction: input.correction,
        permutations: input.permutations,
        rowStandardize: true,
        significanceThreshold: input.significanceThreshold,
        valueField: input.valueField,
        weightsMethod: input.weightsMethod,
      },
      sourceLayerIds: [input.sourceLayer.id],
      ...(input.layerId ? { layerId: input.layerId } : {}),
      ...(input.runId ? { runId: input.runId } : {}),
      ...(input.runTimestamp ? { runTimestamp: input.runTimestamp } : {}),
      ...(sourceDataVersion ? { sourceDataVersion } : {}),
    }),
    summary: result.summary,
    validFeatureCount: dataset.validFeatureCount,
    skippedFeatureCount: dataset.skippedFeatureCount,
  };
}

export function executeHotSpotSpatialStats(
  input: HotSpotSpatialStatsExecutionInput,
): HotSpotSpatialStatsExecutionResult {
  const dataset = prepareSpatialDataset(input.featureCollection, input.valueField);
  assertPreparedDataset(dataset, input.valueField);

  const weights = buildWeights(dataset.spatialFeatures, input.weightsMethod, {
    rowStandardize: true,
  });
  const result = giStar(dataset.values, weights, {
    selfWeight: input.selfWeight,
  });

  const sourceDataVersion = resolveSourceDataVersion(input.sourceLayer);

  return {
    adaptedResult: adaptHotSpotResult({
      featureCollection: dataset.featureCollection,
      result,
      significanceThreshold: input.significanceThreshold,
      layerName: input.layerName ?? buildHotSpotLayerName(input.sourceLayer, input.valueField),
      parameters: {
        rowStandardize: true,
        selfWeight: input.selfWeight,
        significanceThreshold: input.significanceThreshold,
        valueField: input.valueField,
        weightsMethod: input.weightsMethod,
      },
      sourceLayerIds: [input.sourceLayer.id],
      ...(input.layerId ? { layerId: input.layerId } : {}),
      ...(input.runId ? { runId: input.runId } : {}),
      ...(input.runTimestamp ? { runTimestamp: input.runTimestamp } : {}),
      ...(sourceDataVersion ? { sourceDataVersion } : {}),
    }),
    summary: result.summary,
    validFeatureCount: dataset.validFeatureCount,
    skippedFeatureCount: dataset.skippedFeatureCount,
  };
}

export function executeEmergingHotSpotSpatialStats(
  input: EmergingHotSpotSpatialStatsExecutionInput,
): EmergingHotSpotSpatialStatsExecutionResult {
  const dataset = prepareSpatiotemporalDataset(input.featureCollection, input.timeFields);
  assertPreparedSpatiotemporalDataset(dataset, input.timeFields);

  const weights = buildWeights(dataset.spatialFeatures, input.weightsMethod, {
    rowStandardize: true,
  });
  const result = analyseEmergingHotSpots(dataset.timeSteps, weights, {
    significanceThreshold: input.significanceThreshold,
    trendAlpha: input.significanceThreshold,
    selfWeight: input.selfWeight,
  });

  const sourceDataVersion = resolveSourceDataVersion(input.sourceLayer);

  return {
    adaptedResult: adaptEmergingHotSpotResult({
      featureCollection: dataset.featureCollection,
      result,
      significanceThreshold: input.significanceThreshold,
      layerName: input.layerName ?? buildEmergingHotSpotLayerName(input.sourceLayer, dataset.timeSteps.map((step) => step.key)),
      parameters: {
        rowStandardize: true,
        selfWeight: input.selfWeight,
        significanceThreshold: input.significanceThreshold,
        timeFields: dataset.timeSteps.map((step) => step.key),
        weightsMethod: input.weightsMethod,
      },
      sourceLayerIds: [input.sourceLayer.id],
      ...(input.layerId ? { layerId: input.layerId } : {}),
      ...(input.runId ? { runId: input.runId } : {}),
      ...(input.runTimestamp ? { runTimestamp: input.runTimestamp } : {}),
      ...(sourceDataVersion ? { sourceDataVersion } : {}),
    }),
    summary: result.summary,
    legend: result.legend,
    unclassifiedCount: result.unclassifiedCount,
    validFeatureCount: dataset.validFeatureCount,
    skippedFeatureCount: dataset.skippedFeatureCount,
    timeStepCount: result.timeStepCount,
  };
}
