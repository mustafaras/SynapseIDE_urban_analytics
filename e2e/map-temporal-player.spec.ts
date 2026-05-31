import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedTemporalLayer(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const temporalFrames = Array.from({ length: 50 }, (_, step) => {
      const offset = step * 0.0003;
      return {
        key: String(step),
        label: `Step ${step}`,
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: `growth-cell-${step}`,
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [28.96 + offset, 41.0],
                  [28.965 + offset, 41.0],
                  [28.965 + offset, 41.005],
                  [28.96 + offset, 41.005],
                  [28.96 + offset, 41.0],
                ]],
              },
              properties: {
                time_step: step,
                developed_area: 100 + step * 12,
              },
            },
          ],
        },
      };
    });

    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-temporal-growth",
      name: "E2E Temporal Urban Growth",
      type: "geojson",
      visible: true,
      opacity: 0.82,
      group: "analysis",
      sourceKind: "derived",
      sourceData: temporalFrames[0].data,
      style: {
        fillColor: "#3794ff",
        fillOpacity: 0.48,
        strokeColor: "#38bdf8",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 50,
        fields: ["time_step", "developed_area"],
        analysisResult: {
          engine: "CellularAutomata",
          runTimestamp: new Date("2025-01-01T00:00:00Z").toISOString(),
          parameterSummary: "50-step E2E temporal playback fixture",
          inputParameters: { steps: 50 },
          statisticalSummary: { frames: 50 },
          visualization: {
            kind: "temporal",
            title: "E2E Temporal Urban Growth",
            timeProperty: "time_step",
            temporalFrames,
          },
        },
      },
    });
  });
}

test.describe("Map Explorer temporal animation player", () => {
  test("shows the 50-frame timeline and supports scrub, play, step, and speed changes", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await seedTemporalLayer(page);

    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Temporal Urban Growth");

    const player = page.getByRole("region", { name: "Temporal animation player" });
    await expect(player).toBeVisible();
    await expect(player).toContainText("Temporal");
    await expect(player).toContainText("E2E Temporal Urban Growth");
    await expect(player).toContainText("1/50");
    await expect(page.getByText("Step 0").first()).toBeVisible();

    await triggerDomClick(player.getByRole("button", { name: "Step forward" }));
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

    await triggerDomClick(player.getByRole("button", { name: "Play" }));
    await expect.poll(async () => {
      return await page.evaluate(async () => {
        const storeModule = await import("/src/stores/useMapExplorerStore.ts");
        return storeModule.useMapExplorerStore.getState().isPlaying;
      });
    }).toBe(true);

    await triggerDomClick(player.getByRole("button", { name: "Pause" }));
    await expect.poll(async () => {
      return await page.evaluate(async () => {
        const storeModule = await import("/src/stores/useMapExplorerStore.ts");
        return storeModule.useMapExplorerStore.getState().isPlaying;
      });
    }).toBe(false);

    await page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      storeModule.useMapExplorerStore.getState().setCurrentTimestep(10);
    });
    await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBe(10);

    await triggerDomClick(player.getByRole("button", { name: "Play" }));
    const resumedAt = await page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      return storeModule.useMapExplorerStore.getState().currentTimestep;
    });

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Shift+ArrowRight");

    await expect.poll(async () => {
      return await page.evaluate(async () => {
        const storeModule = await import("/src/stores/useMapExplorerStore.ts");
        return storeModule.useMapExplorerStore.getState().playbackSpeed;
      });
    }).toBe(2);

    await triggerDomClick(player.getByRole("button", { name: "Set speed to 4x" }));
    await expect.poll(async () => {
      return await page.evaluate(async () => {
        const storeModule = await import("/src/stores/useMapExplorerStore.ts");
        return storeModule.useMapExplorerStore.getState().playbackSpeed;
      });
    }).toBe(4);

    await expect.poll(async () => {
      return await page.evaluate(async () => {
        const storeModule = await import("/src/stores/useMapExplorerStore.ts");
        return storeModule.useMapExplorerStore.getState().currentTimestep;
      });
    }).toBeGreaterThan(resumedAt);
  });
});
