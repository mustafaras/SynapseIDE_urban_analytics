import { createToolReference } from "../navigation";
import type {
  ExerciseDefinition,
  ExerciseKeywordConcept,
  ExerciseRubricCriterion,
  LearningPathId,
} from "../types";

function numericCriterion(
  id: string,
  label: string,
  description: string,
  points: number,
  fieldId: string,
  expectedValue: number,
  tolerance: number,
  guidance: string,
  partialTolerance?: number,
): ExerciseRubricCriterion {
  return {
    id,
    label,
    description,
    points,
    rule: {
      type: "numeric",
      fieldId,
      expectedValue,
      tolerance,
      ...(partialTolerance ? { partialTolerance } : {}),
      guidance,
    },
  };
}

function singleSelectCriterion(
  id: string,
  label: string,
  description: string,
  points: number,
  fieldId: string,
  correctOptionId: string,
  guidance: string,
  targetedFeedbackByOption?: Record<string, string>,
): ExerciseRubricCriterion {
  return {
    id,
    label,
    description,
    points,
    rule: {
      type: "single_select",
      fieldId,
      correctOptionId,
      guidance,
      ...(targetedFeedbackByOption ? { targetedFeedbackByOption } : {}),
    },
  };
}

function multiSelectCriterion(
  id: string,
  label: string,
  description: string,
  points: number,
  fieldId: string,
  requiredOptionIds: string[],
  guidance: string,
  forbiddenOptionIds?: string[],
  targetedFeedbackByOption?: Record<string, string>,
  minimumMatches?: number,
): ExerciseRubricCriterion {
  return {
    id,
    label,
    description,
    points,
    rule: {
      type: "multi_select",
      fieldId,
      requiredOptionIds,
      guidance,
      ...(forbiddenOptionIds ? { forbiddenOptionIds } : {}),
      ...(targetedFeedbackByOption ? { targetedFeedbackByOption } : {}),
      ...(minimumMatches ? { minimumMatches } : {}),
    },
  };
}

function keywordCriterion(
  id: string,
  label: string,
  description: string,
  points: number,
  fieldId: string,
  concepts: ExerciseKeywordConcept[],
  guidance: string,
  minimumMatches?: number,
): ExerciseRubricCriterion {
  return {
    id,
    label,
    description,
    points,
    rule: {
      type: "keyword",
      fieldId,
      concepts,
      guidance,
      ...(minimumMatches ? { minimumMatches } : {}),
    },
  };
}

function exerciseTools(pathId: LearningPathId, moduleId: string, workflowLabel: string, flowId?: string) {
  return [
    createToolReference(
      "Education tab - Learning path context",
      "Jump back into the linked learning path and review prerequisite logic before re-attempting the exercise.",
      { tab: "Education" },
    ),
    createToolReference(
      workflowLabel,
      `Open the live tool connected to ${moduleId} inside the ${pathId} path.`,
      flowId ? { tab: "Workflows", flowId } : { tab: "Methods" },
    ),
  ];
}

