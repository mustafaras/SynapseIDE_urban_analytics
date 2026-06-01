import React, { useMemo, useState } from "react";
import { Activity, Cloud, Database, FolderOpen, Globe2, Info, RefreshCw, Wrench, X } from "lucide-react";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  buildDemoPackCatalogInsertion,
  buildMapCatalogItems,
  buildMapSourceReadinessCounts,
  MAP_CATALOG_CATEGORIES,
  type MapCatalogActionResult,
  type MapCatalogConnectionDraft,
  type MapCatalogCategoryId,
  type MapCatalogHealth,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
} from "./catalogModel";
import styles from "./MapCatalogPanel.module.css";
import motionStyles from "../design/motion.module.css";
import { GisEmptyState, GisIconButton, GisStatusChip } from "../ui";
import type { GisStatusKey } from "../mapTokens";

export type MapCatalogPanelPresentation = "floating" | "embedded";
export type MapDataActivitySectionId = "add-data" | "connections" | "catalog" | "source-health" | "demo-data";

export interface MapCatalogPanelProps {
  visible: boolean;
  sourceHandles: readonly SourceHandle[];
  layers: readonly OverlayLayerConfig[];
  onClose: () => void;
  onBrowseSources: () => void;
  onAddDemoPack: (insertion: MapCatalogLayerInsertion) => void;
  onRepairSource: (item: MapCatalogItem) => void;
  onReconnectSource: (item: MapCatalogItem) => Promise<MapCatalogActionResult>;
  onAddConnection: (draft: MapCatalogConnectionDraft) => Promise<MapCatalogActionResult>;
  presentation?: MapCatalogPanelPresentation;
  activeSection?: MapDataActivitySectionId;
  onOpenExternalServices?: () => void;
}

const LOCAL_IMPORT_SUPPORT_ROWS = [
  {
    id: "geojson",
    label: "GeoJSON / JSON",
    status: "Direct import",
    detail: "Feature publishing with topology checks; CRS remains unknown unless the source declares trustworthy metadata.",
  },
  {
    id: "csv",
    label: "CSV",
    status: "Coordinate preview",
    detail: "Latitude/longitude mapping, row preview, and skipped-row diagnostics stay visible before commit.",
  },
  {
    id: "columnar",
    label: "Arrow / GeoParquet",
    status: "Columnar preview",
    detail: "Schema, row counts, worker-transfer readiness, and geometry decoding notes are reviewed before map commit.",
  },
  {
    id: "kml-gpx",
    label: "KML / KMZ / GPX",
    status: "Vector import",
    detail: "Placemarks and traces are imported without fabricating unsupported KML constructs or GPX semantics.",
  },
  {
    id: "shapefile",
    label: "Shapefile",
    status: "Supported",
    detail: "Use .zip when sidecars are needed; bare .shp files have limited CRS and attribute recovery.",
  },
  {
    id: "geopackage",
    label: "GeoPackage",
    status: "Supported",
    detail: "Layer discovery and per-layer CRS are used when exposed by the loader; multi-layer packages require a selected layer.",
  },
  {
    id: "raster-profile",
    label: "GeoTIFF / FGB / PMTiles",
    status: "Partial or sampled",
    detail: "GeoTIFF renders as a sampled raster; FlatGeobuf and PMTiles local uploads stay metadata/profile-oriented.",
  },
] as const;

const PROVIDER_CAVEATS = [
  "External services depend on upstream availability, CORS policy, browser credential mode, attribution, and provider rate limits.",
  "WMS, WMTS, XYZ, and most tile providers are visual references unless a queryable vector service is explicitly connected.",
  "Catalog records never persist credentials, tokens, cookies, or raw source bytes for external providers.",
] as const;

const READINESS_METRICS = [
  { key: "restoredLive", label: "Restored / live" },
  { key: "recoverable", label: "Recoverable" },
  { key: "unavailable", label: "Unavailable" },
  { key: "external", label: "External" },
  { key: "metadataOnly", label: "Metadata-only" },
  { key: "demoSynthetic", label: "Demo / synthetic" },
] as const;

