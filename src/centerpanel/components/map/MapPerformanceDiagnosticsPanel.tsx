import React from "react";
import { Activity, AlertTriangle, BarChart3, Gauge, X } from "lucide-react";
import type { MapPerformanceDiagnosticsSummary } from "@/services/map/MapPerformanceDiagnostics";
import {
  formatPerformanceBytes,
  formatPerformanceDuration,
} from "@/services/map/MapPerformanceDiagnostics";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./useDraggableMapPanel";

export interface MapPerformanceDiagnosticsPanelProps {
  visible: boolean;
  diagnostics: MapPerformanceDiagnosticsSummary;
  onClose: () => void;
}

export interface MapPerformanceBudgetBannerProps {
  diagnostics: MapPerformanceDiagnosticsSummary;
  rightInset?: number;
}

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(31rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 12),
  height: "min(40rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
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

const subtitleStyle: React.CSSProperties = {
  marginTop: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
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

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const statCellStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.md,
  borderRight: MAP_STROKES.hairlineSubtle,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

const statLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const statValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
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

const warningPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.caveatText}`,
  background: MAP_COLORS.caveat,
};

const warningRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const layerTableStyle: React.CSSProperties = {
  display: "grid",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  overflow: "hidden",
};

const layerRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(9rem, 1.25fr) minmax(5rem, 0.7fr) minmax(5rem, 0.7fr) minmax(6rem, 0.7fr)",
  gap: MAP_SPACING.sm,
  alignItems: "center",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderTop: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const layerHeaderRowStyle: React.CSSProperties = {
  ...layerRowStyle,
  borderTop: MAP_STROKES.none,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.textMuted,
  textTransform: "uppercase",
};

const modeBadgeBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  padding: "0.125rem 0.375rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const bannerStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.md,
  width: "min(27rem, calc(100% - 2rem))",
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.caveatText}`,
  background: MAP_COLORS.caveat,
  color: MAP_COLORS.textSecondary,
  zIndex: MAP_Z_INDEX.sidebar + 6,
  boxShadow: MAP_SHADOWS.panel,
};

function formatCount(value: number): string {
  return value.toLocaleString();
}

function modeLabel(mode: MapPerformanceDiagnosticsSummary["renderMode"]): string {
  return mode === "preview" ? "Bounded preview" : "Full render";
}

function modeBadgeStyle(mode: MapPerformanceDiagnosticsSummary["renderMode"]): React.CSSProperties {
  return {
    ...modeBadgeBaseStyle,
    color: mode === "preview" ? MAP_COLORS.caveatText : MAP_COLORS.success,
    borderColor: mode === "preview" ? MAP_COLORS.caveatText : MAP_COLORS.success,
    background: mode === "preview" ? MAP_COLORS.caveat : MAP_COLORS.selectedSubtle,
  };
}

function formatCacheHitRate(diagnostics: MapPerformanceDiagnosticsSummary): string {
  const cache = diagnostics.reprojectionCache;
  const attempts = cache.hits + cache.misses;
  if (attempts === 0) return "No runs";
  return `${Math.round(cache.hitRate * 100)}% (${formatCount(cache.hits)}/${formatCount(attempts)})`;
}

export const MapPerformanceBudgetBanner: React.FC<MapPerformanceBudgetBannerProps> = ({
  diagnostics,
  rightInset = 16,
}) => {
  if (diagnostics.previewLayerCount === 0) return null;
  const previewFeatureCount = diagnostics.layers
    .filter((layer) => layer.mode === "preview")
    .reduce((sum, layer) => sum + (layer.previewFeatureCount ?? 0), 0);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="map-performance-bounded-banner"
      style={{ ...bannerStyle, right: rightInset }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.xs, color: MAP_COLORS.caveatText, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
        <AlertTriangle size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        Bounded preview mode
      </div>
      <div style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>
        {formatCount(diagnostics.previewLayerCount)} over-budget layer{diagnostics.previewLayerCount === 1 ? "" : "s"} are drawing a bounded visual preview. Full source data remains available for export and worker-backed analysis.
      </div>
      <div style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
        Source {formatCount(diagnostics.totalFeatureCount)} features / preview {formatCount(previewFeatureCount)} features / budget {formatCount(diagnostics.budgets.renderFeatureCount)}.
      </div>
    </div>
  );
};

