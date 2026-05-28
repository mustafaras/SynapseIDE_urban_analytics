import React, { useMemo, useState } from "react";
import { Database, FolderOpen, Globe2, RefreshCw, Wrench, X } from "lucide-react";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  buildDemoPackCatalogInsertion,
  buildMapCatalogItems,
  MAP_CATALOG_CATEGORIES,
  type MapCatalogActionResult,
  type MapCatalogConnectionDraft,
  type MapCatalogHealth,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
} from "./catalogModel";
import styles from "./MapCatalogPanel.module.css";
import motionStyles from "../design/motion.module.css";
import { GisEmptyState, GisIconButton, GisStatusChip } from "../ui";
import type { GisStatusKey } from "../mapTokens";

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
}

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

  return (
    <section className={`${styles.panel} ${motionStyles.panelIn}`} role="dialog" aria-label="Catalog" data-testid="map-catalog-panel">
      <header className={styles.header}>
        <div>
          <h2><Database size={15} /> Catalog</h2>
          <p>Sources, services, restore state and generated outputs</p>
        </div>
        <GisIconButton label="Close catalog" icon={<X size={15} />} onClick={onClose} size="md" />
      </header>

      <div className={styles.body}>
        <aside className={styles.controlRail}>
          <div className={styles.stats}>
            <span><strong>{sourceHandles.length}</strong> registered sources</span>
            <span><strong>{items.filter((item) => item.health === "offline" || item.health === "unavailable" || item.health === "untracked").length}</strong> actionable</span>
          </div>

          <button className={styles.primaryButton} type="button" data-testid="catalog-browse-source" onClick={onBrowseSources}>
            <FolderOpen size={13} /> Browse / Add Source
          </button>

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
        </aside>

        <main className={styles.catalogTree}>
          <label className={styles.search}>
            <span>Filter catalog</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sources and outputs"
            />
          </label>
          {feedback ? (
            <p className={styles.feedback} data-ok={feedback.ok ? "true" : "false"} role="status">
              {feedback.message}
            </p>
          ) : null}
          {MAP_CATALOG_CATEGORIES.map((category) => {
            const entries = filteredItems.filter((item) => item.category === category.id);
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
          })}
        </main>
      </div>
    </section>
  );
};
