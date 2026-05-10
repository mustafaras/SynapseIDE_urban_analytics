/**
 * Urban Analytics — IDE Code Artifact Request Service (Prompt 18)
 *
 * Single contract for building reproducible Synapse IDE code artifact requests
 * (Python script, JSON manifest, Markdown method note, TypeScript adapter
 * snippet) and routing them through the editor bridge as explicit, guarded
 * actions. Urban Analytics requests code; Synapse IDE owns editor state.
 *
 * Scientific contract enforced by this module:
 *   - Generators always emit a provenance/limitations header. Bare body text
 *     is wrapped before it can reach the IDE.
 *   - Bridge actions always open a NEW tab — never silent insert into the
 *     active tab — so the user keeps explicit control over editor state.
 *   - Content is hard-capped at `MAX_URBAN_CODE_ARTIFACT_BYTES` (32 KB),
 *     matching the editor bridge's existing size guard.
 *   - Each dispatched request is registered as an Urban evidence artifact
 *     of kind `code-artifact` and (when associated with a workflow run)
 *     appended to the sidecar run manifest's `codeArtifactIds` list.
 *
 * Public API:
 *   - `buildPythonScriptRequest`
 *   - `buildJsonManifestRequest`
 *   - `buildMarkdownMethodNoteRequest`
 *   - `buildTypeScriptAdapterRequest`
 *   - `dispatchUrbanCodeArtifactRequest`
 *   - `assessUrbanCodeArtifactRequestSize`
 */

import { openNewTab as ideOpenNewTab } from '@/services/editorBridge';
import type { SupportedLang } from '@/services/editorBridge';
import { useFlowStore } from '@/stores/useFlowStore';

import {
  MAX_URBAN_CODE_ARTIFACT_BYTES,
  type AnalyticalFlowId,
  type UrbanCodeArtifactLanguage,
  type UrbanCodeArtifactOrigin,
  type UrbanCodeArtifactOutputContract,
  type UrbanCodeArtifactProvenance,
  type UrbanCodeArtifactRequest,
  type UrbanEvidenceScalar,
  type UrbanIndicatorKind,
  type UrbanWorkflowRunManifest,
} from '../lib/types';
import { useUrbanContextStore } from '../useUrbanContextStore';

// ---------------------------------------------------------------------------
// Public seed contract
// ---------------------------------------------------------------------------

/**
 * Inputs that callers supply to every artifact builder.
 *
 * Field semantics:
 *   - `methodId`/`methodName` identify the producing method or indicator;
 *     either is enough but providing both yields the strongest provenance.
 *   - `studyArea*` are scalar references — never bulk geometry. The Python
 *     header surfaces the bounds; the JSON manifest stores them.
 *   - `inputDescriptors` is a free-form list of input data references the
 *     script will need (paths, layer IDs, dataset IDs).
 *   - `parameters` is a flat scalar map; complex objects are stringified.
 *   - `assumptions`/`limitations`/`citations` are surfaced in every artifact
 *     header so the generated code is defensible on its own.
 *   - `pythonBody` (optional) lets callers bring a known-good script body
 *     (e.g. one of the existing `SCRIPT_TEMPLATES` constants). When omitted
 *     the Python builder produces a parameter-block scaffold the user can
 *     safely extend.
 *   - `adapterIntents` (optional) seeds the TypeScript adapter snippet with
 *     intent strings such as `'transform-result-to-map-output'`.
 */
export interface UrbanCodeArtifactSeed {
  methodId?: string;
  methodName?: string;
  methodSlug?: string;
  flowId?: AnalyticalFlowId;
  indicatorKind?: UrbanIndicatorKind;
  runId?: string;
  runManifest?: UrbanWorkflowRunManifest | null;
  contextId?: string | null;
  studyAreaId?: string | null;
  studyAreaName?: string | null;
  studyAreaBounds?: [number, number, number, number] | null;
  inputDescriptors?: string[];
  parameters?: Record<string, unknown>;
  assumptions?: string[];
  limitations?: string[];
  citations?: string[];
  pythonBody?: string;
  adapterIntents?: ReadonlyArray<UrbanAdapterIntent>;
  outputContract?: UrbanCodeArtifactOutputContract;
  origin?: UrbanCodeArtifactOrigin;
  /** Optional override for the time component of the generated filename. */
  timestamp?: Date;
}

export type UrbanAdapterIntent =
  | 'transform-result-to-map-output'
  | 'transform-result-to-dashboard-binding'
  | 'transform-result-to-report-insert'
  | 'register-evidence-artifact';

