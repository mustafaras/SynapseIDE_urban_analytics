import fs from 'fs';
import path from 'path';
import process from 'process';
import zlib from 'zlib';

const DIST_DIR = path.resolve(process.cwd(), process.env.BUNDLE_BUDGET_DIST_DIR ?? 'dist');
const MANIFEST_PATH = path.join(DIST_DIR, '.vite', 'manifest.json');

const INITIAL_LOAD_BUDGET_BYTES = 6200 * 1024;
const LAZY_CHUNK_BUDGET_BYTES = 500 * 1024;
const APPROVED_LAZY_BUDGET_OVERRIDES = {
  'centerpanel/components/MapExplorerModal': {
    budgetBytes: 4300 * 1024,
    reason: 'Map explorer intentionally isolates importer, map engine, dataset library, diagnostics, map-persistence recovery stacks, and the 3D/zoning/massing/sun-shadow panel suite (Prompts 30–33) behind a single lazy boundary.',
  },
  'centerpanel/Flows/SunlightSimFlow': {
    budgetBytes: 1365 * 1024,
    reason: 'Solar simulation keeps the Three.js orbit-control and sunlight-analysis stack isolated to the 3D workflow entry and shares the map-persistence recovery stack.',
  },
  'centerpanel/Flows/CityJSONFlow': {
    budgetBytes: 1024 * 1024,
    reason: 'CityJSON review keeps the Three.js orbit-control stack isolated to the 3D workflow entry.',
  },
  'centerpanel/Flows/VoxCity3DFlow': {
    budgetBytes: 1350 * 1024,
    reason: 'VoxCity 3D keeps the Three.js building-extrusion and orbit-control stack isolated to the 3D workflow entry.',
  },
  'node_modules/html2pdf.js/dist/html2pdf': {
    budgetBytes: 1024 * 1024,
    reason: 'Third-party PDF export is intentionally loaded on demand and budgeted separately from the default lazy threshold.',
  },
  'features/urbanAnalytics/UrbanAnalyticsModal': {
    budgetBytes: 2900 * 1024,
    reason: 'The full Urban Analytics workbench is lazy-loaded from the app shell and keeps method catalog, map bridge, and workbench orchestration code out of initial load.',
  },
  'features/education/EducationModule': {
    budgetBytes: 875 * 1024,
    reason: 'The education workspace bundles teaching paths, methodology, and dataset-routing controls behind a dedicated lazy entry.',
  },
  'centerpanel/Flows/CompositeIndicatorFlow': {
    budgetBytes: 570 * 1024,
    reason: 'The composite-indicator workflow intentionally keeps OECD/JRC-style sensitivity, reporting, and publication tooling together behind one lazy flow boundary with map-persistence recovery helpers.',
  },
  'features/urbanAnalytics/RightPanelFourBlock': {
    budgetBytes: 1900 * 1024,
    reason: 'The right-panel support surface intentionally keeps the seed-derived methodology fallback library behind the Urban Analytics workbench boundary.',
  },
  'centerpanel/Tools/components/GeoAILab': {
    budgetBytes: 600 * 1024,
    reason: 'GeoAI Lab intentionally bundles land-cover, NL-to-SQL, object-detection, and provenance controls behind one toolbox lazy boundary.',
  },
  'centerpanel/Flows/CellularAutomataFlow': {
    budgetBytes: 565 * 1024,
    reason: 'Cellular automata keeps scenario execution, temporal publishing, and map handoff controls behind one lazy flow boundary with shared map-persistence recovery helpers.',
  },
  'centerpanel/Flows/UrbanMorphologyFlow': {
    budgetBytes: 565 * 1024,
    reason: 'Urban morphology keeps morphotype generation, worker orchestration, and publication controls behind one lazy flow boundary.',
  },
  'centerpanel/Flows/FacilityOptimisationFlow': {
    budgetBytes: 560 * 1024,
    reason: 'Facility optimisation keeps allocation, comparison, and reporting controls behind one lazy flow boundary.',
  },
  'centerpanel/Tools/components/EOConnectorPanel': {
    budgetBytes: 540 * 1024,
    reason: 'EO connector keeps imagery source configuration and publish controls behind one toolbox lazy boundary.',
  },
  'features/education/EducationLeftRail': {
    budgetBytes: 560 * 1024,
    reason: 'Education left rail keeps teaching-path navigation and related metadata behind the education workspace boundary.',
  },
  'centerpanel/Flows/ObjectDetectionFlow': {
    budgetBytes: 540 * 1024,
    reason: 'Object detection keeps GeoAI publishing and review controls behind one lazy flow boundary.',
  },
};

