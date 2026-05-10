/**
 * SpatialComputeEngine — high-level API for GPU-accelerated raster operations.
 *
 * Each public method first attempts a WebGPU compute-shader path and, when
 * the device is unavailable, transparently falls back to a CPU implementation.
 *
 * Public surface:
 *   computeNDVI(nir, red)            → Float32Array
 *   computeBandMath(a, b, op)        → Float32Array
 *   computeHillshade(dem, w, h, …)   → Float32Array
 *   computeKDE(points, w, h, bbox, bw) → Float32Array
 */

import { type GpuCapabilities, initGpuContext } from './WebGPUContext';
import rasterOpsSrc from './shaders/rasterOps.wgsl?raw';
import hillshadeSrc from './shaders/hillshade.wgsl?raw';

/* ------------------------------------------------------------------ */
/*  Band-math op codes (must match rasterOps.wgsl Params.op)           */
/* ------------------------------------------------------------------ */

export type BandOp = 'add' | 'subtract' | 'multiply' | 'divide' | 'ndiff';

const OP_CODE: Record<BandOp, number> = {
  add: 0,
  subtract: 1,
  multiply: 2,
  divide: 3,
  ndiff: 4,
};

/* ------------------------------------------------------------------ */
/*  Pipeline caches                                                    */
/* ------------------------------------------------------------------ */

let _rasterPipeline: GPUComputePipeline | null = null;
let _hillshadePipeline: GPUComputePipeline | null = null;

function getRasterPipeline(device: GPUDevice): GPUComputePipeline {
  if (!_rasterPipeline) {
    const module = device.createShaderModule({ code: rasterOpsSrc });
    _rasterPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    });
  }
  return _rasterPipeline;
}

function getHillshadePipeline(device: GPUDevice): GPUComputePipeline {
  if (!_hillshadePipeline) {
    const module = device.createShaderModule({ code: hillshadeSrc });
    _hillshadePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    });
  }
  return _hillshadePipeline;
}

/* ------------------------------------------------------------------ */
/*  GPU helpers                                                        */
/* ------------------------------------------------------------------ */

function uploadF32(device: GPUDevice, data: Float32Array, usage: GPUBufferUsageFlags): GPUBuffer {
  const buf = device.createBuffer({ size: data.byteLength, usage, mappedAtCreation: true });
  new Float32Array(buf.getMappedRange()).set(data);
  buf.unmap();
  return buf;
}

async function readBackF32(device: GPUDevice, src: GPUBuffer, count: number): Promise<Float32Array> {
  const byteLen = count * 4;
  const staging = device.createBuffer({
    size: byteLen,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const enc = device.createCommandEncoder();
  enc.copyBufferToBuffer(src, 0, staging, 0, byteLen);
  device.queue.submit([enc.finish()]);
  await staging.mapAsync(GPUMapMode.READ);
  const out = new Float32Array(staging.getMappedRange()).slice();
  staging.unmap();
  staging.destroy();
  return out;
}

/* ------------------------------------------------------------------ */
/*  GPU: band math dispatch                                            */
/* ------------------------------------------------------------------ */

async function gpuBandMath(
  device: GPUDevice,
  a: Float32Array,
  b: Float32Array,
  op: BandOp,
): Promise<Float32Array> {
  const count = a.length;
  const pipeline = getRasterPipeline(device);

  /* Uniform: { count: u32, op: u32 } = 8 bytes, aligned to 16 */
  const uniformData = new ArrayBuffer(16);
  new Uint32Array(uniformData, 0, 2).set([count, OP_CODE[op]]);
  const uniformBuf = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint8Array(uniformBuf.getMappedRange()).set(new Uint8Array(uniformData));
  uniformBuf.unmap();

  const usage = GPUBufferUsage.STORAGE;
  const bandABuf = uploadF32(device, a, usage);
  const bandBBuf = uploadF32(device, b, usage);
  const resultBuf = device.createBuffer({
    size: count * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const bg = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuf } },
      { binding: 1, resource: { buffer: bandABuf } },
      { binding: 2, resource: { buffer: bandBBuf } },
      { binding: 3, resource: { buffer: resultBuf } },
    ],
  });

  const enc = device.createCommandEncoder();
  const pass = enc.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bg);
  pass.dispatchWorkgroups(Math.ceil(count / 256));
  pass.end();
  device.queue.submit([enc.finish()]);

  const result = await readBackF32(device, resultBuf, count);

  uniformBuf.destroy();
  bandABuf.destroy();
  bandBBuf.destroy();
  resultBuf.destroy();

  return result;
}

