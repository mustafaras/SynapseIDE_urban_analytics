import React, { useCallback, useRef, useState } from 'react';
import { useMapState } from './hooks/useMapState';
import { BASEMAP_STYLES } from './MapContainer';

/* ------------------------------------------------------------------ */
/* Styles */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
 wrapper: {
 position: 'absolute',
 top: 10,
 right: 10,
 display: 'flex',
 flexDirection: 'column',
 gap: 4,
 zIndex: 5,
 pointerEvents: 'auto',
 },
 btn: {
 width: 32,
 height: 32,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 background: 'rgba(30,30,30,0.88)',
 color: '#ddd',
 border: '1px solid rgba(255,255,255,0.08)',
 borderRadius: 4,
 cursor: 'pointer',
 fontSize: 16,
 fontFamily: 'monospace',
 lineHeight: 1,
 },
 dropdown: {
 position: 'absolute',
 right: 38,
 top: 0,
 background: 'rgba(30,30,30,0.95)',
 border: '1px solid rgba(255,255,255,0.1)',
 borderRadius: 6,
 padding: 4,
 minWidth: 180,
 zIndex: 10,
 },
 dropItem: {
 display: 'block',
 width: '100%',
 textAlign: 'left' as const,
 padding: '6px 10px',
 fontSize: 12,
 color: '#ccc',
 background: 'transparent',
 border: 'none',
 borderRadius: 3,
 cursor: 'pointer',
 },
 compass: {
 width: 32,
 height: 32,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 background: 'rgba(30,30,30,0.88)',
 color: '#f5a623',
 border: '1px solid rgba(255,255,255,0.08)',
 borderRadius: 4,
 cursor: 'pointer',
 fontSize: 14,
 fontWeight: 700,
 transition: 'transform 0.3s',
 },
};

/* ------------------------------------------------------------------ */
/* Props */
/* ------------------------------------------------------------------ */

export interface MapControlsProps {
 /** Current basemap key */
 basemap?: string;
 onBasemapChange?: (key: string) => void;
 /** Callback invoked when screenshot requested */
 onScreenshot?: () => void;
 /** Callback for layer panel toggle */
 onToggleLayerPanel?: () => void;
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export const MapControls: React.FC<MapControlsProps> = ({
 basemap,
 onBasemapChange,
 onScreenshot,
 onToggleLayerPanel,
}) => {
 const viewState = useMapState((s) => s.viewState);
 const setViewState = useMapState((s) => s.setViewState);
 const resetNorth = useMapState((s) => s.resetNorth);

 const [basemapOpen, setBasemapOpen] = useState(false);
 const [isFullscreen, setIsFullscreen] = useState(false);
 const wrapperRef = useRef<HTMLDivElement>(null);

 /* ---- zoom ---- */
 const zoomIn = useCallback(
 () => setViewState({ zoom: Math.min(22, viewState.zoom + 1), transitionDuration: 300 }),
 [setViewState, viewState.zoom],
 );
 const zoomOut = useCallback(
 () => setViewState({ zoom: Math.max(0, viewState.zoom - 1), transitionDuration: 300 }),
 [setViewState, viewState.zoom],
 );

 /* ---- 3D toggle ---- */
 const toggle3D = useCallback(() => {
 setViewState({
 pitch: viewState.pitch > 0 ? 0 : 45,
 transitionDuration: 500,
 });
 }, [setViewState, viewState.pitch]);

 /* ---- fullscreen ---- */
 const toggleFullscreen = useCallback(() => {
 const el = wrapperRef.current?.closest('[data-map-root]') as HTMLElement | null;
 if (!el) return;
 if (!document.fullscreenElement) {
 el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
 } else {
 document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
 }
 }, []);

 /* ---- basemap ---- */
 const basemapKeys = Object.keys(BASEMAP_STYLES);

 return (
 <div ref={wrapperRef} style={S.wrapper}>
 {/* Zoom */}
 <button style={S.btn} onClick={zoomIn} title="Zoom in">+</button>
 <button style={S.btn} onClick={zoomOut} title="Zoom out">−</button>

 {/* Compass */}
 <button
 style={{ ...S.compass, transform: `rotate(${-viewState.bearing}deg)` }}
 onClick={resetNorth}
 title="Reset north"
 >
 N
 </button>

 {/* 3D / 2D */}
 <button style={S.btn} onClick={toggle3D} title={viewState.pitch > 0 ? '2D' : '3D'}>
 {viewState.pitch > 0 ? '2D' : '3D'}
 </button>

 {/* Basemap selector */}
 <div style={{ position: 'relative' }}>
 <button
 style={S.btn}
 onClick={() => setBasemapOpen((p) => !p)}
 title="Basemap"
 />
 {!!basemapOpen && (
 <div style={S.dropdown}>
 {basemapKeys.map((k) => (
 <button
 key={k}
 style={{
 ...S.dropItem,
 ...(k === basemap ? { color: '#f5a623', fontWeight: 600 } : {}),
 }}
 onClick={() => {
 onBasemapChange?.(k);
 setBasemapOpen(false);
 }}
 >
 {k}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Layers */}
 <button style={S.btn} onClick={onToggleLayerPanel} title="Layers">
 ☰
 </button>

 {/* Fullscreen */}
 <button style={S.btn} onClick={toggleFullscreen} title="Fullscreen">
 {isFullscreen ? '⊡' : '⊞'}
 </button>

 {/* Screenshot */}
 <button style={S.btn} onClick={onScreenshot} title="Screenshot" />
 </div>
 );
};

export default MapControls;
