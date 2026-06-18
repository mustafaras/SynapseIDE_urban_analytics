// @vitest-environment jsdom

/**
 * MFP-04 — inert the page behind a modal for assistive tech. Proves background
 * body-level siblings become `inert` + `aria-hidden` while active, the map
 * overlay root is excluded, and everything is restored on deactivate.
 */
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

it('excludes the app modal/portal root from inerting', () => {
  const bg = document.createElement('div');
  const portalRoot = document.createElement('div');
  portalRoot.id = 'modal-root';
  document.body.append(bg, portalRoot);

  const { unmount } = renderHook(() => useInertBackground(true));

  expect(bg.hasAttribute('inert')).toBe(true);
  expect(portalRoot.hasAttribute('inert')).toBe(false); // portal root never inerted

  unmount();
  expect(bg.hasAttribute('inert')).toBe(false);
  bg.remove(); portalRoot.remove();
});

it('is a no-op when inactive and does not throw', () => {
  const bg = document.createElement('div');
  document.body.append(bg);

  renderHook(() => useInertBackground(false));
  expect(bg.hasAttribute('inert')).toBe(false);
  expect(bg.hasAttribute('aria-hidden')).toBe(false);

  bg.remove();
});
