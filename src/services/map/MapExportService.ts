import type maplibregl from "maplibre-gl";
import { DESIGN_TOKENS } from "@/constants/design";
import {
  MAP_COLORS,
  MAP_TYPOGRAPHY,
} from "@/centerpanel/components/map/mapTokens";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import type { MapEvidenceQA, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { haversineDistance } from "@/utils/geodesic";
import type { MapScientificQAState } from "./MapScientificQA";

export type MapExportResolution = "screen" | "print" | "high";
export type MapPublicationExportFormat = "png" | "svg" | "pdf";
export type MapPublicationDpi = 72 | 150 | 300;
export type MapPublicationPageSize = "a4" | "a3" | "letter" | "custom";
export type MapCompositionMapFit = "contain" | "cover";
export type MapCompositionTitlePosition = "top-left" | "top-center" | "top-right";
export type MapCompositionCornerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type MapCompositionAttributionPosition = "bottom-left" | "bottom-center" | "bottom-right";
export type MapCompositionScaleUnit = "metric" | "imperial";
export type MapCompositionNorthArrowStyle = "simple" | "compass";
export type MapPublicationReadinessStatus = "ready" | "ready-with-caveats" | "blocked";
export type MapPublicationReadinessMode = "publication-export" | "report-handoff" | "public-map";
export type MapPublicationReadinessSeverity = "pass" | "warning" | "blocked";
export type MapPublicationReadinessCriterion =
  | "visible-layer"
  | "title"
  | "legend"
  | "scale-bar"
  | "north-arrow"
  | "attribution-license"
  | "crs-measurement"
  | "qa-blockers"
  | "caveats";

export interface MapExportOverlayOptions {
  includeToolbar?: boolean;
  includeStatusBar?: boolean;
  includeLegend?: boolean;
}

export interface MapExportDecorations {
  title?: string;
  includeScaleBar?: boolean;
  includeNorthArrow?: boolean;
}

export interface MapExportRenderOptions extends MapExportOverlayOptions, MapExportDecorations {
  resolution: MapExportResolution;
  toolbarElement?: HTMLElement | null;
  statusBarElement?: HTMLElement | null;
  legendElement?: HTMLElement | null;
  composition?: MapCompositionOptions | null;
  overlayLayers?: OverlayLayerConfig[];
}

export interface MapExportPreviewOptions extends MapExportRenderOptions {
  maxPreviewWidth?: number;
}

export interface MapExportImageResult {
  dataUrl: string;
  filename: string;
  width: number;
  height: number;
}

export interface MapPublicationExportResult extends MapExportImageResult {
  format: MapPublicationExportFormat;
  mimeType: string;
  readiness?: MapPublicationReadiness;
  manifest?: MapPublicationManifest;
}

export interface MapPublicationReadinessCheck {
  criterion: MapPublicationReadinessCriterion;
  label: string;
  status: MapPublicationReadinessSeverity;
  required: boolean;
  message: string;
  affectedLayerIds: string[];
  issueIds: string[];
  recommendedFix?: string;
}

export interface MapPublicationReadiness {
  id: string;
  status: MapPublicationReadinessStatus;
  mode: MapPublicationReadinessMode;
  checkedAt: string;
  visibleLayerCount: number;
  hasTitle: boolean;
  hasLegend: boolean;
  hasScaleBar: boolean;
  hasNorthArrow: boolean;
  hasAttribution: boolean;
  qaBlockingIssueCount: number;
  caveats: string[];
  blockers: MapPublicationReadinessCheck[];
  warnings: MapPublicationReadinessCheck[];
  checks: MapPublicationReadinessCheck[];
  acknowledgedIssueIds: string[];
}

export interface MapPublicationReadinessInput {
  mode: MapPublicationReadinessMode;
  overlayLayers: OverlayLayerConfig[];
  composition?: Partial<MapCompositionOptions> | null;
  scientificQA?: MapScientificQAState | null | undefined;
  legendItems?: MapCompositionLegendItem[];
  snapshot?: {
    scaleBarLabel?: string | null;
    northArrowBearing?: number | null;
    attributionText?: string;
    legendItems?: MapCompositionLegendItem[];
  } | null;
  title?: string;
  caveats?: string[];
  acknowledgedIssueIds?: string[] | undefined;
  requireTitle?: boolean;
  requireLegend?: boolean;
  requireScaleBar?: boolean;
  requireNorthArrow?: boolean;
  requireAttribution?: boolean;
  requireCaveats?: boolean;
  includeQaWarningCaveats?: boolean;
  now?: Date;
}

export interface MapPublicationManifest {
  manifestId: string;
  version: number;
  createdAt: string;
  title: string;
  format: MapPublicationExportFormat;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  visibleLayerIds: string[];
  visibleLayerNames: string[];
  legendItemCount: number;
  composition: {
    format: MapPublicationExportFormat;
    dpi: MapPublicationDpi;
    pageSize: MapPublicationPageSize;
    mapFit: MapCompositionMapFit;
    includeTitleBlock: boolean;
    includeScaleBar: boolean;
    includeNorthArrow: boolean;
    includeLegend: boolean;
    includeAttribution: boolean;
  };
  readiness: MapPublicationReadiness;
  caveats: string[];
  qaSignature?: string;
  traceability: MapPublicationManifestTraceability;
}

export interface MapPublicationManifestLayerTraceability {
  layerId: string;
  name: string;
  sourceKind: string;
  qaStatus: string;
  publicationReadinessStatus: string;
  provenanceLabel: string;
  featureCount: number | null;
  caveats: string[];
  qaIssueIds: string[];
  evidenceArtifactId?: string;
  crs?: string;
  sourceName?: string;
  license?: string;
  attribution?: string;
}

export interface MapPublicationManifestTraceability {
  bindingMode: "static-export";
  refreshMode: "static";
  isLive: false;
  liveStateLabel: string;
  sourceLayerIds: string[];
  evidenceArtifactIds: string[];
  layers: MapPublicationManifestLayerTraceability[];
  qa: {
    state: MapEvidenceQA["state"];
    issueIds: string[];
    blockerCount: number;
    warningCount: number;
    caveats: string[];
    checkedAt: string;
    signature?: string;
  };
  provenanceNotes: string[];
}

export interface MapCompositionLegendItem {
  label: string;
  color: string;
  secondaryLabel?: string;
  kind: "fill" | "line" | "circle" | "raster" | "heatmap";
}

export interface MapCompositionOptions {
  format: MapPublicationExportFormat;
  dpi: MapPublicationDpi;
  pageSize: MapPublicationPageSize;
  customWidthMm: number;
  customHeightMm: number;
  mapFit: MapCompositionMapFit;
  marginMm: number;
  title: string;
  subtitle: string;
  includeTitleBlock: boolean;
  titleFontSize: number;
  titlePosition: MapCompositionTitlePosition;
  includeScaleBar: boolean;
  scaleBarUnit: MapCompositionScaleUnit;
  scaleBarPosition: MapCompositionCornerPosition;
  includeNorthArrow: boolean;
  northArrowStyle: MapCompositionNorthArrowStyle;
  northArrowPosition: MapCompositionCornerPosition;
  includeLegend: boolean;
  legendPosition: MapCompositionCornerPosition;
  includeInsetMap: boolean;
  insetMapPosition: MapCompositionCornerPosition;
  includeAttribution: boolean;
  attributionPosition: MapCompositionAttributionPosition;
  attributionText: string;
  includeGraticule: boolean;
}

export const DEFAULT_MAP_COMPOSITION_OPTIONS: MapCompositionOptions = {
  format: "pdf",
  dpi: 300,
  pageSize: "a4",
  customWidthMm: 210,
  customHeightMm: 297,
  mapFit: "contain",
  marginMm: 12,
  title: "Urban Analytics Map",
  subtitle: "",
  includeTitleBlock: true,
  titleFontSize: 24,
  titlePosition: "top-center",
  includeScaleBar: true,
  scaleBarUnit: "metric",
  scaleBarPosition: "bottom-left",
  includeNorthArrow: true,
  northArrowStyle: "compass",
  northArrowPosition: "top-right",
  includeLegend: true,
  legendPosition: "bottom-right",
  includeInsetMap: true,
  insetMapPosition: "top-left",
  includeAttribution: true,
  attributionPosition: "bottom-left",
  attributionText: "Sources: visible map layers and project metadata. Scale is geodesic at map center.",
  includeGraticule: false,
};

export interface ScaleBarSpec {
  distanceMetres: number;
  measuredDistanceMetres: number;
  pixelWidthCss: number;
  label: string;
}

interface PublicationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PublicationLayoutPx {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  titleBlockHeight: number;
  footerHeight: number;
  mapFrame: PublicationRect;
}

interface MapCanvasCapture {
  dataUrl: string;
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
}

type JsPdfConstructor = new (options: {
  orientation: "portrait" | "landscape";
  unit: "mm";
  format: string | [number, number];
  compress?: boolean;
}) => {
  addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
  output: (type: "datauristring") => string;
  setFont?: (fontName: string, fontStyle?: string) => void;
  setFontSize?: (size: number) => void;
  setTextColor?: (r: number | string, g?: number, b?: number) => void;
  setDrawColor?: (r: number | string, g?: number, b?: number) => void;
  setFillColor?: (r: number | string, g?: number, b?: number) => void;
  setLineWidth?: (width: number) => void;
  rect?: (x: number, y: number, width: number, height: number, style?: "S" | "F" | "FD" | "DF") => void;
  line?: (x1: number, y1: number, x2: number, y2: number) => void;
  text?: (text: string | string[], x: number, y: number, options?: { align?: "left" | "center" | "right"; maxWidth?: number }) => void;
  setProperties?: (properties: { title?: string; subject?: string; creator?: string }) => void;
};

const DEFAULT_PREVIEW_WIDTH = 360;
export const MAP_PUBLICATION_MANIFEST_VERSION = 1;
const DOM_CAPTURE_BACKGROUND = "rgba(13,13,13,0.001)";
const TITLE_BAND_CSS_HEIGHT = 60;
const SCALE_BAR_MAX_WIDTH_CSS = 160;
const SCALE_BAR_MARGIN_CSS = 24;
const NORTH_ARROW_SIZE_CSS = 48;
const NORTH_ARROW_MARGIN_CSS = 24;
const MM_PER_INCH = 25.4;
const PAGE_DIMENSIONS_MM: Record<Exclude<MapPublicationPageSize, "custom">, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  letter: { width: 215.9, height: 279.4 },
};
export const A0_LANDSCAPE_PAGE_MM = { width: 1189, height: 841 } as const;
export const A0_SHEET_LAYOUT_MM = {
  margin: 18,
  titleBandHeight: 38,
  titleGap: 10,
  footerHeight: 24,
} as const;
export const A0_LEGEND_PANEL_MM = { width: 155, height: 68 } as const;
export const A0_NORTH_ARROW_PANEL_MM = { width: 26, height: 26 } as const;
const DEFAULT_LAYER_COLORS: Record<OverlayLayerConfig["type"], string> = {
  geojson: "#F59E0B",
  heatmap: "#EF4444",
  "raster-tile": "#38BDF8",
  "vector-tile": "#A78BFA",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function getResolutionScale(resolution: MapExportResolution): number {
  if (resolution === "print") return 2;
  if (resolution === "high") return 4;
  return 1;
}

export function getExportPixelRatio(
  resolution: MapExportResolution,
  screenPixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1,
): number {
  if (resolution === "screen") {
    return Number.isFinite(screenPixelRatio) && screenPixelRatio > 0 ? screenPixelRatio : 1;
  }
  return getResolutionScale(resolution);
}

export function getNorthArrowRotationRadians(bearingDegrees: number): number {
  const bearing = Number.isFinite(bearingDegrees) ? bearingDegrees : 0;
  if (bearing === 0) return 0;
  return (-bearing * Math.PI) / 180;
}

export function generateMapExportFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `map-export-${year}-${month}-${day}-${hours}${minutes}${seconds}.png`;
}

export function generateMapPublicationFilename(
  format: MapPublicationExportFormat,
  date = new Date(),
): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `map-composition-${year}-${month}-${day}-${hours}${minutes}${seconds}.${format}`;
}

export function generateMapOnlyA0LandscapeFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `map-a0-landscape-${year}-${month}-${day}-${hours}${minutes}${seconds}.pdf`;
}

export function getA0LegendPanelDimensionsPx(dpi: MapPublicationDpi = 300): { width: number; height: number } {
  return {
    width: Math.round((A0_LEGEND_PANEL_MM.width / MM_PER_INCH) * dpi),
    height: Math.round((A0_LEGEND_PANEL_MM.height / MM_PER_INCH) * dpi),
  };
}

export function getA0SheetMapAreaMm(): { x: number; y: number; width: number; height: number } {
  const x = A0_SHEET_LAYOUT_MM.margin;
  const y = A0_SHEET_LAYOUT_MM.margin + A0_SHEET_LAYOUT_MM.titleBandHeight + A0_SHEET_LAYOUT_MM.titleGap;
  return {
    x,
    y,
    width: A0_LANDSCAPE_PAGE_MM.width - A0_SHEET_LAYOUT_MM.margin * 2,
    height: A0_LANDSCAPE_PAGE_MM.height - y - A0_SHEET_LAYOUT_MM.margin - A0_SHEET_LAYOUT_MM.footerHeight,
  };
}