export const MapPerformanceDiagnosticsPanel: React.FC<MapPerformanceDiagnosticsPanelProps> = ({
  visible,
  diagnostics,
  onClose,
}) => {
  const panelDrag = useDraggableMapPanel();
  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel="true"
      style={{ ...panelStyle, ...panelDrag.panelPositionStyle }}
      role="dialog"
      aria-modal="false"
      aria-label="Map performance diagnostics"
      data-testid="map-performance-diagnostics"
    >
      <header style={{ ...headerStyle, ...panelDrag.dragHandleStyle }} {...panelDrag.dragHandleProps}>
        <div>
          <h3 style={titleStyle}>
            <BarChart3 size={MAP_ICON_SIZES.md} aria-hidden="true" />
            Render diagnostics
          </h3>
          <div style={subtitleStyle}>
            Live layer budgets, worker transfer totals, app-code render sync, and export timing.
          </div>
        </div>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close performance diagnostics">
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      <div style={summaryGridStyle}>
        <StatCell label="Mode" value={modeLabel(diagnostics.renderMode)} tone={diagnostics.renderMode === "preview" ? "warning" : "success"} />
        <StatCell label="Layers" value={`${formatCount(diagnostics.visibleLayerCount)}/${formatCount(diagnostics.layerCount)}`} />
        <StatCell label="Features" value={formatCount(diagnostics.totalFeatureCount)} />
        <StatCell label="Coordinates" value={formatCount(diagnostics.totalCoordinateCount)} />
        <StatCell label="Render memory" value={formatPerformanceBytes(diagnostics.estimatedRenderBytes)} />
        <StatCell label="Worker transfer" value={formatPerformanceBytes(diagnostics.workerTransferBytes)} />
        <StatCell label="Layer sync" value={formatPerformanceDuration(diagnostics.lastRenderTiming?.durationMs)} />
        <StatCell label="Last export" value={formatPerformanceDuration(diagnostics.lastExportTiming?.durationMs)} />
        <StatCell label="Preview layers" value={formatCount(diagnostics.previewLayerCount)} tone={diagnostics.previewLayerCount > 0 ? "warning" : "success"} />
        <StatCell label="Reproj cache" value={formatCacheHitRate(diagnostics)} tone={diagnostics.reprojectionCache.hits > 0 ? "success" : "neutral"} />
      </div>

      <div style={bodyStyle}>
        <section style={{ display: "grid", gap: MAP_SPACING.sm }}>
          <div style={sectionTitleStyle}>Budget Status</div>
          <div style={{ display: "flex", gap: MAP_SPACING.sm, alignItems: "center", flexWrap: "wrap" }}>
            <span style={modeBadgeStyle(diagnostics.renderMode)}>
              <Gauge size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              {modeLabel(diagnostics.renderMode)}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
              Feature budget {formatCount(diagnostics.budgets.renderFeatureCount)} / coordinate budget {formatCount(diagnostics.budgets.renderCoordinateCount)} / memory budget {formatPerformanceBytes(diagnostics.budgets.renderMemoryBytes)}.
            </span>
            {diagnostics.reprojectionCache.layerCount > 0 ? (
              <span
                data-testid="map-performance-reprojection-cache-line"
                style={{ color: MAP_COLORS.textSecondary, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}
              >
                Reprojection cache {formatCount(diagnostics.reprojectionCache.entries)}/{formatCount(diagnostics.reprojectionCache.maxEntries)} entries / {formatCount(diagnostics.reprojectionCache.hits)} hits / {formatCount(diagnostics.reprojectionCache.misses)} misses / {formatCount(diagnostics.reprojectionCache.evictions)} evictions.
              </span>
            ) : null}
          </div>
          {diagnostics.warnings.length > 0 ? (
            <div style={warningPanelStyle} data-testid="map-performance-warnings">
              {diagnostics.warnings.map((warning) => (
                <div key={warning} style={warningRowStyle}>
                  <AlertTriangle size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...warningRowStyle, color: MAP_COLORS.success }}>
              <Activity size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              Current layer stack is within the documented interactive render budgets.
            </div>
          )}
        </section>

        <section style={{ display: "grid", gap: MAP_SPACING.sm }}>
          <div style={sectionTitleStyle}>Layer Diagnostics</div>
          <div style={layerTableStyle} role="table" aria-label="Layer performance diagnostics">
            <div style={layerHeaderRowStyle} role="row">
              <span>Layer</span>
              <span>Mode</span>
              <span>Features</span>
              <span>Memory</span>
            </div>
            {diagnostics.layers.length === 0 ? (
              <div style={layerRowStyle} role="row">
                <span>No overlay layers loaded.</span>
                <span>full</span>
                <span>0</span>
                <span>0 B</span>
              </div>
            ) : diagnostics.layers.map((layer) => (
              <div key={layer.layerId} style={layerRowStyle} role="row">
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{layer.layerName}</span>
                <span style={modeBadgeStyle(layer.mode)}>{layer.mode === "preview" ? "Preview" : "Full"}</span>
                <span>
                  {formatCount(layer.featureCount)}
                  {layer.previewFeatureCount != null ? ` / ${formatCount(layer.previewFeatureCount)} preview` : ""}
                </span>
                <span>{formatPerformanceBytes(layer.estimatedRenderBytes)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};

function StatCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning";
}): React.ReactElement {
  const toneColor = tone === "success"
    ? MAP_COLORS.success
    : tone === "warning"
      ? MAP_COLORS.caveatText
      : MAP_COLORS.text;
  return (
    <div style={statCellStyle}>
      <span style={statLabelStyle}>{label}</span>
      <span style={{ ...statValueStyle, color: toneColor }}>{value}</span>
    </div>
  );
}

export default MapPerformanceDiagnosticsPanel;
