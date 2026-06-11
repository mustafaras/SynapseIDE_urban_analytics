/**
 * MassingScenarioPanel — floating draggable panel for massing scenario management.
 *
 * mapTokens only. No Tailwind. No hard-coded hex colours.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  Building2,
  CheckCircle2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { Feature, Polygon } from "geojson";
import {
  selectComparisonMetadata,
  selectMassingScenarios,
  useMassingStore,
} from "@/stores/useMassingStore";
import {
  selectAssignmentForParcel,
  selectZoningRules,
  useZoningStore,
} from "@/stores/useZoningStore";
import type { ZoningRule } from "@/services/map/zoning/ZoningRuleEngine";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisStatusChip } from "../ui/GisStatusChip";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface MassingScenarioPanelProps {
  visible: boolean;
  onClose: () => void;
  parcelId?: string | number | null;
  rule?: ZoningRule | null;
  parcel?: Feature<Polygon> | null;
  declaredCrs?: string | null;
  verticalDatum?: string | null;
  buildingPrerequisiteCount?: number;
  presentation?: "floating" | "embedded";
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(
    "min(28rem, calc(100vw - 2rem))",
    MAP_Z_INDEX.symbologyPanel + 6,
  ),
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

const embeddedPanelStyle: React.CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateRows: "auto auto auto",
  width: "100%",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
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

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: `1px solid ${MAP_COLORS.focus}`,
  color: MAP_COLORS.interaction,
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

const scenarioCardStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const scenarioCardActiveStyle: React.CSSProperties = {
  ...scenarioCardStyle,
  borderColor: MAP_COLORS.interaction,
  background: MAP_COLORS.interactionSubtle,
};

const badgeStyle = (compliant: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: compliant ? MAP_COLORS.success : MAP_COLORS.error,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
});

const comparisonTableStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const comparisonRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(6rem, auto) repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} 0`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  alignItems: "center",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const caveatStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  alignItems: "flex-start",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.warning,
  borderColor: MAP_COLORS.caveat,
};

const assumptionPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
};

const assumptionChipRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

/* ------------------------------------------------------------------ */
/*  Default add-scenario form values                                    */
/* ------------------------------------------------------------------ */

interface AddFormValues {
  floorCount: number;
  coverageRatio: number;
  buildingCount: number;
  isBaseline: boolean;
}

const DEFAULT_FORM: AddFormValues = {
  floorCount: 3,
  coverageRatio: 0.5,
  buildingCount: 1,
  isBaseline: false,
};

function isProjectedCrs(crs: string | null | undefined): boolean {
  if (!crs) return false;
  return !/(EPSG:4326|WGS\s*84|CRS84)/i.test(crs);
}

function projectedCrsStatus(crs: string | null | undefined): GisStatusKey {
  return isProjectedCrs(crs) ? "ready" : "blocked";
}

function projectedCrsLabel(crs: string | null | undefined): string {
  return `Projected CRS: ${crs && crs.trim() ? crs : "missing"}`;
}

function verticalAssumptionLabel(verticalDatum: string | null | undefined): string {
  return verticalDatum && verticalDatum.trim()
    ? `Vertical: ${verticalDatum}`
    : "Vertical: 3.3 m floor-height basis";
}

function findPolygonParcel(
  parcels: Array<Feature<Polygon>>,
  parcelId: string | number | null | undefined,
): Feature<Polygon> | null {
  if (parcelId == null) return null;
  return parcels.find((feature) =>
    String(feature.id ?? feature.properties?.id) === String(parcelId),
  ) ?? null;
}