export function getA0SheetMapAspectRatio(): number {
  const mapArea = getA0SheetMapAreaMm();
  return mapArea.width / mapArea.height;
}

export function getA0SheetMapFrameMm(mapAspectRatio: number): { x: number; y: number; width: number; height: number } {
  const safeAspectRatio = Number.isFinite(mapAspectRatio) && mapAspectRatio > 0 ? mapAspectRatio : 16 / 9;
  const mapArea = getA0SheetMapAreaMm();
  const availableWidth = mapArea.width;
  const availableHeight = mapArea.height;
  let width = availableWidth;
  let height = width / safeAspectRatio;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * safeAspectRatio;
  }

  return {
    x: mapArea.x + (availableWidth - width) / 2,
    y: mapArea.y,
    width,
    height,
  };
}

export function mapDpiToResolution(dpi: MapPublicationDpi): MapExportResolution {
  if (dpi === 300) return "high";
  if (dpi === 150) return "print";
  return "screen";
}

export function getCompositionPageDimensionsMm(
  options: Pick<MapCompositionOptions, "pageSize" | "customWidthMm" | "customHeightMm">,
): { width: number; height: number } {
  if (options.pageSize !== "custom") {
    return PAGE_DIMENSIONS_MM[options.pageSize];
  }
  return {
    width: Math.max(80, Math.min(1_500, options.customWidthMm || DEFAULT_MAP_COMPOSITION_OPTIONS.customWidthMm)),
    height: Math.max(80, Math.min(1_500, options.customHeightMm || DEFAULT_MAP_COMPOSITION_OPTIONS.customHeightMm)),
  };
}

export function getCompositionPageDimensionsPx(
  options: Pick<MapCompositionOptions, "pageSize" | "customWidthMm" | "customHeightMm" | "dpi">,
): { width: number; height: number } {
  const dimensions = getCompositionPageDimensionsMm(options);
  return {
    width: Math.round((dimensions.width / MM_PER_INCH) * options.dpi),
    height: Math.round((dimensions.height / MM_PER_INCH) * options.dpi),
  };
}

export function getFittedMapImageRect(
  image: { width: number; height: number },
  frame: { x: number; y: number; width: number; height: number },
  fit: MapCompositionMapFit,
): { x: number; y: number; width: number; height: number } {
  if (image.width <= 0 || image.height <= 0 || frame.width <= 0 || frame.height <= 0) {
    return { ...frame };
  }

  const scale = fit === "cover"
    ? Math.max(frame.width / image.width, frame.height / image.height)
    : Math.min(frame.width / image.width, frame.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  return {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + (frame.height - height) / 2,
    width,
    height,
  };
}

function getCompositionMimeType(format: MapPublicationExportFormat): string {
  if (format === "pdf") return "application/pdf";
  if (format === "svg") return "image/svg+xml";
  return "image/png";
}

function normaliseCompositionOptions(options?: Partial<MapCompositionOptions> | null): MapCompositionOptions {
  return {
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
    ...(options ?? {}),
    titleFontSize: Math.max(12, Math.min(48, options?.titleFontSize ?? DEFAULT_MAP_COMPOSITION_OPTIONS.titleFontSize)),
    marginMm: Math.max(4, Math.min(40, options?.marginMm ?? DEFAULT_MAP_COMPOSITION_OPTIONS.marginMm)),
  };
}

function uniquePublicationTexts(values: Array<string | null | undefined>, limit = 12): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = value?.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function safeManifestPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "map";
}

function readinessCheck(input: {
  criterion: MapPublicationReadinessCriterion;
  label: string;
  status: MapPublicationReadinessSeverity;
  required: boolean;
  message: string;
  affectedLayerIds?: Array<string | null | undefined>;
  issueIds?: Array<string | null | undefined>;
  recommendedFix?: string | undefined;
}): MapPublicationReadinessCheck {
  const check: MapPublicationReadinessCheck = {
    criterion: input.criterion,
    label: input.label,
    status: input.status,
    required: input.required,
    message: input.message,
    affectedLayerIds: uniquePublicationTexts(input.affectedLayerIds ?? [], 24),
    issueIds: uniquePublicationTexts(input.issueIds ?? [], 24),
  };
  if (input.recommendedFix?.trim()) check.recommendedFix = input.recommendedFix.trim();
  return check;
}

function hasSnapshotScaleBar(input: MapPublicationReadinessInput): boolean {
  const label = input.snapshot?.scaleBarLabel;
  return typeof label === "string" && label.trim().length > 0;
}

function hasSnapshotNorthArrow(input: MapPublicationReadinessInput): boolean {
  return typeof input.snapshot?.northArrowBearing === "number" && Number.isFinite(input.snapshot.northArrowBearing);
}

function isBlockingQaSeverity(severity: string): boolean {
  return severity === "blocker" || severity === "error" || severity === "blocked";
}

export function buildMapPublicationReadiness(input: MapPublicationReadinessInput): MapPublicationReadiness {
  const checkedAt = (input.now ?? new Date()).toISOString();
  const composition = normaliseCompositionOptions(input.composition);
  const visibleLayers = input.overlayLayers.filter((layer) => layer.visible);
  const layerReadiness = visibleLayers.map((layer) => ({ layer, registry: normalizeLayerRegistryMetadata(layer) }));
  const legendItems = input.legendItems ?? input.snapshot?.legendItems ?? buildMapCompositionLegendItems(visibleLayers);
  const title = input.title ?? composition.title;
  const attributionText = input.snapshot?.attributionText ?? composition.attributionText;
  const acknowledgedIssueIds = uniquePublicationTexts(input.acknowledgedIssueIds ?? [], 48);
  const acknowledgedIssueSet = new Set(acknowledgedIssueIds);
  const requireTitle = input.requireTitle ?? true;
  const requireLegend = input.requireLegend ?? true;
  const requireScaleBar = input.requireScaleBar ?? true;
  const requireNorthArrow = input.requireNorthArrow ?? true;
  const requireAttribution = input.requireAttribution ?? true;
  const requireCaveats = input.requireCaveats ?? true;
  const includeQaWarningCaveats = input.includeQaWarningCaveats ?? true;

  const hasTitle = !requireTitle || (composition.includeTitleBlock && title.trim().length > 0);
  const hasLegend = !requireLegend || (composition.includeLegend && visibleLayers.length > 0 && legendItems.length > 0);
  const hasScaleBar = !requireScaleBar || composition.includeScaleBar || hasSnapshotScaleBar(input);
  const hasNorthArrow = !requireNorthArrow || composition.includeNorthArrow || hasSnapshotNorthArrow(input);
  const hasAttribution = !requireAttribution || (composition.includeAttribution && attributionText.trim().length > 0);

  const checks: MapPublicationReadinessCheck[] = [];
  checks.push(readinessCheck({
    criterion: "visible-layer",
    label: "Visible layer",
    status: visibleLayers.length > 0 ? "pass" : "blocked",
    required: true,
    message: visibleLayers.length > 0
      ? `${visibleLayers.length} visible layer${visibleLayers.length === 1 ? "" : "s"} will be included.`
      : "Show at least one overlay layer before creating a formal map output.",
    recommendedFix: visibleLayers.length > 0 ? undefined : "Enable a layer in the layer manager or publish a spatial result to the map.",
  }));
  checks.push(readinessCheck({
    criterion: "title",
    label: "Title",
    status: hasTitle ? "pass" : "blocked",
    required: requireTitle,
    message: hasTitle ? `Title recorded: ${title.trim()}.` : "A publication title is required.",
    recommendedFix: hasTitle ? undefined : "Enable the title block and enter a descriptive map title.",
  }));
  checks.push(readinessCheck({
    criterion: "legend",
    label: "Legend",
    status: hasLegend ? "pass" : "blocked",
    required: requireLegend,
    message: hasLegend
      ? `${legendItems.length} legend item${legendItems.length === 1 ? "" : "s"} will be included.`
      : "A formal map output needs a visible layer legend.",
    recommendedFix: hasLegend ? undefined : "Enable Auto legend and keep at least one visible layer with style metadata.",
  }));
  checks.push(readinessCheck({
    criterion: "scale-bar",
    label: "Scale bar",
    status: hasScaleBar ? "pass" : "blocked",
    required: requireScaleBar,
    message: hasScaleBar ? "Scale information is configured for the output." : "Scale information is missing from the output.",
    recommendedFix: hasScaleBar ? undefined : "Enable the scale bar before exporting or inserting the map.",
  }));
  checks.push(readinessCheck({
    criterion: "north-arrow",
    label: "North arrow",
    status: hasNorthArrow ? "pass" : "blocked",
    required: requireNorthArrow,
    message: hasNorthArrow ? "North arrow metadata is configured for the output." : "North arrow metadata is missing from the output.",
    recommendedFix: hasNorthArrow ? undefined : "Enable the north arrow or attach a snapshot bearing before publishing.",
  }));

  const missingAttributionLayerIds = layerReadiness
    .filter(({ registry }) => !registry.licenseAttribution.license && !registry.licenseAttribution.attribution)
    .map(({ layer }) => layer.id);
  checks.push(readinessCheck({
    criterion: "attribution-license",
    label: "Attribution and license",
    status: !hasAttribution
      ? "blocked"
      : missingAttributionLayerIds.length > 0
        ? "warning"
        : "pass",
    required: requireAttribution,
    message: !hasAttribution
      ? "Attribution text is required for formal map outputs."
      : missingAttributionLayerIds.length > 0
        ? `${missingAttributionLayerIds.length} visible layer${missingAttributionLayerIds.length === 1 ? "" : "s"} lack layer-level license or attribution metadata.`
        : "Attribution text and layer license metadata are available.",
    affectedLayerIds: missingAttributionLayerIds,
    recommendedFix: !hasAttribution
      ? "Enable Attribution and write source/license text."
      : missingAttributionLayerIds.length > 0
        ? "Attach source license or attribution metadata to each visible layer before external publication."
        : undefined,
  }));

  const registryBlockedLayerIds = layerReadiness
    .filter(({ registry }) => registry.publicationReadiness.status === "blocked")
    .map(({ layer }) => layer.id);
  const missingCrsLayerIds = layerReadiness
    .filter(({ registry }) => !registry.readiness.crsReady)
    .map(({ layer }) => layer.id);
  const geometryNotReadyLayerIds = layerReadiness
    .filter(({ registry }) => !registry.readiness.geometryReady)
    .map(({ layer }) => layer.id);
  const qaSpatialIssues = input.scientificQA?.issues.filter((issue) =>
    issue.category === "crs"
      || issue.category === "geometry"
      || issue.category === "geometry-type"
      || issue.category === "coordinates"
      || issue.category === "scale"
  ) ?? [];
  const blockingSpatialIssueIds = qaSpatialIssues
    .filter((issue) => isBlockingQaSeverity(issue.severity) && !acknowledgedIssueSet.has(issue.id))
    .map((issue) => issue.id);
  checks.push(readinessCheck({
    criterion: "crs-measurement",
    label: "CRS and measurement caveats",
    status: blockingSpatialIssueIds.length > 0
      ? "blocked"
      : missingCrsLayerIds.length > 0 || geometryNotReadyLayerIds.length > 0 || qaSpatialIssues.length > 0
        ? "warning"
        : "pass",
    required: true,
    message: blockingSpatialIssueIds.length > 0
      ? "CRS, geometry, or scale QA blockers must be resolved or explicitly acknowledged."
      : missingCrsLayerIds.length > 0
        ? `${missingCrsLayerIds.length} visible layer${missingCrsLayerIds.length === 1 ? "" : "s"} have unknown CRS readiness.`
        : geometryNotReadyLayerIds.length > 0
          ? `${geometryNotReadyLayerIds.length} visible layer${geometryNotReadyLayerIds.length === 1 ? "" : "s"} have unknown or invalid geometry readiness.`
        : qaSpatialIssues.length > 0
          ? "Spatial QA warnings are present and will travel as caveats."
          : "No CRS or measurement publication caveat was detected.",
    affectedLayerIds: uniquePublicationTexts([
      ...missingCrsLayerIds,
      ...geometryNotReadyLayerIds,
      ...qaSpatialIssues.map((issue) => issue.layerId),
    ], 24),
    issueIds: blockingSpatialIssueIds,
    recommendedFix: blockingSpatialIssueIds.length > 0 || missingCrsLayerIds.length > 0 || geometryNotReadyLayerIds.length > 0
      ? "Run Scientific QA, attach verified CRS metadata, repair invalid geometry, and acknowledge any remaining measurement caveats."
      : undefined,
  }));

  const qaBlockerIssues = input.scientificQA?.issues.filter((issue) => issue.severity === "blocker" || issue.severity === "error") ?? [];
  const unacknowledgedQaBlockers = qaBlockerIssues.filter((issue) => !acknowledgedIssueSet.has(issue.id));
  const exportReadinessSummary = input.scientificQA?.metadata.categorySummaries?.find((summary) => summary.category === "export-readiness");
  const exportReadinessBlocked = exportReadinessSummary?.severity === "blocked" && exportReadinessSummary.issueIds.some((issueId) => !acknowledgedIssueSet.has(issueId));
  const qaWarningCount = includeQaWarningCaveats
    ? input.scientificQA?.issues.filter((issue) => issue.severity === "warning").length ?? 0
    : 0;
  checks.push(readinessCheck({
    criterion: "qa-blockers",
    label: "Scientific QA blockers",
    status: unacknowledgedQaBlockers.length > 0 || exportReadinessBlocked
      ? "blocked"
      : input.scientificQA == null
        ? "warning"
        : qaWarningCount > 0 || (exportReadinessSummary && exportReadinessSummary.severity !== "pass")
          ? "warning"
          : "pass",
    required: true,
    message: unacknowledgedQaBlockers.length > 0 || exportReadinessBlocked
      ? "Scientific QA blockers are present and have not been explicitly acknowledged."
      : input.scientificQA == null
        ? "Scientific QA has not run for the current map state; export will carry an unchecked QA caveat."
        : qaWarningCount > 0 || (exportReadinessSummary && exportReadinessSummary.severity !== "pass")
          ? "Scientific QA warnings are present and will be included as caveats."
          : "Scientific QA has no blocker for this formal output.",
    affectedLayerIds: uniquePublicationTexts([
      ...qaBlockerIssues.map((issue) => issue.layerId),
      ...(exportReadinessSummary?.affectedLayerIds ?? []),
      ...registryBlockedLayerIds,
    ], 24),
    issueIds: uniquePublicationTexts([
      ...unacknowledgedQaBlockers.map((issue) => issue.id),
      ...(exportReadinessBlocked ? exportReadinessSummary?.issueIds ?? [] : []),
      ...layerReadiness.flatMap(({ registry }) => registry.publicationReadiness.blockingIssueIds),
    ], 24),
    recommendedFix: unacknowledgedQaBlockers.length > 0 || exportReadinessBlocked
      ? "Resolve QA blockers or record an explicit review acknowledgment before formal output."
      : undefined,
  }));

  const generatedCaveats = uniquePublicationTexts([
    ...(input.caveats ?? []),
    ...layerReadiness.flatMap(({ layer, registry }) => registry.publicationReadiness.caveats.map((caveat) => `${layer.name}: ${caveat}`)),
    ...layerReadiness.flatMap(({ layer, registry }) => registry.publicationReadiness.missingFields.map((field) => `${layer.name}: missing ${field} metadata.`)),
    ...layerReadiness.flatMap(({ layer, registry }) => registry.readiness.missingFields.map((field) => `${layer.name}: missing ${field} readiness.`)),
    ...(input.scientificQA?.issues
      .filter((issue) => issue.severity !== "info" && (includeQaWarningCaveats || issue.severity === "error" || issue.severity === "blocker"))
      .map((issue) => `${issue.title}${issue.layerName ? ` (${issue.layerName})` : ""}: ${issue.explanation}`) ?? []),
    ...checks.filter((check) => check.status !== "pass").map((check) => check.message),
  ], 16);
  const hasCaveats = !requireCaveats || generatedCaveats.length > 0 || checks.every((check) => check.status === "pass");
  checks.push(readinessCheck({
    criterion: "caveats",
    label: "Caveats",
    status: hasCaveats ? (generatedCaveats.length > 0 ? "warning" : "pass") : "blocked",
    required: requireCaveats,
    message: generatedCaveats.length > 0
      ? `${generatedCaveats.length} caveat${generatedCaveats.length === 1 ? "" : "s"} will be carried with the output.`
      : hasCaveats
        ? "No caveat is required for this output state."
        : "Warnings or blockers must be recorded as caveats before formal output.",
    recommendedFix: hasCaveats ? undefined : "Keep QA and source caveats enabled in the output manifest or report handoff.",
  }));

  const blockers = checks.filter((check) => check.status === "blocked");
  const warnings = checks.filter((check) => check.status === "warning");
  const status: MapPublicationReadinessStatus = blockers.length > 0
    ? "blocked"
    : warnings.length > 0
      ? "ready-with-caveats"
      : "ready";

  return {
    id: `map-publication-readiness-${safeManifestPart(`${input.mode}-${checkedAt}-${visibleLayers.map((layer) => layer.id).join("-")}`)}`,
    status,
    mode: input.mode,
    checkedAt,
    visibleLayerCount: visibleLayers.length,
    hasTitle,
    hasLegend,
    hasScaleBar,
    hasNorthArrow,
    hasAttribution,
    qaBlockingIssueCount: qaBlockerIssues.length,
    caveats: generatedCaveats,
    blockers,
    warnings,
    checks,
    acknowledgedIssueIds,
  };
}

