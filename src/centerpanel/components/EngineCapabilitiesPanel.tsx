/**
 * EngineCapabilitiesPanel — UI surface for all implemented analytical engines.
 *
 * Displayable in the Analysis section to give users visibility into
 * every engine and tool available in the workbench.
 */

import React, { useState } from 'react';

/* ── Capability definitions ──────────────────────────── */

interface EngineCapability {
  id: string;
  engine: string;
  category: 'Spatial Statistics' | 'Multivariate' | 'Data Connectors' | 'GeoAI & ML' | 'Analytical Flows';
  name: string;
  description: string;
  status: 'available' | 'preview';
  module: string;
}

const CAPABILITIES: EngineCapability[] = [
  // Spatial Statistics
  {
    id: 'sw', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: 'Spatial Weights Matrices',
    description: 'Queen, Rook, and KNN contiguity/distance weights for spatial analysis.',
    status: 'available', module: 'engine/spatial-stats/autocorrelation',
  },
  {
    id: 'gmi', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: "Global Moran's I",
    description: 'Test for global spatial autocorrelation with permutation-based inference.',
    status: 'available', module: 'engine/spatial-stats/autocorrelation',
  },
  {
    id: 'lmi', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: "Local Moran's I (LISA)",
    description: 'Identify local clusters (HH, LL) and outliers (HL, LH) with FDR correction.',
    status: 'available', module: 'engine/spatial-stats/autocorrelation',
  },
  {
    id: 'gi', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: 'Getis-Ord Gi* Hot/Cold Spots',
    description: 'Detect statistically significant spatial clusters with confidence binning.',
    status: 'available', module: 'engine/spatial-stats/autocorrelation',
  },
  {
    id: 'ehs', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: 'Emerging Hot Spot Analysis',
    description: 'Run Gi* by time step, test local trajectories with Mann-Kendall, and classify eight emerging hot spot patterns.',
    status: 'available', module: 'engine/spatial-stats/spatiotemporal',
  },
  {
    id: 'ols', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: 'OLS Regression',
    description: 'Ordinary least squares with spatial diagnostics, t-tests, and model fit metrics.',
    status: 'available', module: 'engine/spatial-stats/regression',
  },
  {
    id: 'gwr', engine: 'spatial-stats', category: 'Spatial Statistics',
    name: 'Geographically Weighted Regression',
    description: 'Spatially-varying regression with adaptive Gaussian kernel bandwidth.',
    status: 'available', module: 'engine/spatial-stats/regression',
  },

  // Multivariate
  {
    id: 'pca', engine: 'spatial-stats', category: 'Multivariate',
    name: 'Principal Component Analysis',
    description: 'Correlation-based dimensionality reduction with Kaiser criterion and scree analysis.',
    status: 'available', module: 'engine/spatial-stats/multivariate',
  },
  {
    id: 'kmeans', engine: 'spatial-stats', category: 'Multivariate',
    name: 'K-Means++ Clustering',
    description: 'Partition observations into k clusters with silhouette and elbow diagnostics.',
    status: 'available', module: 'engine/spatial-stats/multivariate',
  },
  {
    id: 'hclust', engine: 'spatial-stats', category: 'Multivariate',
    name: 'Hierarchical Clustering',
    description: 'Agglomerative clustering: single, complete, average, and Ward linkage with dendrograms.',
    status: 'available', module: 'engine/spatial-stats/multivariate',
  },

  // Data Connectors
  {
    id: 'stac', engine: 'connectors', category: 'Data Connectors',
    name: 'STAC Catalog Connector',
    description: 'Search and retrieve EO imagery from STAC-compliant catalogs.',
    status: 'available', module: 'engine/connectors/stac',
  },
  {
    id: 'cog', engine: 'connectors', category: 'Data Connectors',
    name: 'Cloud-Optimized GeoTIFF Reader',
    description: 'Stream raster windows via HTTP range requests from COG files.',
    status: 'available', module: 'engine/connectors/cog',
  },
  {
    id: 'shub', engine: 'connectors', category: 'Data Connectors',
    name: 'Sentinel Hub Process API',
    description: 'Obtain analysis-ready Sentinel-2 imagery with evalscript-driven processing.',
    status: 'available', module: 'engine/connectors/sentinel-hub',
  },

  // GeoAI & ML
  {
    id: 'onnx', engine: 'geoai', category: 'GeoAI & ML',
    name: 'ONNX Runtime Web Engine',
    description: 'In-browser model inference with WASM/WebGPU backends, memory budgeting, and LRU eviction.',
    status: 'available', module: 'engine/geoai/runtime',
  },
  {
    id: 'mreg', engine: 'geoai', category: 'GeoAI & ML',
    name: 'Model Registry',
    description: 'Catalog of built-in and user-supplied ONNX models with metadata and size tracking.',
    status: 'available', module: 'engine/geoai/runtime',
  },
  {
    id: 'lcc', engine: 'geoai', category: 'GeoAI & ML',
    name: 'Land Cover Classifier',
    description: 'Tile-based semantic segmentation pipeline for 6-class land cover mapping.',
    status: 'available', module: 'engine/geoai/cv',
  },
  {
    id: 'acc', engine: 'geoai', category: 'GeoAI & ML',
    name: 'Accuracy Reporting',
    description: 'Confusion matrix, per-class precision/recall/F1/IoU, and overall accuracy metrics.',
    status: 'available', module: 'engine/geoai/cv',
  },
  {
    id: 'yolo-urban', engine: 'geoai', category: 'GeoAI & ML',
    name: 'YOLO-Nano Urban Object Detection',
    description: 'Tile-based VHR detection of vehicles, trees, swimming pools, solar panels, and construction sites with cross-tile NMS and GeoJSON output.',
    status: 'available', module: 'engine/geoai/cv',
  },
  {
    id: 'narrative-gen', engine: 'geoai', category: 'GeoAI & ML',
    name: 'Analytical Narrative Generation',
    description: 'Template-driven narrative sections (finding, comparison, trend, recommendation, method note) with tone modes, citation anchors, and report-engine insertion.',
    status: 'available', module: 'engine/geoai/nlp',
  },

  // Analytical Flows
  {
    id: 'flow-ss', engine: 'flows', category: 'Analytical Flows',
    name: 'Site Suitability Analysis',
    description: '7-step multi-criteria weighted overlay workflow.',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-acc', engine: 'flows', category: 'Analytical Flows',
    name: 'Accessibility Analysis',
    description: '7-step network accessibility scoring with equity disaggregation.',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-vuln', engine: 'flows', category: 'Analytical Flows',
    name: 'Vulnerability Assessment',
    description: '7-step multi-hazard vulnerability mapping (IPCC framework).',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-ci', engine: 'flows', category: 'Analytical Flows',
    name: 'Composite Indicator Builder',
    description: '7-step OECD/JRC-style composite indicator workflow with uncertainty and export.',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-sc', engine: 'flows', category: 'Analytical Flows',
    name: 'Scenario Comparison',
    description: '7-step side-by-side scenario analysis.',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-eq', engine: 'flows', category: 'Analytical Flows',
    name: 'Equity Audit',
    description: '7-step distributional justice assessment workflow.',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-cd', engine: 'flows', category: 'Analytical Flows',
    name: 'Change Detection',
    description: '7-step temporal satellite/vector change analysis.',
    status: 'available', module: 'centerpanel/Flows',
  },
  {
    id: 'flow-rv', engine: 'flows', category: 'Analytical Flows',
    name: 'Analytical Run Review',
    description: '4-step read-only review of completed analytical runs.',
    status: 'available', module: 'centerpanel/Flows',
  },
];

