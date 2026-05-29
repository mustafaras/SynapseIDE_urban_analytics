import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  LayerMetadata,
  MapReproducibilityManifest,
  OverlayLayerConfig,
  OverlaySourceData,
} from "@/centerpanel/components/map/mapTypes";
import { getFeatureCollectionBounds } from "@/services/map/MapDataImporter";
import { resolveOverlayLayerCrsSummary } from "@/centerpanel/components/map/mapLayerMetadata";
import { evaluateMapScientificQASync } from "@/services/map/MapScientificQA";
import {
  validateAndRepairTopology,
  type TopologyRepairInput,
  type TopologyRepairPreview,
  type TopologyRepairWorkerRequest,
  type TopologyRepairWorkerResponse,
} from "@/workers/topologyRepairWorker";

export interface TopologyRepairLayerPreview {
  layerId: string;
  layerName: string;
  status: TopologyRepairPreview["status"];
  canApply: boolean;
  preview: TopologyRepairPreview;
  outputLayer: OverlayLayerConfig | null;
  manifest: MapReproducibilityManifest | null;
  blockers: string[];
  caveats: string[];
}

export interface TopologyRepairOptions {
  now?: () => string;
  idFactory?: () => string;
  mapContextId?: string;
  forceInline?: boolean;
}

let topologyRepairCounter = 0;

function createTopologyRepairSeed(): string {
  topologyRepairCounter += 1;
  return `${Date.now().toString(36)}-${topologyRepairCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function previewLayerTopologyRepair(
  layer: OverlayLayerConfig,
  options: TopologyRepairOptions = {},
): Promise<TopologyRepairLayerPreview> {
  const createdAt = options.now?.() ?? new Date().toISOString();
  const sourceCollection = sourceDataToFeatureCollection(layer.sourceData);
  if (!sourceCollection) {
    const preview = blockedTopologyPreview(layer, createdAt, "Topology repair needs an inline GeoJSON feature collection.");
    return {
      layerId: layer.id,
      layerName: layer.name,
      status: preview.status,
      canApply: false,
      preview,
      outputLayer: null,
      manifest: null,
      blockers: preview.blockers,
      caveats: preview.caveats,
    };
  }

  const input: TopologyRepairInput = {
    layerId: layer.id,
    layerName: layer.name,
    featureCollection: cloneFeatureCollection(sourceCollection),
    checkedAt: createdAt,
  };
  const preview = options.forceInline
    ? await validateAndRepairTopology(input)
    : await runTopologyRepairWorker(input).catch(() => validateAndRepairTopology(input));
  const seed = options.idFactory?.() ?? createTopologyRepairSeed();
  const manifestId = `manifest-topology-repair-${seed}`;
  const manifest = preview.canApply
    ? buildTopologyRepairManifest({
        layer,
        preview,
        createdAt,
        manifestId,
        mapContextId: options.mapContextId ?? "map-explorer",
      })
    : null;
  const outputLayer = manifest ? buildTopologyRepairLayer(layer, preview, manifest, createdAt) : null;

  return {
    layerId: layer.id,
    layerName: layer.name,
    status: preview.status,
    canApply: preview.canApply && outputLayer !== null && manifest !== null,
    preview,
    outputLayer,
    manifest,
    blockers: preview.blockers,
    caveats: preview.caveats,
  };
}

function runTopologyRepairWorker(input: TopologyRepairInput): Promise<TopologyRepairPreview> {
  if (typeof Worker === "undefined") {
    return validateAndRepairTopology(input);
  }

  return new Promise<TopologyRepairPreview>((resolve, reject) => {
    const requestId = `topology-repair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const worker = new Worker(new URL("../../../workers/topologyRepairWorker.ts", import.meta.url), { type: "module" });
    const cleanup = (): void => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<TopologyRepairWorkerResponse>) => {
      if (event.data.requestId !== requestId) return;
      cleanup();
      if (event.data.ok) {
        resolve(event.data.preview);
      } else {
        reject(new Error(event.data.error));
      }
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Topology repair worker failed."));
    };
    const request: TopologyRepairWorkerRequest = { requestId, input };
    worker.postMessage(request);
  });
}

