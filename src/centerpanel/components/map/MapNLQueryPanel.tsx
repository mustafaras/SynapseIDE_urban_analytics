import React, { useMemo, useState } from "react";
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

export interface MapNLQueryPanelProps {
  visible: boolean;
  overlayLayers: OverlayLayerConfig[];
  selectedAoiFeature: Feature<Geometry> | null;
  currentMapBounds: [number, number, number, number] | null;
  isRunning: boolean;
  lastRunSummary: MapNLQueryPanelRunSummary | null;
  onRun: (preview: MapNLQueryPreview) => void | Promise<void>;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
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
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
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

function formatMs(value: number): string {
  if (!Number.isFinite(value)) return "0 ms";
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
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

export const MapNLQueryPanel: React.FC<MapNLQueryPanelProps> = ({
  visible,
  overlayLayers,
  selectedAoiFeature,
  currentMapBounds,
  isRunning,
  lastRunSummary,
  onRun,
  onClose,
  onAnnounce,
}) => {
  const [request, setRequest] = useState<string>(EXAMPLE_REQUESTS[0]);
  const [scope, setScope] = useState<MapNLQueryScope>("visible");
  const [mode, setMode] = useState<MapNLQueryMode>("live");
  const [copied, setCopied] = useState(false);
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

  if (!visible) {
    return null;
  }

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

  return (
    <div
      style={{
        ...panelBaseStyle,
        ...panelDrag.panelPositionStyle,
      }}
      role="dialog"
      aria-label="Natural language map query builder"
    >
      <div
        style={{ ...mapStyles.sidePanelHeader, ...panelDrag.dragHandleStyle }}
        {...panelDrag.dragHandleProps}
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
              {preview.canRun ? "Ready for reviewed execution" : "Review required before execution"}
            </span>
            {preview.canRun ? (
              <CheckCircle2 size={MAP_ICON_SIZES.sm} color={MAP_COLORS.success} aria-hidden="true" />
            ) : (
              <AlertTriangle size={MAP_ICON_SIZES.sm} color={MAP_COLORS.warning} aria-hidden="true" />
            )}
          </div>
          <div style={chipRow}>
            {renderMetaPill(preview.modeLabel, preview.mode === "live" ? "ok" : "warn")}
            {renderMetaPill(preview.scopeLabel)}
            {renderMetaPill(`${context.queryableLayers.length} executable layer${context.queryableLayers.length === 1 ? "" : "s"}`)}
            {renderMetaPill(`${context.unavailableLayers.length} unavailable`)}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Request</div>
          <textarea
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            style={queryInputStyle}
            aria-label="Natural language map query request"
          />
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
            <div style={sectionTitle}>Selected Source Layers</div>
            <Layers size={MAP_ICON_SIZES.sm} color={MAP_COLORS.textMuted} aria-hidden="true" />
          </div>
          {preview.sourceLayers.length > 0 ? (
            <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
              {preview.sourceLayers.map((layer) => (
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
                    {layer.featureCount != null ? renderMetaPill(`${layer.featureCount.toLocaleString()} features`) : null}
                    {layer.crs ? renderMetaPill(layer.crs) : renderMetaPill("CRS unknown", "warn")}
                  </div>
                </div>
              ))}
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
            <div style={sectionTitle}>Execution Notes</div>
            {preview.blockers.map((blocker) => (
              <div key={blocker} style={{ display: "grid", gridTemplateColumns: "1rem minmax(0, 1fr)", gap: MAP_SPACING.sm, color: MAP_COLORS.warning }}>
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
          </div>
        ) : null}

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
            <div style={sectionTitle}>Last Result</div>
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
          Result layers are added with amber query-highlight styling and execution metadata.
        </div>
        <button
          type="button"
          style={{
            ...mapStyles.sidePanelPrimaryButton,
            opacity: preview.canRun && !isRunning ? 1 : 0.55,
            cursor: preview.canRun && !isRunning ? "pointer" : "not-allowed",
          }}
          onClick={() => {
            void onRun(preview);
          }}
          disabled={!preview.canRun || isRunning}
          aria-label="Run reviewed map query"
          title={preview.canRun
            ? "Run the reviewed query and add the result as a map layer."
            : preview.blockers[0] ?? "Missing prerequisite: resolve query blockers and choose an executable source layer."}
        >
          <Play size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          {isRunning ? "Running" : "Run Query"}
        </button>
      </div>
    </div>
  );
};
