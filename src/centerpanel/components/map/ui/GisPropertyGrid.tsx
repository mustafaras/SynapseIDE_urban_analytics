/**
 * Prompt 36 — property grid primitive.
 * Renders a two-column key/value table for layer metadata, settings, or metrics.
 * Values can be strings, numbers, or arbitrary React nodes (chips, badges).
 */
import React from "react";
import {
  type GisDensity,
  MAP_COLORS,
  MAP_DENSITY,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import primitiveStyles from "./GisPrimitive.module.css";

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
  density?: GisDensity;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

export interface GisDensePropertyRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  action?: React.ReactNode;
  highlight?: GisPropertyRow["highlight"];
  density?: GisDensity;
  mono?: boolean;
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
  density = "default",
  style,
  "data-testid": testId,
}) => {
  const densityPreset = MAP_DENSITY[density];
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
              minHeight: densityPreset.rowHeight,
              padding: densityPreset.cellPadding,
              fontSize: densityPreset.fontSize,
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
              minHeight: densityPreset.rowHeight,
              padding: densityPreset.cellPadding,
              fontSize: densityPreset.fontSize,
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

export const GisDensePropertyRow: React.FC<GisDensePropertyRowProps> = ({
  label,
  value,
  action,
  highlight,
  density = "compact",
  mono = false,
  style,
  "data-testid": testId,
}) => {
  const densityPreset = MAP_DENSITY[density];

  return (
    <dl
      data-testid={testId}
      data-gis-dense-property-row="true"
      className={primitiveStyles.propertyRow}
      style={{
        display: "grid",
        gridTemplateColumns: action ? "minmax(5rem, 34%) minmax(0, 1fr) auto" : "minmax(5rem, 34%) minmax(0, 1fr)",
        alignItems: "start",
        width: "100%",
        minHeight: densityPreset.rowHeight,
        margin: 0,
        borderBottom: MAP_STROKES.hairlineSubtle,
        ...style,
      }}
    >
      <dt
        style={{
          minWidth: 0,
          padding: densityPreset.cellPadding,
          color: MAP_COLORS.textMuted,
          fontSize: densityPreset.fontSize,
          fontFamily: MAP_TYPOGRAPHY.fontFamily,
          fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
          ...MAP_TEXT_STYLES.valueWrap,
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          minWidth: 0,
          margin: 0,
          padding: densityPreset.cellPadding,
          color: highlight ? HIGHLIGHT_COLOR[highlight] : MAP_COLORS.text,
          fontSize: densityPreset.fontSize,
          fontFamily: mono ? MAP_TYPOGRAPHY.fontFamilyMono : MAP_TYPOGRAPHY.fontFamily,
          ...MAP_TEXT_STYLES.valueWrap,
        }}
      >
        {value}
      </dd>
      {action ? (
        <dd
          style={{
            margin: 0,
            padding: densityPreset.cellPadding,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {action}
        </dd>
      ) : null}
    </dl>
  );
};
