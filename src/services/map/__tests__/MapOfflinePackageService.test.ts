import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import type {
  MapEvidenceArtifact,
  MapReproducibilityManifest,
  OverlayLayerConfig,
  ViewportState,
} from "@/centerpanel/components/map/mapTypes";
import type { SourceHandle } from "../contracts/gisContracts";
import {
  appendMapReviewEvent,
  createMapReviewSession,
} from "../MapReviewSessionService";
import {
  exportOfflineMapPackage,
  importOfflineMapPackage,
  MAP_OFFLINE_PACKAGE_INLINE_SOURCE_LIMIT_BYTES,
} from "../MapOfflinePackageService";

const createdAt = "2026-05-30T10:00:00.000Z";

function viewport(): ViewportState {
  return {
    center: [29, 41],
    zoom: 12,
    bearing: 0,
    pitch: 0,
  };
}

function crsSummary() {
  return {
    crs: "EPSG:32635",
    status: "known" as const,
    source: "explicit" as const,
    notes: [],
  };
}

function smallFeatureCollection(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      id: "parcel-1",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29, 41],
          [29.001, 41],
          [29.001, 41.001],
          [29, 41.001],
          [29, 41],
        ]],
      },
      properties: {
        name: "Offline parcel",
        population: 120,
      },
    }],
  };
}

function largeFeatureCollection(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      id: "large-1",
      geometry: {
        type: "Point",
        coordinates: [29, 41],
      },
      properties: {
        payload: "x".repeat(MAP_OFFLINE_PACKAGE_INLINE_SOURCE_LIMIT_BYTES + 64),
      },
    }],
  };
}

function reproducibilityManifest(): MapReproducibilityManifest {
  return {
    version: 1,
    manifestId: "manifest-offline-buffer-1",
    workflowId: "workflow-offline-buffer",
    status: "applied",
    createdAt,
    mapContextId: "map-context-offline",
    operation: "buffer",
    workflowKind: "buffer",
    inputLayerIds: ["small-layer"],
    sourceLayerIds: ["small-layer"],
    outputLayerIds: ["small-layer-buffer"],
    sourceLayers: [{
      layerId: "small-layer",
      role: "source",
      name: "Small parcels",
      sourceKind: "imported",
      featureCount: 1,
    }],
    outputLayers: [{
      layerId: "small-layer-buffer",
      role: "derived-output",
      name: "Buffered parcels",
      sourceKind: "derived",
      featureCount: 1,
    }],
    aoiReference: {
      source: "map-view",
      selectedLayerIds: ["small-layer"],
      selectedFeatureCount: 0,
      drawnPolygonCount: 0,
    },
    viewportBounds: [29, 41, 29.01, 41.01],
    parameters: { distanceMeters: 100 },
    crsSummary: {
      status: "known",
      sourceCrs: "EPSG:32635",
      displayCrs: "EPSG:4326",
      executionCrs: "EPSG:32635",
      executionKind: "planar",
      sourceLayerCrs: [{ layerId: "small-layer", crs: "EPSG:32635" }],
      missingLayerIds: [],
      notes: [],
    },
    qaSummary: {
      status: "passed",
      issueIds: [],
      blockerCount: 0,
      warningCount: 0,
      infoCount: 0,
      blockers: [],
      warnings: [],
      caveats: [],
    },
    expectedOutput: {
      layerName: "Buffered parcels",
      geometryClass: "Polygon",
      featureCount: 1,
      bounds: [29, 41, 29.01, 41.01],
      outputLayerGroup: "analysis",
      needsWorker: false,
      reportCompatible: true,
      dashboardCompatible: true,
      ideCompatible: true,
    },
    handoffReferences: {
      reportItemIds: [],
      dashboardBindingIds: [],
      ideArtifactIds: [],
    },
    qaIssueIds: [],
    sourceDataVersions: { "small-layer": "v1" },
    engine: "MapWorkflowService",
    engineVersion: "test",
  };
}

function sourceHandle(sourceId: string, overrides?: Partial<SourceHandle>): SourceHandle {
  return {
    sourceId,
    kind: "imported",
    storageMode: "inline-small",
    restoreStatus: "restored",
    format: "geojson",
    crsSummary: crsSummary(),
    featureCount: 1,
    sizeBytes: 512,
    schemaSummary: {
      fieldCount: 2,
      fields: [
        { name: "name", role: "attribute", type: "string" },
        { name: "population", role: "attribute", type: "number" },
      ],
      source: "explicit",
      notes: [],
    },
    license: "ODbL",
    attribution: "Planning test source",
    caveats: [],
    profiledAt: createdAt,
    ...overrides,
  };
}

function layer(
  id: string,
  sourceId: string,
  sourceData: OverlayLayerConfig["sourceData"],
  overrides?: Partial<OverlayLayerConfig>,
): OverlayLayerConfig {
  const metadata: NonNullable<OverlayLayerConfig["metadata"]> = {
    sourceId,
    sourceStorageMode: "inline-small",
    sourceRestoreStatus: "restored",
    crsSummary: crsSummary(),
    featureCount: 1,
    fields: ["name", "population"],
  };
  if (id === "small-layer") {
    metadata.reproducibilityManifest = reproducibilityManifest();
  }
  return {
    id,
    name: id,
    type: "geojson",
    visible: true,
    opacity: 0.8,
    group: "data",
    sourceKind: "imported",
    queryable: true,
    sourceData,
    style: {
      fillColor: "#38bdf8",
      labelSpec: {
        field: "name",
        enabled: true,
      },
    },
    metadata,
    ...overrides,
  };
}

