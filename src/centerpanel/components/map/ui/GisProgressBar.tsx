/**
 * Prompt 36 — progress bar primitive.
 * Respects prefers-reduced-motion by removing the CSS transition when reduced.
 * Uses role="progressbar" with aria-valuenow/min/max.
 * Indeterminate mode (value=undefined) uses a striped background instead of animation
 * to avoid motion that persists indefinitely.
 */
import React from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_STROKES,
  MAP_TRANSITIONS,
} from "../mapTokens";
import motionStyles from "../design/motion.module.css";
import primitiveStyles from "./GisPrimitive.module.css";

export interface GisProgressBarProps {
  /** 0–100. Omit for indeterminate. */
  value?: number;
  label: string;
  height?: string;
  color?: string;
  reducedMotion?: boolean;
  style?: React.CSSProperties;
  className?: string;
  "data-testid"?: string;
}

export const GisProgressBar: React.FC<GisProgressBarProps> = ({
  value,
  label,
  height = "3px",
  color,
  reducedMotion = false,
  style,
  className,
  "data-testid": testId,
}) => {
  const isIndeterminate = value === undefined;
  const pct = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));
  const fillColor = color ?? MAP_COLORS.interaction;

  const trackStyle: React.CSSProperties = {
    width: "100%",
    height,
    borderRadius: MAP_RADIUS.badge,
    background: MAP_COLORS.interactionSubtle,
    border: MAP_STROKES.hairlineSubtle,
    overflow: "hidden",
    ...style,
  };

  const fillStyle: React.CSSProperties = {
    height: "100%",
    width: isIndeterminate ? "40%" : `${pct}%`,
    borderRadius: MAP_RADIUS.badge,
    background: fillColor,
    transition: reducedMotion ? "none" : MAP_TRANSITIONS.standard,
    /* Indeterminate without motion: static 40% fill — no infinite animation */
    opacity: isIndeterminate ? 0.55 : 1,
  };

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={isIndeterminate ? undefined : pct}
      aria-valuemin={isIndeterminate ? undefined : 0}
      aria-valuemax={isIndeterminate ? undefined : 100}
      data-testid={testId}
      data-gis-progress-bar="true"
      className={`${primitiveStyles.progressTrack}${className ? ` ${className}` : ""}`}
      style={trackStyle}
    >
      <div
        style={fillStyle}
        className={`${primitiveStyles.progressFill}${!reducedMotion && !isIndeterminate ? ` ${motionStyles.progressFill}` : ""}`}
      />
    </div>
  );
};
