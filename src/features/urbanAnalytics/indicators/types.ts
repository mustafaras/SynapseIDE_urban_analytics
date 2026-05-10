import type { ZodType } from 'zod';

import type {
  AnalyticalFlowId,
  IndicatorResult,
  SectionId,
  UrbanIndicatorKind,
  UrbanMethodCapabilityStatus,
  UrbanMethodValidityEnvelope,
  UrbanScale,
  UrbanTag,
} from '../lib/types';
import type { LearningPathId, MethodologyExplainerId } from '@/features/education/types';

export type IndicatorCatalogGroupId =
  | 'transport_mobility'
  | 'energy_climate'
  | 'urban_form_landscape'
  | 'social_liveability'
  | 'water_infrastructure'
  | 'governance_innovation'
  | 'heritage_culture'
  | 'pandemic_resilience';

export interface IndicatorCatalogGroup {
  id: IndicatorCatalogGroupId;
  label: string;
  description: string;
  accentColor: string;
}

export interface IndicatorInputFieldDefinition {
  key: string;
  label: string;
  description: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
}

export interface IndicatorOutputFieldDefinition {
  key: string;
  label: string;
  description: string;
  unit?: string;
}

export interface IndicatorClassificationBand {
  label: string;
  description: string;
  min?: number;
  max?: number;
}

export interface IndicatorEducationContext {
  pathId?: LearningPathId;
  explainerId?: MethodologyExplainerId;
  note: string;
}

export type IndicatorTemporalScale =
  | 'instantaneous'
  | 'hourly'
  | 'daily'
  | 'monthly'
  | 'seasonal'
  | 'annual'
  | 'multi-year'
  | 'study-period'
  | 'scenario'
  | 'not-specified';

export type IndicatorNormalizationMethod =
  | 'none'
  | 'ratio'
  | 'percent'
  | 'per-capita'
  | 'per-area'
  | 'per-length'
  | 'per-time'
  | 'index'
  | 'weighted-mean'
  | 'domain-specific'
  | 'legacy-unspecified';

export type IndicatorTraceabilityMetadataSource =
  | 'authored'
  | 'validity-envelope'
  | 'legacy-derived';

export interface IndicatorInputFieldTrace {
  key: string;
  label: string;
  unit: string;
  description: string;
  required: boolean;
}

export interface IndicatorTraceabilityMetadata {
  formula: string;
  units: string;
  spatialScale: UrbanScale[];
  spatialScaleNote: string;
  temporalScale: IndicatorTemporalScale;
  temporalScaleNote: string;
  inputFields: IndicatorInputFieldTrace[];
  normalizationMethod: IndicatorNormalizationMethod;
  interpretation: string[];
  limitations: string[];
  reference: string;
  sourceNote: string;
  capabilityStatus: UrbanMethodCapabilityStatus;
  metadataSource: IndicatorTraceabilityMetadataSource;
}

export type IndicatorTraceabilityIssueSeverity = 'error' | 'warning';

export interface IndicatorTraceabilityValidationIssue {
  field: keyof IndicatorTraceabilityMetadata | 'definition';
  severity: IndicatorTraceabilityIssueSeverity;
  message: string;
}

export interface IndicatorTraceabilityValidationResult {
  ok: boolean;
  definitionKind: UrbanIndicatorKind;
  metadata: IndicatorTraceabilityMetadata;
  issues: IndicatorTraceabilityValidationIssue[];
}

export interface IndicatorCatalogTraceabilityReport {
  ok: boolean;
  checked: number;
  errorCount: number;
  warningCount: number;
  results: IndicatorTraceabilityValidationResult[];
}

export interface IndicatorCatalogDefinition<Input = unknown> {
  kind: UrbanIndicatorKind;
  title: string;
  groupId: IndicatorCatalogGroupId;
  summary: string;
  methodSummary: string;
  formula: string;
  unit: string;
  inputFields: IndicatorInputFieldDefinition[];
  inputSchema: ZodType<Input>;
  outputSchema: ZodType<IndicatorResult>;
  outputFields: IndicatorOutputFieldDefinition[];
  classification: IndicatorClassificationBand[];
  interpretationGuidance: string[];
  methodologicalReference: string;
  referenceUrl?: string;
  sectionId: SectionId;
  tags: UrbanTag[];
  relatedFlowIds: AnalyticalFlowId[];
  education: IndicatorEducationContext;
  dashboardBindingKind?: 'auto' | 'metric' | 'series' | 'text';
  traceability?: Partial<IndicatorTraceabilityMetadata>;
  validityEnvelope?: UrbanMethodValidityEnvelope;
  capabilityStatus?: UrbanMethodCapabilityStatus;
  compute(input: Input): IndicatorResult;
}

export interface IndicatorCatalogFocusRequest {
  view?: 'indicators';
  indicatorKind?: UrbanIndicatorKind;
  groupId?: IndicatorCatalogGroupId;
  query?: string;
  requestedAt: number;
}

export interface ComputedIndicatorRecord {
  kind: UrbanIndicatorKind;
  title: string;
  groupId: IndicatorCatalogGroupId;
  computedAt: string;
  inputs: Record<string, number>;
  result: IndicatorResult;
  traceability?: IndicatorTraceabilityMetadata;
}
