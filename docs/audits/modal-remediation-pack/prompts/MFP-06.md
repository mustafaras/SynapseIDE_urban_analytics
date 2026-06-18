# MFP-06 — Rebuild the base Modal on the shared foundation

| Field | Value |
|---|---|
| Trigger | P6, base-modal, rebuild-modal |
| Priority / Phase | P1 / Phase 1 |
| Depends on | MFP-02, MFP-03, MFP-04, MFP-05 |
| Gate | general |
| Severity | high |
| Proof required | typecheck-clean, lint-clean, e2e-a11y, manual-keyboard |

## 1. Why this matters
The base `Modal` (`src/components/molecules/Modal.tsx`) is the foundation many app dialogs render through (Command Palette, Global Search, New Project, Settings). It currently ships nine defects (findings M1–M9): no focus trap, no focus restore, a hardcoded `id="modal-title"` that collides when two modals mount, a globally-scoped Escape/click-outside, direct `document.body.style.overflow` mutation that breaks under stacking, no background `inert`, no live-region announcement, a token-bypass `#121212` palette surface, and a `min-width: 640px` floor that prevents reflow below 688px. This violates WCAG 2.4.3 (Focus Order), 2.1.2 (No Keyboard Trap — escaping focus), 4.1.2 (Name/Role/Value), and 1.4.10 (Reflow). Fixing it once propagates trap + restore + inert to every consumer with zero per-consumer change. The hooks promoted by MFP-02/03/04/05 are the prerequisites.

## 2. Current state (evidence)

```tsx
// src/components/molecules/Modal.tsx:1-7
import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { SYNAPSE_OVERLAY } from '@/ui/theme/synapseTheme';
import { X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useKeyPress, useOnClickOutside } from '@/hooks/useCommon';
```

```tsx
// src/components/molecules/Modal.tsx:65 — token-bypass surface (M8)
background: ${props => (props.$variant === 'palette' ? '#121212' : SYNAPSE_OVERLAY.surface)};
```

```tsx
// src/components/molecules/Modal.tsx:97-102 — palette min-width floor (M9)
      case 'palette':
        return css`
          width: 100%;
          max-width: 960px;
          min-width: 640px;
        `;
```

```tsx
// src/components/molecules/Modal.tsx:161-186 — global Escape (M4), click-outside, body-scroll (M5)
  const modalRef = useRef<HTMLDivElement>(null);
  const escapePressed = useKeyPress('Escape');

  useOnClickOutside(modalRef as React.RefObject<HTMLElement>, () => {
    if (closeOnOverlayClick) { onClose(); }
  });

  useEffect(() => {
    if (escapePressed && closeOnEscape && isOpen) { onClose(); }
  }, [escapePressed, closeOnEscape, isOpen, onClose]);

  useEffect(() => {
    if (preventBodyScroll && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
    return undefined;
  }, [preventBodyScroll, isOpen]);
```

```tsx
// src/components/molecules/Modal.tsx:189-217 — naive "trap", no restore (M1/M2), hardcoded id (M3)
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) { firstElement.focus(); }
    }
  }, [isOpen]);
  // ...
      role="dialog"
      aria-modal
      aria-labelledby={title ? 'modal-title' : undefined}
  // ...
            {title ? <ModalTitle id="modal-title" $variant={variant}>{title}</ModalTitle> : null}
```

The "trap" only focuses the first element once; it never cycles Tab, never restores focus to the opener, and `aria-labelledby="modal-title"` is a literal string so two simultaneous Modals emit duplicate ids.

## 3. Target state
`Modal` consumes the shared hooks (from MFP-02/03/04) and a `useId()`-derived title id:

```tsx
// after (sketch)
const titleId = useId();
const { trapRef } = useFocusTrap(isOpen);
useScrollLock(isOpen && preventBodyScroll);
useInertBackground(isOpen);
// ...
<ModalContainer ref={trapRef} role="dialog" aria-modal="true"
  aria-labelledby={title ? titleId : undefined}
  aria-label={!title ? ariaLabel : undefined}
  aria-describedby={describedby} />
```

Escape is scoped to the dialog root (`onKeyDown` on Overlay/panel), not the global `window`. The palette surface is sourced from `SYNAPSE_OVERLAY.surface`, and the `min-width: 640px` floor is parametrized/lowered so the dialog reflows under 688px. A polite `aria-live` announcement fires on open. The public API stays backward-compatible; new props (`ariaLabel`, `describedby`) are optional.

