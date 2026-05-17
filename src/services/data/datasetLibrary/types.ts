import type { FeatureCollection } from "geojson";
import type { OverlayLayerConfig, ViewportState } from "../../../centerpanel/components/map/mapTypes";

export type TeachingDatasetId =
  | "new_york_city"
  | "london"
  | "barcelona"
  | "istanbul"
  | "singapore"
  | "melbourne"
  | "tokyo"
  | "amsterdam";

export type TeachingDatasetTheme =
  | "mobility"
  | "climate"
  | "housing"
  | "public_realm"
  | "urban_form"
  | "green_infrastructure";

export type TeachingDatasetDataType = "polygon" | "point" | "line";

export type DatasetPropertyType = "string" | "number" | "integer";

export interface TeachingDatasetFieldDefinition {
  name: string;
  type: DatasetPropertyType;
  description: string;
  unit?: string;
  required?: boolean;
}

export interface TeachingDatasetSpatialExtent {
  label: string;
  bounds: [number, number, number, number];
}

export interface TeachingDatasetLayerDefinition {
  id: string;
  title: string;
  summary: string;
  dataType: TeachingDatasetDataType;
  geometryType: "Point" | "LineString" | "Polygon";
  crs: string;
  source: string;
  license: string;
  updateDate: string;
  thematicCoverage: TeachingDatasetTheme[];
  schemaSummary: TeachingDatasetFieldDefinition[];
  featureCollection: FeatureCollection;
}

export interface TeachingDatasetPackage {
  id: TeachingDatasetId;
  city: string;
  title: string;
  summary: string;
  region: string;
  source: string;
  license: string;
  updateDate: string;
  crs: string;
  spatialExtent: TeachingDatasetSpatialExtent;
  thematicCoverage: TeachingDatasetTheme[];
  searchTerms: string[];
  layers: TeachingDatasetLayerDefinition[];
}

export interface TeachingDatasetLayerValidation {
  layerId: string;
  fieldNames: string[];
  featureCount: number;
  bounds?: [number, number, number, number];
}

export interface TeachingDatasetValidationReport {
  datasetId: TeachingDatasetId;
  valid: boolean;
  warnings: string[];
  layerReports: TeachingDatasetLayerValidation[];
}

export interface TeachingDatasetPedagogicalProfile {
  recommendedUseCases: string[];
  methodologicalCautions: string[];
  benchmarkQuestions: string[];
}

export interface TeachingDatasetManifestLayer {
  id: string;
  title: string;
  summary: string;
  dataType: TeachingDatasetDataType;
  dataTypeLabel: string;
  geometryType: TeachingDatasetLayerDefinition["geometryType"];
  source: string;
  license: string;
  updateDate: string;
  thematicCoverage: TeachingDatasetTheme[];
  thematicCoverageLabels: string[];
  featureCount: number;
  schemaSummary: TeachingDatasetFieldDefinition[];
}

export interface TeachingDatasetManifest {
  manifestVersion: string;
  exportedAt: string;
  datasetId: TeachingDatasetId;
  packageMetadata: {
    city: string;
    title: string;
    region: string;
    summary: string;
    source: string;
    license: string;
    updateDate: string;
    crs: string;
    spatialExtent: TeachingDatasetSpatialExtent;
    thematicCoverage: TeachingDatasetTheme[];
    thematicCoverageLabels: string[];
    searchTerms: string[];
    packageDataTypes: TeachingDatasetDataType[];
    packageDataTypeLabels: string[];
    packageFieldNames: string[];
    totalFeatureCount: number;
    totalLayerCount: number;
  };
  validation: TeachingDatasetValidationReport;
  pedagogicalProfile: TeachingDatasetPedagogicalProfile;
  layers: TeachingDatasetManifestLayer[];
}

export interface TeachingDatasetLoadResult {
  dataset: TeachingDatasetPackage;
  layers: OverlayLayerConfig[];
  validation: TeachingDatasetValidationReport;
  viewport: ViewportState;
}