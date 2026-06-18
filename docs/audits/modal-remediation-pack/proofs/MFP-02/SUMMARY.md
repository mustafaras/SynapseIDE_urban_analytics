# MFP-02 — Proof summary

**Prompt:** MFP-02 — Promote `useFocusTrap` to a shared hook
**Gate:** gis (`typecheck` + `lint:errors` + `lint:no-tailwind-centerpanel` + `vitest run src/centerpanel/components/map`)
**Branch:** claude/modal-fix-p2

## Change
Pure move + re-export (no behavioural change):
- **Created** `src/hooks/useFocusTrap.ts` with the **verbatim** canonical implementation —
  identical named exports `FOCUSABLE_SELECTOR`, `getFocusableElements`, `useFocusTrap`
  (plus internal `isHiddenFromTrap`). The trap re-queries focusables per Tab, filters
  hidden/`aria-hidden`/negative-tabindex nodes, captures+restores the opener with a
  `document.contains` guard, wraps both Tab directions, and keeps the `data-map-skip-link`
  aware `activate()`.
- **Reduced** `src/centerpanel/components/map/useFocusTrap.ts` to a single barrel line:
  ```ts
  export * from '@/hooks/useFocusTrap';
  ```
  so every existing map importer (e.g. `useMapExplorerLifecycle.ts`, `map-accessibility.test.ts`)
  keeps resolving with no edits.

No circular import (the new `src/hooks/` file imports only `react`), no signature change,
no new `any`, no Tailwind, no `z-index`. Centerpanel stays logic-free.

## Proofs in this directory
- `typecheck.txt` — `npm run typecheck` clean. **(typecheck-clean)**
- `unit-test.txt` — `npx vitest run src/centerpanel/components/map src/hooks/__tests__/useFocusTrap.test.ts`
  → **98 files / 932 tests passed**, incl. `map-accessibility.test.ts` (unchanged) and the
  new `src/hooks/__tests__/useFocusTrap.test.ts`. **(unit-test)**
- `lint.txt` — `npm run lint:errors` clean (exit 0); `lint:no-tailwind-centerpanel` note
  (PowerShell unavailable on this Linux runner → env-dependent; manually verified the only
  centerpanel file touched has no `class=`/`className=` literal so it cannot introduce Tailwind).

## Acceptance
- [x] `src/hooks/useFocusTrap.ts` exists with the three named exports, verbatim logic.
- [x] map path reduced to `export * from '@/hooks/useFocusTrap';`.
- [x] `map-accessibility.test.ts` passes unchanged.
- [x] `useMapExplorerLifecycle.ts` still resolves the hook (typecheck green, no import edits).
- [x] No new dead exports — `getFocusableElements`/`FOCUSABLE_SELECTOR` remain re-exported.

## Test added
`src/hooks/__tests__/useFocusTrap.test.ts` — proves the canonical symbols are reachable from
`@/hooks` and `getFocusableElements` still filters negative-tabindex/hidden nodes. (The spec's
example imported an unused `renderHook`; dropped to satisfy `noUnusedLocals`/lint.)
