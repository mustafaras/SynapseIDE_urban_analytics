/**
 * MFP-15 — bespoke modal overlays and global bars must consume the published
 * z-index CSS variables instead of hardcoded stacking tiers.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

describe('z-index token consumers', () => {
  it('keeps bespoke modal overlays on the modal z-index token', () => {
    const keysModal = readSource('../../components/ai/panel/KeysModal.tsx');
    const aiSettingsModal = readSource('../../components/ai/settings/AiSettingsModal.module.css');
    const unsavedChangesDialog = readSource('../../components/ide/UnsavedChangesDialog.tsx');

    expect(keysModal).toContain('z-index: var(--z-modal);');
    expect(keysModal).not.toContain('z-index: 2200;');

    expect(aiSettingsModal).toContain('z-index: var(--z-modal);');
    expect(aiSettingsModal).not.toContain('z-index: 1000;');

    expect(unsavedChangesDialog).toContain("zIndex: 'var(--z-modal)'");
    expect(unsavedChangesDialog).not.toContain('zIndex: 9999');
  });

  it('keeps global accent bars on the system-banner z-index token', () => {
    const urbanAnalyticsModal = readSource('../../features/urbanAnalytics/UrbanAnalyticsModal.tsx');
    const welcomeModal = readSource('../../features/urbanAnalytics/WelcomeModal.tsx');
    const enhancedIde = readSource('../../components/ide/EnhancedIDE.tsx');

    expect(urbanAnalyticsModal).toContain('z-index: var(--z-system-banner);');
    expect(welcomeModal).toContain("style={{ zIndex: 'var(--z-system-banner)' }}");
    expect(welcomeModal).toContain('z-index: var(--z-system-banner) !important;');
    expect(enhancedIde).toContain('z-index:var(--z-system-banner);');

    for (const source of [urbanAnalyticsModal, welcomeModal, enhancedIde]) {
      expect(source).not.toContain('2147483648');
    }
    expect(enhancedIde).not.toContain('z-index:999999');
  });
});
