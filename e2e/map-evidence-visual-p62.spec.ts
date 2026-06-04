/**
 * Playwright e2e — Prompt 62: raster / temporal / 3D evidence visual states.
 *
 * Proof: raster, temporal, and 3D evidence surfaces render shared state chips,
 * screenshots are captured for each surface, and raster + 3D evidence canvases
 * pass a nonblank pixel-diversity check.
 */
import { expect, test, type Page } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(
    urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }),
  );
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  const exploreButton = page
    .getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i })
    .first();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

function countUniqueByteValues(buffer: Buffer, sampleSize = 4000): number {
  const seen = new Set<number>();
  const step = Math.max(1, Math.floor(buffer.length / sampleSize));
  for (let index = 0; index < buffer.length; index += step) {
    seen.add(buffer[index]);
  }
  return seen.size;
}

async function seedPrompt62State(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    const { useRasterLayerStore } = await import("/src/stores/useRasterLayerStore.ts");
    const { useTemporalLayerStore } = await import("/src/stores/useTemporalLayerStore.ts");
    const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
    const { computeHistogram } = await import("/src/services/map/raster/RasterHistogramEngine.ts");
    const { assessRasterQA } = await import("/src/services/map/raster/RasterQAService.ts");
    const { defaultRasterRenderConfig } = await import("/src/services/map/raster/GeoTiffParser.ts");

    const rasterLayerId = "p62-raster-evidence-layer";
    const rasterSamples = new Float64Array(512);
    for (let index = 0; index < rasterSamples.length; index += 1) {
      rasterSamples[index] = index === 0 ? 0 : (index % 64) + Math.sin(index / 9) * 8;
    }
    const rasterMetadata = {
      width: 128,
      height: 64,
      bandCount: 1,
      bands: [{ index: 0, label: "Surface temperature", dtype: "float32" }],
      noData: 0,
      bbox: [29, 41, 30, 42] as [number, number, number, number],
      epsgCode: "EPSG:32635",
      sampled: true,
      sampleWidth: 128,
      sampleHeight: 64,
    };
    const rasterStore = useRasterLayerStore.getState();
    rasterStore.registerRasterLayer(rasterLayerId, defaultRasterRenderConfig());
    rasterStore.applyInspection({
      layerId: rasterLayerId,
      inspection: {
        metadata: rasterMetadata,
        bandSamples: [{
          bandIndex: 0,
          samples: rasterSamples,
          stats: computeHistogram(rasterSamples, rasterMetadata.noData, 32).stats,
        }],
        caveats: ["Raster statistics use a bounded sample for visual QA."],
      },
      qa: assessRasterQA(rasterMetadata),
      histogram: computeHistogram(rasterSamples, rasterMetadata.noData, 32),
    });

    const makeTemporalFrame = (key: string, label: string, value: number) => ({
      key,
      label,
      data: {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            id: `${key}-a`,
            geometry: { type: "Point" as const, coordinates: [29.04, 41.02] },
            properties: { month: key, value, district: "central" },
          },
          {
            type: "Feature" as const,
            id: `${key}-b`,
            geometry: { type: "Point" as const, coordinates: [29.12, 41.08] },
            properties: { month: key, value: value + 6, district: "north" },
          },
        ],
      },
    });
    const temporalFrames = [
      makeTemporalFrame("2026-01", "Jan 2026", 120),
      makeTemporalFrame("2026-02", "Feb 2026", 138),
      makeTemporalFrame("2026-03", "Mar 2026", 166),
      makeTemporalFrame("2026-04", "Apr 2026", 158),
    ];
    const temporalStore = useTemporalLayerStore.getState();
    temporalStore.setFrames(temporalFrames.map((frame, index) => ({
      index,
      key: frame.key,
      label: frame.label,
      featureCount: frame.data.features.length,
      binSum: frame.data.features.reduce((sum, feature) => sum + Number(feature.properties.value ?? 0), 0),
    })));
    temporalStore.setLayerReferences({
      activeLayerId: "p62-temporal-layer",
      sourceId: "p62-temporal-source",
      layerId: "p62-temporal-layer",
      layerName: "P62 Temporal Evidence Layer",
      sourceFields: ["month", "value"],
      timeField: "month",
      runtimeMode: "demo",
    });
    temporalStore.setPlaybackMode("continuous");
    temporalStore.goToFrame(2);
    temporalStore.play();

    const collection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "generated-a",
          geometry: {
            type: "Polygon" as const,
            coordinates: [[[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]]],
          },
          properties: { id: "generated-a", name: "Generated A", height: 18 },
        },
        {
          type: "Feature" as const,
          id: "generated-b",
          geometry: {
            type: "Polygon" as const,
            coordinates: [[[26, 12], [38, 12], [38, 26], [26, 26], [26, 12]]],
          },
          properties: { id: "generated-b", name: "Generated B", height: 30 },
        },
      ],
    };
    const crsSummary = {
      crs: "EPSG:32635",
      status: "known" as const,
      source: "explicit" as const,
      notes: [],
    };
    const sourceHandle = {
      sourceId: "p62-generated-massing-source",
      kind: "imported" as const,
      storageMode: "metadata-only" as const,
      restoreStatus: "metadata-only" as const,
      format: "geojson" as const,
      crsSummary,
      featureCount: collection.features.length,
      scene3d: {
        sourceKind: "generated-massing" as const,
        runtimeMode: "real" as const,
        verticalDatum: {
          status: "unknown" as const,
          value: null,
          source: "unavailable" as const,
          caveats: ["Generated massing uses relative heights; vertical datum not surveyed."],
        },
        objectCount: collection.features.length,
        lods: ["extruded-footprint"],
        bbox3d: [10, 10, 0, 38, 26, 30] as [number, number, number, number, number, number],
      },
      caveats: ["Generated massing is scenario evidence, not surveyed building stock."],
      profiledAt: new Date().toISOString(),
    };

    const mapStore = useMapExplorerStore.getState();
    mapStore.addOverlayLayer({
      id: "p62-temporal-layer",
      name: "P62 Temporal Evidence Layer",
      type: "geojson",
      visible: true,
      opacity: 0.72,
      group: "analysis",
      sourceKind: "demo",
      queryable: true,
      qaStatus: "warning",
      metadata: {
        sourceId: "p62-temporal-source",
        crsSummary,
        featureCount: temporalFrames.reduce((sum, frame) => sum + frame.data.features.length, 0),
        geometryType: "Point",
        fields: ["month", "value", "district"],
        analysisResult: {
          engine: "EmergingHotSpots",
          runId: "p62-temporal-demo-run",
          runTimestamp: "2026-06-04T10:00:00.000Z",
          parameterSummary: "Prompt 62 temporal evidence playback demo.",
          inputParameters: { timeField: "month", valueField: "value" },
          statisticalSummary: { frames: temporalFrames.length },
          outputMode: "demo",
          caveats: ["Seeded visual QA layer for temporal playback evidence; not analytical output."],
          visualization: {
            kind: "temporal",
            title: "P62 Temporal Evidence Layer",
            timeProperty: "month",
            valueField: "value",
            temporalFrames,
          },
        },
      },
    });
    mapStore.upsertSourceHandle(sourceHandle);
    mapStore.addOverlayLayer({
      id: "p62-generated-massing-layer",
      name: "P62 Generated Massing",
      type: "geojson",
      visible: true,
      opacity: 0.84,
      group: "analysis",
      sourceKind: "synthetic",
      queryable: true,
      qaStatus: "warning",
      sourceData: collection,
      metadata: {
        sourceId: sourceHandle.sourceId,
        sourceStorageMode: sourceHandle.storageMode,
        sourceRestoreStatus: sourceHandle.restoreStatus,
        crsSummary,
        featureCount: collection.features.length,
        geometryType: "Polygon",
        fields: ["id", "name", "height"],
        runtimeMode: "synthetic",
      },
    });

    const sceneStore = useScene3DStore.getState();
    sceneStore.setRuntimeMode("3d");
    sceneStore.setActiveLayer("p62-generated-massing-layer", collection, {
      heightField: "height",
      declaredCrs: "EPSG:32635",
      cityModelSourceHandle: sourceHandle,
    });
    mapStore.open();
  });
}

