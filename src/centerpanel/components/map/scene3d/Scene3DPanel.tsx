import React, { useCallback } from "react";
import { AlertTriangle, Box, ChevronDown, Eye, Layers } from "lucide-react";
import {
  selectBuildingConfig,
  selectExtrusionAnalysis,
  selectInspectorEntries,
  selectScene3DCaveats,
  selectScene3DMode,
  selectScene3DSelected,
  useScene3DStore,
} from "@/stores/useScene3DStore";
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
import type { Scene3DRuntimeMode } from "@/services/map/scene3d/Map3DSceneController";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface Scene3DPanelProps {
  visible: boolean;
  onClose: () => void;
  onModeChange?: (mode: Scene3DRuntimeMode) => void;
}

/* ------------------------------------------------------------------ */
/*  Styles (mapTokens only — no Tailwind, no hard-coded hex)           */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(24rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 5),
  height: "min(36rem, calc(100% - 2rem))",
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

const modeSwitchStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  flexWrap: "wrap",
};

const modeButtonBase: React.CSSProperties = {
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

const modeButtonActiveStyle: React.CSSProperties = {
  ...modeButtonBase,
  background: MAP_COLORS.interactionSubtle,
  borderColor: MAP_COLORS.interaction,
  color: MAP_COLORS.text,
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

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const footerBtnStyle: React.CSSProperties = {
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

const RUNTIME_MODES: { id: Scene3DRuntimeMode; label: string }[] = [
  { id: "2d", label: "2D" },
  { id: "2.5d", label: "2.5D" },
  { id: "3d", label: "3D" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const Scene3DPanel: React.FC<Scene3DPanelProps> = ({ visible, onClose, onModeChange }) => {
  const panelDrag = useDraggableMapPanel();

  const runtimeMode = useScene3DStore(selectScene3DMode);
  const analysis = useScene3DStore(selectExtrusionAnalysis);
  const buildingConfig = useScene3DStore(selectBuildingConfig);
  const selectedIds = useScene3DStore(selectScene3DSelected);
  const caveats = useScene3DStore(selectScene3DCaveats);
  const inspectorEntries = useScene3DStore(selectInspectorEntries);

  const setRuntimeMode = useScene3DStore((s) => s.setRuntimeMode);
  const publishSceneMetadata = useScene3DStore((s) => s.publishSceneMetadata);
  const setHeightFieldOverride = useScene3DStore((s) => s.setHeightFieldOverride);
  const heightFieldOverride = useScene3DStore((s) => s.heightFieldOverride);
  const metersPerLevelOverride = useScene3DStore((s) => s.metersPerLevelOverride);
  const setMetersPerLevelOverride = useScene3DStore((s) => s.setMetersPerLevelOverride);

  const handleModeChange = useCallback(
    (mode: Scene3DRuntimeMode) => {
      setRuntimeMode(mode);
      onModeChange?.(mode);
    },
    [setRuntimeMode, onModeChange],
  );

  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel="true"
      style={{ ...panelStyle, ...panelDrag.panelPositionStyle }}
      role="dialog"
      aria-modal="false"
      aria-label="3D scene panel"
      data-testid="scene3d-panel"
    >
      {/* Header */}
      <header style={{ ...headerStyle, ...panelDrag.dragHandleStyle }} {...panelDrag.dragHandleProps}>
        <h3 style={titleStyle}>
          <Box size={MAP_ICON_SIZES.md} aria-hidden="true" />
          3D Scene
        </h3>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close 3D panel">
          <ChevronDown size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      {/* Body */}
      <div style={bodyStyle}>
        {/* Mode switcher */}
        <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
          <span style={sectionTitleStyle}>View mode</span>
          <div style={modeSwitchStyle} role="group" aria-label="3D view mode">
            {RUNTIME_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                style={runtimeMode === m.id ? modeButtonActiveStyle : modeButtonBase}
                onClick={() => handleModeChange(m.id)}
                aria-pressed={runtimeMode === m.id}
                data-testid={`scene3d-mode-${m.id}`}
              >
                <Eye size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Extrusion config */}
        {(runtimeMode === "2.5d" || runtimeMode === "3d") && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-extrusion-config">
            <span style={sectionTitleStyle}>Extrusion</span>
            <div style={rowStyle}>
              <span style={keyStyle}>Height field</span>
              <span>{analysis?.heightField ?? "auto"}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>Floor field</span>
              <span>{analysis?.floorField ?? "auto"}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>Can extrude</span>
              <span data-testid="scene3d-can-extrude">
                {analysis?.canExtrude ? "yes" : "no — add height data"}
              </span>
            </div>

            {/* Height field override */}
            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Override height field</span>
              <input
                style={{ ...selectStyle }}
                value={heightFieldOverride ?? ""}
                placeholder="e.g. height_m"
                onChange={(e) => setHeightFieldOverride(e.target.value || null)}
                data-testid="scene3d-height-field-input"
              />
            </label>

            {/* Meters per level */}
            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Metres / floor</span>
              <select
                style={selectStyle}
                value={metersPerLevelOverride}
                onChange={(e) => setMetersPerLevelOverride(Number(e.target.value))}
                data-testid="scene3d-meters-per-floor"
              >
                {[2.5, 3, 3.5, 4].map((v) => (
                  <option key={v} value={v}>{v} m</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Caveats */}
        {caveats.length > 0 && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-caveats">
            <span style={sectionTitleStyle}>Caveats</span>
            {caveats.map((caveat, i) => (
              <div key={i} style={caveatStyle}>
                <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                <span>{caveat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Building inspector */}
        {buildingConfig && inspectorEntries.length > 0 && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-inspector">
            <span style={sectionTitleStyle}>
              Building inspector — {inspectorEntries.length} feature(s),{" "}
              {selectedIds.length} selected
            </span>
            <div style={{ display: "grid", gap: MAP_SPACING.xs, maxHeight: "12rem", overflowY: "auto" }}>
              {inspectorEntries.slice(0, 20).map((entry) => (
                <div
                  key={String(entry.featureId)}
                  data-testid={`scene3d-building-${String(entry.featureId)}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0, 1fr) auto",
                    gap: MAP_SPACING.sm,
                    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
                    border: MAP_STROKES.hairlineSubtle,
                    borderRadius: MAP_RADIUS.sm,
                    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                    background: entry.isSelected ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
                  }}
                >
                  <Layers size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                  <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                    #{String(entry.featureId)}
                  </span>
                  <span style={{ color: MAP_COLORS.textMuted }}>
                    {entry.heightMetres.toFixed(1)} m
                  </span>
                </div>
              ))}
              {inspectorEntries.length > 20 && (
                <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                  + {inspectorEntries.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <button
          type="button"
          style={footerBtnStyle}
          onClick={publishSceneMetadata}
          data-testid="scene3d-publish"
          aria-label="Publish 3D scene metadata"
        >
          Publish metadata
        </button>
      </footer>
    </aside>
  );
};
