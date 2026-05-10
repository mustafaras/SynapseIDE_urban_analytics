import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

test.describe("Map Explorer PNG image export", () => {
  test("opens the full image export dialog from the visible toolbar UI", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await triggerDomClick(mapExplorer.getByRole("button", { name: "Save, load, and export map outputs" }));
    await triggerDomClick(page.getByRole("menu", { name: "Export commands" }).getByRole("button", {
      name: "Export current map as PNG",
    }));

    const dialog = page.getByRole("dialog", { name: "Publication map export options" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Publication Composition" })).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Format" })).toHaveValue("pdf");
    await dialog.getByRole("combobox", { name: "Format" }).selectOption("png");
    await expect(dialog.getByRole("combobox", { name: "Format" })).toHaveValue("png");

    await dialog.getByRole("combobox", { name: "DPI" }).selectOption("300");
    await expect(dialog.getByRole("combobox", { name: "DPI" })).toHaveValue("300");

    await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("A4 briefing export");
    await expect(dialog.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("A4 briefing export");

    await expect(dialog.getByRole("checkbox", { name: "Scale bar" })).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "North arrow" })).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "Attribution" })).toBeVisible();
    await expect(dialog.getByText("Preview", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Download PNG" })).toBeVisible();
  });
});
