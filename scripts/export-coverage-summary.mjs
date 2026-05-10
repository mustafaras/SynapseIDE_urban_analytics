import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const coverageSummaryPath = path.join(rootDir, 'coverage', 'coverage-summary.json');
const coveragePolicyPath = path.join(rootDir, 'src', 'config', 'coveragePolicy.json');
const outputPath = path.join(rootDir, 'public', 'diagnostics', 'test-coverage-summary.json');

const METRICS = ['statements', 'branches', 'functions', 'lines'];

function normaliseCoverageKey(key) {
  if (key === 'total') {
    return key;
  }

  const absolutePath = path.isAbsolute(key) ? key : path.resolve(rootDir, key);
  return path.relative(rootDir, absolutePath).replace(/\\/g, '/');
}

function patternToPrefix(pattern) {
  return pattern.split('**')[0]?.replace(/\\/g, '/') ?? pattern;
}

function matchesPattern(filePath, patterns) {
  return patterns.some((pattern) => filePath.startsWith(patternToPrefix(pattern)));
}

function aggregateMetric(entries, metricName) {
  const aggregate = entries.reduce(
    (accumulator, entry) => {
      const metric = entry[metricName] ?? {};
      accumulator.covered += metric.covered ?? 0;
      accumulator.total += metric.total ?? 0;
      accumulator.skipped += metric.skipped ?? 0;
      return accumulator;
    },
    { covered: 0, total: 0, skipped: 0 },
  );

  const pct = aggregate.total > 0
    ? Number(((aggregate.covered / aggregate.total) * 100).toFixed(1))
    : 0;

  return {
    ...aggregate,
    pct,
  };
}

function meetsThresholds(coverage, minimum) {
  return METRICS.every((metricName) => (coverage[metricName]?.pct ?? 0) >= minimum[metricName]);
}

const coverageSummaryRaw = JSON.parse(await fs.readFile(coverageSummaryPath, 'utf8'));
const coveragePolicy = JSON.parse(await fs.readFile(coveragePolicyPath, 'utf8'));

const fileEntries = Object.entries(coverageSummaryRaw)
  .filter(([key]) => key !== 'total')
  .map(([key, value]) => [normaliseCoverageKey(key), value]);

const moduleSummaries = coveragePolicy.modules.map((modulePolicy) => {
  const matchingEntries = fileEntries
    .filter(([filePath]) => matchesPattern(filePath, modulePolicy.include))
    .map(([, value]) => value);

  const coverage = Object.fromEntries(
    METRICS.map((metricName) => [metricName, aggregateMetric(matchingEntries, metricName)]),
  );

  return {
    id: modulePolicy.id,
    label: modulePolicy.label,
    fileCount: matchingEntries.length,
    minimum: modulePolicy.minimum,
    coverage,
    pass: meetsThresholds(coverage, modulePolicy.minimum),
  };
});

const overall = Object.fromEntries(
  METRICS.map((metricName) => [metricName, coverageSummaryRaw.total[metricName]]),
);

const artifact = {
  generatedAt: new Date().toISOString(),
  source: 'vitest-v8-json-summary',
  overall,
  globalMinimum: coveragePolicy.global,
  modules: moduleSummaries,
  overallPass: meetsThresholds(overall, coveragePolicy.global) && moduleSummaries.every((moduleSummary) => moduleSummary.pass),
  notes: [
    'Coverage artifact generated from Vitest V8 json-summary output.',
    'Run npm run test:coverage:publish after analytical changes to refresh the diagnostics panel.',
    'Thresholds are intentionally module-specific so CI can gate high-value analytical surfaces without conflating them with unrelated UI code.',
  ],
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

console.log(`Coverage summary exported to ${path.relative(rootDir, outputPath)}`);