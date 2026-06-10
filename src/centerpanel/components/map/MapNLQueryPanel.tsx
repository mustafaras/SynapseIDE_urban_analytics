import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, Geometry } from "geojson";
import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Copy,
  Database,
  Info,
  Layers,
  Play,
  Search,
  X,
} from "lucide-react";
import {
  buildMapNLQueryContext,
  generateMapNLQueryPreview,
  type MapNLQueryMode,
  type MapNLQueryPreview,
  type MapNLQueryRequiredField,
  type MapNLQueryScope,
} from "@/services/map/MapNLQueryBuilder";
import type { OverlayLayerConfig } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "./mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./useDraggableMapPanel";

export interface MapNLQueryPanelRunSummary {
  layerName: string;
  featureCount: number;
  geometryType: string;
  elapsedMs: number;
  followUpSuggestions: string[];
}

export type MapNLQueryPanelPreviewDecision = "accepted" | "rejected";

export interface MapNLQueryPanelProps {
  visible: boolean;
  overlayLayers: OverlayLayerConfig[];
  selectedAoiFeature: Feature<Geometry> | null;
  currentMapBounds: [number, number, number, number] | null;
  isRunning: boolean;
  lastRunSummary: MapNLQueryPanelRunSummary | null;
  onRun: (preview: MapNLQueryPreview, options: { confirmed: boolean }) => void | Promise<void>;
  onProposalGenerated?: (preview: MapNLQueryPreview) => void;
  onPreviewDecision?: (preview: MapNLQueryPreview, decision: MapNLQueryPanelPreviewDecision) => void;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
  presentation?: "floating" | "embedded";
}

const EXAMPLE_REQUESTS = [
  "Show parcels within 500 meters of transit stops.",
  "Highlight high-density blocks that also have low tree cover.",
  "Filter detections above 80% confidence inside this district.",
  "Compare hot spots with the current zoning layer.",
] as const;

const SCOPES: Array<{ id: MapNLQueryScope; label: string }> = [
  { id: "visible", label: "Visible" },
  { id: "selected-aoi", label: "AOI" },
  { id: "current-extent", label: "Extent" },
  { id: "project", label: "Project" },
];

const MODES: Array<{ id: MapNLQueryMode; label: string }> = [
  { id: "live", label: "Live" },
  { id: "demo", label: "Demo" },
];

const panelBaseStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(`min(44rem, calc(100% - ${MAP_SPACING.xl}))`),
};

const embeddedPanelStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  maxHeight: "calc(100% - 2rem)",
  border: MAP_STROKES.none,
  borderRadius: 0,
  background: MAP_COLORS.bgPanel,
  boxShadow: "none",
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const sectionTitle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const queryInputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "4.75rem",
  resize: "vertical",
  boxSizing: "border-box",
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  outline: MAP_STROKES.none,
};

const segmentedGroup: React.CSSProperties = {
  display: "inline-grid",
  gridAutoFlow: "column",
  gridAutoColumns: "minmax(4.25rem, 1fr)",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const smallButton: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  minHeight: "1.75rem",
};

const activeSmallButton: React.CSSProperties = {
  ...smallButton,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.interaction,
};

const layerCard: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  minWidth: MAP_SPACING.zero,
};

const mutedText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const sqlBlock: React.CSSProperties = {
  margin: 0,
  maxHeight: "12rem",
  overflow: "auto",
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const statusBand: React.CSSProperties = {
  ...mapStyles.sidePanelStatusBand,
  display: "grid",
  gap: MAP_SPACING.xs,
};

const decisionActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const responsiveCardGrid: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
  alignItems: "start",
};

const detailListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const detailRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.zero}`,
};

const reviewBlock: React.CSSProperties = {
  margin: 0,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

function formatMs(value: number): string {
  if (!Number.isFinite(value)) return "0 ms";
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
}

function formatCoordinate(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Math.abs(value) >= 100 ? value.toFixed(2) : value.toFixed(3);
}

function formatBounds(bounds: [number, number, number, number]): string {
  const [west, south, east, north] = bounds;
  return `W ${formatCoordinate(west)} · S ${formatCoordinate(south)} · E ${formatCoordinate(east)} · N ${formatCoordinate(north)}`;
}

function renderMetaPill(label: string, tone: "neutral" | "ok" | "warn" = "neutral"): React.ReactNode {
  const color = tone === "ok" ? MAP_COLORS.success : tone === "warn" ? MAP_COLORS.warning : MAP_COLORS.textSecondary;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: MAP_SPACING.xs,
        minHeight: "1.25rem",
        padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
        borderRadius: MAP_RADIUS.sm,
        border: MAP_STROKES.hairlineSubtle,
        color,
        background: MAP_COLORS.bg,
        fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
        fontSize: MAP_TYPOGRAPHY.fontSize.xs,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function renderRequiredFieldPill(field: MapNLQueryRequiredField): React.ReactNode {
  const color = field.available ? MAP_COLORS.textSecondary : MAP_COLORS.error;
  return (
    <span
      key={`${field.layerId}:${field.role}:${field.fieldName}:${field.available}`}
      title={field.note ?? undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "1.25rem",
        padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
        borderRadius: MAP_RADIUS.sm,
        border: MAP_STROKES.hairlineSubtle,
        color,
        background: MAP_COLORS.bg,
        fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
        fontSize: MAP_TYPOGRAPHY.fontSize.xs,
        whiteSpace: "nowrap",
      }}
    >
      {field.role}: {field.fieldName}{field.available ? "" : " missing"}
    </span>
  );
}

function confidenceTone(preview: MapNLQueryPreview): "neutral" | "ok" | "warn" {
  if (preview.intentPreview.confidenceBand === "high") return "ok";
  if (preview.intentPreview.confidenceBand === "medium") return "neutral";
  return "warn";
}

function ambiguityTone(preview: MapNLQueryPreview): "neutral" | "ok" | "warn" {
  return preview.intentPreview.ambiguityState === "clear" ? "ok" : "warn";
}

export const MapNLQueryPanel: React.FC<MapNLQueryPanelProps> = ({
  visible,
  overlayLayers,
  selectedAoiFeature,
  currentMapBounds,
  isRunning,
  lastRunSummary,
  onRun,
  onProposalGenerated,
  onPreviewDecision,
  onClose,
  onAnnounce,
  presentation = "floating",
}) => {
  const [request, setRequest] = useState<string>(EXAMPLE_REQUESTS[0]);
  const [scope, setScope] = useState<MapNLQueryScope>("visible");
  const [mode, setMode] = useState<MapNLQueryMode>("live");
  const [copied, setCopied] = useState(false);
  const [previewDecision, setPreviewDecision] = useState<{
    previewId: string;
    decision: MapNLQueryPanelPreviewDecision;
  } | null>(null);
  const recordedProposalIdsRef = useRef<Set<string>>(new Set());
  const panelDrag = useDraggableMapPanel();

  const context = useMemo(
    () => buildMapNLQueryContext(overlayLayers, {
      scope,
      mode,
      selectedAoiFeature,
      currentMapBounds,
    }),
    [currentMapBounds, mode, overlayLayers, scope, selectedAoiFeature],
  );

  const preview = useMemo(
    () => generateMapNLQueryPreview(request, context),
    [context, request],
  );
  const previewAccepted = previewDecision?.previewId === preview.id && previewDecision.decision === "accepted";
  const previewRejected = previewDecision?.previewId === preview.id && previewDecision.decision === "rejected";
  const canRunAcceptedPreview = preview.canRun && previewAccepted && !isRunning;
  const selectedSourceIds = useMemo(() => new Set(preview.sourceLayers.map((layer) => layer.id)), [preview.sourceLayers]);
  const promptWasSanitized = preview.request !== request.trim();
  const promptGuardChanged = promptWasSanitized
    || preview.aiGuardrail.prompt.redactionCount > 0
    || preview.aiGuardrail.prompt.sanitizedMarkup;
  const outputGuardChanged = preview.aiGuardrail.output.redactionCount > 0 || preview.aiGuardrail.output.sanitizedMarkup;
  const blockedProposal = preview.blockers.length > 0
    || preview.aiGuardrail.status === "rejected"
    || preview.intentPreview.ambiguityState === "blocked";
  const guardrailToneValue = preview.aiGuardrail.status === "allowed" ? "ok" : "warn";
  const confirmationDisplayState = previewAccepted
    ? "confirmed"
    : previewRejected
      ? "rejected"
      : preview.aiGuardrail.confirmationState === "confirmed"
        ? "confirmed"
        : "required";
  const confirmationSummary = previewAccepted
    ? "Proposal confirmed. Run is now enabled for this exact preview."
    : previewRejected
      ? "Proposal rejected. Run remains disabled until a new preview is confirmed."
      : preview.canRun
        ? "Human confirmation is required. Run stays disabled until this proposal is explicitly confirmed."
        : "Resolve the blocked or unsupported state before this proposal can be confirmed.";
  const scopeSummary = scope === "selected-aoi"
    ? selectedAoiFeature
      ? "Selected AOI is active and will bound the query preview before execution."
      : "Selected AOI scope is chosen, but no AOI polygon is available yet."
    : scope === "current-extent"
      ? currentMapBounds
        ? `Current extent scope is active: ${formatBounds(currentMapBounds)}.`
        : "Current extent scope is chosen, but the map viewport is unavailable."
      : scope === "project"
        ? "Project scope can include hidden non-external project layers. Review the selected sources before apply."
        : "Visible scope limits the preview to currently visible queryable layers.";
  const promptGuardMessages = Array.from(new Set([
    ...preview.aiGuardrail.prompt.warnings,
    ...preview.aiGuardrail.output.warnings,
  ]));

  useEffect(() => {
    if (!visible || recordedProposalIdsRef.current.has(preview.id)) {
      return;
    }
    recordedProposalIdsRef.current.add(preview.id);
    onProposalGenerated?.(preview);
  }, [onProposalGenerated, preview, visible]);

  if (!visible) {
    return null;
  }

  const embedded = presentation === "embedded";

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(preview.copyText);
      setCopied(true);
      onAnnounce?.("Generated map SQL copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      onAnnounce?.("Generated map SQL could not be copied");
    }
  };

  const handlePreviewDecision = (decision: MapNLQueryPanelPreviewDecision) => {
    if (previewDecision?.previewId === preview.id && previewDecision.decision === decision) {
      return;
    }
    setPreviewDecision({ previewId: preview.id, decision });
    onPreviewDecision?.(preview, decision);
    onAnnounce?.(decision === "accepted" ? "Map query preview accepted" : "Map query preview rejected");
  };

  return (
    <div
      style={embedded
        ? embeddedPanelStyle
        : {
            ...panelBaseStyle,
            ...panelDrag.panelPositionStyle,
          }}
      role={embedded ? "region" : "dialog"}
      aria-label="Natural language map query builder"
      data-presentation={presentation}
    >
      <div
        style={embedded ? mapStyles.sidePanelHeader : { ...mapStyles.sidePanelHeader, ...panelDrag.dragHandleStyle }}
        {...(embedded ? {} : panelDrag.dragHandleProps)}
      >
        <div style={mapStyles.sidePanelTitleStack}>
          <div style={mapStyles.sidePanelEyebrow}>Map Query Builder</div>
          <div style={mapStyles.sidePanelTitle}>
            <Search size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Visible-layer NL to SQL
          </div>
        </div>
        <div style={mapStyles.sidePanelHeaderActions}>
          <button
            type="button"
            style={mapStyles.sidePanelActionButton}
            onClick={onClose}
            aria-label="Close natural language map query panel"
          >
            <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div style={{ ...mapStyles.sidePanelBody, overflowY: "auto" }}>
        <div style={statusBand}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
            <span style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {previewAccepted
                ? "AI-proposed preview confirmed for execution"
                : previewRejected
                  ? "AI-proposed preview rejected"
                  : preview.canRun
                    ? "AI-proposed preview requires confirmation"
                    : "Review required before execution"}
            </span>
            {previewAccepted ? (
              <CheckCircle2 size={MAP_ICON_SIZES.sm} color={MAP_COLORS.success} aria-hidden="true" />
            ) : (
              <AlertTriangle size={MAP_ICON_SIZES.sm} color={MAP_COLORS.warning} aria-hidden="true" />
            )}
          </div>
          <div style={chipRow}>
            {renderMetaPill(preview.modeLabel, preview.mode === "live" ? "ok" : "warn")}
            {renderMetaPill(preview.scopeLabel)}
            {renderMetaPill(preview.intentPreview.intentLabel, confidenceTone(preview))}
            {renderMetaPill(`${Math.round(preview.intentPreview.confidence * 100)}% ${preview.intentPreview.confidenceBand}`, confidenceTone(preview))}
            {renderMetaPill(`Ambiguity ${preview.intentPreview.ambiguityState}`, ambiguityTone(preview))}
            {renderMetaPill(`${context.queryableLayers.length} executable layer${context.queryableLayers.length === 1 ? "" : "s"}`)}
            {renderMetaPill(`${context.unavailableLayers.length} unavailable`)}
            {renderMetaPill(preview.aiGuardrail.auditTag, preview.aiGuardrail.status === "allowed" ? "ok" : "warn")}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Scope and Layer Limits</div>
          <div style={responsiveCardGrid}>
            <div style={layerCard}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Execution scope
              </div>
              <div style={chipRow}>
                {renderMetaPill(context.scopeLabel)}
                {renderMetaPill(context.modeLabel, context.mode === "live" ? "ok" : "warn")}
                {renderMetaPill(`${context.allLayerCount} total layer${context.allLayerCount === 1 ? "" : "s"}`)}
                {renderMetaPill(`${context.queryableLayers.length} queryable now`, context.queryableLayers.length > 0 ? "ok" : "warn")}
                {renderMetaPill(`${context.unavailableLayers.length} excluded now`, context.unavailableLayers.length > 0 ? "warn" : "neutral")}
              </div>
              <div style={mutedText}>{scopeSummary}</div>
            </div>

            <div style={layerCard}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Queryable layer scope
              </div>
              {context.queryableLayers.length > 0 ? (
                <div style={detailListStyle}>
                  {context.queryableLayers.slice(0, 5).map((layer, index) => (
                    <div
                      key={layer.id}
                      style={{
                        ...detailRowStyle,
                        ...(index > 0 ? { borderTop: MAP_STROKES.hairlineSubtle } : null),
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
                        <span style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {layer.name}
                        </span>
                        {renderMetaPill(selectedSourceIds.has(layer.id) ? "Selected by proposal" : "In scope", selectedSourceIds.has(layer.id) ? "ok" : "neutral")}
                      </div>
                      <div style={chipRow}>
                        {renderMetaPill(layer.geometryType)}
                        {renderMetaPill(layer.sourceKind)}
                        {layer.featureCount != null ? renderMetaPill(`${layer.featureCount.toLocaleString()} features`) : null}
                        {layer.crs ? renderMetaPill(layer.crs) : renderMetaPill("CRS unknown", "warn")}
                      </div>
                    </div>
                  ))}
                  {context.queryableLayers.length > 5 ? (
                    <div style={mutedText}>
                      +{context.queryableLayers.length - 5} more queryable layer{context.queryableLayers.length - 5 === 1 ? "" : "s"} remain in scope.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={mutedText}>No queryable layers are currently available in this scope and mode.</div>
              )}
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Prompt Input</div>
          <div style={mutedText}>
            The proposal below is generated from a sanitized, read-only prompt review. Raw text is never applied directly.
          </div>
          <textarea
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            style={queryInputStyle}
            aria-label="Natural language map query request"
          />
          {promptGuardChanged ? (
            <div style={layerCard}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                AI-reviewed prompt
              </div>
              <pre style={reviewBlock}>{preview.request || "No sanitized prompt available."}</pre>
              <div style={chipRow}>
                {renderMetaPill(`Prompt redactions ${preview.aiGuardrail.prompt.redactionCount}`, preview.aiGuardrail.prompt.redactionCount > 0 ? "warn" : "neutral")}
                {preview.aiGuardrail.prompt.sanitizedMarkup ? renderMetaPill("Prompt markup stripped", "warn") : null}
                {renderMetaPill(`Output redactions ${preview.aiGuardrail.output.redactionCount}`, preview.aiGuardrail.output.redactionCount > 0 ? "warn" : "neutral")}
                {preview.aiGuardrail.output.sanitizedMarkup ? renderMetaPill("Output markup stripped", "warn") : null}
              </div>
            </div>
          ) : null}
          <div style={chipRow}>
            {EXAMPLE_REQUESTS.map((example) => (
              <button
                key={example}
                type="button"
                style={smallButton}
                onClick={() => setRequest(example)}
                title={example}
              >
                {example.length > 42 ? `${example.slice(0, 39)}...` : example}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...sectionStyle, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
          <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
            <div style={sectionTitle}>Scope</div>
            <div style={segmentedGroup} role="group" aria-label="Query execution scope">
              {SCOPES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  style={scope === entry.id ? activeSmallButton : smallButton}
                  onClick={() => setScope(entry.id)}
                  aria-pressed={scope === entry.id}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
            <div style={sectionTitle}>Execution Mode</div>
            <div style={segmentedGroup} role="group" aria-label="Query execution mode">
              {MODES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  style={mode === entry.id ? activeSmallButton : smallButton}
                  onClick={() => setMode(entry.id)}
                  aria-pressed={mode === entry.id}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Interpreted Intent Preview</div>
          <div style={layerCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Proposed plan
              </div>
              {renderMetaPill(blockedProposal ? "Preview blocked" : "Preview only", blockedProposal ? "warn" : "neutral")}
            </div>
            <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              Interpreted as {preview.intentPreview.intentLabel}
            </div>
            <div style={mutedText}>{preview.intentPreview.explanation}</div>
            <div style={chipRow}>
              {renderMetaPill(preview.intentPreview.sourceLayerSelection)}
              {renderMetaPill(preview.generated.safe ? "Read-only SQL" : "SQL blocked", preview.generated.safe ? "ok" : "warn")}
              {renderMetaPill(`${preview.intentPreview.requiredLayerCount} required layer${preview.intentPreview.requiredLayerCount === 1 ? "" : "s"}`)}
              {renderMetaPill(`Output ${preview.expectedOutputType}`)}
            </div>
            {preview.sourceLayers.length > 0 ? (
              <div style={mutedText}>
                Selected sources: {preview.sourceLayers.map((layer) => layer.name).join(", ")}
              </div>
            ) : null}
            {preview.intentPreview.spatialRelations.length > 0 ? (
              <div style={mutedText}>
                Spatial relations: {preview.intentPreview.spatialRelations.join(", ")}
              </div>
            ) : null}
            {preview.intentPreview.distancesDetected.length > 0 ? (
              <div style={mutedText}>
                Distance limits: {preview.intentPreview.distancesDetected.map((entry) => `${entry.metres} m`).join(", ")}
              </div>
            ) : null}
            {preview.intentPreview.thresholdsDetected.length > 0 ? (
              <div style={mutedText}>
                Thresholds: {preview.intentPreview.thresholdsDetected.map((entry) => `${entry.operator} ${entry.value}`).join(", ")}
              </div>
            ) : null}
            {preview.intentPreview.recognisedAttributes.length > 0 ? (
              <div style={mutedText}>
                Attributes: {preview.intentPreview.recognisedAttributes.join(", ")}
              </div>
            ) : null}
            {preview.intentPreview.ambiguityReasons.length > 0 ? (
              <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
                {preview.intentPreview.ambiguityReasons.map((reason) => (
                  <div key={reason} style={{ ...mutedText, color: MAP_COLORS.warning }}>{reason}</div>
                ))}
              </div>
            ) : null}
            {preview.intentPreview.assumptions.length > 0 ? (
              <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
                {preview.intentPreview.assumptions.map((assumption) => (
                  <div key={assumption} style={mutedText}>{assumption}</div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>AI Guardrail Status</div>
          <div style={responsiveCardGrid}>
            <div style={layerCard}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Proposal guardrails
              </div>
              <div style={chipRow}>
                {renderMetaPill(preview.aiGuardrail.status === "allowed" ? "Allowed" : "Rejected", guardrailToneValue)}
                {renderMetaPill(preview.aiGuardrail.allowlistEntry ?? "No allowlist match", guardrailToneValue)}
                {renderMetaPill(preview.aiGuardrail.safeReadOnly ? "Read-only" : "Not read-only", preview.aiGuardrail.safeReadOnly ? "ok" : "warn")}
                {renderMetaPill(preview.aiGuardrail.bounded ? "Bounded scope" : "Unbounded", preview.aiGuardrail.bounded ? "ok" : "warn")}
                {renderMetaPill(preview.aiGuardrail.requiresHumanConfirmation ? "Human confirmation required" : "No confirmation required", preview.aiGuardrail.requiresHumanConfirmation ? "warn" : "ok")}
                {renderMetaPill(`Audit ${preview.aiGuardrail.auditTag}`, guardrailToneValue)}
              </div>
              <div style={mutedText}>
                The AI proposal remains review-only until the analyst confirms it. Unsupported intents and unsafe SQL stay blocked.
              </div>
            </div>

            <div style={layerCard}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Sanitization and redaction
              </div>
              <div style={chipRow}>
                {renderMetaPill(`Prompt redactions ${preview.aiGuardrail.prompt.redactionCount}`, preview.aiGuardrail.prompt.redactionCount > 0 ? "warn" : "neutral")}
                {renderMetaPill(`Output redactions ${preview.aiGuardrail.output.redactionCount}`, preview.aiGuardrail.output.redactionCount > 0 ? "warn" : "neutral")}
                {preview.aiGuardrail.prompt.sanitizedMarkup ? renderMetaPill("Prompt markup stripped", "warn") : null}
                {preview.aiGuardrail.output.sanitizedMarkup ? renderMetaPill("Output markup stripped", "warn") : null}
                {!promptGuardChanged && !outputGuardChanged ? renderMetaPill("No sanitization required", "ok") : null}
              </div>
              {promptGuardChanged ? (
                <pre style={reviewBlock}>{preview.request || "No sanitized prompt available."}</pre>
              ) : (
                <div style={mutedText}>No redaction or markup stripping was needed for this proposal.</div>
              )}
              {promptGuardMessages.length > 0 ? (
                <div style={detailListStyle}>
                  {promptGuardMessages.map((warning) => (
                    <div
                      key={warning}
                      style={{ display: "grid", gridTemplateColumns: "1rem minmax(0, 1fr)", gap: MAP_SPACING.sm, color: MAP_COLORS.textSecondary }}
                    >
                      <Info size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                      <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>{warning}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
            <div style={sectionTitle}>Affected Layers and Required Fields</div>
            <Layers size={MAP_ICON_SIZES.sm} color={MAP_COLORS.textMuted} aria-hidden="true" />
          </div>
          {preview.sourceLayers.length > 0 ? (
            <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
              {preview.sourceLayers.map((layer) => {
                const affectedLayer = preview.affectedLayers.find((entry) => entry.id === layer.id);
                return (
                  <div key={layer.id} style={layerCard}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
                      <span style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {layer.name}
                      </span>
                      {renderMetaPill(layer.tableAlias, layer.tableKind === "worker-table" ? "ok" : "neutral")}
                    </div>
                    <div style={chipRow}>
                      {renderMetaPill(layer.geometryType)}
                      {renderMetaPill(layer.sourceKind)}
                      {renderMetaPill(`QA ${layer.qaStatus}`, layer.qaStatus === "passed" ? "ok" : layer.qaStatus === "unchecked" ? "neutral" : "warn")}
                      {renderMetaPill(layer.publicationReadiness, layer.publicationReadiness === "ready" ? "ok" : "warn")}
                      {layer.featureCount != null ? renderMetaPill(`${layer.featureCount.toLocaleString()} features`) : null}
                      {layer.crs ? renderMetaPill(layer.crs) : renderMetaPill("CRS unknown", "warn")}
                    </div>
                    {affectedLayer?.requiredFields.length ? (
                      <div style={chipRow}>
                        {affectedLayer.requiredFields.map((field) => renderRequiredFieldPill(field))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={mutedText}>Missing prerequisite: select a queryable GeoJSON, imported, or worker-backed source layer.</div>
          )}
        </div>

        <div style={sectionStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: MAP_SPACING.sm }}>
            <div>
              <div style={sectionTitle}>Generated SQL / Spatial Predicate</div>
              <div style={{ ...mutedText, marginTop: MAP_SPACING.xs }}>
                Output: {preview.expectedOutputType} · Predicate: {preview.predicate}
              </div>
            </div>
            <button
              type="button"
              style={mapStyles.sidePanelActionButton}
              onClick={() => {
                void handleCopy();
              }}
              disabled={!preview.sql}
              aria-label="Copy generated SQL"
              title={preview.sql ? "Copy generated SQL." : "Missing prerequisite: generate a safe SQL preview first."}
            >
              <Copy size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre style={sqlBlock}>{preview.sql || "No SQL generated."}</pre>
        </div>

        {(preview.blockers.length > 0 || preview.warnings.length > 0) ? (
          <div style={sectionStyle}>
            <div style={sectionTitle}>{blockedProposal ? "Unsupported / Blocked Proposal" : "Execution Notes"}</div>
            <div style={layerCard}>
              <div style={{ color: blockedProposal ? MAP_COLORS.warning : MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                {blockedProposal ? "This proposal cannot be applied as written." : "Review these notes before confirmation."}
              </div>
              {preview.blockers.map((blocker) => (
                <div key={blocker} style={{ display: "grid", gridTemplateColumns: "1rem minmax(0, 1fr)", gap: MAP_SPACING.sm, color: MAP_COLORS.error }}>
                  <CircleOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>{blocker}</span>
                </div>
              ))}
              {preview.warnings.map((warning) => (
                <div key={warning} style={{ display: "grid", gridTemplateColumns: "1rem minmax(0, 1fr)", gap: MAP_SPACING.sm, color: MAP_COLORS.textSecondary }}>
                  <Info size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>{warning}</span>
                </div>
              ))}
              {preview.aiGuardrail.requiresHumanConfirmation ? (
                <div style={{ display: "grid", gridTemplateColumns: "1rem minmax(0, 1fr)", gap: MAP_SPACING.sm, color: MAP_COLORS.textSecondary }}>
                  <Info size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>
                    AI-proposed map actions require analyst confirmation before apply.
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div style={sectionStyle}>
          <div style={sectionTitle}>Preview Confirmation</div>
          <div style={layerCard}>
            <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {previewAccepted
                ? "Confirmed proposal"
                : previewRejected
                  ? "Rejected proposal"
                  : preview.canRun
                    ? "Human confirmation required"
                    : "Confirmation unavailable"}
            </div>
            <div style={mutedText}>{confirmationSummary}</div>
            <div style={chipRow}>
              {renderMetaPill(
                confirmationDisplayState === "confirmed"
                  ? "Confirmed"
                  : confirmationDisplayState === "rejected"
                    ? "Rejected"
                    : "Confirmation required",
                confirmationDisplayState === "confirmed" ? "ok" : "warn",
              )}
              {renderMetaPill(canRunAcceptedPreview ? "Run enabled" : "Run disabled", canRunAcceptedPreview ? "ok" : "warn")}
              {renderMetaPill("Proposal is review-only until confirmed", "warn")}
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
            <div style={sectionTitle}>Unavailable Layers</div>
            <Database size={MAP_ICON_SIZES.sm} color={MAP_COLORS.textMuted} aria-hidden="true" />
          </div>
          {preview.unavailableLayers.length > 0 ? (
            <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
              {preview.unavailableLayers.slice(0, 5).map((layer) => (
                <div key={layer.id} style={{ ...layerCard, gridTemplateColumns: "minmax(0, 1fr)", gap: MAP_SPACING.xs }}>
                  <span style={{ color: MAP_COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{layer.name}</span>
                  <span style={mutedText}>{layer.reason}</span>
                </div>
              ))}
              {preview.unavailableLayers.length > 5 ? (
                <div style={mutedText}>
                  +{preview.unavailableLayers.length - 5} more unavailable layer{preview.unavailableLayers.length - 5 === 1 ? "" : "s"}.
                </div>
              ) : null}
            </div>
          ) : (
            <div style={mutedText}>All layers in scope are executable for the selected mode.</div>
          )}
        </div>

        {lastRunSummary ? (
          <div style={sectionStyle}>
            <div style={sectionTitle}>Run Result</div>
            <div style={layerCard}>
              <div style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                {lastRunSummary.layerName}
              </div>
              <div style={chipRow}>
                {renderMetaPill(`${lastRunSummary.featureCount.toLocaleString()} features`, "ok")}
                {renderMetaPill(lastRunSummary.geometryType)}
                {renderMetaPill(formatMs(lastRunSummary.elapsedMs))}
              </div>
              <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
                {lastRunSummary.followUpSuggestions.map((suggestion) => (
                  <div key={suggestion} style={mutedText}>{suggestion}</div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ ...mapStyles.sidePanelHeader, justifyContent: "space-between" }}>
        <div style={mutedText}>
          {previewAccepted
            ? "Confirmed proposals create a derived query result layer; source layers remain unchanged."
            : "Run is disabled until this proposal is explicitly confirmed. Apply creates a derived query result layer; source layers remain unchanged."}
        </div>
        <div style={decisionActionsStyle}>
          <button
            type="button"
            style={previewRejected ? activeSmallButton : smallButton}
            onClick={() => handlePreviewDecision("rejected")}
            disabled={isRunning}
            aria-label="Reject interpreted map query preview"
            title="Reject this interpreted preview without changing map state."
          >
            <CircleOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Reject
          </button>
          <button
            type="button"
            style={previewAccepted ? activeSmallButton : smallButton}
            onClick={() => handlePreviewDecision("accepted")}
            disabled={!preview.canRun || isRunning}
            aria-label="Confirm AI-proposed map query preview"
            title={preview.canRun ? "Confirm this AI-proposed preview for execution." : preview.blockers[0] ?? "Resolve blockers before confirming this preview."}
          >
            <CheckCircle2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Confirm
          </button>
          <button
            type="button"
            style={{
              ...mapStyles.sidePanelPrimaryButton,
              opacity: canRunAcceptedPreview ? 1 : 0.55,
              cursor: canRunAcceptedPreview ? "pointer" : "not-allowed",
            }}
            onClick={() => {
              void onRun(preview, { confirmed: previewAccepted });
            }}
            disabled={!canRunAcceptedPreview}
            aria-label="Run accepted map query"
            title={canRunAcceptedPreview
              ? "Run the accepted query and add the result as a map layer."
              : preview.canRun
                ? "Accept this interpreted preview before execution."
                : preview.blockers[0] ?? "Missing prerequisite: resolve query blockers and choose an executable source layer."}
          >
            <Play size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            {isRunning ? "Running" : "Run Query"}
          </button>
        </div>
      </div>
    </div>
  );
};
