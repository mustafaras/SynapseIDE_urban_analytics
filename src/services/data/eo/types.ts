import type { DatasetLayerContextMetadata, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { CompletedAnalysisRun, DataOutput, MapOutput } from "@/features/urbanAnalytics/lib/types";
import type {
  BBox,
  CatalogAsset,
  CatalogItem,
  COGMetadata,
  SentinelHubProcessResult,
  TimeInterval,
} from "@/services/data/connectors/types";

export type EOSourceKind =
  | "stac-item"
  | "cog-asset"
  | "sentinel-process"
  | "imported-raster"
  | "demo-raster";

export type EOSourceRuntimeState =
  | "ready"
  | "loading"
  | "failed"
  | "credential-missing"
  | "demo";

export type EOQueryEnvelopeKind =
  | "project-extent"
  | "current-map-bbox"
  | "custom-bbox";

export type EOSourcePublicationTarget =
  | "map-layer"
  | "dataset-entry"
  | "completed-run";

export type EOConnectorActionKind =
  | "demo-load"
  | "stac-search"
  | "stac-select"
  | "cog-inspect"
  | "cog-sample-read"
  | "sentinel-catalog-search"
  | "sentinel-process"
  | "publication";

export interface EOBandMappingEntry {
  key: string;
  source: string;
  label: string;
}

export interface EOResolution {
  x: number;
  y: number;
  unit: string;
}

export interface EOAnalysisRasterPayload {
  width: number;
  height: number;
  bandCount: number;
  bbox: BBox;
  data: Float64Array[];
  noData?: (number | null)[];
}

export interface EOSourceProvenance {
  sourceKind: EOSourceKind;
  provider: string;
  sourceRef: string;
  sourceUrl?: string;
  assetReference?: string;
  bbox: BBox;
  timeRange?: TimeInterval;
  acquisitionTimestamp?: string;
  crs: string;
  resolution?: EOResolution;
  bandMapping: EOBandMappingEntry[];
  isDemo: boolean;
}

export interface EOLayerContextMetadata {
  sourceId: string;
  sourceKind: EOSourceKind;
  provider: string;
  sourceRef: string;
  sourceUrl?: string;
  bbox: BBox;
  timeLabel?: string;
  crs: string;
  resolutionLabel?: string;
  bandSummary: string[];
  isDemo: boolean;
}

export interface EOSentinelRequestSnapshot {
  bbox: BBox;
  datetime: TimeInterval;
  width: number;
  height: number;
  collection?: string;
  crs?: string;
}

export interface EODatasetRegistryEntry extends EOLayerContextMetadata {
  id: string;
  title: string;
  registeredAt: string;
  datasetContext: DatasetLayerContextMetadata;
}

export interface EOQueryEnvelope {
  kind: EOQueryEnvelopeKind;
  label: string;
  bbox: BBox;
  available: boolean;
  sourceLabel: string;
  updatedAt?: string;
}

export interface EOPublicationRecord {
  id: string;
  sourceId: string;
  target: EOSourcePublicationTarget;
  publishedAt: string;
  label: string;
}

export interface EOConnectorActionRecord {
  id: string;
  provider: string;
  actionKind: EOConnectorActionKind;
  runtimeState: EOSourceRuntimeState;
  summary: string;
  createdAt: string;
  envelopeKind?: EOQueryEnvelopeKind;
  sourceId?: string;
  relatedSourceIds?: string[];
  sourceRef?: string;
  detail?: Record<string, string | number | boolean | null>;
}

export interface EOSourcePublicationArtifacts {
  layer: OverlayLayerConfig;
  datasetEntry: EODatasetRegistryEntry;
  completedRun: CompletedAnalysisRun;
  mapOutput: MapOutput;
  dataOutput: DataOutput;
}

export interface EOSourceRecord {
  id: string;
  title: string;
  summary: string;
  kind: EOSourceKind;
  provider: string;
  runtimeState: EOSourceRuntimeState;
  createdAt: string;
  updatedAt: string;
  provenance: EOSourceProvenance;
  geometry: GeoJSON.Geometry | null;
  parentSourceId?: string;
  statusMessage?: string;
  errorMessage?: string;
  stacItem?: CatalogItem;
  selectedAsset?: CatalogAsset;
  cogMetadata?: COGMetadata;
  sentinelRequest?: EOSentinelRequestSnapshot;
  sentinelResult?: Pick<SentinelHubProcessResult, "width" | "height" | "bandCount" | "bbox" | "datetime" | "contentType">;
  importedRaster?: {
    label: string;
    layerId?: string;
    fileName?: string;
  };
  analysisRaster?: EOAnalysisRasterPayload;
  demoSource?: {
    demoId: string;
    label: string;
  };
  publications: EOPublicationRecord[];
}
