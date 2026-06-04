import { expect, test } from "@playwright/test";
import {
  getTemporalPlaybackState,
  openSceneTemporalPanel,
  resetWorkbenchState,
  seedTemporalLayerFixture,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

test.describe("Map Explorer temporal animation player", () => {
  test("uses the live Scene > Temporal layer for scrub, play, step, and speed changes", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openSceneTemporalPanel(page);
    const fixture = await seedTemporalLayerFixture(page, {
      id: "e2e-temporal-growth",
      name: "E2E Temporal Urban Growth",
      frameCount: 50,
      startYear: 2000,
      timeProperty: "year",
      valueField: "developed_area",
    });

    const scenePanel = page.getByTestId("map-scene-temporal-panel");
    await expect(scenePanel).toBeVisible();
    await expect(scenePanel).toContainText(fixture.name);

    const player = page.getByRole("region", { name: "Temporal animation player" });
    await expect(player).toBeVisible();
    await expect(player).toContainText("Temporal");
    await expect(player).toContainText(fixture.name);
    await expect(player).toContainText("1/50");
    await expect(page.getByText("Year 2000").first()).toBeVisible();

    await triggerDomClick(player.getByRole("button", { name: "Step forward" }));
    await expect.poll(async () => (await getTemporalPlaybackState(page)).currentTimestep).toBe(1);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalActiveFrameIndex).toBe(1);
    await expect(player).toContainText("2/50");

    const slider = player.getByRole("slider", { name: "Timeline scrubber" });
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.move(box.x + 4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
    await page.mouse.up();

    await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBeGreaterThan(30);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).currentTimestep).toBeGreaterThan(30);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalActiveFrameIndex).toBeGreaterThan(30);

    await triggerDomClick(player.getByRole("button", { name: "Play" }));
    await expect.poll(async () => (await getTemporalPlaybackState(page)).isPlaying).toBe(true);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalIsPlaying).toBe(true);

    await triggerDomClick(player.getByRole("button", { name: "Pause" }));
    await expect.poll(async () => (await getTemporalPlaybackState(page)).isPlaying).toBe(false);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalIsPlaying).toBe(false);

    await triggerDomClick(player.getByRole("button", { name: "Play" }));
    const resumedAt = (await getTemporalPlaybackState(page)).currentTimestep;

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", {
        key: "ArrowRight",
        shiftKey: true,
        bubbles: true,
      }));
    });

    await expect.poll(async () => (await getTemporalPlaybackState(page)).playbackSpeed).toBe(2);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalSpeed).toBe(2);

    await triggerDomClick(player.getByRole("button", { name: "Set speed to 4x" }));
    await expect.poll(async () => (await getTemporalPlaybackState(page)).playbackSpeed).toBe(4);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalSpeed).toBe(4);

    await expect.poll(async () => (await getTemporalPlaybackState(page)).currentTimestep).toBeGreaterThan(resumedAt);
    await expect.poll(async () => (await getTemporalPlaybackState(page)).temporalActiveFrameIndex).toBeGreaterThan(resumedAt);
    await expect(page.getByText("Map Explorer unavailable")).toHaveCount(0);
  });
});
