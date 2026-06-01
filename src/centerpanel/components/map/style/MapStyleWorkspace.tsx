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
  type SerializedMapLegendSpec,
} from "../inspector/style/legendContract";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
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
  gap: MAP_SPACING.md,
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
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
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
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
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
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.textSecondary,
  background: MAP_COLORS.bgPanel,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
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
  background: MAP_COLORS.bgPanel,
};

const swatchStyle: React.CSSProperties = {
  width: "1rem",
  height: "1rem",
  borderRadius: MAP_RADIUS.xs,
  border: MAP_STROKES.hairlineSubtle,
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
  };
}

function normalizeGeometryType(layer: OverlayLayerConfig | null): string {
  return layer?.metadata?.geometryType?.trim() || (layer?.type === "heatmap" ? "Point" : "Unknown geometry");
}

function isPointGeometryLabel(geometryType: string): boolean {
  const lower = geometryType.toLowerCase();
  return lower.includes("point");
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

function getRendererEligibility(layer: OverlayLayerConfig | null): {
  label: string;
  status: "eligible" | "limited" | "blocked";
  reasons: string[];
  fieldCount: number;
  numericFieldCount: number;
} {
  if (!layer) {
    return {
      label: "No layer selected",
      status: "blocked",
      reasons: ["Select a layer before styling."],
      fieldCount: 0,
      numericFieldCount: 0,
    };
  }

  const geometryType = normalizeGeometryType(layer);
  const fieldCount = getLayerStyleFieldNames(layer).length;
  const numericFieldCount = getLayerNumericStyleFieldNames(layer).length;
  const reasons: string[] = [];

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

  if (reasons.length === 0) {
    return {
      label: "Renderer eligible",
      status: "eligible",
      reasons,
      fieldCount,
      numericFieldCount,
    };
  }

  const hardBlocked = reasons.some((reason) => reason.includes("GeoJSON") || reason.includes("Geometry"));
  return {
    label: hardBlocked ? "Renderer blocked" : "Renderer limited",
    status: hardBlocked ? "blocked" : "limited",
    reasons,
    fieldCount,
    numericFieldCount,
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
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{layer.name}</span>
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
          <span style={chipStyle}>{eligibility.numericFieldCount} numeric fields</span>
          <span style={chipStyle}>{eligibility.fieldCount} fields</span>
          <span style={chipStyle}>QA {getLayerQaLabel(activeLayer)}</span>
          <span style={chipStyle}>Publish {getLayerPublicationLabel(activeLayer)}</span>
        </div>

        {eligibility.reasons.length > 0 ? (
          <div style={chipRowStyle} data-testid="map-style-renderer-blockers">
            {eligibility.reasons.map((reason) => (
              <span key={reason} style={warningChipStyle}>{reason}</span>
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
}) => (
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
      {activeLayer ? (
        <LayerStyleEditor layer={activeLayer} {...(onApplyStyle ? { onApplyStyle } : {})} />
      ) : (
        <GisEmptyState title="Renderer unavailable" description="Select a layer to enable renderer controls." compact />
      )}
    </section>
  </div>
);

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
        <div style={actionRowStyle}>
          {(["heatmap", "proportional", "graduated"] as const).map((mode) => {
            const disabled = !activeLayer || !pointLayer || (mode !== "heatmap" && fieldBlocked);
            const title = !activeLayer || !pointLayer
              ? pointBlockedReason
              : mode !== "heatmap" && fieldBlocked
                ? fieldBlockedReason
                : undefined;
            return (
              <button
                key={mode}
                type="button"
                style={actionButtonStyle(activeMode === mode && symbologyActive, disabled)}
                disabled={disabled}
                {...(title ? { title } : {})}
                aria-pressed={activeMode === mode && symbologyActive}
                data-testid={`map-style-symbol-mode-${mode}`}
                onClick={() => onOpenPointSymbology(mode)}
              >
                {mode === "heatmap" ? "Heatmap" : mode === "proportional" ? "Proportional" : "Graduated"}
              </button>
            );
          })}
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