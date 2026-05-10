import { formatCitationInline } from "./CitationManager";
import type {
  ReportCitationRecord,
  ReportCitationStyle,
  ReportDocument,
  ReportSection,
} from "./types";

export interface CitationInsertionSelection {
  start: number;
  end: number;
}

export interface CitationTokenInsertResult {
  text: string;
  token: string;
  selection: CitationInsertionSelection;
}

const INLINE_CITATION_TOKEN_REGEX = /\{\{cite:([^}]+)\}\}/g;

function normalizeCitationIds(raw: string): string[] {
  return raw
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasInlineCitationTokens(text: string): boolean {
  INLINE_CITATION_TOKEN_REGEX.lastIndex = 0;
  return INLINE_CITATION_TOKEN_REGEX.test(text);
}

export function extractInlineCitationIds(text: string): string[] {
  const ids = new Set<string>();

  for (const match of text.matchAll(INLINE_CITATION_TOKEN_REGEX)) {
    for (const citationId of normalizeCitationIds(match[1] ?? "")) {
      ids.add(citationId);
    }
  }

  return Array.from(ids);
}

export function renderInlineCitationTokens(
  text: string,
  citationLookup: Map<string, ReportCitationRecord>,
  style: ReportCitationStyle,
): string {
  return text.replace(INLINE_CITATION_TOKEN_REGEX, (_match, rawIds: string) => {
    const ids = normalizeCitationIds(rawIds);
    const entries = ids
      .map((citationId) => citationLookup.get(citationId))
      .filter((citation): citation is ReportCitationRecord => Boolean(citation))
      .map((citation) => formatCitationInline(citation, style));

    if (entries.length === 0) {
      return `[missing citation: ${ids.join(", ")}]`;
    }

    return `(${entries.join("; ")})`;
  });
}

export function collectReferencedCitationIds(document: Pick<ReportDocument, "sections">): string[] {
  const ids = new Set<string>();

  for (const section of document.sections) {
    for (const citationId of section.citationIds) {
      ids.add(citationId);
    }

    for (const block of section.blocks) {
      if (block.kind !== "paragraph") {
        continue;
      }
      for (const citationId of extractInlineCitationIds(block.text)) {
        ids.add(citationId);
      }
    }
  }

  return Array.from(ids);
}

export function insertCitationToken(
  text: string,
  citationId: string,
  selection?: CitationInsertionSelection,
): CitationTokenInsertResult {
  const token = `{{cite:${citationId}}}`;
  const start = Math.max(0, Math.min(selection?.start ?? text.length, text.length));
  const end = Math.max(start, Math.min(selection?.end ?? start, text.length));
  const before = text.slice(0, start);
  const after = text.slice(end);
  const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
  const needsTrailingSpace = after.length > 0 && !/^\s|^[,.;:!?)]/.test(after);
  const inserted = `${needsLeadingSpace ? " " : ""}${token}${needsTrailingSpace ? " " : ""}`;
  const nextText = `${before}${inserted}${after}`;
  const tokenStart = before.length + (needsLeadingSpace ? 1 : 0);
  const tokenEnd = tokenStart + token.length;

  return {
    text: nextText,
    token,
    selection: {
      start: tokenEnd,
      end: tokenEnd,
    },
  };
}

export function resolveInlineCitationsForSection(section: ReportSection): string[] {
  const ids = new Set<string>();
  for (const block of section.blocks) {
    if (block.kind !== "paragraph") {
      continue;
    }
    for (const citationId of extractInlineCitationIds(block.text)) {
      ids.add(citationId);
    }
  }
  return Array.from(ids);
}