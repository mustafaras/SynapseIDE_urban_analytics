import { create } from "zustand";
import type {
  CatalogAsset,
  CatalogItem,
  COGMetadata,
  SentinelHubProcessResult,
} from "@/services/data/connectors/types";
import type {
  EOAnalysisRasterPayload,
  EOBandMappingEntry,
  EOConnectorActionRecord,
  EODatasetRegistryEntry,
  EOSentinelRequestSnapshot,
  EOPublicationRecord,
  EOSourceKind,
  EOSourceRecord,
  EOSourceRuntimeState,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function buildUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formatDateLabel(value?: string): string {
  if (!value) {
    return "Undated source";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().slice(0, 10);
}

function buildBandMappingFromCount(count: number): EOBandMappingEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `band_${index + 1}`,
    source: `band-${index + 1}`,
    label: `Band ${index + 1}`,
  }));
}

function buildBandMappingFromAssets(assets: CatalogAsset[]): EOBandMappingEntry[] {
  return assets.map((asset) => ({
    key: asset.key,
    source: asset.href,
    label: asset.title,
  }));
}

function deriveResolutionFromCog(metadata: COGMetadata) {
  return {
    x: Math.abs(metadata.transform[1]),
    y: Math.abs(metadata.transform[5]),
    unit: "map-units-per-pixel",
  };
}

function deriveResolutionFromProcess(
  result: Pick<SentinelHubProcessResult, "bbox" | "width" | "height">,
) {
  const [west, south, east, north] = result.bbox;
  return {
    x: Math.abs(east - west) / Math.max(1, result.width),
    y: Math.abs(north - south) / Math.max(1, result.height),
    unit: "degrees-per-pixel",
  };
}

function buildSourceId(prefix: EOSourceKind, suffix: string): string {
  const slug = slugify(suffix);
  return slug ? `${prefix}-${slug}` : `${prefix}-${Date.now()}`;
}

function createBaseSource(params: {
  id: string;
  title: string;
  summary: string;
  kind: EOSourceKind;
  provider: string;
  runtimeState: EOSourceRuntimeState;
  sourceRef: string;
  sourceUrl?: string;
  assetReference?: string;
  bbox: [number, number, number, number];
  crs: string;
  bandMapping: EOBandMappingEntry[];
  resolution?: { x: number; y: number; unit: string };
  timeRange?: { start: string; end: string };
  acquisitionTimestamp?: string;
  isDemo: boolean;
  geometry?: GeoJSON.Geometry | null;
  statusMessage?: string;
  errorMessage?: string;
  parentSourceId?: string;
}): EOSourceRecord {
  const timestamp = nowIso();
  return {
    id: params.id,
    title: params.title,
    summary: params.summary,
    kind: params.kind,
    provider: params.provider,
    runtimeState: params.runtimeState,
    createdAt: timestamp,
    updatedAt: timestamp,
    geometry: params.geometry ?? null,
    provenance: {
      sourceKind: params.kind,
      provider: params.provider,
      sourceRef: params.sourceRef,
      bbox: params.bbox,
      crs: params.crs,
      bandMapping: params.bandMapping,
      isDemo: params.isDemo,
      ...(params.sourceUrl ? { sourceUrl: params.sourceUrl } : {}),
      ...(params.assetReference ? { assetReference: params.assetReference } : {}),
      ...(params.timeRange ? { timeRange: params.timeRange } : {}),
      ...(params.acquisitionTimestamp ? { acquisitionTimestamp: params.acquisitionTimestamp } : {}),
      ...(params.resolution ? { resolution: params.resolution } : {}),
    },
    ...(params.statusMessage ? { statusMessage: params.statusMessage } : {}),
    ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
    ...(params.parentSourceId ? { parentSourceId: params.parentSourceId } : {}),
    publications: [],
  };
}

