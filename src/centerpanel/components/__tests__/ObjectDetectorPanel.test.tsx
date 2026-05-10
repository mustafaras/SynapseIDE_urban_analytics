// @vitest-environment jsdom

import React, { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRoot } from 'react-dom/client';
import ObjectDetectorPanel from '../ObjectDetectorPanel';
import { createImportedRasterSource, useEOSourceStore } from '@/services/data/eo';
import { useFlowStore } from '@/stores/useFlowStore';
import { useGeoAIStatusStore } from '@/stores/useGeoAIStatusStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface RuntimeAdapterLike {
  loadModel: (source: string | ArrayBuffer) => Promise<string>;
  run: (sessionHandle: string, feeds: Record<string, { data: Float32Array | Int32Array | Uint8Array; dims: number[] }>, signal?: AbortSignal) => Promise<Record<string, { data: Float32Array; dims: number[] }>>;
  releaseSession: (sessionHandle: string) => Promise<void>;
  getSessionMemory: (sessionHandle: string) => number;
}

function makeAnalysisRaster() {
  const width = 16;
  const height = 16;
  const pixelCount = width * height;
  return {
    width,
    height,
    bandCount: 4,
    bbox: [28.94, 41.01, 28.95, 41.02] as [number, number, number, number],
    data: [
      Float64Array.from({ length: pixelCount }, (_, index) => (index % width) / width),
      Float64Array.from({ length: pixelCount }, (_, index) => Math.floor(index / width) / height),
      Float64Array.from({ length: pixelCount }, (_, index) => ((index % width) + Math.floor(index / width)) / 32),
      Float64Array.from({ length: pixelCount }, (_, index) => 1 - (index % width) / width),
    ],
  };
}

function makeRealSource() {
  return createImportedRasterSource({
    id: 'imported-detection-source',
    title: 'Imported Detection Raster',
    sourceRef: 'file://imported-detection-source.tif',
    bbox: [28.94, 41.01, 28.95, 41.02],
    crs: 'EPSG:4326',
    bandMapping: [
      { key: 'blue', source: 'band-1', label: 'Blue' },
      { key: 'green', source: 'band-2', label: 'Green' },
      { key: 'red', source: 'band-3', label: 'Red' },
      { key: 'nir', source: 'band-4', label: 'Near Infrared' },
    ],
    analysisRaster: makeAnalysisRaster(),
  });
}

function createSuccessfulRuntimeAdapter(): RuntimeAdapterLike {
  let counter = 0;
  return {
    async loadModel() {
      counter += 1;
      return `runtime-session-${counter}`;
    },
    async run(_handle, _feeds) {
      return {
        output: {
          data: new Float32Array([
            4, 4, 3, 3, 0.95,
            0.95, 0.03, 0.01, 0.01, 0.01,
          ]),
          dims: [1, 1, 10],
        },
      };
    },
    async releaseSession() {},
    getSessionMemory() {
      return 4 * 1024 * 1024;
    },
  };
}

function createFailingRuntimeAdapter(message: string): RuntimeAdapterLike {
  return {
    async loadModel() {
      throw new Error(message);
    },
    async run() {
      return { output: { data: new Float32Array(), dims: [1, 0, 10] } };
    },
    async releaseSession() {},
    getSessionMemory() {
      return 0;
    },
  };
}

function createAbortableRuntimeAdapter(): RuntimeAdapterLike {
  let counter = 0;
  return {
    async loadModel() {
      counter += 1;
      return `runtime-session-${counter}`;
    },
    async run(_handle, _feeds, signal) {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve({
            output: {
              data: new Float32Array([
                4, 4, 3, 3, 0.95,
                0.95, 0.03, 0.01, 0.01, 0.01,
              ]),
              dims: [1, 1, 10],
            },
          });
        }, 150);

        signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Inference aborted', 'AbortError'));
        }, { once: true });
      });
    },
    async releaseSession() {},
    getSessionMemory() {
      return 4 * 1024 * 1024;
    },
  };
}

async function dispatchClick(element: Element | null): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

async function setSelectValue(element: HTMLSelectElement | null, value: string): Promise<void> {
  await act(async () => {
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

async function waitFor(check: () => void, timeoutMs = 4000): Promise<void> {
  const started = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - started > timeoutMs) {
        throw error;
      }
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });
    }
  }
}

function mountPanel() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

beforeEach(() => {
  useEOSourceStore.getState().clear();
  useFlowStore.getState().reset();
  useGeoAIStatusStore.getState().reset();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  delete window.__SYNAPSE_OBJECT_DETECTION_RUNTIME__;
});

