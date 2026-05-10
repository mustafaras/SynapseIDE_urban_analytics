
import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";

export type FlowId = AnalyticalFlowId;

export type StepPill = {
  key: string;
  label: string;
};

export interface StepConfig {
  key: string;
  label: string;
  description?: string;
}

export interface FlowDefinition {
  id: FlowId;
  label: string;
  description: string;
  icon: string;
  steps: StepConfig[];
}

/* ------------------------------------------------------------------ */
/*  Flow definitions for the 8 core analytical workflows               */
/* ------------------------------------------------------------------ */

export const FLOW_DEFINITIONS: FlowDefinition[] = [
  {
    id: "site_suitability",
    label: "Site Suitability Analysis",
    description: "Multi-criteria weighted overlay for identifying optimal locations.",
    icon: "SITE",
    steps: [
      { key: "criteria", label: "Define Criteria", description: "List evaluation criteria with weight sliders" },
      { key: "data_layers", label: "Assign Data Layers", description: "Map each criterion to a dataset" },
      { key: "weighting", label: "Weighting Method", description: "Select: equal / rank-sum / AHP / manual" },
      { key: "constraints", label: "Constraint Mapping", description: "Hard constraints as binary mask" },
      { key: "compute", label: "Compute", description: "Weighted overlay → suitability score" },
      { key: "sensitivity", label: "Sensitivity Analysis", description: "Monte Carlo weight perturbation" },
      { key: "output", label: "Generate Output", description: "Map + stats + paragraph for report" },
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility Analysis",
    description: "Network-based accessibility scoring with equity disaggregation.",
    icon: "ACC",
    steps: [
      { key: "mode", label: "Select Mode", description: "Walk / cycle / transit / drive" },
      { key: "threshold", label: "Set Threshold", description: "Travel-time limit in minutes" },
      { key: "poi", label: "Select POI Categories", description: "Amenity categories to evaluate" },
      { key: "population", label: "Population Weighting", description: "Optional population weighting" },
      { key: "equity", label: "Equity Disaggregation", description: "Optional: by income / race / age" },
      { key: "isochrones", label: "Compute Isochrones", description: "Generate travel-time contours" },
      { key: "output", label: "Generate Output", description: "Map + stats + paragraph for report" },
    ],
  },
  {
    id: "vulnerability",
    label: "Vulnerability Assessment",
    description: "Multi-hazard vulnerability scoring following IPCC framework.",
    icon: "RISK",
    steps: [
      { key: "hazard", label: "Select Hazard Type", description: "Flood / heat / seismic / compound" },
      { key: "hazard_data", label: "Load Hazard Data", description: "Upload or generate hazard layer" },
      { key: "exposure", label: "Define Exposure Indicators", description: "Population, assets, infrastructure" },
      { key: "sensitivity", label: "Define Sensitivity Indicators", description: "Sociodemographic factors" },
      { key: "adaptive", label: "Define Adaptive Capacity", description: "Coping & recovery capabilities" },
      { key: "composite", label: "Compute Composite Score", description: "Risk = Hazard × Exposure × Sensitivity − Capacity" },
      { key: "risk_map", label: "Generate Risk Map", description: "Classified vulnerability map" },
    ],
  },
  {
    id: "indicator_composite",
    label: "Composite Indicator Builder",
    description: "OECD/JRC-style composite indicator workflow with uncertainty analysis and exportable configuration packages.",
    icon: "IDX",
    steps: [
      { key: "indicator_selection", label: "Indicator Selection", description: "Choose the indicators, directions, and data sources included in the composite." },
      { key: "missing_data", label: "Missing Data", description: "Handle or impute incomplete observations before scoring." },
      { key: "normalization", label: "Normalization", description: "Transform selected indicators to a common comparable scale." },
      { key: "weighting", label: "Weighting", description: "Apply equal, expert, PCA-derived, AHP, or budget-allocation weights." },
      { key: "aggregation", label: "Aggregation", description: "Combine weighted indicators additively or geometrically." },
      { key: "sensitivity_uncertainty", label: "Sensitivity", description: "Run Monte Carlo sensitivity, confidence bands, and Sobol-style proxy diagnostics." },
      { key: "report_export", label: "Reporting", description: "Preview findings and export reproducible configuration, result, and uncertainty artifacts." },
    ],
  },
  {
    id: "scenario_comparison",
    label: "Scenario Comparison",
    description: "Side-by-side comparison of alternative development or policy scenarios.",
    icon: "CMP",
    steps: [
      { key: "baseline", label: "Define Baseline", description: "Current conditions snapshot" },
      { key: "scenarios", label: "Define Scenarios", description: "2-4 alternative scenarios" },
      { key: "indicators", label: "Select Metrics", description: "Indicators to compare across scenarios" },
      { key: "compute", label: "Compute Differences", description: "Delta analysis per indicator" },
      { key: "visualize", label: "Visualize", description: "Side-by-side maps & radar charts" },
      { key: "tradeoffs", label: "Trade-off Analysis", description: "Multi-criteria comparison matrix" },
      { key: "output", label: "Generate Output", description: "Comparative report section" },
    ],
  },
  {
    id: "equity_audit",
    label: "Equity Audit",
    description: "Assess equitable distribution of urban services and environmental burdens.",
    icon: "EQT",
    steps: [
      { key: "demographics", label: "Load Demographics", description: "Census / survey demographic data" },
      { key: "service", label: "Define Service Layer", description: "Service or amenity to audit" },
      { key: "geography", label: "Spatial Units", description: "Tracts / blocks / neighborhoods" },
      { key: "measure", label: "Equity Measure", description: "Gini / Theil / Atkinson / spatial" },
      { key: "compute", label: "Compute", description: "Disaggregated equity scores" },
      { key: "gaps", label: "Gap Identification", description: "Under-served areas & populations" },
      { key: "output", label: "Generate Output", description: "Equity map + report section" },
    ],
  },
  {
    id: "change_detection",
    label: "Change Detection",
    description: "Detect and quantify spatial changes over time from satellite or vector data.",
    icon: "CHG",
    steps: [
      { key: "t0", label: "Load T₀ Data", description: "Baseline time-point dataset" },
      { key: "t1", label: "Load T₁ Data", description: "Comparison time-point dataset" },
      { key: "method", label: "Select Method", description: "Post-classification / image differencing / CVA" },
      { key: "threshold", label: "Set Thresholds", description: "Change significance thresholds" },
      { key: "compute", label: "Compute Changes", description: "Generate change map" },
      { key: "validation", label: "Accuracy Assessment", description: "Confusion matrix / sampling" },
      { key: "output", label: "Generate Output", description: "Change map + statistics + report" },
    ],
  },
  {
    id: "emerging_hot_spot",
    label: "Emerging Hot Spot Analysis",
    description: "Mine spatiotemporal Gi* trajectories across polygon layers, classify emerging hot and cold spot patterns, and publish a playback-ready result into Map Explorer and completed-run review.",
    icon: "EHS",
    steps: [
      { key: "source", label: "Select Source", description: "Choose the polygon layer and temporal numeric fields." },
      { key: "configure", label: "Configure Model", description: "Set contiguity, significance threshold, and self-weight handling." },
      { key: "run_publish", label: "Run & Publish", description: "Execute the temporal hot spot model and save map-ready outputs for review." },
      { key: "inspect", label: "Inspect Legend", description: "Review category counts, temporal frames, and the legend metadata saved with the result." },
    ],
  },
  {
    id: "urban_morphology",
    label: "Urban Morphology Clustering",
    description: "Segment neighbourhoods into interpretable morphotypes using multivariate k-means clustering and publish the result directly into Map Explorer.",
    icon: "CLU",
    steps: [
      { key: "study_units", label: "Study Units", description: "Review the districts and teaching geometry used for clustering." },
      { key: "variables", label: "Variables", description: "Choose the morphology indicators that define each district." },
      { key: "model", label: "Model Settings", description: "Set k, seed, and standardisation assumptions." },
      { key: "publish", label: "Run & Publish", description: "Queue the clustering task and publish the morphotype layer." },
    ],
  },
  {
    id: "object_detection",
    label: "YOLO-Nano Object Detection",
    description: "Detect urban objects in very-high-resolution imagery, then publish a review-ready GeoJSON layer and saved run into the analysis workspace.",
    icon: "AI",
    steps: [
      { key: "scene", label: "Scene & Classes", description: "Set the imagery scene, target classes, and retained-confidence filter." },
      { key: "detect", label: "Run Detection", description: "Execute tiled YOLO-Nano inference with progress tracking and retained-candidate counts." },
      { key: "publish", label: "Publish & Review", description: "Send the detection layer to Map Explorer and save a review-ready analytical run." },
    ],
  },
  {
    id: "voxcity_3d",
    label: "VoxCity 3D Building Viewer",
    description: "Extrude 2D building footprints to interactive 3D with LOD control and thematic styling.",
    icon: "3D",
    steps: [
      { key: "load", label: "Load Buildings", description: "Load sample or custom building data" },
      { key: "extrude", label: "Extrude & View", description: "Extrude to 2.5D and explore in 3D viewer" },
      { key: "style", label: "Thematic Styling", description: "Color buildings by attribute values" },
    ],
  },
  {
    id: "cityjson_loader",
    label: "CityJSON 3D Model Loader",
    description: "Import and visualise semantic CityJSON v2.0 city models with surface coloring and attribute query.",
    icon: "CJ",
    steps: [
      { key: "import", label: "Import CityJSON", description: "Load CityJSON file via drag-and-drop or file picker" },
      { key: "inspect", label: "Inspect & Query", description: "Explore metadata, semantic surfaces, and object attributes" },
      { key: "style", label: "Surface Styling", description: "Toggle semantic surface visibility and coloring" },
    ],
  },
  {
    id: "sunlight_sim",
    label: "Sunlight & Solar Exposure Simulation",
    description: "Simulate sun positions, shadow accumulation, and solar exposure across buildings over a date/time range.",
    icon: "SUN",
    steps: [
      { key: "configure", label: "Configure", description: "Set location, dates, time range, and interval" },
      { key: "simulate", label: "Run Simulation", description: "Compute shadow accumulation and exposure" },
      { key: "animate", label: "Shadow Animation", description: "Play/pause and scrub through shadow positions" },
      { key: "summary", label: "Exposure Summary", description: "View per-building solar exposure statistics" },
      { key: "export", label: "Export", description: "Download shadow maps and exposure data" },
    ],
  },
  {
    id: "facility_optimisation",
    label: "Facility Optimisation",
    description: "Location-allocation workflow for service siting using p-median, LSCP, MCLP, and equity-aware objectives.",
    icon: "FAC",
    steps: [
      { key: "model_input", label: "Model & Inputs", description: "Select the optimisation model and review candidate-site and demand inputs" },
      { key: "constraints_equity", label: "Constraints & Equity", description: "Configure facility counts, catchment thresholds, and equity-aware controls" },
      { key: "run_variants", label: "Run Variants", description: "Execute one or more optimisation scenarios" },
      { key: "map_results", label: "Map Results", description: "Inspect selected sites and service catchments on the results map" },
      { key: "coverage_equity", label: "Coverage & Equity", description: "Review travel burden, coverage, and equity diagnostics" },
      { key: "compare_export", label: "Compare & Export", description: "Compare variants side by side and export results" },
    ],
  },
  {
    id: "urban_growth_ca",
    label: "Urban Growth Cellular Automata",
    description: "Calibrate and run a constrained cellular automata urban expansion model with validation metrics and temporal playback.",
    icon: "CA",
    steps: [
      { key: "calibration_inputs", label: "Calibration Inputs", description: "Select temporal land-use states used for empirical calibration" },
      { key: "constraints", label: "Constraints", description: "Configure protected areas, water, slope, and urban-structure controls" },
      { key: "perturbation", label: "Perturbation", description: "Set stochastic perturbation and growth intensity" },
      { key: "simulate", label: "Run Simulation", description: "Calibrate coefficients and simulate urban expansion" },
      { key: "animate_compare", label: "Animate & Compare", description: "Scrub temporal growth frames and compare predicted versus observed states" },
      { key: "validation_export", label: "Validation & Export", description: "Inspect fit metrics and export predicted surfaces or summaries" },
    ],
  },
  {
    id: "system_dynamics",
    label: "System Dynamics Module",
    description: "Model long-run urban change through coupled stocks, policy levers, timeline trajectories, and feedback structures.",
    icon: "SD",
    steps: [
      { key: "baseline", label: "Baseline & Horizon", description: "Inspect initial stocks and set the simulation horizon." },
      { key: "policy_levers", label: "Policy Levers", description: "Adjust housing, jobs, transit, green protection, and compact-growth controls." },
      { key: "stock_flow", label: "Stock & Flow", description: "Review the stock-and-flow structure with valves and feedback arcs." },
      { key: "trajectories", label: "Trajectories", description: "Inspect annual stock charts and adequacy indicators." },
      { key: "causal_export", label: "Causal Loop & Export", description: "Open the causal loop view and export traces, parameters, or diagram images." },
    ],
  },
  {
    id: "review",
    label: "Completed Run Review",
    description: "Review and compare outputs from completed analytical workflows.",
    icon: "REV",
    steps: [
      { key: "select", label: "Select Run", description: "Choose a completed workflow run" },
      { key: "inspect", label: "Inspect Outputs", description: "Maps, charts, data tables" },
      { key: "annotate", label: "Annotate", description: "Add notes and observations" },
      { key: "export", label: "Export", description: "Export to report / PDF / data" },
    ],
  },
];
