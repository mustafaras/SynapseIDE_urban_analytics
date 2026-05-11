// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { haversineDistance } from "@/utils/geodesic";
import {
  A0_LANDSCAPE_PAGE_MM,
  A0_LEGEND_PANEL_MM,
  A0_SHEET_LAYOUT_MM,
  buildMapCompositionLegendItems,
  buildMapPublicationManifest,
  buildMapPublicationReadiness,
  calculateScaleBarSpec,
  chooseScaleBarDistance,
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  formatScaleBarLabel,
  generateMapExportFilename,
  generateMapOnlyA0LandscapeFilename,
  generateMapPublicationFilename,
  getA0LegendPanelDimensionsPx,
  getA0SheetMapAreaMm,
  getA0SheetMapAspectRatio,
  getA0SheetMapFrameMm,
  getCompositionPageDimensionsMm,
  getCompositionPageDimensionsPx,
  getExportPixelRatio,
  getFittedMapImageRect,
  getNorthArrowRotationRadians,
  getResolutionScale,
  mapDpiToResolution,
  mapPublicationReadinessToEvidenceQA,
} from "../MapExportService";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapScientificQAState } from "../MapScientificQA";

const fixedReadinessDate = new Date("2026-04-11T20:31:45.000Z");

function publicationLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "layer-1",
    name: "Transit access",
    type: "geojson",
    visible: true,
    opacity: 1,
    style: { fillColor: "#38BDF8" },
    provenance: {
      label: "Transit source",
      sourceName: "Transit authority",
      attribution: "Transit authority",
      license: "ODbL",
    },
    metadata: {
      crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
      schemaSummary: { fieldCount: 2, fields: [{ name: "id", role: "identifier" }, { name: "score", role: "attribute" }], source: "explicit", notes: [] },
      geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 12, source: "explicit", notes: [] },
      licenseAttribution: { license: "ODbL", attribution: "Transit authority", sourceName: "Transit authority", requiresAttribution: true, source: "explicit", notes: [] },
      scientificQA: { status: "pass", issueIds: [], badges: [], caveats: [] },
    },
    ...overrides,
  } as OverlayLayerConfig;
}

