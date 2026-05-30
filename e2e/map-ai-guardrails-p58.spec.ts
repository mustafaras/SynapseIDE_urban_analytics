import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedQueryableLayers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const store = module.useMapExplorerStore.getState();
    const common = {
      type: "geojson" as const,
      visible: true,
      opacity: 0.9,
      group: "data" as const,
      sourceKind: "project" as const,
      queryable: true,
      qaStatus: "passed" as const,
    };

    store.addOverlayLayer({
      ...common,
      id: "e2e-ai-parcels",
      name: "E2E AI Parcels",
      sourceData: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          id: "parcel-1",
          properties: { value: 10, density: 85 },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [29, 41],
              [29.01, 41],
              [29.01, 41.01],
              [29, 41.01],
              [29, 41],
            ]],
          },
        }],
      },
      metadata: {
        featureCount: 1,
        geometryType: "Polygon",
        fields: ["value", "density"],
        datasetContext: {
          crs: "EPSG:4326",
          source: "E2E fixture",
          license: "test",
          updateDate: "2026-05-30",
        },
      },
    });

    store.addOverlayLayer({
      ...common,
      id: "e2e-ai-stops",
      name: "E2E AI Transit Stops",
      sourceData: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          id: "stop-1",
          properties: { name: "Stop A" },
          geometry: { type: "Point", coordinates: [29.005, 41.005] },
        }],
      },
      metadata: {
        featureCount: 1,
        geometryType: "Point",
        fields: ["name"],
        datasetContext: {
          crs: "EPSG:4326",
          source: "E2E fixture",
          license: "test",
          updateDate: "2026-05-30",
        },
      },
    });
  });
}

async function openNLQueryPanel(page: Page): Promise<void> {
  const directButton = page.getByRole("button", { name: /Open natural-language map query builder/i }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }

  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  await palette.getByLabel("Search map commands").fill("natural language query");
  await triggerDomClick(palette.getByRole("option", { name: /Query/i }).first());
}

test.describe("Map Explorer AI guardrails @smoke", () => {
  test("requires confirmation and audits an AI-proposed NL buffer query", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
    await expect(page.getByRole("dialog", { name: "Map Explorer" }).first()).toBeVisible();

    await seedQueryableLayers(page);
    await openNLQueryPanel(page);

    const queryPanel = page.getByRole("dialog", { name: "Natural language map query builder" });
    await expect(queryPanel).toBeVisible();
    await queryPanel.getByLabel("Natural language map query request").fill("Buffer E2E AI Parcels by 500 meters.");

    await expect(queryPanel).toContainText("Interpreted as Buffer");
    await expect(queryPanel).toContainText("AI-proposed preview requires confirmation");
    await expect(queryPanel.getByRole("button", { name: "Run accepted map query" })).toBeDisabled();

    await triggerDomClick(queryPanel.getByRole("button", { name: "Confirm AI-proposed map query preview" }));
    await expect(queryPanel).toContainText("AI-proposed preview confirmed for execution");
    await expect(queryPanel.getByRole("button", { name: "Run accepted map query" })).toBeEnabled();

    await expect.poll(async () => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      return module.useMapExplorerStore.getState().reviewSession.events.some((event) =>
        event.title.includes("AI-proposed") &&
        event.title.includes("Buffer") &&
        JSON.stringify(event.details).includes("AI-proposed") &&
        JSON.stringify(event.details).includes("requiresHumanConfirmation"));
    })).toBe(true);
  });
});
