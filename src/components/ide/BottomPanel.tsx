/**
 * BottomPanel — stable bottom panel host for Synapse IDE.
 *
 * Hosts: Terminal · Problems · Tasks · Output · Plan History
 *
 * Contract (Prompt 14):
 * - Panel registry is BOTTOM_PANEL_TABS (exported for external consumers).
 * - Panel state (activeTab, height, collapsed) persists via appStore.
 * - Keyboard: Tab reaches the active tab button; ArrowLeft/ArrowRight cycles tabs.
 * - Only the active tab button has tabIndex=0; others are -1 (ARIA tablist pattern).
 * - Tasks panel is connected to tasksBridge.useTaskStates.
 * - Output and Plan History have truthful empty states until producers are wired.
 */

import React, { type KeyboardEvent, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Terminal } from '../terminal/components/Terminal';
import { SHELL_CONFIGS, type ShellType } from '../terminal/types/shellTypes';
import { ProblemsPane } from '../editor/ProblemsPane';
import { getTaskRecord, type TaskKind, useTaskStates } from '../../services/tasksBridge';
import type { IdeBottomPanelTab } from '@/types/state';
import type { Diagnostic } from '@/stores/problemsStore';
import { PlanHistoryPanel } from './PlanHistoryPanel';

// ---------------------------------------------------------------------------
// Panel registry — stable tab model
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const BOTTOM_PANEL_TABS: Array<{ id: IdeBottomPanelTab; label: string }> = [
  { id: 'terminal',    label: 'Terminal'     },
  { id: 'problems',   label: 'Problems'     },
  { id: 'tasks',      label: 'Tasks'        },
  { id: 'output',     label: 'Output'       },
  { id: 'planHistory', label: 'Plan History' },
];

// ---------------------------------------------------------------------------
// Tasks sub-panel
// ---------------------------------------------------------------------------

const ALL_TASK_KINDS: TaskKind[] = ['run', 'build', 'typecheck', 'lint', 'test'];

const TASK_LABEL: Record<TaskKind, string> = {
  run:       'Dev Server',
  build:     'Build',
  typecheck: 'Type Check',
  lint:      'Lint',
  test:      'Tests',
};

const STATE_INDICATOR: Record<string, string> = {
  idle:      '–',
  queued:    '⏳',
  running:   '▶',
  success:   '✓',
  error:     '✕',
  cancelled: '⊘',
};

