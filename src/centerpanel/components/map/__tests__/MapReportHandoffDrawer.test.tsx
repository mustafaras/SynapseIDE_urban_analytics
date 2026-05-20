// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import { MapReportHandoffDrawer } from "../MapReportHandoffDrawer";
import {
  buildMapReportHandoffDraft,
  DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
} from "../../../../services/map/MapReportHandoffService";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const viewport = {
  center: [29.01, 41.02] as [number, number],
  zoom: 11,
  bearing: 0,
  pitch: 0,
};

let roots: Root[] = [];

afterEach(() => {
  act(() => {
    roots.forEach((root) => root.unmount());
  });
  roots = [];
  document.body.innerHTML = "";
});

function layer(): OverlayLayerConfig {
  return {
    id: "risk-layer",
    name: "Risk layer",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "derived",
    provenance: {
      label: "Risk model",
      sourceName: "Planning data unit",
      license: "ODC-BY",
    },
    style: {
      color: "#3794ff",
      legendEntries: [{ label: "High", color: "#ef4444" }],
    },
    metadata: {
      evidenceArtifactId: "map-evidence-layer-risk",
      geometryType: "Polygon",
      featureCount: 12,
      datasetContext: {
        datasetId: "risk-2025",
        datasetTitle: "Risk 2025",
        source: "Planning data unit",
        license: "ODC-BY",
        crs: "EPSG:4326",
      },
    },
  };
}

describe("MapReportHandoffDrawer", () => {
  it("exposes a structured evidence registration action", async () => {
    const onRegisterEvidence = vi.fn();
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [layer()],
      viewport,
      snapshot: {
        dataUrl: "data:image/png;base64,abc",
        width: 320,
        height: 220,
        scaleBarLabel: "1 km",
        northArrowBearing: 0,
        attributionText: "Sources: Planning data unit",
      },
      createdAt: "2025-01-06T00:00:00.000Z",
    });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        <MapReportHandoffDrawer
          draft={draft}
          options={DEFAULT_MAP_REPORT_HANDOFF_OPTIONS}
          isGeneratingSnapshot={false}
          onOptionsChange={vi.fn()}
          onRefreshSnapshot={vi.fn()}
          onRegisterEvidence={onRegisterEvidence}
          onDownloadPdf={vi.fn()}
          onInsert={vi.fn()}
          onClose={vi.fn()}
        />,
      );
    });

    const registerButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Register evidence"));
    expect(registerButton).toBeDefined();
    if (!registerButton) throw new Error("Register evidence button was not rendered");

    await act(async () => {
      registerButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRegisterEvidence).toHaveBeenCalledTimes(1);
  });
});
