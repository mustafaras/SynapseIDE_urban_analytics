/**
 * WebGPUContext — device initialisation with graceful degradation.
 *
 * Cascade: WebGPU → WebGL2 → CPU-only.
 * Exposes capability flags so consumers can choose code paths.
 */

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export type GpuBackend = 'webgpu' | 'webgl2' | 'cpu';

export interface GpuCapabilities {
  backend: GpuBackend;
  /** True when compute shaders are available (WebGPU only). */
  compute: boolean;
  /** Max buffer / texture size (bytes). */
  maxBufferSize: number;
  /** Max 2-D texture dimension. */
  maxTextureDimension: number;
  /** The raw GPUDevice when backend === 'webgpu'. */
  device: GPUDevice | null;
  /** WebGL2RenderingContext when backend === 'webgl2'. */
  gl: WebGL2RenderingContext | null;
}

/* ------------------------------------------------------------------ */
/*  Singleton state                                                    */
/* ------------------------------------------------------------------ */

let _caps: GpuCapabilities | null = null;
let _initPromise: Promise<GpuCapabilities> | null = null;

/* ------------------------------------------------------------------ */
/*  WebGPU initialisation                                              */
/* ------------------------------------------------------------------ */

async function tryWebGPU(): Promise<GpuCapabilities | null> {
  if (typeof navigator === 'undefined') return null;
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
  if (!gpu) return null;

  try {
    const adapter: GPUAdapter | null = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return null;

    const device = await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
        maxBufferSize: adapter.limits.maxBufferSize,
      },
    });

    device.lost.then((info) => {
      console.warn('[WebGPU] device lost:', info.message);
      _caps = null;
      _initPromise = null;
    });

    return {
      backend: 'webgpu',
      compute: true,
      maxBufferSize: device.limits.maxBufferSize,
      maxTextureDimension: device.limits.maxTextureDimension2D,
      device,
      gl: null,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  WebGL2 fallback                                                    */
/* ------------------------------------------------------------------ */

function tryWebGL2(): GpuCapabilities | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return null;

  return {
    backend: 'webgl2',
    compute: false,
    maxBufferSize: 0,
    maxTextureDimension: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    device: null,
    gl,
  };
}

/* ------------------------------------------------------------------ */
/*  CPU-only fallback (always available)                               */
/* ------------------------------------------------------------------ */

function cpuFallback(): GpuCapabilities {
  return {
    backend: 'cpu',
    compute: false,
    maxBufferSize: 0,
    maxTextureDimension: 0,
    device: null,
    gl: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Initialise (or re-use) the GPU context singleton.
 *
 * Tries WebGPU first, then WebGL2, then falls back to CPU-only.
 */
export async function initGpuContext(): Promise<GpuCapabilities> {
  if (_caps) return _caps;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const webgpu = await tryWebGPU();
    if (webgpu) {
      _caps = webgpu;
      return webgpu;
    }

    const webgl2 = tryWebGL2();
    if (webgl2) {
      _caps = webgl2;
      return webgl2;
    }

    const cpu = cpuFallback();
    _caps = cpu;
    return cpu;
  })();

  return _initPromise;
}

/** Return the cached capabilities (null if `initGpuContext` has not resolved). */
export function getGpuCapabilities(): GpuCapabilities | null {
  return _caps;
}

/** Destroy the current context and reset the singleton. */
export function destroyGpuContext(): void {
  if (_caps?.device) {
    _caps.device.destroy();
  }
  _caps = null;
  _initPromise = null;
}
