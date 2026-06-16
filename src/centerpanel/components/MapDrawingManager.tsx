/* ================================================================== */
/*  MapDrawingManager                                                  */
/*  Manages drawing interactions on the MapLibre GL canvas.            */
/*  Renders ghost feedback, vertex handles, and the feature sidebar.   */
/*  presentation="floating"  → legacy draggable floating panel         */
/*  presentation="embedded"  → scrollable body for the right dock      */
/*  presentation="modal"     → body for the draggable drawing dialog   */
/*  presentation="headless"  → canvas-only controller, no sidebar UI   */
/* ================================================================== */

import React, { useCallback, useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import type { DrawnFeature, DrawnGeometryValidation, DrawToolId, FeatureStyle } from "./map/mapTypes";
import {
  summarizeDrawnGeometryValidation,
  validateDrawnGeometry,
  visitDrawnGeometryPositions,
} from "@/services/map/DrawnGeometryValidation";
import {
  IconCircle,
  IconLine,
  IconPencil,
  IconPoint,
  IconPolygon,
  IconRectangle,
  IconTrash,
  IconUnknown,
} from "./map/MapIcons";
import {
  IconEyeClosed,
  IconEyeOpen,
  IconExport,
  IconGlobe,
  IconImport,
  IconLayers,
} from "./map/MapIcons";
import { GisEmptyState, GisSectionHeader } from "./map/ui";
import { getNextDrawToolRailIndex } from "./map/mapDrawToolPreferences";
import { formatArea, formatDistance, type UnitSystem } from "../../utils/geodesic";
import {
  measureDrawnGeometry,
  summarizeDrawnGeometries,
} from "../../utils/drawFeatureMeasure";
import {
  drawnFeaturesToGeoJSON,
  duplicateDrawnFeature,
  geometryBounds,
  parseDrawnFeaturesFromGeoJSON,
} from "./map/drawGeometryOps";
import motionStyles from "./map/design/motion.module.css";
import drawModalStyles from "./MapDrawingManager.module.css";
import {
  drawId,
  featureCollection,
  haversineDistance,
  isWithinPixels,
  makeCircle,
  makeLineString,
  makePoint,
  makePolygon,
  makeRectangle,
} from "../../utils/drawingHelpers";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_ICON_SIZES,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
  resolveMapPaintColor,
} from "./map/mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./map/useDraggableMapPanel";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const SNAP_TOLERANCE_PX = 10;
const SNAP_VISIBLE_LAYER_VERTEX_LIMIT = 4_000;
const DRAW_SOURCE = "synapse-draw-src";
const DRAW_FILL_LAYER = "synapse-draw-fill";
const DRAW_LINE_LAYER = "synapse-draw-line";
const DRAW_VERTEX_LAYER = "synapse-draw-vertex";
const GHOST_SOURCE = "synapse-ghost-src";
const GHOST_LINE_LAYER = "synapse-ghost-line";
const GHOST_FILL_LAYER = "synapse-ghost-fill";
const GHOST_VERTEX_LAYER = "synapse-ghost-vertex";
const GHOST_SNAP_LAYER = "synapse-ghost-snap";

const DRAW_TOOL_LABELS: Record<DrawToolId, string> = {
  point: "Point",
  linestring: "Line",
  polygon: "Polygon",
  rectangle: "Rectangle",
  circle: "Circle",
};

/** Default style applied when the user opens the style editor on a feature. */
export const DEFAULT_DRAW_FEATURE_STYLE: Required<FeatureStyle> = {
  strokeColor: "#3794ff",
  fillColor: "#3794ff",
  strokeWidth: 2,
  fillOpacity: 0.15,
};

/** Restrained palette presets for quick per-feature recolouring. */
export const DRAW_STYLE_SWATCHES: readonly string[] = [
  "#3794ff",
  "#4ec27d",
  "#f5a623",
  "#e8633a",
  "#b56bd6",
  "#d7dce5",
];

/**
 * Map a FeatureStyle into the `_*` render properties consumed by the
 * data-driven MapLibre paint expressions. Only defined keys are emitted so
 * the layer falls back to the accent for unstyled features.
 */
function drawStyleRenderProps(style: FeatureStyle | undefined): Record<string, string | number> {
  if (!style) return {};
  const props: Record<string, string | number> = {};
  if (style.strokeColor) props._strokeColor = style.strokeColor;
  if (style.fillColor) props._fillColor = style.fillColor;
  if (typeof style.strokeWidth === "number") props._strokeWidth = style.strokeWidth;
  if (typeof style.fillOpacity === "number") props._fillOpacity = style.fillOpacity;
  return props;
}

/** Returns false if the MapLibre instance has already been destroyed via map.remove(). */
const isMapAlive = (map: maplibregl.Map): boolean => {
  try {
    // After map.remove(), map.style is nullified.
    // getStyle() returns undefined silently; getLayer() throws.
    return map.getStyle() != null;
  } catch {
    return false;
  }
};

function getDrawnValidationLabel(status: DrawnGeometryValidation["status"] | undefined): string {
  if (status === "valid") return "Validated";
  if (status === "warning") return "Needs review";
  if (status === "blocked") return "Invalid";
  return "Validation unknown";
}

function getDrawnValidationColor(status: DrawnGeometryValidation["status"] | undefined): string {
  if (status === "valid") return MAP_COLORS.success;
  if (status === "warning" || status === "unknown") return MAP_COLORS.warning;
  if (status === "blocked") return MAP_COLORS.error;
  return MAP_COLORS.textMuted;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneDrawnFeature(feature: DrawnFeature): DrawnFeature {
  return {
    id: feature.id,
    geometry: cloneJson(feature.geometry),
    properties: cloneJson(feature.properties),
  };
}

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapDrawingSnapSource {
  id: string;
  name: string;
  featureCollection: GeoJSON.FeatureCollection;
}

export type MapDrawingManagerPresentation = "floating" | "embedded" | "modal" | "headless";

export interface MapDrawingManagerProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  activeDrawTool: DrawToolId | null;
  /**
   * When `"floating"` (default): renders the classic draggable floating sidebar.
   * When `"embedded"`: renders the feature list as a scrollable body suitable for
   * embedding inside the `MapRightDockHost` draw panel.
   * When `"modal"`: renders the same feature controls inside the draggable Draw dialog.
   * When `"headless"`: keeps drawing/map interaction logic active without
   * rendering sidebar chrome inside the modal.
   */
  presentation?: MapDrawingManagerPresentation;
  sidebarVisible?: boolean;
  seedDrawStart?: {
    coordinate: [number, number];
    tool: DrawToolId;
    token: number;
  } | null;
  drawnFeatures: DrawnFeature[];
  snapSources?: readonly MapDrawingSnapSource[];
  selectedFeatureId: string | null;
  onAddFeature: (feature: DrawnFeature) => void;
  onRemoveFeature: (id: string) => void;
  onUpdateFeature: (id: string, patch: Partial<DrawnFeature>) => void;
  onCommitFeatureEdit?: (id: string, before: DrawnFeature, after: DrawnFeature) => void;
  onClearFeatures: () => void;
  onSelectFeature: (id: string | null) => void;
  onCancelDraw: () => void;
  onSeedHandled?: (token: number) => void;
  onAnnounce?: (msg: string) => void;
  /**
   * Activates a draw tool (or `null` for Select). When provided, the `"modal"`
   * presentation renders the premium tool rail in-body so the modal owns its
   * own tool selection instead of relying on a duplicate rail in the host.
   */
  onSetDrawTool?: (tool: DrawToolId | null) => void;
}

/* ================================================================== */
/*  Sidebar styles                                                     */
/* ================================================================== */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(MAP_DIMENSIONS.drawingPanelWidth),
};

const headerStyle: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
};

const rowStyle: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  cursor: "pointer",
};

const rowSelectedStyle: React.CSSProperties = {
  ...rowStyle,
  ...mapStyles.sidePanelRowActive,
};

const smallBtn: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  minHeight: "1.5rem",
};

