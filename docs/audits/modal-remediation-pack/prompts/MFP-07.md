# MFP-07 — Foundation unit tests (Modal + hooks)

| Field | Value |
|---|---|
| Trigger | P7, foundation-tests |
| Priority / Phase | P1 / Phase 1 |
| Depends on | MFP-06 |
| Gate | general |
| Severity | medium |
| Proof required | unit-test |

## 1. Why this matters
The foundation that most dialogs depend on — the rebuilt base `Modal` and the three promoted hooks (`useFocusTrap`, `useScrollLock`, `useInertBackground`) — currently has no unit tests (finding audit-8). Without tests, the MFP-06 rewrite can silently regress focus trap, focus restore, scroll-lock ref-counting, background inerting, or unique title ids. This prompt adds a reusable `assertDialogA11y` helper plus targeted hook tests so every later consumer migration (MFP-10/11/12/14/16) inherits a proven, regression-guarded base. It directly supports WCAG 2.4.3 (Focus Order) and 4.1.2 (Name/Role/Value) by asserting them mechanically.

## 2. Current state (evidence)
No test files exist yet for these targets:

```
src/components/molecules/__tests__/Modal.test.tsx        (to create)
src/hooks/__tests__/useFocusTrap.test.ts                 (to create)
src/hooks/__tests__/useScrollLock.test.ts                (to create)
src/hooks/__tests__/useInertBackground.test.ts           (to create)
```

The shared trap to test was promoted by MFP-02 to `src/hooks/useFocusTrap.ts` (its current body lives at `src/centerpanel/components/map/useFocusTrap.ts`):

```ts
// src/centerpanel/components/map/useFocusTrap.ts:51-75 — capture + restore semantics under test
export function useFocusTrap(active: boolean): {
  trapRef: React.RefObject<HTMLDivElement | null>;
  activate: () => void;
} {
  const trapRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!active) return undefined;
    previouslyFocused.current = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    return () => {
      if (previouslyFocused.current && document.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus();
      }
      previouslyFocused.current = null;
    };
  }, [active]);
  // ...Tab/Shift+Tab wrap handler at L78-107...
}
```

The base `Modal` under test now derives its title id from `useId()` and consumes the three hooks (post-MFP-06):

```tsx
// src/components/molecules/Modal.tsx (post-MFP-06 sketch)
const titleId = useId();
const { trapRef } = useFocusTrap(isOpen);
useScrollLock(isOpen && preventBodyScroll);
useInertBackground(isOpen);
```

## 3. Target state
Four new colocated test files exist and pass under vitest + jsdom, satisfying `src/config/coveragePolicy.json`. A shared `assertDialogA11y(render)` helper is reused across modal a11y tests (also consumed by MFP-20).

## 4. Implementation steps
1. Create a reusable helper (e.g. exported from `Modal.test.tsx` or a small `src/test/assertDialogA11y.ts`) `assertDialogA11y(renderModal)` that asserts: (a) initial focus moves into the dialog on open; (b) Tab from the last focusable wraps to the first; (c) Shift+Tab from the first wraps to the last; (d) focus restores to the opener on close; (e) Escape closes.
2. `Modal.test.tsx`: render with two focusable children and a known opener button. Run `assertDialogA11y`. Add a test that mounts two `<Modal title>` instances and asserts their `aria-labelledby` ids are distinct (proves `useId()` fix from MFP-06). Add a test wiring `ariaLabel` (untitled modal → `aria-label`) and `describedby` (`aria-describedby` rendered).
3. `useFocusTrap.test.ts`: import from `@/hooks/useFocusTrap`. Assert capture-on-activate, restore-on-deactivate with the `document.contains` guard (restore is skipped when the opener was removed from the DOM), and Tab wrap in both directions.
4. `useScrollLock.test.ts`: assert ref-counting — two locks keep `document.body.style.overflow === 'hidden'`; releasing one keeps it locked; releasing the last restores the original value (per MFP-03 codeSketch).
5. `useInertBackground.test.ts`: render a background button + a portal/modal root; assert that while active the background sibling gets `inert`/`aria-hidden="true"` and is not tabbable, the portal/modal root is never inerted, and after deactivate the attributes are removed (per MFP-04).

## 5. Constraints & edge cases
- vitest + jsdom; satisfy `src/config/coveragePolicy.json` thresholds.
- jsdom does not lay out elements — query focusables structurally and drive focus with `.focus()` / `fireEvent.keyDown`, not real Tab traversal.
- `inert` may be unsupported in jsdom; assert the attribute presence and the `aria-hidden` fallback rather than real focusability.
- Do not redefine shared fixtures — reuse repo helpers where they exist.
- exactOptionalPropertyTypes: when calling Modal with optional props, omit them or pass `undefined` consistently.

## 6. Acceptance criteria
- [ ] `Modal.test.tsx`, `useFocusTrap.test.ts`, `useScrollLock.test.ts`, `useInertBackground.test.ts` all pass.
- [ ] `assertDialogA11y` asserts initial focus, Tab/Shift+Tab wrap, focus restore, Escape close.
- [ ] Scroll-lock ref-counting verified (two locks → release one → still locked → release last → restored).
- [ ] Background inert toggling verified; portal/modal root never inerted.
- [ ] Unique-title-ids-across-two-instances assertion passes.
- [ ] `ariaLabel`/`describedby` wiring asserted.
- [ ] Coverage policy satisfied.

## 7. Validation
```bash
npx vitest run src/components/molecules src/hooks
# gate: general
```

## 8. Tests to add
This prompt *is* the tests. Concrete `assertDialogA11y` sketch:
```tsx
export async function assertDialogA11y(open: () => RenderResult, close: (r: RenderResult) => void) {
  const opener = document.createElement('button'); document.body.append(opener); opener.focus();
  const r = open();
  const dialog = r.getByRole('dialog');
  expect(dialog.contains(document.activeElement)).toBe(true);          // initial focus in
  const f = within(dialog).getAllByRole('button');
  f[f.length - 1].focus(); fireEvent.keyDown(document, { key: 'Tab' });
  expect(document.activeElement).toBe(f[0]);                            // wrap forward
  f[0].focus(); fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(f[f.length - 1]);                 // wrap back
  fireEvent.keyDown(dialog, { key: 'Escape' });                        // escape closes
  close(r);
  expect(document.activeElement).toBe(opener);                         // restore
}
```

## 9. Proof checklist
- [ ] `unit-test` → `proofs/MFP-07/unit-test.txt` (vitest run output for `src/components/molecules src/hooks`)
