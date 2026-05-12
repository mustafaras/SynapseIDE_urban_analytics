// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import type { MapEvidenceArtifact, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import {
  MAP_TO_URBAN_CONTEXT_EVENT,
  buildMapToUrbanContextPayload,
  sendMapContextToUrban,
  type MapToUrbanContextPayload,
} from "../MapToUrbanContextAdapter";

const fixedNow = "2026-05-12T10:00:00.000Z";

function contextSummary(overrides: Partial<MapExplorerContextSummary> = {}): MapExplorerContextSummary {
  return {
    contextId: "map-context-1",
    updatedAt: fixedNow,
    viewport: { center: [29, 41], zoom: 11, bearing: 0, pitch: 0, baseLayerId: "dark" },
    currentBounds: [28.95, 40.95, 29.15, 41.15],
    currentBoundsUpdatedAt: fixedNow,
    activeAoi: { aoiId: "aoi-1", geometryFamily: "polygon", bbox: [28.98, 40.98, 29.08, 41.08] },
    visibleLayerIds: ["layer-1"],
    selectedLayerIds: ["layer-1"],
    activeAnalysisResultLayerIds: ["analysis-1"],
    selection: { totalSelectedFeatures: 2, layerCounts: [{ layerId: "layer-1", count: 2 }] },
    qa: {
      status: "passed",
      checkedAt: fixedNow,
      layerCount: 1,
      blockedLayerCount: 0,
      issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
    },
    ...overrides,
  };
}

function layer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "layer-1",
    name: "District indicators",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "district-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[29, 41], [29.05, 41], [29.05, 41.05], [29, 41.05], [29, 41]]],
          },
          properties: {
            district: "Kadikoy",
            capture_date: "2026-01-01",
            population: 1200,
          },
        },
      ],
    },
    metadata: {
      featureCount: 1,
      fields: ["district", "population"],
      crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
      geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 1, source: "explicit", notes: [] },
      schemaSummary: {
        fieldCount: 3,
        fields: [
          { name: "district", role: "attribute" },
          { name: "capture_date", role: "temporal" },
          { name: "population", role: "attribute", type: "number" },
        ],
        source: "explicit",
        notes: [],
      },
      evidenceArtifactId: "map-evidence-layer-1",
      analysisResult: {
        engine: "LISA",
        runId: "run-1",
        sourceRunId: "source-run-1",
        algorithmWorkflowId: "equity_audit",
        runTimestamp: fixedNow,
        parameterSummary: "Local spatial autocorrelation",
        inputParameters: {},
        statisticalSummary: {},
        evidenceArtifactId: "map-evidence-run-1",
        visualization: { type: "choropleth" },
      },
    },
    ...overrides,
  };
}

function evidenceArtifact(): MapEvidenceArtifact {
  return {
    id: "map-evidence-layer-1",
    artifactId: "map-evidence-layer-1",
    kind: "layer",
    title: "District layer evidence",
    state: "active",
    sourceModule: "map-explorer",
    sourceId: "layer-1",
    linkedLayerIds: ["layer-1"],
    sourceLayerIds: [],
    linkedFileIds: [],
    linkedArtifactIds: [],
    qaIssueIds: [],
    tags: [],
    provenance: {
      sourceModule: "map-explorer",
      createdAt: fixedNow,
      sourceLayerIds: ["layer-1"],
      layerProvenance: [],
      inputArtifactIds: [],
      parentArtifactIds: [],
      notes: [],
    },
    qa: {
      state: "passed",
      issueIds: [],
      issueCount: 0,
      blockerCount: 0,
      caveats: [],
    },
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };
}

describe("MapToUrbanContextAdapter", () => {
  it("builds a lightweight payload with layer, selection, field, CRS, QA, workflow, and evidence summaries", () => {
    const payload = buildMapToUrbanContextPayload({
      contextSummary: contextSummary(),
      overlayLayers: [layer()],
      selectedFeatureIds: { "layer-1": ["district-1", "district-2"] },
      mapEvidenceArtifacts: [evidenceArtifact()],
      activeWorkflowId: "equity_audit",
      completedRunIds: ["run-1"],
      requestedLayerId: "layer-1",
      now: fixedNow,
    });

    expect(payload.version).toBe(1);
    expect(payload.sourceModule).toBe("map-explorer");
    expect(payload.destinationModule).toBe("urban-analytics");
    expect(payload.aoiReference).toMatchObject({ aoiId: "aoi-1", geometryFamily: "polygon" });
    expect(payload.layerSummaries[0]).toMatchObject({
      layerId: "layer-1",
      selectedFeatureCount: 2,
      activeAnalysisResult: false,
    });
    expect(payload.fieldSummaries[0]?.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(["district", "capture_date", "population"]),
    );
    expect(payload.fieldSummaries[0]?.temporalFields).toContain("capture_date");
    expect(payload.crsSummary.distinct).toEqual(["EPSG:3857"]);
    expect(payload.qaSummary.status).toBe("passed");
    expect(payload.workflowSummary.activeRunIds).toEqual(expect.arrayContaining(["run-1", "source-run-1"]));
    expect(payload.evidenceSummaries[0]).toMatchObject({ artifactId: "map-evidence-layer-1", kind: "layer" });
    expect(payload.disabledReasons).toEqual([]);

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("FeatureCollection");
    expect(serialized).not.toContain("coordinates");
  });

  it("blocks handoff with clear disabled reasons when no usable context exists", () => {
    const emptyContext = contextSummary({
      activeAoi: null,
      currentBounds: null,
      currentBoundsUpdatedAt: null,
      visibleLayerIds: [],
      selectedLayerIds: [],
      activeAnalysisResultLayerIds: [],
      selection: { totalSelectedFeatures: 0, layerCounts: [] },
      qa: {
        status: "unchecked",
        checkedAt: null,
        layerCount: 0,
        blockedLayerCount: 0,
        issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
      },
    });

    const result = sendMapContextToUrban({
      contextSummary: emptyContext,
      overlayLayers: [],
      now: fixedNow,
    });

    expect(result.status).toBe("blocked");
    expect(result.eventDispatched).toBe(false);
    expect(result.disabledReasons[0]).toContain("Add or reveal a spatial layer");
  });

  it("sends the payload through the documented event and receiver hook", () => {
    const listener = vi.fn();
    globalThis.addEventListener(MAP_TO_URBAN_CONTEXT_EVENT, listener as EventListener);
    const receiver = vi.fn(() => ({
      contextId: "urban-context-1",
      evidenceArtifactId: "urban-evidence-1",
      recommendationTriggered: true,
      recommendationReason: "Map context includes active layers.",
    }));

    const result = sendMapContextToUrban({
      contextSummary: contextSummary(),
      overlayLayers: [layer()],
      selectedFeatureIds: { "layer-1": ["district-1"] },
      requestedLayerId: "layer-1",
      receiver,
      now: fixedNow,
    });

    expect(result.status).toBe("sent");
    expect(result.eventDispatched).toBe(true);
    expect(result.urbanContextId).toBe("urban-context-1");
    expect(result.recommendationTriggered).toBe(true);
    expect(receiver).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);

    const event = listener.mock.calls[0]?.[0] as CustomEvent<MapToUrbanContextPayload>;
    expect(event.detail.payloadId).toBe(result.payload.payloadId);
    expect(event.detail.requestedLayerId).toBe("layer-1");
    expect(event.detail.layerSummaries).toHaveLength(1);

    globalThis.removeEventListener(MAP_TO_URBAN_CONTEXT_EVENT, listener as EventListener);
  });
});