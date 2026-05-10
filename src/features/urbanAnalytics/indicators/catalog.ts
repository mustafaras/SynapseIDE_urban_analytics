import {
  ENERGY_CLIMATE_INDICATORS,
  GOVERNANCE_INNOVATION_INDICATORS,
  HERITAGE_CULTURE_INDICATORS,
  PANDEMIC_RESILIENCE_INDICATORS,
  SOCIAL_LIVEABILITY_INDICATORS,
  TRANSPORT_MOBILITY_INDICATORS,
  URBAN_FORM_LANDSCAPE_INDICATORS,
  WATER_INFRASTRUCTURE_INDICATORS,
} from '../calculators';
import { applyUrbanMethodValidityPreset } from '../context/methodValidity';
import type { AnalyticalFlowId, IndicatorResult, UrbanIndicatorKind } from '../lib/types';
import {
  enhanceIndicatorResult,
  resolveIndicatorTraceabilityMetadata,
  validateIndicatorCatalogTraceability as validateIndicatorCatalogTraceabilityDefinitions,
} from './shared';
import type {
  ComputedIndicatorRecord,
  IndicatorCatalogDefinition,
  IndicatorCatalogGroup,
  IndicatorCatalogGroupId,
  IndicatorCatalogTraceabilityReport,
} from './types';

export const INDICATOR_CATALOG_GROUPS: IndicatorCatalogGroup[] = [
  {
    id: 'transport_mobility',
    label: 'Transport & Mobility',
    description: 'Network throughput, access, safety, and modal balance for transport diagnostics.',
    accentColor: '#e0a94a',
  },
  {
    id: 'energy_climate',
    label: 'Energy & Climate',
    description: 'Operational energy, carbon, and climate-response indicators for mitigation and adaptation work.',
    accentColor: '#d86f3d',
  },
  {
    id: 'urban_form_landscape',
    label: 'Urban Form & Landscape Ecology',
    description: 'Density, fabric, and landscape-structure indicators for built-form interpretation.',
    accentColor: '#c8a85a',
  },
  {
    id: 'social_liveability',
    label: 'Social Infrastructure & Liveability',
    description: 'Equity, amenity, and public-space quality indicators for lived urban experience.',
    accentColor: '#d7b86f',
  },
  {
    id: 'water_infrastructure',
    label: 'Water & Infrastructure',
    description: 'Consumption, runoff, utility reliability, and grey-green infrastructure capacity.',
    accentColor: '#d9913d',
  },
  {
    id: 'governance_innovation',
    label: 'Governance & Innovation',
    description: 'Permitting, participation, data maturity, and readiness indicators for institutional capacity.',
    accentColor: '#ba8a4a',
  },
  {
    id: 'heritage_culture',
    label: 'Heritage & Culture',
    description: 'Built and intangible heritage continuity indicators for conservation-aware urban analysis.',
    accentColor: '#b97245',
  },
  {
    id: 'pandemic_resilience',
    label: 'Pandemic Resilience',
    description: 'Spatial resilience indicators covering essential services, density risk, and digital equity.',
    accentColor: '#d4a14a',
  },
];

export const INDICATOR_CATALOG: IndicatorCatalogDefinition[] = [
  ...TRANSPORT_MOBILITY_INDICATORS,
  ...ENERGY_CLIMATE_INDICATORS,
  ...URBAN_FORM_LANDSCAPE_INDICATORS,
  ...SOCIAL_LIVEABILITY_INDICATORS,
  ...WATER_INFRASTRUCTURE_INDICATORS,
  ...GOVERNANCE_INNOVATION_INDICATORS,
  ...HERITAGE_CULTURE_INDICATORS,
  ...PANDEMIC_RESILIENCE_INDICATORS,
].map((definition) => applyUrbanMethodValidityPreset(definition, `indicator:${definition.kind}`));

