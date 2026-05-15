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
          <div className="welcome-hero__background" aria-hidden="true">
            <div className="hero-orb hero-orb--1" />
            <div className="hero-orb hero-orb--2" />
            <div className="hero-orb hero-orb--3" />
            <div className="hero-orb hero-orb--4" />
            <div className="hero-particles">
              <div className="particle particle--1" />
              <div className="particle particle--2" />
              <div className="particle particle--3" />
              <div className="particle particle--4" />
              <div className="particle particle--5" />
              <div className="particle particle--6" />
              <div className="particle particle--7" />
              <div className="particle particle--8" />
            </div>
            <div className="hero-grid" />
            <div className="hero-waves">
              <div className="wave wave--1" />
              <div className="wave wave--2" />
              <div className="wave wave--3" />
            </div>
            <div className="hero-rings">
              <div className="ring ring--1" />
              <div className="ring ring--2" />
              <div className="ring ring--3" />
            </div>
          </div>

          <div className="welcome-hero__content">
            <div className="hero-icon" aria-hidden="true">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="80" y2="80">
                    <stop offset="0%" stopColor="#F59E0B">
                      <animate attributeName="stop-color" values="#F59E0B;#FBBF24;#F59E0B" dur="4s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="50%" stopColor="#D97706">
                      <animate attributeName="stop-color" values="#D97706;#B45309;#D97706" dur="4s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" stopColor="#92400E">
                      <animate attributeName="stop-color" values="#92400E;#78350F;#92400E" dur="4s" repeatCount="indefinite"/>
                    </stop>
                  </linearGradient>
                  <radialGradient id="heroRadial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6">
                      <animate attributeName="stop-opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" stopColor="#92400E" stopOpacity="0"/>
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <g filter="url(#glow)">
                  <circle cx="40" cy="40" r="38" stroke="url(#heroGrad)" strokeWidth="2" opacity="0.9">
                    <animate attributeName="r" values="38;39;38" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="40" cy="40" r="32" stroke="url(#heroGrad)" strokeWidth="1.5" opacity="0.5">
                    <animate attributeName="r" values="32;33;32" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="40" cy="40" r="30" fill="url(#heroRadial)" opacity="0.3">
                    <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite"/>
                  </circle>
                  <path d="M40 16 L40 40 M40 40 L56 40 M40 40 L40 64 M40 40 L24 40" stroke="url(#heroGrad)" strokeWidth="4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="20s" repeatCount="indefinite"/>
                  </path>
                  <circle cx="40" cy="40" r="5" fill="url(#heroGrad)">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="24" cy="24" r="3" fill="#F59E0B" opacity="0.9">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="56" cy="56" r="3" fill="#92400E" opacity="0.9">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="56" cy="24" r="2.5" fill="#F59E0B" opacity="0.7">
                    <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="24" cy="56" r="2.5" fill="#D97706" opacity="0.7">
                    <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                </g>
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
                style={{color: '#F59E0B', textDecoration: 'none', borderBottom: '1px solid rgba(245,158,11,0.3)'}}
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
            <p className="footer-text" style={{marginTop: '8px', fontSize: '12px', color: '#A8A29E'}}>
              Developed by <strong style={{color: '#A8A29E'}}>Mustafa Raşit Şahin, PhD</strong> •
              Built on <a
                href="https://github.com/mustafaras/Synapse_IDE"
                target="_blank"
                rel="noopener noreferrer"
                style={{color: '#F59E0B', textDecoration: 'none', borderBottom: '1px solid rgba(245,158,11,0.2)', marginLeft: '4px'}}
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
          background: rgba(0, 0, 0, 0.95) !important;
          backdrop-filter: blur(40px) !important;
          -webkit-backdrop-filter: blur(40px) !important;
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
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
          }
        }
        @keyframes backdropFadeOut {
          from {
            opacity: 1;
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
          }
          to {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
        }

        .welcome-modal__panel {
          position: relative;
          width: min(1400px, calc(100vw - 48px));
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          background: var(--syn-gradient-surface);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: 32px;
          box-shadow:
            0 32px 120px -16px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 60px rgba(245, 158, 11, 0.15);
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
          padding: 36px 60px 32px;
          overflow: hidden;
          background: var(--syn-gradient-overlay-fade);
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
          flex-shrink: 0;
        }

        .welcome-hero__background {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: pulse 8s ease-in-out infinite;
        }
        .hero-orb--1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #F59E0B 0%, transparent 70%);
          top: -150px;
          right: -100px;
          animation: orbitPulse1 12s ease-in-out infinite, float1 8s ease-in-out infinite;
        }
        .hero-orb--2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #D97706 0%, transparent 70%);
          bottom: -100px;
          left: -80px;
          animation: orbitPulse2 10s ease-in-out infinite 1s, float2 7s ease-in-out infinite 1s;
        }
        .hero-orb--3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, #92400E 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: orbitPulse3 14s ease-in-out infinite 2s, rotate360 20s linear infinite;
        }
        .hero-orb--4 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #FBBF24 0%, transparent 70%);
          top: -50px;
          left: -50px;
          animation: orbitPulse4 9s ease-in-out infinite 1.5s, float3 6s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes orbitPulse1 {
          0%, 100% { opacity: 0.25; transform: scale(1) translateX(0); }
          25% { opacity: 0.35; transform: scale(1.15) translateX(30px); }
          50% { opacity: 0.3; transform: scale(1.1) translateX(0); }
          75% { opacity: 0.4; transform: scale(0.95) translateX(-30px); }
        }
        @keyframes orbitPulse2 {
          0%, 100% { opacity: 0.3; transform: scale(1) translateY(0); }
          33% { opacity: 0.4; transform: scale(1.2) translateY(-40px); }
          66% { opacity: 0.25; transform: scale(0.9) translateY(20px); }
        }
        @keyframes orbitPulse3 {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.45; transform: translate(-50%, -50%) scale(1.25); }
        }
        @keyframes orbitPulse4 {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          25% { opacity: 0.4; transform: scale(1.1) translate(20px, -20px); }
          50% { opacity: 0.35; transform: scale(1.15) translate(0, -30px); }
          75% { opacity: 0.3; transform: scale(1.05) translate(-20px, -10px); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(25px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(35px); }
        }
        @keyframes rotate360 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }


        .hero-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #F59E0B;
          border-radius: 50%;
          box-shadow: var(--shadow-glow);
        }
        .particle--1 {
          top: 20%;
          left: 10%;
          animation: particleFloat1 8s ease-in-out infinite, particleFade 4s ease-in-out infinite;
        }
        .particle--2 {
          top: 40%;
          left: 80%;
          width: 3px;
          height: 3px;
          animation: particleFloat2 10s ease-in-out infinite 1s, particleFade 5s ease-in-out infinite 1s;
        }
        .particle--3 {
          top: 60%;
          left: 15%;
          width: 5px;
          height: 5px;
          animation: particleFloat3 12s ease-in-out infinite 2s, particleFade 6s ease-in-out infinite 2s;
        }
        .particle--4 {
          top: 80%;
          left: 70%;
          animation: particleFloat4 9s ease-in-out infinite 0.5s, particleFade 4.5s ease-in-out infinite 0.5s;
        }
        .particle--5 {
          top: 15%;
          left: 50%;
          width: 3px;
          height: 3px;
          background: #FBBF24;
          animation: particleFloat1 11s ease-in-out infinite 1.5s, particleFade 5.5s ease-in-out infinite 1.5s;
        }
        .particle--6 {
          top: 70%;
          left: 40%;
          animation: particleFloat2 13s ease-in-out infinite 2.5s, particleFade 6.5s ease-in-out infinite 2.5s;
        }
        .particle--7 {
          top: 30%;
          left: 90%;
          width: 4px;
          height: 4px;
          background: #D97706;
          animation: particleFloat3 10s ease-in-out infinite 0.8s, particleFade 5s ease-in-out infinite 0.8s;
        }
        .particle--8 {
          top: 50%;
          left: 25%;
          width: 3px;
          height: 3px;
          animation: particleFloat4 14s ease-in-out infinite 3s, particleFade 7s ease-in-out infinite 3s;
        }

        @keyframes particleFloat1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -40px); }
          50% { transform: translate(60px, -20px); }
          75% { transform: translate(30px, -60px); }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-40px, 30px); }
          66% { transform: translate(-20px, 60px); }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(50px, -50px) rotate(180deg); }
        }
        @keyframes particleFloat4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-30px, -30px) scale(1.2); }
          50% { transform: translate(-60px, 0) scale(0.8); }
          75% { transform: translate(-30px, 30px) scale(1.1); }
        }
        @keyframes particleFade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }


        .hero-waves {
          position: absolute;
          inset: 0;
          overflow: hidden;
          opacity: 0.15;
        }
        .wave {
          position: absolute;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(245, 158, 11, 0.3) 25%,
            rgba(245, 158, 11, 0.5) 50%,
            rgba(245, 158, 11, 0.3) 75%,
            transparent 100%);
        }
        .wave--1 {
          top: 0;
          left: -100%;
          animation: waveMove1 15s linear infinite;
        }
        .wave--2 {
          top: 30%;
          left: -100%;
          height: 40%;
          animation: waveMove2 20s linear infinite 5s;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(245, 158, 11, 0.2) 25%,
            rgba(245, 158, 11, 0.4) 50%,
            rgba(245, 158, 11, 0.2) 75%,
            transparent 100%);
        }
        .wave--3 {
          bottom: 0;
          left: -100%;
          height: 60%;
          animation: waveMove3 25s linear infinite 10s;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(217, 119, 6, 0.25) 25%,
            rgba(217, 119, 6, 0.45) 50%,
            rgba(217, 119, 6, 0.25) 75%,
            transparent 100%);
        }
        @keyframes waveMove1 {
          from { transform: translateX(0); }
          to { transform: translateX(50%); }
        }
        @keyframes waveMove2 {
          from { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(25%) scaleY(1.2); }
          to { transform: translateX(50%) scaleY(1); }
        }
        @keyframes waveMove3 {
          from { transform: translateX(0) scaleY(1); }
          33% { transform: translateX(16.5%) scaleY(0.9); }
          66% { transform: translateX(33%) scaleY(1.1); }
          to { transform: translateX(50%) scaleY(1); }
        }


        .hero-rings {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          pointer-events: none;
        }
        .ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 2px solid rgba(245, 158, 11, 0.2);
        }
        .ring--1 {
          width: 300px;
          height: 300px;
          animation: ringExpand1 6s ease-in-out infinite;
        }
        .ring--2 {
          width: 400px;
          height: 400px;
          animation: ringExpand2 8s ease-in-out infinite 2s;
          border-color: rgba(245, 158, 11, 0.15);
        }
        .ring--3 {
          width: 500px;
          height: 500px;
          animation: ringExpand3 10s ease-in-out infinite 4s;
          border-color: rgba(217, 119, 6, 0.1);
        }
        @keyframes ringExpand1 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.6;
          }
        }
        @keyframes ringExpand2 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.7) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3) rotate(180deg);
            opacity: 0.5;
          }
        }
        @keyframes ringExpand3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.4) rotate(-180deg);
            opacity: 0.4;
          }
        }
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1) translate(var(--tx, 0), var(--ty, 0)); opacity: 0.25; }
          50% { transform: scale(1.2) translate(var(--tx, 0), var(--ty, 0)); opacity: 0.4; }
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(245, 158, 11, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.3;
          animation: gridShift 20s linear infinite;
        }
        @keyframes gridShift {
          from { background-position: 0 0, 0 0; }
          to { background-position: 50px 50px, 50px 50px; }
        }

        .welcome-hero__content {
          position: relative;
          z-index: 2;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .hero-icon {
          margin-bottom: 4px;
          filter: drop-shadow(0 0 30px rgba(245, 158, 11, 0.4));
          animation: iconLevitate 4s ease-in-out infinite;
        }
        .hero-icon svg {
          width: 52px;
          height: 52px;
          animation: iconRotate 20s linear infinite;
        }

        @keyframes iconLevitate {
          0%, 100% {
            transform: translateY(0px);
            filter: drop-shadow(0 0 30px rgba(245, 158, 11, 0.4));
          }
          50% {
            transform: translateY(-8px);
            filter: drop-shadow(0 4px 40px rgba(245, 158, 11, 0.7));
          }
        }
        @keyframes iconRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .hero-title__line {
          font-size: 14px;
          font-weight: 400;
          color: #A8A29E;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hero-title__brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 38px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .brand-text--primary {
          background: linear-gradient(135deg, #D6D3D1 0%, #A8A29E 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textShimmer 3s ease-in-out infinite;
        }
        .brand-separator {
          color: rgba(245, 158, 11, 0.6);
          font-weight: 300;
          font-size: 48px;
          animation: separatorPulse 2s ease-in-out infinite;
        }
        .brand-text--secondary {
          background: var(--syn-gradient-amber-strong);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientFlow 4s ease-in-out infinite;
        }
        .brand-badge {
          font-size: 18px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 10px;
          background: var(--syn-gradient-glass-amber);
          border: 1px solid rgba(245, 158, 11, 0.45);
          color: #F59E0B;
          text-shadow: 0 0 12px rgba(245, 158, 11, 0.7);
          box-shadow: var(--shadow-glow);
          align-self: flex-start;
          margin-top: 8px;
          animation: badgePulse 2.5s ease-in-out infinite;
        }

        @keyframes textShimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        @keyframes separatorPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: var(--shadow-glow);
          }
          50% {
            transform: scale(1.05);
            box-shadow: var(--shadow-glow);
          }
        }

        .hero-subtitle {
          margin: 0;
          font-size: 16px;
          color: #A8A29E;
          max-width: 600px;
          line-height: 1.5;
          animation: subtitleFade 3s ease-in-out infinite;
        }

        @keyframes subtitleFade {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-top: 10px;
          padding: 14px 32px;
          background: var(--syn-gradient-glass-amber);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          animation: statFloat 3s ease-in-out infinite;
        }
        .stat-item:nth-child(1) { animation-delay: 0s; }
        .stat-item:nth-child(3) { animation-delay: 0.5s; }
        .stat-item:nth-child(5) { animation-delay: 1s; }

        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #F59E0B;
          text-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
          animation: statGlow 2s ease-in-out infinite;
        }
        .stat-label {
          font-size: 11px;
          color: #A8A29E;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: linear-gradient(180deg, transparent, rgba(245, 158, 11, 0.3), transparent);
          animation: dividerPulse 3s ease-in-out infinite;
        }

        @keyframes statFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes statGlow {
          0%, 100% {
            text-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
            filter: brightness(1);
          }
          50% {
            text-shadow: 0 0 24px rgba(245, 158, 11, 0.8);
            filter: brightness(1.2);
          }
        }
        @keyframes dividerPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }


        .welcome-content {
          flex: 1;
          overflow: auto;
          padding: 48px 60px 32px;
          display: flex;
          flex-direction: column;
          gap: 48px;
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
          gap: 16px;
        }
        .welcome-section--highlight {
          padding: 32px;
          background: var(--syn-gradient-glass-amber);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 20px;
        }

        .section-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: var(--syn-gradient-glass-amber);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #F59E0B;
          box-shadow: var(--shadow-glow);
        }

        .section-title {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #D6D3D1;
        }

        .section-text {
          margin: 0;
          font-size: 15px;
          line-height: 1.8;
          color: #A8A29E;
        }


        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .feature-card {
          padding: 28px;
          background: var(--syn-gradient-glass-subtle);
          border: 1px solid rgba(245, 158, 11, 0.12);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: var(--syn-transition-slow);
        }
        .feature-card:hover {
          background: var(--syn-gradient-glass-amber);
          border-color: rgba(245, 158, 11, 0.3);
          transform: translateY(-4px);
          box-shadow: var(--shadow-glow);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--syn-gradient-glass-amber);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #F59E0B;
        }

        .feature-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #D6D3D1;
        }

        .feature-desc {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.6;
          color: #A8A29E;
        }


        .tech-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }
        .tech-badge {
          padding: 8px 16px;
          background: var(--syn-gradient-glass-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #F59E0B;
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
          gap: 20px;
          align-items: flex-start;
        }
        .step-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #000000;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: var(--shadow-glow);
        }
        .step-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .step-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #D6D3D1;
        }
        .step-desc {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #A8A29E;
        }


        .welcome-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 24px 60px 32px;
          border-top: 1px solid rgba(245, 158, 11, 0.15);
          background: linear-gradient(180deg, transparent 0%, rgba(245, 158, 11, 0.04) 100%);
        }

        .footer-content {
          flex: 1;
        }
        .footer-text {
          margin: 0;
          font-size: 13px;
          color: #A8A29E;
          display: flex;
          align-items: center;
        }

        .btn-close-welcome {
          padding: 14px 32px;
          border-radius: 14px;
          border: 1px solid rgba(245, 158, 11, 0.5);
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #000000;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: var(--shadow-glow),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: var(--syn-transition-medium);
        }
        .btn-close-welcome:hover {
          transform: translateY(-2px);
          box-shadow:
            0 6px 28px rgba(245, 158, 11, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          filter: brightness(1.08);
        }
        .btn-close-welcome:active {
          transform: translateY(0);
        }


        @media (max-width: 768px) {
          .welcome-hero {
            padding: 48px 32px;
          }
          .hero-title__brand {
            font-size: 36px;
            flex-wrap: wrap;
            justify-content: center;
          }
          .welcome-content {
            padding: 32px 32px 24px;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .welcome-footer {
            flex-direction: column;
            padding: 20px 32px 24px;
          }
          .hero-stats {
            flex-direction: column;
            gap: 16px;
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
