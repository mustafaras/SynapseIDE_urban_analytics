import { describe, expect, it } from 'vitest';

import type { IndicatorResult } from '../../lib/types';
import {
  connectivityCases,
  type IndicatorExpectation,
  legacyCalculatorCasesByDomain,
  legacyEdgeCasesByDomain,
} from './fixtures/legacyDomains';

function expectIndicator(result: IndicatorResult, expected: IndicatorExpectation) {
  expect(result.kind).toBe(expected.kind);
  expect(result.unit).toBe(expected.unit);

  if (Number.isFinite(expected.value)) {
    expect(result.value).toBeCloseTo(expected.value, expected.precision ?? 6);
  } else {
    expect(result.value).toBe(expected.value);
  }

  if (expected.metadata) {
    expect(result.metadata).toEqual(expect.objectContaining(expected.metadata));
  }
}

describe('legacy analytical calculators', () => {
  for (const [domain, cases] of Object.entries(legacyCalculatorCasesByDomain)) {
    describe(domain, () => {
      for (const testCase of cases) {
        it(testCase.name, () => {
          expectIndicator(testCase.execute(), testCase.expected);
        });
      }
    });
  }

  describe('graph connectivity metrics', () => {
    for (const testCase of connectivityCases) {
      it(testCase.name, () => {
        const result = testCase.execute();
        expectIndicator(result.alpha, testCase.expected.alpha);
        expectIndicator(result.beta, testCase.expected.beta);
        expectIndicator(result.gamma, testCase.expected.gamma);
      });
    }
  });

  describe('edge-case matrix', () => {
    for (const [domain, cases] of Object.entries(legacyEdgeCasesByDomain)) {
      describe(domain, () => {
        for (const testCase of cases) {
          it(testCase.name, () => {
            expectIndicator(testCase.execute(), testCase.expected);
          });
        }
      });
    }
  });
});