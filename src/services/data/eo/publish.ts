import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { CompletedAnalysisRun, DataOutput, MapOutput } from "@/features/urbanAnalytics/lib/types";
import { createPublishedDataCompletedRun } from "@/services/map/MapEngineAdapter";
import type {
  EODatasetRegistryEntry,
  EOLayerContextMetadata,
  EOSourcePublicationArtifacts,
  EOSourceRecord,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function formatBBox(bbox: readonly [number, number, number, number]): string {
  return `[${bbox.map((value) => value.toFixed(4)).join(", ")}]`;
}

function formatResolution(source: EOSourceRecord): string | undefined {
  const resolution = source.provenance.resolution;
  if (!resolution) {
    return undefined;
  }
  return `${resolution.x.toFixed(3)} × ${resolution.y.toFixed(3)} ${resolution.unit}`;
}

function formatTimeLabel(source: EOSourceRecord): string | undefined {
  if (source.provenance.timeRange) {
    return `${source.provenance.timeRange.start} -> ${source.provenance.timeRange.end}`;
  }
  return source.provenance.acquisitionTimestamp;
}

function geometryFromBbox(bbox: readonly [number, number, number, number]): GeoJSON.Polygon {
  const [west, south, east, north] = bbox;
  return {
    type: "Polygon",
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]],
  };
}

function asFeatureCollection(source: EOSourceRecord): GeoJSON.FeatureCollection {
  const geometry = source.geometry ?? geometryFromBbox(source.provenance.bbox);
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      id: source.id,
      geometry,
      properties: {
        source_id: source.id,
        source_title: source.title,
        source_kind: source.kind,
        provider: source.provider,
        runtime_state: source.runtimeState,
        crs: source.provenance.crs,
        source_ref: source.provenance.sourceRef,
        source_url: source.provenance.sourceUrl ?? null,
        is_demo: source.provenance.isDemo,
        time_label: formatTimeLabel(source) ?? null,
        resolution: formatResolution(source) ?? null,
        band_mapping: source.provenance.bandMapping.map((band) => band.label).join(", "),
      },
    }],
  };
}

export function buildEODatasetEntry(source: EOSourceRecord): EODatasetRegistryEntry {
  const timeLabel = formatTimeLabel(source);
  const resolutionLabel = formatResolution(source);
  const datasetContext = {
    datasetId: source.id,
    datasetTitle: source.title,
    source: `${source.provider} · ${source.provenance.sourceRef}`,
    crs: source.provenance.crs,
    spatialExtent: formatBBox(source.provenance.bbox),
    schemaSummary: [
      "source_id",
      "source_kind",
      "provider",
      "runtime_state",
      "time_label",
      "resolution",
      "band_mapping",
    ],
    thematicCoverage: source.provenance.bandMapping.map((band) => band.label),
    updateDate: source.updatedAt.slice(0, 10),
  };

  return {
    id: `${source.id}-dataset-entry`,
    sourceId: source.id,
    title: source.title,
    sourceKind: source.kind,
    provider: source.provider,
    sourceRef: source.provenance.sourceRef,
    bbox: source.provenance.bbox,
    crs: source.provenance.crs,
    bandSummary: source.provenance.bandMapping.map((band) => `${band.label} (${band.key})`),
    isDemo: source.provenance.isDemo,
    registeredAt: nowIso(),
    datasetContext,
    ...(source.provenance.sourceUrl ? { sourceUrl: source.provenance.sourceUrl } : {}),
    ...(timeLabel ? { timeLabel } : {}),
    ...(resolutionLabel ? { resolutionLabel } : {}),
  };
}

export function buildEOLayerContextMetadata(source: EOSourceRecord): EOLayerContextMetadata {
  const timeLabel = formatTimeLabel(source);
  const resolutionLabel = formatResolution(source);
  return {
    sourceId: source.id,
    sourceKind: source.kind,
    provider: source.provider,
    sourceRef: source.provenance.sourceRef,
    bbox: source.provenance.bbox,
    crs: source.provenance.crs,
    bandSummary: source.provenance.bandMapping.map((band) => `${band.label} (${band.key})`),
    isDemo: source.provenance.isDemo,
    ...(source.provenance.sourceUrl ? { sourceUrl: source.provenance.sourceUrl } : {}),
    ...(timeLabel ? { timeLabel } : {}),
    ...(resolutionLabel ? { resolutionLabel } : {}),
  };
}

