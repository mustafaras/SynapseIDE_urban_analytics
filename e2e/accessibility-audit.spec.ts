import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/accessibility";
import {
  clickFlowNext,
  openMapExplorer,
  openUrbanAnalyticsWorkbench,
  openWorkflowById,
  openWorkflowsWorkspace,
  resetWorkbenchState,
  setFormValue,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function publishScenarioComparisonRun(urbanModal: Locator) {
  const flow = await openWorkflowById(urbanModal, "scenario_comparison");

  await setFormValue(flow.getByRole("textbox", { name: /Baseline name/i }), "A11y review baseline");
  await clickFlowNext(flow, 3);
  await triggerDomClick(flow.getByRole("button", { name: /Recalculate full comparison/i }));
  await clickFlowNext(flow, 3);
  await triggerDomClick(flow.getByRole("button", { name: /Publish to review/i }));

  return urbanModal;
}

async function expectVisibleFocusIndicator(page: Page) {
  const focusState = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) {
      return null;
    }

    const computedStyle = window.getComputedStyle(element);
    return {
      tagName: element.tagName,
      matchesFocusVisible: element.matches(":focus-visible"),
      outlineStyle: computedStyle.outlineStyle,
      outlineWidth: computedStyle.outlineWidth,
      boxShadow: computedStyle.boxShadow,
    };
  });

  expect(focusState).not.toBeNull();
  expect(
    Boolean(
      focusState &&
      (focusState.matchesFocusVisible ||
        (focusState.outlineStyle !== "none" && focusState.outlineWidth !== "0px") ||
        focusState.boxShadow !== "none"),
    ),
  ).toBe(true);
}

async function openIdeTerminal(page: Page) {
  const toggleTerminalButton = page.getByRole("button", { name: /Toggle terminal/i });
  await expect(toggleTerminalButton).toBeVisible();

  const shellSelect = page.getByRole("combobox", { name: /Terminal shell/i });
  if (!(await shellSelect.isVisible().catch(() => false))) {
    await toggleTerminalButton.click();
  }

  await expect(shellSelect).toBeVisible();
  return shellSelect;
}

async function seedPrompt20Layer(page: Page) {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "prompt-20-parcel-1",
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [28.98, 41.0],
              [29.01, 41.0],
              [29.01, 41.03],
              [28.98, 41.03],
              [28.98, 41.0],
            ]],
          },
          properties: { name: "Prompt 20 keyboard parcel", value: 7 },
        },
      ],
    };

    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-prompt-20-keyboard-layer",
      name: "E2E Prompt 20 Keyboard Layer",
      type: "geojson",
      visible: true,
      opacity: 0.86,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      sourceData: featureCollection,
      metadata: {
        geometryType: "Polygon",
        featureCount: featureCollection.features.length,
        fields: ["name", "value"],
        bounds: [28.98, 41.0, 29.01, 41.03],
      },
    });
  });
}

async function openMapExplorerFromStore(page: Page) {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    module.useMapExplorerStore.getState().open();
  });

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  await expect(page.getByTestId("map-canvas-region")).toBeVisible();
  return mapExplorer;
}

interface OpenedModalProbe {
  dialog: Locator;
  trigger: Locator;
}

interface ModalProbe {
  name: string;
  axeSelector: string;
  expectFocusRestore?: boolean;
  open: (page: Page) => Promise<OpenedModalProbe>;
}

async function installFocusAnchor(page: Page, id: string, label: string): Promise<Locator> {
  await page.evaluate(({ anchorId, anchorLabel }) => {
    let anchor = document.getElementById(anchorId) as HTMLButtonElement | null;
    if (!anchor) {
      anchor = document.createElement("button");
      anchor.id = anchorId;
      anchor.type = "button";
      anchor.textContent = anchorLabel;
      anchor.style.position = "fixed";
      anchor.style.left = "4px";
      anchor.style.top = "4px";
      anchor.style.zIndex = "1";
      document.body.appendChild(anchor);
    }
    anchor.focus();
  }, { anchorId: id, anchorLabel: label });

  return page.locator(`#${id}`);
}

async function expectDialogFitsViewport(page: Page, dialog: Locator): Promise<void> {
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(dialog).toBeVisible();

  const metrics = await dialog.evaluate((node) => {
    const element = node as HTMLElement;
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewportWidth: window.innerWidth,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      bodyOverflow: document.body.scrollWidth - window.innerWidth,
    };
  });

  expect(metrics.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(Math.max(metrics.documentOverflow, metrics.bodyOverflow)).toBeLessThanOrEqual(1);
}

async function focusFirstDialogButton(dialog: Locator): Promise<void> {
  const firstButton = dialog.getByRole("button").first();
  await expect(firstButton).toBeVisible();
  await firstButton.focus();
  await expect(firstButton).toBeFocused();
}

