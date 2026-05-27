/* ==================================================================== */
/*  MapLayoutComposer (Prompt 22)                                        */
/*                                                                        */
/*  Assembles a reproducible, gate-checked publication FIGURE spec from   */
/*  the same metadata used by report handoff + publication export. It     */
/*  reuses MapExportService (readiness engine, legend items, north-arrow  */
/*  rotation) and the per-layer registry resolvers — it does NOT fork a   */
/*  second metadata path. The snapshot preflight blocks export when a     */
/*  required cartographic element (legend / CRS / attribution) is         */
/*  missing, naming the gap and a recommended fix.                        */
/* ==================================================================== */

import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import type { MapScientificQAState } from "../MapScientificQA";
import {
  buildMapCompositionLegendItems,
  buildMapPublicationReadiness,
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  getNorthArrowRotationRadians,
  type MapCompositionLegendItem,
  type MapCompositionOptions,
  type MapPublicationReadiness,
  type MapPublicationReadinessCheck,
  type MapPublicationReadinessCriterion,
  type MapPublicationReadinessStatus,
} from "../MapExportService";

export interface MapFigureLayerSummary {
  layerId: string;
  name: string;
  sourceKind: string | null;
  sourceName: string | null;
  crs: string | null;
  license: string | null;
  attribution: string | null;
  qaStatus: string | null;
}

export interface MapFigureSpec {
  id: string;
  title: string;
  createdAt: string;
  legendItems: MapCompositionLegendItem[];
  scaleBar: { included: boolean; label: string | null };
  northArrow: { included: boolean; bearing: number; rotationRadians: number };
  attribution: string | null;
  crs: string | null;
  qaCaveats: string[];
  visibleLayers: MapFigureLayerSummary[];
  composition: MapCompositionOptions;
  readiness: MapPublicationReadiness;
}

export interface ComposeMapFigureInput {
  overlayLayers: OverlayLayerConfig[];
  title?: string;
  composition?: Partial<MapCompositionOptions> | null;
  scientificQA?: MapScientificQAState | null;
  bearing?: number;
  scaleBarLabel?: string | null;
  now?: Date;
}

export interface MapFigureGap {
  criterion: MapPublicationReadinessCriterion;
  label: string;
  reason: string;
  recommendedFix?: string;
}

export interface MapFigurePreflightResult {
  ok: boolean;
  status: MapPublicationReadinessStatus;
  blockers: MapFigureGap[];
  warnings: MapFigureGap[];
}

