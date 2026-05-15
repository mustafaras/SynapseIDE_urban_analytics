import styled from 'styled-components';


export const PanelRoot = styled.aside`

  width: 100%;
  min-width: 0;
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;

  background: var(--ai-surface, var(--syn-surface-panel, #232832));
  border-left: none;
  color: var(--syn-text-default, #d7dce5);
  font-family: var(--font-code, "JetBrains Mono", "Coder", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace);
  box-shadow: none;

  --ai-black: var(--ai-surface, var(--syn-surface-panel, #232832));
  --ai-black-alt: var(--ai-surface-alt, var(--syn-surface-elevated, #2b3038));
  --ai-border: var(--syn-border-subtle, #343a44);
  --ai-border-strong: var(--syn-border-strong, #4a5260);
  --ai-gold: var(--syn-interaction-active, #3794ff);
  --ai-gold-soft: var(--syn-status-info, #6aa9ff);
  --ai-text-secondary: var(--syn-text-secondary, #a4adbb);
  & button,
  & select,
  & input,
  & textarea { font-family: inherit; }
`;

export const Section = styled.section`
  padding: 12px 14px;
  color: var(--syn-text-default, #d7dce5);
`;

export const HeaderRow = styled(Section)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-height: 56px;
  padding: 10px 16px;
  border-bottom: none;
  background: transparent;
`;

export const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
  align-items: flex-start;
  text-align: left;
`;

export const Title = styled.div`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--syn-text-default, #d7dce5);
`;

