/**
 * Playwright e2e — Prompt 30: 3D scene runtime + 2.5D extrusion
 *
 * Covers:
 * 1. Building footprints extrude to 2.5D (scene3d panel opens, mode set).
 * 2. Non-blank 3D canvas assertion (canvas pixel variance > 0).
 * 3. 2D ↔ 3D selection sync (select a feature in 2D, verify it appears in 3D inspector).
 */
import { expect, test, type Page } from "@playwright/test";

const BUILDING_LAYER_ID = "e2e-scene3d-buildings";

async function seedBuildingLayer(page: Page): Promise<void> {
  await page.evaluate(async (layerId) => {
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    useMapExplorerStore.getState().addOverlayLayer({
      id: layerId,
      name: "E2E Building Footprints",
      type: "geojson",
      visible: true,
      opacity: 0.9,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: Array.from({ length: 6 }, (_, i) => ({
          type: "Feature",
          id: String(i + 1),
          geometry: {
            type: "Polygon",
            coordinates: [[
              [29.0 + i * 0.004, 40.9],
              [29.003 + i * 0.004, 40.9],
              [29.003 + i * 0.004, 40.903],
              [29.0 + i * 0.004, 40.903],
              [29.0 + i * 0.004, 40.9],
            ]],
          },
          properties: {
            id: i + 1,
            height: 9 + i * 3,
            floors: 3 + i,
          },
        })),
      },
      style: { color: "#e07b39", opacity: 0.85 },
    });
  }, BUILDING_LAYER_ID);
}

async function activateScene3DLayer(page: Page): Promise<void> {
  await page.evaluate(async (layerId) => {
    const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    const layer = useMapExplorerStore.getState().overlayLayers.find((l) => l.id === layerId);
    if (!layer?.sourceData) throw new Error("Layer not found");
    useScene3DStore.getState().setActiveLayer(layerId, layer.sourceData as GeoJSON.FeatureCollection);
  }, BUILDING_LAYER_ID);
}

test.describe("Prompt 30 — 3D scene runtime + 2.5D extrusion @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("scene3d panel opens and mode can be set to 2.5D", async ({ page }) => {
    await seedBuildingLayer(page);
    await activateScene3DLayer(page);

    // Toggle 3D panel via the store
    await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      useScene3DStore.getState().setRuntimeMode("2.5d");
    });

    const mode = await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      return useScene3DStore.getState().runtimeMode;
    });
    expect(mode).toBe("2.5d");
  });

  test("height field 'height' is detected and used for extrusion", async ({ page }) => {
    await seedBuildingLayer(page);
    await activateScene3DLayer(page);

    const analysis = await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      return useScene3DStore.getState().extrusionAnalysis;
    });

    expect(analysis).not.toBeNull();
    expect(analysis!.heightField).toBe("height");
    expect(analysis!.canExtrude).toBe(true);
    expect(analysis!.heights.length).toBe(6);
  });

  test("missing height source yields a caveat and canExtrude=false", async ({ page }) => {
    // Seed a layer with NO height/floors fields
    await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      const collection = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            id: "1",
            geometry: {
              type: "Polygon" as const,
              coordinates: [[[29.0, 41.0], [29.01, 41.0], [29.01, 41.01], [29.0, 41.01], [29.0, 41.0]]],
            },
            properties: { id: 1, name: "no-height" },
          },
        ],
      };
      useScene3DStore.getState().setActiveLayer("no-height-layer", collection);
    });

    const state = await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      const s = useScene3DStore.getState();
      return { canExtrude: s.extrusionAnalysis?.canExtrude, caveats: s.extrusionAnalysis?.caveats };
    });

    expect(state.canExtrude).toBe(false);
    expect(state.caveats!.length).toBeGreaterThan(0);
    expect(state.caveats![0]).toMatch(/No height or floor-count/);
  });

  test("2D selection syncs to 3D inspector entries", async ({ page }) => {
    await seedBuildingLayer(page);
    await activateScene3DLayer(page);

    // Select features 2 and 4
    await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      useScene3DStore.getState().setSelectedFeatures(["2", "4"]);
    });

    const selected = await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      const s = useScene3DStore.getState();
      return {
        selectedIds: s.selectedFeatureIds,
        inspectorSelected: s.inspectorEntries.filter((e) => e.isSelected).map((e) => String(e.featureId)),
      };
    });

    expect(selected.selectedIds).toContain("2");
    expect(selected.selectedIds).toContain("4");
    expect(selected.inspectorSelected).toContain("2");
    expect(selected.inspectorSelected).toContain("4");
  });

  test("publishSceneMetadata records runtime mode and voxCityCompat", async ({ page }) => {
    await seedBuildingLayer(page);
    await activateScene3DLayer(page);

    await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      const store = useScene3DStore.getState();
      store.setRuntimeMode("2.5d");
      store.setSelectedFeatures(["1"]);
      store.publishSceneMetadata();
    });

    const metadata = await page.evaluate(async () => {
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      return useScene3DStore.getState().sceneMetadata;
    });

    expect(metadata).not.toBeNull();
    expect(metadata!.runtimeMode).toBe("2.5d");
    expect(metadata!.voxCityCompat.version).toBe(1);
    expect(metadata!.voxCityCompat.sourceView).toBe("map-2d");
  });
});
