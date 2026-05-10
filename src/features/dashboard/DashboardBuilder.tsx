import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  FileImage,
  FileText,
  GripVertical,
  LayoutGrid,
  PencilLine,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import flowStyles from "@/centerpanel/styles/flows.module.css";
import {
  useCollaborationOptional,
  useCollaborativeDashboardOptional,
  useScopePresence,
} from "@/features/collaboration/hooks";
import {
  CollaborationCommentSidebar,
  CollaborationPresenceStrip,
  CollaborationSessionOverview,
} from "@/features/collaboration/CollaborationUI";
import styles from "./dashboard.module.css";
import { getDashboardBinding, listBindingsForTemplate, listBindingsForWidgetType } from "./dataBindings";
import { downloadDashboardHtml, downloadDashboardPdf, downloadDashboardPng } from "./export";
import {
  ADVANCED_CHART_META,
  AdvancedChartGallery,
  AdvancedChartPicker,
  type AdvancedChartType,
  downloadChartPng,
  downloadChartSvg,
  getAdvancedChartMeta,
} from "./advancedCharts";
import {
  createEmptyDashboard,
  createWidget,
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_ROW_HEIGHT,
  findFirstAvailablePosition,
  touchDashboard,
  WIDGET_BINDING_COMPATIBILITY,
  WIDGET_LIBRARY,
} from "./layout";
import { createDashboardFromTemplate, listDashboardTemplates } from "./templates";
import {
  consumePendingDashboardBinding,
  loadDashboardLibrary,
  persistDashboardLibrary,
  upsertDashboardDocument,
} from "./storage";
import { DashboardWidgetContent } from "./DashboardWidgetContent";
import type {
  DashboardDocument,
  DashboardLibraryState,
  DashboardWidget,
  DashboardWidgetConfig,
  DashboardWidgetStyle,
  DashboardWidgetType,
} from "./types";

const DND_MIME = "application/x-synapse-dashboard";

type DragPayload =
  | { source: "library"; widgetType: DashboardWidgetType; advancedChartType?: AdvancedChartType }
  | { source: "canvas"; widgetId: string };

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--syn-overlay-light)",
  borderRadius: 14,
  background: "linear-gradient(180deg, rgba(15,23,42,0.88), rgba(15,23,42,0.72))",
  boxShadow: "0 18px 34px rgba(2,6,23,0.24)",
  padding: 12,
};

const widgetShellStyle: React.CSSProperties = {
  ...cardStyle,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 0,
  overflow: "hidden",
};

function formatWidgetLabel(type: DashboardWidgetType): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (match: string) => match.toUpperCase());
}

function getDashboardWidgetTestId(widget: DashboardWidget): string {
  return `dashboard-widget-${widget.config.bindingId ?? widget.id}`;
}

function buildWidgetConfig(options: {
  title: string;
  bindingId?: string | undefined;
  subtitle?: string | undefined;
  body?: string | undefined;
  style?: DashboardWidgetStyle | undefined;
}): DashboardWidgetConfig {
  return {
    title: options.title,
    ...(options.bindingId === undefined ? {} : { bindingId: options.bindingId }),
    ...(options.subtitle === undefined ? {} : { subtitle: options.subtitle }),
    ...(options.body === undefined ? {} : { body: options.body }),
    ...(options.style === undefined ? {} : { style: options.style }),
  };
}

function getDefaultBindingId(type: DashboardWidgetType, templateId?: DashboardDocument["templateId"]): string | undefined {
  const templateBindings = templateId ? listBindingsForTemplate(templateId) : [];
  const compatibleKinds = new Set(WIDGET_BINDING_COMPATIBILITY[type]);
  const preferred = templateBindings.find((binding) => compatibleKinds.has(binding.kind));
  if (preferred) {
    return preferred.id;
  }
  return listBindingsForWidgetType(type)[0]?.id;
}

function widgetCountSummary(document: DashboardDocument): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  document.widgets.forEach((widget) => {
    counts.set(widget.type, (counts.get(widget.type) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, count]) => ({ label: formatWidgetLabel(label as DashboardWidgetType), count }));
}