const TasksPanel: React.FC = () => {
  const states = useTaskStates();
  return (
    <div className="synapse-ide-bottom-tasks">
      <table className="synapse-ide-bottom-tasks__table" aria-label="Task states">
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">State</th>
            <th scope="col">Duration</th>
            <th scope="col">Exit</th>
          </tr>
        </thead>
        <tbody>
          {ALL_TASK_KINDS.map(kind => {
            const rec = getTaskRecord(kind);
            const state = states[kind];
            return (
              <tr key={kind} data-state={state}>
                <td>{TASK_LABEL[kind]}</td>
                <td>
                  <span className={`synapse-ide-bottom-tasks__state synapse-ide-bottom-tasks__state--${state}`}>
                    {STATE_INDICATOR[state] ?? '–'} {state}
                  </span>
                </td>
                <td>{rec.durationMs != null ? `${rec.durationMs}ms` : '–'}</td>
                <td>{rec.exitCode != null ? String(rec.exitCode) : '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="synapse-ide-bottom-tasks__note">
        Use the terminal or command palette (Type&nbsp;Check, Lint, Run Tests) to trigger tasks.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty-state sub-panels
// ---------------------------------------------------------------------------

const OutputPanel: React.FC = () => (
  <div className="synapse-ide-shell__bottom-placeholder" role="status">
    <strong>Output</strong>
    <span>No output producer is connected. Task runners and build tools will stream here.</span>
  </div>
);

// ---------------------------------------------------------------------------
// BottomPanel
// ---------------------------------------------------------------------------

export interface BottomPanelProps {
  /** Currently active panel tab id. */
  activeTab: IdeBottomPanelTab;
  /** Computed panel height in px (already clamped). */
  height: number;
  /** Badge count for the Problems tab. */
  problemBadgeCount: number;
  /** All IDE shell CSS custom properties for position/sizing. */
  shellVars: React.CSSProperties;
  onTabChange: (tab: IdeBottomPanelTab) => void;
  /** Called when the close button is clicked — should collapse the panel. */
  onClose: () => void;
  /** Called during resize drag. Receives new desired height in px. */
  onHeightChange: (height: number) => void;
  /** Called when a diagnostic entry is clicked in the Problems pane. */
  onOpenDiagnostic: (diag: Diagnostic) => void;
  /** Passed as `onClose` to Terminal (terminal header's own close button). */
  onTerminalClose: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  height,
  problemBadgeCount,
  shellVars,
  onTabChange,
  onClose,
  onHeightChange,
  onOpenDiagnostic,
  onTerminalClose,
}) => {
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [terminalShell, setTerminalShell] = useState<ShellType>('powershell');
  const [terminalKey, setTerminalKey] = useState(0);

  // ARIA tablist keyboard pattern: ArrowLeft / ArrowRight cycle focus + activation.
  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % BOTTOM_PANEL_TABS.length;
    if (e.key === 'ArrowLeft')  next = (idx - 1 + BOTTOM_PANEL_TABS.length) % BOTTOM_PANEL_TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = BOTTOM_PANEL_TABS.length - 1;
    if (next !== null) {
      e.preventDefault();
      onTabChange(BOTTOM_PANEL_TABS[next].id);
      tabButtonRefs.current[next]?.focus();
    }
  };

  return (
    <div
      className="synapse-ide-shell__bottom-panel"
      data-region="bottom-panel"
      data-active-tab={activeTab}
      style={shellVars}
    >
      <section
        className="synapse-ide-shell__bottom-panel-frame"
        aria-label="Synapse IDE bottom panel"
      >
        {/* ── resize drag handle ── */}
        <div
          className="synapse-ide-shell__bottom-resizer"
          aria-hidden="true"
          onMouseDown={event => {
            event.preventDefault();
            const startY = event.clientY;
            const startHeight = height;
            const onMove = (moveEvent: MouseEvent) => {
              const delta = startY - moveEvent.clientY;
              const maxHeight = Math.min(window.innerHeight * 0.9, 600);
              onHeightChange(Math.max(84, Math.min(maxHeight, startHeight + delta)));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        />

        {/* ── tab header ── */}
        <header className="synapse-ide-shell__bottom-tabs" aria-label="Bottom panel tabs">
          <div className="synapse-ide-shell__bottom-tab-list" role="tablist">
            {BOTTOM_PANEL_TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const badge =
                tab.id === 'problems' && problemBadgeCount > 0
                  ? String(Math.min(problemBadgeCount, 99))
                  : '';
              return (
                <button
                  key={tab.id}
                  ref={el => { tabButtonRefs.current[idx] = el; }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`bottom-panel-${tab.id}`}
                  id={`bottom-panel-tab-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className="synapse-ide-shell__bottom-tab"
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => onTabChange(tab.id)}
                  onKeyDown={e => handleTabKeyDown(e, idx)}
                >
                  {tab.label}
                  {badge ? <span aria-label={`${badge} issues`}>{badge}</span> : null}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            {activeTab === 'terminal' ? (
              <>
                <select
                  value={terminalShell}
                  onChange={e => setTerminalShell(e.target.value as ShellType)}
                  aria-label="Terminal shell"
                  style={{
                    height: 22,
                    background: 'var(--syn-surface-input)',
                    border: '1px solid var(--syn-border-subtle)',
                    borderRadius: 2,
                    color: 'var(--syn-text-default)',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    padding: '0 22px 0 8px',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    outline: 'none',
                    backgroundImage:
                      'linear-gradient(45deg, transparent 50%, var(--syn-text-muted) 50%), linear-gradient(135deg, var(--syn-text-muted) 50%, transparent 50%)',
                    backgroundPosition:
                      'calc(100% - 12px) 50%, calc(100% - 7px) 50%',
                    backgroundSize: '5px 5px, 5px 5px',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {Object.entries(SHELL_CONFIGS).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="synapse-ide-shell__bottom-close"
                  aria-label="New terminal session"
                  title="New session (reconnect)"
                  onClick={() => setTerminalKey(k => k + 1)}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="synapse-ide-shell__bottom-close"
              aria-label="Close bottom panel"
              title="Close bottom panel"
              onClick={onClose}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ── tab content ── */}
        <div className="synapse-ide-shell__bottom-content">
          {activeTab === 'terminal' ? (
            <div
              id="bottom-panel-terminal"
              role="tabpanel"
              aria-labelledby="bottom-panel-tab-terminal"
              style={{ position: 'absolute', inset: 0 }}
            >
              <Terminal
                key={`bottom-term-${terminalShell}-${terminalKey}`}
                className="synapse-ide-shell__terminal-pane"
                shell={terminalShell}
                headerless
                height={Math.max(80, height - 36)}
                onClose={onTerminalClose}
                aiAssistantWidth={0}
                fileExplorerWidth={0}
                onHeightChange={h => {
                  if (h < 20) return;
                  const maxH = Math.min(window.innerHeight * 0.9, 600);
                  onHeightChange(Math.min(maxH, h + 36));
                }}
              />
            </div>
          ) : activeTab === 'problems' ? (
            <div
              id="bottom-panel-problems"
              role="tabpanel"
              aria-labelledby="bottom-panel-tab-problems"
              style={{ position: 'absolute', inset: 0, overflow: 'auto' }}
            >
              <ProblemsPane onOpenDiagnostic={onOpenDiagnostic} />
            </div>
          ) : activeTab === 'tasks' ? (
            <div
              id="bottom-panel-tasks"
              role="tabpanel"
              aria-labelledby="bottom-panel-tab-tasks"
              style={{ position: 'absolute', inset: 0, overflow: 'auto' }}
            >
              <TasksPanel />
            </div>
          ) : activeTab === 'output' ? (
            <div
              id="bottom-panel-output"
              role="tabpanel"
              aria-labelledby="bottom-panel-tab-output"
              style={{ position: 'absolute', inset: 0 }}
            >
              <OutputPanel />
            </div>
          ) : (
            <div
              id="bottom-panel-planHistory"
              role="tabpanel"
              aria-labelledby="bottom-panel-tab-planHistory"
              style={{ position: 'absolute', inset: 0 }}
            >
              <PlanHistoryPanel />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
