/**
 * Prompt 36 — toolbar container primitive.
 * Wraps a set of icon buttons in a horizontal role="toolbar" group with optional
 * dividers between logical groups.
 */
import React from "react";
import { MoreHorizontal } from "lucide-react";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_STROKES,
} from "../mapTokens";
import { GisIconButton, type GisIconButtonProps } from "./GisIconButton";

export interface GisToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label": string;
  /** Visual container pill (background + shadow). Set false to embed inline. */
  pill?: boolean;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
  gap?: string;
}

export interface GisToolbarDividerProps {
  orientation?: "horizontal" | "vertical";
}

export interface GisToolbarOverflowTriggerProps
  extends Omit<GisIconButtonProps, "icon" | "label" | "active" | "variant"> {
  label?: string;
  open?: boolean;
}

export const GisToolbarDivider: React.FC<GisToolbarDividerProps> = ({
  orientation = "horizontal",
}) => (
  <span
    aria-hidden
    style={
      orientation === "vertical"
        ? {
            width: "1px",
            height: "1.25rem",
            background: MAP_COLORS.hairlineSubtle,
            flexShrink: 0,
          }
        : {
            height: "1px",
            width: "1.25rem",
            background: MAP_COLORS.hairlineSubtle,
            flexShrink: 0,
          }
    }
  />
);

export const GisToolbar: React.FC<GisToolbarProps> = ({
  "aria-label": ariaLabel,
  pill = false,
  orientation = "horizontal",
  gap = "2px",
  children,
  style,
  ...props
}) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: "center",
    gap,
    padding: pill ? "3px" : "0",
    background: pill ? MAP_COLORS.bgPanel : "transparent",
    border: pill ? MAP_STROKES.hairline : MAP_STROKES.none,
    borderRadius: pill ? MAP_RADIUS.badge : MAP_RADIUS.none,
    boxShadow: pill ? MAP_SHADOWS.panel : "none",
    ...style,
  };

  return (
    <div
      {...props}
      role="toolbar"
      data-gis-toolbar="true"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

export const GisToolbarOverflowTrigger = React.forwardRef<
  HTMLButtonElement,
  GisToolbarOverflowTriggerProps
>(({ label = "More actions", open = false, size = "sm", ...props }, ref) => (
  <GisIconButton
    {...props}
    ref={ref}
    label={label}
    icon={<MoreHorizontal size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
    size={size}
    variant="ghost"
    active={open}
    showPressedState={false}
    aria-haspopup="menu"
    aria-expanded={open}
    data-gis-toolbar-overflow-trigger="true"
  />
));
GisToolbarOverflowTrigger.displayName = "GisToolbarOverflowTrigger";
