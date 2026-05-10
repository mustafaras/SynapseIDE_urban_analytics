import type {
  EducationProgressState,
  ExerciseAttemptRecord,
  ExerciseCategory,
  ExerciseDashboardSummary,
  ExerciseDefinition,
  ExerciseEvaluation,
  ExerciseProgressRecord,
  ExerciseResponseMap,
  ExerciseResponseValue,
  ExerciseRubricCriterion,
} from "../types";

const ISO_NOW = () => new Date().toISOString();

const DEFAULT_EXERCISE_PROGRESS: ExerciseProgressRecord = {
  status: "not_assigned",
  revealedHintCount: 0,
  attemptCount: 0,
  bestPercentScore: 0,
  latestPercentScore: 0,
  mastered: false,
};

export const EXERCISE_CATEGORY_ORDER: ExerciseCategory[] = [
  "calculator",
  "flow",
  "interpretation",
  "comparison",
  "critical_thinking",
  "data_ethics",
];

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  calculator: "Calculator",
  flow: "Flow",
  interpretation: "Interpretation",
  comparison: "Comparison",
  critical_thinking: "Critical Thinking",
  data_ethics: "Data Ethics",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asText(value: ExerciseResponseValue | undefined): string {
  if (Array.isArray(value)) {
    return value.join(" ");
  }
  return typeof value === "string" ? value : "";
}

