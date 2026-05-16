// Urban Analytics Workbench — Script Templates Browser
// Browse, preview, and insert pre-built Python analysis scripts into the Monaco editor
import { useCallback, useMemo, useState } from "react";
import { openNewTab } from "@/services/editorBridge";

/* ------------------------------------------------------------------ */
/*  Template metadata types                                           */
/* ------------------------------------------------------------------ */

export type TemplateCategory =
  | "accessibility"
  | "morphology"
  | "remote_sensing"
  | "network"
  | "statistics"
  | "visualization";

export interface ScriptTemplate {
  readonly id: string;
  readonly name: string;
  readonly filename: string;
  readonly category: TemplateCategory;
  readonly description: string;
  readonly packages: readonly string[];
  readonly code: string;
}

/* ------------------------------------------------------------------ */
/*  Template registry (loaded from template files)                    */
/* ------------------------------------------------------------------ */

import { ACCESSIBILITY_ANALYSIS } from "./templates/accessibility_analysis";
import { NETWORK_ANALYSIS } from "./templates/network_analysis";
import { REMOTE_SENSING_NDVI } from "./templates/remote_sensing_ndvi";
import { SPATIAL_AUTOCORRELATION } from "./templates/spatial_autocorrelation";
import { URBAN_MORPHOLOGY } from "./templates/urban_morphology";

export const SCRIPT_TEMPLATES: readonly ScriptTemplate[] = [
  {
    id: "accessibility_analysis",
    name: "15-Minute City Walkability",
    filename: "accessibility_analysis.py",
    category: "accessibility",
    description: "Analyze 15-minute city walkability using OSMnx and Pandana. Computes network-based travel times to essential amenities and generates an accessibility score.",
    packages: ["osmnx", "pandana", "geopandas", "matplotlib", "numpy"],
    code: ACCESSIBILITY_ANALYSIS,
  },
  {
    id: "network_analysis",
    name: "Street Network Centrality",
    filename: "network_analysis.py",
    category: "network",
    description: "Compute betweenness and closeness centrality on the street network using OSMnx and NetworkX. Identifies critical corridors and connectivity patterns.",
    packages: ["osmnx", "networkx", "geopandas", "matplotlib", "numpy"],
    code: NETWORK_ANALYSIS,
  },
  {
    id: "remote_sensing_ndvi",
    name: "NDVI from Sentinel-2",
    filename: "remote_sensing_ndvi.py",
    category: "remote_sensing",
    description: "Compute Normalized Difference Vegetation Index (NDVI) from Sentinel-2 imagery using Rasterio. Classifies vegetation density and produces a chloropleth map.",
    packages: ["rasterio", "numpy", "matplotlib", "shapely"],
    code: REMOTE_SENSING_NDVI,
  },
  {
    id: "spatial_autocorrelation",
    name: "Moran's I & LISA",
    filename: "spatial_autocorrelation.py",
    category: "statistics",
    description: "Test for spatial autocorrelation using Global Moran's I and map Local Indicators of Spatial Association (LISA) clusters using PySAL.",
    packages: ["libpysal", "esda", "geopandas", "matplotlib", "numpy"],
    code: SPATIAL_AUTOCORRELATION,
  },
  {
    id: "urban_morphology",
    name: "Building Morphometrics",
    filename: "urban_morphology.py",
    category: "morphology",
    description: "Compute building morphometric indicators using Momepy: area, perimeter, elongation, orientation, shared walls, and tessellation-based metrics.",
    packages: ["momepy", "geopandas", "matplotlib", "shapely", "numpy"],
    code: URBAN_MORPHOLOGY,
  },
];

/* ------------------------------------------------------------------ */
/*  Category metadata                                                 */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  accessibility: "Accessibility",
  morphology: "Urban Morphology",
  remote_sensing: "Remote Sensing",
  network: "Network Analysis",
  statistics: "Spatial Statistics",
  visualization: "Visualization",
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  accessibility: "#2979ff",
  morphology: "#ab47bc",
  remote_sensing: "#66bb6a",
  network: "#ec407a",
  statistics: "#26c6da",
  visualization: "#7986cb",
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 14,
  background: "#1a1a1a",
  borderRadius: 8,
  color: "#e0e0e0",
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 13,
  maxHeight: "100%",
  overflowY: "auto",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#a4adbb",
};

const filterRow: React.CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
};

const pillBtn = (active: boolean, color: string): React.CSSProperties => ({
  padding: "3px 10px",
  borderRadius: 4,
  border: active ? `1px solid ${color}` : "1px solid #333",
  background: active ? `${color}22` : "#262626",
  color: active ? color : "#aaa",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: active ? 600 : 400,
});

const cardStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 6,
  background: "#222",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const insertBtn: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: 3,
  border: "1px solid #3794ff",
  background: "transparent",
  color: "#3794ff",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  alignSelf: "flex-start",
};

const previewBtn: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: 4,
  border: "1px solid #444",
  background: "transparent",
  color: "#aaa",
  cursor: "pointer",
  fontSize: 12,
  alignSelf: "flex-start",
};

const pkgPill: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 6px",
  borderRadius: 3,
  background: "#333",
  color: "#bbb",
  fontSize: 10,
  marginRight: 4,
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export interface ScriptTemplatesProps {
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export default function ScriptTemplates({ className, style }: ScriptTemplatesProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<TemplateCategory>();
    for (const t of SCRIPT_TEMPLATES) cats.add(t.category);
    return Array.from(cats);
  }, []);

  const filtered = activeCategory === "all"
    ? SCRIPT_TEMPLATES
    : SCRIPT_TEMPLATES.filter(t => t.category === activeCategory);

  const handleInsert = useCallback(async (template: ScriptTemplate) => {
    await openNewTab({
      filename: template.filename,
      code: template.code,
      language: "python",
    });
  }, []);

  return (
    <div style={{ ...containerStyle, ...style }} className={className}>
      <span style={titleStyle}>Python Script Templates</span>

      {/* Category filter */}
      <div style={filterRow}>
        <button
          type="button"
          style={pillBtn(activeCategory === "all", "#3794ff")}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            style={pillBtn(activeCategory === cat, CATEGORY_COLORS[cat])}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Template cards */}
      {filtered.map(t => (
        <div key={t.id} style={cardStyle}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 3,
                background: `${CATEGORY_COLORS[t.category]}22`,
                color: CATEGORY_COLORS[t.category],
                border: `1px solid ${CATEGORY_COLORS[t.category]}44`,
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {CATEGORY_LABELS[t.category]}
            </span>
          </div>

          {/* Description */}
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{t.description}</div>

          {/* Packages */}
          <div>
            {t.packages.map(p => (
              <span key={p} style={pkgPill}>{p}</span>
            ))}
          </div>

          {/* Preview toggle */}
          {previewId === t.id && (
            <pre
              style={{
                maxHeight: 220,
                overflow: "auto",
                fontSize: 11,
                lineHeight: 1.5,
                background: "#111",
                padding: 10,
                borderRadius: 4,
                color: "#ccc",
                whiteSpace: "pre-wrap",
              }}
            >
              {t.code}
            </pre>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" style={insertBtn} onClick={() => void handleInsert(t)}>
              Open in Editor
            </button>
            <button
              type="button"
              style={previewBtn}
              onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
            >
              {previewId === t.id ? "Hide Preview" : "Preview"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
