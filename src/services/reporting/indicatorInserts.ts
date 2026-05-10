import {
  getIndicatorDefinition,
  getIndicatorGroup,
} from '@/features/urbanAnalytics/indicators/catalog';
import { resolveIndicatorTraceabilityMetadata } from '@/features/urbanAnalytics/indicators/shared';
import type { ComputedIndicatorRecord } from '@/features/urbanAnalytics/indicators/types';

import { enqueuePendingInsert } from './storage';
import type { PendingReportInsert } from './types';

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function createIndicatorPendingInsert(record: ComputedIndicatorRecord): PendingReportInsert {
  const definition = getIndicatorDefinition(record.kind);
  if (!definition) {
    throw new Error(`Unknown indicator kind: ${record.kind}`);
  }

  const group = getIndicatorGroup(definition.groupId);
  const classification = record.result.classification ?? 'Unclassified';
  const headlineValue = record.result.displayValue ?? `${record.result.value} ${record.result.unit}`.trim();
  const traceability = record.traceability ?? resolveIndicatorTraceabilityMetadata(definition);
  const componentItems = record.result.components?.map((component) => (
    `${component.label}: ${component.value}${component.unit ? ` ${component.unit}` : ''}`
  )) ?? [];

  return {
    id: `indicator-${record.kind}-${slugify(record.computedAt)}`,
    insertedAt: new Date().toISOString(),
    source: `indicator:${record.kind}`,
    suggestedTitle: `${definition.title} Indicator Readout`,
    citations: [],
    sections: [
      {
        id: `indicator-section-${record.kind}`,
        title: `${definition.title} — Analytical Readout`,
        kind: 'analysis',
        origin: 'generated',
        generated: true,
        badgeLabel: 'Indicator result',
        citationIds: [],
        summary: definition.summary,
        blocks: [
          {
            kind: 'paragraph',
            text: `${definition.title} was computed at ${headlineValue}. Classification: ${classification}. ${record.result.summary ?? definition.summary}`,
          },
          {
            kind: 'bullet_list',
            items: [
              `Thematic group: ${group?.label ?? definition.groupId}`,
              `Formula: ${traceability.formula}`,
              `Unit: ${traceability.units}`,
              `Spatial scale: ${traceability.spatialScale.length ? traceability.spatialScale.join(', ') : traceability.spatialScaleNote}`,
              `Temporal scale: ${traceability.temporalScale} — ${traceability.temporalScaleNote}`,
              `Normalization: ${traceability.normalizationMethod}`,
              `Method summary: ${definition.methodSummary}`,
              `Methodological reference: ${traceability.reference}`,
              `Limitations: ${traceability.limitations.slice(0, 2).join(' ')}`,
              ...componentItems,
              ...traceability.interpretation.slice(0, 2),
            ],
          },
        ],
      },
    ],
  };
}

export function enqueueIndicatorPendingInsert(record: ComputedIndicatorRecord): PendingReportInsert {
  const insert = createIndicatorPendingInsert(record);
  enqueuePendingInsert(insert);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reporting/pending-changed'));
  }
  return insert;
}
