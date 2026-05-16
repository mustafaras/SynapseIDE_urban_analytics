// VoxCity 3D — Side-by-side scenario comparison viewer
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ColorRampName, SimulationResult, VoxelGrid } from "./types";

/* ------------------------------------------------------------------ */
/*  Shared camera sync                                                */
/* ------------------------------------------------------------------ */

/**
 * Reads camera from left viewer and writes it to right viewer each frame.
 * The ref carries the "source" camera matrix.
 */
function CameraSync({ sourceRef }: { sourceRef: React.RefObject<THREE.Camera | null> }) {
  const { camera } = useThree();

  useEffect(() => {
    let raf = 0;
    function sync() {
      const src = sourceRef.current;
      if (src) {
        camera.position.copy(src.position);
        camera.quaternion.copy(src.quaternion);
        camera.updateMatrixWorld();
      }
      raf = requestAnimationFrame(sync);
    }
    raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [camera, sourceRef]);

  return null;
}

/** Exposes the camera ref from the Canvas. */
function CameraExpose({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  useEffect(() => { cameraRef.current = camera; }, [camera, cameraRef]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Minimal instanced voxel renderer (inline, self-contained)         */
/* ------------------------------------------------------------------ */

const _obj = new THREE.Object3D();
const _col = new THREE.Color();

/** Lightweight inline instanced voxels for scenario panels. */
function InlineVoxels({
  grid,
  simulation,
  colorRamp,
}: {
  grid: VoxelGrid;
  simulation: SimulationResult | null;
  colorRamp: ColorRampName;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { count, matrices, colors } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const cols: [number, number, number][] = [];
    const vMin = simulation?.min ?? 0;
    const vMax = simulation?.max ?? 1;
    const range = vMax - vMin || 1;

    for (let i = 0; i < grid.voxels.length; i++) {
      const v = grid.voxels[i];
      _obj.position.set(v.x, v.z, v.y);
      _obj.scale.setScalar(grid.resolution);
      _obj.updateMatrix();
      mats.push(_obj.matrix.clone());

      if (simulation) {
        const t = Math.max(0, Math.min(1, (simulation.values[i] - vMin) / range));
        cols.push(quickRamp(t, colorRamp));
      } else {
        const mat = grid.materials.find(m => m.id === v.materialId);
        if (mat) { _col.set(mat.color); cols.push([_col.r, _col.g, _col.b]); }
        else cols.push([0.5, 0.5, 0.5]);
      }
    }
    return { count: mats.length, matrices: mats, colors: cols };
  }, [grid, simulation, colorRamp]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      _col.setRGB(colors[i][0], colors[i][1], colors[i][2]);
      mesh.setColorAt(i, _col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = count;
  }, [count, matrices, colors]);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, Math.max(count, 1)]} frustumCulled={false}>
      <meshStandardMaterial vertexColors toneMapped={false} transparent opacity={0.95} />
    </instancedMesh>
  );
}

/** Minimal ramp sampler (0-1 floats). */
function quickRamp(t: number, ramp: ColorRampName): [number, number, number] {
  switch (ramp) {
    case "plasma":  return [0.05 + t * 0.95, 0.03 + t * 0.3, 0.53 - t * 0.3];
    case "inferno": return [t * 0.98, t * 0.5, 0.02 + (1 - t) * 0.2];
    case "magma":   return [t * 0.95, 0.05 + t * 0.4, 0.3 + (1 - t) * 0.4];
    default:        return [0.267 + t * 0.43, 0.004 + t * 0.87, 0.329 + t * 0.27];
  }
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const panelStyle: React.CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
  borderRadius: 6,
  background: "#0d0d0d",
  minWidth: "460px",
  minHeight: "720px",
};

const labelStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 10,
  zIndex: 2,
  padding: "2px 10px",
  borderRadius: 4,
  background: "rgba(26,26,26,0.85)",
  color: "#3794ff",
  fontWeight: 600,
  fontSize: "12px",
  fontFamily: "var(--font-mono, monospace)",
  letterSpacing: "0.04em",
};

/* ------------------------------------------------------------------ */
/*  Scenario panel (half)                                             */
/* ------------------------------------------------------------------ */

interface ScenarioPanelProps {
  label: string;
  grid: VoxelGrid;
  simulation: SimulationResult | null;
  colorRamp: ColorRampName;
  /** If provided, sync camera from this ref instead of providing OrbitControls. */
  syncRef?: React.RefObject<THREE.Camera | null>;
  /** If provided, expose our camera to this ref. */
  exposeRef?: React.MutableRefObject<THREE.Camera | null>;
}

function ScenarioPanel({ label, grid, simulation, colorRamp, syncRef, exposeRef }: ScenarioPanelProps) {
  return (
    <div style={panelStyle}>
      <span style={labelStyle}>{label}</span>
      <Canvas
        camera={{ position: [80, 60, 80], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 80, 30]} intensity={0.8} />
        <InlineVoxels grid={grid} simulation={simulation} colorRamp={colorRamp} />
        {syncRef ? (
          <CameraSync sourceRef={syncRef} />
        ) : (
          <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={5} maxDistance={2000} />
        )}
        {exposeRef ? <CameraExpose cameraRef={exposeRef} /> : null}
      </Canvas>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public component                                                  */
/* ------------------------------------------------------------------ */

export interface ScenarioCompareProps {
  /** Grid for scenario A. */
  gridA: VoxelGrid;
  /** Grid for scenario B. */
  gridB: VoxelGrid;
  /** Simulation overlay A. */
  simulationA?: SimulationResult | null;
  /** Simulation overlay B. */
  simulationB?: SimulationResult | null;
  /** Shared color ramp name (default "viridis"). */
  colorRamp?: ColorRampName;
  /** Label for scenario A (default "Scenario A"). */
  labelA?: string;
  /** Label for scenario B (default "Scenario B"). */
  labelB?: string;
  /** Container CSS class. */
  className?: string;
  /** Container CSS style. */
  style?: React.CSSProperties;
}

export default function ScenarioCompare({
  gridA,
  gridB,
  simulationA,
  simulationB,
  colorRamp = "viridis",
  labelA = "Scenario A",
  labelB = "Scenario B",
  className,
  style,
}: ScenarioCompareProps) {
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [ready, setReady] = useState(false);

  // Mark ready once camera ref is set by left panel
  const exposeRef = useCallback((cam: THREE.Camera | null) => {
    cameraRef.current = cam;
    if (cam) setReady(true);
  }, []);

  // Mutable ref wrapper for the expose callback
  const mutableRef = useRef<THREE.Camera | null>(null);
  useEffect(() => {
    exposeRef(mutableRef.current);
  }, [exposeRef]);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 8,
        width: "100%",
        height: "100%",
        minHeight: "740px",
        ...style,
      }}
    >
      <ScenarioPanel
        label={labelA}
        grid={gridA}
        simulation={simulationA ?? null}
        colorRamp={colorRamp}
        exposeRef={mutableRef}
      />
      <ScenarioPanel
        label={labelB}
        grid={gridB}
        simulation={simulationB ?? null}
        colorRamp={colorRamp}
        {...(ready ? { syncRef: cameraRef } : {})}
      />
    </div>
  );
}
