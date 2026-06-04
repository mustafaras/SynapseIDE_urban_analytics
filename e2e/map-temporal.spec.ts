import { expect, test } from "@playwright/test";
import {
  getTemporalPlaybackState,
  openSceneTemporalPanel,
  resetWorkbenchState,
  seedTemporalLayerFixture,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

test.describe("Prompt 46 — Scene temporal export handoff @smoke", () => {
  test("keeps Map Explorer alive through frame stepping and restores the exported frame into Publish Figure", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await resetWorkbenchState(page);

    const mapExplorer = await openSceneTemporalPanel(page);
    const fixture = await seedTemporalLayerFixture(page, {
      id: "p46-temporal-layer",
      name: "Prompt 46 Temporal Layer",
      frameCount: 5,
      startYear: 2020,
    });

    const scenePanel = page.getByTestId("map-scene-temporal-panel");
    await expect(scenePanel).toBeVisible();
    await expect(scenePanel).toContainText(fixture.name);

    const frameLabel = scenePanel.getByTestId("temporal-frame-label");
    await expect(frameLabel).toHaveText("Year 2020");

    await triggerDomClick(scenePanel.getByRole("button", { name: "Next frame" }));
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalActiveFrameIndex).toBe(1);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).currentTimestep).toBe(1);
    await expect(frameLabel).toHaveText("Year 2021");
    await expect(page.getByText("Map Explorer unavailable")).toHaveCount(0);

    await triggerDomClick(scenePanel.getByRole("button", { name: "Next frame" }));
    await triggerDomClick(scenePanel.getByRole("button", { name: "Next frame" }));
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalActiveFrameIndex).toBe(3);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).currentTimestep).toBe(3);
    await expect(frameLabel).toHaveText("Year 2023");

    await triggerDomClick(scenePanel.getByRole("button", { name: "Export frame" }));

    const publishFigureTab = page.getByTestId("map-workbench-sidebar-tab-publish-figure");
    await expect(publishFigureTab).toHaveAttribute("aria-selected", "true");

    const layoutDesigner = page.getByTestId("map-layout-designer");
    await expect(layoutDesigner).toBeVisible();
    await expect(layoutDesigner.getByRole("textbox", { name: "Page title" })).toHaveValue("Year 2023");
    await expect(layoutDesigner.getByRole("textbox", { name: "Page narrative" })).toHaveValue(/Frame 4 of 5 — 2023/);

    await expect(page.getByText("Map Explorer unavailable")).toHaveCount(0);
    await expect(mapExplorer).toBeVisible();
  });
});
