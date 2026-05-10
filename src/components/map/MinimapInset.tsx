import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Bounds, useMapState, type ViewState } from './hooks/useMapState';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface MinimapInsetProps {
  /** Bounding box of the full study area */
  studyAreaBounds?: Bounds;
  /** Minimap size in pixels (square) */
  size?: number;
  /** Corner placement */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Background basemap tile URL template (defaults to CartoDB light) */
  tileUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function lngToX(lng: number, zoom: number, tileSize = 256): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom) * tileSize;
}

function latToY(lat: number, zoom: number, tileSize = 256): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom) *
    tileSize
  );
}

function xToLng(x: number, zoom: number, tileSize = 256): number {
  return (x / (Math.pow(2, zoom) * tileSize)) * 360 - 180;
}

function yToLat(y: number, zoom: number, tileSize = 256): number {
  const n = Math.PI - (2 * Math.PI * y) / (Math.pow(2, zoom) * tileSize);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const DEFAULT_TILE =
  'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png';

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function positionStyle(pos: string): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute', zIndex: 6 };
  switch (pos) {
    case 'bottom-left':
      return { ...base, bottom: 12, left: 12 };
    case 'top-left':
      return { ...base, top: 12, left: 12 };
    case 'top-right':
      return { ...base, top: 12, right: 12 };
    case 'bottom-right':
    default:
      return { ...base, bottom: 12, right: 12 };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const MinimapInset: React.FC<MinimapInsetProps> = ({
  studyAreaBounds,
  size = 150,
  position = 'bottom-right',
  tileUrl = DEFAULT_TILE,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewState = useMapState((s) => s.viewState);
  const flyTo = useMapState((s) => s.flyTo);
  const [tileCache] = useState<Map<string, HTMLImageElement>>(() => new Map());

  /* ---- Minimap zoom is 4 levels below main, clamped ---- */
  const miniZoom = useMemo(
    () => Math.max(0, Math.min(6, Math.floor(viewState.zoom) - 4)),
    [viewState.zoom],
  );

  /* ---- Calculate the bounds of the minimap ---- */
  const miniCenter = useMemo(() => {
    if (studyAreaBounds) {
      return {
        lng: (studyAreaBounds.west + studyAreaBounds.east) / 2,
        lat: (studyAreaBounds.south + studyAreaBounds.north) / 2,
      };
    }
    return { lng: viewState.longitude, lat: viewState.latitude };
  }, [studyAreaBounds, viewState.longitude, viewState.latitude]);

  /* ---- Load tile image ---- */
  const loadTile = useCallback(
    (z: number, x: number, y: number): Promise<HTMLImageElement> => {
      const key = `${z}/${x}/${y}`;
      const cached = tileCache.get(key);
      if (cached) return Promise.resolve(cached);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          tileCache.set(key, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = tileUrl
          .replace('{z}', String(z))
          .replace('{x}', String(x))
          .replace('{y}', String(y));
      });
    },
    [tileUrl, tileCache],
  );

  /* ---- Draw minimap ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const z = miniZoom;
    const tileSize = 256;

    // World-pixel coordinates of minimap center
    const cx = lngToX(miniCenter.lng, z, tileSize);
    const cy = latToY(miniCenter.lat, z, tileSize);

    // Tile range visible in minimap
    const halfW = size / 2;
    const halfH = size / 2;
    const tileXMin = Math.floor((cx - halfW) / tileSize);
    const tileXMax = Math.floor((cx + halfW) / tileSize);
    const tileYMin = Math.floor((cy - halfH) / tileSize);
    const tileYMax = Math.floor((cy + halfH) / tileSize);

    const maxTile = Math.pow(2, z) - 1;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size, size);

    const promises: Promise<void>[] = [];
    for (let tx = tileXMin; tx <= tileXMax; tx++) {
      for (let ty = tileYMin; ty <= tileYMax; ty++) {
        if (ty < 0 || ty > maxTile) continue;
        const wrappedTx = ((tx % (maxTile + 1)) + (maxTile + 1)) % (maxTile + 1);
        const px = tx * tileSize - cx + halfW;
        const py = ty * tileSize - cy + halfH;
        promises.push(
          loadTile(z, wrappedTx, ty)
            .then((img) => ctx.drawImage(img, px, py, tileSize, tileSize))
            .catch(() => {
              /* tile failed, leave blank */
            }),
        );
      }
    }

    Promise.all(promises).then(() => {
      // Draw study area extent
      if (studyAreaBounds) {
        const x1 = lngToX(studyAreaBounds.west, z, tileSize) - cx + halfW;
        const y1 = latToY(studyAreaBounds.north, z, tileSize) - cy + halfH;
        const x2 = lngToX(studyAreaBounds.east, z, tileSize) - cx + halfW;
        const y2 = latToY(studyAreaBounds.south, z, tileSize) - cy + halfH;
        ctx.strokeStyle = '#f5a623';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.fillStyle = 'rgba(245,166,35,0.06)';
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      }

      // Draw current viewport rectangle
      drawViewportRect(ctx, viewState, z, tileSize, cx, cy, halfW, halfH, size);
    });
  }, [viewState, miniZoom, miniCenter, size, studyAreaBounds, loadTile]);

  /* ---- Click to navigate ---- */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const z = miniZoom;
      const tileSize = 256;
      const cx = lngToX(miniCenter.lng, z, tileSize);
      const cy = latToY(miniCenter.lat, z, tileSize);
      const halfW = size / 2;
      const halfH = size / 2;

      const worldX = x - halfW + cx;
      const worldY = y - halfH + cy;

      const lng = xToLng(worldX, z, tileSize);
      const lat = yToLat(worldY, z, tileSize);

      flyTo({ longitude: lng, latitude: lat, duration: 800 });
    },
    [miniZoom, miniCenter, size, flyTo],
  );

  return (
    <div
      className={className}
      style={{
        ...positionStyle(position),
        width: size,
        height: size,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size, display: 'block' }}
        onClick={handleClick}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Viewport rectangle drawing helper                                  */
/* ------------------------------------------------------------------ */

function drawViewportRect(
  ctx: CanvasRenderingContext2D,
  viewState: ViewState,
  z: number,
  tileSize: number,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  canvasSize: number,
) {
  // Approximate viewport bounds from main map's viewState
  // Visible span in degrees at current zoom
  const mpp = (40075016.686 * Math.cos((viewState.latitude * Math.PI) / 180)) / Math.pow(2, viewState.zoom + 8);
  // Approx 800px wide viewport
  const viewportWidthM = mpp * 800;
  const viewportHeightM = mpp * 600;
  const dLng = viewportWidthM / (111320 * Math.cos((viewState.latitude * Math.PI) / 180));
  const dLat = viewportHeightM / 110540;

  const west = viewState.longitude - dLng / 2;
  const east = viewState.longitude + dLng / 2;
  const north = viewState.latitude + dLat / 2;
  const south = viewState.latitude - dLat / 2;

  const x1 = lngToX(west, z, tileSize) - cx + halfW;
  const y1 = latToY(north, z, tileSize) - cy + halfH;
  const x2 = lngToX(east, z, tileSize) - cx + halfW;
  const y2 = latToY(south, z, tileSize) - cy + halfH;

  // Clamp to canvas
  const rx = Math.max(0, Math.min(canvasSize, x1));
  const ry = Math.max(0, Math.min(canvasSize, y1));
  const rw = Math.max(2, Math.min(canvasSize - rx, x2 - x1));
  const rh = Math.max(2, Math.min(canvasSize - ry, y2 - y1));

  ctx.fillStyle = 'rgba(245,166,35,0.18)';
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = 'rgba(245,166,35,0.8)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.setLineDash([]);
}

export default MinimapInset;