export const Subtitle = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: var(--ai-text-secondary, var(--syn-text-secondary, #a4adbb));
  letter-spacing: 0.3px;
`;


export const ProvidersRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
`;


export const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

export const BrandIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 12%, transparent);
  &::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    left: 10px;
    top: 10px;
    border-radius: 50%;
  background: var(--ai-gold, #3794ff);
    box-shadow:
  10px 0 0 0 var(--ai-gold, #3794ff),
  0 10px 0 0 var(--ai-gold, #3794ff),
  10px 10px 0 0 var(--ai-gold, #3794ff);
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--syn-interaction-active, #3794ff) 35%, transparent));
  }
`;

export const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  align-items: flex-start;
`;

export const ControlsRow = styled(Section)`
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: none;
`;


export const QuickActionsBar = styled(Section)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px 4px;
  background: transparent;
  border-top: none;
  border-bottom: none;
`;

export const GhostButton = styled.button`
  appearance: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid var(--syn-border-subtle, #343a44);
  background: color-mix(in srgb, var(--syn-surface-elevated, #2b3038) 72%, transparent);
  color: var(--syn-text-secondary, #a4adbb);
  cursor: not-allowed;
`;

export const ScrollArea = styled(Section)`
  flex: 1;
  overflow: auto;
  padding: 12px 14px 8px;
  color: var(--syn-text-secondary, #a4adbb);
`;

export const EmptyState = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

export const ComposerContainer = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  position: relative;
  z-index: 5;
  margin-top: auto;
  background: transparent;
  border-top: none;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 40px;
  max-height: 160px;
  resize: none;
  border-radius: 8px;
  border: none;
  background: color-mix(in srgb, var(--syn-surface-elevated, #2b3038) 72%, transparent);
  color: var(--syn-text-default, #d7dce5);
  padding: 10px 12px;
  font-family: var(--font-code, "JetBrains Mono", "Coder", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace);
  font-size: 12px;
  line-height: 1.5;
  outline: none;
  &::placeholder { color: var(--syn-text-muted, #778190); }
  &:focus { background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 8%, var(--syn-surface-elevated, #2b3038)); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 55%, transparent);
  }
`;

export const Hint = styled.div`
  font-size: 11px;
  color: var(--syn-text-secondary, #a4adbb);
`;

export const RightSide = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const ActionButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  color: var(--syn-text-default, #d7dce5);
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 100ms, color 100ms;
  &:hover { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 70%, transparent); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:focus-visible { outline: none; box-shadow: 0 0 0 1px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 55%, transparent); }
`;

export const SendButton = styled(ActionButton)`
  background: var(--syn-interaction-active, #3794ff);
  color: var(--syn-text-inverse, #0f1218);
  font-weight: 600;
  &:hover { background: var(--syn-status-info, #6aa9ff); }
`;

export const StopButton = styled(ActionButton)`
  background: color-mix(in srgb, var(--syn-status-error, #f87171) 70%, transparent);
  color: var(--syn-text-default, #d7dce5);
  &:hover { background: color-mix(in srgb, var(--syn-status-error, #f87171) 88%, transparent); }
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const TokenText = styled.small`
  color: var(--ai-text-secondary);
  font-size: 11px;
`;


export const JumpToLatestButton = styled.button`
  position: absolute;
  right: 12px;
  bottom: 12px;
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--syn-interaction-active, #3794ff) 36%, transparent);
  background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 15%, var(--syn-surface-elevated, #2b3038));
  color: var(--syn-text-default, #d7dce5);
  border-radius: 9999px;
  padding: 8px 10px;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  line-height: 1;
  font-size: 14px;
  transition: transform 120ms var(--syn-easing-bauhaus), box-shadow 120ms var(--syn-easing-bauhaus), background 120ms var(--syn-easing-bauhaus);
  z-index: 2;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  &:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 70%, transparent);
    outline-offset: 2px;
  }
`;



// Prose font — sans-serif for readability, monospace only inside code tags
const PROSE_FONT = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;`;

export const Bubble = styled.div<{ $variant: 'user' | 'assistant' }>`
  ${PROSE_FONT}
  word-break: break-word;
  line-height: 1.6;

  ${({ $variant }) => $variant === 'user' ? `
    /* User: compact interaction-tinted pill, right-aligned tail */
    max-width: 100%;
    padding: 8px 12px;
    border-radius: 10px 10px 2px 10px;
    background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 10%, transparent);
    font-size: 12.5px;
    color: var(--syn-text-default, #d7dce5);
    letter-spacing: 0.1px;
  ` : `
    /* Assistant: transparent, full width, clean prose */
    max-width: 100%;
    padding: 2px 0;
    border-radius: 0;
    background: transparent;
    font-size: 13px;
    color: var(--syn-text-default, #d7dce5);
    letter-spacing: 0.12px;
  `}
`;


export const Row = styled.div<{ $align: 'start' | 'end' }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
  padding: 4px 8px;
  gap: 3px;
  /* leave space on opposite side so bubbles never span full width */
  ${({ $align }) => $align === 'end' ? 'padding-left: 40px;' : 'padding-right: 40px;'}
`;


import { codeInline, heading, text } from '../../../ui/theme/typography';

export const MarkdownRoot = styled.div`
  /* Prose: sans-serif for readability */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.65;
  color: var(--syn-text-default, #d7dce5);

  p { margin: 0 0 9px; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 0 0 9px 20px; padding: 0; }
  li { margin: 3px 0; }
  a { color: var(--syn-text-link, #3794ff); text-decoration: none; opacity: 0.9; &:hover { opacity: 1; text-decoration: underline; } }

  /* Inline code stays monospace */
  :not(pre) > code {
    font-family: var(--font-code, 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace);
    font-size: 11.5px;
    background: color-mix(in srgb, var(--syn-surface-hover, #303642) 70%, transparent);
    color: var(--syn-status-info, #6aa9ff);
    padding: 1px 5px;
    border-radius: 3px;
    ${codeInline()}
  }

  h1, h2, h3, h4 { margin: 14px 0 5px; font-weight: 600; letter-spacing: -0.2px; }
  h1 { font-size: 15px; color: var(--syn-text-default, #d7dce5); ${heading(1)} }
  h2 { font-size: 14px; color: var(--syn-text-default, #d7dce5); ${heading(2)} }
  h3 { font-size: 13px; color: var(--syn-text-secondary, #a4adbb); ${heading(3)} }
  h4, h5, h6 { font-size: 12px; color: var(--syn-text-secondary, #a4adbb); ${text('body')}; font-weight: 600; }

  strong { font-weight: 600; color: var(--syn-text-default, #d7dce5); }
  em { color: var(--syn-text-secondary, #a4adbb); }
  hr { border: none; border-top: 1px solid var(--syn-border-subtle, #343a44); margin: 10px 0; }
  blockquote {
    border-left: 2px solid color-mix(in srgb, var(--syn-status-warning, #d6a84f) 58%, transparent);
    margin: 6px 0;
    padding-left: 10px;
    color: var(--syn-text-secondary, #a4adbb);
    font-style: italic;
  }
`;

// ── Code Block — ChatGPT/Codex-style ──────────────────────────────────────
//
//  Layout:
//    ┌───────────────────────────────────────────────────────────────┐
//    │  ● typescript  ·  src/utils/helper.ts      [Insert][Copy code]│  ← CodeHeader
//    ├───────────────────────────────────────────────────────────────┤
//    │  1  const x = 42;                                             │  ← code+line-nos
//    │  2  …                                                         │
//    └───────────────────────────────────────────────────────────────┘

export const CodeBlockRoot = styled.div`
  position: relative;
  margin: 12px 0 4px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--syn-surface-editor, #1f232a);
  border: 1px solid var(--syn-border-subtle, #343a44);
  font-family: var(--font-code, 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);

  /* ── Prism token colours (VS Code Dark+ palette) ── */
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata       { color: #6a9955; font-style: italic; }
  .token.keyword,
  .token.rule,
  .token.important   { color: #569cd6; }
  .token.builtin     { color: #4ec9b0; }
  .token.class-name,
  .token.tag         { color: #4ec9b0; }
  .token.attr-name   { color: #9cdcfe; }
  .token.attr-value,
  .token.string      { color: #ce9178; }
  .token.number,
  .token.boolean     { color: #b5cea8; }
  .token.function    { color: #dcdcaa; }
  .token.property    { color: #9cdcfe; }
  .token.constant,
  .token.symbol      { color: #4fc1ff; }
  .token.regex       { color: #d16969; }
  .token.operator    { color: #d4d4d4; }
  .token.punctuation { color: #808080; }
  .token.variable    { color: #9cdcfe; }
  .token.namespace   { color: #4ec9b0; }
  .token.selector    { color: #d7ba7d; }
  .token.atrule      { color: #ce9178; }
  .token.unit        { color: #b5cea8; }
  /* diff */
  .token.deleted     { color: #f85149; background: rgba(248,81,73,0.1); }
  .token.inserted    { color: #3fb950; background: rgba(63,185,80,0.1); }
  .token.coord       { color: #79c0ff; }

  pre {
    margin: 0;
    overflow-x: auto;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--syn-text-muted, #778190) 28%, transparent) transparent;
    &::-webkit-scrollbar { height: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--syn-text-muted, #778190) 28%, transparent); border-radius: 2px; }
  }
  code {
    display: block;
    font-family: inherit;
    font-size: 12.5px;
    line-height: 1.6;
    white-space: pre;
    color: #d4d4d4;
    tab-size: 2;
  }
`;

export const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 14px;
  background: var(--syn-surface-elevated, #2b3038);
  border-bottom: 1px solid var(--syn-border-subtle, #343a44);
  min-height: 36px;
`;

export const LangDot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  opacity: 0.9;
`;

export const LangLabel = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--syn-text-muted, #778190);
  letter-spacing: 0.1px;
  user-select: none;
  flex-shrink: 0;
`;

export const CodeFilePath = styled.span`
  font-family: var(--font-code, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  color: color-mix(in srgb, var(--syn-text-muted, #778190) 55%, transparent);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* Right-side action cluster — always visible (like ChatGPT) */
export const CodeActionGroup = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

/* Icon-only editor sync buttons */
export const CodeActionBtn = styled.button`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--syn-text-muted, #778190);
  cursor: pointer;
  transition: background 80ms, color 80ms;
  flex-shrink: 0;
  &:hover         { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 70%, transparent); color: var(--syn-text-default, #d7dce5); }
  &[data-ok=true] { color: var(--syn-status-valid, #4ec27d); }
  &:disabled      { opacity: 0.3; cursor: not-allowed; }
  &:focus-visible { outline: 1px solid var(--syn-interaction-focus-ring, #3794ff); outline-offset: 1px; }
`;

/* "Copy code" primary button — text + icon, always visible */
export const CopyCodeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid var(--syn-border-subtle, #343a44);
  border-radius: 4px;
  background: color-mix(in srgb, var(--syn-surface-hover, #303642) 48%, transparent);
  color: var(--syn-text-muted, #778190);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;
  font-size: 11px;
  cursor: pointer;
  transition: background 80ms, color 80ms, border-color 80ms;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover         { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 72%, transparent); color: var(--syn-text-default, #d7dce5); border-color: var(--syn-border-default, #343a44); }
  &[data-ok=true] { color: var(--syn-status-valid, #4ec27d); border-color: color-mix(in srgb, var(--syn-status-valid, #4ec27d) 35%, transparent); background: color-mix(in srgb, var(--syn-status-valid, #4ec27d) 8%, transparent); }
  &:focus-visible { outline: 1px solid var(--syn-interaction-focus-ring, #3794ff); outline-offset: 1px; }
`;

/* Thin vertical separator between action groups */
export const CodeActionSep = styled.span`
  width: 1px;
  height: 14px;
  background: var(--syn-border-subtle, #343a44);
  margin: 0 3px;
  flex-shrink: 0;
`;

/* Line-numbered table layout */
export const CodeBody = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr;
  overflow-x: auto;
  padding: 12px 0 14px;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--syn-text-muted, #778190) 24%, transparent) transparent;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--syn-text-muted, #778190) 24%, transparent); border-radius: 2px; }
`;

export const LineNumbers = styled.div`
  padding: 0 12px 0 14px;
  text-align: right;
  user-select: none;
  color: color-mix(in srgb, var(--syn-text-muted, #778190) 42%, transparent);
  font-family: var(--font-code, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
  border-right: 1px solid var(--syn-border-subtle, #343a44);
  min-width: 32px;
`;

export const CodeContent = styled.div`
  padding: 0 16px;
  overflow-x: visible;
  code {
    display: block;
    font-family: var(--font-code, 'JetBrains Mono', ui-monospace, monospace);
    font-size: 12.5px;
    line-height: 1.6;
    white-space: pre;
    color: #d4d4d4;
    tab-size: 2;
  }
`;

// Legacy aliases — kept for backward compat with Markdown.tsx → CodeBlock usage
export const CodeToolbar = CodeHeader;
export const CodeButton = CodeActionBtn;



export const QuickRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
`;

export const MiniInput = styled.input`
  height: 26px;
  padding: 0 8px;
  border-radius: 5px;
  border: none;
  border-bottom: 1px solid var(--syn-border-subtle, #343a44);
  background: transparent;
  color: var(--syn-text-default, #d7dce5);
  font-size: 12px;
  outline: none;
  &:focus { border-bottom-color: var(--syn-border-focus, #3794ff); }
  &:focus-visible {
    outline: var(--ide-focus-width, 2px) solid var(--ide-focus-ring, var(--syn-interaction-focus-ring, #3794ff));
    outline-offset: var(--ide-focus-offset, 2px);
    box-shadow: var(--ide-focus-shadow, 0 0 0 3px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 35%, transparent));
  }
`;

export const MiniSelect = styled.select`
  height: 26px;
  padding: 0 8px;
  border-radius: 5px;
  border: none;
  border-bottom: 1px solid var(--syn-border-subtle, #343a44);
  background: transparent;
  color: var(--syn-text-default, #d7dce5);
  font-size: 12px;
  &:focus-visible {
    outline: var(--ide-focus-width, 2px) solid var(--ide-focus-ring, var(--syn-interaction-focus-ring, #3794ff));
    outline-offset: var(--ide-focus-offset, 2px);
    box-shadow: var(--ide-focus-shadow, 0 0 0 3px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 35%, transparent));
  }
`;

export const MiniSlider = styled.input.attrs({ type: 'range' })`
  height: 28px;
  accent-color: var(--syn-interaction-active, #3794ff);
`;

export const MiniToggle = styled.input.attrs({ type: 'checkbox' })`
  height: 16px;
  width: 32px;
  accent-color: var(--syn-interaction-active, #3794ff);
`;

export const MiniButton = styled.button`
  height: 26px;
  padding: 0 8px;
  border-radius: 5px;
  border: none;
  background: color-mix(in srgb, var(--syn-surface-hover, #303642) 60%, transparent);
  color: var(--syn-text-default, #d7dce5);
  font-size: 12px;
  cursor: pointer;
  &:hover { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 82%, transparent); }
  &:focus-visible { outline: 2px solid color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 70%, transparent); outline-offset: 2px; }
`;


export const IconButton = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--syn-text-secondary, #a4adbb);
  cursor: pointer;
  transition: background 100ms, color 100ms;
  &:hover { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 70%, transparent); color: var(--syn-interaction-active, #3794ff); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--syn-interaction-focus-ring, #3794ff); outline-offset: 2px; }
`;

export const Badge = styled.span`
  font-size: 11px;
  color: var(--syn-text-secondary, #a4adbb);
`;


export const ErrorBannerRoot = styled.div`
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-left: 2px solid var(--syn-status-error, #f87171);
  background: color-mix(in srgb, var(--syn-status-error, #f87171) 8%, transparent);
  border-radius: 0 4px 4px 0;
`;
export const ErrorIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--syn-status-error, #f87171) 30%, transparent);
  color: var(--syn-status-error, #f87171);
  font-size: 12px;
  line-height: 1;
`;
export const ErrorText = styled.div`
  font-size: 12px;
  color: var(--syn-text-default, #d7dce5);
`;
export const ErrorActions = styled.div`
  display: inline-flex;
  gap: 6px;
`;


export const DebugTrayRoot = styled.div`
  margin: 6px 0 0;
  padding: 6px 8px;
  border: 1px dashed var(--syn-border-subtle, #343a44);
  border-radius: 8px;
  color: var(--syn-text-secondary, #a4adbb);
  font-size: 11px;
`;
export const DebugRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`;
export const DebugCol = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 8px;
`;
