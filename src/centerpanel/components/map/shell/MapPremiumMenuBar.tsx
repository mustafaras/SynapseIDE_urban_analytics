import React from "react";
import { Menu } from "lucide-react";

import {
  MAP_ICON_SIZES,
  MAP_SPACING,
  MAP_STROKES,
} from "../mapTokens";
import { AppDropdownMenu, AppMenuItem, AppMenuSection, ToolbarMenuButton } from "../ui";
import type { MapPremiumMenuModel, MapPremiumQuickActionModel } from "./mapMenuModel";

export interface MapPremiumMenuBarProps {
  menus: readonly MapPremiumMenuModel[];
  quickActions: readonly MapPremiumQuickActionModel[];
  width: number;
}

const menuBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  width: "100%",
};

const menusRailStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.125rem",
  minWidth: 0,
  overflow: "hidden",
};

const quickActionsRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  flexShrink: 0,
  paddingLeft: MAP_SPACING.sm,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

const compactMenuContentStyle: React.CSSProperties = {
  width: "min(26rem, calc(100vw - 1rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
};

function getMenuLabel(menu: MapPremiumMenuModel, width: number, open: boolean): string {
  if (width >= 1440) {
    return menu.label;
  }
  if (width >= 1200) {
    return menu.shortLabel;
  }
  return open ? menu.shortLabel : "";
}

function renderMenuSections(menu: MapPremiumMenuModel): React.ReactNode {
  return menu.sections.map((section) => (
    <AppMenuSection key={section.id} title={section.title}>
      {section.items.map((item) => (
        <AppMenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          description={item.disabled ? item.disabledReason ?? item.description : item.description}
          shortcut={item.shortcut}
          disabled={item.disabled}
          checked={item.checked}
          destructive={item.destructive}
          onSelect={item.onSelect}
          testId={item.testId}
        />
      ))}
    </AppMenuSection>
  ));
}

export function MapPremiumMenuBar({ menus, quickActions, width }: MapPremiumMenuBarProps): React.ReactElement {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const compactMode = width < 900;
  const iconOnlyMode = width < 1200;

  if (compactMode) {
    return (
      <div style={menuBarStyle} role="menubar" aria-label="Premium map menu bar" data-testid="map-premium-menu-bar" data-menu-mode="compact">
        <AppDropdownMenu
          open={openMenuId === "compact"}
          onOpenChange={(open) => setOpenMenuId(open ? "compact" : null)}
          align="start"
          minWidth={360}
          maxWidth="min(28rem, calc(100vw - 1rem))"
          ariaLabel="Premium map menu"
          testId="map-premium-menu-compact-content"
          contentStyle={compactMenuContentStyle}
          trigger={(
            <ToolbarMenuButton
              label="Menu"
              icon={<Menu size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />}
              active={openMenuId === "compact"}
              expanded={openMenuId === "compact"}
              compact
              title="Open premium map menu"
              ariaLabel="Open premium map menu"
              testId="map-premium-menu-compact"
            />
          )}
        >
          <AppMenuSection title="Quick Actions">
            {quickActions.map((action) => (
              <AppMenuItem
                key={action.id}
                icon={action.icon}
                label={action.label}
                description={action.disabled ? action.disabledReason ?? action.title : action.title}
                disabled={action.disabled}
                checked={action.active}
                onSelect={action.disabled ? undefined : action.onClick}
                testId={action.testId}
              />
            ))}
          </AppMenuSection>
          {menus.map((menu) => (
            <AppMenuSection key={menu.id} title={menu.label}>
              {menu.sections.flatMap((section) => section.items).map((item) => (
                <AppMenuItem
                  key={`${menu.id}-${item.id}`}
                  icon={item.icon}
                  label={item.label}
                  description={item.disabled ? item.disabledReason ?? item.description : item.description}
                  shortcut={item.shortcut}
                  disabled={item.disabled}
                  checked={item.checked}
                  destructive={item.destructive}
                  onSelect={item.onSelect}
                  testId={item.testId}
                />
              ))}
            </AppMenuSection>
          ))}
        </AppDropdownMenu>

        <div style={quickActionsRailStyle} aria-label="Quick map actions">
          {quickActions.slice(0, 2).map((action) => (
            <ToolbarMenuButton
              key={action.id}
              label={iconOnlyMode ? "" : action.shortLabel}
              icon={action.icon}
              badge={action.badge}
              active={action.active}
              disabled={action.disabled}
              compact
              showChevron={false}
              title={action.disabled ? `${action.title}. ${action.disabledReason ?? "Unavailable in the current map state."}` : action.title}
              ariaLabel={action.disabled ? `${action.label}. ${action.disabledReason ?? "Unavailable in the current map state."}` : action.label}
              onClick={action.disabled ? undefined : action.onClick}
              testId={action.testId}
              style={{ minWidth: "2rem" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={menuBarStyle} role="menubar" aria-label="Premium map menu bar" data-testid="map-premium-menu-bar" data-menu-mode={iconOnlyMode ? "icons" : width < 1440 ? "compact" : "full"}>
      <div style={menusRailStyle}>
        {menus.map((menu) => {
          const open = openMenuId === menu.id;
          return (
            <AppDropdownMenu
              key={menu.id}
              open={open}
              onOpenChange={(nextOpen) => setOpenMenuId(nextOpen ? menu.id : null)}
              align={menu.id === "publish" || menu.id === "help" ? "end" : "start"}
              minWidth={320}
              maxWidth={menu.id === "analyze" ? 520 : 460}
              ariaLabel={`${menu.label} menu`}
              testId={menu.menuTestId}
              trigger={(
                <ToolbarMenuButton
                  label={getMenuLabel(menu, width, open)}
                  icon={menu.icon}
                  active={open}
                  expanded={open}
                  compact={width < 1440}
                  title={menu.title}
                  ariaLabel={menu.title}
                  testId={menu.triggerTestId}
                  style={iconOnlyMode ? { minWidth: "2rem" } : undefined}
                />
              )}
            >
              {renderMenuSections(menu)}
            </AppDropdownMenu>
          );
        })}
      </div>

      <div style={quickActionsRailStyle} aria-label="Quick map actions">
        {quickActions.map((action) => (
          <ToolbarMenuButton
            key={action.id}
            label={width >= 1440 ? action.label : width >= 1200 ? action.shortLabel : ""}
            icon={action.icon}
            badge={action.badge}
            active={action.active}
            disabled={action.disabled}
            compact={width < 1440}
            showChevron={false}
            title={action.disabled ? `${action.title}. ${action.disabledReason ?? "Unavailable in the current map state."}` : action.title}
            ariaLabel={action.disabled ? `${action.label}. ${action.disabledReason ?? "Unavailable in the current map state."}` : action.label}
            onClick={action.disabled ? undefined : action.onClick}
            testId={action.testId}
            style={width < 1200 ? { minWidth: "2rem" } : undefined}
          />
        ))}
      </div>
    </div>
  );
}