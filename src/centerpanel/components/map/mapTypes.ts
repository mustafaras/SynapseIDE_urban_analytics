/* ================================================================== */
/*  Shared types and constants for Map Explorer sub-components         */
/* ================================================================== */

import type maplibregl from "maplibre-gl";
import type {
  AnalysisEngineId,
  AnalysisVisualizationSpec,
  StatisticalSummaryValue,
} from "@/features/urbanAnalytics/lib/types";
import type { EOLayerContextMetadata } from "@/services/data/eo/types";

export type BaseLayerId = "streets" | "satellite" | "dark" | "terrain";

export type MapExplorerMode = "embedded" | "modal" | "presentation";

export interface MapPin {
  id: string;
  lng: number;
  lat: number;
  label?: string;
}

export interface BaseLayerConfig {
  name: string;
  url: string | maplibregl.StyleSpecification;
}

/** Viewport state persisted across modal close/reopen cycles */
export interface ViewportState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

/** Metadata about an overlay layer (lightweight — safe to persist) */
export interface AnalysisResultMetadata {
  engine: AnalysisEngineId;
  runId?: string;
  runTimestamp: string;
  parameterSummary: string;
  inputParameters: Record<string, unknown>;
  statisticalSummary: Record<string, StatisticalSummaryValue>;
  sourceLayerIds?: string[];
  sourceDataVersion?: string;
  rerunToken?: string;
  stale?: boolean;
  visualization: AnalysisVisualizationSpec;
}

export interface DatasetLayerContextMetadata {
  datasetId?: string;
  datasetTitle?: string;
  datasetCity?: string;
  layerId?: string;
  layerTitle?: string;
  source?: string;
  license?: string;
  crs?: string;
  updateDate?: string;
  thematicCoverage?: string[];
  spatialExtent?: string;
  schemaSummary?: string[];
  packageLayerCount?: number;
  packageFeatureCount?: number;
}

export interface ColumnarLayerMetadata {
  format: "arrow" | "geoparquet";
  geometryColumn?: string;
  geometryEncoding?: "wkb" | "geojson" | "wkt" | "lonlat" | "coordinates";
  rowCount?: number;
  estimatedMemoryBytes?: number;
  transferSizeBytes?: number;
  workerTableName?: string;
  geoParquetVersion?: string;
  geometryTypes?: string[];
  crs?: string;
}

export interface ExternalServiceLayerMetadata {
  kind: "wms" | "wmts" | "wfs" | "xyz" | "overpass" | "cityjson";
  endpoint: string;
  title?: string;
  serviceVersion?: string;
  layerName?: string;
  urlTemplate?: string;
  bounds?: [number, number, number, number];
  crs?: string;
  refreshedAt?: string;
}

export interface LayerCartographyReviewMetadata {
  status: "unchecked" | "needs-review" | "reviewed";
  reviewedAt?: string;
  recommendationIds: string[];
  appliedRecommendationIds: string[];
  dismissedRecommendationIds?: string[];
  lastAppliedTitle?: string;
  legendPersisted?: boolean;
}

export interface LayerMetadata {
  featureCount?: number;
  geometryType?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  fields?: string[];
  importFormat?: "geojson" | "csv" | "arrow" | "geoparquet" | "kml" | "kmz" | "gpx";
  updatedAt?: string;
  dataVersion?: string;
  analysisResult?: AnalysisResultMetadata;
  datasetContext?: DatasetLayerContextMetadata;
  columnar?: ColumnarLayerMetadata;
  eoSource?: EOLayerContextMetadata;
  externalService?: ExternalServiceLayerMetadata;
  scientificQA?: LayerScientificQAMetadata;
  cartographyReview?: LayerCartographyReviewMetadata;
}

export interface LayerProvenance {
  label: string;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  attribution?: string;
  method?: string;
  collectedAt?: string;
  generatedAt?: string;
  sourceLayerIds?: string[];
  notes?: string[];
}

export type LayerQaStatus = "unchecked" | "passed" | "warning" | "error";

export type LayerSourceKind = "project" | "imported" | "external" | "derived" | "demo";

export type LayerScientificQABadge =
  | "invalid_geometry"
  | "missing_crs"
  | "sample_data"
  | "stale_result"
  | "uncertain_output";

export interface LayerScientificQAMetadata {
  status: LayerQaStatus;
  issueIds: string[];
  badges: LayerScientificQABadge[];
  checkedAt: string;
  featureIssueCount: number;
  usedWorker: boolean;
  caveats: string[];
  signature: string;
}

export interface MapLayerRegistryLayerSummary {
  layerId: string;
  name: string;
  layerType: OverlayLayerConfig["type"];
  group: LayerGroupId;
  visible: boolean;
  opacity: number;
  sourceKind?: LayerSourceKind;
  qaStatus?: LayerQaStatus;
  queryable: boolean;
  crs?: string;
  featureCount?: number;
  provenanceLabel?: string;
}

export type MapLayerRegistryOperation =
  | "add"
  | "remove"
  | "toggle"
  | "opacity"
  | "update"
  | "reorder"
  | "replace";

export interface MapLayerRegistryChangeDetail {
  operation: MapLayerRegistryOperation;
  layerId?: string;
  layers: MapLayerRegistryLayerSummary[];
  previousLayers: MapLayerRegistryLayerSummary[];
  timestamp: string;
}

