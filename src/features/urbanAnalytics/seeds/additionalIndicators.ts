import { listIndicatorCatalogDefinitions } from '../indicators/catalog';
import type { Card } from '../lib/types';

function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export function buildAdditionalIndicatorCards(existing?: Set<string>): Card[] {
  return listIndicatorCatalogDefinitions()
    .map((definition) => {
      const id = `prompt36-${definition.kind}`;
      return {
        id,
        title: definition.title,
        sectionId: definition.sectionId,
        summary: `${definition.summary} Formula: ${definition.formula}. Unit: ${definition.unit}.`,
        tags: definition.tags,
        methodology: [
          definition.methodSummary,
          `Inputs: ${definition.inputFields.map((field) => `${field.label}${field.unit ? ` (${field.unit})` : ''}`).join(', ')}.`,
          `Outputs: ${definition.outputFields.map((field) => field.label).join(', ')}.`,
          `Interpretation: ${definition.interpretationGuidance.join(' ')}`,
        ].join('\n'),
        tools: ['Indicator Catalog', 'Dashboard Builder', 'Report Builder'],
        examples: definition.relatedFlowIds.map((flowId) => `Related analytical flow: ${titleCase(flowId)}`),
        evidence: [definition.methodologicalReference],
        limitations: definition.interpretationGuidance.join(' '),
      } satisfies Card;
    })
    .filter((card) => !existing?.has(card.id));
}