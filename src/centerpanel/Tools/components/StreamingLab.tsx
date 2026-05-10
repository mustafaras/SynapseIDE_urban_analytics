import React, { useMemo, useState } from 'react';
import styles from '../../styles/tools.module.css';
import {
  useStreamingConnection,
  type StreamConnectorKind,
  type StreamingConnectionConfig,
} from '@/engine/streaming';
import { useStreamingRuntimeStore } from '@/stores/useStreamingRuntimeStore';

const metricCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  minHeight: 74,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid color-mix(in srgb, var(--ui-border) 78%, var(--syn-accent-primary) 22%)',
  background: 'linear-gradient(180deg, color-mix(in srgb, var(--ui-card-bg) 92%, var(--syn-accent-primary) 8%), color-mix(in srgb, var(--ui-card-bg) 96%, var(--syn-bg-root) 4%))',
};

const CONNECTOR_OPTIONS: Array<{ kind: StreamConnectorKind; label: string; description: string }> = [
  { kind: 'replay', label: 'Replay', description: 'Deterministic urban telemetry feed for operator verification.' },
  { kind: 'websocket', label: 'WebSocket', description: 'Live browser socket for urban event streams.' },
  { kind: 'mqtt', label: 'MQTT', description: 'Broker-backed IoT ingestion over WebSocket transport.' },
];

const StreamingLab: React.FC = () => {
  const runtime = useStreamingRuntimeStore();
  const streaming = useStreamingConnection();

  const [connectorKind, setConnectorKind] = useState<StreamConnectorKind>('replay');
  const [websocketUrl, setWebsocketUrl] = useState('wss://echo.websocket.events');
  const [websocketTopic, setWebsocketTopic] = useState('iot/urban/websocket');
  const [mqttUrl, setMqttUrl] = useState('wss://test.mosquitto.org:8081');
  const [mqttTopic, setMqttTopic] = useState('synapse/urban/demo');

  const config = useMemo<StreamingConnectionConfig>(() => {
    switch (connectorKind) {
      case 'websocket':
        return { kind: 'websocket', options: { url: websocketUrl, topic: websocketTopic } };
      case 'mqtt':
        return { kind: 'mqtt', options: { url: mqttUrl, topic: mqttTopic } };
      case 'replay':
      default:
        return { kind: 'replay', options: { intervalMs: 900 } };
    }
  }, [connectorKind, mqttTopic, mqttUrl, websocketTopic, websocketUrl]);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className={`${styles.callout} ${runtime.state === 'error' ? styles.calloutWarn : styles.calloutSuccess}`}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Streaming runtime</div>
          <div className={styles.calloutMeta}>
            {runtime.state.toUpperCase()} · {runtime.connector.toUpperCase()}
          </div>
        </div>
        <div className={styles.calloutBody} style={{ display: 'grid', gap: 10 }}>
          <div className={styles.meta}>
            {runtime.detail ?? 'Select a connector and start ingestion to validate streaming infrastructure and status propagation.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>State</div>
              <div className={styles.metricValue}>{runtime.state}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Connector</div>
              <div className={styles.metricValue}>{runtime.connector}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Received</div>
              <div className={styles.metricValue}>{runtime.received.toLocaleString()}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Throughput</div>
              <div className={styles.metricValue}>{runtime.messagesPerMinute.toFixed(0)} msg/min</div>
            </div>
          </div>
        </div>
      </div>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: 'grid', gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Connector selection</div>
          <div className={styles.calloutMeta}>Replay for deterministic validation, live sockets for field feeds</div>
        </div>
        <div className={styles.hstack}>
          {CONNECTOR_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              className={styles.segBtn}
              aria-pressed={connectorKind === option.kind}
              onClick={() => setConnectorKind(option.kind)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>

        {connectorKind === 'websocket' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 320px)', gap: 10 }}>
            <input
              className={styles.select}
              value={websocketUrl}
              onChange={(event) => setWebsocketUrl(event.target.value)}
              aria-label="WebSocket URL"
            />
            <input
              className={styles.select}
              value={websocketTopic}
              onChange={(event) => setWebsocketTopic(event.target.value)}
              aria-label="WebSocket topic label"
            />
          </div>
        ) : null}

        {connectorKind === 'mqtt' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 320px)', gap: 10 }}>
            <input
              className={styles.select}
              value={mqttUrl}
              onChange={(event) => setMqttUrl(event.target.value)}
              aria-label="MQTT URL"
            />
            <input
              className={styles.select}
              value={mqttTopic}
              onChange={(event) => setMqttTopic(event.target.value)}
              aria-label="MQTT topic"
            />
          </div>
        ) : null}

        <div className={styles.hstack}>
          <button type="button" className={styles.btnPrimary} onClick={() => void streaming.start(config)}>
            Start connector
          </button>
          <button type="button" className={styles.btnGhost} onClick={() => void streaming.stop()}>
            Stop
          </button>
          <button type="button" className={styles.btnGhost} onClick={streaming.clear}>
            Clear log
          </button>
        </div>

        {streaming.error ? <div className={styles.metaWarn}>{streaming.error}</div> : null}
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: 'grid', gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Live event ledger</div>
          <div className={styles.calloutMeta}>
            {streaming.messages.length} buffered events · topic {runtime.lastTopic ?? '—'}
          </div>
        </div>
        {streaming.messages.length > 0 ? (
          <div className={styles.tableScroll}>
            <table className={`${styles.tableV2} ${styles.rowZebra}`}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Observed</th>
                  <th style={{ textAlign: 'left' }}>Source</th>
                  <th style={{ textAlign: 'left' }}>Topic</th>
                  <th style={{ textAlign: 'left' }}>Summary</th>
                  <th style={{ textAlign: 'right' }}>Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {streaming.messages.map((message) => (
                  <tr key={message.id}>
                    <td>{new Date(message.observedAt).toLocaleTimeString([], { hour12: false })}</td>
                    <td>{message.source}</td>
                    <td>{message.topic}</td>
                    <td>{message.summary}</td>
                    <td style={{ textAlign: 'right' }}>
                      {message.coordinate
                        ? `${message.coordinate.lon.toFixed(4)}, ${message.coordinate.lat.toFixed(4)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`${styles.meta} ${styles.metaBlock}`}>
            No events received yet. Replay mode should start filling this table within one second, while WebSocket and MQTT modes will populate it once the external feed emits JSON payloads.
          </div>
        )}
      </section>
    </div>
  );
};

export default StreamingLab;