function parseDragPayload(event: React.DragEvent): DragPayload | null {
  const raw = event.dataTransfer.getData(DND_MIME);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

function compareDocumentsByUpdatedAt(left: DashboardDocument, right: DashboardDocument): number {
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function mergeDashboardLibraryState(
  collaborativeState: DashboardLibraryState,
  localState: DashboardLibraryState,
): DashboardLibraryState {
  const dashboardsById = new Map<string, DashboardDocument>();

  for (const dashboard of localState.dashboards) {
    dashboardsById.set(dashboard.id, dashboard);
  }

  for (const dashboard of collaborativeState.dashboards) {
    const existing = dashboardsById.get(dashboard.id);
    if (!existing || Date.parse(dashboard.updatedAt) >= Date.parse(existing.updatedAt)) {
      dashboardsById.set(dashboard.id, dashboard);
    }
  }

  const dashboards = Array.from(dashboardsById.values()).sort(compareDocumentsByUpdatedAt);
  const activeDashboardId = localState.activeDashboardId && dashboardsById.has(localState.activeDashboardId)
    ? localState.activeDashboardId
    : collaborativeState.activeDashboardId && dashboardsById.has(collaborativeState.activeDashboardId)
      ? collaborativeState.activeDashboardId
      : dashboards[0]?.id ?? null;

  return {
    version: 1,
    dashboards,
    activeDashboardId,
  };
}

export interface DashboardBuilderProps {
  title?: string;
  subtitle?: string;
  pendingBindingRequest?: {
    bindingId: string;
    widgetType: DashboardWidgetType;
    requestedAt: number;
  } | null;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  title = "Dashboard Builder",
  subtitle = "Compose drag-and-drop dashboards for city briefs, classroom studios, and research summaries.",
  pendingBindingRequest = null,
}) => {
  const templates = useMemo(() => listDashboardTemplates(), []);
  const dashboardCollaboration = useCollaborativeDashboardOptional();
  const collaboration = useCollaborationOptional();
  const [localLibraryState, setLocalLibraryState] = useState<DashboardLibraryState>(() => loadDashboardLibrary());
  const libraryState = useMemo(
    () => dashboardCollaboration ? mergeDashboardLibraryState(dashboardCollaboration.state, localLibraryState) : localLibraryState,
    [dashboardCollaboration, localLibraryState],
  );
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [restoreCandidateId, setRestoreCandidateId] = useState<string>("");
  const [draftName, setDraftName] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("Dashboard builder ready.");
  const [dragHover, setDragHover] = useState<{ x: number; y: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const handledPendingBindingRequestRef = useRef<number | null>(null);

  const activeDashboard = useMemo(() => {
    const activeId = libraryState.activeDashboardId;
    return libraryState.dashboards.find((dashboard) => dashboard.id === activeId) ?? libraryState.dashboards[0] ?? createEmptyDashboard();
  }, [libraryState]);

  const selectedWidget = useMemo(
    () => activeDashboard.widgets.find((widget) => widget.id === selectedWidgetId) ?? null,
    [activeDashboard.widgets, selectedWidgetId],
  );
  const selectedWidgetFocusId = selectedWidget?.id ?? null;
  const selectedWidgetFocusTitle = selectedWidget?.config.title ?? null;
  const dashboardScopeId = activeDashboard.id ? `dashboard:${activeDashboard.id}` : undefined;
  const dashboardPresence = useScopePresence(dashboardScopeId);

  const sortedDashboards = useMemo(
    () => [...libraryState.dashboards].sort(compareDocumentsByUpdatedAt),
    [libraryState.dashboards],
  );

  const canvasRows = useMemo(() => {
    const contentRows = Math.max(...activeDashboard.widgets.map((widget) => widget.layout.y + widget.layout.h), 0);
    return Math.max(8, contentRows + 2);
  }, [activeDashboard.widgets]);

  useEffect(() => {
    setDraftName(activeDashboard.name);
    setRestoreCandidateId(activeDashboard.id);
  }, [activeDashboard.id, activeDashboard.name]);

  useEffect(() => {
    persistDashboardLibrary(libraryState);
  }, [libraryState]);

  useEffect(() => {
    if (!collaboration || !dashboardScopeId) {
      return;
    }
    collaboration.updatePresence({
      activeScope: dashboardScopeId,
      activeSection: selectedWidgetFocusId ?? activeDashboard.id,
      activeLabel: selectedWidgetFocusTitle ?? activeDashboard.name,
      selectionText: selectedWidgetFocusTitle ? `Widget ${selectedWidgetFocusTitle}` : `Dashboard ${activeDashboard.name}`,
    });
  }, [activeDashboard.id, activeDashboard.name, collaboration, dashboardScopeId, selectedWidgetFocusId, selectedWidgetFocusTitle]);

  const announce = useCallback((message: string): void => {
    setStatusMessage(message);
  }, []);

  const updateLibrary = useCallback((updater: (previous: DashboardLibraryState) => DashboardLibraryState): void => {
    setLocalLibraryState((previous) => updater(previous));
  }, []);

  const updateActiveDashboard = useCallback((updater: (dashboard: DashboardDocument) => DashboardDocument): void => {
    if (dashboardCollaboration) {
      const current = libraryState.dashboards.find((dashboard) => dashboard.id === libraryState.activeDashboardId)
        ?? libraryState.dashboards[0]
        ?? createEmptyDashboard();
      const next = touchDashboard(updater(current));
      updateLibrary((previous) => upsertDashboardDocument(previous, next, true));
      dashboardCollaboration.upsertDashboardDocument(next, true);
      return;
    }
    updateLibrary((previous) => {
      const current = previous.dashboards.find((dashboard) => dashboard.id === previous.activeDashboardId)
        ?? previous.dashboards[0]
        ?? createEmptyDashboard();
      const next = touchDashboard(updater(current));
      return upsertDashboardDocument(previous, next, true);
    });
  }, [dashboardCollaboration, libraryState.activeDashboardId, libraryState.dashboards, updateLibrary]);

  function createBlankDashboard(): void {
    const blank = createEmptyDashboard("Untitled Urban Dashboard");
    if (dashboardCollaboration) {
      dashboardCollaboration.upsertDashboardDocument(blank, true);
    } else {
      updateLibrary((previous) => upsertDashboardDocument(previous, blank, true));
    }
    setSelectedWidgetId(null);
    announce("Created a blank dashboard.");
  }

  function duplicateSelectedWidget(): void {
    if (!selectedWidget) {
      return;
    }
    updateActiveDashboard((dashboard) => {
      const duplicate = createWidget(selectedWidget.type, {
        ...selectedWidget,
        id: `${selectedWidget.id}-copy-${Date.now()}`,
        layout: findFirstAvailablePosition(
          dashboard.widgets,
          {
            ...selectedWidget.layout,
            x: selectedWidget.layout.x + 1,
            y: selectedWidget.layout.y + 1,
          },
        ),
      });
      return { ...dashboard, widgets: [...dashboard.widgets, duplicate] };
    });
    announce(`Duplicated ${selectedWidget.config.title}.`);
  }

  function deleteSelectedWidget(): void {
    if (!selectedWidget) {
      return;
    }
    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      widgets: dashboard.widgets.filter((widget) => widget.id !== selectedWidget.id),
    }));
    setSelectedWidgetId(null);
    announce(`Removed ${selectedWidget.config.title}.`);
  }

  function addWidget(
    type: DashboardWidgetType,
    desiredPosition?: { x: number; y: number },
    advancedChartType?: AdvancedChartType,
  ): void {
    updateActiveDashboard((dashboard) => {
      const bindingId = advancedChartType ? undefined : getDefaultBindingId(type, dashboard.templateId);
      const advancedMeta = advancedChartType ? getAdvancedChartMeta(advancedChartType) : null;
      const baseTitle = advancedMeta
        ? advancedMeta.label
        : WIDGET_LIBRARY.find((entry) => entry.type === type)?.label ?? formatWidgetLabel(type);
      const subtitle = advancedMeta
        ? advancedMeta.description
        : bindingId
          ? getDashboardBinding(bindingId)?.label
          : undefined;
      const style = {
        accentColor: "#f59e0b",
        chartVariant: "bar" as const,
        density: "comfortable" as const,
        textAlign: "left" as const,
        ...(advancedChartType ? { advancedChartType } : {}),
      };
      const baseLayout = WIDGET_LIBRARY.find((entry) => entry.type === type)?.defaultLayout ?? { x: 0, y: 0, w: 4, h: 3 };
      const advancedLayout = advancedChartType ? { ...baseLayout, w: Math.max(baseLayout.w, 6), h: Math.max(baseLayout.h, 4) } : baseLayout;
      const nextWidget = createWidget(type, {
        config: buildWidgetConfig({
          title: baseTitle,
          ...(bindingId !== undefined ? { bindingId } : {}),
          ...(subtitle !== undefined ? { subtitle } : {}),
          style,
        }),
        layout: findFirstAvailablePosition(
          dashboard.widgets,
          {
            ...advancedLayout,
            x: desiredPosition?.x ?? 0,
            y: desiredPosition?.y ?? 0,
          },
        ),
      });
      setSelectedWidgetId(nextWidget.id);
      return {
        ...dashboard,
        widgets: [...dashboard.widgets, nextWidget],
      };
    });
    announce(advancedChartType
      ? `Added ${getAdvancedChartMeta(advancedChartType).label} chart.`
      : `Added ${formatWidgetLabel(type)} widget.`);
  }

  const addWidgetFromBinding = useCallback((bindingId: string, type: DashboardWidgetType): void => {
    const binding = getDashboardBinding(bindingId);
    if (!binding) {
      return;
    }

    updateActiveDashboard((dashboard) => {
      const baseLayout = WIDGET_LIBRARY.find((entry) => entry.type === type)?.defaultLayout ?? { x: 0, y: 0, w: 4, h: 3 };
      const nextWidget = createWidget(type, {
        config: buildWidgetConfig({
          title: binding.label,
          bindingId,
          subtitle: binding.description,
          style: {
            accentColor: "#f59e0b",
            chartVariant: binding.kind === "series" ? "line" : "bar",
            density: "comfortable",
            textAlign: "left",
          },
        }),
        layout: findFirstAvailablePosition(
          dashboard.widgets,
          {
            ...baseLayout,
            x: 0,
            y: 0,
          },
        ),
      });
      setSelectedWidgetId(nextWidget.id);
      return {
        ...dashboard,
        widgets: [...dashboard.widgets, nextWidget],
      };
    });

    announce(`Added ${binding.label} to the dashboard.`);
  }, [announce, updateActiveDashboard]);

  useEffect(() => {
    if (libraryState.dashboards.length === 0) {
      return;
    }
    const pending = consumePendingDashboardBinding();
    if (!pending) {
      return;
    }
    addWidgetFromBinding(pending.bindingId, pending.widgetType);
  }, [activeDashboard.id, addWidgetFromBinding, libraryState.dashboards.length]);

  useEffect(() => {
    if (!pendingBindingRequest || libraryState.dashboards.length === 0) {
      return;
    }
    if (handledPendingBindingRequestRef.current === pendingBindingRequest.requestedAt) {
      return;
    }
    handledPendingBindingRequestRef.current = pendingBindingRequest.requestedAt;
    addWidgetFromBinding(pendingBindingRequest.bindingId, pendingBindingRequest.widgetType);
  }, [activeDashboard.id, addWidgetFromBinding, libraryState.dashboards.length, pendingBindingRequest]);

  function moveWidget(widgetId: string, x: number, y: number): void {
    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      widgets: dashboard.widgets.map((widget) => (
        widget.id === widgetId
          ? {
              ...widget,
              layout: findFirstAvailablePosition(
                dashboard.widgets,
                { ...widget.layout, x, y },
                widget.id,
              ),
            }
          : widget
      )),
    }));
  }

  function pointerToGrid(clientX: number, clientY: number): { x: number; y: number } | null {
    const node = previewRef.current;
    if (!node) {
      return null;
    }
    const rect = node.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top - 88;
    const colWidth = rect.width / DASHBOARD_GRID_COLUMNS;
    return {
      x: Math.max(0, Math.min(DASHBOARD_GRID_COLUMNS - 1, Math.floor(relativeX / Math.max(colWidth, 1)))),
      y: Math.max(0, Math.floor(relativeY / DASHBOARD_ROW_HEIGHT)),
    };
  }

  function handleCanvasDragOver(event: React.DragEvent): void {
    event.preventDefault();
    const gridPosition = pointerToGrid(event.clientX, event.clientY);
    if (gridPosition) {
      setDragHover(gridPosition);
    }
  }

  function handleCanvasDrop(event: React.DragEvent): void {
    event.preventDefault();
    const payload = parseDragPayload(event);
    const gridPosition = pointerToGrid(event.clientX, event.clientY) ?? dragHover ?? { x: 0, y: 0 };
    setDragHover(null);
    if (!payload) {
      return;
    }
    if (payload.source === "library") {
      addWidget(payload.widgetType, gridPosition, payload.advancedChartType);
      return;
    }
    moveWidget(payload.widgetId, gridPosition.x, gridPosition.y);
    announce("Widget moved on the canvas.");
  }

  async function handleExport(kind: "pdf" | "png" | "html"): Promise<void> {
    if (kind !== "html" && !previewRef.current) {
      announce("Dashboard preview is unavailable for export.");
      return;
    }

    setIsExporting(true);
    try {
      let filename = "";
      if (kind === "html") {
        filename = downloadDashboardHtml(activeDashboard);
      } else if (kind === "pdf") {
        filename = await downloadDashboardPdf(previewRef.current!, activeDashboard.name);
      } else {
        filename = await downloadDashboardPng(previewRef.current!, activeDashboard.name);
      }
      announce(`Exported ${filename}.`);
    } catch (error) {
      announce(error instanceof Error ? error.message : "Dashboard export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleTemplateLoad(templateId: DashboardDocument["templateId"]): void {
    if (!templateId) {
      return;
    }
    const next = createDashboardFromTemplate(templateId);
    if (dashboardCollaboration) {
      dashboardCollaboration.upsertDashboardDocument(next, true);
    } else {
      updateLibrary((previous) => upsertDashboardDocument(previous, next, true));
    }
    setSelectedWidgetId(null);
    announce(`Loaded ${templates.find((template) => template.id === templateId)?.label ?? "template"} dashboard.`);
  }

  function handleRename(): void {
    const nextName = draftName.trim();
    if (!nextName) {
      announce("Enter a dashboard name before renaming.");
      return;
    }
    updateActiveDashboard((dashboard) => ({ ...dashboard, name: nextName }));
    announce("Dashboard renamed.");
  }

  function handleSave(): void {
    const ok = persistDashboardLibrary(libraryState);
    announce(ok ? "Dashboard layouts saved." : "Dashboard save failed.");
  }

  function handleRestore(): void {
    if (!restoreCandidateId) {
      return;
    }
    if (dashboardCollaboration) {
      dashboardCollaboration.setActiveDashboardId(restoreCandidateId);
    } else {
      updateLibrary((previous) => ({
        ...previous,
        activeDashboardId: restoreCandidateId,
      }));
    }
    setSelectedWidgetId(null);
    announce("Restored saved dashboard.");
  }

  function updateWidgetConfig(widgetId: string, updater: (widget: DashboardWidget) => DashboardWidget): void {
    updateActiveDashboard((dashboard) => {
      const others = dashboard.widgets.filter((widget) => widget.id !== widgetId);
      return {
        ...dashboard,
        widgets: dashboard.widgets.map((widget) => {
          if (widget.id !== widgetId) {
            return widget;
          }
          const updated = updater(widget);
          return {
            ...updated,
            layout: findFirstAvailablePosition(others, updated.layout, widgetId),
          };
        }),
      };
    });
  }

  return (
    <section className={`${flowStyles.panel} ${styles.workspace}`}>
      <header className={`${flowStyles.flowHeader} ${styles.hero}`}>
        <div>
          <div className={flowStyles.flowTitleRow}>
            <div className={flowStyles.flowTitleMain}>{title}</div>
            <div className={flowStyles.flowTitleMeta}>Prompt 26 · Primary dashboard workspace</div>
          </div>
          <div className={flowStyles.flowSubtitle}>{subtitle}</div>
        </div>
        <div style={{ minWidth: 260, maxWidth: 360 }}>
          <div className={flowStyles.formLabel}>Current dashboard</div>
          <div className={flowStyles.formHint}>
            {activeDashboard.name} · {activeDashboard.widgets.length} widgets · {activeDashboard.templateId ?? "custom"} template lineage
          </div>
        </div>
      </header>

      <div aria-live="polite" style={{ ...cardStyle, padding: 10, fontSize: 12, color: "var(--syn-text-muted)" }}>
        {statusMessage}
      </div>

      <CollaborationPresenceStrip
        participants={dashboardPresence}
        label={`Shared dashboard room · ${activeDashboard.name}`}
        emptyLabel="Open another tab to verify live widget selection and shared dashboard awareness."
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <input
            className={flowStyles.input}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Dashboard name"
            aria-label="Dashboard name"
            style={{ minWidth: 240 }}
          />
          <button type="button" className={flowStyles.outlineBtn} onClick={handleRename}>
            <PencilLine size={14} /> Rename
          </button>
          <button type="button" className={flowStyles.outlineBtn} onClick={handleSave}>
            <Save size={14} /> Save
          </button>
          <button type="button" className={flowStyles.outlineBtn} onClick={createBlankDashboard}>
            <Plus size={14} /> New Blank
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <select
            className={flowStyles.select}
            value={restoreCandidateId}
            onChange={(event) => setRestoreCandidateId(event.target.value)}
            aria-label="Saved dashboards"
            style={{ minWidth: 220 }}
          >
            {sortedDashboards.map((dashboard) => (
              <option key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </option>
            ))}
          </select>
          <button type="button" className={flowStyles.outlineBtn} onClick={handleRestore}>
            <RefreshCcw size={14} /> Restore
          </button>
          <button type="button" className={flowStyles.outlineBtn} onClick={() => handleExport("pdf")} disabled={isExporting}>
            <FileText size={14} /> PDF
          </button>
          <button type="button" className={flowStyles.outlineBtn} onClick={() => handleExport("png")} disabled={isExporting}>
            <FileImage size={14} /> PNG
          </button>
          <button type="button" className={flowStyles.outlineBtn} onClick={() => handleExport("html")} disabled={isExporting}>
            <Download size={14} /> HTML
          </button>
        </div>
      </div>

      <div className={flowStyles.stepContentCard}>
        <div className={flowStyles.stepCardTitle}>Advanced Chart Gallery</div>
        <div className={flowStyles.formHint}>
          Browse the fourteen multivariate charts. Drag a card onto the canvas or click to add it to the active dashboard.
        </div>
        <div style={{ marginTop: 10 }}>
          <AdvancedChartGallery
            onSelect={(type) => addWidget("chart", undefined, type)}
            activeType={selectedWidget?.config.style?.advancedChartType ?? null}
          />
        </div>
      </div>

      <div className={flowStyles.stepContentCard}>
        <div className={flowStyles.stepCardTitle}>Template Gallery</div>
        <div className={styles.templateGrid}>
          {templates.map((template) => (
            <article key={template.id} className={styles.templateCard}>
              <div className={flowStyles.formLabel}>{template.label}</div>
              <div className={flowStyles.formHint}>{template.description}</div>
              <div className={styles.note}><strong>Use case:</strong> {template.useCase}</div>
              <div className={styles.note}><strong>Audience:</strong> {template.audience}</div>
              <button type="button" className={flowStyles.outlineBtn} onClick={() => handleTemplateLoad(template.id)}>
                Load Template
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={flowStyles.stepContentCard}>
            <div className={flowStyles.stepCardTitle}>Widget Library</div>
            <div className={styles.list}>
              {WIDGET_LIBRARY.map((entry) => (
                <button
                  key={entry.type}
                  type="button"
                  className={flowStyles.outlineBtn}
                  draggable
                  onClick={() => addWidget(entry.type)}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(DND_MIME, JSON.stringify({ source: "library", widgetType: entry.type } satisfies DragPayload));
                  }}
                  onDragEnd={() => setDragHover(null)}
                  aria-label={entry.dragLabel}
                  style={{ justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <GripVertical size={14} />
                    {entry.label}
                  </span>
                  <span style={{ color: "var(--syn-text-muted)", fontSize: 11 }}>{entry.defaultLayout.w}x{entry.defaultLayout.h}</span>
                </button>
              ))}
            </div>
            <div className={styles.note}>
              Drag a widget into the canvas or click a widget type to place it in the next open slot.
            </div>
          </div>

          <div className={flowStyles.stepContentCard}>
            <div className={flowStyles.stepCardTitle}>Saved Layouts</div>
            <div className={styles.list}>
              {sortedDashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  type="button"
                  className={flowStyles.outlineBtn}
                  onClick={() => {
                    setRestoreCandidateId(dashboard.id);
                    if (dashboardCollaboration) {
                      dashboardCollaboration.setActiveDashboardId(dashboard.id);
                    } else {
                      updateLibrary((previous) => ({ ...previous, activeDashboardId: dashboard.id }));
                    }
                  }}
                  style={{
                    borderColor: dashboard.id === activeDashboard.id ? "var(--syn-accent-primary)" : undefined,
                    justifyContent: "space-between",
                  }}
                >
                  <span>{dashboard.name}</span>
                  <span style={{ color: "var(--syn-text-muted)", fontSize: 11 }}>{dashboard.widgets.length} widgets</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className={styles.canvasWrap}>
          <div className={flowStyles.stepContentCard}>
            <div className={flowStyles.stepCardTitle}>Layout Canvas</div>
            <div className={flowStyles.formHint}>
              Snap-to-grid placement uses a 12-column layout. Widgets can be dragged from the library or repositioned within the canvas.
            </div>
          </div>

          <div
            ref={previewRef}
            role="grid"
            aria-label="Dashboard layout canvas"
            tabIndex={0}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onDragLeave={() => setDragHover(null)}
            style={{
              ...cardStyle,
              padding: 14,
              display: "grid",
              gap: 14,
              background: "radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 32%), linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.88))",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{activeDashboard.name}</div>
                <div style={{ color: "var(--syn-text-muted)", fontSize: 13, maxWidth: 760 }}>{activeDashboard.description}</div>
              </div>
              <div style={{ display: "grid", gap: 4, justifyItems: "end", fontSize: 11, color: "var(--syn-text-muted)" }}>
                <span>{activeDashboard.templateId ?? "custom"} template</span>
                <span>{activeDashboard.widgets.length} widgets</span>
                <span>Updated {new Date(activeDashboard.updatedAt).toLocaleString("en-US")}</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${DASHBOARD_GRID_COLUMNS}, minmax(0, 1fr))`,
                gridAutoRows: `${DASHBOARD_ROW_HEIGHT}px`,
                gap: 10,
                minHeight: canvasRows * DASHBOARD_ROW_HEIGHT,
              }}
            >
              {Array.from({ length: canvasRows * DASHBOARD_GRID_COLUMNS }, (_, index) => {
                const x = index % DASHBOARD_GRID_COLUMNS;
                const y = Math.floor(index / DASHBOARD_GRID_COLUMNS);
                const isHover = dragHover?.x === x && dragHover?.y === y;
                return (
                  <div
                    key={`cell-${x}-${y}`}
                    style={{
                      gridColumn: x + 1,
                      gridRow: y + 1,
                      borderRadius: 12,
                      border: isHover ? "1px solid rgba(56,189,248,0.8)" : "1px dashed rgba(148,163,184,0.16)",
                      background: isHover ? "rgba(56,189,248,0.10)" : "rgba(255,255,255,0.02)",
                      transition: "background 120ms ease, border-color 120ms ease",
                    }}
                  />
                );
              })}

              {activeDashboard.widgets.map((widget) => {
                const binding = getDashboardBinding(widget.config.bindingId);
                const widgetEditors = dashboardPresence.filter((presence) => !presence.isSelf && presence.activeSection === widget.id);
                return (
                  <article
                    key={widget.id}
                    data-testid={getDashboardWidgetTestId(widget)}
                    data-widget-binding-id={widget.config.bindingId ?? undefined}
                    data-widget-id={widget.id}
                    data-widget-type={widget.type}
                    style={{
                      ...widgetShellStyle,
                      gridColumn: `${widget.layout.x + 1} / span ${widget.layout.w}`,
                      gridRow: `${widget.layout.y + 1} / span ${widget.layout.h}`,
                      zIndex: 2,
                      borderColor: selectedWidgetId === widget.id ? "var(--syn-accent-primary)" : "var(--syn-overlay-light)",
                    }}
                  >
                    <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <button
                        type="button"
                        className={flowStyles.outlineBtn}
                        draggable
                        onClick={() => setSelectedWidgetId(widget.id)}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData(DND_MIME, JSON.stringify({ source: "canvas", widgetId: widget.id } satisfies DragPayload));
                        }}
                        onDragEnd={() => setDragHover(null)}
                        style={{
                          display: "grid",
                          gap: 4,
                          padding: 0,
                          background: "transparent",
                          border: "none",
                          boxShadow: "none",
                          textAlign: "left",
                          justifyItems: "start",
                          cursor: "move",
                        }}
                        aria-label={`Select ${widget.config.title}`}
                      >
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                          <GripVertical size={14} />
                          {widget.config.title}
                        </div>
                        {widget.config.subtitle ? <div style={{ fontSize: 12, color: "var(--syn-text-muted)" }}>{widget.config.subtitle}</div> : null}
                      </button>
                      <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "4px 8px",
                            border: "1px solid rgba(245,158,11,0.24)",
                            color: "#fbbf24",
                            fontSize: 11,
                          }}
                        >
                          {formatWidgetLabel(widget.type)}
                        </span>
                        {widgetEditors.map((presence) => (
                          <span
                            key={presence.clientId}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              borderRadius: 999,
                              padding: "4px 8px",
                              border: `1px solid ${presence.color}`,
                              color: "#f8fafc",
                              background: "rgba(15,23,42,0.7)",
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: presence.color,
                              }}
                            />
                            {presence.name}
                          </span>
                        ))}
                      </div>
                    </header>
                    <div style={{ minHeight: 0, flex: 1, overflow: "hidden" }}>
                      <DashboardWidgetContent widget={widget} binding={binding ?? null} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>

        <aside className={styles.inspector}>
          <CollaborationSessionOverview
            scopeId={`dashboard:${activeDashboard.id}`}
            title="Dashboard Collaboration"
            description="Surface active widget focus, queued edits, and review thread load without leaving the dashboard workspace."
            participants={dashboardPresence}
            emptyState="Open this dashboard in another tab to validate live widget focus and shared layout editing."
          />
          <CollaborationCommentSidebar
            scopeId={`dashboard:${activeDashboard.id}`}
            title="Dashboard Threads"
            subtitle="Resolve, reply, and anchor design decisions to the active dashboard or selected widget."
            defaultAnchorLabel={selectedWidget?.config.title ?? activeDashboard.name}
          />
          <div className={flowStyles.stepContentCard}>
            <div className={flowStyles.stepCardTitle}>Widget Configuration</div>
            {selectedWidget ? (
              <div className={styles.list}>
                <div className={flowStyles.formHint}>
                  Selected {formatWidgetLabel(selectedWidget.type)} · {selectedWidget.layout.w} x {selectedWidget.layout.h}
                </div>
                <input
                  className={flowStyles.input}
                  value={selectedWidget.config.title}
                  onChange={(event) => updateWidgetConfig(selectedWidget.id, (widget) => ({
                    ...widget,
                    config: { ...widget.config, title: event.target.value },
                  }))}
                  aria-label="Widget title"
                  placeholder="Widget title"
                />
                <input
                  className={flowStyles.input}
                  value={selectedWidget.config.subtitle ?? ""}
                  onChange={(event) => updateWidgetConfig(selectedWidget.id, (widget) => ({
                    ...widget,
                    config: { ...widget.config, subtitle: event.target.value },
                  }))}
                  aria-label="Widget subtitle"
                  placeholder="Widget subtitle"
                />
                <select
                  className={flowStyles.select}
                  value={selectedWidget.config.bindingId ?? ""}
                  onChange={(event) => {
                    const bindingId = event.target.value || undefined;
                    const binding = getDashboardBinding(bindingId);
                    updateWidgetConfig(selectedWidget.id, (widget) => ({
                      ...widget,
                      config: buildWidgetConfig({
                        title: widget.config.title,
                        bindingId,
                        subtitle: binding ? binding.label : widget.config.subtitle,
                        body: widget.config.body,
                        style: widget.config.style,
                      }),
                    }));
                  }}
                  aria-label="Widget binding"
                >
                  <option value="">No binding</option>
                  {listBindingsForWidgetType(selectedWidget.type).map((binding) => (
                    <option key={binding.id} value={binding.id}>
                      {binding.label}
                    </option>
                  ))}
                </select>
                <textarea
                  className={flowStyles.input}
                  value={selectedWidget.config.body ?? ""}
                  onChange={(event) => updateWidgetConfig(selectedWidget.id, (widget) => ({
                    ...widget,
                    config: { ...widget.config, body: event.target.value },
                  }))}
                  aria-label="Widget body"
                  placeholder="Optional narrative or note"
                  rows={4}
                  style={{ resize: "vertical" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                    Accent
                    <input
                      className={flowStyles.input}
                      type="color"
                      value={selectedWidget.config.style?.accentColor ?? "#f59e0b"}
                      onChange={(event) => updateWidgetConfig(selectedWidget.id, (widget) => ({
                        ...widget,
                        config: {
                          ...widget.config,
                          style: { ...widget.config.style, accentColor: event.target.value },
                        },
                      }))}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                    Density
                    <select
                      className={flowStyles.select}
                      value={selectedWidget.config.style?.density ?? "comfortable"}
                      onChange={(event) => updateWidgetConfig(selectedWidget.id, (widget) => ({
                        ...widget,
                        config: {
                          ...widget.config,
                          style: {
                            ...widget.config.style,
                            density: event.target.value as "comfortable" | "compact",
                          },
                        },
                      }))}
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </label>
                  {selectedWidget.type === "chart" ? (
                    <label style={{ display: "grid", gap: 6, fontSize: 12, gridColumn: "1 / -1" }}>
                      Chart Style
                      <select
                        className={flowStyles.select}
                        value={selectedWidget.config.style?.chartVariant ?? "bar"}
                        onChange={(event) => updateWidgetConfig(selectedWidget.id, (widget) => ({
                          ...widget,
                          config: {
                            ...widget.config,
                            style: {
                              ...widget.config.style,
                              chartVariant: event.target.value as "bar" | "line" | "area",
                            },
                          },
                        }))}
                        disabled={Boolean(selectedWidget.config.style?.advancedChartType)}
                      >
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="area">Area</option>
                      </select>
                    </label>
                  ) : null}
                  {selectedWidget.type === "chart" ? (
                    <div style={{ display: "grid", gap: 6, fontSize: 12, gridColumn: "1 / -1" }}>
                      <label htmlFor={`advanced-chart-type-${selectedWidget.id}`}>
                        Advanced Chart Type
                      </label>
                      <AdvancedChartPicker
                        id={`advanced-chart-type-${selectedWidget.id}`}
                        value={selectedWidget.config.style?.advancedChartType ?? null}
                        onChange={(nextType) => updateWidgetConfig(selectedWidget.id, (widget) => {
                          const meta = nextType ? ADVANCED_CHART_META.find((entry) => entry.type === nextType) : null;
                          const nextSubtitle = meta ? meta.description : widget.config.subtitle;
                          return {
                            ...widget,
                            config: {
                              ...widget.config,
                              title: meta ? meta.label : widget.config.title,
                              ...(nextSubtitle === undefined ? {} : { subtitle: nextSubtitle }),
                              style: {
                                ...widget.config.style,
                                advancedChartType: nextType,
                              },
                            },
                          };
                        })}
                      />
                    </div>
                  ) : null}
                </div>
                {selectedWidget.type === "chart" && selectedWidget.config.style?.advancedChartType ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    <button
                      type="button"
                      className={flowStyles.outlineBtn}
                      onClick={() => {
                        const host = document.querySelector(`[data-advanced-chart-host="${selectedWidget.id}"]`);
                        const ok = downloadChartSvg(host as HTMLElement | null, `${selectedWidget.config.title || "chart"}.svg`);
                        announce(ok ? "Chart exported as SVG." : "Chart export failed.");
                      }}
                    >
                      <FileImage size={14} /> Export SVG
                    </button>
                    <button
                      type="button"
                      className={flowStyles.outlineBtn}
                      onClick={async () => {
                        const host = document.querySelector(`[data-advanced-chart-host="${selectedWidget.id}"]`);
                        const ok = await downloadChartPng(host as HTMLElement | null, `${selectedWidget.config.title || "chart"}.png`);
                        announce(ok ? "Chart exported as PNG." : "Chart export failed.");
                      }}
                    >
                      <FileImage size={14} /> Export PNG
                    </button>
                  </div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <button
                    type="button"
                    className={flowStyles.outlineBtn}
                    onClick={() => updateWidgetConfig(selectedWidget.id, (widget) => ({
                      ...widget,
                      layout: {
                        ...widget.layout,
                        w: Math.max(1, widget.layout.w - 1),
                      },
                    }))}
                  >
                    <LayoutGrid size={14} /> Width -
                  </button>
                  <button
                    type="button"
                    className={flowStyles.outlineBtn}
                    onClick={() => updateWidgetConfig(selectedWidget.id, (widget) => ({
                      ...widget,
                      layout: {
                        ...widget.layout,
                        w: Math.min(DASHBOARD_GRID_COLUMNS, widget.layout.w + 1),
                      },
                    }))}
                  >
                    <LayoutGrid size={14} /> Width +
                  </button>
                  <button
                    type="button"
                    className={flowStyles.outlineBtn}
                    onClick={() => updateWidgetConfig(selectedWidget.id, (widget) => ({
                      ...widget,
                      layout: {
                        ...widget.layout,
                        h: Math.max(1, widget.layout.h - 1),
                      },
                    }))}
                  >
                    <LayoutGrid size={14} /> Height -
                  </button>
                  <button
                    type="button"
                    className={flowStyles.outlineBtn}
                    onClick={() => updateWidgetConfig(selectedWidget.id, (widget) => ({
                      ...widget,
                      layout: {
                        ...widget.layout,
                        h: widget.layout.h + 1,
                      },
                    }))}
                  >
                    <LayoutGrid size={14} /> Height +
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <button type="button" className={flowStyles.outlineBtn} onClick={duplicateSelectedWidget}>
                    <Copy size={14} /> Duplicate
                  </button>
                  <button type="button" className={flowStyles.outlineBtn} onClick={deleteSelectedWidget}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.list}>
                <div className={flowStyles.formHint}>
                  Select a widget to edit its binding, labels, and style. When nothing is selected, this panel shows dashboard-level summaries.
                </div>
                <div style={{ ...cardStyle, padding: 10 }}>
                  <div className={flowStyles.formLabel}>Widget mix</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {widgetCountSummary(activeDashboard).map((entry) => (
                      <div key={entry.label} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                        <span>{entry.label}</span>
                        <strong>{entry.count}</strong>
                      </div>
                    ))}
                    {activeDashboard.widgets.length === 0 ? (
                      <div style={{ color: "var(--syn-text-muted)", fontSize: 12 }}>Add a widget from the library to start composing the dashboard.</div>
                    ) : null}
                  </div>
                </div>
                <div style={{ ...cardStyle, padding: 10 }}>
                  <div className={flowStyles.formLabel}>Template-ready bindings</div>
                  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                    {activeDashboard.templateId ? listBindingsForTemplate(activeDashboard.templateId).slice(0, 6).map((binding) => (
                      <div key={binding.id} style={{ fontSize: 12 }}>
                        <strong>{binding.label}</strong>
                        <div style={{ color: "var(--syn-text-muted)" }}>{binding.kind}</div>
                      </div>
                    )) : (
                      <div style={{ color: "var(--syn-text-muted)", fontSize: 12 }}>
                        Custom dashboards can reuse any binding from the widget inspector.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};
