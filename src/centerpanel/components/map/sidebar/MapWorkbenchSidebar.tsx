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
import { PanelLeftOpen } from "lucide-react";
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
import {
  MapDockPanelFrame,
  type MapDockPanelFrameSummaryItem,
} from "../shell";

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
  /** Compact metadata shown in the shared dock frame header. */
  summaryItems?: readonly MapDockPanelFrameSummaryItem[];
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
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  border: 0,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  zIndex: MAP_Z_INDEX.sidebar,
  overflow: "hidden",
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
  ...MAP_TEXT_STYLES.truncate,
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
  summaryItems,
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
      data-width-band={
        typeof width === "number"
          ? width <= 320
            ? "min"
            : width <= 420
              ? "narrow"
              : width <= 520
                ? "standard"
                : "wide"
          : "auto"
      }
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
      <MapDockPanelFrame
        title={title}
        subtitle={subtitle ?? "Workspace"}
        activeWorkspaceName={activeTab?.label}
        summaryItems={summaryItems}
        onToggleCollapse={onToggleCollapse}
        onClose={onClose}
        collapseLabel={`Collapse ${title} sidebar`}
        closeLabel={`Close ${title} sidebar`}
        collapseTestId="map-workbench-sidebar-collapse"
        closeTestId="map-workbench-sidebar-close"
        bodyStyle={{ display: "flex", flexDirection: "column" }}
        aria-label={`${title} dock frame`}
      >
        {tabs.length > 1 ? (
          <GisTabs
            tabs={gisTabs}
            activeId={resolvedActiveId}
            onTabChange={onTabChange}
            aria-label={`${title} sections`}
            tabTestIdPrefix="map-workbench-sidebar-tab"
            data-testid="map-workbench-sidebar-tabs"
            variant="compact"
            density="compact"
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
      </MapDockPanelFrame>
    </aside>
  );
};
