/**
 * Urban Analytics Workbench — Right Panel Four-Block Component
 *
 * Displays structured content for a selected Card in 4 tabs:
 * 1. Methodology (summary, approach, limitations, SDG alignment)
 * 2. Data Requirements (datasets, tools, examples)
 * 3. Python Code (prompts / code snippets)
 * 4. References (evidence, citations)
 *
 * Mirrors the original RightPanelFourBlock.tsx architecture with
 * urban analytics domain content.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './rightPanelFourBlock.css';
import type { AnalyticalFlowId, Card } from './lib/types';
import {
	type Assembled,
	assembleFourBlock,
	buildScientificDossier,
	type DossierArtifactLink,
	type DossierBadge,
	type DossierKeyValue,
	type DossierTone,
	type ExampleVariant,
	extractPlainText,
	formatApa,
	generatePageDoc,
	loadLS,
	LS_KEYS,
	type RefLite,
	sanitizeHtml,
	saveLS,
} from './rightPanelUtils';
import { usePanelBridgeStore } from '../../stores/usePanelBridgeStore';
import { useUrbanContextSummary, useUrbanEvidenceArtifacts } from './useUrbanContextStore';
import {
	buildAndDispatchPythonScript,
	buildSeedFromMethodCard,
} from './context/codeArtifactRequestActions';
import {
	openUrbanLearningPath,
	resolveUrbanLearningPath,
} from './context/educationArtifactBuilder';
import { enqueueUrbanMethodCardReportBlock } from './context/reportArtifactBuilder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PanelTab = 'methodology' | 'data' | 'code' | 'references';
type Density = 'compact' | 'comfort';
type RenderMode = 'inline' | 'page';

interface RightPanelFourBlockProps {
 card: Card | null;
 onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Tab metadata
// ---------------------------------------------------------------------------

const TABS: { key: PanelTab; label: string; icon: string }[] = [
 { key: 'methodology', label: 'Methodology', icon: '' },
 { key: 'data', label: 'Data Fitness', icon: '' },
 { key: 'code', label: 'Code & Repro', icon: '' },
 { key: 'references', label: 'Evidence & Refs', icon: '' },
];

/** Maps card tags to the most relevant flow IDs for "Open Related Flow" link. */
const TAG_FLOW_MAP: Record<string, { id: string; label: string }> = {
 land_use: { id: 'site_suitability', label: 'Site Suitability' },
 spatial_stats: { id: 'indicator_composite', label: 'Composite Indicator' },
 accessibility: { id: 'accessibility', label: 'Accessibility' },
 network_analysis: { id: 'accessibility', label: 'Accessibility' },
 mobility: { id: 'accessibility', label: 'Accessibility' },
 transit: { id: 'accessibility', label: 'Accessibility' },
 climate: { id: 'vulnerability', label: 'Vulnerability' },
 flood: { id: 'vulnerability', label: 'Vulnerability' },
 equity: { id: 'equity_audit', label: 'Equity Audit' },
 health: { id: 'facility_optimisation', label: 'Facility Optimisation' },
 parks: { id: 'facility_optimisation', label: 'Facility Optimisation' },
 remote_sensing: { id: 'change_detection', label: 'Change Detection' },
 change_detection: { id: 'change_detection', label: 'Change Detection' },
 indicators: { id: 'indicator_composite', label: 'Composite Indicator' },
 scenario: { id: 'scenario_comparison', label: 'Scenario Comparison' },
 policy: { id: 'scenario_comparison', label: 'Scenario Comparison' },
 cellular_automata: { id: 'urban_growth_ca', label: 'Urban Growth Cellular Automata' },
 sprawl: { id: 'urban_growth_ca', label: 'Urban Growth Cellular Automata' },
 simulation: { id: 'system_dynamics', label: 'System Dynamics Module' },
 housing: { id: 'system_dynamics', label: 'System Dynamics Module' },
 employment: { id: 'system_dynamics', label: 'System Dynamics Module' },
 green_infra: { id: 'system_dynamics', label: 'System Dynamics Module' },
 voxcity: { id: 'voxcity_3d', label: 'VoxCity 3D' },
 '3d_modeling': { id: 'voxcity_3d', label: 'VoxCity 3D' },
 morphology: { id: 'voxcity_3d', label: 'VoxCity 3D' },
 built_form: { id: 'voxcity_3d', label: 'VoxCity 3D' },
 solar: { id: 'sunlight_sim', label: 'Sunlight Simulation' },
 environmental_analysis: { id: 'sunlight_sim', label: 'Sunlight Simulation' },
 energy: { id: 'sunlight_sim', label: 'Sunlight Simulation' },
 density: { id: 'voxcity_3d', label: 'VoxCity 3D' },
};

