/**
 * Massing scenario store — Zustand + persist.
 *
 * Persists scenario metadata (parcelId, ruleId, params, label, etc.) but NOT
 * buildingGeometries, which are heavy Feature<Polygon>[] and must stay
 * transient (re-generated on demand from MassingEngine).
 *
 * Namespace: "urban.config.massing"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Feature, Polygon } from "geojson";
import type {
  MapScenarioComparisonEvidenceMetadata,
  MapScenarioComparisonCandidateReference,
  MapScenarioComparisonMetricReference,
  MapScenarioComparisonMetricDelta,
} from "@/centerpanel/components/map/mapTypes";
import type { MassingParams, MassingAlternative } from "@/services/map/zoning/MassingEngine";
import { generateMassingAlternative } from "@/services/map/zoning/MassingEngine";
import type { ZoningRule } from "@/services/map/zoning/ZoningRuleEngine";

/* ------------------------------------------------------------------ */
/*  Domain types                                                        */
/* ------------------------------------------------------------------ */

export interface MassingScenario {
  id: string;
  label: string;
  parcelId: string | number;
  ruleId: string;
  isBaseline: boolean;
  params: MassingParams;
  /** Alternative result — null until generated. buildingGeometries stripped during persist. */
  alternative: MassingAlternative | null;
  createdAt: string;
}

export interface AddMassingScenarioInput {
  label?: string;
  parcel: Feature<Polygon>;
  rule: ZoningRule;
  params: Partial<MassingParams> & {
    targetFloors?: number;
    floors?: number;
    useBaseline?: boolean;
  };
  declaredCrs?: string | null;
  isBaseline?: boolean;
  parcelId?: string | number;
  ruleId?: string;
}

/* ------------------------------------------------------------------ */
/*  Persisted shape (buildingGeometries stripped)                      */
/* ------------------------------------------------------------------ */

type PersistedMassingScenario = Omit<MassingScenario, "alternative"> & {
  alternative: Omit<MassingAlternative, "buildingGeometries"> | null;
};

/* ------------------------------------------------------------------ */
/*  State shape                                                         */
/* ------------------------------------------------------------------ */

export interface MassingState {
  scenarios: MassingScenario[];
  activeScenarioId: string | null;
  comparisonMetadata: MapScenarioComparisonEvidenceMetadata | null;

  /**
   * Add a new massing scenario.
   * If parcel + rule are provided the alternative is generated immediately;
   * otherwise alternative is null until generateAlternative is called.
   */
  addScenario(input: AddMassingScenarioInput): MassingScenario;
  addScenario(
    parcelId: string | number,
    ruleId: string,
    params: MassingParams,
    label?: string,
    isBaseline?: boolean,
    parcel?: Feature<Polygon> | null,
    rule?: ZoningRule | null,
    declaredCrs?: string | null,
  ): MassingScenario;

  /** Remove a scenario by ID. */
  removeScenario(id: string): void;

  /** Set the active (highlighted) scenario. */
  setActiveScenario(id: string): void;

  /**
   * (Re)generate the MassingAlternative for an existing scenario.
   * Requires the parcel geometry + rule to be passed in.
   */
  generateAlternative(
    scenarioId: string,
    parcel: Feature<Polygon>,
    rule: ZoningRule,
    declaredCrs: string | null,
  ): MassingAlternative | null;

  /**
   * Produce a MapScenarioComparisonEvidenceMetadata from the current
   * scenarios. Requires ≥2 scenarios with computed alternatives.
   * Returns null when preconditions are not met.
   */
  generateComparison(): MapScenarioComparisonEvidenceMetadata | null;

  /** Clear all scenarios and comparison. */
  clearAll(): void;
}

type PositionalAddScenarioArgs = [
  parcelId: string | number,
  ruleId: string,
  params: MassingParams,
  label?: string,
  isBaseline?: boolean,
  parcel?: Feature<Polygon> | null,
  rule?: ZoningRule | null,
  declaredCrs?: string | null,
];

function getParcelIdentifier(parcel: Feature<Polygon>): string | number | null {
  if (typeof parcel.id === "string" || typeof parcel.id === "number") {
    return parcel.id;
  }
  const propertyId = parcel.properties?.id;
  return typeof propertyId === "string" || typeof propertyId === "number" ? propertyId : null;
}