## 4. Implementation steps
1. Add imports: `useId` from `react`; `useFocusTrap` from `@/hooks/useFocusTrap` (MFP-02); `useScrollLock` from `@/hooks/useScrollLock` (MFP-03); `useInertBackground` from `@/hooks/useInertBackground` (MFP-04). Drop `useKeyPress`/`useOnClickOutside` if no longer needed.
2. Extend `ModalProps` (L9-23) with `ariaLabel?: string` and `describedby?: string`. Honor `exactOptionalPropertyTypes` — type them as `?:` and pass `undefined` explicitly where a value is absent.
3. Replace `modalRef` with `const { trapRef } = useFocusTrap(isOpen)` and attach `trapRef` to `<ModalContainer>` (L207). The hook already captures + restores the opener and cycles Tab (M1/M2).
4. Replace the body-scroll `useEffect` (L178-186) with `useScrollLock(isOpen && preventBodyScroll)` (M5).
5. Add `useInertBackground(isOpen)` (M6).
6. Replace the hardcoded `id="modal-title"` (L214, L217) with `const titleId = useId()`; wire `aria-labelledby={title ? titleId : undefined}` and the `<ModalTitle id={titleId}>` (M3).
7. Replace the global `useKeyPress('Escape')` + `useOnClickOutside` with an `onKeyDown` handler on `<Overlay>`/`<ModalContainer>` that calls `onClose()` only when `closeOnEscape` and `e.key === 'Escape'`; keep `closeOnOverlayClick` via an overlay `onClick` that ignores clicks bubbling from the panel (M4).
8. Add `aria-label={!title ? ariaLabel : undefined}` and `aria-describedby={describedby}` to `<ModalContainer>`.
9. Add a visually-hidden polite `aria-live` region (or `role="status"`) inside the portal that announces the dialog on open (M7).
10. Source the palette surface from `SYNAPSE_OVERLAY.surface` (L65) instead of `#121212` (M8); lower/parametrize the `min-width: 640px` floor in the `palette` size branch (L97-102) so the panel reflows (M9).

## 5. Constraints & edge cases
- Backward-compatible props: Command Palette, Global Search, New Project, Settings must not break — keep `isOpen/onClose/title/children/size/closeOnOverlayClick/closeOnEscape/showCloseButton/preventBodyScroll/className/variant`.
- Respect `prefers-reduced-motion` for the `slideUp`/`fadeIn` keyframes (gate the animation).
- `exactOptionalPropertyTypes: true` — never mix optional-vs-`undefined`. Pass `undefined` explicitly to `aria-*`.
- Do NOT touch z-index here (overlay already uses `var(--z-modal)`); occlusion fixes are MFP-15.
- Escape must be scoped to the dialog so it does not steal Escape from a stacked child popover.
- Two stacked Modals: scroll-lock ref-counting (MFP-03) must keep `overflow:hidden` until the last closes.

## 6. Acceptance criteria
- [ ] Command Palette, Global Search, New Project, Settings gain trap + restore + inert with no per-consumer change.
- [ ] Two simultaneous Modals no longer emit duplicate `modal-title` ids (each gets a `useId()` id).
- [ ] Tab/Shift+Tab cycle within the dialog; focus restores to the opener on close.
- [ ] Escape is dialog-scoped; `closeOnEscape`/`closeOnOverlayClick` still honored.
- [ ] Palette surface uses `SYNAPSE_OVERLAY.surface`; panel reflows below 688px.
- [ ] `prefers-reduced-motion` disables slide/fade.
- [ ] Map Explorer e2e a11y stays green.
- [ ] `npm run typecheck` and `npm run lint:errors` clean.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
npm run test:e2e:a11y
# gate: general
```

## 8. Tests to add
A `src/components/molecules/__tests__/Modal.test.tsx` (formally MFP-07) sketch:
```tsx
it('traps and restores focus', async () => {
  const opener = document.createElement('button'); document.body.append(opener); opener.focus();
  const { rerender } = render(<Modal isOpen title="T"><button>A</button><button>B</button></Modal>);
  // first focusable inside gets focus; Tab from last wraps to first; Shift+Tab from first wraps to last
  rerender(<Modal isOpen={false} title="T"><button>A</button></Modal>);
  expect(document.activeElement).toBe(opener); // restore
});
it('uses unique title ids across two instances', () => {
  render(<><Modal isOpen title="One">x</Modal><Modal isOpen title="Two">y</Modal></>);
  const ids = screen.getAllByRole('dialog').map(d => d.getAttribute('aria-labelledby'));
  expect(new Set(ids).size).toBe(2);
});
it('escape closes only when closeOnEscape', () => { /* fireEvent.keyDown(dialog, {key:'Escape'}) */ });
```

## 9. Proof checklist
- [ ] `typecheck-clean` → `proofs/MFP-06/typecheck.txt`
- [ ] `lint-clean` → `proofs/MFP-06/lint.txt`
- [ ] `e2e-a11y` → `proofs/MFP-06/e2e-a11y.txt`
- [ ] `manual-keyboard` → `proofs/MFP-06/keyboard.md` (Tab/Shift+Tab cycle, Escape, focus-restore noted)