function buildMapPublicationManifestTraceability(input: {
  visibleLayers: OverlayLayerConfig[];
  readiness: MapPublicationReadiness;
  scientificQA?: MapScientificQAState | null | undefined;
}): MapPublicationManifestTraceability {
  const evidenceArtifactIds: string[] = [];
  const sourceLayerIds = input.visibleLayers.map((layer) => layer.id);
  const layerTraceability = input.visibleLayers.map((layer): MapPublicationManifestLayerTraceability => {
    const registry = normalizeLayerRegistryMetadata(layer);
    const scientificQA = layer.metadata?.scientificQA;
    const caveats = uniquePublicationTexts([
      ...registry.publicationReadiness.caveats,
      ...(scientificQA?.caveats ?? []),
      ...(layer.metadata?.analysisResult?.caveats ?? []),
    ], 12);
    const qaIssueIds = uniquePublicationTexts([
      ...registry.publicationReadiness.blockingIssueIds,
      ...(scientificQA?.issueIds ?? []),
    ], 24);
    if (registry.evidenceArtifactId) evidenceArtifactIds.push(registry.evidenceArtifactId);
    if (layer.metadata?.evidenceArtifactId) evidenceArtifactIds.push(layer.metadata.evidenceArtifactId);
    if (layer.metadata?.analysisResult?.evidenceArtifactId) evidenceArtifactIds.push(layer.metadata.analysisResult.evidenceArtifactId);

    const traceability: MapPublicationManifestLayerTraceability = {
      layerId: layer.id,
      name: layer.name,
      sourceKind: registry.sourceKind,
      qaStatus: registry.qaStatus,
      publicationReadinessStatus: registry.publicationReadiness.status,
      provenanceLabel: registry.provenance.label,
      featureCount: registry.geometrySummary.featureCount,
      caveats,
      qaIssueIds,
    };
    if (registry.evidenceArtifactId) traceability.evidenceArtifactId = registry.evidenceArtifactId;
    if (registry.crsSummary.crs) traceability.crs = registry.crsSummary.crs;
    if (registry.provenance.sourceName) traceability.sourceName = registry.provenance.sourceName;
    if (registry.provenance.license) traceability.license = registry.provenance.license;
    if (registry.provenance.attribution) traceability.attribution = registry.provenance.attribution;
    return traceability;
  });
  const qa = mapPublicationReadinessToEvidenceQA(input.readiness);
  const provenanceNotes = uniquePublicationTexts([
    "Publication manifest describes a static export; it does not claim a live dashboard binding.",
    "Layer provenance, QA caveats, and evidence IDs are carried as lightweight metadata only.",
    ...layerTraceability.map((layer) => `${layer.name}: ${layer.provenanceLabel}`),
  ], 12);

  return {
    bindingMode: "static-export",
    refreshMode: "static",
    isLive: false,
    liveStateLabel: "Static publication export; regenerate the export after source map state changes.",
    sourceLayerIds,
    evidenceArtifactIds: uniquePublicationTexts(evidenceArtifactIds, 80),
    layers: layerTraceability,
    qa: {
      state: qa.state,
      issueIds: qa.issueIds,
      blockerCount: qa.blockerCount,
      warningCount: input.readiness.warnings.length,
      caveats: qa.caveats,
      checkedAt: input.readiness.checkedAt,
      ...(input.scientificQA?.metadata.signature ? { signature: input.scientificQA.metadata.signature } : {}),
    },
    provenanceNotes,
  };
}

export function buildMapPublicationManifest(input: {
  result: Pick<MapPublicationExportResult, "filename" | "format" | "mimeType" | "width" | "height">;
  composition: MapCompositionOptions;
  overlayLayers: OverlayLayerConfig[];
  legendItems: MapCompositionLegendItem[];
  readiness: MapPublicationReadiness;
  scientificQA?: MapScientificQAState | null | undefined;
  createdAt?: string;
}): MapPublicationManifest {
  const createdAt = input.createdAt ?? input.readiness.checkedAt;
  const visibleLayers = input.overlayLayers.filter((layer) => layer.visible);
  const manifest: MapPublicationManifest = {
    manifestId: `map-publication-manifest-${safeManifestPart(`${input.result.filename}-${createdAt}`)}`,
    version: MAP_PUBLICATION_MANIFEST_VERSION,
    createdAt,
    title: input.composition.title.trim() || "Untitled map publication",
    format: input.result.format,
    filename: input.result.filename,
    mimeType: input.result.mimeType,
    width: input.result.width,
    height: input.result.height,
    visibleLayerIds: visibleLayers.map((layer) => layer.id),
    visibleLayerNames: visibleLayers.map((layer) => layer.name),
    legendItemCount: input.legendItems.length,
    composition: {
      format: input.composition.format,
      dpi: input.composition.dpi,
      pageSize: input.composition.pageSize,
      mapFit: input.composition.mapFit,
      includeTitleBlock: input.composition.includeTitleBlock,
      includeScaleBar: input.composition.includeScaleBar,
      includeNorthArrow: input.composition.includeNorthArrow,
      includeLegend: input.composition.includeLegend,
      includeAttribution: input.composition.includeAttribution,
    },
    readiness: input.readiness,
    caveats: input.readiness.caveats,
    traceability: buildMapPublicationManifestTraceability({
      visibleLayers,
      readiness: input.readiness,
      scientificQA: input.scientificQA,
    }),
  };
  if (input.scientificQA?.metadata.signature) manifest.qaSignature = input.scientificQA.metadata.signature;
  return manifest;
}

export function mapPublicationReadinessToEvidenceQA(readiness: MapPublicationReadiness): MapEvidenceQA {
  const issueIds = uniquePublicationTexts(readiness.checks.flatMap((check) => check.issueIds), 48);
  return {
    state: readiness.status === "blocked" ? "blocked" : readiness.status === "ready-with-caveats" ? "warning" : "passed",
    issueIds,
    issueCount: readiness.blockers.length + readiness.warnings.length,
    blockerCount: readiness.blockers.length,
    caveats: readiness.caveats,
    checkedAt: readiness.checkedAt,
  };
}

