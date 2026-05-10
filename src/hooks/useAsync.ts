import { type DependencyList, useCallback, useEffect, useState } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncReturn<T, Args extends unknown[] = []> extends UseAsyncState<T> {
  execute: (...args: Args) => Promise<void>;
  reset: () => void;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = true,
  deps: DependencyList = [],
  initialArgs?: Args,
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const executeImmediate = useCallback(() => {
    if (initialArgs) {
      return execute(...initialArgs);
    }

    return (execute as () => Promise<void>)();
  }, [execute, initialArgs]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (immediate) {
      void executeImmediate();
    }
  }, [executeImmediate, immediate, ...deps]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return { ...state, execute, reset };
}

export function useFetch<T>(
  url: string,
  options?: RequestInit,
  immediate = true
): UseAsyncReturn<T> {
  const fetchData = useCallback(async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }, [url, options]);

  return useAsync<T>(fetchData, immediate, [url, options]);
}

export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
): [UseAsyncState<T>, (...args: Args) => Promise<void>] {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    },
    [asyncFunction]
  );

  return [state, execute];
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): UseAsyncReturn<T> & { retry: () => void; retryCount: number } {
  const [retryCount, setRetryCount] = useState(0);

  const retryWrapper = useCallback(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        setRetryCount(i);
        return await asyncFunction();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }, [asyncFunction, maxRetries, delay]);

  const asyncState = useAsync(retryWrapper, false);
  const { execute } = asyncState;

  const retry = useCallback(() => {
    setRetryCount(0);
    void execute();
  }, [execute]);

  return {
    ...asyncState,
    retry,
    retryCount,
  };
}
