import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, setFormValue, triggerDomClick } from "./helpers/urbanAnalytics";

test.describe("Education workspace", () => {
  test("navigates education paths, persists progress, and launches explainers from workflows", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    let urbanModal = await openUrbanAnalyticsWorkbench(page);

    const educationTab = urbanModal.getByTestId("cp-tab-education");
    await triggerDomClick(educationTab);
    await expect(educationTab).toHaveAttribute("aria-selected", "true");
    await expect(urbanModal.getByTestId("education-module-root")).toBeVisible();

    const foundationsPath = urbanModal.getByTestId("education-path-foundations_urban_analytics");
    await expect(foundationsPath).toContainText("Foundations of Urban Analytics");
    await expect(foundationsPath).toContainText("0/8 modules complete");

    const firstModule = urbanModal.getByTestId("education-module-foundations.data_inventory_formats");
    await expect(firstModule).toContainText("Data Types and Formats");
    await triggerDomClick(firstModule.getByRole("button", { name: "Mark complete" }));

    await expect(firstModule).toContainText(/completed/i);
    await expect(foundationsPath).toContainText("1/8 modules complete");

    await page.reload();
    urbanModal = await openUrbanAnalyticsWorkbench(page);

    const reloadedEducationTab = urbanModal.getByTestId("cp-tab-education");
    await triggerDomClick(reloadedEducationTab);
    await expect(reloadedEducationTab).toHaveAttribute("aria-selected", "true");

    const reloadedFoundationsPath = urbanModal.getByTestId("education-path-foundations_urban_analytics");
    const reloadedFirstModule = urbanModal.getByTestId("education-module-foundations.data_inventory_formats");
    await expect(reloadedFoundationsPath).toContainText("1/8 modules complete");
    await expect(reloadedFirstModule).toContainText(/completed/i);

    const classificationModule = urbanModal.getByTestId("education-module-foundations.classification_schemes");
    await triggerDomClick(classificationModule.getByRole("button", { name: "Defend a classification scheme for grant triage" }));

    const exerciseWorkspace = urbanModal.getByTestId("education-exercise-workspace");
    await expect(exerciseWorkspace).toBeVisible();
    await expect(urbanModal.getByTestId("education-exercise-player-classification_scheme_argument")).toBeVisible();

    await urbanModal.getByRole("combobox", { name: "Learning path" }).selectOption("all");
    await urbanModal.getByRole("combobox", { name: "Module focus" }).selectOption("all");
    await triggerDomClick(urbanModal.getByTestId("education-exercise-category-calculator"));

    const hansenCard = urbanModal.getByTestId("education-exercise-card-hansen_accessibility_clinic_score");
    await expect(hansenCard).toBeVisible();
    await triggerDomClick(urbanModal.getByTestId("education-exercise-open-hansen_accessibility_clinic_score"));

    const hansenPlayer = urbanModal.getByTestId("education-exercise-player-hansen_accessibility_clinic_score");
    await expect(hansenPlayer).toBeVisible();
    await triggerDomClick(urbanModal.getByTestId("education-exercise-hint"));
    await expect(hansenPlayer).toContainText("An 8-minute clinic should still contribute a lot, but not its full 120 slots.");

    await setFormValue(hansenPlayer.getByRole("spinbutton", { name: "Accessibility score" }), "133.21");
    await setFormValue(
      hansenPlayer.getByRole("textbox", { name: "Policy interpretation" }),
      "Residents can reach more clinic service opportunity when travel friction stays lower.",
    );
    await triggerDomClick(urbanModal.getByTestId("education-exercise-submit"));

    await expect(hansenPlayer).toContainText("Mastery threshold met");
    await expect(hansenPlayer).toContainText("All rubric criteria were satisfied on the last submission.");
    await expect(urbanModal.getByTestId("education-exercise-history-0")).toContainText("Compute a Hansen clinic accessibility score");

    const datasetLibraryButton = urbanModal.getByRole("button", { name: "Dataset Library" });
    await triggerDomClick(datasetLibraryButton);
    const datasetLibrary = urbanModal.getByTestId("education-dataset-root");
    await expect(datasetLibrary).toBeVisible();
    await expect(datasetLibrary).toContainText("Teaching datasets for studio onboarding and benchmarking");
    await expect(urbanModal.getByTestId("education-dataset-card-london")).toBeVisible();

    const datasetSearch = datasetLibrary.getByRole("searchbox", { name: "Search dataset library" });
    await setFormValue(datasetSearch, "singapore");
    await expect(urbanModal.getByTestId("education-dataset-card-singapore")).toBeVisible();
    await expect(datasetLibrary).toContainText("EPSG:4326");
    await expect(datasetLibrary.getByTestId("education-dataset-manifest-singapore")).toBeVisible();
    await expect(datasetLibrary.getByTestId("education-dataset-brief-singapore")).toBeVisible();

    await triggerDomClick(urbanModal.getByTestId("education-dataset-load-singapore"));
    const mapExplorerDialog = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorerDialog).toBeVisible();
    await expect(page.getByTestId("toast").filter({ hasText: "Loaded Singapore teaching dataset with 3 map layers." }).first()).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: "Close map explorer (Escape)" }).first());

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("synapse:navigate", {
        detail: {
          tab: "Workflows",
          flowId: "scenario_comparison",
        },
      }));
    });

    const methodologyNoteButton = urbanModal.getByRole("button", { name: "Methodology note" }).first();
    await expect(methodologyNoteButton).toBeVisible();
    await triggerDomClick(methodologyNoteButton);

    const explainerDialog = page.getByRole("dialog", { name: "Scenario Comparison and Trade-Off Reasoning" });
    await expect(explainerDialog).toBeVisible();
    await expect(explainerDialog).toContainText("Absolute delta");
    await triggerDomClick(explainerDialog.getByRole("button", { name: "Open in Education Workspace" }));

    await expect(urbanModal.getByTestId("cp-tab-education")).toHaveAttribute("aria-selected", "true");
    await expect(urbanModal.getByTestId("education-module-root")).toContainText("Scenario Comparison and Trade-Off Reasoning");
  });
});