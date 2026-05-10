import { enqueuePendingInsert } from '@/services/reporting/storage';
import type { PendingReportInsert, ReportSection } from '@/services/reporting/types';
import { useFlowStore } from '@/stores/useFlowStore';
import { useUrbanContextStore } from '../useUrbanContextStore';
import {
  buildUrbanScenarioComparisonHandoff,
  buildUrbanScenarioLimitationNotes,
  extractUrbanScenarioComparison,
} from './scenarioComparisonMetadata';
import type {
  Card,
  CompletedAnalysisRun,
  UrbanEvidenceArtifact,
  UrbanEvidenceQAState,
  UrbanScenarioComparison,
  UrbanEvidenceScalar,
  UrbanReportEvidenceBlock,
  UrbanReportMapFigureReference,
  UrbanWorkflowRunManifest,
} from '../lib/types';

const MAX_TEXT = 420;
const MAX_LIST_ITEMS = 16;

export interface BuildUrbanReportEvidenceBlockInput {
  artifact: UrbanEvidenceArtifact;
  run?: CompletedAnalysisRun | null;
  manifest?: UrbanWorkflowRunManifest | null;
  methodCard?: Card | null;
  methodSummary?: string;
  citationNotes?: string[];
  insertedAt?: string;
}

export interface EnqueueUrbanReportEvidenceBlockResult {
  block: UrbanReportEvidenceBlock;
  pendingInsert: PendingReportInsert;
  evidenceArtifactId: string;
}

export interface EnqueueUrbanMethodCardReportBlockInput {
  card: Card;
  methodSummary?: string;
  citationNotes?: string[];
  insertedAt?: string;
}

function now(): string {
  return new Date().toISOString();
}

function clip(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== 'string') return '';
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > max ? text.slice(0, max) : text;
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = clip(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
    if (output.length >= MAX_LIST_ITEMS) break;
  }
  return output;
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function reportInsertIdFor(artifactId: string, generatedAt: string): string {
  return `urban-report-${stableHash(`${artifactId}:${generatedAt}`)}`;
}

function scalarMetadata(value: unknown): UrbanEvidenceScalar {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }
  return null;
}

function runtimeLimitations(manifest: UrbanWorkflowRunManifest | null | undefined): string[] {
  if (!manifest || manifest.runtimeMode === 'live') return [];
  if (manifest.runtimeMode === 'demo') {
    return ['Run manifest runtimeMode is demo; report language must label outputs as demonstration evidence.'];
  }
  if (manifest.runtimeMode === 'synthetic') {
    return ['Run manifest runtimeMode is synthetic; outputs are not real-world analytical evidence.'];
  }
  return ['Run manifest runtimeMode is unknown; do not present outputs as externally validated analytical findings.'];
}

function summarizeRecordKeys(label: string, record: Record<string, unknown> | undefined): string | null {
  const keys = Object.keys(record ?? {});
  if (keys.length === 0) return null;
  return `${label}: ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? `, +${keys.length - 8} more` : ''}.`;
}

function buildMethodSummary(input: BuildUrbanReportEvidenceBlockInput): string {
  const explicit = clip(input.methodSummary, 900);
  if (explicit) return explicit;
  if (input.methodCard) {
    return `${input.methodCard.title}: ${input.methodCard.summary}`;
  }
  if (input.run) {
    return input.run.paragraphFull || input.run.paragraphPreview || input.run.paragraph || `${input.run.label} completed.`;
  }
  if (input.artifact.provenance.methodName) {
    return `${input.artifact.provenance.methodName}. ${input.artifact.summary ?? 'Evidence is represented by reference metadata.'}`;
  }
  return input.artifact.summary
    ?? `Reference-only evidence artifact ${input.artifact.id}. Interpret with the recorded provenance and QA state.`;
}

