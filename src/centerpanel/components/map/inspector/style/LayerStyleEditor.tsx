import React, { useMemo, useState } from "react";
import type { ClassificationMethod } from "@/utils/classification";
import type { ColorRampName } from "@/utils/colorRamps";
import { getColorRampColors, listColorRampDefinitions } from "@/utils/colorRamps";
import type { OverlayLayerConfig } from "../../mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "../../mapTokens";
import type {
  LayerStyleEditorOptions,
  LayerStyleUpdate,
  SerializedLegendMode,
} from "./legendContract";
import {
  buildLayerStyleUpdate,
  getDefaultLayerStyleOptions,
  getLayerNumericStyleFieldNames,
  getLayerStyleFieldNames,
} from "./legendContract";

export interface LayerStyleEditorProps {
  layer: OverlayLayerConfig;
  onApplyStyle?: (layerId: string, update: LayerStyleUpdate) => void;
}

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.sm,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "2rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const rangeStyle: React.CSSProperties = {
  width: "100%",
  accentColor: MAP_COLORS.interaction,
};

const previewStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
};

const legendRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.875rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const legendLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const badgeStyle: React.CSSProperties = {
  color: MAP_COLORS.caveatText,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const noteStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const MODE_OPTIONS: Array<{ value: SerializedLegendMode; label: string }> = [
  { value: "single", label: "Single symbol" },
  { value: "choropleth", label: "Choropleth" },
  { value: "categorical", label: "Categorical" },
  { value: "graduated-symbol", label: "Graduated symbols" },
  { value: "proportional-symbol", label: "Proportional symbols" },
  { value: "heatmap", label: "Heatmap" },
];

const CLASSIFICATION_OPTIONS: Array<{ value: ClassificationMethod; label: string }> = [
  { value: "equal-interval", label: "Equal interval" },
  { value: "quantile", label: "Quantile" },
  { value: "natural-breaks", label: "Natural breaks" },
  { value: "standard-deviation", label: "Standard deviation" },
];

const COLOR_INPUT_FALLBACK = getColorRampColors("Set1", 9)[8] ?? getColorRampColors("Set1", 3)[0]!;

function isFieldDrivenMode(mode: SerializedLegendMode): boolean {
  return mode !== "single";
}

export const LayerStyleEditor: React.FC<LayerStyleEditorProps> = ({ layer, onApplyStyle }) => {
  const defaults = useMemo(() => getDefaultLayerStyleOptions(layer), [layer]);
  const allFields = useMemo(() => getLayerStyleFieldNames(layer), [layer]);
  const numericFields = useMemo(() => getLayerNumericStyleFieldNames(layer), [layer]);
  const rampOptions = useMemo(() => listColorRampDefinitions(), []);
  const [options, setOptions] = useState<LayerStyleEditorOptions>(defaults);
  const preview = useMemo(() => buildLayerStyleUpdate(layer, options), [layer, options]);
  const fieldChoices = options.mode === "categorical" ? allFields : numericFields.length > 0 ? numericFields : allFields;
  const canApply = Boolean(onApplyStyle) && (!isFieldDrivenMode(options.mode) || Boolean(options.field));

  const patchOptions = (patch: Partial<LayerStyleEditorOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  };

  return (
    <div style={{ display: "grid", gap: MAP_SPACING.md }} data-testid="map-layer-style-editor">
      <div style={sectionStyle}>
        <span style={labelStyle}>Serialized legend contract</span>
        <div style={noteStyle}>
          One legend spec drives the map overlay, layer rail, report handoff, and publication export.
        </div>
      </div>

      <div style={gridStyle}>
        <label style={sectionStyle}>
          <span style={labelStyle}>Mode</span>
          <select
            style={inputStyle}
            value={options.mode}
            onChange={(event) => {
              const mode = event.target.value as SerializedLegendMode;
              patchOptions({
                mode,
                ...(options.field ? { field: options.field } : {}),
              });
            }}
          >
            {MODE_OPTIONS.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
        </label>

        <label style={sectionStyle}>
          <span style={labelStyle}>Field</span>
          <select
            style={inputStyle}
            value={options.field ?? ""}
            onChange={(event) => patchOptions({ field: event.target.value })}
            disabled={!isFieldDrivenMode(options.mode)}
          >
            {fieldChoices.length === 0 ? <option value="">No fields available</option> : null}
            {fieldChoices.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={gridStyle}>
        <label style={sectionStyle}>
          <span style={labelStyle}>Classification</span>
          <select
            style={inputStyle}
            value={options.classificationMethod}
            onChange={(event) => patchOptions({ classificationMethod: event.target.value as ClassificationMethod })}
            disabled={options.mode === "single" || options.mode === "categorical" || options.mode === "heatmap"}
          >
            {CLASSIFICATION_OPTIONS.map((method) => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </label>

        <label style={sectionStyle}>
          <span style={labelStyle}>Ramp</span>
          <select
            style={inputStyle}
            value={options.colorRamp}
            onChange={(event) => patchOptions({ colorRamp: event.target.value as ColorRampName })}
          >
            {rampOptions.map((ramp) => (
              <option key={ramp.name} value={ramp.name}>{ramp.name} ({ramp.category})</option>
            ))}
          </select>
        </label>
      </div>

      <div style={gridStyle}>
        <label style={sectionStyle}>
          <span style={labelStyle}>Classes: {options.classCount}</span>
          <input
            style={rangeStyle}
            type="range"
            min={3}
            max={9}
            step={1}
            value={options.classCount}
            onChange={(event) => patchOptions({ classCount: Number(event.target.value) })}
          />
        </label>

        <label style={sectionStyle}>
          <span style={labelStyle}>Opacity: {Math.round(options.opacity * 100)}%</span>
          <input
            style={rangeStyle}
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={options.opacity}
            onChange={(event) => patchOptions({ opacity: Number(event.target.value) })}
          />
        </label>
      </div>

      <div style={gridStyle}>
        <label style={sectionStyle}>
          <span style={labelStyle}>No-data label</span>
          <input
            style={inputStyle}
            value={options.noDataLabel}
            onChange={(event) => patchOptions({ noDataLabel: event.target.value })}
          />
        </label>

        <label style={sectionStyle}>
          <span style={labelStyle}>No-data color</span>
          <input
            style={{ ...inputStyle, padding: 2 }}
            type="color"
            value={options.noDataColor.startsWith("#") ? options.noDataColor : COLOR_INPUT_FALLBACK}
            onChange={(event) => patchOptions({ noDataColor: event.target.value })}
          />
        </label>
      </div>

      <div style={gridStyle}>
        <label style={sectionStyle}>
          <span style={labelStyle}>Outline width: {options.outlineWidth.toFixed(1)}</span>
          <input
            style={rangeStyle}
            type="range"
            min={0}
            max={6}
            step={0.2}
            value={options.outlineWidth}
            onChange={(event) => patchOptions({ outlineWidth: Number(event.target.value) })}
          />
        </label>

        <label style={sectionStyle}>
          <span style={labelStyle}>Labels</span>
          <select
            style={inputStyle}
            value={options.labelsEnabled ? options.labelField ?? "" : ""}
            onChange={(event) => patchOptions({
              labelsEnabled: Boolean(event.target.value),
              ...(event.target.value ? { labelField: event.target.value } : {}),
            })}
          >
            <option value="">Disabled</option>
            {allFields.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={previewStyle} data-testid="map-layer-style-legend-preview">
        <div style={{ ...mapStyles.sidePanelMetricLabel, color: MAP_COLORS.textMuted }}>
          Legend spec preview / {preview.legendSpec.entries.length} entries
        </div>
        {preview.legendSpec.entries.slice(0, 10).map((entry) => (
          <div key={entry.id} style={legendRowStyle}>
            <span
              aria-hidden="true"
              style={{
                width: "0.875rem",
                height: "0.875rem",
                borderRadius: MAP_RADIUS.xs,
                background: entry.color,
                border: MAP_STROKES.hairlineSubtle,
              }}
            />
            <span style={legendLabelStyle} title={entry.label}>{entry.label}</span>
            {entry.noData ? <span style={badgeStyle}>no-data</span> : null}
          </div>
        ))}
        {preview.warnings.map((warning) => (
          <div key={warning} style={badgeStyle}>{warning}</div>
        ))}
      </div>

      <button
        type="button"
        style={{
          ...mapStyles.sidePanelActionButton,
          color: canApply ? MAP_COLORS.interaction : MAP_COLORS.textMuted,
          border: canApply ? `1px solid ${MAP_COLORS.focus}` : MAP_STROKES.hairlineSubtle,
          cursor: canApply ? "pointer" : "not-allowed",
        }}
        disabled={!canApply}
        onClick={() => onApplyStyle?.(layer.id, preview)}
      >
        Apply style + legend contract
      </button>
    </div>
  );
};
