import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/tools.module.css";


import { filterProjects, useProjectRegistry } from "../registry/state";
import type { Filter, ProjectFilter, ProjectRecord } from "../registry/types";


import type { DeidPolicy } from "./lib/assemble";
import { flags } from "../../config/flags";
import type { IndicatorCatalogFocusRequest } from "@/features/urbanAnalytics/indicators/types";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";

const PreviewPanel = lazyWithRetry(() => import("./PreviewPanel"), { recoveryPath: "/" });
const ExportBar = lazyWithRetry(() => import("./ExportBar"), { recoveryPath: "/" });
const ConsultonPanel = lazyWithRetry(() => import("./ConsultonPanel"), { recoveryPath: "/" });
const CapabilitiesOverviewPanel = lazyWithRetry(() => import("./components/CapabilitiesOverviewPanel"), { recoveryPath: "/" });
const EOConnectorPanel = lazyWithRetry(() => import("./components/EOConnectorPanel"), { recoveryPath: "/" });
const SpatialIndexLab = lazyWithRetry(() => import("./components/SpatialIndexLab"), { recoveryPath: "/" });
const GeoAILab = lazyWithRetry(() => import("./components/GeoAILab"), { recoveryPath: "/" });
const StreamingLab = lazyWithRetry(() => import("./components/StreamingLab"), { recoveryPath: "/" });
const CoverageDiagnosticsPanel = lazyWithRetry(() => import("./components/CoverageDiagnosticsPanel"), { recoveryPath: "/" });

const IndicatorCatalogPanel = lazyWithRetry(
  () => import("@/features/urbanAnalytics/indicators/IndicatorCatalogPanel"),
  { recoveryPath: "/" },
);

function ToolSectionFallback({ label }: { label: string }): React.ReactElement {
  return (
    <div className={styles.meta} role="status" aria-live="polite">
      {label}
    </div>
  );
}


const LS = {
  scope: "tools.scope",
  deid: "tools.deidPreset",
  consent: "tools.consent"
} as const;


const ID_SCOPE = "tools-scope" as const;
const ID_CAPABILITIES = "tools-capabilities" as const;
const ID_PREVIEW = "tools-preview" as const;
const ID_EXPORT = "tools-export" as const;
const ID_CONSULTON = "tools-consulton" as const;
const ID_EO = "tools-eo" as const;
const ID_GEOAI = "tools-geoai" as const;
const ID_SPATIAL_INDEX = "tools-spatial-index" as const;
const ID_STREAMING = "tools-streaming" as const;
const ID_COVERAGE = "tools-coverage" as const;
const ID_INDICATORS = "tools-indicators" as const;

type ScopeKind = "session" | "project" | "cohort";
type DeidPreset = "none" | "limited" | "safe";

interface ToolsActionPanelProps {
  indicatorFocusRequest?: IndicatorCatalogFocusRequest | null;
}


function relTime(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor((diff % 86400000) / 3600000);
  if (h > 0) return `${h}h ago`;
  const m = Math.floor((diff % 3600000) / 60000);
  if (m > 0) return `${m}m ago`;
  return "just now";
}


const sx = (v?: string | number | null) => (v === undefined || v === null || v === "" ? "—" : String(v));


const plural = (n: number, one: string, many?: string) => (n === 1 ? `1 ${one}` : `${n} ${many ?? `${one}s`}`);


function describeFilter(filter: Filter | ProjectFilter, totalCount: number, filteredCount: number): string {

  const isAll = filteredCount === totalCount;
  if (isAll) return "Cohort: All";

  const bits: string[] = [];
  const legacyFilter = filter as Filter;
  if (legacyFilter.cohorts && legacyFilter.cohorts.length && !(legacyFilter.cohorts.length === 1 && legacyFilter.cohorts[0] === "All")) {
    bits.push(`Scope:${legacyFilter.cohorts.join("+")}`);
  }
  if (legacyFilter.risk && legacyFilter.risk.length) {
    bits.push(`Risk:${legacyFilter.risk.join(",")}`);
  }
  if (legacyFilter.tags && legacyFilter.tags.length) {
    bits.push(`Tags:${legacyFilter.tags.join(",")}`);
  }
  const q = (filter as unknown as { search?: string }).search;
  if (q && String(q).trim()) bits.push(`Search:“${String(q).trim()}”`);
  return bits.length ? `Cohort: ${bits.join(" • ")}` : "Cohort: Filters active";
}