export function createManualEOSource(params: {
  id?: string;
  title: string;
  summary: string;
  kind: EOSourceKind;
  provider: string;
  runtimeState: EOSourceRuntimeState;
  sourceRef: string;
  sourceUrl?: string;
  assetReference?: string;
  bbox: [number, number, number, number];
  crs: string;
  bandMapping?: EOBandMappingEntry[];
  resolution?: { x: number; y: number; unit: string };
  timeRange?: { start: string; end: string };
  acquisitionTimestamp?: string;
  isDemo?: boolean;
  geometry?: GeoJSON.Geometry | null;
  statusMessage?: string;
  errorMessage?: string;
  parentSourceId?: string;
}): EOSourceRecord {
  return createBaseSource({
    id: params.id ?? buildSourceId(params.kind, `${params.provider}-${params.title}-${Date.now()}`),
    title: params.title,
    summary: params.summary,
    kind: params.kind,
    provider: params.provider,
    runtimeState: params.runtimeState,
    sourceRef: params.sourceRef,
    bbox: params.bbox,
    crs: params.crs,
    bandMapping: params.bandMapping ?? [],
    isDemo: params.isDemo ?? false,
    ...(params.sourceUrl ? { sourceUrl: params.sourceUrl } : {}),
    ...(params.assetReference ? { assetReference: params.assetReference } : {}),
    ...(params.resolution ? { resolution: params.resolution } : {}),
    ...(params.timeRange ? { timeRange: params.timeRange } : {}),
    ...(params.acquisitionTimestamp ? { acquisitionTimestamp: params.acquisitionTimestamp } : {}),
    ...(params.geometry ? { geometry: params.geometry } : {}),
    ...(params.statusMessage ? { statusMessage: params.statusMessage } : {}),
    ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
    ...(params.parentSourceId ? { parentSourceId: params.parentSourceId } : {}),
  });
}

export function createStacItemSource(item: CatalogItem): EOSourceRecord {
  const assetCount = item.assets.length;
  const datetimeValue =
    typeof item.datetime === "string"
      ? item.datetime
      : item.datetime.start;

  return {
    ...createBaseSource({
      id: buildSourceId("stac-item", `${item.provider}-${item.id}`),
      title: `${item.collection || "STAC item"} · ${item.id}`,
      summary: `${assetCount} asset${assetCount === 1 ? "" : "s"} · ${formatDateLabel(datetimeValue)}`,
      kind: "stac-item",
      provider: item.provider,
      runtimeState: "ready",
      sourceRef: item.selfLink ?? item.id,
      bbox: item.bbox,
      crs: item.crs,
      bandMapping: buildBandMappingFromAssets(item.assets),
      ...(typeof item.datetime === "string"
        ? { acquisitionTimestamp: item.datetime }
        : { timeRange: item.datetime }),
      isDemo: false,
      statusMessage: "Catalog item ready for inspection.",
      ...(item.selfLink ? { sourceUrl: item.selfLink } : {}),
      ...(item.gsd != null ? { resolution: { x: item.gsd, y: item.gsd, unit: "meters-per-pixel" } } : {}),
      ...(item.geometry ? { geometry: item.geometry } : {}),
    }),
    stacItem: item,
  };
}

export function createCogSource(params: {
  title?: string;
  provider: string;
  url: string;
  metadata: COGMetadata;
  asset?: CatalogAsset;
  parentSourceId?: string;
  demo?: boolean;
  analysisRaster?: EOAnalysisRasterPayload;
}): EOSourceRecord {
  const bandMapping = params.asset
    ? [{
        key: params.asset.key,
        source: params.asset.href,
        label: params.asset.title,
      }]
    : buildBandMappingFromCount(params.metadata.bandCount);

  return {
    ...createBaseSource({
      id: buildSourceId("cog-asset", params.url),
      title: params.title ?? `COG Asset · ${slugify(params.asset?.key ?? params.url).slice(0, 24)}`,
      summary: `${params.metadata.width}×${params.metadata.height} · ${params.metadata.bandCount} band${params.metadata.bandCount === 1 ? "" : "s"}`,
      kind: "cog-asset",
      provider: params.provider,
      runtimeState: params.demo ? "demo" : "ready",
      sourceRef: params.asset?.key ?? params.url,
      sourceUrl: params.url,
      bbox: params.metadata.bbox,
      crs: params.metadata.crs,
      bandMapping,
      resolution: deriveResolutionFromCog(params.metadata),
      isDemo: params.demo ?? false,
      statusMessage: params.demo ? "Demo raster source ready." : "COG metadata inspected successfully.",
      ...(params.asset?.key ? { assetReference: params.asset.key } : {}),
      ...(params.parentSourceId ? { parentSourceId: params.parentSourceId } : {}),
    }),
    cogMetadata: params.metadata,
    ...(params.asset ? { selectedAsset: params.asset } : {}),
    ...(params.analysisRaster ? { analysisRaster: params.analysisRaster } : {}),
  };
}

