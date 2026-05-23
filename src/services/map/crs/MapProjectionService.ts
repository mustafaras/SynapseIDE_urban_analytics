import proj4 from "proj4";

export type MapCoordinate2D = readonly [number, number];
export type MapProjectedCoordinate2D = [number, number];
export type MapExtent = readonly [number, number, number, number];

export const WGS84_CRS = "EPSG:4326";
export const WEB_MERCATOR_CRS = "EPSG:3857";
export const WORLD_EQUAL_AREA_CRS = "EPSG:6933";

const GEOGRAPHIC_CRS = new Set(["EPSG:4326", "OGC:CRS84", "CRS:84", "WGS84", "WGS 84"]);
const DYNAMIC_EQUAL_AREA_PREFIX = "SYNAPSE_LAEA";

registerCommonDefinitions();

export function project(
  coords: MapCoordinate2D,
  from: string,
  to: string,
): MapProjectedCoordinate2D {
  const source = normalizeCrs(from);
  const target = normalizeCrs(to);
  if (source === target) {
    return [coords[0], coords[1]];
  }
  const projected = proj4(source, target, [coords[0], coords[1]]) as [number, number];
  return projected;
}

export function isProjected(crs: string | null | undefined): boolean {
  if (!crs) return false;
  const normalized = normalizeCrs(crs);
  if (GEOGRAPHIC_CRS.has(normalized)) return false;
  if (normalized === WEB_MERCATOR_CRS || normalized === WORLD_EQUAL_AREA_CRS) return true;
  if (/^EPSG:326\d{2}$/.test(normalized) || /^EPSG:327\d{2}$/.test(normalized)) return true;
  if (normalized.startsWith(DYNAMIC_EQUAL_AREA_PREFIX)) return true;

  const definition = proj4.defs(normalized) as unknown;
  const definitionText = typeof definition === "string" ? definition.toLowerCase() : "";
  if (definitionText.includes("+proj=longlat")) return false;
  if (definitionText.includes("+units=m") || /\+proj=(utm|merc|laea|aea|cea|eqearth)\b/.test(definitionText)) {
    return true;
  }

  const projName = readProjName(definition);
  if (!projName) return false;
  return !["longlat", "latlong"].includes(projName.toLowerCase());
}

export function localUtmFor(lng: number, lat: number): string {
  const zone = utmZoneNumberForLng(lng);
  const base = lat >= 0 ? 32600 : 32700;
  return `EPSG:${base + zone}`;
}

export function worldEqualArea(): string {
  registerWorldEqualArea();
  return WORLD_EQUAL_AREA_CRS;
}

export function localEqualAreaFor(lng: number, lat: number): string {
  const lon0 = clamp(lng, -180, 180);
  const lat0 = clamp(lat, -85, 85);
  const code = `${DYNAMIC_EQUAL_AREA_PREFIX}_${coordinateToken(lat0)}_${coordinateToken(lon0)}`;
  if (!proj4.defs(code)) {
    proj4.defs(code, `+proj=laea +lat_0=${lat0} +lon_0=${lon0} +datum=WGS84 +units=m +no_defs`);
  }
  return code;
}

export function equalAreaForExtent(extent: MapExtent | null | undefined): string {
  if (!extent) return worldEqualArea();
  const [lng, lat] = centroidForExtent(extent);
  return localEqualAreaFor(lng, lat);
}

export function centroidForExtent(extent: MapExtent): [number, number] {
  const [minX, minY, maxX, maxY] = extent;
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

export function normalizeCrs(crs: string): string {
  const trimmed = crs.trim();
  if (!trimmed) return trimmed;
  return trimmed.toUpperCase().replace(/^EPSG::/, "EPSG:");
}

function registerCommonDefinitions(): void {
  registerUtmDefinitions();
  registerWorldEqualArea();
}

function registerUtmDefinitions(): void {
  for (let zone = 1; zone <= 60; zone += 1) {
    const northCode = `EPSG:${32600 + zone}`;
    const southCode = `EPSG:${32700 + zone}`;
    if (!proj4.defs(northCode)) {
      proj4.defs(northCode, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`);
    }
    if (!proj4.defs(southCode)) {
      proj4.defs(southCode, `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`);
    }
  }
}

function registerWorldEqualArea(): void {
  if (!proj4.defs(WORLD_EQUAL_AREA_CRS)) {
    proj4.defs(WORLD_EQUAL_AREA_CRS, "+proj=cea +lat_ts=30 +lon_0=0 +datum=WGS84 +units=m +no_defs");
  }
}

function utmZoneNumberForLng(lng: number): number {
  const normalizedLng = clamp(lng, -180, 179.999999);
  return Math.max(1, Math.min(60, Math.floor((normalizedLng + 180) / 6) + 1));
}

function coordinateToken(value: number): string {
  const scaled = Math.round(value * 1_000);
  return scaled < 0 ? `m${Math.abs(scaled)}` : `p${scaled}`;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

function readProjName(definition: unknown): string | null {
  if (!definition || typeof definition !== "object" || !("projName" in definition)) {
    return null;
  }
  const value = (definition as { projName?: unknown }).projName;
  return typeof value === "string" ? value : null;
}

export const MapProjectionService = {
  project,
  isProjected,
  localUtmFor,
  worldEqualArea,
  localEqualAreaFor,
  equalAreaForExtent,
  centroidForExtent,
  normalizeCrs,
} as const;