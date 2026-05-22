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
  ImportLayerSourceMetadata,
  LayerCrsSummary,
  LayerSchemaSummary,
  LayerSourceKind,
  MapLayerRegistryLayerSummary,
  MapReproducibilityAoiReference,
  MapReproducibilityCrsSummary,
  MapReproducibilityManifest,
  OverlayGeometryType,
} from "@/centerpanel/components/map/mapTypes";

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

/** Map -> Urban: typed summaries + IDs only, never raw geometry. */
export interface MapToUrbanContextPayload {
  version: 1;
  mapContextId: string;
  activeLayerSummaries: MapLayerRegistryLayerSummary[];
  aoi?: MapReproducibilityAoiReference;
  selection?: {
    layerId: string;
    selectedFeatureCount: number;
  };
  crs: MapReproducibilityCrsSummary;
  qaBlockers: string[];
  emittedAt: string;
}

/** Urban -> Map: a method request describing prerequisites to satisfy. */
export interface UrbanToMapMethodRequestPayload {
  version: 1;
  requestId: string;
  methodId: string;
  methodName: string;
  requiredGeometry?: OverlayGeometryType;
  requiredFields: string[];
  requiredCrs?: string;
  requiresAoi: boolean;
  notes: string[];
}

/* -------------------------------------------------------------------- */
/*  Processing toolbox (Prompts 24a–24c, 25)                            */
/* -------------------------------------------------------------------- */

export type ToolExecutionMode = "main-preview" | "worker" | "geos-wasm" | "duckdb";

export type ToolParameterType =
  | "layer"
  | "field"
  | "number"
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
