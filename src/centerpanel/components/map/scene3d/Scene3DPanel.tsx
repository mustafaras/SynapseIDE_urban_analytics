import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, GeoJsonProperties, Polygon } from "geojson";
import { AlertTriangle, Box, ChevronDown, Crosshair, Eye, Layers, Scissors } from "lucide-react";
import {
  selectSectionPlaneDefinition,
  selectSectionPlaneResult,
  selectScene3DActiveLayerCrs,
  selectScene3DActiveLayerId,
  selectScene3DBuildings,
  selectBuildingConfig,
  selectExtrusionAnalysis,
  selectInspectorEntries,
  selectScene3DCityModelSourceHandle,
  selectScene3DTerrainSourceHandle,
  selectScene3DMode,
  selectScene3DSelected,
  selectViewCorridorResult,
  useScene3DStore,
} from "@/stores/useScene3DStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  resolveMapPaintColor,
  type GisStatusKey,
} from "../mapTokens";
import { GisStatusChip } from "../ui/GisStatusChip";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";
import { Scene3DInteractionStrip } from "./Scene3DInteractionStrip";
import { ScenarioComparisonStrip } from "./ScenarioComparisonStrip";
import type { Scene3DRuntimeMode } from "@/services/map/scene3d/Map3DSceneController";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type {
  Scene3DBuildingMass,
  SectionPlaneAnalysisResult,
  ViewCorridorAnalysisResult,
} from "@/services/map/scene3d/ViewCorridorSectionService";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface Scene3DPanelProps {
  visible: boolean;
  onClose: () => void;
  onModeChange?: (mode: Scene3DRuntimeMode) => void;
  presentation?: "floating" | "embedded";
  viewportSync?: {
    label: string;
    status: GisStatusKey;
    title?: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Styles (mapTokens only — no Tailwind, no hard-coded hex)           */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(24rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 5),
  height: "min(36rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.lg,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const embeddedPanelStyle: React.CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  width: "100%",
  border: "none",
  borderRadius: 0,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  alignContent: "start",
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
  alignItems: "center",
};

const keyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const caveatStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  alignItems: "flex-start",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  color: MAP_COLORS.warning,
  borderColor: MAP_COLORS.caveat,
};

const modeSwitchStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  flexWrap: "wrap",
};

const modeButtonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const modeButtonActiveStyle: React.CSSProperties = {
  ...modeButtonBase,
  background: MAP_COLORS.interactionSubtle,
  borderColor: MAP_COLORS.interaction,
  color: MAP_COLORS.text,
};

const iconButtonStyle: React.CSSProperties = {
  width: "1.875rem",
  height: "1.875rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const footerBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const RUNTIME_MODES: { id: Scene3DRuntimeMode; label: string }[] = [
  { id: "2d", label: "2D" },
  { id: "2.5d", label: "2.5D" },
  { id: "3d", label: "3D" },
];

const sceneCanvasStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "2.8 / 1",
  border: "none",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
  display: "block",
};

const previewIdleStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "5.75rem",
  display: "grid",
  placeItems: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const analysisPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
};

const analysisActionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.sm,
};

const stateChipRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const analysisButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  transition: MAP_TRANSITIONS.fast,
};

const analysisButtonDisabledStyle: React.CSSProperties = {
  ...analysisButtonStyle,
  cursor: "not-allowed",
  color: MAP_COLORS.textMuted,
  opacity: 0.7,
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: MAP_SPACING.xs,
};

const metricTileStyle: React.CSSProperties = {
  display: "grid",
  gap: "2px",
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  minWidth: 0,
};

const metricValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
};

const rangeStyle: React.CSSProperties = {
  width: "100%",
  accentColor: MAP_COLORS.interaction,
};

const sourceMetadataGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(10.5rem, 1fr))",
  gap: MAP_SPACING.sm,
};

const sourceMetadataLaneStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  alignContent: "start",
  minWidth: 0,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
};

const sourceMetadataHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const sourceMetadataTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const dockedControlSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

function handleRuntimeLabel(handle: SourceHandle | null): string {
  if (!handle?.scene3d) return "none";
  if (handle.scene3d.runtimeMode === "metadata-only") return "metadata-only";
  return handle.scene3d.runtimeMode;
}

function sceneSourceKindLabel(handle: SourceHandle | null): string {
  const kind = handle?.scene3d?.sourceKind;
  if (!kind) return "not linked";
  return kind.replace(/[-_]+/g, " ");
}

function sourceCrsLabel(handle: SourceHandle | null): string {
  if (!handle) return "not linked";
  return handle.crsSummary.status === "known" && handle.crsSummary.crs ? handle.crsSummary.crs : "not declared";
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value == null ? "not recorded" : value.toLocaleString();
}

function formatOptionalMetres(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "not recorded";
  return `${value.toFixed(digits)} m`;
}

function formatElevationRange(range: [number, number] | null | undefined): string {
  if (!range) return "not recorded";
  return `${formatOptionalMetres(range[0])} - ${formatOptionalMetres(range[1])}`;
}