function blockedTopologyPreview(
  layer: OverlayLayerConfig,
  checkedAt: string,
  blocker: string,
): TopologyRepairPreview {
  return {
    status: "blocked",
    canApply: false,
    layerId: layer.id,
    layerName: layer.name,
    sourceFeatureCount: 0,
    outputFeatureCount: 0,
    repairedFeatureCount: 0,
    removedFeatureCount: 0,
    findings: [],
    blockers: [blocker],
    caveats: [],
    repairedFeatureCollection: { type: "FeatureCollection", features: [] },
    usedGeos: false,
    provenance: {
      engine: "geos-wasm",
      operations: [],
      previewedAt: checkedAt,
    },
  };
}

function buildTopologyRepairLayer(
  layer: OverlayLayerConfig,
  preview: TopologyRepairPreview,
  manifest: MapReproducibilityManifest,
  createdAt: string,
): OverlayLayerConfig {
  const geometryType = geometryClassOf(preview.repairedFeatureCollection.features, layer.metadata?.geometryType ?? "Geometry");
  const bounds = getFeatureCollectionBounds(preview.repairedFeatureCollection);
  const sourceCrs = resolveOverlayLayerCrsSummary(layer);
  const findingCodes = Array.from(new Set(preview.findings.map((finding) => finding.code)));
  const metadata: LayerMetadata = {
    ...(layer.metadata ?? {}),
    featureCount: preview.outputFeatureCount,
    geometryType,
    updatedAt: createdAt,
    dataVersion: `topology-repair:${createdAt}`,
    reproducibilityManifest: manifest,
    topologyRepair: {
      version: 1,
      repairedAt: createdAt,
      sourceLayerId: layer.id,
      engine: "geos-wasm",
      operations: preview.provenance.operations,
      findingCodes,
      sourceFeatureCount: preview.sourceFeatureCount,
      outputFeatureCount: preview.outputFeatureCount,
      repairedFeatureCount: preview.repairedFeatureCount,
      removedFeatureCount: preview.removedFeatureCount,
      caveats: preview.caveats,
      manifestId: manifest.manifestId,
    },
    crsSummary: {
      crs: sourceCrs.crs,
      status: sourceCrs.status,
      source: sourceCrs.source,
      notes: [
        ...sourceCrs.notes,
        "Topology validated with geos-wasm before repair was applied.",
      ],
    },
    ...(bounds ? { bounds } : {}),
  };
  const baseLayer: OverlayLayerConfig = {
    ...layer,
    sourceData: preview.repairedFeatureCollection,
    queryable: layer.queryable ?? true,
    provenance: {
      ...(layer.provenance ?? { label: layer.name }),
      method: "Topology repair (GEOS isValid/makeValid)",
      generatedAt: createdAt,
      sourceLayerIds: Array.from(new Set([layer.id, ...(layer.provenance?.sourceLayerIds ?? [])])),
      notes: [
        ...(layer.provenance?.notes ?? []),
        ...preview.caveats,
      ],
    },
    metadata,
  };

  const qa = evaluateMapScientificQASync([baseLayer], { workerThresholdFeatures: Number.POSITIVE_INFINITY });
  const summary = qa.layerSummaries[0];
  if (!summary) return baseLayer;

  return {
    ...baseLayer,
    qaStatus: summary.status,
    metadata: {
      ...(baseLayer.metadata ?? {}),
      scientificQA: summary.metadata,
    },
  };
}

