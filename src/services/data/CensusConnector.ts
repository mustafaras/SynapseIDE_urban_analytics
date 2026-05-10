/**
 * CensusConnector — Fetch US Census ACS 5-year data with geography.
 *
 * Returns GeoJSON FeatureCollections with census geometry + attributes.
 * Uses the Census Bureau API (data.census.gov) and TIGERweb for geometries.
 */

import type { Feature, FeatureCollection, Geometry } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BBox = [south: number, west: number, north: number, east: number];
export type CensusGeography = 'tract' | 'block group' | 'county' | 'place';

export type CensusVariableGroup =
  | 'population'
  | 'income'
  | 'housing'
  | 'education'
  | 'age'
  | 'race'
  | 'commute';

export interface CensusVariable {
  code: string;
  label: string;
  group: CensusVariableGroup;
}

export interface CensusDataRow {
  geoid: string;
  name: string;
  state: string;
  county: string;
  tract?: string;
  blockGroup?: string;
  values: Record<string, number | null>;
}

/* ------------------------------------------------------------------ */
/*  Variable catalogue (ACS 5-year)                                    */
/* ------------------------------------------------------------------ */

export const CENSUS_VARIABLES: readonly CensusVariable[] = [
  // Population
  { code: 'B01003_001E', label: 'Total Population', group: 'population' },
  { code: 'B01001_002E', label: 'Male Population', group: 'population' },
  { code: 'B01001_026E', label: 'Female Population', group: 'population' },
  { code: 'B25001_001E', label: 'Total Housing Units', group: 'population' },

  // Income
  { code: 'B19013_001E', label: 'Median Household Income', group: 'income' },
  { code: 'B19301_001E', label: 'Per Capita Income', group: 'income' },
  { code: 'B17001_002E', label: 'Pop Below Poverty Level', group: 'income' },

  // Housing
  { code: 'B25077_001E', label: 'Median Home Value', group: 'housing' },
  { code: 'B25064_001E', label: 'Median Gross Rent', group: 'housing' },
  { code: 'B25002_002E', label: 'Occupied Housing Units', group: 'housing' },
  { code: 'B25002_003E', label: 'Vacant Housing Units', group: 'housing' },

  // Education
  { code: 'B15003_022E', label: "Bachelor's Degree", group: 'education' },
  { code: 'B15003_023E', label: "Master's Degree", group: 'education' },
  { code: 'B15003_025E', label: 'Doctorate Degree', group: 'education' },

  // Age
  { code: 'B01002_001E', label: 'Median Age', group: 'age' },
  { code: 'B09001_001E', label: 'Pop Under 18', group: 'age' },
  { code: 'B16004_001E', label: 'Pop 5 Years and Over', group: 'age' },
] as const;

