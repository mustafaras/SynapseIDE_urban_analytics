import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createComputedIndicatorRecord } from '@/features/urbanAnalytics/indicators/catalog';

import { createIndicatorPendingInsert, enqueueIndicatorPendingInsert } from '../indicatorInserts';
import { drainPendingInserts } from '../storage';

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

describe('indicator report inserts', () => {
  beforeEach(() => {
    const localStorage = createStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorage,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage,
        dispatchEvent: vi.fn(),
      },
    });
  });

  it('creates report inserts with analytical narrative and methodological bullets', () => {
    const record = createComputedIndicatorRecord('carbonFootprintPerCapita', {
      buildingEmissionsTCO2e: 62400,
      transportEmissionsTCO2e: 45200,
      wasteEmissionsTCO2e: 8200,
      population: 28400,
    });

    const insert = createIndicatorPendingInsert(record);

    expect(insert.source).toBe('indicator:carbonFootprintPerCapita');
    expect(insert.sections[0]?.kind).toBe('analysis');
    expect(insert.sections[0]?.blocks[0]?.kind).toBe('paragraph');
    expect(insert.sections[0]?.blocks[1]?.kind).toBe('bullet_list');
  });

  it('queues indicator inserts into the existing report pending pipeline', () => {
    const record = createComputedIndicatorRecord('modeSplit', {
      walkTrips: 1800,
      cycleTrips: 450,
      transitTrips: 2400,
      carTrips: 2900,
    });

    enqueueIndicatorPendingInsert(record);
    const inserts = drainPendingInserts();

    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.suggestedTitle).toContain('Mode Split');
  });
});