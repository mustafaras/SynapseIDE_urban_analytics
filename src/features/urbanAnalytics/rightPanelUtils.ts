/**
 * Urban Analytics Workbench — Right Panel Utilities
 *
 * Provides urban-domain right-panel utility logic.
 * Provides localStorage helpers, HTML sanitisation, page-document generation,
 * pack registry, content normalisation, and the assembleFourBlock orchestrator.
 */

import { SECTION_INDEX } from './lib/sectionHierarchy';
import type {
  Card,
  UrbanDataFitnessProfile,
  UrbanDataFitnessStatus,
  UrbanEvidenceArtifact,
  UrbanEvidenceQAState,
  UrbanEvidenceScalar,
  UrbanMethodCapabilityStatus,
  UrbanMethodReadinessStatus,
  UrbanMethodValidityEnvelope,
} from './lib/types';
import { validateUrbanMethodMetadata } from './context/methodValidity';
import type { NormalizedBlock, RPBundle } from './rightPanelTypes';
import { buildFullLibrary } from './seeds';

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

export const LS_KEYS = {
  tab: 'urban.preview.tab',
  width: 'urban.preview.width',
  density: 'urban.preview.density',
  renderMode: 'urban.preview.renderMode',
} as const;

export function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

// ---------------------------------------------------------------------------
// HTML sanitiser (allowlist-based)
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'div', 'pre',
  'code', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'sup', 'sub', 'abbr', 'details', 'summary', 'dl', 'dt', 'dd',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'target', 'rel', 'class', 'id', 'title', 'aria-label',
  'role', 'data-id', 'colspan', 'rowspan',
]);

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node): void => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          el.replaceWith(...Array.from(el.childNodes));
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          if (!ALLOWED_ATTRS.has(attr.name)) {
            el.removeAttribute(attr.name);
          }
        }
        const href = el.getAttribute('href');
        if (href && /^\s*javascript:/i.test(href)) {
          el.removeAttribute('href');
        }
        walk(el);
      }
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

// ---------------------------------------------------------------------------
// Plain-text extraction
// ---------------------------------------------------------------------------

export function extractPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Page document wrapper (for preview / print)
// ---------------------------------------------------------------------------

