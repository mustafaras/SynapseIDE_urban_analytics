import { describe, expect, it } from "vitest";
import { BackgroundTaskCancelledError, BackgroundWorkerPool } from "../BackgroundWorkerPool";
import { runWorkerTask } from "../workerHandlers";
import type {
  WorkerMainToWorkerMessage,
  WorkerToMainMessage,
} from "../taskDefinitions";
import type { GeometryWorkflowRequest } from "../../../services/map/geometry/GeometryWorkflowEngine";
import { fcPolygonsProjected } from "../../../centerpanel/components/map/__tests__/fixtures/gisFixtures";

type Listener = (event: MessageEvent<WorkerToMainMessage>) => void;

/** Fake worker that runs the real geometry handler, optionally with a delay so cancel can interrupt it. */
class GeometryFakeWorker {
  private readonly listeners = new Set<Listener>();
  private terminated = false;

  constructor(private readonly delayMs = 0) {}

  addEventListener(type: "message" | "error", listener: Listener): void {
    if (type === "message") this.listeners.add(listener);
  }

  postMessage(message: WorkerMainToWorkerMessage): void {
    if (message.type !== "execute") return;
    const run = () => {
      if (this.terminated) return;
      void runWorkerTask(message.task.kind, message.task.input as never, (progress) => {
        if (this.terminated) return;
        this.emit({ type: "progress", jobId: message.jobId, progress });
      })
        .then((result) => {
          if (this.terminated) return;
          this.emit({ type: "result", jobId: message.jobId, result: result as never });
        })
        .catch((error: unknown) => {
          if (this.terminated) return;
          this.emit({
            type: "error",
            jobId: message.jobId,
            error: error instanceof Error ? error.message : "failed",
          });
        });
    };
    if (this.delayMs > 0) setTimeout(run, this.delayMs);
    else run();
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(payload: WorkerToMainMessage): void {
    this.listeners.forEach((listener) => listener({ data: payload } as MessageEvent<WorkerToMainMessage>));
  }
}

function bufferRequest(): GeometryWorkflowRequest {
  return {
    op: "buffer",
    sources: [structuredClone(fcPolygonsProjected.featureCollection)],
    params: { op: "buffer", meters: 200, segments: 12, dissolve: false, sourceLayerId: "parcels" },
    executionCrs: "EPSG:32635",
    sourceLayerIds: ["parcels"],
    preferGeos: true,
  };
}

describe("geometry/workflow worker task", () => {
  it("runs in the pool and resolves with a fully attributed computation", async () => {
    const pool = new BackgroundWorkerPool({ workerCount: 1, workerFactory: () => new GeometryFakeWorker() as unknown as Worker });
    const handle = pool.enqueue("geometry/workflow", bufferRequest(), { title: "Buffer" });
    const result = await handle.promise;
    expect(result.op).toBe("buffer");
    expect(result.executionCrs).toBe("EPSG:32635");
    expect(result.featureCount).toBe(fcPolygonsProjected.featureCollection.features.length);
    expect(result.backend).toBe("turf");
  });

  it("cancels a running geometry job cleanly", async () => {
    const pool = new BackgroundWorkerPool({ workerCount: 1, workerFactory: () => new GeometryFakeWorker(50) as unknown as Worker });
    const handle = pool.enqueue("geometry/workflow", bufferRequest(), { title: "Buffer" });
    const rejection = expect(handle.promise).rejects.toBeInstanceOf(BackgroundTaskCancelledError);
    expect(handle.cancel()).toBe(true);
    await rejection;
  });
});
