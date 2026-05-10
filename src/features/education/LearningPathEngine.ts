import { LEARNING_PATHS } from "./learningPaths";
import { buildPersistedExerciseState, EXERCISE_CATALOG } from "./exercises";
import type {
  DifficultyRecommendation,
  DifficultyTier,
  EducationProgressState,
  InstructorDashboardSummary,
  InstructorStudentRecord,
  LearningModule,
  LearningPath,
  MethodologyExplainerId,
  ModuleProgress,
  PathProgressSummary,
  RecommendedModule,
} from "./types";

const ISO_NOW = () => new Date().toISOString();
const DEFAULT_PATH_ID = (LEARNING_PATHS[0]?.id ?? "foundations_urban_analytics") as LearningPath["id"];

export const DEFAULT_LEARNER_ID = "local-learner";

export const DEFAULT_EDUCATION_PROGRESS_STATE: EducationProgressState = {
  learnerId: DEFAULT_LEARNER_ID,
  learnerName: "Studio learner",
  pacePreference: "adaptive",
  moduleProgress: {},
  exerciseProgress: {},
  exerciseAttempts: {},
  lastPathId: DEFAULT_PATH_ID,
};

const DEFAULT_MODULE_PROGRESS: ModuleProgress = {
  status: "not_started",
  confidence: 3,
};

const SAMPLE_ROSTER: InstructorStudentRecord[] = [
  {
    id: "student-1",
    name: "Amina Rahman",
    cohort: "MUP Studio A",
    pathCompletion: {
      foundations_urban_analytics: 1,
      accessibility_equity_analysis: 0.8,
      environmental_resilience: 0.5,
      scenario_planning_decision_support: 0.35,
    },
    flaggedModuleIds: ["scenario.tradeoffs_feedback"],
  },
  {
    id: "student-2",
    name: "Lucas Meyer",
    cohort: "MUP Studio A",
    pathCompletion: {
      foundations_urban_analytics: 0.9,
      spatial_statistics_planners: 0.55,
      sdg11_monitoring_reporting: 0.65,
    },
    flaggedModuleIds: ["spatial_stats.regression_diagnostics"],
  },
  {
    id: "student-3",
    name: "Priya Narayanan",
    cohort: "MUP Studio B",
    pathCompletion: {
      foundations_urban_analytics: 1,
      urban_morphology_form: 0.75,
      urban_modelling_3d: 0.5,
    },
    flaggedModuleIds: ["urban3d.sunlight_analysis"],
  },
  {
    id: "student-4",
    name: "Mateo Silva",
    cohort: "MUP Studio B",
    pathCompletion: {
      foundations_urban_analytics: 0.7,
      accessibility_equity_analysis: 0.45,
      sdg11_monitoring_reporting: 0.25,
    },
    flaggedModuleIds: ["accessibility.facility_siting", "sdg11.vlr_reporting"],
  },
  {
    id: "student-5",
    name: "Elena Popescu",
    cohort: "Planning Analytics Lab",
    pathCompletion: {
      foundations_urban_analytics: 1,
      spatial_statistics_planners: 0.85,
      scenario_planning_decision_support: 0.6,
    },
    flaggedModuleIds: [],
  },
];

interface SelectionPatch {
  lastPathId?: LearningPath["id"] | undefined;
  lastExplainerId?: MethodologyExplainerId | undefined;
  lastExerciseId?: string | undefined;
}

function sanitizeModuleProgress(progress?: Partial<ModuleProgress> | null): ModuleProgress {
  const base: ModuleProgress = {
    status: progress?.status ?? DEFAULT_MODULE_PROGRESS.status,
    confidence: Math.max(1, Math.min(5, Math.round(progress?.confidence ?? DEFAULT_MODULE_PROGRESS.confidence))),
  };

  if (progress?.preferredDifficulty) {
    base.preferredDifficulty = progress.preferredDifficulty;
  }
  if (progress?.lastUpdatedAt) {
    base.lastUpdatedAt = progress.lastUpdatedAt;
  }
  if (progress?.completedAt) {
    base.completedAt = progress.completedAt;
  }

  return base;
}

