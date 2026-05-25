import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig, ViewportState } from "../mapTypes";
import {
  buildLayerStyleUpdate,
  getDefaultLayerStyleOptions,
  serializedLegendSpecToCompositionItems,
} from "../inspector/style/legendContract";
import { fcPolygonsProjected } from "./fixtures/gisFixtures";
import { buildMapCompositionLegendItems } from "@/services/map/MapExportService";
import { buildMapReportHandoffDraft } from "@/services/map/MapReportHandoffService";
import { generateMapCartographyReview } from "@/services/map/MapCartographyAdvisor";

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
});
