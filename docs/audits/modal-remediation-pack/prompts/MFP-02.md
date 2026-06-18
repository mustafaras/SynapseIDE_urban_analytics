# MFP-02 — Promote useFocusTrap to a shared hook

| Field | Value |
|---|---|
| Trigger | P2, promote-focustrap, shared-hook |
| Priority / Phase | P0 / Phase 1 |
| Depends on | none |
| Gate | gis |
| Severity | medium |
| Proof required | typecheck-clean, unit-test |

## 1. Why this matters
Findings `audit-5.2`, `M1`, `M2` document that the one correct, battle-tested focus trap in the repo is buried under `src/centerpanel/components/map/`. Because it lives in the map feature tree, non-map dialogs cannot reasonably import it (it would be a cross-module reach into Map Explorer-owned code), so at least six bespoke trap copies have grown across the codebase — each subtly different and several broken (no restore, wrong listener target). Promoting the canonical implementation to a neutral `src/hooks/` location gives every modal one audited trap path, directly enabling MFP-06 (base Modal) and MFP-13 (migrate bespoke traps). It is foundational: nearly every later prompt consumes `useFocusTrap`.

## 2. Current state (evidence)
The good trap currently lives only in the map tree and exports all three symbols from one file:

```ts
// src/centerpanel/components/map/useFocusTrap.ts:9-16
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");
```

It re-queries focusables per Tab, filters hidden/`aria-hidden`/negative-tabindex nodes, and captures + restores the opener with a `document.contains` guard:

```ts
// src/centerpanel/components/map/useFocusTrap.ts:64-74
previouslyFocused.current = document.activeElement instanceof HTMLElement
  ? document.activeElement
  : null;
return () => {
  if (previouslyFocused.current && document.contains(previouslyFocused.current)) {
    previouslyFocused.current.focus();
  }
  previouslyFocused.current = null;
};
```

It also wraps both Tab directions and exposes a `data-map-skip-link`-aware `activate()`:

```ts
// src/centerpanel/components/map/useFocusTrap.ts:117
const initial = focusable.find((element) => !element.hasAttribute("data-map-skip-link")) ?? focusable[0];
```

## 3. Target state
The full implementation lives at `src/hooks/useFocusTrap.ts` with the **identical** named exports (`FOCUSABLE_SELECTOR`, `getFocusableElements`, `useFocusTrap`). The old map path becomes a one-line re-export so every existing map import (e.g. `useMapExplorerLifecycle.ts`, `map-accessibility.test.ts`) keeps resolving without edits.

before -> after for `src/centerpanel/components/map/useFocusTrap.ts`:

```ts
// before: ~122 lines of implementation
// after:
export * from '@/hooks/useFocusTrap';
```

## 4. Implementation steps
1. Create `src/hooks/useFocusTrap.ts` containing the **verbatim** contents of the current `src/centerpanel/components/map/useFocusTrap.ts` (all of: `FOCUSABLE_SELECTOR`, internal `isHiddenFromTrap`, `getFocusableElements`, `useFocusTrap`, `activate`). Do not retype — copy to avoid drift.
2. Replace the entire body of `src/centerpanel/components/map/useFocusTrap.ts` with `export * from '@/hooks/useFocusTrap';`.
3. Confirm `@/` resolves to `src/` (tsconfig `paths`) so the re-export and any new `@/hooks/useFocusTrap` imports work in both app and vitest.
4. Grep for existing importers of the map path (`from "./useFocusTrap"`, `from "@/centerpanel/components/map/useFocusTrap"`) and verify they still resolve via the re-export — do not rewrite them in this prompt.
5. Run the gis gate and the map a11y test unchanged.

## 5. Constraints & edge cases
- **No behavioural change** — this is a pure move + re-export. Byte-identical implementation.
- Identical named exports; do not rename or drop `FOCUSABLE_SELECTOR` or `getFocusableElements` (they are imported elsewhere and asserted in tests).
- `exactOptionalPropertyTypes` is unaffected (no signature change), but verify the `RefObject<HTMLDivElement | null>` return type still compiles under strict settings.
- The barrel re-export keeps `src/centerpanel/` free of new logic, so `lint:no-tailwind-centerpanel` and the centerpanel ownership rules stay satisfied.
- Edge case: do not introduce a circular import — `src/hooks/useFocusTrap.ts` must not import anything from `centerpanel/`.

## 6. Acceptance criteria
- [ ] `src/hooks/useFocusTrap.ts` exists with the three named exports, verbatim logic.
- [ ] `src/centerpanel/components/map/useFocusTrap.ts` is reduced to `export * from '@/hooks/useFocusTrap';`.
- [ ] `src/centerpanel/components/map/__tests__/map-accessibility.test.ts` passes **unchanged**.
- [ ] `useMapExplorerLifecycle.ts` still resolves the hook (no import edits needed).
- [ ] No new dead exports introduced (`getFocusableElements`/`FOCUSABLE_SELECTOR` remain re-exported).

## 7. Validation
```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
```
Gate: **gis** (also run `npm run lint:no-tailwind-centerpanel` per the gis gate definition).

## 8. Tests to add
The existing `map-accessibility.test.ts` is the primary regression guard and must pass unchanged. Add a focused unit test at the new path proving the trap behavior is reachable from `@/hooks`:

```ts
// src/hooks/__tests__/useFocusTrap.test.ts (also seeded by MFP-07)
import { renderHook } from '@testing-library/react';
import { getFocusableElements, FOCUSABLE_SELECTOR, useFocusTrap } from '@/hooks/useFocusTrap';

it('re-exports the canonical symbols', () => {
  expect(typeof useFocusTrap).toBe('function');
  expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
});

it('getFocusableElements filters negative-tabindex and hidden nodes', () => {
  const root = document.createElement('div');
  root.innerHTML = `<button>a</button><button tabindex="-1">skip</button><button hidden>h</button>`;
  document.body.appendChild(root);
  expect(getFocusableElements(root).map((e) => e.textContent)).toEqual(['a']);
  root.remove();
});
```

## 9. Proof checklist
- [ ] `proofs/MFP-02/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-02/unit-test.txt` — `npx vitest run src/centerpanel/components/map` output (map-accessibility passing) plus the new `src/hooks` trap test.
