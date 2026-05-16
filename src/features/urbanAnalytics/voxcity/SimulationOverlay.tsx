// VoxCity 3D — Simulation overlay: color ramp picker, value range, legend
import { useCallback, useMemo } from "react";
import type { ColorRampName, SimulationType } from "./types";
import { useVoxScene } from "./hooks/useVoxScene";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const COLOR_RAMPS: readonly ColorRampName[] = [
  "viridis", "plasma", "inferno", "magma",
  "RdYlBu", "RdYlGn", "Spectral", "coolwarm",
] as const;

const SIM_LABELS: Record<SimulationType, string> = {
  solar_radiation: "Solar Radiation",
  wind_speed: "Wind Speed",
  wind_comfort: "Wind Comfort",
  noise_level: "Noise Level",
  thermal_comfort_utci: "Thermal Comfort (UTCI)",
  sky_view_factor: "Sky View Factor",
  daylight_factor: "Daylight Factor",
  shadow_hours: "Shadow Hours",
};

/* ------------------------------------------------------------------ */
/*  Color ramp preview (CSS gradient)                                 */
/* ------------------------------------------------------------------ */

/** Build a 5-stop CSS linear-gradient for a ramp name. */
function rampGradient(ramp: ColorRampName): string {
  // Re-use the same simplified ramp from VoxCityViewer
  const steps = 5;
  const stops: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const [r, g, b] = sampleRampCSS(t, ramp);
    stops.push(`rgb(${r},${g},${b}) ${Math.round(t * 100)}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** Simplified ramp sampler returning 0-255 RGB */
function sampleRampCSS(t: number, ramp: ColorRampName): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  let r: number, g: number, b: number;
  switch (ramp) {
    case "plasma":
      r = 0.05 + c * 0.95; g = 0.03 + c * 0.3; b = 0.53 - c * 0.3; break;
    case "inferno":
      r = c * 0.98; g = c * 0.5; b = 0.02 + (1 - c) * 0.2; break;
    case "magma":
      r = c * 0.95; g = 0.05 + c * 0.4; b = 0.3 + (1 - c) * 0.4; break;
    case "RdYlBu":
      if (c < 0.5) { const s = c * 2; r = 0.84 + s * 0.16; g = s; b = s * 0.2; }
      else { const s = (c - 0.5) * 2; r = 1 - s * 0.7; g = 1 - s * 0.2; b = 0.2 + s * 0.8; }
      break;
    case "RdYlGn":
      if (c < 0.5) { const s = c * 2; r = 0.84; g = s; b = s * 0.1; }
      else { const s = (c - 0.5) * 2; r = 1 - s * 0.7; g = 0.75 + s * 0.15; b = 0.1 + s * 0.3; }
      break;
    case "Spectral":
      if (c < 0.33) { r = 0.84 + c * 0.3; g = c * 3; b = 0.15; }
      else if (c < 0.66) { r = 1 - (c - 0.33) * 2; g = 0.9; b = 0.15 + (c - 0.33) * 2; }
      else { r = 0.34 - (c - 0.66) * 0.8; g = 0.9 - (c - 0.66); b = 0.8; }
      break;
    case "coolwarm":
      if (c < 0.5) { const s = c * 2; r = 0.23 + s * 0.7; g = 0.3 + s * 0.6; b = 0.75; }
      else { const s = (c - 0.5) * 2; r = 0.93; g = 0.9 - s * 0.6; b = 0.75 - s * 0.55; }
      break;
    default: // viridis
      r = 0.267 + c * 0.43; g = 0.004 + c * 0.87; b = 0.329 + c * 0.27;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "12px",
  background: "#1a1a1a",
  borderRadius: "8px",
  color: "#e0e0e0",
  fontSize: "13px",
  fontFamily: "var(--font-mono, monospace)",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#a4adbb",
};

const rampBtnStyle: React.CSSProperties = {
  height: 18,
  borderRadius: 3,
  border: "2px solid transparent",
  cursor: "pointer",
  flex: 1,
};

const sliderRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

/* ------------------------------------------------------------------ */
/*  Legend bar                                                         */
/* ------------------------------------------------------------------ */

function LegendBar({ ramp, min, max, unit }: { ramp: ColorRampName; min: number; max: number; unit: string }) {
  const bg = useMemo(() => rampGradient(ramp), [ramp]);
  return (
    <div>
      <div style={{ height: 14, borderRadius: 3, background: bg }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#aaa", marginTop: 2 }}>
        <span>{min.toFixed(1)} {unit}</span>
        <span>{max.toFixed(1)} {unit}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public overlay                                                    */
/* ------------------------------------------------------------------ */

export interface SimulationOverlayProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function SimulationOverlay({ className, style }: SimulationOverlayProps) {
  const simulation = useVoxScene(s => s.simulation);
  const colorRamp = useVoxScene(s => s.colorRamp);
  const valueRange = useVoxScene(s => s.valueRange);
  const setColorRamp = useVoxScene(s => s.setColorRamp);
  const setValueRange = useVoxScene(s => s.setValueRange);

  const onMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValueRange([Number(e.target.value), valueRange[1]]),
    [setValueRange, valueRange],
  );

  const onMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValueRange([valueRange[0], Number(e.target.value)]),
    [setValueRange, valueRange],
  );

  if (!simulation) {
    return (
      <div style={{ ...containerStyle, ...style }} className={className}>
        <span style={{ color: "#888", fontSize: "12px" }}>No simulation loaded</span>
      </div>
    );
  }

  const label = SIM_LABELS[simulation.type] ?? simulation.type;

  return (
    <div style={{ ...containerStyle, ...style }} className={className}>
      {/* Header */}
      <div>
        <div style={sectionTitle}>{label}</div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>
          Mean: {simulation.mean.toFixed(2)} {simulation.unit}
        </div>
      </div>

      {/* Color ramp picker */}
      <div style={sectionTitle}>Color Ramp</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {COLOR_RAMPS.map(name => (
          <button
            type="button"
            key={name}
            title={name}
            onClick={() => setColorRamp(name)}
            style={{
              ...rampBtnStyle,
              background: rampGradient(name),
              borderColor: colorRamp === name ? "#3794ff" : "transparent",
            }}
          />
        ))}
      </div>

      {/* Value range */}
      <div style={sectionTitle}>Value Range</div>
      <div style={sliderRow}>
        <span style={{ width: 28, fontSize: "11px" }}>Min</span>
        <input
          type="range"
          min={simulation.min}
          max={simulation.max}
          step={(simulation.max - simulation.min) / 100 || 0.01}
          value={valueRange[0]}
          onChange={onMinChange}
          style={{ flex: 1, accentColor: "#3794ff" }}
        />
        <span style={{ width: 44, fontSize: "11px", textAlign: "right" }}>{valueRange[0].toFixed(1)}</span>
      </div>
      <div style={sliderRow}>
        <span style={{ width: 28, fontSize: "11px" }}>Max</span>
        <input
          type="range"
          min={simulation.min}
          max={simulation.max}
          step={(simulation.max - simulation.min) / 100 || 0.01}
          value={valueRange[1]}
          onChange={onMaxChange}
          style={{ flex: 1, accentColor: "#3794ff" }}
        />
        <span style={{ width: 44, fontSize: "11px", textAlign: "right" }}>{valueRange[1].toFixed(1)}</span>
      </div>

      {/* Legend */}
      <div style={sectionTitle}>Legend</div>
      <LegendBar ramp={colorRamp} min={valueRange[0]} max={valueRange[1]} unit={simulation.unit} />
    </div>
  );
}
