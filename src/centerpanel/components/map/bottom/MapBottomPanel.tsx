import React, { useMemo, useRef } from "react";
import { X } from "lucide-react";
import {
  MapBottomPanelActiveBody,
  type MapBottomPanelCoreTabId,
  type MapBottomPanelTask,
} from "./MapBottomPanelBodies";
import {
  MAP_COLORS,
  MAP_DENSITY,
  MAP_ICON_SIZES,
  MAP_PANEL_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { GisIconButton } from "../ui";

export interface MapBottomPanelProps {
  visible: boolean;
  activeTabId: MapBottomPanelCoreTabId;
  onTabChange: (tabId: MapBottomPanelCoreTabId) => void;
  onClose: () => void;
  problems: React.ReactNode;
  attributes: React.ReactNode;
  timeline: React.ReactNode;
  diagnostics: React.ReactNode;
  tasks: readonly MapBottomPanelTask[];
}

const TAB_DEFINITIONS: ReadonlyArray<{
  id: MapBottomPanelCoreTabId;
  label: string;
  description: string;
}> = [
  {
    id: "problems",
    label: "Problems",
    description: "Scientific QA blockers, warnings, caveats, and render issues.",
  },
  {
    id: "attributes",
    label: "Attributes",
    description: "Attribute table, selected rows, field profile, and derived field tools.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Review events, audit log, evidence references, and revert actions.",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Imports, workflow execution, worker transfer, and background status.",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    description: "Render budgets, worker failures, redacted telemetry, and retry actions.",
  },
];

const panelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  minHeight: "12rem",
  height: MAP_PANEL_SIZES.bottomPanelHeight,
  maxHeight: MAP_PANEL_SIZES.bottomPanelMaxHeight,
  width: "100%",
  maxWidth: "100%",
  minWidth: MAP_SPACING.zero,
  background: MAP_COLORS.bgPanel,
  borderTop: MAP_STROKES.hairlineStrong,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgHeader,
};

const tabListStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.zero,
  minWidth: MAP_SPACING.zero,
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  scrollbarGutter: "stable",
};

const tabButtonBaseStyle: React.CSSProperties = {
  position: "relative",
  minHeight: MAP_DENSITY.compact.rowHeight,
  maxWidth: "10.5rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  border: MAP_STROKES.none,
  borderRight: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.chipLabel,
};

const tabButtonActiveStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  background: MAP_COLORS.selectedSubtle,
  boxShadow: `inset 0 -2px 0 ${MAP_COLORS.interaction}`,
};

const closeSlotStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `0 ${MAP_SPACING.sm}`,
};

const bodyStyle: React.CSSProperties = {
  minHeight: MAP_SPACING.zero,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

export function MapBottomPanel({
  visible,
  activeTabId,
  onTabChange,
  onClose,
  problems,
  attributes,
  timeline,
  diagnostics,
  tasks,
}: MapBottomPanelProps): React.ReactElement | null {
  const tabRefs = useRef<Partial<Record<MapBottomPanelCoreTabId, HTMLButtonElement | null>>>({});
  const activeTab = useMemo(
    () => TAB_DEFINITIONS.find((tab) => tab.id === activeTabId) ?? TAB_DEFINITIONS[0],
    [activeTabId],
  );

  if (!visible) return null;

  const focusTab = (tabId: MapBottomPanelCoreTabId): void => {
    const applyFocus = (): void => tabRefs.current[tabId]?.focus();
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(applyFocus);
      return;
    }
    applyFocus();
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabId: MapBottomPanelCoreTabId): void => {
    const currentIndex = TAB_DEFINITIONS.findIndex((tab) => tab.id === tabId);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_DEFINITIONS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_DEFINITIONS.length) % TAB_DEFINITIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_DEFINITIONS.length - 1;
    }

    if (nextIndex == null) return;

    event.preventDefault();
    const nextTabId = TAB_DEFINITIONS[nextIndex]?.id ?? "problems";
    onTabChange(nextTabId);
    focusTab(nextTabId);
  };

  return (
    <section
      style={panelStyle}
      aria-label="Map bottom panel"
      data-testid="map-bottom-panel"
      data-active-bottom-tab={activeTab.id}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header style={headerStyle}>
        <div style={tabListStyle} role="tablist" aria-label="Map bottom panel tabs">
          {TAB_DEFINITIONS.map((tab) => {
            const selected = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[tab.id] = element;
                }}
                type="button"
                role="tab"
                id={`map-bottom-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`map-bottom-tabpanel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                title={tab.description}
                data-testid={`map-bottom-tab-${tab.id}`}
                style={{ ...tabButtonBaseStyle, ...(selected ? tabButtonActiveStyle : undefined) }}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div style={closeSlotStyle}>
          <GisIconButton
            label="Close bottom panel"
            icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            onClick={onClose}
            size="sm"
          />
        </div>
      </header>

      <div style={bodyStyle}>
        <MapBottomPanelActiveBody
          activeTabId={activeTab.id}
          panelId={`map-bottom-tabpanel-${activeTab.id}`}
          labelledBy={`map-bottom-tab-${activeTab.id}`}
          problems={problems}
          attributes={attributes}
          timeline={timeline}
          tasks={tasks}
          diagnostics={diagnostics}
        />
      </div>
    </section>
  );
}

export default MapBottomPanel;
