import React from "react";
import { Activity, AlertTriangle, BarChart3, Gauge, RotateCcw, ShieldAlert, X } from "lucide-react";
import type { MapPerformanceDiagnosticsSummary } from "@/services/map/MapPerformanceDiagnostics";
import type { MapTelemetryEvent, MapTelemetryEventKind, MapTelemetrySeverity } from "@/services/map/observability";
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
  presentation?: "floating" | "embedded";
  onRetryWorkerJob?: (jobId: string) => void;
}

export interface MapPerformanceBudgetBannerProps {
  diagnostics: MapPerformanceDiagnosticsSummary;
  rightInset?: React.CSSProperties["right"];
  onOpenDetails?: () => void;
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

const embeddedPanelStyle: React.CSSProperties = {
  ...panelStyle,
  position: "relative",
  inset: "auto",
  width: "100%",
  height: "100%",
  maxWidth: "none",
  maxHeight: "none",
  border: MAP_STROKES.none,
  borderRadius: MAP_RADIUS.none,
  boxShadow: MAP_SHADOWS.none,
  zIndex: "auto",
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

const telemetryListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const telemetryRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
};

const telemetryMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexWrap: "wrap",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const telemetryMessageStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  overflowWrap: "anywhere",
};

const telemetryCategoryStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const telemetryCategoryHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const telemetryCountChipStyle: React.CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  padding: "0.0625rem 0.375rem",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const telemetryMutedNoteStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const retryButtonStyle: React.CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: "0.25rem 0.5rem",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
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
  top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
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

const bannerActionButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  width: "fit-content",
  minHeight: "1.625rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: `1px solid ${MAP_COLORS.caveatText}`,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.caveatText,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
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

function formatTelemetryTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "now";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function severityColor(severity: MapTelemetrySeverity): string {
  if (severity === "error") return MAP_COLORS.error;
  if (severity === "warning") return MAP_COLORS.caveatText;
  return MAP_COLORS.textMuted;
}

function detailString(event: MapTelemetryEvent, key: string): string | null {
  const value = event.details[key];
  return typeof value === "string" ? value : null;
}

interface TelemetryCategoryConfig {
  kind: MapTelemetryEventKind;
  label: string;
}

const TELEMETRY_CATEGORY_ORDER: readonly TelemetryCategoryConfig[] = [
  { kind: "worker.failure", label: "Worker failures" },
  { kind: "external-service.error", label: "External service errors" },
  { kind: "command.run", label: "Command activity" },
  { kind: "performance.budget", label: "Render budget alerts" },
  { kind: "panel.error", label: "Panel recovery" },
];

const TELEMETRY_DISPLAY_PER_CATEGORY = 6;

function categoryMaxSeverity(events: readonly MapTelemetryEvent[]): MapTelemetrySeverity {
  if (events.some((event) => event.severity === "error")) return "error";
  if (events.some((event) => event.severity === "warning")) return "warning";
  return "info";
}

interface TelemetryCategoryGroup extends TelemetryCategoryConfig {
  events: MapTelemetryEvent[];
}

function groupTelemetryByCategory(events: readonly MapTelemetryEvent[]): TelemetryCategoryGroup[] {
  return TELEMETRY_CATEGORY_ORDER.map((category) => ({
    ...category,
    events: events.filter((event) => event.kind === category.kind),
  })).filter((category) => category.events.length > 0);
}

function shouldForceDiagnosticsCrash(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as typeof window & { __MAP_E2E_FORCE_MAP_DIAGNOSTICS_CRASH__?: boolean }).__MAP_E2E_FORCE_MAP_DIAGNOSTICS_CRASH__);
}

export const MapPerformanceBudgetBanner: React.FC<MapPerformanceBudgetBannerProps> = ({
  diagnostics,
  rightInset = "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  onOpenDetails,
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
      {onOpenDetails ? (
        <button
          type="button"
          style={bannerActionButtonStyle}
          data-testid="map-performance-bounded-open-details"
          onClick={onOpenDetails}
        >
          <BarChart3 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          Open diagnostics
        </button>
      ) : null}
    </div>
  );
};

