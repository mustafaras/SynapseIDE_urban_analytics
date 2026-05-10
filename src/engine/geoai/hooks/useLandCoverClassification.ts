import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accuracyReport,
  classifyRaster,
  LAND_COVER_CLASSES,
  type AccuracyReport,
  type ClassifiedTile,
  type RasterTile,
} from "../cv";
import { ModelRegistry } from "../runtime/ModelRegistry";
import { ONNXRuntimeManager } from "../runtime/ONNXRuntimeManager";
import type { RuntimeAdapter, RuntimeStatus, TensorLike } from "../runtime/types";
import {
  DEFAULT_LAND_COVER_BOUNDS,
  resolveEOSourceAnalysis,
  type EOSourceAnalysisValidationState,
  type EOSourceRecord,
  type EOSourceRuntimeState,
  type EOSourceKind,
  type EOSourceProvenance,
} from "@/services/data/eo";
import { useGeoAIStatusStore } from "@/stores/useGeoAIStatusStore";

const DEMO_MODEL_ID = "unet-landcover-256";

type LandCoverScene = {
  raster: RasterTile;
  groundTruth?: Uint8Array;
  bounds: readonly [number, number, number, number];
};

export interface LandCoverRunSourceSummary {
  id: string;
  title: string;
  kind: EOSourceKind;
  provider: string;
  runtimeState: EOSourceRuntimeState;
  runtimeMode: "real-source" | "demo-source";
  provenance: EOSourceProvenance;
  validationState: EOSourceAnalysisValidationState;
  notes: string[];
}

export type LandCoverRunResult = {
  accuracy: AccuracyReport | null;
  classified: ClassifiedTile;
  runtime: RuntimeStatus;
  scene: LandCoverScene;
  source: LandCoverRunSourceSummary;
};

type LandCoverRunOptions = {
  overlap?: number;
  tileSize?: number;
};

function createDemoAdapter(numClasses: number): RuntimeAdapter {
  let counter = 0;
  const memory = new Map<string, number>();

  return {
    async loadModel() {
      const handle = `land-cover-demo-${++counter}`;
      memory.set(handle, 4 * 1024 * 1024);
      return handle;
    },
    async run(_handle: string, feeds: Record<string, TensorLike>, signal?: AbortSignal) {
      if (signal?.aborted) {
        throw new DOMException("Land-cover inference aborted", "AbortError");
      }

      const input = feeds.input;
      const [, bands, height, width] = input.dims;
      const pixelCount = height * width;
      const values = input.data instanceof Float32Array ? input.data : Float32Array.from(input.data);
      const logits = new Float32Array(numClasses * pixelCount);

      for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
        const blue = bands > 0 ? values[pixelIndex] : 0;
        const green = bands > 1 ? values[pixelCount + pixelIndex] : blue;
        const red = bands > 2 ? values[pixelCount * 2 + pixelIndex] : green;
        const nir = bands > 3 ? values[pixelCount * 3 + pixelIndex] : red;
        const brightness = (blue + green + red + nir) / 4;
        const ndvi = (nir - red) / (nir + red + 1e-6);
        const ndwi = (green - nir) / (green + nir + 1e-6);
        const neutralMix = 1 - Math.abs(red - green) - Math.abs(red - blue);

        const scores = [
          1.35 * brightness + 0.62 * red - 1.55 * Math.max(ndvi, 0),
          2.65 * ndvi + 0.5 * green - 0.25 * red,
          2.35 * ndwi + 0.65 * (0.25 - nir) + 0.2 * blue,
          1.2 * brightness + 0.35 * red - 0.7 * ndvi,
          1.05 * brightness + 0.75 * neutralMix - 1.1 * Math.max(ndvi, 0),
          1.65 * ndvi + 0.28 * green + 0.22 * red - 0.18 * brightness,
        ];

        for (let classIndex = 0; classIndex < numClasses; classIndex += 1) {
          logits[classIndex * pixelCount + pixelIndex] = scores[classIndex] ?? 0;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 24));
      return {
        output: {
          data: logits,
          dims: [1, numClasses, height, width],
        },
      };
    },
    async releaseSession(handle: string) {
      memory.delete(handle);
    },
    getSessionMemory(handle: string) {
      return memory.get(handle) ?? 0;
    },
  };
}

