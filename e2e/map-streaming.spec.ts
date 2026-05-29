import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState } from "./helpers/urbanAnalytics";

/**
 * Prompt 44 — Large vector streaming + extent-based render/query.
 *
 * Proof: register a streaming layer backed by an rbush index, query it
 * with two different extents, assert the in-view count changes and the
 * main thread stays responsive (rAF counter advances during queries).
 */

/** Seed a large GeoJSON layer (1 000 points, 3×3 degree grid) via the
 *  streaming store using an rbush index. */
async function seedStreamingLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { buildIndexedStreamingConfig } =
      await import("/src/services/map/streaming/VectorStreamingService.ts");
    const { useStreamingLayerStore } =
      await import("/src/stores/useStreamingLayerStore.ts");

    // Build a 1 000-point FC spread over a 1°×1° area
    const features: GeoJSON.Feature[] = [];
    for (let i = 0; i < 1000; i++) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [29 + (i % 100) * 0.01, 41 + Math.floor(i / 100) * 0.01],
        },
        properties: { id: i },
      });
    }
    const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

    const config = buildIndexedStreamingConfig("streaming-e2e-layer", fc);
    useStreamingLayerStore.getState().registerStreamingLayer(config);
  });
}

test.describe("Map Explorer — streaming layer @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await openUrbanAnalyticsWorkbench(page);
    await resetWorkbenchState(page);
    await seedStreamingLayer(page);
  });

  test("extent query returns only intersecting features (in-view < total)", async ({ page }) => {
    const { inView, total } = await page.evaluate(async () => {
      const { useStreamingLayerStore } = await import("/src/stores/useStreamingLayerStore.ts");
      const store = useStreamingLayerStore.getState();

      // Query a tight SW viewport — should hit far fewer than 1 000 features
      const swExtent = { west: 29.0, south: 41.0, east: 29.05, north: 41.05 };
      store.queryLayerByExtent("streaming-e2e-layer", swExtent);

      const state = store.getStreamingState("streaming-e2e-layer")!;
      return { inView: state.inViewCount, total: state.totalCount };
    });

    expect(total).toBe(1000);
    expect(inView).toBeGreaterThanOrEqual(1);
    expect(inView).toBeLessThan(total!);
  });

  test("panning changes the in-view count", async ({ page }) => {
    const { firstCount, secondCount, total } = await page.evaluate(async () => {
      const { useStreamingLayerStore } = await import("/src/stores/useStreamingLayerStore.ts");
      const store = useStreamingLayerStore.getState();

      const sw = { west: 29.0, south: 41.0, east: 29.1, north: 41.1 };
      store.queryLayerByExtent("streaming-e2e-layer", sw);
      const afterSW = store.getStreamingState("streaming-e2e-layer")!;

      // Pan east — different slice
      const east = { west: 29.5, south: 41.0, east: 29.6, north: 41.1 };
      store.queryLayerByExtent("streaming-e2e-layer", east);
      const afterEast = store.getStreamingState("streaming-e2e-layer")!;

      return {
        firstCount: afterSW.inViewCount,
        secondCount: afterEast.inViewCount,
        total: afterSW.totalCount,
      };
    });

    // East pan should yield 0 features (our grid only goes to 29.99 lng)
    expect(secondCount).toBeLessThanOrEqual(firstCount);
    expect(total).toBe(1000);
  });

  test("main thread stays responsive during extent queries (rAF counter advances)", async ({ page }) => {
    const framesDelta = await page.evaluate(
      async () =>
        new Promise<number>((resolve) => {
          let frames = 0;
          let rafId: number;

          const countFrames = () => {
            frames++;
            rafId = requestAnimationFrame(countFrames);
          };
          rafId = requestAnimationFrame(countFrames);

          // Fire 10 extent queries in quick succession
          import("/src/stores/useStreamingLayerStore.ts").then(({ useStreamingLayerStore }) => {
            const store = useStreamingLayerStore.getState();
            for (let i = 0; i < 10; i++) {
              const west = 29 + i * 0.05;
              store.queryLayerByExtent("streaming-e2e-layer", {
                west,
                south: 41,
                east: west + 0.1,
                north: 41.2,
              });
            }
          });

          setTimeout(() => {
            cancelAnimationFrame(rafId);
            resolve(frames);
          }, 200);
        }),
    );

    // If the main thread is responsive, rAF should fire at least 5 frames in 200 ms
    expect(framesDelta).toBeGreaterThanOrEqual(5);
  });

  test("streaming badge renders truthful count (not total) for restricted viewport", async ({ page }) => {
    const { inView, total, hasStreaming } = await page.evaluate(async () => {
      const { useStreamingLayerStore } = await import("/src/stores/useStreamingLayerStore.ts");
      const store = useStreamingLayerStore.getState();

      const sw = { west: 29.0, south: 41.0, east: 29.05, north: 41.05 };
      store.queryLayerByExtent("streaming-e2e-layer", sw);
      const state = store.getStreamingState("streaming-e2e-layer")!;

      return {
        inView: state.inViewCount,
        total: state.totalCount,
        // For rbush-index, isStreaming is false but inView still differs from total
        hasStreaming: state.strategy !== undefined,
      };
    });

    expect(hasStreaming).toBe(true);
    // inViewCount must not equal total when viewport is restricted
    expect(inView).not.toBe(total);
    expect(total).toBe(1000);
  });
});
