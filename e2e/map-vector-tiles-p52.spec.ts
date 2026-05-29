import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
  return mapExplorer;
}

test.describe("Map Explorer - vector tile pipeline @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkbenchState(page);
  });

  test("large tiled layer shows simplified caveat and uses denser geometry at higher zoom", async ({ page }) => {
    await openMapExplorer(page);

    const proof = await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const {
        buildOnTheFlyVectorTileLayerMetadata,
        buildVectorTilePipeline,
        buildVectorTileRenderFeatureCollection,
      } = await import("/src/services/map/tiling/VectorTilePipelineService.ts");

      const features: GeoJSON.Feature[] = [];
      for (let featureIndex = 0; featureIndex < 40; featureIndex += 1) {
        const baseLng = 28.55 + (featureIndex % 10) * 0.05;
        const baseLat = 40.75 + Math.floor(featureIndex / 10) * 0.05;
        const coordinates: Array<[number, number]> = [];
        for (let pointIndex = 0; pointIndex < 160; pointIndex += 1) {
          coordinates.push([
            baseLng + pointIndex * 0.0015,
            baseLat + Math.sin(pointIndex / 3) * 0.02 + Math.cos(pointIndex / 9) * 0.01,
          ]);
        }
        features.push({
          type: "Feature",
          id: `road-${featureIndex}`,
          geometry: { type: "LineString", coordinates },
          properties: { id: featureIndex, name: `Road ${featureIndex}` },
        });
      }

      const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
      const vectorTiles = buildOnTheFlyVectorTileLayerMetadata(fc, { zoomLevels: [4, 8, 12, 15] });
      useMapExplorerStore.getState().replaceOverlayLayers([]);
      useMapExplorerStore.getState().addOverlayLayer({
        id: "e2e-p52-vector-tiles",
        name: "E2E P52 tiled streets",
        type: "geojson",
        visible: true,
        opacity: 0.85,
        sourceKind: "imported",
        queryable: true,
        sourceData: fc,
        metadata: {
          geometryType: "LineString",
          featureCount: fc.features.length,
          fields: ["id", "name"],
          crsSummary: {
            crs: "EPSG:4326",
            status: "known",
            source: "explicit",
            notes: [],
          },
          vectorTiles,
        },
      });

      const pipeline = buildVectorTilePipeline(fc, { zoomLevels: [4, 8, 12, 15] });
      const lowExtent = { west: 28.5, south: 40.7, east: 29.3, north: 41.1 };
      const highExtent = { west: 28.66, south: 40.73, east: 28.69, north: 40.78 };
      const low = buildVectorTileRenderFeatureCollection(pipeline, lowExtent, 4);
      const high = buildVectorTileRenderFeatureCollection(pipeline, highExtent, 15);
      const lowSummary = pipeline.zooms.find((entry) => entry.zoom === 4)?.metadata;
      const highSummary = pipeline.zooms.find((entry) => entry.zoom === 15)?.metadata;

      return {
        lowCoordinates: lowSummary?.simplifiedCoordinateCount ?? low.coordinateCount,
        highCoordinates: highSummary?.simplifiedCoordinateCount ?? high.coordinateCount,
        lowTiles: low.tileCount,
        highTiles: high.tileCount,
      };
    });

    await expect(page.getByText("tiled (simplified)").first()).toBeVisible();
    expect(proof.lowCoordinates).toBeLessThan(proof.highCoordinates);
    expect(proof.lowTiles).toBeGreaterThan(0);
    expect(proof.highTiles).toBeGreaterThan(0);

    const canvasRegion = page.getByTestId("map-canvas-region");
    await canvasRegion.hover();
    await page.mouse.wheel(0, -450);
    await page.mouse.wheel(0, 450);
    const frames = await page.evaluate(
      () => new Promise<number>((resolve) => {
        let count = 0;
        let rafId = 0;
        const tick = () => {
          count += 1;
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        window.setTimeout(() => {
          cancelAnimationFrame(rafId);
          resolve(count);
        }, 180);
      }),
    );
    expect(frames).toBeGreaterThanOrEqual(4);
  });
});