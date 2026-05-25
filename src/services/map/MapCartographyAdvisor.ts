import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  LayerCartographyReviewMetadata,
  LayerMetadata,
  OverlayLayerConfig,
  OverlaySourceData,
} from "@/centerpanel/components/map/mapTypes";
import {
  classifyNumericValues,
  type ClassificationMethod,
  type ClassificationResult,
} from "@/utils/classification";
import {
  getColorRampColors,
  getColorRampDefinition,
  type ColorRampName,
} from "@/utils/colorRamps";

export const MAP_CARTOGRAPHY_ADVISOR_VERSION = 1;
export const DEFAULT_CARTOGRAPHY_CLASS_COUNT = 5;
export const DENSE_POINT_FEATURE_THRESHOLD = 500;
export const DENSE_POINT_DEGREES_DENSITY_THRESHOLD = 2_000;
const CARTOGRAPHY_PREVIEW_FALLBACK_COLOR = "#3794FF";
const CARTOGRAPHY_PREVIEW_SECONDARY_COLOR = "#38BDF8";
const CARTOGRAPHY_HEATMAP_LEGEND_COLORS = ["#0F172A", "#1D4ED8", "#0891B2", "#14B8A6", "#A7F3D0"] as const;

export type MapCartographySeverity = "info" | "warning" | "error";

export type MapCartographyRecommendationType =
  | "classification-method"
  | "color-scheme"
  | "symbol-density"
  | "heatmap-parameters"
  | "label-readability"
  | "legend-completeness"
  | "uncertainty-metadata"
  | "accessibility-contrast";

export type MapCartographyDistributionShape =
  | "empty"
  | "constant"
  | "categorical-like"
  | "right-skewed"
  | "left-skewed"
  | "heavy-tailed"
  | "balanced";

export interface MapCartographyViewport {
  zoom?: number;
  bounds?: [number, number, number, number] | null;
}

export interface MapCartographyAdvisorOptions {
  viewport?: MapCartographyViewport;
  dismissedRecommendationIds?: ReadonlySet<string>;
  now?: Date;
}

export interface MapNumericDistribution {
  values: number[];
  count: number;
  uniqueCount: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  standardDeviation: number;
  skewness: number;
  zeroShare: number;
  outlierShare: number;
  shape: MapCartographyDistributionShape;
}

export interface MapCartographyLegendPreviewItem {
  label: string;
  color: string;
  secondaryLabel?: string;
}

export interface MapCartographyRecommendationPreview {
  beforeLegend: MapCartographyLegendPreviewItem[];
  afterLegend: MapCartographyLegendPreviewItem[];
  summary: string;
}

export interface MapCartographyStyleProposal {
  reversibleLabel: string;
  approvalRequired: true;
  layerPatch?: Partial<Pick<OverlayLayerConfig, "opacity">>;
  stylePatch?: Record<string, unknown>;
  metadataPatch?: Partial<LayerMetadata>;
  beforeStyle: Record<string, unknown>;
  afterStyle: Record<string, unknown>;
  beforeMetadata?: LayerMetadata;
  afterMetadata?: LayerMetadata;
}

export interface MapCartographyRecommendation {
  id: string;
  type: MapCartographyRecommendationType;
  severity: MapCartographySeverity;
  layerId: string;
  layerName: string;
  title: string;
  rationale: string;
  suggestedFix: string;
  detailUrl: string;
  field?: string;
  proposal?: MapCartographyStyleProposal;
  preview: MapCartographyRecommendationPreview;
}

export interface MapCartographyReviewState {
  status: "passed" | "needs-review";
  reviewedAt: string;
  recommendations: MapCartographyRecommendation[];
  metadata: {
    generatedBy: "MapCartographyAdvisor";
    version: number;
    visibleLayerCount: number;
    recommendationCounts: Record<MapCartographySeverity, number>;
    signature: string;
  };
}

interface NumericFieldSummary {
  field: string;
  numericCount: number;
  distribution: MapNumericDistribution;
}

interface ColorSchemeFinding {
  code: string;
  severity: MapCartographySeverity;
  title: string;
  rationale: string;
  suggestedFix: string;
  suggestedRamp: ColorRampName;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56) || "layer";
}

function nowIso(options?: MapCartographyAdvisorOptions): string {
  return (options?.now ?? new Date()).toISOString();
}

function sourceDataToFeatureCollection(sourceData: OverlaySourceData | undefined): FeatureCollection | null {
  if (!sourceData || typeof sourceData === "string") {
    return null;
  }

  if (sourceData.type === "FeatureCollection") {
    return sourceData;
  }

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

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return Number.NaN;
  if (sortedValues.length === 1) return sortedValues[0]!;
  const clamped = Math.max(0, Math.min(1, p));
  const index = clamped * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower]!;
  const weight = index - lower;
  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

