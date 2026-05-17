import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../styles/tools.module.css";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { inferGeometryType, resolveFeatureCollection } from "@/centerpanel/components/map/symbologyUtils";
import {
  useGeoAIModelProfiles,
  useGeoAIStatus,
  useLandCoverClassification,
  useQueryToSQLRunner,
  type LandCoverRunResult,
} from "@/engine/geoai";
import { useSpatialDB } from "@/engine/spatial-db";
import { estimateGeoAIModelFootprintMB } from "@/engine/geoai/models";
import { LAND_COVER_CLASSES, type LandCoverClass } from "@/engine/geoai/cv";
import type { GeneratedSQL } from "@/engine/geoai/nlp/types";
import {
  adaptLandCoverResult,
  adaptQueryResult,
  createAnalysisCompletedRun,
  createPublishedDataCompletedRun,
} from "@/services/map/MapEngineAdapter";
import {
  buildEOLayerContextMetadata,
  createDemoRasterSource,
  getEOSourceAnalysisState,
  useEOSourceStore,
  type EOSourceRecord,
} from "@/services/data/eo";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";

const metricCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  minHeight: 74,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--ui-border) 78%, var(--syn-accent-primary) 22%)",
  background: "linear-gradient(180deg, color-mix(in srgb, var(--ui-card-bg) 92%, var(--syn-accent-primary) 8%), color-mix(in srgb, var(--ui-card-bg) 96%, var(--syn-bg-root) 4%))",
};

const QUERY_PRESETS = [
  "Show parks within 500 meters of transit stops",
  "Rank neighborhoods by walkability score and return top 3",
  "Find parcels where risk score > 70",
] as const;

const QUERY_ALIAS_OPTIONS = [
  "parcels",
  "buildings",
  "roads",
  "schools",
  "hospitals",
  "parks",
  "transit_stops",
  "neighborhoods",
  "districts",
  "zones",
  "census_tracts",
  "blocks",
  "pois",
  "land_use",
  "flood_zones",
  "fire_stations",
  "police_stations",
  "trees",
  "service_areas",
  "facilities",
  "boundaries",
] as const;

type QueryAlias = (typeof QUERY_ALIAS_OPTIONS)[number];
type QueryRuntimeMode = "live-project-data" | "demo-data";

type QueryFieldSummary = {
  name: string;
  type: string;
};

type QueryPreviewRow = Record<string, string | number | boolean | null>;

type QueryDatasetSource =
  | {
      kind: "feature-collection";
      featureCollection: GeoJSON.FeatureCollection;
    }
  | {
      kind: "spatial-table";
      sourceTable: string;
    };

type QueryDatasetSummary = {
  id: string;
  title: string;
  tableName: string;
  sourceLabel: string;
  geometryType: string;
  rowCount: number;
  fields: QueryFieldSummary[];
  sampleRows: QueryPreviewRow[];
  querySource: QueryDatasetSource;
};

type LiveQueryDatasetBase = QueryDatasetSummary & {
  suggestedTableName: QueryAlias;
};

type QueryExecutionSnapshot = {
  mode: QueryRuntimeMode;
  executed: boolean;
  published: boolean;
  rowCount: number;
  elapsedMs: number;
  availableTables: string[];
  columns: Array<{ name: string; type: string }>;
  sampleRows: QueryPreviewRow[];
};

const DEMO_LAYER_COLLECTIONS: Record<string, GeoJSON.FeatureCollection> = {
  neighborhoods: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[28.963, 41.025], [28.975, 41.025], [28.975, 41.034], [28.963, 41.034], [28.963, 41.025]]],
        },
        properties: {
          name: "Waterfront Quarter",
          walkability_score: 82,
          population_density: 13200,
          risk_score: 28,
          median_income: 42000,
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[28.976, 41.026], [28.989, 41.026], [28.989, 41.036], [28.976, 41.036], [28.976, 41.026]]],
        },
        properties: {
          name: "Historic Core",
          walkability_score: 76,
          population_density: 16800,
          risk_score: 41,
          median_income: 35500,
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[28.991, 41.021], [29.005, 41.021], [29.005, 41.032], [28.991, 41.032], [28.991, 41.021]]],
        },
        properties: {
          name: "Logistics Fringe",
          walkability_score: 48,
          population_density: 9100,
          risk_score: 74,
          median_income: 26700,
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[29.007, 41.019], [29.02, 41.019], [29.02, 41.03], [29.007, 41.03], [29.007, 41.019]]],
        },
        properties: {
          name: "Transit Ridge",
          walkability_score: 88,
          population_density: 11900,
          risk_score: 36,
          median_income: 40100,
        },
      },
    ],
  },
  parks: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Point", coordinates: [28.973, 41.03] }, properties: { name: "Harbor Park", area: 3.2 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [28.999, 41.026] }, properties: { name: "Civic Green", area: 2.6 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [29.013, 41.024] }, properties: { name: "Ridge Commons", area: 4.1 } },
    ],
  },
  transit_stops: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Point", coordinates: [28.971, 41.029] }, properties: { name: "Karakoy Tram", headway_min: 6 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [28.998, 41.028] }, properties: { name: "Cemberlitas Metrobus", headway_min: 4 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [29.012, 41.023] }, properties: { name: "Besiktas Ferry", headway_min: 9 } },
    ],
  },
  parcels: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Polygon", coordinates: [[[28.992, 41.024], [28.996, 41.024], [28.996, 41.027], [28.992, 41.027], [28.992, 41.024]]] }, properties: { parcel_id: "P-104", risk_score: 81, area: 1840 } },
      { type: "Feature", geometry: { type: "Polygon", coordinates: [[[28.998, 41.023], [29.002, 41.023], [29.002, 41.026], [28.998, 41.026], [28.998, 41.023]]] }, properties: { parcel_id: "P-208", risk_score: 67, area: 1360 } },
      { type: "Feature", geometry: { type: "Polygon", coordinates: [[[29.004, 41.022], [29.008, 41.022], [29.008, 41.025], [29.004, 41.025], [29.004, 41.022]]] }, properties: { parcel_id: "P-319", risk_score: 74, area: 1525 } },
    ],
  },
};

function formatQueryModeLabel(mode: QueryRuntimeMode): string {
  return mode === "live-project-data" ? "Live project data" : "Demo data";
}

function titleFromAlias(alias: string): string {
  return alias
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function sanitizePreviewValue(value: unknown): string | number | boolean | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) ? numeric : value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function sanitizePreviewRow(row: Record<string, unknown>): QueryPreviewRow {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, sanitizePreviewValue(value)]),
  );
}

function inferFieldType(values: unknown[]): string {
  const presentValues = values.filter(
    (value) => value != null && (!(typeof value === "string") || value.trim().length > 0),
  );

  if (presentValues.length === 0) {
    return "unknown";
  }

  const kinds = new Set(
    presentValues.map((value) => {
      if (Array.isArray(value)) {
        return "array";
      }
      if (value instanceof Date) {
        return "date";
      }
      if (typeof value === "number") {
        return "number";
      }
      if (typeof value === "boolean") {
        return "boolean";
      }
      if (typeof value === "object") {
        return "object";
      }
      return "string";
    }),
  );

  return kinds.size === 1 ? [...kinds][0]! : "mixed";
}

