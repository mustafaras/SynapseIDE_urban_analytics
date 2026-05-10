/**
 * ONNX Runtime Manager + Model Registry — test suite
 *
 * Uses a mock RuntimeAdapter so tests run without onnxruntime-web.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { ONNXRuntimeManager } from '../ONNXRuntimeManager';
import { ModelRegistry } from '../ModelRegistry';
import type { RuntimeAdapter, TensorLike } from '../types';

/* ── Mock adapter factory ──────────────────────────── */

function createMockAdapter(sessionMemory = 1024): RuntimeAdapter {
  const sessions = new Map<string, number>();
  let counter = 0;

  return {
    async loadModel(_source: string | ArrayBuffer): Promise<string> {
      const handle = `session-${++counter}`;
      sessions.set(handle, sessionMemory);
      return handle;
    },
    async run(
      _handle: string,
      feeds: Record<string, TensorLike>,
      signal?: AbortSignal,
    ): Promise<Record<string, TensorLike>> {
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
      // Echo back a dummy output with the same dims as the first feed
      const firstKey = Object.keys(feeds)[0];
      const input = feeds[firstKey];
      return {
        output: {
          data: new Float32Array(input.data.length).fill(0.5),
          dims: [...input.dims],
        },
      };
    },
    async releaseSession(handle: string): Promise<void> {
      sessions.delete(handle);
    },
    getSessionMemory(handle: string): number {
      return sessions.get(handle) ?? 0;
    },
  };
}

/* ══════════════════════════════════════════════════════
   ModelRegistry
   ══════════════════════════════════════════════════════ */