function useRovingRadios(values: ScopeKind[], current: ScopeKind, onChange: (v: ScopeKind) => void) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => { refs.current = refs.current.slice(0, values.length); }, [values.length]);
  function onKeyDown(e: React.KeyboardEvent) {
    const idx = values.indexOf(current);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = values[(idx + 1) % values.length];
      onChange(next);
      refs.current[values.indexOf(next)]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = values[(idx - 1 + values.length) % values.length];
      onChange(prev);
      refs.current[values.indexOf(prev)]?.focus();
    }
  }
  return { refs, onKeyDown };
}


function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    el.scrollIntoView();
  }
}

export default function ToolsActionPanel({ indicatorFocusRequest = null }: ToolsActionPanelProps) {

  const { state } = useProjectRegistry();
  const selectedProjectId = state.selectedProjectId;
  const selectedSessionId = state.selectedSessionId;
  const projects = state.projects ?? [];
  const activeProject: ProjectRecord | undefined = projects.find(p => p.id === selectedProjectId);


  const aliasOrName = sx(activeProject?.name);
  const pid = sx(activeProject?.id ?? selectedProjectId);
  const scale = activeProject?.scale ?? "—";
  const priority = activeProject?.priority != null ? String(activeProject.priority) : "—";
  const tags = (activeProject?.tags ?? []).join(", ") || "—";

  const sessions = (activeProject as any)?.sessions ?? (activeProject as any)?.encounters ?? [];
  const lastEnc = sessions.length ? [...sessions].sort((a: any, b: any) => (b.when ?? 0) - (a.when ?? 0))[0] : undefined;
  const lastEncRel = relTime(lastEnc?.when);


  const cohortRows = useMemo(() => filterProjects(state), [state]);
  const cohortCount = cohortRows.length;
  const totalCount = projects.length;
  const cohortDesc = describeFilter(state.filter, totalCount, cohortCount);


  const [scope, setScope] = useState<ScopeKind>(() => {
    const raw = localStorage.getItem(LS.scope) as ScopeKind | null;
    return raw === "session" || raw === "project" || raw === "cohort" ? raw : "project";
  });
  const [deid, setDeid] = useState<DeidPreset>(() => {
    const raw = localStorage.getItem(LS.deid) as DeidPreset | null;
    return raw === "none" || raw === "limited" || raw === "safe" ? raw : "limited";
  });
  const [consent, setConsent] = useState<boolean>(() => localStorage.getItem(LS.consent) === "true");


  useEffect(() => { localStorage.setItem(LS.scope, scope); }, [scope]);
  useEffect(() => { localStorage.setItem(LS.deid, deid); }, [deid]);
  useEffect(() => { localStorage.setItem(LS.consent, String(consent)); }, [consent]);
  useEffect(() => {
    if (indicatorFocusRequest) {
      scrollToId(ID_INDICATORS);
    }
  }, [indicatorFocusRequest?.requestedAt]);


  const hasActiveSession = Boolean(selectedSessionId) || (sessions?.length ?? 0) > 0;
  const hasActiveProject = Boolean(activeProject);

  const scopeCountSummary = useMemo(() => {
    switch (scope) {
      case "session": return hasActiveSession ? "1 session" : "0 sessions";
      case "project":   return hasActiveProject ? "1 project" : "0 projects";
      case "cohort":    return plural(cohortCount, "project");
      default:          return "—";
    }
  }, [scope, hasActiveSession, hasActiveProject, cohortCount]);


  const sessionDisabled = !hasActiveSession;


  const segValues: ScopeKind[] = ["session", "project", "cohort"];
  const { refs: segRefs, onKeyDown: onSegKey } = useRovingRadios(segValues, scope, setScope);


  const policy: DeidPolicy = useMemo(() => ({
    preset: deid,
    seed: "tools-preview-v1",
    anonymize: deid !== "none",
  }), [deid]);


  return (
    <div
      className={`${styles.wrap} ${styles.toolsCenter} ${styles.themeAmber} ${styles.deepBlack}`}
      role="main"
      aria-labelledby="tools-title"
      data-testid="tools-center"

    >
      {}
      <nav className={styles.skipLinks} aria-label="Skip links">
        <a className={styles.skipLink} href={`#${ID_CAPABILITIES}`}>Skip to capabilities overview</a>
        <a className={styles.skipLink} href={`#${ID_EO}`}>Skip to EO connectors</a>
        <a className={styles.skipLink} href={`#${ID_SPATIAL_INDEX}`}>Skip to Spatial Index Lab</a>
        <a className={styles.skipLink} href={`#${ID_GEOAI}`}>Skip to GeoAI Lab</a>
        <a className={styles.skipLink} href={`#${ID_STREAMING}`}>Skip to Streaming Runtime</a>
        <a className={styles.skipLink} href={`#${ID_COVERAGE}`}>Skip to QA coverage</a>
        <a className={styles.skipLink} href={`#${ID_INDICATORS}`}>Skip to Indicator Catalog</a>
        <a className={styles.skipLink} href={`#${ID_SCOPE}`}>Skip to Export scope</a>
        <a className={styles.skipLink} href={`#${ID_PREVIEW}`}>Skip to Preview</a>
        <a className={styles.skipLink} href={`#${ID_EXPORT}`}>Skip to Export actions</a>
      </nav>
      {}
      <header className={styles.cardHeader} role="region" aria-label="Tools header" data-testid="tools-header">
        <div id="tools-title" className={styles.cardTitle}>Tools</div>
        <div className={styles.cardSub}>Center actions &amp; exports</div>

        {}
        <div className={styles.hstack} style={{ marginTop: 8 }}>
          <div className={styles.seg} role="tablist" aria-label="Tools sections">
            {}
            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_EO)}
              data-testid="tools-nav-eo"
            >
              EO
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_SCOPE)}
              data-testid="tools-nav-scope"
            >
              Scope
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_CAPABILITIES)}
              data-testid="tools-nav-capabilities"
            >
              Index
            </button>

            {}
            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_PREVIEW)}
              data-testid="tools-nav-preview"
            >
              Preview
            </button>

            {}
            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_GEOAI)}
              data-testid="tools-nav-geoai"
            >
              GeoAI
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_SPATIAL_INDEX)}
              data-testid="tools-nav-index"
            >
              Index
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_STREAMING)}
              data-testid="tools-nav-streaming"
            >
              Streaming
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_COVERAGE)}
              data-testid="tools-nav-coverage"
            >
              QA
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_INDICATORS)}
              data-testid="tools-nav-indicators"
            >
              Indicators
            </button>

            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_CONSULTON)}
              data-testid="tools-nav-consult"
              title={flags.consultonAI ? undefined : "(flag off in this env; forced visible for demo)"}
            >
              Consult
            </button>

            {}
            <button
              type="button"
              role="tab"
              className={styles.segBtn}
              aria-selected="false"
              onClick={() => scrollToId(ID_EXPORT)}
              data-testid="tools-nav-export"
            >
              Export
            </button>
          </div>
        </div>
        {}
      </header>

      <section
        id={ID_CAPABILITIES}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="capabilities-heading"
        tabIndex={-1}
        data-testid="tools-card-capabilities"
      >
        <h2 id="capabilities-heading" className={styles.srOnly}>Release candidate capabilities overview</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Capabilities Overview</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Navigable release index for tabs, workflows, runtime labs, and verification walkthroughs</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 12 }}>
          This release index makes the strengthened workbench auditable from inside the product by exposing direct entry points into every major workspace tab, analytical workflow, and runtime laboratory.
        </div>
        <ChunkLoadBoundary compact title="Capabilities overview unavailable" message="Reload the toolbox if the release index fails to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading capabilities overview..." />}>
            <CapabilitiesOverviewPanel onOpenToolSurface={scrollToId} />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      <section
        id={ID_EO}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="eo-heading"
        tabIndex={-1}
        data-testid="tools-card-eo"
        style={{ marginTop: 14 }}
      >
        <h2 id="eo-heading" className={styles.srOnly}>Earth observation source registry and connector workflows</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>EO Connectors</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Shared raster source registry, provenance, and publication hooks</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 12 }}>
          This operator panel turns the EO connector stack into a reusable product surface with STAC search, COG inspection, Sentinel Hub processing, envelope selection, and a registry-backed selected-source summary for downstream GeoAI work.
        </div>
        <ChunkLoadBoundary compact title="EO connectors unavailable" message="Reload the toolbox if the EO connector panel fails to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading EO connectors..." />}>
            <EOConnectorPanel />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      <section
        id={ID_GEOAI}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="geoai-heading"
        tabIndex={-1}
        style={{ marginTop: 14 }}
        data-testid="tools-card-geoai"
      >
        <h2 id="geoai-heading" className={styles.srOnly}>GeoAI runtime and publishing workflows</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>GeoAI Lab</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Operational land-cover, object-detection routing, and deterministic NL to SQL</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 12 }}>
          This surface closes the remaining GeoAI scaffolding gap with live model registry visibility, end-to-end land-cover publication, and a transparent natural-language query interpreter that routes published outputs into map and run-review workflows.
        </div>
        <ChunkLoadBoundary compact title="GeoAI lab unavailable" message="Reload the toolbox or navigate back if the GeoAI lab fails to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading GeoAI lab..." />}>
            <GeoAILab />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      <section
        id={ID_SPATIAL_INDEX}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="spatial-index-heading"
        tabIndex={-1}
        data-testid="tools-card-spatial-index"
        style={{ marginTop: 14 }}
      >
        <h2 id="spatial-index-heading" className={styles.srOnly}>Spatial index acceleration</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Spatial Index Lab</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>WASM-backed bbox and nearest-neighbor diagnostics</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 12 }}>
          This laboratory surfaces the runtime selected for spatial prefiltering, measures query response time against a deterministic JavaScript baseline, and exposes the active project extent as the benchmark study area.
        </div>
        <ChunkLoadBoundary compact title="Spatial index lab unavailable" message="Reload the toolbox or return later if the spatial index diagnostics fail to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading spatial index lab..." />}>
            <SpatialIndexLab project={activeProject} />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      <section
        id={ID_STREAMING}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="streaming-heading"
        tabIndex={-1}
        data-testid="tools-card-streaming"
        style={{ marginTop: 14 }}
      >
        <h2 id="streaming-heading" className={styles.srOnly}>Streaming telemetry runtime</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Streaming Runtime</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Replay, WebSocket, and MQTT connectors with live operational status</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 12 }}>
          The streaming engine now exposes functional infrastructure rather than an empty export, with deterministic replay for operator verification and live connector modes for WebSocket or MQTT-based urban telemetry feeds.
        </div>
        <ChunkLoadBoundary compact title="Streaming runtime unavailable" message="Reload the toolbox if the streaming diagnostics fail to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading streaming runtime..." />}>
            <StreamingLab />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      <section
        id={ID_COVERAGE}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="coverage-diagnostics-heading"
        tabIndex={-1}
        data-testid="tools-card-coverage"
        style={{ marginTop: 14 }}
      >
        <h2 id="coverage-diagnostics-heading" className={styles.srOnly}>Analytical QA coverage</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Analytical QA Coverage</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Vitest coverage thresholds and CI gating for critical analytical modules</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 14 }}>
          This diagnostics surface publishes the current analytical coverage snapshot so developers can inspect threshold compliance before shipping new spatial, simulation, GeoAI, or indicator work.
        </div>
        <ChunkLoadBoundary compact title="Coverage diagnostics unavailable" message="Generate the coverage artifact or reload the toolbox if this QA surface fails to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading analytical QA coverage..." />}>
            <CoverageDiagnosticsPanel />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      <section
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-label="Reporting builder"
        style={{ marginTop: 14 }}
      >
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Reporting Builder</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Structured reports, citations, and exports</div>
        </div>
        <div className={styles.calloutBody} style={{ display: "grid", gap: 10 }}>
          <div className={styles.meta}>
            Open the report builder to assemble technical reports, policy briefs, EIA documents, and SDG progress reports from analytical results.
          </div>
          <div className={styles.hstack}>
            <button
              type="button"
              className={styles.segBtn}
              onClick={() => window.dispatchEvent(new CustomEvent("synapse:navigate", { detail: { tab: "Report" } }))}
            >
              Open Report Builder
            </button>
          </div>
        </div>
      </section>

      <section
        id={ID_INDICATORS}
        className={`${styles.panel} ${styles.panelAmber}`}
        aria-labelledby="indicator-catalog-heading"
        tabIndex={-1}
        data-testid="tools-card-indicators"
        style={{ marginTop: 14 }}
      >
        <h2 id="indicator-catalog-heading" className={styles.srOnly}>Indicator catalog</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Indicator Catalog</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>Compute, explain, and route Prompt 36 indicators into dashboards and reports</div>
        </div>
        <div className={styles.meta} style={{ marginTop: 10, marginBottom: 14 }}>
          The Toolbox now exposes the Section 11 additional indicator library with formula-level documentation, structured inputs, and direct actions for dashboard, report, and education workflows.
        </div>
        <ChunkLoadBoundary compact title="Indicator catalog unavailable" message="Reload the toolbox or navigate directly to the Urban Analytics workspace if the catalog fails to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading indicator catalog..." />}>
            <IndicatorCatalogPanel focusRequest={indicatorFocusRequest} />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      {}
      <section
        id={ID_SCOPE}
        className={`${styles.panel} ${styles.accentMod} ${styles.panelAmber}`}
        aria-labelledby="scope-heading"
        tabIndex={-1}
        data-testid="tools-card-scope"
      >
        <h2 id="scope-heading" className={styles.srOnly}>Export scope</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Export scope</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>{scopeCountSummary}</div>
        </div>

        {}
        <div className={`${styles.callout} ${styles.calloutInfo}`}>
          <div className={styles.calloutHeader}>
            <div className={styles.calloutTitle}>Active Project</div>
            <div className={styles.calloutMeta} role="status" aria-live="polite">Last session {lastEncRel}</div>
          </div>
          <div className={styles.calloutBody}>
            <div className={styles.kvRow}>
              <span className={`${styles.kvKey} ${styles.labelSmall}`}>Name</span>
              <span className={`${styles.kvVal} ${styles.textStronger}`}>{aliasOrName}</span>
              <span className={`${styles.kvKey} ${styles.labelSmall}`}>ID</span>
              <span className={`${styles.kvVal} ${styles.textStronger}`}>{pid}</span>
              <span className={`${styles.kvKey} ${styles.labelSmall}`}>Scale</span>
              <span className={`${styles.kvVal} ${styles.textStronger}`}>{scale}</span>
              <span className={`${styles.kvKey} ${styles.labelSmall}`}>Tags</span>
              <span className={`${styles.kvVal} ${styles.textStronger}`}>{tags}</span>
              <span className={`${styles.kvKey} ${styles.labelSmall}`}>Priority</span>
              <span className={`${styles.kvVal} ${styles.textStronger}`}>{priority}</span>
            </div>
          </div>
        </div>

        {}
        <div style={{ marginTop: 10 }}>
          <div className={styles.labelSmall} style={{ marginBottom: 6 }}>Select scope</div>
          <div
            className={styles.seg}
            role="radiogroup"
            aria-label="Export scope selector"
            tabIndex={0}
            onKeyDown={onSegKey}
          >
            {}
            <button
              ref={(el) => { segRefs.current[0] = el; }}
              type="button"
              role="radio"
              aria-checked={scope === "session"}
              aria-describedby={sessionDisabled ? "session-hint" : undefined}
              aria-disabled={sessionDisabled || undefined}
              disabled={sessionDisabled}
              className={styles.segBtn}
              data-testid="scope-session"
              onClick={() => !sessionDisabled && setScope("session")}
            >
              Current Session
            </button>

            {}
            <button
              ref={(el) => { segRefs.current[1] = el; }}
              type="button"
              role="radio"
              aria-checked={scope === "project"}
              className={styles.segBtn}
              data-testid="scope-project"
              onClick={() => setScope("project")}
            >
              Current Project
            </button>

            {}
            <button
              ref={(el) => { segRefs.current[2] = el; }}
              type="button"
              role="radio"
              aria-checked={scope === "cohort"}
              className={styles.segBtn}
              data-testid="scope-cohort"
              onClick={() => setScope("cohort")}
            >
              Cohort
            </button>
          </div>

          {sessionDisabled ? (
            <div id="session-hint" className={styles.meta} style={{ marginTop: 6 }}>
              (No active session)
            </div>
          ) : null}
        </div>

        {}
        <div className={styles.hstack} style={{ marginTop: 10, alignItems: 'baseline' }}>
          <div className={styles.meta} aria-live="polite"><strong>{cohortDesc}</strong></div>
          <div className={`${styles.pill} ${styles.pillAmber}`} aria-live="polite">{scopeCountSummary}</div>
        </div>

        {}
        <details style={{ marginTop: 12 }}>
          <summary aria-label="Additional options" className={styles.labelSmall}>Additional options</summary>
          <div className={styles.vstack} style={{ gap: 8, marginTop: 8 }}>
            {}
            <label className={styles.row} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" }}>
              <span className={styles.labelSmall}>De-ID preset</span>
              <select
                className={styles.select}
                aria-label="De-identification preset"
                value={deid}
                onChange={(e) => setDeid(e.target.value as DeidPreset)}
                data-testid="deid-preset"
              >
                <option value="none">none (raw)</option>
                <option value="limited">limited</option>
                <option value="safe">safe</option>
              </select>
            </label>

            {}
            <label className={styles.hstack} style={{ alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-label="Consent obtained"
                data-testid="consent-checkbox"
              />
              <span className={styles.labelSmall}>Consent obtained</span>
              <span className={styles.meta}>(optional; show only if policy requires)</span>
            </label>

            <div className={styles.meta}>
              De-ID presets will be applied deterministically in later phases, and the Preview will reflect your choice.
            </div>
          </div>
        </details>
      </section>

      {}
      <section
        id={ID_PREVIEW}
        className={`${styles.panel} ${styles.accentLow} ${styles.panelAmber}`}
        aria-labelledby="preview-heading"
        aria-describedby="preview-desc"
        tabIndex={-1}
        data-testid="tools-card-preview"
      >
        <h2 id="preview-heading" className={styles.srOnly}>Preview &amp; Validation</h2>
        <p id="preview-desc" className={styles.srOnly}>Use Arrow keys to switch preview tabs. Tab to enter tab panel content.</p>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Preview &amp; Validation</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>PDF (HTML print), JSON, CSV</div>
        </div>
        <ChunkLoadBoundary compact title="Preview unavailable" message="Reload the toolbox if preview and validation fail to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading preview and validation..." />}>
            <PreviewPanel scopeKind={scope} policy={policy} csvPreviewRows={25} debounceMs={150} />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      {}
      <section
        id={ID_CONSULTON}
        className={`${styles.panel} ${styles.accentMod} ${styles.panelAmber}`}
        aria-labelledby="consulton-heading"
        data-testid="tools-card-consulton"
      >
        <h2 id="consulton-heading" className={styles.srOnly}>Consulton AI</h2>
        <ChunkLoadBoundary compact title="Consulton unavailable" message="Reload the toolbox if the consult surface fails to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading consult surface..." />}>
            <ConsultonPanel modelLabel="GPT-4o" />
          </Suspense>
        </ChunkLoadBoundary>
      </section>

      {}
      <section
        id={ID_EXPORT}
        className={`${styles.panel} ${styles.accentHigh} ${styles.panelAmber}`}
        aria-labelledby="export-heading"
        tabIndex={-1}
        data-testid="tools-card-export"
      >
        <h2 id="export-heading" className={styles.srOnly}>Export</h2>
        <div className={`${styles.cardHeader} ${styles.cardHeaderV2}`}>
          <div className={`${styles.cardTitle} ${styles.cardTitleV2} ${styles.cardTitleAmber}`}>Export</div>
          <div className={`${styles.cardSub} ${styles.cardSubV2}`}>{scopeCountSummary}</div>
        </div>
        <ChunkLoadBoundary compact title="Export bar unavailable" message="Reload the toolbox if export actions fail to load.">
          <Suspense fallback={<ToolSectionFallback label="Loading export actions..." />}>
            <ExportBar scopeKind={scope} policy={policy} />
          </Suspense>
        </ChunkLoadBoundary>
      </section>
    </div>
  );
}
