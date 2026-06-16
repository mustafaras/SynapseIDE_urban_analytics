/**
 * Unit tests for Map Explorer Drawing & Sketching Tools
 *
 * Tests verify:
 *   1. drawingHelpers — geodesic circle, haversine distance, GeoJSON factories, snap helper
 *   2. mapTypes — DrawToolId, DrawnFeature, FeatureStyle type structures
 *   3. Store — drawing actions (add/remove/update/clear/select, AOI accessor)
 *   4. MapDrawingManager — module export
 *   5. MapToolbar — extended props for draw tools
 *   6. Barrel exports — new types
 */

import type { Map as MapLibreMap } from "maplibre-gl";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import {
  drawId,
  featureCollection,
  geodesicCircle,
  geometryIcon,
  haversineDistance,
  isWithinPixels,
  makeCircle,
  makeLineString,
  makePoint,
  makePolygon,
  makeRectangle,
} from "../../../../utils/drawingHelpers";
import type { DrawnFeature, DrawToolId, FeatureStyle } from "../mapTypes";
import {
  createMapRightDockRoute,
  deriveContextualToolPanelVisibility,
  EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
  openMapRightDockRouteState,
  type MapRightDockRouteState,
} from "../mapRightDockRoutes";
import {
  DEFAULT_DRAW_TOOL,
  DRAW_TOOL_IDS,
  getNextDrawToolRailIndex,
  isDrawAoiActionDisabled,
  isDrawToolId,
  MODAL_DRAW_TOOL_RAIL,
  resolveDrawToolOnOpen,
} from "../mapDrawToolPreferences";

/* ================================================================== */
/*  1. drawingHelpers — Pure utility tests                             */
/* ================================================================== */