function asList(value: ExerciseResponseValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

function asNumber(value: ExerciseResponseValue | undefined): number | null {
  const parsed = Number.parseFloat(asText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeExerciseProgress(progress?: Partial<ExerciseProgressRecord> | null): ExerciseProgressRecord {
  return {
    status: progress?.status ?? DEFAULT_EXERCISE_PROGRESS.status,
    revealedHintCount: Math.max(0, Math.round(progress?.revealedHintCount ?? DEFAULT_EXERCISE_PROGRESS.revealedHintCount)),
    attemptCount: Math.max(0, Math.round(progress?.attemptCount ?? DEFAULT_EXERCISE_PROGRESS.attemptCount)),
    bestPercentScore: clamp(progress?.bestPercentScore ?? DEFAULT_EXERCISE_PROGRESS.bestPercentScore, 0, 1),
    latestPercentScore: clamp(progress?.latestPercentScore ?? DEFAULT_EXERCISE_PROGRESS.latestPercentScore, 0, 1),
    mastered: Boolean(progress?.mastered),
    ...(progress?.assignedAt ? { assignedAt: progress.assignedAt } : {}),
    ...(progress?.startedAt ? { startedAt: progress.startedAt } : {}),
    ...(progress?.completedAt ? { completedAt: progress.completedAt } : {}),
  };
}

function sanitizeAttemptRecord(candidate: ExerciseAttemptRecord | null | undefined): ExerciseAttemptRecord | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  return {
    exerciseId: candidate.exerciseId,
    submittedAt: candidate.submittedAt,
    scoreEarned: round(candidate.scoreEarned),
    maxScore: round(candidate.maxScore),
    percentScore: clamp(candidate.percentScore, 0, 1),
    passed: Boolean(candidate.passed),
    criteria: Array.isArray(candidate.criteria)
      ? candidate.criteria.map((criterion) => ({
          criterionId: criterion.criterionId,
          label: criterion.label,
          earnedPoints: round(criterion.earnedPoints),
          maxPoints: round(criterion.maxPoints),
          passed: Boolean(criterion.passed),
          feedback: criterion.feedback,
        }))
      : [],
    targetedFeedback: Array.isArray(candidate.targetedFeedback) ? candidate.targetedFeedback.filter(Boolean) : [],
    answers: typeof candidate.answers === "object" && candidate.answers !== null ? candidate.answers : {},
  };
}

export function createExerciseProgressMap(exercises: ExerciseDefinition[]): Record<string, ExerciseProgressRecord> {
  return Object.fromEntries(exercises.map((exercise) => [exercise.id, sanitizeExerciseProgress()]));
}

export function createExerciseAttemptMap(exercises: ExerciseDefinition[]): Record<string, ExerciseAttemptRecord[]> {
  return Object.fromEntries(exercises.map((exercise) => [exercise.id, []]));
}

export function buildPersistedExerciseState(
  exercises: ExerciseDefinition[],
  candidate?: Partial<EducationProgressState> | null,
): Pick<EducationProgressState, "exerciseProgress" | "exerciseAttempts" | "lastExerciseId"> {
  const exerciseProgress = createExerciseProgressMap(exercises);
  const exerciseAttempts = createExerciseAttemptMap(exercises);
  const exerciseIds = new Set(exercises.map((exercise) => exercise.id));

  for (const [exerciseId, progress] of Object.entries(candidate?.exerciseProgress ?? {})) {
    if (exerciseIds.has(exerciseId)) {
      exerciseProgress[exerciseId] = sanitizeExerciseProgress(progress);
    }
  }

  for (const [exerciseId, attempts] of Object.entries(candidate?.exerciseAttempts ?? {})) {
    if (!exerciseIds.has(exerciseId) || !Array.isArray(attempts)) {
      continue;
    }
    exerciseAttempts[exerciseId] = attempts
      .map((attempt) => sanitizeAttemptRecord(attempt))
      .filter((attempt): attempt is ExerciseAttemptRecord => attempt !== null);
  }

  return {
    exerciseProgress,
    exerciseAttempts,
    ...(candidate?.lastExerciseId && exerciseIds.has(candidate.lastExerciseId) ? { lastExerciseId: candidate.lastExerciseId } : {}),
  };
}

export function getExerciseProgress(progressState: EducationProgressState, exerciseId: string): ExerciseProgressRecord {
  return progressState.exerciseProgress[exerciseId] ?? DEFAULT_EXERCISE_PROGRESS;
}

export function getExerciseAttempts(progressState: EducationProgressState, exerciseId: string): ExerciseAttemptRecord[] {
  return progressState.exerciseAttempts[exerciseId] ?? [];
}

export function assignExercise(progressState: EducationProgressState, exerciseId: string): EducationProgressState {
  const previous = getExerciseProgress(progressState, exerciseId);
  const now = ISO_NOW();

  return {
    ...progressState,
    exerciseProgress: {
      ...progressState.exerciseProgress,
      [exerciseId]: sanitizeExerciseProgress({
        ...previous,
        status: previous.status === "completed" ? "completed" : "assigned",
        assignedAt: previous.assignedAt ?? now,
      }),
    },
  };
}

export function startExercise(progressState: EducationProgressState, exerciseId: string): EducationProgressState {
  const previous = getExerciseProgress(progressState, exerciseId);
  if (previous.status === "completed") {
    return progressState;
  }

  const now = ISO_NOW();
  return {
    ...progressState,
    exerciseProgress: {
      ...progressState.exerciseProgress,
      [exerciseId]: sanitizeExerciseProgress({
        ...previous,
        status: "in_progress",
        assignedAt: previous.assignedAt ?? now,
        startedAt: previous.startedAt ?? now,
      }),
    },
  };
}

export function revealNextExerciseHint(
  progressState: EducationProgressState,
  exercise: ExerciseDefinition,
): EducationProgressState {
  const previous = getExerciseProgress(progressState, exercise.id);
  return {
    ...progressState,
    exerciseProgress: {
      ...progressState.exerciseProgress,
      [exercise.id]: sanitizeExerciseProgress({
        ...previous,
        revealedHintCount: Math.min(previous.revealedHintCount + 1, exercise.hints.length),
        assignedAt: previous.assignedAt ?? ISO_NOW(),
        ...(previous.status === "not_assigned" ? { status: "assigned" as const } : {}),
      }),
    },
  };
}

function evaluateCriterion(
  criterion: ExerciseRubricCriterion,
  answers: ExerciseResponseMap,
): { earnedPoints: number; passed: boolean; feedback: string } {
  switch (criterion.rule.type) {
    case "numeric": {
      const value = asNumber(answers[criterion.rule.fieldId]);
      if (value === null) {
        return { earnedPoints: 0, passed: false, feedback: criterion.rule.guidance };
      }
      const delta = Math.abs(value - criterion.rule.expectedValue);
      if (delta <= criterion.rule.tolerance) {
        return { earnedPoints: criterion.points, passed: true, feedback: "Numeric computation is within the expected tolerance." };
      }
      if (criterion.rule.partialTolerance && delta <= criterion.rule.partialTolerance) {
        return {
          earnedPoints: round(criterion.points * 0.5),
          passed: false,
          feedback: criterion.rule.guidance,
        };
      }
      return { earnedPoints: 0, passed: false, feedback: criterion.rule.guidance };
    }
    case "single_select": {
      const selected = asText(answers[criterion.rule.fieldId]);
      if (selected === criterion.rule.correctOptionId) {
        return { earnedPoints: criterion.points, passed: true, feedback: "Selection aligns with the scenario brief." };
      }
      return {
        earnedPoints: 0,
        passed: false,
        feedback: criterion.rule.targetedFeedbackByOption?.[selected] ?? criterion.rule.guidance,
      };
    }
    case "multi_select": {
      const rule = criterion.rule;
      const selected = new Set(asList(answers[rule.fieldId]));
      const requiredMatches = rule.requiredOptionIds.filter((optionId) => selected.has(optionId));
      const forbiddenMatches = (rule.forbiddenOptionIds ?? []).filter((optionId) => selected.has(optionId));
      const minimumMatches = rule.minimumMatches ?? rule.requiredOptionIds.length;
      const coverageRatio = rule.requiredOptionIds.length === 0 ? 1 : requiredMatches.length / rule.requiredOptionIds.length;
      const penaltyPerForbidden = criterion.points / Math.max(rule.requiredOptionIds.length + (rule.forbiddenOptionIds?.length ?? 0), 1);
      const earnedPoints = round(clamp(criterion.points * coverageRatio - forbiddenMatches.length * penaltyPerForbidden, 0, criterion.points));
      const passed = requiredMatches.length >= minimumMatches && forbiddenMatches.length === 0;
      const feedbacks = [
        ...rule.requiredOptionIds
          .filter((optionId) => !selected.has(optionId))
          .map((optionId) => rule.targetedFeedbackByOption?.[optionId] ?? rule.guidance),
        ...forbiddenMatches.map((optionId) => rule.targetedFeedbackByOption?.[optionId] ?? rule.guidance),
      ].filter(Boolean);

      return {
        earnedPoints,
        passed,
        feedback: feedbacks.length > 0 ? Array.from(new Set(feedbacks)).join(" ") : passed ? "Selected safeguards match the rubric." : rule.guidance,
      };
    }
    case "keyword": {
      const normalized = normalizeText(asText(answers[criterion.rule.fieldId]));
      const minimumMatches = criterion.rule.minimumMatches ?? criterion.rule.concepts.length;
      const matchedConcepts = criterion.rule.concepts.filter((concept) =>
        concept.terms.some((term) => normalized.includes(normalizeText(term))),
      );
      const missingConcepts = criterion.rule.concepts.filter((concept) => !matchedConcepts.includes(concept));
      const earnedPoints = round(
        criterion.rule.concepts.length === 0 ? criterion.points : criterion.points * (matchedConcepts.length / criterion.rule.concepts.length),
      );
      const passed = matchedConcepts.length >= minimumMatches;
      return {
        earnedPoints,
        passed,
        feedback: missingConcepts[0]?.guidance ?? (passed ? "Response covers the key planning concepts." : criterion.rule.guidance),
      };
    }
    default:
      return { earnedPoints: 0, passed: false, feedback: "Unsupported exercise criterion." };
  }
}

export function gradeExercise(exercise: ExerciseDefinition, answers: ExerciseResponseMap): ExerciseEvaluation {
  const criteria = exercise.rubric.map((criterion) => {
    const result = evaluateCriterion(criterion, answers);
    return {
      criterionId: criterion.id,
      label: criterion.label,
      earnedPoints: result.earnedPoints,
      maxPoints: criterion.points,
      passed: result.passed,
      feedback: result.feedback,
    };
  });

  const scoreEarned = round(criteria.reduce((sum, criterion) => sum + criterion.earnedPoints, 0));
  const maxScore = round(exercise.rubric.reduce((sum, criterion) => sum + criterion.points, 0));
  const percentScore = maxScore === 0 ? 0 : clamp(scoreEarned / maxScore, 0, 1);
  const targetedFeedback = Array.from(new Set(criteria.filter((criterion) => !criterion.passed).map((criterion) => criterion.feedback)));

  return {
    exerciseId: exercise.id,
    submittedAt: ISO_NOW(),
    scoreEarned,
    maxScore,
    percentScore,
    passed: percentScore >= exercise.masteryThreshold,
    criteria,
    targetedFeedback,
  };
}

export function recordExerciseAttempt(
  progressState: EducationProgressState,
  exercise: ExerciseDefinition,
  answers: ExerciseResponseMap,
  evaluation: ExerciseEvaluation,
): EducationProgressState {
  const previous = getExerciseProgress(progressState, exercise.id);
  const attempts = getExerciseAttempts(progressState, exercise.id);
  const record: ExerciseAttemptRecord = {
    ...evaluation,
    answers,
  };

  return {
    ...progressState,
    exerciseProgress: {
      ...progressState.exerciseProgress,
      [exercise.id]: sanitizeExerciseProgress({
        ...previous,
        status: "completed",
        assignedAt: previous.assignedAt ?? evaluation.submittedAt,
        startedAt: previous.startedAt ?? evaluation.submittedAt,
        completedAt: evaluation.submittedAt,
        attemptCount: previous.attemptCount + 1,
        bestPercentScore: Math.max(previous.bestPercentScore, evaluation.percentScore),
        latestPercentScore: evaluation.percentScore,
        mastered: previous.mastered || evaluation.passed,
      }),
    },
    exerciseAttempts: {
      ...progressState.exerciseAttempts,
      [exercise.id]: [...attempts, record],
    },
    lastExerciseId: exercise.id,
  };
}

export function getExercisesForPath(exercises: ExerciseDefinition[], pathId: string): ExerciseDefinition[] {
  return exercises.filter((exercise) => exercise.pathId === pathId);
}

export function getExercisesForModule(exercises: ExerciseDefinition[], moduleId: string): ExerciseDefinition[] {
  return exercises.filter((exercise) => exercise.moduleId === moduleId);
}

export function buildExerciseDashboard(
  exercises: ExerciseDefinition[],
  progressState: EducationProgressState,
): ExerciseDashboardSummary {
  const categorySummaries = EXERCISE_CATEGORY_ORDER.map((category) => {
    const categoryExercises = exercises.filter((exercise) => exercise.category === category);
    const progressItems = categoryExercises.map((exercise) => getExerciseProgress(progressState, exercise.id));
    const attemptedItems = progressItems.filter((item) => item.attemptCount > 0);
    const averageBestScore = attemptedItems.length
      ? attemptedItems.reduce((sum, item) => sum + item.bestPercentScore, 0) / attemptedItems.length
      : 0;

    return {
      category,
      total: categoryExercises.length,
      assigned: progressItems.filter((item) => item.status !== "not_assigned").length,
      completed: progressItems.filter((item) => item.status === "completed").length,
      mastered: progressItems.filter((item) => item.mastered).length,
      averageBestScore,
    };
  });

  const recentAttempts = Object.values(progressState.exerciseAttempts)
    .flat()
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt))
    .slice(0, 8);

  const progressItems = exercises.map((exercise) => getExerciseProgress(progressState, exercise.id));
  const attemptedItems = progressItems.filter((item) => item.attemptCount > 0);

  return {
    totalExercises: exercises.length,
    assignedCount: progressItems.filter((item) => item.status !== "not_assigned").length,
    completedCount: progressItems.filter((item) => item.status === "completed").length,
    masteredCount: progressItems.filter((item) => item.mastered).length,
    averageBestScore: attemptedItems.length
      ? attemptedItems.reduce((sum, item) => sum + item.bestPercentScore, 0) / attemptedItems.length
      : 0,
    categorySummaries,
    recentAttempts,
  };
}