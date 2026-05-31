import { expect, type FilePayload, type Page } from "@playwright/test";
import { triggerDomClick } from "./urbanAnalytics";

async function uploadLocalMapFile(page: Page, payload: FilePayload): Promise<void> {
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  const scopedFileInput = mapExplorer.locator('input[type="file"]').first();
  if (await scopedFileInput.count()) {
    await scopedFileInput.setInputFiles(payload);
    return;
  }

  await page.locator('input[type="file"]').first().setInputFiles(payload);
}

export async function chooseLocalMapImportFile(page: Page, payload: FilePayload): Promise<void> {
  const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
  await expect(importHub).toBeVisible();

  const [importChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    importHub.getByRole("button", { name: "Browse Local File" }).click(),
  ]);
  await importChooser.setFiles(payload);
}

export async function confirmImportSourcePreflight(page: Page): Promise<void> {
  const preflightDialog = page.getByRole("dialog", { name: "Import source preflight" });
  await expect(preflightDialog).toBeVisible();
  await triggerDomClick(preflightDialog.getByRole("button", { name: "Import Source" }));
  await expect(preflightDialog).toBeHidden();
}

export async function importLocalMapFileWithPreflight(page: Page, payload: FilePayload): Promise<void> {
  const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
  if (await importHub.isVisible().catch(() => false)) {
    await chooseLocalMapImportFile(page, payload);
  } else {
    await uploadLocalMapFile(page, payload);
  }
  await confirmImportSourcePreflight(page);
}
