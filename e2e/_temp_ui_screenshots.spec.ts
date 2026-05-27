import { expect, test, type Page } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

test("debug — check console errors when opening Map Explorer", async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 1100 });

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  await resetWorkbenchState(page);
  const urbanModal = await openUrbanAnalyticsWorkbench(page);

  await triggerDomClick(
    urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }),
  );
  await page.waitForTimeout(5000);

  console.log(`Console errors (${consoleErrors.length}):`);
  consoleErrors.slice(0, 10).forEach((e) => console.log("  ERR:", e.slice(0, 200)));

  await page.screenshot({ path: "e2e/__screens__/debug-errors.png" });
});
