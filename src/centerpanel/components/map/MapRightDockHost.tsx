import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
  GitBranch,
  History,
  Info,
  Layers,
  ListChecks,
  type LucideIcon,
  MapPin,
  MoreHorizontal,
  MousePointer2,
  Palette,
  PencilRuler,
  Pin,
  PinOff,
  Ruler,
  ShieldAlert,
  Users,
  Workflow,
} from "lucide-react";
import {
  MAP_RIGHT_PANEL_MAX_WIDTH,
  MAP_RIGHT_PANEL_MIN_WIDTH,
  type MapRightDockPanel,
} from "./mapDocking";
import {
  getMapRightDockPanelDefinition,
  getMapRightDockPanelTier,
  getRightDockVisibleTabPanels,
  MAP_RIGHT_DOCK_PANEL_DEFINITIONS,
  MAP_RIGHT_DOCK_PANEL_IDS,
  type MapRightDockRoute,
} from "./mapRightDockRoutes";
import {
  MAP_ICON_SIZES,
  type GisStatusKey,
} from "./mapTokens";
import { MapDockPanelFrame } from "./shell";
import { GisIconButton, GisStatusChip } from "./ui";
import styles from "./MapRightDockHost.module.css";

export type MapRightDockHostPresentation = "right-dock" | "side-drawer";

export interface MapRightDockHostProps {
  route: MapRightDockRoute;
  panels?: readonly MapRightDockPanel[];
  presentation?: MapRightDockHostPresentation;
  width?: number;
  stateLabel?: string;
  onPanelChange?: (panel: MapRightDockPanel) => void;
  onCollapse?: () => void;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  children?: React.ReactNode;
}

const PANEL_ICON_MAP: Record<MapRightDockPanel, LucideIcon> = {
  inspect: Info,
  style: Palette,
  attributes: Database,
  problems: AlertTriangle,
  timeline: History,
  tasks: ListChecks,
  diagnostics: Activity,
  pins: MapPin,
  draw: PencilRuler,
  measure: Ruler,
  selection: MousePointer2,
  scientificQA: ShieldAlert,
  qa: ShieldAlert,
  workflow: Workflow,
  report: FileText,
  performance: BarChart3,
  collaboration: Users,
  urbanMethod: GitBranch,
};

const TIER_LABELS: Record<ReturnType<typeof getMapRightDockPanelTier>, string> = {
  primary: "Primary",
  contextual: "Contextual",
  advanced: "Review",
  diagnostics: "Diagnostics",
};

const TIER_STATUS: Record<ReturnType<typeof getMapRightDockPanelTier>, GisStatusKey> = {
  primary: "ready",
  contextual: "caveat",
  advanced: "generated",
  diagnostics: "unknown",
};

const PANEL_STATUS: Partial<Record<MapRightDockPanel, { status: GisStatusKey; label: string }>> = {
  problems: { status: "caveat", label: "QA" },
  scientificQA: { status: "caveat", label: "Scientific QA" },
  qa: { status: "caveat", label: "QA" },
  workflow: { status: "running", label: "Workflow" },
  report: { status: "ready", label: "Publish" },
  diagnostics: { status: "unknown", label: "Diagnostics" },
  performance: { status: "unknown", label: "Performance" },
};

function getPanelIcon(panel: MapRightDockPanel): React.ReactNode {
  const Icon = PANEL_ICON_MAP[panel] ?? Layers;
  return <Icon size={MAP_ICON_SIZES.sm} aria-hidden="true" />;
}

function focusPanelTab(tabRefs: React.MutableRefObject<Partial<Record<MapRightDockPanel, HTMLButtonElement | null>>>, panel: MapRightDockPanel): void {
  window.requestAnimationFrame(() => tabRefs.current[panel]?.focus({ preventScroll: true }));
}

function getRouteStatus(panel: MapRightDockPanel): { status: GisStatusKey; label: string } {
  return PANEL_STATUS[panel] ?? {
    status: TIER_STATUS[getMapRightDockPanelTier(panel)],
    label: TIER_LABELS[getMapRightDockPanelTier(panel)],
  };
}

