import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { FeatureCollection, GeoJsonProperties, Polygon } from "geojson";
import { AlertTriangle, Box, ChevronDown, Eye, Layers } from "lucide-react";
import {
  selectBuildingConfig,
  selectExtrusionAnalysis,
  selectInspectorEntries,
  selectScene3DCityModelSourceHandle,
  selectScene3DTerrainSourceHandle,
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
  resolveMapPaintColor,
} from "../mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";
import type { Scene3DRuntimeMode } from "@/services/map/scene3d/Map3DSceneController";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";

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

const sceneCanvasStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "2.8 / 1",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
  display: "block",
};

function handleRuntimeLabel(handle: SourceHandle | null): string {
  if (!handle?.scene3d) return "none";
  if (handle.scene3d.runtimeMode === "metadata-only") return "metadata-only";
  return handle.scene3d.runtimeMode;
}

function verticalDatumLabel(handle: SourceHandle | null): string {
  const datum = handle?.scene3d?.verticalDatum;
  if (!datum) return "not recorded";
  if (datum.status === "known" && datum.value) return datum.value;
  return `unknown (${datum.source})`;
}

function sceneBounds(collection: FeatureCollection<Polygon, GeoJsonProperties>): [number, number, number, number] | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const feature of collection.features) {
    const ring = feature.geometry.coordinates[0];
    if (!ring) continue;
    for (const [x, y] of ring) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return minX === Number.POSITIVE_INFINITY ? null : [minX, minY, maxX, maxY];
}

function featureHeight(properties: GeoJsonProperties): number {
  const candidates = [
    properties?.measuredHeight,
    properties?.height,
    properties?.height_m,
    Number(properties?.surface_max_z) - Number(properties?.surface_min_z),
  ];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 6;
}

