import type maplibregl from 'maplibre-gl';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MapCanvas } from '@/centerpanel/components/map/MapCanvas';
import type { BaseLayerId, ViewportState } from '@/centerpanel/components/map/mapTypes';

import {
  applyUrbanStudyAreaSelection,
  formatStudyAreaBounds,
  geocodeUrbanStudyArea,
  normalizeStudyAreaBounds,
  openMapExplorerWithStudyAreaPreview,
  previewUrbanStudyAreaInWorkspace,
  viewportFromBounds,
  type UrbanStudyAreaBounds,
  type UrbanStudyAreaCandidate,
} from './context/studyAreaSelection';
import {
  useUrbanStudyAreaBounds,
  useUrbanStudyAreaName,
} from './useUrbanContextStore';
import { IconMap } from './icons';

import styles from './StudyAreaPicker.module.css';

const MINI_MAP_BASE_LAYER: BaseLayerId = 'streets';

/**
 * Initial extent shown when there is no confirmed study area, no useful
 * candidate, and the user has not interacted yet. Wide European preview
 * so the gazetteer search input has a sensible visual context. The mini
 * map operates in `controlled` mode and never inherits the global Map
 * Explorer viewport.
 */
const DEFAULT_PREVIEW: PreviewArea = {
  label: 'Search overview',
  bounds: [-12, 34, 45, 62],
  center: [16.5, 48],
  source: 'Search overview',
  sourceId: 'search-overview',
};

interface StudyAreaPickerProps {
  onAnnounce?: (message: string) => void;
}

interface PreviewArea {
  label: string;
  bounds: UrbanStudyAreaBounds;
  center: [number, number];
  source: string;
  sourceId?: string | null;
  sourceClass?: string | null;
  sourceType?: string | null;
  importance?: number | null;
}

function shortBounds(bounds: UrbanStudyAreaBounds): string {
  return `${bounds[0].toFixed(2)}..${bounds[2].toFixed(2)}`;
}

function previewFromConfirmedArea(
  name: string | null,
  bounds: UrbanStudyAreaBounds | null,
): PreviewArea | null {
  if (!name || !bounds) return null;
  const viewport = viewportFromBounds(bounds);
  return {
    label: name,
    bounds,
    center: viewport.center,
    source: 'Urban Analytics context',
    sourceId: 'urban-context',
  };
}

function previewToInitialViewport(preview: PreviewArea): Partial<ViewportState> {
  const viewport = viewportFromBounds(preview.bounds);
  return {
    center: viewport.center,
    zoom: viewport.zoom,
    bearing: 0,
    pitch: 0,
  };
}

