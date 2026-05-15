/**
 * PlanHistoryPanel — premium apply-plan history with revert capability.
 *
 * Features (Prompt 17):
 * - Newest-first timeline of all recorded apply plans (bounded at 50).
 * - Status badge per record: applied / partially applied / failed / reverted.
 * - Conflict badge when any conflict was recorded.
 * - Expandable file list showing per-file action + revert availability.
 * - Revert button: only enabled for `applied`/`partially_applied` records
 *   that have at least one `revertSnapshot` (replace actions only).
 * - Revert is implemented through editorStore.updateTabContent + addToHistory (undo support).
 * - Truthful empty state.
 * - Clear history button.
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import {
  useApplyHistoryStore,
  type ApplyHistoryRecord,
} from '@/stores/useApplyHistoryStore';
import { useEditorStore } from '@/stores/editorStore';
import { showToast } from '@/ui/toast/api';

// ── Styled components ─────────────────────────────────────────────────────────

const Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  color: var(--syn-text-primary, #d4d4d4);
  font-size: 12px;
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid var(--syn-border-subtle, rgba(255,255,255,0.06));
  gap: 8px;
  flex-shrink: 0;
`;

const ToolbarTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--syn-text-muted, rgba(255,255,255,0.45));
  text-transform: uppercase;
  flex: 1;
`;

const ToolbarBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--syn-text-muted, rgba(255,255,255,0.4));
  font-size: 11px;
  cursor: pointer;
  transition: background 80ms, color 80ms;
  &:hover { color: var(--syn-text-primary, #d4d4d4); }
  &:focus-visible { outline: 1px solid color-mix(in srgb, var(--syn-border-focus, #60a5fa) 55%, transparent); }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  min-height: 80px;
  color: var(--syn-text-muted, rgba(255,255,255,0.25));
  font-size: 12px;
  padding: 24px;
  text-align: center;
  strong { color: var(--syn-text-secondary, rgba(255,255,255,0.35)); display: block; margin-bottom: 2px; }
`;

const RecordRow = styled.div<{ $status: string }>`
  border-bottom: 1px solid var(--syn-border-subtle, rgba(255,255,255,0.04));
  &:last-child { border-bottom: none; }
`;

const RecordHeader = styled.button<{ $expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
  transition: background 80ms;
  &:hover { background: color-mix(in srgb, var(--syn-interaction-hover, rgba(255,255,255,0.04)) 70%, transparent); }
  &:focus-visible { outline: 1px solid color-mix(in srgb, var(--syn-border-focus, #60a5fa) 55%, transparent); outline-offset: -1px; }
`;

const Chevron = styled.span`
  margin-top: 1px;
  flex-shrink: 0;
  color: var(--syn-text-muted, rgba(255,255,255,0.25));
`;

const RecordMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const RecordTop = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: ${({ $status }) => {
    if ($status === 'applied') return 'rgba(63,185,80,0.15)';
    if ($status === 'partially_applied') return 'rgba(245,158,11,0.15)';
    if ($status === 'failed') return 'rgba(248,81,73,0.15)';
    if ($status === 'reverted') return 'rgba(100,120,180,0.15)';
    return 'rgba(255,255,255,0.08)';
  }};
  color: ${({ $status }) => {
    if ($status === 'applied') return '#3fb950';
    if ($status === 'partially_applied') return '#f59e0b';
    if ($status === 'failed') return '#f85149';
    if ($status === 'reverted') return '#79a0e8';
    return 'var(--syn-text-muted, rgba(255,255,255,0.4))';
  }};
`;

const ConflictBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(248,81,73,0.12);
  color: #f85149;
`;

const SourcePrompt = styled.div`
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--syn-text-secondary, rgba(255,255,255,0.55));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RecordTimestamp = styled.div`
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--syn-text-muted, rgba(255,255,255,0.22));
`;

const FileStat = styled.span`
  font-size: 10.5px;
  color: var(--syn-text-muted, rgba(255,255,255,0.3));
`;

const RevertBtn = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid color-mix(in srgb, var(--syn-status-info, #60a5fa) 35%, transparent);
  border-radius: 4px;
  background: transparent;
  color: var(--syn-status-info, #79a0e8);
  font-size: 10.5px;
  cursor: pointer;
  margin-top: 2px;
  transition: background 80ms, color 80ms;
  &:hover { background: color-mix(in srgb, var(--syn-status-info, #60a5fa) 10%, transparent); color: var(--syn-text-primary, #d4d4d4); border-color: color-mix(in srgb, var(--syn-status-info, #60a5fa) 55%, transparent); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &:focus-visible { outline: 1px solid color-mix(in srgb, var(--syn-border-focus, #60a5fa) 55%, transparent); }
`;

const FileList = styled.div`
  padding: 6px 12px 10px 32px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const FileEntry = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--syn-text-secondary, rgba(255,255,255,0.55));
  line-height: 1.4;
`;

const ActionTag = styled.span<{ $action: string }>`
  padding: 0 5px;
  border-radius: 3px;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${({ $action }) =>
    $action === 'create' ? 'color-mix(in srgb, var(--syn-status-valid, #3fb950) 12%, transparent)' :
    $action === 'replace' ? 'color-mix(in srgb, var(--syn-status-info, #60a5fa) 12%, transparent)' :
    'color-mix(in srgb, var(--syn-text-muted, #8b949e) 12%, transparent)'};
  color: ${({ $action }) =>
    $action === 'create' ? 'var(--syn-status-valid, #3fb950)' :
    $action === 'replace' ? 'var(--syn-status-info, #79a0e8)' :
    'var(--syn-text-muted, rgba(255,255,255,0.4))'};
`;

const RevertDot = styled.span<{ $available: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $available }) => $available ? 'var(--syn-status-info, #79a0e8)' : 'color-mix(in srgb, var(--syn-text-muted, #8b949e) 22%, transparent)'};
  title: ${({ $available }) => $available ? 'Revertable' : 'No snapshot'};
`;

const ConflictList = styled.div`
  padding: 4px 12px 8px 32px;
`;

const ConflictEntry = styled.div`
  font-size: 11px;
  color: var(--syn-status-error, #f85149);
  padding: 2px 0;
  display: flex;
  gap: 6px;
  align-items: flex-start;
  &::before { content: '!'; flex-shrink: 0; font-weight: 700; color: var(--syn-status-error, #f85149); }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 60_000) return 'just now';
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function statusLabel(status: string): string {
  if (status === 'applied') return 'Applied';
  if (status === 'partially_applied') return 'Partial';
  if (status === 'failed') return 'Failed';
  if (status === 'reverted') return 'Reverted';
  return status;
}

function canRevert(record: ApplyHistoryRecord): boolean {
  if (record.status === 'reverted') return false;
  if (record.status === 'failed') return false;
  return record.files.some(f => f.action === 'replace' && f.accepted && !!f.revertSnapshot);
}

// ── RecordItem ────────────────────────────────────────────────────────────────

const RecordItem: React.FC<{ record: ApplyHistoryRecord }> = ({ record }) => {
  const [expanded, setExpanded] = useState(false);
  const markReverted = useApplyHistoryStore(s => s.markReverted);
  const removeRecord = useApplyHistoryStore(s => s.removeRecord);

  const revertable = canRevert(record);
  const revertableCount = record.files.filter(
    f => f.action === 'replace' && f.accepted && !!f.revertSnapshot
  ).length;

  const doRevert = useCallback(() => {
    if (!revertable) return;
    const editorState = useEditorStore.getState();
    let count = 0;
    for (const file of record.files) {
      if (!file.revertSnapshot || file.action !== 'replace' || !file.accepted) continue;
      const tab = editorState.tabs.find(t => t.path === file.path);
      if (!tab) continue;
      // Push current content to undo history before overwriting
      editorState.addToHistory(
        tab.id,
        tab.content || '',
        tab.cursorPosition || { line: 1, column: 1 }
      );
      editorState.updateTabContent(tab.id, file.revertSnapshot);
      count++;
    }
    if (count > 0) {
      markReverted(record.id);
      showToast({ kind: 'success', message: `Reverted ${count} file${count !== 1 ? 's' : ''} (undo available)` });
    } else {
      showToast({ kind: 'warning', message: 'No open tabs matched revert targets' });
    }
  }, [record, revertable, markReverted]);

  return (
    <RecordRow $status={record.status}>
      <RecordHeader
        type="button"
        $expanded={expanded}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <Chevron aria-hidden>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </Chevron>
        <RecordMeta>
          <RecordTop>
            <StatusBadge $status={record.status}>{statusLabel(record.status)}</StatusBadge>
            {record.conflicts.length > 0 && (
              <ConflictBadge title={`${record.conflicts.length} conflict(s)`}>
                {record.conflicts.length} conflict{record.conflicts.length !== 1 ? 's' : ''}
              </ConflictBadge>
            )}
            <FileStat>
              {record.result.applied} applied
              {record.result.rejected > 0 && `, ${record.result.rejected} rejected`}
              {record.result.failed > 0 && `, ${record.result.failed} failed`}
            </FileStat>
          </RecordTop>
          {record.sourcePrompt && (
            <SourcePrompt title={record.sourcePrompt}>
              {record.sourcePrompt}
            </SourcePrompt>
          )}
          <RecordTimestamp>
            {formatTime(record.appliedAt)}
            {record.revertedAt && ` · reverted ${formatTime(record.revertedAt)}`}
          </RecordTimestamp>
        </RecordMeta>

        {revertable && (
          <RevertBtn
            onClick={(e) => { e.stopPropagation(); doRevert(); }}
            title={`Revert ${revertableCount} file${revertableCount !== 1 ? 's' : ''} (restore original content)`}
            aria-label="Revert this apply plan"
          >
            <RotateCcw size={10} />
            Revert
          </RevertBtn>
        )}
        <ToolbarBtn
          onClick={(e) => { e.stopPropagation(); removeRecord(record.id); }}
          title="Remove from history"
          aria-label="Remove record"
          style={{ padding: '3px 5px', marginTop: '2px' }}
        >
          <Trash2 size={10} />
        </ToolbarBtn>
      </RecordHeader>

      {expanded && (
        <>
          {/* File list */}
          <FileList>
            {record.files.map((f, i) => (
              <FileEntry key={`${f.path}-${i}`}>
                <RevertDot
                  $available={f.action === 'replace' && f.accepted && !!f.revertSnapshot}
                  title={f.action === 'replace' && f.accepted && f.revertSnapshot ? 'Has revert snapshot' : 'No revert available'}
                  aria-hidden
                />
                <ActionTag $action={f.action}>{f.action}</ActionTag>
                <span
                  title={f.path}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: f.accepted ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {f.path}
                </span>
                {!f.accepted && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>rejected</span>
                )}
              </FileEntry>
            ))}
          </FileList>

          {/* Conflict details */}
          {record.conflicts.length > 0 && (
            <ConflictList>
              {record.conflicts.map((c, i) => (
                <ConflictEntry key={`${c.path}-${i}`}>
                  <span>
                    <strong style={{ color: 'rgba(248,81,73,0.8)' }}>{c.path}</strong>
                    {' — '}{c.reason}
                  </span>
                </ConflictEntry>
              ))}
            </ConflictList>
          )}
        </>
      )}
    </RecordRow>
  );
};

// ── PlanHistoryPanel ──────────────────────────────────────────────────────────

export const PlanHistoryPanel: React.FC = () => {
  const records = useApplyHistoryStore(s => s.records);
  const clearHistory = useApplyHistoryStore(s => s.clearHistory);

  return (
    <Root>
      <Toolbar>
        <ToolbarTitle>Apply History</ToolbarTitle>
        {records.length > 0 && (
          <ToolbarBtn
            onClick={clearHistory}
            title="Clear all history records"
            aria-label="Clear all history"
          >
            <Trash2 size={10} />
            Clear all
          </ToolbarBtn>
        )}
      </Toolbar>

      <List role="list" aria-label="Apply plan history">
        {records.length === 0 ? (
          <EmptyState role="status">
            <strong>No history yet</strong>
            AI-generated edits applied via Apply Plan will appear here.
            Revert is available for replaced files with snapshots.
          </EmptyState>
        ) : (
          records.map(record => (
            <RecordItem key={record.id} record={record} />
          ))
        )}
      </List>
    </Root>
  );
};
