import type {
  CompletedAnalysisRun,
  UrbanMethodCapabilityStatus,
  UrbanMethodValidityEnvelope,
} from "@/features/urbanAnalytics/lib/types";
import type { FlowId } from "./flowTypes";

export type WorkflowJourneyId =
  | "foundation"
  | "indicator_risk"
  | "three_d"
  | "simulation"
  | "decision";

export interface WorkflowJourneyMeta {
  id: WorkflowJourneyId;
  label: string;
  hint: string;
}

export interface WorkflowExperienceMeta {
  label: string;
  journey: WorkflowJourneyId;
  quickUse: string;
  inputs: string;
  outputs: string;
  complexity: "Guided" | "Advanced";
  order: number;
  validityEnvelope?: UrbanMethodValidityEnvelope;
  capabilityStatus?: UrbanMethodCapabilityStatus;
}

export const WORKFLOW_JOURNEYS: WorkflowJourneyMeta[] = [
  {
    id: "foundation",
    label: "Foundation",
    hint: "Open a core flow when you need a first interpretable result rather than a full planning scenario.",
  },
  {
    id: "indicator_risk",
    label: "Indicators & Risk",
    hint: "Build evidence layers, disparities, and composite performance before simulating interventions.",
  },
  {
    id: "three_d",
    label: "3D Context",
    hint: "Use these flows when morphology, semantic city models, or solar exposure matter.",
  },
  {
    id: "simulation",
    label: "Simulation",
    hint: "Generate future states, service siting options, and intervention variants.",
  },
  {
    id: "decision",
    label: "Decision Support",
    hint: "Bring multiple alternatives together and turn them into reporting-ready trade-off dashboards.",
  },
];

