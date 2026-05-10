import { buildSectionsFromCompletedRun } from "../AutoNarrative";
import { REPORTING_FIXTURE_CITATIONS, REPORTING_FIXTURE_RUNS } from "../fixtures";
import type {
  ReportDocument,
  ReportSection,
  ReportTemplateBuildInput,
  ReportTemplateDefinition,
  ReportTemplateId,
} from "../types";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function pickRuns(input: ReportTemplateBuildInput) {
  return input.runs.length > 0
    ? input.runs
    : input.fallbackRuns && input.fallbackRuns.length > 0
      ? input.fallbackRuns
      : REPORTING_FIXTURE_RUNS;
}

export function section(
  kind: ReportSection["kind"],
  title: string,
  paragraphs: string[],
  options: Partial<Omit<ReportSection, "id" | "title" | "kind" | "origin" | "blocks" | "citationIds" | "generated">> & {
    citationIds?: string[];
    generated?: boolean;
    origin?: ReportSection["origin"];
  } = {},
): ReportSection {
  return {
    id: createId(kind),
    title,
    kind,
    origin: options.origin ?? "template",
    blocks: paragraphs.map((text) => ({ kind: "paragraph" as const, text })),
    citationIds: options.citationIds ?? [],
    generated: options.generated ?? false,
    ...(options.summary !== undefined ? { summary: options.summary } : {}),
    ...(options.sourceRunId !== undefined ? { sourceRunId: options.sourceRunId } : {}),
    ...(options.badgeLabel !== undefined ? { badgeLabel: options.badgeLabel } : {}),
  };
}

export function createDocument(
  template: Omit<ReportTemplateDefinition, "build">,
  input: ReportTemplateBuildInput,
  sections: ReportSection[],
): ReportDocument {
  const now = input.now ?? new Date().toISOString();
  const runs = pickRuns(input);
  const name = input.reportName ?? template.label;
  return {
    id: createId(template.id),
    name,
    description: template.description,
    templateId: template.id as ReportTemplateId,
    citationStyle: template.id === "policy_brief" ? "chicago" : "apa7",
    createdAt: now,
    updatedAt: now,
    metadata: {
      audience: template.audience,
      useCase: template.useCase,
    },
    citations: REPORTING_FIXTURE_CITATIONS,
    sections,
    sectionOrder: sections.map((item) => item.id),
    linkedRunIds: runs.map((run) => run.runId),
  };
}

export function buildGeneratedAnalysisSections(input: ReportTemplateBuildInput): ReportSection[] {
  return pickRuns(input).flatMap((run) => buildSectionsFromCompletedRun(run));
}
