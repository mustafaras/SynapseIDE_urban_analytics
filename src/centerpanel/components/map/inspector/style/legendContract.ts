import type { ClassificationMethod } from "@/utils/classification";
import { classifyNumericValues } from "@/utils/classification";
import type { ColorRampName } from "@/utils/colorRamps";
import { getColorRampColors } from "@/utils/colorRamps";
import type {
  LayerCartographyReviewMetadata,
  LayerMetadata,
  OverlayLayerConfig,
} from "../../mapTypes";
import { resolveMapPaintColor } from "../../mapTokens";
import { toFiniteNumber } from "../../symbologyUtils";

export const STYLE_LEGEND_SPEC_KEY = "legendSpec";
export const STYLE_LEGEND_SPEC_VERSION = 1;

export type SerializedLegendMode =
  | "single"
  | "choropleth"
  | "categorical"
  | "graduated-symbol"
  | "proportional-symbol"
  | "heatmap";

export type SerializedLegendEntryKind = "fill" | "line" | "circle" | "raster" | "heatmap";

export interface SerializedLegendEntry {
  id: string;
  label: string;
  color: string;
  kind: SerializedLegendEntryKind;
  field?: string;
  value?: string | number;
  min?: number;
  max?: number;
  count?: number;
  noData?: boolean;
}

export interface SerializedMapLegendSpec {
  version: typeof STYLE_LEGEND_SPEC_VERSION;
  layerId: string;
  layerName: string;
  mode: SerializedLegendMode;
  title: string;
  entries: SerializedLegendEntry[];
  source: "style-editor" | "cartography-advisor";
  updatedAt: string;
  styleHash: string;
  field?: string;
  classificationMethod?: ClassificationMethod;
  colorRamp?: ColorRampName;
  noData: {
    enabled: boolean;
    label: string;
    color: string;
  };
  warnings: string[];
}

export interface SerializedLegendCompositionItem {
  label: string;
  color: string;
  secondaryLabel?: string;
  kind: SerializedLegendEntryKind;
}

export interface LayerStyleEditorOptions {
  mode: SerializedLegendMode;
  field?: string;
  labelField?: string;
  classCount: number;
  classificationMethod: ClassificationMethod;
  colorRamp: ColorRampName;
  opacity: number;
  outlineColor: string;
  outlineWidth: number;
  noDataColor: string;
  noDataLabel: string;
  labelsEnabled: boolean;
}

export interface LayerStyleUpdate {
  layerId: string;
  opacity: number;
  style: Record<string, unknown>;
  legendSpec: SerializedMapLegendSpec;
  metadataPatch: Partial<LayerMetadata>;
  warnings: string[];
}

interface FieldSummary {
  name: string;
  numericValues: number[];
  nonEmptyValues: unknown[];
}

const DEFAULT_CLASS_COUNT = 5;
const DEFAULT_NO_DATA_COLOR = getColorRampColors("Set1", 9)[8] ?? "rgb(153, 153, 153)";
const DEFAULT_OUTLINE_COLOR = "rgba(17,24,39,0.72)";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sourceDataToFeatureCollection(layer: OverlayLayerConfig): GeoJSON.FeatureCollection | null {
  const sourceData = layer.sourceData;
  if (!sourceData || typeof sourceData === "string") return null;
  if (sourceData.type === "FeatureCollection") return sourceData;
  if (sourceData.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [sourceData as GeoJSON.Feature],
    };
  }
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: sourceData as GeoJSON.Geometry,
    }],
  };
}

function geometryKind(layer: OverlayLayerConfig): SerializedLegendEntryKind {
  if (layer.type === "heatmap") return "heatmap";
  if (layer.type === "raster-tile" || layer.type === "vector-tile") return "raster";
  const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
  if (geometryType.includes("point")) return "circle";
  if (geometryType.includes("line")) return "line";
  return "fill";
}

function paintColorKey(kind: SerializedLegendEntryKind): "fill-color" | "line-color" | "circle-color" | "heatmap-color" {
  if (kind === "line") return "line-color";
  if (kind === "circle") return "circle-color";
  if (kind === "heatmap") return "heatmap-color";
  return "fill-color";
}

