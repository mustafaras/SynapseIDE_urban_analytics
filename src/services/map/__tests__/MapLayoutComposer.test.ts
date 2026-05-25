import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  assertFigureExportable,
  composeMapFigure,
  preflightMapFigure,
} from "../layout/MapLayoutComposer";

const NOW = new Date("2026-05-25T10:00:00.000Z");

function completeLayer(): OverlayLayerConfig {
  return {
    id: "parcels",
    name: "Policy parcels",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    queryable: true,
    qaStatus: "passed",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "p1",
          properties: { value: 5 },
          geometry: { type: "Polygon", coordinates: [[[29, 41], [29.01, 41], [29.01, 41.01], [29, 41.01], [29, 41]]] },
        },
      ],
    },
    style: { fillColor: "#3794ff" },
    provenance: {
      label: "City open data",
      sourceName: "City open data",
      attribution: "© City Open Data",
      license: "CC BY 4.0",
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 1,
      fields: ["value"],
      crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      datasetContext: { crs: "EPSG:4326", source: "City open data", license: "CC BY 4.0", attribution: "© City Open Data" },
    },
  };
}

function missingCrsLayer(): OverlayLayerConfig {
  return {
    id: "no-crs",
    name: "Unreferenced parcels",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    queryable: true,
    qaStatus: "passed",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "n1",
          properties: { value: 3 },
          geometry: { type: "Polygon", coordinates: [[[10, 10], [10.01, 10], [10.01, 10.01], [10, 10.01], [10, 10]]] },
        },
      ],
    },
    style: { fillColor: "#38bdf8" },
    provenance: { label: "Vendor", sourceName: "Vendor", attribution: "© Vendor", license: "CC BY 4.0" },
    metadata: { geometryType: "Polygon", featureCount: 1, fields: ["value"] },
  };
}

describe("MapLayoutComposer", () => {
  it("produces a complete, reproducible figure spec when the cartographic gates pass", () => {
    const figure = composeMapFigure({ overlayLayers: [completeLayer()], title: "Corridor study", now: NOW });

    const preflight = preflightMapFigure(figure);
    expect(preflight.ok).toBe(true);
    expect(preflight.status).not.toBe("blocked");

    // The figure carries the same metadata as report handoff + export.
    expect(figure.title).toBe("Corridor study");
    expect(figure.createdAt).toBe(NOW.toISOString());
    expect(figure.legendItems.length).toBeGreaterThan(0);
    expect(figure.attribution).not.toBeNull();
    expect(figure.crs).toBe("EPSG:4326");
    expect(figure.scaleBar.included).toBe(true);
    expect(figure.northArrow.included).toBe(true);
    expect(figure.visibleLayers).toHaveLength(1);
    expect(figure.visibleLayers[0]).toMatchObject({ layerId: "parcels", crs: "EPSG:4326" });
    expect(assertFigureExportable(figure).ok).toBe(true);
  });

  it("blocks export and names the attribution gap when attribution text is missing", () => {
    const figure = composeMapFigure({
      overlayLayers: [completeLayer()],
      composition: { attributionText: "" },
      now: NOW,
    });

    const preflight = preflightMapFigure(figure);
    expect(preflight.ok).toBe(false);
    expect(preflight.status).toBe("blocked");
    expect(preflight.blockers.some((gap) => gap.criterion === "attribution-license")).toBe(true);
    expect(figure.attribution).toBeNull();

    const exportable = assertFigureExportable(figure);
    expect(exportable.ok).toBe(false);
    expect(exportable.blockedReason).toMatch(/attribution/i);
  });

  it("blocks export and names the CRS gap when no visible layer declares a CRS", () => {
    const figure = composeMapFigure({ overlayLayers: [missingCrsLayer()], now: NOW });

    const preflight = preflightMapFigure(figure);
    expect(preflight.ok).toBe(false);
    expect(figure.crs).toBeNull();
    const crsGap = preflight.blockers.find((gap) => gap.criterion === "crs-measurement");
    expect(crsGap).toBeDefined();
    expect(crsGap?.reason).toMatch(/coordinate reference system/i);
    expect(assertFigureExportable(figure).blockedReason).toMatch(/CRS|coordinate reference/i);
  });

  it("blocks export and names the legend gap when the legend is disabled", () => {
    const figure = composeMapFigure({
      overlayLayers: [completeLayer()],
      composition: { includeLegend: false },
      now: NOW,
    });

    const preflight = preflightMapFigure(figure);
    expect(preflight.ok).toBe(false);
    expect(preflight.blockers.some((gap) => gap.criterion === "legend")).toBe(true);
  });
});
