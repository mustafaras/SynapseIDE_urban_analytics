/**
 * Prompt 36 — accessible icon button with disabled-reason pattern.
 * Icon-only controls always carry an explicit aria-label.
 * When disabled and a disabledReason is supplied, the reason is exposed via
 * data-disabled-reason + title so hover and assistive tech can surface it.
 */
import React from "react";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_TRANSITIONS,
  mapStyles,
} from "../mapTokens";

export interface GisIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible label — required, never empty. */
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  size?: "sm" | "md";
  /** Ghost = transparent active bg with inset accent; accent = filled active bg. */
  variant?: "ghost" | "accent";
  /**
   * Human-readable reason shown via tooltip when the button is disabled.
   * Required whenever disabled is true so the user understands why.
   */
  disabledReason?: string;
}

const SIZE_MAP = {
  sm: { dimension: "1.75rem", iconSize: MAP_ICON_SIZES.xs },
  md: { dimension: "2rem", iconSize: MAP_ICON_SIZES.sm },
} as const;

function buildButtonStyle(
  active: boolean,
  variant: "ghost" | "accent",
  disabled: boolean | undefined,
  dimension: string,
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: dimension,
    height: dimension,
    border: "none",
    borderRadius: MAP_RADIUS.sm,
    cursor: disabled ? "not-allowed" : "pointer",
    background: active
      ? variant === "accent"
        ? MAP_COLORS.interaction
        : MAP_COLORS.selectedSubtle
      : "transparent",
    color: disabled
      ? MAP_COLORS.textMuted
      : active
        ? variant === "accent"
          ? MAP_COLORS.bgPanel
          : MAP_COLORS.interaction
        : MAP_COLORS.textSecondary,
    transition: MAP_TRANSITIONS.fast,
    opacity: disabled ? 0.45 : 1,
    flexShrink: 0,
    outline: "none",
    /* inset left accent stripe for ghost active — matches mapStyles.sidePanelRowActive */
    boxShadow:
      active && variant === "ghost"
        ? `inset 2px 0 0 ${MAP_COLORS.interaction}`
        : "none",
  };
}

export const GisIconButton = React.forwardRef<
  HTMLButtonElement,
  GisIconButtonProps
>(
  (
    {
      label,
      icon,
      active = false,
      size = "md",
      variant = "ghost",
      disabled,
      disabledReason,
      style,
      ...props
    },
    ref,
  ) => {
    const { dimension } = SIZE_MAP[size];
    const computedStyle = buildButtonStyle(active, variant, disabled, dimension);

    const disabledProps =
      disabled && disabledReason
        ? { "data-disabled-reason": disabledReason, title: disabledReason }
        : { title: label };

    return (
      <button
        {...props}
        {...disabledProps}
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        style={{ ...computedStyle, ...style }}
      >
        {/* clone icon with resolved size — callers pass MAP_ICON_SIZES props directly */}
        {icon}
      </button>
    );
  },
);
GisIconButton.displayName = "GisIconButton";
