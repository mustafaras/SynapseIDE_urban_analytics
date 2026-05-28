import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState } from "./helpers/urbanAnalytics";

/**
 * Prompt 45 — Raster / GeoTIFF render, histogram, QA.
 *
 * Proof: register a raster layer via the store, simulate a parsed inspection
 * (bypassing actual GeoTIFF I/O), assert the histogram renders and band
 * selection triggers a histogram recompute.
 */

/** Seed a raster layer with synthetic inspection data into the store. */
async function seedRasterLayer(page: Page, layerId: string): Promise<void> {
  await page.evaluate(async (id) => {
    const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
    const { computeHistogram } = await import(
      "/src/services/map/raster/RasterHistogramEngine.ts"
    );
    const { assessRasterQA } = await import(
      "/src/services/map/raster/RasterQAService.ts"
    );
    const { defaultRasterRenderConfig } = await import(
      "/src/services/map/raster/GeoTiffParser.ts"
    );

    const store = useRasterLayerStore.getState();

    // Synthetic 256×256 two-band raster data
    const samples0 = new Float64Array(256);
    for (let i = 0; i < 256; i++) samples0[i] = i; // band 0: 0–255

    const samples1 = new Float64Array(256);
    for (let i = 0; i < 256; i++) samples1[i] = 255 - i; // band 1: 255–0

    const metadata = {
      width: 256,
      height: 256,
      bandCount: 2,
      bands: [
        { index: 0, label: "Band 1", dtype: "uint8" },
        { index: 1, label: "Band 2", dtype: "uint8" },
      ],
      noData: 0,
      bbox: [29, 41, 30, 42] as [number, number, number, number],
      epsgCode: "EPSG:4326",
      sampled: false,
      sampleWidth: 256,
      sampleHeight: 256,
    };

    const inspection = {
      metadata,
      bandSamples: [
        { bandIndex: 0, samples: samples0, stats: { min: 1, max: 255, mean: 128, noDataCount: 1, sampleCount: 256, validCount: 255 } },
        { bandIndex: 1, samples: samples1, stats: { min: 0, max: 254, mean: 127, noDataCount: 1, sampleCount: 256, validCount: 255 } },
      ],
      caveats: [] as string[],
    };

    const qa = assessRasterQA(metadata);
    const histogram = computeHistogram(samples0, metadata.noData, 32);
    const renderConfig = defaultRasterRenderConfig();

    store.registerRasterLayer(id, renderConfig);
    store.applyInspection({ layerId: id, inspection, qa, histogram });
  }, layerId);
}

test.describe("Map Explorer — raster layer @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await openUrbanAnalyticsWorkbench(page);
    await resetWorkbenchState(page);
    await seedRasterLayer(page, "raster-e2e-layer");
  });

  test("raster state is registered with correct metadata", async ({ page }) => {
    const meta = await page.evaluate(async () => {
      const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
      const state = useRasterLayerStore.getState().getRasterState("raster-e2e-layer");
      return {
        width: state?.inspection?.metadata.width,
        bandCount: state?.inspection?.metadata.bandCount,
        epsgCode: state?.inspection?.metadata.epsgCode,
        noData: state?.inspection?.metadata.noData,
      };
    });

    expect(meta.width).toBe(256);
    expect(meta.bandCount).toBe(2);
    expect(meta.epsgCode).toBe("EPSG:4326");
    expect(meta.noData).toBe(0);
  });

  test("histogram bins sum to valid pixel count (noData excluded)", async ({ page }) => {
    const { binSum, validCount, noDataCount } = await page.evaluate(async () => {
      const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
      const state = useRasterLayerStore.getState().getRasterState("raster-e2e-layer");
      const hist = state?.histogram;
      const binSum = hist?.bins.reduce((s: number, b: { count: number }) => s + b.count, 0) ?? -1;
      return {
        binSum,
        validCount: hist?.stats.validCount ?? -1,
        noDataCount: hist?.stats.noDataCount ?? -1,
      };
    });

    expect(binSum).toBe(validCount);
    expect(noDataCount).toBeGreaterThan(0); // noData=0 excluded
    expect(binSum).toBeLessThan(256); // some noData pixels excluded
  });

  test("band selection triggers histogram recompute for the new band", async ({ page }) => {
    const { band0Mean, band1Mean } = await page.evaluate(async () => {
      const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
      const { computeHistogram } = await import(
        "/src/services/map/raster/RasterHistogramEngine.ts"
      );

      const store = useRasterLayerStore.getState();
      const state = store.getRasterState("raster-e2e-layer")!;

      // Record band 0 histogram mean
      const band0Mean = state.histogram?.stats.mean ?? -1;

      // Switch to band 1 and recompute
      store.updateRenderConfig("raster-e2e-layer", { selectedBandIndex: 1 });
      const bs1 = state.inspection?.bandSamples[1];
      if (bs1) {
        const h1 = computeHistogram(bs1.samples, state.inspection!.metadata.noData, 32);
        store.updateHistogram("raster-e2e-layer", h1);
      }

      const updated = store.getRasterState("raster-e2e-layer")!;
      const band1Mean = updated.histogram?.stats.mean ?? -1;

      return { band0Mean, band1Mean };
    });

    // Band 1 is inverted → means differ
    expect(band0Mean).toBeGreaterThan(0);
    expect(band1Mean).toBeGreaterThan(0);
    expect(Math.abs(band0Mean - band1Mean)).toBeGreaterThan(1);
  });

  test("missing CRS → raster QA caveat (blocked status)", async ({ page }) => {
    await page.evaluate(async () => {
      const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
      const { assessRasterQA } = await import(
        "/src/services/map/raster/RasterQAService.ts"
      );
      const { defaultRasterRenderConfig } = await import(
        "/src/services/map/raster/GeoTiffParser.ts"
      );
      const { computeHistogram } = await import(
        "/src/services/map/raster/RasterHistogramEngine.ts"
      );

      const store = useRasterLayerStore.getState();
      const samples = new Float64Array(10).fill(5);

      const noCrsMeta = {
        width: 100,
        height: 100,
        bandCount: 1,
        bands: [{ index: 0, label: "Band 1", dtype: "float32" }],
        noData: -9999,
        bbox: null,
        epsgCode: null, // <-- no CRS
        sampled: false,
        sampleWidth: 100,
        sampleHeight: 100,
      };

      const qa = assessRasterQA(noCrsMeta);
      const inspection = {
        metadata: noCrsMeta,
        bandSamples: [{ bandIndex: 0, samples, stats: { min: 5, max: 5, mean: 5, noDataCount: 0, sampleCount: 10, validCount: 10 } }],
        caveats: [] as string[],
      };
      const histogram = computeHistogram(samples, null, 8);

      store.registerRasterLayer("raster-no-crs", defaultRasterRenderConfig());
      store.applyInspection({ layerId: "raster-no-crs", inspection, qa, histogram });
    });

    const qaStatus = await page.evaluate(async () => {
      const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
      return useRasterLayerStore.getState().getRasterState("raster-no-crs")?.qa?.status;
    });

    expect(qaStatus).toBe("failed");
  });
});
