import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type {
  OverlayLayerConfig,
  OverlaySourceData,
} from "@/centerpanel/components/map/mapTypes";
import { buildFeatureIdentifier, toFiniteNumber } from "@/centerpanel/components/map/symbologyUtils";
import { getColorMatrix } from "@/engine/carto/BivariateChoropleth";

export const STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY = "advancedCartographySpec";
export const STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION = 1;

export type AdvancedCartographyMode =
  | "bivariate-choropleth"
  | "dot-density"
  | "proportional-symbol";

export interface AdvancedCartographyLegendEntry {
  id: string;
  label: string;
  color: string;
  kind: "bivariate" | "dot-density";
  field: string;
  secondaryField?: string;
  secondaryLabel?: string;
  min?: number;
  max?: number;
  count?: number;
  gridColumn?: number;
  gridRow?: number;
}

export interface SerializedAdvancedCartographySpec {
  version: typeof STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION;
  mode: AdvancedCartographyMode;
  layerId: string;
  layerName: string;
  updatedAt: string;
  valueField: string;
  secondaryField?: string;
  normalizationField?: string;
  valuePerDot?: number;
  dotColor?: string;
  dotRadius?: number;
  caveats: string[];
  thresholds?: {
    xBreak?: number;
    yBreak?: number;
  };
}

export interface BivariateRendererResult {
  spec: SerializedAdvancedCartographySpec;
  entries: AdvancedCartographyLegendEntry[];
  fillColorExpression: unknown[];
  caveats: string[];
}

export interface DotDensityRendererResult {
  spec: SerializedAdvancedCartographySpec;
  entries: AdvancedCartographyLegendEntry[];
  caveats: string[];
}

const EXISTING_BIVARIATE_MATRIX = getColorMatrix(4);
const BIVARIATE_COLORS = {
  lowLow: EXISTING_BIVARIATE_MATRIX[0]?.[0] ?? "rgb(228, 232, 225)",
  highLow: EXISTING_BIVARIATE_MATRIX[0]?.[3] ?? "rgb(118, 169, 213)",
  lowHigh: EXISTING_BIVARIATE_MATRIX[3]?.[0] ?? "rgb(222, 139, 118)",
  highHigh: EXISTING_BIVARIATE_MATRIX[3]?.[3] ?? "rgb(84, 81, 130)",
} as const;

export const DOT_DENSITY_DEFAULT_COLOR = "rgb(249, 115, 22)";
export const DOT_DENSITY_DEFAULT_RADIUS = 2.4;
export const DOT_DENSITY_DEFAULT_VALUE_PER_DOT = 500;
export const DOT_DENSITY_NORMALIZATION_CAVEAT =
  "Dot-density uses raw counts without an area-normalization field; compare density only after reviewing polygon area.";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sourceDataToFeatureCollection(sourceData: OverlaySourceData | undefined): FeatureCollection | null {
  if (!sourceData || typeof sourceData === "string") return null;
  if (sourceData.type === "FeatureCollection") return sourceData;
  if (sourceData.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [sourceData as Feature],
    };
  }
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: sourceData as Geometry,
    }],
  };
}

function percentile(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0]!;
  const index = Math.max(0, Math.min(1, p)) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower]!;
  const weight = index - lower;
  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

function fieldValues(collection: FeatureCollection | null, field: string): number[] {
  return (collection?.features ?? [])
    .map((feature) => toFiniteNumber(feature.properties?.[field]))
    .filter((value): value is number => value != null)
    .sort((left, right) => left - right);
}

function hasMissingNumericValue(feature: Feature, field: string): boolean {
  return toFiniteNumber(feature.properties?.[field]) == null;
}

function countBivariateCell(
  collection: FeatureCollection | null,
  xField: string,
  yField: string,
  xBreak: number,
  yBreak: number,
  xClass: "low" | "high",
  yClass: "low" | "high",
): number {
  return (collection?.features ?? []).filter((feature) => {
    const xValue = toFiniteNumber(feature.properties?.[xField]);
    const yValue = toFiniteNumber(feature.properties?.[yField]);
    if (xValue == null || yValue == null) return false;
    const xMatches = xClass === "low" ? xValue <= xBreak : xValue > xBreak;
    const yMatches = yClass === "low" ? yValue <= yBreak : yValue > yBreak;
    return xMatches && yMatches;
  }).length;
}

function uniqueCount(values: number[]): number {
  return new Set(values).size;
}

function expressionValue(field: string, fallback: number): unknown[] {
  return ["to-number", ["get", field], fallback];
}

