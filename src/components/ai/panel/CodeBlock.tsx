import React, { useCallback, useMemo, useState } from 'react';
import { Check, ClipboardCopy, FilePenLine, FilePlus, Replace } from 'lucide-react';
import editorBridge from '@/services/editorBridge';
import { getLangColor, getLangLabel, mapFenceToLangAndExt } from './code-lang';
import { useHighlight } from './useHighlight';
import {
  CodeActionBtn,
  CodeActionGroup,
  CodeActionSep,
  CodeBlockRoot,
  CodeBody,
  CodeContent,
  CodeFilePath,
  CodeHeader,
  CopyCodeBtn,
  LangDot,
  LangLabel,
  LineNumbers,
} from './styles';

type Props = { code: string; info?: string; path?: string };

const CodeBlock: React.FC<Props> = ({ code, info, path }) => {
  const [copied, setCopied] = useState(false);
  const highlighted = useHighlight(code, info);

  const langColor = getLangColor(info);
  const langLabel = getLangLabel(info);

  // Build line numbers string
  const lineNums = useMemo(() => {
    const n = code.split('\n').length;
    return Array.from({ length: n }, (_, i) => i + 1).join('\n');
  }, [code]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) { /* silent */ }
  }, [code]);

  const onInsert = useCallback(async () => {
    const { monaco } = mapFenceToLangAndExt(info);
    const language = monaco as Parameters<typeof editorBridge.insertIntoActive>[0]['language'];
    await editorBridge.insertIntoActive(language ? { code, language } : { code });
  }, [code, info]);

  const onNewFile = useCallback(async () => {
    const { ext } = mapFenceToLangAndExt(info);
    const name = path || `synapse.snippet.${Date.now()}.${ext}`;
    await editorBridge.openNewTab({ filename: name, code });
  }, [code, info, path]);

  const onReplace = useCallback(async () => {
    const { monaco } = mapFenceToLangAndExt(info);
    const language = monaco as Parameters<typeof editorBridge.replaceSelection>[0]['language'];
    await editorBridge.replaceSelection(language ? { code, language } : { code });
  }, [code, info]);

  return (
    <CodeBlockRoot>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <CodeHeader>
        <LangDot $color={langColor} />
        <LangLabel>{langLabel}</LangLabel>
        {path ? <CodeFilePath title={path}>{path}</CodeFilePath> : null}

        {/* Editor sync actions (icon-only) */}
        <CodeActionGroup role="toolbar" aria-label="Editor sync actions">
          <CodeActionBtn onClick={onInsert} title="Insert at cursor" aria-label="Insert at cursor">
            <FilePenLine size={13} />
          </CodeActionBtn>
          <CodeActionBtn onClick={onReplace} title="Replace selection" aria-label="Replace selection">
            <Replace size={13} />
          </CodeActionBtn>
          <CodeActionBtn onClick={onNewFile} title="Open in new file" aria-label="Open in new file">
            <FilePlus size={13} />
          </CodeActionBtn>
          <CodeActionSep aria-hidden />
          {/* Primary copy button — text label like ChatGPT */}
          <CopyCodeBtn onClick={onCopy} aria-label={copied ? 'Copied!' : 'Copy code'} data-ok={copied ? true : undefined}>
            {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
            {copied ? 'Copied!' : 'Copy code'}
          </CopyCodeBtn>
        </CodeActionGroup>
      </CodeHeader>

      {/* ── Code body with line numbers ──────────────────────────── */}
      <CodeBody>
        <LineNumbers aria-hidden>{lineNums}</LineNumbers>
        <CodeContent>
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </CodeContent>
      </CodeBody>
    </CodeBlockRoot>
  );
};

export default React.memo(CodeBlock);


