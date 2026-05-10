import type {
  DashboardBindingKind,
  DashboardDocument,
  DashboardWidget,
  DashboardWidgetConfig,
  DashboardWidgetLayout,
  DashboardWidgetLibraryEntry,
  DashboardWidgetType,
} from "./types";

export const DASHBOARD_GRID_COLUMNS = 12;
export const DASHBOARD_ROW_HEIGHT = 92;

export const WIDGET_BINDING_COMPATIBILITY: Record<DashboardWidgetType, DashboardBindingKind[]> = {
  kpi: ["metric", "live"],
  map: ["map"],
  chart: ["series", "comparison"],
  table: ["table"],
  text: ["text"],
  comparison: ["comparison"],
  live_indicator: ["live", "metric"],
};

export const WIDGET_LIBRARY: DashboardWidgetLibraryEntry[] = [
  {
    type: "kpi",
    label: "KPI Card",
    description: "Single-value performance card for scorecards and briefings.",
    dragLabel: "Drag KPI card",
    defaultLayout: { x: 0, y: 0, w: 3, h: 2 },
  },
  {
    type: "map",
    label: "Map",
    description: "District or neighbourhood surface for spatial dashboards.",
    dragLabel: "Drag map widget",
    defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
  },
  {
    type: "chart",
    label: "Chart",
    description: "Trend, bar, or area chart for monitoring and storytelling.",
    dragLabel: "Drag chart widget",
    defaultLayout: { x: 0, y: 0, w: 6, h: 3 },
  },
  {
    type: "table",
    label: "Table",
    description: "Compact evidence table for reports and classrooms.",
    dragLabel: "Drag table widget",
    defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
  },
  {
    type: "text",
    label: "Text Block",
    description: "Narrative framing, method notes, or policy recommendations.",
    dragLabel: "Drag text widget",
    defaultLayout: { x: 0, y: 0, w: 4, h: 3 },
  },
  {
    type: "comparison",
    label: "Comparison",
    description: "Side-by-side benchmark or neighbourhood comparison panel.",
    dragLabel: "Drag comparison widget",
    defaultLayout: { x: 0, y: 0, w: 6, h: 3 },
  },
  {
    type: "live_indicator",
    label: "Live Indicator",
    description: "Operational pulse card with trend sparkline and update cadence.",
    dragLabel: "Drag live indicator widget",
    defaultLayout: { x: 0, y: 0, w: 4, h: 2 },
  },
];

const DEFAULT_WIDGET_TITLES: Record<DashboardWidgetType, string> = {
  kpi: "Key Metric",
  map: "Spatial Pattern",
  chart: "Trend View",
  table: "Evidence Table",
  text: "Briefing Note",
  comparison: "Comparison View",
  live_indicator: "Live Indicator",
};

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function createWidget(type: DashboardWidgetType, overrides?: Partial<DashboardWidget>): DashboardWidget {
  const baseLayout = WIDGET_LIBRARY.find((entry) => entry.type === type)?.defaultLayout ?? { x: 0, y: 0, w: 4, h: 3 };
  const config: DashboardWidgetConfig = {
    title: DEFAULT_WIDGET_TITLES[type],
    style: {
      accentColor: "#f59e0b",
      chartVariant: "bar",
      density: "comfortable",
      textAlign: "left",
    },
  };
  const mergedConfig: DashboardWidgetConfig = {
    ...config,
    ...(overrides?.config ?? {}),
    style: {
      ...config.style,
      ...(overrides?.config?.style ?? {}),
    },
  };

  return {
    id: randomId(type),
    type,
    ...overrides,
    layout: clampLayout(overrides?.layout ?? baseLayout),
    config: mergedConfig,
  };
}

export function createEmptyDashboard(name = "Urban Decision Dashboard"): DashboardDocument {
  const timestamp = new Date().toISOString();
  return {
    id: randomId("dashboard"),
    name,
    description: "Configurable dashboard for municipal decision support, teaching studios, and research summaries.",
    templateId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    columns: DASHBOARD_GRID_COLUMNS,
    widgets: [],
    tags: ["custom"],
  };
}

export function clampLayout(layout: DashboardWidgetLayout, columns = DASHBOARD_GRID_COLUMNS): DashboardWidgetLayout {
  const w = Math.max(1, Math.min(columns, Math.round(layout.w)));
  const h = Math.max(1, Math.round(layout.h));
  const x = Math.max(0, Math.min(columns - w, Math.round(layout.x)));
  const y = Math.max(0, Math.round(layout.y));
  return { x, y, w, h };
}

