/**
 * useSunShadowStore — Zustand + persist.
 *
 * Persists timeline/location/scenario metadata but strips shadowPolygon arrays
 * (heavy geometry). Results are recomputed on demand.
 *
 * Namespace: "urban.config.sunshadow"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Feature, Polygon } from "geojson";
import { computeSolarPosition } from "@/services/map/scene3d/SolarPositionService";
import {
  computeShadowAnalysis,
  type ShadowAnalysisResult,
  type ShadowAssumptions,
  type ShadowScenario,
} from "@/services/map/scene3d/SunShadowEngine";

/* ------------------------------------------------------------------ */
/*  Evidence payload                                                    */
/* ------------------------------------------------------------------ */

export interface ShadowEvidencePayload {
  evidenceId: string;
  scenarioId: string;
  label: string;
  dateTime: string;
  latitude: number;
  longitude: number;
  crs: "EPSG:4326";
  solarModel: ShadowAssumptions["solarModel"];
  verticalDatum: ShadowAssumptions["verticalDatum"];
  runtimeMode: ShadowAssumptions["runtimeMode"];
  shadowCoverageRatio: number;
  totalShadowAreaM2: number;
  parcelAreaM2: number;
  sunBelowHorizon: boolean;
  caveats: string[];
  publishedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Persisted scenario shape (shadowPolygons stripped)                  */
/* ------------------------------------------------------------------ */

type PersistedShadowScenario = Omit<ShadowScenario, "result"> & {
  result: Omit<ShadowAnalysisResult, "buildingResults"> & {
    buildingResults: Array<Omit<ShadowAnalysisResult["buildingResults"][number], "shadowPolygon">>;
  } | null;
};

/* ------------------------------------------------------------------ */
/*  State shape                                                         */
/* ------------------------------------------------------------------ */

export interface SunShadowState {
  /** Hours of day available on the scrubber, e.g. [6,8,10,12,14,16,18]. */
  timelineHours: number[];
  /** Index into timelineHours. */
  activeHourIndex: number;
  /** ISO UTC string for the active hour (date fixed to current date, hour from timelineHours). */
  activeDateTime: string;
  /** Default: Istanbul */
  latitude: number;
  longitude: number;
  scenarios: ShadowScenario[];
  activeScenarioId: string | null;

