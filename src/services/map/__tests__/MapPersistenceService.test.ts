import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureCollection, Geometry } from "geojson";
import type {
  DrawnFeature,
  MapEvidenceArtifact,
  MapAnnotation,
  MapBookmark,
  MapPin,
  OverlayLayerConfig,
  ViewportState,
} from "../../../centerpanel/components/map/mapTypes";
import type { MapScientificQAState } from "../MapScientificQA";
import {
  appendMapReviewEvent,
  createMapReviewSession,
} from "../MapReviewSessionService";

const localStore: Record<string, string> = {};
const persistedTables = new Map<string, FeatureCollection>();

const localStorageMock: Storage = {
  getItem: (key: string) => localStore[key] ?? null,
  setItem: (key: string, value: string) => { localStore[key] = value; },
  removeItem: (key: string) => { delete localStore[key]; },
  clear: () => {
    for (const key of Object.keys(localStore)) {
      delete localStore[key];
    }
  },
  get length() {
    return Object.keys(localStore).length;
  },
  key: (index: number) => Object.keys(localStore)[index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

function flattenCoordinates(
  coordinates: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][],
  bucket: Array<[number, number]>,
): void {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return;
  if (typeof coordinates[0] === "number") {
    bucket.push([Number(coordinates[0]), Number(coordinates[1])]);
    return;
  }

  for (const entry of coordinates as Array<
    GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][]
  >) {
    flattenCoordinates(entry as GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][], bucket);
  }
}

function geometryBounds(geometry: Geometry): [number, number, number, number] {
  const coords: Array<[number, number]> = [];

  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((child) => {
      const [minX, minY, maxX, maxY] = geometryBounds(child);
      coords.push([minX, minY], [maxX, maxY]);
    });
  } else {
    flattenCoordinates(
      (geometry as
        | GeoJSON.Point
        | GeoJSON.MultiPoint
        | GeoJSON.LineString
        | GeoJSON.MultiLineString
        | GeoJSON.Polygon
        | GeoJSON.MultiPolygon).coordinates,
      coords,
    );
  }

  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ];
}

function intersectsBounds(
  featureBounds: [number, number, number, number],
  bounds: [number, number, number, number],
): boolean {
  const [minX, minY, maxX, maxY] = featureBounds;
  const [boxMinX, boxMinY, boxMaxX, boxMaxY] = bounds;
  return !(maxX < boxMinX || maxY < boxMinY || minX > boxMaxX || minY > boxMaxY);
}

function withinBounds(
  featureBounds: [number, number, number, number],
  bounds: [number, number, number, number],
): boolean {
  const [minX, minY, maxX, maxY] = featureBounds;
  const [boxMinX, boxMinY, boxMaxX, boxMaxY] = bounds;
  return minX >= boxMinX && minY >= boxMinY && maxX <= boxMaxX && maxY <= boxMaxY;
}

function extractBoundsFromSql(sql: string): [number, number, number, number] {
  const match = sql.match(/POLYGON\(\(([^)]+)\)\)/i);
  if (!match) {
    throw new Error(`Unable to parse bounds polygon from SQL: ${sql}`);
  }

  const coords = match[1].split(",").map((entry) => {
    const [x, y] = entry.trim().split(/\s+/).map(Number);
    return [x, y] as [number, number];
  });

  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ];
}

vi.mock("@/engine/spatial-db", () => ({
  getTables: vi.fn(async () =>
    Array.from(persistedTables.entries()).map(([name, collection]) => ({
      name,
      columns: [{ name: "geometry", type: "GEOMETRY" }],
      rowCount: collection.features.length,
    })),
  ),
  loadGeoJSON: vi.fn(async (tableName: string, geojson: FeatureCollection) => {
    persistedTables.set(tableName, JSON.parse(JSON.stringify(geojson)) as FeatureCollection);
  }),
  toGeoJSON: vi.fn(async (sql: string) => {
    const tableMatch = sql.match(/FROM\s+"([^"]+)"/i);
    if (!tableMatch) {
      throw new Error(`Unable to parse table from SQL: ${sql}`);
    }

    const tableName = tableMatch[1];
    const collection = persistedTables.get(tableName) ?? { type: "FeatureCollection", features: [] };
    const bounds = extractBoundsFromSql(sql);
    const predicate = sql.includes("ST_Within") ? "within" : "intersects";

    return {
      type: "FeatureCollection",
      features: collection.features.filter((feature) => {
        if (!feature.geometry) return false;
        const featureExtent = geometryBounds(feature.geometry);
        return predicate === "within"
          ? withinBounds(featureExtent, bounds)
          : intersectsBounds(featureExtent, bounds);
      }),
    } satisfies FeatureCollection;
  }),
}));