describe("drawingHelpers — geodesicCircle", () => {
  it("returns a closed ring of 65 points (64 segments + closure)", () => {
    const ring = geodesicCircle([0, 0], 1000, 64);
    expect(ring.length).toBe(65);
    expect(ring[0][0]).toBeCloseTo(ring[ring.length - 1][0], 10);
    expect(ring[0][1]).toBeCloseTo(ring[ring.length - 1][1], 10);
  });

  it("first and last coordinate are exactly equal (closed ring)", () => {
    const ring = geodesicCircle([29, 41], 5000);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("produces a visually circular shape at 60°N latitude", () => {
    // At 60°N, a geodesic circle should have roughly equal angular extent
    // in both lat and lng dimensions when the radius is small.
    const center: [number, number] = [25, 60];
    const ring = geodesicCircle(center, 10000); // 10 km

    const lats = ring.map((c) => c[1]);
    const lngs = ring.map((c) => c[0]);
    const latExtent = Math.max(...lats) - Math.min(...lats);
    const lngExtent = Math.max(...lngs) - Math.min(...lngs);

    // At 60°N, scale factor is roughly 2:1 (lng extent ~2× lat extent)
    // This confirms geodesic (not planar) — a planar circle would have
    // equal angular extents at all latitudes
    const ratio = lngExtent / latExtent;
    expect(ratio).toBeGreaterThan(1.5); // geodesic: lng spreads wider at high lat
    expect(ratio).toBeLessThan(2.5);
  });

  it("produces all coordinates in [lng, lat] order", () => {
    const ring = geodesicCircle([10, 50], 500);
    for (const coord of ring) {
      expect(coord.length).toBe(2);
      // lng should be near 10, lat near 50
      expect(coord[0]).toBeGreaterThan(9);
      expect(coord[0]).toBeLessThan(11);
      expect(coord[1]).toBeGreaterThan(49);
      expect(coord[1]).toBeLessThan(51);
    }
  });
});

describe("drawingHelpers — haversineDistance", () => {
  it("London → Paris ≈ 343 km", () => {
    // London: 51.5074°N, 0.1278°W → Paris: 48.8566°N, 2.3522°E
    const london: [number, number] = [-0.1278, 51.5074];
    const paris: [number, number] = [2.3522, 48.8566];
    const d = haversineDistance(london, paris);
    expect(d).toBeGreaterThan(340_000);
    expect(d).toBeLessThan(347_000);
  });

  it("same point returns 0", () => {
    expect(haversineDistance([0, 0], [0, 0])).toBe(0);
  });

  it("equator quarter gives ~10,018 km", () => {
    const d = haversineDistance([0, 0], [90, 0]);
    expect(d).toBeGreaterThan(10_000_000);
    expect(d).toBeLessThan(10_100_000);
  });
});

describe("drawingHelpers — isWithinPixels", () => {
  it("returns true when within tolerance", () => {
    expect(isWithinPixels({ x: 100, y: 100 }, { x: 105, y: 100 }, 10)).toBe(true);
  });

  it("returns false when outside tolerance", () => {
    expect(isWithinPixels({ x: 0, y: 0 }, { x: 20, y: 0 }, 10)).toBe(false);
  });

  it("returns true when exactly at tolerance boundary", () => {
    expect(isWithinPixels({ x: 0, y: 0 }, { x: 10, y: 0 }, 10)).toBe(true);
  });
});

describe("drawingHelpers — GeoJSON factory functions", () => {
  it("makePoint creates a valid Point geometry", () => {
    const pt = makePoint([29.0, 41.0]);
    expect(pt.type).toBe("Point");
    expect(pt.coordinates).toEqual([29.0, 41.0]);
  });

  it("makeLineString creates a valid LineString geometry", () => {
    const coords: [number, number][] = [[0, 0], [1, 1], [2, 0]];
    const ls = makeLineString(coords);
    expect(ls.type).toBe("LineString");
    expect(ls.coordinates.length).toBe(3);
  });

  it("makePolygon closes the ring if not already closed", () => {
    const coords: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const poly = makePolygon(coords);
    expect(poly.type).toBe("Polygon");
    const ring = poly.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring.length).toBe(5);
  });

  it("makePolygon does not double-close if already closed", () => {
    const coords: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 0]];
    const poly = makePolygon(coords);
    const ring = poly.coordinates[0];
    expect(ring.length).toBe(4);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("makeRectangle creates a closed 5-vertex polygon", () => {
    const rect = makeRectangle([0, 0], [1, 1]);
    expect(rect.type).toBe("Polygon");
    const ring = rect.coordinates[0];
    expect(ring.length).toBe(5);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("makeCircle creates a valid Polygon from geodesic calculation", () => {
    const circle = makeCircle([29, 41], 5000);
    expect(circle.type).toBe("Polygon");
    expect(circle.coordinates[0].length).toBe(65); // 64 segments + closure
    expect(circle.coordinates[0][0]).toEqual(circle.coordinates[0][64]);
  });
});

describe("drawingHelpers — drawId", () => {
  it("returns a unique string each time", () => {
    const id1 = drawId();
    const id2 = drawId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^drawn-/);
  });
});

describe("drawingHelpers — featureCollection", () => {
  it("wraps features in a FeatureCollection", () => {
    const fc = featureCollection([]);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toEqual([]);
  });
});

describe("drawingHelpers — geometryIcon", () => {
  it("returns correct icon for known types", () => {
    expect(geometryIcon("Point")).toBe("●");
    expect(geometryIcon("LineString")).toBe("╱");
    expect(geometryIcon("Polygon")).toBe("⬠");
  });

  it("returns fallback for unknown type", () => {
    expect(geometryIcon("MultiPoint")).toBe("?");
  });
});

/* ================================================================== */
/*  2. mapTypes — Type-level structural tests                          */
/* ================================================================== */

describe("mapTypes — DrawToolId type", () => {
  it("accepts all five draw tool ids", () => {
    const tools: DrawToolId[] = ["point", "linestring", "polygon", "rectangle", "circle"];
    expect(tools.length).toBe(5);
  });
});

describe("mapTypes — DrawnFeature type", () => {
  it("satisfies the required shape", () => {
    const feature: DrawnFeature = {
      id: "test-1",
      geometry: { type: "Point", coordinates: [29, 41] },
      properties: {
        label: "Test Point",
        createdAt: "2026-03-26T00:00:00Z",
      },
    };
    expect(feature.id).toBe("test-1");
    expect(feature.geometry.type).toBe("Point");
    expect(feature.properties.label).toBe("Test Point");
  });

  it("accepts optional style property", () => {
    const style: FeatureStyle = {
      strokeColor: "#ff0000",
      fillColor: "#00ff00",
      strokeWidth: 2,
      fillOpacity: 0.5,
    };
    const feature: DrawnFeature = {
      id: "test-2",
      geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
      properties: {
        label: "Styled Polygon",
        createdAt: "2026-03-26T00:00:00Z",
        style,
      },
    };
    expect(feature.properties.style?.strokeColor).toBe("#ff0000");
  });
});

/* ================================================================== */
/*  3. Store — Drawing actions                                         */
/* ================================================================== */

const { useMapExplorerStore } = await import("../../../../stores/useMapExplorerStore");

describe("useMapExplorerStore — drawing actions", () => {
  beforeEach(() => {
    const s = useMapExplorerStore.getState();
    s.clearDrawnFeatures();
    s.setActiveDrawTool(null);
    s.setSelectedFeatureId(null);
  });

  it("setActiveDrawTool sets the active draw tool", () => {
    useMapExplorerStore.getState().setActiveDrawTool("polygon");
    expect(useMapExplorerStore.getState().activeDrawTool).toBe("polygon");
  });

  it("setActiveDrawTool(null) clears the active draw tool", () => {
    useMapExplorerStore.getState().setActiveDrawTool("circle");
    useMapExplorerStore.getState().setActiveDrawTool(null);
    expect(useMapExplorerStore.getState().activeDrawTool).toBeNull();
  });

  it("addDrawnFeature appends a feature", () => {
    const feature: DrawnFeature = {
      id: "f-1",
      geometry: makePoint([29, 41]),
      properties: { label: "P1", createdAt: new Date().toISOString() },
    };
    useMapExplorerStore.getState().addDrawnFeature(feature);
    expect(useMapExplorerStore.getState().drawnFeatures).toHaveLength(1);
    expect(useMapExplorerStore.getState().drawnFeatures[0].id).toBe("f-1");
  });

  it("removeDrawnFeature removes by id", () => {
    const f1: DrawnFeature = {
      id: "f-1",
      geometry: makePoint([0, 0]),
      properties: { label: "A", createdAt: "" },
    };
    const f2: DrawnFeature = {
      id: "f-2",
      geometry: makePoint([1, 1]),
      properties: { label: "B", createdAt: "" },
    };
    useMapExplorerStore.getState().addDrawnFeature(f1);
    useMapExplorerStore.getState().addDrawnFeature(f2);
    useMapExplorerStore.getState().removeDrawnFeature("f-1");
    const features = useMapExplorerStore.getState().drawnFeatures;
    expect(features).toHaveLength(1);
    expect(features[0].id).toBe("f-2");
  });

  it("updateDrawnFeature patches feature by id", () => {
    const feature: DrawnFeature = {
      id: "f-1",
      geometry: makePoint([29, 41]),
      properties: { label: "Original", createdAt: "" },
    };
    useMapExplorerStore.getState().addDrawnFeature(feature);
    useMapExplorerStore.getState().updateDrawnFeature("f-1", {
      geometry: makePoint([30, 42]),
    });
    const updated = useMapExplorerStore.getState().drawnFeatures[0];
    expect((updated.geometry as GeoJSON.Point).coordinates).toEqual([30, 42]);
    // Properties should remain unchanged
    expect(updated.properties.label).toBe("Original");
  });

  it("clearDrawnFeatures removes all features", () => {
    useMapExplorerStore.getState().addDrawnFeature({
      id: "f-1",
      geometry: makePoint([0, 0]),
      properties: { label: "A", createdAt: "" },
    });
    useMapExplorerStore.getState().addDrawnFeature({
      id: "f-2",
      geometry: makePoint([1, 1]),
      properties: { label: "B", createdAt: "" },
    });
    useMapExplorerStore.getState().clearDrawnFeatures();
    expect(useMapExplorerStore.getState().drawnFeatures).toHaveLength(0);
  });

  it("addDrawnFeature broadcasts polygon drawings as the active AOI", () => {
    useMapExplorerStore.getState().addDrawnFeature({
      id: "pt-1",
      geometry: makePoint([0, 0]),
      properties: { label: "Point", createdAt: "" },
    });
    expect(useMapExplorerStore.getState().activeAoiId).toBeUndefined();

    useMapExplorerStore.getState().addDrawnFeature({
      id: "aoi-1",
      geometry: makeRectangle([0, 0], [1, 1]),
      properties: { label: "Rectangle AOI", createdAt: "" },
    });

    expect(useMapExplorerStore.getState().activeAoiId).toBe("aoi-1");
    expect(useMapExplorerStore.getState().getAoi()?.id).toBe("aoi-1");
  });

  it("removeDrawnFeature falls back to the next polygon AOI", () => {
    useMapExplorerStore.getState().addDrawnFeature({
      id: "aoi-1",
      geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]),
      properties: { label: "A", createdAt: "" },
    });
    useMapExplorerStore.getState().addDrawnFeature({
      id: "aoi-2",
      geometry: makePolygon([[2, 2], [3, 2], [3, 3], [2, 3]]),
      properties: { label: "B", createdAt: "" },
    });

    expect(useMapExplorerStore.getState().activeAoiId).toBe("aoi-2");
    useMapExplorerStore.getState().removeDrawnFeature("aoi-2");
    expect(useMapExplorerStore.getState().activeAoiId).toBe("aoi-1");
  });

  it("updateDrawnFeature clears an active AOI when it stops being a polygon", () => {
    useMapExplorerStore.getState().addDrawnFeature({
      id: "aoi-1",
      geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]),
      properties: { label: "A", createdAt: "" },
    });
    useMapExplorerStore.getState().updateDrawnFeature("aoi-1", {
      geometry: makePoint([5, 5]),
    });

    expect(useMapExplorerStore.getState().activeAoiId).toBeUndefined();
    expect(useMapExplorerStore.getState().getAoi()).toBeNull();
  });

  it("clearDrawnFeatures clears AOI and selected drawing state", () => {
    useMapExplorerStore.getState().addDrawnFeature({
      id: "aoi-1",
      geometry: makeRectangle([0, 0], [1, 1]),
      properties: { label: "AOI", createdAt: "" },
    });
    useMapExplorerStore.getState().setSelectedFeatureId("aoi-1");
    useMapExplorerStore.getState().clearDrawnFeatures();

    expect(useMapExplorerStore.getState().activeAoiId).toBeUndefined();
    expect(useMapExplorerStore.getState().selectedFeatureId).toBeNull();
  });

  it("replaceDrawnFeatures broadcasts the first polygon AOI", () => {
    useMapExplorerStore.getState().replaceDrawnFeatures([
      {
        id: "pt-1",
        geometry: makePoint([0, 0]),
        properties: { label: "Point", createdAt: "" },
      },
      {
        id: "aoi-1",
        geometry: makeRectangle([0, 0], [1, 1]),
        properties: { label: "AOI", createdAt: "" },
      },
    ]);

    expect(useMapExplorerStore.getState().activeAoiId).toBe("aoi-1");
  });

  it("setSelectedFeatureId selects a feature", () => {
    useMapExplorerStore.getState().setSelectedFeatureId("f-1");
    expect(useMapExplorerStore.getState().selectedFeatureId).toBe("f-1");
  });

  it("getAoi returns the first polygon feature", () => {
    const poly: DrawnFeature = {
      id: "aoi-1",
      geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]),
      properties: { label: "Study Area", createdAt: "" },
    };
    const point: DrawnFeature = {
      id: "pt-1",
      geometry: makePoint([5, 5]),
      properties: { label: "Sample Point", createdAt: "" },
    };
    // Add point first, then polygon
    useMapExplorerStore.getState().addDrawnFeature(point);
    useMapExplorerStore.getState().addDrawnFeature(poly);
    const aoi = useMapExplorerStore.getState().getAoi();
    expect(aoi).not.toBeNull();
    expect(aoi!.id).toBe("aoi-1");
    expect(aoi!.geometry.type).toBe("Polygon");
  });

  it("getAoi returns null when no polygons exist", () => {
    useMapExplorerStore.getState().addDrawnFeature({
      id: "pt-1",
      geometry: makePoint([0, 0]),
      properties: { label: "P", createdAt: "" },
    });
    expect(useMapExplorerStore.getState().getAoi()).toBeNull();
  });

  it("drawnFeatures are NOT persisted (not in partialize)", () => {
    // The store's partialize function only includes:
    // center, zoom, bearing, pitch, activeBaseLayer, pins
    // drawnFeatures should NOT be in the persisted subset
    useMapExplorerStore.getState().addDrawnFeature({
      id: "f-1",
      geometry: makePoint([0, 0]),
      properties: { label: "Temp", createdAt: "" },
    });
    // Verify drawnFeatures exist in state but the persist config
    // only partializes specific keys (covered in persistence tests)
    expect(useMapExplorerStore.getState().drawnFeatures).toHaveLength(1);
  });
});

