// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as MapDataImporter from "@/services/map/MapDataImporter";
import {
  createCsvImportSession,
  MAP_GEOJSON_RENDER_FEATURE_BUDGET,
  profileSource,
} from "@/services/map/MapDataImporter";
import { MapCsvImportDialog } from "../../MapCsvImportDialog";
import { MapCatalogPanel } from "../catalog";
import { MapImportPreviewDialog } from "../MapImportPreviewDialog";
import { csvPointsRaw, fcLarge, fcMissingCrs } from "./fixtures/gisFixtures";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderCsvDialogWithRoot(
  session: ReturnType<typeof createCsvImportSession>,
  latitudeColumn: string,
  longitudeColumn: string,
): void {
  if (!host) {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  }

  act(() => {
    root!.render(
      <MapCsvImportDialog
        open
        session={session}
        latitudeColumn={latitudeColumn}
        longitudeColumn={longitudeColumn}
        onLatitudeColumnChange={vi.fn()}
        onLongitudeColumnChange={vi.fn()}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});

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
    expect(html).toContain("Geometry");
    expect(html).toContain("Memory estimate");
    expect(html).toContain("Worker Transfer");
    expect(html).toContain("Commit caveats");
  });

  it("memoizes CSV source profiling across stable render inputs", () => {
    const session = createCsvImportSession(csvPointsRaw, "fixtures.csv");
    const profileSpy = vi.spyOn(MapDataImporter, "profileCsvImportSession");

    renderCsvDialogWithRoot(session, "lat", "lon");
    expect(profileSpy).toHaveBeenCalledTimes(1);

    renderCsvDialogWithRoot(session, "lat", "lon");
    expect(profileSpy).toHaveBeenCalledTimes(1);

    renderCsvDialogWithRoot(session, "lat", "lng");
    expect(profileSpy).toHaveBeenCalledTimes(2);
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
    expect(html).toContain("Polygon");
    expect(html).toContain("Worker Transfer");
    expect(html).toContain("Commit caveats");
    expect(html).toContain("missing-crs.geojson");
  });

  it("keeps profile-only local sources blocked before commit", () => {
    const profile = profileSource({
      kind: "file-metadata",
      format: "flatgeobuf",
      sourceName: "range-source.fgb",
      sizeBytes: 1024,
    });
    const html = renderToStaticMarkup(
      <MapImportPreviewDialog
        open
        profile={profile}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(profile.canCommit).toBe(false);
    expect(html).toContain("metadata-only in this slice");
    expect(html).toContain("full commit support");
    expect(html).toContain("disabled");
  });

  it("renders one obvious Data activity import entry with grouped support", () => {
    const html = renderToStaticMarkup(
      <MapCatalogPanel
        visible
        presentation="embedded"
        activeSection="add-data"
        sourceHandles={[]}
        layers={[]}
        onClose={vi.fn()}
        onBrowseSources={vi.fn()}
        onAddDemoPack={vi.fn()}
        onRepairSource={vi.fn()}
        onReconnectSource={async () => ({ ok: false, message: "Unavailable" })}
        onAddConnection={async () => ({ ok: true, message: "Added" })}
      />,
    );

    expect(html).toContain("Local file intake");
    expect(html.match(/data-testid="catalog-browse-source"/g)).toHaveLength(1);
    expect(html).toContain("Local vector files");
    expect(html).toContain("Columnar vector");
    expect(html).toContain("External or profile-only");
    expect(html).toContain("Raster and scene-specific");
  });

  it("warns when a large source will use bounded preview mode", () => {
    const featureCollection = fcLarge(MAP_GEOJSON_RENDER_FEATURE_BUDGET + 12);
    const profile = profileSource({
      kind: "feature-collection",
      sourceName: "fcLarge.geojson",
      featureCollection,
      declaredCrs: "EPSG:4326",
    });
    const html = renderToStaticMarkup(
      <MapImportPreviewDialog
        open
        profile={profile}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(profile.rendering?.mode).toBe("preview");
    expect(profile.rendering?.previewFeatureCount).toBeLessThanOrEqual(MAP_GEOJSON_RENDER_FEATURE_BUDGET);
    expect(html).toContain("Bounded preview mode");
    expect(html).toContain("interactive render budget");
    expect(html).toContain("30,012");
  });
});
