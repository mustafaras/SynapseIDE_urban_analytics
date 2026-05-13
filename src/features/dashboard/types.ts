export type DashboardWidgetType =
  | "kpi"
  | "map"
  | "chart"
  | "table"
  | "text"
  | "comparison"
  | "live_indicator";

export type DashboardBindingKind =
  | "metric"
  | "series"
  | "table"
  | "map"
  | "comparison"
  | "text"
  | "live";

export type DashboardBindingRefreshMode = "static" | "manual" | "live";

export type DashboardBindingQAState =
  | "unvalidated"
  | "valid"
  | "warning"
  | "stale"
  | "invalid"
  | "blocked";

export type DashboardTemplateId =
  | "city_profile"
  | "sdg_monitoring"
  | "risk_assessment"
  | "accessibility_equity"
  | "neighborhood_comparison";

export interface DashboardWidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AdvancedChartTypeId =
  | "parallel_coordinates"
  | "radar"
  | "sankey"
  | "treemap"
  | "violin"
  | "beeswarm"
  | "small_multiples"
  | "cartogram"
  | "dot_density"
  | "sparkline_grid"
  | "waffle"
  | "slope"
  | "lollipop"
  | "box_whisker_map";

export interface DashboardWidgetStyle {
  accentColor?: string;
  background?: string;
  chartVariant?: "bar" | "line" | "area";
  density?: "comfortable" | "compact";
  textAlign?: "left" | "center" | "right";
  advancedChartType?: AdvancedChartTypeId | null;
}

export interface DashboardWidgetConfig {
  title: string;
  subtitle?: string;
  bindingId?: string;
  body?: string;
  style?: DashboardWidgetStyle;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  layout: DashboardWidgetLayout;
  config: DashboardWidgetConfig;
}

export interface DashboardDocument {
  id: string;
  name: string;
  description: string;
  templateId?: DashboardTemplateId | null;
  createdAt: string;
  updatedAt: string;
  columns: number;
  widgets: DashboardWidget[];
  tags: string[];
}

export interface DashboardLibraryState {
  version: 1;
  dashboards: DashboardDocument[];
  activeDashboardId: string | null;
}

export interface DashboardWidgetLibraryEntry {
  type: DashboardWidgetType;
  label: string;
  description: string;
  dragLabel: string;
  defaultLayout: DashboardWidgetLayout;
}

export interface DashboardBindingTraceability {
  sourceArtifactId?: string;
  sourceRunId?: string;
  sourceIndicatorKind?: string;
  sourceLayerIds?: string[];
  refreshMode?: DashboardBindingRefreshMode;
  scaleLabel?: string;
  uncertaintyLabel?: string;
  sourceContextLabel?: string;
  dataFields?: string[];
  visualEncodingSummary?: string;
  publicationReadinessStatus?: string;
  provenanceNotes?: string[];
  qaState?: DashboardBindingQAState;
  qaWarnings?: string[];
  qaLimitations?: string[];
}

export interface DashboardBindingTraceabilityFields {
  traceability?: DashboardBindingTraceability;
}

export interface DashboardMetricBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "metric";
  label: string;
  description: string;
  formattedValue: string;
  rawValue: number;
  unit?: string;
  changeLabel?: string;
  status: "improving" | "steady" | "watch" | "critical";
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export interface DashboardSeriesBindingPoint {
  label: string;
  value: number;
  target?: number;
}

export interface DashboardSeriesBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "series";
  label: string;
  description: string;
  unit?: string;
  points: DashboardSeriesBindingPoint[];
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export interface DashboardTableBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "table";
  label: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export interface DashboardMapBindingArea {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  status: "improving" | "steady" | "watch" | "critical";
}

export interface DashboardMapBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "map";
  label: string;
  description: string;
  unit?: string;
  areas: DashboardMapBindingArea[];
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export interface DashboardComparisonBindingItem {
  label: string;
  primary: number;
  secondary: number;
  unit?: string;
}

export interface DashboardComparisonBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "comparison";
  label: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  items: DashboardComparisonBindingItem[];
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export interface DashboardTextBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "text";
  label: string;
  description: string;
  headline: string;
  paragraphs: string[];
  highlights: string[];
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export interface DashboardLiveBinding extends DashboardBindingTraceabilityFields {
  id: string;
  kind: "live";
  label: string;
  description: string;
  formattedValue: string;
  rawValue: number;
  trendPoints: number[];
  source: string;
  cadence: string;
  statusLabel: string;
  updatedAt: string;
  tags: DashboardTemplateId[];
}

export type DashboardBinding =
  | DashboardMetricBinding
  | DashboardSeriesBinding
  | DashboardTableBinding
  | DashboardMapBinding
  | DashboardComparisonBinding
  | DashboardTextBinding
  | DashboardLiveBinding;

export interface DashboardTemplateDefinition {
  id: DashboardTemplateId;
  label: string;
  description: string;
  audience: string;
  useCase: string;
  tags: string[];
  dashboard: DashboardDocument;
}
