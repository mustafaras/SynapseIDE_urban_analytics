import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ClipboardList,
  Code2,
  Copy,
  Database,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  type LucideIcon,
  Map as MapIcon,
  Search,
  ShieldAlert,
  Upload,
  Workflow,
  X,
} from 'lucide-react';

import { getDashboardBinding } from '@/features/dashboard/dataBindings';
import { queuePendingDashboardBinding } from '@/features/dashboard/storage';
import type { DashboardBindingKind, DashboardWidgetType } from '@/features/dashboard/types';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { MAP_LAYER_REGISTRY_EVENT, type MapLayerRegistryChangeDetail } from '@/centerpanel/components/map/mapTypes';
import { useFlowStore } from '@/stores/useFlowStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import {
  assessPublicationEligibility,
  publishUrbanRunOutputsToMap,
  supersedePublishedUrbanMapEvidenceForLayerChange,
} from '../context/mapEvidencePublisher';
import {
  enqueueUrbanDashboardBinding,
  getUrbanDashboardBindingEligibility,
} from '../context/dashboardArtifactBuilder';
import { enqueueUrbanReportEvidenceBlock } from '../context/reportArtifactBuilder';
import {
  buildUrbanScenarioInterpretationGuidance,
  buildUrbanScenarioUncertaintyNotes,
  extractUrbanScenarioComparison,
} from '../context/scenarioComparisonMetadata';
import {
  buildAndDispatchJsonManifest,
  buildAndDispatchMarkdownMethodNote,
  buildAndDispatchPythonScript,
  buildAndDispatchTypeScriptAdapter,
  buildSeedFromCompletedRun,
  type BuildAndDispatchUrbanCodeArtifactResult,
} from '../context/codeArtifactRequestActions';
import { buildAndDownloadUrbanReproduciblePackageJsonFromActiveContext } from '../context/reproduciblePackageExport';

import type {
  CompletedAnalysisRun,
  UrbanEvidenceArtifact,
  UrbanEvidenceArtifactKind,
  UrbanEvidenceArtifactState,
  UrbanEvidenceQAState,
  UrbanEvidenceSourceModule,
  UrbanWorkflowRunManifest,
} from '../lib/types';
import { resolveLegacyRunManifest } from '../lib/runManifest';
import { selectUrbanEvidenceArtifactsByContext } from '../context/evidenceArtifacts';
import {
  useUrbanContext,
  useUrbanContextId,
  useUrbanEvidenceArtifacts,
} from '../useUrbanContextStore';

import './urbanEvidenceTray.css';

type EvidenceKindFilter = UrbanEvidenceArtifactKind | 'all';
type EvidenceTone = 'neutral' | 'ok' | 'warning' | 'danger' | 'muted';
type RunCodeArtifactAction = 'python' | 'manifest' | 'method-note' | 'adapter';

const KIND_ORDER: UrbanEvidenceArtifactKind[] = [
  'method-card',
  'dataset',
  'indicator',
  'map-layer',
  'workflow-run',
  'code-artifact',
  'report-insert',
  'dashboard-binding',
  'education-link',
  'qa-finding',
];

const KIND_LABELS: Record<UrbanEvidenceArtifactKind, string> = {
  'method-card': 'Method',
  dataset: 'Dataset',
  indicator: 'Indicator',
  'map-layer': 'Map Layer',
  'workflow-run': 'Workflow',
  'code-artifact': 'Code',
  'report-insert': 'Report',
  'dashboard-binding': 'Dashboard',
  'education-link': 'Education',
  'qa-finding': 'QA Finding',
};

const SOURCE_LABELS: Record<UrbanEvidenceSourceModule, string> = {
  'urban-analytics': 'Urban Analytics',
  'map-explorer': 'Map Explorer',
  'synapse-ide': 'Synapse IDE',
  ide: 'IDE',
  reporting: 'Reporting',
  dashboard: 'Dashboard',
  education: 'Education',
};

const QA_CONFIG: Record<UrbanEvidenceQAState, { label: string; tone: EvidenceTone }> = {
  unvalidated: { label: 'Unvalidated', tone: 'muted' },
  valid: { label: 'Valid', tone: 'ok' },
  warning: { label: 'Warning', tone: 'warning' },
  stale: { label: 'Stale', tone: 'warning' },
  invalid: { label: 'Invalid', tone: 'danger' },
  blocked: { label: 'Blocked', tone: 'danger' },
};

const STATE_CONFIG: Record<UrbanEvidenceArtifactState, { label: string; tone: EvidenceTone }> = {
  draft: { label: 'Draft', tone: 'muted' },
  active: { label: 'Active', tone: 'ok' },
  published: { label: 'Published', tone: 'ok' },
  stale: { label: 'Stale', tone: 'warning' },
  blocked: { label: 'Blocked', tone: 'danger' },
  archived: { label: 'Archived', tone: 'muted' },
  invalid: { label: 'Invalid', tone: 'danger' },
};

const DASHBOARD_KIND_WIDGET: Record<DashboardBindingKind, DashboardWidgetType> = {
  metric: 'kpi',
  series: 'chart',
  table: 'table',
  map: 'map',
  comparison: 'comparison',
  text: 'text',
  live: 'live_indicator',
};

function KindIcon({ kind, size = 16 }: { kind: UrbanEvidenceArtifactKind; size?: number }) {
  const Icon = getKindIcon(kind);
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}