export const MAP_LAYER_REGISTRY_EVENT = "synapse-map-layer-registry-change";

/** Overlay geometry type hint for UI icons */
export type OverlayGeometryType = "point" | "line" | "polygon" | "mixed" | "unknown";

/** Layer group categories for the layer manager UI */
export type LayerGroupId = "base" | "data" | "analysis" | "voxcity";

/** Runtime source payload for overlay layers */
export type OverlaySourceData =
  | string
  | GeoJSON.FeatureCollection
  | GeoJSON.Feature
  | GeoJSON.Geometry;

/** Overlay layer configuration (kept in-memory; not persisted to localStorage) */
export interface OverlayLayerConfig {
  id: string;
  name: string;
  type: "geojson" | "heatmap" | "raster-tile" | "vector-tile";
  visible: boolean;
  opacity: number;
  sourceData?: OverlaySourceData;
  style?: Record<string, unknown>;
  metadata?: LayerMetadata;
  provenance?: LayerProvenance;
  qaStatus?: LayerQaStatus;
  queryable?: boolean;
  sourceKind?: LayerSourceKind;
  group?: LayerGroupId;
}

/** Active tool types for the map toolbar */
export type MapToolId = "select" | "pin" | "draw" | "measure" | "annotate" | null;

/* ================================================================== */
/*  Bookmarks and annotations (Prompt 23)                              */
/* ================================================================== */

export const MAP_BOOKMARK_LIMIT = 50;
export const MAP_ANNOTATION_LIMIT = 200;

export const MAP_ANNOTATION_COLOR_PALETTE = [
  "#F59E0B",
  "#F9FAFB",
  "#22C55E",
  "#38BDF8",
  "#A78BFA",
  "#F43F5E",
] as const;

export interface MapBookmark {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  layers: string[];
  timestamp: string;
  activeVisualization?: string | null;
}

export interface MapAnnotationStyleSettings {
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  rotation: number;
  hasBackground: boolean;
  leaderLine: boolean;
}

export interface MapAnnotationProperties extends MapAnnotationStyleSettings {
  text: string;
  createdAt: string;
  updatedAt: string;
  leaderTarget?: [number, number] | null;
}

export interface MapAnnotation extends GeoJSON.Feature<GeoJSON.Point, MapAnnotationProperties> {
  id: string;
}

/* ================================================================== */
/*  Drawing types (Prompt 05)                                          */
/* ================================================================== */

/** Drawing sub-tool identifiers */
export type DrawToolId = "point" | "linestring" | "polygon" | "rectangle" | "circle";

/* ================================================================== */
/*  Measurement types (Prompt 06)                                      */
/* ================================================================== */

/** Measurement sub-tool identifiers */
export type MeasureToolId = "measure-distance" | "measure-area";

/** Supported measurement unit systems */
export type MeasureUnit = "metric" | "imperial";

/** A completed measurement stored in the Zustand store */
export interface Measurement {
  id: string;
  type: MeasureToolId;
  coordinates: [number, number][];
  value: number; // metres or m²
  label: string;
  timestamp: string;
}

/** Custom style overrides for a drawn feature */
export interface FeatureStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

/** A single user-drawn feature stored in the Zustand store */
export interface DrawnFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: {
    label: string;
    createdAt: string;
    style?: FeatureStyle;
  };
}

/* ================================================================== */
/*  Pending fit-bounds request (typed cross-module sync contract)      */
/* ================================================================== */

/**
 * Durable, typed request for the Map Explorer canvas to fit a target extent.
 *
 * This contract replaces ad-hoc `synapse:map:fitBounds` window events for
 * Urban Analytics study-area sync, so a request is not lost when Map
 * Explorer opens after the request was issued. Map Explorer consumes the
 * latest pending request when its canvas becomes ready.
 */
export interface PendingFitBoundsRequest {
  /** [west, south, east, north] in EPSG:4326 display coordinates. */
  bounds: [number, number, number, number];
  /** Source/origin tag for telemetry and debugging. */
  source: string;
  /** Optional Map Explorer AOI feature id this fit is associated with. */
  aoiId?: string;
  /** Stable monotonic ID so subscribers can detect a new request even
   *  when the same bounds are re-requested. */
  requestId: string;
  /** ISO timestamp when the request was queued. */
  requestedAt: string;
}

export interface PendingFitBoundsRequestInput {
  bounds: [number, number, number, number];
  source: string;
  aoiId?: string;
}

/* ================================================================== */
/*  Temporal player types (Prompt 15)                                  */
/* ================================================================== */

/** Supported playback speed multipliers */
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/** Temporal data mode */
export type TemporalMode = "snapshot" | "continuous";

/** Time range bounds for the temporal player */
export interface TemporalTimeRange {
  start: number; // normalised index (0-based)
  end: number;   // normalised index (exclusive)
}

export const BASE_STYLES: Record<BaseLayerId, BaseLayerConfig> = {
  streets: {
    name: "OpenStreetMap",
    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  },
  dark: {
    name: "Dark Matter",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  satellite: {
    name: "Satellite",
    url: {
      version: 8,
      name: "Satellite",
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri, Maxar, Earthstar Geographics",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "esri-satellite-layer",
          type: "raster",
          source: "esri-satellite",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    } as maplibregl.StyleSpecification,
  },
  terrain: {
    name: "Positron",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
};
