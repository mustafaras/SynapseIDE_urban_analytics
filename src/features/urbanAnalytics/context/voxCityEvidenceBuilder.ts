import type {
  Urban3DScenarioEvidenceMetadata,
  UrbanAnalysisContext,
  UrbanEvidenceArtifact,
  UrbanEvidenceQA,
  UrbanEvidenceScalar,
  UrbanEvidenceSourceModule,
  UrbanTag,
} from '../lib/types';
import type { UrbanEvidenceArtifactDraft } from './evidenceArtifacts';

export interface RegisterVoxCityScenarioEvidenceInput {
  scenarioArtifactId: string;
  mapReferenceArtifactId: string;
  title: string;
  summary: string;
  sourceModule?: UrbanEvidenceSourceModule;
  sourceId: string;
  flowId: UrbanEvidenceArtifact['flowId'];
  linkedRunId: string;
  linkedLayerId: string;
  linkedSourceLayerIds?: readonly string[];
  context: UrbanAnalysisContext | null;
  runtimeMode: 'real' | 'sample';
  metadata: Urban3DScenarioEvidenceMetadata;
  tags?: readonly UrbanTag[];
  registerEvidenceArtifact: (artifact: UrbanEvidenceArtifactDraft) => UrbanEvidenceArtifact;
}

export interface VoxCityScenarioEvidenceRegistrationResult {
  scenarioArtifactId: string;
  mapReferenceArtifactId: string;
}

function safeArtifactId(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'unknown';
}

function metadataToScalarMap(
  metadata: Urban3DScenarioEvidenceMetadata,
): Record<string, UrbanEvidenceScalar> {
  return {
    voxcity_model_reference: metadata.modelReference,
    voxcity_simulation_type: metadata.simulationType,
    voxcity_crs: metadata.spatialReference.crs,
    voxcity_bbox: metadata.spatialReference.bbox ? metadata.spatialReference.bbox.join(',') : null,
    voxcity_assumptions: metadata.assumptions.join(' | '),
    voxcity_uncertainty: metadata.uncertainty.join(' | '),
    voxcity_output_run_id: metadata.outputReferences.runId,
    voxcity_output_map_layer_id: metadata.outputReferences.mapLayerId,
    voxcity_output_data_refs: metadata.outputReferences.dataOutputIds.join(' | '),
    voxcity_output_chart_refs: metadata.outputReferences.chartOutputIds.join(' | '),
    voxcity_scenario_parameters: JSON.stringify(metadata.scenarioParameters),
  };
}

function qaForRuntimeMode(runtimeMode: 'real' | 'sample'): UrbanEvidenceQA {
  if (runtimeMode === 'sample') {
    return {
      state: 'warning',
      warnings: [
        'Sample/demo source is active. Do not treat this 3D output as production evidence without replacing the source with project data.',
      ],
      limitations: [
        'Derived from sample/demo geometry. Scenario outputs are suitable for exploration only until real project inputs are used.',
      ],
    };
  }

  return {
    state: 'valid',
    warnings: [],
    limitations: [],
  };
}

export function buildVoxCityScenarioArtifactIds(baseRunId: string, simulationType: Urban3DScenarioEvidenceMetadata['simulationType']): {
  scenarioArtifactId: string;
  mapReferenceArtifactId: string;
} {
  const runPart = safeArtifactId(baseRunId);
  const typePart = safeArtifactId(simulationType);
  return {
    scenarioArtifactId: `urban-voxcity-${typePart}-${runPart}`,
    mapReferenceArtifactId: `urban-voxcity-mapref-${typePart}-${runPart}`,
  };
}

export function registerVoxCityScenarioEvidence(
  input: RegisterVoxCityScenarioEvidenceInput,
): VoxCityScenarioEvidenceRegistrationResult {
  const linkedSourceLayerIds = input.linkedSourceLayerIds ?? [];
  const qa = qaForRuntimeMode(input.runtimeMode);
  const metadata = metadataToScalarMap(input.metadata);

  input.registerEvidenceArtifact({
    id: input.scenarioArtifactId,
    kind: 'workflow-run',
    title: input.title,
    summary: input.summary,
    state: 'active',
    sourceModule: input.sourceModule ?? 'urban-analytics',
    sourceId: input.sourceId,
    linkedContextId: input.context?.contextId,
    linkedStudyAreaId: input.context?.studyAreaId ?? undefined,
    linkedRunId: input.linkedRunId,
    linkedLayerIds: [input.linkedLayerId, ...linkedSourceLayerIds],
    linkedArtifactIds: [input.mapReferenceArtifactId],
    flowId: input.flowId,
    tags: (input.tags as UrbanTag[] | undefined) ?? ['voxcity', '3d_modeling', 'scenario'],
    qa,
    metadata,
    provenance: {
      sourceModule: input.sourceModule ?? 'urban-analytics',
      sourceId: input.sourceId,
      sourceTitle: input.title,
      contextId: input.context?.contextId,
      runId: input.linkedRunId,
      flowId: input.flowId,
      layerIds: [input.linkedLayerId, ...linkedSourceLayerIds],
      inputArtifactIds: [input.mapReferenceArtifactId],
      parentArtifactIds: [],
      notes: `VoxCity ${input.metadata.simulationType} scenario evidence record with explicit model/spatial/simulation metadata.`,
    },
  });

  input.registerEvidenceArtifact({
    id: input.mapReferenceArtifactId,
    kind: 'map-layer',
    title: `${input.title} · 2D map reference`,
    summary: '2D map layer reference linked to the corresponding 3D scenario evidence artifact.',
    state: 'active',
    sourceModule: input.sourceModule ?? 'urban-analytics',
    sourceId: input.linkedLayerId,
    linkedContextId: input.context?.contextId,
    linkedStudyAreaId: input.context?.studyAreaId ?? undefined,
    linkedRunId: input.linkedRunId,
    linkedLayerIds: [input.linkedLayerId],
    linkedArtifactIds: [input.scenarioArtifactId],
    mapLayerId: input.linkedLayerId,
    flowId: input.flowId,
    tags: ['voxcity', 'map-layer', '3d_modeling'],
    qa,
    metadata: {
      voxcity_model_reference: input.metadata.modelReference,
      voxcity_simulation_type: input.metadata.simulationType,
      voxcity_linked_scenario_artifact_id: input.scenarioArtifactId,
    },
    provenance: {
      sourceModule: input.sourceModule ?? 'urban-analytics',
      sourceId: input.linkedLayerId,
      sourceTitle: `${input.title} · map reference`,
      contextId: input.context?.contextId,
      runId: input.linkedRunId,
      flowId: input.flowId,
      layerIds: [input.linkedLayerId],
      inputArtifactIds: [input.scenarioArtifactId],
      parentArtifactIds: [input.scenarioArtifactId],
      notes: 'Map-layer reference linked to VoxCity 3D scenario evidence by artifact id.',
    },
  });

  return {
    scenarioArtifactId: input.scenarioArtifactId,
    mapReferenceArtifactId: input.mapReferenceArtifactId,
  };
}