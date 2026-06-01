/**
 * Prompt 36 — empty state primitive.
 * Shows when a panel or list has no content to display.
 * Critical state is never communicated by icon alone — always accompanied by text.
 */
import React from "react";
import {
  MAP_COLORS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import motionStyles from "../design/motion.module.css";

export interface GisEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

export const GisEmptyState: React.FC<GisEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  style,
  "data-testid": testId,
}) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: MAP_SPACING.sm,
    padding: compact ? MAP_SPACING.md : MAP_SPACING.lg,
    textAlign: "center",
    color: MAP_COLORS.textMuted,
    minWidth: 0,
    maxWidth: "100%",
    ...style,
  };

  return (
    <div data-testid={testId} data-gis-empty-state="true" style={containerStyle} role="status" aria-live="polite" className={motionStyles.fadeIn}>
      {icon ? (
        <span aria-hidden style={{ opacity: 0.4, display: "flex" }}>
          {icon}
        </span>
      ) : null}
      <p
        style={{
          margin: 0,
          fontSize: MAP_TYPOGRAPHY.fontSize.xs,
          fontFamily: MAP_TYPOGRAPHY.fontFamily,
          fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
          color: MAP_COLORS.textSecondary,
          lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </p>
      {description ? (
        <p
          style={{
            margin: 0,
            fontSize: MAP_TYPOGRAPHY.fontSize.xs,
            fontFamily: MAP_TYPOGRAPHY.fontFamily,
            color: MAP_COLORS.textMuted,
            lineHeight: MAP_TYPOGRAPHY.lineHeight.relaxed,
            maxWidth: "20rem",
            overflowWrap: "anywhere",
          }}
        >
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
};
