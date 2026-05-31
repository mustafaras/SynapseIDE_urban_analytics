import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, setFormValue, triggerDomClick } from "./helpers/urbanAnalytics";

test.describe("Report builder flow", () => {
  test("launches the workbench and inserts an inline citation into a report", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const urbanModal = await openUrbanAnalyticsWorkbench(page);

    const reportTab = urbanModal.getByTestId("cp-tab-report");
    await expect(reportTab).toBeVisible();
    await triggerDomClick(reportTab);
    await expect(reportTab).toHaveAttribute("aria-selected", "true");

    const builder = urbanModal.getByRole("region", { name: "Structured report builder" }).first();
    await expect(builder).toBeVisible();

    await setFormValue(builder.getByLabel("Report Name"), "Playwright Report");

    const firstParagraph = builder.getByLabel("Paragraph 1").first();
    await setFormValue(firstParagraph, "This report validates corridor heat risk trends.");

    await setFormValue(builder.getByLabel("Search References"), "World Cities Report 2024");
    await triggerDomClick(builder.getByRole("button", { name: /World Cities Report 2024/i }));
    await triggerDomClick(builder.getByRole("button", { name: "Insert in Body" }));

    await expect(urbanModal.getByText(/Inserted World Cities Report 2024 into paragraph 1\./)).toBeVisible();

    await triggerDomClick(builder.getByRole("button", { name: "Save" }));
    await expect(builder.getByText(/^Saved Playwright Report$/)).toBeVisible();

    const preview = urbanModal.getByTestId("report-preview");
    await expect(preview).toContainText("Playwright Report");
    await expect(preview).toContainText("This report validates corridor heat risk trends.");
    await expect(preview).toContainText("UN-Habitat");
    await expect(preview).toContainText("World Cities Report 2024");
  });
});
