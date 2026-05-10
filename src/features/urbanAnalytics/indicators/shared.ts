import { z } from 'zod';

import type {
  IndicatorQAStatus,
  IndicatorResult,
  IndicatorResultComponent,
  IndicatorResultQA,
  UrbanIndicatorKind,
  UrbanMethodCapabilityStatus,
  UrbanScale,
} from '../lib/types';
import type {
  IndicatorCatalogDefinition,
  IndicatorCatalogTraceabilityReport,
  IndicatorClassificationBand,
  IndicatorInputFieldDefinition,
  IndicatorInputFieldTrace,
  IndicatorNormalizationMethod,
  IndicatorTemporalScale,
  IndicatorTraceabilityMetadata,
  IndicatorTraceabilityValidationIssue,
  IndicatorTraceabilityValidationResult,
} from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 2): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function safeRatio(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return sum(values) / values.length;
}

export function component(key: string, label: string, value: number, unit?: string): IndicatorResultComponent {
  return {
    key,
    label,
    value,
    ...(unit === undefined ? {} : { unit }),
  };
}

export function createIndicatorResult(
  kind: UrbanIndicatorKind,
  value: number,
  unit: string,
  options?: {
    displayValue?: string;
    classification?: string;
    summary?: string;
    components?: IndicatorResultComponent[];
    metadata?: Record<string, unknown>;
  },
): IndicatorResult {
  return {
    id: `${kind}_${Date.now()}`,
    kind,
    when: new Date().toISOString(),
    value,
    unit,
    ...(options?.displayValue === undefined ? {} : { displayValue: options.displayValue }),
    ...(options?.classification === undefined ? {} : { classification: options.classification }),
    ...(options?.summary === undefined ? {} : { summary: options.summary }),
    ...(options?.components === undefined ? {} : { components: options.components }),
    ...(options?.metadata === undefined ? {} : { metadata: options.metadata }),
  };
}

// ---------------------------------------------------------------------------
// Calculator QA wrappers
// ---------------------------------------------------------------------------

/**
 * Builds a conservative `IndicatorResultQA` record from input values and
 * explicit caller-supplied warnings.
 *
 * @param sourceCalculator - Identifier of the calculator function (e.g. `'modeSplit'`).
 * @param options.inputs - All scalar inputs passed to the calculator.
 * @param options.requiredPositive - Keys from `inputs` that MUST be > 0 for a
 *   valid computation. Any key that is ≤ 0 or non-finite generates an automatic
 *   warning and contributes to `missingnessRate`.
 * @param options.warnings - Additional caller-supplied warning strings (e.g.
 *   domain-specific edge cases detected during computation).
 */
