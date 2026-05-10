/**
 * GeoAI Runtime — Model Registry
 *
 * Manages a catalogue of available ONNX models (built-in + user-supplied).
 * Provides lookup, validation, and listing capabilities.
 */

import type { InferenceBackend, ModelMeta } from './types';

const URBAN_OBJECT_CLASS_LABELS = [
  'vehicle',
  'tree',
  'swimming_pool',
  'solar_panel',
  'construction_site',
] as const;

function readRuntimeEnv(name: string): string | undefined {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    const value = env?.[name]?.trim();
    return value ? value : undefined;
  } catch {
    return undefined;
  }
}

function parseBackend(value: string | undefined): InferenceBackend | undefined {
  if (value === 'wasm' || value === 'webgpu') {
    return value;
  }
  return undefined;
}

const OBJECT_DETECTION_MODEL_SOURCE_URL = readRuntimeEnv('VITE_GEOAI_OBJECT_DETECTION_MODEL_URL');
const OBJECT_DETECTION_MODEL_BACKEND = parseBackend(readRuntimeEnv('VITE_GEOAI_OBJECT_DETECTION_BACKEND')) ?? 'wasm';

/* ── Built-in models ─────────────────────────────────── */

const BUILTIN_MODELS: ModelMeta[] = [
  {
    id: 'unet-landcover-256',
    label: 'U-Net Land Cover (256×256)',
    version: '1.0.0',
    domain: 'cv',
    inputShape: [1, 4, 256, 256],
    outputShape: [1, 6, 256, 256],
    numClasses: 6,
    classLabels: ['built_up', 'vegetation', 'water', 'bare_soil', 'road', 'agriculture'],
    sizeBytes: 31_457_280, // ~30 MB
    builtIn: true,
  },
  {
    id: 'segformer-landcover-512',
    label: 'SegFormer Land Cover (512×512)',
    version: '1.0.0',
    domain: 'cv',
    inputShape: [1, 4, 512, 512],
    outputShape: [1, 6, 512, 512],
    numClasses: 6,
    classLabels: ['built_up', 'vegetation', 'water', 'bare_soil', 'road', 'agriculture'],
    sizeBytes: 14_680_064, // ~14 MB
    builtIn: true,
  },
  {
    id: 'yolo-nano-urban-640',
    label: 'YOLO-Nano Urban Detection (640×640)',
    version: '1.1.0',
    domain: 'cv',
    inputShape: [1, 3, 640, 640],
    outputShape: [1, 8400, 10],
    numClasses: URBAN_OBJECT_CLASS_LABELS.length,
    classLabels: [...URBAN_OBJECT_CLASS_LABELS],
    sizeBytes: 8_912_896,
    builtIn: true,
    ...(OBJECT_DETECTION_MODEL_SOURCE_URL ? { sourceUrl: OBJECT_DETECTION_MODEL_SOURCE_URL } : {}),
    preferredBackend: OBJECT_DETECTION_MODEL_BACKEND,
  },
];

/* ── Registry class ──────────────────────────────────── */

export class ModelRegistry {
  private readonly models = new Map<string, ModelMeta>();

  constructor(seedBuiltIns = true) {
    if (seedBuiltIns) {
      for (const m of BUILTIN_MODELS) {
        this.models.set(m.id, m);
      }
    }
  }

  /* ── Query ──────────────────────────────────────────── */

  /** Get a model by id, or undefined */
  get(id: string): ModelMeta | undefined {
    return this.models.get(id);
  }

  /** Whether a model id is registered */
  has(id: string): boolean {
    return this.models.has(id);
  }

  /** List all registered models */
  list(): ModelMeta[] {
    return [...this.models.values()];
  }

  /** List models filtered by domain */
  listByDomain(domain: ModelMeta['domain']): ModelMeta[] {
    return this.list().filter((m) => m.domain === domain);
  }

  /* ── Mutate ─────────────────────────────────────────── */

  /** Register a user-supplied model. Throws if id already exists. */
  register(meta: ModelMeta): void {
    if (this.models.has(meta.id)) {
      throw new Error(`ModelRegistry: model "${meta.id}" is already registered`);
    }
    this.models.set(meta.id, { ...meta, builtIn: false });
  }

  /** Remove a user-supplied model. Built-in models cannot be removed. */
  unregister(id: string): boolean {
    const m = this.models.get(id);
    if (!m) return false;
    if (m.builtIn) {
      throw new Error(`ModelRegistry: cannot remove built-in model "${id}"`);
    }
    return this.models.delete(id);
  }

  /** Total size of all registered models in bytes */
  totalSizeBytes(): number {
    let total = 0;
    for (const m of this.models.values()) total += m.sizeBytes;
    return total;
  }
}
