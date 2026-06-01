/**
 * Prompt 36 — property grid primitive.
 * Renders a two-column key/value table for layer metadata, settings, or metrics.
 * Values can be strings, numbers, or arbitrary React nodes (chips, badges).
 */
import React from "react";
import {
  MAP_COLORS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";

export interface GisPropertyRow {
  key: string;
  value: React.ReactNode;
  /** Visual emphasis for values that need attention */
  highlight?: "warn" | "error" | "success";
}

export interface GisPropertyGridProps {
  rows: GisPropertyRow[];
  /** Show a top border separator when nested inside a section */
  topBorder?: boolean;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

const HIGHLIGHT_COLOR: Record<NonNullable<GisPropertyRow["highlight"]>, string> = {
  warn: MAP_COLORS.caveatText,
  error: MAP_COLORS.error,
  success: MAP_COLORS.success,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(6rem, max-content) minmax(0, 1fr)",
  gap: 0,
  width: "100%",
};

const cellBase: React.CSSProperties = {
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  borderBottom: MAP_STROKES.hairlineSubtle,
  alignItems: "start",
  minWidth: 0,
};

export const GisPropertyGrid: React.FC<GisPropertyGridProps> = ({
  rows,
  topBorder = false,
  style,
  "data-testid": testId,
}) => {
  return (
    <dl
      data-testid={testId}
      style={{
        margin: 0,
        ...gridStyle,
        borderTop: topBorder ? MAP_STROKES.hairlineSubtle : undefined,
        ...style,
      }}
    >
      {rows.map(({ key, value, highlight }) => (
        <React.Fragment key={key}>
          <dt
            style={{
              ...cellBase,
              color: MAP_COLORS.textMuted,
              fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
              whiteSpace: "nowrap",
              paddingRight: MAP_SPACING.md,
            }}
          >
            {key}
          </dt>
          <dd
            style={{
              ...cellBase,
              ...MAP_TEXT_STYLES.valueWrap,
              margin: 0,
              color: highlight ? HIGHLIGHT_COLOR[highlight] : MAP_COLORS.text,
              fontWeight: 400,
            }}
          >
            {value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};
