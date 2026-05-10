import { create } from "zustand";

import { resolveHeight } from "./BuildingExtruder";
import type {
  BuildingFeature,
  BuildingFootprint,
  Ring,
} from "./buildingTypes";
import { DEFAULT_HEIGHT_STRATEGY } from "./buildingTypes";
import type {
  CityJSONSummary,
  ParsedCityObject,
} from "./cityJsonTypes";
import { SAMPLE_BUILDINGS } from "./sampleBuildings";
import type { BuildingVolume } from "./sunlightTypes";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";

export type VoxCitySourceKind = "map-layer" | "cityjson" | "sample" | "handoff";
export type VoxCityRuntimeMode = "real" | "sample";

export interface VoxCitySourceMetadata {
  id: string;
  title: string;
  kind: VoxCitySourceKind;
  runtimeMode: VoxCityRuntimeMode;
  provider: string;
  sourceRef: string;
  sourceLayerId?: string;
  sourceUpdatedAt?: string | null;
  sourceUrl?: string | null;
  crs?: string | null;
  featureCount: number;
  bbox: [number, number, number, number] | null;
  geometryAssumptions: readonly string[];
}

export interface VoxCityResolvedSource {
  metadata: VoxCitySourceMetadata;
  features: readonly BuildingFeature[];
  volumes: readonly BuildingVolume[];
  featureCollection: GeoJSON.FeatureCollection;
}

export interface VoxCitySunlightHandoff {
  source: VoxCityResolvedSource;
  selectedBuildingIds: readonly string[];
  insertedAt: string;
}

interface VoxCityBridgeState {
  sunlightHandoff: VoxCitySunlightHandoff | null;
  setSunlightHandoff: (source: VoxCityResolvedSource, selectedBuildingIds?: readonly string[]) => void;
  clearSunlightHandoff: () => void;
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sameCoordinate(left: readonly [number, number], right: readonly [number, number]): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function normalizeRing(positions: readonly GeoJSON.Position[]): Ring | null {
  const ring: [number, number][] = [];

  for (const position of positions) {
    const [x, y] = position;
    if (!isFiniteCoordinate(x) || !isFiniteCoordinate(y)) {
      continue;
    }
    ring.push([x, y]);
  }

  if (ring.length < 3) {
    return null;
  }

  if (!sameCoordinate(ring[0]!, ring[ring.length - 1]!)) {
    ring.push([ring[0]![0], ring[0]![1]]);
  }

  return ring.length >= 4 ? ring : null;
}

function bboxFromRing(ring: Ring): [number, number, number, number] {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return [minX, minY, maxX, maxY];
}

function mergeBBoxes(
  left: [number, number, number, number] | null,
  right: [number, number, number, number],
): [number, number, number, number] {
  if (!left) {
    return [...right];
  }

  return [
    Math.min(left[0], right[0]),
    Math.min(left[1], right[1]),
    Math.max(left[2], right[2]),
    Math.max(left[3], right[3]),
  ];
}

function footprintToCoordinates(footprint: BuildingFootprint): GeoJSON.Position[][] {
  return [
    footprint.outer.map(([x, y]) => [x, y]),
    ...(footprint.holes?.map((hole) => hole.map(([x, y]) => [x, y])) ?? []),
  ];
}

function footprintToFeature(feature: BuildingFeature): GeoJSON.Feature {
  return {
    type: "Feature",
    id: feature.id,
    geometry: {
      type: "Polygon",
      coordinates: footprintToCoordinates(feature.footprint),
    },
    properties: {
      ...(feature.attributes as GeoJSON.GeoJsonProperties),
      building_id: feature.id,
    },
  };
}

function buildFeatureCollection(features: readonly BuildingFeature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => footprintToFeature(feature)),
  };
}

