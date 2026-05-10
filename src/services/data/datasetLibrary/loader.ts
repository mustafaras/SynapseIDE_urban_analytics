import type { GeoJsonProperties } from "geojson";
import { buildFeatureCollectionMetadata, getFeatureCollectionBounds, MapDataImportError, validateFeatureCollection } from "../../map/MapDataImporter";
import type { OverlayLayerConfig, ViewportState } from "../../../centerpanel/components/map/mapTypes";
import { useMapExplorerStore } from "../../../stores/useMapExplorerStore";
import {
  getDatasetPackageFieldNames,
  getTeachingDatasetById,
  TEACHING_DATASET_PACKAGES,
} from "./catalog";
import type {
  DatasetPropertyType,
  TeachingDatasetId,
  TeachingDatasetLayerDefinition,
  TeachingDatasetLoadResult,
  TeachingDatasetPackage,
  TeachingDatasetValidationReport,
} from "./types";

const SUPPORTED_CRS = new Set(["EPSG:4326"]);

function normalizeNumericType(value: number): DatasetPropertyType {
  return Number.isInteger(value) ? "integer" : "number";
}

function inferPropertyType(values: unknown[]): DatasetPropertyType | "mixed" | "unknown" {
  const presentValues = values.filter((value) => value !== null && value !== undefined);
  if (presentValues.length === 0) {
    return "unknown";
  }

  let inferred: DatasetPropertyType | null = null;
  for (const value of presentValues) {
    let next: DatasetPropertyType | null = null;
    if (typeof value === "string") {
      next = "string";
    } else if (typeof value === "number" && Number.isFinite(value)) {
      next = normalizeNumericType(value);
    }

    if (!next) {
      return "mixed";
    }

    if (!inferred) {
      inferred = next;
      continue;
    }

    if (inferred === next) {
      continue;
    }

    if ((inferred === "integer" && next === "number") || (inferred === "number" && next === "integer")) {
      inferred = "number";
      continue;
    }

    return "mixed";
  }

  return inferred ?? "unknown";
}

function validateLayerSchema(layer: TeachingDatasetLayerDefinition): string[] {
  const issues: string[] = [];
  const fields = new Set(layer.schemaSummary.map((field) => field.name));
  const metadata = buildFeatureCollectionMetadata(layer.featureCollection);

  for (const field of layer.schemaSummary) {
    if (field.required && !metadata.fields?.includes(field.name)) {
      issues.push(`${layer.title} is missing required field "${field.name}".`);
      continue;
    }

    const values = layer.featureCollection.features.map((feature) => feature.properties?.[field.name]);
    const inferredType = inferPropertyType(values);
    if (inferredType === "unknown") {
      issues.push(`${layer.title} field "${field.name}" has no populated values.`);
      continue;
    }
    if (inferredType === "mixed") {
      issues.push(`${layer.title} field "${field.name}" contains mixed value types.`);
      continue;
    }
    if (field.type === "number" && inferredType === "integer") {
      continue;
    }
    if (field.type !== inferredType) {
      issues.push(`${layer.title} field "${field.name}" expected ${field.type} but found ${inferredType}.`);
    }
  }

  const unknownFields = (metadata.fields ?? []).filter((fieldName) => !fields.has(fieldName));
  if (unknownFields.length > 0) {
    issues.push(`${layer.title} includes fields not declared in schema summary: ${unknownFields.join(", ")}.`);
  }

  return issues;
}

function ensureProperties(featureProperties: GeoJsonProperties | null | undefined): GeoJsonProperties {
  return (featureProperties ?? {}) as GeoJsonProperties;
}

function estimateZoom(bounds: [number, number, number, number]): number {
  const lngSpan = Math.abs(bounds[2] - bounds[0]);
  const latSpan = Math.abs(bounds[3] - bounds[1]);
  const dominantSpan = Math.max(lngSpan, latSpan, 0.01);
  const zoom = 11.65 - Math.log2(dominantSpan * 14);
  return Math.max(9, Math.min(13.4, Number(zoom.toFixed(1))));
}

export function suggestViewportForDataset(dataset: TeachingDatasetPackage): ViewportState {
  const bounds = dataset.spatialExtent.bounds;
  return {
    center: [
      Number(((bounds[0] + bounds[2]) / 2).toFixed(6)),
      Number(((bounds[1] + bounds[3]) / 2).toFixed(6)),
    ],
    zoom: estimateZoom(bounds),
    bearing: 0,
    pitch: 0,
  };
}

