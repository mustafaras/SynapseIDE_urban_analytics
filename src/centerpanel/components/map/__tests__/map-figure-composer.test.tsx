// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import { MapFigureComposerPanel } from "../layout/MapFigureComposerPanel";

function completeLayer(): OverlayLayerConfig {
  return {
    id: "parcels",
    name: "Policy parcels",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    qaStatus: "passed",
    style: { fillColor: "#3794ff" },
    provenance: { label: "City open data", sourceName: "City open data", attribution: "© City Open Data", license: "CC BY 4.0" },
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
    qaStatus: "passed",
    provenance: { label: "Vendor", sourceName: "Vendor", attribution: "© Vendor", license: "CC BY 4.0" },
    metadata: { geometryType: "Polygon", featureCount: 1, fields: ["value"] },
  };
}

function render(layers: OverlayLayerConfig[]): string {
  return renderToStaticMarkup(
    <MapFigureComposerPanel
      visible
      overlayLayers={layers}
      qaState={null}
      onClose={() => undefined}
    />,
  );
}

describe("MapFigureComposerPanel", () => {
  it("renders complete figure metadata and an export-ready state when gates pass", () => {
    const markup = render([completeLayer()]);
    expect(markup).toContain("Figure metadata");
    expect(markup).toContain("EPSG:4326");
    expect(markup).toContain("Export ready");
    expect(markup).not.toContain("map-figure-blockers");
    // The export button is the only disable-able control; absent when ready.
    expect(markup).not.toContain("disabled");
  });

  it("blocks export and names the cartographic gap when a visible layer lacks a CRS", () => {
    const markup = render([missingCrsLayer()]);
    expect(markup).toContain("map-figure-blockers");
    expect(markup).toContain("Coordinate reference system");
    expect(markup).toContain("Blocked");
    // The export control is disabled while blocked.
    expect(markup).toContain("disabled");
  });
});
