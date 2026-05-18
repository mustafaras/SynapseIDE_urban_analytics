import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLDivElement|null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  }, [onClose]);

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
      <div className="welcome-modal__panel" ref={ref}>
        {}
        <div className="welcome-hero">
          {/* Animated ambient neural backdrop */}
          <svg className="welcome-hero__ambient" viewBox="0 0 1400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <radialGradient id="wmHeroGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--syn-interaction-active)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--syn-interaction-active)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="wmHeroLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--syn-interaction-active)" stopOpacity="0.18" />
                <stop offset="50%" stopColor="var(--syn-interaction-selected)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--syn-interaction-active)" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <circle cx="280" cy="120" r="180" fill="url(#wmHeroGlow)" opacity="0.7" />
            <circle cx="1120" cy="120" r="150" fill="url(#wmHeroGlow)" opacity="0.55" />
            <g opacity="0.55">
              <circle cx="140" cy="70" r="2.2" fill="var(--syn-interaction-active)">
                <animate attributeName="opacity" values="0.35;0.95;0.35" dur="2.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="300" cy="180" r="1.8" fill="var(--syn-interaction-selected)">
                <animate attributeName="opacity" values="0.3;0.85;0.3" dur="3.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="540" cy="50" r="2" fill="var(--syn-interaction-active)">
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="780" cy="160" r="2.4" fill="var(--syn-interaction-selected)">
                <animate attributeName="opacity" values="0.35;0.85;0.35" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="980" cy="90" r="1.6" fill="var(--syn-interaction-active)">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="1180" cy="180" r="2.2" fill="var(--syn-interaction-selected)">
                <animate attributeName="opacity" values="0.35;0.9;0.35" dur="3.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="1300" cy="60" r="1.8" fill="var(--syn-interaction-active)">
                <animate attributeName="opacity" values="0.3;0.85;0.3" dur="2.9s" repeatCount="indefinite" />
              </circle>
              <line x1="140" y1="70" x2="300" y2="180" stroke="url(#wmHeroLine)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4.5s" repeatCount="indefinite" />
              </line>
              <line x1="540" y1="50" x2="780" y2="160" stroke="url(#wmHeroLine)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0.1;0.45;0.1" dur="5s" repeatCount="indefinite" />
              </line>
              <line x1="980" y1="90" x2="1180" y2="180" stroke="url(#wmHeroLine)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4.8s" repeatCount="indefinite" />
              </line>
            </g>
          </svg>
          {/* Faint grid floor */}
          <div className="welcome-hero__grid" aria-hidden="true" />

          <div className="welcome-hero__content">
            <div className="hero-icon" aria-hidden="true">
              <span className="hero-icon__halo" />
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="5" y="5" width="30" height="30" rx="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 10v20M10 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="20" cy="20" r="3.5" fill="currentColor" className="hero-icon__core" />
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.55" className="hero-icon__nodeA" />
                <circle cx="28" cy="28" r="2" fill="currentColor" opacity="0.55" className="hero-icon__nodeB" />
              </svg>
            </div>

            <h1 className="hero-title">
              <span className="hero-title__line">
                <span className="hero-title__dot" aria-hidden="true" />
                WELCOME TO
              </span>
              <span className="hero-title__brand">
                <span className="brand-text brand-text--primary">
                  <span className="brand-shine">Urban Analytics</span>
                </span>
                <span className="brand-separator">·</span>
                <span className="brand-text brand-text--secondary">Workbench</span>
                <span className="brand-badge">GIS</span>
              </span>
            </h1>

            <p className="hero-subtitle">
              Spatial Intelligence Platform for Urban Scientists &amp; Planners
            </p>

            <div className="hero-stats" aria-hidden="true">
              <div className="stat-item">
                <div className="stat-value">150+</div>
                <div className="stat-label">Analysis Cards</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-value">GIS+AI</div>
                <div className="stat-label">Spatial Intelligence</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-value">Python</div>
                <div className="stat-label">Analysis Engine</div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="welcome-content">
          {}
          <section className="welcome-section">
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
              AI-enhanced decision support for complex urban planning challenges.
            </p>
          </section>

          {}
          <div className="features-grid">
            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
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
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M8 14l3 3 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="feature-title">Report & Export Tools</h3>
              <p className="feature-desc">
                Generate professional urban analysis reports in PDF with embedded maps, charts,
                and statistical tables. Export layers to GeoJSON, Shapefile, GeoParquet, or
                GeoTIFF for use in QGIS and ArcGIS.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M8 4h12a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 10h8M10 14h8M10 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Methods & Workflow Library</h3>
              <p className="feature-desc">
                Curated collection of urban analysis methodologies: site suitability, walkability
                scoring, land-use classification, demographic profiling, environmental impact
                assessment, and transport accessibility analysis.
              </p>
            </div>
          </div>

          {}
          <section className="welcome-section welcome-section--highlight">
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

          {}
          <section className="welcome-section">
            <h2 className="section-title">Urban Analysis Workflow</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4 className="step-title">Define Study Area & Load Data</h4>
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
                  <h4 className="step-title">Visualize & Export Results</h4>
                  <p className="step-desc">Render analysis results on the interactive map with Deck.gl layers. Generate PDF reports with embedded maps and charts, or export layers to GeoJSON, Shapefile, or GeoParquet.</p>
                </div>
              </div>
            </div>
          </section>

          {}
          <section className="welcome-section">
            <div className="section-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 16l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="section-title">Data Standards & Methodology</h2>
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

        {}
        <div className="welcome-footer">
          <div className="footer-content">
            <p className="footer-text">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}}>
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Version 2.1.0 • November 2025
            </p>
            <p className="footer-text" style={{marginTop: '8px', fontSize: '12px', color: 'var(--syn-text-secondary)'}}>
              Developed by <strong style={{color: 'var(--syn-text-secondary)'}}>Mustafa Raşit Şahin, PhD</strong> •
              Built on <a
                href="https://github.com/mustafaras/Synapse_IDE"
                target="_blank"
                rel="noopener noreferrer"
                style={{color: 'var(--syn-text-link)', textDecoration: 'none', borderBottom: '1px solid color-mix(in srgb, var(--syn-text-link) 30%, transparent)', marginLeft: '4px'}}
              >
                Synapse IDE
              </a>
            </p>
          </div>
          <button className="btn-close-welcome" onClick={handleClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l3 3 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Got it, Let&apos;s Start
          </button>
        </div>
      </div>

      <style>{`
        /* ────────────────────────────────────────────────────────────
           Welcome modal — Urban Analytics premium intro
           ────────────────────────────────────────────────────────── */

        .welcome-modal {
          position: fixed !important;
          inset: 0 !important;
          z-index: 10050 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          animation: wmFadeIn 0.32s cubic-bezier(.16, 1, .3, 1);
          --wm-ease: cubic-bezier(.16, 1, .3, 1);
          --wm-accent: var(--syn-interaction-active);
          --wm-accent-soft: color-mix(in srgb, var(--syn-interaction-active) 14%, transparent);
          --wm-accent-rim: color-mix(in srgb, var(--syn-interaction-active) 38%, transparent);
        }
        .welcome-modal--closing { animation: wmFadeOut 0.36s ease-in forwards; }
        .welcome-modal--closing .welcome-modal__panel { animation: wmSlideDown 0.36s cubic-bezier(.4, 0, .6, 1) forwards; }
        .welcome-modal--closing .welcome-modal__backdrop { animation: wmBackdropFadeOut 0.36s ease-in forwards; }
        @keyframes wmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wmFadeOut { from { opacity: 1; } to { opacity: 0; } }

        .welcome-modal__backdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: -1 !important;
          background:
            radial-gradient(ellipse 60% 50% at 50% 40%, color-mix(in srgb, var(--syn-interaction-active) 10%, transparent) 0%, transparent 70%),
            var(--syn-surface-overlay) !important;
          backdrop-filter: blur(14px) saturate(120%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(120%) !important;
          animation: wmBackdropFadeIn 0.32s ease-out;
        }
        @keyframes wmBackdropFadeIn {
          from { opacity: 0; backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0); }
          to   { opacity: 1; backdrop-filter: blur(14px) saturate(120%); -webkit-backdrop-filter: blur(14px) saturate(120%); }
        }
        @keyframes wmBackdropFadeOut {
          from { opacity: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
          to   { opacity: 0; backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0); }
        }

        .welcome-modal__panel {
          position: relative;
          width: min(1180px, calc(100vw - 48px));
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          background: var(--syn-surface-workbench);
          border: 1px solid var(--syn-border-subtle);
          border-radius: 8px;
          box-shadow:
            0 32px 84px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px color-mix(in srgb, var(--wm-accent) 12%, transparent),
            inset 0 1px 0 color-mix(in srgb, #ffffff 6%, transparent);
          overflow: hidden;
          animation: wmSlideUp 0.42s var(--wm-ease);
        }
        @keyframes wmSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wmSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(30px) scale(.95); }
        }

        /* ───────── Hero band ───────── */

        .welcome-hero {
          position: relative;
          padding: 18px 22px 16px;
          overflow: hidden;
          background:
            radial-gradient(ellipse 70% 80% at 50% 100%, color-mix(in srgb, var(--wm-accent) 10%, transparent) 0%, transparent 75%),
            linear-gradient(180deg,
              color-mix(in srgb, var(--syn-surface-navigation) 96%, transparent) 0%,
              color-mix(in srgb, var(--syn-surface-navigation) 80%, transparent) 100%);
          border-bottom: 1px solid var(--syn-border-subtle);
          flex-shrink: 0;
          isolation: isolate;
        }
        .welcome-hero::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            var(--wm-accent-rim) 30%,
            color-mix(in srgb, var(--wm-accent) 55%, transparent) 50%,
            var(--wm-accent-rim) 70%,
            transparent 100%);
          opacity: 0.55;
          pointer-events: none;
          z-index: 3;
        }

        .welcome-hero__ambient {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.9;
        }

        .welcome-hero__grid {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(to right, color-mix(in srgb, var(--wm-accent) 6%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--wm-accent) 6%, transparent) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 80%);
          opacity: 0.55;
          animation: wmGridDrift 28s linear infinite;
        }
        @keyframes wmGridDrift {
          from { background-position: 0 0, 0 0; }
          to   { background-position: 48px 0, 0 48px; }
        }

        .welcome-hero__content {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "icon title stats"
            "icon subtitle stats";
          align-items: center;
          gap: 14px 16px;
        }

        .hero-icon {
          grid-area: icon;
          position: relative;
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          color: var(--wm-accent);
          border: 1px solid color-mix(in srgb, var(--wm-accent) 28%, var(--syn-border-subtle));
          border-radius: 7px;
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--syn-surface-panel) 90%, var(--wm-accent) 2%),
            color-mix(in srgb, var(--syn-surface-panel) 100%, transparent));
          box-shadow:
            0 4px 14px -6px color-mix(in srgb, var(--wm-accent) 50%, transparent),
            inset 0 1px 0 color-mix(in srgb, #ffffff 8%, transparent);
        }
        .hero-icon__halo {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--wm-accent) 22%, transparent), transparent 65%);
          filter: blur(6px);
          pointer-events: none;
          animation: wmHaloBreathe 4.4s ease-in-out infinite;
          z-index: -1;
        }
        @keyframes wmHaloBreathe {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.95; transform: scale(1.08); }
        }
        .hero-icon__core {
          transform-origin: center;
          transform-box: fill-box;
          animation: wmCorePulse 2.4s ease-in-out infinite;
        }
        .hero-icon__nodeA { animation: wmNodePulse 2.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .hero-icon__nodeB { animation: wmNodePulse 2.6s ease-in-out infinite 1.3s; transform-origin: center; transform-box: fill-box; }
        @keyframes wmNodePulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.25); }
        }
        @keyframes wmCorePulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%      { transform: scale(1.15); opacity: 0.92; }
        }
        .hero-icon svg { width: 34px; height: 34px; position: relative; z-index: 1; }

        .hero-title {
          grid-area: title;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: flex-start;
        }
        .hero-title__line {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 3px 9px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          color: color-mix(in srgb, var(--wm-accent) 80%, var(--syn-text-secondary));
          background: var(--wm-accent-soft);
          border: 1px solid color-mix(in srgb, var(--wm-accent) 22%, transparent);
          border-radius: 999px;
          box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 6%, transparent);
        }
        .hero-title__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--wm-accent);
          box-shadow: 0 0 8px color-mix(in srgb, var(--wm-accent) 75%, transparent);
          animation: wmDotBlink 2s ease-in-out infinite;
        }
        @keyframes wmDotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: .45; transform: scale(.85); }
        }

        .hero-title__brand {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.012em;
          line-height: 1.1;
        }
        .brand-text--primary { color: var(--syn-text-default); position: relative; }
        .brand-shine {
          background: linear-gradient(100deg,
            var(--syn-text-default) 0%,
            var(--syn-text-default) 36%,
            color-mix(in srgb, var(--wm-accent) 92%, #ffffff) 50%,
            var(--syn-text-default) 64%,
            var(--syn-text-default) 100%);
          background-size: 300% 100%;
          background-position: 100% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: wmBrandShine 4.6s cubic-bezier(.4, 0, .2, 1) infinite;
        }
        @keyframes wmBrandShine {
          0%, 18%   { background-position: 100% 50%; }
          72%, 100% { background-position: 0% 50%; }
        }
        .brand-separator {
          color: var(--syn-text-muted);
          font-weight: 300;
          font-size: 22px;
          opacity: 0.55;
        }
        .brand-text--secondary { color: var(--syn-text-secondary); }

        .brand-badge {
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 3px;
          background: var(--wm-accent-soft);
          border: 1px solid color-mix(in srgb, var(--wm-accent) 30%, transparent);
          color: var(--wm-accent);
          letter-spacing: 0.14em;
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, #ffffff 7%, transparent),
            0 0 12px color-mix(in srgb, var(--wm-accent) 22%, transparent);
        }

        .hero-subtitle {
          grid-area: subtitle;
          margin: 0;
          font-size: 13px;
          color: var(--syn-text-secondary);
          max-width: 640px;
          line-height: 1.4;
        }

        .hero-stats {
          grid-area: stats;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 0 0 18px;
          border-left: 1px solid var(--syn-border-subtle);
        }
        .stat-item { display: flex; flex-direction: column; gap: 3px; }
        .stat-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--wm-accent);
          letter-spacing: -0.005em;
        }
        .stat-label {
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9.5px;
          color: var(--syn-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.7;
        }
        .stat-divider {
          width: 1px;
          height: 28px;
          background: linear-gradient(to bottom,
            transparent,
            color-mix(in srgb, var(--syn-border-subtle) 100%, transparent),
            transparent);
        }

        /* ───────── Content ───────── */

        .welcome-content {
          flex: 1;
          overflow: auto;
          padding: 16px 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--syn-text-muted) 28%, transparent) transparent;
        }
        .welcome-content::-webkit-scrollbar { width: 10px; }
        .welcome-content::-webkit-scrollbar-track { background: transparent; }
        .welcome-content::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--syn-text-muted) 22%, transparent);
          border: 3px solid transparent;
          background-clip: content-box;
          border-radius: 6px;
          transition: background 140ms ease;
        }
        .welcome-content::-webkit-scrollbar-thumb:hover {
          background: color-mix(in srgb, var(--wm-accent) 40%, transparent);
          background-clip: content-box;
        }
        .welcome-content > * {
          animation: wmSectionIn 460ms var(--wm-ease) both;
        }
        .welcome-content > *:nth-child(1) { animation-delay: 60ms; }
        .welcome-content > *:nth-child(2) { animation-delay: 140ms; }
        .welcome-content > *:nth-child(3) { animation-delay: 220ms; }
        .welcome-content > *:nth-child(4) { animation-delay: 300ms; }
        .welcome-content > *:nth-child(5) { animation-delay: 380ms; }
        @keyframes wmSectionIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .welcome-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .welcome-section--highlight {
          position: relative;
          padding: 14px 16px;
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--syn-surface-panel) 80%, var(--wm-accent) 3%),
            var(--syn-surface-panel));
          border: 1px solid var(--syn-border-subtle);
          border-left: 2px solid var(--wm-accent);
          border-radius: 4px;
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, #ffffff 4%, transparent),
            0 1px 0 color-mix(in srgb, var(--wm-accent) 8%, transparent);
        }

        .section-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: var(--wm-accent-soft);
          border: 1px solid color-mix(in srgb, var(--wm-accent) 22%, transparent);
          color: var(--wm-accent);
          box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 5%, transparent);
        }
        .section-icon svg { width: 18px; height: 18px; }

        .section-title {
          position: relative;
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.005em;
          color: var(--syn-text-default);
          padding-bottom: 4px;
        }
        .section-title::after {
          content: "";
          display: block;
          margin-top: 6px;
          width: 24px;
          height: 1px;
          background: linear-gradient(90deg, var(--wm-accent), transparent);
          opacity: 0.7;
        }
        .section-text {
          margin: 0;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--syn-text-secondary);
        }

        /* ───────── Feature grid ───────── */

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 8px;
        }
        .feature-card {
          position: relative;
          padding: 11px 12px 12px;
          background: var(--syn-surface-panel);
          border: 1px solid var(--syn-border-subtle);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          overflow: hidden;
          transition:
            background-color 180ms var(--wm-ease),
            border-color 180ms var(--wm-ease),
            transform 180ms var(--wm-ease),
            box-shadow 220ms var(--wm-ease);
        }
        .feature-card::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inline-size: 40%;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--wm-accent) 16%, transparent), transparent);
          opacity: 0;
          transform: translateX(-120%);
          pointer-events: none;
        }
        .feature-card::before {
          content: "";
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, var(--wm-accent), color-mix(in srgb, var(--wm-accent) 30%, transparent));
          transform: scaleY(0);
          transform-origin: top;
          transition: transform 240ms var(--wm-ease);
        }
        .feature-card:hover {
          border-color: color-mix(in srgb, var(--wm-accent) 32%, var(--syn-border-subtle));
          background: color-mix(in srgb, var(--wm-accent) 4%, var(--syn-surface-panel));
          transform: translateY(-2px);
          box-shadow:
            0 6px 18px -8px color-mix(in srgb, var(--wm-accent) 40%, transparent),
            inset 0 1px 0 color-mix(in srgb, #ffffff 5%, transparent);
        }
        .feature-card:hover::after {
          opacity: 1;
          animation: wmSweep 620ms ease-out both;
        }
        .feature-card:hover::before { transform: scaleY(1); }
        .feature-card:hover .feature-icon {
          color: var(--wm-accent);
          border-color: color-mix(in srgb, var(--wm-accent) 45%, transparent);
          background: var(--wm-accent-soft);
          box-shadow: 0 0 14px color-mix(in srgb, var(--wm-accent) 28%, transparent);
        }
        @keyframes wmSweep {
          from { transform: translateX(-120%); }
          to   { transform: translateX(160%); }
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--syn-border-subtle);
          color: var(--syn-text-secondary);
          transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 220ms ease;
        }
        .feature-icon svg { width: 16px; height: 16px; }
        .feature-title {
          margin: 0;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--syn-text-default);
          letter-spacing: -0.005em;
        }
        .feature-desc {
          margin: 0;
          font-size: 11.5px;
          line-height: 1.55;
          color: var(--syn-text-secondary);
        }

        /* ───────── Tech badges ───────── */

        .tech-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
        .tech-badge {
          position: relative;
          padding: 3px 8px;
          background: var(--wm-accent-soft);
          border: 1px solid color-mix(in srgb, var(--wm-accent) 26%, transparent);
          border-radius: 3px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 700;
          color: var(--wm-accent);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 6%, transparent);
          transition: background-color 160ms ease, box-shadow 220ms ease;
        }
        .tech-badge:hover {
          background: color-mix(in srgb, var(--wm-accent) 22%, transparent);
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, #ffffff 8%, transparent),
            0 0 12px color-mix(in srgb, var(--wm-accent) 30%, transparent);
        }

        /* ───────── Workflow steps ───────── */

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 2px 0;
        }
        .step-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 8px 10px;
          background: var(--syn-surface-panel);
          border: 1px solid var(--syn-border-subtle);
          border-radius: 4px;
          transition: border-color 160ms ease, background-color 160ms ease;
        }
        .step-item:hover {
          border-color: color-mix(in srgb, var(--wm-accent) 28%, var(--syn-border-subtle));
          background: color-mix(in srgb, var(--wm-accent) 3%, var(--syn-surface-panel));
        }
        .step-number {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: var(--wm-accent-soft);
          border: 1px solid color-mix(in srgb, var(--wm-accent) 32%, transparent);
          color: var(--wm-accent);
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, #ffffff 5%, transparent),
            0 0 10px color-mix(in srgb, var(--wm-accent) 18%, transparent);
        }
        .step-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .step-title {
          margin: 0;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--syn-text-default);
        }
        .step-desc {
          margin: 0;
          font-size: 11.5px;
          line-height: 1.55;
          color: var(--syn-text-secondary);
        }

        /* ───────── Footer ───────── */

        .welcome-footer {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 12px 22px;
          border-top: 1px solid var(--syn-border-subtle);
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--syn-surface-navigation) 88%, transparent),
            var(--syn-surface-navigation));
        }
        .welcome-footer::before {
          content: "";
          position: absolute;
          left: 0; right: 0; top: -1px;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            var(--wm-accent-rim) 30%,
            color-mix(in srgb, var(--wm-accent) 55%, transparent) 50%,
            var(--wm-accent-rim) 70%,
            transparent 100%);
          opacity: 0.45;
          pointer-events: none;
        }
        .footer-content { flex: 1; min-width: 0; }
        .footer-text {
          margin: 0;
          font-size: 12px;
          color: var(--syn-text-secondary);
          display: flex;
          align-items: center;
        }

        .btn-close-welcome {
          position: relative;
          overflow: hidden;
          padding: 0;
          border-radius: 4px;
          border: 1px solid color-mix(in srgb, var(--wm-accent) 80%, #ffffff);
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--wm-accent) 95%, #ffffff) 0%,
            var(--wm-accent) 100%);
          color: var(--syn-text-inverse, #ffffff);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0;
          box-shadow:
            0 1px 0 color-mix(in srgb, #ffffff 14%, transparent) inset,
            0 6px 16px -6px color-mix(in srgb, var(--wm-accent) 60%, transparent),
            0 0 0 1px color-mix(in srgb, var(--wm-accent) 28%, transparent);
          transition:
            background-color 160ms var(--wm-ease),
            box-shadow 220ms var(--wm-ease),
            transform 160ms var(--wm-ease);
        }
        .btn-close-welcome > * { display: inline-flex; align-items: center; }
        .btn-close-welcome {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
        }
        .btn-close-welcome::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inline-size: 42%;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, #ffffff 28%, transparent), transparent);
          opacity: 0;
          transform: translateX(-120%);
          pointer-events: none;
        }
        .btn-close-welcome:hover {
          transform: translateY(-1px);
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--wm-accent) 88%, #ffffff) 0%,
            var(--wm-accent) 100%);
          box-shadow:
            0 1px 0 color-mix(in srgb, #ffffff 18%, transparent) inset,
            0 10px 24px -8px color-mix(in srgb, var(--wm-accent) 70%, transparent),
            0 0 0 1px color-mix(in srgb, var(--wm-accent) 40%, transparent),
            0 0 18px color-mix(in srgb, var(--wm-accent) 38%, transparent);
        }
        .btn-close-welcome:hover::after {
          opacity: 1;
          animation: wmSweep 620ms ease-out both;
        }
        .btn-close-welcome:active { transform: translateY(0); }
        .btn-close-welcome:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 1px var(--syn-border-focus, #ffffff),
            0 0 0 3px color-mix(in srgb, var(--wm-accent) 28%, transparent);
        }

        /* ───────── Responsive ───────── */

        @media (max-width: 960px) {
          .welcome-hero__content {
            grid-template-columns: auto minmax(0, 1fr);
            grid-template-areas:
              "icon title"
              "icon subtitle"
              "stats stats";
          }
          .hero-stats {
            border-left: 0;
            border-top: 1px solid var(--syn-border-subtle);
            padding: 10px 0 0;
            width: 100%;
            flex-wrap: wrap;
          }
        }
        @media (max-width: 768px) {
          .welcome-hero { padding: 14px; }
          .welcome-hero__content {
            grid-template-columns: 1fr;
            grid-template-areas:
              "icon"
              "title"
              "subtitle"
              "stats";
          }
          .hero-title__brand { font-size: 20px; flex-wrap: wrap; }
          .welcome-content { padding: 14px; }
          .features-grid { grid-template-columns: 1fr; }
          .welcome-footer { flex-direction: column; align-items: stretch; padding: 12px 14px; }
          .hero-stats { gap: 12px; }
          .stat-divider { width: 80%; height: 1px; }
        }

        /* ───────── Reduce motion ───────── */
        @media (prefers-reduced-motion: reduce) {
          .welcome-modal *,
          .welcome-modal *::before,
          .welcome-modal *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
          .welcome-hero__grid { animation: none; }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WelcomeModal;
