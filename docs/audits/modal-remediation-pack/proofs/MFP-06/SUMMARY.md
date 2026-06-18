# MFP-06 — Proof summary

**Prompt:** MFP-06 — Rebuild the base Modal on the shared foundation
**Gate:** general (`npm run typecheck` + `npm run lint:errors`)
**Branch:** claude/modal-fix-p6
**Depends on:** MFP-02, MFP-03, MFP-04, MFP-05 (all `done`)

## Change — `src/components/molecules/Modal.tsx`
Rebuilt on the shared hooks; public API stays backward-compatible (existing props
unchanged; new `ariaLabel?` / `describedby?` are optional). Fixes M1–M9:

- **M1/M2 focus trap + restore:** `useFocusTrap(isOpen)` (MFP-02) attached to the panel
  (`trapRef`). A `useLayoutEffect` captures the opener and moves focus into the dialog; a
  passive effect declared **after** `useInertBackground` restores focus to the opener on
  close (so the opener is no longer in an inert subtree at restore time).
- **M3 unique title id:** `useId()` replaces the hardcoded `id="modal-title"`;
  `aria-labelledby` / `<ModalTitle id>` use it. Two modals no longer collide.
- **M4 scoped Escape + overlay click:** global `useKeyPress`/`useOnClickOutside` removed;
  `onKeyDown` on the overlay closes only on `Escape` when `closeOnEscape` (and
  `stopPropagation`s so a stacked child popover can own Escape); `onClick` closes only when
  the backdrop itself is clicked (`e.target === e.currentTarget`).
- **M5 scroll lock:** `useScrollLock(isOpen && preventBodyScroll)` (MFP-03) — ref-counted,
  stacked-safe; replaces the direct `document.body.style.overflow` mutation.
- **M6 inert background:** `useInertBackground(isOpen)` (MFP-04).
- **M7 live region:** a visually-hidden `role="status" aria-live="polite"` announces the
  dialog on open.
- **M8 token surface:** palette surface sourced from `SYNAPSE_OVERLAY.surface` (was `#121212`).
- **M9 reflow:** palette `min-width: 640px` → `min-width: min(640px, 100%)` so the panel
  reflows below 688px.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables slide/fade.

`exactOptionalPropertyTypes` honoured (aria-* pass `undefined` explicitly). No `any`.
Effect ordering is deliberate (see inline comments): capture → move-in → inert on open;
un-inert → restore on close.

## Proofs in this directory
- `typecheck.txt` — `npm run typecheck` clean. **(typecheck-clean)**
- `lint.txt` — `npm run lint:errors` clean (exit 0). **(lint-clean)**
- `unit-a11y.txt` — `Modal.a11y.test.tsx` **6/6 passed** (trap/restore/unique-id/escape/
  overlay/inert) — deterministic jsdom evidence.
- `unit-full.txt` — full `vitest run`: **3085 passed**, 2 skipped, **3 pre-existing failures**
  (`useMapExplorerStore` persistence ×2, `MapExplorerModal.dispatch` ×1). Verified these fail
  identically with master's `Modal.tsx` → **not caused by MFP-06** (zero new regressions).
- `e2e-a11y.txt` — **(e2e-a11y)** ENVIRONMENT-BLOCKED: Playwright browser download is denied
  by this sandbox's network policy and the app dev server isn't bootable headlessly. MFP-06
  does not touch Map Explorer code (the audit's target). Substituted by the jsdom a11y suite;
  re-run `npm run test:e2e:a11y` in a browser-capable environment for the full audit.
- `keyboard.md` — **(manual-keyboard)** Tab/Shift+Tab/Escape/focus-restore/inert checklist,
  each item backed by a passing assertion.

## Acceptance
- [x] Consumers gain trap + restore + inert with no per-consumer change (base Modal only).
- [x] Two simultaneous Modals get unique `useId()` title ids.
- [x] Tab/Shift+Tab cycle; focus restores to the opener on close.
- [x] Escape is dialog-scoped; `closeOnEscape`/`closeOnOverlayClick` honoured.
- [x] Palette surface uses `SYNAPSE_OVERLAY.surface`; panel reflows below 688px.
- [x] `prefers-reduced-motion` disables slide/fade.
- [~] Map Explorer e2e a11y stays green — not runnable here (env-blocked); unaffected by scope.
- [x] `npm run typecheck` and `npm run lint:errors` clean.

## Test added
`src/components/molecules/__tests__/Modal.a11y.test.tsx` (the formal `Modal.test.tsx` suite is
MFP-07's deliverable; this focused a11y suite proves the MFP-06 behaviours now).
