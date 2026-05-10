// VoxCity 3D — Control panel for layers, opacity, slicing, and camera
import { useCallback } from "react";
import type { SlicePlane } from "./types";
import { useVoxScene } from "./hooks/useVoxScene";

/* ------------------------------------------------------------------ */
/*  Camera presets                                                    */
/* ------------------------------------------------------------------ */

const PRESETS: { label: string; name: string; position: [number, number, number]; target: [number, number, number] }[] = [
  { label: "Perspective", name: "perspective", position: [80, 60, 80], target: [0, 0, 0] },
  { label: "Top-down", name: "top-down", position: [0, 120, 0], target: [0, 0, 0] },
  { label: "Street", name: "street", position: [10, 5, 10], target: [30, 5, 30] },
];

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "12px",
  background: "#1a1a1a",
  borderRadius: "8px",
  color: "#e0e0e0",
  fontSize: "13px",
  fontFamily: "var(--font-mono, monospace)",
  maxHeight: "100%",
  overflowY: "auto",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#f5a623",
  margin: "4px 0 2px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  accentColor: "#f5a623",
};

const btnStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "4px",
  border: "1px solid #333",
  background: "#262626",
  color: "#e0e0e0",
  cursor: "pointer",
  fontSize: "12px",
};

const activeBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: "#f5a623",
  color: "#1a1a1a",
  borderColor: "#f5a623",
};

/* ------------------------------------------------------------------ */
/*  Layer row                                                         */
/* ------------------------------------------------------------------ */

function LayerRow({ materialId, label, color }: { materialId: number; label: string; color: string }) {
  const vis = useVoxScene(s => s.visibility[materialId]);
  const toggleMaterial = useVoxScene(s => s.toggleMaterial);
  const setMaterialOpacity = useVoxScene(s => s.setMaterialOpacity);

  const onOpacity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setMaterialOpacity(materialId, Number(e.target.value)),
    [materialId, setMaterialOpacity],
  );

  const visible = vis?.visible ?? true;
  const opacity = vis?.opacity ?? 1;

  return (
    <div style={{ ...rowStyle, opacity: visible ? 1 : 0.45 }}>
      <input type="checkbox" checked={visible} onChange={() => toggleMaterial(materialId)} />
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={opacity}
        onChange={onOpacity}
        style={{ ...sliderStyle, maxWidth: 80 }}
        title={`Opacity: ${Math.round(opacity * 100)}%`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slice plane row                                                   */
/* ------------------------------------------------------------------ */

function SliceRow({ plane }: { plane: SlicePlane }) {
  const setSlicePlane = useVoxScene(s => s.setSlicePlane);
  const grid = useVoxScene(s => s.grid);
  if (!grid) return null;

  const axisMap = { x: "maxX", y: "maxY", z: "maxZ" } as const;
  const maxVal = grid.bounds[axisMap[plane.axis]];

  return (
    <div style={rowStyle}>
      <input
        type="checkbox"
        checked={plane.enabled}
        onChange={() => setSlicePlane(plane.axis, plane.position, !plane.enabled)}
      />
      <span style={{ width: 16, textTransform: "uppercase", fontWeight: 600 }}>{plane.axis}</span>
      <input
        type="range"
        min={0}
        max={maxVal || 100}
        step={1}
        value={plane.position}
        onChange={e => setSlicePlane(plane.axis, Number(e.target.value), plane.enabled)}
        style={sliderStyle}
        disabled={!plane.enabled}
      />
      <span style={{ width: 36, textAlign: "right", fontSize: "11px" }}>{plane.position}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public control panel                                              */
/* ------------------------------------------------------------------ */

export interface VoxCityControlsProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function VoxCityControls({ className, style }: VoxCityControlsProps) {
  const grid = useVoxScene(s => s.grid);
  const slicePlanes = useVoxScene(s => s.slicePlanes);
  const cameraPreset = useVoxScene(s => s.cameraPreset);
  const setCameraPreset = useVoxScene(s => s.setCameraPreset);

  if (!grid) {
    return (
      <div style={{ ...containerStyle, ...style }} className={className}>
        <span style={{ color: "#888" }}>No grid loaded</span>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, ...style }} className={className}>
      {/* Layers */}
      <div style={sectionTitle}>Layers</div>
      {grid.materials.map(m => (
        <LayerRow key={m.id} materialId={m.id} label={m.name} color={m.color} />
      ))}

      {/* Slice planes */}
      <div style={sectionTitle}>Slice Planes</div>
      {slicePlanes.map(sp => (
        <SliceRow key={sp.axis} plane={sp} />
      ))}

      {/* Camera presets */}
      <div style={sectionTitle}>Camera</div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {PRESETS.map(p => (
          <button
            key={p.name}
            type="button"
            style={cameraPreset === p.name ? activeBtnStyle : btnStyle}
            onClick={() => setCameraPreset(p.name)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{ ...sectionTitle, marginTop: 4 }}>Info</div>
      <div style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.6 }}>
        <div>Voxels: {grid.count.toLocaleString()}</div>
        <div>Resolution: {grid.resolution}m</div>
        <div>Materials: {grid.materials.length}</div>
      </div>
    </div>
  );
}
