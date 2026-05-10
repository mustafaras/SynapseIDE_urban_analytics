import { useCallback, useEffect, useRef, useState } from 'react';
import { createStreamingConnector } from '../connectors';
import type {
  StreamEnvelope,
  StreamLifecycleState,
  StreamingConnectionConfig,
  StreamingConnector,
} from '../types';
import { useStreamingRuntimeStore } from '@/stores/useStreamingRuntimeStore';

export interface StreamingConnectionState {
  state: StreamLifecycleState;
  detail?: string;
  messages: StreamEnvelope[];
  error: string | null;
  start: (config: StreamingConnectionConfig) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
}

export function useStreamingConnection(maxMessages = 32): StreamingConnectionState {
  const reportConnecting = useStreamingRuntimeStore((state) => state.reportConnecting);
  const reportConnected = useStreamingRuntimeStore((state) => state.reportConnected);
  const reportMessage = useStreamingRuntimeStore((state) => state.reportMessage);
  const reportPaused = useStreamingRuntimeStore((state) => state.reportPaused);
  const reportError = useStreamingRuntimeStore((state) => state.reportError);
  const resetRuntime = useStreamingRuntimeStore((state) => state.reset);

  const connectorRef = useRef<StreamingConnector | null>(null);
  const [state, setState] = useState<StreamLifecycleState>('idle');
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<StreamEnvelope[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const connector = connectorRef.current;
    connectorRef.current = null;
    if (connector) {
      await connector.disconnect();
    }
    setState('paused');
    setDetail('Streaming paused by operator.');
    reportPaused('Streaming paused by operator.');
  }, [reportPaused]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    setDetail(undefined);
    setState('idle');
    resetRuntime();
  }, [resetRuntime]);

  const start = useCallback(async (config: StreamingConnectionConfig) => {
    await stop();

    const connector = createStreamingConnector(config);
    connectorRef.current = connector;
    setMessages([]);
    setError(null);

    try {
      await connector.connect({
        onStatus: (next) => {
          setState(next.state);
          setDetail(next.detail);
          if (next.state === 'connecting') {
            reportConnecting(next.connector, next.detail);
          } else if (next.state === 'streaming') {
            reportConnected(next.connector, next.detail);
          } else if (next.state === 'paused') {
            reportPaused(next.detail);
          }
        },
        onMessage: (message) => {
          setMessages((current) => [message, ...current].slice(0, maxMessages));
          reportMessage(message);
        },
        onError: (nextError) => {
          const message = nextError.message || 'Streaming connector failed.';
          setError(message);
          setState('error');
          setDetail(message);
          reportError(message, connector.kind);
        },
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Streaming connector failed.';
      setError(message);
      setState('error');
      setDetail(message);
      reportError(message, connector.kind);
    }
  }, [maxMessages, reportConnected, reportConnecting, reportError, reportMessage, reportPaused, stop]);

  useEffect(() => () => {
    void connectorRef.current?.disconnect();
    connectorRef.current = null;
    resetRuntime();
  }, [resetRuntime]);

  return {
    state,
    messages,
    error,
    start,
    stop,
    clear,
    ...(detail !== undefined ? { detail } : {}),
  };
}
