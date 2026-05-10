import type {
  WorkerMainToWorkerMessage,
  WorkerToMainMessage,
} from './taskDefinitions';
import { runWorkerTask } from './workerHandlers';

interface WorkerContext {
  postMessage: (message: WorkerToMainMessage) => void;
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<WorkerMainToWorkerMessage>) => void,
  ) => void;
}

const ctx = self as unknown as WorkerContext;

ctx.addEventListener('message', async (event) => {
  const message = event.data;
  if (!message || message.type !== 'execute') {
    return;
  }

  try {
    const result = await runWorkerTask(message.task.kind, message.task.input as never, (progress) => {
      ctx.postMessage({
        type: 'progress',
        jobId: message.jobId,
        progress,
      });
    });

    ctx.postMessage({
      type: 'result',
      jobId: message.jobId,
      result: result as never,
    });
  } catch (error) {
    ctx.postMessage({
      type: 'error',
      jobId: message.jobId,
      error: error instanceof Error ? error.message : 'Background worker execution failed.',
    });
  }
});

export {};