export function buildIndicatorQA(
  sourceCalculator: string,
  options: {
    inputs: Record<string, number>;
    requiredPositive?: readonly string[];
    warnings?: readonly string[];
  },
): IndicatorResultQA {
  const inputKeys = Object.keys(options.inputs);
  const inputCount = inputKeys.length;

  const failingRequired = (options.requiredPositive ?? []).filter(
    (key) => !Number.isFinite(options.inputs[key]) || options.inputs[key] <= 0,
  );

  const missingnessRate =
    inputCount > 0 ? round(failingRequired.length / inputCount, 4) : 0;

  const autoWarnings: string[] = failingRequired.map(
    (key) =>
      `Input "${key}" must be a positive number; the result may be zero or analytically invalid.`,
  );

  const allWarnings: string[] = [...autoWarnings, ...(options.warnings ?? [])];

  const status: IndicatorQAStatus =
    inputCount === 0 || failingRequired.length >= inputCount
      ? 'blocked'
      : allWarnings.length > 0
        ? 'warning'
        : 'valid';

  return {
    status,
    inputCount,
    missingnessRate,
    warnings: allWarnings,
    sourceCalculator,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Attaches a `IndicatorResultQA` record to an existing `IndicatorResult`.
 * Returns a new result object; does not mutate the original.
 */
export function wrapWithQA(result: IndicatorResult, qa: IndicatorResultQA): IndicatorResult {
  return { ...result, qa };
}

export function createInputSchema<Input>(
  fields: IndicatorInputFieldDefinition[],
): z.ZodType<Input> {
  const shape = Object.fromEntries(
    fields.map((field) => {
      let schema = z.number({
        required_error: `${field.label} is required.`,
        invalid_type_error: `${field.label} must be numeric.`,
      });
      if (field.min !== undefined) {
        schema = schema.min(field.min, `${field.label} must be at least ${field.min}.`);
      }
      if (field.max !== undefined) {
        schema = schema.max(field.max, `${field.label} must be at most ${field.max}.`);
      }
      return [field.key, schema];
    }),
  );

  return z.object(shape) as unknown as z.ZodType<Input>;
}

export function createOutputSchema(kind: UrbanIndicatorKind): z.ZodType<IndicatorResult> {
  return z.object({
    id: z.string(),
    kind: z.literal(kind),
    when: z.string(),
    value: z.number(),
    unit: z.string(),
    displayValue: z.string().optional(),
    classification: z.string().optional(),
    summary: z.string().optional(),
    components: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.number(),
        unit: z.string().optional(),
      }),
    ).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    qa: z.object({
      status: z.enum(['valid', 'warning', 'blocked', 'degraded']),
      inputCount: z.number(),
      missingnessRate: z.number(),
      warnings: z.array(z.string()),
      sourceCalculator: z.string(),
      computedAt: z.string(),
    }).optional(),
  }) as z.ZodType<IndicatorResult>;
}

export function createIndicatorDefinition<Input>(
  config: Omit<IndicatorCatalogDefinition<Input>, 'inputSchema' | 'outputSchema'>,
): IndicatorCatalogDefinition<Input> {
  return {
    ...config,
    inputSchema: createInputSchema<Input>(config.inputFields),
    outputSchema: createOutputSchema(config.kind),
  };
}

export function resolveBandLabel(value: number, bands: IndicatorClassificationBand[]): string | null {
  for (const band of bands) {
    const minOk = band.min === undefined || value >= band.min;
    const maxOk = band.max === undefined || value < band.max;
    if (minOk && maxOk) {
      return band.label;
    }
  }
  return null;
}

const SPATIAL_SCALE_VALUES = [
  'parcel',
  'block',
  'neighborhood',
  'district',
  'city',
  'metropolitan',
  'regional',
  'national',
] as const satisfies readonly UrbanScale[];

function compactText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeTextList(values: readonly string[] | undefined): string[] {
  if (!values) return [];
  return values.map(compactText).filter((value) => value.length > 0);
}

function normalizeScaleList(values: readonly UrbanScale[] | undefined): UrbanScale[] {
  if (!values) return [];
  const seen = new Set<UrbanScale>();
  const scales: UrbanScale[] = [];
  for (const value of values) {
    if (!SPATIAL_SCALE_VALUES.includes(value) || seen.has(value)) continue;
    seen.add(value);
    scales.push(value);
  }
  return scales;
}

function inferTemporalScale(definition: IndicatorCatalogDefinition): IndicatorTemporalScale {
  const text = `${definition.unit} ${definition.formula} ${definition.summary} ${definition.methodSummary}`.toLowerCase();
  if (/scenario|forecast|projection/.test(text)) return 'scenario';
  if (/multi[- ]?year|longitudinal|trend/.test(text)) return 'multi-year';
  if (/season|warm season|cooling degree/.test(text)) return 'seasonal';
  if (/annual|year|\/yr|per yr|yr\b/.test(text)) return 'annual';
  if (/month|monthly/.test(text)) return 'monthly';
  if (/daily|\/day|per day|day\b/.test(text)) return 'daily';
  if (/hour|\/h|per hour/.test(text)) return 'hourly';
  return 'study-period';
}

function inferTemporalScaleNote(scale: IndicatorTemporalScale): string {
  if (scale === 'study-period') {
    return 'Uses the analysis period represented by the supplied inputs; confirm temporal alignment before comparing outputs.';
  }
  if (scale === 'not-specified') {
    return 'Temporal scale is not specified in the legacy definition.';
  }
  return `Resolved from formula, unit, or method wording as ${scale}.`;
}

