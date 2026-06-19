// @vitest-environment jsdom

import { act, fireEvent, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { useVirtualList } from '@/hooks/useVirtualList';

const createScrollableRef = (
  clientHeight: number,
  initialScrollTop = 0,
): RefObject<HTMLDivElement | null> => {
  const container = document.createElement('div');
  let scrollTop = initialScrollTop;

  Object.defineProperty(container, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(container, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });

  document.body.appendChild(container);
  return { current: container };
};

afterEach(() => {
  document.body.replaceChildren();
});

it('starts from the top range without reading scrollTop during render', () => {
  const ref = createScrollableRef(260, 340);
  const { result } = renderHook(() => useVirtualList({
    containerRef: ref,
    itemCount: 1000,
    itemHeight: 34,
    overscan: 4,
    viewportHeight: 260,
  }));

  expect(result.current).toEqual({
    start: 0,
    end: 12,
    topSpacer: 0,
    bottomSpacer: 33_592,
  });
});

it('updates the window after a scroll event', () => {
  const ref = createScrollableRef(260);
  const { result } = renderHook(() => useVirtualList({
    containerRef: ref,
    itemCount: 1000,
    itemHeight: 34,
    overscan: 4,
    viewportHeight: 260,
  }));

  act(() => {
    if (ref.current) {
      ref.current.scrollTop = 340;
      fireEvent.scroll(ref.current);
    }
  });

  expect(result.current).toEqual({
    start: 6,
    end: 22,
    topSpacer: 204,
    bottomSpacer: 33_252,
  });
});

it('clamps the virtual window to the item range', () => {
  const ref = createScrollableRef(260);
  const { result } = renderHook(() => useVirtualList({
    containerRef: ref,
    itemCount: 10,
    itemHeight: 34,
    overscan: 4,
    viewportHeight: 260,
  }));

  act(() => {
    if (ref.current) {
      ref.current.scrollTop = 10_000;
      fireEvent.scroll(ref.current);
    }
  });

  expect(result.current.end).toBe(10);
  expect(result.current.bottomSpacer).toBe(0);
});
