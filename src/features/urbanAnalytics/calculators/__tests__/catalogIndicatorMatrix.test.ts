import { describe, expect, it } from 'vitest';

import {
  computeCatalogIndicator,
  INDICATOR_CATALOG_COUNT,
} from '../../indicators/catalog';
import {
  buildBelowMinimumInput,
  buildMissingFieldInput,
  catalogDefinitionsByDomain,
  catalogEdgeCasesByDomain,
} from './fixtures/catalogDomains';

describe('expanded indicator catalog matrix', () => {
  it('covers all 49 expanded prompt-36 indicators through the catalog registry', () => {
    expect(INDICATOR_CATALOG_COUNT).toBe(49);
  });

  for (const [groupId, cases] of Object.entries(catalogDefinitionsByDomain)) {
    describe(groupId, () => {
      for (const { definition, input } of cases) {
        it(`${definition.kind} computes from its domain-default fixture`, () => {
          const result = computeCatalogIndicator(definition.kind, input);

          expect(result.kind).toBe(definition.kind);
          expect(result.unit).toBe(definition.unit);
          expect(Number.isFinite(result.value)).toBe(true);
          expect(result.summary).toBe(definition.summary);
          expect(result.classification).toBeTruthy();
        });

        it(`${definition.kind} rejects missing values`, () => {
          const { input: missingInput } = buildMissingFieldInput(definition);

          expect(() => computeCatalogIndicator(definition.kind, missingInput)).toThrow();
        });

        it(`${definition.kind} rejects invalid parameters below schema minima`, () => {
          const { input: invalidInput } = buildBelowMinimumInput(definition);

          expect(() => computeCatalogIndicator(definition.kind, invalidInput)).toThrow();
        });
      }

      for (const edgeCase of catalogEdgeCasesByDomain[groupId as keyof typeof catalogEdgeCasesByDomain] ?? []) {
        it(edgeCase.name, () => {
          const result = edgeCase.execute();

          expect(result.kind).toBe(edgeCase.expected.kind);
          expect(result.unit).toBe(edgeCase.expected.unit);

          if (Number.isFinite(edgeCase.expected.value)) {
            expect(result.value).toBeCloseTo(edgeCase.expected.value, edgeCase.expected.precision ?? 6);
          } else {
            expect(result.value).toBe(edgeCase.expected.value);
          }

          if (edgeCase.expected.classification) {
            expect(result.classification).toBe(edgeCase.expected.classification);
          }

          if (edgeCase.expected.metadata) {
            expect(result.metadata).toEqual(expect.objectContaining(edgeCase.expected.metadata));
          }
        });
      }
    });
  }
});