function splitPolygonFeature(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJSON.GeoJsonProperties>,
  featureIndex: number,
  sourceId: string,
): BuildingFeature[] {
  const baseId = typeof feature.id === "string" || typeof feature.id === "number"
    ? String(feature.id)
    : typeof feature.properties?.id === "string" || typeof feature.properties?.id === "number"
      ? String(feature.properties.id)
      : `${sourceId}-${featureIndex + 1}`;

  const properties = { ...(feature.properties ?? {}) } as Record<string, unknown>;
  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;

  return polygons.flatMap((polygon, polygonIndex) => {
    const outer = normalizeRing(polygon[0] ?? []);
    if (!outer) {
      return [];
    }

    const holes = polygon
      .slice(1)
      .map((ring) => normalizeRing(ring))
      .filter((ring): ring is Ring => ring !== null);

    return [{
      id: polygons.length === 1 ? baseId : `${baseId}-part-${polygonIndex + 1}`,
      footprint: {
        outer,
        ...(holes.length > 0 ? { holes } : {}),
      },
      attributes: properties,
    } satisfies BuildingFeature];
  });
}

function asPolygonFeatureCollection(
  sourceData: OverlayLayerConfig["sourceData"],
): GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJSON.GeoJsonProperties> | null {
  if (!sourceData || typeof sourceData !== "object" || (sourceData as { type?: string }).type !== "FeatureCollection") {
    return null;
  }

  const collection = sourceData as GeoJSON.FeatureCollection;
  const polygonFeatures = collection.features.filter(
    (feature): feature is GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJSON.GeoJsonProperties> =>
      feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon",
  );

  return polygonFeatures.length > 0
    ? { type: "FeatureCollection", features: polygonFeatures }
    : null;
}

function buildVolumes(features: readonly BuildingFeature[]): BuildingVolume[] {
  return features.map((feature) => {
    const bbox = bboxFromRing(feature.footprint.outer);
    const resolved = resolveHeight(feature.attributes, DEFAULT_HEIGHT_STRATEGY);
    return {
      id: feature.id,
      label: typeof feature.attributes.name === "string"
        ? feature.attributes.name
        : typeof feature.attributes.label === "string"
          ? feature.attributes.label
          : feature.id,
      bbox,
      height: resolved.height,
    } satisfies BuildingVolume;
  });
}

function inferCrs(layer: OverlayLayerConfig): string | null {
  return layer.metadata?.datasetContext?.crs ?? layer.metadata?.columnar?.crs ?? null;
}

function inferSourceUrl(layer: OverlayLayerConfig): string | null {
  const sourceData = layer.sourceData;
  return typeof sourceData === "string" ? sourceData : null;
}

export function resolveVoxCityMapLayerSource(layer: OverlayLayerConfig): VoxCityResolvedSource | null {
  const collection = asPolygonFeatureCollection(layer.sourceData);
  if (!collection) {
    return null;
  }

  const features = collection.features.flatMap((feature, featureIndex) =>
    splitPolygonFeature(feature, featureIndex, layer.id),
  );

  if (features.length === 0) {
    return null;
  }

  const derivedCollection = buildFeatureCollection(features);
  let bbox: [number, number, number, number] | null = null;
  for (const feature of features) {
    bbox = mergeBBoxes(bbox, bboxFromRing(feature.footprint.outer));
  }

  const hadMultiPolygon = collection.features.some((feature) => feature.geometry?.type === "MultiPolygon");
  const geometryAssumptions = [
    "Polygon and MultiPolygon geometries are ingested as 2D building footprints.",
    ...(hadMultiPolygon ? ["MultiPolygon features are split into individual footprint records for extrusion."] : []),
    "Heights resolve from numeric height fields first, then floors, then the default 10 m fallback.",
  ];

  return {
    metadata: {
      id: layer.id,
      title: layer.name,
      kind: "map-layer",
      runtimeMode: "real",
      provider: "Map Explorer",
      sourceRef: layer.metadata?.datasetContext?.layerTitle ?? layer.name,
      sourceLayerId: layer.id,
      sourceUpdatedAt: layer.metadata?.updatedAt ?? null,
      sourceUrl: inferSourceUrl(layer),
      crs: inferCrs(layer),
      featureCount: features.length,
      bbox,
      geometryAssumptions,
    },
    features,
    volumes: buildVolumes(features),
    featureCollection: derivedCollection,
  };
}