function clampRightDockWidth(width: number): number {
  return Math.max(MAP_RIGHT_PANEL_MIN_WIDTH, Math.min(MAP_RIGHT_PANEL_MAX_WIDTH, width));
}

export const MapRightDockHost: React.FC<MapRightDockHostProps> = ({
  route,
  panels = MAP_RIGHT_DOCK_PANEL_IDS,
  presentation = "right-dock",
  width = 420,
  stateLabel = "Routed",
  onPanelChange,
  onCollapse,
  onClose,
  onWidthChange,
  children,
}) => {
  const bodyId = useId();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [pinned, setPinned] = useState(true);
  const hostRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<MapRightDockPanel, HTMLButtonElement | null>>>({});
  const activeDefinition = getMapRightDockPanelDefinition(route.panel);
  const routeStatus = getRouteStatus(route.panel);
  const tabLayout = width <= 360 || presentation === "side-drawer" ? "rail" : "segmented";
  const normalizedPanels = useMemo(
    () => panels.filter((panel) => MAP_RIGHT_DOCK_PANEL_DEFINITIONS[panel] != null),
    [panels],
  );
  const visiblePanels = useMemo(
    () => getRightDockVisibleTabPanels(route.panel).filter((panel) => normalizedPanels.includes(panel)),
    [normalizedPanels, route.panel],
  );
  const overflowGroups = useMemo(() => {
    const hiddenPanels = normalizedPanels.filter((panel) => !visiblePanels.includes(panel));
    const groups = [
      { label: "Contextual", panels: hiddenPanels.filter((panel) => getMapRightDockPanelTier(panel) === "contextual") },
      { label: "Review", panels: hiddenPanels.filter((panel) => getMapRightDockPanelTier(panel) === "advanced") },
      { label: "Diagnostics", panels: hiddenPanels.filter((panel) => getMapRightDockPanelTier(panel) === "diagnostics") },
      { label: "Primary", panels: hiddenPanels.filter((panel) => getMapRightDockPanelTier(panel) === "primary") },
    ];
    return groups.filter((group) => group.panels.length > 0);
  }, [normalizedPanels, visiblePanels]);

  useEffect(() => {
    if (route.panel === "inspect") {
      return;
    }
    window.requestAnimationFrame(() => {
      hostRef.current?.focus({ preventScroll: true });
    });
  }, [route.panel]);

  const handleTabKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, panel: MapRightDockPanel) => {
    const currentIndex = normalizedPanels.indexOf(panel);
    const currentVisibleIndex = visiblePanels.indexOf(panel);
    let nextIndex: number | null = null;
    if (currentVisibleIndex >= 0) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentVisibleIndex + 1) % visiblePanels.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentVisibleIndex - 1 + visiblePanels.length) % visiblePanels.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = visiblePanels.length - 1;
    } else {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % normalizedPanels.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + normalizedPanels.length) % normalizedPanels.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = normalizedPanels.length - 1;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    const targetList = currentVisibleIndex >= 0 ? visiblePanels : normalizedPanels;
    const nextPanel = targetList[nextIndex];
    if (!nextPanel) return;
    onPanelChange?.(nextPanel);
    focusPanelTab(tabRefs, nextPanel);
  }, [normalizedPanels, onPanelChange, visiblePanels]);

  const handleResizePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!onWidthChange) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      onWidthChange(clampRightDockWidth(startWidth + (startX - moveEvent.clientX)));
    };
    const handlePointerUp = (): void => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [onWidthChange, width]);

  return (
    <aside
      ref={hostRef}
      className={styles.host}
      aria-label={activeDefinition.label}
      data-testid="map-right-dock-host"
      data-map-right-dock-host="true"
      data-map-right-dock-panel={route.panel}
      data-map-right-dock-source={route.source}
      data-presentation={presentation}
      data-tab-layout={tabLayout}
      data-panel-tier={getMapRightDockPanelTier(route.panel)}
      data-pinned={pinned ? "true" : "false"}
      tabIndex={-1}
      style={{
        "--right-dock-width": `${width}px`,
      } as React.CSSProperties}
    >
      {onWidthChange ? (
        <button
          type="button"
          className={styles.resizeHandle}
          aria-label={`Resize ${activeDefinition.label}`}
          title={`Resize ${activeDefinition.label}`}
          onPointerDown={handleResizePointerDown}
        />
      ) : null}
      <MapDockPanelFrame
        title={activeDefinition.label}
        subtitle="Right inspector"
        activeWorkspaceName={TIER_LABELS[getMapRightDockPanelTier(route.panel)]}
              closeLabel="Close right dock"
        collapseLabel={`Collapse ${activeDefinition.label}`}
        onToggleCollapse={onCollapse}
        onClose={onClose}
        closeTestId="map-right-dock-close"
        collapseTestId="map-right-dock-collapse"
        className={styles.frame}
        bodyStyle={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", minHeight: 0 }}
        aria-label={`${activeDefinition.label} right dock frame`}
        actions={(
          <>
            <GisStatusChip
              status={routeStatus.status}
              label={routeStatus.label}
              density="compact"
              title={`${activeDefinition.label} status: ${routeStatus.label}. ${stateLabel}`}
              data-testid="map-right-dock-status"
            />
            <GisIconButton
              label={pinned ? `Unpin ${activeDefinition.label}` : `Pin ${activeDefinition.label}`}
              tooltip={pinned ? `Unpin ${activeDefinition.label}` : `Pin ${activeDefinition.label}`}
              icon={pinned ? <PinOff size={MAP_ICON_SIZES.sm} aria-hidden="true" /> : <Pin size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              active={pinned}
              onClick={() => setPinned((current) => !current)}
            />
            <GisIconButton
              label="More right dock routes"
              tooltip="More right dock routes"
              icon={<MoreHorizontal size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              active={overflowOpen}
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
              onClick={() => setOverflowOpen((current) => !current)}
            />
          </>
        )}
      >
        {overflowOpen ? (
          <div className={styles.overflowPopover} role="menu" aria-label="More dock panels">
            {overflowGroups.map((group) => (
              <div key={group.label} className={styles.overflowGroup}>
                <span className={styles.overflowGroupLabel}>{group.label}</span>
                {group.panels.map((panel) => {
                  const definition = getMapRightDockPanelDefinition(panel);
                  const active = panel === route.panel;
                  return (
                    <button
                      key={panel}
                      type="button"
                      role="menuitem"
                      className={`${styles.overflowItem}${active ? ` ${styles.overflowItemActive}` : ""}`}
                      onClick={() => {
                        onPanelChange?.(panel);
                        setOverflowOpen(false);
                      }}
                      onKeyDown={(event) => handleTabKeyDown(event, panel)}
                      data-map-right-dock-tab={panel}
                      data-active={active ? "true" : undefined}
                    >
                      <span className={styles.overflowItemIcon}>{getPanelIcon(panel)}</span>
                      <span>{definition.label}</span>
                      {active ? <span className={styles.overflowItemActiveDot} aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.tabRail} role="tablist" aria-label="Right dock panels" aria-orientation={tabLayout === "rail" ? "vertical" : "horizontal"}>
          {visiblePanels.map((panel) => {
            const definition = getMapRightDockPanelDefinition(panel);
            const active = panel === route.panel;
            return (
              <button
                key={panel}
                ref={(element) => {
                  tabRefs.current[panel] = element;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={active ? bodyId : undefined}
                tabIndex={active ? 0 : -1}
                className={`${styles.tabButton}${active ? ` ${styles.tabButtonActive}` : ""}`}
                title={definition.label}
                onClick={() => onPanelChange?.(panel)}
                onKeyDown={(event) => handleTabKeyDown(event, panel)}
                data-map-right-dock-tab={panel}
                data-active={active ? "true" : undefined}
              >
                {getPanelIcon(panel)}
                <span className={styles.tabText}>{definition.label}</span>
              </button>
            );
          })}
        </div>

        <div
          id={bodyId}
          className={styles.body}
          role="tabpanel"
          aria-label={activeDefinition.label}
          data-map-right-dock-body="true"
        >
          {children ?? (
            <div className={styles.emptyBody}>
              <Info size={MAP_ICON_SIZES.md} aria-hidden="true" />
              <span>No {activeDefinition.label.toLowerCase()} content is available for the current map context.</span>
            </div>
          )}
        </div>
      </MapDockPanelFrame>
    </aside>
  );
};
