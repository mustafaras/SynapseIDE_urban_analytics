import type { NarrativeReport } from "@/engine/geoai/nlp/ReportNarrativeGenerator";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import type {
  PendingReportInsert,
  ReportBulletListBlock,
  ReportCitationRecord,
  ReportFigureBlock,
  ReportSection,
  ReportTableBlock,
} from "./types";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function summarizeRun(run: CompletedAnalysisRun): string {
  return run.paragraphFull || run.paragraphPreview || run.paragraph || `${run.label} completed.`;
}

function buildOutputList(run: CompletedAnalysisRun): ReportBulletListBlock | null {
  const items: string[] = [];

  if (run.mapOutputs.length > 0) {
    items.push(`${run.mapOutputs.length} mapped output(s) published for spatial inspection.`);
  }
  if (run.chartOutputs.length > 0) {
    items.push(`${run.chartOutputs.length} chart output(s) available for comparative interpretation.`);
  }
  if (run.dataOutputs.length > 0) {
    items.push(`${run.dataOutputs.length} tabular output(s) available for audit and appendix use.`);
  }

  return items.length > 0 ? { kind: "bullet_list", items } : null;
}

function buildFigureBlocks(run: CompletedAnalysisRun): ReportFigureBlock[] {
  const mapFigures = run.mapOutputs.map((mapOutput, index) => ({
    kind: "figure" as const,
    assetId: `${run.runId}-map-${index + 1}`,
    title: mapOutput.title || mapOutput.layerName || `${run.label} spatial output ${index + 1}`,
    caption: `Spatial output from ${run.label}: ${mapOutput.title || mapOutput.layerName || mapOutput.type}.`,
    sourceRunId: run.runId,
    assetType: "map" as const,
  }));
  const chartFigures = run.chartOutputs.map((chartOutput, index) => ({
    kind: "figure" as const,
    assetId: `${run.runId}-chart-${index + 1}`,
    title: chartOutput.title || `${run.label} chart ${index + 1}`,
    caption: `Chart output from ${run.label}: ${chartOutput.title || chartOutput.type}.`,
    sourceRunId: run.runId,
    assetType: "chart" as const,
  }));

  return [...mapFigures, ...chartFigures];
}

function buildTableBlocks(run: CompletedAnalysisRun): ReportTableBlock[] {
  return run.dataOutputs.map((dataOutput, index) => ({
    kind: "table" as const,
    assetId: `${run.runId}-table-${index + 1}`,
    title: `${run.label} table ${index + 1}`,
    caption: `${dataOutput.rows} row(s) exported from ${run.label} (${dataOutput.format}).`,
    columns: dataOutput.columns,
    rows: dataOutput.preview.map((row, rowIndex) => {
      if (typeof row === "object" && row !== null) {
        return row as Record<string, string | number | boolean | null>;
      }
      return { row: rowIndex + 1, value: String(row) };
    }),
    sourceRunId: run.runId,
  }));
}

export function buildSectionsFromCompletedRun(run: CompletedAnalysisRun): ReportSection[] {
  const figures = buildFigureBlocks(run);
  const tables = buildTableBlocks(run);
  const summaryText = summarizeRun(run);
  const referenceLineParts: string[] = [];
  if (figures[0]) {
    referenceLineParts.push(`See {{fig:${figures[0].assetId}}} for the principal spatial or chart output.`);
  }
  if (tables[0]) {
    referenceLineParts.push(`Supporting tabular evidence is listed in {{tbl:${tables[0].assetId}}}.`);
  }

  const blocks: ReportSection["blocks"] = [
    { kind: "paragraph", text: summaryText },
    ...(referenceLineParts.length > 0 ? [{ kind: "paragraph" as const, text: referenceLineParts.join(" ") }] : []),
    ...(buildOutputList(run) ? [buildOutputList(run)!] : []),
    ...figures,
    ...tables,
  ];

  return [
    {
      id: createId(`run-${run.runId}`),
      title: run.label,
      kind: "analysis",
      origin: "analysis_run",
      blocks,
      citationIds: [],
      generated: true,
      sourceRunId: run.runId,
      summary: run.paragraphPreview,
      badgeLabel: "Generated from analysis",
    },
  ];
}

export function buildSectionsFromNarrativeReport(report: NarrativeReport): ReportSection[] {
  return report.sections
    .filter((section) => section.status !== "rejected")
    .map((section) => ({
      id: createId(`narrative-${section.id}`),
      title: section.title,
      kind:
        section.kind === "recommendation"
          ? "recommendation"
          : section.kind === "method_note"
            ? "methodology"
            : "analysis",
      origin: "generated" as const,
      blocks: [{ kind: "paragraph" as const, text: section.text }],
      citationIds: Array.from(new Set(section.citationAnchors.map((anchor) => anchor.citationId))),
      generated: true,
      summary: section.text.slice(0, 180),
      badgeLabel: "AI narrative",
    }));
}

export function buildPendingInsertFromNarrativeReport(input: {
  source: string;
  report: NarrativeReport;
  citations?: ReportCitationRecord[];
  suggestedTitle?: string;
}): PendingReportInsert {
  return {
    id: createId("report-insert"),
    insertedAt: new Date().toISOString(),
    source: input.source,
    citations: input.citations ?? [],
    sections: buildSectionsFromNarrativeReport(input.report),
    ...(input.suggestedTitle !== undefined ? { suggestedTitle: input.suggestedTitle } : {}),
  };
}
