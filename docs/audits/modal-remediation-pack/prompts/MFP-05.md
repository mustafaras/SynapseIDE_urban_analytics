# MFP-05 — Publish the full z-index scale as CSS variables

| Field | Value |
|---|---|
| Trigger | P5, z-index-tokens, ztokens |
| Priority / Phase | P1 / Phase 1 |
| Depends on | none |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, color-guard |

## 1. Why this matters
Finding `audit-4.3`: the z-index scale is the single source of truth in `DESIGN_TOKENS.zIndex` (`src/constants/design.ts`), but bespoke modals hardcode raw numbers (AI Settings `1000`, Keys `2200`, Unsaved `9999`) and the global gold bars use the literal `2147483648`. To let MFP-15 retire those literals, the full scale must be reachable as CSS variables, plus a new `--z-system-banner` tier above `toast` for the gold bars. This prompt only **publishes** the variables — MFP-15 migrates the consumers.

## 2. Current state (evidence)
> **Anchor correction:** the JSON `problem` says "only `--z-modal` is published". That is no longer accurate — `src/styles/theme.ts` already publishes `--z-backdrop`, `--z-popover`, `--z-tooltip`, and `--z-toast` alongside `--z-modal`. The **real gap** is a missing `--z-system-banner` tier (and confirming `--z-statusbar`/`terminal`/`aiAssistant` tiers if MFP-15 needs them). The authoritative `symbols` anchor (`zIndex`) is correct.

The tokens are defined in `design.ts`:

```ts
// src/constants/design.ts:323-339
zIndex: {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  statusBar: 9999,
  modal: 10050,
  popover: 10060,
  tooltip: 10070,
  toast: 10080,
  terminal: 10000,
  aiAssistant: 10001,
},
```

They are published as CSS vars inside `createCSSVariables(theme)` in `theme.ts`:

```ts
// src/styles/theme.ts:303-307 (inside createCSSVariables, theme.ts:154)
'--z-backdrop': DESIGN_TOKENS.zIndex.backdrop.toString(),
'--z-modal': DESIGN_TOKENS.zIndex.modal.toString(),
'--z-popover': DESIGN_TOKENS.zIndex.popover.toString(),
'--z-tooltip': DESIGN_TOKENS.zIndex.tooltip.toString(),
'--z-toast': DESIGN_TOKENS.zIndex.toast.toString(),
```

There is no `--z-system-banner` token in either file (grep for `z-system-banner` / `2147483648` finds nothing in `src/styles` or `src/constants`).

## 3. Target state
`design.ts` `zIndex` gains a `systemBanner` tier strictly above `toast` (e.g. `10090`), and `createCSSVariables` publishes `--z-system-banner` from it — keeping `design.ts` the single source of truth. Any documented tier MFP-15 will reference (`--z-statusbar` for the `statusBar: 9999` tier) is also confirmed published; add it if missing. No consumer changes here.

before -> after for `design.ts`:

```ts
// before
  toast: 10080,
  terminal: 10000,
// after
  toast: 10080,
  systemBanner: 10090, // global gold bars; replaces the 2147483648 literals (MFP-15)
  terminal: 10000,
```

before -> after for `theme.ts` (inside `createCSSVariables`, after the `--z-toast` line):

```ts
  '--z-toast': DESIGN_TOKENS.zIndex.toast.toString(),
  '--z-system-banner': DESIGN_TOKENS.zIndex.systemBanner.toString(),
```

## 4. Implementation steps
1. In `src/constants/design.ts` (`zIndex`, ~L323-339), add `systemBanner: 10090` directly after `toast: 10080`. Keep every existing numeric value identical.
2. In `src/styles/theme.ts` `createCSSVariables` (defined L154; z-block L296-307), add `'--z-system-banner': DESIGN_TOKENS.zIndex.systemBanner.toString(),` after the `--z-toast` line.
3. Confirm the tiers MFP-15 needs are reachable: `--z-backdrop` (L303), `--z-modal` (L304), `--z-popover` (L305), `--z-tooltip` (L306), `--z-toast` (L307) already exist. If MFP-15 will target the status-bar tier, also publish `'--z-statusbar': DESIGN_TOKENS.zIndex.statusBar.toString(),` (currently absent).
4. Do **not** touch any consumer (KeysModal `2200`, AiSettings `1000`, Unsaved `9999`, gold bars `2147483648`) — that is MFP-15.
5. Run `npm run color:guard` to confirm the token regression check stays clean.

## 5. Constraints & edge cases
- **Single source of truth = `design.ts` `zIndex`** — never introduce a literal directly in `theme.ts`; always `DESIGN_TOKENS.zIndex.<tier>.toString()`.
- **Keep numeric values identical** to `design.ts` for existing tiers; only the new `systemBanner` adds a value.
- `systemBanner` must sit strictly above `toast` (10080) so the global gold bars win, but it replaces an absurd `2147483648` — `10090` is sufficient because nothing legitimate stacks above the toast tier.
- `color:guard` (`scripts/check-color-regression.mjs`) inspects the palette/token surface; adding a z-index token must not trip it — verify, and if the guard snapshots z-tokens, update the snapshot intentionally.
- No `any`; `auto` stays a string (`.toString()` is only applied to numeric tiers, matching the existing pattern where `--z-auto` uses the raw value).
- `exactOptionalPropertyTypes`: `zIndex` is a plain object literal, no optional fields affected.

## 6. Acceptance criteria
- [ ] `DESIGN_TOKENS.zIndex.systemBanner === 10090` and sits above `toast`.
- [ ] All documented tiers reachable as CSS vars from `createCSSVariables`: `--z-backdrop`, `--z-modal`, `--z-popover`, `--z-tooltip`, `--z-toast`, and the new `--z-system-banner` (plus `--z-statusbar` if added).
- [ ] No consumer file changed in this prompt.
- [ ] `npm run color:guard` clean.
- [ ] `npm run typecheck` clean.

## 7. Validation
```bash
npm run typecheck
npm run color:guard
```
Gate: **general**.

## 8. Tests to add
A small unit test asserting the published var set (prevents silent drift between `design.ts` and `theme.ts`):

```ts
// src/styles/__tests__/zIndexTokens.test.ts
import { createCSSVariables, getTheme } from '@/styles/theme';
import { DESIGN_TOKENS } from '@/constants/design';

it('publishes the full z-index scale including the system-banner tier', () => {
  const vars = createCSSVariables(getTheme('dark'));
  expect(vars['--z-modal']).toBe(String(DESIGN_TOKENS.zIndex.modal));
  expect(vars['--z-toast']).toBe(String(DESIGN_TOKENS.zIndex.toast));
  expect(vars['--z-system-banner']).toBe(String(DESIGN_TOKENS.zIndex.systemBanner));
  expect(DESIGN_TOKENS.zIndex.systemBanner).toBeGreaterThan(DESIGN_TOKENS.zIndex.toast);
});
```
(Confirm the actual `getTheme` key name; `theme.ts:149` defines `getTheme(themeName: keyof typeof themes)`.)

## 9. Proof checklist
- [ ] `proofs/MFP-05/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-05/color-guard.txt` — `npm run color:guard` output showing a clean run after adding the token.
