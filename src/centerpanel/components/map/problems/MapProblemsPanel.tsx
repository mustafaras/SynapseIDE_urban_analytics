import React from "react";
import {
  MAP_PROBLEM_SEVERITY_LABELS,
  getMapProblemKindLabel,
  type MapProblemRow,
  type MapProblemSeverity,
  type MapProblemsModel,
} from "./mapProblemsModel";
import { MAP_COLORS, MAP_STROKES } from "../mapTokens";

export interface MapProblemsPanelProps {
  model: MapProblemsModel;
  compact?: boolean;
  onProblemAction?: (problem: MapProblemRow) => void;
}

const severityTone: Record<MapProblemSeverity, { border: string; background: string; text: string }> = {
  blocker: {
    border: "rgba(248, 113, 113, 0.76)",
    background: "rgba(127, 29, 29, 0.34)",
    text: "#fecaca",
  },
  error: {
    border: "rgba(251, 146, 60, 0.72)",
    background: "rgba(124, 45, 18, 0.32)",
    text: "#fed7aa",
  },
  warning: {
    border: "rgba(245, 158, 11, 0.68)",
    background: "rgba(120, 53, 15, 0.28)",
    text: "#fde68a",
  },
  info: {
    border: "rgba(125, 211, 252, 0.55)",
    background: "rgba(12, 74, 110, 0.24)",
    text: "#bae6fd",
  },
};

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: 12,
  lineHeight: 1.35,
  fontWeight: 800,
  letterSpacing: 0,
};

const subtitleStyle: React.CSSProperties = {
  margin: "3px 0 0",
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  lineHeight: 1.45,
};

const countStripStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 6,
};

const groupStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const groupHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const emptyStyle: React.CSSProperties = {
  border: MAP_STROKES.panel,
  borderRadius: 8,
  padding: "12px 14px",
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  lineHeight: 1.5,
  background: "rgba(15, 23, 42, 0.32)",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "88px minmax(0, 1fr)",
  gap: 10,
  border: MAP_STROKES.panel,
  borderRadius: 8,
  padding: 10,
  background: "rgba(2, 6, 23, 0.38)",
};

const rowCompactStyle: React.CSSProperties = {
  gridTemplateColumns: "1fr",
  gap: 8,
};

const metaColumnStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: 6,
};

const contentColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 7,
  minWidth: 0,
};

const rowTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: 11,
  lineHeight: 1.35,
  fontWeight: 800,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const reasonStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  lineHeight: 1.45,
  overflowWrap: "anywhere",
};

const actionBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const actionLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  lineHeight: 1.4,
};

const actionButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(245, 158, 11, 0.55)",
  borderRadius: 6,
  background: "rgba(245, 158, 11, 0.12)",
  color: MAP_COLORS.interaction,
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1,
  minHeight: 26,
  padding: "0 9px",
  cursor: "pointer",
  outline: "none",
};

function severityChipStyle(severity: MapProblemSeverity): React.CSSProperties {
  const tone = severityTone[severity];
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    minHeight: 22,
    padding: "0 7px",
    border: `1px solid ${tone.border}`,
    borderRadius: 999,
    color: tone.text,
    background: tone.background,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.25,
    textTransform: "uppercase",
  };
}

function CountPill(props: { severity: MapProblemSeverity; count: number }): React.ReactElement | null {
  if (props.count === 0) return null;
  const tone = severityTone[props.severity];
  return (
    <span
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 999,
        color: tone.text,
        background: tone.background,
        padding: "4px 7px",
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {props.count} {MAP_PROBLEM_SEVERITY_LABELS[props.severity]}
    </span>
  );
}

function MapProblemItem(props: {
  problem: MapProblemRow;
  compact: boolean;
  onProblemAction?: (problem: MapProblemRow) => void;
}): React.ReactElement {
  const actionTarget = props.problem.actionTarget;
  return (
    <article style={{ ...rowStyle, ...(props.compact ? rowCompactStyle : undefined) }}>
      <div style={metaColumnStyle}>
        <span style={severityChipStyle(props.problem.severity)}>{MAP_PROBLEM_SEVERITY_LABELS[props.problem.severity]}</span>
        <span style={labelStyle}>{getMapProblemKindLabel(props.problem.kind)}</span>
      </div>
      <div style={contentColumnStyle}>
        <div>
          <h5 style={rowTitleStyle}>{props.problem.title}</h5>
          <div style={labelStyle}>Affected: {props.problem.affectedLabel}</div>
          {props.problem.sourceLabel ? <div style={labelStyle}>Source: {props.problem.sourceLabel}</div> : null}
        </div>
        <p style={reasonStyle}>{props.problem.reason}</p>
        <div style={actionBarStyle}>
          <span style={actionLabelStyle}>Action target: {actionTarget.label}</span>
          {props.onProblemAction ? (
            <button
              type="button"
              style={actionButtonStyle}
              onClick={() => props.onProblemAction?.(props.problem)}
              onFocus={(event) => { event.currentTarget.style.boxShadow = `0 0 0 2px ${MAP_COLORS.focus}`; }}
              onBlur={(event) => { event.currentTarget.style.boxShadow = "none"; }}
              aria-label={`${actionTarget.label}: ${props.problem.title}`}
            >
              {actionTarget.label}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function MapProblemsPanel(props: MapProblemsPanelProps): React.ReactElement {
  const hasProblems = props.model.rows.length > 0;
  return (
    <section style={panelStyle} aria-label="Map QA problems">
      <div style={headerStyle}>
        <div>
          <h4 style={titleStyle}>Problems</h4>
          <p style={subtitleStyle}>
            Scientific blockers, warnings, caveats, and mode labels promoted from QA into an action list.
          </p>
        </div>
        <div style={countStripStyle} aria-label="Problem counts by severity">
          <CountPill severity="blocker" count={props.model.counts.blocker} />
          <CountPill severity="error" count={props.model.counts.error} />
          <CountPill severity="warning" count={props.model.counts.warning} />
          <CountPill severity="info" count={props.model.counts.info} />
        </div>
      </div>
      {hasProblems ? props.model.groups.map((group) => (
        <div key={group.severity} style={groupStyle}>
          <div style={groupHeaderStyle}>
            <span>{group.label}</span>
            <span>{group.rows.length}</span>
          </div>
          {group.rows.map((problem) => (
            <MapProblemItem
              key={problem.id}
              problem={problem}
              compact={props.compact === true}
              onProblemAction={props.onProblemAction}
            />
          ))}
        </div>
      )) : (
        <div style={emptyStyle}>No QA problems are currently reported for the visible map stack.</div>
      )}
    </section>
  );
}