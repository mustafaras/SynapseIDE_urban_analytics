/**
 * GeoAI Runtime — barrel export.
 *
 * Provides ONNX Runtime management, model registry,
 * spatial feature engineering, cross-validation, and model explainability.
 */
export { ONNXRuntimeManager } from './ONNXRuntimeManager';
export { ModelRegistry } from './ModelRegistry';
export { OnnxWebRuntimeAdapter } from './OnnxWebRuntimeAdapter';
export type {
  InferenceBackend,
  InferenceResult,
  ModelMeta,
  RuntimeAdapter,
  RuntimeManagerConfig,
  RuntimeStatus,
  TensorLike,
} from './types';
