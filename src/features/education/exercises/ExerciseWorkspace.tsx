import React, { useEffect, useMemo, useState } from "react";
import flowStyles from "../../../centerpanel/styles/flows.module.css";
import { LEARNING_PATHS } from "../learningPaths";
import { updateLastSelections } from "../LearningPathEngine";
import { dispatchCenterPanelNavigation } from "../navigation";
import type {
  EducationProgressState,
  ExerciseCategory,
  ExerciseDefinition,
  ExerciseField,
  ExerciseResponseMap,
  ExerciseResponseValue,
  LearningModule,
  LearningPath,
  LearningPathId,
} from "../types";
import {
  assignExercise,
  buildExerciseDashboard,
  EXERCISE_CATEGORY_LABELS,
  EXERCISE_CATEGORY_ORDER,
  getExerciseAttempts,
  getExerciseProgress,
  gradeExercise,
  recordExerciseAttempt,
  revealNextExerciseHint,
  startExercise,
} from "./engine";
import { EXERCISE_CATALOG } from "./catalog";
import styles from "./exerciseWorkspace.module.css";

export interface ExerciseWorkspaceFocusRequest {
  requestedAt: number;
  exerciseId?: string;
  pathId?: LearningPathId;
  moduleId?: string;
  category?: ExerciseCategory | "all";
}

interface ExerciseWorkspaceProps {
  progressState: EducationProgressState;
  onProgressStateChange: React.Dispatch<React.SetStateAction<EducationProgressState>>;
  focusRequest?: ExerciseWorkspaceFocusRequest | null;
  onOpenPath: (pathId: LearningPathId) => void;
}

type CategoryFilter = ExerciseCategory | "all";
type PathFilter = LearningPathId | "all";
type ModuleFilter = string | "all";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function formatCategory(category: ExerciseCategory): string {
  return EXERCISE_CATEGORY_LABELS[category] ?? category;
}

function formatStatus(status: EducationProgressState["exerciseProgress"][string]["status"]): string {
  switch (status) {
    case "assigned":
      return "Assigned";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Available";
  }
}

function buildEmptyAnswers(exercise: ExerciseDefinition): ExerciseResponseMap {
  return Object.fromEntries(
    exercise.fields.map((field) => [field.id, field.type === "multi_select" ? [] : ""]),
  );
}

function isFieldFilled(field: ExerciseField, value: ExerciseResponseValue | undefined): boolean {
  if (!field.required) {
    return true;
  }

  if (field.type === "multi_select") {
    const list = Array.isArray(value) ? value : [];
    const minimumSelections = field.minSelections ?? 1;
    return list.length >= minimumSelections;
  }

  return typeof value === "string" && value.trim().length > 0;
}

function formatSubmittedAt(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString();
}

