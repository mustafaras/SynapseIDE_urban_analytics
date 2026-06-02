/**
 * Prompt 05 — Sidebar Host.
 *
 * `MapWorkbenchSidebar` is the single contextual left sidebar host for the
 * premium Map Explorer workbench. It is a presentational shell that mounts an
 * activity's content (Overview, Data, Layers, ...) using existing components.
 *
 * Responsibilities:
 *   - activity title
 *   - compact tab strip (reuses the accessible `GisTabs` primitive)
 *   - scroll containment (the `GisTabs` tabpanel owns the scroll region)
 *   - empty states (reuses the `GisEmptyState` primitive)
 *   - close / collapse behavior
 *
 * It deliberately does not own analytical state, geometry, or panel internals.
 * Content is provided lazily by the parent through `tab.render()` so heavy
 * panels mount only when their tab is active.
 */
import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  MAP_COLORS,
  MAP_PANEL_SIZES,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisEmptyState, GisIconButton, GisTabs } from "../ui";
import type { GisTab } from "../ui";
import { IconClose } from "../MapIcons";

export interface MapWorkbenchSidebarTab {
  /** Stable tab id (typically a `MapSidebarTabId`). */
  id: string;
  /** Short tab label shown in the strip. */
  label: string;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
  /** Disable the tab and expose a reason. */
  disabled?: boolean;
  disabledReason?: string;
  /** Lazily renders the tab body. Only called for the active tab. */
  render: () => React.ReactNode;
  /** When true, the empty state is shown instead of `render()`. */
  isEmpty?: boolean;
  /** Empty-state copy (defaults provided). */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export interface MapWorkbenchSidebarProps {
  /** Activity title shown in the sidebar header. */
  title: string;
  /** Optional sub-label / breadcrumb shown next to the title. */
  subtitle?: string;
  /** Tab definitions for the active activity. */
  tabs: MapWorkbenchSidebarTab[];
  /** Currently active tab id. */
  activeTabId: string;
  /** Select a tab. */
  onTabChange: (id: string) => void;
  /** Close the sidebar entirely. */
  onClose?: () => void;
  /** Toggle the collapsed rail. */
  onToggleCollapse?: () => void;
  /** Whether the sidebar is collapsed to a slim rail. */
  collapsed?: boolean;
  /** Sidebar width when expanded. */
  width?: number | string;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

const COLLAPSED_WIDTH = "2.25rem";

const shellBaseStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  borderRight: MAP_STROKES.hairline,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  zIndex: MAP_Z_INDEX.sidebar,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "2.375rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm} ${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  background: MAP_COLORS.bgHeader,
  borderBottom: MAP_STROKES.hairline,
  flexShrink: 0,
};

const titleWrapStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "grid",
  gap: "0.125rem",
  overflow: "hidden",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
  letterSpacing: 0,
  ...MAP_TEXT_STYLES.titleWrap,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
  ...MAP_TEXT_STYLES.truncate,
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexShrink: 0,
};

const collapsedRailStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  width: COLLAPSED_WIDTH,
  minWidth: COLLAPSED_WIDTH,
  height: "100%",
  padding: `${MAP_SPACING.xs} 0`,
  background: MAP_COLORS.bgPanel,
  borderRight: MAP_STROKES.hairline,
  zIndex: MAP_Z_INDEX.sidebar,
  overflow: "hidden",
};

const collapsedTitleStyle: React.CSSProperties = {
  writingMode: "vertical-rl",
  transform: "rotate(180deg)",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.textSecondary,
  letterSpacing: 0,
  whiteSpace: "nowrap",
};

const singleTabBodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
};

export const MapWorkbenchSidebar: React.FC<MapWorkbenchSidebarProps> = ({
  title,
  subtitle,
  tabs,
  activeTabId,
  onTabChange,
  onClose,
  onToggleCollapse,
  collapsed = false,
  width = MAP_PANEL_SIZES.sidebarExpanded,
  style,
  "data-testid": testId = "map-workbench-sidebar",
}) => {
  const resolvedActiveId =
    tabs.find((tab) => tab.id === activeTabId)?.id ?? tabs[0]?.id ?? "";
  const activeTab = tabs.find((tab) => tab.id === resolvedActiveId) ?? null;

  if (collapsed) {
    return (
      <aside
        data-testid={testId}
        data-map-workbench-sidebar="true"
        data-collapsed="true"
        aria-label={`${title} sidebar (collapsed)`}
        style={collapsedRailStyle}
      >
        <GisIconButton
          label={`Expand ${title} sidebar`}
          icon={<PanelLeftOpen size={14} />}
          data-testid="map-workbench-sidebar-expand"
          onClick={onToggleCollapse}
        />
        <span aria-hidden style={collapsedTitleStyle}>
          {title}
        </span>
      </aside>
    );
  }

  const renderBody = (): React.ReactNode => {
    if (!activeTab) {
      return (
        <GisEmptyState
          data-testid="map-workbench-sidebar-empty"
          title="Nothing to show yet"
          description="This activity has no panels available."
        />
      );
    }
    if (activeTab.isEmpty) {
      return (
        <GisEmptyState
          data-testid="map-workbench-sidebar-empty"
          title={activeTab.emptyTitle ?? "Nothing to show yet"}
          {...(activeTab.emptyDescription !== undefined
            ? { description: activeTab.emptyDescription }
            : {})}
          {...(activeTab.emptyAction !== undefined ? { action: activeTab.emptyAction } : {})}
        />
      );
    }
    return activeTab.render();
  };

  const gisTabs: GisTab[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    ...(tab.icon !== undefined ? { icon: tab.icon } : {}),
    ...(tab.disabled !== undefined ? { disabled: tab.disabled } : {}),
    ...(tab.disabledReason !== undefined ? { disabledReason: tab.disabledReason } : {}),
  }));

  return (
    <aside
      data-testid={testId}
      data-map-workbench-sidebar="true"
      data-active-tab={resolvedActiveId}
      aria-label={`${title} sidebar`}
      style={{ ...shellBaseStyle, width, maxWidth: "100%", ...style }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onClose) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div style={headerStyle}>
        <div style={titleWrapStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {subtitle ? (
            <span aria-hidden style={subtitleStyle}>
              {subtitle}
            </span>
          ) : null}
        </div>
        <div style={headerActionsStyle}>
          {onToggleCollapse ? (
            <GisIconButton
              label={`Collapse ${title} sidebar`}
              icon={<PanelLeftClose size={14} />}
              data-testid="map-workbench-sidebar-collapse"
              onClick={onToggleCollapse}
            />
          ) : null}
          {onClose ? (
            <GisIconButton
              label={`Close ${title} sidebar`}
              icon={<IconClose size={14} />}
              data-testid="map-workbench-sidebar-close"
              onClick={onClose}
            />
          ) : null}
        </div>
      </div>

      {tabs.length > 1 ? (
        <GisTabs
          tabs={gisTabs}
          activeId={resolvedActiveId}
          onTabChange={onTabChange}
          aria-label={`${title} sections`}
          tabTestIdPrefix="map-workbench-sidebar-tab"
          data-testid="map-workbench-sidebar-tabs"
          style={{ flex: 1, minHeight: 0 }}
        >
          {renderBody()}
        </GisTabs>
      ) : (
        <div
          role="tabpanel"
          id={`map-workbench-sidebar-panel-${resolvedActiveId}`}
          aria-label={activeTab?.label ?? title}
          style={singleTabBodyStyle}
        >
          {renderBody()}
        </div>
      )}
    </aside>
  );
};
