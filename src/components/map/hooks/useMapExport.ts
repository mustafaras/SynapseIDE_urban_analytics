import { useCallback } from 'react';
import { useMapState, type ViewState } from './useMapState';
import { type LayerConfig, useLayerStack } from './useLayerStack';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ExportFormat = 'png' | 'svg' | 'geojson' | 'pdf';

export interface PdfMeta {
  title?: string;
  subtitle?: string;
  attribution?: string;
  showLegend?: boolean;
  showScaleBar?: boolean;
  showNorthArrow?: boolean;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers — canvas capture                                           */
/* ------------------------------------------------------------------ */

/** Find the DeckGL canvas inside a container element. */
function findMapCanvas(container?: HTMLElement | null): HTMLCanvasElement | null {
  const root = container ?? document.querySelector('.deck-gl-wrapper') ?? document.body;
  // deck.gl renders into a <canvas> – try deckgl canvas first, then maplibre
  const canvases = root.querySelectorAll('canvas');
  // The largest canvas is typically deck.gl's
  let best: HTMLCanvasElement | null = null;
  let bestArea = 0;
  canvases.forEach((c) => {
    const area = c.width * c.height;
    if (area > bestArea) {
      bestArea = area;
      best = c;
    }
  });
  return best;
}

/** Capture the map as a high-DPI PNG Blob. */
async function captureMapPng(dpr = 2): Promise<Blob> {
  const src = findMapCanvas();
  if (!src) throw new Error('No map canvas found');
  const offscreen = document.createElement('canvas');
  offscreen.width = src.width * dpr;
  offscreen.height = src.height * dpr;
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');
  ctx.scale(dpr, dpr);
  ctx.drawImage(src, 0, 0, src.width, src.height);
  return new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers — SVG export (vector layers only)                          */
/* ------------------------------------------------------------------ */

function geojsonToSvgPaths(
  fc: GeoJSON.FeatureCollection,
  vw: ViewState,
  width: number,
  height: number,
): string {
  // Simple Web-Mercator projection into SVG coordinates
  const sx = (lon: number) => {
    const scale = (256 / 360) * Math.pow(2, vw.zoom);
    return (lon - vw.longitude) * scale + width / 2;
  };
  const sy = (lat: number) => {
    const scale = (256 / 360) * Math.pow(2, vw.zoom);
    const radVw = (vw.latitude * Math.PI) / 180;
    const radLat = (lat * Math.PI) / 180;
    const yVw = Math.log(Math.tan(Math.PI / 4 + radVw / 2));
    const yLat = Math.log(Math.tan(Math.PI / 4 + radLat / 2));
    return -(yLat - yVw) * scale * (180 / Math.PI) + height / 2;
  };

  const coordsToPath = (coords: number[][]): string =>
    coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${sx(c[0]).toFixed(1)},${sy(c[1]).toFixed(1)}`).join(' ');

  const paths: string[] = [];
  for (const feat of fc.features) {
    const g = feat.geometry;
    if (g.type === 'Point') {
      const [lon, lat] = g.coordinates as [number, number];
      paths.push(`<circle cx="${sx(lon).toFixed(1)}" cy="${sy(lat).toFixed(1)}" r="4" fill="#f5a623" opacity="0.8"/>`);
    } else if (g.type === 'LineString') {
      paths.push(`<path d="${coordsToPath(g.coordinates as number[][])}" fill="none" stroke="#f5a623" stroke-width="1.5" opacity="0.8"/>`);
    } else if (g.type === 'Polygon') {
      const ring = (g.coordinates as number[][][])[0];
      paths.push(`<path d="${coordsToPath(ring)} Z" fill="rgba(245,166,35,0.25)" stroke="#f5a623" stroke-width="1"/>`);
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates as number[][][][]) {
        paths.push(`<path d="${coordsToPath(poly[0])} Z" fill="rgba(245,166,35,0.25)" stroke="#f5a623" stroke-width="1"/>`);
      }
    } else if (g.type === 'MultiLineString') {
      for (const line of g.coordinates as number[][][]) {
        paths.push(`<path d="${coordsToPath(line)}" fill="none" stroke="#f5a623" stroke-width="1.5" opacity="0.8"/>`);
      }
    }
  }
  return paths.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Helpers — GeoJSON merge                                            */
/* ------------------------------------------------------------------ */

function mergeVisibleGeoJSON(layers: LayerConfig[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    const d = layer.data;
    if (d && typeof d === 'object' && 'type' in (d as Record<string, unknown>)) {
      const geo = d as GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry;
      if (geo.type === 'FeatureCollection') {
        features.push(...geo.features);
      } else if (geo.type === 'Feature') {
        features.push(geo);
      } else if ('coordinates' in geo) {
        features.push({ type: 'Feature', properties: {}, geometry: geo });
      }
    }
  }
  return { type: 'FeatureCollection', features };
}

/* ------------------------------------------------------------------ */
/*  Helpers — PDF composition                                          */
/* ------------------------------------------------------------------ */

async function composePdf(meta: PdfMeta, viewState: ViewState): Promise<Blob> {
  const mapBlob = await captureMapPng(2);
  const mapBmp = await createImageBitmap(await mapBlob.arrayBuffer().then((b) => new Blob([b], { type: 'image/png' })));

  // Build an offscreen canvas at A4 landscape (1123 × 794 @ 96dpi)
  const W = 1123;
  const H = 794;
  const MARGIN = 40;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);

  // Title bar
  const titleH = meta.title ? 48 : 0;
  if (meta.title) {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, W, titleH);
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(meta.title, MARGIN, 30);
    if (meta.subtitle) {
      ctx.fillStyle = '#aaa';
      ctx.font = '13px sans-serif';
      ctx.fillText(meta.subtitle, MARGIN + ctx.measureText(meta.title).width + 16, 30);
    }
  }

  // Map image
  const mapY = titleH + 4;
  const mapH = H - mapY - MARGIN - 24;
  const mapW = W - MARGIN * 2;
  ctx.drawImage(mapBmp, MARGIN, mapY, mapW, mapH);

  // Scale bar placeholder (bottom-left of map area)
  if (meta.showScaleBar !== false) {
    const barY = mapY + mapH - 16;
    const barX = MARGIN + 12;
    ctx.fillStyle = 'rgba(26,26,26,0.7)';
    ctx.fillRect(barX - 4, barY - 14, 120, 22);
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(barX, barY, 80, 4);
    ctx.fillStyle = '#ccc';
    ctx.font = '10px monospace';
    const mpp = (40075016.686 * Math.cos((viewState.latitude * Math.PI) / 180)) / Math.pow(2, viewState.zoom + 8);
    const scaleM = mpp * 80;
    ctx.fillText(scaleM >= 1000 ? `${(scaleM / 1000).toFixed(1)} km` : `${scaleM.toFixed(0)} m`, barX, barY - 3);
  }

  // North arrow (top-right of map area)
  if (meta.showNorthArrow !== false) {
    ctx.save();
    const nx = MARGIN + mapW - 28;
    const ny = mapY + 20;
    ctx.translate(nx, ny);
    ctx.rotate((-viewState.bearing * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-6, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fillStyle = '#f5a623';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('N', -4, -15);
    ctx.restore();
  }

  // Attribution (bottom strip)
  const attrib = meta.attribution ?? '© OpenStreetMap contributors | Urban Analytics Workbench';
  ctx.fillStyle = '#444';
  ctx.font = '10px sans-serif';
  ctx.fillText(attrib, MARGIN, H - 10);

  // Date
  ctx.fillStyle = '#555';
  ctx.font = '10px sans-serif';
  const date = new Date().toISOString().slice(0, 10);
  ctx.fillText(date, W - MARGIN - ctx.measureText(date).width, H - 10);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PDF canvas toBlob failed'))),
      'image/png',
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers — trigger download                                         */
/* ------------------------------------------------------------------ */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Defer cleanup to avoid revoking while browser is still saving
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useMapExport() {
  const viewState = useMapState((s) => s.viewState);
  const layers = useLayerStack((s) => s.layers);

  /** Export as high-DPI PNG. */
  const exportPng = useCallback(async (): Promise<ExportResult> => {
    const blob = await captureMapPng(2);
    const filename = `map_export_${Date.now()}.png`;
    downloadBlob(blob, filename);
    return { blob, filename };
  }, []);

  /** Export visible vector layers as SVG. */
  const exportSvg = useCallback((): ExportResult => {
    const fc = mergeVisibleGeoJSON(layers);
    const W = 1200;
    const H = 800;
    const svgPaths = geojsonToSvgPaths(fc, viewState, W, H);
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `<rect width="${W}" height="${H}" fill="#1a1a1a"/>`,
      svgPaths,
      `</svg>`,
    ].join('\n');
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const filename = `map_export_${Date.now()}.svg`;
    downloadBlob(blob, filename);
    return { blob, filename };
  }, [layers, viewState]);

  /** Export all visible vector layers as merged GeoJSON. */
  const exportGeoJSON = useCallback((): ExportResult => {
    const fc = mergeVisibleGeoJSON(layers);
    const json = JSON.stringify(fc, null, 2);
    const blob = new Blob([json], { type: 'application/geo+json' });
    const filename = `map_export_${Date.now()}.geojson`;
    downloadBlob(blob, filename);
    return { blob, filename };
  }, [layers]);

  /** Export as a composite PDF-like PNG with title, legend, scale bar, north arrow, attribution. */
  const exportPdf = useCallback(
    async (meta: PdfMeta = {}): Promise<ExportResult> => {
      const blob = await composePdf(
        {
          title: 'Map Export',
          showLegend: true,
          showScaleBar: true,
          showNorthArrow: true,
          ...meta,
        },
        viewState,
      );
      const filename = `map_export_${Date.now()}.png`;
      downloadBlob(blob, filename);
      return { blob, filename };
    },
    [viewState],
  );

  return { exportPng, exportSvg, exportGeoJSON, exportPdf };
}
