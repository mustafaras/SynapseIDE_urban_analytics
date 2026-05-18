import React, { useMemo, useState } from "react";
import { MessageSquareMore, PauseCircle, PlayCircle, Users, Wifi, WifiOff } from "lucide-react";
import { useCollaborationOptional, useScopeThreads } from "./hooks";
import type { CollaborationPresenceState } from "./types";
import styles from "./collaboration.module.css";

function formatElapsed(timestamp?: number): string {
  if (!timestamp) {
    return "Awaiting first sync";
  }
  const delta = Math.max(0, Date.now() - timestamp);
  if (delta < 1_000) {
    return "Synced just now";
  }
  if (delta < 60_000) {
    return `Synced ${Math.round(delta / 1_000)}s ago`;
  }
  return `Synced ${Math.round(delta / 60_000)}m ago`;
}

function presenceLabel(presence: CollaborationPresenceState): string {
  if (presence.activeLabel) {
    return presence.activeLabel;
  }
  if (presence.activeSection) {
    return presence.activeSection;
  }
  return "Browsing";
}

function formatRelativeTime(timestamp: number): string {
  const delta = Math.max(0, Date.now() - timestamp);
  if (delta < 5_000) {
    return "Active now";
  }
  if (delta < 60_000) {
    return `Active ${Math.round(delta / 1_000)}s ago`;
  }
  return `Active ${Math.round(delta / 60_000)}m ago`;
}

function selectionPreview(presence: CollaborationPresenceState): string | null {
  const selection = presence.selectionText?.trim();
  if (!selection) {
    return null;
  }
  if (selection === presence.activeLabel || selection === presence.activeSection) {
    return null;
  }
  return selection.length > 72 ? `${selection.slice(0, 69)}...` : selection;
}

