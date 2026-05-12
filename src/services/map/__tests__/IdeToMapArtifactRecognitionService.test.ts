// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { busTimestamp, synapseBus } from "@/services/synapseBus";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  _uninstallIdeToMapArtifactReceiverForTesting,
  classifyMapIdeArtifact,
  getLastIdeToMapArtifactEvent,
  installIdeToMapArtifactReceiver,
  isIdeToMapArtifactReceiverInstalled,
  recognizeMapIdeArtifact,
} from "../IdeToMapArtifactRecognitionService";

function resetMapStore(): void {
  useMapExplorerStore.setState({
    overlayLayers: [],
    mapEvidenceArtifacts: [],
    activeAnalysisResultLayerIds: [],
    selectedFeatureIds: {},
  });
}

function makeLayer(id: string, name: string): OverlayLayerConfig {
  return {
    id,
    name,
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
    sourceKind: "imported",
    queryable: true,
    metadata: {
      featureCount: 3,
      geometryType: "Polygon",
      datasetContext: { crs: "EPSG:3857" },
    },
  };
}

describe("IdeToMapArtifactRecognitionService", () => {
  beforeEach(() => {
    _uninstallIdeToMapArtifactReceiverForTesting();
    synapseBus._resetForTesting();
    resetMapStore();
  });

  afterEach(() => {
    _uninstallIdeToMapArtifactReceiverForTesting();
  });

  it("classifies supported IDE map references without editor buffer access", () => {
    expect(classifyMapIdeArtifact({ filePath: "outputs/context.map.json" })).toMatchObject({
      status: "recognized",
      artifactKind: "map-manifest",
      language: "json",
    });
    expect(classifyMapIdeArtifact({ filePath: "outputs/run.urban-map-manifest.json" })).toMatchObject({
      status: "recognized",
      artifactKind: "urban-map-manifest",
      language: "json",
    });
    expect(classifyMapIdeArtifact({ filePath: "data/buildings.geojson" })).toMatchObject({
      status: "recognized",
      artifactKind: "geojson-layer",
      language: "geojson",
    });
    expect(classifyMapIdeArtifact({ filePath: "data/points.csv" })).toMatchObject({ artifactKind: "csv-table" });
    expect(classifyMapIdeArtifact({ filePath: "data/grid.parquet" })).toMatchObject({ artifactKind: "parquet-table" });
    expect(classifyMapIdeArtifact({ filePath: "data/city.gpkg" })).toMatchObject({ artifactKind: "geopackage" });
    expect(classifyMapIdeArtifact({ filePath: "scripts/prepare.py" })).toMatchObject({ artifactKind: "python-script" });
    expect(classifyMapIdeArtifact({ filePath: "queries/access.sql" })).toMatchObject({ artifactKind: "sql-query" });
  });

  it("labels invalid and unsupported files truthfully without evidence registration", () => {
    const invalid = recognizeMapIdeArtifact({ filePath: "" });
    expect(invalid.ok).toBe(false);
    expect(invalid.status).toBe("invalid");

    const unsupported = recognizeMapIdeArtifact({ filePath: "notes/readme.txt" });
    expect(unsupported.ok).toBe(false);
    expect(unsupported.status).toBe("unsupported");
    expect(useMapExplorerStore.getState().mapEvidenceArtifacts).toHaveLength(0);
  });

  it("registers a GeoJSON IDE file as a map evidence candidate and does not add a layer", () => {
    const result = recognizeMapIdeArtifact({
      filePath: "data/building_footprints.geojson",
      sourceModule: "ide",
      title: "Building footprints",
      sizeBytes: 12048,
      crs: { declaredCrs: "EPSG:4326" },
      schema: {
        geometryTypes: ["Polygon"],
        featureCount: 24,
      },
    });

    expect(result.ok).toBe(true);
    expect(result.artifactKind).toBe("geojson-layer");
    expect(result.readiness.status).toBe("needs-review");
    expect(result.readiness.canAddLayer).toBe(false);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(0);

    const artifact = useMapExplorerStore.getState().mapEvidenceArtifacts[0];
    expect(artifact?.kind).toBe("ide-code-reference");
    expect(artifact?.sourceModule).toBe("ide");
    expect(artifact?.linkedFileIds).toEqual(["data/building_footprints.geojson"]);
    expect(artifact?.metadata?.artifactKind).toBe("geojson-layer");
    expect(artifact?.metadata?.sizeBytes).toBe(12048);
    expect(artifact?.qa.state).toBe("warning");
  });

  it("marks existing map layer references ready without materializing a duplicate layer", () => {
    useMapExplorerStore.setState({ overlayLayers: [makeLayer("layer-buildings", "Buildings")] });

    const result = recognizeMapIdeArtifact({
      filePath: "data/buildings.geojson",
      relatedLayerIds: ["layer-buildings"],
      dataReference: { kind: "map-layer", layerId: "layer-buildings" },
      sourceModule: "ide",
    });

    expect(result.ok).toBe(true);
    expect(result.readiness.status).toBe("ready");
    expect(result.readiness.canActivateExistingLayer).toBe(true);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    expect(useMapExplorerStore.getState().activeAnalysisResultLayerIds).toEqual([]);

    const artifact = useMapExplorerStore.getState().mapEvidenceArtifacts[0];
    expect(artifact?.linkedLayerIds).toEqual(["layer-buildings"]);
    expect(artifact?.qa.state).toBe("passed");
  });

  it("recognizes environment-dependent and code artifacts as evidence only", () => {
    const gpkg = recognizeMapIdeArtifact({ filePath: "data/cadastre.gpkg", sourceModule: "ide" });
    expect(gpkg.ok).toBe(true);
    expect(gpkg.readiness.status).toBe("environment-dependent");
    expect(gpkg.warnings.join(" ")).toContain("direct browser import");

    const sql = recognizeMapIdeArtifact({
      filePath: "queries/service_area.sql",
      language: "sql",
      sourceModule: "ide",
      relatedArtifactIds: ["ide-artifact-sql-1"],
    });
    expect(sql.ok).toBe(true);
    expect(sql.artifactKind).toBe("sql-query");
    expect(sql.readiness.canAddLayer).toBe(false);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(0);

    const artifacts = useMapExplorerStore.getState().mapEvidenceArtifacts;
    expect(artifacts).toHaveLength(2);
    expect(artifacts[0]?.linkedArtifactIds).toContain("ide-artifact-sql-1");
  });

  it("receives IDE evidence events, registers map evidence, and ignores non-IDE sources", () => {
    expect(isIdeToMapArtifactReceiverInstalled()).toBe(false);
    expect(installIdeToMapArtifactReceiver()).toBe(true);
    expect(installIdeToMapArtifactReceiver()).toBe(false);

    synapseBus.emit("evidence.artifact.register", {
      artifactId: "ide-artifact-map-1",
      artifactType: "spatial-layer",
      sourceModule: "ide",
      source: "ide",
      title: "Candidate parcels",
      summary: "IDE registered a GeoJSON file reference for map review.",
      relatedFilePaths: ["data/parcels.geojson"],
      language: "geojson",
      artifactKind: "geojson-layer",
      requestedAt: busTimestamp(),
    });

    const event = getLastIdeToMapArtifactEvent();
    expect(event?.result.ok).toBe(true);
    expect(event?.result.artifactKind).toBe("geojson-layer");
    expect(useMapExplorerStore.getState().mapEvidenceArtifacts).toHaveLength(1);

    synapseBus.emit("evidence.artifact.register", {
      artifactId: "map-artifact-ignored",
      artifactType: "spatial-layer",
      sourceModule: "map-explorer",
      source: "map-explorer",
      title: "Map owned layer",
      requestedAt: busTimestamp(),
    });

    expect(useMapExplorerStore.getState().mapEvidenceArtifacts).toHaveLength(1);
  });
});