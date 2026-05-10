/**
 * VoxelLayer — Bridge VoxCity voxel data to a deck.gl PointCloudLayer.
 *
 * Projects the 3D voxel grid as a top-down 2D cloud on the map.
 * Users can click the layer to open the full 3D VoxCity viewer in a side panel.
 */
import { PointCloudLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { ColorRampName, SimulationResult, VoxelGrid, VoxelMaterial } from '@/features/urbanAnalytics/voxcity/types';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

export interface VoxelLayerConfig {
  id: string;
  grid: VoxelGrid;
  /** Optional simulation overlay: colours points by scalar value. */
  simulation?: SimulationResult | undefined;
  /** Centre of the grid in geographic coords [lng, lat]. */
  origin: [number, number];
  /** Metres-per-unit if voxel coords are local (default 1). */
  scale?: number | undefined;
  /** Filter: only show voxels at this Z level. -1 = all levels collapsed. */
  zSlice?: number | undefined;
  /** Which material IDs to show (all if omitted). */
  visibleMaterials?: ReadonlySet<number> | undefined;
  /** Colour ramp for simulation overlay. */
  colorRamp?: ColorRampName | undefined;
  opacity?: number | undefined;
  visible?: boolean | undefined;
  /** Point size in pixels. */
  pointSize?: number | undefined;
  onHover?: ((info: PickingInfo) => void) | undefined;
  onClick?: ((info: PickingInfo) => void) | undefined;
}

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                     */
/* ------------------------------------------------------------------ */

const RAMP_ENDPOINTS: Record<ColorRampName, [[number, number, number], [number, number, number]]> = {
  viridis:  [[68, 1, 84],   [253, 231, 37]],
  plasma:   [[13, 8, 135],  [240, 249, 33]],
  inferno:  [[0, 0, 4],     [252, 255, 164]],
  magma:    [[0, 0, 4],     [251, 253, 191]],
  RdYlBu:   [[215, 48, 39], [69, 117, 180]],
  RdYlGn:   [[215, 48, 39], [26, 152, 80]],
  Spectral: [[215, 48, 39], [43, 131, 186]],
  coolwarm: [[59, 76, 192], [180, 4, 38]],
};

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number, number] {
  const c = 1 - t;
  return [
    Math.round(a[0] * c + b[0] * t),
    Math.round(a[1] * c + b[1] * t),
    Math.round(a[2] * c + b[2] * t),
    255,
  ];
}

function sampleRamp(ramp: ColorRampName, t: number): [number, number, number, number] {
  const [lo, hi] = RAMP_ENDPOINTS[ramp];
  return lerpColor(lo, hi, Math.max(0, Math.min(1, t)));
}

function hexToRGBA(hex: string): [number, number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
}

/* ------------------------------------------------------------------ */
/*  Build material colour LUT                                          */
/* ------------------------------------------------------------------ */

function buildMaterialLUT(materials: readonly VoxelMaterial[]): Map<number, [number, number, number, number]> {
  const lut = new Map<number, [number, number, number, number]>();
  for (const m of materials) {
    const rgba = hexToRGBA(m.color);
    rgba[3] = Math.round(m.opacity * 255);
    lut.set(m.id, rgba);
  }
  return lut;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/**
 * Create a deck.gl PointCloudLayer that renders a VoxCity voxel grid
 * in 2D top-down projection.
 */
export function createVoxelLayer(config: VoxelLayerConfig) {
  const {
    id,
    grid,
    simulation,
    origin,
    scale: mpu = 1,
    zSlice = -1,
    visibleMaterials,
    colorRamp = 'viridis',
    opacity = 0.85,
    visible = true,
    pointSize = 4,
    onHover,
    onClick,
  } = config;

  /* Filter voxels by Z-slice and material visibility */
  const filtered = grid.voxels.filter((v, _idx) => {
    if (zSlice >= 0 && v.z !== zSlice) return false;
    if (visibleMaterials && !visibleMaterials.has(v.materialId)) return false;
    return true;
  });

  const materialLUT = buildMaterialLUT(grid.materials);

  /* Pre-compute simulation value range for normalisation */
  const simMin = simulation?.min ?? 0;
  const simRange = simulation ? (simulation.max - simMin) || 1 : 1;

  /* Build an index map from original voxel array index so we can look up
     simulation values. We need the canonical index of each kept voxel. */
  const originalIndices: number[] = [];
  {
    let oi = 0;
    for (const v of grid.voxels) {
      const keep =
        (zSlice < 0 || v.z === zSlice) &&
        (!visibleMaterials || visibleMaterials.has(v.materialId));
      if (keep) originalIndices.push(oi);
      oi++;
    }
  }

  /* Degree offset per metre at the origin latitude */
  const degPerMetreLng = 1 / (111_320 * Math.cos((origin[1] * Math.PI) / 180));
  const degPerMetreLat = 1 / 110_540;

  return new PointCloudLayer({
    id,
    data: filtered,
    visible,
    opacity,
    pickable: true,
    coordinateSystem: 0 /* COORDINATE_SYSTEM.LNGLAT */,
    pointSize,
    getPosition: (v: (typeof filtered)[number], objectInfo: { index: number }) => {
      const lng = origin[0] + v.x * mpu * degPerMetreLng;
      const lat = origin[1] + v.y * mpu * degPerMetreLat;
      const alt = v.z * mpu;
      void objectInfo;
      return [lng, lat, alt];
    },
    getColor: (v: (typeof filtered)[number], objectInfo: { index: number }) => {
      /* If simulation data, colour by sim value */
      if (simulation) {
        const oi = originalIndices[objectInfo.index];
        if (oi !== undefined && oi < simulation.values.length) {
          const t = (simulation.values[oi]! - simMin) / simRange;
          return sampleRamp(colorRamp, t);
        }
      }
      return materialLUT.get(v.materialId) ?? [180, 180, 180, 255];
    },
    getNormal: [0, 0, 1],
    updateTriggers: {
      getColor: [simulation?.id, colorRamp],
      getPosition: [origin[0], origin[1], zSlice, mpu],
    },
    ...(onHover ? { onHover } : {}),
    ...(onClick ? { onClick } : {}),
  });
}
