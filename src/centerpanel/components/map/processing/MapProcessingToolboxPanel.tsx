import React, { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Boxes, CheckCircle2, Cpu, Play, Search, X } from "lucide-react";
import type { ProcessingToolDescriptor, ToolExecutionMode } from "@/services/map/contracts/gisContracts";
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
import motionStyles from "../design/motion.module.css";

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
  presentation?: "floating" | "embedded";
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

const embeddedPanelStyle: React.CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  width: "100%",
  height: "100%",
  minHeight: "32rem",
  border: MAP_STROKES.none,
  borderRadius: 0,
  background: MAP_COLORS.bgPanel,
  boxShadow: "none",
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

const titleStackStyle: React.CSSProperties = {
  display: "grid",
  gap: "2px",
};

const eyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
};


const searchRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const searchToolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
};

const searchShellStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  background: MAP_COLORS.bg,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
};

const searchMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  whiteSpace: "nowrap",
};

const categoryRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const runtimeLegendStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const categoryChipStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `2px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: active ? MAP_STROKES.hairlineStrong : MAP_STROKES.hairlineSubtle,
  background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.bg,
  color: active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.45 : 1,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
});

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: 0,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  border: MAP_STROKES.none,
  borderRadius: 0,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  outline: MAP_STROKES.none,
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
  alignContent: "start",
};

const listCategoryHeadingStyle: React.CSSProperties = {
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md} ${MAP_SPACING.xs}`,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: 0,
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

const detailSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
};

const detailHeaderStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const listMetaRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const readinessHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const readinessCardStyle = (tone: "ready" | "blocked" | "pending"): React.CSSProperties => ({
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderRadius: MAP_RADIUS.sm,
  border: tone === "blocked" ? `1px solid ${MAP_COLORS.error}` : MAP_STROKES.hairlineSubtle,
  background: tone === "blocked" ? MAP_COLORS.selectedSubtle : MAP_COLORS.bg,
  boxShadow: tone === "ready" ? `inset 2px 0 0 ${MAP_COLORS.interaction}` : tone === "blocked" ? `inset 2px 0 0 ${MAP_COLORS.error}` : "none",
});

const readinessGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(8.5rem, 1fr))",
  gap: MAP_SPACING.sm,
};

const readinessCellStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
};

const readinessLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
};

const readinessValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const readinessListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  margin: 0,
  padding: 0,
  listStyle: "none",
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const readinessPillStyle = (tone: "ready" | "blocked" | "pending"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `2px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.full,
  border: tone === "blocked" ? `1px solid ${MAP_COLORS.error}` : tone === "ready" ? `1px solid ${MAP_COLORS.success}` : MAP_STROKES.hairlineSubtle,
  color: tone === "blocked" ? MAP_COLORS.error : tone === "ready" ? MAP_COLORS.success : MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  whiteSpace: "nowrap",
});

const executionCardStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
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

const RUNTIME_LABELS: Record<ToolExecutionMode, string> = {
  "main-preview": "Main-thread preview",
  worker: "Background worker",
  "geos-wasm": "GEOS (wasm)",
  duckdb: "DuckDB (wasm)",
};

const RUNTIME_SUMMARIES: Record<ToolExecutionMode, string> = {
  "main-preview": "Immediate preview on the active layer geometry.",
  worker: "Heavy work leaves the main thread before publication.",
  "geos-wasm": "GEOS-backed topology path for precise overlay work.",
  duckdb: "Columnar execution path for table/raster-scale processing.",
};

const ALL_RUNTIME_MODES: ToolExecutionMode[] = ["main-preview", "worker", "geos-wasm", "duckdb"];

const ALL_CATEGORIES_ID = "__all__";


export function MapProcessingToolboxPanel({
  visible,
  onClose,
  searchTools,
  layers,
  onPreview,
  onRun,
  presentation = "floating",
}: MapProcessingToolboxPanelProps): React.ReactElement | null {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES_ID);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [paramsByTool, setParamsByTool] = useState<Record<string, ParamMap>>({});
  const [lastRun, setLastRun] = useState<ProcessingRunResult | null>(null);

  const allTools = useMemo(() => searchTools(""), [searchTools]);
  const searchedTools = useMemo(() => searchProcessingTools(searchTools, allTools, query), [allTools, query, searchTools]);
  const categories = useMemo(
    () => Array.from(new Set(allTools.map((tool) => tool.category))),
    [allTools],
  );
  const results = useMemo(
    () => activeCategory === ALL_CATEGORIES_ID
      ? searchedTools
      : searchedTools.filter((tool) => tool.category === activeCategory),
    [activeCategory, searchedTools],
  );
  const groupedResults = useMemo(() => {
    const grouped = new Map<string, ProcessingToolDescriptor[]>();
    for (const tool of results) {
      const bucket = grouped.get(tool.category);
      if (bucket) {
        bucket.push(tool);
      } else {
        grouped.set(tool.category, [tool]);
      }
    }
    return Array.from(grouped.entries());
  }, [results]);
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
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of searchedTools) {
      counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
    }
    return counts;
  }, [searchedTools]);
  const wiredCount = useMemo(
    () => allTools.filter((tool) => tool.implemented).length,
    [allTools],
  );

  const runtimeLabel = selected ? RUNTIME_LABELS[selected.executionMode] ?? selected.executionMode : "Choose a tool";
  const inputLayerId = typeof effectiveParams.layer === "string" ? effectiveParams.layer : "";
  const activeInputLayer = inputLayerId ? layers.find((layer) => layer.id === inputLayerId) ?? null : null;

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
  const joinSummary = preview?.preview.joinSummary ?? null;
  const canRun = Boolean(selected) && blockers.length === 0;
  const embedded = presentation === "embedded";
  const readinessTone: "ready" | "blocked" | "pending" = !selected
    ? "pending"
    : !selected.implemented || blockers.length > 0
      ? "blocked"
      : "ready";
  const readinessLabel = !selected
    ? "Awaiting tool"
    : !selected.implemented
      ? "Not wired"
      : blockers.length > 0
        ? "Blocked"
        : "Ready";
  const readinessTitle = !selected
    ? "Choose a processing tool"
    : !selected.implemented
      ? `${selected.title} is catalogued but not yet wired`
      : blockers.length > 0
        ? `${selected.title} is missing prerequisites`
        : `${selected.title} is ready to preview and run`;

  return (
    <section
      style={embedded ? embeddedPanelStyle : panelStyle}
      className={embedded ? undefined : motionStyles.panelIn}
      role={embedded ? "region" : "dialog"}
      aria-label="Processing toolbox"
      data-testid="map-processing-toolbox"
      data-presentation={presentation}
    >
      <header style={headerStyle}>
        <div style={titleStackStyle}>
          <span style={eyebrowStyle}>Analyze · Tools</span>
          <h2 style={titleStyle}>
            <Boxes size={16} aria-hidden /> Processing toolbox
          </h2>
        </div>
        <GisIconButton label="Close processing toolbox" icon={<X size={16} aria-hidden />} onClick={onClose} size="md" />
      </header>

      <div style={searchRowStyle}>
        <div style={searchToolbarStyle}>
          <label style={searchShellStyle}>
            <Search size={14} aria-hidden color={MAP_COLORS.textMuted} />
            <input
              type="search"
              style={searchInputStyle}
              placeholder="Search tools, runtime, or GIS task…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-testid="processing-tool-search"
              aria-label="Search processing tools"
            />
          </label>
          <div style={searchMetaStyle}>
            <span>{results.length.toLocaleString()} shown</span>
            <span>{wiredCount.toLocaleString()} wired</span>
          </div>
        </div>
        <div style={categoryRowStyle}>
          <button
            type="button"
            style={categoryChipStyle(activeCategory === ALL_CATEGORIES_ID, false)}
            onClick={() => setActiveCategory(ALL_CATEGORIES_ID)}
            data-testid="processing-tool-category-filter-all"
          >
            All tools
            <span>{searchedTools.length}</span>
          </button>
          {categories.map((category) => {
            const count = categoryCounts.get(category) ?? 0;
            const disabled = count === 0;
            return (
              <button
                key={category}
                type="button"
                style={categoryChipStyle(activeCategory === category, disabled)}
                onClick={() => {
                  if (!disabled) {
                    setActiveCategory(category);
                  }
                }}
                disabled={disabled}
                data-testid={`processing-tool-category-filter-${categorySlug(category)}`}
              >
                {category}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={runtimeLegendStyle} data-testid="processing-tool-runtime-legend" aria-label="Processing runtime modes">
          <span>Runtime modes</span>
          {ALL_RUNTIME_MODES.map((mode) => (
            <span key={mode} style={chipStyle("mode")}>
              {RUNTIME_LABELS[mode]}
            </span>
          ))}
        </div>
      </div>

      <div style={bodyStyle}>
        <div style={listStyle} role="listbox" aria-label="Processing tools">
          {results.length === 0 ? (
            <GisEmptyState
              title="No tools found"
              description={query.trim().length > 0
                ? `No processing tools match "${query}"${activeCategory === ALL_CATEGORIES_ID ? "" : ` in ${activeCategory}`}.`
                : `No tools are available in ${activeCategory}.`}
              compact
            />
          ) : (
            groupedResults.map(([category, tools]) => (
              <div key={category}>
                <div style={listCategoryHeadingStyle}>{category}</div>
                {tools.map((tool) => {
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
                      <span style={listMetaRowStyle}>
                        <span>{RUNTIME_LABELS[tool.executionMode] ?? tool.executionMode}</span>
                        <span>{tool.parameters.length.toLocaleString()} parameter{tool.parameters.length === 1 ? "" : "s"}</span>
                      </span>
                      <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, color: MAP_COLORS.textMuted }}>
                        {tool.summary}
                      </span>
                      {!tool.implemented ? (
                        <span style={{ color: MAP_COLORS.warning, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                          not wired yet
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div style={detailStyle}>
          {selected ? (
            <>
              <div style={detailHeaderStyle}>
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
                  {runtimeLabel}
                </span>
                <span style={chipStyle("neutral")}>{selected.qaGated ? "QA gated" : "No QA gate"}</span>
              </div>

              <ToolParameterForm
                parameters={selected.parameters}
                values={effectiveParams}
                layers={layers}
                availableFields={availableFields}
                onChange={handleParamChange}
              />

              <div style={readinessCardStyle(readinessTone)} data-testid="processing-tool-readiness-card">
                <div style={readinessHeaderStyle}>
                  <div style={detailSectionStyle}>
                    <span style={eyebrowStyle}>Preview and readiness</span>
                    <strong>{readinessTitle}</strong>
                    <span style={{ color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                      {selected.implemented
                        ? RUNTIME_SUMMARIES[selected.executionMode] ?? "Execution mode registered in the processing descriptor."
                        : "The descriptor remains visible so analysts can see the planned tool and its runtime path without a false run state."}
                    </span>
                  </div>
                  <span style={readinessPillStyle(readinessTone)}>
                    {readinessTone === "ready" ? <CheckCircle2 size={12} aria-hidden /> : readinessTone === "blocked" ? <AlertTriangle size={12} aria-hidden /> : null}
                    {readinessLabel}
                  </span>
                </div>
                <div style={readinessGridStyle}>
                  <div style={readinessCellStyle}>
                    <span style={readinessLabelStyle}>Input</span>
                    <span style={readinessValueStyle}>{activeInputLayer?.name ?? "Select an input layer"}</span>
                  </div>
                  <div style={readinessCellStyle}>
                    <span style={readinessLabelStyle}>Runtime</span>
                    <span style={readinessValueStyle}>{runtimeLabel}</span>
                  </div>
                  <div style={readinessCellStyle}>
                    <span style={readinessLabelStyle}>Preview output</span>
                    <span style={readinessValueStyle}>
                      {preview?.preview.outputFeatureCount ?? 0} {preview?.preview.outputGeometryClass ?? "feature"}
                    </span>
                  </div>
                  <div style={readinessCellStyle}>
                    <span style={readinessLabelStyle}>Guardrails</span>
                    <span style={readinessValueStyle}>{selected.requiresCrs ? "CRS" : "No CRS"} · {selected.qaGated ? "QA" : "No QA"}</span>
                  </div>
                </div>

                {blockers.length > 0 ? (
                  <div style={noticeStyle("blocked")} data-testid="processing-preflight-blocked">
                    <strong>Blocked before run</strong>
                    <ul style={readinessListStyle}>
                      {blockers.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={noticeStyle("ok")} data-testid="processing-preflight-ok">
                    <strong>Preview ready</strong>
                    <span>
                      Will produce {preview?.preview.outputFeatureCount ?? 0} {preview?.preview.outputGeometryClass ?? "feature"} feature(s).
                    </span>
                  </div>
                )}

                {caveats.length > 0 ? (
                  <div style={noticeStyle("caveat")} data-testid="processing-preflight-caveats">
                    <strong>Visible caveats</strong>
                    <ul style={readinessListStyle}>
                      {caveats.map((caveat) => (
                        <li key={caveat}>⚠ {caveat}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {joinSummary ? (
                <div style={noticeStyle(joinSummary.cardinalityWarning ? "caveat" : "ok")} data-testid="processing-join-preview">
                  <strong>Join preview</strong>
                  <span data-testid="processing-join-matched-count">
                    Matched: {joinSummary.matchedPrimaryCount} / {joinSummary.primaryFeatureCount}
                  </span>
                  <span data-testid="processing-join-unmatched-count">
                    Unmatched: {joinSummary.unmatchedPrimaryCount}
                  </span>
                  <span data-testid="processing-join-output-count">
                    Output rows: {joinSummary.outputFeatureCount}
                  </span>
                  <span data-testid="processing-join-cardinality">
                    Cardinality: {joinSummary.cardinalityLabel}
                  </span>
                  {joinSummary.cardinalityWarning ? (
                    <span data-testid="processing-join-cardinality-warning">{joinSummary.cardinalityWarning}</span>
                  ) : null}
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
                  style={executionCardStyle}
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
                  <div style={{ ...readinessHeaderStyle, alignItems: "center" }}>
                    <strong>{lastRun.status === "applied" ? "Run applied" : "Run blocked"}</strong>
                    <span style={readinessPillStyle(lastRun.status === "applied" ? "ready" : "blocked")}>
                      {lastRun.status === "applied" ? "Published" : "Needs fixes"}
                    </span>
                  </div>
                  {lastRun.status === "applied" ? (
                    <>
                      <span data-testid="processing-run-output-layer">{lastRun.outputLayer?.name}</span>
                      <span data-testid="processing-run-manifest">
                        manifest: {lastRun.manifest?.manifestId}
                      </span>
                    </>
                  ) : (
                    <ul style={readinessListStyle}>
                      {lastRun.preview.blockers.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
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

function categorySlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function searchProcessingTools(
  searchTools: (query: string) => ProcessingToolDescriptor[],
  allTools: ProcessingToolDescriptor[],
  query: string,
): ProcessingToolDescriptor[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return allTools;

  const byId = new Map(searchTools(query).map((tool) => [tool.toolId, tool]));
  for (const tool of allTools) {
    const runtimeLabel = RUNTIME_LABELS[tool.executionMode] ?? tool.executionMode;
    const runtimeSummary = RUNTIME_SUMMARIES[tool.executionMode] ?? "";
    const haystack = `${tool.executionMode} ${runtimeLabel} ${runtimeSummary}`.toLowerCase();
    if (haystack.includes(normalized)) {
      byId.set(tool.toolId, tool);
    }
  }
  return Array.from(byId.values());
}
