/**
 * Map3DSceneController — extrusion config, height-field detection, selection sync,
 * building inspection, and runtime-mode QA for the 2.5D/3D scene.
 *
 * Reuses BuildingConfig from BuildingLayer.tsx and MapVoxCitySyncMetadata for
 * QA metadata — no new top-level types duplicated here.
 */
import type { FeatureCollection, Feature, Polygon } from "geojson";
import type { BuildingConfig } from "@/components/map/layers/BuildingLayer";
import type { MapVoxCitySyncMetadata } from "@/centerpanel/components/map/mapTypes";

/* ------------------------------------------------------------------ */
/*  Public types                                                        */
/* ------------------------------------------------------------------ */

export type Scene3DRuntimeMode = "2d" | "2.5d" | "3d";

/** Resolved height info for a single building feature. */
export interface BuildingHeightInfo {
  featureId: string | number;
  heightMetres: number;
  /** Field that was used to derive the height. */
  sourceField: string;
  /** True when height came from a direct metres field; false = floor-count estimate. */
  isDirect: boolean;
}

/** Result of analysing a FeatureCollection for extrusion readiness. */
export interface ExtrusionAnalysis {
  /** True when at least one feature has a usable height/floor field. */
  canExtrude: boolean;
  /** Field name chosen for direct height (metres). Null when absent. */
  heightField: string | null;
  /** Field name chosen for floor count. Null when absent. */
  floorField: string | null;
  /** Metres per floor assumed when computing from floor count. */
  metersPerLevel: number;
  /** Per-feature height table (only features with a value). */
  heights: BuildingHeightInfo[];
  /**
   * QA caveats surfaced when no height source is available, or when
   * fewer than all features carry a value.
   */
  caveats: string[];
}

/** Slimmed inspector card for a single building. */
export interface BuildingInspectorEntry {
  featureId: string | number;
  heightMetres: number;
  floors: number | null;
  properties: Record<string, unknown>;
  isSelected: boolean;
  caveats: string[];
}

/** Full scene metadata published as evidence / QA payload. */
export interface Scene3DMetadata {
  sceneId: string;
  createdAt: string;
  runtimeMode: Scene3DRuntimeMode;
  layerId: string;
  extrusionAnalysis: ExtrusionAnalysis;
  selectedFeatureIds: string[];
  /** Partial VoxCity sync metadata for cross-panel bridge compatibility. */
  voxCityCompat: Pick<
    MapVoxCitySyncMetadata,
    "version" | "syncId" | "createdAt" | "sourceView" | "selectedFeatureIds" | "selectedBuildingIds" | "caveats"
  >;
}

/* ------------------------------------------------------------------ */
/*  Height-field detection                                              */
/* ------------------------------------------------------------------ */

const KNOWN_HEIGHT_FIELDS = ["height", "building:height", "Height", "HEIGHT", "height_m", "elev_m"];
const KNOWN_FLOOR_FIELDS = [
  "floors",
  "building:levels",
  "levels",
  "Floors",
  "num_floors",
  "floor_count",
];

function detectField(features: Feature[], candidates: string[]): string | null {
  for (const candidate of candidates) {
    const hasValue = features.some((f) => {
      const v = f.properties?.[candidate];
      return v !== null && v !== undefined && !Number.isNaN(Number(v));
    });
    if (hasValue) return candidate;
  }
  return null;
}

/**
 * Analyse a FeatureCollection for extrusion readiness.
 * Prefers a direct height field; falls back to floor count × metersPerLevel.
 */
export function analyseExtrusion(
  collection: FeatureCollection,
  options: {
    heightField?: string;
    floorField?: string;
    metersPerLevel?: number;
  } = {},
): ExtrusionAnalysis {
  const polygonFeatures = collection.features.filter(
    (f): f is Feature<Polygon> => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
  );
  const metersPerLevel = options.metersPerLevel ?? 3;
  const resolvedHeightField =
    options.heightField ?? detectField(polygonFeatures, KNOWN_HEIGHT_FIELDS);
  const resolvedFloorField =
    options.floorField ?? detectField(polygonFeatures, KNOWN_FLOOR_FIELDS);

  const caveats: string[] = [];

  if (!resolvedHeightField && !resolvedFloorField) {
    caveats.push(
      "No height or floor-count field detected — extrusion unavailable. Add a 'height' (metres) or 'floors' / 'building:levels' field to enable 2.5D.",
    );
    return {
      canExtrude: false,
      heightField: null,
      floorField: null,
      metersPerLevel,
      heights: [],
      caveats,
    };
  }

  const heights: BuildingHeightInfo[] = [];
  let missingCount = 0;

  for (const feature of polygonFeatures) {
    const id = feature.id ?? (feature.properties?.id as string | number | undefined) ?? "unknown";
    let heightMetres: number | null = null;
    let sourceField = "";
    let isDirect = false;

    if (resolvedHeightField) {
      const raw = feature.properties?.[resolvedHeightField];
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        heightMetres = parsed;
        sourceField = resolvedHeightField;
        isDirect = true;
      }
    }

    if (heightMetres === null && resolvedFloorField) {
      const raw = feature.properties?.[resolvedFloorField];
      const floors = Number(raw);
      if (!Number.isNaN(floors) && floors > 0) {
        heightMetres = floors * metersPerLevel;
        sourceField = resolvedFloorField;
        isDirect = false;
      }
    }

    if (heightMetres !== null) {
      heights.push({
        featureId: id,
        heightMetres,
        sourceField,
        isDirect,
      });
    } else {
      missingCount += 1;
    }
  }

  if (missingCount > 0) {
    caveats.push(
      `${missingCount} of ${polygonFeatures.length} feature(s) lack a height value and will default to ${metersPerLevel} m (one floor).`,
    );
  }
  if (resolvedFloorField && !resolvedHeightField) {
    caveats.push(
      `Heights estimated from floor count ('${resolvedFloorField}') × ${metersPerLevel} m/floor — not measured data.`,
    );
  }

  return {
    canExtrude: heights.length > 0 || polygonFeatures.length === 0,
    heightField: resolvedHeightField,
    floorField: resolvedFloorField,
    metersPerLevel,
    heights,
    caveats,
  };
}

