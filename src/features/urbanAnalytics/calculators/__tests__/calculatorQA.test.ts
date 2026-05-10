/**
 * Prompt 13 — Indicator Calculators QA and Unit Semantics
 *
 * Verifies that representative QA-hardened calculators attach a truthful
 * `IndicatorResultQA` record to their output.  Mathematical correctness of
 * formulas is covered by the existing catalogIndicatorMatrix and
 * legacyCalculators test suites; this file focuses exclusively on QA
 * metadata quality and the `buildIndicatorQA` / `wrapWithQA` helpers.
 */

import { describe, expect, it } from 'vitest';

import { buildIndicatorQA, wrapWithQA } from '../../indicators/shared';
import { buildingEnergyIntensity, carbonFootprintPerCapita } from '../energyClimate';
import { modeSplit } from '../transportMobility';

// ---------------------------------------------------------------------------
// buildIndicatorQA helper — unit tests
// ---------------------------------------------------------------------------

describe('buildIndicatorQA helper', () => {
  it('returns valid status when all required-positive inputs are positive', () => {
    const qa = buildIndicatorQA('testCalc', {
      inputs: { a: 10, b: 5 },
      requiredPositive: ['a', 'b'],
    });

    expect(qa.status).toBe('valid');
    expect(qa.inputCount).toBe(2);
    expect(qa.missingnessRate).toBe(0);
    expect(qa.warnings).toHaveLength(0);
    expect(qa.sourceCalculator).toBe('testCalc');
    expect(qa.computedAt).toBeTruthy();
    expect(new Date(qa.computedAt).getTime()).not.toBeNaN();
  });

  it('returns warning status when a required-positive input is zero', () => {
    const qa = buildIndicatorQA('testCalc', {
      inputs: { area: 0, energy: 500 },
      requiredPositive: ['area'],
    });

    expect(qa.status).toBe('warning');
    expect(qa.missingnessRate).toBe(0.5); // 1 failing / 2 total
    expect(qa.warnings.length).toBeGreaterThan(0);
    expect(qa.warnings[0]).toContain('"area"');
  });

  it('returns warning status when a required-positive input is negative', () => {
    const qa = buildIndicatorQA('testCalc', {
      inputs: { area: -10, energy: 500 },
      requiredPositive: ['area'],
    });

    expect(qa.status).toBe('warning');
    expect(qa.warnings.some((w) => w.includes('"area"'))).toBe(true);
  });

  it('returns blocked status when all inputs are invalid', () => {
    const qa = buildIndicatorQA('testCalc', {
      inputs: { a: 0, b: 0 },
      requiredPositive: ['a', 'b'],
    });

    expect(qa.status).toBe('blocked');
    expect(qa.missingnessRate).toBe(1);
  });

  it('returns blocked status when no inputs are provided', () => {
    const qa = buildIndicatorQA('testCalc', { inputs: {} });

    expect(qa.status).toBe('blocked');
    expect(qa.inputCount).toBe(0);
    expect(qa.missingnessRate).toBe(0);
  });

  it('propagates caller-supplied warnings into warning status', () => {
    const qa = buildIndicatorQA('testCalc', {
      inputs: { a: 5 },
      warnings: ['Study period is shorter than recommended for this method.'],
    });

    expect(qa.status).toBe('warning');
    expect(qa.warnings).toContain('Study period is shorter than recommended for this method.');
  });

  it('wrapWithQA attaches QA to an existing result without mutating the original', () => {
    const qa = buildIndicatorQA('testCalc', { inputs: { a: 1 } });
    const base = modeSplit({ walkTrips: 10, cycleTrips: 5, transitTrips: 20, carTrips: 15 });

    // Remove any existing qa for this test to isolate wrap behaviour
    const { qa: _existing, ...baseWithoutQA } = base;
    const wrapped = wrapWithQA(baseWithoutQA as typeof base, qa);

    expect(wrapped.qa).toBe(qa);
    expect(wrapped.value).toBe(base.value);
    expect(wrapped.kind).toBe(base.kind);
    // Original not mutated
    expect(baseWithoutQA).not.toHaveProperty('qa');
  });
});

// ---------------------------------------------------------------------------
// modeSplit — QA semantics
// ---------------------------------------------------------------------------

