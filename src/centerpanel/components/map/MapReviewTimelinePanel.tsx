import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  Filter,
  History,
  Link2,
  MessageSquare,
  RotateCcw,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { OverlayLayerConfig } from "./mapTypes";
import type {
  MapReviewAuditCategory,
  MapReviewTimelineEvent,
  MapReviewTimelineEventInput,
  MapReviewTimelineEventStatus,
  MapReviewTimelineEventType,
  MapReviewSession,
} from "@/services/map/MapReviewSessionService";
import {
  filterMapReviewTimelineEvents,
  MAP_REVIEW_AUDIT_CATEGORIES,
  MAP_REVIEW_EVENT_STATUSES,
  MAP_REVIEW_EVENT_TYPES,
  triggerMapReviewSessionDownload,
} from "@/services/map/MapReviewSessionService";
import type {
  MapReviewCollaborationConnectionState,
  MapReviewCollaborationSnapshot,
  MapReviewCollaborationTarget,
  MapReviewComment,
} from "@/services/map/collaboration/MapReviewCollaborationService";
import {
  getMapReviewCollaborationConnectionBadge,
  MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
} from "@/services/map/collaboration/MapReviewCollaborationService";
import type { MapScientificQAState } from "@/services/map/MapScientificQA";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./useDraggableMapPanel";
import { GisEmptyState } from "./ui/GisEmptyState";

export interface MapReviewTimelinePanelProps {
  visible: boolean;
  session: MapReviewSession;
  collaborationSnapshot?: MapReviewCollaborationSnapshot;
  overlayLayers: OverlayLayerConfig[];
  qaState: MapScientificQAState | null;
  onClose: () => void;
  presentation?: "floating" | "embedded";
  onRecordEvent: (event: MapReviewTimelineEventInput) => void;
  onUpdateEventStatus: (eventId: string, status: MapReviewTimelineEventStatus, outcome?: string) => void;
  onClearSession: () => void;
  onRevertCommand?: (commandId: string) => void;
  onAnnounce?: (message: string) => void;
}

const EVENT_TYPE_LABELS: Record<MapReviewTimelineEventType, string> = {
  snapshot: "Snapshot",
  "layer-change": "Layer change",
  "query-run": "Query run",
  "analysis-dispatch": "Analysis dispatch",
  "workflow-action": "Workflow action",
  "report-handoff": "Report handoff",
  "qa-event": "QA event",
  recommendation: "Recommendation",
  annotation: "Annotation",
  bookmark: "Bookmark",
  "action-status": "Action status",
};

const AUDIT_CATEGORY_LABELS: Record<MapReviewAuditCategory, string> = {
  "session-snapshot": "Session snapshot",
  "layer-import": "Layer import",
  "layer-derived": "Layer derived",
  "source-restore": "Source restore",
  "layer-registry": "Layer registry",
  "crs-correction": "CRS correction",
  "qa-run": "QA run",
  "workflow-preview": "Workflow preview",
  "workflow-apply": "Workflow apply",
  "export-report-handoff": "Export/report",
  "urban-sync": "Urban sync",
  "ide-sync": "IDE sync",
  "nl-query-decision": "NL query",
  "voxcity-2d-3d-handoff": "2D/3D handoff",
  "cartography-review": "Cartography review",
  "annotation-bookmark": "Annotation/bookmark",
  "action-audit": "Action audit",
};

const STATUS_LABELS: Record<MapReviewTimelineEventStatus, string> = {
  recorded: "Recorded",
  proposed: "Proposed",
  previewed: "Previewed",
  applied: "Applied",
  rejected: "Rejected",
  undone: "Undone",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  failed: "Failed",
};

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(31rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 10),
  height: "min(40rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.lg,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const embeddedPanelStyle: React.CSSProperties = {
  ...panelStyle,
  position: "relative",
  inset: "auto",
  width: "100%",
  height: "100%",
  maxWidth: "none",
  maxHeight: "none",
  border: MAP_STROKES.none,
  borderRadius: MAP_RADIUS.none,
  boxShadow: MAP_SHADOWS.none,
  zIndex: "auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStackStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const eyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const summaryStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const iconButtonStyle: React.CSSProperties = {
  width: "1.875rem",
  height: "1.875rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: MAP_SPACING.zero,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const eventListStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  alignContent: "start",
};

const eventRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const eventTopLineStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: MAP_SPACING.sm,
  alignItems: "start",
};

const eventTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const metaStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  maxWidth: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const eventSummaryStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const idWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const eventActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  alignItems: "center",
};

const actionButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const collaborationSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgPanel,
};

const collaborationHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
};

const collaborationStatsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const collaborationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
  gap: MAP_SPACING.md,
  minWidth: MAP_SPACING.zero,
};

const collaborationColumnStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const collaborationSubheadStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const collaborationRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  padding: `${MAP_SPACING.xs} 0`,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const collaborationRowTitleStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.valueWrap,
};

const collaborationNoteStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  ...MAP_TEXT_STYLES.valueWrap,
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateInput(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "";
  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function eventStatusColor(status: MapReviewTimelineEventStatus): string {
  if (status === "failed" || status === "rejected") return MAP_COLORS.error;
  if (status === "applied" || status === "resolved" || status === "acknowledged") return MAP_COLORS.success;
  if (status === "proposed" || status === "previewed") return MAP_COLORS.warning;
  return MAP_COLORS.textSecondary;
}

function compactIds(values: readonly string[], limit = 3): string[] {
  if (values.length <= limit) return [...values];
  return [...values.slice(0, limit), `+${values.length - limit} more`];
}

function createLocalOnlyCollaborationSnapshot(sessionId: string): MapReviewCollaborationSnapshot {
  return {
    schemaVersion: MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
    sessionId,
    connectionState: "local-only",
    badge: getMapReviewCollaborationConnectionBadge("local-only"),
    annotations: [],
    comments: [],
    presence: [],
  };
}

function collaborationStateLabel(state: MapReviewCollaborationConnectionState): string {
  if (state === "connected") return "Live sync";
  if (state === "offline") return "Offline";
  return "Local-only";
}

function collaborationStateColor(state: MapReviewCollaborationConnectionState): string {
  if (state === "connected") return MAP_COLORS.success;
  if (state === "offline") return MAP_COLORS.error;
  return MAP_COLORS.caveatText;
}

function collaborationStateIcon(state: MapReviewCollaborationConnectionState): React.ReactNode {
  if (state === "offline") return <WifiOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />;
  return <Wifi size={MAP_ICON_SIZES.sm} aria-hidden="true" />;
}

function targetKey(target: MapReviewCollaborationTarget): string {
  return `${target.kind}:${target.id}`;
}

function targetLabel(target: MapReviewCollaborationTarget | undefined): string {
  if (!target) return "Review target unavailable";
  return target.label ? `${target.label} / ${target.kind}:${target.id}` : `${target.kind}:${target.id}`;
}

function uniqueList(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function collaborationEvidenceIds(snapshot: MapReviewCollaborationSnapshot): string[] {
  return uniqueList([
    ...snapshot.annotations.flatMap((annotation) => annotation.evidenceArtifactIds),
    ...snapshot.comments.flatMap((comment) => comment.evidenceArtifactIds),
  ]);
}

function commentsByTarget(comments: readonly MapReviewComment[]): Array<{ key: string; target: MapReviewCollaborationTarget; comments: MapReviewComment[] }> {
  const groups = new Map<string, { key: string; target: MapReviewCollaborationTarget; comments: MapReviewComment[] }>();
  for (const comment of comments) {
    const key = targetKey(comment.target);
    const group = groups.get(key);
    if (group) {
      group.comments.push(comment);
    } else {
      groups.set(key, { key, target: comment.target, comments: [comment] });
    }
  }
  return Array.from(groups.values()).sort((left, right) => left.key.localeCompare(right.key));
}

function ReferenceBadges({ label, ids }: { label: string; ids: readonly string[] }): React.ReactElement | null {
  if (ids.length === 0) return null;
  return (
    <div style={idWrapStyle} aria-label={`${label} references`}>
      {compactIds(ids).map((id) => <span key={`${label}-${id}`} style={badgeStyle}>{label} {id}</span>)}
    </div>
  );
}

function CollaborationSurface({ snapshot }: { snapshot: MapReviewCollaborationSnapshot }): React.ReactElement {
  const stateColor = collaborationStateColor(snapshot.connectionState);
  const stateLabel = collaborationStateLabel(snapshot.connectionState);
  const openComments = snapshot.comments.filter((comment) => comment.status === "open");
  const resolvedComments = snapshot.comments.length - openComments.length;
  const evidenceIds = collaborationEvidenceIds(snapshot);
  const groupedComments = commentsByTarget(snapshot.comments);

  return (
    <section
      style={collaborationSectionStyle}
      aria-label="Review collaboration status"
      data-testid="map-review-collaboration"
      data-collaboration-state={snapshot.connectionState}
    >
      <div style={collaborationHeaderStyle}>
        <div style={titleStackStyle}>
          <span style={eyebrowStyle}>Collaboration</span>
          <div style={summaryStyle}>{snapshot.badge.description}</div>
        </div>
        <span
          style={{ ...badgeStyle, color: stateColor, borderColor: stateColor }}
          data-testid="map-review-collaboration-state"
        >
          {collaborationStateIcon(snapshot.connectionState)}
          {stateLabel}
        </span>
      </div>

      <div style={collaborationStatsStyle} aria-label="Collaboration sync summary">
        <span style={{ ...badgeStyle, color: stateColor, borderColor: stateColor }}>Sync {snapshot.badge.label}</span>
        <span style={badgeStyle}>{snapshot.presence.length} reviewer{snapshot.presence.length === 1 ? "" : "s"}</span>
        <span style={badgeStyle}>{openComments.length} open comment{openComments.length === 1 ? "" : "s"}</span>
        <span style={badgeStyle}>{resolvedComments} resolved</span>
        <span style={badgeStyle}>{snapshot.annotations.length} annotation link{snapshot.annotations.length === 1 ? "" : "s"}</span>
        <span style={badgeStyle}>{evidenceIds.length} evidence ID{evidenceIds.length === 1 ? "" : "s"}</span>
      </div>

      <div style={collaborationGridStyle}>
        <div style={collaborationColumnStyle}>
          <div style={collaborationSubheadStyle}>
            <Users size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Reviewer presence
          </div>
          {snapshot.presence.length > 0 ? snapshot.presence.map((presence) => {
            const presenceColor = collaborationStateColor(presence.connectionState);
            return (
              <article key={presence.clientId} style={collaborationRowStyle} data-testid="map-review-collaboration-presence">
                <div style={collaborationRowTitleStyle}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      borderRadius: MAP_RADIUS.full,
                      background: presence.color ?? presenceColor,
                      boxShadow: `0 0 0 1px ${presenceColor}`,
                    }}
                  />
                  {presence.name}{presence.isSelf ? " (you)" : ""}
                </div>
                <div style={metaStyle}>{collaborationStateLabel(presence.connectionState)} / last active {formatTimestamp(presence.lastActiveAt)}</div>
                {presence.activeTarget ? <div style={collaborationNoteStyle}>Target {targetLabel(presence.activeTarget)}</div> : null}
              </article>
            );
          }) : (
            <span style={collaborationNoteStyle}>No reviewer presence is published for this local review session.</span>
          )}
        </div>

        <div style={collaborationColumnStyle}>
          <div style={collaborationSubheadStyle}>
            <MessageSquare size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Comments by target ID
          </div>
          {groupedComments.length > 0 ? groupedComments.map((group) => (
            <article key={group.key} style={collaborationRowStyle} data-testid="map-review-comment-target">
              <div style={collaborationRowTitleStyle}>{targetLabel(group.target)}</div>
              {group.comments.map((comment) => (
                <div key={comment.id} style={collaborationRowStyle} data-testid="map-review-comment">
                  <div style={metaStyle}>{comment.author.name} / {comment.status} / Comment {comment.id}</div>
                  <div style={eventSummaryStyle}>{comment.body}</div>
                  <ReferenceBadges label="Annotation" ids={comment.annotationIds} />
                  <ReferenceBadges label="Evidence" ids={comment.evidenceArtifactIds} />
                </div>
              ))}
            </article>
          )) : (
            <span style={collaborationNoteStyle}>No review comments are available for this session.</span>
          )}
        </div>

        <div style={collaborationColumnStyle}>
          <div style={collaborationSubheadStyle}>
            <Link2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Annotation and evidence links
          </div>
          {snapshot.annotations.length > 0 ? snapshot.annotations.map((annotation) => (
            <article key={annotation.id} style={collaborationRowStyle} data-testid="map-review-annotation-link">
              <div style={collaborationRowTitleStyle}>Annotation {annotation.id}</div>
              <div style={metaStyle}>{annotation.author.name} / {targetLabel(annotation.target)}</div>
              <ReferenceBadges label="Layer" ids={annotation.layerIds} />
              <ReferenceBadges label="Evidence" ids={annotation.evidenceArtifactIds} />
            </article>
          )) : (
            <span style={collaborationNoteStyle}>No annotation links are available for this session.</span>
          )}
        </div>
      </div>

      <div style={collaborationNoteStyle}>
        Review sync payload: target IDs, comment text, annotation IDs, evidence IDs, and presence only. Source bytes and layer geometry are excluded.
      </div>
    </section>
  );
}

