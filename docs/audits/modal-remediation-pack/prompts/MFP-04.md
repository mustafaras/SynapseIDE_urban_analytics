# MFP-04 — Add useInertBackground hook

| Field | Value |
|---|---|
| Trigger | P4, inert, inert-background |
| Priority / Phase | P1 / Phase 1 |
| Depends on | none |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, unit-test |

## 1. Why this matters
Finding `M6`: only the Map Explorer shell currently inerts the background while a modal is open. The base `Modal` and most bespoke modals leave the entire app reachable by assistive technology — a screen-reader user can Tab/arrow into the page behind an open dialog, which violates the modal contract (WCAG 2.4.3 Focus Order / 4.1.2 expectations for `aria-modal`). The map shell already contains the correct sibling-exclusion logic but only applies `aria-hidden` (not `inert`) and is map-specific. This prompt generalizes that logic into a reusable `useInertBackground(active)` hook so MFP-06 can give every base-Modal-derived dialog a properly inerted background.

## 2. Current state (evidence)
The only background-inerting logic lives in the map shell, scoped to `isModal`, and uses `aria-hidden` (with a deliberate decision **not** to flip `pointer-events`). It walks up to find the body-level ancestor that contains the modal and excludes it plus `data-map-overlay-root`:

```tsx
// src/centerpanel/components/map/MapWorkspaceShell.tsx:590-599
let selfBranch: Element | null = root;
while (selfBranch && selfBranch.parentElement && selfBranch.parentElement !== document.body) {
  selfBranch = selfBranch.parentElement;
}
const siblings = Array.from(document.body.children).filter(
  (element) =>
    element !== root &&
    element !== selfBranch &&
    element.getAttribute("data-map-overlay-root") !== "true",
);
```

It then sets `aria-hidden="true"` on each sibling and restores the prior value on cleanup:

```tsx
// src/centerpanel/components/map/MapWorkspaceShell.tsx:605-617
for (const element of siblings) {
  element.setAttribute("aria-hidden", "true");
}
return () => {
  for (const { element, ariaHidden } of previousValues) {
    if (ariaHidden == null) {
      element.removeAttribute("aria-hidden");
    } else {
      element.setAttribute("aria-hidden", ariaHidden);
    }
  }
};
```

The base `Modal` (`src/components/molecules/Modal.tsx`) has no equivalent — nothing inerts or hides the page behind it.

## 3. Target state
A new `src/hooks/useInertBackground.ts` exports `useInertBackground(active: boolean)`. While `active`, it sets the standard `inert` attribute (with `aria-hidden="true"` as a fallback for engines without `inert`) on the body-level siblings of the modal/portal root, excluding the branch that contains the dialog and known overlay roots (`data-map-overlay-root`, plus the app's modal/portal root). On deactivate it restores the prior attribute state. The exclusion walk generalizes the `MapWorkspaceShell.tsx:590-599` logic.

```ts
// src/hooks/useInertBackground.ts (target shape)
export function useInertBackground(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    // find the body-level branch containing the active element / portal root,
    // collect siblings excluding that branch + data-map-overlay-root + portal root,
    // snapshot prior inert/aria-hidden, then set inert + aria-hidden="true".
    // cleanup restores the snapshot.
  }, [active]);
}
```

## 4. Implementation steps
1. Create `src/hooks/useInertBackground.ts` exporting `useInertBackground(active: boolean): void`.
2. Determine the dialog's body-level branch: start from a stable anchor (the portal/modal root if discoverable, else `document.activeElement`) and walk up to the child of `document.body`, mirroring `MapWorkspaceShell.tsx:590-593`.
3. Build the sibling list from `document.body.children`, excluding: the self branch, any element with `data-map-overlay-root === "true"`, and the known modal/portal root (e.g. `#modal-root` / `data-modal-root` if present). Generalize the exclusion predicate so callers in MFP-06 don't need map-specific knowledge.
4. Snapshot each excluded-from sibling's prior `inert` and `aria-hidden` state, then set `el.inert = true` (or `setAttribute('inert','')`) **and** `aria-hidden="true"` as the fallback.
5. On cleanup, restore each snapshot exactly (remove the attribute if it was absent, restore the prior value otherwise).
6. SSR guard: early-return when `typeof document === 'undefined'` or `!active`.
7. Do **not** wire this into `Modal.tsx` here — MFP-06 consumes it.

## 5. Constraints & edge cases
- **Never inert the portal/modal root itself** — doing so would make the dialog unfocusable.
- **Exclude `data-map-overlay-root`** so map child portals (tooltips, popovers, maplibre portals) stay live, matching the existing map-shell decision.
- Mirror the map shell's deliberate choice: do not flip `pointer-events` on body siblings (the overlay already blocks pointer interaction) — rely on `inert` + `aria-hidden`.
- `inert` typing: the DOM lib may not type `HTMLElement.inert` in this TS config — prefer `setAttribute('inert','')`/`removeAttribute('inert')` to avoid a cast, and never use `any` (use `unknown` + narrowing if a property access is unavoidable).
- SSR-safe; importable without a DOM.
- Edge case — stacked modals: each active instance snapshots/restores independently; a sibling already inerted by an outer modal must end up correctly restored (snapshot captures the prior `inert`/`aria-hidden`, so nesting is safe).
- `exactOptionalPropertyTypes`: the hook takes a required `boolean`, no optional mismatch.

## 6. Acceptance criteria
- [ ] While `active`, a background button is `inert` and not tabbable (and carries `aria-hidden="true"`).
- [ ] After deactivate, the `inert` and `aria-hidden` attributes are gone (or restored to their prior value).
- [ ] The portal/modal root and `data-map-overlay-root` elements are never inerted.
- [ ] Importing the hook without a DOM does not throw.
- [ ] `npm run typecheck` clean, no `any`.

## 7. Validation
```bash
npm run typecheck
npx vitest run src/hooks
```
Gate: **general**.

## 8. Tests to add
```tsx
// src/hooks/__tests__/useInertBackground.test.ts
import { renderHook } from '@testing-library/react';
import { useInertBackground } from '@/hooks/useInertBackground';

it('inerts background siblings while active and restores on deactivate', () => {
  const bg = document.createElement('div');
  bg.innerHTML = '<button id="bg-btn">behind</button>';
  const overlay = document.createElement('div');
  overlay.setAttribute('data-map-overlay-root', 'true');
  document.body.append(bg, overlay);

  const { rerender, unmount } = renderHook(
    ({ active }) => useInertBackground(active),
    { initialProps: { active: true } },
  );

  expect(bg.hasAttribute('inert')).toBe(true);
  expect(bg.getAttribute('aria-hidden')).toBe('true');
  expect(overlay.hasAttribute('inert')).toBe(false); // overlay root excluded

  rerender({ active: false });
  expect(bg.hasAttribute('inert')).toBe(false);
  expect(bg.hasAttribute('aria-hidden')).toBe(false);

  unmount();
  bg.remove(); overlay.remove();
});
```

## 9. Proof checklist
- [ ] `proofs/MFP-04/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-04/unit-test.txt` — `npx vitest run src/hooks` output showing inert toggling + overlay-root exclusion assertions passing.
