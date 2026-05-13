import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  MapCartographyRecommendation,
  MapCartographyReviewState,
} from "@/services/map/MapCartographyAdvisor";
import type { LayerGroupId, LayerPublicationReadinessStatus, LayerQaStatus, LayerScientificQABadge, LayerSourceKind, OverlayLayerConfig } from "./mapTypes";
import { CartographyRecommendationList } from "./CartographyRecommendationList";
import { normalizeLayerRegistryMetadata } from "./mapLayerMetadata";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";
import { IconClose, IconEyeClosed, IconEyeOpen } from "./MapIcons";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapLayerManagerProps {
  /** All overlay layers from the store */
  overlayLayers: OverlayLayerConfig[];
  /** Active base layer name for display */
  activeBaseLayerName: string;
  /** Toggles */
  onToggleVisibility: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onAddLayer: (layer: OverlayLayerConfig) => void;
  onReRunAnalysisLayer?: (id: string, rerunToken?: string | null) => void;
  onAddLayerToReport?: (id: string) => void;
  onExportLayer?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
  onFocusLayer?: (id: string) => void;
  activeRerunToken?: string | null;
  onOpenSymbology?: (id: string) => void;
  activeSymbologyLayerId?: string | null;
  cartographyReviewState?: MapCartographyReviewState | null;
  onApplyCartographyRecommendation?: (recommendationId: string) => void;
  onDismissCartographyRecommendation?: (recommendationId: string) => void;
  onUndoCartographyRecommendation?: () => void;
  canUndoCartographyRecommendation?: boolean;
  onShowCartographyDetails?: (recommendation: MapCartographyRecommendation) => void;
  onRequestClose?: () => void;
  panelStyle?: React.CSSProperties;
  /** Screen reader announcement */
  onAnnounce?: (msg: string) => void;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const POPOVER_ESTIMATED_HEIGHT = 260;

const GROUP_ORDER: LayerGroupId[] = ["data", "voxcity", "analysis"];
const GROUP_LABELS: Record<LayerGroupId, string> = {
  base: "Base Layers",
  data: "Data Layers",
  voxcity: "VoxCity",
  analysis: "Analysis Results",
};
const SOURCE_KIND_LABELS: Record<LayerSourceKind, string> = {
  project: "Project",
  imported: "Imported",
  external: "External",
  derived: "Derived",
  demo: "Demo",
};

const QA_STATUS_LABELS: Record<LayerQaStatus, string> = {
  unchecked: "QA unchecked",
  passed: "QA passed",
  warning: "QA warning",
  error: "QA error",
};

const PUBLICATION_READINESS_LABELS: Record<LayerPublicationReadinessStatus, string> = {
  ready: "Ready",
  "ready-with-caveats": "Ready with caveats",
  "needs-review": "Needs review",
  blocked: "Blocked",
};

const SCIENTIFIC_QA_BADGE_LABELS: Record<LayerScientificQABadge, string> = {
  invalid_geometry: "Invalid geometry",
  missing_crs: "Missing CRS",
  sample_data: "Sample data",
  stale_result: "Stale result",
  uncertain_output: "Uncertain output",
};

const SCIENTIFIC_QA_BADGE_TITLES: Record<LayerScientificQABadge, string> = {
  invalid_geometry: "Scientific QA found invalid feature geometry.",
  missing_crs: "Projection metadata is missing or unknown.",
  sample_data: "Layer is demo or teaching data.",
  stale_result: "Layer is stale relative to its source data.",
  uncertain_output: "Layer output has scientific caveats.",
};

const DEMO_LAYER_PACK_ID = "map-explorer-demo-layer-pack";
const DEMO_LAYER_PACK_TITLE = "Map Explorer Demo Layer Pack";
const DEMO_LAYER_PROVENANCE = "Synthetic demo sample generated in Map Explorer for UI review. Not observational data.";

interface MutableDemoBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

function collectCoordinateBounds(value: unknown, bounds: MutableDemoBounds): void {
  if (!Array.isArray(value)) {
    return;
  }

  const [longitude, latitude] = value;
  if (typeof longitude === "number" && typeof latitude === "number") {
    bounds.minLng = Math.min(bounds.minLng, longitude);
    bounds.minLat = Math.min(bounds.minLat, latitude);
    bounds.maxLng = Math.max(bounds.maxLng, longitude);
    bounds.maxLat = Math.max(bounds.maxLat, latitude);
    return;
  }

  for (const entry of value) {
    collectCoordinateBounds(entry, bounds);
  }
}

function getFeatureCollectionExactBounds(collection: GeoJSON.FeatureCollection): [number, number, number, number] {
  const bounds: MutableDemoBounds = {
    minLng: Number.POSITIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
  };

  for (const feature of collection.features) {
    collectCoordinateBounds(feature.geometry?.coordinates, bounds);
  }

  return [
    Number(bounds.minLng.toFixed(6)),
    Number(bounds.minLat.toFixed(6)),
    Number(bounds.maxLng.toFixed(6)),
    Number(bounds.maxLat.toFixed(6)),
  ];
}

function createMapExplorerDemoLayers(createdAt = new Date().toISOString()): OverlayLayerConfig[] {
  const transitAccessZones = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "block-fatih-01",
        properties: {
          block_id: "BLK-001",
          block_name: "Fatih Station Edge",
          access_class: "Moderate",
          access_score: 64,
          dwellings: 148,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [28.9608, 41.0116], [28.9662, 41.0123], [28.9668, 41.0089], [28.9615, 41.0082], [28.9608, 41.0116],
        ]] },
      },
      {
        type: "Feature",
        id: "block-fatih-02",
        properties: {
          block_id: "BLK-002",
          block_name: "Historic Market Block",
          access_class: "Low",
          access_score: 46,
          dwellings: 96,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [28.9682, 41.0126], [28.9736, 41.0131], [28.9741, 41.0098], [28.9689, 41.0092], [28.9682, 41.0126],
        ]] },
      },
      {
        type: "Feature",
        id: "block-uskudar-01",
        properties: {
          block_id: "BLK-003",
          block_name: "Uskudar Ferry Block",
          access_class: "High",
          access_score: 87,
          dwellings: 172,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.016, 41.025], [29.021, 41.026], [29.022, 41.0225], [29.017, 41.0218], [29.016, 41.025],
        ]] },
      },
      {
        type: "Feature",
        id: "block-uskudar-02",
        properties: {
          block_id: "BLK-004",
          block_name: "Mimar Sinan Block",
          access_class: "Moderate",
          access_score: 69,
          dwellings: 121,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.024, 41.023], [29.03, 41.024], [29.0305, 41.0205], [29.025, 41.0198], [29.024, 41.023],
        ]] },
      },
      {
        type: "Feature",
        id: "block-kadikoy-01",
        properties: {
          block_id: "BLK-005",
          block_name: "Kadikoy Retail Block",
          access_class: "High",
          access_score: 81,
          dwellings: 188,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.028, 40.992], [29.034, 40.9925], [29.0345, 40.989], [29.0285, 40.9885], [29.028, 40.992],
        ]] },
      },
      {
        type: "Feature",
        id: "block-kadikoy-02",
        properties: {
          block_id: "BLK-006",
          block_name: "Moda Transit Walkshed",
          access_class: "Moderate",
          access_score: 72,
          dwellings: 134,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.036, 40.996], [29.042, 40.9965], [29.043, 40.993], [29.037, 40.9925], [29.036, 40.996],
        ]] },
      },
    ],
  } satisfies GeoJSON.FeatureCollection;
  const transitBounds = getFeatureCollectionExactBounds(transitAccessZones);
  const coolingPriorityAreas = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "building-fatih-01",
        properties: {
          building_id: "BLD-001",
          building_name: "Sirkeci Mixed Use 01",
          use_type: "mixed_use",
          risk_class: "Very high",
          heat_exposure: 92,
          floors: 6,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [28.9632, 41.0108], [28.9647, 41.0109], [28.9648, 41.0098], [28.9633, 41.0097], [28.9632, 41.0108],
        ]] },
      },
      {
        type: "Feature",
        id: "building-fatih-02",
        properties: {
          building_id: "BLD-002",
          building_name: "Sirkeci Residential 02",
          use_type: "residential",
          priority: "High",
          risk_class: "High",
          heat_exposure: 79,
          floors: 5,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [28.9655, 41.0115], [28.9671, 41.0116], [28.9672, 41.0105], [28.9657, 41.0104], [28.9655, 41.0115],
        ]] },
      },
      {
        type: "Feature",
        id: "building-uskudar-01",
        properties: {
          building_id: "BLD-003",
          building_name: "Uskudar Civic 01",
          use_type: "civic",
          risk_class: "Moderate",
          heat_exposure: 63,
          floors: 4,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.0181, 41.0244], [29.0196, 41.0247], [29.0199, 41.0235], [29.0184, 41.0232], [29.0181, 41.0244],
        ]] },
      },
      {
        type: "Feature",
        id: "building-uskudar-02",
        properties: {
          building_id: "BLD-004",
          building_name: "Uskudar Residential 02",
          use_type: "residential",
          risk_class: "Low",
          heat_exposure: 48,
          floors: 3,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.0256, 41.0226], [29.027, 41.0228], [29.0272, 41.0217], [29.0258, 41.0215], [29.0256, 41.0226],
        ]] },
      },
      {
        type: "Feature",
        id: "building-kadikoy-01",
        properties: {
          building_id: "BLD-005",
          building_name: "Kadikoy Apartment 01",
          use_type: "residential",
          risk_class: "High",
          heat_exposure: 82,
          floors: 7,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.0305, 40.9921], [29.032, 40.9923], [29.0322, 40.9911], [29.0307, 40.9909], [29.0305, 40.9921],
        ]] },
      },
      {
        type: "Feature",
        id: "building-kadikoy-02",
        properties: {
          building_id: "BLD-006",
          building_name: "Kadikoy School 02",
          use_type: "education",
          risk_class: "Moderate",
          heat_exposure: 67,
          floors: 4,
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[
          [29.0372, 40.9951], [29.0391, 40.9953], [29.0394, 40.9939], [29.0375, 40.9937], [29.0372, 40.9951],
        ]] },
      },
    ],
  } satisfies GeoJSON.FeatureCollection;
  const coolingBounds = getFeatureCollectionExactBounds(coolingPriorityAreas);
  const sharedDataset = {
    datasetId: DEMO_LAYER_PACK_ID,
    datasetTitle: DEMO_LAYER_PACK_TITLE,
    datasetCity: "Istanbul demo blocks and buildings",
    source: DEMO_LAYER_PROVENANCE,
    license: "Demo only",
    crs: "EPSG:4326",
    updateDate: createdAt,
    packageLayerCount: 2,
    packageFeatureCount: 12,
  };
  const sharedCaveats = [
    "Synthetic demo data for interface review only.",
    "Coordinates are WGS84 display coordinates; do not use for area or distance analysis without projection.",
  ];

  return [
    {
      id: "demo-transit-access-zones",
      name: "Demo Urban Block Access Index",
      type: "geojson",
      visible: true,
      opacity: 0.7,
      group: "data",
      sourceKind: "demo",
      qaStatus: "warning",
      queryable: true,
      sourceData: transitAccessZones,
      style: {
        "fill-color": [
          "match",
          ["get", "access_class"],
          "High", "#16A34A",
          "Moderate", "#F59E0B",
          "Low", "#EF4444",
          "#94A3B8",
        ],
        "fill-outline-color": "rgba(15, 23, 42, 0.86)",
        legendEntries: [{ label: "Demo block access index", color: "#F59E0B" }],
      },
      provenance: {
        label: DEMO_LAYER_PROVENANCE,
        sourceName: DEMO_LAYER_PACK_TITLE,
        license: "Demo only",
        attribution: "Synthetic demo data - Map Explorer",
        generatedAt: createdAt,
        notes: sharedCaveats,
      },
      metadata: {
        featureCount: 6,
        geometryType: "Polygon",
        bounds: transitBounds,
        fields: ["block_id", "block_name", "access_class", "access_score", "dwellings", "demo_note"],
        dataVersion: "demo-layer-pack-v1",
        datasetContext: {
          ...sharedDataset,
          layerId: "urban_block_access_index",
          layerTitle: "Urban Block Access Index",
          thematicCoverage: ["mobility", "accessibility"],
          spatialExtent: "Synthetic urban block footprints: Fatih, Uskudar, Kadikoy",
          schemaSummary: ["block_id", "block_name", "access_class", "access_score", "dwellings", "demo_note"],
        },
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [sharedCaveats[1]!] },
        geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 6, source: "explicit", notes: ["Synthetic urban block footprints."], bounds: transitBounds },
        schemaSummary: {
          fieldCount: 6,
          fields: [
            { name: "block_id", role: "identifier", type: "string" },
            { name: "block_name", role: "attribute", type: "string" },
            { name: "access_class", role: "attribute", type: "string" },
            { name: "access_score", role: "attribute", type: "number" },
            { name: "dwellings", role: "attribute", type: "number" },
            { name: "demo_note", role: "attribute", type: "string" },
          ],
          source: "explicit",
          notes: ["Demo schema for UI review."],
        },
        licenseAttribution: { license: "Demo only", attribution: "Synthetic demo data - Map Explorer", sourceName: DEMO_LAYER_PACK_TITLE, requiresAttribution: true, source: "explicit", notes: sharedCaveats },
        publicationReadiness: { status: "ready-with-caveats", missingFields: [], blockingIssueIds: [], caveats: sharedCaveats, checkedAt: createdAt },
        scientificQA: { status: "warning", issueIds: ["demo-sample-data"], badges: ["sample_data"], checkedAt: createdAt, featureIssueCount: 0, usedWorker: false, caveats: sharedCaveats, signature: "demo-layer-pack-v1" },
      },
    },
    {
      id: "demo-cooling-sites",
      name: "Demo Building Heat Exposure",
      type: "geojson",
      visible: true,
      opacity: 0.68,
      group: "data",
      sourceKind: "demo",
      qaStatus: "warning",
      queryable: true,
      sourceData: coolingPriorityAreas,
      style: {
        "fill-color": [
          "match",
          ["get", "risk_class"],
          "Very high", "#DC2626",
          "High", "#F97316",
          "Moderate", "#A855F7",
          "Low", "#22C55E",
          "#94A3B8",
        ],
        "fill-outline-color": "rgba(15, 23, 42, 0.86)",
        __labelField: "building_id",
        __labelSize: 10,
        legendEntries: [{ label: "Demo building heat exposure", color: "#F97316" }],
      },
      provenance: {
        label: DEMO_LAYER_PROVENANCE,
        sourceName: DEMO_LAYER_PACK_TITLE,
        license: "Demo only",
        attribution: "Synthetic demo data - Map Explorer",
        generatedAt: createdAt,
        notes: sharedCaveats,
      },
      metadata: {
        featureCount: 6,
        geometryType: "Polygon",
        bounds: coolingBounds,
        fields: ["building_id", "building_name", "use_type", "risk_class", "heat_exposure", "floors", "demo_note"],
        dataVersion: "demo-layer-pack-v1",
        datasetContext: {
          ...sharedDataset,
          layerId: "building_heat_exposure",
          layerTitle: "Building Heat Exposure",
          thematicCoverage: ["climate_adaptation", "public_realm"],
          spatialExtent: "Synthetic building footprints: Fatih, Uskudar, Kadikoy",
          schemaSummary: ["building_id", "building_name", "use_type", "risk_class", "heat_exposure", "floors", "demo_note"],
        },
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [sharedCaveats[1]!] },
        geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 6, source: "explicit", notes: ["Synthetic building footprints."], bounds: coolingBounds },
        schemaSummary: {
          fieldCount: 7,
          fields: [
            { name: "building_id", role: "identifier", type: "string" },
            { name: "building_name", role: "attribute", type: "string" },
            { name: "use_type", role: "attribute", type: "string" },
            { name: "risk_class", role: "attribute", type: "string" },
            { name: "heat_exposure", role: "attribute", type: "number" },
            { name: "floors", role: "attribute", type: "number" },
            { name: "demo_note", role: "attribute", type: "string" },
          ],
          source: "explicit",
          notes: ["Demo schema for UI review."],
        },
        licenseAttribution: { license: "Demo only", attribution: "Synthetic demo data - Map Explorer", sourceName: DEMO_LAYER_PACK_TITLE, requiresAttribution: true, source: "explicit", notes: sharedCaveats },
        publicationReadiness: { status: "ready-with-caveats", missingFields: [], blockingIssueIds: [], caveats: sharedCaveats, checkedAt: createdAt },
        scientificQA: { status: "warning", issueIds: ["demo-sample-data"], badges: ["sample_data"], checkedAt: createdAt, featureIssueCount: 0, usedWorker: false, caveats: sharedCaveats, signature: "demo-layer-pack-v1" },
      },
    },
  ];
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const panelContainer: React.CSSProperties = {
  ...mapStyles.sidePanelSurface,
  left: 0,
  width: "100%",
  borderRight: MAP_STROKES.hairlineSubtle,
  overflow: "visible",
};