/**
 * Direct card ID → flow mapping. Takes precedence over tag-based resolution
 * so that each tool card opens its own dedicated flow rather than falling back
 * to a generic one.
 */
const CARD_FLOW_MAP: Record<string, { id: string; label: string }> = {
 'voxcity-building-extrusion': { id: 'voxcity_3d', label: 'VoxCity 3D Building Viewer' },
 'voxcity-cityjson-loader': { id: 'cityjson_loader', label: 'CityJSON 3D Viewer' },
 'voxcity-sunlight-solar': { id: 'sunlight_sim', label: 'Sunlight & Solar Simulation' },
};

function badgeClass(tone: DossierTone): string {
 return `rp-status rp-status--${tone}`;
}

function StatusBadge({ badge }: { badge: DossierBadge }) {
 return (
 <span className={badgeClass(badge.tone)} title={badge.detail}>
 {badge.label}
 </span>
 );
}

function KeyValueGrid({ rows }: { rows: DossierKeyValue[] }) {
 return (
 <dl className="rp-kv-grid">
 {rows.map((row) => (
 <div key={row.label} className={`rp-kv-row rp-kv-row--${row.tone ?? 'neutral'}`}>
 <dt>{row.label}</dt>
 <dd>{row.value}</dd>
 </div>
 ))}
 </dl>
 );
}

function DossierList({
 title,
 items,
 tone = 'neutral',
}: {
 title: string;
 items: string[];
 tone?: DossierTone;
}) {
 return (
 <section className={`rp-dossier-list rp-dossier-list--${tone}`}>
 <h4>{title}</h4>
 {items.length === 0 ? (
 <p className="rp-muted">No entries recorded.</p>
 ) : (
 <ul>
 {items.map((item) => (
 <li key={item}>{item}</li>
 ))}
 </ul>
 )}
 </section>
 );
}

function formatCodeArtifactPanelStatus(
 filename: string,
 bridgeRouted: boolean,
 safetyNotes: readonly string[],
): string {
 const runtimeNotes = safetyNotes.filter((note) => /\b(demo|synthetic|unknown)\b/i.test(note));
 const prefix = runtimeNotes.length > 0 ? `${runtimeNotes.join(' ')} ` : '';
 if (!bridgeRouted) {
 return `${prefix}bridge-not-routed: ${filename} was registered as evidence, but the IDE tab did not open.`;
 }
 return `${prefix}Opened ${filename} in Synapse IDE.`;
}

function formatCodeArtifactPanelError(error: unknown): string {
 const message = error instanceof Error ? error.message : String(error);
 if (/exceeds \d+ bytes|exceeds .*bytes/i.test(message)) {
 return `size-rejected: ${message}`;
 }
 return `Code artifact request failed: ${message}`;
}

