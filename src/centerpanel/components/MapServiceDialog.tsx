import React, { useMemo, useState } from "react";
import { Building2, DatabaseZap, Globe2, RefreshCw, Trash2, X } from "lucide-react";
import {
  ExternalServiceConnector,
  OSM_BUILDING_PROVENANCE,
  XYZ_PRESETS,
  type ExternalLayerInfo,
  type WfsCapabilities,
  type WmsCapabilities,
} from "@/services/map/ExternalServiceConnector";
import { executeOverpassBuildingsAsync } from "@/services/map/ExternalServiceQueue";
import { cityJSONObjectsToFootprintCollection, DEFAULT_VOXCITY_GEO_ANCHOR } from "@/services/map/voxCityProjection";
import { useCityJSONScene } from "@/features/urbanAnalytics/voxcity/hooks/useCityJSONScene";
import type { OverlayLayerConfig } from "./map/mapTypes";
import type { MapImportProgress } from "@/services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./map/mapTokens";

type ServiceTab = "wms" | "wfs" | "xyz" | "osm" | "cityjson" | "manager";

export interface MapServiceDialogProgressDetail {
  busy: boolean;
  label: string | null;
  progress: MapImportProgress | null;
}

export interface MapServiceDialogProps {
  open: boolean;
  bounds: [number, number, number, number] | null;
  boundsLabel?: string | null;
  overlayLayers: OverlayLayerConfig[];
  onAddLayer: (layer: OverlayLayerConfig) => void;
  onRemoveLayer: (id: string) => void;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
  onProgress?: (detail: MapServiceDialogProgressDetail) => void;
  onOpenVoxCityOverlay?: () => void;
}

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: MAP_Z_INDEX.dropdown + 18,
  display: "grid",
  placeItems: "center",
  padding: MAP_SPACING.lg,
  background: "rgba(0,0,0,0.48)",
};

const dialog: React.CSSProperties = {
  width: "min(980px, calc(100vw - 32px))",
  maxHeight: "min(760px, calc(100vh - 48px))",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.panel,
  overflow: "hidden",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const title: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
};

const subtitle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.45,
};

const closeBtn: React.CSSProperties = {
  ...mapStyles.btn,
  minWidth: "1.875rem",
  minHeight: "1.75rem",
  padding: MAP_SPACING.xs,
  justifyContent: "center",
};

const tabs: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  overflowX: "auto",
};

const tabButton = (active: boolean): React.CSSProperties => ({
  ...mapStyles.btn,
  borderColor: active ? MAP_COLORS.focus : MAP_COLORS.hairlineSubtle,
  background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
  color: active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
  whiteSpace: "nowrap",
});

const body: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  overflow: "auto",
};

const stack: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.md,
  minWidth: 0,
};

const section: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const label: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const input: React.CSSProperties = {
  width: "100%",
  minHeight: "2rem",
  boxSizing: "border-box",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  outline: "none",
};

const actionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: MAP_SPACING.sm,
};

const primaryButton: React.CSSProperties = {
  ...mapStyles.btnActive,
  minHeight: "2rem",
  borderColor: MAP_COLORS.focus,
};

const secondaryButton: React.CSSProperties = {
  ...mapStyles.btn,
  minHeight: "2rem",
};

const layerList: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  maxHeight: 310,
  overflowY: "auto",
};

const layerRow = (selected = false): React.CSSProperties => ({
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: selected ? `1px solid ${MAP_COLORS.focus}` : MAP_STROKES.hairlineSubtle,
  background: selected ? MAP_COLORS.selectedSubtle : MAP_COLORS.bg,
  color: MAP_COLORS.text,
  textAlign: "left",
  cursor: "pointer",
});

const metaLine: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.45,
};

const statusPanel: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  alignContent: "start",
  padding: MAP_SPACING.md,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

const errorText: React.CSSProperties = {
  color: MAP_COLORS.error,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.45,
};

function serviceErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "External service request failed.";
}

function layerKey(layer: ExternalLayerInfo): string {
  return `${layer.name}::${layer.title}`;
}

