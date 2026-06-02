import type {
  LayerGroupId,
  MapDefinitionFilterOperator,
  MapLayerContentsState,
  MapLayerDefinitionFilter,
  OverlayLayerConfig,
} from "../mapTypes";
import { normalizeLayerRegistryMetadata } from "../mapLayerMetadata";

export interface MapContentsGroup {
  id: string;
  label: string;
  layerIds: string[];
}

export interface MapContentsScaleResult {
  inRange: boolean;
  reason: string | null;
}

export interface MapContentsFilterResult {
  layer: OverlayLayerConfig;
  totalFeatureCount: number | null;
  filteredFeatureCount: number | null;
}

export type MapLayerContentsPatch =
  Partial<Omit<MapLayerContentsState, "updatedAt" | "minZoom" | "maxZoom" | "definitionFilter">>
  & {
    minZoom?: number | undefined;
    maxZoom?: number | undefined;
    definitionFilter?: MapLayerDefinitionFilter | undefined;
  };

export const MAP_CONTENTS_SYSTEM_GROUPS: Readonly<Record<LayerGroupId, string>> = {
  base: "Base Layers",
  data: "Data Layers",
  analysis: "Analysis Results",
  voxcity: "VoxCity",
};

function cloneLightweight<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultEditable(layer: OverlayLayerConfig): boolean {
  return layer.type !== "raster-tile"
    && layer.type !== "vector-tile"
    && layer.sourceKind !== "external";
}

export function resolveMapLayerContentsState(
  layer: OverlayLayerConfig,
  updatedAt = "not-configured",
): MapLayerContentsState {
  const stored = layer.metadata?.contents;
  if (stored) return stored;
  const groupId = layer.group ?? "data";
  return {
    groupId,
    groupLabel: MAP_CONTENTS_SYSTEM_GROUPS[groupId],
    selectable: normalizeLayerRegistryMetadata(layer).queryable,
    editable: defaultEditable(layer),
    updatedAt,
  };
}

export function setMapLayerContentsState(
  layer: OverlayLayerConfig,
  patch: MapLayerContentsPatch,
  updatedAt: string = new Date().toISOString(),
): OverlayLayerConfig {
  const previous = resolveMapLayerContentsState(layer, updatedAt);
  const contents: MapLayerContentsState = {
    ...previous,
    ...patch,
    updatedAt,
  };
  return {
    ...layer,
    metadata: {
      ...(layer.metadata ?? {}),
      contents,
    },
  };
}

export function buildMapContentsGroups(layers: readonly OverlayLayerConfig[]): MapContentsGroup[] {
  const groups = new Map<string, MapContentsGroup>();
  for (const layer of layers) {
    const contents = resolveMapLayerContentsState(layer);
    const existing = groups.get(contents.groupId);
    if (existing) {
      existing.layerIds.push(layer.id);
      continue;
    }
    groups.set(contents.groupId, {
      id: contents.groupId,
      label: contents.groupLabel,
      layerIds: [layer.id],
    });
  }
  return Array.from(groups.values());
}

export function evaluateContentsScaleRange(
  layer: OverlayLayerConfig,
  zoom: number,
): MapContentsScaleResult {
  const contents = resolveMapLayerContentsState(layer);
  if (contents.minZoom != null && zoom < contents.minZoom) {
    return { inRange: false, reason: `Hidden below zoom ${contents.minZoom}.` };
  }
  if (contents.maxZoom != null && zoom > contents.maxZoom) {
    return { inRange: false, reason: `Hidden above zoom ${contents.maxZoom}.` };
  }
  return { inRange: true, reason: null };
}