function qaState(overrides: Partial<MapScientificQAState> = {}): MapScientificQAState {
  return {
    status: "pass",
    checkedAt: fixedReadinessDate.toISOString(),
    issues: [],
    layerSummaries: [],
    metadata: {
      generatedBy: "MapScientificQA",
      version: 2,
      signature: "qa-signature",
      visibleLayerCount: 1,
      workerLayerCount: 0,
      issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
      categoryCounts: { pass: 1, warning: 0, blocked: 0, unknown: 0 },
      categorySummaries: [{
        category: "export-readiness",
        severity: "pass",
        issueIds: [],
        affectedLayerIds: [],
        reasons: [],
        recommendedFixes: [],
      }],
    },
    ...overrides,
  };
}

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

  it("blocks formal publication readiness without a visible layer", () => {
    const readiness = buildMapPublicationReadiness({
      mode: "publication-export",
      overlayLayers: [],
      composition: DEFAULT_MAP_COMPOSITION_OPTIONS,
      scientificQA: qaState(),
      now: fixedReadinessDate,
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers.map((check) => check.criterion)).toContain("visible-layer");
  });

  it("blocks formal publication readiness when title is missing", () => {
    const readiness = buildMapPublicationReadiness({
      mode: "publication-export",
      overlayLayers: [publicationLayer()],
      composition: { ...DEFAULT_MAP_COMPOSITION_OPTIONS, title: "  " },
      scientificQA: qaState(),
      now: fixedReadinessDate,
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers.map((check) => check.criterion)).toContain("title");
  });

  it("warns when layer-level attribution metadata is incomplete", () => {
    const layer = publicationLayer({
      provenance: { label: "Unknown source" },
      metadata: {
        crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
        schemaSummary: { fieldCount: 1, fields: [{ name: "id", role: "identifier" }], source: "explicit", notes: [] },
        geometrySummary: { geometryType: "Point", geometryTypes: ["Point"], featureCount: 3, source: "explicit", notes: [] },
      },
    });

    const readiness = buildMapPublicationReadiness({
      mode: "publication-export",
      overlayLayers: [layer],
      composition: { ...DEFAULT_MAP_COMPOSITION_OPTIONS, attributionText: "Sources: project layer registry." },
      scientificQA: qaState(),
      legendItems: buildMapCompositionLegendItems([layer]),
      now: fixedReadinessDate,
    });

    expect(readiness.status).toBe("ready-with-caveats");
    expect(readiness.warnings.map((check) => check.criterion)).toContain("attribution-license");
  });

  it("blocks unacknowledged export-readiness QA blockers", () => {
    const readiness = buildMapPublicationReadiness({
      mode: "publication-export",
      overlayLayers: [publicationLayer()],
      composition: DEFAULT_MAP_COMPOSITION_OPTIONS,
      scientificQA: qaState({
        status: "error",
        issues: [{
          id: "qa-export-1",
          code: "missing-license",
          category: "export-readiness",
          severity: "blocker",
          title: "Missing license",
          explanation: "The layer is missing publication license metadata.",
          suggestedFix: "Attach license metadata.",
          layerId: "layer-1",
          layerName: "Transit access",
        }],
        metadata: {
          generatedBy: "MapScientificQA",
          version: 2,
          signature: "qa-blocked",
          visibleLayerCount: 1,
          workerLayerCount: 0,
          issueCounts: { info: 0, warning: 0, error: 0, blocker: 1 },
          categoryCounts: { pass: 0, warning: 0, blocked: 1, unknown: 0 },
          categorySummaries: [{
            category: "export-readiness",
            severity: "blocked",
            issueIds: ["qa-export-1"],
            affectedLayerIds: ["layer-1"],
            reasons: ["Missing license"],
            recommendedFixes: ["Attach license metadata."],
          }],
        },
      }),
      now: fixedReadinessDate,
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers.map((check) => check.criterion)).toContain("qa-blockers");
    expect(readiness.blockers.flatMap((check) => check.issueIds)).toContain("qa-export-1");
  });

  it("creates a publication manifest and evidence QA from ready-with-caveats readiness", () => {
    const layer = publicationLayer({ metadata: { scientificQA: { status: "warning", issueIds: ["qa-warn-1"], badges: ["uncertain_output"], caveats: ["Classification uncertainty remains."] } } });
    const readiness = buildMapPublicationReadiness({
      mode: "publication-export",
      overlayLayers: [layer],
      composition: DEFAULT_MAP_COMPOSITION_OPTIONS,
      scientificQA: qaState({
        status: "warning",
        issues: [{
          id: "qa-warn-1",
          code: "classification-warning",
          category: "source-provenance",
          severity: "warning",
          title: "Classification uncertainty",
          explanation: "Classes should be interpreted as screening evidence.",
          suggestedFix: "Review class thresholds.",
          layerId: "layer-1",
          layerName: "Transit access",
        }],
        metadata: {
          generatedBy: "MapScientificQA",
          version: 2,
          signature: "qa-warning",
          visibleLayerCount: 1,
          workerLayerCount: 0,
          issueCounts: { info: 0, warning: 1, error: 0, blocker: 0 },
          categoryCounts: { pass: 0, warning: 1, blocked: 0, unknown: 0 },
        },
      }),
      now: fixedReadinessDate,
    });
    const manifest = buildMapPublicationManifest({
      result: { filename: "map.pdf", format: "pdf", mimeType: "application/pdf", width: 100, height: 80 },
      composition: DEFAULT_MAP_COMPOSITION_OPTIONS,
      overlayLayers: [layer],
      legendItems: buildMapCompositionLegendItems([layer]),
      readiness,
      scientificQA: qaState(),
      createdAt: fixedReadinessDate.toISOString(),
    });
    const evidenceQA = mapPublicationReadinessToEvidenceQA(readiness);

    expect(readiness.status).toBe("ready-with-caveats");
    expect(manifest.readiness.status).toBe("ready-with-caveats");
    expect(manifest.visibleLayerIds).toEqual(["layer-1"]);
    expect(evidenceQA.state).toBe("warning");
    expect(evidenceQA.caveats.length).toBeGreaterThan(0);
  });
});