function pathById(paths: LearningPath[], pathId: LearningPath["id"]): LearningPath | null {
  return paths.find((path) => path.id === pathId) ?? null;
}

function moduleById(paths: LearningPath[], moduleId: string): { path: LearningPath; module: LearningModule } | null {
  for (const path of paths) {
    const module = path.modules.find((entry) => entry.id === moduleId);
    if (module) {
      return { path, module };
    }
  }
  return null;
}

export function createModuleProgressMap(paths: LearningPath[]): Record<string, ModuleProgress> {
  return Object.fromEntries(paths.flatMap((path) => path.modules.map((module) => [module.id, sanitizeModuleProgress()])));
}

export function mergeEducationProgressState(
  paths: LearningPath[],
  candidate?: Partial<EducationProgressState> | null,
): EducationProgressState {
  const moduleProgress = createModuleProgressMap(paths);
  const persistedExerciseState = buildPersistedExerciseState(EXERCISE_CATALOG, candidate);

  for (const [moduleId, progress] of Object.entries(candidate?.moduleProgress ?? {})) {
    if (moduleProgress[moduleId]) {
      moduleProgress[moduleId] = sanitizeModuleProgress(progress);
    }
  }

  const resolvedPathId = candidate?.lastPathId && pathById(paths, candidate.lastPathId)
    ? candidate.lastPathId
    : paths[0]?.id;

  return {
    learnerId: candidate?.learnerId ?? DEFAULT_EDUCATION_PROGRESS_STATE.learnerId,
    learnerName: candidate?.learnerName ?? DEFAULT_EDUCATION_PROGRESS_STATE.learnerName,
    pacePreference: candidate?.pacePreference ?? DEFAULT_EDUCATION_PROGRESS_STATE.pacePreference,
    moduleProgress,
    exerciseProgress: persistedExerciseState.exerciseProgress,
    exerciseAttempts: persistedExerciseState.exerciseAttempts,
    ...(resolvedPathId ? { lastPathId: resolvedPathId } : {}),
    ...(candidate?.lastExplainerId ? { lastExplainerId: candidate.lastExplainerId } : {}),
    ...(persistedExerciseState.lastExerciseId ? { lastExerciseId: persistedExerciseState.lastExerciseId } : {}),
  };
}

export function getModuleProgress(progressState: EducationProgressState, moduleId: string): ModuleProgress {
  return progressState.moduleProgress[moduleId] ?? DEFAULT_MODULE_PROGRESS;
}

export function getPathProgress(path: LearningPath, progressState: EducationProgressState): PathProgressSummary {
  const completedCount = path.modules.filter((module) => getModuleProgress(progressState, module.id).status === "completed").length;
  const inProgressCount = path.modules.filter((module) => getModuleProgress(progressState, module.id).status === "in_progress").length;
  const totalModules = path.modules.length;

  return {
    completionRatio: totalModules === 0 ? 0 : completedCount / totalModules,
    completedCount,
    totalModules,
    inProgressCount,
  };
}

export function isPathUnlocked(
  path: LearningPath,
  progressState: EducationProgressState,
  paths: LearningPath[] = LEARNING_PATHS,
): boolean {
  return path.prerequisitePathIds.every((pathId) => {
    const prerequisitePath = pathById(paths, pathId);
    if (!prerequisitePath) {
      return true;
    }
    return getPathProgress(prerequisitePath, progressState).completionRatio >= 1;
  });
}

export function isModuleUnlocked(
  path: LearningPath,
  module: LearningModule,
  progressState: EducationProgressState,
  paths: LearningPath[] = LEARNING_PATHS,
): boolean {
  if (!isPathUnlocked(path, progressState, paths)) {
    return false;
  }

  return module.prerequisiteModuleIds.every((prerequisiteId) => getModuleProgress(progressState, prerequisiteId).status === "completed");
}

