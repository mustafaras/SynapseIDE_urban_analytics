import {
  type ClassificationMethod,
  type ClassificationResult,
  classifyNumericValues,
  findClassificationClassIndex,
} from "../../../utils/classification";
import { MAP_COLORS } from "./mapTokens";
import { buildFeatureIdentifier, toFiniteNumber } from "./symbologyUtils";

export interface SymbolLegendItem {
  index: number;
  min: number;
  max: number;
  label: string;
  radius: number;
  color: string;
  count: number;
}

export interface GraduatedSymbolResult {
  classifiedCollection: GeoJSON.FeatureCollection;
  classification: ClassificationResult;
  legend: SymbolLegendItem[];
}

export type GraduatedClassificationMethod = "equal-interval" | "quantile" | "natural-breaks";

export const SYMBOL_CLASS_FIELD = "__symbolClass";

export function computeProportionalRadius(
  value: number,
  minValue: number,
  maxValue: number,
  minRadius: number,
  maxRadius: number,
): number {
  if (!Number.isFinite(value)) return minRadius;
  if (minValue === maxValue) return (minRadius + maxRadius) / 2;
  return minRadius + ((value - minValue) / (maxValue - minValue)) * (maxRadius - minRadius);
}

export function buildProportionalRadiusExpression(
  field: string,
  minValue: number,
  maxValue: number,
  minRadius: number,
  maxRadius: number,
): unknown {
  if (minValue === maxValue) {
    return (minRadius + maxRadius) / 2;
  }

  return [
    "interpolate",
    ["linear"],
    ["to-number", ["get", field], minValue],
    minValue,
    minRadius,
    maxValue,
    maxRadius,
  ];
}

export function buildAttributeColorExpression(
  field: string,
  minValue: number,
  maxValue: number,
  colors: string[],
): unknown {
  if (minValue === maxValue) {
    return colors[colors.length - 1] ?? MAP_COLORS.interaction;
  }

  const expression: unknown[] = [
    "interpolate",
    ["linear"],
    ["to-number", ["get", field], minValue],
  ];

  colors.forEach((color, index) => {
    const value = minValue + ((maxValue - minValue) * index) / Math.max(colors.length - 1, 1);
    expression.push(value, color);
  });

  return expression;
}

export function buildGraduatedSizeStops(
  classCount: number,
  minRadius: number,
  maxRadius: number,
): number[] {
  if (classCount <= 1) return [maxRadius];
  return Array.from({ length: classCount }, (_, index) =>
    minRadius + ((maxRadius - minRadius) * index) / (classCount - 1),
  );
}

export function buildGraduatedSymbolCollection(
  collection: GeoJSON.FeatureCollection,
  valueField: string,
  method: GraduatedClassificationMethod,
  classCount: number,
  minRadius: number,
  maxRadius: number,
  colors: string[],
): GraduatedSymbolResult {
  const featureValues = collection.features.map((feature, index) => ({
    feature,
    index,
    numericValue: toFiniteNumber(feature.properties?.[valueField]),
  }));

  const validValues = featureValues
    .map((entry) => entry.numericValue)
    .filter((value): value is number => value != null);

  if (validValues.length === 0) {
    throw new Error("Selected value field does not contain numeric point values.");
  }

  const classification = classifyNumericValues(validValues, {
    method: method as ClassificationMethod,
    classCount,
  });
  const sizes = buildGraduatedSizeStops(classification.classCount, minRadius, maxRadius);

  const classifiedCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: featureValues.map(({ feature, index, numericValue }) => {
      const featureId = buildFeatureIdentifier(feature, index);
      const properties: Record<string, unknown> = {
        ...(feature.properties ?? {}),
      };

      if (numericValue != null) {
        properties[SYMBOL_CLASS_FIELD] = findClassificationClassIndex(numericValue, classification);
      } else {
        properties[SYMBOL_CLASS_FIELD] = -1;
      }

      return {
        ...feature,
        id: feature.id ?? featureId,
        properties: properties as GeoJSON.GeoJsonProperties,
      };
    }),
  };

  return {
    classifiedCollection,
    classification,
    legend: classification.classes.map((entry, index) => ({
      index,
      min: entry.min,
      max: entry.max,
      label: entry.label,
      radius: sizes[index] ?? maxRadius,
      color: colors[index] ?? colors[colors.length - 1] ?? MAP_COLORS.interaction,
      count: entry.count,
    })),
  };
}
