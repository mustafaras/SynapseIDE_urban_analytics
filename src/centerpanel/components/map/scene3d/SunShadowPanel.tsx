/**
 * SunShadowPanel — floating draggable sun/shadow analysis panel.
 *
 * mapTokens only. No Tailwind. No hard-coded hex colours.
 */
import React, { useCallback, useState } from "react";
import { AlertTriangle, BookOpen, Sun, X } from "lucide-react";
import {
  selectSunShadowScenarios,
  type ShadowEvidencePayload,
  useSunShadowStore,
} from "@/stores/useSunShadowStore";
import { computeSolarPosition } from "@/services/map/scene3d/SolarPositionService";
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
import { GisStatusChip } from "../ui/GisStatusChip";
import { GisSectionHeader } from "../ui/GisSectionHeader";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface SunShadowPanelProps {
  visible: boolean;
  onClose: () => void;
  presentation?: "floating" | "embedded";
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(
    "min(26rem, calc(100vw - 2rem))",
    MAP_Z_INDEX.symbologyPanel + 8,
  ),
  height: "min(42rem, calc(100% - 2rem))",
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
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  alignContent: "start",
};

const timelineGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const hourChipBase: React.CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const hourChipActiveStyle: React.CSSProperties = {
  ...hourChipBase,
  borderColor: MAP_COLORS.interaction,
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.interactionSubtle,
};

const solarInfoStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const keyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const valueStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const scenarioRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const scenarioRowActiveStyle: React.CSSProperties = {
  ...scenarioRowStyle,
  borderColor: MAP_COLORS.interaction,
  background: MAP_COLORS.interactionSubtle,
};

const coverageBarWrapStyle: React.CSSProperties = {
  height: "4px",
  background: MAP_COLORS.bgHeader,
  borderRadius: MAP_RADIUS.badge,
  overflow: "hidden",
};

const warningStyle: React.CSSProperties = {
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

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const publishButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: `1px solid ${MAP_COLORS.focus}`,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const closeButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.875rem",
  height: "1.875rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
  flexShrink: 0,
};

