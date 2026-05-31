import { expect, test } from '@playwright/test';

import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  setFormValue,
  triggerDomClick,
} from './helpers/urbanAnalytics';

const LEGACY_PLACEHOLDERS = [
  'No methodology details yet.',
  'No data requirements specified.',
  'No code snippets available.',
  'No references listed.',
  'Curated methodology support is currently unavailable for this selection.',
  'Curated data guidance is currently unavailable for this selection.',
  'Curated code guidance is currently unavailable for this selection.',
  'Curated references are currently unavailable for this selection.',
];

test.describe('Prompt 11 right-panel fallbacks', () => {
  test('cards without authored code inherit related section guidance instead of placeholders', async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const methodsTab = urbanModal.getByTestId('cp-tab-methods');
    await triggerDomClick(methodsTab);
    await expect(methodsTab).toHaveAttribute('aria-selected', 'true');

    await setFormValue(urbanModal.getByRole('searchbox', { name: 'Search methods and tools' }), 'mode split');

    const modeSplitButton = urbanModal.getByRole('button', { name: 'Mode Split' }).first();
    await expect(modeSplitButton).toBeVisible();
    await triggerDomClick(modeSplitButton);

    await expect(urbanModal.locator('.rp-title')).toHaveText('Mode Split');

    const tablist = urbanModal.getByRole('tablist', { name: 'Content sections' });

    await triggerDomClick(tablist.getByRole('tab', { name: 'Code & Repro' }));
    const codeBlock = urbanModal.locator('#rp-tabpanel-code .rp-prompt-code').first();
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText(/Related Urban Indicators & Indices example:|starter scaffold/);

    await triggerDomClick(tablist.getByRole('tab', { name: 'Data Fitness' }));
    await expect(urbanModal.locator('#rp-tabpanel-data .rp-data-block').first()).toBeVisible();

    await triggerDomClick(tablist.getByRole('tab', { name: 'Evidence & Refs' }));
    await expect(urbanModal.locator('#rp-tabpanel-references .rp-ref-item').first()).toBeVisible();

    await triggerDomClick(tablist.getByRole('tab', { name: 'Methodology' }));
    await expect(urbanModal.locator('#rp-tabpanel-methodology .rp-info-content')).toContainText(/Mode Split|Methodology|Methodological framing/);

    for (const placeholder of LEGACY_PLACEHOLDERS) {
      await expect(urbanModal).not.toContainText(placeholder);
    }
  });
});
