import { describe, expect, it } from 'vitest';
import {
  editSectionText,
  generateNarrativeReport,
  NARRATIVE_TONES,
  type NarrativeInput,
  serializeForReport,
  setSectionStatus,
  TONE_DESCRIPTORS,
} from '../ReportNarrativeGenerator';

function makeInput(): NarrativeInput {
  return {
    analysisId: 'run-123',
    analysisTitle: 'Flood Risk Assessment — District A',
    studyArea: 'District A',
    sampleSize: 120,
    findings: [
      {
        id: 'f1',
        label: 'Mean flood depth',
        value: 1.345,
        unit: 'm',
        pValue: 0.00023,
        ci: [1.1, 1.6],
        sourceField: 'results.meanDepth',
        citationIds: ['ref-1'],
      },
    ],
    comparisons: [
      {
        id: 'c1',
        label: 'Population exposed',
        groupA: 'Ward 3',
        groupB: 'Ward 7',
        valueA: 4200,
        valueB: 1800,
        unit: 'people',
        sourceField: 'results.exposureByWard',
      },
    ],
    trends: [
      {
        id: 't1',
        label: 'Impervious surface share',
        from: { t: '2015', value: 42 },
        to: { t: '2024', value: 58 },
        unit: '%',
        sourceField: 'results.imperviousTrend',
      },
    ],
    recommendations: [
      {
        id: 'r1',
        subject: 'Ward 3 drainage capacity',
        action: 'upgrade the primary storm drain corridor',
        supportingClaimIds: ['f1', 'c1'],
        priority: 'high',
      },
    ],
    methodology: {
      id: 'method-flood-01',
      name: 'IPCC vulnerability framework',
      description: 'Combines exposure, sensitivity, and adaptive capacity indicators.',
      citations: [
        { id: 'ref-method-ipcc', label: 'IPCC 2022', reference: 'IPCC. 2022. Sixth Assessment Report, WGII.' },
      ],
    },
    citations: [
      { id: 'ref-1', label: 'Smith 2020', reference: 'Smith J. 2020. Urban flooding case studies. J. Hydrology 44(3).' },
    ],
  };
}

describe('generateNarrativeReport — structure', () => {
  it('produces a finding, comparison, trend, recommendation, and method note by default', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const kinds = report.sections.map((s) => s.kind);
    expect(kinds).toEqual(['finding', 'comparison', 'trend', 'recommendation', 'method_note']);
    expect(report.tone).toBe('academic');
    expect(report.sections.every((s) => s.status === 'draft')).toBe(true);
  });

  it('grounds every section in the source fields of its supporting claims', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const byKind = Object.fromEntries(report.sections.map((s) => [s.kind, s]));
    expect(byKind.finding.sourceFields).toEqual(['results.meanDepth']);
    expect(byKind.comparison.sourceFields).toEqual(['results.exposureByWard']);
    expect(byKind.trend.sourceFields).toEqual(['results.imperviousTrend']);
    // Recommendation aggregates source fields from its supporting claims.
    expect(byKind.recommendation.sourceFields.sort()).toEqual([
      'results.exposureByWard',
      'results.meanDepth',
    ]);
    expect(byKind.recommendation.claimIds.sort()).toEqual(['c1', 'f1']);
  });

  it('includes numeric values from input claims directly in the generated prose', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'policy_brief' });
    const finding = report.sections.find((s) => s.kind === 'finding')!;
    expect(finding.text).toContain('1.34 m'); // formatValue truncates via toFixed(2)
    const comparison = report.sections.find((s) => s.kind === 'comparison')!;
    expect(comparison.text).toContain('4200');
    expect(comparison.text).toContain('1800');
    const trend = report.sections.find((s) => s.kind === 'trend')!;
    expect(trend.text).toMatch(/42.*58/);
    expect(trend.text).toContain('38.1%'); // (58-42)/42*100 = 38.095...
  });

  it('never emits causal verbs', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const joined = report.sections.map((s) => s.text).join(' ').toLowerCase();
    // Associative language only — no "causes" / "caused" / "cause of" etc.
    expect(joined).not.toMatch(/\bcauses?\b/);
    expect(joined).not.toMatch(/\bcaused\b/);
  });
});

describe('generateNarrativeReport — tone differences', () => {
  it('changes vocabulary between tones for the same finding', () => {
    const input = makeInput();
    const academic = generateNarrativeReport(input, { tone: 'academic', kinds: ['finding'] });
    const brief = generateNarrativeReport(input, { tone: 'policy_brief', kinds: ['finding'] });
    const exec = generateNarrativeReport(input, { tone: 'executive_summary', kinds: ['finding'] });
    const pub = generateNarrativeReport(input, { tone: 'public', kinds: ['finding'] });

    const textAc = academic.sections[0].text;
    const textBr = brief.sections[0].text;
    const textEx = exec.sections[0].text;
    const textPu = pub.sections[0].text;

    expect(textAc).not.toEqual(textBr);
    expect(textAc).not.toEqual(textEx);
    expect(textAc).not.toEqual(textPu);
    // Academic shows p-value; executive summary is stripped down.
    expect(textAc).toMatch(/p =/);
    expect(textEx).toMatch(/Key finding/);
    expect(textPu.toLowerCase()).toContain('we measured');
  });

  it('exposes a descriptor and preview for every tone', () => {
    for (const tone of NARRATIVE_TONES) {
      const desc = TONE_DESCRIPTORS[tone];
      expect(desc.tone).toBe(tone);
      expect(desc.preview.length).toBeGreaterThan(0);
      expect(desc.label.length).toBeGreaterThan(0);
    }
  });
});

