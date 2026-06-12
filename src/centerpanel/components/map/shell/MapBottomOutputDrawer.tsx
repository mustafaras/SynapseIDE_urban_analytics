import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { GripHorizontal, X } from "lucide-react";

import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_PANEL_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisIconButton } from "../ui";

export type MapBottomOutputDrawerTabId =
  | "attributes"
  | "timeline"
  | "problems"
  | "logs"
  | "evidence"
  | "review"
  | "reports";

export interface MapBottomOutputDrawerTabDefinition {
  id: MapBottomOutputDrawerTabId;
  label: string;
  description: string;
  badge?: string;
}

export interface MapBottomOutputDrawerProps {
  open: boolean;
  activeTabId: MapBottomOutputDrawerTabId;
  onTabChange: (tabId: MapBottomOutputDrawerTabId) => void;
  onClose: () => void;
  tabs?: readonly MapBottomOutputDrawerTabDefinition[];
  childrenByTab: Readonly<Record<MapBottomOutputDrawerTabId, React.ReactNode>>;
  height: number;
  minHeight: number;
  maxHeight: number;
  onHeightChange: (height: number) => void;
  statusText?: string;
  style?: React.CSSProperties;
}

export const MAP_BOTTOM_OUTPUT_DRAWER_TABS = [
  {
    id: "attributes",
    label: "Attributes",
    description: "Attribute table, selected rows, field profile, and join preview.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Review timeline, audit trail, evidence references, and revert actions.",
  },
  {
    id: "problems",
    label: "Problems",
    description: "QA blockers, warnings, CRS issues, geometry validity, and render errors.",
  },
  {
    id: "logs",
    label: "Logs",
    description: "Background tasks, worker status, and redacted operational log entries.",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence artifacts, provenance references, QA state, and linked outputs.",
  },
  {
    id: "review",
    label: "Review",
    description: "Collaboration review, comments, handoff status, and audit export.",
  },
  {
    id: "reports",
    label: "Reports",
    description: "Publish readiness, report handoff, review package, and export outputs.",
  },
] as const satisfies readonly MapBottomOutputDrawerTabDefinition[];

const drawerShellStyle: React.CSSProperties = {
  position: "absolute",
  left: "calc(var(--map-dock-left, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  bottom: "var(--map-shell-safe-inset-bottom, 0.75rem)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  minWidth: 0,
  maxWidth: "calc(100% - (var(--map-overlay-safe-inset-x, 0.75rem) * 2))",
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: "0 18px 54px rgba(2, 6, 23, 0.5)",
  color: MAP_COLORS.text,
  overflow: "hidden",
  zIndex: MAP_Z_INDEX.overlay + 2,
};

const resizeHandleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "0.625rem",
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgHeader,
  color: MAP_COLORS.textMuted,
  cursor: "ns-resize",
  touchAction: "none",
};

const drawerHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgHeader,
};

const tabListStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  minWidth: 0,
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  scrollbarGutter: "stable",
};

const tabButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  minWidth: "6.25rem",
  maxWidth: "10.5rem",
  minHeight: "2rem",
  padding: `0 ${MAP_SPACING.md}`,
  border: 0,
  borderRight: MAP_STROKES.hairlineSubtle,
  borderRadius: 0,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const activeTabButtonStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  background: MAP_COLORS.selectedSubtle,
  boxShadow: `inset 0 -2px 0 ${MAP_COLORS.interaction}`,
};

const tabBadgeStyle: React.CSSProperties = {
  minWidth: "1.35rem",
  maxWidth: "3.5rem",
  padding: "1px 5px",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.neutralSubtle,
  color: MAP_COLORS.textSecondary,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const closeSlotStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  padding: `0 ${MAP_SPACING.sm}`,
};

