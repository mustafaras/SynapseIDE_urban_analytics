import { create } from 'zustand';
import { analyticsWorkerPool, type BackgroundTaskPoolSnapshot } from '@/workers/pool';

interface BackgroundTaskStore extends BackgroundTaskPoolSnapshot {
  panelOpen: boolean;
  panelHostId: string | null;
  openPanel: (hostId?: string) => void;
  closePanel: () => void;
  togglePanel: (hostId?: string) => void;
  claimPanelHost: (hostId: string) => void;
  clearFinished: () => void;
  cancelJob: (jobId: string) => boolean;
  retryJob: (jobId: string) => string | null;
  setWorkerCount: (workerCount: number) => void;
}

const initialSnapshot = analyticsWorkerPool.getSnapshot();

export const useBackgroundTaskStore = create<BackgroundTaskStore>((set) => ({
  ...initialSnapshot,
  panelOpen: false,
  panelHostId: null,
  openPanel: (hostId) => set({ panelOpen: true, panelHostId: hostId ?? null }),
  closePanel: () => set({ panelOpen: false, panelHostId: null }),
  togglePanel: (hostId) =>
    set((state) => {
      if (state.panelOpen && (hostId == null || state.panelHostId === hostId)) {
        return { panelOpen: false, panelHostId: null };
      }
      return { panelOpen: true, panelHostId: hostId ?? null };
    }),
  claimPanelHost: (hostId) =>
    set((state) => {
      if (!state.panelOpen || state.panelHostId) {
        return state;
      }
      return { panelHostId: hostId };
    }),
  clearFinished: () => analyticsWorkerPool.clearFinished(),
  cancelJob: (jobId) => analyticsWorkerPool.cancelJob(jobId),
  retryJob: (jobId) => {
    const handle = analyticsWorkerPool.retryJob(jobId);
    if (!handle) {
      return null;
    }
    void handle.promise.catch(() => undefined);
    return handle.id;
  },
  setWorkerCount: (workerCount) => analyticsWorkerPool.setWorkerCount(workerCount),
}));

analyticsWorkerPool.subscribe((snapshot) => {
  useBackgroundTaskStore.setState(snapshot);
});
