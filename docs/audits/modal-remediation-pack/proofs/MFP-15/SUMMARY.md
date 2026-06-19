# MFP-15 Proof Summary

Prompt: MFP-15 - Apply z-index tokens to bespoke modals (fix occlusion)
Gate: general

## Change

- `KeysModal` backdrop now uses `z-index: var(--z-modal)`.
- `AiSettingsModal.module.css` was already on `z-index: var(--z-modal)` from MFP-08 and was verified unchanged.
- `UnsavedChangesDialog` backdrop now uses `zIndex: 'var(--z-modal)'`.
- `UrbanAnalyticsModal` accent line now uses `z-index: var(--z-system-banner)`.
- `WelcomeModal` root inline style and CSS rule now use `var(--z-system-banner)`.
- `EnhancedIDE` global gold bar now uses `z-index:var(--z-system-banner)`.
- Added `src/styles/__tests__/zIndexConsumerUsage.test.ts` to guard the P15 consumers against regressing to the old literals.

## Proofs

- `typecheck-clean.txt`: `npm run typecheck` clean.
- `lint.txt`: `npm run lint:errors` clean.
- `color-guard.txt`: `npm run color:guard` exit 0 in report mode.
- `unit-test.txt`: `zIndexTokens.test.ts` plus `zIndexConsumerUsage.test.ts` passed, 4 tests.
- `screenshot/before.png`, `screenshot/after.png`, `screenshot/comparison.png`: real Chrome screenshot proof from a throwaway Vite harness. The harness applied `createCSSVariables(getTheme('dark'))` to `:root` and rendered `GlobalSynapseStyles`.
- `screenshot/computed-z-index.json`: computed values confirm the after order is `--z-system-banner` 10090 > `--z-modal` 10050 > `--z-statusbar` 9999 > `--z-backdrop` 1040.

## Sweep Notes

- Removed P15 target literals: `2147483648`, `[data-global-gold-bar] z-index:999999`, `KeysModal z-index: 2200`, `UnsavedChangesDialog zIndex: 9999`.
- `AiSettingsModal.module.css` already used `var(--z-modal)`, so no code change was needed there.
- `EnhancedIDE.tsx` still contains unrelated raw z-index values for development/demo and dock layout controls; these are not modal overlays or global bars and are outside MFP-15 scope.
