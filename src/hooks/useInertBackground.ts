import { useEffect } from 'react';

/* ================================================================== */
/*  Inert Background Hook                                              */
/*  While active, makes the page behind a modal inert to assistive     */
/*  tech and keyboard focus. Generalizes the map-shell sibling-        */
/*  exclusion logic (MapWorkspaceShell.tsx) so any base-Modal-derived  */
/*  dialog gets a properly inerted background.                         */
/* ================================================================== */

/**
 * Returns true when a body-level sibling must be left interactive: it is the
 * branch that contains the dialog/anchor, a known map overlay root, or the
 * app's modal/portal root. Excluded siblings are never inerted.
 */
function isExcludedSibling(element: Element, selfBranch: Element | null, anchor: Element | null): boolean {
  return (
    element === selfBranch ||
    (anchor != null && element.contains(anchor)) ||
    element.getAttribute('data-map-overlay-root') === 'true' ||
    element.hasAttribute('data-modal-root') ||
    element.hasAttribute('data-portal-root') ||
    element.id === 'modal-root'
  );
}

/**
 * While `active`, sets the standard `inert` attribute (plus `aria-hidden="true"`
 * as a fallback for engines without `inert`) on the body-level siblings of the
 * open dialog, excluding the branch that contains it and known overlay/portal
 * roots. On deactivate it restores each sibling's prior attribute state exactly,
 * so stacked/nested modals nest safely. SSR-safe and never inerts the dialog's
 * own root (the page overlay already blocks pointer interaction, mirroring the
 * map shell's deliberate decision not to flip `pointer-events`).
 */
export function useInertBackground(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;

    // Anchor on the currently-focused element (a freshly-opened modal focuses
    // itself); walk up to its body-level ancestor so we can exclude that branch.
    const anchor: Element | null = document.activeElement;
    let selfBranch: Element | null = anchor;
    while (selfBranch && selfBranch.parentElement && selfBranch.parentElement !== document.body) {
      selfBranch = selfBranch.parentElement;
    }

    const siblings = Array.from(document.body.children).filter(
      (element) => !isExcludedSibling(element, selfBranch, anchor),
    );

    const snapshot = siblings.map((element) => ({
      element,
      hadInert: element.hasAttribute('inert'),
      ariaHidden: element.getAttribute('aria-hidden'),
    }));

    for (const element of siblings) {
      element.setAttribute('inert', '');
      element.setAttribute('aria-hidden', 'true');
    }

    return () => {
      for (const { element, hadInert, ariaHidden } of snapshot) {
        if (!hadInert) {
          element.removeAttribute('inert');
        }
        if (ariaHidden == null) {
          element.removeAttribute('aria-hidden');
        } else {
          element.setAttribute('aria-hidden', ariaHidden);
        }
      }
    };
  }, [active]);
}