export function validateTeachingDatasetPackage(dataset: TeachingDatasetPackage): TeachingDatasetValidationReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  const packageFieldNames = getDatasetPackageFieldNames(dataset);
  const layerReports = dataset.layers.map((layer) => {
    if (!SUPPORTED_CRS.has(layer.crs) || layer.crs !== dataset.crs) {
      issues.push(`${dataset.city} layer ${layer.title} uses unsupported CRS ${layer.crs}.`);
    }

    try {
      validateFeatureCollection(layer.featureCollection);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : `${dataset.city} layer ${layer.title} failed geometry validation.`);
    }

    issues.push(...validateLayerSchema(layer));

    const bounds = getFeatureCollectionBounds(layer.featureCollection);
    if (!bounds) {
      warnings.push(`${dataset.city} layer ${layer.title} did not produce bounds.`);
    }

    return {
      layerId: layer.id,
      fieldNames: layer.schemaSummary.map((field) => field.name),
      featureCount: layer.featureCollection.features.length,
      ...(bounds ? { bounds } : {}),
    };
  });

  if (packageFieldNames.length === 0) {
    warnings.push(`${dataset.city} package has an empty schema summary.`);
  }

  if (issues.length > 0) {
    throw new MapDataImportError(`Teaching dataset validation failed for ${dataset.city}: ${issues.join(" ")}`);
  }

  return {
    datasetId: dataset.id,
    valid: true,
    warnings,
    layerReports,
  };
}

function buildDatasetLayer(dataset: TeachingDatasetPackage, layer: TeachingDatasetLayerDefinition): OverlayLayerConfig {
  const metadata = buildFeatureCollectionMetadata(layer.featureCollection);
  const packageFeatureCount = dataset.layers.reduce(
    (sum, currentLayer) => sum + currentLayer.featureCollection.features.length,
    0,
  );
  return {
    id: `teaching-${dataset.id}-${layer.id}`,
    name: `${dataset.city} - ${layer.title}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: {
      type: "FeatureCollection",
      features: layer.featureCollection.features.map((feature) => ({
        ...feature,
        properties: ensureProperties(feature.properties),
      })),
    },
    group: "data",
    metadata: {
      ...metadata,
      fields: layer.schemaSummary.map((field) => field.name),
      datasetContext: {
        datasetId: dataset.id,
        datasetTitle: dataset.title,
        datasetCity: dataset.city,
        layerId: layer.id,
        layerTitle: layer.title,
        source: layer.source,
        license: layer.license,
        crs: layer.crs,
        updateDate: layer.updateDate,
        thematicCoverage: layer.thematicCoverage,
        spatialExtent: dataset.spatialExtent.label,
        schemaSummary: layer.schemaSummary.map((field) => field.name),
        packageLayerCount: dataset.layers.length,
        packageFeatureCount,
      },
    },
  };
}

export function loadTeachingDatasetPackage(datasetId: TeachingDatasetId): TeachingDatasetLoadResult {
  const dataset = getTeachingDatasetById(datasetId);
  if (!dataset) {
    throw new MapDataImportError(`Unknown teaching dataset: ${datasetId}.`);
  }

  const validation = validateTeachingDatasetPackage(dataset);
  return {
    dataset,
    layers: dataset.layers.map((layer) => buildDatasetLayer(dataset, layer)),
    validation,
    viewport: suggestViewportForDataset(dataset),
  };
}

export function loadTeachingDatasetIntoMapWorkspace(datasetId: TeachingDatasetId): TeachingDatasetLoadResult {
  const result = loadTeachingDatasetPackage(datasetId);
  const state = useMapExplorerStore.getState();
  for (const layer of result.layers) {
    state.addOverlayLayer(layer);
  }
  useMapExplorerStore.setState({
    isOpen: true,
    center: result.viewport.center,
    zoom: result.viewport.zoom,
    bearing: result.viewport.bearing,
    pitch: result.viewport.pitch,
  });
  return result;
}

export function getTeachingDatasetLibrary(): readonly TeachingDatasetPackage[] {
  return TEACHING_DATASET_PACKAGES;
}