function ArtifactLinks({
 artifacts,
 onOpenFlow,
}: {
 artifacts: DossierArtifactLink[];
 onOpenFlow: (flowId: string) => void;
}) {
 if (artifacts.length === 0) {
 return (
 <div className="rp-truth-state">
 <strong>No linked evidence artifacts</strong>
 <span>This card has no direct artifact reference in the Urban evidence registry yet.</span>
 </div>
 );
 }

 return (
 <ul className="rp-artifact-list">
 {artifacts.map((artifact) => {
 return (
 <li key={artifact.id} className="rp-artifact-item">
 <div className="rp-artifact-main">
 <span className="rp-artifact-title">{artifact.title}</span>
 <span className="rp-artifact-meta">
 {artifact.kind.replace(/-/g, ' ')} · {artifact.sourceModule} · QA {artifact.qaState}
 </span>
 <span className="rp-artifact-detail">{artifact.detail}</span>
 {artifact.linkedLayerIds.length > 0 ? (
 <span className="rp-artifact-refs">Layers: {artifact.linkedLayerIds.join(', ')}</span>
 ) : null}
 {artifact.linkedFilePaths.length > 0 ? (
 <span className="rp-artifact-refs">Files: {artifact.linkedFilePaths.join(', ')}</span>
 ) : null}
 </div>
 <span className={badgeClass(artifact.state === 'invalid' || artifact.state === 'blocked' ? 'blocked' : 'neutral')}>
 {artifact.state}
 </span>
 {artifact.flowId ? (
 <button
 className="rp-btn rp-btn--xs"
 onClick={() => onOpenFlow(artifact.flowId)}
 title={`Open workflow ${artifact.flowId}`}
 >
 Open Flow
 </button>
 ) : null}
 </li>
 );
 })}
 </ul>
 );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RightPanelFourBlock({ card, onClose }: RightPanelFourBlockProps) {
 // --- State ---
 const [tab, setTab] = useState<PanelTab>(
 () => loadLS<PanelTab>(LS_KEYS.tab, 'methodology'),
 );
 const [density, setDensity] = useState<Density>(
 () => loadLS<Density>(LS_KEYS.density, 'comfort'),
 );
 const [renderMode, _setRenderMode] = useState<RenderMode>(
 () => loadLS<RenderMode>(LS_KEYS.renderMode, 'inline'),
 );
 const [refQuery, setRefQuery] = useState('');
 const [lastCopied, setLastCopied] = useState<string | null>(null);
 const [codeArtifactStatus, setCodeArtifactStatus] = useState<string | null>(null);

 const panelRef = useRef<HTMLDivElement>(null);
 const evidenceArtifacts = useUrbanEvidenceArtifacts();
 const contextSummary = useUrbanContextSummary();

 // --- Persist prefs ---
 useEffect(() => { saveLS(LS_KEYS.tab, tab); }, [tab]);
 useEffect(() => { saveLS(LS_KEYS.density, density); }, [density]);
 useEffect(() => { saveLS(LS_KEYS.renderMode, renderMode); }, [renderMode]);

 // --- Assemble content ---
 const assembled: Assembled | null = useMemo(() => {
 if (!card) return null;
 try {
 return assembleFourBlock(card);
 } catch (err) {
 console.error('[RightPanel] assembleFourBlock threw:', err, 'card:', card.id);
 return null;
 }
 }, [card]);

 const dossier = useMemo(() => {
 if (!card || !assembled) return null;
 return buildScientificDossier(card, assembled, evidenceArtifacts);
 }, [assembled, card, evidenceArtifacts]);

 const methodologyText = useMemo(() => {
 if (!assembled) return '';
 return extractPlainText(assembled.info);
 }, [assembled]);

 const codeText = useMemo(() => {
 if (!assembled) return '';
 return assembled.commands.map((c) => c.text).join('\n\n').trim();
 }, [assembled]);

 // --- Keyboard handler ---
 useEffect(() => {
 const handler = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && onClose) {
 e.preventDefault();
 onClose();
 return;
 }
 if (e.altKey) {
 const tabKeys: Record<string, PanelTab> = {
 '1': 'methodology',
 '2': 'data',
 '3': 'code',
 '4': 'references',
 };
 if (tabKeys[e.key]) {
 e.preventDefault();
 setTab(tabKeys[e.key]);
 }
 if (e.key === 'd') {
 e.preventDefault();
 setDensity((d) => (d === 'compact' ? 'comfort' : 'compact'));
 }
 }
 };
 const el = panelRef.current;
 el?.addEventListener('keydown', handler);
 return () => el?.removeEventListener('keydown', handler);
 }, [onClose]);

 // --- Copy helper ---
 const copyToClipboard = useCallback((text: string, label: string) => {
 navigator.clipboard.writeText(text).then(() => {
 setLastCopied(label);
 setTimeout(() => setLastCopied(null), 2000);
 }).catch(() => { /* clipboard permission denied */ });
 }, []);

 const openWorkflow = useCallback((flowId: string) => {
 window.dispatchEvent(new CustomEvent('synapse:navigate', {
 detail: { tab: 'Workflows', flowId },
 }));
 }, []);

 const openMethodCodeArtifact = useCallback(async () => {
 if (!card) {
 setCodeArtifactStatus('No active method context.');
 return;
 }
 try {
 const { request, result } = await buildAndDispatchPythonScript(buildSeedFromMethodCard(card));
 setCodeArtifactStatus(formatCodeArtifactPanelStatus(
 request.targetFilename,
 result.bridgeRouted,
 request.safetyNotes,
 ));
 } catch (error) {
 setCodeArtifactStatus(formatCodeArtifactPanelError(error));
 }
 }, [card]);

 const insertMethodReportBlock = useCallback(() => {
 if (!card || !assembled || !methodologyText) return;
 const citationNotes = assembled.references
 .map((ref) => extractPlainText(formatApa(ref)))
 .filter(Boolean);
 const result = enqueueUrbanMethodCardReportBlock({
 card,
 methodSummary: `[${card.title}] ${methodologyText}`,
 citationNotes,
 });
 window.dispatchEvent(new CustomEvent('synapse:navigate', {
 detail: { tab: 'Report' },
 }));
 usePanelBridgeStore.getState().recordInsertedCard(card.id);
 setLastCopied('report');
 setCodeArtifactStatus(`Added structured report block ${result.block.reportInsertId}.`);
 setTimeout(() => setLastCopied(null), 2000);
 }, [assembled, card, methodologyText]);

 // --- Reference filter ---
 const filteredRefs = useMemo(() => {
 if (!assembled) return [];
 if (!refQuery.trim()) return assembled.references;
 const q = refQuery.toLowerCase();
 return assembled.references.filter(
 (r) =>
 (r.title ?? '').toLowerCase().includes(q) ||
 (r.authors?.toLowerCase().includes(q) ?? false),
 );
 }, [assembled, refQuery]);

 // --- Related flow link (card-specific > tag-based) ---
 const relatedFlow = useMemo(() => {
 if (!card) return null;
 // 1. Direct card ID mapping takes precedence
 const direct = CARD_FLOW_MAP[card.id];
 if (direct) return direct;
 // 2. Fallback to tag-based resolution
 if (!card.tags?.length) return null;
 for (const t of card.tags) {
 const hit = TAG_FLOW_MAP[t];
 if (hit) return hit;
 }
 return null;
 }, [card]);

 const learningPath = useMemo(() => {
 if (!card) return null;
 return resolveUrbanLearningPath({
 card,
 flowId: (relatedFlow?.id as AnalyticalFlowId | undefined) ?? null,
 linkedArtifactIds: dossier?.artifacts.map((artifact) => artifact.id) ?? [],
 });
 }, [card, dossier?.artifacts, relatedFlow?.id]);

 const openLearningPath = useCallback(() => {
 if (!card) return;
 openUrbanLearningPath({
 card,
 flowId: (relatedFlow?.id as AnalyticalFlowId | undefined) ?? null,
 linkedArtifactIds: dossier?.artifacts.map((artifact) => artifact.id) ?? [],
 });
 }, [card, dossier?.artifacts, relatedFlow?.id]);

 // --- Empty state ---
 if (!card || !assembled || !dossier) {
 if (import.meta.env.DEV) {
 console.warn('[RightPanel] Empty state hit — card:', card?.id ?? 'null', 'assembled:', !!assembled, 'dossier:', !!dossier);
 }
 return (
 <div className="rp-panel rp-empty" ref={panelRef} tabIndex={-1}>
 <div className="rp-empty-inner">
 <span className="rp-empty-icon" />
 <p className="rp-empty-text">Select a method card to view details</p>
 </div>
 </div>
 );
 }

 return (
 <div
 className={`rp-panel rp-density-${density}`}
 ref={panelRef}
 tabIndex={-1}
 role="region"
 aria-label={`Detail panel for ${card.title}`}
 >

 {/* ---- Header ---- */}
 <header className="rp-header">
 <div className="rp-header-top">
 <h2 className="rp-title">{card.title ?? 'Untitled'}</h2>
 <div className="rp-header-actions">
 <button
 className="rp-btn rp-btn--sm"
 onClick={() => setDensity((d) => (d === 'compact' ? 'comfort' : 'compact'))}
 title={`Switch to ${density === 'compact' ? 'comfort' : 'compact'} mode`}
 aria-label="Toggle density"
 >
 {density === 'compact' ? '▤' : '▥'}
 </button>
 {onClose ? (
 <button
 className="rp-btn rp-btn--close"
 onClick={onClose}
 aria-label="Close detail panel"
 >
 ✕
 </button>
 ) : null}
 </div>
 </div>

 <div className="rp-dossier-strip" aria-label="Scientific dossier status">
 <StatusBadge badge={dossier.capability} />
 <StatusBadge badge={dossier.readiness} />
 <StatusBadge badge={dossier.metadata} />
 <span className="rp-context-chip" title="Card-linked evidence artifacts">
 Evidence {dossier.artifacts.length}
 </span>
 <span className={badgeClass(dossier.dataFitness.tone)} title={dossier.dataFitness.summary}>
 Fitness {dossier.dataFitness.status === 'not-evaluated' ? 'unknown' : dossier.dataFitness.status}
 </span>
 {contextSummary.scale ? (
 <span className="rp-context-chip" title="Active Urban Analytics scale">
 Scale {contextSummary.scale}
 </span>
 ) : null}
 {contextSummary.artifactCount > dossier.artifacts.length ? (
 <span className="rp-context-chip" title="Total Urban evidence artifacts in context">
 Registry {contextSummary.artifactCount}
 </span>
 ) : null}
 </div>

 {/* Tags */}
 {Array.isArray(card.tags) && card.tags.length > 0 ? (
 <div className="rp-tags">
 {card.tags.map((t) => (
 <span key={t} className="rp-tag">{t.replace(/_/g, ' ')}</span>
 ))}
 </div>
 ) : null}

 {/* SDG badges */}
 {Array.isArray(card.sdgAlignment) && card.sdgAlignment.length > 0 ? (
 <div className="rp-sdg-row">
 {card.sdgAlignment.map((sdg) => (
 <span key={sdg} className="rp-sdg-badge">{sdg}</span>
 ))}
 </div>
 ) : null}

 {/* Section breadcrumb */}
 <div className="rp-section-crumb">{(card.sectionId ?? '').replace(/_/g, ' ')}</div>
 </header>

 {/* ---- Tab bar ---- */}
 <div
 className="rp-tabs"
 role="tablist"
 aria-label="Content sections"
 onKeyDown={(e) => {
 const keys = TABS.map((t) => t.key);
 const idx = keys.indexOf(tab);
 if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
 e.preventDefault();
 const next = keys[(idx + 1) % keys.length];
 setTab(next);
 document.getElementById(`rp-tab-${next}`)?.focus();
 } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
 e.preventDefault();
 const prev = keys[(idx - 1 + keys.length) % keys.length];
 setTab(prev);
 document.getElementById(`rp-tab-${prev}`)?.focus();
 } else if (e.key === 'Home') {
 e.preventDefault();
 setTab(keys[0]);
 document.getElementById(`rp-tab-${keys[0]}`)?.focus();
 } else if (e.key === 'End') {
 e.preventDefault();
 setTab(keys[keys.length - 1]);
 document.getElementById(`rp-tab-${keys[keys.length - 1]}`)?.focus();
 }
 }}
 >
 {TABS.map((t) => (
 <button
 key={t.key}
 id={`rp-tab-${t.key}`}
 role="tab"
 className={`rp-tab ${tab === t.key ? 'rp-tab--active' : ''}`}
 onClick={() => setTab(t.key)}
 aria-selected={tab === t.key}
 aria-controls={`rp-tabpanel-${t.key}`}
 tabIndex={tab === t.key ? 0 : -1}
 >
 <span className="rp-tab-icon" aria-hidden="true">{t.icon}</span>
 <span className="rp-tab-label">{t.label}</span>
 </button>
 ))}
 </div>

 {/* ---- Tab panels ---- */}
 <div className="rp-body">
 {/* ====== Methodology ====== */}
 {tab === 'methodology' ? (
 <div
 id="rp-tabpanel-methodology"
 role="tabpanel"
 aria-labelledby="rp-tab-methodology"
 tabIndex={0}
 className="rp-tabpanel"
 >
 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Method summary</h3>
 <StatusBadge badge={dossier.metadata} />
 </div>
 <p className="rp-summary-text">{dossier.methodSummary}</p>
 <KeyValueGrid
 rows={[
 { label: 'Family', value: dossier.methodFamily },
 { label: 'Maturity', value: dossier.maturity },
 ]}
 />
 {dossier.missingMetadata.length > 0 ? (
 <div className="rp-truth-state rp-truth-state--warning">
 <strong>Missing validity metadata</strong>
 <span>{dossier.missingMetadata.join(', ')}</span>
 </div>
 ) : null}
 </section>

 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Validity envelope</h3>
 <StatusBadge badge={dossier.readiness} />
 </div>
 <KeyValueGrid rows={dossier.validity} />
 </section>

 <div className="rp-dossier-columns">
 <DossierList title="Assumptions" items={dossier.assumptions} />
 <DossierList title="Limitations" items={dossier.limitations} tone="warning" />
 <DossierList title="Failure modes" items={dossier.failureModes} tone="blocked" />
 <DossierList title="Interpretation warnings" items={dossier.interpretationWarnings} tone="warning" />
 <DossierList title="Misuse warnings" items={dossier.misuseWarnings} tone="blocked" />
 <DossierList title="Ethical guardrails" items={dossier.ethicalGuardrails} tone="warning" />
 </div>

 {learningPath ? (
 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Learning path handoff</h3>
 <span className="rp-context-chip">Education linked</span>
 </div>
 <KeyValueGrid
 rows={[
 { label: 'Path', value: learningPath.pathTitle ?? 'Education workspace' },
 { label: 'Explainer', value: learningPath.explainerTitle ?? 'Not specified', tone: learningPath.explainerTitle ? 'neutral' : 'unknown' },
 { label: 'Workflow', value: learningPath.reference.workflowId ?? 'No workflow linked', tone: learningPath.reference.workflowId ? 'neutral' : 'unknown' },
 ]}
 />
 <div className="rp-dossier-columns">
 <DossierList title="Concepts" items={learningPath.reference.concepts} />
 <DossierList title="Prerequisites" items={learningPath.reference.prerequisites} />
 <DossierList
 title="Teaching steps"
 items={learningPath.reference.teachingSteps.map((step) => `${step.title}: ${step.note}`)}
 tone="warning"
 />
 <DossierList title="Interpretation prompts" items={learningPath.reference.interpretationPrompts} tone="warning" />
 </div>
 </section>
 ) : null}

 {assembled.info ? (
 <section className="rp-dossier-section">
 <h3>Card notes</h3>
 <div
 className="rp-info-content"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(assembled.info) }}
 />
 </section>
 ) : null}

 {relatedFlow ? (
 <div className="rp-related-flow">
 <button
 className="rp-btn rp-btn--flow-link"
 onClick={() => openWorkflow(relatedFlow.id)}
 title={`Open ${relatedFlow.label} workflow`}
 >
 Open Related Flow: {relatedFlow.label}
 </button>
 </div>
 ) : null}
 </div>
 ) : null}

 {/* ====== Data Requirements ====== */}
 {tab === 'data' ? (
 <div
 id="rp-tabpanel-data"
 role="tabpanel"
 aria-labelledby="rp-tab-data"
 tabIndex={0}
 className="rp-tabpanel"
 >
 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Required inputs</h3>
 <StatusBadge badge={dossier.capability} />
 </div>
 <KeyValueGrid rows={dossier.requiredInputs} />
 </section>

 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Data fitness</h3>
 <span className={badgeClass(dossier.dataFitness.tone)}>
 {dossier.dataFitness.status === 'not-evaluated' ? 'Not evaluated' : dossier.dataFitness.status}
 </span>
 </div>
 <div className="rp-fitness-score">
 <span>Grade {dossier.dataFitness.grade}</span>
 <span>Score {dossier.dataFitness.score}</span>
 </div>
 <p className="rp-summary-text">{dossier.dataFitness.summary}</p>
 {dossier.dataFitness.sourceLayerIds.length > 0 || dossier.dataFitness.sourceRunIds.length > 0 ? (
 <div className="rp-artifact-refs">
 {dossier.dataFitness.sourceLayerIds.length > 0 ? (
 <span>Source layers: {dossier.dataFitness.sourceLayerIds.join(', ')}</span>
 ) : null}
 {dossier.dataFitness.sourceRunIds.length > 0 ? (
 <span>Source runs: {dossier.dataFitness.sourceRunIds.join(', ')}</span>
 ) : null}
 </div>
 ) : null}
 <DossierList
 title="Fitness caveats"
 items={dossier.dataFitness.issues}
 tone={dossier.dataFitness.tone}
 />
 </section>

 {assembled.examples.length > 0 ? (
 <section className="rp-dossier-section">
 <h3>Data guidance</h3>
 <div className="rp-data-blocks">
 {assembled.examples.map((ex: ExampleVariant) => (
 <div key={ex.id} className="rp-data-block">
 <h4 className="rp-data-block-title">{ex.label}</h4>
 <div
 className="rp-data-block-body"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(ex.html) }}
 />
 </div>
 ))}
 </div>
 </section>
 ) : (
 <div className="rp-data-block">
 <h4 className="rp-data-block-title">Analytical Prerequisites</h4>
 <div className="rp-data-block-body">
 <ul>
 <li>Study boundary and coordinate reference system.</li>
 <li>Source vintage, schema, and quality notes for each input layer.</li>
 <li>Documented assumptions for thresholds, joins, and aggregation units.</li>
 </ul>
 </div>
 </div>
 )}
 </div>
 ) : null}

 {/* ====== Python Code ====== */}
 {tab === 'code' ? (
 <div
 id="rp-tabpanel-code"
 role="tabpanel"
 aria-labelledby="rp-tab-code"
 tabIndex={0}
 className="rp-tabpanel"
 >
 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Reproducibility state</h3>
 <div className="rp-heading-actions">
 <span className={badgeClass(dossier.codeArtifactCount > 0 ? 'ready' : 'unknown')}>
 {dossier.codeArtifactCount > 0 ? `${dossier.codeArtifactCount} code artifact(s)` : 'No linked code artifact'}
 </span>
 <button
 className="rp-btn rp-btn--xs"
 disabled={!card}
 onClick={() => void openMethodCodeArtifact()}
 title={card ? 'Open a method-card Python scaffold in Synapse IDE' : 'No active method context'}
 >
 Open code artifact in IDE
 </button>
 </div>
 </div>
 <KeyValueGrid
 rows={[
 { label: 'Method id', value: card.id },
 { label: 'Capability', value: dossier.capability.label, tone: dossier.capability.tone },
 { label: 'Readiness', value: dossier.readiness.label, tone: dossier.readiness.tone },
 { label: 'Evidence refs', value: dossier.artifacts.length > 0 ? dossier.artifacts.map((artifact) => artifact.id).join(', ') : 'No linked artifacts.', tone: dossier.artifacts.length > 0 ? 'neutral' : 'unknown' },
 { label: 'Dependencies', value: card.tools?.length ? card.tools.join(', ') : 'No dependency list declared.', tone: card.tools?.length ? 'neutral' : 'unknown' },
 ]}
 />
 <pre className="rp-manifest-preview">{JSON.stringify({
 methodId: card.id,
 capability: dossier.capability.detail ?? dossier.capability.label,
 readiness: dossier.readiness.detail ?? dossier.readiness.label,
 evidenceArtifactIds: dossier.artifacts.map((artifact) => artifact.id),
 linkedCodeArtifactCount: dossier.codeArtifactCount,
 }, null, 2)}</pre>
 {codeArtifactStatus ? (
 <p className="rp-action-status" role="status" aria-live="polite">
 {codeArtifactStatus}
 </p>
 ) : null}
 </section>

 {assembled.commands.length > 0 ? (
 <section className="rp-dossier-section">
 <h3>Script and prompt snippets</h3>
 <div className="rp-prompts-grid">
 {assembled.commands.map((cmd, i) => (
 <div key={i} className="rp-prompt-card">
 {cmd.intent ? (
 <div className="rp-prompt-intent">{cmd.intent.replace(/-/g, ' ')}</div>
 ) : null}
 <pre className="rp-prompt-code">{cmd.text}</pre>
 <div className="rp-prompt-actions">
 <button
 className="rp-btn rp-btn--xs"
 onClick={() => copyToClipboard(cmd.text, `cmd-${i}`)}
 aria-label="Copy to clipboard"
 >
 {lastCopied === `cmd-${i}` ? '✓ Copied' : 'Copy'}
 </button>
 </div>
 </div>
 ))}
 </div>
 </section>
 ) : (
 <div className="rp-prompts-grid">
 <div className="rp-prompt-card">
 <pre className="rp-prompt-code">{`# Analytical starter scaffold
import geopandas as gpd

study_area = gpd.read_file("study_area.geojson")
inputs = {}

# Record CRS, time window, thresholds, and validation sources before publishing outputs.
print("Review assumptions before interpreting results.")`}</pre>
 </div>
 </div>
 )}
 </div>
 ) : null}

 {/* ====== References ====== */}
 {tab === 'references' ? (
 <div
 id="rp-tabpanel-references"
 role="tabpanel"
 aria-labelledby="rp-tab-references"
 tabIndex={0}
 className="rp-tabpanel"
 >
 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>Evidence artifacts</h3>
 <span className="rp-context-chip">{dossier.artifacts.length} linked</span>
 </div>
 <ArtifactLinks artifacts={dossier.artifacts} onOpenFlow={openWorkflow} />
 </section>

 <section className="rp-dossier-section">
 <div className="rp-section-heading">
 <h3>References</h3>
 <StatusBadge badge={dossier.referencesStatus} />
 </div>
 {assembled.references.length > 0 ? (
 <>
 <div className="rp-ref-search">
 <input
 type="text"
 className="rp-ref-input"
 placeholder="Filter references…"
 value={refQuery}
 onChange={(e) => setRefQuery(e.target.value)}
 aria-label="Filter references"
 />
 </div>
 <ul className="rp-refs-list">
 {filteredRefs.map((ref: RefLite, i: number) => (
 <li key={i} className="rp-ref-item">
 <span
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatApa(ref)) }}
 />
 </li>
 ))}
 </ul>
 {filteredRefs.length === 0 ? (
 <p className="rp-placeholder">No matching references.</p>
 ) : null}
 </>
 ) : (
 <div className="rp-truth-state">
 <strong>No reference records</strong>
 <span>No citation list is registered for this card.</span>
 </div>
 )}
 </section>
 </div>
 ) : null}
 </div>

 {/* ---- Action bar ---- */}
 <footer className="rp-actions">
 {relatedFlow ? (
 <button
 className="rp-btn rp-btn--action"
 onClick={() => openWorkflow(relatedFlow.id)}
 title={`Open ${relatedFlow.label} workflow`}
 >
 Open Flow
 </button>
 ) : null}
 <button
 className="rp-btn rp-btn--action"
 disabled={!learningPath}
 onClick={openLearningPath}
 title={learningPath ? 'Open the linked Education learning path for this method.' : 'No education learning path is registered for this method yet.'}
 aria-label={learningPath ? 'Open learning path' : 'Open learning path (unavailable: no learning path registered)'}
 >
 Open learning path
 </button>
 <button
 className="rp-btn rp-btn--action rp-btn--accent"
 disabled={!methodologyText}
 onClick={insertMethodReportBlock}
 title={methodologyText ? 'Insert structured evidence block into Report' : 'No methodology text available'}
 >
 {lastCopied === 'report' ? 'Inserted' : 'To Report'}
 </button>
 <button
 className="rp-btn rp-btn--action"
 disabled={!methodologyText}
 onClick={() =>
 copyToClipboard(methodologyText, 'full')
 }
 title={methodologyText ? 'Copy card content' : 'No methodology text available'}
 >
 {lastCopied === 'full' ? 'Copied' : 'Copy'}
 </button>
 <button
 className="rp-btn rp-btn--action"
 disabled={!assembled.info}
 onClick={() => {
 const w = window.open('', '_blank');
 if (w) {
 w.document.write(generatePageDoc(assembled.info, card.title));
 w.document.close();
 }
 }}
 title={assembled.info ? 'Preview as page' : 'No page preview content available'}
 >
 Print
 </button>
 <button
 className="rp-btn rp-btn--action"
 disabled={!codeText}
 onClick={() =>
 copyToClipboard(codeText, 'code')
 }
 title={codeText ? 'Copy all code snippets' : 'No code snippets available'}
 >
 {lastCopied === 'code' ? 'Copied' : 'Code'}
 </button>
 </footer>
 </div>
 );
}