const SECTION_COPY: Record<MapDataActivitySectionId, { title: string; description: string }> = {
  "add-data": {
    title: "Add Data",
    description: "Launch the modal-owned local file picker or review truthful support limits before import.",
  },
  connections: {
    title: "Connections",
    description: "Register external services, run provider health checks, and keep credential caveats visible.",
  },
  catalog: {
    title: "Catalog",
    description: "Browse source handles, generated outputs, restore state, and repair actions in one tree.",
  },
  "source-health": {
    title: "Source Health",
    description: "Counts and per-source states for restored, recoverable, unavailable, external, metadata-only, and demo records.",
  },
  "demo-data": {
    title: "Demo Data",
    description: "Add synthetic onboarding layers while keeping demonstration provenance explicit.",
  },
};

function healthLabel(health: MapCatalogHealth): string {
  switch (health) {
    case "external-reference": return "External";
    case "metadata-only":      return "Metadata only";
    case "rate-limit":         return "Rate limited";
    default:
      return health.charAt(0).toUpperCase() + health.slice(1);
  }
}

function catalogHealthToGisStatus(health: MapCatalogHealth): GisStatusKey {
  switch (health) {
    case "restored":
    case "live":
    case "cached":
      return "ready";
    case "recoverable":
    case "metadata-only":
      return "caveat";
    case "unavailable":
    case "cors":
    case "auth":
    case "rate-limit":
      return "blocked";
    case "external-reference":
    case "offline":
      return "external-offline";
    case "demo":
      return "demo";
    case "untracked":
    case "unknown":
    default:
      return "unknown";
  }
}

function statusNeedsRepair(item: MapCatalogItem): boolean {
  return item.health === "unavailable" || item.health === "metadata-only" || item.health === "untracked";
}