function averagePrerequisiteConfidence(module: LearningModule, progressState: EducationProgressState): number {
  if (module.prerequisiteModuleIds.length === 0) {
    return 3;
  }

  const values = module.prerequisiteModuleIds.map((prerequisiteId) => getModuleProgress(progressState, prerequisiteId).confidence);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getDifficultyRecommendation(
  path: LearningPath,
  module: LearningModule,
  progressState: EducationProgressState,
  paths: LearningPath[] = LEARNING_PATHS,
): DifficultyRecommendation {
  const storedPreference = getModuleProgress(progressState, module.id).preferredDifficulty;
  if (storedPreference) {
    return {
      tier: storedPreference,
      rationale: "Pinned manually for this module.",
    };
  }

  if (progressState.pacePreference === "steady") {
    return { tier: "standard", rationale: "Steady pacing is active for the current learner profile." };
  }

  if (progressState.pacePreference === "stretch") {
    return { tier: "stretch", rationale: "Stretch pacing is active to favor comparative and synthesis tasks." };
  }

  const unlocked = isModuleUnlocked(path, module, progressState, paths);
  const prerequisiteConfidence = averagePrerequisiteConfidence(module, progressState);
  const pathProgress = getPathProgress(path, progressState);
  const moduleProgress = getModuleProgress(progressState, module.id);

  if (!unlocked) {
    return {
      tier: "support",
      rationale: "Prerequisites are incomplete, so this module should open with guided support.",
    };
  }

  if (moduleProgress.status === "completed" && moduleProgress.confidence >= 4) {
    return {
      tier: "stretch",
      rationale: "High confidence on completion suggests the learner is ready for extension tasks.",
    };
  }

  if (prerequisiteConfidence < 3 || pathProgress.inProgressCount > 2) {
    return {
      tier: "support",
      rationale: "Confidence in prerequisite material is still developing; use worked examples first.",
    };
  }

  if (prerequisiteConfidence >= 4 && pathProgress.completionRatio >= 0.5) {
    return {
      tier: "stretch",
      rationale: "The learner is progressing confidently and can handle comparative or open-ended tasks.",
    };
  }

  return {
    tier: "standard",
    rationale: "Prerequisites are complete and the learner is ready for the base analytical version of the module.",
  };
}

export function updateModuleStatus(
  progressState: EducationProgressState,
  moduleId: string,
  status: ModuleProgress["status"],
): EducationProgressState {
  const previous = getModuleProgress(progressState, moduleId);
  const { completedAt: _completedAt, ...rest } = previous;
  const now = ISO_NOW();

  return {
    ...progressState,
    moduleProgress: {
      ...progressState.moduleProgress,
      [moduleId]: sanitizeModuleProgress({
        ...rest,
        status,
        lastUpdatedAt: now,
        ...(status === "completed" ? { completedAt: now } : {}),
      }),
    },
  };
}

export function updateModuleConfidence(
  progressState: EducationProgressState,
  moduleId: string,
  confidence: number,
): EducationProgressState {
  const previous = getModuleProgress(progressState, moduleId);

  return {
    ...progressState,
    moduleProgress: {
      ...progressState.moduleProgress,
      [moduleId]: sanitizeModuleProgress({
        ...previous,
        confidence,
        lastUpdatedAt: ISO_NOW(),
      }),
    },
  };
}

export function updateModuleDifficultyPreference(
  progressState: EducationProgressState,
  moduleId: string,
  preferredDifficulty?: DifficultyTier,
): EducationProgressState {
  const previous = getModuleProgress(progressState, moduleId);
  const { preferredDifficulty: _previousDifficulty, ...rest } = previous;

  return {
    ...progressState,
    moduleProgress: {
      ...progressState.moduleProgress,
      [moduleId]: sanitizeModuleProgress({
        ...rest,
        lastUpdatedAt: ISO_NOW(),
        ...(preferredDifficulty ? { preferredDifficulty } : {}),
      }),
    },
  };
}

export function updateLearnerName(progressState: EducationProgressState, learnerName: string): EducationProgressState {
  return { ...progressState, learnerName };
}

export function updatePacePreference(
  progressState: EducationProgressState,
  pacePreference: EducationProgressState["pacePreference"],
): EducationProgressState {
  return { ...progressState, pacePreference };
}

export function updateLastSelections(
  progressState: EducationProgressState,
  patch: SelectionPatch,
): EducationProgressState {
  const next: EducationProgressState = { ...progressState };

  if ("lastPathId" in patch) {
    if (patch.lastPathId) {
      next.lastPathId = patch.lastPathId;
    } else {
      delete next.lastPathId;
    }
  }

  if ("lastExplainerId" in patch) {
    if (patch.lastExplainerId) {
      next.lastExplainerId = patch.lastExplainerId;
    } else {
      delete next.lastExplainerId;
    }
  }

  if ("lastExerciseId" in patch) {
    if (patch.lastExerciseId) {
      next.lastExerciseId = patch.lastExerciseId;
    } else {
      delete next.lastExerciseId;
    }
  }

  return next;
}

export function getRecommendedModules(
  paths: LearningPath[],
  progressState: EducationProgressState,
): RecommendedModule[] {
  const recommendations: RecommendedModule[] = [];

  for (const path of paths) {
    if (!isPathUnlocked(path, progressState, paths)) {
      continue;
    }

    for (const module of path.modules) {
      if (!isModuleUnlocked(path, module, progressState, paths)) {
        continue;
      }

      const moduleProgress = getModuleProgress(progressState, module.id);
      if (moduleProgress.status === "completed") {
        continue;
      }

      recommendations.push({
        path,
        module,
        recommendation: getDifficultyRecommendation(path, module, progressState, paths),
      });
      break;
    }
  }

  return recommendations;
}

export function buildInstructorDashboard(
  paths: LearningPath[],
  progressState: EducationProgressState,
): InstructorDashboardSummary {
  const currentLearner: InstructorStudentRecord = {
    id: progressState.learnerId,
    name: progressState.learnerName,
    cohort: "Current workspace",
    pathCompletion: Object.fromEntries(paths.map((path) => [path.id, getPathProgress(path, progressState).completionRatio])),
    flaggedModuleIds: paths.flatMap((path) =>
      path.modules
        .filter((module) => {
          const progress = getModuleProgress(progressState, module.id);
          return progress.status === "in_progress" && progress.confidence <= 2;
        })
        .map((module) => module.id),
    ),
  };

  const roster = [...SAMPLE_ROSTER, currentLearner];
  const averageCompletion = roster.reduce((sum, student) => {
    const values = Object.values(student.pathCompletion);
    if (values.length === 0) {
      return sum;
    }
    return sum + values.reduce((inner, value) => inner + value, 0) / values.length;
  }, 0) / roster.length;

  const pathAverages = paths.map((path) => ({
    pathId: path.id,
    title: path.title,
    averageCompletion: roster.reduce((sum, student) => sum + (student.pathCompletion[path.id] ?? 0), 0) / roster.length,
  }));

  const moduleCounts = new Map<string, number>();
  for (const student of roster) {
    for (const moduleId of student.flaggedModuleIds) {
      moduleCounts.set(moduleId, (moduleCounts.get(moduleId) ?? 0) + 1);
    }
  }

  const moduleBottlenecks = [...moduleCounts.entries()]
    .map(([moduleId, count]) => ({
      moduleId,
      title: moduleById(paths, moduleId)?.module.title ?? moduleId,
      count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  return {
    roster,
    averageCompletion,
    atRiskStudentCount: roster.filter((student) => {
      const values = Object.values(student.pathCompletion);
      const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
      return average < 0.4 || student.flaggedModuleIds.length >= 2;
    }).length,
    pathAverages,
    moduleBottlenecks,
  };
}
