import React, { useMemo, useState } from "react";
import { Activity, Cloud, Database, FolderOpen, Globe2, Info, RefreshCw, Wrench, X } from "lucide-react";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  buildMapCatalogItems,
  buildMapSourceReadinessCounts,
  MAP_CATALOG_CATEGORIES,
  type MapCatalogActionResult,
  type MapCatalogCategoryId,
  type MapCatalogConnectionDraft,
  type MapCatalogHealth,
  mapCatalogHealthDescriptor,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
} from "./catalogModel";
import styles from "./MapCatalogPanel.module.css";
import motionStyles from "../design/motion.module.css";
import { GisEmptyState, GisIconButton, GisStatusChip } from "../ui";
import type { GisStatusKey } from "../mapTokens";

export type MapCatalogPanelPresentation = "floating" | "embedded";
export type MapDataActivitySectionId = "add-data" | "connections" | "catalog" | "source-health";

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

const FORMAT_SUPPORT_GROUPS = [
  {
    id: "local-vector",
    label: "Local vector files",
    summary: "Committed through the modal-owned file picker after source preflight.",
    rows: [
      {
        id: "geojson",
        label: "GeoJSON / JSON",
        status: "Direct import",
        detail: "Feature publishing with topology checks; CRS remains unknown unless trusted metadata declares it.",
      },
      {
        id: "csv",
        label: "CSV",
        status: "Coordinate preview",
        detail: "Latitude/longitude mapping, row preview, and skipped-row diagnostics stay visible before commit.",
      },
      {
        id: "kml-gpx",
        label: "KML / KMZ / GPX",
        status: "Vector import",
        detail: "Placemarks and traces are converted without fabricating unsupported KML constructs or GPX semantics.",
      },
      {
        id: "shapefile",
        label: "Shapefile .shp / .zip",
        status: "Supported",
        detail: ".zip is recommended for sidecars; bare .shp files have limited CRS and attribute recovery.",
      },
      {
        id: "geopackage",
        label: "GeoPackage .gpkg",
        status: "Layer choice",
        detail: "Layer discovery and per-layer CRS are used when loader metadata exposes them; multi-layer packages require selection.",
      },
    ],
  },
  {
    id: "columnar",
    label: "Columnar vector",
    summary: "Supported with schema, memory, worker-transfer, and geometry decoding preflight.",
    rows: [
      {
        id: "arrow",
        label: "Arrow / Feather / IPC",
        status: "Columnar preview",
        detail: "Schema, row counts, worker-transfer readiness, and memory estimates are reviewed before map commit.",
      },
      {
        id: "geoparquet",
        label: "GeoParquet / Parquet",
        status: "Spatial metadata",
        detail: "GeoParquet CRS and geometry metadata are copied as declarations and still require suitability review before metric analysis.",
      },
    ],
  },
  {
    id: "profile-external",
    label: "External or profile-only",
    summary: "Visible in catalog/preflight without claiming generic local full-file commit support.",
    rows: [
      {
        id: "flatgeobuf",
        label: "FlatGeobuf",
        status: "Profile-only local",
        detail: "Local upload remains metadata/profile-oriented; extent streaming is supported for HTTP range-capable URLs.",
      },
      {
        id: "pmtiles",
        label: "PMTiles",
        status: "Tile/source metadata",
        detail: "PMTiles rendering uses vector-tile/source metadata paths; low-zoom generalized geometry is caveated for precision analysis.",
      },
      {
        id: "wms-wfs",
        label: "WMS / WMTS / XYZ / WFS / Overpass",
        status: "External path",
        detail: "Connect through External Services; provider availability, CORS, credentials, rate limits, and attribution stay explicit.",
      },
    ],
  },
  {
    id: "raster-scene",
    label: "Raster and scene-specific",
    summary: "Supported through bounded raster/scene workflows, not as generic full-resolution vector intake.",
    rows: [
      {
        id: "geotiff",
        label: "GeoTIFF",
        status: "Sampled raster",
        detail: "Generic import renders a bounded sampled raster with CRS, noData, band, histogram, and raster QA caveats.",
      },
      {
        id: "cog-stac",
        label: "COG / STAC / Sentinel Hub",
        status: "Toolbox connector",
        detail: "EO source selection and processing are environment-dependent and record provenance rather than embedding provider data.",
      },
      {
        id: "cityjson-tiles",
        label: "CityJSON / 3D Tiles",
        status: "Scene path",
        detail: "Scene metadata and source handles are supported; CRS, vertical datum, and external payload access remain caveated.",
      },
    ],
  },
] as const;

