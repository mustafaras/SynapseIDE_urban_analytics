import React from "react";

import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import type { MapWorkflowPreview } from "../../../../services/map/MapWorkflowService";

const workflowPreviewHudStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "calc(var(--map-overlay-safe-bottom, 6.75rem) + 0.75rem)",
  transform: "translateX(-50%)",
  zIndex: MAP_Z_INDEX.mapFurniture,
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: "min(26rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  maxWidth: "min(34rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  border: "1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.48))",
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(15, 20, 28, 0.92))",
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  pointerEvents: "none",
};

const workflowDividerStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  bottom: MAP_SPACING.zero,
  width: MAP_DIMENSIONS.separatorWidth,
  background: "var(--syn-status-info, #38bdf8)",
  pointerEvents: "none",
  zIndex: MAP_Z_INDEX.mapFurniture - 1,
};

const comparisonLegendStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const comparisonLegendItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.75rem minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.textSecondary,
};

const comparisonLegendSwatchStyle: React.CSSProperties = {
  width: "0.75rem",
  height: "0.75rem",
  borderRadius: MAP_RADIUS.xs,
  border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
};

const comparisonLayerBColor = "var(--syn-status-pending, #a78bfa)";

const workflowPreviewMetaRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const workflowExecutionCrsChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: "1px solid currentColor",
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

function shortMapManifestId(value: string): string {
  return value.length > 20 ? `${value.slice(0, 16)}...` : value;
}

const WorkflowExecutionCrsChip: React.FC<{ preview: MapWorkflowPreview }> = ({ preview }) => {
  const summary = preview.manifest.crsSummary;
  const label = summary.executionCrs
    ? `Execution CRS ${summary.executionCrs}`
    : summary.sourceCrs
      ? "Execution CRS unresolved"
      : "Execution CRS unknown";
  const title = [
    `Source CRS: ${summary.sourceCrs ?? "unknown"}`,
    `Display CRS: ${summary.displayCrs}`,
    `Execution kind: ${summary.executionKind ?? "planar"}`,
  ].join("; ");
  return (
    <span
      style={workflowExecutionCrsChipStyle}
      data-testid="map-workflow-execution-crs-chip"
      title={title}
      aria-label={label}
    >
      {label}
    </span>
  );
};

export const WorkflowPreviewOverlay: React.FC<{ preview: MapWorkflowPreview | null }> = ({ preview }) => {
  if (!preview) {
    return null;
  }

  const comparison = preview.comparisonState;
  const dividerLeft = comparison
    ? `${Math.round((comparison.view === "split" ? 0.5 : comparison.swipePosition) * 100)}%`
    : null;

  return (
    <>
      {comparison && comparison.view !== "blend" && dividerLeft ? (
        <div
          style={{
            ...workflowDividerStyle,
            left: dividerLeft,
          }}
          aria-hidden="true"
        />
      ) : null}
      <div style={workflowPreviewHudStyle} data-testid="map-workflow-preview-hud" data-map-safe-inset-consumer="workflow-preview" aria-live="polite">
        <strong style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))" }}>
          {comparison ? "Comparison preview" : "Workflow preview layer"}
        </strong>
        {comparison ? (
          <>
            <div style={workflowPreviewMetaRowStyle}>
              <span>
                {comparison.layerAName} vs {comparison.layerBName} - {comparison.view}
                {comparison.view === "blend"
                  ? ` - opacity ${Math.round(comparison.blendOpacityA * 100)}% / ${Math.round(comparison.blendOpacityB * 100)}%`
                  : ` - divider ${Math.round(comparison.swipePosition * 100)}%`}
                {` - manifest ${shortMapManifestId(preview.manifest.manifestId)}`}
              </span>
              <WorkflowExecutionCrsChip preview={preview} />
            </div>
            <div style={comparisonLegendStyle} data-testid="map-comparison-legend" aria-label="Synchronized comparison legend">
              <span style={comparisonLegendItemStyle} title={comparison.layerAName}>
                <span style={{ ...comparisonLegendSwatchStyle, background: "var(--syn-status-info, #38bdf8)" }} aria-hidden="true" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>A · {comparison.layerAName}</span>
              </span>
              <span style={comparisonLegendItemStyle} title={comparison.layerBName}>
                <span style={{ ...comparisonLegendSwatchStyle, background: comparisonLayerBColor }} aria-hidden="true" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>B · {comparison.layerBName}</span>
              </span>
            </div>
          </>
        ) : (
          <div style={workflowPreviewMetaRowStyle}>
            <span>
              {preview.featureCount.toLocaleString()} preview feature{preview.featureCount === 1 ? "" : "s"} - manifest {shortMapManifestId(preview.manifest.manifestId)}
            </span>
            <WorkflowExecutionCrsChip preview={preview} />
          </div>
        )}
      </div>
    </>
  );
};
