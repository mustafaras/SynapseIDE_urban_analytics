import React, { useCallback, useMemo, useState } from "react";
import { useProjectRegistryOptional } from "@/centerpanel/registry/state";
import { cogMetadata, cogRead } from "@/services/data/connectors/COGReader";
import { stacSearch } from "@/services/data/connectors/STACClient";
import {
  ensureToken,
  fetchB04,
  fetchB08,
  fetchBands,
  fetchNDVI,
  isTokenValid,
  searchCatalog,
} from "@/services/data/connectors/SentinelHubConnector";
import type {
  BBox,
  CatalogAsset,
  CatalogItem,
  COGMetadata,
  SentinelHubToken,
} from "@/services/data/connectors/types";
import {
  buildEOSourcePublicationArtifacts,
  computeCogWindowBBox,
  createManualEOSource,
  useEOSourceStore,
} from "@/services/data/eo";
import type {
  EOBandMappingEntry,
  EOConnectorActionKind,
  EOQueryEnvelope,
  EOQueryEnvelopeKind,
  EOSourceRecord,
  EOSourceRuntimeState,
} from "@/services/data/eo";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import styles from "../../styles/tools.module.css";

const DEFAULT_STAC_ENDPOINT = "https://planetarycomputer.microsoft.com/api/stac/v1";
const DEFAULT_COLLECTIONS = "sentinel-2-l2a";
const DEFAULT_START = "2026-03-01T00:00:00Z";
const DEFAULT_END = "2026-03-31T23:59:59Z";
const DEFAULT_MAX_CLOUD = "20";

type SentinelMode = "ndvi" | "b04" | "b08" | "b04-b08";

interface COGSamplePreview {
  width: number;
  height: number;
  min: number;
  max: number;
  mean: number;
  sampleValues: number[];
}

interface COGInspectionState {
  sourceId: string;
  sourceTitle: string;
  url: string;
  metadata: COGMetadata;
  preview: COGSamplePreview | null;
  sampleMessage: string | null;
}

function formatBBox(bbox: readonly [number, number, number, number]): string {
  return `[${bbox.map((value) => value.toFixed(4)).join(", ")}]`;
}

function formatStateLabel(source: Pick<EOSourceRecord, "runtimeState">): string {
  return source.runtimeState === "credential-missing"
    ? "credential-missing"
    : source.runtimeState;
}

function formatTimeLabel(source: EOSourceRecord): string {
  if (source.provenance.timeRange) {
    return `${source.provenance.timeRange.start} -> ${source.provenance.timeRange.end}`;
  }
  return source.provenance.acquisitionTimestamp ?? "n/a";
}

function formatCatalogDatetime(item: CatalogItem | undefined): string {
  if (!item) {
    return "n/a";
  }
  if (typeof item.datetime === "string") {
    return item.datetime;
  }
  return `${item.datetime.start} -> ${item.datetime.end}`;
}

function formatResolution(source: EOSourceRecord): string {
  const resolution = source.provenance.resolution;
  if (!resolution) {
    return "n/a";
  }
  return `${resolution.x.toFixed(3)} × ${resolution.y.toFixed(3)} ${resolution.unit}`;
}

function formatCloudCover(value?: number): string {
  return value != null ? `${value.toFixed(1)}%` : "n/a";
}

function formatCompression(metadata: COGMetadata): string {
  return metadata.compression === 1
    ? "Uncompressed (1)"
    : `Compression code ${metadata.compression}`;
}

function badgeStyle(source: Pick<EOSourceRecord, "runtimeState">): React.CSSProperties {
  const palette = source.runtimeState === "failed"
    ? { fg: "#FCA5A5", bg: "rgba(127,29,29,0.35)" }
    : source.runtimeState === "credential-missing"
      ? { fg: "#FCD34D", bg: "rgba(120,53,15,0.35)" }
      : source.runtimeState === "demo"
        ? { fg: "#FBBF24", bg: "rgba(120,53,15,0.28)" }
        : source.runtimeState === "loading"
          ? { fg: "#93C5FD", bg: "rgba(30,64,175,0.28)" }
          : { fg: "#86EFAC", bg: "rgba(21,128,61,0.25)" };

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: palette.fg,
    background: palette.bg,
  };
}

function parseCustomBBox(values: {
  west: string;
  south: string;
  east: string;
  north: string;
}): BBox | null {
  const west = Number(values.west);
  const south = Number(values.south);
  const east = Number(values.east);
  const north = Number(values.north);
  if (![west, south, east, north].every((value) => Number.isFinite(value))) {
    return null;
  }
  if (west >= east || south >= north) {
    return null;
  }
  return [west, south, east, north];
}

function resolveCogAssets(item: CatalogItem): CatalogAsset[] {
  return item.assets.filter((asset) =>
    /geotiff|tiff/i.test(asset.mediaType) || /\.tif{1,2}($|\?)/i.test(asset.href),
  );
}

function buildBandMapping(mode: SentinelMode): EOBandMappingEntry[] {
  switch (mode) {
    case "ndvi":
      return [{ key: "ndvi", source: "derived(B08,B04)", label: "NDVI" }];
    case "b04":
      return [{ key: "B04", source: "B04", label: "Band 04 Red" }];
    case "b08":
      return [{ key: "B08", source: "B08", label: "Band 08 NIR" }];
    case "b04-b08":
      return [
        { key: "B04", source: "B04", label: "Band 04 Red" },
        { key: "B08", source: "B08", label: "Band 08 NIR" },
      ];
    default:
      return [];
  }
}

function buildEnvelopeOptions(params: {
  projectName?: string;
  projectBBox?: BBox | null;
  currentMapBounds?: BBox | null;
  currentMapBoundsUpdatedAt?: string | null;
  customBBox?: BBox | null;
}): EOQueryEnvelope[] {
  return [
    {
      kind: "project-extent",
      label: "Project extent",
      bbox: params.projectBBox ?? [0, 0, 0, 0],
      available: Boolean(params.projectBBox),
      sourceLabel: params.projectName ? `Selected project · ${params.projectName}` : "No project extent available",
    },
    {
      kind: "current-map-bbox",
      label: "Current map bbox",
      bbox: params.currentMapBounds ?? [0, 0, 0, 0],
      available: Boolean(params.currentMapBounds),
      sourceLabel: params.currentMapBoundsUpdatedAt
        ? `Map Explorer synced at ${params.currentMapBoundsUpdatedAt}`
        : "Open Map Explorer to sync current map bbox",
      ...(params.currentMapBoundsUpdatedAt ? { updatedAt: params.currentMapBoundsUpdatedAt } : {}),
    },
    {
      kind: "custom-bbox",
      label: "Custom bbox",
      bbox: params.customBBox ?? [0, 0, 0, 0],
      available: Boolean(params.customBBox),
      sourceLabel: params.customBBox ? "Manual bbox entry" : "Enter a valid custom bbox",
    },
  ];
}

