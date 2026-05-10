/**
 * useApplyHistoryStore — durable apply-plan history with revert support.
 *
 * Design constraints (Prompt 17):
 * - Bounded to MAX_HISTORY=50 records (oldest dropped first).
 * - Revert is only offered for `replace` items that have a `revertSnapshot`.
 * - `create` / `insert` items are not auto-revertable (would require file deletion).
 * - Conflicts are recorded, not hidden.
 * - Status lifecycle: proposed → applied | partially_applied | failed → reverted (optional).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApplyAction, ApplyStatus } from '@/utils/ai/apply/types';

// ── Max history size ─────────────────────────────────────────────────────────
const MAX_HISTORY = 50;

// ── Record types ─────────────────────────────────────────────────────────────

export interface ApplyHistoryFile {
  path: string;
  action: ApplyAction;
  /** Whether the user accepted (true) or rejected (false / undefined = not explicitly set). */
  accepted: boolean;
  /** Original content before replace — present = revertable. Capped at 512 KB. */
  revertSnapshot?: string;
}

export interface ApplyHistoryConflict {
  path: string;
  reason: string;
}

export interface ApplyHistoryRecord {
  /** Matches the ApplyPlan.id that produced this record. */
  id: string;
  /** ISO timestamp when the plan was first built. */
  createdAt: string;
  /** ISO timestamp when the execution finished. */
  appliedAt: string;
  /** First 200 chars of the source prompt, for human readability. */
  sourcePrompt?: string;
  /** Execution outcome. */
  status: ApplyStatus;
  /** Per-file metadata. */
  files: ApplyHistoryFile[];
  /** Quantitative result. */
  result: { applied: number; rejected: number; failed: number };
  /** All conflicts recorded during apply, including pre-apply detection. */
  conflicts: ApplyHistoryConflict[];
  /** ISO timestamp set when the record is reverted. */
  revertedAt?: string;
}

// ── Store interface ───────────────────────────────────────────────────────────

export interface ApplyHistoryState {
  records: ApplyHistoryRecord[];
  /** Push a new record (prepends; oldest beyond MAX_HISTORY are dropped). */
  pushRecord: (record: ApplyHistoryRecord) => void;
  /** Mark a record as reverted and set revertedAt. */
  markReverted: (id: string) => void;
  /** Remove a single record by id. */
  removeRecord: (id: string) => void;
  /** Remove all records. */
  clearHistory: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useApplyHistoryStore = create<ApplyHistoryState>()(
  persist(
    (set) => ({
      records: [],

      pushRecord: (record) =>
        set((s) => {
          const next = [record, ...s.records];
          return { records: next.length > MAX_HISTORY ? next.slice(0, MAX_HISTORY) : next };
        }),

      markReverted: (id) =>
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, status: 'reverted', revertedAt: new Date().toISOString() } : r
          ),
        })),

      removeRecord: (id) =>
        set((s) => ({ records: s.records.filter((r) => r.id !== id) })),

      clearHistory: () => set({ records: [] }),
    }),
    {
      name: 'synapse.apply.history.v1',
      // Snapshot content can be large — keep only latest 20 when rehydrating to
      // avoid bloating localStorage on machines with many sessions.
      partialize: (s) => ({ records: s.records.slice(0, 20) }),
    }
  )
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const REVERT_SNAPSHOT_LIMIT = 512 * 1024; // 512 KB per file

/**
 * Clamp a snapshot string to avoid flooding localStorage with huge files.
 * Returns undefined if the content exceeds the limit (revert will be unavailable).
 */
export function clampSnapshot(content: string | null | undefined): string | undefined {
  if (!content) return undefined;
  if (content.length > REVERT_SNAPSHOT_LIMIT) return undefined;
  return content;
}
