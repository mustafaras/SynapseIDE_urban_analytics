import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig, ViewportState } from "../mapTypes";
import {
  buildLayerStyleUpdate,
  getDefaultLayerStyleOptions,
  getSerializedLegendSpecFromStyle,
  serializedLegendSpecToCompositionItems,
  type LayerStyleEditorOptions,
  type LayerStyleUpdate,
  type SerializedLegendMode,
} from "../inspector/style/legendContract";
import { fcPointsWGS84, fcPolygonsProjected } from "./fixtures/gisFixtures";
import {
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  buildMapCompositionLegendItems,
  buildMapPublicationReadiness,
} from "@/services/map/MapExportService";
import { buildMapReportHandoffDraft } from "@/services/map/MapReportHandoffService";
import { generateMapCartographyReview } from "@/services/map/MapCartographyAdvisor";
import {
  DOT_DENSITY_NORMALIZATION_CAVEAT,
  buildDotDensityFeatureCollection,
  getSerializedAdvancedCartographySpecFromStyle,
} from "@/services/map/cartography/AdvancedCartographyEngine";
import {
  buildMapLibreLabelFragments,
  cullOverlappingLabelCandidates,
  getSerializedMapLabelSpecFromStyle,
  isLabelVisibleAtZoom,
} from "@/services/map/labels/MapLabelEngine";

function projectedPolygonLayer(style: Record<string, unknown> = {}): OverlayLayerConfig {
  return {
    id: "projected-parcels",
    name: "Projected parcels",
    type: "geojson",
    visible: true,
    opacity: 0.88,
    sourceKind: "imported",
    sourceData: fcPolygonsProjected.featureCollection,
    style,
    metadata: {
      geometryType: "Polygon",
      featureCount: fcPolygonsProjected.featureCollection.features.length,
      fields: ["id", "zone", "area_m2"],
      crsSummary: {
        crs: fcPolygonsProjected.declaredCrs,
        status: "known",
        source: "explicit",
        notes: [],
      },
    },
  };
}

function advancedPolygonLayer(style: Record<string, unknown> = {}): OverlayLayerConfig {
  const sourceData: GeoJSON.FeatureCollection = {
    ...fcPolygonsProjected.featureCollection,
    features: fcPolygonsProjected.featureCollection.features.map((feature, index) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        risk_score: 12 + index * 3,
        population: 900 + index * 450,
      },
    })),
  };

  return {
    ...projectedPolygonLayer(style),
    sourceData,
    metadata: {
      ...projectedPolygonLayer(style).metadata,
      fields: ["id", "zone", "area_m2", "risk_score", "population"],
    },
  };
}

function pointLayer(style: Record<string, unknown> = {}): OverlayLayerConfig {
  return {
    id: "wgs84-sites",
    name: "WGS84 sites",
    type: "geojson",
    visible: true,
    opacity: 0.92,
    sourceKind: "imported",
    sourceData: fcPointsWGS84,
    style,
    metadata: {
      geometryType: "Point",
      featureCount: fcPointsWGS84.features.length,
      fields: ["id", "name", "value", "date"],
      crsSummary: {
        crs: "EPSG:4326",
        status: "known",
        source: "explicit",
        notes: [],
      },
    },
  };
}

function heatmapLayer(style: Record<string, unknown> = {}): OverlayLayerConfig {
  return {
    ...pointLayer(style),
    id: "site-density",
    name: "Site density",
    type: "heatmap",
  };
}

function lineLayer(style: Record<string, unknown> = {}): OverlayLayerConfig {
  return {
    id: "transit-lines",
    name: "Transit lines",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    sourceData: {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: { id: 1, ridership: 1200 },
        geometry: {
          type: "LineString",
          coordinates: [[29, 41], [29.1, 41.1]],
        },
      }],
    },
    style,
    metadata: {
      geometryType: "LineString",
      featureCount: 1,
      fields: ["id", "ridership"],
      crsSummary: {
        crs: "EPSG:32635",
        status: "known",
        source: "explicit",
        notes: [],
      },
    },
  };
}

function applyUpdate(layer: OverlayLayerConfig, update: LayerStyleUpdate): OverlayLayerConfig {
  return {
    ...layer,
    opacity: update.opacity,
    style: update.style,
    metadata: {
      ...(layer.metadata ?? {}),
      ...update.metadataPatch,
    },
  };
}

