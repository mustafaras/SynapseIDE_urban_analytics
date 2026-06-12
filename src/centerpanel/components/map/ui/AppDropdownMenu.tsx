import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { getMapOverlayPortalRoot } from "./mapOverlayPortal";

export type AppDropdownAlign = "start" | "center" | "end";

export interface AppDropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: AppDropdownAlign;
  sideOffset?: number;
  minWidth?: number;
  maxWidth?: number | string;
  ariaLabel?: string;
  testId?: string;
  contentStyle?: React.CSSProperties;
}

export interface AppMenuItemProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  shortcut?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
  role?: string;
  checked?: boolean;
  inset?: boolean;
  style?: React.CSSProperties;
  testId?: string;
}

export interface AppMenuSectionProps {
  title?: React.ReactNode;
  children: React.ReactNode;
}

export interface AppMenuPanelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export interface ToolbarMenuButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title" | "style" | "onClick"> {
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  warning?: boolean;
  expanded?: boolean;
  showChevron?: boolean;
  compact?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  ariaLabel?: string;
  testId?: string;
  style?: React.CSSProperties;
}

const contentBaseStyle: React.CSSProperties = {
  zIndex: MAP_Z_INDEX.popover,
  display: "grid",
  gap: MAP_SPACING.zero,
  padding: MAP_SPACING.zero,
  borderRadius: "12px",
  border: MAP_STROKES.none,
  background: MAP_COLORS.transparent,
  boxShadow: MAP_SHADOWS.none,
  color: MAP_COLORS.text,
  pointerEvents: "auto",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
};

const panelSurfaceStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  minWidth: 0,
  borderRadius: "12px",
  border: MAP_STROKES.hairlineStrong,
  background: "color-mix(in srgb, var(--syn-surface-panel, #111827) 98%, #05070d 2%)",
  boxShadow: "0 22px 56px rgba(0, 0, 0, 0.46)",
  color: MAP_COLORS.text,
  overflow: "hidden",
  backdropFilter: "blur(14px)",
};

const itemBaseStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "2.75rem",
  display: "grid",
  gridTemplateColumns: "1.125rem minmax(0, 1fr) auto",
  alignItems: "start",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid transparent",
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  textAlign: "left",
  cursor: "pointer",
};

const itemLabelStackStyle: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "0.1875rem",
};

const itemDescriptionStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: "0.6875rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.normal,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.1875rem",
};

const sectionTitleStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: "1.25rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  borderTop: MAP_STROKES.hairlineSubtle,
};