function colorFromUnknown(value: unknown, fallback: string): string {
  if (typeof value === "string" && (/^#[0-9a-f]{3,8}$/i.test(value) || value.startsWith("rgb"))) {
    return value;
  }
  return fallback;
}

function labelFromUnknown(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function legendItemsFromLayerStyle(layer: OverlayLayerConfig): MapCompositionLegendItem[] {
  const style = layer.style ?? {};
  const explicitLegend = style.legendEntries ?? style.legend ?? style.classes;
  if (!Array.isArray(explicitLegend)) return [];

  return explicitLegend
    .map((entry, index): MapCompositionLegendItem | null => {
      if (entry == null || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const color = colorFromUnknown(record.color ?? record.fill ?? record.fillColor ?? record.stroke, DEFAULT_LAYER_COLORS[layer.type]);
      const label = labelFromUnknown(record.label ?? record.name ?? record.range, `${layer.name} class ${index + 1}`);
      return {
        label,
        color,
        secondaryLabel: layer.name,
        kind: layer.type === "heatmap" ? "heatmap" : layer.type === "raster-tile" ? "raster" : "fill",
      };
    })
    .filter((entry): entry is MapCompositionLegendItem => entry != null);
}

function legendItemsFromAnalysisVisualization(layer: OverlayLayerConfig): MapCompositionLegendItem[] {
  const visualization = layer.metadata?.analysisResult?.visualization;
  if (!visualization || typeof visualization !== "object") return [];
  const record = visualization as unknown as Record<string, unknown>;
  const legend = record.legend ?? record.classes ?? record.bins;
  if (!Array.isArray(legend)) return [];

  return legend
    .map((entry, index): MapCompositionLegendItem | null => {
      if (entry == null || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      return {
        label: labelFromUnknown(item.label ?? item.name ?? item.range, `${layer.name} class ${index + 1}`),
        color: colorFromUnknown(item.color ?? item.fill ?? item.stroke, DEFAULT_LAYER_COLORS[layer.type]),
        secondaryLabel: layer.name,
        kind: layer.type === "heatmap" ? "heatmap" : "fill",
      };
    })
    .filter((entry): entry is MapCompositionLegendItem => entry != null);
}

export function buildMapCompositionLegendItems(layers: OverlayLayerConfig[]): MapCompositionLegendItem[] {
  const visibleLayers = layers.filter((layer) => layer.visible);
  return visibleLayers.flatMap((layer) => {
    const styledItems = legendItemsFromLayerStyle(layer);
    if (styledItems.length > 0) return styledItems;
    const visualizationItems = legendItemsFromAnalysisVisualization(layer);
    if (visualizationItems.length > 0) return visualizationItems;

    const geometryType = layer.metadata?.geometryType ? ` (${layer.metadata.geometryType})` : "";
    const fallbackItem: MapCompositionLegendItem = {
      label: `${layer.name}${geometryType}`,
      color: colorFromUnknown(layer.style?.color ?? layer.style?.fillColor ?? layer.style?.circleColor ?? layer.style?.lineColor, DEFAULT_LAYER_COLORS[layer.type]),
      kind: layer.type === "heatmap"
        ? "heatmap"
        : layer.type === "raster-tile" || layer.type === "vector-tile"
          ? "raster"
          : layer.metadata?.geometryType === "Point"
            ? "circle"
            : layer.metadata?.geometryType === "LineString"
              ? "line"
              : "fill",
    };
    const secondaryLabel = layer.provenance?.sourceName ?? layer.sourceKind;
    if (secondaryLabel) {
      fallbackItem.secondaryLabel = secondaryLabel;
    }
    return [fallbackItem];
  }).slice(0, 18);
}

export function formatScaleBarLabel(distanceMetres: number): string {
  if (distanceMetres >= 1000) {
    const kilometres = distanceMetres / 1000;
    return Number.isInteger(kilometres) ? `${kilometres} km` : `${kilometres.toFixed(1)} km`;
  }
  return `${Math.round(distanceMetres)} m`;
}

function formatScaleBarLabelForUnit(distanceMetres: number, unit: MapCompositionScaleUnit): string {
  if (unit === "metric") return formatScaleBarLabel(distanceMetres);
  const feet = distanceMetres * 3.28084;
  if (feet >= 5_280) {
    const miles = feet / 5_280;
    return `${miles.toFixed(miles >= 10 ? 0 : 1)} mi`;
  }
  return `${Math.round(feet)} ft`;
}

export function chooseScaleBarDistance(maxDistanceMetres: number): number {
  if (!Number.isFinite(maxDistanceMetres) || maxDistanceMetres <= 0) return 0;
  const exponent = Math.floor(Math.log10(maxDistanceMetres));
  const base = 10 ** exponent;
  const candidates = [1, 2, 5].map((step) => step * base);
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    if (candidates[index] <= maxDistanceMetres) {
      return candidates[index];
    }
  }
  return base / 2;
}

export function calculateScaleBarSpec(
  map: Pick<maplibregl.Map, "getContainer" | "unproject">,
  maxWidthCss = SCALE_BAR_MAX_WIDTH_CSS,
): ScaleBarSpec | null {
  const rect = map.getContainer().getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const sampleWidthCss = Math.max(80, Math.min(maxWidthCss, rect.width * 0.22));
  const centerX = rect.width / 2;
  const sampleY = rect.height / 2;
  const start = map.unproject([centerX - sampleWidthCss / 2, sampleY]);
  const end = map.unproject([centerX + sampleWidthCss / 2, sampleY]);
  const measuredDistanceMetres = haversineDistance([start.lng, start.lat], [end.lng, end.lat]);

  if (!Number.isFinite(measuredDistanceMetres) || measuredDistanceMetres <= 0) {
    return null;
  }

  const distanceMetres = chooseScaleBarDistance(measuredDistanceMetres);
  const pixelWidthCss = sampleWidthCss * (distanceMetres / measuredDistanceMetres);

  return {
    distanceMetres,
    measuredDistanceMetres,
    pixelWidthCss,
    label: formatScaleBarLabel(distanceMetres),
  };
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

async function waitForFonts(): Promise<void> {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness failures; raster export still works with fallback fonts.
    }
  }
}

async function waitForMapSettled(map: maplibregl.Map, timeoutMs = 1200): Promise<void> {
  await new Promise<void>((resolve) => {
    let done = false;
    const timeoutId = window.setTimeout(() => {
      if (done) return;
      done = true;
      map.off("idle", handleIdle);
      resolve();
    }, timeoutMs);

    const handleIdle = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeoutId);
      map.off("idle", handleIdle);
      resolve();
    };

    map.on("idle", handleIdle);
    map.triggerRepaint();
  });

  await waitForNextFrame();
}

function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to decode exported map image."));
    image.src = dataUrl;
  });
}

function copyFormState(source: HTMLElement, clone: HTMLElement): void {
  const sourceControls = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );
  const cloneControls = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );

  sourceControls.forEach((control, index) => {
    const clonedControl = cloneControls[index];
    if (!clonedControl) return;

    if (control instanceof HTMLInputElement) {
      clonedControl.setAttribute("value", control.value);
      if (control.checked) clonedControl.setAttribute("checked", "checked");
    } else if (control instanceof HTMLTextAreaElement) {
      clonedControl.textContent = control.value;
    } else if (control instanceof HTMLSelectElement && clonedControl instanceof HTMLSelectElement) {
      clonedControl.setAttribute("value", control.value);
      Array.from(clonedControl.options).forEach((option: HTMLOptionElement) => {
        option.selected = option.value === control.value;
      });
    }
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

async function rasterizeElement(
  element: HTMLElement,
  scale: number,
): Promise<{ image: HTMLImageElement; width: number; height: number } | null> {
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width <= 0 || height <= 0) return null;

  await waitForFonts();

  const clone = element.cloneNode(true) as HTMLElement;
  copyFormState(element, clone);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.setAttribute(
    "style",
    [
      `width:${width}px`,
      `height:${height}px`,
      `transform:scale(${scale})`,
      "transform-origin:top left",
      `background:${DOM_CAPTURE_BACKGROUND}`,
    ].join(";"),
  );
  wrapper.appendChild(clone);

  const serialized = new XMLSerializer().serializeToString(wrapper);
  const svgMarkup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width * scale)}" height="${Math.round(height * scale)}">`,
    `<foreignObject width="100%" height="100%">`,
    serialized,
    "</foreignObject>",
    "</svg>",
  ].join("");

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  const image = await dataUrlToImage(dataUrl);
  return {
    image,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function createNorthArrowSvg(size: number): string {
  const amber = escapeXml(MAP_COLORS.amber);
  const text = escapeXml(MAP_COLORS.text);
  const fontFamily = escapeXml(MAP_TYPOGRAPHY.fontFamilyBrand);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">`,
    '<circle cx="32" cy="32" r="30" fill="rgba(13,13,13,0.82)" stroke="rgba(245,158,11,0.4)" stroke-width="2"/>',
    `<text x="32" y="16" text-anchor="middle" fill="${text}" font-size="11" font-family="${fontFamily}" font-weight="600">N</text>`,
    `<path d="M32 17 L39 38 L32 33 L25 38 Z" fill="${amber}" stroke="${amber}" stroke-linejoin="round"/>`,
    `<path d="M32 47 L25 30 L32 35 L39 30 Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.22)" stroke-linejoin="round"/>`,
    `<path d="M32 18 L32 48" stroke="${amber}" stroke-width="2.5" stroke-linecap="round"/>`,
    "</svg>",
  ].join("");
}