const panelCollapsed: React.CSSProperties = {
  ...panelContainer,
  width: "2.5rem",
  overflow: "hidden",
};

const toggleBtn: React.CSSProperties = {
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.none,
  color: MAP_COLORS.amber,
  cursor: "pointer",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.xs}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  transition: MAP_TRANSITIONS.fast,
};

const panelHeader: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
};

const panelTitle: React.CSSProperties = {
  ...mapStyles.sidePanelTitle,
};

const panelCloseBtn: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
};

const searchInputStyle: React.CSSProperties = {
  ...mapStyles.sidePanelSearchInput,
};

const groupHeader: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase" as const,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.xs}`,
  marginTop: 0,
};

const layerRow: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.5rem minmax(0, 1fr) auto",
  alignItems: "start",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  fontSize: 12,
  cursor: "grab",
};

const layerRowDragging: React.CSSProperties = {
  ...layerRow,
  opacity: 0.5,
  background: MAP_COLORS.amberDim,
};

const visibilityBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  padding: 2,
  lineHeight: 1,
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
};

const layerContent: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "grid",
  gap: 5,
};

const layerNameButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  textAlign: "left",
  padding: 0,
  cursor: "pointer",
  minWidth: 0,
  flex: "1 1 12rem",
  maxWidth: "100%",
};

