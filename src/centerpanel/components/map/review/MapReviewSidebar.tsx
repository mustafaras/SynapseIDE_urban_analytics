import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, History } from "lucide-react";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_PANEL_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "../mapTokens";
import { IconClose } from "../MapIcons";
import { GisIconButton } from "../ui";

export type MapReviewSidebarTab = "problems" | "review";

export type MapReviewSidebarPresentation = "right-rail" | "bottom-drawer";

export interface MapReviewSidebarProps {
  visible: boolean;
  activeTab: MapReviewSidebarTab;
  onTabChange: (tab: MapReviewSidebarTab) => void;
  onClose: () => void;
  /** QA / Problems content node (scientific blockers, warnings, caveats). */
  problems: React.ReactNode;
  /** Review timeline / collaboration content node. */
  review: React.ReactNode;
  problemCount?: number;
  reviewCount?: number;
  blockerCount?: number;
  presentation?: MapReviewSidebarPresentation;
  width?: number;
  returnFocusTo?: HTMLElement | null;
}

const TAB_DEFINITIONS: ReadonlyArray<{
  id: MapReviewSidebarTab;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "problems",
    label: "Problems",
    description: "Scientific QA blockers, warnings, caveats, and render issues.",
    icon: <AlertTriangle size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
  {
    id: "review",
    label: "Review",
    description: "Review events, audit log, collaboration state, and evidence references.",
    icon: <History size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
];

const headerStyle: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "3.25rem",
  flexShrink: 0,
};

const eyebrowRowStyle: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "0.125rem",
};

const eyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  ...MAP_TEXT_STYLES.titleWrap,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const tabStripStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: MAP_SPACING.zero,
  flexShrink: 0,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgHeader,
};

const tabButtonBaseStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  minHeight: "2.25rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  border: MAP_STROKES.none,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const tabButtonActiveStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  background: MAP_COLORS.selectedSubtle,
  boxShadow: `inset 0 -2px 0 ${MAP_COLORS.interaction}`,
};

const tabCountStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "1.25rem",
  height: "1.125rem",
  padding: `0 ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.full,
  border: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textSecondary,
  background: MAP_COLORS.transparent,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const tabBlockerCountStyle: React.CSSProperties = {
  ...tabCountStyle,
  color: MAP_COLORS.error,
  borderColor: MAP_COLORS.error,
  background: "rgba(127, 29, 29, 0.24)",
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
};

const tabPanelStyle: React.CSSProperties = {
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
};

function getHostStyle(presentation: MapReviewSidebarPresentation, width?: number): React.CSSProperties {
  if (presentation === "bottom-drawer") {
    return {
      ...mapStyles.sidePanelSurface,
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      top: "auto",
      height: MAP_PANEL_SIZES.inspectorBottomDrawer,
      borderTop: MAP_STROKES.hairlineStrong,
      borderRadius: `${MAP_RADIUS.sm} ${MAP_RADIUS.sm} 0 0`,
      zIndex: MAP_Z_INDEX.symbologyPanel + 2,
    };
  }

  return {
    ...mapStyles.sidePanelSurface,
    top: MAP_SPACING.zero,
    right: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: width ? `min(${width}px, ${MAP_PANEL_SIZES.inspectorRightRail})` : MAP_PANEL_SIZES.inspectorRightRail,
    maxWidth: MAP_PANEL_SIZES.inspectorRightRail,
    borderLeft: MAP_STROKES.hairlineSubtle,
    zIndex: MAP_Z_INDEX.symbologyPanel + 2,
  };
}

export const MapReviewSidebar: React.FC<MapReviewSidebarProps> = ({
  visible,
  activeTab,
  onTabChange,
  onClose,
  problems,
  review,
  problemCount,
  reviewCount,
  blockerCount = 0,
  presentation = "right-rail",
  width,
  returnFocusTo = null,
}) => {
  const hostRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<MapReviewSidebarTab, HTMLButtonElement | null>>>({});

  const activeDefinition = useMemo(
    () => TAB_DEFINITIONS.find((tab) => tab.id === activeTab) ?? TAB_DEFINITIONS[0],
    [activeTab],
  );

  const restoreFocus = useCallback(() => {
    const target = returnFocusTo;
    if (!target || !target.isConnected) return;
    window.requestAnimationFrame(() => {
      if (target.isConnected) target.focus({ preventScroll: true });
    });
  }, [returnFocusTo]);

  const handleClose = useCallback(() => {
    onClose();
    restoreFocus();
  }, [onClose, restoreFocus]);

  useEffect(() => {
    if (!visible) return;
    window.requestAnimationFrame(() => {
      hostRef.current?.focus({ preventScroll: true });
    });
  }, [visible]);

  if (!visible) return null;

  const focusTab = (tab: MapReviewSidebarTab): void => {
    window.requestAnimationFrame(() => tabRefs.current[tab]?.focus());
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tab: MapReviewSidebarTab): void => {
    const index = TAB_DEFINITIONS.findIndex((definition) => definition.id === tab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TAB_DEFINITIONS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + TAB_DEFINITIONS.length) % TAB_DEFINITIONS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TAB_DEFINITIONS.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    const nextId = TAB_DEFINITIONS[nextIndex]?.id ?? "problems";
    onTabChange(nextId);
    focusTab(nextId);
  };

  const renderCount = (tab: MapReviewSidebarTab): React.ReactNode => {
    if (tab === "problems") {
      if (blockerCount > 0) {
        return <span style={tabBlockerCountStyle} aria-hidden="true">{blockerCount}</span>;
      }
      if (typeof problemCount === "number" && problemCount > 0) {
        return <span style={tabCountStyle} aria-hidden="true">{problemCount}</span>;
      }
      return null;
    }
    if (typeof reviewCount === "number" && reviewCount > 0) {
      return <span style={tabCountStyle} aria-hidden="true">{reviewCount}</span>;
    }
    return null;
  };

  return (
    <aside
      ref={hostRef}
      role="dialog"
      aria-label="Review and QA"
      tabIndex={-1}
      style={getHostStyle(presentation, width)}
      data-testid="map-review-sidebar"
      data-active-review-tab={activeDefinition.id}
      data-presentation={presentation}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          handleClose();
        }
      }}
    >
      <header style={headerStyle}>
        <div style={eyebrowRowStyle}>
          <span style={eyebrowStyle}>Review</span>
          <h2 style={titleStyle}>QA &amp; Review</h2>
        </div>
        <GisIconButton
          label="Close review sidebar"
          icon={<IconClose size={14} />}
          onClick={handleClose}
          size="sm"
        />
      </header>

      <div style={tabStripStyle} role="tablist" aria-label="Review sidebar tabs">
        {TAB_DEFINITIONS.map((tab) => {
          const selected = tab.id === activeDefinition.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`map-review-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`map-review-tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              title={tab.description}
              data-testid={`map-review-tab-${tab.id}`}
              style={{ ...tabButtonBaseStyle, ...(selected ? tabButtonActiveStyle : undefined) }}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {renderCount(tab.id)}
            </button>
          );
        })}
      </div>

      <div style={bodyStyle}>
        <div
          id={`map-review-tabpanel-${activeDefinition.id}`}
          role="tabpanel"
          aria-labelledby={`map-review-tab-${activeDefinition.id}`}
          style={tabPanelStyle}
          data-testid={`map-review-panel-${activeDefinition.id}`}
        >
          {activeDefinition.id === "problems" ? problems : review}
        </div>
      </div>
    </aside>
  );
};

export default MapReviewSidebar;
