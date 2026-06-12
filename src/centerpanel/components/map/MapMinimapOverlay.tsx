/**
 * MapMinimapOverlay — compact overview inset for the Map Explorer canvas.
 *
 * Pure-props component: viewport comes in, navigation intents go out through
 * `onNavigate`. Basemap tiles load from the CartoCDN light style; when tiles
 * are unavailable (offline, blocked network) the inset still renders the
 * viewport rectangle on a neutral background, so it degrades honestly.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_Z_INDEX,
} from "./mapTokens";

export interface MapMinimapOverlayProps {
  visible: boolean;
  /** Main map center as [lng, lat] */
  center: [number, number];
  /** Main map zoom level */
  zoom: number;
  /** Fly the main map to the clicked location */
  onNavigate: (lng: number, lat: number) => void;
  size?: number;
}

const TILE_URL = "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png";
const TILE_SIZE = 256;

function lngToX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom) * TILE_SIZE;
}

function latToY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom) * TILE_SIZE;
}

function xToLng(x: number, zoom: number): number {
  return (x / (Math.pow(2, zoom) * TILE_SIZE)) * 360 - 180;
}

function yToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (Math.pow(2, zoom) * TILE_SIZE);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const shellStyle: React.CSSProperties = {
  position: "absolute",
  right: MAP_SPACING.md,
  bottom: `calc(${MAP_SPACING.md} + 2.25rem)`,
  zIndex: MAP_Z_INDEX.symbologyPanel + 4,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairline,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  overflow: "hidden",
};

export function MapMinimapOverlay({
  visible,
  center,
  zoom,
  onNavigate,
  size = 168,
}: MapMinimapOverlayProps): React.ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tileCache] = useState<Map<string, HTMLImageElement>>(() => new Map());

  const miniZoom = useMemo(() => Math.max(0, Math.min(7, Math.floor(zoom) - 4)), [zoom]);
  const [centerLng, centerLat] = center;

  const loadTile = useCallback(
    (z: number, x: number, y: number): Promise<HTMLImageElement> => {
      const key = `${z}/${x}/${y}`;
      const cached = tileCache.get(key);
      if (cached) return Promise.resolve(cached);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          tileCache.set(key, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = TILE_URL.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
      });
    },
    [tileCache],
  );

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let cancelled = false;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const z = miniZoom;
    const cx = lngToX(centerLng, z);
    const cy = latToY(centerLat, z);
    const half = size / 2;
    const maxTile = Math.pow(2, z) - 1;

    const drawViewportRect = () => {
      // Approximate main viewport footprint (assumes ~960x640 canvas)
      const metersPerPixel = (40075016.686 * Math.cos((centerLat * Math.PI) / 180)) / Math.pow(2, zoom + 8);
      const dLng = (metersPerPixel * 960) / (111320 * Math.cos((centerLat * Math.PI) / 180));
      const dLat = (metersPerPixel * 640) / 110540;
      const x1 = lngToX(centerLng - dLng / 2, z) - cx + half;
      const y1 = latToY(centerLat + dLat / 2, z) - cy + half;
      const x2 = lngToX(centerLng + dLng / 2, z) - cx + half;
      const y2 = latToY(centerLat - dLat / 2, z) - cy + half;
      const rx = Math.max(0, Math.min(size, x1));
      const ry = Math.max(0, Math.min(size, y1));
      ctx.fillStyle = "rgba(245, 166, 35, 0.16)";
      ctx.fillRect(rx, ry, Math.max(3, Math.min(size - rx, x2 - x1)), Math.max(3, Math.min(size - ry, y2 - y1)));
      ctx.strokeStyle = "rgba(245, 166, 35, 0.85)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(rx, ry, Math.max(3, Math.min(size - rx, x2 - x1)), Math.max(3, Math.min(size - ry, y2 - y1)));
      ctx.setLineDash([]);
    };

    ctx.fillStyle = "#14161a";
    ctx.fillRect(0, 0, size, size);
    drawViewportRect();

    const tileXMin = Math.floor((cx - half) / TILE_SIZE);
    const tileXMax = Math.floor((cx + half) / TILE_SIZE);
    const tileYMin = Math.floor((cy - half) / TILE_SIZE);
    const tileYMax = Math.floor((cy + half) / TILE_SIZE);
    const pending: Promise<void>[] = [];
    for (let tx = tileXMin; tx <= tileXMax; tx += 1) {
      for (let ty = tileYMin; ty <= tileYMax; ty += 1) {
        if (ty < 0 || ty > maxTile) continue;
        const wrappedTx = ((tx % (maxTile + 1)) + (maxTile + 1)) % (maxTile + 1);
        const px = tx * TILE_SIZE - cx + half;
        const py = ty * TILE_SIZE - cy + half;
        pending.push(
          loadTile(z, wrappedTx, ty)
            .then((img) => {
              if (!cancelled) ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
            })
            .catch(() => {
              /* tile unavailable — neutral background stays visible */
            }),
        );
      }
    }
    void Promise.all(pending).then(() => {
      if (!cancelled) drawViewportRect();
    });
    return () => {
      cancelled = true;
    };
  }, [centerLat, centerLng, loadTile, miniZoom, size, visible, zoom]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const half = size / 2;
      const cx = lngToX(centerLng, miniZoom);
      const cy = latToY(centerLat, miniZoom);
      onNavigate(xToLng(x - half + cx, miniZoom), yToLat(y - half + cy, miniZoom));
    },
    [centerLat, centerLng, miniZoom, onNavigate, size],
  );

  if (!visible) return null;

  return (
    <div
      style={{ ...shellStyle, width: size, height: size }}
      data-testid="map-minimap-overlay"
      role="img"
      aria-label="Overview minimap — click to recenter the main map. Basemap tiles by CARTO."
      title="Overview minimap — click to recenter the main map. Basemap tiles by CARTO."
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size, display: "block", cursor: "pointer" }}
        data-testid="map-minimap-canvas"
        onClick={handleClick}
      />
    </div>
  );
}
