import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/accessibility";
import {
  clickFlowNext,
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
    const clearTerminalButton = page.getByRole("button", { name: /Clear terminal/i });
    await expect(clearTerminalButton).toBeFocused();
    await expectVisibleFocusIndicator(page);
    await expectNoAxeViolations(page, ".syn-terminal-container");

    await page.emulateMedia({ forcedColors: "active" });
    await shellSelect.focus();
    await expect(shellSelect).toBeFocused();
    await expectVisibleFocusIndicator(page);

    await page.keyboard.press("Tab");
    await expect(clearTerminalButton).toBeFocused();
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

  test("map modal exposes skip navigation, keyboard map focus, Escape close, and no serious axe issues", async ({ page }) => {
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

    await page.keyboard.press("Escape");
    await expect(mapExplorer).toBeHidden();
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