/* ------------------------------------------------------------------ */
/*  GPU: hillshade dispatch                                            */
/* ------------------------------------------------------------------ */

async function gpuHillshade(
  device: GPUDevice,
  dem: Float32Array,
  width: number,
  height: number,
  cellSize: number,
  azimuthRad: number,
  altitudeRad: number,
): Promise<Float32Array> {
  const pipeline = getHillshadePipeline(device);
  const count = width * height;

  /* Uniform: { width: u32, height: u32, cellSize: f32, azimuth: f32, altitude: f32 } = 20 bytes → pad to 32 */
  const uniformData = new ArrayBuffer(32);
  const uView32 = new Uint32Array(uniformData);
  const fView32 = new Float32Array(uniformData);
  uView32[0] = width;
  uView32[1] = height;
  fView32[2] = cellSize;
  fView32[3] = azimuthRad;
  fView32[4] = altitudeRad;

  const uniformBuf = device.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint8Array(uniformBuf.getMappedRange()).set(new Uint8Array(uniformData));
  uniformBuf.unmap();

  const demBuf = uploadF32(device, dem, GPUBufferUsage.STORAGE);
  const resultBuf = device.createBuffer({
    size: count * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const bg = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuf } },
      { binding: 1, resource: { buffer: demBuf } },
      { binding: 2, resource: { buffer: resultBuf } },
    ],
  });

  const wgX = Math.ceil(width / 16);
  const wgY = Math.ceil(height / 16);

  const enc = device.createCommandEncoder();
  const pass = enc.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bg);
  pass.dispatchWorkgroups(wgX, wgY);
  pass.end();
  device.queue.submit([enc.finish()]);

  const result = await readBackF32(device, resultBuf, count);

  uniformBuf.destroy();
  demBuf.destroy();
  resultBuf.destroy();

  return result;
}

/* ------------------------------------------------------------------ */
/*  CPU fallbacks                                                      */
/* ------------------------------------------------------------------ */

function cpuBandMath(a: Float32Array, b: Float32Array, op: BandOp): Float32Array {
  const n = a.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const va = a[i]!;
    const vb = b[i]!;
    switch (op) {
      case 'add':
        out[i] = va + vb;
        break;
      case 'subtract':
        out[i] = va - vb;
        break;
      case 'multiply':
        out[i] = va * vb;
        break;
      case 'divide':
        out[i] = Math.abs(vb) > 1e-10 ? va / vb : 0;
        break;
      case 'ndiff': {
        const d = va + vb;
        out[i] = Math.abs(d) > 1e-10 ? (va - vb) / d : 0;
        break;
      }
    }
  }
  return out;
}

function cpuHillshade(
  dem: Float32Array,
  width: number,
  height: number,
  cellSize: number,
  azimuthRad: number,
  altitudeRad: number,
): Float32Array {
  const out = new Float32Array(width * height);
  const zenith = Math.PI / 2 - altitudeRad;

  const e = (col: number, row: number) => {
    const c = Math.max(0, Math.min(width - 1, col));
    const r = Math.max(0, Math.min(height - 1, row));
    return dem[r * width + c]!;
  };

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const a = e(col - 1, row - 1);
      const b = e(col, row - 1);
      const c = e(col + 1, row - 1);
      const d = e(col - 1, row);
      const f = e(col + 1, row);
      const g = e(col - 1, row + 1);
      const h = e(col, row + 1);
      const ii = e(col + 1, row + 1);

      const dzdx = ((c + 2 * f + ii) - (a + 2 * d + g)) / (8 * cellSize);
      const dzdy = ((g + 2 * h + ii) - (a + 2 * b + c)) / (8 * cellSize);

      const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
      let aspect = Math.atan2(dzdy, -dzdx);
      if (aspect < 0) aspect += 2 * Math.PI;

      const shade =
        Math.cos(zenith) * Math.cos(slope) +
        Math.sin(zenith) * Math.sin(slope) * Math.cos(azimuthRad - aspect);

      out[row * width + col] = Math.max(0, Math.min(1, shade));
    }
  }
  return out;
}

