/**
 * Prompt 36 — status chip primitive.
 * Accepts a semantic GisStatusKey and renders text/bg/border via MAP_STATUS_TOKENS.
 * For custom appearance, pass explicit color props.
 */
import React from "react";
import {
  MAP_COLORS,
  MAP_DENSITY,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STATUS_TOKENS,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  type GisDensity,
  type GisStatusKey,
} from "../mapTokens";
import motionStyles from "../design/motion.module.css";
import primitiveStyles from "./GisPrimitive.module.css";

export interface GisStatusChipProps {
  status: GisStatusKey;
  label?: string;
  density?: GisDensity;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  /** data-testid forwarded to the root span */
  "data-testid"?: string;
}

export interface GisSplitStatusChipProps extends Omit<GisStatusChipProps, "label"> {
  label: string;
  detail: string;
  detailLabel?: string;
}

function getStatusBorderStyle(status: GisStatusKey): React.CSSProperties["borderStyle"] {
  return status === "demo" ? "dashed"
    : status === "synthetic" ? "dotted"
      : status === "generated" || status === "external" ? "dashed"
        : status === "metadata-only" ? "dotted"
          : "solid";
}

export const GisStatusChip: React.FC<GisStatusChipProps> = ({
  status,
  label,
  density = "default",
  style,
  className,
  title,
  "data-testid": testId,
}) => {
  const tok = MAP_STATUS_TOKENS[status];
  const d = MAP_DENSITY[density];
  const borderStyle = getStatusBorderStyle(status);

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: MAP_SPACING.xs,
    minHeight: d.rowHeight,
    minWidth: 0,
    maxWidth: "100%",
    padding: `2px 8px`,
    borderRadius: MAP_RADIUS.sm,
    fontSize: d.fontSize,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    ...MAP_TEXT_STYLES.chipLabel,
    color: tok.text,
    background: tok.bg,
    border: `1px solid ${tok.border}`,
    borderStyle,
    overflow: "visible",
    textOverflow: "clip",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    ...style,
  };

  /* statusFlash fires on mount; callers change key prop to re-trigger on state change */
  return (
    <span
      data-testid={testId}
      data-status={status}
      data-gis-status-chip="true"
      title={title ?? (typeof label === "string" ? label : undefined)}
      className={`${motionStyles.statusFlash} ${primitiveStyles.statusChip}${className ? ` ${className}` : ""}`}
      style={chipStyle}
    >
      {label ?? status}
    </span>
  );
};

export const GisSplitStatusChip: React.FC<GisSplitStatusChipProps> = ({
  status,
  label,
  detail,
  detailLabel,
  density = "default",
  style,
  className,
  title,
  "data-testid": testId,
}) => {
  const tok = MAP_STATUS_TOKENS[status];
  const d = MAP_DENSITY[density];
  const borderStyle = getStatusBorderStyle(status);
  const accessibleLabel = detailLabel ?? `${label}: ${detail}`;

  return (
    <span
      aria-label={accessibleLabel}
      data-testid={testId}
      data-status={status}
      data-gis-split-status-chip="true"
      className={`${motionStyles.statusFlash} ${primitiveStyles.statusChip}${className ? ` ${className}` : ""}`}
      title={title ?? accessibleLabel}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        minHeight: d.rowHeight,
        minWidth: 0,
        maxWidth: "100%",
        border: `1px solid ${tok.border}`,
        borderStyle,
        borderRadius: MAP_RADIUS.sm,
        overflow: "hidden",
        fontSize: d.fontSize,
        fontFamily: MAP_TYPOGRAPHY.fontFamily,
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: `2px ${MAP_SPACING.sm}`,
          background: tok.bg,
          color: tok.text,
          fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
          borderRight: `1px solid ${tok.border}`,
          ...MAP_TEXT_STYLES.chipLabel,
          overflow: "visible",
          textOverflow: "clip",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          minWidth: 0,
          padding: `2px ${MAP_SPACING.sm}`,
          background: MAP_COLORS.bgPanel,
          color: MAP_COLORS.textSecondary,
          ...MAP_TEXT_STYLES.valueWrap,
        }}
      >
        {detail}
      </span>
    </span>
  );
};