function buildDataSummary(
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  methodCard: Card | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): string {
  const parts: string[] = [];
  if (run) {
    parts.push(`${run.mapOutputs.length} map output(s), ${run.chartOutputs.length} chart output(s), and ${run.dataOutputs.length} data table(s) are linked to run ${run.runId}.`);
  }
  if (scenarioComparison) {
    parts.push(
      `Scenario comparison ${scenarioComparison.comparisonId} references baseline ${scenarioComparison.baseline.label} with ${scenarioComparison.candidateRuns.length} candidate scenario(s) and ${scenarioComparison.indicatorsCompared.length} indicator(s).`,
    );
  }
  const layerIds = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
  if (layerIds.length > 0) parts.push(`Layer references: ${layerIds.join(', ')}.`);
  if (artifact.linkedFilePaths.length > 0) parts.push(`File references: ${artifact.linkedFilePaths.join(', ')}.`);
  const inputs = summarizeRecordKeys('Manifest input fields', manifest?.inputs);
  if (inputs) parts.push(inputs);
  const parameters = summarizeRecordKeys('Manifest parameter fields', manifest?.parameters);
  if (parameters) parts.push(parameters);
  const fitness = artifact.dataFitness ?? manifest?.dataFitness ?? null;
  if (fitness) {
    parts.push(`Data fitness: ${fitness.status}, grade ${fitness.grade}, score ${fitness.score ?? 'unknown'}.`);
  }
  if (methodCard?.datasets?.length) {
    parts.push(`Declared dataset requirements: ${methodCard.datasets.join(', ')}.`);
  }
  if (methodCard?.tools?.length) {
    parts.push(`Declared toolchain: ${methodCard.tools.join(', ')}.`);
  }
  if (parts.length === 0) {
    parts.push('No source datasets are embedded in this report block. Only reference IDs and provenance metadata are carried forward.');
  }
  return parts.join(' ');
}

function buildQaSummary(
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): string {
  const parts = [
    `Evidence QA state: ${artifact.qa.state}.`,
    `Evidence lifecycle state: ${artifact.state}.`,
  ];
  if (typeof artifact.qa.confidence === 'number') {
    parts.push(`Confidence: ${Math.round(artifact.qa.confidence * 100)}%.`);
  }
  if (artifact.qa.warnings.length > 0) {
    parts.push(`Warnings: ${artifact.qa.warnings.join(' ')}`);
  }
  if (artifact.qa.limitations.length > 0) {
    parts.push(`Limitations: ${artifact.qa.limitations.join(' ')}`);
  }
  if (manifest?.readiness) {
    parts.push(`Run readiness: ${manifest.readiness.status}; runtimeMode: ${manifest.runtimeMode}.`);
  } else if (manifest) {
    parts.push(`Runtime mode: ${manifest.runtimeMode}.`);
  }
  if (scenarioComparison) {
    parts.push('Scenario policy interpretation mode: guidance-only (decision support, not certainty).');
  }
  return parts.join(' ');
}

function buildAssumptions(
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  methodCard: Card | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): string[] {
  const validity = manifest?.methodValidity ?? methodCard?.validityEnvelope ?? null;
  const assumptions = unique([
    ...(validity?.assumptions ?? []),
    ...(validity?.crsAssumptions ?? []),
    ...(validity?.temporalAssumptions ?? []),
    ...(scenarioComparison?.policyInterpretation.assumptions ?? []),
    ...(artifact.provenance.notes ? [artifact.provenance.notes] : []),
  ]);
  return assumptions.length > 0
    ? assumptions
    : ['No explicit assumptions were supplied with this evidence artifact; treat assumptions as undocumented rather than absent.'];
}

function buildLimitations(
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  methodCard: Card | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): string[] {
  const validity = manifest?.methodValidity ?? methodCard?.validityEnvelope ?? null;
  const fitness = artifact.dataFitness ?? manifest?.dataFitness ?? null;
  const limitations = unique([
    ...artifact.qa.warnings.map((warning) => `Warning: ${warning}`),
    ...artifact.qa.limitations,
    ...(artifact.qa.staleReason ? [`Stale reason: ${artifact.qa.staleReason}`] : []),
    ...(artifact.qa.invalidReason ? [`Invalid reason: ${artifact.qa.invalidReason}`] : []),
    ...(validity?.limitations ?? []),
    ...(validity?.failureModes ?? []).map((entry) => `Failure mode: ${entry}`),
    ...(validity?.interpretationWarnings ?? []).map((entry) => `Interpretation warning: ${entry}`),
    ...(validity?.misuseWarnings ?? []).map((entry) => `Misuse warning: ${entry}`),
    ...(fitness?.blockedReasons ?? []).map((entry) => `Fitness blocker: ${entry}`),
    ...(fitness?.missingInputs ?? []).map((entry) => `Missing input: ${entry}`),
    ...(fitness?.uncertaintyNotes ?? []).map((entry) => `Uncertainty: ${entry}`),
    ...(scenarioComparison ? buildUrbanScenarioLimitationNotes(scenarioComparison) : []),
    ...(methodCard?.limitations ? [methodCard.limitations] : []),
    ...runtimeLimitations(manifest),
  ]);
  return limitations.length > 0
    ? limitations
    : ['No artifact-specific limitations are recorded; this does not imply external validation.'];
}

