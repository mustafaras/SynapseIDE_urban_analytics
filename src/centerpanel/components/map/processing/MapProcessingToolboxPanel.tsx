import React, { useCallback, useMemo, useState } from "react";
import { Boxes, Cpu, Play, X } from "lucide-react";
import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";
import type {
  ProcessingPreviewOutcome,
  ProcessingRunResult,
} from "@/services/map/processing";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { ToolParameterForm, type ToolParameterValue } from "./ToolParameterForm";
import { GisEmptyState, GisIconButton, GisProgressBar } from "../ui";

export interface ProcessingToolboxLayerOption {
  id: string;
  name: string;
  fields: string[];
}

export interface MapProcessingToolboxPanelProps {
  visible: boolean;
  onClose: () => void;
  searchTools: (query: string) => ProcessingToolDescriptor[];
  layers: ProcessingToolboxLayerOption[];
  onPreview: (toolId: string, params: Record<string, ToolParameterValue>) => ProcessingPreviewOutcome | null;
  onRun: (toolId: string, params: Record<string, ToolParameterValue>) => ProcessingRunResult | null;
}

type ParamMap = Record<string, ToolParameterValue>;

function defaultParams(
  descriptor: ProcessingToolDescriptor,
  layers: ProcessingToolboxLayerOption[],
): ParamMap {
  const params: ParamMap = {};
  for (const parameter of descriptor.parameters) {
    if (parameter.defaultValue !== undefined) {
      params[parameter.key] = parameter.defaultValue;
    } else if (parameter.type === "layer") {
      params[parameter.key] = layers[0]?.id ?? "";
    } else if (parameter.type === "enum") {
      params[parameter.key] = parameter.enumValues?.[0] ?? "";
    } else {
      params[parameter.key] = "";
    }
  }
  return params;
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.md,
  left: MAP_SPACING.md,
  width: "min(34rem, calc(100% - 2rem))",
  height: "min(40rem, calc(100% - 2rem))",
  zIndex: MAP_Z_INDEX.symbologyPanel + 12,
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};


const searchRowStyle: React.CSSProperties = {
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const bodyStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(10rem, 13rem) minmax(0, 1fr)",
  minHeight: 0,
};

const listStyle: React.CSSProperties = {
  borderRight: MAP_STROKES.hairlineSubtle,
  overflowY: "auto",
  display: "grid",
  gridAutoRows: "min-content",
};

const detailStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  alignContent: "start",
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

function chipStyle(tone: "neutral" | "crs" | "mode"): React.CSSProperties {
  const background =
    tone === "crs" ? MAP_COLORS.caveat : tone === "mode" ? MAP_COLORS.interactionSubtle : MAP_COLORS.neutralSubtle;
  const color = tone === "crs" ? MAP_COLORS.caveatText : MAP_COLORS.textSecondary;
  return {
    padding: `2px ${MAP_SPACING.sm}`,
    borderRadius: MAP_RADIUS.sm,
    border: MAP_STROKES.hairlineSubtle,
    background,
    color,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  };
}

function listItemStyle(active: boolean): React.CSSProperties {
  return {
    textAlign: "left",
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
    color: active ? MAP_COLORS.text : MAP_COLORS.textSecondary,
    border: MAP_STROKES.none,
    borderBottom: MAP_STROKES.hairlineSubtle,
    borderLeft: active ? `2px solid ${MAP_COLORS.interaction}` : "2px solid transparent",
    cursor: "pointer",
    display: "grid",
    gap: "2px",
  };
}

const noticeStyle = (tone: "blocked" | "caveat" | "ok"): React.CSSProperties => ({
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: tone === "blocked" ? MAP_COLORS.caveat : tone === "ok" ? MAP_COLORS.interactionSubtle : MAP_COLORS.bg,
  color: tone === "blocked" ? MAP_COLORS.caveatText : MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  display: "grid",
  gap: MAP_SPACING.xs,
});

