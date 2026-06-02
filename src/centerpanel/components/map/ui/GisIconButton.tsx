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
import motionStyles from "../design/motion.module.css";

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
    position: "relative",
    transition: MAP_TRANSITIONS.fast,
    opacity: disabled ? 0.45 : 1,
    flexShrink: 0,
    outline: "none",
    /* accent stripe rendered via animated child span — see accentGrow below */
    boxShadow: "none",
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
    const { "aria-describedby": ariaDescribedBy, ...buttonProps } = props;
    const { dimension } = SIZE_MAP[size];
    const disabledReasonId = React.useId();
    const computedStyle = buildButtonStyle(active, variant, disabled, dimension);
    const describedBy = disabled && disabledReason
      ? [ariaDescribedBy, disabledReasonId].filter(Boolean).join(" ")
      : ariaDescribedBy;

    const disabledProps =
      disabled && disabledReason
        ? { "data-disabled-reason": disabledReason, title: disabledReason }
        : { title: label };

    return (
      <button
        {...buttonProps}
        {...disabledProps}
        ref={ref}
        type="button"
        data-gis-icon-button="true"
        aria-label={label}
        aria-pressed={active}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        style={{ ...computedStyle, ...style }}
      >
        {/* Animated inset accent bar — mounts when active, triggers accentGrow animation */}
        {active && variant === "ghost" ? (
          <span
            aria-hidden
            className={motionStyles.accentGrow}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "2px",
              background: MAP_COLORS.interaction,
              transformOrigin: "left center",
            }}
          />
        ) : null}
        {icon}
        {disabled && disabledReason ? (
          <span id={disabledReasonId} style={mapStyles.srOnly}>
            Disabled: {disabledReason}
          </span>
        ) : null}
      </button>
    );
  },
);
GisIconButton.displayName = "GisIconButton";
