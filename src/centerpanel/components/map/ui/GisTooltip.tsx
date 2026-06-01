/**
 * Prompt 36 — lightweight tooltip primitive.
 * Wraps a trigger element and shows a text tooltip above it on focus/hover.
 * Uses CSS position:absolute; no JS Portal (keeps it simple and avoids z-index wars).
 * For disabled-reason tooltips, prefer GisIconButton's built-in title/data-disabled-reason
 * pattern which is accessible without JavaScript.
 */
import React, { useState } from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";

export interface GisTooltipProps {
  content: string;
  children: React.ReactElement;
  placement?: "top" | "bottom";
  disabled?: boolean;
}

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 4px)",
  left: "50%",
  transform: "translateX(-50%)",
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.hairlineStrong}`,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.dropdown,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  color: MAP_COLORS.text,
  maxWidth: "16rem",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  pointerEvents: "none",
  zIndex: MAP_Z_INDEX.dropdown,
};

export const GisTooltip: React.FC<GisTooltipProps> = ({
  content,
  children,
  placement = "top",
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);

  if (disabled) {
    return children;
  }

  const bottomStyle: React.CSSProperties =
    placement === "bottom"
      ? { bottom: "auto", top: "calc(100% + 4px)" }
      : {};

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible ? (
        <span role="tooltip" style={{ ...tooltipStyle, ...bottomStyle }}>
          {content}
        </span>
      ) : null}
    </span>
  );
};
