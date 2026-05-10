export type CenterPanelTab =
  | "Projects"
  | "New Project"
  | "Methods"
  | "Education"
  | "Report"
  | "Workflows"
  | "Dashboard"
  | "Toolbox";

export type EducationPanelView = "paths" | "datasets" | "exercises" | "instructor";

export type LearningPathId =
  | "foundations_urban_analytics"
  | "spatial_statistics_planners"
  | "accessibility_equity_analysis"
  | "environmental_resilience"
  | "urban_morphology_form"
  | "sdg11_monitoring_reporting"
  | "urban_modelling_3d"
  | "scenario_planning_decision_support";

export type MethodologyExplainerId =
  | "morans_i"
  | "getis_ord_gi"
  | "ols_gwr"
  | "hansen_accessibility"
  | "gini_coefficient"
  | "ndvi"
  | "vulnerability_ipcc"
  | "spacematrix_density"
  | "sdg_monitoring"
  | "building_extrusion"
  | "sunlight_exposure"
  | "composite_index"
  | "cellular_automata"
  | "facility_location_allocation"
  | "system_dynamics"
  | "scenario_tradeoffs";

export type DifficultyTier = "support" | "standard" | "stretch";

export type ModuleStatus = "not_started" | "in_progress" | "completed";

export interface EducationNavigationTarget {
  tab: CenterPanelTab;
  flowId?: string;
  workflowView?: "navigator" | "active" | "dashboard";
}

export interface ToolReference {
  label: string;
  summary: string;
  target: EducationNavigationTarget;
}

export interface LearningModule {
  id: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  exerciseCount: number;
  prerequisiteModuleIds: string[];
  toolReferences: ToolReference[];
  methodologyIds: MethodologyExplainerId[];
  indicatorContexts?: string[];
}

export interface LearningPath {
  id: LearningPathId;
  title: string;
  description: string;
  audience: string;
  axisLabel: string;
  totalExercises: number;
  prerequisitePathIds: LearningPathId[];
  modules: LearningModule[];
}

export interface MethodFormula {
  label: string;
  latex: string;
}

export interface MethodologyExplainer {
  id: MethodologyExplainerId;
  title: string;
  shortDefinition: string;
  formulas: MethodFormula[];
  assumptions: string[];
  limitations: string[];
  misuseWarnings: string[];
  useCases: string[];
  linkedTools: ToolReference[];
  relatedPathIds: LearningPathId[];
  relatedExplainerIds?: MethodologyExplainerId[];
}

export interface ModuleProgress {
  status: ModuleStatus;
  confidence: number;
  preferredDifficulty?: DifficultyTier;
  lastUpdatedAt?: string;
  completedAt?: string;
}

export type ExerciseCategory =
  | "calculator"
  | "flow"
  | "interpretation"
  | "comparison"
  | "critical_thinking"
  | "data_ethics";

export type ExerciseStatus = "not_assigned" | "assigned" | "in_progress" | "completed";

export type ExerciseFieldType = "number" | "textarea" | "single_select" | "multi_select";

export interface ExerciseFieldOption {
  id: string;
  label: string;
  description?: string;
}

interface ExerciseFieldBase {
  id: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
}

export type ExerciseField =
  | (ExerciseFieldBase & {
      type: "number";
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
    })
  | (ExerciseFieldBase & {
      type: "textarea";
      rows?: number;
    })
  | (ExerciseFieldBase & {
      type: "single_select";
      options: ExerciseFieldOption[];
    })
  | (ExerciseFieldBase & {
      type: "multi_select";
      options: ExerciseFieldOption[];
      minSelections?: number;
      maxSelections?: number;
    });

export type ExerciseResponseValue = string | string[];

export type ExerciseResponseMap = Record<string, ExerciseResponseValue>;

export interface ExerciseKeywordConcept {
  id: string;
  label: string;
  terms: string[];
  guidance?: string;
}

