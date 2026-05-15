import fs from 'fs';
import path from 'path';
import process from 'process';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, 'src');
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

const TEST_PATH_MARKERS = ['__tests__', '__mocks__', '/fixtures/', '\\fixtures\\'];
const TEST_FILE_PATTERNS = [/\.test\.(ts|tsx|css)$/i, /\.spec\.(ts|tsx|css)$/i];

const ALLOWLIST_TOKEN_SOURCE = [
  'src/theme/GlobalSynapseStyles.ts',
  'src/theme/synapse.ts',
  'src/styles/theme.ts',
  'src/constants/design.ts',
  'src/constants/app.ts',
];

const ALLOWLIST_DATA_PALETTE_PREFIXES = [
  'src/utils/colorRamps.ts',
  'src/engine/carto/',
];

const ALLOWLIST_DATA_PALETTE_EXACT = [
  'src/centerpanel/components/MapChoroplethLayer.tsx',
  'src/centerpanel/components/MapHeatmapLayer.tsx',
  'src/centerpanel/components/MapSymbolLayer.tsx',
  'src/centerpanel/components/MapClusterViz.tsx',
  'src/centerpanel/components/MapHotSpotViz.tsx',
  'src/centerpanel/components/MapTemporalPlayer.tsx',
];

const LITERAL_PATTERNS = [
  { kind: 'hex', regex: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g },
  { kind: 'rgb', regex: /\brgba?\(\s*[^)]+\)/g },
  { kind: 'hsl', regex: /\bhsla?\(\s*[^)]+\)/g },
  { kind: 'gradient', regex: /\b(?:linear|radial|conic)-gradient\(\s*[^)]+\)/g },
  { kind: 'fallback', regex: /\bvar\(\s*--[^,)]+,\s*[^)]+\)/g },
  { kind: 'named', regex: /(["'`])(?:black|white|transparent|red|green|blue|yellow|orange|purple|gray|grey|brown|cyan|magenta|silver|gold)\1/gi },
];

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    changedOnly: args.has('--changed'),
    asJson: args.has('--json'),
    failOnFindings: args.has('--fail-on-findings'),
  };
}

function normalizeRelative(p) {
  return p.split(path.sep).join('/');
}

function isScanFile(relPath) {
  if (!relPath.startsWith('src/')) return false;
  const ext = path.extname(relPath).toLowerCase();
  return SCAN_EXTENSIONS.has(ext);
}

function isTestFixtureFile(relPath) {
  if (TEST_PATH_MARKERS.some((marker) => relPath.includes(marker))) return true;
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(relPath));
}

function matchesAllowlist(relPath, allowlist) {
  return allowlist.includes(relPath);
}

function matchesAllowlistPrefix(relPath, allowPrefixes) {
  return allowPrefixes.some((prefix) => relPath.startsWith(prefix));
}