const statusTextStyle: React.CSSProperties = {
  maxWidth: "16rem",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const bodyStyle: React.CSSProperties = {
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  background: MAP_COLORS.bgPanel,
};

function clampHeight(value: number, minHeight: number, maxHeight: number): number {
  if (!Number.isFinite(value)) {
    return minHeight;
  }
  return Math.max(minHeight, Math.min(maxHeight, value));
}

function formatHeightLabel(height: number): string {
  return `${Math.round(height)} pixels`;
}

export function MapBottomOutputDrawer({
  open,
  activeTabId,
  onTabChange,
  onClose,
  tabs = MAP_BOTTOM_OUTPUT_DRAWER_TABS,
  childrenByTab,
  height,
  minHeight,
  maxHeight,
  onHeightChange,
  statusText,
  style,
}: MapBottomOutputDrawerProps): React.ReactElement | null {
  const tabRefs = useRef<Partial<Record<MapBottomOutputDrawerTabId, HTMLButtonElement | null>>>({});
  const wasOpenRef = useRef(false);
  const tabDefinitions = useMemo(() => tabs.filter((tab) => childrenByTab[tab.id] !== undefined), [childrenByTab, tabs]);
  const activeTab = tabDefinitions.find((tab) => tab.id === activeTabId) ?? tabDefinitions[0] ?? MAP_BOTTOM_OUTPUT_DRAWER_TABS[0];
  const resolvedHeight = clampHeight(height, minHeight, maxHeight);

  const focusTab = useCallback((tabId: MapBottomOutputDrawerTabId) => {
    const applyFocus = (): void => tabRefs.current[tabId]?.focus();
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(applyFocus);
      return;
    }
    applyFocus();
  }, []);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) {
      return;
    }
    wasOpenRef.current = true;
    focusTab(activeTab.id);
  }, [activeTab.id, focusTab, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    const startY = event.clientY;
    const startHeight = resolvedHeight;

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      onHeightChange(clampHeight(startHeight + startY - moveEvent.clientY, minHeight, maxHeight));
    };
    const handlePointerUp = (): void => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const step = event.shiftKey ? 40 : 16;
    let nextHeight: number | null = null;

    if (event.key === "ArrowUp") {
      nextHeight = resolvedHeight + step;
    } else if (event.key === "ArrowDown") {
      nextHeight = resolvedHeight - step;
    } else if (event.key === "Home") {
      nextHeight = minHeight;
    } else if (event.key === "End") {
      nextHeight = maxHeight;
    }

    if (nextHeight == null) {
      return;
    }

    event.preventDefault();
    onHeightChange(clampHeight(nextHeight, minHeight, maxHeight));
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tabId: MapBottomOutputDrawerTabId,
  ): void => {
    const currentIndex = tabDefinitions.findIndex((tab) => tab.id === tabId);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabDefinitions.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabDefinitions.length) % tabDefinitions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabDefinitions.length - 1;
    }

    if (nextIndex == null) {
      return;
    }

    event.preventDefault();
    const nextTabId = tabDefinitions[nextIndex]?.id ?? activeTab.id;
    onTabChange(nextTabId);
    focusTab(nextTabId);
  };

  return (
    <section
      aria-label="Map output drawer"
      data-testid="map-bottom-output-drawer"
      data-active-output-tab={activeTab.id}
      style={{
        ...drawerShellStyle,
        height: resolvedHeight,
        minHeight,
        maxHeight,
        ...style,
      }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize map output drawer"
        aria-valuemin={minHeight}
        aria-valuemax={maxHeight}
        aria-valuenow={Math.round(resolvedHeight)}
        aria-valuetext={formatHeightLabel(resolvedHeight)}
        tabIndex={0}
        title="Drag or use arrow keys to resize the output drawer"
        style={resizeHandleStyle}
        data-testid="map-bottom-output-drawer-resize-handle"
        onPointerDown={handleResizePointerDown}
        onKeyDown={handleResizeKeyDown}
      >
        <GripHorizontal aria-hidden size={MAP_ICON_SIZES.sm} />
      </div>
      <header style={drawerHeaderStyle}>
        <div role="tablist" aria-label="Map output drawer tabs" style={tabListStyle}>
          {tabDefinitions.map((tab) => {
            const selected = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[tab.id] = element;
                }}
                type="button"
                role="tab"
                id={`map-output-drawer-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`map-output-drawer-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                title={tab.description}
                data-testid={`map-output-drawer-tab-${tab.id}`}
                style={{ ...tabButtonStyle, ...(selected ? activeTabButtonStyle : undefined) }}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</span>
                {tab.badge ? <span style={tabBadgeStyle}>{tab.badge}</span> : null}
              </button>
            );
          })}
        </div>
        <div style={closeSlotStyle}>
          {statusText ? <span title={statusText} style={statusTextStyle}>{statusText}</span> : null}
          <GisIconButton
            label="Close output drawer"
            icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            onClick={onClose}
            size="sm"
          />
        </div>
      </header>
      <div
        role="tabpanel"
        id={`map-output-drawer-panel-${activeTab.id}`}
        aria-labelledby={`map-output-drawer-tab-${activeTab.id}`}
        data-testid={`map-output-drawer-panel-${activeTab.id}`}
        style={bodyStyle}
      >
        {childrenByTab[activeTab.id]}
      </div>
    </section>
  );
}

export const MAP_BOTTOM_OUTPUT_DRAWER_DEFAULT_HEIGHT = 320;
export const MAP_BOTTOM_OUTPUT_DRAWER_MIN_HEIGHT = 176;
export const MAP_BOTTOM_OUTPUT_DRAWER_MAX_HEIGHT = 520;
export const MAP_BOTTOM_OUTPUT_DRAWER_HEIGHT_TOKEN = MAP_PANEL_SIZES.bottomPanelHeight;

export default MapBottomOutputDrawer;