const coordTextStyle: React.CSSProperties = {
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: MAP_SPACING.zero,
  borderBottom: MAP_STROKES.none,
  background: MAP_COLORS.transparent,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatHour(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}${period}`;
}

function formatDeg(deg: number): string {
  return `${deg.toFixed(1)}°`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const SunShadowPanel: React.FC<SunShadowPanelProps> = ({
  visible,
  onClose,
  presentation = "floating",
}) => {
  const panelDrag = useDraggableMapPanel();
  const embedded = presentation === "embedded";

  const timelineHours = useSunShadowStore((s) => s.timelineHours);
  const activeHourIndex = useSunShadowStore((s) => s.activeHourIndex);
  const activeDateTime = useSunShadowStore((s) => s.activeDateTime);
  const latitude = useSunShadowStore((s) => s.latitude);
  const longitude = useSunShadowStore((s) => s.longitude);
  const scenarios = useSunShadowStore(selectSunShadowScenarios);
  const activeScenarioId = useSunShadowStore((s) => s.activeScenarioId);
  const setActiveHour = useSunShadowStore((s) => s.setActiveHour);
  const publishEvidence = useSunShadowStore((s) => s.publishEvidence);

  const [lastPublished, setLastPublished] = useState<ShadowEvidencePayload | null>(null);

  const solarPosition = computeSolarPosition(latitude, longitude, activeDateTime);
  const sunBelowHorizon = solarPosition.altitudeDeg <= 0;
  const scenarioBuildingCount = scenarios.reduce((count, scenario) => count + scenario.buildings.length, 0);

  const handlePublish = useCallback(() => {
    if (!activeScenarioId) return;
    try {
      const payload = publishEvidence(activeScenarioId);
      setLastPublished(payload);
    } catch {
      // scenario not ready
    }
  }, [publishEvidence, activeScenarioId]);

  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel={embedded ? undefined : "true"}
      style={embedded ? embeddedPanelStyle : { ...panelStyle, ...panelDrag.panelPositionStyle }}
      role={embedded ? "region" : "dialog"}
      aria-modal={embedded ? undefined : "false"}
      aria-label="Sun / Shadow Analysis"
      data-presentation={presentation}
      data-testid="sunshadow-panel"
    >
      {/* ---- Header ---- */}
      <header
        style={embedded ? headerStyle : { ...headerStyle, ...panelDrag.dragHandleStyle }}
        {...(embedded ? {} : panelDrag.dragHandleProps)}
      >
        <h2 style={titleStyle}>
          <Sun size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          Sun / Shadow Analysis
        </h2>
        <button
          type="button"
          style={closeButtonStyle}
          aria-label="Close sun/shadow panel"
          onClick={onClose}
          data-no-panel-drag="true"
        >
          <X size={MAP_ICON_SIZES.sm} />
        </button>
      </header>

      {/* ---- Body ---- */}
      <div style={embedded ? { ...bodyStyle, overflowY: "visible" } : bodyStyle}>
        <section style={assumptionPanelStyle} data-testid="sunshadow-urban-form-assumptions">
          <GisSectionHeader title="Urban form assumptions" level={4} compact separator={false} style={sectionHeaderStyle} />
          <div style={assumptionChipRowStyle}>
            <GisStatusChip
              status="caveat"
              label="Projected CRS: not used (EPSG:4326 display)"
              density="compact"
              data-testid="sunshadow-projected-crs"
            />
            <GisStatusChip
              status="demo"
              label="Vertical: assumed-flat-terrain"
              density="compact"
              data-testid="sunshadow-vertical-assumption"
            />
            <GisStatusChip
              status="demo"
              label="Runtime: demo-mode"
              density="compact"
              data-testid="sunshadow-runtime-assumption"
            />
            <GisStatusChip
              status={scenarioBuildingCount > 0 ? "ready" : "blocked"}
              label={`Buildings: ${scenarioBuildingCount} in scenarios`}
              density="compact"
              data-testid="sunshadow-building-prerequisite-chip"
            />
            <GisStatusChip
              status={activeScenarioId ? "generated" : "unknown"}
              label={activeScenarioId ? "Shadow evidence ready" : "Evidence: no active scenario"}
              density="compact"
              data-testid="sunshadow-evidence-state-chip"
            />
          </div>
          <div style={solarInfoStyle} data-testid="sunshadow-prerequisites">
            <span style={keyStyle}>Controls</span>
            <span style={valueStyle}>Sun path, scenario shadows, flat-terrain caveats, and evidence publishing.</span>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <GisSectionHeader title="Timeline" level={4} compact separator={false} style={sectionHeaderStyle} />
          <div style={{ ...timelineGridStyle, marginTop: MAP_SPACING.sm }}>
            {timelineHours.map((h, idx) => {
              const dt = new Date(activeDateTime);
              dt.setUTCHours(h, 0, 0, 0);
              const pos = computeSolarPosition(latitude, longitude, dt.toISOString());
              const isActive = idx === activeHourIndex;
              return (
                <button
                  key={h}
                  type="button"
                  data-testid="sunshadow-hour-chip"
                  data-hour={h}
                  style={isActive ? hourChipActiveStyle : hourChipBase}
                  aria-pressed={isActive}
                  aria-label={`Select ${formatHour(h)}, solar altitude ${formatDeg(pos.altitudeDeg)}`}
                  onClick={() => setActiveHour(idx)}
                  data-no-panel-drag="true"
                >
                  <span>{formatHour(h)}</span>
                  <span style={{ color: pos.altitudeDeg > 0 ? MAP_COLORS.textMuted : MAP_COLORS.error }}>
                    {formatDeg(pos.altitudeDeg)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Solar Position */}
        <section>
          <GisSectionHeader title="Solar Position" level={4} compact separator={false} style={sectionHeaderStyle} />
          {!!sunBelowHorizon && (
            <div style={{ ...warningStyle, marginTop: MAP_SPACING.sm }}>
              <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
              <span>Sun below horizon — no shadow cast</span>
            </div>
          )}
          <div style={{ ...solarInfoStyle, marginTop: MAP_SPACING.sm }}>
            <span style={keyStyle}>Altitude</span>
            <span style={valueStyle}>{formatDeg(solarPosition.altitudeDeg)}</span>
            <span style={keyStyle}>Azimuth</span>
            <span style={valueStyle}>{formatDeg(solarPosition.azimuthDeg)} (from N)</span>
            <span style={keyStyle}>Zenith</span>
            <span style={valueStyle}>{formatDeg(solarPosition.zenithDeg)}</span>
            <span style={keyStyle}>Time</span>
            <span style={valueStyle}>{activeDateTime.slice(11, 16)} UTC</span>
          </div>
        </section>

        {/* Scenarios */}
        <section>
          <GisSectionHeader title={`Scenarios (${scenarios.length})`} level={4} compact separator={false} style={sectionHeaderStyle} />
          {scenarios.length === 0 && (
            <p style={{ ...valueStyle, marginTop: MAP_SPACING.sm }}>
              No shadow scenarios; parcel and building prerequisites are listed above.
            </p>
          )}
          <div style={{ display: "grid", gap: MAP_SPACING.sm, marginTop: MAP_SPACING.sm }}>
            {scenarios.map((sc) => {
              const isActive = sc.id === activeScenarioId;
              const coverageRatio = sc.result?.shadowCoverageRatio ?? 0;
              const isBelowHorizon = sc.result?.sunBelowHorizon ?? false;
              return (
                <div
                  key={sc.id}
                  style={isActive ? scenarioRowActiveStyle : scenarioRowStyle}
                  data-testid="sunshadow-scenario-row"
                  data-scenario-id={sc.id}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.medium }}>
                      {sc.label}
                    </span>
                    {isBelowHorizon ? (
                      <span style={{ color: MAP_COLORS.error, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        below horizon
                      </span>
                    ) : (
                      <span style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {(coverageRatio * 100).toFixed(1)}% covered
                      </span>
                    )}
                  </div>
                  {!isBelowHorizon && (
                    <div style={coverageBarWrapStyle}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(coverageRatio * 100).toFixed(1)}%`,
                          background: MAP_COLORS.interaction,
                          borderRadius: MAP_RADIUS.badge,
                          transition: "width 0.2s ease",
                        }}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: MAP_SPACING.xs }}>
                    <span style={keyStyle}>Buildings</span>
                    <span style={valueStyle}>{sc.buildings.length}</span>
                    <span style={keyStyle}>Shadow area</span>
                    <span style={valueStyle}>{sc.result?.totalShadowAreaM2.toFixed(1) ?? "—"} m²</span>
                    <span style={keyStyle}>Parcel area</span>
                    <span style={valueStyle}>{sc.parcelAreaM2.toFixed(1)} m²</span>
                  </div>
                  <div style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                    mode: {sc.result?.assumptions.runtimeMode ?? "—"} ·{" "}
                    {sc.result?.assumptions.solarModel ?? "—"}
                  </div>
                  <div style={assumptionChipRowStyle} data-testid="sunshadow-scenario-chips">
                    <GisStatusChip
                      status={sc.result ? "generated" : "metadata-only"}
                      label={sc.result ? "Generated shadow" : "Metadata only"}
                      density="compact"
                    />
                    <GisStatusChip
                      status="demo"
                      label={`Vertical: ${sc.result?.assumptions.verticalDatum ?? "assumed-flat-terrain"}`}
                      density="compact"
                    />
                    <GisStatusChip
                      status={sc.geometrySource === "user-provided" ? "ready" : "synthetic"}
                      label={`Source: ${sc.geometrySource}`}
                      density="compact"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Last published evidence */}
        {lastPublished !== null && (
          <section>
            <GisSectionHeader title="Evidence Published" level={4} compact separator={false} style={sectionHeaderStyle} />
            <div style={{ ...solarInfoStyle, marginTop: MAP_SPACING.sm }}>
              <span style={keyStyle}>ID</span>
              <span style={valueStyle}>{lastPublished.evidenceId}</span>
              <span style={keyStyle}>Coverage</span>
              <span style={valueStyle}>
                {(lastPublished.shadowCoverageRatio * 100).toFixed(1)}%
              </span>
              <span style={keyStyle}>Mode</span>
              <span style={valueStyle}>{lastPublished.runtimeMode}</span>
            </div>
          </section>
        )}
      </div>

      {/* ---- Footer ---- */}
      <footer style={footerStyle}>
        <span style={coordTextStyle}>
          {latitude.toFixed(4)}°N {longitude.toFixed(4)}°E
        </span>
        <button
          type="button"
          data-testid="sunshadow-publish-btn"
          style={publishButtonStyle}
          aria-label="Publish shadow evidence artifact"
          onClick={handlePublish}
          disabled={!activeScenarioId}
          data-no-panel-drag="true"
        >
          <BookOpen size={MAP_ICON_SIZES.xs} aria-hidden="true" />
          Publish shadow evidence
        </button>
      </footer>
    </aside>
  );
};

export default SunShadowPanel;
