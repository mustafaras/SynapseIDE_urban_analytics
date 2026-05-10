import { requireUrbanMethodValidityEnvelopePreset } from "@/features/urbanAnalytics/context/methodValidity";
import type {
  UrbanLearningPathReferenceInput,
  UrbanMethodCapabilityStatus,
  UrbanMethodValidityEnvelope,
} from "@/features/urbanAnalytics/lib/types";
import type { FlowId } from "./flowTypes";

export type FlowCategory =
  | "SPATIAL_ANALYSIS"
  | "INDICATOR_ASSESSMENT"
  | "RISK_EQUITY"
  | "SIMULATION_3D"
  | "SCENARIO_REVIEW";

export type FlowLibraryItem = {
  flowId: FlowId;
  title: string;
  category: FlowCategory;
  analysisFocus: string;
  whatYouDocument: string[];
  boundary: string;
  isLocked?: boolean;
  lockReason?: string;
  validityEnvelope?: UrbanMethodValidityEnvelope;
  capabilityStatus?: UrbanMethodCapabilityStatus;
  learningPath?: UrbanLearningPathReferenceInput;
};

const ACCESSIBILITY_VALIDITY_ENVELOPE = requireUrbanMethodValidityEnvelopePreset("flow:accessibility");

export const FLOW_LIBRARY_ITEMS: FlowLibraryItem[] = [
  {
    flowId: "site_suitability",
    title: "Multi-Criteria Site Suitability",
    category: "SPATIAL_ANALYSIS",
    analysisFocus:
      "Weighted overlay analysis combining environmental, infrastructure, and socioeconomic layers to identify optimal development sites.",
    whatYouDocument: [
      "Criteria definitions and data-layer assignments.",
      "Weighting method and rationale (AHP, rank-sum, equal, manual).",
      "Constraint masks and sensitivity-analysis parameters.",
    ],
    boundary:
      "Produces a ranked suitability surface. Does not constitute a zoning decision or binding land-use recommendation.",
  },
  {
    flowId: "accessibility",
    title: "Network Accessibility Analysis",
    category: "SPATIAL_ANALYSIS",
    analysisFocus:
      "Isochrone-based accessibility scoring across walk, cycle, transit, and drive modes for selected points of interest.",
    whatYouDocument: [
      "Travel mode and time-threshold selections.",
      "POI categories and population-weighting configuration.",
      "Equity disaggregation dimensions applied to results.",
    ],
    boundary:
      "Generates accessibility indices and isochrone geometries. Not a transport plan or service-level guarantee.",
    validityEnvelope: ACCESSIBILITY_VALIDITY_ENVELOPE,
    capabilityStatus: ACCESSIBILITY_VALIDITY_ENVELOPE.capabilityStatus,
    learningPath: {
      methodId: "flow:accessibility",
      workflowId: "accessibility",
      pathId: "accessibility_equity_analysis",
      explainerId: "hansen_accessibility",
      concepts: ["travel impedance", "opportunity weighting", "threshold sensitivity"],
      prerequisites: [
        "Origin-destination cost inputs or a routable network",
        "An explicit opportunity definition and study-area scope",
      ],
      intermediateValues: [
        {
          label: "Travel-cost surface",
          description: "Inspect how mode and threshold choices become comparable movement costs before reading the final access score.",
          source: "workflow",
        },
        {
          label: "Opportunity counts",
          description: "Review how reachable opportunities are aggregated before accessibility is summarized for decision support.",
          source: "workflow",
        },
      ],
      interpretationPrompts: [
        "Which access gains come from network structure versus the quantity of opportunities?",
        "How would a different impedance threshold alter the equity story?",
      ],
      teachingSteps: [
        {
          id: "workflow-accessibility-impedance",
          title: "Interrogate travel impedance",
          source: "workflow",
          note: "Compare travel-time assumptions before treating accessibility differences as substantive planning evidence.",
        },
      ],
    },
  },
  {
    flowId: "change_detection",
    title: "Land-Use Change Detection",
    category: "SPATIAL_ANALYSIS",
    analysisFocus:
      "Temporal comparison of satellite or vector land-use layers to quantify urban expansion, densification, and green-cover change.",
    whatYouDocument: [
      "Baseline and comparison time periods selected.",
      "Classification scheme and change categories.",
      "Detected transition matrix and key change hotspots.",
    ],
    boundary:
      "Highlights land-use transitions across time periods. Does not verify causal mechanisms or predict future change.",
  },
  {
    flowId: "emerging_hot_spot",
    title: "Emerging Hot Spot Analysis",
    category: "SPATIAL_ANALYSIS",
    analysisFocus:
      "Spatiotemporal hot spot mining for polygon layers, running Gi* across ordered numeric time fields, classifying trajectory patterns, and publishing a legend-rich temporal result for review.",
    whatYouDocument: [
      "Source polygon layer and ordered numeric time fields used as the temporal sequence.",
      "Weights method, significance filter, and self-weight decision applied to the run.",
      "Published temporal layer, category counts, and any skipped or unclassified features.",
    ],
    boundary:
      "Produces exploratory spatiotemporal cluster classifications for planning analysis. It does not replace a validated causal study, time-series forecasting model, or statutory monitoring program.",
  },
  {
    flowId: "urban_morphology",
    title: "Urban Morphology Clustering",
    category: "SPATIAL_ANALYSIS",
    analysisFocus:
      "Multivariate k-means segmentation of districts into interpretable morphotypes using accessibility, environmental, burden, and opportunity indicators.",
    whatYouDocument: [
      "Indicator bundle used for clustering and whether the inputs were standardised.",
      "Cluster count, random seed, and any districts excluded due to missing values.",
      "Published morphotype layer, silhouette quality, and the resulting district assignments.",
    ],
    boundary:
      "Produces exploratory morphotype groupings for planning analysis. It does not replace a calibrated typology study, expert interpretation, or field validation.",
  },
  {
    flowId: "object_detection",
    title: "Urban Object Detection from Imagery",
    category: "SPATIAL_ANALYSIS",
    analysisFocus:
      "GeoAI screening workflow for extracting vehicles, trees, solar panels, pools, and construction sites from very-high-resolution imagery, then publishing review-ready map layers and summary outputs.",
    whatYouDocument: [
      "Scene coverage, target classes, and retained-confidence threshold.",
      "Detection counts by class and any notable high-confidence objects or blind spots.",
      "Published GeoJSON layer, saved review run, and caveats about threshold sensitivity or incomplete coverage.",
    ],
    boundary:
      "Produces browser-side detection candidates for analytical screening. It does not replace field validation, QA/QC review, or production-grade model deployment.",
  },
  {
    flowId: "indicator_composite",
    title: "Composite Indicator Builder",
    category: "INDICATOR_ASSESSMENT",
    analysisFocus:
      "Construct OECD/JRC-style composite indices with seven staged controls for imputation, normalization, weighting, aggregation, uncertainty, and reporting.",
    whatYouDocument: [
      "Selected component indicators and data sources.",
      "Missing-data, normalization, and weighting method selections.",
      "Aggregation choice, uncertainty controls, and robustness diagnostics.",
      "Exported configuration package and composite output interpretation.",
    ],
    boundary:
      "Produces a composite score for comparative analysis. Not a definitive ranking or policy mandate.",
    learningPath: {
      methodId: "flow:indicator_composite",
      workflowId: "indicator_composite",
      pathId: "sdg11_monitoring_reporting",
      explainerId: "composite_index",
      concepts: ["normalization", "weighting", "aggregation", "uncertainty diagnostics"],
      prerequisites: [
        "A documented indicator list with compatible units or normalization logic",
        "Explicit reasoning for weighting and aggregation choices",
      ],
      intermediateValues: [
        {
          label: "Normalized indicator table",
          description: "Inspect normalized component values before aggregation to see which variables dominate the composite.",
          source: "indicator",
        },
        {
          label: "Weight sensitivity summary",
          description: "Review how alternative weighting schemes change rank or score stability.",
          source: "workflow",
        },
      ],
      interpretationPrompts: [
        "Which component indicators drive the score most strongly?",
        "Where does the composite hide uncertainty or disagreement between components?",
      ],
      teachingSteps: [
        {
          id: "workflow-composite-normalize",
          title: "Audit normalization before weighting",
          source: "workflow",
          note: "Teaching should expose how scale adjustments alter comparability before a single headline score is shown.",
        },
      ],
    },
  },
  {
    flowId: "vulnerability",
    title: "Vulnerability & Risk Assessment",
    category: "RISK_EQUITY",
    analysisFocus:
      "Multi-hazard vulnerability mapping combining exposure, sensitivity, and adaptive-capacity dimensions.",
    whatYouDocument: [
      "Hazard type selection and hazard-data source.",
      "Exposure, sensitivity, and adaptive-capacity indicator lists with weights.",
      "Composite vulnerability score and risk-map outputs.",
    ],
    boundary:
      "Generates vulnerability indices for planning support. Not a disaster-response directive or insurance assessment.",
    learningPath: {
      methodId: "flow:vulnerability",
      workflowId: "vulnerability",
      pathId: "environmental_resilience",
      explainerId: "vulnerability_ipcc",
      concepts: ["hazard", "exposure", "sensitivity", "adaptive capacity"],
      prerequisites: [
        "A hazard frame and exposure variables with defensible spatial alignment",
        "Transparent weighting or combination logic for composite risk dimensions",
      ],
      intermediateValues: [
        {
          label: "Dimension scores",
          description: "Review hazard, exposure, sensitivity, and adaptive-capacity terms separately before interpreting the final vulnerability output.",
          source: "indicator",
        },
      ],
      interpretationPrompts: [
        "Which dimension explains the highest-risk areas, and which is only weakly evidenced?",
        "What action would change adaptive capacity rather than only remapping hazard?",
      ],
      teachingSteps: [
        {
          id: "workflow-vulnerability-dimensions",
          title: "Separate dimensions before summation",
          source: "workflow",
          note: "Learners should inspect each risk dimension before they trust the composite vulnerability score.",
        },
      ],
    },
  },
  {
    flowId: "equity_audit",
    title: "Equity & Distributional Audit",
    category: "RISK_EQUITY",
    analysisFocus:
      "Spatial equity analysis measuring how urban amenities and hazards are distributed across demographic groups.",
    whatYouDocument: [
      "Amenity and hazard layers selected for audit.",
      "Demographic dimensions and geographic unit of analysis.",
      "Disparity metrics (Gini, concentration index, gap ratios).",
    ],
    boundary:
      "Quantifies distributional patterns. Does not assign fault or prescribe specific remediation measures.",
  },
  {
    flowId: "cityjson_loader",
    title: "CityJSON 3D Model Loader",
    category: "SIMULATION_3D",
    analysisFocus:
      "Import CityJSON v2.0 city models with semantic surface preservation. Supports drag-and-drop file import, metadata inspection, and attribute queries on CityObjects.",
    whatYouDocument: [
      "Source CityJSON file and CRS information.",
      "Object type and semantic surface inventory.",
      "Attribute queries and visual inspection findings.",
    ],
    boundary:
      "Ingests and visualises CityJSON models. Does not perform structural analysis or generate new geometry.",
  },
  {
    flowId: "voxcity_3d",
    title: "VoxCity 3D Building Viewer",
    category: "SIMULATION_3D",
    analysisFocus:
      "Extrude 2D building footprints to interactive 2.5D geometry. Supports basic and enriched LOD, deterministic height derivation, and thematic attribute-based styling.",
    whatYouDocument: [
      "Building footprint source and height attribute strategy.",
      "LOD level and thematic colour attribute selections.",
      "Visual inspection of urban form and morphology.",
    ],
    boundary:
      "Produces a 3D visualization of building volumes. Not a structural model or certified digital twin.",
  },
  {
    flowId: "sunlight_sim",
    title: "Sunlight & Solar Exposure Simulation",
    category: "SIMULATION_3D",
    analysisFocus:
      "Simulate sun position and shadow accumulation over a configurable date/time range. Compute per-building and ground-level solar exposure hours with animated shadow playback.",
    whatYouDocument: [
      "Simulation parameters: location, date range, time interval, and UTC offset.",
      "Shadow accumulation results and per-building exposure statistics.",
      "Visual observations from shadow animation playback.",
    ],
    boundary:
      "Computes geometric shadow projection using axis-aligned building volumes. Does not model atmospheric effects, reflections, or diffuse radiation.",
  },
  {
    flowId: "facility_optimisation",
    title: "Facility Siting & Location-Allocation",
    category: "SIMULATION_3D",
    analysisFocus:
      "Service siting workflow for testing p-median, LSCP, and MCLP variants with explicit efficiency-equity trade-offs, catchment visualisation, and scenario comparison.",
    whatYouDocument: [
      "Candidate-site layer, demand-point assumptions, and the selected optimisation model.",
      "Facility count, service radius, and equity-objective or constraint configuration.",
      "Selected sites, demand coverage, travel burden, and equity-diagnostic comparison across variants.",
    ],
    boundary:
      "Produces heuristic browser-side location-allocation scenarios for planning support. It does not replace exact network-based optimisation, statutory siting review, or field feasibility assessment.",
  },
  {
    flowId: "urban_growth_ca",
    title: "Urban Growth Cellular Automata",
    category: "SIMULATION_3D",
    analysisFocus:
      "Scenario-based urban expansion modelling using calibrated temporal land-use states, suitability surfaces, explicit constraints, and validation against observed growth.",
    whatYouDocument: [
      "Calibration states, observed target state, and scenario naming.",
      "Constraint surfaces used for protected areas, water, slope, and urban structure.",
      "Perturbation factor, growth controls, validation metrics, and model simplifications.",
    ],
    boundary:
      "Produces an interactive planning simulation with figure-of-merit and Kappa-style validation. It does not implement the full SLEUTH coefficient-search workflow or policy adoption dynamics.",
  },
  {
    flowId: "system_dynamics",
    title: "System Dynamics Urban Change",
    category: "SIMULATION_3D",
    analysisFocus:
      "Long-run stock-and-flow simulation linking population, housing, employment, transport capacity, and green space through explicit annual integration and feedback structure.",
    whatYouDocument: [
      "Selected policy lever values for housing, economic development, transit, green protection, and compact growth.",
      "Simulation horizon, stability status, and how annual stock trajectories respond to lever changes.",
      "Observed balancing and reinforcing loops from the stock-flow and causal-loop views.",
    ],
    boundary:
      "Produces a teaching-oriented strategic dynamics model for exploring urban change pathways. It does not replace calibrated demographic forecasting, transport assignment, or land-market modelling.",
    learningPath: {
      methodId: "flow:system_dynamics",
      workflowId: "system_dynamics",
      pathId: "scenario_planning_decision_support",
      explainerId: "system_dynamics",
      concepts: ["feedback loops", "stocks and flows", "scenario sensitivity"],
      prerequisites: [
        "A clear causal hypothesis linking stocks, flows, and delays",
        "Scenario parameters that can be explained to non-technical reviewers",
      ],
      intermediateValues: [
        {
          label: "Stock-flow structure",
          description: "Inspect the causal structure before comparing scenario trajectories.",
          source: "workflow",
        },
      ],
      interpretationPrompts: [
        "Which observed behavior depends on feedback assumptions rather than measured evidence?",
        "What delays or reinforcing loops could reverse the scenario narrative?",
      ],
      teachingSteps: [
        {
          id: "workflow-system-dynamics-feedback",
          title: "Make the feedback structure visible",
          source: "workflow",
          note: "Teaching steps should expose how loop structure shapes scenario behavior before the output chart is interpreted.",
        },
      ],
    },
  },
  {
    flowId: "scenario_comparison",
    title: "Scenario Comparison",
    category: "SCENARIO_REVIEW",
    analysisFocus:
      "Side-by-side comparison of planning scenarios evaluating impacts on density, green cover, accessibility, and resilience indicators.",
    whatYouDocument: [
      "Scenario definitions and parameter variations.",
      "Indicator set used for comparison.",
      "Trade-off summary and preferred-scenario rationale.",
    ],
    boundary:
      "Facilitates structured comparison. Does not replace stakeholder deliberation or democratic planning processes.",
    learningPath: {
      methodId: "flow:scenario_comparison",
      workflowId: "scenario_comparison",
      pathId: "scenario_planning_decision_support",
      explainerId: "scenario_tradeoffs",
      concepts: ["baseline framing", "trade-off interpretation", "uncertainty communication"],
      prerequisites: [
        "A defensible baseline and alternative scenario definition",
        "Comparable metrics and consistent evidence provenance across scenarios",
      ],
      intermediateValues: [
        {
          label: "Scenario delta table",
          description: "Inspect metric-by-metric deltas before compressing them into a single recommendation.",
          source: "workflow",
        },
      ],
      interpretationPrompts: [
        "Which scenario improves one objective while worsening another?",
        "How would the recommendation change under a different weighting or policy priority?",
      ],
      teachingSteps: [
        {
          id: "workflow-scenario-baseline",
          title: "Defend the baseline first",
          source: "workflow",
          note: "Teaching should begin with baseline choice so learners can see what each scenario is actually improving or degrading.",
        },
      ],
    },
  },
  {
    flowId: "review",
    title: "Completed Run Review",
    category: "SCENARIO_REVIEW",
    analysisFocus:
      "Review and annotate previously completed analytical runs with notes, quality flags, and export options.",
    whatYouDocument: [
      "Run metadata and parameter summary.",
      "Quality-check annotations and reviewer notes.",
      "Export format and dissemination decisions.",
    ],
    boundary:
      "Read-only review of prior results. Does not re-execute analyses or modify stored outputs.",
  },
];
