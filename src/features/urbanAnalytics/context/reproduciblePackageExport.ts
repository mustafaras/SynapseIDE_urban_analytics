import { useFlowStore } from '@/stores/useFlowStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

import type {
  UrbanAnalysisContext,
  UrbanEvidenceArtifact,
  UrbanReproducibleCodeArtifactReference,
  UrbanReproducibleDashboardBindingReference,
  UrbanReproducibleDataReference,
  UrbanReproducibleEnvironmentNotes,
  UrbanReproducibleMapLayerReference,
  UrbanReproduciblePackage,
  UrbanReproduciblePackageWarning,
  UrbanReproduciblePackageWarningCode,
  UrbanReproducibleReportBindingReference,
  UrbanWorkflowRunManifest,
} from '../lib/types';
import { selectUrbanEvidenceArtifactsByContext } from './evidenceArtifacts';
import { useUrbanContextStore } from '../useUrbanContextStore';

const MAX_REFERENCES = 512;

export interface BuildUrbanReproduciblePackageInput {
  context: UrbanAnalysisContext;
  runManifests: UrbanWorkflowRunManifest[];
  evidenceArtifacts: UrbanEvidenceArtifact[];
  expectedRunIds?: Iterable<string>;
  knownMapLayerIds?: Iterable<string>;
  createdAt?: string;
  userAgent?: string | null;
}

export interface BuildUrbanReproduciblePackageResult {
  packageManifest: UrbanReproduciblePackage;
  warnings: UrbanReproduciblePackageWarning[];
}

export interface BuildUrbanReproduciblePackageFromActiveContextResult {
  ok: boolean;
  packageManifest: UrbanReproduciblePackage | null;
  warnings: UrbanReproduciblePackageWarning[];
  reason: string | null;
}

export interface DownloadUrbanReproduciblePackageJsonResult {
  filename: string;
  bytes: number;
}

export interface BuildAndDownloadUrbanReproduciblePackageJsonResult {
  packageManifest: UrbanReproduciblePackage;
  warnings: UrbanReproduciblePackageWarning[];
  filename: string;
  bytes: number;
}

interface BuildAndDownloadUrbanReproduciblePackageJsonOptions {
  createdAt?: string;
  filename?: string;
}

