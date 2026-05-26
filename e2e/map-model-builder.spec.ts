import { expect, test, type Locator, type Page } from "@playwright/test";

import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedModelLayers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    const addLayer = useMapExplorerStore.getState().addOverlayLayer;
    const layer = (id: string, name: string, offset: number) => ({
      id,
      name,
      type: "geojson" as const,
      visible: true,
      opacity: 0.8,
      group: "data" as const,
      sourceKind: "imported" as const,
      qaStatus: "passed" as const,
      sourceData: {
        type: "FeatureCollection" as const,
        features: [{
          type: "Feature" as const,
          id: `${id}-feature`,
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [29.0 + offset, 41.0],
              [29.03 + offset, 41.0],
              [29.03 + offset, 41.03],
              [29.0 + offset, 41.03],
              [29.0 + offset, 41.0],
            ]],
          },
          properties: { class: name },
        }],
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        dataVersion: `${id}-v1`,
        fields: ["class"],
        crsSummary: { crs: "EPSG:32635", status: "known" as const, source: "explicit" as const, notes: [] },
      },
    });
    addLayer(layer("e2e-model-primary", "E2E Model Primary", 0));
    addLayer(layer("e2e-model-secondary", "E2E Model Secondary", 0.01));
    addLayer(layer("e2e-model-overlay", "E2E Model Overlay", 0.005));
  });
}

async function openModelBuilder(page: Page, mapExplorer: Locator): Promise<void> {
  const directButton = mapExplorer.getByRole("button", { name: /model builder/i }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }
  await triggerDomClick(
    mapExplorer.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" }),
  );
  await triggerDomClick(
    page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", { name: /model builder/i }),
  );
}

test.describe("Map Explorer model builder", () => {
  test("reruns a saved buffer-intersect model deterministically and publishes batch evidence", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );
    await seedModelLayers(page);
    await openModelBuilder(page, mapExplorer);

    const builder = page.getByTestId("map-model-builder");
    await expect(builder).toBeVisible();
    await builder.getByTestId("model-source-input").selectOption("e2e-model-primary");
    await builder.getByTestId("model-overlay-input").selectOption("e2e-model-overlay");
    await triggerDomClick(builder.getByTestId("model-add-step"));
    await builder.getByTestId("model-add-tool").selectOption("intersect");
    await triggerDomClick(builder.getByTestId("model-add-step"));

    await triggerDomClick(builder.getByTestId("model-save"));
    await expect(builder.getByTestId("model-run-result")).toHaveAttribute("data-status", "applied");
    const firstHash = await builder.getByTestId("model-manifest-hash").textContent();
    await expect(builder.getByTestId("model-output-layer")).toContainText("Transit access coverage");

    await triggerDomClick(builder.getByTestId("model-rerun"));
    await expect(builder.getByTestId("model-manifest-hash")).toHaveText(firstHash ?? "");
    await expect(builder.getByTestId("model-determinism")).toHaveText("Saved rerun identical");

    await triggerDomClick(builder.getByTestId("model-batch-layer-e2e-model-primary"));
    await triggerDomClick(builder.getByTestId("model-batch-layer-e2e-model-secondary"));
    await triggerDomClick(builder.getByTestId("model-run-batch"));
    await expect(builder.getByTestId("model-batch-result")).toContainText("2 output(s) applied");

    const publishedHashText = await builder.getByTestId("model-manifest-hash").textContent();
    const publishedHash = publishedHashText?.replace(/^hash:\s*/, "") ?? "";
    await triggerDomClick(builder.getByTestId("model-export"));

    await expect.poll(async () => page.evaluate((hash) => {
      return import("/src/stores/editorStore.ts").then(({ useEditorStore }) =>
        useEditorStore.getState().tabs.some((tab) =>
          tab.origin === "bridge"
          && tab.path.endsWith(".py")
          && tab.content.includes(hash),
        ),
      );
    }, publishedHash)).toBe(true);

    await expect.poll(async () => page.evaluate(async (hash) => {
      const { useUrbanContextStore } = await import("/src/features/urbanAnalytics/useUrbanContextStore.ts");
      return useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.title === "Map model result: Transit access coverage"
        && artifact.metadata?.mapModelManifestHash === hash
        && artifact.metadata?.mapModelBatchTargetCount === 2,
      );
    }, publishedHash)).toBe(true);

    await triggerDomClick(mapExplorer.getByRole("button", { name: "Close map explorer (Escape)" }));
    const tray = urbanModal.locator(".ua-evidence-tray");
    await triggerDomClick(tray.locator(".ua-evidence-toggle"));
    await expect(tray.locator(".ua-evidence-row", { hasText: "Map model result: Transit access coverage" })).toBeVisible();
  });
});