export function collectNumericDistribution(inputValues: unknown[]): MapNumericDistribution {
  const values = inputValues
    .map(finiteNumber)
    .filter((value): value is number => value != null)
    .sort((left, right) => left - right);

  if (values.length === 0) {
    return {
      values: [],
      count: 0,
      uniqueCount: 0,
      min: Number.NaN,
      max: Number.NaN,
      mean: Number.NaN,
      median: Number.NaN,
      q1: Number.NaN,
      q3: Number.NaN,
      standardDeviation: Number.NaN,
      skewness: 0,
      zeroShare: 0,
      outlierShare: 0,
      shape: "empty",
    };
  }

  const count = values.length;
  const min = values[0]!;
  const max = values[count - 1]!;
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const median = percentile(values, 0.5);
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
  const standardDeviation = Math.sqrt(variance);
  const uniqueCount = new Set(values).size;
  const zeroShare = values.filter((value) => value === 0).length / count;
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outlierShare = iqr === 0
    ? 0
    : values.filter((value) => value < lowerFence || value > upperFence).length / count;
  const skewness = standardDeviation === 0
    ? 0
    : values.reduce((sum, value) => sum + ((value - mean) / standardDeviation) ** 3, 0) / count;

  let shape: MapCartographyDistributionShape = "balanced";
  if (uniqueCount <= 1) {
    shape = "constant";
  } else if (uniqueCount <= Math.min(7, Math.max(3, Math.ceil(count * 0.15)))) {
    shape = "categorical-like";
  } else if (outlierShare >= 0.06) {
    shape = "heavy-tailed";
  } else if (skewness >= 0.9) {
    shape = "right-skewed";
  } else if (skewness <= -0.9) {
    shape = "left-skewed";
  }

  return {
    values,
    count,
    uniqueCount,
    min,
    max,
    mean,
    median,
    q1,
    q3,
    standardDeviation,
    skewness,
    zeroShare,
    outlierShare,
    shape,
  };
}

export function suggestClassificationMethod(distribution: MapNumericDistribution): {
  method: ClassificationMethod;
  reason: string;
} {
  switch (distribution.shape) {
    case "empty":
    case "constant":
      return {
        method: "manual",
        reason: "Values do not provide enough numeric spread for automatic classes.",
      };
    case "categorical-like":
      return {
        method: "manual",
        reason: "The field has few repeated numeric values, so analyst-defined breaks preserve class meaning.",
      };
    case "right-skewed":
    case "left-skewed":
    case "heavy-tailed":
      return {
        method: "quantile",
        reason: "Skewed or heavy-tailed values need balanced class counts so sparse extremes do not dominate the map.",
      };
    default:
      return {
        method: "natural-breaks",
        reason: "Balanced numeric values can use natural breaks to keep similar values together.",
      };
  }
}

function collectNumericFields(collection: FeatureCollection): NumericFieldSummary[] {
  const fieldValues = new Map<string, unknown[]>();
  const fieldNonEmptyCounts = new Map<string, number>();

  for (const feature of collection.features) {
    const properties = feature.properties ?? {};
    for (const [field, rawValue] of Object.entries(properties)) {
      if (rawValue == null || (typeof rawValue === "string" && rawValue.trim() === "")) {
        continue;
      }
      fieldNonEmptyCounts.set(field, (fieldNonEmptyCounts.get(field) ?? 0) + 1);
      const current = fieldValues.get(field) ?? [];
      current.push(rawValue);
      fieldValues.set(field, current);
    }
  }

  return [...fieldValues.entries()]
    .map(([field, values]) => ({
      field,
      numericCount: values.map(finiteNumber).filter((value): value is number => value != null).length,
      distribution: collectNumericDistribution(values),
      nonEmptyCount: fieldNonEmptyCounts.get(field) ?? 0,
    }))
    .filter((entry) => entry.numericCount > 0 && entry.numericCount / Math.max(1, entry.nonEmptyCount) >= 0.7)
    .sort((left, right) => right.numericCount - left.numericCount || left.field.localeCompare(right.field))
    .map(({ field, numericCount, distribution }) => ({ field, numericCount, distribution }));
}

function resolveGeometryType(layer: OverlayLayerConfig, collection: FeatureCollection | null): string {
  const metadataType = layer.metadata?.geometryType;
  if (metadataType) return metadataType;
  const firstGeometry = collection?.features.find((feature) => feature.geometry)?.geometry;
  return firstGeometry?.type ?? "unknown";
}

function geometryFamily(geometryType: string): "point" | "line" | "polygon" | "mixed" | "unknown" {
  const normalized = geometryType.toLowerCase();
  if (normalized.includes("point")) return "point";
  if (normalized.includes("line")) return "line";
  if (normalized.includes("polygon")) return "polygon";
  if (normalized.includes("mixed") || normalized.includes("collection")) return "mixed";
  return "unknown";
}

function colorFromUnknown(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed) || /^rgba?\(/i.test(trimmed)) return trimmed;
  return null;
}

function collectColors(value: unknown, colors: string[] = []): string[] {
  const direct = colorFromUnknown(value);
  if (direct) {
    colors.push(direct);
    return colors;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectColors(entry, colors));
    return colors;
  }

  if (isObject(value)) {
    Object.values(value).forEach((entry) => collectColors(entry, colors));
  }

  return colors;
}

function colorsFromStyle(style: Record<string, unknown> | undefined): string[] {
  const colors = new Set<string>();
  const explicitLegend = style?.legendEntries ?? style?.legend ?? style?.classes;
  if (Array.isArray(explicitLegend)) {
    explicitLegend.forEach((entry) => {
      if (!isObject(entry)) return;
      collectColors(entry.color ?? entry.fill ?? entry.fillColor ?? entry.stroke).forEach((color) => colors.add(color));
    });
  }

  [
    "fill-color",
    "line-color",
    "circle-color",
    "heatmap-color",
    "color",
    "fillColor",
    "lineColor",
    "circleColor",
  ].forEach((key) => {
    collectColors(style?.[key]).forEach((color) => colors.add(color));
  });

  return [...colors];
}