  /* ---- actions ---- */
  setActiveHour(index: number): void;
  setLocation(lat: number, lon: number): void;
  addScenario(
    buildings: Feature<Polygon>[],
    heightsM: number[],
    parcelAreaM2: number,
    label?: string,
  ): ShadowScenario;
  removeScenario(id: string): void;
  publishEvidence(scenarioId: string): ShadowEvidencePayload;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function buildDateTime(baseDate: Date, hour: number): string {
  const d = new Date(baseDate);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Derive a UTC ISO string from the active hour. */
function deriveDateTime(hourIndex: number, timelineHours: number[]): string {
  const hour = timelineHours[hourIndex] ?? 12;
  const now = new Date();
  return buildDateTime(now, hour);
}

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

export const useSunShadowStore = create<SunShadowState>()(
  persist(
    (set, get) => ({
      timelineHours: [6, 8, 10, 12, 14, 16, 18],
      activeHourIndex: 3, // noon (index 3 → hour 12)
      activeDateTime: buildDateTime(new Date(), 12),
      latitude: 41.0,
      longitude: 28.9,
      scenarios: [],
      activeScenarioId: null,

      setActiveHour(index: number) {
        const { timelineHours, latitude, longitude, scenarios } = get();
        const safeIndex = Math.max(0, Math.min(index, timelineHours.length - 1));
        const activeDateTime = deriveDateTime(safeIndex, timelineHours);
        const solarPosition = computeSolarPosition(latitude, longitude, activeDateTime);

        // Recompute all existing scenario results for the new time
        const updatedScenarios = scenarios.map((sc) => {
          const result = computeShadowAnalysis({
            buildings: sc.buildings,
            heightsM: sc.heightsM,
            parcelAreaM2: sc.parcelAreaM2,
            solarPosition,
            dateTime: activeDateTime,
            scenarioId: sc.id,
            geometrySource: sc.geometrySource,
          });
          return { ...sc, result };
        });

        set({
          activeHourIndex: safeIndex,
          activeDateTime,
          scenarios: updatedScenarios,
        });
      },

      setLocation(lat: number, lon: number) {
        const { activeDateTime, scenarios } = get();
        const solarPosition = computeSolarPosition(lat, lon, activeDateTime);

        const updatedScenarios = scenarios.map((sc) => {
          const result = computeShadowAnalysis({
            buildings: sc.buildings,
            heightsM: sc.heightsM,
            parcelAreaM2: sc.parcelAreaM2,
            solarPosition,
            dateTime: activeDateTime,
            scenarioId: sc.id,
            geometrySource: sc.geometrySource,
          });
          return { ...sc, result };
        });

        set({ latitude: lat, longitude: lon, scenarios: updatedScenarios });
      },

      addScenario(buildings, heightsM, parcelAreaM2, label) {
        const { latitude, longitude, activeDateTime, scenarios } = get();
        const id = `ssc-${shortId()}`;
        const solarPosition = computeSolarPosition(latitude, longitude, activeDateTime);

        const result = computeShadowAnalysis({
          buildings,
          heightsM,
          parcelAreaM2,
          solarPosition,
          dateTime: activeDateTime,
          scenarioId: id,
          geometrySource: "user-provided",
        });

        const scenario: ShadowScenario = {
          id,
          label: label ?? `Shadow scenario (${new Date(activeDateTime).toUTCString().slice(17, 22)})`,
          buildings,
          heightsM,
          parcelAreaM2,
          geometrySource: "user-provided",
          createdAt: new Date().toISOString(),
          result,
        };

        set({
          scenarios: [...scenarios, scenario],
          activeScenarioId: id,
        });

        return scenario;
      },

      removeScenario(id: string) {
        set((s) => ({
          scenarios: s.scenarios.filter((sc) => sc.id !== id),
          activeScenarioId: s.activeScenarioId === id ? null : s.activeScenarioId,
        }));
      },

      publishEvidence(scenarioId: string): ShadowEvidencePayload {
        const { scenarios, latitude, longitude } = get();
        const scenario = scenarios.find((sc) => sc.id === scenarioId);
        if (!scenario || !scenario.result) {
          throw new Error(`SunShadowStore: scenario "${scenarioId}" not found or has no result`);
        }
        const { result } = scenario;
        const payload: ShadowEvidencePayload = {
          evidenceId: `ev-sunshadow-${shortId()}`,
          scenarioId,
          label: scenario.label,
          dateTime: result.dateTime,
          latitude,
          longitude,
          crs: "EPSG:4326",
          solarModel: result.assumptions.solarModel,
          verticalDatum: result.assumptions.verticalDatum,
          runtimeMode: result.assumptions.runtimeMode,
          shadowCoverageRatio: result.shadowCoverageRatio,
          totalShadowAreaM2: result.totalShadowAreaM2,
          parcelAreaM2: result.parcelAreaM2,
          sunBelowHorizon: result.sunBelowHorizon,
          caveats: result.caveats,
          publishedAt: new Date().toISOString(),
        };
        return payload;
      },
    }),
    {
      name: "urban.config.sunshadow",
      storage: createJSONStorage(() => localStorage),
      /**
       * Persist lightweight state only.
       * Strip shadowPolygon (Feature<Polygon>) from each buildingResult — those are heavy geometry.
       */
      partialize: (s): {
        timelineHours: number[];
        activeHourIndex: number;
        activeDateTime: string;
        latitude: number;
        longitude: number;
        activeScenarioId: string | null;
        scenarios: PersistedShadowScenario[];
      } => ({
        timelineHours: s.timelineHours,
        activeHourIndex: s.activeHourIndex,
        activeDateTime: s.activeDateTime,
        latitude: s.latitude,
        longitude: s.longitude,
        activeScenarioId: s.activeScenarioId,
        scenarios: s.scenarios.map((sc) => ({
          id: sc.id,
          label: sc.label,
          buildings: sc.buildings,
          heightsM: sc.heightsM,
          parcelAreaM2: sc.parcelAreaM2,
          geometrySource: sc.geometrySource,
          createdAt: sc.createdAt,
          result: sc.result
            ? {
                scenarioId: sc.result.scenarioId,
                dateTime: sc.result.dateTime,
                solarPosition: sc.result.solarPosition,
                totalShadowAreaM2: sc.result.totalShadowAreaM2,
                parcelAreaM2: sc.result.parcelAreaM2,
                shadowCoverageRatio: sc.result.shadowCoverageRatio,
                sunBelowHorizon: sc.result.sunBelowHorizon,
                assumptions: sc.result.assumptions,
                caveats: sc.result.caveats,
                // Strip shadowPolygon from each buildingResult
                buildingResults: sc.result.buildingResults.map((br) => ({
                  buildingId: br.buildingId,
                  heightMetres: br.heightMetres,
                  shadowLengthM: br.shadowLengthM,
                  shadowAreaM2: br.shadowAreaM2,
                  // shadowPolygon intentionally omitted
                })),
              }
            : null,
        })),
      }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectSunShadowScenarios = (s: SunShadowState) => s.scenarios;
export const selectActiveScenario = (s: SunShadowState) =>
  s.scenarios.find((sc) => sc.id === s.activeScenarioId) ?? null;
export const selectActiveHour = (s: SunShadowState) =>
  s.timelineHours[s.activeHourIndex] ?? 12;
