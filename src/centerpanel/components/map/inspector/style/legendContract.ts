import type { ClassificationMethod } from "@/utils/classification";
import { classifyNumericValues } from "@/utils/classification";
import type { ColorRampName } from "@/utils/colorRamps";
import { getColorRampColors } from "@/utils/colorRamps";
import {
  buildSerializedMapLabelSpec,
  STYLE_LABEL_SPEC_KEY,
} from "@/services/map/labels/MapLabelEngine";
import {
  buildBivariateChoroplethRenderer,
  buildDotDensityRenderer,
  type SerializedAdvancedCartographySpec,
  STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY,
  STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION,
} from "@/services/map/cartography/AdvancedCartographyEngine";
import type {
  MapLabelCollisionPolicy,
  MapLabelPlacement,
  SerializedMapLabelSpec,
} from "@/services/map/labels/MapLabelEngine";
import { buildProportionalRadiusExpression } from "../../symbolStyleUtils";
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
  | "bivariate-choropleth"
  | "dot-density"
  | "graduated-symbol"
  | "proportional-symbol"
  | "heatmap";

export type SerializedLegendEntryKind =
  | "fill"
  | "line"
  | "circle"
  | "raster"
  | "heatmap"
  | "label"
  | "bivariate"
  | "dot-density";

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
  secondaryField?: string;
  secondaryLabel?: string;
  gridColumn?: number;
  gridRow?: number;
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
  advancedCartography?: SerializedAdvancedCartographySpec;
  labels?: SerializedMapLabelSpec;
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
  secondaryField?: string | undefined;
  normalizationField?: string | undefined;
  dotValuePerDot: number;
  classCount: number;
  classificationMethod: ClassificationMethod;
  colorRamp: ColorRampName;
  opacity: number;
  outlineColor: string;
  outlineWidth: number;
  noDataColor: string;
  noDataLabel: string;
  labelsEnabled: boolean;
  labelField?: string;
  labelFontFamily: string;
  labelSize: number;
  labelColor: string;
  labelHaloColor: string;
  labelHaloWidth: number;
  labelPlacement: MapLabelPlacement;
  labelCollisionPolicy: MapLabelCollisionPolicy;
  labelPriorityField?: string;
  labelMinZoom: number;
  labelMaxZoom: number;
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
const DEFAULT_LABEL_COLOR = "rgb(249, 250, 251)";
const DEFAULT_LABEL_HALO_COLOR = "rgba(17,24,39,0.92)";
const DEFAULT_LABEL_FONT = "Open Sans Regular";
const DEFAULT_DOT_VALUE_PER_DOT = 500;

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
  const numericFields = getLayerNumericStyleFieldNames(layer);
  const secondaryField = numericFields.find((candidate) => candidate !== field);
  const labelField = getLayerStyleFieldNames(layer)[0];
  return {
    mode,
    ...(field ? { field } : {}),
    ...(secondaryField ? { secondaryField } : {}),
    dotValuePerDot: DEFAULT_DOT_VALUE_PER_DOT,
    ...(labelField ? { labelField } : {}),
    classCount: DEFAULT_CLASS_COUNT,
    classificationMethod: "quantile",
    colorRamp: "YlOrRd",
    opacity: layer.opacity,
    outlineColor: DEFAULT_OUTLINE_COLOR,
    outlineWidth: kind === "line" ? 2 : 0.8,
    noDataColor: DEFAULT_NO_DATA_COLOR,
    noDataLabel: "No data",
    labelsEnabled: false,
    labelFontFamily: DEFAULT_LABEL_FONT,
    labelSize: 11,
    labelColor: DEFAULT_LABEL_COLOR,
    labelHaloColor: DEFAULT_LABEL_HALO_COLOR,
    labelHaloWidth: 1.4,
    labelPlacement: kind === "line" ? "line" : "above",
    labelCollisionPolicy: "hide-on-overlap",
    labelMinZoom: 8,
    labelMaxZoom: 24,
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
  return noDataExpressionForFields([field], noDataColor, expression);
}

function noDataExpressionForFields(fields: string[], noDataColor: string, expression: unknown): unknown[] {
  const checks = fields.flatMap((field) => [
    ["!", ["has", field]],
    ["==", ["get", field], null],
    ["==", ["to-string", ["get", field]], ""],
  ]);
  return [
    "case",
    ["any", ...checks],
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

function stripLabelStyleState(style: Record<string, unknown> | undefined): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(style ?? {}).filter(([key]) =>
      key !== STYLE_LABEL_SPEC_KEY && !key.startsWith("__label")),
  );
}