const ADAPTER_INTENT_DESCRIPTIONS: Record<UrbanAdapterIntent, string> = {
  'transform-result-to-map-output':
    'Transform the analysis result into a Map Explorer overlay layer config (provenance, QA, CRS preserved).',
  'transform-result-to-dashboard-binding':
    'Transform the analysis result into a dashboard binding descriptor with uncertainty and scale labels.',
  'transform-result-to-report-insert':
    'Transform the analysis result into a structured report insert (method, data, results, limitations).',
  'register-evidence-artifact':
    'Register the resulting outputs as Urban evidence artifacts via the typed registry.',
};

// ---------------------------------------------------------------------------
// Dispatch result + helpers
// ---------------------------------------------------------------------------

export interface DispatchUrbanCodeArtifactResult {
  artifactId: string;
  evidenceArtifactId: string;
  tabId: string | null;
  bytes: number;
  bridgeRouted: boolean;
}

export interface UrbanCodeArtifactSizeAssessment {
  bytes: number;
  withinBudget: boolean;
  budget: number;
}

function utf8ByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  // Conservative fallback — matches the legacy editor bridge.
  return value.length * 2;
}

export function assessUrbanCodeArtifactRequestSize(
  request: Pick<UrbanCodeArtifactRequest, 'content'>,
): UrbanCodeArtifactSizeAssessment {
  const bytes = utf8ByteLength(request.content);
  return {
    bytes,
    withinBudget: bytes <= MAX_URBAN_CODE_ARTIFACT_BYTES,
    budget: MAX_URBAN_CODE_ARTIFACT_BYTES,
  };
}

// ---------------------------------------------------------------------------
// Filename + slug helpers
// ---------------------------------------------------------------------------

const EXTENSION_BY_LANGUAGE: Record<UrbanCodeArtifactLanguage, string> = {
  python: 'py',
  json: 'json',
  markdown: 'md',
  typescript: 'ts',
};

const BRIDGE_LANGUAGE: Record<UrbanCodeArtifactLanguage, SupportedLang> = {
  python: 'python',
  json: 'json',
  markdown: 'markdown',
  typescript: 'typescript',
};

function safeSlug(value: string, fallback: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return slug || fallback;
}

function resolveMethodSlug(seed: UrbanCodeArtifactSeed): string {
  if (seed.methodSlug && seed.methodSlug.trim()) {
    return safeSlug(seed.methodSlug, 'analysis');
  }
  if (seed.methodId && seed.methodId.trim()) {
    return safeSlug(seed.methodId, 'analysis');
  }
  if (seed.methodName && seed.methodName.trim()) {
    return safeSlug(seed.methodName, 'analysis');
  }
  if (seed.flowId) {
    return safeSlug(seed.flowId, 'analysis');
  }
  return 'analysis';
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function timestampStamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  const hour = pad2(date.getUTCHours());
  const minute = pad2(date.getUTCMinutes());
  return `${year}${month}${day}_${hour}${minute}`;
}

function makeFilename(
  seed: UrbanCodeArtifactSeed,
  language: UrbanCodeArtifactLanguage,
  options: { variant?: 'manifest' | 'method_note' | 'adapter' } = {},
): string {
  const slug = resolveMethodSlug(seed);
  const stamp = timestampStamp(seed.timestamp ?? new Date());
  const ext = EXTENSION_BY_LANGUAGE[language];
  switch (options.variant) {
    case 'manifest':
      return `urban_${slug}_${stamp}.manifest.${ext}`;
    case 'method_note':
      return `urban_${slug}_method_note.${ext}`;
    case 'adapter':
      return `urban_${slug}_adapter.${ext}`;
    default:
      return `urban_${slug}_${stamp}.${ext}`;
  }
}

function makeArtifactId(
  language: UrbanCodeArtifactLanguage,
  seed: UrbanCodeArtifactSeed,
): string {
  const stamp = timestampStamp(seed.timestamp ?? new Date());
  const slug = resolveMethodSlug(seed);
  return `urban-code-${language}-${slug}-${stamp}`;
}

// ---------------------------------------------------------------------------
// Provenance helpers
// ---------------------------------------------------------------------------

