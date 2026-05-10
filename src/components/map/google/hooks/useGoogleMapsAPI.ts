/**
 * Google Maps API hook — key management, quota tracking, budget alerting.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

/* ------------------------------------------------------------------ */
/*  Quota store (persisted in-memory per session)                      */
/* ------------------------------------------------------------------ */

interface QuotaState {
  /** Cumulative API call counts by service since last reset. */
  calls: Record<string, number>;
  /** Monthly budget in USD (0 = unlimited). */
  monthlyBudget: number;
  /** Estimated cost in USD this billing cycle. */
  estimatedCost: number;
  /** Last reset timestamp (epoch ms). */
  lastReset: number;

  increment: (service: string, count?: number, unitCost?: number) => void;
  setBudget: (usd: number) => void;
  reset: () => void;
}

export const useGoogleQuota = create<QuotaState>((set) => ({
  calls: {},
  monthlyBudget: 0,
  estimatedCost: 0,
  lastReset: Date.now(),

  increment: (service, count = 1, unitCost = 0) =>
    set((s) => {
      const prev = s.calls[service] ?? 0;
      const newCost = s.estimatedCost + count * unitCost;
      return {
        calls: { ...s.calls, [service]: prev + count },
        estimatedCost: newCost,
      };
    }),

  setBudget: (usd) => set({ monthlyBudget: usd }),

  reset: () =>
    set({ calls: {}, estimatedCost: 0, lastReset: Date.now() }),
}));

/* ------------------------------------------------------------------ */
/*  Key reader                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'synapse.google.maps.key';

function readApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export interface GoogleMapsAPIState {
  apiKey: string;
  isLoaded: boolean;
  error: string | null;
  /** True when budget ≥ 80 % consumed. */
  budgetWarning: boolean;
}

/**
 * Hook that manages the Google Maps API key, loading state, and quota.
 *
 * Reads the key from `localStorage` (`synapse.google.maps.key`) so the
 * app can persist it independently of the AI-settings stores.
 */
export function useGoogleMapsAPI(): GoogleMapsAPIState {
  const [apiKey] = useState<string>(() => readApiKey());
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef(false);

  const budget = useGoogleQuota((s) => s.monthlyBudget);
  const cost = useGoogleQuota((s) => s.estimatedCost);
  const budgetWarning = budget > 0 && cost >= budget * 0.8;

  /* Detect when the Google Maps JS API has been fully loaded */
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // If the script is already loaded (e.g. by APIProvider), mark ready.
    if (typeof google !== 'undefined' && google.maps) {
      setIsLoaded(true);
      return;
    }

    // Otherwise, poll briefly (APIProvider loads the script asynchronously).
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (typeof google !== 'undefined' && google.maps) {
        setIsLoaded(true);
        clearInterval(timer);
      } else if (attempts > 50) {
        // 5 s timeout
        setError('Google Maps JS API failed to load');
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [apiKey]);

  return { apiKey, isLoaded, error, budgetWarning };
}

/**
 * Convenience: record a Google Maps API call and its cost.
 */
export function useTrackApiCall() {
  const increment = useGoogleQuota((s) => s.increment);
  return useCallback(
    (service: string, count = 1, unitCost = 0) =>
      increment(service, count, unitCost),
    [increment],
  );
}
