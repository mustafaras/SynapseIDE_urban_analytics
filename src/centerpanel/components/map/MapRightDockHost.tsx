import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  PanelRightOpen,
  PencilRuler,
  Pin,
  PinOff,
  Ruler,
  ShieldAlert,
  Users,
  Workflow,
  X,
} from "lucide-react";
import {
  MAP_RIGHT_PANEL_FLOATING_MARGIN,
  MAP_RIGHT_PANEL_MAX_WIDTH,
  MAP_RIGHT_PANEL_MIN_WIDTH,
  clampMapRightDockFloatingRect,
  createDefaultMapRightDockFloatingRect,
  type MapRightDockFloatingRect,
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
import { GisEmptyState, GisIconButton, GisStatusChip } from "./ui";
import { getMapOverlayPortalRoot } from "./ui/mapOverlayPortal";
import { useDraggableMapPanel } from "./useDraggableMapPanel";
import motionStyles from "./design/motion.module.css";
import styles from "./MapRightDockHost.module.css";

export type MapRightDockHostPresentation = "right-dock" | "side-drawer" | "floating-modal";

export interface MapRightDockPanelStatus {
  status: GisStatusKey;
  label: string;
  title?: string;
}

export interface MapRightDockHostProps {
  route: MapRightDockRoute;
  panels?: readonly MapRightDockPanel[];
  presentation?: MapRightDockHostPresentation;
  reducedMotion?: boolean;
  closing?: boolean;
  collapsed?: boolean;
  width?: number;
  stateLabel?: string;
  panelStatus?: MapRightDockPanelStatus | null;
  onPanelChange?: (panel: MapRightDockPanel) => void;
  onCollapse?: () => void;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  floatingRect?: MapRightDockFloatingRect;
  onFloatingRectChange?: (rect: MapRightDockFloatingRect) => void;
  children?: React.ReactNode;
}

type FloatingResizeDirection = "east" | "south" | "south-east" | "west";

interface FloatingResizeHandleConfig {
  id: string;
  label: string;
  direction: FloatingResizeDirection;
  className: string;
}

const FLOATING_RESIZE_HANDLES: readonly FloatingResizeHandleConfig[] = [
  { id: "west", label: "Resize width from left edge", direction: "west", className: styles.floatingResizeHandleWest },
  { id: "east", label: "Resize width from right edge", direction: "east", className: styles.floatingResizeHandleEast },
  { id: "south", label: "Resize height from bottom edge", direction: "south", className: styles.floatingResizeHandleSouth },
  { id: "south-east", label: "Resize width and height", direction: "south-east", className: styles.floatingResizeHandleSouthEast },
];

const PANEL_SUBTITLE: Record<MapRightDockPanel, string> = {
  inspect: "Selected layer & feature properties",
  style: "Styling & symbology for the active layer",
  attributes: "Feature attribute table",
  problems: "Data quality issues",
  timeline: "Review history",
  tasks: "Background task queue",
  diagnostics: "Runtime diagnostics",
  pins: "Saved map pins",
  draw: "Sketch & draw tools",
  measure: "Distance & area measurement",
  selection: "Selected-area analytics",
  scientificQA: "Scientific QA & repairs",
  qa: "Data quality issues",
  workflow: "Analysis workflow runner",
  report: "Publish, export & report",
  performance: "Render performance",
  collaboration: "Collaboration & presence",
  urbanMethod: "Urban analytics method",
};

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

function getPanelIcon(panel: MapRightDockPanel): React.ReactNode {
  const Icon = PANEL_ICON_MAP[panel] ?? Layers;
  return <Icon size={MAP_ICON_SIZES.sm} aria-hidden="true" />;
}

function focusPanelTab(tabRefs: React.MutableRefObject<Partial<Record<MapRightDockPanel, HTMLButtonElement | null>>>, panel: MapRightDockPanel): void {
  window.requestAnimationFrame(() => tabRefs.current[panel]?.focus({ preventScroll: true }));
}

function clampRightDockWidth(width: number): number {
  return Math.max(MAP_RIGHT_PANEL_MIN_WIDTH, Math.min(MAP_RIGHT_PANEL_MAX_WIDTH, width));
}

function getViewportSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1600, height: 900 };
  }
  return {
    width: Math.max(window.innerWidth, MAP_RIGHT_PANEL_MIN_WIDTH + MAP_RIGHT_PANEL_FLOATING_MARGIN * 2),
    height: Math.max(window.innerHeight, 400),
  };
}