function buildCitationNotes(
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  methodCard: Card | null | undefined,
  explicit: readonly string[] | undefined,
): string[] {
  return unique([
    ...(explicit ?? []),
    ...(methodCard?.evidence ?? []),
    ...(manifest?.methodValidity?.peerReferenceIds ?? []).map((id) => `Peer reference ID: ${id}`),
    ...(artifact.provenance.sourceUri ? [`Source URI: ${artifact.provenance.sourceUri}`] : []),
    ...(artifact.linkedFilePaths.length ? artifact.linkedFilePaths.map((path) => `File reference: ${path}`) : []),
  ]);
}

function buildMapFigureReference(
  reportInsertId: string,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
): UrbanReportMapFigureReference | null {
  const layerIds = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
  const firstOutput = run?.mapOutputs[0] ?? null;
  const mapLayerId = artifact.mapLayerId ?? layerIds[0];
  if (!firstOutput && !mapLayerId && layerIds.length === 0) return null;
  const title = firstOutput?.title || artifact.title;
  const captionLayerText = layerIds.length > 0 ? `Layer refs: ${layerIds.join(', ')}.` : 'No map layer IDs are recorded.';
  const reference: UrbanReportMapFigureReference = {
    assetId: `${reportInsertId}-map-figure`,
    title: `${title} map reference`,
    caption: `Map figure reference for ${artifact.title}. ${captionLayerText} This block stores the figure reference, not raw geometry.`,
    layerIds,
  };
  if (mapLayerId) reference.mapLayerId = mapLayerId;
  if (run?.runId) reference.sourceRunId = run.runId;
  return reference;
}

export function buildUrbanReportEvidenceBlock(
  input: BuildUrbanReportEvidenceBlockInput,
): UrbanReportEvidenceBlock {
  const generatedAt = input.insertedAt ?? now();
  const artifact = input.artifact;
  const scenarioComparison = extractUrbanScenarioComparison(input.run ?? null);
  const reportInsertId = reportInsertIdFor(artifact.id, generatedAt);
  const runId = input.run?.runId ?? artifact.linkedRunId ?? artifact.provenance.runId ?? input.manifest?.runId ?? null;
  const methodCard = input.methodCard ?? null;
  const layerIds = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
  const filePaths = unique([...artifact.linkedFilePaths, ...artifact.provenance.filePaths]);

  return {
    reportInsertId,
    artifactId: artifact.id,
    runId,
    title: `${artifact.title} - Evidence Block`,
    methodSummary: buildMethodSummary(input),
    dataSummary: buildDataSummary(artifact, input.run, input.manifest, methodCard, scenarioComparison),
    qaSummary: buildQaSummary(artifact, input.manifest, scenarioComparison),
    assumptions: buildAssumptions(artifact, input.manifest, methodCard, scenarioComparison),
    limitations: buildLimitations(artifact, input.manifest, methodCard, scenarioComparison),
    mapFigureReference: buildMapFigureReference(reportInsertId, artifact, input.run),
    citationNotes: buildCitationNotes(artifact, input.manifest, methodCard, input.citationNotes),
    ...(scenarioComparison
      ? { scenarioComparison: buildUrbanScenarioComparisonHandoff(scenarioComparison) }
      : {}),
    provenance: {
      sourceModule: artifact.sourceModule,
      contextId: artifact.linkedContextId ?? artifact.provenance.contextId ?? null,
      studyAreaId: artifact.linkedStudyAreaId ?? null,
      flowId: artifact.flowId ?? artifact.provenance.flowId ?? input.manifest?.flowId ?? null,
      methodId: artifact.provenance.methodId ?? methodCard?.id ?? null,
      methodName: artifact.provenance.methodName ?? methodCard?.title ?? null,
      layerIds,
      filePaths,
      linkedArtifactIds: unique([...artifact.linkedArtifactIds, ...artifact.provenance.inputArtifactIds]),
      generatedAt,
    },
  };
}

