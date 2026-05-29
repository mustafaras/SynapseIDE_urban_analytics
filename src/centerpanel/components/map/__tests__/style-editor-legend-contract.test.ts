import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig, ViewportState } from "../mapTypes";
import {
  buildLayerStyleUpdate,
  getDefaultLayerStyleOptions,
  serializedLegendSpecToCompositionItems,
} from "../inspector/style/legendContract";
import { fcPointsWGS84, fcPolygonsProjected } from "./fixtures/gisFixtures";
import { buildMapCompositionLegendItems } from "@/services/map/MapExportService";
import { buildMapReportHandoffDraft } from "@/services/map/MapReportHandoffService";
import { generateMapCartographyReview } from "@/services/map/MapCartographyAdvisor";
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
});
