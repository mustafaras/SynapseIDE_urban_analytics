export type Command = {
  id: string;
  label: string;
  shortcut?: string;
  category?: string;
  /** Extra search terms that boost this command when queried. */
  keywords?: string[];
  /**
   * Whether the command is available in the current context.
   * Pass `false` or a function returning `false` to mark the command as
   * disabled. Defaults to enabled when omitted.
   */
  enabled?: boolean | (() => boolean);
  /** Explanation shown in the palette when the command is disabled. */
  reason?: string;
  run: () => void;
};

let registry: Command[] = [];

export function registerCommands(cmds: Command[]) {
  cmds.forEach(c => {
    const i = registry.findIndex(x => x.id === c.id);
    if (i >= 0) registry[i] = c;
    else registry.push(c);
  });
}

export function unregisterCommands(ids: string[]) {
  registry = registry.filter(c => !ids.includes(c.id));
}

export function listCommands(): Command[] {
  return registry.slice();
}

/**
 * Geo-format registry — the canonical list of file types eligible for the
 * IDE→Map Explorer handoff. Grouped by family so the UI can label/badge the
 * active dataset (vector / raster / point cloud / cad / tabular / archive).
 */
export type GeoFormatFamily =
  | 'vector'
  | 'raster'
  | 'pointcloud'
  | 'cad'
  | 'tabular'
  | 'archive';

export interface GeoFormatInfo {
  ext: string;            // e.g. ".geojson"
  family: GeoFormatFamily;
  label: string;          // short human label, e.g. "GeoJSON"
}

const GEO_FORMAT_TABLE: Record<string, { family: GeoFormatFamily; label: string }> = {
  // ── Vector ─────────────────────────────────────────────────────────
  '.geojson':   { family: 'vector', label: 'GeoJSON' },
  '.topojson':  { family: 'vector', label: 'TopoJSON' },
  '.kml':       { family: 'vector', label: 'KML' },
  '.kmz':       { family: 'vector', label: 'KMZ' },
  '.gpx':       { family: 'vector', label: 'GPX' },
  '.shp':       { family: 'vector', label: 'Shapefile' },
  '.dbf':       { family: 'vector', label: 'Shapefile (dbf)' },
  '.shx':       { family: 'vector', label: 'Shapefile (shx)' },
  '.prj':       { family: 'vector', label: 'Shapefile (prj)' },
  '.cpg':       { family: 'vector', label: 'Shapefile (cpg)' },
  '.gpkg':      { family: 'vector', label: 'GeoPackage' },
  '.fgb':       { family: 'vector', label: 'FlatGeobuf' },
  '.geoparquet':{ family: 'vector', label: 'GeoParquet' },
  // ── Raster ─────────────────────────────────────────────────────────
  '.tif':       { family: 'raster', label: 'GeoTIFF' },
  '.tiff':      { family: 'raster', label: 'GeoTIFF' },
  '.geotiff':   { family: 'raster', label: 'GeoTIFF' },
  '.mbtiles':   { family: 'raster', label: 'MBTiles' },
  '.pmtiles':   { family: 'raster', label: 'PMTiles' },
  '.nc':        { family: 'raster', label: 'NetCDF' },
  '.grib':      { family: 'raster', label: 'GRIB' },
  '.grib2':     { family: 'raster', label: 'GRIB2' },
  '.vrt':       { family: 'raster', label: 'GDAL VRT' },
  '.img':       { family: 'raster', label: 'Erdas IMG' },
  // ── Point cloud / 3D ───────────────────────────────────────────────
  '.las':       { family: 'pointcloud', label: 'LAS' },
  '.laz':       { family: 'pointcloud', label: 'LAZ' },
  '.copc':      { family: 'pointcloud', label: 'COPC' },
  // ── CAD ────────────────────────────────────────────────────────────
  '.dxf':       { family: 'cad', label: 'DXF' },
  '.dwg':       { family: 'cad', label: 'DWG' },
  // ── Tabular (geometry-bearing) ─────────────────────────────────────
  '.parquet':   { family: 'tabular', label: 'Parquet' },
  '.csv':       { family: 'tabular', label: 'CSV' },
  '.tsv':       { family: 'tabular', label: 'TSV' },
  '.ndjson':    { family: 'tabular', label: 'NDJSON' },
};

/** File extensions that indicate a spatial / GIS layer eligible for Map Explorer handoff. */
export const SPATIAL_EXTS = new Set(Object.keys(GEO_FORMAT_TABLE));

/** Returns true when the given file path looks like a spatial layer file. */
export function isSpatialFile(path: string | undefined): boolean {
  return getGeoFormatInfo(path) !== null;
}

/** Returns geo-format metadata for the given path, or null if unrecognized. */
export function getGeoFormatInfo(path: string | undefined): GeoFormatInfo | null {
  if (!path) return null;
  const dot = path.lastIndexOf('.');
  if (dot === -1) return null;
  const ext = path.slice(dot).toLowerCase();
  const entry = GEO_FORMAT_TABLE[ext];
  return entry ? { ext, family: entry.family, label: entry.label } : null;
}

export function fuzzyFilter(query: string, items: Command[]): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const scored = items
    .map(item => {
      const s = item.label.toLowerCase();
      const kws = (item.keywords ?? []).map(k => k.toLowerCase());
      let score = -Infinity;
      if (s.startsWith(q)) score = 100 - s.indexOf(q);
      else if (s.includes(q)) score = 60 - s.indexOf(q);
      else {
        // keyword match — lower priority than a direct label match
        for (const kw of kws) {
          if (kw.startsWith(q)) { score = Math.max(score, 50); break; }
          if (kw.includes(q)) { score = Math.max(score, 35); break; }
        }
        if (score === -Infinity) {
          // fuzzy character sequence match on the label
          let qi = 0,
            si = 0,
            gaps = 0;
          while (qi < q.length && si < s.length) {
            if (q[qi] === s[si]) qi++;
            else gaps++;
            si++;
          }
          score = qi === q.length ? 40 - gaps : -Infinity;
        }
      }
      return { item, score };
    })
    .filter(x => x.score > -Infinity)
    .sort((a, b) => b.score - a.score);
  return scored.map(x => x.item);
}