export function StudyAreaPicker({ onAnnounce }: StudyAreaPickerProps) {
  const studyAreaName = useUrbanStudyAreaName();
  const studyAreaBounds = useUrbanStudyAreaBounds();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const latestPreviewRef = useRef<PreviewArea | null>(null);
  const lastAutoSearchRef = useRef('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<UrbanStudyAreaCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewArea>(() =>
    previewFromConfirmedArea(studyAreaName, studyAreaBounds) ?? DEFAULT_PREVIEW,
  );
  const [status, setStatus] = useState('');

  /**
   * The mini map's initial viewport is captured once when the picker
   * opens, so MapCanvas constructs against that explicit viewport instead
   * of inheriting the global Map Explorer store. Subsequent fits are
   * driven by `fitMiniMapToBounds` directly on the MapLibre instance.
   */
  const initialViewportRef = useRef<Partial<ViewportState> | null>(null);
  if (open && initialViewportRef.current == null) {
    initialViewportRef.current = previewToInitialViewport(
      previewFromConfirmedArea(studyAreaName, studyAreaBounds) ?? preview,
    );
  }
  if (!open && initialViewportRef.current != null) {
    initialViewportRef.current = null;
  }

  const selectedResult = useMemo(
    () => results.find((result) => result.id === selectedId) ?? null,
    [results, selectedId],
  );

  const fitMiniMapToBounds = useCallback((bounds: UrbanStudyAreaBounds) => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => {
      // Defensive: container may have resized between mount and fit.
      try { map.resize(); } catch { /* MapLibre teardown race — ignore */ }
      const [west, south, east, north] = bounds;
      if (west === east && south === north) {
        map.easeTo({
          center: [west, south],
          zoom: Math.max(map.getZoom(), 14),
          duration: 260,
          essential: true,
        });
        return;
      }
      map.fitBounds(
        [[west, south], [east, north]],
        { padding: 36, duration: 320, essential: true },
      );
    };
    if (map.isStyleLoaded()) {
      window.requestAnimationFrame(run);
    } else {
      // Style not yet ready — queue once the style finishes loading so
      // fitBounds operates against a real canvas size.
      map.once('load', () => window.requestAnimationFrame(run));
    }
  }, []);

  const applyPreview = useCallback(
    (next: PreviewArea, options: { syncWorkspace?: boolean; fitMap?: boolean } = {}) => {
      latestPreviewRef.current = next;
      setPreview(next);
      if (options.syncWorkspace) {
        previewUrbanStudyAreaInWorkspace({
          bounds: next.bounds,
          source: 'urban-analytics-study-area-preview',
        });
      }
      if (options.fitMap !== false) {
        fitMiniMapToBounds(next.bounds);
      }
    },
    [fitMiniMapToBounds],
  );

  useEffect(() => {
    latestPreviewRef.current = preview;
  }, [preview]);

  // When the picker opens, snap the mini map to the confirmed Urban
  // study area (if any) and propagate it to Map Explorer's scalar
  // preview state. When closed, do nothing — global state is preserved
  // until the user reopens or commits.
  useEffect(() => {
    if (!open) return;
    const confirmed = previewFromConfirmedArea(studyAreaName, studyAreaBounds);
    if (confirmed) {
      applyPreview(confirmed, { syncWorkspace: true });
      setQuery(studyAreaName ?? '');
    } else {
      // No confirmed area — keep the existing preview (or default) but
      // do NOT push the default search-overview bounds into Map
      // Explorer. The default extent is purely a mini-map viewing aid.
      const current = latestPreviewRef.current ?? DEFAULT_PREVIEW;
      applyPreview(current, { syncWorkspace: false });
    }
    // We intentionally only react to picker open/close transitions and
    // confirmed area changes here; user-driven updates flow through the
    // candidate handlers below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studyAreaBounds, studyAreaName]);

  const selectCandidate = useCallback((candidate: UrbanStudyAreaCandidate) => {
    setSelectedId(candidate.id);
    applyPreview(
      {
        label: candidate.shortLabel,
        bounds: candidate.bounds,
        center: candidate.center,
        source: candidate.source,
        sourceId: candidate.sourceId,
        sourceClass: candidate.sourceClass,
        sourceType: candidate.sourceType,
        importance: candidate.importance,
      },
      { syncWorkspace: true },
    );
    setStatus(`Previewing ${candidate.shortLabel}. Confirm to bind this viewport to Urban Analytics workflows.`);
  }, [applyPreview]);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus('Enter a city, district, site, or region name.');
      return;
    }
    setIsSearching(true);
    lastAutoSearchRef.current = trimmed.toLowerCase();
    setStatus('Searching gazetteer...');
    try {
      const candidates = await geocodeUrbanStudyArea(trimmed);
      setResults(candidates);
      if (candidates.length === 0) {
        setSelectedId(null);
        setStatus('No place match found. Use the visible viewport or refine the name.');
        return;
      }
      selectCandidate(candidates[0]!);
      setStatus(`${candidates.length} match${candidates.length === 1 ? '' : 'es'} found. Mini map zoomed to the best match.`);
    } catch (error) {
      setResults([]);
      setSelectedId(null);
      setStatus(error instanceof Error ? error.message : 'Study area search failed.');
    } finally {
      setIsSearching(false);
    }
  }, [query, selectCandidate]);

  useEffect(() => {
    if (!open) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 3) return undefined;
    const normalized = trimmed.toLowerCase();
    if (lastAutoSearchRef.current === normalized) return undefined;
    const timer = window.setTimeout(() => {
      void runSearch();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [open, query, runSearch]);

  const useCurrentMiniMapViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const nextBounds = normalizeStudyAreaBounds([
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]);
    if (!nextBounds) return;
    const center = map.getCenter();
    applyPreview(
      {
        label: 'Mini map viewport',
        bounds: nextBounds,
        center: [Number(center.lng.toFixed(6)), Number(center.lat.toFixed(6))],
        source: 'Mini map viewport',
        sourceId: 'mini-map-viewport',
      },
      { syncWorkspace: true, fitMap: false },
    );
    setSelectedId(null);
    setStatus('Using the current mini-map viewport as the study area extent.');
  }, [applyPreview]);

  const handleViewportChange = useCallback(
    (
      _viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number },
      meta?: { userInitiated: boolean },
    ) => {
      const map = mapRef.current;
      if (!map) return;
      // Only treat moves as preview-worthy when they were initiated by
      // the user. Programmatic animations (`fitBounds` / `easeTo`) emit
      // `moveend` without `originalEvent`; without this guard our own
      // fits would echo back into preview state and could fight the
      // confirmed bounds.
      if (meta && !meta.userInitiated) return;
    const bounds = map.getBounds();
    const nextBounds = normalizeStudyAreaBounds([
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]);
    if (!nextBounds) return;
    const center = map.getCenter();
    const previousPreview = latestPreviewRef.current ?? DEFAULT_PREVIEW;
    const next: PreviewArea = {
      label: previousPreview.label === DEFAULT_PREVIEW.label ? 'Mini map viewport' : previousPreview.label,
      bounds: nextBounds,
      center: [Number(center.lng.toFixed(6)), Number(center.lat.toFixed(6))],
      source: previousPreview.source === DEFAULT_PREVIEW.source ? 'Mini map viewport' : previousPreview.source,
      sourceId: previousPreview.sourceId ?? 'mini-map-viewport',
      sourceClass: previousPreview.sourceClass ?? null,
      sourceType: previousPreview.sourceType ?? null,
      importance: previousPreview.importance ?? null,
    };
    latestPreviewRef.current = next;
    setPreview(next);
    previewUrbanStudyAreaInWorkspace({
      bounds: next.bounds,
      source: 'urban-analytics-study-area-preview',
    });
    },
    [],
  );

  const confirm = useCallback(() => {
    const target = latestPreviewRef.current ?? preview;
    if (!target) {
      setStatus('No viewport is selected yet.');
      return;
    }
    const label = query.trim() || selectedResult?.shortLabel || target.label;
    const result = applyUrbanStudyAreaSelection({
      label,
      bounds: target.bounds,
      center: target.center,
      source: target.source,
      sourceId: target.sourceId,
      sourceClass: target.sourceClass,
      sourceType: target.sourceType,
      importance: target.importance,
    });
    setOpen(false);
    setStatus('');
    onAnnounce?.(`Study area set to ${label}; ${formatStudyAreaBounds(result.bounds)}.`);
  }, [onAnnounce, preview, query, selectedResult]);

  const openFullMap = useCallback(() => {
    const target = latestPreviewRef.current ?? preview;
    openMapExplorerWithStudyAreaPreview({
      bounds: target.bounds,
      source: 'urban-analytics-study-area-open-map',
    });
  }, [preview]);

  const displayBounds = studyAreaBounds ?? null;
  const triggerLabel = studyAreaName ?? 'Set area';

  return (
    <div className={styles.root}>
      <span className={styles.label}>AREA</span>
      <button
        type="button"
        className={`${styles.trigger}${studyAreaName ? '' : ` ${styles.triggerUnset}`}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={studyAreaName ? 'Edit study area' : 'Set study area'}
        aria-expanded={open}
      >
        {studyAreaName ? <IconMap size={12} /> : <span aria-hidden="true">+</span>}
        <span className={styles.triggerText}>{triggerLabel}</span>
        {displayBounds ? <span className={styles.triggerBounds}>{shortBounds(displayBounds)}</span> : null}
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Set Urban Analytics study area">
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <strong>Set Study Area</strong>
              <span>Search a place, inspect the mini map viewport, then bind the extent to Map Explorer and all Urban Analytics workflows.</span>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Close study area picker">
              x
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.side}>
              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void runSearch();
                    }
                    if (event.key === 'Escape') setOpen(false);
                  }}
                  placeholder="Kadikoy, Istanbul..."
                  aria-label="Study area place search"
                />
                <button type="button" className={styles.primaryButton} onClick={() => void runSearch()} disabled={isSearching}>
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              <div className={styles.sourceButtons}>
                <button type="button" className={styles.secondaryButton} onClick={useCurrentMiniMapViewport}>
                  Use viewport
                </button>
                <button type="button" className={styles.secondaryButton} onClick={openFullMap}>
                  Open Map Explorer
                </button>
              </div>

              {results.length > 0 ? (
                <div className={styles.results} role="listbox" aria-label="Study area search results">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className={`${styles.resultButton}${result.id === selectedId ? ` ${styles.resultButtonSelected}` : ''}`}
                      onClick={() => selectCandidate(result)}
                      role="option"
                      aria-selected={result.id === selectedId}
                    >
                      <strong>{result.shortLabel}</strong>
                      <span>{result.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className={styles.status} role="status" aria-live="polite">
                {status || `Viewport: ${formatStudyAreaBounds(preview.bounds)}`}
              </div>
            </div>

            <div className={styles.mapPane}>
              <div className={styles.mapCanvas}>
                <MapCanvas
                  id="urban-study-area-mini-map"
                  baseLayer={MINI_MAP_BASE_LAYER}
                  pinMode={false}
                  pins={[]}
                  reducedMotion
                  viewportMode="controlled"
                  initialViewport={initialViewportRef.current ?? previewToInitialViewport(preview)}
                  onCursorMove={() => {}}
                  onZoomChange={() => {}}
                  onViewportChange={handleViewportChange}
                  onMapClick={() => {}}
                  onMapReady={(map) => {
                    mapRef.current = map;
                    const currentPreview = latestPreviewRef.current ?? preview;
                    fitMiniMapToBounds(currentPreview.bounds);
                  }}
                  onMapDestroy={() => {
                    mapRef.current = null;
                  }}
                />
              </div>
              <div className={styles.viewportFrame} aria-hidden="true" />
              <div className={styles.mapHUD}>
                <code>{formatStudyAreaBounds(preview.bounds)}</code>
                <span>{preview.source}</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.ghostButton} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className={styles.primaryButton} onClick={confirm}>
              Confirm area
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default StudyAreaPicker;