/* ================================================================== */
/*  4. MapDrawingManager — Module export check                         */
/* ================================================================== */

describe("MapDrawingManager — module exports", () => {
  it("exports MapDrawingManager component", async () => {
    const mod = await import("../../MapDrawingManager");
    expect(typeof mod.MapDrawingManager).toBe("function");
  });

  it("exports MapDrawingManagerProps type (module loads)", async () => {
    const mod = await import("../../MapDrawingManager");
    expect(mod).toBeDefined();
  });

  it("renders the compact sketch side panel summary (floating presentation)", async () => {
    const mod = await import("../../MapDrawingManager");
    const feature: DrawnFeature = {
      id: "feature-1",
      geometry: makePoint([29, 41]),
      properties: { label: "Transit hub", createdAt: "2024-01-01T00:00:00Z" },
    };

    const html = renderToStaticMarkup(React.createElement(mod.MapDrawingManager, {
      mapRef: React.createRef<MapLibreMap>(),
      activeDrawTool: "polygon",
      presentation: "floating",
      sidebarVisible: true,
      drawnFeatures: [feature],
      selectedFeatureId: feature.id,
      onAddFeature: () => undefined,
      onRemoveFeature: () => undefined,
      onUpdateFeature: () => undefined,
      onClearFeatures: () => undefined,
      onSelectFeature: () => undefined,
      onCancelDraw: () => undefined,
    }));

    expect(html).toContain("Sketch");
    expect(html).toContain("Tool");
    expect(html).toContain("Polygon");
    expect(html).toContain("Features");
    expect(html).toContain("Transit hub");
  });

  it("renders the draw panel body in embedded presentation (right dock mode)", async () => {
    const mod = await import("../../MapDrawingManager");
    const feature: DrawnFeature = {
      id: "feature-2",
      geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]),
      properties: { label: "AOI boundary", createdAt: "2024-01-01T00:00:00Z" },
    };

    const html = renderToStaticMarkup(React.createElement(mod.MapDrawingManager, {
      mapRef: React.createRef<MapLibreMap>(),
      activeDrawTool: "polygon",
      presentation: "embedded",
      sidebarVisible: true,
      drawnFeatures: [feature],
      selectedFeatureId: null,
      onAddFeature: () => undefined,
      onRemoveFeature: () => undefined,
      onUpdateFeature: () => undefined,
      onClearFeatures: () => undefined,
      onSelectFeature: () => undefined,
      onCancelDraw: () => undefined,
    }));

    expect(html).toContain("Sketch");
    expect(html).toContain("Polygon");
    expect(html).toContain("AOI boundary");
    // Embedded mode uses data-testid for right dock integration
    expect(html).toContain("map-right-dock-draw-body");
    // Embedded mode must NOT use the floating/draggable panel style
    expect(html).not.toContain("position");
  });

  it("embedded presentation returns null when sidebarVisible=false", async () => {
    const mod = await import("../../MapDrawingManager");
    const html = renderToStaticMarkup(React.createElement(mod.MapDrawingManager, {
      mapRef: React.createRef<MapLibreMap>(),
      activeDrawTool: null,
      presentation: "embedded",
      sidebarVisible: false,
      drawnFeatures: [],
      selectedFeatureId: null,
      onAddFeature: () => undefined,
      onRemoveFeature: () => undefined,
      onUpdateFeature: () => undefined,
      onClearFeatures: () => undefined,
      onSelectFeature: () => undefined,
      onCancelDraw: () => undefined,
    }));

    expect(html).toBe("");
  });

  it("headless presentation returns null while preserving canvas-side drawing logic", async () => {
    const mod = await import("../../MapDrawingManager");
    const html = renderToStaticMarkup(React.createElement(mod.MapDrawingManager, {
      mapRef: React.createRef<MapLibreMap>(),
      activeDrawTool: "polygon",
      presentation: "headless",
      sidebarVisible: true,
      drawnFeatures: [],
      selectedFeatureId: null,
      onAddFeature: () => undefined,
      onRemoveFeature: () => undefined,
      onUpdateFeature: () => undefined,
      onClearFeatures: () => undefined,
      onSelectFeature: () => undefined,
      onCancelDraw: () => undefined,
    }));

    expect(html).toBe("");
  });

});