import {
  getRestorableOverlayLayers,
  loadProjectMapState,
  MapPersistenceError,
  queryProjectFeaturesByBounds,
  saveProjectMapState,
} from "../MapPersistenceService";

function makePin(id: string, lng: number, lat: number): MapPin {
  return { id, lng, lat, label: `Pin ${id}` };
}

function makeDrawing(id: string): DrawnFeature {
  return {
    id,
    geometry: {
      type: "LineString",
      coordinates: [
        [29.0, 41.0],
        [29.1, 41.1],
      ],
    },
    properties: {
      label: `Drawing ${id}`,
      createdAt: "2026-04-10T00:00:00.000Z",
    },
  };
}

function makeViewport(): ViewportState {
  return {
    center: [29.02, 41.02],
    zoom: 11,
    bearing: 12,
    pitch: 18,
  };
}

function makeBookmark(): MapBookmark {
  return {
    id: "bookmark-a",
    name: "Downtown review",
    center: [29.04, 41.04],
    zoom: 13,
    bearing: 8,
    pitch: 22,
    layers: ["overlay-1"],
    timestamp: "2026-04-28T00:00:00.000Z",
    activeVisualization: "overlay-1",
  };
}

function makeAnnotation(): MapAnnotation {
  return {
    id: "annotation-a",
    type: "Feature",
    geometry: { type: "Point", coordinates: [29.05, 41.05] },
    properties: {
      text: "Policy note",
      fontSize: 18,
      color: "#F59E0B",
      bold: true,
      italic: false,
      rotation: 0,
      hasBackground: true,
      leaderLine: true,
      leaderTarget: [29.04, 41.04],
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
    },
  };
}

function makeOverlayLayer(): OverlayLayerConfig {
  return {
    id: "overlay-1",
    name: "Imported Parcels",
    type: "geojson",
    visible: true,
    opacity: 0.8,
    metadata: {
      featureCount: 1,
      geometryType: "Point",
    },
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.03, 41.03] },
          properties: { source: "overlay" },
        },
      ],
    },
  };
}

function makeLargeOverlayLayer(): OverlayLayerConfig {
  return {
    ...makeOverlayLayer(),
    id: "overlay-large",
    name: "Large parcels",
    metadata: {
      featureCount: 1,
      geometryType: "Polygon",
      bounds: [29, 41, 29.1, 41.1],
      datasetContext: {
        crs: "EPSG:3857",
      },
    },
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[[29, 41], [29.1, 41], [29.1, 41.1], [29, 41.1], [29, 41]]],
          },
          properties: {
            payload: "x".repeat(1_100_000),
          },
        },
      ],
    },
  };
}

function makeEvidenceArtifact(): MapEvidenceArtifact {
  return {
    id: "map-evidence-layer-overlay-1",
    artifactId: "map-evidence-layer-overlay-1",
    kind: "layer",
    title: "Imported parcels evidence",
    state: "active",
    sourceModule: "map-explorer",
    linkedLayerIds: ["overlay-1"],
    sourceLayerIds: [],
    linkedFileIds: [],
    linkedArtifactIds: [],
    qaIssueIds: ["qa-1"],
    tags: [],
    provenance: {
      sourceModule: "map-explorer",
      createdAt: "2026-05-10T08:00:00.000Z",
      sourceLayerIds: [],
      layerProvenance: [],
      inputArtifactIds: [],
      parentArtifactIds: [],
      notes: [],
    },
    qa: {
      state: "warning",
      issueIds: ["qa-1"],
      issueCount: 1,
      blockerCount: 0,
      caveats: ["CRS should be checked."],
      checkedAt: "2026-05-10T08:05:00.000Z",
    },
    createdAt: "2026-05-10T08:00:00.000Z",
    updatedAt: "2026-05-10T08:05:00.000Z",
  };
}

function makeQaState(): MapScientificQAState {
  return {
    status: "warning",
    checkedAt: "2026-05-10T08:05:00.000Z",
    issues: [
      {
        id: "qa-1",
        code: "missing-crs",
        category: "crs",
        severity: "warning",
        title: "Missing CRS metadata",
        explanation: "Layer CRS should be confirmed.",
        suggestedFix: "Add EPSG metadata.",
        layerId: "overlay-1",
      },
    ],
    layerSummaries: [],
    metadata: {
      generatedBy: "MapScientificQA",
      version: 1,
      signature: "qa-signature-1",
      visibleLayerCount: 1,
      workerLayerCount: 0,
      issueCounts: {
        info: 0,
        warning: 1,
        error: 0,
        blocker: 0,
      },
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  persistedTables.clear();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      storage: {
        estimate: vi.fn(async () => ({ usage: 200, quota: 10_000 })),
      },
    },
  });
});