export const EXERCISE_CATALOG: ExerciseDefinition[] = [
  {
    id: "hansen_accessibility_clinic_score",
    category: "calculator",
    title: "Compute a Hansen clinic accessibility score",
    summary: "Apply gravity-style decay to estimate how much clinic opportunity is realistically reachable from one tract.",
    scenario:
      "A district planning team is comparing clinic access for a tract. Three clinics offer 120, 80, and 45 daily appointment slots. Travel times are 8, 15, and 22 minutes. Use A_i = sum O_j e^(-0.05 d_ij).",
    instructions: [
      "Calculate the accessibility score to two decimal places.",
      "Explain what a higher score means in planning terms instead of describing it as a raw facility count.",
    ],
    pathId: "accessibility_equity_analysis",
    moduleId: "accessibility.hansen_gravity",
    difficulty: "standard",
    estimatedMinutes: 12,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "score",
        type: "number",
        label: "Accessibility score",
        helperText: "Use the decay function exactly as written in the scenario.",
        placeholder: "133.21",
        required: true,
        step: 0.01,
      },
      {
        id: "interpretation",
        type: "textarea",
        label: "Policy interpretation",
        helperText: "One or two sentences are enough.",
        placeholder: "A higher score means...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      numericCriterion(
        "score_math",
        "Decay-weighted computation",
        "Discount every clinic by travel time before summing the reachable opportunity mass.",
        7,
        "score",
        133.21,
        0.5,
        "Revisit the exponential decay step. Each clinic contributes less than its raw slot count once travel time is applied.",
        2,
      ),
      keywordCriterion(
        "score_meaning",
        "Interpretation of the metric",
        "Explain the score as reachable opportunity rather than as a simple facility count.",
        3,
        "interpretation",
        [
          {
            id: "access",
            label: "reachable access",
            terms: ["access", "reachable", "reach", "availability"],
            guidance: "Describe the output as access to opportunity, not just arithmetic volume.",
          },
          {
            id: "opportunity",
            label: "opportunity mass",
            terms: ["opportun", "slots", "service", "clinic"],
            guidance: "Reference the amount of service opportunity that residents can reach.",
          },
        ],
        "State what the score means for residents' reachable opportunity after travel friction is considered.",
        2,
      ),
    ],
    hints: [
      "An 8-minute clinic should still contribute a lot, but not its full 120 slots.",
      "Compute three discounted terms first, then sum them.",
    ],
    toolReferences: exerciseTools(
      "accessibility_equity_analysis",
      "accessibility.hansen_gravity",
      "Workflows tab - Accessibility analysis",
      "accessibility",
    ),
  },
  {
    id: "vulnerability_composite_priority_index",
    category: "calculator",
    title: "Calculate a weighted vulnerability priority index",
    summary: "Translate hazard, exposure, sensitivity, and adaptive capacity into a defensible composite priority score.",
    scenario:
      "A resilience team uses V = 0.35H + 0.25E + 0.25S - 0.15A. For one neighborhood, H = 0.72, E = 0.65, S = 0.54, and A = 0.40. Classify the result using: High priority >= 0.45, Moderate 0.30-0.449, Lower < 0.30.",
    instructions: [
      "Compute the index to three decimal places.",
      "Select the correct intervention priority band.",
    ],
    pathId: "environmental_resilience",
    moduleId: "environment.vulnerability_frameworks",
    difficulty: "standard",
    estimatedMinutes: 10,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "index_value",
        type: "number",
        label: "Composite vulnerability index",
        placeholder: "0.490",
        required: true,
        step: 0.001,
      },
      {
        id: "priority_band",
        type: "single_select",
        label: "Priority band",
        required: true,
        options: [
          { id: "high", label: "High priority" },
          { id: "moderate", label: "Moderate priority" },
          { id: "lower", label: "Lower priority" },
        ],
      },
    ],
    rubric: [
      numericCriterion(
        "index_math",
        "Weighted composite calculation",
        "Apply positive weights to hazard, exposure, sensitivity, and subtract adaptive capacity using the stated coefficient.",
        6,
        "index_value",
        0.4895,
        0.015,
        "Re-check the sign on adaptive capacity and make sure the weights sum correctly across all four terms.",
        0.05,
      ),
      singleSelectCriterion(
        "priority_band_selection",
        "Priority classification",
        "Classify the result against the stated priority thresholds after computing the score.",
        4,
        "priority_band",
        "high",
        "Map the computed value back to the threshold table before selecting a band.",
        {
          moderate: "A moderate band would apply only if the weighted score stayed below 0.45.",
          lower: "A lower-priority label would ignore the fact that the composite remains close to 0.50.",
        },
      ),
    ],
    hints: [
      "Adaptive capacity lowers the index in this specification rather than increasing it.",
      "Once you compute the weighted total, use the threshold table exactly as written.",
    ],
    toolReferences: exerciseTools(
      "environmental_resilience",
      "environment.vulnerability_frameworks",
      "Workflows tab - Vulnerability assessment",
      "vulnerability",
    ),
  },
  {
    id: "composite_builder_stage_order",
    category: "flow",
    title: "Sequence a composite indicator workflow correctly",
    summary: "Order the seven stages of a rigorous composite indicator build instead of treating reporting as an afterthought.",
    scenario:
      "Your studio is preparing a neighborhood opportunity index using the seven-step Composite Indicator Builder. The workflow must preserve methodological transparency and uncertainty inspection before final reporting.",
    instructions: [
      "Choose the most defensible stage order.",
      "Explain why sensitivity and uncertainty should appear before final reporting.",
    ],
    pathId: "scenario_planning_decision_support",
    moduleId: "scenario.composite_indices",
    difficulty: "standard",
    estimatedMinutes: 11,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "stage_order",
        type: "single_select",
        label: "Workflow sequence",
        required: true,
        options: [
          {
            id: "correct",
            label:
              "Indicator selection -> missing data / imputation -> normalization -> weighting -> aggregation -> sensitivity and uncertainty -> final reporting",
          },
          {
            id: "report_early",
            label:
              "Indicator selection -> normalization -> weighting -> final reporting -> aggregation -> sensitivity and uncertainty -> missing data handling",
          },
          {
            id: "weight_before_cleaning",
            label:
              "Indicator selection -> weighting -> missing data handling -> normalization -> aggregation -> reporting -> sensitivity",
          },
          {
            id: "aggregate_first",
            label:
              "Indicator selection -> aggregation -> normalization -> weighting -> missing data handling -> sensitivity -> final reporting",
          },
        ],
      },
      {
        id: "uncertainty_reason",
        type: "textarea",
        label: "Why should sensitivity and uncertainty precede reporting?",
        placeholder: "They should come before reporting because...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "sequence_choice",
        "Seven-step order",
        "Choose the sequence that cleans the data, transforms it, combines it, then stress-tests the result before reporting.",
        6,
        "stage_order",
        "correct",
        "A rigorous composite workflow resolves missingness and scale issues before weighting, aggregation, and reporting.",
        {
          report_early: "Reporting before uncertainty inspection would hide whether the ranking is robust.",
          weight_before_cleaning: "Weighting before missing-data handling and normalization can lock in avoidable bias.",
          aggregate_first: "Aggregation cannot come before indicators are normalized and weighted.",
        },
      ),
      keywordCriterion(
        "uncertainty_rationale",
        "Reason for uncertainty stage",
        "Explain that the reporting stage should come after the analyst has inspected robustness or uncertainty.",
        4,
        "uncertainty_reason",
        [
          {
            id: "robustness",
            label: "robustness",
            terms: ["robust", "robustness", "stable", "sensitivity"],
            guidance: "Mention that robustness or sensitivity checks test whether the ranking changes under alternative assumptions.",
          },
          {
            id: "uncertainty",
            label: "uncertainty disclosure",
            terms: ["uncertainty", "confidence", "transparent", "caveat"],
            guidance: "State that uncertainty needs to be visible before final claims are written into a report.",
          },
        ],
        "Explain that the workflow needs robustness and uncertainty evidence before publishing a final narrative.",
        2,
      ),
    ],
    hints: [
      "Think about what has to be cleaned and standardized before weights mean anything.",
      "A final report should summarize a tested result, not an unchecked one.",
    ],
    toolReferences: exerciseTools(
      "scenario_planning_decision_support",
      "scenario.composite_indices",
      "Workflows tab - Composite Indicator Builder",
      "indicator_composite",
    ),
  },
  {
    id: "facility_model_selection_for_coverage",
    category: "flow",
    title: "Choose the right facility-siting model",
    summary: "Match the location-allocation model to the planning objective instead of defaulting to a generic solver.",
    scenario:
      "A municipality can fund exactly three mobile clinics this year. The planning brief says: maximize the population covered within a 15-minute travel threshold. Which model should anchor the first run?",
    instructions: [
      "Select the most appropriate model for the stated objective.",
      "Explain what feature of the brief makes that model preferable to p-median or LSCP.",
    ],
    pathId: "accessibility_equity_analysis",
    moduleId: "accessibility.facility_siting",
    difficulty: "standard",
    estimatedMinutes: 10,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "model_choice",
        type: "single_select",
        label: "Model choice",
        required: true,
        options: [
          { id: "p_median", label: "P-median" },
          { id: "lscp", label: "LSCP" },
          { id: "mclp", label: "MCLP" },
          { id: "equity_only", label: "Equity audit only" },
        ],
      },
      {
        id: "model_reason",
        type: "textarea",
        label: "Why is that model the best first choice?",
        placeholder: "It fits the brief because...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "model_alignment",
        "Objective-model alignment",
        "Select the model that maximizes covered demand given a fixed facility count and threshold.",
        6,
        "model_choice",
        "mclp",
        "Use the exact planning objective in the brief to choose the model.",
        {
          p_median: "P-median minimizes aggregate travel burden, but the brief prioritizes threshold-based coverage with a fixed number of clinics.",
          lscp: "LSCP asks for full coverage with the minimum facilities, which is not the same as maximizing covered demand with exactly three clinics.",
          equity_only: "An equity audit helps interpret outcomes, but it is not the optimization model that solves the siting problem.",
        },
      ),
      keywordCriterion(
        "coverage_reasoning",
        "Reasoning about the brief",
        "Explain the link between fixed facility count, threshold-based service, and covered demand.",
        4,
        "model_reason",
        [
          {
            id: "fixed_sites",
            label: "fixed facility count",
            terms: ["three", "fixed", "limited", "budget", "facility"],
            guidance: "Mention that the brief fixes the number of clinics available this year.",
          },
          {
            id: "coverage",
            label: "coverage objective",
            terms: ["cover", "coverage", "threshold", "15-minute", "served"],
            guidance: "Explain that the objective is to maximize population covered within the travel-time threshold.",
          },
        ],
        "Tie the model choice to both the fixed budget and the threshold-based coverage objective.",
        2,
      ),
    ],
    hints: [
      "P-median and MCLP often look similar in teaching decks, but they optimize different objectives.",
      "Ask which model speaks directly to a fixed number of facilities plus a coverage threshold.",
    ],
    toolReferences: exerciseTools(
      "accessibility_equity_analysis",
      "accessibility.facility_siting",
      "Workflows tab - Facility Optimisation",
      "facility_optimisation",
    ),
  },
  {
    id: "morans_i_result_interpretation",
    category: "interpretation",
    title: "Interpret a Moran's I result without over-claiming",
    summary: "Read a global autocorrelation result correctly and keep causality separate from significance.",
    scenario:
      "A neighborhood deprivation analysis reports Moran's I = 0.41, expected I = -0.05, and pseudo-p = 0.01 from 999 permutations.",
    instructions: [
      "Choose the interpretation that best matches the result.",
      "State one thing the result does not prove on its own.",
    ],
    pathId: "spatial_statistics_planners",
    moduleId: "spatial_stats.autocorrelation",
    difficulty: "standard",
    estimatedMinutes: 9,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "interpretation_choice",
        type: "single_select",
        label: "Best interpretation",
        required: true,
        options: [
          {
            id: "correct",
            label: "The pattern is positively clustered and unlikely under spatial randomness; local diagnostics could show where clustering occurs.",
          },
          {
            id: "causal",
            label: "The statistic proves deprivation is caused by neighborhood spillovers.",
          },
          {
            id: "random",
            label: "The pattern is effectively random because expected I is negative.",
          },
          {
            id: "local_only",
            label: "The result identifies specific local hot spots without any further analysis.",
          },
        ],
      },
      {
        id: "caution_note",
        type: "textarea",
        label: "What does this result not prove?",
        placeholder: "It does not prove...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "global_interpretation",
        "Global interpretation",
        "Recognize that the result indicates significant positive clustering at the global level.",
        6,
        "interpretation_choice",
        "correct",
        "Stay with what a global autocorrelation test can support: clustered pattern versus spatial randomness.",
        {
          causal: "Moran's I can indicate patterned clustering, but it does not prove a causal mechanism.",
          random: "A negative expected value under the null does not make a clearly positive and significant observed statistic random.",
          local_only: "Global Moran's I does not, by itself, identify which neighborhoods form hot spots or outliers.",
        },
      ),
      keywordCriterion(
        "causal_caution",
        "Methodological caution",
        "State a limitation such as the absence of causal proof or the importance of neighborhood specification.",
        4,
        "caution_note",
        [
          {
            id: "not_causal",
            label: "not causal",
            terms: ["not causal", "does not prove cause", "not causation", "causal"],
            guidance: "Explicitly say the statistic does not prove causation.",
          },
          {
            id: "weights",
            label: "weights or neighborhood specification",
            terms: ["weights", "neighborhood", "spatial weights", "specification"],
            guidance: "Mention that interpretation depends on how the neighborhood structure or weights matrix was defined.",
          },
        ],
        "Separate significance from causal explanation and acknowledge the role of the weights specification.",
        1,
      ),
    ],
    hints: [
      "A positive observed value far above the expected null value points toward clustering.",
      "Ask yourself what a global statistic can say about pattern, and what requires a different model or design.",
    ],
    toolReferences: exerciseTools(
      "spatial_statistics_planners",
      "spatial_stats.autocorrelation",
      "Methods tab - Spatial statistics guide",
    ),
  },
  {
    id: "gi_star_hotspot_confidence_reading",
    category: "interpretation",
    title: "Read a Gi* hotspot result carefully",
    summary: "Translate z-scores and p-values into hotspot language without pretending the result explains itself.",
    scenario:
      "A district has Gi* z = 2.65 and p = 0.008 for pedestrian injury intensity. The city wants to know how strongly this supports a hotspot label.",
    instructions: [
      "Choose the confidence statement that matches the result.",
      "Write one follow-up check the analyst should still make before targeting funds.",
    ],
    pathId: "spatial_statistics_planners",
    moduleId: "spatial_stats.hotspot",
    difficulty: "standard",
    estimatedMinutes: 9,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "confidence_choice",
        type: "single_select",
        label: "Hotspot confidence class",
        required: true,
        options: [
          { id: "hot_90", label: "90% hotspot" },
          { id: "hot_95", label: "95% hotspot" },
          { id: "hot_99", label: "99% hotspot" },
          { id: "cold_95", label: "95% cold spot" },
        ],
      },
      {
        id: "follow_up_check",
        type: "textarea",
        label: "What should the analyst still verify?",
        placeholder: "Before targeting funds, the analyst should still...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "confidence_label",
        "Confidence classification",
        "Match the z-score and p-value to the correct hotspot confidence class.",
        6,
        "confidence_choice",
        "hot_99",
        "Use the p-value and sign of the z-score together when assigning the confidence label.",
        {
          hot_90: "The result is stronger than a 90% hotspot classification.",
          hot_95: "A 95% hotspot understates a result with p below 0.01.",
          cold_95: "The positive z-score indicates a hotspot, not a cold spot.",
        },
      ),
      keywordCriterion(
        "hotspot_caution",
        "Follow-up verification",
        "State that significance alone does not explain mechanism and that local context, data quality, or exposure should still be checked.",
        4,
        "follow_up_check",
        [
          {
            id: "context",
            label: "context or exposure",
            terms: ["context", "exposure", "street design", "data quality", "volume", "reporting bias"],
            guidance: "Mention that the analyst should still inspect context, exposure, or data quality before acting.",
          },
          {
            id: "not_mechanism",
            label: "not a mechanism",
            terms: ["not explain", "not prove", "mechanism", "cause", "causal"],
            guidance: "Say that hotspot significance does not by itself identify the mechanism behind the pattern.",
          },
        ],
        "Pair the confidence class with one grounded caution about context, exposure, or mechanism.",
        1,
      ),
    ],
    hints: [
      "Positive Gi* values indicate hotspots, negative values indicate cold spots.",
      "A statistically strong hotspot can still reflect exposure or reporting patterns that need interpretation.",
    ],
    toolReferences: exerciseTools(
      "spatial_statistics_planners",
      "spatial_stats.hotspot",
      "Workflows tab - Run Review",
      "review",
    ),
  },
  {
    id: "equity_audit_tradeoff_selection",
    category: "comparison",
    title: "Choose the defensible equity scenario",
    summary: "Balance disparity reduction against service burden constraints instead of chasing the most attractive single metric.",
    scenario:
      "The city compares options for bus-stop upgrades. Baseline: Gini 0.31, mean travel 22 min, coverage 64%. Scenario A: Gini 0.18, mean travel 19 min, coverage 78%. Scenario B: Gini 0.12, mean travel 27 min, coverage 81%. Scenario C: Gini 0.22, mean travel 18 min, coverage 70%. The brief is equity-first, but mean travel must stay at or below 25 minutes.",
    instructions: [
      "Choose the scenario that best fits the brief.",
      "Justify the choice using both the equity metric and the travel-time guardrail.",
    ],
    pathId: "scenario_planning_decision_support",
    moduleId: "scenario.equity_audit",
    difficulty: "standard",
    estimatedMinutes: 12,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "scenario_choice",
        type: "single_select",
        label: "Best-fit scenario",
        required: true,
        options: [
          { id: "scenario_a", label: "Scenario A" },
          { id: "scenario_b", label: "Scenario B" },
          { id: "scenario_c", label: "Scenario C" },
        ],
      },
      {
        id: "scenario_reason",
        type: "textarea",
        label: "Why does that scenario best match the brief?",
        placeholder: "It best matches the brief because...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "tradeoff_pick",
        "Trade-off selection",
        "Choose the option that improves equity strongly while respecting the travel-time constraint.",
        6,
        "scenario_choice",
        "scenario_a",
        "The best scenario must satisfy both the equity ambition and the explicit mean-travel guardrail.",
        {
          scenario_b: "Scenario B improves the Gini most, but it violates the <=25 minute travel requirement.",
          scenario_c: "Scenario C respects the travel threshold, but it delivers a weaker equity improvement than Scenario A.",
        },
      ),
      keywordCriterion(
        "tradeoff_reason",
        "Constraint-aware justification",
        "Reference both the Gini improvement and the 25-minute travel guardrail.",
        4,
        "scenario_reason",
        [
          {
            id: "equity_metric",
            label: "equity improvement",
            terms: ["gini", "equity", "disparity", "distribution"],
            guidance: "Name the disparity metric or equity improvement explicitly.",
          },
          {
            id: "travel_threshold",
            label: "travel guardrail",
            terms: ["25", "travel", "threshold", "guardrail", "constraint"],
            guidance: "Mention that the preferred option must remain at or below the travel-time threshold.",
          },
        ],
        "A comparison exercise is only complete once the reasoning references both benefits and constraints.",
        2,
      ),
    ],
    hints: [
      "The lowest Gini is not automatically the best answer if another policy guardrail is violated.",
      "Check the mean-travel requirement before rewarding the strongest equity gain.",
    ],
    toolReferences: exerciseTools(
      "scenario_planning_decision_support",
      "scenario.equity_audit",
      "Workflows tab - Equity Audit",
      "equity_audit",
    ),
  },
  {
    id: "scenario_feedback_tradeoff_reading",
    category: "comparison",
    title: "Compare scenarios with feedback effects in mind",
    summary: "Pick a scenario that balances short-run gains against rebound effects and long-run feedbacks.",
    scenario:
      "Three growth strategies are on the table. Scenario A (transit-oriented): housing +18%, emissions -12%, green space -4%, congestion stabilizes after year 4. Scenario B (road expansion): housing +9%, emissions +6%, green space +1%, congestion rebounds by year 6. Scenario C (park-led infill): housing +12%, emissions -7%, green space +8%, slower first 3 years but stable long-run performance. The brief asks for balanced growth that avoids rebound effects.",
    instructions: [
      "Choose the scenario that best fits the brief.",
      "Explain why feedback or rebound behavior matters to the decision.",
    ],
    pathId: "scenario_planning_decision_support",
    moduleId: "scenario.tradeoffs_feedback",
    difficulty: "stretch",
    estimatedMinutes: 13,
    masteryThreshold: 0.72,
    fields: [
      {
        id: "feedback_choice",
        type: "single_select",
        label: "Preferred scenario",
        required: true,
        options: [
          { id: "scenario_a", label: "Scenario A" },
          { id: "scenario_b", label: "Scenario B" },
          { id: "scenario_c", label: "Scenario C" },
        ],
      },
      {
        id: "feedback_reason",
        type: "textarea",
        label: "Why does feedback behavior matter here?",
        placeholder: "Feedback matters because...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "feedback_selection",
        "Scenario selection",
        "Choose the option that balances multiple goals while avoiding rebound behavior.",
        6,
        "feedback_choice",
        "scenario_c",
        "The brief asks for balance and for avoidance of rebound dynamics, not just one strong early metric.",
        {
          scenario_a: "Scenario A improves housing and emissions, but the green-space loss makes it less balanced than the brief requests.",
          scenario_b: "Scenario B explicitly triggers rebound congestion, which the brief says to avoid.",
        },
      ),
      keywordCriterion(
        "feedback_reasoning",
        "Feedback-aware justification",
        "Explain why rebound or long-run feedbacks change the interpretation of short-run gains.",
        4,
        "feedback_reason",
        [
          {
            id: "rebound",
            label: "rebound effect",
            terms: ["rebound", "feedback", "long-run", "trajectory", "stabil"],
            guidance: "Mention rebound effects or long-run trajectory, not only the immediate year-1 outcome.",
          },
          {
            id: "balance",
            label: "balanced trade-off",
            terms: ["balanced", "trade-off", "green space", "housing", "emissions"],
            guidance: "Explain how the chosen option balances multiple planning goals instead of maximizing just one.",
          },
        ],
        "A defensible answer should refer to both feedback behavior and balance across objectives.",
        2,
      ),
    ],
    hints: [
      "The brief explicitly says to avoid rebound effects, so an appealing short-run metric can still be disqualifying.",
      "Balanced growth usually requires looking across housing, emissions, and green space together.",
    ],
    toolReferences: exerciseTools(
      "scenario_planning_decision_support",
      "scenario.tradeoffs_feedback",
      "Workflows tab - Scenario Comparison",
      "scenario_comparison",
    ),
  },
  {
    id: "gwr_causality_and_stability_check",
    category: "critical_thinking",
    title: "Challenge an over-confident GWR claim",
    summary: "Spot methodological risks when a local coefficient map is used as if it were causal proof.",
    scenario:
      "A student fits GWR on only 24 tracts and claims that transit access causes rent increases because local coefficients are positive downtown.",
    instructions: [
      "Select the concerns you would raise before accepting the claim.",
      "Suggest one mitigation or next step.",
    ],
    pathId: "spatial_statistics_planners",
    moduleId: "spatial_stats.regression_diagnostics",
    difficulty: "stretch",
    estimatedMinutes: 12,
    masteryThreshold: 0.72,
    fields: [
      {
        id: "concerns",
        type: "multi_select",
        label: "Valid concerns",
        required: true,
        options: [
          { id: "sample", label: "A sample of 24 tracts may be too sparse for stable local coefficients." },
          { id: "bandwidth", label: "Bandwidth choice and residual diagnostics still need justification." },
          { id: "causality", label: "A local coefficient surface alone does not establish causation." },
          { id: "looks_good", label: "If the downtown map looks plausible, diagnostics are unnecessary." },
          { id: "no_multicollinearity", label: "Local coefficients remove the need to discuss multicollinearity." },
        ],
      },
      {
        id: "mitigation",
        type: "textarea",
        label: "One mitigation or next step",
        placeholder: "A better next step would be...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      multiSelectCriterion(
        "concern_selection",
        "Methodological concerns",
        "Select the concerns that address local coefficient stability, diagnostics, and causal over-claiming.",
        7,
        "concerns",
        ["sample", "bandwidth", "causality"],
        "Raise concerns about sparse local estimation, diagnostics, and causal language before accepting the claim.",
        ["looks_good", "no_multicollinearity"],
        {
          sample: "A sparse sample can make local estimates unstable.",
          bandwidth: "Local models still need bandwidth and residual diagnostics justification.",
          causality: "A coefficient surface does not automatically establish a causal mechanism.",
          looks_good: "Visual plausibility is not a substitute for diagnostics.",
          no_multicollinearity: "GWR does not make multicollinearity disappear; it can sometimes worsen local instability.",
        },
        2,
      ),
      keywordCriterion(
        "mitigation_step",
        "Constructive next step",
        "Offer a mitigation such as checking bandwidth diagnostics, comparing with OLS, or strengthening the design.",
        3,
        "mitigation",
        [
          {
            id: "diagnostics",
            label: "diagnostics or bandwidth",
            terms: ["diagnostic", "bandwidth", "residual", "cross-validation"],
            guidance: "Name a diagnostic or bandwidth check as part of the next step.",
          },
          {
            id: "baseline",
            label: "baseline or research design",
            terms: ["ols", "baseline", "compare", "design", "sample", "collect"],
            guidance: "Propose either a stronger baseline comparison or a more defensible research design / sample.",
          },
        ],
        "A strong answer proposes a concrete improvement rather than only criticizing the student.",
        1,
      ),
    ],
    hints: [
      "Local coefficients can look persuasive even when sample density is weak.",
      "Think about model diagnostics, sample adequacy, and what would be needed for causal language.",
    ],
    toolReferences: exerciseTools(
      "spatial_statistics_planners",
      "spatial_stats.regression_diagnostics",
      "Methods tab - Spatial statistics guide",
    ),
  },
  {
    id: "classification_scheme_argument",
    category: "critical_thinking",
    title: "Defend a classification scheme for grant triage",
    summary: "Choose a map classification that matches the communication goal and acknowledge what it can distort.",
    scenario:
      "You are preparing a map for neighborhood grant triage. The purpose is to rank neighborhoods relative to one another, not to claim that the data contain natural clusters or policy thresholds.",
    instructions: [
      "Pick the most defensible classification scheme for that communication goal.",
      "State one caution you would include in the legend note or report text.",
    ],
    pathId: "foundations_urban_analytics",
    moduleId: "foundations.classification_schemes",
    difficulty: "standard",
    estimatedMinutes: 8,
    masteryThreshold: 0.7,
    fields: [
      {
        id: "classification_choice",
        type: "single_select",
        label: "Best-fit classification",
        required: true,
        options: [
          { id: "quantiles", label: "Quantiles" },
          { id: "natural_breaks", label: "Natural breaks (Jenks)" },
          { id: "equal_interval", label: "Equal interval" },
          { id: "manual", label: "Manual classes based on intuition" },
        ],
      },
      {
        id: "classification_caution",
        type: "textarea",
        label: "One caution to disclose",
        placeholder: "A caution I would disclose is...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      singleSelectCriterion(
        "classification_alignment",
        "Classification-selection fit",
        "Choose the scheme that supports relative ranking when the goal is comparison rather than natural clustering.",
        6,
        "classification_choice",
        "quantiles",
        "Match the classification logic to the communication task: relative ranking across neighborhoods.",
        {
          natural_breaks: "Natural breaks suits inherent clustering better than explicit rank-based comparison.",
          equal_interval: "Equal interval can work for threshold communication, but it is not the strongest choice for relative ranking across many neighborhoods.",
          manual: "Manual classes need a defensible rule, not just intuition.",
        },
      ),
      keywordCriterion(
        "classification_caveat",
        "Caveat on interpretation",
        "Acknowledge that quantiles can exaggerate small differences or hide absolute thresholds.",
        4,
        "classification_caution",
        [
          {
            id: "relative_ranking",
            label: "relative ranking",
            terms: ["rank", "relative", "same number", "equal number", "comparison"],
            guidance: "State that quantiles are helpful because they support relative comparison across neighborhoods.",
          },
          {
            id: "distortion",
            label: "potential distortion",
            terms: ["small differences", "threshold", "distort", "hide", "absolute"],
            guidance: "Add a caution that quantiles may hide absolute thresholds or exaggerate small differences near class boundaries.",
          },
        ],
        "Good cartographic reasoning includes both the communication benefit and the distortion risk.",
        1,
      ),
    ],
    hints: [
      "Start from the communication task, not from whichever method looks most sophisticated.",
      "Ranking neighborhoods is different from demonstrating that the data contain natural clusters.",
    ],
    toolReferences: exerciseTools(
      "foundations_urban_analytics",
      "foundations.classification_schemes",
      "Methods tab - classification guide",
    ),
  },
  {
    id: "mobility_trace_governance_ethics",
    category: "data_ethics",
    title: "Govern mobility traces ethically",
    summary: "Choose a privacy- and bias-aware workflow for device-trace data before using it in accessibility or demand analysis.",
    scenario:
      "A vendor offers mobile-device traces collected at 15-minute intervals. Your team wants to use them to infer service demand for a neighborhood plan.",
    instructions: [
      "Choose the most defensible governance workflow.",
      "Select the safeguards that should remain in place before any public-facing output is released.",
    ],
    pathId: "foundations_urban_analytics",
    moduleId: "foundations.data_inventory_formats",
    difficulty: "standard",
    estimatedMinutes: 11,
    masteryThreshold: 0.72,
    fields: [
      {
        id: "governance_choice",
        type: "single_select",
        label: "Best governance workflow",
        required: true,
        options: [
          { id: "raw_block", label: "Publish block-level trace maps because the raw precision is analytically valuable." },
          {
            id: "aggregate_audit",
            label: "Aggregate to defensible units, audit sampling bias, document consent and provenance limits, and suppress small cells.",
          },
          { id: "nda_share", label: "Share raw device identifiers with partner agencies under NDA and rely on internal policy to control misuse." },
          { id: "clip_publish", label: "Clip the traces to the project boundary and publish origin-destination paths without extra suppression." },
        ],
      },
      {
        id: "safeguards",
        type: "multi_select",
        label: "Required safeguards",
        required: true,
        options: [
          { id: "audit_bias", label: "Audit who is under-represented in the sample and document likely bias." },
          { id: "suppress_small", label: "Suppress or aggregate very small cells before sharing outputs." },
          { id: "document_limits", label: "Document consent, provenance, and lawful-use limits in metadata and reports." },
          { id: "keep_ids", label: "Keep persistent device identifiers in the final public dataset for future validation." },
        ],
      },
    ],
    rubric: [
      singleSelectCriterion(
        "ethics_workflow",
        "Governance workflow",
        "Select the workflow that manages privacy, provenance, and representational bias together.",
        6,
        "governance_choice",
        "aggregate_audit",
        "A defensible answer has to address privacy, provenance, and representational bias at the same time.",
        {
          raw_block: "Raw spatial precision can increase re-identification risk and should not bypass governance controls.",
          nda_share: "A private NDA does not make raw device identifiers ethically or analytically safe to circulate.",
          clip_publish: "Clipping to the study area does not solve sampling bias or disclosure risk.",
        },
      ),
      multiSelectCriterion(
        "ethics_safeguards",
        "Required safeguards",
        "Keep privacy suppression, bias auditing, and metadata disclosure in place before any public-facing output.",
        4,
        "safeguards",
        ["audit_bias", "suppress_small", "document_limits"],
        "The safeguards should cover both representational bias and privacy / consent risk.",
        ["keep_ids"],
        {
          audit_bias: "Bias auditing is necessary because device-trace samples are rarely socially neutral.",
          suppress_small: "Small-cell suppression reduces disclosure and singling-out risk.",
          document_limits: "Metadata should explain lawful-use limits and provenance constraints.",
          keep_ids: "Persistent identifiers should not remain in a public-facing release.",
        },
        2,
      ),
    ],
    hints: [
      "Think beyond privacy alone: sample bias can also make the evidence misleading.",
      "A lawful or commercial license does not remove the need for suppression and transparent metadata.",
    ],
    toolReferences: exerciseTools(
      "foundations_urban_analytics",
      "foundations.data_inventory_formats",
      "Methods tab - Data Inventory guidance",
    ),
  },
  {
    id: "land_cover_training_bias_review",
    category: "data_ethics",
    title: "Review bias in a land-cover training set",
    summary: "Identify who or what becomes invisible when GeoAI labels come from only one kind of urban context.",
    scenario:
      "A browser-based land-cover model is trained only with labels from high-income districts that contain irrigated parks and formal street layouts. The team wants to deploy it city-wide, including informal settlements and drier peripheral districts.",
    instructions: [
      "Select the bias and validation concerns that deserve attention before deployment.",
      "Write one validation step that would reduce environmental-justice risk.",
    ],
    pathId: "environmental_resilience",
    moduleId: "environment.remote_sensing_indices",
    difficulty: "stretch",
    estimatedMinutes: 12,
    masteryThreshold: 0.72,
    fields: [
      {
        id: "bias_concerns",
        type: "multi_select",
        label: "Relevant concerns",
        required: true,
        options: [
          { id: "representation", label: "The training set may not represent drier districts or informal settlements." },
          { id: "performance_gap", label: "Accuracy may drop in neighborhoods whose surface conditions differ from the labeled districts." },
          { id: "validation_need", label: "The model should be validated across multiple urban contexts before city-wide use." },
          { id: "no_issue", label: "If overall accuracy looks high in the training districts, transferability is already proven." },
        ],
      },
      {
        id: "validation_plan",
        type: "textarea",
        label: "One validation step",
        placeholder: "Before deployment, I would...",
        required: true,
        rows: 3,
      },
    ],
    rubric: [
      multiSelectCriterion(
        "bias_selection",
        "Bias recognition",
        "Recognize representation bias, likely performance gaps, and the need for cross-context validation.",
        6,
        "bias_concerns",
        ["representation", "performance_gap", "validation_need"],
        "A fair deployment plan needs representation, performance, and validation concerns on the table.",
        ["no_issue"],
        {
          representation: "Representation bias matters because training districts may not reflect the full urban surface diversity.",
          performance_gap: "Differences in materials, vegetation, or settlement form can create real performance gaps.",
          validation_need: "Validation should span multiple neighborhoods before city-wide rollout.",
          no_issue: "High accuracy in one context does not prove the model transfers fairly to others.",
        },
        2,
      ),
      keywordCriterion(
        "validation_action",
        "Validation plan",
        "Propose a validation action that checks the model across contrasting neighborhoods or social contexts.",
        4,
        "validation_plan",
        [
          {
            id: "cross_context",
            label: "cross-context validation",
            terms: ["multiple neighborhoods", "across contexts", "different districts", "holdout", "validate"],
            guidance: "Specify validation across different neighborhood types rather than only re-testing the same districts.",
          },
          {
            id: "justice",
            label: "justice risk",
            terms: ["fair", "equity", "justice", "underserved", "bias"],
            guidance: "Link the validation step to fairness, equity, or bias reduction rather than only technical accuracy.",
          },
        ],
        "A robust answer validates across contexts and explains why that matters for justice or bias reduction.",
        1,
      ),
    ],
    hints: [
      "A model can be accurate where it was labeled and still underperform badly elsewhere.",
      "Think about who becomes misclassified when the labeled environments are socially narrow.",
    ],
    toolReferences: exerciseTools(
      "environmental_resilience",
      "environment.remote_sensing_indices",
      "Methods tab - Remote sensing guide",
    ),
  },
];