function sectionFields(block: UrbanReportEvidenceBlock): { sourceRunId?: string } {
  return block.runId ? { sourceRunId: block.runId } : {};
}

function buildProvenanceRows(block: UrbanReportEvidenceBlock): Array<Record<string, string | number | boolean | null>> {
  const rows: Array<Record<string, string | number | boolean | null>> = [
    { Field: 'Evidence artifact ID', Value: block.artifactId },
    { Field: 'Report insert ID', Value: block.reportInsertId },
    { Field: 'Run ID', Value: block.runId },
    { Field: 'Source module', Value: block.provenance.sourceModule },
    { Field: 'Context ID', Value: block.provenance.contextId },
    { Field: 'Study area ID', Value: block.provenance.studyAreaId },
    { Field: 'Flow ID', Value: block.provenance.flowId },
    { Field: 'Method ID', Value: block.provenance.methodId },
    { Field: 'Method name', Value: block.provenance.methodName },
    { Field: 'Layer IDs', Value: block.provenance.layerIds.join(', ') || null },
    { Field: 'File paths', Value: block.provenance.filePaths.join(', ') || null },
    { Field: 'Linked artifact IDs', Value: block.provenance.linkedArtifactIds.join(', ') || null },
    { Field: 'Generated at', Value: block.provenance.generatedAt },
  ];

  if (block.scenarioComparison) {
    rows.push(
      { Field: 'Scenario comparison ID', Value: block.scenarioComparison.comparisonId },
      { Field: 'Scenario baseline', Value: block.scenarioComparison.baselineLabel },
      { Field: 'Scenario candidate count', Value: block.scenarioComparison.candidateCount },
      { Field: 'Scenario indicator count', Value: block.scenarioComparison.indicatorCount },
      { Field: 'Scenario interpretation mode', Value: block.scenarioComparison.policyInterpretationMode },
      { Field: 'Scenario guidance summary', Value: block.scenarioComparison.guidanceSummary },
    );
  }

  return rows;
}

export function createUrbanReportPendingInsert(
  block: UrbanReportEvidenceBlock,
): PendingReportInsert {
  const figure = block.mapFigureReference;
  const evidenceBlocks: ReportSection['blocks'] = [
    ...(figure ? [{
      kind: 'figure' as const,
      assetId: figure.assetId,
      title: figure.title,
      caption: figure.caption,
      assetType: 'map' as const,
      ...(figure.sourceRunId ? { sourceRunId: figure.sourceRunId } : {}),
    }] : []),
    { kind: 'paragraph' as const, text: block.methodSummary },
    { kind: 'paragraph' as const, text: block.dataSummary },
    { kind: 'paragraph' as const, text: block.qaSummary },
  ];

  const reproducibilityItems = [
    'Assumptions',
    ...block.assumptions.map((item) => `Assumption: ${item}`),
    ...(block.scenarioComparison
      ? [
          'Scenario interpretation',
          `Policy interpretation mode: ${block.scenarioComparison.policyInterpretationMode}.`,
          `Guidance summary: ${block.scenarioComparison.guidanceSummary}`,
          `Compared ${block.scenarioComparison.candidateCount} candidate scenario(s) across ${block.scenarioComparison.indicatorCount} indicator(s).`,
          ...block.scenarioComparison.uncertaintyNotes.map((item) => `Scenario uncertainty: ${item}`),
        ]
      : []),
    'Limitations',
    ...block.limitations.map((item) => `Limitation: ${item}`),
    ...(block.citationNotes.length > 0
      ? ['Reference notes', ...block.citationNotes.map((item) => `Reference: ${item}`)]
      : ['Reference notes: no citation records or reference notes were supplied.']),
  ];

  const sections: ReportSection[] = [
    {
      id: `${block.reportInsertId}-evidence-section`,
      title: block.title,
      kind: 'evidence',
      origin: 'generated',
      generated: true,
      badgeLabel: 'Urban evidence block',
      citationIds: [],
      summary: block.methodSummary.slice(0, 180),
      ...sectionFields(block),
      blocks: evidenceBlocks,
    },
    {
      id: `${block.reportInsertId}-provenance-section`,
      title: `${block.title} - Provenance and QA`,
      kind: 'methodology',
      origin: 'generated',
      generated: true,
      badgeLabel: 'Reproducibility block',
      citationIds: [],
      ...sectionFields(block),
      blocks: [
        {
          kind: 'bullet_list',
          items: reproducibilityItems,
        },
        {
          kind: 'table',
          assetId: `${block.reportInsertId}-provenance-table`,
          title: 'Structured evidence provenance',
          caption: 'Reference-only provenance carried from Urban Analytics into the report block.',
          columns: ['Field', 'Value'],
          rows: buildProvenanceRows(block),
          ...(block.runId ? { sourceRunId: block.runId } : {}),
        },
      ],
    },
  ];

  return {
    id: block.reportInsertId,
    insertedAt: block.provenance.generatedAt,
    source: `urban-evidence:${block.artifactId}`,
    suggestedTitle: block.title,
    citations: [],
    sections,
  };
}