function collectFieldSummaries(layer: OverlayLayerConfig): FieldSummary[] {
  const collection = sourceDataToFeatureCollection(layer);
  const byField = new Map<string, FieldSummary>();

  for (const feature of collection?.features ?? []) {
    const properties = feature.properties ?? {};
    Object.entries(properties).forEach(([name, value]) => {
      const current = byField.get(name) ?? { name, numericValues: [], nonEmptyValues: [] };
      if (value != null && (!(typeof value === "string") || value.trim() !== "")) {
        current.nonEmptyValues.push(value);
      }
      const numeric = toFiniteNumber(value);
      if (numeric != null) {
        current.numericValues.push(numeric);
      }
      byField.set(name, current);
    });
  }

  for (const name of layer.metadata?.fields ?? []) {
    if (!byField.has(name)) {
      byField.set(name, { name, numericValues: [], nonEmptyValues: [] });
    }
  }

  return [...byField.values()].sort((left, right) =>
    right.numericValues.length - left.numericValues.length ||
    right.nonEmptyValues.length - left.nonEmptyValues.length ||
    left.name.localeCompare(right.name),
  );
}

export function getLayerStyleFieldNames(layer: OverlayLayerConfig): string[] {
  return collectFieldSummaries(layer).map((field) => field.name);
}

export function getLayerNumericStyleFieldNames(layer: OverlayLayerConfig): string[] {
  return collectFieldSummaries(layer)
    .filter((field) => field.numericValues.length > 0)
    .map((field) => field.name);
}

function defaultFieldForMode(layer: OverlayLayerConfig, mode: SerializedLegendMode): string | undefined {
  const summaries = collectFieldSummaries(layer);
  const numeric = summaries.find((field) => field.numericValues.length > 0);
  if (mode === "categorical") {
    return summaries.find((field) => field.nonEmptyValues.length > 0)?.name ?? numeric?.name;
  }
  return numeric?.name ?? summaries[0]?.name;
}

export function getDefaultLayerStyleOptions(layer: OverlayLayerConfig): LayerStyleEditorOptions {
  const kind = geometryKind(layer);
  const mode: SerializedLegendMode = layer.type === "heatmap"
    ? "heatmap"
    : kind === "circle"
      ? "proportional-symbol"
      : "choropleth";
  const field = defaultFieldForMode(layer, mode);
  return {
    mode,
    ...(field ? { field } : {}),
    classCount: DEFAULT_CLASS_COUNT,
    classificationMethod: "quantile",
    colorRamp: "YlOrRd",
    opacity: layer.opacity,
    outlineColor: DEFAULT_OUTLINE_COLOR,
    outlineWidth: kind === "line" ? 2 : 0.8,
    noDataColor: DEFAULT_NO_DATA_COLOR,
    noDataLabel: "No data",
    labelsEnabled: false,
  };
}

function styleHash(value: unknown): string {
  const json = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < json.length; index += 1) {
    hash = ((hash << 5) - hash + json.charCodeAt(index)) | 0;
  }
  return `style-${Math.abs(hash).toString(36)}`;
}

function formatCategory(value: unknown): string {
  if (typeof value === "string") return value || "empty";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "other";
}

function categoricalEntries(params: {
  layer: OverlayLayerConfig;
  field: string;
  kind: SerializedLegendEntryKind;
  colors: string[];
}): SerializedLegendEntry[] {
  const collection = sourceDataToFeatureCollection(params.layer);
  const counts = new Map<string, number>();
  for (const feature of collection?.features ?? []) {
    const rawValue = feature.properties?.[params.field];
    if (rawValue == null || (typeof rawValue === "string" && rawValue.trim() === "")) continue;
    const label = formatCategory(rawValue);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, Math.max(2, Math.min(12, params.colors.length)));
  return ranked.map(([label, count], index) => ({
    id: `${params.layer.id}-${params.field}-${label}`,
    label,
    color: resolveMapPaintColor(params.colors[index] ?? params.colors[params.colors.length - 1] ?? DEFAULT_NO_DATA_COLOR),
    kind: params.kind,
    field: params.field,
    value: label,
    count,
  }));
}

function noDataExpression(field: string, noDataColor: string, expression: unknown): unknown[] {
  return [
    "case",
    ["any", ["!", ["has", field]], ["==", ["get", field], null], ["==", ["to-string", ["get", field]], ""]],
    noDataColor,
    expression,
  ];
}