function EventRow({
  event,
  layerLookup,
  onUpdateEventStatus,
  onRevertCommand,
}: {
  event: MapReviewTimelineEvent;
  layerLookup: Map<string, string>;
  onUpdateEventStatus: MapReviewTimelinePanelProps["onUpdateEventStatus"];
  onRevertCommand?: MapReviewTimelinePanelProps["onRevertCommand"];
}): React.ReactElement {
  const layerLabels = event.layerIds.map((layerId) => layerLookup.get(layerId) ?? layerId);
  const statusColor = eventStatusColor(event.status);
  const revertCommandId =
    onRevertCommand && event.undo?.available && event.status === "applied" && typeof event.details.commandId === "string"
      ? event.details.commandId
      : null;
  const canAcknowledge = event.status === "recorded" || event.status === "proposed" || event.status === "previewed";

  return (
    <article
      style={eventRowStyle}
      data-testid="map-review-timeline-event"
      role="listitem"
      aria-label={`${event.title}. ${STATUS_LABELS[event.status]}. ${event.summary}`}
    >
      <div style={eventTopLineStyle}>
        <div style={{ minWidth: MAP_SPACING.zero }}>
          <div style={eventTitleStyle}>{event.title}</div>
          <div style={metaStyle}>
            {formatTimestamp(event.timestamp)} / {EVENT_TYPE_LABELS[event.type]} / {AUDIT_CATEGORY_LABELS[event.category]}
          </div>
        </div>
        <span style={{ ...badgeStyle, color: statusColor, border: `1px solid ${statusColor}` }}>
          {STATUS_LABELS[event.status]}
        </span>
      </div>
      <div style={eventSummaryStyle}>{event.summary}</div>
      <div style={idWrapStyle} aria-label="Timeline event references">
        {compactIds(layerLabels).map((label) => <span key={`layer-${label}`} style={badgeStyle}>{label}</span>)}
        {compactIds(event.sourceIds).map((id) => <span key={`source-${id}`} style={badgeStyle}>Source {id}</span>)}
        {compactIds(event.runIds).map((id) => <span key={`run-${id}`} style={badgeStyle}>Run {id}</span>)}
        {compactIds(event.evidenceArtifactIds).map((id) => <span key={`evidence-${id}`} style={badgeStyle}>Evidence {id}</span>)}
        {compactIds(event.reportItemIds).map((id) => <span key={`report-${id}`} style={badgeStyle}>Report {id}</span>)}
        {compactIds(event.qaIssueIds).map((id) => <span key={`qa-${id}`} style={badgeStyle}>QA {id}</span>)}
        {compactIds(event.recommendationIds).map((id) => <span key={`rec-${id}`} style={badgeStyle}>Rec {id}</span>)}
      </div>
      <div style={eventActionsStyle}>
        {canAcknowledge ? (
          <button
            type="button"
            style={actionButtonStyle}
            onClick={() => onUpdateEventStatus(event.id, "acknowledged", "Reviewed in map timeline")}
            aria-label={`Acknowledge timeline event ${event.title}`}
          >
            <CheckCircle2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Acknowledge
          </button>
        ) : null}
        {revertCommandId ? (
          <button
            type="button"
            style={actionButtonStyle}
            onClick={() => onRevertCommand?.(revertCommandId)}
            data-testid="map-review-timeline-revert"
            aria-label={`Revert ${event.title}`}
          >
            <RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Revert
          </button>
        ) : null}
        {event.undo ? (
          <span style={metaStyle}>
            Undo {event.undo.available ? "available" : "unavailable"}{event.undo.outcome ? ` / ${event.undo.outcome}` : ""}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export const MapReviewTimelinePanel: React.FC<MapReviewTimelinePanelProps> = ({
  visible,
  session,
  collaborationSnapshot,
  overlayLayers,
  qaState,
  onClose,
  presentation = "floating",
  onRecordEvent,
  onUpdateEventStatus,
  onClearSession,
  onRevertCommand,
  onAnnounce,
}) => {
  const panelDrag = useDraggableMapPanel();
  const [typeFilter, setTypeFilter] = useState<MapReviewTimelineEventType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<MapReviewAuditCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MapReviewTimelineEventStatus | "all">("all");
  const [layerFilter, setLayerFilter] = useState<string | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string | "all">("all");
  const [evidenceFilter, setEvidenceFilter] = useState<string | "all">("all");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const layerLookup = useMemo(
    () => new Map(overlayLayers.map((layer) => [layer.id, layer.name])),
    [overlayLayers],
  );
  const filteredEvents = useMemo(
    () => filterMapReviewTimelineEvents(session, {
      type: typeFilter,
      category: categoryFilter,
      status: statusFilter,
      layerId: layerFilter,
      sourceId: sourceFilter,
      evidenceArtifactId: evidenceFilter,
      startDate,
      endDate,
      query,
    }),
    [categoryFilter, endDate, evidenceFilter, layerFilter, query, session, sourceFilter, startDate, statusFilter, typeFilter],
  );

  const filteredLayerOptions = useMemo(() => {
    const ids = new Set(session.events.flatMap((event) => event.layerIds));
    return overlayLayers.filter((layer) => ids.has(layer.id));
  }, [overlayLayers, session.events]);

  const filteredSourceOptions = useMemo(
    () => Array.from(new Set(session.events.flatMap((event) => event.sourceIds))).sort(),
    [session.events],
  );

  const filteredEvidenceOptions = useMemo(
    () => Array.from(new Set(session.events.flatMap((event) => event.evidenceArtifactIds))).sort(),
    [session.events],
  );

  const resolvedCollaborationSnapshot = collaborationSnapshot ?? createLocalOnlyCollaborationSnapshot(session.id);

  if (!visible) return null;

  const activeQaIssues = qaState?.issues.filter((issue) => issue.severity !== "info") ?? [];
  const embedded = presentation === "embedded";
  const resolvedPanelStyle = embedded ? embeddedPanelStyle : { ...panelStyle, ...panelDrag.panelPositionStyle };
  const resolvedHeaderStyle = embedded ? headerStyle : { ...headerStyle, ...panelDrag.dragHandleStyle };

  return (
    <aside
      data-draggable-map-panel={embedded ? undefined : "true"}
      style={resolvedPanelStyle}
      role={embedded ? "region" : "dialog"}
      aria-modal={embedded ? undefined : "false"}
      aria-label="Map review timeline panel"
    >
      <header style={resolvedHeaderStyle} {...(embedded ? {} : panelDrag.dragHandleProps)}>
        <div style={titleStackStyle}>
          <span style={eyebrowStyle}>Collaborative review</span>
          <h3 style={titleStyle}>
            <History size={MAP_ICON_SIZES.md} aria-hidden="true" />
            Review timeline
          </h3>
          <span style={summaryStyle}>
            {session.events.length} auditable event(s). Filtered view shows {filteredEvents.length}.
          </span>
        </div>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close review timeline panel">
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      <CollaborationSurface snapshot={resolvedCollaborationSnapshot} />

      <section style={filterGridStyle} aria-label="Review timeline filters">
        <label style={labelStyle}>
          <span><Filter size={MAP_ICON_SIZES.xs} aria-hidden="true" /> Event type</span>
          <select style={inputStyle} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MapReviewTimelineEventType | "all")}>
            <option value="all">All event types</option>
            {MAP_REVIEW_EVENT_TYPES.map((type) => <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Audit category
          <select style={inputStyle} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as MapReviewAuditCategory | "all")}>
            <option value="all">All audit categories</option>
            {MAP_REVIEW_AUDIT_CATEGORIES.map((category) => (
              <option key={category} value={category}>{AUDIT_CATEGORY_LABELS[category]}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Status
          <select style={inputStyle} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as MapReviewTimelineEventStatus | "all")}>
            <option value="all">All statuses</option>
            {MAP_REVIEW_EVENT_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Layer
          <select style={inputStyle} value={layerFilter} onChange={(event) => setLayerFilter(event.target.value)}>
            <option value="all">All referenced layers</option>
            {filteredLayerOptions.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Source
          <select style={inputStyle} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="all">All source handles</option>
            {filteredSourceOptions.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Evidence
          <select style={inputStyle} value={evidenceFilter} onChange={(event) => setEvidenceFilter(event.target.value)}>
            <option value="all">All evidence artifacts</option>
            {filteredEvidenceOptions.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Search
          <input style={inputStyle} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, layer, report, QA, evidence" />
        </label>
        <label style={labelStyle}>
          Start time
          <input type="datetime-local" style={inputStyle} value={formatDateInput(startDate)} onChange={(event) => setStartDate(dateInputToIso(event.target.value))} />
        </label>
        <label style={labelStyle}>
          End time
          <input type="datetime-local" style={inputStyle} value={formatDateInput(endDate)} onChange={(event) => setEndDate(dateInputToIso(event.target.value))} />
        </label>
      </section>

      <div
        style={eventListStyle}
        role="list"
        aria-live="polite"
        aria-label={`Review timeline events, ${filteredEvents.length} shown`}
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              layerLookup={layerLookup}
              onUpdateEventStatus={onUpdateEventStatus}
              {...(onRevertCommand ? { onRevertCommand } : {})}
            />
          ))
        ) : (
          <GisEmptyState
            icon={<History size={MAP_ICON_SIZES.md} aria-hidden />}
            title="No timeline entries"
            description="No events match the current filter set."
            compact
          />
        )}
      </div>

      <footer style={footerStyle}>
        <div style={eventActionsStyle}>
          <button
            type="button"
            style={actionButtonStyle}
            aria-label="Mark current scientific QA state as reviewed"
            onClick={() => {
              onRecordEvent({
                type: "qa-event",
                category: "qa-run",
                status: "acknowledged",
                title: activeQaIssues.length > 0 ? "QA caveats acknowledged" : "QA state reviewed",
                summary: activeQaIssues.length > 0
                  ? `${activeQaIssues.length} visible scientific QA caveat(s) were acknowledged in the review timeline.`
                  : "The current QA state was reviewed; no non-informational issues are open.",
                layerIds: activeQaIssues.map((issue) => issue.layerId).filter((layerId): layerId is string => Boolean(layerId)),
                qaIssueIds: activeQaIssues.map((issue) => issue.id),
                details: {
                  qaStatus: qaState?.status ?? "not-run",
                  issueCount: activeQaIssues.length,
                },
              });
              onAnnounce?.("QA review acknowledgement recorded");
            }}
          >
            <CheckCircle2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Mark QA reviewed
          </button>
          <button type="button" style={actionButtonStyle} onClick={onClearSession} aria-label="Start a new review timeline session">
            <RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            New session
          </button>
        </div>
        <div style={eventActionsStyle} aria-label="Export review">
          <span style={eyebrowStyle}>Export review</span>
          <button
            type="button"
            style={actionButtonStyle}
            aria-label="Export review timeline as JSON"
            onClick={() => {
              triggerMapReviewSessionDownload(session, "json");
              onAnnounce?.("Review timeline exported as JSON");
            }}
          >
            <FileJson size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            JSON
          </button>
          <button
            type="button"
            style={actionButtonStyle}
            aria-label="Export review timeline as Markdown"
            onClick={() => {
              triggerMapReviewSessionDownload(session, "markdown");
              onAnnounce?.("Review timeline exported as Markdown");
            }}
          >
            <FileText size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Markdown
          </button>
          <span style={metaStyle}><Download size={MAP_ICON_SIZES.xs} aria-hidden="true" /> Reproducible log</span>
        </div>
      </footer>
    </aside>
  );
};
