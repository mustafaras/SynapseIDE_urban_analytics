// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TemporalScenePanel } from "../temporal";
import { useTemporalLayerStore } from "@/stores/useTemporalLayerStore";
import type { OverlayLayerConfig } from "../mapTypes";

function makeTemporalLayer(id: string, name: string): OverlayLayerConfig {
  return {
    id,
    name,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "derived",
    metadata: {
      analysisResult: {
        domain: "spatial-statistics",
        engine: "emerging-hot-spot",
        runTimestamp: "2026-06-04T10:00:00.000Z",
        parameters: {},
        statisticalSummary: {},
        visualization: {
          kind: "temporal",
          title: "Playback timeline",
          temporalFrames: [
            {
              key: "2020",
              label: "Year 2020",
              data: { type: "FeatureCollection", features: [] },
            },
            {
              key: "2021",
              label: "Year 2021",
              data: { type: "FeatureCollection", features: [] },
            },
          ],
        },
      },
      crsSummary: {
        status: "missing",
        source: "analysis-output",
        notes: ["CRS not provided by result metadata."],
      },
    },
  } as OverlayLayerConfig;
}

describe("TemporalScenePanel", () => {
  beforeEach(() => {
    useTemporalLayerStore.getState().reset();
    useTemporalLayerStore.getState().setFrames([
      { index: 0, key: "2020", label: "Year 2020" },
      { index: 1, key: "2021", label: "Year 2021" },
    ]);
    useTemporalLayerStore.getState().setLayerReferences({
      activeLayerId: "temporal-primary",
      sourceId: "temporal-source",
      layerId: "temporal-primary",
      layerName: "Primary timeline",
      sourceFields: ["value"],
      timeField: null,
      runtimeMode: "unknown",
    });
  });

  afterEach(() => {
    cleanup();
    useTemporalLayerStore.getState().reset();
  });

  it("keeps temporal controls reachable from Scene and exposes metadata caveats", () => {
    const primaryLayer = makeTemporalLayer("temporal-primary", "Primary timeline");
    const secondaryLayer = makeTemporalLayer("temporal-secondary", "Secondary timeline");
    const onLayerChange = vi.fn();
    const onExportFrame = vi.fn();

    render(
      <TemporalScenePanel
        activeLayer={primaryLayer}
        temporalLayers={[primaryLayer, secondaryLayer]}
        onLayerChange={onLayerChange}
        onExportFrame={onExportFrame}
      />,
    );

    expect(screen.getByTestId("map-scene-temporal-panel")).toBeTruthy();
    expect(screen.getByTestId("temporal-player-panel")).toBeTruthy();
    expect(screen.getByText("Time field not recorded; playback order follows the published frame sequence.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Temporal layer"), { target: { value: "temporal-secondary" } });
    expect(onLayerChange).toHaveBeenCalledWith("temporal-secondary");

    fireEvent.click(screen.getByRole("button", { name: "Export frame" }));
    expect(onExportFrame).toHaveBeenCalledWith(expect.objectContaining({
      frameIndex: 0,
      frameKey: "2020",
      frameLabel: "Year 2020",
    }));
  });
});