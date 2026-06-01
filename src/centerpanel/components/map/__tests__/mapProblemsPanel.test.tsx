// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { evaluateMapScientificQASync } from "@/services/map/MapScientificQA";
import type { OverlayLayerConfig } from "../mapTypes";
import { MapProblemsPanel, buildMapProblemsModel } from "../problems";
import { externalServiceStub, fcInvalidGeometry, fcMissingCrs } from "./fixtures/gisFixtures";

function createGeoJsonLayer(
  id: string,
  name: string,
  sourceData: GeoJSON.FeatureCollection,
  crs?: string,
): OverlayLayerConfig {
  return {
    id,
    name,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    sourceData,
    metadata: {
      featureCount: sourceData.features.length,
      geometryType: sourceData.features[0]?.geometry?.type ?? "Unknown",
      fields: ["id"],
      datasetContext: crs
        ? {
          crs,
          source: "City Open Data",
          license: "ODbL",
          updateDate: "2026-01-01",
        }
        : {
          source: "City Open Data",
          license: "ODbL",
          updateDate: "2026-01-01",
        },
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    provenance: {
      label: "City Open Data",
      license: "ODbL",
      method: "imported",
      collectedAt: "2026-01-01",
    },
  };
}

function createRiskRasterLayer(): OverlayLayerConfig {
  return {
    id: "risk-raster",
    name: "Flood risk raster",
    type: "raster-tile",
    visible: true,
    opacity: 0.82,
    sourceKind: "demo",
    metadata: {
      sourceId: "source-flood-risk-wms",
      raster: {
        version: 1,
        sourceFormat: "geotiff",
        renderMode: "sampled-image",
        width: 4096,
        height: 4096,
        bandCount: 1,
        selectedBandIndex: 0,
        noData: -9999,
        epsgCode: null,
        sampled: true,
        sampleWidth: 512,
        sampleHeight: 512,
        caveats: ["DEM vertical datum is unknown and must be verified before elevation claims."],
      },
      externalService: externalServiceStub,
      persistence: {
        snapshotVersion: 1,
        savedAt: "2026-01-01T00:00:00.000Z",
        sourcePersistence: "metadata",
        restoreState: "metadata-only",
        restoreWarnings: ["Source bytes are not bundled with the project snapshot."],
        sourceId: "source-flood-risk-wms",
      },
    },
  };
}

describe("MapProblemsPanel", () => {
  it("projects scientific QA issues into actionable problem rows", () => {
    const layers = [
      createGeoJsonLayer("missing-crs", "Missing CRS parcels", fcMissingCrs.featureCollection),
      createGeoJsonLayer("invalid-geometry", "Invalid parcels", fcInvalidGeometry, "EPSG:4326"),
    ];
    const qaState = evaluateMapScientificQASync(layers);
    const model = buildMapProblemsModel({ qaState, overlayLayers: layers });

    const crsProblem = model.rows.find((row) => row.kind === "crs-blocker");
    const geometryProblem = model.rows.find((row) => row.kind === "geometry-validity");

    expect(crsProblem?.affectedLabel).toBe("Missing CRS parcels");
    expect(crsProblem?.reason).toMatch(/CRS|projection/i);
    expect(crsProblem?.actionTarget.label).toBe("Declare CRS");
    expect(geometryProblem?.affectedLabel).toBe("Invalid parcels");
    expect(geometryProblem?.actionTarget.label).toBe("Repair geometry");
    expect(model.groups.some((group) => group.severity === "error" || group.severity === "blocker")).toBe(true);
    expect(model.groups.some((group) => group.severity === "warning")).toBe(true);
  });

  it("surfaces raster noData, vertical datum, source, provider, and demo mode caveats", () => {
    const layer = createRiskRasterLayer();
    const model = buildMapProblemsModel({ qaState: null, overlayLayers: [layer] });
    const kinds = new Set(model.rows.map((row) => row.kind));

    expect(kinds).toContain("no-data");
    expect(kinds).toContain("vertical-datum");
    expect(kinds).toContain("source-provenance");
    expect(kinds).toContain("external-provider");
    expect(kinds).toContain("runtime-mode");
    expect(model.rows.find((row) => row.kind === "runtime-mode")?.reason).toMatch(/demo|synthetic/i);
    expect(model.rows.find((row) => row.kind === "external-provider")?.severity).toBe("error");
  });

  it("renders grouped rows with severity, affected source, reason, and action target", () => {
    const layer = createRiskRasterLayer();
    const model = buildMapProblemsModel({ qaState: null, overlayLayers: [layer] });
    const markup = renderToStaticMarkup(<MapProblemsPanel model={model} />);

    expect(markup).toContain("Problems");
    expect(markup).toContain("Warning");
    expect(markup).toContain("Flood risk raster");
    expect(markup).toContain("Offline WMS");
    expect(markup).toContain("DEM vertical datum is unknown");
    expect(markup).toContain("Action target:");
  });
});