test.describe("Prompt 62 — evidence visual states @smoke", () => {
  test("renders raster, temporal, and 3D state chips with nonblank evidence canvases", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);
    await seedPrompt62State(page);

    await triggerDomClick(page.getByTestId("toggle-raster-panel"));
    const rasterPanel = page.getByTestId("raster-layer-panel");
    await expect(rasterPanel).toBeVisible();
    await expect(page.getByTestId("raster-state-qa-chip")).toBeVisible();
    await expect(page.getByTestId("raster-state-crs-chip")).toContainText("EPSG:32635");
    await expect(page.getByTestId("raster-state-nodata-chip")).toContainText("noData declared");
    await expect(page.getByTestId("raster-legend-nodata-chip")).toContainText("noData declared");
    const rasterCanvas = page.getByTestId("raster-evidence-canvas");
    await expect(rasterCanvas).toBeVisible();
    const rasterImage = await rasterCanvas.screenshot({ type: "png" });
    expect(countUniqueByteValues(rasterImage)).toBeGreaterThan(5);
    await page.screenshot({ path: "e2e/__screens__/p62-raster-evidence-state.png", fullPage: false });

    await triggerDomClick(page.getByTestId("map-workbench-sidebar-tab-scene-temporal"));
    const temporalPanel = page.getByTestId("temporal-player-panel");
    await expect(temporalPanel).toBeVisible();
    await page.evaluate(async () => {
      const { useTemporalLayerStore } = await import("/src/stores/useTemporalLayerStore.ts");
      const temporalStore = useTemporalLayerStore.getState();
      temporalStore.setPlaybackMode("continuous");
      temporalStore.goToFrame(2);
      temporalStore.pause();
    });
    await expect(page.getByTestId("temporal-runtime-chip")).toContainText("demo");
    await expect(page.getByTestId("temporal-frame-chip")).toContainText("Frame 3/4");
    await expect(page.getByTestId("temporal-playback-chip")).toContainText("paused");
    await page.screenshot({ path: "e2e/__screens__/p62-temporal-evidence-state.png", fullPage: false });

    await triggerDomClick(page.getByTestId("toggle-3d-panel"));
    const scenePanel = page.getByTestId("scene3d-panel");
    await expect(scenePanel).toBeVisible();
    await expect(page.getByTestId("scene3d-runtime-mode-chip")).toContainText("view 3d");
    await expect(page.getByTestId("scene3d-source-mode-chip")).toHaveAttribute("data-status", "synthetic");
    await expect(page.getByTestId("scene3d-source-mode-chip")).toContainText("generated massing");
    await expect(page.getByTestId("scene3d-vertical-assumption-chip")).toHaveAttribute("data-status", "caveat");
    await expect(page.getByTestId("scene3d-generation-state-chip")).toContainText("generated");
    const sceneCanvas = page.getByTestId("scene3d-terrain-canvas");
    await expect(sceneCanvas).toBeVisible();
    const sceneImage = await sceneCanvas.screenshot({ type: "png" });
    expect(countUniqueByteValues(sceneImage)).toBeGreaterThan(5);
    await page.screenshot({ path: "e2e/__screens__/p62-3d-evidence-state.png", fullPage: false });
  });
});
