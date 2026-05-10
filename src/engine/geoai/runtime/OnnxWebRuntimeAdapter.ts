import type {
  InferenceBackend,
  RuntimeAdapter,
  TensorLike,
} from './types';

type OrtModule = Awaited<typeof import('onnxruntime-web')>;
type OrtSession = Awaited<ReturnType<OrtModule['InferenceSession']['create']>>;

interface SessionEntry {
  session: OrtSession;
  memoryBytes: number;
}

function toOrtTensorType(data: TensorLike['data']): 'float32' | 'int32' | 'uint8' {
  if (data instanceof Int32Array) {
    return 'int32';
  }
  if (data instanceof Uint8Array) {
    return 'uint8';
  }
  return 'float32';
}

function normalizeTensorData(data: unknown): Float32Array | Int32Array | Uint8Array {
  if (data instanceof Float32Array || data instanceof Int32Array || data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof Uint8ClampedArray) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    return Float32Array.from(data as unknown as ArrayLike<number>);
  }
  if (Array.isArray(data)) {
    return Float32Array.from(data);
  }
  return new Float32Array();
}

async function raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    throw new DOMException('Inference aborted', 'AbortError');
  }

  return await new Promise<T>((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener('abort', handleAbort);
      reject(new DOMException('Inference aborted', 'AbortError'));
    };

    signal.addEventListener('abort', handleAbort, { once: true });
    void promise.then(
      (value) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      },
    );
  });
}

export class OnnxWebRuntimeAdapter implements RuntimeAdapter {
  private readonly backend: InferenceBackend;
  private readonly sessions = new Map<string, SessionEntry>();
  private ortPromise: Promise<OrtModule> | null = null;
  private nextSessionId = 0;

  constructor(backend: InferenceBackend = 'wasm') {
    this.backend = backend;
  }

  async loadModel(source: string | ArrayBuffer): Promise<string> {
    const ort = await this.getOrt();
    const session = typeof source === 'string'
      ? await ort.InferenceSession.create(source, {
          executionProviders: [this.backend],
        })
      : await ort.InferenceSession.create(source, {
          executionProviders: [this.backend],
        });
    const handle = `onnx-web-session-${++this.nextSessionId}`;
    this.sessions.set(handle, {
      session,
      memoryBytes: typeof source === 'string' ? 0 : source.byteLength,
    });
    return handle;
  }

  async run(
    sessionHandle: string,
    feeds: Record<string, TensorLike>,
    signal?: AbortSignal,
  ): Promise<Record<string, TensorLike>> {
    if (signal?.aborted) {
      throw new DOMException('Inference aborted', 'AbortError');
    }

    const ort = await this.getOrt();
    const entry = this.getSession(sessionHandle);
    const ortFeeds = Object.fromEntries(
      Object.entries(feeds).map(([name, tensor]) => {
        const tensorData = toOrtTensorType(tensor.data) === 'float32'
          ? (tensor.data instanceof Float32Array ? tensor.data : Float32Array.from(tensor.data))
          : tensor.data;
        return [name, new ort.Tensor(toOrtTensorType(tensor.data), tensorData, tensor.dims)];
      }),
    );

    const outputs = await raceAbort(entry.session.run(ortFeeds), signal);
    return Object.fromEntries(
      Object.entries(outputs).map(([name, tensor]) => [
        name,
        {
          data: normalizeTensorData((tensor as { data?: unknown }).data),
          dims: Array.isArray((tensor as { dims?: unknown }).dims)
            ? [...((tensor as { dims: readonly number[] }).dims)]
            : [],
        },
      ]),
    );
  }

  async releaseSession(sessionHandle: string): Promise<void> {
    const entry = this.sessions.get(sessionHandle);
    if (!entry) {
      return;
    }

    const releasable = entry.session as { release?: () => Promise<void> | void };
    await Promise.resolve(releasable.release?.());
    this.sessions.delete(sessionHandle);
  }

  getSessionMemory(sessionHandle: string): number {
    return this.sessions.get(sessionHandle)?.memoryBytes ?? 0;
  }

  private async getOrt(): Promise<OrtModule> {
    if (!this.ortPromise) {
      this.ortPromise = import('onnxruntime-web');
    }
    return await this.ortPromise;
  }

  private getSession(sessionHandle: string): SessionEntry {
    const entry = this.sessions.get(sessionHandle);
    if (!entry) {
      throw new Error(`OnnxWebRuntimeAdapter: session "${sessionHandle}" is not loaded.`);
    }
    return entry;
  }
}