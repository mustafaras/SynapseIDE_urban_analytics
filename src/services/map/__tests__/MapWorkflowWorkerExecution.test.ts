import { describe, expect, it } from "vitest";
import {
  applyMapWorkflowPreview,
  buildGeometryWorkflowRequest,
  buildMapWorkflowContext,
  executeMapWorkflow,
  finalizeWorkerWorkflowResult,
  generateMapWorkflowPreview,
  type MapWorkflowBufferDraft,
  type MapWorkflowExecutionHandle,
  type MapWorkflowExecutionUpdate,
  type MapWorkflowWorkerExecutor,
} from "../MapWorkflowService";
import {
  computeGeometryWorkflow,
  type GeometryWorkflowComputation,
  type GeometryWorkflowRequest,
} from "../geometry/GeometryWorkflowEngine";
import { BackgroundTaskCancelledError } from "@/workers/pool";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { fcPolygonsProjected } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

const EXECUTION_CRS = "EPSG:32635";

function projectedLayer(): OverlayLayerConfig {
  return {
    id: "parcels",
    name: "Projected parcels",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    sourceData: structuredClone(fcPolygonsProjected.featureCollection),
    metadata: {
      geometryType: "Polygon",
      featureCount: fcPolygonsProjected.featureCollection.features.length,
      fields: ["id", "zone", "area_m2"],
      crsSummary: { crs: EXECUTION_CRS, status: "known", source: "explicit", notes: [] },
    },
  };
}

function bufferPreview() {
  const context = buildMapWorkflowContext([projectedLayer()]);
  const draft: MapWorkflowBufferDraft = {
    kind: "buffer",
    sourceMode: "layer",
    sourceLayerId: "parcels",
    distance: 250,
    unit: "meters",
    segments: 16,
    dissolve: false,
    name: "Buffer result",
  };
  return { context, preview: generateMapWorkflowPreview(draft, context) };
}

/** Executor that runs the real engine synchronously (worker success path). */
function inlineExecutor(): MapWorkflowWorkerExecutor {
  return {
    run(request: GeometryWorkflowRequest, options) {
      options.onProgress?.({ status: "running", percent: 10, stage: "Worker dispatched" });
      const promise = computeGeometryWorkflow(request).then((computation) => {
        options.onProgress?.({ status: "completed", percent: 100, stage: "Complete" });
        return computation;
      });
      return { promise, cancel: () => true } satisfies MapWorkflowExecutionHandle;
    },
  };
}

describe("MapWorkflowService worker execution", () => {
  it("builds a serializable geometry request carrying the execution CRS", () => {
    const { context, preview } = bufferPreview();
    const request = buildGeometryWorkflowRequest(preview, context);
    expect(request).not.toBeNull();
    expect(request?.op).toBe("buffer");
    expect(request?.executionCrs).toBe(EXECUTION_CRS);
    expect(request?.sources[0]?.features.length).toBe(fcPolygonsProjected.featureCollection.features.length);
    expect(request?.preferGeos).toBe(true);
  });

  it("executes a worker workflow and commits a derived layer whose manifest CRS equals the execution CRS", async () => {
    const { context, preview } = bufferPreview();
    const updates: MapWorkflowExecutionUpdate[] = [];
    // Force the worker route regardless of input size.
    const result = await executeMapWorkflow(
      { ...preview, needsWorker: true },
      context,
      inlineExecutor(),
      { onProgress: (update) => updates.push(update) },
    );

    expect(result.layer.sourceKind).toBe("derived");
    expect(result.manifest).toBeDefined();
    // Output CRS = execution CRS.
    expect(result.manifest.crsSummary.executionCrs).toBe(EXECUTION_CRS);
    expect(result.layer.metadata?.reproducibilityManifest?.crsSummary.executionCrs).toBe(EXECUTION_CRS);
    expect(result.reportItem.metrics.executed_in_worker).toBe(1);
    expect(updates.some((update) => update.status === "completed")).toBe(true);
  });

  it("finalises a worker computation into a manifest-bearing apply result", () => {
    const { context, preview } = bufferPreview();
    const computation: GeometryWorkflowComputation = {
      op: "buffer",
      featureCollection: structuredClone(fcPolygonsProjected.featureCollection),
      featureCount: fcPolygonsProjected.featureCollection.features.length,
      geometryClass: "polygon",
      bounds: [28.9, 40.9, 29.4, 41.1],
      metrics: { buffered_features: 10, geometry_backend: "turf" },
      backend: "turf",
      executionCrs: EXECUTION_CRS,
      inputFeatureCount: fcPolygonsProjected.featureCollection.features.length,
    };
    const result = finalizeWorkerWorkflowResult(preview, context, computation);
    expect(result).not.toBeNull();
    expect(result?.manifest.crsSummary.executionCrs).toBe(EXECUTION_CRS);
  });

  it("propagates a clean cancellation as BackgroundTaskCancelledError", async () => {
    const { context, preview } = bufferPreview();
    const cancellingExecutor: MapWorkflowWorkerExecutor = {
      run() {
        return {
          promise: Promise.reject(new BackgroundTaskCancelledError("job-1")),
          cancel: () => true,
        };
      },
    };
    await expect(
      executeMapWorkflow({ ...preview, needsWorker: true }, context, cancellingExecutor),
    ).rejects.toBeInstanceOf(BackgroundTaskCancelledError);
  });

  it("surfaces an induced worker failure as a rejected error", async () => {
    const { context, preview } = bufferPreview();
    const failingExecutor: MapWorkflowWorkerExecutor = {
      run() {
        return {
          promise: Promise.reject(new Error("Worker geometry execution failed.")),
          cancel: () => false,
        };
      },
    };
    await expect(
      executeMapWorkflow({ ...preview, needsWorker: true }, context, failingExecutor),
    ).rejects.toThrow(/Worker geometry execution failed/);
  });

  it("refuses to commit a deferred (sampled) preview through the synchronous apply path", () => {
    const { context, preview } = bufferPreview();
    const deferred = { ...preview, executionDeferred: true, previewSampled: true, needsWorker: true };
    expect(applyMapWorkflowPreview(deferred, context)).toBeNull();
  });
});