function boundsLabel(bounds: [number, number, number, number] | null): string {
  return bounds ? bounds.map((value) => value.toFixed(4)).join(", ") : "No live map extent yet";
}

function scopedBoundsLabel(bounds: [number, number, number, number] | null, labelText?: string | null): string {
  return labelText ? `${labelText}: ${boundsLabel(bounds)}` : boundsLabel(bounds);
}

function isLikelyGeographic(referenceSystem?: string | null): boolean {
  return /4326|crs\s*84|wgs\s*84/i.test(referenceSystem ?? "");
}

function serviceUrlWarnings(rawUrl: string): string[] {
  if (!rawUrl.trim()) return [];
  return ExternalServiceConnector.validateServiceUrl(rawUrl).warnings;
}

const TabButton: React.FC<{
  id: ServiceTab;
  activeTab: ServiceTab;
  onSelect: (tab: ServiceTab) => void;
  children: React.ReactNode;
}> = ({ id, activeTab, onSelect, children }) => (
  <button
    type="button"
    style={tabButton(activeTab === id)}
    onClick={() => onSelect(id)}
    aria-pressed={activeTab === id}
  >
    {children}
  </button>
);

export const MapServiceDialog: React.FC<MapServiceDialogProps> = ({
  open,
  bounds,
  boundsLabel: requestBoundsLabel,
  overlayLayers,
  onAddLayer,
  onRemoveLayer,
  onClose,
  onAnnounce,
  onProgress,
  onOpenVoxCityOverlay,
}) => {
  const [activeTab, setActiveTab] = useState<ServiceTab>("wms");
  const [error, setError] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [wmsUrl, setWmsUrl] = useState("");
  const [wmsCapabilities, setWmsCapabilities] = useState<WmsCapabilities | null>(null);
  const [selectedWmsLayers, setSelectedWmsLayers] = useState<string[]>([]);
  const [wfsUrl, setWfsUrl] = useState("");
  const [wfsCapabilities, setWfsCapabilities] = useState<WfsCapabilities | null>(null);
  const [selectedWfsType, setSelectedWfsType] = useState<string | null>(null);
  const [xyzName, setXyzName] = useState("Custom XYZ overlay");
  const [xyzUrl, setXyzUrl] = useState("");
  const [cityJsonUrl, setCityJsonUrl] = useState("");

  const externalLayers = useMemo(() => overlayLayers.filter((layer) => layer.sourceKind === "external"), [overlayLayers]);
  const selectedWmsInfos = useMemo(
    () => wmsCapabilities?.layers.filter((layer) => selectedWmsLayers.includes(layerKey(layer))) ?? [],
    [selectedWmsLayers, wmsCapabilities],
  );
  const selectedWfsInfo = wfsCapabilities?.featureTypes.find((layer) => layerKey(layer) === selectedWfsType) ?? null;

  if (!open) {
    return null;
  }

  const setProgress = (detail: MapServiceDialogProgressDetail) => {
    onProgress?.(detail);
  };

  const runBusy = async (labelText: string, action: () => Promise<void>) => {
    setError(null);
    setBusyLabel(labelText);
    setProgress({
      busy: true,
      label: labelText,
      progress: { loaded: 0, total: 100, percent: 8, stage: labelText },
    });
    try {
      await action();
    } catch (requestError) {
      const message = serviceErrorMessage(requestError);
      setError(message);
      onAnnounce?.(message);
    } finally {
      setBusyLabel(null);
      window.setTimeout(() => {
        setProgress({ busy: false, label: null, progress: null });
      }, 750);
    }
  };

  const handleConnectWms = () => {
    void runBusy("Reading WMS capabilities", async () => {
      const capabilities = await ExternalServiceConnector.loadWmsCapabilities(wmsUrl);
      setWmsCapabilities(capabilities);
      setSelectedWmsLayers(capabilities.layers[0] ? [layerKey(capabilities.layers[0])] : []);
      setProgress({
        busy: true,
        label: "WMS capabilities",
        progress: { loaded: 100, total: 100, percent: 100, stage: `${capabilities.layers.length} layers discovered`, rowCount: capabilities.layers.length },
      });
      onAnnounce?.(`${capabilities.layers.length} WMS layers discovered`);
    });
  };

  const handleAddWmsLayers = () => {
    if (!wmsCapabilities || selectedWmsInfos.length === 0) return;
    selectedWmsInfos.forEach((layerInfo) => {
      onAddLayer(ExternalServiceConnector.createWmsRasterLayerConfig(wmsCapabilities, layerInfo));
    });
    onAnnounce?.(`${selectedWmsInfos.length} ${wmsCapabilities.serviceType.toUpperCase()} raster overlay${selectedWmsInfos.length === 1 ? "" : "s"} added`);
  };

  const handleConnectWfs = () => {
    void runBusy("Reading WFS capabilities", async () => {
      const capabilities = await ExternalServiceConnector.loadWfsCapabilities(wfsUrl);
      setWfsCapabilities(capabilities);
      setSelectedWfsType(capabilities.featureTypes[0] ? layerKey(capabilities.featureTypes[0]) : null);
      setProgress({
        busy: true,
        label: "WFS capabilities",
        progress: { loaded: 100, total: 100, percent: 100, stage: `${capabilities.featureTypes.length} feature types discovered`, rowCount: capabilities.featureTypes.length },
      });
      onAnnounce?.(`${capabilities.featureTypes.length} WFS feature types discovered`);
    });
  };

  const handleAddWfsLayer = () => {
    if (!wfsCapabilities || !selectedWfsInfo || !bounds) {
      setError("WFS import needs a selected/drawn AOI or a live map extent so the request can include a bounding-box filter.");
      return;
    }
    void runBusy("Fetching WFS GeoJSON", async () => {
      const featureCollection = await ExternalServiceConnector.fetchWfsFeatureCollection(wfsCapabilities, selectedWfsInfo, bounds);
      const layer = ExternalServiceConnector.createWfsLayerConfig(wfsCapabilities, selectedWfsInfo, featureCollection, bounds);
      onAddLayer(layer);
      setProgress({
        busy: true,
        label: "WFS GeoJSON",
        progress: { loaded: 100, total: 100, percent: 100, stage: "WFS features added", rowCount: featureCollection.features.length },
      });
      onAnnounce?.(`${featureCollection.features.length.toLocaleString()} WFS features added for ${requestBoundsLabel ?? "the current map extent"}`);
    });
  };

  const handleAddXyz = (preset?: typeof XYZ_PRESETS[number]) => {
    const name = preset?.name ?? xyzName.trim();
    const url = preset?.urlTemplate ?? xyzUrl.trim();
    const attribution = preset?.attribution;
    try {
      onAddLayer(ExternalServiceConnector.createXyzRasterLayerConfig(name, url, attribution));
      onAnnounce?.(`${name} added as XYZ raster overlay`);
    } catch (requestError) {
      setError(serviceErrorMessage(requestError));
    }
  };

  const handleFetchOsm = () => {
    if (!bounds) {
      setError("OSM building fetch needs a selected/drawn AOI or a live map extent. Draw/select an area, then try again.");
      return;
    }
    void runBusy("Queued OSM buildings fetch", async () => {
      const handle = executeOverpassBuildingsAsync(bounds);
      const result = await handle.promise;
      const layer = ExternalServiceConnector.createOsmBuildingsLayerConfig(result);
      onAddLayer(layer);
      onOpenVoxCityOverlay?.();
      setProgress({
        busy: true,
        label: "OSM buildings",
        progress: {
          loaded: 100,
          total: 100,
          percent: 100,
          stage: result.cacheHit ? "Loaded from 10-minute bbox cache" : "OSM buildings added",
          rowCount: result.featureCollection.features.length,
        },
      });
      onAnnounce?.(`${result.featureCollection.features.length.toLocaleString()} OSM building footprints added for ${requestBoundsLabel ?? "the current map extent"}`);
    });
  };

  const handleLoadCityJson = () => {
    void runBusy("Loading remote CityJSON", async () => {
      const result = await ExternalServiceConnector.loadRemoteCityJSON(cityJsonUrl);
      useCityJSONScene.getState().setLoadResult(result);
      const projectionMode = isLikelyGeographic(result.summary.referenceSystem) ? "passthrough" : "anchored";
      const lods = Array.from(new Set(result.objects.map((object) => object.lod))).sort((left, right) => parseFloat(left) - parseFloat(right));
      const selectedLod = lods[lods.length - 1] ?? null;
      const featureCollection = cityJSONObjectsToFootprintCollection(result.objects, DEFAULT_VOXCITY_GEO_ANCHOR, {
        lodFilter: selectedLod,
        projectionMode,
      });
      onAddLayer(ExternalServiceConnector.createRemoteCityJSONLayerConfig(result, cityJsonUrl, featureCollection));
      onOpenVoxCityOverlay?.();
      setProgress({
        busy: true,
        label: "Remote CityJSON",
        progress: {
          loaded: 100,
          total: 100,
          percent: 100,
          stage: `${result.objects.length} CityObjects loaded`,
          rowCount: result.objects.length,
        },
      });
      onAnnounce?.(`Remote CityJSON loaded with ${result.objects.length.toLocaleString()} CityObjects`);
    });
  };

  const handleRefreshLayer = (layer: OverlayLayerConfig) => {
    void runBusy(`Refreshing ${layer.name}`, async () => {
      const service = layer.metadata?.externalService;
      if (service?.kind === "wfs") {
        const refreshBounds = bounds ?? service.bounds;
        if (!refreshBounds || !service.layerName) {
          throw new Error("WFS refresh needs the original feature type and a current or stored bbox.");
        }
        const capabilities: WfsCapabilities = {
          version: service.serviceVersion ?? "2.0.0",
          endpoint: service.endpoint,
          title: service.title ?? layer.provenance?.label ?? layer.name,
          featureTypes: [],
        };
        const featureType: ExternalLayerInfo = {
          name: service.layerName,
          title: layer.metadata?.datasetContext?.layerTitle ?? layer.name,
          availableCrs: ["EPSG:4326"],
        };
        const featureCollection = await ExternalServiceConnector.fetchWfsFeatureCollection(capabilities, featureType, refreshBounds);
        onAddLayer(ExternalServiceConnector.createWfsLayerConfig(
          capabilities,
          featureType,
          featureCollection,
          refreshBounds,
          { id: layer.id, visible: layer.visible, opacity: layer.opacity },
        ));
        onAnnounce?.(`${layer.name} refreshed with ${featureCollection.features.length.toLocaleString()} WFS features`);
        return;
      }

      if (service?.kind === "overpass") {
        const refreshBounds = bounds ?? service.bounds;
        if (!refreshBounds) {
          throw new Error("OSM refresh needs a current or stored bbox.");
        }
        const handle = executeOverpassBuildingsAsync(refreshBounds, { bypassCache: true });
        const result = await handle.promise;
        onAddLayer({
          ...ExternalServiceConnector.createOsmBuildingsLayerConfig(result),
          id: layer.id,
          visible: layer.visible,
          opacity: layer.opacity,
        });
        onAnnounce?.(`${layer.name} refreshed with ${result.featureCollection.features.length.toLocaleString()} OSM footprints`);
        return;
      }

      if (service?.kind === "cityjson") {
        const result = await ExternalServiceConnector.loadRemoteCityJSON(service.endpoint);
        useCityJSONScene.getState().setLoadResult(result);
        const projectionMode = isLikelyGeographic(result.summary.referenceSystem) ? "passthrough" : "anchored";
        const lods = Array.from(new Set(result.objects.map((object) => object.lod))).sort((left, right) => parseFloat(left) - parseFloat(right));
        const selectedLod = lods[lods.length - 1] ?? null;
        const featureCollection = cityJSONObjectsToFootprintCollection(result.objects, DEFAULT_VOXCITY_GEO_ANCHOR, {
          lodFilter: selectedLod,
          projectionMode,
        });
        onAddLayer({
          ...ExternalServiceConnector.createRemoteCityJSONLayerConfig(result, service.endpoint, featureCollection),
          id: layer.id,
          visible: layer.visible,
          opacity: layer.opacity,
        });
        onAnnounce?.(`${layer.name} refreshed from remote CityJSON`);
        return;
      }

      if (layer.type === "raster-tile") {
        onAddLayer(ExternalServiceConnector.refreshRasterLayerConfig(layer));
        onAnnounce?.(`${layer.name} raster tiles refreshed`);
        return;
      }

      throw new Error(`${layer.name} does not include enough external service metadata to refresh.`);
    });
  };

  const toggleWmsLayerSelection = (key: string) => {
    setSelectedWmsLayers((current) =>
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key],
    );
  };

  const renderCapabilities = (
    items: ExternalLayerInfo[],
    selected: string | string[] | null,
    onSelect: (key: string) => void,
    options: { multi?: boolean } = {},
  ) => {
    const selectedSet = new Set(Array.isArray(selected) ? selected : selected ? [selected] : []);
    return (
    <div style={layerList} role="listbox" aria-label="Service layer list">
      {items.length === 0 ? (
        <div style={metaLine}>No layers were discovered in the capabilities document.</div>
      ) : items.map((layer) => {
        const key = layerKey(layer);
        const isSelected = selectedSet.has(key);
        return (
          <button
            key={key}
            type="button"
            style={layerRow(isSelected)}
            onClick={() => onSelect(key)}
            aria-pressed={isSelected}
          >
            <strong style={{ color: isSelected ? MAP_COLORS.interaction : MAP_COLORS.text }}>{layer.title || layer.name}</strong>
            <span style={metaLine}>{layer.name}</span>
            {layer.abstract ? <span style={metaLine}>{layer.abstract.slice(0, 180)}</span> : null}
            <span style={metaLine}>CRS: {layer.availableCrs.length ? layer.availableCrs.join(", ") : "not advertised"}</span>
            {options.multi ? <span style={metaLine}>{isSelected ? "Selected for batch add" : "Click to include this layer"}</span> : null}
          </button>
        );
      })}
    </div>
    );
  };

  const renderMain = () => {
    if (activeTab === "wms") {
      return (
        <>
          <div style={stack}>
            <div style={section}>
              <label style={label} htmlFor="external-wms-url">WMS / WMTS capabilities URL</label>
              <input id="external-wms-url" style={input} value={wmsUrl} onChange={(event) => setWmsUrl(event.target.value)} placeholder="https://example.org/geoserver/wms" />
              {serviceUrlWarnings(wmsUrl).map((warning) => <div key={warning} style={{ ...metaLine, color: MAP_COLORS.caveatText }}>{warning}</div>)}
              <div style={actionRow}>
                <button type="button" style={primaryButton} onClick={handleConnectWms} disabled={!wmsUrl.trim() || Boolean(busyLabel)}>Fetch capabilities</button>
                <button type="button" style={secondaryButton} onClick={handleAddWmsLayers} disabled={selectedWmsInfos.length === 0}>Add selected rasters ({selectedWmsInfos.length})</button>
                {wmsCapabilities ? (
                  <>
                    <button type="button" style={secondaryButton} onClick={() => setSelectedWmsLayers(wmsCapabilities.layers.map(layerKey))}>Select all</button>
                    <button type="button" style={secondaryButton} onClick={() => setSelectedWmsLayers([])}>Clear</button>
                  </>
                ) : null}
              </div>
            </div>
            {wmsCapabilities ? renderCapabilities(wmsCapabilities.layers, selectedWmsLayers, toggleWmsLayerSelection, { multi: true }) : null}
          </div>
          {renderStatusPanel("WMS / WMTS", wmsCapabilities ? `${wmsCapabilities.layers.length} layer(s) from ${wmsCapabilities.title}` : "Fetch a capabilities document to inspect advertised layers.")}
        </>
      );
    }

    if (activeTab === "wfs") {
      return (
        <>
          <div style={stack}>
            <div style={section}>
              <label style={label} htmlFor="external-wfs-url">WFS capabilities URL</label>
              <input id="external-wfs-url" style={input} value={wfsUrl} onChange={(event) => setWfsUrl(event.target.value)} placeholder="https://example.org/geoserver/wfs" />
              {serviceUrlWarnings(wfsUrl).map((warning) => <div key={warning} style={{ ...metaLine, color: MAP_COLORS.caveatText }}>{warning}</div>)}
              <div style={actionRow}>
                <button type="button" style={primaryButton} onClick={handleConnectWfs} disabled={!wfsUrl.trim() || Boolean(busyLabel)}>Fetch capabilities</button>
                <button type="button" style={secondaryButton} onClick={handleAddWfsLayer} disabled={!selectedWfsInfo || !bounds}>Fetch selected features</button>
              </div>
            </div>
            {wfsCapabilities ? renderCapabilities(wfsCapabilities.featureTypes, selectedWfsType, setSelectedWfsType) : null}
          </div>
          {renderStatusPanel("WFS", `Bbox filter scope: ${scopedBoundsLabel(bounds, requestBoundsLabel)}`)}
        </>
      );
    }

    if (activeTab === "xyz") {
      return (
        <>
          <div style={stack}>
            <div style={section}>
              <span style={label}>Common presets</span>
              <div style={layerList}>
                {XYZ_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" style={layerRow(false)} onClick={() => handleAddXyz(preset)}>
                    <strong>{preset.name}</strong>
                    <span style={metaLine}>{preset.urlTemplate}</span>
                    <span style={metaLine}>{preset.attribution}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={section}>
              <label style={label} htmlFor="external-xyz-name">Custom XYZ name</label>
              <input id="external-xyz-name" style={input} value={xyzName} onChange={(event) => setXyzName(event.target.value)} />
              <label style={label} htmlFor="external-xyz-url">URL template</label>
              <input id="external-xyz-url" style={input} value={xyzUrl} onChange={(event) => setXyzUrl(event.target.value)} placeholder="https://example.com/{z}/{x}/{y}.png" />
              {serviceUrlWarnings(xyzUrl).map((warning) => <div key={warning} style={{ ...metaLine, color: MAP_COLORS.caveatText }}>{warning}</div>)}
              <button type="button" style={primaryButton} onClick={() => handleAddXyz()} disabled={!xyzName.trim() || !xyzUrl.trim()}>Add custom XYZ</button>
            </div>
          </div>
          {renderStatusPanel("XYZ tiles", "Raster URL templates are added as MapLibre raster tile overlays.")}
        </>
      );
    }

    if (activeTab === "osm") {
      return (
        <>
          <div style={stack}>
            <div style={section}>
              <span style={label}>OSM Overpass building footprints</span>
              <div style={metaLine}>Query `way[building]` and `relation[building]` in the current map extent. Requests are clamped to 4 km² and cached by bbox for 10 minutes.</div>
              <button type="button" style={primaryButton} onClick={handleFetchOsm} disabled={!bounds || Boolean(busyLabel)}>
                <Building2 size={14} /> Fetch buildings from OSM
              </button>
            </div>
          </div>
          {renderStatusPanel("OpenStreetMap", `${bounds ? `Analysis scope: ${scopedBoundsLabel(bounds, requestBoundsLabel)}` : "Select/draw an AOI or wait for map bounds"}. Provenance: ${OSM_BUILDING_PROVENANCE}`)}
        </>
      );
    }

    if (activeTab === "cityjson") {
      return (
        <>
          <div style={stack}>
            <div style={section}>
              <label style={label} htmlFor="external-cityjson-url">Remote CityJSON URL</label>
              <input id="external-cityjson-url" style={input} value={cityJsonUrl} onChange={(event) => setCityJsonUrl(event.target.value)} placeholder="https://example.org/city-model.cityjson" />
              {serviceUrlWarnings(cityJsonUrl).map((warning) => <div key={warning} style={{ ...metaLine, color: MAP_COLORS.caveatText }}>{warning}</div>)}
              <button type="button" style={primaryButton} onClick={handleLoadCityJson} disabled={!cityJsonUrl.trim() || Boolean(busyLabel)}>Load CityJSON URL</button>
            </div>
          </div>
          {renderStatusPanel("Remote CityJSON", "Loaded objects update the shared CityJSON scene store, the VoxCity 2D overlay, and the 3D CityJSON viewer source.")}
        </>
      );
    }

    return (
      <>
        <div style={stack}>
          <div style={section}>
            <span style={label}>Connected external layers</span>
            <div style={layerList}>
              {externalLayers.length === 0 ? (
                <div style={metaLine}>No external layers are connected yet. Add WMS, WFS, XYZ, OSM, or CityJSON sources from the tabs above.</div>
              ) : externalLayers.map((layer) => (
                <div key={layer.id} style={layerRow(false)}>
                  <strong>{layer.name}</strong>
                  <span style={metaLine}>{layer.provenance?.label ?? "External source"}</span>
                  <span style={metaLine}>Status: active · {layer.type} · {layer.metadata?.featureCount ?? 0} features</span>
                  <div style={actionRow}>
                    <button type="button" style={secondaryButton} onClick={() => handleRefreshLayer(layer)} disabled={Boolean(busyLabel)}>
                      <RefreshCw size={13} /> Refresh
                    </button>
                    <button type="button" style={secondaryButton} onClick={() => onRemoveLayer(layer.id)}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {renderStatusPanel("Service manager", `${externalLayers.length} external layer(s) registered in the shared layer registry.`)}
      </>
    );
  };

  const renderStatusPanel = (panelTitle: string, description: string) => (
    <aside style={statusPanel} aria-label={`${panelTitle} status`}>
      <div style={titleRow}>
        <DatabaseZap size={15} color={MAP_COLORS.interaction} />
        <strong style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.sm }}>{panelTitle}</strong>
      </div>
      <div style={metaLine}>{description}</div>
      <div style={metaLine}>Timeout policy: 10 seconds for capabilities and service metadata; Overpass runs as a cancelable background task.</div>
      {busyLabel ? <div style={{ ...metaLine, color: MAP_COLORS.interaction }}>Working: {busyLabel}</div> : null}
      {error ? <div style={errorText}>{error}</div> : null}
    </aside>
  );

  return (
    <div style={overlay} role="presentation" data-testid="map-service-dialog-overlay">
      <section style={dialog} role="dialog" aria-modal="true" aria-label="External map services" data-testid="map-service-dialog">
        <header style={header}>
          <div style={titleRow}>
            <Globe2 size={18} color={MAP_COLORS.interaction} />
            <div>
              <div style={title}>External Map Services</div>
              <div style={subtitle}>WMS, WMTS, WFS, XYZ tiles, OSM buildings, and remote CityJSON sources.</div>
            </div>
          </div>
          <button type="button" style={closeBtn} onClick={onClose} aria-label="Close external map services dialog">
            <X size={14} />
          </button>
        </header>

        <nav style={tabs} aria-label="External service tabs">
          <TabButton id="wms" activeTab={activeTab} onSelect={setActiveTab}>WMS / WMTS</TabButton>
          <TabButton id="wfs" activeTab={activeTab} onSelect={setActiveTab}>WFS</TabButton>
          <TabButton id="xyz" activeTab={activeTab} onSelect={setActiveTab}>XYZ</TabButton>
          <TabButton id="osm" activeTab={activeTab} onSelect={setActiveTab}>OSM Buildings</TabButton>
          <TabButton id="cityjson" activeTab={activeTab} onSelect={setActiveTab}>CityJSON URL</TabButton>
          <TabButton id="manager" activeTab={activeTab} onSelect={setActiveTab}>Manager ({externalLayers.length})</TabButton>
        </nav>

        <div style={body}>
          {renderMain()}
        </div>
      </section>
    </div>
  );
};

export default MapServiceDialog;