function rectToDragOffset(rect: MapRightDockFloatingRect, viewport: { width: number; height: number }): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2 - viewport.width / 2,
    y: rect.y + rect.height / 2 - viewport.height / 2,
  };
}

function dragOffsetToRect(
  offset: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): MapRightDockFloatingRect {
  return {
    x: viewport.width / 2 + offset.x - size.width / 2,
    y: viewport.height / 2 + offset.y - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

function isSameFloatingRect(a: MapRightDockFloatingRect | null, b: MapRightDockFloatingRect | null): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export const MapRightDockHost: React.FC<MapRightDockHostProps> = ({
  route,
  panels = MAP_RIGHT_DOCK_PANEL_IDS,
  presentation = "right-dock",
  reducedMotion = false,
  closing = false,
  collapsed = false,
  width = 420,
  stateLabel = "Routed",
  panelStatus = null,
  onPanelChange,
  onCollapse,
  onClose,
  onWidthChange,
  floatingRect,
  onFloatingRectChange,
  children,
}) => {
  const bodyId = useId();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hostRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<MapRightDockPanel, HTMLButtonElement | null>>>({});
  const activeDefinition = getMapRightDockPanelDefinition(route.panel);
  const viewport = getViewportSize();
  const defaultFloatingRect = createDefaultMapRightDockFloatingRect(viewport, width);
  const normalizedFloatingRect = presentation === "floating-modal"
    ? clampMapRightDockFloatingRect(floatingRect ?? defaultFloatingRect, viewport)
    : null;
  const resolvedWidth = normalizedFloatingRect?.width ?? width;
  const resolvedHeight = normalizedFloatingRect?.height ?? 560;
  const tabLayout = resolvedWidth <= 360 || presentation === "side-drawer" ? "rail" : "segmented";
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
    const startWidth = resolvedWidth;
    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      onWidthChange(clampRightDockWidth(startWidth + (startX - moveEvent.clientX)));
    };
    const handlePointerUp = (): void => {
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [onWidthChange, resolvedWidth]);

  const panelDrag = useDraggableMapPanel({
    boundsPadding: MAP_RIGHT_PANEL_FLOATING_MARGIN,
    offset: normalizedFloatingRect ? rectToDragOffset(normalizedFloatingRect, viewport) : undefined,
    onOffsetChange: presentation === "floating-modal" && normalizedFloatingRect && onFloatingRectChange
      ? (nextOffset) => {
        const rawRect = dragOffsetToRect(nextOffset, {
          width: normalizedFloatingRect.width,
          height: normalizedFloatingRect.height,
        }, viewport);
        const clamped = clampMapRightDockFloatingRect(rawRect, viewport);
        onFloatingRectChange(clamped);
      }
      : undefined,
  });

  useEffect(() => {
    if (presentation !== "floating-modal" || !normalizedFloatingRect || !onFloatingRectChange) {
      return;
    }
    // Only initialize missing external state. Continuous sync here can create
    // update feedback loops while dragging/resizing.
    if (!floatingRect) {
      onFloatingRectChange(normalizedFloatingRect);
    }
  }, [floatingRect, normalizedFloatingRect, onFloatingRectChange, presentation]);

  useEffect(() => {
    if (presentation !== "floating-modal" || !normalizedFloatingRect || !onFloatingRectChange) {
      return;
    }
    const handleResize = () => {
      const clamped = clampMapRightDockFloatingRect(normalizedFloatingRect, getViewportSize());
      if (!isSameFloatingRect(clamped, floatingRect ?? null)) {
        onFloatingRectChange(clamped);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [floatingRect, normalizedFloatingRect, onFloatingRectChange, presentation]);

  const handleFloatingResizePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>, direction: FloatingResizeDirection) => {
    if (!normalizedFloatingRect || !onFloatingRectChange) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = normalizedFloatingRect;
    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const nextRect: MapRightDockFloatingRect = {
        ...startRect,
        ...(direction === "east" || direction === "south-east" ? { width: startRect.width + deltaX } : null),
        ...(direction === "south" || direction === "south-east" ? { height: startRect.height + deltaY } : null),
        ...(direction === "west"
          ? {
            x: startRect.x + deltaX,
            width: startRect.width - deltaX,
          }
          : null),
      };
      onFloatingRectChange(clampMapRightDockFloatingRect(nextRect, getViewportSize()));
    };

    const handlePointerUp = (): void => {
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [normalizedFloatingRect, onFloatingRectChange]);

  const handleFloatingHeaderPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("button,input,select,textarea,a,[data-no-panel-drag='true']")) {
      return;
    }
    setIsDragging(true);
    const stopDragging = (): void => {
      setIsDragging(false);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    panelDrag.dragHandleProps.onPointerDown(event);
  }, [panelDrag.dragHandleProps]);

  if (collapsed && presentation !== "floating-modal") {
    return (
      <aside
        ref={hostRef}
        className={styles.host}
        aria-label={`${activeDefinition.label} right dock rail`}
        data-testid="map-right-dock-host"
        data-ui-proof="real-right-dock"
        data-map-right-dock-host="true"
        data-map-right-dock-panel={route.panel}
        data-map-right-dock-source={route.source}
        data-presentation={presentation}
        data-panel-tier={getMapRightDockPanelTier(route.panel)}
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-closing={closing ? "true" : "false"}
        data-collapsed="true"
        tabIndex={-1}
        style={{
          "--right-dock-width": `${resolvedWidth}px`,
        } as React.CSSProperties}
      >
        <div className={styles.collapsedRail} role="toolbar" aria-label="Collapsed right dock panels">
          <GisIconButton
            label={`Expand ${activeDefinition.label}`}
            tooltip={`Expand ${activeDefinition.label}`}
            icon={<PanelRightOpen size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            onClick={onCollapse}
            data-testid="map-right-dock-collapse"
          />
          <span className={styles.collapsedRailDivider} aria-hidden="true" />
          {visiblePanels.map((panel) => {
            const definition = getMapRightDockPanelDefinition(panel);
            const active = panel === route.panel;
            return (
              <GisIconButton
                key={panel}
                label={definition.label}
                tooltip={definition.label}
                icon={getPanelIcon(panel)}
                size="sm"
                active={active}
                onClick={() => {
                  if (active) onCollapse?.();
                  else onPanelChange?.(panel);
                }}
                data-testid={`map-right-dock-collapsed-tab-${panel}`}
              />
            );
          })}
          <span aria-hidden className={styles.collapsedRailSpacer} />
          <GisIconButton
            label="Close right dock"
            tooltip="Close right dock"
            icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            onClick={onClose}
            data-testid="map-right-dock-close"
          />
        </div>
      </aside>
    );
  }

  const hostBody = (
    <aside
      ref={hostRef}
      className={`${styles.host}${presentation === "floating-modal" ? ` ${styles.floatingHost}` : ""}`}
      aria-label={activeDefinition.label}
      data-testid="map-right-dock-host"
      data-ui-proof="real-right-dock"
      data-map-right-dock-host="true"
      data-map-right-dock-panel={route.panel}
      data-map-right-dock-source={route.source}
      data-presentation={presentation}
      data-tab-layout={tabLayout}
      data-panel-tier={getMapRightDockPanelTier(route.panel)}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-closing={closing ? "true" : "false"}
      data-pinned={pinned ? "true" : "false"}
      data-resizing={isResizing ? "true" : "false"}
      data-dragging={isDragging ? "true" : "false"}
      tabIndex={-1}
      style={{
        "--right-dock-width": `${resolvedWidth}px`,
        "--right-dock-height": `${resolvedHeight}px`,
        "--right-dock-x": `${normalizedFloatingRect?.x ?? 0}px`,
        "--right-dock-y": `${normalizedFloatingRect?.y ?? 0}px`,
      } as React.CSSProperties}
    >
      {presentation !== "floating-modal" && onWidthChange ? (
        <button
          type="button"
          className={styles.resizeHandle}
          aria-label={`Resize ${activeDefinition.label}`}
          title={`Resize ${activeDefinition.label}`}
          onPointerDown={handleResizePointerDown}
        />
      ) : null}
      {presentation === "floating-modal" && onFloatingRectChange ? (
        <>
          {FLOATING_RESIZE_HANDLES.map((handle) => (
            <button
              key={handle.id}
              type="button"
              className={`${styles.floatingResizeHandle} ${handle.className}`}
              aria-label={handle.label}
              title={handle.label}
              onPointerDown={(event) => handleFloatingResizePointerDown(event, handle.direction)}
            />
          ))}
        </>
      ) : null}
      <MapDockPanelFrame
        title={activeDefinition.label}
        subtitle={PANEL_SUBTITLE[route.panel] ?? "Inspector"}
        activeWorkspaceName={TIER_LABELS[getMapRightDockPanelTier(route.panel)]}
        closeLabel="Close right dock"
        collapseLabel={`Collapse ${activeDefinition.label}`}
        onToggleCollapse={presentation === "floating-modal" ? undefined : onCollapse}
        onClose={onClose}
        closeTestId="map-right-dock-close"
        collapseTestId="map-right-dock-collapse"
        className={`${styles.frame}${!reducedMotion && !closing ? ` ${motionStyles.panelIn}` : ""}`}
        headerClassName={presentation === "floating-modal" ? styles.floatingHeader : undefined}
        headerProps={presentation === "floating-modal"
          ? {
            onPointerDown: handleFloatingHeaderPointerDown,
            onDoubleClick: panelDrag.dragHandleProps.onDoubleClick,
            title: panelDrag.dragHandleProps.title,
            style: panelDrag.dragHandleStyle,
          }
          : undefined}
        bodyStyle={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", minHeight: 0 }}
        aria-label={`${activeDefinition.label} right dock frame`}
        actions={(
          <>
            {panelStatus ? (
              <GisStatusChip
                status={panelStatus.status}
                label={panelStatus.label}
                density="compact"
                title={panelStatus.title ?? `${activeDefinition.label} status: ${panelStatus.label}. ${stateLabel}`}
                data-testid="map-right-dock-status"
              />
            ) : null}
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
          <div
            key={route.panel}
            className={`${styles.bodyContent}${!reducedMotion ? ` ${motionStyles.fadeIn}` : ""}`}
            data-map-right-dock-body-content="true"
          >
            {children ?? (
              <GisEmptyState
                icon={<Info size={MAP_ICON_SIZES.md} aria-hidden="true" />}
                title={`No ${activeDefinition.label.toLowerCase()} content`}
                description="No content is available for the current map context."
                style={{ minHeight: "12rem" }}
                data-testid="map-right-dock-empty"
              />
            )}
          </div>
        </div>
      </MapDockPanelFrame>
    </aside>
  );

  if (presentation === "floating-modal") {
    const portalRoot = getMapOverlayPortalRoot();
    if (portalRoot) {
      return createPortal(hostBody, portalRoot);
    }
  }

  return hostBody;
};