const PROVIDER_CAVEATS = [
  "External services depend on upstream availability, CORS policy, browser credential mode, attribution, and provider rate limits.",
  "WMS, WMTS, XYZ, and most tile providers are visual references unless a queryable vector service is explicitly connected.",
  "Catalog records never persist credentials, tokens, cookies, or raw source bytes for external providers; only secret-free endpoint references are stored.",
  "Provider licensing and attribution should be reviewed before a layer is published, exported, or included in a report handoff.",
] as const;

const READINESS_METRICS = [
  { key: "restoredLive", label: "Restored / live", status: "ready" },
  { key: "recoverable", label: "Recoverable", status: "caveat" },
  { key: "unavailable", label: "Unavailable", status: "blocked" },
  { key: "offline", label: "Offline", status: "external-offline" },
  { key: "external", label: "External refs", status: "external" },
  { key: "metadataOnly", label: "Metadata-only", status: "metadata-only" },
  { key: "demoSynthetic", label: "Demo / synthetic", status: "demo" },
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
};

function healthLabel(health: MapCatalogHealth): string {
  return mapCatalogHealthDescriptor(health).label;
}

function catalogHealthToGisStatus(health: MapCatalogHealth): GisStatusKey {
  switch (health) {
    case "restored":
    case "live":
    case "cached":
      return "ready";
    case "recoverable":
      return "caveat";
    case "metadata-only":
      return "metadata-only";
    case "unavailable":
    case "cors":
    case "auth":
    case "rate-limit":
      return "blocked";
    case "offline":
      return "external-offline";
    case "external-reference":
      return "external";
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
  const [license, setLicense] = useState("");
  const [attribution, setAttribution] = useState("");
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

  const reconnect = async (item: MapCatalogItem): Promise<void> => {
    setBusyId(item.id);
    setFeedback(await onReconnectSource(item));
    setBusyId(null);
  };

  const submitConnection = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedEndpoint = endpoint.trim();
    const trimmedLicense = license.trim();
    const trimmedAttribution = attribution.trim();
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
      ...(trimmedLicense ? { license: trimmedLicense } : {}),
      ...(trimmedAttribution ? { attribution: trimmedAttribution } : {}),
    });
    setFeedback(result);
    setBusyId(null);
  };

  const categoryIdsForSection = (): readonly MapCatalogCategoryId[] => {
    switch (activeSection) {
      case "connections":
        return ["external-services"];
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
        <div
          className={styles.readinessMetric}
          key={metric.key}
          data-status={metric.status}
          data-testid={`catalog-readiness-${metric.key}`}
        >
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

  const renderImportEntry = (): React.ReactNode => (
    <section className={styles.importEntry} data-testid="catalog-import-entry" aria-label="Local import intake">
      <div className={styles.importEntryHeader}>
        <div>
          <h3><FolderOpen size={13} /> Local file intake</h3>
          <p>Browse once, then review format, CRS, geometry, counts, skipped rows, memory, worker readiness, and caveats before commit.</p>
        </div>
        <button className={styles.primaryButton} type="button" data-testid="catalog-browse-source" onClick={onBrowseSources}>
          <FolderOpen size={13} /> Browse Local Files
        </button>
      </div>
      <div className={styles.importEntryMeta}>
        <span>Hidden file input remains owned by the modal shell.</span>
        <span>Unsafe/profile-only formats stay blocked until their supported path is used.</span>
      </div>
    </section>
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
      <label className={styles.field}>
        <span>License note</span>
        <input
          data-testid="catalog-connection-license"
          value={license}
          onChange={(event) => setLicense(event.target.value)}
          placeholder="ODbL, CC BY, provider terms, or unknown"
        />
      </label>
      <label className={styles.field}>
        <span>Attribution</span>
        <input
          data-testid="catalog-connection-attribution"
          value={attribution}
          onChange={(event) => setAttribution(event.target.value)}
          placeholder="Provider attribution required for publication"
        />
      </label>
      <p className={styles.secretNote}>No credentials or secrets are stored in catalog records. Endpoint, license, attribution, CRS, and health metadata only.</p>
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
      <h3><Info size={13} /> Source support groups</h3>
      <div className={styles.supportGroups}>
        {FORMAT_SUPPORT_GROUPS.map((group) => (
          <div className={styles.supportGroup} key={group.id} data-testid={`catalog-format-group-${group.id}`}>
            <div className={styles.supportGroupHeader}>
              <strong>{group.label}</strong>
              <span>{group.summary}</span>
            </div>
            <div className={styles.supportRows}>
              {group.rows.map((row) => (
                <article className={styles.supportRow} key={row.id} data-testid={`catalog-local-format-${row.id}`}>
                  <strong>{row.label}</strong>
                  <span>{row.status}</span>
                  <p>{row.detail}</p>
                </article>
              ))}
            </div>
          </div>
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
              {entries.map((item) => {
                const descriptor = mapCatalogHealthDescriptor(item.health);
                const caveats = item.caveats.slice(0, 4);
                return (
                  <article className={styles.item} key={item.id} data-testid={`catalog-item-${item.id}`}>
                    <div className={styles.itemHeading}>
                      <div className={styles.itemTitleStack}>
                        <strong className={styles.itemTitle} title={item.title}>{item.title}</strong>
                        <span className={styles.statusDetail}>{descriptor.detail}</span>
                      </div>
                      <GisStatusChip
                        status={catalogHealthToGisStatus(item.health)}
                        label={healthLabel(item.health)}
                        density="compact"
                        data-testid={`catalog-health-${item.id}`}
                      />
                    </div>
                    <div className={styles.itemMeta} aria-label="Source catalog metadata">
                      <span>{item.providerLabel ?? item.sourceKind}</span>
                      <span>{item.sourceHandle?.storageMode ?? "source handle missing"}</span>
                      <span>{item.layerIds.length} layer{item.layerIds.length === 1 ? "" : "s"}</span>
                      {item.sourceHandle?.crsSummary.crs ? <span>{item.sourceHandle.crsSummary.crs}</span> : <span>CRS unknown</span>}
                    </div>
                    {item.endpoint ? <p className={styles.itemEndpoint}>{item.endpoint}</p> : null}
                    {item.synthetic ? <span className={styles.demoLabel}>DEMO / SYNTHETIC</span> : null}
                    <p className={styles.itemSummary}>{item.summary}</p>
                    {item.license || item.attribution ? (
                      <p className={styles.licenseNote}>
                        License: {item.license ?? "unknown"}. Attribution: {item.attribution ?? "not supplied"}.
                      </p>
                    ) : item.category === "external-services" ? (
                      <p className={styles.licenseNote}>License/attribution not supplied; review provider terms before publication.</p>
                    ) : null}
                    {caveats.length > 0 ? (
                      <ul className={styles.itemCaveats} aria-label="Source caveats">
                        {caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
                      </ul>
                    ) : null}
                    {item.actionableReason ? <p className={styles.actionable}>{item.actionableReason}</p> : null}
                    <div className={styles.itemActions}>
                      {item.category === "external-services" && !item.template ? (
                        <button
                          type="button"
                          data-testid={`catalog-reconnect-${item.id}`}
                          disabled={busyId === item.id}
                          onClick={() => void reconnect(item)}
                        >
                          <RefreshCw size={11} /> {busyId === item.id ? "Checking..." : descriptor.reconnectLabel ?? "Check provider"}
                        </button>
                      ) : null}
                      {statusNeedsRepair(item) ? (
                        <button
                          type="button"
                          data-testid={`catalog-repair-${item.id}`}
                          onClick={() => onRepairSource(item)}
                        >
                          <Wrench size={11} /> {descriptor.repairLabel ?? "Repair Source"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
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
          {renderReadinessCounts()}
        </>
      );
    }
    if (activeSection === "connections") {
      return (
        <>
          {renderReadinessCounts()}
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
          {activeSection === "add-data" ? renderImportEntry() : null}
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
