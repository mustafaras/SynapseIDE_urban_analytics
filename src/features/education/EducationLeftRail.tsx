import React, { useMemo } from "react";
import railStyles from "../../centerpanel/rail/rail.module.css";
import styles from "./educationRail.module.css";
import { LEARNING_PATHS } from "./learningPaths";
import { METHODOLOGY_EXPLAINERS } from "./methodologyData";
import { EXERCISE_CATALOG } from "./exercises";
import { getTeachingDatasetLibrary } from "../../services/data/datasetLibrary";
import { getPathProgress, isPathUnlocked, buildInstructorDashboard } from "./LearningPathEngine";
import { loadEducationProgressState } from "./storage";
import { useEducationUIStore } from "./uiStore";

type IndexEntry = {
  id: string;
  label: string;
  meta?: string;
  active?: boolean;
  locked?: boolean;
  status?: "ok" | "warn" | "info" | "muted";
  onClick?: () => void;
};

type IndexGroup = {
  id: string;
  title: string;
  count?: number;
  entries: IndexEntry[];
};

function PathsIndex(): React.ReactElement {
  const selectedPathId = useEducationUIStore((s) => s.selectedPathId);
  const setSelectedPathId = useEducationUIStore((s) => s.setSelectedPathId);
  const progress = useMemo(() => loadEducationProgressState(), []);

  const groups: IndexGroup[] = useMemo(() => {
    const unlocked: IndexEntry[] = [];
    const locked: IndexEntry[] = [];
    for (const path of LEARNING_PATHS) {
      const isUnlocked = isPathUnlocked(path, progress, LEARNING_PATHS);
      const p = getPathProgress(path, progress);
      const entry: IndexEntry = {
        id: path.id,
        label: path.title,
        meta: `${p.completedCount}/${path.modules.length}`,
        active: selectedPathId === path.id,
        locked: !isUnlocked,
        status: isUnlocked ? "ok" : "muted",
        onClick: () => setSelectedPathId(path.id),
      };
      if (isUnlocked) unlocked.push(entry);
      else locked.push(entry);
    }
    return [
      { id: "open", title: "Open paths", count: unlocked.length, entries: unlocked },
      { id: "locked", title: "Locked paths", count: locked.length, entries: locked },
    ];
  }, [progress, selectedPathId, setSelectedPathId]);

  return <IndexBody groups={groups} />;
}

function DatasetsIndex(): React.ReactElement {
  const datasets = useMemo(() => getTeachingDatasetLibrary(), []);
  const regions = useMemo(() => {
    const map = new Map<string, IndexEntry[]>();
    for (const ds of datasets) {
      const list = map.get(ds.region) ?? [];
      list.push({
        id: ds.id,
        label: ds.city,
        meta: `${ds.layers.length} layers`,
        status: "info",
      });
      map.set(ds.region, list);
    }
    return Array.from(map.entries()).map(([region, entries]) => ({
      id: region,
      title: region,
      count: entries.length,
      entries,
    }));
  }, [datasets]);

  return <IndexBody groups={regions} />;
}

function ExercisesIndex(): React.ReactElement {
  const progress = useMemo(() => loadEducationProgressState(), []);

  const groups: IndexGroup[] = useMemo(() => {
    const categories = new Map<string, IndexEntry[]>();
    for (const ex of EXERCISE_CATALOG) {
      const cat = ex.category.replace(/_/g, " ");
      const list = categories.get(cat) ?? [];
      const status = progress.exerciseProgress[ex.id]?.status ?? "not_assigned";
      list.push({
        id: ex.id,
        label: ex.title,
        meta: `${ex.estimatedMinutes}m`,
        status:
          status === "completed"
            ? "ok"
            : status === "in_progress"
              ? "info"
              : status === "assigned"
                ? "warn"
                : "muted",
      });
      categories.set(cat, list);
    }
    return Array.from(categories.entries()).map(([cat, entries]) => ({
      id: cat,
      title: cat,
      count: entries.length,
      entries,
    }));
  }, [progress]);

  return <IndexBody groups={groups} />;
}

