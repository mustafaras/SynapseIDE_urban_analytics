/**
 * MapVoxCityOverlay — 2D projection of VoxCity buildings + CityJSON onto
 * the MapLibre canvas.
 *
 * Renders three families of MapLibre layers:
 *   1. VoxCity sample-building footprints (thematic fill by attribute).
 *   2. CityJSON ground / wall / roof outlines (semantic colouring).
 *   3. Optional building labels (id / address).
 *
 * Implements:
 *   • Layer Panel registration under the new "voxcity" group.
 *   • Click → popup with full attribute set (matching the 3D viewer).
 *   • Linked selection: clicks on the 2D map publish to the
 *     `voxCitySelectionService` so the 3D viewer can highlight the same
 *     building (and vice versa).
 *   • LOD selector mirroring the 3D viewer's LOD toggle.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import maplibregl from "maplibre-gl";
import {
  Building2,
  CloudDownload,
  Eye,
  EyeOff,
  Layers as LayersIcon,
  Tag,
  X,
} from "lucide-react";
import { DESIGN_TOKENS } from "@/constants/design";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./map/useDraggableMapPanel";
import type { LayerGroupId, OverlayLayerConfig } from "./map/mapTypes";
import {
  SAMPLE_ATTRIBUTE_KEYS,
  SAMPLE_BUILDINGS,
  SAMPLE_CITYJSON_STRING,
} from "@/features/urbanAnalytics/voxcity";
import { loadCityJSONSync } from "@/features/urbanAnalytics/voxcity/CityJSONLoader";
import type { CityJSONLoadResult } from "@/features/urbanAnalytics/voxcity/cityJsonTypes";
import { useCityJSONScene } from "@/features/urbanAnalytics/voxcity/hooks/useCityJSONScene";
import {
  resolveVoxCityMapLayerSource,
  type VoxCityResolvedSource,
} from "@/features/urbanAnalytics/voxcity/voxCityDataBridge";
import {
  buildingFeaturesToGeoJSON,
  cityJSONObjectsToFootprintCollection,
  DEFAULT_VOXCITY_GEO_ANCHOR,
  geoBoundsOfCollection,
  listCityJSONLodLevels,
  type VoxCityGeoAnchor,
} from "@/services/map/voxCityProjection";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import {
  publishVoxCitySelection,
  subscribeToVoxCitySelection,
} from "@/services/map/voxCitySelectionService";
import {
  ExternalServiceConnector,
  OSM_BUILDING_PROVENANCE,
} from "@/services/map/ExternalServiceConnector";
import { executeOverpassBuildingsAsync } from "@/services/map/ExternalServiceQueue";
import type { MapImportProgress } from "@/services/map/MapDataImporter";
import { resolveMapAnalysisBounds } from "@/services/map/MapAnalysisBounds";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const PANEL_WIDTH = 360;

const FOOTPRINT_LAYER_PREFIX = "voxcity-footprints";
const CITYJSON_LAYER_PREFIX = "voxcity-cityjson";
const LABEL_LAYER_PREFIX = "voxcity-labels";

const FOOTPRINT_SOURCE_ID = `${FOOTPRINT_LAYER_PREFIX}-source`;
const FOOTPRINT_FILL_LAYER_ID = `${FOOTPRINT_LAYER_PREFIX}-fill`;
const FOOTPRINT_OUTLINE_LAYER_ID = `${FOOTPRINT_LAYER_PREFIX}-outline`;
const FOOTPRINT_HIGHLIGHT_LAYER_ID = `${FOOTPRINT_LAYER_PREFIX}-highlight`;

const CITYJSON_SOURCE_ID = `${CITYJSON_LAYER_PREFIX}-source`;
const CITYJSON_FILL_LAYER_ID = `${CITYJSON_LAYER_PREFIX}-fill`;
const CITYJSON_OUTLINE_LAYER_ID = `${CITYJSON_LAYER_PREFIX}-outline`;

const LABEL_SOURCE_ID = `${LABEL_LAYER_PREFIX}-source`;
const LABEL_LAYER_ID = `${LABEL_LAYER_PREFIX}-symbol`;

const FOOTPRINT_REGISTRY_ID = "voxcity-sample-footprints";
const CITYJSON_REGISTRY_ID = "voxcity-cityjson-footprints";
const LABEL_REGISTRY_ID = "voxcity-building-labels";

const VOXCITY_GROUP: LayerGroupId = "voxcity";
const EMPTY_FOOTPRINT_COLLECTION: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJSON.GeoJsonProperties> = {
  type: "FeatureCollection",
  features: [],
};

/* ================================================================== */
/*  Theming                                                            */
/* ================================================================== */

type ColorBy = "height" | "type" | "year";
type VoxCityOverlaySourceMode = "demo" | "active-layer" | "osm";

interface ResolvedMapLayerSource {
  layer: OverlayLayerConfig;
  source: VoxCityResolvedSource;
}

const TYPE_COLORS: Record<string, string> = {
  residential: "#F59E0B",
  commercial: "#22D3EE",
  office: "#A855F7",
  industrial: "#EF4444",
  public: "#34D399",
  mixed: "#FB923C",
  unknown: "#94A3B8",
};

const SEMANTIC_COLORS: Record<string, string> = {
  RoofSurface: "#DC2626", // red
  WallSurface: "#9CA3AF", // gray
  GroundSurface: "#92400E", // brown
  OuterCeilingSurface: "#FBBF24",
  OuterFloorSurface: "#A3A3A3",
  Window: "#3B82F6",
  Door: "#6D28D9",
  Unknown: "#6B7280",
};

const HEIGHT_GRADIENT_STOPS = [
  { value: 0, color: "#1E293B" },
  { value: 10, color: "#0E7490" },
  { value: 30, color: "#F59E0B" },
  { value: 60, color: "#EA580C" },
  { value: 120, color: "#DC2626" },
];

function buildHeightFillExpression(): unknown[] {
  // ["interpolate", ["linear"], ["coalesce", ["to-number", ["get","height"]],
  //   ["*", ["coalesce", ["to-number", ["get","building:levels"]], 1], 3]],
  //   stop, color, ...]
  const heightExpr: unknown = [
    "coalesce",
    ["to-number", ["get", "height"]],
    [
      "*",
      ["coalesce", ["to-number", ["get", "building:levels"]], 1],
      3,
    ],
  ];
  const out: unknown[] = ["interpolate", ["linear"], heightExpr];
  for (const stop of HEIGHT_GRADIENT_STOPS) {
    out.push(stop.value, stop.color);
  }
  return out;
}

function buildTypeFillExpression(): unknown[] {
  const expr: unknown[] = ["match", ["coalesce", ["get", "type"], "unknown"]];
  for (const [key, color] of Object.entries(TYPE_COLORS)) {
    if (key === "unknown") continue;
    expr.push(key, color);
  }
  expr.push(TYPE_COLORS.unknown);
  return expr;
}

