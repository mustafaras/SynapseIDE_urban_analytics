import {
  localUtmFor,
  normalizeCrs,
  WEB_MERCATOR_CRS,
  WGS84_CRS,
  WORLD_EQUAL_AREA_CRS,
  type MapExtent,
} from "./MapProjectionService";

/**
 * CRS catalog used by the "Declare CRS" control. Pure data + lookup helpers:
 * a curated list of commonly-declared CRSs, the full WGS 84 UTM grid, a search
 * function, a typed-code parser, and a local UTM / equal-area suggestion derived
 * from a layer extent. Declaring any of these is a *caveated assertion* — this
 * module never asserts that a layer's coordinates actually match the code.
 */

export type CrsCatalogKind = "geographic" | "projected" | "equal-area";

export interface CrsCatalogEntry {
  /** EPSG identifier, e.g. "EPSG:32635". */
  code: string;
  /** Human-readable label. */
  label: string;
  kind: CrsCatalogKind;
  /** Extra lower-case search keywords. */
  keywords?: string[];
}

/** Curated, commonly-declared CRSs shown first in the picker. */
export const COMMON_CRS_ENTRIES: readonly CrsCatalogEntry[] = [
  { code: WGS84_CRS, label: "WGS 84 — geographic lat/lng", kind: "geographic", keywords: ["wgs84", "world", "gps", "latitude", "longitude", "4326"] },
  { code: WEB_MERCATOR_CRS, label: "Web Mercator", kind: "projected", keywords: ["web", "mercator", "google", "slippy", "tile", "3857"] },
  { code: WORLD_EQUAL_AREA_CRS, label: "World Cylindrical Equal Area", kind: "equal-area", keywords: ["world", "equal area", "global", "6933"] },
  { code: "EPSG:3035", label: "ETRS89 / LAEA Europe — equal area", kind: "equal-area", keywords: ["europe", "laea", "equal area"] },
  { code: "EPSG:25832", label: "ETRS89 / UTM zone 32N", kind: "projected", keywords: ["europe", "etrs89", "32n"] },
  { code: "EPSG:25833", label: "ETRS89 / UTM zone 33N", kind: "projected", keywords: ["europe", "etrs89", "33n"] },
  { code: "EPSG:2154", label: "RGF93 / Lambert-93 — France", kind: "projected", keywords: ["france", "lambert"] },
  { code: "EPSG:27700", label: "OSGB36 / British National Grid", kind: "projected", keywords: ["uk", "britain", "osgb", "national grid"] },
  { code: "EPSG:5070", label: "NAD83 / Conus Albers — USA", kind: "projected", keywords: ["usa", "albers", "conus", "nad83"] },
  { code: "EPSG:32635", label: "WGS 84 / UTM zone 35N", kind: "projected", keywords: ["utm", "turkey", "istanbul", "35n"] },
];

const UTM_ZONE_MIN = 1;
const UTM_ZONE_MAX = 60;
const DEFAULT_SEARCH_LIMIT = 24;

/** Generate WGS 84 UTM zone entries (north + south) for every zone. */
export function listUtmCrsEntries(): CrsCatalogEntry[] {
  const entries: CrsCatalogEntry[] = [];
  for (let zone = UTM_ZONE_MIN; zone <= UTM_ZONE_MAX; zone += 1) {
    entries.push({ code: `EPSG:${32600 + zone}`, label: `WGS 84 / UTM zone ${zone}N`, kind: "projected", keywords: ["utm", `${zone}n`, `zone ${zone}`] });
    entries.push({ code: `EPSG:${32700 + zone}`, label: `WGS 84 / UTM zone ${zone}S`, kind: "projected", keywords: ["utm", `${zone}s`, `zone ${zone}`] });
  }
  return entries;
}

/** Full declarable catalog: curated entries first, then the remaining UTM grid (deduped). */
export function crsCatalog(): CrsCatalogEntry[] {
  const seen = new Set(COMMON_CRS_ENTRIES.map((entry) => entry.code));
  const utm = listUtmCrsEntries().filter((entry) => !seen.has(entry.code));
  return [...COMMON_CRS_ENTRIES, ...utm];
}

/** Case-insensitive search over code/label/keywords. An empty query returns the curated head. */
export function searchCrsCatalog(query: string, limit = DEFAULT_SEARCH_LIMIT): CrsCatalogEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  const all = crsCatalog();
  if (!normalizedQuery) return all.slice(0, limit);
  const numeric = normalizedQuery.replace(/^epsg:?/, "");
  const matches = all.filter((entry) => {
    const code = entry.code.toLowerCase();
    return (
      code.includes(normalizedQuery) ||
      code.replace("epsg:", "") === numeric ||
      entry.label.toLowerCase().includes(normalizedQuery) ||
      (entry.keywords?.some((keyword) => keyword.includes(normalizedQuery)) ?? false)
    );
  });
  return matches.slice(0, limit);
}

/** Parse a declarable EPSG code typed directly by the user ("epsg:2100", "EPSG::2100", "2100"). */
export function parseDeclarableCrs(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = normalizeCrs(trimmed);
  if (/^EPSG:\d{3,6}$/.test(normalized)) return normalized;
  if (/^\d{3,6}$/.test(trimmed)) return `EPSG:${trimmed}`;
  return null;
}

export interface SuggestedCrs {
  entry: CrsCatalogEntry;
  rationale: string;
}

export interface LocalCrsSuggestion {
  utm: SuggestedCrs;
  equalArea: SuggestedCrs;
}

/**
 * Suggest the local UTM zone and an equal-area execution CRS for a layer extent
 * (interpreted as lng/lat). Returns null when the extent is unusable. The UTM
 * zone is derived from {@link localUtmFor}; the equal-area code is a declarable
 * global equal-area projection for area-true analytics.
 */
export function suggestLocalCrsForExtent(extent: MapExtent | null | undefined): LocalCrsSuggestion | null {
  if (!extent) return null;
  const [minX, minY, maxX, maxY] = extent;
  const lng = (minX + maxX) / 2;
  const lat = (minY + maxY) / 2;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const utmCode = localUtmFor(lng, lat);
  return {
    utm: {
      entry: { code: utmCode, label: utmLabelForCode(utmCode), kind: "projected" },
      rationale: `Local UTM zone for this layer's centroid (~${lat.toFixed(2)}, ${lng.toFixed(2)}).`,
    },
    equalArea: {
      entry: { code: WORLD_EQUAL_AREA_CRS, label: "World Cylindrical Equal Area", kind: "equal-area" },
      rationale: "Equal-area CRS for area-true analytics across this extent.",
    },
  };
}

function utmLabelForCode(code: string): string {
  const match = /^EPSG:(326|327)(\d{2})$/.exec(code);
  if (!match) return code;
  const hemisphere = match[1] === "326" ? "N" : "S";
  const zone = Number(match[2]);
  return `WGS 84 / UTM zone ${zone}${hemisphere}`;
}
