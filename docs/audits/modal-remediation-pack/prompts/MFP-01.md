# MFP-01 — Fix the undefined GOLD runtime bug in KeysModal

| Field | Value |
|---|---|
| Trigger | P1, keys-gold, gold-bug |
| Priority / Phase | P0 / Phase 0 |
| Depends on | none |
| Gate | general |
| Severity | high |
| Proof required | typecheck-clean, render-smoke |

## 1. Why this matters
The audit (finding `KeysModal-GOLD`) flagged that `KeysModal.tsx` renders the dialog title with `style={{ … color:GOLD }}`, but the identifier `GOLD` is never declared or imported anywhere in `src/`. A repo-wide grep for `\bGOLD\b` returns exactly one hit — the buggy usage itself — while only `GOLDEN_RATIO` (`constants/design.ts`) and `GOLDEN_PAIRS` (a test) exist. This is both a `Cannot find name 'GOLD'` TypeScript compile failure and a render-time `ReferenceError` that crashes the Provider Keys modal the moment it mounts. It is a P0 quick win: the whole AI key-entry surface is currently unmountable, blocking any keyboard/AT conformance work downstream.

## 2. Current state (evidence)
The file declares amber-adjacent tokens as `var(--syn-*)` strings at the top, but no `GOLD`:

```ts
// src/components/ai/panel/KeysModal.tsx:7-15
const ACCENT = 'var(--syn-interaction-active, #3794ff)';
const ACCENT_HOVER = 'var(--syn-status-info, #6aa9ff)';
const BG = 'var(--syn-surface-panel, #232832)';
const BG_ALT = 'var(--syn-surface-input, #1a1f26)';
const BORDER = 'var(--syn-border-subtle, #343a44)';
const BORDER_SOFT = 'var(--syn-border-subtle, #343a44)';
const TEXT = 'var(--syn-text-default, #d7dce5)';
const TEXT_MUTED = 'var(--syn-text-secondary, #a4adbb)';
const TEXT_FAINT = 'var(--syn-text-muted, #778190)';
```

The undefined reference is on the title node:

```tsx
// src/components/ai/panel/KeysModal.tsx:174
<div id={`${id}-title`} style={{ fontWeight:700, marginBottom:12, fontSize:14, letterSpacing:.5, textTransform:'uppercase', color:GOLD }}>Provider Keys</div>
```

Repo-wide grep confirms there is nothing to "restore" — `GOLD` only appears at `KeysModal.tsx:174`.

## 3. Target state
The title renders in an amber accent sourced from a CSS variable, consistent with the file's existing `var(--syn-*)` convention. No new identifier is introduced into module scope; the literal is inlined exactly where `GOLD` was.

before -> after:

```tsx
// before
style={{ fontWeight:700, marginBottom:12, fontSize:14, letterSpacing:.5, textTransform:'uppercase', color:GOLD }}
// after
style={{ fontWeight:700, marginBottom:12, fontSize:14, letterSpacing:.5, textTransform:'uppercase', color: 'var(--syn-accent-gold, #f5b301)' }}
```

## 4. Implementation steps
1. Re-confirm with `grep -n "\bGOLD\b" -r src` that the only occurrence is `KeysModal.tsx:174` — there is no intended import to restore.
2. In `src/components/ai/panel/KeysModal.tsx` line 174, replace the bare `color:GOLD` property with `color: 'var(--syn-accent-gold, #f5b301)'`.
3. Keep the rest of the inline style object byte-for-byte identical (same key order, same `fontWeight:700`, `textTransform:'uppercase'`, etc.) so the title node shape is unchanged.
4. Do **not** add a module-level `const GOLD = …` — the file already establishes the inline `var(--syn-*)` pattern; matching it avoids an unused-token lint risk.
5. Run the gate commands and capture proofs.

## 5. Constraints & edge cases
- No new `any`; this change introduces no types.
- Keep the title node's existing inline-style object shape (do not refactor to a styled-component here).
- Do **not** touch any `z-index` in this file — `Backdrop` uses `z-index: 2200` and that is centralized later in MFP-15; out of scope here.
- This is a shell/styled-components file (not under `src/centerpanel/`), so the no-Tailwind rule is not engaged, but still avoid Tailwind utility strings.
- The fallback hex `#f5b301` mirrors the file's pattern of `var(--token, #fallback)`; pick whichever amber token the palette canonically exposes if `--syn-accent-gold` is not registered (verify against `constants/design.ts` amber tokens before finalizing).

## 6. Acceptance criteria
- [ ] `npm run typecheck` passes with no `Cannot find name 'GOLD'` diagnostic.
- [ ] `KeysModal` mounts without throwing a `ReferenceError: GOLD is not defined`.
- [ ] The "Provider Keys" title renders in the amber accent color.
- [ ] No other line in the file changed; inline style key order preserved.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
```
Gate: **general**.

## 8. Tests to add
A lightweight render smoke (no new permanent test file strictly required, but recommended) proving the component mounts without a ReferenceError:

```tsx
// src/components/ai/panel/__tests__/KeysModal.smoke.test.tsx
import { render } from '@testing-library/react';
import { KeysModal } from '../KeysModal';

it('mounts without a ReferenceError and exposes the dialog title', () => {
  const { getByTestId } = render(<KeysModal open onClose={() => {}} />);
  const dialog = getByTestId('keys-modal');
  expect(dialog).toHaveAttribute('role', 'dialog');
  // title node is aria-labelledby target; presence proves render did not throw
  expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
});
```

## 9. Proof checklist
- [ ] `proofs/MFP-01/typecheck-clean.txt` — full `npm run typecheck` output with no GOLD error.
- [ ] `proofs/MFP-01/render-smoke.txt` — vitest output (or console log) showing `KeysModal` mounts without a ReferenceError.