describe('modeSplit QA semantics', () => {
  it('attaches valid QA when all trip counts are positive', () => {
    const result = modeSplit({
      walkTrips: 1800,
      cycleTrips: 450,
      transitTrips: 2400,
      carTrips: 2900,
    });

    expect(result.qa).toBeDefined();
    expect(result.qa?.status).toBe('valid');
    expect(result.qa?.inputCount).toBe(4);
    expect(result.qa?.missingnessRate).toBe(0);
    expect(result.qa?.warnings).toHaveLength(0);
    expect(result.qa?.sourceCalculator).toBe('modeSplit');
    expect(result.qa?.computedAt).toBeTruthy();
  });

  it('attaches warning QA when total trips are zero', () => {
    const result = modeSplit({
      walkTrips: 0,
      cycleTrips: 0,
      transitTrips: 0,
      carTrips: 0,
    });

    expect(result.qa?.status).toBe('warning');
    expect(result.qa?.warnings.length).toBeGreaterThan(0);
    expect(result.qa?.warnings[0]).toContain('No observed trips');
    // Computation produced a zero result — mathematical output is still defined
    expect(result.value).toBe(0);
    expect(result.classification).toBe('No sample');
  });

  it('QA inputCount reflects the number of input fields regardless of zero values', () => {
    const result = modeSplit({
      walkTrips: 100,
      cycleTrips: 0,
      transitTrips: 50,
      carTrips: 0,
    });

    // No warning — sum > 0 so computation is valid
    expect(result.qa?.status).toBe('valid');
    expect(result.qa?.inputCount).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// buildingEnergyIntensity — QA semantics
// ---------------------------------------------------------------------------

describe('buildingEnergyIntensity QA semantics', () => {
  it('attaches valid QA for well-formed inputs', () => {
    const result = buildingEnergyIntensity({
      annualEnergyKWh: 1_880_000,
      floorAreaM2: 12_800,
    });

    expect(result.qa?.status).toBe('valid');
    expect(result.qa?.inputCount).toBe(2);
    expect(result.qa?.missingnessRate).toBe(0);
    expect(result.qa?.warnings).toHaveLength(0);
    expect(result.qa?.sourceCalculator).toBe('buildingEnergyIntensity');
  });

  it('attaches warning QA when floor area is zero', () => {
    const result = buildingEnergyIntensity({
      annualEnergyKWh: 500_000,
      floorAreaM2: 0,
    });

    expect(result.qa?.status).toBe('warning');
    // 1 of 2 inputs failing → missingnessRate = 0.5
    expect(result.qa?.missingnessRate).toBe(0.5);
    expect(result.qa?.warnings.some((w) => w.includes('"floorAreaM2"'))).toBe(true);
    // Computation returned safe zero value
    expect(result.value).toBe(0);
  });

  it('attaches warning QA when floor area is negative', () => {
    const result = buildingEnergyIntensity({
      annualEnergyKWh: 200_000,
      floorAreaM2: -100,
    });

    expect(result.qa?.status).toBe('warning');
    expect(result.qa?.warnings.some((w) => w.includes('"floorAreaM2"'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// carbonFootprintPerCapita — QA semantics
// ---------------------------------------------------------------------------

describe('carbonFootprintPerCapita QA semantics', () => {
  it('attaches valid QA for well-formed inputs', () => {
    const result = carbonFootprintPerCapita({
      buildingEmissionsTCO2e: 12_000,
      transportEmissionsTCO2e: 8_500,
      wasteEmissionsTCO2e: 1_200,
      population: 50_000,
    });

    expect(result.qa?.status).toBe('valid');
    expect(result.qa?.inputCount).toBe(4);
    expect(result.qa?.missingnessRate).toBe(0);
    expect(result.qa?.warnings).toHaveLength(0);
    expect(result.qa?.sourceCalculator).toBe('carbonFootprintPerCapita');
  });

  it('attaches warning QA when population is zero', () => {
    const result = carbonFootprintPerCapita({
      buildingEmissionsTCO2e: 12_000,
      transportEmissionsTCO2e: 8_500,
      wasteEmissionsTCO2e: 1_200,
      population: 0,
    });

    expect(result.qa?.status).toBe('warning');
    // 1 of 4 inputs failing → missingnessRate = 0.25
    expect(result.qa?.missingnessRate).toBe(0.25);
    expect(result.qa?.warnings.some((w) => w.includes('"population"'))).toBe(true);
    expect(result.value).toBe(0);
  });

  it('attaches warning QA when population is negative', () => {
    const result = carbonFootprintPerCapita({
      buildingEmissionsTCO2e: 5_000,
      transportEmissionsTCO2e: 3_000,
      wasteEmissionsTCO2e: 500,
      population: -1,
    });

    expect(result.qa?.status).toBe('warning');
    expect(result.qa?.warnings.some((w) => w.includes('"population"'))).toBe(true);
  });

  it('accepts zero emissions inputs as valid — only population is required-positive', () => {
    const result = carbonFootprintPerCapita({
      buildingEmissionsTCO2e: 0,
      transportEmissionsTCO2e: 0,
      wasteEmissionsTCO2e: 0,
      population: 10_000,
    });

    // Zero-emissions is a valid analytical result (e.g. net-zero scenario)
    expect(result.qa?.status).toBe('valid');
    expect(result.value).toBe(0);
  });
});