function getKindIcon(kind: UrbanEvidenceArtifactKind): LucideIcon {
  switch (kind) {
    case 'dataset':
      return Database;
    case 'indicator':
      return ClipboardList;
    case 'map-layer':
      return MapIcon;
    case 'workflow-run':
      return Workflow;
    case 'code-artifact':
      return Code2;
    case 'report-insert':
      return FileText;
    case 'dashboard-binding':
      return LayoutDashboard;
    case 'education-link':
      return GraduationCap;
    case 'qa-finding':
      return ShieldAlert;
    case 'method-card':
    default:
      return BookOpen;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(value: string, max = 18): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(4, max - 7))}...${value.slice(-4)}`;
}

function asPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}


function primaryLayerId(artifact: UrbanEvidenceArtifact): string | null {
  return artifact.mapLayerId
    ?? artifact.linkedLayerIds[0]
    ?? artifact.provenance.layerIds[0]
    ?? null;
}

function primaryFilePath(artifact: UrbanEvidenceArtifact): string | null {
  return artifact.linkedFilePaths[0]
    ?? artifact.provenance.filePaths[0]
    ?? null;
}

function dashboardTarget(artifact: UrbanEvidenceArtifact): {
  bindingId: string;
  widgetType: DashboardWidgetType;
  bindingLabel: string;
} | null {
  if (!artifact.dashboardBindingId) return null;
  const binding = getDashboardBinding(artifact.dashboardBindingId);
  if (!binding) return null;
  return {
    bindingId: binding.id,
    widgetType: DASHBOARD_KIND_WIDGET[binding.kind],
    bindingLabel: binding.label,
  };
}

function actionDisabledReason(artifact: UrbanEvidenceArtifact, action: 'map' | 'ide' | 'dashboard'): string | null {
  if (action === 'map') {
    return primaryLayerId(artifact) ? null : 'No map layer reference on this artifact.';
  }
  if (action === 'ide') {
    if (primaryFilePath(artifact)) return null;
    return artifact.codeArtifactId
      ? 'Code artifact ID is recorded, but no file path is linked yet.'
      : 'No code file path is linked to this artifact.';
  }
  if (!artifact.dashboardBindingId) return 'No dashboard binding reference on this artifact.';
  return dashboardTarget(artifact) ? null : 'Dashboard binding is not registered in the dashboard catalog.';
}

function publishDisabledReason(
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null,
  manifest: UrbanWorkflowRunManifest | null,
): string | null {
  if (artifact.kind !== 'workflow-run') {
    return 'Publish to Map is only available for workflow-run artifacts.';
  }
  if (!artifact.linkedRunId) {
    return 'No run ID linked to this artifact — cannot locate spatial outputs.';
  }
  if (!run) {
    return `Run ${artifact.linkedRunId} is not registered in the workflow store.`;
  }
  if (run.mapOutputs.length === 0) {
    return 'Run has no spatial map outputs.';
  }
  const checks = run.mapOutputs.map((output) => assessPublicationEligibility(run, output.id, manifest));
  if (checks.some((check) => check.eligible)) {
    return null;
  }
  const reasons = checks.flatMap((check) => check.reasons);
  return reasons[0] ?? 'No eligible spatial outputs can be published from this run.';
}

function resolveManifestForRun(
  run: CompletedAnalysisRun,
  manifests: Readonly<Record<string, UrbanWorkflowRunManifest>>,
): UrbanWorkflowRunManifest {
  return manifests[run.runId] ?? resolveLegacyRunManifest(run);
}

function buildRunLookup(runs: readonly CompletedAnalysisRun[]): Map<string, CompletedAnalysisRun> {
  return new Map(runs.map((run) => [run.runId, run]));
}

function codeArtifactDisabledReason(
  artifact: UrbanEvidenceArtifact,
  runLookup: ReadonlyMap<string, CompletedAnalysisRun>,
): string | null {
  if (artifact.kind !== 'workflow-run') {
    return 'Code artifact generation is only available for workflow-run artifacts.';
  }
  if (!artifact.linkedRunId) {
    return 'No completed run is associated with this evidence artifact.';
  }
  if (!runLookup.has(artifact.linkedRunId)) {
    return `Run ${artifact.linkedRunId} is not registered in the workflow store.`;
  }
  return null;
}

function dashboardDisabledReason(
  artifact: UrbanEvidenceArtifact,
  runLookup: ReadonlyMap<string, CompletedAnalysisRun>,
): string | null {
  const run = artifact.linkedRunId ? runLookup.get(artifact.linkedRunId) ?? null : null;
  const eligibility = getUrbanDashboardBindingEligibility(artifact, run);
  return eligibility.eligible ? null : eligibility.reason;
}

function buildPublicationDisabledReasonLookup(
  artifacts: readonly UrbanEvidenceArtifact[],
  runs: readonly CompletedAnalysisRun[],
  manifests: Readonly<Record<string, UrbanWorkflowRunManifest>>,
): Map<string, string | null> {
  const runLookup = buildRunLookup(runs);
  return new Map(
    artifacts.map((artifact) => {
      const run = artifact.linkedRunId ? runLookup.get(artifact.linkedRunId) ?? null : null;
      const manifest = run ? resolveManifestForRun(run, manifests) : null;
      return [artifact.id, publishDisabledReason(artifact, run, manifest)];
    }),
  );
}

function defaultPublishDisabledReason(artifact: UrbanEvidenceArtifact): string | null {
  if (artifact.kind !== 'workflow-run') {
    return 'Publish to Map is only available for workflow-run artifacts.';
  }
  if (!artifact.linkedRunId) {
    return 'No run ID linked to this artifact — cannot locate spatial outputs.';
  }
  return null;
}

function runtimeSafetyPrefix(result: BuildAndDispatchUrbanCodeArtifactResult): string {
  const runtimeNotes = result.request.safetyNotes.filter((note) =>
    /\b(demo|synthetic|unknown)\b/i.test(note),
  );
  return runtimeNotes.length > 0 ? `${runtimeNotes.join(' ')} ` : '';
}

function formatCodeArtifactStatus(
  label: string,
  actionResult: BuildAndDispatchUrbanCodeArtifactResult,
): string {
  const prefix = runtimeSafetyPrefix(actionResult);
  if (!actionResult.result.bridgeRouted) {
    return `${prefix}bridge-not-routed: ${label} ${actionResult.request.targetFilename} was registered as evidence, but the IDE tab did not open.`;
  }
  return `${prefix}Opened ${label} ${actionResult.request.targetFilename} in Synapse IDE.`;
}

function formatCodeArtifactError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/exceeds \d+ bytes|exceeds .*bytes/i.test(message)) {
    return `size-rejected: ${message}`;
  }
  return `Code artifact request failed: ${message}`;
}

function runtimeDashboardSafetyPrefix(limitations: readonly string[]): string {
  const runtimeNotes = limitations.filter((note) => /\b(demo|synthetic|unknown)\b/i.test(note));
  return runtimeNotes.length > 0 ? `${runtimeNotes.join(' ')} ` : '';
}

function formatDashboardBindingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Dashboard binding failed: ${message}`;
}

