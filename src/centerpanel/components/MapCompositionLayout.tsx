import React from "react";
import type {
  MapCompositionCornerPosition,
  MapCompositionAttributionPosition,
  MapCompositionMapFit,
  MapCompositionOptions,
  MapCompositionTitlePosition,
  MapPublicationDpi,
  MapPublicationExportFormat,
  MapPublicationPageSize,
} from "@/services/map/MapExportService";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

export interface MapCompositionLayoutProps {
  options: MapCompositionOptions;
  legendAvailable?: boolean;
  visibleLayerCount?: number;
  onChange: (patch: Partial<MapCompositionOptions>) => void;
}

const sectionStyle: React.CSSProperties = {
  borderTop: `1px solid ${MAP_COLORS.amberBorder}`,
  paddingTop: MAP_SPACING.md,
  marginTop: MAP_SPACING.md,
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.amber,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.sm,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(23,23,23,0.95)",
  color: MAP_COLORS.text,
  padding: "7px 9px",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const frameStyle: React.CSSProperties = {
  position: "relative",
  aspectRatio: "210 / 297",
  minHeight: 310,
  borderRadius: MAP_RADIUS.sm,
  border: `1px dashed ${MAP_COLORS.amberBorderStrong}`,
  background: "linear-gradient(180deg, #f8fafc, #e5e7eb)",
  overflow: "hidden",
  color: "#111827",
};

const pageMarginStyle: React.CSSProperties = {
  position: "absolute",
  inset: "7%",
  border: "1px dotted rgba(17,24,39,0.35)",
};

const mapFrameStyle: React.CSSProperties = {
  position: "absolute",
  left: "10%",
  right: "10%",
  top: "20%",
  bottom: "13%",
  border: "1px dashed rgba(17,24,39,0.55)",
  background: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(245,158,11,0.12))",
};

const miniLabelStyle: React.CSSProperties = {
  position: "absolute",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 10,
  color: "#111827",
  background: "rgba(255,255,255,0.74)",
  border: "1px solid rgba(17,24,39,0.18)",
  borderRadius: 3,
  padding: "2px 4px",
};

const cornerMap: Record<MapCompositionCornerPosition, React.CSSProperties> = {
  "top-left": { left: "12%", top: "23%" },
  "top-right": { right: "12%", top: "23%" },
  "bottom-left": { left: "12%", bottom: "16%" },
  "bottom-right": { right: "12%", bottom: "16%" },
};

const titlePositionOptions: Array<{ value: MapCompositionTitlePosition; label: string }> = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
];

