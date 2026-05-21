import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

/* ──────────────────────────────────────────────────────────────
   Ambient orbital canvas — sparse signal particles drifting along
   concentric elliptical orbits in the disc's outer band. Decorative
   only: aria-hidden, no pointer interaction, very low opacity, and
   disabled under reduced-motion. Mounts only while the modal is open
   (parent unmounts it on close), so the rAF loop is scoped to the
   modal. devicePixelRatio is capped to keep GPU cost modest.
   ────────────────────────────────────────────────────────────── */

type Orbit = {
  readonly cx: number; // normalized center x [0..1]
  readonly cy: number; // normalized center y [0..1]
  readonly rx: number; // normalized radius x
  readonly ry: number; // normalized radius y
  readonly speed: number; // radians per second
  readonly dir: 1 | -1;
};

// Orbits live in the outer band so particles never cross the central
// brand/content column (kept at radius >= ~0.33 of the disc).
const WM_ORBITS: readonly Orbit[] = [
  { cx: 0.5, cy: 0.5, rx: 0.47, ry: 0.47, speed: 0.10, dir: 1 },
  { cx: 0.5, cy: 0.5, rx: 0.41, ry: 0.43, speed: 0.085, dir: -1 },
  { cx: 0.5, cy: 0.5, rx: 0.36, ry: 0.33, speed: 0.12, dir: 1 },
  { cx: 0.5, cy: 0.5, rx: 0.33, ry: 0.40, speed: 0.095, dir: -1 },
];

const PARTICLES_PER_ORBIT = 3;

type OrbitParticle = {
  orbit: Orbit;
  theta: number;
};

const AmbientFlowCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Respect reduced-motion: never start the animation loop.
    const mq = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (mq?.matches) return undefined;

    // Modest devicePixelRatio handling to avoid GPU overuse.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener('resize', resize);

    const particles: OrbitParticle[] = [];
    WM_ORBITS.forEach((orbit, oi) => {
      for (let pi = 0; pi < PARTICLES_PER_ORBIT; pi += 1) {
        particles.push({
          orbit,
          theta: (pi / PARTICLES_PER_ORBIT) * Math.PI * 2 + oi * 0.7,
        });
      }
    });

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);

      // Very faint orbit rings beneath the particles.
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(114, 221, 255, 0.045)';
      for (const orbit of WM_ORBITS) {
        ctx.beginPath();
        ctx.ellipse(
          orbit.cx * width, orbit.cy * height,
          orbit.rx * width, orbit.ry * height,
          0, 0, Math.PI * 2,
        );
        ctx.stroke();
      }

      // Glowing signal particles orbiting in the outer band.
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(58, 168, 255, 0.7)';
      ctx.fillStyle = 'rgba(170, 232, 255, 0.5)';
      for (const p of particles) {
        p.theta += p.orbit.speed * p.orbit.dir * dt;
        const x = (p.orbit.cx + p.orbit.rx * Math.cos(p.theta)) * width;
        const y = (p.orbit.cy + p.orbit.ry * Math.sin(p.theta)) * height;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="welcome-modal__flow-canvas" aria-hidden="true" />;
};

