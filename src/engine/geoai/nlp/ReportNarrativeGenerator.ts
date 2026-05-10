/**
 * GeoAI NLP — Analytical Report Narrative Generator.
 *
 * Builds structured, traceable narrative sections from an analysis result
 * envelope. Generation is template-driven: every numeric value in the output
 * text is drawn from a supplied claim, and citation anchors are inserted at
 * well-defined offsets so the reporting engine can manipulate them later.
 *
 * Design constraints:
 *  - Text is grounded in structured claims; templates never fabricate numbers.
 *  - No causal verbs ("causes", "results in") — templates use associative
 *    language ("is associated with", "correlates with", "coincides with").
 *  - Output is fully structured (sections, anchors, sourceFields) so callers
 *    can edit, replace, annotate, or re-generate individual sections.
 */

/* ══════════════════════════════════════════════════════
   Tone + section kinds
   ══════════════════════════════════════════════════════ */

export type NarrativeTone =
  | 'academic'
  | 'policy_brief'
  | 'executive_summary'
  | 'public';

export const NARRATIVE_TONES: readonly NarrativeTone[] = [
  'academic',
  'policy_brief',
  'executive_summary',
  'public',
] as const;

export type NarrativeSectionKind =
  | 'finding'
  | 'comparison'
  | 'trend'
  | 'recommendation'
  | 'method_note';

/* ══════════════════════════════════════════════════════
   Claims (machine-grounded inputs)
   ══════════════════════════════════════════════════════ */

export interface Citation {
  id: string;
  label: string;
  reference: string;
  uri?: string;
  methodId?: string;
}

export interface MethodologyMeta {
  id: string;
  name: string;
  description?: string;
  citations?: Citation[];
}

export interface StatisticClaim {
  id: string;
  label: string;
  value: number;
  unit?: string;
  pValue?: number;
  ci?: [number, number];
  sourceField?: string;
  citationIds?: string[];
}

export interface ComparisonClaim {
  id: string;
  label: string;
  groupA: string;
  groupB: string;
  valueA: number;
  valueB: number;
  unit?: string;
  sourceField?: string;
  citationIds?: string[];
}

export interface TrendClaim {
  id: string;
  label: string;
  from: { t: string; value: number };
  to: { t: string; value: number };
  unit?: string;
  sourceField?: string;
  citationIds?: string[];
}

export interface RecommendationSeed {
  id: string;
  subject: string;
  action: string;
  supportingClaimIds: string[];
  priority?: 'low' | 'medium' | 'high';
  citationIds?: string[];
}

export interface NarrativeInput {
  analysisId: string;
  analysisTitle: string;
  studyArea?: string;
  sampleSize?: number;
  findings?: StatisticClaim[];
  comparisons?: ComparisonClaim[];
  trends?: TrendClaim[];
  recommendations?: RecommendationSeed[];
  methodology?: MethodologyMeta;
  /**
   * Citations the generator can choose from. Anything referenced via
   * `citationIds` on a claim MUST appear here or it will be omitted.
   */
  citations?: Citation[];
}

/* ══════════════════════════════════════════════════════
   Output envelope
   ══════════════════════════════════════════════════════ */

export interface CitationAnchor {
  /** Character offsets into the section text, inclusive of the anchor token. */
  start: number;
  end: number;
  citationId: string;
  /** Rendered label such as "[Anselin 1995]". */
  label: string;
}

export type SectionStatus = 'draft' | 'accepted' | 'rejected';

export interface NarrativeSection {
  id: string;
  kind: NarrativeSectionKind;
  tone: NarrativeTone;
  title: string;
  text: string;
  citationAnchors: CitationAnchor[];
  /** Dotted result-path fields used in this section, for traceability. */
  sourceFields: string[];
  /** Claim ids referenced by this section. */
  claimIds: string[];
  /** Per-section workflow state managed by the UI. */
  status: SectionStatus;
  /** Caveats/warnings surfaced during generation (e.g. "small sample size"). */
  warnings?: string[];
}

export interface NarrativeReport {
  id: string;
  analysisId: string;
  analysisTitle: string;
  tone: NarrativeTone;
  sections: NarrativeSection[];
  citations: Citation[];
  generatedAt: number;
  warnings: string[];
}

