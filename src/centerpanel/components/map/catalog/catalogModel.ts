import type { SourceHandle, SourceRestoreStatus } from "@/services/map/contracts/gisContracts";
import type { ExternalServiceKind } from "@/services/map/ExternalServiceConnector";
import {
  buildConnectionLayerMetadata,
  buildConnectionSourceHandle,
  type ExternalServiceDependencyStatus,
  type ExternalServiceHealth,
  getMapConnectionProvider,
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
  DEMO_PACK_PROVENANCE,
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
  providerLabel?: string;
  endpoint?: string;
  license?: string;
  attribution?: string;
  caveats: string[];
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
  license?: string;
  attribution?: string;
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
  offline: number;
  external: number;
  metadataOnly: number;
  demoSynthetic: number;
}

export interface MapCatalogHealthDescriptor {
  label: string;
  detail: string;
  repairLabel?: string;
  reconnectLabel?: string;
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
    label: "Synthetic Sources",
    emptyLabel: "No synthetic source records.",
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

function resolveProviderLabel(handle: SourceHandle): string | undefined {
  if (handle.kind !== "external") return undefined;
  if (!handle.format) return "External service";
  try {
    return getMapConnectionProvider(handle.format).label;
  } catch {
    return handle.format.toUpperCase();
  }
}

function sourceTitle(handle: SourceHandle, layers: readonly OverlayLayerConfig[]): string {
  const linkedLayer = layers.find((layer) => resolveLayerSourceId(layer) === handle.sourceId);
  return linkedLayer?.name ?? handle.sourceRef ?? handle.sourceId;
}

function actionForHealth(health: MapCatalogHealth): string | undefined {
  const descriptor = mapCatalogHealthDescriptor(health);
  return descriptor.repairLabel || descriptor.reconnectLabel ? descriptor.detail : undefined;
}

export function mapCatalogHealthDescriptor(health: MapCatalogHealth): MapCatalogHealthDescriptor {
  switch (health) {
    case "restored":
      return { label: "Restored", detail: "Local source bytes or trusted source metadata restored for this session." };
    case "live":
      return { label: "Live", detail: "External dependency passed the latest health check." };
    case "cached":
      return { label: "Cached", detail: "External dependency is using a bounded cache result; refresh before publication if stale." };
    case "recoverable":
      return { label: "Recoverable", detail: "Source can be rehydrated from a local cache, worker table, DuckDB table, or URL reference.", reconnectLabel: "Rehydrate" };
    case "unavailable":
      return { label: "Unavailable", detail: "Source bytes are unavailable. Repair source by importing a replacement.", repairLabel: "Repair source" };
    case "external-reference":
      return { label: "External reference", detail: "Catalog stores a secret-free endpoint/reference only; provider bytes are not packaged.", reconnectLabel: "Check provider" };
    case "metadata-only":
      return { label: "Metadata only", detail: "Only metadata is available. Repair source to restore layer data.", repairLabel: "Repair source" };
    case "offline":
      return { label: "Offline", detail: "Service is offline. Reconnect to run a new health check.", reconnectLabel: "Reconnect" };
    case "stale":
      return { label: "Stale", detail: "Service health is stale. Reconnect before analytical use.", reconnectLabel: "Refresh health" };
    case "cors":
      return { label: "CORS blocked", detail: "Browser policy blocked the endpoint. Use a CORS-safe proxy or server-side connector.", reconnectLabel: "Retry check" };
    case "auth":
      return { label: "Auth required", detail: "The provider requires credentials. Use a secured connector; credentials are not stored here.", reconnectLabel: "Retry check" };
    case "rate-limit":
      return { label: "Rate limited", detail: "The provider is rate-limiting requests. Reduce frequency, narrow AOI, or use a mirror.", reconnectLabel: "Retry later" };
    case "unknown":
      return { label: "Unknown", detail: "Health has not been verified in this browser session.", reconnectLabel: "Check health" };
    case "demo":
      return { label: "Demo / synthetic", detail: "Synthetic onboarding source; not observational data." };
    case "untracked":
    default:
      return { label: "Untracked", detail: "No SourceHandle is registered. Repair source metadata before analytical reuse.", repairLabel: "Repair metadata" };
  }
}

export function buildMapCatalogItems(
  sourceHandles: readonly SourceHandle[],
  layers: readonly OverlayLayerConfig[],
): MapCatalogItem[] {
  const items: MapCatalogItem[] = sourceHandles.map((handle) => {
    const linkedLayers = layers.filter((layer) => resolveLayerSourceId(layer) === handle.sourceId);
    const health = resolveHandleHealth(handle, linkedLayers);
    const providerLabel = resolveProviderLabel(handle);
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
      ...(providerLabel ? { providerLabel } : {}),
      ...(handle.sourceRef ? { endpoint: handle.sourceRef } : {}),
      ...(handle.license ? { license: handle.license } : {}),
      ...(handle.attribution ? { attribution: handle.attribution } : {}),
      caveats: [...handle.caveats],
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
      caveats: ["Layer is present, but its durable source record is missing."],
      ...(sourceId ? { sourceId } : {}),
      actionableReason: actionForHealth("untracked"),
      ...(kind === "demo" ? { synthetic: true } : {}),
    });
  }

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
    offline: 0,
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
      item.health === "untracked"
    ) {
      counts.unavailable += 1;
    }
    if (item.health === "offline") {
      counts.offline += 1;
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
