import { ModelRegistry } from '../runtime/ModelRegistry';
import type { InferenceBackend, ModelMeta } from '../runtime/types';

export type GeoAIModelTask =
  | 'land_cover_classification'
  | 'object_detection'
  | 'query_to_sql'
  | 'narrative_generation';

export interface GeoAIModelProfile {
  id: string;
  task: GeoAIModelTask;
  label: string;
  backend: 'wasm' | 'webgpu' | 'rule-based';
  modelId?: string;
  version: string;
  description: string;
  expectedInput?: string;
  expectedOutput?: string;
  sizeBytes?: number;
}

export interface ObjectDetectionRuntimeConfig {
  modelId: string;
  label: string;
  sourceUrl?: string;
  preferredBackend: InferenceBackend;
  tileSize: number;
  classLabels: string[];
  configured: boolean;
  missingSourceReason?: string;
}

const runtimeRegistry = new ModelRegistry();
const runtimeModels = new Map(runtimeRegistry.list().map((model) => [model.id, model]));
const OBJECT_DETECTION_MODEL_ID = 'yolo-nano-urban-640';

function runtimeProfile(task: GeoAIModelTask, modelId: string, description: string): GeoAIModelProfile {
  const model = runtimeModels.get(modelId);
  if (!model) {
    throw new Error(`GeoAI model profile "${modelId}" is not registered.`);
  }

  return {
    id: task,
    task,
    label: model.label,
    backend: model.preferredBackend ?? 'wasm',
    modelId: model.id,
    version: model.version,
    description,
    expectedInput: formatShape(model.inputShape),
    expectedOutput: formatShape(model.outputShape),
    sizeBytes: model.sizeBytes,
  };
}

function formatShape(shape: number[]): string {
  return `[${shape.join(', ')}]`;
}

function buildMissingSourceReason(model: ModelMeta): string {
  return `Model source for ${model.label} is not configured. Set VITE_GEOAI_OBJECT_DETECTION_MODEL_URL to an accessible .onnx file to enable real runs.`;
}

export const DEFAULT_GEOAI_MODEL_PROFILES: readonly GeoAIModelProfile[] = [
  runtimeProfile(
    'land_cover_classification',
    'unet-landcover-256',
    'Tile-based semantic segmentation for six-class land-cover mapping with browser-safe inference budgets.',
  ),
  runtimeProfile(
    'object_detection',
    OBJECT_DETECTION_MODEL_ID,
    'Compact YOLO-style detector profile for vehicles, trees, solar panels, pools, and construction sites using tiled browser inference orchestration.',
  ),
  {
    id: 'query-to-sql-rule-engine',
    task: 'query_to_sql',
    label: 'Deterministic NL → Spatial SQL',
    backend: 'rule-based',
    version: '1.0.0',
    description:
      'Auditable, read-only natural-language parser that classifies intent, extracts entities, and emits sandboxed DuckDB spatial SQL.',
    expectedInput: 'Analyst question in natural language',
    expectedOutput: 'Generated DuckDB SQL plus interpretation metadata',
  },
  {
    id: 'narrative-generation-template-engine',
    task: 'narrative_generation',
    label: 'Template-Driven Narrative Generation',
    backend: 'rule-based',
    version: '1.0.0',
    description:
      'Structured result-to-report engine that drafts evidence-linked analytical prose without inventing unsupported claims.',
    expectedInput: 'Structured findings, comparisons, trends, and citations',
    expectedOutput: 'Sectioned narrative report with citation anchors',
  },
] as const;

export function listGeoAIModelProfiles(): GeoAIModelProfile[] {
  return DEFAULT_GEOAI_MODEL_PROFILES.map((profile) => ({ ...profile }));
}

export function getGeoAIModelProfile(id: string): GeoAIModelProfile | undefined {
  return DEFAULT_GEOAI_MODEL_PROFILES.find((profile) => profile.id === id || profile.modelId === id);
}

export function resolveGeoAIModelProfile(task: GeoAIModelTask): GeoAIModelProfile | undefined {
  return DEFAULT_GEOAI_MODEL_PROFILES.find((profile) => profile.task === task);
}

export function estimateGeoAIModelFootprintMB(profile: GeoAIModelProfile): number {
  return Number(((profile.sizeBytes ?? 0) / (1024 * 1024)).toFixed(1));
}

export function listRuntimeGeoAIModels(): ModelMeta[] {
  return runtimeRegistry.listByDomain('cv');
}

export function resolveObjectDetectionRuntimeConfig(): ObjectDetectionRuntimeConfig {
  const model = runtimeModels.get(OBJECT_DETECTION_MODEL_ID);
  if (!model) {
    throw new Error(`GeoAI object-detection model "${OBJECT_DETECTION_MODEL_ID}" is not registered.`);
  }

  const tileSize = model.inputShape[2] ?? 640;
  const sourceUrl = typeof model.sourceUrl === 'string' && model.sourceUrl.trim().length > 0
    ? model.sourceUrl
    : undefined;

  return {
    modelId: model.id,
    label: model.label,
    ...(sourceUrl ? { sourceUrl } : {}),
    preferredBackend: model.preferredBackend ?? 'wasm',
    tileSize,
    classLabels: [...(model.classLabels ?? [])],
    configured: Boolean(sourceUrl),
    ...(sourceUrl ? {} : { missingSourceReason: buildMissingSourceReason(model) }),
  };
}