export interface GenerateOptions {
  tone?: NarrativeTone;
  /** Limit which section kinds are generated. Defaults to all available. */
  kinds?: NarrativeSectionKind[];
  /** Include a method note when methodology metadata is present. */
  includeMethodNote?: boolean;
  /** Lock generation to a pseudo-random ordinal so ids are deterministic in tests. */
  idSeed?: string;
}

/* ══════════════════════════════════════════════════════
   Tone descriptors (preview copy for the UI)
   ══════════════════════════════════════════════════════ */

export interface ToneDescriptor {
  tone: NarrativeTone;
  label: string;
  preview: string;
  audience: string;
  characteristics: string[];
}

export const TONE_DESCRIPTORS: Record<NarrativeTone, ToneDescriptor> = {
  academic: {
    tone: 'academic',
    label: 'Academic',
    audience: 'Peer-reviewed publication, research readers',
    preview:
      'The analysis reveals a statistically significant association between the observed pattern and the measured covariates.',
    characteristics: ['Formal register', 'Hedged claims', 'Inline citations', 'Methodological transparency'],
  },
  policy_brief: {
    tone: 'policy_brief',
    label: 'Policy brief',
    audience: 'Municipal planners, policy advisors',
    preview:
      'Evidence indicates that targeted investment in the identified hot-spot neighborhoods would address measurable disparities.',
    characteristics: ['Action-oriented', 'Plain language', 'Short paragraphs', 'Implementation framing'],
  },
  executive_summary: {
    tone: 'executive_summary',
    label: 'Executive summary',
    audience: 'Leadership, decision-makers, steering committees',
    preview:
      'Key finding: the study area shows a 14.2% disparity between the two compared groups, warranting targeted action.',
    characteristics: ['Compact', 'Headline-first', 'Quantified', 'Decision-ready'],
  },
  public: {
    tone: 'public',
    label: 'Public communication',
    audience: 'General public, civic engagement materials',
    preview:
      'Our study shows that some neighborhoods experience different outcomes than others, and we explain what the data means for residents.',
    characteristics: ['Accessible vocabulary', 'Low jargon', 'Reader-first framing', 'Optional takeaway'],
  },
};

/* ══════════════════════════════════════════════════════
   Public API
   ══════════════════════════════════════════════════════ */

export function generateNarrativeReport(
  input: NarrativeInput,
  options: GenerateOptions = {},
): NarrativeReport {
  const tone: NarrativeTone = options.tone ?? 'academic';
  const selectedKinds = new Set<NarrativeSectionKind>(
    options.kinds ?? (['finding', 'comparison', 'trend', 'recommendation', 'method_note'] as NarrativeSectionKind[]),
  );
  const includeMethodNote = options.includeMethodNote ?? true;

  const citationRegistry = buildCitationRegistry(input);
  const warnings: string[] = [];
  const sections: NarrativeSection[] = [];

  if (selectedKinds.has('finding') && input.findings?.length) {
    for (let i = 0; i < input.findings.length; i++) {
      sections.push(buildFindingSection(input, input.findings[i], tone, citationRegistry, i));
    }
  }

  if (selectedKinds.has('comparison') && input.comparisons?.length) {
    for (let i = 0; i < input.comparisons.length; i++) {
      sections.push(buildComparisonSection(input, input.comparisons[i], tone, citationRegistry, i));
    }
  }

  if (selectedKinds.has('trend') && input.trends?.length) {
    for (let i = 0; i < input.trends.length; i++) {
      sections.push(buildTrendSection(input, input.trends[i], tone, citationRegistry, i));
    }
  }

  if (selectedKinds.has('recommendation') && input.recommendations?.length) {
    const findingsById = new Map<string, StatisticClaim>();
    for (const f of input.findings ?? []) findingsById.set(f.id, f);
    const comparisonsById = new Map<string, ComparisonClaim>();
    for (const c of input.comparisons ?? []) comparisonsById.set(c.id, c);
    const trendsById = new Map<string, TrendClaim>();
    for (const t of input.trends ?? []) trendsById.set(t.id, t);

    for (let i = 0; i < input.recommendations.length; i++) {
      sections.push(
        buildRecommendationSection(
          input,
          input.recommendations[i],
          { findingsById, comparisonsById, trendsById },
          tone,
          citationRegistry,
          i,
        ),
      );
    }
  }

  if (includeMethodNote && selectedKinds.has('method_note') && input.methodology) {
    sections.push(buildMethodNoteSection(input, input.methodology, tone, citationRegistry));
  }

  if (typeof input.sampleSize === 'number' && input.sampleSize < 30) {
    warnings.push(`Small sample size (n=${input.sampleSize}); interpret findings cautiously.`);
  }

  return {
    id: makeId('narrative', options.idSeed ?? input.analysisId, 0),
    analysisId: input.analysisId,
    analysisTitle: input.analysisTitle,
    tone,
    sections,
    citations: citationRegistry.usedList(),
    generatedAt: Date.now(),
    warnings,
  };
}