async function drawNorthArrow(
  context: CanvasRenderingContext2D,
  bearingDegrees: number,
  canvasWidth: number,
  mapTop: number,
  pixelScale: number,
): Promise<void> {
  const size = Math.round(NORTH_ARROW_SIZE_CSS * pixelScale);
  const margin = Math.round(NORTH_ARROW_MARGIN_CSS * pixelScale);
  const centerX = canvasWidth - margin - size / 2;
  const centerY = mapTop + margin + size / 2;
  const arrowImage = await dataUrlToImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createNorthArrowSvg(size))}`,
  );

  context.save();
  context.translate(centerX, centerY);
  context.rotate(getNorthArrowRotationRadians(bearingDegrees));
  context.drawImage(arrowImage, -size / 2, -size / 2, size, size);
  context.restore();
}

type PixelRatioOverrideState = {
  overridePixelRatio?: number | null;
};

function getMapPixelRatio(map: maplibregl.Map): number {
  const current = typeof map.getPixelRatio === "function"
    ? map.getPixelRatio()
    : typeof window !== "undefined"
      ? window.devicePixelRatio
      : 1;
  return Number.isFinite(current) && current > 0 ? current : 1;
}

function getMapPixelRatioOverride(map: maplibregl.Map): number | null | undefined {
  return (map as unknown as PixelRatioOverrideState & { _overridePixelRatio?: number | null })._overridePixelRatio;
}

function restoreMapPixelRatio(
  map: maplibregl.Map,
  originalOverride: number | null | undefined,
  originalPixelRatio: number,
): void {
  if (typeof map.setPixelRatio !== "function") return;
  if (originalOverride === undefined) {
    map.setPixelRatio(originalPixelRatio);
    return;
  }
  map.setPixelRatio(originalOverride as number);
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawScaleBar(
  context: CanvasRenderingContext2D,
  spec: ScaleBarSpec,
  mapTop: number,
  mapHeight: number,
  pixelScale: number,
): void {
  const margin = Math.round(SCALE_BAR_MARGIN_CSS * pixelScale);
  const barWidth = Math.round(spec.pixelWidthCss * pixelScale);
  const tickHeight = Math.max(10, Math.round(12 * pixelScale));
  const panelPaddingX = Math.max(12, Math.round(14 * pixelScale));
  const panelPaddingY = Math.max(8, Math.round(10 * pixelScale));
  const labelFont = Math.max(12, Math.round(12 * pixelScale));
  const labelGap = Math.max(8, Math.round(8 * pixelScale));
  const panelWidth = barWidth + panelPaddingX * 2;
  const panelHeight = labelFont + labelGap + tickHeight + panelPaddingY * 2;
  const panelX = margin;
  const panelY = mapTop + mapHeight - margin - panelHeight;
  const barX = panelX + panelPaddingX;
  const labelY = panelY + panelPaddingY + labelFont * 0.8;
  const baselineY = panelY + panelHeight - panelPaddingY;

  context.save();
  context.fillStyle = "rgba(13,13,13,0.82)";
  context.strokeStyle = "rgba(245,158,11,0.35)";
  context.lineWidth = Math.max(1, Math.round(pixelScale));
  drawRoundedRect(context, panelX, panelY, panelWidth, panelHeight, Math.round(8 * pixelScale));
  context.fill();
  context.stroke();

  context.fillStyle = MAP_COLORS.text;
  context.font = `${Math.max(11, Math.round(12 * pixelScale))}px ${MAP_TYPOGRAPHY.fontFamily}`;
  context.fillText(spec.label, barX, labelY);

  context.strokeStyle = DESIGN_TOKENS.colors.neutral[50];
  context.lineWidth = Math.max(2, Math.round(2 * pixelScale));
  context.beginPath();
  context.moveTo(barX, baselineY);
  context.lineTo(barX + barWidth, baselineY);
  context.moveTo(barX, baselineY);
  context.lineTo(barX, baselineY - tickHeight);
  context.moveTo(barX + barWidth, baselineY);
  context.lineTo(barX + barWidth, baselineY - tickHeight);
  context.stroke();
  context.restore();
}

function getPublicationLayout(options: MapCompositionOptions): PublicationLayoutPx {
  const page = getCompositionPageDimensionsPx(options);
  const margin = Math.round((options.marginMm / MM_PER_INCH) * options.dpi);
  const hasTitle = options.includeTitleBlock && (options.title.trim().length > 0 || options.subtitle.trim().length > 0);
  const titleBlockHeight = hasTitle
    ? Math.round(Math.max(54, options.titleFontSize + (options.subtitle.trim() ? 26 : 10)) * (options.dpi / 72))
    : Math.round(18 * (options.dpi / 72));
  const footerHeight = options.includeAttribution
    ? Math.round(34 * (options.dpi / 72))
    : Math.round(16 * (options.dpi / 72));
  const mapFrame = {
    x: margin,
    y: margin + titleBlockHeight,
    width: Math.max(80, page.width - margin * 2),
    height: Math.max(80, page.height - margin * 2 - titleBlockHeight - footerHeight),
  };

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    margin,
    titleBlockHeight,
    footerHeight,
    mapFrame,
  };
}

function getCornerOrigin(
  frame: PublicationRect,
  position: MapCompositionCornerPosition,
  width: number,
  height: number,
  inset: number,
): { x: number; y: number } {
  const left = position.endsWith("left") ? frame.x + inset : frame.x + frame.width - inset - width;
  const top = position.startsWith("top") ? frame.y + inset : frame.y + frame.height - inset - height;
  return { x: left, y: top };
}

function drawPublicationTitle(
  context: CanvasRenderingContext2D,
  options: MapCompositionOptions,
  layout: PublicationLayoutPx,
): void {
  const title = options.title.trim();
  const subtitle = options.subtitle.trim();
  if (!options.includeTitleBlock) return;
  if (!title && !subtitle) return;

  const titleSize = Math.round(options.titleFontSize * (options.dpi / 72));
  const subtitleSize = Math.max(11, Math.round(12 * (options.dpi / 72)));
  const left = layout.margin;
  const right = layout.pageWidth - layout.margin;
  const center = layout.pageWidth / 2;
  const textX = options.titlePosition === "top-left"
    ? left
    : options.titlePosition === "top-right"
      ? right
      : center;
  const align: CanvasTextAlign = options.titlePosition === "top-left"
    ? "left"
    : options.titlePosition === "top-right"
      ? "right"
      : "center";

  context.save();
  context.textAlign = align;
  context.textBaseline = "top";
  if (title) {
    context.fillStyle = "#111827";
    context.font = `700 ${titleSize}px ${MAP_TYPOGRAPHY.fontFamilyBrand}`;
    context.fillText(title, textX, layout.margin, layout.pageWidth - layout.margin * 2);
  }
  if (subtitle) {
    context.fillStyle = "#4B5563";
    context.font = `400 ${subtitleSize}px ${MAP_TYPOGRAPHY.fontFamily}`;
    context.fillText(subtitle, textX, layout.margin + titleSize + Math.round(6 * (options.dpi / 72)), layout.pageWidth - layout.margin * 2);
  }
  context.restore();
}

function drawPublicationGraticule(
  context: CanvasRenderingContext2D,
  map: maplibregl.Map,
  frame: PublicationRect,
): void {
  const topLeft = map.unproject([0, 0]);
  const bottomRight = map.unproject([
    map.getContainer().getBoundingClientRect().width,
    map.getContainer().getBoundingClientRect().height,
  ]);
  const minLng = Math.min(topLeft.lng, bottomRight.lng);
  const maxLng = Math.max(topLeft.lng, bottomRight.lng);
  const minLat = Math.min(topLeft.lat, bottomRight.lat);
  const maxLat = Math.max(topLeft.lat, bottomRight.lat);

  context.save();
  context.strokeStyle = "rgba(17,24,39,0.25)";
  context.fillStyle = "rgba(17,24,39,0.75)";
  context.lineWidth = 1;
  context.font = "10px sans-serif";

  for (let index = 1; index <= 4; index += 1) {
    const x = frame.x + (frame.width / 5) * index;
    const longitude = minLng + ((maxLng - minLng) / 5) * index;
    context.beginPath();
    context.moveTo(x, frame.y);
    context.lineTo(x, frame.y + frame.height);
    context.stroke();
    context.fillText(`${longitude.toFixed(2)}°`, x + 4, frame.y + 14);
  }

  for (let index = 1; index <= 4; index += 1) {
    const y = frame.y + (frame.height / 5) * index;
    const latitude = maxLat - ((maxLat - minLat) / 5) * index;
    context.beginPath();
    context.moveTo(frame.x, y);
    context.lineTo(frame.x + frame.width, y);
    context.stroke();
    context.fillText(`${latitude.toFixed(2)}°`, frame.x + 6, y - 4);
  }
  context.restore();
}

function drawPublicationLegend(
  context: CanvasRenderingContext2D,
  items: MapCompositionLegendItem[],
  options: MapCompositionOptions,
  frame: PublicationRect,
  renderOptions: { includeText?: boolean } = {},
): void {
  if (!options.includeLegend || items.length === 0) return;
  const includeText = renderOptions.includeText !== false;
  const scale = options.dpi / 72;
  const width = Math.round(178 * scale);
  const rowHeight = Math.round(18 * scale);
  const headerHeight = Math.round(22 * scale);
  const height = Math.min(Math.round(260 * scale), headerHeight + items.length * rowHeight + Math.round(16 * scale));
  const inset = Math.round(14 * scale);
  const origin = getCornerOrigin(frame, options.legendPosition, width, height, inset);

  context.save();
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.strokeStyle = "rgba(17,24,39,0.28)";
  context.lineWidth = Math.max(1, Math.round(scale));
  drawRoundedRect(context, origin.x, origin.y, width, height, Math.round(7 * scale));
  context.fill();
  context.stroke();

  if (includeText) {
    context.fillStyle = "#111827";
    context.font = `700 ${Math.round(11 * scale)}px ${MAP_TYPOGRAPHY.fontFamilyBrand}`;
    context.fillText("Legend", origin.x + Math.round(10 * scale), origin.y + Math.round(15 * scale));
  }

  context.font = `400 ${Math.round(9 * scale)}px ${MAP_TYPOGRAPHY.fontFamily}`;
  items.slice(0, 12).forEach((item, index) => {
    const rowY = origin.y + headerHeight + index * rowHeight;
    const swatchX = origin.x + Math.round(10 * scale);
    const swatchY = rowY + Math.round(5 * scale);
    context.fillStyle = item.color;
    if (item.kind === "line") {
      context.strokeStyle = item.color;
      context.lineWidth = Math.max(2, Math.round(2 * scale));
      context.beginPath();
      context.moveTo(swatchX, swatchY + Math.round(5 * scale));
      context.lineTo(swatchX + Math.round(18 * scale), swatchY + Math.round(5 * scale));
      context.stroke();
    } else if (item.kind === "circle") {
      context.beginPath();
      context.arc(swatchX + Math.round(7 * scale), swatchY + Math.round(6 * scale), Math.round(5 * scale), 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(swatchX, swatchY, Math.round(16 * scale), Math.round(10 * scale));
    }
    if (includeText) {
      context.fillStyle = "#1F2937";
      context.fillText(item.label, origin.x + Math.round(34 * scale), rowY + Math.round(14 * scale), width - Math.round(42 * scale));
    }
  });
  context.restore();
}

function drawPublicationScaleBar(
  context: CanvasRenderingContext2D,
  spec: ScaleBarSpec,
  options: MapCompositionOptions,
  frame: PublicationRect,
): void {
  const scale = options.dpi / 72;
  const imperialDistance = spec.distanceMetres * 3.28084;
  const label = options.scaleBarUnit === "imperial"
    ? imperialDistance >= 5_280
      ? `${(imperialDistance / 5_280).toFixed(imperialDistance >= 52_800 ? 0 : 1)} mi`
      : `${Math.round(imperialDistance)} ft`
    : spec.label;
  const width = Math.round(Math.max(72 * scale, spec.pixelWidthCss * scale));
  const height = Math.round(38 * scale);
  const inset = Math.round(16 * scale);
  const origin = getCornerOrigin(frame, options.scaleBarPosition, width + Math.round(28 * scale), height, inset);
  const barX = origin.x + Math.round(14 * scale);
  const baselineY = origin.y + Math.round(24 * scale);

  context.save();
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.strokeStyle = "rgba(17,24,39,0.35)";
  drawRoundedRect(context, origin.x, origin.y, width + Math.round(28 * scale), height, Math.round(7 * scale));
  context.fill();
  context.stroke();

  context.strokeStyle = "#111827";
  context.lineWidth = Math.max(2, Math.round(2 * scale));
  context.beginPath();
  context.moveTo(barX, baselineY);
  context.lineTo(barX + width, baselineY);
  context.moveTo(barX, baselineY);
  context.lineTo(barX, baselineY - Math.round(10 * scale));
  context.moveTo(barX + width, baselineY);
  context.lineTo(barX + width, baselineY - Math.round(10 * scale));
  context.stroke();
  context.fillStyle = "#111827";
  context.font = `600 ${Math.round(10 * scale)}px ${MAP_TYPOGRAPHY.fontFamily}`;
  context.fillText(label, barX, origin.y + Math.round(14 * scale));
  context.restore();
}

function drawPublicationNorthArrow(
  context: CanvasRenderingContext2D,
  bearingDegrees: number,
  options: MapCompositionOptions,
  frame: PublicationRect,
): void {
  const scale = options.dpi / 72;
  const size = Math.round(42 * scale);
  const inset = Math.round(16 * scale);
  const origin = getCornerOrigin(frame, options.northArrowPosition, size, size, inset);

  context.save();
  context.translate(origin.x + size / 2, origin.y + size / 2);
  context.rotate(getNorthArrowRotationRadians(bearingDegrees));
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.strokeStyle = "rgba(17,24,39,0.35)";
  context.beginPath();
  context.arc(0, 0, size / 2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#111827";
  context.beginPath();
  context.moveTo(0, -size * 0.36);
  context.lineTo(size * 0.18, size * 0.22);
  context.lineTo(0, size * 0.1);
  context.lineTo(-size * 0.18, size * 0.22);
  context.closePath();
  context.fill();
  if (options.northArrowStyle === "compass") {
    context.strokeStyle = "#F59E0B";
    context.beginPath();
    context.moveTo(-size * 0.32, 0);
    context.lineTo(size * 0.32, 0);
    context.moveTo(0, -size * 0.32);
    context.lineTo(0, size * 0.32);
    context.stroke();
  }
  context.rotate(-getNorthArrowRotationRadians(bearingDegrees));
  context.fillStyle = "#111827";
  context.font = `700 ${Math.round(10 * scale)}px ${MAP_TYPOGRAPHY.fontFamilyBrand}`;
  context.textAlign = "center";
  context.fillText("N", 0, -size * 0.36);
  context.restore();
}

function drawPublicationInsetMap(
  context: CanvasRenderingContext2D,
  map: maplibregl.Map,
  options: MapCompositionOptions,
  frame: PublicationRect,
): void {
  if (!options.includeInsetMap) return;
  const scale = options.dpi / 72;
  const size = Math.round(200 * scale);
  const inset = Math.round(16 * scale);
  const origin = getCornerOrigin(frame, options.insetMapPosition, size, size, inset);
  const center = map.getCenter();

  context.save();
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.strokeStyle = "rgba(17,24,39,0.3)";
  drawRoundedRect(context, origin.x, origin.y, size, size, Math.round(7 * scale));
  context.fill();
  context.stroke();
  context.fillStyle = "#DBEAFE";
  context.fillRect(origin.x + Math.round(10 * scale), origin.y + Math.round(24 * scale), size - Math.round(20 * scale), size - Math.round(44 * scale));
  context.strokeStyle = "#2563EB";
  context.lineWidth = Math.max(1, Math.round(2 * scale));
  context.strokeRect(origin.x + size * 0.34, origin.y + size * 0.38, size * 0.32, size * 0.24);
  context.fillStyle = "#111827";
  context.font = `600 ${Math.round(10 * scale)}px ${MAP_TYPOGRAPHY.fontFamily}`;
  context.fillText("Locator", origin.x + Math.round(10 * scale), origin.y + Math.round(15 * scale));
  context.font = `400 ${Math.round(8 * scale)}px ${MAP_TYPOGRAPHY.fontFamilyMono}`;
  context.fillText(`${center.lng.toFixed(2)}, ${center.lat.toFixed(2)}`, origin.x + Math.round(10 * scale), origin.y + size - Math.round(10 * scale));
  context.restore();
}

function drawPublicationAttribution(
  context: CanvasRenderingContext2D,
  options: MapCompositionOptions,
  layout: PublicationLayoutPx,
): void {
  if (!options.includeAttribution || !options.attributionText.trim()) return;
  const scale = options.dpi / 72;
  const x = options.attributionPosition === "bottom-right"
    ? layout.pageWidth - layout.margin
    : options.attributionPosition === "bottom-center"
      ? layout.pageWidth / 2
      : layout.margin;
  const align: CanvasTextAlign = options.attributionPosition === "bottom-right"
    ? "right"
    : options.attributionPosition === "bottom-center"
      ? "center"
      : "left";
  context.save();
  context.textAlign = align;
  context.fillStyle = "#4B5563";
  context.font = `400 ${Math.round(9 * scale)}px ${MAP_TYPOGRAPHY.fontFamily}`;
  context.fillText(
    options.attributionText.trim(),
    x,
    layout.pageHeight - layout.margin - Math.round(10 * scale),
    layout.pageWidth - layout.margin * 2,
  );
  context.restore();
}

function truncateCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (context.measureText(text).width <= maxWidth) return text;
  const ellipsis = "...";
  let candidate = text.trim();
  while (candidate.length > 0 && context.measureText(`${candidate}${ellipsis}`).width > maxWidth) {
    candidate = candidate.slice(0, -1).trimEnd();
  }
  return candidate ? `${candidate}${ellipsis}` : ellipsis;
}

function drawA0LegendPanel(options: { overlayLayers?: OverlayLayerConfig[] }): string {
  const dimensions = getA0LegendPanelDimensionsPx(300);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A0 legend panel canvas context could not be created.");
  }

  const pxPerMm = dimensions.width / A0_LEGEND_PANEL_MM.width;
  const padding = 5.5 * pxPerMm;
  const visibleLayers = (options.overlayLayers ?? []).filter((layer) => layer.visible);
  const legendItems = buildMapCompositionLegendItems(visibleLayers).slice(0, 5);

  context.save();
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillRect(0, 0, dimensions.width, dimensions.height);
  context.strokeStyle = "rgba(17,24,39,0.26)";
  context.lineWidth = Math.max(1, 0.2 * pxPerMm);
  context.strokeRect(0.5, 0.5, dimensions.width - 1, dimensions.height - 1);
  context.textBaseline = "top";
  context.fillStyle = "#111827";
  context.font = `700 ${Math.round(5.6 * pxPerMm)}px ${MAP_TYPOGRAPHY.fontFamilyBrand}`;
  context.fillText("Legend", padding, padding);
  context.fillStyle = "#4B5563";
  context.font = `500 ${Math.round(3.6 * pxPerMm)}px ${MAP_TYPOGRAPHY.fontFamily}`;
  context.fillText(
    `${visibleLayers.length} visible layer${visibleLayers.length === 1 ? "" : "s"}`,
    padding,
    padding + 8 * pxPerMm,
  );

  context.font = `400 ${Math.round(3.7 * pxPerMm)}px ${MAP_TYPOGRAPHY.fontFamily}`;
  legendItems.forEach((item, index) => {
    const y = padding + (17 + index * 8.8) * pxPerMm;
    const swatchSize = 4.2 * pxPerMm;
    context.fillStyle = item.color;
    if (item.kind === "line") {
      context.strokeStyle = item.color;
      context.lineWidth = Math.max(1, 0.7 * pxPerMm);
      context.beginPath();
      context.moveTo(padding, y + swatchSize / 2);
      context.lineTo(padding + 11 * pxPerMm, y + swatchSize / 2);
      context.stroke();
    } else if (item.kind === "circle") {
      context.beginPath();
      context.arc(padding + swatchSize / 2, y + swatchSize / 2, swatchSize / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(padding, y, swatchSize * 1.35, swatchSize);
    }
    context.fillStyle = "#1F2937";
    context.fillText(
      truncateCanvasText(context, item.label, dimensions.width - padding * 2 - 17 * pxPerMm),
      padding + 15 * pxPerMm,
      y - 0.8 * pxPerMm,
    );
  });
  context.restore();

  return canvas.toDataURL("image/png");
}

function drawA0NorthArrowPanel(bearingDegrees: number): string {
  const width = Math.round((A0_NORTH_ARROW_PANEL_MM.width / MM_PER_INCH) * 300);
  const height = Math.round((A0_NORTH_ARROW_PANEL_MM.height / MM_PER_INCH) * 300);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A0 north arrow canvas context could not be created.");
  }

  const size = Math.min(width, height) * 0.82;
  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(getNorthArrowRotationRadians(bearingDegrees));
  context.fillStyle = "rgba(255,255,255,0.86)";
  context.strokeStyle = "rgba(17,24,39,0.32)";
  context.lineWidth = Math.max(2, size * 0.035);
  context.beginPath();
  context.arc(0, 0, size / 2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#111827";
  context.beginPath();
  context.moveTo(0, -size * 0.34);
  context.lineTo(size * 0.15, size * 0.2);
  context.lineTo(0, size * 0.09);
  context.lineTo(-size * 0.15, size * 0.2);
  context.closePath();
  context.fill();
  context.rotate(-getNorthArrowRotationRadians(bearingDegrees));
  context.font = `700 ${Math.round(size * 0.18)}px ${MAP_TYPOGRAPHY.fontFamilyBrand}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("N", 0, -size * 0.34);
  context.restore();

  return canvas.toDataURL("image/png");
}

