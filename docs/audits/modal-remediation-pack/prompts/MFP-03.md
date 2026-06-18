# MFP-03 — Add a ref-counted useScrollLock hook

| Field | Value |
|---|---|
| Trigger | P3, scroll-lock |
| Priority / Phase | P1 / Phase 1 |
| Depends on | none |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, unit-test |

## 1. Why this matters
Finding `M5`: the base `Modal` mutates `document.body.style.overflow` directly and unconditionally per-instance. With stacked modals (e.g. Settings opening a confirm dialog, or a map dialog over the welcome modal), the **first modal to close** restores body scroll while another modal is still open — the page scrolls behind the still-open dialog. A module-level reference count fixes this: scroll stays locked until the last open modal releases it, and the original `overflow` value (not a hardcoded `'unset'`) is restored. This hook is consumed by MFP-06 to replace the buggy effect in `Modal.tsx`.

## 2. Current state (evidence)
The base Modal locks body scroll directly and restores to a hardcoded `'unset'` (losing the prior value) with no cross-instance coordination:

```tsx
// src/components/molecules/Modal.tsx:178-186
useEffect(() => {
  if (preventBodyScroll && isOpen) {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }
  return undefined;
}, [preventBodyScroll, isOpen]);
```

Two issues are visible here: (1) every instance writes/clears independently (no counter), and (2) the cleanup forces `'unset'` rather than the value that was present before the first lock.

## 3. Target state
A new `src/hooks/useScrollLock.ts` exports `useScrollLock(active: boolean)` backed by a module-level counter and a single saved prior value. On the first lock it records `document.body.style.overflow` and sets `'hidden'`; releases only restore the saved value when the counter returns to 0. MFP-06 will then replace the `Modal.tsx:178-186` effect with `useScrollLock(isOpen && preventBodyScroll)`.

```ts
// src/hooks/useScrollLock.ts (target)
import { useEffect } from 'react';

let locks = 0;
let prevOverflow = '';

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    if (locks === 0) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    locks += 1;
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [active]);
}
```

## 4. Implementation steps
1. Create `src/hooks/useScrollLock.ts` with a module-level `locks` counter and `prevOverflow` string.
2. Guard against SSR: early-return when `typeof document === 'undefined'` (also when `!active`).
3. On the transition into an active lock with `locks === 0`, save `document.body.style.overflow` into `prevOverflow`, then set `'hidden'`. Always increment `locks`.
4. In the effect cleanup, decrement with `Math.max(0, locks - 1)`; when the counter reaches 0, restore `prevOverflow` (the real prior value, not `'unset'`).
5. Do **not** modify `Modal.tsx` in this prompt — wiring is MFP-06's job. This prompt only ships the hook + tests.

## 5. Constraints & edge cases
- **No direct `localStorage`** (not relevant here, but no persistence either way).
- **SSR-safe**: guard `document` access; the hook must be importable in a non-DOM context without throwing.
- The counter is module-level singleton state — acceptable for this cross-modal coordination, but tests must reset it between cases (e.g. unmount all, or expose nothing and rely on cleanup symmetry).
- Edge case — re-entrancy: toggling `active` true→false→true on the same component must increment/decrement symmetrically; the `[active]` dep array plus cleanup handles this.
- Edge case — preserve a pre-existing inline `overflow` (e.g. a layout that set `overflow: clip`): restoring `prevOverflow` rather than `'unset'` is the whole point; assert this in tests.
- No new `any`; the hook returns `void`.

## 6. Acceptance criteria
- [ ] `useScrollLock(active)` sets `document.body.style.overflow = 'hidden'` on first active lock.
- [ ] With two active locks, releasing **one** keeps `overflow: hidden`.
- [ ] Releasing the **last** lock restores the original `overflow` value (e.g. `''` or a pre-set `'clip'`), not `'unset'`.
- [ ] Importing the hook in a `document`-less context does not throw.
- [ ] `npm run typecheck` clean.

## 7. Validation
```bash
npm run typecheck
npx vitest run src/hooks
```
Gate: **general**.

## 8. Tests to add
```ts
// src/hooks/__tests__/useScrollLock.test.ts
import { renderHook } from '@testing-library/react';
import { useScrollLock } from '@/hooks/useScrollLock';

beforeEach(() => { document.body.style.overflow = 'clip'; });

it('locks on activate and stays locked while a second lock is held', () => {
  const a = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: true } });
  const b = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: true } });
  expect(document.body.style.overflow).toBe('hidden');
  a.unmount();                                  // release one
  expect(document.body.style.overflow).toBe('hidden'); // still locked by b
  b.unmount();                                  // release last
  expect(document.body.style.overflow).toBe('clip');   // original restored, not 'unset'
});

it('is a no-op when inactive', () => {
  renderHook(() => useScrollLock(false));
  expect(document.body.style.overflow).toBe('clip');
});
```

## 9. Proof checklist
- [ ] `proofs/MFP-03/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-03/unit-test.txt` — `npx vitest run src/hooks` output showing the ref-count and restore assertions passing.
