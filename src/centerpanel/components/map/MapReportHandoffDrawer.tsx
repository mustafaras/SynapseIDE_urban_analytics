import React from "react";
import type {
  MapReportHandoffDraft,
  MapReportHandoffOptions,
} from "@/services/map/MapReportHandoffService";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";

interface MapReportHandoffDrawerProps {
  draft: MapReportHandoffDraft | null;
  options: MapReportHandoffOptions;
  isGeneratingSnapshot: boolean;
  isExportingPdf?: boolean;
  presentation?: "floating" | "right-rail" | "bottom-drawer";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  onOptionsChange: (options: MapReportHandoffOptions) => void;
  onRefreshSnapshot: () => void;
  onRegisterEvidence: () => void;
  onDownloadPdf: () => void;
  onInsert: () => void;
  onClose: () => void;
}

const drawerBaseStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto",
  overflow: "hidden",
  borderRadius: MAP_RADIUS.lg,
  border: MAP_STROKES.hairline,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  zIndex: MAP_Z_INDEX.symbologyPanel + 8,
};

const resizeHandleStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  bottom: MAP_SPACING.zero,
  left: "-0.3125rem",
  width: "0.625rem",
  cursor: "col-resize",
  touchAction: "none",
  background: MAP_COLORS.transparent,
  zIndex: MAP_Z_INDEX.symbologyPanel + 9,
};

function clampPanelWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

function getDrawerStyle(presentation: "floating" | "right-rail" | "bottom-drawer", width?: number): React.CSSProperties {
  if (presentation === "bottom-drawer") {
    return {
      ...drawerBaseStyle,
      position: "absolute",
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      top: "auto",
      width: "auto",
      height: "min(26rem, 58%)",
      maxHeight: "min(32rem, 70%)",
      borderRadius: `${MAP_RADIUS.lg} ${MAP_RADIUS.lg} 0 0`,
      borderTop: MAP_STROKES.hairlineStrong,
    };
  }

  if (presentation === "right-rail") {
    return {
      ...drawerBaseStyle,
      position: "absolute",
      top: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      width: `${width ?? 430}px`,
      maxWidth: "calc(100% - 2rem)",
      borderRadius: 0,
      borderLeft: MAP_STROKES.hairlineSubtle,
    };
  }

  return {
    ...drawerBaseStyle,
    position: "absolute",
    top: 72,
    right: MAP_SPACING.md,
    bottom: MAP_SPACING.md,
    width: "min(430px, calc(100vw - 32px))",
  };
}

const headerStyle: React.CSSProperties = {
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const eyebrowStyle: React.CSSProperties = {
  marginBottom: 4,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  lineHeight: 1.2,
};

const iconButtonStyle: React.CSSProperties = {
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  borderRadius: MAP_RADIUS.sm,
  width: 30,
  height: 30,
  cursor: "pointer",
};

const optionBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  padding: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const optionLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
  padding: "7px 8px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.2,
};

const snapshotControlBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  padding: `0 ${MAP_SPACING.sm} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const selectLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  minWidth: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const selectStyle: React.CSSProperties = {
  minWidth: 0,
  width: "100%",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: "7px 8px",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  padding: MAP_SPACING.sm,
  display: "grid",
  gap: MAP_SPACING.sm,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const mutedTextStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.45,
};

const paragraphStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  lineHeight: 1.5,
};

const readinessPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

const readinessHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: MAP_SPACING.sm,
};

const readinessBadgeStyle: React.CSSProperties = {
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  padding: "4px 7px",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const snapshotFrameStyle: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: MAP_RADIUS.md,
  border: MAP_STROKES.hairlineSubtle,
  background: "rgba(0,0,0,0.35)",
};

const snapshotPlaceholderStyle: React.CSSProperties = {
  minHeight: 150,
  display: "grid",
  placeItems: "center",
  padding: MAP_SPACING.md,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  textAlign: "center",
};

const snapshotImageStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxHeight: 230,
  objectFit: "contain",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 5,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.42,
};

const legendGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
};

const legendItemStyle: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "14px 1fr",
  gap: 6,
  alignItems: "center",
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const metaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "6px 10px",
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const footerActionStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: MAP_SPACING.sm,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  borderRadius: MAP_RADIUS.sm,
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const primaryButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  background: MAP_COLORS.interactionSubtle,
  border: `1px solid ${MAP_COLORS.focus}`,
  color: MAP_COLORS.interaction,
};

const disabledActionStyle: React.CSSProperties = {
  opacity: 0.52,
  cursor: "not-allowed",
};

type MapReportHandoffBooleanOption = "includeMethods" | "includeDataLineage" | "includeQaWarnings";

function toggleOption(
  options: MapReportHandoffOptions,
  key: MapReportHandoffBooleanOption,
): MapReportHandoffOptions {
  return { ...options, [key]: !options[key] };
}

function getReadinessBadgeColor(status: MapReportHandoffDraft["publicationReadiness"]["status"]): React.CSSProperties {
  const statusKey: string = status;
  if (statusKey === "ready") {
    return {
      color: MAP_COLORS.success,
      background: "color-mix(in srgb, var(--syn-status-valid, #4ec27d) 12%, transparent)",
      borderColor: "color-mix(in srgb, var(--syn-status-valid, #4ec27d) 34%, transparent)",
    };
  }
  if (statusKey === "blocked") {
    return {
      color: MAP_COLORS.error,
      background: "color-mix(in srgb, var(--syn-status-error, #f87171) 12%, transparent)",
      borderColor: "color-mix(in srgb, var(--syn-status-error, #f87171) 34%, transparent)",
    };
  }
  if (statusKey === "ready-with-caveats" || statusKey === "needs-review") {
    return {
      color: MAP_COLORS.caveatText,
      background: MAP_COLORS.caveat,
      borderColor: MAP_COLORS.focus,
    };
  }
  if (statusKey === "stale") {
    return {
      color: "var(--syn-status-stale, #9aa3b2)",
      background: MAP_COLORS.neutralSubtle,
      borderColor: MAP_COLORS.hairline,
    };
  }
  return {
    color: "var(--syn-status-unknown, #858b96)",
    background: MAP_COLORS.neutralSubtle,
    borderColor: MAP_COLORS.hairlineSubtle,
  };
}

export const MapReportHandoffDrawer: React.FC<MapReportHandoffDrawerProps> = ({
  draft,
  options,
  isGeneratingSnapshot,
  isExportingPdf = false,
  presentation = "floating",
  width,
  minWidth = 300,
  maxWidth = 520,
  onWidthChange,
  onOptionsChange,
  onRefreshSnapshot,
  onRegisterEvidence,
  onDownloadPdf,
  onInsert,
  onClose,
}) => {
  const handleResizePointerDown = React.useCallback<React.PointerEventHandler<HTMLDivElement>>((event) => {
    if (presentation !== "right-rail" || !onWidthChange) {
      return;
    }

    const panelElement = event.currentTarget.parentElement;
    const startWidth = panelElement?.getBoundingClientRect().width ?? width ?? 430;
    const startX = event.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      onWidthChange(clampPanelWidth(Math.round(startWidth + startX - moveEvent.clientX), minWidth, maxWidth));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, [maxWidth, minWidth, onWidthChange, presentation, width]);

  const handleResizeKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
    if (presentation !== "right-rail" || !onWidthChange) {
      return;
    }

    const currentWidth = width ?? 430;
    const step = event.shiftKey ? 32 : 12;
    let nextWidth: number | null = null;

    if (event.key === "ArrowLeft") {
      nextWidth = currentWidth + step;
    } else if (event.key === "ArrowRight") {
      nextWidth = currentWidth - step;
    } else if (event.key === "Home") {
      nextWidth = minWidth;
    } else if (event.key === "End") {
      nextWidth = maxWidth;
    }

    if (nextWidth == null) {
      return;
    }

    event.preventDefault();
    onWidthChange(clampPanelWidth(nextWidth, minWidth, maxWidth));
  }, [maxWidth, minWidth, onWidthChange, presentation, width]);

  if (!draft) return null;

  const publicationReadiness = draft.publicationReadiness;
  const isPublicationBlocked = publicationReadiness.status === "blocked";
  const readinessFindings = publicationReadiness.blockers.length > 0
    ? publicationReadiness.blockers
    : publicationReadiness.warnings;
  const readinessStatusId = "map-report-readiness-status";
  const snapshotStatusId = "map-report-snapshot-status";
  const publicationBlockedMessage = isPublicationBlocked
    ? "Resolve publication readiness blockers before downloading a formal PDF or inserting this report item."
    : "Publication readiness is not blocking report actions.";
  const snapshotBusyMessage = isGeneratingSnapshot
    ? "Snapshot actions are unavailable while the current map preview is rendering."
    : "Snapshot actions are available.";

  return (
    <aside
      style={getDrawerStyle(presentation, width)}
      aria-label="Map report handoff preview"
      data-map-report-handoff-panel={presentation}
      data-testid="map-report-handoff-panel"
    >
      {presentation === "right-rail" && onWidthChange ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize report handoff panel"
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuenow={width ?? 430}
          aria-valuetext={`${width ?? 430} pixels`}
          tabIndex={0}
          style={resizeHandleStyle}
          onPointerDown={handleResizePointerDown}
          onKeyDown={handleResizeKeyDown}
          data-testid="map-report-panel-resize-handle"
          title="Drag or use arrow keys to resize report handoff panel"
        />
      ) : null}
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Add to report</div>
          <h3 style={titleStyle}>{draft.title}</h3>
          <div style={mutedTextStyle}>{draft.scope.replace("-", " ")} handoff with structured citations</div>
        </div>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close report preview">
          x
        </button>
      </header>

      <div style={optionBarStyle} aria-label="Report handoff options">
        <label style={optionLabelStyle}>
          <input
            type="checkbox"
            checked={options.includeMethods}
            onChange={() => onOptionsChange(toggleOption(options, "includeMethods"))}
          />
          Methods
        </label>
        <label style={optionLabelStyle}>
          <input
            type="checkbox"
            checked={options.includeDataLineage}
            onChange={() => onOptionsChange(toggleOption(options, "includeDataLineage"))}
          />
          Lineage
        </label>
        <label style={optionLabelStyle}>
          <input
            type="checkbox"
            checked={options.includeQaWarnings}
            onChange={() => onOptionsChange(toggleOption(options, "includeQaWarnings"))}
          />
          QA warnings
        </label>
      </div>

      <div style={snapshotControlBarStyle} aria-label="Snapshot export framing">
        <label style={selectLabelStyle}>
          Snapshot frame
          <select
            style={selectStyle}
            value={options.snapshotFrame}
            onChange={(event) => onOptionsChange({ ...options, snapshotFrame: event.target.value as MapReportHandoffOptions["snapshotFrame"] })}
          >
            <option value="current-view">Current view</option>
            <option value="landscape">Landscape</option>
            <option value="square">Square</option>
            <option value="portrait">Portrait</option>
          </select>
        </label>
        <label style={selectLabelStyle}>
          Map fit
          <select
            style={selectStyle}
            value={options.snapshotFit}
            onChange={(event) => onOptionsChange({ ...options, snapshotFit: event.target.value as MapReportHandoffOptions["snapshotFit"] })}
          >
            <option value="contain">Full map</option>
            <option value="cover">Fill frame</option>
          </select>
        </label>
      </div>

      <div style={bodyStyle}>
        <section style={sectionStyle} aria-label="Publication readiness">
          <div
            id={readinessStatusId}
            style={readinessPanelStyle}
            role="status"
            aria-live="polite"
            aria-label={`Publication readiness ${publicationReadiness.status.replace(/-/g, " ")}. ${publicationBlockedMessage}`}
          >
            <div style={readinessHeaderStyle}>
              <div style={sectionTitleStyle}>Publication readiness</div>
              <span style={{ ...readinessBadgeStyle, ...getReadinessBadgeColor(publicationReadiness.status) }}>
                {publicationReadiness.status.replace(/-/g, " ")}
              </span>
            </div>
            <div style={mutedTextStyle}>
              {publicationReadiness.blockers.length} blocker(s), {publicationReadiness.warnings.length} warning(s), {publicationReadiness.caveats.length} caveat(s)
            </div>
            {readinessFindings.length > 0 ? (
              <ul style={listStyle}>
                {readinessFindings.slice(0, 5).map((check) => (
                  <li key={`${check.criterion}-${check.message}`}>{check.message}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <span id={snapshotStatusId} style={mapStyles.srOnly}>{snapshotBusyMessage}</span>
        </section>

        <section style={sectionStyle} aria-label="Map snapshot preview">
          <div style={sectionTitleStyle}>Snapshot</div>
          <div style={snapshotFrameStyle}>
            {draft.snapshot.dataUrl ? (
              <img style={snapshotImageStyle} src={draft.snapshot.dataUrl} alt={draft.snapshot.title} />
            ) : (
              <div style={snapshotPlaceholderStyle}>
                {isGeneratingSnapshot ? "Rendering current publication map preview..." : "Snapshot metadata is ready. Refresh to capture the current map canvas."}
              </div>
            )}
          </div>
          <div style={metaGridStyle}>
            <span style={mutedTextStyle}>Scale</span><span>{draft.snapshot.scaleBarLabel}</span>
            <span style={mutedTextStyle}>North</span><span>{draft.snapshot.northArrowLabel}</span>
            <span style={mutedTextStyle}>Attribution</span><span>{draft.snapshot.attributionText}</span>
          </div>
        </section>

        <section style={sectionStyle} aria-label="Visible layers and legend">
          <div style={sectionTitleStyle}>Layers and legend</div>
          <ul style={listStyle}>
            {draft.snapshot.visibleLayerNames.length > 0
              ? draft.snapshot.visibleLayerNames.map((name) => <li key={name}>{name}</li>)
              : <li>Missing prerequisite: show at least one overlay layer before capturing a layer legend.</li>}
          </ul>
          <div style={legendGridStyle}>
            {draft.snapshot.legendItems.slice(0, 10).map((item) => (
              <div key={`${item.secondaryLabel ?? "legend"}-${item.label}`} style={legendItemStyle} title={item.secondaryLabel ?? item.label}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: item.color, border: MAP_STROKES.hairlineSubtle }} />
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle} aria-label="Narrative draft">
          <div style={sectionTitleStyle}>Narrative draft</div>
          <p style={paragraphStyle}>{draft.narrative}</p>
        </section>

        <section style={sectionStyle} aria-label="Citations and caveats">
          <div style={sectionTitleStyle}>Citations</div>
          <ul style={listStyle}>
            {draft.citations.map((citation) => (
              <li key={citation.id}>{citation.id}: {citation.title} ({citation.year})</li>
            ))}
          </ul>
          <div style={sectionTitleStyle}>Caveats</div>
          <ul style={listStyle}>
            {draft.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
          </ul>
        </section>

        <section style={sectionStyle} aria-label="Reproducibility block">
          <div style={sectionTitleStyle}>Reproducibility</div>
          <div style={metaGridStyle}>
            {draft.reproducibility.map((item) => (
              <React.Fragment key={item.label}>
                <span style={mutedTextStyle}>{item.label}</span>
                <span>{item.value}</span>
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>

      <footer style={footerStyle}>
        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={onRefreshSnapshot}
          disabled={isGeneratingSnapshot}
          aria-describedby={snapshotStatusId}
          title={snapshotBusyMessage}
        >
          {isGeneratingSnapshot ? "Rendering..." : "Refresh snapshot"}
        </button>
        <div style={footerActionStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={onRegisterEvidence}
            disabled={isGeneratingSnapshot}
            aria-describedby={snapshotStatusId}
            title="Register the structured map evidence block with QA, provenance, caveats, and snapshot references."
          >
            Register evidence
          </button>
          <button
            type="button"
            style={{ ...secondaryButtonStyle, ...(isPublicationBlocked ? disabledActionStyle : {}) }}
            onClick={onDownloadPdf}
            disabled={isGeneratingSnapshot || isExportingPdf || isPublicationBlocked}
            aria-describedby={`${readinessStatusId} ${snapshotStatusId}`}
            title={isPublicationBlocked ? "Resolve publication readiness blockers before downloading a formal PDF." : undefined}
          >
            {isExportingPdf ? "Exporting A0..." : isPublicationBlocked ? "PDF blocked" : "Download A0 PDF"}
          </button>
          <button
            type="button"
            style={{ ...primaryButtonStyle, ...(isPublicationBlocked ? disabledActionStyle : {}) }}
            onClick={onInsert}
            disabled={isPublicationBlocked}
            aria-describedby={readinessStatusId}
            title={isPublicationBlocked ? "Resolve publication readiness blockers before inserting this report item." : undefined}
          >
            {isPublicationBlocked ? "Insert blocked" : "Insert to report"}
          </button>
        </div>
      </footer>
    </aside>
  );
};
