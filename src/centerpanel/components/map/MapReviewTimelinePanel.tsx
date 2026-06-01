import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  Filter,
  History,
  RotateCcw,
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
import type { MapScientificQAState } from "@/services/map/MapScientificQA";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./useDraggableMapPanel";
import { GisEmptyState } from "./ui/GisEmptyState";

export interface MapReviewTimelinePanelProps {
  visible: boolean;
  session: MapReviewSession;
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
