import { createToolReference } from "./navigation";
import type { MethodologyExplainer } from "./types";

export const METHODOLOGY_EXPLAINERS: MethodologyExplainer[] = [
  {
    id: "morans_i",
    title: "Global Moran's I and Local Spatial Association",
    shortDefinition:
      "Moran's I measures whether similar values cluster in space more than would be expected under spatial randomness.",
    formulas: [
      {
        label: "Global statistic",
        latex: String.raw`I = \frac{n}{S_0}\frac{\sum_i\sum_j w_{ij}(x_i-\bar{x})(x_j-\bar{x})}{\sum_i (x_i-\bar{x})^2}`,
      },
      {
        label: "Expected value under randomization",
        latex: String.raw`E[I] = -\frac{1}{n-1}`,
      },
    ],
    assumptions: [
      "The spatial weights matrix reflects a defensible neighborhood definition.",
      "Observed values are measured on comparable spatial units.",
      "Permutation inference should be reported when sampling assumptions are weak.",
    ],
    limitations: [
      "Results are sensitive to the weights matrix and study-area boundary.",
      "A strong global statistic can mask distinct local cluster types.",
      "Autocorrelation does not explain why the pattern exists.",
    ],
    misuseWarnings: [
      "Do not compare Moran's I values across incompatible spatial weights without stating the change in specification.",
      "Do not interpret positive autocorrelation as causal spillover without a model that supports that claim.",
    ],
    useCases: [
      "Testing whether deprivation, pollution, or service access is spatially clustered.",
      "Justifying a move from descriptive mapping into spatial diagnostics or regression.",
    ],
    linkedTools: [
      createToolReference(
        "Methods tab · Spatial statistics guide",
        "Review autocorrelation framing, interpretation, and reporting expectations.",
        { tab: "Methods" },
      ),
      createToolReference(
        "Education tab · Spatial Statistics path",
        "Study Moran's I inside the structured learning path.",
        { tab: "Education" },
      ),
    ],
    relatedPathIds: ["spatial_statistics_planners"],
    relatedExplainerIds: ["getis_ord_gi", "ols_gwr"],
  },
  {
    id: "getis_ord_gi",
    title: "Getis-Ord Gi* Hot-Spot Analysis",
    shortDefinition:
      "Gi* evaluates whether a location sits inside a statistically unusual concentration of high or low values relative to its neighborhood.",
    formulas: [
      {
        label: "Gi* z-score",
        latex: String.raw`G_i^* = \frac{\sum_j w_{ij}x_j - \bar{X}\sum_j w_{ij}}{S\sqrt{\frac{n\sum_j w_{ij}^2 - (\sum_j w_{ij})^2}{n-1}}}`,
      },
    ],
    assumptions: [
      "Neighborhood structure is specified explicitly through a weights matrix.",
      "The analyst reports the confidence classification scheme used.",
      "Values are interpreted relative to the local neighborhood, not the whole study area alone.",
    ],
    limitations: [
      "Hot spots are sensitive to scale and neighborhood design.",
      "Local significance can be inflated if multiple testing control is ignored.",
    ],
    misuseWarnings: [
      "Do not present Gi* categories as policy priorities without describing the confidence level and data quality.",
      "Do not compare hot spots from incomparable time periods or variable definitions as if they were stable trends.",
    ],
    useCases: [
      "Targeting interventions where concentrated burden or advantage matters.",
      "Comparing local hot spots with LISA-style outlier interpretation.",
    ],
    linkedTools: [
      createToolReference(
        "Methods tab · Spatial statistics guide",
        "Inspect hot-spot confidence logic and local-neighborhood assumptions.",
        { tab: "Methods" },
      ),
    ],
    relatedPathIds: ["spatial_statistics_planners"],
    relatedExplainerIds: ["morans_i"],
  },
  {
    id: "ols_gwr",
    title: "OLS Diagnostics and Geographically Weighted Regression",
    shortDefinition:
      "OLS provides a global baseline model, while GWR estimates local relationships that can vary over space.",
    formulas: [
      {
        label: "Ordinary least squares",
        latex: String.raw`\hat{\beta} = (X^T X)^{-1} X^T y`,
      },
      {
        label: "Local GWR estimate",
        latex: String.raw`\hat{\beta}(u_i,v_i) = (X^T W_i X)^{-1} X^T W_i y`,
      },
    ],
    assumptions: [
      "OLS assumes linearity, independent residuals, and a defensible global specification.",
      "GWR assumes local smoothness and requires careful bandwidth selection.",
      "Residual diagnostics should be inspected before model escalation.",
    ],
    limitations: [
      "Local coefficients can be unstable where sample density is weak.",
      "GWR is descriptive unless the analyst explicitly addresses identification and inference.",
    ],
    misuseWarnings: [
      "Do not treat local coefficients as causal evidence without a research design that supports causal inference.",
      "Do not fit GWR simply because a map of coefficients looks persuasive; justify the bandwidth and residual behavior.",
    ],
    useCases: [
      "Explaining why relationships differ between urban core and periphery.",
      "Teaching why diagnostics matter before choosing a spatial model.",
    ],
    linkedTools: [
      createToolReference(
        "Methods tab · Spatial statistics guide",
        "Review diagnostics, spatial dependence, and local-model caveats.",
        { tab: "Methods" },
      ),
      createToolReference(
        "Report tab · Report Builder",
        "Turn regression diagnostics into a report-ready methods note.",
        { tab: "Report" },
      ),
    ],
    relatedPathIds: ["spatial_statistics_planners"],
    relatedExplainerIds: ["morans_i"],
  },
  {
    id: "hansen_accessibility",
    title: "Hansen-Type Accessibility",
    shortDefinition:
      "Gravity-style accessibility summarizes how much opportunity is reachable once opportunity size and travel impedance are considered together.",
    formulas: [
      {
        label: "Exponential decay form",
        latex: String.raw`A_i = \sum_j O_j e^{-\beta c_{ij}}`,
      },
    ],
    assumptions: [
      "Opportunity mass and travel cost are both relevant to accessibility.",
      "The decay parameter should be justified for the planning question.",
      "Travel impedance is measured consistently across all origins and destinations.",
    ],
    limitations: [
      "Accessibility is sensitive to the decay specification and opportunity definition.",
      "A gravity score does not reveal distributional fairness by itself.",
    ],
    misuseWarnings: [
      "Do not compare scores computed with different decay functions as if they were directly equivalent.",
      "Do not treat modeled accessibility as observed travel behavior.",
    ],
    useCases: [
      "Comparing service reach across neighborhoods.",
      "Testing how accessibility rankings shift when travel sensitivity changes.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Accessibility analysis",
        "Use the accessibility workflow as the primary teaching surface for gravity reasoning.",
        { tab: "Workflows", flowId: "accessibility" },
      ),
    ],
    relatedPathIds: ["foundations_urban_analytics", "accessibility_equity_analysis"],
    relatedExplainerIds: ["gini_coefficient"],
  },
  {
    id: "gini_coefficient",
    title: "Gini Coefficient for Inequality and Uneven Access",
    shortDefinition:
      "The Gini coefficient summarizes how unevenly a quantity is distributed across a set of observations.",
    formulas: [
      {
        label: "Pairwise-difference form",
        latex: String.raw`G = \frac{\sum_i\sum_j |x_i - x_j|}{2n^2\bar{x}}`,
      },
    ],
    assumptions: [
      "All units are measured on the same scale and represent a comparable population or exposure frame.",
      "The analyst defines whether the quantity reflects burden, opportunity, or wealth.",
    ],
    limitations: [
      "Gini summarizes inequality but does not identify which groups experience the burden.",
      "Equal Gini values can arise from very different distribution shapes.",
    ],
    misuseWarnings: [
      "Do not use Gini alone to claim an outcome is equitable; inspect who gains and who loses.",
      "Do not compare Gini values across incompatible denominators or study populations.",
    ],
    useCases: [
      "Summarizing access burden or service provision disparities.",
      "Teaching why average values can hide distributional injustice.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Equity Audit",
        "Inspect disparity outputs and connect summary inequality to lived distributional patterns.",
        { tab: "Workflows", flowId: "equity_audit" },
      ),
    ],
    relatedPathIds: [
      "foundations_urban_analytics",
      "accessibility_equity_analysis",
      "scenario_planning_decision_support",
    ],
    relatedExplainerIds: ["hansen_accessibility", "composite_index"],
  },
  {
    id: "ndvi",
    title: "Normalized Difference Vegetation Index (NDVI)",
    shortDefinition:
      "NDVI measures vegetation vigor from the contrast between near-infrared reflectance and red reflectance.",
    formulas: [
      {
        label: "NDVI",
        latex: String.raw`NDVI = \frac{NIR - Red}{NIR + Red}`,
      },
    ],
    assumptions: [
      "The imagery is radiometrically consistent across the area being compared.",
      "The analyst states acquisition dates, seasonality, and masking choices.",
    ],
    limitations: [
      "Urban mixed pixels can combine trees, roofs, and bare ground in the same cell.",
      "NDVI is not a direct measure of ecological quality or canopy equity on its own.",
    ],
    misuseWarnings: [
      "Do not compare NDVI values across seasons without accounting for phenology.",
      "Do not treat a greener pixel as universally better without the planning context.",
    ],
    useCases: [
      "Screening greenness and vegetation gaps across neighborhoods.",
      "Combining environmental quality indicators with social vulnerability analysis.",
    ],
    linkedTools: [
      createToolReference(
        "Methods tab · Remote sensing guide",
        "Use the guide to frame index interpretation and reporting caveats.",
        { tab: "Methods" },
      ),
    ],
    relatedPathIds: ["environmental_resilience"],
    relatedExplainerIds: ["vulnerability_ipcc"],
  },
  {
    id: "vulnerability_ipcc",
    title: "IPCC-Style Vulnerability and Risk Framing",
    shortDefinition:
      "Risk frameworks distinguish hazard, exposure, sensitivity, and adaptive capacity so analysts can explain what is driving vulnerability.",
    formulas: [
      {
        label: "Teaching form used in the platform",
        latex: String.raw`Risk = Hazard \times Exposure \times Sensitivity - Adaptive\ Capacity`,
      },
    ],
    assumptions: [
      "Each component is normalized and interpreted consistently.",
      "The analyst explains which inputs are hazard, exposure, sensitivity, and adaptive-capacity terms.",
      "Composite simplification is disclosed rather than hidden.",
    ],
    limitations: [
      "Component weighting strongly shapes the final result.",
      "The formula is a planning heuristic, not a complete physical risk model.",
    ],
    misuseWarnings: [
      "Do not present a vulnerability score as ground truth without discussing input uncertainty and weighting choices.",
      "Do not collapse distinct hazards into a single narrative if the policy response differs by hazard type.",
    ],
    useCases: [
      "Structuring neighborhood vulnerability assessments for planning education.",
      "Comparing how adaptation policy levers alter the drivers of risk.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Vulnerability assessment",
        "Use the live workflow to inspect how each component shapes the result.",
        { tab: "Workflows", flowId: "vulnerability" },
      ),
      createToolReference(
        "Workflows tab · System Dynamics",
        "Use simulation outputs to connect risk reasoning to policy leverage over time.",
        { tab: "Workflows", flowId: "system_dynamics" },
      ),
    ],
    relatedPathIds: ["foundations_urban_analytics", "environmental_resilience"],
    relatedExplainerIds: ["ndvi", "system_dynamics"],
  },
  {
    id: "spacematrix_density",
    title: "Spacematrix Density Logic",
    shortDefinition:
      "Spacematrix-style metrics distinguish built intensity, coverage, and open-space relationships so density is not reduced to one number.",
    formulas: [
      {
        label: "Floor area ratio",
        latex: String.raw`FAR = \frac{Gross\ Floor\ Area}{Plot\ Area}`,
      },
      {
        label: "Ground space index",
        latex: String.raw`GSI = \frac{Building\ Footprint\ Area}{Plot\ Area}`,
      },
      {
        label: "Open space ratio",
        latex: String.raw`OSR = \frac{Open\ Space\ Area}{Gross\ Floor\ Area}`,
      },
    ],
    assumptions: [
      "Plot boundaries and gross floor area are measured consistently.",
      "Density interpretation is linked to morphology, not treated as a value judgment on its own.",
    ],
    limitations: [
      "Two neighborhoods can share a FAR and still have very different spatial form.",
      "Missing height or floor-area data can distort comparisons.",
    ],
    misuseWarnings: [
      "Do not equate higher density with better performance without considering accessibility, open space, and infrastructure.",
      "Do not compare density metrics from incompatible parcel definitions.",
    ],
    useCases: [
      "Comparing development types across blocks or neighborhoods.",
      "Supporting studio discussions about compactness, coverage, and open-space trade-offs.",
    ],
    linkedTools: [
      createToolReference(
        "Methods tab · Built form guidance",
        "Use the methods guide to frame density interpretation before mapping it.",
        { tab: "Methods" },
      ),
    ],
    relatedPathIds: ["urban_morphology_form"],
    relatedExplainerIds: ["building_extrusion"],
  },
  {
    id: "sdg_monitoring",
    title: "SDG 11 Monitoring Logic",
    shortDefinition:
      "SDG monitoring requires clear indicator definitions, defensible numerator-denominator choices, and explicit reporting metadata.",
    formulas: [
      {
        label: "Land consumption rate to population growth rate ratio",
        latex: String.raw`LCRPGR = \frac{\ln(U_t/U_0)}{\ln(P_t/P_0)}`,
      },
    ],
    assumptions: [
      "Indicator definitions are used consistently across time and place.",
      "Spatial and temporal coverage are sufficient for comparison.",
      "Metadata and source lineage are preserved for review.",
    ],
    limitations: [
      "Indicator comparability breaks down when the data source or boundary changes.",
      "A dashboard of SDG values does not explain institutional causes by itself.",
    ],
    misuseWarnings: [
      "Do not report SDG progress without stating data dates, source differences, and calculation boundaries.",
      "Do not collapse monitoring into a marketing narrative that hides uncertainty or omission.",
    ],
    useCases: [
      "Preparing voluntary local reviews and municipal indicator dashboards.",
      "Teaching how evidence packaging differs from indicator calculation alone.",
    ],
    linkedTools: [
      createToolReference(
        "Dashboard tab · Dashboard Builder",
        "Build SDG-oriented communication surfaces with reusable widgets.",
        { tab: "Dashboard" },
      ),
      createToolReference(
        "Report tab · Report Builder",
        "Assemble narrative and citation layers for formal reporting.",
        { tab: "Report" },
      ),
    ],
    relatedPathIds: ["sdg11_monitoring_reporting"],
    relatedExplainerIds: ["composite_index"],
  },
  {
    id: "building_extrusion",
    title: "Building Extrusion and Height Fallbacks",
    shortDefinition:
      "Building extrusion turns 2D footprints into 2.5D form using explicit height sources or documented fallbacks.",
    formulas: [
      {
        label: "Fallback height from levels",
        latex: String.raw`Height \approx Levels \times h_{default}`,
      },
    ],
    assumptions: [
      "Footprints are valid and height attributes are interpreted consistently.",
      "Fallback assumptions are documented when direct height is unavailable.",
    ],
    limitations: [
      "Extrusion visualizes form but does not capture full building semantics or interiors.",
      "Fallback heights can misstate local skyline variation.",
    ],
    misuseWarnings: [
      "Do not present fallback heights as measured survey data.",
      "Do not confuse visually compelling 3D form with complete digital-twin fidelity.",
    ],
    useCases: [
      "Rapid 3D context building from footprint datasets.",
      "Teaching how attribute quality affects 3D interpretation.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · VoxCity 3D",
        "Inspect LOD behavior, height selection, and 3D thematic styling.",
        { tab: "Workflows", flowId: "voxcity_3d" },
      ),
    ],
    relatedPathIds: ["urban_modelling_3d"],
    relatedExplainerIds: ["spacematrix_density", "sunlight_exposure"],
  },
  {
    id: "sunlight_exposure",
    title: "Sunlight Exposure and Shadow Accumulation",
    shortDefinition:
      "Solar exposure approximates how long a surface remains sunlit across a specified sequence of times.",
    formulas: [
      {
        label: "Discrete exposure accumulation",
        latex: String.raw`Exposure_h = \sum_t I_t \Delta t`,
      },
    ],
    assumptions: [
      "Sun position is sampled at the stated interval and date range.",
      "Geometry is accurate enough for neighborhood-scale interpretation.",
    ],
    limitations: [
      "Temporal sampling is an approximation, not a full radiative-transfer model.",
      "Surface reflectance and atmospheric effects are outside the current teaching model.",
    ],
    misuseWarnings: [
      "Do not treat the output as a legal solar-rights determination.",
      "Do not compare runs with different interval settings without stating the change.",
    ],
    useCases: [
      "Teaching shadow logic in urban design studios.",
      "Comparing alternative building forms for daylight access and public-space exposure.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Sunlight simulation",
        "Run shadow playback and exposure summaries inside the 3D workflow.",
        { tab: "Workflows", flowId: "sunlight_sim" },
      ),
    ],
    relatedPathIds: ["urban_modelling_3d"],
    relatedExplainerIds: ["building_extrusion"],
  },
  {
    id: "composite_index",
    title: "Composite Indicator Construction",
    shortDefinition:
      "Composite indicators bundle multiple normalized measures into a single interpretable score using explicit weighting and aggregation choices.",
    formulas: [
      {
        label: "Additive aggregation",
        latex: String.raw`CI_i = \sum_k w_k z_{ik}`,
      },
      {
        label: "Geometric aggregation",
        latex: String.raw`CI_i = \prod_k z_{ik}^{w_k}`,
      },
    ],
    assumptions: [
      "Indicators are normalized onto a defensible comparison scale.",
      "Weights and aggregation rules are explicit and justified.",
      "Sensitivity analysis is used when rankings matter.",
    ],
    limitations: [
      "A composite score can hide offsetting strengths and weaknesses.",
      "Rankings can shift materially under alternative weighting rules.",
    ],
    misuseWarnings: [
      "Do not present a composite index without reporting normalization, weighting, and uncertainty choices.",
      "Do not imply that a weighted index is neutral or objective just because it is numerically precise.",
    ],
    useCases: [
      "Summarizing multi-criteria well-being, vulnerability, or sustainability conditions.",
      "Teaching why methodological transparency matters in ranking exercises.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Composite Indicator Builder",
        "Use the seven-step builder to inspect every methodological choice.",
        { tab: "Workflows", flowId: "indicator_composite" },
      ),
      createToolReference(
        "Dashboard tab · Dashboard Builder",
        "Compare composite outputs against their constituent indicators.",
        { tab: "Dashboard" },
      ),
    ],
    relatedPathIds: ["spatial_statistics_planners", "sdg11_monitoring_reporting", "scenario_planning_decision_support"],
    relatedExplainerIds: ["gini_coefficient", "scenario_tradeoffs"],
  },
  {
    id: "cellular_automata",
    title: "Cellular Automata Urban Growth",
    shortDefinition:
      "Cellular automata growth models update land-use states through local neighborhood effects, constraints, and stochastic perturbation.",
    formulas: [
      {
        label: "Transition potential",
        latex: String.raw`P_{i,t+1}(urban) = f(S_i, N_i, C_i, \varepsilon_t)`,
      },
    ],
    assumptions: [
      "Growth is partly shaped by local neighborhood structure and suitability.",
      "Constraint surfaces are explicit and reproducible.",
      "Validation is reported rather than assumed.",
    ],
    limitations: [
      "Simplified CA models cannot represent every institutional or market mechanism.",
      "Calibration quality depends heavily on the temporal land-use evidence available.",
    ],
    misuseWarnings: [
      "Do not treat a CA projection as a forecast of what will happen without policy context.",
      "Do not ignore validation metrics when comparing scenario runs.",
    ],
    useCases: [
      "Comparing urban expansion alternatives under different constraints.",
      "Teaching the distinction between simulation and prediction.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Urban Growth Cellular Automata",
        "Run calibration, simulation, and validation in the same workflow.",
        { tab: "Workflows", flowId: "urban_growth_ca" },
      ),
    ],
    relatedPathIds: ["scenario_planning_decision_support"],
    relatedExplainerIds: ["scenario_tradeoffs", "system_dynamics"],
  },
  {
    id: "facility_location_allocation",
    title: "Facility Siting and Location-Allocation",
    shortDefinition:
      "Location-allocation models search for facility placements that minimize travel burden, maximize coverage, or satisfy service thresholds under explicit rules.",
    formulas: [
      {
        label: "P-median objective",
        latex: String.raw`\min \sum_i \sum_j d_{ij} x_{ij}`,
      },
    ],
    assumptions: [
      "Candidate sites and demand units are defined explicitly.",
      "Travel burden or service thresholds are meaningful for the planning question.",
      "Equity constraints are treated as design choices, not afterthoughts.",
    ],
    limitations: [
      "Browser-friendly heuristics approximate the solution rather than proving a global optimum.",
      "Results depend on the candidate set supplied.",
    ],
    misuseWarnings: [
      "Do not call one siting solution optimal without stating the objective function and equity rules.",
      "Do not compare model outputs when demand and travel assumptions differ silently.",
    ],
    useCases: [
      "Locating schools, clinics, or shelters under access and fairness constraints.",
      "Teaching how optimization criteria produce different planning recommendations.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Facility Optimisation",
        "Configure and compare P-median, LSCP, and MCLP siting runs.",
        { tab: "Workflows", flowId: "facility_optimisation" },
      ),
      createToolReference(
        "Workflows tab · Equity Audit",
        "Use equity diagnostics to assess who benefits from the selected facilities.",
        { tab: "Workflows", flowId: "equity_audit" },
      ),
    ],
    relatedPathIds: ["accessibility_equity_analysis", "scenario_planning_decision_support"],
    relatedExplainerIds: ["gini_coefficient", "scenario_tradeoffs"],
  },
  {
    id: "system_dynamics",
    title: "System Dynamics and Explicit Euler Integration",
    shortDefinition:
      "System dynamics tracks stocks and flows through time so students can inspect how reinforcing and balancing feedback alter long-run trajectories.",
    formulas: [
      {
        label: "Discrete stock update",
        latex: String.raw`S_{t+1} = S_t + \Delta t(Inflow_t - Outflow_t)`,
      },
    ],
    assumptions: [
      "Stocks and flows are legible enough to interpret as a teaching model.",
      "Policy levers alter parameters transparently rather than invisibly.",
      "The simulation step length is reported.",
    ],
    limitations: [
      "A teaching-oriented stock-flow system simplifies many institutional and behavioral mechanisms.",
      "Long-run stability depends on chosen parameter ranges.",
    ],
    misuseWarnings: [
      "Do not read one simulated trajectory as the future absent scenario framing.",
      "Do not hide unstable parameter behavior when presenting results.",
    ],
    useCases: [
      "Explaining feedback loops in housing, employment, transport, and green-space change.",
      "Testing policy levers for teaching and stakeholder discussion.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · System Dynamics",
        "Inspect stocks, flows, causal loops, and trajectory charts in one view.",
        { tab: "Workflows", flowId: "system_dynamics" },
      ),
    ],
    relatedPathIds: ["environmental_resilience", "scenario_planning_decision_support"],
    relatedExplainerIds: ["scenario_tradeoffs", "cellular_automata"],
  },
  {
    id: "scenario_tradeoffs",
    title: "Scenario Comparison and Trade-Off Reasoning",
    shortDefinition:
      "Scenario comparison aligns baseline and alternative metrics so analysts can inspect absolute deltas, percent changes, and Pareto-style trade-offs.",
    formulas: [
      {
        label: "Absolute delta",
        latex: String.raw`\Delta_{abs} = x_s - x_b`,
      },
      {
        label: "Percent delta",
        latex: String.raw`\Delta_{\%} = \frac{x_s - x_b}{|x_b|} \times 100`,
      },
    ],
    assumptions: [
      "Baseline and alternative scenarios are aligned on a common metric frame.",
      "Directionality of each metric is explicit.",
      "Trade-off reasoning is linked to stakeholder priorities, not just composite rank.",
    ],
    limitations: [
      "Scenario dashboards compare the modeled evidence supplied; they do not explain political feasibility by themselves.",
      "Pareto candidates narrow the conversation but do not choose a preferred policy automatically.",
    ],
    misuseWarnings: [
      "Do not highlight a Pareto candidate as the preferred scenario without stating the value judgment involved.",
      "Do not compare scenarios when their underlying metrics or scales are not aligned.",
    ],
    useCases: [
      "Comparing land-use, access, resilience, or growth alternatives.",
      "Teaching students how to reason about compromise rather than single-score maximization.",
    ],
    linkedTools: [
      createToolReference(
        "Workflows tab · Scenario Comparison",
        "Use the comparison workflow to align metrics, compute deltas, and export narratives.",
        { tab: "Workflows", flowId: "scenario_comparison" },
      ),
      createToolReference(
        "Workflows tab · Scenario dashboard view",
        "Open the dedicated dashboard surface for side-by-side alternative comparison.",
        { tab: "Workflows", flowId: "scenario_comparison", workflowView: "dashboard" },
      ),
    ],
    relatedPathIds: ["foundations_urban_analytics", "environmental_resilience", "scenario_planning_decision_support"],
    relatedExplainerIds: ["system_dynamics", "composite_index"],
  },
];

export function getMethodologyExplainer(explainerId: MethodologyExplainer["id"]): MethodologyExplainer | null {
  return METHODOLOGY_EXPLAINERS.find((explainer) => explainer.id === explainerId) ?? null;
}