import { expect, type Locator, type Page } from "@playwright/test";

export const IDE_ENTRY_URL = "/?e2e=1&view=ide";

export interface SeedTemporalLayerOptions {
  id?: string;
  name?: string;
  frameCount?: number;
  startYear?: number;
  timeProperty?: string;
  valueField?: string;
  runtimeMode?: "live" | "demo" | "synthetic" | "unknown";
}

export interface SeedGeoJSONLayerOptions {
  id?: string;
  name: string;
  featureCollection: GeoJSON.FeatureCollection;
  datasetTitle?: string;
  sourceLabel?: string;
}

export interface TemporalPlaybackStateSnapshot {
  mapOpen: boolean;
  currentTimestep: number;
  isPlaying: boolean;
  playbackSpeed: number;
  overlayLayerCount: number;
  temporalFrameCount: number;
  temporalActiveFrameIndex: number;
  temporalIsPlaying: boolean;
  temporalSpeed: number;
}

export async function resetWorkbenchState(page: Page): Promise<void> {
  await page.goto(IDE_ENTRY_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto(IDE_ENTRY_URL, { waitUntil: "domcontentloaded" });
}

export async function openUrbanAnalyticsWorkbench(page: Page): Promise<Locator> {
  const openAnalyticsButton = page
    .getByRole("button", { name: /^(Open Urban Analytics|Analytics)$/ })
    .first();
  await expect(openAnalyticsButton).toBeVisible();
  await openAnalyticsButton.click();

  const welcomeDialog = page.getByRole("dialog", { name: "Welcome to Urban Analytics Workbench" });
  await expect(welcomeDialog).toBeVisible();
  await welcomeDialog.getByRole("button", { name: /Start Workbench/i }).click();
  await expect(welcomeDialog).toBeHidden();

  await expect(page.getByTestId("urban-analytics-modal-loading")).toBeHidden({ timeout: 60000 });
  const urbanModal = page.getByRole("dialog", { name: "Urban Analytics Workbench" });
  await expect(urbanModal).toBeVisible({ timeout: 60000 });

  const closeDetailPanelButton = urbanModal.getByRole("button", { name: "Close detail panel" });
  if (await closeDetailPanelButton.isVisible().catch(() => false)) {
    await triggerDomClick(closeDetailPanelButton);
  }

  return urbanModal;
}

export async function waitForMapExplorerDialog(page: Page): Promise<Locator> {
  const loadingStatus = page.getByText("Loading Map Explorer...");
  await expect(loadingStatus).toBeHidden({ timeout: 60000 });
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible({ timeout: 60000 });
  return mapExplorer;
}

export async function openMapExplorer(
  page: Page,
  workspace: "explore" | "scene" = "explore",
): Promise<Locator> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = await waitForMapExplorerDialog(page);
  const workspaceButton = mapExplorer.getByTestId(
    workspace === "scene" ? "activity-btn-scene" : "activity-btn-layers",
  );
  await expect(workspaceButton).toBeVisible();
  await triggerDomClick(workspaceButton);
  return mapExplorer;
}

export async function openMapExplorerFromHarness(
  page: Page,
  workspace: "explore" | "scene" = "explore",
): Promise<Locator> {
  const urbanModal = page.getByRole("dialog", { name: "Urban Analytics Workbench" });
  if (!(await urbanModal.isVisible().catch(() => false))) {
    await openUrbanAnalyticsWorkbench(page);
  }

  await page.evaluate(() => {
    const harness = (window as Window & {
      e2e: {
        openMapExplorer: () => void;
      };
    }).e2e;
    harness.openMapExplorer();
  });

  const mapExplorer = await waitForMapExplorerDialog(page);
  const workspaceButton = mapExplorer.getByTestId(
    workspace === "scene" ? "activity-btn-scene" : "activity-btn-layers",
  );
  await expect(workspaceButton).toBeVisible();
  await triggerDomClick(workspaceButton);
  return mapExplorer;
}

export async function seedGeoJSONLayerFixture(
  page: Page,
  options: SeedGeoJSONLayerOptions,
): Promise<{ id: string; name: string }> {
  const fixture = {
    id: options.id ?? `e2e-geojson-layer-${Date.now()}`,
    name: options.name,
    featureCollection: options.featureCollection,
    datasetTitle: options.datasetTitle,
    sourceLabel: options.sourceLabel,
  };

  await page.evaluate((input) => {
    const harness = (window as Window & {
      e2e: {
        seedGeoJSONLayer: (seedInput: {
          id: string;
          name: string;
          featureCollection: GeoJSON.FeatureCollection;
          datasetTitle?: string;
          sourceLabel?: string;
        }) => void;
      };
    }).e2e;

    harness.seedGeoJSONLayer({
      id: input.id,
      name: input.name,
      featureCollection: input.featureCollection,
      ...(input.datasetTitle ? { datasetTitle: input.datasetTitle } : {}),
      ...(input.sourceLabel ? { sourceLabel: input.sourceLabel } : {}),
    });
  }, fixture);

  return {
    id: fixture.id,
    name: fixture.name,
  };
}