function legendEntriesFromClassification(params: {
  layer: OverlayLayerConfig;
  field: string;
  kind: SerializedLegendEntryKind;
  values: number[];
  method: ClassificationMethod;
  classCount: number;
  colors: string[];
}): {
  entries: SerializedLegendEntry[];
  expression: unknown;
  effectiveMethod: ClassificationMethod;
} {
  const effectiveMethod = params.method === "manual" ? "equal-interval" : params.method;
  const classification = classifyNumericValues(params.values, {
    method: effectiveMethod,
    classCount: Math.max(2, Math.min(9, params.classCount)),
  });
  const entries = classification.classes.map((entry, index) => ({
    id: `${params.layer.id}-${params.field}-${index}`,
    label: entry.label,
    color: resolveMapPaintColor(params.colors[index] ?? params.colors[params.colors.length - 1] ?? DEFAULT_NO_DATA_COLOR),
    kind: params.kind,
    field: params.field,
    min: entry.min,
    max: entry.max,
    count: entry.count,
  }));
  const expression: unknown[] = [
    "step",
    ["to-number", ["get", params.field], classification.min],
    entries[0]?.color ?? DEFAULT_NO_DATA_COLOR,
  ];
  classification.classes.slice(0, -1).forEach((entry, index) => {
    expression.push(entry.max, entries[index + 1]?.color ?? entries[entries.length - 1]?.color ?? DEFAULT_NO_DATA_COLOR);
  });
  return { entries, expression, effectiveMethod };
}

function buildCategoricalExpression(field: string, entries: SerializedLegendEntry[], fallbackColor: string): unknown[] {
  const expression: unknown[] = ["match", ["to-string", ["get", field]]];
  entries.forEach((entry) => {
    expression.push(String(entry.value ?? entry.label), entry.color);
  });
  expression.push(fallbackColor);
  return expression;
}

function buildReviewMetadata(
  layer: OverlayLayerConfig,
  title: string,
  updatedAt: string,
): LayerCartographyReviewMetadata {
  const previous = layer.metadata?.cartographyReview;
  return {
    status: "reviewed",
    reviewedAt: updatedAt,
    recommendationIds: previous?.recommendationIds ?? [],
    appliedRecommendationIds: previous?.appliedRecommendationIds ?? [],
    dismissedRecommendationIds: previous?.dismissedRecommendationIds ?? [],
    lastAppliedTitle: title,
    legendPersisted: true,
  };
}

export function getSerializedLegendSpecFromStyle(style: Record<string, unknown> | undefined): SerializedMapLegendSpec | null {
  const candidate = style?.[STYLE_LEGEND_SPEC_KEY];
  if (!isObject(candidate)) return null;
  if (candidate.version !== STYLE_LEGEND_SPEC_VERSION) return null;
  if (!Array.isArray(candidate.entries)) return null;
  if (typeof candidate.layerId !== "string" || typeof candidate.layerName !== "string") return null;
  return candidate as unknown as SerializedMapLegendSpec;
}

export function serializedLegendSpecToCompositionItems(
  spec: SerializedMapLegendSpec,
): SerializedLegendCompositionItem[] {
  return spec.entries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    secondaryLabel: entry.noData ? `${spec.layerName} / ${spec.noData.label}` : spec.layerName,
    kind: entry.kind,
  }));
}