describe('generateNarrativeReport — citations', () => {
  it('emits anchors within the section text and registers used citations', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const finding = report.sections.find((s) => s.kind === 'finding')!;
    expect(finding.citationAnchors.length).toBe(1);
    const anchor = finding.citationAnchors[0];
    expect(finding.text.slice(anchor.start, anchor.end)).toBe('[Smith 2020]');
    expect(report.citations.map((c) => c.id)).toContain('ref-1');
  });

  it('includes methodology citations in the method note', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const method = report.sections.find((s) => s.kind === 'method_note')!;
    const labels = method.citationAnchors.map((a) => a.label);
    expect(labels).toContain('[IPCC 2022]');
    expect(report.citations.some((c) => c.id === 'ref-method-ipcc')).toBe(true);
  });

  it('omits citations that reference ids not present in the input', () => {
    const input = makeInput();
    input.findings![0].citationIds = ['missing-ref'];
    const report = generateNarrativeReport(input, { tone: 'academic' });
    const finding = report.sections.find((s) => s.kind === 'finding')!;
    expect(finding.citationAnchors.length).toBe(0);
    expect(finding.text).not.toContain('[');
  });
});

describe('generateNarrativeReport — safeguards', () => {
  it('flags recommendations without any resolvable supporting claim', () => {
    const input = makeInput();
    input.recommendations![0].supportingClaimIds = ['no-such-claim'];
    const report = generateNarrativeReport(input, { tone: 'policy_brief' });
    const rec = report.sections.find((s) => s.kind === 'recommendation')!;
    expect(rec.warnings?.length).toBeGreaterThan(0);
    expect(rec.text).toContain('reviewer must validate');
  });

  it('warns about small sample sizes', () => {
    const input = makeInput();
    input.sampleSize = 12;
    const report = generateNarrativeReport(input);
    expect(report.warnings.some((w) => w.toLowerCase().includes('sample size'))).toBe(true);
  });

  it('honours the `kinds` filter', () => {
    const report = generateNarrativeReport(makeInput(), {
      tone: 'academic',
      kinds: ['finding'],
    });
    expect(report.sections.map((s) => s.kind)).toEqual(['finding']);
  });

  it('skips the method note when the methodology is absent', () => {
    const input = makeInput();
    delete input.methodology;
    const report = generateNarrativeReport(input);
    expect(report.sections.some((s) => s.kind === 'method_note')).toBe(false);
  });

  it('returns an empty report when the input has no claims and no methodology', () => {
    const report = generateNarrativeReport({
      analysisId: 'empty',
      analysisTitle: 'Empty Analysis',
    });
    expect(report.sections).toEqual([]);
    expect(report.citations).toEqual([]);
    expect(report.analysisId).toBe('empty');
  });
});

describe('section editing helpers', () => {
  it('re-anchors citations that are still present after an edit', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const finding = report.sections.find((s) => s.kind === 'finding')!;
    const prefix = 'Prepended note. ';
    const edited = editSectionText(finding, prefix + finding.text);
    expect(edited.citationAnchors.length).toBe(finding.citationAnchors.length);
    const anchor = edited.citationAnchors[0];
    expect(edited.text.slice(anchor.start, anchor.end)).toBe('[Smith 2020]');
    expect(anchor.start).toBeGreaterThan(finding.citationAnchors[0].start);
  });

  it('drops anchors that no longer appear in edited text', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const finding = report.sections.find((s) => s.kind === 'finding')!;
    const edited = editSectionText(finding, 'Rewritten with no citation.');
    expect(edited.citationAnchors).toEqual([]);
  });

  it('updates section status', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic', kinds: ['finding'] });
    const updated = setSectionStatus(report.sections[0], 'accepted');
    expect(updated.status).toBe('accepted');
    expect(report.sections[0].status).toBe('draft');
  });
});

describe('serializeForReport', () => {
  it('concatenates accepted/draft sections and appends references', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic' });
    const text = serializeForReport(report);
    expect(text).toContain('## References');
    expect(text).toContain('Smith 2020');
    expect(text.startsWith('## ')).toBe(true);
  });

  it('excludes rejected sections from the serialized output', () => {
    const report = generateNarrativeReport(makeInput(), { tone: 'academic', kinds: ['finding', 'comparison'] });
    report.sections[0] = setSectionStatus(report.sections[0], 'rejected');
    const text = serializeForReport(report);
    expect(text).not.toContain(report.sections[0].title);
    expect(text).toContain(report.sections[1].title);
  });
});