/* ══════════════════════════════════════════════════════
   Section builders
   ══════════════════════════════════════════════════════ */

function buildFindingSection(
  input: NarrativeInput,
  claim: StatisticClaim,
  tone: NarrativeTone,
  citations: CitationRegistry,
  ordinal: number,
): NarrativeSection {
  const sentences: Sentence[] = [];
  const valueStr = formatValue(claim.value, claim.unit);

  switch (tone) {
    case 'academic': {
      const ciSuffix = claim.ci ? ` (95% CI ${formatValue(claim.ci[0], claim.unit)}–${formatValue(claim.ci[1], claim.unit)})` : '';
      const pSuffix = typeof claim.pValue === 'number' ? `, p = ${formatP(claim.pValue)}` : '';
      sentences.push(plain(
        `The analysis of ${input.analysisTitle.toLowerCase()} estimates ${claim.label} at ${valueStr}${ciSuffix}${pSuffix}.`,
      ));
      break;
    }
    case 'policy_brief':
      sentences.push(plain(`Evidence on ${claim.label.toLowerCase()} places the current value at ${valueStr}.`));
      break;
    case 'executive_summary':
      sentences.push(plain(`Key finding — ${claim.label}: ${valueStr}.`));
      break;
    case 'public':
      sentences.push(plain(`We measured ${claim.label.toLowerCase()} at ${valueStr}.`));
      break;
  }

  appendCitations(sentences, claim.citationIds, citations);

  const studyAreaSuffix = input.studyArea ? ` across ${input.studyArea}` : '';
  if (tone === 'academic' || tone === 'public') {
    sentences.push(plain(`This measurement reflects the full analytical extent${studyAreaSuffix}.`));
  }

  const { text, anchors } = assemble(sentences);
  return {
    id: makeId('finding', input.analysisId, ordinal),
    kind: 'finding',
    tone,
    title: claim.label,
    text,
    citationAnchors: anchors,
    sourceFields: compact([claim.sourceField]),
    claimIds: [claim.id],
    status: 'draft',
  };
}

function buildComparisonSection(
  input: NarrativeInput,
  claim: ComparisonClaim,
  tone: NarrativeTone,
  citations: CitationRegistry,
  ordinal: number,
): NarrativeSection {
  const a = formatValue(claim.valueA, claim.unit);
  const b = formatValue(claim.valueB, claim.unit);
  const diff = claim.valueA - claim.valueB;
  const diffStr = formatValue(Math.abs(diff), claim.unit);
  const direction = diff > 0 ? 'higher' : diff < 0 ? 'lower' : 'equivalent';
  const sentences: Sentence[] = [];

  switch (tone) {
    case 'academic':
      sentences.push(plain(
        `Compared across ${claim.groupA} and ${claim.groupB}, ${claim.label.toLowerCase()} is ${direction} in ${claim.groupA} (${a}) than in ${claim.groupB} (${b}), a difference of ${diffStr}. This disparity is descriptive and does not imply a causal mechanism.`,
      ));
      break;
    case 'policy_brief':
      sentences.push(plain(
        `${claim.groupA} records ${claim.label.toLowerCase()} of ${a}, compared with ${b} in ${claim.groupB} — a gap of ${diffStr}.`,
      ));
      break;
    case 'executive_summary':
      sentences.push(plain(
        `Gap (${claim.label}): ${claim.groupA} = ${a}; ${claim.groupB} = ${b}; Δ = ${diffStr}.`,
      ));
      break;
    case 'public':
      sentences.push(plain(
        `When we compared ${claim.groupA} and ${claim.groupB}, we found ${claim.label.toLowerCase()} of ${a} versus ${b}.`,
      ));
      break;
  }

  appendCitations(sentences, claim.citationIds, citations);
  const { text, anchors } = assemble(sentences);
  return {
    id: makeId('comparison', input.analysisId, ordinal),
    kind: 'comparison',
    tone,
    title: `${claim.label} — ${claim.groupA} vs ${claim.groupB}`,
    text,
    citationAnchors: anchors,
    sourceFields: compact([claim.sourceField]),
    claimIds: [claim.id],
    status: 'draft',
  };
}

