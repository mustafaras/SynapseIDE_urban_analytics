import type { SourceHandle, SourceRestoreStatus } from "@/services/map/contracts/gisContracts";
import type { ExternalServiceKind } from "@/services/map/ExternalServiceConnector";
import {
  buildConnectionLayerMetadata,
  buildConnectionSourceHandle,
  getMapConnectionProvider,
  type ExternalServiceDependencyStatus,
  type ExternalServiceHealth,
  type MapConnectionDescriptor,
} from "@/services/map/sources/MapConnectionRegistry";
import {
  applySourceHandleToLayer,
  createImportSourceHandle,
  estimateSourcePayloadBytes,
  resolveLayerSourceId,
} from "@/services/map/sources/MapSourceRegistry";
import {
  createMapExplorerDemoLayerPack,
  DEMO_PACK_ID,
  DEMO_PACK_PROVENANCE,
  DEMO_PACK_TITLE,
} from "../demoDataPacks";
import { resolveOverlayLayerCrsSummary } from "../mapLayerMetadata";
import type { LayerSourceKind, OverlayLayerConfig } from "../mapTypes";

export type MapCatalogCategoryId =
  | "project-sources"
  | "imported-files"
  | "external-services"
  | "worker-database"
  | "generated-outputs"
  | "demo-packs";

export type MapCatalogHealth =
  | SourceRestoreStatus
  | ExternalServiceDependencyStatus
  | "demo"
  | "untracked";

export interface MapCatalogCategory {
  id: MapCatalogCategoryId;
  label: string;
  emptyLabel: string;
}

export interface MapCatalogItem {
  id: string;
  category: MapCatalogCategoryId;
  title: string;
  summary: string;
  health: MapCatalogHealth;
  sourceKind: LayerSourceKind;
  layerIds: string[];
  sourceHandle?: SourceHandle;
  sourceId?: string;
  actionableReason?: string;
  synthetic?: boolean;
  template?: "demo-pack";
}

export interface MapCatalogLayerInsertion {
  layers: OverlayLayerConfig[];
  sourceHandles: SourceHandle[];
}

export interface MapCatalogConnectionDraft {
  serviceKind: Exclude<ExternalServiceKind, "cityjson">;
  title: string;
  endpoint: string;
  urlTemplate?: string;
  crs?: string;
}

export interface MapCatalogActionResult {
  ok: boolean;
  message: string;
  status?: MapCatalogHealth;
}

export interface MapCatalogConnectionLayerResult {
  layer: OverlayLayerConfig;
  sourceHandle: SourceHandle;
}

export interface MapSourceReadinessCounts {
  restoredLive: number;
  recoverable: number;
  unavailable: number;
  external: number;
  metadataOnly: number;
  demoSynthetic: number;
}

export const MAP_CATALOG_CATEGORIES: readonly MapCatalogCategory[] = [
  {
    id: "project-sources",
    label: "Project Sources",
    emptyLabel: "No project source records.",
  },
  {
    id: "imported-files",
    label: "Imported Files",
    emptyLabel: "No imported files.",
  },
  {
    id: "external-services",
    label: "External Services",
    emptyLabel: "No registered service connections.",
  },
  {
    id: "worker-database",
    label: "Worker / DuckDB",
    emptyLabel: "No worker-backed or DuckDB sources.",
  },
  {
    id: "generated-outputs",
    label: "Generated Outputs",
    emptyLabel: "No derived outputs.",
  },
  {
    id: "demo-packs",
    label: "Demo Packs",
    emptyLabel: "No demo data packs.",
  },
] as const;

function resolveCategory(kind: LayerSourceKind, handle?: SourceHandle): MapCatalogCategoryId {
  if (kind === "demo") return "demo-packs";
  if (kind === "external") return "external-services";
  if (kind === "derived") return "generated-outputs";
  if (handle?.storageMode === "worker-table" || handle?.storageMode === "duckdb-table") {
    return "worker-database";
  }
  if (kind === "imported") return "imported-files";
  return "project-sources";
}

