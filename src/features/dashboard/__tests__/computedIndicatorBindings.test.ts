import { beforeEach, describe, expect, it } from 'vitest';

import { createComputedIndicatorRecord } from '@/features/urbanAnalytics/indicators/catalog';
import { upsertComputedIndicatorRecord } from '@/features/urbanAnalytics/indicators/storage';

import {
  getComputedIndicatorBindingId,
  getDashboardBinding,
  registerDashboardBinding,
  listBindingsForTemplate,
  listBindingsForWidgetType,
} from '../dataBindings';

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

describe('computed indicator dashboard bindings', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });
  });

  it('creates metric bindings for latest computed indicator results', () => {
    const record = createComputedIndicatorRecord('buildingEnergyIntensity', {
      annualEnergyKWh: 1880000,
      floorAreaM2: 12800,
    });
    upsertComputedIndicatorRecord(record);

    const binding = getDashboardBinding(getComputedIndicatorBindingId('buildingEnergyIntensity', 'metric'));

    expect(binding?.kind).toBe('metric');
    expect(binding?.label).toBe('Building Energy Intensity');
    expect(binding && 'formattedValue' in binding ? binding.formattedValue : '').toContain('146.88');
  });

  it('creates series bindings when a computed indicator exposes components', () => {
    const record = createComputedIndicatorRecord('modeSplit', {
      walkTrips: 1800,
      cycleTrips: 450,
      transitTrips: 2400,
      carTrips: 2900,
    });
    upsertComputedIndicatorRecord(record);

    const binding = getDashboardBinding(getComputedIndicatorBindingId('modeSplit', 'series'));

    expect(binding?.kind).toBe('series');
    expect(binding && 'points' in binding ? binding.points : []).toHaveLength(4);
  });

  it('surfaces computed indicators through widget and template binding lists', () => {
    upsertComputedIndicatorRecord(createComputedIndicatorRecord('lastMileAccess', {
      populationWithin400m: 16800,
      totalPopulation: 24000,
    }));

    expect(listBindingsForWidgetType('kpi').some((binding) => binding.id === getComputedIndicatorBindingId('lastMileAccess', 'metric'))).toBe(true);
    expect(listBindingsForTemplate('accessibility_equity').some((binding) => binding.id === getComputedIndicatorBindingId('lastMileAccess', 'metric'))).toBe(true);
  });

  it('registers Urban evidence-backed dashboard bindings without losing traceability metadata', () => {
    const registered = registerDashboardBinding({
      id: 'urban-dashboard-test-binding',
      kind: 'text',
      label: 'Urban Evidence Note',
      description: 'Static Urban evidence binding for dashboard tests.',
      headline: 'Urban evidence binding',
      paragraphs: ['Reference-only dashboard binding.'],
      highlights: ['Artifact: artifact-1'],
      updatedAt: '2026-05-09T12:00:00.000Z',
      tags: ['city_profile'],
      traceability: {
        sourceArtifactId: 'artifact-1',
        sourceRunId: 'run-1',
        refreshMode: 'static',
        qaState: 'warning',
        qaWarnings: ['Review before publication.'],
      },
    });

    expect(registered).toBe(true);
    expect(getDashboardBinding('urban-dashboard-test-binding')?.traceability).toMatchObject({
      sourceArtifactId: 'artifact-1',
      refreshMode: 'static',
      qaState: 'warning',
    });
    expect(listBindingsForWidgetType('text').some((binding) => binding.id === 'urban-dashboard-test-binding')).toBe(true);
    expect(listBindingsForTemplate('city_profile').some((binding) => binding.id === 'urban-dashboard-test-binding')).toBe(true);
  });
});