describe('ModelRegistry', () => {
  it('seeds built-in models by default', () => {
    const reg = new ModelRegistry();
    expect(reg.list().length).toBeGreaterThanOrEqual(2);
    expect(reg.has('unet-landcover-256')).toBe(true);
    expect(reg.has('segformer-landcover-512')).toBe(true);
  });

  it('can skip built-in seeding', () => {
    const reg = new ModelRegistry(false);
    expect(reg.list().length).toBe(0);
  });

  it('registers a user-supplied model', () => {
    const reg = new ModelRegistry(false);
    reg.register({
      id: 'custom-model',
      label: 'Custom',
      version: '0.1.0',
      domain: 'tabular',
      inputShape: [1, 10],
      outputShape: [1, 3],
      sizeBytes: 5000,
      builtIn: false,
    });
    expect(reg.has('custom-model')).toBe(true);
    expect(reg.get('custom-model')!.label).toBe('Custom');
  });

  it('rejects duplicate registration', () => {
    const reg = new ModelRegistry();
    expect(() =>
      reg.register({
        id: 'unet-landcover-256',
        label: 'dup',
        version: '0.0.0',
        domain: 'cv',
        inputShape: [1],
        outputShape: [1],
        sizeBytes: 1,
        builtIn: false,
      }),
    ).toThrow(/already registered/);
  });

  it('unregisters a user model', () => {
    const reg = new ModelRegistry(false);
    reg.register({
      id: 'temp',
      label: 'Temp',
      version: '0.0.1',
      domain: 'cv',
      inputShape: [1],
      outputShape: [1],
      sizeBytes: 100,
      builtIn: false,
    });
    expect(reg.unregister('temp')).toBe(true);
    expect(reg.has('temp')).toBe(false);
  });

  it('prevents removing built-in models', () => {
    const reg = new ModelRegistry();
    expect(() => reg.unregister('unet-landcover-256')).toThrow(/cannot remove built-in/);
  });

  it('returns false for unregistering unknown model', () => {
    const reg = new ModelRegistry(false);
    expect(reg.unregister('nonexistent')).toBe(false);
  });

  it('filters by domain', () => {
    const reg = new ModelRegistry();
    const cvModels = reg.listByDomain('cv');
    expect(cvModels.length).toBeGreaterThanOrEqual(2);
    expect(cvModels.every((m) => m.domain === 'cv')).toBe(true);
    expect(reg.listByDomain('nlp').length).toBe(0);
  });

  it('reports total size', () => {
    const reg = new ModelRegistry();
    expect(reg.totalSizeBytes()).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════
   ONNXRuntimeManager
   ══════════════════════════════════════════════════════ */

describe('ONNXRuntimeManager', () => {
  let mgr: ONNXRuntimeManager;
  let adapter: RuntimeAdapter;

  beforeEach(() => {
    adapter = createMockAdapter(1024);
    mgr = new ONNXRuntimeManager({ adapter, memoryBudgetBytes: 8192 });
  });

  it('throws without an adapter', () => {
    expect(() => new ONNXRuntimeManager({})).toThrow(/RuntimeAdapter/);
  });

  it('reports initial status', () => {
    const s = mgr.status();
    expect(s.loadedModels).toEqual([]);
    expect(s.totalMemoryUsed).toBe(0);
    expect(s.memoryBudget).toBe(8192);
    expect(s.backend).toBe('wasm');
  });

  it('loads a model', async () => {
    await mgr.loadModel('unet-landcover-256', 'http://example.com/model.onnx');
    expect(mgr.isLoaded('unet-landcover-256')).toBe(true);
    expect(mgr.status().loadedModels).toContain('unet-landcover-256');
  });

  it('load is idempotent', async () => {
    await mgr.loadModel('unet-landcover-256', 'http://example.com/model.onnx');
    await mgr.loadModel('unet-landcover-256', 'http://example.com/model.onnx'); // no-op
    expect(mgr.status().loadedModels.length).toBe(1);
  });

  it('runs warmup', async () => {
    await mgr.loadModel('unet-landcover-256', 'buffer');
    await mgr.warmup('unet-landcover-256'); // should not throw
  });

  it('runs inference and returns result', async () => {
    await mgr.loadModel('unet-landcover-256', 'buffer');
    const feed = {
      input: {
        data: new Float32Array([1, 2, 3, 4]),
        dims: [1, 1, 2, 2],
      },
    };
    const result = await mgr.run('unet-landcover-256', feed);
    expect(result.outputs.output).toBeDefined();
    expect(result.outputs.output.data.length).toBe(4);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('throws on inference with unloaded model', async () => {
    await expect(
      mgr.run('nonexistent', { input: { data: new Float32Array([1]), dims: [1] } }),
    ).rejects.toThrow(/not loaded/);
  });

  it('aborts inference via AbortSignal', async () => {
    await mgr.loadModel('unet-landcover-256', 'buffer');
    const ac = new AbortController();
    ac.abort();
    await expect(
      mgr.run(
        'unet-landcover-256',
        { input: { data: new Float32Array([1]), dims: [1] } },
        ac.signal,
      ),
    ).rejects.toThrow(/abort/i);
  });

  it('releases a model', async () => {
    await mgr.loadModel('unet-landcover-256', 'buffer');
    await mgr.releaseModel('unet-landcover-256');
    expect(mgr.isLoaded('unet-landcover-256')).toBe(false);
    expect(mgr.status().totalMemoryUsed).toBe(0);
  });

  it('releaseAll clears everything', async () => {
    // Use a large-budget manager so built-in model sizes don't trigger eviction
    const bigMgr = new ONNXRuntimeManager({
      adapter,
      memoryBudgetBytes: 512 * 1024 * 1024,
    });
    await bigMgr.loadModel('unet-landcover-256', 'url1');
    await bigMgr.loadModel('segformer-landcover-512', 'url2');
    expect(bigMgr.status().loadedModels.length).toBe(2);
    await bigMgr.releaseAll();
    expect(bigMgr.status().loadedModels.length).toBe(0);
  });

  it('tracks memory from adapter', async () => {
    await mgr.loadModel('unet-landcover-256', 'buffer');
    expect(mgr.status().totalMemoryUsed).toBe(1024);
  });

  it('evicts LRU sessions when budget exceeded', async () => {
    // Budget is 8192. Each session is 1024 bytes.
    // Load 8 models, then load a 9th — first should be evicted.
    const reg = mgr.registry;
    for (let i = 0; i < 8; i++) {
      const id = `test-model-${i}`;
      if (!reg.has(id)) {
        reg.register({
          id,
          label: `Test ${i}`,
          version: '1.0.0',
          domain: 'tabular',
          inputShape: [1, 4],
          outputShape: [1, 2],
          sizeBytes: 1024,
          builtIn: false,
        });
      }
      await mgr.loadModel(id, `url-${i}`);
    }
    expect(mgr.status().loadedModels.length).toBe(8);
    expect(mgr.status().totalMemoryUsed).toBe(8192);

    // Register and load one more — should evict the oldest (test-model-0)
    reg.register({
      id: 'test-model-overflow',
      label: 'Overflow',
      version: '1.0.0',
      domain: 'tabular',
      inputShape: [1, 4],
      outputShape: [1, 2],
      sizeBytes: 1024,
      builtIn: false,
    });
    await mgr.loadModel('test-model-overflow', 'url-overflow');
    expect(mgr.status().loadedModels.length).toBe(8);
    expect(mgr.isLoaded('test-model-0')).toBe(false);
    expect(mgr.isLoaded('test-model-overflow')).toBe(true);
  });

  it('allows custom backend selection', () => {
    const gpuMgr = new ONNXRuntimeManager({ adapter, backend: 'webgpu' });
    expect(gpuMgr.status().backend).toBe('webgpu');
  });

  it('warmup throws for unloaded model', async () => {
    await expect(mgr.warmup('ghost')).rejects.toThrow(/not loaded/);
  });

  it('release is no-op for unknown model', async () => {
    await mgr.releaseModel('nonexistent'); // no throw
    expect(mgr.status().totalMemoryUsed).toBe(0);
  });
});
