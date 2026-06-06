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
  MapPin,
  MoreHorizontal,
  MousePointer2,
  PencilRuler,
  Ruler,
  ShieldAlert,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import type { MapRightDockPanel } from "./mapDocking";
import {
  MAP_RIGHT_DOCK_PANEL_DEFINITIONS,
  MAP_RIGHT_DOCK_PANEL_IDS,
  getMapRightDockPanelDefinition,
  type MapRightDockRoute,
} from "./mapRightDockRoutes";
import { MAP_ICON_SIZES } from "./mapTokens";
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

const ROUTE_SOURCE_LABELS: Record<MapRightDockRoute["source"], string> = {
  "activity-rail": "Activity rail",
  "bottom-tab": "Bottom tab route",
  "panel-tab": "Dock tab",
  programmatic: "Programmatic",
  "quick-action": "Quick action",
  "status-bar": "Status bar",
  toolbar: "Toolbar",
  worker: "Worker",
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
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % normalizedPanels.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + normalizedPanels.length) % normalizedPanels.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = normalizedPanels.length - 1;

    if (nextIndex == null) return;
    event.preventDefault();
    const nextPanel = normalizedPanels[nextIndex];
    if (!nextPanel) return;
    onPanelChange?.(nextPanel);
    focusPanelTab(tabRefs, nextPanel);
  }, [normalizedPanels, onPanelChange]);

  return (
    <aside
      className={styles.host}
      aria-labelledby={titleId}
      data-testid="map-right-dock-host"
      data-map-right-dock-host="true"
      data-map-right-dock-panel={route.panel}
      data-map-right-dock-source={route.source}
      data-presentation={presentation}
      style={{ "--right-dock-width": `${width}px` } as React.CSSProperties}
    >
      <header className={styles.header}>
        <div className={styles.titleStack}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrow}>Right inspector</span>
            <span className={styles.stateLabel}>{stateLabel}</span>
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
          <div className={styles.overflowPopover} role="menu" aria-label="Right dock route details">
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Source</span>
              <span className={styles.metaValue}>{ROUTE_SOURCE_LABELS[route.source]}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Activity</span>
              <span className={styles.metaValue}>{activeDefinition.activityId}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Legacy</span>
              <span className={styles.metaValue}>{route.legacyBottomTabId ?? "none"}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Detail</span>
              <span className={styles.metaValue}>{route.detail ?? "none"}</span>
            </div>
          </div>
        ) : null}
      </header>

      <div className={styles.tabRail} role="tablist" aria-label="Right dock panels">
        {normalizedPanels.map((panel) => {
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