import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const srcRoot = join(repoRoot, 'src');
const sourceExtensions = new Set(['.ts', '.tsx', '.css']);
const guardedModalZIndexFiles = [
  'src/components/molecules/Modal.tsx',
  'src/components/ide/GlobalSearch.tsx',
  'src/components/ai/panel/KeysModal.tsx',
  'src/components/ai/settings/AiSettingsModal.tsx',
  'src/components/ai/settings/AiSettingsModal.module.css',
  'src/components/settings/SettingsModal.tsx',
  'src/components/ide/UnsavedChangesDialog.tsx',
  'src/features/urbanAnalytics/WelcomeModal.tsx',
  'src/centerpanel/components/MapServiceDialog.tsx',
  'src/centerpanel/components/map/MapStartDialog.tsx',
  'src/centerpanel/components/map/MapDialogShell.tsx',
];

function listProductionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') return [];
      return listProductionFiles(fullPath);
    }
    return sourceExtensions.has(extname(entry.name)) ? [fullPath] : [];
  });
}

function rel(filePath: string): string {
  return relative(repoRoot, filePath).replace(/\\/g, '/');
}

export function findRawZIndexLiterals(
  filePath: string,
  source: string,
  allowDocumentedExceptions = false,
): string[] {
  const pattern = /\b(?:z-index\s*:\s*|zIndex\s*[:=]\s*)(?:['"])?\d{2,}/g;
  const hits: string[] = [];
  for (const match of source.matchAll(pattern)) {
    const contextBefore = source.slice(Math.max(0, match.index - 220), match.index);
    if (allowDocumentedExceptions && contextBefore.includes('one tier below the shared modal level')) {
      continue;
    }
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    hits.push(`${filePath}:${line}: ${match[0]}`);
  }
  return hits;
}

function jsxAttribute(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  name: string,
): ts.JsxAttribute | undefined {
  return node.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function jsxAttributeStringValue(attribute: ts.JsxAttribute | undefined): string | null {
  if (!attribute?.initializer) return null;
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  if (ts.isJsxExpression(attribute.initializer)) {
    const expression = attribute.initializer.expression;
    return expression && ts.isStringLiteral(expression) ? expression.text : null;
  }
  return null;
}

function isOpeningLike(node: ts.Node): node is ts.JsxOpeningElement | ts.JsxSelfClosingElement {
  return ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node);
}

export function findUnnamedDialogs(filePath: string, source: string): string[] {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const failures: string[] = [];

  const visit = (node: ts.Node) => {
    if (isOpeningLike(node) && jsxAttributeStringValue(jsxAttribute(node, 'role')) === 'dialog') {
      const hasLabel = Boolean(
        jsxAttribute(node, 'aria-label') ||
        jsxAttribute(node, 'aria-labelledby') ||
        jsxAttribute(node, 'ariaLabel')
      );
      if (!hasLabel) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        failures.push(`${filePath}:${line + 1}: role="dialog" has no aria-label or aria-labelledby`);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return failures;
}

describe('modal accessibility guardrails (MFP-20)', () => {
  it('fixture checks catch raw z-index literals but allow tokenized modal tiers', () => {
    expect(findRawZIndexLiterals('fixture.tsx', '<div style={{ zIndex: 9999 }} />')).toHaveLength(1);
    expect(findRawZIndexLiterals('fixture.css', '.modal { z-index: 2200; }')).toHaveLength(1);
    expect(findRawZIndexLiterals('fixture.tsx', "<div style={{ zIndex: 'var(--z-modal)' }} />")).toEqual([]);
    expect(findRawZIndexLiterals('fixture.css', '.modal { z-index: var(--z-modal); }')).toEqual([]);
  });

  it('fixture checks catch unnamed dialogs but allow aria-label and aria-labelledby', () => {
    expect(findUnnamedDialogs('fixture.tsx', 'export function Demo(){ return <div role="dialog" />; }')).toHaveLength(1);
    expect(findUnnamedDialogs('fixture.tsx', 'export function Demo(){ return <div role="dialog" aria-label="Named" />; }')).toEqual([]);
    expect(findUnnamedDialogs('fixture.tsx', 'export function Demo(){ return <div role="dialog" aria-labelledby="title" />; }')).toEqual([]);
  });

  it('keeps production modal files on z-index tokens and named dialog roles', () => {
    const files = listProductionFiles(srcRoot);
    const rawZIndexFailures = guardedModalZIndexFiles.flatMap((relativePath) =>
      findRawZIndexLiterals(
        relativePath,
        readFileSync(join(repoRoot, relativePath), 'utf8'),
        true,
      ),
    );
    const unnamedDialogFailures = files
      .filter((filePath) => extname(filePath) === '.tsx')
      .flatMap((filePath) => findUnnamedDialogs(rel(filePath), readFileSync(filePath, 'utf8')));

    expect(rawZIndexFailures).toEqual([]);
    expect(unnamedDialogFailures).toEqual([]);
  });
});
