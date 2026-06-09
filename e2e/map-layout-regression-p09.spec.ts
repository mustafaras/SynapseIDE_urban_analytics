import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
  waitForMapExplorerDialog,
} from "./helpers/urbanAnalytics";

type Box = { x: number; y: number; width: number; height: number };

function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

async function expectNoOverlap(a: Locator, b: Locator, reason: string): Promise<void> {
  const [aBox, bBox] = await Promise.all([a.boundingBox(), b.boundingBox()]);
  expect(aBox, `${reason} (first box missing)`).not.toBeNull();
  expect(bBox, `${reason} (second box missing)`).not.toBeNull();
  if (!aBox || !bBox) return;
  expect(boxesOverlap(aBox, bBox), reason).toBe(false);
}

async function openMapExplorerInExploreMode(page: Page): Promise<void> {
  await resetWorkbenchState(page);
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = await waitForMapExplorerDialog(page);
  await expect(mapExplorer).toBeVisible();
  await expect(page.getByTestId("map-command-center")).toBeVisible();
  await expect(page.getByRole("status", { name: "Map status" })).toBeVisible();
  await expect(page.getByTestId("map-canvas-region")).toBeVisible();

  const exploreSwitch = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  if (await exploreSwitch.isVisible().catch(() => false)) {
    await triggerDomClick(exploreSwitch);
  }
}

test.describe("Prompt 09 — map layout regression guards", () => {
  test("guards shell visibility, panel collisions, warning surfaces, and floating control overlap", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openMapExplorerInExploreMode(page);

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    const commandCenter = page.getByTestId("map-command-center");
    const statusBar = page.getByRole("status", { name: "Map status" });
    const mapCanvasRegion = page.getByTestId("map-canvas-region");
    const closeButton = mapExplorer.getByRole("button", { name: "Close map explorer (Escape)" });

    await expect(commandCenter).toBeVisible();
    await expect(statusBar).toBeVisible();
    await expect(mapCanvasRegion).toBeVisible();
    await expect(closeButton).toBeVisible();

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
    const leftRail = page.getByTestId("map-layer-panel-rail");
    await expect(leftRail).toBeVisible();
    await expectNoOverlap(leftRail, closeButton, "left panel must not cover modal close control");

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-qa"));
    const rightDock = page.getByTestId("map-right-dock-host");
    const rightDockClose = rightDock.getByRole("button", { name: "Close right dock" });
    await expect(rightDock).toBeVisible();
    await expect(rightDockClose).toBeVisible();
    await expectNoOverlap(leftRail, rightDockClose, "left panel must not cover right dock controls");

    const viewportControls = page.getByTestId("map-canvas-viewport-controls");
    const furnitureControls = page.getByTestId("map-canvas-furniture-controls");
    const activeToolIndicator = page.getByTestId("map-active-tool-indicator");
    await expect(viewportControls).toBeVisible();
    await expect(furnitureControls).toBeVisible();
    await expect(activeToolIndicator).toBeVisible();

    await expectNoOverlap(rightDock, viewportControls, "right dock must not overlap viewport controls");
    await expectNoOverlap(rightDock, activeToolIndicator, "right dock must not overlap active tool indicator");
    await expectNoOverlap(statusBar, viewportControls, "status bar must not overlap viewport controls");
    await expectNoOverlap(viewportControls, furnitureControls, "floating control clusters must not overlap");
    await expectNoOverlap(activeToolIndicator, furnitureControls, "active tool indicator must not overlap furniture controls");

    await expect(page.getByRole("button", { name: "Open QA Problems" })).toBeVisible();
    await expect(viewportControls.getByRole("button", { name: "Open CRS readiness" })).toBeVisible();
  });

  test("keeps short viewport usable and export dialog actions reachable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 620 });
    await openMapExplorerInExploreMode(page);

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    const closeButton = mapExplorer.getByRole("button", { name: "Close map explorer (Escape)" });
    const canvas = page.getByTestId("map-canvas-region");
    await expect(closeButton).toBeVisible();
    await expect(canvas).toBeVisible();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.height ?? 0).toBeGreaterThan(220);

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-data"));
    const browseSource = mapExplorer.getByTestId("catalog-browse-source");
    await expect(browseSource).toBeVisible();
    await triggerDomClick(browseSource);

    const dialog = page.getByRole("dialog", { name: "Spatial data import hub" });
    const browseButton = dialog.getByRole("button", { name: "Browse Local File" });
    const closeButtonInDialog = dialog.getByRole("button", { name: "Close" });
    await expect(dialog).toBeVisible();
    await expect(browseButton).toBeVisible();
    await expect(closeButtonInDialog).toBeVisible();

    const [dialogBox, browseBox, closeBox] = await Promise.all([
      dialog.boundingBox(),
      browseButton.boundingBox(),
      closeButtonInDialog.boundingBox(),
    ]);
    expect(dialogBox).not.toBeNull();
    expect(browseBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    if (!dialogBox || !browseBox || !closeBox) return;

    expect(browseBox.y + browseBox.height).toBeLessThanOrEqual(dialogBox.y + dialogBox.height);
    expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(dialogBox.y + dialogBox.height);
    expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(620);
  });
});