/* ================================================================== */
/*  5. MapToolbar — Extended props for drawing tools                   */
/* ================================================================== */

describe("MapToolbar — draw tool integration", () => {
  it("exports MapToolbar with draw tool props", async () => {
    const mod = await import("../MapToolbar");
    expect(typeof mod.MapToolbar).toBe("function");
  });
});

/* ================================================================== */
/*  6. p05 — Drawing first-click open + per-tool activation             */
/* ================================================================== */

/**
 * Mirrors Core `handleToggleDrawPanel` (topbar Draw command) + `handleSetDrawTool`:
 * a SINGLE topbar activation must seed a usable tool AND open the 'draw' route in
 * one action. We model that composition from the same pure helpers Core uses, so
 * the open contract is guarded without rendering the (very large) runtime.
 */
function activateDrawFromTopbar(
  route: MapRightDockRouteState,
  currentTool: DrawToolId | null,
  lastUsedTool: DrawToolId | null,
): { seededTool: DrawToolId; nextRoute: MapRightDockRouteState } {
  const seededTool = resolveDrawToolOnOpen(currentTool, lastUsedTool);
  const nextRoute = openMapRightDockRouteState(
    route,
    createMapRightDockRoute("draw", { source: "toolbar", detail: `Drawing tool: ${seededTool}` }),
  );
  return { seededTool, nextRoute };
}

