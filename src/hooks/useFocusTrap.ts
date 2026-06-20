import { useCallback, useEffect, useRef } from "react";

/* ================================================================== */
/*  Focus Trap Hook                                                    */
/*  Cycles Tab / Shift+Tab within a container element.                 */
/*  Handles dynamic content — re-queries focusable nodes on each Tab.  */
/* ================================================================== */

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function isHiddenFromTrap(element: HTMLElement, container: HTMLElement): boolean {
  let current: HTMLElement | null = element;

  while (current && current !== container) {
    const style = window.getComputedStyle(current);
    if (
      current.hidden ||
      current.getAttribute("aria-hidden") === "true" ||
      style.display === "none" ||
      style.visibility === "hidden"
    ) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.tabIndex < 0) {
      return false;
    }

    return !isHiddenFromTrap(element, container);
  });
}

/**
 * Returns a ref to attach to the trap container plus a manual `activate`
 * callback that focuses the first focusable element inside.
 */
interface FocusTrapOptions {
  restoreFocus?: boolean;
}

export function useFocusTrap(active: boolean, options: FocusTrapOptions = {}): {
  trapRef: React.RefObject<HTMLDivElement | null>;
  activate: () => void;
} {
  const trapRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const { restoreFocus = true } = options;

  /* Capture the previously-focused element when activating */
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    previouslyFocused.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    return () => {
      /* Restore focus on deactivate */
      if (restoreFocus && previouslyFocused.current && document.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus();
      }
      previouslyFocused.current = null;
    };
  }, [active, restoreFocus]);

  /* Tab key handler */
  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !trapRef.current) return;

      const focusable = getFocusableElements(trapRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        /* Shift+Tab — wrap backwards */
        if (document.activeElement === first || !trapRef.current.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        /* Tab — wrap forward */
        if (document.activeElement === last || !trapRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [active]);

  /* Manual activation helper */
  const activate = useCallback(() => {
    if (!trapRef.current) return;
    const focusable = getFocusableElements(trapRef.current);
    if (focusable.length === 0) return;
    /* Prefer the first element that is not a skip-navigation link so the
       visually-hidden skip link does not flash open on modal entry. It
       remains first in tab order for keyboard users. */
    const initial = focusable.find((element) => !element.hasAttribute("data-map-skip-link")) ?? focusable[0];
    initial.focus();
  }, []);

  return { trapRef, activate };
}
