import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

const ALL_RELEASE_FLOW_IDS = [
  "site_suitability",
  "accessibility",
  "change_detection",
  "emerging_hot_spot",
  "urban_morphology",
  "object_detection",
  "indicator_composite",
  "vulnerability",
  "equity_audit",
  "cityjson_loader",
  "voxcity_3d",
  "sunlight_sim",
  "facility_optimisation",
  "urban_growth_ca",
  "system_dynamics",
  "scenario_comparison",
  "review",
] as const;

async function openToolboxWorkspace(page: Page): Promise<Locator> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
  await expect(toolboxTab).toBeVisible();
  await triggerDomClick(toolboxTab);
  await expect(toolboxTab).toHaveAttribute("aria-selected", "true");
  await expect(urbanModal.getByTestId("tools-card-capabilities")).toBeVisible();
  return urbanModal;
}

async function expectPanelToBePopulated(locator: Locator, minimumCharacters = 24): Promise<void> {
  await expect(locator).toBeVisible();
  await expect
    .poll(async () => {
      const text = (await locator.textContent()) ?? "";
      return text.replace(/\s+/g, " ").trim().length;
    })
    .toBeGreaterThan(minimumCharacters);
}

test.describe("Prompt 43 release candidate UI smoke @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("all top-level workbench tabs remain reachable and populated", async ({ page }) => {
    const urbanModal = await openUrbanAnalyticsWorkbench(page);

    const tabAssertions: Array<{
      tabTestId: string;
      assertVisible: () => Promise<void>;
    }> = [
      {
        tabTestId: "cp-tab-projects",
        assertVisible: async () => expectPanelToBePopulated(urbanModal.locator("#panel-projects")),
      },
      {
        tabTestId: "cp-tab-new-project",
        assertVisible: async () => expectPanelToBePopulated(urbanModal.locator("#panel-new-project")),
      },
      {
        tabTestId: "cp-tab-methods",
        assertVisible: async () => expectPanelToBePopulated(urbanModal.locator("#panel-methods")),
      },
      {
        tabTestId: "cp-tab-education",
        assertVisible: async () => expectPanelToBePopulated(urbanModal.locator("#panel-education")),
      },
      {
        tabTestId: "cp-tab-report",
        assertVisible: async () => expectPanelToBePopulated(urbanModal.locator("#panel-report")),
      },
      {
        tabTestId: "cp-tab-workflows",
        assertVisible: async () => expect(urbanModal.getByTestId("flow-tile-site_suitability")).toBeVisible(),
      },
      {
        tabTestId: "cp-tab-dashboard",
        assertVisible: async () => expectPanelToBePopulated(urbanModal.locator("#panel-dashboard")),
      },
      {
        tabTestId: "cp-tab-toolbox",
        assertVisible: async () => expect(urbanModal.getByTestId("tools-card-capabilities")).toBeVisible(),
      },
    ];

    for (const entry of tabAssertions) {
      const tab = urbanModal.getByTestId(entry.tabTestId);
      await expect(tab).toBeVisible();
      await triggerDomClick(tab);
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await entry.assertVisible();
    }
  });

  test("workflow library opens every release workflow surface", async ({ page }) => {
    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    for (const flowId of ALL_RELEASE_FLOW_IDS) {
      const tile = urbanModal.getByTestId(`flow-tile-${flowId}`);
      await expect(tile).toBeVisible();
      await tile.scrollIntoViewIfNeeded();
      await triggerDomClick(tile);
      await expect(urbanModal.getByTestId(`workflow-${flowId}-root`)).toBeVisible();
    }
  });

  test("capabilities overview navigates release surfaces and toolbox runtime labs", async ({ page }) => {
    const urbanModal = await openToolboxWorkspace(page);
    const overview = urbanModal.getByTestId("tools-capabilities-overview");
    await expect(overview).toBeVisible();

    await triggerDomClick(urbanModal.getByTestId("capabilities-open-map-explorer"));
    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" });
    await expect(mapExplorer).toBeVisible();
    await expect(page.getByTestId("map-top-command-surface")).toBeVisible();
    await expect(page.getByTestId("map-command-center")).toHaveAttribute("data-command-registry-count", /\d+/);
    await triggerDomClick(page.getByRole("button", { name: "Close map explorer (Escape)" }));
    await expect(mapExplorer).toBeHidden();

    await triggerDomClick(urbanModal.getByTestId("capabilities-open-report"));
    await expect(urbanModal.getByTestId("cp-tab-report")).toHaveAttribute("aria-selected", "true");
    await expectPanelToBePopulated(urbanModal.locator("#panel-report"));

    await triggerDomClick(urbanModal.getByTestId("cp-tab-toolbox"));
    await expect(urbanModal.getByTestId("tools-card-capabilities")).toBeVisible();

    await triggerDomClick(urbanModal.getByTestId("capabilities-flow-object_detection"));
    await expect(urbanModal.getByTestId("cp-tab-workflows")).toHaveAttribute("aria-selected", "true");
    await expect(urbanModal.getByTestId("workflow-object_detection-root")).toBeVisible();

    await triggerDomClick(urbanModal.getByTestId("cp-tab-toolbox"));
    await expect(urbanModal.getByTestId("tools-card-capabilities")).toBeVisible();

    await triggerDomClick(urbanModal.getByTestId("capabilities-tool-geoai"));
    await expect(urbanModal.getByTestId("tools-card-geoai")).toBeInViewport();
    await expect(urbanModal.getByTestId("tools-card-geoai")).toContainText(/GeoAI Lab/i);

    await triggerDomClick(urbanModal.getByTestId("capabilities-tool-spatial-index"));
    await expect(urbanModal.getByTestId("tools-card-spatial-index")).toBeInViewport();
    await expect(urbanModal.getByTestId("tools-card-spatial-index")).toContainText(/Spatial Index Lab/i);

    await triggerDomClick(urbanModal.getByTestId("capabilities-tool-streaming"));
    await expect(urbanModal.getByTestId("tools-card-streaming")).toBeInViewport();
    await expect(urbanModal.getByTestId("tools-card-streaming")).toContainText(/Streaming Runtime/i);

    await triggerDomClick(urbanModal.getByTestId("capabilities-tool-coverage"));
    await expect(urbanModal.getByTestId("tools-card-coverage")).toBeInViewport();
    await expect(urbanModal.getByTestId("tools-card-coverage")).toContainText(/Analytical QA Coverage/i);

    await triggerDomClick(urbanModal.getByTestId("capabilities-tool-indicators"));
    await expect(urbanModal.getByTestId("tools-card-indicators")).toBeInViewport();
    await expect(urbanModal.getByTestId("tools-card-indicators")).toContainText(/Indicator Catalog/i);
  });
});