function scenarioOutputStatus(hasAlternative: boolean, blocked: boolean): GisStatusKey {
  if (blocked) return "blocked";
  return hasAlternative ? "generated" : "metadata-only";
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const MassingScenarioPanel: React.FC<MassingScenarioPanelProps> = ({
  visible,
  onClose,
  parcelId,
  rule,
  parcel,
  declaredCrs,
  verticalDatum,
  buildingPrerequisiteCount = 0,
  presentation = "floating",
}) => {
  const panelDrag = useDraggableMapPanel();
  const embedded = presentation === "embedded";

  const scenarios = useMassingStore(selectMassingScenarios);
  const comparisonMetadata = useMassingStore(selectComparisonMetadata);
  const activeScenarioId = useMassingStore((s) => s.activeScenarioId);
  const addScenario = useMassingStore((s) => s.addScenario);
  const removeScenario = useMassingStore((s) => s.removeScenario);
  const setActiveScenario = useMassingStore((s) => s.setActiveScenario);
  const generateComparison = useMassingStore((s) => s.generateComparison);
  const zoningRules = useZoningStore(selectZoningRules);
  const activeParcels = useZoningStore((s) => s.activeParcels);
  const activeDeclaredCrs = useZoningStore((s) => s.activeDeclaredCrs);
  const currentAssignment = useZoningStore(
    selectAssignmentForParcel(parcelId ?? ""),
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddFormValues>(DEFAULT_FORM);
  const effectiveDeclaredCrs = declaredCrs ?? activeDeclaredCrs;
  const resolvedRule = useMemo(
    () => rule ?? zoningRules.find((candidate) => candidate.id === currentAssignment?.ruleId) ?? null,
    [currentAssignment?.ruleId, rule, zoningRules],
  );
  const activePolygonParcels = useMemo(
    () => activeParcels?.features.filter((feature): feature is Feature<Polygon> => feature.geometry.type === "Polygon") ?? [],
    [activeParcels?.features],
  );
  const resolvedParcel = useMemo(
    () => parcel ?? findPolygonParcel(activePolygonParcels, parcelId),
    [activePolygonParcels, parcel, parcelId],
  );

  const handleAdd = useCallback(() => {
    if (!parcelId) return;
    const params = {
      parcelId,
      buildingCount: form.buildingCount,
      floorCount: form.floorCount,
      coverageRatio: form.coverageRatio,
    };
    addScenario(
      parcelId,
      resolvedRule?.id ?? "unknown",
      params,
      undefined,
      form.isBaseline,
      resolvedParcel,
      resolvedRule,
      effectiveDeclaredCrs ?? null,
    );
    setForm(DEFAULT_FORM);
    setShowAddForm(false);
  }, [addScenario, parcelId, resolvedRule, form, resolvedParcel, effectiveDeclaredCrs]);

  const handleGenerateComparison = useCallback(() => {
    generateComparison();
  }, [generateComparison]);

  const scenariosWithAlternatives = scenarios.filter((s) => s.alternative !== null);
  const outputStatus: GisStatusKey =
    scenariosWithAlternatives.length > 0
      ? "generated"
      : scenarios.length > 0
        ? "metadata-only"
        : "unknown";

  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel={embedded ? undefined : "true"}
      style={embedded ? embeddedPanelStyle : { ...panelStyle, ...panelDrag.panelPositionStyle }}
      role={embedded ? "region" : "dialog"}
      aria-modal={embedded ? undefined : "false"}
      aria-label="Massing scenarios panel"
      data-presentation={presentation}
      data-testid="massing-scenario-panel"
    >
      {/* Header */}
      <header
        style={embedded ? headerStyle : { ...headerStyle, ...panelDrag.dragHandleStyle }}
        {...(embedded ? {} : panelDrag.dragHandleProps)}
      >
        <h3 style={titleStyle}>
          <Building2 size={MAP_ICON_SIZES.md} aria-hidden="true" />
          Massing Scenarios
        </h3>
        <button
          type="button"
          style={iconButtonStyle}
          onClick={onClose}
          aria-label="Close massing panel"
        >
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      {/* Body */}
      <div style={embedded ? { ...bodyStyle, overflowY: "visible" } : bodyStyle}>
        <section style={assumptionPanelStyle} data-testid="massing-urban-form-assumptions">
          <span style={sectionTitleStyle}>Urban form prerequisites</span>
          <div style={assumptionChipRowStyle}>
            <GisStatusChip
              status={parcelId != null ? "ready" : "blocked"}
              label={parcelId != null ? `Parcel: #${String(parcelId)}` : "Parcel: none selected"}
              density="compact"
              data-testid="massing-parcel-prerequisite-chip"
            />
            <GisStatusChip
              status={resolvedRule ? "ready" : "blocked"}
              label={resolvedRule ? `Rule: ${resolvedRule.zoneCode}` : "Rule: not assigned"}
              density="compact"
              data-testid="massing-rule-prerequisite-chip"
            />
            <GisStatusChip
              status={projectedCrsStatus(effectiveDeclaredCrs)}
              label={projectedCrsLabel(effectiveDeclaredCrs)}
              density="compact"
              data-testid="massing-projected-crs"
            />
            <GisStatusChip
              status={verticalDatum && verticalDatum.trim() ? "ready" : "caveat"}
              label={verticalAssumptionLabel(verticalDatum)}
              density="compact"
              data-testid="massing-vertical-assumption"
            />
            <GisStatusChip
              status={buildingPrerequisiteCount > 0 ? "ready" : "unknown"}
              label={`Buildings: ${buildingPrerequisiteCount} generated context`}
              density="compact"
              data-testid="massing-building-prerequisite-chip"
            />
            <GisStatusChip
              status={outputStatus}
              label={`Alternatives: ${scenariosWithAlternatives.length} generated`}
              density="compact"
              data-testid="massing-output-state-chip"
            />
          </div>
          <div style={rowStyle} data-testid="massing-prerequisites">
            <span style={keyStyle}>Controls</span>
            <span>Zoning envelope, massing alternatives, comparison evidence, and source-light scenario metadata.</span>
          </div>
        </section>

        {/* ── Section 1: Scenarios list ── */}
        <div style={{ display: "grid", gap: MAP_SPACING.sm }} data-testid="massing-scenarios-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={sectionTitleStyle}>Scenarios ({scenarios.length})</span>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setShowAddForm((v) => !v)}
              data-testid="massing-add-toggle"
              data-no-panel-drag="true"
            >
              <Plus size={MAP_ICON_SIZES.xs} aria-hidden="true" />
              Add
            </button>
          </div>

          {scenarios.length === 0 && (
            <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
              No massing alternatives yet. Parcel, rule, and projected CRS state are listed above.
            </span>
          )}

          {scenarios.map((sc) => {
            const isActive = sc.id === activeScenarioId;
            const alt = sc.alternative;
            return (
              <div
                key={sc.id}
                style={isActive ? scenarioCardActiveStyle : scenarioCardStyle}
                data-testid="massing-scenario-row"
                data-scenario-id={sc.id}
                onClick={() => setActiveScenario(sc.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveScenario(sc.id); }}
                aria-label={`Scenario: ${sc.label}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
                  <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                    {!!sc.isBaseline && (
                      <span style={{ color: MAP_COLORS.interaction, marginRight: MAP_SPACING.xs }}>
                        [B]
                      </span>
                    )}
                    {sc.label}
                  </span>
                  <button
                    type="button"
                    style={{ ...iconButtonStyle, color: MAP_COLORS.error }}
                    onClick={(e) => { e.stopPropagation(); removeScenario(sc.id); }}
                    aria-label={`Remove scenario ${sc.label}`}
                    data-testid={`massing-remove-${sc.id}`}
                    data-no-panel-drag="true"
                  >
                    <Trash2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                  </button>
                </div>

                <div style={assumptionChipRowStyle} data-testid="massing-scenario-chips">
                  <GisStatusChip
                    status={sc.isBaseline ? "ready" : "generated"}
                    label={sc.isBaseline ? "Baseline" : "Scenario"}
                    density="compact"
                  />
                  <GisStatusChip
                    status={scenarioOutputStatus(Boolean(alt), alt?.envelopeResult.crsResult.blocked ?? false)}
                    label={alt ? (alt.envelopeResult.crsResult.blocked ? "CRS blocked" : "Generated massing") : "Metadata only"}
                    density="compact"
                  />
                  <GisStatusChip
                    status={alt?.compliant ? "ready" : alt ? "caveat" : "unknown"}
                    label={alt ? (alt.compliant ? "Compliant" : "Caveat") : "Awaiting envelope"}
                    density="compact"
                  />
                </div>

                {alt ? (
                  <div style={{ display: "flex", gap: MAP_SPACING.md, flexWrap: "wrap", color: MAP_COLORS.textSecondary }}>
                    <span>FAR {alt.achievedFAR.toFixed(2)}</span>
                    <span>Cov {(alt.achievedCoverage * 100).toFixed(1)}%</span>
                    <span>
                      <span style={badgeStyle(alt.compliant)}>
                        {alt.compliant
                          ? <><CheckCircle2 size={MAP_ICON_SIZES.xs} aria-hidden="true" /> Compliant</>
                          : <><AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" /> Non-compliant</>
                        }
                      </span>
                    </span>
                  </div>
                ) : (
                  <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                    Alternative not generated — provide parcel + rule.
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Section 2: Add Scenario form ── */}
        {!!showAddForm && (
          <div
            style={{ display: "grid", gap: MAP_SPACING.sm, padding: MAP_SPACING.sm, border: MAP_STROKES.hairlineSubtle, borderRadius: MAP_RADIUS.sm }}
            data-testid="massing-add-form"
          >
            <span style={sectionTitleStyle}>Add Scenario</span>

            {!parcelId && (
              <div style={caveatStyle}>
                <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                <span>No parcel selected; the scenario can only stay metadata-only.</span>
              </div>
            )}

            {!!parcelId && (!resolvedParcel || !resolvedRule || !isProjectedCrs(effectiveDeclaredCrs)) && (
              <div style={caveatStyle}>
                <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                <span>Generated massing requires parcel geometry, assigned rule, and projected CRS.</span>
              </div>
            )}

            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Floors (1–20)</span>
              <input
                style={inputStyle}
                type="number"
                min={1}
                max={20}
                value={form.floorCount}
                onChange={(e) => setForm((v) => ({ ...v, floorCount: Number(e.target.value) }))}
                data-testid="massing-field-floorCount"
                data-no-panel-drag="true"
              />
            </label>

            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Coverage ratio (0.1–0.9)</span>
              <input
                style={inputStyle}
                type="number"
                min={0.1}
                max={0.9}
                step={0.05}
                value={form.coverageRatio}
                onChange={(e) => setForm((v) => ({ ...v, coverageRatio: Number(e.target.value) }))}
                data-testid="massing-field-coverageRatio"
                data-no-panel-drag="true"
              />
            </label>

            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Building count (1–10)</span>
              <input
                style={inputStyle}
                type="number"
                min={1}
                max={10}
                value={form.buildingCount}
                onChange={(e) => setForm((v) => ({ ...v, buildingCount: Number(e.target.value) }))}
                data-testid="massing-field-buildingCount"
                data-no-panel-drag="true"
              />
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.sm, fontSize: MAP_TYPOGRAPHY.fontSize.xs, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={form.isBaseline}
                onChange={(e) => setForm((v) => ({ ...v, isBaseline: e.target.checked }))}
                data-testid="massing-field-isBaseline"
                data-no-panel-drag="true"
              />
              <span style={keyStyle}>Baseline scenario</span>
            </label>

            <div style={{ display: "flex", gap: MAP_SPACING.sm }}>
              <button
                type="button"
                style={buttonStyle}
                onClick={handleAdd}
                disabled={!parcelId}
                data-testid="massing-add-submit"
                data-no-panel-drag="true"
              >
                <Plus size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                Add alternative
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, color: MAP_COLORS.textMuted }}
                onClick={() => setShowAddForm(false)}
                data-no-panel-drag="true"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Section 3: Comparison (≥2 scenarios) ── */}
        {scenariosWithAlternatives.length >= 2 && (
          <div
            style={{ display: "grid", gap: MAP_SPACING.sm }}
            data-testid="massing-comparison-section"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...sectionTitleStyle, display: "flex", alignItems: "center", gap: MAP_SPACING.xs }}>
                <BarChart2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                Comparison
              </span>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={handleGenerateComparison}
                data-testid="massing-generate-comparison"
                data-no-panel-drag="true"
              >
                <CheckCircle2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                Generate comparison evidence
              </button>
            </div>

            {/* Side-by-side metrics table */}
            <div style={comparisonTableStyle} data-testid="massing-comparison-table">
              {/* Header */}
              <div style={{ ...comparisonRowStyle, borderBottom: MAP_STROKES.hairlineStrong }}>
                <span style={keyStyle}>Metric</span>
                {scenariosWithAlternatives.slice(0, 2).map((sc) => (
                  <span key={sc.id} style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sc.isBaseline ? "[B] " : ""}{sc.label}
                  </span>
                ))}
              </div>

              {/* Achieved FAR */}
              <div style={comparisonRowStyle}>
                <span style={keyStyle}>FAR</span>
                {scenariosWithAlternatives.slice(0, 2).map((sc) => (
                  <span
                    key={sc.id}
                    style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, color: sc.alternative?.farCompliant ? MAP_COLORS.text : MAP_COLORS.error }}
                    data-testid={`massing-cmp-far-${sc.id}`}
                  >
                    {sc.alternative?.achievedFAR.toFixed(2) ?? "—"}
                  </span>
                ))}
              </div>

              {/* Achieved Coverage */}
              <div style={comparisonRowStyle}>
                <span style={keyStyle}>Coverage</span>
                {scenariosWithAlternatives.slice(0, 2).map((sc) => (
                  <span
                    key={sc.id}
                    style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, color: sc.alternative?.coverageCompliant ? MAP_COLORS.text : MAP_COLORS.error }}
                    data-testid={`massing-cmp-cov-${sc.id}`}
                  >
                    {sc.alternative != null ? `${(sc.alternative.achievedCoverage * 100).toFixed(1)}%` : "—"}
                  </span>
                ))}
              </div>

              {/* Height */}
              <div style={comparisonRowStyle}>
                <span style={keyStyle}>Height</span>
                {scenariosWithAlternatives.slice(0, 2).map((sc) => (
                  <span
                    key={sc.id}
                    style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, color: sc.alternative?.heightCompliant ? MAP_COLORS.text : MAP_COLORS.error }}
                    data-testid={`massing-cmp-height-${sc.id}`}
                  >
                    {sc.alternative != null ? `${sc.alternative.maxHeightMetres.toFixed(1)} m` : "—"}
                  </span>
                ))}
              </div>

              {/* Compliance */}
              <div style={comparisonRowStyle}>
                <span style={keyStyle}>Compliant</span>
                {scenariosWithAlternatives.slice(0, 2).map((sc) => (
                  <span key={sc.id} style={badgeStyle(sc.alternative?.compliant ?? false)} data-testid={`massing-cmp-compliant-${sc.id}`}>
                    {sc.alternative?.compliant
                      ? <><CheckCircle2 size={MAP_ICON_SIZES.xs} aria-hidden="true" /> Yes</>
                      : <><AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" /> No</>
                    }
                  </span>
                ))}
              </div>
            </div>

            {/* Comparison metadata summary */}
            {!!comparisonMetadata && (
              <div
                style={{ display: "grid", gap: MAP_SPACING.xs, padding: MAP_SPACING.sm, border: MAP_STROKES.hairlineSubtle, borderRadius: MAP_RADIUS.sm }}
                data-testid="massing-comparison-metadata"
              >
                <div style={rowStyle}>
                  <span style={keyStyle}>Comparison ID</span>
                  <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {comparisonMetadata.comparisonId}
                  </span>
                </div>
                <div style={rowStyle}>
                  <span style={keyStyle}>Created</span>
                  <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                    {new Date(comparisonMetadata.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
          {scenarios.length} scenario(s)
          {parcelId != null && ` — Parcel #${String(parcelId)}`}
        </span>
      </footer>
    </aside>
  );
};
