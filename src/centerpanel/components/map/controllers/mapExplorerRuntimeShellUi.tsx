import React from "react";
import {
  Activity,
  Box,
  Compass,
  Database,
  FileImage,
  History,
  Layers3,
  type LucideIcon,
  Palette,
  Puzzle,
  ShieldAlert,
  Workflow,
} from "lucide-react";

import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_NUMERIC,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "../mapTokens";
import {
  MAP_RUNTIME_PRIMARY_ACTIVITY_DEFINITIONS,
  MAP_RUNTIME_UTILITY_ACTIVITY_DEFINITIONS,
  type MapActivityDefinition,
} from "../mapActivityRuntime";

export const MAP_NAVIGATOR_STAGE_MARGIN = MAP_NUMERIC.navigatorStageMargin;
export const MAP_NAVIGATOR_STAGE_TOP = MAP_NUMERIC.navigatorStageTop;
export const MAP_NAVIGATOR_STAGE_BOTTOM = MAP_NUMERIC.navigatorStageBottom;
export const MAP_ACTIVITY_RAIL_WIDTH = "2.625rem";

const MAP_ACTIVITY_ICON_COMPONENTS: Record<string, LucideIcon> = {
  Activity,
  Box,
  Compass,
  Database,
  FileImage,
  History,
  Layers3,
  Palette,
  Puzzle,
  ShieldAlert,
  Workflow,
};

export const MAP_PRIMARY_ACTIVITY_DEFINITIONS = MAP_RUNTIME_PRIMARY_ACTIVITY_DEFINITIONS;
export const MAP_UTILITY_ACTIVITY_DEFINITIONS = MAP_RUNTIME_UTILITY_ACTIVITY_DEFINITIONS;

export function renderMapActivityIcon(activity: MapActivityDefinition): React.ReactElement {
  const Icon = MAP_ACTIVITY_ICON_COMPONENTS[activity.iconName] ?? Compass;
  return <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />;
}

export function formatMapActivityTooltip(activity: MapActivityDefinition): string {
  return `${activity.label}: ${activity.description}`;
}

export const srOnlyFocusable: React.CSSProperties = {
  ...mapStyles.srOnly,
};

export const mapActivityRailOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  height: "100%",
};

export const modalControlClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
};

export const modalControlCloseButtonStyle: React.CSSProperties = {
  border: "1px solid color-mix(in srgb, var(--syn-error, #f87171) 46%, var(--syn-border-strong, rgba(148, 163, 184, 0.42)))",
  color: "var(--syn-error, #f87171)",
};

export const modalControlCloseDividerStyle: React.CSSProperties = {
  width: 1,
  height: "1.25rem",
  background: "var(--syn-border-subtle, rgba(148, 163, 184, 0.28))",
  margin: "0 0.125rem",
};

export const contextToolbarCountStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "1.25rem",
  padding: `0 ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.xs,
  border: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.3)) 45%, transparent)",
  background: "color-mix(in srgb, var(--syn-surface-subtle, rgba(15, 23, 42, 0.26)) 34%, transparent)",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

export const contextBarDividerStyle: React.CSSProperties = {
  width: 1,
  height: "1.5rem",
  background: "var(--syn-border-subtle, rgba(148, 163, 184, 0.28))",
  flexShrink: 0,
  margin: "0 0.125rem",
  alignSelf: "center",
};