function cpuKDE(
  points: readonly [number, number][],
  width: number,
  height: number,
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  bandwidth: number,
): Float32Array {
  const out = new Float32Array(width * height);
  const cellW = (bbox.maxX - bbox.minX) / width;
  const cellH = (bbox.maxY - bbox.minY) / height;
  const bw2 = bandwidth * bandwidth;
  const norm = 1 / (2 * Math.PI * bw2);

  for (let r = 0; r < height; r++) {
    const cy = bbox.minY + (r + 0.5) * cellH;
    for (let c = 0; c < width; c++) {
      const cx = bbox.minX + (c + 0.5) * cellW;
      let sum = 0;
      for (const [px, py] of points) {
        const dx = cx - px;
        const dy = cy - py;
        const dist2 = dx * dx + dy * dy;
        sum += norm * Math.exp(-dist2 / (2 * bw2));
      }
      out[r * width + c] = sum;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

let _caps: GpuCapabilities | null = null;

async function ensureCaps(): Promise<GpuCapabilities> {
  if (!_caps) _caps = await initGpuContext();
  return _caps;
}

/**
 * Compute NDVI = (NIR − RED) / (NIR + RED).
 *
 * Both bands must have the same length (one value per pixel).
 */
export async function computeNDVI(nirBand: Float32Array, redBand: Float32Array): Promise<Float32Array> {
  if (nirBand.length !== redBand.length) throw new Error('Band length mismatch');
  const caps = await ensureCaps();
  if (caps.compute && caps.device) {
    return gpuBandMath(caps.device, nirBand, redBand, 'ndiff');
  }
  return cpuBandMath(nirBand, redBand, 'ndiff');
}

/**
 * Generic band math: A op B.
 */
export async function computeBandMath(
  bandA: Float32Array,
  bandB: Float32Array,
  op: BandOp,
): Promise<Float32Array> {
  if (bandA.length !== bandB.length) throw new Error('Band length mismatch');
  const caps = await ensureCaps();
  if (caps.compute && caps.device) {
    return gpuBandMath(caps.device, bandA, bandB, op);
  }
  return cpuBandMath(bandA, bandB, op);
}

/**
 * Compute hillshade illumination from a DEM grid.
 *
 * @param dem       Row-major elevation values (width × height).
 * @param width     Grid width in pixels.
 * @param height    Grid height in pixels.
 * @param cellSize  Cell size in metres.
 * @param azimuth   Light source azimuth in degrees (0 = north, CW).
 * @param altitude  Light source altitude in degrees above horizon.
 * @returns         Float32Array of illumination values in [0, 1].
 */
export async function computeHillshade(
  dem: Float32Array,
  width: number,
  height: number,
  cellSize: number,
  azimuth: number = 315,
  altitude: number = 45,
): Promise<Float32Array> {
  if (dem.length !== width * height) throw new Error('DEM size does not match width×height');
  const azRad = (azimuth * Math.PI) / 180;
  const altRad = (altitude * Math.PI) / 180;

  const caps = await ensureCaps();
  if (caps.compute && caps.device) {
    return gpuHillshade(caps.device, dem, width, height, cellSize, azRad, altRad);
  }
  return cpuHillshade(dem, width, height, cellSize, azRad, altRad);
}

/**
 * Kernel Density Estimation on a 2-D point set.
 *
 * Uses Gaussian kernel. Always runs on CPU (compute-shader path
 * would require a scatter or atomic approach; suitable for a future
 * optimisation pass).
 *
 * @returns Row-major density grid (width × height).
 */
export async function computeKDE(
  points: readonly [number, number][],
  width: number,
  height: number,
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  bandwidth: number,
): Promise<Float32Array> {
  /* KDE is CPU-only for now — GPU version needs atomics / tiling. */
  void (await ensureCaps());
  return cpuKDE(points, width, height, bbox, bandwidth);
}