function now(): string {
  return new Date().toISOString();
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function uniqueStrings(values: Iterable<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function runtimeModes(manifests: readonly UrbanWorkflowRunManifest[]): UrbanReproducibleEnvironmentNotes['runtimeModes'] {
  const values = uniqueStrings(manifests.map((manifest) => manifest.runtimeMode));
  return values as UrbanReproducibleEnvironmentNotes['runtimeModes'];
}

function pushUniqueReference<T extends { referenceId: string }>(
  target: T[],
  seen: Set<string>,
  value: T,
): void {
  if (seen.has(value.referenceId)) return;
  seen.add(value.referenceId);
  target.push(value);
}

function pushWarning(
  warnings: UrbanReproduciblePackageWarning[],
  seen: Set<string>,
  warning: UrbanReproduciblePackageWarning,
): void {
  const key = `${warning.code}:${warning.referenceId ?? ''}:${warning.message}`;
  if (seen.has(key)) return;
  seen.add(key);
  warnings.push(warning);
}

function warning(
  code: UrbanReproduciblePackageWarningCode,
  message: string,
  options: { severity?: 'warning' | 'error'; referenceId?: string } = {},
): UrbanReproduciblePackageWarning {
  return {
    code,
    severity: options.severity ?? 'warning',
    message,
    ...(options.referenceId ? { referenceId: options.referenceId } : {}),
  };
}

function collectDataReferences(
  context: UrbanAnalysisContext,
  artifacts: readonly UrbanEvidenceArtifact[],
  manifests: readonly UrbanWorkflowRunManifest[],
): UrbanReproducibleDataReference[] {
  const refs: UrbanReproducibleDataReference[] = [];
  const seen = new Set<string>();

  for (const layerId of context.activeLayerIds) {
    pushUniqueReference(refs, seen, {
      referenceId: `ctx-layer:${layerId}`,
      source: 'context',
      layerId,
      description: `Active context layer reference ${layerId}.`,
    });
  }

  for (const artifact of artifacts) {
    const layerIds = uniqueStrings([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
    for (const layerId of layerIds) {
      pushUniqueReference(refs, seen, {
        referenceId: `artifact-layer:${artifact.id}:${layerId}`,
        source: 'evidence-artifact',
        artifactId: artifact.id,
        ...(artifact.linkedRunId ? { runId: artifact.linkedRunId } : {}),
        layerId,
        description: `Layer reference from evidence artifact ${artifact.id}.`,
      });
    }

    const filePaths = uniqueStrings([...artifact.linkedFilePaths, ...artifact.provenance.filePaths]);
    for (const filePath of filePaths) {
      pushUniqueReference(refs, seen, {
        referenceId: `artifact-file:${artifact.id}:${filePath}`,
        source: 'evidence-artifact',
        artifactId: artifact.id,
        ...(artifact.linkedRunId ? { runId: artifact.linkedRunId } : {}),
        filePath,
        description: `File reference from evidence artifact ${artifact.id}.`,
      });
    }
  }

  for (const manifest of manifests) {
    for (const key of Object.keys(manifest.inputs)) {
      pushUniqueReference(refs, seen, {
        referenceId: `manifest-input:${manifest.runId}:${key}`,
        source: 'run-manifest',
        runId: manifest.runId,
        key,
        description: `Run manifest input key ${key}.`,
      });
    }
  }

  return refs.slice(0, MAX_REFERENCES);
}

function collectMapLayerReferences(
  context: UrbanAnalysisContext,
  artifacts: readonly UrbanEvidenceArtifact[],
  manifests: readonly UrbanWorkflowRunManifest[],
  knownMapLayerIds: Set<string> | null,
): UrbanReproducibleMapLayerReference[] {
  const refs: UrbanReproducibleMapLayerReference[] = [];
  const seen = new Set<string>();

  const mapPresence = (layerId: string | undefined): boolean | null => {
    if (!layerId) return null;
    if (!knownMapLayerIds) return null;
    return knownMapLayerIds.has(layerId);
  };

  for (const layerId of context.activeLayerIds) {
    pushUniqueReference(refs, seen, {
      referenceId: `ctx-map-layer:${layerId}`,
      source: 'context',
      layerId,
      presentInMapExplorer: mapPresence(layerId),
    });
  }

  for (const artifact of artifacts) {
    const layerIds = uniqueStrings([
      artifact.mapLayerId,
      ...artifact.linkedLayerIds,
      ...artifact.provenance.layerIds,
    ]);

    for (const layerId of layerIds) {
      pushUniqueReference(refs, seen, {
        referenceId: `artifact-map-layer:${artifact.id}:${layerId}`,
        source: 'evidence-artifact',
        artifactId: artifact.id,
        ...(artifact.linkedRunId ? { runId: artifact.linkedRunId } : {}),
        layerId,
        presentInMapExplorer: mapPresence(layerId),
      });
    }
  }

  for (const manifest of manifests) {
    for (const mapArtifactId of manifest.mapArtifactIds) {
      pushUniqueReference(refs, seen, {
        referenceId: `manifest-map-artifact:${manifest.runId}:${mapArtifactId}`,
        source: 'run-manifest',
        runId: manifest.runId,
        mapArtifactId,
        presentInMapExplorer: null,
      });
    }
  }

  return refs.slice(0, MAX_REFERENCES);
}

function collectCodeArtifactReferences(
  artifacts: readonly UrbanEvidenceArtifact[],
  manifests: readonly UrbanWorkflowRunManifest[],
): UrbanReproducibleCodeArtifactReference[] {
  const refs: UrbanReproducibleCodeArtifactReference[] = [];
  const seen = new Set<string>();

  for (const artifact of artifacts) {
    const codeArtifactId = artifact.codeArtifactId
      ?? (artifact.kind === 'code-artifact' ? (artifact.sourceId ?? artifact.id) : null);
    if (!codeArtifactId) continue;
    const primaryPath = artifact.linkedFilePaths[0] ?? artifact.provenance.filePaths[0] ?? undefined;
    pushUniqueReference(refs, seen, {
      referenceId: `artifact-code:${artifact.id}:${codeArtifactId}`,
      source: 'evidence-artifact',
      codeArtifactId,
      artifactId: artifact.id,
      ...(artifact.linkedRunId ? { runId: artifact.linkedRunId } : {}),
      ...(primaryPath ? { filePath: primaryPath } : {}),
    });
  }

  for (const manifest of manifests) {
    for (const codeArtifactId of manifest.codeArtifactIds) {
      pushUniqueReference(refs, seen, {
        referenceId: `manifest-code:${manifest.runId}:${codeArtifactId}`,
        source: 'run-manifest',
        codeArtifactId,
        runId: manifest.runId,
      });
    }
  }

  return refs.slice(0, MAX_REFERENCES);
}

function collectReportBindings(
  artifacts: readonly UrbanEvidenceArtifact[],
  manifests: readonly UrbanWorkflowRunManifest[],
): UrbanReproducibleReportBindingReference[] {
  const refs: UrbanReproducibleReportBindingReference[] = [];
  const seen = new Set<string>();

  for (const artifact of artifacts) {
    if (!artifact.reportInsertId) continue;
    pushUniqueReference(refs, seen, {
      referenceId: `artifact-report:${artifact.id}:${artifact.reportInsertId}`,
      source: 'evidence-artifact',
      reportInsertId: artifact.reportInsertId,
      artifactId: artifact.id,
      ...(artifact.linkedRunId ? { runId: artifact.linkedRunId } : {}),
    });
  }

  for (const manifest of manifests) {
    for (const reportInsertId of manifest.reportInsertIds) {
      pushUniqueReference(refs, seen, {
        referenceId: `manifest-report:${manifest.runId}:${reportInsertId}`,
        source: 'run-manifest',
        reportInsertId,
        runId: manifest.runId,
      });
    }
  }

  return refs.slice(0, MAX_REFERENCES);
}

function collectDashboardBindings(
  artifacts: readonly UrbanEvidenceArtifact[],
  manifests: readonly UrbanWorkflowRunManifest[],
): UrbanReproducibleDashboardBindingReference[] {
  const refs: UrbanReproducibleDashboardBindingReference[] = [];
  const seen = new Set<string>();

  for (const artifact of artifacts) {
    if (!artifact.dashboardBindingId) continue;
    pushUniqueReference(refs, seen, {
      referenceId: `artifact-dashboard:${artifact.id}:${artifact.dashboardBindingId}`,
      source: 'evidence-artifact',
      dashboardBindingId: artifact.dashboardBindingId,
      artifactId: artifact.id,
      ...(artifact.linkedRunId ? { runId: artifact.linkedRunId } : {}),
    });
  }

  for (const manifest of manifests) {
    for (const dashboardBindingId of manifest.dashboardBindingIds) {
      pushUniqueReference(refs, seen, {
        referenceId: `manifest-dashboard:${manifest.runId}:${dashboardBindingId}`,
        source: 'run-manifest',
        dashboardBindingId,
        runId: manifest.runId,
      });
    }
  }

  return refs.slice(0, MAX_REFERENCES);
}

function packageIdFor(contextId: string, createdAt: string): string {
  return `urban-repro-${stableHash(`${contextId}:${createdAt}`)}`;
}

function limitationsFor(manifests: readonly UrbanWorkflowRunManifest[]): string[] {
  const notes = [
    'Manifest-only export: raw datasets, geometry payloads, rasters, voxels, meshes, and binaries are intentionally excluded.',
    'Run outputs are represented by references and metadata snapshots, not by embedded map/chart/data payloads.',
    'Reference validation is performed against current in-browser state; unresolved IDs are preserved as warnings for follow-up.',
  ];

  if (manifests.length === 0) {
    notes.push('No workflow run manifest was available for this context at export time.');
  }

  const nonLiveModes = uniqueStrings(
    manifests
      .map((manifest) => manifest.runtimeMode)
      .filter((runtimeMode) => runtimeMode !== 'live')
      .map((runtimeMode) => `Runtime mode ${runtimeMode} is present; treat downstream interpretation with corresponding caveats.`),
  );
  notes.push(...nonLiveModes);

  return notes;
}

function environmentNotesFor(
  manifests: readonly UrbanWorkflowRunManifest[],
  artifacts: readonly UrbanEvidenceArtifact[],
  userAgent: string | null,
  mapLayerRegistryCount: number | null,
): UrbanReproducibleEnvironmentNotes {
  return {
    exportMode: 'manifest_only',
    exportedBy: 'urban-analytics',
    userAgent,
    runtimeModes: runtimeModes(manifests),
    manifestCount: manifests.length,
    evidenceCount: artifacts.length,
    mapLayerRegistryCount,
  };
}

function validateReferences(input: {
  context: UrbanAnalysisContext;
  manifests: readonly UrbanWorkflowRunManifest[];
  expectedRunIds: readonly string[];
  mapRefs: readonly UrbanReproducibleMapLayerReference[];
  codeRefs: readonly UrbanReproducibleCodeArtifactReference[];
  reportRefs: readonly UrbanReproducibleReportBindingReference[];
  dashboardRefs: readonly UrbanReproducibleDashboardBindingReference[];
  artifacts: readonly UrbanEvidenceArtifact[];
}): UrbanReproduciblePackageWarning[] {
  const warnings: UrbanReproduciblePackageWarning[] = [];
  const warningKeys = new Set<string>();

  const manifestByRun = new Map(input.manifests.map((manifest) => [manifest.runId, manifest]));
  const knownArtifactIds = new Set(
    input.artifacts.flatMap((artifact) => [artifact.id, artifact.artifactId]),
  );

  const codeIdsFromEvidence = new Set(
    input.codeRefs
      .filter((ref) => ref.source === 'evidence-artifact')
      .map((ref) => ref.codeArtifactId),
  );
  const reportIdsFromEvidence = new Set(
    input.reportRefs
      .filter((ref) => ref.source === 'evidence-artifact')
      .map((ref) => ref.reportInsertId),
  );
  const dashboardIdsFromEvidence = new Set(
    input.dashboardRefs
      .filter((ref) => ref.source === 'evidence-artifact')
      .map((ref) => ref.dashboardBindingId),
  );

  if (!input.context.studyAreaId) {
    pushWarning(
      warnings,
      warningKeys,
      warning(
        'missing_study_area_reference',
        'Active context does not include a studyAreaId; reproducibility package keeps the context but flags the missing project reference.',
      ),
    );
  }

  for (const runId of input.expectedRunIds) {
    if (!manifestByRun.has(runId)) {
      pushWarning(
        warnings,
        warningKeys,
        warning(
          'missing_run_manifest',
          `Run ${runId} is referenced by the active context/evidence but no run manifest is available.`,
          { referenceId: runId },
        ),
      );
    }
  }

  if (input.context.activeRunId && !manifestByRun.has(input.context.activeRunId)) {
    pushWarning(
      warnings,
      warningKeys,
      warning(
        'missing_active_run_reference',
        `Active run ${input.context.activeRunId} has no corresponding run manifest in the export package.`,
        { referenceId: input.context.activeRunId },
      ),
    );
  }

  const codeRefIds = new Set(input.codeRefs.map((ref) => ref.codeArtifactId));
  if (input.context.activeCodeArtifactId && !codeRefIds.has(input.context.activeCodeArtifactId)) {
    pushWarning(
      warnings,
      warningKeys,
      warning(
        'missing_active_code_artifact_reference',
        `Active code artifact ${input.context.activeCodeArtifactId} is not linked by evidence or run-manifest references.`,
        { referenceId: input.context.activeCodeArtifactId },
      ),
    );
  }

  for (const manifest of input.manifests) {
    for (const mapArtifactId of manifest.mapArtifactIds) {
      if (!knownArtifactIds.has(mapArtifactId)) {
        pushWarning(
          warnings,
          warningKeys,
          warning(
            'missing_map_layer_reference',
            `Run ${manifest.runId} references map artifact ${mapArtifactId}, but no matching evidence artifact exists in this context export.`,
            { referenceId: mapArtifactId },
          ),
        );
      }
    }

    for (const codeArtifactId of manifest.codeArtifactIds) {
      if (!codeIdsFromEvidence.has(codeArtifactId)) {
        pushWarning(
          warnings,
          warningKeys,
          warning(
            'missing_code_artifact_reference',
            `Run ${manifest.runId} references code artifact ${codeArtifactId}, but no code evidence artifact links this ID.`,
            { referenceId: codeArtifactId },
          ),
        );
      }
    }

    for (const reportInsertId of manifest.reportInsertIds) {
      if (!reportIdsFromEvidence.has(reportInsertId)) {
        pushWarning(
          warnings,
          warningKeys,
          warning(
            'missing_report_binding_reference',
            `Run ${manifest.runId} references report insert ${reportInsertId}, but no report evidence artifact links this ID.`,
            { referenceId: reportInsertId },
          ),
        );
      }
    }

    for (const dashboardBindingId of manifest.dashboardBindingIds) {
      if (!dashboardIdsFromEvidence.has(dashboardBindingId)) {
        pushWarning(
          warnings,
          warningKeys,
          warning(
            'missing_dashboard_binding_reference',
            `Run ${manifest.runId} references dashboard binding ${dashboardBindingId}, but no dashboard evidence artifact links this ID.`,
            { referenceId: dashboardBindingId },
          ),
        );
      }
    }
  }

  for (const mapRef of input.mapRefs) {
    if (mapRef.layerId && mapRef.presentInMapExplorer === false) {
      pushWarning(
        warnings,
        warningKeys,
        warning(
          'missing_map_layer_reference',
          `Map layer ${mapRef.layerId} is referenced by the reproducibility package but is missing from the current Map Explorer layer registry.`,
          { referenceId: mapRef.layerId },
        ),
      );
    }
  }

  return warnings;
}

export function buildUrbanReproduciblePackage(
  input: BuildUrbanReproduciblePackageInput,
): BuildUrbanReproduciblePackageResult {
  const createdAt = input.createdAt ?? now();
  const knownMapLayerIds = input.knownMapLayerIds
    ? new Set(uniqueStrings(input.knownMapLayerIds))
    : null;

  const manifests = [...input.runManifests].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const artifacts = [...input.evidenceArtifacts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const expectedRunIds = uniqueStrings(input.expectedRunIds ?? []);

  const dataReferences = collectDataReferences(input.context, artifacts, manifests);
  const mapLayerReferences = collectMapLayerReferences(input.context, artifacts, manifests, knownMapLayerIds);
  const codeArtifactReferences = collectCodeArtifactReferences(artifacts, manifests);
  const reportBindings = collectReportBindings(artifacts, manifests);
  const dashboardBindings = collectDashboardBindings(artifacts, manifests);

  const warnings = validateReferences({
    context: input.context,
    manifests,
    expectedRunIds,
    mapRefs: mapLayerReferences,
    codeRefs: codeArtifactReferences,
    reportRefs: reportBindings,
    dashboardRefs: dashboardBindings,
    artifacts,
  });

  const packageManifest: UrbanReproduciblePackage = {
    packageId: packageIdFor(input.context.contextId, createdAt),
    context: input.context,
    runManifests: manifests,
    evidenceArtifacts: artifacts,
    dataReferences,
    mapLayerReferences,
    codeArtifactReferences,
    reportBindings,
    dashboardBindings,
    environmentNotes: environmentNotesFor(
      manifests,
      artifacts,
      input.userAgent ?? null,
      knownMapLayerIds ? knownMapLayerIds.size : null,
    ),
    limitations: limitationsFor(manifests),
    validationWarnings: warnings,
    createdAt,
  };

  return {
    packageManifest,
    warnings,
  };
}

export function buildUrbanReproduciblePackageFromActiveContext(
  options: { createdAt?: string } = {},
): BuildUrbanReproduciblePackageFromActiveContextResult {
  const urbanState = useUrbanContextStore.getState();
  const context = urbanState.context;

  if (!context) {
    const missingContextWarning = warning(
      'missing_active_context',
      'Urban reproducibility export requires an active context, but no context is currently selected.',
      { severity: 'error' },
    );
    return {
      ok: false,
      packageManifest: null,
      warnings: [missingContextWarning],
      reason: missingContextWarning.message,
    };
  }

  const artifacts = selectUrbanEvidenceArtifactsByContext(
    urbanState.evidenceArtifacts,
    context.contextId,
  );

  const flowState = useFlowStore.getState();
  const expectedRunIdSet = new Set<string>();

  if (context.activeRunId) expectedRunIdSet.add(context.activeRunId);

  for (const artifact of artifacts) {
    const runId = artifact.linkedRunId ?? artifact.provenance.runId ?? null;
    if (runId) expectedRunIdSet.add(runId);
  }

  for (const manifest of Object.values(flowState.manifests)) {
    if (manifest.contextId === context.contextId) {
      expectedRunIdSet.add(manifest.runId);
    }
  }

  const expectedRunIds = uniqueStrings(expectedRunIdSet.values());
  const manifests: UrbanWorkflowRunManifest[] = [];
  for (const runId of expectedRunIds) {
    const manifest = flowState.lookupManifest(runId);
    if (manifest) manifests.push(manifest);
  }

  const knownMapLayerIds = useMapExplorerStore
    .getState()
    .overlayLayers
    .map((layer) => layer.id);

  const result = buildUrbanReproduciblePackage({
    context,
    runManifests: manifests,
    evidenceArtifacts: artifacts,
    expectedRunIds,
    knownMapLayerIds,
    createdAt: options.createdAt,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  return {
    ok: true,
    packageManifest: result.packageManifest,
    warnings: result.warnings,
    reason: null,
  };
}

function safeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return slug || 'context';
}

function timestampStamp(iso: string): string {
  return iso
    .replace(/\..+$/, '')
    .replace(/[-:]/g, '')
    .replace('T', '_');
}

export function defaultUrbanReproduciblePackageFilename(
  packageManifest: UrbanReproduciblePackage,
): string {
  const contextSlug = safeSlug(
    packageManifest.context.studyAreaName
      ?? packageManifest.context.studyAreaId
      ?? packageManifest.context.contextId,
  );
  const stamp = timestampStamp(packageManifest.createdAt);
  return `urban_reproducible_package_${contextSlug}_${stamp}.json`;
}

export function downloadUrbanReproduciblePackageJson(
  packageManifest: UrbanReproduciblePackage,
  options: { filename?: string } = {},
): DownloadUrbanReproduciblePackageJsonResult {
  if (
    typeof document === 'undefined'
    || typeof Blob === 'undefined'
    || typeof URL === 'undefined'
    || typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error('JSON export requires a browser document environment with Blob and URL support.');
  }

  const filename = options.filename ?? defaultUrbanReproduciblePackageFilename(packageManifest);
  const payload = `${JSON.stringify(packageManifest, null, 2)}\n`;
  const bytes = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(payload).length
    : payload.length * 2;

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return { filename, bytes };
}

export function buildAndDownloadUrbanReproduciblePackageJsonFromActiveContext(
  options: BuildAndDownloadUrbanReproduciblePackageJsonOptions = {},
): BuildAndDownloadUrbanReproduciblePackageJsonResult {
  const built = buildUrbanReproduciblePackageFromActiveContext({
    createdAt: options.createdAt,
  });
  if (!built.ok || !built.packageManifest) {
    throw new Error(built.reason ?? 'Unable to build an Urban reproducible package from the active context.');
  }

  const download = downloadUrbanReproduciblePackageJson(built.packageManifest, {
    filename: options.filename,
  });

  return {
    packageManifest: built.packageManifest,
    warnings: built.warnings,
    filename: download.filename,
    bytes: download.bytes,
  };
}
