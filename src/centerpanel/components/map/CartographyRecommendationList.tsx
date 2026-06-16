import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  RotateCcw,
  X,
} from "lucide-react";
import type {
  MapCartographyRecommendation,
  MapCartographySeverity,
} from "@/services/map/MapCartographyAdvisor";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "./mapTokens";

export interface CartographyRecommendationListProps {
  recommendations: MapCartographyRecommendation[];
  title?: string;
  emptyMessage?: string;
  maxItems?: number;
  canUndo?: boolean;
  onApply: (recommendationId: string) => void;
  onDismiss: (recommendationId: string) => void;
  onUndo?: () => void;
  onShowDetails?: (recommendation: MapCartographyRecommendation) => void;
}

const containerStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
};

const titleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const countStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
};

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  minWidth: MAP_SPACING.zero,
};

const topLineStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: MAP_SPACING.sm,
  alignItems: "start",
};

const issueTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const metaStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  marginTop: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const bodyTextStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const fixStyle: React.CSSProperties = {
  ...bodyTextStyle,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} 0 0`,
  borderTop: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
};

const severityPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "1.25rem",
  padding: `0 ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  whiteSpace: "nowrap",
};

const previewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
};

const previewBoxStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const previewTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
};

const legendRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.75rem minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const legendLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const actionGroupStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
};

const buttonStyle: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  minHeight: "1.75rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  color: MAP_COLORS.interaction,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.interactionSubtle,
};

const detailsStyle: React.CSSProperties = {
  margin: 0,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const emptyStyle: React.CSSProperties = {
  ...mapStyles.sidePanelEmpty,
  padding: MAP_SPACING.sm,
};

function severityLabel(severity: MapCartographySeverity): string {
  switch (severity) {
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    default:
      return "Info";
  }
}

function severityStyle(severity: MapCartographySeverity): React.CSSProperties {
  const color = severity === "error"
    ? MAP_COLORS.error
    : severity === "warning"
      ? MAP_COLORS.warning
      : MAP_COLORS.textMuted;
  return {
    ...severityPillStyle,
    color,
    border: `1px solid ${color}`,
    background: severity === "info" ? MAP_COLORS.transparent : "rgba(255,255,255,0.035)",
  };
}

function renderLegendItems(items: MapCartographyRecommendation["preview"]["beforeLegend"]): React.ReactNode {
  return items.slice(0, 5).map((item, index) => (
    <div key={`${item.label}-${index}`} style={legendRowStyle}>
      <span
        aria-hidden="true"
        style={{
          width: "0.75rem",
          height: "0.75rem",
          borderRadius: item.kind === "circle" || item.kind === "dot-density" ? MAP_RADIUS.full : MAP_RADIUS.xs,
          background: item.kind === "label" ? MAP_COLORS.transparent : item.color,
          border: MAP_STROKES.hairlineSubtle,
          color: item.color,
          fontSize: MAP_TYPOGRAPHY.fontSize.xs,
          fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
          lineHeight: 1,
        }}
      >
        {item.kind === "label" ? "Aa" : null}
      </span>
      <span style={legendLabelStyle} title={item.secondaryLabel ? `${item.label} / ${item.secondaryLabel}` : item.label}>
        {item.label}
      </span>
    </div>
  ));
}

export const CartographyRecommendationList: React.FC<CartographyRecommendationListProps> = ({
  recommendations,
  title = "Cartography review",
  emptyMessage = "No cartographic recommendations for the current scope.",
  maxItems,
  canUndo = false,
  onApply,
  onDismiss,
  onUndo,
  onShowDetails,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const visibleRecommendations = maxItems ? recommendations.slice(0, maxItems) : recommendations;

  const toggleDetails = (recommendation: MapCartographyRecommendation) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(recommendation.id)) {
        next.delete(recommendation.id);
      } else {
        next.add(recommendation.id);
      }
      return next;
    });
    onShowDetails?.(recommendation);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>{title}</div>
          <div style={countStyle}>
            {recommendations.length} recommendation{recommendations.length === 1 ? "" : "s"}
          </div>
        </div>
        {canUndo && onUndo ? (
          <button type="button" style={buttonStyle} onClick={onUndo} aria-label="Undo last cartography change">
            <RotateCcw size={MAP_ICON_SIZES.xs} />
            Undo
          </button>
        ) : null}
      </div>

      {visibleRecommendations.length === 0 ? (
        <div style={emptyStyle}>{emptyMessage}</div>
      ) : null}

      {visibleRecommendations.map((recommendation) => {
        const expanded = expandedIds.has(recommendation.id);
        return (
          <article key={recommendation.id} style={cardStyle}>
            <div style={topLineStyle}>
              <div>
                <div style={issueTitleStyle}>{recommendation.title}</div>
                <div style={metaStyle}>
                  {recommendation.layerName} / {recommendation.type}
                  {recommendation.field ? ` / ${recommendation.field}` : ""}
                </div>
              </div>
              <span style={severityStyle(recommendation.severity)}>{severityLabel(recommendation.severity)}</span>
            </div>

            <div style={bodyTextStyle}>{recommendation.rationale}</div>
            <div style={fixStyle}>{recommendation.suggestedFix}</div>

            <div style={previewGridStyle} aria-label={`Before and after legend preview for ${recommendation.title}`}>
              <div style={previewBoxStyle} data-testid="map-cartography-preview-single-column">
                <div style={previewTitleStyle}>Before</div>
                {renderLegendItems(recommendation.preview.beforeLegend)}
              </div>
              <div style={previewBoxStyle}>
                <div style={previewTitleStyle}>After</div>
                {renderLegendItems(recommendation.preview.afterLegend)}
              </div>
            </div>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => toggleDetails(recommendation)}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronDown size={MAP_ICON_SIZES.xs} /> : <ChevronRight size={MAP_ICON_SIZES.xs} />}
                Show details
              </button>
              <div style={actionGroupStyle}>
                {recommendation.proposal ? (
                  <button type="button" style={primaryButtonStyle} onClick={() => onApply(recommendation.id)}>
                    <Check size={MAP_ICON_SIZES.xs} />
                    Apply
                  </button>
                ) : null}
                <button type="button" style={buttonStyle} onClick={() => onDismiss(recommendation.id)}>
                  <X size={MAP_ICON_SIZES.xs} />
                  Dismiss
                </button>
              </div>
            </div>

            {expanded ? (
              <div style={detailsStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.xs, marginBottom: MAP_SPACING.xs }}>
                  <Info size={MAP_ICON_SIZES.xs} />
                  <a href={recommendation.detailUrl} style={{ color: MAP_COLORS.interaction }}>
                    Scientific detail
                  </a>
                </div>
                <div>{recommendation.preview.summary}</div>
                {recommendation.proposal ? (
                  <div style={{ marginTop: MAP_SPACING.xs }}>
                    <Eye size={MAP_ICON_SIZES.xs} /> Proposal is reversible and applied only after approval.
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
};
