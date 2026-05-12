// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type { MapScientificQAState } from "../MapScientificQA";
import { buildMapWorkflowContext } from "../MapWorkflowService";
import {
  URBAN_TO_MAP_METHOD_REQUEST_EVENT,
  buildUrbanToMapMethodRequestPreview,
  publishUrbanToMapMethodRequest,
  subscribeUrbanToMapMethodRequests,
  type UrbanToMapMethodRequest,
} from "../UrbanToMapMethodRequestAdapter";

const fixedNow = "2026-05-12T12:00:00.000Z";

function contextSummary(overrides: Partial<MapExplorerContextSummary> = {}): MapExplorerContextSummary {
  return {
    contextId: "map-context-1",
    updatedAt: fixedNow,
    viewport: { center: [29, 41], zoom: 11, bearing: 0, pitch: 0, baseLayerId: "dark" },
    currentBounds: [28.95, 40.95, 29.15, 41.15],
    currentBoundsUpdatedAt: fixedNow,
    activeAoi: { aoiId: "aoi-1", geometryFamily: "polygon", bbox: [28.98, 40.98, 29.08, 41.08] },
    visibleLayerIds: ["districts"],
    selectedLayerIds: [],
    activeAnalysisResultLayerIds: [],
    selection: { totalSelectedFeatures: 0, layerCounts: [] },
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

function polygonLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "districts",
    name: "District indicators",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceKind: "imported",
    queryable: true,
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
            population: 1200,
            observed_at: "2026-01-01",
          },
        },
      ],
    },
    metadata: {
      featureCount: 1,
      fields: ["district", "population", "observed_at"],
      crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
      geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 1, source: "explicit", notes: [] },
      schemaSummary: {
        fieldCount: 3,
        source: "explicit",
        notes: [],
        fields: [
          { name: "district", role: "attribute", type: "string" },
          { name: "population", role: "attribute", type: "number" },
          { name: "observed_at", role: "temporal", type: "date" },
        ],
      },
    },
    ...overrides,
  };
}

function methodRequest(overrides: Partial<UrbanToMapMethodRequest> = {}): UrbanToMapMethodRequest {
  return {
    requestId: "urban-request-1",
    createdAt: fixedNow,
    sourceModule: "urban-analytics",
    destinationModule: "map-explorer",
    methodId: "equity_accessibility",
    methodLabel: "Equity accessibility",
    requestedActions: ["focus-compatible-layers"],
    requirements: {
      layer: {
        geometryTypes: ["polygon"],
        requiredFields: ["population"],
        optionalFields: ["district"],
        temporal: "required",
        requireQueryable: true,
        requiredCrs: "EPSG:3857",
      },
      aoi: { required: true, geometryTypes: ["polygon"] },
    },
    ...overrides,
  };
}

function buildPreview(request: UrbanToMapMethodRequest, layers: OverlayLayerConfig[] = [polygonLayer()], context = contextSummary(), scientificQA?: MapScientificQAState) {
  return buildUrbanToMapMethodRequestPreview({
    request,
    contextSummary: context,
    overlayLayers: layers,
    workflowContext: buildMapWorkflowContext(layers, { viewportBounds: context.currentBounds }),
    scientificQA,
    now: fixedNow,
  });
}

describe("UrbanToMapMethodRequestAdapter", () => {
  it("finds compatible layers from Urban method requirements without serializing raw GeoJSON", () => {
    const preview = buildPreview(methodRequest({
      requestedActions: ["focus-compatible-layers", "prepare-report-ready-snapshot"],
      outputIntent: "report",
    }));

    expect(preview.status).toBe("ready");
    expect(preview.compatibleLayers[0]).toMatchObject({
      layerId: "districts",
      status: "ready",
      matchedRequiredFields: ["population"],
      temporalFields: ["observed_at"],
      crs: "EPSG:3857",
    });
    expect(preview.aoiPreview.status).toBe("ready");
    expect(preview.reportSnapshotPreview).toMatchObject({ status: "ready", visibleLayerCount: 1 });

    const serialized = JSON.stringify(preview);
    expect(serialized).not.toContain("FeatureCollection");
    expect(serialized).not.toContain("coordinates");
    expect(serialized).not.toContain("sourceData");
  });

  it("surfaces missing fields, missing AOI, and QA blockers before any map action is applied", () => {
    const qa: MapScientificQAState = {
      status: "error",
      checkedAt: fixedNow,
      issues: [
        {
          id: "qa-1",
          code: "missing-crs",
          category: "crs",
          severity: "blocker",
          title: "Layer CRS is missing",
          explanation: "Projected CRS metadata is required.",
          suggestedFix: "Assign CRS metadata before analysis.",
          layerId: "districts",
        },
      ],
      layerSummaries: [],
      metadata: {
        generatedBy: "MapScientificQA",
        version: 2,
        signature: "qa-signature",
        visibleLayerCount: 1,
        workerLayerCount: 0,
        issueCounts: { info: 0, warning: 0, error: 0, blocker: 1 },
      },
    };
    const preview = buildPreview(
      methodRequest({
        requestedActions: ["focus-compatible-layers", "validate-aoi", "publish-derived-layer"],
        requirements: {
          layer: { geometryTypes: ["polygon"], requiredFields: ["income"] },
          aoi: { required: true },
          workflow: { kind: "aoi" },
        },
      }),
      [polygonLayer()],
      contextSummary({ activeAoi: null }),
      qa,
    );

    expect(preview.status).toBe("blocked");
    expect(preview.compatibleLayers[0]?.missingRequiredFields).toEqual(["income"]);
    expect(preview.aoiPreview.missingPrerequisites[0]).toContain("No active AOI");
    expect(preview.qaBlockers).toHaveLength(1);
    expect(preview.requestedActions.find((action) => action.type === "publish-derived-layer")?.missingPrerequisites)
      .toEqual(expect.arrayContaining(["Scientific QA blockers must be resolved before publishing a derived map layer."]));
  });

  it("builds a workflow draft preview for Urban workflow requests without applying a derived layer", () => {
    const preview = buildPreview(methodRequest({
      requestId: "urban-workflow-1",
      methodId: "aoi_workflow",
      requestedActions: [{ type: "preview-map-workflow", workflowKind: "aoi" }],
      requirements: {
        aoi: { required: false },
        workflow: { kind: "aoi", outputLayerName: "Urban requested AOI" },
      },
    }));

    expect(preview.workflowPreview).toMatchObject({ workflow: "aoi", canApply: true, blockerCount: 0 });
    expect(preview.workflowDraftRequest).toMatchObject({ requestId: "urban-workflow-1", kind: "aoi" });
    expect(preview.workflowDraftRequest?.draft).toMatchObject({ kind: "aoi", name: "Urban requested AOI" });
    expect(preview).not.toHaveProperty("layer");
  });

  it("publishes and subscribes to the documented incoming Urban request event", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUrbanToMapMethodRequests(listener);
    const request = methodRequest({ requestId: "urban-event-1" });

    const dispatched = publishUrbanToMapMethodRequest(request);

    expect(dispatched).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ requestId: "urban-event-1" }));

    unsubscribe();
    globalThis.dispatchEvent(new CustomEvent(URBAN_TO_MAP_METHOD_REQUEST_EVENT, { detail: { request } }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});