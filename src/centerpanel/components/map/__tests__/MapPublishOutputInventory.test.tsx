// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MapPublishOutputInventory } from "../publish";

describe("MapPublishOutputInventory", () => {
  it("shows the precise output type, included and excluded inventory, evidence, and caveats before action", () => {
    const markup = renderToStaticMarkup(
      <MapPublishOutputInventory
        outputType="GeoJSON FeatureCollection — vector geometry + properties"
        outputTypeNote="Raster, vector-tile, and external-service layers are excluded."
        included={[{ id: "parcels", label: "Parcels", status: "ready", detail: "Polygon · 12 features · EPSG:4326" }]}
        excluded={[{ id: "basemap-raster", label: "Basemap raster", status: "caveat", detail: "raster layer — not vector-exportable." }]}
        bounds="29, 41, 29.1, 41.1"
        boundsStatus="ready"
        evidenceIds={["map-evidence-1", "map-evidence-2"]}
        caveats={["Parcels: CRS is user-declared (caveat)."]}
      />,
    );

    expect(markup).toContain("Output inventory");
    expect(markup).toContain("GeoJSON FeatureCollection");
    expect(markup).toContain("Raster, vector-tile, and external-service layers are excluded.");
    expect(markup).toContain("Included in output (1)");
    expect(markup).toContain("Excluded from output (1)");
    expect(markup).toContain("Parcels");
    expect(markup).toContain("Basemap raster");
    expect(markup).toContain("map-evidence-1");
    expect(markup).toContain("CRS / QA / provenance caveats");
    expect(markup).toContain("user-declared");
    // Ready/review summary, no blocked reason when no disabledReason is supplied.
    expect(markup).not.toContain("Export blocked:");
  });

  it("names the blocking reason and source restore state when the package path is blocked and references sources", () => {
    const markup = renderToStaticMarkup(
      <MapPublishOutputInventory
        outputType="Offline package (.zip)"
        included={[]}
        excluded={[{ id: "ext", label: "WMS basemap", status: "caveat", detail: "external — not recoverable." }]}
        sourceRestore={[{ id: "src-ext", label: "src-ext", status: "blocked", detail: "external-service · unavailable" }]}
        bounds="not captured"
        evidenceIds={[]}
        caveats={["Referenced sources require the original service on restore."]}
        disabledReason="Add visible layers or marks before exporting an offline package."
        includedLabel="Embedded in package"
        excludedLabel="Referenced only (not embedded)"
        emptyIncludedLabel="No inline sources qualify for embedding; all sources are referenced."
      />,
    );

    expect(markup).toContain("Embedded in package (0)");
    expect(markup).toContain("No inline sources qualify for embedding");
    expect(markup).toContain("Referenced only (not embedded) (1)");
    expect(markup).toContain("Source handle restore state");
    expect(markup).toContain("Export blocked: Add visible layers or marks before exporting an offline package.");
    expect(markup).toContain("None attached; output relies on layer and project metadata only.");
  });
});