/* ── Category UI metadata ────────────────────────────── */

const CATEGORY_META: Record<string, { icon: string; accent: string }> = {
  'Spatial Statistics': { icon: 'SS', accent: '#60A5FA' },
  'Multivariate':      { icon: 'MV', accent: '#A78BFA' },
  'Data Connectors':   { icon: 'DC', accent: '#34D399' },
  'GeoAI & ML':        { icon: 'AI', accent: '#38BDF8' },
  'Analytical Flows':  { icon: 'AF', accent: '#FB7185' },
};

const CATEGORIES = Object.keys(CATEGORY_META);

/* ── Component ───────────────────────────────────────── */

export const EngineCapabilitiesPanel: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? CAPABILITIES.filter((c) => c.category === activeCategory)
    : CAPABILITIES;

  const grouped = CATEGORIES.reduce<Record<string, EngineCapability[]>>((acc, cat) => {
    const items = filtered.filter((c) => c.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <section
      style={{
        background: 'transparent',
        borderRadius: 0,
        padding: '0.65rem 0.75rem 0.8rem',
        border: 0,
        borderBottom: '1px solid var(--syn-border-subtle, rgba(255,255,255,0.10))',
      }}
    >
      <header style={{ marginBottom: '0.65rem' }}>
        <h3
          style={{
            color: 'var(--syn-text-muted, rgba(255,255,255,0.55))',
            fontSize: '0.68rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          Engine Capabilities
        </h3>
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.68rem',
            margin: '0.25rem 0 0 0',
          }}
        >
          {CAPABILITIES.length} analytical tools across {CATEGORIES.length} categories
        </p>
      </header>

      {/* Category filter pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '0.2rem 0.5rem',
            fontSize: '0.68rem',
            fontWeight: 600,
            border: `1px solid ${!activeCategory ? 'color-mix(in srgb, var(--syn-status-info, #38BDF8) 58%, transparent)' : 'rgba(255,255,255,0.15)'}`,
            background: !activeCategory ? 'color-mix(in srgb, var(--syn-status-info, #38BDF8) 9%, transparent)' : 'transparent',
            color: !activeCategory ? 'var(--syn-text-link, var(--syn-status-info, #38BDF8))' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          All ({CAPABILITIES.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = CAPABILITIES.filter((c) => c.category === cat).length;
          const meta = CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? null : cat)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                border: `1px solid ${isActive ? meta.accent : 'rgba(255,255,255,0.15)'}`,
                background: isActive ? `${meta.accent}22` : 'transparent',
                color: isActive ? meta.accent : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {meta.icon} {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Capability cards */}
      {Object.entries(grouped).map(([category, items]) => {
        const meta = CATEGORY_META[category];
        return (
          <div key={category} style={{ marginBottom: '1rem' }}>
            <h4
              style={{
                color: meta.accent,
                fontSize: '0.72rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                borderBottom: `1px solid ${meta.accent}33`,
                paddingBottom: '0.3rem',
              }}
            >
              {meta.icon} {category}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {items.map((cap) => (
                <div
                  key={cap.id}
                  style={{
                    padding: '0.45rem 0.35rem 0.5rem',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e5e5e5', fontSize: '0.78rem', fontWeight: 600 }}>
                      {cap.name}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '0.68rem',
                        marginTop: '0.15rem',
                        lineHeight: 1.35,
                      }}
                    >
                      {cap.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      background: cap.status === 'available' ? 'rgba(52,211,153,0.12)' : 'color-mix(in srgb, var(--syn-status-info, #38BDF8) 10%, transparent)',
                      color: cap.status === 'available' ? '#34D399' : 'var(--syn-text-link, var(--syn-status-info, #38BDF8))',
                      border: `1px solid ${cap.status === 'available' ? 'rgba(52,211,153,0.3)' : 'color-mix(in srgb, var(--syn-status-info, #38BDF8) 38%, transparent)'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      borderRadius: 0,
                    }}
                  >
                    {cap.status === 'available' ? 'READY' : 'PREVIEW'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default EngineCapabilitiesPanel;
