import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedRecoveryLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const storeModule = await import("/src/stores/useMapExplorerStore.ts");
    storeModule.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-p56-layer",
      name: "E2E P56 Recovery Layer",
      type: "geojson",
      visible: true,
      opacity: 0.86,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      sourceData: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          id: "p56-feature-1",
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
          properties: { name: "Recovery parcel", population: 250 },
        }],
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["name", "population"],
        crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function openAdvancedCommand(
  page: Page,
  mapExplorer: ReturnType<Page["getByRole"]>,
  directName: RegExp,
  menuName: RegExp,
): Promise<void> {
  const directButton = mapExplorer.getByRole("button", { name: directName }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }
  await triggerDomClick(
    mapExplorer.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" }),
  );
  await triggerDomClick(
    page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", { name: menuName }),
  );
}

async function induceWorkerFailure(page: Page): Promise<string> {
  const jobId = await page.evaluate(async () => {
    const { analyticsWorkerPool } = await import("/src/workers/pool/tasks.ts");
    const handle = analyticsWorkerPool.enqueue("geometry/workflow", {} as never, {
      title: "P56 forced worker failure",
      timeoutMs: 5_000,
    });
    void handle.promise.catch(() => undefined);
    return handle.id;
  });
  await expect.poll(async () => page.evaluate(async () => {
    const { getMapTelemetryEvents } = await import("/src/services/map/observability/MapObservabilityService.ts");
    return getMapTelemetryEvents().some((event) => event.kind === "worker.failure" && event.message.includes("P56 forced worker failure"));
  }), { timeout: 10_000 }).toBe(true);
  return jobId;
}

test.describe("Prompt 56 — Map observability and recovery", () => {
  test("surfaces worker failure recovery and retries a crashed diagnostics panel", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );
    await seedRecoveryLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E P56 Recovery Layer");

    await induceWorkerFailure(page);

    await openAdvancedCommand(page, mapExplorer, /Diagnostics/i, /diagnostics/i);
    const diagnostics = page.getByTestId("map-performance-diagnostics");
    await expect(diagnostics).toBeVisible();
    await expect(diagnostics.getByTestId("map-observability-log")).toContainText("worker.failure");
    await expect(diagnostics.getByTestId("map-observability-log")).toContainText("P56 forced worker failure");
    await expect(diagnostics.getByTestId("map-worker-recovery-retry")).toBeVisible();
    await triggerDomClick(diagnostics.getByTestId("map-worker-recovery-retry"));

    await expect(mapExplorer).toBeVisible();
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E P56 Recovery Layer");

    await triggerDomClick(diagnostics.getByRole("button", { name: "Close performance diagnostics" }));
    await page.evaluate(() => {
      (window as typeof window & { __MAP_E2E_FORCE_MAP_DIAGNOSTICS_CRASH__?: boolean }).__MAP_E2E_FORCE_MAP_DIAGNOSTICS_CRASH__ = true;
    });
    await openAdvancedCommand(page, mapExplorer, /Diagnostics/i, /diagnostics/i);
    const boundary = page.getByTestId("map-panel-error-boundary");
    await expect(boundary).toBeVisible();
    await expect(boundary).toContainText("Render diagnostics panel recovered");
    await expect(mapExplorer).toBeVisible();

    await page.evaluate(() => {
      (window as typeof window & { __MAP_E2E_FORCE_MAP_DIAGNOSTICS_CRASH__?: boolean }).__MAP_E2E_FORCE_MAP_DIAGNOSTICS_CRASH__ = false;
    });
    await triggerDomClick(boundary.getByTestId("map-panel-error-retry"));
    await expect(page.getByTestId("map-performance-diagnostics")).toBeVisible();
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E P56 Recovery Layer");
  });
});