export function ExerciseWorkspace({
  progressState,
  onProgressStateChange,
  focusRequest,
  onOpenPath,
}: ExerciseWorkspaceProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [pathFilter, setPathFilter] = useState<PathFilter>("all");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    progressState.lastExerciseId ?? EXERCISE_CATALOG[0]?.id ?? "",
  );
  const [draftAnswers, setDraftAnswers] = useState<Record<string, ExerciseResponseMap>>({});

  const moduleLookup = useMemo(() => {
    const lookup = new Map<string, { path: LearningPath; module: LearningModule }>();
    for (const path of LEARNING_PATHS) {
      for (const module of path.modules) {
        lookup.set(module.id, { path, module });
      }
    }
    return lookup;
  }, []);

  const pathOptions = useMemo(() => {
    const pathIds = Array.from(new Set(EXERCISE_CATALOG.map((exercise) => exercise.pathId)));
    return pathIds
      .map((pathId) => LEARNING_PATHS.find((path) => path.id === pathId))
      .filter((path): path is LearningPath => Boolean(path));
  }, []);

  const moduleOptions = useMemo(() => {
    const relevantExercises = EXERCISE_CATALOG.filter((exercise) => pathFilter === "all" || exercise.pathId === pathFilter);
    const moduleIds = Array.from(new Set(relevantExercises.map((exercise) => exercise.moduleId)));
    return moduleIds
      .map((moduleId) => moduleLookup.get(moduleId))
      .filter((entry): entry is { path: LearningPath; module: LearningModule } => Boolean(entry));
  }, [moduleLookup, pathFilter]);

  useEffect(() => {
    if (!focusRequest?.requestedAt) {
      return;
    }

    setQuery("");
    setCategoryFilter(focusRequest.category ?? "all");
    setPathFilter(focusRequest.pathId ?? "all");
    setModuleFilter(focusRequest.moduleId ?? "all");
    if (focusRequest.exerciseId) {
      setSelectedExerciseId(focusRequest.exerciseId);
      onProgressStateChange((previous) => updateLastSelections(previous, { lastExerciseId: focusRequest.exerciseId }));
    }
  }, [focusRequest?.category, focusRequest?.exerciseId, focusRequest?.moduleId, focusRequest?.pathId, focusRequest?.requestedAt, onProgressStateChange]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return EXERCISE_CATALOG.filter((exercise) => {
      if (categoryFilter !== "all" && exercise.category !== categoryFilter) {
        return false;
      }
      if (pathFilter !== "all" && exercise.pathId !== pathFilter) {
        return false;
      }
      if (moduleFilter !== "all" && exercise.moduleId !== moduleFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return [exercise.title, exercise.summary, exercise.scenario, exercise.moduleId]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [categoryFilter, moduleFilter, pathFilter, query]);

  useEffect(() => {
    if (filteredExercises.length === 0) {
      return;
    }
    if (!filteredExercises.some((exercise) => exercise.id === selectedExerciseId)) {
      const nextExerciseId = filteredExercises[0]?.id;
      if (nextExerciseId) {
        setSelectedExerciseId(nextExerciseId);
        onProgressStateChange((previous) => updateLastSelections(previous, { lastExerciseId: nextExerciseId }));
      }
    }
  }, [filteredExercises, onProgressStateChange, selectedExerciseId]);

  const selectedExercise = useMemo(
    () => EXERCISE_CATALOG.find((exercise) => exercise.id === selectedExerciseId) ?? filteredExercises[0] ?? EXERCISE_CATALOG[0] ?? null,
    [filteredExercises, selectedExerciseId],
  );

  const selectedContext = selectedExercise ? moduleLookup.get(selectedExercise.moduleId) ?? null : null;
  const selectedProgress = selectedExercise ? getExerciseProgress(progressState, selectedExercise.id) : null;
  const selectedAttempts = selectedExercise ? getExerciseAttempts(progressState, selectedExercise.id) : [];
  const latestAttempt = selectedAttempts[selectedAttempts.length - 1] ?? null;
  const answers = selectedExercise
    ? draftAnswers[selectedExercise.id] ?? latestAttempt?.answers ?? buildEmptyAnswers(selectedExercise)
    : {};
  const requiredFieldsComplete = selectedExercise
    ? selectedExercise.fields.every((field) => isFieldFilled(field, answers[field.id]))
    : false;
  const dashboard = useMemo(() => buildExerciseDashboard(EXERCISE_CATALOG, progressState), [progressState]);

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        EXERCISE_CATEGORY_ORDER.map((category) => [
          category,
          EXERCISE_CATALOG.filter(
            (exercise) =>
              exercise.category === category && (pathFilter === "all" || exercise.pathId === pathFilter) && (moduleFilter === "all" || exercise.moduleId === moduleFilter),
          ).length,
        ]),
      ) as Record<ExerciseCategory, number>,
    [moduleFilter, pathFilter],
  );

  const selectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    onProgressStateChange((previous) => updateLastSelections(previous, { lastExerciseId: exerciseId }));
  };

  const updateAnswer = (field: ExerciseField, nextValue: ExerciseResponseValue) => {
    if (!selectedExercise) {
      return;
    }

    setDraftAnswers((previous) => ({
      ...previous,
      [selectedExercise.id]: {
        ...answers,
        [field.id]: nextValue,
      },
    }));
    onProgressStateChange((previous) => startExercise(previous, selectedExercise.id));
  };

  const submitExercise = () => {
    if (!selectedExercise || !requiredFieldsComplete) {
      return;
    }

    const evaluation = gradeExercise(selectedExercise, answers);
    onProgressStateChange((previous) => recordExerciseAttempt(previous, selectedExercise, answers, evaluation));
  };

  const revealHint = () => {
    if (!selectedExercise) {
      return;
    }
    onProgressStateChange((previous) => revealNextExerciseHint(previous, selectedExercise));
  };

  if (!selectedExercise) {
    return (
      <section className={styles.emptyState} data-testid="education-exercise-workspace">
        <div className={styles.emptyTitle}>No exercises match the current filters.</div>
        <div className={styles.emptyText}>Clear the active filters to restore the seeded practice studio.</div>
      </section>
    );
  }

  return (
    <section className={styles.root} data-testid="education-exercise-workspace">
      <div className={styles.banner}>
        <div>
          <div className={styles.eyebrow}>Prompt 31 - Interactive exercise studio</div>
          <h2 className={styles.title}>Rubric-based planning exercises with auto-grading, targeted hints, and persistent progress.</h2>
          <p className={styles.lead}>
            Browse realistic planning exercises by category, assign work to the current learner, inspect rubric logic before submission, and review detailed score breakdowns after each attempt.
          </p>
        </div>
        <div className={styles.bannerStats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Exercise catalog</div>
            <div className={styles.statValue}>{dashboard.totalExercises}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Assigned</div>
            <div className={styles.statValue}>{dashboard.assignedCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Mastered</div>
            <div className={styles.statValue}>{dashboard.masteredCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg. best score</div>
            <div className={styles.statValue}>{formatPercent(dashboard.averageBestScore)}</div>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <label className={flowStyles.formLabel}>
          Search exercises
          <input
            type="search"
            className={flowStyles.textInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, scenario, or module"
            style={{ marginTop: 6, minWidth: 240 }}
          />
        </label>

        <label className={flowStyles.formLabel}>
          Learning path
          <select
            className={flowStyles.textInput}
            value={pathFilter}
            onChange={(event) => {
              setPathFilter(event.target.value as PathFilter);
              setModuleFilter("all");
            }}
            style={{ marginTop: 6, minWidth: 240 }}
          >
            <option value="all">All linked learning paths</option>
            {pathOptions.map((path) => (
              <option key={path.id} value={path.id}>
                {path.title}
              </option>
            ))}
          </select>
        </label>

        <label className={flowStyles.formLabel}>
          Module focus
          <select
            className={flowStyles.textInput}
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value as ModuleFilter)}
            style={{ marginTop: 6, minWidth: 260 }}
          >
            <option value="all">All linked modules</option>
            {moduleOptions.map(({ module }) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.categoryRow}>
        <button
          type="button"
          className={`${styles.categoryChip} ${categoryFilter === "all" ? styles.categoryChipActive : ""}`}
          onClick={() => setCategoryFilter("all")}
          data-testid="education-exercise-category-all"
        >
          All Categories
          <span className={styles.categoryCount}>{filteredExercises.length}</span>
        </button>
        {EXERCISE_CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            type="button"
            className={`${styles.categoryChip} ${categoryFilter === category ? styles.categoryChipActive : ""}`}
            onClick={() => setCategoryFilter(category)}
            data-testid={`education-exercise-category-${category}`}
          >
            {formatCategory(category)}
            <span className={styles.categoryCount}>{categoryCounts[category]}</span>
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <aside className={styles.catalogPanel}>
          <div className={styles.panelHeaderRow}>
            <div>
              <div className={styles.panelTitle}>Exercise Catalog</div>
              <div className={styles.panelText}>At least ten seeded exercises are available here, grouped by pedagogy rather than generic quiz mechanics.</div>
            </div>
            <div className={styles.catalogCount}>{filteredExercises.length} visible</div>
          </div>
          <div className={styles.catalogList}>
            {filteredExercises.map((exercise) => {
              const progress = getExerciseProgress(progressState, exercise.id);
              const context = moduleLookup.get(exercise.moduleId);
              return (
                <article
                  key={exercise.id}
                  className={`${styles.catalogCard} ${exercise.id === selectedExercise.id ? styles.catalogCardActive : ""}`}
                  data-testid={`education-exercise-card-${exercise.id}`}
                >
                  <div className={styles.catalogCardTop}>
                    <div>
                      <div className={styles.catalogEyebrow}>{formatCategory(exercise.category)}</div>
                      <div className={styles.catalogTitle}>{exercise.title}</div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status${progress.status}`]}`}>{formatStatus(progress.status)}</span>
                  </div>
                  <div className={styles.catalogSummary}>{exercise.summary}</div>
                  <div className={styles.catalogMeta}>
                    <span>{exercise.estimatedMinutes} min</span>
                    <span>{context?.module.title ?? exercise.moduleId}</span>
                    <span>{progress.attemptCount} attempts</span>
                  </div>
                  <div className={styles.catalogMeta}>
                    <span>Best score {formatPercent(progress.bestPercentScore)}</span>
                    <span>Threshold {formatPercent(exercise.masteryThreshold)}</span>
                  </div>
                  <div className={styles.catalogActions}>
                    <button
                      type="button"
                      className={flowStyles.outlineBtn}
                      onClick={() => selectExercise(exercise.id)}
                      data-testid={`education-exercise-open-${exercise.id}`}
                    >
                      Open player
                    </button>
                    <button
                      type="button"
                      className={flowStyles.outlineBtn}
                      onClick={() => onProgressStateChange((previous) => assignExercise(previous, exercise.id))}
                      disabled={progress.status === "assigned" || progress.status === "completed"}
                      data-testid={`education-exercise-assign-${exercise.id}`}
                    >
                      {progress.status === "not_assigned" ? "Assign" : progress.status === "completed" ? "Assigned" : "Assigned"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>

        <div className={styles.mainColumn}>
          <section className={styles.playerPanel} data-testid={`education-exercise-player-${selectedExercise.id}`}>
            <div className={styles.panelHeaderRow}>
              <div>
                <div className={styles.playerEyebrow}>{formatCategory(selectedExercise.category)} exercise</div>
                <div className={styles.playerTitle}>{selectedExercise.title}</div>
              </div>
              <div className={styles.playerScoreCard}>
                <div className={styles.playerScoreLabel}>Latest score</div>
                <div className={styles.playerScoreValue}>{latestAttempt ? formatPercent(latestAttempt.percentScore) : "-"}</div>
              </div>
            </div>

            <div className={styles.pathContextRow}>
              <span className={styles.contextChip}>{selectedContext?.path.title ?? selectedExercise.pathId}</span>
              <span className={styles.contextChip}>{selectedContext?.module.title ?? selectedExercise.moduleId}</span>
              <span className={styles.contextChip}>{formatStatus(selectedProgress?.status ?? "not_assigned")}</span>
              {selectedProgress?.mastered ? <span className={styles.masteryChip}>Mastery reached</span> : null}
            </div>

            <div className={styles.playerActions}>
              <button type="button" className={flowStyles.outlineBtn} onClick={() => onOpenPath(selectedExercise.pathId)}>
                Open linked learning path
              </button>
              {selectedExercise.toolReferences.map((tool) => (
                <button key={tool.label} type="button" className={flowStyles.outlineBtn} onClick={() => dispatchCenterPanelNavigation(tool.target)}>
                  {tool.label}
                </button>
              ))}
            </div>

            <div className={styles.scenarioCard}>
              <div className={styles.scenarioTitle}>Studio scenario</div>
              <div className={styles.scenarioText}>{selectedExercise.scenario}</div>
            </div>

            <div className={styles.instructionsBlock}>
              <div className={styles.subTitle}>Instructions</div>
              <ol className={styles.instructionsList}>
                {selectedExercise.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            </div>

            <div className={styles.rubricPanel}>
              <div className={styles.panelHeaderRow}>
                <div>
                  <div className={styles.panelTitle}>Rubric Preview</div>
                  <div className={styles.panelText}>Scoring criteria are visible before submission and converted into a detailed breakdown afterwards.</div>
                </div>
                <div className={styles.catalogCount}>{formatScore(selectedExercise.rubric.reduce((sum, criterion) => sum + criterion.points, 0))} pts max</div>
              </div>
              <div className={styles.rubricGrid}>
                {selectedExercise.rubric.map((criterion) => {
                  const latestCriterion = latestAttempt?.criteria.find((entry) => entry.criterionId === criterion.id);
                  return (
                    <div key={criterion.id} className={`${styles.rubricCard} ${latestCriterion?.passed ? styles.rubricCardPassed : ""}`}>
                      <div className={styles.rubricHeader}>
                        <strong>{criterion.label}</strong>
                        <span className={styles.rubricPoints}>
                          {latestCriterion ? `${formatScore(latestCriterion.earnedPoints)} / ${formatScore(criterion.points)}` : `${formatScore(criterion.points)} pts`}
                        </span>
                      </div>
                      <div className={styles.rubricText}>{criterion.description}</div>
                      {latestCriterion ? <div className={styles.rubricFeedback}>{latestCriterion.feedback}</div> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.inputPanel}>
              <div className={styles.panelHeaderRow}>
                <div>
                  <div className={styles.panelTitle}>Exercise Player</div>
                  <div className={styles.panelText}>Complete the response fields below and submit when all required inputs are ready.</div>
                </div>
                <div className={styles.catalogCount}>{selectedExercise.estimatedMinutes} min exercise</div>
              </div>
              <div className={styles.inputGrid}>
                {selectedExercise.fields.map((field) => {
                  const fieldValue = answers[field.id];
                  return (
                    <label key={field.id} className={styles.fieldCard}>
                      <span className={styles.fieldLabel}>{field.label}</span>
                      {field.helperText ? <span className={styles.fieldHelper}>{field.helperText}</span> : null}
                      {field.type === "number" ? (
                        <input
                          type="number"
                          className={flowStyles.textInput}
                          value={typeof fieldValue === "string" ? fieldValue : ""}
                          placeholder={field.placeholder}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          onChange={(event) => updateAnswer(field, event.target.value)}
                        />
                      ) : field.type === "textarea" ? (
                        <textarea
                          className={`${flowStyles.textInput} ${styles.textArea}`}
                          value={typeof fieldValue === "string" ? fieldValue : ""}
                          placeholder={field.placeholder}
                          rows={field.rows ?? 4}
                          onChange={(event) => updateAnswer(field, event.target.value)}
                        />
                      ) : (
                        <div className={styles.optionList}>
                          {field.options.map((option) => {
                            const checked = field.type === "single_select"
                              ? fieldValue === option.id
                              : Array.isArray(fieldValue) && fieldValue.includes(option.id);
                            return (
                              <label key={option.id} className={`${styles.optionCard} ${checked ? styles.optionCardChecked : ""}`}>
                                <input
                                  type={field.type === "single_select" ? "radio" : "checkbox"}
                                  name={field.id}
                                  checked={checked}
                                  onChange={(event) => {
                                    if (field.type === "single_select") {
                                      updateAnswer(field, event.target.checked ? option.id : "");
                                      return;
                                    }

                                    const current = Array.isArray(fieldValue) ? fieldValue : [];
                                    const next = event.target.checked
                                      ? [...current, option.id]
                                      : current.filter((entry) => entry !== option.id);
                                    updateAnswer(field, next);
                                  }}
                                />
                                <span>
                                  <strong>{option.label}</strong>
                                  {option.description ? <span className={styles.optionDescription}>{option.description}</span> : null}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
              {!requiredFieldsComplete ? <div className={styles.validationText}>Complete all required fields before submitting.</div> : null}
              <div className={styles.playerActions}>
                <button type="button" className={flowStyles.outlineBtn} onClick={() => onProgressStateChange((previous) => assignExercise(previous, selectedExercise.id))}>
                  Assign to current learner
                </button>
                <button
                  type="button"
                  className={flowStyles.outlineBtn}
                  onClick={revealHint}
                  disabled={(selectedProgress?.revealedHintCount ?? 0) >= selectedExercise.hints.length}
                  data-testid="education-exercise-hint"
                >
                  {(selectedProgress?.revealedHintCount ?? 0) > 0 ? "Show another hint" : "Reveal hint"}
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={submitExercise}
                  disabled={!requiredFieldsComplete}
                  data-testid="education-exercise-submit"
                >
                  Submit for grading
                </button>
              </div>
            </div>

            <div className={styles.feedbackGrid}>
              <div className={styles.feedbackPanel}>
                <div className={styles.panelTitle}>Hints</div>
                <div className={styles.panelText}>Hints scaffold the method and decision logic without revealing the final answer.</div>
                {(selectedProgress?.revealedHintCount ?? 0) === 0 ? (
                  <div className={styles.hintPlaceholder}>No hints revealed yet. Use the hint button when you need a nudge.</div>
                ) : (
                  <ol className={styles.hintList}>
                    {selectedExercise.hints.slice(0, selectedProgress?.revealedHintCount ?? 0).map((hint) => (
                      <li key={hint} className={styles.hintItem}>
                        {hint}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className={styles.feedbackPanel}>
                <div className={styles.panelTitle}>Targeted Feedback</div>
                <div className={styles.panelText}>Detailed score output appears here after submission, with criterion-level guidance instead of answer leakage.</div>
                {latestAttempt ? (
                  <>
                    <div className={styles.latestScoreRow}>
                      <div>
                        <div className={styles.latestScoreLabel}>Last submission</div>
                        <div className={styles.latestScoreMeta}>{formatSubmittedAt(latestAttempt.submittedAt)}</div>
                      </div>
                      <div className={styles.latestScoreValue}>{formatScore(latestAttempt.scoreEarned)} / {formatScore(latestAttempt.maxScore)}</div>
                    </div>
                    <div className={styles.feedbackTags}>
                      <span className={styles.contextChip}>{formatPercent(latestAttempt.percentScore)}</span>
                      <span className={latestAttempt.passed ? styles.masteryChip : styles.reviewChip}>
                        {latestAttempt.passed ? "Mastery threshold met" : "Revision recommended"}
                      </span>
                    </div>
                    {latestAttempt.targetedFeedback.length === 0 ? (
                      <div className={styles.feedbackSuccess}>All rubric criteria were satisfied on the last submission.</div>
                    ) : (
                      <ul className={styles.feedbackList}>
                        {latestAttempt.targetedFeedback.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <div className={styles.hintPlaceholder}>Submit once to receive criterion-level feedback and a score breakdown.</div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.dashboardPanel}>
            <div className={styles.panelHeaderRow}>
              <div>
                <div className={styles.panelTitle}>Completion Dashboard</div>
                <div className={styles.panelText}>Inspect category coverage, recent attempts, and where the learner is already demonstrating mastery.</div>
              </div>
              <div className={styles.catalogCount}>{dashboard.recentAttempts.length} recent attempts</div>
            </div>

            <div className={styles.dashboardStats}>
              <div className={styles.dashboardCard}>
                <div className={styles.statLabel}>Completed</div>
                <div className={styles.dashboardValue}>{dashboard.completedCount}</div>
              </div>
              <div className={styles.dashboardCard}>
                <div className={styles.statLabel}>Mastered</div>
                <div className={styles.dashboardValue}>{dashboard.masteredCount}</div>
              </div>
              <div className={styles.dashboardCard}>
                <div className={styles.statLabel}>Assigned</div>
                <div className={styles.dashboardValue}>{dashboard.assignedCount}</div>
              </div>
            </div>

            <div className={styles.categorySummaryList}>
              {dashboard.categorySummaries.map((summary) => (
                <div key={summary.category} className={styles.categorySummaryCard}>
                  <div className={styles.categorySummaryHeader}>
                    <strong>{formatCategory(summary.category)}</strong>
                    <span>{summary.mastered}/{summary.total} mastered</span>
                  </div>
                  <div className={styles.progressRail}>
                    <div className={styles.progressFill} style={{ width: `${summary.total === 0 ? 0 : (summary.mastered / summary.total) * 100}%` }} />
                  </div>
                  <div className={styles.catalogMeta}>
                    <span>{summary.assigned} assigned</span>
                    <span>{summary.completed} completed</span>
                    <span>Avg. best {formatPercent(summary.averageBestScore)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.historyPanel}>
              <div className={styles.panelTitle}>Exercise History</div>
              {dashboard.recentAttempts.length === 0 ? (
                <div className={styles.hintPlaceholder}>No graded attempts yet. Submit an exercise to populate the review history.</div>
              ) : (
                <div className={styles.historyList}>
                  {dashboard.recentAttempts.map((attempt, index) => {
                    const exercise = EXERCISE_CATALOG.find((entry) => entry.id === attempt.exerciseId);
                    return (
                      <button
                        key={`${attempt.exerciseId}-${attempt.submittedAt}`}
                        type="button"
                        className={styles.historyItem}
                        onClick={() => selectExercise(attempt.exerciseId)}
                        data-testid={`education-exercise-history-${index}`}
                      >
                        <div>
                          <div className={styles.historyTitle}>{exercise?.title ?? attempt.exerciseId}</div>
                          <div className={styles.historyMeta}>{formatSubmittedAt(attempt.submittedAt)}</div>
                        </div>
                        <div className={styles.historyScore}>{formatPercent(attempt.percentScore)}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default ExerciseWorkspace;