export function createSentinelSource(params: {
  title?: string;
  provider?: string;
  request: EOSentinelRequestSnapshot;
  result: Pick<SentinelHubProcessResult, "width" | "height" | "bandCount" | "bbox" | "datetime" | "contentType">;
  bandMapping: EOBandMappingEntry[];
  demo?: boolean;
  analysisRaster?: EOAnalysisRasterPayload;
}): EOSourceRecord {
  const provider = params.provider ?? "sentinel-hub";
  return {
    ...createBaseSource({
      id: buildSourceId("sentinel-process", `${provider}-${params.request.collection ?? "sentinel-2"}-${params.request.datetime.start}`),
      title: params.title ?? `Sentinel Hub · ${params.request.collection ?? "sentinel-2-l2a"}`,
      summary: `${params.result.width}×${params.result.height} · ${params.bandMapping.length} output band${params.bandMapping.length === 1 ? "" : "s"}`,
      kind: "sentinel-process",
      provider,
      runtimeState: params.demo ? "demo" : "ready",
      sourceRef: params.request.collection ?? "sentinel-2-l2a",
      bbox: params.result.bbox,
      crs: params.request.crs ?? "EPSG:4326",
      bandMapping: params.bandMapping,
      resolution: deriveResolutionFromProcess(params.result),
      timeRange: params.result.datetime,
      isDemo: params.demo ?? false,
      statusMessage: params.demo ? "Demo process output ready." : "Sentinel Hub process output ready.",
    }),
    sentinelRequest: params.request,
    sentinelResult: params.result,
    ...(params.analysisRaster ? { analysisRaster: params.analysisRaster } : {}),
  };
}

export function createImportedRasterSource(params: {
  id?: string;
  title: string;
  provider?: string;
  sourceRef: string;
  bbox: [number, number, number, number];
  crs: string;
  bandMapping: EOBandMappingEntry[];
  resolution?: { x: number; y: number; unit: string };
  acquisitionTimestamp?: string;
  layerId?: string;
  fileName?: string;
  geometry?: GeoJSON.Geometry | null;
  demo?: boolean;
  analysisRaster?: EOAnalysisRasterPayload;
}): EOSourceRecord {
  return {
    ...createBaseSource({
      id: params.id ?? buildSourceId("imported-raster", params.title),
      title: params.title,
      summary: params.fileName ?? params.sourceRef,
      kind: "imported-raster",
      provider: params.provider ?? "imported",
      runtimeState: params.demo ? "demo" : "ready",
      sourceRef: params.sourceRef,
      bbox: params.bbox,
      crs: params.crs,
      bandMapping: params.bandMapping,
      isDemo: params.demo ?? false,
      statusMessage: params.demo ? "Demo imported raster ready." : "Imported raster ready for publication.",
      ...(params.resolution ? { resolution: params.resolution } : {}),
      ...(params.acquisitionTimestamp ? { acquisitionTimestamp: params.acquisitionTimestamp } : {}),
      ...(params.geometry ? { geometry: params.geometry } : {}),
    }),
    importedRaster: {
      label: params.title,
      ...(params.layerId ? { layerId: params.layerId } : {}),
      ...(params.fileName ? { fileName: params.fileName } : {}),
    },
    ...(params.analysisRaster ? { analysisRaster: params.analysisRaster } : {}),
  };
}