function buildSamplePreview(values: Float64Array, width: number, height: number): COGSamplePreview {
  const allValues = Array.from(values);
  const min = allValues.reduce((current, value) => Math.min(current, value), Number.POSITIVE_INFINITY);
  const max = allValues.reduce((current, value) => Math.max(current, value), Number.NEGATIVE_INFINITY);
  const mean = allValues.reduce((sum, value) => sum + value, 0) / Math.max(1, allValues.length);

  return {
    width,
    height,
    min,
    max,
    mean,
    sampleValues: allValues.slice(0, 8).map((value) => Number(value.toFixed(3))),
  };
}

function formatActionLabel(actionKind: EOConnectorActionKind): string {
  switch (actionKind) {
    case "demo-load":
      return "Demo load";
    case "stac-search":
      return "STAC search";
    case "stac-select":
      return "Catalog select";
    case "cog-inspect":
      return "COG inspect";
    case "cog-sample-read":
      return "COG sample";
    case "sentinel-catalog-search":
      return "Sentinel catalog";
    case "sentinel-process":
      return "Sentinel process";
    case "publication":
      return "Publication";
    default:
      return actionKind;
  }
}

function trimToNull(value: string): string | null {
  const next = value.trim();
  return next.length > 0 ? next : null;
}

export default function EOConnectorPanel(): React.ReactElement {
  const projectRegistry = useProjectRegistryOptional();
  const selectedProject = useMemo(() => {
    const selectedProjectId = projectRegistry?.state.selectedProjectId;
    return selectedProjectId
      ? projectRegistry?.state.projects.find((project) => project.id === selectedProjectId) ?? null
      : null;
  }, [projectRegistry?.state.projects, projectRegistry?.state.selectedProjectId]);

  const currentMapBounds = useMapExplorerStore((state) => state.currentMapBounds);
  const currentMapBoundsUpdatedAt = useMapExplorerStore((state) => state.currentMapBoundsUpdatedAt);
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMap = useMapExplorerStore((state) => state.open);
  const upsertCompletedRun = useFlowStore((state) => state.upsertCompletedRun);

  const sources = useEOSourceStore((state) => state.sources);
  const selectedSourceId = useEOSourceStore((state) => state.selectedSourceId);
  const connectorActions = useEOSourceStore((state) => state.connectorActions);
  const registerStacItems = useEOSourceStore((state) => state.registerStacItems);
  const registerCogSource = useEOSourceStore((state) => state.registerCogSource);
  const registerSentinelSource = useEOSourceStore((state) => state.registerSentinelSource);
  const registerDemoSource = useEOSourceStore((state) => state.registerDemoSource);
  const upsertSource = useEOSourceStore((state) => state.upsertSource);
  const selectSource = useEOSourceStore((state) => state.selectSource);
  const recordPublication = useEOSourceStore((state) => state.recordPublication);
  const recordConnectorAction = useEOSourceStore((state) => state.recordConnectorAction);
  const upsertDatasetEntry = useEOSourceStore((state) => state.upsertDatasetEntry);

  const [stacEndpoint, setStacEndpoint] = useState(DEFAULT_STAC_ENDPOINT);
  const [stacCollections, setStacCollections] = useState(DEFAULT_COLLECTIONS);
  const [stacStart, setStacStart] = useState(DEFAULT_START);
  const [stacEnd, setStacEnd] = useState(DEFAULT_END);
  const [stacLimit, setStacLimit] = useState("6");
  const [stacCloudCover, setStacCloudCover] = useState(DEFAULT_MAX_CLOUD);
  const [stacMatched, setStacMatched] = useState<number | null>(null);
  const [stacNotice, setStacNotice] = useState<string | null>(null);
  const [stacResultIds, setStacResultIds] = useState<string[]>([]);
  const [stacAssetKeys, setStacAssetKeys] = useState<Record<string, string>>({});
  const [stacLoading, setStacLoading] = useState(false);
  const [stacError, setStacError] = useState<string | null>(null);

  const [cogUrl, setCogUrl] = useState("");
  const [cogLoading, setCogLoading] = useState(false);
  const [cogNotice, setCogNotice] = useState<string | null>(null);
  const [cogError, setCogError] = useState<string | null>(null);
  const [cogInspection, setCogInspection] = useState<COGInspectionState | null>(null);

  const [sentinelClientId, setSentinelClientId] = useState("");
  const [sentinelClientSecret, setSentinelClientSecret] = useState("");
  const [sentinelCollection, setSentinelCollection] = useState("sentinel-2-l2a");
  const [sentinelMode, setSentinelMode] = useState<SentinelMode>("ndvi");
  const [sentinelWidth, setSentinelWidth] = useState("256");
  const [sentinelHeight, setSentinelHeight] = useState("256");
  const [sentinelStart, setSentinelStart] = useState(DEFAULT_START);
  const [sentinelEnd, setSentinelEnd] = useState(DEFAULT_END);
  const [sentinelMaxCloudCover, setSentinelMaxCloudCover] = useState(DEFAULT_MAX_CLOUD);
  const [sentinelCatalogLimit, setSentinelCatalogLimit] = useState("6");
  const [sentinelToken, setSentinelToken] = useState<SentinelHubToken | null>(null);
  const [sentinelLoadingAction, setSentinelLoadingAction] = useState<"catalog" | "process" | null>(null);
  const [sentinelCatalogResultIds, setSentinelCatalogResultIds] = useState<string[]>([]);
  const [sentinelNotice, setSentinelNotice] = useState<string | null>(null);
  const [sentinelError, setSentinelError] = useState<string | null>(null);

  const [envelopeKind, setEnvelopeKind] = useState<EOQueryEnvelopeKind>("project-extent");
  const [customBBox, setCustomBBox] = useState({
    west: "28.9400",
    south: "41.0100",
    east: "29.0450",
    north: "41.0850",
  });

  const [publicationNotice, setPublicationNotice] = useState<string | null>(null);

  const customBBoxValue = useMemo(() => parseCustomBBox(customBBox), [customBBox]);
  const envelopeOptions = useMemo(() => buildEnvelopeOptions({
    ...(selectedProject?.name ? { projectName: selectedProject.name } : {}),
    projectBBox: selectedProject?.bbox ?? null,
    currentMapBounds,
    currentMapBoundsUpdatedAt,
    customBBox: customBBoxValue,
  }), [currentMapBounds, currentMapBoundsUpdatedAt, customBBoxValue, selectedProject?.bbox, selectedProject?.name]);

  const selectedEnvelope = envelopeOptions.find((option) => option.kind === envelopeKind) ?? envelopeOptions[0]!;
  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? null,
    [selectedSourceId, sources],
  );

  const registrySources = useMemo(
    () => [...sources].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [sources],
  );
  const stacSources = useMemo(
    () => stacResultIds
      .map((id) => sources.find((source) => source.id === id) ?? null)
      .filter((source): source is EOSourceRecord => source !== null),
    [sources, stacResultIds],
  );
  const sentinelCatalogSources = useMemo(
    () => sentinelCatalogResultIds
      .map((id) => sources.find((source) => source.id === id) ?? null)
      .filter((source): source is EOSourceRecord => source !== null),
    [sources, sentinelCatalogResultIds],
  );

  const sentinelRuntimeState = useMemo<EOSourceRuntimeState>(() => {
    if (sentinelLoadingAction) {
      return "loading";
    }
    if (!trimToNull(sentinelClientId) || !trimToNull(sentinelClientSecret)) {
      return "credential-missing";
    }
    if (sentinelError) {
      return "failed";
    }
    return "ready";
  }, [sentinelClientId, sentinelClientSecret, sentinelError, sentinelLoadingAction]);

  const sentinelCredentialMeta = useMemo(() => {
    if (!trimToNull(sentinelClientId) || !trimToNull(sentinelClientSecret)) {
      return "Credentials missing. Sentinel Hub catalog and process requests are blocked.";
    }
    return isTokenValid(sentinelToken)
      ? "Credentials present and bearer token is currently valid."
      : "Credentials present. The next live request will acquire or refresh a bearer token.";
  }, [sentinelClientId, sentinelClientSecret, sentinelToken]);

  const visibleConnectorActions = useMemo(() => {
    if (!selectedSource) {
      return connectorActions;
    }
    const related = connectorActions.filter((action) =>
      action.sourceId === selectedSource.id ||
      action.relatedSourceIds?.includes(selectedSource.id),
    );
    return related.length > 0 ? related : connectorActions;
  }, [connectorActions, selectedSource]);
  const latestSelectedPublication = useMemo(
    () => selectedSource
      ? [...selectedSource.publications].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))[0] ?? null
      : null,
    [selectedSource],
  );

  const handleSelectCatalogSource = useCallback((source: EOSourceRecord, selectedAsset?: CatalogAsset) => {
    selectSource(source.id);
    if (selectedAsset?.href) {
      setCogUrl(selectedAsset.href);
    }
    setPublicationNotice(`${source.title} selected for downstream EO inspection and publication.`);
    recordConnectorAction({
      provider: source.provider,
      actionKind: "stac-select",
      runtimeState: source.runtimeState,
      summary: `${source.title} selected from catalog results.`,
      sourceId: source.id,
      sourceRef: source.provenance.sourceRef,
      relatedSourceIds: [source.id],
      detail: {
        selected_asset: selectedAsset?.key ?? null,
      },
    });
  }, [recordConnectorAction, selectSource]);

  const handleInspectCog = useCallback(async (url?: string, asset?: CatalogAsset, parentSource?: EOSourceRecord | null) => {
    const nextUrl = (url ?? cogUrl).trim();
    if (!nextUrl) {
      setCogError("Provide a COG asset URL or inspect a STAC asset first.");
      return;
    }

    setCogLoading(true);
    setCogError(null);
    setCogNotice(null);
    setCogInspection(null);

    try {
      const metadata = await cogMetadata(nextUrl);
      const sampleWidth = Math.max(1, Math.min(16, metadata.width));
      const sampleHeight = Math.max(1, Math.min(16, metadata.height));
      const sampleWindow: [number, number, number, number] = [0, 0, sampleWidth, sampleHeight];
      let sampleRaster:
        | {
            width: number;
            height: number;
            bandCount: number;
            bbox: BBox;
            data: Float64Array[];
            noData?: (number | null)[];
          }
        | undefined;
      const source = registerCogSource({
        url: nextUrl,
        metadata,
        provider: parentSource?.provider ?? "cog",
        ...(asset ? { asset } : {}),
        ...(parentSource?.id ? { parentSourceId: parentSource.id } : {}),
        ...(asset?.title ? { title: `COG Asset · ${asset.title}` } : {}),
      });

      let preview: COGSamplePreview | null = null;
      let sampleMessage: string | null = null;

      try {
        const sample = await cogRead({
          url: nextUrl,
          window: sampleWindow,
          bands: Array.from({ length: Math.min(4, metadata.bandCount) }, (_, index) => index + 1),
        });
        preview = buildSamplePreview(sample.data[0]!, sample.width, sample.height);
        sampleRaster = {
          width: sample.width,
          height: sample.height,
          bandCount: sample.data.length,
          bbox: computeCogWindowBBox(metadata, sampleWindow),
          data: sample.data,
          noData: metadata.noData,
        };
        useEOSourceStore.getState().upsertSource({
          ...source,
          analysisRaster: sampleRaster,
        });
        sampleMessage = `Band 1 sample window ${sample.width}×${sample.height} loaded successfully.`;
        recordConnectorAction({
          provider: source.provider,
          actionKind: "cog-sample-read",
          runtimeState: "ready",
          summary: `COG sample preview captured for ${source.title}.`,
          sourceId: source.id,
          sourceRef: source.provenance.sourceRef,
          relatedSourceIds: [source.id],
          detail: {
            width: sample.width,
            height: sample.height,
            compression: metadata.compression,
          },
        });
      } catch (error) {
        sampleMessage = error instanceof Error ? error.message : "COG sample preview failed.";
        recordConnectorAction({
          provider: source.provider,
          actionKind: "cog-sample-read",
          runtimeState: "failed",
          summary: `COG sample preview unavailable for ${source.title}.`,
          sourceId: source.id,
          sourceRef: source.provenance.sourceRef,
          relatedSourceIds: [source.id],
          detail: {
            reason: sampleMessage,
            compression: metadata.compression,
          },
        });
      }

      setCogUrl(nextUrl);
      setCogInspection({
        sourceId: source.id,
        sourceTitle: source.title,
        url: nextUrl,
        metadata,
        preview,
        sampleMessage,
      });
      setCogNotice(`COG metadata loaded for ${source.title}.`);
      recordConnectorAction({
        provider: source.provider,
        actionKind: "cog-inspect",
        runtimeState: source.runtimeState,
        summary: `COG metadata inspected for ${source.title}.`,
        sourceId: source.id,
        sourceRef: source.provenance.sourceRef,
        relatedSourceIds: parentSource?.id ? [parentSource.id, source.id] : [source.id],
        detail: {
          width: metadata.width,
          height: metadata.height,
          band_count: metadata.bandCount,
          compression: metadata.compression,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "COG inspection failed.";
      setCogError(message);
      recordConnectorAction({
        provider: parentSource?.provider ?? "cog",
        actionKind: "cog-inspect",
        runtimeState: "failed",
        summary: `COG inspection failed for ${nextUrl}.`,
        ...(parentSource?.id ? { relatedSourceIds: [parentSource.id] } : {}),
        sourceRef: asset?.key ?? nextUrl,
        detail: {
          reason: message,
        },
      });
    } finally {
      setCogLoading(false);
    }
  }, [cogUrl, recordConnectorAction, registerCogSource]);

  const handleStacSearch = useCallback(async () => {
    if (!selectedEnvelope.available) {
      const message = `Selected envelope is unavailable. ${selectedEnvelope.sourceLabel}.`;
      setStacError(message);
      recordConnectorAction({
        provider: "stac",
        actionKind: "stac-search",
        runtimeState: "failed",
        summary: "STAC search blocked because the selected envelope is unavailable.",
        envelopeKind,
        sourceRef: stacEndpoint.trim(),
        detail: {
          reason: message,
        },
      });
      return;
    }

    setStacLoading(true);
    setStacError(null);
    setStacNotice(null);
    setStacMatched(null);
    setStacResultIds([]);

    try {
      const cloudCoverValue = Number(stacCloudCover);
      const result = await stacSearch({
        endpoint: stacEndpoint.trim(),
        collections: stacCollections.split(",").map((value) => value.trim()).filter(Boolean),
        bbox: selectedEnvelope.bbox,
        datetime: { start: stacStart, end: stacEnd },
        limit: Math.max(1, Number(stacLimit) || 6),
        ...(Number.isFinite(cloudCoverValue) ? { query: { "eo:cloud_cover": { lte: cloudCoverValue } } } : {}),
        sortby: [{ field: "properties.datetime", direction: "desc" }],
      });

      const registered = registerStacItems(result.items);
      const selectedKeys = Object.fromEntries(
        registered.map((source) => {
          const cogAsset = source.stacItem ? resolveCogAssets(source.stacItem)[0] : undefined;
          return [source.id, cogAsset?.key ?? ""];
        }),
      );
      setStacAssetKeys(selectedKeys);
      setStacMatched(result.matched);
      setStacResultIds(registered.map((source) => source.id));
      setStacNotice(
        registered.length > 0
          ? `Registered ${registered.length} STAC item${registered.length === 1 ? "" : "s"} in the shared EO source registry.`
          : "STAC search completed with no matching items.",
      );
      recordConnectorAction({
        provider: "stac",
        actionKind: "stac-search",
        runtimeState: "ready",
        summary: `STAC search returned ${registered.length} item${registered.length === 1 ? "" : "s"}.`,
        envelopeKind,
        relatedSourceIds: registered.map((source) => source.id),
        sourceRef: stacEndpoint.trim(),
        detail: {
          matched: result.matched ?? registered.length,
          collections: stacCollections.trim(),
          limit: Math.max(1, Number(stacLimit) || 6),
          max_cloud_cover: Number.isFinite(cloudCoverValue) ? cloudCoverValue : null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "STAC search failed.";
      setStacError(message);
      recordConnectorAction({
        provider: "stac",
        actionKind: "stac-search",
        runtimeState: "failed",
        summary: "STAC search failed.",
        envelopeKind,
        sourceRef: stacEndpoint.trim(),
        detail: {
          reason: message,
        },
      });
    } finally {
      setStacLoading(false);
    }
  }, [
    envelopeKind,
    recordConnectorAction,
    registerStacItems,
    selectedEnvelope,
    stacCloudCover,
    stacCollections,
    stacEndpoint,
    stacEnd,
    stacLimit,
    stacStart,
  ]);

  const handleLoadDemo = useCallback(() => {
    const source = registerDemoSource();
    setPublicationNotice(`Loaded ${source.title} into the EO registry as demo data.`);
    recordConnectorAction({
      provider: source.provider,
      actionKind: "demo-load",
      runtimeState: "demo",
      summary: `${source.title} loaded into the shared EO registry.`,
      sourceId: source.id,
      relatedSourceIds: [source.id],
      sourceRef: source.provenance.sourceRef,
      detail: {
        is_demo: true,
      },
    });
  }, [recordConnectorAction, registerDemoSource]);

  const handleSentinelCatalogSearch = useCallback(async () => {
    setSentinelError(null);
    setSentinelNotice(null);
    setSentinelCatalogResultIds([]);

    if (!selectedEnvelope.available) {
      const message = `Selected envelope is unavailable. ${selectedEnvelope.sourceLabel}.`;
      setSentinelError(message);
      recordConnectorAction({
        provider: "sentinel-hub",
        actionKind: "sentinel-catalog-search",
        runtimeState: "failed",
        summary: "Sentinel catalog search blocked because the selected envelope is unavailable.",
        envelopeKind,
        sourceRef: sentinelCollection,
        detail: {
          reason: message,
        },
      });
      return;
    }

    if (!trimToNull(sentinelClientId) || !trimToNull(sentinelClientSecret)) {
      const message = "Sentinel Hub credentials are required to search the remote catalog.";
      setSentinelError(message);
      recordConnectorAction({
        provider: "sentinel-hub",
        actionKind: "sentinel-catalog-search",
        runtimeState: "credential-missing",
        summary: message,
        envelopeKind,
        sourceRef: sentinelCollection,
      });
      return;
    }

    setSentinelLoadingAction("catalog");
    try {
      const nextToken = await ensureToken({
        clientId: sentinelClientId.trim(),
        clientSecret: sentinelClientSecret.trim(),
      }, sentinelToken);
      setSentinelToken(nextToken);

      const maxCloudCover = Number(sentinelMaxCloudCover);
      const result = await searchCatalog(nextToken, {
        bbox: selectedEnvelope.bbox,
        datetime: { start: sentinelStart, end: sentinelEnd },
        collection: sentinelCollection.trim() || "sentinel-2-l2a",
        ...(Number.isFinite(maxCloudCover) ? { maxCloudCover } : {}),
        limit: Math.max(1, Number(sentinelCatalogLimit) || 6),
      });

      const registered = registerStacItems(result.items);
      setSentinelCatalogResultIds(registered.map((source) => source.id));
      setSentinelNotice(
        registered.length > 0
          ? `Sentinel catalog returned ${registered.length} selectable scene${registered.length === 1 ? "" : "s"}.`
          : "Sentinel catalog returned no scenes for the current filters.",
      );
      recordConnectorAction({
        provider: "sentinel-hub",
        actionKind: "sentinel-catalog-search",
        runtimeState: "ready",
        summary: `Sentinel catalog returned ${registered.length} scene${registered.length === 1 ? "" : "s"}.`,
        envelopeKind,
        relatedSourceIds: registered.map((source) => source.id),
        sourceRef: sentinelCollection,
        detail: {
          limit: Math.max(1, Number(sentinelCatalogLimit) || 6),
          max_cloud_cover: Number.isFinite(maxCloudCover) ? maxCloudCover : null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sentinel catalog search failed.";
      setSentinelError(message);
      recordConnectorAction({
        provider: "sentinel-hub",
        actionKind: "sentinel-catalog-search",
        runtimeState: "failed",
        summary: "Sentinel catalog search failed.",
        envelopeKind,
        sourceRef: sentinelCollection,
        detail: {
          reason: message,
        },
      });
    } finally {
      setSentinelLoadingAction(null);
    }
  }, [
    envelopeKind,
    recordConnectorAction,
    registerStacItems,
    selectedEnvelope,
    sentinelCatalogLimit,
    sentinelClientId,
    sentinelClientSecret,
    sentinelCollection,
    sentinelEnd,
    sentinelMaxCloudCover,
    sentinelStart,
    sentinelToken,
  ]);

  const handleSentinelRun = useCallback(async () => {
    setSentinelError(null);
    setSentinelNotice(null);

    if (!selectedEnvelope.available) {
      const message = `Selected envelope is unavailable. ${selectedEnvelope.sourceLabel}.`;
      setSentinelError(message);
      recordConnectorAction({
        provider: "sentinel-hub",
        actionKind: "sentinel-process",
        runtimeState: "failed",
        summary: "Sentinel Hub process blocked because the selected envelope is unavailable.",
        envelopeKind,
        sourceRef: sentinelCollection,
        detail: {
          reason: message,
        },
      });
      return;
    }

    const bandMapping = buildBandMapping(sentinelMode);
    const baseSummary = `${sentinelCollection} · ${sentinelMode.toUpperCase()} · ${selectedEnvelope.label}`;

    if (!trimToNull(sentinelClientId) || !trimToNull(sentinelClientSecret)) {
      const source = createManualEOSource({
        title: `Sentinel Hub Request · ${sentinelMode.toUpperCase()}`,
        summary: baseSummary,
        kind: "sentinel-process",
        provider: "sentinel-hub",
        runtimeState: "credential-missing",
        sourceRef: sentinelCollection,
        bbox: selectedEnvelope.bbox,
        crs: "EPSG:4326",
        bandMapping,
        timeRange: { start: sentinelStart, end: sentinelEnd },
        statusMessage: "Credentials are required before the process request can run.",
        errorMessage: "Client ID and client secret are missing.",
      });
      upsertSource(source);
      selectSource(source.id);
      setSentinelError("Sentinel Hub credentials are required to run a process request.");
      recordConnectorAction({
        provider: source.provider,
        actionKind: "sentinel-process",
        runtimeState: "credential-missing",
        summary: "Sentinel Hub process request blocked because credentials are missing.",
        sourceId: source.id,
        relatedSourceIds: [source.id],
        sourceRef: source.provenance.sourceRef,
        envelopeKind,
      });
      return;
    }

    setSentinelLoadingAction("process");
    try {
      const nextToken = await ensureToken({
        clientId: sentinelClientId.trim(),
        clientSecret: sentinelClientSecret.trim(),
      }, sentinelToken);
      setSentinelToken(nextToken);

      const width = Math.max(64, Number(sentinelWidth) || 256);
      const height = Math.max(64, Number(sentinelHeight) || 256);
      const maxCloudCover = Number(sentinelMaxCloudCover);
      const request = {
        bbox: selectedEnvelope.bbox,
        datetime: { start: sentinelStart, end: sentinelEnd },
        width,
        height,
        collection: sentinelCollection.trim() || "sentinel-2-l2a",
        ...(Number.isFinite(maxCloudCover) ? { maxCloudCover } : {}),
      };

      const result = sentinelMode === "ndvi"
        ? await fetchNDVI(nextToken, request)
        : sentinelMode === "b04"
          ? await fetchB04(nextToken, request)
          : sentinelMode === "b08"
            ? await fetchB08(nextToken, request)
            : await fetchBands(nextToken, request, ["B04", "B08"]);

      const source = registerSentinelSource({
        title: `Sentinel Hub · ${sentinelMode.toUpperCase()} · ${selectedEnvelope.label}`,
        request,
        result: {
          width: result.width,
          height: result.height,
          bandCount: result.bandCount,
          bbox: result.bbox,
          datetime: result.datetime,
          contentType: result.contentType,
        },
        bandMapping,
        analysisRaster: {
          width: result.width,
          height: result.height,
          bandCount: result.data.length,
          bbox: result.bbox,
          data: result.data,
        },
      });

      setSentinelNotice(`Sentinel Hub process completed for ${source.title}.`);
      recordConnectorAction({
        provider: source.provider,
        actionKind: "sentinel-process",
        runtimeState: source.runtimeState,
        summary: `Sentinel Hub process completed for ${source.title}.`,
        sourceId: source.id,
        relatedSourceIds: [source.id],
        sourceRef: source.provenance.sourceRef,
        envelopeKind,
        detail: {
          width: result.width,
          height: result.height,
          band_count: result.bandCount,
          max_cloud_cover: Number.isFinite(maxCloudCover) ? maxCloudCover : null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sentinel Hub process failed.";
      const failureSource = createManualEOSource({
        title: `Sentinel Hub Request · ${sentinelMode.toUpperCase()}`,
        summary: baseSummary,
        kind: "sentinel-process",
        provider: "sentinel-hub",
        runtimeState: "failed",
        sourceRef: sentinelCollection,
        bbox: selectedEnvelope.bbox,
        crs: "EPSG:4326",
        bandMapping,
        timeRange: { start: sentinelStart, end: sentinelEnd },
        statusMessage: "Sentinel Hub process failed.",
        errorMessage: message,
      });
      upsertSource(failureSource);
      selectSource(failureSource.id);
      setSentinelError(message);
      recordConnectorAction({
        provider: failureSource.provider,
        actionKind: "sentinel-process",
        runtimeState: "failed",
        summary: "Sentinel Hub process failed.",
        sourceId: failureSource.id,
        relatedSourceIds: [failureSource.id],
        sourceRef: failureSource.provenance.sourceRef,
        envelopeKind,
        detail: {
          reason: message,
        },
      });
    } finally {
      setSentinelLoadingAction(null);
    }
  }, [
    envelopeKind,
    recordConnectorAction,
    registerSentinelSource,
    selectSource,
    selectedEnvelope,
    sentinelClientId,
    sentinelClientSecret,
    sentinelCollection,
    sentinelEnd,
    sentinelHeight,
    sentinelMaxCloudCover,
    sentinelMode,
    sentinelStart,
    sentinelToken,
    sentinelWidth,
    upsertSource,
  ]);

  const handlePublish = useCallback((target: "map-layer" | "dataset-entry" | "completed-run") => {
    if (!selectedSource) {
      setPublicationNotice("Select an EO source before publishing.");
      return;
    }

    const publication = recordPublication({
      sourceId: selectedSource.id,
      target,
      label: `${selectedSource.title} · ${target}`,
    });
    const refreshedSource = useEOSourceStore.getState().sources.find((source) => source.id === selectedSource.id) ?? selectedSource;
    const artifacts = buildEOSourcePublicationArtifacts(refreshedSource);

    if (target === "map-layer") {
      addOverlayLayer(artifacts.layer);
      openMap();
    } else if (target === "dataset-entry") {
      upsertDatasetEntry(artifacts.datasetEntry);
    } else {
      upsertCompletedRun(artifacts.completedRun);
    }

    recordConnectorAction({
      provider: refreshedSource.provider,
      actionKind: "publication",
      runtimeState: "ready",
      summary: `${refreshedSource.title} published to ${target}.`,
      sourceId: refreshedSource.id,
      relatedSourceIds: [refreshedSource.id],
      sourceRef: refreshedSource.provenance.sourceRef,
      detail: {
        target,
        publication_id: publication.id,
      },
    });
    setPublicationNotice(`${refreshedSource.title} published to ${target}.`);
  }, [addOverlayLayer, openMap, recordConnectorAction, recordPublication, selectedSource, upsertCompletedRun, upsertDatasetEntry]);

  return (
    <div style={{ display: "grid", gap: 14 }} data-testid="eo-connector-panel">
      <div className={`${styles.callout} ${styles.calloutInfo}`}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>EO operator workspace</div>
          <div className={styles.calloutMeta}>
            {registrySources.length} source{registrySources.length === 1 ? "" : "s"} · {selectedEnvelope.label}
          </div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <div className={styles.meta}>
            This panel exposes first-class STAC, COG, and Sentinel Hub operator workflows against a shared EO source registry. Every registered source keeps its provenance, runtime truth, and publication history visible for downstream analysis.
          </div>
          <div className={styles.hstack} style={{ flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              className={styles.btnPrimary}
              data-testid="eo-load-demo"
              onClick={handleLoadDemo}
            >
              Load demo raster source
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => openMap()}
            >
              Open Map Explorer
            </button>
          </div>
        </div>
      </div>

      <section className={`${styles.callout} ${styles.calloutInfo}`} data-testid="eo-section-envelope">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Spatial envelope</div>
          <div className={styles.calloutMeta}>{selectedEnvelope.sourceLabel}</div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <label className={styles.fieldRow}>
            <span className={styles.labelSmall}>Envelope source</span>
            <select
              className={styles.select}
              value={envelopeKind}
              onChange={(event) => setEnvelopeKind(event.target.value as EOQueryEnvelopeKind)}
              data-testid="eo-envelope-select"
            >
              {envelopeOptions.map((option) => (
                <option key={option.kind} value={option.kind}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.meta}>
            {selectedEnvelope.available
              ? `Envelope bbox ${formatBBox(selectedEnvelope.bbox)}`
              : `Envelope unavailable. ${selectedEnvelope.sourceLabel}.`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            {(["west", "south", "east", "north"] as const).map((key) => (
              <label key={key} style={{ display: "grid", gap: 6 }}>
                <span className={styles.labelSmall}>{key.toUpperCase()}</span>
                <input
                  className={styles.input}
                  type="text"
                  value={customBBox[key]}
                  onChange={(event) => setCustomBBox((previous) => ({ ...previous, [key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} data-testid="eo-section-stac">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>STAC catalog search</div>
          <div className={styles.calloutMeta}>Collections, bbox, time, and cloud-cover filters register item-level EO provenance</div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <label className={styles.fieldRow}>
            <span className={styles.labelSmall}>Endpoint</span>
            <input className={styles.input} type="text" value={stacEndpoint} onChange={(event) => setStacEndpoint(event.target.value)} />
          </label>
          <label className={styles.fieldRow}>
            <span className={styles.labelSmall}>Collections</span>
            <input className={styles.input} type="text" value={stacCollections} onChange={(event) => setStacCollections(event.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Start</span>
              <input className={styles.input} type="text" value={stacStart} onChange={(event) => setStacStart(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>End</span>
              <input className={styles.input} type="text" value={stacEnd} onChange={(event) => setStacEnd(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Max cloud %</span>
              <input className={styles.input} type="number" min="0" max="100" value={stacCloudCover} onChange={(event) => setStacCloudCover(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Limit</span>
              <input className={styles.input} type="number" min="1" max="20" value={stacLimit} onChange={(event) => setStacLimit(event.target.value)} />
            </label>
          </div>
          <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={styles.btnPrimary}
              data-testid="eo-stac-search"
              onClick={() => void handleStacSearch()}
              disabled={stacLoading}
            >
              {stacLoading ? "Searching STAC..." : "Search STAC"}
            </button>
            <div className={styles.meta} data-testid="eo-stac-matched">
              {stacMatched != null ? `Matched ${stacMatched} catalog item${stacMatched === 1 ? "" : "s"}.` : "Run a search to list matched items."}
            </div>
          </div>
          {stacError ? <div className={styles.metaWarn}>{stacError}</div> : null}
          {stacNotice ? <div className={styles.meta}>{stacNotice}</div> : null}
          {stacSources.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }} data-testid="eo-stac-results">
              {stacSources.map((source) => {
                const stacItem = source.stacItem;
                const cogAssets = stacItem ? resolveCogAssets(stacItem) : [];
                const selectedAssetKey = stacAssetKeys[source.id] || cogAssets[0]?.key || "";
                const selectedAsset = cogAssets.find((asset) => asset.key === selectedAssetKey) ?? cogAssets[0];

                return (
                  <div key={source.id} className={`${styles.callout} ${styles.calloutNote}`} style={{ gap: 8 }}>
                    <div className={styles.calloutHeader}>
                      <div className={styles.calloutTitle}>{source.title}</div>
                      <div style={badgeStyle(source)}>{formatStateLabel(source)}</div>
                    </div>
                    <div className={styles.calloutBody} style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                        <div className={styles.meta}><strong>Collection:</strong> {stacItem?.collection ?? source.provenance.sourceRef}</div>
                        <div className={styles.meta}><strong>Acquisition:</strong> {formatCatalogDatetime(stacItem)}</div>
                        <div className={styles.meta}><strong>Cloud cover:</strong> {formatCloudCover(stacItem?.cloudCover)}</div>
                        <div className={styles.meta}><strong>Resolution:</strong> {stacItem?.gsd != null ? `${stacItem.gsd} m` : "n/a"}</div>
                        <div className={styles.meta}><strong>Assets:</strong> {stacItem?.assets.length ?? 0}</div>
                        <div className={styles.meta}><strong>BBox:</strong> {formatBBox(source.provenance.bbox)}</div>
                      </div>
                      {cogAssets.length > 0 ? (
                        <label className={styles.fieldRow}>
                          <span className={styles.labelSmall}>COG asset</span>
                          <select
                            className={styles.select}
                            value={selectedAssetKey}
                            onChange={(event) => setStacAssetKeys((previous) => ({ ...previous, [source.id]: event.target.value }))}
                          >
                            {cogAssets.map((asset) => (
                              <option key={asset.key} value={asset.key}>
                                {asset.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <div className={styles.meta}>No obvious COG asset was advertised in this item.</div>
                      )}
                      <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className={styles.segBtn} onClick={() => handleSelectCatalogSource(source, selectedAsset)}>
                          Select item
                        </button>
                        {selectedAsset ? (
                          <button
                            type="button"
                            className={styles.segBtn}
                            onClick={() => void handleInspectCog(selectedAsset.href, selectedAsset, source)}
                          >
                            Inspect selected asset as COG
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.meta}>Run a search to register STAC items under the shared EO source contract.</div>
          )}
        </div>
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} data-testid="eo-section-cog">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>COG inspection</div>
          <div className={styles.calloutMeta}>Metadata preview, CRS/dimensions, and an honest sample-window read path</div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <label className={styles.fieldRow}>
            <span className={styles.labelSmall}>COG URL</span>
            <input className={styles.input} type="text" value={cogUrl} onChange={(event) => setCogUrl(event.target.value)} />
          </label>
          <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={styles.btnPrimary}
              data-testid="eo-cog-inspect"
              onClick={() => void handleInspectCog()}
              disabled={cogLoading}
            >
              {cogLoading ? "Inspecting COG..." : "Inspect COG"}
            </button>
          </div>
          {cogError ? <div className={styles.metaWarn}>{cogError}</div> : null}
          {cogNotice ? <div className={styles.meta}>{cogNotice}</div> : null}
          {cogInspection ? (
            <div className={`${styles.callout} ${styles.calloutNote}`} style={{ gap: 8 }} data-testid="eo-cog-metadata">
              <div className={styles.calloutHeader}>
                <div className={styles.calloutTitle}>{cogInspection.sourceTitle}</div>
                <div className={styles.calloutMeta}>{cogInspection.url}</div>
              </div>
              <div className={styles.calloutBody} style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                  <div className={styles.meta}><strong>Dimensions:</strong> {cogInspection.metadata.width} × {cogInspection.metadata.height}</div>
                  <div className={styles.meta}><strong>CRS:</strong> {cogInspection.metadata.crs}</div>
                  <div className={styles.meta}><strong>Band count:</strong> {cogInspection.metadata.bandCount}</div>
                  <div className={styles.meta}><strong>Dtype:</strong> {cogInspection.metadata.dtype}</div>
                  <div className={styles.meta}><strong>Compression:</strong> {formatCompression(cogInspection.metadata)}</div>
                  <div className={styles.meta}><strong>Overviews:</strong> {cogInspection.metadata.overviewCount}</div>
                  <div className={styles.meta}><strong>Tile size:</strong> {cogInspection.metadata.tileSize[0]} × {cogInspection.metadata.tileSize[1]}</div>
                  <div className={styles.meta}><strong>NoData:</strong> {cogInspection.metadata.noData.join(", ") || "n/a"}</div>
                  <div className={styles.meta}><strong>BBox:</strong> {formatBBox(cogInspection.metadata.bbox)}</div>
                </div>
                {cogInspection.preview ? (
                  <div className={styles.meta} data-testid="eo-cog-sample">
                    <strong>Sample window:</strong> {cogInspection.preview.width} × {cogInspection.preview.height} pixels. Min {cogInspection.preview.min.toFixed(3)}, max {cogInspection.preview.max.toFixed(3)}, mean {cogInspection.preview.mean.toFixed(3)}. First values: {cogInspection.preview.sampleValues.join(", ")}.
                  </div>
                ) : null}
                {cogInspection.sampleMessage ? <div className={styles.meta}>{cogInspection.sampleMessage}</div> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} data-testid="eo-section-sentinel">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Sentinel Hub operator workflow</div>
          <div className={styles.calloutMeta}>Catalog discovery and process requests with explicit credential and dependency truth</div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <div className={styles.meta}>
            Live Sentinel Hub execution depends on Copernicus Data Space credentials and upstream service availability. This panel does not fake catalog or process success when credentials are missing.
          </div>
          <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
            <div data-testid="eo-sentinel-credential-state" style={badgeStyle({ runtimeState: sentinelRuntimeState })}>
              {formatStateLabel({ runtimeState: sentinelRuntimeState } as Pick<EOSourceRecord, "runtimeState">)}
            </div>
            <div className={styles.meta}>{sentinelCredentialMeta}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Client ID</span>
              <input className={styles.input} type="text" value={sentinelClientId} onChange={(event) => setSentinelClientId(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Client secret</span>
              <input className={styles.input} type="password" value={sentinelClientSecret} onChange={(event) => setSentinelClientSecret(event.target.value)} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Collection</span>
              <input className={styles.input} type="text" value={sentinelCollection} onChange={(event) => setSentinelCollection(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Output</span>
              <select className={styles.select} value={sentinelMode} onChange={(event) => setSentinelMode(event.target.value as SentinelMode)}>
                <option value="ndvi">NDVI</option>
                <option value="b04">B04 Red</option>
                <option value="b08">B08 NIR</option>
                <option value="b04-b08">B04 + B08</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Width</span>
              <input className={styles.input} type="number" min="64" step="64" value={sentinelWidth} onChange={(event) => setSentinelWidth(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Height</span>
              <input className={styles.input} type="number" min="64" step="64" value={sentinelHeight} onChange={(event) => setSentinelHeight(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Max cloud %</span>
              <input className={styles.input} type="number" min="0" max="100" value={sentinelMaxCloudCover} onChange={(event) => setSentinelMaxCloudCover(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Catalog limit</span>
              <input className={styles.input} type="number" min="1" max="20" value={sentinelCatalogLimit} onChange={(event) => setSentinelCatalogLimit(event.target.value)} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>Start</span>
              <input className={styles.input} type="text" value={sentinelStart} onChange={(event) => setSentinelStart(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span className={styles.labelSmall}>End</span>
              <input className={styles.input} type="text" value={sentinelEnd} onChange={(event) => setSentinelEnd(event.target.value)} />
            </label>
          </div>
          <div className={styles.meta}>
            Envelope: {selectedEnvelope.label} {selectedEnvelope.available ? formatBBox(selectedEnvelope.bbox) : "unavailable"}
          </div>
          <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={styles.btnGhost}
              data-testid="eo-sentinel-catalog-search"
              onClick={() => void handleSentinelCatalogSearch()}
              disabled={sentinelLoadingAction !== null}
            >
              {sentinelLoadingAction === "catalog" ? "Searching catalog..." : "Search Sentinel catalog"}
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              data-testid="eo-sentinel-run"
              onClick={() => void handleSentinelRun()}
              disabled={sentinelLoadingAction !== null}
            >
              {sentinelLoadingAction === "process" ? "Running process..." : "Run Sentinel process"}
            </button>
          </div>
          {sentinelError ? <div className={styles.metaWarn}>{sentinelError}</div> : null}
          {sentinelNotice ? <div className={styles.meta}>{sentinelNotice}</div> : null}
          {sentinelCatalogSources.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }} data-testid="eo-sentinel-catalog-results">
              {sentinelCatalogSources.map((source) => (
                <div key={source.id} className={`${styles.callout} ${styles.calloutNote}`} style={{ gap: 8 }}>
                  <div className={styles.calloutHeader}>
                    <div className={styles.calloutTitle}>{source.title}</div>
                    <div style={badgeStyle(source)}>{formatStateLabel(source)}</div>
                  </div>
                  <div className={styles.calloutBody} style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                      <div className={styles.meta}><strong>Acquisition:</strong> {formatCatalogDatetime(source.stacItem)}</div>
                      <div className={styles.meta}><strong>Cloud cover:</strong> {formatCloudCover(source.stacItem?.cloudCover)}</div>
                      <div className={styles.meta}><strong>BBox:</strong> {formatBBox(source.provenance.bbox)}</div>
                    </div>
                    <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className={styles.segBtn} onClick={() => handleSelectCatalogSource(source)}>
                        Select item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} data-testid="eo-section-selected">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Selected source summary</div>
          <div className={styles.calloutMeta}>
            {selectedSource ? selectedSource.provider : "No EO source selected"}
          </div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          {selectedSource ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div data-testid="eo-selected-source-title" className={styles.textStronger}>{selectedSource.title}</div>
                <div data-testid="eo-selected-source-state" style={badgeStyle(selectedSource)}>
                  {formatStateLabel(selectedSource)}
                </div>
              </div>
              <div className={styles.meta}>{selectedSource.summary}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <div className={styles.meta}><strong>Source kind:</strong> {selectedSource.kind}</div>
                <div className={styles.meta}><strong>Provider:</strong> {selectedSource.provider}</div>
                <div className={styles.meta}><strong>Source ref:</strong> {selectedSource.provenance.sourceRef}</div>
                <div className={styles.meta}><strong>Source URL:</strong> {selectedSource.provenance.sourceUrl ?? "n/a"}</div>
                <div className={styles.meta}><strong>BBox:</strong> {formatBBox(selectedSource.provenance.bbox)}</div>
                <div className={styles.meta}><strong>CRS:</strong> {selectedSource.provenance.crs}</div>
                <div className={styles.meta}><strong>Time:</strong> {formatTimeLabel(selectedSource)}</div>
                <div className={styles.meta}><strong>Resolution:</strong> {formatResolution(selectedSource)}</div>
                <div className={styles.meta}><strong>Mode:</strong> {selectedSource.provenance.isDemo ? "Demo mode" : "Real mode"}</div>
                <div className={styles.meta}><strong>Band mapping:</strong> {selectedSource.provenance.bandMapping.map((band) => `${band.label} (${band.key})`).join(", ") || "n/a"}</div>
                <div className={styles.meta}><strong>Publication history:</strong> {selectedSource.publications.length} record{selectedSource.publications.length === 1 ? "" : "s"}</div>
                <div className={styles.meta}><strong>Last publication:</strong> {latestSelectedPublication?.target ?? "n/a"}</div>
                {selectedSource.stacItem ? (
                  <>
                    <div className={styles.meta}><strong>Catalog assets:</strong> {selectedSource.stacItem.assets.length}</div>
                    <div className={styles.meta}><strong>Catalog cloud cover:</strong> {formatCloudCover(selectedSource.stacItem.cloudCover)}</div>
                  </>
                ) : null}
                {selectedSource.cogMetadata ? (
                  <>
                    <div className={styles.meta}><strong>COG dimensions:</strong> {selectedSource.cogMetadata.width} × {selectedSource.cogMetadata.height}</div>
                    <div className={styles.meta}><strong>COG compression:</strong> {formatCompression(selectedSource.cogMetadata)}</div>
                  </>
                ) : null}
                {selectedSource.sentinelResult ? (
                  <>
                    <div className={styles.meta}><strong>Sentinel output:</strong> {selectedSource.sentinelResult.width} × {selectedSource.sentinelResult.height}</div>
                    <div className={styles.meta}><strong>Sentinel content type:</strong> {selectedSource.sentinelResult.contentType}</div>
                  </>
                ) : null}
              </div>
              {selectedSource.statusMessage ? <div className={styles.meta}>{selectedSource.statusMessage}</div> : null}
              {selectedSource.errorMessage ? <div className={styles.metaWarn}>{selectedSource.errorMessage}</div> : null}
              <div className={styles.hstack} style={{ gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  data-testid="eo-publish-map"
                  onClick={() => handlePublish("map-layer")}
                >
                  Publish footprint to map
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  data-testid="eo-register-dataset"
                  onClick={() => handlePublish("dataset-entry")}
                >
                  Register dataset entry
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  data-testid="eo-save-run"
                  onClick={() => handlePublish("completed-run")}
                >
                  Save publication run
                </button>
              </div>
            </>
          ) : (
            <div className={styles.meta}>
              Select a STAC item, inspect a COG, run a Sentinel process, or load the demo raster source to populate the shared EO registry.
            </div>
          )}

          {publicationNotice ? <div className={styles.meta}>{publicationNotice}</div> : null}

          <div style={{ display: "grid", gap: 8 }} data-testid="eo-activity-history">
            <div className={styles.textStronger}>Connector activity / import history</div>
            {visibleConnectorActions.length > 0 ? (
              <div className={styles.tableScroll}>
                <table className={`${styles.tableV2} ${styles.rowZebra}`}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Time</th>
                      <th style={{ textAlign: "left" }}>Provider</th>
                      <th style={{ textAlign: "left" }}>Action</th>
                      <th style={{ textAlign: "left" }}>State</th>
                      <th style={{ textAlign: "left" }}>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleConnectorActions.map((action) => (
                      <tr key={action.id}>
                        <td>{action.createdAt.slice(11, 19)}</td>
                        <td>{action.provider}</td>
                        <td>{formatActionLabel(action.actionKind)}</td>
                        <td>{action.runtimeState}</td>
                        <td>{action.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.meta}>No EO connector actions have been recorded yet.</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div className={styles.textStronger}>Registered sources</div>
            {registrySources.length > 0 ? (
              <div className={styles.tableScroll}>
                <table className={`${styles.tableV2} ${styles.rowZebra}`}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Title</th>
                      <th style={{ textAlign: "left" }}>Kind</th>
                      <th style={{ textAlign: "left" }}>State</th>
                      <th style={{ textAlign: "left" }}>Provider</th>
                      <th style={{ textAlign: "left" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrySources.map((source) => (
                      <tr key={source.id}>
                        <td>{source.title}</td>
                        <td>{source.kind}</td>
                        <td>{formatStateLabel(source)}</td>
                        <td>{source.provider}</td>
                        <td>
                          <button type="button" className={styles.segBtn} onClick={() => selectSource(source.id)}>
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.meta}>No EO sources have been registered yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
