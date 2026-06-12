import React from "react";
import { BarChart3, Boxes, Database, GitBranch, ListChecks, Search } from "lucide-react";
import type { MapSidebarTabId } from "../navigation";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MAP_COLORS,
  mapStyles,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { MapWorkbenchSidebar, type MapWorkbenchSidebarTab } from "../sidebar";
import { resolveSpatialStatsLayerContext } from "../spatialStatsVizUtils";
import { GisEmptyState, GisSectionHeader, GisStatusChip } from "../ui";

export type MapAnalyzeTabId = Extract<
  MapSidebarTabId,
  | "analyze-workflows"
  | "analyze-tools"
  | "analyze-query"
  | "analyze-models"
  | "analyze-statistics"
  | "analyze-data-operations"
>;

export interface MapAnalyzeWorkspaceProps {
  activeTabId: string;
  onTabChange: (id: string) => void;
  workflows: React.ReactNode;
  tools: React.ReactNode;
  query: React.ReactNode;
  models: React.ReactNode;
  statistics: React.ReactNode;
  dataOperations: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  width?: number | string;
}

export interface MapAnalyzeStatisticsPanelProps {
  hasAnalysisLayers: boolean;
  analysisOutputLayers: readonly OverlayLayerConfig[];
  selectedFeatureCount: number;
  selectionStatsAvailable: boolean;
  lisaActive: boolean;
  hotSpotActive: boolean;
  emergingHotSpotActive: boolean;
  onOpenLISA: () => void;
  onOpenHotSpot: () => void;
  onOpenEmergingHotSpot: () => void;
  onRunSelectionStatistics: () => void;
}

export interface MapAnalyzeDataOperationsPanelProps {
  layers: readonly OverlayLayerConfig[];
  activeLayerIds: readonly string[];
  selectedFeatureCount: number;
  onOpenAttributes: (layerId: string) => void;
  onInspectLayer: (layerId: string) => void;
  onSetActiveLayer: (layerId: string) => void;
  onRunSelectionStatistics: () => void;
  onOpenTools: () => void;
}

