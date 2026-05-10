import { FLOW_LIBRARY_ITEMS } from '@/centerpanel/Flows/flowLibraryMeta';
import { LEARNING_PATHS } from '@/features/education/learningPaths';
import { getMethodologyExplainer } from '@/features/education/methodologyData';
import { openEducationWorkspace } from '@/features/education/navigation';
import { useUrbanContextStore } from '../useUrbanContextStore';
import type {
  AnalyticalFlowId,
  Card,
  UrbanLearningPathIntermediateValueReference,
  UrbanLearningPathReference,
  UrbanLearningPathReferenceInput,
  UrbanLearningPathStepReference,
} from '../lib/types';

export interface ResolveUrbanLearningPathInput {
  card: Card;
  flowId?: AnalyticalFlowId | null;
  linkedArtifactIds?: readonly string[];
}

export interface ResolvedUrbanLearningPath {
  reference: UrbanLearningPathReference;
  pathTitle: string | null;
  explainerTitle: string | null;
}

export interface OpenUrbanLearningPathResult extends ResolvedUrbanLearningPath {
  artifactId: string;
  opened: true;
}

const MAX_LIST_ITEMS = 6;

function compactText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function humanize(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: Iterable<string>, maxItems = MAX_LIST_ITEMS): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = compactText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
    if (output.length >= maxItems) break;
  }
  return output;
}

function safeIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized.slice(0, 48) || 'unknown';
}