function qaStateForReportArtifact(sourceQaState: UrbanEvidenceQAState): UrbanEvidenceQAState {
  return sourceQaState === 'valid' ? 'valid' : sourceQaState === 'blocked' || sourceQaState === 'invalid' ? sourceQaState : 'unvalidated';
}

function appendReportInsertToManifest(runId: string | null, reportInsertId: string): void {
  if (!runId) return;
  const flowStore = useFlowStore.getState();
  const manifest = flowStore.lookupManifest(runId);
  if (!manifest || manifest.reportInsertIds.includes(reportInsertId)) return;
  flowStore.registerManifest({
    ...manifest,
    reportInsertIds: [...manifest.reportInsertIds, reportInsertId],
  });
}

function dispatchReportingChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reporting/pending-changed'));
  }
}

export function enqueueUrbanReportEvidenceBlock(
  input: BuildUrbanReportEvidenceBlockInput,
): EnqueueUrbanReportEvidenceBlockResult {
  const block = buildUrbanReportEvidenceBlock(input);
  const pendingInsert = createUrbanReportPendingInsert(block);
  enqueuePendingInsert(pendingInsert);
  dispatchReportingChanged();

  const urbanStore = useUrbanContextStore.getState();
  const sourceMetadata = input.artifact.metadata ?? {};
  urbanStore.updateEvidenceArtifactState(input.artifact.id, {
    reportInsertId: block.reportInsertId,
    metadata: {
      ...sourceMetadata,
      lastReportInsertId: block.reportInsertId,
      lastReportInsertedAt: block.provenance.generatedAt,
      ...(block.scenarioComparison
        ? {
            lastScenarioComparisonId: block.scenarioComparison.comparisonId,
            lastScenarioPolicyInterpretationMode: block.scenarioComparison.policyInterpretationMode,
            lastScenarioGuidanceSummary: block.scenarioComparison.guidanceSummary,
          }
        : {}),
    },
  });

  const reportEvidenceId = `urban-report-evidence-${block.reportInsertId}`;
  urbanStore.registerEvidenceArtifact({
    id: reportEvidenceId,
    kind: 'report-insert',
    title: `Report block: ${input.artifact.title}`,
    summary: `Structured report evidence block generated from ${input.artifact.title}.`,
    state: 'active',
    sourceModule: 'reporting',
    sourceId: block.reportInsertId,
    ...(block.provenance.contextId ? { linkedContextId: block.provenance.contextId } : {}),
    ...(block.provenance.studyAreaId ? { linkedStudyAreaId: block.provenance.studyAreaId } : {}),
    ...(block.runId ? { linkedRunId: block.runId } : {}),
    linkedLayerIds: block.provenance.layerIds,
    linkedFilePaths: block.provenance.filePaths,
    linkedArtifactIds: unique([block.artifactId, ...block.provenance.linkedArtifactIds]),
    ...(block.provenance.flowId ? { flowId: block.provenance.flowId } : {}),
    reportInsertId: block.reportInsertId,
    tags: ['reports_briefs', 'data_engineering'],
    provenance: {
      sourceModule: 'reporting',
      createdAt: block.provenance.generatedAt,
      sourceId: block.reportInsertId,
      sourceTitle: block.title,
      ...(block.provenance.contextId ? { contextId: block.provenance.contextId } : {}),
      ...(block.runId ? { runId: block.runId } : {}),
      ...(block.provenance.flowId ? { flowId: block.provenance.flowId } : {}),
      ...(block.provenance.methodId ? { methodId: block.provenance.methodId } : {}),
      ...(block.provenance.methodName ? { methodName: block.provenance.methodName } : {}),
      layerIds: block.provenance.layerIds,
      filePaths: block.provenance.filePaths,
      inputArtifactIds: [block.artifactId],
      parentArtifactIds: [block.artifactId],
      notes: 'Structured Urban report evidence block generated from an existing evidence artifact.',
    },
    qa: {
      state: qaStateForReportArtifact(input.artifact.qa.state),
      warnings: input.artifact.qa.warnings,
      limitations: block.limitations,
    },
    metadata: {
      reportInsertId: block.reportInsertId,
      sourceEvidenceArtifactId: block.artifactId,
      hasMapFigureReference: block.mapFigureReference !== null,
      assumptionCount: block.assumptions.length,
      limitationCount: block.limitations.length,
      citationNoteCount: block.citationNotes.length,
      runId: scalarMetadata(block.runId),
      scenarioComparisonId: scalarMetadata(block.scenarioComparison?.comparisonId),
      scenarioPolicyInterpretationMode: scalarMetadata(block.scenarioComparison?.policyInterpretationMode),
      scenarioGuidanceSummary: scalarMetadata(block.scenarioComparison?.guidanceSummary),
      scenarioCandidateCount: block.scenarioComparison?.candidateCount ?? null,
      scenarioIndicatorCount: block.scenarioComparison?.indicatorCount ?? null,
    },
  });

  appendReportInsertToManifest(block.runId, block.reportInsertId);

  return {
    block,
    pendingInsert,
    evidenceArtifactId: reportEvidenceId,
  };
}

