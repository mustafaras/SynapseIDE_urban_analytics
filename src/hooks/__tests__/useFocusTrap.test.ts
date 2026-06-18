// @vitest-environment jsdom

/**
 * MFP-02 — canonical focus trap promoted to src/hooks/. Proves the trap symbols
 * are reachable from the neutral @/hooks path (not the Map Explorer tree) and
 * that getFocusableElements keeps its filtering behaviour after the move.
 */
import { fireEvent, renderHook } from '@testing-library/react';
import { getFocusableElements, FOCUSABLE_SELECTOR, useFocusTrap } from '@/hooks/useFocusTrap';

/** Writable view of the trap ref so a test can attach a real container node. */
type WritableRef = { current: HTMLDivElement | null };

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

it('captures the opener on activate and restores focus on deactivate', () => {
  const opener = document.createElement('button');
  document.body.appendChild(opener);
  const container = document.createElement('div');
  container.innerHTML = '<button>A</button><button>B</button>';
  document.body.appendChild(container);

  const { result, rerender, unmount } = renderHook(
    ({ active }) => useFocusTrap(active),
    { initialProps: { active: false } },
  );
  (result.current.trapRef as WritableRef).current = container;

  opener.focus(); // opener is focused at the moment the trap activates
  rerender({ active: true });

  (container.querySelector('button') as HTMLElement).focus(); // move focus inside
  rerender({ active: false }); // cleanup restores the opener
  expect(document.activeElement).toBe(opener);

  unmount();
  opener.remove();
  container.remove();
});

it('skips restore when the opener was removed from the DOM (document.contains guard)', () => {
  const opener = document.createElement('button');
  document.body.appendChild(opener);
  const { rerender, unmount } = renderHook(
    ({ active }) => useFocusTrap(active),
    { initialProps: { active: false } },
  );

  opener.focus();
  rerender({ active: true }); // captures opener
  opener.remove(); // opener leaves the DOM before deactivate
  rerender({ active: false }); // restore must be skipped, not throw
  expect(document.activeElement).not.toBe(opener);

  unmount();
});

it('wraps Tab and Shift+Tab within the container', () => {
  const container = document.createElement('div');
  container.innerHTML = '<button>A</button><button>B</button>';
  document.body.appendChild(container);
  const first = container.querySelectorAll('button')[0] as HTMLElement;
  const last = container.querySelectorAll('button')[1] as HTMLElement;

  const { result, rerender, unmount } = renderHook(
    ({ active }) => useFocusTrap(active),
    { initialProps: { active: false } },
  );
  (result.current.trapRef as WritableRef).current = container;
  rerender({ active: true });

  last.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(document.activeElement).toBe(first); // forward wrap

  first.focus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last); // backward wrap

  unmount();
  container.remove();
});
