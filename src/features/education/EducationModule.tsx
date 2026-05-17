import React, { Suspense, useEffect, useMemo, useState } from "react";
import flowStyles from "../../centerpanel/styles/flows.module.css";
import styles from "./education.module.css";
import { EXERCISE_CATALOG, ExerciseWorkspace, getExercisesForModule } from "./exercises";
import type { ExerciseWorkspaceFocusRequest } from "./exercises/ExerciseWorkspace";
import { LEARNING_PATHS } from "./learningPaths";
import {
  buildInstructorDashboard,
  getDifficultyRecommendation,
  getPathProgress,
  getRecommendedModules,
  isModuleUnlocked,
  isPathUnlocked,
  updateLastSelections,
  updateLearnerName,
  updateModuleConfidence,
  updateModuleDifficultyPreference,
  updateModuleStatus,
  updatePacePreference,
} from "./LearningPathEngine";
import { METHODOLOGY_EXPLAINERS } from "./methodologyData";
import { MethodologyExplainerCard, MethodologyInfoButton } from "./MethodologyExplainer";
import { dispatchCenterPanelNavigation } from "./navigation";
import { loadEducationProgressState, persistEducationProgressState } from "./storage";
import { useEducationUIStore } from "./uiStore";
import { getTeachingDatasetLibrary, loadTeachingDatasetIntoMapWorkspace, type TeachingDatasetId } from "../../services/data/datasetLibrary";
import { toastError, toastSuccess } from "../../ui/toast/api";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";
import type {
  DifficultyTier,
  EducationFocusRequest,
  EducationPanelView,
  EducationProgressState,
  LearningModule,
  LearningPath,
  LearningPathId,
  MethodologyExplainerId,
} from "./types";

export interface EducationModuleProps {
  focusRequest?: EducationFocusRequest | null;
}

const DatasetLibraryBrowser = lazyWithRetry(async () => {
  const module = await import("./DatasetLibraryBrowser");
  return { default: module.DatasetLibraryBrowser };
});

function EducationSectionFallback({ label, testId }: { label: string; testId: string }): React.ReactElement {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      className={styles.loadingFallback}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="color-mix(in srgb, var(--syn-text-secondary) 25%, transparent)" strokeWidth="2.5" />
        <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="var(--syn-interaction-active)" strokeLinecap="round" strokeWidth="2.5">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="0.85s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      <span>{label}</span>
    </div>
  );
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function difficultyClassName(tier: DifficultyTier): string {
  switch (tier) {
    case "support":
      return styles.difficultySupport;
    case "stretch":
      return styles.difficultyStretch;
    default:
      return styles.difficultyStandard;
  }
}

function statusClassName(status: "not_started" | "in_progress" | "completed"): string {
  switch (status) {
    case "completed":
      return styles.statusCompleted;
    case "in_progress":
      return styles.statusInProgress;
    default:
      return styles.statusNotStarted;
  }
}

function humanize(text: string): string {
  return text.replace(/_/g, " ");
}

function pathExplainers(path: LearningPath): MethodologyExplainerId[] {
  return Array.from(new Set(path.modules.flatMap((module) => module.methodologyIds)));
}

function findPathForExplainer(explainerId: MethodologyExplainerId): LearningPath | null {
  return LEARNING_PATHS.find((path) => path.modules.some((module) => module.methodologyIds.includes(explainerId))) ?? null;
}