export function variablesByGroup(group: CensusVariableGroup): CensusVariable[] {
  return CENSUS_VARIABLES.filter(v => v.group === group);
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

const CENSUS_API = 'https://api.census.gov/data';
const TIGER_WMS = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2022/MapServer';

let _apiKey: string | null = null;

/** Optionally set an API key (Census allows limited keyless access). */
export function setApiKey(key: string): void {
  _apiKey = key;
}

function buildCensusUrl(
  year: number,
  dataset: string,
  variables: string[],
  forGeo: string,
  inGeo: string,
): string {
  const vars = variables.join(',');
  let url = `${CENSUS_API}/${year}/${dataset}?get=NAME,${vars}&for=${forGeo}&in=${inGeo}`;
  if (_apiKey) url += `&key=${_apiKey}`;
  return url;
}

/* ------------------------------------------------------------------ */
/*  State FIPS lookup from bbox (approximate)                          */
/* ------------------------------------------------------------------ */

async function resolveStateFIPS(bbox: BBox): Promise<string[]> {
  // Use the Census geocoder to find which state(s) the bbox center falls in
  const centerLat = (bbox[0] + bbox[2]) / 2;
  const centerLng = (bbox[1] + bbox[3]) / 2;
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${centerLng}&y=${centerLat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census geocoder error: ${res.status}`);
  const json = (await res.json()) as {
    result: { geographies: Record<string, { STATE: string; COUNTY: string }[]> };
  };
  const geos = Object.values(json.result.geographies).flat();
  const states = [...new Set(geos.map(g => g.STATE).filter(Boolean))];
  return states.length > 0 ? states : ['*'];
}

/* ------------------------------------------------------------------ */
/*  Fetch census data                                                  */
/* ------------------------------------------------------------------ */

async function fetchData(
  variables: CensusVariable[],
  geography: CensusGeography,
  stateFIPS: string,
  countyFIPS?: string,
  year = 2022,
): Promise<CensusDataRow[]> {
  const codes = variables.map(v => v.code);
  let forGeo: string;
  let inGeo: string;

  switch (geography) {
    case 'tract':
      forGeo = 'tract:*';
      inGeo = countyFIPS ? `state:${stateFIPS}+county:${countyFIPS}` : `state:${stateFIPS}`;
      break;
    case 'block group':
      forGeo = 'block group:*';
      inGeo = countyFIPS ? `state:${stateFIPS}+county:${countyFIPS}` : `state:${stateFIPS}`;
      break;
    case 'county':
      forGeo = 'county:*';
      inGeo = `state:${stateFIPS}`;
      break;
    case 'place':
      forGeo = 'place:*';
      inGeo = `state:${stateFIPS}`;
      break;
  }

  const url = buildCensusUrl(year, 'acs/acs5', codes, forGeo, inGeo);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census API error ${res.status}: ${res.statusText}`);
  const raw = (await res.json()) as string[][];
  if (raw.length < 2) return [];

  const header = raw[0];
  const stateIdx = header.indexOf('state');
  const countyIdx = header.indexOf('county');
  const tractIdx = header.indexOf('tract');
  const bgIdx = header.indexOf('block group');
  const nameIdx = header.indexOf('NAME');

  return raw.slice(1).map(row => {
    const state = stateIdx >= 0 ? row[stateIdx] : '';
    const county = countyIdx >= 0 ? row[countyIdx] : '';
    const tract = tractIdx >= 0 ? row[tractIdx] : undefined;
    const blockGroup = bgIdx >= 0 ? row[bgIdx] : undefined;
    const geoid = [state, county, tract, blockGroup].filter(Boolean).join('');

    const values: Record<string, number | null> = {};
    for (const v of variables) {
      const idx = header.indexOf(v.code);
      if (idx >= 0) {
        const raw = row[idx];
        values[v.code] = raw != null && raw !== '' && raw !== '-666666666' ? Number(raw) : null;
      }
    }

    return {
      geoid,
      name: nameIdx >= 0 ? row[nameIdx] : geoid,
      state,
      county,
      ...(tract ? { tract } : {}),
      ...(blockGroup ? { blockGroup } : {}),
      values,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Fetch geometry from TIGERweb                                       */
/* ------------------------------------------------------------------ */

interface TigerFeature {
  attributes: Record<string, string | number>;
  geometry: { rings?: number[][][]; x?: number; y?: number };
}

const TIGER_LAYER_IDS: Record<CensusGeography, number> = {
  tract: 8,
  'block group': 10,
  county: 86,
  place: 28,
};

async function fetchGeometry(
  geography: CensusGeography,
  stateFIPS: string,
  countyFIPS?: string,
): Promise<Map<string, Geometry>> {
  const layerId = TIGER_LAYER_IDS[geography];
  let where = `STATE='${stateFIPS}'`;
  if (countyFIPS) where += ` AND COUNTY='${countyFIPS}'`;

  const url = `${TIGER_WMS}/${layerId}/query?where=${encodeURIComponent(where)}&outFields=GEOID&f=json&outSR=4326&returnGeometry=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TIGERweb error ${res.status}`);
  const json = (await res.json()) as { features?: TigerFeature[] };

  const map = new Map<string, Geometry>();
  for (const f of json.features ?? []) {
    const geoid = String(f.attributes['GEOID'] ?? '');
    if (f.geometry.rings) {
      map.set(geoid, { type: 'Polygon', coordinates: f.geometry.rings });
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch census demographics for a bounding box.
 * Returns a GeoJSON FeatureCollection with census geometry and data attributes.
 */
export async function fetchDemographics(
  bbox: BBox,
  groups: CensusVariableGroup[] = ['population', 'income', 'housing'],
  geography: CensusGeography = 'tract',
  year = 2022,
): Promise<FeatureCollection> {
  const variables = groups.flatMap(g => variablesByGroup(g));
  const states = await resolveStateFIPS(bbox);
  const allRows: CensusDataRow[] = [];

  for (const st of states) {
    const rows = await fetchData(variables, geography, st, undefined, year);
    allRows.push(...rows);
  }

  // Fetch geometries
  const geomMaps = await Promise.all(states.map(st => fetchGeometry(geography, st)));
  const geomLookup = new Map<string, Geometry>();
  for (const m of geomMaps) for (const [k, v] of m) geomLookup.set(k, v);

  // Join data + geometry, filter to bbox
  const features: Feature[] = [];
  for (const row of allRows) {
    const geom = geomLookup.get(row.geoid);
    if (!geom) continue;

    // Build label map
    const props: Record<string, unknown> = { geoid: row.geoid, name: row.name };
    for (const v of variables) {
      const val = row.values[v.code];
      props[v.label] = val;
      props[v.code] = val;
    }

    features.push({ type: 'Feature', geometry: geom, properties: props, id: row.geoid });
  }

  return { type: 'FeatureCollection', features };
}