export function generatePageDoc(innerHtml: string, title = 'Urban Analytics Preview'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title.replace(/</g, '&lt;')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #000000; color: #FAFAF9;
      padding: 32px; line-height: 1.6;
    }
    h1, h2, h3, h4 { color: #F59E0B; margin-bottom: 8px; }
    a { color: #FCD34D; }
    code { background: #1A1A1A; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1A1A1A; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #3A3A3A; padding: 8px 12px; text-align: left; }
    th { background: #1A1A1A; color: #F59E0B; }
    @media print {
      body { background: #fff; color: #111; }
      h1, h2, h3, h4 { color: #D97706; }
      th { background: #f5f5f4; color: #D97706; }
    }
  </style>
</head>
<body>${innerHtml}</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Core assembler types
// ---------------------------------------------------------------------------

export type RefLite = {
  title: string;
  year?: string;
  journal?: string;
  kind?: string;
  authors?: string;
};

export type CmdLite = {
  text: string;
  intent?: string;
};

export type ExampleVariant = {
  id: string;
  label: string;
  html: string;
};

export type Assembled = {
  info: string;
  examples: ExampleVariant[];
  defaultExampleId: string | null;
  references: RefLite[];
  commands: CmdLite[];
};

// ---------------------------------------------------------------------------
// Scientific dossier helpers (Prompt 10)
// ---------------------------------------------------------------------------

export type DossierTone = 'ready' | 'warning' | 'blocked' | 'unknown' | 'neutral' | 'demo';

export interface DossierBadge {
  label: string;
  tone: DossierTone;
  detail?: string;
}

export interface DossierKeyValue {
  label: string;
  value: string;
  tone?: DossierTone;
}

export interface DossierArtifactLink {
  id: string;
  title: string;
  kind: string;
  state: string;
  qaState: UrbanEvidenceQAState;
  sourceModule: string;
  detail: string;
  flowId?: string;
  linkedLayerIds: string[];
  linkedFilePaths: string[];
}

export interface DossierDataFitnessSummary {
  status: UrbanDataFitnessStatus | 'not-evaluated';
  grade: string;
  score: string;
  tone: DossierTone;
  summary: string;
  issues: string[];
  sourceLayerIds: string[];
  sourceRunIds: string[];
}

export interface ScientificDossier {
  methodSummary: string;
  methodFamily: string;
  maturity: string;
  capability: DossierBadge;
  readiness: DossierBadge;
  metadata: DossierBadge;
  missingMetadata: string[];
  validity: DossierKeyValue[];
  requiredInputs: DossierKeyValue[];
  assumptions: string[];
  limitations: string[];
  failureModes: string[];
  interpretationWarnings: string[];
  misuseWarnings: string[];
  ethicalGuardrails: string[];
  referencesStatus: DossierBadge;
  references: RefLite[];
  artifacts: DossierArtifactLink[];
  dataFitness: DossierDataFitnessSummary;
  codeArtifactCount: number;
}

const CAPABILITY_LABELS: Record<UrbanMethodCapabilityStatus, string> = {
  implemented: 'Implemented',
  demo_mode: 'Demo mode',
  residual_gap: 'Residual gap',
  environment_dependent: 'Environment dependent',
  deferred: 'Deferred',
};

const CAPABILITY_TONES: Record<UrbanMethodCapabilityStatus, DossierTone> = {
  implemented: 'ready',
  demo_mode: 'demo',
  residual_gap: 'blocked',
  environment_dependent: 'warning',
  deferred: 'unknown',
};

const READINESS_LABELS: Record<UrbanMethodReadinessStatus, string> = {
  ready: 'Ready',
  'ready-with-caveats': 'Ready with caveats',
  'needs-context': 'Needs context',
  blocked: 'Blocked',
  'demo-only': 'Demo only',
};

const READINESS_TONES: Record<UrbanMethodReadinessStatus, DossierTone> = {
  ready: 'ready',
  'ready-with-caveats': 'warning',
  'needs-context': 'unknown',
  blocked: 'blocked',
  'demo-only': 'demo',
};

const FITNESS_TONES: Record<UrbanDataFitnessStatus | 'not-evaluated', DossierTone> = {
  ready: 'ready',
  warning: 'warning',
  blocked: 'blocked',
  unknown: 'unknown',
  'not-evaluated': 'unknown',
};

function formatListValue(values: readonly string[] | undefined, missingText: string): string {
  if (!values || values.length === 0) {
    return missingText;
  }
  return values.map((value) => humanizeId(String(value))).join(', ');
}

function formatBooleanRequirement(value: boolean | undefined, missingText: string): string {
  if (value === true) return 'Projected CRS required';
  if (value === false) return 'Projected CRS not explicitly required';
  return missingText;
}

function buildValidityRows(
  envelope: UrbanMethodValidityEnvelope,
  hasAuthoredEnvelope: boolean,
): DossierKeyValue[] {
  if (!hasAuthoredEnvelope) {
    return [
      {
        label: 'Validity envelope',
        value: 'Not specified for this card.',
        tone: 'unknown',
      },
    ];
  }

  const rows: DossierKeyValue[] = [
    {
      label: 'Valid scales',
      value: formatListValue(envelope.validSpatialScales, 'Spatial scale not specified.'),
      tone: envelope.validSpatialScales.length > 0 ? 'neutral' : 'unknown',
    },
    {
      label: 'Recommended scales',
      value: formatListValue(envelope.recommendedScales, 'Recommended scale not specified.'),
      tone: envelope.recommendedScales?.length ? 'neutral' : 'unknown',
    },
    {
      label: 'Geometry',
      value: formatListValue(envelope.requiredGeometryTypes, 'Geometry type not specified.'),
      tone: envelope.requiredGeometryTypes?.length ? 'neutral' : 'unknown',
    },
    {
      label: 'CRS',
      value: envelope.requiredCrs?.length
        ? envelope.requiredCrs.join(', ')
        : formatBooleanRequirement(envelope.requiresProjectedCrs, 'CRS requirement not specified.'),
      tone: envelope.requiredCrs?.length || envelope.requiresProjectedCrs !== undefined ? 'neutral' : 'unknown',
    },
    {
      label: 'Temporal structure',
      value: envelope.requiredTemporalStructure
        ? humanizeId(envelope.requiredTemporalStructure)
        : 'Temporal structure not specified.',
      tone: envelope.requiredTemporalStructure ? 'neutral' : 'unknown',
    },
    {
      label: 'Minimum sample',
      value: envelope.minimumFeatureCount != null
        ? `${envelope.minimumFeatureCount.toLocaleString()} feature(s)`
        : 'Minimum feature count not specified.',
      tone: envelope.minimumFeatureCount != null ? 'neutral' : 'unknown',
    },
  ];

  return rows;
}

function buildRequiredInputRows(
  envelope: UrbanMethodValidityEnvelope,
  hasAuthoredEnvelope: boolean,
): DossierKeyValue[] {
  if (!hasAuthoredEnvelope) {
    return [
      {
        label: 'Formal requirements',
        value: 'Required input metadata has not been specified for this method.',
        tone: 'unknown',
      },
    ];
  }

  const rows: DossierKeyValue[] = [
    {
      label: 'Data types',
      value: formatListValue(envelope.requiredDataTypes, 'Required data types not specified.'),
      tone: envelope.requiredDataTypes.length > 0 ? 'neutral' : 'unknown',
    },
    {
      label: 'Required fields',
      value: envelope.requiredFields.length > 0
        ? envelope.requiredFields.join(', ')
        : 'No required fields declared.',
      tone: envelope.requiredFields.length > 0 ? 'neutral' : 'unknown',
    },
    {
      label: 'CRS assumptions',
      value: envelope.crsAssumptions.length > 0
        ? envelope.crsAssumptions.join(' ')
        : 'CRS assumptions not specified.',
      tone: envelope.crsAssumptions.length > 0 ? 'neutral' : 'unknown',
    },
    {
      label: 'Temporal assumptions',
      value: envelope.temporalAssumptions.length > 0
        ? envelope.temporalAssumptions.join(' ')
        : 'Temporal assumptions not specified.',
      tone: envelope.temporalAssumptions.length > 0 ? 'neutral' : 'unknown',
    },
  ];

  return rows;
}

function summarizeDataFitness(profile: UrbanDataFitnessProfile | null): DossierDataFitnessSummary {
  if (!profile) {
    return {
      status: 'not-evaluated',
      grade: 'Unknown',
      score: 'Unknown',
      tone: 'unknown',
      summary: 'No card-linked data fitness profile is available. Do not treat current data as ready for this method.',
      issues: ['Data fitness has not been evaluated for this card.'],
      sourceLayerIds: [],
      sourceRunIds: [],
    };
  }

  const issues = [
    ...profile.blockedReasons,
    ...profile.missingInputs.map((input) => `Missing metadata: ${input}.`),
    ...profile.uncertaintyNotes,
    ...profile.issues.map((issue) => issue.message),
  ].filter(Boolean);

  return {
    status: profile.status,
    grade: profile.grade === 'unknown' ? 'Unknown' : profile.grade,
    score: profile.score == null ? 'Unknown' : `${profile.score}/100`,
    tone: FITNESS_TONES[profile.status],
    summary: `Data fitness is ${profile.status}; grade ${profile.grade === 'unknown' ? 'unknown' : profile.grade}, score ${profile.score == null ? 'unknown' : profile.score}.`,
    issues: uniqByText(issues).slice(0, 8),
    sourceLayerIds: profile.sourceLayerIds,
    sourceRunIds: profile.sourceRunIds,
  };
}

function metadataBadge(status: 'complete' | 'partial' | 'missing'): DossierBadge {
  if (status === 'complete') {
    return { label: 'Metadata complete', tone: 'ready' };
  }
  if (status === 'partial') {
    return { label: 'Metadata partial', tone: 'warning' };
  }
  return {
    label: 'Metadata missing',
    tone: 'unknown',
    detail: 'Missing metadata is shown as unknown, not readiness.',
  };
}

function capabilityBadge(status: UrbanMethodCapabilityStatus): DossierBadge {
  return {
    label: CAPABILITY_LABELS[status],
    tone: CAPABILITY_TONES[status],
    detail: status,
  };
}

function readinessBadge(status: UrbanMethodReadinessStatus): DossierBadge {
  return {
    label: READINESS_LABELS[status],
    tone: READINESS_TONES[status],
    detail: status,
  };
}

function referencesBadge(card: Card, references: readonly RefLite[]): DossierBadge {
  if (card.evidence?.length) {
    return {
      label: `${references.length} card reference${references.length === 1 ? '' : 's'}`,
      tone: 'ready',
    };
  }
  if (references.length > 0) {
    return {
      label: 'General references only',
      tone: 'warning',
      detail: 'No card-specific citation list is registered.',
    };
  }
  return {
    label: 'No references',
    tone: 'unknown',
    detail: 'No citation records are available for this card.',
  };
}

function scalarToText(value: UrbanEvidenceScalar): string {
  if (value === null) return 'null';
  return String(value);
}

function artifactDetail(artifact: UrbanEvidenceArtifact): string {
  const details: string[] = [];
  if (artifact.linkedRunId) details.push(`Run ${artifact.linkedRunId}`);
  if (artifact.flowId) details.push(`Flow ${artifact.flowId}`);
  if (artifact.mapLayerId) details.push(`Layer ${artifact.mapLayerId}`);
  if (artifact.codeArtifactId) details.push(`Code ${artifact.codeArtifactId}`);
  if (artifact.reportInsertId) details.push(`Report ${artifact.reportInsertId}`);
  if (artifact.dashboardBindingId) details.push(`Dashboard ${artifact.dashboardBindingId}`);
  if (artifact.educationLinkId) details.push(`Education ${artifact.educationLinkId}`);
  if (artifact.metadata) {
    const metadata = Object.entries(artifact.metadata)
      .slice(0, 3)
      .map(([key, value]) => `${humanizeId(key)} ${scalarToText(value)}`);
    details.push(...metadata);
  }
  return details.join(' · ') || artifact.provenance.notes || 'Lightweight evidence reference';
}

function artifactMatchesCard(artifact: UrbanEvidenceArtifact, card: Card): boolean {
  return (
    artifact.cardId === card.id ||
    artifact.sourceId === card.id ||
    artifact.provenance.methodId === card.id ||
    artifact.linkedArtifactIds.includes(card.id)
  );
}

function relatedArtifactsForCard(
  card: Card,
  artifacts: readonly UrbanEvidenceArtifact[],
): DossierArtifactLink[] {
  return artifacts
    .filter((artifact) => artifactMatchesCard(artifact, card))
    .sort((left, right) => {
      if (right.updatedAt !== left.updatedAt) return right.updatedAt.localeCompare(left.updatedAt);
      return left.id.localeCompare(right.id);
    })
    .slice(0, 8)
    .map((artifact) => {
      const link: DossierArtifactLink = {
        id: artifact.id,
        title: artifact.title,
        kind: artifact.kind,
        state: artifact.state,
        qaState: artifact.qa.state,
        sourceModule: artifact.sourceModule,
        detail: artifactDetail(artifact),
        linkedLayerIds: artifact.linkedLayerIds,
        linkedFilePaths: artifact.linkedFilePaths,
      };
      if (artifact.flowId) link.flowId = artifact.flowId;
      return link;
    });
}

function firstDataFitnessProfile(
  card: Card,
  artifacts: readonly UrbanEvidenceArtifact[],
): UrbanDataFitnessProfile | null {
  const related = artifacts
    .filter((artifact) => artifactMatchesCard(artifact, card) && artifact.dataFitness)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return related[0]?.dataFitness ?? null;
}

function normalizeDossierList(items: readonly string[] | undefined, missingText: string): string[] {
  if (!items || items.length === 0) {
    return [missingText];
  }
  return items.map((item) => stripPlaceholders(item)).filter(Boolean);
}

export function buildScientificDossier(
  card: Card,
  assembled: Assembled,
  artifacts: readonly UrbanEvidenceArtifact[] = [],
): ScientificDossier {
  const validation = validateUrbanMethodMetadata({
    id: card.id,
    title: card.title,
    sourceKind: 'method-card',
    ...(card.validityEnvelope ? { validityEnvelope: card.validityEnvelope } : {}),
    ...(card.capabilityStatus ? { capabilityStatus: card.capabilityStatus } : {}),
  });
  const hasAuthoredEnvelope = Boolean(card.validityEnvelope);
  const envelope = validation.envelope;
  const methodSummary = stripPlaceholders(card.summary) || firstSentence(extractPlainText(assembled.info));
  const relatedArtifacts = relatedArtifactsForCard(card, artifacts);
  const dataFitness = summarizeDataFitness(firstDataFitnessProfile(card, artifacts));

  return {
    methodSummary: methodSummary || 'No method summary has been authored for this card.',
    methodFamily: humanizeId(envelope.methodFamily),
    maturity: humanizeId(envelope.maturityLevel),
    capability: capabilityBadge(validation.capabilityStatus),
    readiness: readinessBadge(validation.readinessStatus),
    metadata: metadataBadge(validation.status),
    missingMetadata: validation.missingFields,
    validity: buildValidityRows(envelope, hasAuthoredEnvelope),
    requiredInputs: buildRequiredInputRows(envelope, hasAuthoredEnvelope),
    assumptions: normalizeDossierList(envelope.assumptions, 'Method assumptions have not been specified.'),
    limitations: normalizeDossierList(envelope.limitations, 'Validity limits have not been specified.'),
    failureModes: normalizeDossierList(envelope.failureModes, 'Failure modes have not been specified.'),
    interpretationWarnings: normalizeDossierList(
      envelope.interpretationWarnings,
      'Interpretation warnings have not been specified.',
    ),
    misuseWarnings: normalizeDossierList(envelope.misuseWarnings, 'Misuse warnings have not been specified.'),
    ethicalGuardrails: normalizeDossierList(envelope.ethicalGuardrails, 'No method-specific ethical guardrails registered.'),
    referencesStatus: referencesBadge(card, assembled.references),
    references: assembled.references,
    artifacts: relatedArtifacts,
    dataFitness,
    codeArtifactCount: relatedArtifacts.filter((artifact) => artifact.kind === 'code-artifact').length,
  };
}

// ---------------------------------------------------------------------------
// Pack registry
// ---------------------------------------------------------------------------

export type RightPanelPackCtx = { card: Card };
export type RightPanelPackResult = Assembled;
export type RightPanelPackBuilder = (ctx: RightPanelPackCtx) => RightPanelPackResult;

const __packRegistry = new Map<string, RightPanelPackBuilder>();
const RIGHT_PANEL_LIBRARY = buildFullLibrary();
const GENERIC_REFERENCE_FALLBACKS = [
  'UN-Habitat. Global Urban Monitoring Framework.',
  'OECD. A Territorial Approach to the Sustainable Development Goals.',
];

export function registerRightPanelPack(key: string, builder: RightPanelPackBuilder): void {
  __packRegistry.set(key, builder);
}

export function getRightPanelPack(key: string): RightPanelPackBuilder | undefined {
  return __packRegistry.get(key);
}

// ---------------------------------------------------------------------------
// Deduplication & text helpers
// ---------------------------------------------------------------------------

export function uniqByText(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    const lower = s.toLowerCase().trim();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

export function stripPlaceholders(text: string): string {
  return text.replace(/\[placeholder\]/gi, '').trim();
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
}

function humanizeId(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getSectionLabel(sectionId: string): string {
  return SECTION_INDEX.get(sectionId)?.label ?? humanizeId(sectionId);
}

function firstSentence(text: string): string {
  const cleaned = stripPlaceholders(text).replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }
  const match = cleaned.match(/.+?(?:[.!?](?=\s|$)|$)/);
  return match?.[0]?.trim() ?? cleaned;
}

function buildListHtml(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function sharedTagCount(left: Card, right: Card): number {
  const rightTags = new Set((right.tags ?? []).map((tag) => String(tag).toLowerCase()));
  return (left.tags ?? []).reduce((count, tag) => {
    return count + (rightTags.has(String(tag).toLowerCase()) ? 1 : 0);
  }, 0);
}

function getRelatedCards(card: Card, limit = 6): Card[] {
  return RIGHT_PANEL_LIBRARY
    .filter((candidate) => candidate.id !== card.id)
    .map((candidate) => {
      const sameSection = candidate.sectionId === card.sectionId ? 8 : 0;
      const sharedTags = sharedTagCount(card, candidate);
      return { candidate, score: sameSection + sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.candidate.title.localeCompare(right.candidate.title);
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

function collectUniqueFromCards(
  cards: Card[],
  pick: (card: Card) => string[] | undefined,
  limit = 6,
): string[] {
  return uniqByText(
    cards
      .flatMap((candidate) => pick(candidate) ?? [])
      .map((value) => stripPlaceholders(value))
      .filter(Boolean),
  ).slice(0, limit);
}

function buildGenericRequirements(card: Card, sectionLabel: string): string[] {
  const focusTags = (card.tags ?? [])
    .slice(0, 3)
    .map((tag) => humanizeId(String(tag).toLowerCase()))
    .join(', ');

  const requirements = [
    `Define the study extent, unit of analysis, and temporal window for ${card.title}.`,
    `Standardize CRS, spatial resolution, and schema conventions across ${sectionLabel.toLowerCase()} inputs.`,
    'Record validation sources, thresholds, and uncertainty notes before publishing outputs.',
  ];

  if (focusTags) {
    requirements.splice(2, 0, `Prioritize variables tied to ${focusTags}.`);
  }

  return requirements;
}

function buildGuardrailText(card: Card, sectionLabel: string): string {
  const focusTags = (card.tags ?? [])
    .slice(0, 3)
    .map((tag) => humanizeId(String(tag).toLowerCase()))
    .join(', ');
  const focusArea = focusTags || sectionLabel.toLowerCase();
  return `Check source vintage, boundary consistency, and sensitivity to thresholds before using ${card.title} for ${focusArea} comparisons or policy decisions.`;
}

function buildMethodologyFallbackHtml(card: Card, relatedCards: Card[]): string {
  const sectionLabel = getSectionLabel(card.sectionId);
  const relatedGuidance = relatedCards
    .map((candidate) => {
      const cue = firstSentence(candidate.methodology ?? candidate.summary);
      if (!cue) {
        return null;
      }
      return `<li><strong>${escapeHtml(candidate.title)}:</strong> ${escapeHtml(cue)}</li>`;
    })
    .filter((item): item is string => Boolean(item))
    .join('');

  const focusTags = (card.tags ?? [])
    .slice(0, 4)
    .map((tag) => humanizeId(String(tag).toLowerCase()))
    .join(', ');

  const parts = [
    '<h4>Methodological framing</h4>',
    `<p>Treat ${escapeHtml(card.title)} as a workflow within ${escapeHtml(sectionLabel)}: fix the decision question, unit of analysis, spatial extent, temporal horizon, and acceptance threshold before interpreting outputs.</p>`,
    `<p><strong>Focus dimensions:</strong> ${escapeHtml(focusTags || sectionLabel)}.</p>`,
  ];

  if (relatedGuidance) {
    parts.push('<h4>Related section guidance</h4>');
    parts.push(`<ul>${relatedGuidance}</ul>`);
  }

  parts.push('<h4>Interpretation guardrails</h4>');
  parts.push(`<p>${escapeHtml(buildGuardrailText(card, sectionLabel))}</p>`);

  return parts.join('');
}

function buildFallbackExamples(card: Card, relatedCards: Card[]): ExampleVariant[] {
  const sectionLabel = getSectionLabel(card.sectionId);
  const relatedDatasets = collectUniqueFromCards(relatedCards, (candidate) => candidate.datasets, 6);
  const relatedTools = collectUniqueFromCards(relatedCards, (candidate) => candidate.tools, 6);
  const relatedExamples = collectUniqueFromCards(relatedCards, (candidate) => candidate.examples, 5);
  const fallbackBlocks: ExampleVariant[] = [];

  if (relatedDatasets.length > 0) {
    fallbackBlocks.push({
      id: 'fallback-datasets',
      label: 'Representative Inputs',
      html: `<p>Section-adjacent datasets commonly paired with ${escapeHtml(card.title)}.</p>${buildListHtml(relatedDatasets)}`,
    });
  }

  if (relatedTools.length > 0) {
    fallbackBlocks.push({
      id: 'fallback-tools',
      label: 'Common Toolchain',
      html: `<p>Reusable tools and runtime surfaces used across ${escapeHtml(sectionLabel)} workflows.</p>${buildListHtml(relatedTools)}`,
    });
  }

  if (relatedExamples.length > 0) {
    fallbackBlocks.push({
      id: 'fallback-examples',
      label: 'Comparable Use Cases',
      html: `<p>Nearby study patterns from the same section when this card does not publish a dedicated data recipe.</p>${buildListHtml(relatedExamples)}`,
    });
  }

  if (fallbackBlocks.length === 0) {
    fallbackBlocks.push({
      id: 'fallback-prereqs',
      label: 'Analytical Prerequisites',
      html: `<p>Set a minimum analytical contract before running ${escapeHtml(card.title)}.</p>${buildListHtml(buildGenericRequirements(card, sectionLabel))}`,
    });
  }

  return fallbackBlocks;
}

function buildFallbackCommands(card: Card, relatedCards: Card[]): CmdLite[] {
  const sectionLabel = getSectionLabel(card.sectionId);
  const relatedPrompts = relatedCards
    .flatMap((candidate) =>
      (candidate.prompts ?? []).slice(0, 1).map((prompt) => ({
        text: `# Related ${sectionLabel} example: ${candidate.title}\n${prompt.trim()}`,
        intent: 'related-section-example',
      })),
    )
    .slice(0, 3);

  if (relatedPrompts.length > 0) {
    return relatedPrompts;
  }

  return [
    {
      intent: 'starter-scaffold',
      text: [
        `# ${card.title} starter scaffold`,
        'import geopandas as gpd',
        '',
        'study_area = gpd.read_file("study_area.geojson")',
        '# Add project-specific inputs here',
        'analysis_inputs = {}',
        '',
        `# ${sectionLabel} workflows should document CRS, time windows, thresholds, and validation sources`,
        'print("Review assumptions before publishing outputs.")',
      ].join('\n'),
    },
  ];
}

function buildFallbackReferences(card: Card, relatedCards: Card[]): RefLite[] {
  const relatedEvidence = collectUniqueFromCards(relatedCards, (candidate) => candidate.evidence, 6)
    .map((title) => ({ title }));

  if (relatedEvidence.length > 0) {
    return relatedEvidence;
  }

  return GENERIC_REFERENCE_FALLBACKS.map((title) => ({ title: `${title} Related to ${getSectionLabel(card.sectionId)}.` }));
}

function applySubstantiveFallbacks(card: Card, assembled: Assembled): Assembled {
  const relatedCards = getRelatedCards(card);
  let info = assembled.info;

  if (!card.methodology) {
    info = `${info}${buildMethodologyFallbackHtml(card, relatedCards)}`;
  }

  if (!extractPlainText(info)) {
    info = buildMethodologyFallbackHtml(card, relatedCards);
  }

  const examples = assembled.examples.length > 0 ? assembled.examples : buildFallbackExamples(card, relatedCards);
  const references = assembled.references.length > 0 ? assembled.references : buildFallbackReferences(card, relatedCards);
  const commands = assembled.commands.length > 0 ? assembled.commands : buildFallbackCommands(card, relatedCards);

  return {
    info,
    examples,
    defaultExampleId: examples[0]?.id ?? assembled.defaultExampleId,
    references,
    commands,
  };
}

// ---------------------------------------------------------------------------
// Bundle normaliser
// ---------------------------------------------------------------------------

export function normalizeBundle(bundle: RPBundle): NormalizedBlock {
  return {
    info: bundle.infoCards.map((c) => `<h4>${c.title}</h4>${c.body.join('<br/>')}`).join(''),
    examples: bundle.exampleHtml
      ? [{ id: 'default', label: 'Example', html: bundle.exampleHtml }]
      : [],
    defaultExampleId: bundle.exampleHtml ? 'default' : null,
    references: uniqByText(bundle.references),
    commands: bundle.prompts.map((p) => ({ text: p })),
  };
}

// ---------------------------------------------------------------------------
// assembleFourBlock — main orchestrator
// ---------------------------------------------------------------------------

/**
 * Given a Card, assembles the four-block content (info, examples,
 * references, commands) for display in RightPanelFourBlock.
 *
 * Simplified version — Card fields
 * directly map to display blocks without complex content-type branching.
 */
export function assembleFourBlock(card: Card): Assembled {
  // Check pack registry first (allows extension by plugins / seeds)
  const packBuilder = getRightPanelPack(card.sectionId);
  if (packBuilder) {
    return applySubstantiveFallbacks(card, packBuilder({ card }));
  }

  // --- Info block: summary + methodology + limitations ---
  const infoParts: string[] = [];
  const summary = stripPlaceholders(card.summary ?? '');
  if (summary) {
    infoParts.push(`<p>${escapeHtml(summary)}</p>`);
  }
  const methodology = stripPlaceholders(card.methodology ?? '');
  if (methodology) {
    infoParts.push(`<h4>Methodology</h4><p>${escapeHtml(methodology)}</p>`);
  }
  const limitations = stripPlaceholders(card.limitations ?? '');
  if (limitations) {
    infoParts.push(`<h4>Limitations</h4><p>${escapeHtml(limitations)}</p>`);
  }
  if (card.sdgAlignment && card.sdgAlignment.length > 0) {
    infoParts.push(
      `<h4>SDG Alignment</h4><p>${card.sdgAlignment.map((sdg) => escapeHtml(sdg)).join(', ')}</p>`,
    );
  }

  // --- Examples block: datasets + tools ---
  const examples: ExampleVariant[] = [];
  if (card.datasets && card.datasets.length > 0) {
    const datasets = card.datasets.map((dataset) => stripPlaceholders(dataset)).filter(Boolean);
    if (datasets.length > 0) {
    examples.push({
      id: 'datasets',
      label: 'Datasets',
      html: buildListHtml(datasets),
    });
    }
  }
  if (card.tools && card.tools.length > 0) {
    const tools = card.tools.map((tool) => stripPlaceholders(tool)).filter(Boolean);
    if (tools.length > 0) {
    examples.push({
      id: 'tools',
      label: 'Tools',
      html: buildListHtml(tools),
    });
    }
  }
  if (card.examples && card.examples.length > 0) {
    const cardExamples = card.examples.map((example) => stripPlaceholders(example)).filter(Boolean);
    if (cardExamples.length > 0) {
    examples.push({
      id: 'examples',
      label: 'Examples',
      html: buildListHtml(cardExamples),
    });
    }
  }

  // --- References block ---
  const refs: RefLite[] = (card.evidence ?? [])
    .map((evidence) => stripPlaceholders(evidence))
    .filter(Boolean)
    .map((title) => ({ title }));

  // --- Commands block ---
  const cmds: CmdLite[] = (card.prompts ?? [])
    .map((prompt) => stripPlaceholders(prompt))
    .filter(Boolean)
    .map((text) => ({ text }));

  return applySubstantiveFallbacks(card, {
    info: infoParts.join(''),
    examples,
    defaultExampleId: examples.length > 0 ? examples[0].id : null,
    references: refs,
    commands: cmds,
  });
}

// ---------------------------------------------------------------------------
// Reference formatting
// ---------------------------------------------------------------------------

export function formatApa(ref: RefLite): string {
  const parts: string[] = [];
  if (ref.authors) parts.push(ref.authors);
  if (ref.year) parts.push(`(${ref.year})`);
  parts.push(ref.title);
  if (ref.journal) parts.push(`<em>${ref.journal}</em>`);
  return `${parts.join('. ')  }.`;
}