const appModalProbes: ModalProbe[] = [
  {
    name: "Global Search",
    axeSelector: '[role="dialog"]:has(input[aria-label="Global search"])',
    open: async (page) => {
      await resetWorkbenchState(page);
      const trigger = page.getByRole("button", { name: "Global Search" });
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Search" });
      await expect(dialog).toBeVisible();
      return { dialog, trigger };
    },
  },
  {
    name: "AI Settings",
    axeSelector: '[role="dialog"]:has([role="tablist"])',
    open: async (page) => {
      await resetWorkbenchState(page);
      await page.evaluate(async () => {
        await (window as Window & { e2e?: { openAssistant?: () => Promise<void> } }).e2e?.openAssistant?.();
      });
      await expect(page.getByRole("heading", { name: /SynapseCore AI/i })).toBeVisible();
      const trigger = await installFocusAnchor(page, "mfp20-ai-settings-trigger", "Open AI settings harness");
      await page.evaluate(() => window.dispatchEvent(new Event("ai:openKeys")));
      const dialog = page.getByRole("dialog", { name: "Settings" });
      await expect(dialog).toBeVisible();
      return { dialog, trigger };
    },
  },
  {
    name: "Unsaved Changes",
    axeSelector: '[role="dialog"][aria-labelledby="ucd-title"]',
    open: async (page) => {
      await resetWorkbenchState(page);
      await page.evaluate(async () => {
        const module = await import("/src/stores/editorStore.ts");
        const store = module.useEditorStore.getState();
        store.openTab({
          id: "mfp20-unsaved-file",
          name: "mfp20-unsaved.ts",
          type: "file",
          path: "/mfp20-unsaved.ts",
          content: "export const mfp20 = true;\n",
          language: "typescript",
          lastModified: new Date(),
        });
        const activeTabId = module.useEditorStore.getState().activeTabId;
        if (activeTabId) {
          module.useEditorStore.getState().markTabDirty(activeTabId, true);
        }
      });
      const trigger = page.getByRole("button", { name: "Close mfp20-unsaved.ts" });
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: /Save changes/i });
      await expect(dialog).toBeVisible();
      return { dialog, trigger };
    },
  },
  {
    name: "Map Start",
    axeSelector: '[data-testid="map-start-dialog"]',
    expectFocusRestore: false,
    open: async (page) => {
      await resetWorkbenchState(page);
      const trigger = await installFocusAnchor(page, "mfp20-map-start-trigger", "Open map start harness");
      await page.evaluate(async () => {
        const module = await import("/src/stores/useMapExplorerStore.ts");
        module.useMapExplorerStore.getState().open();
      });
      await expect(page.getByRole("dialog", { name: "Map Explorer" }).first()).toBeVisible();
      const dialog = page.getByTestId("map-start-dialog");
      await expect(dialog).toBeVisible();
      return { dialog, trigger };
    },
  },
  {
    name: "Map Service",
    axeSelector: '[data-testid="map-service-dialog"]',
    open: async (page) => {
      await resetWorkbenchState(page);
      const mapExplorer = await openMapExplorer(page);
      const trigger = mapExplorer.getByTestId("map-premium-menu-add-data");
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await trigger.click();
      const menu = page.getByTestId("map-premium-menu-content-add-data");
      await expect(menu).toBeVisible();
      await menu.getByTestId("map-toolbar-command-services-wms").click();
      const dialog = page.getByRole("dialog", { name: "External map services" });
      await expect(dialog).toBeVisible();
      return { dialog, trigger };
    },
  },
];

test.describe("MFP-20 app modal accessibility guardrails @a11y", () => {
  for (const modal of appModalProbes) {
    test(`${modal.name} has axe, Escape, focus-restore, and 320px reflow coverage`, async ({ page }) => {
      await page.setViewportSize({ width: 1680, height: 1100 });
      const { dialog, trigger } = await modal.open(page);

      await expectNoAxeViolations(page, modal.axeSelector, "serious");
      await expectDialogFitsViewport(page, dialog);
      await page.setViewportSize({ width: 1680, height: 1100 });
      await expect(dialog).toBeVisible();
      await focusFirstDialogButton(dialog);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden({ timeout: 15000 });

      if (modal.expectFocusRestore !== false) {
        await expect(trigger).toBeFocused();
      }
    });
  }
});