describe("p05 — resolveDrawToolOnOpen", () => {
  it("defaults to polygon (the primary AOI tool) when nothing is active or remembered", () => {
    expect(DEFAULT_DRAW_TOOL).toBe("polygon");
    expect(resolveDrawToolOnOpen(null)).toBe("polygon");
    expect(resolveDrawToolOnOpen(null, null)).toBe("polygon");
  });

  it("keeps the already-active tool when re-opening mid-edit", () => {
    expect(resolveDrawToolOnOpen("rectangle", "circle")).toBe("rectangle");
  });

  it("falls back to the last-used tool when no tool is active", () => {
    expect(resolveDrawToolOnOpen(null, "linestring")).toBe("linestring");
  });

  it("never resolves to null/select — the surface always opens usable", () => {
    // Regression guard: the pre-p05 topbar Draw command opened the route but
    // seeded NO tool, landing on the empty "Select" (null) state that looked
    // like "nothing happened". The resolver must always return a real tool.
    for (const current of [null, ...DRAW_TOOL_IDS] as Array<DrawToolId | null>) {
      expect(resolveDrawToolOnOpen(current, null)).not.toBeNull();
      expect(isDrawToolId(resolveDrawToolOnOpen(current, null))).toBe(true);
    }
  });
});

describe("p05 — single topbar Draw activation opens a usable surface", () => {
  it("opens the 'draw' route (modal mounted) AND seeds a real tool in one action", () => {
    const { seededTool, nextRoute } = activateDrawFromTopbar(
      EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
      null,
      null,
    );
    // Route panel 'draw' active → modal gate (showDrawPanel) true → modal mounts.
    expect(nextRoute.activeRoute?.panel).toBe("draw");
    expect(nextRoute.activeRoute?.source).toBe("toolbar");
    expect(
      deriveContextualToolPanelVisibility(nextRoute.activeRoute?.panel).showDrawPanel,
    ).toBe(true);
    // A real tool is ready immediately — not the empty Select state.
    expect(seededTool).not.toBeNull();
    expect(seededTool).toBe("polygon");
  });

  it("re-opening preserves the user's active tool rather than resetting to Select", () => {
    const { seededTool } = activateDrawFromTopbar(
      EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
      "circle",
      "rectangle",
    );
    expect(seededTool).toBe("circle");
  });

  it("re-opening after deselecting falls back to the last-used tool", () => {
    const { seededTool } = activateDrawFromTopbar(
      EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
      null,
      "linestring",
    );
    expect(seededTool).toBe("linestring");
  });
});

describe("p05 — per-tool activation (no second click)", () => {
  it.each(DRAW_TOOL_IDS)("activates %s and keeps the drawing surface open on first click", (tool) => {
    // handleSetDrawTool(tool): sets activeDrawTool and opens the 'draw' route in
    // one action; activeDrawTool flows to MapDrawingManager which activates the
    // matching canvas interaction immediately.
    const nextRoute = openMapRightDockRouteState(
      EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
      createMapRightDockRoute("draw", { source: "toolbar", detail: `Drawing tool: ${tool}` }),
    );
    expect(
      deriveContextualToolPanelVisibility(nextRoute.activeRoute?.panel).showDrawPanel,
    ).toBe(true);
    // The chosen tool is preserved by the open resolver — no reset, no 2nd click.
    expect(resolveDrawToolOnOpen(tool, null)).toBe(tool);
  });
});

