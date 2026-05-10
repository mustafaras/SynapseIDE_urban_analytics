import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, setFormValue, triggerDomClick } from "./helpers/urbanAnalytics";

test.describe("Prompt 36 indicator catalog", () => {
  test("opens from workflows, computes an indicator, and stages it into dashboard and report views", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    const activeWorkflowButton = urbanModal.getByRole("button", { name: "Active Workflow" });
    await triggerDomClick(activeWorkflowButton);

    const indicatorCatalogBridge = urbanModal.getByRole("button", { name: "Indicator Catalog" }).first();
    await expect(indicatorCatalogBridge).toBeVisible();
    await triggerDomClick(indicatorCatalogBridge);

    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    const indicatorPanel = urbanModal.getByTestId("indicator-catalog-panel");
    await expect(indicatorPanel).toBeVisible();
    await expect(urbanModal.getByTestId("tools-card-indicators")).toBeVisible();

    await triggerDomClick(indicatorPanel.getByRole("button", { name: "Transport & Mobility" }));
    await setFormValue(indicatorPanel.getByRole("searchbox", { name: "Search indicators" }), "mode split");

    const modeSplitCard = indicatorPanel.locator('[data-indicator-kind="modeSplit"]');
    await expect(modeSplitCard).toBeVisible();
    await triggerDomClick(modeSplitCard);

    await expect(indicatorPanel).toContainText("Mode Split");
    await expect(indicatorPanel).toContainText("shareₘ = tripsₘ / Σ trips");
    await triggerDomClick(indicatorPanel.getByRole("button", { name: "Compute indicator" }));

    await expect(indicatorPanel).toContainText("Mode Split computed successfully.");
    await expect(indicatorPanel).toContainText("Active and transit oriented");
    await expect(indicatorPanel).toContainText("23.8% walk · 6% cycle · 31.8% transit · 38.4% car");

    await triggerDomClick(indicatorPanel.getByRole("button", { name: "Add to Dashboard" }));

    const dashboardTab = urbanModal.getByTestId("cp-tab-dashboard");
    await expect(dashboardTab).toHaveAttribute("aria-selected", "true");
    await expect(urbanModal).toContainText("Added Mode Split Components to the dashboard.");
    const insertedWidget = urbanModal.locator('[data-widget-binding-id="computed-indicator:modeSplit:series"]');
    await expect(insertedWidget).toBeVisible();
    await expect(insertedWidget).toContainText("Mode Split Components");

    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    await triggerDomClick(indicatorPanel.getByRole("button", { name: "Transport & Mobility" }));
    await setFormValue(indicatorPanel.getByRole("searchbox", { name: "Search indicators" }), "mode split");
    await expect(modeSplitCard).toBeVisible();
    await triggerDomClick(modeSplitCard);
    await expect(indicatorPanel).toContainText("23.8% walk · 6% cycle · 31.8% transit · 38.4% car");

    await triggerDomClick(indicatorPanel.getByRole("button", { name: "Add to Report" }));

    const reportTab = urbanModal.getByTestId("cp-tab-report");
    await expect(reportTab).toHaveAttribute("aria-selected", "true");

    const preview = urbanModal.getByTestId("report-preview");
    await expect(preview).toContainText("Mode Split — Analytical Readout");
    await expect(preview).toContainText("Mode Split was computed at 23.8% walk · 6% cycle · 31.8% transit · 38.4% car.");
    await expect(preview).toContainText("Classification: Active and transit oriented.");
  });
});