function PathDependencyMap({
  path,
  progressState,
}: {
  path: LearningPath;
  progressState: EducationProgressState;
}): React.ReactElement {
  // Compute longest-path depth for each module → assigns horizontal column.
  const moduleById = new Map(path.modules.map((m) => [m.id, m]));
  const depthCache = new Map<string, number>();
  const computeDepth = (id: string, visited = new Set<string>()): number => {
    if (depthCache.has(id)) return depthCache.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    const mod = moduleById.get(id);
    if (!mod || mod.prerequisiteModuleIds.length === 0) {
      depthCache.set(id, 0);
      return 0;
    }
    const max = Math.max(
      ...mod.prerequisiteModuleIds.map((pid) => computeDepth(pid, visited) + 1),
    );
    depthCache.set(id, max);
    return max;
  };

  const enriched = path.modules.map((module, index) => ({
    module,
    index,
    depth: computeDepth(module.id),
  }));

  // Group by depth column.
  const columns = new Map<number, typeof enriched>();
  for (const entry of enriched) {
    const list = columns.get(entry.depth) ?? [];
    list.push(entry);
    columns.set(entry.depth, list);
  }
  const sortedCols = Array.from(columns.entries()).sort(([a], [b]) => a - b);

  const colW = 200;
  const rowH = 56;
  const padX = 24;
  const padY = 24;
  const nodeW = 168;
  const nodeH = 38;

  const positions = new Map<string, { x: number; y: number; col: number; row: number }>();
  sortedCols.forEach(([col, entries]) => {
    entries.forEach((entry, row) => {
      positions.set(entry.module.id, {
        x: padX + col * colW,
        y: padY + row * rowH,
        col,
        row,
      });
    });
  });

  const maxCol = sortedCols.length > 0 ? sortedCols[sortedCols.length - 1]![0] : 0;
  const maxRow = Math.max(...sortedCols.map(([, entries]) => entries.length));
  const width = padX * 2 + (maxCol + 1) * colW + nodeW;
  const height = padY * 2 + maxRow * rowH;

  return (
    <div className={styles.dependencyWrap}>
      <div className={styles.dependencyHeader}>
        <span className={styles.subSectionTitle}>Prerequisite dependency map</span>
        <span className={styles.dependencyHint}>Horizontal flow · left-to-right prerequisite chain</span>
      </div>
      <div className={styles.dependencyScroll}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className={styles.dependencySvg}
          role="img"
          aria-label={`${path.title} dependency map`}
        >
          <defs>
            <marker
              id={`dep-arrow-${path.id}`}
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M0,1 L6,4 L0,7 Z"
                fill="color-mix(in srgb, var(--syn-interaction-active) 65%, transparent)"
              />
            </marker>
          </defs>

          {/* edges */}
          {enriched.flatMap((entry) =>
            entry.module.prerequisiteModuleIds.map((prerequisiteId, edgeIdx) => {
              const from = positions.get(prerequisiteId);
              const to = positions.get(entry.module.id);
              if (!from || !to) return null;
              const x1 = from.x + nodeW;
              const y1 = from.y + nodeH / 2;
              const x2 = to.x;
              const y2 = to.y + nodeH / 2;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={`edge-${prerequisiteId}-${entry.module.id}-${edgeIdx}`}
                  className={styles.depEdge}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="color-mix(in srgb, var(--syn-interaction-active) 38%, transparent)"
                  strokeWidth={1.2}
                  markerEnd={`url(#dep-arrow-${path.id})`}
                />
              );
            }),
          )}

          {/* nodes */}
          {enriched.map((entry) => {
            const pos = positions.get(entry.module.id)!;
            const progress = progressState.moduleProgress[entry.module.id];
            const status = progress?.status ?? "not_started";
            const dotFill =
              status === "completed"
                ? "var(--syn-status-valid, #22c55e)"
                : status === "in_progress"
                  ? "var(--syn-interaction-active, #3794ff)"
                  : "color-mix(in srgb, var(--syn-text-secondary) 35%, transparent)";
            const truncated =
              entry.module.title.length > 22
                ? `${entry.module.title.slice(0, 21)}…`
                : entry.module.title;
            return (
              <g key={entry.module.id} className={styles.depNode}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={nodeW}
                  height={nodeH}
                  rx={3}
                  fill="var(--syn-bg-root, #0d1117)"
                  stroke="var(--syn-border-subtle)"
                  strokeWidth={1}
                  className={styles.depNodeRect}
                />
                <circle cx={pos.x + 14} cy={pos.y + nodeH / 2} r={4} fill={dotFill} />
                <text
                  x={pos.x + 26}
                  y={pos.y + nodeH / 2 - 4}
                  fill="var(--syn-text-secondary)"
                  fontSize={8.5}
                  fontFamily="ui-monospace, monospace"
                  letterSpacing="0.1em"
                >
                  {`M${String(entry.index + 1).padStart(2, "0")}`}
                </text>
                <text
                  x={pos.x + 26}
                  y={pos.y + nodeH / 2 + 9}
                  fill="var(--syn-text-primary)"
                  fontSize={11}
                  fontWeight={500}
                >
                  {truncated}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function InstructorDashboard({ summary }: { summary: ReturnType<typeof buildInstructorDashboard> }): React.ReactElement {
  return (
    <section className={styles.instructorPanel}>
      <div className={styles.sectionTitle}>Instructor Dashboard</div>
      <div className={styles.muted}>
        Aggregate course progress, identify bottleneck modules, and review where students are likely to need guided intervention.
      </div>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Average completion</div>
          <div className={styles.kpiValue}>{formatPercent(summary.averageCompletion)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Active learners</div>
          <div className={styles.kpiValue}>{summary.roster.length}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>At-risk students</div>
          <div className={styles.kpiValue}>{summary.atRiskStudentCount}</div>
        </div>
      </div>

      <div className={styles.instructorGrid}>
        <div className={styles.detailPanel}>
          <div className={styles.subSectionTitle}>Average completion by path</div>
          <div className={styles.bars}>
            {summary.pathAverages.map((entry) => (
              <div key={entry.pathId} className={styles.barRow}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{entry.title}</span>
                  <span className={styles.muted}>{formatPercent(entry.averageCompletion)}</span>
                </div>
                <div className={styles.barRail}>
                  <div className={styles.barFill} style={{ width: `${entry.averageCompletion * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.subSectionTitle}>Bottleneck modules</div>
          <div className={styles.studentList}>
            {summary.moduleBottlenecks.length === 0 ? (
              <div className={styles.muted}>No recurring bottlenecks detected from the current roster snapshot.</div>
            ) : (
              summary.moduleBottlenecks.map((entry) => (
                <div key={entry.moduleId} className={styles.studentCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong>{entry.title}</strong>
                    <span className={styles.chip}>{entry.count} learners flagged</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.detailPanel}>
          <div className={styles.subSectionTitle}>Student roster snapshot</div>
          <div className={styles.studentList}>
            {summary.roster.map((student) => {
              const values = Object.values(student.pathCompletion);
              const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
              return (
                <div key={student.id} className={styles.studentCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <strong>{student.name}</strong>
                    <span className={styles.chip}>{student.cohort}</span>
                  </div>
                  <div className={styles.barRail}>
                    <div className={styles.barFill} style={{ width: `${average * 100}%` }} />
                  </div>
                  <div className={styles.muted}>Average completion {formatPercent(average)}</div>
                  {student.flaggedModuleIds.length > 0 ? (
                    <div className={styles.chipRow}>
                      {student.flaggedModuleIds.map((moduleId) => (
                        <span key={moduleId} className={styles.chip}>
                          {humanize(moduleId.split(".").pop() ?? moduleId)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.muted}>No flagged modules.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export const EducationModule: React.FC<EducationModuleProps> = ({ focusRequest }) => {
  const [progressState, setProgressState] = useState<EducationProgressState>(() => loadEducationProgressState());
  const [view, setView] = useState<EducationPanelView>(focusRequest?.view ?? "paths");
  const [selectedPathId, setSelectedPathId] = useState<LearningPathId>(
    progressState.lastPathId ?? LEARNING_PATHS[0]!.id,
  );
  const [selectedExplainerId, setSelectedExplainerId] = useState<MethodologyExplainerId>(
    progressState.lastExplainerId ?? METHODOLOGY_EXPLAINERS[0]!.id,
  );
  const [exerciseFocusRequest, setExerciseFocusRequest] = useState<ExerciseWorkspaceFocusRequest | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [loadingDatasetId, setLoadingDatasetId] = useState<TeachingDatasetId | null>(null);

  useEffect(() => {
    persistEducationProgressState(progressState);
  }, [progressState]);

  useEffect(() => {
    const store = useEducationUIStore.getState();
    store.setView(view);
    store.setSelectedPathId(selectedPathId);
    store.setSelectedExplainerId(selectedExplainerId);
  }, [view, selectedPathId, selectedExplainerId]);

  useEffect(() => {
    if (!focusRequest?.requestedAt) {
      return;
    }

    if (focusRequest.view) {
      setView(focusRequest.view);
    }

    if (focusRequest.pathId) {
      setSelectedPathId(focusRequest.pathId);
      setProgressState((previous) => updateLastSelections(previous, { lastPathId: focusRequest.pathId }));
    }

    if (focusRequest.explainerId) {
      setSelectedExplainerId(focusRequest.explainerId);
      setProgressState((previous) => updateLastSelections(previous, { lastExplainerId: focusRequest.explainerId }));
      const relatedPath = findPathForExplainer(focusRequest.explainerId);
      if (relatedPath) {
        setSelectedPathId(relatedPath.id);
        setProgressState((previous) => updateLastSelections(previous, { lastPathId: relatedPath.id }));
      }
    }
  }, [focusRequest?.explainerId, focusRequest?.pathId, focusRequest?.requestedAt, focusRequest?.view]);

  const selectedPath = useMemo(
    () => LEARNING_PATHS.find((path) => path.id === selectedPathId) ?? LEARNING_PATHS[0]!,
    [selectedPathId],
  );

  const selectedPathProgress = useMemo(() => getPathProgress(selectedPath, progressState), [progressState, selectedPath]);
  const recommendedModules = useMemo(() => getRecommendedModules(LEARNING_PATHS, progressState), [progressState]);
  const instructorSummary = useMemo(() => buildInstructorDashboard(LEARNING_PATHS, progressState), [progressState]);
  const pathMethodIds = useMemo(() => pathExplainers(selectedPath), [selectedPath]);
  const visibleExplainers = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    return METHODOLOGY_EXPLAINERS.filter((explainer) => {
      if (pathMethodIds.length > 0 && !pathMethodIds.includes(explainer.id) && query.length === 0) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [explainer.title, explainer.shortDefinition, ...explainer.useCases]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [libraryQuery, pathMethodIds]);

  const totalModules = LEARNING_PATHS.reduce((sum, path) => sum + path.modules.length, 0);
  const totalCompletedModules = LEARNING_PATHS.reduce((sum, path) => sum + getPathProgress(path, progressState).completedCount, 0);
  const unlockedPaths = LEARNING_PATHS.filter((path) => isPathUnlocked(path, progressState, LEARNING_PATHS)).length;
  const teachingDatasets = useMemo(() => getTeachingDatasetLibrary(), []);
  const assignedExercises = EXERCISE_CATALOG.filter((exercise) => progressState.exerciseProgress[exercise.id]?.status !== "not_assigned").length;
  const masteredExercises = EXERCISE_CATALOG.filter((exercise) => progressState.exerciseProgress[exercise.id]?.mastered).length;
  const selectedPathExercises = EXERCISE_CATALOG.filter((exercise) => exercise.pathId === selectedPath.id).length;

  const handleTeachingDatasetLoad = async (datasetId: TeachingDatasetId) => {
    setLoadingDatasetId(datasetId);
    try {
      const result = loadTeachingDatasetIntoMapWorkspace(datasetId);
      toastSuccess(`Loaded ${result.dataset.city} teaching dataset with ${result.layers.length} map layers.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Teaching dataset load failed.";
      toastError(message);
    } finally {
      setLoadingDatasetId(null);
    }
  };

  const selectPath = (pathId: LearningPathId) => {
    const path = LEARNING_PATHS.find((entry) => entry.id === pathId) ?? LEARNING_PATHS[0]!;
    const nextExplainerId = pathExplainers(path)[0] ?? selectedExplainerId;
    setSelectedPathId(path.id);
    setSelectedExplainerId(nextExplainerId);
    setProgressState((previous) =>
      updateLastSelections(previous, {
        lastPathId: path.id,
        lastExplainerId: nextExplainerId,
      }),
    );
  };

  const selectExplainer = (explainerId: MethodologyExplainerId) => {
    setSelectedExplainerId(explainerId);
    const relatedPath = findPathForExplainer(explainerId);
    if (relatedPath) {
      setSelectedPathId(relatedPath.id);
    }
    setProgressState((previous) => updateLastSelections(previous, { lastExplainerId: explainerId }));
  };

  const openExerciseStudio = (focus?: Omit<ExerciseWorkspaceFocusRequest, "requestedAt">) => {
    setView("exercises");
    setExerciseFocusRequest({ requestedAt: Date.now(), ...(focus ?? {}) });

    if (focus?.pathId) {
      setSelectedPathId(focus.pathId);
    }

    setProgressState((previous) =>
      updateLastSelections(previous, {
        ...(focus?.pathId ? { lastPathId: focus.pathId } : {}),
        ...(focus?.exerciseId ? { lastExerciseId: focus.exerciseId } : {}),
      }),
    );
  };

  const updateStatus = (path: LearningPath, module: LearningModule, status: "not_started" | "in_progress" | "completed") => {
    if (!isModuleUnlocked(path, module, progressState, LEARNING_PATHS) && status !== "not_started") {
      return;
    }
    setProgressState((previous) => updateModuleStatus(previous, module.id, status));
  };

  const updateConfidence = (moduleId: string, confidence: number) => {
    setProgressState((previous) => updateModuleConfidence(previous, moduleId, confidence));
  };

  const updateDifficulty = (moduleId: string, tier?: DifficultyTier) => {
    setProgressState((previous) => updateModuleDifficultyPreference(previous, moduleId, tier));
  };

  return (
    <div className={styles.root} data-testid="education-module-root">
      <section className={styles.hero}>
        <div className={styles.eyebrow}>Prompts 29-31 - Planning education workspace</div>
        <div className={styles.heroTitle}>Learning paths, premium practice studios, teaching datasets, method explainers, and instructor-facing progress in one education surface.</div>
        <div className={styles.heroText}>
          Every path below references real platform tools, preserves prerequisite logic, exposes methodological assumptions, and now links directly into a rubric-based exercise studio with hints, feedback, and inspectable scoring logic.
        </div>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Learning paths</div>
            <div className={styles.kpiValue}>{LEARNING_PATHS.length}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Completed modules</div>
            <div className={styles.kpiValue}>{totalCompletedModules}/{totalModules}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Unlocked paths</div>
            <div className={styles.kpiValue}>{unlockedPaths}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Teaching datasets</div>
            <div className={styles.kpiValue}>{teachingDatasets.length}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Exercise catalog</div>
            <div className={styles.kpiValue}>{EXERCISE_CATALOG.length}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Assigned exercises</div>
            <div className={styles.kpiValue}>{assignedExercises}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Mastered exercises</div>
            <div className={styles.kpiValue}>{masteredExercises}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Current path progress</div>
            <div className={styles.kpiValue}>{formatPercent(selectedPathProgress.completionRatio)}</div>
          </div>
        </div>
      </section>

      <div className={styles.toolbar}>
        <label className={flowStyles.formLabel}>
          Learner name
          <input
            type="text"
            className={flowStyles.textInput}
            value={progressState.learnerName}
            onChange={(event) => setProgressState((previous) => updateLearnerName(previous, event.target.value))}
            style={{ marginTop: 6, minWidth: 220 }}
          />
        </label>
        <label className={flowStyles.formLabel}>
          Pace setting
          <select
            className={flowStyles.textInput}
            value={progressState.pacePreference}
            onChange={(event) =>
              setProgressState((previous) =>
                updatePacePreference(previous, event.target.value as EducationProgressState["pacePreference"]),
              )
            }
            style={{ marginTop: 6, minWidth: 180 }}
          >
            <option value="adaptive">Adaptive</option>
            <option value="steady">Steady</option>
            <option value="stretch">Stretch</option>
          </select>
        </label>
        <div className={styles.viewSwitch}>
          <button
            type="button"
            className={`${styles.viewButton} ${view === "paths" ? styles.viewButtonActive : ""}`}
            onClick={() => setView("paths")}
          >
            Learning Paths
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${view === "datasets" ? styles.viewButtonActive : ""}`}
            onClick={() => setView("datasets")}
          >
            Dataset Library
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${view === "exercises" ? styles.viewButtonActive : ""}`}
            onClick={() => setView("exercises")}
          >
            Exercise Studio
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${view === "instructor" ? styles.viewButtonActive : ""}`}
            onClick={() => setView("instructor")}
          >
            Instructor Dashboard
          </button>
        </div>
      </div>

      {view === "paths" ? (
        <>
          <section>
            <div className={styles.sectionTitle}>Learning Path Browser</div>
            <div className={styles.muted}>
              Eight curriculum paths aligned to the strengthening plan, each with live progress, prerequisite state, and direct links into the current application.
            </div>
            <div className={styles.pathGrid} style={{ marginTop: 12 }}>
              {LEARNING_PATHS.map((path) => {
                const pathProgress = getPathProgress(path, progressState);
                const unlocked = isPathUnlocked(path, progressState, LEARNING_PATHS);
                return (
                  <button
                    key={path.id}
                    type="button"
                    data-testid={`education-path-${path.id}`}
                    className={`${styles.pathCard} ${path.id === selectedPath.id ? styles.pathCardActive : ""} ${!unlocked ? styles.pathCardLocked : ""}`}
                    onClick={() => selectPath(path.id)}
                  >
                    <div className={styles.pathTitleRow}>
                      <div>
                        <div className={styles.pathTitle}>{path.title}</div>
                        <div className={styles.muted}>{path.description}</div>
                      </div>
                      <span className={styles.chip}>{unlocked ? "Open" : "Locked"}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${pathProgress.completionRatio * 100}%` }} />
                    </div>
                    <div className={styles.moduleMeta}>
                      <span>{pathProgress.completedCount}/{path.modules.length} modules complete</span>
                      <span>{path.totalExercises} exercises</span>
                      <span>{path.axisLabel}</span>
                    </div>
                    <div className={styles.chipRow}>
                      {path.prerequisitePathIds.length === 0 ? (
                        <span className={styles.chip}>No path prerequisites</span>
                      ) : (
                        path.prerequisitePathIds.map((pathId) => (
                          <span key={`${path.id}-${pathId}`} className={styles.chip}>
                            Requires {humanize(pathId)}
                          </span>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.detailGrid}>
            <article className={styles.detailPanel} data-testid={`education-path-detail-${selectedPath.id}`}>
              <div className={styles.eyebrow}>{selectedPath.axisLabel}</div>
              <div className={styles.sectionTitle}>{selectedPath.title}</div>
              <div className={styles.muted}>{selectedPath.description}</div>
              <div className={styles.chipRow}>
                <span className={styles.chip}>{selectedPath.audience}</span>
                <span className={styles.chip}>{selectedPath.totalExercises} exercises</span>
                <span className={styles.chip}>{selectedPathExercises} live practice exercises</span>
                <span className={styles.chip}>{selectedPath.modules.reduce((sum, module) => sum + module.estimatedMinutes, 0)} minutes estimated effort</span>
              </div>
              <div className={styles.chipRow}>
                {selectedPath.prerequisitePathIds.length === 0 ? (
                  <span className={styles.chip}>No prerequisite path</span>
                ) : (
                  selectedPath.prerequisitePathIds.map((pathId) => (
                    <button key={`${selectedPath.id}-${pathId}`} type="button" className={flowStyles.outlineBtn} onClick={() => selectPath(pathId)}>
                      Prerequisite: {LEARNING_PATHS.find((path) => path.id === pathId)?.title ?? humanize(pathId)}
                    </button>
                  ))
                )}
              </div>
              <div className={styles.smallActionRow}>
                <button
                  type="button"
                  className={flowStyles.outlineBtn}
                  onClick={() => openExerciseStudio({ pathId: selectedPath.id })}
                >
                  Open path exercise studio
                </button>
              </div>

              <PathDependencyMap path={selectedPath} progressState={progressState} />

              <div className={styles.moduleList}>
                {selectedPath.modules.map((module) => {
                  const unlocked = isModuleUnlocked(selectedPath, module, progressState, LEARNING_PATHS);
                  const progress = progressState.moduleProgress[module.id];
                  const recommendation = getDifficultyRecommendation(selectedPath, module, progressState, LEARNING_PATHS);
                  const moduleExercises = getExercisesForModule(EXERCISE_CATALOG, module.id);
                  return (
                    <div
                      key={module.id}
                      data-testid={`education-module-${module.id}`}
                      className={`${styles.moduleCard} ${!unlocked ? styles.moduleCardLocked : ""}`}
                    >
                      <div className={styles.moduleHeader}>
                        <div>
                          <div className={styles.moduleMeta}>Module {selectedPath.modules.indexOf(module) + 1}</div>
                          <div className={styles.moduleTitle}>{module.title}</div>
                          <div className={styles.muted}>{module.summary}</div>
                        </div>
                        <div className={styles.chipRow}>
                          <span className={`${styles.statusBadge} ${statusClassName(progress?.status ?? "not_started")}`}>
                            {(progress?.status ?? "not_started").replace(/_/g, " ")}
                          </span>
                          <span className={`${styles.difficultyBadge} ${difficultyClassName(recommendation.tier)}`}>
                            {recommendation.tier}
                          </span>
                        </div>
                      </div>

                      <div className={styles.moduleMeta}>
                        <span>{module.estimatedMinutes} min estimated effort</span>
                        <span>{module.exerciseCount} exercises</span>
                        <span>{unlocked ? "Prerequisites satisfied" : "Locked until prerequisites complete"}</span>
                      </div>

                      {module.prerequisiteModuleIds.length > 0 ? (
                        <div className={styles.chipRow}>
                          {module.prerequisiteModuleIds.map((prerequisiteId) => (
                            <span key={`${module.id}-${prerequisiteId}`} className={styles.chip}>
                              Requires {selectedPath.modules.find((entry) => entry.id === prerequisiteId)?.title ?? humanize(prerequisiteId)}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {module.indicatorContexts?.length ? (
                        <div className={styles.chipRow}>
                          {module.indicatorContexts.map((context) => (
                            <span key={`${module.id}-${context}`} className={styles.chip}>
                              {context}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className={styles.smallActionRow}>
                        {module.toolReferences.map((tool) => (
                          <button
                            key={`${module.id}-${tool.label}`}
                            type="button"
                            className={flowStyles.outlineBtn}
                            onClick={() => dispatchCenterPanelNavigation(tool.target)}
                          >
                            {tool.label}
                          </button>
                        ))}
                      </div>

                      <div className={styles.smallActionRow}>
                        {module.methodologyIds.map((methodologyId) => (
                          <MethodologyInfoButton key={`${module.id}-${methodologyId}`} explainerId={methodologyId} pathId={selectedPath.id} label="Explainer" />
                        ))}
                        {module.methodologyIds.map((methodologyId) => (
                          <button
                            key={`${module.id}-${methodologyId}-focus`}
                            type="button"
                            className={flowStyles.outlineBtn}
                            onClick={() => selectExplainer(methodologyId)}
                          >
                            Focus {METHODOLOGY_EXPLAINERS.find((explainer) => explainer.id === methodologyId)?.title ?? methodologyId}
                          </button>
                        ))}
                      </div>

                      {moduleExercises.length > 0 ? (
                        <div className={styles.exerciseLinkPanel}>
                          <div className={styles.exerciseLinkHeader}>
                            <div>
                              <div className={styles.subSectionTitle}>Practice exercises</div>
                              <div className={styles.muted}>Rubric-based exercises linked directly to this module.</div>
                            </div>
                            <span className={styles.chip}>{moduleExercises.length} live exercises</span>
                          </div>
                          <div className={styles.exerciseLinkList}>
                            {moduleExercises.map((exercise) => (
                              <button
                                key={exercise.id}
                                type="button"
                                className={styles.exerciseLinkButton}
                                onClick={() =>
                                  openExerciseStudio({
                                    pathId: selectedPath.id,
                                    moduleId: module.id,
                                    exerciseId: exercise.id,
                                    category: exercise.category,
                                  })
                                }
                              >
                                <strong>{exercise.title}</strong>
                                <span className={styles.muted}>{exercise.summary}</span>
                                <span className={styles.exerciseLinkMeta}>
                                  <span>{exercise.estimatedMinutes} min</span>
                                  <span>{exercise.category.replace(/_/g, " ")}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className={styles.controlGroup}>
                        <div className={styles.subSectionTitle}>Progress tracking</div>
                        <div className={styles.smallActionRow}>
                          <button type="button" className={flowStyles.outlineBtn} disabled={!unlocked} onClick={() => updateStatus(selectedPath, module, "in_progress")}>
                            Start module
                          </button>
                          <button type="button" className={flowStyles.outlineBtn} disabled={!unlocked} onClick={() => updateStatus(selectedPath, module, "completed")}>
                            Mark complete
                          </button>
                          <button type="button" className={flowStyles.outlineBtn} onClick={() => updateStatus(selectedPath, module, "not_started")}>
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className={styles.controlGroup}>
                        <div className={styles.subSectionTitle}>Confidence score ({progress?.confidence ?? 3}/5)</div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={progress?.confidence ?? 3}
                          onChange={(event) => updateConfidence(module.id, Number(event.target.value))}
                        />
                        <div className={styles.muted}>{recommendation.rationale}</div>
                      </div>

                      <div className={styles.controlGroup}>
                        <div className={styles.subSectionTitle}>Adaptive difficulty hook</div>
                        <div className={styles.smallActionRow}>
                          {[undefined, "support", "standard", "stretch"].map((tier) => (
                            <button
                              key={`${module.id}-${tier ?? "adaptive"}`}
                              type="button"
                              className={flowStyles.outlineBtn}
                              onClick={() => updateDifficulty(module.id, tier as DifficultyTier | undefined)}
                            >
                              {tier ?? "Adaptive"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <aside className={styles.sidePanel}>
              <div className={styles.sectionTitle}>Recommended Next Modules</div>
              <div className={styles.studentList}>
                {recommendedModules.length === 0 ? (
                  <div className={styles.muted}>All currently unlocked paths are complete. Switch to instructor view or open a new path.</div>
                ) : (
                  recommendedModules.map((entry) => (
                    <div key={entry.module.id} className={styles.studentCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <strong>{entry.module.title}</strong>
                        <span className={`${styles.difficultyBadge} ${difficultyClassName(entry.recommendation.tier)}`}>
                          {entry.recommendation.tier}
                        </span>
                      </div>
                      <div className={styles.muted}>{entry.path.title}</div>
                      <div className={styles.muted}>{entry.recommendation.rationale}</div>
                      <div className={styles.smallActionRow}>
                        <button type="button" className={flowStyles.outlineBtn} onClick={() => selectPath(entry.path.id)}>
                          Open path detail
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.sectionTitle}>Methodology Library</div>
              <label className={flowStyles.formLabel}>
                Search explainers
                <input
                  type="text"
                  className={flowStyles.textInput}
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  style={{ marginTop: 6 }}
                  placeholder="Search formulas, methods, and use cases"
                />
              </label>
              <div className={styles.libraryList}>
                {visibleExplainers.map((explainer) => (
                  <button
                    key={explainer.id}
                    type="button"
                    className={`${styles.libraryButton} ${selectedExplainerId === explainer.id ? styles.libraryButtonActive : ""}`}
                    onClick={() => selectExplainer(explainer.id)}
                  >
                    <strong>{explainer.title}</strong>
                    <div className={styles.muted}>{explainer.shortDefinition}</div>
                  </button>
                ))}
              </div>

              <MethodologyExplainerCard explainerId={selectedExplainerId} pathId={selectedPath.id} onRelatedSelect={selectExplainer} />
            </aside>
          </section>
        </>
      ) : view === "datasets" ? (
        <ChunkLoadBoundary
          compact
          title="Dataset library unavailable"
          message="The dataset library did not load. Retry after the dev server reconnects, or reload the app if it persists."
        >
          <Suspense fallback={<EducationSectionFallback label="Loading dataset library..." testId="education-dataset-loading" />}>
            <DatasetLibraryBrowser
              onLoadDataset={handleTeachingDatasetLoad}
              loadingDatasetId={loadingDatasetId}
              introTitle="Teaching datasets for studio onboarding and benchmarking"
              introText="Each city pack includes source, license, update date, spatial extent, CRS, and schema summaries. Loading a pack validates the bundle, opens Map Explorer, and publishes ready-to-inspect layers without any manual setup."
              testIdPrefix="education-dataset"
            />
          </Suspense>
        </ChunkLoadBoundary>
      ) : view === "exercises" ? (
        <ExerciseWorkspace
          progressState={progressState}
          onProgressStateChange={setProgressState}
          focusRequest={exerciseFocusRequest}
          onOpenPath={(pathId) => {
            selectPath(pathId);
            setView("paths");
          }}
        />
      ) : (
        <InstructorDashboard summary={instructorSummary} />
      )}
    </div>
  );
};

export default EducationModule;