const toolbarMenuButtonStyle = (
  active: boolean,
  disabled: boolean,
  warning: boolean,
  compact: boolean,
): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: compact ? "0.25rem" : "0.375rem",
  minHeight: compact ? "1.75rem" : "1.875rem",
  padding: compact ? `0 ${MAP_SPACING.xs}` : `0 ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: warning
    ? "1px solid color-mix(in srgb, var(--syn-status-warning, #f59e0b) 38%, transparent)"
    : "1px solid transparent",
  background: active
    ? "color-mix(in srgb, var(--syn-interaction-active, #3794ff) 14%, transparent)"
    : warning
      ? "color-mix(in srgb, var(--syn-status-warning, #f59e0b) 10%, transparent)"
      : "transparent",
  color: warning ? MAP_COLORS.warning : active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: active ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.45 : 1,
  whiteSpace: "nowrap",
});

export const ToolbarMenuButton = React.forwardRef<HTMLButtonElement, ToolbarMenuButtonProps>(
(
  {
    label,
    icon,
    badge,
    active = false,
    disabled = false,
    warning = false,
    expanded = false,
    showChevron = true,
    compact = false,
    onClick,
    title,
    ariaLabel,
    testId,
    style,
    ...rest
  },
  ref,
): React.ReactElement => {
  /* `...rest` carries the handlers Radix `Trigger asChild` injects
     (onPointerDown, onKeyDown, aria-expanded, aria-controls, data-state).
     They MUST reach the DOM button — previously they were swallowed here,
     which left every dropdown trigger inert. Spread last so Radix-supplied
     aria attributes win over our static defaults. */
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={ariaLabel ?? title ?? label}
      aria-expanded={showChevron ? expanded : undefined}
      aria-haspopup={showChevron ? "menu" : undefined}
      disabled={disabled}
      data-testid={testId}
      {...rest}
      style={{ ...toolbarMenuButtonStyle(active || expanded, disabled, warning, compact), ...style }}
    >
      {icon}
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {badge != null ? (
        <span
          aria-hidden="true"
          style={{
            minWidth: "1rem",
            height: "1rem",
            padding: "0 0.25rem",
            borderRadius: MAP_RADIUS.sm,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: active || expanded ? "rgba(255,255,255,0.08)" : MAP_COLORS.selectedSubtle,
            color: active || expanded ? MAP_COLORS.text : MAP_COLORS.interaction,
            fontSize: MAP_TYPOGRAPHY.fontSize.xs,
            fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
          }}
        >
          {badge}
        </span>
      ) : null}
      {showChevron ? <ChevronDown size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" /> : null}
    </button>
  );
},
);

export function AppMenuSection({ title, children }: AppMenuSectionProps): React.ReactElement {
  return (
    <section style={sectionStyle}>
      {title ? <div style={sectionTitleStyle}>{title}</div> : null}
      {children}
    </section>
  );
}

export function AppMenuPanel({ children, style }: AppMenuPanelProps): React.ReactElement {
  return <div style={{ ...panelSurfaceStyle, ...style }}>{children}</div>;
}

export function AppMenuItem({
  icon,
  label,
  description,
  shortcut,
  disabled = false,
  destructive = false,
  onSelect,
  role,
  checked,
  inset = false,
  style,
  testId,
}: AppMenuItemProps): React.ReactElement {
  const hasDescription = description != null;
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={() => {
        if (disabled) return;
        onSelect?.();
      }}
      role={role}
      aria-checked={checked}
      data-testid={testId}
      style={{
        ...itemBaseStyle,
        minHeight: hasDescription ? itemBaseStyle.minHeight : "2.125rem",
        alignItems: hasDescription ? itemBaseStyle.alignItems : "center",
        color: destructive ? MAP_COLORS.error : disabled ? MAP_COLORS.textMuted : MAP_COLORS.textSecondary,
        gridTemplateColumns: inset ? "minmax(0, 1fr) auto" : itemBaseStyle.gridTemplateColumns,
        ...(style ?? {}),
      }}
    >
      {inset ? null : <span aria-hidden="true">{icon}</span>}
      <span style={itemLabelStackStyle}>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {description != null ? <span style={itemDescriptionStyle}>{description}</span> : null}
      </span>
      {shortcut ? (
        <span style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
          {shortcut}
        </span>
      ) : checked != null ? (
        <span style={{ color: checked ? MAP_COLORS.interaction : MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
          {checked ? "On" : "Off"}
        </span>
      ) : <span aria-hidden="true" />}
    </DropdownMenu.Item>
  );
}

export function AppDropdownMenu({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  sideOffset = 8,
  minWidth,
  maxWidth,
  ariaLabel,
  testId,
  contentStyle,
}: AppDropdownMenuProps): React.ReactElement {
  /* Radix's Trigger toggles open state on real pointerdown and handles
     Enter/Space/ArrowDown/Escape itself. The previous implementation also
     toggled on every click, which raced with Radix's pointerdown toggle
     (pointerdown opened the menu, the follow-up click closed it) and made
     every dropdown look dead. We now only toggle for programmatic or
     synthetic clicks (event.detail === 0, e.g. element.click() in tests or
     assistive tech) where no pointerdown ever fired. */
  const existingOnClick = trigger.props.onClick as ((event: React.MouseEvent) => void) | undefined;
  const triggerWithFallbackToggle = React.cloneElement(trigger, {
    onClick: (event: React.MouseEvent) => {
      existingOnClick?.(event);
      if (event.defaultPrevented) return;
      if (event.detail === 0) {
        onOpenChange(!open);
      }
    },
  });

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        {triggerWithFallbackToggle}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={getMapOverlayPortalRoot() ?? undefined}>
        <DropdownMenu.Content
          side="bottom"
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          collisionBoundary={typeof document !== "undefined" ? document.body : undefined}
          loop
          aria-label={ariaLabel}
          data-testid={testId}
          style={{
            ...contentBaseStyle,
            minWidth: minWidth != null ? `${minWidth}px` : undefined,
            maxWidth,
            ...contentStyle,
          }}
        >
          <AppMenuPanel>{children}</AppMenuPanel>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
