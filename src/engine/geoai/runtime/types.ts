/**
 * GeoAI Runtime — shared types for ONNX Runtime management.
 */

/* ── Backend selection ───────────────────────────────── */

export type InferenceBackend = 'wasm' | 'webgpu';

/* ── Model metadata ──────────────────────────────────── */

export interface ModelMeta {
  /** Unique model identifier, e.g. "unet-landcover-256" */
  id: string;
  /** Human-readable label */
  label: string;
  /** Semantic version string */
  version: string;
  /** Domain tag */
  domain: 'cv' | 'nlp' | 'tabular' | 'custom';
  /** Expected input shape: [batch, channels, height, width] or similar */
  inputShape: number[];
  /** Expected output shape(s) */
  outputShape: number[];
  /** Number of output classes (classification / segmentation) */
  numClasses?: number;
  /** Class labels in order */
  classLabels?: string[];
  /** Approximate model size in bytes (for memory budgeting) */
  sizeBytes: number;
  /** Whether this is a built-in model (shipped with the app) */
  builtIn: boolean;
  /** Optional URL used to load the model in browser-managed runtime paths. */
  sourceUrl?: string;
  /** Preferred backend for this model when multiple runtime backends are available. */
  preferredBackend?: InferenceBackend;
}

/* ── Session / tensors ───────────────────────────────── */

export interface TensorLike {
  data: Float32Array | Int32Array | Uint8Array;
  dims: number[];
}

export interface InferenceResult {
  outputs: Record<string, TensorLike>;
  /** Wall-clock inference time in ms */
  durationMs: number;
}

/* ── Runtime adapter (DI seam for testing) ───────────── */

export interface RuntimeAdapter {
  /** Load a model from a URL or ArrayBuffer and return an opaque session handle */
  loadModel(source: string | ArrayBuffer): Promise<string>;
  /** Run inference on a loaded session */
  run(
    sessionHandle: string,
    feeds: Record<string, TensorLike>,
    signal?: AbortSignal,
  ): Promise<Record<string, TensorLike>>;
  /** Release a loaded session and free memory */
  releaseSession(sessionHandle: string): Promise<void>;
  /** Estimated memory consumption for a session handle (bytes) */
  getSessionMemory(sessionHandle: string): number;
}

/* ── Manager config ──────────────────────────────────── */

export interface RuntimeManagerConfig {
  /** Maximum total memory budget in bytes (default 512 MB) */
  memoryBudgetBytes?: number;
  /** Preferred backend */
  backend?: InferenceBackend;
  /** Optional custom runtime adapter (for testing / alternative runtimes) */
  adapter?: RuntimeAdapter;
}

/* ── Manager status (for telemetry / UI) ─────────────── */

export interface RuntimeStatus {
  loadedModels: string[];
  totalMemoryUsed: number;
  memoryBudget: number;
  backend: InferenceBackend;
}
