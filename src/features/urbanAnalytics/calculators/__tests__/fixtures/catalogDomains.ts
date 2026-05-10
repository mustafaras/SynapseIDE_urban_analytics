import {
  computeCatalogIndicator,
  INDICATOR_CATALOG,
} from '../../../indicators/catalog';
import type { IndicatorCatalogDefinition, IndicatorCatalogGroupId } from '../../../indicators/types';
import type { IndicatorResult } from '../../../lib/types';
import { vehicleKmTravelled } from '../../transportMobility';
import { urbanAlbedo } from '../../energyClimate';
import { fractalDimension, spacematrixPosition } from '../../urbanFormLandscape';

export interface CatalogDomainCase {
  definition: IndicatorCatalogDefinition;
  input: Record<string, number>;
}

export interface CatalogEdgeCase {
  name: string;
  execute: () => IndicatorResult;
  expected: {
    kind: IndicatorResult['kind'];
    value: number;
    precision?: number;
    unit: string;
    classification?: string;
    metadata?: Record<string, unknown>;
  };
}

export function buildDefaultInput(definition: IndicatorCatalogDefinition): Record<string, number> {
  return Object.fromEntries(definition.inputFields.map((field) => [field.key, field.defaultValue]));
}

export function buildMissingFieldInput(definition: IndicatorCatalogDefinition): {
  fieldKey: string;
  input: Record<string, number>;
} {
  const input = buildDefaultInput(definition);
  const fieldKey = definition.inputFields[0]?.key ?? 'unknown';
  delete input[fieldKey];
  return { fieldKey, input };
}

export function buildBelowMinimumInput(definition: IndicatorCatalogDefinition): {
  fieldKey: string;
  invalidValue: number;
  input: Record<string, number>;
} {
  const input = buildDefaultInput(definition);
  const field = definition.inputFields.find((candidate) => candidate.min !== undefined) ?? definition.inputFields[0];
  const invalidValue = field?.min === undefined
    ? Number.NaN
    : field.min - Math.max(field.step ?? 1, 1);

  if (field) {
    input[field.key] = invalidValue;
  }

  return {
    fieldKey: field?.key ?? 'unknown',
    invalidValue,
    input,
  };
}

export const catalogDefinitionsByDomain = INDICATOR_CATALOG.reduce<Record<IndicatorCatalogGroupId, CatalogDomainCase[]>>(
  (groups, definition) => {
    groups[definition.groupId].push({ definition, input: buildDefaultInput(definition) });
    return groups;
  },
  {
    transport_mobility: [],
    energy_climate: [],
    urban_form_landscape: [],
    social_liveability: [],
    water_infrastructure: [],
    governance_innovation: [],
    heritage_culture: [],
    pandemic_resilience: [],
  },
);

export const catalogEdgeCasesByDomain: Partial<Record<IndicatorCatalogGroupId, CatalogEdgeCase[]>> = {
  transport_mobility: [
    {
      name: 'vehicleKmTravelled remains finite for metropolitan-scale traffic volumes',
      execute: () =>
        vehicleKmTravelled({
          arterialAADT: 150000,
          arterialLengthKm: 120,
          collectorAADT: 75000,
          collectorLengthKm: 220,
          localAADT: 25000,
          localLengthKm: 420,
        }),
      expected: {
        kind: 'vehicleKmTravelled',
        value: 45000000,
        precision: 2,
        unit: 'veh-km/day',
        metadata: {
          arterialShare: 40,
          collectorShare: 36.7,
          localShare: 23.3,
        },
      },
    },
  ],
  energy_climate: [
    {
      name: 'urbanAlbedo clamps over-reflective inputs to the physical maximum',
      execute: () => urbanAlbedo({ reflectedShortwave: 1200, incomingShortwave: 800 }),
      expected: {
        kind: 'urbanAlbedo',
        value: 1,
        precision: 3,
        unit: 'ratio [0-1]',
      },
    },
  ],
  urban_form_landscape: [
    {
      name: 'spacematrixPosition tolerates zero-area geometry pathologies without throwing',
      execute: () =>
        spacematrixPosition({
          grossFloorAreaM2: 5000,
          plotAreaM2: 0,
          footprintAreaM2: 1200,
        }),
      expected: {
        kind: 'spacematrixPosition',
        value: 0,
        precision: 3,
        unit: 'FSI/GSI coordinate',
        classification: 'Open low-rise fabric',
        metadata: { gsi: 0, spacematrixLabel: 'Open low-rise fabric' },
      },
    },
    {
      name: 'fractalDimension falls back cleanly when patch area collapses to zero',
      execute: () => fractalDimension({ perimeterM: 150, areaM2: 0 }),
      expected: {
        kind: 'fractalDimension',
        value: 0,
        precision: 3,
        unit: 'dimensionless',
      },
    },
  ],
};

export function computeDomainIndicator(definition: IndicatorCatalogDefinition): IndicatorResult {
  return computeCatalogIndicator(definition.kind, buildDefaultInput(definition));
}