export function buildEOSourceLayer(source: EOSourceRecord): OverlayLayerConfig {
  const datasetEntry = buildEODatasetEntry(source);
  return {
    id: `${source.id}-footprint`,
    name: `${source.title} Footprint`,
    type: "geojson",
    visible: true,
    opacity: 0.92,
    group: "data",
    sourceData: asFeatureCollection(source),
    style: {
      "fill-color": source.provenance.isDemo ? "#F59E0B" : "#22C55E",
      "fill-outline-color": "#111827",
      "__labelField": "source_title",
      "__labelSize": 11,
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 1,
      bounds: source.provenance.bbox,
      updatedAt: nowIso(),
      dataVersion: source.updatedAt,
      datasetContext: datasetEntry.datasetContext,
      eoSource: buildEOLayerContextMetadata(source),
    },
  };
}

export function buildEOSourceDataOutput(source: EOSourceRecord): DataOutput {
  const latestPublication = [...source.publications]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))[0];

  return {
    id: `${source.id}-metadata`,
    format: "eo-source-metadata",
    rows: 1,
    columns: [
      "source_id",
      "title",
      "source_kind",
      "provider",
      "runtime_state",
      "source_ref",
      "crs",
      "bbox",
      "time_label",
      "resolution",
      "band_mapping",
      "is_demo",
      "publication_count",
      "last_publication_target",
      "last_published_at",
    ],
    preview: [{
      source_id: source.id,
      title: source.title,
      source_kind: source.kind,
      provider: source.provider,
      runtime_state: source.runtimeState,
      source_ref: source.provenance.sourceRef,
      crs: source.provenance.crs,
      bbox: formatBBox(source.provenance.bbox),
      time_label: formatTimeLabel(source) ?? "n/a",
      resolution: formatResolution(source) ?? "n/a",
      band_mapping: source.provenance.bandMapping.map((band) => `${band.label} (${band.key})`).join(", "),
      is_demo: source.provenance.isDemo,
      publication_count: source.publications.length,
      last_publication_target: latestPublication?.target ?? "n/a",
      last_published_at: latestPublication?.publishedAt ?? "n/a",
    }],
  };
}

export function buildEOSourceMapOutput(source: EOSourceRecord): MapOutput {
  const layer = buildEOSourceLayer(source);
  return {
    id: layer.id,
    type: "choropleth",
    geojson: layer.sourceData,
    title: layer.name,
    layerName: layer.name,
    ...(layer.style ? { style: layer.style } : {}),
  };
}

export function buildEOSourceCompletedRun(source: EOSourceRecord): CompletedAnalysisRun {
  const dataOutput = buildEOSourceDataOutput(source);
  return createPublishedDataCompletedRun({
    runId: `${source.id}-publication-run`,
    flowId: "review",
    label: `${source.title} Publication Record`,
    paragraph: [
      `${source.title} was published from the EO source registry.`,
      `Provider: ${source.provider}. Source kind: ${source.kind}. Runtime state: ${source.runtimeState}.`,
      `Extent: ${formatBBox(source.provenance.bbox)}. CRS: ${source.provenance.crs}.`,
      `Publication history entries recorded: ${source.publications.length}.`,
      source.provenance.isDemo
        ? "This publication used demo raster data."
        : "This publication used a non-demo raster source.",
    ].join(" "),
    mapOutputs: [buildEOSourceMapOutput(source)],
    dataOutputs: [dataOutput],
  });
}

export function buildEOSourcePublicationArtifacts(source: EOSourceRecord): EOSourcePublicationArtifacts {
  const layer = buildEOSourceLayer(source);
  const datasetEntry = buildEODatasetEntry(source);
  const mapOutput = buildEOSourceMapOutput(source);
  const dataOutput = buildEOSourceDataOutput(source);
  const completedRun = buildEOSourceCompletedRun(source);

  return {
    layer,
    datasetEntry,
    mapOutput,
    dataOutput,
    completedRun,
  };
}