test.describe("Prompt 40 shell focus hardening @a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("terminal shell controls keep visible focus in default and forced-colors modes", async ({ page }) => {
    const shellSelect = await openIdeTerminal(page);

    await shellSelect.focus();
    await expect(shellSelect).toBeFocused();
    await expectVisibleFocusIndicator(page);

    await page.keyboard.press("Tab");
    const newTerminalButton = page.getByRole("button", { name: /New terminal session/i });
    await expect(newTerminalButton).toBeFocused();
    await expectVisibleFocusIndicator(page);
    await expectNoAxeViolations(page, ".syn-terminal-container");

    await page.emulateMedia({ forcedColors: "active" });
    await shellSelect.focus();
    await expect(shellSelect).toBeFocused();
    await expectVisibleFocusIndicator(page);

    await page.keyboard.press("Tab");
    await expect(newTerminalButton).toBeFocused();
    await expectVisibleFocusIndicator(page);
  });

  test("legacy neural glass cards preserve visible keyboard focus", async ({ page }) => {
    await page.evaluate(() => {
      (window as Window & { e2e?: { setView?: (view: "homepage") => void } }).e2e?.setView?.("homepage");
    });

    const primaryCard = page.getByRole("button", { name: /Multi.?Model Orchestration/i });
    await expect(primaryCard).toBeVisible();
    await primaryCard.focus();
    await expect(primaryCard).toBeFocused();
    await expectVisibleFocusIndicator(page);
    await expectNoAxeViolations(page, '[data-component="neural-glass-card-final"]');
  });
});

test.describe("Prompt 03 Map Explorer accessibility @a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("map modal exposes skip navigation, keyboard map focus, close control, and no serious axe issues", async ({ page }) => {
    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" });
    await expect(mapExplorer).toBeVisible();

    const skipLink = mapExplorer.getByRole("link", { name: "Skip to interactive map canvas" });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");

    const mapCanvas = mapExplorer.getByRole("application", { name: /Interactive map canvas/i });
    await expect(mapCanvas).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("+");
    await page.keyboard.press("R");

    await expectNoAxeViolations(page, '[role="dialog"][aria-labelledby="map-explorer-title"]', "minor");

    const closeExplorer = mapExplorer.getByRole("button", { name: "Close map explorer (Escape)" });
    await closeExplorer.focus();
    await expect(closeExplorer).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(mapExplorer).toBeHidden();
  });

  test("every opened dialog reports a non-empty accessible name (MFP-14)", async ({ page }) => {
    // The Urban Analytics Workbench shell is itself a named role=dialog.
    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await expect(urbanModal).toHaveAccessibleName(/\S/);

    // Opening Map Explorer surfaces a second dialog — it too must be named.
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" });
    await expect(mapExplorer).toBeVisible();
    await expect(mapExplorer).toHaveAccessibleName(/\S/);
  });
});

test.describe("Prompt 55 Map Explorer accessibility matrix @a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("keyboard-only path reaches import, inspect, QA, and command palette with scoped Escape", async ({ page }) => {
    await seedPrompt20Layer(page);
    const mapExplorer = await openMapExplorerFromStore(page);

    const dataActivity = mapExplorer.getByTestId("activity-btn-data");
    await dataActivity.focus();
    await expect(dataActivity).toBeFocused();
    await page.keyboard.press("Enter");

    const browseSource = mapExplorer.getByTestId("catalog-browse-source");
    await expect(browseSource).toBeVisible();
    await browseSource.focus();
    await page.keyboard.press("Enter");

    const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
    await expect(importHub).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(importHub).toBeHidden();
    await expect(mapExplorer).toBeVisible();

    const layersActivity = mapExplorer.getByTestId("activity-btn-layers");
    await layersActivity.focus();
    await page.keyboard.press("Enter");

    const layerActions = mapExplorer.getByTestId("map-layer-actions-summary").first();
    await expect(layerActions).toBeVisible();
    await layerActions.focus();
    await expect(layerActions).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(layerActions).toHaveAttribute("aria-expanded", "true");

    const inspectLayer = mapExplorer.getByTestId("map-layer-inspect-trigger").first();
    await expect(inspectLayer).toBeVisible();
    await inspectLayer.focus();
    await page.keyboard.press("Enter");

    const inspector = mapExplorer.getByTestId("map-inspector-host");
    await expect(inspector).toBeVisible();
    await expect(inspector).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(inspector).toBeHidden();
    await expect(inspectLayer).toBeFocused();

    const qaActivity = mapExplorer.getByTestId("activity-btn-qa");
    await expect(qaActivity).toBeVisible();
    await qaActivity.focus();
    await expect(qaActivity).toBeFocused();
    await qaActivity.press("Enter");

    const rightDock = page.getByTestId("map-right-dock-host");
    await expect(rightDock).toBeVisible();
    await expect(page.getByRole("region", { name: "Map QA problems" })).toBeVisible();

    const closeRightDock = rightDock.getByRole("button", { name: "Close right dock" });
    await closeRightDock.focus();
    await expect(closeRightDock).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(rightDock).toBeHidden();
    await expect(qaActivity).toBeFocused();

    await page.keyboard.press("Control+K");

    const palette = page.getByRole("dialog", { name: "Map command palette" });
    await expect(palette).toBeVisible();
    await palette.getByLabel("Search map commands").fill("qa");
    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();
    await expect(mapExplorer).toBeVisible();
    await expect(qaActivity).toBeFocused();

    await page.emulateMedia({ forcedColors: "active" });
    await expect(qaActivity).toHaveAttribute("aria-pressed", "true");
    await page.emulateMedia({ forcedColors: "none" });
    await expectNoAxeViolations(page, '[role="dialog"][aria-labelledby="map-explorer-title"]', "serious");
  });
});