export function buildLayerStyleUpdate(
  layer: OverlayLayerConfig,
  options: LayerStyleEditorOptions,
  updatedAt = new Date().toISOString(),
): LayerStyleUpdate {
  const kind = geometryKind(layer);
  const colorKey = paintColorKey(kind);
  const field = options.field?.trim() || defaultFieldForMode(layer, options.mode);
  const colors = getColorRampColors(options.colorRamp, Math.max(3, Math.min(9, options.classCount)))
    .map(resolveMapPaintColor);
  const noDataColor = resolveMapPaintColor(options.noDataColor || DEFAULT_NO_DATA_COLOR);
  const warnings: string[] = [];
  let entries: SerializedLegendEntry[] = [];
  const stylePatch: Record<string, unknown> = {};
  let classificationMethod: ClassificationMethod | undefined;

  if (options.mode === "single" || !field) {
    const color = colors[colors.length - 1] ?? noDataColor;
    entries = [{
      id: `${layer.id}-single`,
      label: layer.name,
      color,
      kind,
    }];
    stylePatch[colorKey] = color;
  } else {
    const fieldSummary = collectFieldSummaries(layer).find((candidate) => candidate.name === field);
    if (options.mode === "categorical") {
      entries = categoricalEntries({ layer, field, kind, colors });
      if (entries.length === 0) {
        warnings.push(`Field "${field}" has no categorical values; only no-data styling will be visible.`);
      }
      stylePatch[colorKey] = noDataExpression(field, noDataColor, buildCategoricalExpression(field, entries, noDataColor));
    } else if (options.mode === "heatmap") {
      entries = colors.map((color, index) => ({
        id: `${layer.id}-heatmap-${index}`,
        label: index === 0 ? "Low density" : index === colors.length - 1 ? "High density" : `Density ${index + 1}`,
        color,
        kind: "heatmap",
        ...(field ? { field } : {}),
      }));
      stylePatch["heatmap-color"] = [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0,0,0,0)",
        ...entries.flatMap((entry, index) => [
          Number(((index + 1) / entries.length).toFixed(2)),
          entry.color,
        ]),
      ];
    } else if (!fieldSummary || fieldSummary.numericValues.length === 0) {
      warnings.push(`Field "${field}" has no numeric values; no-data styling is the only safe thematic output.`);
      entries = [];
      stylePatch[colorKey] = noDataColor;
    } else {
      const result = legendEntriesFromClassification({
        layer,
        field,
        kind,
        values: fieldSummary.numericValues,
        method: options.classificationMethod,
        classCount: options.classCount,
        colors,
      });
      entries = result.entries;
      classificationMethod = result.effectiveMethod;
      stylePatch[colorKey] = noDataExpression(field, noDataColor, result.expression);
      stylePatch.classificationField = field;
      stylePatch.classificationMethod = result.effectiveMethod;

      if (options.mode === "proportional-symbol" || options.mode === "graduated-symbol") {
        const min = Math.min(...fieldSummary.numericValues);
        const max = Math.max(...fieldSummary.numericValues);
        stylePatch["circle-radius"] = min === max
          ? 8
          : [
              "interpolate",
              ["linear"],
              ["to-number", ["get", field], min],
              min,
              options.mode === "proportional-symbol" ? 4 : 5,
              max,
              options.mode === "proportional-symbol" ? 22 : 14,
            ];
      }
    }
  }

  const noDataEntry: SerializedLegendEntry | null = field
    ? {
        id: `${layer.id}-${field}-no-data`,
        label: options.noDataLabel.trim() || "No data",
        color: noDataColor,
        kind,
        field,
        noData: true,
      }
    : null;
  const legendEntries = noDataEntry ? [...entries, noDataEntry] : entries;
  const styleTitle = `${options.mode} style for ${layer.name}`;

  if (kind === "fill") {
    stylePatch["fill-outline-color"] = resolveMapPaintColor(options.outlineColor);
  }
  if (kind === "circle") {
    stylePatch["circle-stroke-color"] = resolveMapPaintColor(options.outlineColor);
    stylePatch["circle-stroke-width"] = options.outlineWidth;
  }
  if (kind === "line") {
    stylePatch["line-width"] = options.outlineWidth;
  }
  if (options.labelsEnabled && options.labelField) {
    stylePatch.__labelField = options.labelField;
    stylePatch.__labelSize = 11;
    stylePatch.__labelColor = "rgb(249, 250, 251)";
    stylePatch.__labelHaloColor = "rgba(17,24,39,0.92)";
    stylePatch.__labelHaloWidth = 1.4;
    stylePatch.__labelAllowOverlap = false;
    stylePatch.__labelIgnorePlacement = false;
  }

  const legendSpec: SerializedMapLegendSpec = {
    version: STYLE_LEGEND_SPEC_VERSION,
    layerId: layer.id,
    layerName: layer.name,
    mode: options.mode,
    title: styleTitle,
    entries: legendEntries,
    source: "style-editor",
    updatedAt,
    styleHash: styleHash({ layerId: layer.id, stylePatch, legendEntries }),
    ...(field ? { field } : {}),
    ...(classificationMethod ? { classificationMethod } : {}),
    colorRamp: options.colorRamp,
    noData: {
      enabled: Boolean(noDataEntry),
      label: options.noDataLabel.trim() || "No data",
      color: noDataColor,
    },
    warnings,
  };

  const style = {
    ...(layer.style ?? {}),
    ...stylePatch,
    [STYLE_LEGEND_SPEC_KEY]: legendSpec,
    legendEntries: legendEntries.map((entry) => ({
      label: entry.label,
      color: entry.color,
      kind: entry.kind,
      ...(entry.field ? { field: entry.field } : {}),
      ...(entry.noData ? { noData: true } : {}),
      ...(entry.count != null ? { count: entry.count } : {}),
    })),
    cartography: {
      mode: options.mode,
      legendSpecVersion: STYLE_LEGEND_SPEC_VERSION,
      styleHash: legendSpec.styleHash,
    },
  };

  return {
    layerId: layer.id,
    opacity: Math.max(0, Math.min(1, options.opacity)),
    style,
    legendSpec,
    metadataPatch: {
      cartographyReview: buildReviewMetadata(layer, styleTitle, updatedAt),
    },
    warnings,
  };
}