function methodologyBullets(methodology: string | undefined): string[] {
  if (!methodology) return [];
  return methodology
    .split(/\n+/)
    .map((line) => compactText(line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')))
    .filter(Boolean);
}

function flowLearningPath(flowId: AnalyticalFlowId | null | undefined): UrbanLearningPathReferenceInput | null {
  if (!flowId) return null;
  return FLOW_LIBRARY_ITEMS.find((item) => item.flowId === flowId)?.learningPath ?? null;
}

function derivedPrerequisites(card: Card): string[] {
  const envelope = card.validityEnvelope;
  if (!envelope) {
    return [];
  }

  const prerequisites: string[] = [];
  if (envelope.requiredFields.length > 0) {
    prerequisites.push(`Required fields: ${envelope.requiredFields.join(', ')}`);
  }
  if (envelope.requiredGeometryTypes && envelope.requiredGeometryTypes.length > 0) {
    prerequisites.push(`Geometry: ${envelope.requiredGeometryTypes.join(', ')}`);
  }
  if (envelope.requiresProjectedCrs) {
    prerequisites.push('Projected CRS is required for defensible spatial measurement.');
  }
  if (envelope.minimumFeatureCount != null) {
    prerequisites.push(`At least ${envelope.minimumFeatureCount.toLocaleString()} features are expected for stable use.`);
  }
  return prerequisites;
}

function derivedIntermediateValues(card: Card): UrbanLearningPathIntermediateValueReference[] {
  return methodologyBullets(card.methodology)
    .slice(0, 3)
    .map((bullet, index) => ({
      label: `Intermediate value ${index + 1}`,
      description: bullet,
      source: 'methodology' as const,
    }));
}

function derivedTeachingSteps(card: Card): UrbanLearningPathStepReference[] {
  const steps: UrbanLearningPathStepReference[] = [];
  const assumptions = card.validityEnvelope?.assumptions ?? [];
  const limitationNotes = card.limitations
    ? card.limitations.split(/(?<=\.)\s+/).map(compactText).filter(Boolean)
    : [];
  const interpretationWarnings = card.validityEnvelope?.interpretationWarnings ?? [];

  assumptions.slice(0, 2).forEach((assumption, index) => {
    steps.push({
      id: `assumption-${index + 1}`,
      title: `Check assumption ${index + 1}`,
      source: 'assumption',
      note: assumption,
    });
  });

  limitationNotes.slice(0, 2).forEach((limitation, index) => {
    steps.push({
      id: `limitation-${index + 1}`,
      title: `Interpret limitation ${index + 1}`,
      source: 'limitation',
      note: limitation,
    });
  });

  interpretationWarnings.slice(0, 2).forEach((warning, index) => {
    steps.push({
      id: `interpretation-${index + 1}`,
      title: `Pause before interpretation ${index + 1}`,
      source: 'interpretation',
      note: warning,
    });
  });

  return steps;
}

export function resolveUrbanLearningPath(input: ResolveUrbanLearningPathInput): ResolvedUrbanLearningPath | null {
  const cardReference = input.card.learningPath ?? null;
  const flowReference = flowLearningPath(input.flowId ?? null);
  const source = cardReference ?? flowReference;
  if (!source) {
    return null;
  }

  const pathId = source.pathId ?? flowReference?.pathId;
  const explainerId = source.explainerId ?? flowReference?.explainerId;
  if (!pathId && !explainerId) {
    return null;
  }

  const concepts = unique([
    ...source.concepts,
    ...input.card.tags.slice(0, 3).map(humanize),
  ]);
  const prerequisites = unique([
    ...source.prerequisites,
    ...derivedPrerequisites(input.card),
  ]);
  const intermediateValues = source.intermediateValues.length > 0
    ? source.intermediateValues.slice(0, MAX_LIST_ITEMS)
    : derivedIntermediateValues(input.card);
  const interpretationPrompts = unique([
    ...source.interpretationPrompts,
    ...(input.card.validityEnvelope?.interpretationWarnings ?? []),
  ]);
  const teachingSteps = source.teachingSteps && source.teachingSteps.length > 0
    ? source.teachingSteps.slice(0, MAX_LIST_ITEMS)
    : derivedTeachingSteps(input.card);

  const reference: UrbanLearningPathReference = {
    methodId: source.methodId || input.card.id,
    workflowId: source.workflowId ?? input.flowId ?? flowReference?.workflowId,
    ...(pathId ? { pathId } : {}),
    ...(explainerId ? { explainerId } : {}),
    concepts,
    prerequisites,
    intermediateValues,
    evidenceArtifactIds: unique(input.linkedArtifactIds ?? [], 16),
    interpretationPrompts,
    teachingSteps,
  };

  const pathTitle = pathId ? LEARNING_PATHS.find((path) => path.id === pathId)?.title ?? null : null;
  const explainerTitle = explainerId ? getMethodologyExplainer(explainerId)?.title ?? null : null;

  return {
    reference,
    pathTitle,
    explainerTitle,
  };
}

function educationArtifactId(reference: UrbanLearningPathReference): string {
  return [
    'urban-education-link',
    safeIdPart(reference.methodId),
    safeIdPart(reference.workflowId ?? 'no-flow'),
    safeIdPart(reference.pathId ?? 'no-path'),
    safeIdPart(reference.explainerId ?? 'no-explainer'),
  ].join('-');
}

export function openUrbanLearningPath(input: ResolveUrbanLearningPathInput): OpenUrbanLearningPathResult | null {
  const resolved = resolveUrbanLearningPath(input);
  if (!resolved) {
    return null;
  }

  openEducationWorkspace({
    view: 'paths',
    ...(resolved.reference.pathId ? { pathId: resolved.reference.pathId } : {}),
    ...(resolved.reference.explainerId ? { explainerId: resolved.reference.explainerId } : {}),
  });

  const store = useUrbanContextStore.getState();
  const context = store.context;
  const artifactId = educationArtifactId(resolved.reference);

  store.registerEvidenceArtifact({
    id: artifactId,
    kind: 'education-link',
    title: resolved.pathTitle ? `Learning path · ${resolved.pathTitle}` : `Learning path · ${input.card.title}`,
    summary: `Education handoff for ${input.card.title} linking method assumptions, limitations, intermediate values, and interpretation prompts into the learning workspace.`,
    state: 'active',
    sourceModule: 'urban-analytics',
    sourceId: resolved.reference.explainerId ?? resolved.reference.pathId ?? resolved.reference.methodId,
    linkedContextId: context?.contextId,
    linkedStudyAreaId: context?.studyAreaId,
    linkedRunId: context?.activeRunId,
    linkedArtifactIds: resolved.reference.evidenceArtifactIds,
    cardId: input.card.id,
    flowId: resolved.reference.workflowId,
    educationLinkId: artifactId,
    provenance: {
      sourceModule: 'urban-analytics',
      sourceId: resolved.reference.explainerId ?? resolved.reference.pathId ?? resolved.reference.methodId,
      contextId: context?.contextId,
      runId: context?.activeRunId,
      flowId: resolved.reference.workflowId,
      methodId: input.card.id,
      methodName: input.card.title,
      notes: resolved.explainerTitle
        ? `Education workspace opened for ${resolved.explainerTitle}.`
        : 'Education workspace opened from Urban Analytics learning-path handoff.',
    },
    qa: {
      state: 'valid',
      warnings: [],
      limitations: [
        'Education guidance supplements professional interpretation and does not replace method validity or QA review.',
      ],
    },
    metadata: {
      pathId: resolved.reference.pathId ?? null,
      explainerId: resolved.reference.explainerId ?? null,
      conceptCount: resolved.reference.concepts.length,
      prerequisiteCount: resolved.reference.prerequisites.length,
      intermediateValueCount: resolved.reference.intermediateValues.length,
      interpretationPromptCount: resolved.reference.interpretationPrompts.length,
      teachingStepCount: resolved.reference.teachingSteps.length,
    },
  });

  return {
    ...resolved,
    artifactId,
    opened: true,
  };
}