export function buildBivariateChoroplethRenderer(params: {
  layer: OverlayLayerConfig;
  xField: string;
  yField: string;
  updatedAt: string;
}): BivariateRendererResult {
  const collection = sourceDataToFeatureCollection(params.layer.sourceData);
  const xValues = fieldValues(collection, params.xField);
  const yValues = fieldValues(collection, params.yField);
  const caveats: string[] = [];
  const xBreak = percentile(xValues, 0.5) ?? 0;
  const yBreak = percentile(yValues, 0.5) ?? 0;

  if (xValues.length === 0 || yValues.length === 0) {
    caveats.push(`Bivariate renderer needs numeric values in both "${params.xField}" and "${params.yField}".`);
  }
  if (uniqueCount(xValues) <= 1 || uniqueCount(yValues) <= 1) {
    caveats.push("Bivariate classes are based on a low-variation field; the 2D legend may overstate separation.");
  }
  const missingPairCount = (collection?.features ?? []).filter((feature) =>
    hasMissingNumericValue(feature, params.xField) || hasMissingNumericValue(feature, params.yField),
  ).length;
  if (missingPairCount > 0) {
    caveats.push(`${missingPairCount.toLocaleString()} feature${missingPairCount === 1 ? "" : "s"} cannot enter the bivariate grid because at least one field is missing.`);
  }

  const cells: Array<{
    suffix: string;
    xClass: "low" | "high";
    yClass: "low" | "high";
    color: string;
    gridColumn: number;
    gridRow: number;
  }> = [
    { suffix: "low-low", xClass: "low", yClass: "low", color: BIVARIATE_COLORS.lowLow, gridColumn: 1, gridRow: 2 },
    { suffix: "high-low", xClass: "high", yClass: "low", color: BIVARIATE_COLORS.highLow, gridColumn: 2, gridRow: 2 },
    { suffix: "low-high", xClass: "low", yClass: "high", color: BIVARIATE_COLORS.lowHigh, gridColumn: 1, gridRow: 1 },
    { suffix: "high-high", xClass: "high", yClass: "high", color: BIVARIATE_COLORS.highHigh, gridColumn: 2, gridRow: 1 },
  ];

  const entries = cells.map((cell): AdvancedCartographyLegendEntry => ({
    id: `${params.layer.id}-bivariate-${cell.suffix}`,
    label: `${cell.xClass === "low" ? "Low" : "High"} ${params.xField} / ${cell.yClass === "low" ? "Low" : "High"} ${params.yField}`,
    color: cell.color,
    kind: "bivariate",
    field: params.xField,
    secondaryField: params.yField,
    secondaryLabel: `${params.xField} x ${params.yField}`,
    count: countBivariateCell(collection, params.xField, params.yField, xBreak, yBreak, cell.xClass, cell.yClass),
    gridColumn: cell.gridColumn,
    gridRow: cell.gridRow,
  }));

  const xValue = expressionValue(params.xField, xBreak);
  const yValue = expressionValue(params.yField, yBreak);
  const fillColorExpression: unknown[] = [
    "case",
    ["all", ["<=", xValue, xBreak], ["<=", yValue, yBreak]],
    BIVARIATE_COLORS.lowLow,
    ["all", [">", xValue, xBreak], ["<=", yValue, yBreak]],
    BIVARIATE_COLORS.highLow,
    ["all", ["<=", xValue, xBreak], [">", yValue, yBreak]],
    BIVARIATE_COLORS.lowHigh,
    BIVARIATE_COLORS.highHigh,
  ];

  const spec: SerializedAdvancedCartographySpec = {
    version: STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION,
    mode: "bivariate-choropleth",
    layerId: params.layer.id,
    layerName: params.layer.name,
    updatedAt: params.updatedAt,
    valueField: params.xField,
    secondaryField: params.yField,
    caveats,
    thresholds: {
      xBreak,
      yBreak,
    },
  };

  return {
    spec,
    entries,
    fillColorExpression,
    caveats,
  };
}

export function buildDotDensityRenderer(params: {
  layer: OverlayLayerConfig;
  valueField: string;
  normalizationField?: string;
  valuePerDot?: number;
  dotColor?: string;
  dotRadius?: number;
  updatedAt: string;
}): DotDensityRendererResult {
  const collection = sourceDataToFeatureCollection(params.layer.sourceData);
  const values = fieldValues(collection, params.valueField);
  const valuePerDot = Math.max(1, Math.round(params.valuePerDot ?? DOT_DENSITY_DEFAULT_VALUE_PER_DOT));
  const dotColor = params.dotColor ?? DOT_DENSITY_DEFAULT_COLOR;
  const dotRadius = params.dotRadius ?? DOT_DENSITY_DEFAULT_RADIUS;
  const caveats: string[] = [];

  if (values.length === 0) {
    caveats.push(`Dot-density renderer needs numeric count values in "${params.valueField}".`);
  }
  if (!params.normalizationField) {
    caveats.push(DOT_DENSITY_NORMALIZATION_CAVEAT);
  }

  const spec: SerializedAdvancedCartographySpec = {
    version: STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION,
    mode: "dot-density",
    layerId: params.layer.id,
    layerName: params.layer.name,
    updatedAt: params.updatedAt,
    valueField: params.valueField,
    ...(params.normalizationField ? { normalizationField: params.normalizationField } : {}),
    valuePerDot,
    dotColor,
    dotRadius,
    caveats,
  };

  return {
    spec,
    caveats,
    entries: [{
      id: `${params.layer.id}-dot-density`,
      label: `1 dot = ${valuePerDot.toLocaleString()} ${params.valueField}`,
      color: dotColor,
      kind: "dot-density",
      field: params.valueField,
      ...(params.normalizationField ? { secondaryField: params.normalizationField } : {}),
      secondaryLabel: params.normalizationField
        ? `normalized by ${params.normalizationField}`
        : "raw counts",
      count: values.length,
    }],
  };
}

