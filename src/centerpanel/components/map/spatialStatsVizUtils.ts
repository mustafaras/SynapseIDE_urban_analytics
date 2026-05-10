import { buildFeatureIdentifier, toFiniteNumber } from "./symbologyUtils";

export const LISA_FEATURE_ID_FIELD = "__lisaFeatureId";
export const LISA_CLUSTER_FIELD = "__lisaCluster";
export const LISA_CLUSTER_LABEL_FIELD = "__lisaClusterLabel";
export const LISA_LOCAL_I_FIELD = "__lisaLocalI";
export const LISA_P_VALUE_FIELD = "__lisaPValue";

export const HOT_SPOT_FEATURE_ID_FIELD = "__hotSpotFeatureId";
export const HOT_SPOT_CATEGORY_FIELD = "__hotSpotCategory";
export const HOT_SPOT_CATEGORY_LABEL_FIELD = "__hotSpotCategoryLabel";
export const HOT_SPOT_GI_FIELD = "__hotSpotGiStar";
export const HOT_SPOT_Z_SCORE_FIELD = "__hotSpotZScore";
export const HOT_SPOT_P_VALUE_FIELD = "__hotSpotPValue";

export type LisaClusterCategory = "HH" | "HL" | "LH" | "LL" | "NS";
export type HotSpotCategory =
  | "hot-99"
  | "hot-95"
  | "hot-90"
  | "not-significant"
  | "cold-90"
  | "cold-95"
  | "cold-99";

export interface SpatialStatsLegendItem<TCategory extends string> {
  category: TCategory;
  label: string;
  color: string;
  count: number;
}

export interface ResolvedLisaStats {
  localI: number | null;
  pValue: number | null;
  clusterType: LisaClusterCategory;
  zValue: number | null;
  spatialLag: number | null;
}

export interface ResolvedHotSpotStats {
  giStar: number | null;
  zScore: number | null;
  pValue: number | null;
  confidence: HotSpotCategory;
}

export interface DecoratedLisaResult {
  decoratedCollection: GeoJSON.FeatureCollection;
  legend: SpatialStatsLegendItem<LisaClusterCategory>[];
  validFeatureCount: number;
}

export interface DecoratedHotSpotResult {
  decoratedCollection: GeoJSON.FeatureCollection;
  legend: SpatialStatsLegendItem<HotSpotCategory>[];
  validFeatureCount: number;
}

export const LISA_CLUSTER_COLORS: Record<LisaClusterCategory, string> = {
  HH: "#FF0000",
  HL: "#FF9999",
  LH: "#9999FF",
  LL: "#0000FF",
  NS: "#CCCCCC",
};

export const LISA_CLUSTER_LABELS: Record<LisaClusterCategory, string> = {
  HH: "High-High",
  HL: "High-Low",
  LH: "Low-High",
  LL: "Low-Low",
  NS: "Not Significant",
};

export const HOT_SPOT_COLORS: Record<HotSpotCategory, string> = {
  "hot-99": "#B2182B",
  "hot-95": "#D6604D",
  "hot-90": "#F4A582",
  "not-significant": "#FFFFBF",
  "cold-90": "#92C5DE",
  "cold-95": "#4393C3",
  "cold-99": "#2166AC",
};

export const HOT_SPOT_LABELS: Record<HotSpotCategory, string> = {
  "hot-99": "Hot Spot 99%",
  "hot-95": "Hot Spot 95%",
  "hot-90": "Hot Spot 90%",
  "not-significant": "Not Significant",
  "cold-90": "Cold Spot 90%",
  "cold-95": "Cold Spot 95%",
  "cold-99": "Cold Spot 99%",
};

const LISA_CATEGORY_ORDER: LisaClusterCategory[] = ["HH", "HL", "LH", "LL", "NS"];
const HOT_SPOT_CATEGORY_ORDER: HotSpotCategory[] = [
  "hot-99",
  "hot-95",
  "hot-90",
  "not-significant",
  "cold-90",
  "cold-95",
  "cold-99",
];

