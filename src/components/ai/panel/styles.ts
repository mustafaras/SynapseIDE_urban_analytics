import styled from 'styled-components';


export const PanelRoot = styled.aside`

  width: 100%;
  min-width: 0;
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;

  background: var(--ai-surface, var(--color-bg-inverse, #000));
  border-left: 1px solid var(--ai-border, var(--color-border-subtle, #1a1a1a));
  color: var(--color-text-primary, #FAFAF9);
  font-family: var(--font-code, "JetBrains Mono", "Coder", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace);
  box-shadow: none;

  --ai-black: var(--ai-surface, #000000);
  --ai-black-alt: var(--ai-surface-alt, #121212);
  --ai-border: var(--ai-border, #2A2A2A);
  --ai-border-strong: var(--ai-border-strong, #2A2A2A);
  --ai-gold: var(--ai-gold, #F59E0B);
  --ai-gold-soft: var(--ai-gold-soft, #FBBF24);
  --ai-text-secondary: var(--ai-text-secondary, #A8A29E);
  & button,
  & select,
  & input,
  & textarea { font-family: inherit; }
`;

export const Section = styled.section`
  padding: 12px 14px;
  color: var(--color-text, var(--text-1));
`;

export const HeaderRow = styled(Section)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-height: 56px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ai-border, var(--color-border-subtle, #1a1a1a));
  background: var(--ai-surface, var(--color-bg-inverse, #000));
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
  color: var(--ai-gold-soft, var(--color-accent-primary-hover, #FBBF24));
`;

export const Subtitle = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: var(--ai-text-secondary, var(--color-text-secondary, #A8A29E));
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
  background: rgba(245,158,11,0.08);
  &::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    left: 10px;
    top: 10px;
    border-radius: 50%;
  background: var(--ai-gold, #f59e0b);
    box-shadow:
  10px 0 0 0 var(--ai-gold, #f59e0b),
  0 10px 0 0 var(--ai-gold, #f59e0b),
  10px 10px 0 0 var(--ai-gold, #f59e0b);
  filter: drop-shadow(0 0 3px rgba(245,158,11,0.35));
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
  border-bottom: 1px dashed var(--color-border, rgba(255,255,255,0.08));
`;


export const QuickActionsBar = styled(Section)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px 4px;
  background: var(--ai-surface, var(--color-bg-inverse, #000));
  border-top: 1px solid var(--ai-border, #121212);
  border-bottom: none;
`;

export const GhostButton = styled.button`
  appearance: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid var(--color-border-subtle, rgba(255,255,255,0.12));
  background: var(--color-bg-surface-alt, rgba(255,255,255,0.04));
  color: var(--color-text-secondary, rgba(255,255,255,0.65));
  cursor: not-allowed;
`;

export const ScrollArea = styled(Section)`
  flex: 1;
  overflow: auto;
  padding: 12px 14px 8px;
  color: var(--color-text-secondary, rgba(255,255,255,0.65));
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
  background: var(--ai-surface, var(--color-bg-inverse, #000));
  border-top: none;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 40px;
  max-height: 160px;
  resize: none;
  border-radius: 8px;
  border: 1px solid var(--ai-border-strong, #2A2A2A);
  background: var(--ai-surface-alt, var(--color-bg-surface-alt, #121212));
  color: var(--color-text-primary, #FAFAF9);
  padding: 10px 12px;
  font-family: var(--font-code, "JetBrains Mono", "Coder", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace);
  font-size: 12px;
  line-height: 1.5;
  outline: none;
  &::placeholder { color: var(--color-text-muted, #8C8579); }
  &:focus { border-color: var(--ai-gold, var(--color-accent-primary, #F59E0B)); box-shadow: 0 0 0 1px var(--ai-gold, var(--color-accent-primary, #F59E0B)); }
  &:focus-visible {
    outline: var(--ide-focus-width, 2px) solid var(--ide-focus-ring, var(--ai-gold, #F59E0B));
    outline-offset: var(--ide-focus-offset, 2px);
    box-shadow: var(--ide-focus-shadow, 0 0 0 3px rgba(245, 158, 11, 0.35));
  }
`;

export const Hint = styled.div`
  font-size: 11px;
  color: var(--color-text-secondary, rgba(255,255,255,0.65));
`;

export const RightSide = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const ActionButton = styled.button`
  appearance: none;
  border: none;
  background: rgba(255,255,255,0.05);
  color: var(--color-text-primary, #FAFAF9);
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 100ms;
  &:hover { background: rgba(255,255,255,0.09); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--ai-gold, #F59E0B); outline-offset: 2px; }
`;

export const SendButton = styled(ActionButton)`
  background: var(--ai-gold, #F59E0B);
  color: #121212;
  font-weight: 600;
  &:hover { background: var(--ai-gold-soft, #FBBF24); }
`;

export const StopButton = styled(ActionButton)`
  background: rgba(185,28,28,0.7);
  color: #fff;
  &:hover { background: rgba(185,28,28,0.9); }
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
  border: 1px solid color-mix(in oklab, var(--brand-primary, #f59e0b), transparent 70%);
  background: color-mix(in oklab, var(--brand-primary, #f59e0b), transparent 85%);
  color: var(--color-text, #fff);
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
  outline: 2px solid color-mix(in oklab, var(--brand-primary, #f59e0b), transparent 30%);
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
    /* User: pill with amber-tint, right-aligned tail */
    max-width: 100%;
    padding: 8px 12px;
    border-radius: 10px 10px 2px 10px;
    background: rgba(245,158,11,0.08);
    font-size: 12.5px;
    color: rgba(250,250,249,0.92);
    letter-spacing: 0.1px;
  ` : `
    /* Assistant: transparent, full width, clean prose */
    max-width: 100%;
    padding: 2px 0;
    border-radius: 0;
    background: transparent;
    font-size: 13px;
    color: var(--color-text-primary, #FAFAF9);
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
  color: var(--color-text-primary, #FAFAF9);

  p { margin: 0 0 9px; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 0 0 9px 20px; padding: 0; }
  li { margin: 3px 0; }
  a { color: #F59E0B; text-decoration: none; opacity: 0.9; &:hover { opacity: 1; text-decoration: underline; } }

  /* Inline code stays monospace */
  :not(pre) > code {
    font-family: var(--font-code, 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace);
    font-size: 11.5px;
    background: rgba(255,255,255,0.07);
    color: #F59E0B;
    padding: 1px 5px;
    border-radius: 3px;
    ${codeInline()}
  }

  h1, h2, h3, h4 { margin: 14px 0 5px; font-weight: 600; letter-spacing: -0.2px; }
  h1 { font-size: 15px; color: #FAFAF9; ${heading(1)} }
  h2 { font-size: 14px; color: #FAFAF9; ${heading(2)} }
  h3 { font-size: 13px; color: rgba(250,250,249,0.88); ${heading(3)} }
  h4, h5, h6 { font-size: 12px; color: rgba(250,250,249,0.75); ${text('body')}; font-weight: 600; }

  strong { font-weight: 600; color: #FAFAF9; }
  em { color: rgba(250,250,249,0.78); }
  hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 10px 0; }
  blockquote {
    border-left: 2px solid rgba(245,158,11,0.5);
    margin: 6px 0;
    padding-left: 10px;
    color: rgba(250,250,249,0.6);
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
  background: #1e1e1e;      /* VS Code Dark+ body */
  border: 1px solid rgba(255,255,255,0.06);
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
    scrollbar-color: rgba(255,255,255,0.12) transparent;
    &::-webkit-scrollbar { height: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
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
  background: #252526;    /* VS Code Dark+ titlebar */
  border-bottom: 1px solid rgba(255,255,255,0.06);
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
  color: #858585;   /* muted gray, like VS Code breadcrumb */
  letter-spacing: 0.1px;
  user-select: none;
  flex-shrink: 0;
`;

export const CodeFilePath = styled.span`
  font-family: var(--font-code, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  color: rgba(255,255,255,0.25);
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
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: background 80ms, color 80ms;
  flex-shrink: 0;
  &:hover         { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); }
  &[data-ok=true] { color: #3fb950; }
  &:disabled      { opacity: 0.3; cursor: not-allowed; }
  &:focus-visible { outline: 1px solid rgba(255,255,255,0.3); outline-offset: 1px; }
`;

/* "Copy code" primary button — text + icon, always visible */
export const CopyCodeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  background: rgba(255,255,255,0.04);
  color: #858585;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;
  font-size: 11px;
  cursor: pointer;
  transition: background 80ms, color 80ms, border-color 80ms;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover         { background: rgba(255,255,255,0.08); color: #d4d4d4; border-color: rgba(255,255,255,0.18); }
  &[data-ok=true] { color: #3fb950; border-color: rgba(63,185,80,0.3); background: rgba(63,185,80,0.06); }
  &:focus-visible { outline: 1px solid rgba(255,255,255,0.3); outline-offset: 1px; }
`;

/* Thin vertical separator between action groups */
export const CodeActionSep = styled.span`
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,0.1);
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
  scrollbar-color: rgba(255,255,255,0.1) transparent;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

export const LineNumbers = styled.div`
  padding: 0 12px 0 14px;
  text-align: right;
  user-select: none;
  color: rgba(255,255,255,0.18);
  font-family: var(--font-code, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
  border-right: 1px solid rgba(255,255,255,0.05);
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
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: var(--color-text-primary, #fff);
  font-size: 12px;
  outline: none;
  &:focus { border-bottom-color: var(--ai-gold, #F59E0B); }
  &:focus-visible {
    outline: var(--ide-focus-width, 2px) solid var(--ide-focus-ring, var(--ai-gold, #F59E0B));
    outline-offset: var(--ide-focus-offset, 2px);
    box-shadow: var(--ide-focus-shadow, 0 0 0 3px rgba(245, 158, 11, 0.35));
  }
`;

export const MiniSelect = styled.select`
  height: 26px;
  padding: 0 8px;
  border-radius: 5px;
  border: none;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: var(--color-text-primary, #fff);
  font-size: 12px;
  &:focus-visible {
    outline: var(--ide-focus-width, 2px) solid var(--ide-focus-ring, var(--ai-gold, #F59E0B));
    outline-offset: var(--ide-focus-offset, 2px);
    box-shadow: var(--ide-focus-shadow, 0 0 0 3px rgba(245, 158, 11, 0.35));
  }
`;

export const MiniSlider = styled.input.attrs({ type: 'range' })`
  height: 28px;
  accent-color: var(--brand-primary, #f59e0b);
`;

export const MiniToggle = styled.input.attrs({ type: 'checkbox' })`
  height: 16px;
  width: 32px;
  accent-color: var(--brand-primary, #f59e0b);
`;

export const MiniButton = styled.button`
  height: 26px;
  padding: 0 8px;
  border-radius: 5px;
  border: none;
  background: rgba(255,255,255,0.05);
  color: var(--color-text-primary, #fff);
  font-size: 12px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.09); }
  &:focus-visible { outline: 2px solid color-mix(in oklab, var(--brand-primary, #f59e0b), transparent 30%); outline-offset: 2px; }
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
  color: var(--color-text-secondary, #A8A29E);
  cursor: pointer;
  transition: background 100ms, color 100ms;
  &:hover { background: rgba(255,255,255,0.06); color: var(--ai-gold, #F59E0B); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--ai-gold, #F59E0B); outline-offset: 2px; }
`;

export const Badge = styled.span`
  font-size: 11px;
  color: var(--color-text-secondary, rgba(255,255,255,0.65));
`;


export const ErrorBannerRoot = styled.div`
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-left: 2px solid var(--color-error, #EF4444);
  background: rgba(239,68,68,0.06);
  border-radius: 0 4px 4px 0;
`;
export const ErrorIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-error, #EF4444), transparent 70%);
  color: var(--color-error, #EF4444);
  font-size: 12px;
  line-height: 1;
`;
export const ErrorText = styled.div`
  font-size: 12px;
  color: var(--color-text, #fff);
`;
export const ErrorActions = styled.div`
  display: inline-flex;
  gap: 6px;
`;


export const DebugTrayRoot = styled.div`
  margin: 6px 0 0;
  padding: 6px 8px;
  border: 1px dashed var(--color-border, rgba(255,255,255,0.12));
  border-radius: 8px;
  color: var(--color-text-secondary, rgba(255,255,255,0.75));
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
