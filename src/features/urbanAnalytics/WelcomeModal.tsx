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
          <div className="welcome-hero__content">
            <div className="hero-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="5" y="5" width="30" height="30" rx="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 10v20M10 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="20" cy="20" r="3.5" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.55" />
                <circle cx="28" cy="28" r="2" fill="currentColor" opacity="0.55" />
              </svg>
            </div>

            <h1 className="hero-title">
              <span className="hero-title__line">Welcome to</span>
              <span className="hero-title__brand">
                <span className="brand-text brand-text--primary">Urban Analytics</span>
                <span className="brand-separator">·</span>
                <span className="brand-text brand-text--secondary">Workbench</span>
                <span className="brand-badge">GIS</span>
              </span>
            </h1>

            <p className="hero-subtitle">
              Spatial Intelligence Platform for Urban Scientists & Planners
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

        .welcome-modal {
          position: fixed !important;
          inset: 0 !important;
          /* Modal tier from design tokens (popover 10060, tooltip 10070, toast 10080 all stay above). */
          z-index: 10050 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          animation: fadeIn 0.3s ease-out;
        }
        .welcome-modal--closing {
          animation: fadeOut 0.4s ease-in forwards;
        }
        .welcome-modal--closing .welcome-modal__panel {
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        .welcome-modal--closing .welcome-modal__backdrop {
          animation: backdropFadeOut 0.4s ease-in forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .welcome-modal__backdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: -1 !important;
          background: var(--syn-surface-overlay) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          animation: backdropFadeIn 0.3s ease-out;
        }
        @keyframes backdropFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }
        @keyframes backdropFadeOut {
          from {
            opacity: 1;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          to {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
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
            0 24px 72px rgba(0, 0, 0, 0.48),
            inset 0 1px 0 color-mix(in srgb, var(--syn-text-default) 8%, transparent);
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(40px) scale(0.94);
          }
        }


        .welcome-hero {
          position: relative;
          padding: 18px 24px;
          overflow: hidden;
          background: var(--syn-surface-navigation);
          border-bottom: 1px solid var(--syn-border-subtle);
          flex-shrink: 0;
        }

        .welcome-hero__background {
          display: none;
        }

        .welcome-hero__content {
          position: relative;
          z-index: 2;
          text-align: left;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "icon title stats"
            "icon subtitle stats";
          align-items: center;
          gap: 16px;
        }

        .hero-icon {
          grid-area: icon;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          color: var(--syn-interaction-active);
          border: 1px solid var(--syn-border-subtle);
          border-radius: 6px;
          background: var(--syn-surface-panel);
        }
        .hero-icon svg {
          width: 32px;
          height: 32px;
        }

        .hero-title {
          grid-area: title;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }
        .hero-title__line {
          font-size: 11px;
          font-weight: 600;
          color: var(--syn-text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .hero-title__brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 21px;
          font-weight: 650;
          letter-spacing: 0;
        }
        .brand-text--primary {
          color: var(--syn-text-default);
        }
        .brand-separator {
          color: var(--syn-text-muted);
          font-weight: 300;
          font-size: 20px;
        }
        .brand-text--secondary {
          color: var(--syn-text-secondary);
        }
        .brand-badge {
          font-size: 11px;
          font-weight: 650;
          padding: 2px 6px;
          border-radius: 3px;
          background: transparent;
          border: 1px solid var(--syn-border-subtle);
          color: var(--syn-interaction-active);
          align-self: center;
          margin-top: 0;
        }

        .hero-subtitle {
          grid-area: subtitle;
          margin: 0;
          font-size: 13px;
          color: var(--syn-text-secondary);
          max-width: 600px;
          line-height: 1.35;
        }

        .hero-stats {
          grid-area: stats;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 0;
          padding: 0 0 0 16px;
          background: transparent;
          border-left: 1px solid var(--syn-border-subtle);
          border-radius: 0;
          box-shadow: none;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
        }
        .stat-item:nth-child(1) { animation-delay: 0s; }
        .stat-item:nth-child(3) { animation-delay: 0.5s; }
        .stat-item:nth-child(5) { animation-delay: 1s; }

        .stat-value {
          font-size: 13px;
          font-weight: 650;
          color: var(--syn-interaction-active);
        }
        .stat-label {
          font-size: 10px;
          color: var(--syn-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stat-divider {
          width: 1px;
          height: 28px;
          background: var(--syn-border-subtle);
        }

        .welcome-content {
          flex: 1;
          overflow: auto;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .welcome-content { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--syn-text-muted) 28%, transparent) transparent; }
        .welcome-content::-webkit-scrollbar { width: 10px; }
        .welcome-content::-webkit-scrollbar-track { background: transparent; }
        .welcome-content::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--syn-text-muted) 22%, transparent);
          border: 3px solid transparent;
          background-clip: content-box;
          border-radius: 6px;
        }
        .welcome-content::-webkit-scrollbar-thumb:hover {
          background: color-mix(in srgb, var(--syn-text-muted) 55%, transparent);
          background-clip: content-box;
        }

        .welcome-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .welcome-section--highlight {
          padding: 16px 18px;
          background: var(--syn-surface-panel);
          border: 1px solid var(--syn-border-subtle);
          border-left: 2px solid var(--syn-interaction-active);
          border-radius: 4px;
        }

        .section-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--syn-border-subtle);
          color: var(--syn-interaction-active);
        }

        .section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0;
          color: var(--syn-text-default);
        }

        .section-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.65;
          color: var(--syn-text-secondary);
        }


        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }

        .feature-card {
          padding: 14px;
          background: var(--syn-surface-panel);
          border: 1px solid var(--syn-border-subtle);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .feature-card:hover {
          background: var(--syn-surface-hover);
          border-color: var(--syn-border-default);
        }

        .feature-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--syn-border-subtle);
          color: var(--syn-interaction-active);
        }

        .feature-title {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--syn-text-default);
        }

        .feature-desc {
          margin: 0;
          font-size: 12px;
          line-height: 1.55;
          color: var(--syn-text-secondary);
        }


        .tech-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }
        .tech-badge {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid var(--syn-border-subtle);
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
          color: var(--syn-interaction-active);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }


        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .step-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .step-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--syn-border-active);
          color: var(--syn-interaction-active);
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .step-title {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--syn-text-default);
        }
        .step-desc {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--syn-text-secondary);
        }


        .welcome-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 14px 24px;
          border-top: 1px solid var(--syn-border-subtle);
          background: var(--syn-surface-navigation);
        }

        .footer-content {
          flex: 1;
        }
        .footer-text {
          margin: 0;
          font-size: 13px;
          color: var(--syn-text-secondary);
          display: flex;
          align-items: center;
        }

        .btn-close-welcome {
          padding: 7px 14px;
          border-radius: 3px;
          border: 1px solid var(--syn-interaction-active);
          background: var(--syn-interaction-active);
          color: var(--syn-text-inverse);
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .btn-close-welcome:hover {
          background: color-mix(in srgb, var(--syn-interaction-active) 86%, white);
          border-color: color-mix(in srgb, var(--syn-interaction-active) 86%, white);
        }
        .btn-close-welcome:active {
          transform: translateY(0);
        }


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
            padding: 12px 0 0;
            width: 100%;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 768px) {
          .welcome-hero {
            padding: 16px;
          }
          .welcome-hero__content {
            grid-template-columns: 1fr;
            grid-template-areas:
              "icon"
              "title"
              "subtitle"
              "stats";
          }
          .hero-title__brand {
            font-size: 20px;
            flex-wrap: wrap;
          }
          .welcome-content {
            padding: 16px;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .welcome-footer {
            flex-direction: column;
            align-items: stretch;
            padding: 14px 16px;
          }
          .hero-stats {
            gap: 12px;
          }
          .stat-divider {
            width: 80%;
            height: 1px;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WelcomeModal;
