// VoxCity 3D — Main viewer component using @react-three/fiber
import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ColorRampName, MaterialVisibility, SimulationResult, SlicePlane, VoxelGrid } from "./types";
import { useVoxScene } from "./hooks/useVoxScene";

/* ------------------------------------------------------------------ */
/*  Color ramp helpers                                                */
/* ------------------------------------------------------------------ */

/** Simple linear color ramp sampler (0 → 1). Returns [r, g, b] ∈ [0, 1]. */
function sampleRamp(t: number, ramp: ColorRampName): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  switch (ramp) {
    case "plasma":
      return [0.05 + c * 0.95, 0.03 + c * 0.3, 0.53 - c * 0.3];
    case "inferno":
      return [c * 0.98, c * 0.5, 0.02 + (1 - c) * 0.2];
    case "magma":
      return [c * 0.95, 0.05 + c * 0.4, 0.3 + (1 - c) * 0.4];
    case "RdYlBu": {
      if (c < 0.5) { const s = c * 2; return [0.84 + s * 0.16, s, s * 0.2]; }
      const s = (c - 0.5) * 2; return [1 - s * 0.7, 1 - s * 0.2, 0.2 + s * 0.8];
    }
    case "RdYlGn": {
      if (c < 0.5) { const s = c * 2; return [0.84, s, s * 0.1]; }
      const s = (c - 0.5) * 2; return [1 - s * 0.7, 0.75 + s * 0.15, 0.1 + s * 0.3];
    }
    case "Spectral": {
      if (c < 0.33) return [0.84 + c * 0.3, c * 3, 0.15];
      if (c < 0.66) return [1 - (c - 0.33) * 2, 0.9, 0.15 + (c - 0.33) * 2];
      return [0.34 - (c - 0.66) * 0.8, 0.9 - (c - 0.66), 0.8];
    }
    case "coolwarm": {
      if (c < 0.5) { const s = c * 2; return [0.23 + s * 0.7, 0.3 + s * 0.6, 0.75]; }
      const s = (c - 0.5) * 2; return [0.93, 0.9 - s * 0.6, 0.75 - s * 0.55];
    }
    default: // viridis
      return [0.267 + c * 0.43, 0.004 + c * 0.87, 0.329 + c * 0.27];
  }
}

/* ------------------------------------------------------------------ */
/*  Instanced voxel mesh                                              */
/* ------------------------------------------------------------------ */

interface VoxelMeshProps {
  grid: VoxelGrid;
  visibility: Record<number, MaterialVisibility>;
  slicePlanes: readonly SlicePlane[];
  simulation: SimulationResult | null;
  colorRamp: ColorRampName;
  valueRange: readonly [number, number];
}

const _tempObj = new THREE.Object3D();
const _color = new THREE.Color();

function VoxelMesh({
  grid,
  visibility,
  slicePlanes,
  simulation,
  colorRamp,
  valueRange,
}: VoxelMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Build filtered voxel index list + transforms + colors
  const { count, matrices, colors } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const cols: [number, number, number][] = [];
    const [vMin, vMax] = valueRange;
    const range = vMax - vMin || 1;

    for (let i = 0; i < grid.voxels.length; i++) {
      const v = grid.voxels[i];

      // Material visibility check
      const vis = visibility[v.materialId];
      if (vis && !vis.visible) continue;

      // Slice plane filtering
      let clipped = false;
      for (const sp of slicePlanes) {
        if (!sp.enabled) continue;
        if (sp.axis === "x" && v.x > sp.position) { clipped = true; break; }
        if (sp.axis === "y" && v.y > sp.position) { clipped = true; break; }
        if (sp.axis === "z" && v.z > sp.position) { clipped = true; break; }
      }
      if (clipped) continue;

      // Transform
      _tempObj.position.set(v.x, v.z, v.y); // swap Y/Z for three.js (Y-up)
      _tempObj.scale.setScalar(grid.resolution);
      _tempObj.updateMatrix();
      mats.push(_tempObj.matrix.clone());

      // Color
      if (simulation) {
        const sv = simulation.values[i];
        if (sv < vMin || sv > vMax) continue; // filter by value range
        const t = (sv - vMin) / range;
        cols.push(sampleRamp(t, colorRamp));
      } else {
        const mat = grid.materials.find(m => m.id === v.materialId);
        if (mat) {
          _color.set(mat.color);
          cols.push([_color.r, _color.g, _color.b]);
        } else {
          cols.push([0.5, 0.5, 0.5]);
        }
      }
    }

    return { count: mats.length, matrices: mats, colors: cols };
  }, [grid, visibility, slicePlanes, simulation, colorRamp, valueRange]);

  // Apply instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      _color.setRGB(colors[i][0], colors[i][1], colors[i][2]);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = count;
  }, [count, matrices, colors]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, Math.max(count, 1)]} frustumCulled={false}>
      <meshStandardMaterial vertexColors toneMapped={false} transparent opacity={0.95} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Ground plane                                                      */
/* ------------------------------------------------------------------ */

function GroundPlane({ size }: { size: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#1a1a1a" transparent opacity={0.3} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene contents (pulled from store)                                */
/* ------------------------------------------------------------------ */

function SceneContents() {
  const grid = useVoxScene(s => s.grid);
  const simulation = useVoxScene(s => s.simulation);
  const slicePlanes = useVoxScene(s => s.slicePlanes);
  const visibility = useVoxScene(s => s.visibility);
  const colorRamp = useVoxScene(s => s.colorRamp);
  const valueRange = useVoxScene(s => s.valueRange);

  if (!grid) return null;

  const size = Math.max(
    grid.bounds.maxX - grid.bounds.minX,
    grid.bounds.maxY - grid.bounds.minY,
  ) * 1.5;

  return (
    <>
      <VoxelMesh
        grid={grid}
        visibility={visibility}
        slicePlanes={slicePlanes}
        simulation={simulation}
        colorRamp={colorRamp}
        valueRange={valueRange}
      />
      <GroundPlane size={size || 100} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Public viewer component                                           */
/* ------------------------------------------------------------------ */

export interface VoxCityViewerProps {
  /** CSS width. */
  width?: string | number;
  /** CSS height. */
  height?: string | number;
  /** Optional className. */
  className?: string;
}

export default function VoxCityViewer({
  width = "100%",
  height = "100%",
  className,
}: VoxCityViewerProps) {
  return (
    <div style={{ width, height, position: "relative", background: "#0d0d0d" }} className={className}>
      <Canvas
        camera={{ position: [80, 60, 80], fov: 50, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 80, 30]} intensity={0.8} />
        <SceneContents />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          minDistance={5}
          maxDistance={2000}
          maxPolarAngle={Math.PI * 0.48}
        />
      </Canvas>
    </div>
  );
}
