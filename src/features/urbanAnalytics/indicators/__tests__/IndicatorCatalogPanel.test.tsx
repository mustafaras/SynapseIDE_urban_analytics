import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';

import IndicatorCatalogPanel from '../IndicatorCatalogPanel';

function createStorageMock(): Storage {
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.has(key) ? memory.get(key)! : null;
    },
    key(index: number) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
  };
}

describe('IndicatorCatalogPanel', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });
  });

  it('renders the scientific catalog surface with compute and staging actions', () => {
    const html = renderToStaticMarkup(<IndicatorCatalogPanel />);

    expect(html).toContain('Section 11 scientific indicator library');
    expect(html).toContain('Compute indicator');
    expect(html).toContain('Classification bands');
    expect(html).toContain('Add to Dashboard');
    expect(html).toContain('Add to Report');
    expect(html).toContain('Related flows');
  });
});