export const MapPerformanceDiagnosticsPanel: React.FC<MapPerformanceDiagnosticsPanelProps> = ({
  visible,
  diagnostics,
  onClose,
  presentation = "floating",
  onRetryWorkerJob,
}) => {
  const panelDrag = useDraggableMapPanel();
  if (!visible) return null;
  if (shouldForceDiagnosticsCrash()) {
    throw new Error("Forced Map diagnostics panel failure for recovery proof.");
  }
  const telemetryGroups = groupTelemetryByCategory(diagnostics.telemetryEvents);
  const totalTelemetryCount = diagnostics.telemetryEvents.length;
  const embedded = presentation === "embedded";

  const renderTelemetryEvent = (event: MapTelemetryEvent): React.ReactElement => {
    const jobId = event.kind === "worker.failure" ? detailString(event, "jobId") : null;
    return (
      <article
        key={event.id}
        style={{ ...telemetryRowStyle, borderColor: severityColor(event.severity) }}
        data-testid={`map-observability-event-${event.kind}`}
      >
        <div style={telemetryMetaStyle}>
          <ShieldAlert size={MAP_ICON_SIZES.sm} aria-hidden="true" style={{ color: severityColor(event.severity) }} />
          <span style={{ color: severityColor(event.severity), textTransform: "uppercase" }}>{event.severity}</span>
          <span>{event.kind}</span>
          <span>{formatTelemetryTime(event.createdAt)}</span>
          {event.recoverable ? <span>Recoverable</span> : null}
        </div>
        <div style={telemetryMessageStyle}>{event.message}</div>
        {jobId && event.recoverable && onRetryWorkerJob ? (
          <button
            type="button"
            style={retryButtonStyle}
            data-testid="map-worker-recovery-retry"
            onClick={() => onRetryWorkerJob(jobId)}
          >
            <RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            {event.recoveryLabel ?? "Retry worker job"}
          </button>
        ) : null}
      </article>
    );
  };
  const resolvedPanelStyle = embedded ? embeddedPanelStyle : { ...panelStyle, ...panelDrag.panelPositionStyle };
  const resolvedHeaderStyle = embedded ? headerStyle : { ...headerStyle, ...panelDrag.dragHandleStyle };

  return (
    <aside
      data-draggable-map-panel={embedded ? undefined : "true"}
      style={resolvedPanelStyle}
      role={embedded ? "region" : "dialog"}
      aria-modal={embedded ? undefined : "false"}
      aria-label="Map performance diagnostics"
      data-testid="map-performance-diagnostics"
    >
      <header style={resolvedHeaderStyle} {...(embedded ? {} : panelDrag.dragHandleProps)}>
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
        <StatCell label="Ops events" value={formatCount(diagnostics.telemetrySummary.totalCount)} />
        <StatCell label="Ops errors" value={formatCount(diagnostics.telemetrySummary.errorCount)} tone={diagnostics.telemetrySummary.errorCount > 0 ? "warning" : "success"} />
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

        <section style={{ display: "grid", gap: MAP_SPACING.sm }} data-testid="map-observability-log">
          <div style={sectionTitleStyle}>Operations Log</div>
          {totalTelemetryCount === 0 ? (
            <div style={{ ...warningRowStyle, color: MAP_COLORS.textMuted }}>
              <Activity size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              No diagnostics events recorded for this map session.
            </div>
          ) : (
            <div style={{ display: "grid", gap: MAP_SPACING.md }}>
              {telemetryGroups.map((category) => {
                const severity = categoryMaxSeverity(category.events);
                const shown = category.events.slice(0, TELEMETRY_DISPLAY_PER_CATEGORY);
                const hiddenCount = category.events.length - shown.length;
                return (
                  <section
                    key={category.kind}
                    style={telemetryCategoryStyle}
                    data-testid={`map-observability-category-${category.kind}`}
                    aria-label={category.label}
                  >
                    <div style={telemetryCategoryHeaderStyle}>
                      <ShieldAlert size={MAP_ICON_SIZES.sm} aria-hidden="true" style={{ color: severityColor(severity) }} />
                      <span>{category.label}</span>
                      <span style={{ ...telemetryCountChipStyle, color: severityColor(severity), borderColor: severityColor(severity) }}>
                        {formatCount(category.events.length)}
                      </span>
                    </div>
                    <div style={telemetryListStyle}>{shown.map(renderTelemetryEvent)}</div>
                    {hiddenCount > 0 ? (
                      <div style={telemetryMutedNoteStyle}>
                        +{formatCount(hiddenCount)} older {category.label.toLowerCase()} in the bounded log.
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
          <div style={telemetryMutedNoteStyle} data-testid="map-observability-redaction-note">
            <ShieldAlert size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            <span>Secrets, tokens, and contact details are redacted before any event is stored; the operations log is bounded to the newest events.</span>
          </div>
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