const runButtonStyle = (disabled: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineStrong,
  background: disabled ? MAP_COLORS.neutralSubtle : MAP_COLORS.interaction,
  color: disabled ? MAP_COLORS.textMuted : MAP_COLORS.white,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  cursor: disabled ? "not-allowed" : "pointer",
});

const logStyle: React.CSSProperties = {
  margin: 0,
  padding: MAP_SPACING.sm,
  background: MAP_COLORS.bg,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "pre-wrap",
};

const RUNTIME_LABELS: Record<string, string> = {
  "main-preview": "Main-thread preview",
  worker: "Background worker",
  "geos-wasm": "GEOS (wasm)",
  duckdb: "DuckDB (wasm)",
};


export function MapProcessingToolboxPanel({
  visible,
  onClose,
  searchTools,
  layers,
  onPreview,
  onRun,
}: MapProcessingToolboxPanelProps): React.ReactElement | null {
  const [query, setQuery] = useState("");
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [paramsByTool, setParamsByTool] = useState<Record<string, ParamMap>>({});
  const [lastRun, setLastRun] = useState<ProcessingRunResult | null>(null);

  const results = useMemo(() => searchTools(query), [searchTools, query]);
  const selected = useMemo(
    () => results.find((tool) => tool.toolId === selectedToolId) ?? results[0] ?? null,
    [results, selectedToolId],
  );

  const effectiveParams = useMemo<ParamMap>(() => {
    if (!selected) return {};
    return { ...defaultParams(selected, layers), ...(paramsByTool[selected.toolId] ?? {}) };
  }, [selected, layers, paramsByTool]);

  const availableFields = useMemo(() => {
    const layerId = typeof effectiveParams.layer === "string" ? effectiveParams.layer : "";
    return layers.find((layer) => layer.id === layerId)?.fields ?? [];
  }, [effectiveParams.layer, layers]);

  const preview = useMemo(
    () => (selected ? onPreview(selected.toolId, effectiveParams) : null),
    [selected, onPreview, effectiveParams],
  );

  const handleParamChange = useCallback(
    (key: string, value: ToolParameterValue) => {
      if (!selected) return;
      setLastRun(null);
      setParamsByTool((previous) => ({
        ...previous,
        [selected.toolId]: { ...(previous[selected.toolId] ?? defaultParams(selected, layers)), [key]: value },
      }));
    },
    [selected, layers],
  );

  const handleRun = useCallback(() => {
    if (!selected) return;
    setLastRun(onRun(selected.toolId, effectiveParams));
  }, [selected, onRun, effectiveParams]);

  if (!visible) return null;

  const blockers = preview?.preview.blockers ?? [];
  const caveats = preview?.preview.caveats ?? [];
  const canRun = Boolean(selected) && blockers.length === 0;

  return (
    <section style={panelStyle} role="dialog" aria-label="Processing toolbox" data-testid="map-processing-toolbox">
      <header style={headerStyle}>
        <h2 style={titleStyle}>
          <Boxes size={16} aria-hidden /> Processing toolbox
        </h2>
        <GisIconButton label="Close processing toolbox" icon={<X size={16} aria-hidden />} onClick={onClose} size="md" />
      </header>

      <div style={searchRowStyle}>
        <input
          type="search"
          style={searchInputStyle}
          placeholder="Search tools (e.g. buffer, filter)…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          data-testid="processing-tool-search"
          aria-label="Search processing tools"
        />
      </div>

      <div style={bodyStyle}>
        <div style={listStyle} role="listbox" aria-label="Processing tools">
          {results.length === 0 ? (
            <GisEmptyState title="No tools found" description={`No tools match "${query}".`} compact />
          ) : (
            results.map((tool) => {
              const active = selected?.toolId === tool.toolId;
              return (
                <button
                  key={tool.toolId}
                  type="button"
                  role="option"
                  aria-selected={active}
                  style={listItemStyle(active)}
                  onClick={() => {
                    setSelectedToolId(tool.toolId);
                    setLastRun(null);
                  }}
                  data-testid={`processing-tool-${tool.toolId}`}
                >
                  <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.sm, fontWeight: MAP_TYPOGRAPHY.fontWeight.medium }}>
                    {tool.title}
                  </span>
                  <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
                    {tool.category}
                    {tool.implemented ? "" : " · not wired yet"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div style={detailStyle}>
          {selected ? (
            <>
              <div>
                <h3 style={{ margin: 0, fontSize: MAP_TYPOGRAPHY.fontSize.md }}>{selected.title}</h3>
                <p style={{ marginTop: MAP_SPACING.xs, color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                  {selected.summary}
                </p>
              </div>

              <div style={chipRowStyle}>
                <span style={chipStyle("neutral")}>{selected.category}</span>
                <span style={chipStyle(selected.requiresCrs ? "crs" : "neutral")} data-testid="processing-tool-crs-chip">
                  {selected.requiresCrs ? "CRS required" : "No CRS"}
                </span>
                <span style={chipStyle("mode")} data-testid="processing-tool-runtime-chip">
                  <Cpu size={11} aria-hidden style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {RUNTIME_LABELS[selected.executionMode] ?? selected.executionMode}
                </span>
              </div>

              <ToolParameterForm
                parameters={selected.parameters}
                values={effectiveParams}
                layers={layers}
                availableFields={availableFields}
                onChange={handleParamChange}
              />

              {blockers.length > 0 ? (
                <div style={noticeStyle("blocked")} data-testid="processing-preflight-blocked">
                  <strong>Blocked before run</strong>
                  {blockers.map((reason) => (
                    <span key={reason}>• {reason}</span>
                  ))}
                </div>
              ) : (
                <div style={noticeStyle("ok")} data-testid="processing-preflight-ok">
                  Ready · will produce {preview?.preview.outputFeatureCount ?? 0}{" "}
                  {preview?.preview.outputGeometryClass ?? "feature"} feature(s).
                </div>
              )}

              {caveats.length > 0 ? (
                <div style={noticeStyle("caveat")} data-testid="processing-preflight-caveats">
                  {caveats.map((caveat) => (
                    <span key={caveat}>⚠ {caveat}</span>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                style={runButtonStyle(!canRun)}
                disabled={!canRun}
                onClick={handleRun}
                data-testid="processing-tool-run"
              >
                <Play size={14} aria-hidden /> Run {selected.title}
              </button>

              {lastRun ? (
                <div
                  style={noticeStyle(lastRun.status === "applied" ? "ok" : "blocked")}
                  data-testid="processing-run-result"
                  data-run-status={lastRun.status}
                >
                  <GisProgressBar
                    value={lastRun.status === "applied" ? 100 : 8}
                    label={lastRun.status === "applied" ? "Tool applied" : "Tool blocked"}
                    color={lastRun.status === "applied" ? MAP_COLORS.success : MAP_COLORS.error}
                    height="4px"
                    data-testid="processing-run-progress"
                  />
                  {lastRun.status === "applied" ? (
                    <>
                      <strong>Applied · output layer added</strong>
                      <span data-testid="processing-run-output-layer">{lastRun.outputLayer?.name}</span>
                      <span data-testid="processing-run-manifest">
                        manifest: {lastRun.manifest?.manifestId}
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Run blocked</strong>
                      {lastRun.preview.blockers.map((reason) => (
                        <span key={reason}>• {reason}</span>
                      ))}
                    </>
                  )}
                </div>
              ) : null}

              {lastRun && lastRun.logs.length > 0 ? (
                <pre style={logStyle} data-testid="processing-run-logs">
                  {lastRun.logs.join("\n")}
                </pre>
              ) : null}
            </>
          ) : (
            <GisEmptyState title="Select a tool" description="Choose a processing tool from the list to configure and run it." compact />
          )}
        </div>
      </div>
    </section>
  );
}
