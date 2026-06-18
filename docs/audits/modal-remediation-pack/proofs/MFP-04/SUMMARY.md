# MFP-04 — Proof summary

**Prompt:** MFP-04 — Add `useInertBackground` hook
**Gate:** general (`npm run typecheck` + `npm run lint:errors`)
**Branch:** claude/modal-fix-p4

## Change
**Created** `src/hooks/useInertBackground.ts` — `useInertBackground(active: boolean): void`.
Generalizes the map-shell sibling-exclusion logic (`MapWorkspaceShell.tsx:590-617`) into a
reusable hook so MFP-06 can give every base-Modal-derived dialog a properly inerted background
(finding **M6**):
- While `active`, anchors on `document.activeElement` (a freshly-opened modal focuses itself),
  walks up to its body-level branch, then sets the standard **`inert`** attribute **plus**
  `aria-hidden="true"` (fallback for engines without `inert`) on every other body-level sibling.
- **Excludes** the self branch, any element containing the anchor, `data-map-overlay-root`,
  the app modal/portal root (`#modal-root` / `[data-modal-root]` / `[data-portal-root]`).
- Snapshots each sibling's prior `inert`/`aria-hidden` and **restores it exactly** on cleanup,
  so stacked/nested modals nest safely.
- SSR-safe (`!active` / `typeof document === 'undefined'` guard).

`inert` is set via `setAttribute('inert','')` to avoid a DOM-lib typing cast — **no `any`**.
Mirrors the map shell's deliberate choice **not** to flip `pointer-events` (the overlay already
blocks pointer interaction). `Modal.tsx` is **not** wired here — that is MFP-06's job.
`MapWorkspaceShell.tsx` was read for reference only (target action `verify`) and left unchanged.

## Proofs in this directory
- `typecheck.txt` — `npm run typecheck` clean, no `any`. **(typecheck-clean)**
- `unit-test.txt` — `npx vitest run src/hooks` → **3 files / 8 tests passed** (3 new
  `useInertBackground` cases + 3 `useScrollLock` + 2 `useFocusTrap`). **(unit-test)**
- `lint.txt` — `npm run lint:errors` clean (exit 0).

## Acceptance
- [x] While active, a background sibling is `inert` (not tabbable) and carries `aria-hidden="true"`.
- [x] After deactivate, `inert` and `aria-hidden` are removed/restored to prior state.
- [x] The portal/modal root and `data-map-overlay-root` elements are never inerted.
- [x] Importing/running the hook without active state does not throw (SSR + no-op guards).
- [x] `npm run typecheck` clean, no `any`.

## Test added
`src/hooks/__tests__/useInertBackground.test.ts` — inert toggling + restore, map-overlay-root
exclusion, `#modal-root` exclusion, and inactive no-op.
