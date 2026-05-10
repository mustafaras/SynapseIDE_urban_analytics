/**
 * Web Worker for GWR computation.
 *
 * Offloads the O(n² × p²) regression loop to a background thread.
 * Imports `gwrComputeCore` from the GWR module so that worker and
 * synchronous fallback are guaranteed to produce identical results.
 */

import { gwrComputeCore } from '../engine/spatial-stats/regression/GWR';
import type { KernelType } from '../engine/spatial-stats/types';

interface WorkerCtx {
  postMessage: (msg: unknown, transfer?: Transferable[]) => void;
  addEventListener: (
    type: 'message',
    listener: (e: MessageEvent) => void,
  ) => void;
}

const ctx = self as unknown as WorkerCtx;

ctx.addEventListener('message', (e: MessageEvent) => {
  try {
    const {
      coordsFlat,
      xFlat,
      yArr,
      n,
      p,
      kernel,
      bandwidth,
      bwSearchTol,
    } = e.data;

    const result = gwrComputeCore(
      coordsFlat as Float64Array,
      xFlat as Float64Array,
      yArr as Float64Array,
      n as number,
      p as number,
      kernel as KernelType,
      (bandwidth as number | null) ?? null,
      (bwSearchTol as number) ?? 0,
    );

    ctx.postMessage(
      { ok: true, result },
      [
        result.betasFlat.buffer,
        result.seFlat.buffer,
        result.localR2.buffer,
        result.hatDiag.buffer,
        result.residuals.buffer,
        result.fittedValues.buffer,
      ],
    );
  } catch (err) {
    ctx.postMessage({
      ok: false,
      error: (err as Error)?.message ?? 'gwr-worker-error',
    });
  }
});

export {};
