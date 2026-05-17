import React, { useMemo } from "react";
import railStyles from "../../centerpanel/rail/rail.module.css";
import styles from "../education/educationRail.module.css";
import { listDashboardTemplates } from "./templates";
import { WIDGET_LIBRARY } from "./layout";
import { loadDashboardLibrary } from "./storage";
import { useDashboardUIStore } from "./uiStore";

type IndexEntry = {
  id: string;
  label: string;
  meta?: string;
  active?: boolean;
  status?: "ok" | "warn" | "info" | "muted";
};

type IndexGroup = {
  id: string;
  title: string;
  count?: number;
  entries: IndexEntry[];
};

function OutlineIndex(): React.ReactElement {
  const activeDashboardId = useDashboardUIStore((s) => s.activeDashboardId);
  const selectedWidgetId = useDashboardUIStore((s) => s.selectedWidgetId);
  const library = useMemo(() => loadDashboardLibrary(), []);
  const active = useMemo(() => {
    const id = activeDashboardId ?? library.activeDashboardId;
    return library.dashboards.find((d) => d.id === id) ?? library.dashboards[0] ?? null;
  }, [library, activeDashboardId]);

  if (!active) {
    return (
      <IndexBody
        groups={[
          { id: "empty", title: "Outline", entries: [] },
        ]}
      />
    );
  }

  const widgets = [...active.widgets].sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);
  const groups: IndexGroup[] = [
    {
      id: "dashboard",
      title: "Active dashboard",
      entries: [
        {
          id: active.id,
          label: active.name,
          meta: `${active.widgets.length} widgets`,
          status: "info",
        },
      ],
    },
    {
      id: "widgets",
      title: "Widgets",
      count: widgets.length,
      entries: widgets.map((w) => ({
        id: w.id,
        label: w.config.title || w.type,
        meta: `${w.layout.w}×${w.layout.h}`,
        active: selectedWidgetId === w.id,
        status: "ok",
      })),
    },
  ];

  return <IndexBody groups={groups} />;
}

function TemplatesIndex(): React.ReactElement {
  const templates = useMemo(() => listDashboardTemplates(), []);
  const grouped = new Map<string, IndexEntry[]>();
  for (const t of templates) {
    const cat = t.audience.split(",")[0]?.trim() ?? "General";
    const list = grouped.get(cat) ?? [];
    list.push({
      id: t.id,
      label: t.label,
      meta: t.useCase.slice(0, 24),
      status: "muted",
    });
    grouped.set(cat, list);
  }
  const groups: IndexGroup[] = Array.from(grouped.entries()).map(([cat, entries]) => ({
    id: cat,
    title: cat,
    count: entries.length,
    entries,
  }));
  return <IndexBody groups={groups} />;
}

function LibraryIndex(): React.ReactElement {
  const entries: IndexEntry[] = WIDGET_LIBRARY.map((entry) => ({
    id: entry.type,
    label: entry.label,
    meta: `${entry.defaultLayout.w}×${entry.defaultLayout.h}`,
    status: "info",
  }));
  return (
    <IndexBody
      groups={[{ id: "library", title: "Widget library", count: entries.length, entries }]}
    />
  );
}

function SavedIndex(): React.ReactElement {
  const library = useMemo(() => loadDashboardLibrary(), []);
  const activeDashboardId = useDashboardUIStore((s) => s.activeDashboardId);
  const entries: IndexEntry[] = [...library.dashboards]
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .map((d) => ({
      id: d.id,
      label: d.name,
      meta: `${d.widgets.length}`,
      active: (activeDashboardId ?? library.activeDashboardId) === d.id,
      status: "ok",
    }));
  return (
    <IndexBody
      groups={[{ id: "saved", title: "Saved dashboards", count: entries.length, entries }]}
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
                    className={`${styles.item} ${entry.active ? styles.itemActive : ""}`.trim()}
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
  outline: {
    eyebrow: "Dashboard",
    title: "Outline",
    hint: "Active dashboard structure and widget list.",
  },
  templates: {
    eyebrow: "Dashboard",
    title: "Templates",
    hint: "Pre-built dashboards grouped by audience.",
  },
  library: {
    eyebrow: "Dashboard",
    title: "Widget Library",
    hint: "Reusable building blocks for any layout.",
  },
  saved: {
    eyebrow: "Dashboard",
    title: "Saved Layouts",
    hint: "Persisted dashboards sorted by last edit.",
  },
};

const VIEW_SWITCHER: {
  id: "outline" | "templates" | "library" | "saved";
  label: string;
  glyph: string;
}[] = [
  { id: "outline", label: "Outline", glyph: "≡" },
  { id: "templates", label: "Templates", glyph: "▦" },
  { id: "library", label: "Library", glyph: "◇" },
  { id: "saved", label: "Saved", glyph: "✓" },
];

export function DashboardLeftRail(): React.ReactElement {
  const view = useDashboardUIStore((s) => s.view);
  const setView = useDashboardUIStore((s) => s.setView);
  const label = VIEW_LABELS[view] ?? VIEW_LABELS["outline"]!;

  const library = useMemo(() => loadDashboardLibrary(), []);
  const templates = useMemo(() => listDashboardTemplates(), []);
  const activeDashboard = useMemo(() => {
    const id = library.activeDashboardId;
    return library.dashboards.find((d) => d.id === id) ?? library.dashboards[0] ?? null;
  }, [library]);

  const counts: Record<string, number> = {
    outline: activeDashboard?.widgets.length ?? 0,
    templates: templates.length,
    library: WIDGET_LIBRARY.length,
    saved: library.dashboards.length,
  };

  return (
    <aside className={`${railStyles.leftRailRoot} ${styles.rail}`}>
      <header className={styles.railHeader}>
        <span className={styles.railEyebrow}>{label.eyebrow}</span>
        <span className={styles.railTitle}>{label.title}</span>
        <span className={styles.railHint}>{label.hint}</span>
      </header>
      <nav className={styles.viewSwitcher} aria-label="Dashboard rail view">
        {VIEW_SWITCHER.map((entry) => {
          const active = view === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setView(entry.id)}
              className={`${styles.viewSwitcherButton} ${active ? styles.viewSwitcherButtonActive : ""}`.trim()}
              aria-pressed={active}
            >
              <span className={styles.viewSwitcherGlyph} aria-hidden="true">{entry.glyph}</span>
              <span className={styles.viewSwitcherLabel}>{entry.label}</span>
              <span className={styles.viewSwitcherCount}>{counts[entry.id]}</span>
            </button>
          );
        })}
      </nav>
      <div className={styles.indexScroll} key={view}>
        {view === "outline" ? <OutlineIndex /> : null}
        {view === "templates" ? <TemplatesIndex /> : null}
        {view === "library" ? <LibraryIndex /> : null}
        {view === "saved" ? <SavedIndex /> : null}
      </div>
    </aside>
  );
}

export default DashboardLeftRail;
