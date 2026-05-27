/**
 * ZoningRulesPanel — rule table editor + parcel assignment + metrics display.
 * mapTokens only, no Tailwind, no hard-coded hex.
 */
import React, { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2, X, Layers } from "lucide-react";
import {
  selectAssignmentForParcel,
  selectZoningAssignments,
  selectZoningRules,
  useZoningStore,
} from "@/stores/useZoningStore";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";
import type { ZoningRuleInput } from "@/services/map/zoning/ZoningRuleEngine";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface ZoningRulesPanelProps {
  visible: boolean;
  onClose: () => void;
  /** Currently selected parcel ID (from 2D map selection). */
  selectedParcelId?: string | number | null;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(28rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 6),
  height: "min(44rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.lg,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  alignContent: "start",
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
  alignItems: "center",
};

const keyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const iconButtonStyle: React.CSSProperties = {
  width: "1.875rem",
  height: "1.875rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const ruleCardStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const ruleCardSelectedStyle: React.CSSProperties = {
  ...ruleCardStyle,
  borderColor: MAP_COLORS.interaction,
  background: MAP_COLORS.interactionSubtle,
};

const caveatStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  alignItems: "flex-start",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  color: MAP_COLORS.warning,
  borderColor: MAP_COLORS.caveat,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: MAP_SPACING.sm,
};

const metricCellStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
};

/* ------------------------------------------------------------------ */
/*  Default new-rule form values                                        */
/* ------------------------------------------------------------------ */