const layerName: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: 12,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  overflowWrap: "anywhere",
  whiteSpace: "normal" as const,
  cursor: "pointer",
};

const layerTextBlock: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const layerNameLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const analysisMetaText: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal" as const,
};

const analysisSummaryText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  lineHeight: 1.35,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal" as const,
};

const layerMetaRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  minWidth: 0,
  overflow: "visible",
};

const layerMetaText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  lineHeight: 1.45,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal",
};

const layerControlRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
};

const layerBadgeRail: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  minWidth: 0,
};

const layerBadgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "8rem",
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const layerActionMenu: React.CSSProperties = {
  position: "relative",
  flexShrink: 0,
  justifySelf: "end",
  alignSelf: "start",
  zIndex: 2,
};

const layerActionSummary: React.CSSProperties = {
  listStyle: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 54,
  background: "rgba(245, 158, 11, 0.1)",
  border: MAP_STROKES.none,
  color: MAP_COLORS.amber,
  cursor: "pointer",
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  padding: "4px 8px",
  lineHeight: 1.2,
  borderRadius: MAP_RADIUS.sm,
  transition: MAP_TRANSITIONS.fast,
};

const layerActionGrid: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 3,
  marginTop: 0,
  padding: 7,
  minWidth: 190,
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: MAP_RADIUS.md,
  background: "rgba(10, 13, 18, 0.96)",
  boxShadow: MAP_SHADOWS.dropdown,
  backdropFilter: "blur(12px)",
  zIndex: MAP_Z_INDEX.dropdown,
};

const layerActionButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  background: "rgba(255,255,255,0.035)",
  border: MAP_STROKES.none,
  color: MAP_COLORS.text,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  padding: "7px 8px",
  lineHeight: 1.15,
  borderRadius: MAP_RADIUS.sm,
  transition: MAP_TRANSITIONS.fast,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "left" as const,
};

const layerActionButtonDanger: React.CSSProperties = {
  color: MAP_COLORS.error,
  background: "rgba(248, 113, 113, 0.08)",
};

const layerActionButtonWarning: React.CSSProperties = {
  color: MAP_COLORS.warning,
  background: "rgba(251, 191, 36, 0.08)",
};

const layerActionButtonDisabled: React.CSSProperties = {
  opacity: 0.9,
  cursor: "not-allowed",
  color: MAP_COLORS.textMuted,
  background: "rgba(255,255,255,0.022)",
};

const staleChip: React.CSSProperties = {
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: MAP_COLORS.amber,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  flexShrink: 0,
};

const columnarChip: React.CSSProperties = {
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: "#7DD3FC",
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  flexShrink: 0,
};

const scientificQaChip: React.CSSProperties = {
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  flexShrink: 0,
  maxWidth: "9rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const scientificQaChipError: React.CSSProperties = {
  color: MAP_COLORS.error,
};

const scientificQaChipWarning: React.CSSProperties = {
  color: MAP_COLORS.warning,
};

const opacitySlider: React.CSSProperties = {
  width: "100%",
  minWidth: 72,
  height: 4,
  accentColor: MAP_COLORS.amber,
  cursor: "pointer",
  flex: 1,
  margin: 0,
};

const cartographyReviewStrip: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgPanel,
};

const cartographyReviewTopLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const cartographyReviewTitle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const cartographyReviewMeta: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const cartographyReviewActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexWrap: "wrap",
};

const addLayerBtn: React.CSSProperties = {
  margin: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  ...mapStyles.sidePanelPrimaryButton,
  textAlign: "center" as const,
};

const layerFooterActions: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const addManualLayerBtn: React.CSSProperties = {
  ...addLayerBtn,
  margin: 0,
};

const addDemoLayersBtn: React.CSSProperties = {
  ...addLayerBtn,
  margin: 0,
  background: "rgba(56, 189, 248, 0.13)",
  border: "1px solid rgba(56, 189, 248, 0.38)",
  color: "#7DD3FC",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  left: `calc(var(--map-layer-panel-width, ${MAP_DIMENSIONS.layerPanelWidth}) + ${MAP_SPACING.sm})`,
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  padding: MAP_SPACING.md,
  zIndex: MAP_Z_INDEX.dropdown,
  width: 300,
  maxHeight: "calc(100% - 16px)",
  overflowY: "auto",
  boxSizing: "border-box",
  fontSize: 11,
  color: MAP_COLORS.text,
};

const dialogOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: MAP_Z_INDEX.dropdown + 1,
};