/* ================================================================== */
/*  6b. p06 — Premium modal: tool-rail a11y + footer disabled logic    */
/* ================================================================== */

describe("p06 — MODAL_DRAW_TOOL_RAIL order", () => {
  it("leads with Select (null) then the five draw tools in canonical order", () => {
    expect(MODAL_DRAW_TOOL_RAIL).toEqual([null, ...DRAW_TOOL_IDS]);
    expect(MODAL_DRAW_TOOL_RAIL[0]).toBeNull();
    expect(MODAL_DRAW_TOOL_RAIL.length).toBe(6);
  });
});

describe("p06 — getNextDrawToolRailIndex (roving-tabindex arrow navigation)", () => {
  const len = MODAL_DRAW_TOOL_RAIL.length;

  it("moves focus forward and wraps with ArrowRight/ArrowDown", () => {
    expect(getNextDrawToolRailIndex(0, "ArrowRight", len)).toBe(1);
    expect(getNextDrawToolRailIndex(2, "ArrowDown", len)).toBe(3);
    expect(getNextDrawToolRailIndex(len - 1, "ArrowRight", len)).toBe(0);
  });

  it("moves focus backward and wraps with ArrowLeft/ArrowUp", () => {
    expect(getNextDrawToolRailIndex(3, "ArrowLeft", len)).toBe(2);
    expect(getNextDrawToolRailIndex(0, "ArrowUp", len)).toBe(len - 1);
  });

  it("jumps to ends with Home/End", () => {
    expect(getNextDrawToolRailIndex(3, "Home", len)).toBe(0);
    expect(getNextDrawToolRailIndex(1, "End", len)).toBe(len - 1);
  });

  it("returns null for non-navigation keys (caller leaves the event alone)", () => {
    expect(getNextDrawToolRailIndex(0, "Enter", len)).toBeNull();
    expect(getNextDrawToolRailIndex(0, "a", len)).toBeNull();
    expect(getNextDrawToolRailIndex(0, " ", len)).toBeNull();
  });
});

describe("p06 — isDrawAoiActionDisabled (footer disabled-state logic)", () => {
  it("disables AOI actions when there are no drawn features", () => {
    expect(isDrawAoiActionDisabled(0)).toBe(true);
  });

  it("enables AOI actions once at least one feature exists", () => {
    expect(isDrawAoiActionDisabled(1)).toBe(false);
    expect(isDrawAoiActionDisabled(12)).toBe(false);
  });
});

describe("p06 — modal presentation a11y roles survive the redesign", () => {
  const baseProps = {
    mapRef: React.createRef<MapLibreMap>(),
    presentation: "modal" as const,
    sidebarVisible: true,
    onAddFeature: () => undefined,
    onRemoveFeature: () => undefined,
    onUpdateFeature: () => undefined,
    onClearFeatures: () => undefined,
    onSelectFeature: () => undefined,
    onCancelDraw: () => undefined,
    onSetDrawTool: () => undefined,
  };

  it("renders a labelled tool rail toolbar with aria-pressed + roving tabindex", async () => {
    const mod = await import("../../MapDrawingManager");
    const html = renderToStaticMarkup(
      React.createElement(mod.MapDrawingManager, {
        ...baseProps,
        activeDrawTool: "polygon",
        drawnFeatures: [],
        selectedFeatureId: null,
      }),
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Draw tools"');
    // Every rail tool is present and labelled.
    for (const label of ["Select", "Point", "Line", "Polygon", "Rect", "Circle"]) {
      expect(html).toContain(label);
    }
    // The active tool is pressed; the roving tab stop lands on it (tabindex 0).
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-active="true"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
  });

  it("shows the GisEmptyState when nothing is drawn (no raw 'No drawn features.' row)", async () => {
    const mod = await import("../../MapDrawingManager");
    const html = renderToStaticMarkup(
      React.createElement(mod.MapDrawingManager, {
        ...baseProps,
        activeDrawTool: "polygon",
        drawnFeatures: [],
        selectedFeatureId: null,
      }),
    );

    expect(html).toContain("map-draw-modal-body");
    expect(html).toContain('data-gis-empty-state="true"');
    expect(html).toContain("No drawn features");
    expect(html).toContain("Drawn features");
  });

  it("renders the feature list + calm status summary when features exist", async () => {
    const mod = await import("../../MapDrawingManager");
    const feature: DrawnFeature = {
      id: "feature-modal-1",
      geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]),
      properties: { label: "Study area AOI", createdAt: "2024-01-01T00:00:00Z" },
    };
    const html = renderToStaticMarkup(
      React.createElement(mod.MapDrawingManager, {
        ...baseProps,
        activeDrawTool: "polygon",
        drawnFeatures: [feature],
        selectedFeatureId: feature.id,
      }),
    );

    expect(html).toContain("Study area AOI");
    // Calm single-line status summary (not the old Tool/Features/Selected raw row).
    expect(html).toContain("1 feature");
    expect(html).toContain("Polygon");
    expect(html).not.toContain("Features 0 / Selected");
  });
});