const HOT_99_Z = 2.5758293035489004;
const HOT_95_Z = 1.959963984540054;
const HOT_90_Z = 1.6448536269514729;

function readProperty(
  properties: GeoJSON.GeoJsonProperties | null | undefined,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = properties?.[key];
    if (value != null && (!(typeof value === "string") || value.trim().length > 0)) {
      return value;
    }
  }
  return null;
}

export function normalizeLisaClusterType(value: unknown): LisaClusterCategory {
  if (typeof value !== "string") return "NS";
  const normalized = value.trim().toUpperCase();

  if (normalized === "HH") return "HH";
  if (normalized === "HL") return "HL";
  if (normalized === "LH") return "LH";
  if (normalized === "LL") return "LL";
  if (normalized === "NS" || normalized === "NOT-SIGNIFICANT" || normalized === "NOT SIGNIFICANT") {
    return "NS";
  }

  return "NS";
}

export function resolveLisaStats(
  properties: GeoJSON.GeoJsonProperties | null | undefined,
): ResolvedLisaStats {
  return {
    localI: toFiniteNumber(readProperty(properties, ["local_i", "localI"])),
    pValue: toFiniteNumber(readProperty(properties, ["p_value", "pValue"])),
    clusterType: normalizeLisaClusterType(readProperty(properties, ["cluster_type", "clusterType"])),
    zValue: toFiniteNumber(readProperty(properties, ["z_value", "zValue"])),
    spatialLag: toFiniteNumber(readProperty(properties, ["spatial_lag", "spatialLag"])),
  };
}

export function normalizeHotSpotConfidence(value: unknown): HotSpotCategory {
  if (typeof value !== "string") return "not-significant";
  const normalized = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");

  if (normalized === "hot-99" || normalized === "hotspot-99" || normalized === "hot-spot-99") {
    return "hot-99";
  }
  if (normalized === "hot-95" || normalized === "hotspot-95" || normalized === "hot-spot-95") {
    return "hot-95";
  }
  if (normalized === "hot-90" || normalized === "hotspot-90" || normalized === "hot-spot-90") {
    return "hot-90";
  }
  if (normalized === "cold-99" || normalized === "coldspot-99" || normalized === "cold-spot-99") {
    return "cold-99";
  }
  if (normalized === "cold-95" || normalized === "coldspot-95" || normalized === "cold-spot-95") {
    return "cold-95";
  }
  if (normalized === "cold-90" || normalized === "coldspot-90" || normalized === "cold-spot-90") {
    return "cold-90";
  }
  if (
    normalized === "not-significant" ||
    normalized === "not-significant." ||
    normalized === "ns" ||
    normalized === "not-significant,"
  ) {
    return "not-significant";
  }

  return "not-significant";
}

export function classifyHotSpotFromZScore(zScore: number | null): HotSpotCategory {
  if (zScore == null || !Number.isFinite(zScore)) return "not-significant";

  const absZ = Math.abs(zScore);
  if (absZ >= HOT_99_Z) return zScore > 0 ? "hot-99" : "cold-99";
  if (absZ >= HOT_95_Z) return zScore > 0 ? "hot-95" : "cold-95";
  if (absZ >= HOT_90_Z) return zScore > 0 ? "hot-90" : "cold-90";
  return "not-significant";
}

export function resolveHotSpotStats(
  properties: GeoJSON.GeoJsonProperties | null | undefined,
): ResolvedHotSpotStats {
  const zScore = toFiniteNumber(readProperty(properties, ["z_score", "zScore"]));
  const rawConfidence = readProperty(properties, ["confidence_level", "confidence"]);

  return {
    giStar: toFiniteNumber(readProperty(properties, ["gi_star", "giStar"])),
    zScore,
    pValue: toFiniteNumber(readProperty(properties, ["p_value", "pValue"])),
    confidence:
      rawConfidence == null
        ? classifyHotSpotFromZScore(zScore)
        : normalizeHotSpotConfidence(rawConfidence),
  };
}

