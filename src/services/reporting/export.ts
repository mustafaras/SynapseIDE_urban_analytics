import { downloadText } from "@/centerpanel/lib/download";
import { exportBibliography } from "./CitationManager";
import { buildReportFilename, compileReport } from "./ReportEngine";
import type { CitationExportFormat, ReportDocument } from "./types";

export function downloadReportMarkdown(document: ReportDocument): string {
  const compiled = compileReport(document);
  const filename = buildReportFilename(document, "md");
  downloadText(filename, compiled.markdown, "text/markdown;charset=utf-8");
  return filename;
}

export function downloadReportHtml(document: ReportDocument): string {
  const compiled = compileReport(document);
  const filename = buildReportFilename(document, "html");
  downloadText(filename, compiled.html, "text/html;charset=utf-8");
  return filename;
}

export async function downloadReportPdf(node: HTMLElement, document: ReportDocument): Promise<string> {
  type ChainSet = { save: () => Promise<void> | void };
  type ChainFrom = { set: (opt: Record<string, unknown>) => ChainSet };
  type Chain = { from: (el: HTMLElement) => ChainFrom };
  type Factory = () => Chain;

  const mod: unknown = await import("html2pdf.js");
  const candidate = mod as Record<string, unknown>;
  const factory = typeof candidate.default === "function"
    ? candidate.default as Factory
    : mod as Factory;

  const filename = buildReportFilename(document, "pdf");
  await factory().from(node).set({
    margin: 10,
    filename,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#f5f1e8" },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  }).save();
  return filename;
}

export function downloadCitationExport(
  document: ReportDocument,
  format: CitationExportFormat,
): string {
  const extension = format === "apa7" || format === "chicago" ? "txt" : format;
  const filename = buildReportFilename(document, extension);
  downloadText(filename, exportBibliography(document.citations, format), "text/plain;charset=utf-8");
  return filename;
}