function resolveHandleHealth(
  handle: SourceHandle,
  layers: readonly OverlayLayerConfig[],
): MapCatalogHealth {
  if (handle.kind === "demo") return "demo";
  if (handle.kind !== "external") return handle.restoreStatus;
  const linkedServiceLayer = layers.find((layer) =>
    resolveLayerSourceId(layer) === handle.sourceId && layer.metadata?.externalService,
  );
  return linkedServiceLayer?.metadata?.externalService?.dependencyStatus ?? handle.restoreStatus;
}

function describeSource(handle: SourceHandle, layerCount: number): string {
  const format = handle.format?.toUpperCase() ?? handle.storageMode.replaceAll("-", " ");
  const count = handle.featureCount == null ? "feature count unknown" : `${handle.featureCount.toLocaleString()} features`;
  return `${format}; ${count}; ${layerCount} layer${layerCount === 1 ? "" : "s"}.`;
}

function sourceTitle(handle: SourceHandle, layers: readonly OverlayLayerConfig[]): string {
  const linkedLayer = layers.find((layer) => resolveLayerSourceId(layer) === handle.sourceId);
  return linkedLayer?.name ?? handle.sourceRef ?? handle.sourceId;
}

function actionForHealth(health: MapCatalogHealth): string | undefined {
  switch (health) {
    case "offline":
      return "Service is offline. Reconnect to run a new health check.";
    case "stale":
      return "Service health is stale. Reconnect before analytical use.";
    case "unavailable":
      return "Source bytes are unavailable. Repair source by importing a replacement.";
    case "metadata-only":
      return "Only metadata is available. Repair source to restore layer data.";
    case "untracked":
      return "No SourceHandle is registered. Repair source metadata before analytical reuse.";
    default:
      return undefined;
  }
}

export function buildMapCatalogItems(
  sourceHandles: readonly SourceHandle[],
  layers: readonly OverlayLayerConfig[],
): MapCatalogItem[] {
  const items: MapCatalogItem[] = sourceHandles.map((handle) => {
    const linkedLayers = layers.filter((layer) => resolveLayerSourceId(layer) === handle.sourceId);
    const health = resolveHandleHealth(handle, linkedLayers);
    return {
      id: `source-${handle.sourceId}`,
      category: resolveCategory(handle.kind, handle),
      title: sourceTitle(handle, linkedLayers),
      summary: describeSource(handle, linkedLayers.length),
      health,
      sourceKind: handle.kind,
      layerIds: linkedLayers.map((layer) => layer.id),
      sourceHandle: handle,
      sourceId: handle.sourceId,
      ...(actionForHealth(health) ? { actionableReason: actionForHealth(health) } : {}),
      ...(handle.kind === "demo" ? { synthetic: true } : {}),
    };
  });
  const knownSourceIds = new Set(sourceHandles.map((handle) => handle.sourceId));

  for (const layer of layers) {
    const sourceId = resolveLayerSourceId(layer);
    if (sourceId && knownSourceIds.has(sourceId)) continue;
    const kind = layer.sourceKind ?? "project";
    items.push({
      id: `untracked-${layer.id}`,
      category: resolveCategory(kind),
      title: layer.name,
      summary: "Layer is present, but its durable source record is missing.",
      health: "untracked",
      sourceKind: kind,
      layerIds: [layer.id],
      ...(sourceId ? { sourceId } : {}),
      actionableReason: actionForHealth("untracked"),
      ...(kind === "demo" ? { synthetic: true } : {}),
    });
  }

  items.push({
    id: `template-${DEMO_PACK_ID}`,
    category: "demo-packs",
    title: DEMO_PACK_TITLE,
    summary: DEMO_PACK_PROVENANCE,
    health: "demo",
    sourceKind: "demo",
    layerIds: [],
    synthetic: true,
    template: "demo-pack",
  });
  return items;
}

export function buildMapSourceReadinessCounts(
  sourceHandles: readonly SourceHandle[],
  layers: readonly OverlayLayerConfig[],
): MapSourceReadinessCounts {
  const counts: MapSourceReadinessCounts = {
    restoredLive: 0,
    recoverable: 0,
    unavailable: 0,
    external: 0,
    metadataOnly: 0,
    demoSynthetic: 0,
  };
  const items = buildMapCatalogItems(sourceHandles, layers).filter((item) => item.template !== "demo-pack");

  for (const item of items) {
    if (item.health === "restored" || item.health === "live" || item.health === "cached") {
      counts.restoredLive += 1;
    }
    if (item.health === "recoverable") {
      counts.recoverable += 1;
    }
    if (
      item.health === "unavailable" ||
      item.health === "offline" ||
      item.health === "untracked"
    ) {
      counts.unavailable += 1;
    }
    if (item.sourceKind === "external" || item.sourceHandle?.kind === "external") {
      counts.external += 1;
    }
    if (item.health === "metadata-only" || item.sourceHandle?.storageMode === "metadata-only") {
      counts.metadataOnly += 1;
    }
    if (item.synthetic || item.sourceKind === "demo" || item.sourceHandle?.kind === "demo") {
      counts.demoSynthetic += 1;
    }
  }

  return counts;
}