function drawPdfScaleBar(
  pdf: InstanceType<JsPdfConstructor>,
  scaleBar: { label: string; widthMm: number } | null,
  x: number,
  y: number,
): void {
  if (!scaleBar) return;
  const tickHeight = 6;
  pdf.setDrawColor?.(17, 24, 39);
  pdf.setTextColor?.(17, 24, 39);
  pdf.setLineWidth?.(0.55);
  pdf.line?.(x, y, x + scaleBar.widthMm, y);
  pdf.line?.(x, y, x, y - tickHeight);
  pdf.line?.(x + scaleBar.widthMm, y, x + scaleBar.widthMm, y - tickHeight);
  pdf.setFont?.("helvetica", "bold");
  pdf.setFontSize?.(7);
  pdf.text?.(scaleBar.label, x, y - 8.5);
}

async function captureMapCanvas(
  map: maplibregl.Map,
  resolution: MapExportResolution,
  options: { targetAspectRatio?: number } = {},
): Promise<{ dataUrl: string; width: number; height: number; cssWidth: number; cssHeight: number }> {
  const mapContainer = map.getContainer();
  const rect = mapContainer.getBoundingClientRect();
  const originalCssWidth = Math.round(rect.width);
  const originalCssHeight = Math.round(rect.height);

  if (originalCssWidth <= 0 || originalCssHeight <= 0) {
    throw new Error("Map canvas is not ready for image export.");
  }

  const targetAspectRatio = options.targetAspectRatio;
  const hasTargetAspectRatio = typeof targetAspectRatio === "number" && Number.isFinite(targetAspectRatio) && targetAspectRatio > 0;
  const captureCssWidth = originalCssWidth;
  const captureCssHeight = hasTargetAspectRatio
    ? Math.max(1, Math.round(captureCssWidth / targetAspectRatio))
    : originalCssHeight;
  const shouldResizeViewport = captureCssWidth !== originalCssWidth || captureCssHeight !== originalCssHeight;
  const scale = getResolutionScale(resolution);
  const targetPixelRatio = getExportPixelRatio(resolution, getMapPixelRatio(map));
  const originalPixelRatio = getMapPixelRatio(map);
  const originalPixelRatioOverride = getMapPixelRatioOverride(map);
  const canOverridePixelRatio = typeof map.setPixelRatio === "function";
  const originalStyles = {
    width: mapContainer.style.width,
    height: mapContainer.style.height,
    transform: mapContainer.style.transform,
    transformOrigin: mapContainer.style.transformOrigin,
  };
  const originalCenter = map.getCenter();
  const originalView = {
    center: [originalCenter.lng, originalCenter.lat] as [number, number],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };

  const restoreMapState = async () => {
    restoreMapPixelRatio(map, originalPixelRatioOverride, originalPixelRatio);
    mapContainer.style.width = originalStyles.width;
    mapContainer.style.height = originalStyles.height;
    mapContainer.style.transform = originalStyles.transform;
    mapContainer.style.transformOrigin = originalStyles.transformOrigin;
    map.resize();
    map.jumpTo(originalView);
    await waitForMapSettled(map, 500);
  };

  try {
    if (scale > 1 && canOverridePixelRatio) {
      map.stop();
      if (shouldResizeViewport) {
        mapContainer.style.width = `${captureCssWidth}px`;
        mapContainer.style.height = `${captureCssHeight}px`;
      }
      map.setPixelRatio(targetPixelRatio);
      map.resize();
      map.jumpTo(originalView);
      await waitForMapSettled(map);
    } else if (scale > 1) {
      map.stop();
      mapContainer.style.width = `${captureCssWidth * scale}px`;
      mapContainer.style.height = `${captureCssHeight * scale}px`;
      mapContainer.style.transform = `scale(${1 / scale})`;
      mapContainer.style.transformOrigin = "top left";
      map.resize();
      map.jumpTo({
        center: originalView.center,
        zoom: originalView.zoom + Math.log2(scale),
        bearing: originalView.bearing,
        pitch: originalView.pitch,
      });
      await waitForMapSettled(map);
    } else if (shouldResizeViewport) {
      map.stop();
      mapContainer.style.width = `${captureCssWidth}px`;
      mapContainer.style.height = `${captureCssHeight}px`;
      map.resize();
      map.jumpTo(originalView);
      await waitForMapSettled(map);
    } else {
      await waitForMapSettled(map, 500);
    }

    const canvas = map.getCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      cssWidth: captureCssWidth,
      cssHeight: captureCssHeight,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "SecurityError") {
      throw new Error("Map tiles blocked image export because the canvas is tainted by cross-origin content.");
    }
    throw error;
  } finally {
    if (scale > 1 || shouldResizeViewport) {
      await restoreMapState();
    }
  }
}

async function renderPublicationCanvas(
  map: maplibregl.Map,
  compositionInput: Partial<MapCompositionOptions> | null | undefined,
  overlayLayers: OverlayLayerConfig[] = [],
  options: { rasterText?: boolean } = {},
): Promise<{ canvas: HTMLCanvasElement; filename: string; composition: MapCompositionOptions; legendItems: MapCompositionLegendItem[] }> {
  const composition = normaliseCompositionOptions(compositionInput);
  const layout = getPublicationLayout(composition);
  const mapCapture = await captureMapCanvas(map, mapDpiToResolution(composition.dpi));
  const mapImage = await dataUrlToImage(mapCapture.dataUrl);
  const legendItems = buildMapCompositionLegendItems(overlayLayers);
  const canvas = document.createElement("canvas");
  canvas.width = layout.pageWidth;
  canvas.height = layout.pageHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Publication map export canvas context could not be created.");
  }

  context.fillStyle = "#F8FAFC";
  context.fillRect(0, 0, layout.pageWidth, layout.pageHeight);
  if (options.rasterText !== false) {
    drawPublicationTitle(context, composition, layout);
  }

  context.save();
  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "rgba(17,24,39,0.55)";
  context.lineWidth = Math.max(1, Math.round(composition.dpi / 150));
  context.fillRect(layout.mapFrame.x, layout.mapFrame.y, layout.mapFrame.width, layout.mapFrame.height);
  const fittedMapRect = getFittedMapImageRect(mapImage, layout.mapFrame, composition.mapFit);
  context.beginPath();
  context.rect(layout.mapFrame.x, layout.mapFrame.y, layout.mapFrame.width, layout.mapFrame.height);
  context.clip();
  context.drawImage(mapImage, fittedMapRect.x, fittedMapRect.y, fittedMapRect.width, fittedMapRect.height);
  context.restore();

  context.save();
  context.strokeStyle = "rgba(17,24,39,0.55)";
  context.lineWidth = Math.max(1, Math.round(composition.dpi / 150));
  context.strokeRect(layout.mapFrame.x, layout.mapFrame.y, layout.mapFrame.width, layout.mapFrame.height);
  context.restore();

  if (composition.includeGraticule) {
    drawPublicationGraticule(context, map, layout.mapFrame);
  }

  if (composition.includeScaleBar) {
    const scaleBarSpec = calculateScaleBarSpec(map, Math.min(180, mapCapture.cssWidth * 0.26));
    if (scaleBarSpec) {
      drawPublicationScaleBar(context, scaleBarSpec, composition, layout.mapFrame);
    }
  }

  if (composition.includeNorthArrow) {
    drawPublicationNorthArrow(context, map.getBearing(), composition, layout.mapFrame);
  }

  drawPublicationLegend(context, legendItems, composition, layout.mapFrame, {
    includeText: options.rasterText !== false,
  });
  drawPublicationInsetMap(context, map, composition, layout.mapFrame);
  if (options.rasterText !== false) {
    drawPublicationAttribution(context, composition, layout);
  }

  return {
    canvas,
    filename: generateMapPublicationFilename(composition.format),
    composition,
    legendItems,
  };
}

function pdfTextAlign(position: MapCompositionTitlePosition): "left" | "center" | "right" {
  if (position === "top-left") return "left";
  if (position === "top-right") return "right";
  return "center";
}

function addPdfVectorTextOverlays(
  pdf: InstanceType<JsPdfConstructor>,
  composition: MapCompositionOptions,
  legendItems: MapCompositionLegendItem[],
): void {
  const pageMm = getCompositionPageDimensionsMm(composition);
  const layout = getPublicationLayout(composition);
  const pxToMmX = pageMm.width / layout.pageWidth;
  const pxToMmY = pageMm.height / layout.pageHeight;
  const title = composition.title.trim();
  const subtitle = composition.subtitle.trim();
  const titleAlign = pdfTextAlign(composition.titlePosition);
  const titleX = titleXForSvg(composition.titlePosition, layout) * pxToMmX;
  const titleSizePx = Math.round(composition.titleFontSize * (composition.dpi / 72));

  if (composition.includeTitleBlock) {
    pdf.setTextColor?.("#111827");
    pdf.setFont?.("helvetica", "bold");
    pdf.setFontSize?.(composition.titleFontSize);
    if (title && pdf.text) {
      pdf.text(title, titleX, (layout.margin + titleSizePx * 0.72) * pxToMmY, { align: titleAlign });
    }

    if (subtitle && pdf.text) {
      pdf.setTextColor?.("#4B5563");
      pdf.setFont?.("helvetica", "normal");
      pdf.setFontSize?.(12);
      pdf.text(subtitle, titleX, (layout.margin + titleSizePx + Math.round(20 * (composition.dpi / 72))) * pxToMmY, { align: titleAlign });
    }
  }

  if (composition.includeAttribution && composition.attributionText.trim() && pdf.text) {
    const attributionX = composition.attributionPosition === "bottom-right"
      ? pageMm.width - composition.marginMm
      : composition.attributionPosition === "bottom-center"
        ? pageMm.width / 2
        : composition.marginMm;
    const attributionAlign = composition.attributionPosition === "bottom-right"
      ? "right"
      : composition.attributionPosition === "bottom-center"
        ? "center"
        : "left";
    pdf.setTextColor?.("#4B5563");
    pdf.setFont?.("helvetica", "normal");
    pdf.setFontSize?.(8.5);
    pdf.text(composition.attributionText.trim(), attributionX, pageMm.height - composition.marginMm + 1, { align: attributionAlign });
  }

  const writePdfText = pdf.text?.bind(pdf);
  if (composition.includeLegend && legendItems.length > 0 && writePdfText) {
    const scale = composition.dpi / 72;
    const legendWidthPx = Math.round(178 * scale);
    const rowHeightPx = Math.round(18 * scale);
    const legendHeightPx = Math.min(Math.round(260 * scale), Math.round(38 * scale) + legendItems.length * rowHeightPx);
    const legendOrigin = getCornerOrigin(layout.mapFrame, composition.legendPosition, legendWidthPx, legendHeightPx, Math.round(14 * scale));
    pdf.setTextColor?.("#111827");
    pdf.setFont?.("helvetica", "bold");
    pdf.setFontSize?.(8.5);
    writePdfText("Legend", (legendOrigin.x + Math.round(10 * scale)) * pxToMmX, (legendOrigin.y + Math.round(15 * scale)) * pxToMmY, { align: "left" });
    pdf.setTextColor?.("#1F2937");
    pdf.setFont?.("helvetica", "normal");
    pdf.setFontSize?.(7.2);
    legendItems.slice(0, 12).forEach((item, index) => {
      const rowY = legendOrigin.y + Math.round(34 * scale) + index * rowHeightPx;
      writePdfText(item.label, (legendOrigin.x + Math.round(34 * scale)) * pxToMmX, rowY * pxToMmY, { align: "left" });
    });
  }
}

function svgTextAnchor(position: MapCompositionTitlePosition): string {
  if (position === "top-left") return "start";
  if (position === "top-right") return "end";
  return "middle";
}

function titleXForSvg(position: MapCompositionTitlePosition, layout: PublicationLayoutPx): number {
  if (position === "top-left") return layout.margin;
  if (position === "top-right") return layout.pageWidth - layout.margin;
  return layout.pageWidth / 2;
}