function resolveObjectAddScenarioArgs(input: AddMassingScenarioInput): PositionalAddScenarioArgs {
  const parcelId = input.parcelId ?? input.params.parcelId ?? getParcelIdentifier(input.parcel) ?? "parcel";
  const floorCount = input.params.floorCount ?? input.params.targetFloors ?? input.params.floors ?? 1;
  const params: MassingParams = {
    parcelId,
    buildingCount: input.params.buildingCount ?? 1,
    floorCount,
    coverageRatio: input.params.coverageRatio ?? 0.35,
  };
  return [
    parcelId,
    input.ruleId ?? input.rule.id,
    params,
    input.label,
    input.isBaseline ?? input.params.useBaseline,
    input.parcel,
    input.rule,
    input.declaredCrs ?? null,
  ];
}

/* ------------------------------------------------------------------ */
/*  ID helpers                                                          */
/* ------------------------------------------------------------------ */

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

export const useMassingStore = create<MassingState>()(
  persist(
    (set, get) => ({
      scenarios: [],
      activeScenarioId: null,
      comparisonMetadata: null,

      addScenario(...args: [AddMassingScenarioInput] | PositionalAddScenarioArgs) {
        const [
          parcelId,
          ruleId,
          params,
          label,
          isBaseline,
          parcel,
          rule,
          declaredCrs,
        ] = typeof args[0] === "object" && "parcel" in args[0]
          ? resolveObjectAddScenarioArgs(args[0])
          : args;
        const id = `msc-${shortId()}`;
        const now = new Date().toISOString();
        const resolvedLabel =
          label ??
          `${isBaseline ? "Baseline" : "Scenario"} (${params.floorCount} fl, ${(params.coverageRatio * 100).toFixed(0)}%)`;

        let alternative: MassingAlternative | null = null;
        if (parcel && rule && declaredCrs !== undefined) {
          try {
            const alt = generateMassingAlternative(parcel, rule, params, declaredCrs ?? null);
            alternative = alt;
          } catch {
            alternative = null;
          }
        }

        const scenario: MassingScenario = {
          id,
          label: resolvedLabel,
          parcelId,
          ruleId,
          isBaseline: isBaseline ?? false,
          params,
          alternative,
          createdAt: now,
        };

        set((s) => ({ scenarios: [...s.scenarios, scenario] }));
        return scenario;
      },

      removeScenario(id) {
        set((s) => ({
          scenarios: s.scenarios.filter((sc) => sc.id !== id),
          activeScenarioId: s.activeScenarioId === id ? null : s.activeScenarioId,
        }));
      },

      setActiveScenario(id) {
        set({ activeScenarioId: id });
      },

      generateAlternative(scenarioId, parcel, rule, declaredCrs) {
        const scenario = get().scenarios.find((s) => s.id === scenarioId);
        if (!scenario) return null;

        const alternative = generateMassingAlternative(
          parcel,
          rule,
          scenario.params,
          declaredCrs,
        );

        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === scenarioId ? { ...sc, alternative } : sc,
          ),
        }));

        return alternative;
      },

      generateComparison() {
        const { scenarios } = get();
        const withAlternatives = scenarios.filter((s) => s.alternative !== null);

        if (withAlternatives.length < 2) return null;

        const baseline = withAlternatives.find((s) => s.isBaseline) ?? withAlternatives[0]!;
        const candidates = withAlternatives.filter((s) => s.id !== baseline.id);

        if (candidates.length === 0) return null;

        const comparisonId = `cmp-${shortId()}`;
        const now = new Date().toISOString();

        const candidateRefs: MapScenarioComparisonCandidateReference[] = candidates.map((c) => ({
          scenarioId: c.id,
          scenarioName: c.label,
          runId: null,
          flowId: null,
          assumptionCount: 0,
        }));

        const farMetric: MapScenarioComparisonMetricReference = {
          indicatorId: "achievedFAR",
          label: "Achieved FAR",
          unit: "ratio",
          direction: "lower",
        };

        const baselineFAR = baseline.alternative?.achievedFAR ?? 0;
        const deltas: MapScenarioComparisonMetricDelta[] = candidates.map((c) => {
          const candidateFAR = c.alternative?.achievedFAR ?? 0;
          const absoluteDelta = candidateFAR - baselineFAR;
          const percentDelta = baselineFAR !== 0 ? (absoluteDelta / baselineFAR) * 100 : null;
          return {
            scenarioId: c.id,
            indicatorId: "achievedFAR",
            baselineValue: baselineFAR,
            candidateValue: candidateFAR,
            absoluteDelta,
            percentDelta,
            improvementDelta: -absoluteDelta, // lower FAR = improvement for constrained zones
          };
        });

        const activeScenarioId = get().activeScenarioId ?? candidates[0]!.id;

        const metadata: MapScenarioComparisonEvidenceMetadata = {
          version: 1,
          comparisonId,
          runId: null,
          createdAt: now,
          baseline: {
            label: baseline.label,
            runId: null,
            description: null,
          },
          candidates: candidateRefs,
          indicatorsCompared: [farMetric],
          activeScenarioId,
          comparisonMetric: farMetric,
          deltaMode: "absolute",
          deltas,
          mapOutputIds: [],
          chartOutputIds: [],
          dataOutputIds: [],
          outputLayerIds: [],
          sourceRunIds: [],
          evidenceArtifactIds: [],
          uncertaintyNotes: [
            "Building geometries are simplified rectangular approximations.",
            "Floor height assumed 3.3 m per floor.",
          ],
          limitations: [
            "Massing engine does not account for solar access, shadow, or wind constraints.",
            "Coverage computed over buildable (post-setback) area, not full parcel.",
          ],
          policyInterpretationMode: "guidance",
          guidanceSummary: `Comparison of ${withAlternatives.length} massing scenarios. Baseline: ${baseline.label}.`,
          handoff: {
            reportHandoffId: `rpt-${comparisonId}`,
            dashboardBindingId: `db-${comparisonId}`,
            reportCompatible: true,
            dashboardCompatible: false,
            refreshMode: "static",
            liveStateLabel: "snapshot",
          },
        };

        set({ comparisonMetadata: metadata });
        return metadata;
      },

      clearAll() {
        set({ scenarios: [], activeScenarioId: null, comparisonMetadata: null });
      },
    }),
    {
      name: "urban.config.massing",
      storage: createJSONStorage(() => localStorage),
      /**
       * Persist scenario metadata but strip buildingGeometries (heavy geometry).
       * comparisonMetadata is lightweight (IDs + scalars) so it is persisted.
       */
      partialize: (s): {
        scenarios: PersistedMassingScenario[];
        activeScenarioId: string | null;
        comparisonMetadata: MapScenarioComparisonEvidenceMetadata | null;
      } => ({
        scenarios: s.scenarios.map((sc) => ({
          ...sc,
          alternative: sc.alternative
            ? {
                id: sc.alternative.id,
                scenarioLabel: sc.alternative.scenarioLabel,
                params: sc.alternative.params,
                envelopeResult: sc.alternative.envelopeResult,
                buildingFootprintAreaM2: sc.alternative.buildingFootprintAreaM2,
                totalFloorAreaM2: sc.alternative.totalFloorAreaM2,
                achievedFAR: sc.alternative.achievedFAR,
                achievedCoverage: sc.alternative.achievedCoverage,
                maxHeightMetres: sc.alternative.maxHeightMetres,
                farCompliant: sc.alternative.farCompliant,
                coverageCompliant: sc.alternative.coverageCompliant,
                heightCompliant: sc.alternative.heightCompliant,
                compliant: sc.alternative.compliant,
                caveats: sc.alternative.caveats,
                // buildingGeometries intentionally omitted
              }
            : null,
        })),
        activeScenarioId: s.activeScenarioId,
        comparisonMetadata: s.comparisonMetadata,
      }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectMassingScenarios = (s: MassingState) => s.scenarios;
export const selectActiveScenarioId = (s: MassingState) => s.activeScenarioId;
export const selectComparisonMetadata = (s: MassingState) => s.comparisonMetadata;
export const selectBaselineScenario = (s: MassingState) =>
  s.scenarios.find((sc) => sc.isBaseline) ?? s.scenarios[0] ?? null;