describe("MapPersistenceService", () => {
  it("saves and reloads project-scoped map state", async () => {
    const saveResult = await saveProjectMapState({
      projectId: "proj_istanbul_seismic",
      activeBaseLayer: "satellite",
      viewport: makeViewport(),
      pins: [makePin("pin-a", 29.0, 41.0)],
      drawnFeatures: [makeDrawing("drawing-a")],
      overlayLayers: [makeOverlayLayer()],
    });

    expect(saveResult.persistedFeatureCount).toBe(3);
    expect(saveResult.persistedLayerCount).toBe(1);
    expect(saveResult.quota.warning).toBe(false);

    const loadResult = await loadProjectMapState("proj_istanbul_seismic");
    expect(loadResult.snapshot).not.toBeNull();
    expect(loadResult.restoredPinCount).toBe(1);
    expect(loadResult.restoredDrawingCount).toBe(1);
    expect(loadResult.restoredLayerCount).toBe(1);
    expect(loadResult.restoredFeatureCount).toBe(3);
    expect(loadResult.snapshot?.activeBaseLayer).toBe("satellite");
    expect(loadResult.snapshot?.viewport.zoom).toBe(11);

    const restoredLayers = getRestorableOverlayLayers(loadResult.snapshot!);
    expect(restoredLayers).toHaveLength(1);
    expect(restoredLayers[0].name).toBe("Imported Parcels");
    expect((restoredLayers[0].sourceData as FeatureCollection).features).toHaveLength(1);
  });

  it("keeps saved map snapshots isolated per project id", async () => {
    await saveProjectMapState({
      projectId: "proj_east",
      activeBaseLayer: "dark",
      viewport: { ...makeViewport(), center: [29, 41] },
      pins: [makePin("east-pin", 29.0, 41.0)],
      drawnFeatures: [],
      overlayLayers: [],
    });

    await saveProjectMapState({
      projectId: "proj_west",
      activeBaseLayer: "terrain",
      viewport: { ...makeViewport(), center: [28, 40] },
      pins: [makePin("west-pin", 28.0, 40.0)],
      drawnFeatures: [],
      overlayLayers: [],
    });

    const east = await loadProjectMapState("proj_east");
    const west = await loadProjectMapState("proj_west");

    expect(east.snapshot?.activeBaseLayer).toBe("dark");
    expect(east.snapshot?.pins.map((pin) => pin.id)).toEqual(["east-pin"]);
    expect(west.snapshot?.activeBaseLayer).toBe("terrain");
    expect(west.snapshot?.pins.map((pin) => pin.id)).toEqual(["west-pin"]);
    expect(east.spatialTableName).toBe("map_project_proj_east");
    expect(west.spatialTableName).toBe("map_project_proj_west");
  });

  it("normalizes stringified inline GeoJSON layers into restorable inline sources", async () => {
    const saveResult = await saveProjectMapState({
      projectId: "proj_legacy_inline",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [],
      drawnFeatures: [],
      overlayLayers: [
        {
          ...makeOverlayLayer(),
          id: "overlay-inline-string",
          sourceData: JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [29.05, 41.05] },
                properties: { source: "legacy-inline" },
              },
            ],
          }),
        },
      ],
    });

    expect(saveResult.persistedLayerCount).toBe(1);
    expect(saveResult.persistedFeatureCount).toBe(1);

    const loadResult = await loadProjectMapState("proj_legacy_inline");
    const restoredLayers = getRestorableOverlayLayers(loadResult.snapshot!);

    expect(restoredLayers).toHaveLength(1);
    expect((restoredLayers[0].sourceData as FeatureCollection).features).toHaveLength(1);
    expect(loadResult.restoredFeatureCount).toBe(1);
  });

  it("runs project-scoped spatial bounding-box queries against stored features", async () => {
    await saveProjectMapState({
      projectId: "proj_bbox",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [
        makePin("inside-pin", 29.0, 41.0),
        makePin("outside-pin", 30.0, 42.0),
      ],
      drawnFeatures: [],
      overlayLayers: [],
    });

    const result = await queryProjectFeaturesByBounds({
      projectId: "proj_bbox",
      bounds: [28.9, 40.9, 29.1, 41.1],
    });

    expect(result.rowCount).toBe(1);
    expect(result.collection.features).toHaveLength(1);
    expect(result.collection.features[0].properties).toMatchObject({
      label: "Pin inside-pin",
      __mapSourceType: "pin",
    });
  });

  it("persists Prompt 23 bookmarks and annotations in project snapshots", async () => {
    const saveResult = await saveProjectMapState({
      projectId: "proj_prompt_23",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [],
      bookmarks: [makeBookmark()],
      annotations: [makeAnnotation()],
      drawnFeatures: [],
      overlayLayers: [],
    });

    expect(saveResult.persistedFeatureCount).toBe(1);

    const loadResult = await loadProjectMapState("proj_prompt_23");
    expect(loadResult.snapshot?.bookmarks).toHaveLength(1);
    expect(loadResult.snapshot?.bookmarks[0].layers).toEqual(["overlay-1"]);
    expect(loadResult.snapshot?.annotations).toHaveLength(1);
    expect(loadResult.snapshot?.annotations[0].properties.text).toBe("Policy note");

    const queryResult = await queryProjectFeaturesByBounds({
      projectId: "proj_prompt_23",
      bounds: [29.0, 41.0, 29.1, 41.1],
    });

    expect(queryResult.collection.features).toHaveLength(1);
    expect(queryResult.collection.features[0].properties?.__mapSourceType).toBe("annotation");
  });

  it("persists snapshot reference metadata for layout, evidence, QA, and review timeline", async () => {
    const reviewSession = appendMapReviewEvent(
      createMapReviewSession({
        id: "review-session-1",
        title: "Map review session",
      }),
      {
        id: "review-event-1",
        type: "qa-event",
        title: "QA warning recorded",
        summary: "CRS warning attached to imported parcels.",
        layerIds: ["overlay-1"],
        evidenceArtifactIds: ["map-evidence-layer-overlay-1"],
        qaIssueIds: ["qa-1"],
        reportItemIds: ["report-insert-1"],
      },
    );

    const saveResult = await saveProjectMapState({
      projectId: "proj_reference_snapshot",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      layoutPreferences: {
        layerPanelWidth: 320,
        rightPanelWidth: 420,
      },
      pins: [],
      drawnFeatures: [],
      overlayLayers: [makeOverlayLayer()],
      mapEvidenceArtifacts: [makeEvidenceArtifact()],
      scientificQA: makeQaState(),
      reviewSession,
      lastContextSnapshotId: "map-context-123",
      publicationManifestIds: ["publication-manifest-1"],
      reportHandoffIds: ["report-handoff-1"],
    });

    expect(saveResult.snapshot.version).toBe(3);
    expect(saveResult.snapshot.layoutPreferences).toEqual({
      layerPanelWidth: 320,
      rightPanelWidth: 420,
    });
    expect(saveResult.snapshot.evidenceArtifacts).toHaveLength(1);
    expect(saveResult.snapshot.layerReferences[0]).toMatchObject({
      layerId: "overlay-1",
      evidenceArtifactIds: ["map-evidence-layer-overlay-1"],
      restoreState: "restored",
    });
    expect(saveResult.snapshot.qaSummary).toMatchObject({
      status: "warning",
      issueCount: 1,
      signature: "qa-signature-1",
    });
    expect(saveResult.snapshot.reviewTimeline).toMatchObject({
      sessionId: "review-session-1",
      eventIds: ["review-event-1"],
      auditCategories: ["qa-run"],
      layerIds: ["overlay-1"],
      evidenceArtifactIds: ["map-evidence-layer-overlay-1"],
      qaIssueIds: ["qa-1"],
      reportItemIds: ["report-insert-1"],
    });
    expect(saveResult.snapshot.references).toMatchObject({
      contextSummaryId: "map-context-123",
      evidenceArtifactIds: ["map-evidence-layer-overlay-1"],
      publicationManifestIds: ["publication-manifest-1"],
      reportHandoffIds: ["report-handoff-1"],
    });
  });

  it("keeps oversized layer payloads out of snapshots and marks them as stale references", async () => {
    const saveResult = await saveProjectMapState({
      projectId: "proj_large_layer",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [],
      drawnFeatures: [],
      overlayLayers: [makeLargeOverlayLayer()],
    });

    expect(saveResult.persistedFeatureCount).toBe(0);
    expect(saveResult.metadataOnlyLayerCount).toBe(1);
    expect(saveResult.snapshot.overlayLayers[0]?.sourceData).toBeUndefined();
    expect(saveResult.snapshot.overlayLayers[0]?.restoreState).toBe("stale-reference");
    expect(saveResult.snapshot.references.staleLayerIds).toEqual(["overlay-large"]);

    const loadResult = await loadProjectMapState("proj_large_layer");
    expect(loadResult.restoredFeatureCount).toBe(0);
    expect(loadResult.staleLayerIds).toEqual(["overlay-large"]);

    const restoredLayers = getRestorableOverlayLayers(loadResult.snapshot!);
    expect(restoredLayers[0]?.sourceData).toBeUndefined();
    expect(restoredLayers[0]?.metadata?.persistence).toMatchObject({
      sourcePersistence: "metadata",
      restoreState: "stale-reference",
      snapshotVersion: 3,
    });
    expect(restoredLayers[0]?.metadata?.persistence?.restoreWarnings[0]).toContain("exceeded the inline snapshot limit");
  });

  it("keeps oversized inline GeoJSON strings out of snapshots before parsing them", async () => {
    const oversizedInlineGeoJson = JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [29, 41] },
        properties: { payload: "x".repeat(1_100_000) },
      }],
    });

    const saveResult = await saveProjectMapState({
      projectId: "proj_large_inline_string_layer",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [],
      drawnFeatures: [],
      overlayLayers: [{
        ...makeOverlayLayer(),
        id: "overlay-large-inline-string",
        name: "Large inline string layer",
        sourceData: oversizedInlineGeoJson,
      }],
    });

    expect(saveResult.persistedFeatureCount).toBe(0);
    expect(saveResult.metadataOnlyLayerCount).toBe(1);
    expect(saveResult.snapshot.overlayLayers[0]?.sourceData).toBeUndefined();
    expect(Object.values(localStore).join("\n")).not.toContain("x".repeat(1_000));
  });

  it("restores external URL layers as references that require reload", async () => {
    await saveProjectMapState({
      projectId: "proj_external_layer",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [],
      drawnFeatures: [],
      overlayLayers: [
        {
          ...makeOverlayLayer(),
          id: "overlay-url",
          name: "External parcels",
          sourceData: "https://example.test/parcels.geojson",
        },
      ],
    });

    const loadResult = await loadProjectMapState("proj_external_layer");
    expect(loadResult.externalSourceRefs).toEqual(["https://example.test/parcels.geojson"]);
    expect(loadResult.staleLayerIds).toEqual(["overlay-url"]);

    const restoredLayers = getRestorableOverlayLayers(loadResult.snapshot!);
    expect(restoredLayers[0]?.sourceData).toBe("https://example.test/parcels.geojson");
    expect(restoredLayers[0]?.metadata?.persistence).toMatchObject({
      sourcePersistence: "url",
      restoreState: "external-reference",
      sourceRef: "https://example.test/parcels.geojson",
    });
  });

  it("flags quota warnings before storage is full", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        storage: {
          estimate: vi.fn(async () => ({ usage: 8_500, quota: 10_000 })),
        },
      },
    });

    const result = await saveProjectMapState({
      projectId: "proj_quota_warning",
      activeBaseLayer: "dark",
      viewport: makeViewport(),
      pins: [makePin("warning-pin", 29.0, 41.0)],
      drawnFeatures: [],
      overlayLayers: [],
    });

    expect(result.quota.warning).toBe(true);
    expect(result.quota.blocked).toBe(false);
  });

  it("blocks saves when storage quota is exhausted", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        storage: {
          estimate: vi.fn(async () => ({ usage: 10_000, quota: 10_000 })),
        },
      },
    });

    await expect(
      saveProjectMapState({
        projectId: "proj_quota_blocked",
        activeBaseLayer: "dark",
        viewport: makeViewport(),
        pins: [makePin("blocked-pin", 29.0, 41.0)],
        drawnFeatures: [],
        overlayLayers: [],
      }),
    ).rejects.toThrow(MapPersistenceError);
  });

  it("returns a clear persistence error when browser storage is unavailable", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: undefined,
    });

    try {
      await expect(
        saveProjectMapState({
          projectId: "proj_no_storage",
          activeBaseLayer: "dark",
          viewport: makeViewport(),
          pins: [],
          drawnFeatures: [],
          overlayLayers: [],
        }),
      ).rejects.toThrow("Project map persistence requires browser local storage.");
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: localStorageMock,
      });
    }
  });
});
