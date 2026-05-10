import { create } from 'zustand';
import { sbStreaming } from '@/components/StatusBar/statusBridge';
import type {
  StreamConnectorKind,
  StreamEnvelope,
  StreamLifecycleState,
} from '@/engine/streaming/types';

type StreamingRuntimeStore = {
  state: StreamLifecycleState;
  connector: StreamConnectorKind;
  received: number;
  messagesPerMinute: number;
  lastTopic: string | undefined;
  lastMessageAt: number | undefined;
  lastSummary: string | undefined;
  detail: string | undefined;
  error: string | undefined;
  recentMessageTimes: number[];
  reportConnecting: (connector: StreamConnectorKind, detail?: string) => void;
  reportConnected: (connector: StreamConnectorKind, detail?: string) => void;
  reportMessage: (message: Pick<StreamEnvelope, 'connector' | 'topic' | 'receivedAt' | 'summary'>) => void;
  reportPaused: (detail?: string) => void;
  reportError: (message: string, connector?: StreamConnectorKind) => void;
  reset: () => void;
};

const initialState = {
  state: 'idle' as const,
  connector: 'replay' as const,
  received: 0,
  messagesPerMinute: 0,
  lastTopic: undefined,
  lastMessageAt: undefined,
  lastSummary: undefined,
  detail: undefined,
  error: undefined,
  recentMessageTimes: [] as number[],
};

function syncStatus(state: Pick<StreamingRuntimeStore, 'state' | 'connector' | 'received' | 'messagesPerMinute' | 'lastTopic'>) {
  sbStreaming({
    state: state.state,
    connector: state.connector,
    received: state.received,
    messagesPerMinute: state.messagesPerMinute,
    ...(state.lastTopic ? { lastTopic: state.lastTopic } : {}),
  });
}

export const useStreamingRuntimeStore = create<StreamingRuntimeStore>((set) => ({
  ...initialState,
  reportConnecting(connector, detail) {
    set((state) => {
      const next: StreamingRuntimeStore = {
        ...state,
        state: 'connecting',
        connector,
        detail,
        error: undefined,
      };
      syncStatus(next);
      return next;
    });
  },
  reportConnected(connector, detail) {
    set((state) => {
      const next: StreamingRuntimeStore = {
        ...state,
        state: 'streaming',
        connector,
        detail,
        error: undefined,
      };
      syncStatus(next);
      return next;
    });
  },
  reportMessage(message) {
    set((state) => {
      const cutoff = message.receivedAt - 60_000;
      const recentMessageTimes = [...state.recentMessageTimes.filter((entry) => entry >= cutoff), message.receivedAt];
      const next: StreamingRuntimeStore = {
        ...state,
        state: 'streaming',
        connector: message.connector,
        received: state.received + 1,
        messagesPerMinute: recentMessageTimes.length,
        lastTopic: message.topic,
        lastMessageAt: message.receivedAt,
        lastSummary: message.summary,
        recentMessageTimes,
        error: undefined,
      };
      syncStatus(next);
      return next;
    });
  },
  reportPaused(detail) {
    set((state) => {
      const next: StreamingRuntimeStore = {
        ...state,
        state: 'paused',
        detail,
      };
      syncStatus(next);
      return next;
    });
  },
  reportError(message, connector) {
    set((state) => {
      const next: StreamingRuntimeStore = {
        ...state,
        state: 'error',
        connector: connector ?? state.connector,
        detail: message,
        error: message,
      };
      syncStatus(next);
      return next;
    });
  },
  reset() {
    syncStatus(initialState);
    set({ ...initialState });
  },
}));
