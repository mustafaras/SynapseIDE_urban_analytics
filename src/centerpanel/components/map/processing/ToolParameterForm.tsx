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
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

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

const helpStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
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
    <div style={{ display: "grid", gap: MAP_SPACING.md }} data-testid="processing-tool-parameters">
      {parameters.map((parameter) => {
        const value = values[parameter.key];
        const controlId = `processing-param-${parameter.key}`;
        const testId = `processing-param-${parameter.key}`;

        let control: React.ReactNode;
        switch (parameter.type) {
          case "layer":
            control = (
              <select
                id={controlId}
                data-testid={testId}
                style={controlStyle}
                value={asString(value)}
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
                style={controlStyle}
                value={asString(value)}
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
                style={controlStyle}
                value={asString(value)}
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
                onChange={(event) => onChange(parameter.key, event.target.value === "" ? "" : Number(event.target.value))}
              />
            );
            break;
          case "boolean":
            control = (
              <input
                id={controlId}
                data-testid={testId}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => onChange(parameter.key, event.target.checked)}
              />
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
          <label key={parameter.key} htmlFor={controlId} style={fieldWrapStyle}>
            <span style={labelStyle}>
              {parameter.label}
              {parameter.required ? <span style={requiredMarkStyle}>*</span> : null}
            </span>
            {control}
            {parameter.help ? <span style={helpStyle}>{parameter.help}</span> : null}
          </label>
        );
      })}
    </div>
  );
}
