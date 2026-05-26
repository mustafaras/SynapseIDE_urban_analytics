/* ==================================================================== */
/*  GIS Execution Contracts (type-only, no runtime)                      */
/*                                                                        */
/*  Single source of truth for the cross-prompt shapes used by the       */
/*  Map Explorer Production GIS plan                                      */
/*  (MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/15_AGENT_EXECUTION_      */
/*  PROMPTS.md). Independent agents import these names so their slices    */
/*  converge on identical interfaces instead of forking parallel ones.   */
/*                                                                        */
/*  These compose existing types from mapTypes.ts — they intentionally    */
/*  do NOT redefine layer/evidence/manifest concepts that already exist.  */
/* ==================================================================== */

import type {
  DrawnFeature,
  ImportLayerSourceMetadata,
  LayerCrsSummary,
  LayerSchemaFieldRole,
  LayerSchemaSummary,
  LayerScientificQACategorySummary,
  LayerSourceKind,
  MapEvidenceArtifactKind,
  MapEvidenceArtifactState,
  MapEvidenceQAState,
  MapLayerRegistryLayerSummary,
  MapReproducibilityManifest,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type { MapWorkflowKind } from "../MapWorkflowService";

/* -------------------------------------------------------------------- */
/*  Source registry (Prompts 4–5, 21, 26)                               */
/* -------------------------------------------------------------------- */

/** How the bytes/handle for a source are retained between sessions. */
export type SourceStorageMode =
  | "inline-small"
  | "indexeddb-local"
  | "worker-table"
  | "duckdb-table"
  | "url-refetch"
  | "external-service"
  | "metadata-only";

/** Whether a source can be reconstituted on project restore. */
export type SourceRestoreStatus =
  | "restored"
  | "recoverable"
  | "unavailable"
  | "external-reference"
  | "metadata-only";

/** Formats a profiled source can declare beyond the import formats. */
export type SourceFormat =
  | ImportLayerSourceMetadata["format"]
  | "flatgeobuf"
  | "pmtiles"
  | "wms"
  | "wfs"
  | "xyz"
  | "geotiff";

/**
 * Durable, lightweight description of a data source. Referenced by an
 * OverlayLayerConfig through `metadata` so heavy geometry never has to
 * live in the persisted Zustand store.
 */
export interface SourceHandle {
  /** Stable id referenced by layer records via metadata. */
  sourceId: string;
  kind: LayerSourceKind;
  storageMode: SourceStorageMode;
  restoreStatus: SourceRestoreStatus;
  format?: SourceFormat;
  crsSummary: LayerCrsSummary;
  featureCount: number | null;
  sizeBytes?: number;
  schemaSummary?: LayerSchemaSummary;
  license?: string;
  attribution?: string;
  /** Set when storageMode is worker-table | duckdb-table. */
  workerTableName?: string;
  /** url / indexeddb key / worker table name, depending on storageMode. */
  sourceRef?: string;
  caveats: string[];
  profiledAt: string;
}

/* -------------------------------------------------------------------- */
/*  CRS preflight (Prompts 6–8, 31)                                     */
/* -------------------------------------------------------------------- */

export type CrsExecutionKind = "geodesic" | "planar";

/** Remedy a user can take when a CRS preflight blocks or caveats an op. */
export type CrsRemedy = "declare-crs" | "reproject" | "use-geodesic" | "none";

/**
 * Result of evaluating whether a spatial operation is CRS-safe. Planar
 * metric operations on EPSG:4326 or unknown CRS must come back blocked.
 */
export interface CrsPreflightResult {
  ok: boolean;
  blocked: boolean;
  sourceCrs: string | null;
  /** Display CRS, typically EPSG:4326 for the MapLibre canvas. */
  displayCrs: string;
  /** Projected CRS chosen for metric work; null when none is available. */
  executionCrs: string | null;
  executionKind: CrsExecutionKind;
  /** Human-readable block/caveat reason including a remedy hint. */
  reason?: string;
  remedy?: CrsRemedy;
  caveats: string[];
}

/* -------------------------------------------------------------------- */
/*  Command lifecycle (Prompts 9, 13–14)                                */
/* -------------------------------------------------------------------- */

export type MapCommandKind =
  | "layer.remove"
  | "layer.style"
  | "workflow.apply"
  | "report.handoff"
  | "aoi.edit"
  | "source.restore"
  | "crs.declare";

export type MapCommandStatus = "previewed" | "applied" | "blocked" | "reverted";

export interface MapCommandPreflight {
  ok: boolean;
  blockers: string[];
  caveats: string[];
  crs?: CrsPreflightResult;
}

export interface MapCommandResult {
  commandId: string;
  kind: MapCommandKind;
  status: MapCommandStatus;
  /** Reuses the existing reproducibility manifest model. */
  manifest?: MapReproducibilityManifest;
  reviewEventId?: string;
  revertable: boolean;
  createdAt: string;
}

/* -------------------------------------------------------------------- */
/*  Map <-> Urban bridge (Prompts 16–18)                                */
/* -------------------------------------------------------------------- */

export type MapToUrbanContextDestinationIntent = "urban-evidence-tray" | "method-recommendations";

export interface MapToUrbanAoiPayloadReference {
  aoiId: string | null;
  label: string | null;
  geometryFamily: DrawnFeature["geometry"]["type"] | string | null;
  bbox: [number, number, number, number] | null;
  source: "active-aoi" | "map-view" | "none";
  validationStatus: string | null;
  validationIssueCodes: string[];
  caveats: string[];
}

export interface MapToUrbanLayerFieldDescriptor {
  name: string;
  role: LayerSchemaFieldRole | "unknown";
  source: "schema" | "metadata" | "feature-scan";
  type?: string;
}

export interface MapToUrbanLayerFieldSummary {
  layerId: string;
  fieldCount: number;
  fields: MapToUrbanLayerFieldDescriptor[];
  temporalFields: string[];
  truncated: boolean;
}

export interface MapToUrbanLayerPayloadSummary {
  layerId: string;
  name: string;
  registry: MapLayerRegistryLayerSummary;
  selectedFeatureCount: number;
  activeAnalysisResult: boolean;
  fieldSummary: MapToUrbanLayerFieldSummary;
  crs: {
    crs: string | null;
    status: string;
    source: string;
    notes: string[];
  };
  qa: {
    status: string;
    issueIds: string[];
    badges: string[];
    featureIssueCount: number;
    caveats: string[];
    categorySummaries?: LayerScientificQACategorySummary[];
  };
  readiness: {
    status: string;
    missingFields: string[];
    blockingIssueIds: string[];
    caveats: string[];
  };
  workflow: {
    runId: string | null;
    sourceRunId: string | null;
    workflowId: string | null;
    evidenceArtifactId: string | null;
    reproducibilityManifestId: string | null;
  };
}

export interface MapToUrbanContextCrsSummary {
  distinct: string[];
  missingLayerIds: string[];
  mixedCrs: boolean;
  byLayer: Array<{
    layerId: string;
    crs: string | null;
    status: string;
    source: string;
  }>;
}

export interface MapToUrbanContextQaSummary {
  status: string;
  checkedAt: string | null;
  layerCount: number;
  blockedLayerCount: number;
  issueCounts: Record<string, number>;
  blockingIssueIds: string[];
  warningIssueIds: string[];
}

export interface MapToUrbanEvidenceSummary {
  artifactId: string;
  kind: MapEvidenceArtifactKind;
  title: string;
  state: MapEvidenceArtifactState;
  sourceModule: string;
  linkedLayerIds: string[];
  sourceLayerIds: string[];
  linkedAoiId: string | null;
  linkedRunId: string | null;
  linkedWorkflowId: string | null;
  derivedLayerId: string | null;
  qaState: MapEvidenceQAState;
  qaIssueCount: number;
  qaBlockerCount: number;
  updatedAt: string;
}

export interface MapToUrbanWorkflowSummary {
  activeWorkflowId: string | null;
  activeAnalysisResultLayerIds: string[];
  activeRunIds: string[];
  layerRunIds: string[];
  manifestIds: string[];
}

export interface MapToUrbanContextPayload {
  version: 1;
  payloadId: string;
  sourceModule: "map-explorer";
  destinationModule: "urban-analytics";
  destinationIntent: MapToUrbanContextDestinationIntent[];
  createdAt: string;
  requestedLayerId: string | null;
  context: MapExplorerContextSummary;
  aoiReference: MapToUrbanAoiPayloadReference;
  layerSummaries: MapToUrbanLayerPayloadSummary[];
  visibleLayerIds: string[];
  queryableLayerIds: string[];
  selectedFeatureCounts: Array<{ layerId: string; count: number }>;
  fieldSummaries: MapToUrbanLayerFieldSummary[];
  crsSummary: MapToUrbanContextCrsSummary;
  qaSummary: MapToUrbanContextQaSummary;
  evidenceSummaries: MapToUrbanEvidenceSummary[];
  workflowSummary: MapToUrbanWorkflowSummary;
  disabledReasons: string[];
}

export type UrbanToMapGeometryRequirement = "point" | "line" | "polygon" | "mixed" | "unknown";
export type UrbanToMapTemporalRequirement = "required" | "optional" | "not-required";

export type UrbanToMapMethodRequestActionType =
  | "focus-compatible-layers"
  | "validate-aoi"
  | "preview-map-workflow"
  | "publish-derived-layer"
  | "prepare-report-ready-snapshot";

export interface UrbanToMapMethodRequestAction {
  type: UrbanToMapMethodRequestActionType;
  label?: string;
  workflowKind?: MapWorkflowKind;
  targetLayerIds?: string[];
  reportScope?: "map-view" | "layer";
}

export type UrbanToMapMethodRequestActionInput =
  | UrbanToMapMethodRequestActionType
  | UrbanToMapMethodRequestAction;

export interface UrbanToMapLayerRequirements {
  targetLayerIds?: string[];
  geometryTypes?: UrbanToMapGeometryRequirement[];
  requiredFields?: string[];
  optionalFields?: string[];
  temporal?: UrbanToMapTemporalRequirement;
  minFeatureCount?: number;
  requireVisible?: boolean;
  requireQueryable?: boolean;
  requiredCrs?: string;
}

export interface UrbanToMapAoiRequirements {
  required?: boolean;
  preferredAoiId?: string;
  geometryTypes?: UrbanToMapGeometryRequirement[];
}

export interface UrbanToMapWorkflowRequirements {
  kind?: MapWorkflowKind;
  distanceMeters?: number;
  outputLayerName?: string;
  sourceLayerId?: string;
  comparisonLayerId?: string;
}

export interface UrbanToMapMethodRequirements {
  layer?: UrbanToMapLayerRequirements;
  aoi?: UrbanToMapAoiRequirements;
  workflow?: UrbanToMapWorkflowRequirements;
  recommendedScale?: string;
  dataFitnessThreshold?: number | null;
}

export interface UrbanToMapMethodValiditySummary {
  status: "complete" | "partial" | "missing";
  capabilityStatus: "implemented" | "demo_mode" | "residual_gap" | "environment_dependent" | "deferred";
  blockers: string[];
  warnings: string[];
}

/** Urban -> Map: a method request describing prerequisites to satisfy. */
export interface UrbanToMapMethodRequestPayload {
  version: 1;
  requestId: string;
  createdAt: string;
  methodId: string;
  sourceModule: "urban-analytics";
  destinationModule: "map-explorer";
  methodLabel?: string;
  methodValidity?: UrbanToMapMethodValiditySummary;
  cardId?: string;
  workflowId?: string;
  selectedIndicatorKind?: string;
  outputIntent?: "inspect" | "derive-layer" | "report" | "dashboard" | "ide";
  reportIntent?: "snapshot" | "citation" | "method-appendix";
  dashboardIntent?: "layer-binding" | "metric-binding";
  requirements?: UrbanToMapMethodRequirements;
  requestedActions: UrbanToMapMethodRequestActionInput[];
}

/* -------------------------------------------------------------------- */
/*  Processing toolbox (Prompts 24a–24c, 25)                            */
/* -------------------------------------------------------------------- */

export type ToolExecutionMode = "main-preview" | "worker" | "geos-wasm" | "duckdb";

export type ToolParameterType =
  | "layer"
  | "field"
  | "number"
  | "text"
  | "enum"
  | "crs"
  | "aoi"
  | "boolean";

export interface ToolParameterDescriptor {
  key: string;
  label: string;
  type: ToolParameterType;
  required: boolean;
  enumValues?: string[];
  /** Optional default seeded into the parameter form. */
  defaultValue?: string | number | boolean;
  /** Optional help text shown under the field. */
  help?: string;
}

export interface ProcessingToolDescriptor {
  toolId: string;
  title: string;
  category: string;
  summary: string;
  parameters: ToolParameterDescriptor[];
  requiresCrs: boolean;
  executionMode: ToolExecutionMode;
  qaGated: boolean;
  urbanMethodIds: string[];
  /** False when the tool is registered but not yet wired end-to-end. */
  implemented: boolean;
}
