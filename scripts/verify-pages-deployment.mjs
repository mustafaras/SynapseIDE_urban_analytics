#!/usr/bin/env node

const EXPECTED_BASE_PATH = '/SynapseIDE_urban_analytics/';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = 'true';
    }
  }
  return args;
}

function fail(message) {
  console.error(`[pages verify] ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  });
  assert(response.ok, `${url} returned ${response.status}`);
  return {
    contentType: response.headers.get('content-type') || '',
    text: await response.text(),
  };
}

function readMeta(html, name) {
  const pattern = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["'][^>]*>`, 'i');
  return html.match(pattern)?.[1] ?? null;
}

function findModuleScripts(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
}

const args = parseArgs(process.argv.slice(2));
const pageUrlInput = args.url || process.env.PAGE_URL;
const expectedShaInput = args.sha || process.env.EXPECTED_SHA || '';

assert(pageUrlInput, 'Missing --url or PAGE_URL');

const expectedShortSha = expectedShaInput.trim().slice(0, 12);
const pageUrl = new URL(pageUrlInput);
if (!pageUrl.pathname.endsWith('/')) {
  pageUrl.pathname = `${pageUrl.pathname}/`;
}
pageUrl.searchParams.set('synapse_verify', `${Date.now()}-${expectedShortSha || 'latest'}`);

const htmlResponse = await fetchText(pageUrl.toString());
const html = htmlResponse.text;
const actualSha = readMeta(html, 'synapse-build-sha');
assert(actualSha, 'Missing synapse-build-sha meta tag in deployed HTML');
if (expectedShortSha) {
  assert(
    actualSha === expectedShortSha,
    `Expected build sha ${expectedShortSha}, but deployed HTML reports ${actualSha}`,
  );
}

const appVersion = readMeta(html, 'synapse-app-version');
const buildTime = readMeta(html, 'synapse-build-time');
assert(appVersion, 'Missing synapse-app-version meta tag in deployed HTML');
assert(buildTime, 'Missing synapse-build-time meta tag in deployed HTML');

const scripts = findModuleScripts(html);
assert(scripts.length > 0, 'No module script found in deployed HTML');
const entryScript = scripts.find((src) => src.includes('/assets/index-')) ?? scripts[0];
const entryUrl = new URL(entryScript, pageUrl);
assert(
  entryUrl.pathname.startsWith(`${EXPECTED_BASE_PATH}assets/`),
  `Entry asset ${entryUrl.pathname} is not under ${EXPECTED_BASE_PATH}assets/`,
);

const entryResponse = await fetchText(entryUrl.toString());
assert(
  /\b(javascript|ecmascript)\b/i.test(entryResponse.contentType),
  `Entry asset ${entryUrl.pathname} returned content-type ${entryResponse.contentType || '(none)'}`,
);
assert(
  !/^\s*<!doctype html>/i.test(entryResponse.text),
  `Entry asset ${entryUrl.pathname} returned HTML fallback instead of JavaScript`,
);

console.log(`[pages verify] ok sha=${actualSha} version=${appVersion} built=${buildTime} entry=${entryUrl.pathname}`);
