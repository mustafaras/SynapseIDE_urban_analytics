// @vitest-environment jsdom

/**
 * MFP-02 — canonical focus trap promoted to src/hooks/. Proves the trap symbols
 * are reachable from the neutral @/hooks path (not the Map Explorer tree) and
 * that getFocusableElements keeps its filtering behaviour after the move.
 */
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
