/**
 * GeoAI Runtime — ONNX Runtime Manager
 *
 * Manages model session lifecycle: load → warmup → inference → release.
 * Supports memory budgeting, backend selection, and abortable inference.
 * Designed for dependency-injection via RuntimeAdapter so it can be tested
 * without the real onnxruntime-web library.
 */

import type {
  InferenceBackend,
  InferenceResult,
  RuntimeAdapter,
  RuntimeManagerConfig,
  RuntimeStatus,
  TensorLike,
} from './types';
import { ModelRegistry } from './ModelRegistry';

/* ── Internal session bookkeeping ────────────────────── */

interface SessionEntry {
  modelId: string;
  handle: string;
  memoryBytes: number;
  lastUsed: number;
  warmups: number;
}

/* ── Manager ─────────────────────────────────────────── */

const DEFAULT_BUDGET = 512 * 1024 * 1024; // 512 MB

export class ONNXRuntimeManager {
  private readonly adapter: RuntimeAdapter;
  private readonly backend: InferenceBackend;
  private readonly memoryBudget: number;
  readonly registry: ModelRegistry;

  private readonly sessions = new Map<string, SessionEntry>();
  private totalMemory = 0;

  constructor(config: RuntimeManagerConfig = {}, registry?: ModelRegistry) {
    if (!config.adapter) {
      throw new Error(
        'ONNXRuntimeManager requires a RuntimeAdapter. ' +
          'Pass one via config.adapter (use the WASM adapter in production).',
      );
    }
    this.adapter = config.adapter;
    this.backend = config.backend ?? 'wasm';
    this.memoryBudget = config.memoryBudgetBytes ?? DEFAULT_BUDGET;
    this.registry = registry ?? new ModelRegistry();
  }

  /* ── Status / observability ────────────────────────── */

  status(): RuntimeStatus {
    return {
      loadedModels: [...this.sessions.keys()],
      totalMemoryUsed: this.totalMemory,
      memoryBudget: this.memoryBudget,
      backend: this.backend,
    };
  }

  isLoaded(modelId: string): boolean {
    return this.sessions.has(modelId);
  }

  /* ── Load ───────────────────────────────────────────── */

  /**
   * Load a model into memory. If the model is already loaded, this is a no-op.
   *
   * @param modelId  Registered model id
   * @param source   URL or ArrayBuffer of the .onnx file
   */
  async loadModel(modelId: string, source: string | ArrayBuffer): Promise<void> {
    if (this.sessions.has(modelId)) return;

    const meta = this.registry.get(modelId);
    const estimatedSize = meta?.sizeBytes ?? 0;

    // Evict if needed
    await this.ensureBudget(estimatedSize);

    const handle = await this.adapter.loadModel(source);
    const actualMemory = this.adapter.getSessionMemory(handle);
    const mem = actualMemory > 0 ? actualMemory : estimatedSize;

    this.sessions.set(modelId, {
      modelId,
      handle,
      memoryBytes: mem,
      lastUsed: Date.now(),
      warmups: 0,
    });
    this.totalMemory += mem;
  }

  /* ── Warmup ─────────────────────────────────────────── */

  /**
   * Run a dummy inference to warm up JIT / compile caches.
   */
  async warmup(modelId: string): Promise<void> {
    const entry = this.getSession(modelId);
    const meta = this.registry.get(modelId);

    // Build a zero-tensor matching the expected input shape
    const inputShape = meta?.inputShape ?? [1, 1, 1, 1];
    const numel = inputShape.reduce((a, b) => a * b, 1);
    const dummyFeed: Record<string, TensorLike> = {
      input: { data: new Float32Array(numel), dims: inputShape },
    };

    await this.adapter.run(entry.handle, dummyFeed);
    entry.warmups += 1;
    entry.lastUsed = Date.now();
  }

  /* ── Inference ──────────────────────────────────────── */

  /**
   * Run inference on a loaded model. Supports abort via AbortSignal.
   */
  async run(
    modelId: string,
    feeds: Record<string, TensorLike>,
    signal?: AbortSignal,
  ): Promise<InferenceResult> {
    const entry = this.getSession(modelId);

    if (signal?.aborted) {
      throw new DOMException('Inference aborted', 'AbortError');
    }

    const t0 = performance.now();
    const outputs = await this.adapter.run(entry.handle, feeds, signal);
    const durationMs = performance.now() - t0;

    entry.lastUsed = Date.now();

    return { outputs, durationMs };
  }

  /* ── Release ────────────────────────────────────────── */

  /** Release a single model session. */
  async releaseModel(modelId: string): Promise<void> {
    const entry = this.sessions.get(modelId);
    if (!entry) return;

    await this.adapter.releaseSession(entry.handle);
    this.totalMemory -= entry.memoryBytes;
    this.sessions.delete(modelId);
  }

  /** Release all loaded sessions. */
  async releaseAll(): Promise<void> {
    const ids = [...this.sessions.keys()];
    for (const id of ids) {
      await this.releaseModel(id);
    }
  }

  /* ── Memory management ─────────────────────────────── */

  /**
   * Evict least-recently-used sessions until `needed` bytes fit within budget.
   */
  private async ensureBudget(needed: number): Promise<void> {
    while (this.totalMemory + needed > this.memoryBudget && this.sessions.size > 0) {
      // Find LRU session
      let lruId: string | null = null;
      let lruTime = Infinity;
      for (const [id, entry] of this.sessions) {
        if (entry.lastUsed < lruTime) {
          lruTime = entry.lastUsed;
          lruId = id;
        }
      }
      if (!lruId) break;
      await this.releaseModel(lruId);
    }
  }

  /* ── Helpers ────────────────────────────────────────── */

  private getSession(modelId: string): SessionEntry {
    const entry = this.sessions.get(modelId);
    if (!entry) {
      throw new Error(`ONNXRuntimeManager: model "${modelId}" is not loaded`);
    }
    return entry;
  }
}