const emptyStyle: React.CSSProperties = {
  ...mapStyles.sidePanelEmpty,
};

const modalBodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  background: MAP_COLORS.bgPanel,
};

/* ================================================================== */
/*  Modal tool rail — premium segmented control (p06)                  */
/* ================================================================== */

interface DrawToolRailEntry {
  id: DrawToolId | null;
  label: string;
  title: string;
}

/** Rail order mirrors MODAL_DRAW_TOOL_RAIL so roving-tabindex indices align. */
const DRAW_TOOL_RAIL_META: readonly DrawToolRailEntry[] = [
  { id: null, label: "Select", title: "Select / edit drawn features" },
  { id: "point", label: "Point", title: "Draw point" },
  { id: "linestring", label: "Line", title: "Draw line" },
  { id: "polygon", label: "Polygon", title: "Draw polygon" },
  { id: "rectangle", label: "Rect", title: "Draw rectangle" },
  { id: "circle", label: "Circle", title: "Draw circle" },
];

/** Icon for a rail tool; colour inherits the button's CSS `currentColor`. */
function renderDrawToolIcon(id: DrawToolId | null): React.ReactNode {
  switch (id) {
    case "point":
      return <IconPoint size={13} />;
    case "linestring":
      return <IconLine size={13} />;
    case "polygon":
      return <IconPolygon size={13} />;
    case "rectangle":
      return <IconRectangle size={13} />;
    case "circle":
      return <IconCircle size={13} />;
    default:
      return <IconPencil size={13} />;
  }
}