function buildPublicationSvg(
  map: maplibregl.Map,
  composition: MapCompositionOptions,
  mapCapture: MapCanvasCapture,
  legendItems: MapCompositionLegendItem[],
): string {
  const layout = getPublicationLayout(composition);
  const title = escapeXml(composition.title.trim());
  const subtitle = escapeXml(composition.subtitle.trim());
  const titleSize = Math.round(composition.titleFontSize * (composition.dpi / 72));
  const subtitleSize = Math.max(11, Math.round(12 * (composition.dpi / 72)));
  const titleX = titleXForSvg(composition.titlePosition, layout);
  const titleAnchor = svgTextAnchor(composition.titlePosition);
  const scale = composition.dpi / 72;
  const chunks: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.pageWidth}" height="${layout.pageHeight}" viewBox="0 0 ${layout.pageWidth} ${layout.pageHeight}">`,
    `<rect width="100%" height="100%" fill="#F8FAFC"/>`,
  ];

  if (composition.includeTitleBlock && title) {
    chunks.push(`<text x="${titleX}" y="${layout.margin + titleSize}" text-anchor="${titleAnchor}" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamilyBrand)}" font-size="${titleSize}" font-weight="700" fill="#111827">${title}</text>`);
  }
  if (composition.includeTitleBlock && subtitle) {
    chunks.push(`<text x="${titleX}" y="${layout.margin + titleSize + subtitleSize + Math.round(8 * scale)}" text-anchor="${titleAnchor}" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamily)}" font-size="${subtitleSize}" fill="#4B5563">${subtitle}</text>`);
  }

  chunks.push(`<rect x="${layout.mapFrame.x}" y="${layout.mapFrame.y}" width="${layout.mapFrame.width}" height="${layout.mapFrame.height}" fill="#fff" stroke="rgba(17,24,39,0.55)"/>`);
  chunks.push(`<image href="${escapeXml(mapCapture.dataUrl)}" x="${layout.mapFrame.x}" y="${layout.mapFrame.y}" width="${layout.mapFrame.width}" height="${layout.mapFrame.height}" preserveAspectRatio="xMidYMid ${composition.mapFit === "cover" ? "slice" : "meet"}"/>`);

  if (composition.includeGraticule) {
    for (let index = 1; index <= 4; index += 1) {
      const x = layout.mapFrame.x + (layout.mapFrame.width / 5) * index;
      const y = layout.mapFrame.y + (layout.mapFrame.height / 5) * index;
      chunks.push(`<line x1="${x}" y1="${layout.mapFrame.y}" x2="${x}" y2="${layout.mapFrame.y + layout.mapFrame.height}" stroke="rgba(17,24,39,0.25)"/>`);
      chunks.push(`<line x1="${layout.mapFrame.x}" y1="${y}" x2="${layout.mapFrame.x + layout.mapFrame.width}" y2="${y}" stroke="rgba(17,24,39,0.25)"/>`);
    }
  }

  if (composition.includeLegend && legendItems.length > 0) {
    const width = Math.round(178 * scale);
    const rowHeight = Math.round(18 * scale);
    const height = Math.min(Math.round(260 * scale), Math.round(38 * scale) + legendItems.length * rowHeight);
    const origin = getCornerOrigin(layout.mapFrame, composition.legendPosition, width, height, Math.round(14 * scale));
    chunks.push(`<rect x="${origin.x}" y="${origin.y}" width="${width}" height="${height}" rx="${Math.round(7 * scale)}" fill="rgba(255,255,255,0.92)" stroke="rgba(17,24,39,0.28)"/>`);
    chunks.push(`<text x="${origin.x + Math.round(10 * scale)}" y="${origin.y + Math.round(18 * scale)}" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamilyBrand)}" font-size="${Math.round(11 * scale)}" font-weight="700" fill="#111827">Legend</text>`);
    legendItems.slice(0, 12).forEach((item, index) => {
      const rowY = origin.y + Math.round(34 * scale) + index * rowHeight;
      chunks.push(`<rect x="${origin.x + Math.round(10 * scale)}" y="${rowY - Math.round(9 * scale)}" width="${Math.round(16 * scale)}" height="${Math.round(10 * scale)}" fill="${escapeXml(item.color)}"/>`);
      chunks.push(`<text x="${origin.x + Math.round(34 * scale)}" y="${rowY}" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamily)}" font-size="${Math.round(9 * scale)}" fill="#1F2937">${escapeXml(item.label)}</text>`);
    });
  }

  if (composition.includeScaleBar) {
    const scaleBarSpec = calculateScaleBarSpec(map);
    if (scaleBarSpec) {
      const width = Math.round(Math.max(72 * scale, scaleBarSpec.pixelWidthCss * scale));
      const height = Math.round(38 * scale);
      const origin = getCornerOrigin(layout.mapFrame, composition.scaleBarPosition, width + Math.round(28 * scale), height, Math.round(16 * scale));
      chunks.push(`<rect x="${origin.x}" y="${origin.y}" width="${width + Math.round(28 * scale)}" height="${height}" rx="${Math.round(7 * scale)}" fill="rgba(255,255,255,0.9)" stroke="rgba(17,24,39,0.35)"/>`);
      chunks.push(`<text x="${origin.x + Math.round(14 * scale)}" y="${origin.y + Math.round(14 * scale)}" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamily)}" font-size="${Math.round(10 * scale)}" font-weight="600" fill="#111827">${escapeXml(formatScaleBarLabelForUnit(scaleBarSpec.distanceMetres, composition.scaleBarUnit))}</text>`);
      chunks.push(`<line x1="${origin.x + Math.round(14 * scale)}" y1="${origin.y + Math.round(24 * scale)}" x2="${origin.x + Math.round(14 * scale) + width}" y2="${origin.y + Math.round(24 * scale)}" stroke="#111827" stroke-width="${Math.max(2, Math.round(2 * scale))}"/>`);
    }
  }

  if (composition.includeNorthArrow) {
    const size = Math.round(42 * scale);
    const origin = getCornerOrigin(layout.mapFrame, composition.northArrowPosition, size, size, Math.round(16 * scale));
    const centerX = origin.x + size / 2;
    const centerY = origin.y + size / 2;
    chunks.push(`<g transform="translate(${centerX} ${centerY}) rotate(${-map.getBearing()})">`);
    chunks.push(`<circle cx="0" cy="0" r="${size / 2}" fill="rgba(255,255,255,0.9)" stroke="rgba(17,24,39,0.35)"/>`);
    if (composition.northArrowStyle === "compass") {
      chunks.push(`<line x1="${-size * 0.32}" y1="0" x2="${size * 0.32}" y2="0" stroke="#F59E0B" stroke-width="${Math.max(1, Math.round(1.5 * scale))}"/>`);
      chunks.push(`<line x1="0" y1="${-size * 0.32}" x2="0" y2="${size * 0.32}" stroke="#F59E0B" stroke-width="${Math.max(1, Math.round(1.5 * scale))}"/>`);
    }
    chunks.push(`<path d="M 0 ${-size * 0.36} L ${size * 0.18} ${size * 0.22} L 0 ${size * 0.1} L ${-size * 0.18} ${size * 0.22} Z" fill="#111827"/>`);
    chunks.push(`</g><text x="${centerX}" y="${origin.y + Math.round(12 * scale)}" text-anchor="middle" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamilyBrand)}" font-size="${Math.round(10 * scale)}" font-weight="700" fill="#111827">N</text>`);
  }

  if (composition.includeInsetMap) {
    const size = Math.round(200 * scale);
    const origin = getCornerOrigin(layout.mapFrame, composition.insetMapPosition, size, size, Math.round(16 * scale));
    const center = map.getCenter();
    chunks.push(`<rect x="${origin.x}" y="${origin.y}" width="${size}" height="${size}" rx="${Math.round(7 * scale)}" fill="rgba(255,255,255,0.9)" stroke="rgba(17,24,39,0.3)"/>`);
    chunks.push(`<rect x="${origin.x + Math.round(10 * scale)}" y="${origin.y + Math.round(24 * scale)}" width="${size - Math.round(20 * scale)}" height="${size - Math.round(44 * scale)}" fill="#DBEAFE"/>`);
    chunks.push(`<rect x="${origin.x + size * 0.34}" y="${origin.y + size * 0.38}" width="${size * 0.32}" height="${size * 0.24}" fill="none" stroke="#2563EB" stroke-width="${Math.max(1, Math.round(2 * scale))}"/>`);
    chunks.push(`<text x="${origin.x + Math.round(10 * scale)}" y="${origin.y + Math.round(15 * scale)}" font-size="${Math.round(10 * scale)}" font-weight="600" fill="#111827">Locator</text>`);
    chunks.push(`<text x="${origin.x + Math.round(10 * scale)}" y="${origin.y + size - Math.round(10 * scale)}" font-size="${Math.round(8 * scale)}" fill="#111827">${center.lng.toFixed(2)}, ${center.lat.toFixed(2)}</text>`);
  }

  if (composition.includeAttribution && composition.attributionText.trim()) {
    const attributionX = composition.attributionPosition === "bottom-right"
      ? layout.pageWidth - layout.margin
      : composition.attributionPosition === "bottom-center"
        ? layout.pageWidth / 2
        : layout.margin;
    const attributionAnchor = composition.attributionPosition === "bottom-right"
      ? "end"
      : composition.attributionPosition === "bottom-center"
        ? "middle"
        : "start";
    chunks.push(`<text x="${attributionX}" y="${layout.pageHeight - layout.margin}" text-anchor="${attributionAnchor}" font-family="${escapeXml(MAP_TYPOGRAPHY.fontFamily)}" font-size="${Math.round(9 * scale)}" fill="#4B5563">${escapeXml(composition.attributionText.trim())}</text>`);
  }

  chunks.push("</svg>");
  return chunks.join("");
}

async function exportPublicationSvg(
  map: maplibregl.Map,
  compositionInput: Partial<MapCompositionOptions> | null | undefined,
  overlayLayers: OverlayLayerConfig[],
): Promise<MapPublicationExportResult> {
  const composition = normaliseCompositionOptions({ ...compositionInput, format: "svg" });
  const mapCapture = await captureMapCanvas(map, mapDpiToResolution(composition.dpi));
  const legendItems = buildMapCompositionLegendItems(overlayLayers);
  const svgMarkup = buildPublicationSvg(map, composition, mapCapture, legendItems);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  const page = getCompositionPageDimensionsPx(composition);
  return {
    dataUrl,
    filename: generateMapPublicationFilename("svg"),
    width: page.width,
    height: page.height,
    format: "svg",
    mimeType: getCompositionMimeType("svg"),
  };
}

async function exportPublicationPdfFromCanvas(
  canvas: HTMLCanvasElement,
  composition: MapCompositionOptions,
  legendItems: MapCompositionLegendItem[],
): Promise<string> {
  const module = await import("jspdf") as { jsPDF: JsPdfConstructor };
  const page = getCompositionPageDimensionsMm(composition);
  const orientation = page.width > page.height ? "landscape" : "portrait";
  const format = composition.pageSize === "custom" ? [page.width, page.height] as [number, number] : composition.pageSize;
  const pdf = new module.jsPDF({ orientation, unit: "mm", format, compress: true });
  pdf.setProperties?.({
    title: composition.title.trim() || "Map composition export",
    subject: "Publication-quality map composition",
    creator: "SynapseCore Map Explorer",
  });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, page.width, page.height);
  addPdfVectorTextOverlays(pdf, composition, legendItems);
  return pdf.output("datauristring");
}

export async function exportMapPublication(
  map: maplibregl.Map,
  options: {
    composition: Partial<MapCompositionOptions>;
    overlayLayers?: OverlayLayerConfig[];
    scientificQA?: MapScientificQAState | null;
    acknowledgedIssueIds?: string[];
  },
): Promise<MapPublicationExportResult> {
  const composition = normaliseCompositionOptions(options.composition);
  const overlayLayers = options.overlayLayers ?? [];
  const legendItems = buildMapCompositionLegendItems(overlayLayers);
  const readiness = buildMapPublicationReadiness({
    mode: "publication-export",
    composition,
    overlayLayers,
    scientificQA: options.scientificQA,
    legendItems,
    acknowledgedIssueIds: options.acknowledgedIssueIds,
  });
  const attachPublicationMetadata = (result: MapPublicationExportResult): MapPublicationExportResult => {
    const manifest = buildMapPublicationManifest({
      result,
      composition,
      overlayLayers,
      legendItems,
      readiness,
      scientificQA: options.scientificQA,
    });
    return { ...result, readiness, manifest };
  };
  if (composition.format === "svg") {
    return attachPublicationMetadata(await exportPublicationSvg(map, composition, overlayLayers));
  }

  const rendered = await renderPublicationCanvas(map, composition, overlayLayers, {
    rasterText: composition.format !== "pdf",
  });
  if (composition.format === "pdf") {
    const pdfDataUrl = await exportPublicationPdfFromCanvas(rendered.canvas, rendered.composition, rendered.legendItems);
    return attachPublicationMetadata({
      dataUrl: pdfDataUrl,
      filename: generateMapPublicationFilename("pdf"),
      width: rendered.canvas.width,
      height: rendered.canvas.height,
      format: "pdf",
      mimeType: getCompositionMimeType("pdf"),
    });
  }

  return attachPublicationMetadata({
    dataUrl: rendered.canvas.toDataURL("image/png"),
    filename: generateMapPublicationFilename("png"),
    width: rendered.canvas.width,
    height: rendered.canvas.height,
    format: "png",
    mimeType: getCompositionMimeType("png"),
  });
}

