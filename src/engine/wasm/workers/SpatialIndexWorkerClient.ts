import type {
  SpatialIndexBackend,
  SpatialIndexBenchmarkSummary,
  SpatialIndexBoundingBoxQuery,
  SpatialIndexBuildInfo,
  SpatialIndexCapability,
  SpatialIndexNearestQuery,
  SpatialIndexOptions,
  SpatialIndexQueryResult,
  SpatialIndexRecord,
} from '../SpatialIndexWASM';

type WorkerCommand =
  | { id: string; type: 'build'; payload: { records: SpatialIndexRecord[]; options?: SpatialIndexOptions } }
  | { id: string; type: 'bbox'; payload: { query: SpatialIndexBoundingBoxQuery } }
  | { id: string; type: 'nearest'; payload: { query: SpatialIndexNearestQuery } }
  | { id: string; type: 'benchmark'; payload: { bboxQueries: SpatialIndexBoundingBoxQuery[]; nearestQueries: SpatialIndexNearestQuery[] } }
  | { id: string; type: 'capability' };

type WorkerSuccess<T> = { id: string; ok: true; payload: T };
type WorkerFailure = { id: string; ok: false; error: string };
type WorkerReply<T> = WorkerSuccess<T> | WorkerFailure;

export interface SpatialIndexWorkerBuildResult {
  buildInfo: SpatialIndexBuildInfo;
  capability: SpatialIndexCapability;
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `wasm-worker-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export class SpatialIndexWorkerClient {
  private readonly worker: Worker;

  private readonly pending = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason?: unknown) => void;
  }>();

  constructor(worker?: Worker) {
    this.worker = worker ?? new Worker(new URL('./spatialIndex.worker.ts', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);
  }

  async build(records: SpatialIndexRecord[], options?: SpatialIndexOptions): Promise<SpatialIndexWorkerBuildResult> {
    return this.request<SpatialIndexWorkerBuildResult>({
      id: createRequestId(),
      type: 'build',
      payload: {
        records,
        ...(options ? { options } : {}),
      },
    });
  }

  async queryBoundingBox<T extends Record<string, unknown> = Record<string, unknown>>(query: SpatialIndexBoundingBoxQuery): Promise<SpatialIndexQueryResult<T>> {
    return this.request<SpatialIndexQueryResult<T>>({
      id: createRequestId(),
      type: 'bbox',
      payload: { query },
    });
  }

  async queryNearest<T extends Record<string, unknown> = Record<string, unknown>>(query: SpatialIndexNearestQuery): Promise<SpatialIndexQueryResult<T>> {
    return this.request<SpatialIndexQueryResult<T>>({
      id: createRequestId(),
      type: 'nearest',
      payload: { query },
    });
  }

  async benchmark(
    bboxQueries: SpatialIndexBoundingBoxQuery[],
    nearestQueries: SpatialIndexNearestQuery[],
  ): Promise<SpatialIndexBenchmarkSummary> {
    return this.request<SpatialIndexBenchmarkSummary>({
      id: createRequestId(),
      type: 'benchmark',
      payload: { bboxQueries, nearestQueries },
    });
  }

  async getCapability(): Promise<SpatialIndexCapability> {
    return this.request<SpatialIndexCapability>({
      id: createRequestId(),
      type: 'capability',
    });
  }

  terminate(): void {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleError);
    this.worker.terminate();
    for (const pending of this.pending.values()) {
      pending.reject(new Error('Spatial index worker terminated.'));
    }
    this.pending.clear();
  }

  private request<T>(message: WorkerCommand): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.set(message.id, { resolve, reject });
      this.worker.postMessage(message);
    });
  }

  private readonly handleMessage = (event: MessageEvent<WorkerReply<unknown>>) => {
    const reply = event.data;
    if (!reply || typeof reply !== 'object' || typeof reply.id !== 'string') {
      return;
    }
    const pending = this.pending.get(reply.id);
    if (!pending) {
      return;
    }
    this.pending.delete(reply.id);
    if (reply.ok) {
      pending.resolve(reply.payload);
      return;
    }
    pending.reject(new Error(reply.error));
  };

  private readonly handleError = (event: ErrorEvent) => {
    const error = new Error(event.message || 'Spatial index worker failed.');
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  };
}

export function createSpatialIndexWorkerClient(): SpatialIndexWorkerClient {
  return new SpatialIndexWorkerClient();
}

export function supportsSpatialIndexWorker(): boolean {
  return typeof Worker !== 'undefined';
}

export type { SpatialIndexBackend };
