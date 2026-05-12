import { REPORTING_FIXTURE_CITATIONS, REPORTING_FIXTURE_RUNS } from "./fixtures";
import { createReportFromTemplate } from "./templates";
import type { PendingReportInsert, ReportDocument, ReportLibraryState } from "./types";

const STORAGE_KEY = "reporting.library.v1";
const PENDING_INSERTS_KEY = "reporting.pending.v1";

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function createDefaultReportDocument(): ReportDocument {
  const report = createReportFromTemplate("technical_report", {
    runs: REPORTING_FIXTURE_RUNS,
    fallbackRuns: REPORTING_FIXTURE_RUNS,
  });
  return {
    ...report,
    citations: REPORTING_FIXTURE_CITATIONS,
  };
}

export function loadReportLibraryState(): ReportLibraryState {
  const stored = safeRead<ReportLibraryState>(STORAGE_KEY);
  if (stored?.version === 1 && Array.isArray(stored.reports)) {
    return stored;
  }

  const report = createDefaultReportDocument();
  return {
    version: 1,
    reports: [report],
    activeReportId: report.id,
  };
}

export function saveReportLibraryState(state: ReportLibraryState): void {
  safeWrite(STORAGE_KEY, state);
}

export function enqueuePendingInsert(insert: PendingReportInsert): void {
  const current = safeRead<PendingReportInsert[]>(PENDING_INSERTS_KEY) ?? [];
  current.push(insert);
  safeWrite(PENDING_INSERTS_KEY, current);
}

export function drainPendingInserts(): PendingReportInsert[] {
  const current = safeRead<PendingReportInsert[]>(PENDING_INSERTS_KEY) ?? [];
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PENDING_INSERTS_KEY);
  }
  return current;
}

export function mergePendingInserts(
  document: ReportDocument,
  inserts: PendingReportInsert[],
): ReportDocument {
  if (inserts.length === 0) {
    return document;
  }

  const citations = new Map(document.citations.map((citation) => [citation.id, citation]));
  for (const insert of inserts) {
    for (const citation of insert.citations) {
      citations.set(citation.id, citation);
    }
  }

  const sections = [...document.sections];
  const sectionOrder = [...document.sectionOrder];
  const linkedRunIds = new Set(document.linkedRunIds);
  const structuredEvidenceBlocks = new Map(
    (document.structuredEvidenceBlocks ?? []).map((block) => [block.id, block]),
  );

  for (const insert of inserts) {
    for (const block of insert.structuredEvidenceBlocks ?? []) {
      structuredEvidenceBlocks.set(block.id, block);
    }
    for (const section of insert.sections) {
      sections.push(section);
      sectionOrder.push(section.id);
      if (section.sourceRunId) {
        linkedRunIds.add(section.sourceRunId);
      }
    }
  }

  return {
    ...document,
    citations: Array.from(citations.values()),
    sections,
    sectionOrder,
    linkedRunIds: Array.from(linkedRunIds.values()),
    ...(structuredEvidenceBlocks.size > 0 ? { structuredEvidenceBlocks: Array.from(structuredEvidenceBlocks.values()) } : {}),
    updatedAt: new Date().toISOString(),
  };
}
