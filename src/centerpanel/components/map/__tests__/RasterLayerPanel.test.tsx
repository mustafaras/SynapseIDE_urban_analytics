// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RasterLayerPanel } from "../raster/RasterLayerPanel";
import { defaultRasterRenderConfig, type GeoTiffInspection } from "@/services/map/raster/GeoTiffParser";
import { assessRasterQA } from "@/services/map/raster/RasterQAService";
import { computeBandStats, computeHistogram } from "@/services/map/raster/RasterHistogramEngine";
import { useRasterLayerStore } from "../../../../stores/useRasterLayerStore";

const LAYER_ID = "raster-evidence-layer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function installCanvasStub(): void {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => ({
      clearRect: () => undefined,
      fillRect: () => undefined,
      strokeRect: () => undefined,
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      save: () => undefined,
      restore: () => undefined,
      setLineDash: () => undefined,
      beginPath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      fillText: () => undefined,
    }),
  });
}

function makeSamples(values: readonly number[]): Float64Array {
  const samples = new Float64Array(values.length);
  values.forEach((value, index) => {
    samples[index] = value;
  });
  return samples;
}

function makeInspection(options: {
  sampled: boolean;
  epsgCode: string | null;
  noData: number | null;
}): GeoTiffInspection {
  const red = makeSamples([1, 2, 3, 4, 5, options.noData ?? 6]);
  const green = makeSamples([10, 12, 14, 16, options.noData ?? 18, 20]);
  const blue = makeSamples([100, 120, 140, options.noData ?? 160, 180, 200]);
  const width = options.sampled ? 4096 : 3;
  const height = options.sampled ? 4096 : 2;
  const sampleWidth = options.sampled ? 256 : width;
  const sampleHeight = options.sampled ? 256 : height;

  return {
    metadata: {
      width,
      height,
      bandCount: 3,
      bands: [
        { index: 0, label: "Red", dtype: "float32" },
        { index: 1, label: "Green", dtype: "float32" },
        { index: 2, label: "Blue", dtype: "float32" },
      ],
      noData: options.noData,
      bbox: [29, 41, 30, 42],
      epsgCode: options.epsgCode,
      sampled: options.sampled,
      sampleWidth,
      sampleHeight,
      sizeBytes: 2_400_000,
    },
    bandSamples: [
      { bandIndex: 0, samples: red, stats: computeBandStats(red, options.noData) },
      { bandIndex: 1, samples: green, stats: computeBandStats(green, options.noData) },
      { bandIndex: 2, samples: blue, stats: computeBandStats(blue, options.noData) },
    ],
    caveats: options.sampled
      ? ["Raster statistics are based on a 256×256 sample; full-resolution stats require a worker pass."]
      : [],
  };
}

function renderRasterPanel(inspection: GeoTiffInspection): HTMLDivElement {
  const histogram = computeHistogram(inspection.bandSamples[0]?.samples ?? new Float64Array(0), inspection.metadata.noData, 32);
  useRasterLayerStore.setState({
    layers: {
      [LAYER_ID]: {
        layerId: LAYER_ID,
        inspection,
        qa: assessRasterQA(inspection.metadata),
        renderConfig: defaultRasterRenderConfig(),
        histogram,
        parsing: false,
        parseError: null,
      },
    },
  });

  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <RasterLayerPanel
        layerId={LAYER_ID}
        layerName="Elevation evidence"
        presentation="embedded"
      />,
    );
  });
  return host;
}

function query(testId: string): Element | null {
  return host?.querySelector(`[data-testid="${testId}"]`) ?? null;
}

beforeEach(() => {
  installCanvasStub();
});

afterEach(() => {
  if (root) {
    act(() => {
      root!.unmount();
    });
  }
  host?.remove();
  root = null;
  host = null;
  useRasterLayerStore.setState({ layers: {} });
});

describe("RasterLayerPanel evidence UI", () => {
  it("keeps sampled raster source, CRS, noData, bands, chart, legend, and references visible", () => {
    const container = renderRasterPanel(makeInspection({
      sampled: true,
      epsgCode: "EPSG:32635",
      noData: -9999,
    }));

    expect(query("raster-source-summary")).not.toBeNull();
    expect(container.textContent).toContain("GeoTIFF");
    expect(container.textContent).toContain("sampled stats only");
    expect(container.textContent).toContain("Full-resolution raster analytics are not claimed here");
    expect(container.textContent).toContain("CRS EPSG:32635");
    expect(container.textContent).toContain("noData -9,999");
    expect(query("raster-band-metadata")).not.toBeNull();
    expect(container.textContent).toContain("Red");
    expect(container.textContent).toContain("Green");
    expect(container.textContent).toContain("Blue");
    expect(query("raster-evidence-canvas")).not.toBeNull();
    expect(query("raster-legend-caveat-chips")).not.toBeNull();
    expect(query("raster-chart-caveat-chips")).not.toBeNull();
    expect(query("raster-evidence-references")).not.toBeNull();
    expect(container.textContent).toContain("QA signature");
  });

  it("keeps full-stat and missing CRS/noData caveats explicit", () => {
    const container = renderRasterPanel(makeInspection({
      sampled: false,
      epsgCode: null,
      noData: null,
    }));

    expect(container.textContent).toContain("full stats");
    expect(container.textContent).toContain("CRS missing");
    expect(container.textContent).toContain("noData missing");
    expect(container.querySelector('[data-status="blocked"]')).not.toBeNull();
    expect(query("raster-chart-nodata-chip")).not.toBeNull();
    expect(query("raster-legend-nodata-status-chip")).not.toBeNull();
  });
});