function expectLegendParity(layer: OverlayLayerConfig, update: LayerStyleUpdate): void {
  const styledLayer = applyUpdate(layer, update);
  const storedSpec = getSerializedLegendSpecFromStyle(styledLayer.style);
  const serializedLegend = serializedLegendSpecToCompositionItems(update.legendSpec);
  const mapLegend = buildMapCompositionLegendItems([styledLayer]);
  const reportDraft = buildMapReportHandoffDraft({
    overlayLayers: [styledLayer],
    viewport,
    currentMapBounds: [28.9, 40.9, 29.2, 41.2],
    baseLayerName: "Charcoal street atlas",
    createdAt: "2026-05-23T00:00:00.000Z",
  });
  const readiness = buildMapPublicationReadiness({
    mode: "publication-export",
    overlayLayers: [styledLayer],
    composition: {
      ...DEFAULT_MAP_COMPOSITION_OPTIONS,
      title: "Legend contract parity",
      attributionText: "Fixture source",
    },
    legendItems: mapLegend,
    requireScaleBar: false,
    requireNorthArrow: false,
    requireAttribution: false,
    now: new Date("2026-05-23T00:00:00.000Z"),
  });

  expect(storedSpec).toEqual(update.legendSpec);
  expect(mapLegend).toEqual(serializedLegend);
  expect(reportDraft.snapshot.legendItems).toEqual(serializedLegend);
  expect(reportDraft.evidenceBlock.payload.composition.legendItems).toEqual(serializedLegend);
  expect(readiness.hasLegend).toBe(true);
  expect(readiness.checks.find((check) => check.criterion === "legend")?.message).toContain(`${serializedLegend.length} legend item`);
}

const viewport: ViewportState = {
  center: [29, 41],
  zoom: 11,
  bearing: 0,
  pitch: 0,
};