function buildRunSummary(source: EOSourceRecord, validationState: EOSourceAnalysisValidationState, notes: string[]): LandCoverRunSourceSummary {
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
  };
}

export function useLandCoverClassification() {
  const reportLoading = useGeoAIStatusStore((state) => state.reportLoading);
  const reportInferring = useGeoAIStatusStore((state) => state.reportInferring);
  const reportReady = useGeoAIStatusStore((state) => state.reportReady);
  const reportError = useGeoAIStatusStore((state) => state.reportError);
  const resetStatus = useGeoAIStatusStore((state) => state.reset);

  const registry = useMemo(() => new ModelRegistry(), []);
  const adapter = useMemo(() => createDemoAdapter(LAND_COVER_CLASSES.length), []);
  const runtime = useMemo(
    () => new ONNXRuntimeManager({ adapter, backend: "wasm", memoryBudgetBytes: 16 * 1024 * 1024 }, registry),
    [adapter, registry],
  );

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<LandCoverRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    void runtime.releaseAll();
    resetStatus();
  }, [resetStatus, runtime]);

  const runClassification = useCallback(async (source: EOSourceRecord, options?: LandCoverRunOptions) => {
    setIsRunning(true);
    setError(null);

    try {
      if (!runtime.isLoaded(DEMO_MODEL_ID)) {
        reportLoading("Loading browser-safe land-cover model.", "wasm");
        await runtime.loadModel(DEMO_MODEL_ID, "demo://land-cover");
        await runtime.warmup(DEMO_MODEL_ID);
      }

      const loadedStatus = runtime.status();
      reportReady({
        loadedModels: loadedStatus.loadedModels.length,
        memoryUsedMB: Number((loadedStatus.totalMemoryUsed / (1024 * 1024)).toFixed(1)),
        backend: loadedStatus.backend,
        engine: "land_cover_classification",
        message: "Land-cover model warmed and ready.",
      });

      const resolved = await resolveEOSourceAnalysis(source);
      reportInferring(`Running tiled land-cover classification on ${resolved.source.title}.`);
      const classified = await classifyRaster(
        resolved.raster,
        runtime,
        {
          modelId: DEMO_MODEL_ID,
          tileSize: options?.tileSize ?? 24,
          overlap: options?.overlap ?? 4,
          postprocess: true,
          minComponentArea: 3,
        },
      );

      const accuracy = resolved.groundTruth
        ? accuracyReport(
            classified.labels,
            resolved.groundTruth,
            LAND_COVER_CLASSES.length,
            [...LAND_COVER_CLASSES],
          )
        : null;

      const nextResult: LandCoverRunResult = {
        accuracy,
        classified,
        runtime: runtime.status(),
        scene: {
          raster: resolved.raster,
          bounds: resolved.bounds,
          ...(resolved.groundTruth ? { groundTruth: resolved.groundTruth } : {}),
        },
        source: buildRunSummary(resolved.source, resolved.validationState, resolved.notes),
      };
      setResult(nextResult);

      reportReady({
        loadedModels: nextResult.runtime.loadedModels.length,
        memoryUsedMB: Number((nextResult.runtime.totalMemoryUsed / (1024 * 1024)).toFixed(1)),
        backend: nextResult.runtime.backend,
        engine: "land_cover_classification",
        message: accuracy
          ? `Land-cover inference complete. Overall accuracy ${Math.round(accuracy.overallAccuracy * 100)}%.`
          : `Land-cover inference complete for ${resolved.source.title}. Reference labels were not available for accuracy scoring.`,
      });
      return nextResult;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Land-cover classification failed.";
      setError(message);
      reportError(message, "wasm");
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [reportError, reportInferring, reportLoading, reportReady, runtime]);

  return {
    defaultBounds: DEFAULT_LAND_COVER_BOUNDS,
    error,
    isRunning,
    result,
    runClassification,
  };
}

export { DEFAULT_LAND_COVER_BOUNDS };
