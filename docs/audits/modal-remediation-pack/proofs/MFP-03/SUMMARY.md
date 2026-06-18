# MFP-03 — Proof summary

**Prompt:** MFP-03 — Add a ref-counted `useScrollLock` hook
**Gate:** general (`npm run typecheck` + `npm run lint:errors`)
**Branch:** claude/modal-fix-p3

## Change
**Created** `src/hooks/useScrollLock.ts` — `useScrollLock(active: boolean): void` backed by a
module-level reference count (`locks`) and a single saved `prevOverflow`:
- On the first active lock (`locks === 0`) it records `document.body.style.overflow` and sets
  `'hidden'`, then increments the counter.
- On cleanup it decrements with `Math.max(0, locks - 1)`; only when the counter returns to 0
  does it restore the **saved prior value** (not a hardcoded `'unset'`).
- SSR-safe: early-returns when `!active` or `typeof document === 'undefined'`.

This fixes finding **M5**: stacked modals no longer fight body scroll — the first modal to
close no longer unlocks the page while another modal is still open. `Modal.tsx` is **not**
touched here; wiring `useScrollLock(isOpen && preventBodyScroll)` is MFP-06's job.

No new `any`, no `localStorage`, no behavioural change to existing components.

## Proofs in this directory
- `typecheck.txt` — `npm run typecheck` clean. **(typecheck-clean)**
- `unit-test.txt` — `npx vitest run src/hooks` → **2 files / 5 tests passed** (3 new
  `useScrollLock` cases + the 2 `useFocusTrap` cases). **(unit-test)**
- `lint.txt` — `npm run lint:errors` clean (exit 0).

## Acceptance
- [x] First active lock sets `overflow: hidden`.
- [x] With two active locks, releasing one keeps `overflow: hidden`.
- [x] Releasing the last lock restores the original value (`'clip'` in the test), not `'unset'`.
- [x] Importing the hook in a `document`-less context does not throw (SSR guard).
- [x] `npm run typecheck` clean.

## Test added
`src/hooks/__tests__/useScrollLock.test.ts` — ref-count + restore-original-value assertions,
no-op-when-inactive, and a single-cycle restore. Vitest isolates module state per test file,
so the module-level `locks` counter resets between files; all in-file cases are symmetric.