function formatConnectionState(state: string): string {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function CollaborationPresenceStrip(props: {
  participants: CollaborationPresenceState[];
  label?: string;
  compact?: boolean;
  emptyLabel?: string;
}): React.ReactElement | null {
  const { participants, label = "Live collaborators", compact = false, emptyLabel = "No one else is active here yet." } = props;
  const remoteParticipants = participants.filter((presence) => !presence.isSelf);
  if (remoteParticipants.length === 0 && compact) {
    return null;
  }
  return (
    <div className={compact ? styles.inlinePresenceStrip : styles.presenceStrip}>
      <div className={styles.presenceStripHeader}>{label}</div>
      {remoteParticipants.length === 0 ? (
        <div className={styles.presenceEmpty}>{emptyLabel}</div>
      ) : (
        <div className={styles.presenceList}>
          {remoteParticipants.map((presence) => (
            <div key={presence.clientId} className={styles.presenceItem}>
              <span className={styles.avatar} style={{ background: presence.color }} aria-hidden="true">
                {(presence.avatar ?? presence.name).slice(0, 2).toUpperCase()}
              </span>
              <span className={styles.presenceCopy}>
                <strong>{presence.name}</strong>
                <span className={styles.presenceMeta}>{presenceLabel(presence)}</span>
                {selectionPreview(presence) ? <span className={styles.presenceSelection}>Selection: {selectionPreview(presence)}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CollaborationHeaderControls(): React.ReactElement | null {
  const collaboration = useCollaborationOptional();
  const [isOpen, setIsOpen] = useState(false);

  const participants = collaboration?.snapshot.participants ?? [];
  const visibleParticipants = participants.slice(0, 4);
  const stateLabel = collaboration?.connection.state ?? "offline";
  const icon = stateLabel === "connected" ? <Wifi size={14} /> : <WifiOff size={14} />;

  if (!collaboration) {
    return null;
  }

  return (
    <div className={styles.headerControls}>
      <button
        type="button"
        className={styles.headerButton}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={`Collaboration — ${participants.length} live, ${stateLabel}`}
        title={`${participants.length} live · ${stateLabel}`}
      >
        <span className={styles.headerButtonStack}>
          {visibleParticipants.map((presence) => (
            <span key={presence.clientId} className={styles.headerAvatar} style={{ background: presence.color }}>
              {(presence.avatar ?? presence.name).slice(0, 2).toUpperCase()}
            </span>
          ))}
        </span>
        <span className={styles.headerButtonLabel} aria-hidden="true">
          <Users size={14} />
          {participants.length}
        </span>
        <span className={styles.headerButtonState} data-state={stateLabel} aria-hidden="true">
          {icon}
        </span>
      </button>

      {isOpen ? (
        <div className={styles.headerPopover} role="dialog" aria-label="Collaboration panel">
          <div className={styles.headerPopoverHeader}>
            <div>
              <div className={styles.headerPopoverTitle}>Collaboration Room</div>
              <div className={styles.headerPopoverSubtitle}>{formatElapsed(collaboration.connection.lastSyncedAt)}</div>
            </div>
            <button type="button" className={styles.smallButton} onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>

          <div className={styles.connectionCard} data-state={stateLabel}>
            <div>
              <div className={styles.connectionTitle}>Sync status</div>
              <div className={styles.connectionMeta}>
                {stateLabel === "paused" ? "Local edits are queued until you resume sync." : "All changes stream through the shared CRDT room."}
              </div>
            </div>
            <div className={styles.connectionActions}>
              {stateLabel === "paused" ? (
                <button type="button" className={styles.primaryButton} onClick={() => collaboration.connection.resumeSync()}>
                  <PlayCircle size={14} /> Resume sync
                </button>
              ) : (
                <button type="button" className={styles.smallButton} onClick={() => collaboration.connection.pauseSync()}>
                  <PauseCircle size={14} /> Pause sync
                </button>
              )}
            </div>
          </div>

          <div className={styles.collaboratorList}>
            {participants.map((presence) => (
              <div key={presence.clientId} className={styles.collaboratorRow}>
                <span className={styles.avatar} style={{ background: presence.color }} aria-hidden="true">
                  {(presence.avatar ?? presence.name).slice(0, 2).toUpperCase()}
                </span>
                <div className={styles.presenceCopy}>
                  <div className={styles.collaboratorName}>
                    {presence.name}
                    {presence.isSelf ? <span className={styles.selfBadge}>You</span> : null}
                  </div>
                  <div className={styles.collaboratorMeta}>{presenceLabel(presence)}</div>
                  {selectionPreview(presence) ? <div className={styles.presenceSelection}>Selection: {selectionPreview(presence)}</div> : null}
                  <div className={styles.activityTime}>{formatRelativeTime(presence.lastActiveAt)}</div>
                </div>
                <span className={styles.statePill} data-state={presence.connectionState}>{presence.connectionState}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CollaborationSessionOverview(props: {
  scopeId: string;
  title: string;
  description: string;
  participants: CollaborationPresenceState[];
  emptyState?: string;
}): React.ReactElement | null {
  const {
    scopeId,
    title,
    description,
    participants,
    emptyState = "Open another session or tab to start collaborative review in this workspace.",
  } = props;
  const collaboration = useCollaborationOptional();
  const threads = useScopeThreads(scopeId);
  const remoteParticipants = useMemo(
    () => participants.filter((presence) => !presence.isSelf),
    [participants],
  );
  const openThreadCount = useMemo(
    () => threads.filter((thread) => thread.status === "open").length,
    [threads],
  );

  if (!collaboration) {
    return null;
  }

  return (
    <section className={styles.sessionOverview} aria-label={`${title} collaboration overview`}>
      <div className={styles.sessionOverviewHeader}>
        <div>
          <div className={styles.sessionOverviewTitle}>{title}</div>
          <div className={styles.sessionOverviewSubtitle}>{description}</div>
        </div>
        <span className={styles.statePill} data-state={collaboration.connection.state}>
          {formatConnectionState(collaboration.connection.state)}
        </span>
      </div>

      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Peers active</span>
          <strong className={styles.metricValue}>{remoteParticipants.length}</strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Open threads</span>
          <strong className={styles.metricValue}>{openThreadCount}</strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Resolved threads</span>
          <strong className={styles.metricValue}>{Math.max(0, threads.length - openThreadCount)}</strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Queued edits</span>
          <strong className={styles.metricValue}>{collaboration.connection.pendingChanges}</strong>
        </div>
      </div>

      <div className={styles.activityList}>
        {remoteParticipants.length === 0 ? (
          <div className={styles.presenceEmpty}>{emptyState}</div>
        ) : (
          remoteParticipants.map((presence) => (
            <article key={presence.clientId} className={styles.activityCard}>
              <div className={styles.activityHeader}>
                <span className={styles.avatar} style={{ background: presence.color }} aria-hidden="true">
                  {(presence.avatar ?? presence.name).slice(0, 2).toUpperCase()}
                </span>
                <div className={styles.presenceCopy}>
                  <strong>{presence.name}</strong>
                  <span className={styles.presenceMeta}>{presenceLabel(presence)}</span>
                </div>
                <span className={styles.statePill} data-state={presence.connectionState}>{presence.connectionState}</span>
              </div>
              {selectionPreview(presence) ? (
                <div className={styles.activitySnippet}>Selection: {selectionPreview(presence)}</div>
              ) : null}
              <div className={styles.activityTime}>{formatRelativeTime(presence.lastActiveAt)}</div>
            </article>
          ))
        )}
      </div>

      <div className={styles.sessionOverviewFooter}>
        <span className={styles.presenceMeta}>{formatElapsed(collaboration.connection.lastSyncedAt)}</span>
        {collaboration.connection.state === "paused" ? (
          <button type="button" className={styles.primaryButton} onClick={() => collaboration.connection.resumeSync()}>
            <PlayCircle size={14} /> Resume sync
          </button>
        ) : (
          <button type="button" className={styles.smallButton} onClick={() => collaboration.connection.pauseSync()}>
            <PauseCircle size={14} /> Pause sync
          </button>
        )}
      </div>
    </section>
  );
}

export function CollaborationCommentSidebar(props: {
  scopeId: string;
  title: string;
  subtitle: string;
  defaultAnchorLabel: string;
}): React.ReactElement {
  const { scopeId, title, subtitle, defaultAnchorLabel } = props;
  const collaboration = useCollaborationOptional();
  const threads = useScopeThreads(scopeId);
  const [anchorLabel, setAnchorLabel] = useState(defaultAnchorLabel);
  const [newComment, setNewComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const openThreads = useMemo(() => threads.filter((thread) => thread.status === "open"), [threads]);

  React.useEffect(() => {
    setAnchorLabel(defaultAnchorLabel);
  }, [defaultAnchorLabel]);

  return (
    <aside className={styles.commentSidebar} aria-label={`${title} comments`}>
      <div className={styles.commentSidebarHeader}>
        <div>
          <div className={styles.commentSidebarTitle}>{title}</div>
          <div className={styles.commentSidebarSubtitle}>{subtitle}</div>
        </div>
        <div className={styles.commentSidebarCount}>
          <MessageSquareMore size={14} />
          {openThreads.length} open
        </div>
      </div>

      <label className={styles.formLabel}>
        Anchor
        <input value={anchorLabel} onChange={(event) => setAnchorLabel(event.target.value)} className={styles.textInput} />
      </label>

      <label className={styles.formLabel}>
        Add annotation
        <textarea
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          className={styles.textArea}
          placeholder="Capture a review note, handoff question, or spatial annotation."
        />
      </label>

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!collaboration || !newComment.trim() || !anchorLabel.trim()}
        onClick={() => {
          if (!collaboration || !newComment.trim()) {
            return;
          }
          collaboration.comments.add(scopeId, anchorLabel.trim(), newComment.trim());
          setNewComment("");
        }}
      >
        Add thread
      </button>

      <div className={styles.threadList}>
        {threads.length === 0 ? (
          <div className={styles.presenceEmpty}>No annotations yet. Start the first thread for this shared context.</div>
        ) : (
          threads.map((thread) => (
            <article key={thread.id} className={styles.threadCard} data-status={thread.status}>
              <div className={styles.threadHeader}>
                <span className={styles.threadAnchor}>{thread.anchorLabel}</span>
                <button
                  type="button"
                  className={styles.smallButton}
                  onClick={() => collaboration?.comments.setResolved(scopeId, thread.id, thread.status !== "resolved")}
                >
                  {thread.status === "resolved" ? "Reopen" : "Resolve"}
                </button>
              </div>
              <div className={styles.threadBody}>{thread.body}</div>
              <div className={styles.threadMeta}>
                <span style={{ color: thread.authorColor }}>{thread.authorName}</span>
                <span>{new Date(thread.updatedAt).toLocaleTimeString()}</span>
              </div>

              <div className={styles.replyList}>
                {thread.replies.map((reply) => (
                  <div key={reply.id} className={styles.replyCard}>
                    <div className={styles.threadMeta}>
                      <span style={{ color: reply.authorColor }}>{reply.authorName}</span>
                      <span>{new Date(reply.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div>{reply.body}</div>
                  </div>
                ))}
              </div>

              <textarea
                value={replyDrafts[thread.id] ?? ""}
                onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))}
                className={styles.replyInput}
                placeholder="Reply to this thread"
              />
              <button
                type="button"
                className={styles.smallButton}
                disabled={!collaboration || !(replyDrafts[thread.id] ?? "").trim()}
                onClick={() => {
                  const nextReply = replyDrafts[thread.id] ?? "";
                  if (!collaboration || !nextReply.trim()) {
                    return;
                  }
                  collaboration.comments.reply(scopeId, thread.id, nextReply.trim());
                  setReplyDrafts((current) => ({ ...current, [thread.id]: "" }));
                }}
              >
                Reply
              </button>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}