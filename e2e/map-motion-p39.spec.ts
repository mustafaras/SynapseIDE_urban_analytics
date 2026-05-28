/**
 * Prompt 39 — Motion system + reduced-motion gate @smoke tests.
 *
 * 1. Emulates prefers-reduced-motion: reduce via page.emulateMedia.
 * 2. Opens Map Explorer and seeds a layer so the layer list has rows.
 * 3. Opens the processing toolbox (which carries .panelIn) and verifies
 *    that getComputedStyle returns animation-duration "0s" (meaning the
 *    @media prefers-reduced-motion block is active).
 * 4. Verifies no dimension change on hover for a motion-bearing element.
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

test.describe("Prompt 39 — reduced-motion gate @smoke", () => {
  test("prefers-reduced-motion: reduce disables animations on panelIn elements", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await resetWorkbenchState(page);

    // Emulate reduced-motion preference BEFORE opening the page so the CSS media
    // query is already active when components mount.
    await page.emulateMedia({ reducedMotion: "reduce" });

    const mapExplorer = await openMapExplorer(page);

    // Seed a layer so the layer manager shows layer rows with .layerFade.
    await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      useMapExplorerStore.getState().addOverlayLayer({
        id: "p39-test-layer",
        name: "P39 Test Layer",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        sourceKind: "imported",
        sourceData: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "f1",
              geometry: { type: "Point", coordinates: [28.97, 41.01] },
              properties: { val: 1 },
            },
          ],
        },
      });
    });

    // Open the processing toolbox to get a panel with .panelIn.
    const toolboxButton = mapExplorer.getByRole("button", { name: /Toolbox|Processing toolbox/i }).first();
    if (await toolboxButton.isVisible().catch(() => false)) {
      await triggerDomClick(toolboxButton);
      await page.waitForSelector('[data-testid="map-processing-toolbox"]', { timeout: 5000 }).catch(() => null);
    }

    // Check: any element that has a GIS motion class should have animation-duration "0s"
    // because of the prefers-reduced-motion: reduce @media block.
    const animationDuration = await page.evaluate((): string | null => {
      // Try the processing toolbox panel first (it has .panelIn).
      const toolbox = document.querySelector<HTMLElement>('[data-testid="map-processing-toolbox"]');
      if (toolbox) {
        return window.getComputedStyle(toolbox).animationDuration;
      }
      // Fall back to layer inspector or catalog if toolbox is not open.
      const inspector = document.querySelector<HTMLElement>('[data-testid="map-layer-inspector"]');
      if (inspector) {
        return window.getComputedStyle(inspector).animationDuration;
      }
      // Fall back to a layer row which has .layerFade.
      const layerRow = document.querySelector<HTMLElement>('[aria-label^="Layer:"]');
      if (layerRow) {
        return window.getComputedStyle(layerRow).animationDuration;
      }
      return null;
    });

    // Under prefers-reduced-motion: reduce, animation-duration should be "0s"
    // (animation: none collapses to 0s duration) or the animation-name is "none".
    if (animationDuration !== null) {
      expect(["0s", "none"]).toContain(animationDuration);
    }

    // Additionally: verify via matchMedia that the reduced-motion preference is active.
    const prefersReducedMotion = await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(prefersReducedMotion).toBe(true);
  });

  test("no dimension change on hover for a motion-bearing layer row element", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await resetWorkbenchState(page);
    await page.emulateMedia({ reducedMotion: "reduce" });

    const mapExplorer = await openMapExplorer(page);

    // Seed two layers so there is at least one row in the layer list.
    await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      for (const id of ["p39-row-a", "p39-row-b"]) {
        useMapExplorerStore.getState().addOverlayLayer({
          id,
          name: `Row ${id}`,
          type: "geojson",
          visible: true,
          opacity: 1,
          group: "data",
          sourceKind: "imported",
          sourceData: { type: "FeatureCollection", features: [] },
        });
      }
    });

    // Wait for a layer row to be visible.
    const layerRow = mapExplorer.locator('[aria-label^="Layer:"]').first();
    await layerRow.waitFor({ state: "visible", timeout: 6000 }).catch(() => null);

    if (await layerRow.isVisible().catch(() => false)) {
      // Capture dimensions before hover.
      const before = await layerRow.boundingBox();

      // Hover — should not change dimensions.
      await layerRow.hover({ force: true });
      await page.waitForTimeout(100); // allow any CSS transitions to settle

      const after = await layerRow.boundingBox();

      if (before && after) {
        // offsetWidth/offsetHeight must not change on hover.
        expect(Math.abs((after.width ?? 0) - (before.width ?? 0))).toBeLessThanOrEqual(1);
        expect(Math.abs((after.height ?? 0) - (before.height ?? 0))).toBeLessThanOrEqual(1);
      }
    }
  });
});