function uniqueTexts(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

function summariseFigureLayer(layer: OverlayLayerConfig): MapFigureLayerSummary {
  const registry = normalizeLayerRegistryMetadata(layer);
  return {
    layerId: layer.id,
    name: layer.name,
    sourceKind: registry.sourceKind ?? null,
    sourceName: registry.licenseAttribution.sourceName ?? null,
    crs: registry.crsSummary.status === "known" ? registry.crsSummary.crs : null,
    license: registry.licenseAttribution.license ?? null,
    attribution: registry.licenseAttribution.attribution ?? null,
    qaStatus: registry.qaStatus ?? null,
  };
}

function formatLayerAttribution(summary: MapFigureLayerSummary): string | null {
  const sourceName = summary.sourceName ?? summary.name;
  if (summary.attribution && summary.license) {
    return `${sourceName} (${summary.attribution}; ${summary.license})`;
  }
  if (summary.attribution) {
    return `${sourceName} (${summary.attribution})`;
  }
  if (summary.license) {
    return `${sourceName} (${summary.license})`;
  }
  return null;
}

export function buildMapFigureAttributionText(overlayLayers: OverlayLayerConfig[]): string {
  const visibleSummaries = overlayLayers.filter((layer) => layer.visible).map(summariseFigureLayer);
  const formattedSources = uniqueTexts(visibleSummaries.map(formatLayerAttribution));
  if (formattedSources.length === 0) return "";
  return `Sources: ${formattedSources.join("; ")}. Scale is geodesic at map center.`;
}

function resolveFigureCrs(layerSummaries: MapFigureLayerSummary[]): string | null {
  const known = Array.from(
    new Set(layerSummaries.map((layer) => layer.crs).filter((crs): crs is string => Boolean(crs))),
  );
  // A single shared CRS is the clean case; mixed CRS still reports the first
  // (the readiness/caveat layer surfaces the inconsistency separately).
  return known[0] ?? null;
}

function checkToGap(check: MapPublicationReadinessCheck): MapFigureGap {
  return {
    criterion: check.criterion,
    label: check.label,
    reason: check.message,
    ...(check.recommendedFix ? { recommendedFix: check.recommendedFix } : {}),
  };
}

/**
 * Build a figure spec. Title / scale bar / north arrow are recorded as
 * configured metadata (warnings if absent); legend, attribution, and CRS are
 * the blocking cartographic gates.
 */
export function composeMapFigure(input: ComposeMapFigureInput): MapFigureSpec {
  const createdAt = (input.now ?? new Date()).toISOString();
  const hasExplicitAttributionText = input.composition != null
    && Object.prototype.hasOwnProperty.call(input.composition, "attributionText");
  const derivedAttributionText = buildMapFigureAttributionText(input.overlayLayers);
  const composition: MapCompositionOptions = {
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
    ...(input.composition ?? {}),
    ...(input.title ? { title: input.title } : {}),
    attributionText: hasExplicitAttributionText
      ? input.composition?.attributionText ?? ""
      : derivedAttributionText,
  };
  const visibleLayers = input.overlayLayers.filter((layer) => layer.visible);
  const visibleSummaries: MapFigureLayerSummary[] = visibleLayers.map(summariseFigureLayer);

  const legendItems = buildMapCompositionLegendItems(visibleLayers);
  const bearing = input.bearing ?? 0;
  const readiness = buildMapPublicationReadiness({
    mode: "publication-export",
    overlayLayers: input.overlayLayers,
    composition,
    scientificQA: input.scientificQA ?? null,
    legendItems,
    title: composition.title,
    snapshot: {
      attributionText: composition.attributionText,
      northArrowBearing: bearing,
      ...(input.scaleBarLabel != null ? { scaleBarLabel: input.scaleBarLabel } : {}),
    },
    // Legend + attribution are hard gates; title/scale-bar/north-arrow are
    // recorded but only warn so a figure is not blocked on decoration.
    requireTitle: false,
    requireScaleBar: false,
    requireNorthArrow: false,
    requireLegend: true,
    requireAttribution: true,
    requireCaveats: false,
    now: input.now ?? new Date(),
  });

  const attribution = composition.includeAttribution && composition.attributionText.trim().length > 0
    ? composition.attributionText.trim()
    : null;

  return {
    id: `map-figure-${createdAt}`,
    title: composition.title,
    createdAt,
    legendItems,
    scaleBar: {
      included: composition.includeScaleBar,
      label: input.scaleBarLabel ?? null,
    },
    northArrow: {
      included: composition.includeNorthArrow,
      bearing,
      rotationRadians: getNorthArrowRotationRadians(bearing),
    },
    attribution,
    crs: resolveFigureCrs(visibleSummaries),
    qaCaveats: readiness.caveats,
    visibleLayers: visibleSummaries,
    composition,
    readiness,
  };
}

/**
 * Snapshot preflight. Merges the export readiness blockers/warnings with an
 * explicit CRS gate (a figure without any known-CRS layer cannot be a
 * measurement-grade output) so legend / attribution / CRS each block by name.
 */
export function preflightMapFigure(figure: MapFigureSpec): MapFigurePreflightResult {
  const blockers: MapFigureGap[] = figure.readiness.blockers
    .filter((check) => check.criterion !== "attribution-license")
    .map(checkToGap);
  const warnings: MapFigureGap[] = figure.readiness.warnings
    .filter((check) => check.criterion !== "attribution-license")
    .map(checkToGap);

  const layersMissingAttribution = figure.visibleLayers.filter((layer) => !layer.attribution && !layer.license);
  if (!figure.attribution || layersMissingAttribution.length > 0) {
    const namedLayers = layersMissingAttribution.map((layer) => layer.name).join(", ");
    const reasonParts: string[] = [];
    if (!figure.attribution) {
      reasonParts.push("Figure attribution text is missing.");
    }
    if (layersMissingAttribution.length > 0) {
      reasonParts.push(
        `${layersMissingAttribution.length} visible layer${layersMissingAttribution.length === 1 ? "" : "s"} lack layer-level license or attribution metadata${namedLayers ? `: ${namedLayers}` : ""}.`,
      );
    }
    blockers.push({
      criterion: "attribution-license",
      label: "Attribution and license",
      reason: reasonParts.join(" "),
      recommendedFix: layersMissingAttribution.length > 0
        ? "Attach source license or attribution metadata to each visible layer before exporting the figure."
        : "Enable Attribution and provide source/license text derived from the visible layers.",
    });
  }

  if (!figure.crs && !blockers.some((gap) => gap.criterion === "crs-measurement")) {
    blockers.push({
      criterion: "crs-measurement",
      label: "Coordinate reference system",
      reason: "No visible layer declares a known CRS; a publication figure needs an explicit coordinate reference system.",
      recommendedFix: "Declare a CRS on at least one visible layer before composing the figure.",
    });
  }

  const ok = blockers.length === 0;
  const status: MapPublicationReadinessStatus = ok ? figure.readiness.status : "blocked";
  return { ok, status, blockers, warnings };
}

/** Convenience for the UI/toast: the first named blocking reason, if any. */
export function assertFigureExportable(figure: MapFigureSpec): { ok: boolean; blockedReason?: string } {
  const preflight = preflightMapFigure(figure);
  if (preflight.ok) return { ok: true };
  const first = preflight.blockers[0];
  return { ok: false, blockedReason: first ? `${first.label}: ${first.reason}` : "Figure export is blocked." };
}

export const MapLayoutComposer = {
  compose: composeMapFigure,
  preflight: preflightMapFigure,
  assertExportable: assertFigureExportable,
};

// --- V2 additions ---

export type MapLayoutPageSize = "A4" | "A3" | "Letter";
export type MapLayoutOrientation = "portrait" | "landscape";
export type MapLayoutDPI = 72 | 150 | 300;

export interface MapLayoutPreset {
  pageSize: MapLayoutPageSize;
  orientation: MapLayoutOrientation;
  dpi: MapLayoutDPI;
  label: string;
}

export const LAYOUT_PRESETS: readonly MapLayoutPreset[] = [
  { pageSize: "A4", orientation: "portrait", dpi: 150, label: "A4 Portrait · 150 DPI" },
  { pageSize: "A4", orientation: "landscape", dpi: 150, label: "A4 Landscape · 150 DPI" },
  { pageSize: "A3", orientation: "landscape", dpi: 150, label: "A3 Landscape · 150 DPI" },
  { pageSize: "Letter", orientation: "portrait", dpi: 72, label: "Letter Portrait · 72 DPI (web)" },
];

export interface MapPageSlot {
  kind: "chart" | "table" | "text";
  label: string;
}

export interface MapPageInput extends ComposeMapFigureInput {
  pageNumber: number;
  dynamicText?: string;
  showInsetMap?: boolean;
  slots?: MapPageSlot[];
}

export interface MapBookPage {
  pageNumber: number;
  figure: MapFigureSpec;
  dynamicText: string;
  showInsetMap: boolean;
  slots: MapPageSlot[];
}

export interface MapBookSpec {
  id: string;
  createdAt: string;
  preset: MapLayoutPreset;
  pages: MapBookPage[];
  /** True when every page passes preflight. */
  exportable: boolean;
}

/** Serialisable state used to restore a layout across sessions. */
export interface MapFigureRestoreMetadata {
  version: 1;
  presetIndex: number;
  pages: Array<{
    pageNumber: number;
    title: string;
    dynamicText: string;
    showInsetMap: boolean;
    slots: MapPageSlot[];
    includeAttribution: boolean;
    includeLegend: boolean;
    includeScaleBar: boolean;
    includeNorthArrow: boolean;
  }>;
}

export function composeMapBook(
  pageInputs: MapPageInput[],
  preset: MapLayoutPreset,
  now?: Date,
): MapBookSpec {
  const createdAt = (now ?? new Date()).toISOString();
  const sorted = [...pageInputs].sort((a, b) => a.pageNumber - b.pageNumber);
  const pages: MapBookPage[] = sorted.map((input) => ({
    pageNumber: input.pageNumber,
    figure: composeMapFigure({ ...input, now: now ?? new Date() }),
    dynamicText: input.dynamicText ?? "",
    showInsetMap: input.showInsetMap ?? false,
    slots: input.slots ?? [],
  }));
  const exportable = pages.every((page) => preflightMapFigure(page.figure).ok);
  return {
    id: `map-book-${createdAt}`,
    createdAt,
    preset,
    pages,
    exportable,
  };
}

export function serializeLayoutRestoreMetadata(
  presetIndex: number,
  pages: MapPageInput[],
): MapFigureRestoreMetadata {
  return {
    version: 1,
    presetIndex,
    pages: pages.map((p) => ({
      pageNumber: p.pageNumber,
      title: p.title ?? "",
      dynamicText: p.dynamicText ?? "",
      showInsetMap: p.showInsetMap ?? false,
      slots: p.slots ?? [],
      includeAttribution: p.composition?.includeAttribution ?? true,
      includeLegend: p.composition?.includeLegend ?? true,
      includeScaleBar: p.composition?.includeScaleBar ?? true,
      includeNorthArrow: p.composition?.includeNorthArrow ?? true,
    })),
  };
}

export function restorePageInputsFromMetadata(
  meta: MapFigureRestoreMetadata,
  overlayLayers: import("@/centerpanel/components/map/mapTypes").OverlayLayerConfig[],
): { presetIndex: number; pages: MapPageInput[] } {
  return {
    presetIndex: meta.presetIndex,
    pages: meta.pages.map((p) => ({
      pageNumber: p.pageNumber,
      overlayLayers,
      title: p.title,
      dynamicText: p.dynamicText,
      showInsetMap: p.showInsetMap,
      slots: p.slots,
      composition: {
        includeAttribution: p.includeAttribution,
        includeLegend: p.includeLegend,
        includeScaleBar: p.includeScaleBar,
        includeNorthArrow: p.includeNorthArrow,
      },
    })),
  };
}