function buildTopologyRepairManifest(input: {
  layer: OverlayLayerConfig;
  preview: TopologyRepairPreview;
  createdAt: string;
  manifestId: string;
  mapContextId: string;
}): MapReproducibilityManifest {
  const { layer, preview, createdAt, manifestId, mapContextId } = input;
  const sourceCrs = resolveOverlayLayerCrsSummary(layer);
  const outputGeometryClass = geometryClassOf(preview.repairedFeatureCollection.features, layer.metadata?.geometryType ?? "Geometry");
  const bounds = getFeatureCollectionBounds(preview.repairedFeatureCollection) ?? null;
  const blockerCount = preview.blockers.length;
  const warningCount = preview.findings.filter((finding) => finding.severity === "warning").length;
  const findingCodes = Array.from(new Set(preview.findings.map((finding) => finding.code)));

  return {
    version: 1,
    manifestId,
    workflowId: "topology.repair",
    status: preview.canApply ? "applied" : "blocked",
    createdAt,
    mapContextId,
    operation: "Topology repair",
    workflowKind: "topology.repair",
    inputLayerIds: [layer.id],
    sourceLayerIds: [layer.id],
    outputLayerIds: [layer.id],
    sourceLayers: [{
      layerId: layer.id,
      role: "source",
      name: layer.name,
      ...(layer.sourceKind ? { sourceKind: layer.sourceKind } : {}),
      ...(typeof layer.metadata?.featureCount === "number" ? { featureCount: layer.metadata.featureCount } : {}),
    }],
    outputLayers: [{
      layerId: layer.id,
      role: "derived-output",
      name: layer.name,
      sourceKind: layer.sourceKind ?? "derived",
      featureCount: preview.outputFeatureCount,
    }],
    aoiReference: {
      source: "none",
      selectedLayerIds: [layer.id],
      selectedFeatureCount: 0,
      drawnPolygonCount: 0,
    },
    viewportBounds: null,
    parameters: {
      engine: "geos-wasm",
      operations: preview.provenance.operations,
      findingCodes,
      removedFeatureCount: preview.removedFeatureCount,
    },
    crsSummary: {
      status: sourceCrs.crs ? "known" : "missing",
      sourceCrs: sourceCrs.crs,
      displayCrs: "EPSG:4326",
      executionCrs: sourceCrs.crs,
      executionKind: "geodesic",
      sourceLayerCrs: [{ layerId: layer.id, crs: sourceCrs.crs }],
      missingLayerIds: sourceCrs.crs ? [] : [layer.id],
      notes: sourceCrs.notes,
    },
    qaSummary: {
      status: blockerCount > 0 ? "blocked" : warningCount > 0 || preview.caveats.length > 0 ? "warning" : "passed",
      issueIds: findingCodes,
      blockerCount,
      warningCount,
      infoCount: preview.caveats.length,
      blockers: preview.blockers,
      warnings: preview.findings
        .filter((finding) => finding.severity === "warning")
        .map((finding) => `${finding.title}: ${finding.detail}`),
      caveats: preview.caveats,
    },
    expectedOutput: {
      layerName: layer.name,
      geometryClass: outputGeometryClass,
      featureCount: preview.outputFeatureCount,
      bounds,
      outputLayerGroup: layer.group ?? "data",
      needsWorker: true,
      reportCompatible: true,
      dashboardCompatible: true,
      ideCompatible: true,
    },
    handoffReferences: { reportItemIds: [], dashboardBindingIds: [], ideArtifactIds: [] },
    qaIssueIds: findingCodes,
    sourceDataVersions: { [layer.id]: layer.metadata?.dataVersion ?? null },
    engine: "MapWorkflowService",
    engineVersion: "topology-repair-geos-wasm-1",
  };
}

function sourceDataToFeatureCollection(sourceData: OverlaySourceData | undefined): FeatureCollection | null {
  if (!sourceData || typeof sourceData === "string") return null;
  if (sourceData.type === "FeatureCollection" && Array.isArray(sourceData.features)) {
    return sourceData as FeatureCollection;
  }
  if (sourceData.type === "Feature") {
    return { type: "FeatureCollection", features: [sourceData as Feature] };
  }
  if (isGeometry(sourceData)) {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: sourceData, properties: {} }],
    };
  }
  return null;
}

function cloneFeatureCollection(featureCollection: FeatureCollection): FeatureCollection {
  if (typeof structuredClone === "function") {
    return structuredClone(featureCollection) as FeatureCollection;
  }
  return JSON.parse(JSON.stringify(featureCollection)) as FeatureCollection;
}

function geometryClassOf(features: Feature[], fallback: string): string {
  const types = new Set(features.map((feature) => feature.geometry?.type).filter(Boolean) as string[]);
  if (types.size === 0) return fallback;
  if (types.size === 1) return [...types][0] ?? fallback;
  return "GeometryCollection";
}

function isGeometry(value: OverlaySourceData): value is Geometry {
  return typeof value === "object"
    && value !== null
    && "type" in value
    && typeof value.type === "string"
    && value.type !== "Feature"
    && value.type !== "FeatureCollection";
}
