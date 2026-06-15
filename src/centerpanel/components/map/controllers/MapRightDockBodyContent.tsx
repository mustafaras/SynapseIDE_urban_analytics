import React from "react";
import * as turf from "@turf/turf";

import { MapMeasurementTool } from "../../MapMeasurementTool";
import { MapDrawingManager } from "../../MapDrawingManager";
import { MapAttributeWorkflowPanel } from "../table/MapAttributeWorkflowPanel";
import { MapBottomPanelScrollBody, type MapBottomPanelTask, MapBottomPanelTasksBody } from "../bottom";
import { MapSelectionTools, type SelectionDragTool } from "../MapSelectionTools";
import { ScientificQAPanel } from "../ScientificQAPanel";
import { LayerInspector, type MapInspectorHostContext } from "../inspector";
import type { LayerStyleUpdate } from "../inspector/style/legendContract";
import { type MapProblemRow, MapProblemsPanel } from "../problems";
import { MapPanelErrorBoundary } from "../MapPanelErrorBoundary";
import { MapPerformanceDiagnosticsPanel } from "../MapPerformanceDiagnosticsPanel";
import { GisEmptyState, GisStatusChip } from "../ui";
import type { MapRightDockPanel } from "../mapDocking";
import type { DrawnFeature, OverlayLayerConfig } from "../mapTypes";
import type { MapPublishReadinessItem, MapPublishTabId } from "../publish";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "../mapTokens";
import type { SelectionStatisticsSummary } from "../../../../services/map/MapAnalysisDispatcher";

type AoiGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

interface AoiAnalysisSummary {
  aoiId: string;
  label: string;
  areaM2: number;
  perimeterM: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
  intersectingFeatureCount: number;
  intersectingLayerCount: number;
  buildingCount: number;
  greenFeatureCount: number;
  greenAreaM2: number | null;
  layerHits: Array<{ layerId: string; layerName: string; count: number }>;
}

function isAoiGeometry(geometry: GeoJSON.Geometry): geometry is AoiGeometry {
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
}

function drawnFeatureToAoiFeature(feature: DrawnFeature): GeoJSON.Feature<AoiGeometry> | null {
  if (!isAoiGeometry(feature.geometry)) return null;
  return {
    type: "Feature",
    id: feature.id,
    geometry: feature.geometry,
    properties: {
      label: feature.properties.label,
      createdAt: feature.properties.createdAt,
    },
  };
}

function sourceDataToFeatureCollection(sourceData: OverlayLayerConfig["sourceData"]): GeoJSON.FeatureCollection | null {
  if (!sourceData || typeof sourceData === "string") return null;
  if ((sourceData as GeoJSON.FeatureCollection).type === "FeatureCollection") {
    return sourceData as GeoJSON.FeatureCollection;
  }
  if ((sourceData as GeoJSON.Feature).type === "Feature") {
    return { type: "FeatureCollection", features: [sourceData as GeoJSON.Feature] };
  }
  if (typeof (sourceData as GeoJSON.Geometry).type === "string") {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: sourceData as GeoJSON.Geometry, properties: {} }],
    };
  }
  return null;
}

function isBuildingFeature(layer: OverlayLayerConfig, feature: GeoJSON.Feature): boolean {
  const props = feature.properties ?? {};
  return layer.group === "voxcity"
    || /building/i.test(layer.name)
    || props.building != null
    || props["building:levels"] != null
    || props.building_id != null;
}

function isGreenFeature(layer: OverlayLayerConfig, feature: GeoJSON.Feature): boolean {
  const props = feature.properties ?? {};
  const coverage = layer.metadata?.datasetContext?.thematicCoverage ?? [];
  return coverage.some((tag) => /green|vegetation|park|landuse/i.test(tag))
    || /green|park|vegetation|grass|landuse/i.test(layer.name)
    || props.green_space === true
    || props.green_class != null
    || props.leisure === "park"
    || props.landuse === "grass"
    || props.landuse === "forest"
    || props.natural === "wood"
    || props.natural === "grassland";
}

function featureIntersectsAoi(feature: GeoJSON.Feature, aoiFeature: GeoJSON.Feature<AoiGeometry>): boolean {
  if (!feature.geometry) return false;
  try {
    return turf.booleanIntersects(feature as never, aoiFeature as never);
  } catch {
    return false;
  }
}

function polygonPerimeterMeters(geometry: AoiGeometry): number {
  const polygonRings = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygonRings.reduce((total, rings) => {
    const ringLengthKm = rings.reduce((ringTotal, ring) => {
      if (ring.length < 2) return ringTotal;
      return ringTotal + turf.length(turf.lineString(ring as number[][]), { units: "kilometers" });
    }, 0);
    return total + ringLengthKm * 1000;
  }, 0);
}

