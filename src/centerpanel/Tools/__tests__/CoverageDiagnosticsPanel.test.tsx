import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CoverageDiagnosticsPanel, { type CoverageDiagnosticsSummary } from '../components/CoverageDiagnosticsPanel';

const coverageSummaryFixture: CoverageDiagnosticsSummary = {
  generatedAt: '2026-04-21T19:55:00.000Z',
  source: 'vitest-v8-json-summary',
  overall: {
    statements: { pct: 84.2, covered: 842, total: 1000, skipped: 0 },
    branches: { pct: 72.4, covered: 362, total: 500, skipped: 0 },
    functions: { pct: 86.5, covered: 173, total: 200, skipped: 0 },
    lines: { pct: 84.9, covered: 849, total: 1000, skipped: 0 },
  },
  globalMinimum: {
    statements: 55,
    branches: 40,
    functions: 55,
    lines: 55,
  },
  modules: [
    {
      id: 'urban_calculators',
      label: 'Urban Calculator Core',
      fileCount: 16,
      minimum: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
      coverage: {
        statements: { pct: 91.2, covered: 456, total: 500, skipped: 0 },
        branches: { pct: 83.1, covered: 166, total: 200, skipped: 0 },
        functions: { pct: 92.5, covered: 74, total: 80, skipped: 0 },
        lines: { pct: 91.8, covered: 459, total: 500, skipped: 0 },
      },
      pass: true,
    },
  ],
  overallPass: true,
  notes: [
    'Coverage artifact generated from Vitest V8 json-summary output.',
  ],
};

describe('CoverageDiagnosticsPanel', () => {
  it('renders the analytical coverage dashboard with thresholds and module status', () => {
    const html = renderToStaticMarkup(<CoverageDiagnosticsPanel initialSummary={coverageSummaryFixture} />);

    expect(html).toContain('Analytical QA Coverage');
    expect(html).toContain('Coverage snapshot');
    expect(html).toContain('Critical module thresholds');
    expect(html).toContain('Urban Calculator Core');
    expect(html).toContain('CI-ready coverage thresholds for analytical modules');
    expect(html).toContain('Pass');
  });
});