import React, { useState } from 'react';
import styled from 'styled-components';
import { AlertCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import type { ApplyPlan } from '@/utils/ai/apply/types';

export interface ApplyPlanPreviewProps {
  plan: ApplyPlan;
  onApply: (plan: ApplyPlan) => void;
  onCancel: () => void;
  isApplying?: boolean;
}

const ApplyPlanPreview: React.FC<ApplyPlanPreviewProps> = ({
  plan,
  onApply,
  onCancel,
  isApplying = false,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Map<string, boolean>>(
    new Map(plan.items.map(i => [i.path, i.accepted !== false]))
  );
  const [confirmDestructive, setConfirmDestructive] = useState(false);

  const toggleExpand = (path: string) => {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpanded(next);
  };

  const toggleAccept = (path: string) => {
    const next = new Map(accepted);
    next.set(path, !next.get(path));
    setAccepted(next);
  };

  const handleApply = () => {
    // Safety check: conflicts require explicit confirmation
    if (plan.conflicts.length > 0 && !confirmDestructive) {
      setConfirmDestructive(true);
      return;
    }

    const updated = { ...plan };
    updated.items = updated.items.map(item => ({
      ...item,
      accepted: accepted.get(item.path) !== false,
    }));
    onApply(updated);
  };

  const totalItems = plan.items.length;
  const acceptedCount = Array.from(accepted.values()).filter(Boolean).length;
  const conflictCount = plan.conflicts.length;
  const riskLevel = plan.riskAnalysis.riskLevel;
  const canApply = acceptedCount > 0 && (conflictCount === 0 || confirmDestructive);

  return (
    <PreviewRoot role="region" aria-label="Apply plan preview">
      <HeaderRow>
        <TitleGroup>
          <Title>Apply Plan Preview</Title>
          <Subtitle>
            {acceptedCount}/{totalItems} files • {conflictCount > 0 && `${conflictCount} conflicts`}
          </Subtitle>
        </TitleGroup>
        <HeaderBtns>
          <CancelBtn onClick={onCancel} disabled={isApplying} aria-label="Cancel apply plan">
            Cancel
          </CancelBtn>
          <ApplyBtn 
            onClick={handleApply} 
            disabled={isApplying || !canApply}
            title={!canApply ? (conflictCount > 0 && !confirmDestructive ? 'Confirm conflicts to proceed' : 'No files selected') : undefined}
            aria-label="Apply accepted files"
          >
            {isApplying ? 'Applying…' : `Apply (${acceptedCount})`}
          </ApplyBtn>
        </HeaderBtns>
      </HeaderRow>

      {riskLevel === 'high' ? (
        <RiskBanner $level="high">
          <AlertTriangle size={14} />
          High-risk operation: Review changes carefully before applying
        </RiskBanner>
      ) : null}

      {riskLevel === 'medium' ? (
        <RiskBanner $level="medium">
          <AlertCircle size={14} />
          Medium-risk operation: Contains multiple or destructive changes
        </RiskBanner>
      ) : null}

      {conflictCount > 0 ? (
        <ConflictSection>
          <ConflictLabel>
            <AlertCircle size={14} />
            {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''}
          </ConflictLabel>
          {plan.conflicts.map((conflict, idx) => (
            <ConflictItem key={`${conflict.path}-${idx}`}>
              <ConflictPath>{conflict.path}</ConflictPath>
              <ConflictMsg>{conflict.message}</ConflictMsg>
            </ConflictItem>
          ))}
          {!confirmDestructive ? (
            <ConfirmPrompt>
              <ConfirmCheckbox
                type="checkbox"
                checked={confirmDestructive}
                onChange={() => setConfirmDestructive(true)}
                id="confirm-destructive"
              />
              <label htmlFor="confirm-destructive">
                I understand and accept the conflicts shown above
              </label>
            </ConfirmPrompt>
          ) : null}
        </ConflictSection>
      ) : null}

      <FileList>
        {plan.items.map(item => {
          const isExp = expanded.has(item.path);
          const isAccepted = accepted.get(item.path) !== false;
          const hasConflict = plan.conflicts.some(c => c.path === item.path);
          const isDiff = !!(item.hunks && item.hunks.length > 0);
          const isDestructive = item.action === 'replace';

          return (
            <FileCard key={item.path} $hasConflict={hasConflict} $isDiff={isDiff} $isDestructive={isDestructive}>
              <FileHeader>
                <FileInfo>
                  <AcceptCheckbox
                    type="checkbox"
                    checked={isAccepted}
                    onChange={() => toggleAccept(item.path)}
                    disabled={isApplying}
                    aria-label={`Accept ${item.path}`}
                  />
                  <FilePathSpan $action={item.action}>{item.path}</FilePathSpan>
                  <ActionBadge $action={item.action}>{item.action}</ActionBadge>
                  {isDestructive ? <DestructiveWarning title="Replace operation">⚠️</DestructiveWarning> : null}
                </FileInfo>
                {isDiff ? (
                  <ExpandBtn
                    onClick={() => toggleExpand(item.path)}
                    aria-expanded={isExp}
                    aria-label={`Toggle diff for ${item.path}`}
                  >
                    <ChevronDown size={14} style={{ transform: isExp ? 'rotate(180deg)' : '' }} />
                  </ExpandBtn>
                ) : null}
              </FileHeader>

              {isExp && isDiff && item.hunks ? (
                <DiffSection>
                  {item.hunks.map((hunk, hIdx) => (
                    <DiffHunk key={`${item.path}-h${hIdx}`}>
                      <DiffBefore>
                        {hunk.before.split('\n').slice(0, 5).map((line, i) => (
                          <DiffLine key={i}>
                            <span>−</span> {line || '(empty)'}
                          </DiffLine>
                        ))}
                        {hunk.before.split('\n').length > 5 && (
                          <DiffLine>… ({hunk.before.split('\n').length - 5} more lines)</DiffLine>
                        )}
                      </DiffBefore>
                      <DiffAfter>
                        {hunk.after.split('\n').slice(0, 5).map((line, i) => (
                          <DiffLine key={i}>
                            <span>+</span> {line || '(empty)'}
                          </DiffLine>
                        ))}
                        {hunk.after.split('\n').length > 5 && (
                          <DiffLine>… ({hunk.after.split('\n').length - 5} more lines)</DiffLine>
                        )}
                      </DiffAfter>
                    </DiffHunk>
                  ))}
                </DiffSection>
              ) : null}
            </FileCard>
          );
        })}
      </FileList>
    </PreviewRoot>
  );
};

const PreviewRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 5px;
  padding: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text, #E5E5E5);
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.12);
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: #F59E0B;
`;

const Subtitle = styled.span`
  font-size: 11px;
  opacity: 0.6;
`;

const HeaderBtns = styled.div`
  display: flex;
  gap: 6px;
`;

const Button = styled.button`
  padding: 4px 12px;
  border-radius: 3px;
  border: 1px solid;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  font-weight: 500;
  transition: all 120ms;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled(Button)`
  border-color: rgba(255, 255, 255, 0.1);
  background: transparent;
  color: var(--color-text, #E5E5E5);

  &:not(:disabled):hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ApplyBtn = styled(Button)`
  border-color: #F59E0B;
  background: rgba(245, 158, 11, 0.12);
  color: #F59E0B;

  &:not(:disabled):hover {
    background: rgba(245, 158, 11, 0.2);
  }
`;

const RiskBanner = styled.div<{ $level: 'high' | 'medium' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin: 4px 0;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => props.$level === 'high' 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(245, 158, 11, 0.1)'};
  border: 1px solid ${props => props.$level === 'high' 
    ? 'rgba(239, 68, 68, 0.2)' 
    : 'rgba(245, 158, 11, 0.2)'};
  color: ${props => props.$level === 'high' ? '#EF4444' : '#F59E0B'};
`;

const ConflictSection = styled.div`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 3px;
  padding: 6px;
  margin: 4px 0;
`;

const ConflictLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #EF4444;
  margin-bottom: 4px;
`;

const ConflictItem = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-left: 2px solid #EF4444;
  padding: 4px 6px;
  margin: 2px 0;
  font-size: 10px;
`;

const ConflictPath = styled.div`
  font-weight: 500;
  color: #FCA5A5;
  word-break: break-all;
`;

const ConflictMsg = styled.div`
  font-size: 9px;
  opacity: 0.7;
  margin-top: 1px;
  color: #FEC2C2;
`;

const ConfirmPrompt = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  margin-top: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  font-size: 10px;

  label {
    cursor: pointer;
    flex: 1;
    margin: 0;
  }
`;

const ConfirmCheckbox = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #F59E0B;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(245, 158, 11, 0.2);
    border-radius: 3px;
    &:hover {
      background: rgba(245, 158, 11, 0.4);
    }
  }
`;

const FileCard = styled.div<{ $hasConflict?: boolean; $isDiff?: boolean; $isDestructive?: boolean }>`
  background: ${props => (props.$hasConflict ? 'rgba(239, 68, 68, 0.06)' : 'rgba(0, 0, 0, 0.2)')};
  border: 1px solid ${props => (props.$hasConflict ? 'rgba(239, 68, 68, 0.15)' : props.$isDestructive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')};
  border-radius: 3px;
  overflow: hidden;
`;

const FileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 6px;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const AcceptCheckbox = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #F59E0B;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilePathSpan = styled.span<{ $action: string }>`
  font-weight: ${props => (props.$action === 'create' ? 500 : 400)};
  color: ${props =>
    props.$action === 'create'
      ? '#4ADE80'
      : props.$action === 'replace'
        ? '#F59E0B'
        : '#60A5FA'};
  word-break: break-all;
  flex: 1;
  min-width: 0;
`;

const ActionBadge = styled.span<{ $action: string }>`
  display: inline-block;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  background: ${props =>
    props.$action === 'create'
      ? 'rgba(74, 222, 128, 0.15)'
      : props.$action === 'replace'
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(96, 165, 250, 0.15)'};
  color: ${props =>
    props.$action === 'create'
      ? '#4ADE80'
      : props.$action === 'replace'
        ? '#F59E0B'
        : '#60A5FA'};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
`;

const DestructiveWarning = styled.span`
  font-size: 12px;
  color: #F59E0B;
`;

const ExpandBtn = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: rgba(245, 158, 11, 0.6);
  display: flex;
  align-items: center;
  transition: color 120ms;

  &:hover {
    color: #F59E0B;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DiffSection = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(245, 158, 11, 0.08);
  padding: 4px;
`;

const DiffHunk = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: 10px;
  font-family: var(--font-mono);
`;

const DiffBefore = styled.div`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 2px;
  padding: 3px;
`;

const DiffAfter = styled.div`
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.15);
  border-radius: 2px;
  padding: 3px;
`;

const DiffLine = styled.div`
  font-size: 9px;
  line-height: 1.3;
  overflow-x: auto;
  white-space: nowrap;

  span {
    display: inline-block;
    width: 12px;
    opacity: 0.6;
  }

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export default ApplyPlanPreview;
