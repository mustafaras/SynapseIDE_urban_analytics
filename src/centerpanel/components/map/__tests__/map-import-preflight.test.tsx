// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createCsvImportSession, profileSource } from "@/services/map/MapDataImporter";
import { MapCsvImportDialog } from "../../MapCsvImportDialog";
import { MapImportPreviewDialog } from "../MapImportPreviewDialog";
import { csvPointsRaw, fcMissingCrs } from "./fixtures/gisFixtures";

describe("Map import source preflight UI", () => {
  it("renders CSV skipped-row and CRS caveats before commit", () => {
    const session = createCsvImportSession(csvPointsRaw, "fixtures.csv");
    const html = renderToStaticMarkup(
      <MapCsvImportDialog
        open
        session={session}
        latitudeColumn="lat"
        longitudeColumn="lon"
        onLatitudeColumnChange={vi.fn()}
        onLongitudeColumnChange={vi.fn()}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(html).toContain("3 skipped rows");
    expect(html).toContain("CRS unknown");
  });

  it("renders ready-source profile facts in the import preview dialog", () => {
    const profile = profileSource({
      kind: "feature-collection",
      sourceName: "missing-crs.geojson",
      featureCollection: fcMissingCrs.featureCollection,
      declaredCrs: fcMissingCrs.declaredCrs,
    });
    const html = renderToStaticMarkup(
      <MapImportPreviewDialog
        open
        profile={profile}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(html).toContain("Review Source Before Import");
    expect(html).toContain("CRS missing");
    expect(html).toContain("missing-crs.geojson");
  });
});