export const INDICATOR_CATALOG_COUNT = INDICATOR_CATALOG.length;

export const INDICATOR_CATALOG_GROUP_MAP = new Map<IndicatorCatalogGroupId, IndicatorCatalogGroup>(
  INDICATOR_CATALOG_GROUPS.map((group) => [group.id, group]),
);

export const INDICATOR_CATALOG_MAP = new Map<UrbanIndicatorKind, IndicatorCatalogDefinition>(
  INDICATOR_CATALOG.map((definition) => [definition.kind, definition]),
);

export function listIndicatorCatalogDefinitions(): IndicatorCatalogDefinition[] {
  return INDICATOR_CATALOG;
}

export function getIndicatorGroup(groupId: IndicatorCatalogGroupId): IndicatorCatalogGroup | null {
  return INDICATOR_CATALOG_GROUP_MAP.get(groupId) ?? null;
}

export function getIndicatorDefinition(kind: UrbanIndicatorKind): IndicatorCatalogDefinition | null {
  return INDICATOR_CATALOG_MAP.get(kind) ?? null;
}

export function listIndicatorDefinitionsForGroup(groupId: IndicatorCatalogGroupId): IndicatorCatalogDefinition[] {
  return INDICATOR_CATALOG.filter((definition) => definition.groupId === groupId);
}

export function listIndicatorDefinitionsForFlow(flowId: AnalyticalFlowId | string): IndicatorCatalogDefinition[] {
  return INDICATOR_CATALOG.filter((definition) => definition.relatedFlowIds.includes(flowId as AnalyticalFlowId));
}

export function searchIndicatorDefinitions(query: string): IndicatorCatalogDefinition[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return INDICATOR_CATALOG;
  }

  return INDICATOR_CATALOG.filter((definition) => {
    const traceability = resolveIndicatorTraceabilityMetadata(definition);
    const haystack = [
      definition.title,
      definition.summary,
      definition.methodSummary,
      definition.formula,
      definition.unit,
      definition.methodologicalReference,
      traceability.normalizationMethod,
      traceability.spatialScaleNote,
      traceability.temporalScaleNote,
      definition.groupId,
      ...definition.tags,
      ...definition.relatedFlowIds,
      ...definition.interpretationGuidance,
      ...traceability.limitations,
      ...traceability.inputFields.flatMap((field) => [
        field.label,
        field.key,
        field.unit,
      ]),
    ].join(' ').toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function computeCatalogIndicator(
  kind: UrbanIndicatorKind,
  input: Record<string, number>,
): IndicatorResult {
  const definition = getIndicatorDefinition(kind);
  if (!definition) {
    throw new Error(`Unknown indicator kind: ${kind}`);
  }

  const parsedInput = definition.inputSchema.parse(input) as Record<string, number>;
  const rawResult = definition.compute(parsedInput);
  const enhancedResult = enhanceIndicatorResult(definition, rawResult);
  return definition.outputSchema.parse(enhancedResult);
}

export function validateIndicatorCatalogTraceability(
  definitions: readonly IndicatorCatalogDefinition[] = INDICATOR_CATALOG,
): IndicatorCatalogTraceabilityReport {
  return validateIndicatorCatalogTraceabilityDefinitions(definitions);
}

export function createComputedIndicatorRecord(
  kind: UrbanIndicatorKind,
  input: Record<string, number>,
): ComputedIndicatorRecord {
  const definition = getIndicatorDefinition(kind);
  if (!definition) {
    throw new Error(`Unknown indicator kind: ${kind}`);
  }

  const parsedInput = definition.inputSchema.parse(input) as Record<string, number>;
  const result = computeCatalogIndicator(kind, parsedInput);
  const traceability = resolveIndicatorTraceabilityMetadata(definition);

  return {
    kind,
    title: definition.title,
    groupId: definition.groupId,
    computedAt: result.when,
    inputs: parsedInput,
    result,
    traceability,
  };
}
