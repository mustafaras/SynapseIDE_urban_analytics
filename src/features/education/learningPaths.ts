import { createToolReference } from "./navigation";
import type { LearningPath } from "./types";

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "foundations_urban_analytics",
    title: "Foundations of Urban Analytics",
    description:
      "Orient students to the platform's core evidence surfaces before they move into inferential analysis, scenario design, or reporting.",
    audience: "First-term graduate planners and interdisciplinary studio teams",
    axisLabel: "Core literacy",
    totalExercises: 24,
    prerequisitePathIds: [],
    modules: [
      {
        id: "foundations.data_inventory_formats",
        title: "Data Types and Formats",
        summary:
          "Frame a study area using the project registry and distinguish vector, raster, tabular, and narrative assets before running indicators.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Projects tab · Project Registry",
            "Review project records, study scopes, and saved analytical context.",
            { tab: "Projects" },
          ),
          createToolReference(
            "Methods tab · Data Inventory guidance",
            "Use the methods guide to interpret inventory structure and provenance expectations.",
            { tab: "Methods" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Data provenance", "Spatial units", "Metadata discipline"],
      },
      {
        id: "foundations.crs_queries",
        title: "Coordinate Reference Systems and Spatial Queries",
        summary:
          "Use the guide and toolbox surfaces to understand projection discipline, spatial joins, and query safety before any modeling work.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.data_inventory_formats"],
        toolReferences: [
          createToolReference(
            "Methods tab · Spatial methods guide",
            "Study CRS notes, query framing, and reproducibility expectations.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Toolbox tab · data and reporting actions",
            "Use toolbox actions as the operational bridge between data review and outputs.",
            { tab: "Toolbox" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["CRS discipline", "Spatial predicates", "Query transparency"],
      },
      {
        id: "foundations.thematic_mapping",
        title: "Thematic Mapping",
        summary:
          "Compare how metrics become interpretable once they are encoded as maps, dashboard widgets, and report-ready visual summaries.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.crs_queries"],
        toolReferences: [
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Add maps, KPI cards, and charts into a presentation-grade canvas.",
            { tab: "Dashboard" },
          ),
          createToolReference(
            "Methods tab · cartography guidance",
            "Review cartographic classification and map communication rules.",
            { tab: "Methods" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Classification", "Legend design", "Interpretive clarity"],
      },
      {
        id: "foundations.classification_schemes",
        title: "Classification Schemes",
        summary:
          "Understand why quantiles, breaks, and ranked classes change the story a map tells, and how to justify a choice in reports.",
        estimatedMinutes: 35,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.thematic_mapping"],
        toolReferences: [
          createToolReference(
            "Methods tab · classification guide",
            "Inspect classification logic before applying it to dashboards or maps.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Dashboard tab · chart and map widgets",
            "Compare how the same metrics behave across alternative display forms.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Jenks", "Quantiles", "Communicative ethics"],
      },
      {
        id: "foundations.descriptive_spatial_stats",
        title: "Descriptive Spatial Statistics",
        summary:
          "Introduce inequality and dispersion thinking before formal spatial autocorrelation or regression diagnostics.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.classification_schemes"],
        toolReferences: [
          createToolReference(
            "Methods tab · indicators and interpretation",
            "Review descriptive statistic interpretation before using them in analytic narratives.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Practice turning descriptive outputs into academically credible method notes.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["gini_coefficient"],
        indicatorContexts: ["Distribution", "Dispersion", "Inequality"],
      },
      {
        id: "foundations.indicator_calculation",
        title: "Indicator Calculation",
        summary:
          "Move from description into reproducible indicator pipelines using live workflows already present in the platform.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.descriptive_spatial_stats"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Accessibility analysis",
            "Use a complete seven-step workflow to understand indicator inputs, thresholds, and outputs.",
            { tab: "Workflows", flowId: "accessibility" },
          ),
          createToolReference(
            "Workflows tab · Vulnerability assessment",
            "Trace how composite indicators are framed, normalized, and interpreted.",
            { tab: "Workflows", flowId: "vulnerability" },
          ),
        ],
        methodologyIds: ["hansen_accessibility", "vulnerability_ipcc"],
        indicatorContexts: ["Accessibility", "Risk", "Composite construction"],
      },
      {
        id: "foundations.workflow_comparison",
        title: "Workflow Comparison",
        summary:
          "Compare how different flows answer different planning questions and what evidence each one produces.",
        estimatedMinutes: 50,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.indicator_calculation"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Scenario Comparison",
            "Compare multiple policy alternatives against a common metric frame.",
            { tab: "Workflows", flowId: "scenario_comparison" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Turn workflow outputs into an interpretable decision-support layout.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["scenario_tradeoffs"],
        indicatorContexts: ["Baseline vs alternative", "Trade-offs", "Narrative framing"],
      },
      {
        id: "foundations.report_writing",
        title: "Report Writing",
        summary:
          "Close the loop by translating maps, diagnostics, and scenario outputs into structured technical or policy-facing reports.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: ["foundations.workflow_comparison"],
        toolReferences: [
          createToolReference(
            "Report tab · Report Builder",
            "Assemble citations, sections, and generated narrative into a coherent report.",
            { tab: "Report" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Reuse dashboard outputs as supporting figures and tables.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["sdg_monitoring"],
        indicatorContexts: ["Citation discipline", "Narrative method notes", "Export governance"],
      },
    ],
  },
  {
    id: "spatial_statistics_planners",
    title: "Spatial Statistics for Planners",
    description:
      "Use inferential spatial tools and diagnostic reasoning to distinguish pattern, cluster, outlier, and modeled relationship.",
    audience: "Students moving from descriptive mapping into defensible analysis",
    axisLabel: "Axis 1 · Spatial Statistical Depth",
    totalExercises: 18,
    prerequisitePathIds: ["foundations_urban_analytics"],
    modules: [
      {
        id: "spatial_stats.autocorrelation",
        title: "Spatial Autocorrelation",
        summary:
          "Interpret positive and negative autocorrelation, expected value, and permutation logic before discussing neighborhood effects.",
        estimatedMinutes: 50,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Methods tab · Spatial statistics guide",
            "Use the methods guide to frame autocorrelation before applying it to analysis outputs.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Practice documenting the weight matrix, inference mode, and reporting caveats.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["morans_i"],
        indicatorContexts: ["Global Moran's I", "LISA", "Spatial lag"],
      },
      {
        id: "spatial_stats.hotspot",
        title: "Hot-Spot Analysis",
        summary:
          "Move from global dependence to local hot-spot and cold-spot interpretation using standardized neighborhood statistics.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["spatial_stats.autocorrelation"],
        toolReferences: [
          createToolReference(
            "Methods tab · Spatial statistics guide",
            "Review confidence interpretation and neighborhood specification choices.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Workflows tab · Run Review",
            "Use completed-run review patterns to examine local outputs and reporting language.",
            { tab: "Workflows", flowId: "review" },
          ),
        ],
        methodologyIds: ["getis_ord_gi"],
        indicatorContexts: ["Gi*", "Confidence mapping", "Targeting interventions"],
      },
      {
        id: "spatial_stats.regression_diagnostics",
        title: "Regression Diagnostics",
        summary:
          "Connect OLS assumptions, residual diagnostics, and the move toward local models without treating outputs as black boxes.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["spatial_stats.hotspot"],
        toolReferences: [
          createToolReference(
            "Methods tab · Spatial statistics guide",
            "Read the model-selection narrative before fitting or interpreting regression outputs.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Document residual tests, diagnostics, and why a spatial model is justified.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["ols_gwr"],
        indicatorContexts: ["OLS", "Jarque-Bera", "Breusch-Pagan", "GWR"],
      },
      {
        id: "spatial_stats.point_pattern",
        title: "Point Pattern Analysis",
        summary:
          "Use point intensity, clustering logic, and study-area definition critically before making causal claims from event locations.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: ["spatial_stats.regression_diagnostics"],
        toolReferences: [
          createToolReference(
            "Methods tab · Spatial statistics guide",
            "Use the guide as the primary surface for point pattern reasoning and limitations.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Summarize event patterns, counts, and diagnostics in a comparison-ready layout.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Intensity", "Study window", "Event clustering"],
      },
      {
        id: "spatial_stats.geostatistics",
        title: "Geostatistics",
        summary:
          "Interpret variograms, interpolation assumptions, and uncertainty before treating a surface as measured truth.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["spatial_stats.point_pattern"],
        toolReferences: [
          createToolReference(
            "Methods tab · Spatial statistics guide",
            "Review interpolation assumptions and reporting language.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Capture uncertainty and methodological limitations in a technical appendix.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Variogram", "Kriging", "Uncertainty surfaces"],
      },
      {
        id: "spatial_stats.multivariate",
        title: "Multivariate Interpretation",
        summary:
          "Transition from single-metric diagnostics into dimension reduction, clustering, and structured composite reasoning.",
        estimatedMinutes: 50,
        exerciseCount: 3,
        prerequisiteModuleIds: ["spatial_stats.geostatistics"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Composite Indicator Builder",
            "Use the composite workflow as the most visible multivariate teaching surface in the current app.",
            { tab: "Workflows", flowId: "indicator_composite" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Compare multivariate outputs across maps, ranking tables, and advanced charts.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["composite_index"],
        indicatorContexts: ["PCA reasoning", "Cluster interpretation", "Composite weighting"],
      },
    ],
  },
  {
    id: "accessibility_equity_analysis",
    title: "Accessibility & Equity Analysis",
    description:
      "Move from network reach and gravity-based access into distributional justice, service burden, and siting trade-offs.",
    audience: "Students working on service provision, mobility justice, or neighborhood equity",
    axisLabel: "Accessibility and distribution",
    totalExercises: 15,
    prerequisitePathIds: ["foundations_urban_analytics"],
    modules: [
      {
        id: "accessibility.network_fundamentals",
        title: "Network Analysis Fundamentals",
        summary:
          "Use the accessibility workflow to distinguish topology, impedance, catchments, and service thresholds.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Workflows tab · Accessibility analysis",
            "Run the full seven-step accessibility flow using built-in sample evidence.",
            { tab: "Workflows", flowId: "accessibility" },
          ),
          createToolReference(
            "Methods tab · Network analysis guide",
            "Interpret network assumptions before comparing travel-time outputs.",
            { tab: "Methods" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Network impedance", "Catchments", "Reachability"],
      },
      {
        id: "accessibility.isochrone_generation",
        title: "Isochrone Generation",
        summary:
          "Interpret travel-time contours, threshold selection, and service coverage before converting maps into policy claims.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["accessibility.network_fundamentals"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Accessibility analysis",
            "Generate and compare multimodal catchments directly in the workflow surface.",
            { tab: "Workflows", flowId: "accessibility" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Turn reachability outputs into a studio-ready comparative dashboard.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Isochrones", "Threshold sensitivity", "Coverage"],
      },
      {
        id: "accessibility.hansen_gravity",
        title: "Gravity Models",
        summary:
          "Study how opportunity mass and decay functions shape the accessibility score rather than reading the surface as a fixed fact.",
        estimatedMinutes: 50,
        exerciseCount: 3,
        prerequisiteModuleIds: ["accessibility.isochrone_generation"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Accessibility analysis",
            "Compare threshold-based access with model-based accessibility reasoning.",
            { tab: "Workflows", flowId: "accessibility" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Explain decay assumptions and what the model can and cannot support.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["hansen_accessibility"],
        indicatorContexts: ["Opportunity decay", "Travel impedance", "Model sensitivity"],
      },
      {
        id: "accessibility.equity_metrics",
        title: "Equity Metrics",
        summary:
          "Move from average access to distributional justice using disparity, concentration, and burden-aware interpretation.",
        estimatedMinutes: 50,
        exerciseCount: 3,
        prerequisiteModuleIds: ["accessibility.hansen_gravity"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Equity Audit",
            "Inspect disparities, group summaries, and report-ready equity findings.",
            { tab: "Workflows", flowId: "equity_audit" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Build coverage and disparity dashboards for stakeholder comparison.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["gini_coefficient"],
        indicatorContexts: ["Gini", "Theil reasoning", "Access burden"],
      },
      {
        id: "accessibility.facility_siting",
        title: "Facility Siting Optimisation",
        summary:
          "Use location-allocation logic to compare efficient and equity-aware service placement rather than assuming one best site exists.",
        estimatedMinutes: 60,
        exerciseCount: 3,
        prerequisiteModuleIds: ["accessibility.equity_metrics"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Facility Optimisation",
            "Configure P-median, LSCP, or MCLP siting runs and inspect catchment outputs.",
            { tab: "Workflows", flowId: "facility_optimisation" },
          ),
          createToolReference(
            "Workflows tab · Equity Audit",
            "Bring siting outputs back into an equity framing.",
            { tab: "Workflows", flowId: "equity_audit" },
          ),
        ],
        methodologyIds: ["facility_location_allocation"],
        indicatorContexts: ["P-median", "Coverage", "Maximin equity"],
      },
    ],
  },
  {
    id: "environmental_resilience",
    title: "Environmental Assessment & Resilience",
    description:
      "Connect remote sensing, green infrastructure, risk, and vulnerability into a coherent environmental-planning interpretation workflow.",
    audience: "Students working on climate adaptation, resilience, and environmental justice",
    axisLabel: "Environment and risk",
    totalExercises: 15,
    prerequisitePathIds: ["foundations_urban_analytics"],
    modules: [
      {
        id: "environment.remote_sensing_indices",
        title: "Remote Sensing Indices",
        summary:
          "Use the methods and connector surfaces to understand what NDVI-like indicators measure, and what they cannot resolve in dense urban scenes.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Methods tab · Remote sensing guide",
            "Study index interpretation, cloud masking notes, and reporting discipline.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Toolbox tab · data and reporting actions",
            "Prepare connector-driven evidence for environmental workflows.",
            { tab: "Toolbox" },
          ),
        ],
        methodologyIds: ["ndvi"],
        indicatorContexts: ["NDVI", "NDBI", "Acquisition date sensitivity"],
      },
      {
        id: "environment.green_infrastructure",
        title: "Green Infrastructure Metrics",
        summary:
          "Translate environmental rasters and land-use evidence into interpretable green-space and canopy narratives.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: ["environment.remote_sensing_indices"],
        toolReferences: [
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Compare vegetation, greenness, and environmental equity indicators across neighborhoods.",
            { tab: "Dashboard" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Package environmental indicators into a defensible planning note.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["ndvi"],
        indicatorContexts: ["Green space per capita", "Canopy", "Environmental burden"],
      },
      {
        id: "environment.vulnerability_frameworks",
        title: "Vulnerability Frameworks",
        summary:
          "Use the live vulnerability workflow to reason through hazard, exposure, sensitivity, and adaptive capacity instead of treating risk as a single score.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["environment.green_infrastructure"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Vulnerability assessment",
            "Run the IPCC-style workflow and inspect how each component shapes the result.",
            { tab: "Workflows", flowId: "vulnerability" },
          ),
          createToolReference(
            "Methods tab · Resilience guidance",
            "Review resilience framing before drawing causal claims from a composite score.",
            { tab: "Methods" },
          ),
        ],
        methodologyIds: ["vulnerability_ipcc"],
        indicatorContexts: ["Hazard", "Exposure", "Adaptive capacity"],
      },
      {
        id: "environment.risk_mapping",
        title: "Compound Risk Mapping",
        summary:
          "Practice combining environmental hazards and social vulnerability without masking uncertainty or scale mismatch.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["environment.vulnerability_frameworks"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Vulnerability assessment",
            "Inspect mapped outputs and interpretation notes for compound risk framing.",
            { tab: "Workflows", flowId: "vulnerability" },
          ),
          createToolReference(
            "Workflows tab · Change Detection",
            "Use temporal comparison surfaces when discussing environmental transitions.",
            { tab: "Workflows", flowId: "change_detection" },
          ),
        ],
        methodologyIds: ["vulnerability_ipcc"],
        indicatorContexts: ["Compound hazards", "Temporal comparison", "Uncertainty"],
      },
      {
        id: "environment.adaptation_scenarios",
        title: "Climate Adaptation Scenarios",
        summary:
          "Use simulation and trade-off views to reason about adaptation packages instead of reporting a single target-state map.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["environment.risk_mapping"],
        toolReferences: [
          createToolReference(
            "Workflows tab · System Dynamics",
            "Test policy levers and inspect long-run stock trajectories relevant to adaptation.",
            { tab: "Workflows", flowId: "system_dynamics" },
          ),
          createToolReference(
            "Workflows tab · Scenario Comparison",
            "Compare adaptation alternatives using aligned performance metrics.",
            { tab: "Workflows", flowId: "scenario_comparison" },
          ),
        ],
        methodologyIds: ["system_dynamics", "scenario_tradeoffs"],
        indicatorContexts: ["Long-run dynamics", "Trade-offs", "Adaptation packages"],
      },
    ],
  },
  {
    id: "urban_morphology_form",
    title: "Urban Morphology & Form",
    description:
      "Interpret density, street structure, and land-use mix as mutually shaping components of urban form rather than isolated scores.",
    audience: "Design studios, morphology seminars, and urban form electives",
    axisLabel: "Built-form analysis",
    totalExercises: 12,
    prerequisitePathIds: ["foundations_urban_analytics"],
    modules: [
      {
        id: "morphology.density_metrics",
        title: "Density Metrics",
        summary:
          "Use built-form guidance to distinguish plot coverage, floor area, and open-space relationships before making densification claims.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Methods tab · Built form guidance",
            "Inspect how density metrics are framed and compared across urban contexts.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Compare density and land-use metrics as a studio-facing dashboard narrative.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["spacematrix_density"],
        indicatorContexts: ["FAR", "GSI", "OSR"],
      },
      {
        id: "morphology.street_connectivity",
        title: "Street Connectivity",
        summary:
          "Move from network shape into comparative interpretation of connectedness and permeability.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: ["morphology.density_metrics"],
        toolReferences: [
          createToolReference(
            "Methods tab · Network analysis guide",
            "Review connectivity metrics before comparing neighborhoods.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Workflows tab · Accessibility analysis",
            "Use a full workflow to see how connectivity affects reach and access.",
            { tab: "Workflows", flowId: "accessibility" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Alpha, beta, gamma", "Permeability", "Street network structure"],
      },
      {
        id: "morphology.space_syntax",
        title: "Space Syntax and Movement Logic",
        summary:
          "Interpret integration and choice carefully, especially when students are tempted to confuse configurational logic with observed demand.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["morphology.street_connectivity"],
        toolReferences: [
          createToolReference(
            "Methods tab · Network analysis guide",
            "Use the guide to frame space syntax outputs and their limitations.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Document configuration-based findings with proper caveats.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Integration", "Choice", "Movement potential"],
      },
      {
        id: "morphology.mixed_use",
        title: "Mixed-Use Analysis",
        summary:
          "Use land-use diversity reasoning to interpret entropy measures and their relationship to accessibility or vitality arguments.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: ["morphology.space_syntax"],
        toolReferences: [
          createToolReference(
            "Methods tab · indicators guide",
            "Review diversity and land-use framing in the methods guide.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Pair mixed-use indicators with accessibility or environmental outputs.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Entropy", "Land-use mix", "Urban vitality"],
      },
    ],
  },
  {
    id: "sdg11_monitoring_reporting",
    title: "SDG 11 Monitoring & Reporting",
    description:
      "Turn indicator definitions into a workflow for evidence, visualization, and communication suitable for voluntary local review work.",
    audience: "Municipal analysts, policy students, and monitoring studios",
    axisLabel: "Monitoring and communication",
    totalExercises: 12,
    prerequisitePathIds: ["foundations_urban_analytics"],
    modules: [
      {
        id: "sdg11.indicator_definitions",
        title: "Indicator Definitions",
        summary:
          "Understand what SDG 11 indicators mean before students start mapping or comparing them across cities.",
        estimatedMinutes: 40,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Methods tab · indicators guide",
            "Review the meaning and interpretation of urban indicators before visualizing them.",
            { tab: "Methods" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Translate indicator definitions into reproducible report sections.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["sdg_monitoring"],
        indicatorContexts: ["11.1.1-11.7.1", "Indicator metadata", "Comparability"],
      },
      {
        id: "sdg11.data_source_mapping",
        title: "Data Source Mapping",
        summary:
          "Map each monitoring question to a viable source surface before teaching students to automate dashboards.",
        estimatedMinutes: 35,
        exerciseCount: 3,
        prerequisiteModuleIds: ["sdg11.indicator_definitions"],
        toolReferences: [
          createToolReference(
            "Projects tab · Project Registry",
            "Use project metadata and references as the starting point for SDG evidence framing.",
            { tab: "Projects" },
          ),
          createToolReference(
            "Toolbox tab · data and reporting actions",
            "Coordinate data preparation and export decisions from the toolbox.",
            { tab: "Toolbox" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Source traceability", "Coverage gaps", "Temporal alignment"],
      },
      {
        id: "sdg11.calculation_visualisation",
        title: "Calculation and Visualisation",
        summary:
          "Translate monitoring logic into dashboards and maps that remain interpretable for non-technical decision-makers.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["sdg11.data_source_mapping"],
        toolReferences: [
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Compose SDG-ready dashboards with maps, KPI cards, and narrative framing.",
            { tab: "Dashboard" },
          ),
          createToolReference(
            "Workflows tab · Composite Indicator Builder",
            "Reuse multivariate logic where SDG aggregation is needed.",
            { tab: "Workflows", flowId: "indicator_composite" },
          ),
        ],
        methodologyIds: ["sdg_monitoring"],
        indicatorContexts: ["Indicators to visuals", "Comparative framing", "Threshold communication"],
      },
      {
        id: "sdg11.vlr_reporting",
        title: "Voluntary Local Review",
        summary:
          "Assemble final narratives, figures, and citations for city-facing reporting workflows.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["sdg11.calculation_visualisation"],
        toolReferences: [
          createToolReference(
            "Report tab · Report Builder",
            "Assemble formal reporting sections with citations and exports.",
            { tab: "Report" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Reuse dashboard views as briefing outputs for a review process.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["sdg_monitoring"],
        indicatorContexts: ["VLR", "Monitoring narrative", "Evidence packaging"],
      },
    ],
  },
  {
    id: "urban_modelling_3d",
    title: "3D Urban Modelling",
    description:
      "Use the live VoxCity surfaces to move from 2D footprints into inspectable 3D form, semantics, and solar interpretation.",
    audience: "Students studying digital twins, urban design, and 3D evidence communication",
    axisLabel: "Axis 4 · 3D and digital twin",
    totalExercises: 12,
    prerequisitePathIds: ["foundations_urban_analytics"],
    modules: [
      {
        id: "urban3d.building_extrusion",
        title: "Building Extrusion from GeoJSON",
        summary:
          "Use the live 3D workflow to understand how footprint geometry becomes a navigable urban form surface.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Workflows tab · VoxCity 3D",
            "Inspect extruded buildings, LOD toggles, and thematic styling choices.",
            { tab: "Workflows", flowId: "voxcity_3d" },
          ),
        ],
        methodologyIds: ["building_extrusion"],
        indicatorContexts: ["Height defaults", "LOD", "Thematic 3D styling"],
      },
      {
        id: "urban3d.cityjson_ingestion",
        title: "CityJSON Ingestion",
        summary:
          "Move from generic extrusion into semantic 3D objects and metadata inspection.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["urban3d.building_extrusion"],
        toolReferences: [
          createToolReference(
            "Workflows tab · CityJSON loader",
            "Load semantic city objects and inspect their retained attributes.",
            { tab: "Workflows", flowId: "cityjson_loader" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Semantic surfaces", "CityObjects", "Attribute retention"],
      },
      {
        id: "urban3d.semantic_surfaces",
        title: "Semantic Surface Inspection",
        summary:
          "Inspect roof, wall, and ground semantics as distinct analytical surfaces rather than a single render layer.",
        estimatedMinutes: 35,
        exerciseCount: 3,
        prerequisiteModuleIds: ["urban3d.cityjson_ingestion"],
        toolReferences: [
          createToolReference(
            "Workflows tab · CityJSON loader",
            "Inspect semantic surface coloring and object-level metadata from the live flow.",
            { tab: "Workflows", flowId: "cityjson_loader" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Document what semantic retention adds to a digital-twin style analysis.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: [],
        indicatorContexts: ["Roof/wall/ground", "Semantic inspection", "3D metadata"],
      },
      {
        id: "urban3d.sunlight_analysis",
        title: "Sunlight and Solar Exposure",
        summary:
          "Interpret time-stepped shadow logic and exposure summaries without overclaiming site-level precision.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["urban3d.semantic_surfaces"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Sunlight simulation",
            "Run date-based shadow and exposure scenarios directly in the 3D viewer.",
            { tab: "Workflows", flowId: "sunlight_sim" },
          ),
        ],
        methodologyIds: ["sunlight_exposure"],
        indicatorContexts: ["Solar exposure", "Shadow accumulation", "Temporal stepping"],
      },
    ],
  },
  {
    id: "scenario_planning_decision_support",
    title: "Scenario Planning & Decision Support",
    description:
      "Integrate composite scores, simulation, equity reasoning, and trade-off interpretation into coherent planning decisions.",
    audience: "Advanced studios, municipal scenario work, and capstone research teams",
    axisLabel: "Axis 5 and 6 · Simulation and decision support",
    totalExercises: 15,
    prerequisitePathIds: [
      "foundations_urban_analytics",
      "accessibility_equity_analysis",
      "environmental_resilience",
    ],
    modules: [
      {
        id: "scenario.composite_indices",
        title: "Composite Indicators",
        summary:
          "Work through imputation, normalization, weighting, aggregation, and uncertainty with a visible seven-step workflow.",
        estimatedMinutes: 60,
        exerciseCount: 3,
        prerequisiteModuleIds: [],
        toolReferences: [
          createToolReference(
            "Workflows tab · Composite Indicator Builder",
            "Use the full seven-step builder with live maps, weights, and uncertainty outputs.",
            { tab: "Workflows", flowId: "indicator_composite" },
          ),
          createToolReference(
            "Dashboard tab · Dashboard Builder",
            "Stage composite outputs for classroom or stakeholder comparison.",
            { tab: "Dashboard" },
          ),
        ],
        methodologyIds: ["composite_index"],
        indicatorContexts: ["OECD/JRC workflow", "Weights", "Uncertainty"],
      },
      {
        id: "scenario.urban_growth",
        title: "Cellular Automata Urban Growth",
        summary:
          "Use a tractable urban growth model to compare protected areas, constraints, and stochastic change rather than projecting growth as deterministic.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["scenario.composite_indices"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Urban Growth Cellular Automata",
            "Run calibration, simulation, and validation within the simulation workflow.",
            { tab: "Workflows", flowId: "urban_growth_ca" },
          ),
        ],
        methodologyIds: ["cellular_automata"],
        indicatorContexts: ["Suitability surfaces", "Constraints", "Validation"],
      },
      {
        id: "scenario.facility_equity",
        title: "Facility Siting with Equity",
        summary:
          "Compare efficient site selection against equity-aware rules so access gains are not read as distributionally neutral.",
        estimatedMinutes: 55,
        exerciseCount: 3,
        prerequisiteModuleIds: ["scenario.urban_growth"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Facility Optimisation",
            "Compare location-allocation models and inspect catchments.",
            { tab: "Workflows", flowId: "facility_optimisation" },
          ),
          createToolReference(
            "Workflows tab · Equity Audit",
            "Bring allocation outputs back into disparity interpretation.",
            { tab: "Workflows", flowId: "equity_audit" },
          ),
        ],
        methodologyIds: ["facility_location_allocation"],
        indicatorContexts: ["Coverage", "Travel burden", "Equity constraints"],
      },
      {
        id: "scenario.equity_audit",
        title: "Equity Audit",
        summary:
          "Interrogate who benefits, who remains underserved, and how that conclusion changes when the evidence frame changes.",
        estimatedMinutes: 45,
        exerciseCount: 3,
        prerequisiteModuleIds: ["scenario.facility_equity"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Equity Audit",
            "Use the live audit workflow to inspect group disparities and findings.",
            { tab: "Workflows", flowId: "equity_audit" },
          ),
          createToolReference(
            "Report tab · Report Builder",
            "Turn equity findings into narrative sections with caveats and references.",
            { tab: "Report" },
          ),
        ],
        methodologyIds: ["gini_coefficient"],
        indicatorContexts: ["Distributional justice", "Disparity narratives", "Benefit incidence"],
      },
      {
        id: "scenario.tradeoffs_feedback",
        title: "Scenario Comparison and Feedback Dynamics",
        summary:
          "Combine scenario dashboards with stock-flow reasoning so students can compare alternatives and explain why trajectories differ.",
        estimatedMinutes: 65,
        exerciseCount: 3,
        prerequisiteModuleIds: ["scenario.equity_audit"],
        toolReferences: [
          createToolReference(
            "Workflows tab · Scenario Comparison",
            "Compare baseline and alternatives using aligned indicators and trade-off views.",
            { tab: "Workflows", flowId: "scenario_comparison" },
          ),
          createToolReference(
            "Workflows tab · Scenario dashboard view",
            "Open the dedicated dashboard workspace for comparison outputs.",
            { tab: "Workflows", flowId: "scenario_comparison", workflowView: "dashboard" },
          ),
          createToolReference(
            "Workflows tab · System Dynamics",
            "Use stock-and-flow simulation to explain long-run policy feedbacks.",
            { tab: "Workflows", flowId: "system_dynamics" },
          ),
        ],
        methodologyIds: ["scenario_tradeoffs", "system_dynamics"],
        indicatorContexts: ["Delta analysis", "Trade-offs", "Feedback loops"],
      },
    ],
  },
];