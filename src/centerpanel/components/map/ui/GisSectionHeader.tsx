/**
 * Prompt 36 — section header primitive.
 * Renders a slim panel header with an optional label chip, optional trailing actions,
 * and an optional expand/collapse chevron.
 */
import React from "react";
import {
  MAP_COLORS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";

export interface GisSectionHeaderProps {
  title: string;
  /** Rendered in the trailing slot (e.g. icon buttons or a chip) */
  actions?: React.ReactNode;
  /** Optional small annotation rendered after the title */
  badge?: React.ReactNode;
  level?: 2 | 3 | 4;
  compact?: boolean;
  /** Adds a bottom separator */
  separator?: boolean;
  style?: React.CSSProperties;
  "data-testid"?: string;
  id?: string;
}

export const GisSectionHeader: React.FC<GisSectionHeaderProps> = ({
  title,
  actions,
  badge,
  level = 3,
  compact = false,
  separator = true,
  style,
  "data-testid": testId,
  id,
}) => {
  const Heading = `h${level}` as "h2" | "h3" | "h4";

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    padding: compact
      ? `${MAP_SPACING.xs} ${MAP_SPACING.sm}`
      : `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    borderBottom: separator ? MAP_STROKES.hairlineSubtle : "none",
    background: MAP_COLORS.bgHeader,
    flexShrink: 0,
    minWidth: 0,
    ...style,
  };

  const headingStyle: React.CSSProperties = {
    margin: 0,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    color: MAP_COLORS.textSecondary,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  };

  return (
    <div data-testid={testId} style={containerStyle}>
      <Heading id={id} style={headingStyle}>
        {title}
      </Heading>
      {badge}
      {actions ? (
        <div
          style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
};
