import { describe, expect, it } from "vitest";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { analyseExtrusion } from "../scene3d/Map3DSceneController";
import {
  analyseSectionPlane,
  analyseViewCorridor,
  buildScene3DBuildingMasses,
  buildThreeClippingPlane,
  type Scene3DAnalysisInput,
  type SectionPlaneDefinition,
  type ViewCorridorDefinition,
} from "../scene3d/ViewCorridorSectionService";

function rectFeature(id: string, minX: number, minY: number, maxX: number, maxY: number, height: number): Feature<Polygon> {
  return {
    type: "Feature",
    id,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ]],
    },
    properties: { id, name: id, height },
  };
}

function projectedBuildings(): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: [
      rectFeature("protected-view-blocker", 40, -5, 50, 5, 22),
      rectFeature("outside-corridor", 70, 30, 80, 40, 30),
      rectFeature("below-sightline", 92, -4, 102, 4, 2),
    ],
  };
}

function analysisInput(declaredCrs: string | null): Scene3DAnalysisInput {
  const collection = projectedBuildings();
  const extrusion = analyseExtrusion(collection, { heightField: "height" });
  return {
    layerId: "projected-massing",
    declaredCrs,
    buildings: buildScene3DBuildingMasses(collection, extrusion),
    verticalDatumLabel: "EGM96 geoid height",
  };
}

const corridor: ViewCorridorDefinition = {
  label: "Protected civic view",
  origin: [0, 0, 2],
  target: [120, 0, 6],
  widthMetres: 18,
  clearanceMetres: 0,
};

const sectionPlane: SectionPlaneDefinition = {
  label: "East-west section",
  axis: "x",
  offsetM: 45,
  thicknessM: 1,
  clipEnabled: true,
};

describe("ViewCorridorSectionService", () => {
  it("detects only massing that intersects the corridor and rises above the sightline", () => {
    const result = analyseViewCorridor(analysisInput("EPSG:32635"), corridor);

    expect(result.status).toBe("ready");
    expect(result.executionCrs).toBe("EPSG:32635");
    expect(result.intrusions.map((entry) => entry.featureId)).toEqual(["protected-view-blocker"]);
    expect(result.intrusions[0]?.excessM).toBeGreaterThan(15);
  });

  it("does not report corridor intrusions without a projected execution CRS", () => {
    const result = analyseViewCorridor(analysisInput(null), corridor);

    expect(result.status).toBe("blocked");
    expect(result.executionCrs).toBeNull();
    expect(result.intrusions).toEqual([]);
    expect(result.blockedReason).toMatch(/projected source CRS|known projected CRS/i);
  });

  it("updates section-plane cuts and serializes a Three clipping plane", () => {
    const input = analysisInput("EPSG:32635");
    const first = analyseSectionPlane(input, sectionPlane);
    const second = analyseSectionPlane(input, { ...sectionPlane, offsetM: 75 });
    const threePlane = buildThreeClippingPlane(sectionPlane);

    expect(first.status).toBe("ready");
    expect(first.cutFeatureIds).toEqual(["protected-view-blocker"]);
    expect(second.cutFeatureIds).toEqual(["outside-corridor"]);
    expect(first.threePlane).toEqual({ normal: [1, 0, 0], constant: -45 });
    expect(threePlane.normal.x).toBe(1);
    expect(threePlane.constant).toBe(-45);
  });

  it("retains analyzed geometry context and carries CRS assumptions", () => {
    const input = analysisInput("EPSG:32635");
    const result = analyseSectionPlane(input, sectionPlane);

    expect(result.clipRetainsAnalyzedGeometry).toBe(true);
    expect(result.retainedContextFeatureIds).toHaveLength(input.buildings.length);
    expect(result.assumptions.join(" ")).toContain("Execution CRS: EPSG:32635");
    expect(result.crs.executionCrs).toBe("EPSG:32635");
  });
});