function inferNormalizationMethod(definition: IndicatorCatalogDefinition): IndicatorNormalizationMethod {
  const text = `${definition.unit} ${definition.formula} ${definition.title}`.toLowerCase();
  if (/per[- ]?cap|\/cap|capita|population/.test(text)) return 'per-capita';
  if (/\/m|per area|floor area|hectare|ha\b|m2|m²/.test(text)) return 'per-area';
  if (/lane-km|\/km|per km|network length/.test(text)) return 'per-length';
  if (/\/yr|\/day|per year|per day|hour/.test(text)) return 'per-time';
  if (/%|× 100|x 100|share|percentage/.test(text)) return 'percent';
  if (/ratio/.test(text)) return 'ratio';
  if (/index|score|0-100|0-1/.test(text)) return 'index';
  if (/weighted|mean|average/.test(text)) return 'weighted-mean';
  return 'domain-specific';
}

function inferLimitations(definition: IndicatorCatalogDefinition): string[] {
  const fromEnvelope = normalizeTextList(definition.validityEnvelope?.limitations);
  if (fromEnvelope.length) return fromEnvelope;

  const unitChecks = definition.inputFields
    .filter((field) => field.unit)
    .map((field) => `${field.label} must use ${field.unit} as declared.`);

  return [
    'Inputs must share the same study area, denominator, and temporal window before the result is compared or published.',
    ...unitChecks.slice(0, 2),
  ];
}

function resolveInputFieldTraces(fields: readonly IndicatorInputFieldDefinition[]): IndicatorInputFieldTrace[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    unit: field.unit ?? 'unitless',
    description: field.description,
    required: true,
  }));
}

function resolveCapabilityStatus(definition: IndicatorCatalogDefinition): UrbanMethodCapabilityStatus {
  return definition.traceability?.capabilityStatus
    ?? definition.capabilityStatus
    ?? definition.validityEnvelope?.capabilityStatus
    ?? 'implemented';
}

export function resolveIndicatorTraceabilityMetadata<Input>(
  definition: IndicatorCatalogDefinition<Input>,
): IndicatorTraceabilityMetadata {
  const authored = definition.traceability;
  const envelopeScales = normalizeScaleList(definition.validityEnvelope?.validSpatialScales);
  const authoredScales = normalizeScaleList(authored?.spatialScale);
  const spatialScale = authoredScales.length ? authoredScales : envelopeScales;
  const temporalScale = authored?.temporalScale ?? inferTemporalScale(definition);
  const metadataSource = authored
    ? 'authored'
    : envelopeScales.length
      ? 'validity-envelope'
      : 'legacy-derived';

  return {
    formula: compactText(authored?.formula ?? definition.formula),
    units: compactText(authored?.units ?? definition.unit),
    spatialScale,
    spatialScaleNote: compactText(
      authored?.spatialScaleNote
        ?? (spatialScale.length
          ? `Valid spatial scales: ${spatialScale.join(', ')}.`
          : 'No explicit spatial scale envelope is authored; treat this as a study-area summary until layer scale is checked.'),
    ),
    temporalScale,
    temporalScaleNote: compactText(authored?.temporalScaleNote ?? inferTemporalScaleNote(temporalScale)),
    inputFields: authored?.inputFields?.length
      ? authored.inputFields.map((field) => ({
          key: field.key,
          label: field.label,
          unit: field.unit || 'unitless',
          description: field.description,
          required: field.required,
        }))
      : resolveInputFieldTraces(definition.inputFields),
    normalizationMethod: authored?.normalizationMethod ?? inferNormalizationMethod(definition),
    interpretation: normalizeTextList(authored?.interpretation).length
      ? normalizeTextList(authored?.interpretation)
      : normalizeTextList(definition.interpretationGuidance),
    limitations: normalizeTextList(authored?.limitations).length
      ? normalizeTextList(authored?.limitations)
      : inferLimitations(definition),
    reference: compactText(authored?.reference ?? definition.methodologicalReference),
    sourceNote: compactText(
      authored?.sourceNote
        ?? `Legacy catalog source note: ${definition.methodologicalReference}`,
    ),
    capabilityStatus: resolveCapabilityStatus(definition),
    metadataSource,
  };
}

