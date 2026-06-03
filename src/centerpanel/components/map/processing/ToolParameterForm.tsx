import React from "react";
import type { ToolParameterDescriptor } from "@/services/map/contracts/gisContracts";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";

export type ToolParameterValue = string | number | boolean;

export interface ToolParameterFormLayerOption {
  id: string;
  name: string;
}

export interface ToolParameterFormProps {
  parameters: ToolParameterDescriptor[];
  values: Readonly<Record<string, ToolParameterValue>>;
  layers: ToolParameterFormLayerOption[];
  /** Field names available for `field`-type parameters (from the chosen layer). */
  availableFields: string[];
  onChange: (key: string, value: ToolParameterValue) => void;
}

const fieldWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
};

const fieldGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
  gap: MAP_SPACING.md,
};

const fieldHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const typeBadgeStyle = (disabled: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: `1px ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  color: disabled ? MAP_COLORS.textMuted : MAP_COLORS.textSecondary,
  background: MAP_COLORS.bg,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  textTransform: "uppercase",
});

const requiredMarkStyle: React.CSSProperties = {
  color: MAP_COLORS.caveatText,
  marginLeft: MAP_SPACING.xs,
};

const controlStyle: React.CSSProperties = {
  width: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const disabledControlStyle: React.CSSProperties = {
  ...controlStyle,
  opacity: 0.6,
  cursor: "not-allowed",
};

const helpStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const metaRowStyle: React.CSSProperties = {
  display: "grid",
  gap: "2px",
};

const availabilityStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "2rem",
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

function asString(value: ToolParameterValue | undefined): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function ToolParameterForm({
  parameters,
  values,
  layers,
  availableFields,
  onChange,
}: ToolParameterFormProps): React.ReactElement {
  return (
    <div style={fieldGridStyle} data-testid="processing-tool-parameters">
      {parameters.map((parameter) => {
        const value = values[parameter.key];
        const controlId = `processing-param-${parameter.key}`;
        const testId = `processing-param-${parameter.key}`;
        const disabled = parameter.type === "layer"
          ? layers.length === 0
          : parameter.type === "field"
            ? availableFields.length === 0
            : parameter.type === "enum"
              ? (parameter.enumValues?.length ?? 0) === 0
              : false;
        const availability = parameter.type === "layer"
          ? `${layers.length} layer${layers.length === 1 ? "" : "s"} available`
          : parameter.type === "field"
            ? availableFields.length > 0
              ? `${availableFields.length} field${availableFields.length === 1 ? "" : "s"} from selected layer`
              : "Select a layer with usable fields first"
            : parameter.type === "enum"
              ? `${parameter.enumValues?.length ?? 0} option${(parameter.enumValues?.length ?? 0) === 1 ? "" : "s"}`
              : parameter.type === "number"
                ? "Numeric control"
                : parameter.type === "boolean"
                  ? "Toggle"
                  : parameter.type === "crs"
                    ? "EPSG or CRS code"
                    : null;

        let control: React.ReactNode;
        switch (parameter.type) {
          case "layer":
            control = (
              <select
                id={controlId}
                data-testid={testId}
                style={disabled ? disabledControlStyle : controlStyle}
                value={asString(value)}
                disabled={disabled}
                onChange={(event) => onChange(parameter.key, event.target.value)}
              >
                <option value="">Select a layer…</option>
                {layers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
            );
            break;
          case "field":
            control = (
              <select
                id={controlId}
                data-testid={testId}
                style={disabled ? disabledControlStyle : controlStyle}
                value={asString(value)}
                disabled={disabled}
                onChange={(event) => onChange(parameter.key, event.target.value)}
              >
                <option value="">Select a field…</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            );
            break;
          case "enum":
            control = (
              <select
                id={controlId}
                data-testid={testId}
                style={disabled ? disabledControlStyle : controlStyle}
                value={asString(value)}
                disabled={disabled}
                onChange={(event) => onChange(parameter.key, event.target.value)}
              >
                {(parameter.enumValues ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
            break;
          case "number":
            control = (
              <input
                id={controlId}
                data-testid={testId}
                type="number"
                style={controlStyle}
                value={asString(value)}
                step="any"
                inputMode="decimal"
                onChange={(event) => onChange(parameter.key, event.target.value === "" ? "" : Number(event.target.value))}
              />
            );
            break;
          case "boolean":
            control = (
              <label htmlFor={controlId} style={checkboxRowStyle}>
                <input
                  id={controlId}
                  data-testid={testId}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) => onChange(parameter.key, event.target.checked)}
                />
                <span>{parameter.label}</span>
              </label>
            );
            break;
          default:
            // text, crs, aoi → free text input
            control = (
              <input
                id={controlId}
                data-testid={testId}
                type="text"
                style={controlStyle}
                value={asString(value)}
                placeholder={parameter.type === "crs" ? "EPSG:XXXX" : undefined}
                onChange={(event) => onChange(parameter.key, event.target.value)}
              />
            );
            break;
        }

        return (
          <div key={parameter.key} style={fieldWrapStyle} data-parameter-type={parameter.type}>
            {parameter.type === "boolean" ? null : (
              <div style={fieldHeaderStyle}>
                <label htmlFor={controlId} style={labelStyle}>
                  {parameter.label}
                  {parameter.required ? <span style={requiredMarkStyle}>*</span> : null}
                </label>
                <span style={typeBadgeStyle(disabled)}>{parameterKindLabel(parameter.type)}</span>
              </div>
            )}
            {control}
            <div style={metaRowStyle}>
              {parameter.help ? <span style={helpStyle}>{parameter.help}</span> : null}
              {availability ? <span style={availabilityStyle}>{availability}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parameterKindLabel(type: ToolParameterDescriptor["type"]): string {
  switch (type) {
    case "layer":
      return "Layer";
    case "field":
      return "Field";
    case "number":
      return "Numeric";
    case "enum":
      return "Choice";
    case "boolean":
      return "Toggle";
    case "crs":
      return "CRS";
    case "aoi":
      return "AOI";
    default:
      return "Text";
  }
}