export type ExerciseCriterionRule =
  | {
      type: "numeric";
      fieldId: string;
      expectedValue: number;
      tolerance: number;
      partialTolerance?: number;
      guidance: string;
    }
  | {
      type: "single_select";
      fieldId: string;
      correctOptionId: string;
      guidance: string;
      targetedFeedbackByOption?: Record<string, string>;
    }
  | {
      type: "multi_select";
      fieldId: string;
      requiredOptionIds: string[];
      forbiddenOptionIds?: string[];
      minimumMatches?: number;
      guidance: string;
      targetedFeedbackByOption?: Record<string, string>;
    }
  | {
      type: "keyword";
      fieldId: string;
      concepts: ExerciseKeywordConcept[];
      minimumMatches?: number;
      guidance: string;
    };

export interface ExerciseRubricCriterion {
  id: string;
  label: string;
  description: string;
  points: number;
  rule: ExerciseCriterionRule;
}

export interface ExerciseDefinition {
  id: string;
  category: ExerciseCategory;
  title: string;
  summary: string;
  scenario: string;
  instructions: string[];
  pathId: LearningPathId;
  moduleId: string;
  difficulty: DifficultyTier;
  estimatedMinutes: number;
  masteryThreshold: number;
  fields: ExerciseField[];
  rubric: ExerciseRubricCriterion[];
  hints: string[];
  toolReferences: ToolReference[];
}

export interface ExerciseCriterionResult {
  criterionId: string;
  label: string;
  earnedPoints: number;
  maxPoints: number;
  passed: boolean;
  feedback: string;
}

export interface ExerciseEvaluation {
  exerciseId: string;
  submittedAt: string;
  scoreEarned: number;
  maxScore: number;
  percentScore: number;
  passed: boolean;
  criteria: ExerciseCriterionResult[];
  targetedFeedback: string[];
}

export interface ExerciseAttemptRecord extends ExerciseEvaluation {
  answers: ExerciseResponseMap;
}

export interface ExerciseProgressRecord {
  status: ExerciseStatus;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  revealedHintCount: number;
  attemptCount: number;
  bestPercentScore: number;
  latestPercentScore: number;
  mastered: boolean;
}

export interface ExerciseCategorySummary {
  category: ExerciseCategory;
  total: number;
  assigned: number;
  completed: number;
  mastered: number;
  averageBestScore: number;
}

export interface ExerciseDashboardSummary {
  totalExercises: number;
  assignedCount: number;
  completedCount: number;
  masteredCount: number;
  averageBestScore: number;
  categorySummaries: ExerciseCategorySummary[];
  recentAttempts: ExerciseAttemptRecord[];
}

export interface EducationProgressState {
  learnerId: string;
  learnerName: string;
  pacePreference: "adaptive" | "steady" | "stretch";
  moduleProgress: Record<string, ModuleProgress>;
  exerciseProgress: Record<string, ExerciseProgressRecord>;
  exerciseAttempts: Record<string, ExerciseAttemptRecord[]>;
  lastPathId?: LearningPathId;
  lastExplainerId?: MethodologyExplainerId;
  lastExerciseId?: string;
}

export interface EducationFocusRequest {
  pathId?: LearningPathId;
  explainerId?: MethodologyExplainerId;
  view?: EducationPanelView;
  requestedAt: number;
}

export interface PathProgressSummary {
  completionRatio: number;
  completedCount: number;
  totalModules: number;
  inProgressCount: number;
}

export interface DifficultyRecommendation {
  tier: DifficultyTier;
  rationale: string;
}

export interface RecommendedModule {
  path: LearningPath;
  module: LearningModule;
  recommendation: DifficultyRecommendation;
}

export interface InstructorStudentRecord {
  id: string;
  name: string;
  cohort: string;
  pathCompletion: Partial<Record<LearningPathId, number>>;
  flaggedModuleIds: string[];
}

export interface InstructorDashboardSummary {
  roster: InstructorStudentRecord[];
  averageCompletion: number;
  atRiskStudentCount: number;
  pathAverages: Array<{ pathId: LearningPathId; title: string; averageCompletion: number }>;
  moduleBottlenecks: Array<{ moduleId: string; title: string; count: number }>;
}