export const WORKFLOW_EXPERIENCE: Partial<Record<FlowId, WorkflowExperienceMeta>> = {
  site_suitability: {
    label: "Core",
    journey: "foundation",
    quickUse: "Rank sites when you need a fast, criteria-based development suitability surface.",
    inputs: "Criteria, layers, weights, and constraint masks.",
    outputs: "Suitability surface, ranked sites, and sensitivity summary.",
    complexity: "Guided",
    order: 1,
  },
  accessibility: {
    label: "Core",
    journey: "foundation",
    quickUse: "Measure who can reach which services under chosen travel modes and thresholds.",
    inputs: "Travel mode, thresholds, POIs, and optional equity groups.",
    outputs: "Isochrones, accessibility indices, and service gaps.",
    complexity: "Guided",
    order: 2,
  },
  vulnerability: {
    label: "Core",
    journey: "indicator_risk",
    quickUse: "Assemble exposure, sensitivity, and capacity into a defensible risk picture.",
    inputs: "Hazard layers and social or environmental indicators.",
    outputs: "Risk map, vulnerability score, and interpretive narrative.",
    complexity: "Advanced",
    order: 3,
  },
  urban_morphology: {
    label: "Morphology",
    journey: "foundation",
    quickUse: "Group districts into evidence-based morphotypes before moving into scenario or equity workflows.",
    inputs: "Selected morphology indicators, optional population weighting, k, and seed.",
    outputs: "Published morphotype layer, silhouette diagnostics, and saved clustering run.",
    complexity: "Guided",
    order: 4,
  },
  indicator_composite: {
    label: "Index Builder",
    journey: "indicator_risk",
    quickUse: "Build a rigorous OECD/JRC-style index with uncertainty and robustness checks.",
    inputs: "Indicators, imputation, normalization, weighting, and aggregation choices.",
    outputs: "Composite scores, confidence bands, and reproducible configuration exports.",
    complexity: "Advanced",
    order: 4,
  },
  equity_audit: {
    label: "Equity Audit",
    journey: "indicator_risk",
    quickUse: "Audit how benefits and burdens are distributed across groups and places.",
    inputs: "Demographics, amenities or hazards, and a disparity measure.",
    outputs: "Gap maps, group disparities, and reporting-ready findings.",
    complexity: "Advanced",
    order: 5,
  },
  change_detection: {
    label: "Change Detection",
    journey: "indicator_risk",
    quickUse: "Track where land-use or environmental conditions changed between two moments.",
    inputs: "T0/T1 layers, thresholds, and change-class definitions.",
    outputs: "Change polygons, transition summaries, and hotspot locations.",
    complexity: "Guided",
    order: 6,
  },
  emerging_hot_spot: {
    label: "Temporal Cluster",
    journey: "indicator_risk",
    quickUse: "Detect which districts are intensifying, persistent, diminishing, or sporadic hot or cold spots across time.",
    inputs: "Polygon layer, ordered numeric time fields, contiguity choice, and significance filter.",
    outputs: "Playback-ready temporal layer, category legend, summary counts, and a saved run for review.",
    complexity: "Advanced",
    order: 7,
  },
  object_detection: {
    label: "Object Detection",
    journey: "indicator_risk",
    quickUse: "Screen imagery for urban objects, inspect what was retained, then publish the result into Map Explorer and Run Review.",
    inputs: "Scene imagery, target classes, and retained-confidence threshold.",
    outputs: "Published detection polygons, class-count summaries, and a saved analytical run for downstream review.",
    complexity: "Guided",
    order: 8,
  },
  voxcity_3d: {
    label: "3D Context",
    journey: "three_d",
    quickUse: "Turn building footprints into an explorable 3D context before detailed modelling.",
    inputs: "Footprints and optional height attributes.",
    outputs: "Extruded buildings, style controls, and map-ready footprint layers.",
    complexity: "Guided",
    order: 9,
  },
  cityjson_loader: {
    label: "CityJSON",
    journey: "three_d",
    quickUse: "Inspect semantic city objects when a project already has CityJSON data.",
    inputs: "CityJSON v2 file and object attributes.",
    outputs: "Semantic surfaces, metadata inventory, and object inspection.",
    complexity: "Advanced",
    order: 10,
  },
  sunlight_sim: {
    label: "Solar Exposure",
    journey: "three_d",
    quickUse: "Evaluate shadow movement and solar exposure at neighbourhood scale.",
    inputs: "3D building data, date range, time window, and interval.",
    outputs: "Shadow animation, exposure summaries, and exportable solar overlays.",
    complexity: "Advanced",
    order: 11,
  },
  urban_growth_ca: {
    label: "Growth Simulation",
    journey: "simulation",
    quickUse: "Generate plausible urban expansion scenarios using constraints and suitability.",
    inputs: "Historical land-use states, suitability surfaces, and constraints.",
    outputs: "Predicted urban states, validation metrics, and scenario stubs for comparison.",
    complexity: "Advanced",
    order: 12,
  },
  facility_optimisation: {
    label: "Facility Siting",
    journey: "simulation",
    quickUse: "Test efficiency versus equity trade-offs in facility siting.",
    inputs: "Candidate sites, demand points, model choice, and equity controls.",
    outputs: "Selected sites, catchments, demand coverage, and burden diagnostics.",
    complexity: "Advanced",
    order: 13,
  },
  system_dynamics: {
    label: "System Dynamics",
    journey: "simulation",
    quickUse: "Explore how housing, jobs, transit, and green protection reshape long-run urban dynamics.",
    inputs: "Policy lever sliders, simulation horizon, and the teaching baseline stocks.",
    outputs: "Annual stock traces, stock-flow and causal-loop diagrams, and exportable simulation artifacts.",
    complexity: "Advanced",
    order: 14,
  },
  scenario_comparison: {
    label: "Scenario Comparison",
    journey: "decision",
    quickUse: "Compare 2-4 intervention packages using delta maps, charts, and Pareto logic.",
    inputs: "Baseline, scenario levers, aligned indicators, and completed scenario runs if available.",
    outputs: "Dashboard, trade-off matrix, delta layers, and narrative summary.",
    complexity: "Advanced",
    order: 15,
  },
  review: {
    label: "Run Review",
    journey: "decision",
    quickUse: "Review completed analytical runs and move them into reporting without rerunning.",
    inputs: "Saved run outputs and reviewer notes.",
    outputs: "Annotated review state and export-ready run summaries.",
    complexity: "Guided",
    order: 16,
  },
};

export function getWorkflowExperience(flowId: FlowId): WorkflowExperienceMeta | null {
  return WORKFLOW_EXPERIENCE[flowId] ?? null;
}

function hasRunForFlow(runs: CompletedAnalysisRun[], flowId: FlowId): boolean {
  return runs.some((run) => run.flowId === flowId);
}

export function getRecommendedNextFlows(runs: CompletedAnalysisRun[]): FlowId[] {
  if (runs.length === 0) {
    return ["indicator_composite", "urban_growth_ca", "system_dynamics"];
  }

  if (
    (hasRunForFlow(runs, "urban_growth_ca") || hasRunForFlow(runs, "facility_optimisation")) &&
    !hasRunForFlow(runs, "scenario_comparison")
  ) {
    return ["system_dynamics", "scenario_comparison", "review"];
  }

  if (hasRunForFlow(runs, "system_dynamics") && !hasRunForFlow(runs, "scenario_comparison")) {
    return ["scenario_comparison", "review", "indicator_composite"];
  }

  if (hasRunForFlow(runs, "voxcity_3d") && !hasRunForFlow(runs, "sunlight_sim")) {
    return ["sunlight_sim", "cityjson_loader", "scenario_comparison"];
  }

  if (hasRunForFlow(runs, "indicator_composite") && !hasRunForFlow(runs, "equity_audit")) {
    return ["equity_audit", "scenario_comparison", "review"];
  }

  if (hasRunForFlow(runs, "change_detection") && !hasRunForFlow(runs, "emerging_hot_spot")) {
    return ["emerging_hot_spot", "scenario_comparison", "review"];
  }

  return ["scenario_comparison", "system_dynamics", "review"];
}
