export type StreamConnectorKind = 'replay' | 'websocket' | 'mqtt';
export type StreamLifecycleState = 'idle' | 'connecting' | 'streaming' | 'paused' | 'error';

export interface StreamCoordinate {
  lon: number;
  lat: number;
}

export interface StreamEnvelope {
  id: string;
  connector: StreamConnectorKind;
  topic: string;
  source: string;
  observedAt: number;
  receivedAt: number;
  summary: string;
  payload: Record<string, unknown>;
  metrics: Record<string, number>;
  coordinate?: StreamCoordinate;
}

export interface StreamStatus {
  state: StreamLifecycleState;
  connector: StreamConnectorKind;
  detail?: string;
}

export interface StreamObserver {
  onStatus: (status: StreamStatus) => void;
  onMessage: (message: StreamEnvelope) => void;
  onError: (error: Error) => void;
}

export interface StreamingConnector {
  readonly kind: StreamConnectorKind;
  connect(observer: StreamObserver): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface ReplayStreamConnectorOptions {
  channelId?: string;
  intervalMs?: number;
}

export interface WebSocketStreamConnectorOptions {
  url: string;
  topic?: string;
}

export interface MQTTStreamConnectorOptions {
  url: string;
  topic: string;
  username?: string;
  password?: string;
  clientId?: string;
  qos?: 0 | 1 | 2;
}

export type StreamingConnectionConfig =
  | { kind: 'replay'; options?: ReplayStreamConnectorOptions }
  | { kind: 'websocket'; options: WebSocketStreamConnectorOptions }
  | { kind: 'mqtt'; options: MQTTStreamConnectorOptions };

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `stream-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toCoordinate(payload: Record<string, unknown>): StreamCoordinate | undefined {
  const lon = toFiniteNumber(payload.lon ?? payload.lng ?? payload.longitude);
  const lat = toFiniteNumber(payload.lat ?? payload.latitude);
  if (lon === undefined || lat === undefined) {
    return undefined;
  }
  return { lon, lat };
}

function collectMetrics(payload: Record<string, unknown>): Record<string, number> {
  const metrics: Record<string, number> = {};
  for (const [key, value] of Object.entries(payload)) {
    const numeric = toFiniteNumber(value);
    if (numeric !== undefined) {
      metrics[key] = numeric;
    }
  }
  return metrics;
}

function summarizePayload(payload: Record<string, unknown>, fallbackTopic: string): string {
  if (typeof payload.summary === 'string' && payload.summary.trim().length > 0) {
    return payload.summary;
  }
  const headline = typeof payload.sensorId === 'string'
    ? payload.sensorId
    : typeof payload.station === 'string'
      ? payload.station
      : fallbackTopic;
  const metrics = collectMetrics(payload);
  const preview = Object.entries(metrics)
    .slice(0, 2)
    .map(([key, value]) => `${key} ${value.toFixed(1)}`)
    .join(' · ');
  return preview ? `${headline} · ${preview}` : headline;
}

export function normalizeStreamPayload(
  connector: StreamConnectorKind,
  topic: string,
  rawPayload: unknown,
  fallbackSource: string,
): StreamEnvelope {
  const payload: Record<string, unknown> = typeof rawPayload === 'object' && rawPayload !== null
    ? { ...(rawPayload as Record<string, unknown>) }
    : { value: rawPayload };
  const observedAt = toFiniteNumber(payload.observedAt ?? payload.timestamp) ?? Date.now();
  const source = typeof payload.source === 'string' && payload.source.trim().length > 0
    ? payload.source
    : typeof payload.sensorId === 'string' && payload.sensorId.trim().length > 0
      ? payload.sensorId
      : fallbackSource;
  const coordinate = toCoordinate(payload);

  const base = {
    id: typeof payload.id === 'string' && payload.id.trim().length > 0 ? payload.id : randomId(),
    connector,
    topic,
    source,
    observedAt,
    receivedAt: Date.now(),
    summary: summarizePayload(payload, topic),
    payload,
    metrics: collectMetrics(payload),
  };
  return coordinate ? { ...base, coordinate } : base;
}
