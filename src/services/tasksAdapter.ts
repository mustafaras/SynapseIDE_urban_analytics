


import { setTasksHandler, setTaskState, type TaskKind } from './tasksBridge';
import { terminalError, terminalInfo } from '@/components/terminal/terminalLogBus';

const TASK_KINDS = new Set<TaskKind>(['run', 'build', 'typecheck', 'lint', 'test']);
const TASK_STATES = new Set(['idle', 'queued', 'running', 'success', 'error', 'cancelled']);

declare global {
  interface Window {
    acquireVsCodeApi?: () => { postMessage: (msg: unknown) => void };
    __runTask?: (kind: TaskKind) => void;
  }
}

(() => {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.acquireVsCodeApi === 'function') {
        const vscode = window.acquireVsCodeApi!();
        setTasksHandler(kind => {
          vscode.postMessage({ type: 'synapse:task', kind });
          terminalInfo(`Requested VS Code task: ${kind}`, 'build');
        });

        window.addEventListener('message', (event: MessageEvent) => {
          const data = event.data;
          if (!data || typeof data !== 'object') return;
          if (data.type === 'synapse:task:log' && typeof data.message === 'string') {
            terminalInfo(data.message, data.channel || 'build');
          }
          if (data.type === 'synapse:task:error' && typeof data.message === 'string') {
            terminalError(data.message, data.channel || 'build');
          }
          if (data.type === 'synapse:task:status') {
            const kind = TASK_KINDS.has(data.kind) ? (data.kind as TaskKind) : null;
            const state = TASK_STATES.has(data.state) ? data.state : null;
            if (kind && state) setTaskState(kind, state);
          }
        });
        return;
      }
      if (typeof window.__runTask === 'function') {
        setTasksHandler(kind => {
          try {
            window.__runTask!(kind);
          } catch {}
        });

      }
    }
  } catch {

  }

})();

export {};
