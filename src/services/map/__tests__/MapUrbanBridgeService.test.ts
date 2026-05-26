// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type { MapScientificQAState } from "../MapScientificQA";
import { buildMapWorkflowContext } from "../MapWorkflowService";
import {
  buildMapToUrbanContextPayload as buildMapToUrbanContextPayloadViaAdapter,
} from "../MapToUrbanContextAdapter";
import {
  buildUrbanToMapMethodRequestPreview as buildUrbanToMapMethodRequestPreviewViaAdapter,
  publishUrbanToMapMethodRequest as publishUrbanToMapMethodRequestViaAdapter,
} from "../UrbanToMapMethodRequestAdapter";
import {
  buildMapToUrbanContextPayload,
  buildUrbanToMapMethodRequestPayload,
  buildUrbanToMapMethodRequestPreview,
  subscribeUrbanToMapMethodRequests,
  type UrbanToMapMethodRequest,
} from "../bridge/MapUrbanBridgeService";

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
    selectedLayerIds: ["districts"],
    activeAnalysisResultLayerIds: ["analysis-1"],
    selection: { totalSelectedFeatures: 2, layerCounts: [{ layerId: "districts", count: 2 }] },
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

function methodRequest(overrides: Partial<UrbanToMapMethodRequest> = {}): UrbanToMapMethodRequest {
  return {
    requestId: "urban-request-1",
    createdAt: fixedNow,
    sourceModule: "urban-analytics",
    destinationModule: "map-explorer",
    methodId: "equity_accessibility",
    methodLabel: "Equity accessibility",
    requestedActions: ["focus-compatible-layers", "preview-map-workflow"],
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
      workflow: { kind: "aoi", outputLayerName: "Urban requested AOI" },
    },
    ...overrides,
  };
}

function workflowContext(layers: OverlayLayerConfig[], context = contextSummary()) {
  return buildMapWorkflowContext(layers, { viewportBounds: context.currentBounds });
}

function hasSourceDataKey(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasSourceDataKey(entry));
  }
  const record = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, "sourceData")) {
    return true;
  }
  return Object.values(record).some((entry) => hasSourceDataKey(entry));
}

describe("MapUrbanBridgeService", () => {
  it("matches legacy Map->Urban adapter output and never includes sourceData in the payload", () => {
    const input = {
      contextSummary: contextSummary(),
      overlayLayers: [polygonLayer()],
      selectedFeatureIds: { districts: ["district-1", "district-2"] },
      activeWorkflowId: "equity_audit",
      completedRunIds: ["run-1"],
      requestedLayerId: "districts",
      now: fixedNow,
    };

    const fromService = buildMapToUrbanContextPayload(input);
    const fromAdapter = buildMapToUrbanContextPayloadViaAdapter(input);

    expect(fromAdapter).toEqual(fromService);
    expect(JSON.parse(JSON.stringify(fromService))).toMatchObject({
      payloadId: fromService.payloadId,
      requestedLayerId: "districts",
      version: 1,
    });
    expect(hasSourceDataKey(fromService)).toBe(false);
  });

  it("captures per-field missingness counts from the feature scan summary when the full layer is scanned", () => {
    const layer = polygonLayer({
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
          {
            type: "Feature",
            id: "district-2",
            geometry: {
              type: "Polygon",
              coordinates: [[[29.06, 41], [29.11, 41], [29.11, 41.05], [29.06, 41.05], [29.06, 41]]],
            },
            properties: {
              district: "Uskudar",
              population: null,
              observed_at: "2026-01-02",
            },
          },
        ],
      },
      metadata: {
        ...polygonLayer().metadata,
        featureCount: 2,
      },
    });

    const payload = buildMapToUrbanContextPayload({
      contextSummary: contextSummary(),
      overlayLayers: [layer],
      now: fixedNow,
    });
    const populationField = payload.layerSummaries[0]?.fieldSummary.fields.find((field) => field.name === "population");

    expect(populationField).toMatchObject({
      name: "population",
      nonNullValueCount: 1,
      nullValueCount: 1,
      totalValueCount: 2,
    });
  });

  it("matches legacy Urban->Map adapter output and keeps previews geometry-free", () => {
    const layers = [polygonLayer()];
    const input = {
      request: methodRequest(),
      contextSummary: contextSummary(),
      overlayLayers: layers,
      workflowContext: workflowContext(layers),
      now: fixedNow,
    };

    const fromService = buildUrbanToMapMethodRequestPreview(input);
    const fromAdapter = buildUrbanToMapMethodRequestPreviewViaAdapter(input);

    expect(fromAdapter).toEqual(fromService);
    expect(fromService.workflowDraftRequest).toMatchObject({
      requestId: "urban-request-1",
      kind: "aoi",
    });
    expect(hasSourceDataKey(fromService)).toBe(false);
  });

  it("normalizes legacy Urban method requests into the versioned bridge contract", () => {
    const legacyRequest: UrbanToMapMethodRequest = {
      requestId: "urban-legacy-1",
      sourceModule: "urban-analytics",
      methodId: "equity_accessibility",
      requestedActions: ["focus-compatible-layers"],
    };

    const payload = buildUrbanToMapMethodRequestPayload(legacyRequest, fixedNow);

    expect(payload).toMatchObject({
      version: 1,
      requestId: "urban-legacy-1",
      createdAt: fixedNow,
      sourceModule: "urban-analytics",
      destinationModule: "map-explorer",
    });
    expect(hasSourceDataKey(payload)).toBe(false);
  });

  it("delivers Urban method requests to the shared Map bridge transport", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUrbanToMapMethodRequests(listener);
    const request = methodRequest({ requestId: "urban-event-1" });

    const dispatched = publishUrbanToMapMethodRequestViaAdapter(request);

    expect(dispatched).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      version: 1,
      requestId: "urban-event-1",
      destinationModule: "map-explorer",
    }));

    unsubscribe();
  });

  it("delivers a pending method request after Map subscribes during modal open", () => {
    const request = methodRequest({ requestId: "urban-pending-1" });
    const listener = vi.fn();

    expect(publishUrbanToMapMethodRequestViaAdapter(request)).toBe(true);
    const unsubscribe = subscribeUrbanToMapMethodRequests(listener);

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      requestId: "urban-pending-1",
      destinationModule: "map-explorer",
    }));

    unsubscribe();
  });

  it("surfaces QA blockers in Urban->Map previews without leaking raw layer payloads", () => {
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
    const blockedContext = contextSummary({ activeAoi: null });
    const layers = [polygonLayer()];

    const preview = buildUrbanToMapMethodRequestPreview({
      request: methodRequest({
        requestedActions: ["focus-compatible-layers", "publish-derived-layer"],
        requirements: {
          layer: { geometryTypes: ["polygon"], requiredFields: ["income"] },
          aoi: { required: true },
          workflow: { kind: "aoi" },
        },
      }),
      contextSummary: blockedContext,
      overlayLayers: layers,
      workflowContext: workflowContext(layers, blockedContext),
      scientificQA: qa,
      now: fixedNow,
    });

    expect(preview.status).toBe("blocked");
    expect(preview.qaBlockers).toHaveLength(1);
    expect(hasSourceDataKey(preview)).toBe(false);
  });
});
