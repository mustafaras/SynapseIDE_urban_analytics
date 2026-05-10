import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeTileGrid,
  detectObjects,
  detectObjectsWithInferrer,
  type DetectionProgress,
  type GeoTransform,
  type ObjectDetectionResult,
  type RasterTile,
  type RawDetection,
  type TileInferrer,
  type UrbanObjectClass,
  URBAN_OBJECT_CLASSES,
} from "../cv";
import {
  resolveObjectDetectionRuntimeConfig,
  type ObjectDetectionRuntimeConfig,
} from "../models";
import { ModelRegistry } from "../runtime/ModelRegistry";
import { OnnxWebRuntimeAdapter } from "../runtime/OnnxWebRuntimeAdapter";
import { ONNXRuntimeManager } from "../runtime/ONNXRuntimeManager";
import type {
  InferenceBackend,
  RuntimeAdapter,
  RuntimeStatus,
} from "../runtime/types";
import {
  getEOSourceAnalysisState,
  resolveEOSourceAnalysis,
  type EOSourceAnalysisValidationState,
  type EOSourceKind,
  type EOSourceProvenance,
  type EOSourceRecord,
  type EOSourceRuntimeState,
} from "@/services/data/eo";
import { useGeoAIStatusStore } from "@/stores/useGeoAIStatusStore";

export type ObjectDetectionExecutionMode = "real-model" | "demo-mode";

export interface ObjectDetectionReadinessState {
  ready: boolean;
  reason?: string;
  notes: string[];
}

export interface ObjectDetectionRunSourceSummary {
  id: string;
  title: string;
  kind: EOSourceKind;
  provider: string;
  runtimeState: EOSourceRuntimeState;
  runtimeMode: "real-source" | "demo-source";
  provenance: EOSourceProvenance;
  validationState: EOSourceAnalysisValidationState;
  notes: string[];
  sourceRef: string;
}

export interface ObjectDetectionRunMetadata {
  executionMode: ObjectDetectionExecutionMode;
  modelId: string;
  modelLabel: string;
  backend: InferenceBackend | "demo";
  tileSize: number;
  overlap: number;
  confidenceThresholds: Record<string, number>;
  nmsIouThreshold: number;
  sourceId: string;
  sourceTitle: string;
  sourceKind: EOSourceKind;
  sourceRef: string;
  sourceRuntimeMode: "real-source" | "demo-source";
  elapsedMs: number;
  imageId: string;
}

export interface ObjectDetectionRunResult {
  detection: ObjectDetectionResult;
  runtime: RuntimeStatus | null;
  scene: {
    raster: RasterTile;
    bounds: [number, number, number, number];
    transform: GeoTransform;
  };
  source: ObjectDetectionRunSourceSummary;
  metadata: ObjectDetectionRunMetadata;
}

export interface ObjectDetectionRunOptions {
  source: EOSourceRecord;
  executionMode: ObjectDetectionExecutionMode;
  selectedClasses: readonly UrbanObjectClass[];
  defaultConfidence: number;
  overlap: number;
  iouThreshold: number;
  tileSize?: number;
  signal?: AbortSignal;
  onProgress?: (progress: DetectionProgress) => void;
}

interface ObjectDetectionRuntimeOverride {
  adapter?: RuntimeAdapter;
  backend?: InferenceBackend;
  modelId?: string;
  modelSource?: string | ArrayBuffer;
}

const DEMO_MODEL_ID = "yolo-nano-urban-demo";

function getRuntimeOverride(): ObjectDetectionRuntimeOverride | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.__SYNAPSE_OBJECT_DETECTION_RUNTIME__ ?? null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGeoTransform(
  bounds: readonly [number, number, number, number],
  raster: RasterTile,
): GeoTransform {
  const [west, south, east, north] = bounds;
  return {
    originLon: west,
    originLat: north,
    pixelLon: (east - west) / Math.max(1, raster.width),
    pixelLat: (south - north) / Math.max(1, raster.height),
  };
}

function buildConfidenceThresholds(
  selectedClasses: readonly UrbanObjectClass[],
  defaultConfidence: number,
): Record<string, number> {
  const selected = new Set(selectedClasses);
  const threshold = clamp01(defaultConfidence);
  return Object.fromEntries(
    URBAN_OBJECT_CLASSES.map((className) => [className, selected.has(className) ? threshold : 1.1]),
  );
}