function evidenceArtifact(): MapEvidenceArtifact {
  return {
    id: "map-evidence-offline-1",
    artifactId: "map-evidence-offline-1",
    kind: "layer",
    title: "Offline layer evidence",
    state: "active",
    sourceModule: "map-explorer",
    linkedLayerIds: ["small-layer"],
    sourceLayerIds: ["small-layer"],
    linkedFileIds: [],
    linkedArtifactIds: [],
    qaIssueIds: [],
    tags: [],
    provenance: {
      sourceModule: "map-explorer",
      createdAt,
      sourceLayerIds: ["small-layer"],
      layerProvenance: [],
      inputArtifactIds: [],
      parentArtifactIds: [],
      notes: [],
    },
    qa: {
      state: "passed",
      issueIds: [],
      issueCount: 0,
      blockerCount: 0,
      caveats: [],
      checkedAt: createdAt,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

describe("MapOfflinePackageService", () => {
  it("exports a zip package and re-imports small sources, styles, manifests, review, and evidence", async () => {
    const reviewSession = appendMapReviewEvent(
      createMapReviewSession({ projectId: "offline-project", createdAt }),
      {
        type: "snapshot",
        status: "recorded",
        timestamp: createdAt,
        title: "Offline package source review",
        summary: "Source state reviewed before package export.",
        layerIds: ["small-layer"],
        sourceIds: ["source-small"],
      },
    );
    const result = await exportOfflineMapPackage({
      projectId: "offline-project",
      packageId: "offline-package-test",
      createdAt,
      activeBaseLayer: "dark",
      viewport: viewport(),
      pins: [],
      drawnFeatures: [],
      overlayLayers: [
        layer("small-layer", "source-small", smallFeatureCollection(), { name: "Small parcels" }),
        layer("external-layer", "source-external", "https://example.test/wfs?layer=parcels", {
          name: "External parcels",
          sourceKind: "external",
          metadata: {
            sourceId: "source-external",
            sourceStorageMode: "external-service",
            sourceRestoreStatus: "external-reference",
            crsSummary: crsSummary(),
            featureCount: 1,
          },
        }),
        layer("large-layer", "source-large", largeFeatureCollection(), { name: "Large local parcels" }),
      ],
      sourceHandles: [
        sourceHandle("source-small"),
        sourceHandle("source-external", {
          kind: "external",
          storageMode: "external-service",
          restoreStatus: "external-reference",
          sourceRef: "https://example.test/wfs?layer=parcels",
          caveats: ["External service dependency."],
        }),
        sourceHandle("source-large", {
          storageMode: "metadata-only",
          sizeBytes: MAP_OFFLINE_PACKAGE_INLINE_SOURCE_LIMIT_BYTES + 128,
          caveats: ["Large local source."],
        }),
      ],
      reviewSession,
      mapEvidenceArtifacts: [evidenceArtifact()],
    });

    expect(result.filename).toBe("map-offline-package-offline-project-2026-05-30t10-00-00.zip");
    expect(result.byteLength).toBeGreaterThan(0);
    expect(result.packageManifest.embeddedSourceCount).toBe(1);
    expect(result.packageManifest.unavailableSourceCount).toBe(2);
    expect(result.packageManifest.manifestIds).toEqual(["manifest-offline-buffer-1"]);
    expect(result.packageManifest.evidenceArtifactIds).toEqual(["map-evidence-offline-1"]);
    expect(result.reviewEvent.title).toContain("OFFLINE-PACKAGE");

    const imported = await importOfflineMapPackage(result.bytes);
    expect(imported.embeddedLayerIds).toEqual(["small-layer"]);
    expect(imported.unavailableLayerIds).toEqual(["external-layer", "large-layer"]);
    expect(imported.reviewSession?.events.some((event) => event.title === "Offline package source review")).toBe(true);
    expect(imported.snapshot.evidenceArtifacts[0]?.artifactId).toBe("map-evidence-offline-1");

    const restoredSmall = imported.restoredLayers.find((candidate) => candidate.id === "small-layer");
    expect(restoredSmall?.sourceData).toMatchObject({ type: "FeatureCollection" });
    expect(restoredSmall?.style?.labelSpec).toEqual({ field: "name", enabled: true });
    expect(restoredSmall?.metadata?.reproducibilityManifest?.manifestId).toBe("manifest-offline-buffer-1");
    expect(restoredSmall?.metadata?.sourceRestoreStatus).toBe("restored");

    const restoredExternal = imported.restoredLayers.find((candidate) => candidate.id === "external-layer");
    expect(restoredExternal?.sourceData).toBeUndefined();
    expect(restoredExternal?.metadata?.sourceRestoreStatus).toBe("unavailable");
    expect(restoredExternal?.metadata?.persistence?.restoreState).toBe("stale-reference");
    expect(restoredExternal?.metadata?.persistence?.restoreWarnings[0]).toContain("not embedded");

    const restoredLarge = imported.restoredLayers.find((candidate) => candidate.id === "large-layer");
    expect(restoredLarge?.sourceData).toBeUndefined();
    expect(restoredLarge?.metadata?.sourceRestoreStatus).toBe("unavailable");
  });

  it("rejects incompatible package manifests", async () => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    zip.file("map-package.json", JSON.stringify({ version: 999, sources: [] }));
    zip.file("snapshot/map-project.json", JSON.stringify({}));
    const bytes = await zip.generateAsync({ type: "uint8array" });

    await expect(importOfflineMapPackage(bytes)).rejects.toThrow("not compatible");
  });
});