const args = new Set(process.argv.slice(2));
const shouldPrintJson = args.has('--json');

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  }
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function gzipSize(buffer) {
  return zlib.gzipSync(buffer, { level: zlib.constants.Z_BEST_COMPRESSION }).byteLength;
}

function isBudgetedAsset(fileName) {
  return fileName.endsWith('.js') || fileName.endsWith('.css');
}

function toDisplayName(key, item) {
  const source = typeof item.src === 'string' ? item.src : key;
  if (source === 'index.html') {
    return 'Initial load';
  }
  return source
    .replace(/^src\//, '')
    .replace(/\.tsx?$/, '')
    .replace(/\.jsx?$/, '');
}

function resolveLazyBudget(label) {
  return APPROVED_LAZY_BUDGET_OVERRIDES[label] ?? {
    budgetBytes: LAZY_CHUNK_BUDGET_BYTES,
    reason: null,
  };
}

function collectManifestFiles(manifest, entryKey, seenKeys = new Set(), files = new Set()) {
  if (seenKeys.has(entryKey)) {
    return files;
  }

  const item = manifest[entryKey];
  if (!item) {
    return files;
  }

  seenKeys.add(entryKey);

  if (typeof item.file === 'string' && isBudgetedAsset(item.file)) {
    files.add(item.file);
  }

  for (const cssFile of item.css ?? []) {
    if (isBudgetedAsset(cssFile)) {
      files.add(cssFile);
    }
  }

  for (const importedKey of item.imports ?? []) {
    collectManifestFiles(manifest, importedKey, seenKeys, files);
  }

  return files;
}

function describeAsset(distDir, fileName) {
  const assetPath = path.join(distDir, fileName);
  const buffer = fs.readFileSync(assetPath);
  return {
    file: fileName,
    rawBytes: buffer.byteLength,
    gzipBytes: gzipSize(buffer),
  };
}

function summarizeGroup(distDir, fileNames) {
  const assets = [...fileNames]
    .map((fileName) => describeAsset(distDir, fileName))
    .sort((left, right) => right.rawBytes - left.rawBytes);

  return {
    assets,
    rawBytes: assets.reduce((total, asset) => total + asset.rawBytes, 0),
    gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
  };
}

function toSerializableBudgetResult(result) {
  return {
    ...result,
    assets: result.assets.map((asset) => ({
      file: asset.file,
      rawBytes: asset.rawBytes,
      gzipBytes: asset.gzipBytes,
    })),
  };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(MANIFEST_PATH)) {
  fail(`Bundle budget check requires ${MANIFEST_PATH}. Run a production build first.`);
}

const manifest = readJson(MANIFEST_PATH);
const manifestEntries = Object.entries(manifest);
const initialEntryKey = manifest['index.html'] ? 'index.html' : manifestEntries.find(([, item]) => item.isEntry)?.[0];

if (!initialEntryKey) {
  fail('Bundle budget check could not find an entry chunk in the Vite manifest.');
}

const initialFiles = collectManifestFiles(manifest, initialEntryKey);
const initialSummary = summarizeGroup(DIST_DIR, initialFiles);

const dynamicEntries = manifestEntries
  .filter(([, item]) => item.isDynamicEntry)
  .map(([key, item]) => {
    const label = toDisplayName(key, item);
    const budget = resolveLazyBudget(label);
    const groupFiles = collectManifestFiles(manifest, key);
    const exclusiveFiles = new Set([...groupFiles].filter((fileName) => !initialFiles.has(fileName)));
    const summary = summarizeGroup(DIST_DIR, exclusiveFiles);

    return {
      key,
      label,
      assets: summary.assets,
      rawBytes: summary.rawBytes,
      gzipBytes: summary.gzipBytes,
      budgetBytes: budget.budgetBytes,
      budgetReason: budget.reason,
      hasCustomBudget: budget.budgetBytes !== LAZY_CHUNK_BUDGET_BYTES,
      withinBudget: summary.rawBytes <= budget.budgetBytes,
    };
  })
  .filter((entry) => entry.assets.length > 0)
  .sort((left, right) => right.rawBytes - left.rawBytes);

const overBudgetLazyEntries = dynamicEntries.filter((entry) => !entry.withinBudget);
const largestAssets = [...new Set([...initialFiles, ...dynamicEntries.flatMap((entry) => entry.assets.map((asset) => asset.file))])]
  .map((fileName) => describeAsset(DIST_DIR, fileName))
  .sort((left, right) => right.rawBytes - left.rawBytes)
  .slice(0, 12);

const output = {
  budgets: {
    initialLoadBytes: INITIAL_LOAD_BUDGET_BYTES,
    lazyChunkBytes: LAZY_CHUNK_BUDGET_BYTES,
    approvedLazyBudgetOverrides: Object.fromEntries(
      Object.entries(APPROVED_LAZY_BUDGET_OVERRIDES).map(([label, override]) => [label, {
        budgetBytes: override.budgetBytes,
        reason: override.reason,
      }]),
    ),
  },
  initial: {
    label: 'Initial load',
    budgetBytes: INITIAL_LOAD_BUDGET_BYTES,
    withinBudget: initialSummary.rawBytes <= INITIAL_LOAD_BUDGET_BYTES,
    ...toSerializableBudgetResult(initialSummary),
  },
  lazyEntries: dynamicEntries.map((entry) => ({
    ...entry,
    assets: entry.assets.map((asset) => ({
      file: asset.file,
      rawBytes: asset.rawBytes,
      gzipBytes: asset.gzipBytes,
    })),
  })),
  largestAssets: largestAssets.map((asset) => ({
    file: asset.file,
    rawBytes: asset.rawBytes,
    gzipBytes: asset.gzipBytes,
  })),
};

if (shouldPrintJson) {
  console.log(JSON.stringify(output, null, 2));
  process.exit(initialSummary.rawBytes <= INITIAL_LOAD_BUDGET_BYTES && overBudgetLazyEntries.length === 0 ? 0 : 1);
}

console.log('Bundle budget summary');
console.log(`- Initial load: ${formatBytes(initialSummary.rawBytes)} raw / ${formatBytes(initialSummary.gzipBytes)} gzip (budget ${formatBytes(INITIAL_LOAD_BUDGET_BYTES)} raw)`);

for (const entry of dynamicEntries.slice(0, 10)) {
  const budgetLabel = entry.hasCustomBudget ? ` (budget ${formatBytes(entry.budgetBytes)} raw, approved exception)` : '';
  console.log(`- Lazy ${entry.label}: ${formatBytes(entry.rawBytes)} raw / ${formatBytes(entry.gzipBytes)} gzip${budgetLabel}${entry.withinBudget ? '' : ' [OVER BUDGET]'}`);
}

console.log('- Largest budgeted assets:');
for (const asset of largestAssets.slice(0, 8)) {
  console.log(`  ${asset.file}: ${formatBytes(asset.rawBytes)} raw / ${formatBytes(asset.gzipBytes)} gzip`);
}

const failures = [];
if (initialSummary.rawBytes > INITIAL_LOAD_BUDGET_BYTES) {
  failures.push(`Initial load exceeds budget: ${formatBytes(initialSummary.rawBytes)} > ${formatBytes(INITIAL_LOAD_BUDGET_BYTES)}`);
}
for (const entry of overBudgetLazyEntries) {
  failures.push(`Lazy chunk exceeds budget for ${entry.label}: ${formatBytes(entry.rawBytes)} > ${formatBytes(entry.budgetBytes)}`);
}

if (failures.length > 0) {
  console.error('Bundle budgets failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Bundle budgets passed.');
