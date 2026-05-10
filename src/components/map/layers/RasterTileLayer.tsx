/**
 * Raster-tile layer — displays WMS / WMTS / XYZ imagery tiles.
 */
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RasterSourceType = 'xyz' | 'wms';

export interface RasterTileConfig {
  id: string;
  /**
   * URL template.
   * - XYZ: use `{x}`, `{y}`, `{z}` placeholders.
   * - WMS: base endpoint (query params are appended automatically).
   */
  url: string;
  sourceType?: RasterSourceType;
  /** WMS LAYERS parameter (required when sourceType is `'wms'`). */
  wmsLayers?: string;
  /** Tile size in pixels (default 256). */
  tileSize?: number;
  minZoom?: number;
  maxZoom?: number;
  opacity?: number;
  visible?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Build a WMS GetMap URL for a tile given its geographic bbox.
 */
function buildWMSTileUrl(
  base: string,
  layers: string,
  bbox: { west: number; south: number; east: number; north: number },
): string {
  const sep = base.includes('?') ? '&' : '?';
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  return (
    `${base}${sep}SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&LAYERS=${encodeURIComponent(layers)}` +
    `&BBOX=${bboxStr}&WIDTH=256&HEIGHT=256` +
    `&CRS=EPSG%3A4326&FORMAT=image%2Fpng&TRANSPARENT=true`
  );
}

/** Convert tile index to geographic bbox. */
function tileToBbox(
  x: number,
  y: number,
  z: number,
): { west: number; south: number; east: number; north: number } {
  const n = Math.pow(2, z);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
  const north = (northRad * 180) / Math.PI;
  const south = (southRad * 180) / Math.PI;
  return { west, south, east, north };
}

/** Load an image from a URL, returning a promise that resolves to an HTMLImageElement. */
function loadTileImage(tileUrl: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const onAbort = () => {
      img.src = '';
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    img.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve(img);
    };
    img.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error(`Failed to load tile: ${tileUrl}`));
    };
    img.src = tileUrl;
  });
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/** Create a deck.gl TileLayer for raster imagery. */
export function createRasterTileLayer(config: RasterTileConfig) {
  const {
    id,
    url,
    sourceType = 'xyz',
    wmsLayers = '',
    tileSize = 256,
    minZoom = 0,
    maxZoom = 19,
    opacity = 1,
    visible = true,
  } = config;

  return new TileLayer({
    id,
    visible,
    opacity,
    minZoom,
    maxZoom,
    tileSize,

    getTileData: (tileParams: any) => {
      const { x, y, z } = tileParams.index ?? tileParams;
      const tileUrl =
        sourceType === 'wms'
          ? buildWMSTileUrl(url, wmsLayers, tileToBbox(x, y, z))
          : url
              .replace('{x}', String(x))
              .replace('{y}', String(y))
              .replace('{z}', String(z));
      return loadTileImage(tileUrl, tileParams.signal);
    },

    renderSubLayers: (props: any) => {
      if (!props.data) return null;

      const { boundingBox } = props.tile;
      if (!boundingBox) return null;

      return new BitmapLayer(props, {
        image: props.data,
        bounds: [
          boundingBox[0][0],
          boundingBox[0][1],
          boundingBox[1][0],
          boundingBox[1][1],
        ],
      });
    },
  });
}