export function createDemoRasterSource(): EOSourceRecord {
  return {
    ...createBaseSource({
      id: "demo-raster-bosphorus",
      title: "Demo Raster · Bosphorus Multispectral Sample",
      summary: "Synthetic EO sample for operator walkthroughs",
      kind: "demo-raster",
      provider: "demo",
      runtimeState: "demo",
      sourceRef: "demo://bosphorus-multispectral",
      bbox: [28.94, 41.01, 29.045, 41.085],
      crs: "EPSG:4326",
      bandMapping: [
        { key: "red", source: "demo:red", label: "Red" },
        { key: "nir", source: "demo:nir", label: "Near Infrared" },
        { key: "ndvi", source: "demo:ndvi", label: "Derived NDVI" },
      ],
      resolution: { x: 10, y: 10, unit: "meters-per-pixel" },
      acquisitionTimestamp: "2026-03-18T10:15:00Z",
      isDemo: true,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [28.94, 41.01],
          [29.045, 41.01],
          [29.045, 41.085],
          [28.94, 41.085],
          [28.94, 41.01],
        ]],
      },
      statusMessage: "Demo raster source ready.",
    }),
    demoSource: {
      demoId: "bosphorus-multispectral",
      label: "Bosphorus multispectral sample",
    },
  };
}

type RuntimePatch = {
  runtimeState: EOSourceRuntimeState;
  statusMessage?: string;
  errorMessage?: string;
};

export interface EOSourceRegistryState {
  sources: EOSourceRecord[];
  selectedSourceId: string | null;
  datasetEntries: EODatasetRegistryEntry[];
  publications: EOPublicationRecord[];
  connectorActions: EOConnectorActionRecord[];
  upsertSource: (source: EOSourceRecord) => EOSourceRecord;
  removeSource: (id: string) => void;
  selectSource: (id: string | null) => void;
  updateSourceRuntime: (id: string, patch: RuntimePatch) => void;
  registerStacItems: (items: CatalogItem[]) => EOSourceRecord[];
  registerCogSource: (params: Parameters<typeof createCogSource>[0]) => EOSourceRecord;
  registerSentinelSource: (params: Parameters<typeof createSentinelSource>[0]) => EOSourceRecord;
  registerImportedSource: (params: Parameters<typeof createImportedRasterSource>[0]) => EOSourceRecord;
  registerDemoSource: () => EOSourceRecord;
  upsertDatasetEntry: (entry: EODatasetRegistryEntry) => void;
  recordPublication: (publication: Omit<EOPublicationRecord, "id" | "publishedAt"> & Partial<Pick<EOPublicationRecord, "id" | "publishedAt">>) => EOPublicationRecord;
  recordConnectorAction: (action: Omit<EOConnectorActionRecord, "id" | "createdAt"> & Partial<Pick<EOConnectorActionRecord, "id" | "createdAt">>) => EOConnectorActionRecord;
  clear: () => void;
  getSelectedSource: () => EOSourceRecord | null;
}

function upsertById<T extends { id: string }>(collection: T[], value: T): T[] {
  const existingIndex = collection.findIndex((entry) => entry.id === value.id);
  if (existingIndex === -1) {
    return [...collection, value];
  }
  return collection.map((entry, index) => (index === existingIndex ? value : entry));
}

