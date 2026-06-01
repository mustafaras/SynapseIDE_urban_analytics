/**
 * Prompt 36 — status chip primitive.
 * Accepts a semantic GisStatusKey and renders text/bg/border via MAP_STATUS_TOKENS.
 * For custom appearance, pass explicit color props.
 */
import React from "react";
import {
  MAP_DENSITY,
  MAP_STATUS_TOKENS,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  type GisDensity,
  type GisStatusKey,
} from "../mapTokens";
import motionStyles from "../design/motion.module.css";

export interface GisStatusChipProps {
  status: GisStatusKey;
  label?: string;
  density?: GisDensity;
  style?: React.CSSProperties;
  className?: string;
  /** data-testid forwarded to the root span */
  "data-testid"?: string;
}

export const GisStatusChip: React.FC<GisStatusChipProps> = ({
  status,
  label,
  density = "default",
  style,
  className,
  "data-testid": testId,
}) => {
  const tok = MAP_STATUS_TOKENS[status];
  const d = MAP_DENSITY[density];

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: d.rowHeight,
    padding: `2px 8px`,
    borderRadius: "3px",
    fontSize: d.fontSize,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    ...MAP_TEXT_STYLES.chipLabel,
    color: tok.text,
    background: tok.bg,
    border: `1px solid ${tok.border}`,
    borderStyle: status === "demo" ? "dashed" : status === "synthetic" ? "dotted" : "solid",
    ...style,
  };

  /* statusFlash fires on mount; callers change key prop to re-trigger on state change */
  return (
    <span
      data-testid={testId}
      data-status={status}
      data-gis-status-chip="true"
      className={`${motionStyles.statusFlash}${className ? ` ${className}` : ""}`}
      style={chipStyle}
    >
      {label ?? status}
    </span>
  );
};