function buildTrendSection(
  input: NarrativeInput,
  claim: TrendClaim,
  tone: NarrativeTone,
  citations: CitationRegistry,
  ordinal: number,
): NarrativeSection {
  const from = formatValue(claim.from.value, claim.unit);
  const to = formatValue(claim.to.value, claim.unit);
  const delta = claim.to.value - claim.from.value;
  const pct = claim.from.value !== 0 ? (delta / claim.from.value) * 100 : null;
  const pctStr = pct == null ? null : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const direction = delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'remained unchanged';
  const sentences: Sentence[] = [];

  switch (tone) {
    case 'academic':
      sentences.push(plain(
        `Between ${claim.from.t} and ${claim.to.t}, ${claim.label.toLowerCase()} ${direction} from ${from} to ${to}${pctStr ? ` (${pctStr})` : ''}. The observed change is associated with the monitoring period; it is not evidence of a causal driver.`,
      ));
      break;
    case 'policy_brief':
      sentences.push(plain(
        `From ${claim.from.t} to ${claim.to.t}, ${claim.label.toLowerCase()} ${direction} from ${from} to ${to}${pctStr ? ` (${pctStr})` : ''}.`,
      ));
      break;
    case 'executive_summary':
      sentences.push(plain(
        `Trend (${claim.label}): ${claim.from.t} → ${claim.to.t}: ${from} → ${to}${pctStr ? ` (${pctStr})` : ''}.`,
      ));
      break;
    case 'public':
      sentences.push(plain(
        `Over the period ${claim.from.t}–${claim.to.t}, ${claim.label.toLowerCase()} ${direction} from ${from} to ${to}.`,
      ));
      break;
  }

  appendCitations(sentences, claim.citationIds, citations);
  const { text, anchors } = assemble(sentences);
  return {
    id: makeId('trend', input.analysisId, ordinal),
    kind: 'trend',
    tone,
    title: `${claim.label} trend (${claim.from.t}–${claim.to.t})`,
    text,
    citationAnchors: anchors,
    sourceFields: compact([claim.sourceField]),
    claimIds: [claim.id],
    status: 'draft',
  };
}

interface ClaimIndex {
  findingsById: Map<string, StatisticClaim>;
  comparisonsById: Map<string, ComparisonClaim>;
  trendsById: Map<string, TrendClaim>;
}

