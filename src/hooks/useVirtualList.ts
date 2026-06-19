import { useEffect, useMemo, useState, type RefObject } from 'react';

export interface VirtualListOptions<TElement extends HTMLElement> {
  itemCount: number;
  itemHeight: number;
  containerRef: RefObject<TElement | null>;
  overscan?: number;
  viewportHeight?: number;
}

export interface VirtualListWindow {
  start: number;
  end: number;
  topSpacer: number;
  bottomSpacer: number;
}

export function useVirtualList<TElement extends HTMLElement>({
  itemCount,
  itemHeight,
  containerRef,
  overscan = 4,
  viewportHeight = 260,
}: VirtualListOptions<TElement>): VirtualListWindow {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(viewportHeight);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateFromScroll = () => {
      setScrollTop(container.scrollTop);
      setViewHeight(container.clientHeight || viewportHeight);
    };

    container.addEventListener('scroll', updateFromScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', updateFromScroll);
    };
  }, [containerRef, viewportHeight]);

  return useMemo(() => {
    const total = Math.max(0, itemCount);
    const safeItemHeight = Math.max(1, itemHeight);
    const safeOverscan = Math.max(0, overscan);
    const start = Math.max(0, Math.floor(scrollTop / safeItemHeight) - safeOverscan);
    const end = Math.min(total, Math.ceil((scrollTop + viewHeight) / safeItemHeight) + safeOverscan);

    return {
      start,
      end,
      topSpacer: start * safeItemHeight,
      bottomSpacer: Math.max(0, total - end) * safeItemHeight,
    };
  }, [itemCount, itemHeight, overscan, scrollTop, viewHeight]);
}