export async function openLayerActionMenu(layerRow: Locator): Promise<void> {
  const menu = layerRow.getByRole("menu").first();
  if (await menu.isVisible().catch(() => false)) {
    return;
  }

  const trigger = layerRow.locator('button[aria-label^="Layer actions for "]').first();
  await expect(trigger).toBeVisible();
  const isOpen = (await trigger.getAttribute("aria-expanded")) === "true";
  if (!isOpen) {
    await triggerDomClick(trigger);
  }
  await expect(menu).toBeVisible();
}

export async function openSceneTemporalPanel(page: Page): Promise<Locator> {
  const mapExplorer = await openMapExplorer(page, "scene");
  const sceneTemporalTab = page.getByTestId("map-workbench-sidebar-tab-scene-temporal");
  await expect(sceneTemporalTab).toBeVisible();
  await sceneTemporalTab.scrollIntoViewIfNeeded();
  await triggerDomClick(sceneTemporalTab);
  await expect(sceneTemporalTab).toHaveAttribute("aria-selected", "true");
  return mapExplorer;
}

export async function seedTemporalLayerFixture(
  page: Page,
  options: SeedTemporalLayerOptions = {},
): Promise<{ id: string; name: string; frameCount: number }> {
  const fixture = {
    id: options.id ?? "e2e-temporal-layer",
    name: options.name ?? "E2E Temporal Layer",
    frameCount: options.frameCount ?? 5,
    startYear: options.startYear ?? 2020,
    timeProperty: options.timeProperty ?? "year",
    valueField: options.valueField ?? "developed_area",
    runtimeMode: options.runtimeMode ?? "demo",
  };

  await page.evaluate((input) => {
    const harness = (window as Window & {
      e2e: {
        clearGeoJSONLayers: () => void;
        seedTemporalLayer: (seedInput: {
          id: string;
          name: string;
          frames: Array<{
            key: string;
            label: string;
            featureCollection: {
              type: string;
              features: Array<{
                type: string;
                id: string;
                geometry: {
                  type: string;
                  coordinates: number[][][];
                };
                properties: Record<string, number>;
              }>;
            };
          }>;
          timeProperty: string;
          valueField: string;
          runtimeMode: "live" | "demo" | "synthetic" | "unknown";
        }) => void;
      };
    }).e2e;

    const frames = Array.from({ length: input.frameCount }, (_, step) => {
      const offset = step * 0.0003;
      const year = input.startYear + step;
      return {
        key: String(year),
        label: `Year ${year}`,
        featureCollection: {
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
                [input.timeProperty]: year,
                [input.valueField]: 100 + step * 12,
              },
            },
          ],
        },
      };
    });

    harness.clearGeoJSONLayers();
    harness.seedTemporalLayer({
      id: input.id,
      name: input.name,
      frames,
      timeProperty: input.timeProperty,
      valueField: input.valueField,
      runtimeMode: input.runtimeMode,
    });
  }, fixture);

  return {
    id: fixture.id,
    name: fixture.name,
    frameCount: fixture.frameCount,
  };
}

export async function getTemporalPlaybackState(page: Page): Promise<TemporalPlaybackStateSnapshot> {
  return page.evaluate(() => {
    const harness = (window as Window & {
      e2e: {
        getTemporalPlaybackState: () => TemporalPlaybackStateSnapshot;
      };
    }).e2e;
    return harness.getTemporalPlaybackState();
  });
}

export async function openWorkflowsWorkspace(page: Page): Promise<Locator> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
  await expect(workflowsTab).toBeVisible();
  await triggerDomClick(workflowsTab);
  await expect(workflowsTab).toHaveAttribute("aria-selected", "true");
  return urbanModal;
}

export async function openWorkflowById(urbanModal: Locator, flowId: string): Promise<Locator> {
  const tile = urbanModal.getByTestId(`flow-tile-${flowId}`);
  await expect(tile).toBeVisible();
  await tile.scrollIntoViewIfNeeded();
  await triggerDomClick(tile);

  const flowRoot = urbanModal.getByTestId(`workflow-${flowId}-root`);
  await expect(flowRoot).toBeVisible();
  return flowRoot;
}

export async function clickFlowNext(flowRoot: Locator, count = 1): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const nextButton = flowRoot.getByRole("button", { name: /^(Next|Next →)$/i });
    await expect(nextButton).toBeVisible();
    await nextButton.scrollIntoViewIfNeeded();
    await triggerDomClick(nextButton);
  }
}

export async function setCheckedState(locator: Locator, checked: boolean): Promise<void> {
  const current = await locator.isChecked();
  if (current === checked) {
    return;
  }
  await locator.scrollIntoViewIfNeeded();
  await triggerDomClick(locator);
}

export async function triggerDomClick(locator: Locator): Promise<void> {
  await locator.evaluate((node: HTMLElement) => node.click());
}

export async function setFormValue(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((node, nextValue) => {
    const field = node as HTMLInputElement | HTMLTextAreaElement;
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(field, nextValue);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export async function expectDownloadFromAction(page: Page, action: () => Promise<void>): Promise<void> {
  const downloadPromise = page.waitForEvent("download");
  await action();
  const download = await downloadPromise;
  await expect(download.suggestedFilename()).not.toHaveLength(0);
}