function formatPackageExportError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Reproducible package export failed: ${message}`;
}

function buildManifest(artifact: UrbanEvidenceArtifact): Record<string, unknown> {
  return {
    schema: 'urban-evidence-artifact-manifest.v1',
    artifactId: artifact.id,
    kind: artifact.kind,
    title: artifact.title,
    summary: artifact.summary ?? null,
    state: artifact.state,
    sourceModule: artifact.sourceModule,
    contextId: artifact.linkedContextId ?? artifact.provenance.contextId ?? null,
    studyAreaId: artifact.linkedStudyAreaId ?? null,
    runId: artifact.linkedRunId ?? artifact.provenance.runId ?? null,
    flowId: artifact.flowId ?? artifact.provenance.flowId ?? null,
    cardId: artifact.cardId ?? null,
    indicatorKind: artifact.indicatorKind ?? null,
    references: {
      layerIds: [...new Set([...artifact.linkedLayerIds, ...artifact.provenance.layerIds])],
      filePaths: [...new Set([...artifact.linkedFilePaths, ...artifact.provenance.filePaths])],
      artifactIds: artifact.linkedArtifactIds,
      mapLayerId: artifact.mapLayerId ?? null,
      codeArtifactId: artifact.codeArtifactId ?? null,
      reportInsertId: artifact.reportInsertId ?? null,
      dashboardBindingId: artifact.dashboardBindingId ?? null,
    },
    provenance: artifact.provenance,
    qa: artifact.qa,
    dataFitness: artifact.dataFitness
      ? {
          status: artifact.dataFitness.status,
          grade: artifact.dataFitness.grade,
          score: artifact.dataFitness.score,
          computedAt: artifact.dataFitness.computedAt,
          blockedReasons: artifact.dataFitness.blockedReasons,
          missingInputs: artifact.dataFitness.missingInputs,
          uncertaintyNotes: artifact.dataFitness.uncertaintyNotes,
          sourceLayerIds: artifact.dataFitness.sourceLayerIds,
          sourceRunIds: artifact.dataFitness.sourceRunIds,
        }
      : null,
    metadata: artifact.metadata ?? null,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  };
}

function EvidenceChip({ label, tone = 'neutral', title }: { label: string; tone?: EvidenceTone; title?: string }) {
  return (
    <span className={`ua-evidence-chip ua-evidence-chip--${tone}`} title={title}>
      {label}
    </span>
  );
}

function EvidenceActionButton({
  icon: Icon,
  label,
  onClick,
  disabledReason,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabledReason?: string | null;
}) {
  const disabled = Boolean(disabledReason);
  return (
    <button
      type="button"
      className="ua-evidence-action"
      onClick={onClick}
      disabled={disabled}
      title={disabledReason ?? label}
      aria-label={disabledReason ? `${label}: ${disabledReason}` : label}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

function ReferenceList({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="ua-evidence-detailGroup">
      <span>{title}</span>
      <ul>
        {values.slice(0, 6).map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

interface ArtifactRowProps {
  artifact: UrbanEvidenceArtifact;
  selected: boolean;
  layerName?: string | null;
  onInspect: () => void;
  onOpenMap: () => void;
  onOpenIde: () => void;
  onAddReport: () => void;
  onBindDashboard: () => void;
  dashboardDisabledReason?: string | null;
  onPublishToMap: () => void;
  publishDisabledReason?: string | null;
  codeArtifactDisabledReason?: string | null;
  onOpenPythonScript: () => void;
  onOpenJsonManifest: () => void;
  onOpenMethodNote: () => void;
  onOpenAdapterSnippet: () => void;
}

function ArtifactRow({
  artifact,
  selected,
  layerName,
  onInspect,
  onOpenMap,
  onOpenIde,
  onAddReport,
  onBindDashboard,
  dashboardDisabledReason: dashboardDisabledReasonProp,
  onPublishToMap,
  publishDisabledReason: publishDisabledReasonProp,
  codeArtifactDisabledReason: codeArtifactDisabledReasonProp,
  onOpenPythonScript,
  onOpenJsonManifest,
  onOpenMethodNote,
  onOpenAdapterSnippet,
}: ArtifactRowProps) {
  const qaConfig = QA_CONFIG[artifact.qa.state];
  const stateConfig = STATE_CONFIG[artifact.state];
  const layerId = primaryLayerId(artifact);
  const filePath = primaryFilePath(artifact);
  const mapReason = actionDisabledReason(artifact, 'map');
  const ideReason = actionDisabledReason(artifact, 'ide');
  const dashboardReason = dashboardDisabledReasonProp ?? actionDisabledReason(artifact, 'dashboard');
  const publishReason = publishDisabledReasonProp ?? defaultPublishDisabledReason(artifact);
  const runCodeReason = artifact.kind === 'workflow-run'
    ? codeArtifactDisabledReasonProp
    : null;

  return (
    <div
      role="row"
      className={`ua-evidence-row${selected ? ' is-selected' : ''}`}
      aria-selected={selected}
    >
      <div role="cell" className="ua-evidence-cell ua-evidence-cell--kind">
        <span className="ua-evidence-kindIcon">
          <KindIcon kind={artifact.kind} />
        </span>
        <div>
          <strong>{KIND_LABELS[artifact.kind]}</strong>
          <span>{SOURCE_LABELS[artifact.sourceModule]}</span>
        </div>
      </div>
      <button type="button" className="ua-evidence-titleCell" onClick={onInspect} aria-label={`Inspect ${artifact.title}`}>
        <span>{artifact.title}</span>
        <small>
          {artifact.summary
            ? artifact.summary
            : `${artifact.kind} artifact ${shortId(artifact.id)} has reference metadata but no summary.`}
        </small>
      </button>
      <div role="cell" className="ua-evidence-cell ua-evidence-cell--refs">
        {layerId ? <EvidenceChip label={layerName ? `Layer: ${layerName}` : `Layer ${shortId(layerId)}`} tone="neutral" /> : null}
        {filePath ? <EvidenceChip label={`File ${shortId(filePath, 22)}`} tone="neutral" /> : null}
        {artifact.linkedArtifactIds.length > 0 ? <EvidenceChip label={`${artifact.linkedArtifactIds.length} linked`} tone="neutral" /> : null}
        {!layerId && !filePath && artifact.linkedArtifactIds.length === 0 ? <EvidenceChip label="Reference only" tone="muted" /> : null}
      </div>
      <div role="cell" className="ua-evidence-cell ua-evidence-cell--qa" aria-label={`QA: ${qaConfig.label}, state: ${stateConfig.label}${artifact.dataFitness ? `, fitness: ${artifact.dataFitness.status}` : ''}`}>
        <EvidenceChip label={qaConfig.label} tone={qaConfig.tone} />
        <EvidenceChip label={stateConfig.label} tone={stateConfig.tone} />
        {artifact.dataFitness ? <EvidenceChip label={`Fitness ${artifact.dataFitness.status}`} tone={artifact.dataFitness.status === 'ready' ? 'ok' : 'warning'} /> : null}
      </div>
      <time className="ua-evidence-time" dateTime={artifact.updatedAt}>
        {formatDateTime(artifact.updatedAt)}
      </time>
      <div role="cell" className="ua-evidence-actions">
        <EvidenceActionButton icon={Eye} label="Inspect" onClick={onInspect} />
        <EvidenceActionButton icon={MapIcon} label="Map" onClick={onOpenMap} disabledReason={mapReason} />
        <EvidenceActionButton icon={Code2} label="IDE" onClick={onOpenIde} disabledReason={ideReason} />
        <EvidenceActionButton icon={FileText} label="Report" onClick={onAddReport} />
        <EvidenceActionButton icon={LayoutDashboard} label="Dashboard" onClick={onBindDashboard} disabledReason={dashboardReason} />
        <EvidenceActionButton icon={Upload} label="Publish" onClick={onPublishToMap} disabledReason={publishReason} />
        {artifact.kind === 'workflow-run' ? (
          <>
            <EvidenceActionButton
              icon={Code2}
              label="Open Python Script in IDE"
              onClick={onOpenPythonScript}
              disabledReason={runCodeReason}
            />
            <EvidenceActionButton
              icon={FileText}
              label="Open JSON Manifest"
              onClick={onOpenJsonManifest}
              disabledReason={runCodeReason}
            />
            <EvidenceActionButton
              icon={FileText}
              label="Open Method Note"
              onClick={onOpenMethodNote}
              disabledReason={runCodeReason}
            />
            <EvidenceActionButton
              icon={Code2}
              label="Open Adapter Snippet"
              onClick={onOpenAdapterSnippet}
              disabledReason={runCodeReason}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function ArtifactInspector({
  artifact,
  run,
  layerName,
  onCopyManifest,
}: {
  artifact: UrbanEvidenceArtifact | null;
  run?: CompletedAnalysisRun | null;
  layerName?: string | null;
  onCopyManifest: (artifact: UrbanEvidenceArtifact) => void;
}) {
  if (!artifact) {
    return (
      <aside className="ua-evidence-inspector" aria-label="Evidence provenance inspector">
        <div className="ua-evidence-emptyCompact">
          <Search aria-hidden="true" size={17} />
          <span>Select an artifact to inspect provenance and QA.</span>
        </div>
      </aside>
    );
  }

  const qaConfig = QA_CONFIG[artifact.qa.state];
  const stateConfig = STATE_CONFIG[artifact.state];
  const layerIds = [...new Set([...artifact.linkedLayerIds, ...artifact.provenance.layerIds])];
  const filePaths = [...new Set([...artifact.linkedFilePaths, ...artifact.provenance.filePaths])];
  const inputArtifacts = [...new Set([...artifact.linkedArtifactIds, ...artifact.provenance.inputArtifactIds])];
  const scenarioComparison = extractUrbanScenarioComparison(run ?? null);
  const scenarioGuidance = scenarioComparison ? buildUrbanScenarioInterpretationGuidance(scenarioComparison) : [];
  const scenarioUncertaintyNotes = scenarioComparison ? buildUrbanScenarioUncertaintyNotes(scenarioComparison) : [];
  const hasQaNotes = artifact.qa.warnings.length > 0
    || artifact.qa.limitations.length > 0
    || Boolean(artifact.qa.staleReason)
    || Boolean(artifact.qa.invalidReason);

  return (
    <aside className="ua-evidence-inspector" aria-label={`Provenance inspector for ${artifact.title}`}>
      <div className="ua-evidence-inspectorHeader">
        <span className="ua-evidence-kindIcon">
          <KindIcon kind={artifact.kind} />
        </span>
        <div>
          <strong>{artifact.title}</strong>
          <span>{shortId(artifact.id, 26)}</span>
        </div>
        <button
          type="button"
          className="ua-evidence-iconBtn"
          onClick={() => onCopyManifest(artifact)}
          title="Copy reference manifest"
          aria-label="Copy reference manifest"
        >
          <Copy aria-hidden="true" size={15} />
        </button>
      </div>

      <div className="ua-evidence-chipLine">
        <EvidenceChip label={KIND_LABELS[artifact.kind]} />
        <EvidenceChip label={SOURCE_LABELS[artifact.sourceModule]} />
        <EvidenceChip label={qaConfig.label} tone={qaConfig.tone} />
        <EvidenceChip label={stateConfig.label} tone={stateConfig.tone} />
        {artifact.qa.confidence !== undefined ? (
          <EvidenceChip label={`Confidence ${asPercent(artifact.qa.confidence)}`} tone="neutral" />
        ) : null}
      </div>

      {artifact.summary ? <p className="ua-evidence-summary">{artifact.summary}</p> : null}

      <div className="ua-evidence-detailGrid">
        <div className="ua-evidence-detailGroup">
          <span>Provenance</span>
          <dl>
            <dt>Created</dt>
            <dd>{formatDateTime(artifact.provenance.createdAt)}</dd>
            <dt>Updated</dt>
            <dd>{formatDateTime(artifact.updatedAt)}</dd>
            <dt>Source ID</dt>
            <dd>{artifact.provenance.sourceId ?? artifact.sourceId ?? 'Not recorded'}</dd>
            <dt>Method</dt>
            <dd>{artifact.provenance.methodName ?? artifact.provenance.methodId ?? 'Not recorded'}</dd>
            <dt>Workflow</dt>
            <dd>{artifact.flowId ?? artifact.provenance.flowId ?? 'Not recorded'}</dd>
            <dt>Run</dt>
            <dd>{artifact.linkedRunId ?? artifact.provenance.runId ?? 'Not recorded'}</dd>
          </dl>
        </div>

        <div className="ua-evidence-detailGroup">
          <span>QA Notes</span>
          {hasQaNotes ? (
            <ul>
              {artifact.qa.warnings.map((warning) => <li key={`warning-${warning}`}>{warning}</li>)}
              {artifact.qa.limitations.map((limitation) => <li key={`limitation-${limitation}`}>{limitation}</li>)}
              {artifact.qa.staleReason ? <li>{artifact.qa.staleReason}</li> : null}
              {artifact.qa.invalidReason ? <li>{artifact.qa.invalidReason}</li> : null}
            </ul>
          ) : (
            <p>No artifact-specific QA notes are recorded. Treat that as unknown, not as external validation.</p>
          )}
        </div>

        {scenarioComparison ? (
          <div className="ua-evidence-detailGroup">
            <span>Policy interpretation guidance</span>
            <dl>
              <dt>Mode</dt>
              <dd>{scenarioComparison.policyInterpretation.mode}</dd>
              <dt>Comparison</dt>
              <dd>{scenarioComparison.comparisonId}</dd>
              <dt>Baseline</dt>
              <dd>{scenarioComparison.baseline.label}</dd>
              <dt>Coverage</dt>
              <dd>
                {scenarioComparison.candidateRuns.length} scenario(s), {scenarioComparison.indicatorsCompared.length} indicator(s)
              </dd>
            </dl>
            <ul>
              {scenarioGuidance.map((entry) => <li key={`guidance-${entry}`}>{entry}</li>)}
              {scenarioComparison.limitations.slice(0, 4).map((entry) => (
                <li key={`limitation-scenario-${entry}`}>Limitation: {entry}</li>
              ))}
              {scenarioUncertaintyNotes.map((entry) => <li key={`uncertainty-${entry}`}>Uncertainty: {entry}</li>)}
            </ul>
          </div>
        ) : null}
      </div>

      {artifact.dataFitness ? (
        <div className="ua-evidence-fitness">
          <BadgeCheck aria-hidden="true" size={15} />
          <span>
            Data fitness: {artifact.dataFitness.status}, grade {artifact.dataFitness.grade}, score{' '}
            {artifact.dataFitness.score === null ? 'unknown' : Math.round(artifact.dataFitness.score)}
          </span>
        </div>
      ) : null}

      <div className="ua-evidence-detailGrid ua-evidence-detailGrid--refs">
        <ReferenceList title={layerName ? `Layer references (${layerName})` : 'Layer references'} values={layerIds} />
        <ReferenceList title="File references" values={filePaths} />
        <ReferenceList title="Input artifacts" values={inputArtifacts} />
      </div>
    </aside>
  );
}

export interface UrbanEvidenceTrayProps {
  initialExpanded?: boolean;
  variant?: 'right-rail' | 'workspace';
}

export function UrbanEvidenceTray({
  initialExpanded = false,
  variant = 'right-rail',
}: UrbanEvidenceTrayProps) {
  const isRightRail = variant === 'right-rail';
  const context = useUrbanContext();
  const contextId = useUrbanContextId();
  const allArtifacts = useUrbanEvidenceArtifacts();
  const overlayLayers = useMapExplorerStore((state) => state.overlayLayers);
  const completedRuns = useFlowStore((state) => state.completedRuns);
  const manifests = useFlowStore((state) => state.manifests);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [kindFilter, setKindFilter] = useState<EvidenceKindFilter>('all');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const handleLayerRegistryChange = (event: Event): void => {
      const detail = (event as CustomEvent<MapLayerRegistryChangeDetail>).detail;
      if (!detail?.layerId || (detail.operation !== 'update' && detail.operation !== 'remove')) {
        return;
      }
      const layer = useMapExplorerStore.getState().overlayLayers.find((entry) => entry.id === detail.layerId) ?? null;
      supersedePublishedUrbanMapEvidenceForLayerChange({
        layerId: detail.layerId,
        layer,
        changedAt: detail.timestamp,
        reason: detail.operation === 'remove'
          ? `Map source layer ${detail.layerId} was removed after evidence publication.`
          : `Map source layer ${detail.layerId} changed after evidence publication.`,
      });
    };

    window.addEventListener(MAP_LAYER_REGISTRY_EVENT, handleLayerRegistryChange);
    return () => window.removeEventListener(MAP_LAYER_REGISTRY_EVENT, handleLayerRegistryChange);
  }, []);

  const layerNameById = useMemo(() => {
    const names = new Map<string, string>();
    for (const layer of overlayLayers) {
      names.set(layer.id, layer.name);
    }
    return names;
  }, [overlayLayers]);

  const contextArtifacts = useMemo(
    () => selectUrbanEvidenceArtifactsByContext(allArtifacts, contextId),
    [allArtifacts, contextId],
  );

  const kindCounts = useMemo(() => {
    const counts = new Map<UrbanEvidenceArtifactKind, number>();
    for (const artifact of contextArtifacts) {
      counts.set(artifact.kind, (counts.get(artifact.kind) ?? 0) + 1);
    }
    return counts;
  }, [contextArtifacts]);

  const availableKinds = useMemo(
    () => KIND_ORDER.filter((kind) => (kindCounts.get(kind) ?? 0) > 0),
    [kindCounts],
  );

  const filteredArtifacts = useMemo(
    () => kindFilter === 'all'
      ? contextArtifacts
      : contextArtifacts.filter((artifact) => artifact.kind === kindFilter),
    [contextArtifacts, kindFilter],
  );

  const publicationDisabledReasons = useMemo(
    () => buildPublicationDisabledReasonLookup(contextArtifacts, completedRuns, manifests),
    [completedRuns, contextArtifacts, manifests],
  );

  const completedRunLookup = useMemo(
    () => buildRunLookup(completedRuns),
    [completedRuns],
  );

  const selectedArtifact = useMemo(() => {
    if (selectedArtifactId) {
      const selected = contextArtifacts.find((artifact) => artifact.id === selectedArtifactId);
      if (selected) return selected;
    }
    return filteredArtifacts[0] ?? contextArtifacts[0] ?? null;
  }, [contextArtifacts, filteredArtifacts, selectedArtifactId]);

  const selectedLayerName = selectedArtifact
    ? layerNameById.get(primaryLayerId(selectedArtifact) ?? '') ?? null
    : null;
  const selectedRun = useMemo(() => {
    if (!selectedArtifact) return null;
    const runId = selectedArtifact.linkedRunId ?? selectedArtifact.provenance.runId ?? null;
    return runId ? completedRunLookup.get(runId) ?? null : null;
  }, [completedRunLookup, selectedArtifact]);

  const qaCounts = useMemo(() => {
    return contextArtifacts.reduce<Record<UrbanEvidenceQAState, number>>((acc, artifact) => {
      acc[artifact.qa.state] += 1;
      return acc;
    }, {
      unvalidated: 0,
      valid: 0,
      warning: 0,
      stale: 0,
      invalid: 0,
      blocked: 0,
    });
  }, [contextArtifacts]);

  const setStatus = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(''), 2800);
  }, []);

  const handleInspect = useCallback((artifact: UrbanEvidenceArtifact) => {
    setSelectedArtifactId(artifact.id);
    setExpanded(true);
    setStatus(`Inspecting ${artifact.title}`);
  }, [setStatus]);

  const handleOpenMap = useCallback((artifact: UrbanEvidenceArtifact) => {
    const layerId = primaryLayerId(artifact);
    if (!layerId) return;
    const mapStore = useMapExplorerStore.getState();
    mapStore.open();
    mapStore.setActiveAnalysisResultLayers([layerId]);
    synapseBus.emit('map.layer.focus', {
      layerId,
      layerTitle: artifact.title,
      artifactId: artifact.id,
      source: 'urban-analytics',
      requestedAt: busTimestamp(),
    });
    setStatus(`Map Explorer focused layer ${shortId(layerId)}.`);
  }, [setStatus]);

  const handleOpenIde = useCallback((artifact: UrbanEvidenceArtifact) => {
    const path = primaryFilePath(artifact);
    if (!path) return;
    synapseBus.emit('analytics.script.open', {
      path,
      artifactId: artifact.id,
      title: artifact.title,
      source: 'urban-analytics',
      requestedAt: busTimestamp(),
    });
    setStatus(`Requested IDE file ${shortId(path, 28)}.`);
  }, [setStatus]);

  const handleAddReport = useCallback((artifact: UrbanEvidenceArtifact) => {
    const flowState = useFlowStore.getState();
    const run = artifact.linkedRunId
      ? flowState.completedRuns.find((entry) => entry.runId === artifact.linkedRunId) ?? null
      : null;
    const manifest = artifact.linkedRunId ? flowState.lookupManifest(artifact.linkedRunId) : null;
    const result = enqueueUrbanReportEvidenceBlock({ artifact, run, manifest });
    window.dispatchEvent(new CustomEvent('synapse:navigate', { detail: { tab: 'Report' } }));
    setStatus(`Added structured report block ${shortId(result.block.reportInsertId)} for ${artifact.title}.`);
  }, [setStatus]);

  const handleBindDashboard = useCallback((artifact: UrbanEvidenceArtifact) => {
    const target = dashboardTarget(artifact);
    if (target) {
      if (!queuePendingDashboardBinding({ bindingId: target.bindingId, widgetType: target.widgetType })) {
        setStatus('Dashboard binding queue is unavailable; widget was not added.');
        return;
      }
      window.dispatchEvent(new CustomEvent('synapse:navigate', {
        detail: {
          tab: 'Dashboard',
          dashboardBindingId: target.bindingId,
          dashboardWidgetType: target.widgetType,
          dashboardRequestedAt: Date.now(),
        },
      }));
      setStatus(`Dashboard queued ${target.bindingLabel}.`);
      return;
    }

    const flowState = useFlowStore.getState();
    const run = artifact.linkedRunId
      ? flowState.completedRuns.find((entry) => entry.runId === artifact.linkedRunId) ?? null
      : null;
    const manifest = artifact.linkedRunId ? flowState.lookupManifest(artifact.linkedRunId) : null;
    try {
      const result = enqueueUrbanDashboardBinding({ artifact, run, manifest });
      const widgetType = result.binding.widgetType;
      const prefix = runtimeDashboardSafetyPrefix(result.binding.qa.limitations);
      window.dispatchEvent(new CustomEvent('synapse:navigate', {
        detail: {
          tab: 'Dashboard',
          dashboardBindingId: result.binding.bindingId,
          dashboardWidgetType: widgetType,
          dashboardRequestedAt: Date.now(),
        },
      }));
      setStatus(`${prefix}Queued static dashboard binding ${shortId(result.binding.bindingId)} for ${artifact.title}.`);
    } catch (error) {
      setStatus(formatDashboardBindingError(error));
    }
  }, [setStatus]);

  const handlePublishToMap = useCallback((artifact: UrbanEvidenceArtifact) => {
    if (artifact.kind !== 'workflow-run' || !artifact.linkedRunId) return;
    const flowState = useFlowStore.getState();
    const run = flowState.completedRuns.find((r) => r.runId === artifact.linkedRunId);
    if (!run) {
      setStatus(`Run ${artifact.linkedRunId} not found in the workflow store.`);
      return;
    }
    const result = publishUrbanRunOutputsToMap(run);
    if (!result.eligible) {
      setStatus(`Publication ineligible: ${result.reasons[0] ?? 'no eligible outputs.'}`);
      return;
    }

    const firstPublication = result.publications[0] ?? null;
    if (firstPublication) {
      const mapStore = useMapExplorerStore.getState();
      const publicationLayerIds = result.publications.map((publication) => publication.outputLayerReference.mapLayerId);
      mapStore.open();
      mapStore.setActiveAnalysisResultLayers(publicationLayerIds);

      const focusedLayer = mapStore.overlayLayers.find(
        (layer) => layer.id === firstPublication.outputLayerReference.mapLayerId,
      );
      const bounds = focusedLayer?.metadata?.bounds ?? null;
      if (bounds) {
        window.dispatchEvent(
          new CustomEvent('synapse:map:fitBounds', {
            detail: { bounds, layerId: firstPublication.outputLayerReference.mapLayerId },
          }),
        );
      }
    }

    const count = result.publications.length;
    setStatus(`Published ${count} layer${count === 1 ? '' : 's'} to Map Explorer from run ${shortId(run.runId)}.`);
  }, [setStatus]);

  const handleOpenRunCodeArtifact = useCallback(async (
    artifact: UrbanEvidenceArtifact,
    action: RunCodeArtifactAction,
  ) => {
    if (artifact.kind !== 'workflow-run' || !artifact.linkedRunId) {
      setStatus('Code artifact request unavailable: no completed run is associated with this evidence artifact.');
      return;
    }

    const flowState = useFlowStore.getState();
    const run = flowState.completedRuns.find((entry) => entry.runId === artifact.linkedRunId);
    if (!run) {
      setStatus(`Code artifact request unavailable: run ${artifact.linkedRunId} is not registered.`);
      return;
    }

    const seed = buildSeedFromCompletedRun(run, flowState.lookupManifest(run.runId));
    try {
      const actionResult = await (async () => {
        switch (action) {
          case 'manifest':
            return buildAndDispatchJsonManifest(seed);
          case 'method-note':
            return buildAndDispatchMarkdownMethodNote(seed);
          case 'adapter':
            return buildAndDispatchTypeScriptAdapter(seed);
          case 'python':
          default:
            return buildAndDispatchPythonScript(seed);
        }
      })();
      const label = (() => {
        switch (action) {
          case 'manifest':
            return 'JSON manifest';
          case 'method-note':
            return 'method note';
          case 'adapter':
            return 'adapter snippet';
          case 'python':
          default:
            return 'Python script';
        }
      })();
      setStatus(formatCodeArtifactStatus(label, actionResult));
    } catch (error) {
      setStatus(formatCodeArtifactError(error));
    }
  }, [setStatus]);

  const handleCopyManifest = useCallback(async (artifact: UrbanEvidenceArtifact) => {
    if (!navigator.clipboard) {
      setStatus('Clipboard is unavailable; manifest was not copied.');
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify(buildManifest(artifact), null, 2));
    setStatus(`Copied manifest for ${artifact.title}.`);
  }, [setStatus]);

  const handleExportReproduciblePackage = useCallback(() => {
    try {
      const result = buildAndDownloadUrbanReproduciblePackageJsonFromActiveContext();
      if (result.warnings.length > 0) {
        const firstWarning = result.warnings[0]?.message;
        setStatus(
          `Exported ${result.filename} (${result.bytes} bytes) with ${result.warnings.length} warning(s). ${firstWarning ?? ''}`.trim(),
        );
        return;
      }
      setStatus(`Exported ${result.filename} (${result.bytes} bytes).`);
    } catch (error) {
      setStatus(formatPackageExportError(error));
    }
  }, [setStatus]);

  const latestArtifact = contextArtifacts[0] ?? null;
  const warningCount = qaCounts.warning + qaCounts.stale + qaCounts.invalid + qaCounts.blocked;
  const latestLabel = latestArtifact
    ? latestArtifact.title
    : isRightRail
      ? 'No linked artifacts'
      : 'No artifacts linked to the current context.';

  return (
    <section
      className={`ua-evidence-tray ua-evidence-tray--${variant}${expanded ? ' is-expanded' : ' is-collapsed'}`}
      aria-label="Shared evidence tray"
    >
      <div className="ua-evidence-trayHeader">
        <button
          type="button"
          className="ua-evidence-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronUp aria-hidden="true" size={16} />}
          <span>Evidence</span>
        </button>
        <div className="ua-evidence-contextLine">
          {context ? (
            <>
              <EvidenceChip label={`${contextArtifacts.length} active`} tone={contextArtifacts.length ? 'ok' : 'muted'} />
              <EvidenceChip label={isRightRail ? `${allArtifacts.length}/200` : `Registry ${allArtifacts.length}/200`} tone="neutral" />
              {context.studyAreaId && !isRightRail ? <EvidenceChip label={`Study ${shortId(context.studyAreaId)}`} tone="neutral" /> : null}
              {context.activeRunId && !isRightRail ? <EvidenceChip label={`Run ${shortId(context.activeRunId)}`} tone="neutral" /> : null}
              {warningCount > 0 ? <EvidenceChip label={`${warningCount} QA flags`} tone="warning" /> : null}
            </>
          ) : (
            <>
              <EvidenceChip label={isRightRail ? 'No context' : 'No active context'} tone="warning" />
              <EvidenceChip label={isRightRail ? `${allArtifacts.length}/200` : `Registry ${allArtifacts.length}/200`} tone="neutral" />
            </>
          )}
        </div>
        <div className="ua-evidence-latest" title={latestLabel}>
          {latestArtifact ? <Archive aria-hidden="true" size={14} /> : <CircleAlert aria-hidden="true" size={14} />}
          <span>{latestLabel}</span>
        </div>
        <button
          type="button"
          className="ua-evidence-iconBtn"
          onClick={handleExportReproduciblePackage}
          title={context
            ? 'Export reproducible package JSON (manifest and references only)'
            : 'Export requires an active Urban Analysis Context'}
          aria-label={context
            ? 'Export reproducible package JSON'
            : 'Export requires an active Urban Analysis Context'}
          disabled={!context}
        >
          <Download aria-hidden="true" size={15} />
        </button>
        {!isRightRail ? (
          <button
            type="button"
            className="ua-evidence-iconBtn"
            onClick={() => setExpanded(false)}
            title="Collapse evidence tray"
            aria-label="Collapse evidence tray"
          >
            <X aria-hidden="true" size={15} />
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="ua-evidence-panel">
          {context && contextArtifacts.length > 0 ? (
            <div className="ua-evidence-toolbar" role="toolbar" aria-label="Evidence kind filters">
              <button
                type="button"
                className={`ua-evidence-filter${kindFilter === 'all' ? ' is-on' : ''}`}
                onClick={() => setKindFilter('all')}
                aria-pressed={kindFilter === 'all'}
                aria-label={`Show all evidence artifacts (${contextArtifacts.length})`}
              >
                All <span>{contextArtifacts.length}</span>
              </button>
              {availableKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={`ua-evidence-filter${kindFilter === kind ? ' is-on' : ''}`}
                  onClick={() => setKindFilter(kind)}
                  aria-pressed={kindFilter === kind}
                  aria-label={`Filter by ${KIND_LABELS[kind]} (${kindCounts.get(kind) ?? 0})`}
                >
                  <KindIcon kind={kind} size={13} />
                  {KIND_LABELS[kind]} <span>{kindCounts.get(kind) ?? 0}</span>
                </button>
              ))}
            </div>
          ) : null}

          {!context ? (
            <div className="ua-evidence-emptyState">
              <Layers3 aria-hidden="true" size={19} />
              <div>
                <strong>No active Urban Analysis Context</strong>
                <span>Create or restore a context before linking artifacts; global registry entries stay hidden here to avoid false provenance.</span>
              </div>
            </div>
          ) : null}

          {context && contextArtifacts.length === 0 ? (
            <div className="ua-evidence-emptyState">
              <ClipboardList aria-hidden="true" size={19} />
              <div>
                <strong>No linked evidence yet</strong>
                <span>Workflow runs, layer publications, code artifacts, report inserts, and dashboard bindings will appear here as reference-only artifacts.</span>
              </div>
            </div>
          ) : null}

          {context && contextArtifacts.length > 0 ? (
            <div className="ua-evidence-body">
              <div className="ua-evidence-table" role="table" aria-label="Active context evidence artifacts">
                <div className="ua-evidence-head" role="row">
                  <span role="columnheader">Artifact</span>
                  <span role="columnheader">Title and summary</span>
                  <span role="columnheader">References</span>
                  <span role="columnheader">QA</span>
                  <span role="columnheader">Updated</span>
                  <span role="columnheader">Actions</span>
                </div>
                <div role="rowgroup" className="ua-evidence-rows">
                  {filteredArtifacts.map((artifact) => {
                    const layerId = primaryLayerId(artifact);
                    return (
                      <ArtifactRow
                        key={artifact.id}
                        artifact={artifact}
                        selected={selectedArtifact?.id === artifact.id}
                        layerName={layerId ? layerNameById.get(layerId) ?? null : null}
                        onInspect={() => handleInspect(artifact)}
                        onOpenMap={() => handleOpenMap(artifact)}
                        onOpenIde={() => handleOpenIde(artifact)}
                        onAddReport={() => handleAddReport(artifact)}
                        onBindDashboard={() => handleBindDashboard(artifact)}
                        dashboardDisabledReason={dashboardDisabledReason(artifact, completedRunLookup)}
                        onPublishToMap={() => handlePublishToMap(artifact)}
                        publishDisabledReason={publicationDisabledReasons.get(artifact.id) ?? defaultPublishDisabledReason(artifact)}
                        codeArtifactDisabledReason={codeArtifactDisabledReason(artifact, completedRunLookup)}
                        onOpenPythonScript={() => void handleOpenRunCodeArtifact(artifact, 'python')}
                        onOpenJsonManifest={() => void handleOpenRunCodeArtifact(artifact, 'manifest')}
                        onOpenMethodNote={() => void handleOpenRunCodeArtifact(artifact, 'method-note')}
                        onOpenAdapterSnippet={() => void handleOpenRunCodeArtifact(artifact, 'adapter')}
                      />
                    );
                  })}
                </div>
              </div>

              <ArtifactInspector
                artifact={selectedArtifact}
                run={selectedRun}
                layerName={selectedLayerName}
                onCopyManifest={handleCopyManifest}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="ua-evidence-live" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
    </section>
  );
}

export default UrbanEvidenceTray;
