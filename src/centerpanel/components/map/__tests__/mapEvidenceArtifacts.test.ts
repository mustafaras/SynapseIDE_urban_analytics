import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DrawnFeature, MapEvidenceArtifact, OverlayLayerConfig } from "../mapTypes";
import {
  createMapAoiEvidenceArtifact,
  createMapLayerEvidenceArtifact,
  createMapWorkflowResultEvidenceArtifact,
  MAX_MAP_EVIDENCE_ARTIFACTS,
  upsertMapEvidenceArtifact,
} from "../mapEvidenceArtifacts";
import { evaluateMapScientificQASync } from "../../../../services/map/MapScientificQA";
import {
  selectMapEvidenceArtifactsForAoi,
  selectMapEvidenceArtifactsForLayer,
  selectMapEvidenceArtifactsForSource,
  selectMapEvidenceArtifactsForWorkflow,
  useMapExplorerStore,
} from "../../../../stores/useMapExplorerStore";

const store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const key of Object.keys(store)) delete store[key]; },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

function makeAnalysisLayer(): OverlayLayerConfig {
  return {
    id: "analysis-layer",
    name: "OLS residuals",
    type: "geojson",
    visible: true,
    opacity: 0.82,
    sourceKind: "derived",
    group: "analysis",
    queryable: true,
    sourceData: {
      type: "FeatureCollection",
      features: [],
    },
    metadata: {
      featureCount: 12,
      geometryType: "Polygon",
      bounds: [28.9, 40.9, 29.2, 41.2],
      datasetContext: {
        crs: "EPSG:3857",
      },
      analysisResult: {
        engine: "OLS",
        runId: "run-1",
        runTimestamp: "2026-05-10T08:00:00.000Z",
        parameterSummary: "dependent=risk",
        inputParameters: { dependent: "risk" },
        statisticalSummary: { rSquared: 0.72 },
        sourceLayerIds: ["source-layer"],
        sourceDataVersion: "v1",
        visualization: {
          kind: "choropleth",
          title: "OLS residuals",
          valueField: "residual",
          classificationMethod: "quantile",
          classCount: 5,
          colorRamp: "RdBu",
        },
      },
      scientificQA: {
        status: "warning",
        issueIds: ["qa-1"],
        badges: ["missing_crs"],
        checkedAt: "2026-05-10T08:05:00.000Z",
        featureIssueCount: 1,
        usedWorker: false,
        caveats: ["Source CRS should be confirmed before distance calculations."],
        categorySummaries: [{
          category: "crs",
          severity: "warning",
          issueIds: ["qa-1"],
          affectedLayerIds: ["analysis-layer"],
          reasons: ["Source CRS should be confirmed before distance calculations."],
          recommendedFixes: ["Attach verified CRS metadata."],
        }],
        signature: "qa-signature",
      },
    },
    provenance: {
      label: "Spatial regression output",
      sourceName: "OLS workflow",
      method: "OLS",
      generatedAt: "2026-05-10T08:00:00.000Z",
      sourceLayerIds: ["source-layer"],
    },
  };
}