function stripAdvancedStyleState(style: Record<string, unknown> | undefined): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(stripLabelStyleState(style)).filter(([key]) =>
      key !== STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY &&
      key !== "classificationField" &&
      key !== "classificationFieldSecondary" &&
      key !== "classificationMethod"),
  );
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
  const items = spec.entries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    secondaryLabel: entry.secondaryLabel ?? (entry.noData ? `${spec.layerName} / ${spec.noData.label}` : spec.layerName),
    kind: entry.kind,
  }));
  if (spec.labels?.enabled) {
    items.push({
      label: `Labels: ${spec.labels.field}`,
      color: spec.labels.color,
      secondaryLabel: `${spec.layerName} / ${spec.labels.collisionPolicy} / z${spec.labels.scaleRange.minZoom}-${spec.labels.scaleRange.maxZoom}`,
      kind: "label",
    });
  }
  return items;
}

export function buildLayerStyleUpdate(
  layer: OverlayLayerConfig,
  options: LayerStyleEditorOptions,
  updatedAt = new Date().toISOString(),
): LayerStyleUpdate {
  const kind = geometryKind(layer);
  const colorKey = paintColorKey(kind);
  const field = options.field?.trim() || defaultFieldForMode(layer, options.mode);
  const numericFields = getLayerNumericStyleFieldNames(layer);
  const secondaryField = options.secondaryField?.trim() ||
    numericFields.find((candidate) => candidate !== field);
  const normalizationField = options.normalizationField?.trim() || undefined;
  const colors = getColorRampColors(options.colorRamp, Math.max(3, Math.min(9, options.classCount)))
    .map(resolveMapPaintColor);
  const noDataColor = resolveMapPaintColor(options.noDataColor || DEFAULT_NO_DATA_COLOR);
  const warnings: string[] = [];
  let entries: SerializedLegendEntry[] = [];
  const stylePatch: Record<string, unknown> = {};
  let classificationMethod: ClassificationMethod | undefined;
  let advancedCartography: SerializedAdvancedCartographySpec | undefined;
  const labelSpec = buildSerializedMapLabelSpec({
    enabled: options.labelsEnabled,
    field: options.labelField,
    fontFamily: options.labelFontFamily,
    size: options.labelSize,
    color: resolveMapPaintColor(options.labelColor || DEFAULT_LABEL_COLOR),
    haloColor: resolveMapPaintColor(options.labelHaloColor || DEFAULT_LABEL_HALO_COLOR),
    haloWidth: options.labelHaloWidth,
    placement: options.labelPlacement,
    collisionPolicy: options.labelCollisionPolicy,
    minZoom: options.labelMinZoom,
    maxZoom: options.labelMaxZoom,
    priorityField: options.labelPriorityField,
  }, updatedAt);

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
    if (options.mode === "bivariate-choropleth") {
      if (!secondaryField) {
        warnings.push("Bivariate renderer needs a second numeric field before a 2D legend can be generated.");
        stylePatch[colorKey] = noDataColor;
      } else {
        const result = buildBivariateChoroplethRenderer({
          layer,
          xField: field,
          yField: secondaryField,
          updatedAt,
        });
        entries = result.entries.map((entry) => ({
          id: entry.id,
          label: entry.label,
          color: resolveMapPaintColor(entry.color),
          kind: "bivariate",
          field: entry.field,
          ...(entry.secondaryField ? { secondaryField: entry.secondaryField } : {}),
          ...(entry.secondaryLabel ? { secondaryLabel: entry.secondaryLabel } : {}),
          ...(entry.count != null ? { count: entry.count } : {}),
          ...(entry.gridColumn != null ? { gridColumn: entry.gridColumn } : {}),
          ...(entry.gridRow != null ? { gridRow: entry.gridRow } : {}),
        }));
        warnings.push(...result.caveats);
        advancedCartography = result.spec;
        classificationMethod = "quantile";
        stylePatch[colorKey] = noDataExpressionForFields([field, secondaryField], noDataColor, result.fillColorExpression);
        stylePatch.classificationField = field;
        stylePatch.classificationFieldSecondary = secondaryField;
        stylePatch.classificationMethod = "quantile";
        stylePatch[STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY] = result.spec;
      }
    } else if (options.mode === "dot-density") {
      const result = buildDotDensityRenderer({
        layer,
        valueField: field,
        ...(normalizationField ? { normalizationField } : {}),
        valuePerDot: options.dotValuePerDot,
        updatedAt,
      });
      entries = result.entries.map((entry) => ({
        id: entry.id,
        label: entry.label,
        color: resolveMapPaintColor(entry.color),
        kind: "dot-density",
        field: entry.field,
        ...(entry.secondaryField ? { secondaryField: entry.secondaryField } : {}),
        ...(entry.secondaryLabel ? { secondaryLabel: entry.secondaryLabel } : {}),
        ...(entry.count != null ? { count: entry.count } : {}),
      }));
      warnings.push(...result.caveats);
      advancedCartography = result.spec;
      stylePatch[colorKey] = noDataExpression(field, noDataColor, "rgba(24, 76, 87, 0.18)");
      stylePatch.classificationField = field;
      stylePatch[STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY] = result.spec;
    } else if (options.mode === "categorical") {
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
        const minRadius = options.mode === "proportional-symbol" ? 4 : 5;
        const maxRadius = options.mode === "proportional-symbol" ? 22 : 14;
        stylePatch["circle-radius"] = buildProportionalRadiusExpression(field, min, max, minRadius, maxRadius);
        if (options.mode === "proportional-symbol") {
          const caveats: string[] = [];
          if (min === max) {
            caveats.push(`Proportional symbol field "${field}" is constant; symbol size cannot communicate magnitude differences.`);
          }
          if (fieldSummary.numericValues.length < fieldSummary.nonEmptyValues.length) {
            caveats.push(`Proportional symbol field "${field}" contains non-numeric values; those features fall back to no-data styling.`);
          }
          warnings.push(...caveats);
          advancedCartography = {
            version: STYLE_ADVANCED_CARTOGRAPHY_SPEC_VERSION,
            mode: "proportional-symbol",
            layerId: layer.id,
            layerName: layer.name,
            updatedAt,
            valueField: field,
            caveats,
          };
          stylePatch[STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY] = advancedCartography;
        }
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
        ...(options.mode === "bivariate-choropleth" && secondaryField ? { secondaryField } : {}),
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
  if (labelSpec) {
    stylePatch[STYLE_LABEL_SPEC_KEY] = labelSpec;
    stylePatch.__labelField = labelSpec.field;
    stylePatch.__labelSize = labelSpec.size;
    stylePatch.__labelColor = labelSpec.color;
    stylePatch.__labelHaloColor = labelSpec.haloColor;
    stylePatch.__labelHaloWidth = labelSpec.haloWidth;
    stylePatch.__labelAllowOverlap = labelSpec.collisionPolicy === "allow-overlap";
    stylePatch.__labelIgnorePlacement = labelSpec.collisionPolicy === "allow-overlap";
    stylePatch.__labelPlacement = labelSpec.placement;
    stylePatch.__labelMinZoom = labelSpec.scaleRange.minZoom;
    stylePatch.__labelMaxZoom = labelSpec.scaleRange.maxZoom;
    stylePatch.__labelFontFamily = labelSpec.fontFamily;
    stylePatch.__labelCollisionPolicy = labelSpec.collisionPolicy;
    if (labelSpec.priorityField) {
      stylePatch.__labelPriorityField = labelSpec.priorityField;
    }
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
    ...(advancedCartography ? { advancedCartography } : {}),
    ...(labelSpec ? { labels: labelSpec } : {}),
    warnings,
  };

  const style = {
    ...stripAdvancedStyleState(layer.style),
    ...stylePatch,
    [STYLE_LEGEND_SPEC_KEY]: legendSpec,
    legendEntries: legendEntries.map((entry) => ({
      label: entry.label,
      color: entry.color,
      kind: entry.kind,
      ...(entry.field ? { field: entry.field } : {}),
      ...(entry.secondaryField ? { secondaryField: entry.secondaryField } : {}),
      ...(entry.secondaryLabel ? { secondaryLabel: entry.secondaryLabel } : {}),
      ...(entry.noData ? { noData: true } : {}),
      ...(entry.count != null ? { count: entry.count } : {}),
      ...(entry.gridColumn != null ? { gridColumn: entry.gridColumn } : {}),
      ...(entry.gridRow != null ? { gridRow: entry.gridRow } : {}),
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
