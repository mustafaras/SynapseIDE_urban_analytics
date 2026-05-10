import type {
  StreamObserver,
  StreamingConnector,
  WebSocketStreamConnectorOptions,
} from '../types';
import { normalizeStreamPayload } from '../types';

async function parseSocketPayload(data: unknown): Promise<unknown> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return { raw: data };
    }
  }
  if (data instanceof ArrayBuffer) {
    const text = new TextDecoder().decode(data);
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    const text = await data.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return { raw: String(data) };
}

export class WebSocketStreamConnector implements StreamingConnector {
  readonly kind = 'websocket' as const;

  private readonly options: WebSocketStreamConnectorOptions;

  private socket: WebSocket | null = null;

  private connected = false;

  constructor(options: WebSocketStreamConnectorOptions) {
    this.options = options;
  }

  async connect(observer: StreamObserver): Promise<void> {
    if (this.connected) {
      return;
    }

    observer.onStatus({
      state: 'connecting',
      connector: this.kind,
      detail: `Opening ${this.options.url}.`,
    });

    const socket = new WebSocket(this.options.url);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('error', handleError);
      };
      const handleOpen = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error(`Unable to connect to WebSocket stream at ${this.options.url}.`));
      };

      socket.addEventListener('open', handleOpen, { once: true });
      socket.addEventListener('error', handleError, { once: true });
    });

    this.connected = true;
    observer.onStatus({
      state: 'streaming',
      connector: this.kind,
      detail: this.options.topic
        ? `WebSocket connected. Tagging messages as ${this.options.topic}.`
        : 'WebSocket connected and awaiting live payloads.',
    });

    socket.addEventListener('message', (event) => {
      void parseSocketPayload(event.data)
        .then((payload) => {
          const topic = this.options.topic
            ?? (typeof payload === 'object' && payload !== null && typeof (payload as { topic?: unknown }).topic === 'string'
              ? String((payload as { topic?: unknown }).topic)
              : 'websocket/live');
          observer.onMessage(
            normalizeStreamPayload(this.kind, topic, payload, this.options.url),
          );
        })
        .catch((error) => {
          observer.onError(error instanceof Error ? error : new Error('Failed to parse WebSocket payload.'));
        });
    });

    socket.addEventListener('close', () => {
      this.connected = false;
      observer.onStatus({
        state: 'paused',
        connector: this.kind,
        detail: 'WebSocket connection closed.',
      });
    });

    socket.addEventListener('error', () => {
      observer.onError(new Error('WebSocket transport reported an error.'));
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) {
      this.socket.close(1000, 'Closed by operator');
    }
    this.socket = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