const DEFAULT_RULE: ZoningRuleInput = {
  name: "",
  zoneCode: "",
  maxFAR: 2.0,
  maxCoverageRatio: 0.6,
  maxHeightMetres: 15,
  minSetbackMetres: 3,
  minParcelAreaM2: 100,
  notes: undefined,
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const ZoningRulesPanel: React.FC<ZoningRulesPanelProps> = ({
  visible,
  onClose,
  selectedParcelId,
}) => {
  const panelDrag = useDraggableMapPanel();

  const rules = useZoningStore(selectZoningRules);
  const assignments = useZoningStore(selectZoningAssignments);
  const addRule = useZoningStore((s) => s.addRule);
  const removeRule = useZoningStore((s) => s.removeRule);
  const assignRule = useZoningStore((s) => s.assignRule);
  const unassignRule = useZoningStore((s) => s.unassignRule);

  const currentAssignment = useZoningStore(
    selectAssignmentForParcel(selectedParcelId ?? ""),
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [formValues, setFormValues] = useState<ZoningRuleInput>(DEFAULT_RULE);

  const handleAddRule = useCallback(() => {
    if (!formValues.name || !formValues.zoneCode) return;
    addRule(formValues);
    setFormValues(DEFAULT_RULE);
    setShowAddForm(false);
  }, [addRule, formValues]);

  const handleAssign = useCallback(
    (ruleId: string) => {
      if (selectedParcelId == null) return;
      assignRule(selectedParcelId, ruleId);
    },
    [assignRule, selectedParcelId],
  );

  const handleUnassign = useCallback(() => {
    if (selectedParcelId == null) return;
    unassignRule(selectedParcelId);
  }, [unassignRule, selectedParcelId]);

  const metrics = currentAssignment?.metrics ?? null;

  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel="true"
      style={{ ...panelStyle, ...panelDrag.panelPositionStyle }}
      role="dialog"
      aria-modal="false"
      aria-label="Zoning rules panel"
      data-testid="zoning-rules-panel"
    >
      {/* Header */}
      <header style={{ ...headerStyle, ...panelDrag.dragHandleStyle }} {...panelDrag.dragHandleProps}>
        <h3 style={titleStyle}>
          <Layers size={MAP_ICON_SIZES.md} aria-hidden="true" />
          Zoning Rules
        </h3>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close zoning panel">
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      {/* Body */}
      <div style={bodyStyle}>

        {/* Selected parcel + metrics */}
        {selectedParcelId != null && (
          <div style={{ display: "grid", gap: MAP_SPACING.sm }} data-testid="zoning-parcel-metrics">
            <span style={sectionTitleStyle}>
              Parcel #{String(selectedParcelId)}
            </span>

            {metrics ? (
              <>
                {/* CRS label */}
                <div style={rowStyle} data-testid="zoning-crs-label">
                  <span style={keyStyle}>Execution CRS</span>
                  <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                    {metrics.crsResult.executionCrs ?? "blocked"}
                  </span>
                </div>

                {metrics.crsResult.blocked ? (
                  <div style={caveatStyle}>
                    <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                    <span>{metrics.caveats[0]}</span>
                  </div>
                ) : (
                  <div style={metricGridStyle} data-testid="zoning-metrics-grid">
                    <div style={metricCellStyle}>
                      <span style={keyStyle}>Parcel area</span>
                      <span>{metrics.parcelAreaM2.toFixed(1)} m²</span>
                    </div>
                    <div style={metricCellStyle}>
                      <span style={keyStyle}>Existing FAR</span>
                      <span
                        data-testid="zoning-metric-far"
                        style={{ color: metrics.farExceeded ? MAP_COLORS.error : MAP_COLORS.text }}
                      >
                        {metrics.existingFAR?.toFixed(2) ?? "—"}
                        {metrics.farExceeded && " ⚠"}
                      </span>
                    </div>
                    <div style={metricCellStyle}>
                      <span style={keyStyle}>Coverage</span>
                      <span
                        data-testid="zoning-metric-coverage"
                        style={{ color: metrics.coverageExceeded ? MAP_COLORS.error : MAP_COLORS.text }}
                      >
                        {metrics.existingCoverage != null
                          ? `${(metrics.existingCoverage * 100).toFixed(1)}%`
                          : "—"}
                        {metrics.coverageExceeded && " ⚠"}
                      </span>
                    </div>
                    <div style={metricCellStyle}>
                      <span style={keyStyle}>Max floor area</span>
                      <span>{metrics.capacityMaxFloorAreaM2?.toFixed(0) ?? "—"} m²</span>
                    </div>
                  </div>
                )}

                {metrics.caveats.length > 0 && !metrics.crsResult.blocked && (
                  <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
                    {metrics.caveats.map((c, i) => (
                      <div key={i} style={caveatStyle}>
                        <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentAssignment && (
                  <button
                    type="button"
                    style={{ ...buttonStyle, color: MAP_COLORS.textMuted }}
                    onClick={handleUnassign}
                    data-testid="zoning-unassign"
                  >
                    <X size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                    Remove assignment
                  </button>
                )}
              </>
            ) : (
              <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
                {rules.length === 0
                  ? "Add a rule below, then assign it to this parcel."
                  : "Select a rule below to assign to this parcel."}
              </span>
            )}
          </div>
        )}

        {/* Rules table */}
        <div style={{ display: "grid", gap: MAP_SPACING.sm }} data-testid="zoning-rules-table">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={sectionTitleStyle}>Rules ({rules.length})</span>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setShowAddForm((v) => !v)}
              data-testid="zoning-add-rule-toggle"
            >
              <Plus size={MAP_ICON_SIZES.xs} aria-hidden="true" />
              Add rule
            </button>
          </div>

          {/* Add-rule form */}
          {showAddForm && (
            <div
              style={{ display: "grid", gap: MAP_SPACING.sm, padding: MAP_SPACING.sm, border: MAP_STROKES.hairlineSubtle, borderRadius: MAP_RADIUS.sm }}
              data-testid="zoning-add-rule-form"
            >
              <span style={sectionTitleStyle}>New rule</span>
              {(
                [
                  { key: "name" as const, label: "Name", type: "text" },
                  { key: "zoneCode" as const, label: "Zone code", type: "text" },
                  { key: "maxFAR" as const, label: "Max FAR", type: "number" },
                  { key: "maxCoverageRatio" as const, label: "Max coverage (0–1)", type: "number" },
                  { key: "maxHeightMetres" as const, label: "Max height (m)", type: "number" },
                  { key: "minSetbackMetres" as const, label: "Min setback (m)", type: "number" },
                  { key: "minParcelAreaM2" as const, label: "Min parcel area (m²)", type: "number" },
                ] as const
              ).map(({ key, label, type }) => (
                <label key={key} style={{ display: "grid", gap: MAP_SPACING.xs }}>
                  <span style={keyStyle}>{label}</span>
                  <input
                    style={inputStyle}
                    type={type}
                    value={String(formValues[key] ?? "")}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        [key]: type === "number" ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    data-testid={`zoning-rule-field-${key}`}
                  />
                </label>
              ))}
              <div style={{ display: "flex", gap: MAP_SPACING.sm }}>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={handleAddRule}
                  disabled={!formValues.name || !formValues.zoneCode}
                  data-testid="zoning-save-rule"
                >
                  <CheckCircle2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                  Save rule
                </button>
                <button
                  type="button"
                  style={{ ...buttonStyle, color: MAP_COLORS.textMuted }}
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rules list */}
          {rules.length === 0 ? (
            <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
              No rules yet.
            </span>
          ) : (
            rules.map((rule) => {
              const isAssigned = currentAssignment?.ruleId === rule.id;
              return (
                <div
                  key={rule.id}
                  style={isAssigned ? ruleCardSelectedStyle : ruleCardStyle}
                  data-testid={`zoning-rule-card-${rule.id}`}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                      {rule.zoneCode} — {rule.name}
                    </span>
                    <div style={{ display: "flex", gap: MAP_SPACING.xs }}>
                      {selectedParcelId != null && (
                        <button
                          type="button"
                          style={{ ...buttonStyle, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}
                          onClick={() => handleAssign(rule.id)}
                          data-testid={`zoning-assign-rule-${rule.id}`}
                          aria-label={`Assign ${rule.zoneCode} to selected parcel`}
                        >
                          {isAssigned ? "Reassign" : "Assign"}
                        </button>
                      )}
                      <button
                        type="button"
                        style={{ ...iconButtonStyle, color: MAP_COLORS.error }}
                        onClick={() => removeRule(rule.id)}
                        data-testid={`zoning-remove-rule-${rule.id}`}
                        aria-label={`Remove rule ${rule.name}`}
                      >
                        <Trash2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: MAP_SPACING.md, flexWrap: "wrap", color: MAP_COLORS.textMuted }}>
                    <span>FAR ≤ {rule.maxFAR}</span>
                    <span>Coverage ≤ {(rule.maxCoverageRatio * 100).toFixed(0)}%</span>
                    <span>H ≤ {rule.maxHeightMetres} m</span>
                  </div>
                  {rule.notes && (
                    <span style={{ color: MAP_COLORS.textMuted }}>{rule.notes}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Assignment summary */}
        {assignments.length > 0 && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="zoning-assignments-summary">
            <span style={sectionTitleStyle}>Assignments ({assignments.length})</span>
            {assignments.slice(0, 8).map((a) => {
              const rule = rules.find((r) => r.id === a.ruleId);
              return (
                <div key={a.id} style={rowStyle}>
                  <span style={keyStyle}>#{String(a.parcelFeatureId)}</span>
                  <span>{rule?.zoneCode ?? "unknown"} — {rule?.name ?? a.ruleId}</span>
                </div>
              );
            })}
            {assignments.length > 8 && (
              <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                + {assignments.length - 8} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
          {assignments.length} assignment(s) — {rules.length} rule(s)
        </span>
      </footer>
    </aside>
  );
};
