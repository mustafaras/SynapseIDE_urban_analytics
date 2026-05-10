import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  clickFlowNext,
  expectDownloadFromAction,
  openWorkflowById,
  openWorkflowsWorkspace,
  resetWorkbenchState,
  setCheckedState,
  setFormValue,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function startFlow(page: Page, flowId: string): Promise<{ urbanModal: Locator; flow: Locator }> {
  const urbanModal = await openWorkflowsWorkspace(page);
  const flow = await openWorkflowById(urbanModal, flowId);
  return { urbanModal, flow };
}

test.describe("Prompt 38 analytical journeys @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("site suitability computes, runs sensitivity, exports, and saves", async ({ page }) => {
    const { flow } = await startFlow(page, "site_suitability");

    await clickFlowNext(flow);
    await setFormValue(flow.getByPlaceholder(/Dataset name or layer path/i).nth(0), "transit_access_surface.tif");
    await setFormValue(flow.getByPlaceholder(/Dataset name or layer path/i).nth(1), "land_use_compatibility.geojson");

    await clickFlowNext(flow);
    await triggerDomClick(flow.getByRole("radio", { name: /Manual/i }));

    await clickFlowNext(flow);
    await triggerDomClick(flow.getByRole("button", { name: /Add Constraint/i }));
    await setFormValue(flow.getByPlaceholder(/slope/i).last(), "Slope under 15 degrees");

    await clickFlowNext(flow);
    await triggerDomClick(flow.getByRole("button", { name: /Run Weighted Overlay/i }));
    await expect(flow.getByTestId("site-suitability-summary")).toBeVisible();

    await clickFlowNext(flow);
    await setFormValue(flow.getByRole("spinbutton", { name: /Number of Monte Carlo runs/i }), "800");
    await triggerDomClick(flow.getByRole("button", { name: /Run Sensitivity Analysis/i }));
    await expect(flow).toContainText("Top shortlist:");

    await clickFlowNext(flow);
    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: "Export Map" }));
    });
    await triggerDomClick(flow.getByRole("button", { name: "Save Results" }));
    await expect(flow.getByTestId("site-suitability-save-status")).toContainText(/saved/i);
  });

  test("accessibility analysis computes, exports, and saves", async ({ page }) => {
    const { flow } = await startFlow(page, "accessibility");

    await triggerDomClick(flow.getByRole("radio", { name: /Transit \(GTFS schedule/i }));
    await clickFlowNext(flow);

    await setFormValue(flow.locator('input[type="range"]').first(), "30");
    await clickFlowNext(flow);

    await setCheckedState(flow.getByRole("checkbox", { name: /transit stop/i }), true);
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /Population-weighted/i }));
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /By income quintile/i }));
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("button", { name: /Compute Isochrones/i }));
    await expect(flow.getByTestId("accessibility-summary")).toBeVisible();

    await clickFlowNext(flow);
    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: /Export Isochrone Map/i }));
    });
    await triggerDomClick(flow.getByRole("button", { name: "Save Results" }));
    await expect(flow.getByTestId("accessibility-save-status")).toContainText(/saved/i);
  });

  test("vulnerability assessment computes, exports statistics, and saves", async ({ page }) => {
    const { flow } = await startFlow(page, "vulnerability");

    await triggerDomClick(flow.getByRole("radio", { name: /^Heat/i }));
    await clickFlowNext(flow);

    await setFormValue(flow.getByRole("textbox", { name: /Hazard data source/i }), "district_heat_grid_2024.tif");
    await clickFlowNext(flow, 4);

    await triggerDomClick(flow.getByRole("button", { name: /Compute Vulnerability Index/i }));
    await expect(flow.getByTestId("vulnerability-summary")).toBeVisible();

    await clickFlowNext(flow);
    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: "Export Statistics" }));
    });
    await triggerDomClick(flow.getByRole("button", { name: "Save Results" }));
    await expect(flow.getByTestId("vulnerability-save-status")).toContainText(/saved/i);
  });

  test("composite indicator builder publishes and exports workflow artifacts", async ({ page }) => {
    const { flow } = await startFlow(page, "indicator_composite");

    await setFormValue(flow.getByRole("textbox", { name: /Scenario label/i }), "Playwright composite benchmark");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /^median$/i }));
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /^rank$/i }));
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /^expert$/i }));
    await setFormValue(flow.locator('input[type="range"]').first(), "55");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /^geometric$/i }));
    await clickFlowNext(flow);

    await setFormValue(flow.getByRole("spinbutton", { name: /^Runs$/i }), "250");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("button", { name: "Publish to map & completed runs" }));
    await expect(flow).toContainText("Preview published to the map explorer and completed-run review.");

    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: "Export workflow JSON" }));
    });
  });

  test("scenario comparison recalculates, exports, and publishes to review", async ({ page }) => {
    const { flow } = await startFlow(page, "scenario_comparison");

    await setFormValue(flow.getByRole("textbox", { name: /Baseline name/i }), "Playwright baseline frame");
    await clickFlowNext(flow);

    await setFormValue(flow.getByLabel("Scenario name").first(), "Transit-first retrofit");
    await clickFlowNext(flow, 2);

    await triggerDomClick(flow.getByRole("button", { name: /Recalculate full comparison/i }));
    await expect(flow.getByRole("button", { name: /Refresh snapshot/i })).toBeVisible({ timeout: 60000 });

    await clickFlowNext(flow);
    await setFormValue(flow.getByPlaceholder(/Record which scenario leads/i), "Transit-first retrofit improves accessibility while preserving a reviewable trade-off profile.");
    await clickFlowNext(flow);

    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: "Export summary JSON" }));
    });
    await triggerDomClick(flow.getByRole("button", { name: "Publish to review" }));
    await expect(flow.getByTestId("scenario-comparison-publish-status")).toContainText(/published/i);
  });

  test("equity audit computes, exports, and saves a completed run", async ({ page }) => {
    const { flow } = await startFlow(page, "equity_audit");

    await setFormValue(flow.getByRole("textbox", { name: /Demographic data source/i }), "ACS 2023 equity extract");
    await setCheckedState(flow.getByRole("checkbox", { name: /income/i }).first(), true);
    await clickFlowNext(flow);

    await setFormValue(flow.getByRole("textbox", { name: /Service \/ amenity layer/i }), "Community health clinics");
    await setFormValue(flow.getByRole("textbox", { name: /Service type/i }), "amenity");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /District \/ Borough/i }));
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /Atkinson Index/i }));
    await setFormValue(flow.locator('input[type="range"]').first(), "70");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("button", { name: /Compute Equity Scores/i }));
    await expect(flow.getByTestId("equity-audit-summary")).toBeVisible();

    await clickFlowNext(flow);
    await setFormValue(flow.getByRole("slider", { name: /Gap threshold/i }), "45");
    await clickFlowNext(flow);

    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: "Export JSON" }));
    });
    await triggerDomClick(flow.getByRole("button", { name: "Save Audit Run" }));
    await expect(flow.getByTestId("equity-audit-save-status")).toContainText(/saved/i);
  });

  test("change detection computes change map, validation sample, and exports", async ({ page }) => {
    const { flow } = await startFlow(page, "change_detection");

    await setFormValue(flow.getByRole("textbox", { name: /Data source/i }), "Sentinel-2 spring composite");
    await setFormValue(flow.getByRole("textbox", { name: /Date \/ period/i }), "2019-05");
    await clickFlowNext(flow);

    await setFormValue(flow.getByRole("textbox", { name: /Data source/i }), "Sentinel-2 spring composite 2024");
    await setFormValue(flow.getByRole("textbox", { name: /Date \/ period/i }), "2024-05");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /Image Differencing/i }));
    await clickFlowNext(flow);

    await setFormValue(flow.locator('input[type="range"]').first(), "20");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("button", { name: /Compute Change Map/i }));
    await expect(flow).toContainText("Accuracy Assessment");
    await setFormValue(flow.getByRole("spinbutton", { name: /Validation sample size/i }), "250");
    await triggerDomClick(flow.getByRole("button", { name: /Generate Validation Sample/i }));
    await expect(flow.getByText(/Overall accuracy:/i)).toBeVisible({ timeout: 90000 });

    await clickFlowNext(flow);
    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: "Download Validation CSV" }));
    });
  });

  test("completed run review annotates and exports a published scenario comparison", async ({ page }) => {
    const urbanModal = await openWorkflowsWorkspace(page);
    let flow = await openWorkflowById(urbanModal, "scenario_comparison");

    await setFormValue(flow.getByRole("textbox", { name: /Baseline name/i }), "Review bootstrap baseline");
    await clickFlowNext(flow);

    await setFormValue(flow.getByLabel("Scenario name").first(), "Review-ready scenario");
    await clickFlowNext(flow, 2);

    await triggerDomClick(flow.getByRole("button", { name: /Recalculate full comparison/i }));
    await expect(flow.getByRole("button", { name: /Refresh snapshot/i })).toBeVisible({ timeout: 60000 });

    await clickFlowNext(flow);
    await setFormValue(flow.getByPlaceholder(/Record which scenario leads/i), "Scenario comparison promoted into the completed-run review flow for QA.");
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("button", { name: "Publish to review" }));
    await expect(flow.getByTestId("scenario-comparison-publish-status")).toContainText(/published/i);

    flow = await openWorkflowById(urbanModal, "review");
    await triggerDomClick(flow.getByRole("radio").first());
    await clickFlowNext(flow);
    await expect(flow).toContainText(/Scenario Comparison/i);

    await clickFlowNext(flow);
    await setFormValue(flow.getByPlaceholder(/Document observations, methodology concerns/i), "Completed run reviewed in Playwright for export fidelity.");
    await setCheckedState(flow.getByRole("checkbox", { name: /Results reviewed/i }), true);
    await clickFlowNext(flow);

    await triggerDomClick(flow.getByRole("radio", { name: /CSV — tabular data export/i }));
    await expect(flow).toContainText("Completed run reviewed in Playwright for export fidelity.");
    await expectDownloadFromAction(page, async () => {
      await triggerDomClick(flow.getByRole("button", { name: /Export CSV/i }));
    });
  });
});