function buildRecommendationSection(
  input: NarrativeInput,
  rec: RecommendationSeed,
  index: ClaimIndex,
  tone: NarrativeTone,
  citations: CitationRegistry,
  ordinal: number,
): NarrativeSection {
  const sourceFields: string[] = [];
  const claimIds: string[] = [];
  const supportFragments: string[] = [];

  for (const id of rec.supportingClaimIds) {
    const f = index.findingsById.get(id);
    if (f) {
      claimIds.push(f.id);
      if (f.sourceField) sourceFields.push(f.sourceField);
      supportFragments.push(`${f.label} = ${formatValue(f.value, f.unit)}`);
      continue;
    }
    const c = index.comparisonsById.get(id);
    if (c) {
      claimIds.push(c.id);
      if (c.sourceField) sourceFields.push(c.sourceField);
      supportFragments.push(
        `${c.label}: ${c.groupA} ${formatValue(c.valueA, c.unit)} vs ${c.groupB} ${formatValue(c.valueB, c.unit)}`,
      );
      continue;
    }
    const t = index.trendsById.get(id);
    if (t) {
      claimIds.push(t.id);
      if (t.sourceField) sourceFields.push(t.sourceField);
      supportFragments.push(`${t.label} ${formatValue(t.from.value, t.unit)} → ${formatValue(t.to.value, t.unit)}`);
    }
  }

  const warnings: string[] = [];
  if (supportFragments.length === 0) {
    warnings.push('Recommendation has no grounded supporting claims; reviewer action required.');
  }
  const supportText = supportFragments.length > 0
    ? ` Supporting evidence: ${supportFragments.join('; ')}.`
    : ' Supporting evidence: (none — reviewer must validate).';

  const priorityTag = rec.priority ? ` [${rec.priority.toUpperCase()}]` : '';
  const sentences: Sentence[] = [];

  switch (tone) {
    case 'academic':
      sentences.push(plain(
        `Based on the observed analysis, it is recommended that ${rec.action} in relation to ${rec.subject}.${supportText} This recommendation is descriptive and subject to validation against implementation constraints.`,
      ));
      break;
    case 'policy_brief':
      sentences.push(plain(
        `Recommendation${priorityTag}: ${rec.action} — addressing ${rec.subject}.${supportText}`,
      ));
      break;
    case 'executive_summary':
      sentences.push(plain(
        `Action${priorityTag}: ${rec.action} (${rec.subject}).`,
      ));
      break;
    case 'public':
      sentences.push(plain(
        `What this means: ${rec.action} in ${rec.subject}.${supportText}`,
      ));
      break;
  }

  appendCitations(sentences, rec.citationIds, citations);
  const { text, anchors } = assemble(sentences);
  return {
    id: makeId('recommendation', input.analysisId, ordinal),
    kind: 'recommendation',
    tone,
    title: `Recommendation: ${rec.action}`,
    text,
    citationAnchors: anchors,
    sourceFields: unique(sourceFields),
    claimIds: unique(claimIds),
    status: 'draft',
    ...(warnings.length ? { warnings } : {}),
  };
}

function buildMethodNoteSection(
  input: NarrativeInput,
  methodology: MethodologyMeta,
  tone: NarrativeTone,
  citations: CitationRegistry,
): NarrativeSection {
  const sentences: Sentence[] = [];
  const description = methodology.description ?? `The ${methodology.name} methodology was applied as documented in its specification.`;

  switch (tone) {
    case 'academic':
      sentences.push(plain(
        `Methods. ${description} The implementation follows the published protocol for ${methodology.name}.`,
      ));
      break;
    case 'policy_brief':
      sentences.push(plain(`Method: ${methodology.name}. ${description}`));
      break;
    case 'executive_summary':
      sentences.push(plain(`Method — ${methodology.name}.`));
      break;
    case 'public':
      sentences.push(plain(
        `How we did this: ${description}`,
      ));
      break;
  }

  // Cite every methodology citation, since they are load-bearing.
  const ids = (methodology.citations ?? []).map((c) => {
    citations.registerExternal(c);
    return c.id;
  });
  appendCitations(sentences, ids, citations);

  const { text, anchors } = assemble(sentences);
  return {
    id: makeId('method', input.analysisId, 0),
    kind: 'method_note',
    tone,
    title: `Method: ${methodology.name}`,
    text,
    citationAnchors: anchors,
    sourceFields: [],
    claimIds: [],
    status: 'draft',
  };
}

/* ══════════════════════════════════════════════════════
   Sentence / anchor assembly
   ══════════════════════════════════════════════════════ */

interface Sentence {
  text: string;
  /** Citation anchors pinned to the END of this sentence, in order. */
  citations: Array<{ citationId: string; label: string }>;
}

function plain(text: string): Sentence {
  return { text, citations: [] };
}

function appendCitations(
  sentences: Sentence[],
  ids: string[] | undefined,
  registry: CitationRegistry,
): void {
  if (!ids || ids.length === 0 || sentences.length === 0) return;
  const target = sentences[sentences.length - 1];
  for (const id of ids) {
    const cited = registry.use(id);
    if (cited) target.citations.push({ citationId: cited.id, label: `[${cited.label}]` });
  }
}

function assemble(sentences: Sentence[]): { text: string; anchors: CitationAnchor[] } {
  const parts: string[] = [];
  const anchors: CitationAnchor[] = [];
  let offset = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    let sentenceText = sentence.text;
    // Anchors are placed before the final punctuation when possible: "... foo [Smith 2020]."
    // Split terminal punctuation off so we can splice anchors in.
    const puncMatch = /([.!?])$/.exec(sentenceText);
    const terminal = puncMatch ? puncMatch[1] : '';
    if (terminal) sentenceText = sentenceText.slice(0, sentenceText.length - 1);

    parts.push(sentenceText);
    offset += sentenceText.length;

    for (const cite of sentence.citations) {
      const prefix = ' ';
      parts.push(prefix);
      offset += prefix.length;
      const anchorStart = offset;
      parts.push(cite.label);
      offset += cite.label.length;
      anchors.push({
        start: anchorStart,
        end: offset,
        citationId: cite.citationId,
        label: cite.label,
      });
    }

    if (terminal) {
      parts.push(terminal);
      offset += terminal.length;
    }

    if (i < sentences.length - 1) {
      parts.push(' ');
      offset += 1;
    }
  }

  return { text: parts.join(''), anchors };
}