// Synapse IDE brand glyph (replicated from src/components/atoms/Logo.tsx),
// tinted to the modal cyan palette so the modal stays self-contained.
const BrandLogo: React.FC = () => (
  <svg className="brand-logo__svg" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="wmLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--wm-cyan-strong)" />
        <stop offset="100%" stopColor="var(--wm-cyan)" />
      </linearGradient>
    </defs>
    <circle className="brand-logo__node" cx="20" cy="25" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <circle className="brand-logo__node" cx="60" cy="25" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <circle className="brand-logo__core" cx="40" cy="40" r="6" fill="url(#wmLogoGrad)" />
    <circle className="brand-logo__node" cx="20" cy="55" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <circle className="brand-logo__node" cx="60" cy="55" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <path
      d="M25 25 L34 40 M46 40 L55 25 M25 55 L34 40 M46 40 L55 55"
      stroke="url(#wmLogoGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M10 40 Q20 35 30 40 Q40 45 50 40 Q60 35 70 40"
      stroke="url(#wmLogoGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
  </svg>
);

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLDivElement|null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  }, [onClose]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 6) setScrolled(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose, open]);

  useEffect(() => {
    if (open) {
      const el = ref.current?.querySelector('button') as HTMLElement | null;
      el?.focus();
    }
  }, [open]);

  if (!open && !isClosing) return null;

  const modalContent = (
    <div
      className={`welcome-modal ${isClosing ? 'welcome-modal--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Urban Analytics Workbench"
      style={{ zIndex: 2147483648 }}
    >
      <button
        type="button"
        className="welcome-modal__backdrop"
        onClick={handleClose}
        aria-label="Close welcome modal"
      />

      <div className="welcome-modal__disc-wrap">
        <div className="welcome-modal__halo" aria-hidden="true" />

        <div className="welcome-modal__panel" ref={ref}>
          <div className="welcome-modal__atmosphere" aria-hidden="true">
            <svg
              className="welcome-modal__rings"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              focusable="false"
            >
              <circle className="ring ring--1" cx="50" cy="50" r="48" />
              <circle className="ring ring--2" cx="50" cy="50" r="40" />
              <circle className="ring ring--3" cx="50" cy="50" r="31" />
              <circle className="ring ring--4" cx="50" cy="50" r="22" />
            </svg>
            <div className="welcome-modal__radar" />
            <AmbientFlowCanvas />
            <div className="welcome-modal__orbit-nodes">
              <span className="orbit-node orbit-node--a" />
              <span className="orbit-node orbit-node--b" />
              <span className="orbit-node orbit-node--c" />
              <span className="orbit-node orbit-node--d" />
              <span className="orbit-node orbit-node--e" />
            </div>
          </div>

          <header className="welcome-disc__brand">
            <span className="brand-eyebrow">
              <span className="brand-eyebrow__dot" aria-hidden="true" />
              WELCOME TO
            </span>

            <div className="brand-logo">
              <span className="brand-logo__halo" aria-hidden="true" />
              <span className="brand-logo__ring" aria-hidden="true" />
              <BrandLogo />
            </div>

            <h1 className="brand-title">
              <span className="brand-title__primary">
                <span className="brand-shine">Urban Analytics</span>
              </span>
              <span className="brand-title__sep" aria-hidden="true">·</span>
              <span className="brand-title__secondary">Workbench</span>
              <span className="brand-chip">GIS</span>
            </h1>

            <p className="brand-subtitle">
              Spatial Intelligence Platform for Urban Scientists &amp; Planners
            </p>

            <div className="brand-metrics" aria-label="Urban Analytics capability summary">
              <span className="metric-chip">
                <span className="metric-chip__value">150+</span>
                <span className="metric-chip__label">Analysis Cards</span>
              </span>
              <span className="metric-chip">
                <span className="metric-chip__value">GIS + AI</span>
                <span className="metric-chip__label">Spatial Intelligence</span>
              </span>
              <span className="metric-chip">
                <span className="metric-chip__value">Python</span>
                <span className="metric-chip__label">Analysis Engine</span>
              </span>
            </div>
          </header>

          <div className="welcome-disc__scroll" onScroll={handleScroll}>
            <div className="welcome-disc__col">
              <section className="welcome-section">
                <span className="section-eyebrow">Overview</span>
                <div className="section-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4v24M4 16h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="16" cy="16" r="3" fill="currentColor"/>
                  </svg>
                </div>
                <h2 className="section-title">About Urban Analytics Workbench</h2>
                <p className="section-text">
                  The <strong>Urban Analytics Workbench</strong> is a spatial intelligence platform
                  designed for urban scientists, planners, and geospatial analysts. Built upon the robust
                  <strong> Synapse IDE</strong> framework (
                  <a
                    href="https://github.com/mustafaras/Synapse_IDE"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{color: 'var(--syn-text-link)', textDecoration: 'none', borderBottom: '1px solid color-mix(in srgb, var(--syn-text-link) 35%, transparent)'}}
                  >
                    github.com/mustafaras/Synapse_IDE
                  </a>
                  ), this platform extends modern AI-powered development tools to the urban analytics domain.
                  Our mission is to empower spatial analysis, streamline GIS workflows, and provide
                  AI-enhanced decision support for complex urban planning challenges. Every analysis
                  keeps its method assumptions explicit and its evidence reproducible, so findings stay
                  defensible from first exploration through to the final report.
                </p>
              </section>

              <div className="features-grid">
                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2"/>
                      <path d="M14 8v6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Interactive GIS Mapping</h3>
                  <p className="feature-desc">
                    Deck.gl and Mapbox-powered map canvas with multi-layer support. Visualize choropleth,
                    heatmap, hexbin, arc, and 3D extrusion layers. Toggle satellite/vector basemaps and
                    overlay custom GeoJSON, Shapefiles, or GeoParquet data.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Deck.gl</span>
                    <span className="feature-tag">Mapbox</span>
                    <span className="feature-tag">GeoJSON</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 4v4M20 4v4M4 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Spatial Database Engine</h3>
                  <p className="feature-desc">
                    In-browser DuckDB-WASM with spatial extensions for SQL-based geospatial queries.
                    Run ST_Contains, ST_Buffer, and spatial joins on million-row datasets without
                    a backend server.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">DuckDB-WASM</span>
                    <span className="feature-tag">Spatial SQL</span>
                    <span className="feature-tag">ST_Buffer</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M4 14h7l3 6 6-12 3 6h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Python Analysis Runtime</h3>
                  <p className="feature-desc">
                    Pyodide-powered Python environment with GeoPandas, Shapely, OSMnx, NetworkX,
                    and H3 pre-loaded. Execute spatial analysis scripts directly in the browser
                    with seamless data exchange to the map canvas.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Pyodide</span>
                    <span className="feature-tag">GeoPandas</span>
                    <span className="feature-tag">Shapely</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M18 11l-6 6-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">AI Spatial Assistant</h3>
                  <p className="feature-desc">
                    Context-aware AI that understands urban planning terminology and spatial analysis.
                    Generate Python scripts, SQL queries, layer configurations, and methodology
                    recommendations from natural language descriptions.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">NL Prompts</span>
                    <span className="feature-tag">SQL Gen</span>
                    <span className="feature-tag">Methods</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M14 4v20M4 14h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="14" cy="14" r="3" fill="currentColor"/>
                      <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
                      <circle cx="14" cy="20" r="1.5" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Network Analysis</h3>
                  <p className="feature-desc">
                    Graph-based network analysis for transportation and infrastructure planning.
                    Isochrone generation, shortest-path routing, centrality metrics, and
                    service-area calculations using OSMnx road networks.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">OSMnx</span>
                    <span className="feature-tag">Isochrones</span>
                    <span className="feature-tag">Centrality</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M14 4L18 8M14 4L10 8M14 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="4" y="16" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">VoxCity 3D Integration</h3>
                  <p className="feature-desc">
                    3D urban environment modeling with building extrusion, terrain visualization,
                    shadow analysis, and viewshed calculations. Import CityGML/3D Tiles for
                    high-fidelity urban digital twins.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">CityGML</span>
                    <span className="feature-tag">3D Tiles</span>
                    <span className="feature-tag">Viewshed</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="6" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="10" cy="12" r="2" fill="currentColor"/>
                      <circle cx="18" cy="12" r="2" fill="currentColor"/>
                      <circle cx="10" cy="18" r="2" fill="currentColor"/>
                      <circle cx="18" cy="18" r="2" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">H3 Hexagonal Indexing</h3>
                  <p className="feature-desc">
                    Uber H3 hexagonal hierarchical spatial index for aggregation, clustering,
                    and multi-resolution analysis. Compare neighborhoods, compute spatial
                    autocorrelation (Moran&apos;s I), and detect hotspots.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">H3 Index</span>
                    <span className="feature-tag">Spatial Stats</span>
                    <span className="feature-tag">Hotspots</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="20" cy="14" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Streaming Data Pipeline</h3>
                  <p className="feature-desc">
                    Real-time data ingestion from OpenStreetMap, census APIs, GTFS transit feeds,
                    and sensor networks. WebSocket streaming with automatic geo-enrichment and
                    temporal aggregation.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">OSM</span>
                    <span className="feature-tag">GTFS</span>
                    <span className="feature-tag">WebSocket</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M8 14l3 3 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Report &amp; Export Tools</h3>
                  <p className="feature-desc">
                    Generate professional urban analysis reports in PDF with embedded maps, charts,
                    and statistical tables. Export layers to GeoJSON, Shapefile, GeoParquet, or
                    GeoTIFF for use in QGIS and ArcGIS.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">PDF</span>
                    <span className="feature-tag">Shapefile</span>
                    <span className="feature-tag">GeoTIFF</span>
                  </div>
                </div>

                <div className="feature-card" role="group" tabIndex={0}>
                  <div className="feature-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M8 4h12a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 10h8M10 14h8M10 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Methods &amp; Workflow Library</h3>
                  <p className="feature-desc">
                    Curated collection of urban analysis methodologies: site suitability, walkability
                    scoring, land-use classification, demographic profiling, environmental impact
                    assessment, and transport accessibility analysis.
                  </p>
                  <div className="feature-tags">
                    <span className="feature-tag">Suitability</span>
                    <span className="feature-tag">Walkability</span>
                    <span className="feature-tag">Land-use</span>
                  </div>
                </div>
              </div>

              <section className="welcome-section welcome-section--highlight">
                <span className="section-eyebrow">Foundation</span>
                <div className="section-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 4v24M4 16h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                    <circle cx="16" cy="16" r="4" fill="currentColor"/>
                  </svg>
                </div>
                <h2 className="section-title">Built on Synapse IDE Foundation</h2>
                <p className="section-text">
                  This platform leverages the <strong>Synapse IDE</strong> core architecture—an advanced
                  AI-powered integrated development environment—to deliver spatial intelligence
                  for urban analysis. By adapting Synapse IDE&apos;s natural language processing,
                  semantic code analysis, and context-aware assistance capabilities, we&apos;ve created a
                  domain-specific tool that understands geospatial terminology, urban planning concepts,
                  and spatial analysis methods. The system integrates large language models
                  with GIS engines (Deck.gl, Mapbox, DuckDB Spatial), Python scientific computing
                  (GeoPandas, Shapely, OSMnx), and 3D visualization to provide contextually relevant
                  spatial analysis that augments urban science workflows.
                </p>
                <div className="tech-badges">
                  <span className="tech-badge">Synapse Core</span>
                  <span className="tech-badge">Deck.gl + Mapbox</span>
                  <span className="tech-badge">DuckDB Spatial</span>
                  <span className="tech-badge">Python GIS</span>
                  <span className="tech-badge">AI Copilot</span>
                </div>
              </section>

              <section className="welcome-section">
                <span className="section-eyebrow">Workflow</span>
                <h2 className="section-title">Urban Analysis Workflow</h2>
                <div className="steps-list">
                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4 className="step-title">Define Study Area &amp; Load Data</h4>
                      <p className="step-desc">Use the project scoping cards to define your study area, select a CRS, and load spatial data from OSM, census APIs, GTFS feeds, or your own GeoJSON/Shapefile datasets.</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4 className="step-title">Run Spatial Analysis</h4>
                      <p className="step-desc">Execute Python scripts with GeoPandas, perform SQL spatial queries in DuckDB, compute network metrics with OSMnx, and generate H3 hexagonal aggregations—all in-browser.</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4 className="step-title">Visualize &amp; Export Results</h4>
                      <p className="step-desc">Render analysis results on the interactive map with Deck.gl layers. Generate PDF reports with embedded maps and charts, or export layers to GeoJSON, Shapefile, or GeoParquet.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="welcome-section">
                <span className="section-eyebrow">Standards</span>
                <div className="section-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 16l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="section-title">Data Standards &amp; Methodology</h2>
                <p className="section-text">
                  All analysis methods follow established geospatial and urban planning standards.
                  The platform supports OGC standards (WFS, WMS, GeoJSON), EPSG coordinate reference systems,
                  ISO 19115 metadata, and GTFS transit specifications. Spatial statistical methods are
                  grounded in peer-reviewed urban science literature, including spatial autocorrelation
                  (Anselin 1995), MAUP considerations (Openshaw 1984), and accessibility metrics
                  (Hansen 1959). AI-generated analysis recommendations cite relevant methodological
                  literature and best practices from the urban analytics research community.
                </p>
              </section>
            </div>
          </div>

          <div className={`welcome-disc__hint ${scrolled ? 'is-hidden' : ''}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Scroll</span>
          </div>

          <div className="welcome-disc__footer">
            <div className="footer-meta">
              <p className="footer-text">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Version 2.1.0 • November 2025
              </p>
              <p className="footer-text footer-text--credit">
                Developed by <strong>Mustafa Raşit Şahin, PhD</strong> • Built on{' '}
                <a
                  href="https://github.com/mustafaras/Synapse_IDE"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: 'var(--syn-text-link)', textDecoration: 'none', borderBottom: '1px solid color-mix(in srgb, var(--syn-text-link) 30%, transparent)'}}
                >
                  Synapse IDE
                </a>
              </p>
            </div>
            <button type="button" className="btn-start" onClick={handleClose}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l3 3 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start Workbench
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ────────────────────────────────────────────────────────────
           Welcome modal — Urban Analytics "Orbital Cockpit" (circular)
           ────────────────────────────────────────────────────────── */

        .welcome-modal {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483648 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px;
          animation: wmFadeIn var(--wm-duration-enter) var(--wm-ease);
          --wm-disc: min(96vmin, 1180px);
          --wm-col-max: calc(var(--wm-disc) * 0.62);
          --wm-edge-fade: 9%;
          --wm-logo-size: clamp(94px, 13.5vmin, 134px);
          --wm-wordmark: clamp(32px, 4.7vmin, 50px);
          --wm-cyan: #3aa8ff;
          --wm-cyan-strong: #72ddff;
          --wm-cyan-soft: rgba(58, 168, 255, 0.18);
          --wm-amber: #d6a84f;
          --wm-text: #eef6ff;
          --wm-muted: #9aaabd;
          --wm-subtle: #6f8197;
          --wm-surface: rgba(18, 28, 42, 0.68);
          --wm-surface-strong: rgba(25, 38, 56, 0.82);
          --wm-border-gradient: linear-gradient(132deg,
            rgba(114, 221, 255, 0.5),
            rgba(136, 176, 218, 0.12) 30%,
            rgba(214, 168, 79, 0.22) 56%,
            rgba(58, 168, 255, 0.28) 80%,
            rgba(255, 255, 255, 0.1));
          --wm-duration-fast: 160ms;
          --wm-duration-hover: 220ms;
          --wm-duration-enter: 320ms;
          --wm-duration-exit: 360ms;
          --wm-duration-panel: 480ms;
          --wm-duration-sweep: 620ms;
          --wm-ease: cubic-bezier(.16, 1, .3, 1);
          --wm-ease-firm: cubic-bezier(.2, .8, .2, 1);
        }
        @keyframes wmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wmFadeOut { from { opacity: 1; } to { opacity: 0; } }
        .welcome-modal--closing { animation: wmFadeOut var(--wm-duration-exit) ease-in forwards; }
        .welcome-modal--closing .welcome-modal__panel { animation: wmApertureOut var(--wm-duration-exit) var(--wm-ease-firm) forwards; }
        .welcome-modal--closing .welcome-modal__backdrop { animation: wmBackdropFadeOut var(--wm-duration-exit) ease-in forwards; }
        .welcome-modal--closing .welcome-modal__halo { opacity: 0; transition: opacity var(--wm-duration-exit) ease-in; }

        .welcome-modal__backdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: -1 !important;
          background:
            radial-gradient(ellipse 120% 120% at 50% 42%, rgba(7, 13, 22, 0.55), rgba(2, 5, 10, 0.94) 78%),
            linear-gradient(180deg, rgba(2, 6, 12, 0.9), rgba(3, 7, 13, 0.96)),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.014) 0 1px, transparent 1px 78px) !important;
          backdrop-filter: blur(20px) saturate(116%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(116%) !important;
          animation: wmBackdropFadeIn var(--wm-duration-enter) ease-out;
        }
        @keyframes wmBackdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wmBackdropFadeOut { from { opacity: 1; } to { opacity: 0; } }

        /* ───────── Disc wrapper + halo ───────── */

        .welcome-modal__disc-wrap {
          position: relative;
          width: var(--wm-disc);
          height: var(--wm-disc);
          aspect-ratio: 1 / 1;
          flex: 0 0 auto;
        }
        .welcome-modal__halo {
          position: absolute;
          inset: -6%;
          z-index: 0;
          border-radius: 50%;
          pointer-events: none;
          background: conic-gradient(from 0deg,
            rgba(58, 168, 255, 0) 0deg,
            rgba(114, 221, 255, 0.24) 58deg,
            rgba(58, 168, 255, 0) 128deg,
            rgba(214, 168, 79, 0.14) 208deg,
            rgba(58, 168, 255, 0) 296deg,
            rgba(114, 221, 255, 0.2) 360deg);
          filter: blur(28px);
          opacity: 0.55;
          animation: wmHaloSpin 64s linear infinite;
        }
        .welcome-modal__halo::after {
          content: "";
          position: absolute;
          inset: 7%;
          border-radius: 50%;
          box-shadow: 0 0 90px 8px rgba(58, 168, 255, 0.2);
        }
        @keyframes wmHaloSpin { to { transform: rotate(360deg); } }

        /* ───────── Circular panel shell ───────── */

        .welcome-modal__panel {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          isolation: isolate;
          overflow: hidden;
          padding: clamp(26px, 6%, 60px) 0 clamp(22px, 5%, 50px);
          clip-path: circle(75% at 50% 50%);
          background:
            radial-gradient(circle at 50% 30%, rgba(18, 30, 48, 0.92), rgba(7, 12, 20, 0.96) 72%) padding-box,
            var(--wm-border-gradient) border-box;
          border: 1px solid transparent;
          backdrop-filter: blur(22px) saturate(122%);
          -webkit-backdrop-filter: blur(22px) saturate(122%);
          box-shadow:
            0 42px 110px -24px rgba(0, 0, 0, 0.74),
            0 0 0 1px rgba(58, 168, 255, 0.1),
            0 0 64px rgba(58, 168, 255, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          animation: wmApertureIn var(--wm-duration-panel) var(--wm-ease);
        }
        .welcome-modal__panel::before {
          content: "";
          position: absolute;
          inset: 3px;
          z-index: 6;
          border-radius: 50%;
          pointer-events: none;
          border: 1px solid rgba(114, 221, 255, 0.14);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.045),
            inset 0 34px 64px -46px rgba(255, 255, 255, 0.34),
            inset 0 -70px 130px -50px rgba(0, 0, 0, 0.55);
        }
        @keyframes wmApertureIn {
          from { opacity: 0; transform: scale(.92); clip-path: circle(0% at 50% 50%); }
          to   { opacity: 1; transform: scale(1);   clip-path: circle(75% at 50% 50%); }
        }
        @keyframes wmApertureOut {
          from { opacity: 1; transform: scale(1);  clip-path: circle(75% at 50% 50%); }
          to   { opacity: 0; transform: scale(.9); clip-path: circle(0% at 50% 50%); }
        }

        /* ───────── Orbital atmosphere ───────── */

        .welcome-modal__atmosphere {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          border-radius: 50%;
          overflow: hidden;
        }
        .welcome-modal__rings {
          position: absolute;
          inset: 3%;
          width: 94%;
          height: 94%;
          opacity: 0.6;
        }
        .welcome-modal__rings .ring {
          fill: none;
          stroke: rgba(114, 221, 255, 0.1);
          stroke-width: 0.22;
          transform-origin: 50% 50%;
        }
        .welcome-modal__rings .ring--2 {
          stroke: rgba(114, 221, 255, 0.09);
          stroke-dasharray: 1.5 3;
          animation: wmRingSpin 84s linear infinite;
        }
        .welcome-modal__rings .ring--3 { stroke: rgba(214, 168, 79, 0.08); }
        .welcome-modal__rings .ring--4 {
          stroke: rgba(114, 221, 255, 0.08);
          stroke-dasharray: 0.8 4;
          animation: wmRingSpin 62s linear infinite reverse;
        }
        @keyframes wmRingSpin { to { transform: rotate(360deg); } }

        .welcome-modal__radar {
          position: absolute;
          inset: 3%;
          border-radius: 50%;
          background: conic-gradient(from 0deg,
            rgba(114, 221, 255, 0.14),
            rgba(114, 221, 255, 0) 40deg);
          opacity: 0.5;
          mix-blend-mode: screen;
          -webkit-mask-image: radial-gradient(circle, #000 60%, transparent 63%);
          mask-image: radial-gradient(circle, #000 60%, transparent 63%);
          animation: wmRadarSweep 16s linear infinite;
        }
        @keyframes wmRadarSweep { to { transform: rotate(360deg); } }

        .welcome-modal__flow-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.5;
          mix-blend-mode: screen;
        }

        .welcome-modal__orbit-nodes {
          position: absolute;
          inset: 10%;
          border-radius: 50%;
          animation: wmRingSpin 96s linear infinite;
        }
        .orbit-node {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 0 1px rgba(114, 221, 255, 0.22), 0 0 14px rgba(58, 168, 255, 0.6);
          opacity: 0.5;
          animation: wmSignalPulse 6.5s ease-in-out infinite;
        }
        .orbit-node--a { top: -2px; left: 50%; }
        .orbit-node--b { top: 50%; right: -2px; animation-delay: -2s; }
        .orbit-node--c { bottom: -2px; left: 42%; animation-delay: -3.6s; background: var(--wm-amber); }
        .orbit-node--d { top: 16%; left: 8%; animation-delay: -1.2s; }
        .orbit-node--e { bottom: 13%; right: 11%; animation-delay: -4.7s; }
        @keyframes wmSignalPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          48%      { opacity: 0.66; transform: scale(1.22); }
          74%      { opacity: 0.42; transform: scale(1); }
        }

        /* ───────── Brand identity zone (top arc) ───────── */

        .welcome-disc__brand {
          position: relative;
          z-index: 3;
          flex: 0 0 auto;
          width: min(72%, 620px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 9px;
          padding-top: clamp(2px, 1.5vmin, 14px);
        }
        .brand-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 12px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          color: color-mix(in srgb, var(--wm-cyan-strong) 82%, var(--wm-text));
          background: linear-gradient(180deg, rgba(58, 168, 255, 0.16), rgba(58, 168, 255, 0.07));
          border: 1px solid rgba(114, 221, 255, 0.3);
          border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 18px rgba(58, 168, 255, 0.1);
        }
        .brand-eyebrow__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 10px rgba(114, 221, 255, 0.85);
          animation: wmDotBlink 2s ease-in-out infinite;
        }
        @keyframes wmDotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: .45; transform: scale(.82); }
        }

        .brand-logo {
          position: relative;
          width: var(--wm-logo-size);
          height: var(--wm-logo-size);
          display: grid;
          place-items: center;
          margin: 2px 0 1px;
        }
        .brand-logo__svg { width: 100%; height: 100%; position: relative; z-index: 2; }
        .brand-logo__halo {
          position: absolute;
          inset: -24%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(58, 168, 255, 0.42), rgba(58, 168, 255, 0.12) 48%, transparent 70%);
          filter: blur(11px);
          z-index: 0;
          animation: wmHaloBreathe 4.6s ease-in-out infinite;
        }
        @keyframes wmHaloBreathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.92; transform: scale(1.08); }
        }
        .brand-logo__ring {
          position: absolute;
          inset: -10%;
          border-radius: 50%;
          z-index: 1;
          background: conic-gradient(from 0deg,
            transparent 0deg,
            rgba(114, 221, 255, 0.5) 40deg,
            transparent 120deg,
            transparent 240deg,
            rgba(214, 168, 79, 0.34) 300deg,
            transparent 360deg);
          -webkit-mask: radial-gradient(circle, transparent 60%, #000 61%, #000 70%, transparent 71%);
          mask: radial-gradient(circle, transparent 60%, #000 61%, #000 70%, transparent 71%);
          animation: wmRingSpin 18s linear infinite;
        }
        .brand-logo__core { transform-origin: center; transform-box: fill-box; animation: wmCorePulse 2.6s ease-in-out infinite; }
        .brand-logo__node { transform-origin: center; transform-box: fill-box; animation: wmNodePulse 3s ease-in-out infinite; }
        .brand-logo__node:nth-of-type(2) { animation-delay: .5s; }
        .brand-logo__node:nth-of-type(4) { animation-delay: 1s; }
        .brand-logo__node:nth-of-type(5) { animation-delay: 1.5s; }
        @keyframes wmCorePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.16); opacity: 0.9; }
        }
        @keyframes wmNodePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.18); }
        }

        .brand-title {
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: center;
          gap: 4px 10px;
          font-size: var(--wm-wordmark);
          font-weight: 700;
          letter-spacing: -0.018em;
          line-height: 1.04;
        }
        .brand-title__primary { color: var(--syn-text-default, var(--wm-text)); }
        .brand-shine {
          background: linear-gradient(100deg,
            var(--wm-text) 0%,
            var(--wm-text) 36%,
            color-mix(in srgb, var(--wm-cyan-strong) 92%, #ffffff) 50%,
            var(--wm-text) 64%,
            var(--wm-text) 100%);
          background-size: 300% 100%;
          background-position: 100% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: wmBrandShine 4.8s cubic-bezier(.4, 0, .2, 1) infinite;
        }
        @keyframes wmBrandShine {
          0%, 18%   { background-position: 100% 50%; }
          72%, 100% { background-position: 0% 50%; }
        }
        .brand-title__sep { color: var(--wm-subtle); font-weight: 300; opacity: 0.5; }
        .brand-title__secondary { color: color-mix(in srgb, var(--wm-muted) 60%, var(--wm-text)); font-weight: 600; }
        .brand-chip {
          align-self: center;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 7px;
          background: linear-gradient(180deg, rgba(214, 168, 79, 0.18), rgba(214, 168, 79, 0.1));
          border: 1px solid rgba(214, 168, 79, 0.4);
          color: color-mix(in srgb, var(--wm-amber) 88%, #ffffff);
          letter-spacing: 0.14em;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 14px rgba(214, 168, 79, 0.2);
        }

        .brand-subtitle {
          margin: 1px 0 0;
          font-size: 13px;
          line-height: 1.42;
          color: color-mix(in srgb, var(--wm-muted) 88%, var(--wm-text));
          max-width: 460px;
        }

        .brand-metrics {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }
        .metric-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 7px 14px;
          border-radius: 14px;
          border: 1px solid rgba(136, 176, 218, 0.24);
          background:
            linear-gradient(180deg, rgba(24, 42, 62, 0.84), rgba(8, 14, 23, 0.6)),
            linear-gradient(100deg, rgba(58, 168, 255, 0.08), transparent 60%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 10px 22px -18px rgba(58, 168, 255, 0.8);
          transition: background-color var(--wm-duration-hover) var(--wm-ease), box-shadow var(--wm-duration-hover) var(--wm-ease);
        }
        .metric-chip:hover {
          background:
            linear-gradient(180deg, rgba(31, 52, 76, 0.9), rgba(10, 18, 29, 0.66)),
            linear-gradient(100deg, rgba(58, 168, 255, 0.12), transparent 60%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 0 16px rgba(58, 168, 255, 0.2);
        }
        .metric-chip__value {
          font-size: 13px;
          font-weight: 700;
          color: var(--wm-cyan-strong);
          letter-spacing: -0.005em;
          text-shadow: 0 0 14px rgba(58, 168, 255, 0.36);
        }
        .metric-chip__label {
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8.5px;
          color: var(--wm-subtle);
          text-transform: uppercase;
          letter-spacing: 0.13em;
          opacity: 0.72;
        }

        /* ───────── Inscribed scroll column ───────── */

        .welcome-disc__scroll {
          position: relative;
          z-index: 2;
          flex: 1 1 auto;
          width: 100%;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 10px 0 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-mask-image: linear-gradient(180deg,
            transparent 0,
            #000 var(--wm-edge-fade),
            #000 calc(100% - var(--wm-edge-fade)),
            transparent 100%);
          mask-image: linear-gradient(180deg,
            transparent 0,
            #000 var(--wm-edge-fade),
            #000 calc(100% - var(--wm-edge-fade)),
            transparent 100%);
        }
        .welcome-disc__scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .welcome-disc__col {
          width: min(var(--wm-col-max), calc(100% - 24px));
          margin: 0 auto;
          padding: 12px 0 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .welcome-disc__col > * {
          animation: wmSectionIn 460ms var(--wm-ease) both;
        }
        .welcome-disc__col > *:nth-child(1) { animation-delay: 80ms; }
        .welcome-disc__col > *:nth-child(2) { animation-delay: 150ms; }
        .welcome-disc__col > *:nth-child(3) { animation-delay: 220ms; }
        .welcome-disc__col > *:nth-child(4) { animation-delay: 290ms; }
        .welcome-disc__col > *:nth-child(5) { animation-delay: 360ms; }
        @keyframes wmSectionIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .welcome-section {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 15px 17px;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(19, 30, 47, 0.56), rgba(10, 17, 28, 0.5)),
            radial-gradient(150% 130% at 100% 0%, rgba(58, 168, 255, 0.05), transparent 58%);
          border: 1px solid rgba(136, 176, 218, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
        }
        .welcome-section--highlight {
          background:
            linear-gradient(180deg, rgba(23, 35, 52, 0.72), rgba(12, 20, 32, 0.66)),
            radial-gradient(150% 130% at 100% 0%, rgba(214, 168, 79, 0.06), transparent 58%);
          border: 1px solid rgba(136, 176, 218, 0.17);
          border-left: 2px solid rgba(214, 168, 79, 0.72);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 28px -24px rgba(58, 168, 255, 0.5);
        }
        .section-eyebrow {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 1px;
          padding: 3px 10px;
          border-radius: 999px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--wm-cyan-strong) 76%, var(--wm-text));
          background: rgba(58, 168, 255, 0.1);
          border: 1px solid rgba(114, 221, 255, 0.22);
        }
        .welcome-section--highlight .section-eyebrow {
          color: color-mix(in srgb, var(--wm-amber) 80%, var(--wm-text));
          background: rgba(214, 168, 79, 0.1);
          border-color: rgba(214, 168, 79, 0.3);
        }
        .section-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(58, 168, 255, 0.12);
          border: 1px solid rgba(114, 221, 255, 0.22);
          color: var(--wm-cyan-strong);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 14px rgba(58, 168, 255, 0.08);
        }
        .section-icon svg { width: 18px; height: 18px; }
        .section-title {
          position: relative;
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.005em;
          color: var(--wm-text);
          padding-bottom: 4px;
        }
        .section-title::after {
          content: "";
          display: block;
          margin-top: 6px;
          width: 24px;
          height: 1px;
          background: linear-gradient(90deg, var(--wm-cyan-strong), rgba(214, 168, 79, 0.45), transparent);
          opacity: 0.7;
        }
        .section-text {
          margin: 0;
          font-size: 12.25px;
          line-height: 1.58;
          color: color-mix(in srgb, var(--wm-muted) 92%, var(--wm-text));
        }
        .section-text strong { color: color-mix(in srgb, var(--wm-text) 86%, var(--wm-cyan-strong)); font-weight: 600; }

        /* ───────── Feature cards ───────── */

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 11px;
          padding: 3px;
          margin: -3px;
        }
        .feature-card {
          position: relative;
          min-height: 158px;
          padding: 14px 15px;
          border-radius: 24px;
          background:
            radial-gradient(125% 105% at 100% -12%, rgba(114, 221, 255, 0.07), transparent 44%),
            linear-gradient(180deg, rgba(30, 46, 65, 0.82), rgba(9, 16, 27, 0.78)),
            linear-gradient(115deg, rgba(58, 168, 255, 0.05), transparent 54%, rgba(214, 168, 79, 0.03)),
            var(--wm-surface);
          border: 1px solid rgba(136, 176, 218, 0.23);
          display: flex;
          flex-direction: column;
          gap: 7px;
          overflow: hidden;
          outline: none;
          transition:
            border-color var(--wm-duration-fast) var(--wm-ease),
            transform var(--wm-duration-fast) var(--wm-ease),
            box-shadow var(--wm-duration-hover) var(--wm-ease);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 12px 26px -26px rgba(58, 168, 255, 0.7),
            0 8px 20px -22px rgba(0, 0, 0, 0.85);
        }
        .feature-card::before {
          content: "";
          position: absolute;
          top: -42%;
          right: -30%;
          width: 88%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          border: 1px solid rgba(114, 221, 255, 0.12);
          box-shadow:
            0 0 0 9px rgba(114, 221, 255, 0.03),
            0 0 0 19px rgba(214, 168, 79, 0.022);
          opacity: 0.55;
          pointer-events: none;
          transition: opacity 240ms var(--wm-ease), transform 300ms var(--wm-ease);
        }
        .feature-card:hover::before,
        .feature-card:focus-visible::before {
          opacity: 0.95;
          transform: translate3d(-5px, 4px, 0);
        }
        .feature-card::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inline-size: 42%;
          background: linear-gradient(90deg, transparent, rgba(114, 221, 255, 0.16), rgba(214, 168, 79, 0.07), transparent);
          opacity: 0;
          transform: translateX(-130%) skewX(-10deg);
          pointer-events: none;
        }
        .feature-card:hover,
        .feature-card:focus-visible {
          border-color: rgba(114, 221, 255, 0.52);
          transform: translateY(-3px);
          box-shadow:
            0 16px 34px -24px rgba(58, 168, 255, 0.94),
            0 0 0 1px rgba(58, 168, 255, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .feature-card:focus-visible {
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.75),
            0 0 0 4px rgba(58, 168, 255, 0.22),
            0 15px 32px -24px rgba(58, 168, 255, 0.9);
        }
        .feature-card:hover::after,
        .feature-card:focus-visible::after {
          opacity: 1;
          animation: wmSweep var(--wm-duration-sweep) ease-out both;
        }
        .feature-card:hover .feature-icon,
        .feature-card:focus-visible .feature-icon {
          color: var(--wm-cyan-strong);
          border-color: rgba(114, 221, 255, 0.52);
          background: rgba(58, 168, 255, 0.16);
          box-shadow: 0 0 18px rgba(58, 168, 255, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.09);
        }
        @keyframes wmSweep {
          from { transform: translateX(-130%) skewX(-10deg); }
          to   { transform: translateX(180%) skewX(-10deg); }
        }
        .feature-icon {
          position: relative;
          z-index: 1;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(22, 39, 58, 0.84), rgba(8, 14, 24, 0.76));
          border: 1px solid rgba(136, 176, 218, 0.24);
          color: color-mix(in srgb, var(--wm-muted) 86%, var(--wm-cyan-strong));
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 -5px 10px rgba(0, 0, 0, 0.22);
          transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 220ms ease;
        }
        .feature-icon svg { width: 17px; height: 17px; }
        .feature-title {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--wm-text);
          letter-spacing: -0.005em;
        }
        .feature-desc {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 11px;
          line-height: 1.46;
          color: color-mix(in srgb, var(--wm-muted) 90%, var(--wm-text));
        }
        .feature-tags {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: auto;
          padding-top: 3px;
        }
        .feature-tag {
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 2px 8px;
          border-radius: 999px;
          color: color-mix(in srgb, var(--wm-cyan-strong) 74%, var(--wm-text));
          background: rgba(58, 168, 255, 0.08);
          border: 1px solid rgba(114, 221, 255, 0.18);
          transition: background-color 160ms ease, border-color 160ms ease;
        }
        .feature-card:hover .feature-tag,
        .feature-card:focus-visible .feature-tag {
          background: rgba(58, 168, 255, 0.14);
          border-color: rgba(114, 221, 255, 0.32);
        }

        /* ───────── Tech badges + steps ───────── */

        .tech-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .tech-badge {
          padding: 3px 8px;
          background: rgba(58, 168, 255, 0.1);
          border: 1px solid rgba(114, 221, 255, 0.22);
          border-radius: 7px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 700;
          color: color-mix(in srgb, var(--wm-cyan-strong) 80%, var(--wm-text));
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: background-color 160ms ease, box-shadow 220ms ease;
        }
        .tech-badge:hover { background: rgba(58, 168, 255, 0.16); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 12px rgba(58, 168, 255, 0.26); }

        .steps-list { display: flex; flex-direction: column; gap: 9px; padding: 2px 0; }
        .step-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 9px 10px;
          background: rgba(13, 21, 34, 0.58);
          border: 1px solid rgba(136, 176, 218, 0.14);
          border-radius: 12px;
          transition: border-color 160ms ease, background-color 160ms ease;
        }
        .step-item:hover { border-color: rgba(114, 221, 255, 0.26); background: rgba(20, 32, 49, 0.66); }
        .step-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(58, 168, 255, 0.12);
          border: 1px solid rgba(114, 221, 255, 0.28);
          color: var(--wm-cyan-strong);
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 10px rgba(58, 168, 255, 0.18);
        }
        .step-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .step-title { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--wm-text); }
        .step-desc { margin: 0; font-size: 11.25px; line-height: 1.52; color: color-mix(in srgb, var(--wm-muted) 88%, var(--wm-text)); }

        /* ───────── Scroll hint ───────── */

        .welcome-disc__hint {
          position: absolute;
          left: 50%;
          bottom: clamp(86px, 17%, 150px);
          z-index: 4;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 999px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--wm-cyan-strong) 78%, var(--wm-text));
          background: rgba(8, 15, 25, 0.7);
          border: 1px solid rgba(114, 221, 255, 0.24);
          box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 280ms ease, transform 280ms ease;
          animation: wmHintBob 2.4s ease-in-out infinite;
        }
        .welcome-disc__hint svg { color: var(--wm-cyan-strong); }
        .welcome-disc__hint.is-hidden {
          opacity: 0;
          transform: translateX(-50%) translateY(6px);
        }
        @keyframes wmHintBob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(3px); }
        }

        /* ───────── Footer command bar (bottom arc) ───────── */

        .welcome-disc__footer {
          position: relative;
          z-index: 3;
          flex: 0 0 auto;
          width: min(60%, 520px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          text-align: center;
          padding-top: 6px;
        }
        .footer-meta { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .footer-text {
          margin: 0;
          font-size: 11px;
          color: color-mix(in srgb, var(--wm-muted) 92%, var(--wm-text));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0 4px;
        }
        .footer-text--credit { font-size: 10.5px; color: var(--wm-subtle); }
        .footer-text--credit strong { color: color-mix(in srgb, var(--wm-muted) 70%, var(--wm-text)); font-weight: 600; }

        .btn-start {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 168px;
          padding: 10px 22px;
          border-radius: 999px;
          border: 1px solid rgba(114, 221, 255, 0.72);
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--wm-cyan-strong) 42%, var(--wm-cyan)) 0%,
            color-mix(in srgb, var(--wm-cyan) 84%, #0b406d) 100%);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 12px 26px -12px rgba(58, 168, 255, 0.82),
            0 0 0 1px rgba(58, 168, 255, 0.2);
          transition:
            background-color var(--wm-duration-fast) var(--wm-ease),
            box-shadow var(--wm-duration-hover) var(--wm-ease),
            transform var(--wm-duration-fast) var(--wm-ease);
        }
        .btn-start::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inline-size: 42%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent);
          opacity: 0;
          transform: translateX(-120%);
          pointer-events: none;
        }
        .btn-start:hover {
          transform: translateY(-2px);
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--wm-cyan-strong) 54%, var(--wm-cyan)) 0%,
            color-mix(in srgb, var(--wm-cyan) 90%, #0c4d82) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            0 16px 30px -12px rgba(58, 168, 255, 0.9),
            0 0 0 1px rgba(114, 221, 255, 0.34),
            0 0 22px rgba(58, 168, 255, 0.36);
        }
        .btn-start:hover::after { opacity: 1; animation: wmSweep var(--wm-duration-sweep) ease-out both; }
        .btn-start:active { transform: translateY(0) scale(0.99); }
        .btn-start:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.9),
            0 0 0 4px rgba(58, 168, 255, 0.36),
            0 12px 26px -14px rgba(58, 168, 255, 0.88);
        }

        /* ───────── Responsive: circle → capsule ───────── */

        @media (max-width: 900px) {
          .welcome-modal { --wm-col-max: calc(var(--wm-disc) * 0.74); }
          .welcome-disc__brand { width: min(82%, 560px); }
          .welcome-disc__footer { width: min(74%, 480px); }
        }

        /* Short viewports: reclaim vertical space so more content is visible
           at once between the brand and the always-anchored footer. */
        @media (max-height: 860px) {
          .welcome-modal__panel { padding: clamp(16px, 3.5%, 34px) 0 clamp(14px, 3%, 28px); }
          .welcome-disc__brand { gap: 6px; padding-top: 0; }
          .brand-subtitle { font-size: 12px; }
          .brand-metrics { margin-top: 2px; }
          .metric-chip { padding: 6px 12px; }
          .welcome-disc__scroll { margin: 6px 0 2px; }
        }

        @media (max-width: 560px) {
          .welcome-modal { padding: 12px; }
          .welcome-modal__disc-wrap {
            width: calc(100vw - 24px);
            height: auto;
            aspect-ratio: auto;
            max-height: 92vh;
            display: flex;
          }
          .welcome-modal__halo { border-radius: 32px; inset: -4%; }
          .welcome-modal__panel {
            border-radius: 32px;
            height: auto;
            max-height: 92vh;
            clip-path: none !important;
            padding: 22px 0 18px;
            animation: wmCapsuleIn var(--wm-duration-panel) var(--wm-ease);
          }
          .welcome-modal--closing .welcome-modal__panel { animation: wmCapsuleOut var(--wm-duration-exit) var(--wm-ease-firm) forwards; }
          .welcome-modal__atmosphere,
          .welcome-modal__panel::before { border-radius: 32px; }
          .welcome-modal__rings, .welcome-modal__radar { display: none; }
          .welcome-disc__brand { width: calc(100% - 36px); }
          .welcome-disc__footer { width: calc(100% - 36px); }
          .welcome-disc__col { width: calc(100% - 32px); }
          .features-grid { grid-template-columns: 1fr; }
          .btn-start { width: 100%; }
          .welcome-disc__hint { display: none; }
        }
        @keyframes wmCapsuleIn {
          from { opacity: 0; transform: translateY(26px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wmCapsuleOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(26px) scale(.95); }
        }

        @media (max-width: 380px) {
          .brand-title { font-size: clamp(24px, 8vw, 32px); }
          .brand-subtitle { font-size: 12px; }
        }

        /* ───────── Reduced motion ───────── */

        @media (prefers-reduced-motion: reduce) {
          .welcome-modal *,
          .welcome-modal *::before,
          .welcome-modal *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
          .welcome-modal__halo,
          .welcome-modal__radar,
          .welcome-modal__orbit-nodes,
          .welcome-modal__flow-canvas,
          .brand-logo__ring {
            display: none !important;
          }
          /* Scroll hint stays visible (static) so reduced-motion users still
             perceive more content; the bob animation is frozen by the rule above. */
          .welcome-modal__rings { opacity: 0.4; }
          .welcome-modal__panel {
            clip-path: none !important;
            transform: none !important;
            animation: wmFadeIn var(--wm-duration-enter) ease-out !important;
          }
          .welcome-modal--closing .welcome-modal__panel {
            animation: wmFadeOut var(--wm-duration-exit) ease-in forwards !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WelcomeModal;