describe("style editor legend contract", () => {
  it("serializes one legend spec for map, report, and export surfaces", () => {
    const layer = projectedPolygonLayer();
    const update = buildLayerStyleUpdate(layer, {
      ...getDefaultLayerStyleOptions(layer),
      mode: "choropleth",
      field: "area_m2",
      classCount: 4,
      classificationMethod: "quantile",
      noDataLabel: "No area value",
    }, "2026-05-23T00:00:00.000Z");
    const styledLayer: OverlayLayerConfig = {
      ...layer,
      opacity: update.opacity,
      style: update.style,
      metadata: {
        ...(layer.metadata ?? {}),
        ...update.metadataPatch,
      },
    };

    const mapLegend = buildMapCompositionLegendItems([styledLayer]);
    const serializedLegend = serializedLegendSpecToCompositionItems(update.legendSpec);
    const reportDraft = buildMapReportHandoffDraft({
      overlayLayers: [styledLayer],
      viewport,
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
      baseLayerName: "Charcoal street atlas",
      createdAt: "2026-05-23T00:00:00.000Z",
    });

    expect(update.legendSpec.entries.some((entry) => entry.noData && entry.label === "No area value")).toBe(true);
    expect(mapLegend).toEqual(serializedLegend);
    expect(reportDraft.snapshot.legendItems).toEqual(mapLegend);
    expect(reportDraft.evidenceBlock.payload.composition.legendItems).toEqual(mapLegend);
  });

  it("keeps one serialized legend contract for every supported renderer family", () => {
    const cases: Array<{
      label: string;
      layer: OverlayLayerConfig;
      mode: SerializedLegendMode;
      options: Partial<LayerStyleEditorOptions>;
      expectedKind: string;
      expectedMinimumEntries: number;
    }> = [
      {
        label: "single symbol",
        layer: projectedPolygonLayer(),
        mode: "single",
        options: {},
        expectedKind: "fill",
        expectedMinimumEntries: 2,
      },
      {
        label: "choropleth",
        layer: projectedPolygonLayer(),
        mode: "choropleth",
        options: { field: "area_m2", classCount: 4, classificationMethod: "quantile" },
        expectedKind: "fill",
        expectedMinimumEntries: 5,
      },
      {
        label: "categorical",
        layer: projectedPolygonLayer(),
        mode: "categorical",
        options: { field: "zone", classCount: 3 },
        expectedKind: "fill",
        expectedMinimumEntries: 3,
      },
      {
        label: "graduated symbols",
        layer: pointLayer(),
        mode: "graduated-symbol",
        options: { field: "value", classCount: 4 },
        expectedKind: "circle",
        expectedMinimumEntries: 5,
      },
      {
        label: "proportional symbols",
        layer: pointLayer(),
        mode: "proportional-symbol",
        options: { field: "value", classCount: 4 },
        expectedKind: "circle",
        expectedMinimumEntries: 5,
      },
      {
        label: "heatmap",
        layer: heatmapLayer(),
        mode: "heatmap",
        options: { field: "value", classCount: 5 },
        expectedKind: "heatmap",
        expectedMinimumEntries: 6,
      },
    ];

    for (const testCase of cases) {
      const defaults = getDefaultLayerStyleOptions(testCase.layer);
      const update = buildLayerStyleUpdate(testCase.layer, {
        ...defaults,
        mode: testCase.mode,
        noDataLabel: `${testCase.label} noData`,
        ...testCase.options,
      }, "2026-05-23T00:00:00.000Z");
      const noDataEntry = update.legendSpec.entries.find((entry) => entry.noData);
      const renderedEntries = update.legendSpec.entries.filter((entry) => !entry.noData);

      expect(update.legendSpec.mode).toBe(testCase.mode);
      expect(renderedEntries.length).toBeGreaterThan(0);
      expect(renderedEntries.every((entry) => entry.kind === testCase.expectedKind)).toBe(true);
      expect(update.legendSpec.entries.length).toBeGreaterThanOrEqual(testCase.expectedMinimumEntries);
      expect(noDataEntry).toMatchObject({
        label: `${testCase.label} noData`,
        noData: true,
        kind: testCase.expectedKind,
      });
      expectLegendParity(testCase.layer, update);
    }
  });

  it("carries opacity, outline, and stroke styling alongside the serialized legend", () => {
    const polygonLayer = projectedPolygonLayer();
    const polygonUpdate = buildLayerStyleUpdate(polygonLayer, {
      ...getDefaultLayerStyleOptions(polygonLayer),
      mode: "choropleth",
      field: "area_m2",
      opacity: 0.42,
      outlineColor: "#123456",
      outlineWidth: 2.4,
    }, "2026-05-23T00:00:00.000Z");
    expect(polygonUpdate.opacity).toBe(0.42);
    expect(polygonUpdate.style["fill-outline-color"]).toBe("#123456");
    expectLegendParity(polygonLayer, polygonUpdate);

    const symbolLayer = pointLayer();
    const symbolUpdate = buildLayerStyleUpdate(symbolLayer, {
      ...getDefaultLayerStyleOptions(symbolLayer),
      mode: "proportional-symbol",
      field: "value",
      outlineColor: "#654321",
      outlineWidth: 3.2,
    }, "2026-05-23T00:00:00.000Z");
    expect(symbolUpdate.style["circle-stroke-color"]).toBe("#654321");
    expect(symbolUpdate.style["circle-stroke-width"]).toBe(3.2);
    expectLegendParity(symbolLayer, symbolUpdate);

    const routeLayer = lineLayer();
    const routeUpdate = buildLayerStyleUpdate(routeLayer, {
      ...getDefaultLayerStyleOptions(routeLayer),
      mode: "choropleth",
      field: "ridership",
      outlineWidth: 4,
    }, "2026-05-23T00:00:00.000Z");
    expect(routeUpdate.style["line-width"]).toBe(4);
    expectLegendParity(routeLayer, routeUpdate);
  });

  it("emits warnings for poor classification and missing uncertainty metadata", () => {
    const layer = {
      ...projectedPolygonLayer(),
      sourceData: {
        ...fcPolygonsProjected.featureCollection,
        features: fcPolygonsProjected.featureCollection.features.map((feature, index) => ({
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            area_m2: index === fcPolygonsProjected.featureCollection.features.length - 1 ? 50_000 : index + 1,
          },
        })),
      },
    } satisfies OverlayLayerConfig;
    const review = generateMapCartographyReview([layer], {
      now: new Date("2026-05-23T00:00:00.000Z"),
    });

    expect(review.recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "classification-method", severity: "warning" }),
      expect.objectContaining({ type: "uncertainty-metadata", severity: "warning" }),
    ]));
  });

  it("serializes label rules into the same map legend and report contract", () => {
    const layer = pointLayer();
    const update = buildLayerStyleUpdate(layer, {
      ...getDefaultLayerStyleOptions(layer),
      mode: "single",
      labelsEnabled: true,
      labelField: "name",
      labelCollisionPolicy: "hide-on-overlap",
      labelPlacement: "above",
      labelMinZoom: 11,
      labelMaxZoom: 15,
    }, "2026-05-23T00:00:00.000Z");
    const styledLayer: OverlayLayerConfig = {
      ...layer,
      opacity: update.opacity,
      style: update.style,
      metadata: {
        ...(layer.metadata ?? {}),
        ...update.metadataPatch,
      },
    };

    const labelSpec = getSerializedMapLabelSpecFromStyle(styledLayer.style);
    expect(labelSpec?.field).toBe("name");
    expect(labelSpec?.collisionPolicy).toBe("hide-on-overlap");
    expect(isLabelVisibleAtZoom(labelSpec!, 10)).toBe(false);
    expect(isLabelVisibleAtZoom(labelSpec!, 12)).toBe(true);

    const fragments = buildMapLibreLabelFragments(labelSpec!);
    expect(fragments.layout["text-allow-overlap"]).toBe(false);
    expect(fragments.minzoom).toBe(11);
    expect(fragments.maxzoom).toBe(15);

    const compositionItems = serializedLegendSpecToCompositionItems(update.legendSpec);
    expect(compositionItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "label", label: "Labels: name" }),
    ]));
    expect(buildMapCompositionLegendItems([styledLayer])).toEqual(compositionItems);

    const reportDraft = buildMapReportHandoffDraft({
      overlayLayers: [styledLayer],
      viewport,
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
      baseLayerName: "Charcoal street atlas",
      createdAt: "2026-05-23T00:00:00.000Z",
    });
    expect(reportDraft.evidenceBlock.payload.composition.layerStack[0]?.labeling).toEqual({
      field: "name",
      collisionPolicy: "hide-on-overlap",
      scaleRange: { minZoom: 11, maxZoom: 15 },
    });
    expect(reportDraft.snapshot.legendItems).toEqual(compositionItems);
  });

  it("culls overlapping labels and honours priority by field", () => {
    const result = cullOverlappingLabelCandidates([
      { id: "low", text: "low priority", x: 10, y: 10, width: 48, height: 14, priority: 1 },
      { id: "high", text: "high priority", x: 12, y: 11, width: 48, height: 14, priority: 9 },
      { id: "far", text: "far label", x: 120, y: 10, width: 48, height: 14, priority: 2 },
    ], "priority-by-field");

    expect(result.visible.map((candidate) => candidate.id)).toEqual(["high", "far"]);
    expect(result.hidden.map((candidate) => candidate.id)).toEqual(["low"]);
  });

  it("serializes a bivariate choropleth as a 2 by 2 legend for map, report, and export", () => {
    const layer = advancedPolygonLayer();
    const update = buildLayerStyleUpdate(layer, {
      ...getDefaultLayerStyleOptions(layer),
      mode: "bivariate-choropleth",
      field: "area_m2",
      secondaryField: "risk_score",
      classCount: 4,
    }, "2026-05-29T00:00:00.000Z");
    const styledLayer: OverlayLayerConfig = {
      ...layer,
      opacity: update.opacity,
      style: update.style,
      metadata: {
        ...(layer.metadata ?? {}),
        ...update.metadataPatch,
      },
    };

    const cells = update.legendSpec.entries.filter((entry) => entry.kind === "bivariate" && !entry.noData);
    const mapLegend = buildMapCompositionLegendItems([styledLayer]);
    const reportDraft = buildMapReportHandoffDraft({
      overlayLayers: [styledLayer],
      viewport,
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
      baseLayerName: "Charcoal street atlas",
      createdAt: "2026-05-29T00:00:00.000Z",
    });

    expect(cells).toHaveLength(4);
    expect(new Set(cells.map((entry) => `${entry.gridColumn}:${entry.gridRow}`))).toEqual(new Set(["1:1", "1:2", "2:1", "2:2"]));
    expect(update.legendSpec.advancedCartography?.mode).toBe("bivariate-choropleth");
    expect(mapLegend.filter((entry) => entry.kind === "bivariate")).toHaveLength(4);
    expect(reportDraft.snapshot.legendItems.filter((entry) => entry.kind === "bivariate")).toHaveLength(4);
    expect(reportDraft.evidenceBlock.payload.composition.legendItems).toEqual(mapLegend);
  });

  it("emits dot-density normalization caveats through advisor and report evidence", () => {
    const layer = advancedPolygonLayer();
    const update = buildLayerStyleUpdate(layer, {
      ...getDefaultLayerStyleOptions(layer),
      mode: "dot-density",
      field: "population",
      dotValuePerDot: 1_000,
    }, "2026-05-29T00:00:00.000Z");
    const styledLayer: OverlayLayerConfig = {
      ...layer,
      opacity: update.opacity,
      style: update.style,
      metadata: {
        ...(layer.metadata ?? {}),
        ...update.metadataPatch,
      },
    };
    const advancedSpec = getSerializedAdvancedCartographySpecFromStyle(styledLayer.style);
    const dotFeatures = buildDotDensityFeatureCollection(styledLayer, advancedSpec!);
    const review = generateMapCartographyReview([styledLayer], {
      now: new Date("2026-05-29T00:00:00.000Z"),
    });
    const reportDraft = buildMapReportHandoffDraft({
      overlayLayers: [styledLayer],
      viewport,
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
      baseLayerName: "Charcoal street atlas",
      createdAt: "2026-05-29T00:00:00.000Z",
    });

    expect(advancedSpec?.mode).toBe("dot-density");
    expect(update.legendSpec.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "dot-density", label: "1 dot = 1,000 population" }),
    ]));
    expect(update.warnings).toContain(DOT_DENSITY_NORMALIZATION_CAVEAT);
    expect(dotFeatures.features.length).toBeGreaterThan(0);
    expect(review.recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "advanced-renderer-caveat", severity: "warning" }),
    ]));
    expect(reportDraft.evidenceBlock.payload.qa.caveats).toEqual(expect.arrayContaining([
      expect.stringContaining(DOT_DENSITY_NORMALIZATION_CAVEAT),
    ]));
  });
});
