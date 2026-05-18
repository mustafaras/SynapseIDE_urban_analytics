import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListOrdered,
  LoaderCircle,
  Rows3,
  X,
} from 'lucide-react';
import { useBackgroundTaskStore } from '@/stores/useBackgroundTaskStore';
import type {
  BackgroundTaskSnapshot,
  BackgroundTaskStatus,
} from '@/workers/pool';
import styles from './BackgroundTasksControl.module.css';

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) {
    return 'Pending';
  }
  const deltaMs = Math.max(0, Date.now() - timestamp);
  const totalSeconds = Math.floor(deltaMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s ago`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m ago`;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  return `${totalHours}h ago`;
}

function statusClassName(status: BackgroundTaskStatus): string {
  if (status === 'running') return `${styles.statusPill} ${styles.statusRunning}`;
  if (status === 'queued') return `${styles.statusPill} ${styles.statusQueued}`;
  if (status === 'completed') return `${styles.statusPill} ${styles.statusCompleted}`;
  if (status === 'failed') return `${styles.statusPill} ${styles.statusFailed}`;
  return `${styles.statusPill} ${styles.statusCancelled}`;
}

function statusIcon(status: BackgroundTaskStatus): React.ReactNode {
  if (status === 'running') return <LoaderCircle size={12} />;
  if (status === 'queued') return <Clock3 size={12} />;
  if (status === 'completed') return <CheckCircle2 size={12} />;
  if (status === 'failed') return <AlertTriangle size={12} />;
  return <X size={12} />;
}

function statusLabel(status: BackgroundTaskStatus): string {
  if (status === 'running') return 'Running';
  if (status === 'queued') return 'Queued';
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  return 'Cancelled';
}