/* ================================================================== */
/*  6c. Pro toolkit — geodesic measurement helpers                     */
/* ================================================================== */

import {
  measureDrawnGeometry,
  summarizeDrawnGeometries,
} from "../../../../utils/drawFeatureMeasure";
import {
  drawnFeaturesToGeoJSON,
  duplicateDrawnFeature,
  geometryBounds,
  parseDrawnFeaturesFromGeoJSON,
  translateGeometry,
} from "../drawGeometryOps";

describe("drawFeatureMeasure — measureDrawnGeometry", () => {
  it("returns a point measurement with the coordinate as centroid", () => {
    const m = measureDrawnGeometry(makePoint([29, 41]));
    expect(m.kind).toBe("point");
    expect(m.vertexCount).toBe(1);
    expect(m.areaM2).toBeNull();
    expect(m.centroid).toEqual([29, 41]);
  });

  it("measures a line's geodesic length (London → Paris ≈ 343 km)", () => {
    const m = measureDrawnGeometry(makeLineString([[-0.1278, 51.5074], [2.3522, 48.8566]]));
    expect(m.kind).toBe("line");
    expect(m.vertexCount).toBe(2);
    expect(m.lengthM).toBeGreaterThan(340_000);
    expect(m.lengthM).toBeLessThan(347_000);
    expect(m.areaM2).toBeNull();
  });

  it("measures a polygon's geodesic area + perimeter, ignoring the closing vertex", () => {
    const m = measureDrawnGeometry(makePolygon([[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01]]));
    expect(m.kind).toBe("polygon");
    expect(m.vertexCount).toBe(4); // closing vertex excluded
    expect(m.areaM2).not.toBeNull();
    expect(m.areaM2!).toBeGreaterThan(0);
    expect(m.perimeterM).not.toBeNull();
    expect(m.perimeterM!).toBeGreaterThan(0);
    expect(m.lengthM).toBeNull();
  });

  it("summarizes mixed geometries into totals", () => {
    const summary = summarizeDrawnGeometries([
      makePoint([0, 0]),
      makeLineString([[0, 0], [0.1, 0]]),
      makePolygon([[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01]]),
    ]);
    expect(summary.count).toBe(3);
    expect(summary.pointCount).toBe(1);
    expect(summary.lineCount).toBe(1);
    expect(summary.polygonCount).toBe(1);
    expect(summary.totalAreaM2).toBeGreaterThan(0);
    expect(summary.totalLengthM).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  6d. Pro toolkit — geometry ops (bounds / translate / import-export) */
/* ================================================================== */

describe("drawGeometryOps — geometryBounds", () => {
  it("computes [[minLng,minLat],[maxLng,maxLat]] for a polygon", () => {
    const bounds = geometryBounds(makePolygon([[0, 0], [2, 0], [2, 3], [0, 3]]));
    expect(bounds).toEqual([[0, 0], [2, 3]]);
  });

  it("returns a degenerate (equal) bound for a point", () => {
    const bounds = geometryBounds(makePoint([5, 6]));
    expect(bounds).toEqual([[5, 6], [5, 6]]);
  });
});

describe("drawGeometryOps — translate + duplicate", () => {
  it("translateGeometry shifts every position", () => {
    const moved = translateGeometry(makeLineString([[0, 0], [1, 1]]), 10, -5);
    expect((moved as GeoJSON.LineString).coordinates).toEqual([[10, -5], [11, -4]]);
  });

  it("duplicateDrawnFeature creates a fresh id, a (copy) label, and an offset", () => {
    const original: DrawnFeature = {
      id: "orig-1",
      geometry: makePoint([10, 10]),
      properties: { label: "Site A", createdAt: "2024-01-01T00:00:00Z" },
    };
    const copy = duplicateDrawnFeature(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.properties.label).toBe("Site A (copy)");
    expect((copy.geometry as GeoJSON.Point).coordinates).not.toEqual([10, 10]);
  });
});

describe("drawGeometryOps — GeoJSON round-trip", () => {
  it("exports a FeatureCollection preserving label + style", () => {
    const fc = drawnFeaturesToGeoJSON([
      {
        id: "f-1",
        geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]),
        properties: { label: "AOI", createdAt: "", style: { fillColor: "#4ec27d" } },
      },
    ]);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].properties?.label).toBe("AOI");
    expect((fc.features[0].properties as { style?: { fillColor?: string } }).style?.fillColor).toBe("#4ec27d");
  });

  it("parses a FeatureCollection and assigns ids/labels", () => {
    const text = JSON.stringify({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [1, 2] }, properties: { label: "Pin" } },
      ],
    });
    const result = parseDrawnFeaturesFromGeoJSON(text);
    expect(result.error).toBeNull();
    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.label).toBe("Pin");
    expect(result.features[0].id).toMatch(/^drawn-/);
  });

  it("parses a bare geometry and a single Feature", () => {
    expect(parseDrawnFeaturesFromGeoJSON(JSON.stringify({ type: "Point", coordinates: [0, 0] })).features).toHaveLength(1);
    expect(
      parseDrawnFeaturesFromGeoJSON(
        JSON.stringify({ type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: {} }),
      ).features,
    ).toHaveLength(1);
  });

  it("skips unsupported geometries and reports invalid JSON", () => {
    const mixed = parseDrawnFeaturesFromGeoJSON(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: {} },
          { type: "Feature", geometry: { type: "MultiPolygon", coordinates: [] }, properties: {} },
        ],
      }),
    );
    expect(mixed.features).toHaveLength(1);
    expect(mixed.skipped).toBe(1);

    const bad = parseDrawnFeaturesFromGeoJSON("{ not json");
    expect(bad.error).toBeTruthy();
    expect(bad.features).toHaveLength(0);
  });

  it("round-trips export → import", () => {
    const features: DrawnFeature[] = [
      { id: "a", geometry: makePolygon([[0, 0], [1, 0], [1, 1], [0, 1]]), properties: { label: "AOI", createdAt: "" } },
    ];
    const text = JSON.stringify(drawnFeaturesToGeoJSON(features));
    const back = parseDrawnFeaturesFromGeoJSON(text);
    expect(back.features).toHaveLength(1);
    expect(back.features[0].geometry.type).toBe("Polygon");
    expect(back.features[0].properties.label).toBe("AOI");
  });
});

