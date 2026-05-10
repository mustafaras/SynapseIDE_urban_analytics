/**
 * UrbanContextStrip — project-level context strip.
 *
 * Renders KvPill rows for the active project, switchable across five info modes:
 *   overview | data | indicators | flags | session
 */

import React from "react";
import styles from "./urban-context-strip.module.css";

/* ------------------------------------------------------------------ */
/*  Shared pill types                                                 */
/* ------------------------------------------------------------------ */

export type Severity = "ok" | "med" | "high" | "info";

export interface KvPill {
  id: string;
  label: string;
  value?: string;
  unit?: string;
  tooltip?: string;
  severity?: Severity;
  onClick?: () => void;
  href?: string;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type UrbanInfoMode = "overview" | "data" | "indicators" | "flags" | "session";

export interface UrbanContextStripProps {
  infoMode: UrbanInfoMode;
  onSelectInfoMode: (mode: UrbanInfoMode) => void;

  overviewPills: KvPill[];
  dataPills: KvPill[];
  indicatorPills: KvPill[];
  flagPills: KvPill[];
  sessionPills: KvPill[];

  actionRow?: React.ReactNode;
  stickyEnabled?: boolean;
  tone?: "default" | "in-header";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const MODE_LABEL: Record<UrbanInfoMode, string> = {
  overview: "Overview",
  data: "Data",
  indicators: "Indicators",
  flags: "Flags",
  session: "Session",
};

const MODES: UrbanInfoMode[] = ["overview", "data", "indicators", "flags", "session"];

export default function UrbanContextStrip(props: UrbanContextStripProps) {
  const {
    infoMode,
    onSelectInfoMode,
    overviewPills,
    dataPills,
    indicatorPills,
    flagPills,
    sessionPills,
    actionRow,
    stickyEnabled,
    tone = "default",
  } = props;

  const pills =
    infoMode === "overview"    ? overviewPills
    : infoMode === "data"      ? dataPills
    : infoMode === "indicators"? indicatorPills
    : infoMode === "flags"     ? flagPills
    : sessionPills;

  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  function onTabsKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const curIdx = MODES.indexOf(infoMode);
    let nextIdx = curIdx;
    if (e.key === "ArrowLeft") nextIdx = (curIdx - 1 + MODES.length) % MODES.length;
    if (e.key === "ArrowRight") nextIdx = (curIdx + 1) % MODES.length;
    const btn = tabRefs.current[nextIdx];
    if (btn) { try { btn.focus(); } catch {} }
    onSelectInfoMode(MODES[nextIdx]);
  }