export function validateIndicatorTraceabilityMetadata<Input>(
  definition: IndicatorCatalogDefinition<Input>,
): IndicatorTraceabilityValidationResult {
  const metadata = resolveIndicatorTraceabilityMetadata(definition);
  const issues: IndicatorTraceabilityValidationIssue[] = [];

  const requireText = (field: keyof IndicatorTraceabilityMetadata, value: string, label: string): void => {
    if (!value.trim()) {
      issues.push({
        field,
        severity: 'error',
        message: `${label} is required for indicator traceability.`,
      });
    }
  };

  requireText('formula', metadata.formula, 'Formula');
  requireText('units', metadata.units, 'Units');
  requireText('reference', metadata.reference, 'Reference or source note');

  if (metadata.inputFields.length === 0) {
    issues.push({
      field: 'inputFields',
      severity: 'error',
      message: 'At least one input field is required for reproducible indicator computation.',
    });
  }

  if (metadata.interpretation.length === 0) {
    issues.push({
      field: 'interpretation',
      severity: 'error',
      message: 'Interpretation guidance is required so results are not presented as context-free numbers.',
    });
  }

  if (metadata.limitations.length === 0) {
    issues.push({
      field: 'limitations',
      severity: 'warning',
      message: 'Limitations should be recorded before formal report or dashboard use.',
    });
  }

  if (metadata.spatialScale.length === 0 && !metadata.spatialScaleNote.trim()) {
    issues.push({
      field: 'spatialScale',
      severity: 'error',
      message: 'Spatial scale or a truthful scale note is required.',
    });
  }

  if (metadata.normalizationMethod === 'legacy-unspecified') {
    issues.push({
      field: 'normalizationMethod',
      severity: 'warning',
      message: 'Normalization method is unspecified in the legacy definition.',
    });
  }

  return {
    ok: issues.every((issue) => issue.severity !== 'error'),
    definitionKind: definition.kind,
    metadata,
    issues,
  };
}

export function validateIndicatorCatalogTraceability(
  definitions: readonly IndicatorCatalogDefinition[],
): IndicatorCatalogTraceabilityReport {
  const results = definitions.map((definition) => validateIndicatorTraceabilityMetadata(definition));
  const issues = results.flatMap((result) => result.issues);
  return {
    ok: results.every((result) => result.ok),
    checked: definitions.length,
    errorCount: issues.filter((issue) => issue.severity === 'error').length,
    warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    results,
  };
}

function resultTraceabilityMetadata(metadata: IndicatorTraceabilityMetadata): Record<string, unknown> {
  return {
    formula: metadata.formula,
    units: metadata.units,
    spatialScale: metadata.spatialScale,
    spatialScaleNote: metadata.spatialScaleNote,
    temporalScale: metadata.temporalScale,
    temporalScaleNote: metadata.temporalScaleNote,
    inputFields: metadata.inputFields,
    normalizationMethod: metadata.normalizationMethod,
    interpretation: metadata.interpretation,
    limitations: metadata.limitations,
    reference: metadata.reference,
    sourceNote: metadata.sourceNote,
    capabilityStatus: metadata.capabilityStatus,
    metadataSource: metadata.metadataSource,
  };
}

export function enhanceIndicatorResult<Input>(
  definition: IndicatorCatalogDefinition<Input>,
  rawResult: IndicatorResult,
): IndicatorResult {
  const classification = rawResult.classification ?? resolveBandLabel(rawResult.value, definition.classification) ?? undefined;
  const traceability = resolveIndicatorTraceabilityMetadata(definition);
  return {
    ...rawResult,
    ...(classification === undefined ? {} : { classification }),
    ...(rawResult.summary === undefined ? { summary: definition.summary } : {}),
    metadata: {
      ...(rawResult.metadata ?? {}),
      indicatorTraceability: resultTraceabilityMetadata(traceability),
    },
  };
}