export function widgetsOverlap(left: DashboardWidgetLayout, right: DashboardWidgetLayout): boolean {
  return !(
    left.x + left.w <= right.x ||
    right.x + right.w <= left.x ||
    left.y + left.h <= right.y ||
    right.y + right.h <= left.y
  );
}

function collides(widgets: DashboardWidget[], layout: DashboardWidgetLayout, ignoreWidgetId?: string): boolean {
  return widgets.some((widget) => widget.id !== ignoreWidgetId && widgetsOverlap(widget.layout, layout));
}

export function findFirstAvailablePosition(
  widgets: DashboardWidget[],
  desired: DashboardWidgetLayout,
  ignoreWidgetId?: string,
  columns = DASHBOARD_GRID_COLUMNS,
): DashboardWidgetLayout {
  const normalized = clampLayout(desired, columns);
  let candidate = normalized;
  let attempts = 0;

  while (collides(widgets, candidate, ignoreWidgetId) && attempts < 500) {
    candidate = {
      ...candidate,
      x: candidate.x + 1,
      y: candidate.x + candidate.w >= columns ? candidate.y + 1 : candidate.y,
    };
    if (candidate.x + candidate.w > columns) {
      candidate = { ...candidate, x: 0 };
    }
    attempts += 1;
  }

  return clampLayout(candidate, columns);
}

export function validateDashboardWidgets(
  widgets: DashboardWidget[],
  columns = DASHBOARD_GRID_COLUMNS,
): string[] {
  const errors: string[] = [];

  widgets.forEach((widget) => {
    if (widget.layout.x < 0 || widget.layout.y < 0) {
      errors.push(`${widget.id}: negative coordinates are not allowed`);
    }
    if (widget.layout.w < 1 || widget.layout.h < 1) {
      errors.push(`${widget.id}: widget span must be at least 1x1`);
    }
    if (widget.layout.x + widget.layout.w > columns) {
      errors.push(`${widget.id}: widget exceeds dashboard width`);
    }
  });

  for (let index = 0; index < widgets.length; index += 1) {
    for (let inner = index + 1; inner < widgets.length; inner += 1) {
      if (widgetsOverlap(widgets[index]!.layout, widgets[inner]!.layout)) {
        errors.push(`${widgets[index]!.id} overlaps ${widgets[inner]!.id}`);
      }
    }
  }

  return errors;
}

export function normalizeDashboardDocument(document: DashboardDocument): DashboardDocument {
  const normalizedWidgets = document.widgets.reduce<DashboardWidget[]>((accumulator, widget) => {
    const style = {
      accentColor: widget.config?.style?.accentColor ?? "#f59e0b",
      ...(widget.config?.style?.background === undefined ? {} : { background: widget.config.style.background }),
      chartVariant: widget.config?.style?.chartVariant ?? "bar",
      density: widget.config?.style?.density ?? "comfortable",
      textAlign: widget.config?.style?.textAlign ?? "left",
    };
    const normalized = createWidget(widget.type, {
      ...widget,
      layout: clampLayout(widget.layout, document.columns || DASHBOARD_GRID_COLUMNS),
      config: {
        title: widget.config?.title || DEFAULT_WIDGET_TITLES[widget.type],
        ...(widget.config?.subtitle === undefined ? {} : { subtitle: widget.config.subtitle }),
        ...(widget.config?.bindingId === undefined ? {} : { bindingId: widget.config.bindingId }),
        ...(widget.config?.body === undefined ? {} : { body: widget.config.body }),
        style,
      },
    });
    normalized.layout = findFirstAvailablePosition(accumulator, normalized.layout, normalized.id, document.columns || DASHBOARD_GRID_COLUMNS);
    accumulator.push(normalized);
    return accumulator;
  }, []);

  return {
    ...document,
    columns: document.columns || DASHBOARD_GRID_COLUMNS,
    widgets: normalizedWidgets,
    tags: document.tags?.length ? document.tags : ["custom"],
  };
}

export function touchDashboard(document: DashboardDocument): DashboardDocument {
  return {
    ...document,
    updatedAt: new Date().toISOString(),
  };
}
