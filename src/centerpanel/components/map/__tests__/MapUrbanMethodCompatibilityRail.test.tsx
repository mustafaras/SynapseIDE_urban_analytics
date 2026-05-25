// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import type { OverlayLayerConfig } from "../mapTypes";
import type { MapExplorerContextSummary } from "../mapContextSummary";
import { MapUrbanMethodCompatibilityRail } from "../MapUrbanMethodCompatibilityRail";
import { buildMapWorkflowContext } from "@/services/map/MapWorkflowService";
import {
  buildUrbanToMapMethodRequestPreview,
  type UrbanToMapMethodRequestPayload,
} from "@/services/map/bridge/MapUrbanBridgeService";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fixedNow = "2026-05-25T12:00:00.000Z";

function contextSummary(activeAoi: MapExplorerContextSummary["activeAoi"] = {
  aoiId: "aoi-1",
  geometryFamily: "polygon",
  bbox: [28.98, 40.98, 29.08, 41.08],
}): MapExplorerContextSummary {
  return {
    contextId: "map-context-method-rail",
    updatedAt: fixedNow,
    viewport: { center: [29, 41], zoom: 11, bearing: 0, pitch: 0, baseLayerId: "dark" },
    currentBounds: [28.95, 40.95, 29.15, 41.15],
    currentBoundsUpdatedAt: fixedNow,
    activeAoi,
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
  };
}

function layer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "districts",
    name: "District indicators",
    type: "geojson",
    visible: true,
    opacity: 1,
    queryable: true,
    sourceData: {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[29, 41], [29.05, 41], [29.05, 41.05], [29, 41.05], [29, 41]]],
        },
        properties: { population: 1200 },
      }],
    },
    metadata: {
      fields: ["population"],
      crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
      geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 1, source: "explicit", notes: [] },
    },
    ...overrides,
  };
}

function request(): UrbanToMapMethodRequestPayload {
  return {
    version: 1,
    requestId: "method-rail-1",
    createdAt: fixedNow,
    sourceModule: "urban-analytics",
    destinationModule: "map-explorer",
    methodId: "moran",
    methodLabel: "Global Moran's I",
    methodValidity: { status: "complete", capabilityStatus: "implemented", blockers: [], warnings: [] },
    requirements: {
      layer: {
        geometryTypes: ["polygon"],
        requiredFields: ["population"],
        requireQueryable: true,
        requiredCrs: "EPSG:3857",
      },
      aoi: { required: true, geometryTypes: ["polygon"] },
      workflow: { kind: "aoi" },
    },
    requestedActions: ["focus-compatible-layers", { type: "preview-map-workflow", workflowKind: "aoi" }],
  };
}

function mountRail(
  methodRequest: UrbanToMapMethodRequestPayload,
  layers: OverlayLayerConfig[],
  context = contextSummary(),
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onFocusLayer = vi.fn();
  const preview = buildUrbanToMapMethodRequestPreview({
    request: methodRequest,
    contextSummary: context,
    overlayLayers: layers,
    workflowContext: buildMapWorkflowContext(layers, { viewportBounds: context.currentBounds }),
    now: fixedNow,
  });

  act(() => {
    root.render(
      <MapUrbanMethodCompatibilityRail
        visible
        request={methodRequest}
        preview={preview}
        onClose={vi.fn()}
        onFocusLayer={onFocusLayer}
        onPreviewWorkflow={vi.fn()}
      />,
    );
  });
  return { container, root, preview, onFocusLayer };
}

describe("MapUrbanMethodCompatibilityRail", () => {
  it("renders ready and warning compatibility states", () => {
    const ready = mountRail(request(), [layer()]);
    expect(ready.preview.status).toBe("ready");
    expect(ready.container.querySelector("[data-testid='map-urban-method-status']")?.textContent).toContain("Ready");
    act(() => ready.root.unmount());
    ready.container.remove();

    const hidden = layer({ visible: false });
    const warningRequest = request();
    warningRequest.requirements = {
      ...warningRequest.requirements,
      layer: { ...warningRequest.requirements?.layer, requireVisible: true },
    };
    const warning = mountRail(warningRequest, [hidden]);
    expect(warning.preview.status).toBe("needs-review");
    expect(warning.container.textContent).toContain("Layer is currently hidden");
    act(() => warning.root.unmount());
    warning.container.remove();
  });

  it("renders polygon, field, CRS, and AOI blockers and disables workflow preview", () => {
    const pointLayer = layer({
      id: "points",
      name: "Observed points",
      metadata: {
        fields: ["name"],
        geometrySummary: { geometryType: "Point", geometryTypes: ["Point"], featureCount: 1, source: "explicit", notes: [] },
      },
    });
    const mounted = mountRail(request(), [pointLayer], contextSummary(null));

    expect(mounted.preview.status).toBe("blocked");
    expect(mounted.container.textContent).toContain("Requires polygon geometry");
    expect(mounted.container.textContent).toContain("Method requires polygon geometry; layer provides point.");
    expect(mounted.container.textContent).toContain("Missing fields: population");
    expect(mounted.container.textContent).toContain("CRS status: Blocked");
    expect(mounted.container.textContent).toContain("Missing required AOI");
    expect(mounted.container.querySelector<HTMLButtonElement>("[data-testid='map-urban-method-preview-workflow']")?.disabled).toBe(true);

    act(() => {
      mounted.container.querySelector<HTMLButtonElement>("[data-testid='map-urban-method-focus-points']")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(mounted.onFocusLayer).toHaveBeenCalledWith("points");

    act(() => mounted.root.unmount());
    mounted.container.remove();
  });
});
