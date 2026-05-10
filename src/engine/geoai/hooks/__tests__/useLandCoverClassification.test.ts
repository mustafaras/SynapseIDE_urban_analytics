// @vitest-environment jsdom

import React, { act, useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { useLandCoverClassification } from "../useLandCoverClassification";
import { createDemoRasterSource, createImportedRasterSource, useEOSourceStore } from "@/services/data/eo";
import { useGeoAIStatusStore } from "@/stores/useGeoAIStatusStore";

type HookValue = ReturnType<typeof useLandCoverClassification>;

function makeAnalysisRaster() {
  const width = 12;
  const height = 12;
  const pixelCount = width * height;
  return {
    width,
    height,
    bandCount: 4,
    bbox: [28.94, 41.01, 28.952, 41.022] as [number, number, number, number],
    data: [
      Float64Array.from({ length: pixelCount }, (_, index) => index % width),
      Float64Array.from({ length: pixelCount }, (_, index) => (index % width) * 0.5),
      Float64Array.from({ length: pixelCount }, (_, index) => Math.floor(index / width)),
      Float64Array.from({ length: pixelCount }, (_, index) => (index % width) + Math.floor(index / width)),
    ],
  };
}

function HookHarness(props: { onValue: (value: HookValue) => void }) {
  const value = useLandCoverClassification();
  useEffect(() => {
    props.onValue(value);
  }, [props, value]);
  return null;
}

beforeEach(() => {
  useEOSourceStore.getState().clear();
  useGeoAIStatusStore.getState().reset();
});

describe("useLandCoverClassification", () => {
  it("keeps demo mode explicit and retains reference validation for the demo source", async () => {
    let latest: HookValue | null = null;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(HookHarness, {
        onValue: (value: HookValue) => {
          latest = value;
        },
      }));
    });

    const demoSource = createDemoRasterSource();
    let run = null;
    await act(async () => {
      run = await latest?.runClassification(demoSource);
    });

    expect(run).not.toBeNull();
    expect(run?.source.runtimeMode).toBe("demo-source");
    expect(run?.source.validationState).toBe("reference-validated");
    expect(run?.accuracy).not.toBeNull();
    expect(run?.scene.groundTruth).toBeInstanceOf(Uint8Array);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("runs against a real imported raster without silently falling back to demo mode", async () => {
    let latest: HookValue | null = null;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(HookHarness, {
        onValue: (value: HookValue) => {
          latest = value;
        },
      }));
    });

    const source = createImportedRasterSource({
      title: "Imported Raster Test Source",
      sourceRef: "file://imported-raster.tif",
      bbox: [28.94, 41.01, 28.952, 41.022],
      crs: "EPSG:4326",
      bandMapping: [
        { key: "blue", source: "band-1", label: "Blue" },
        { key: "green", source: "band-2", label: "Green" },
        { key: "red", source: "band-3", label: "Red" },
        { key: "nir", source: "band-4", label: "Near Infrared" },
      ],
      analysisRaster: makeAnalysisRaster(),
    });

    let run = null;
    await act(async () => {
      run = await latest?.runClassification(source);
    });

    expect(run).not.toBeNull();
    expect(run?.source.runtimeMode).toBe("real-source");
    expect(run?.source.kind).toBe("imported-raster");
    expect(run?.source.validationState).toBe("unvalidated");
    expect(run?.accuracy).toBeNull();
    expect(run?.scene.bounds).toEqual(source.analysisRaster?.bbox);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