const attributionPositionOptions: Array<{ value: MapCompositionAttributionPosition; label: string }> = [
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

const cornerOptions: Array<{ value: MapCompositionCornerPosition; label: string }> = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

function numericValue(value: string, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

export const MapCompositionLayout: React.FC<MapCompositionLayoutProps> = ({
  options,
  legendAvailable = false,
  visibleLayerCount = 0,
  onChange,
}) => {
  return (
    <div style={{ display: "grid", gap: MAP_SPACING.md }}>
      <div>
        <h3 style={headingStyle}>Publication Composition</h3>
      </div>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Format
          <select style={inputStyle} value={options.format} onChange={(event) => onChange({ format: event.target.value as MapPublicationExportFormat })}>
            <option value="pdf">PDF</option>
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </select>
        </label>
        <label style={labelStyle}>
          DPI
          <select style={inputStyle} value={options.dpi} onChange={(event) => onChange({ dpi: Number(event.target.value) as MapPublicationDpi })}>
            <option value={72}>72</option>
            <option value={150}>150</option>
            <option value={300}>300</option>
          </select>
        </label>
        <label style={labelStyle}>
          Page size
          <select style={inputStyle} value={options.pageSize} onChange={(event) => onChange({ pageSize: event.target.value as MapPublicationPageSize })}>
            <option value="a4">A4</option>
            <option value="a3">A3</option>
            <option value="letter">Letter</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label style={labelStyle}>
          Margin (mm)
          <input
            style={inputStyle}
            type="number"
            min={4}
            max={40}
            value={options.marginMm}
            onChange={(event) => onChange({ marginMm: numericValue(event.target.value, options.marginMm, 4, 40) })}
          />
        </label>
        <label style={labelStyle}>
          Map fit
          <select style={inputStyle} value={options.mapFit} onChange={(event) => onChange({ mapFit: event.target.value as MapCompositionMapFit })}>
            <option value="contain">Full map</option>
            <option value="cover">Fill frame</option>
          </select>
        </label>
        {options.pageSize === "custom" ? (
          <>
            <label style={labelStyle}>
              Width (mm)
              <input
                style={inputStyle}
                type="number"
                min={80}
                max={1500}
                value={options.customWidthMm}
                onChange={(event) => onChange({ customWidthMm: numericValue(event.target.value, options.customWidthMm, 80, 1500) })}
              />
            </label>
            <label style={labelStyle}>
              Height (mm)
              <input
                style={inputStyle}
                type="number"
                min={80}
                max={1500}
                value={options.customHeightMm}
                onChange={(event) => onChange({ customHeightMm: numericValue(event.target.value, options.customHeightMm, 80, 1500) })}
              />
            </label>
          </>
        ) : null}
      </div>

      <div style={sectionStyle}>
        <div style={gridStyle}>
          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={options.includeTitleBlock} onChange={(event) => onChange({ includeTitleBlock: event.target.checked })} />
            Title block
          </label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Title
            <input style={inputStyle} type="text" value={options.title} disabled={!options.includeTitleBlock} onChange={(event) => onChange({ title: event.target.value })} />
          </label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Subtitle
            <input style={inputStyle} type="text" value={options.subtitle} disabled={!options.includeTitleBlock} onChange={(event) => onChange({ subtitle: event.target.value })} />
          </label>
          <label style={labelStyle}>
            Title position
            <select style={inputStyle} value={options.titlePosition} disabled={!options.includeTitleBlock} onChange={(event) => onChange({ titlePosition: event.target.value as MapCompositionTitlePosition })}>
              {titlePositionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Title size
            <input
              style={inputStyle}
              type="number"
              min={12}
              max={48}
              value={options.titleFontSize}
              disabled={!options.includeTitleBlock}
              onChange={(event) => onChange({ titleFontSize: numericValue(event.target.value, options.titleFontSize, 12, 48) })}
            />
          </label>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={gridStyle}>
          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={options.includeScaleBar} onChange={(event) => onChange({ includeScaleBar: event.target.checked })} />
            Scale bar
          </label>
          <label style={labelStyle}>
            Scale position
            <select style={inputStyle} value={options.scaleBarPosition} onChange={(event) => onChange({ scaleBarPosition: event.target.value as MapCompositionCornerPosition })} disabled={!options.includeScaleBar}>
              {cornerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Scale units
            <select style={inputStyle} value={options.scaleBarUnit} onChange={(event) => onChange({ scaleBarUnit: event.target.value as "metric" | "imperial" })} disabled={!options.includeScaleBar}>
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </label>

          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={options.includeNorthArrow} onChange={(event) => onChange({ includeNorthArrow: event.target.checked })} />
            North arrow
          </label>
          <label style={labelStyle}>
            North position
            <select style={inputStyle} value={options.northArrowPosition} onChange={(event) => onChange({ northArrowPosition: event.target.value as MapCompositionCornerPosition })} disabled={!options.includeNorthArrow}>
              {cornerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            North style
            <select style={inputStyle} value={options.northArrowStyle} onChange={(event) => onChange({ northArrowStyle: event.target.value as "simple" | "compass" })} disabled={!options.includeNorthArrow}>
              <option value="simple">Simple arrow</option>
              <option value="compass">Compass rose</option>
            </select>
          </label>

          <label style={{ ...checkboxRowStyle, opacity: legendAvailable ? 1 : 0.58 }} title={legendAvailable ? `${visibleLayerCount} visible layers available` : "No visible layers available for legend generation"}>
            <input type="checkbox" checked={options.includeLegend} disabled={!legendAvailable} onChange={(event) => onChange({ includeLegend: event.target.checked })} />
            Auto legend
          </label>
          <label style={labelStyle}>
            Legend position
            <select style={inputStyle} value={options.legendPosition} onChange={(event) => onChange({ legendPosition: event.target.value as MapCompositionCornerPosition })} disabled={!options.includeLegend || !legendAvailable}>
              {cornerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={options.includeInsetMap} onChange={(event) => onChange({ includeInsetMap: event.target.checked })} />
            Locator inset
          </label>
          <label style={labelStyle}>
            Inset position
            <select style={inputStyle} value={options.insetMapPosition} onChange={(event) => onChange({ insetMapPosition: event.target.value as MapCompositionCornerPosition })} disabled={!options.includeInsetMap}>
              {cornerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={options.includeGraticule} onChange={(event) => onChange({ includeGraticule: event.target.checked })} />
            Graticule
          </label>
          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={options.includeAttribution} onChange={(event) => onChange({ includeAttribution: event.target.checked })} />
            Attribution
          </label>
          <label style={labelStyle}>
            Attribution position
            <select style={inputStyle} value={options.attributionPosition} onChange={(event) => onChange({ attributionPosition: event.target.value as MapCompositionAttributionPosition })} disabled={!options.includeAttribution}>
              {attributionPositionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
            Attribution / source notes
            <textarea
              style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
              value={options.attributionText}
              onChange={(event) => onChange({ attributionText: event.target.value })}
              disabled={!options.includeAttribution}
            />
          </label>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: MAP_SPACING.sm, marginBottom: MAP_SPACING.sm }}>
          <span style={{ color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Print frame</span>
          <span style={{ color: MAP_COLORS.textMuted, fontSize: 10 }}>{options.pageSize.toUpperCase()} · {options.dpi} DPI</span>
        </div>
        <div style={frameStyle} aria-label="Print composition frame preview">
          <div style={pageMarginStyle} />
          <div style={mapFrameStyle} />
          {options.includeTitleBlock ? <span style={{ ...miniLabelStyle, top: "9%", ...(options.titlePosition === "top-left" ? { left: "10%" } : options.titlePosition === "top-right" ? { right: "10%" } : { left: "50%", transform: "translateX(-50%)" }) }}>Title</span> : null}
          {options.includeScaleBar ? <span style={{ ...miniLabelStyle, ...cornerMap[options.scaleBarPosition] }}>Scale</span> : null}
          {options.includeNorthArrow ? <span style={{ ...miniLabelStyle, ...cornerMap[options.northArrowPosition] }}>North</span> : null}
          {options.includeLegend && legendAvailable ? <span style={{ ...miniLabelStyle, ...cornerMap[options.legendPosition] }}>Legend</span> : null}
          {options.includeInsetMap ? <span style={{ ...miniLabelStyle, ...cornerMap[options.insetMapPosition] }}>Inset</span> : null}
          {options.includeGraticule ? <span style={{ ...miniLabelStyle, left: "42%", top: "49%", borderStyle: "dashed" }}>Grid</span> : null}
          {options.includeAttribution ? <span style={{ ...miniLabelStyle, bottom: "6%", ...(options.attributionPosition === "bottom-left" ? { left: "10%" } : options.attributionPosition === "bottom-right" ? { right: "10%" } : { left: "50%", transform: "translateX(-50%)" }) }}>Attribution</span> : null}
        </div>
      </div>
    </div>
  );
};

export default MapCompositionLayout;