function classifySkip(relPath) {
  if (isTestFixtureFile(relPath)) return 'test-fixture';
  if (matchesAllowlist(relPath, ALLOWLIST_TOKEN_SOURCE)) return 'token-source';
  if (
    matchesAllowlist(relPath, ALLOWLIST_DATA_PALETTE_EXACT) ||
    matchesAllowlistPrefix(relPath, ALLOWLIST_DATA_PALETTE_PREFIXES)
  ) {
    return 'data-visualization';
  }
  return null;
}

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function getChangedFiles() {
  const files = new Set();
  try {
    const tracked = execSync('git diff --name-only --diff-filter=ACM HEAD', {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
    for (const line of tracked.split(/\r?\n/)) {
      const rel = line.trim();
      if (!rel) continue;
      files.add(normalizeRelative(rel));
    }
  } catch {}

  try {
    const untracked = execSync('git ls-files --others --exclude-standard', {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
    for (const line of untracked.split(/\r?\n/)) {
      const rel = line.trim();
      if (!rel) continue;
      files.add(normalizeRelative(rel));
    }
  } catch {}

  return [...files];
}

function getCandidateFiles(changedOnly) {
  const relFiles = changedOnly
    ? getChangedFiles().filter(isScanFile)
    : walkFiles(SRC_ROOT)
      .map((fullPath) => normalizeRelative(path.relative(ROOT, fullPath)))
      .filter(isScanFile);
  return relFiles.sort();
}

function buildLineOffsets(text) {
  const offsets = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) offsets.push(i + 1);
  }
  return offsets;
}

function lineForIndex(lineOffsets, index) {
  let lo = 0;
  let hi = lineOffsets.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineOffsets[mid] <= index) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return hi + 1;
}

function collectLiterals(text) {
  const lineOffsets = buildLineOffsets(text);
  const findings = [];
  for (const { kind, regex } of LITERAL_PATTERNS) {
    regex.lastIndex = 0;
    let match = regex.exec(text);
    while (match) {
      findings.push({
        kind,
        value: match[0],
        line: lineForIndex(lineOffsets, match.index),
      });
      match = regex.exec(text);
    }
  }
  return findings;
}

function summarizeScan(files) {
  const skippedByCategory = {
    'token-source': 0,
    'data-visualization': 0,
    'test-fixture': 0,
  };
  const scannedFiles = [];
  const findingsByFile = [];
  const literalTotals = {
    hex: 0,
    rgb: 0,
    hsl: 0,
    gradient: 0,
    fallback: 0,
    named: 0,
  };

  for (const relPath of files) {
    const skipCategory = classifySkip(relPath);
    if (skipCategory) {
      skippedByCategory[skipCategory] += 1;
      continue;
    }

    scannedFiles.push(relPath);
    const absPath = path.join(ROOT, relPath);
    let text = '';
    try {
      text = fs.readFileSync(absPath, 'utf8');
    } catch {
      continue;
    }

    const literals = collectLiterals(text);
    if (literals.length === 0) continue;

    for (const literal of literals) {
      literalTotals[literal.kind] += 1;
    }

    const preview = [];
    const seen = new Set();
    for (const literal of literals) {
      const key = `${literal.kind}:${literal.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      preview.push(`${literal.value} (line ${literal.line})`);
      if (preview.length >= 5) break;
    }

    findingsByFile.push({
      file: relPath,
      total: literals.length,
      preview,
    });
  }

  findingsByFile.sort((a, b) => b.total - a.total);

  return {
    allowedHardcodedColorCategories: [
      'token-source',
      'data-visualization',
      'test-fixture',
      'fallback',
    ],
    totals: {
      candidateFiles: files.length,
      scannedFiles: scannedFiles.length,
      filesWithFindings: findingsByFile.length,
      findings: findingsByFile.reduce((sum, item) => sum + item.total, 0),
    },
    skippedByCategory,
    literalTotals,
    topFiles: findingsByFile.slice(0, 20),
  };
}

function printTextReport(report, options) {
  console.log('Color regression guard (report mode)');
  console.log(`- Scope: ${options.changedOnly ? 'changed source files' : 'all source files'}`);
  console.log(`- Candidate files: ${report.totals.candidateFiles}`);
  console.log(`- Scanned files: ${report.totals.scannedFiles}`);
  console.log(`- Files with findings: ${report.totals.filesWithFindings}`);
  console.log(`- Total findings: ${report.totals.findings}`);
  console.log(`- Allowed hard-coded categories: ${report.allowedHardcodedColorCategories.join(', ')}`);
  console.log(
    `- Skipped (allowlist): token-source=${report.skippedByCategory['token-source']}, data-visualization=${report.skippedByCategory['data-visualization']}, test-fixture=${report.skippedByCategory['test-fixture']}`,
  );
  console.log(
    `- Literal totals: hex=${report.literalTotals.hex}, rgb=${report.literalTotals.rgb}, hsl=${report.literalTotals.hsl}, gradient=${report.literalTotals.gradient}, fallback=${report.literalTotals.fallback}, named=${report.literalTotals.named}`,
  );

  if (report.topFiles.length === 0) {
    console.log('No non-allowlisted hard-coded color literals found.');
    return;
  }

  console.log('- Top files:');
  for (const entry of report.topFiles) {
    console.log(`  ${entry.file}: ${entry.total}`);
    for (const sample of entry.preview) {
      console.log(`    ${sample}`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv);
  const candidateFiles = getCandidateFiles(options.changedOnly);
  const report = summarizeScan(candidateFiles);

  if (options.asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTextReport(report, options);
  }

  if (options.failOnFindings && report.totals.findings > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
