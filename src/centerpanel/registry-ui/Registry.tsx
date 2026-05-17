import React, { useEffect, useMemo, useState } from "react";
import {
  ensureProjectSeed,
  filterProjects,
  ProjectRegistryProvider,
  useProjectRegistry,
} from "../registry/state";
import type { ProjectRecord } from "../registry/types";
import type { UrbanScale, UrbanTag } from "@/features/urbanAnalytics/lib/types";
import styles from "../styles/registry.module.css";
import { useUrbanStore } from "@/features/urbanAnalytics/store";
import {
  useCollaborationOptional,
  useScopePresence,
} from "@/features/collaboration/hooks";
import {
  CollaborationCommentSidebar,
  CollaborationPresenceStrip,
  CollaborationSessionOverview,
} from "@/features/collaboration/CollaborationUI";

const SCALES: UrbanScale[] = [
  "parcel", "block", "neighborhood", "district",
  "city", "metropolitan", "regional", "national",
];

const PRIORITY_LABELS: Record<number, string> = {
  1: "Critical", 2: "High", 3: "Medium", 4: "Low", 5: "Minimal",
};

/* ------------------------------------------------------------------ */
/*  Root wrapper                                                       */
/* ------------------------------------------------------------------ */

export default function RegistryView({ children }: { children?: React.ReactNode }) {
  useEffect(() => { ensureProjectSeed(); }, []);
  return (
    <ProjectRegistryProvider>
      {children}
    </ProjectRegistryProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Left rail — filters                                                */
/* ------------------------------------------------------------------ */

export function RegistryLeft() {
  const { state, actions } = useProjectRegistry();
  const { filter } = state;

  const toggleScale = (s: UrbanScale) => {
    const cur = filter.scaleFilter ?? [];
    actions.setFilter({
      scaleFilter: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    });
  };

  const togglePriority = (p: 1 | 2 | 3 | 4 | 5) => {
    const cur = filter.priorityFilter ?? [];
    actions.setFilter({
      priorityFilter: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    });
  };

  // collect unique tags across all projects
  const allTags = Array.from(
    new Set(state.projects.flatMap((p) => p.tags)),
  ).sort() as UrbanTag[];

  const toggleTag = (t: UrbanTag) => {
    const cur = filter.tagFilter ?? [];
    actions.setFilter({
      tagFilter: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    });
  };

  // Selected project tags for QuickReference
  const selectedProject = state.selectedProjectId
    ? state.projects.find((p) => p.id === state.selectedProjectId)
    : state.projects[0];
  const selectedProjectTags = selectedProject?.tags ?? [];

  return (
    <div className={styles.leftRail}>
      {/* Search */}
      <input
        className={styles.searchInput}
        placeholder="Search projects…"
        value={filter.search ?? ""}
        onChange={(e) => actions.setFilter({ search: (e.target as HTMLInputElement).value })}
      />

      {/* Scale filter */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Scale</div>
        <div className={styles.pills}>
          {SCALES.map((s) => (
            <button
              key={s}
              className={styles.pill}
              data-active={(filter.scaleFilter ?? []).includes(s)}
              onClick={() => toggleScale(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Priority filter */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Priority</div>
        <div className={styles.pills}>
          {([1, 2, 3, 4, 5] as const).map((p) => (
            <button
              key={p}
              className={styles.pill}
              data-active={(filter.priorityFilter ?? []).includes(p)}
              onClick={() => togglePriority(p)}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Tags filter */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Tags</div>
        <div className={styles.pills}>
          {allTags.map((t) => (
            <button
              key={t}
              className={styles.pill}
              data-active={(filter.tagFilter ?? []).includes(t)}
              onClick={() => toggleTag(t)}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Reference — recently viewed library cards */}
      <QuickReferenceSection projectTags={selectedProjectTags} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Reference — recently viewed library cards & project matches  */
/* ------------------------------------------------------------------ */

function QuickReferenceSection({ projectTags }: { projectTags: string[] }) {
  const recentIds = useUrbanStore((s) => s.recentlyViewedIds);
  const visibleCardsFn = useUrbanStore((s) => s.visibleCards);
  const selectCard = useUrbanStore((s) => s.selectCard);

  const allCards = useMemo(() => {
    try {
      return (visibleCardsFn?.() ?? []) as Array<{
        id: string;
        title?: string;
        summary?: string;
        tags?: string[];
      }>;
    } catch {
      return [];
    }
  }, [visibleCardsFn]);

  // Recently viewed (max 4)
  const recentCards = useMemo(() => {
    if (!recentIds?.length || !allCards.length) return [];
    return recentIds
      .slice(0, 4)
      .map((id) => allCards.find((c) => c.id === id))
      .filter(Boolean) as typeof allCards;
  }, [recentIds, allCards]);

  // Project-tag matches (max 4, excluding already-in-recent)
  const tagMatches = useMemo(() => {
    if (!projectTags.length || !allCards.length) return [];
    const recentSet = new Set(recentIds ?? []);
    const tagSet = new Set(projectTags.map((t) => t.toLowerCase()));
    return allCards
      .filter((c) => {
        if (recentSet.has(c.id)) return false;
        const cTags = (c.tags ?? []).map((t) => t.toLowerCase());
        return cTags.some((t) => tagSet.has(t));
      })
      .slice(0, 4);
  }, [projectTags, allCards, recentIds]);

  if (recentCards.length === 0 && tagMatches.length === 0) return null;

  const handleClick = (id: string) => {
    try {
      selectCard(id);
    } catch { /* noop */ }
  };

  const CardChip = ({
    card,
  }: {
    card: { id: string; title?: string; summary?: string };
  }) => (
    <button
      onClick={() => handleClick(card.id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '4px 8px',
        borderRadius: 3,
        border: '1px solid transparent',
        background: 'transparent',
        color: '#FAFAF9',
        cursor: 'pointer',
        transition: 'background 140ms ease, transform 140ms cubic-bezier(.2,.7,.2,1), box-shadow 180ms ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-text-primary) 5%, transparent)';
        e.currentTarget.style.transform = 'translateX(2px)';
        e.currentTarget.style.boxShadow = 'inset 2px 0 0 var(--syn-interaction-active)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      title={`View "${card.title}" in the right panel`}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(250,250,249,0.85)', lineHeight: 1.3 }}>
        {card.title ?? card.id}
      </div>
      {!!card.summary && (
        <div
          style={{
            fontSize: '0.64rem',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.3,
            marginTop: 1,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {(card.summary ?? '').length > 80 ? `${(card.summary ?? '').slice(0, 80)  }...` : card.summary}
        </div>
      )}
    </button>
  );

  return (
    <>
      {recentCards.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle} style={{ color: 'var(--syn-interaction-active, #3794ff)' }}>
            Recently Viewed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {recentCards.map((c) => (
              <CardChip key={c.id} card={c} />
            ))}
          </div>
        </div>
      )}

      {tagMatches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle} style={{ color: 'var(--syn-interaction-active, #3794ff)' }}>
            Relevant Methods
          </div>
          <div
            style={{
              fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            Cards matching project tags
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {tagMatches.map((c) => (
              <CardChip key={c.id} card={c} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel — project list + detail                                 */
/* ------------------------------------------------------------------ */

export function RegistryMain() {
  const { state, actions } = useProjectRegistry();
  const filtered = filterProjects(state);
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const selected = detailId
    ? state.projects.find((p) => p.id === detailId)
    : undefined;

  if (selected) {
    return <ProjectDetail project={selected} onBack={() => setDetailId(undefined)} />;
  }

  return (
    <div className={styles.tableCard}>
      {/* header */}
      <div className={styles.toolbar}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* column labels */}
      <div className={styles.tableHeader} style={{ gridTemplateColumns: "2.4fr 1fr 0.8fr 1.2fr 0.6fr 1fr" }}>
        <span>Name</span>
        <span>Scale</span>
        <span>Priority</span>
        <span>Tags</span>
        <span>Sessions</span>
        <span>Last Session</span>
      </div>

      {/* rows */}
      <div className={styles.rows}>
        {filtered.map((p) => (
          <div
            key={p.id}
            className={styles.row}
            style={{ gridTemplateColumns: "2.4fr 1fr 0.8fr 1.2fr 0.6fr 1fr", cursor: "pointer" }}
            aria-selected={state.selectedProjectId === p.id}
            onClick={() => {
              actions.selectProject(p.id);
              setDetailId(p.id);
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--syn-text-primary)" }}>{p.name}</span>
            <span><span className={styles.badge}>{p.scale}</span></span>
            <span className={styles.badge}>{PRIORITY_LABELS[p.priority]}</span>
            <span className={styles.cellMuted}>
              {p.tags.slice(0, 3).map((t) => t.replace(/_/g, " ")).join(", ")}
              {p.tags.length > 3 ? ` +${p.tags.length - 3}` : ""}
            </span>
            <span>{p.sessionsCount}</span>
            <span className={styles.cellMuted}>{p.lastSessionDate ?? "—"}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, opacity: 0.5 }}>
            No projects match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail view                                                        */
/* ------------------------------------------------------------------ */

function ProjectDetail({ project, onBack }: { project: ProjectRecord; onBack: () => void }) {
  const { actions } = useProjectRegistry();
  const collaboration = useCollaborationOptional();
  const [tab, setTab] = useState<"overview" | "sessions" | "indicators">("overview");
  const projectScopeId = `project:${project.id}`;
  const projectPresence = useScopePresence(projectScopeId);

  useEffect(() => {
    if (!collaboration) {
      return;
    }
    collaboration.updatePresence({
      activeScope: projectScopeId,
      activeSection: tab,
      activeLabel: `${project.name} · ${tab}`,
      selectionText: `Project ${tab}`,
    });
  }, [collaboration, project.name, projectScopeId, tab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8, padding: 8 }}>
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className={styles.primaryBtn} onClick={onBack}>← Back</button>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{project.name}</span>
        <span className={styles.badge} style={{ marginLeft: 8 }}>{project.scale}</span>
        <span className={styles.badge} style={{ marginLeft: 4 }}>P{project.priority}</span>
      </div>

      <CollaborationPresenceStrip
        participants={projectPresence}
        label="Project collaboration"
        compact
        emptyLabel="Project-level edits and reviews will surface here when another analyst joins."
      />

      {/* tabs */}
      <div className={styles.pills}>
        {(["overview", "sessions", "indicators"] as const).map((t) => (
          <button key={t} className={styles.pill} data-active={tab === t} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, alignItems: "start" }}>
            <OverviewTab
              project={project}
              projectPresence={projectPresence}
              onUpdate={(patch) => actions.updateProject(project.id, patch)}
              onFieldActivity={(field, selectionText) => collaboration?.updatePresence({
                activeScope: projectScopeId,
                activeSection: field,
                activeLabel: `${project.name} · ${field}`,
                selectionText: selectionText?.trim() || `Field ${field}`,
              })}
            />
            {collaboration ? (
              <div style={{ display: "grid", gap: 12 }}>
                <CollaborationSessionOverview
                  scopeId={projectScopeId}
                  title="Project Collaboration"
                  description="Track live metadata editing, queued sync state, and threaded scientific review for this project."
                  participants={projectPresence}
                  emptyState="Open the same project in another tab to start a shared review session."
                />
                <CollaborationCommentSidebar
                  scopeId={projectScopeId}
                  title="Project Threads"
                  subtitle="Use threaded review notes to coordinate metadata edits and planning annotations."
                  defaultAnchorLabel="Project overview"
                />
              </div>
            ) : null}
          </div>
        )}
        {tab === "sessions" && <SessionsTab project={project} />}
        {tab === "indicators" && <IndicatorsTab project={project} />}
      </div>
    </div>
  );
}

function OverviewTab({
  project,
  projectPresence,
  onUpdate,
  onFieldActivity,
}: {
  project: ProjectRecord;
  projectPresence: ReturnType<typeof useScopePresence>;
  onUpdate: (patch: Partial<ProjectRecord>) => void;
  onFieldActivity: (field: string, selectionText?: string) => void;
}) {
  const fieldPresence = (field: string) => projectPresence.filter((presence) => !presence.isSelf && presence.activeSection === field);
  const fieldSignal = (field: string) => {
    const participants = fieldPresence(field);
    if (participants.length === 0) {
      return null;
    }
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {participants.map((presence) => {
          const preview = presence.selectionText?.trim();
          const text = preview && preview !== field ? preview.slice(0, 44) : "editing";
          return (
            <span
              key={presence.clientId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 999,
                border: `1px solid ${presence.color}`,
                background: "rgba(15, 23, 42, 0.7)",
                color: "var(--syn-text-primary)",
                fontSize: 11,
              }}
              title={preview || presence.name}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: presence.color,
                }}
              />
              {presence.name}: {text}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gap: 12, fontSize: 12, padding: 4 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <strong>Project Name</strong>
          <input
            className={styles.searchInput}
            value={project.name}
            onChange={(event) => {
              onUpdate({ name: event.target.value });
              onFieldActivity("name", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("name", event.currentTarget.value)}
          />
          {fieldSignal("name")}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Scale</strong>
          <select
            className={styles.searchInput}
            value={project.scale}
            onChange={(event) => {
              onUpdate({ scale: event.target.value as UrbanScale });
              onFieldActivity("scale", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("scale", event.currentTarget.value)}
          >
            {SCALES.map((scale) => (
              <option key={scale} value={scale}>{scale}</option>
            ))}
          </select>
          {fieldSignal("scale")}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Priority</strong>
          <select
            className={styles.searchInput}
            value={project.priority}
            onChange={(event) => {
              onUpdate({ priority: Number(event.target.value) as ProjectRecord["priority"] });
              onFieldActivity("priority", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("priority", event.currentTarget.value)}
          >
            {([1, 2, 3, 4, 5] as const).map((priority) => (
              <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
            ))}
          </select>
          {fieldSignal("priority")}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Data Completeness</strong>
          <input
            className={styles.searchInput}
            type="number"
            min={0}
            max={100}
            value={project.dataCompleteness ?? 0}
            onChange={(event) => {
              onUpdate({ dataCompleteness: Number(event.target.value) });
              onFieldActivity("dataCompleteness", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("dataCompleteness", event.currentTarget.value)}
          />
          {fieldSignal("dataCompleteness")}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Climate Vulnerability</strong>
          <select
            className={styles.searchInput}
            value={project.climateVulnerability ?? "medium"}
            onChange={(event) => {
              onUpdate({ climateVulnerability: event.target.value as NonNullable<ProjectRecord["climateVulnerability"]> });
              onFieldActivity("climateVulnerability", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("climateVulnerability", event.currentTarget.value)}
          >
            {(["low", "medium", "high", "critical"] as const).map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          {fieldSignal("climateVulnerability")}
        </label>

        <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
          <strong>Description</strong>
          <textarea
            className={styles.searchInput}
            value={project.description}
            onChange={(event) => {
              onUpdate({ description: event.target.value });
              onFieldActivity("description", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("description", event.currentTarget.value)}
            rows={5}
            style={{ minHeight: 120, paddingTop: 10, paddingBottom: 10 }}
          />
          {fieldSignal("description")}
        </label>

        <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
          <strong>Tags</strong>
          <input
            className={styles.searchInput}
            value={project.tags.join(", ")}
            onChange={(event) => {
              onUpdate({
                tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) as UrbanTag[],
              });
              onFieldActivity("tags", event.target.value);
            }}
            onFocus={(event) => onFieldActivity("tags", event.currentTarget.value)}
          />
          {fieldSignal("tags")}
        </label>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div><strong>Area:</strong> {project.area_km2 != null ? `${project.area_km2.toLocaleString()} km²` : "—"}</div>
        <div><strong>CRS:</strong> {project.crs}</div>
        <div><strong>Bbox:</strong> {project.bbox ? `[${project.bbox.join(", ")}]` : "—"}</div>
      </div>

      <div style={{ opacity: 0.5 }}>
        Created {project.createdAt} · Updated {project.updatedAt}
      </div>
    </div>
  );
}

function SessionsTab({ project }: { project: ProjectRecord }) {
  return (
    <div style={{ fontSize: 12, padding: 4 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {project.sessionsCount} session{project.sessionsCount !== 1 ? "s" : ""}
      </div>
      {project.sessionsCount === 0 ? (
        <div style={{ opacity: 0.5 }}>No sessions recorded yet.</div>
      ) : (
        <div style={{ opacity: 0.5 }}>
          Last session: {project.lastSessionDate ?? "—"}. Session list will populate from analysis runs.
        </div>
      )}
    </div>
  );
}

function IndicatorsTab({ project }: { project: ProjectRecord }) {
  return (
    <div style={{ fontSize: 12, padding: 4 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {project.indicators.length} indicator{project.indicators.length !== 1 ? "s" : ""}
      </div>
      {project.indicators.length === 0 ? (
        <div style={{ opacity: 0.5 }}>No indicators computed yet. Run an analysis session to generate results.</div>
      ) : (
        project.indicators.map((ind, i) => (
          <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid var(--syn-overlay-whisper)" }}>
            {ind.kind}: {ind.value} {ind.unit ?? ""}
          </div>
        ))
      )}
    </div>
  );
}

