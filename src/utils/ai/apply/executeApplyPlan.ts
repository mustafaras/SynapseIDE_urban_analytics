

import type { ApplyPlan } from './types';

export interface EditorApi {
  fileExists: (path: string) => boolean;
  readFile: (path: string) => string | null;
  createFile: (path: string, content: string, monacoLang: string) => void;
  replaceFile: (path: string, content: string, monacoLang: string) => void;
  insertIntoActive?: (content: string, monacoLang: string) => void;
  setActiveTab?: (path: string) => void;
  pushUndoSnapshot: (path: string, prevContent: string) => void;
}

export interface ExecuteOptions {
  preferInsertIntoActive?: boolean;
  focusEditorAfter?: boolean;
}

export interface ExecuteResult {
  applied: number;
  rejected: number;
  failed: number;
  conflicts: Array<{ path: string; reason: string }>;
}

/** Execute the apply plan with per-file acceptance and conflict detection. */
export function executeApplyPlan(
  plan: ApplyPlan,
  api: EditorApi,
  opts?: ExecuteOptions
): ExecuteResult {
  const result: ExecuteResult = { applied: 0, rejected: 0, failed: 0, conflicts: [] };
  const preferInsert = !!opts?.preferInsertIntoActive && plan.mode === 'beginner';

  for (const item of plan.items) {
    // Skip rejected files
    if (item.accepted === false) {
      result.rejected += 1;
      continue;
    }

    // Check for dirty file conflicts
    if (item.action === 'replace' && api.fileExists(item.path)) {
      const current = api.readFile(item.path);
      if (current && current !== item.originalContent && current.trim() !== '') {
        result.conflicts.push({
          path: item.path,
          reason: 'dirty_file_changed_since_preview',
        });
        result.rejected += 1;
        continue;
      }
    }

    try {
      if (preferInsert && api.insertIntoActive) {
        api.insertIntoActive(item.code, item.monaco);
        result.applied += 1;
        continue;
      }

      if (item.action === 'replace' && api.fileExists(item.path)) {
        const prev = api.readFile(item.path) ?? '';
        api.pushUndoSnapshot(item.path, prev);
        api.replaceFile(item.path, item.code, item.monaco);
        api.setActiveTab?.(item.path);
        result.applied += 1;
      } else if (item.action === 'create' || item.action === 'insert') {
        api.createFile(item.path, item.code, item.monaco);
        api.setActiveTab?.(item.path);
        result.applied += 1;
      }
    } catch (err) {
      result.failed += 1;
      result.conflicts.push({
        path: item.path,
        reason: `execution_error: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    }
  }

  // Update plan status
  if (result.failed === 0 && result.rejected === 0) {
    plan.status = 'applied';
  } else if (result.applied > 0) {
    plan.status = 'partially_applied';
  } else {
    plan.status = 'failed';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[DEV][apply-plan] executed', { plan: plan.id, result });
  }

  return result;
}
