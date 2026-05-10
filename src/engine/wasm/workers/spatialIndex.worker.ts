/// <reference lib="webworker" />

import {
  SpatialIndexWASM,
  type SpatialIndexBenchmarkSummary,
  type SpatialIndexBoundingBoxQuery,
  type SpatialIndexCapability,
  type SpatialIndexNearestQuery,
  type SpatialIndexOptions,
  type SpatialIndexQueryResult,
  type SpatialIndexRecord,
} from '../SpatialIndexWASM';

type WorkerCommand =
  | { id: string; type: 'build'; payload: { records: SpatialIndexRecord[]; options?: SpatialIndexOptions } }
  | { id: string; type: 'bbox'; payload: { query: SpatialIndexBoundingBoxQuery } }
  | { id: string; type: 'nearest'; payload: { query: SpatialIndexNearestQuery } }
  | { id: string; type: 'benchmark'; payload: { bboxQueries: SpatialIndexBoundingBoxQuery[]; nearestQueries: SpatialIndexNearestQuery[] } }
  | { id: string; type: 'capability' };

type WorkerSuccess<T> = { id: string; ok: true; payload: T };
type WorkerFailure = { id: string; ok: false; error: string };

let index: SpatialIndexWASM<Record<string, unknown>> | null = null;

function postSuccess<T>(id: string, payload: T): void {
  (self as DedicatedWorkerGlobalScope).postMessage({ id, ok: true, payload } satisfies WorkerSuccess<T>);
}

function postFailure(id: string, error: unknown): void {
  (self as DedicatedWorkerGlobalScope).postMessage({
    id,
    ok: false,
    error: error instanceof Error ? error.message : 'Spatial index worker failed.',
  } satisfies WorkerFailure);
}

async function handleBuild(id: string, records: SpatialIndexRecord[], options?: SpatialIndexOptions) {
  index = await SpatialIndexWASM.create(records, options);
  postSuccess(id, {
    buildInfo: index.buildInfo,
    capability: index.getCapability(),
  });
}

function requireIndex(id: string): SpatialIndexWASM<Record<string, unknown>> | null {
  if (!index) {
    postFailure(id, new Error('Spatial index worker has not been built yet.'));
    return null;
  }
  return index;
}

(self as DedicatedWorkerGlobalScope).addEventListener('message', (event: MessageEvent<WorkerCommand>) => {
  const message = event.data;
  if (!message || typeof message !== 'object') {
    return;
  }

  const run = async () => {
    switch (message.type) {
      case 'build':
        await handleBuild(message.id, message.payload.records, message.payload.options);
        return;
      case 'bbox': {
        const activeIndex = requireIndex(message.id);
        if (!activeIndex) {
          return;
        }
        postSuccess<SpatialIndexQueryResult<Record<string, unknown>>>(message.id, activeIndex.queryBoundingBox(message.payload.query));
        return;
      }
      case 'nearest': {
        const activeIndex = requireIndex(message.id);
        if (!activeIndex) {
          return;
        }
        postSuccess<SpatialIndexQueryResult<Record<string, unknown>>>(message.id, activeIndex.queryNearest(message.payload.query));
        return;
      }
      case 'benchmark': {
        const activeIndex = requireIndex(message.id);
        if (!activeIndex) {
          return;
        }
        postSuccess<SpatialIndexBenchmarkSummary>(message.id, activeIndex.benchmark(message.payload));
        return;
      }
      case 'capability': {
        const capability = index?.getCapability() ?? {
          preferredBackend: 'wasm',
          resolvedBackend: 'javascript',
          usingFallback: true,
          fallbackReason: 'Worker index not built.',
          wasmAvailable: typeof WebAssembly !== 'undefined',
        };
        postSuccess<SpatialIndexCapability>(message.id, capability);
        return;
      }
      default:
        postFailure((message as { id: string }).id, new Error('Unsupported spatial index worker command.'));
    }
  };

  void run().catch((error) => {
    postFailure(message.id, error);
  });
});
