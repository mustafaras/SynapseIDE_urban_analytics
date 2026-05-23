import { expect, type Locator, type Page } from "@playwright/test";

export const IDE_ENTRY_URL = "/?e2e=1&view=ide";

export async function resetWorkbenchState(page: Page): Promise<void> {
  await page.goto(IDE_ENTRY_URL);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto(IDE_ENTRY_URL);
}

export async function openUrbanAnalyticsWorkbench(page: Page): Promise<Locator> {
  const openAnalyticsButton = page.getByRole("button", { name: "Open Urban Analytics" });
  await expect(openAnalyticsButton).toBeVisible();
  await openAnalyticsButton.click();

  const welcomeDialog = page.getByRole("dialog", { name: "Welcome to Urban Analytics Workbench" });
  await expect(welcomeDialog).toBeVisible();
  await welcomeDialog.getByRole("button", { name: /Start Workbench/i }).click();
  await expect(welcomeDialog).toBeHidden();

  const urbanModal = page.getByRole("dialog", { name: "Urban Analytics Workbench" });
  await expect(urbanModal).toBeVisible();

  const closeDetailPanelButton = urbanModal.getByRole("button", { name: "Close detail panel" });
  if (await closeDetailPanelButton.isVisible().catch(() => false)) {
    await triggerDomClick(closeDetailPanelButton);
  }

  return urbanModal;
}

export async function openWorkflowsWorkspace(page: Page): Promise<Locator> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
  await expect(workflowsTab).toBeVisible();
  await triggerDomClick(workflowsTab);
  await expect(workflowsTab).toHaveAttribute("aria-selected", "true");
  return urbanModal;
}

export async function openWorkflowById(urbanModal: Locator, flowId: string): Promise<Locator> {
  const tile = urbanModal.getByTestId(`flow-tile-${flowId}`);
  await expect(tile).toBeVisible();
  await tile.scrollIntoViewIfNeeded();
  await triggerDomClick(tile);

  const flowRoot = urbanModal.getByTestId(`workflow-${flowId}-root`);
  await expect(flowRoot).toBeVisible();
  return flowRoot;
}

export async function clickFlowNext(flowRoot: Locator, count = 1): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const nextButton = flowRoot.getByRole("button", { name: /^(Next|Next →)$/i });
    await expect(nextButton).toBeVisible();
    await nextButton.scrollIntoViewIfNeeded();
    await triggerDomClick(nextButton);
  }
}

export async function setCheckedState(locator: Locator, checked: boolean): Promise<void> {
  const current = await locator.isChecked();
  if (current === checked) {
    return;
  }
  await locator.scrollIntoViewIfNeeded();
  await triggerDomClick(locator);
}

export async function triggerDomClick(locator: Locator): Promise<void> {
  await locator.evaluate((node: HTMLElement) => node.click());
}

export async function setFormValue(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((node, nextValue) => {
    const field = node as HTMLInputElement | HTMLTextAreaElement;
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(field, nextValue);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export async function expectDownloadFromAction(page: Page, action: () => Promise<void>): Promise<void> {
  const downloadPromise = page.waitForEvent("download");
  await action();
  const download = await downloadPromise;
  await expect(download.suggestedFilename()).not.toHaveLength(0);
}