export const useEOSourceStore = create<EOSourceRegistryState>()((set, get) => ({
  sources: [],
  selectedSourceId: null,
  datasetEntries: [],
  publications: [],
  connectorActions: [],
  upsertSource: (source) => {
    let nextSource = source;
    set((state) => {
      const existing = state.sources.find((entry) => entry.id === source.id);
      nextSource = {
        ...(existing ?? source),
        ...source,
        createdAt: existing?.createdAt ?? source.createdAt,
        updatedAt: nowIso(),
        publications: source.publications.length > 0 ? source.publications : (existing?.publications ?? []),
      };
      return {
        sources: upsertById(state.sources, nextSource),
      };
    });
    return nextSource;
  },
  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((entry) => entry.id !== id),
      selectedSourceId: state.selectedSourceId === id ? null : state.selectedSourceId,
    })),
  selectSource: (id) => set({ selectedSourceId: id }),
  updateSourceRuntime: (id, patch) =>
    set((state) => ({
      sources: state.sources.map((source) =>
        source.id === id
          ? {
              ...source,
              runtimeState: patch.runtimeState,
              updatedAt: nowIso(),
              ...(
                patch.statusMessage
                  ? { statusMessage: patch.statusMessage }
                  : source.statusMessage
                    ? { statusMessage: source.statusMessage }
                    : {}
              ),
              ...(
                patch.errorMessage
                  ? { errorMessage: patch.errorMessage }
                  : source.errorMessage
                    ? { errorMessage: source.errorMessage }
                    : {}
              ),
            }
          : source,
      ),
    })),
  registerStacItems: (items) => {
    const registered = items.map((item) => createStacItemSource(item));
    set((state) => ({
      sources: registered.reduce((sources, item) => upsertById(sources, item), state.sources),
      selectedSourceId: registered[0]?.id ?? state.selectedSourceId,
    }));
    return registered;
  },
  registerCogSource: (params) => {
    const source = createCogSource(params);
    get().upsertSource(source);
    set({ selectedSourceId: source.id });
    return source;
  },
  registerSentinelSource: (params) => {
    const source = createSentinelSource(params);
    get().upsertSource(source);
    set({ selectedSourceId: source.id });
    return source;
  },
  registerImportedSource: (params) => {
    const source = createImportedRasterSource(params);
    get().upsertSource(source);
    set({ selectedSourceId: source.id });
    return source;
  },
  registerDemoSource: () => {
    const source = createDemoRasterSource();
    get().upsertSource(source);
    set({ selectedSourceId: source.id });
    return source;
  },
  upsertDatasetEntry: (entry) =>
    set((state) => ({
      datasetEntries: upsertById(state.datasetEntries, entry),
    })),
  recordPublication: (publication) => {
    const nextPublication: EOPublicationRecord = {
      id: publication.id ?? buildUniqueId("eo-publication"),
      publishedAt: publication.publishedAt ?? nowIso(),
      sourceId: publication.sourceId,
      target: publication.target,
      label: publication.label,
    };

    set((state) => ({
      publications: upsertById(state.publications, nextPublication),
      sources: state.sources.map((source) =>
        source.id === publication.sourceId
          ? {
              ...source,
              publications: upsertById(source.publications, nextPublication),
              updatedAt: nowIso(),
            }
          : source,
      ),
    }));

    return nextPublication;
  },
  recordConnectorAction: (action) => {
    const nextAction: EOConnectorActionRecord = {
      id: action.id ?? buildUniqueId("eo-action"),
      createdAt: action.createdAt ?? nowIso(),
      provider: action.provider,
      actionKind: action.actionKind,
      runtimeState: action.runtimeState,
      summary: action.summary,
      ...(action.envelopeKind ? { envelopeKind: action.envelopeKind } : {}),
      ...(action.sourceId ? { sourceId: action.sourceId } : {}),
      ...(action.relatedSourceIds?.length ? { relatedSourceIds: action.relatedSourceIds } : {}),
      ...(action.sourceRef ? { sourceRef: action.sourceRef } : {}),
      ...(action.detail ? { detail: action.detail } : {}),
    };

    set((state) => ({
      connectorActions: [nextAction, ...state.connectorActions].slice(0, 100),
    }));

    return nextAction;
  },
  clear: () =>
    set({
      sources: [],
      selectedSourceId: null,
      datasetEntries: [],
      publications: [],
      connectorActions: [],
    }),
  getSelectedSource: () => {
    const { sources, selectedSourceId } = get();
    return sources.find((source) => source.id === selectedSourceId) ?? null;
  },
}));

export function getSelectedEOSource(): EOSourceRecord | null {
  return useEOSourceStore.getState().getSelectedSource();
}

export function getSelectedRasterSourceForAnalysis(): EOSourceRecord | null {
  return getSelectedEOSource();
}
