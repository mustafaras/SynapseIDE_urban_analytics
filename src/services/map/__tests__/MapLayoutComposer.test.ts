import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  assertFigureExportable,
  buildFigureReadinessChecklist,
  buildMapFigureAttributionText,
  composeMapFigure,
  preflightMapFigure,
  summariseFigureReadiness,
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

function missingAttributionLayer(): OverlayLayerConfig {
  return {
    id: "no-attribution",
    name: "Anonymous parcels",
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
          id: "a1",
          properties: { value: 7 },
          geometry: { type: "Polygon", coordinates: [[[29, 41], [29.02, 41], [29.02, 41.02], [29, 41.02], [29, 41]]] },
        },
      ],
    },
    style: {
      fillColor: "#22c55e",
      legendEntries: [{ label: "Anonymous parcels", color: "#22c55e" }],
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 1,
      fields: ["value"],
      crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
    },
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
    expect(figure.attribution).toContain("City open data");
    expect(figure.crs).toBe("EPSG:4326");
    expect(figure.scaleBar.included).toBe(true);
    expect(figure.northArrow.included).toBe(true);
    expect(figure.visibleLayers).toHaveLength(1);
    expect(figure.visibleLayers[0]).toMatchObject({ layerId: "parcels", crs: "EPSG:4326" });
    expect(assertFigureExportable(figure).ok).toBe(true);
  });

  it("derives figure attribution text from visible-layer publication metadata", () => {
    expect(buildMapFigureAttributionText([completeLayer()])).toContain("City open data");
    expect(buildMapFigureAttributionText([missingAttributionLayer()])).toBe("");
  });

  it("blocks export and names the attribution gap when a visible layer lacks attribution metadata", () => {
    const figure = composeMapFigure({
      overlayLayers: [missingAttributionLayer()],
      now: NOW,
    });

    const preflight = preflightMapFigure(figure);
    expect(preflight.ok).toBe(false);
    expect(preflight.status).toBe("blocked");
    expect(preflight.blockers.some((gap) => gap.criterion === "attribution-license")).toBe(true);
    expect(figure.attribution).toBeNull();
    expect(preflight.blockers.find((gap) => gap.criterion === "attribution-license")?.reason).toContain("Anonymous parcels");

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

  it("records a compact-but-complete figure readiness checklist with page size and DPI context", () => {
    const figure = composeMapFigure({ overlayLayers: [completeLayer()], title: "Corridor study", now: NOW });
    const rows = buildFigureReadinessChecklist(figure, { pageSize: "A4", dpi: 300 });

    // One row per cartographic element, in a stable cartographic order.
    expect(rows.map((row) => row.id)).toEqual([
      "title",
      "page-size",
      "dpi",
      "visible-layers",
      "legend",
      "scale-bar",
      "north-arrow",
      "attribution",
      "crs",
      "qa-caveats",
    ]);
    expect(rows.every((row) => row.status !== "blocked")).toBe(true);
    expect(summariseFigureReadiness(rows)).not.toBe("blocked");
    expect(rows.find((row) => row.id === "crs")?.value).toBe("EPSG:4326");
    expect(rows.find((row) => row.id === "page-size")?.value).toBe("A4");
    expect(rows.find((row) => row.id === "attribution")?.value).toBe("included");
  });

  it("names the missing cartographic input in the readiness checklist when a gate fails", () => {
    const figure = composeMapFigure({ overlayLayers: [missingAttributionLayer()], now: NOW });
    const rows = buildFigureReadinessChecklist(figure);

    const attribution = rows.find((row) => row.id === "attribution");
    expect(attribution?.status).toBe("blocked");
    expect(attribution?.detail).toContain("Anonymous parcels");
    expect(summariseFigureReadiness(rows)).toBe("blocked");
    // The checklist omits page-size/dpi rows when no preset context is supplied.
    expect(rows.some((row) => row.id === "page-size")).toBe(false);
  });
});
