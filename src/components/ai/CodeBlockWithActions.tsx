import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Check, ClipboardCopy, FileDiff, FilePenLine, FilePlus, Replace, Sparkles } from 'lucide-react';
import { applyUnifiedDiff } from '@/lib/ai/diff';
import type { ParsedBlock } from '@/lib/ai/codeblocks';
import { useAiSettingsStore } from '@/stores/useAiSettingsStore';
import { getLangColor, getLangLabel } from '@/components/ai/panel/code-lang';
import { useHighlight } from '@/components/ai/panel/useHighlight';
import {
  CodeActionBtn,
  CodeActionGroup,
  CodeActionSep,
  CodeBlockRoot,
  CodeContent,
  CodeFilePath,
  CodeHeader,
  CodeBody,
  CopyCodeBtn,
  LangDot,
  LangLabel,
  LineNumbers,
} from '@/components/ai/panel/styles';

export interface CodeBlockWithActionsProps {
  block: ParsedBlock;
  index?: number;
  enableActions?: boolean;
  onExplain?: (code: string) => void;
  onAutoInserted?: () => void;
}

// ── editor bridge ────────────────────────────────────────────────────────────
function copyToClipboard(text: string) { try { navigator.clipboard.writeText(text); } catch {} }
declare global { interface Window { __AI_EDITOR_BRIDGE__?: EditorBridge } }

interface EditorBridge {
  insertAtCursor?: (c: string) => void;
  replaceSelection?: (c: string) => void;
  fileExists?: (p: string) => boolean;
  writeFile?: (p: string, c: string, opts?: { create?: boolean; overwrite?: boolean }) => void;
  readFile?: (p: string) => string | undefined;
  confirm?: (msg: string) => boolean;
  showToast?: (msg: string, level?: string) => void;
}

function getBridge(): EditorBridge { return window.__AI_EDITOR_BRIDGE__ || {}; }
function toast(msg: string) { try { getBridge().showToast?.(msg, 'info'); } catch {} }

// ── Component ─────────────────────────────────────────────────────────────────
export const CodeBlockWithActions: React.FC<CodeBlockWithActionsProps> = ({
  block, enableActions = true, onExplain, onAutoInserted,
}) => {
  useAiSettingsStore(s => s.ui);
  const ref = useRef<HTMLDivElement | null>(null);
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  const editor = useMemo<EditorBridge>(() => getBridge(), []);
  const lang    = block.lang || '';
  const content = block.content;
  const path    = block.path;
  const isDiff  = block.isDiff;

  const effectiveLang = isDiff ? 'diff' : lang;
  const langColor = getLangColor(effectiveLang);
  const langLabel = getLangLabel(effectiveLang);
  const highlighted = useHighlight(content, effectiveLang);

  // Build line numbers
  const lineNums = useMemo(() => {
    const n = content.split('\n').length;
    return Array.from({ length: n }, (_, i) => i + 1).join('\n');
  }, [content]);

  // ── actions ──────────────────────────────────────────────────────────────
  const doInsert = useCallback(() => {
    if (!enableActions) return;
    if (editor?.insertAtCursor) {
      try { editor.insertAtCursor(content); toast('Inserted at cursor'); onAutoInserted?.(); }
      catch { copyToClipboard(content); toast('Copied (insert failed)'); }
    } else {
      copyToClipboard(content); toast('Copied to clipboard (no editor)');
    }
  }, [content, enableActions, editor, onAutoInserted]);

  const doReplace = useCallback(() => {
    if (!enableActions) return;
    if (editor?.replaceSelection) {
      try { editor.replaceSelection(content); toast('Replaced selection'); }
      catch { doInsert(); }
    } else { doInsert(); }
  }, [content, enableActions, editor, doInsert]);

  const inferUntitled = useCallback(() => {
    const ext = (lang || 'txt').split(/[^a-zA-Z0-9]/)[0] || 'txt';
    let n = 1; let candidate = `untitled-${n}.${ext}`;
    while (editor?.fileExists?.(candidate)) { n++; candidate = `untitled-${n}.${ext}`; if (n > 99) break; }
    return candidate;
  }, [lang, editor]);

  const doNewFile = useCallback(() => {
    if (!enableActions) return;
    const target = path || inferUntitled();
    const exists = !!editor?.fileExists?.(target);
    try { editor?.writeFile?.(target, content, { create: !exists, overwrite: exists }); toast(`${exists ? 'Updated' : 'Created'}: ${target}`); }
    catch { copyToClipboard(content); toast('Copied (write failed)'); }
  }, [content, enableActions, editor, inferUntitled, path]);

  const doCopy = useCallback(() => {
    copyToClipboard(content);
    toast('Copied');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const doExplain = useCallback(() => {
    if (!enableActions) return;
    onExplain?.(content);
  }, [content, enableActions, onExplain]);

  const doApplyPatch = useCallback(() => {
    if (!enableActions || !isDiff) return;
    setApplying(true);
    try {
      applyUnifiedDiff(
        (p) => editor?.readFile?.(p),
        (p, c, o) => editor?.writeFile?.(p, c, o),
        content,
        { confirmOverwrite: false }
      );
      toast('Patch applied');
    } catch { toast('Patch failed'); }
    finally { setApplying(false); }
  }, [enableActions, isDiff, editor, content]);

  return (
    <CodeBlockRoot ref={ref} role="group" aria-label="Code block">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <CodeHeader>
        <LangDot $color={langColor} />
        <LangLabel>{langLabel}</LangLabel>
        {path && <CodeFilePath title={path}>{path}</CodeFilePath>}

        <CodeActionGroup role="toolbar" aria-label="Code actions">
          {/* Editor sync buttons (icon-only) */}
          {isDiff ? (
            <CodeActionBtn
              onClick={doApplyPatch}
              title={applying ? 'Applying…' : 'Apply patch'}
              aria-label="Apply patch"
              disabled={!enableActions || applying}
            >
              <FileDiff size={13} />
            </CodeActionBtn>
          ) : (
            <>
              <CodeActionBtn onClick={doInsert} title="Insert at cursor" aria-label="Insert at cursor" disabled={!enableActions}>
                <FilePenLine size={13} />
              </CodeActionBtn>
              <CodeActionBtn onClick={doReplace} title="Replace selection" aria-label="Replace selection" disabled={!enableActions}>
                <Replace size={13} />
              </CodeActionBtn>
              <CodeActionBtn onClick={doNewFile} title="Open in new file" aria-label="Open in new file" disabled={!enableActions}>
                <FilePlus size={13} />
              </CodeActionBtn>
              <CodeActionBtn onClick={doExplain} title="Explain with AI" aria-label="Explain with AI" disabled={!enableActions}>
                <Sparkles size={13} />
              </CodeActionBtn>
            </>
          )}

          <CodeActionSep aria-hidden />

          {/* Primary copy button — text label, always visible */}
          <CopyCodeBtn onClick={doCopy} aria-label={copied ? 'Copied!' : 'Copy code'} data-ok={copied ? true : undefined}>
            {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
            {copied ? 'Copied!' : 'Copy code'}
          </CopyCodeBtn>
        </CodeActionGroup>
      </CodeHeader>

      {/* ── Code body with line numbers ───────────────────────────────── */}
      <CodeBody>
        <LineNumbers aria-hidden>{lineNums}</LineNumbers>
        <CodeContent>
          {/* eslint-disable-next-line react/no-danger */}
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </CodeContent>
      </CodeBody>
    </CodeBlockRoot>
  );
};

export default CodeBlockWithActions;