const dialogStyle: React.CSSProperties = {
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  padding: MAP_SPACING.lg,
  width: 340,
  maxWidth: "90%",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: `6px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontSize: 12,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  marginBottom: 8,
  outline: "none",
  boxSizing: "border-box" as const,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const fieldLabel: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  marginBottom: 4,
  display: "block",
};

const dialogBtnRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 12,
};

const dialogBtn: React.CSSProperties = {
  padding: "5px 14px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  transition: MAP_TRANSITIONS.fast,
};

const dialogBtnPrimary: React.CSSProperties = {
  ...dialogBtn,
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
};

const emptyGroupMsg: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  padding: `4px ${MAP_SPACING.md}`,
  fontStyle: "italic",
};

const analysisSectionTitle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 6,
  color: MAP_COLORS.amber,
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const analysisStatList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 8,
};

const analysisStatRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "baseline",
};

const analysisLegendRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "12px minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center",
};

const rerunBtn: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: "6px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  transition: MAP_TRANSITIONS.fast,
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function resolveLayerSourceKind(layer: OverlayLayerConfig): LayerSourceKind {
  return normalizeLayerRegistryMetadata(layer).sourceKind;
}

function resolveLayerQaStatus(layer: OverlayLayerConfig): LayerQaStatus {
  return normalizeLayerRegistryMetadata(layer).qaStatus;
}

function isLayerQueryable(layer: OverlayLayerConfig): boolean {
  return normalizeLayerRegistryMetadata(layer).queryable;
}

function resolveLayerCrs(layer: OverlayLayerConfig): string {
  return normalizeLayerRegistryMetadata(layer).crsSummary.crs ?? "Unknown CRS";
}

function resolveLayerProvenanceLabel(layer: OverlayLayerConfig): string {
  return normalizeLayerRegistryMetadata(layer).provenance.label;
}

function formatBounds(bounds: [number, number, number, number]): string {
  return `[${bounds.map((b) => b.toFixed(4)).join(", ")}]`;
}

function getLayerBounds(layer: OverlayLayerConfig): [number, number, number, number] | null {
  return layer.metadata?.bounds ?? layer.metadata?.geometrySummary?.bounds ?? null;
}

function formatAnalysisTimestamp(timestamp?: string): string {
  if (!timestamp) return "unknown time";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSummaryValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: Math.abs(value) < 10 ? 0 : 2,
    });
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value == null) {
    return "null";
  }
  return String(value);
}

function formatBytes(value?: number): string {
  if (!value || !Number.isFinite(value)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatColumnarLabel(format: "arrow" | "geoparquet"): string {
  return format === "geoparquet" ? "GeoParquet" : "Arrow";
}

function formatImportSourceLabel(format?: NonNullable<OverlayLayerConfig["metadata"]>["importFormat"]): string | null {
  switch (format) {
    case "geojson":
      return "GeoJSON";
    case "csv":
      return "CSV";
    case "arrow":
      return "Arrow";
    case "geoparquet":
      return "GeoParquet";
    case "kml":
      return "KML";
    case "kmz":
      return "KMZ";
    case "gpx":
      return "GPX";
    default:
      return null;
  }
}

function scientificQaBadgeStyle(badge: LayerScientificQABadge): React.CSSProperties {
  if (badge === "invalid_geometry" || badge === "missing_crs") {
    return { ...scientificQaChip, ...scientificQaChipError };
  }
  if (badge === "sample_data" || badge === "stale_result" || badge === "uncertain_output") {
    return { ...scientificQaChip, ...scientificQaChipWarning };
  }
  return scientificQaChip;
}

type LayerBadgeTone = "neutral" | "info" | "good" | "warning" | "error";

interface LayerBadgeModel {
  id: string;
  label: string;
  title: string;
  tone: LayerBadgeTone;
}

type LayerActionId =
  | "locate"
  | "style"
  | "review"
  | "export"
  | "urban"
  | "ide"
  | "report"
  | "dashboard"
  | "education"
  | "remove"
  | "confirm-remove"
  | "cancel-remove";

type LayerActionTone = "default" | "warning" | "danger";

interface LayerEvidenceActionModel {
  id: LayerActionId;
  label: string;
  title: string;
  tone?: LayerActionTone;
  disabledReason?: string;
  onSelect?: () => void;
}

interface LayerEvidenceActionCallbacks {
  onExportLayer?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onAddLayerToReport?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
}

function layerBadgeToneStyle(tone: LayerBadgeTone): React.CSSProperties {
  switch (tone) {
    case "good":
      return {
        color: "#86EFAC",
        background: "transparent",
      };
    case "warning":
      return {
        color: MAP_COLORS.warning,
        background: "transparent",
      };
    case "error":
      return {
        color: MAP_COLORS.error,
        background: "transparent",
      };
    case "info":
      return {
        color: "#7DD3FC",
        background: "transparent",
      };
    case "neutral":
    default:
      return {};
  }
}

function qaBadgeTone(status: LayerQaStatus): LayerBadgeTone {
  switch (status) {
    case "passed":
      return "good";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "unchecked":
    default:
      return "neutral";
  }
}

function publicationBadgeTone(status: LayerPublicationReadinessStatus): LayerBadgeTone {
  switch (status) {
    case "ready":
      return "good";
    case "ready-with-caveats":
      return "warning";
    case "blocked":
      return "error";
    case "needs-review":
    default:
      return "warning";
  }
}

function formatMetadataField(field: string): string {
  if (field.toLowerCase() === "crs") return "CRS";
  return field.replace(/-/g, " ");
}

function formatMetadataFieldList(fields: string[]): string {
  return fields.map(formatMetadataField).join(", ");
}

function buildPublicationGateReason(layer: OverlayLayerConfig): string | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  const readiness = registry.publicationReadiness;
  if (readiness.status === "blocked") {
    const issueLabel = readiness.blockingIssueIds.length > 0
      ? readiness.blockingIssueIds.join(", ")
      : "QA blocker";
    return `Publication blocked by ${issueLabel}.`;
  }
  if (readiness.status === "needs-review") {
    const missing = registry.readiness.missingFields.length > 0
      ? formatMetadataFieldList(registry.readiness.missingFields)
      : "metadata review";
    return `Publication needs review: missing ${missing}.`;
  }
  return null;
}

function buildLayerBadges(layer: OverlayLayerConfig): LayerBadgeModel[] {
  const registry = normalizeLayerRegistryMetadata(layer);
  const isDerived = registry.sourceKind === "derived" || Boolean(layer.metadata?.analysisResult);
  const crsLabel = registry.crsSummary.status === "known"
    ? registry.crsSummary.crs ?? "CRS known"
    : "CRS missing";
  const publicationLabel = `Publication ${PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status].toLowerCase()}`;
  const badges: LayerBadgeModel[] = [
    {
      id: "source",
      label: SOURCE_KIND_LABELS[registry.sourceKind],
      title: `Source kind: ${SOURCE_KIND_LABELS[registry.sourceKind]}. Provenance: ${registry.provenance.label}`,
      tone: registry.sourceKind === "external" ? "info" : registry.sourceKind === "demo" ? "warning" : "neutral",
    },
  ];

  if (isDerived) {
    badges.push({
      id: "derived",
      label: isDerived ? (layer.metadata?.analysisResult?.stale ? "Derived stale" : "Derived") : "Source layer",
      title: "Derived layer with recorded analysis lineage.",
      tone: layer.metadata?.analysisResult?.stale ? "warning" : isDerived ? "info" : "neutral",
    });
  }

  if (registry.qaStatus === "warning" || registry.qaStatus === "error") {
    badges.push({
      id: "qa",
      label: QA_STATUS_LABELS[registry.qaStatus],
      title: `Scientific QA status: ${QA_STATUS_LABELS[registry.qaStatus]}.`,
      tone: qaBadgeTone(registry.qaStatus),
    });
  }

  if (registry.crsSummary.status !== "known") {
    badges.push({
      id: "crs",
      label: crsLabel,
      title: registry.crsSummary.notes.length > 0
        ? registry.crsSummary.notes.join(" ")
        : `CRS: ${crsLabel}.`,
      tone: registry.crsSummary.status === "known" ? "good" : "error",
    });
  }

  if (registry.publicationReadiness.status === "needs-review" || registry.publicationReadiness.status === "blocked") {
    badges.push({
      id: "publication",
      label: publicationLabel,
      title: buildPublicationGateReason(layer) ?? (registry.publicationReadiness.caveats.join(" ") || "Layer metadata is publication-ready."),
      tone: publicationBadgeTone(registry.publicationReadiness.status),
    });
  }

  return badges;
}

function createLayerAction(
  layer: OverlayLayerConfig,
  id: LayerActionId,
  label: string,
  callback: ((id: string) => void) | undefined,
  disabledReason: string | null,
  fallbackDisabledReason: string,
): LayerEvidenceActionModel {
  const reason = disabledReason ?? (callback ? null : fallbackDisabledReason);
  return {
    id,
    label,
    title: reason ?? `${label} ${layer.name}`,
    ...(reason ? { disabledReason: reason } : {}),
    ...(!reason && callback ? { onSelect: () => callback(layer.id) } : {}),
  };
}

function buildLayerEvidenceActions(
  layer: OverlayLayerConfig,
  callbacks: LayerEvidenceActionCallbacks,
): LayerEvidenceActionModel[] {
  const registry = normalizeLayerRegistryMetadata(layer);
  const publicationGateReason = buildPublicationGateReason(layer);
  const queryGateReason = registry.queryable ? null : "Layer must be queryable before sending feature context to Urban Analytics.";
  const crsGateReason = registry.crsSummary.status === "known" ? null : "Layer needs declared CRS before analytical handoff.";
  const ideGateReason = registry.evidenceArtifactId || registry.provenance.sourceUrl || layer.metadata?.analysisResult?.runId
    ? null
    : "Layer needs an evidence artifact, source URL, or analysis run before IDE handoff.";

  return [
    createLayerAction(
      layer,
      "export",
      "Export",
      callbacks.onExportLayer,
      publicationGateReason,
      "Publication export is not connected from the layer rail yet.",
    ),
    createLayerAction(
      layer,
      "urban",
      "Urban",
      callbacks.onSendLayerToUrban,
      queryGateReason ?? crsGateReason,
      "Urban Analytics handoff is not connected from the layer rail yet.",
    ),
    createLayerAction(
      layer,
      "ide",
      "IDE",
      callbacks.onOpenLayerInIde,
      ideGateReason,
      "IDE handoff is not connected from the layer rail yet.",
    ),
    createLayerAction(
      layer,
      "report",
      "Report",
      callbacks.onAddLayerToReport,
      publicationGateReason,
      "Report handoff is not connected from the layer rail yet.",
    ),
    createLayerAction(
      layer,
      "dashboard",
      "Dashboard",
      callbacks.onBindLayerToDashboard,
      publicationGateReason,
      "Dashboard binding is not connected from the layer rail yet.",
    ),
    createLayerAction(
      layer,
      "education",
      "Education",
      callbacks.onOpenLayerEducationReference,
      null,
      "Education reference is not connected from the layer rail yet.",
    ),
  ];
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

const LayerBadge: React.FC<{ badge: LayerBadgeModel }> = ({ badge }) => (
  <span style={{ ...layerBadgeBase, ...layerBadgeToneStyle(badge.tone) }} title={badge.title}>
    {badge.label}
  </span>
);

interface LayerActionMenuProps {
  layerName: string;
  actions: LayerEvidenceActionModel[];
  forceOpen?: boolean;
  onAnnounce?: (msg: string) => void;
}

function layerActionToneStyle(tone: LayerActionTone | undefined): React.CSSProperties {
  if (tone === "danger") return layerActionButtonDanger;
  if (tone === "warning") return layerActionButtonWarning;
  return {};
}

const LayerActionMenu: React.FC<LayerActionMenuProps> = ({ layerName, actions, forceOpen = false, onAnnounce }) => (
  <details style={layerActionMenu} {...(forceOpen ? { open: true } : {})}>
    <summary style={layerActionSummary} aria-label={`Layer actions for ${layerName}`} title="Layer evidence actions">
      Actions
    </summary>
    <div style={layerActionGrid} role="menu" aria-label={`Evidence actions for ${layerName}`}>
      {actions.map((action) => {
        const disabled = Boolean(action.disabledReason || !action.onSelect);
        const title = action.disabledReason ?? action.title;
        return (
          <button
            key={action.id}
            type="button"
            style={{
              ...layerActionButton,
              ...layerActionToneStyle(action.tone),
              ...(disabled ? layerActionButtonDisabled : {}),
            }}
            disabled={disabled}
            title={title}
            aria-label={disabled ? `${action.label}: ${title}` : `${action.label} ${layerName}`}
            data-layer-action={action.id}
            {...(action.disabledReason ? { "data-disabled-reason": action.disabledReason } : {})}
            onClick={(event) => {
              event.stopPropagation();
              if (disabled || !action.onSelect) {
                if (action.disabledReason) {
                  onAnnounce?.(`${action.label} disabled for ${layerName}: ${action.disabledReason}`);
                }
                return;
              }
              action.onSelect();
              onAnnounce?.(`${action.label} requested for ${layerName}`);
            }}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  </details>
);

/* ---- Metadata Popover ---- */

interface MetadataPopoverProps {
  layer: OverlayLayerConfig;
  topOffset: number;
  onReRunAnalysisLayer?: (id: string, rerunToken?: string | null) => void;
  onAddLayerToReport?: (id: string) => void;
  activeRerunToken?: string | null;
}

const MetadataPopover: React.FC<MetadataPopoverProps> = ({
  layer,
  topOffset,
  onReRunAnalysisLayer,
  onAddLayerToReport,
  activeRerunToken,
}) => {
  const meta = layer.metadata;
  const analysisResult = meta?.analysisResult;
  const datasetContext = meta?.datasetContext;
  const columnar = meta?.columnar;
  const registry = normalizeLayerRegistryMetadata(layer);
  const sourceKind = registry.sourceKind;
  const qaStatus = registry.qaStatus;
  const scientificQA = meta?.scientificQA;
  const cartographyReview = meta?.cartographyReview;
  const queryable = registry.queryable;
  const crs = registry.crsSummary.crs ?? "Unknown CRS";
  const provenanceLabel = registry.provenance.label;
  const reportAction = buildLayerEvidenceActions(layer, {
    ...(onAddLayerToReport ? { onAddLayerToReport } : {}),
  }).find((action) => action.id === "report");
  const isRerunning = Boolean(
    analysisResult?.rerunToken && activeRerunToken === analysisResult.rerunToken,
  );

  return (
    <div
      style={{
        ...popoverStyle,
        top: `clamp(8px, ${topOffset}px, calc(100% - ${POPOVER_ESTIMATED_HEIGHT + 8}px))`,
      }}
      role="tooltip"
      aria-label={`Metadata for ${layer.name}`}
    >
      <div style={{ fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, color: MAP_COLORS.amber, marginBottom: 8 }}>
        {layer.name}
      </div>
      {onAddLayerToReport && reportAction ? (
        <button
          type="button"
          style={{
            ...rerunBtn,
            marginBottom: 10,
            ...(reportAction.disabledReason ? layerActionButtonDisabled : {}),
          }}
          onClick={() => reportAction.onSelect?.()}
          disabled={Boolean(reportAction.disabledReason || !reportAction.onSelect)}
          title={reportAction.disabledReason ?? "Add this layer to the report handoff draft."}
        >
          Add to report
        </button>
      ) : null}
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Type: </span>
        <span>{layer.type}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Source Kind: </span>
        <span>{SOURCE_KIND_LABELS[sourceKind]}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Provenance: </span>
        <span title={provenanceLabel}>{provenanceLabel}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Queryable: </span>
        <span>{queryable ? "Yes" : "No"}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>CRS: </span>
        <span>{crs}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>QA Status: </span>
        <span>{QA_STATUS_LABELS[qaStatus]}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Publication: </span>
        <span>{PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status]}</span>
      </div>
      {scientificQA ? (
        <div>
          <div style={analysisSectionTitle}>Scientific QA</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Checked: </span>
            <span>{formatAnalysisTimestamp(scientificQA.checkedAt)}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Feature Issues: </span>
            <span>{scientificQA.featureIssueCount.toLocaleString()}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Worker: </span>
            <span>{scientificQA.usedWorker ? "Used for geometry validation" : "Inline validation"}</span>
          </div>
          {scientificQA.badges.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {scientificQA.badges.map((badge) => (
                <span key={badge} style={scientificQaBadgeStyle(badge)} title={SCIENTIFIC_QA_BADGE_TITLES[badge]}>
                  {SCIENTIFIC_QA_BADGE_LABELS[badge]}
                </span>
              ))}
            </div>
          ) : null}
          {scientificQA.caveats.length > 0 ? (
            <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
              {scientificQA.caveats.slice(0, 3).map((caveat) => (
                <div key={caveat} style={{ color: MAP_COLORS.textSecondary, lineHeight: 1.35 }}>
                  {caveat}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {cartographyReview ? (
        <div>
          <div style={analysisSectionTitle}>Cartography Review</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Status: </span>
            <span>{cartographyReview.status}</span>
          </div>
          {cartographyReview.reviewedAt ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Reviewed: </span>
              <span>{formatAnalysisTimestamp(cartographyReview.reviewedAt)}</span>
            </div>
          ) : null}
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Applied: </span>
            <span>{cartographyReview.appliedRecommendationIds.length.toLocaleString()} recommendation(s)</span>
          </div>
          {cartographyReview.lastAppliedTitle ? (
            <div style={{ color: MAP_COLORS.textSecondary, lineHeight: 1.35 }}>
              {cartographyReview.lastAppliedTitle}
            </div>
          ) : null}
        </div>
      ) : null}
      {meta?.geometryType ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MAP_COLORS.textMuted }}>Geometry: </span>
          <span>{meta.geometryType}</span>
        </div>
      ) : null}
      {meta?.featureCount != null ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MAP_COLORS.textMuted }}>Features: </span>
          <span>{meta.featureCount.toLocaleString()}</span>
        </div>
      ) : null}
      {columnar ? (
        <div>
          <div style={analysisSectionTitle}>Columnar Runtime</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Format: </span>
            <span>{formatColumnarLabel(columnar.format)}</span>
          </div>
          {columnar.geometryColumn ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Geometry Column: </span>
              <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>{columnar.geometryColumn}</span>
            </div>
          ) : null}
          {columnar.geometryEncoding ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Encoding: </span>
              <span>{columnar.geometryEncoding}</span>
            </div>
          ) : null}
          {columnar.rowCount != null ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Rows: </span>
              <span>{columnar.rowCount.toLocaleString()}</span>
            </div>
          ) : null}
          {columnar.estimatedMemoryBytes != null ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Memory: </span>
              <span>{formatBytes(columnar.estimatedMemoryBytes)}</span>
            </div>
          ) : null}
          {columnar.transferSizeBytes != null ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Worker Transfer: </span>
              <span>{formatBytes(columnar.transferSizeBytes)}</span>
            </div>
          ) : null}
          {columnar.crs ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>CRS: </span>
              <span>{columnar.crs}</span>
            </div>
          ) : null}
          {columnar.geometryTypes && columnar.geometryTypes.length > 0 ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Geometry Types: </span>
              <span>{columnar.geometryTypes.join(", ")}</span>
            </div>
          ) : null}
          {columnar.workerTableName ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Worker Table: </span>
              <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10 }}>{columnar.workerTableName}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {meta?.bounds ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MAP_COLORS.textMuted }}>Extent: </span>
          <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10 }}>
            {formatBounds(meta.bounds)}
          </span>
        </div>
      ) : null}
      {meta?.fields && meta.fields.length > 0 ? (
        <div>
          <span style={{ color: MAP_COLORS.textMuted }}>Fields: </span>
          <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10 }}>
            {meta.fields.join(", ")}
          </span>
        </div>
      ) : null}
      {datasetContext ? (
        <div>
          <div style={analysisSectionTitle}>Teaching Dataset</div>
          {datasetContext.datasetTitle ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Package: </span>
              <span>{datasetContext.datasetTitle}</span>
            </div>
          ) : null}
          {datasetContext.source ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Source: </span>
              <span>{datasetContext.source}</span>
            </div>
          ) : null}
          {datasetContext.license ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>License: </span>
              <span>{datasetContext.license}</span>
            </div>
          ) : null}
          {datasetContext.crs ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>CRS: </span>
              <span>{datasetContext.crs}</span>
            </div>
          ) : null}
          {datasetContext.spatialExtent ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Window: </span>
              <span>{datasetContext.spatialExtent}</span>
            </div>
          ) : null}
          {datasetContext.thematicCoverage && datasetContext.thematicCoverage.length > 0 ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Themes: </span>
              <span>{datasetContext.thematicCoverage.join(", ")}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {analysisResult ? (
        <div>
          <div style={analysisSectionTitle}>Analysis Result</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Engine: </span>
            <span>{analysisResult.engine}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Run Time: </span>
            <span>{formatAnalysisTimestamp(analysisResult.runTimestamp)}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Status: </span>
            <span>{analysisResult.stale ? "Stale" : "Fresh"}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Parameters: </span>
            <span title={analysisResult.parameterSummary}>{analysisResult.parameterSummary}</span>
          </div>
          {Object.keys(analysisResult.statisticalSummary).length > 0 ? (
            <div style={analysisStatList}>
              {Object.entries(analysisResult.statisticalSummary).map(([key, value]) => (
                <div key={key} style={analysisStatRow}>
                  <span style={{ color: MAP_COLORS.textMuted }}>{key}</span>
                  <span style={{ textAlign: "right" }}>{formatSummaryValue(value)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {analysisResult.visualization.legendEntries && analysisResult.visualization.legendEntries.length > 0 ? (
            <div>
              <div style={analysisSectionTitle}>Legend</div>
              <div style={analysisStatList}>
                {analysisResult.visualization.legendEntries.map((entry) => (
                  <div key={`${entry.value}`} style={analysisLegendRow}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: entry.color ?? MAP_COLORS.textMuted,
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    />
                    <span style={{ minWidth: 0 }}>{entry.label}</span>
                    <span style={{ textAlign: "right", color: MAP_COLORS.textMuted }}>
                      {entry.count != null ? formatSummaryValue(entry.count) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {onReRunAnalysisLayer ? (
            <button
              type="button"
              style={{ ...rerunBtn, cursor: analysisResult.rerunToken ? (isRerunning ? "progress" : "pointer") : "not-allowed", opacity: analysisResult.rerunToken ? 1 : 0.5 }}
              onClick={() => onReRunAnalysisLayer(layer.id, analysisResult.rerunToken)}
              disabled={!analysisResult.rerunToken || isRerunning}
              title={analysisResult.rerunToken ? "Re-run this analysis with the recorded method and source layer." : "Missing prerequisite: this analysis result has no rerun token."}
            >
              {isRerunning ? "Re-running..." : "Re-run"}
            </button>
          ) : null}
        </div>
      ) : null}
      {!meta && (
        <div style={{ color: MAP_COLORS.textMuted, fontStyle: "italic" }}>
          Metadata unavailable: this layer has no provenance, schema, or analysis metadata attached.
        </div>
      )}
    </div>
  );
};

/* ---- Add Layer Dialog ---- */

interface AddLayerDialogProps {
  onAdd: (layer: OverlayLayerConfig) => void;
  onClose: () => void;
}

const AddLayerDialog: React.FC<AddLayerDialogProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<OverlayLayerConfig["type"]>("geojson");
  const [sourceKind, setSourceKind] = useState<LayerSourceKind>("imported");
  const [url, setUrl] = useState("");
  const requiresUrl = type === "raster-tile" || type === "vector-tile";
  const canSubmit = Boolean(name.trim()) && (!requiresUrl || Boolean(url.trim()));

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const nextUrl = url.trim();
    const nextName = name.trim();
    const isGeoJsonBacked = type === "geojson" || type === "heatmap";
    const sourceData = nextUrl
      ? nextUrl
      : ({ type: "FeatureCollection", features: [] } satisfies GeoJSON.FeatureCollection);
    const layer: OverlayLayerConfig = {
      id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: nextName,
      type,
      visible: true,
      opacity: 1,
      group: "data",
      sourceData,
      sourceKind,
      qaStatus: "unchecked",
      queryable: isGeoJsonBacked,
      provenance: nextUrl
        ? { label: nextUrl, sourceUrl: nextUrl }
        : { label: `${SOURCE_KIND_LABELS[sourceKind]} layer` },
      ...(isGeoJsonBacked
        ? {
            metadata: {
              featureCount: 0,
              geometryType: "Unknown",
            },
          }
        : {}),
    };
    onAdd(layer);
    onClose();
  }, [canSubmit, name, onAdd, onClose, sourceKind, type, url]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click to dismiss
    <div style={dialogOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="Add layer">
        <div style={{ ...panelTitle, marginBottom: 12 }}>Add Layer</div>

        <label style={fieldLabel}>
          Layer Name
          <input
            style={inputStyle}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Layer"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- dialog focus is intentional UX
            autoFocus
          />
        </label>

        <label style={fieldLabel}>
          Layer Type
          <select
            style={selectStyle}
            value={type}
            onChange={(e) => setType(e.target.value as OverlayLayerConfig["type"])}
          >
            <option value="geojson">GeoJSON</option>
            <option value="heatmap">Heatmap</option>
            <option value="raster-tile">Raster Tile (XYZ)</option>
            <option value="vector-tile">Vector Tile</option>
          </select>
        </label>

        <label style={fieldLabel}>
          Source Kind
          <select
            style={selectStyle}
            value={sourceKind}
            onChange={(e) => setSourceKind(e.target.value as LayerSourceKind)}
          >
            {(Object.keys(SOURCE_KIND_LABELS) as LayerSourceKind[]).map((kind) => (
              <option key={kind} value={kind}>{SOURCE_KIND_LABELS[kind]}</option>
            ))}
          </select>
        </label>

        <label style={fieldLabel}>
          Source URL {requiresUrl ? "(required)" : "(optional)"}
          <input
            style={inputStyle}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/data.geojson"
          />
        </label>

        <div style={dialogBtnRow}>
          <button type="button" style={dialogBtn} onClick={onClose}>Cancel</button>
          <button
            type="button"
            style={dialogBtnPrimary}
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Add layer"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Layer Row                                                          */
/* ================================================================== */

interface LayerRowProps {
  layer: OverlayLayerConfig;
  onToggleVisibility: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onRemove: (id: string) => void;
  onRequestRemove: (id: string) => void;
  onCancelRemove: (id: string) => void;
  onNameClick: (id: string, top: number) => void;
  onOpenSymbology?: (id: string) => void;
  onExportLayer?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onAddLayerToReport?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
  onFocusLayer?: (id: string) => void;
  isSymbologyActive?: boolean;
  isRemovePending: boolean;
  cartographyRecommendationCount?: number;
  onReviewCartography?: (id: string) => void;
  onAnnounce?: (msg: string) => void;
  /** Drag and drop */
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  onToggleVisibility,
  onSetOpacity,
  onRemove,
  onRequestRemove,
  onCancelRemove,
  onNameClick,
  onOpenSymbology,
  onExportLayer,
  onSendLayerToUrban,
  onOpenLayerInIde,
  onAddLayerToReport,
  onBindLayerToDashboard,
  onFocusLayer,
  onOpenLayerEducationReference,
  isSymbologyActive = false,
  isRemovePending,
  cartographyRecommendationCount = 0,
  onReviewCartography,
  onAnnounce,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const analysisResult = layer.metadata?.analysisResult;
  const columnar = layer.metadata?.columnar;
  const scientificQA = layer.metadata?.scientificQA;
  const sourceKind = resolveLayerSourceKind(layer);
  const qaStatus = resolveLayerQaStatus(layer);
  const queryable = isLayerQueryable(layer);
  const crs = resolveLayerCrs(layer);
  const registry = normalizeLayerRegistryMetadata(layer);
  const featureCount = registry.featureCount;
  const layerBounds = getLayerBounds(layer);
  const layerBadges = buildLayerBadges(layer);
  const evidenceActions = buildLayerEvidenceActions(layer, {
    ...(onExportLayer ? { onExportLayer } : {}),
    ...(onSendLayerToUrban ? { onSendLayerToUrban } : {}),
    ...(onOpenLayerInIde ? { onOpenLayerInIde } : {}),
    ...(onAddLayerToReport ? { onAddLayerToReport } : {}),
    ...(onBindLayerToDashboard ? { onBindLayerToDashboard } : {}),
    ...(onOpenLayerEducationReference ? { onOpenLayerEducationReference } : {}),
  });
  const utilityActions: LayerEvidenceActionModel[] = [
    ...(onFocusLayer && layerBounds
      ? [{
          id: "locate" as const,
          label: "Locate",
          title: `Zoom to extent ${formatBounds(layerBounds)}`,
          onSelect: () => onFocusLayer(layer.id),
        }]
      : []),
    ...(onOpenSymbology
      ? [{
          id: "style" as const,
          label: isSymbologyActive ? "Style active" : "Style",
          title: "Open symbology panel",
          tone: isSymbologyActive ? "warning" as const : "default" as const,
          onSelect: () => onOpenSymbology(layer.id),
        }]
      : []),
    ...(onReviewCartography
      ? [{
          id: "review" as const,
          label: cartographyRecommendationCount > 0 ? `Review ${cartographyRecommendationCount}` : "Review",
          title: "Review symbology",
          tone: cartographyRecommendationCount > 0 ? "warning" as const : "default" as const,
          onSelect: () => onReviewCartography(layer.id),
        }]
      : []),
  ];
  const removalActions: LayerEvidenceActionModel[] = isRemovePending
    ? [
        {
          id: "confirm-remove",
          label: "Confirm delete",
          title: "Confirm layer removal",
          tone: "danger",
          onSelect: () => onRemove(layer.id),
        },
        {
          id: "cancel-remove",
          label: "Cancel",
          title: "Cancel layer removal",
          onSelect: () => onCancelRemove(layer.id),
        },
      ]
    : [{
        id: "remove",
        label: "Delete",
        title: "Remove layer",
        tone: "danger",
        onSelect: () => onRequestRemove(layer.id),
      }];
  const rowActions = [...utilityActions, ...evidenceActions, ...removalActions];
  const importFormat = formatImportSourceLabel(layer.metadata?.importFormat);
  const detailSummary = [
    SOURCE_KIND_LABELS[sourceKind],
    importFormat,
    qaStatus === "unchecked" ? null : QA_STATUS_LABELS[qaStatus],
    scientificQA?.featureIssueCount ? `${scientificQA.featureIssueCount.toLocaleString()} QA feature issue(s)` : null,
    queryable ? "queryable" : null,
    featureCount != null ? `${featureCount.toLocaleString()} features` : null,
    crs,
  ].filter(Boolean).join(" / ");

  const handleNameClick = useCallback(() => {
    const top = rowRef.current?.offsetTop ?? 0;
    onNameClick(layer.id, top);
  }, [layer.id, onNameClick]);

  return (
    <div
      ref={rowRef}
      style={isDragging ? layerRowDragging : layerRow}
      draggable
      onDragStart={(e) => onDragStart(e, layer.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, layer.id)}
      onDragEnd={onDragEnd}
      role="option"
      aria-selected={false}
      aria-label={`Layer: ${layer.name}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isRemovePending) {
          onCancelRemove(layer.id);
        }
      }}
    >
      {/* Visibility toggle */}
      <button
        type="button"
        style={visibilityBtn}
        onClick={() => onToggleVisibility(layer.id)}
        aria-label={`${layer.visible ? "Hide" : "Show"} layer ${layer.name}`}
        aria-pressed={layer.visible}
      >
        <span style={{ color: layer.visible ? MAP_COLORS.amber : MAP_COLORS.textMuted, display: "inline-flex", alignItems: "center" }}>
          {layer.visible ? <IconEyeOpen size={13} /> : <IconEyeClosed size={13} />}
        </span>
      </button>

      <div style={layerContent}>
        <div style={layerNameLine}>
          <button
            type="button"
            style={layerNameButton}
            onClick={handleNameClick}
            title="Show layer details"
            aria-label={`Show metadata for ${layer.name}`}
          >
            <span style={layerName}>{layer.name}</span>
          </button>
          {analysisResult?.stale ? (
            <span style={staleChip} title="Source data changed after this analysis result was computed">
              Stale
            </span>
          ) : null}
          {columnar ? (
            <span
              style={columnarChip}
              title={`${formatColumnarLabel(columnar.format)} dataset${columnar.geometryColumn ? ` / ${columnar.geometryColumn}` : ""}`}
            >
              {formatColumnarLabel(columnar.format)}
            </span>
          ) : null}
          {scientificQA?.badges
            .filter((badge) => badge !== "stale_result" || !analysisResult?.stale)
            .map((badge) => (
              <span key={badge} style={scientificQaBadgeStyle(badge)} title={SCIENTIFIC_QA_BADGE_TITLES[badge]}>
                {SCIENTIFIC_QA_BADGE_LABELS[badge]}
              </span>
            ))}
        </div>

        <div style={layerBadgeRail} aria-label={`Layer readiness badges for ${layer.name}`}>
          {layerBadges.map((badge) => (
            <LayerBadge key={badge.id} badge={badge} />
          ))}
        </div>

        {analysisResult ? (
          <div style={layerTextBlock}>
            <span style={analysisMetaText} title={`${analysisResult.engine} at ${formatAnalysisTimestamp(analysisResult.runTimestamp)}`}>
              {analysisResult.engine} • {formatAnalysisTimestamp(analysisResult.runTimestamp)}
            </span>
            <span style={analysisSummaryText} title={analysisResult.parameterSummary}>
              {analysisResult.parameterSummary}
            </span>
          </div>
        ) : null}

        <div style={layerMetaRow} aria-label={`Layer metadata for ${layer.name}`}>
          <span style={layerMetaText} title={detailSummary}>{detailSummary}</span>
        </div>

        <div style={layerControlRow}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.opacity}
            onChange={(e) => onSetOpacity(layer.id, parseFloat(e.target.value))}
            style={opacitySlider}
            aria-label={`Opacity for ${layer.name}: ${Math.round(layer.opacity * 100)}%`}
          />
        </div>
      </div>
      <LayerActionMenu
        layerName={layer.name}
        actions={rowActions}
        forceOpen={isRemovePending}
        {...(onAnnounce ? { onAnnounce } : {})}
      />
    </div>
  );
};

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export const MapLayerManager: React.FC<MapLayerManagerProps> = ({
  overlayLayers,
  onToggleVisibility,
  onSetOpacity,
  onRemoveLayer,
  onReorderLayers,
  onAddLayer,
  onReRunAnalysisLayer,
  onAddLayerToReport,
  onExportLayer,
  onSendLayerToUrban,
  onOpenLayerInIde,
  onBindLayerToDashboard,
  onOpenLayerEducationReference,
  onFocusLayer,
  activeRerunToken = null,
  onOpenSymbology,
  activeSymbologyLayerId = null,
  cartographyReviewState = null,
  onApplyCartographyRecommendation,
  onDismissCartographyRecommendation,
  onUndoCartographyRecommendation,
  canUndoCartographyRecommendation = false,
  onShowCartographyDetails,
  onRequestClose,
  panelStyle,
  onAnnounce,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [popoverLayerId, setPopoverLayerId] = useState<string | null>(null);
  const [popoverTop, setPopoverTop] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartographyPanelOpen, setCartographyPanelOpen] = useState(false);
  const [cartographyLayerFilterId, setCartographyLayerFilterId] = useState<string | null>(null);
  const [pendingRemoveLayerId, setPendingRemoveLayerId] = useState<string | null>(null);
  const hasSearch = query.trim().length > 0;

  const filteredOverlayLayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return overlayLayers.filter((layer) => {
      if (!normalizedQuery) {
        return true;
      }

      const registry = normalizeLayerRegistryMetadata(layer);

      const haystack = [
        layer.name,
        layer.type,
        resolveLayerSourceKind(layer),
        SOURCE_KIND_LABELS[resolveLayerSourceKind(layer)],
        resolveLayerQaStatus(layer),
        QA_STATUS_LABELS[resolveLayerQaStatus(layer)],
        resolveLayerCrs(layer),
        resolveLayerProvenanceLabel(layer),
        isLayerQueryable(layer) ? "queryable" : "not queryable",
        registry.publicationReadiness.status,
        PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status],
        ...registry.readiness.missingFields.map(formatMetadataField),
        ...registry.publicationReadiness.caveats,
        layer.metadata?.geometryType,
        formatImportSourceLabel(layer.metadata?.importFormat),
        layer.metadata?.columnar?.format,
        layer.metadata?.columnar?.geometryColumn,
        layer.metadata?.columnar?.workerTableName,
        layer.metadata?.columnar?.crs,
        layer.metadata?.analysisResult?.engine,
        layer.metadata?.analysisResult?.parameterSummary,
        layer.metadata?.datasetContext?.datasetTitle,
        layer.metadata?.datasetContext?.datasetCity,
        layer.metadata?.datasetContext?.layerTitle,
        layer.metadata?.scientificQA?.status,
        ...(layer.metadata?.datasetContext?.thematicCoverage ?? []),
        ...(layer.metadata?.columnar?.geometryTypes ?? []),
        ...(layer.metadata?.scientificQA?.badges.map((badge) => SCIENTIFIC_QA_BADGE_LABELS[badge]) ?? []),
        ...(layer.metadata?.scientificQA?.caveats ?? []),
        ...(layer.metadata?.fields ?? []),
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [overlayLayers, query]);

  const layerSummary = useMemo(() => ({
    total: overlayLayers.length,
    visible: overlayLayers.filter((layer) => layer.visible).length,
    data: overlayLayers.filter((layer) => (layer.group ?? "data") === "data").length,
    analysis: overlayLayers.filter((layer) => (layer.group ?? "data") === "analysis").length,
  }), [overlayLayers]);

  const cartographyRecommendations = cartographyReviewState?.recommendations ?? [];
  const cartographyRecommendationCountByLayer = useMemo(() => {
    const counts = new Map<string, number>();
    cartographyRecommendations.forEach((recommendation) => {
      counts.set(recommendation.layerId, (counts.get(recommendation.layerId) ?? 0) + 1);
    });
    return counts;
  }, [cartographyRecommendations]);

  const scopedCartographyRecommendations = useMemo(() => {
    if (!cartographyLayerFilterId) return cartographyRecommendations;
    return cartographyRecommendations.filter((recommendation) => recommendation.layerId === cartographyLayerFilterId);
  }, [cartographyLayerFilterId, cartographyRecommendations]);

  const cartographyLayerFilterName = cartographyLayerFilterId
    ? overlayLayers.find((layer) => layer.id === cartographyLayerFilterId)?.name ?? "Selected layer"
    : "Visible map";

  /* Group layers */
  const grouped = useMemo(() => {
    const groups: Record<LayerGroupId, OverlayLayerConfig[]> = {
      base: [],
      data: [],
      voxcity: [],
      analysis: [],
    };
    for (const layer of filteredOverlayLayers) {
      const g = layer.group ?? "data";
      groups[g].push(layer);
    }
    return groups;
  }, [filteredOverlayLayers]);

  /* ---- Drag and drop ---- */
  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => {
    setDragId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;

    const ids = overlayLayers.map((l) => l.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragId);
    onReorderLayers(reordered);
    onAnnounce?.("Layer order updated");
    setDragId(null);
  }, [dragId, overlayLayers, onReorderLayers, onAnnounce]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
  }, []);

  /* ---- Popover ---- */
  const handleNameClick = useCallback((id: string, top: number) => {
    setPopoverLayerId((prev) => (prev === id ? null : id));
    setPopoverTop(top);
  }, []);

  /* ---- Add layer ---- */
  const handleAddLayer = useCallback((layer: OverlayLayerConfig) => {
    onAddLayer(layer);
    onAnnounce?.(`Layer "${layer.name}" added`);
  }, [onAddLayer, onAnnounce]);

  const handleAddDemoLayers = useCallback(() => {
    for (const layer of createMapExplorerDemoLayers()) {
      onAddLayer(layer);
    }
    onAnnounce?.("Two demo layers added or refreshed");
  }, [onAddLayer, onAnnounce]);

  /* ---- Toggle visibility with announcement ---- */
  const handleToggle = useCallback((id: string) => {
    const layer = overlayLayers.find((l) => l.id === id);
    onToggleVisibility(id);
    if (layer) {
      onAnnounce?.(`Layer "${layer.name}" ${layer.visible ? "hidden" : "shown"}`);
    }
  }, [onToggleVisibility, overlayLayers, onAnnounce]);

  const handleRequestRemove = useCallback((id: string) => {
    const layer = overlayLayers.find((entry) => entry.id === id);
    setPendingRemoveLayerId(id);
    onAnnounce?.(`Confirm removal for layer "${layer?.name ?? id}"`);
  }, [onAnnounce, overlayLayers]);

  const handleCancelRemove = useCallback((id: string) => {
    setPendingRemoveLayerId((current) => (current === id ? null : current));
    const layer = overlayLayers.find((entry) => entry.id === id);
    onAnnounce?.(`Removal cancelled for layer "${layer?.name ?? id}"`);
  }, [onAnnounce, overlayLayers]);

  const handleOpenCartographyReview = useCallback((layerId: string | null) => {
    setCartographyLayerFilterId(layerId);
    setCartographyPanelOpen(true);
    const layerName = layerId
      ? overlayLayers.find((layer) => layer.id === layerId)?.name ?? "selected layer"
      : "visible map";
    onAnnounce?.(`Symbology review opened for ${layerName}`);
  }, [onAnnounce, overlayLayers]);

  /* ---- Remove with announcement ---- */
  const handleRemove = useCallback((id: string) => {
    const layer = overlayLayers.find((l) => l.id === id);
    onRemoveLayer(id);
    setPopoverLayerId(null);
    setPendingRemoveLayerId(null);
    onAnnounce?.(`Layer "${layer?.name ?? id}" removed`);
  }, [onRemoveLayer, overlayLayers, onAnnounce]);

  /* ---- Popover layer data ---- */
  const popoverLayer = popoverLayerId
    ? overlayLayers.find((l) => l.id === popoverLayerId) ?? null
    : null;

  /* ---- Collapsed state ---- */
  if (collapsed) {
    return (
      <div style={panelCollapsed} role="region" aria-label="Layer panel (collapsed)">
        <button
          type="button"
          style={toggleBtn}
          onClick={() => setCollapsed(false)}
          aria-label="Expand layer panel"
          title="Expand layer panel"
        >
          ▶
        </button>
      </div>
    );
  }

  const handleClosePanel = () => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }
    setCollapsed(true);
  };

  return (
    <div style={{ ...panelContainer, ...panelStyle }} role="region" aria-label="Layer management panel">
      {/* Panel header */}
      <div style={panelHeader}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Layer stack</span>
          <span style={panelTitle}>Layers</span>
        </div>
        <button
          type="button"
          style={panelCloseBtn}
          onClick={handleClosePanel}
          aria-label="Close layer panel"
          title="Close layer panel"
        >
          <IconClose size={11} />
          Close
        </button>
      </div>

      <div style={mapStyles.sidePanelSummaryStrip} aria-label="Layer stack summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Visible</span>
          <span style={mapStyles.sidePanelMetricValue}>{layerSummary.visible}/{layerSummary.total} visible</span>
        </div>
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Data</span>
          <span style={mapStyles.sidePanelMetricValue}>{layerSummary.data}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Analysis</span>
          <span style={mapStyles.sidePanelMetricValue}>{layerSummary.analysis}</span>
        </div>
      </div>

      {cartographyReviewState && onApplyCartographyRecommendation && onDismissCartographyRecommendation ? (
        <div style={cartographyReviewStrip} aria-label="Cartography review summary">
          <div style={cartographyReviewTopLine}>
            <div>
              <div style={cartographyReviewTitle}>Symbology review</div>
              <div style={cartographyReviewMeta}>
                {cartographyRecommendations.length} recommendation{cartographyRecommendations.length === 1 ? "" : "s"} / {cartographyReviewState.metadata.visibleLayerCount} visible layers
              </div>
            </div>
            <div style={cartographyReviewActions}>
              <button
                type="button"
                style={cartographyRecommendations.length > 0 ? dialogBtnPrimary : dialogBtn}
                onClick={() => handleOpenCartographyReview(null)}
              >
                Review map
              </button>
              {cartographyPanelOpen ? (
                <button type="button" style={dialogBtn} onClick={() => setCartographyPanelOpen(false)}>
                  Hide
                </button>
              ) : null}
            </div>
          </div>

          {cartographyPanelOpen ? (
            <CartographyRecommendationList
              title={`Cartography / ${cartographyLayerFilterName}`}
              recommendations={scopedCartographyRecommendations}
              emptyMessage="No pending cartographic issues in this scope."
              maxItems={4}
              canUndo={canUndoCartographyRecommendation}
              onApply={onApplyCartographyRecommendation}
              onDismiss={onDismissCartographyRecommendation}
              {...(onUndoCartographyRecommendation ? { onUndo: onUndoCartographyRecommendation } : {})}
              {...(onShowCartographyDetails ? { onShowDetails: onShowCartographyDetails } : {})}
            />
          ) : null}
        </div>
      ) : null}

      <div style={{ padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}` }}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ ...searchInputStyle, margin: 0, width: "100%" }}
          placeholder="Search layers..."
          aria-label="Search layers"
        />
      </div>

      {/* Layer groups */}
      <div style={mapStyles.sidePanelBody} role="list" aria-label="Layer list">
        {filteredOverlayLayers.length === 0 ? (
          <div style={emptyGroupMsg}>
            {hasSearch
              ? "No layers match the current search. Clear the search or add a layer whose name, CRS, source, or field metadata matches."
              : "Missing prerequisite: no overlay layers added. Import or add a dataset to enable layer controls, QA, comparison, and report handoff."}
          </div>
        ) : null}

        {/* Data Layers + Analysis Results groups */}
        {GROUP_ORDER.map((groupId) => (
          <React.Fragment key={groupId}>
            {grouped[groupId].length > 0 ? (
              <>
                <div style={groupHeader}>{GROUP_LABELS[groupId]}</div>
                {grouped[groupId].map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={handleToggle}
                    onSetOpacity={onSetOpacity}
                    onRemove={handleRemove}
                    onRequestRemove={handleRequestRemove}
                    onCancelRemove={handleCancelRemove}
                    onNameClick={handleNameClick}
                    isSymbologyActive={activeSymbologyLayerId === layer.id}
                    isRemovePending={pendingRemoveLayerId === layer.id}
                    cartographyRecommendationCount={cartographyRecommendationCountByLayer.get(layer.id) ?? 0}
                    {...(cartographyReviewState ? { onReviewCartography: handleOpenCartographyReview } : {})}
                    {...(onExportLayer ? { onExportLayer } : {})}
                    {...(onSendLayerToUrban ? { onSendLayerToUrban } : {})}
                    {...(onOpenLayerInIde ? { onOpenLayerInIde } : {})}
                    {...(onAddLayerToReport ? { onAddLayerToReport } : {})}
                    {...(onBindLayerToDashboard ? { onBindLayerToDashboard } : {})}
                    {...(onOpenLayerEducationReference ? { onOpenLayerEducationReference } : {})}
                    {...(onFocusLayer ? { onFocusLayer } : {})}
                    {...(onAnnounce ? { onAnnounce } : {})}
                    isDragging={dragId === layer.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    {...(onOpenSymbology &&
                      layer.type === "geojson" &&
                      (layer.metadata?.geometryType?.toLowerCase() ?? "").includes("point")
                        ? { onOpenSymbology }
                        : {})}
                  />
                ))}
              </>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {/* Add layer actions */}
      <div style={layerFooterActions}>
        <button
          type="button"
          style={addManualLayerBtn}
          onClick={() => setShowAddDialog(true)}
          aria-label="Add a new layer"
        >
          Add Layer
        </button>
        <button
          type="button"
          style={addDemoLayersBtn}
          onClick={handleAddDemoLayers}
          aria-label="Add two demo layers"
          title="Add two explicitly labelled demo layers for map review"
        >
          Add Demo Layers
        </button>
      </div>

      {/* Metadata popover */}
      {popoverLayer ? (
        <MetadataPopover
          layer={popoverLayer}
          topOffset={popoverTop}
          activeRerunToken={activeRerunToken}
          {...(onAddLayerToReport ? { onAddLayerToReport } : {})}
          {...(onReRunAnalysisLayer ? { onReRunAnalysisLayer } : {})}
        />
      ) : null}

      {/* Add layer dialog */}
      {showAddDialog ? (
        <AddLayerDialog
          onAdd={handleAddLayer}
          onClose={() => setShowAddDialog(false)}
        />
      ) : null}
    </div>
  );
};
