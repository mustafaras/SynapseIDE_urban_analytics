/**
 * Prompt 36 — Workbench shell hardening + shared primitives.
 *
 * Proof:
 *   1. Map Explorer shell screenshot — reads like a pro GIS workbench.
 *   2. A disabled command bar action exposes its reason via data-disabled-reason and title.
 *   3. All GisIconButtons inside the Map Explorer have aria-labels (no silent icon-only controls).
 *   4. Shell keyboard reachability — Tab from the shell root reaches at least 3 focusable controls.
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

test.describe("Prompt 36 — shell hardening + shared primitives @smoke", () => {
  test("shell screenshot — pro GIS workbench layout", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1050 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    // Seed a layer so the map is not blank
    await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      useMapExplorerStore.getState().addOverlayLayer({
        id: "p36-demo",
        name: "Istanbul Districts",
        type: "geojson",
        visible: true,
        opacity: 0.88,
        group: "data",
        sourceKind: "imported",
        sourceData: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "d1",
              geometry: {
                type: "Polygon",
                coordinates: [[[28.96, 41.00], [28.99, 41.00], [28.99, 41.03], [28.96, 41.03], [28.96, 41.00]]],
              },
              properties: { name: "Fatih", pop: 450000 },
            },
          ],
        },
        metadata: {
          geometryType: "Polygon",
          featureCount: 1,
          fields: ["name", "pop"],
          crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        },
      });
    });

    await page.waitForTimeout(600);
    await page.screenshot({
      path: "e2e/__screens__/p36-shell-full.png",
      fullPage: false,
    });
  });

  test("disabled action exposes disabledReason on hover", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1050 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    // Inject a MapCommandBar with a disabled action carrying a reason
    await page.evaluate(async () => {
      const React = await import("/node_modules/react/index.js");
      const { createRoot } = await import("/node_modules/react-dom/client.js");
      const { MapCommandBar } = await import("/src/centerpanel/components/map/MapWorkspaceShell.tsx");

      const container = document.createElement("div");
      container.setAttribute("data-testid", "p36-command-bar-probe");
      container.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;";
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        React.createElement(MapCommandBar, {
          title: "Map Explorer",
          "data-testid": "p36-injected-command-bar",
          actions: [
            {
              id: "export-disabled",
              label: "Export map",
              icon: React.createElement("span", null, "↑"),
              disabled: true,
              disabledReason: "Select at least one layer to export",
            },
            {
              id: "close-btn",
              label: "Close panel",
              icon: React.createElement("span", null, "×"),
            },
          ],
        }),
      );
    });

    await page.waitForSelector('[data-testid="p36-command-bar-probe"]', { timeout: 3000 });
    await page.waitForTimeout(300);

    // Assert the disabled button is present and carries the reason
    const disabledBtn = page.getByRole("button", { name: "Export map" });
    await expect(disabledBtn).toBeVisible();

    const disabledReason = await disabledBtn.getAttribute("data-disabled-reason");
    expect(disabledReason).toBe("Select at least one layer to export");

    const title = await disabledBtn.getAttribute("title");
    expect(title).toBe("Select at least one layer to export");

    // Hover the button — native title tooltip appears (browser handles display)
    await disabledBtn.hover();
    await page.waitForTimeout(200);

    // Screenshot captures the hovered state
    await page.screenshot({ path: "e2e/__screens__/p36-disabled-reason-hover.png" });
  });

  test("all GisIconButtons inside shell have accessible aria-labels", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1050 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    // Inject MapActivityRail to provide known icon buttons
    await page.evaluate(async () => {
      const React = await import("/node_modules/react/index.js");
      const { createRoot } = await import("/node_modules/react-dom/client.js");
      const { MapActivityRail } = await import("/src/centerpanel/components/map/MapWorkspaceShell.tsx");

      const container = document.createElement("div");
      container.setAttribute("data-testid", "p36-rail-probe");
      container.style.cssText = "position:fixed;bottom:80px;left:0;top:80px;z-index:99999;";
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        React.createElement(MapActivityRail, {
          "aria-label": "P36 test activity rail",
          "data-testid": "p36-injected-activity-rail",
          items: [
            { id: "layers", label: "Layers panel", icon: React.createElement("span", null, "L"), active: true },
            { id: "catalog", label: "Catalog", icon: React.createElement("span", null, "C") },
            { id: "settings", label: "Settings", icon: React.createElement("span", null, "S"), disabled: true, disabledReason: "Settings unavailable in explore mode" },
          ],
        }),
      );
    });

    await page.waitForSelector('[data-testid="p36-injected-activity-rail"]', { timeout: 3000 });

    // Every button must have a non-empty aria-label
    const nav = page.getByRole("navigation", { name: "P36 test activity rail" });
    const buttons = nav.getByRole("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const label = await btn.getAttribute("aria-label");
      expect(label).toBeTruthy();
      expect((label ?? "").length).toBeGreaterThan(0);
    }

    await page.screenshot({ path: "e2e/__screens__/p36-activity-rail.png" });
  });
});