function buildFieldSummaries(collection: GeoJSON.FeatureCollection): QueryFieldSummary[] {
  const valuesByField = new Map<string, unknown[]>();

  collection.features.forEach((feature) => {
    Object.entries(feature.properties ?? {}).forEach(([key, value]) => {
      const current = valuesByField.get(key) ?? [];
      current.push(value);
      valuesByField.set(key, current);
    });
  });

  return [...valuesByField.entries()]
    .map(([name, values]) => ({ name, type: inferFieldType(values) }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildFeatureSampleRows(collection: GeoJSON.FeatureCollection, limit = 2): QueryPreviewRow[] {
  return collection.features
    .slice(0, limit)
    .map((feature) => sanitizePreviewRow((feature.properties ?? {}) as Record<string, unknown>));
}

function detectQueryAlias(layer: OverlayLayerConfig, fields: QueryFieldSummary[], geometryType: string): QueryAlias {
  const fieldNames = new Set(fields.map((field) => field.name.toLowerCase()));
  const haystack = [
    layer.name,
    layer.metadata?.datasetContext?.datasetTitle,
    layer.metadata?.datasetContext?.layerTitle,
    layer.metadata?.datasetContext?.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (fieldNames.has("parcel_id") || /parcel/.test(haystack)) {
    return "parcels";
  }
  if (fieldNames.has("walkability_score") || fieldNames.has("population_density") || /neighbo|neighbour/.test(haystack)) {
    return "neighborhoods";
  }
  if (fieldNames.has("headway_min") || /transit|station|stop|bus|tram|metro|ferry/.test(haystack)) {
    return "transit_stops";
  }
  if (fieldNames.has("tree_canopy_pct") || /tree/.test(haystack)) {
    return "trees";
  }
  if (/park|green/.test(haystack)) {
    return "parks";
  }
  if (/district/.test(haystack)) {
    return "districts";
  }
  if (/zone/.test(haystack)) {
    return "zones";
  }
  if (/school/.test(haystack)) {
    return "schools";
  }
  if (/hospital|clinic/.test(haystack)) {
    return "hospitals";
  }
  if (/building/.test(haystack)) {
    return "buildings";
  }
  if (/road|street/.test(haystack)) {
    return "roads";
  }
  if (/flood/.test(haystack)) {
    return "flood_zones";
  }
  if (geometryType === "point" || geometryType === "multipoint") {
    return "pois";
  }
  if (geometryType === "polygon" || geometryType === "multipolygon") {
    return "boundaries";
  }
  return "facilities";
}

function buildQueryDatasetSummary(params: {
  id: string;
  title: string;
  tableName: string;
  sourceLabel: string;
  featureCollection: GeoJSON.FeatureCollection;
  querySource?: QueryDatasetSource;
}): QueryDatasetSummary {
  const geometryType = inferGeometryType(params.featureCollection.features[0]?.geometry);
  return {
    id: params.id,
    title: params.title,
    tableName: params.tableName,
    sourceLabel: params.sourceLabel,
    geometryType,
    rowCount: params.featureCollection.features.length,
    fields: buildFieldSummaries(params.featureCollection),
    sampleRows: buildFeatureSampleRows(params.featureCollection),
    querySource: params.querySource ?? {
      kind: "feature-collection",
      featureCollection: params.featureCollection,
    },
  };
}

function buildFieldSummariesFromColumns(
  columns: Array<{ name: string; type: string }>,
  geometryColumn: string | null,
): QueryFieldSummary[] {
  return columns
    .filter((column) => column.name !== geometryColumn)
    .map((column) => ({ name: column.name, type: column.type }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeQueryGeometryType(value: string | null | undefined): string {
  if (!value) {
    return "unknown";
  }
  return value.replace(/^ST_/i, "").toLowerCase();
}

function getDatasetsForReferencedTables(
  datasets: QueryDatasetSummary[],
  referencedTables: string[],
): QueryDatasetSummary[] {
  if (referencedTables.length === 0) {
    return datasets;
  }
  const matched = datasets.filter((dataset) => referencedTables.includes(dataset.tableName));
  return matched.length > 0 ? matched : datasets;
}

function listDatasetFieldNames(datasets: QueryDatasetSummary[]): string[] {
  return [...new Set(datasets.flatMap((dataset) => dataset.fields.map((field) => field.name)))]
    .sort((left, right) => left.localeCompare(right));
}

function formatQueryFieldAvailabilityMessage(params: {
  fieldNames: string[];
  datasets: QueryDatasetSummary[];
}): string {
  const datasetLabel = params.datasets.map((dataset) => dataset.tableName).join(", ") || "the selected tables";
  const availableFields = params.fieldNames.join(", ") || "none";
  return `Available fields in ${datasetLabel}: ${availableFields}.`;
}

function formatQueryExecutionError(params: {
  message: string;
  result: GeneratedSQL;
  datasets: QueryDatasetSummary[];
}): string {
  const fieldMatch = params.message.match(/Referenced column\s+"?([a-zA-Z_][\w]*)"?/i)
    ?? params.message.match(/(?:column|field)\s+"?([a-zA-Z_][\w]*)"?\s+(?:not found|does not exist|could not be found)/i);

  if (!fieldMatch) {
    return params.message;
  }

  const referencedDatasets = getDatasetsForReferencedTables(params.datasets, params.result.referencedLayers);
  return `Requested field "${fieldMatch[1]}" is not available. ${formatQueryFieldAvailabilityMessage({
    fieldNames: listDatasetFieldNames(referencedDatasets),
    datasets: referencedDatasets,
  })}`;
}

function buildSourceLabel(layer: OverlayLayerConfig): string {
  const datasetContext = layer.metadata?.datasetContext;
  const columnarFormat = layer.metadata?.columnar?.format;
  if (datasetContext?.source) {
    return datasetContext.source;
  }
  if (columnarFormat) {
    return `${columnarFormat.toUpperCase()} import`;
  }
  if (datasetContext?.datasetTitle) {
    return datasetContext.datasetTitle;
  }
  return "Map Explorer layer";
}

function findDuplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort((left, right) => left.localeCompare(right));
}

function formatFieldSummaries(fields: QueryFieldSummary[]): string {
  return fields.length > 0
    ? fields.map((field) => `${field.name} (${field.type})`).join(", ")
    : "No properties detected";
}

function formatSampleRow(row: QueryPreviewRow | null | undefined): string {
  if (!row) {
    return "No preview rows";
  }
  const text = JSON.stringify(row);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function buildQueryNarrative(params: {
  prompt: string;
  mode: QueryRuntimeMode;
  result: GeneratedSQL;
  execution: QueryExecutionSnapshot;
  datasets: QueryDatasetSummary[];
}): string {
  const datasetSummary = params.datasets
    .map((dataset) => `${dataset.tableName}: ${dataset.title}`)
    .join(", ");

  return [
    `${formatQueryModeLabel(params.mode)} query executed through the sandboxed spatial SQL engine.`,
    `Request: ${params.prompt}.`,
    `Interpretation: ${params.result.parse.explanation}`,
    `Referenced tables: ${params.result.referencedLayers.join(", ") || "none"}.`,
    `Available tables at execution: ${datasetSummary || "none"}.`,
    `Execution ${params.execution.executed ? "completed" : "did not complete"} with ${params.execution.rowCount} row${params.execution.rowCount === 1 ? "" : "s"} in ${Math.round(params.execution.elapsedMs)} ms.`,
    params.execution.published
      ? "Accepted results were published to Map Explorer and Completed Run Review."
      : "Accepted results were saved to Completed Run Review without a map layer because the SQL result did not expose geometry.",
  ].join(" ");
}

function buildQueryDataOutputs(params: {
  prompt: string;
  mode: QueryRuntimeMode;
  result: GeneratedSQL;
  execution: QueryExecutionSnapshot;
}): Array<{
  id: string;
  format: string;
  rows: number;
  columns: string[];
  preview: QueryPreviewRow[];
}> {
  const timestamp = Date.now();
  return [
    {
      id: `geoai-query-metadata-${timestamp}`,
      format: "geoai-query-metadata",
      rows: 1,
      columns: [
        "request",
        "interpretation_summary",
        "generated_sql",
        "runtime_mode",
        "safe",
        "executed",
        "published",
        "intent",
        "referenced_tables",
        "available_tables",
        "spatial_functions",
        "row_count",
        "elapsed_ms",
      ],
      preview: [sanitizePreviewRow({
        request: params.prompt,
        interpretation_summary: params.result.parse.explanation,
        generated_sql: params.result.sql,
        runtime_mode: params.mode,
        safe: params.result.safe,
        executed: params.execution.executed,
        published: params.execution.published,
        intent: params.result.parse.intent,
        referenced_tables: params.result.referencedLayers.join(", "),
        available_tables: params.execution.availableTables.join(", "),
        spatial_functions: params.result.spatialFunctions.join(", "),
        row_count: params.execution.rowCount,
        elapsed_ms: Math.round(params.execution.elapsedMs),
      })],
    },
    {
      id: `geoai-query-preview-${timestamp}`,
      format: "geoai-query-preview",
      rows: params.execution.rowCount,
      columns: params.execution.columns.map((column) => column.name),
      preview: params.execution.sampleRows,
    },
  ];
}

function formatPercent(value: number | null | undefined): string {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "n/a";
}

function formatBBox(bbox: readonly [number, number, number, number]): string {
  return `[${bbox.map((value) => value.toFixed(4)).join(", ")}]`;
}

function formatResolution(source: EOSourceRecord): string {
  const resolution = source.provenance.resolution;
  return resolution ? `${resolution.x.toFixed(3)} × ${resolution.y.toFixed(3)} ${resolution.unit}` : "n/a";
}

function formatTimeLabel(source: EOSourceRecord): string {
  if (source.provenance.timeRange) {
    return `${source.provenance.timeRange.start} -> ${source.provenance.timeRange.end}`;
  }
  return source.provenance.acquisitionTimestamp ?? "n/a";
}

function formatModeLabel(source: EOSourceRecord): string {
  return source.provenance.isDemo ? "Demo source" : "Real source";
}

function buildLandCoverDistribution(labels: Uint8Array): Array<{ className: LandCoverClass; count: number; share: number }> {
  const counts = new Map<LandCoverClass, number>();
  labels.forEach((classIndex) => {
    const className = LAND_COVER_CLASSES[classIndex];
    if (!className) {
      return;
    }
    counts.set(className, (counts.get(className) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([className, count]) => ({ className, count, share: count / labels.length }))
    .sort((left, right) => right.count - left.count);
}

function buildLandCoverNarrative(run: LandCoverRunResult): string {
  const source = run.source;
  const accuracySentence = run.accuracy
    ? `Validation remained available for this ${source.runtimeMode}, with overall accuracy ${formatPercent(run.accuracy.overallAccuracy)}, mean F1 ${formatPercent(run.accuracy.meanF1)}, and mean IoU ${formatPercent(run.accuracy.meanIoU)}.`
    : "Reference labels were not available for this real-source run, so accuracy, F1, and IoU were not computed."

  return [
    `${source.title} ran through the GeoAI land-cover workflow as a ${source.runtimeMode}.`,
    `Source kind: ${source.kind}. Provider: ${source.provider}. CRS: ${source.provenance.crs}. Extent: ${formatBBox(run.scene.bounds)}.`,
    `Band mapping: ${source.provenance.bandMapping.map((band) => `${band.label} (${band.key})`).join(", ") || "n/a"}.`,
    accuracySentence,
    source.notes.length > 0 ? `Source notes: ${source.notes.join(" ")}` : null,
  ].filter(Boolean).join(" ");
}

function buildLandCoverDataOutputs(run: LandCoverRunResult, distribution: Array<{ className: LandCoverClass; count: number; share: number }>) {
  const metrics = run.accuracy;
  return [
    {
      id: `${run.source.id}-land-cover-source`,
      format: "land-cover-source-metadata",
      rows: 1,
      columns: [
        "source_id",
        "source_title",
        "runtime_mode",
        "source_kind",
        "provider",
        "runtime_state",
        "validation_state",
        "bbox",
        "crs",
        "time_label",
        "resolution",
        "band_mapping",
        "overall_accuracy",
        "mean_f1",
        "mean_iou",
      ],
      preview: [{
        source_id: run.source.id,
        source_title: run.source.title,
        runtime_mode: run.source.runtimeMode,
        source_kind: run.source.kind,
        provider: run.source.provider,
        runtime_state: run.source.runtimeState,
        validation_state: run.source.validationState,
        bbox: formatBBox(run.scene.bounds),
        crs: run.source.provenance.crs,
        time_label: run.source.provenance.timeRange
          ? `${run.source.provenance.timeRange.start} -> ${run.source.provenance.timeRange.end}`
          : run.source.provenance.acquisitionTimestamp ?? "n/a",
        resolution: run.source.provenance.resolution
          ? `${run.source.provenance.resolution.x.toFixed(3)} × ${run.source.provenance.resolution.y.toFixed(3)} ${run.source.provenance.resolution.unit}`
          : "n/a",
        band_mapping: run.source.provenance.bandMapping.map((band) => `${band.label} (${band.key})`).join(", ") || "n/a",
        overall_accuracy: metrics ? Number(metrics.overallAccuracy.toFixed(4)) : null,
        mean_f1: metrics ? Number(metrics.meanF1.toFixed(4)) : null,
        mean_iou: metrics ? Number(metrics.meanIoU.toFixed(4)) : null,
      }],
    },
    {
      id: `${run.source.id}-land-cover-classes`,
      format: "land-cover-class-summary",
      rows: distribution.length,
      columns: ["class_name", "cell_count", "share", "f1", "iou"],
      preview: distribution.map((entry) => {
        const perClass = run.accuracy?.perClass.find((item) => item.className === entry.className);
        return {
          class_name: entry.className,
          cell_count: entry.count,
          share: Number(entry.share.toFixed(4)),
          f1: perClass ? Number(perClass.f1.toFixed(4)) : null,
          iou: perClass ? Number(perClass.iou.toFixed(4)) : null,
        };
      }),
    },
  ];
}

const GeoAILab: React.FC = () => {
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const overlayLayers = useMapExplorerStore((state) => state.overlayLayers);
  const openMap = useMapExplorerStore((state) => state.open);
  const upsertMapEvidenceArtifact = useMapExplorerStore((state) => state.upsertMapEvidenceArtifact);
  const upsertCompletedRun = useFlowStore((state) => state.upsertCompletedRun);

  const registrySources = useEOSourceStore((state) => state.sources);
  const selectedEOSourceId = useEOSourceStore((state) => state.selectedSourceId);
  const selectEOSource = useEOSourceStore((state) => state.selectSource);
  const upsertEOSource = useEOSourceStore((state) => state.upsertSource);
  const recordPublication = useEOSourceStore((state) => state.recordPublication);

  const geoStatus = useGeoAIStatus();
  const modelProfiles = useGeoAIModelProfiles();
  const landCover = useLandCoverClassification();
  const queryRunner = useQueryToSQLRunner();
  const spatialDb = useSpatialDB();

  const demoSource = useMemo(() => createDemoRasterSource(), []);
  const landCoverSources = useMemo(() => {
    const byId = new Map<string, EOSourceRecord>();
    byId.set(demoSource.id, demoSource);
    registrySources.forEach((source) => {
      byId.set(source.id, source);
    });
    return [...byId.values()].sort((left, right) => {
      if (left.provenance.isDemo && !right.provenance.isDemo) {
        return -1;
      }
      if (!left.provenance.isDemo && right.provenance.isDemo) {
        return 1;
      }
      return left.title.localeCompare(right.title);
    });
  }, [demoSource, registrySources]);

  const [queryPrompt, setQueryPrompt] = useState<string>(QUERY_PRESETS[0]);
  const [queryMode, setQueryMode] = useState<QueryRuntimeMode>("live-project-data");
  const [queryAliasBindings, setQueryAliasBindings] = useState<Record<string, QueryAlias>>({});
  const [liveQueryDatasetsBase, setLiveQueryDatasetsBase] = useState<LiveQueryDatasetBase[]>([]);
  const [queryCatalogLoading, setQueryCatalogLoading] = useState(false);
  const [queryCatalogError, setQueryCatalogError] = useState<string | null>(null);
  const [queryExecution, setQueryExecution] = useState<QueryExecutionSnapshot | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [landCoverSourceId, setLandCoverSourceId] = useState<string>(() => selectedEOSourceId ?? demoSource.id);
  const [landCoverNotice, setLandCoverNotice] = useState<string | null>(null);
  const [queryNotice, setQueryNotice] = useState<string | null>(null);

  const demoQueryDatasets = useMemo(
    () => Object.entries(DEMO_LAYER_COLLECTIONS).map(([tableName, featureCollection]) => buildQueryDatasetSummary({
      id: `demo-query-${tableName}`,
      title: `Demo ${titleFromAlias(tableName)}`,
      tableName,
      sourceLabel: "Built-in demo dataset",
      featureCollection,
      querySource: {
        kind: "feature-collection",
        featureCollection,
      },
    })),
    [],
  );

  const queryCandidateLayers = useMemo(
    () => overlayLayers.filter((layer) => layer.type === "geojson" && layer.sourceData != null && (layer.group ?? "data") !== "analysis"),
    [overlayLayers],
  );

  useEffect(() => {
    if (!landCoverSources.some((source) => source.id === landCoverSourceId)) {
      setLandCoverSourceId(selectedEOSourceId ?? demoSource.id);
    }
  }, [demoSource.id, landCoverSourceId, landCoverSources, selectedEOSourceId]);

  useEffect(() => {
    let cancelled = false;

    if (queryCandidateLayers.length === 0) {
      setLiveQueryDatasetsBase([]);
      setQueryCatalogLoading(false);
      setQueryCatalogError(null);
      setQueryAliasBindings((current) => (Object.keys(current).length === 0 ? current : {}));
      return () => {
        cancelled = true;
      };
    }

    setQueryCatalogLoading(true);
    setQueryCatalogError(null);

    void Promise.all(queryCandidateLayers.map(async (layer) => {
      const columnarTableName = layer.metadata?.columnar?.workerTableName?.trim();
      if (columnarTableName && spatialDb.ready) {
        const inspection = await spatialDb.inspectTable(columnarTableName, 2);
        const fields = buildFieldSummariesFromColumns(inspection.columns, inspection.geometryColumn);
        const geometryType = normalizeQueryGeometryType(inspection.geometryType)
          || inferGeometryType((layer.sourceData as GeoJSON.FeatureCollection | undefined)?.features?.[0]?.geometry);
        const suggestedTableName = detectQueryAlias(layer, fields, geometryType);
        return {
          id: layer.id,
          title: layer.name,
          tableName: suggestedTableName,
          sourceLabel: buildSourceLabel(layer),
          geometryType,
          rowCount: inspection.rowCount,
          fields,
          sampleRows: inspection.sampleRows.map((row) => sanitizePreviewRow(row)),
          querySource: {
            kind: "spatial-table",
            sourceTable: columnarTableName,
          },
          suggestedTableName,
        } satisfies LiveQueryDatasetBase;
      }

      const featureCollection = await resolveFeatureCollection(layer);
      const fields = buildFieldSummaries(featureCollection);
      const geometryType = inferGeometryType(featureCollection.features[0]?.geometry);
      const suggestedTableName = detectQueryAlias(layer, fields, geometryType);
      const summary = buildQueryDatasetSummary({
        id: layer.id,
        title: layer.name,
        tableName: suggestedTableName,
        sourceLabel: buildSourceLabel(layer),
        featureCollection,
        querySource: {
          kind: "feature-collection",
          featureCollection,
        },
      });
      return {
        ...summary,
        suggestedTableName,
      } satisfies LiveQueryDatasetBase;
    }))
      .then((nextDatasets) => {
        if (cancelled) {
          return;
        }

        setLiveQueryDatasetsBase(nextDatasets);
        setQueryCatalogLoading(false);
        setQueryAliasBindings((current) => {
          const nextBindings: Record<string, QueryAlias> = {};
          nextDatasets.forEach((dataset) => {
            nextBindings[dataset.id] = current[dataset.id] ?? dataset.suggestedTableName;
          });

          const currentKeys = Object.keys(current).sort();
          const nextKeys = Object.keys(nextBindings).sort();
          if (
            currentKeys.length === nextKeys.length &&
            currentKeys.every((key, index) => key === nextKeys[index] && current[key] === nextBindings[key])
          ) {
            return current;
          }

          return nextBindings;
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setLiveQueryDatasetsBase([]);
        setQueryCatalogLoading(false);
        setQueryCatalogError(error instanceof Error ? error.message : "Failed to inspect live query datasets.");
      });

    return () => {
      cancelled = true;
    };
  }, [queryCandidateLayers, spatialDb.inspectTable, spatialDb.ready]);

  const selectedLandCoverSource = useMemo(
    () => landCoverSources.find((source) => source.id === landCoverSourceId) ?? demoSource,
    [demoSource, landCoverSourceId, landCoverSources],
  );
  const selectedLandCoverReadiness = useMemo(
    () => getEOSourceAnalysisState(selectedLandCoverSource),
    [selectedLandCoverSource],
  );
  const landCoverDistribution = useMemo(
    () => (landCover.result ? buildLandCoverDistribution(landCover.result.classified.labels) : []),
    [landCover.result],
  );
  const liveQueryDatasets = useMemo(
    () => liveQueryDatasetsBase.map((dataset) => ({
      ...dataset,
      tableName: queryAliasBindings[dataset.id] ?? dataset.suggestedTableName,
    })),
    [liveQueryDatasetsBase, queryAliasBindings],
  );
  const activeQueryDatasets = useMemo(
    () => (queryMode === "live-project-data" ? liveQueryDatasets : demoQueryDatasets),
    [demoQueryDatasets, liveQueryDatasets, queryMode],
  );
  const duplicateQueryTables = useMemo(
    () => findDuplicateValues(activeQueryDatasets.map((dataset) => dataset.tableName)),
    [activeQueryDatasets],
  );
  const queryReadiness = useMemo(() => {
    if (!spatialDb.ready) {
      return {
        ready: false,
        reason: spatialDb.error ?? "Spatial SQL engine is loading.",
        notes: [] as string[],
      };
    }

    if (queryMode === "live-project-data") {
      if (queryCatalogLoading) {
        return {
          ready: false,
          reason: "Loading live query metadata from project layers and imported spatial tables.",
          notes: [] as string[],
        };
      }
      if (queryCatalogError) {
        return {
          ready: false,
          reason: queryCatalogError,
          notes: [] as string[],
        };
      }
      if (liveQueryDatasets.length === 0) {
        return {
          ready: false,
          reason: "No project layers or imported spatial tables are available for live SQL. Publish or import a layer, or switch to Demo data explicitly.",
          notes: [] as string[],
        };
      }
    }

    if (duplicateQueryTables.length > 0) {
      return {
        ready: false,
        reason: `Resolve duplicate table aliases before running SQL: ${duplicateQueryTables.join(", ")}.`,
        notes: [] as string[],
      };
    }

    return {
      ready: true,
      notes: [
        `${activeQueryDatasets.length} table${activeQueryDatasets.length === 1 ? "" : "s"} ready in ${formatQueryModeLabel(queryMode).toLowerCase()}.`,
        queryMode === "live-project-data"
          ? `${liveQueryDatasets.filter((dataset) => dataset.querySource.kind === "spatial-table").length} worker-backed import table${liveQueryDatasets.filter((dataset) => dataset.querySource.kind === "spatial-table").length === 1 ? "" : "s"} and ${liveQueryDatasets.filter((dataset) => dataset.querySource.kind === "feature-collection").length} overlay-backed layer${liveQueryDatasets.filter((dataset) => dataset.querySource.kind === "feature-collection").length === 1 ? "" : "s"} are queryable.`
          : "Demo mode remains explicit and never replaces live project data silently.",
      ],
    };
  }, [
    activeQueryDatasets.length,
    duplicateQueryTables,
    liveQueryDatasets,
    queryCatalogError,
    queryCatalogLoading,
    queryMode,
    spatialDb.error,
    spatialDb.ready,
  ]);

  const runLandCover = useCallback(async () => {
    if (!selectedLandCoverReadiness.ready) {
      setLandCoverNotice(selectedLandCoverReadiness.reason ?? "The selected source is not analysis-ready.");
      return;
    }

    setLandCoverNotice(null);
    const run = await landCover.runClassification(selectedLandCoverSource);
    if (!run) {
      return;
    }

    const persistedSource = upsertEOSource(selectedLandCoverSource);
    selectEOSource(persistedSource.id);

    const layerName = `GeoAI Land Cover · ${run.source.runtimeMode === "demo-source" ? "Demo source" : "Real source"}`;
    const adapted = adaptLandCoverResult({
      result: run.classified,
      bounds: [...run.scene.bounds] as [number, number, number, number],
      layerName,
      parameters: {
        runtimeMode: run.source.runtimeMode,
        sourceId: run.source.id,
        sourceTitle: run.source.title,
        sourceKind: run.source.kind,
        provider: run.source.provider,
        sourceRef: run.source.provenance.sourceRef,
        sourceUrl: run.source.provenance.sourceUrl ?? null,
        validationState: run.source.validationState,
        bandMapping: run.source.provenance.bandMapping.map((band) => `${band.label} (${band.key})`),
        bbox: [...run.scene.bounds],
        crs: run.source.provenance.crs,
        resolution: run.source.provenance.resolution ?? null,
        timeRange: run.source.provenance.timeRange ?? null,
        acquisitionTimestamp: run.source.provenance.acquisitionTimestamp ?? null,
        overallAccuracy: run.accuracy?.overallAccuracy ?? null,
        meanF1: run.accuracy?.meanF1 ?? null,
        meanIoU: run.accuracy?.meanIoU ?? null,
        analysisNotes: run.source.notes,
      },
    });

    adapted.layer.metadata = {
      ...(adapted.layer.metadata ?? {}),
      eoSource: buildEOLayerContextMetadata(persistedSource),
    };

    addOverlayLayer(adapted.layer);
    upsertMapEvidenceArtifact(adapted.evidenceArtifact);
    openMap();

    const narrative = buildLandCoverNarrative(run);
    const distribution = buildLandCoverDistribution(run.classified.labels);
    const dataOutputs = buildLandCoverDataOutputs(run, distribution);
    upsertCompletedRun(createAnalysisCompletedRun(adapted, {
      flowId: "change_detection",
      label: layerName,
      paragraph: narrative,
      paragraphPreview: narrative,
      paragraphFull: narrative,
      chartOutputs: [
        {
          id: `${run.source.id}-land-cover-distribution`,
          type: "bar",
          title: `${layerName} Class Distribution`,
          data: distribution.map((entry) => ({
            className: entry.className,
            count: entry.count,
            share: Number(entry.share.toFixed(4)),
          })),
        },
      ],
      dataOutputs,
    }));

    recordPublication({
      sourceId: persistedSource.id,
      target: "map-layer",
      label: `${layerName} map publication`,
    });
    recordPublication({
      sourceId: persistedSource.id,
      target: "completed-run",
      label: `${layerName} completed run`,
    });

    setLandCoverNotice(`${formatModeLabel(persistedSource)} classification published to Map Explorer and Completed Run Review.`);
  }, [
    addOverlayLayer,
    landCover,
    openMap,
    recordPublication,
    selectEOSource,
    selectedLandCoverReadiness,
    selectedLandCoverSource,
    upsertCompletedRun,
    upsertEOSource,
    upsertMapEvidenceArtifact,
  ]);

  const runQuery = useCallback(async () => {
    if (!queryReadiness.ready) {
      setQueryNotice(queryReadiness.reason ?? "Spatial query execution is not ready.");
      return;
    }

    setQueryRunning(true);
    setQueryNotice(null);
    setQueryExecution(null);
    let generatedResult: GeneratedSQL | null = null;
    try {
      const result = queryRunner.run(queryPrompt, {
        allowedTables: activeQueryDatasets.map((dataset) => dataset.tableName),
        maxResultLimit: 12,
      });
      generatedResult = result;
      if (!result) {
        return;
      }

      const blockedExecution: QueryExecutionSnapshot = {
        mode: queryMode,
        executed: false,
        published: false,
        rowCount: 0,
        elapsedMs: 0,
        availableTables: activeQueryDatasets.map((dataset) => dataset.tableName),
        columns: [],
        sampleRows: [],
      };

      if (!result.safe) {
        const blockedTable = result.rejectionReason?.match(/^Table "([^"]+)"/i)?.[1];
        setQueryNotice(
          blockedTable
            ? `Requested table "${blockedTable}" is not available in ${formatQueryModeLabel(queryMode).toLowerCase()}. Available tables: ${activeQueryDatasets.map((dataset) => dataset.tableName).join(", ")}.`
            : result.rejectionReason ?? "Query rejected by the sandbox.",
        );
        setQueryExecution(blockedExecution);
        return;
      }

      const referencedDatasets = getDatasetsForReferencedTables(activeQueryDatasets, result.referencedLayers);
      const availableReferencedFields = listDatasetFieldNames(referencedDatasets).map((field) => field.toLowerCase());
      const missingRecognisedFields = [...new Set(result.interpretation.recognisedAttributes)]
        .filter((field) => !availableReferencedFields.includes(field.toLowerCase()));

      if (missingRecognisedFields.length > 0) {
        const label = missingRecognisedFields.length === 1 ? "field" : "fields";
        setQueryNotice(`Requested ${label} ${missingRecognisedFields.map((field) => `"${field}"`).join(", ")} ${missingRecognisedFields.length === 1 ? "is" : "are"} not available. ${formatQueryFieldAvailabilityMessage({
          fieldNames: listDatasetFieldNames(referencedDatasets),
          datasets: referencedDatasets,
        })}`);
        setQueryExecution(blockedExecution);
        return;
      }

      for (const dataset of activeQueryDatasets) {
        if (dataset.querySource.kind === "spatial-table") {
          await spatialDb.bindTableAlias(dataset.tableName, dataset.querySource.sourceTable);
          continue;
        }
        await spatialDb.loadGeoJSON(dataset.tableName, dataset.querySource.featureCollection);
      }

      const tableResult = await spatialDb.runQuery(result.sql);
      const execution: QueryExecutionSnapshot = {
        mode: queryMode,
        executed: true,
        published: tableResult.columns.some((column) => column.name === "geometry" || column.name === "geom"),
        rowCount: tableResult.rowCount,
        elapsedMs: tableResult.elapsed,
        availableTables: activeQueryDatasets.map((dataset) => dataset.tableName),
        columns: tableResult.columns.map((column) => ({ name: column.name, type: column.type })),
        sampleRows: tableResult.rows.slice(0, 5).map((row) => sanitizePreviewRow(row)),
      };
      const narrative = buildQueryNarrative({
        prompt: queryPrompt,
        mode: queryMode,
        result,
        execution,
        datasets: activeQueryDatasets,
      });
      const dataOutputs = buildQueryDataOutputs({
        prompt: queryPrompt,
        mode: queryMode,
        result,
        execution,
      });

      if (execution.published) {
        const featureCollection = await spatialDb.runToGeoJSON(result.sql);
        const executionScope = queryMode === "demo-data"
          ? "explicit-demo-data"
          : activeQueryDatasets.some((dataset) => dataset.querySource.kind === "spatial-table")
            ? "imported-worker-spatial-table"
            : "live-project-data";
        const adapted = adaptQueryResult({
          result,
          queryText: queryPrompt,
          featureCollection,
          layerName: `GeoAI Spatial Query · ${formatQueryModeLabel(queryMode)}`,
          executionScope,
          sourceTableIds: activeQueryDatasets.map((dataset) => dataset.tableName),
          parameters: {
            datasetMode: queryMode,
            executionScope,
            availableTables: activeQueryDatasets.map((dataset) => dataset.tableName),
            boundSources: activeQueryDatasets.map((dataset) => `${dataset.tableName}: ${dataset.title}`),
            workerBackedTableCount: activeQueryDatasets.filter((dataset) => dataset.querySource.kind === "spatial-table").length,
            overlayBackedLayerCount: activeQueryDatasets.filter((dataset) => dataset.querySource.kind === "feature-collection").length,
            referencedTables: result.referencedLayers,
            interpretationSummary: result.parse.explanation,
            generatedSQL: result.sql,
            rowCount: tableResult.rowCount,
            elapsedMs: Math.round(tableResult.elapsed),
          },
        });

        addOverlayLayer(adapted.layer);
      upsertMapEvidenceArtifact(adapted.evidenceArtifact);
        openMap();
        upsertCompletedRun(createAnalysisCompletedRun(adapted, {
          flowId: "review",
          label: adapted.layer.name,
          paragraph: narrative,
          paragraphPreview: narrative,
          paragraphFull: narrative,
          dataOutputs,
        }));
        setQueryNotice(`${formatQueryModeLabel(queryMode)} query published to Map Explorer and Completed Run Review.`);
      } else {
        upsertCompletedRun(createPublishedDataCompletedRun({
          runId: `geoai-query-review-${Date.now()}`,
          flowId: "review",
          label: `GeoAI Spatial Query Review · ${formatQueryModeLabel(queryMode)}`,
          paragraph: narrative,
          paragraphPreview: narrative,
          paragraphFull: narrative,
          dataOutputs,
        }));
        setQueryNotice(`${formatQueryModeLabel(queryMode)} query executed and was saved to Completed Run Review, but the result did not expose geometry for map publication.`);
      }

      setQueryExecution(execution);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Spatial SQL execution failed.";
      setQueryNotice(generatedResult
        ? formatQueryExecutionError({
          message,
          result: generatedResult,
          datasets: activeQueryDatasets,
        })
        : message);
      setQueryExecution({
        mode: queryMode,
        executed: false,
        published: false,
        rowCount: 0,
        elapsedMs: 0,
        availableTables: activeQueryDatasets.map((dataset) => dataset.tableName),
        columns: [],
        sampleRows: [],
      });
    } finally {
      setQueryRunning(false);
    }
  }, [
    activeQueryDatasets,
    addOverlayLayer,
    openMap,
    queryMode,
    queryPrompt,
    queryReadiness.ready,
    queryReadiness.reason,
    queryRunner,
    spatialDb,
    upsertCompletedRun,
    upsertMapEvidenceArtifact,
  ]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className={`${styles.callout} ${styles.calloutSuccess}`}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>GeoAI runtime</div>
          <div className={styles.calloutMeta}>
            {geoStatus.state.toUpperCase()} · {geoStatus.backend.toUpperCase()}
          </div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <div className={styles.meta}>
            {geoStatus.lastMessage ?? "GeoAI runtime is idle. Launch a land-cover or query interpretation run to warm the engine."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Loaded models</div>
              <div className={styles.metricValue}>{geoStatus.loadedModels}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Memory</div>
              <div className={styles.metricValue}>{geoStatus.memoryUsedMB.toFixed(1)} MB</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Engine</div>
              <div className={styles.metricValue}>{geoStatus.lastEngine ?? "Standby"}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Catalog</div>
              <div className={styles.metricValue}>{modelProfiles.length} profiles</div>
            </div>
          </div>
        </div>
      </div>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: "grid", gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Model registry</div>
          <div className={styles.calloutMeta}>Stable GeoAI exports with browser-safe defaults</div>
        </div>
        <div className={styles.tableScroll}>
          <table className={`${styles.tableV2} ${styles.rowZebra}`}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Task</th>
                <th style={{ textAlign: "left" }}>Profile</th>
                <th style={{ textAlign: "left" }}>Backend</th>
                <th style={{ textAlign: "right" }}>Footprint</th>
              </tr>
            </thead>
            <tbody>
              {modelProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.task.replace(/_/g, " ")}</td>
                  <td>{profile.label}</td>
                  <td>{profile.backend}</td>
                  <td style={{ textAlign: "right" }}>{estimateGeoAIModelFootprintMB(profile).toFixed(1)} MB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: "grid", gap: 10 }} data-testid="geoai-land-cover-panel">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Land-cover classification</div>
          <div className={styles.calloutMeta}>Real raster-backed inference with explicit demo mode and publication provenance</div>
        </div>
        <div className={styles.meta}>
          Choose an imported raster, an EO connector source, or the explicitly labeled demo source. The workflow blocks non-analysis-ready inputs instead of silently falling back to synthetic data.
        </div>
        <label className={styles.fieldRow}>
          <span className={styles.labelSmall}>Raster source</span>
          <select
            className={styles.select}
            data-testid="geoai-land-cover-source-select"
            value={selectedLandCoverSource.id}
            onChange={(event) => {
              const nextId = event.target.value;
              setLandCoverNotice(null);
              setLandCoverSourceId(nextId);
              const nextSource = landCoverSources.find((source) => source.id === nextId);
              if (nextSource && !nextSource.provenance.isDemo) {
                selectEOSource(nextSource.id);
              }
            }}
          >
            {landCoverSources.map((source) => (
              <option key={source.id} value={source.id}>
                {`${source.title} · ${source.kind} · ${source.runtimeState}`}
              </option>
            ))}
          </select>
        </label>

        <div className={`${styles.callout} ${styles.calloutNote}`} style={{ gap: 8 }} data-testid="geoai-land-cover-source-meta">
          <div className={styles.calloutHeader}>
            <div className={styles.calloutTitle}>{selectedLandCoverSource.title}</div>
            <div className={styles.calloutMeta} data-testid="geoai-land-cover-mode">{formatModeLabel(selectedLandCoverSource)}</div>
          </div>
          <div className={styles.calloutBody} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <div className={styles.meta}><strong>Source kind:</strong> {selectedLandCoverSource.kind}</div>
              <div className={styles.meta}><strong>Provider:</strong> {selectedLandCoverSource.provider}</div>
              <div className={styles.meta}><strong>Runtime state:</strong> {selectedLandCoverSource.runtimeState}</div>
              <div className={styles.meta}><strong>Mode:</strong> {formatModeLabel(selectedLandCoverSource)}</div>
              <div className={styles.meta}><strong>Extent:</strong> {formatBBox(selectedLandCoverSource.provenance.bbox)}</div>
              <div className={styles.meta}><strong>CRS:</strong> {selectedLandCoverSource.provenance.crs}</div>
              <div className={styles.meta}><strong>Resolution:</strong> {formatResolution(selectedLandCoverSource)}</div>
              <div className={styles.meta}><strong>Acquisition / time:</strong> {formatTimeLabel(selectedLandCoverSource)}</div>
              <div className={styles.meta} style={{ gridColumn: "1 / -1" }}>
                <strong>Band mapping:</strong> {selectedLandCoverSource.provenance.bandMapping.map((band) => `${band.label} (${band.key})`).join(", ") || "n/a"}
              </div>
            </div>
            <div
              className={selectedLandCoverReadiness.ready ? styles.meta : styles.metaWarn}
              data-testid="geoai-land-cover-readiness"
            >
              {selectedLandCoverReadiness.ready
                ? `${formatModeLabel(selectedLandCoverSource)} is analysis-ready. ${selectedLandCoverReadiness.notes.join(" ")}`
                : selectedLandCoverReadiness.reason}
            </div>
          </div>
        </div>

        <div className={styles.hstack}>
          <button
            type="button"
            className={styles.btnPrimary}
            data-testid="geoai-land-cover-run"
            disabled={landCover.isRunning || !selectedLandCoverReadiness.ready}
            onClick={() => void runLandCover()}
          >
            {landCover.isRunning
              ? `Running ${formatModeLabel(selectedLandCoverSource).toLowerCase()} inference...`
              : `Run and publish ${formatModeLabel(selectedLandCoverSource).toLowerCase()}`}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => window.dispatchEvent(new CustomEvent("synapse:navigate", { detail: { tab: "Workflows", flowId: "object_detection" } }))}
          >
            Open object-detection workflow
          </button>
        </div>
        {landCover.error ? <div className={styles.metaWarn}>{landCover.error}</div> : null}
        {landCoverNotice ? <div className={styles.meta} data-testid="geoai-land-cover-notice">{landCoverNotice}</div> : null}
        {landCover.result ? (
          <>
            <div className={styles.meta}>
              Latest run: <strong>{landCover.result.source.title}</strong> as a <strong>{landCover.result.source.runtimeMode}</strong>. Validation state: <strong>{landCover.result.source.validationState}</strong>.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }} data-testid="geoai-land-cover-result">
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Overall accuracy</div>
                <div className={styles.metricValue}>{formatPercent(landCover.result.accuracy?.overallAccuracy)}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Mean F1</div>
                <div className={styles.metricValue}>{formatPercent(landCover.result.accuracy?.meanF1)}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Mean IoU</div>
                <div className={styles.metricValue}>{formatPercent(landCover.result.accuracy?.meanIoU)}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Raster size</div>
                <div className={styles.metricValue}>
                  {landCover.result.classified.width} × {landCover.result.classified.height}
                </div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Publication mode</div>
                <div className={styles.metricValue}>{landCover.result.source.runtimeMode}</div>
              </div>
            </div>
            {landCover.result.accuracy == null ? (
              <div className={styles.meta}>
                This real-source run has no reference labels. Classification outputs and class summaries remain inspectable, but accuracy metrics are unavailable.
              </div>
            ) : null}
            {landCover.result.source.notes.length > 0 ? (
              <div className={styles.meta}>{landCover.result.source.notes.join(" ")}</div>
            ) : null}
            <div className={styles.tableScroll}>
              <table className={`${styles.tableV2} ${styles.rowZebra}`}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Class</th>
                    <th style={{ textAlign: "right" }}>Cells</th>
                    <th style={{ textAlign: "right" }}>Share</th>
                    <th style={{ textAlign: "right" }}>F1</th>
                    <th style={{ textAlign: "right" }}>IoU</th>
                  </tr>
                </thead>
                <tbody>
                  {landCoverDistribution.map((entry) => {
                    const metrics = landCover.result?.accuracy?.perClass.find((item) => item.className === entry.className);
                    return (
                      <tr key={entry.className}>
                        <td>{entry.className.replace(/_/g, " ")}</td>
                        <td style={{ textAlign: "right" }}>{entry.count.toLocaleString()}</td>
                        <td style={{ textAlign: "right" }}>{formatPercent(entry.share)}</td>
                        <td style={{ textAlign: "right" }}>{metrics ? formatPercent(metrics.f1) : "n/a"}</td>
                        <td style={{ textAlign: "right" }}>{metrics ? formatPercent(metrics.iou) : "n/a"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: "grid", gap: 10 }} data-testid="geoai-query-panel">
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Natural language to spatial SQL</div>
          <div className={styles.calloutMeta}>Live project tables with explicit demo mode and sandboxed publication</div>
        </div>
        <div className={styles.meta}>
          Bind live project layers and imported spatial tables to query-table aliases, inspect schema metadata before execution, and switch to explicit demo mode only when you want a controlled validation path.
        </div>
        <div className={styles.hstack}>
          <button
            type="button"
            className={queryMode === "live-project-data" ? styles.btnPrimary : styles.segBtn}
            data-testid="geoai-query-mode-live"
            onClick={() => setQueryMode("live-project-data")}
          >
            Live project data
          </button>
          <button
            type="button"
            className={queryMode === "demo-data" ? styles.btnPrimary : styles.segBtn}
            data-testid="geoai-query-mode-demo"
            onClick={() => setQueryMode("demo-data")}
          >
            Demo data
          </button>
          <div className={styles.calloutMeta} data-testid="geoai-query-mode">{formatQueryModeLabel(queryMode)}</div>
        </div>
        <div className={`${styles.callout} ${styles.calloutNote}`} style={{ gap: 8 }} data-testid="geoai-query-dataset-catalog">
          <div className={styles.calloutHeader}>
            <div className={styles.calloutTitle}>Queryable tables</div>
            <div className={styles.calloutMeta}>{activeQueryDatasets.length} table{activeQueryDatasets.length === 1 ? "" : "s"}</div>
          </div>
          <div className={queryReadiness.ready ? styles.meta : styles.metaWarn} data-testid="geoai-query-readiness">
            {queryReadiness.ready
              ? queryReadiness.notes.join(" ")
              : queryReadiness.reason}
          </div>
          {activeQueryDatasets.length > 0 ? (
            <div className={styles.tableScroll}>
              <table className={`${styles.tableV2} ${styles.rowZebra}`}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Table alias</th>
                    <th style={{ textAlign: "left" }}>Layer</th>
                    <th style={{ textAlign: "left" }}>Geometry / rows</th>
                    <th style={{ textAlign: "left" }}>Fields</th>
                    <th style={{ textAlign: "left" }}>Sample row</th>
                  </tr>
                </thead>
                <tbody>
                  {activeQueryDatasets.map((dataset) => (
                    <tr key={dataset.id} data-testid={`geoai-query-dataset-${dataset.id}`}>
                      <td>
                        {queryMode === "live-project-data" ? (
                          <select
                            className={styles.select}
                            data-testid={`geoai-query-alias-${dataset.id}`}
                            value={dataset.tableName}
                            onChange={(event) => {
                              const nextAlias = event.target.value as QueryAlias;
                              setQueryAliasBindings((current) => ({
                                ...current,
                                [dataset.id]: nextAlias,
                              }));
                              setQueryNotice(null);
                            }}
                          >
                            {QUERY_ALIAS_OPTIONS.map((alias) => (
                              <option key={alias} value={alias}>{alias}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{dataset.tableName}</span>
                        )}
                      </td>
                      <td>
                        <div>{dataset.title}</div>
                        <div className={styles.meta}>{dataset.sourceLabel}</div>
                      </td>
                      <td>{dataset.geometryType} · {dataset.rowCount.toLocaleString()} rows</td>
                      <td>{formatFieldSummaries(dataset.fields)}</td>
                      <td><span className={styles.meta}>{formatSampleRow(dataset.sampleRows[0])}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {queryMode === "live-project-data" && queryCatalogLoading ? (
            <div className={styles.meta}>Inspecting live project layers and imported spatial tables for queryable geometry and fields.</div>
          ) : null}
          {queryMode === "live-project-data" && !queryCatalogLoading && activeQueryDatasets.length === 0 ? (
            <div className={styles.meta}>Publish or import a project layer to Map Explorer, including GeoJSON or columnar spatial data, then bind it here for live SQL.</div>
          ) : null}
        </div>
        <div className={styles.hstack}>
          {QUERY_PRESETS.map((preset) => (
            <button key={preset} type="button" className={styles.segBtn} onClick={() => setQueryPrompt(preset)}>
              {preset}
            </button>
          ))}
        </div>
        <textarea
          value={queryPrompt}
          data-testid="geoai-query-input"
          onChange={(event) => setQueryPrompt(event.target.value)}
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            background: "var(--ui-surface-2)",
            color: "var(--ui-text)",
            border: "1px solid var(--ui-border)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
          }}
        />
        <div className={styles.hstack}>
          <button
            type="button"
            className={styles.btnPrimary}
            data-testid="geoai-query-run"
            disabled={queryRunning || !queryReadiness.ready}
            onClick={() => void runQuery()}
          >
            {queryRunning
              ? `Executing ${formatQueryModeLabel(queryMode).toLowerCase()} SQL...`
              : `Generate SQL and run on ${formatQueryModeLabel(queryMode).toLowerCase()}`}
          </button>
        </div>
        {queryRunner.error ? <div className={styles.metaWarn}>{queryRunner.error}</div> : null}
        {queryNotice ? <div className={styles.meta} data-testid="geoai-query-notice">{queryNotice}</div> : null}
        {queryRunner.result ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }} data-testid="geoai-query-result">
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Mode</div>
                <div className={styles.metricValue}>{formatQueryModeLabel(queryMode)}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Intent</div>
                <div className={styles.metricValue}>{queryRunner.result.parse.intent}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Safety</div>
                <div className={styles.metricValue}>{queryRunner.result.safe ? "Accepted" : "Rejected"}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Layers</div>
                <div className={styles.metricValue}>{queryRunner.result.referencedLayers.join(", ") || "None"}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Spatial functions</div>
                <div className={styles.metricValue}>{queryRunner.result.spatialFunctions.join(", ") || "None"}</div>
              </div>
              <div className={styles.metric} style={metricCardStyle}>
                <div className={styles.metricLabel}>Rows returned</div>
                <div className={styles.metricValue}>{queryExecution?.rowCount ?? 0}</div>
              </div>
            </div>
            <div className={styles.meta}>
              {queryRunner.result.parse.explanation}
            </div>
            <div className={styles.meta}>
              Intended filters: {queryRunner.result.interpretation.thresholdsDetected.length > 0
                ? queryRunner.result.interpretation.thresholdsDetected.map((threshold) => `${threshold.operator} ${threshold.value}`).join(", ")
                : "none"}. Intended distances: {queryRunner.result.interpretation.distancesDetected.length > 0
                ? queryRunner.result.interpretation.distancesDetected.map((distance) => `${Math.round(distance.metres)} m`).join(", ")
                : "none"}. Intended fields: {queryRunner.result.interpretation.recognisedAttributes.join(", ") || "none"}.
            </div>
            {queryExecution ? (
              <div className={styles.meta}>
                Execution: {queryExecution.executed ? `completed in ${Math.round(queryExecution.elapsedMs)} ms` : "did not execute"}. Publication: {queryExecution.published ? "map + review" : "review only"}.
              </div>
            ) : null}
            <pre
              className={styles.monoTight}
              style={{
                margin: 0,
                padding: "12px 14px",
                borderRadius: 10,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border-soft)",
                whiteSpace: "pre-wrap",
              }}
            >
              {queryRunner.result.sql || "-- Query rejected before SQL generation."}
            </pre>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default GeoAILab;
