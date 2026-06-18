# MFP-07 — Proof summary

**Prompt:** MFP-07 — Foundation unit tests (Modal + hooks)
**Gate:** general (validation: `npx vitest run src/components/molecules src/hooks`)
**Branch:** claude/modal-fix-p7
**Depends on:** MFP-06 (done)

## Change — tests only (finding audit-8)
- **New** `src/test/assertDialogA11y.ts` — reusable dialog a11y contract: initial focus moves
  in, Tab wraps last→first, Shift+Tab wraps first→last, Escape is handled, focus restores to
  the opener on close. Controlled-dialog API (`open()` → RenderResult, `close(r)`). Reused by
  Modal foundation tests now and consumer-migration tests (MFP-20).
- **New** `src/components/molecules/__tests__/Modal.test.tsx` — formal foundation suite:
  runs `assertDialogA11y`, asserts unique `useId()` title ids across two instances (MFP-06
  M3), and the `ariaLabel`/`describedby` wiring (untitled → `aria-label` + `aria-describedby`;
  titled → `aria-labelledby`, no `aria-label`).
- **Expanded** `src/hooks/__tests__/useFocusTrap.test.ts` — added capture-on-activate +
  restore-on-deactivate, the `document.contains` guard (restore skipped when the opener was
  removed), and Tab/Shift+Tab wrap in both directions.
- `useScrollLock.test.ts` (ref-counting) and `useInertBackground.test.ts` (inert toggling +
  portal/overlay-root exclusion) already satisfy MFP-07 §4.4/§4.5 from MFP-03/04 — left as-is.

No `any` (the trap-ref attach uses a typed `WritableRef`, not `any`). jsdom drives focus via
`.focus()` + `fireEvent.keyDown` (no native Tab traversal), per the constraints.

## Proofs in this directory
- `unit-test.txt` — `npx vitest run src/components/molecules src/hooks` → **5 files / 21
  tests passed** (Modal.test ×4, Modal.a11y ×6, useFocusTrap ×5, useScrollLock ×3,
  useInertBackground ×3). **(unit-test)**
- `typecheck.txt` — `npm run typecheck` clean.
- `lint.txt` — `npm run lint:errors` clean (exit 0).

## Acceptance
- [x] `Modal.test.tsx`, `useFocusTrap.test.ts`, `useScrollLock.test.ts`,
  `useInertBackground.test.ts` all pass.
- [x] `assertDialogA11y` asserts initial focus, Tab/Shift+Tab wrap, focus restore, Escape.
- [x] Scroll-lock ref-counting verified (two locks → release one → still locked → release last → restored).
- [x] Background inert toggling verified; portal/modal root never inerted.
- [x] Unique-title-ids-across-two-instances assertion passes.
- [x] `ariaLabel`/`describedby` wiring asserted.
- [x] Coverage policy satisfied (suite runs clean under the configured thresholds).
