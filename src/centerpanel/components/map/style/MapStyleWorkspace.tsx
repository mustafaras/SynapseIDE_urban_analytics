import React from "react";
import {
  BadgeCheck,
  CircleDot,
  ListChecks,
  MapPinned,
  Palette,
  Shapes,
  Tags,
} from "lucide-react";
import type { SymbolMode } from "../../MapSymbolLayer";
import { LayerStyleEditor } from "../inspector/style/LayerStyleEditor";
import {
  buildLayerStyleUpdate,
  getDefaultLayerStyleOptions,
  getLayerNumericStyleFieldNames,
  getLayerStyleFieldNames,
  getSerializedLegendSpecFromStyle,
  serializedLegendSpecToCompositionItems,
  type LayerStyleUpdate,
  type SerializedLegendMode,
  type SerializedMapLegendSpec,
} from "../inspector/style/legendContract";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import type { MapSidebarTabId } from "../navigation";
import { MapWorkbenchSidebar, type MapWorkbenchSidebarTab } from "../sidebar";
import { GisEmptyState } from "../ui";

export type MapStyleTabId = Extract<
  MapSidebarTabId,
  "style-renderer" | "style-symbols" | "style-labels" | "style-legend" | "style-advisor"
>;

type StyleSymbolMode = SymbolMode | "heatmap";
type RendererChoiceStatus = "ready" | "limited" | "blocked";

interface RendererChoice {
  mode: SerializedLegendMode;
  label: string;
  description: string;
  status: RendererChoiceStatus;
  reason: string | null;
  facts: string[];
}

interface RendererEligibilitySummary {
  label: string;
  status: "eligible" | "limited" | "blocked";
  reasons: string[];
  fieldCount: number;
  numericFieldCount: number;
  categoricalFieldCount: number;
  staleLabel: string;
  stale: boolean;
  caveats: string[];
  disabledModeReasons: Partial<Record<SerializedLegendMode, string>>;
}

export interface MapStyleWorkspaceProps {
  activeTabId: string;
  onTabChange: (id: string) => void;
  renderer: React.ReactNode;
  symbols: React.ReactNode;
  labels: React.ReactNode;
  legend: React.ReactNode;
  advisor: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  width?: number | string;
}

export interface MapStyleLayerPanelProps {
  layers: readonly OverlayLayerConfig[];
  activeLayer: OverlayLayerConfig | null;
  activeLayerId: string | null;
  onActiveLayerChange: (layerId: string | null) => void;
  onInspectLayer?: (layerId: string) => void;
}

export interface MapStyleRendererPanelProps extends MapStyleLayerPanelProps {
  onApplyStyle?: (layerId: string, update: LayerStyleUpdate) => void;
  onOpenChoroplethPreview: () => void;
  choroplethPreviewActive: boolean;
}

export interface MapStyleSymbolsPanelProps extends MapStyleLayerPanelProps {
  activeMode: StyleSymbolMode;
  symbologyActive: boolean;
  isLoading: boolean;
  error: string | null;
  symbolControls: React.ReactNode;
  onOpenPointSymbology: (mode: StyleSymbolMode) => void;
  onClosePointSymbology: () => void;
}

export interface MapStyleLabelsPanelProps extends MapStyleLayerPanelProps {
  onApplyStyle?: (layerId: string, update: LayerStyleUpdate) => void;
}

export interface MapStyleLegendPanelProps extends MapStyleLayerPanelProps {
  legendSpec?: SerializedMapLegendSpec | null;
}

export interface MapStyleAdvisorPanelProps extends MapStyleLayerPanelProps {
  advisor: React.ReactNode;
}

const STYLE_TAB_DEFINITIONS: ReadonlyArray<{
  id: MapStyleTabId;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "style-renderer", label: "Renderer", icon: <Palette size={13} aria-hidden /> },
  { id: "style-symbols", label: "Symbols", icon: <CircleDot size={13} aria-hidden /> },
  { id: "style-labels", label: "Labels", icon: <Tags size={13} aria-hidden /> },
  { id: "style-legend", label: "Legend", icon: <ListChecks size={13} aria-hidden /> },
  { id: "style-advisor", label: "Advisor", icon: <BadgeCheck size={13} aria-hidden /> },
];

const panelStackStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.sm,
  minHeight: "100%",
  padding: MAP_SPACING.md,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  paddingBottom: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const headerGridStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: 0,
  border: MAP_STROKES.none,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
};

const headerTitleRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: MAP_SPACING.sm,
};

const layerNameStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.titleWrap,
};

const mutedStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  minHeight: "1.25rem",
  padding: `0 ${MAP_SPACING.xs}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.xs,
  color: MAP_COLORS.textSecondary,
  background: MAP_COLORS.transparent,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  maxWidth: "100%",
  overflowWrap: "anywhere",
};

const warningChipStyle: React.CSSProperties = {
  ...chipStyle,
  color: MAP_COLORS.warning,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const layerSelectorStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  maxHeight: "7.5rem",
  overflow: "auto",
};

const legendListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const legendEntryStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.25rem minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
};

const swatchStyle: React.CSSProperties = {
  width: "1rem",
  height: "1rem",
  borderRadius: MAP_RADIUS.xs,
  border: MAP_STROKES.hairlineSubtle,
};

const readinessGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(8.5rem, 1fr))",
  gap: MAP_SPACING.xs,
};

const readinessCellStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.125rem",
  minWidth: 0,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
};

const rendererChoiceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(9.75rem, 1fr))",
  gap: MAP_SPACING.xs,
};

const rendererChoiceTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const caveatListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const caveatRowStyle: React.CSSProperties = {
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.textSecondary,
  background: MAP_COLORS.transparent,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

function actionButtonStyle(active = false, disabled = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: MAP_SPACING.xs,
    minHeight: "1.875rem",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    border: active ? MAP_STROKES.hairlineStrong : MAP_STROKES.hairlineSubtle,
    borderRadius: MAP_RADIUS.sm,
    background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
    color: disabled ? MAP_COLORS.textMuted : active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    maxWidth: "100%",
    textAlign: "center",
  };
}

function rendererChoiceStyle(
  active: boolean,
  status: RendererChoiceStatus,
): React.CSSProperties {
  const blocked = status === "blocked";
  return {
    display: "grid",
    alignContent: "start",
    gap: MAP_SPACING.xs,
    width: "100%",
    minHeight: "7rem",
    padding: MAP_SPACING.sm,
    border: active ? MAP_STROKES.hairlineStrong : MAP_STROKES.hairlineSubtle,
    borderRadius: MAP_RADIUS.sm,
    background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
    color: blocked ? MAP_COLORS.textMuted : MAP_COLORS.text,
    cursor: blocked ? "not-allowed" : "pointer",
    opacity: blocked ? 0.62 : 1,
    textAlign: "left",
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
  };
}

function normalizeGeometryType(layer: OverlayLayerConfig | null): string {
  return layer?.metadata?.geometryType?.trim() || (layer?.type === "heatmap" ? "Point" : "Unknown geometry");
}

function isPointGeometryLabel(geometryType: string): boolean {
  const lower = geometryType.toLowerCase();
  return lower.includes("point");
}

function isPolygonGeometryLabel(geometryType: string): boolean {
  const lower = geometryType.toLowerCase();
  return lower.includes("polygon");
}

function hasFeatureRendererSource(layer: OverlayLayerConfig | null): boolean {
  return layer?.type === "geojson" || layer?.type === "heatmap";
}

function formatStatusLabel(value: string | undefined, fallback: string): string {
  return (value ?? fallback)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLayerQaLabel(layer: OverlayLayerConfig): string {
  const scientificQaStatus = layer.metadata?.scientificQA?.status;
  const status = layer.qaStatus ?? (typeof scientificQaStatus === "string" ? scientificQaStatus : undefined);
  return formatStatusLabel(status, "unchecked");
}

function getLayerPublicationLabel(layer: OverlayLayerConfig): string {
  return formatStatusLabel(layer.metadata?.publicationReadiness?.status, "needs-review");
}

function getStaleResultLabel(layer: OverlayLayerConfig): { label: string; stale: boolean } {
  if (layer.metadata?.analysisResult?.stale) {
    return { label: "Stale result", stale: true };
  }
  if (layer.metadata?.externalService?.dependencyStatus === "stale") {
    return { label: "Stale source", stale: true };
  }
  if (layer.metadata?.persistence?.restoreState === "stale-reference") {
    return { label: "Stale reference", stale: true };
  }
  if (layer.metadata?.analysisResult) {
    return { label: "Result current", stale: false };
  }
  return { label: "No derived result", stale: false };
}

function dedupeMessages(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });

  return result;
}

function getLayerReadinessCaveats(layer: OverlayLayerConfig): string[] {
  const metadata = layer.metadata;
  const scaleReasons = metadata?.scientificQA?.categorySummaries
    ?.filter((summary) => summary.category === "scale" && summary.severity !== "pass")
    .flatMap((summary) => summary.reasons) ?? [];
  const crsSummary = metadata?.crsSummary;
  const renderBudget = metadata?.rendering;

  return dedupeMessages([
    ...(metadata?.scientificQA?.caveats ?? []),
    ...(metadata?.publicationReadiness?.caveats ?? []),
    ...(metadata?.analysisResult?.caveats ?? []),
    ...(metadata?.externalService?.caveats ?? []),
    ...(renderBudget?.warnings ?? []),
    ...scaleReasons,
    crsSummary?.status === "missing" ? "CRS metadata is missing; metric styling and export scale should be reviewed." : null,
    crsSummary?.status === "unknown" ? "CRS metadata is unknown; classification and publication context need review." : null,
    renderBudget?.mode === "preview" ? "Layer is rendering in preview mode; confirm full-resolution symbology before export." : null,
    metadata?.analysisResult?.stale ? "Analysis output is stale; re-run or mark the layer before publishing updated symbology." : null,
    metadata?.externalService?.dependencyStatus === "offline" ? "External service is offline; source freshness cannot be verified." : null,
    metadata?.externalService?.dependencyStatus === "stale" ? "External service dependency is stale; refresh before final cartography." : null,
    metadata?.publicationReadiness?.missingFields.length
      ? `Publication readiness is missing: ${metadata.publicationReadiness.missingFields.join(", ")}.`
      : null,
    metadata?.publicationReadiness?.blockingIssueIds.length
      ? `${metadata.publicationReadiness.blockingIssueIds.length.toLocaleString()} publication blocker(s) remain.`
      : null,
  ]);
}

function addRendererReason(reasons: string[], condition: boolean, message: string): void {
  if (condition) {
    reasons.push(message);
  }
}

function buildDisabledReason(reasons: string[]): string | null {
  return reasons.length > 0 ? reasons.join(" ") : null;
}

function rendererStatus(reason: string | null, limited = false): RendererChoiceStatus {
  if (reason) return "blocked";
  return limited ? "limited" : "ready";
}

function buildRendererChoice(
  mode: SerializedLegendMode,
  label: string,
  description: string,
  facts: string[],
  reasons: string[],
  limited = false,
): RendererChoice {
  const reason = buildDisabledReason(reasons);
  return {
    mode,
    label,
    description,
    status: rendererStatus(reason, limited),
    reason,
    facts,
  };
}

function buildRendererChoices(layer: OverlayLayerConfig | null): RendererChoice[] {
  const geometryType = normalizeGeometryType(layer);
  const fieldCount = layer ? getLayerStyleFieldNames(layer).length : 0;
  const numericFieldCount = layer ? getLayerNumericStyleFieldNames(layer).length : 0;
  const categoricalFieldCount = fieldCount;
  const hasLayer = Boolean(layer);
  const featureSource = hasFeatureRendererSource(layer);
  const pointGeometry = isPointGeometryLabel(geometryType);
  const polygonGeometry = isPolygonGeometryLabel(geometryType);
  const hasNumeric = numericFieldCount > 0;
  const hasTwoNumeric = numericFieldCount > 1;
  const hasCategorical = categoricalFieldCount > 0;
  const noLayerReason = "Select a layer before choosing a renderer.";
  const sourceReason = "Renderer needs a GeoJSON or heatmap layer.";
  const polygonReason = `Renderer needs polygon geometry. Current geometry: ${geometryType}.`;
  const pointReason = `Renderer needs point geometry. Current geometry: ${geometryType}.`;
  const numericReason = "Renderer needs at least one numeric field.";
  const secondNumericReason = "Bivariate renderer needs at least two numeric fields.";
  const categoricalReason = "Categorical renderer needs at least one attribute field.";
  const commonFacts = [
    geometryType,
    `${numericFieldCount.toLocaleString()} numeric`,
    `${categoricalFieldCount.toLocaleString()} categorical`,
  ];

  const requireBase = (extra: Array<[boolean, string]>): string[] => {
    const reasons: string[] = [];
    addRendererReason(reasons, !hasLayer, noLayerReason);
    addRendererReason(reasons, hasLayer && !featureSource, sourceReason);
    extra.forEach(([condition, message]) => addRendererReason(reasons, condition, message));
    return reasons;
  };

  return [
    buildRendererChoice(
      "single",
      "Single Symbol",
      "Uniform fill, line, circle, or raster color with legend persistence.",
      commonFacts,
      requireBase([]),
    ),
    buildRendererChoice(
      "choropleth",
      "Choropleth",
      "Classified polygon thematic map for numeric attributes.",
      commonFacts,
      requireBase([
        [hasLayer && !polygonGeometry, polygonReason],
        [hasLayer && !hasNumeric, numericReason],
      ]),
    ),
    buildRendererChoice(
      "categorical",
      "Categorical",
      "Discrete classes for named zones, statuses, or land-use fields.",
      commonFacts,
      requireBase([[hasLayer && !hasCategorical, categoricalReason]]),
    ),
    buildRendererChoice(
      "bivariate-choropleth",
      "Bivariate 2x2",
      "Two numeric polygon fields serialized as a matrix legend.",
      commonFacts,
      requireBase([
        [hasLayer && !polygonGeometry, polygonReason],
        [hasLayer && !hasTwoNumeric, secondNumericReason],
      ]),
    ),
    buildRendererChoice(
      "dot-density",
      "Dot Density",
      "Population or count dots generated from polygon attributes.",
      commonFacts,
      requireBase([
        [hasLayer && !polygonGeometry, polygonReason],
        [hasLayer && !hasNumeric, numericReason],
      ]),
      Boolean(hasLayer && polygonGeometry && hasNumeric),
    ),
    buildRendererChoice(
      "heatmap",
      "Heatmap",
      "Screen-space density surface for points with optional weights.",
      commonFacts,
      requireBase([[hasLayer && !pointGeometry, pointReason]]),
    ),
    buildRendererChoice(
      "proportional-symbol",
      "Proportional",
      "Point symbols scaled continuously by a numeric field.",
      commonFacts,
      requireBase([
        [hasLayer && !pointGeometry, pointReason],
        [hasLayer && !hasNumeric, numericReason],
      ]),
    ),
    buildRendererChoice(
      "graduated-symbol",
      "Graduated",
      "Point symbols classified into size and color classes.",
      commonFacts,
      requireBase([
        [hasLayer && !pointGeometry, pointReason],
        [hasLayer && !hasNumeric, numericReason],
      ]),
    ),
  ];
}

function getRendererEligibility(layer: OverlayLayerConfig | null): RendererEligibilitySummary {
  if (!layer) {
    return {
      label: "No layer selected",
      status: "blocked",
      reasons: ["Select a layer before styling."],
      fieldCount: 0,
      numericFieldCount: 0,
      categoricalFieldCount: 0,
      staleLabel: "No derived result",
      stale: false,
      caveats: [],
      disabledModeReasons: Object.fromEntries(
        MODE_OPTIONS.map((mode) => [mode.value, "Select a layer before choosing a renderer."]),
      ) as Partial<Record<SerializedLegendMode, string>>,
    };
  }

  const geometryType = normalizeGeometryType(layer);
  const fieldCount = getLayerStyleFieldNames(layer).length;
  const numericFieldCount = getLayerNumericStyleFieldNames(layer).length;
  const categoricalFieldCount = fieldCount;
  const reasons: string[] = [];
  const staleState = getStaleResultLabel(layer);
  const caveats = getLayerReadinessCaveats(layer);
  const disabledModeReasons = Object.fromEntries(
    buildRendererChoices(layer)
      .filter((choice) => choice.reason)
      .map((choice) => [choice.mode, choice.reason]),
  ) as Partial<Record<SerializedLegendMode, string>>;

  if (layer.type !== "geojson" && layer.type !== "heatmap") {
    reasons.push("Feature renderers need a GeoJSON or heatmap layer.");
  }

  if (geometryType.toLowerCase().includes("unknown")) {
    reasons.push("Geometry summary is missing.");
  }

  if (fieldCount === 0) {
    reasons.push("Field-based renderers need attributes.");
  }

  if (numericFieldCount === 0) {
    reasons.push("Choropleth, proportional, and graduated renderers need a numeric field.");
  }

  if (staleState.stale) {
    reasons.push(staleState.label);
  }

  if (reasons.length === 0) {
    return {
      label: "Renderer eligible",
      status: "eligible",
      reasons,
      fieldCount,
      numericFieldCount,
      categoricalFieldCount,
      staleLabel: staleState.label,
      stale: staleState.stale,
      caveats,
      disabledModeReasons,
    };
  }

  const hardBlocked = reasons.some((reason) => reason.includes("GeoJSON") || reason.includes("Geometry"));
  return {
    label: hardBlocked ? "Renderer blocked" : "Renderer limited",
    status: hardBlocked ? "blocked" : "limited",
    reasons,
    fieldCount,
    numericFieldCount,
    categoricalFieldCount,
    staleLabel: staleState.label,
    stale: staleState.stale,
    caveats,
    disabledModeReasons,
  };
}

function layerSelectorButtonStyle(active: boolean): React.CSSProperties {
  return {
    ...actionButtonStyle(active),
    justifyContent: "space-between",
    width: "100%",
    minHeight: "2rem",
  };
}

function getPreferredRendererMode(layer: OverlayLayerConfig | null): SerializedLegendMode {
  if (!layer) return "single";
  const defaultMode = getDefaultLayerStyleOptions(layer).mode;
  const choices = buildRendererChoices(layer);
  const defaultChoice = choices.find((choice) => choice.mode === defaultMode);
  if (defaultChoice && defaultChoice.status !== "blocked") {
    return defaultMode;
  }
  return choices.find((choice) => choice.status !== "blocked")?.mode ?? "single";
}

function rendererModeToSymbolMode(mode: SerializedLegendMode): StyleSymbolMode {
  if (mode === "proportional-symbol") return "proportional";
  if (mode === "graduated-symbol") return "graduated";
  return "heatmap";
}

function symbolModeToRendererMode(mode: StyleSymbolMode): SerializedLegendMode {
  if (mode === "proportional") return "proportional-symbol";
  if (mode === "graduated") return "graduated-symbol";
  return "heatmap";
}

const LayerSelector: React.FC<MapStyleLayerPanelProps> = ({
  layers,
  activeLayerId,
  onActiveLayerChange,
}) => {
  if (layers.length === 0) {
    return null;
  }

  return (
    <div style={layerSelectorStyle} aria-label="Style layer selector" data-testid="map-style-layer-selector">
      {layers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          style={layerSelectorButtonStyle(activeLayerId === layer.id)}
          aria-pressed={activeLayerId === layer.id}
          data-testid={`map-style-layer-option-${layer.id}`}
          onClick={() => onActiveLayerChange(layer.id)}
        >
          <span style={{ ...MAP_TEXT_STYLES.titleWrap }}>{layer.name}</span>
          <span style={mutedStyle}>{normalizeGeometryType(layer)}</span>
        </button>
      ))}
    </div>
  );
};

export const MapStyleLayerHeader: React.FC<MapStyleLayerPanelProps> = ({
  layers,
  activeLayer,
  activeLayerId,
  onActiveLayerChange,
  onInspectLayer,
}) => {
  const eligibility = getRendererEligibility(activeLayer);

  if (!activeLayer) {
    return (
      <section style={sectionStyle} aria-label="Active style layer" data-testid="map-style-active-layer-header">
        <GisEmptyState
          title="No style layer"
          description="Add or select a map layer before configuring styling."
          compact
        />
        <LayerSelector
          layers={layers}
          activeLayer={activeLayer}
          activeLayerId={activeLayerId}
          onActiveLayerChange={onActiveLayerChange}
        />
      </section>
    );
  }

  return (
    <section style={sectionStyle} aria-label="Active style layer" data-testid="map-style-active-layer-header">
      <div style={headerGridStyle}>
        <div style={headerTitleRowStyle}>
          <div style={{ minWidth: 0 }}>
            <p style={layerNameStyle} title={activeLayer.name}>{activeLayer.name}</p>
            <div style={mutedStyle}>{normalizeGeometryType(activeLayer)}</div>
          </div>
          {onInspectLayer ? (
            <button
              type="button"
              style={actionButtonStyle(false)}
              onClick={() => onInspectLayer(activeLayer.id)}
              data-testid="map-style-inspect-layer"
            >
              Inspect
            </button>
          ) : null}
        </div>

        <div style={chipRowStyle}>
          <span style={eligibility.status === "eligible" ? chipStyle : warningChipStyle} data-testid="map-style-renderer-eligibility">
            <Shapes size={11} aria-hidden />
            {eligibility.label}
          </span>
          <span style={chipStyle}>{eligibility.numericFieldCount} numeric</span>
          <span style={chipStyle}>{eligibility.categoricalFieldCount} categorical</span>
          <span style={chipStyle}>QA {getLayerQaLabel(activeLayer)}</span>
          <span style={chipStyle}>Publish {getLayerPublicationLabel(activeLayer)}</span>
          <span
            style={eligibility.stale ? warningChipStyle : chipStyle}
            data-testid="map-style-stale-status"
          >
            {eligibility.staleLabel}
          </span>
        </div>

        <div style={readinessGridStyle} data-testid="map-style-readiness-summary">
          <div style={readinessCellStyle}>
            <span style={mutedStyle}>Geometry</span>
            <span style={chipStyle}>{normalizeGeometryType(activeLayer)}</span>
          </div>
          <div style={readinessCellStyle}>
            <span style={mutedStyle}>Fields</span>
            <span style={chipStyle}>{eligibility.numericFieldCount} numeric / {eligibility.categoricalFieldCount} categorical</span>
          </div>
          <div style={readinessCellStyle}>
            <span style={mutedStyle}>CRS</span>
            <span style={activeLayer.metadata?.crsSummary?.status === "known" ? chipStyle : warningChipStyle}>
              {activeLayer.metadata?.crsSummary?.crs ?? formatStatusLabel(activeLayer.metadata?.crsSummary?.status, "unknown")}
            </span>
          </div>
          <div style={readinessCellStyle}>
            <span style={mutedStyle}>Scale / render</span>
            <span style={activeLayer.metadata?.rendering?.mode === "preview" ? warningChipStyle : chipStyle}>
              {activeLayer.metadata?.rendering?.mode === "preview" ? "Preview render" : "Full render"}
            </span>
          </div>
        </div>

        {eligibility.reasons.length > 0 ? (
          <div style={chipRowStyle} data-testid="map-style-renderer-blockers">
            {eligibility.reasons.map((reason) => (
              <span key={reason} style={warningChipStyle}>{reason}</span>
            ))}
          </div>
        ) : null}

        {eligibility.caveats.length > 0 ? (
          <div style={caveatListStyle} data-testid="map-style-readiness-caveats">
            {eligibility.caveats.slice(0, 4).map((caveat) => (
              <div key={caveat} style={caveatRowStyle}>{caveat}</div>
            ))}
          </div>
        ) : null}
      </div>

      <LayerSelector
        layers={layers}
        activeLayer={activeLayer}
        activeLayerId={activeLayerId}
        onActiveLayerChange={onActiveLayerChange}
      />
    </section>
  );
};

export const MapStyleWorkspace: React.FC<MapStyleWorkspaceProps> = ({
  activeTabId,
  onTabChange,
  renderer,
  symbols,
  labels,
  legend,
  advisor,
  collapsed = false,
  onToggleCollapse,
  onClose,
  width = "100%",
}) => {
  const contentByTab: Record<MapStyleTabId, React.ReactNode> = {
    "style-renderer": renderer,
    "style-symbols": symbols,
    "style-labels": labels,
    "style-legend": legend,
    "style-advisor": advisor,
  };

  const tabs: MapWorkbenchSidebarTab[] = STYLE_TAB_DEFINITIONS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    render: () => contentByTab[tab.id],
  }));

  return (
    <MapWorkbenchSidebar
      title="Style"
      subtitle="Workspace"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={onTabChange}
      collapsed={collapsed}
      {...(onToggleCollapse ? { onToggleCollapse } : {})}
      {...(onClose ? { onClose } : {})}
      width={width}
      data-testid="map-style-workspace"
    />
  );
};

export const MapStyleRendererPanel: React.FC<MapStyleRendererPanelProps> = ({
  layers,
  activeLayer,
  activeLayerId,
  onActiveLayerChange,
  onInspectLayer,
  onApplyStyle,
  onOpenChoroplethPreview,
  choroplethPreviewActive,
}) => {
  const preferredMode = React.useMemo(() => getPreferredRendererMode(activeLayer), [activeLayer]);
  const [selectedRendererMode, setSelectedRendererMode] = React.useState<SerializedLegendMode>(preferredMode);
  const rendererChoices = React.useMemo(() => buildRendererChoices(activeLayer), [activeLayer]);
  const eligibility = React.useMemo(() => getRendererEligibility(activeLayer), [activeLayer]);

  React.useEffect(() => {
    setSelectedRendererMode(preferredMode);
  }, [preferredMode]);

  const activeChoice = rendererChoices.find((choice) => choice.mode === selectedRendererMode);
  const selectedMode = activeChoice && activeChoice.status !== "blocked"
    ? selectedRendererMode
    : getPreferredRendererMode(activeLayer);

  return (
    <div style={panelStackStyle} data-testid="map-style-renderer-panel">
      <MapStyleLayerHeader
        layers={layers}
        activeLayer={activeLayer}
        activeLayerId={activeLayerId}
        onActiveLayerChange={onActiveLayerChange}
        {...(onInspectLayer ? { onInspectLayer } : {})}
      />
      <section style={sectionStyle} aria-label="Renderer controls">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
          <h3 style={sectionTitleStyle}>Renderer</h3>
          <button
            type="button"
            style={actionButtonStyle(choroplethPreviewActive, !activeLayer)}
            disabled={!activeLayer}
            onClick={onOpenChoroplethPreview}
            data-testid="map-style-open-choropleth-preview"
          >
            <MapPinned size={12} aria-hidden />
            Live preview
          </button>
        </div>

        <div style={rendererChoiceGridStyle} data-testid="map-style-renderer-choice-grid">
          {rendererChoices.map((choice) => {
            const disabled = choice.status === "blocked";
            const active = choice.mode === selectedMode;
            return (
              <button
                key={choice.mode}
                type="button"
                style={rendererChoiceStyle(active, choice.status)}
                disabled={disabled}
                title={choice.reason ?? choice.description}
                aria-pressed={active}
                data-testid={`map-style-renderer-choice-${choice.mode}`}
                onClick={() => setSelectedRendererMode(choice.mode)}
              >
                <span style={rendererChoiceTitleStyle}>
                  <span style={{ ...layerNameStyle, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>{choice.label}</span>
                  <span style={choice.status === "ready" ? chipStyle : warningChipStyle}>
                    {choice.status}
                  </span>
                </span>
                <span style={mutedStyle}>{choice.description}</span>
                <span style={chipRowStyle}>
                  {choice.facts.map((fact) => (
                    <span key={`${choice.mode}-${fact}`} style={chipStyle}>{fact}</span>
                  ))}
                </span>
                {choice.reason ? (
                  <span style={warningChipStyle} data-testid={`map-style-renderer-disabled-${choice.mode}`}>
                    {choice.reason}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {activeLayer ? (
          <LayerStyleEditor
            layer={activeLayer}
            rendererMode={selectedMode}
            onRendererModeChange={setSelectedRendererMode}
            disabledModeReasons={eligibility.disabledModeReasons}
            {...(onApplyStyle ? { onApplyStyle } : {})}
          />
        ) : (
          <GisEmptyState title="Renderer unavailable" description="Select a layer to enable renderer controls." compact />
        )}
      </section>
    </div>
  );
};

export const MapStyleSymbolsPanel: React.FC<MapStyleSymbolsPanelProps> = ({
  layers,
  activeLayer,
  activeLayerId,
  onActiveLayerChange,
  onInspectLayer,
  activeMode,
  symbologyActive,
  isLoading,
  error,
  symbolControls,
  onOpenPointSymbology,
  onClosePointSymbology,
}) => {
  const geometryType = normalizeGeometryType(activeLayer);
  const pointLayer = activeLayer ? isPointGeometryLabel(geometryType) : false;
  const numericFieldCount = activeLayer ? getLayerNumericStyleFieldNames(activeLayer).length : 0;
  const fieldBlocked = numericFieldCount === 0;
  const symbolChoices = buildRendererChoices(activeLayer).filter((choice) =>
    choice.mode === "heatmap" ||
    choice.mode === "proportional-symbol" ||
    choice.mode === "graduated-symbol",
  );
  const pointBlockedReason = activeLayer
    ? `Symbols need point geometry. Current geometry: ${geometryType}.`
    : "Select a point layer before configuring symbols.";
  const fieldBlockedReason = "Proportional and graduated symbols need a numeric field.";

  return (
    <div style={panelStackStyle} data-testid="map-style-symbols-panel">
      <MapStyleLayerHeader
        layers={layers}
        activeLayer={activeLayer}
        activeLayerId={activeLayerId}
        onActiveLayerChange={onActiveLayerChange}
        {...(onInspectLayer ? { onInspectLayer } : {})}
      />
      <section style={sectionStyle} aria-label="Symbol controls">
        <h3 style={sectionTitleStyle}>Symbols</h3>
        <div style={rendererChoiceGridStyle} data-testid="map-style-symbol-choice-grid">
          {symbolChoices.map((choice) => {
            const mode = rendererModeToSymbolMode(choice.mode);
            const disabled = choice.status === "blocked";
            const title = choice.reason ?? choice.description;
            const active = activeMode === mode && symbologyActive;
            return (
              <button
                key={choice.mode}
                type="button"
                style={rendererChoiceStyle(active, choice.status)}
                disabled={disabled}
                title={title}
                aria-pressed={active}
                data-testid={`map-style-symbol-mode-${mode}`}
                onClick={() => onOpenPointSymbology(mode)}
              >
                <span style={rendererChoiceTitleStyle}>
                  <span style={{ ...layerNameStyle, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>{choice.label}</span>
                  <span style={choice.status === "ready" ? chipStyle : warningChipStyle}>
                    {choice.status}
                  </span>
                </span>
                <span style={mutedStyle}>{choice.description}</span>
                <span style={chipRowStyle}>
                  {choice.facts.map((fact) => (
                    <span key={`${choice.mode}-${fact}`} style={chipStyle}>{fact}</span>
                  ))}
                </span>
                {choice.reason ? (
                  <span style={warningChipStyle} data-testid={`map-style-symbol-disabled-${mode}`}>
                    {choice.reason}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div style={actionRowStyle}>
          {symbologyActive ? (
            <button
              type="button"
              style={actionButtonStyle(false)}
              onClick={onClosePointSymbology}
              data-testid="map-style-close-symbols"
            >
              Close symbols
            </button>
          ) : null}
        </div>
        {!activeLayer || !pointLayer ? (
          <div style={warningChipStyle} data-testid="map-style-symbols-blocked">{pointBlockedReason}</div>
        ) : null}
        {activeLayer && pointLayer && fieldBlocked ? (
          <div style={warningChipStyle} data-testid="map-style-symbol-fields-blocked">{fieldBlockedReason}</div>
        ) : null}
        {symbologyActive ? (
          <div style={chipRowStyle} data-testid="map-style-symbol-active-contract">
            <span style={chipStyle}>{symbolModeToRendererMode(activeMode)} renderer</span>
            <span style={chipStyle}>Live map preview</span>
            <span style={chipStyle}>Legend reviewed in Style Legend</span>
          </div>
        ) : null}
        {isLoading ? <div style={mutedStyle}>Loading point layer...</div> : null}
        {error ? <div style={warningChipStyle}>{error}</div> : null}
        {symbologyActive ? symbolControls : null}
      </section>
    </div>
  );
};

export const MapStyleLabelsPanel: React.FC<MapStyleLabelsPanelProps> = ({
  layers,
  activeLayer,
  activeLayerId,
  onActiveLayerChange,
  onInspectLayer,
  onApplyStyle,
}) => {
  const fieldCount = activeLayer ? getLayerStyleFieldNames(activeLayer).length : 0;
  return (
    <div style={panelStackStyle} data-testid="map-style-labels-panel">
      <MapStyleLayerHeader
        layers={layers}
        activeLayer={activeLayer}
        activeLayerId={activeLayerId}
        onActiveLayerChange={onActiveLayerChange}
        {...(onInspectLayer ? { onInspectLayer } : {})}
      />
      <section style={sectionStyle} aria-label="Label controls">
        <h3 style={sectionTitleStyle}>Labels</h3>
        {activeLayer && fieldCount === 0 ? (
          <div style={warningChipStyle} data-testid="map-style-labels-blocked">Label fields are unavailable for this layer.</div>
        ) : null}
        {activeLayer ? (
          <LayerStyleEditor layer={activeLayer} {...(onApplyStyle ? { onApplyStyle } : {})} />
        ) : (
          <GisEmptyState title="Labels unavailable" description="Select a layer to enable label controls." compact />
        )}
      </section>
    </div>
  );
};

function resolveLegendSpec(layer: OverlayLayerConfig | null, explicitSpec?: SerializedMapLegendSpec | null): SerializedMapLegendSpec | null {
  if (explicitSpec) return explicitSpec;
  if (!layer) return null;
  const serialized = getSerializedLegendSpecFromStyle(layer.style);
  if (serialized) return serialized;
  return buildLayerStyleUpdate(layer, getDefaultLayerStyleOptions(layer)).legendSpec;
}

export const MapStyleLegendPanel: React.FC<MapStyleLegendPanelProps> = ({
  layers,
  activeLayer,
  activeLayerId,
  onActiveLayerChange,
  onInspectLayer,
  legendSpec,
}) => {
  const spec = resolveLegendSpec(activeLayer, legendSpec);
  const compositionItems = spec ? serializedLegendSpecToCompositionItems(spec) : [];

  return (
    <div style={panelStackStyle} data-testid="map-style-legend-panel">
      <MapStyleLayerHeader
        layers={layers}
        activeLayer={activeLayer}
        activeLayerId={activeLayerId}
        onActiveLayerChange={onActiveLayerChange}
        {...(onInspectLayer ? { onInspectLayer } : {})}
      />
      <section style={sectionStyle} aria-label="Legend contract preview">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
          <h3 style={sectionTitleStyle}>Legend</h3>
          {spec ? <span style={chipStyle} data-testid="map-style-legend-mode">{spec.mode}</span> : null}
        </div>
        {spec ? (
          <>
            <div style={chipRowStyle} data-testid="map-style-legend-contract-targets">
              <span style={chipStyle}>Map</span>
              <span style={chipStyle}>Report</span>
              <span style={chipStyle}>Export</span>
              <span style={chipStyle}>{compositionItems.length} composition items</span>
            </div>
            <div style={legendListStyle}>
              {compositionItems.map((item, index) => (
                <div key={`${item.label}-${index}`} style={legendEntryStyle} data-testid="map-style-legend-entry">
                  <span style={{ ...swatchStyle, background: item.color }} aria-hidden />
                  <div style={{ minWidth: 0 }}>
                    <div style={layerNameStyle}>{item.label}</div>
                    {item.secondaryLabel ? <div style={mutedStyle}>{item.secondaryLabel}</div> : null}
                  </div>
                </div>
              ))}
            </div>
            {spec.warnings.length > 0 ? (
              <div style={chipRowStyle} data-testid="map-style-legend-warnings">
                {spec.warnings.map((warning) => <span key={warning} style={warningChipStyle}>{warning}</span>)}
              </div>
            ) : null}
          </>
        ) : (
          <GisEmptyState title="Legend unavailable" description="Select a styled layer to preview its legend contract." compact />
        )}
      </section>
    </div>
  );
};

export const MapStyleAdvisorPanel: React.FC<MapStyleAdvisorPanelProps> = ({
  layers,
  activeLayer,
  activeLayerId,
  onActiveLayerChange,
  onInspectLayer,
  advisor,
}) => (
  <div style={panelStackStyle} data-testid="map-style-advisor-panel">
    <MapStyleLayerHeader
      layers={layers}
      activeLayer={activeLayer}
      activeLayerId={activeLayerId}
      onActiveLayerChange={onActiveLayerChange}
      {...(onInspectLayer ? { onInspectLayer } : {})}
    />
    <section style={sectionStyle} aria-label="Cartography advisor">
      <h3 style={sectionTitleStyle}>Advisor</h3>
      {advisor}
    </section>
  </div>
);