function buildProvenance(
  seed: UrbanCodeArtifactSeed,
  origin: UrbanCodeArtifactOrigin,
): UrbanCodeArtifactProvenance {
  const generatedAt = (seed.timestamp ?? new Date()).toISOString();
  const summaryParts: string[] = [];
  if (seed.methodName) summaryParts.push(seed.methodName);
  else if (seed.methodId) summaryParts.push(seed.methodId);
  if (seed.flowId) summaryParts.push(`flow ${seed.flowId}`);
  if (seed.runId) summaryParts.push(`run ${seed.runId.slice(0, 12)}`);
  if (seed.studyAreaName) summaryParts.push(`area ${seed.studyAreaName}`);
  const sourceSummary = summaryParts.join(' · ') || 'Urban Analytics code artifact';

  const provenance: UrbanCodeArtifactProvenance = {
    sourceModule: 'urban-analytics',
    generatedAt,
    sourceSummary,
    sourceEvidenceIds: [],
    layerIds: [],
  };
  if (seed.contextId) provenance.contextId = seed.contextId;
  if (seed.studyAreaId) provenance.studyAreaId = seed.studyAreaId;
  if (seed.studyAreaName) provenance.studyAreaName = seed.studyAreaName;
  if (seed.methodId) provenance.methodId = seed.methodId;
  if (seed.methodName) provenance.methodName = seed.methodName;
  if (seed.flowId) provenance.flowId = seed.flowId;
  if (seed.indicatorKind) provenance.indicatorKind = seed.indicatorKind;
  if (seed.runId) provenance.runId = seed.runId;
  if (seed.runManifest?.runId) provenance.runManifestId = seed.runManifest.runId;
  void origin;
  return provenance;
}

function defaultOrigin(seed: UrbanCodeArtifactSeed): UrbanCodeArtifactOrigin {
  if (seed.origin) return seed.origin;
  if (seed.runId) return 'workflow-run';
  if (seed.methodId || seed.methodName) return 'method-card';
  return 'manual';
}

// ---------------------------------------------------------------------------
// Header / body helpers (shared by Python and Markdown)
// ---------------------------------------------------------------------------

function formatStudyAreaForHeader(
  bounds: [number, number, number, number] | null | undefined,
  name: string | null | undefined,
): string {
  const namePart = name?.trim() || 'No study area defined';
  if (!bounds) return namePart;
  const [west, south, east, north] = bounds;
  return `${namePart} (bounds: ${west.toFixed(4)}, ${south.toFixed(4)}, ${east.toFixed(4)}, ${north.toFixed(4)})`;
}

function bulletList(items: ReadonlyArray<string> | undefined, prefix: string): string[] {
  if (!items || items.length === 0) return [`${prefix}- (none recorded)`];
  return items.map((item) => `${prefix}- ${item.trim()}`);
}