function createDemoSeeds(raster: RasterTile, classCount: number): RawDetection[] {
  const width = raster.width;
  const height = raster.height;
  const rng = mulberry32(width * 31 + height * 17 + classCount * 13);
  const baseCount = Math.max(8, Math.min(24, Math.round((width * height) / 4096) || 12));
  const minWidth = Math.max(2, Math.round(width * 0.08));
  const minHeight = Math.max(2, Math.round(height * 0.08));
  const maxWidth = Math.max(minWidth, Math.round(width * 0.18));
  const maxHeight = Math.max(minHeight, Math.round(height * 0.18));
  const seeds: RawDetection[] = [];

  for (let index = 0; index < baseCount; index += 1) {
    const w = Math.max(1, minWidth + Math.round(rng() * Math.max(0, maxWidth - minWidth)));
    const h = Math.max(1, minHeight + Math.round(rng() * Math.max(0, maxHeight - minHeight)));
    const x = rng() * Math.max(1, width - w);
    const y = rng() * Math.max(1, height - h);
    const confidence = 0.45 + rng() * 0.5;
    const classIndex = Math.floor(rng() * classCount);
    seeds.push({ x, y, width: w, height: h, classIndex, confidence });

    if (rng() < 0.25) {
      seeds.push({
        x: Math.min(Math.max(0, x + 1), Math.max(0, width - w)),
        y: Math.min(Math.max(0, y + 1), Math.max(0, height - h)),
        width: w,
        height: h,
        classIndex,
        confidence: confidence * 0.94,
      });
    }
  }

  return seeds;
}

function createDemoInferrer(
  raster: RasterTile,
  tileSize: number,
  overlap: number,
  signal?: AbortSignal,
): TileInferrer {
  const seeds = createDemoSeeds(raster, URBAN_OBJECT_CLASSES.length);
  const grid = computeTileGrid(raster.height, raster.width, tileSize, overlap);

  return async (_tile, tileIndex) => {
    if (signal?.aborted) {
      throw new DOMException("Object detection aborted", "AbortError");
    }

    const spec = grid[tileIndex];
    if (!spec) {
      return [];
    }

    const tileDetections = seeds.filter((seed) => {
      const maxX = spec.srcX + tileSize;
      const maxY = spec.srcY + tileSize;
      const seedX2 = seed.x + seed.width;
      const seedY2 = seed.y + seed.height;
      return !(seedX2 <= spec.srcX || seed.x >= maxX || seedY2 <= spec.srcY || seed.y >= maxY);
    }).map((seed) => ({
      x: seed.x - spec.srcX,
      y: seed.y - spec.srcY,
      width: seed.width,
      height: seed.height,
      classIndex: seed.classIndex,
      confidence: seed.confidence,
    }));

    await new Promise((resolve) => setTimeout(resolve, 16));
    if (signal?.aborted) {
      throw new DOMException("Object detection aborted", "AbortError");
    }
    return tileDetections;
  };
}

function buildSourceSummary(
  source: EOSourceRecord,
  validationState: EOSourceAnalysisValidationState,
  notes: string[],
): ObjectDetectionRunSourceSummary {
  return {
    id: source.id,
    title: source.title,
    kind: source.kind,
    provider: source.provider,
    runtimeState: source.runtimeState,
    runtimeMode: source.provenance.isDemo ? "demo-source" : "real-source",
    provenance: source.provenance,
    validationState,
    notes,
    sourceRef: source.provenance.sourceRef,
  };
}

function resolveModelSource(
  runtimeConfig: ObjectDetectionRuntimeConfig,
  runtimeOverride: ObjectDetectionRuntimeOverride | null,
): string | ArrayBuffer | undefined {
  return runtimeOverride?.modelSource ?? runtimeConfig.sourceUrl;
}

