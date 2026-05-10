/**
 * IdeMapHandoffDock — premium, format-aware Map Handoff console.
 *
 * Behavior contract:
 * 1. Renders ONLY when the active editor tab is a recognized geo-format file
 *    (or a spatial output exists). When no eligible context is present, the
 *    component returns null — guaranteeing zero impact on the IDE layout.
 * 2. Statically docked at the bottom-right of the viewport using
 *    `position: fixed` so it never participates in flex/grid flow of the IDE
 *    shell. The card is collapsible to a slim pill to stay out of the way.
 * 3. Reactive: subscribes to editor / map / workspace stores so eligibility
 *    refreshes automatically as the user switches tabs, makes selections, or
 *    new layers are produced.
 * 4. Premium amber-on-graphite aesthetic aligned with the Synapse IDE shell.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  evaluateIdeMapHandoffEligibility,
  focusRelatedLayer,
  type IdeMapHandoffEligibility,
  openInMapExplorer,
  registerSpatialArtifact,
  sendSelectionToMap,
} from '@/services/map/ideMapHandoff';
import { type GeoFormatInfo, getGeoFormatInfo } from '@/services/commandRegistry';
import { synapseBus } from '@/services/synapseBus';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { SynapseBusSubscription } from '@/types/synapse-bus';

// ─── Theme tokens ───────────────────────────────────────────────────────────

const T = {
  surface:    'rgba(18, 18, 20, 0.92)',
  surfaceAlt: 'rgba(28, 28, 32, 0.88)',
  border:     'rgba(245, 158, 11, 0.22)',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  amber:      '#f59e0b',
  amberSoft:  'rgba(245, 158, 11, 0.14)',
  amberDeep:  '#b45309',
  text:       '#e5e7eb',
  textSoft:   '#9ca3af',
  textMuted:  '#6b7280',
  ok:         '#34d399',
  okSoft:     'rgba(52, 211, 153, 0.14)',
  err:        '#f87171',
} as const;

// Layout constants — must match ideShell.css / StatusBar height.
const ACTIVITY_RAIL_W = 42;
const STATUS_BAR_H    = 30;

const FAMILY_LABEL: Record<GeoFormatInfo['family'], string> = {
  vector:     'Vector',
  raster:     'Raster',
  pointcloud: 'Point Cloud',
  cad:        'CAD',
  tabular:    'Tabular',
  archive:    'Archive',
};

// ─── Reactive eligibility hook ──────────────────────────────────────────────

function useLiveEligibility(): IdeMapHandoffEligibility {
  const activeTabId    = useEditorStore(s => s.activeTabId);
  const tabs           = useEditorStore(s => s.tabs);
  const overlayLayers  = useMapExplorerStore(s => s.overlayLayers);
  const analysisLayers = useMapExplorerStore(s => s.activeAnalysisResultLayerIds);
  const artifacts      = useSynapseWorkspaceStore(s => s.artifacts);

  return useMemo(
    () => evaluateIdeMapHandoffEligibility(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTabId, tabs, overlayLayers, analysisLayers, artifacts],
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function IdeMapHandoffDemo() {
  const activeTab = useEditorStore(
    s => s.tabs.find(t => t.id === s.activeTabId) ?? null,
  );
  const sidebarWidth     = useAppStore(s => s.layout.sidebarWidth);
  const sidebarCollapsed = useAppStore(s => s.layout.sidebarCollapsed);
  const eligibility = useLiveEligibility();
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [log, setLog] = useState<string[]>([]);
  const lastBusUnsubsRef = useRef<SynapseBusSubscription[]>([]);

  const formatInfo = useMemo<GeoFormatInfo | null>(
    () => getGeoFormatInfo(activeTab?.path),
    [activeTab?.path],
  );

  // Activation rule: only render when the active tab is a recognized geo
  // format OR a generated spatial output / related layer is available.
  // Also hide entirely when the sidebar is collapsed (no anchor column).
  const isActive =
    !sidebarCollapsed &&
    (formatInfo !== null
      || eligibility.hasGeneratedSpatialOutput
      || eligibility.canFocusRelatedLayer);

  const pushLog = useCallback((msg: string) => {
    setLog(prev => [`${new Date().toLocaleTimeString()}  ${msg}`, ...prev].slice(0, 24));
  }, []);

  useEffect(() => {
    if (!isActive) return undefined;
    const u1 = synapseBus.on('map.layer.focus', p =>
      pushLog(`bus → map.layer.focus  layerId=${p.layerId}`),
    );
    const u2 = synapseBus.on('map.selection.export', p =>
      pushLog(`bus → map.selection.export  features=${p.featureCount}`),
    );
    const u3 = synapseBus.on('evidence.artifact.register', p =>
      pushLog(`bus → evidence.artifact.register  id=${p.artifactId}`),
    );
    lastBusUnsubsRef.current = [u1, u2, u3];
    return () => {
      lastBusUnsubsRef.current.forEach(s => s.off());
      lastBusUnsubsRef.current = [];
    };
  }, [isActive, pushLog]);

  const run = useCallback(
    (label: string, fn: () => { ok: boolean; reason?: string }) => {
      const r = fn();
      pushLog(r.ok ? `✓ ${label}` : `✗ ${label} — ${r.reason ?? 'unavailable'}`);
    },
    [pushLog],
  );

  if (!isActive) return null;

  // ── Collapsed pill (slim bar pinned to bottom of file-explorer column) ──
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title="Open Map Handoff console"
        style={{
          position: 'fixed',
          left: ACTIVITY_RAIL_W,
          bottom: STATUS_BAR_H,
          width: sidebarWidth,
          height: 26,
          zIndex: 950,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          fontFamily: 'inherit',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          textAlign: 'left',
          color: T.amber,
          background: T.surface,
          borderTop: `1px solid ${T.border}`,
          borderRight: `1px solid ${T.borderSoft}`,
          borderLeft: 'none',
          borderBottom: 'none',
          borderRadius: 0,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: T.amber,
            boxShadow: `0 0 8px ${T.amber}`,
          }}
        />
        Map Handoff
        {formatInfo ? (
          <span style={{ color: T.textSoft, fontWeight: 500 }}>· {formatInfo.label}</span>
        ) : null}
        <span style={{ flex: 1 }} />
        <span style={{ color: T.textMuted, fontSize: 11 }}>▴</span>
      </button>
    );
  }

  // ── Expanded dock (same column footprint, grows upward) ──
  return (
    <aside
      aria-label="Map Handoff console"
      style={{
        position: 'fixed',
        left: ACTIVITY_RAIL_W,
        bottom: STATUS_BAR_H,
        width: sidebarWidth,
        maxHeight: `min(420px, calc(100vh - ${STATUS_BAR_H}px - 80px))`,
        zIndex: 950,
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          'ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif',
        fontSize: 12,
        color: T.text,
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        borderRight: `1px solid ${T.borderSoft}`,
        borderLeft: 'none',
        borderBottom: 'none',
        borderRadius: 0,
        boxShadow: '0 -10px 32px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(14px)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: `1px solid ${T.borderSoft}`,
          background: 'linear-gradient(180deg, rgba(245,158,11,0.05), transparent)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: T.amber,
            boxShadow: `0 0 8px ${T.amber}`,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: T.amber,
          }}
        >
          Map Handoff
        </span>
        {formatInfo ? <FormatBadge info={formatInfo} /> : null}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          aria-label="Collapse"
          onClick={() => setCollapsed(true)}
          style={iconBtn}
        >
          ▾
        </button>
      </header>

      <section style={{ padding: '10px 12px', borderBottom: `1px solid ${T.borderSoft}` }}>
        <div
          style={{
            color: T.textSoft,
            fontSize: 10.5,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Active Dataset
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, "Cascadia Code", Menlo, Consolas, monospace',
            fontSize: 12,
            color: T.text,
            wordBreak: 'break-all',
          }}
        >
          {activeTab?.path ?? '—'}
        </div>
      </section>

      <section style={{ padding: '8px 12px', borderBottom: `1px solid ${T.borderSoft}` }}>
        <CapRow label="Spatial file"        on={eligibility.hasSpatialFile} />
        <CapRow label="Related layer"       on={eligibility.hasRelatedLayer} />
        <CapRow label="Selection reference" on={eligibility.hasSelectionReference} />
        <CapRow label="Generated output"    on={eligibility.hasGeneratedSpatialOutput} />
      </section>

      <section
        style={{
          padding: '10px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        <ActionBtn
          label="Open in Map"
          enabled={eligibility.canOpenInMapExplorer}
          onClick={() => run('Opened in Map Explorer', openInMapExplorer)}
        />
        <ActionBtn
          label="Focus Layer"
          enabled={eligibility.canFocusRelatedLayer}
          onClick={() => run('Focused related layer', focusRelatedLayer)}
        />
        <ActionBtn
          label="Send Selection"
          enabled={eligibility.canSendSelectionToMap}
          onClick={() => run('Sent selection to map', sendSelectionToMap)}
        />
        <ActionBtn
          label="Register Artifact"
          enabled={eligibility.canRegisterSpatialArtifact}
          onClick={() => run('Registered spatial artifact', registerSpatialArtifact)}
        />
      </section>

      <section
        style={{
          padding: '8px 12px 10px',
          borderTop: `1px solid ${T.borderSoft}`,
          background: T.surfaceAlt,
          maxHeight: 140,
          overflowY: 'auto',
          fontFamily: 'ui-monospace, "Cascadia Code", Menlo, Consolas, monospace',
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {log.length === 0 ? (
          <span style={{ color: T.textMuted }}>Listening for handoff events…</span>
        ) : (
          log.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.includes('✓')
                  ? T.ok
                  : line.includes('✗')
                  ? T.err
                  : T.textSoft,
              }}
            >
              {line}
            </div>
          ))
        )}
      </section>
    </aside>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function FormatBadge({ info }: { info: GeoFormatInfo }) {
  return (
    <span
      title={`${FAMILY_LABEL[info.family]} · ${info.ext}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: T.amber,
        background: T.amberSoft,
        border: `1px solid ${T.border}`,
        borderRadius: 999,
      }}
    >
      {info.label}
      <span style={{ color: T.textMuted, fontWeight: 500 }}>
        · {FAMILY_LABEL[info.family]}
      </span>
    </span>
  );
}

function CapRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 0',
      }}
    >
      <span style={{ color: T.textSoft, fontSize: 11.5 }}>{label}</span>
      <span
        style={{
          padding: '1px 8px',
          fontSize: 10,
          fontWeight: 600,
          color: on ? T.ok : T.textMuted,
          background: on ? T.okSoft : 'transparent',
          border: `1px solid ${on ? 'rgba(52,211,153,0.35)' : T.borderSoft}`,
          borderRadius: 999,
        }}
      >
        {on ? 'ready' : '—'}
      </span>
    </div>
  );
}

function ActionBtn({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      style={{
        padding: '7px 10px',
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: 0.2,
        color: enabled ? '#0b0b0c' : T.textMuted,
        background: enabled ? T.amber : 'transparent',
        border: `1px solid ${enabled ? T.amberDeep : T.borderSoft}`,
        borderRadius: 6,
        cursor: enabled ? 'pointer' : 'not-allowed',
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      {label}
    </button>
  );
}

const iconBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  color: T.textSoft,
  background: 'transparent',
  border: `1px solid ${T.borderSoft}`,
  borderRadius: 5,
  cursor: 'pointer',
};