function rectangleFootprintFromBBox(bbox: readonly [number, number, number, number]): BuildingFootprint {
  return {
    outer: [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[1]],
      [bbox[2], bbox[3]],
      [bbox[0], bbox[3]],
      [bbox[0], bbox[1]],
    ],
  };
}

export function resolveVoxCityCityJSONSource(
  objects: readonly ParsedCityObject[],
  summary: CityJSONSummary | null,
): VoxCityResolvedSource | null {
  const buildingObjects = objects.filter((object) => object.type === "Building" || object.type === "BuildingPart");
  if (buildingObjects.length === 0) {
    return null;
  }

  const features = buildingObjects.map((object) => {
    const bbox2d: [number, number, number, number] = [
      object.bbox[0],
      object.bbox[1],
      object.bbox[3],
      object.bbox[4],
    ];

    return {
      id: object.id,
      footprint: rectangleFootprintFromBBox(bbox2d),
      attributes: {
        ...object.attributes,
        lod: object.lod,
        cityjson_type: object.type,
        cityjson_height: Number((object.bbox[5] - object.bbox[2]).toFixed(3)),
      },
    } satisfies BuildingFeature;
  });

  const volumes = buildingObjects.map((object) => ({
    id: object.id,
    label: typeof object.attributes.name === "string"
      ? object.attributes.name
      : object.id,
    bbox: [object.bbox[0], object.bbox[1], object.bbox[3], object.bbox[4]],
    height: Math.max(0, object.bbox[5] - object.bbox[2]),
  } satisfies BuildingVolume));

  const bbox = summary?.bbox
    ? [summary.bbox[0], summary.bbox[1], summary.bbox[3], summary.bbox[4]] as [number, number, number, number]
    : null;

  return {
    metadata: {
      id: "cityjson-loaded-scene",
      title: "CityJSON Buildings",
      kind: "cityjson",
      runtimeMode: "real",
      provider: "CityJSON Viewer",
      sourceRef: summary?.referenceSystem ?? "Loaded CityJSON scene",
      sourceUpdatedAt: null,
      sourceUrl: null,
      crs: summary?.referenceSystem ?? null,
      featureCount: features.length,
      bbox,
      geometryAssumptions: [
        "CityJSON building footprints are approximated from each object's bounding box because footprint rings are not exposed in the current CityJSON scene store.",
        "Sunlight heights use the CityJSON vertical bbox span for each object.",
      ],
    },
    features,
    volumes,
    featureCollection: buildFeatureCollection(features),
  };
}

export function resolveVoxCitySampleSource(): VoxCityResolvedSource {
  let bbox: [number, number, number, number] | null = null;
  for (const feature of SAMPLE_BUILDINGS) {
    bbox = mergeBBoxes(bbox, bboxFromRing(feature.footprint.outer));
  }

  return {
    metadata: {
      id: "voxcity-sample-buildings",
      title: "Sample Buildings",
      kind: "sample",
      runtimeMode: "sample",
      provider: "VoxCity quick start",
      sourceRef: "sample://voxcity/buildings",
      sourceUpdatedAt: null,
      sourceUrl: null,
      crs: null,
      featureCount: SAMPLE_BUILDINGS.length,
      bbox,
      geometryAssumptions: [
        "Deterministic synthetic sample dataset for quick-start onboarding.",
        "Heights resolve from numeric height fields first, then floors, then the default 10 m fallback.",
      ],
    },
    features: SAMPLE_BUILDINGS,
    volumes: buildVolumes(SAMPLE_BUILDINGS),
    featureCollection: buildFeatureCollection(SAMPLE_BUILDINGS),
  };
}

