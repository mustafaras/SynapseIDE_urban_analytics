/**
 * Prompt 46 — Temporal layers: playback + frame export @smoke.
 *
 * 1. Opens Map Explorer.
 * 2. Seeds the temporal layer store with 5 frames via page.evaluate.
 * 3. Calls play(), advances to frame index 3 via goToFrame(3), and calls
 *    exportCurrentFrame() — asserting the export payload has frameIndex: 3.
 * 4. Asserts the rendered TemporalPlayerPanel shows the correct frame label.
 */
import { expect, test } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function openMapExplorer(page: import("@playwright/test").Page) {
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

test.describe("Prompt 46 — temporal playback + frame export @smoke", () => {
  test("seeds 5 frames, exports frame index 3, and shows the frame label", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await resetWorkbenchState(page);

    const mapExplorer = await openMapExplorer(page);

    // Seed the temporal store with 5 frames + layer references.
    await page.evaluate(async () => {
      const { useTemporalLayerStore } = await import("/src/stores/useTemporalLayerStore.ts");
      const store = useTemporalLayerStore.getState();
      store.setFrames([
        { index: 0, key: "2020", label: "Year 2020", featureCount: 10, binSum: 100 },
        { index: 1, key: "2021", label: "Year 2021", featureCount: 12, binSum: 140 },
        { index: 2, key: "2022", label: "Year 2022", featureCount: 9, binSum: 90 },
        { index: 3, key: "2023", label: "Year 2023", featureCount: 15, binSum: 200 },
        { index: 4, key: "2024", label: "Year 2024", featureCount: 11, binSum: 130 },
      ]);
      store.setLayerReferences({
        activeLayerId: "p46-temporal-layer",
        sourceId: "p46-temporal-source",
        layerId: "p46-temporal-layer",
        layerName: "P46 Temporal Layer",
        sourceFields: ["pop"],
        timeField: "year",
        runtimeMode: "demo",
      });
      store.setPlaybackMode("continuous");
    });

    // Drive playback: play(), advance to frame index 3, export the frame.
    const exported = await page.evaluate(async () => {
      const { useTemporalLayerStore } = await import("/src/stores/useTemporalLayerStore.ts");
      const store = useTemporalLayerStore.getState();
      store.play();
      store.goToFrame(3);
      const payload = store.exportCurrentFrame();
      return {
        frameIndex: payload?.frameIndex ?? null,
        frameKey: payload?.frameKey ?? null,
        frameLabel: payload?.frameLabel ?? null,
        restoreVersion: payload?.restoreMetadata.version ?? null,
      };
    });

    expect(exported.frameIndex).toBe(3);
    expect(exported.frameKey).toBe("2023");
    expect(exported.frameLabel).toBe("Year 2023");
    expect(exported.restoreVersion).toBe(1);

    // The panel should be mounted (frames > 0) and show the active frame label.
    const frameLabel = mapExplorer.locator('[data-testid="temporal-frame-label"]').first();
    await expect(frameLabel).toBeVisible({ timeout: 6000 });
    await expect(frameLabel).toHaveText("Year 2023");
  });
});