export async function exportMapOnlyA0LandscapePdf(
  map: maplibregl.Map,
  options: {
    mapFit?: MapCompositionMapFit;
    title?: string;
    overlayLayers?: OverlayLayerConfig[];
    attributionText?: string;
    scientificQA?: MapScientificQAState | null;
    acknowledgedIssueIds?: string[];
  } = {},
): Promise<MapPublicationExportResult> {
  const module = await import("jspdf") as { jsPDF: JsPdfConstructor };
  const targetMapAspectRatio = getA0SheetMapAspectRatio();
  const mapFrame = getA0SheetMapAreaMm();
  const mapCapture = await captureMapCanvas(map, "high", { targetAspectRatio: targetMapAspectRatio });
  const pageFrame = { x: 0, y: 0, width: A0_LANDSCAPE_PAGE_MM.width, height: A0_LANDSCAPE_PAGE_MM.height };
  const imageFrame = getFittedMapImageRect(
    { width: mapCapture.width, height: mapCapture.height },
    mapFrame,
    options.mapFit ?? "contain",
  );
  const maxScaleBarWidthMm = 155;
  const scaleBarMaxWidthCss = mapCapture.cssWidth > 0 && imageFrame.width > 0
    ? (maxScaleBarWidthMm / imageFrame.width) * mapCapture.cssWidth
    : 120;
  const scaleSpec = calculateScaleBarSpec(map, scaleBarMaxWidthCss);
  const scaleBar = scaleSpec && mapCapture.cssWidth > 0
    ? {
        label: scaleSpec.label,
        widthMm: (scaleSpec.pixelWidthCss / mapCapture.cssWidth) * imageFrame.width,
      }
    : null;
  const title = options.title?.trim() || "Current map evidence";
  const overlayLayers = options.overlayLayers ?? [];
  const visibleLayerCount = overlayLayers.filter((layer) => layer.visible).length;
  const attribution = options.attributionText?.trim() || "Sources: visible map layers and project metadata. Scale is geodesic at map center.";
  const composition = normaliseCompositionOptions({
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
    format: "pdf",
    dpi: 300,
    pageSize: "custom",
    customWidthMm: A0_LANDSCAPE_PAGE_MM.width,
    customHeightMm: A0_LANDSCAPE_PAGE_MM.height,
    mapFit: options.mapFit ?? "contain",
    title,
    attributionText: attribution,
    includeScaleBar: true,
    includeNorthArrow: true,
    includeLegend: true,
    includeAttribution: true,
  });
  const legendItems = buildMapCompositionLegendItems(overlayLayers);
  const readiness = buildMapPublicationReadiness({
    mode: "publication-export",
    composition,
    overlayLayers,
    scientificQA: options.scientificQA,
    legendItems,
    acknowledgedIssueIds: options.acknowledgedIssueIds,
  });
  const pdf = new module.jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [A0_LANDSCAPE_PAGE_MM.width, A0_LANDSCAPE_PAGE_MM.height],
    compress: true,
  });
  pdf.setProperties?.({
    title: "A0 landscape map export",
    subject: "Map-only high-resolution A0 export with cartographic title, legend, scale, north arrow, and attribution",
    creator: "SynapseCore Map Explorer",
  });

  pdf.setFillColor?.(255, 255, 255);
  pdf.rect?.(0, 0, pageFrame.width, pageFrame.height, "F");
  pdf.setDrawColor?.(17, 24, 39);
  pdf.setLineWidth?.(0.7);
  pdf.rect?.(A0_SHEET_LAYOUT_MM.margin / 2, A0_SHEET_LAYOUT_MM.margin / 2, pageFrame.width - A0_SHEET_LAYOUT_MM.margin, pageFrame.height - A0_SHEET_LAYOUT_MM.margin, "S");

  pdf.setTextColor?.(17, 24, 39);
  pdf.setFont?.("helvetica", "bold");
  pdf.setFontSize?.(15);
  pdf.text?.(title, pageFrame.width / 2, A0_SHEET_LAYOUT_MM.margin + 10, { align: "center", maxWidth: pageFrame.width - A0_SHEET_LAYOUT_MM.margin * 4 });
  pdf.setTextColor?.(75, 85, 99);
  pdf.setFont?.("helvetica", "normal");
  pdf.setFontSize?.(6.5);
  pdf.text?.(
    `A0 landscape map sheet | ${visibleLayerCount} visible layer${visibleLayerCount === 1 ? "" : "s"} | Exported ${new Date().toLocaleString()}`,
    pageFrame.width / 2,
    A0_SHEET_LAYOUT_MM.margin + 21,
    { align: "center" },
  );
  pdf.setDrawColor?.(229, 231, 235);
  pdf.setLineWidth?.(0.35);
  pdf.line?.(A0_SHEET_LAYOUT_MM.margin, A0_SHEET_LAYOUT_MM.margin + A0_SHEET_LAYOUT_MM.titleBandHeight, pageFrame.width - A0_SHEET_LAYOUT_MM.margin, A0_SHEET_LAYOUT_MM.margin + A0_SHEET_LAYOUT_MM.titleBandHeight);

  pdf.addImage(mapCapture.dataUrl, "PNG", imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);
  pdf.setDrawColor?.(17, 24, 39);
  pdf.setLineWidth?.(0.45);
  pdf.rect?.(mapFrame.x, mapFrame.y, mapFrame.width, mapFrame.height, "S");

  const legendDataUrl = drawA0LegendPanel(options.overlayLayers ? { overlayLayers: options.overlayLayers } : {});
  pdf.addImage(
    legendDataUrl,
    "PNG",
    mapFrame.x + mapFrame.width - A0_LEGEND_PANEL_MM.width - 8,
    mapFrame.y + mapFrame.height - A0_LEGEND_PANEL_MM.height - 8,
    A0_LEGEND_PANEL_MM.width,
    A0_LEGEND_PANEL_MM.height,
  );
  const northArrowDataUrl = drawA0NorthArrowPanel(map.getBearing());
  pdf.addImage(
    northArrowDataUrl,
    "PNG",
    mapFrame.x + mapFrame.width - A0_NORTH_ARROW_PANEL_MM.width - 8,
    mapFrame.y + 8,
    A0_NORTH_ARROW_PANEL_MM.width,
    A0_NORTH_ARROW_PANEL_MM.height,
  );
  drawPdfScaleBar(pdf, scaleBar, mapFrame.x + 8, mapFrame.y + mapFrame.height - 12);

  const footerY = Math.min(pageFrame.height - A0_SHEET_LAYOUT_MM.margin - 5, mapFrame.y + mapFrame.height + 12);
  pdf.setTextColor?.(75, 85, 99);
  pdf.setFont?.("helvetica", "normal");
  pdf.setFontSize?.(4.8);
  pdf.text?.(attribution, A0_SHEET_LAYOUT_MM.margin, footerY, { maxWidth: pageFrame.width - A0_SHEET_LAYOUT_MM.margin * 2 });

  const result: MapPublicationExportResult = {
    dataUrl: pdf.output("datauristring"),
    filename: generateMapOnlyA0LandscapeFilename(),
    width: Math.round((A0_LANDSCAPE_PAGE_MM.width / MM_PER_INCH) * 300),
    height: Math.round((A0_LANDSCAPE_PAGE_MM.height / MM_PER_INCH) * 300),
    format: "pdf",
    mimeType: getCompositionMimeType("pdf"),
  };
  return {
    ...result,
    readiness,
    manifest: buildMapPublicationManifest({
      result,
      composition,
      overlayLayers,
      legendItems,
      readiness,
      scientificQA: options.scientificQA,
    }),
  };
}

async function renderComposite(
  map: maplibregl.Map,
  options: MapExportRenderOptions,
): Promise<{ canvas: HTMLCanvasElement; filename: string }> {
  const mapCapture = await captureMapCanvas(map, options.resolution);
  const mapImage = await dataUrlToImage(mapCapture.dataUrl);
  const pixelScale = mapCapture.width / mapCapture.cssWidth;
  const titleText = options.title?.trim() ?? "";
  const titleBandHeight = titleText ? Math.round(TITLE_BAND_CSS_HEIGHT * pixelScale) : 0;

  const toolbarRaster = options.includeToolbar && options.toolbarElement
    ? await rasterizeElement(options.toolbarElement, pixelScale)
    : null;
  const statusRaster = options.includeStatusBar && options.statusBarElement
    ? await rasterizeElement(options.statusBarElement, pixelScale)
    : null;
  const legendRaster = options.includeLegend && options.legendElement
    ? await rasterizeElement(options.legendElement, pixelScale)
    : null;

  const toolbarHeight = toolbarRaster?.height ?? 0;
  const statusHeight = statusRaster?.height ?? 0;
  const totalHeight = titleBandHeight + toolbarHeight + mapCapture.height + statusHeight;

  const canvas = document.createElement("canvas");
  canvas.width = mapCapture.width;
  canvas.height = totalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Map export canvas context could not be created.");
  }

  context.fillStyle = MAP_COLORS.bg;
  context.fillRect(0, 0, canvas.width, canvas.height);

  let currentY = 0;

  if (titleBandHeight > 0) {
    context.fillStyle = "rgba(13,13,13,0.96)";
    context.fillRect(0, 0, canvas.width, titleBandHeight);
    context.strokeStyle = "rgba(245,158,11,0.25)";
    context.lineWidth = Math.max(1, Math.round(pixelScale));
    context.beginPath();
    context.moveTo(0, titleBandHeight - context.lineWidth);
    context.lineTo(canvas.width, titleBandHeight - context.lineWidth);
    context.stroke();

    context.fillStyle = MAP_COLORS.amber;
    context.font = `${Math.max(16, Math.round(22 * pixelScale))}px ${MAP_TYPOGRAPHY.fontFamilyBrand}`;
    context.textBaseline = "middle";
    context.fillText(
      titleText,
      Math.round(24 * pixelScale),
      Math.round(titleBandHeight / 2),
      canvas.width - Math.round(48 * pixelScale),
    );
    currentY += titleBandHeight;
  }

  if (toolbarRaster) {
    context.drawImage(toolbarRaster.image, 0, currentY, canvas.width, toolbarRaster.height);
    currentY += toolbarRaster.height;
  }

  const mapTop = currentY;
  context.drawImage(mapImage, 0, mapTop, mapCapture.width, mapCapture.height);

  if (legendRaster && options.legendElement) {
    const mapRect = map.getContainer().getBoundingClientRect();
    const legendRect = options.legendElement.getBoundingClientRect();
    const legendX = Math.round((legendRect.left - mapRect.left) * pixelScale);
    const legendY = mapTop + Math.round((legendRect.top - mapRect.top) * pixelScale);
    context.drawImage(legendRaster.image, legendX, legendY, legendRaster.width, legendRaster.height);
  }

  const scaleBarSpec = options.includeScaleBar ? calculateScaleBarSpec(map) : null;
  if (scaleBarSpec) {
    drawScaleBar(context, scaleBarSpec, mapTop, mapCapture.height, pixelScale);
  }

  if (options.includeNorthArrow) {
    await drawNorthArrow(context, map.getBearing(), canvas.width, mapTop, pixelScale);
  }

  currentY += mapCapture.height;

  if (statusRaster) {
    context.drawImage(statusRaster.image, 0, currentY, canvas.width, statusRaster.height);
  }

  return {
    canvas,
    filename: generateMapExportFilename(),
  };
}

export async function exportMapImage(
  map: maplibregl.Map,
  options: MapExportRenderOptions,
): Promise<MapExportImageResult> {
  const { canvas, filename } = await renderComposite(map, options);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    filename,
    width: canvas.width,
    height: canvas.height,
  };
}

export async function renderMapExportPreview(
  map: maplibregl.Map,
  options: MapExportPreviewOptions,
): Promise<MapExportImageResult> {
  const rendered = options.composition
    ? await renderPublicationCanvas(map, { ...options.composition, dpi: 72, format: "png" }, options.overlayLayers ?? [])
    : await renderComposite(map, {
      ...options,
      resolution: "screen",
    });
  const { canvas, filename } = rendered;
  const maxPreviewWidth = options.maxPreviewWidth ?? DEFAULT_PREVIEW_WIDTH;
  const scale = Math.min(1, maxPreviewWidth / canvas.width);
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = Math.max(1, Math.round(canvas.width * scale));
  previewCanvas.height = Math.max(1, Math.round(canvas.height * scale));
  const context = previewCanvas.getContext("2d");
  if (!context) {
    throw new Error("Map preview canvas context could not be created.");
  }
  context.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
  return {
    dataUrl: previewCanvas.toDataURL("image/png"),
    filename,
    width: previewCanvas.width,
    height: previewCanvas.height,
  };
}

export function triggerMapImageDownload(filename: string, dataUrl: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename.toLowerCase().endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function triggerMapPublicationDownload(result: MapPublicationExportResult): void {
  const anchor = document.createElement("a");
  anchor.href = result.dataUrl;
  anchor.download = result.filename.toLowerCase().endsWith(`.${result.format}`)
    ? result.filename
    : `${result.filename}.${result.format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
