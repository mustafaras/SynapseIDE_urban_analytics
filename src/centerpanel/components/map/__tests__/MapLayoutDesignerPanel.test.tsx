// @vitest-environment jsdom

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MapLayoutDesignerPanel } from "../layout/MapLayoutDesignerPanel";
import { serializeLayoutRestoreMetadata } from "@/services/map/layout/MapLayoutComposer";
import type { OverlayLayerConfig } from "../mapTypes";

function makeLayer(): OverlayLayerConfig {
  return {
    id: "temporal-layer",
    name: "Temporal layer",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "project",
    style: {
      legendEntries: [{ label: "Temporal layer", color: "#22c55e" }],
    },
    metadata: {
      crsSummary: {
        crs: "EPSG:4326",
        status: "known",
        source: "explicit",
        notes: [],
      },
      licenseAttribution: {
        source: "City open data",
        attributionText: "City open data",
        license: "ODbL",
      },
    },
  } as OverlayLayerConfig;
}

describe("MapLayoutDesignerPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("restores page state from a temporal frame export request", async () => {
    const layer = makeLayer();
    const handled = vi.fn();
    const restoreMetadata = serializeLayoutRestoreMetadata(1, [
      {
        pageNumber: 4,
        overlayLayers: [layer],
        title: "Year 2024",
        dynamicText: "Frame 4 of 5",
        showInsetMap: true,
        slots: [{ kind: "chart", label: "Trend summary" }],
        composition: {
          includeAttribution: true,
          includeLegend: false,
          includeScaleBar: true,
          includeNorthArrow: false,
        },
      },
    ]);

    render(
      <MapLayoutDesignerPanel
        visible
        presentation="embedded"
        overlayLayers={[layer]}
        qaState={null}
        restoreRequest={{ id: "temporal-frame-2024", metadata: restoreMetadata }}
        onClose={() => undefined}
        onRestoreRequestHandled={handled}
      />,
    );

    await waitFor(() => {
      expect((screen.getByLabelText("Page title") as HTMLInputElement).value).toBe("Year 2024");
    });

    expect((screen.getByLabelText("Export preset") as HTMLSelectElement).value).toBe("1");
    expect(handled).toHaveBeenCalledWith("temporal-frame-2024");
  });

  it("is draggable and resizable when rendered as floating panel", () => {
    render(
      <MapLayoutDesignerPanel
        visible
        overlayLayers={[makeLayer()]}
        qaState={null}
        onClose={() => undefined}
      />,
    );

    const panel = screen.getByTestId("map-layout-designer");
    expect(panel.getAttribute("data-draggable-map-panel")).toBe("true");
    expect((panel as HTMLElement).style.resize).toBe("both");
  });
});