function renderPanel(
  anchorRect: DOMRect,
  jobs: BackgroundTaskSnapshot[],
  activeCount: number,
  queuedCount: number,
  workerCount: number,
  onClose: () => void,
  onCancel: (jobId: string) => void,
  onClearFinished: () => void,
): React.ReactNode {
  const left = Math.max(12, Math.min(window.innerWidth - Math.min(420, window.innerWidth - 24), anchorRect.right - 420));
  const top = Math.min(window.innerHeight - 24, anchorRect.bottom + 10);

  return createPortal(
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Background tasks"
      data-testid="background-task-panel"
      style={{ position: 'fixed', left, top }}
    >
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Background Tasks</h3>
          <p className={styles.panelSubtitle}>
            Shared worker orchestration for spatial statistics and future clustering, simulation, and raster workloads.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.ghostButton} onClick={onClearFinished}>
            Clear done
          </button>
          <button type="button" className={styles.ghostButton} onClick={onClose} aria-label="Close background task panel">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active jobs</div>
          <div className={styles.summaryValue}>{activeCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Queue depth</div>
          <div className={styles.summaryValue}>{queuedCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Workers</div>
          <div className={styles.summaryValue}>{workerCount}</div>
        </div>
      </div>

      <div className={styles.list}>
        {jobs.length === 0 ? (
          <div className={styles.emptyState}>
            Launch a heavy analysis and it will appear here with queue position, worker progress, and cancellation controls.
          </div>
        ) : (
          jobs.map((job) => {
            const canCancel = job.status === 'queued' || job.status === 'running';
            return (
              <section key={job.id} className={styles.jobCard} data-testid={`background-task-${job.id}`}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitleWrap}>
                    <h4 className={styles.jobTitle}>{job.title}</h4>
                    <div className={styles.jobMeta}>
                      <span>{job.domain}</span>
                      {job.queuePosition ? <span>Queue #{job.queuePosition}</span> : null}
                      <span>{formatRelativeTime(job.finishedAt ?? job.startedAt ?? job.createdAt)}</span>
                    </div>
                  </div>
                  <span className={statusClassName(job.status)}>
                    {statusIcon(job.status)}
                    {statusLabel(job.status)}
                  </span>
                </div>

                <div className={styles.progressMeta}>
                  <span className={styles.progressStage}>{job.progress.stage ?? 'Waiting for worker update'}</span>
                  <span className={styles.progressValue}>{job.progress.percent}%</span>
                </div>

                <div className={styles.progressBar} aria-hidden="true">
                  <div className={styles.progressFill} style={{ width: `${job.progress.percent}%` }} />
                </div>

                {job.error ? <div className={styles.errorText}>{job.error}</div> : null}

                <div className={styles.jobActions}>
                  {canCancel ? (
                    <button type="button" className={styles.actionButton} onClick={() => onCancel(job.id)}>
                      <X size={12} />
                      Cancel job
                    </button>
                  ) : null}
                  {job.status === 'completed' && job.viewAction ? (
                    <button type="button" className={styles.actionButton} onClick={job.viewAction.onClick}>
                      <Rows3 size={12} />
                      {job.viewAction.label}
                    </button>
                  ) : null}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>,
    document.body,
  );
}

export interface BackgroundTasksControlProps {
  compact?: boolean;
}

export const BackgroundTasksControl: React.FC<BackgroundTasksControlProps> = ({ compact = false }) => {
  const hostId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelOpen = useBackgroundTaskStore((state) => state.panelOpen);
  const panelHostId = useBackgroundTaskStore((state) => state.panelHostId);
  const jobs = useBackgroundTaskStore((state) => state.jobs);
  const activeCount = useBackgroundTaskStore((state) => state.activeCount);
  const queuedCount = useBackgroundTaskStore((state) => state.queuedCount);
  const workerCount = useBackgroundTaskStore((state) => state.workerCount);
  const togglePanel = useBackgroundTaskStore((state) => state.togglePanel);
  const closePanel = useBackgroundTaskStore((state) => state.closePanel);
  const claimPanelHost = useBackgroundTaskStore((state) => state.claimPanelHost);
  const cancelJob = useBackgroundTaskStore((state) => state.cancelJob);
  const clearFinished = useBackgroundTaskStore((state) => state.clearFinished);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const isPanelOwner = panelOpen && panelHostId === hostId;

  const runningAverage = useMemo(() => {
    const runningJobs = jobs.filter((job) => job.status === 'running');
    if (runningJobs.length === 0) {
      return null;
    }
    return Math.round(
      runningJobs.reduce((total, job) => total + job.progress.percent, 0) / runningJobs.length,
    );
  }, [jobs]);

  useEffect(() => {
    if (!panelOpen || panelHostId) {
      return;
    }

    const button = buttonRef.current;
    if (!button || button.getClientRects().length === 0) {
      return;
    }

    claimPanelHost(hostId);
  }, [claimPanelHost, hostId, panelHostId, panelOpen]);

  useEffect(() => {
    if (!isPanelOwner) {
      return undefined;
    }

    const updateRect = () => {
      const rect = buttonRef.current?.getBoundingClientRect() ?? null;
      setAnchorRect(rect);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (buttonRef.current?.contains(target)) {
        return;
      }
      const panel = document.querySelector('[data-testid="background-task-panel"]');
      if (panel && target && panel.contains(target)) {
        return;
      }
      closePanel();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closePanel, isPanelOwner]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.button} ${compact ? styles.buttonCompact : ''} ${isPanelOwner ? styles.buttonActive : ''}`}
        onClick={() => togglePanel(hostId)}
        aria-haspopup="dialog"
        aria-expanded={isPanelOwner}
        aria-label={`Open background task panel — ${activeCount} active and ${queuedCount} queued`}
        title={
          activeCount > 0 && runningAverage != null
            ? `Background tasks — ${activeCount} active (${runningAverage}%), ${queuedCount} queued`
            : `Background tasks — ${activeCount} active, ${queuedCount} queued`
        }
        data-testid="background-task-button"
      >
        <span className={styles.buttonLabel}>
          {activeCount > 0 ? <LoaderCircle size={14} /> : <ListOrdered size={14} />}
          <span className={styles.srOnly}>Tasks</span>
        </span>
        <span className={styles.badge}>{activeCount + queuedCount}</span>
      </button>

      {isPanelOwner && anchorRect && typeof document !== 'undefined'
        ? renderPanel(anchorRect, jobs, activeCount, queuedCount, workerCount, closePanel, cancelJob, clearFinished)
        : null}
    </>
  );
};

export default BackgroundTasksControl;
