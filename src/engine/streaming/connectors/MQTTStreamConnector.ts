import type { MqttClient } from 'mqtt';
import type {
  MQTTStreamConnectorOptions,
  StreamObserver,
  StreamingConnector,
} from '../types';
import { normalizeStreamPayload } from '../types';

type MQTTModule = typeof import('mqtt');

function decodePayload(payload: Uint8Array): unknown {
  const text = new TextDecoder().decode(payload);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export class MQTTStreamConnector implements StreamingConnector {
  readonly kind = 'mqtt' as const;

  private readonly options: MQTTStreamConnectorOptions;

  private client: MqttClient | null = null;

  private connected = false;

  constructor(options: MQTTStreamConnectorOptions) {
    this.options = options;
  }

  async connect(observer: StreamObserver): Promise<void> {
    if (this.connected) {
      return;
    }

    observer.onStatus({
      state: 'connecting',
      connector: this.kind,
      detail: `Dialing broker ${this.options.url}.`,
    });

    const mqttModule: MQTTModule = await import('mqtt');
    const client = mqttModule.connect(this.options.url, {
      protocolVersion: 5,
      reconnectPeriod: 0,
      ...(this.options.username ? { username: this.options.username } : {}),
      ...(this.options.password ? { password: this.options.password } : {}),
      ...(this.options.clientId ? { clientId: this.options.clientId } : {}),
    });
    this.client = client;

    await new Promise<void>((resolve, reject) => {
      const handleError = (error: Error) => {
        client.off('connect', handleConnect);
        reject(error);
      };
      const handleConnect = () => {
        client.off('error', handleError);
        client.subscribe(this.options.topic, { qos: this.options.qos ?? 0 }, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      };

      client.once('error', handleError);
      client.once('connect', handleConnect);
    });

    this.connected = true;
    observer.onStatus({
      state: 'streaming',
      connector: this.kind,
      detail: `Subscribed to ${this.options.topic}.`,
    });

    client.on('message', (topic, payload) => {
      observer.onMessage(
        normalizeStreamPayload(
          this.kind,
          topic,
          decodePayload(payload),
          this.options.url,
        ),
      );
    });

    client.on('close', () => {
      this.connected = false;
      observer.onStatus({
        state: 'paused',
        connector: this.kind,
        detail: 'Broker connection closed.',
      });
    });

    client.on('error', (error) => {
      observer.onError(error instanceof Error ? error : new Error('MQTT stream failed.'));
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      this.connected = false;
      return;
    }

    const client = this.client;
    this.client = null;
    await new Promise<void>((resolve) => {
      client.end(false, {}, () => resolve());
    });
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