function formatBbox2d(bbox: [number, number, number, number] | null | undefined): string {
  if (!bbox) return "not recorded";
  return `${bbox[0].toFixed(4)}, ${bbox[1].toFixed(4)} to ${bbox[2].toFixed(4)}, ${bbox[3].toFixed(4)}`;
}

function formatBbox3d(bbox: [number, number, number, number, number, number] | null | undefined): string {
  if (!bbox) return "not recorded";
  return `${bbox[0].toFixed(4)}, ${bbox[1].toFixed(4)} to ${bbox[3].toFixed(4)}, ${bbox[4].toFixed(4)}; z ${bbox[2].toFixed(1)}-${bbox[5].toFixed(1)} m`;
}

function formatLods(lods: readonly string[] | undefined): string {
  return lods && lods.length > 0 ? lods.join(", ") : "not recorded";
}

function MetadataRow({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div style={rowStyle} {...(testId ? { "data-testid": testId } : {})}>
      <span style={keyStyle}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function verticalDatumLabel(handle: SourceHandle | null): string {
  const datum = handle?.scene3d?.verticalDatum;
  if (!datum) return "not recorded";
  if (datum.status === "known" && datum.value) return datum.value;
  return `unknown (${datum.source})`;
}

function sceneRuntimeModeStatus(mode: Scene3DRuntimeMode): GisStatusKey {
  return mode === "3d" || mode === "2.5d" ? "ready" : "unknown";
}

function sourceRuntimeStatus(handle: SourceHandle | null): GisStatusKey {
  const scene = handle?.scene3d;
  if (!scene) return "unknown";
  if (scene.sourceKind === "generated-massing" || scene.sourceKind === "zoning-envelope" || scene.sourceKind === "sun-shadow-result") return "synthetic";
  if (scene.runtimeMode === "sample") return "demo";
  if (scene.runtimeMode === "metadata-only") return "caveat";
  return "ready";
}

function sourceRuntimeLabel(handle: SourceHandle | null): string {
  const scene = handle?.scene3d;
  if (!scene) return "footprint extrusion";
  if (scene.sourceKind === "generated-massing") return "generated massing";
  if (scene.sourceKind === "zoning-envelope") return "generated envelope";
  if (scene.runtimeMode === "metadata-only") return "metadata only";
  return `${scene.runtimeMode} ${sceneSourceKindLabel(handle)}`;
}

function verticalDatumStatus(handle: SourceHandle | null): GisStatusKey {
  const datum = handle?.scene3d?.verticalDatum;
  if (!datum) return "unknown";
  return datum.status === "known" ? "ready" : "caveat";
}

function generationStateStatus(handle: SourceHandle | null): GisStatusKey {
  const scene = handle?.scene3d;
  const sourceKind = scene?.sourceKind;
  if (!sourceKind) return "unknown";
  if (sourceKind === "generated-massing" || sourceKind === "zoning-envelope" || sourceKind === "sun-shadow-result") return "synthetic";
  if (sourceKind === "sample-3d" || scene?.runtimeMode === "sample") return "demo";
  if (scene?.runtimeMode === "metadata-only") return "caveat";
  return "ready";
}

function generationStateLabel(handle: SourceHandle | null): string {
  const scene = handle?.scene3d;
  const sourceKind = scene?.sourceKind;
  if (!sourceKind) return "source unknown";
  if (sourceKind === "generated-massing" || sourceKind === "zoning-envelope" || sourceKind === "sun-shadow-result") return "generated";
  if (sourceKind === "sample-3d" || scene?.runtimeMode === "sample") return "sample";
  if (scene?.runtimeMode === "metadata-only") return "metadata only";
  return "source-backed";
}

function sceneBounds(collection: FeatureCollection<Polygon, GeoJsonProperties>): [number, number, number, number] | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const feature of collection.features) {
    const ring = feature.geometry.coordinates[0];
    if (!ring) continue;
    for (const [x, y] of ring) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return minX === Number.POSITIVE_INFINITY ? null : [minX, minY, maxX, maxY];
}

function buildingBoundsFromMasses(buildings: readonly Scene3DBuildingMass[]): [number, number, number, number] | null {
  if (buildings.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const building of buildings) {
    minX = Math.min(minX, building.bbox[0]);
    minY = Math.min(minY, building.bbox[1]);
    maxX = Math.max(maxX, building.bbox[2]);
    maxY = Math.max(maxY, building.bbox[3]);
  }
  return [minX, minY, maxX, maxY];
}

function buildingMassForFeature(
  buildings: readonly Scene3DBuildingMass[],
  feature: FeatureCollection<Polygon, GeoJsonProperties>["features"][number],
  index: number,
): Scene3DBuildingMass | null {
  const featureId = String(feature.id ?? feature.properties?.id ?? index + 1);
  return buildings.find((building) => building.featureId === featureId) ?? null;
}

function mapSceneX(value: number, bounds: [number, number, number, number], width: number): number {
  const span = Math.max(bounds[2] - bounds[0], Number.EPSILON);
  return 18 + ((value - bounds[0]) / span) * (width - 40);
}

function formatMetres(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0.0 m";
  return `${value.toFixed(digits)} m`;
}

function resultExecutionCrs(
  corridorResult: ViewCorridorAnalysisResult | null,
  sectionResult: SectionPlaneAnalysisResult | null,
  fallback: string | null,
): string | null {
  return corridorResult?.executionCrs ?? sectionResult?.executionCrs ?? fallback;
}

function featureHeight(properties: GeoJsonProperties): number {
  const candidates = [
    properties?.measuredHeight,
    properties?.height,
    properties?.height_m,
    Number(properties?.surface_max_z) - Number(properties?.surface_min_z),
  ];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 6;
}

function drawTerrainScenePreview(
  canvas: HTMLCanvasElement,
  collection: FeatureCollection<Polygon, GeoJsonProperties> | null,
  cityModelHandle: SourceHandle | null,
  terrainHandle: SourceHandle | null,
  sceneBuildings: readonly Scene3DBuildingMass[],
  corridorResult: ViewCorridorAnalysisResult | null,
  sectionResult: SectionPlaneAnalysisResult | null,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = canvas.width;
  const height = canvas.height;
  const bg = resolveMapPaintColor(MAP_COLORS.bgWorkspace);
  const terrain = resolveMapPaintColor(MAP_COLORS.interactionSubtle);
  const terrainStroke = resolveMapPaintColor(MAP_COLORS.interaction);
  const building = resolveMapPaintColor(MAP_COLORS.caveatText);
  const roof = resolveMapPaintColor(MAP_COLORS.text);
  const muted = resolveMapPaintColor(MAP_COLORS.textMuted);
  const intrusion = resolveMapPaintColor(MAP_COLORS.error);
  const section = resolveMapPaintColor(MAP_COLORS.interaction);

  context.clearRect(0, 0, width, height);
  context.fillStyle = bg;
  context.fillRect(0, 0, width, height);

  const baseY = Math.round(height * 0.78);
  context.beginPath();
  context.moveTo(0, baseY);
  for (let x = 0; x <= width; x += 24) {
    const rise = terrainHandle ? Math.sin(x / 45) * 10 + Math.cos(x / 70) * 6 : 0;
    context.lineTo(x, baseY - rise);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fillStyle = terrain;
  context.fill();
  context.strokeStyle = terrainStroke;
  context.lineWidth = 2;
  context.stroke();

  if (collection && cityModelHandle) {
    const bounds = buildingBoundsFromMasses(sceneBuildings) ?? sceneBounds(collection);
    const visibleFeatures = collection.features.slice(0, 28);
    visibleFeatures.forEach((feature, index) => {
      const ring = feature.geometry.coordinates[0];
      const first = ring?.[0];
      const xRatio = bounds && first
        ? (first[0] - bounds[0]) / Math.max(bounds[2] - bounds[0], Number.EPSILON)
        : index / Math.max(visibleFeatures.length - 1, 1);
      const x = 18 + xRatio * (width - 40);
      const terrainBase = Number(feature.properties?.scene3d_base_elevation_m);
      const terrainLift = Number.isFinite(terrainBase) ? Math.max(0, terrainBase % 28) : 0;
      const buildingHeight = Math.min(height * 0.54, Math.max(12, featureHeight(feature.properties) * 1.7));
      const y = baseY - terrainLift;
      const w = 9 + (index % 4) * 2;
      const mass = buildingMassForFeature(sceneBuildings, feature, index);
      const featureId = mass?.featureId ?? String(feature.id ?? feature.properties?.id ?? index + 1);
      const intrudes = corridorResult?.intrusions.some((entry) => entry.featureId === featureId) ?? false;
      const sectionCut = sectionResult?.cutFeatureIds.includes(featureId) ?? false;
      const beyondClip = Boolean(
        sectionResult?.plane.clipEnabled
        && mass
        && sectionResult.plane.axis === "x"
        && mass.bbox[0] > sectionResult.plane.offsetM,
      );
      context.globalAlpha = beyondClip && !sectionCut && !intrudes ? 0.32 : 1;
      context.fillStyle = intrudes ? intrusion : sectionCut ? section : building;
      context.fillRect(x, y - buildingHeight, w, buildingHeight);
      context.fillStyle = roof;
      context.fillRect(x, y - buildingHeight - 3, w, 3);
      if (beyondClip && mass) {
        context.strokeStyle = muted;
        context.lineWidth = 1;
        context.strokeRect(x, y - buildingHeight, w, buildingHeight);
      }
      context.globalAlpha = 1;
    });

    if (bounds && corridorResult) {
      const originX = mapSceneX(corridorResult.corridor.origin[0], bounds, width);
      const targetX = mapSceneX(corridorResult.corridor.target[0], bounds, width);
      context.strokeStyle = corridorResult.status === "ready" ? intrusion : muted;
      context.lineWidth = 2;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.moveTo(originX, baseY - 118);
      context.lineTo(targetX, baseY - 88);
      context.stroke();
      context.setLineDash([]);
    }

    if (bounds && sectionResult) {
      const planeX = mapSceneX(sectionResult.plane.offsetM, bounds, width);
      context.strokeStyle = section;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(planeX, 24);
      context.lineTo(planeX, height - 10);
      context.stroke();
    }
  }

  context.fillStyle = muted;
  context.font = "11px ui-monospace, SFMono-Regular, Consolas, monospace";
  const label = terrainHandle ? "terrain-grounded" : "flat-ground caveat";
  context.fillText(label, 10, 18);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const Scene3DPanel: React.FC<Scene3DPanelProps> = ({
  visible,
  onClose,
  onModeChange,
  presentation = "floating",
  viewportSync,
}) => {
  const panelDrag = useDraggableMapPanel();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const embedded = presentation === "embedded";

  const runtimeMode = useScene3DStore(selectScene3DMode);
  const activeLayerId = useScene3DStore(selectScene3DActiveLayerId);
  const activeLayerCrs = useScene3DStore(selectScene3DActiveLayerCrs);
  const analysis = useScene3DStore(selectExtrusionAnalysis);
  const buildingConfig = useScene3DStore(selectBuildingConfig);
  const cityModelHandle = useScene3DStore(selectScene3DCityModelSourceHandle);
  const terrainHandle = useScene3DStore(selectScene3DTerrainSourceHandle);
  const primarySceneHandle = cityModelHandle ?? terrainHandle;
  const cityScene = cityModelHandle?.scene3d ?? null;
  const terrainScene = terrainHandle?.scene3d ?? null;
  const tilesetScene = cityScene?.sourceKind === "3d-tiles" ? cityScene : null;
  const cityJsonScene = cityScene?.sourceKind === "cityjson" ? cityScene : null;
  const previewActive = runtimeMode === "2.5d" || runtimeMode === "3d";
  const activeCollection = useScene3DStore((s) => s.activeCollection);
  const sceneBuildings = useScene3DStore(selectScene3DBuildings);
  const selectedIds = useScene3DStore(selectScene3DSelected);
  const inspectorEntries = useScene3DStore(selectInspectorEntries);
  const viewCorridorResult = useScene3DStore(selectViewCorridorResult);
  const sectionPlaneDefinition = useScene3DStore(selectSectionPlaneDefinition);
  const sectionPlaneResult = useScene3DStore(selectSectionPlaneResult);

  const setRuntimeMode = useScene3DStore((s) => s.setRuntimeMode);
  const publishSceneMetadata = useScene3DStore((s) => s.publishSceneMetadata);
  const runDefaultViewCorridor = useScene3DStore((s) => s.runDefaultViewCorridor);
  const runDefaultSectionPlane = useScene3DStore((s) => s.runDefaultSectionPlane);
  const setSectionPlaneOffset = useScene3DStore((s) => s.setSectionPlaneOffset);
  const setHeightFieldOverride = useScene3DStore((s) => s.setHeightFieldOverride);
  const heightFieldOverride = useScene3DStore((s) => s.heightFieldOverride);
  const metersPerLevelOverride = useScene3DStore((s) => s.metersPerLevelOverride);
  const setMetersPerLevelOverride = useScene3DStore((s) => s.setMetersPerLevelOverride);
  const registerMapEvidenceArtifact = useMapExplorerStore((s) => s.registerMapEvidenceArtifact);
  const [publishedAnalysisId, setPublishedAnalysisId] = useState<string | null>(null);

  const caveats = useMemo(
    () => [
      ...(analysis?.caveats ?? []),
      ...(cityModelHandle?.caveats ?? []),
      ...(terrainHandle?.caveats ?? []),
    ],
    [analysis?.caveats, cityModelHandle?.caveats, terrainHandle?.caveats],
  );

  const handleModeChange = useCallback(
    (mode: Scene3DRuntimeMode) => {
      setRuntimeMode(mode);
      onModeChange?.(mode);
    },
    [setRuntimeMode, onModeChange],
  );

  const sectionRange = useMemo(() => {
    const bounds = buildingBoundsFromMasses(sceneBuildings);
    if (!bounds) return { min: 0, max: 100, step: 1, value: 50 };
    const min = bounds[0];
    const max = bounds[2];
    return {
      min,
      max,
      step: 0.5,
      value: sectionPlaneDefinition?.offsetM ?? (min + max) / 2,
    };
  }, [sceneBuildings, sectionPlaneDefinition?.offsetM]);

  const corridorIntrusionIds = useMemo(
    () => new Set(viewCorridorResult?.intrusions.map((entry) => entry.featureId) ?? []),
    [viewCorridorResult?.intrusions],
  );

  const sectionCutIds = useMemo(
    () => new Set(sectionPlaneResult?.cutFeatureIds ?? []),
    [sectionPlaneResult?.cutFeatureIds],
  );

  const handleSectionOffsetChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSectionPlaneOffset(Number(event.currentTarget.value));
    },
    [setSectionPlaneOffset],
  );

  const handlePublishAnalysisEvidence = useCallback(() => {
    if (!activeLayerId || (!viewCorridorResult && !sectionPlaneResult)) return;
    const executionCrs = resultExecutionCrs(viewCorridorResult, sectionPlaneResult, activeLayerCrs);
    const assumptions = [
      ...(viewCorridorResult?.assumptions ?? []),
      ...(sectionPlaneResult?.assumptions ?? []),
    ];
    const caveats = [
      ...(viewCorridorResult?.caveats ?? []),
      ...(sectionPlaneResult?.caveats ?? []),
    ];
    const blocked = viewCorridorResult?.status === "blocked" || sectionPlaneResult?.status === "blocked";
    const artifact = registerMapEvidenceArtifact({
      kind: "workflow-result",
      title: "3D corridor and section analysis",
      summary: `View corridor intrusions: ${viewCorridorResult?.intrusionCount ?? 0}; section cuts: ${sectionPlaneResult?.cutCount ?? 0}.`,
      sourceModule: "map-explorer",
      sourceLayerIds: [activeLayerId],
      linkedLayerIds: [activeLayerId],
      tags: ["scene3d", "view-corridor", "section-plane"],
      provenance: {
        sourceModule: "map-explorer",
        sourceLayerIds: [activeLayerId],
        method: "3D view corridor + section cut",
        crsSummary: {
          sourceLayerCrs: [{ layerId: activeLayerId, crs: activeLayerCrs }],
          displayCrs: "EPSG:4326",
          ...(executionCrs ? { declaredCrs: executionCrs } : {}),
          notes: assumptions,
        },
        geometrySummary: {
          source: "workflow-summary",
          geometryTypes: ["line-of-sight", "section-plane", "building-footprint"],
          featureCount: sectionPlaneResult?.contextFeatureCount ?? viewCorridorResult?.testedBuildingCount ?? 0,
          notes: ["Evidence stores scene-analysis metrics and IDs only; source geometry remains in Map Explorer state."],
        },
        notes: assumptions,
      },
      qa: {
        state: blocked ? "blocked" : caveats.length > 0 ? "warning" : "passed",
        caveats,
        blockerCount: blocked ? 1 : 0,
      },
      metadata: {
        execution_crs: executionCrs,
        corridor_intrusion_count: viewCorridorResult?.intrusionCount ?? 0,
        corridor_length_m: viewCorridorResult?.corridorLengthM ?? null,
        section_cut_count: sectionPlaneResult?.cutCount ?? 0,
        section_offset_m: sectionPlaneResult?.plane.offsetM ?? null,
        clip_retains_analyzed_geometry: sectionPlaneResult?.clipRetainsAnalyzedGeometry ?? true,
      },
    });
    setPublishedAnalysisId(artifact.id);
  }, [activeLayerCrs, activeLayerId, registerMapEvidenceArtifact, sectionPlaneResult, viewCorridorResult]);

  useEffect(() => {
    if (!visible || !canvasRef.current || runtimeMode === "2d") return;
    drawTerrainScenePreview(
      canvasRef.current,
      activeCollection as FeatureCollection<Polygon, GeoJsonProperties> | null,
      cityModelHandle,
      terrainHandle,
      sceneBuildings,
      viewCorridorResult,
      sectionPlaneResult,
    );
  }, [activeCollection, cityModelHandle, runtimeMode, sceneBuildings, sectionPlaneResult, terrainHandle, viewCorridorResult, visible]);

  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel={embedded ? undefined : "true"}
      style={embedded ? embeddedPanelStyle : { ...panelStyle, ...panelDrag.panelPositionStyle }}
      role={embedded ? "region" : "dialog"}
      aria-modal={embedded ? undefined : "false"}
      aria-label="3D scene panel"
      data-presentation={presentation}
      data-testid="scene3d-panel"
    >
      {/* Header */}
      <header
        style={embedded ? headerStyle : { ...headerStyle, ...panelDrag.dragHandleStyle }}
        {...(embedded ? {} : panelDrag.dragHandleProps)}
      >
        <h3 style={titleStyle}>
          <Box size={MAP_ICON_SIZES.md} aria-hidden="true" />
          3D Scene
        </h3>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close 3D panel">
          <ChevronDown size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      {/* Body */}
      <div style={embedded ? { ...bodyStyle, overflowY: "visible" } : bodyStyle}>
        {/* Mode switcher */}
        <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
          <span style={sectionTitleStyle}>View mode</span>
          <div style={modeSwitchStyle} role="group" aria-label="3D view mode">
            {RUNTIME_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                style={runtimeMode === m.id ? modeButtonActiveStyle : modeButtonBase}
                onClick={() => handleModeChange(m.id)}
                aria-pressed={runtimeMode === m.id}
                data-testid={`scene3d-mode-${m.id}`}
              >
                <Eye size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-source-handle">
          <span style={sectionTitleStyle}>Scene source</span>
          {previewActive ? (
            <canvas
              ref={canvasRef}
              width={520}
              height={186}
              style={sceneCanvasStyle}
              data-testid="scene3d-terrain-canvas"
              aria-label="Terrain grounded 3D scene preview"
            />
          ) : (
            <div
              style={previewIdleStyle}
              data-testid="scene3d-preview-idle"
              data-heavy-scene-mounted="false"
            >
              2D view · terrain preview idle
            </div>
          )}
          <div style={stateChipRowStyle} data-testid="scene3d-evidence-state-chips">
            <GisStatusChip
              status={sceneRuntimeModeStatus(runtimeMode)}
              label={`view ${runtimeMode}`}
              density="compact"
              data-testid="scene3d-runtime-mode-chip"
            />
            <GisStatusChip
              status={sourceRuntimeStatus(primarySceneHandle)}
              label={sourceRuntimeLabel(primarySceneHandle)}
              density="compact"
              data-testid="scene3d-source-mode-chip"
            />
            <GisStatusChip
              status={verticalDatumStatus(terrainHandle ?? cityModelHandle)}
              label={verticalDatumLabel(terrainHandle ?? cityModelHandle)}
              density="compact"
              data-testid="scene3d-vertical-assumption-chip"
            />
            <GisStatusChip
              status={generationStateStatus(primarySceneHandle)}
              label={generationStateLabel(primarySceneHandle)}
              density="compact"
              data-testid="scene3d-generation-state-chip"
            />
            {viewportSync ? (
              <span title={viewportSync.title}>
                <GisStatusChip
                  status={viewportSync.status}
                  label={viewportSync.label}
                  density="compact"
                  data-testid="scene3d-viewport-sync-chip"
                />
              </span>
            ) : null}
          </div>
          <div style={sourceMetadataGridStyle} data-testid="scene3d-source-metadata">
            <section style={sourceMetadataLaneStyle} data-testid="scene3d-cityjson-metadata">
              <div style={sourceMetadataHeaderStyle}>
                <h4 style={sourceMetadataTitleStyle}>CityJSON</h4>
                <GisStatusChip
                  status={cityJsonScene ? sourceRuntimeStatus(cityModelHandle) : "unknown"}
                  label={cityJsonScene ? handleRuntimeLabel(cityModelHandle) : "not linked"}
                  density="compact"
                  data-testid="scene3d-cityjson-state-chip"
                />
              </div>
              <MetadataRow
                label="Source mode"
                value={cityJsonScene ? sourceRuntimeLabel(cityModelHandle) : "not linked"}
                testId="scene3d-cityjson-source-mode"
              />
              <MetadataRow label="Objects" value={formatOptionalNumber(cityJsonScene?.objectCount)} />
              <MetadataRow label="LOD" value={formatLods(cityJsonScene?.lods)} />
              <MetadataRow label="CRS" value={cityJsonScene ? sourceCrsLabel(cityModelHandle) : "not linked"} />
              <MetadataRow label="3D bounds" value={formatBbox3d(cityJsonScene?.bbox3d)} />
            </section>

            <section style={sourceMetadataLaneStyle} data-testid="scene3d-terrain-metadata">
              <div style={sourceMetadataHeaderStyle}>
                <h4 style={sourceMetadataTitleStyle}>Terrain</h4>
                <GisStatusChip
                  status={terrainScene ? sourceRuntimeStatus(terrainHandle) : "unknown"}
                  label={terrainScene ? handleRuntimeLabel(terrainHandle) : "flat"}
                  density="compact"
                  data-testid="scene3d-terrain-state-chip"
                />
              </div>
              <MetadataRow
                label="Source mode"
                value={terrainScene ? sourceRuntimeLabel(terrainHandle) : "flat ground fallback"}
                testId="scene3d-terrain-source-mode"
              />
              <MetadataRow
                label="Grid"
                value={terrainScene?.terrain ? `${formatOptionalNumber(terrainScene.terrain.width)} x ${formatOptionalNumber(terrainScene.terrain.height)}` : "not linked"}
              />
              <MetadataRow label="Elevation" value={formatElevationRange(terrainScene?.terrain?.elevationRangeM)} />
              <MetadataRow label="Samples" value={formatOptionalNumber(terrainScene?.terrain?.sampleCount)} />
              <MetadataRow label="CRS" value={terrainScene ? sourceCrsLabel(terrainHandle) : "not linked"} />
              <MetadataRow label="Bounds" value={formatBbox2d(terrainScene?.terrain?.bbox)} />
            </section>

            <section style={sourceMetadataLaneStyle} data-testid="scene3d-tiles-metadata">
              <div style={sourceMetadataHeaderStyle}>
                <h4 style={sourceMetadataTitleStyle}>3D Tiles</h4>
                <GisStatusChip
                  status={tilesetScene ? sourceRuntimeStatus(cityModelHandle) : "unknown"}
                  label={tilesetScene ? handleRuntimeLabel(cityModelHandle) : "not linked"}
                  density="compact"
                  data-testid="scene3d-tiles-state-chip"
                />
              </div>
              <MetadataRow
                label="Source mode"
                value={tilesetScene ? sourceRuntimeLabel(cityModelHandle) : "not linked"}
                testId="scene3d-tiles-source-mode"
              />
              <MetadataRow label="Asset" value={tilesetScene?.tileset?.assetVersion ?? "not recorded"} />
              <MetadataRow
                label="Tiles"
                value={tilesetScene?.tileset ? `${formatOptionalNumber(tilesetScene.tileset.tileCount)} tiles / ${formatOptionalNumber(tilesetScene.tileset.contentCount)} content` : "not linked"}
              />
              <MetadataRow label="Error" value={formatOptionalMetres(tilesetScene?.tileset?.rootGeometricError)} />
              <MetadataRow label="Refine" value={tilesetScene?.tileset?.rootRefine ?? "not recorded"} />
              <MetadataRow label="3D bounds" value={formatBbox3d(tilesetScene?.bbox3d)} />
            </section>
          </div>
          <div style={rowStyle} data-testid="scene3d-vertical-datum">
            <span style={keyStyle}>Vertical datum</span>
            <span>{verticalDatumLabel(terrainHandle ?? cityModelHandle)}</span>
          </div>
        </div>

        {previewActive && (
          <section style={dockedControlSectionStyle} data-testid="scene3d-docked-interaction-tools">
            <span style={sectionTitleStyle}>Interaction tools</span>
            <Scene3DInteractionStrip visible presentation="embedded" />
          </section>
        )}

        {previewActive && (
          <section style={dockedControlSectionStyle} data-testid="scene3d-docked-scenario-comparison">
            <ScenarioComparisonStrip visible presentation="embedded" />
          </section>
        )}

        {/* Extrusion config */}
        {previewActive && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-extrusion-config">
            <span style={sectionTitleStyle}>Extrusion</span>
            <div style={rowStyle}>
              <span style={keyStyle}>Height field</span>
              <span>{analysis?.heightField ?? "auto"}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>Floor field</span>
              <span>{analysis?.floorField ?? "auto"}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>Can extrude</span>
              <span data-testid="scene3d-can-extrude">
                {analysis?.canExtrude ? "yes" : "no — add height data"}
              </span>
            </div>

            {/* Height field override */}
            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Override height field</span>
              <input
                style={{ ...selectStyle }}
                value={heightFieldOverride ?? ""}
                placeholder="e.g. height_m"
                onChange={(e) => setHeightFieldOverride(e.target.value || null)}
                data-testid="scene3d-height-field-input"
              />
            </label>

            {/* Meters per level */}
            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Metres / floor</span>
              <select
                style={selectStyle}
                value={metersPerLevelOverride}
                onChange={(e) => setMetersPerLevelOverride(Number(e.target.value))}
                data-testid="scene3d-meters-per-floor"
              >
                {[2.5, 3, 3.5, 4].map((v) => (
                  <option key={v} value={v}>{v} m</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {previewActive && (
          <div style={analysisPanelStyle} data-testid="scene3d-analysis-tools">
            <span style={sectionTitleStyle}>Corridor + section</span>
            <div style={rowStyle} data-testid="scene3d-analysis-crs">
              <span style={keyStyle}>Execution CRS</span>
              <span>{resultExecutionCrs(viewCorridorResult, sectionPlaneResult, activeLayerCrs) ?? "not declared"}</span>
            </div>

            <div style={analysisActionRowStyle}>
              <button
                type="button"
                style={sceneBuildings.length > 0 ? analysisButtonStyle : analysisButtonDisabledStyle}
                onClick={runDefaultViewCorridor}
                disabled={sceneBuildings.length === 0}
                data-testid="scene3d-run-corridor"
                aria-label="Define protected view corridor"
              >
                <Crosshair size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                Define corridor
              </button>
              <button
                type="button"
                style={sceneBuildings.length > 0 ? analysisButtonStyle : analysisButtonDisabledStyle}
                onClick={runDefaultSectionPlane}
                disabled={sceneBuildings.length === 0}
                data-testid="scene3d-run-section"
                aria-label="Create section cut plane"
              >
                <Scissors size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                Section cut
              </button>
            </div>

            <div
              style={metricGridStyle}
              data-testid="scene3d-corridor-result"
              data-status={viewCorridorResult?.status ?? "idle"}
              data-intrusion-count={viewCorridorResult?.intrusionCount ?? 0}
            >
              <div style={metricTileStyle}>
                <span style={keyStyle}>Intrusions</span>
                <span style={{ ...metricValueStyle, color: (viewCorridorResult?.intrusionCount ?? 0) > 0 ? MAP_COLORS.error : MAP_COLORS.text }}>
                  {viewCorridorResult?.intrusionCount ?? 0}
                </span>
              </div>
              <div style={metricTileStyle}>
                <span style={keyStyle}>Length</span>
                <span style={metricValueStyle}>{formatMetres(viewCorridorResult?.corridorLengthM ?? 0)}</span>
              </div>
              <div style={metricTileStyle}>
                <span style={keyStyle}>Width</span>
                <span style={metricValueStyle}>{formatMetres(viewCorridorResult?.corridor.widthMetres ?? 0)}</span>
              </div>
            </div>

            {viewCorridorResult?.blockedReason && (
              <div style={caveatStyle} data-testid="scene3d-corridor-blocked">
                <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                <span>{viewCorridorResult.blockedReason}</span>
              </div>
            )}

            {viewCorridorResult && viewCorridorResult.intrusions.length > 0 && (
              <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-corridor-intrusions">
                {viewCorridorResult.intrusions.slice(0, 4).map((intrusion) => (
                  <div
                    key={intrusion.featureId}
                    data-testid={`scene3d-corridor-intrusion-${intrusion.featureId}`}
                    style={{
                      ...rowStyle,
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      borderLeft: `2px solid ${MAP_COLORS.error}`,
                      paddingLeft: MAP_SPACING.sm,
                    }}
                  >
                    <span>{intrusion.label}</span>
                    <span style={{ color: MAP_COLORS.error }}>{formatMetres(intrusion.excessM)}</span>
                  </div>
                ))}
              </div>
            )}

            <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={keyStyle}>Section offset</span>
              <input
                type="range"
                min={sectionRange.min}
                max={sectionRange.max}
                step={sectionRange.step}
                value={sectionRange.value}
                onChange={handleSectionOffsetChange}
                disabled={sceneBuildings.length === 0}
                style={rangeStyle}
                data-testid="scene3d-section-plane-slider"
                aria-label="Section plane offset"
              />
            </label>

            <div
              style={metricGridStyle}
              data-testid="scene3d-section-readout"
              data-status={sectionPlaneResult?.status ?? "idle"}
              data-cut-count={sectionPlaneResult?.cutCount ?? 0}
              data-retains-context={sectionPlaneResult?.clipRetainsAnalyzedGeometry ?? true}
            >
              <div style={metricTileStyle}>
                <span style={keyStyle}>Cut</span>
                <span style={metricValueStyle}>{sectionPlaneResult?.cutCount ?? 0}</span>
              </div>
              <div style={metricTileStyle}>
                <span style={keyStyle}>Offset</span>
                <span style={metricValueStyle}>{formatMetres(sectionPlaneResult?.plane.offsetM ?? sectionRange.value)}</span>
              </div>
              <div style={metricTileStyle}>
                <span style={keyStyle}>Height</span>
                <span style={metricValueStyle}>{formatMetres(sectionPlaneResult?.maxCutHeightM ?? 0)}</span>
              </div>
            </div>

            {sectionPlaneResult && (
              <div style={rowStyle} data-testid="scene3d-section-context-retained">
                <span style={keyStyle}>Context retained</span>
                <span>{sectionPlaneResult.retainedContextFeatureIds.length} / {sectionPlaneResult.contextFeatureCount}</span>
              </div>
            )}

            {sectionPlaneResult?.blockedReason && (
              <div style={caveatStyle} data-testid="scene3d-section-blocked">
                <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                <span>{sectionPlaneResult.blockedReason}</span>
              </div>
            )}

            <div style={analysisActionRowStyle}>
              <button
                type="button"
                style={viewCorridorResult || sectionPlaneResult ? analysisButtonStyle : analysisButtonDisabledStyle}
                onClick={handlePublishAnalysisEvidence}
                disabled={!viewCorridorResult && !sectionPlaneResult}
                data-testid="scene3d-publish-analysis-evidence"
                aria-label="Publish 3D analysis evidence"
              >
                Publish evidence
              </button>
              {publishedAnalysisId && (
                <span
                  style={{ ...keyStyle, alignSelf: "center" }}
                  data-testid="scene3d-analysis-evidence-published"
                >
                  {publishedAnalysisId}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Caveats */}
        {caveats.length > 0 && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-caveats">
            <span style={sectionTitleStyle}>Caveats</span>
            {caveats.map((caveat, i) => (
              <div key={i} style={caveatStyle}>
                <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                <span>{caveat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Building inspector */}
        {buildingConfig && inspectorEntries.length > 0 && (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="scene3d-inspector">
            <span style={sectionTitleStyle}>
              Building inspector — {inspectorEntries.length} feature(s),{" "}
              {selectedIds.length} selected
            </span>
            <div style={{ display: "grid", gap: MAP_SPACING.xs, maxHeight: "12rem", overflowY: "auto" }}>
              {inspectorEntries.slice(0, 20).map((entry) => (
                (() => {
                  const featureId = String(entry.featureId);
                  const corridorIntrusion = corridorIntrusionIds.has(featureId);
                  const sectionCut = sectionCutIds.has(featureId);
                  return (
                    <div
                      key={featureId}
                      data-testid={`scene3d-building-${featureId}`}
                      data-corridor-intrusion={corridorIntrusion ? "true" : "false"}
                      data-section-cut={sectionCut ? "true" : "false"}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto",
                        gap: MAP_SPACING.sm,
                        padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
                        border: corridorIntrusion
                          ? `1px solid ${MAP_COLORS.error}`
                          : sectionCut
                            ? `1px solid ${MAP_COLORS.interaction}`
                            : MAP_STROKES.hairlineSubtle,
                        borderRadius: MAP_RADIUS.sm,
                        fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                        background: corridorIntrusion
                          ? MAP_COLORS.caveat
                          : entry.isSelected || sectionCut
                            ? MAP_COLORS.selectedSubtle
                            : MAP_COLORS.transparent,
                      }}
                    >
                      <Layers size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                      <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        #{featureId}
                      </span>
                      <span style={{ color: corridorIntrusion ? MAP_COLORS.error : MAP_COLORS.textMuted }}>
                        {entry.heightMetres.toFixed(1)} m
                      </span>
                    </div>
                  );
                })()
              ))}
              {inspectorEntries.length > 20 && (
                <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                  + {inspectorEntries.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <button
          type="button"
          style={footerBtnStyle}
          onClick={publishSceneMetadata}
          data-testid="scene3d-publish"
          aria-label="Publish 3D scene metadata"
        >
          Publish metadata
        </button>
      </footer>
    </aside>
  );
};