export function getObjectDetectionExecutionState(
  source: EOSourceRecord | null,
  executionMode: ObjectDetectionExecutionMode,
): ObjectDetectionReadinessState {
  const sourceState = getEOSourceAnalysisState(source);
  if (!sourceState.ready) {
    return sourceState;
  }

  if (executionMode === "demo-mode") {
    return {
      ready: true,
      notes: [
        ...sourceState.notes,
        "Demo mode uses the synthetic inferrer over the selected raster extent and never claims weight-backed detections.",
      ],
    };
  }

  const runtimeConfig = resolveObjectDetectionRuntimeConfig();
  const runtimeOverride = getRuntimeOverride();
  const modelSource = resolveModelSource(runtimeConfig, runtimeOverride);
  if (!modelSource) {
    return {
      ready: false,
      ...(runtimeConfig.missingSourceReason ? { reason: runtimeConfig.missingSourceReason } : {}),
      notes: [
        ...sourceState.notes,
        "Switch to Demo mode explicitly if you want the synthetic fallback instead of a real weight-backed run.",
      ],
    };
  }

  return {
    ready: true,
    notes: [
      ...sourceState.notes,
      `Real model ${runtimeConfig.label} will run against the selected raster source through the GeoAI runtime.`,
    ],
  };
}

export function useObjectDetection() {
  const reportLoading = useGeoAIStatusStore((state) => state.reportLoading);
  const reportInferring = useGeoAIStatusStore((state) => state.reportInferring);
  const reportReady = useGeoAIStatusStore((state) => state.reportReady);
  const reportError = useGeoAIStatusStore((state) => state.reportError);
  const resetStatus = useGeoAIStatusStore((state) => state.reset);

  const runtimeConfig = useMemo(() => resolveObjectDetectionRuntimeConfig(), []);
  const runtimeOverride = useMemo(() => getRuntimeOverride(), []);
  const registry = useMemo(() => new ModelRegistry(), []);
  const runtimeSetup = useMemo(() => {
    const backend = runtimeOverride?.backend ?? runtimeConfig.preferredBackend;
    return {
      adapter: runtimeOverride?.adapter ?? new OnnxWebRuntimeAdapter(backend),
      backend,
      modelId: runtimeOverride?.modelId ?? runtimeConfig.modelId,
      modelLabel: runtimeConfig.label,
      modelSource: resolveModelSource(runtimeConfig, runtimeOverride),
      tileSize: runtimeConfig.tileSize,
    };
  }, [runtimeConfig, runtimeOverride]);
  const runtime = useMemo(
    () => new ONNXRuntimeManager({
      adapter: runtimeSetup.adapter,
      backend: runtimeSetup.backend,
      memoryBudgetBytes: 96 * 1024 * 1024,
    }, registry),
    [registry, runtimeSetup.adapter, runtimeSetup.backend],
  );

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ObjectDetectionRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    void runtime.releaseAll();
    resetStatus();
  }, [resetStatus, runtime]);

  const assessReadiness = useCallback(
    (source: EOSourceRecord | null, executionMode: ObjectDetectionExecutionMode) => (
      getObjectDetectionExecutionState(source, executionMode)
    ),
    [],
  );

  const runDetection = useCallback(async (options: ObjectDetectionRunOptions) => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const readiness = getObjectDetectionExecutionState(options.source, options.executionMode);
      if (!readiness.ready) {
        throw new Error(readiness.reason ?? "The selected raster source is not ready for object detection.");
      }

      const resolved = await resolveEOSourceAnalysis(options.source);
      const transform = buildGeoTransform(resolved.bounds, resolved.raster);
      const tileSize = Math.max(1, Math.round(options.tileSize ?? runtimeSetup.tileSize));
      const overlap = Math.max(0, Math.min(Math.round(options.overlap), tileSize - 1));
      const iouThreshold = clamp01(options.iouThreshold);
      const defaultConfidence = clamp01(options.defaultConfidence);
      const confidenceThresholds = buildConfidenceThresholds(options.selectedClasses, defaultConfidence);

      let detection: ObjectDetectionResult;
      let runtimeStatus: RuntimeStatus | null = null;
      const startedAt = performance.now();

      if (options.executionMode === "real-model") {
        if (!runtimeSetup.modelSource) {
          throw new Error(runtimeConfig.missingSourceReason ?? "Object detection model source is not configured.");
        }

        if (!runtime.isLoaded(runtimeSetup.modelId)) {
          reportLoading("Loading real object-detection model through the GeoAI runtime.", runtimeSetup.backend);
          await runtime.loadModel(runtimeSetup.modelId, runtimeSetup.modelSource);
          await runtime.warmup(runtimeSetup.modelId);
        }

        const warmedStatus = runtime.status();
        reportReady({
          loadedModels: warmedStatus.loadedModels.length,
          memoryUsedMB: Number((warmedStatus.totalMemoryUsed / (1024 * 1024)).toFixed(1)),
          backend: warmedStatus.backend,
          engine: "object_detection",
          message: `${runtimeSetup.modelLabel} is loaded and ready for detection.`,
        });

        reportInferring(`Running real object detection on ${resolved.source.title}.`);
        detection = await detectObjects(
          resolved.raster,
          transform,
          runtime,
          {
            modelId: runtimeSetup.modelId,
            tileSize,
            overlap,
            classLabels: runtimeConfig.classLabels,
            confidenceThresholds,
            defaultConfidence,
            iouThreshold,
            imageId: resolved.source.id,
          },
          {
            ...(options.signal ? { signal: options.signal } : {}),
            ...(options.onProgress ? { onProgress: options.onProgress } : {}),
          },
        );
        runtimeStatus = runtime.status();
      } else {
        reportLoading("Preparing Demo mode object detection. The synthetic inferrer remains explicitly labeled as a fallback.", "wasm");
        reportInferring(`Running Demo mode object detection on ${resolved.source.title}.`);
        detection = await detectObjectsWithInferrer(
          resolved.raster,
          transform,
          createDemoInferrer(resolved.raster, tileSize, overlap, options.signal),
          {
            modelId: DEMO_MODEL_ID,
            tileSize,
            overlap,
            classLabels: runtimeConfig.classLabels,
            confidenceThresholds,
            defaultConfidence,
            iouThreshold,
            imageId: resolved.source.id,
          },
          {
            ...(options.signal ? { signal: options.signal } : {}),
            ...(options.onProgress ? { onProgress: options.onProgress } : {}),
          },
        );
      }

      const elapsedMs = Math.round(performance.now() - startedAt);
      const nextResult: ObjectDetectionRunResult = {
        detection,
        runtime: runtimeStatus,
        scene: {
          raster: resolved.raster,
          bounds: [...resolved.bounds] as [number, number, number, number],
          transform,
        },
        source: buildSourceSummary(resolved.source, resolved.validationState, resolved.notes),
        metadata: {
          executionMode: options.executionMode,
          modelId: detection.modelId ?? (options.executionMode === "real-model" ? runtimeSetup.modelId : DEMO_MODEL_ID),
          modelLabel: options.executionMode === "real-model" ? runtimeSetup.modelLabel : "Demo synthetic detector",
          backend: options.executionMode === "real-model" ? runtimeSetup.backend : "demo",
          tileSize,
          overlap,
          confidenceThresholds,
          nmsIouThreshold: iouThreshold,
          sourceId: resolved.source.id,
          sourceTitle: resolved.source.title,
          sourceKind: resolved.source.kind,
          sourceRef: resolved.source.provenance.sourceRef,
          sourceRuntimeMode: resolved.source.provenance.isDemo ? "demo-source" : "real-source",
          elapsedMs,
          imageId: detection.imageId ?? resolved.source.id,
        },
      };
      setResult(nextResult);

      reportReady({
        loadedModels: runtimeStatus?.loadedModels.length ?? 0,
        memoryUsedMB: Number((((runtimeStatus?.totalMemoryUsed ?? 0) / (1024 * 1024))).toFixed(1)),
        backend: runtimeStatus?.backend ?? "wasm",
        engine: "object_detection",
        message: `${options.executionMode === "real-model" ? "Real model" : "Demo mode"} object detection complete. ${detection.detections.length} detections retained.`,
      });

      return nextResult;
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        throw caught;
      }
      const message = caught instanceof Error ? caught.message : "Object detection failed.";
      setError(message);
      reportError(message, runtimeSetup.backend);
      throw caught instanceof Error ? caught : new Error(message);
    } finally {
      setIsRunning(false);
    }
  }, [reportError, reportInferring, reportLoading, reportReady, runtime, runtimeConfig, runtimeSetup]);

  return {
    assessReadiness,
    error,
    isRunning,
    result,
    runDetection,
    runtimeConfig,
  };
}