  return (
    <div
      className={styles.stripWrap}
      role="region"
      aria-label="Urban project snapshot"
      data-sticky={stickyEnabled ? "on" : "off"}
      data-tone={tone}
    >
      {/* Mode tabs */}
      <div
        className={styles.tabRow}
        role="tablist"
        aria-label="Snapshot modes"
        onKeyDown={onTabsKeyDown}
        tabIndex={0}
      >
        {MODES.map((mode, i) => (
          <button
            key={mode}
            role="tab"
            aria-selected={infoMode === mode}
            tabIndex={infoMode === mode ? 0 : -1}
            className={styles.tabPill}
            onClick={() => onSelectInfoMode(mode)}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
          >
            {MODE_LABEL[mode]}
          </button>
        ))}
      </div>

      {/* Pill row */}
      <div className={`${styles.kvRow} syn-scrollbar-hidden`} aria-live="polite">
        {pills.map((p) => {
          const aria = `${p.label}: ${p.value ?? "—"}${p.unit ? ` ${p.unit}` : ""}`;
          const inner = (
            <>
              <span className={styles.kvLabel}>{p.label}</span>
              <span className={styles.kvValue}>
                {p.value ?? "—"}{p.unit ? ` ${p.unit}` : ""}
              </span>
            </>
          );
          const sev = p.severity || "info";

          if (p.href) {
            return (
              <a
                key={p.id}
                href={p.href}
                className={styles.metricPill}
                data-severity={sev}
                title={p.tooltip}
                aria-label={aria}
                target="_blank"
                rel="noreferrer"
              >
                {inner}
              </a>
            );
          }
          if (p.onClick) {
            return (
              <button
                key={p.id}
                onClick={p.onClick}
                className={styles.metricPill}
                data-severity={sev}
                title={p.tooltip}
                aria-label={aria}
                type="button"
              >
                {inner}
              </button>
            );
          }
          return (
            <span
              key={p.id}
              className={styles.metricPill}
              data-severity={sev}
              title={p.tooltip}
              aria-label={aria}
            >
              {inner}
            </span>
          );
        })}
        {pills.length === 0 && (
          <span className={styles.metricPill} data-severity="info" aria-label="No data">
            <span className={styles.kvLabel}>—</span>
            <span className={styles.kvValue}>No data for this mode</span>
          </span>
        )}
      </div>

      {actionRow ? <div className={styles.actionRow}>{actionRow}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pill builder helpers                                               */
/* ------------------------------------------------------------------ */

/** Build overview pills from project metadata. */
export function buildOverviewPills(project: {
  name?: string;
  scale?: string;
  area_km2?: number;
  population?: number;
}): KvPill[] {
  const pills: KvPill[] = [];
  if (project.name) pills.push({ id: "ov-name", label: "Study Area", value: project.name });
  if (project.scale) pills.push({ id: "ov-scale", label: "Scale", value: project.scale });
  if (project.area_km2 != null) pills.push({ id: "ov-area", label: "Area", value: project.area_km2.toLocaleString(), unit: "km²" });
  if (project.population != null) pills.push({ id: "ov-pop", label: "Population", value: project.population.toLocaleString() });
  return pills;
}

/** Build data inventory pills. */
export function buildDataPills(data: {
  datasetCount?: number;
  formats?: Record<string, number>;
  totalSizeMB?: number;
}): KvPill[] {
  const pills: KvPill[] = [];
  if (data.datasetCount != null) pills.push({ id: "dt-count", label: "Datasets", value: String(data.datasetCount) });
  if (data.formats) {
    const top = Object.entries(data.formats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k, v]) => `${k}(${v})`)
      .join(", ");
    pills.push({ id: "dt-formats", label: "Formats", value: top });
  }
  if (data.totalSizeMB != null) pills.push({ id: "dt-size", label: "Total Size", value: data.totalSizeMB.toFixed(1), unit: "MB" });
  return pills;
}

/** Build indicator pills with severity coloring. */
export function buildIndicatorPills(indicators: Array<{
  id: string;
  label: string;
  value: number;
  unit?: string;
  band?: "good" | "warning" | "critical";
}>): KvPill[] {
  return indicators.map((ind) => {
    const sev: Severity =
      ind.band === "good" ? "ok"
      : ind.band === "warning" ? "med"
      : ind.band === "critical" ? "high"
      : "info";
    return {
      id: `ind-${ind.id}`,
      label: ind.label,
      value: ind.value.toFixed(2),
      severity: sev,
      ...(ind.unit ? { unit: ind.unit } : {}),
    };
  });
}

/** Build data quality flag pills. */
export function buildFlagPills(flags: Array<{
  id: string;
  label: string;
  severity: Severity;
  detail?: string;
}>): KvPill[] {
  return flags.map((f) => ({
    id: `flag-${f.id}`,
    label: f.label,
    value: f.detail ?? "detected",
    severity: f.severity,
    ...(f.detail ? { tooltip: f.detail } : {}),
  }));
}

/** Build session status pills. */
export function buildSessionPills(session: {
  name?: string;
  elapsedMin?: number;
  workflowStatus?: string;
  activeFlow?: string;
}): KvPill[] {
  const pills: KvPill[] = [];
  if (session.name) pills.push({ id: "ss-name", label: "Session", value: session.name });
  if (session.elapsedMin != null) pills.push({ id: "ss-time", label: "Elapsed", value: String(session.elapsedMin), unit: "min" });
  if (session.workflowStatus) pills.push({ id: "ss-status", label: "Workflow", value: session.workflowStatus });
  if (session.activeFlow) pills.push({ id: "ss-flow", label: "Active Flow", value: session.activeFlow });
  return pills;
}
