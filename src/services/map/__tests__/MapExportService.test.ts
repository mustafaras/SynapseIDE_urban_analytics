// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { haversineDistance } from "@/utils/geodesic";
import {
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  A0_LANDSCAPE_PAGE_MM,
  A0_LEGEND_PANEL_MM,
  A0_SHEET_LAYOUT_MM,
  buildMapCompositionLegendItems,
  calculateScaleBarSpec,
  chooseScaleBarDistance,
  formatScaleBarLabel,
  getA0LegendPanelDimensionsPx,
  getA0SheetMapAreaMm,
  getA0SheetMapAspectRatio,
  getA0SheetMapFrameMm,
  generateMapOnlyA0LandscapeFilename,
  generateMapPublicationFilename,
  getCompositionPageDimensionsMm,
  getCompositionPageDimensionsPx,
  getExportPixelRatio,
  getFittedMapImageRect,
  getNorthArrowRotationRadians,
  generateMapExportFilename,
  getResolutionScale,
  mapDpiToResolution,
} from "../MapExportService";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";

describe("MapExportService", () => {
  it("maps resolution presets to the expected scale multipliers", () => {
    expect(getResolutionScale("screen")).toBe(1);
    expect(getResolutionScale("print")).toBe(2);
    expect(getResolutionScale("high")).toBe(4);
  });

  it("uses screen pixel ratio only for the screen preset", () => {
    expect(getExportPixelRatio("screen", 1.5)).toBe(1.5);
    expect(getExportPixelRatio("print", 1.5)).toBe(2);
    expect(getExportPixelRatio("high", 1.5)).toBe(4);
    expect(getExportPixelRatio("screen", 0)).toBe(1);
  });

  it("rotates the north arrow opposite the current map bearing", () => {
    expect(getNorthArrowRotationRadians(0)).toBe(0);
    expect(getNorthArrowRotationRadians(90)).toBeCloseTo(-Math.PI / 2, 8);
    expect(getNorthArrowRotationRadians(-45)).toBeCloseTo(Math.PI / 4, 8);
  });

  it("generates deterministic timestamped PNG filenames", () => {
    const date = new Date(2026, 3, 11, 20, 31, 45);
    expect(generateMapExportFilename(date)).toBe("map-export-2026-04-11-203145.png");
  });

  it("maps publication DPI presets onto map capture resolution presets", () => {
    expect(mapDpiToResolution(72)).toBe("screen");
    expect(mapDpiToResolution(150)).toBe("print");
    expect(mapDpiToResolution(300)).toBe("high");
  });

  it("generates deterministic publication filenames by format", () => {
    const date = new Date(2026, 3, 11, 20, 31, 45);
    expect(generateMapPublicationFilename("pdf", date)).toBe("map-composition-2026-04-11-203145.pdf");
    expect(generateMapPublicationFilename("svg", date)).toBe("map-composition-2026-04-11-203145.svg");
    expect(generateMapOnlyA0LandscapeFilename(date)).toBe("map-a0-landscape-2026-04-11-203145.pdf");
  });

  it("resolves standard and custom page dimensions in millimetres and pixels", () => {
    expect(getCompositionPageDimensionsMm({ pageSize: "a4", customWidthMm: 0, customHeightMm: 0 })).toEqual({
      width: 210,
      height: 297,
    });
    expect(getCompositionPageDimensionsMm({ pageSize: "custom", customWidthMm: 420, customHeightMm: 297 })).toEqual({
      width: 420,
      height: 297,
    });
    expect(getCompositionPageDimensionsPx({
      ...DEFAULT_MAP_COMPOSITION_OPTIONS,
      pageSize: "a4",
      dpi: 300,
    })).toEqual({
      width: 2480,
      height: 3508,
    });
    expect(A0_LANDSCAPE_PAGE_MM).toEqual({ width: 1189, height: 841 });
    expect(A0_SHEET_LAYOUT_MM).toEqual({ margin: 18, titleBandHeight: 38, titleGap: 10, footerHeight: 24 });
    expect(A0_LEGEND_PANEL_MM).toEqual({ width: 155, height: 68 });
    expect(getA0LegendPanelDimensionsPx(300)).toEqual({ width: 1831, height: 803 });
    expect(getA0SheetMapAreaMm()).toEqual({ x: 18, y: 66, width: 1153, height: 733 });
    expect(getA0SheetMapAspectRatio()).toBeCloseTo(1153 / 733, 8);
    const a0Frame = getA0SheetMapFrameMm(16 / 9);
    expect(a0Frame.x).toBeCloseTo(18, 5);
    expect(a0Frame.y).toBeCloseTo(66, 5);
    expect(a0Frame.width).toBeCloseTo(1153, 5);
    expect(a0Frame.height).toBeCloseTo(648.5625, 5);
  });

  it("fits map images into publication frames without stretching the aspect ratio", () => {
    const frame = { x: 10, y: 20, width: 400, height: 200 };
    const image = { width: 400, height: 400 };

    expect(getFittedMapImageRect(image, frame, "contain")).toEqual({
      x: 110,
      y: 20,
      width: 200,
      height: 200,
    });
    expect(getFittedMapImageRect(image, frame, "cover")).toEqual({
      x: 10,
      y: -80,
      width: 400,
      height: 400,
    });
  });

  it("builds publication legend entries from layer style, analysis visualization, and fallback metadata", () => {
    const layers = [
      {
        id: "styled",
        name: "Population bins",
        type: "geojson",
        visible: true,
        opacity: 1,
        style: {
          legendEntries: [
            { label: "High density", color: "#EF4444" },
            { label: "Medium density", color: "#F59E0B" },
          ],
        },
      },
      {
        id: "analysis",
        name: "Access score",
        type: "geojson",
        visible: true,
        opacity: 1,
        metadata: {
          analysisResult: {
            visualization: {
              legend: [
                { label: "Low access", color: "#38BDF8" },
              ],
            },
          },
        },
      },
      {
        id: "fallback",
        name: "Street segments",
        type: "geojson",
        visible: true,
        opacity: 1,
        style: { lineColor: "#22C55E" },
        metadata: { geometryType: "LineString" },
      },
      {
        id: "hidden",
        name: "Hidden layer",
        type: "heatmap",
        visible: false,
        opacity: 1,
      },
    ] as unknown as OverlayLayerConfig[];

    const legend = buildMapCompositionLegendItems(layers);

    expect(legend.map((entry) => entry.label)).toEqual([
      "High density",
      "Medium density",
      "Low access",
      "Street segments (LineString)",
    ]);
    expect(legend[2]?.secondaryLabel).toBe("Access score");
    expect(legend[3]).toMatchObject({ color: "#22C55E", kind: "line" });
  });

  it("chooses a nice scale bar distance under the measured span", () => {
    expect(chooseScaleBarDistance(187)).toBe(100);
    expect(chooseScaleBarDistance(3_400)).toBe(2_000);
    expect(chooseScaleBarDistance(12_800)).toBe(10_000);
  });

  it("formats scale bar labels in metres and kilometres", () => {
    expect(formatScaleBarLabel(100)).toBe("100 m");
    expect(formatScaleBarLabel(1_000)).toBe("1 km");
    expect(formatScaleBarLabel(2_500)).toBe("2.5 km");
  });

  it("builds a geodesically accurate scale bar specification", () => {
    const mapStub = {
      getContainer: () => ({
        getBoundingClientRect: () => ({
          width: 1_000,
          height: 600,
        }),
      }),
      unproject: ([x]: [number, number]) => ({
        lng: x * 0.00001,
        lat: 0,
      }),
    };

    const spec = calculateScaleBarSpec(mapStub as never, 200);
    expect(spec).not.toBeNull();
    expect(spec?.distanceMetres).toBeGreaterThan(0);
    expect(spec?.pixelWidthCss).toBeLessThanOrEqual(200);

    const actualDistance = haversineDistance(
      [0, 0],
      [(spec?.pixelWidthCss ?? 0) * 0.00001, 0],
    );

    expect(spec?.distanceMetres).toBeGreaterThan(0);
    expect(
      Math.abs(actualDistance - (spec?.distanceMetres ?? 0)) / (spec?.distanceMetres ?? 1),
    ).toBeLessThanOrEqual(0.01);
  });
});
