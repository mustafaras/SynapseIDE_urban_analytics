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
  rendererMode?: SerializedLegendMode;
  onRendererModeChange?: (mode: SerializedLegendMode) => void;
  disabledModeReasons?: Partial<Record<SerializedLegendMode, string>>;
}

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
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

const bivariateGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 2,
  width: "5rem",
  minHeight: "5rem",
};

const bivariateCellStyle: React.CSSProperties = {
  minHeight: "2.25rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.xs,
};

const MODE_OPTIONS: Array<{ value: SerializedLegendMode; label: string }> = [
  { value: "single", label: "Single symbol" },
  { value: "choropleth", label: "Choropleth" },
  { value: "categorical", label: "Categorical" },
  { value: "bivariate-choropleth", label: "Bivariate choropleth" },
  { value: "dot-density", label: "Dot density" },
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

const LABEL_FONT_OPTIONS = [
  "Open Sans Regular",
  "Arial Unicode MS Regular",
  "Noto Sans Regular",
  "Inter Regular",
] as const;

const LABEL_PLACEMENT_OPTIONS: Array<{ value: LayerStyleEditorOptions["labelPlacement"]; label: string }> = [
  { value: "above", label: "Above feature" },
  { value: "center", label: "Centered" },
  { value: "below", label: "Below feature" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "line", label: "Along line" },
];

const LABEL_COLLISION_OPTIONS: Array<{ value: LayerStyleEditorOptions["labelCollisionPolicy"]; label: string }> = [
  { value: "hide-on-overlap", label: "Hide overlapping labels" },
  { value: "priority-by-field", label: "Priority by field" },
];

const COLOR_INPUT_FALLBACK = getColorRampColors("Set1", 9)[8] ?? getColorRampColors("Set1", 3)[0]!;

function isFieldDrivenMode(mode: SerializedLegendMode): boolean {
  return mode !== "single";
}

function usesClassificationControls(mode: SerializedLegendMode): boolean {
  return mode === "choropleth" || mode === "graduated-symbol" || mode === "proportional-symbol";
}

export const LayerStyleEditor: React.FC<LayerStyleEditorProps> = ({
  layer,
  onApplyStyle,
  rendererMode,
  onRendererModeChange,
  disabledModeReasons,
}) => {
  const defaults = useMemo(() => getDefaultLayerStyleOptions(layer), [layer]);
  const allFields = useMemo(() => getLayerStyleFieldNames(layer), [layer]);
  const numericFields = useMemo(() => getLayerNumericStyleFieldNames(layer), [layer]);
  const rampOptions = useMemo(() => listColorRampDefinitions(), []);
  const initialOptions = useMemo(
    () => ({
      ...defaults,
      ...(rendererMode ? { mode: rendererMode } : {}),
    }),
    [defaults, rendererMode],
  );
  const [options, setOptions] = useState<LayerStyleEditorOptions>(initialOptions);
  const preview = useMemo(() => buildLayerStyleUpdate(layer, options), [layer, options]);
  const fieldChoices = options.mode === "categorical" ? allFields : numericFields.length > 0 ? numericFields : allFields;
  const secondaryFieldChoices = numericFields.filter((field) => field !== options.field);
  const bivariateEntries = preview.legendSpec.entries.filter((entry) => entry.kind === "bivariate" && !entry.noData);
  const selectedModeDisabledReason = disabledModeReasons?.[options.mode];
  const canApply = Boolean(onApplyStyle) &&
    !selectedModeDisabledReason &&
    (!isFieldDrivenMode(options.mode) || Boolean(options.field)) &&
    (options.mode !== "bivariate-choropleth" || Boolean(options.secondaryField)) &&
    (options.mode !== "dot-density" || options.dotValuePerDot > 0) &&
    (!options.labelsEnabled || Boolean(options.labelField));

  React.useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  const patchOptions = (patch: Partial<LayerStyleEditorOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  };

  const handleModeChange = (mode: SerializedLegendMode) => {
    const nextSecondaryField = mode === "bivariate-choropleth"
      ? options.secondaryField ?? numericFields.find((field) => field !== options.field)
      : options.secondaryField;
    patchOptions({
      mode,
      ...(options.field ? { field: options.field } : {}),
      ...(nextSecondaryField ? { secondaryField: nextSecondaryField } : {}),
    });
    onRendererModeChange?.(mode);
  };

  return (
    <div style={{ display: "grid", gap: MAP_SPACING.md }} data-testid="map-layer-style-editor">
      <div style={sectionStyle}>
        <span style={labelStyle}>Serialized legend contract</span>
        <div style={noteStyle}>
          One legend spec drives the map overlay, layer rail, report handoff, and publication export.
        </div>
      </div>

      <div style={gridStyle} data-testid="map-layer-style-single-column-fields">
        <label style={sectionStyle}>
          <span style={labelStyle}>Mode</span>
          <select
            style={inputStyle}
            value={options.mode}
            data-testid="map-layer-style-mode-select"
            onChange={(event) => {
              const mode = event.target.value as SerializedLegendMode;
              handleModeChange(mode);
            }}
          >
            {MODE_OPTIONS.map((mode) => (
              <option
                key={mode.value}
                value={mode.value}
                disabled={Boolean(disabledModeReasons?.[mode.value])}
              >
                {mode.label}
              </option>
            ))}
          </select>
        </label>

        <label style={sectionStyle}>
          <span style={labelStyle}>Field</span>
          <select
            style={inputStyle}
            value={options.field ?? ""}
            onChange={(event) => {
              const field = event.target.value;
              const secondaryField = options.secondaryField === field
                ? numericFields.find((candidate) => candidate !== field)
                : options.secondaryField;
              patchOptions({ field, secondaryField });
            }}
            disabled={!isFieldDrivenMode(options.mode)}
          >
            {fieldChoices.length === 0 ? <option value="">No fields available</option> : null}
            {fieldChoices.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedModeDisabledReason ? (
        <div style={badgeStyle} data-testid="map-layer-style-mode-disabled-reason">
          {selectedModeDisabledReason}
        </div>
      ) : null}

      {options.mode === "bivariate-choropleth" ? (
        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Second field</span>
            <select
              style={inputStyle}
              value={options.secondaryField ?? ""}
              onChange={(event) => patchOptions({ secondaryField: event.target.value })}
              data-testid="map-bivariate-second-field"
            >
              {secondaryFieldChoices.length === 0 ? <option value="">No second numeric field</option> : null}
              {secondaryFieldChoices.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {options.mode === "dot-density" ? (
        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Normalize by</span>
            <select
              style={inputStyle}
              value={options.normalizationField ?? ""}
              onChange={(event) => patchOptions({ normalizationField: event.target.value || undefined })}
              data-testid="map-dot-density-normalization-field"
            >
              <option value="">None</option>
              {numericFields.filter((field) => field !== options.field).map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </label>

          <label style={sectionStyle}>
            <span style={labelStyle}>Value per dot</span>
            <input
              style={inputStyle}
              type="number"
              min={1}
              step={1}
              value={options.dotValuePerDot}
              onChange={(event) => patchOptions({ dotValuePerDot: Math.max(1, Number(event.target.value)) })}
              data-testid="map-dot-density-value-per-dot"
            />
          </label>
        </div>
      ) : null}

      <div style={gridStyle}>
        <label style={sectionStyle}>
          <span style={labelStyle}>Classification</span>
          <select
            style={inputStyle}
            value={options.classificationMethod}
            onChange={(event) => patchOptions({ classificationMethod: event.target.value as ClassificationMethod })}
            disabled={!usesClassificationControls(options.mode)}
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
            disabled={!usesClassificationControls(options.mode)}
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
          <span style={labelStyle}>Label field</span>
          <select
            style={inputStyle}
            value={options.labelsEnabled ? options.labelField ?? "" : ""}
            onChange={(event) => patchOptions({
              labelsEnabled: Boolean(event.target.value),
              ...(event.target.value ? { labelField: event.target.value } : {}),
            })}
            data-testid="map-label-field-select"
          >
            <option value="">Disabled</option>
            {allFields.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={previewStyle} data-testid="map-label-editor">
        <div style={{ ...mapStyles.sidePanelMetricLabel, color: MAP_COLORS.textMuted }}>
          Labeling
        </div>

        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Font</span>
            <select
              style={inputStyle}
              value={options.labelFontFamily}
              onChange={(event) => patchOptions({ labelFontFamily: event.target.value })}
              disabled={!options.labelsEnabled}
            >
              {LABEL_FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </label>

          <label style={sectionStyle}>
            <span style={labelStyle}>Placement</span>
            <select
              style={inputStyle}
              value={options.labelPlacement}
              onChange={(event) => patchOptions({ labelPlacement: event.target.value as LayerStyleEditorOptions["labelPlacement"] })}
              disabled={!options.labelsEnabled}
            >
              {LABEL_PLACEMENT_OPTIONS.map((placement) => (
                <option key={placement.value} value={placement.value}>{placement.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Label size: {options.labelSize}</span>
            <input
              style={rangeStyle}
              type="range"
              min={8}
              max={28}
              step={1}
              value={options.labelSize}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelSize: Number(event.target.value) })}
            />
          </label>

          <label style={sectionStyle}>
            <span style={labelStyle}>Halo width: {options.labelHaloWidth.toFixed(1)}</span>
            <input
              style={rangeStyle}
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={options.labelHaloWidth}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelHaloWidth: Number(event.target.value) })}
            />
          </label>
        </div>

        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Text color</span>
            <input
              style={{ ...inputStyle, padding: 2 }}
              type="color"
              value={options.labelColor.startsWith("#") ? options.labelColor : COLOR_INPUT_FALLBACK}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelColor: event.target.value })}
            />
          </label>

          <label style={sectionStyle}>
            <span style={labelStyle}>Halo color</span>
            <input
              style={{ ...inputStyle, padding: 2 }}
              type="color"
              value={options.labelHaloColor.startsWith("#") ? options.labelHaloColor : COLOR_INPUT_FALLBACK}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelHaloColor: event.target.value })}
            />
          </label>
        </div>

        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Collision policy</span>
            <select
              style={inputStyle}
              value={options.labelCollisionPolicy}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelCollisionPolicy: event.target.value as LayerStyleEditorOptions["labelCollisionPolicy"] })}
              data-testid="map-label-collision-policy"
            >
              {LABEL_COLLISION_OPTIONS.map((policy) => (
                <option key={policy.value} value={policy.value}>{policy.label}</option>
              ))}
            </select>
          </label>

          <label style={sectionStyle}>
            <span style={labelStyle}>Priority field</span>
            <select
              style={inputStyle}
              value={options.labelPriorityField ?? ""}
              disabled={!options.labelsEnabled || options.labelCollisionPolicy !== "priority-by-field"}
              onChange={(event) => patchOptions({ labelPriorityField: event.target.value })}
            >
              <option value="">Input order</option>
              {numericFields.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={gridStyle}>
          <label style={sectionStyle}>
            <span style={labelStyle}>Min zoom: {options.labelMinZoom}</span>
            <input
              style={rangeStyle}
              type="range"
              min={0}
              max={24}
              step={1}
              value={options.labelMinZoom}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelMinZoom: Number(event.target.value) })}
              data-testid="map-label-min-zoom"
            />
          </label>

          <label style={sectionStyle}>
            <span style={labelStyle}>Max zoom: {options.labelMaxZoom}</span>
            <input
              style={rangeStyle}
              type="range"
              min={0}
              max={24}
              step={1}
              value={options.labelMaxZoom}
              disabled={!options.labelsEnabled}
              onChange={(event) => patchOptions({ labelMaxZoom: Number(event.target.value) })}
              data-testid="map-label-max-zoom"
            />
          </label>
        </div>

        {preview.legendSpec.labels ? (
          <div style={badgeStyle} data-testid="map-label-contract-preview">
            {preview.legendSpec.labels.field} labels · {preview.legendSpec.labels.collisionPolicy} · zoom {preview.legendSpec.labels.scaleRange.minZoom}-{preview.legendSpec.labels.scaleRange.maxZoom}
          </div>
        ) : (
          <div style={noteStyle}>Label rendering is disabled for this layer.</div>
        )}
      </div>

      <div style={previewStyle} data-testid="map-layer-style-legend-preview">
        <div style={{ ...mapStyles.sidePanelMetricLabel, color: MAP_COLORS.textMuted }}>
          Legend spec preview / {preview.legendSpec.entries.length} entries
        </div>
        {bivariateEntries.length > 0 ? (
          <div style={bivariateGridStyle} data-testid="map-bivariate-legend-grid" aria-label="Bivariate 2 by 2 legend">
            {bivariateEntries.map((entry) => (
              <span
                key={entry.id}
                title={entry.label}
                aria-label={entry.label}
                style={{
                  ...bivariateCellStyle,
                  background: entry.color,
                  gridColumn: entry.gridColumn,
                  gridRow: entry.gridRow,
                }}
              />
            ))}
          </div>
        ) : null}
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
          <div key={warning} style={badgeStyle} data-testid="map-cartography-caveat">{warning}</div>
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
