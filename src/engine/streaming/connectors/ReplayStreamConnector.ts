import type {
  ReplayStreamConnectorOptions,
  StreamObserver,
  StreamingConnector,
} from '../types';
import { normalizeStreamPayload } from '../types';

type ReplaySensor = {
  source: string;
  topic: string;
  lon: number;
  lat: number;
  district: string;
};

const REPLAY_SENSORS: readonly ReplaySensor[] = [
  { source: 'sensor-karakoy', topic: 'iot/urban/air-quality', lon: 28.9805, lat: 41.0223, district: 'Karakoy' },
  { source: 'sensor-besiktas', topic: 'iot/urban/noise', lon: 29.0094, lat: 41.0437, district: 'Besiktas' },
  { source: 'sensor-kadikoy', topic: 'iot/urban/microclimate', lon: 29.0286, lat: 40.9909, district: 'Kadikoy' },
  { source: 'sensor-fatih', topic: 'iot/urban/air-quality', lon: 28.9499, lat: 41.0174, district: 'Fatih' },
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function buildReplayPayload(sensor: ReplaySensor, tick: number) {
  const oscillation = Math.sin((tick + 1) / 3);
  const noise = Math.cos((tick + 2) / 4);
  return {
    source: sensor.source,
    sensorId: sensor.source,
    district: sensor.district,
    lon: sensor.lon,
    lat: sensor.lat,
    observedAt: Date.now(),
    pm25: 18 + oscillation * 8 + tick % 3,
    temperature_c: 19 + noise * 4 + (tick % 2) * 0.6,
    humidity_pct: 48 + oscillation * 10,
    noise_db: 54 + noise * 6,
    occupancy_pct: 41 + Math.abs(oscillation) * 28,
    summary: `${sensor.district} live replay sample`,
  };
}

export class ReplayStreamConnector implements StreamingConnector {
  readonly kind = 'replay' as const;

  private readonly options: ReplayStreamConnectorOptions;

  private timerId: ReturnType<typeof setInterval> | null = null;

  private connected = false;

  constructor(options: ReplayStreamConnectorOptions = {}) {
    this.options = options;
  }

  async connect(observer: StreamObserver): Promise<void> {
    if (this.connected) {
      return;
    }

    observer.onStatus({
      state: 'connecting',
      connector: this.kind,
      detail: 'Bootstrapping deterministic urban sensor replay.',
    });
    await wait(220);

    let tick = 0;
    this.connected = true;
    observer.onStatus({
      state: 'streaming',
      connector: this.kind,
      detail: 'Replay connector active with deterministic telemetry.',
    });

    const intervalMs = Math.max(250, this.options.intervalMs ?? 1100);
    this.timerId = globalThis.setInterval(() => {
      const sensor = REPLAY_SENSORS[tick % REPLAY_SENSORS.length]!;
      const topic = this.options.channelId ?? sensor.topic;
      observer.onMessage(
        normalizeStreamPayload(
          this.kind,
          topic,
          buildReplayPayload(sensor, tick),
          sensor.source,
        ),
      );
      tick += 1;
    }, intervalMs);
  }

  async disconnect(): Promise<void> {
    if (this.timerId) {
      globalThis.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