export function buildLisaDecoratedCollection(
  collection: GeoJSON.FeatureCollection,
  significanceThreshold: number,
): DecoratedLisaResult {
  const counts = new Map<LisaClusterCategory, number>(
    LISA_CATEGORY_ORDER.map((category) => [category, 0]),
  );
  let validFeatureCount = 0;

  const decoratedCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: collection.features.map((feature, index) => {
      const featureId = buildFeatureIdentifier(feature, index);
      const stats = resolveLisaStats(feature.properties);
      const isSignificant =
        stats.pValue != null && Number.isFinite(stats.pValue) && stats.pValue <= significanceThreshold;
      const clusterType = isSignificant ? stats.clusterType : "NS";

      if (stats.localI != null && stats.pValue != null) {
        validFeatureCount += 1;
      }
      counts.set(clusterType, (counts.get(clusterType) ?? 0) + 1);

      const properties = {
        ...(feature.properties ?? {}),
        [LISA_FEATURE_ID_FIELD]: featureId,
        [LISA_CLUSTER_FIELD]: clusterType,
        [LISA_CLUSTER_LABEL_FIELD]: LISA_CLUSTER_LABELS[clusterType],
        [LISA_LOCAL_I_FIELD]: stats.localI,
        [LISA_P_VALUE_FIELD]: stats.pValue,
      } as GeoJSON.GeoJsonProperties;

      return {
        ...feature,
        id: feature.id ?? featureId,
        properties,
      };
    }),
  };

  return {
    decoratedCollection,
    legend: LISA_CATEGORY_ORDER.map((category) => ({
      category,
      label: LISA_CLUSTER_LABELS[category],
      color: LISA_CLUSTER_COLORS[category],
      count: counts.get(category) ?? 0,
    })),
    validFeatureCount,
  };
}

export function buildHotSpotDecoratedCollection(
  collection: GeoJSON.FeatureCollection,
  significanceThreshold: number,
): DecoratedHotSpotResult {
  const counts = new Map<HotSpotCategory, number>(
    HOT_SPOT_CATEGORY_ORDER.map((category) => [category, 0]),
  );
  let validFeatureCount = 0;

  const decoratedCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: collection.features.map((feature, index) => {
      const featureId = buildFeatureIdentifier(feature, index);
      const stats = resolveHotSpotStats(feature.properties);
      const isSignificant =
        stats.pValue != null && Number.isFinite(stats.pValue) && stats.pValue <= significanceThreshold;
      const category = isSignificant ? stats.confidence : "not-significant";

      if (stats.giStar != null && stats.pValue != null && stats.zScore != null) {
        validFeatureCount += 1;
      }
      counts.set(category, (counts.get(category) ?? 0) + 1);

      const properties = {
        ...(feature.properties ?? {}),
        [HOT_SPOT_FEATURE_ID_FIELD]: featureId,
        [HOT_SPOT_CATEGORY_FIELD]: category,
        [HOT_SPOT_CATEGORY_LABEL_FIELD]: HOT_SPOT_LABELS[category],
        [HOT_SPOT_GI_FIELD]: stats.giStar,
        [HOT_SPOT_Z_SCORE_FIELD]: stats.zScore,
        [HOT_SPOT_P_VALUE_FIELD]: stats.pValue,
      } as GeoJSON.GeoJsonProperties;

      return {
        ...feature,
        id: feature.id ?? featureId,
        properties,
      };
    }),
  };

  return {
    decoratedCollection,
    legend: HOT_SPOT_CATEGORY_ORDER.map((category) => ({
      category,
      label: HOT_SPOT_LABELS[category],
      color: HOT_SPOT_COLORS[category],
      count: counts.get(category) ?? 0,
    })),
    validFeatureCount,
  };
}