function intersectedGreenAreaM2(feature: GeoJSON.Feature, aoiFeature: GeoJSON.Feature<AoiGeometry>): number | null {
  if (!feature.geometry || (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon")) {
    return null;
  }
  try {
    const intersection = turf.intersect(turf.featureCollection([aoiFeature as never, feature as never]) as never);
    if (!intersection) return null;
    return turf.area(intersection as never);
  } catch {
    try {
      return turf.area(feature as never);
    } catch {
      return null;
    }
  }
}

function buildAoiAnalysisSummary(
  drawnFeatures: readonly DrawnFeature[],
  selectedFeatureId: string | null,
  overlayLayers: readonly OverlayLayerConfig[],
): AoiAnalysisSummary | null {
  const selectedAoi = selectedFeatureId
    ? drawnFeatures.find((feature) => feature.id === selectedFeatureId && isAoiGeometry(feature.geometry))
    : null;
  const aoi = selectedAoi ?? drawnFeatures.find((feature) => isAoiGeometry(feature.geometry));
  if (!aoi) return null;

  const aoiFeature = drawnFeatureToAoiFeature(aoi);
  if (!aoiFeature) return null;

  const layerHits: AoiAnalysisSummary["layerHits"] = [];
  let intersectingFeatureCount = 0;
  let buildingCount = 0;
  let greenFeatureCount = 0;
  let greenAreaM2 = 0;
  let hasGreenArea = false;

  for (const layer of overlayLayers) {
    if (!layer.visible || layer.type !== "geojson") continue;
    const featureCollection = sourceDataToFeatureCollection(layer.sourceData);
    if (!featureCollection) continue;
    let layerCount = 0;
    for (const feature of featureCollection.features) {
      if (!featureIntersectsAoi(feature, aoiFeature)) continue;
      layerCount += 1;
      intersectingFeatureCount += 1;
      if (isBuildingFeature(layer, feature)) {
        buildingCount += 1;
      }
      if (isGreenFeature(layer, feature)) {
        greenFeatureCount += 1;
        const clippedArea = intersectedGreenAreaM2(feature, aoiFeature);
        if (clippedArea != null) {
          greenAreaM2 += clippedArea;
          hasGreenArea = true;
        }
      }
    }
    if (layerCount > 0) {
      layerHits.push({ layerId: layer.id, layerName: layer.name, count: layerCount });
    }
  }

  const centroid = turf.centroid(aoiFeature as never).geometry.coordinates as [number, number];
  const bbox = turf.bbox(aoiFeature as never) as [number, number, number, number];
  return {
    aoiId: aoi.id,
    label: aoi.properties.label || aoi.id,
    areaM2: turf.area(aoiFeature as never),
    perimeterM: polygonPerimeterMeters(aoi.geometry),
    bbox,
    centroid,
    intersectingFeatureCount,
    intersectingLayerCount: layerHits.length,
    buildingCount,
    greenFeatureCount,
    greenAreaM2: hasGreenArea ? greenAreaM2 : null,
    layerHits,
  };
}

function formatArea(valueM2: number): string {
  return valueM2 >= 1_000_000 ? `${(valueM2 / 1_000_000).toFixed(2)} km2` : `${valueM2.toLocaleString(undefined, { maximumFractionDigits: 0 })} m2`;
}

function formatDistance(valueM: number): string {
  return valueM >= 1000 ? `${(valueM / 1000).toFixed(2)} km` : `${valueM.toLocaleString(undefined, { maximumFractionDigits: 0 })} m`;
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

function AoiAnalysisPanel({
  summary,
  onCopySummary,
}: {
  summary: AoiAnalysisSummary;
  onCopySummary: (summary: AoiAnalysisSummary) => void;
}): React.ReactElement {
  const greenCoverage = summary.greenAreaM2 != null && summary.areaM2 > 0
    ? `${((summary.greenAreaM2 / summary.areaM2) * 100).toFixed(1)}%`
    : "No green-area polygons";
  const rows = [
    { label: "Area", value: formatArea(summary.areaM2) },
    { label: "Perimeter", value: formatDistance(summary.perimeterM) },
    { label: "Centroid", value: `${formatCoordinate(summary.centroid[1])}, ${formatCoordinate(summary.centroid[0])}` },
    { label: "BBox", value: summary.bbox.map(formatCoordinate).join(", ") },
    { label: "Feature hits", value: `${summary.intersectingFeatureCount.toLocaleString()} across ${summary.intersectingLayerCount.toLocaleString()} layer(s)` },
    { label: "Buildings", value: summary.buildingCount.toLocaleString() },
    { label: "Green coverage", value: greenCoverage },
  ];

  return (
    <div data-testid="map-right-dock-aoi-analysis" style={{ display: "grid", gap: MAP_SPACING.sm, paddingTop: MAP_SPACING.sm, borderTop: MAP_STROKES.hairlineSubtle }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
        <div style={{ display: "grid", gap: "0.125rem", minWidth: 0 }}>
          <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, textTransform: "uppercase" }}>
            Selected area GIS analysis
          </span>
          <strong style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.sm, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.label}</strong>
        </div>
        <button type="button" style={{ ...mapStyles.btn, minHeight: "1.875rem", padding: `0 ${MAP_SPACING.sm}` }} onClick={() => onCopySummary(summary)}>
          Copy JSON
        </button>
      </div>
      <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: "grid", gridTemplateColumns: "7rem minmax(0, 1fr)", gap: MAP_SPACING.sm, color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
            <span style={{ color: MAP_COLORS.textMuted }}>{row.label}</span>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{row.value}</span>
          </div>
        ))}
      </div>
      {summary.layerHits.length > 0 ? (
        <div style={{ display: "grid", gap: "0.125rem", color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
          {summary.layerHits.slice(0, 4).map((hit) => (
            <span key={hit.layerId}>{hit.layerName}: {hit.count.toLocaleString()} hit(s)</span>
          ))}
          {summary.layerHits.length > 4 ? <span>{summary.layerHits.length - 4} more layer(s)</span> : null}
        </div>
      ) : (
        <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
          No visible queryable layer intersects this AOI yet. Add OSM buildings or green spaces from External Services, then refresh this panel.
        </span>
      )}
    </div>
  );
}

const rightDockBodyShellStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.sm,
  minHeight: "100%",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md} ${MAP_SPACING.md}`,
};

const rightDockSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  padding: `${MAP_SPACING.sm} 0 ${MAP_SPACING.md}`,
  borderBottom: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148,163,184,0.28)) 55%, transparent)",
};

const rightDockSectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const rightDockSectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const rightDockSectionEyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const rightDockTabStripStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const rightDockTabButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "1.75rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: 2,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const rightDockTabButtonActiveStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  borderColor: MAP_COLORS.hairlineStrong,
  background: MAP_COLORS.interactionSubtle,
};

function RightDockRouteSection({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section style={rightDockSectionStyle}>
      <div style={rightDockSectionHeaderStyle}>
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          {eyebrow ? <span style={rightDockSectionEyebrowStyle}>{eyebrow}</span> : null}
          <h3 style={rightDockSectionTitleStyle}>{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function RightDockEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div style={rightDockBodyShellStyle}>
      <GisEmptyState title={title} description={description} />
    </div>
  );
}

interface MapRightDockBodyContentProps {
  activeMeasureTool: React.ComponentProps<typeof MapMeasurementTool>["activeMeasureTool"];
  activeRightDockPanel: MapRightDockPanel | null;
  activePublishTabId: MapPublishTabId;
  addDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onAddFeature"];
  addMeasurement: React.ComponentProps<typeof MapMeasurementTool>["onAddMeasurement"];
  announce: (message: string) => void;
  attributeTableLayerId: string | null;
  bottomPanelTasks: MapBottomPanelTask[];
  bottomProblemsModel: React.ComponentProps<typeof MapProblemsPanel>["model"];
  clearMeasurements: React.ComponentProps<typeof MapMeasurementTool>["onClearMeasurements"];
  drawnFeatures: React.ComponentProps<typeof MapDrawingManager>["drawnFeatures"];
  handleAttributeTableSelection: React.ComponentProps<typeof MapAttributeWorkflowPanel>["onSelectFeatures"];
  handleBottomProblemAction: (problem: MapProblemRow) => void;
  handleCancelMeasure: React.ComponentProps<typeof MapMeasurementTool>["onCancelMeasure"];
  handleClearSelectedFeatures: React.ComponentProps<typeof MapSelectionTools>["onClearSelectedFeatures"];
  handleCloseRightDockHost: () => void;
  handleCreateAttributeDerivedLayer: React.ComponentProps<typeof MapAttributeWorkflowPanel>["onCreateDerivedLayer"];
  handleFocusAttributeFeature: React.ComponentProps<typeof MapAttributeWorkflowPanel>["onFocusFeature"];
  handleFocusLayer: React.ComponentProps<typeof ScientificQAPanel>["onOpenLayer"];
  handleInspectLayer: React.ComponentProps<typeof ScientificQAPanel>["onInspectLayer"];
  handleOpenPublishTab: (tabId: "publish-data-export", announcement: string) => void;
  handlePublishWorkspaceTabChange: (tabId: string) => void;
  handleRepairLayerGeometry: React.ComponentProps<typeof ScientificQAPanel>["onRepairGeometry"];
  handleRetryWorkerJob: React.ComponentProps<typeof MapPerformanceDiagnosticsPanel>["onRetryWorkerJob"];
  handleRunSelectionStatistics: () => void;
  handleSelectionResult: React.ComponentProps<typeof MapSelectionTools>["onSelectionResult"];
  handleSetSelectedFeatures: React.ComponentProps<typeof MapSelectionTools>["onSetSelectedFeatures"];
  mapRef: React.ComponentProps<typeof MapMeasurementTool>["mapRef"];
  measureUnit: React.ComponentProps<typeof MapMeasurementTool>["measureUnit"];
  measurementSeed: React.ComponentProps<typeof MapMeasurementTool>["seedMeasurementStart"];
  measurements: React.ComponentProps<typeof MapMeasurementTool>["measurements"];
  overlayLayers: React.ComponentProps<typeof ScientificQAPanel>["overlayLayers"];
  performanceDiagnostics: React.ComponentProps<typeof MapPerformanceDiagnosticsPanel>["diagnostics"];
  queryableLayers: React.ComponentProps<typeof MapSelectionTools>["queryableLayers"];
  removeMeasurement: React.ComponentProps<typeof MapMeasurementTool>["onRemoveMeasurement"];
  renderReviewTimeline: (visible: boolean, onClose: () => void, initialTab?: "timeline" | "collaboration") => React.ReactNode;
  rightAttributesDockActive: boolean;
  rightCollaborationDockActive: boolean;
  rightDiagnosticsDockActive: boolean;
  rightMeasureDockActive: boolean;
  rightPerformanceDockActive: boolean;
  rightProblemsDockActive: boolean;
  rightScientificQADockActive: boolean;
  rightSelectionDockActive: boolean;
  rightTasksDockActive: boolean;
  rightTimelineDockActive: boolean;
  scientificQA: React.ComponentProps<typeof ScientificQAPanel>["qaState"];
  selectedFeatureCount: number;
  selectedFeatureId: React.ComponentProps<typeof MapDrawingManager>["selectedFeatureId"];
  selectedFeatureIds: React.ComponentProps<typeof MapSelectionTools>["selectedFeatureIds"];
  selectionDragTool: SelectionDragTool | null;
  selectionStatsSummary: SelectionStatisticsSummary[] | null;
  setActiveAnalysisResultLayers: React.ComponentProps<typeof MapSelectionTools>["onSetActiveAnalysisResultLayers"];
  setAttributeTableLayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setMeasureUnit: React.ComponentProps<typeof MapMeasurementTool>["onSetMeasureUnit"];
  setMeasurementSeed: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof MapMeasurementTool>["seedMeasurementStart"]>>;
  setSelectionDragTool: React.Dispatch<React.SetStateAction<SelectionDragTool | null>>;
  setSelectionStatsSummary: React.Dispatch<React.SetStateAction<SelectionStatisticsSummary[] | null>>;
  openRightDockPanel: (panel: "attributes", announcement: string, source: "panel-tab", detail?: string) => void;
  inspectorContext: MapInspectorHostContext;
  onApplyLayerStyle?: (layerId: string, update: LayerStyleUpdate) => void;
  publishDataExportElement: React.ReactNode;
  publishFigureElement: React.ReactNode;
  publishOfflinePackageElement: React.ReactNode;
  publishReadinessItems: readonly MapPublishReadinessItem[];
  publishReportElement: React.ReactNode;
  publishReviewPackageElement: React.ReactNode;
  styleAdvisorElement: React.ReactNode;
  styleLabelsElement: React.ReactNode;
  styleLegendElement: React.ReactNode;
  styleRendererElement: React.ReactNode;
  styleSymbolsElement: React.ReactNode;
  workflowElement: React.ReactNode;
}

export const MapRightDockBodyContent: React.FC<MapRightDockBodyContentProps> = ({
  activeMeasureTool,
  activeRightDockPanel,
  activePublishTabId,
  addDrawnFeature,
  addMeasurement,
  announce,
  attributeTableLayerId,
  bottomPanelTasks,
  bottomProblemsModel,
  clearMeasurements,
  drawnFeatures,
  handleAttributeTableSelection,
  handleBottomProblemAction,
  handleCancelMeasure,
  handleClearSelectedFeatures,
  handleCloseRightDockHost,
  handleCreateAttributeDerivedLayer,
  handleFocusAttributeFeature,
  handleFocusLayer,
  handleInspectLayer,
  handleOpenPublishTab,
  handlePublishWorkspaceTabChange,
  handleRepairLayerGeometry,
  handleRetryWorkerJob,
  handleRunSelectionStatistics,
  handleSelectionResult,
  handleSetSelectedFeatures,
  mapRef,
  measureUnit,
  measurementSeed,
  measurements,
  overlayLayers,
  performanceDiagnostics,
  queryableLayers,
  removeMeasurement,
  renderReviewTimeline,
  rightAttributesDockActive,
  rightCollaborationDockActive,
  rightDiagnosticsDockActive,
  rightMeasureDockActive,
  rightPerformanceDockActive,
  rightProblemsDockActive,
  rightScientificQADockActive,
  rightSelectionDockActive,
  rightTasksDockActive,
  rightTimelineDockActive,
  scientificQA,
  selectedFeatureCount,
  selectedFeatureId,
  selectedFeatureIds,
  selectionDragTool,
  selectionStatsSummary,
  setActiveAnalysisResultLayers,
  setAttributeTableLayerId,
  setMeasureUnit,
  setMeasurementSeed,
  setSelectionDragTool,
  setSelectionStatsSummary,
  openRightDockPanel,
  inspectorContext,
  onApplyLayerStyle,
  publishDataExportElement,
  publishFigureElement,
  publishOfflinePackageElement,
  publishReadinessItems,
  publishReportElement,
  publishReviewPackageElement,
  styleAdvisorElement,
  styleLabelsElement,
  styleLegendElement,
  styleRendererElement,
  styleSymbolsElement,
  workflowElement,
}) => {
  if (activeRightDockPanel === "inspect") {
    if (inspectorContext.kind === "layer") {
      return (
        <div data-testid="map-right-dock-inspector-body" style={{ height: "100%", minHeight: 0 }}>
          <LayerInspector
            layer={inspectorContext.layer}
            sourceHandle={inspectorContext.sourceHandle ?? null}
            onClose={handleCloseRightDockHost}
            {...(onApplyLayerStyle ? { onApplyStyle: onApplyLayerStyle } : {})}
            presentation="embedded"
            showHeader={false}
          />
        </div>
      );
    }

    return (
      <RightDockEmptyState
        title="No layer selected"
        description="Select a map layer or feature output to review source, schema, CRS, QA, style, lineage, and report readiness."
      />
    );
  }

  if (activeRightDockPanel === "style") {
    return (
      <div style={rightDockBodyShellStyle} data-testid="map-right-dock-style-body">
        <RightDockRouteSection title="Renderer" eyebrow="Style">
          {styleRendererElement}
        </RightDockRouteSection>
        <RightDockRouteSection title="Live legend preview" eyebrow="Legend contract">
          {styleLegendElement}
        </RightDockRouteSection>
        <RightDockRouteSection title="Symbols and labels" eyebrow="Cartography">
          <div style={{ display: "grid", gap: MAP_SPACING.md }}>
            {styleSymbolsElement}
            {styleLabelsElement}
          </div>
        </RightDockRouteSection>
        <RightDockRouteSection title="Advisor" eyebrow="QA-aware styling">
          {styleAdvisorElement}
        </RightDockRouteSection>
      </div>
    );
  }

  if (activeRightDockPanel === "workflow") {
    return (
      <div data-testid="map-right-dock-workflow-body" style={{ height: "100%", minHeight: 0 }}>
        {workflowElement}
      </div>
    );
  }

  if (activeRightDockPanel === "report") {
    const publishTabs: Array<{ id: MapPublishTabId; label: string; content: React.ReactNode }> = [
      { id: "publish-figure", label: "Figure", content: publishFigureElement },
      { id: "publish-data-export", label: "Data", content: publishDataExportElement },
      { id: "publish-report", label: "Report", content: publishReportElement },
      { id: "publish-offline-package", label: "Offline", content: publishOfflinePackageElement },
      { id: "publish-review-package", label: "Review", content: publishReviewPackageElement },
    ];
    const activePublishTab = publishTabs.find((tab) => tab.id === activePublishTabId) ?? publishTabs[0]!;
    return (
      <div style={rightDockBodyShellStyle} data-testid="map-right-dock-publish-body">
        <RightDockRouteSection
          title="Readiness"
          eyebrow="Publish"
          actions={<GisStatusChip status={publishReadinessItems.some((item) => item.status === "blocked") ? "blocked" : "ready"} label={`${publishReadinessItems.length} checks`} density="compact" />}
        >
          <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
            {publishReadinessItems.length > 0 ? publishReadinessItems.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: MAP_SPACING.sm, alignItems: "start", paddingBottom: MAP_SPACING.xs, borderBottom: MAP_STROKES.hairlineSubtle }}>
                <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                  <span style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{item.label}</span>
                  <span style={{ color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: 1.35 }}>{item.detail}</span>
                </span>
                <GisStatusChip status={item.status} label={item.status.replace(/-/g, " ")} density="compact" title={item.title} />
              </div>
            )) : (
              <GisEmptyState title="No readiness checks" description="Publish readiness will appear when map layers, export targets, or report handoff metadata are available." compact />
            )}
          </div>
        </RightDockRouteSection>
        <div style={rightDockTabStripStyle} role="tablist" aria-label="Publish route tabs">
          {publishTabs.map((tab) => {
            const active = tab.id === activePublishTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                style={{ ...rightDockTabButtonStyle, ...(active ? rightDockTabButtonActiveStyle : {}) }}
                onClick={() => handlePublishWorkspaceTabChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <RightDockRouteSection title={activePublishTab.label} eyebrow="Output path">
          {activePublishTab.content}
        </RightDockRouteSection>
      </div>
    );
  }

  if (rightAttributesDockActive) {
    return (
      <div data-testid="map-right-dock-attributes-body" style={{ height: "100%", minHeight: 0 }}>
        <MapAttributeWorkflowPanel
          layers={overlayLayers}
          activeLayerId={attributeTableLayerId}
          selectedFeatureIds={selectedFeatureIds}
          onActiveLayerChange={setAttributeTableLayerId}
          onSelectFeatures={handleAttributeTableSelection}
          onFocusFeature={handleFocusAttributeFeature}
          onCreateDerivedLayer={handleCreateAttributeDerivedLayer}
          onClose={() => {
            setAttributeTableLayerId(null);
            handleCloseRightDockHost();
            announce("Attribute workflow closed");
          }}
          onAnnounce={announce}
        />
      </div>
    );
  }

  if (rightSelectionDockActive) {
    const selectedLayerEntries = Object.entries(selectedFeatureIds).filter(([, featureIds]) => featureIds.length > 0);
    const selectionStatsCount = selectionStatsSummary?.reduce(
      (total, summary) => total + summary.selectedFeatureCount,
      0,
    ) ?? 0;
    const selectionActionButtonStyle: React.CSSProperties = {
      ...mapStyles.btn,
      minHeight: "1.875rem",
      padding: `0 ${MAP_SPACING.sm}`,
    };
    const selectionActionDisabledStyle: React.CSSProperties = {
      opacity: 0.5,
      cursor: "not-allowed",
    };
    const aoiAnalysisSummary = buildAoiAnalysisSummary(drawnFeatures, selectedFeatureId, overlayLayers);
    const handleCopyAoiAnalysis = (summary: AoiAnalysisSummary) => {
      const payload = {
        type: "map-aoi-analysis",
        generatedAt: new Date().toISOString(),
        aoiId: summary.aoiId,
        label: summary.label,
        metrics: {
          areaM2: summary.areaM2,
          perimeterM: summary.perimeterM,
          bbox: summary.bbox,
          centroid: summary.centroid,
          intersectingFeatureCount: summary.intersectingFeatureCount,
          intersectingLayerCount: summary.intersectingLayerCount,
          buildingCount: summary.buildingCount,
          greenFeatureCount: summary.greenFeatureCount,
          greenAreaM2: summary.greenAreaM2,
          greenCoverageRatio: summary.greenAreaM2 != null && summary.areaM2 > 0 ? summary.greenAreaM2 / summary.areaM2 : null,
        },
        layerHits: summary.layerHits,
      };
      if (!navigator.clipboard?.writeText) {
        announce("AOI analysis copy is unavailable in this browser context");
        return;
      }
      void navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
        .then(() => announce("AOI analysis JSON copied"))
        .catch(() => announce("AOI analysis copy failed"));
    };

    return (
      <MapBottomPanelScrollBody data-testid="map-right-dock-selection-body" padding={0}>
        <MapSelectionTools
          mapRef={mapRef}
          queryableLayers={queryableLayers}
          selectedFeatureIds={selectedFeatureIds}
          activeDragTool={selectionDragTool}
          showModeButtons
          variant="embedded"
          onSetSelectedFeatures={handleSetSelectedFeatures}
          onClearSelectedFeatures={handleClearSelectedFeatures}
          onSetActiveAnalysisResultLayers={setActiveAnalysisResultLayers}
          onAddDrawnFeature={addDrawnFeature}
          onActiveDragToolChange={setSelectionDragTool}
          onSelectionResult={handleSelectionResult}
          onAnnounce={announce}
        />
        <div style={{ display: "grid", gap: MAP_SPACING.md, padding: `${MAP_SPACING.sm} ${MAP_SPACING.md} ${MAP_SPACING.md}` }}>
          <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
            <div style={{ display: "grid", gap: "0.125rem" }}>
              <span
                style={{
                  color: MAP_COLORS.textMuted,
                  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                  textTransform: "uppercase",
                }}
              >
                Selection detail
              </span>
              <span
                style={{
                  color: MAP_COLORS.text,
                  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
                  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                }}
              >
                {selectedFeatureCount.toLocaleString()} selected feature(s) across {selectedLayerEntries.length.toLocaleString()} layer(s)
              </span>
              <span style={{ color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                Keep selections here, then open layer attributes or compute descriptive statistics without covering the map canvas.
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: MAP_SPACING.xs }}>
              <button
                type="button"
                style={{
                  ...selectionActionButtonStyle,
                  ...(selectedLayerEntries.length === 0 ? selectionActionDisabledStyle : {}),
                }}
                disabled={selectedLayerEntries.length === 0}
                title={selectedLayerEntries.length === 0 ? "Select one or more features before computing statistics" : "Compute descriptive statistics for the current selection"}
                onClick={handleRunSelectionStatistics}
              >
                Run statistics
              </button>
              {selectionStatsSummary?.length ? (
                <button
                  type="button"
                  style={selectionActionButtonStyle}
                  onClick={() => setSelectionStatsSummary(null)}
                >
                  Hide statistics
                </button>
              ) : null}
            </div>
          </div>
          {aoiAnalysisSummary ? (
            <AoiAnalysisPanel summary={aoiAnalysisSummary} onCopySummary={handleCopyAoiAnalysis} />
          ) : null}
          {selectedLayerEntries.length > 0 ? (
            selectedLayerEntries.map(([layerId, featureIds]) => {
              const layerName = overlayLayers.find((layer) => layer.id === layerId)?.name ?? layerId;
              return (
                <div
                  key={layerId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto auto",
                    gap: MAP_SPACING.sm,
                    minWidth: 0,
                    padding: `${MAP_SPACING.xs} 0`,
                    borderTop: MAP_STROKES.hairlineSubtle,
                    color: MAP_COLORS.textSecondary,
                    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                  }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: MAP_COLORS.text }}>{layerName}</span>
                  <span style={{ color: MAP_COLORS.textMuted }}>{featureIds.length.toLocaleString()} selected feature(s)</span>
                  <button
                    type="button"
                    style={selectionActionButtonStyle}
                    onClick={() => {
                      setAttributeTableLayerId(layerId);
                      openRightDockPanel(
                        "attributes",
                        "Selected feature attributes opened in the right dock",
                        "panel-tab",
                        "selection",
                      );
                    }}
                  >
                    Attributes
                  </button>
                </div>
              );
            })
          ) : (
            <GisEmptyState
              title="No selected features"
              description="Use rectangle, lasso, or attribute filters to select queryable features before exporting, focusing, or converting to an AOI."
              compact
            />
          )}
          {selectionStatsSummary?.length ? (
            <div
              data-testid="map-right-dock-selection-stats"
              style={{
                display: "grid",
                gap: MAP_SPACING.sm,
                padding: MAP_SPACING.md,
                border: MAP_STROKES.hairlineSubtle,
                borderRadius: MAP_RADIUS.sm,
                background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.56))",
              }}
            >
              <div style={{ display: "grid", gap: "0.125rem" }}>
                <span
                  style={{
                    color: MAP_COLORS.textMuted,
                    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                    textTransform: "uppercase",
                  }}
                >
                  Quick statistics
                </span>
                <span
                  style={{
                    color: MAP_COLORS.text,
                    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
                    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                  }}
                >
                  {selectionStatsCount.toLocaleString()} feature(s) summarized
                </span>
              </div>
              {selectionStatsSummary.map((summary) => (
                <div
                  key={summary.layerId}
                  style={{
                    display: "grid",
                    gap: MAP_SPACING.xs,
                    paddingTop: MAP_SPACING.sm,
                    borderTop: MAP_STROKES.hairlineSubtle,
                  }}
                >
                  <div style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                    {summary.layerName} · {summary.selectedFeatureCount.toLocaleString()} selected
                  </div>
                  {summary.numericFields.length === 0 ? (
                    <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                      Missing prerequisite: selected features need numeric attributes before summary statistics can be computed.
                    </span>
                  ) : summary.numericFields.slice(0, 4).map((field) => (
                    <div key={field.field} style={{ display: "grid", gap: "0.125rem", color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                      <strong style={{ color: MAP_COLORS.interaction, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{field.field}</strong>
                      <span>min {field.min.toFixed(2)} · max {field.max.toFixed(2)} · mean {field.mean.toFixed(2)} · median {field.median.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </MapBottomPanelScrollBody>
    );
  }

  if (rightTimelineDockActive || rightCollaborationDockActive) {
    return (
      <div
        data-testid={rightCollaborationDockActive ? "map-right-dock-collaboration-body" : "map-right-dock-timeline-body"}
        style={{ height: "100%", minHeight: 0 }}
      >
        {renderReviewTimeline(
          true,
          handleCloseRightDockHost,
          rightCollaborationDockActive ? "collaboration" : "timeline",
        )}
      </div>
    );
  }

  if (rightTasksDockActive) {
    return <MapBottomPanelTasksBody tasks={bottomPanelTasks} />;
  }

  if (rightMeasureDockActive) {
    return (
      <div data-testid="map-right-dock-measure-body" style={{ height: "100%", minHeight: 0 }}>
        <MapMeasurementTool
          mapRef={mapRef}
          activeMeasureTool={activeMeasureTool}
          presentation="embedded"
          seedMeasurementStart={measurementSeed}
          measurements={measurements}
          measureUnit={measureUnit}
          onAddMeasurement={addMeasurement}
          onRemoveMeasurement={removeMeasurement}
          onClearMeasurements={clearMeasurements}
          onSetMeasureUnit={setMeasureUnit}
          onCancelMeasure={handleCancelMeasure}
          onSeedHandled={(token) =>
            setMeasurementSeed((current) =>
              current?.token === token ? null : current,
            )
          }
          onAnnounce={announce}
        />
      </div>
    );
  }

  if (rightProblemsDockActive) {
    return (
      <MapBottomPanelScrollBody data-testid="map-right-dock-problems-body" padding={12}>
        <MapProblemsPanel model={bottomProblemsModel} compact onProblemAction={handleBottomProblemAction} />
      </MapBottomPanelScrollBody>
    );
  }

  if (rightScientificQADockActive) {
    return (
      <ScientificQAPanel
        visible
        qaState={scientificQA}
        overlayLayers={overlayLayers}
        presentation="embedded"
        onClose={handleCloseRightDockHost}
        onShowDetails={(issue) => {
          announce(`Scientific QA details opened for ${issue.title}`);
        }}
        onOpenLayer={handleFocusLayer}
        onDeclareCrs={(layerId) => {
          handleInspectLayer(layerId);
          announce("Inspector opened — use the CRS tab to declare a coordinate reference system");
        }}
        onInspectLayer={handleInspectLayer}
        onRepairGeometry={handleRepairLayerGeometry}
        onOpenExportReadiness={() => {
          handleOpenPublishTab("publish-data-export", "Export readiness opened in Publish");
        }}
      />
    );
  }

  if (rightDiagnosticsDockActive || rightPerformanceDockActive) {
    const diagnosticsPanelTestId = rightPerformanceDockActive
      ? "map-right-dock-performance-body"
      : "map-right-dock-diagnostics-body";
    return (
      <div data-testid={diagnosticsPanelTestId} style={{ height: "100%", minHeight: 0 }}>
        <MapPanelErrorBoundary
          panelName={rightPerformanceDockActive ? "Performance diagnostics" : "Render diagnostics"}
          resetKey={activeRightDockPanel ?? "diagnostics"}
          onClose={handleCloseRightDockHost}
        >
          <MapPerformanceDiagnosticsPanel
            visible
            presentation="embedded"
            diagnostics={performanceDiagnostics}
            onRetryWorkerJob={handleRetryWorkerJob}
            onClose={handleCloseRightDockHost}
          />
        </MapPanelErrorBoundary>
      </div>
    );
  }

  return (
    <RightDockEmptyState
      title="No routed content"
      description="This right-dock route is available, but the current map context has no active content for it yet."
    />
  );
};