describe('ObjectDetectorPanel', () => {
  it('runs the real model path against a raster source and persists publish metadata', async () => {
    useEOSourceStore.getState().upsertSource(makeRealSource());
    window.__SYNAPSE_OBJECT_DETECTION_RUNTIME__ = {
      adapter: createSuccessfulRuntimeAdapter(),
      backend: 'wasm',
      modelSource: 'mock://urban-detector.onnx',
      modelId: 'yolo-nano-urban-640',
    };

    const { container, root } = mountPanel();
    await act(async () => {
      root.render(<ObjectDetectorPanel />);
    });

    await setSelectValue(container.querySelector('[data-testid="object-detector-source-select"]') as HTMLSelectElement | null, 'imported-detection-source');
    expect(container.querySelector('[data-testid="object-detector-mode"]')?.textContent).toContain('Real model');

    await dispatchClick(container.querySelector('[data-testid="object-detector-run"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    expect(container.querySelector('[data-testid="object-detector-notice"]')?.textContent).toContain('Real model detection published');
    expect(useFlowStore.getState().completedRuns[0]?.dataOutputs[1]?.preview[0]).toMatchObject({
      execution_mode: 'real-model',
      model_id: 'yolo-nano-urban-640',
      source_id: 'imported-detection-source',
      backend: 'wasm',
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('runs Demo mode explicitly and persists demo metadata instead of claiming real weights', async () => {
    useEOSourceStore.getState().upsertSource(makeRealSource());

    const { container, root } = mountPanel();
    await act(async () => {
      root.render(<ObjectDetectorPanel />);
    });

    await setSelectValue(container.querySelector('[data-testid="object-detector-source-select"]') as HTMLSelectElement | null, 'imported-detection-source');
    await setSelectValue(container.querySelector('[data-testid="object-detector-mode-select"]') as HTMLSelectElement | null, 'demo-mode');

    await dispatchClick(container.querySelector('[data-testid="object-detector-run"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    expect(container.querySelector('[data-testid="object-detector-notice"]')?.textContent).toContain('Demo mode detection published');
    expect(useFlowStore.getState().completedRuns[0]?.dataOutputs[1]?.preview[0]).toMatchObject({
      execution_mode: 'demo-mode',
      demo_mode: true,
      backend: 'demo',
      source_id: 'imported-detection-source',
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('surfaces a truthful real-model error and still allows an explicit Demo mode fallback', async () => {
    useEOSourceStore.getState().upsertSource(makeRealSource());
    window.__SYNAPSE_OBJECT_DETECTION_RUNTIME__ = {
      adapter: createFailingRuntimeAdapter('Model weights could not be loaded.'),
      backend: 'wasm',
      modelSource: 'mock://urban-detector.onnx',
      modelId: 'yolo-nano-urban-640',
    };

    const { container, root } = mountPanel();
    await act(async () => {
      root.render(<ObjectDetectorPanel />);
    });

    await setSelectValue(container.querySelector('[data-testid="object-detector-source-select"]') as HTMLSelectElement | null, 'imported-detection-source');
    await dispatchClick(container.querySelector('[data-testid="object-detector-run"]'));

    await waitFor(() => {
      expect(container.querySelector('[data-testid="object-detector-error"]')?.textContent).toContain('Model weights could not be loaded.');
    });

    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(0);
    expect(useFlowStore.getState().completedRuns).toHaveLength(0);

    await setSelectValue(container.querySelector('[data-testid="object-detector-mode-select"]') as HTMLSelectElement | null, 'demo-mode');
    await dispatchClick(container.querySelector('[data-testid="object-detector-run"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    expect(container.querySelector('[data-testid="object-detector-notice"]')?.textContent).toContain('Demo mode detection published');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('supports canceling an in-flight real-model run without publishing partial output', async () => {
    useEOSourceStore.getState().upsertSource(makeRealSource());
    window.__SYNAPSE_OBJECT_DETECTION_RUNTIME__ = {
      adapter: createAbortableRuntimeAdapter(),
      backend: 'wasm',
      modelSource: 'mock://urban-detector.onnx',
      modelId: 'yolo-nano-urban-640',
    };

    const { container, root } = mountPanel();
    await act(async () => {
      root.render(<ObjectDetectorPanel />);
    });

    await setSelectValue(container.querySelector('[data-testid="object-detector-source-select"]') as HTMLSelectElement | null, 'imported-detection-source');
    await dispatchClick(container.querySelector('[data-testid="object-detector-run"]'));
    await waitFor(() => {
      expect(container.querySelector('[data-testid="object-detector-cancel"]')).not.toBeNull();
    });

    await dispatchClick(container.querySelector('[data-testid="object-detector-cancel"]'));

    await waitFor(() => {
      expect((container.querySelector('[data-testid="object-detector-run"]') as HTMLButtonElement | null)?.disabled).toBe(false);
    });

    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(0);
    expect(useFlowStore.getState().completedRuns).toHaveLength(0);
    expect(container.querySelector('[data-testid="object-detector-error"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});