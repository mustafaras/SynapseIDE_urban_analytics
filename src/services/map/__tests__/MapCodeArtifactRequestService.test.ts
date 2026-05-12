// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type {
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import { synapseBus } from "@/services/synapseBus";

import {
  assessMapCodeArtifactRequestSize,
  buildMapManifestRequest,
  buildSqlQueryRequest,
  buildWorkflowNotebookRequest,
  buildWorkflowScriptRequest,
  dispatchMapCodeArtifactRequest,
} from "../MapCodeArtifactRequestService";

const bridgeCalls: Array<{ filename: string; code: string; language?: string }> = [];

vi.mock("@/services/editorBridge", () => ({
  openNewTab: vi.fn(async (opts: { filename: string; code: string; language?: string }) => {
    bridgeCalls.push(opts);
    return { tabId: `tab-${bridgeCalls.length}` };
  }),
}));

afterEach(() => {
  bridgeCalls.length = 0;
  synapseBus._resetForTesting();
});

const contextSummary: MapExplorerContextSummary = {
  contextId: "map-context-1",
  updatedAt: "2026-05-09T08:15:00.000Z",
  viewport: {
    center: [-74, 40.7],
    zoom: 11,
    bearing: 0,
    pitch: 0,
    baseLayerId: "dark",
  },
  currentBounds: [-74.2, 40.6, -73.8, 40.9],
  currentBoundsUpdatedAt: "2026-05-09T08:14:00.000Z",
  activeAoi: {
    aoiId: "aoi-downtown",
    geometryFamily: "polygon",
    bbox: [-74.05, 40.69, -73.92, 40.78],
  },
  visibleLayerIds: ["layer-parcels", "layer-transit"],
  selectedLayerIds: ["layer-parcels"],
  activeAnalysisResultLayerIds: [],
  selection: {
    totalSelectedFeatures: 3,
    layerCounts: [{ layerId: "layer-parcels", count: 3 }],
  },
  qa: {
    status: "warning",
    checkedAt: "2026-05-09T08:10:00.000Z",
    layerCount: 2,
    blockedLayerCount: 0,
    issueCounts: {
      info: 0,
      warning: 1,
      error: 0,
      blocker: 0,
    },
  },
};

const overlayLayers: OverlayLayerConfig[] = [
  {
    id: "layer-parcels",
    name: "Parcels",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    queryable: true,
    sourceKind: "imported",
    qaStatus: "warning",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [-73.99, 40.72],
          },
          properties: { raw: "must-not-cross" },
        },
      ],
    },
    metadata: {
      featureCount: 12,
      geometryType: "Point",
      evidenceArtifactId: "source-artifact-1",
      columnar: {
        format: "geoparquet",
        rowCount: 12,
        geometryColumn: "geometry",
        workerTableName: "duckdb_parcels",
      },
      crsSummary: {
        status: "known",
        crs: "EPSG:3857",
        source: "columnar",
        notes: [],
      },
    },
  },
  {
    id: "layer-transit",
    name: "Transit Stops",
    type: "geojson",
    visible: true,
    opacity: 0.7,
    queryable: true,
    sourceKind: "project",
    qaStatus: "passed",
    metadata: {
      featureCount: 33,
      geometryType: "Point",
      crsSummary: {
        status: "missing",
        crs: null,
        source: "unknown",
        notes: ["No CRS metadata supplied."],
      },
    },
  },
];

const workflowManifest: MapReproducibilityManifest = {
  version: 1,
  manifestId: "manifest-buffer-1",
  workflowId: "workflow-buffer-1",
  status: "preview",
  createdAt: "2026-05-09T08:20:00.000Z",
  mapContextId: "map-context-1",
  operation: "buffer",
  workflowKind: "buffer",
  inputLayerIds: ["layer-parcels"],
  sourceLayerIds: ["layer-parcels"],
  outputLayerIds: ["preview-buffer"],
  sourceLayers: [{ layerId: "layer-parcels", role: "source", name: "Parcels", sourceKind: "imported", featureCount: 12 }],
  outputLayers: [{ layerId: "preview-buffer", role: "preview", name: "Parcels buffer", sourceKind: "derived", featureCount: 12 }],
  aoiReference: {
    source: "active-aoi",
    label: "aoi-downtown",
    aoiId: "aoi-downtown",
    selectedLayerIds: ["layer-parcels"],
    selectedFeatureCount: 3,
    drawnPolygonCount: 1,
  },
  viewportBounds: [-74.05, 40.69, -73.92, 40.78],
  parameters: { distanceMeters: 250 },
  crsSummary: {
    status: "known",
    displayCrs: "EPSG:3857",
    sourceLayerCrs: [{ layerId: "layer-parcels", crs: "EPSG:3857" }],
    missingLayerIds: [],
    notes: ["Projected before buffer calculation."],
  },
  qaSummary: {
    status: "warning",
    issueIds: ["qa-metadata-warning"],
    blockerCount: 0,
    warningCount: 1,
    infoCount: 0,
    blockers: [],
    warnings: ["Metadata should be reviewed."],
    caveats: ["Review source vintage."],
  },
  expectedOutput: {
    layerName: "Parcels buffer",
    geometryClass: "polygon",
    featureCount: 12,
    bounds: [-74.05, 40.69, -73.92, 40.78],
    outputLayerGroup: "analysis",
    needsWorker: true,
    reportCompatible: true,
    dashboardCompatible: true,
    ideCompatible: true,
  },
  handoffReferences: {
    reportItemIds: [],
    dashboardBindingIds: [],
    ideArtifactIds: [],
  },
  qaIssueIds: ["qa-metadata-warning"],
  sourceDataVersions: { "layer-parcels": "v1" },
  engine: "MapWorkflowService",
  engineVersion: "test",
};