test.describe("Prompt 39 accessibility audit @a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("critical workbench flows have no serious axe violations", async ({ page }) => {
    const urbanModal = await openWorkflowsWorkspace(page);

    await openWorkflowById(urbanModal, "accessibility");
    await expectNoAxeViolations(page, '[data-testid="workflow-accessibility-root"]');

    const compositeFlow = await openWorkflowById(urbanModal, "indicator_composite");
    await clickFlowNext(compositeFlow, 4);
    await triggerDomClick(compositeFlow.getByRole("radio", { name: /^geometric$/i }));
    await expectNoAxeViolations(page, '[data-testid="workflow-indicator_composite-root"]');

    await openWorkflowById(urbanModal, "change_detection");
    await expectNoAxeViolations(page, '[data-testid="workflow-change_detection-root"]');

    const flow = await openWorkflowById(urbanModal, "scenario_comparison");
    await clickFlowNext(flow, 5);
    await expectNoAxeViolations(page, '[data-testid="workflow-scenario_comparison-root"]');

    await resetWorkbenchState(page);
    const reviewModal = await openWorkflowsWorkspace(page);
    await publishScenarioComparisonRun(reviewModal);
    const reviewFlow = await openWorkflowById(reviewModal, "review");
    await triggerDomClick(reviewFlow.getByRole("radio").first());
    await clickFlowNext(reviewFlow, 2);
    await expectNoAxeViolations(page, '[data-testid="workflow-review-root"]');
  });

  test("keyboard navigation and focus order remain operable across five major flows", async ({ page }) => {
    const urbanModal = await openWorkflowsWorkspace(page);

    const accessibilityFlow = await openWorkflowById(urbanModal, "accessibility");
    const walkMode = accessibilityFlow.getByRole("radio", { name: /Walk \(avg 5 km\/h/i });
    const cycleMode = accessibilityFlow.getByRole("radio", { name: /Cycle \(avg 15 km\/h/i });
    await walkMode.focus();
    await expect(walkMode).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(cycleMode).toBeFocused();
    await expect(cycleMode).toBeChecked();
    await expectVisibleFocusIndicator(page);

    const compositeFlow = await openWorkflowById(urbanModal, "indicator_composite");
    const scenarioLabel = compositeFlow.getByRole("textbox", { name: /Scenario label/i });
    const reportTitle = compositeFlow.getByRole("textbox", { name: /Report \/ layer title/i });
    await scenarioLabel.focus();
    await expect(scenarioLabel).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(reportTitle).toBeFocused();
    await expectVisibleFocusIndicator(page);

    const changeDetectionFlow = await openWorkflowById(urbanModal, "change_detection");
    const t0Source = changeDetectionFlow.getByRole("textbox", { name: /^Data source$/i });
    const t0Date = changeDetectionFlow.getByRole("textbox", { name: /Date \/ period/i });
    const t0Description = changeDetectionFlow.getByRole("textbox", { name: /T0 description/i });
    await t0Source.focus();
    await expect(t0Source).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(t0Date).toBeFocused();
    await expectVisibleFocusIndicator(page);
    await page.keyboard.press("Tab");
    await expect(t0Description).toBeFocused();
    await expectVisibleFocusIndicator(page);

    const scenarioFlow = await openWorkflowById(urbanModal, "scenario_comparison");
    const baselineName = scenarioFlow.getByRole("textbox", { name: /Baseline name/i });
    const baselineDescription = scenarioFlow.getByRole("textbox", { name: /Baseline description/i });
    await baselineName.focus();
    await expect(baselineName).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(baselineDescription).toBeFocused();
    await expectVisibleFocusIndicator(page);

    await resetWorkbenchState(page);
    const reviewModal = await openWorkflowsWorkspace(page);
    await publishScenarioComparisonRun(reviewModal);
    const reviewFlow = await openWorkflowById(reviewModal, "review");
    await triggerDomClick(reviewFlow.getByRole("radio").first());
    await clickFlowNext(reviewFlow, 2);
    const reviewerNotes = reviewFlow.getByRole("textbox", { name: /Reviewer Notes/i });
    const firstQualityFlag = reviewFlow.getByRole("checkbox", { name: /Data quality verified/i });
    await reviewerNotes.focus();
    await expect(reviewerNotes).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(firstQualityFlag).toBeFocused();
    await expectVisibleFocusIndicator(page);
  });
});