export function selectVoxCityBuildings(
  source: VoxCityResolvedSource,
  selectedBuildingIds: readonly string[],
): VoxCityResolvedSource {
  if (selectedBuildingIds.length === 0) {
    return source;
  }

  const selectedIds = new Set(selectedBuildingIds);
  const features = source.features.filter((feature) => selectedIds.has(feature.id));
  const volumes = source.volumes.filter((volume) => selectedIds.has(volume.id));

  if (features.length === 0 || volumes.length === 0) {
    return source;
  }

  let bbox: [number, number, number, number] | null = null;
  for (const feature of features) {
    bbox = mergeBBoxes(bbox, bboxFromRing(feature.footprint.outer));
  }

  return {
    metadata: {
      ...source.metadata,
      id: `${source.metadata.id}:selection:${features.map((feature) => feature.id).join(",")}`,
      title: `${source.metadata.title} — Selected Buildings`,
      kind: "handoff",
      provider: `${source.metadata.provider} via Building Viewer`,
      featureCount: features.length,
      bbox,
      geometryAssumptions: [
        ...source.metadata.geometryAssumptions,
        "Filtered from the active building selection in Building Viewer before handoff.",
      ],
    },
    features,
    volumes,
    featureCollection: buildFeatureCollection(features),
  };
}

export function buildExtrusionPublicationCollection(
  source: VoxCityResolvedSource,
  buildings: readonly {
    id: string;
    height: number;
    heightSource: string;
    area: number;
  }[],
): GeoJSON.FeatureCollection {
  const buildingLookup = new Map(buildings.map((building) => [building.id, building]));

  return {
    type: "FeatureCollection",
    features: source.featureCollection.features.map((feature) => {
      const buildingId = typeof feature.id === "string" || typeof feature.id === "number"
        ? String(feature.id)
        : typeof feature.properties?.building_id === "string" || typeof feature.properties?.building_id === "number"
          ? String(feature.properties.building_id)
          : "";
      const building = buildingLookup.get(buildingId);

      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          building_id: buildingId,
          extrusion_height_m: building?.height ?? null,
          extrusion_height_source: building?.heightSource ?? null,
          footprint_area: building?.area ?? null,
          voxcity_source_mode: source.metadata.runtimeMode,
          voxcity_source_kind: source.metadata.kind,
          voxcity_source_ref: source.metadata.sourceRef,
        },
      };
    }),
  };
}

export function buildSunlightPublicationCollection(
  source: VoxCityResolvedSource,
  summaries: readonly {
    buildingId: string;
    avgExposureHours: number;
    minExposureHours: number;
    maxExposureHours: number;
    sunlitFraction: number;
  }[],
): GeoJSON.FeatureCollection {
  const summaryLookup = new Map(summaries.map((summary) => [summary.buildingId, summary]));
  const volumeLookup = new Map(source.volumes.map((volume) => [volume.id, volume]));

  return {
    type: "FeatureCollection",
    features: source.featureCollection.features.map((feature) => {
      const buildingId = typeof feature.id === "string" || typeof feature.id === "number"
        ? String(feature.id)
        : typeof feature.properties?.building_id === "string" || typeof feature.properties?.building_id === "number"
          ? String(feature.properties.building_id)
          : "";
      const summary = summaryLookup.get(buildingId);
      const volume = volumeLookup.get(buildingId);

      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          building_id: buildingId,
          height: volume?.height ?? null,
          avgExposureHours: summary?.avgExposureHours ?? null,
          minExposureHours: summary?.minExposureHours ?? null,
          maxExposureHours: summary?.maxExposureHours ?? null,
          sunlitFraction: summary?.sunlitFraction ?? null,
          voxcity_source_mode: source.metadata.runtimeMode,
          voxcity_source_kind: source.metadata.kind,
          voxcity_source_ref: source.metadata.sourceRef,
        },
      };
    }),
  };
}

export const useVoxCityBridgeStore = create<VoxCityBridgeState>((set) => ({
  sunlightHandoff: null,
  setSunlightHandoff: (source, selectedBuildingIds = []) => set({
    sunlightHandoff: {
      source: selectVoxCityBuildings(source, selectedBuildingIds),
      selectedBuildingIds: [...selectedBuildingIds],
      insertedAt: new Date().toISOString(),
    },
  }),
  clearSunlightHandoff: () => set({ sunlightHandoff: null }),
}));