function drawTerrainScenePreview(
  canvas: HTMLCanvasElement,
  collection: FeatureCollection<Polygon, GeoJsonProperties> | null,
  cityModelHandle: SourceHandle | null,
  terrainHandle: SourceHandle | null,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = canvas.width;
  const height = canvas.height;
  const bg = resolveMapPaintColor(MAP_COLORS.bgWorkspace);
  const terrain = resolveMapPaintColor(MAP_COLORS.interactionSubtle);
  const terrainStroke = resolveMapPaintColor(MAP_COLORS.interaction);
  const building = resolveMapPaintColor(MAP_COLORS.caveatText);
  const roof = resolveMapPaintColor(MAP_COLORS.text);
  const muted = resolveMapPaintColor(MAP_COLORS.textMuted);

  context.clearRect(0, 0, width, height);
  context.fillStyle = bg;
  context.fillRect(0, 0, width, height);

  const baseY = Math.round(height * 0.78);
  context.beginPath();
  context.moveTo(0, baseY);
  for (let x = 0; x <= width; x += 24) {
    const rise = terrainHandle ? Math.sin(x / 45) * 10 + Math.cos(x / 70) * 6 : 0;
    context.lineTo(x, baseY - rise);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fillStyle = terrain;
  context.fill();
  context.strokeStyle = terrainStroke;
  context.lineWidth = 2;
  context.stroke();

  if (collection && cityModelHandle) {
    const bounds = sceneBounds(collection);
    const visibleFeatures = collection.features.slice(0, 28);
    visibleFeatures.forEach((feature, index) => {
      const ring = feature.geometry.coordinates[0];
      const first = ring?.[0];
      const xRatio = bounds && first
        ? (first[0] - bounds[0]) / Math.max(bounds[2] - bounds[0], Number.EPSILON)
        : index / Math.max(visibleFeatures.length - 1, 1);
      const x = 18 + xRatio * (width - 40);
      const terrainBase = Number(feature.properties?.scene3d_base_elevation_m);
      const terrainLift = Number.isFinite(terrainBase) ? Math.max(0, terrainBase % 28) : 0;
      const buildingHeight = Math.min(height * 0.54, Math.max(12, featureHeight(feature.properties) * 1.7));
      const y = baseY - terrainLift;
      const w = 9 + (index % 4) * 2;
      context.fillStyle = building;
      context.fillRect(x, y - buildingHeight, w, buildingHeight);
      context.fillStyle = roof;
      context.fillRect(x, y - buildingHeight - 3, w, 3);
    });
  }

  context.fillStyle = muted;
  context.font = "11px ui-monospace, SFMono-Regular, Consolas, monospace";
  const label = terrainHandle ? "terrain-grounded" : "flat-ground caveat";
  context.fillText(label, 10, 18);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const Scene3DPanel: React.FC<Scene3DPanelProps> = ({ visible, onClose, onModeChange }) => {
  const panelDrag = useDraggableMapPanel();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const runtimeMode = useScene3DStore(selectScene3DMode);
  const analysis = useScene3DStore(selectExtrusionAnalysis);
  const buildingConfig = useScene3DStore(selectBuildingConfig);
  const cityModelHandle = useScene3DStore(selectScene3DCityModelSourceHandle);
  const terrainHandle = useScene3DStore(selectScene3DTerrainSourceHandle);
  const activeCollection = useScene3DStore((s) => s.activeCollection);
  const selectedIds = useScene3DStore(selectScene3DSelected);
  const inspectorEntries = useScene3DStore(selectInspectorEntries);

  const setRuntimeMode = useScene3DStore((s) => s.setRuntimeMode);
  const publishSceneMetadata = useScene3DStore((s) => s.publishSceneMetadata);
  const setHeightFieldOverride = useScene3DStore((s) => s.setHeightFieldOverride);
  const heightFieldOverride = useScene3DStore((s) => s.heightFieldOverride);
  const metersPerLevelOverride = useScene3DStore((s) => s.metersPerLevelOverride);
  const setMetersPerLevelOverride = useScene3DStore((s) => s.setMetersPerLevelOverride);

  const caveats = useMemo(
    () => [
      ...(analysis?.caveats ?? []),
      ...(cityModelHandle?.caveats ?? []),
      ...(terrainHandle?.caveats ?? []),
    ],
    [analysis?.caveats, cityModelHandle?.caveats, terrainHandle?.caveats],
  );

  const handleModeChange = useCallback(
    (mode: Scene3DRuntimeMode) => {
      setRuntimeMode(mode);
      onModeChange?.(mode);
    },
    [setRuntimeMode, onModeChange],
  );

  useEffect(() => {
    if (!visible || !canvasRef.current || runtimeMode === "2d") return;
    drawTerrainScenePreview(
      canvasRef.current,
      activeCollection as FeatureCollection<Polygon, GeoJsonProperties> | null,
      cityModelHandle,
      terrainHandle,
    );
  }, [activeCollection, cityModelHandle, runtimeMode, terrainHandle, visible]);

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

        {(runtimeMode === "2.5d" || runtimeMode === "3d") && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-source-handle">
            <span style={sectionTitleStyle}>Scene source</span>
            <canvas
              ref={canvasRef}
              width={520}
              height={186}
              style={sceneCanvasStyle}
              data-testid="scene3d-terrain-canvas"
              aria-label="Terrain grounded 3D scene preview"
            />
            <div style={rowStyle}>
              <span style={keyStyle}>City model</span>
              <span>{cityModelHandle?.format ?? "building extrusion"} · {handleRuntimeLabel(cityModelHandle)}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>Terrain</span>
              <span>{terrainHandle?.format ?? "flat ground"} · {handleRuntimeLabel(terrainHandle)}</span>
            </div>
            <div style={rowStyle} data-testid="scene3d-vertical-datum">
              <span style={keyStyle}>Vertical datum</span>
              <span>{verticalDatumLabel(terrainHandle ?? cityModelHandle)}</span>
            </div>
          </div>
        )}

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