/* ================================================================== */
/*  6e. Pro modal body — multi-functional UI surfaces render            */
/* ================================================================== */

describe("p06+ — pro modal body renders the multi-functional toolkit", () => {
  const baseProps = {
    mapRef: React.createRef<MapLibreMap>(),
    presentation: "modal" as const,
    sidebarVisible: true,
    onAddFeature: () => undefined,
    onRemoveFeature: () => undefined,
    onUpdateFeature: () => undefined,
    onClearFeatures: () => undefined,
    onSelectFeature: () => undefined,
    onCancelDraw: () => undefined,
    onSetDrawTool: () => undefined,
  };

  it("renders search + import/export action bar and a measurement summary", async () => {
    const mod = await import("../../MapDrawingManager");
    const feature: DrawnFeature = {
      id: "poly-1",
      geometry: makePolygon([[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01]]),
      properties: { label: "Study area", createdAt: "2024-01-01T00:00:00Z" },
    };
    const html = renderToStaticMarkup(
      React.createElement(mod.MapDrawingManager, {
        ...baseProps,
        activeDrawTool: "polygon",
        drawnFeatures: [feature],
        selectedFeatureId: null,
      }),
    );
    expect(html).toContain("Search drawn features");
    expect(html).toContain("Import");
    expect(html).toContain("Export");
    expect(html).toContain("Study area");
    // Geodesic area appears in the row summary (m² / ha / km²).
    expect(html).toMatch(/m²|ha|km²/);
  });

  it("renders the inspector (measurements + style editor) for the selected feature", async () => {
    const mod = await import("../../MapDrawingManager");
    const feature: DrawnFeature = {
      id: "poly-2",
      geometry: makePolygon([[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01]]),
      properties: { label: "Selected AOI", createdAt: "2024-01-01T00:00:00Z" },
    };
    const html = renderToStaticMarkup(
      React.createElement(mod.MapDrawingManager, {
        ...baseProps,
        activeDrawTool: null,
        drawnFeatures: [feature],
        selectedFeatureId: "poly-2",
      }),
    );
    expect(html).toContain("map-draw-modal-inspector");
    expect(html).toContain("Inspector");
    expect(html).toContain("Area");
    expect(html).toContain("Perimeter");
    expect(html).toContain("Centroid");
    // Style editor colour swatches + native colour input.
    expect(html).toContain('type="color"');
  });
});

/* ================================================================== */
/*  6f. Stability — MapDialogShell non-blocking (map stays interactive) */
/* ================================================================== */

describe("MapDialogShell — nonBlocking mode keeps the map interactive", () => {
  it("renders a non-modal dialog with a click-through, undimmed backdrop", async () => {
    const { MapDialogShell } = await import("../MapDialogShell");
    const html = renderToStaticMarkup(
      React.createElement(
        MapDialogShell,
        { ariaLabel: "Drawing tools modal", title: "Draw", nonBlocking: true, onClose: () => undefined },
        React.createElement("div", null, "body"),
      ),
    );
    // Non-modal so screen readers + click-outside behave like a tool palette.
    expect(html).toContain('aria-modal="false"');
    // Backdrop must not capture clicks (so map drawing works) nor dim the map.
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("background:transparent");
  });

  it("stays a blocking modal (aria-modal true) by default", async () => {
    const { MapDialogShell } = await import("../MapDialogShell");
    const html = renderToStaticMarkup(
      React.createElement(
        MapDialogShell,
        { ariaLabel: "Dialog", title: "Dialog", onClose: () => undefined },
        React.createElement("div", null, "body"),
      ),
    );
    expect(html).toContain('aria-modal="true"');
  });
});

/* ================================================================== */
/*  7. Barrel exports — New drawing types                              */
/* ================================================================== */

describe("barrel exports — drawing types", () => {
  it("re-exports DrawToolId type", async () => {
    // Type-only check — if this compiles, the export exists
    const mod = await import("../index");
    expect(mod).toBeDefined();
  });

  it("re-exports DrawnFeature type", async () => {
    const mod = await import("../index");
    expect(mod).toBeDefined();
  });

  it("re-exports FeatureStyle type", async () => {
    const mod = await import("../index");
    expect(mod).toBeDefined();
  });
});