function collectPositions(geometry: Geometry | null | undefined, positions: Position[]): void {
  if (!geometry) return;
  switch (geometry.type) {
    case "Point":
      positions.push(geometry.coordinates);
      break;
    case "MultiPoint":
    case "LineString":
      positions.push(...geometry.coordinates);
      break;
    case "MultiLineString":
    case "Polygon":
      geometry.coordinates.forEach((ring) => positions.push(...ring));
      break;
    case "MultiPolygon":
      geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => positions.push(...ring)));
      break;
    case "GeometryCollection":
      geometry.geometries.forEach((entry) => collectPositions(entry, positions));
      break;
    default:
      break;
  }
}

function featureCenter(feature: Feature): [number, number] | null {
  const positions: Position[] = [];
  collectPositions(feature.geometry, positions);
  const valid = positions.filter((position): position is [number, number] =>
    typeof position[0] === "number" &&
    typeof position[1] === "number" &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1]),
  );
  if (valid.length === 0) return null;
  const xs = valid.map((position) => position[0]);
  const ys = valid.map((position) => position[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ];
}

function deterministicOffset(seed: number, dotIndex: number, maxOffset: number): [number, number] {
  const angle = ((seed * 37 + dotIndex * 97) % 360) * (Math.PI / 180);
  const ring = ((dotIndex % 5) + 1) / 5;
  return [
    Math.cos(angle) * maxOffset * ring,
    Math.sin(angle) * maxOffset * ring,
  ];
}

export function buildDotDensityFeatureCollection(
  layer: OverlayLayerConfig,
  spec: SerializedAdvancedCartographySpec,
): FeatureCollection {
  if (spec.mode !== "dot-density") {
    return { type: "FeatureCollection", features: [] };
  }

  const sourceCollection = sourceDataToFeatureCollection(layer.sourceData);
  const valuePerDot = Math.max(1, spec.valuePerDot ?? DOT_DENSITY_DEFAULT_VALUE_PER_DOT);
  const features: Feature[] = [];

  (sourceCollection?.features ?? []).forEach((feature, featureIndex) => {
    const value = toFiniteNumber(feature.properties?.[spec.valueField]);
    const center = featureCenter(feature);
    if (value == null || value <= 0 || !center) return;
    const dotCount = Math.max(1, Math.min(24, Math.round(value / valuePerDot)));
    const positions: Position[] = [];
    collectPositions(feature.geometry, positions);
    const valid = positions.filter((position): position is [number, number] =>
      typeof position[0] === "number" &&
      typeof position[1] === "number" &&
      Number.isFinite(position[0]) &&
      Number.isFinite(position[1]),
    );
    const xs = valid.map((position) => position[0]);
    const ys = valid.map((position) => position[1]);
    const maxOffset = Math.max(
      0.00005,
      Math.min(
        Math.max(...xs, center[0]) - Math.min(...xs, center[0]),
        Math.max(...ys, center[1]) - Math.min(...ys, center[1]),
      ) * 0.35,
    );
    const sourceId = buildFeatureIdentifier(feature, featureIndex);
    for (let dotIndex = 0; dotIndex < dotCount; dotIndex += 1) {
      const [dx, dy] = deterministicOffset(featureIndex + 1, dotIndex, maxOffset);
      features.push({
        type: "Feature",
        id: `${sourceId}-dot-${dotIndex + 1}`,
        properties: {
          sourceFeatureId: sourceId,
          dotIndex: dotIndex + 1,
          valueField: spec.valueField,
          valuePerDot,
        },
        geometry: {
          type: "Point",
          coordinates: [center[0] + dx, center[1] + dy],
        },
      });
    }
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

export function getSerializedAdvancedCartographySpecFromStyle(
  style: Record<string, unknown> | undefined,
): SerializedAdvancedCartographySpec | null {
  const candidate = style?.[STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY];
  if (!isObject(candidate)) return null;
  if (candidate.version !== STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION) return null;
  if (
    candidate.mode !== "bivariate-choropleth" &&
    candidate.mode !== "dot-density" &&
    candidate.mode !== "proportional-symbol"
  ) {
    return null;
  }
  if (typeof candidate.layerId !== "string" || typeof candidate.layerName !== "string") return null;
  if (typeof candidate.valueField !== "string" || !Array.isArray(candidate.caveats)) return null;
  return candidate as unknown as SerializedAdvancedCartographySpec;
}
