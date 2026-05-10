import { useCallback, useState } from 'react';
import { queryToSQL } from '../nlp/QueryToSQL';
import type { GeneratedSQL, SandboxConfig } from '../nlp/types';
import { useGeoAIStatusStore } from '@/stores/useGeoAIStatusStore';

type QueryHistoryEntry = {
  prompt: string;
  result: GeneratedSQL;
  ranAt: number;
};

export function useQueryToSQLRunner() {
  const reportLoading = useGeoAIStatusStore((state) => state.reportLoading);
  const reportInferring = useGeoAIStatusStore((state) => state.reportInferring);
  const reportReady = useGeoAIStatusStore((state) => state.reportReady);
  const reportError = useGeoAIStatusStore((state) => state.reportError);

  const [result, setResult] = useState<GeneratedSQL | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback((prompt: string, sandbox?: Partial<SandboxConfig>) => {
    setIsRunning(true);
    setError(null);
    reportLoading('Preparing deterministic NL to SQL translation.', 'wasm');
    reportInferring('Classifying intent and validating SQL safety.');

    try {
      const next = queryToSQL(prompt, sandbox);
      setResult(next);
      setHistory((current) => [{ prompt, result: next, ranAt: Date.now() }, ...current].slice(0, 12));
      reportReady({
        loadedModels: 0,
        memoryUsedMB: 0,
        backend: 'wasm',
        engine: 'query_to_sql',
        message: next.safe
          ? `Generated ${next.parse.intent} SQL for ${next.referencedLayers.length || 1} referenced layer(s).`
          : next.rejectionReason ?? 'Query rejected by sandbox.',
      });
      return next;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Query translation failed.';
      setError(message);
      reportError(message, 'wasm');
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [reportError, reportInferring, reportLoading, reportReady]);

  return {
    error,
    history,
    isRunning,
    result,
    run,
  };
}