/* ------------------------------------------------------------------ */
/*  BuildingConfig factory                                              */
/* ------------------------------------------------------------------ */

/**
 * Derive a `BuildingConfig` from an analysis result for use with
 * `createBuildingLayer()`.
 */
export function buildingConfigFromAnalysis(
  layerId: string,
  data: FeatureCollection,
  analysis: ExtrusionAnalysis,
  overrides: Partial<BuildingConfig> = {},
): BuildingConfig {
  return {
    id: layerId,
    data,
    ...(analysis.heightField ? { heightProperty: analysis.heightField } : {}),
    ...(analysis.floorField ? { levelsProperty: analysis.floorField } : {}),
    metersPerLevel: analysis.metersPerLevel,
    colorBy: "height",
    opacity: 0.85,
    visible: true,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Selection sync — 2D ↔ 3D                                           */
/* ------------------------------------------------------------------ */

/**
 * Given the current 2D selected feature IDs and the 3D scene's feature IDs,
 * return which 3D building IDs should be highlighted.
 *
 * Strategy: IDs are matched by string equality after coercion (covers numeric
 * GeoJSON IDs and string property IDs).
 */
export function syncSelectionTo3D(
  selected2dIds: (string | number)[],
  scene3dFeatureIds: (string | number)[],
): string[] {
  const selectedSet = new Set(selected2dIds.map(String));
  return scene3dFeatureIds.map(String).filter((id) => selectedSet.has(id));
}

export function syncSelectionTo2D(
  selected3dBuildingIds: string[],
  _allFeatureIds: (string | number)[],
): string[] {
  return selected3dBuildingIds;
}

/* ------------------------------------------------------------------ */
/*  Building inspector                                                  */
/* ------------------------------------------------------------------ */

export function inspectBuildings(
  collection: FeatureCollection,
  analysis: ExtrusionAnalysis,
  selectedFeatureIds: (string | number)[],
): BuildingInspectorEntry[] {
  const selectedSet = new Set(selectedFeatureIds.map(String));
  const heightMap = new Map(
    analysis.heights.map((h) => [String(h.featureId), h]),
  );

  return collection.features
    .filter((f): f is Feature<Polygon> => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon")
    .map((f) => {
      const id = f.id ?? f.properties?.id ?? "unknown";
      const idStr = String(id);
      const heightInfo = heightMap.get(idStr);
      const floors = analysis.floorField
        ? (Number(f.properties?.[analysis.floorField]) || null)
        : null;
      const heightMetres = heightInfo?.heightMetres ?? analysis.metersPerLevel;

      const caveats: string[] = [];
      if (!heightInfo) {
        caveats.push(`No height data — defaulting to ${analysis.metersPerLevel} m.`);
      }

      return {
        featureId: id,
        heightMetres,
        floors,
        properties: f.properties ?? {},
        isSelected: selectedSet.has(idStr),
        caveats,
      };
    });
}

/* ------------------------------------------------------------------ */
/*  Scene metadata (runtime + QA)                                       */
/* ------------------------------------------------------------------ */

let _sceneCounter = 0;

export function buildScene3DMetadata(opts: {
  layerId: string;
  runtimeMode: Scene3DRuntimeMode;
  extrusionAnalysis: ExtrusionAnalysis;
  selectedFeatureIds: string[];
}): Scene3DMetadata {
  const sceneId = `scene3d-${++_sceneCounter}-${Date.now()}`;
  const now = new Date().toISOString();

  const voxCityCompat: Scene3DMetadata["voxCityCompat"] = {
    version: 1,
    syncId: sceneId,
    createdAt: now,
    sourceView: "map-2d",
    selectedFeatureIds: opts.selectedFeatureIds,
    selectedBuildingIds: opts.selectedFeatureIds,
    caveats: opts.extrusionAnalysis.caveats,
  };

  return {
    sceneId,
    createdAt: now,
    runtimeMode: opts.runtimeMode,
    layerId: opts.layerId,
    extrusionAnalysis: opts.extrusionAnalysis,
    selectedFeatureIds: opts.selectedFeatureIds,
    voxCityCompat,
  };
}

/* ------------------------------------------------------------------ */
/*  Counter reset (test helper only)                                    */
/* ------------------------------------------------------------------ */

export function _resetSceneCounter(): void {
  _sceneCounter = 0;
}