/* ══════════════════════════════════════════════════════
   Citation registry
   ══════════════════════════════════════════════════════ */

interface CitationRegistry {
  use(id: string): Citation | null;
  registerExternal(c: Citation): void;
  usedList(): Citation[];
}

function buildCitationRegistry(input: NarrativeInput): CitationRegistry {
  const byId = new Map<string, Citation>();
  for (const c of input.citations ?? []) byId.set(c.id, c);
  for (const c of input.methodology?.citations ?? []) {
    if (!byId.has(c.id)) byId.set(c.id, c);
  }
  const used = new Map<string, Citation>();

  return {
    use(id: string) {
      const c = byId.get(id);
      if (!c) return null;
      if (!used.has(c.id)) used.set(c.id, c);
      return c;
    },
    registerExternal(c: Citation) {
      if (!byId.has(c.id)) byId.set(c.id, c);
    },
    usedList() {
      return Array.from(used.values());
    },
  };
}

/* ══════════════════════════════════════════════════════
   Formatters
   ══════════════════════════════════════════════════════ */

function formatValue(value: number, unit?: string): string {
  if (!Number.isFinite(value)) return 'n/a';
  const abs = Math.abs(value);
  let formatted: string;
  if (abs === 0) formatted = '0';
  else if (abs >= 100) formatted = value.toFixed(0);
  else if (abs >= 10) formatted = value.toFixed(1);
  else if (abs >= 1) formatted = value.toFixed(2);
  else formatted = value.toFixed(3);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatP(p: number): string {
  if (!Number.isFinite(p)) return 'n/a';
  if (p < 0.001) return '<0.001';
  if (p < 0.01) return p.toFixed(3);
  return p.toFixed(2);
}

function makeId(prefix: string, seed: string, ordinal: number): string {
  return `${prefix}-${seed}-${ordinal}`;
}

function compact<T>(xs: Array<T | null | undefined>): T[] {
  return xs.filter((x): x is T => x != null);
}

function unique<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

/* ══════════════════════════════════════════════════════
   Section update helpers (used by the UI editor)
   ══════════════════════════════════════════════════════ */

/**
 * Produce a new section with edited text; existing citation anchors are
 * re-resolved against the new text by substring search. Anchors whose labels
 * can no longer be located in the edited text are dropped.
 */
export function editSectionText(
  section: NarrativeSection,
  newText: string,
): NarrativeSection {
  const nextAnchors: CitationAnchor[] = [];
  for (const anchor of section.citationAnchors) {
    const idx = newText.indexOf(anchor.label);
    if (idx >= 0) {
      nextAnchors.push({
        start: idx,
        end: idx + anchor.label.length,
        citationId: anchor.citationId,
        label: anchor.label,
      });
    }
  }
  return { ...section, text: newText, citationAnchors: nextAnchors };
}

export function setSectionStatus(section: NarrativeSection, status: SectionStatus): NarrativeSection {
  return { ...section, status };
}

/**
 * Flatten a report into plain text suitable for inserting into a single
 * note/report slot. Rejected sections are dropped; accepted and draft
 * sections are kept. Citation labels remain inline; a References block is
 * appended if any citations were used.
 */
export function serializeForReport(report: NarrativeReport): string {
  const keep = report.sections.filter((s) => s.status !== 'rejected');
  const lines: string[] = [];
  for (const section of keep) {
    lines.push(`## ${section.title}`);
    lines.push(section.text);
    lines.push('');
  }
  if (report.citations.length > 0) {
    lines.push('## References');
    for (const c of report.citations) {
      lines.push(`- [${c.label}] ${c.reference}${c.uri ? ` — ${c.uri}` : ''}`);
    }
  }
  return lines.join('\n').trim();
}