const ModalDrawToolRail: React.FC<{
  activeTool: DrawToolId | null;
  onSelect: (tool: DrawToolId | null) => void;
}> = ({ activeTool, onSelect }) => {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = DRAW_TOOL_RAIL_META.findIndex((entry) => entry.id === activeTool);
  // Roving tabindex anchor: the active tool, else the rail head (Select).
  const tabStopIndex = activeIndex >= 0 ? activeIndex : 0;

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const nextIndex = getNextDrawToolRailIndex(index, event.key, DRAW_TOOL_RAIL_META.length);
    if (nextIndex === null) return;
    event.preventDefault();
    event.stopPropagation();
    buttonsRef.current[nextIndex]?.focus();
  };

  return (
    <div
      role="toolbar"
      aria-label="Draw tools"
      aria-orientation="horizontal"
      className={drawModalStyles.toolRail}
    >
      {DRAW_TOOL_RAIL_META.map((entry, index) => {
        const active = entry.id === activeTool;
        return (
          <React.Fragment key={entry.label}>
            {index > 0 ? <span aria-hidden="true" className={drawModalStyles.toolSep} /> : null}
            <button
              type="button"
              ref={(el) => {
                buttonsRef.current[index] = el;
              }}
              aria-pressed={active}
              data-active={active ? "true" : undefined}
              tabIndex={index === tabStopIndex ? 0 : -1}
              title={entry.title}
              className={drawModalStyles.toolButton}
              onClick={() => onSelect(entry.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {renderDrawToolIcon(entry.id)}
              <span className={drawModalStyles.toolLabel}>{entry.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ================================================================== */
/*  Modal body — pro, multi-functional drawing workspace (p06+)        */
/* ================================================================== */

function geometryRowIcon(type: string, selected: boolean): React.ReactNode {
  const color = selected ? MAP_COLORS.interaction : MAP_COLORS.textMuted;
  if (type === "Point") return <IconPoint size={MAP_ICON_SIZES.sm} color={color} />;
  if (type === "LineString") return <IconLine size={MAP_ICON_SIZES.sm} color={color} />;
  if (type === "Polygon") return <IconPolygon size={MAP_ICON_SIZES.sm} color={color} />;
  return <IconUnknown size={MAP_ICON_SIZES.sm} color={color} />;
}

function rowMeasureSummary(geometry: GeoJSON.Geometry, unit: UnitSystem): string {
  const m = measureDrawnGeometry(geometry);
  if (m.kind === "polygon") return formatArea(m.areaM2 ?? 0, unit);
  if (m.kind === "line") return formatDistance(m.lengthM ?? 0, unit);
  if (m.kind === "point") return "point";
  return "—";
}

interface DrawModalBodyProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  activeDrawTool: DrawToolId | null;
  drawnFeatures: DrawnFeature[];
  selectedFeatureId: string | null;
  onSetDrawTool: (tool: DrawToolId | null) => void;
  onAddFeature: (feature: DrawnFeature) => void;
  onRemoveFeature: (id: string) => void;
  onUpdateFeature: (id: string, patch: Partial<DrawnFeature>) => void;
  onClearFeatures: () => void;
  onSelectFeature: (id: string | null) => void;
  onAnnounce?: (msg: string) => void;
}

const DrawModalBody: React.FC<DrawModalBodyProps> = ({
  mapRef,
  activeDrawTool,
  drawnFeatures,
  selectedFeatureId,
  onSetDrawTool,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
  onClearFeatures,
  onSelectFeature,
  onAnnounce,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkSelection, setBulkSelection] = useState<ReadonlySet<string>>(() => new Set());
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeToolLabel = activeDrawTool ? DRAW_TOOL_LABELS[activeDrawTool] : "Select";
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = normalizedQuery
    ? drawnFeatures.filter(
        (f) =>
          f.properties.label.toLowerCase().includes(normalizedQuery) ||
          f.geometry.type.toLowerCase().includes(normalizedQuery),
      )
    : drawnFeatures;
  const selectedFeature = drawnFeatures.find((f) => f.id === selectedFeatureId) ?? null;
  const summary = summarizeDrawnGeometries(drawnFeatures.map((f) => f.geometry));
  const bulkCount = bulkSelection.size;
  const allFilteredSelected = filtered.length > 0 && filtered.every((f) => bulkSelection.has(f.id));

  const toggleBulk = (id: string) =>
    setBulkSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setBulkSelection((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((f) => next.delete(f.id));
      else filtered.forEach((f) => next.add(f.id));
      return next;
    });

  const handleBulkDelete = () => {
    const ids = [...bulkSelection];
    if (ids.length === 0) return;
    ids.forEach((id) => onRemoveFeature(id));
    if (selectedFeatureId && bulkSelection.has(selectedFeatureId)) onSelectFeature(null);
    setBulkSelection(new Set());
    onAnnounce?.(`Deleted ${ids.length} feature${ids.length === 1 ? "" : "s"}`);
  };

  const handleZoomTo = (feature: DrawnFeature) => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = geometryBounds(feature.geometry);
    if (!bounds) return;
    const samePoint = bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1];
    try {
      if (samePoint) {
        map.easeTo({ center: [bounds[0][0], bounds[0][1]], zoom: Math.max(map.getZoom(), 15), duration: 500 });
      } else {
        map.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 600 });
      }
      onAnnounce?.(`Zoomed to ${feature.properties.label}`);
    } catch {
      /* map may be mid-transition — ignore */
    }
  };

  const handleDuplicate = (feature: DrawnFeature) => {
    const copy = duplicateDrawnFeature(feature);
    onAddFeature(copy);
    onSelectFeature(copy.id);
    onAnnounce?.(`Duplicated ${feature.properties.label}`);
  };

  const toggleVisibility = (feature: DrawnFeature) => {
    const willHide = !feature.properties.hidden;
    onUpdateFeature(feature.id, { properties: { ...feature.properties, hidden: willHide } });
    onAnnounce?.(`${feature.properties.label} ${willHide ? "hidden" : "shown"}`);
  };

  const startRename = (feature: DrawnFeature) => {
    setRenameId(feature.id);
    setRenameDraft(feature.properties.label);
  };

  const commitRename = (feature: DrawnFeature) => {
    const name = renameDraft.trim();
    if (name && name !== feature.properties.label) {
      onUpdateFeature(feature.id, { properties: { ...feature.properties, label: name } });
      onAnnounce?.(`Renamed to ${name}`);
    }
    setRenameId(null);
  };

  const updateStyle = (feature: DrawnFeature, patch: Partial<FeatureStyle>) => {
    const style = { ...DEFAULT_DRAW_FEATURE_STYLE, ...feature.properties.style, ...patch };
    onUpdateFeature(feature.id, { properties: { ...feature.properties, style } });
  };

  const handleExport = () => {
    if (drawnFeatures.length === 0) return;
    const fc = drawnFeaturesToGeoJSON(drawnFeatures);
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `drawings-${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onAnnounce?.(`Exported ${drawnFeatures.length} drawing${drawnFeatures.length === 1 ? "" : "s"} as GeoJSON`);
  };

  const handleCopy = async () => {
    if (drawnFeatures.length === 0) return;
    const text = JSON.stringify(drawnFeaturesToGeoJSON(drawnFeatures), null, 2);
    try {
      await navigator.clipboard?.writeText(text);
      onAnnounce?.("Copied GeoJSON to clipboard");
    } catch {
      onAnnounce?.("Clipboard unavailable — use Export instead");
    }
  };

  const applyImport = (text: string) => {
    const result = parseDrawnFeaturesFromGeoJSON(text);
    if (result.error) {
      setImportError(result.error);
      return;
    }
    result.features.forEach((f) => onAddFeature(f));
    setImportError(null);
    setImportText("");
    setShowImport(false);
    onAnnounce?.(
      `Imported ${result.features.length} feature${result.features.length === 1 ? "" : "s"}` +
        (result.skipped ? `, skipped ${result.skipped}` : ""),
    );
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      setShowImport(true);
      setImportText(text);
      applyImport(text);
    } catch {
      setImportError("Could not read the selected file.");
    }
  };

  const rowFlexStyle = (selected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    borderBottom: MAP_STROKES.hairlineSubtle,
    background: selected ? MAP_COLORS.selectedSubtle : "transparent",
    cursor: "pointer",
  });

  const selectedMeasure = selectedFeature ? measureDrawnGeometry(selectedFeature.geometry) : null;
  const selectedStyle = { ...DEFAULT_DRAW_FEATURE_STYLE, ...(selectedFeature?.properties.style ?? {}) };

  const statusParts: string[] = [`${summary.count} feature${summary.count === 1 ? "" : "s"}`];
  if (summary.totalAreaM2 > 0) statusParts.push(formatArea(summary.totalAreaM2, unitSystem));
  if (summary.totalLengthM > 0) statusParts.push(formatDistance(summary.totalLengthM, unitSystem));

  return (
    <div
      className={motionStyles.panelIn}
      style={modalBodyStyle}
      role="region"
      aria-label="Drawing modal workspace"
      data-testid="map-draw-modal-body"
    >
      <ModalDrawToolRail activeTool={activeDrawTool} onSelect={onSetDrawTool} />

      {/* Calm one-line status summary with live totals */}
      <div className={drawModalStyles.statusLine} aria-label="Drawing status">
        <span>
          <span className={drawModalStyles.statusStrong}>{activeToolLabel}</span> tool
        </span>
        {statusParts.map((part, index) => (
          <React.Fragment key={part + index}>
            <span className={drawModalStyles.statusMuted} aria-hidden="true">·</span>
            <span>{part}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Action bar — search + units + import/export */}
      <div className={drawModalStyles.actionBar}>
        <input
          type="search"
          className={drawModalStyles.searchInput}
          placeholder="Search drawings…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search drawn features"
        />
        <button
          type="button"
          className={drawModalStyles.chipButton}
          onClick={() => setUnitSystem((u) => (u === "metric" ? "imperial" : "metric"))}
          title="Toggle measurement units"
          aria-label={`Units: ${unitSystem}. Toggle metric / imperial`}
        >
          {unitSystem === "metric" ? "m" : "ft"}
        </button>
        <button
          type="button"
          className={drawModalStyles.chipButton}
          onClick={() => {
            setShowImport((v) => !v);
            setImportError(null);
          }}
          aria-expanded={showImport}
          title="Import GeoJSON"
        >
          <IconImport size={12} /> Import
        </button>
        <button
          type="button"
          className={drawModalStyles.chipButton}
          onClick={handleCopy}
          disabled={drawnFeatures.length === 0}
          title="Copy all drawings as GeoJSON"
        >
          Copy
        </button>
        <button
          type="button"
          className={drawModalStyles.chipButton}
          onClick={handleExport}
          disabled={drawnFeatures.length === 0}
          title="Download all drawings as GeoJSON"
        >
          <IconExport size={12} /> Export
        </button>
      </div>

      {/* Import drawer */}
      {showImport ? (
        <div style={{ display: "flex", flexDirection: "column", gap: MAP_SPACING.xs, padding: `${MAP_SPACING.sm}`, borderBottom: MAP_STROKES.hairlineSubtle }}>
          <textarea
            className={drawModalStyles.importArea}
            placeholder="Paste GeoJSON (FeatureCollection, Feature, or Geometry)…"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            aria-label="GeoJSON to import"
          />
          {importError ? <span className={drawModalStyles.importError}>{importError}</span> : null}
          <div style={{ display: "flex", gap: MAP_SPACING.xs }}>
            <button
              type="button"
              className={drawModalStyles.chipButton}
              onClick={() => applyImport(importText)}
              disabled={importText.trim().length === 0}
            >
              Add features
            </button>
            <button
              type="button"
              className={drawModalStyles.chipButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Load file…
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>
      ) : null}

      <GisSectionHeader
        title={normalizedQuery ? `Drawn features (${filtered.length}/${drawnFeatures.length})` : "Drawn features"}
        compact
        actions={
          drawnFeatures.length > 0 ? (
            <>
              {filtered.length > 0 ? (
                <label
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs, cursor: "pointer" }}
                  title="Select all (for bulk delete)"
                >
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} aria-label="Select all drawn features" />
                  All
                </label>
              ) : null}
              {bulkCount > 0 ? (
                <button
                  type="button"
                  className={`${drawModalStyles.chipButton} ${drawModalStyles.chipButtonDanger}`}
                  onClick={handleBulkDelete}
                  aria-label={`Delete ${bulkCount} selected features`}
                >
                  <IconTrash size={11} /> {bulkCount}
                </button>
              ) : (
                <button type="button" style={smallBtn} onClick={onClearFeatures} aria-label="Clear all drawn features">
                  Clear all
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {/* Feature list */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {drawnFeatures.length === 0 ? (
          <GisEmptyState
            icon={<IconPencil size={20} />}
            title="No drawn features"
            description="Pick a tool above to start sketching on the map."
            data-testid="map-draw-modal-empty"
          />
        ) : filtered.length === 0 ? (
          <GisEmptyState title="No matches" description={`Nothing matches “${searchQuery}”.`} compact />
        ) : (
          <div role="listbox" aria-label="Drawn feature list">
            {filtered.map((f) => {
              const isSelected = f.id === selectedFeatureId;
              const isHidden = Boolean(f.properties.hidden);
              return (
                <div
                  key={f.id}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={`${f.properties.label} — ${f.geometry.type}`}
                  style={{ ...rowFlexStyle(isSelected), opacity: isHidden ? 0.55 : 1 }}
                  onClick={() => onSelectFeature(isSelected ? null : f.id)}
                >
                  <input
                    type="checkbox"
                    checked={bulkSelection.has(f.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleBulk(f.id)}
                    aria-label={`Select ${f.properties.label}`}
                  />
                  <button
                    type="button"
                    className={drawModalStyles.rowIconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(f);
                    }}
                    aria-label={isHidden ? `Show ${f.properties.label}` : `Hide ${f.properties.label}`}
                    title={isHidden ? "Show on map" : "Hide on map"}
                  >
                    {isHidden ? <IconEyeClosed size={13} /> : <IconEyeOpen size={13} />}
                  </button>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
                    {geometryRowIcon(f.geometry.type, isSelected)}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 2 }}>
                    {renameId === f.id ? (
                      <input
                        autoFocus
                        className={drawModalStyles.searchInput}
                        value={renameDraft}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={() => commitRename(f)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") commitRename(f);
                          else if (e.key === "Escape") setRenameId(null);
                        }}
                        aria-label={`Rename ${f.properties.label}`}
                      />
                    ) : (
                      <span
                        title="Double-click to rename"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startRename(f);
                        }}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: isSelected ? MAP_COLORS.interaction : MAP_COLORS.text,
                          fontWeight: isSelected ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
                        }}
                      >
                        {f.properties.label}
                      </span>
                    )}
                    <span style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                      {f.geometry.type} · {rowMeasureSummary(f.geometry, unitSystem)}
                    </span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                    <button
                      type="button"
                      className={drawModalStyles.rowIconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoomTo(f);
                      }}
                      aria-label={`Zoom to ${f.properties.label}`}
                      title="Zoom to feature"
                    >
                      <IconGlobe size={13} />
                    </button>
                    <button
                      type="button"
                      className={drawModalStyles.rowIconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(f);
                      }}
                      aria-label={`Duplicate ${f.properties.label}`}
                      title="Duplicate"
                    >
                      <IconLayers size={13} />
                    </button>
                    <button
                      type="button"
                      className={drawModalStyles.rowIconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFeature(f.id);
                        if (isSelected) onSelectFeature(null);
                        onAnnounce?.(`${f.properties.label} removed`);
                      }}
                      aria-label={`Delete ${f.properties.label}`}
                      title="Delete"
                    >
                      <IconTrash size={13} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Inspector — measurements + style editor for the selected feature.
            Lives inside the scroll region so it never gets clipped. */}
        {selectedFeature && selectedMeasure ? (
        <div className={drawModalStyles.inspector} data-testid="map-draw-modal-inspector">
          <GisSectionHeader title={`Inspector · ${selectedFeature.properties.label}`} compact separator={false} />
          <div className={drawModalStyles.metricGrid}>
            <div className={drawModalStyles.metricCell}>
              <span className={drawModalStyles.metricLabel}>Type</span>
              <span className={drawModalStyles.metricValue}>{selectedFeature.geometry.type}</span>
            </div>
            <div className={drawModalStyles.metricCell}>
              <span className={drawModalStyles.metricLabel}>Vertices</span>
              <span className={drawModalStyles.metricValue}>{selectedMeasure.vertexCount}</span>
            </div>
            {selectedMeasure.kind === "polygon" ? (
              <>
                <div className={drawModalStyles.metricCell}>
                  <span className={drawModalStyles.metricLabel}>Area</span>
                  <span className={drawModalStyles.metricValue}>{formatArea(selectedMeasure.areaM2 ?? 0, unitSystem)}</span>
                </div>
                <div className={drawModalStyles.metricCell}>
                  <span className={drawModalStyles.metricLabel}>Perimeter</span>
                  <span className={drawModalStyles.metricValue}>{formatDistance(selectedMeasure.perimeterM ?? 0, unitSystem)}</span>
                </div>
              </>
            ) : selectedMeasure.kind === "line" ? (
              <div className={drawModalStyles.metricCell}>
                <span className={drawModalStyles.metricLabel}>Length</span>
                <span className={drawModalStyles.metricValue}>{formatDistance(selectedMeasure.lengthM ?? 0, unitSystem)}</span>
              </div>
            ) : null}
            <div className={drawModalStyles.metricCell} style={{ gridColumn: "1 / -1" }}>
              <span className={drawModalStyles.metricLabel}>Centroid (lat, lng)</span>
              <span className={drawModalStyles.metricValue}>
                {selectedMeasure.centroid
                  ? `${selectedMeasure.centroid[1].toFixed(5)}, ${selectedMeasure.centroid[0].toFixed(5)}`
                  : "—"}
              </span>
            </div>
          </div>

          <div style={{ borderTop: MAP_STROKES.hairlineSubtle }}>
            <div className={drawModalStyles.styleRow}>
              <span className={drawModalStyles.styleLabel}>Colour</span>
              <div className={drawModalStyles.swatchRow}>
                {DRAW_STYLE_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    className={drawModalStyles.swatch}
                    style={{ background: swatch }}
                    onClick={() => updateStyle(selectedFeature, { strokeColor: swatch, fillColor: swatch })}
                    aria-label={`Set colour ${swatch}`}
                    title={swatch}
                  />
                ))}
                <input
                  type="color"
                  value={selectedStyle.strokeColor}
                  onChange={(e) => updateStyle(selectedFeature, { strokeColor: e.target.value, fillColor: e.target.value })}
                  aria-label="Custom feature colour"
                  style={{ width: 24, height: 18, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
                />
              </div>
            </div>
            <div className={drawModalStyles.styleRow}>
              <span className={drawModalStyles.styleLabel}>Width</span>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={selectedStyle.strokeWidth}
                onChange={(e) => updateStyle(selectedFeature, { strokeWidth: Number(e.target.value) })}
                aria-label="Stroke width"
                style={{ flex: 1 }}
              />
              <span className={drawModalStyles.metricValue} style={{ minWidth: "2.5rem", textAlign: "right" }}>
                {selectedStyle.strokeWidth}px
              </span>
            </div>
            <div className={drawModalStyles.styleRow}>
              <span className={drawModalStyles.styleLabel}>Fill</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedStyle.fillOpacity}
                onChange={(e) => updateStyle(selectedFeature, { fillOpacity: Number(e.target.value) })}
                aria-label="Fill opacity"
                style={{ flex: 1 }}
              />
              <span className={drawModalStyles.metricValue} style={{ minWidth: "2.5rem", textAlign: "right" }}>
                {Math.round(selectedStyle.fillOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapDrawingManager: React.FC<MapDrawingManagerProps> = ({
  mapRef,
  activeDrawTool,
  presentation = "floating",
  sidebarVisible = true,
  seedDrawStart = null,
  drawnFeatures,
  snapSources = [],
  selectedFeatureId,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
  onCommitFeatureEdit,
  onClearFeatures,
  onSelectFeature,
  onCancelDraw,
  onSeedHandled,
  onAnnounce,
  onSetDrawTool,
}) => {
  /* ---- Refs for transient drawing state (NOT React state to avoid
         excessive re-renders during mousemove) ---- */
  const verticesRef = useRef<[number, number][]>([]);
  const cursorRef = useRef<[number, number] | null>(null);
  const snapRef = useRef<[number, number] | null>(null);
  const dragStartRef = useRef<[number, number] | null>(null);
  const isDrawingRef = useRef(false);
  const activeToolRef = useRef(activeDrawTool);
  const featuresRef = useRef(drawnFeatures);
  const snapSourcesRef = useRef<readonly MapDrawingSnapSource[]>(snapSources);
  const handledSeedTokenRef = useRef<number | null>(null);
  // Last committed geometry signature + timestamp — used to drop accidental
  // duplicate commits of the same shape from doubled pointer events.
  const lastCommitRef = useRef<{ signature: string; at: number } | null>(null);
  // Last handled map click (coordinate + time) — collapses duplicate `click`
  // events fired for a single physical click so every tool gets exactly one
  // logical click per gesture (critical for the two-click circle/rectangle).
  const lastClickRef = useRef<{ key: string; at: number } | null>(null);

  /**
   * Only ONE instance may own the map canvas (sources, event handlers, cursor).
   * The `modal` / `embedded` UIs are always rendered alongside a `headless`
   * controller, so they must NOT attach map handlers — otherwise every click is
   * processed twice and shapes get duplicated. `headless` and the legacy
   * standalone `floating` panel are the canvas owners.
   */
  const managesCanvas = presentation === "headless" || presentation === "floating";

  // Keep refs in sync
  activeToolRef.current = activeDrawTool;
  featuresRef.current = drawnFeatures;
  snapSourcesRef.current = snapSources;

  /* ---- Editing state ---- */
  const editingRef = useRef<{
    featureId: string;
    vertexIndex: number;
    before: DrawnFeature;
    latest?: DrawnFeature;
  } | null>(null);

  /* ================================================================ */
  /*  MapLibre source/layer lifecycle                                  */
  /* ================================================================ */

  const ensureSources = useCallback((map: maplibregl.Map) => {
    if (!isMapAlive(map)) return;
    // MapLibre paint props cannot parse CSS var()/color-mix(); resolve first.
    const accentColor = resolveMapPaintColor(MAP_COLORS.interaction);
    const vertexStrokeColor = resolveMapPaintColor(MAP_COLORS.white);
    const bgColor = resolveMapPaintColor(MAP_COLORS.bg);
    try {
      if (!map.getSource(DRAW_SOURCE)) {
        map.addSource(DRAW_SOURCE, {
          type: "geojson",
          data: featureCollection([]),
        });
        map.addLayer({
          id: DRAW_FILL_LAYER,
          type: "fill",
          source: DRAW_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: {
            // Data-driven: per-feature style overrides fall back to the accent.
            "fill-color": ["coalesce", ["get", "_fillColor"], accentColor],
            "fill-opacity": ["coalesce", ["get", "_fillOpacity"], 0.15],
          },
        });
        map.addLayer({
          id: DRAW_LINE_LAYER,
          type: "line",
          source: DRAW_SOURCE,
          paint: {
            "line-color": ["coalesce", ["get", "_strokeColor"], accentColor],
            "line-width": ["coalesce", ["get", "_strokeWidth"], 2],
            "line-dasharray": [2, 2],
          },
        });
        map.addLayer({
          id: DRAW_VERTEX_LAYER,
          type: "circle",
          source: DRAW_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": accentColor,
            "circle-stroke-color": vertexStrokeColor,
            "circle-stroke-width": 2,
          },
        });
      }
      if (!map.getSource(GHOST_SOURCE)) {
        map.addSource(GHOST_SOURCE, {
          type: "geojson",
          data: featureCollection([]),
        });
        map.addLayer({
          id: GHOST_FILL_LAYER,
          type: "fill",
          source: GHOST_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "fill-color": accentColor,
            "fill-opacity": 0.08,
          },
        });
        map.addLayer({
          id: GHOST_LINE_LAYER,
          type: "line",
          source: GHOST_SOURCE,
          paint: {
            "line-color": accentColor,
            "line-width": 1.5,
            "line-dasharray": [4, 4],
          },
        });
        map.addLayer({
          id: GHOST_VERTEX_LAYER,
          type: "circle",
          source: GHOST_SOURCE,
          filter: ["all", ["==", "$type", "Point"], ["!=", "_snap", true]],
          paint: {
            "circle-radius": 4,
            "circle-color": accentColor,
            "circle-stroke-color": bgColor,
            "circle-stroke-width": 1.5,
          },
        });
        map.addLayer({
          id: GHOST_SNAP_LAYER,
          type: "circle",
          source: GHOST_SOURCE,
          filter: ["all", ["==", "$type", "Point"], ["==", "_snap", true]],
          paint: {
            "circle-radius": 7,
            "circle-color": bgColor,
            "circle-stroke-color": accentColor,
            "circle-stroke-width": 2.5,
          },
        });
      }
    } catch {
      /* Source/layer add may fail during style transitions — safe to ignore */
    }
  }, []);

  const removeSources = useCallback((map: maplibregl.Map) => {
    if (!isMapAlive(map)) return;
    for (const lid of [
      DRAW_FILL_LAYER,
      DRAW_LINE_LAYER,
      DRAW_VERTEX_LAYER,
      GHOST_SNAP_LAYER,
      GHOST_VERTEX_LAYER,
      GHOST_LINE_LAYER,
      GHOST_FILL_LAYER,
    ]) {
      if (map.getLayer(lid)) map.removeLayer(lid);
    }
    if (map.getSource(DRAW_SOURCE)) map.removeSource(DRAW_SOURCE);
    if (map.getSource(GHOST_SOURCE)) map.removeSource(GHOST_SOURCE);
  }, []);

  /* ================================================================ */
  /*  Render features to MapLibre                                      */
  /* ================================================================ */

  const syncFeaturesToMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    const src = map.getSource(DRAW_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    for (const f of featuresRef.current) {
      // Hidden features stay in state but are not drawn on the map.
      if (f.properties.hidden) continue;
      features.push({
        type: "Feature",
        geometry: f.geometry,
        properties: { ...f.properties, ...drawStyleRenderProps(f.properties.style), _fid: f.id },
      });
      // Also render vertex dots for editable features
      if (f.id === selectedFeatureId && f.geometry.type === "Polygon") {
        const ring = (f.geometry as GeoJSON.Polygon).coordinates[0];
        for (let i = 0; i < ring.length - 1; i++) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: ring[i] },
            properties: { _vertex: true, _fid: f.id, _vi: i },
          });
        }
      } else if (f.id === selectedFeatureId && f.geometry.type === "LineString") {
        const coords = (f.geometry as GeoJSON.LineString).coordinates;
        for (let i = 0; i < coords.length; i++) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: coords[i] },
            properties: { _vertex: true, _fid: f.id, _vi: i },
          });
        }
      }
    }
    src.setData(featureCollection(features));
  }, [mapRef, selectedFeatureId]);

  /* ================================================================ */
  /*  Ghost preview rendering                                          */
  /* ================================================================ */

  const syncGhost = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    const src = map.getSource(GHOST_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const verts = verticesRef.current;
    const cursor = snapRef.current ?? cursorRef.current;
    const tool = activeToolRef.current;

    if (!tool || !cursor) {
      src.setData(featureCollection([]));
      return;
    }

    const features: GeoJSON.Feature[] = [];

    if (snapRef.current) {
      features.push({
        type: "Feature",
        geometry: makePoint(snapRef.current),
        properties: { _snap: true },
      });
    }

    if (verts.length === 0) {
      src.setData(featureCollection(features));
      return;
    }

    if (tool === "linestring") {
      const coords = [...verts, cursor];
      features.push({
        type: "Feature",
        geometry: makeLineString(coords),
        properties: {},
      });
      // Vertex dots
      for (const c of verts) {
        features.push({
          type: "Feature",
          geometry: makePoint(c),
          properties: {},
        });
      }
    } else if (tool === "polygon") {
      const coords = [...verts, cursor, verts[0]];
      features.push({
        type: "Feature",
        geometry: makePolygon(coords),
        properties: {},
      });
      for (const c of verts) {
        features.push({
          type: "Feature",
          geometry: makePoint(c),
          properties: {},
        });
      }
    } else if (tool === "rectangle" && verts.length === 1) {
      features.push({
        type: "Feature",
        geometry: makeRectangle(verts[0], cursor),
        properties: {},
      });
    } else if (tool === "circle" && verts.length === 1) {
      const radius = haversineDistance(verts[0], cursor);
      features.push({
        type: "Feature",
        geometry: makeCircle(verts[0], radius),
        properties: {},
      });
    }

    src.setData(featureCollection(features));
  }, [mapRef]);

  /* ================================================================ */
  /*  Snap helper                                                      */
  /* ================================================================ */

  const trySnap = useCallback(
    (
      lngLat: [number, number],
      map: maplibregl.Map,
      excludeDrawnFeatureId?: string,
    ): [number, number] | null => {
      const pt = map.project(lngLat);
      let snapped: [number, number] | null = null;

      const inspectPosition = (position: readonly number[]): void => {
        if (snapped) return;
        if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) return;
        const candidate: [number, number] = [position[0]!, position[1]!];
        const cp = map.project(candidate);
        if (isWithinPixels(pt, cp, SNAP_TOLERANCE_PX)) {
          snapped = candidate;
        }
      };

      for (const f of featuresRef.current) {
        if (f.id === excludeDrawnFeatureId) continue;
        visitDrawnGeometryPositions(f.geometry, inspectPosition);
        if (snapped) return snapped;
      }

      let inspectedLayerVertices = 0;
      for (const source of snapSourcesRef.current) {
        for (const feature of source.featureCollection.features) {
          if (inspectedLayerVertices >= SNAP_VISIBLE_LAYER_VERTEX_LIMIT) return snapped;
          visitDrawnGeometryPositions(feature.geometry, (position) => {
            if (inspectedLayerVertices >= SNAP_VISIBLE_LAYER_VERTEX_LIMIT) return;
            inspectedLayerVertices += 1;
            inspectPosition(position);
          });
          if (snapped) return snapped;
        }
      }

      return snapped;
    },
    [],
  );

  /* ================================================================ */
  /*  Feature finalization helpers                                     */
  /* ================================================================ */

  const finishFeature = useCallback(
    (geometry: GeoJSON.Geometry, label: string) => {
      // Guard against an identical shape being committed twice in quick
      // succession (e.g. a duplicated pointer event finalising the same
      // rectangle/circle). Distinct shapes — or the same shape redrawn later —
      // are unaffected.
      const signature = JSON.stringify(geometry);
      const now = Date.now();
      if (
        lastCommitRef.current &&
        lastCommitRef.current.signature === signature &&
        now - lastCommitRef.current.at < 500
      ) {
        return;
      }

      const validation = validateDrawnGeometry(geometry);
      if (validation.status === "blocked") {
        onAnnounce?.(`${label} was not added: ${summarizeDrawnGeometryValidation(validation)}`);
        return;
      }
      lastCommitRef.current = { signature, at: now };

      const feature: DrawnFeature = {
        id: drawId(),
        geometry,
        properties: {
          label,
          createdAt: new Date().toISOString(),
          validation,
        },
      };
      onAddFeature(feature);
      onAnnounce?.(
        validation.status === "warning"
          ? `${label} added with geometry validation warnings`
          : `${label} added`,
      );

      /* Immediately push the new feature to the MapLibre source so it
         renders without waiting for the React re-render → useEffect cycle.
         The sync effect will overwrite this with the same data later. */
      const map = mapRef.current;
      if (map && isMapAlive(map)) {
        const src = map.getSource(DRAW_SOURCE) as maplibregl.GeoJSONSource | undefined;
        if (src) {
          const all = [...featuresRef.current, feature];
          const geoFeatures: GeoJSON.Feature[] = all
            .filter((f) => !f.properties.hidden)
            .map((f) => ({
              type: "Feature" as const,
              geometry: f.geometry,
              properties: { ...f.properties, ...drawStyleRenderProps(f.properties.style), _fid: f.id },
            }));
          src.setData(featureCollection(geoFeatures));
        }
      }

      // Reset transient drawing state
      verticesRef.current = [];
      cursorRef.current = null;
      snapRef.current = null;
      dragStartRef.current = null;
      isDrawingRef.current = false;
    },
    [onAddFeature, onAnnounce, mapRef],
  );

  const cancelDrawing = useCallback(() => {
    verticesRef.current = [];
    cursorRef.current = null;
    snapRef.current = null;
    dragStartRef.current = null;
    isDrawingRef.current = false;
    // Clear ghost
    const map = mapRef.current;
    if (map && isMapAlive(map)) {
      const src = map.getSource(GHOST_SOURCE) as maplibregl.GeoJSONSource | undefined;
      src?.setData(featureCollection([]));
    }
    onCancelDraw();
    onAnnounce?.("Drawing cancelled");
  }, [mapRef, onCancelDraw, onAnnounce]);

  /* ================================================================ */
  /*  MapLibre source/layer lifecycle + sync                           */
  /* ================================================================ */

  /* Keep a ref to syncFeaturesToMap so style.load handler can call
     it without adding it as an effect dependency (which would cause
     the source setup effect to re-run on every selectedFeatureId change). */
  const syncFeaturesRef = useRef(syncFeaturesToMap);
  syncFeaturesRef.current = syncFeaturesToMap;

  useEffect(() => {
    if (!managesCanvas) return undefined;
    const map = mapRef.current;
    if (!map) return undefined;

    const onStyleLoad = () => {
      if (!isMapAlive(map)) return;
      ensureSources(map);
      // Re-sync drawn features after sources are (re)created on style change
      syncFeaturesRef.current();
    };
    // Ensure sources survive style switches
    map.on("style.load", onStyleLoad);
    if (isMapAlive(map) && map.isStyleLoaded()) {
      ensureSources(map);
      syncFeaturesRef.current();
    }

    return () => {
      if (!isMapAlive(map)) return;
      map.off("style.load", onStyleLoad);
      removeSources(map);
    };
  }, [mapRef, ensureSources, removeSources, managesCanvas]);

  /* Sync drawn features whenever they change */
  useEffect(() => {
    if (!managesCanvas) return;
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    if (map.isStyleLoaded()) {
      syncFeaturesToMap();
    }
    // If style isn't loaded, the style.load handler above will sync after sources exist
  }, [mapRef, drawnFeatures, selectedFeatureId, syncFeaturesToMap, managesCanvas]);

  /* Reset any in-progress (uncommitted) sketch when the active tool changes,
     so a half-drawn rectangle/circle/line never leaks into the next tool. */
  useEffect(() => {
    if (!managesCanvas) return;
    verticesRef.current = [];
    cursorRef.current = null;
    snapRef.current = null;
    dragStartRef.current = null;
    isDrawingRef.current = false;
    const map = mapRef.current;
    if (map && isMapAlive(map)) {
      const ghost = map.getSource(GHOST_SOURCE) as maplibregl.GeoJSONSource | undefined;
      ghost?.setData(featureCollection([]));
    }
  }, [activeDrawTool, mapRef, managesCanvas]);

  useEffect(() => {
    if (!managesCanvas) return;
    if (!seedDrawStart || activeDrawTool !== seedDrawStart.tool) return;
    if (handledSeedTokenRef.current === seedDrawStart.token) return;
    handledSeedTokenRef.current = seedDrawStart.token;

    if (seedDrawStart.tool === "polygon" || seedDrawStart.tool === "linestring") {
      verticesRef.current = [seedDrawStart.coordinate];
      cursorRef.current = seedDrawStart.coordinate;
      dragStartRef.current = null;
      isDrawingRef.current = true;
      syncGhost();
      onAnnounce?.(
        `${seedDrawStart.tool === "polygon" ? "Polygon" : "Line"} drawing started from selected point`,
      );
      onSeedHandled?.(seedDrawStart.token);
    }
  }, [activeDrawTool, onAnnounce, onSeedHandled, seedDrawStart, syncGhost]);

  /* ---- Main click / mousemove / dblclick / mousedown / mouseup ---- */
  useEffect(() => {
    if (!managesCanvas) return undefined;
    const map = mapRef.current;
    if (!map) return undefined;

    /* Ensure drawing sources exist before event handlers try to use them */
    if (isMapAlive(map) && map.isStyleLoaded()) {
      ensureSources(map);
    }

    /* Disable double-click zoom while a draw tool is active so that
       finishing a line/polygon with dblclick doesn't also zoom the map. */
    const hasDrawTool = !!activeDrawTool;
    if (hasDrawTool) {
      map.doubleClickZoom.disable();
    }

    /* ---------- Click ---------- */
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const tool = activeToolRef.current;
      if (!tool) {
        const selectableLayers = [DRAW_VERTEX_LAYER, DRAW_LINE_LAYER, DRAW_FILL_LAYER]
          .filter((layerId) => Boolean(map.getLayer(layerId)));
        if (selectableLayers.length === 0) {
          onSelectFeature(null);
          return;
        }

        const feature = map
          .queryRenderedFeatures(e.point, { layers: selectableLayers })
          .find((candidate) => typeof candidate.properties?._fid === "string");
        const featureId = feature?.properties?._fid as string | undefined;
        onSelectFeature(featureId ?? null);
        if (featureId) {
          onAnnounce?.(`Selected drawn feature ${featureId}`);
          e.preventDefault();
        }
        return;
      }
      const coord: [number, number] = [
        +e.lngLat.lng.toFixed(6),
        +e.lngLat.lat.toFixed(6),
      ];

      // Collapse duplicate `click` events emitted for one physical click
      // (otherwise the two-click circle/rectangle would self-cancel).
      const clickKey = `${coord[0]},${coord[1]}`;
      const clickNow = Date.now();
      if (
        lastClickRef.current &&
        lastClickRef.current.key === clickKey &&
        clickNow - lastClickRef.current.at < 350
      ) {
        return;
      }
      lastClickRef.current = { key: clickKey, at: clickNow };

      // Snap
      const snapped = trySnap(coord, map);
      const pt = snapped ?? coord;

      if (tool === "point") {
        finishFeature(makePoint(pt), `Point ${featuresRef.current.length + 1}`);
        syncGhost();
        return;
      }

      if (tool === "rectangle") {
        // Two-click: first click sets a corner, second sets the opposite corner.
        const verts = verticesRef.current;
        if (verts.length === 0) {
          verticesRef.current = [pt];
          cursorRef.current = pt;
          isDrawingRef.current = true;
          syncGhost();
          onAnnounce?.("Rectangle started — click the opposite corner");
        } else {
          const start = verts[0];
          if (Math.abs(pt[0] - start[0]) < 1e-7 && Math.abs(pt[1] - start[1]) < 1e-7) {
            return; // ignore a duplicate/same-point second click
          }
          finishFeature(makeRectangle(start, pt), `Rectangle ${featuresRef.current.length + 1}`);
          syncGhost();
        }
        return;
      }

      if (tool === "circle") {
        // Two-click: first click sets the centre, second sets the radius.
        const verts = verticesRef.current;
        if (verts.length === 0) {
          verticesRef.current = [pt];
          cursorRef.current = pt;
          isDrawingRef.current = true;
          syncGhost();
          onAnnounce?.("Circle started — click to set the radius");
        } else {
          const center = verts[0];
          if (Math.abs(pt[0] - center[0]) < 1e-7 && Math.abs(pt[1] - center[1]) < 1e-7) {
            return; // same-point click — keep the centre, wait for a real radius
          }
          const radius = haversineDistance(center, pt);
          if (radius > 1) {
            finishFeature(makeCircle(center, radius), `Circle ${featuresRef.current.length + 1}`);
          }
          syncGhost();
        }
        return;
      }

      if (tool === "linestring" || tool === "polygon") {
        // Deduplicate: skip if this coord matches the last vertex
        // (double-click fires two click events before dblclick)
        const verts = verticesRef.current;
        const last = verts[verts.length - 1];
        if (last && last[0] === pt[0] && last[1] === pt[1]) return;

        verts.push(pt);
        isDrawingRef.current = true;
        syncGhost();
        return;
      }
    };

    /* ---------- Mousemove ---------- */
    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const coord: [number, number] = [+e.lngLat.lng.toFixed(6), +e.lngLat.lat.toFixed(6)];

      // Editing drag
      if (editingRef.current) {
        const { featureId, vertexIndex } = editingRef.current;
        const snapped = trySnap(coord, map, featureId);
        const c = snapped ?? coord;
        cursorRef.current = c;
        snapRef.current = snapped;
        const feat = featuresRef.current.find((f) => f.id === featureId);
        if (feat) {
          if (feat.geometry.type === "Polygon") {
            const ring = [...(feat.geometry as GeoJSON.Polygon).coordinates[0]];
            ring[vertexIndex] = c;
            // Also close the ring if editing index 0
            if (vertexIndex === 0) ring[ring.length - 1] = c;
            const geometry: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] };
            const nextFeature: DrawnFeature = {
              ...feat,
              geometry,
              properties: {
                ...feat.properties,
                validation: validateDrawnGeometry(geometry),
              },
            };
            editingRef.current.latest = cloneDrawnFeature(nextFeature);
            onUpdateFeature(featureId, {
              geometry,
              properties: nextFeature.properties,
            });
          } else if (feat.geometry.type === "LineString") {
            const coords = [...(feat.geometry as GeoJSON.LineString).coordinates] as [number, number][];
            coords[vertexIndex] = c;
            const geometry = makeLineString(coords);
            const nextFeature: DrawnFeature = {
              ...feat,
              geometry,
              properties: {
                ...feat.properties,
                validation: validateDrawnGeometry(geometry),
              },
            };
            editingRef.current.latest = cloneDrawnFeature(nextFeature);
            onUpdateFeature(featureId, {
              geometry,
              properties: nextFeature.properties,
            });
          }
        }
        return;
      }

      const tool = activeToolRef.current;
      if (!tool) {
        cursorRef.current = null;
        snapRef.current = null;
        syncGhost();
        return;
      }

      const snapped = trySnap(coord, map);
      cursorRef.current = snapped ?? coord;
      snapRef.current = snapped;

      // Live preview while a multi-click shape (line/polygon/rectangle/circle)
      // is in progress, or whenever a snap candidate is highlighted.
      if (isDrawingRef.current || verticesRef.current.length > 0 || snapRef.current) {
        syncGhost();
      }
    };

    /* ---------- Double-click → finish line/polygon ---------- */
    const onDblClick = (e: maplibregl.MapMouseEvent) => {
      const tool = activeToolRef.current;
      if (!tool) return;
      e.preventDefault();

      const verts = verticesRef.current;

      /* Remove the extra vertex added by the second click of the
         double-click (the first click's duplicate was already blocked
         by the dedup check in onClick, but a stray extra may remain). */
      if (verts.length >= 2) {
        const last = verts[verts.length - 1];
        const prev = verts[verts.length - 2];
        if (last[0] === prev[0] && last[1] === prev[1]) {
          verts.pop();
        }
      }

      if (tool === "linestring" && verts.length >= 2) {
        finishFeature(
          makeLineString(verts),
          `Line ${featuresRef.current.length + 1}`,
        );
        syncGhost();
      } else if (tool === "polygon" && verts.length >= 3) {
        finishFeature(
          makePolygon(verts),
          `Polygon ${featuresRef.current.length + 1}`,
        );
        syncGhost();
      }
    };

    /* ---------- Mousedown → vertex edit start ----------
       Rectangle & circle are click-driven (see onClick); mousedown only
       initiates vertex dragging on the selected feature. */
    const onMouseDown = (e: maplibregl.MapMouseEvent) => {
      // Vertex editing: check if we're clicking on a vertex of the selected feature
      if (selectedFeatureId) {
        const feat = featuresRef.current.find((f) => f.id === selectedFeatureId);
        if (feat) {
          let coords: number[][] = [];
          if (feat.geometry.type === "Polygon") {
            const ring = (feat.geometry as GeoJSON.Polygon).coordinates[0];
            coords = ring.slice(0, -1); // exclude closing vertex
          } else if (feat.geometry.type === "LineString") {
            coords = (feat.geometry as GeoJSON.LineString).coordinates;
          }
          const click = map.project(e.lngLat);
          for (let i = 0; i < coords.length; i++) {
            const vp = map.project([coords[i][0], coords[i][1]]);
            if (isWithinPixels(click, vp, SNAP_TOLERANCE_PX)) {
              editingRef.current = {
                featureId: selectedFeatureId,
                vertexIndex: i,
                before: cloneDrawnFeature(feat),
              };
              map.dragPan.disable();
              e.preventDefault();
              return;
            }
          }
        }
      }
    };

    /* ---------- Mouseup → vertex edit end ---------- */
    const onMouseUp = () => {
      // Vertex editing end
      if (editingRef.current) {
        const edit = editingRef.current;
        editingRef.current = null;
        snapRef.current = null;
        cursorRef.current = null;
        map.dragPan.enable();
        if (edit.latest) {
          onCommitFeatureEdit?.(edit.featureId, edit.before, edit.latest);
        }
      }
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);
    map.on("dblclick", onDblClick);
    map.on("mousedown", onMouseDown);
    map.on("mouseup", onMouseUp);

    return () => {
      if (!isMapAlive(map)) return;
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("dblclick", onDblClick);
      map.off("mousedown", onMouseDown);
      map.off("mouseup", onMouseUp);
      map.dragPan.enable();
      map.doubleClickZoom.enable();
    };
  }, [
    mapRef,
    activeDrawTool,
    selectedFeatureId,
    finishFeature,
    syncGhost,
    trySnap,
    onUpdateFeature,
    onCommitFeatureEdit,
    onSelectFeature,
    onAnnounce,
    ensureSources,
    managesCanvas,
  ]);

  /* ================================================================ */
  /*  Keyboard: Escape to cancel, Ctrl+Z to undo, Delete to remove    */
  /* ================================================================ */

  useEffect(() => {
    if (!managesCanvas) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isDrawingRef.current || activeToolRef.current)) {
        e.stopPropagation(); // Prevent modal close
        e.preventDefault();
        cancelDrawing();
        return;
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && isDrawingRef.current) {
        e.preventDefault();
        if (verticesRef.current.length > 0) {
          verticesRef.current.pop();
          if (verticesRef.current.length === 0) {
            isDrawingRef.current = false;
          }
          syncGhost();
          onAnnounce?.("Last vertex undone");
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFeatureId) {
        onRemoveFeature(selectedFeatureId);
        onSelectFeature(null);
        onAnnounce?.("Selected feature deleted");
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [
    selectedFeatureId,
    cancelDrawing,
    syncGhost,
    onRemoveFeature,
    onSelectFeature,
    onAnnounce,
    managesCanvas,
  ]);

  /* ================================================================ */
  /*  Map cursor style                                                 */
  /* ================================================================ */

  useEffect(() => {
    if (!managesCanvas) return undefined;
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return undefined;
    const canvas = map.getCanvas();
    if (activeDrawTool) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
    return () => {
      if (!isMapAlive(map)) return;
      canvas.style.cursor = "";
    };
  }, [mapRef, activeDrawTool, managesCanvas]);

  /* ================================================================ */
  /*  Feature sidebar rendered in React                                */
  /* ================================================================ */

  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();
  const headless = presentation === "headless";

  if (headless) {
    return null;
  }

  if (!sidebarVisible) {
    return null;
  }

  const selectedFeature = drawnFeatures.find((feature) => feature.id === selectedFeatureId) ?? null;
  const activeToolLabel = activeDrawTool ? DRAW_TOOL_LABELS[activeDrawTool] : "Select";

  /* Shared content — used in both floating and embedded presentations */
  const summaryStrip = (
    <div style={mapStyles.sidePanelSummaryStrip} aria-label="Sketch summary">
      <div style={mapStyles.sidePanelMetric}>
        <span style={mapStyles.sidePanelMetricLabel}>Tool</span>
        <span style={mapStyles.sidePanelMetricValue}>{activeToolLabel}</span>
      </div>
      <div style={mapStyles.sidePanelMetric}>
        <span style={mapStyles.sidePanelMetricLabel}>Features</span>
        <span style={mapStyles.sidePanelMetricValue}>{drawnFeatures.length}</span>
      </div>
      <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
        <span style={mapStyles.sidePanelMetricLabel}>Selected</span>
        <span style={mapStyles.sidePanelMetricValue}>{selectedFeature ? selectedFeature.geometry.type : "None"}</span>
      </div>
    </div>
  );

  const featureRows = (
      <div style={mapStyles.sidePanelBody} role="listbox" aria-label="Drawn feature list">
        {drawnFeatures.map((f) => {
          const validationStatus = f.properties.validation?.status;
          const validationLabel = getDrawnValidationLabel(validationStatus);
          const validationColor = getDrawnValidationColor(validationStatus);

          return (
          <div
            key={f.id}
            role="option"
            style={f.id === selectedFeatureId ? rowSelectedStyle : rowStyle}
            onClick={() => onSelectFeature(f.id === selectedFeatureId ? null : f.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectFeature(f.id === selectedFeatureId ? null : f.id);
              }
            }}
            tabIndex={0}
            aria-selected={f.id === selectedFeatureId}
            aria-label={`${f.properties.label} — ${f.geometry.type}`}
          >
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", color: f.id === selectedFeatureId ? MAP_COLORS.interaction : MAP_COLORS.textMuted }}>
              {f.geometry.type === "Point" ? <IconPoint size={MAP_ICON_SIZES.sm} /> : f.geometry.type === "LineString" ? <IconLine size={MAP_ICON_SIZES.sm} /> : f.geometry.type === "Polygon" ? <IconPolygon size={MAP_ICON_SIZES.sm} /> : <IconUnknown size={MAP_ICON_SIZES.sm} />}
            </span>
            <span style={{ minWidth: MAP_SPACING.zero, display: "grid", gap: MAP_SPACING.xs }}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: f.id === selectedFeatureId ? MAP_COLORS.interaction : MAP_COLORS.text,
                  fontWeight: f.id === selectedFeatureId ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
                }}
              >
                {f.properties.label}
              </span>
              <span style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                {f.geometry.type} - <span style={{ color: validationColor }}>{validationLabel}</span>
              </span>
            </span>
            <button
              type="button"
              style={smallBtn}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFeature(f.id);
                if (f.id === selectedFeatureId) onSelectFeature(null);
                onAnnounce?.(`${f.properties.label} removed`);
              }}
              aria-label={`Delete ${f.properties.label}`}
            >
              <IconTrash size={12} />
            </button>
          </div>
          );
        })}
      </div>
  );

  const featureList = (
    drawnFeatures.length === 0 ? (
      <div style={emptyStyle}>
        No drawn features.
      </div>
    ) : (
      featureRows
    )
  );

  /* ---- Embedded presentation: plain scrollable body for right dock ---- */
  if (presentation === "embedded") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
        role="region"
        aria-label="Drawn features"
        data-testid="map-right-dock-draw-body"
      >
        <div style={headerStyle}>
          <div style={mapStyles.sidePanelTitleStack}>
            <span style={mapStyles.sidePanelEyebrow}>Sketch</span>
            <span style={mapStyles.sidePanelTitle}><IconPencil size={MAP_ICON_SIZES.sm} /> Drawings</span>
          </div>
          <div style={mapStyles.sidePanelHeaderActions}>
            {drawnFeatures.length > 0 ? (
              <button
                type="button"
                style={smallBtn}
                onClick={onClearFeatures}
                aria-label="Clear all drawn features"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>
        {summaryStrip}
        {featureList}
      </div>
    );
  }

  if (presentation === "modal" && onSetDrawTool) {
    return (
      <DrawModalBody
        mapRef={mapRef}
        activeDrawTool={activeDrawTool}
        drawnFeatures={drawnFeatures}
        selectedFeatureId={selectedFeatureId}
        onSetDrawTool={onSetDrawTool}
        onAddFeature={onAddFeature}
        onRemoveFeature={onRemoveFeature}
        onUpdateFeature={onUpdateFeature}
        onClearFeatures={onClearFeatures}
        onSelectFeature={onSelectFeature}
        onAnnounce={onAnnounce}
      />
    );
  }

  if (presentation === "modal") {
    // Fallback when no tool setter is wired (kept minimal; Core always wires it).
    return (
      <div
        className={motionStyles.panelIn}
        style={modalBodyStyle}
        role="region"
        aria-label="Drawing modal workspace"
        data-testid="map-draw-modal-body"
      >
        <GisSectionHeader title="Drawn features" compact />
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {drawnFeatures.length === 0 ? (
            <GisEmptyState
              icon={<IconPencil size={20} />}
              title="No drawn features"
              description="Pick a tool to start sketching on the map."
              data-testid="map-draw-modal-empty"
            />
          ) : (
            featureRows
          )}
        </div>
      </div>
    );
  }

  /* ---- Floating presentation (default): draggable opaque panel ---- */
  return (
    <div style={{ ...panelStyle, ...panelPositionStyle }} role="region" aria-label="Drawn features">
      <div style={{ ...headerStyle, ...dragHandleStyle }} {...dragHandleProps}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Sketch</span>
          <span style={mapStyles.sidePanelTitle}><IconPencil size={MAP_ICON_SIZES.sm} /> Drawings</span>
        </div>
        <div style={mapStyles.sidePanelHeaderActions}>
          {drawnFeatures.length > 0 ? (
            <button
              type="button"
              style={smallBtn}
              onClick={onClearFeatures}
              aria-label="Clear all drawn features"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
      {summaryStrip}
      {featureList}
    </div>
  );
};
