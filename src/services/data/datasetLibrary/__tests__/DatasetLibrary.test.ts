// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { useMapExplorerStore } from "../../../../stores/useMapExplorerStore";
import {
  buildTeachingDatasetManifest,
  buildTeachingDatasetSyllabusBrief,
  getTeachingDatasetLibrary,
  getTeachingDatasetManifestFilename,
  getTeachingDatasetSyllabusBriefFilename,
  loadTeachingDatasetIntoMapWorkspace,
  loadTeachingDatasetPackage,
  validateTeachingDatasetPackage,
} from "..";

describe("Teaching dataset library", () => {
  beforeEach(() => {
    useMapExplorerStore.setState({
      isOpen: false,
      center: [29, 41],
      zoom: 10,
      bearing: 0,
      pitch: 0,
      overlayLayers: [],
    });
  });

  it("publishes the planned city packs", () => {
    const library = getTeachingDatasetLibrary();
    expect(library.map((entry) => entry.city)).toEqual([
      "New York City",
      "London",
      "Barcelona",
      "Istanbul",
      "Singapore",
      "Melbourne",
      "Tokyo",
      "Amsterdam",
    ]);
  });

  it("validates every package and preserves complete metadata", () => {
    const library = getTeachingDatasetLibrary();

    for (const dataset of library) {
      const report = validateTeachingDatasetPackage(dataset);
      expect(report.valid).toBe(true);
      expect(dataset.source.length).toBeGreaterThan(10);
      expect(dataset.license).toBe("CC BY 4.0");
      expect(dataset.crs).toBe("EPSG:4326");
      expect(dataset.spatialExtent.bounds).toHaveLength(4);
      expect(dataset.thematicCoverage.length).toBeGreaterThanOrEqual(3);
      expect(dataset.layers).toHaveLength(3);
      expect(report.layerReports).toHaveLength(3);

      for (const layer of dataset.layers) {
        expect(layer.schemaSummary.length).toBeGreaterThan(0);
        expect(layer.featureCollection.features.length).toBeGreaterThan(0);
      }
    }
  });

  it("builds deterministic overlay layers and viewport presets for import", () => {
    const result = loadTeachingDatasetPackage("singapore");

    expect(result.dataset.city).toBe("Singapore");
    expect(result.layers.map((layer) => layer.id)).toEqual([
      "teaching-singapore-neighborhood_atlas",
      "teaching-singapore-mobility_hubs",
      "teaching-singapore-public_realm_corridors",
    ]);
    expect(result.layers[0]?.metadata?.datasetContext?.datasetCity).toBe("Singapore");
    expect(result.layers[0]?.metadata?.datasetContext?.crs).toBe("EPSG:4326");
    expect(result.viewport.zoom).toBeGreaterThan(8.5);
    expect(result.viewport.center[0]).toBeGreaterThan(103.7);
    expect(result.viewport.center[1]).toBeGreaterThan(1.2);
  });

  it("loads a teaching dataset directly into the map workspace", () => {
    const result = loadTeachingDatasetIntoMapWorkspace("london");
    const state = useMapExplorerStore.getState();

    expect(state.isOpen).toBe(true);
    expect(state.overlayLayers.map((layer) => layer.id)).toEqual(result.layers.map((layer) => layer.id));
    expect(state.overlayLayers[0]?.name).toBe("London - Neighborhood Atlas");
    expect(state.center).toEqual(result.viewport.center);
    expect(state.zoom).toBe(result.viewport.zoom);
  });

  it("builds manifest and teaching brief exports with scientific metadata", () => {
    const dataset = getTeachingDatasetLibrary().find((entry) => entry.id === "istanbul");
    expect(dataset).toBeTruthy();

    const manifest = buildTeachingDatasetManifest(dataset!);
    expect(manifest.datasetId).toBe("istanbul");
    expect(manifest.packageMetadata.totalLayerCount).toBe(3);
    expect(manifest.packageMetadata.totalFeatureCount).toBeGreaterThan(0);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.pedagogicalProfile.methodologicalCautions[0]).toMatch(/teaching fixture/i);
    expect(getTeachingDatasetManifestFilename(dataset!)).toBe("istanbul-teaching-dataset-manifest.json");

    const brief = buildTeachingDatasetSyllabusBrief(dataset!);
    expect(brief).toContain("# Istanbul Resilience Pack");
    expect(brief).toContain("## Scientific Metadata");
    expect(brief).toContain("## Methodological Cautions");
    expect(brief).toContain("Neighborhood Atlas");
    expect(getTeachingDatasetSyllabusBriefFilename(dataset!)).toBe("istanbul-teaching-dataset-brief.md");
  });
});