import { create } from "zustand";
import type {
  AnalyticalFlowId,
  CompletedAnalysisRun,
  UrbanWorkflowRunManifest,
} from "@/features/urbanAnalytics/lib/types";
import { resolveLegacyRunManifest } from "@/features/urbanAnalytics/lib/runManifest";

// ---------------------------------------------------------------------------
// Legacy re-exports (consumed by SessionPersistence — will be removed in Phase 6)
// ---------------------------------------------------------------------------

export type Route = "IV" | "IM" | "PO";
export type EffectQuality = "clear" | "partial" | "none";
export type ChallengeStep = 0 | 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Bounds — prevent unbounded growth in long-running sessions
// ---------------------------------------------------------------------------
const MAX_COMPLETED_RUNS = 200;
const MAX_MANIFESTS = 200;

// ---------------------------------------------------------------------------
// Urban Analytics Flow Store
// ---------------------------------------------------------------------------

export interface FlowState {
  activeFlow: AnalyticalFlowId | null;
  currentStep: number;
  stepData: Record<string, unknown>;
  completedRuns: CompletedAnalysisRun[];
  /**
   * Sidecar manifest registry — keyed by runId.
   *
   * Kept separate from `completedRuns` so the existing CompletedAnalysisRun
   * shape is never mutated. Legacy runs that predate the manifest system will
   * have no entry here; call `lookupManifest` which falls back automatically
   * via `resolveLegacyRunManifest`.
   */
  manifests: Record<string, UrbanWorkflowRunManifest>;

  // Legacy compat fields (SessionPersistence reads these)
  step: ChallengeStep;
  eligible: boolean | null;
  contraindications: string;
  baselineScore?: number;
  baselineNotes: string;
  doseMg: number;
  route: Route;
  responseMinutes?: number;
  postScore?: number;
  effect: EffectQuality;
  adverse: string;
  outcomeText?: string;
  eligibilityAt?: number;
  baselineAt?: number;
  doseAt?: number;
  reassessAt?: number;
  completedAt?: number;
}

type FlowActions = {
  startFlow: (id: AnalyticalFlowId) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStepData: (key: string, value: unknown) => void;
  completeFlow: (run: CompletedAnalysisRun) => void;
  upsertCompletedRun: (run: CompletedAnalysisRun) => void;
  cancelFlow: () => void;
  reset: () => void;
  /**
   * Register a fully-built `UrbanWorkflowRunManifest` in the sidecar registry.
   * Call immediately after `completeFlow` or `upsertCompletedRun`.
   * Uses the manifest's `runId` as the registry key — overwrites on upsert.
   */
  registerManifest: (manifest: UrbanWorkflowRunManifest) => void;
  /**
   * Look up a manifest by runId.
   *
   * Returns the registered manifest if present.  Falls back to
   * `resolveLegacyRunManifest` for any `CompletedAnalysisRun` that exists in
   * `completedRuns` but has no registered manifest.  Returns null when the
   * runId is entirely unknown.
   */
  lookupManifest: (runId: string) => UrbanWorkflowRunManifest | null;

  // Legacy compat
  setStep: (s: ChallengeStep) => void;
  next: () => void;
  prev: () => void;
  set<K extends keyof FlowState>(k: K, v: FlowState[K]): void;
  mark: (which: "eligibilityAt" | "baselineAt" | "doseAt" | "reassessAt" | "completedAt") => void;
  buildOutcome: () => string;
};

const initialFlow: FlowState = {
  activeFlow: null,
  currentStep: 0,
  stepData: {},
  completedRuns: [],
  manifests: {},

  // Legacy
  step: 0,
  eligible: null,
  contraindications: "",
  baselineNotes: "",
  doseMg: 1,
  route: "IV",
  effect: "none",
  adverse: "",
};

export const useFlowStore = create<FlowState & FlowActions>((set, get) => ({
  ...initialFlow,

  // ---- Urban analytics actions ----
  startFlow: (id) => set({ activeFlow: id, currentStep: 0, stepData: {} }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  setStepData: (key, value) =>
    set((s) => ({ stepData: { ...s.stepData, [key]: value } })),
  completeFlow: (run) =>
    set((s) => ({
      completedRuns: [...s.completedRuns, run].slice(-MAX_COMPLETED_RUNS),
      activeFlow: null,
      currentStep: 0,
      stepData: {},
    })),
  upsertCompletedRun: (run) =>
    set((s) => {
      const index = s.completedRuns.findIndex((entry) => entry.runId === run.runId);
      if (index === -1) {
        return { completedRuns: [...s.completedRuns, run].slice(-MAX_COMPLETED_RUNS) };
      }

      const completedRuns = [...s.completedRuns];
      completedRuns[index] = run;
      return { completedRuns };
    }),
  cancelFlow: () => set({ activeFlow: null, currentStep: 0, stepData: {} }),
  reset: () => set({ ...initialFlow }),

  registerManifest: (manifest) =>
    set((s) => {
      const next = { ...s.manifests, [manifest.runId]: manifest };
      const keys = Object.keys(next);
      if (keys.length > MAX_MANIFESTS) {
        // Drop oldest entries (earliest keys inserted first)
        const excess = keys.length - MAX_MANIFESTS;
        for (let i = 0; i < excess; i++) {
          delete next[keys[i]];
        }
      }
      return { manifests: next };
    }),

  lookupManifest: (runId) => {
    const s = get();
    const registered = s.manifests[runId];
    if (registered !== undefined) return registered;
    // Fallback: synthesise a legacy-compatibility manifest for existing runs
    const legacyRun = s.completedRuns.find((r) => r.runId === runId);
    if (legacyRun !== undefined) return resolveLegacyRunManifest(legacyRun);
    return null;
  },

  // ---- Legacy compat actions ----
  setStep: (s) => set({ step: s }),
  next: () => set({ step: (Math.min(4, get().step + 1) as ChallengeStep) }),
  prev: () => set({ step: (Math.max(0, get().step - 1) as ChallengeStep) }),
  set: (k, v) => set({ [k]: v } as any),
  mark: (which) => set({ [which]: Date.now() } as any),

  buildOutcome: () => {
    const s = get();
    const ts = (n?: number) => (n ? new Date(n).toLocaleTimeString([], { hour12: false }) : "—");
    const elig = s.eligible === true ? "eligible" : s.eligible === false ? "not eligible" : "undetermined";
    const delta = (typeof s.baselineScore === "number" && typeof s.postScore === "number")
      ? ` (Δ = ${s.postScore - s.baselineScore})` : "";

    const parts = [
      `Analysis run — Outcome`,
      `Eligibility: ${elig}${s.contraindications ? `; considerations: ${s.contraindications}` : ""}.`,
      `Baseline: Score ${s.baselineScore ?? "n/a"}; notes: ${s.baselineNotes || "—"}.`,
      `Administered: ${s.doseMg} mg ${s.route} at ${ts(s.doseAt)}.`,
      `Reassessed: ${s.responseMinutes ? `${s.responseMinutes} min later` : "time n/a"}; post-Score ${s.postScore ?? "n/a"}${delta}.`,
      `Observed effect: ${s.effect}. Adverse effects: ${s.adverse || "none reported"}.`,
      `Timestamps — eligibility: ${ts(s.eligibilityAt)}, baseline: ${ts(s.baselineAt)}, dose: ${ts(s.doseAt)}, reassess: ${ts(s.reassessAt)}, completed: ${ts(s.completedAt)}.`,
      `Verify results against established methodologies.`,
    ];
    return parts.join("\n");
  },
}));