const ANALYZE_TAB_DEFINITIONS: ReadonlyArray<{
  id: MapAnalyzeTabId;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "analyze-workflows", label: "Workflows", icon: <GitBranch size={13} aria-hidden /> },
  { id: "analyze-tools", label: "Tools", icon: <Boxes size={13} aria-hidden /> },
  { id: "analyze-query", label: "Query", icon: <Search size={13} aria-hidden /> },
  { id: "analyze-models", label: "Models", icon: <ListChecks size={13} aria-hidden /> },
  { id: "analyze-statistics", label: "Statistics", icon: <BarChart3 size={13} aria-hidden /> },
  { id: "analyze-data-operations", label: "Data Operations", icon: <Database size={13} aria-hidden /> },
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

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const _sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const mutedStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} 0`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
};

const rowHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const rowTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.titleWrap,
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
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

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const readinessGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: MAP_SPACING.sm,
};

const readinessCardStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
};

const caveatListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const caveatRowStyle: React.CSSProperties = {
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.textSecondary,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  background: MAP_COLORS.transparent,
};

function actionButtonStyle(active = false, disabled = false): React.CSSProperties {
  return {
    ...(active ? mapStyles.sidePanelPrimaryButton : mapStyles.sidePanelActionButton),
    minHeight: "1.875rem",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    border: active ? MAP_STROKES.hairlineStrong : mapStyles.sidePanelActionButton.border,
    borderRadius: MAP_RADIUS.sm,
    background: active ? MAP_COLORS.selectedSubtle : (mapStyles.sidePanelActionButton.background as React.CSSProperties["background"]),
    color: disabled ? MAP_COLORS.textMuted : active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    maxWidth: "100%",
    textAlign: "center",
  };
}

function formatCount(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "unknown";
}

export const MapAnalyzeWorkspace: React.FC<MapAnalyzeWorkspaceProps> = ({
  activeTabId,
  onTabChange,
  workflows,
  tools,
  query,
  models,
  statistics,
  dataOperations,
  collapsed = false,
  onToggleCollapse,
  onClose,
  width = "100%",
}) => {
  const contentByTab: Record<MapAnalyzeTabId, React.ReactNode> = {
    "analyze-workflows": workflows,
    "analyze-tools": tools,
    "analyze-query": query,
    "analyze-models": models,
    "analyze-statistics": statistics,
    "analyze-data-operations": dataOperations,
  };

  const tabs: MapWorkbenchSidebarTab[] = ANALYZE_TAB_DEFINITIONS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    render: () => contentByTab[tab.id],
  }));

  return (
    <MapWorkbenchSidebar
      title="Analyze"
      subtitle="Workspace"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={onTabChange}
      collapsed={collapsed}
      {...(onToggleCollapse ? { onToggleCollapse } : {})}
      {...(onClose ? { onClose } : {})}
      width={width}
      data-testid="map-analyze-workspace"
    />
  );
};

export const MapAnalyzeStatisticsPanel: React.FC<MapAnalyzeStatisticsPanelProps> = ({
  hasAnalysisLayers,
  analysisOutputLayers,
  selectedFeatureCount,
  selectionStatsAvailable,
  lisaActive,
  hotSpotActive,
  emergingHotSpotActive,
  onOpenLISA,
  onOpenHotSpot,
  onOpenEmergingHotSpot,
  onRunSelectionStatistics,
}) => {
  const layerBlockedReason = "Missing prerequisite: add at least one spatial layer before opening this statistics panel.";
  const selectionBlockedReason = "Missing prerequisite: select one or more features before running selection statistics.";
  const outputPreviewLayers = analysisOutputLayers.slice(0, 3);
  const latestOutputSummary = analysisOutputLayers[0]
    ? resolveSpatialStatsLayerContext(analysisOutputLayers[0])
    : null;
  const sharedCaveats = Array.from(new Set([
    "Polygon geometry is required for LISA, Gi*, and emerging hot spot analysis.",
    "Each statistics run requires numeric attributes; emerging hot spot needs at least three ordered numeric time fields.",
    "Review CRS and execution context before interpreting neighborhood scale, density, or temporal trend strength.",
    "Heatmap density remains reachable under Style and should be treated as a renderer, not a published statistical output.",
    ...analysisOutputLayers.flatMap((layer) => {
      const summary = resolveSpatialStatsLayerContext(layer);
      return [...summary.caveats, ...summary.uncertaintyNotes];
    }),
  ])).slice(0, 6);

  return (
    <div style={panelStackStyle} data-testid="map-analyze-statistics">
      <section style={sectionStyle} aria-label="Statistics readiness" data-testid="analyze-statistics-readiness">
        <GisSectionHeader
          title="Readiness"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status={analysisOutputLayers.length > 0 ? "ready" : "caveat"} label={`${analysisOutputLayers.length.toLocaleString()} outputs tracked`} density="compact" />}
          style={sectionHeaderStyle}
        />
        <div style={readinessGridStyle}>
          <article style={readinessCardStyle}>
            <div style={labelStyle}>Required geometry</div>
            <div style={rowTitleStyle}>{hasAnalysisLayers ? "Polygon source ready" : "Polygon source required"}</div>
            <div style={mutedStyle}>
              Launchers stay available from Analyze, but LISA, Gi*, and emerging hot spot only run against visible polygon layers.
            </div>
          </article>
          <article style={readinessCardStyle}>
            <div style={labelStyle}>Numeric fields</div>
            <div style={rowTitleStyle}>{hasAnalysisLayers ? "Choose fields per run" : "Await source layer"}</div>
            <div style={mutedStyle}>
              LISA and Gi* require one numeric field; emerging hot spot requires an ordered numeric field sequence.
            </div>
          </article>
          <article style={readinessCardStyle}>
            <div style={labelStyle}>CRS and execution</div>
            <div style={rowTitleStyle}>{latestOutputSummary?.crsLabel ?? "CRS review required"}</div>
            <div style={mutedStyle}>
              Contiguity method, thresholds, and temporal ordering remain visible inside each statistics run panel.
            </div>
          </article>
          <article style={readinessCardStyle}>
            <div style={labelStyle}>Output group</div>
            <div style={rowTitleStyle}>
              {analysisOutputLayers.length > 0 ? `${analysisOutputLayers.length.toLocaleString()} analysis outputs` : "Publishes to Analysis Results"}
            </div>
            <div style={mutedStyle}>
              Published statistics preserve output mode, QA, and publication status in the Analysis Results group.
            </div>
          </article>
        </div>
      </section>

      <section style={sectionStyle} aria-label="Spatial statistics launchers">
        <GisSectionHeader
          title="Spatial Statistics"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status={hasAnalysisLayers ? "ready" : "blocked"} label={hasAnalysisLayers ? "layers ready" : "no layers"} density="compact" />}
          style={sectionHeaderStyle}
        />
        {!hasAnalysisLayers ? (
          <div style={mutedStyle} data-testid="analyze-statistics-layer-blocked">
            {layerBlockedReason}
          </div>
        ) : null}
        <div style={actionRowStyle}>
          <button
            type="button"
            style={actionButtonStyle(lisaActive, !hasAnalysisLayers)}
            disabled={!hasAnalysisLayers}
            title={hasAnalysisLayers ? "Open Local Moran's I cluster analysis." : layerBlockedReason}
            onClick={onOpenLISA}
            data-testid="analyze-statistics-lisa"
          >
            <BarChart3 size={13} aria-hidden /> LISA
          </button>
          <button
            type="button"
            style={actionButtonStyle(hotSpotActive, !hasAnalysisLayers)}
            disabled={!hasAnalysisLayers}
            title={hasAnalysisLayers ? "Open Getis-Ord Gi* hot and cold spot analysis." : layerBlockedReason}
            onClick={onOpenHotSpot}
            data-testid="analyze-statistics-hotspot"
          >
            <BarChart3 size={13} aria-hidden /> Gi*
          </button>
          <button
            type="button"
            style={actionButtonStyle(emergingHotSpotActive, !hasAnalysisLayers)}
            disabled={!hasAnalysisLayers}
            title={hasAnalysisLayers ? "Open emerging hot spot temporal analysis." : layerBlockedReason}
            onClick={onOpenEmergingHotSpot}
            data-testid="analyze-statistics-emerging-hotspot"
          >
            <BarChart3 size={13} aria-hidden /> Emerging
          </button>
        </div>
      </section>

      <section style={sectionStyle} aria-label="Statistics caveats" data-testid="analyze-statistics-caveats">
        <GisSectionHeader
          title="Shared Caveats"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status={sharedCaveats.length > 0 ? "caveat" : "ready"} label={`${sharedCaveats.length.toLocaleString()} visible`} density="compact" />}
          style={sectionHeaderStyle}
        />
        <div style={caveatListStyle}>
          {sharedCaveats.map((message) => (
            <div key={message} style={caveatRowStyle}>
              {message}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle} aria-label="Statistics output layer group" data-testid="analyze-statistics-output-group">
        <GisSectionHeader
          title="Output Layer Group"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status="ready" label="Analysis Results" density="compact" />}
          style={sectionHeaderStyle}
        />
        {outputPreviewLayers.length > 0 ? (
          <div style={listStyle}>
            {outputPreviewLayers.map((layer) => {
              const summary = resolveSpatialStatsLayerContext(layer);
              return (
                <article key={layer.id} style={rowStyle} data-testid={`analyze-statistics-output-${layer.id}`}>
                  <div style={rowHeaderStyle}>
                    <span style={rowTitleStyle} title={layer.name}>{layer.name}</span>
                    <span style={chipStyle}>{summary.publicationStatusLabel}</span>
                  </div>
                  <div style={chipRowStyle}>
                    <span style={chipStyle}>{summary.outputGroupLabel}</span>
                    <span style={chipStyle}>{summary.outputModeLabel}</span>
                    <span style={chipStyle}>{summary.crsLabel}</span>
                  </div>
                  {summary.caveats[0] ? <div style={mutedStyle}>{summary.caveats[0]}</div> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div style={mutedStyle}>
            Statistics outputs will appear here after you run LISA, Gi*, or emerging hot spot and publish into Analysis Results.
          </div>
        )}
      </section>

      <section style={sectionStyle} aria-label="Selection statistics">
        <GisSectionHeader
          title="Selection Summary"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status={selectedFeatureCount > 0 ? "ready" : "caveat"} label={`${selectedFeatureCount.toLocaleString()} selected`} density="compact" />}
          style={sectionHeaderStyle}
        />
        {!selectionStatsAvailable ? (
          <div style={mutedStyle} data-testid="analyze-statistics-selection-blocked">
            {selectionBlockedReason}
          </div>
        ) : null}
        <button
          type="button"
          style={actionButtonStyle(false, !selectionStatsAvailable)}
          disabled={!selectionStatsAvailable}
          title={selectionStatsAvailable ? "Run selected-feature summary statistics." : selectionBlockedReason}
          onClick={onRunSelectionStatistics}
          data-testid="analyze-statistics-selection-summary"
        >
          <ListChecks size={13} aria-hidden /> Run Summary
        </button>
      </section>
    </div>
  );
};

export const MapAnalyzeDataOperationsPanel: React.FC<MapAnalyzeDataOperationsPanelProps> = ({
  layers,
  activeLayerIds,
  selectedFeatureCount,
  onOpenAttributes,
  onInspectLayer,
  onSetActiveLayer,
  onRunSelectionStatistics,
  onOpenTools,
}) => {
  const activeLayerIdSet = new Set(activeLayerIds);

  return (
    <div style={panelStackStyle} data-testid="map-analyze-data-operations">
      <section style={sectionStyle} aria-label="Analysis output layers">
        <GisSectionHeader
          title="Output Layers"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status={layers.length > 0 ? "ready" : "caveat"} label={`${layers.length.toLocaleString()} outputs`} density="compact" />}
          style={sectionHeaderStyle}
        />
        {layers.length > 0 ? (
          <div style={listStyle}>
            {layers.map((layer) => {
              const active = activeLayerIdSet.has(layer.id);
              const analysis = layer.metadata?.analysisResult;
              return (
                <article key={layer.id} style={rowStyle} data-testid={`analyze-output-layer-${layer.id}`} data-active-output={active ? "true" : "false"}>
                  <div style={rowHeaderStyle}>
                    <span style={rowTitleStyle} title={layer.name}>{layer.name}</span>
                    <span style={chipStyle}>{active ? "active" : layer.visible ? "visible" : "hidden"}</span>
                  </div>
                  <div style={chipRowStyle}>
                    <span style={chipStyle}>{layer.metadata?.geometryType ?? "geometry unknown"}</span>
                    <span style={chipStyle}>{formatCount(layer.metadata?.featureCount)} features</span>
                    {analysis?.engine ? <span style={chipStyle}>{analysis.engine}</span> : null}
                    {analysis?.qaSummary ? <span style={chipStyle}>QA {analysis.qaSummary.status}</span> : null}
                    {analysis?.outputMode ? <span style={chipStyle}>{analysis.outputMode}</span> : null}
                  </div>
                  <div style={actionRowStyle}>
                    <button type="button" style={actionButtonStyle(active)} onClick={() => onSetActiveLayer(layer.id)} data-testid={`analyze-output-activate-${layer.id}`}>
                      Activate
                    </button>
                    <button type="button" style={actionButtonStyle()} onClick={() => onOpenAttributes(layer.id)} data-testid={`analyze-output-attributes-${layer.id}`}>
                      Attributes
                    </button>
                    <button type="button" style={actionButtonStyle()} onClick={() => onInspectLayer(layer.id)} data-testid={`analyze-output-inspect-${layer.id}`}>
                      Inspect
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <GisEmptyState
            title="No output layers"
            description="Analysis outputs will appear here after a workflow, tool, query, model, or statistic run."
            compact
          />
        )}
      </section>

      <section style={sectionStyle} aria-label="Selected feature operations">
        <GisSectionHeader
          title="Selected Features"
          level={4}
          compact
          separator={false}
          actions={<GisStatusChip status={selectedFeatureCount > 0 ? "ready" : "caveat"} label={`${selectedFeatureCount.toLocaleString()} selected`} density="compact" />}
          style={sectionHeaderStyle}
        />
        <div style={actionRowStyle}>
          <button
            type="button"
            style={actionButtonStyle(false, selectedFeatureCount === 0)}
            disabled={selectedFeatureCount === 0}
            title={selectedFeatureCount > 0 ? "Run selected-feature summary statistics." : "Missing prerequisite: select features before running data operations."}
            onClick={onRunSelectionStatistics}
            data-testid="analyze-data-selection-summary"
          >
            Summary
          </button>
          <button type="button" style={actionButtonStyle()} onClick={onOpenTools} data-testid="analyze-data-open-tools">
            Open Tools
          </button>
        </div>
      </section>
    </div>
  );
};