function filterValueMatches(
  candidate: unknown,
  operator: MapDefinitionFilterOperator,
  expected: string,
): boolean {
  const candidateText = candidate == null ? "" : String(candidate);
  switch (operator) {
    case "equals":
      return candidateText.toLowerCase() === expected.toLowerCase();
    case "not-equals":
      return candidateText.toLowerCase() !== expected.toLowerCase();
    case "contains":
      return candidateText.toLowerCase().includes(expected.toLowerCase());
    case "greater-than": {
      const candidateNumber = Number(candidate);
      const expectedNumber = Number(expected);
      return Number.isFinite(candidateNumber) && Number.isFinite(expectedNumber) && candidateNumber > expectedNumber;
    }
    case "less-than": {
      const candidateNumber = Number(candidate);
      const expectedNumber = Number(expected);
      return Number.isFinite(candidateNumber) && Number.isFinite(expectedNumber) && candidateNumber < expectedNumber;
    }
    default:
      return false;
  }
}

export function applyDefinitionFilterToLayer(layer: OverlayLayerConfig): MapContentsFilterResult {
  const filter = resolveMapLayerContentsState(layer).definitionFilter;
  const sourceData = layer.sourceData;
  if (
    !filter ||
    !sourceData ||
    typeof sourceData === "string" ||
    sourceData.type !== "FeatureCollection"
  ) {
    return {
      layer,
      totalFeatureCount: layer.metadata?.featureCount ?? null,
      filteredFeatureCount: filter ? null : layer.metadata?.featureCount ?? null,
    };
  }

  const filteredFeatures = sourceData.features.filter((feature) =>
    filterValueMatches(feature.properties?.[filter.field], filter.operator, filter.value),
  );
  return {
    layer: {
      ...layer,
      sourceData: {
        ...sourceData,
        features: filteredFeatures,
      },
      metadata: {
        ...(layer.metadata ?? {}),
        featureCount: filteredFeatures.length,
      },
    },
    totalFeatureCount: sourceData.features.length,
    filteredFeatureCount: filteredFeatures.length,
  };
}

export function applyContentsToRenderLayer(layer: OverlayLayerConfig, zoom: number): OverlayLayerConfig {
  const scaleResult = evaluateContentsScaleRange(layer, zoom);
  if (!scaleResult.inRange) {
    return { ...layer, visible: false, queryable: false };
  }
  const filtered = applyDefinitionFilterToLayer(layer).layer;
  const contents = resolveMapLayerContentsState(layer);
  return {
    ...filtered,
    queryable: (filtered.queryable ?? (filtered.type === "geojson" || filtered.type === "heatmap"))
      && contents.selectable,
  };
}

export function applyContentsToRenderLayers(
  layers: readonly OverlayLayerConfig[],
  zoom: number,
): OverlayLayerConfig[] {
  return layers.map((layer) => applyContentsToRenderLayer(layer, zoom));
}

export function duplicateMapContentsLayer(
  layer: OverlayLayerConfig,
  options: { id?: string; createdAt?: string } = {},
): OverlayLayerConfig {
  const createdAt = options.createdAt ?? new Date().toISOString();
  return {
    ...layer,
    id: options.id ?? `${layer.id}-copy-${Date.now().toString(36)}`,
    name: `${layer.name} (copy)`,
    ...(layer.provenance ? { provenance: cloneLightweight(layer.provenance) } : {}),
    ...(layer.style ? { style: cloneLightweight(layer.style) } : {}),
    metadata: {
      ...(layer.metadata ? cloneLightweight(layer.metadata) : {}),
      updatedAt: createdAt,
      contents: {
        ...resolveMapLayerContentsState(layer, createdAt),
        updatedAt: createdAt,
      },
    },
    // Duplicate views reference the same source payload; do not allocate geometry again.
    ...(layer.sourceData ? { sourceData: layer.sourceData } : {}),
  };
}

export function formatDefinitionFilter(filter: MapLayerDefinitionFilter): string {
  const operatorLabel: Record<MapDefinitionFilterOperator, string> = {
    equals: "=",
    "not-equals": "!=",
    contains: "contains",
    "greater-than": ">",
    "less-than": "<",
  };
  return `${filter.field} ${operatorLabel[filter.operator]} ${filter.value}`;
}