function InstructorIndex(): React.ReactElement {
  const progress = useMemo(() => loadEducationProgressState(), []);
  const summary = useMemo(
    () => buildInstructorDashboard(LEARNING_PATHS, progress),
    [progress],
  );

  const groups: IndexGroup[] = useMemo(
    () => [
      {
        id: "roster",
        title: "Roster",
        count: summary.roster.length,
        entries: summary.roster.map((s) => ({
          id: s.id,
          label: s.name,
          meta: s.cohort,
          status: s.flaggedModuleIds.length > 0 ? "warn" : "ok",
        })),
      },
      {
        id: "bottlenecks",
        title: "Bottleneck modules",
        count: summary.moduleBottlenecks.length,
        entries: summary.moduleBottlenecks.map((b) => ({
          id: b.moduleId,
          label: b.title,
          meta: `${b.count} flagged`,
          status: "warn" as const,
        })),
      },
    ],
    [summary],
  );

  return <IndexBody groups={groups} />;
}

function MethodsIndex(): React.ReactElement {
  const selectedExplainerId = useEducationUIStore((s) => s.selectedExplainerId);
  const setSelectedExplainerId = useEducationUIStore((s) => s.setSelectedExplainerId);

  const entries: IndexEntry[] = METHODOLOGY_EXPLAINERS.map((m) => ({
    id: m.id,
    label: m.title,
    meta: m.shortDefinition.slice(0, 32),
    active: selectedExplainerId === m.id,
    onClick: () => setSelectedExplainerId(m.id),
  }));

  return (
    <IndexBody
      groups={[
        { id: "methods", title: "Method explainers", count: entries.length, entries },
      ]}
    />
  );
}

function IndexBody({ groups }: { groups: IndexGroup[] }): React.ReactElement {
  return (
    <div className={styles.indexBody}>
      {groups.map((group) => (
        <section key={group.id} className={styles.group}>
          <header className={styles.groupHeader}>
            <span className={styles.groupTitle}>{group.title}</span>
            {typeof group.count === "number" ? (
              <span className={styles.groupCount}>{group.count}</span>
            ) : null}
          </header>
          {group.entries.length === 0 ? (
            <div className={styles.empty}>No items</div>
          ) : (
            <ul className={styles.list}>
              {group.entries.map((entry) => (
                <li key={entry.id} className={styles.itemWrap}>
                  <button
                    type="button"
                    className={`${styles.item} ${entry.active ? styles.itemActive : ""} ${entry.locked ? styles.itemLocked : ""}`.trim()}
                    onClick={entry.onClick}
                    title={entry.label}
                  >
                    <span className={`${styles.dot} ${styles[`dot_${entry.status ?? "muted"}`] ?? ""}`} aria-hidden="true" />
                    <span className={styles.itemLabel}>{entry.label}</span>
                    {entry.meta ? <span className={styles.itemMeta}>{entry.meta}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

const VIEW_LABELS: Record<string, { eyebrow: string; title: string; hint: string }> = {
  paths: {
    eyebrow: "Education",
    title: "Learning Paths",
    hint: "Curriculum index aligned to your unlocked progress.",
  },
  datasets: {
    eyebrow: "Education",
    title: "Dataset Library",
    hint: "Teaching city packs grouped by region.",
  },
  exercises: {
    eyebrow: "Education",
    title: "Exercise Studio",
    hint: "Rubric-based exercises grouped by category.",
  },
  instructor: {
    eyebrow: "Education",
    title: "Instructor Dashboard",
    hint: "Cohort signals, roster, and module bottlenecks.",
  },
  methods: {
    eyebrow: "Education",
    title: "Method Explainers",
    hint: "Reference card library.",
  },
};

export function EducationLeftRail(): React.ReactElement {
  const view = useEducationUIStore((s) => s.view);
  const label = VIEW_LABELS[view] ?? VIEW_LABELS["paths"]!;

  return (
    <aside className={`${railStyles.leftRailRoot} ${styles.rail}`}>
      <header className={styles.railHeader}>
        <span className={styles.railEyebrow}>{label.eyebrow}</span>
        <span className={styles.railTitle}>{label.title}</span>
        <span className={styles.railHint}>{label.hint}</span>
      </header>
      <div className={styles.indexScroll} key={view}>
        {view === "paths" ? <PathsIndex /> : null}
        {view === "datasets" ? <DatasetsIndex /> : null}
        {view === "exercises" ? <ExercisesIndex /> : null}
        {view === "instructor" ? <InstructorIndex /> : null}
        {view === "methods" ? <MethodsIndex /> : null}
      </div>
    </aside>
  );
}

export default EducationLeftRail;