function makeAoi(): DrawnFeature {
  return {
    id: "aoi-1",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [28.9, 40.9],
        [29.2, 40.9],
        [29.2, 41.2],
        [28.9, 41.2],
        [28.9, 40.9],
      ]],
    },
    properties: {
      label: "Study area",
      createdAt: "2026-05-10T08:15:00.000Z",
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("map evidence artifact helpers", () => {
  it("builds a layer evidence artifact without copying source data", () => {
    const artifact = createMapLayerEvidenceArtifact(makeAnalysisLayer(), {
      linkedWorkflowId: "ols-workflow",
    });

    expect(artifact.id).toBe("map-evidence-layer-analysis-layer");
    expect(artifact.kind).toBe("layer");
    expect(artifact.linkedLayerIds).toEqual(["analysis-layer", "source-layer"]);
    expect(artifact.sourceLayerIds).toEqual(["source-layer"]);
    expect(artifact.derivedLayerId).toBe("analysis-layer");
    expect(artifact.linkedRunId).toBe("run-1");
    expect(artifact.linkedWorkflowId).toBe("ols-workflow");
    expect(artifact.provenance.crsSummary?.declaredCrs).toBe("EPSG:3857");
    expect(artifact.provenance.geometrySummary?.featureCount).toBe(12);
    expect(artifact.qa.state).toBe("warning");
    expect(artifact.qa.issueIds).toEqual(["qa-1"]);
    expect(artifact.qa.categorySummaries?.[0]?.category).toBe("crs");
    expect(Object.prototype.hasOwnProperty.call(artifact, "sourceData")).toBe(false);
  });

  it("propagates scientific QA runs into QA-finding evidence artifacts", () => {
    const layer = makeAnalysisLayer();
    const qa = evaluateMapScientificQASync([layer]);

    useMapExplorerStore.getState().setScientificQA(qa);

    const artifact = useMapExplorerStore.getState().mapEvidenceArtifacts.find((entry) => entry.kind === "qa-finding");
    expect(artifact).toBeDefined();
    expect(artifact?.qa.issueCount).toBe(qa.issues.length);
    expect(artifact?.qa.categorySummaries?.some((summary) => summary.category === "export-readiness")).toBe(true);
    expect(artifact?.metadata?.visibleLayerCount).toBe(1);
  });

  it("summarizes AOI evidence by id, bbox, and geometry counts only", () => {
    const artifact = createMapAoiEvidenceArtifact(makeAoi());

    expect(artifact.kind).toBe("aoi");
    expect(artifact.linkedAoiId).toBe("aoi-1");
    expect(artifact.provenance.crsSummary?.displayCrs).toBe("EPSG:4326");
    expect(artifact.provenance.geometrySummary?.geometryTypes).toEqual(["Polygon"]);
    expect(artifact.provenance.geometrySummary?.featureCount).toBe(1);
    expect(artifact.provenance.geometrySummary?.vertexCount).toBe(5);
    expect(artifact.provenance.geometrySummary?.bounds).toEqual([28.9, 40.9, 29.2, 41.2]);
    expect(Object.prototype.hasOwnProperty.call(artifact, "geometry")).toBe(false);
  });

  it("stores registry entries by reference and selects by layer, AOI, workflow, and source", () => {
    const artifact = createMapWorkflowResultEvidenceArtifact({
      title: "Buffered schools",
      workflowId: "buffer-workflow",
      runId: "run-buffer-1",
      sourceLayerIds: ["schools"],
      derivedLayerId: "schools-buffered",
      linkedAoiId: "aoi-1",
      createdAt: "2026-05-10T08:30:00.000Z",
      geometrySummary: {
        geometryTypes: ["Polygon"],
        featureCount: 3,
        source: "workflow-summary",
      },
    });

    useMapExplorerStore.getState().upsertMapEvidenceArtifact(artifact);
    useMapExplorerStore.getState().registerMapEvidenceArtifact({
      id: artifact.id,
      kind: "workflow-result",
      title: "Buffered schools refreshed",
      sourceLayerIds: ["schools"],
      derivedLayerId: "schools-buffered",
      linkedAoiId: "aoi-1",
      linkedWorkflowId: "buffer-workflow",
      linkedRunId: "run-buffer-1",
      createdAt: "2026-05-10T08:31:00.000Z",
    });

    const state = useMapExplorerStore.getState();
    expect(state.mapEvidenceArtifacts).toHaveLength(1);
    expect(state.mapEvidenceArtifacts[0]?.title).toBe("Buffered schools refreshed");
    expect(selectMapEvidenceArtifactsForLayer("schools")(state)).toHaveLength(1);
    expect(selectMapEvidenceArtifactsForLayer("schools-buffered")(state)).toHaveLength(1);
    expect(selectMapEvidenceArtifactsForAoi("aoi-1")(state)).toHaveLength(1);
    expect(selectMapEvidenceArtifactsForWorkflow("buffer-workflow")(state)).toHaveLength(1);
    expect(selectMapEvidenceArtifactsForSource("map-explorer")(state)).toHaveLength(1);
  });

  it("caps the evidence registry at MAX_MAP_EVIDENCE_ARTIFACTS and keeps the most recent entry first", () => {
    const overflow = 15;
    let registry: MapEvidenceArtifact[] = [];

    for (let index = 0; index < MAX_MAP_EVIDENCE_ARTIFACTS + overflow; index += 1) {
      const artifact = createMapWorkflowResultEvidenceArtifact({
        title: `Buffered batch ${index}`,
        workflowId: `buffer-workflow-${index}`,
        runId: `run-${index}`,
        sourceLayerIds: [`source-${index}`],
        derivedLayerId: `derived-${index}`,
        createdAt: new Date(Date.UTC(2026, 4, 10, 8, index)).toISOString(),
      });
      registry = upsertMapEvidenceArtifact(registry, artifact);
    }

    expect(registry).toHaveLength(MAX_MAP_EVIDENCE_ARTIFACTS);
    expect(registry[0]?.title).toBe(`Buffered batch ${MAX_MAP_EVIDENCE_ARTIFACTS + overflow - 1}`);
    expect(registry.some((entry) => entry.title === "Buffered batch 0")).toBe(false);
  });
});
