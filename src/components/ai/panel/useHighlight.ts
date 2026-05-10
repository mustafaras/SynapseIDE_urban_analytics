/**
 * useHighlight — Prism.js-backed syntax highlighter hook.
 * Returns an escaped/tokenised HTML string ready for dangerouslySetInnerHTML.
 */
import { useMemo } from 'react';
import Prism from 'prismjs';

// ── Language grammars ────────────────────────────────────────────────────────
// Order matters: dependencies must come before dependents.
import 'prismjs/components/prism-markup';       // html
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-diff';

// ── fence-info → Prism grammar name ─────────────────────────────────────────
const PRISM_LANG: Record<string, string> = {
  ts:         'typescript',
  typescript: 'typescript',
  tsx:        'tsx',
  js:         'javascript',
  javascript: 'javascript',
  jsx:        'jsx',
  py:         'python',
  python:     'python',
  sh:         'bash',
  bash:       'bash',
  shell:      'bash',
  zsh:        'bash',
  css:        'css',
  scss:       'scss',
  sass:       'scss',
  html:       'markup',
  xml:        'markup',
  json:       'json',
  jsonc:      'json',
  yaml:       'yaml',
  yml:        'yaml',
  rs:         'rust',
  rust:       'rust',
  go:         'go',
  java:       'java',
  c:          'c',
  h:          'c',
  cpp:        'cpp',
  cc:         'cpp',
  hpp:        'cpp',
  sql:        'sql',
  kt:         'kotlin',
  kotlin:     'kotlin',
  rb:         'ruby',
  ruby:       'ruby',
  swift:      'swift',
  dart:       'dart',
  diff:       'diff',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Synchronously highlight `code` for `lang` fence info string.
 *  Returns tokenised HTML; falls back to escaped plain text. */
export function highlight(code: string, lang?: string): string {
  const pLang = PRISM_LANG[(lang ?? '').trim().toLowerCase()];
  if (!pLang) return escapeHtml(code);
  const grammar = Prism.languages[pLang];
  if (!grammar) return escapeHtml(code);
  try {
    return Prism.highlight(code, grammar, pLang);
  } catch {
    return escapeHtml(code);
  }
}

/** React hook — memoises the highlighted HTML. */
export function useHighlight(code: string, lang?: string): string {
  return useMemo(() => highlight(code, lang), [code, lang]);
}
