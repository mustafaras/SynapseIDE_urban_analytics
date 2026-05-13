import { describe, expect, it } from "vitest";

import { createMapVoxCityHandoffEvidenceArtifact } from "@/centerpanel/components/map/mapEvidenceArtifacts";
import { buildMapVoxCitySyncMetadata } from "../voxCitySelectionService";

describe("VoxCity 2D/3D sync evidence", () => {
  it("labels sample handoffs and stores only reference metadata", () => {
    const sync = buildMapVoxCitySyncMetadata({
      syncId: "voxcity-sync-sample-run-1",
      createdAt: "2026-05-13T10:00:00.000Z",
      sourceView: "voxcity-3d",
      targetView: "map-2d",
      source: {
        id: "voxcity-sample-buildings",
        title: "Sample Buildings",
        kind: "sample",
        runtimeMode: "sample",
        provider: "VoxCity quick start",
        sourceRef: "sample://voxcity/buildings",
        crs: null,
        featureCount: 2,
        bbox: [0, 0, 120, 90],
        geometryAssumptions: ["Deterministic synthetic sample dataset."],
      },
      mapLayerId: null,
      outputLayerId: "building-extrusion-run-1",
      selectedBuildingIds: ["building-a"],
      buildingReferences: [{
        buildingId: "building-a",
        sourceFeatureId: "building-a",
        label: "Building A",
      }],
      scenarioId: "urban-voxcity-building-extrusion-run-1",
      linkedRunId: "run-1",
    });

    expect(sync.mapLayerId).toBe("building-extrusion-run-1");
    expect(sync.projection.mode).toBe("anchored");
    expect(sync.projection.anchor).toEqual({ longitude: 13.3777, latitude: 52.5163 });
    expect(sync.qa.sampleData).toBe(true);
    expect(sync.qa.state).toBe("warning");
    expect(sync.caveats.some((entry) => entry.includes("Sample/demo source"))).toBe(true);

    const artifact = createMapVoxCityHandoffEvidenceArtifact({ voxCitySync: sync });

    expect(artifact.kind).toBe("voxcity-handoff");
    expect(artifact.derivedLayerId).toBe("building-extrusion-run-1");
    expect(artifact.sourceLayerIds).toEqual([]);
    expect(artifact.metadata?.sampleData).toBe(true);
    expect(artifact.voxCitySync?.buildingReferences).toHaveLength(1);
    expect(Object.prototype.hasOwnProperty.call(artifact, "sourceData")).toBe(false);
    expect(JSON.stringify(artifact)).not.toContain("FeatureCollection");
    expect(JSON.stringify(artifact)).not.toContain("meshPayload");
    expect(JSON.stringify(artifact)).not.toContain("voxelGrid");
  });

  it("keeps real map-layer handoffs linked to source and output layers", () => {
    const sync = buildMapVoxCitySyncMetadata({
      createdAt: "2026-05-13T11:00:00.000Z",
      sourceView: "map-2d",
      targetView: "voxcity-3d",
      source: {
        id: "buildings-layer",
        title: "Project Buildings",
        kind: "map-layer",
        runtimeMode: "real",
        provider: "Map Explorer",
        sourceRef: "Project building footprints",
        sourceLayerId: "buildings-layer",
        crs: "EPSG:4326",
        featureCount: 42,
        bbox: [28.9, 40.9, 29.2, 41.2],
        geometryAssumptions: ["Polygon footprints are ingested as 2D building references."],
      },
      mapLayerId: "buildings-layer",
      outputLayerId: "sunlight-simulation-run-2",
      selectedFeatureIds: ["b-7", "b-7", "b-8"],
      selectedBuildingIds: ["b-7"],
      buildingReferences: [{ buildingId: "b-7", sourceFeatureId: "b-7" }],
      scenarioId: "urban-voxcity-sunlight-run-2",
      linkedRunId: "run-2",
    });

    const artifact = createMapVoxCityHandoffEvidenceArtifact({ voxCitySync: sync });

    expect(sync.projection.mode).toBe("passthrough");
    expect(sync.selectedFeatureIds).toEqual(["b-7", "b-8"]);
    expect(sync.qa.sampleData).toBe(false);
    expect(artifact.sourceLayerIds).toEqual(["buildings-layer"]);
    expect(artifact.linkedLayerIds).toEqual(["buildings-layer", "sunlight-simulation-run-2"]);
    expect(artifact.metadata?.projectionSourceCrs).toBe("EPSG:4326");
  });
});
