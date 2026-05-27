/**
 * Standalone Zustand store for block/parcel zoning state.
 * Rules are persisted; assignments and metrics are session-only.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import {
  computeParcelMetrics,
  createZoningAssignment,
  createZoningRule,
  type ParcelMetrics,
  type ZoningAssignment,
  type ZoningRule,
  type ZoningRuleInput,
} from "@/services/map/zoning/ZoningRuleEngine";

/* ------------------------------------------------------------------ */
/*  State shape                                                         */
/* ------------------------------------------------------------------ */

export interface ZoningState {
  /* --- Rule library --- */
  rules: ZoningRule[];
  addRule: (input: ZoningRuleInput) => ZoningRule;
  updateRule: (id: string, patch: Partial<ZoningRuleInput>) => void;
  removeRule: (id: string) => void;

  /* --- Active parcel layer --- */
  activeLayerId: string | null;
  activeParcels: FeatureCollection<Polygon | MultiPolygon> | null;
  activeDeclaredCrs: string | null;

  setActiveParcelLayer: (
    layerId: string,
    parcels: FeatureCollection<Polygon | MultiPolygon>,
    declaredCrs: string | null,
  ) => void;
  clearActiveParcelLayer: () => void;

  /* --- Assignments (parcel → rule) --- */
  assignments: ZoningAssignment[];

  /**
   * Assign a rule to a parcel and immediately compute metrics.
   * Replaces any existing assignment for the same parcel.
   */
  assignRule: (
    parcelFeatureId: string | number,
    ruleId: string,
    buildings?: Feature<Polygon | MultiPolygon>[],
  ) => void;
  unassignRule: (parcelFeatureId: string | number) => void;
  clearAssignments: () => void;

  /* --- Computed metrics (indexed by parcelId string) --- */
  metricsIndex: Record<string, ParcelMetrics>;
}

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

export const useZoningStore = create<ZoningState>()(
  persist(
    (set, get) => ({
      /* ---- rules ---- */
      rules: [],

      addRule: (input) => {
        const rule = createZoningRule(input);
        set((s) => ({ rules: [...s.rules, rule] }));
        return rule;
      },

      updateRule: (id, patch) => {
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
          ),
        }));
      },

      removeRule: (id) => {
        set((s) => ({
          rules: s.rules.filter((r) => r.id !== id),
          assignments: s.assignments.filter((a) => a.ruleId !== id),
        }));
      },

      /* ---- active parcel layer ---- */
      activeLayerId: null,
      activeParcels: null,
      activeDeclaredCrs: null,

      setActiveParcelLayer: (layerId, parcels, declaredCrs) => {
        set({ activeLayerId: layerId, activeParcels: parcels, activeDeclaredCrs: declaredCrs });
      },

      clearActiveParcelLayer: () => {
        set({ activeLayerId: null, activeParcels: null, activeDeclaredCrs: null });
      },

      /* ---- assignments ---- */
      assignments: [],
      metricsIndex: {},

      assignRule: (parcelFeatureId, ruleId, buildings = []) => {
        const { activeParcels, activeDeclaredCrs, rules } = get();
        const rule = rules.find((r) => r.id === ruleId) ?? null;

        const parcel = activeParcels?.features.find(
          (f) =>
            String(f.id ?? f.properties?.id) === String(parcelFeatureId),
        ) ?? null;

        let metrics: ParcelMetrics | null = null;
        if (parcel) {
          metrics = computeParcelMetrics({
            parcel,
            buildings,
            declaredCrs: activeDeclaredCrs,
            rule,
          });
        }

        const assignment = createZoningAssignment(parcelFeatureId, ruleId, metrics);

        set((s) => ({
          assignments: [
            ...s.assignments.filter(
              (a) => String(a.parcelFeatureId) !== String(parcelFeatureId),
            ),
            assignment,
          ],
          metricsIndex: metrics
            ? { ...s.metricsIndex, [String(parcelFeatureId)]: metrics }
            : s.metricsIndex,
        }));
      },

      unassignRule: (parcelFeatureId) => {
        set((s) => ({
          assignments: s.assignments.filter(
            (a) => String(a.parcelFeatureId) !== String(parcelFeatureId),
          ),
        }));
      },

      clearAssignments: () => set({ assignments: [], metricsIndex: {} }),
    }),
    {
      name: "urban.config.zoning",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ rules: s.rules }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectZoningRules = (s: ZoningState) => s.rules;
export const selectZoningAssignments = (s: ZoningState) => s.assignments;
export const selectMetricsForParcel = (parcelId: string | number) => (s: ZoningState) =>
  s.metricsIndex[String(parcelId)] ?? null;
export const selectAssignmentForParcel = (parcelId: string | number) => (s: ZoningState) =>
  s.assignments.find((a) => String(a.parcelFeatureId) === String(parcelId)) ?? null;
