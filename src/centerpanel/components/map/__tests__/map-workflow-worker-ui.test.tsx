// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { MapWorkflowDrawer } from "../MapWorkflowDrawer";
import {
  buildMapWorkflowContext,
  createDefaultDraft,
  type MapWorkflowAOIDraft,
  type MapWorkflowBufferDraft,
} from "../../../../services/map/MapWorkflowService";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const context = buildMapWorkflowContext([]);

function polygonFeature(id: string, ring: Array<[number, number]>, properties: Record<string, unknown> = {}): Feature<Polygon> {
  return {
    type: "Feature",
    id,
    properties,
    geometry: {
      type: "Polygon",
      coordinates: [[...ring, ring[0]!]],
    },
  };
}

function featureCollection(features: Feature[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features,
  };
}

function layer(
  id: string,
  collection: FeatureCollection,
  geometryType = "Polygon",
  crs = "EPSG:32635",
): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: collection,
    sourceKind: "project",
    queryable: true,
    metadata: {
      geometryType,
      featureCount: collection.features.length,
      fields: ["name"],
      datasetContext: {
        crs,
      },
      crsSummary: {
        crs,
        status: "known",
        source: "explicit",
        notes: ["Unit test fixture CRS."],
      },
    },
  };
}

describe("MapWorkflowDrawer worker execution UI", () => {
  it("keeps the embedded surface shrinkable for short-height layouts", () => {
    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={context}
          onClose={() => {}}
          onApply={() => {}}
          presentation="embedded"
        />,
      );
    });

    const panel = host?.firstElementChild as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(panel?.style.minHeight).toBe("0px");
    expect(panel?.style.maxHeight).toBe("calc(100% - 2rem)");
  });

  it("renders a progress bar + cancel control while a workflow runs in a worker", () => {
    const onCancelWorkflow = vi.fn();
    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={context}
          onClose={() => {}}
          onApply={() => {}}
          onCancelWorkflow={onCancelWorkflow}
          workflowExecution={{ status: "running", percent: 42, stage: "Buffering features", detail: "5,000 / 12,000" }}
        />,
      );
    });

    const progress = host?.querySelector('[data-testid="map-workflow-progress"]');
    expect(progress).not.toBeNull();
    expect(progress?.getAttribute("aria-valuenow")).toBe("42");

    const cancel = host?.querySelector('[data-testid="map-workflow-cancel"]') as HTMLButtonElement | null;
    expect(cancel).not.toBeNull();
    act(() => cancel?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onCancelWorkflow).toHaveBeenCalledTimes(1);
  });

  it("surfaces an explicit failure state", () => {
    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={context}
          onClose={() => {}}
          onApply={() => {}}
          workflowExecution={{ status: "failed", percent: 0, error: "geos overlay failed" }}
        />,
      );
    });

    const error = host?.querySelector('[data-testid="map-workflow-error"]');
    expect(error).not.toBeNull();
    expect(error?.textContent).toContain("geos overlay failed");
    // No progress bar once failed.
    expect(host?.querySelector('[data-testid="map-workflow-progress"]')).toBeNull();
  });

  it("renders an explicit launch brief for AOI sources, execution readiness, and output consequences", () => {
    const geocodedContext = buildMapWorkflowContext([], {
      geocodedPlace: {
        label: "Kadikoy",
        bbox: [28.97, 40.96, 29.09, 41.02],
        source: "Nominatim",
      },
    });
    const draft: MapWorkflowAOIDraft = {
      ...(createDefaultDraft("aoi") as MapWorkflowAOIDraft),
      source: "geocoded-place",
      name: "Kadikoy focus",
    };

    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={geocodedContext}
          onClose={() => {}}
          onApply={() => {}}
          onSaveReport={() => {}}
          initialDraftRequest={{
            requestId: "aoi-launch-brief",
            kind: "aoi",
            draft,
          }}
        />,
      );
    });

    const sourceSummary = host?.querySelector('[data-testid="map-workflow-launch-source-summary"]');
    expect(sourceSummary).not.toBeNull();
    expect(sourceSummary?.textContent).toContain("Geocoded · Kadikoy");
    expect(sourceSummary?.textContent).toContain("Place source: Nominatim");

    const executionSummary = host?.querySelector('[data-testid="map-workflow-execution-readiness"]');
    expect(executionSummary).not.toBeNull();
    expect(executionSummary?.textContent).toContain("Display CRS");

    const outputSummary = host?.querySelector('[data-testid="map-workflow-output-consequence"]');
    expect(outputSummary).not.toBeNull();
    expect(outputSummary?.textContent).toContain("Preview does not change the map until you apply the workflow.");
    expect(outputSummary?.textContent).toContain("Save as report item remains available");
  });

  it("shows the specific CRS blocker in the apply status before compute", () => {
    const missingCrsLayer = layer(
      "missing-crs-polygons",
      featureCollection([
        polygonFeature("missing", [[0, 0], [1, 0], [1, 1], [0, 1]], { name: "Missing CRS" }),
      ]),
      "Polygon",
      "",
    );
    const blockedContext = buildMapWorkflowContext([missingCrsLayer]);
    const draft: MapWorkflowBufferDraft = {
      ...(createDefaultDraft("buffer") as MapWorkflowBufferDraft),
      sourceLayerId: "missing-crs-polygons",
      distance: 100,
      unit: "meters",
    };

    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={blockedContext}
          onClose={() => {}}
          onApply={() => {}}
          initialDraftRequest={{
            requestId: "blocked-buffer",
            kind: "buffer",
            draft,
          }}
        />,
      );
    });

    const applyStatus = host?.querySelector('[data-testid="map-workflow-apply-status"]');
    expect(applyStatus).not.toBeNull();
    expect(applyStatus?.textContent).toContain("Declare the CRS before running");
  });
});
