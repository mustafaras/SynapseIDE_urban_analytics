import React, { useCallback } from 'react';
import { type LayerConfig, type LayerType, useLayerStack } from './hooks/useLayerStack';

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

const LAYER_TYPE_ICONS: Record<LayerType, string> = {
 geojson: '⬡',
 choropleth: '◼',
 heatmap: 'H',
 point: '●',
 arc: '⌒',
 hex: '⬡',
 raster: '▦',
 path: '╱',
};

/* ------------------------------------------------------------------ */
/* Styles */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
 panel: {
 position: 'absolute',
 top: 10,
 left: 10,
 width: 260,
 maxHeight: 'calc(100% - 20px)',
 overflowY: 'auto',
 background: 'rgba(26,26,26,0.94)',
 border: '1px solid rgba(255,255,255,0.08)',
 borderRadius: 8,
 zIndex: 6,
 padding: 0,
 },
 header: {
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: '10px 12px 8px',
 borderBottom: '1px solid rgba(255,255,255,0.06)',
 color: '#f5a623',
 fontSize: 13,
 fontWeight: 600,
 },
 row: {
 display: 'flex',
 alignItems: 'center',
 gap: 6,
 padding: '6px 12px',
 borderBottom: '1px solid rgba(255,255,255,0.04)',
 fontSize: 12,
 color: '#ccc',
 },
 vis: {
 width: 20,
 height: 20,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 fontSize: 14,
 flexShrink: 0,
 },
 icon: {
 width: 18,
 textAlign: 'center' as const,
 fontSize: 13,
 flexShrink: 0,
 },
 label: {
 flex: 1,
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap' as const,
 },
 slider: {
 width: 50,
 height: 3,
 accentColor: '#f5a623',
 cursor: 'pointer',
 flexShrink: 0,
 },
 orderBtn: {
 background: 'none',
 border: 'none',
 color: '#888',
 cursor: 'pointer',
 fontSize: 10,
 padding: '0 2px',
 lineHeight: 1,
 },
 removeBtn: {
 background: 'none',
 border: 'none',
 color: '#666',
 cursor: 'pointer',
 fontSize: 13,
 padding: '0 2px',
 lineHeight: 1,
 },
 empty: {
 color: '#666',
 fontSize: 12,
 padding: '16px 12px',
 textAlign: 'center' as const,
 },
};

/* ------------------------------------------------------------------ */
/* Props */
/* ------------------------------------------------------------------ */

export interface LayerManagerProps {
 open: boolean;
 onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/* LayerRow */
/* ------------------------------------------------------------------ */

const LayerRow: React.FC<{
 layer: LayerConfig;
 onToggle: () => void;
 onOpacity: (v: number) => void;
 onMoveUp: () => void;
 onMoveDown: () => void;
 onRemove: () => void;
}> = ({ layer, onToggle, onOpacity, onMoveUp, onMoveDown, onRemove }) => (
 <div style={S.row}>
 <div style={S.vis} onClick={onToggle} title="Toggle visibility">
 {layer.visible ? '' : '◌'}
 </div>
 <span style={S.icon}>{LAYER_TYPE_ICONS[layer.type] ?? '◻'}</span>
 <span style={S.label} title={layer.label}>{layer.label}</span>
 <input
 type="range"
 min={0}
 max={1}
 step={0.05}
 value={layer.opacity}
 onChange={(e) => onOpacity(parseFloat(e.target.value))}
 style={S.slider}
 title={`Opacity ${Math.round(layer.opacity * 100)}%`}
 />
 <button style={S.orderBtn} onClick={onMoveUp} title="Move up">▲</button>
 <button style={S.orderBtn} onClick={onMoveDown} title="Move down">▼</button>
 <button style={S.removeBtn} onClick={onRemove} title="Remove">✕</button>
 </div>
);

/* ------------------------------------------------------------------ */
/* LayerManager */
/* ------------------------------------------------------------------ */

export const LayerManager: React.FC<LayerManagerProps> = ({ open, onClose }) => {
 const layers = useLayerStack((s) => s.layers);
 const layerOrder = useLayerStack((s) => s.layerOrder);
 const toggleVisibility = useLayerStack((s) => s.toggleVisibility);
 const setOpacity = useLayerStack((s) => s.setOpacity);
 const moveLayer = useLayerStack((s) => s.moveLayer);
 const removeLayer = useLayerStack((s) => s.removeLayer);

 const orderedLayers = layerOrder
 .map((id) => layers.find((l) => l.id === id))
 .filter(Boolean) as LayerConfig[];

 // Render top-to-bottom (reverse of draw order)
 const displayed = [...orderedLayers].reverse();

 const handleOpacity = useCallback(
 (id: string, v: number) => setOpacity(id, v),
 [setOpacity],
 );

 if (!open) return null;

 return (
 <div style={S.panel}>
 <div style={S.header}>
 <span>Layers</span>
 <button
 onClick={onClose}
 style={{
 background: 'none',
 border: 'none',
 color: '#888',
 cursor: 'pointer',
 fontSize: 16,
 }}
 >
 ✕
 </button>
 </div>
 {displayed.length === 0 ? (
 <div style={S.empty}>No layers added yet</div>
 ) : (
 displayed.map((layer) => (
 <LayerRow
 key={layer.id}
 layer={layer}
 onToggle={() => toggleVisibility(layer.id)}
 onOpacity={(v) => handleOpacity(layer.id, v)}
 onMoveUp={() => moveLayer(layer.id, 'up')}
 onMoveDown={() => moveLayer(layer.id, 'down')}
 onRemove={() => removeLayer(layer.id)}
 />
 ))
 )}
 </div>
 );
};

export default LayerManager;