function parseHexColor(color: string): [number, number, number] | null {
  const trimmed = color.trim();
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const value = hex[1]!;
    const normalized = value.length === 3
      ? value.split("").map((part) => `${part}${part}`).join("")
      : value.slice(0, 6);
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  }

  const rgb = trimmed.match(/^rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/i);
  if (!rgb) return null;
  return [
    Math.max(0, Math.min(255, Number(rgb[1]))),
    Math.max(0, Math.min(255, Number(rgb[2]))),
    Math.max(0, Math.min(255, Number(rgb[3]))),
  ];
}

function relativeLuminance(color: string): number | null {
  const rgb = parseHexColor(color);
  if (!rgb) return null;
  const [red, green, blue] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(color: string, background = "#0D0D0D"): number {
  const foreground = relativeLuminance(color);
  const bg = relativeLuminance(background);
  if (foreground == null || bg == null) return 21;
  const lighter = Math.max(foreground, bg);
  const darker = Math.min(foreground, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function hueDegrees(color: string): number | null {
  const rgb = parseHexColor(color);
  if (!rgb) return null;
  const [red, green, blue] = rgb.map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) % 6;
  if (max === green) hue = (blue - red) / delta + 2;
  if (max === blue) hue = (red - green) / delta + 4;
  return (hue * 60 + 360) % 360;
}

function hasRedGreenConflict(colors: string[]): boolean {
  const hues = colors
    .map(hueDegrees)
    .filter((value): value is number => value != null);
  const hasRed = hues.some((hue) => hue <= 25 || hue >= 340);
  const hasGreen = hues.some((hue) => hue >= 80 && hue <= 155);
  return hasRed && hasGreen;
}

function hasOrderedLuminance(colors: string[]): boolean {
  const luminance = colors
    .map(relativeLuminance)
    .filter((value): value is number => value != null);
  if (luminance.length < 3) return true;
  const deltas = luminance.slice(1).map((value, index) => value - luminance[index]!);
  const positive = deltas.filter((value) => value > 0.02).length;
  const negative = deltas.filter((value) => value < -0.02).length;
  return positive === 0 || negative === 0;
}

export function evaluateColorScheme(params: {
  colors: string[];
  numericFieldName?: string;
  distribution?: MapNumericDistribution;
  geometryType?: string;
}): ColorSchemeFinding[] {
  const colors = [...new Set(params.colors)];
  if (colors.length === 0) return [];

  const findings: ColorSchemeFinding[] = [];
  const normalizedField = params.numericFieldName?.toLowerCase() ?? "";
  const crossesZero =
    params.distribution != null &&
    Number.isFinite(params.distribution.min) &&
    Number.isFinite(params.distribution.max) &&
    params.distribution.min < 0 &&
    params.distribution.max > 0;

  if (hasRedGreenConflict(colors)) {
    findings.push({
      code: "red_green_conflict",
      severity: "warning",
      title: "Red/green color pairing can be ambiguous",
      rationale: "The current palette uses red and green together; that combination is unreliable for common color-vision deficiencies and for photocopied reports.",
      suggestedFix: "Use a color-blind safer diverging or sequential ramp before publishing the map.",
      suggestedRamp: crossesZero ? "PuOr" : "Blues",
    });
  }

  if (colors.length >= 3 && !hasOrderedLuminance(colors) && !crossesZero) {
    findings.push({
      code: "non_monotonic_luminance",
      severity: "warning",
      title: "Ordered values do not have ordered lightness",
      rationale: "Sequential thematic maps should move steadily from light to dark so users read magnitude correctly.",
      suggestedFix: "Switch to a monotonic sequential ramp for numeric classes.",
      suggestedRamp: normalizedField.includes("risk") || normalizedField.includes("hot") ? "YlOrRd" : "Blues",
    });
  }

  const lowContrastColors = colors.filter((color) => contrastRatio(color) < 3);
  if (lowContrastColors.length > 0) {
    findings.push({
      code: "low_contrast",
      severity: "warning",
      title: "Some symbols have low contrast on the dark basemap",
      rationale: "Low-contrast colors reduce feature detectability and can disappear in exported images.",
      suggestedFix: "Use a brighter accessible ramp or add a high-contrast outline/halo.",
      suggestedRamp: crossesZero ? "RdBu" : "YlOrRd",
    });
  }

  if (crossesZero && colors.length >= 3) {
    const definition = getColorRampDefinition("RdBu");
    findings.push({
      code: "zero_centered_diverging",
      severity: "info",
      title: "Zero-centered values benefit from a diverging ramp",
      rationale: `The field crosses zero, so a ${definition.category} ramp makes negative and positive values visually explicit.`,
      suggestedFix: "Use a diverging ramp centered around zero.",
      suggestedRamp: "RdBu",
    });
  }

  return findings;
}

function existingLegend(layer: OverlayLayerConfig): MapCartographyLegendPreviewItem[] {
  const style = layer.style ?? {};
  const explicit = style.legendEntries ?? style.legend ?? style.classes;
  if (Array.isArray(explicit)) {
    return explicit
      .map((entry, index): MapCartographyLegendPreviewItem | null => {
        if (!isObject(entry)) return null;
        const color = colorFromUnknown(entry.color ?? entry.fill ?? entry.fillColor ?? entry.stroke) ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR;
        const label = typeof entry.label === "string"
          ? entry.label
          : typeof entry.name === "string"
            ? entry.name
            : typeof entry.range === "string"
              ? entry.range
              : `Class ${index + 1}`;
        return { label, color, secondaryLabel: layer.name };
      })
      .filter((entry): entry is MapCartographyLegendPreviewItem => entry != null);
  }

  const analysisLegend = layer.metadata?.analysisResult?.visualization.legendEntries;
  if (Array.isArray(analysisLegend)) {
    return analysisLegend.map((entry, index) => ({
      label: entry.label || `Class ${index + 1}`,
      color: colorFromUnknown(entry.color) ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR,
      secondaryLabel: layer.name,
    }));
  }

  const colors = colorsFromStyle(style);
  if (colors.length > 0) {
    return colors.slice(0, 7).map((color, index) => ({
      label: index === 0 ? layer.name : `${layer.name} ${index + 1}`,
      color,
      secondaryLabel: "Current style",
    }));
  }

  return [{
    label: layer.name,
    color: CARTOGRAPHY_PREVIEW_FALLBACK_COLOR,
    secondaryLabel: layer.metadata?.geometryType ?? layer.type,
  }];
}

function buildClassificationLegend(
  field: string,
  distribution: MapNumericDistribution,
  method: ClassificationMethod,
  colors: string[],
): {
  legend: MapCartographyLegendPreviewItem[];
  classification: ClassificationResult | null;
} {
  if (distribution.values.length === 0) {
    return { legend: [], classification: null };
  }

  const classCount = Math.min(DEFAULT_CARTOGRAPHY_CLASS_COUNT, Math.max(2, distribution.uniqueCount));
  const effectiveMethod = method === "manual" ? "equal-interval" : method;
  const classification = classifyNumericValues(distribution.values, {
    method: effectiveMethod,
    classCount,
  });

  return {
    classification,
    legend: classification.classes.map((entry, index) => ({
      label: entry.label,
      color: colors[index] ?? colors[colors.length - 1] ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR,
      secondaryLabel: `${field} / ${effectiveMethod}`,
    })),
  };
}

function buildStepExpression(
  field: string,
  classification: ClassificationResult,
  colors: string[],
): unknown[] {
  const expression: unknown[] = [
    "step",
    ["to-number", ["get", field], classification.min],
    colors[0] ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR,
  ];

  classification.classes.slice(0, -1).forEach((entry, index) => {
    expression.push(entry.max, colors[index + 1] ?? colors[colors.length - 1] ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR);
  });

  return expression;
}

function paintColorKey(layer: OverlayLayerConfig, geometryType: string): "fill-color" | "line-color" | "circle-color" {
  const family = geometryFamily(geometryType);
  if (family === "line") return "line-color";
  if (family === "point" || layer.type === "heatmap") return "circle-color";
  return "fill-color";
}

function styleWithPatch(layer: OverlayLayerConfig, patch: Record<string, unknown>): Record<string, unknown> {
  return {
    ...(layer.style ?? {}),
    ...patch,
  };
}

function metadataWithPatch(layer: OverlayLayerConfig, patch: Partial<LayerMetadata>): LayerMetadata {
  return {
    ...(layer.metadata ?? {}),
    ...patch,
  };
}

function buildProposal(params: {
  layer: OverlayLayerConfig;
  title: string;
  stylePatch?: Record<string, unknown>;
  layerPatch?: Partial<Pick<OverlayLayerConfig, "opacity">>;
  metadataPatch?: Partial<LayerMetadata>;
}): MapCartographyStyleProposal {
  const stylePatch = params.stylePatch ?? {};
  const metadataPatch = params.metadataPatch ?? {};
  return {
    reversibleLabel: params.title,
    approvalRequired: true,
    ...(Object.keys(stylePatch).length > 0 ? { stylePatch } : {}),
    ...(params.layerPatch ? { layerPatch: params.layerPatch } : {}),
    ...(Object.keys(metadataPatch).length > 0 ? { metadataPatch } : {}),
    beforeStyle: { ...(params.layer.style ?? {}) },
    afterStyle: styleWithPatch(params.layer, stylePatch),
    ...(params.layer.metadata ? { beforeMetadata: params.layer.metadata } : {}),
    afterMetadata: metadataWithPatch(params.layer, metadataPatch),
  };
}

function recommendationId(layer: OverlayLayerConfig, type: MapCartographyRecommendationType, suffix = ""): string {
  return [
    "cartography",
    sanitizeIdPart(layer.id),
    type,
    suffix ? sanitizeIdPart(suffix) : null,
  ].filter(Boolean).join("-");
}

function layerReviewMetadata(
  layer: OverlayLayerConfig,
  recommendation: Pick<MapCartographyRecommendation, "id" | "title">,
  reviewedAt: string,
  persistedLegend: boolean,
): LayerCartographyReviewMetadata {
  const previous = layer.metadata?.cartographyReview;
  return {
    status: "reviewed",
    reviewedAt,
    recommendationIds: Array.from(new Set([...(previous?.recommendationIds ?? []), recommendation.id])),
    appliedRecommendationIds: Array.from(new Set([...(previous?.appliedRecommendationIds ?? []), recommendation.id])),
    dismissedRecommendationIds: previous?.dismissedRecommendationIds ?? [],
    lastAppliedTitle: recommendation.title,
    legendPersisted: persistedLegend,
  };
}

function isApplied(layer: OverlayLayerConfig, recommendationIdValue: string): boolean {
  return layer.metadata?.cartographyReview?.appliedRecommendationIds.includes(recommendationIdValue) === true;
}

function isThematicLayer(layer: OverlayLayerConfig, numericFields: NumericFieldSummary[]): boolean {
  return numericFields.length > 0 || layer.type === "heatmap" || Boolean(layer.metadata?.analysisResult?.visualization);
}

function boundsAreaDegrees(bounds: [number, number, number, number] | undefined): number {
  if (!bounds) return 0;
  const width = Math.max(0, bounds[2] - bounds[0]);
  const height = Math.max(0, bounds[3] - bounds[1]);
  return width * height;
}

function createClassificationRecommendation(
  layer: OverlayLayerConfig,
  geometryType: string,
  numericField: NumericFieldSummary,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  const suggestion = suggestClassificationMethod(numericField.distribution);
  if (suggestion.method === "manual") {
    return null;
  }

  const style = layer.style ?? {};
  const visualizationRecord = layer.metadata?.analysisResult?.visualization as Record<string, unknown> | undefined;
  const currentMethod =
    typeof style.classificationMethod === "string"
      ? style.classificationMethod
      : typeof visualizationRecord?.method === "string"
        ? visualizationRecord.method
        : undefined;
  if (currentMethod === suggestion.method) {
    return null;
  }

  const id = recommendationId(layer, "classification-method", `${numericField.field}-${suggestion.method}`);
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  const colors = getColorRampColors("YlOrRd", DEFAULT_CARTOGRAPHY_CLASS_COUNT);
  const { legend, classification } = buildClassificationLegend(
    numericField.field,
    numericField.distribution,
    suggestion.method,
    colors,
  );
  if (!classification) return null;

  const colorKey = paintColorKey(layer, geometryType);
  const stylePatch: Record<string, unknown> = {
    [colorKey]: buildStepExpression(numericField.field, classification, colors),
    classificationMethod: suggestion.method,
    classificationField: numericField.field,
    legendEntries: legend.map((entry) => ({
      label: entry.label,
      color: entry.color,
      field: numericField.field,
      method: suggestion.method,
    })),
  };

  return {
    id,
    type: "classification-method",
    severity: "warning",
    layerId: layer.id,
    layerName: layer.name,
    field: numericField.field,
    title: `Use ${suggestion.method} classes for ${numericField.field}`,
    rationale: `${suggestion.reason} Distribution: ${numericField.distribution.shape}, skewness ${numericField.distribution.skewness.toFixed(2)}, outliers ${(numericField.distribution.outlierShare * 100).toFixed(1)}%.`,
    suggestedFix: "Preview the proposed classes, then apply only if the legend reflects the analytical story.",
    detailUrl: "#cartography-classification-methods",
    preview: {
      beforeLegend: existingLegend(layer),
      afterLegend: legend,
      summary: `Classifies ${numericField.distribution.count.toLocaleString()} numeric values into ${classification.classCount} classes.`,
    },
    proposal: buildProposal({
      layer,
      title: `Apply ${suggestion.method} classification to ${layer.name}`,
      stylePatch,
      metadataPatch: {
        cartographyReview: layerReviewMetadata(layer, { id, title: `Use ${suggestion.method} classes` }, nowIso(options), true),
      },
    }),
  };
}

function createColorRecommendation(
  layer: OverlayLayerConfig,
  geometryType: string,
  numericField: NumericFieldSummary | null,
  finding: ColorSchemeFinding,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  const suffix = `${finding.code}-${numericField?.field ?? "style"}`;
  const id = recommendationId(layer, finding.code === "low_contrast" ? "accessibility-contrast" : "color-scheme", suffix);
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  const colors = getColorRampColors(finding.suggestedRamp, DEFAULT_CARTOGRAPHY_CLASS_COUNT);
  const colorKey = paintColorKey(layer, geometryType);
  let legend: MapCartographyLegendPreviewItem[] = colors.map((color, index) => ({
    label: `${finding.suggestedRamp} ${index + 1}`,
    color,
    secondaryLabel: "Accessible ramp",
  }));
  const stylePatch: Record<string, unknown> = {};

  if (numericField) {
    const { legend: classificationLegend, classification } = buildClassificationLegend(
      numericField.field,
      numericField.distribution,
      suggestClassificationMethod(numericField.distribution).method,
      colors,
    );
    if (classification) {
      legend = classificationLegend;
      stylePatch[colorKey] = buildStepExpression(numericField.field, classification, colors);
    } else {
      stylePatch[colorKey] = colors[colors.length - 1] ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR;
    }
  } else {
    stylePatch[colorKey] = colors[colors.length - 1] ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR;
  }

  stylePatch.legendEntries = legend.map((entry) => ({
    label: entry.label,
    color: entry.color,
    ramp: finding.suggestedRamp,
  }));

  return {
    id,
    type: finding.code === "low_contrast" ? "accessibility-contrast" : "color-scheme",
    severity: finding.severity,
    layerId: layer.id,
    layerName: layer.name,
    ...(numericField?.field ? { field: numericField.field } : {}),
    title: finding.title,
    rationale: finding.rationale,
    suggestedFix: finding.suggestedFix,
    detailUrl: "#cartography-accessible-color",
    preview: {
      beforeLegend: existingLegend(layer),
      afterLegend: legend,
      summary: `Suggested ramp: ${finding.suggestedRamp}.`,
    },
    proposal: buildProposal({
      layer,
      title: `Apply ${finding.suggestedRamp} ramp to ${layer.name}`,
      stylePatch,
      metadataPatch: {
        cartographyReview: layerReviewMetadata(layer, { id, title: finding.title }, nowIso(options), true),
      },
    }),
  };
}

function createSymbolDensityRecommendation(
  layer: OverlayLayerConfig,
  collection: FeatureCollection | null,
  viewport?: MapCartographyViewport,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  const featureCount = collection?.features.length ?? layer.metadata?.featureCount ?? 0;
  const area = boundsAreaDegrees(layer.metadata?.bounds ?? viewport?.bounds ?? undefined);
  const density = area > 0 ? featureCount / area : featureCount;
  const zoom = viewport?.zoom ?? 12;
  const dense =
    featureCount >= DENSE_POINT_FEATURE_THRESHOLD ||
    density >= DENSE_POINT_DEGREES_DENSITY_THRESHOLD ||
    (featureCount >= 200 && zoom < 11);
  if (!dense) return null;

  const id = recommendationId(layer, "symbol-density", `${featureCount}-${Math.round(density)}`);
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  const radius = featureCount > 2_000 || zoom < 10 ? 3 : 4;
  const opacity = featureCount > 2_000 ? 0.46 : 0.58;
  const before = existingLegend(layer);
  const after = [{
    label: `${radius}px points / ${Math.round(opacity * 100)}% opacity`,
    color: colorFromUnknown(layer.style?.["circle-color"] ?? layer.style?.circleColor) ?? CARTOGRAPHY_PREVIEW_FALLBACK_COLOR,
    secondaryLabel: "Dense point style",
  }];

  return {
    id,
    type: "symbol-density",
    severity: "warning",
    layerId: layer.id,
    layerName: layer.name,
    title: "Point symbols are too dense for the current scale",
    rationale: `${featureCount.toLocaleString()} point features are visible at zoom ${zoom.toFixed(1)}. Large opaque symbols can hide local clusters and exaggerate overlap.`,
    suggestedFix: "Use smaller symbols and lower opacity, or switch to heatmap/cluster mode for overview zoom levels.",
    detailUrl: "#cartography-point-density",
    preview: {
      beforeLegend: before,
      afterLegend: after,
      summary: `Density estimate: ${Math.round(density).toLocaleString()} points per square degree.`,
    },
    proposal: buildProposal({
      layer,
      title: `Reduce dense point styling for ${layer.name}`,
      layerPatch: { opacity },
      stylePatch: {
        "circle-radius": radius,
        "circle-stroke-width": 0.6,
        "circle-stroke-color": "rgba(17,24,39,0.72)",
        legendEntries: after.map((entry) => ({ label: entry.label, color: entry.color })),
      },
      metadataPatch: {
        cartographyReview: layerReviewMetadata(layer, { id, title: "Point density adjusted" }, nowIso(options), true),
      },
    }),
  };
}

function createHeatmapRecommendation(
  layer: OverlayLayerConfig,
  collection: FeatureCollection | null,
  viewport?: MapCartographyViewport,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  if (layer.type !== "heatmap") return null;
  const featureCount = collection?.features.length ?? layer.metadata?.featureCount ?? 0;
  const zoom = viewport?.zoom ?? 11;
  const recommendedRadius = Math.max(10, Math.min(36, Math.round(30 - zoom + Math.log10(Math.max(10, featureCount)) * 4)));
  const recommendedIntensity = Math.max(0.65, Math.min(1.65, Number((0.8 + Math.log10(Math.max(10, featureCount)) * 0.12).toFixed(2))));
  const currentRadius = typeof layer.style?.["heatmap-radius"] === "number" ? layer.style["heatmap-radius"] : null;
  const currentIntensity = typeof layer.style?.["heatmap-intensity"] === "number" ? layer.style["heatmap-intensity"] : null;
  if (currentRadius === recommendedRadius && currentIntensity === recommendedIntensity) return null;

  const id = recommendationId(layer, "heatmap-parameters", `${recommendedRadius}-${recommendedIntensity}`);
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  const after = [
    { label: `Radius ${recommendedRadius}px`, color: "#22C55E", secondaryLabel: "Heatmap scale" },
    { label: `Intensity ${recommendedIntensity}`, color: CARTOGRAPHY_PREVIEW_SECONDARY_COLOR, secondaryLabel: "Heatmap scale" },
  ];

  return {
    id,
    type: "heatmap-parameters",
    severity: "info",
    layerId: layer.id,
    layerName: layer.name,
    title: "Tune heatmap radius and intensity for visible density",
    rationale: `${featureCount.toLocaleString()} points at zoom ${zoom.toFixed(1)} need a radius that preserves clusters without merging the full surface.`,
    suggestedFix: "Apply the proposed radius and intensity, then inspect the result at nearby zoom levels.",
    detailUrl: "#cartography-heatmap-density",
    preview: {
      beforeLegend: existingLegend(layer),
      afterLegend: after,
      summary: "Radius is tied to zoom and point count; intensity is bounded to avoid saturated surfaces.",
    },
    proposal: buildProposal({
      layer,
      title: `Tune heatmap style for ${layer.name}`,
      stylePatch: {
        "heatmap-radius": recommendedRadius,
        "heatmap-intensity": recommendedIntensity,
        legendEntries: after.map((entry) => ({ label: entry.label, color: entry.color })),
      },
      metadataPatch: {
        cartographyReview: layerReviewMetadata(layer, { id, title: "Heatmap parameters tuned" }, nowIso(options), true),
      },
    }),
  };
}

function createLabelRecommendation(
  layer: OverlayLayerConfig,
  collection: FeatureCollection | null,
  viewport?: MapCartographyViewport,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  const labelField = typeof layer.style?.__labelField === "string" ? layer.style.__labelField : null;
  if (!labelField) return null;
  const featureCount = collection?.features.length ?? layer.metadata?.featureCount ?? 0;
  const zoom = viewport?.zoom ?? 12;
  if (featureCount < 120 && zoom >= 12) return null;

  const id = recommendationId(layer, "label-readability", labelField);
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  return {
    id,
    type: "label-readability",
    severity: "warning",
    layerId: layer.id,
    layerName: layer.name,
    field: labelField,
    title: "Labels may collide at the current scale",
    rationale: `${featureCount.toLocaleString()} labeled features are visible at zoom ${zoom.toFixed(1)}. Always-on labels reduce map readability when features are crowded.`,
    suggestedFix: "Use placement-aware labels, a smaller label size, and stronger halo for dense views.",
    detailUrl: "#cartography-label-placement",
    preview: {
      beforeLegend: existingLegend(layer),
      afterLegend: [{
        label: `${labelField} labels, placement-aware`,
        color: "#F9FAFB",
        secondaryLabel: "Label readability",
      }],
      summary: "The map keeps labels inspectable without forcing overlap.",
    },
    proposal: buildProposal({
      layer,
      title: `Improve label readability for ${layer.name}`,
      stylePatch: {
        __labelSize: 10,
        __labelHaloWidth: 1.6,
        __labelHaloColor: "rgba(17,24,39,0.95)",
        __labelAllowOverlap: false,
        __labelIgnorePlacement: false,
      },
      metadataPatch: {
        cartographyReview: layerReviewMetadata(layer, { id, title: "Label readability improved" }, nowIso(options), false),
      },
    }),
  };
}

function createLegendRecommendation(
  layer: OverlayLayerConfig,
  numericField: NumericFieldSummary | null,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  if (!numericField && layer.type !== "heatmap") return null;
  const hasStyleLegend = Array.isArray(layer.style?.legendEntries) || Array.isArray(layer.style?.legend) || Array.isArray(layer.style?.classes);
  const hasAnalysisLegend = (layer.metadata?.analysisResult?.visualization.legendEntries?.length ?? 0) > 0;
  if (hasStyleLegend || hasAnalysisLegend) return null;

  const id = recommendationId(layer, "legend-completeness", numericField?.field ?? "heatmap");
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  const colors = layer.type === "heatmap"
    ? CARTOGRAPHY_HEATMAP_LEGEND_COLORS
    : getColorRampColors("YlOrRd", DEFAULT_CARTOGRAPHY_CLASS_COUNT);
  const legend = numericField
    ? buildClassificationLegend(
      numericField.field,
      numericField.distribution,
      suggestClassificationMethod(numericField.distribution).method,
      colors,
    ).legend
    : colors.map((color, index) => ({
      label: index === 0 ? "Low density" : index === colors.length - 1 ? "High density" : `Density ${index + 1}`,
      color,
      secondaryLabel: "Heatmap legend",
    }));

  if (legend.length === 0) return null;

  return {
    id,
    type: "legend-completeness",
    severity: "warning",
    layerId: layer.id,
    layerName: layer.name,
    ...(numericField?.field ? { field: numericField.field } : {}),
    title: "Legend is incomplete for a thematic layer",
    rationale: "The layer uses data-driven styling or density rendering but does not expose a complete legend for export and peer review.",
    suggestedFix: "Persist generated legend entries before sharing the map or exporting a report.",
    detailUrl: "#cartography-legend-completeness",
    preview: {
      beforeLegend: existingLegend(layer),
      afterLegend: legend,
      summary: "Legend entries will be stored on the layer style and reused by report/export output.",
    },
    proposal: buildProposal({
      layer,
      title: `Persist legend for ${layer.name}`,
      stylePatch: {
        legendEntries: legend.map((entry) => ({
          label: entry.label,
          color: entry.color,
          field: numericField?.field ?? "density",
        })),
      },
      metadataPatch: {
        cartographyReview: layerReviewMetadata(layer, { id, title: "Legend persisted" }, nowIso(options), true),
      },
    }),
  };
}

function hasUncertaintyMetadata(layer: OverlayLayerConfig): boolean {
  const style = layer.style ?? {};
  const metadata = layer.metadata ?? {};
  const analysisVisualization = metadata.analysisResult?.visualization as unknown as Record<string, unknown> | undefined;
  const candidates = [
    style.uncertainty,
    style.uncertaintyField,
    style.confidenceField,
    style.marginOfErrorField,
    metadata.scientificQA?.badges.includes("uncertain_output"),
    metadata.scientificQA?.caveats.some((caveat) => caveat.toLowerCase().includes("uncertain")),
    analysisVisualization?.uncertainty,
    analysisVisualization?.confidence,
  ];
  return candidates.some(Boolean);
}

function createUncertaintyRecommendation(
  layer: OverlayLayerConfig,
  numericField: NumericFieldSummary | null,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation | null {
  if (!numericField || hasUncertaintyMetadata(layer)) return null;
  const id = recommendationId(layer, "uncertainty-metadata", numericField.field);
  if (isApplied(layer, id) || options?.dismissedRecommendationIds?.has(id)) {
    return null;
  }

  return {
    id,
    type: "uncertainty-metadata",
    severity: "warning",
    layerId: layer.id,
    layerName: layer.name,
    field: numericField.field,
    title: "Thematic style is missing uncertainty metadata",
    rationale: `The layer styles ${numericField.field} but does not expose confidence, margin-of-error, or uncertainty caveats for report/export review.`,
    suggestedFix: "Attach an uncertainty field, confidence note, or QA caveat before using this style as publication evidence.",
    detailUrl: "#cartography-uncertainty",
    preview: {
      beforeLegend: existingLegend(layer),
      afterLegend: existingLegend(layer),
      summary: "No visual mutation is applied; this is a publication-readiness warning.",
    },
  };
}

export function generateLayerCartographyRecommendations(
  layer: OverlayLayerConfig,
  options?: MapCartographyAdvisorOptions,
): MapCartographyRecommendation[] {
  if (!layer.visible) return [];

  const collection = sourceDataToFeatureCollection(layer.sourceData);
  const geometryType = resolveGeometryType(layer, collection);
  const family = geometryFamily(geometryType);
  const numericFields = collection ? collectNumericFields(collection) : [];
  const primaryNumericField = numericFields[0] ?? null;
  const styleColors = colorsFromStyle(layer.style);
  const recommendations: MapCartographyRecommendation[] = [];

  if ((family === "polygon" || family === "line") && primaryNumericField) {
    const classificationRecommendation = createClassificationRecommendation(
      layer,
      geometryType,
      primaryNumericField,
      options,
    );
    if (classificationRecommendation) recommendations.push(classificationRecommendation);
  }

  evaluateColorScheme({
    colors: styleColors,
    numericFieldName: primaryNumericField?.field,
    distribution: primaryNumericField?.distribution,
    geometryType,
  }).forEach((finding) => {
    const recommendation = createColorRecommendation(layer, geometryType, primaryNumericField, finding, options);
    if (recommendation) recommendations.push(recommendation);
  });

  if (family === "point") {
    const densityRecommendation = createSymbolDensityRecommendation(layer, collection, options?.viewport, options);
    if (densityRecommendation) recommendations.push(densityRecommendation);
  }

  const heatmapRecommendation = createHeatmapRecommendation(layer, collection, options?.viewport, options);
  if (heatmapRecommendation) recommendations.push(heatmapRecommendation);

  const labelRecommendation = createLabelRecommendation(layer, collection, options?.viewport, options);
  if (labelRecommendation) recommendations.push(labelRecommendation);

  if (isThematicLayer(layer, numericFields)) {
    const legendRecommendation = createLegendRecommendation(layer, primaryNumericField, options);
    if (legendRecommendation) recommendations.push(legendRecommendation);
    const uncertaintyRecommendation = createUncertaintyRecommendation(layer, primaryNumericField, options);
    if (uncertaintyRecommendation) recommendations.push(uncertaintyRecommendation);
  }

  return recommendations.slice(0, 5);
}

function signatureForLayers(layers: OverlayLayerConfig[]): string {
  return layers
    .filter((layer) => layer.visible)
    .map((layer) => [
      layer.id,
      layer.type,
      layer.opacity,
      layer.metadata?.geometryType ?? "",
      layer.metadata?.featureCount ?? "",
      JSON.stringify(layer.style ?? {}),
      layer.metadata?.cartographyReview?.reviewedAt ?? "",
    ].join(":"))
    .join("|");
}

export function generateMapCartographyReview(
  layers: OverlayLayerConfig[],
  options?: MapCartographyAdvisorOptions,
): MapCartographyReviewState {
  const visibleLayers = layers.filter((layer) => layer.visible);
  const recommendations = visibleLayers.flatMap((layer) =>
    generateLayerCartographyRecommendations(layer, options),
  );
  const recommendationCounts: Record<MapCartographySeverity, number> = {
    info: 0,
    warning: 0,
    error: 0,
  };
  recommendations.forEach((recommendation) => {
    recommendationCounts[recommendation.severity] += 1;
  });

  return {
    status: recommendations.some((recommendation) => recommendation.severity !== "info") ? "needs-review" : "passed",
    reviewedAt: nowIso(options),
    recommendations,
    metadata: {
      generatedBy: "MapCartographyAdvisor",
      version: MAP_CARTOGRAPHY_ADVISOR_VERSION,
      visibleLayerCount: visibleLayers.length,
      recommendationCounts,
      signature: signatureForLayers(layers),
    },
  };
}

export function applyCartographyRecommendationToLayer(
  layer: OverlayLayerConfig,
  recommendation: MapCartographyRecommendation,
): OverlayLayerConfig {
  const proposal = recommendation.proposal;
  if (!proposal) return layer;

  return {
    ...layer,
    ...(proposal.layerPatch ?? {}),
    style: {
      ...(layer.style ?? {}),
      ...(proposal.stylePatch ?? {}),
    },
    metadata: {
      ...(layer.metadata ?? {}),
      ...(proposal.metadataPatch ?? {}),
    },
  };
}
