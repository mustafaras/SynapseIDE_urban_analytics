// @vitest-environment jsdom
/**
 * Tests for rightPanelUtils.ts (Prompt 28 QA)
 *
 * Covers sanitizeHtml, extractPlainText, loadLS/saveLS, and generatePageDoc.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  sanitizeHtml,
  extractPlainText,
  loadLS,
  saveLS,
  generatePageDoc,
} from '../rightPanelUtils';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
describe('sanitizeHtml', () => {
  it('preserves allowed tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    expect(sanitizeHtml(html)).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('strips disallowed tags but keeps their text content', () => {
    const html = '<script>alert("xss")</script><p>safe</p>';
    expect(sanitizeHtml(html)).toContain('safe');
    expect(sanitizeHtml(html)).not.toContain('<script');
  });

  it('removes disallowed attributes', () => {
    const html = '<p onclick="alert(1)" class="ok">text</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onclick');
    expect(result).toContain('class="ok"');
  });

  it('strips javascript: hrefs', () => {
    // eslint-disable-next-line no-script-url
    const html = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('javascript' + ':');
    expect(result).toContain('click');
  });

  it('preserves safe hrefs', () => {
    const html = '<a href="https://example.com" target="_blank">link</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
  });

  it('handles nested disallowed tags', () => {
    const html = '<div><iframe><p>inner</p></iframe></div>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('inner');
  });

  it('preserves table markup', () => {
    const html = '<table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Val</td></tr></tbody></table>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<table>');
    expect(result).toContain('<th>Col</th>');
    expect(result).toContain('<td>Val</td>');
  });

  it('handles empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips style attributes', () => {
    const html = '<p style="color:red">red text</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('style=');
    expect(result).toContain('red text');
  });
});

// ---------------------------------------------------------------------------
describe('extractPlainText', () => {
  it('extracts text from HTML', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    expect(extractPlainText(html)).toBe('Hello world');
  });

  it('collapses whitespace', () => {
    const html = '<p>Hello  \n  world</p>';
    expect(extractPlainText(html)).toBe('Hello world');
  });

  it('returns empty string for empty input', () => {
    expect(extractPlainText('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
describe('loadLS / saveLS', () => {
  it('saveLS stores and loadLS retrieves a value', () => {
    saveLS('test.key', { a: 1 });
    expect(loadLS('test.key', null)).toEqual({ a: 1 });
  });

  it('loadLS returns fallback for missing key', () => {
    expect(loadLS('missing.key', 'default')).toBe('default');
  });

  it('loadLS returns fallback for corrupted JSON', () => {
    localStorage.setItem('broken.key', '{not valid json');
    expect(loadLS('broken.key', 42)).toBe(42);
  });
});

// ---------------------------------------------------------------------------
describe('generatePageDoc', () => {
  it('wraps inner HTML in a complete HTML document', () => {
    const result = generatePageDoc('<h1>Title</h1>');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('</html>');
  });

  it('escapes angle brackets in the title', () => {
    const result = generatePageDoc('<p>content</p>', 'A <b>title</b>');
    expect(result).toContain('<title>A &lt;b>title&lt;/b></title>');
  });

  it('uses default title when not provided', () => {
    const result = generatePageDoc('<p>x</p>');
    expect(result).toContain('<title>Urban Analytics Preview</title>');
  });
});
