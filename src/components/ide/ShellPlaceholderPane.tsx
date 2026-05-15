import React, { useMemo, useState } from 'react';
import {
  Building2,
  Clock,
  ExternalLink,
  GitBranch,
  History,
  Layers,
  Map,
  RotateCcw,
  Settings,
  Zap,
} from 'lucide-react';
import type { FileNode, IdeActivityRailItem } from '@/types/state';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useAppStore } from '@/stores/appStore';
import { type Provider, useAiSettingsStore } from '@/stores/useAiSettingsStore';
import { useEditorPrefsStore } from '@/stores/useEditorPrefsStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';

interface ShellPlaceholderPaneProps {
  pane: IdeActivityRailItem;
  onOpenUrban?: () => void;
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = [];
  const recurse = (ns: FileNode[]) => {
    for (const n of ns) {
      if (n.type === 'file') out.push(n);
      if (n.children) recurse(n.children);
    }
  };
  recurse(nodes);
  return out;
}

/* ── Plan History Pane ──────────────────────────────────────────────────── */
function PlanHistoryPane() {
  return (
    <section className="syn-side-pane" aria-label="Plan History">
      <header className="syn-side-pane__header">
        <History size={13} aria-hidden="true" />
        Plan History
        <span className="syn-side-pane__header-kicker">AI</span>
      </header>
      <div className="syn-side-pane__body">
        <div className="syn-side-pane__compact-top">
          <span className="syn-side-pane__chip">Plan Runs 0</span>
          <span className="syn-side-pane__chip">Drafts 0</span>
          <span className="syn-side-pane__chip">Last 0m</span>
        </div>

        <div className="syn-side-pane__notice">
          <Clock size={14} aria-hidden="true" />
          <span>No apply plans yet. Accepted plans will appear here.</span>
        </div>

        <details className="syn-side-pane__fold" open>
          <summary className="syn-side-pane__fold-summary">Quick Actions</summary>
          <div className="syn-side-pane__fold-body">
            {[
              { icon: <Zap size={13} />, label: 'Ask AI to plan a change', meta: 'Alt+Shift+A' },
              { icon: <GitBranch size={13} />, label: 'Dry-run before applying', meta: 'Alt+Shift+D' },
              { icon: <History size={13} />, label: 'Review plan history', meta: 'Recorded with diffs' },
            ].map(({ icon, label, meta }) => (
              <div key={label} className="syn-side-pane__row" style={{ cursor: 'default' }}>
                <span className="syn-side-pane__row-icon">{icon}</span>
                <span className="syn-side-pane__row-content">
                  <span className="syn-side-pane__row-name">{label}</span>
                  <span className="syn-side-pane__row-meta">{meta}</span>
                </span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

/* ── Map Bridge Pane ────────────────────────────────────────────────────── */
function MapBridgePane() {
  const files = useFileExplorerStore(s => s.files);
  const mapOnline = useSynapseWorkspaceStore(s => s.syncState.modules['map-explorer']?.online ?? false);
  const mapCandidates = useMemo(
    () => flattenFiles(files).filter(f => f.semanticStatus?.mapLayerCandidate),
    [files]
  );

  return (
    <section className="syn-side-pane syn-side-pane--bridge" aria-label="Map Bridge">
      <header className="syn-side-pane__header">
        <Map size={13} aria-hidden="true" />
        Map Bridge
        <span className="syn-side-pane__header-kicker">GEO</span>
      </header>
      <div className="syn-side-pane__body">
        <div className="syn-side-pane__compact-top">
          <span className="syn-side-pane__chip">Candidates {mapCandidates.length}</span>
          <span
            className="syn-side-pane__chip"
            style={{ color: mapOnline ? 'var(--syn-status-valid)' : 'var(--ide-text-muted)' }}
            title={mapOnline ? 'Map Explorer is online' : 'Map Explorer has not synced yet'}
          >
            {mapOnline ? 'Explorer Online' : 'Explorer Offline'}
          </span>
        </div>

        {mapCandidates.length === 0 ? (
          <div className="syn-side-pane__notice">
            <Layers size={14} aria-hidden="true" />
            <span>No map layer candidates yet.</span>
          </div>
        ) : null}

        <details className="syn-side-pane__fold" open>
          <summary className="syn-side-pane__fold-summary">Layer Candidates</summary>
          <div className="syn-side-pane__fold-body">
            {mapCandidates.map(f => (
              <div key={f.id} className="syn-side-pane__row" style={{ cursor: 'default' }}>
                <span className="syn-side-pane__row-icon">
                  <Layers size={13} />
                </span>
                <span className="syn-side-pane__row-content">
                  <span className="syn-side-pane__row-name" title={f.name}>{f.name}</span>
                  <span className="syn-side-pane__row-meta syn-side-pane__path" title={f.path}>{f.path}</span>
                </span>
                {f.semanticStatus?.scenarioArtifact ? (
                  <span className="syn-side-pane__badge" data-color="purple">scenario</span>
                ) : null}
                {f.semanticStatus?.analysisOutput ? (
                  <span className="syn-side-pane__badge" data-color="teal">analysis</span>
                ) : null}
              </div>
            ))}
          </div>
        </details>

        <p style={{ padding: '4px 8px 6px', margin: 0, fontSize: '10px', color: 'var(--ide-text-muted)', lineHeight: 1.5 }}>
          Tag files as map layer candidate to enable one-click spatial handoff.
        </p>
      </div>
    </section>
  );
}

/* ── Urban Bridge Pane ──────────────────────────────────────────────────── */
function UrbanBridgePane({ onOpenUrban }: { onOpenUrban?: () => void }) {
  const files = useFileExplorerStore(s => s.files);
  const urbanOnline = useSynapseWorkspaceStore(s => s.syncState.modules['urban-analytics']?.online ?? false);
  const scenarioFiles = useMemo(
    () => flattenFiles(files).filter(f => f.semanticStatus?.scenarioArtifact),
    [files]
  );

  return (
    <section className="syn-side-pane syn-side-pane--bridge" aria-label="Urban Bridge">
      <header className="syn-side-pane__header">
        <Building2 size={13} aria-hidden="true" />
        Urban Bridge
        <span className="syn-side-pane__header-kicker">UA</span>
      </header>
      <div className="syn-side-pane__body">
        <div className="syn-side-pane__compact-top">
          <span className="syn-side-pane__chip">Artifacts {scenarioFiles.length}</span>
          <span
            className="syn-side-pane__chip"
            style={{ color: urbanOnline ? 'var(--syn-status-valid)' : 'var(--ide-text-muted)' }}
            title={urbanOnline ? 'Urban Analytics is online' : 'Urban Analytics has not synced yet'}
          >
            {urbanOnline ? 'UA Online' : 'UA Offline'}
          </span>
        </div>

        <div style={{ padding: '4px 4px 4px' }}>
          <button
            type="button"
            className="syn-side-pane__action-btn"
            style={{ width: '100%' }}
            onClick={onOpenUrban}
          >
            <ExternalLink size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true" />
            Open Urban Analytics
          </button>
        </div>

        {scenarioFiles.length === 0 ? (
          <div className="syn-side-pane__notice">
            <Building2 size={14} aria-hidden="true" />
            <span>No scenario artifacts yet.</span>
          </div>
        ) : null}

        <details className="syn-side-pane__fold" open>
          <summary className="syn-side-pane__fold-summary">Scenario Artifacts</summary>
          <div className="syn-side-pane__fold-body">
            {scenarioFiles.map(f => (
              <div key={f.id} className="syn-side-pane__row" style={{ cursor: 'default' }}>
                <span className="syn-side-pane__row-icon">
                  <Building2 size={13} />
                </span>
                <span className="syn-side-pane__row-content">
                  <span className="syn-side-pane__row-name" title={f.name}>{f.name}</span>
                  <span className="syn-side-pane__row-meta syn-side-pane__path" title={f.path}>{f.path}</span>
                </span>
                <span className="syn-side-pane__badge" data-color="purple">scenario</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

/* ── Settings Pane ──────────────────────────────────────────────────────── */

/** Reusable toggle switch */
function Toggle({
  id,
  checked,
  onChange,
  ariaLabel,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <label className="syn-settings__toggle" htmlFor={id} aria-label={ariaLabel}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="syn-settings__toggle-track" />
      <span className="syn-settings__toggle-thumb" />
    </label>
  );
}

/** Reusable stepper for numeric values */
function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="syn-settings__stepper">
      <button
        type="button"
        className="syn-settings__stepper-btn"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - step))}
      >−</button>
      <span className="syn-settings__stepper-val">{value}</span>
      <button
        type="button"
        className="syn-settings__stepper-btn"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + step))}
      >+</button>
    </div>
  );
}

/** A single settings row with label + optional description + control */
function SettingsRow({
  label,
  desc,
  control,
}: {
  label: string;
  desc?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="syn-settings__row">
      <div className="syn-settings__row-info">
        <div className="syn-settings__label">{label}</div>
        {desc ? <div className="syn-settings__desc">{desc}</div> : null}
      </div>
      {control}
    </div>
  );
}

function SettingsPane() {
  // ── Editor Prefs ──────────────────────────────────────────────────────
  const prefs = useEditorPrefsStore(s => s);
  const setPrefs = useEditorPrefsStore(s => s.setPrefs);
  const resetPrefs = useEditorPrefsStore(s => s.resetToDefaults);

  // ── Layout ────────────────────────────────────────────────────────────
  const sidebarWidth   = useAppStore(s => s.layout.sidebarWidth);
  const terminalHeight = useAppStore(s => s.layout.terminalHeight);
  const aiPanelWidth   = useAppStore(s => s.layout.aiAssistantWidth ?? 420);
  const setSidebarWidth   = useAppStore(s => s.setSidebarWidth);
  const setTerminalHeight = useAppStore(s => s.setTerminalHeight);
  const setAiAssistantWidth = useAppStore(s => s.setAiAssistantWidth);

  // ── AI Settings ───────────────────────────────────────────────────────
  const aiDefaults    = useAiSettingsStore(s => s.defaults);
  const aiUI          = useAiSettingsStore(s => s.ui);
  const aiFlags       = useAiSettingsStore(s => s.flags);
  const aiTokenBudget = useAiSettingsStore(s => s.tokenBudget);
  const setDefaults   = useAiSettingsStore(s => s.setDefaults);
  const setAiUI       = useAiSettingsStore(s => s.setUI);
  const setFlags      = useAiSettingsStore(s => s.setFlags);
  const setTokenBudget = useAiSettingsStore(s => s.setTokenBudget);

  // ── AI Key entry ──────────────────────────────────────────────────────
  const [keyDraft, setKeyDraft] = useState('');
  const setKey = useAiSettingsStore(s => s.setKey);

  const providerOptions: { value: Provider; label: string }[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'gemini', label: 'Google Gemini' },
  ];

  const fontFamilyOptions = [
    'Fira Code, Monaco, Menlo, Consolas, monospace',
    'JetBrains Mono, Consolas, monospace',
    'Cascadia Code, Consolas, monospace',
    'Source Code Pro, Menlo, monospace',
    'Consolas, monospace',
    'monospace',
  ];

  const lineNumberOptions = ['on', 'off', 'relative', 'interval'] as const;
  const cursorStyleOptions = ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'] as const;
  const whitespaceOptions  = ['none', 'boundary', 'selection', 'trailing', 'all'] as const;

  return (
    <section className="syn-side-pane" aria-label="Settings">
      <header className="syn-side-pane__header">
        <Settings size={13} aria-hidden="true" />
        Settings
        <span className="syn-side-pane__header-kicker">IDE</span>
      </header>
      <div className="syn-side-pane__body">
        <div className="syn-settings__compact-intro">
          <div className="syn-settings__pill">Editor {prefs.fontSize}px</div>
          <div className="syn-settings__pill">AI {aiDefaults.provider}</div>
          <div className="syn-settings__pill">Sidebar {sidebarWidth}px</div>
        </div>

        <div className="syn-settings__section-header">Quick Controls</div>
        <SettingsRow
          label="Font Size"
          control={
            <Stepper
              value={prefs.fontSize}
              min={10}
              max={28}
              onChange={v => setPrefs({ fontSize: v })}
            />
          }
        />
        <SettingsRow label="Word Wrap" control={<Toggle id="s-wordwrap" ariaLabel="Word Wrap" checked={prefs.wordWrap} onChange={v => setPrefs({ wordWrap: v })} />} />
        <SettingsRow label="Minimap" control={<Toggle id="s-minimap" ariaLabel="Minimap" checked={prefs.minimap} onChange={v => setPrefs({ minimap: v })} />} />
        <SettingsRow
          label="Provider"
          control={
            <select
              className="syn-settings__select"
              value={aiDefaults.provider}
              onChange={e => setDefaults({ provider: e.target.value as Provider })}
            >
              {providerOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          }
        />
        <SettingsRow
          label="Temperature"
          control={
            <div className="syn-settings__range-wrap">
              <input
                type="range"
                className="syn-settings__range"
                min={0}
                max={2}
                step={0.05}
                value={aiDefaults.temperature}
                onChange={e => setDefaults({ temperature: Number(e.target.value) })}
                aria-label="AI temperature"
              />
              <span className="syn-settings__range-val">{aiDefaults.temperature.toFixed(2)}</span>
            </div>
          }
        />
        <SettingsRow
          label="Sidebar"
          control={
            <div className="syn-settings__range-wrap">
              <input
                type="range"
                className="syn-settings__range"
                min={200}
                max={600}
                step={10}
                value={sidebarWidth}
                onChange={e => setSidebarWidth(Number(e.target.value))}
                aria-label="Sidebar width"
              />
              <span className="syn-settings__range-val">{sidebarWidth}</span>
            </div>
          }
        />

        <details className="syn-settings__fold" open>
          <summary className="syn-settings__fold-summary">Editor Advanced</summary>
          <div className="syn-settings__fold-body">
            <SettingsRow
              label="Font Family"
              control={
                <select
                  className="syn-settings__select"
                  value={prefs.fontFamily}
                  onChange={e => setPrefs({ fontFamily: e.target.value })}
                >
                  {fontFamilyOptions.map(f => (
                    <option key={f} value={f}>{f.split(',')[0]}</option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Tab Size"
              control={
                <select
                  className="syn-settings__select"
                  value={String(prefs.tabSize)}
                  onChange={e => setPrefs({ tabSize: Number(e.target.value) })}
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="8">8 spaces</option>
                </select>
              }
            />
            <SettingsRow
              label="Line Numbers"
              control={
                <select
                  className="syn-settings__select"
                  value={prefs.lineNumbers}
                  onChange={e => setPrefs({ lineNumbers: e.target.value as typeof lineNumberOptions[number] })}
                >
                  {lineNumberOptions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Cursor Style"
              control={
                <select
                  className="syn-settings__select"
                  value={prefs.cursorStyle}
                  onChange={e => setPrefs({ cursorStyle: e.target.value as typeof cursorStyleOptions[number] })}
                >
                  {cursorStyleOptions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Whitespace"
              control={
                <select
                  className="syn-settings__select"
                  value={prefs.renderWhitespace}
                  onChange={e => setPrefs({ renderWhitespace: e.target.value as typeof whitespaceOptions[number] })}
                >
                  {whitespaceOptions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              }
            />
            <SettingsRow label="Bracket Colors" control={<Toggle id="s-brackets" ariaLabel="Bracket Colors" checked={prefs.bracketPairColorization} onChange={v => setPrefs({ bracketPairColorization: v })} />} />
            <SettingsRow label="Sticky Scroll" control={<Toggle id="s-sticky" ariaLabel="Sticky Scroll" checked={prefs.stickyScroll} onChange={v => setPrefs({ stickyScroll: v })} />} />
            <SettingsRow label="Column Rulers" control={<Toggle id="s-rulers" ariaLabel="Column Rulers" checked={prefs.rulers} onChange={v => setPrefs({ rulers: v })} />} />
            <SettingsRow label="Smooth Scroll" control={<Toggle id="s-smooth" ariaLabel="Smooth Scroll" checked={prefs.smoothScrolling} onChange={v => setPrefs({ smoothScrolling: v })} />} />
            <SettingsRow label="Mouse Wheel Zoom" control={<Toggle id="s-wheelzoom" ariaLabel="Mouse Wheel Zoom" checked={prefs.mouseWheelZoom} onChange={v => setPrefs({ mouseWheelZoom: v })} />} />
            <SettingsRow label="Inline Suggest" control={<Toggle id="s-inline" ariaLabel="Inline Suggest" checked={prefs.inlineSuggest} onChange={v => setPrefs({ inlineSuggest: v })} />} />
            <SettingsRow label="Format on Paste" control={<Toggle id="s-fmtpaste" ariaLabel="Format on Paste" checked={prefs.formatOnPaste} onChange={v => setPrefs({ formatOnPaste: v })} />} />
            <SettingsRow label="Format on Save" control={<Toggle id="s-fmtsave" ariaLabel="Format on Save" checked={prefs.formatOnSave} onChange={v => setPrefs({ formatOnSave: v })} />} />
            <SettingsRow label="Auto Save" control={<Toggle id="s-autosave" ariaLabel="Auto Save" checked={prefs.autoSave} onChange={v => setPrefs({ autoSave: v })} />} />
            <button type="button" className="syn-settings__reset-btn" onClick={resetPrefs}>
              <RotateCcw size={11} aria-hidden="true" />
              Reset Editor to Defaults
            </button>
          </div>
        </details>

        <details className="syn-settings__fold">
          <summary className="syn-settings__fold-summary">Layout Advanced</summary>
          <div className="syn-settings__fold-body">
            <SettingsRow
              label="Terminal Height"
              control={
                <div className="syn-settings__range-wrap">
                  <input
                    type="range"
                    className="syn-settings__range"
                    min={100}
                    max={600}
                    step={10}
                    value={terminalHeight}
                    onChange={e => setTerminalHeight(Number(e.target.value))}
                    aria-label="Terminal height"
                  />
                  <span className="syn-settings__range-val">{terminalHeight}</span>
                </div>
              }
            />
            <SettingsRow
              label="AI Panel Width"
              control={
                <div className="syn-settings__range-wrap">
                  <input
                    type="range"
                    className="syn-settings__range"
                    min={300}
                    max={800}
                    step={10}
                    value={aiPanelWidth}
                    onChange={e => setAiAssistantWidth(Number(e.target.value))}
                    aria-label="AI panel width"
                  />
                  <span className="syn-settings__range-val">{aiPanelWidth}</span>
                </div>
              }
            />
            <SettingsRow label="Compact AI Chat" control={<Toggle id="s-compact" ariaLabel="Compact AI Chat" checked={aiUI.compactMode} onChange={v => setAiUI({ compactMode: v })} />} />
            <SettingsRow label="Auto Insert to Editor" control={<Toggle id="s-autoins" ariaLabel="Auto Insert to Editor" checked={aiUI.autoInsertToEditor} onChange={v => setAiUI({ autoInsertToEditor: v })} />} />
          </div>
        </details>

        <details className="syn-settings__fold">
          <summary className="syn-settings__fold-summary">AI Advanced</summary>
          <div className="syn-settings__fold-body">
            <SettingsRow
              label="Max Tokens"
              control={<Stepper value={aiDefaults.maxTokens} min={256} max={32768} step={256} onChange={v => setDefaults({ maxTokens: v })} />}
            />
            <SettingsRow
              label="Token Budget"
              control={<Stepper value={aiTokenBudget} min={1000} max={128000} step={1000} onChange={v => setTokenBudget(v)} />}
            />
            <SettingsRow label="Streaming v2" control={<Toggle id="s-streamv2" ariaLabel="Streaming v2" checked={aiFlags.aiStreamingV2} onChange={v => setFlags({ aiStreamingV2: v })} />} />
            <SettingsRow label="Log AI Events" control={<Toggle id="s-logai" ariaLabel="Log AI Events" checked={aiFlags.logAiEvents} onChange={v => setFlags({ logAiEvents: v })} />} />
            <div className="syn-settings__key-row">
              <input
                type="password"
                className="syn-settings__key-input"
                placeholder={`${aiDefaults.provider} API key...`}
                value={keyDraft}
                onChange={e => setKeyDraft(e.target.value)}
                autoComplete="off"
                aria-label="API key"
              />
              <button
                type="button"
                className="syn-settings__key-save"
                disabled={keyDraft.trim().length === 0}
                onClick={() => {
                  void setKey(aiDefaults.provider, keyDraft.trim());
                  setKeyDraft('');
                }}
              >
                Save
              </button>
            </div>
          </div>
        </details>

        <p style={{ padding: '4px 8px 6px', margin: 0, fontSize: '10px', color: 'var(--ide-text-muted)', lineHeight: 1.5 }}>
          Compact mode enabled: Quick controls are always visible, advanced controls are grouped below.
        </p>
      </div>
    </section>
  );
}

/* ── Main export ────────────────────────────────────────────────────────── */

export const ShellPlaceholderPane: React.FC<ShellPlaceholderPaneProps> = ({
  pane,
  onOpenUrban,
}) => {
  // Dedicated components handle explorer, outline, search, problems
  if (
    pane === 'explorer' ||
    pane === 'outline' ||
    pane === 'search' ||
    pane === 'problems'
  ) {
    return null;
  }

  if (pane === 'planHistory') return <PlanHistoryPane />;
  if (pane === 'mapBridge')   return <MapBridgePane />;
  if (pane === 'urbanBridge') return <UrbanBridgePane {...(onOpenUrban !== undefined ? { onOpenUrban } : {})} />;
  if (pane === 'settings')    return <SettingsPane />;

  return null;
};

export default ShellPlaceholderPane;