export function buildDemoPackCatalogInsertion(
  createdAt: string = new Date().toISOString(),
): MapCatalogLayerInsertion {
  const layers = createMapExplorerDemoLayerPack(createdAt);
  const sourceHandles: SourceHandle[] = [];
  const linkedLayers = layers.map((layer) => {
    const handle = createImportSourceHandle({
      layer,
      format: "geojson",
      ...(estimateSourcePayloadBytes(layer.sourceData) != null
        ? { sourceSizeBytes: estimateSourcePayloadBytes(layer.sourceData) }
        : {}),
      profiledAt: createdAt,
      caveats: [DEMO_PACK_PROVENANCE],
    });
    sourceHandles.push(handle);
    return applySourceHandleToLayer(layer, handle);
  });
  return { layers: linkedLayers, sourceHandles };
}

export function buildCatalogConnectionLayer(
  descriptor: MapConnectionDescriptor,
  health: ExternalServiceHealth,
): MapCatalogConnectionLayerResult {
  const provider = getMapConnectionProvider(descriptor.providerId);
  const sourceHandle = buildConnectionSourceHandle(descriptor, health);
  const metadata = buildConnectionLayerMetadata(descriptor, health);
  const layer: OverlayLayerConfig = {
    id: `catalog-layer-${descriptor.sourceId}`,
    name: descriptor.layerName ?? descriptor.title ?? `${provider.label} connection`,
    type: provider.raster ? "raster-tile" : "geojson",
    visible: health.dependencyStatus !== "offline" && (provider.raster ? Boolean(descriptor.urlTemplate) : false),
    opacity: 1,
    ...(provider.raster && descriptor.urlTemplate ? { sourceData: descriptor.urlTemplate } : {}),
    sourceKind: "external",
    group: "data",
    queryable: false,
    qaStatus: health.dependencyStatus === "offline" ? "error" : "warning",
    metadata: {
      externalService: metadata,
      crsSummary: sourceHandle.crsSummary,
      ...(descriptor.license || descriptor.attribution
        ? {
            licenseAttribution: {
              license: descriptor.license ?? "unknown",
              attribution: descriptor.attribution ?? "External service attribution not supplied.",
              sourceName: descriptor.title ?? provider.label,
              requiresAttribution: true,
              source: "external-service",
              notes: sourceHandle.caveats,
            },
          }
        : {}),
    },
  };
  return { layer: applySourceHandleToLayer(layer, sourceHandle), sourceHandle };
}

export function attachSourceHandleToExternalLayer(
  layer: OverlayLayerConfig,
  profiledAt: string = new Date().toISOString(),
): MapCatalogConnectionLayerResult {
  const externalService = layer.metadata?.externalService;
  const sourceId = resolveLayerSourceId(layer) ?? `source-${layer.id}`;
  const sourceHandle: SourceHandle = {
    sourceId,
    kind: "external",
    storageMode: "external-service",
    restoreStatus: "external-reference",
    crsSummary: resolveOverlayLayerCrsSummary(layer),
    featureCount: layer.metadata?.featureCount ?? layer.metadata?.geometrySummary?.featureCount ?? null,
    ...(externalService?.endpoint ? { sourceRef: externalService.endpoint } : {}),
    ...(externalService?.license ? { license: externalService.license } : {}),
    ...(externalService?.attribution ? { attribution: externalService.attribution } : {}),
    caveats: externalService?.caveats ?? ["External service availability must be checked before analytical use."],
    profiledAt: externalService?.refreshedAt ?? profiledAt,
  };
  return { layer: applySourceHandleToLayer(layer, sourceHandle), sourceHandle };
}