function buildYearFillExpression(): unknown[] {
  const expr: unknown[] = [
    "interpolate",
    ["linear"],
    ["coalesce", ["to-number", ["get", "year"]], 1980],
    1900,
    "#312E81",
    1960,
    "#0EA5E9",
    1990,
    "#10B981",
    2010,
    "#F59E0B",
    2025,
    "#DC2626",
  ];
  return expr;
}

function buildSemanticFillExpression(): unknown[] {
  const expr: unknown[] = [
    "match",
    ["coalesce", ["get", "semantic_type"], "Unknown"],
  ];
  for (const [key, color] of Object.entries(SEMANTIC_COLORS)) {
    if (key === "Unknown") continue;
    expr.push(key, color);
  }
  expr.push(SEMANTIC_COLORS.Unknown);
  return expr;
}

/* ================================================================== */
/*  Popup HTML builder                                                 */
/* ================================================================== */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPropertyValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(3).replace(/0+$/g, "").replace(/\.$/, "");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function humanizeKey(key: string): string {
  return key
    .replace(/^__/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function buildPopupHtml(
  title: string,
  subtitle: string | null,
  properties: Record<string, unknown>,
): string {
  const visible = Object.entries(properties).filter(
    ([key, value]) =>
      !key.startsWith("__") &&
      key !== "building_id" &&
      key !== "city_object_id" &&
      value != null &&
      value !== "",
  );

  const rows = visible
    .slice(0, 16)
    .map(
      ([key, value]) => `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:10px;padding:5px 0;border-top:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:11px;color:${MAP_COLORS.textMuted};text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(humanizeKey(key))}</span>
          <span style="font-size:11px;color:${MAP_COLORS.text};text-align:right;word-break:break-word;">${escapeHtml(formatPropertyValue(value))}</span>
        </div>`,
    )
    .join("");

  return `
    <div style="min-width:240px;max-width:340px;padding:12px 14px;font-family:${MAP_TYPOGRAPHY.fontFamily};color:${MAP_COLORS.text};background:rgba(13,13,13,0.96);border-radius:${MAP_RADIUS.md}px;">
      <div style="font-size:11px;color:${MAP_COLORS.interaction};letter-spacing:0.06em;text-transform:uppercase;font-weight:${MAP_TYPOGRAPHY.fontWeight.semibold};margin-bottom:2px;">VoxCity</div>
      <div style="font-size:14px;color:${MAP_COLORS.text};font-weight:${MAP_TYPOGRAPHY.fontWeight.bold};margin-bottom:${subtitle ? "2px" : "8px"};">${escapeHtml(title)}</div>
      ${subtitle ? `<div style="font-size:11px;color:${MAP_COLORS.textSecondary};margin-bottom:8px;">${escapeHtml(subtitle)}</div>` : ""}
      <div>${rows}</div>
    </div>`;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function attributesAsRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

interface FootprintCounts {
  buildings: number;
  cityJsonSurfaces: number;
  cityJsonObjects: number;
  lods: string[];
}

function isLikelyGeographicReference(referenceSystem?: string | null): boolean {
  return /4326|crs\s*84|wgs\s*84/i.test(referenceSystem ?? "");
}

function isOsmBuildingLayer(layer: OverlayLayerConfig): boolean {
  return layer.group === "voxcity"
    && layer.sourceKind === "external"
    && /OpenStreetMap|Overpass|ODbL/i.test(layer.provenance?.label ?? layer.provenance?.sourceName ?? layer.name);
}

function centroidOfGeometry(geometry: GeoJSON.Geometry): [number, number] | null {
  const coords: GeoJSON.Position[] = [];
  const collectRing = (ring: GeoJSON.Position[]) => {
    coords.push(...ring);
  };

  if (geometry.type === "Polygon") {
    collectRing(geometry.coordinates[0] ?? []);
  } else if (geometry.type === "MultiPolygon") {
    collectRing(geometry.coordinates[0]?.[0] ?? []);
  } else if (geometry.type === "Point") {
    return [geometry.coordinates[0], geometry.coordinates[1]];
  }

  if (coords.length === 0) return null;
  const total = coords.reduce<[number, number]>((sum, coord) => [sum[0] + Number(coord[0]), sum[1] + Number(coord[1])], [0, 0]);
  return [total[0] / coords.length, total[1] / coords.length];
}

function sourceKindLabel(mode: VoxCityOverlaySourceMode): string {
  if (mode === "active-layer") return "Active map layer";
  if (mode === "osm") return "OSM Overpass";
  return "Demo";
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(PANEL_WIDTH),
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderBottom: `1px solid ${MAP_COLORS.hairline}`,
  color: MAP_COLORS.text,
};

const panelBodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "14px",
  overflowY: "auto",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const sublabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
};

const segmentRow: React.CSSProperties = {
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "1fr",
  gap: 6,
};

const segmentBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 6px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.02)",
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
  transition: DESIGN_TOKENS.transitions.sm,
};

const segmentBtnActive: React.CSSProperties = {
  ...segmentBtn,
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.interaction,
  borderColor: MAP_COLORS.focus,
};

const sliderRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const slider: React.CSSProperties = {
  flex: 1,
  accentColor: MAP_COLORS.interaction,
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 4,
  borderRadius: MAP_RADIUS.sm,
};

const toggleBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.02)",
  color: MAP_COLORS.text,
  fontSize: 12,
  cursor: "pointer",
};

const toggleBtnActive: React.CSSProperties = {
  ...toggleBtn,
  background: MAP_COLORS.selectedSubtle,
  borderColor: MAP_COLORS.focus,
  color: MAP_COLORS.interaction,
};

const legendChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: 999,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.02)",
  fontSize: 11,
  color: MAP_COLORS.textSecondary,
};

const swatch: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 3,
  border: "1px solid rgba(255,255,255,0.12)",
};

const statsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const statBlock: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: "8px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.02)",
};