export const MapCatalogPanel: React.FC<MapCatalogPanelProps> = ({
  visible,
  sourceHandles,
  layers,
  onClose,
  onBrowseSources,
  onAddDemoPack,
  onRepairSource,
  onReconnectSource,
  onAddConnection,
  presentation = "floating",
  activeSection = "catalog",
  onOpenExternalServices,
}) => {
  const [query, setQuery] = useState("");
  const [serviceKind, setServiceKind] = useState<MapCatalogConnectionDraft["serviceKind"]>("wms");
  const [title, setTitle] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [crs, setCrs] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<MapCatalogActionResult | null>(null);
  const items = useMemo(() => buildMapCatalogItems(sourceHandles, layers), [layers, sourceHandles]);
  const readinessCounts = useMemo(
    () => buildMapSourceReadinessCounts(sourceHandles, layers),
    [layers, sourceHandles],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () => items.filter((item) =>
      normalizedQuery.length === 0 ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.summary.toLowerCase().includes(normalizedQuery),
    ),
    [items, normalizedQuery],
  );

  if (!visible) return null;

  const sectionCopy = SECTION_COPY[activeSection];
  const panelClassName = [
    styles.panel,
    presentation === "embedded" ? styles.embeddedPanel : motionStyles.panelIn,
  ].filter(Boolean).join(" ");

  const addDemoPack = (): void => {
    onAddDemoPack(buildDemoPackCatalogInsertion());
    setFeedback({ ok: true, message: "Added 9 synthetic demo layers with registered source records.", status: "demo" });
  };

  const reconnect = async (item: MapCatalogItem): Promise<void> => {
    setBusyId(item.id);
    setFeedback(await onReconnectSource(item));
    setBusyId(null);
  };

  const submitConnection = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedEndpoint = endpoint.trim();
    if (!trimmedEndpoint) {
      setFeedback({ ok: false, message: "A service endpoint URL is required." });
      return;
    }
    setBusyId("new-connection");
    const result = await onAddConnection({
      serviceKind,
      title: trimmedTitle || `${serviceKind.toUpperCase()} service`,
      endpoint: trimmedEndpoint,
      ...(urlTemplate.trim() ? { urlTemplate: urlTemplate.trim() } : {}),
      ...(crs.trim() ? { crs: crs.trim() } : {}),
    });
    setFeedback(result);
    setBusyId(null);
  };

  const categoryIdsForSection = (): readonly MapCatalogCategoryId[] => {
    switch (activeSection) {
      case "connections":
        return ["external-services"];
      case "demo-data":
        return ["demo-packs"];
      case "source-health":
        return ["project-sources", "imported-files", "external-services", "worker-database", "generated-outputs"];
      case "catalog":
        return MAP_CATALOG_CATEGORIES.map((category) => category.id);
      case "add-data":
      default:
        return [];
    }
  };

  const itemBelongsToSection = (item: MapCatalogItem): boolean => {
    switch (activeSection) {
      case "connections":
        return item.category === "external-services";
      case "demo-data":
        return item.category === "demo-packs";
      case "source-health":
        return item.template !== "demo-pack";
      case "catalog":
        return true;
      case "add-data":
      default:
        return false;
    }
  };

  const sectionItems = filteredItems.filter(itemBelongsToSection);

  const renderSourceStats = (): React.ReactNode => (
    <div className={styles.stats}>
      <span><strong>{sourceHandles.length}</strong> registered sources</span>
      <span><strong>{items.filter((item) => item.health === "offline" || item.health === "unavailable" || item.health === "untracked").length}</strong> actionable</span>
    </div>
  );

  const renderReadinessCounts = (): React.ReactNode => (
    <div className={styles.readinessGrid} aria-label="Source readiness counts">
      {READINESS_METRICS.map((metric) => (
        <div className={styles.readinessMetric} key={metric.key} data-testid={`catalog-readiness-${metric.key}`}>
          <strong>{readinessCounts[metric.key]}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </div>
  );

  const renderBrowseButton = (): React.ReactNode => (
    <button className={styles.primaryButton} type="button" data-testid="catalog-browse-source" onClick={onBrowseSources}>
      <FolderOpen size={13} /> Browse / Add Source
    </button>
  );

  const renderConnectionForm = (): React.ReactNode => (
    <form className={styles.connectionForm} onSubmit={(event) => void submitConnection(event)}>
      <h3><Globe2 size={13} /> New Connection</h3>
      <label className={styles.field}>
        <span>Provider</span>
        <select
          data-testid="catalog-connection-kind"
          value={serviceKind}
          onChange={(event) => setServiceKind(event.target.value as MapCatalogConnectionDraft["serviceKind"])}
        >
          <option value="wms">OGC WMS</option>
          <option value="wmts">OGC WMTS</option>
          <option value="wfs">OGC WFS</option>
          <option value="xyz">XYZ tiles</option>
          <option value="overpass">Overpass</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Planning service" />
      </label>
      <label className={styles.field}>
        <span>Endpoint URL</span>
        <input
          data-testid="catalog-connection-endpoint"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
          placeholder="https://..."
          required
        />
      </label>
      {serviceKind === "xyz" ? (
        <label className={styles.field}>
          <span>Tile URL template</span>
          <input value={urlTemplate} onChange={(event) => setUrlTemplate(event.target.value)} placeholder="https://.../{z}/{x}/{y}.png" />
        </label>
      ) : null}
      <label className={styles.field}>
        <span>Declared CRS</span>
        <input value={crs} onChange={(event) => setCrs(event.target.value)} placeholder="EPSG:4326" />
      </label>
      <p className={styles.secretNote}>No credentials or secrets are stored in catalog records.</p>
      <button className={styles.secondaryButton} type="submit" data-testid="catalog-save-connection" disabled={busyId === "new-connection"}>
        {busyId === "new-connection" ? "Checking..." : "Add and Check Health"}
      </button>
    </form>
  );

  const renderProviderCaveats = (): React.ReactNode => (
    <section className={styles.providerCaveats} data-testid="catalog-provider-caveats">
      <h3><Info size={13} /> External-provider caveats</h3>
      <ul>
        {PROVIDER_CAVEATS.map((caveat) => (
          <li key={caveat}>{caveat}</li>
        ))}
      </ul>
    </section>
  );

  const renderSupportMatrix = (): React.ReactNode => (
    <section className={styles.supportMatrix} data-testid="catalog-local-format-matrix">
      <h3><Info size={13} /> Local format support</h3>
      <div className={styles.supportRows}>
        {LOCAL_IMPORT_SUPPORT_ROWS.map((row) => (
          <article className={styles.supportRow} key={row.id} data-testid={`catalog-local-format-${row.id}`}>
            <strong>{row.label}</strong>
            <span>{row.status}</span>
            <p>{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );

  const renderCatalogSections = (): React.ReactNode => {
    const categoryIds = categoryIdsForSection();
    if (categoryIds.length === 0) return null;
    return categoryIds.map((categoryId) => {
      const category = MAP_CATALOG_CATEGORIES.find((entry) => entry.id === categoryId);
      if (!category) return null;
      const entries = sectionItems.filter((item) => item.category === category.id);
      return (
        <section key={category.id} className={styles.category} data-testid={`catalog-category-${category.id}`}>
          <h3>{category.label}<small>{entries.length}</small></h3>
          {entries.length === 0 ? (
            <GisEmptyState title={category.emptyLabel} compact />
          ) : (
            <div className={styles.items}>
              {entries.map((item) => (
                <article className={styles.item} key={item.id} data-testid={`catalog-item-${item.id}`}>
                  <div className={styles.itemHeading}>
                    <strong className={styles.itemTitle} title={item.title}>{item.title}</strong>
                    <GisStatusChip
                      status={catalogHealthToGisStatus(item.health)}
                      label={healthLabel(item.health)}
                      density="compact"
                      data-testid={`catalog-health-${item.id}`}
                    />
                  </div>
                  {item.synthetic ? <span className={styles.demoLabel}>DEMO / SYNTHETIC</span> : null}
                  <p className={styles.itemSummary}>{item.summary}</p>
                  {item.actionableReason ? <p className={styles.actionable}>{item.actionableReason}</p> : null}
                  <div className={styles.itemActions}>
                    {item.template === "demo-pack" ? (
                      <button type="button" data-testid="catalog-add-demo-pack" onClick={addDemoPack}>Add to Map</button>
                    ) : null}
                    {item.category === "external-services" && !item.template ? (
                      <button
                        type="button"
                        data-testid={`catalog-reconnect-${item.id}`}
                        disabled={busyId === item.id}
                        onClick={() => void reconnect(item)}
                      >
                        <RefreshCw size={11} /> {busyId === item.id ? "Checking..." : "Reconnect"}
                      </button>
                    ) : null}
                    {statusNeedsRepair(item) ? (
                      <button
                        type="button"
                        data-testid={`catalog-repair-${item.id}`}
                        onClick={() => onRepairSource(item)}
                      >
                        <Wrench size={11} /> Repair Source
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    });
  };

  const renderControlRail = (): React.ReactNode => {
    if (activeSection === "add-data") {
      return (
        <>
          {renderSourceStats()}
          {renderBrowseButton()}
          {renderReadinessCounts()}
        </>
      );
    }
    if (activeSection === "connections") {
      return (
        <>
          <button
            className={styles.primaryButton}
            type="button"
            data-testid="catalog-open-external-services"
            onClick={onOpenExternalServices}
          >
            <Cloud size={13} /> Open External Services
          </button>
          {renderConnectionForm()}
        </>
      );
    }
    if (activeSection === "source-health") {
      return (
        <>
          {renderReadinessCounts()}
          {renderBrowseButton()}
        </>
      );
    }
    if (activeSection === "demo-data") {
      return (
        <>
          {renderSourceStats()}
          <button className={styles.primaryButton} type="button" data-testid="catalog-add-demo-pack-rail" onClick={addDemoPack}>
            Add Demo Pack
          </button>
        </>
      );
    }
    return (
      <>
        {renderSourceStats()}
        {renderBrowseButton()}
        {presentation === "floating" ? renderConnectionForm() : renderReadinessCounts()}
      </>
    );
  };

  return (
    <section
      className={panelClassName}
      role={presentation === "floating" ? "dialog" : "region"}
      aria-label={presentation === "floating" ? "Catalog" : `Data ${sectionCopy.title}`}
      data-testid="map-catalog-panel"
      data-presentation={presentation}
      data-section={activeSection}
    >
      {presentation === "floating" ? (
        <header className={styles.header}>
          <div>
            <h2><Database size={15} /> Catalog</h2>
            <p>Sources, services, restore state and generated outputs</p>
          </div>
          <GisIconButton label="Close catalog" icon={<X size={15} />} onClick={onClose} size="md" />
        </header>
      ) : null}

      <div className={styles.body}>
        <aside className={styles.controlRail}>
          {renderControlRail()}
        </aside>

        <main className={styles.catalogTree}>
          {presentation === "embedded" ? (
            <header className={styles.sectionHeader}>
              <h2>
                {activeSection === "source-health" ? <Activity size={14} /> : <Database size={14} />}
                {sectionCopy.title}
              </h2>
              <p>{sectionCopy.description}</p>
            </header>
          ) : null}
          {activeSection === "add-data" ? renderSupportMatrix() : null}
          {activeSection === "connections" ? renderProviderCaveats() : null}
          {categoryIdsForSection().length > 0 ? (
            <label className={styles.search}>
              <span>Filter catalog</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sources and outputs"
              />
            </label>
          ) : null}
          {feedback ? (
            <p className={styles.feedback} data-ok={feedback.ok ? "true" : "false"} role="status">
              {feedback.message}
            </p>
          ) : null}
          {renderCatalogSections()}
        </main>
      </div>
    </section>
  );
};
