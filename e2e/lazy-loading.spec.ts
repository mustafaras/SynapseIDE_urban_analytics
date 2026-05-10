import { expect, type Page, test } from "@playwright/test";

import { openUrbanAnalyticsWorkbench, resetWorkbenchState } from "./helpers/urbanAnalytics";

async function delayFirstRequest(page: Page, pattern: RegExp, delayMs: number): Promise<void> {
  let delayed = false;

  await page.route(pattern, async (route) => {
    if (!delayed) {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    await route.continue();
  });
}

test.describe("Prompt 41 lazy-loading regressions @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
  });

  test("urban analytics modal shows a visible loading fallback while the workbench chunk resolves", async ({ page }) => {
    await delayFirstRequest(page, /\/src\/features\/urbanAnalytics\/UrbanAnalyticsModal\.tsx(?:\?|$)/, 3000);
    await resetWorkbenchState(page);

    const openAnalyticsButton = page.getByRole("button", { name: "Open Urban Analytics" });
    await expect(openAnalyticsButton).toBeVisible();
    await openAnalyticsButton.click();

    const welcomeDialog = page.getByRole("dialog", { name: "Welcome to Urban Analytics Workbench" });
    await expect(welcomeDialog).toBeVisible();
    await welcomeDialog.getByRole("button", { name: /Got it, Let's Start/i }).click();

    await expect(page.getByTestId("urban-analytics-modal-loading")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Urban Analytics Workbench" })).toBeVisible();
  });

  test("education tab and dataset library show loading fallbacks instead of blank panels", async ({ page }) => {
    await delayFirstRequest(page, /\/src\/features\/education\/EducationModule\.tsx(?:\?|$)/, 900);
    await delayFirstRequest(page, /\/src\/features\/education\/DatasetLibraryBrowser\.tsx(?:\?|$)/, 900);
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("synapse:navigate", { detail: { tab: "Education" } }));
    });

    await expect(urbanModal.getByTestId("cp-lazy-fallback").first()).toBeVisible();
    await expect(urbanModal.getByTestId("education-module-root")).toBeVisible();

    await urbanModal.getByRole("button", { name: "Dataset Library" }).click();
    await expect(urbanModal.getByTestId("education-dataset-loading")).toBeVisible();
    await expect(urbanModal.getByTestId("education-dataset-root")).toBeVisible();
  });
});