const statValue: React.CSSProperties = {
  fontSize: 14,
  color: MAP_COLORS.interaction,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const statLabel: React.CSSProperties = {
  fontSize: 10,
  color: MAP_COLORS.textMuted,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export interface MapVoxCityOverlayProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  /** When true, the configuration panel is shown above the map. */
  panelVisible: boolean;
  /** Close the configuration panel. */
  onPanelClose: () => void;
  /** Optional callback to announce status messages. */
  onAnnounce?: (message: string) => void;
  /** Optional bridge into the Map Explorer import/progress indicator. */
  onExternalImportProgress?: (detail: {
    busy: boolean;
    label: string | null;
    progress: MapImportProgress | null;
  }) => void;
}

export const MapVoxCityOverlay: React.FC<MapVoxCityOverlayProps> = ({
  mapRef,
  panelVisible,
  onPanelClose,
  onAnnounce,
  onExternalImportProgress,
}) => {
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();

  /* -------- Store registry actions -------- */
  const overlayLayers = useMapExplorerStore((s) => s.overlayLayers);
  const addOverlayLayer = useMapExplorerStore((s) => s.addOverlayLayer);
  const removeOverlayLayer = useMapExplorerStore((s) => s.removeOverlayLayer);

  /* -------- Local UI state -------- */
  const [showFootprints, setShowFootprints] = useState(true);
  const [showCityJson, setShowCityJson] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [colorBy, setColorBy] = useState<ColorBy>("height");
  const [sourceMode, setSourceMode] = useState<VoxCityOverlaySourceMode>("osm");
  const [activeLayerSourceId, setActiveLayerSourceId] = useState<string | null>(null);
  const [osmLayerSourceId, setOsmLayerSourceId] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<string | null>(null);
  const [isFetchingOsm, setIsFetchingOsm] = useState(false);
  const [selectedLod, setSelectedLod] = useState<string | null>(null);
  const [footprintOpacity, setFootprintOpacity] = useState(0.65);
  const [cityJsonOpacity, setCityJsonOpacity] = useState(0.5);
  const [anchor, setAnchor] = useState<VoxCityGeoAnchor>(() => {
    const map = mapRef.current;
    if (map) {
      const c = map.getCenter();
      if (c && Number.isFinite(c.lng) && Number.isFinite(c.lat)) {
        return { longitude: c.lng, latitude: c.lat };
      }
    }
    return DEFAULT_VOXCITY_GEO_ANCHOR;
  });
  const anchorInitFromMapRef = useRef(false);
  // Initialise anchor from the live map centre once available, so the demo
  // dataset appears wherever the user is already looking instead of yanking
  // the camera to a hardcoded location.
  useEffect(() => {
    if (anchorInitFromMapRef.current) return;
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    if (!c || !Number.isFinite(c.lng) || !Number.isFinite(c.lat)) return;
    setAnchor({ longitude: c.lng, latitude: c.lat });
    anchorInitFromMapRef.current = true;
  }, [mapRef]);

  /* -------- Cached data -------- */
  const loadedCityJsonObjects = useCityJSONScene((s) => s.objects);
  const loadedCityJsonSummary = useCityJSONScene((s) => s.summary);

  const sampleCityJsonResult: CityJSONLoadResult = useMemo(() => {
    return loadCityJSONSync(SAMPLE_CITYJSON_STRING);
  }, []);

  const cityJsonObjects = loadedCityJsonObjects.length > 0
    ? loadedCityJsonObjects
    : sourceMode === "demo"
      ? sampleCityJsonResult.objects
      : [];
  const cityJsonSummary = loadedCityJsonObjects.length > 0
    ? loadedCityJsonSummary
    : sourceMode === "demo"
      ? sampleCityJsonResult.summary
      : null;
  const cityJsonProjectionMode = isLikelyGeographicReference(cityJsonSummary?.referenceSystem)
    ? "passthrough"
    : "anchored";

  const resolvedMapLayerSources = useMemo<ResolvedMapLayerSource[]>(() => {
    return overlayLayers
      .filter((layer) => layer.visible && layer.type === "geojson")
      .map((layer) => {
        const source = resolveVoxCityMapLayerSource(layer);
        return source ? { layer, source } : null;
      })
      .filter((entry): entry is ResolvedMapLayerSource => entry !== null);
  }, [overlayLayers]);

  const osmLayerSources = useMemo(
    () => resolvedMapLayerSources.filter(({ layer }) => isOsmBuildingLayer(layer)),
    [resolvedMapLayerSources],
  );

  const activeMapLayerSources = useMemo(
    () => resolvedMapLayerSources.filter(({ layer }) => !isOsmBuildingLayer(layer)),
    [resolvedMapLayerSources],
  );

  useEffect(() => {
    if (sourceMode === "active-layer" && !activeLayerSourceId && activeMapLayerSources.length > 0) {
      setActiveLayerSourceId(activeMapLayerSources[0]!.layer.id);
    }
    if (sourceMode === "osm" && !osmLayerSourceId && osmLayerSources.length > 0) {
      setOsmLayerSourceId(osmLayerSources[0]!.layer.id);
    }
  }, [activeLayerSourceId, activeMapLayerSources, osmLayerSourceId, osmLayerSources, sourceMode]);

  const selectedActiveLayerSource = useMemo(
    () => activeMapLayerSources.find(({ layer }) => layer.id === activeLayerSourceId) ?? activeMapLayerSources[0] ?? null,
    [activeLayerSourceId, activeMapLayerSources],
  );

  const selectedOsmLayerSource = useMemo(
    () => osmLayerSources.find(({ layer }) => layer.id === osmLayerSourceId) ?? osmLayerSources[0] ?? null,
    [osmLayerSourceId, osmLayerSources],
  );

  const activeRealSource = sourceMode === "active-layer"
    ? selectedActiveLayerSource?.source ?? null
    : sourceMode === "osm"
      ? selectedOsmLayerSource?.source ?? null
      : null;
  const hasActiveRealSource = activeRealSource !== null;

  const footprintSourceTitle = activeRealSource?.metadata.title ?? "VoxCity Demo Footprints";
  const footprintSourceProvenance = sourceMode === "osm" && hasActiveRealSource
    ? OSM_BUILDING_PROVENANCE
    : activeRealSource?.metadata.provider ?? "Sample VoxCity buildings reprojected to EPSG:4326";

  const lodLevels: string[] = useMemo(
    () => listCityJSONLodLevels(cityJsonObjects),
    [cityJsonObjects],
  );

  // Keep the selected LOD pinned to the highest level available in the active CityJSON document.
  useEffect(() => {
    if (lodLevels.length > 0 && (!selectedLod || !lodLevels.includes(selectedLod))) {
      setSelectedLod(lodLevels[lodLevels.length - 1]);
    }
  }, [lodLevels, selectedLod]);

  const footprintCollection = useMemo<GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJSON.GeoJsonProperties>>(
    () => {
      if (activeRealSource) {
        return activeRealSource.featureCollection as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJSON.GeoJsonProperties>;
      }
      if (sourceMode !== "demo") {
        return EMPTY_FOOTPRINT_COLLECTION;
      }
      return buildingFeaturesToGeoJSON(SAMPLE_BUILDINGS, anchor);
    },
    [activeRealSource, anchor, sourceMode],
  );

  const cityJsonCollection = useMemo(() => {
    return cityJSONObjectsToFootprintCollection(
      cityJsonObjects,
      anchor,
      { ...(selectedLod ? { lodFilter: selectedLod } : {}), projectionMode: cityJsonProjectionMode },
    );
  }, [cityJsonObjects, selectedLod, anchor, cityJsonProjectionMode]);

  const labelCollection = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, GeoJSON.GeoJsonProperties>>(() => {
    const features: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>[] = footprintCollection.features.flatMap((feature) => {
      const centroid = centroidOfGeometry(feature.geometry);
      if (!centroid) return [];
      const attrs = attributesAsRecord(feature.properties);
      const id = String(feature.id ?? attrs.building_id ?? attrs.osm_id ?? attrs.id ?? "building");
      const label = (attrs.address as string)
        ?? (attrs.name as string)
        ?? (attrs.label as string)
        ?? (attrs["addr:housenumber"] && attrs["addr:street"] ? `${attrs["addr:housenumber"]} ${attrs["addr:street"]}` : null)
        ?? id;
      return [{
        type: "Feature" as const,
        id,
        geometry: { type: "Point" as const, coordinates: centroid },
        properties: {
          building_id: id,
          label,
        },
      }];
    });
    return { type: "FeatureCollection", features };
  }, [footprintCollection]);

  const counts: FootprintCounts = useMemo(
    () => ({
      buildings: footprintCollection.features.length,
      cityJsonSurfaces: cityJsonCollection.features.length,
      cityJsonObjects: cityJsonObjects.length,
      lods: lodLevels,
    }),
    [footprintCollection, cityJsonCollection, cityJsonObjects, lodLevels],
  );

  /* -------- Selection state -------- */
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  /* -------- MapLibre source/layer management -------- */

  const ensureSourcesAndLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const m = mapRef.current;
      if (!m || !m.isStyleLoaded()) return;

      // ---- Footprint source/layers ----
      if (!m.getSource(FOOTPRINT_SOURCE_ID)) {
        m.addSource(FOOTPRINT_SOURCE_ID, {
          type: "geojson",
          data: footprintCollection,
          promoteId: "building_id",
        });
      } else {
        const src = m.getSource(FOOTPRINT_SOURCE_ID) as maplibregl.GeoJSONSource;
        src.setData(footprintCollection);
      }

      if (!m.getLayer(FOOTPRINT_FILL_LAYER_ID)) {
        m.addLayer({
          id: FOOTPRINT_FILL_LAYER_ID,
          type: "fill",
          source: FOOTPRINT_SOURCE_ID,
          paint: {
            "fill-color": buildHeightFillExpression() as never,
            "fill-opacity": footprintOpacity,
            "fill-outline-color": "rgba(0,0,0,0.65)",
          },
        });
      }

      if (!m.getLayer(FOOTPRINT_OUTLINE_LAYER_ID)) {
        m.addLayer({
          id: FOOTPRINT_OUTLINE_LAYER_ID,
          type: "line",
          source: FOOTPRINT_SOURCE_ID,
          paint: {
            "line-color": MAP_COLORS.interaction,
            "line-width": 0.6,
            "line-opacity": 0.75,
          },
        });
      }

      if (!m.getLayer(FOOTPRINT_HIGHLIGHT_LAYER_ID)) {
        m.addLayer({
          id: FOOTPRINT_HIGHLIGHT_LAYER_ID,
          type: "line",
          source: FOOTPRINT_SOURCE_ID,
          paint: {
            "line-color": "#3794ff",
            "line-width": 3,
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              1,
              0,
            ] as never,
          },
        });
      }

      // ---- CityJSON source/layers ----
      if (!m.getSource(CITYJSON_SOURCE_ID)) {
        m.addSource(CITYJSON_SOURCE_ID, {
          type: "geojson",
          data: cityJsonCollection,
        });
      } else {
        const src = m.getSource(CITYJSON_SOURCE_ID) as maplibregl.GeoJSONSource;
        src.setData(cityJsonCollection);
      }

      if (!m.getLayer(CITYJSON_FILL_LAYER_ID)) {
        m.addLayer({
          id: CITYJSON_FILL_LAYER_ID,
          type: "fill",
          source: CITYJSON_SOURCE_ID,
          paint: {
            "fill-color": buildSemanticFillExpression() as never,
            "fill-opacity": cityJsonOpacity,
          },
        });
      }

      if (!m.getLayer(CITYJSON_OUTLINE_LAYER_ID)) {
        m.addLayer({
          id: CITYJSON_OUTLINE_LAYER_ID,
          type: "line",
          source: CITYJSON_SOURCE_ID,
          paint: {
            "line-color": buildSemanticFillExpression() as never,
            "line-width": 1.4,
            "line-opacity": 0.95,
          },
        });
      }

      // ---- Label source/layer ----
      if (!m.getSource(LABEL_SOURCE_ID)) {
        m.addSource(LABEL_SOURCE_ID, {
          type: "geojson",
          data: labelCollection,
        });
      } else {
        const src = m.getSource(LABEL_SOURCE_ID) as maplibregl.GeoJSONSource;
        src.setData(labelCollection);
      }

      if (!m.getLayer(LABEL_LAYER_ID)) {
        m.addLayer({
          id: LABEL_LAYER_ID,
          type: "symbol",
          source: LABEL_SOURCE_ID,
          layout: {
            "text-field": ["get", "label"],
            "text-size": 11,
            "text-anchor": "center",
            "text-offset": [0, 0.4],
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#FAFAF9",
            "text-halo-color": "rgba(13,13,13,0.85)",
            "text-halo-width": 1.4,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("styledata", apply);
    }
  }, [
    mapRef,
    footprintCollection,
    cityJsonCollection,
    labelCollection,
    cityJsonOpacity,
    footprintOpacity,
  ]);

  /* -------- Sync data updates -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => {
      const m = mapRef.current;
      if (!m || !m.isStyleLoaded()) return;
      ensureSourcesAndLayers();

      const fp = m.getSource(FOOTPRINT_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      fp?.setData(footprintCollection);

      const cj = m.getSource(CITYJSON_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      cj?.setData(cityJsonCollection);

      const lbl = m.getSource(LABEL_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      lbl?.setData(labelCollection);
    };

    if (map.isStyleLoaded()) {
      sync();
    } else {
      map.once("styledata", sync);
    }
  }, [mapRef, footprintCollection, cityJsonCollection, labelCollection, ensureSourcesAndLayers]);

  /* -------- Re-add layers after a basemap style change -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleStyleData = () => {
      ensureSourcesAndLayers();
      // Update colour expressions / opacities
      if (map.getLayer(FOOTPRINT_FILL_LAYER_ID)) {
        const expression =
          colorBy === "height"
            ? buildHeightFillExpression()
            : colorBy === "type"
              ? buildTypeFillExpression()
              : buildYearFillExpression();
        map.setPaintProperty(FOOTPRINT_FILL_LAYER_ID, "fill-color", expression as never);
      }
    };
    map.on("styledata", handleStyleData);
    return () => {
      map.off("styledata", handleStyleData);
    };
  }, [mapRef, ensureSourcesAndLayers, colorBy]);

  /* -------- Mount: ensure layers are present (no auto-fly — anchor follows current view) -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      ensureSourcesAndLayers();
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once("load", init);
    }

    return () => {
      cancelled = true;
    };
  }, [mapRef, ensureSourcesAndLayers]);

  /* -------- Helper: re-anchor to viewport centre and fit-bounds -------- */
  const handleReAnchorToViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    if (!c || !Number.isFinite(c.lng) || !Number.isFinite(c.lat)) return;
    const next: VoxCityGeoAnchor = { longitude: c.lng, latitude: c.lat };
    setAnchor(next);
    // Fit bounds after the next render flushes, so the data is in the source.
    requestAnimationFrame(() => {
      const m = mapRef.current;
      if (!m) return;
      const bounds = geoBoundsOfCollection(buildingFeaturesToGeoJSON(SAMPLE_BUILDINGS, next));
      if (bounds) {
        m.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 100, duration: 600, maxZoom: 18 },
        );
      }
    });
    onAnnounce?.("VoxCity sample data re-anchored to current map center");
  }, [mapRef, onAnnounce]);

  const handleFitFootprints = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = geoBoundsOfCollection(footprintCollection);
    if (!bounds) {
      onAnnounce?.("No building footprint extent is available to fit.");
      return;
    }
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: 100, duration: 600, maxZoom: 18 },
    );
    onAnnounce?.(`Map fitted to ${footprintSourceTitle}`);
  }, [footprintCollection, footprintSourceTitle, mapRef, onAnnounce]);

  const handleFetchOsmBuildings = useCallback(() => {
    const state = useMapExplorerStore.getState();
    const scope = resolveMapAnalysisBounds({
      drawnFeatures: state.drawnFeatures,
      selectedFeatureId: state.selectedFeatureId,
      currentMapBounds: state.currentMapBounds,
      ...(state.activeAoiId ? { activeAoiId: state.activeAoiId } : {}),
    });
    if (!scope) {
      const message = "OSM building analysis needs a selected/drawn AOI or a live map extent. Draw/select an area, then try again.";
      setSourceStatus(message);
      onAnnounce?.(message);
      return;
    }

    setIsFetchingOsm(true);
    setSourceStatus(`Queued OSM building analysis for ${scope.label}.`);
    onExternalImportProgress?.({
      busy: true,
      label: "OSM buildings",
      progress: { loaded: 0, total: 100, percent: 12, stage: "Queued Overpass request" },
    });

    const handle = executeOverpassBuildingsAsync(scope.bounds);
    handle.promise
      .then((result) => {
        const layer = ExternalServiceConnector.createOsmBuildingsLayerConfig(result);
        addOverlayLayer(layer);
        setOsmLayerSourceId(layer.id);
        setSourceMode("osm");
        setShowFootprints(true);
        const message = `${result.featureCollection.features.length.toLocaleString()} OSM building footprints loaded for ${scope.label}${result.cacheHit ? " from cache" : ""}.`;
        setSourceStatus(message);
        onExternalImportProgress?.({
          busy: true,
          label: "OSM buildings",
          progress: {
            loaded: 100,
            total: 100,
            percent: 100,
            stage: result.cacheHit ? "Loaded from 10-minute bbox cache" : "OSM buildings added",
            rowCount: result.featureCollection.features.length,
          },
        });
        onAnnounce?.(message);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "OSM building fetch failed.";
        setSourceStatus(message);
        onAnnounce?.(message);
      })
      .finally(() => {
        setIsFetchingOsm(false);
        window.setTimeout(() => {
          onExternalImportProgress?.({ busy: false, label: null, progress: null });
        }, 750);
      });
  }, [addOverlayLayer, onAnnounce, onExternalImportProgress]);

  /* -------- Apply color-by changes -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const m = mapRef.current;
      if (!m || !m.getLayer(FOOTPRINT_FILL_LAYER_ID)) return;
      const expression =
        colorBy === "height"
          ? buildHeightFillExpression()
          : colorBy === "type"
            ? buildTypeFillExpression()
            : buildYearFillExpression();
      m.setPaintProperty(FOOTPRINT_FILL_LAYER_ID, "fill-color", expression as never);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("styledata", apply);
  }, [mapRef, colorBy]);

  /* -------- Apply opacity changes -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const m = mapRef.current;
      if (!m) return;
      if (m.getLayer(FOOTPRINT_FILL_LAYER_ID)) {
        m.setPaintProperty(FOOTPRINT_FILL_LAYER_ID, "fill-opacity", footprintOpacity);
      }
      if (m.getLayer(CITYJSON_FILL_LAYER_ID)) {
        m.setPaintProperty(CITYJSON_FILL_LAYER_ID, "fill-opacity", cityJsonOpacity);
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("styledata", apply);
  }, [mapRef, footprintOpacity, cityJsonOpacity]);

  /* -------- Toggle visibility -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const m = mapRef.current;
      if (!m) return;
      const setVis = (id: string, visible: boolean) => {
        if (m.getLayer(id)) {
          m.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        }
      };
      setVis(FOOTPRINT_FILL_LAYER_ID, showFootprints);
      setVis(FOOTPRINT_OUTLINE_LAYER_ID, showFootprints);
      setVis(FOOTPRINT_HIGHLIGHT_LAYER_ID, showFootprints);
      setVis(CITYJSON_FILL_LAYER_ID, showCityJson);
      setVis(CITYJSON_OUTLINE_LAYER_ID, showCityJson);
      setVis(LABEL_LAYER_ID, showLabels);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("styledata", apply);
  }, [mapRef, showFootprints, showCityJson, showLabels]);

  /* -------- Click → popup + selection broadcast -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const stylePopupContainer = (popup: maplibregl.Popup) => {
      const popupEl = popup.getElement();
      const contentEl = popupEl?.querySelector(".maplibregl-popup-content");
      if (contentEl instanceof HTMLElement) {
        contentEl.style.background = "rgba(13,13,13,0.96)";
        contentEl.style.padding = "0";
        contentEl.style.borderRadius = String(MAP_RADIUS.md);
        contentEl.style.boxShadow = MAP_SHADOWS.dropdown;
        contentEl.style.border = `1px solid ${MAP_COLORS.focus}`;
      }
      const tipTopEl = popupEl?.querySelector(".maplibregl-popup-anchor-top .maplibregl-popup-tip");
      const tipBottomEl = popupEl?.querySelector(".maplibregl-popup-anchor-bottom .maplibregl-popup-tip");
      if (tipTopEl instanceof HTMLElement) tipTopEl.style.borderBottomColor = "rgba(13,13,13,0.96)";
      if (tipBottomEl instanceof HTMLElement) tipBottomEl.style.borderTopColor = "rgba(13,13,13,0.96)";
      const closeBtnEl = popupEl?.querySelector(".maplibregl-popup-close-button");
      if (closeBtnEl instanceof HTMLElement) {
        closeBtnEl.style.color = MAP_COLORS.interaction;
        closeBtnEl.style.fontSize = "16px";
        closeBtnEl.style.padding = "2px 8px";
        closeBtnEl.style.right = "4px";
        closeBtnEl.style.top = "4px";
      }
    };

    const onClickFootprint = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties ?? {};
      const buildingId = String(
        (props as { building_id?: unknown }).building_id ??
          feature.id ??
          "(unknown)",
      );
      const html = buildPopupHtml(buildingId, sourceMode === "demo" ? "Demo VoxCity Building" : footprintSourceTitle, props);
      popupRef.current?.remove();
      const popup = new maplibregl.Popup({ closeButton: true, offset: 12, maxWidth: "380px" })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
      stylePopupContainer(popup);
      popupRef.current = popup;
      setSelectedBuildingId(buildingId);
      publishVoxCitySelection({
        source: "map-2d",
        buildingId,
        coordinate: [e.lngLat.lng, e.lngLat.lat],
      });
      onAnnounce?.(`Selected building ${buildingId}`);
    };

    const onClickCityJson = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties ?? {};
      const cityId = String(
        (props as { city_object_id?: unknown }).city_object_id ?? "(unknown)",
      );
      const semantic = String(
        (props as { semantic_type?: unknown }).semantic_type ?? "Surface",
      );
      const html = buildPopupHtml(cityId, `${semantic} (CityJSON)`, props);
      popupRef.current?.remove();
      const popup = new maplibregl.Popup({ closeButton: true, offset: 12, maxWidth: "380px" })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
      stylePopupContainer(popup);
      popupRef.current = popup;
      setSelectedBuildingId(cityId);
      publishVoxCitySelection({
        source: "map-2d",
        buildingId: cityId,
        coordinate: [e.lngLat.lng, e.lngLat.lat],
      });
      onAnnounce?.(`Selected CityJSON object ${cityId}`);
    };

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", FOOTPRINT_FILL_LAYER_ID, onClickFootprint);
    map.on("click", CITYJSON_FILL_LAYER_ID, onClickCityJson);
    map.on("mouseenter", FOOTPRINT_FILL_LAYER_ID, onEnter);
    map.on("mouseleave", FOOTPRINT_FILL_LAYER_ID, onLeave);
    map.on("mouseenter", CITYJSON_FILL_LAYER_ID, onEnter);
    map.on("mouseleave", CITYJSON_FILL_LAYER_ID, onLeave);

    return () => {
      map.off("click", FOOTPRINT_FILL_LAYER_ID, onClickFootprint);
      map.off("click", CITYJSON_FILL_LAYER_ID, onClickCityJson);
      map.off("mouseenter", FOOTPRINT_FILL_LAYER_ID, onEnter);
      map.off("mouseleave", FOOTPRINT_FILL_LAYER_ID, onLeave);
      map.off("mouseenter", CITYJSON_FILL_LAYER_ID, onEnter);
      map.off("mouseleave", CITYJSON_FILL_LAYER_ID, onLeave);
    };
  }, [footprintSourceTitle, mapRef, onAnnounce, sourceMode]);

  /* -------- Subscribe to 3D → 2D selection -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    return subscribeToVoxCitySelection((event) => {
      if (!event) {
        setSelectedBuildingId(null);
        return;
      }
      if (event.source === "map-2d") return; // ignore our own emissions
      setSelectedBuildingId(event.buildingId);
      // Try to centre on the building
      const feature = footprintCollection.features.find(
        (f) => String(f.id) === event.buildingId || String(f.properties?.building_id) === event.buildingId,
      );
      if (feature && feature.geometry.type === "Polygon") {
        const ring = feature.geometry.coordinates[0];
        if (ring && ring.length > 0) {
          let cx = 0;
          let cy = 0;
          for (const [x, y] of ring) {
            cx += x as number;
            cy += y as number;
          }
          cx /= ring.length;
          cy /= ring.length;
          map.flyTo({ center: [cx, cy], zoom: Math.max(map.getZoom(), 16), duration: 600 });
        }
      }
    });
  }, [mapRef, footprintCollection]);

  /* -------- Apply feature-state for highlight -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const m = mapRef.current;
      if (!m || !m.getSource(FOOTPRINT_SOURCE_ID)) return;
      // Reset all features (cheap because dataset is small)
      for (const feature of footprintCollection.features) {
        const id = feature.id ?? feature.properties?.building_id;
        if (id == null) continue;
        m.setFeatureState(
          { source: FOOTPRINT_SOURCE_ID, id: id as string | number },
          { selected: id === selectedBuildingId },
        );
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("styledata", apply);
  }, [mapRef, selectedBuildingId, footprintCollection]);

  /* -------- Layer Panel registration -------- */
  // Helper to register one entry idempotently.
  const ensureLayerEntry = useCallback(
    (
      id: string,
      name: string,
      visible: boolean,
      opacity: number,
      featureCount: number,
      provLabel: string,
      sourceKind: OverlayLayerConfig["sourceKind"],
    ) => {
      const existing = useMapExplorerStore.getState().overlayLayers.find((l) => l.id === id);
      const entry: OverlayLayerConfig = {
        id,
        name,
        type: "geojson",
        group: VOXCITY_GROUP,
        visible,
        opacity,
        ...(sourceKind ? { sourceKind } : {}),
        queryable: true,
        provenance: { label: provLabel },
        metadata: {
          ...(existing?.metadata ?? {}),
          featureCount,
          geometryType: "Polygon",
        },
      };
      addOverlayLayer(entry);
    },
    [addOverlayLayer],
  );

  useEffect(() => {
    ensureLayerEntry(
      FOOTPRINT_REGISTRY_ID,
      "VoxCity Sample Footprints",
      showFootprints,
      footprintOpacity,
      counts.buildings,
      footprintSourceProvenance,
      hasActiveRealSource ? "external" : "demo",
    );
    ensureLayerEntry(
      CITYJSON_REGISTRY_ID,
      `CityJSON Surfaces${selectedLod ? ` (LOD ${selectedLod})` : ""}`,
      showCityJson,
      cityJsonOpacity,
      counts.cityJsonSurfaces,
      loadedCityJsonObjects.length > 0 ? `Remote CityJSON${cityJsonSummary?.referenceSystem ? ` · ${cityJsonSummary.referenceSystem}` : ""}` : "Sample CityJSON 2.0 with semantic surfaces",
      loadedCityJsonObjects.length > 0 ? "external" : "demo",
    );
    ensureLayerEntry(
      LABEL_REGISTRY_ID,
      "Building Labels",
      showLabels,
      1,
      counts.buildings,
      "Address / id labels for VoxCity buildings",
      hasActiveRealSource ? "external" : "demo",
    );
  }, [
    showFootprints,
    showCityJson,
    showLabels,
    selectedLod,
    counts.buildings,
    counts.cityJsonSurfaces,
    cityJsonOpacity,
    footprintOpacity,
    footprintSourceProvenance,
    hasActiveRealSource,
    sourceMode,
    loadedCityJsonObjects.length,
    cityJsonSummary?.referenceSystem,
    addOverlayLayer,
    ensureLayerEntry,
  ]);

  /* -------- Reflect LayerPanel visibility/opacity changes back into state -------- */
  useEffect(() => {
    const fp = overlayLayers.find((l) => l.id === FOOTPRINT_REGISTRY_ID);
    if (fp) {
      if (fp.visible !== showFootprints) setShowFootprints(fp.visible);
      if (Math.abs(fp.opacity - footprintOpacity) > 0.001) setFootprintOpacity(fp.opacity);
    }
    const cj = overlayLayers.find((l) => l.id === CITYJSON_REGISTRY_ID);
    if (cj) {
      if (cj.visible !== showCityJson) setShowCityJson(cj.visible);
      if (Math.abs(cj.opacity - cityJsonOpacity) > 0.001) setCityJsonOpacity(cj.opacity);
    }
    const lbl = overlayLayers.find((l) => l.id === LABEL_REGISTRY_ID);
    if (lbl) {
      if (lbl.visible !== showLabels) setShowLabels(lbl.visible);
    }
  }, [overlayLayers]);

  /* -------- Cleanup on unmount -------- */
  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (!map) return;
      const teardown = () => {
        const m = mapRef.current;
        if (!m) return;
        for (const layerId of [
          FOOTPRINT_FILL_LAYER_ID,
          FOOTPRINT_OUTLINE_LAYER_ID,
          FOOTPRINT_HIGHLIGHT_LAYER_ID,
          CITYJSON_FILL_LAYER_ID,
          CITYJSON_OUTLINE_LAYER_ID,
          LABEL_LAYER_ID,
        ]) {
          if (m.getLayer(layerId)) m.removeLayer(layerId);
        }
        for (const sourceId of [FOOTPRINT_SOURCE_ID, CITYJSON_SOURCE_ID, LABEL_SOURCE_ID]) {
          if (m.getSource(sourceId)) m.removeSource(sourceId);
        }
      };
      try {
        if (map.isStyleLoaded()) teardown();
      } catch {
        // map may already be torn down
      }
      removeOverlayLayer(FOOTPRINT_REGISTRY_ID);
      removeOverlayLayer(CITYJSON_REGISTRY_ID);
      removeOverlayLayer(LABEL_REGISTRY_ID);
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, []);

  /* ============================================================ */
  /*  Render the side-panel UI                                    */
  /* ============================================================ */

  const availableFootprintAttributes = Array.from(
    new Set(
      footprintCollection.features.flatMap((feature) => Object.keys(feature.properties ?? {})),
    ),
  ).slice(0, 10);

  const sourceSelectStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 30,
    borderRadius: MAP_RADIUS.sm,
    border: `1px solid ${MAP_COLORS.hairline}`,
    background: MAP_COLORS.bgPanel,
    color: MAP_COLORS.text,
    fontSize: 11,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    padding: "6px 8px",
  };

  if (!panelVisible) {
    return null;
  }

  return (
    <div
      style={{ ...panelStyle, ...panelPositionStyle }}
      role="dialog"
      aria-label="VoxCity 2D overlay configuration"
    >
      <div style={{ ...panelHeaderStyle, ...dragHandleStyle }} {...dragHandleProps}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={16} color={MAP_COLORS.interaction} />
          <div>
            <div style={{ ...labelStyle, color: MAP_COLORS.interaction, fontSize: 10 }}>VoxCity Overlay</div>
            <div style={{ fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.bold, color: MAP_COLORS.text }}>
              Building Footprints &amp; CityJSON
            </div>
          </div>
        </div>
        <button
          type="button"
          style={closeBtn}
          aria-label="Close VoxCity overlay panel"
          onClick={onPanelClose}
        >
          <X size={14} />
        </button>
      </div>

      <div style={panelBodyStyle}>
        {/* ------------ Real data source selector ------------ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "10px 12px",
            borderRadius: MAP_RADIUS.sm,
            border: `1px solid ${MAP_COLORS.hairline}`,
            background: MAP_COLORS.interactionSubtle,
          }}
        >
          <span style={{ ...labelStyle, color: MAP_COLORS.interaction }}>Building Source</span>
          <div style={segmentRow}>
            {(["demo", "active-layer", "osm"] as VoxCityOverlaySourceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                style={sourceMode === mode ? segmentBtnActive : segmentBtn}
                aria-pressed={sourceMode === mode}
                onClick={() => setSourceMode(mode)}
                disabled={mode === "active-layer" && activeMapLayerSources.length === 0}
                title={mode === "active-layer" && activeMapLayerSources.length === 0 ? "Add or show a polygon layer to bind it here" : undefined}
              >
                {sourceKindLabel(mode)}
              </button>
            ))}
          </div>

          {sourceMode === "active-layer" ? (
            <select
              value={selectedActiveLayerSource?.layer.id ?? ""}
              onChange={(event) => setActiveLayerSourceId(event.target.value)}
              style={sourceSelectStyle}
              aria-label="Choose active map layer for VoxCity overlay"
            >
              {activeMapLayerSources.length === 0 ? (
                <option value="">No polygon map layer available</option>
              ) : activeMapLayerSources.map(({ layer, source }) => (
                <option key={layer.id} value={layer.id}>{source.metadata.title}</option>
              ))}
            </select>
          ) : null}

          {sourceMode === "osm" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {osmLayerSources.length > 0 ? (
                <select
                  value={selectedOsmLayerSource?.layer.id ?? ""}
                  onChange={(event) => setOsmLayerSourceId(event.target.value)}
                  style={sourceSelectStyle}
                  aria-label="Choose OSM building layer for VoxCity overlay"
                >
                  {osmLayerSources.map(({ layer, source }) => (
                    <option key={layer.id} value={layer.id}>{source.metadata.title}</option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                style={{
                  ...segmentBtnActive,
                  padding: "6px 10px",
                  justifyContent: "center",
                }}
                onClick={handleFetchOsmBuildings}
                disabled={isFetchingOsm}
                title="Fetch OSM building footprints for the selected AOI, falling back to the current map extent"
              >
                <CloudDownload size={13} />
                {isFetchingOsm ? "Fetching OSM buildings" : "Fetch buildings from OSM"}
              </button>
            </div>
          ) : null}

          <span style={{ fontSize: 11, color: MAP_COLORS.textSecondary, lineHeight: 1.4 }}>
            {hasActiveRealSource
              ? `${footprintSourceTitle} is bound directly from the shared map layer registry for linked 2D/3D inspection.`
              : sourceMode === "osm"
                ? "Fetch OSM building footprints for the selected AOI to create a live OpenStreetMap building layer."
                : "Synthetic VoxCity sample buildings are reprojected around the current map view for safe demo exploration."}
          </span>
          <span style={{ fontSize: 10, color: MAP_COLORS.textMuted }}>
            {!hasActiveRealSource
              ? `Anchor: ${anchor.latitude.toFixed(5)}, ${anchor.longitude.toFixed(5)}`
              : `Provenance: ${footprintSourceProvenance}`}
          </span>
          {sourceStatus ? <span style={{ fontSize: 10, color: MAP_COLORS.textSecondary }}>{sourceStatus}</span> : null}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sourceMode === "demo" ? (
              <button
                type="button"
                style={{
                  ...segmentBtnActive,
                  padding: "6px 10px",
                  alignSelf: "flex-start",
                }}
                onClick={handleReAnchorToViewport}
                title="Reproject the demo dataset around the current map centre"
              >
                Re-anchor at viewport center
              </button>
            ) : null}
            <button
              type="button"
              style={{
                ...segmentBtn,
                padding: "6px 10px",
                alignSelf: "flex-start",
              }}
              onClick={handleFitFootprints}
              title="Fit map to the active building source"
            >
              Fit source extent
            </button>
          </div>
        </div>

        {/* ------------ Stats ribbon ------------ */}
        <div style={statsRow}>
          <div style={statBlock}>
            <span style={statValue}>{counts.buildings}</span>
            <span style={statLabel}>Buildings</span>
          </div>
          <div style={statBlock}>
            <span style={statValue}>{counts.cityJsonObjects}</span>
            <span style={statLabel}>CityJSON</span>
          </div>
          <div style={statBlock}>
            <span style={statValue}>{counts.cityJsonSurfaces}</span>
            <span style={statLabel}>Surfaces</span>
          </div>
        </div>

        {/* ------------ Layer toggles ------------ */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Layers</span>
          <button
            type="button"
            style={showFootprints ? toggleBtnActive : toggleBtn}
            onClick={() => setShowFootprints((v) => !v)}
            aria-pressed={showFootprints}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {showFootprints ? <Eye size={13} /> : <EyeOff size={13} />}
              {hasActiveRealSource ? "Real Building Footprints" : sourceMode === "demo" ? "Demo Building Footprints" : "Selected Area Footprints"}
            </span>
            <span style={sublabelStyle}>{counts.buildings}</span>
          </button>

          <button
            type="button"
            style={showCityJson ? toggleBtnActive : toggleBtn}
            onClick={() => setShowCityJson((v) => !v)}
            aria-pressed={showCityJson}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {showCityJson ? <Eye size={13} /> : <EyeOff size={13} />}
              CityJSON Semantic Surfaces
            </span>
            <span style={sublabelStyle}>{counts.cityJsonSurfaces}</span>
          </button>

          <button
            type="button"
            style={showLabels ? toggleBtnActive : toggleBtn}
            onClick={() => setShowLabels((v) => !v)}
            aria-pressed={showLabels}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag size={13} />
              Building Labels
            </span>
            <span style={sublabelStyle}>{showLabels ? "On" : "Off"}</span>
          </button>
        </div>

        {/* ------------ Theme selector ------------ */}
        <div style={sectionStyle}>
          <span style={labelStyle}>
            <LayersIcon size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Footprint Theme
          </span>
          <div style={segmentRow}>
            {(["height", "type", "year"] as ColorBy[]).map((mode) => (
              <button
                key={mode}
                type="button"
                style={colorBy === mode ? segmentBtnActive : segmentBtn}
                onClick={() => setColorBy(mode)}
                aria-pressed={colorBy === mode}
              >
                {mode === "height" ? "Height" : mode === "type" ? "Type" : "Year"}
              </button>
            ))}
          </div>

          {colorBy === "height" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {HEIGHT_GRADIENT_STOPS.map((s) => (
                <span key={s.value} style={legendChip}>
                  <span style={{ ...swatch, background: s.color }} />
                  {s.value} m
                </span>
              ))}
            </div>
          ) : null}

          {colorBy === "type" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(TYPE_COLORS)
                .filter(([k]) => k !== "unknown")
                .map(([k, c]) => (
                  <span key={k} style={legendChip}>
                    <span style={{ ...swatch, background: c }} />
                    {k}
                  </span>
                ))}
            </div>
          ) : null}

          {colorBy === "year" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                ["#312E81", "1900"],
                ["#0EA5E9", "1960"],
                ["#10B981", "1990"],
                ["#F59E0B", "2010"],
                ["#DC2626", "2025"],
              ].map(([c, label]) => (
                <span key={label} style={legendChip}>
                  <span style={{ ...swatch, background: c }} />
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          <div style={{ ...sublabelStyle, marginTop: 4 }}>
            Available attributes: {(availableFootprintAttributes.length > 0 ? availableFootprintAttributes : SAMPLE_ATTRIBUTE_KEYS).join(", ")}
          </div>
        </div>

        {/* ------------ CityJSON LOD ------------ */}
        <div style={sectionStyle}>
          <span style={labelStyle}>CityJSON LOD</span>
          {lodLevels.length > 0 ? (
            <div style={segmentRow}>
              {lodLevels.map((lod) => (
                <button
                  key={lod}
                  type="button"
                  style={selectedLod === lod ? segmentBtnActive : segmentBtn}
                  onClick={() => setSelectedLod(lod)}
                  aria-pressed={selectedLod === lod}
                >
                  LOD {lod}
                </button>
              ))}
            </div>
          ) : (
            <span style={sublabelStyle}>No LOD levels detected.</span>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(SEMANTIC_COLORS)
              .filter(([k]) => k !== "Unknown")
              .map(([k, c]) => (
                <span key={k} style={legendChip}>
                  <span style={{ ...swatch, background: c }} />
                  {k.replace(/Surface$/, "")}
                </span>
              ))}
          </div>
        </div>

        {/* ------------ Opacity sliders ------------ */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Footprint Opacity ({Math.round(footprintOpacity * 100)}%)</span>
          <div style={sliderRow}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={footprintOpacity}
              onChange={(e) => setFootprintOpacity(parseFloat(e.target.value))}
              style={slider}
              aria-label="Footprint opacity"
            />
          </div>
          <span style={labelStyle}>CityJSON Opacity ({Math.round(cityJsonOpacity * 100)}%)</span>
          <div style={sliderRow}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={cityJsonOpacity}
              onChange={(e) => setCityJsonOpacity(parseFloat(e.target.value))}
              style={slider}
              aria-label="CityJSON opacity"
            />
          </div>
        </div>

        {selectedBuildingId ? (
          <div
            style={{
              ...sectionStyle,
              padding: 10,
              borderRadius: MAP_RADIUS.sm,
              border: `1px solid ${MAP_COLORS.focus}`,
              background: MAP_COLORS.selectedSubtle,
            }}
          >
            <span style={{ ...labelStyle, color: MAP_COLORS.interaction }}>Linked Selection</span>
            <span style={{ fontSize: 12, color: MAP_COLORS.text, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
              {selectedBuildingId}
            </span>
            <span style={sublabelStyle}>
              Highlights propagate to the 3D viewer when sync is enabled.
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapVoxCityOverlay;

/* ================================================================== */
/*  Re-exports for tests                                              */
/* ================================================================== */

export const __VOXCITY_OVERLAY_LAYER_IDS__ = {
  footprintFill: FOOTPRINT_FILL_LAYER_ID,
  footprintOutline: FOOTPRINT_OUTLINE_LAYER_ID,
  cityJsonFill: CITYJSON_FILL_LAYER_ID,
  cityJsonOutline: CITYJSON_OUTLINE_LAYER_ID,
  labels: LABEL_LAYER_ID,
  registry: {
    footprints: FOOTPRINT_REGISTRY_ID,
    cityJson: CITYJSON_REGISTRY_ID,
    labels: LABEL_REGISTRY_ID,
  },
} as const;

export function getVoxCityOverlayInteractiveLayerIds(): string[] {
  return [FOOTPRINT_FILL_LAYER_ID, CITYJSON_FILL_LAYER_ID];
}
