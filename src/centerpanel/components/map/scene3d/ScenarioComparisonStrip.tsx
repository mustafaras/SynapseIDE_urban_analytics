/**
 * Prompt 34 — 3D block + scenario interaction design.
 *
 * Scenario-comparison strip + sun-shadow timeline.
 * Shows massing scenarios side by side with generated-vs-real visual distinction,
 * sun-shadow timeline hours, and vertical assumption/CRS/QA badges.
 *
 * GENERATED massing: dashed border + orange chip — never styled as real geometry.
 * ACTUAL buildings: solid border + neutral chip.
 */
import React, { useCallback } from "react";
import { AlertTriangle, Building2, Clock, Sun } from "lucide-react";
import { selectActiveScenarioId, selectMassingScenarios, useMassingStore } from "@/stores/useMassingStore";
import {
  selectActiveHour,
  selectSunShadowScenarios,
  useSunShadowStore,
} from "@/stores/useSunShadowStore";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisSectionHeader } from "../ui/GisSectionHeader";

const DEFAULT_TIMELINE_HOURS = [6, 8, 10, 12, 14, 16, 18] as const;

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(42rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 8),
  height: "auto",
  maxHeight: "min(28rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.lg,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const closeButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  padding: MAP_SPACING.xs,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  lineHeight: 1,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  color: MAP_COLORS.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: MAP_SPACING.xs,
};

/* Timeline */

const timelineRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "3px",
  flexWrap: "wrap",
};

function getHourChipStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: `2px ${MAP_SPACING.sm}`,
    borderRadius: MAP_RADIUS.full,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    background: active ? MAP_COLORS.interaction : MAP_COLORS.bgHeader,
    color: active ? MAP_COLORS.bgPanel : MAP_COLORS.textSecondary,
    border: `1px solid ${active ? MAP_COLORS.interaction : MAP_COLORS.hairline}`,
    cursor: "pointer",
    transition: MAP_TRANSITIONS.fast,
    fontWeight: active ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
  };
}

/* Scenario cards */

const scenarioGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))",
  gap: MAP_SPACING.sm,
};

function getScenarioCardStyle(isGenerated: boolean): React.CSSProperties {
  return {
    display: "grid",
    gap: MAP_SPACING.xs,
    padding: MAP_SPACING.sm,
    borderRadius: MAP_RADIUS.md,
    background: MAP_COLORS.bgHeader,
    border: isGenerated
      ? MAP_STROKES.dashedStrong
      : MAP_STROKES.hairline,
    position: "relative" as const,
  };
}

const geometryBadgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  padding: `1px ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.xs,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: "0.04em",
};

const generatedBadgeStyle: React.CSSProperties = {
  ...geometryBadgeBase,
  background: MAP_COLORS.caveat,
  color: MAP_COLORS.caveatText,
};


const metricRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
};

const metricValueStyle: React.CSSProperties = {
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  color: MAP_COLORS.text,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const complianceBadgeStyle = (ok: boolean): React.CSSProperties => ({
  display: "inline-block",
  padding: `0 ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.xs,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  background: ok ? MAP_COLORS.success : MAP_COLORS.error,
  color: MAP_COLORS.bgPanel,
});

/* Shadow scenario chips */

const shadowChipStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgHeader,
  border: MAP_STROKES.hairlineSubtle,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

/* Footer assumptions bar */

const footerStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: MAP_SPACING.xs,
  paddingTop: MAP_SPACING.sm,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const assumptionChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  padding: `1px ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.xs,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  background: MAP_COLORS.bgHeader,
  color: MAP_COLORS.textMuted,
  border: MAP_STROKES.hairlineSubtle,
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface ScenarioComparisonStripProps {
  visible: boolean;
  onClose?: () => void;
  presentation?: "floating" | "embedded";
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const ScenarioComparisonStrip: React.FC<ScenarioComparisonStripProps> = ({
  visible,
  onClose,
  presentation = "floating",
}) => {
  const massingScenarios = useMassingStore(selectMassingScenarios);
  const activeScenarioId = useMassingStore(selectActiveScenarioId);
  const setActiveScenario = useMassingStore((s) => s.setActiveScenario);

  const shadowScenarios = useSunShadowStore(selectSunShadowScenarios);
  const activeHour = useSunShadowStore(selectActiveHour);
  const timelineHours = useSunShadowStore((s) => s.timelineHours);
  const setActiveHour = useSunShadowStore((s) => s.setActiveHour);

  const panelDrag = useDraggableMapPanel();
  const embedded = presentation === "embedded";

  const hasMassing = massingScenarios.length > 0;
  const hasShadow = shadowScenarios.length > 0;
  const visibleTimelineHours = timelineHours.length > 0 ? timelineHours : [...DEFAULT_TIMELINE_HOURS];
  const hasTimeline = visibleTimelineHours.length > 0;

  const handleSetHour = useCallback(
    (hourValue: number) => {
      const idx = timelineHours.indexOf(hourValue);
      setActiveHour(idx >= 0 ? idx : visibleTimelineHours.indexOf(hourValue));
    },
    [timelineHours, visibleTimelineHours, setActiveHour],
  );

  if (!visible) return null;

  const resolvedPanelStyle: React.CSSProperties = embedded
    ? {
        position: "relative",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        width: "100%",
        border: MAP_STROKES.hairlineSubtle,
        borderRadius: MAP_RADIUS.sm,
        background: MAP_COLORS.bgWorkspace,
        color: MAP_COLORS.text,
        overflow: "hidden",
      }
    : { ...panelStyle, ...panelDrag.panelPositionStyle };

  return (
    <div
      data-testid="scenario-comparison-strip"
      data-presentation={presentation}
      data-draggable-map-panel={embedded ? undefined : "true"}
      style={resolvedPanelStyle}
    >
      {/* Header — uses GisSectionHeader primitive (Prompt 36) */}
      <GisSectionHeader
        title="Scenario comparison"
        level={3}
        separator
        style={embedded ? undefined : panelDrag.dragHandleStyle}
        {...(embedded ? {} : panelDrag.dragHandleProps)}
        {...(embedded
          ? {}
          : {
              actions: (
                <button
                  type="button"
                  style={closeButtonStyle}
                  aria-label="Close scenario comparison strip"
                  onClick={onClose}
                >
                  ×
                </button>
              ),
            })}
        data-testid="scenario-comparison-header"
      />
      {/* onMouseDown on a wrapper for drag — must surround the header */}
      {!embedded && (
        <div
          data-map-drag-handle
          style={{ position: "absolute", top: 0, left: 0, right: "2.5rem", height: "2.25rem", ...panelDrag.dragHandleStyle }}
          {...panelDrag.dragHandleProps}
          aria-hidden
        />
      )}

      {/* Body */}
      <div style={bodyStyle}>

        {/* Sun-shadow timeline */}
        {!!hasTimeline && (
          <section aria-label="Sun/shadow timeline">
            <p style={sectionLabelStyle}>
              <Sun size={10} aria-hidden style={{ display: "inline", marginRight: 4 }} />
              Sun-shadow timeline
            </p>
            <div style={timelineRowStyle}>
              {visibleTimelineHours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-testid="timeline-hour-chip"
                  data-hour={h}
                  style={getHourChipStyle(h === activeHour)}
                  aria-pressed={h === activeHour}
                  aria-label={`${h}:00`}
                  onClick={() => handleSetHour(h)}
                >
                  {h}:00
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Massing scenarios */}
        {!!hasMassing && (
          <section aria-label="Massing scenarios">
            <p style={sectionLabelStyle}>
              <Building2 size={10} aria-hidden style={{ display: "inline", marginRight: 4 }} />
              Massing scenarios
            </p>
            <div style={scenarioGridStyle}>
              {massingScenarios.map((sc) => {
                const alt = sc.alternative;
                const isActive = sc.id === activeScenarioId;
                return (
                  <div
                    key={sc.id}
                    data-testid="comparison-scenario-card"
                    data-generated="true"
                    style={{
                      ...getScenarioCardStyle(true),
                      outline: isActive ? `2px solid ${MAP_COLORS.interaction}` : "none",
                      outlineOffset: "2px",
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    aria-label={`Massing scenario: ${sc.label}`}
                    onClick={() => setActiveScenario(sc.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveScenario(sc.id);
                      }
                    }}
                  >
                    {/* Generated badge — distinct from real geometry */}
                    <span
                      style={generatedBadgeStyle}
                      data-testid="generated-geometry-badge"
                      title="This geometry was algorithmically generated — not surveyed or observed"
                    >
                      GENERATED
                    </span>

                    <div style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, color: MAP_COLORS.text }}>
                      {sc.label}
                    </div>

                    {!!alt && <>
                        <div style={metricRowStyle}>
                          <span>FAR</span>
                          <span style={metricValueStyle}>{alt.achievedFAR.toFixed(2)}</span>
                        </div>
                        <div style={metricRowStyle}>
                          <span>Coverage</span>
                          <span style={metricValueStyle}>{(alt.achievedCoverage * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ display: "flex", gap: MAP_SPACING.xs, flexWrap: "wrap" }}>
                          <span style={complianceBadgeStyle(alt.farCompliant)}>
                            FAR {alt.farCompliant ? "✓" : "✗"}
                          </span>
                          <span style={complianceBadgeStyle(alt.coverageCompliant)}>
                            Cov {alt.coverageCompliant ? "✓" : "✗"}
                          </span>
                          <span style={complianceBadgeStyle(alt.heightCompliant)}>
                            Ht {alt.heightCompliant ? "✓" : "✗"}
                          </span>
                        </div>
                      </>}

                    {!alt && (
                      <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
                        No data — assign a parcel + rule first
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Shadow scenarios */}
        {!!hasShadow && (
          <section aria-label="Shadow scenarios">
            <p style={sectionLabelStyle}>
              <Clock size={10} aria-hidden style={{ display: "inline", marginRight: 4 }} />
              Shadow analyses
            </p>
            <div style={{ display: "grid", gap: "3px" }}>
              {shadowScenarios.map((sc) => (
                <div key={sc.id} data-testid="shadow-scenario-row" style={shadowChipStyle}>
                  <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.text }}>
                    {sc.label}
                  </span>
                  {!!sc.result && (
                    <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textSecondary }}>
                      {(sc.result.shadowCoverageRatio * 100).toFixed(0)}% shadow
                    </span>
                  )}
                  {!!sc.result?.sunBelowHorizon && (
                    <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
                      (sun below horizon)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!hasMassing && !hasShadow && !hasTimeline && (
          <p style={{ fontSize: MAP_TYPOGRAPHY.fontSize.sm, color: MAP_COLORS.textMuted, margin: 0 }}>
            No scenarios yet. Open the Massing or Sun/Shadow panels to create them.
          </p>
        )}

        {/* Footer: assumptions + CRS + QA badges */}
        <div style={footerStyle}>
          <span style={assumptionChipStyle}>
            <AlertTriangle size={9} aria-hidden />
            Flat terrain assumed
          </span>
          <span style={assumptionChipStyle}>
            Demo runtimeMode
          </span>
          <span style={assumptionChipStyle}>
            Projected CRS required
          </span>
          <span style={assumptionChipStyle}>
            Generated ≠ surveyed
          </span>
        </div>
      </div>
    </div>
  );
};
