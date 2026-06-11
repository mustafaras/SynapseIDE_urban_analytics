import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
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
  PencilRuler,
  Ruler,
  ShieldAlert,
  Users,
  Workflow,
  X,
} from "lucide-react";
import type { MapRightDockPanel } from "./mapDocking";
import {
  getMapRightDockPanelDefinition,
  MAP_RIGHT_DOCK_PANEL_DEFINITIONS,
  MAP_RIGHT_DOCK_PANEL_IDS,
  type MapRightDockRoute,
} from "./mapRightDockRoutes";
import {
  getMapRightDockPanelTier,
  getRightDockVisibleTabPanels,
  MAP_RIGHT_DOCK_OVERFLOW_GROUPS,
} from "./mapRightDockRoutes";
import { MAP_ICON_SIZES, MAP_Z_INDEX } from "./mapTokens";
import { GisIconButton } from "./ui";
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
  children?: React.ReactNode;
}

const PANEL_ICON_MAP: Record<MapRightDockPanel, LucideIcon> = {
  inspect: Info,
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

/** Label for the tab rail tier indicator shown on contextual/advanced active panels. */
const TIER_LABELS: Record<ReturnType<typeof getMapRightDockPanelTier>, string | null> = {
  primary: null,
  contextual: "Contextual",
  advanced: "Advanced",
  diagnostics: "Diagnostics",
};

function getPanelIcon(panel: MapRightDockPanel): React.ReactNode {
  const Icon = PANEL_ICON_MAP[panel] ?? Layers;
  return <Icon size={MAP_ICON_SIZES.sm} aria-hidden="true" />;
}

function focusPanelTab(tabRefs: React.MutableRefObject<Partial<Record<MapRightDockPanel, HTMLButtonElement | null>>>, panel: MapRightDockPanel): void {
  window.requestAnimationFrame(() => tabRefs.current[panel]?.focus({ preventScroll: true }));
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
  children,
}) => {
  const titleId = useId();
  const bodyId = useId();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const tabRefs = useRef<Partial<Record<MapRightDockPanel, HTMLButtonElement | null>>>({});
  const activeDefinition = getMapRightDockPanelDefinition(route.panel);
  const normalizedPanels = useMemo(
    () => panels.filter((panel) => MAP_RIGHT_DOCK_PANEL_DEFINITIONS[panel] != null),
    [panels],
  );

  const handleTabKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, panel: MapRightDockPanel) => {
    const currentIndex = normalizedPanels.indexOf(panel);
    const visiblePanels = getRightDockVisibleTabPanels(route.panel).filter((p) =>
      normalizedPanels.includes(p),
    );
    const currentVisibleIndex = visiblePanels.indexOf(panel);
    let nextIndex: number | null = null;
    if (currentVisibleIndex >= 0) {
      // Arrow navigation applies to visible tab rail panels
      if (event.key === "ArrowRight") nextIndex = (currentVisibleIndex + 1) % visiblePanels.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentVisibleIndex - 1 + visiblePanels.length) % visiblePanels.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = visiblePanels.length - 1;
    } else {
      // Fallback: full panel set (for overflow items)
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % normalizedPanels.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + normalizedPanels.length) % normalizedPanels.length;
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
  }, [normalizedPanels, onPanelChange, route.panel]);

  return (
    <aside
      className={styles.host}
      aria-labelledby={titleId}
      data-testid="map-right-dock-host"
      data-map-right-dock-host="true"
      data-map-right-dock-panel={route.panel}
      data-map-right-dock-source={route.source}
      data-presentation={presentation}
      style={{
        "--right-dock-width": `${width}px`,
        "--map-right-dock-z": `${MAP_Z_INDEX.panel}`,
        "--map-right-dock-overflow-z": `${MAP_Z_INDEX.commandBar}`,
      } as React.CSSProperties}
    >
      <header className={styles.header}>
        <div className={styles.titleStack}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrow}>Right inspector</span>
            {TIER_LABELS[getMapRightDockPanelTier(route.panel)] ? (
              <span className={styles.stateLabelTier} data-panel-tier={getMapRightDockPanelTier(route.panel)}>
                {TIER_LABELS[getMapRightDockPanelTier(route.panel)]}
              </span>
            ) : (
              <span className={styles.stateLabel}>{stateLabel}</span>
            )}
          </div>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}>{getPanelIcon(route.panel)}</span>
            <h2 id={titleId} className={styles.title}>{activeDefinition.label}</h2>
          </div>
        </div>
        <div className={styles.actions}>
          <GisIconButton
            label="Right dock options"
            tooltip="Right dock options"
            icon={<MoreHorizontal size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            active={overflowOpen}
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((current) => !current)}
          />
          {onCollapse ? (
            <GisIconButton
              label="Collapse right dock"
              tooltip="Collapse right dock"
              icon={<ChevronRight size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              showPressedState={false}
              onClick={onCollapse}
            />
          ) : null}
          <GisIconButton
            label="Close right dock"
            tooltip="Close right dock"
            icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            showPressedState={false}
            onClick={onClose}
          />
        </div>
        {overflowOpen ? (
          <div className={styles.overflowPopover} role="menu" aria-label="More dock panels">
            {MAP_RIGHT_DOCK_OVERFLOW_GROUPS.map((group) => {
              const groupPanels = group.panels.filter((p) => normalizedPanels.includes(p));
              if (groupPanels.length === 0) return null;
              return (
                <div key={group.label} className={styles.overflowGroup}>
                  <span className={styles.overflowGroupLabel}>{group.label}</span>
                  {groupPanels.map((panel) => {
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
              );
            })}
          </div>
        ) : null}
      </header>

      <div className={styles.tabRail} role="tablist" aria-label="Right dock panels">
        {getRightDockVisibleTabPanels(route.panel)
          .filter((panel) => normalizedPanels.includes(panel))
          .map((panel) => {
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
        aria-labelledby={titleId}
        data-map-right-dock-body="true"
      >
        {children ?? <div className={styles.bodyInner} aria-hidden="true" />}
      </div>
    </aside>
  );
};