describe("MapCodeArtifactRequestService", () => {
  it("builds reference-only map manifest requests", () => {
    const request = buildMapManifestRequest({
      contextSummary,
      overlayLayers,
      workflowManifest,
      now: "2026-05-09T08:30:00.000Z",
    });

    expect(request.kind).toBe("map-manifest");
    expect(request.language).toBe("json");
    expect(request.targetFileSuggestion).toBe("map_context_map_context_1_20260509_0830.manifest.json");
    expect(request.layerIds).toEqual(["layer-parcels"]);
    expect(request.provenance.crsByLayer).toEqual([{ layerId: "layer-parcels", crs: "EPSG:3857" }]);
    expect(request.evidenceArtifact.kind).toBe("ide-code-reference");
    expect(request.evidenceArtifact.linkedLayerIds).toEqual(["layer-parcels"]);
    expect(request.evidenceArtifact.linkedFileIds).toEqual([request.targetFileSuggestion]);
    expect(request.content).toContain('"schema": "synapse.map.context.manifest"');
    expect(request.content).not.toContain("FeatureCollection");
    expect(request.content).not.toContain("coordinates");
    expect(request.content).not.toContain('"sourceData":');
    expect(assessMapCodeArtifactRequestSize(request).withinBudget).toBe(true);
  });

  it("builds workflow script and notebook requests from the workflow manifest", () => {
    const input = {
      contextSummary,
      overlayLayers,
      workflowManifest,
      now: "2026-05-09T08:30:00.000Z",
    };
    const script = buildWorkflowScriptRequest(input);
    const notebook = buildWorkflowNotebookRequest(input);

    expect(script.kind).toBe("workflow-script");
    expect(script.language).toBe("python");
    expect(script.targetFileSuggestion).toBe("map_workflow_buffer_20260509_0830.py");
    expect(script.content).toContain("MAP_WORKFLOW_MANIFEST");
    expect(script.content).toContain("workflow-buffer-1");
    expect(script.content).not.toContain("coordinates");
    expect(notebook.kind).toBe("workflow-notebook");
    expect(notebook.targetFileSuggestion).toBe("map_workflow_buffer_20260509_0830.ipynb");
    expect(JSON.parse(notebook.content).nbformat).toBe(4);
  });

  it("dispatches SQL requests through the IDE bridge and publishes lightweight evidence", async () => {
    const received: unknown[] = [];
    const subscription = synapseBus.on("evidence.artifact.register", (payload) => {
      received.push(payload);
    });
    const request = buildSqlQueryRequest({
      contextSummary,
      overlayLayers,
      requestedLayerId: "layer-parcels",
      now: "2026-05-09T08:30:00.000Z",
    });

    const result = await dispatchMapCodeArtifactRequest(request);
    subscription.off();

    expect(result.bridgeRouted).toBe(true);
    expect(result.tabId).toBe("tab-1");
    expect(bridgeCalls).toEqual([{ filename: request.targetFileSuggestion, code: request.content, language: "sql" }]);
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      artifactId: request.evidenceArtifact.artifactId,
      artifactType: "code",
      sourceModule: "map-explorer",
      relatedFilePaths: [request.targetFileSuggestion],
      relatedLayerIds: ["layer-parcels"],
      language: "sql",
      artifactKind: "sql-query",
    });
    expect(JSON.stringify(received[0])).not.toContain(request.content);
  });

  it("supports evidence-only preview dispatch without opening the IDE bridge", async () => {
    const request = buildSqlQueryRequest({
      contextSummary,
      overlayLayers,
      requestedLayerId: "layer-parcels",
      now: "2026-05-09T08:30:00.000Z",
    });

    const result = await dispatchMapCodeArtifactRequest(request, { routeThroughBridge: false });

    expect(result.bridgeRouted).toBe(false);
    expect(result.tabId).toBeNull();
    expect(bridgeCalls).toHaveLength(0);
    expect(result.evidenceEventPublished).toBe(true);
  });
});