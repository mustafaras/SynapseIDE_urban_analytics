import { beforeEach, describe, expect, it } from 'vitest';

import {
  computeCatalogIndicator,
  createComputedIndicatorRecord,
  getIndicatorDefinition,
  getIndicatorGroup,
  INDICATOR_CATALOG_COUNT,
  listIndicatorCatalogDefinitions,
  listIndicatorDefinitionsForFlow,
  listIndicatorDefinitionsForGroup,
  searchIndicatorDefinitions,
  validateIndicatorCatalogTraceability,
} from '../catalog';
import {
  resolveIndicatorTraceabilityMetadata,
  validateIndicatorTraceabilityMetadata,
} from '../shared';

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

describe('indicator catalog', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });
  });

  it('exposes the 49 Section 11 indicators in the unified catalog', () => {
    expect(INDICATOR_CATALOG_COUNT).toBe(49);
  });

  it('enhances computed results with classification and summary metadata', () => {
    const result = computeCatalogIndicator('modeSplit', {
      walkTrips: 1800,
      cycleTrips: 450,
      transitTrips: 2400,
      carTrips: 2900,
    });

    expect(result.value).toBeCloseTo(61.6, 1);
    expect(result.classification).toBe('Active and transit oriented');
    expect(result.summary).toContain('Observed travel shares');
    expect(result.components).toHaveLength(4);
    expect((result.metadata?.indicatorTraceability as { formula?: string } | undefined)?.formula).toContain('trips');
  });

  it('creates reusable computed records and indexes indicators by related flow', () => {
    const record = createComputedIndicatorRecord('lastMileAccess', {
      populationWithin400m: 16800,
      totalPopulation: 24000,
    });
    const accessibilityIndicators = listIndicatorDefinitionsForFlow('accessibility');

    expect(record.title).toBe('Last-Mile Transit Access');
    expect(record.groupId).toBe('transport_mobility');
    expect(record.computedAt).toBe(record.result.when);
    expect(record.traceability?.units).toBe('%');
    expect(record.traceability?.inputFields.map((field) => field.key)).toEqual(['populationWithin400m', 'totalPopulation']);
    expect(accessibilityIndicators.some((definition) => definition.kind === 'lastMileAccess')).toBe(true);
  });

  it('supports grouped lookup, full-catalog retrieval, and search for methodological terms', () => {
    const allDefinitions = listIndicatorCatalogDefinitions();
    const transportGroup = getIndicatorGroup('transport_mobility');
    const transportIndicators = listIndicatorDefinitionsForGroup('transport_mobility');
    const transitResults = searchIndicatorDefinitions('service frequency');
    const modeSplitDefinition = getIndicatorDefinition('modeSplit');

    expect(allDefinitions).toHaveLength(INDICATOR_CATALOG_COUNT);
    expect(transportGroup?.label).toBe('Transport & Mobility');
    expect(transportIndicators.length).toBeGreaterThan(0);
    expect(transportIndicators.every((definition) => definition.groupId === 'transport_mobility')).toBe(true);
    expect(transitResults.some((definition) => definition.kind === 'transitServiceFrequency')).toBe(true);
    expect(modeSplitDefinition?.title).toBe('Mode Split');
  });

  it('returns sensible fallbacks for blank search queries and unknown identifiers', () => {
    expect(searchIndicatorDefinitions('   ')).toHaveLength(INDICATOR_CATALOG_COUNT);
    expect(getIndicatorGroup('not_a_group' as never)).toBeNull();
    expect(getIndicatorDefinition('notAnIndicator' as never)).toBeNull();
    expect(() => computeCatalogIndicator('notAnIndicator' as never, {})).toThrow('Unknown indicator kind');
    expect(() => createComputedIndicatorRecord('notAnIndicator' as never, {})).toThrow('Unknown indicator kind');
  });

  it('resolves V2 traceability metadata for every catalog indicator without critical gaps', () => {
    const report = validateIndicatorCatalogTraceability();

    expect(report.checked).toBe(INDICATOR_CATALOG_COUNT);
    expect(report.ok).toBe(true);
    expect(report.errorCount).toBe(0);

    for (const definition of listIndicatorCatalogDefinitions()) {
      const metadata = resolveIndicatorTraceabilityMetadata(definition);
      expect(metadata.formula.length).toBeGreaterThan(0);
      expect(metadata.units.length).toBeGreaterThan(0);
      expect(metadata.inputFields.length).toBeGreaterThan(0);
      expect(metadata.interpretation.length).toBeGreaterThan(0);
      expect(metadata.limitations.length).toBeGreaterThan(0);
      expect(metadata.reference.length).toBeGreaterThan(0);
      expect(metadata.capabilityStatus).toMatch(/implemented|demo_mode|residual_gap|environment_dependent|deferred/);
    }
  });

  it('catches missing critical traceability fields on sparse legacy definitions', () => {
    const base = getIndicatorDefinition('modeSplit');
    expect(base).toBeTruthy();
    const { validityEnvelope: _validityEnvelope, ...legacyBase } = base!;

    const sparse = {
      ...legacyBase,
      formula: '',
      unit: '',
      inputFields: [],
      interpretationGuidance: [],
      methodologicalReference: '',
      traceability: {
        formula: '',
        units: '',
        spatialScale: [],
        spatialScaleNote: '',
        inputFields: [],
        interpretation: [],
        reference: '',
        limitations: [],
      },
    };

    const validation = validateIndicatorTraceabilityMetadata(sparse);
    const errorFields = validation.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.field);

    expect(validation.ok).toBe(false);
    expect(errorFields).toEqual(expect.arrayContaining([
      'formula',
      'units',
      'inputFields',
      'interpretation',
      'reference',
      'spatialScale',
    ]));
  });
});