function safeRecord(value: Record<string, unknown> | undefined): Record<string, UrbanEvidenceScalar> {
  const result: Record<string, UrbanEvidenceScalar> = {};
  if (!value) return result;
  for (const [key, raw] of Object.entries(value)) {
    if (raw == null) {
      result[key] = null;
    } else if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      result[key] = raw;
    } else {
      try {
        result[key] = JSON.stringify(raw);
      } catch {
        result[key] = String(raw);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Python script generator (Section 26.1)
// ---------------------------------------------------------------------------

const DEFAULT_PYTHON_SHEBANG = '#!/usr/bin/env python3';
const LEADING_SHEBANG = /^(#!\s*\S+[^\r\n]*)/;

function buildPythonHeader(seed: UrbanCodeArtifactSeed, manifestFilename: string): string {
  const lines: string[] = [
    '"""',
    'Synapse Urban Analytics Artifact',
    `Method: ${seed.methodName ?? seed.methodId ?? 'Unspecified method'}`,
    `Flow: ${seed.flowId ?? '(unspecified)'}`,
    `Card: ${seed.methodId ?? '(unspecified)'}`,
    `Study area: ${formatStudyAreaForHeader(seed.studyAreaBounds, seed.studyAreaName)}`,
    `Inputs: ${(seed.inputDescriptors ?? []).join(', ') || '(none recorded)'}`,
    `Created: ${(seed.timestamp ?? new Date()).toISOString()}`,
    `Manifest: ${manifestFilename}`,
    '',
    'Scientific assumptions:',
    ...bulletList(seed.assumptions, ''),
    '',
    'Limitations:',
    ...bulletList(seed.limitations, ''),
    '',
    'References:',
    ...bulletList(seed.citations, ''),
    '"""',
    '',
  ];
  return lines.join('\n');
}

function buildPythonParameterBlock(seed: UrbanCodeArtifactSeed): string {
  const params = seed.parameters ?? {};
  if (Object.keys(params).length === 0) {
    return [
      '# Parameters — adjust before running',
      'PARAMS = {}',
      '',
    ].join('\n');
  }
  const entries = Object.entries(params).map(([key, value]) => {
    let serialized: string;
    if (value == null) {
      serialized = 'None';
    } else if (typeof value === 'boolean') {
      serialized = value ? 'True' : 'False';
    } else if (typeof value === 'number') {
      serialized = Number.isFinite(value) ? String(value) : 'None';
    } else {
      serialized = JSON.stringify(value);
    }
    return `    ${JSON.stringify(key)}: ${serialized},`;
  });
  return [
    '# Parameters — adjust before running',
    'PARAMS = {',
    ...entries,
    '}',
    '',
  ].join('\n');
}

function buildPythonScaffoldBody(seed: UrbanCodeArtifactSeed): string {
  return [
    '# ── Imports ────────────────────────────────────────────────────────',
    'import json',
    'import os',
    '',
    buildPythonParameterBlock(seed),
    '',
    '# ── Step 1: Load inputs (replace with the loader appropriate to your data) ──',
    'def load_inputs(params):',
    '    """Return a dict of loaded inputs keyed by input descriptor."""',
    '    raise NotImplementedError("Implement input loading for: "',
    `        + ${JSON.stringify((seed.inputDescriptors ?? []).join(', ') || 'unspecified inputs')})`,
    '',
    '# ── Step 2: Validate CRS / geometry before any measurement ─────────',
    'def validate_inputs(inputs):',
    '    """Assert appropriate projected CRS and geometry validity."""',
    '    return inputs',
    '',
    '# ── Step 3: Run analysis ───────────────────────────────────────────',
    'def run_analysis(inputs, params):',
    '    """Compute the analysis. Return a dict with metrics + outputs."""',
    '    raise NotImplementedError("Implement analysis body.")',
    '',
    '# ── Step 4: Serialize outputs + map/report handoff hints ──────────',
    'def write_outputs(result, params):',
    '    out_dir = params.get("output_dir", "./output")',
    '    os.makedirs(out_dir, exist_ok=True)',
    '    with open(os.path.join(out_dir, "result.json"), "w", encoding="utf-8") as fh:',
    '        json.dump(result, fh, indent=2, default=str)',
    '    return result',
    '',
    'if __name__ == "__main__":',
    '    inputs = validate_inputs(load_inputs(PARAMS))',
    '    result = run_analysis(inputs, PARAMS)',
    '    write_outputs(result, PARAMS)',
    '',
  ].join('\n');
}

function composePythonScriptContent(
  header: string,
  body: string,
): string {
  const trimmedBody = body.trim();
  const shebangMatch = trimmedBody.match(LEADING_SHEBANG);
  if (!shebangMatch) {
    const normalizedBody = trimmedBody.length > 0 ? `${trimmedBody}\n` : '';
    return `${DEFAULT_PYTHON_SHEBANG}\n${header}${normalizedBody}`;
  }

  const shebang = shebangMatch[1];
  const bodyWithoutShebang = trimmedBody
    .slice(shebang.length)
    .replace(/^\r?\n/, '')
    .trimEnd();
  const normalizedBody = bodyWithoutShebang.length > 0 ? `${bodyWithoutShebang}\n` : '';
  return `${shebang}\n${header}${normalizedBody}`;
}

export function buildPythonScriptRequest(
  seed: UrbanCodeArtifactSeed,
): UrbanCodeArtifactRequest {
  const language: UrbanCodeArtifactLanguage = 'python';
  const targetFilename = makeFilename(seed, language);
  const manifestFilename = makeFilename(seed, 'json', { variant: 'manifest' });
  const header = buildPythonHeader(seed, manifestFilename);
  const body = seed.pythonBody && seed.pythonBody.trim().length > 0
    ? seed.pythonBody
    : buildPythonScaffoldBody(seed);
  const content = composePythonScriptContent(header, body);
  const safetyNotes = collectSafetyNotes(seed, language);
  return {
    artifactId: makeArtifactId(language, seed),
    language,
    kind: 'analysis-script',
    origin: defaultOrigin(seed),
    targetFilename,
    content,
    title: titleFor(seed, 'Python analysis script'),
    summary: summaryFor(seed, 'Reproducible Python analysis script with provenance + assumptions header.'),
    provenance: buildProvenance(seed, defaultOrigin(seed)),
    outputContract: seed.outputContract ?? { summary: 'Generated reproducible Python analysis script.' },
    safetyNotes,
    ...(seed.contextId ? { contextId: seed.contextId } : {}),
    ...(seed.runId ? { runId: seed.runId } : {}),
    ...(seed.methodId ? { methodId: seed.methodId } : {}),
  };
}

// ---------------------------------------------------------------------------
// JSON manifest generator (Section 26.2)
// ---------------------------------------------------------------------------

export function buildJsonManifestRequest(
  seed: UrbanCodeArtifactSeed,
): UrbanCodeArtifactRequest {
  const language: UrbanCodeArtifactLanguage = 'json';
  const targetFilename = makeFilename(seed, language, { variant: 'manifest' });
  const generatedAt = (seed.timestamp ?? new Date()).toISOString();
  const manifestSnapshot = seed.runManifest
    ? {
        runId: seed.runManifest.runId,
        flowId: seed.runManifest.flowId,
        contextId: seed.runManifest.contextId,
        runtimeMode: seed.runManifest.runtimeMode,
        readiness: seed.runManifest.readiness?.status ?? 'unknown',
        mapArtifactIds: seed.runManifest.mapArtifactIds,
        codeArtifactIds: seed.runManifest.codeArtifactIds,
        reportInsertIds: seed.runManifest.reportInsertIds,
        dashboardBindingIds: seed.runManifest.dashboardBindingIds,
        indicatorResultIds: seed.runManifest.indicatorResultIds,
      }
    : null;
  const payload = {
    schemaVersion: 1,
    artifactKind: 'reproducibility-manifest' as const,
    generatedAt,
    contextId: seed.contextId ?? null,
    studyArea: {
      id: seed.studyAreaId ?? null,
      name: seed.studyAreaName ?? null,
      bounds: seed.studyAreaBounds ?? null,
    },
    method: {
      id: seed.methodId ?? null,
      name: seed.methodName ?? null,
      flowId: seed.flowId ?? null,
      indicatorKind: seed.indicatorKind ?? null,
    },
    run: {
      id: seed.runId ?? null,
      manifest: manifestSnapshot,
    },
    inputs: seed.inputDescriptors ?? [],
    parameters: seed.parameters ?? {},
    qaGate: {
      assumptions: seed.assumptions ?? [],
      limitations: seed.limitations ?? [],
    },
    outputContract: seed.outputContract ?? {
      summary: 'Reproducibility manifest for an Urban Analytics code artifact request.',
    },
    citations: seed.citations ?? [],
  };
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  return {
    artifactId: makeArtifactId(language, seed),
    language,
    kind: 'reproducibility-manifest',
    origin: defaultOrigin(seed),
    targetFilename,
    content,
    title: titleFor(seed, 'Reproducibility manifest'),
    summary: summaryFor(seed, 'JSON manifest capturing context, method, run, parameters, and QA gates.'),
    provenance: buildProvenance(seed, defaultOrigin(seed)),
    outputContract: seed.outputContract ?? {
      summary: 'JSON manifest describing the reproducible run context.',
      outputPaths: [targetFilename],
    },
    safetyNotes: collectSafetyNotes(seed, language),
    ...(seed.contextId ? { contextId: seed.contextId } : {}),
    ...(seed.runId ? { runId: seed.runId } : {}),
    ...(seed.methodId ? { methodId: seed.methodId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Markdown method note generator (Section 26.3)
// ---------------------------------------------------------------------------

export function buildMarkdownMethodNoteRequest(
  seed: UrbanCodeArtifactSeed,
): UrbanCodeArtifactRequest {
  const language: UrbanCodeArtifactLanguage = 'markdown';
  const targetFilename = makeFilename(seed, language, { variant: 'method_note' });
  const generatedAt = (seed.timestamp ?? new Date()).toISOString();
  const lines: string[] = [
    `# ${seed.methodName ?? seed.methodId ?? 'Urban Analytics Method Note'}`,
    '',
    '_Generated by Synapse Urban Analytics — review before publication._',
    '',
    `- Generated: ${generatedAt}`,
    `- Context: ${seed.contextId ?? '(no context)'}`,
    `- Flow: ${seed.flowId ?? '(unspecified)'}`,
    `- Run: ${seed.runId ?? '(no associated run)'}`,
    `- Study area: ${formatStudyAreaForHeader(seed.studyAreaBounds, seed.studyAreaName)}`,
    '',
    '## Research question',
    '',
    seed.outputContract?.summary?.trim() || '_(Document the research question this artifact addresses.)_',
    '',
    '## Method',
    '',
    seed.methodName ? `**${seed.methodName}**` : '_(Name the method.)_',
    seed.methodId ? `\nMethod ID: \`${seed.methodId}\`` : '',
    '',
    '## Data inputs',
    '',
    ...bulletList(seed.inputDescriptors, ''),
    '',
    '## Parameters',
    '',
    Object.keys(seed.parameters ?? {}).length === 0
      ? '_(no parameters recorded)_'
      : '```json\n' + JSON.stringify(seed.parameters ?? {}, null, 2) + '\n```',
    '',
    '## Assumptions',
    '',
    ...bulletList(seed.assumptions, ''),
    '',
    '## Results placeholder',
    '',
    '_(Insert key result statements after the run completes.)_',
    '',
    '## Limitations',
    '',
    ...bulletList(seed.limitations, ''),
    '',
    '## Reproducibility',
    '',
    `- Manifest file: \`${makeFilename(seed, 'json', { variant: 'manifest' })}\``,
    `- Script file:   \`${makeFilename(seed, 'python')}\``,
    seed.runId ? `- Run ID: \`${seed.runId}\`` : '- Run ID: _(no run associated)_',
    '',
    '## References',
    '',
    ...bulletList(seed.citations, ''),
    '',
  ];
  const content = lines.filter((line) => line !== undefined).join('\n');
  return {
    artifactId: makeArtifactId(language, seed),
    language,
    kind: 'method-note',
    origin: defaultOrigin(seed),
    targetFilename,
    content,
    title: titleFor(seed, 'Method note (Markdown)'),
    summary: summaryFor(seed, 'Markdown method note with question, data, assumptions, limitations, reproducibility hooks.'),
    provenance: buildProvenance(seed, defaultOrigin(seed)),
    outputContract: seed.outputContract ?? {
      summary: 'Markdown method note suitable for inclusion in reports or method libraries.',
      outputPaths: [targetFilename],
    },
    safetyNotes: collectSafetyNotes(seed, language),
    ...(seed.contextId ? { contextId: seed.contextId } : {}),
    ...(seed.runId ? { runId: seed.runId } : {}),
    ...(seed.methodId ? { methodId: seed.methodId } : {}),
  };
}

// ---------------------------------------------------------------------------
// TypeScript adapter snippet generator (Section 26.4)
// ---------------------------------------------------------------------------

export function buildTypeScriptAdapterRequest(
  seed: UrbanCodeArtifactSeed,
): UrbanCodeArtifactRequest {
  const language: UrbanCodeArtifactLanguage = 'typescript';
  const targetFilename = makeFilename(seed, language, { variant: 'adapter' });
  const intents = seed.adapterIntents && seed.adapterIntents.length > 0
    ? seed.adapterIntents
    : (['transform-result-to-map-output', 'register-evidence-artifact'] as const);
  const generatedAt = (seed.timestamp ?? new Date()).toISOString();
  const headerLines: string[] = [
    '/**',
    ' * Synapse Urban Analytics Artifact — TypeScript Adapter Snippet',
    ` * Method: ${seed.methodName ?? seed.methodId ?? 'Unspecified method'}`,
    ` * Flow:   ${seed.flowId ?? '(unspecified)'}`,
    ` * Run:    ${seed.runId ?? '(no associated run)'}`,
    ` * Study area: ${formatStudyAreaForHeader(seed.studyAreaBounds, seed.studyAreaName)}`,
    ` * Generated: ${generatedAt}`,
    ' *',
    ' * Limitations:',
    ...(seed.limitations?.length
      ? seed.limitations.map((value) => ` *   - ${value.trim()}`)
      : [' *   - (none recorded)']),
    ' */',
    '',
    '/* eslint-disable @typescript-eslint/no-unused-vars */',
    '',
    `import type { UrbanEvidenceArtifact } from "@/features/urbanAnalytics/lib/types";`,
    '',
    'export interface UrbanAdapterInput {',
    '  /** Raw analysis result returned by the workflow runtime. */',
    '  result: unknown;',
    `  /** Source run identifier (or null when called outside a workflow run). */`,
    '  runId: string | null;',
    `  /** Active Urban Analysis Context id (or null). */`,
    '  contextId: string | null;',
    '}',
    '',
    'export interface UrbanAdapterOutput {',
    '  /** Map Explorer overlay layer id, when this adapter publishes to the map. */',
    '  mapLayerId?: string;',
    '  /** Evidence artifact registered as a side effect of the adapter. */',
    '  evidenceArtifact?: UrbanEvidenceArtifact;',
    '}',
    '',
  ];

  const intentBlocks = intents.map((intent) => {
    const description = ADAPTER_INTENT_DESCRIPTIONS[intent];
    const fnName = intent.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return [
      `// ${description}`,
      `export function ${fnName}(input: UrbanAdapterInput): UrbanAdapterOutput {`,
      '  // TODO: implement the adapter for the analysis result shape.',
      '  void input;',
      '  return {};',
      '}',
      '',
    ].join('\n');
  });

  const content = [...headerLines, ...intentBlocks].join('\n');
  return {
    artifactId: makeArtifactId(language, seed),
    language,
    kind: 'adapter-snippet',
    origin: defaultOrigin(seed),
    targetFilename,
    content,
    title: titleFor(seed, 'TypeScript adapter snippet'),
    summary: summaryFor(seed, 'TypeScript adapter scaffolding for map / dashboard / report / evidence transforms.'),
    provenance: buildProvenance(seed, defaultOrigin(seed)),
    outputContract: seed.outputContract ?? {
      summary: 'TypeScript adapter snippet for app-internal customization.',
      outputPaths: [targetFilename],
    },
    safetyNotes: collectSafetyNotes(seed, language),
    ...(seed.contextId ? { contextId: seed.contextId } : {}),
    ...(seed.runId ? { runId: seed.runId } : {}),
    ...(seed.methodId ? { methodId: seed.methodId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Common helpers
// ---------------------------------------------------------------------------

function titleFor(seed: UrbanCodeArtifactSeed, fallback: string): string {
  if (seed.methodName) return `${seed.methodName} — ${fallback}`;
  if (seed.methodId) return `${seed.methodId} — ${fallback}`;
  if (seed.flowId) return `${seed.flowId} — ${fallback}`;
  return fallback;
}

function summaryFor(seed: UrbanCodeArtifactSeed, fallback: string): string {
  const studyArea = seed.studyAreaName ? ` for study area "${seed.studyAreaName}"` : '';
  const run = seed.runId ? ` (run ${seed.runId.slice(0, 12)})` : '';
  return `${fallback}${studyArea}${run}`.slice(0, 600);
}

function collectSafetyNotes(
  seed: UrbanCodeArtifactSeed,
  language: UrbanCodeArtifactLanguage,
): string[] {
  const notes: string[] = [];
  if (language === 'python') {
    notes.push('Run inside an isolated Python environment with the listed dependencies.');
    notes.push('Verify CRS and geometry validity before measurement.');
  }
  if (language === 'typescript') {
    notes.push('Adapter snippets are scaffolds — implement the transform before invoking.');
  }
  if (seed.runManifest?.runtimeMode === 'demo') {
    notes.push('Run manifest is labelled demo — outputs must not be cited as real evidence.');
  }
  if (seed.runManifest?.runtimeMode === 'synthetic') {
    notes.push('Run manifest is labelled synthetic — derived artifacts inherit synthetic provenance.');
  }
  if (seed.runManifest?.runtimeMode === 'unknown') {
    notes.push('Run manifest mode is unknown — treat outputs as unvalidated.');
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Bridge dispatch
// ---------------------------------------------------------------------------

export interface DispatchUrbanCodeArtifactOptions {
  /**
   * When `false`, the bridge call is skipped (preview-only mode). The
   * evidence artifact is still registered so the user has a durable
   * reference to the request. Defaults to `true`.
   */
  routeThroughBridge?: boolean;
}

/**
 * Dispatch an Urban code artifact request through the IDE bridge and register
 * a corresponding evidence artifact in the Urban context.
 *
 * Bridge contract enforced here:
 *   - Always opens a NEW tab — never silent insert into the active tab.
 *   - Hard rejects any payload exceeding `MAX_URBAN_CODE_ARTIFACT_BYTES`.
 *   - When the bridge is unavailable (e.g. SSR/test env), records the
 *     evidence artifact and reports `bridgeRouted: false`.
 *
 * Sidecar contract:
 *   - When `request.runId` is set and the run has a sidecar manifest in
 *     `useFlowStore`, the artifact ID is appended (de-duplicated) to the
 *     manifest's `codeArtifactIds` array via `registerManifest`.
 */
export async function dispatchUrbanCodeArtifactRequest(
  request: UrbanCodeArtifactRequest,
  options: DispatchUrbanCodeArtifactOptions = {},
): Promise<DispatchUrbanCodeArtifactResult> {
  const sizing = assessUrbanCodeArtifactRequestSize(request);
  if (!sizing.withinBudget) {
    throw new Error(
      `Urban code artifact request exceeds ${MAX_URBAN_CODE_ARTIFACT_BYTES} bytes (got ${sizing.bytes}); reduce content or split into multiple requests.`,
    );
  }

  let tabId: string | null = null;
  let bridgeRouted = false;
  const route = options.routeThroughBridge ?? true;
  if (route) {
    try {
      const result = await ideOpenNewTab({
        filename: request.targetFilename,
        code: request.content,
        language: BRIDGE_LANGUAGE[request.language],
      });
      tabId = result.tabId;
      bridgeRouted = true;
    } catch (error) {
      // Bridge failures are non-fatal: still register evidence and surface
      // the failure to the caller via `bridgeRouted: false`.
      bridgeRouted = false;
      if (typeof console !== 'undefined') {
        console.warn('[urbanCodeArtifactRequests] bridge dispatch failed', error);
      }
    }
  }

  const evidenceArtifactId = registerCodeArtifactEvidence(request, { tabId });
  appendCodeArtifactIdToManifest(request);

  return {
    artifactId: request.artifactId,
    evidenceArtifactId,
    tabId,
    bytes: sizing.bytes,
    bridgeRouted,
  };
}

function registerCodeArtifactEvidence(
  request: UrbanCodeArtifactRequest,
  context: { tabId: string | null },
): string {
  const urbanStore = useUrbanContextStore.getState();
  const contextId = urbanStore.context?.contextId ?? request.contextId;
  const evidenceId = `urban-code-artifact-${request.artifactId}`;
  const provenanceLayerIds = request.provenance.layerIds.length > 0
    ? request.provenance.layerIds
    : [];
  const sourceEvidenceIds = request.provenance.sourceEvidenceIds;
  const safetyNote = request.safetyNotes.join(' | ');

  const metadata: Record<string, UrbanEvidenceScalar> = {
    language: request.language,
    artifactKind: request.kind,
    origin: request.origin,
    targetFilename: request.targetFilename,
    bytes: utf8ByteLength(request.content),
    methodId: request.methodId ?? null,
    runId: request.runId ?? null,
    flowId: request.provenance.flowId ?? null,
    studyAreaId: request.provenance.studyAreaId ?? null,
    studyAreaName: request.provenance.studyAreaName ?? null,
    bridgeTabId: context.tabId,
    sourceSummary: request.provenance.sourceSummary,
  };

  // Capture runtime mode if we have a run manifest reference.
  const params = safeRecord({
    inputCount: request.provenance.layerIds.length,
    sourceEvidenceCount: request.provenance.sourceEvidenceIds.length,
    safetyNoteCount: request.safetyNotes.length,
  });
  for (const [key, value] of Object.entries(params)) {
    metadata[`stat.${key}`] = value;
  }

  urbanStore.registerEvidenceArtifact({
    id: evidenceId,
    kind: 'code-artifact',
    title: request.title,
    summary: request.summary,
    state: 'active',
    sourceModule: 'urban-analytics',
    sourceId: request.artifactId,
    linkedContextId: contextId ?? undefined,
    linkedRunId: request.runId,
    linkedLayerIds: provenanceLayerIds,
    linkedFilePaths: [request.targetFilename],
    linkedArtifactIds: sourceEvidenceIds,
    codeArtifactId: request.artifactId,
    flowId: request.provenance.flowId,
    indicatorKind: request.provenance.indicatorKind,
    qa: {
      state: 'unvalidated',
      warnings: [],
      limitations: [
        'Generated code is a scaffold. Review parameters, CRS, and assumptions before execution.',
        ...(safetyNote ? [safetyNote] : []),
      ],
    },
    provenance: {
      sourceModule: 'urban-analytics',
      sourceId: request.artifactId,
      sourceTitle: request.title,
      contextId: contextId ?? undefined,
      runId: request.runId,
      flowId: request.provenance.flowId,
      methodId: request.provenance.methodId,
      methodName: request.provenance.methodName,
      layerIds: provenanceLayerIds,
      filePaths: [request.targetFilename],
      inputArtifactIds: sourceEvidenceIds,
      parentArtifactIds: [],
      notes: `Code artifact request generated by Urban Analytics (${request.language}/${request.kind}).`,
    },
    metadata,
  });

  return evidenceId;
}

function appendCodeArtifactIdToManifest(request: UrbanCodeArtifactRequest): void {
  if (!request.runId) return;
  const flowStore = useFlowStore.getState();
  const manifest = flowStore.lookupManifest(request.runId);
  if (!manifest) return;
  if (manifest.codeArtifactIds.includes(request.artifactId)) return;
  flowStore.registerManifest({
    ...manifest,
    codeArtifactIds: [...manifest.codeArtifactIds, request.artifactId],
  });
}
