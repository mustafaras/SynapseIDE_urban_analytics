

export type SemanticStatus = {
  generated?: boolean;
  synced?: boolean;
  analysisOutput?: boolean;
  mapLayerCandidate?: boolean;
  scenarioArtifact?: boolean;
};

export type SearchDoc = {
  id: string;
  name: string;
  /** Full path used for display and exclusion checks. */
  path: string;
  content: string;
  /** File size in bytes; used by the worker to skip oversized files. */
  size?: number;
  /** True when the file is currently open in an editor tab. */
  isOpen?: boolean;
  semanticStatus?: SemanticStatus;
};

let worker: Worker | null = null;
/** True once the worker has acknowledged a completed index pass. */
let ready = false;
/** Callbacks waiting to receive results from a sent query, keyed by request id. */
const resultCallbacks = new Map<number, (results: any[]) => void>();
/** Sends that must wait until the current index pass completes. */
const pendingSends: (() => void)[] = [];
let nextRequestId = 1;

export const MAX_INDEX_DOCS = 5000;
export const MAX_INDEX_CONTENT_CHARS = 500_000;
export const MAX_PENDING_SEARCH_REQUESTS = 20;

function resetWorkerState() {
  ready = false;
  pendingSends.length = 0;
  for (const resolve of resultCallbacks.values()) resolve([]);
  resultCallbacks.clear();
}

function sanitizeDoc(doc: SearchDoc): SearchDoc {
  const content =
    doc.size != null && doc.size > MAX_INDEX_CONTENT_CHARS
      ? ''
      : doc.content.length > MAX_INDEX_CONTENT_CHARS
        ? ''
        : doc.content;
  return {
    ...doc,
    content,
  };
}

function ensureWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data || {};
      if (type === 'indexed') {
        ready = true;
        // Drain any sends that were queued while indexing was in progress.
        let fn: (() => void) | undefined;
        while ((fn = pendingSends.shift()) !== undefined) fn();
      }
      if (type === 'results') {
        const requestId = Number(payload?.requestId);
        const cb = resultCallbacks.get(requestId);
        if (cb) cb(payload?.results ?? []);
        resultCallbacks.delete(requestId);
      }
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      resetWorkerState();
    };
  }
}

export function indexDocs(docs: SearchDoc[]) {
  ensureWorker();
  ready = false;
  worker!.postMessage({
    type: 'index',
    payload: { docs: docs.slice(0, MAX_INDEX_DOCS).map(sanitizeDoc) },
  });
}

export function queryDocs(q: string, limit = 300): Promise<any[]> {
  ensureWorker();
  return new Promise(resolve => {
    const requestId = nextRequestId++;
    resultCallbacks.set(requestId, resolve);
    while (resultCallbacks.size > MAX_PENDING_SEARCH_REQUESTS) {
      const oldest = resultCallbacks.keys().next().value as number | undefined;
      if (oldest === undefined) break;
      const stale = resultCallbacks.get(oldest);
      resultCallbacks.delete(oldest);
      stale?.([]);
    }
    const send = () => worker!.postMessage({ type: 'query', payload: { q, limit, requestId } });
    if (ready) {
      send();
    } else {
      // Queue the send; it will fire once the indexed acknowledgment arrives.
      pendingSends.push(send);
      if (pendingSends.length > MAX_PENDING_SEARCH_REQUESTS) {
        pendingSends.splice(0, pendingSends.length - MAX_PENDING_SEARCH_REQUESTS);
      }
    }
  });
}