// ---------------------------------------------------------------------------
// Error boundary wrapper
// ---------------------------------------------------------------------------

interface BoundaryState {
 hasError: boolean;
}

class RightPanelErrorBoundary extends React.Component<
 { children: React.ReactNode },
 BoundaryState
> {
 override state: BoundaryState = { hasError: false };

 static getDerivedStateFromError(): BoundaryState {
 return { hasError: true };
 }

 override componentDidCatch(error: unknown, info: React.ErrorInfo) {
 console.error('[RightPanelErrorBoundary]', error, info.componentStack);
 }

 override render() {
 if (this.state.hasError) {
 return (
 <div className="rp-panel rp-empty">
 <div className="rp-empty-inner">
 <span className="rp-empty-icon" />
 <p className="rp-empty-text">Something went wrong rendering this panel.</p>
 <button
 className="rp-btn rp-btn--action"
 onClick={() => this.setState({ hasError: false })}
 >
 Retry
 </button>
 </div>
 </div>
 );
 }
 return this.props.children;
 }
}

export function RightPanelBoundary(props: RightPanelFourBlockProps) {
 return (
 <RightPanelErrorBoundary>
 <RightPanelFourBlock {...props} />
 </RightPanelErrorBoundary>
 );
}

export default RightPanelFourBlock;