export function enqueueUrbanMethodCardReportBlock(
  input: EnqueueUrbanMethodCardReportBlockInput,
): EnqueueUrbanReportEvidenceBlockResult {
  const context = useUrbanContextStore.getState().context;
  const sourceEvidenceId = `urban-method-card-report-source-${input.card.id}`;
  const qaWarnings = input.card.validityEnvelope
    ? []
    : ['No method validity envelope is attached to this method card; report use should remain preliminary.'];
  const methodArtifact = useUrbanContextStore.getState().registerEvidenceArtifact({
    id: sourceEvidenceId,
    kind: 'method-card',
    title: input.card.title,
    summary: input.card.summary,
    state: 'active',
    sourceModule: 'urban-analytics',
    sourceId: input.card.id,
    ...(context?.contextId ? { linkedContextId: context.contextId } : {}),
    ...(context?.studyAreaId ? { linkedStudyAreaId: context.studyAreaId } : {}),
    linkedLayerIds: context?.activeLayerIds ?? [],
    cardId: input.card.id,
    ...(context?.activeFlowId ? { flowId: context.activeFlowId } : {}),
    tags: input.card.tags,
    provenance: {
      sourceModule: 'urban-analytics',
      createdAt: input.insertedAt ?? now(),
      sourceId: input.card.id,
      sourceTitle: input.card.title,
      ...(context?.contextId ? { contextId: context.contextId } : {}),
      ...(context?.activeFlowId ? { flowId: context.activeFlowId } : {}),
      methodId: input.card.id,
      methodName: input.card.title,
      layerIds: context?.activeLayerIds ?? [],
      filePaths: [],
      inputArtifactIds: [],
      parentArtifactIds: [],
      notes: 'Method-card report evidence source; no analytical outputs are embedded.',
    },
    qa: {
      state: qaWarnings.length > 0 ? 'warning' : 'unvalidated',
      warnings: qaWarnings,
      limitations: input.card.limitations ? [input.card.limitations] : [],
    },
    metadata: {
      capabilityStatus: scalarMetadata(input.card.capabilityStatus ?? input.card.validityEnvelope?.capabilityStatus ?? null),
      hasValidityEnvelope: input.card.validityEnvelope != null,
    },
    ...(input.insertedAt ? { createdAt: input.insertedAt, updatedAt: input.insertedAt } : {}),
  });

  return enqueueUrbanReportEvidenceBlock({
    artifact: methodArtifact,
    methodCard: input.card,
    methodSummary: input.methodSummary,
    citationNotes: input.citationNotes,
    insertedAt: input.insertedAt,
  });
}
