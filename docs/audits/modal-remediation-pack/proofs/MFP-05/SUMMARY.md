# MFP-05 — Proof summary

**Prompt:** MFP-05 — Publish the full z-index scale as CSS variables
**Gate:** general (`npm run typecheck` + `npm run color:guard`)
**Branch:** claude/modal-fix-p5

## Change
Publish-only (no consumer migrated — that is MFP-15). Keeps `design.ts` the single source of truth:
- **`src/constants/design.ts`** `zIndex`: added `systemBanner: 10090` directly after `toast: 10080`
  (strictly above toast; will replace the `2147483648` gold-bar literals in MFP-15). Every
  existing numeric value left identical.
- **`src/styles/theme.ts`** `createCSSVariables`: after `--z-toast`, published
  `'--z-statusbar': DESIGN_TOKENS.zIndex.statusBar.toString()` (tier was defined but not
  exposed; MFP-15 migrates the Unsaved modal's `9999`) and
  `'--z-system-banner': DESIGN_TOKENS.zIndex.systemBanner.toString()`.

Existing `--z-backdrop`/`--z-modal`/`--z-popover`/`--z-tooltip`/`--z-toast` confirmed already
published (anchor correction in the spec was accurate). No literal introduced in `theme.ts` —
always `DESIGN_TOKENS.zIndex.<tier>.toString()`. No `any`. No consumer file touched.

## Proofs in this directory
- `typecheck.txt` — `npm run typecheck` clean. **(typecheck-clean)**
- `color-guard.txt` — `npm run color:guard` clean (exit 0) after adding the tokens. **(color-guard)**
- `unit-test.txt` — `npx vitest run src/styles/__tests__/zIndexTokens.test.ts` → **2 passed**
  (full scale published + system-banner above toast).
- `lint.txt` — `npm run lint:errors` clean (exit 0).

## Acceptance
- [x] `DESIGN_TOKENS.zIndex.systemBanner === 10090` and sits above `toast` (10080).
- [x] All documented tiers reachable as CSS vars: `--z-backdrop`, `--z-modal`, `--z-popover`,
  `--z-tooltip`, `--z-toast`, `--z-statusbar`, `--z-system-banner`.
- [x] No consumer file changed.
- [x] `npm run color:guard` clean.
- [x] `npm run typecheck` clean.

## Test added
`src/styles/__tests__/zIndexTokens.test.ts` — asserts the published CSS-var set matches
`DESIGN_TOKENS.zIndex` (drift guard) and the system-banner tier ordering.
