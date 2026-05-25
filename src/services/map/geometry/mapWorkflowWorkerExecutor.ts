/* ================================================================== */
/*  mapWorkflowWorkerExecutor                                          */
/*                                                                    */
/*  Bridges the shared background worker pool to the injectable        */
/*  `MapWorkflowWorkerExecutor` boundary that MapWorkflowService       */
/*  consumes. Keeps the service free of any pool import so it stays    */
/*  unit-testable with a fake executor.                               */
/* ================================================================== */

import { analyticsWorkerPool } from "@/workers/pool";
import type { BackgroundTaskStatus } from "@/workers/pool";
import type {
  MapWorkflowExecutionUpdate,
  MapWorkflowWorkerExecutor,
} from "../MapWorkflowService";

function toExecutionStatus(status: BackgroundTaskStatus): MapWorkflowExecutionUpdate["status"] {
  switch (status) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "failed";
  }
}

/** Build an executor backed by the app-wide analytics worker pool. */
export function createMapWorkflowWorkerExecutor(): MapWorkflowWorkerExecutor {
  return {
    run(request, options) {
      const handle = analyticsWorkerPool.enqueue("geometry/workflow", request, {
        title: options.title,
        ...(options.description ? { description: options.description } : {}),
      });

      let unsubscribe: (() => void) | undefined;
      if (options.onProgress) {
        const onProgress = options.onProgress;
        unsubscribe = analyticsWorkerPool.subscribe((snapshot) => {
          const job = snapshot.jobs.find((entry) => entry.id === handle.id);
          if (!job) return;
          onProgress({
            status: toExecutionStatus(job.status),
            percent: job.progress.percent,
            stage: job.progress.stage,
            detail: job.progress.detail,
            ...(job.error ? { error: job.error } : {}),
          });
        });
      }

      const cleanup = () => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
      };
      handle.promise.then(cleanup, cleanup);

      return {
        promise: handle.promise,
        cancel: () => handle.cancel(),
      };
    },
  };
}
