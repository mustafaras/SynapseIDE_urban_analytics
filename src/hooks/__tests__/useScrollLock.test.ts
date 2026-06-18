// @vitest-environment jsdom

/**
 * MFP-03 — ref-counted body-scroll lock. Proves stacked locks don't fight:
 * scroll stays locked until the last lock releases, and the ORIGINAL overflow
 * value is restored (not a hardcoded 'unset').
 */
import { renderHook } from '@testing-library/react';
import { useScrollLock } from '@/hooks/useScrollLock';

beforeEach(() => { document.body.style.overflow = 'clip'; });

it('locks on activate and stays locked while a second lock is held', () => {
  const a = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: true } });
  const b = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: true } });
  expect(document.body.style.overflow).toBe('hidden');
  a.unmount();                                          // release one
  expect(document.body.style.overflow).toBe('hidden'); // still locked by b
  b.unmount();                                          // release last
  expect(document.body.style.overflow).toBe('clip');   // original restored, not 'unset'
});

it('is a no-op when inactive', () => {
  renderHook(() => useScrollLock(false));
  expect(document.body.style.overflow).toBe('clip');
});

it('restores the original value after a single lock cycle', () => {
  const { unmount } = renderHook(() => useScrollLock(true));
  expect(document.body.style.overflow).toBe('hidden');
  unmount();
  expect(document.body.style.overflow).toBe('clip');
});
