/**
 * MFP-05 — z-index scale published as CSS variables. Guards against silent drift
 * between the single source of truth (DESIGN_TOKENS.zIndex) and the CSS vars in
 * theme.ts, and asserts the new system-banner tier sits above toast.
 */
import { createCSSVariables, getTheme } from '@/styles/theme';
import { DESIGN_TOKENS } from '@/constants/design';

it('publishes the full z-index scale including the system-banner tier', () => {
  const vars = createCSSVariables(getTheme('dark'));
  expect(vars['--z-backdrop']).toBe(String(DESIGN_TOKENS.zIndex.backdrop));
  expect(vars['--z-modal']).toBe(String(DESIGN_TOKENS.zIndex.modal));
  expect(vars['--z-popover']).toBe(String(DESIGN_TOKENS.zIndex.popover));
  expect(vars['--z-tooltip']).toBe(String(DESIGN_TOKENS.zIndex.tooltip));
  expect(vars['--z-toast']).toBe(String(DESIGN_TOKENS.zIndex.toast));
  expect(vars['--z-statusbar']).toBe(String(DESIGN_TOKENS.zIndex.statusBar));
  expect(vars['--z-system-banner']).toBe(String(DESIGN_TOKENS.zIndex.systemBanner));
});

it('keeps the system-banner tier strictly above toast', () => {
  expect(DESIGN_TOKENS.zIndex.systemBanner).toBeGreaterThan(DESIGN_TOKENS.zIndex.toast);
});
