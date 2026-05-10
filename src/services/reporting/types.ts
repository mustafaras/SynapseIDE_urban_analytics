import type { NarrativeReport } from "@/engine/geoai/nlp/ReportNarrativeGenerator";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";

export type ReportTemplateId =
  | "technical_report"
  | "policy_brief"
  | "environmental_impact_assessment"
  | "sdg_progress_report";

export type ReportCitationStyle = "apa7" | "chicago";
export type CitationExportFormat = ReportCitationStyle | "bibtex" | "ris";

export type ReportSectionKind =
  | "executive_summary"
  | "context"
  | "methodology"
  | "analysis"
  | "evidence"
  | "recommendation"
  | "impact"
  | "monitoring"
  | "appendix";

export type ReportSectionOrigin = "template" | "generated" | "analysis_run" | "user";

export interface ReportCitationAuthor {
  given: string;
  family: string;
}

export interface ReportCitationRecord {
  id: string;
  type: "article" | "book" | "report" | "webpage" | "dataset";
  title: string;
  authors: ReportCitationAuthor[];
  year: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessedAt?: string;
  city?: string;
}

export interface ReportParagraphBlock {
  kind: "paragraph";
  text: string;
}

export interface ReportBulletListBlock {
  kind: "bullet_list";
  items: string[];
}

export interface ReportFigureBlock {
  kind: "figure";
  assetId: string;
  title: string;
  caption: string;
  sourceRunId?: string;
  assetType?: "map" | "chart" | "image";
  dataUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface ReportTableBlock {
  kind: "table";
  assetId: string;
  title: string;
  caption: string;
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  sourceRunId?: string;
}

export type ReportBlock =
  | ReportParagraphBlock
  | ReportBulletListBlock
  | ReportFigureBlock
  | ReportTableBlock;

export interface ReportSection {
  id: string;
  title: string;
  kind: ReportSectionKind;
  origin: ReportSectionOrigin;
  blocks: ReportBlock[];
  citationIds: string[];
  generated: boolean;
  summary?: string;
  sourceRunId?: string;
  badgeLabel?: string;
  mapReviewEventIds?: string[];
}

export interface ReportDocument {
  id: string;
  name: string;
  description: string;
  templateId: ReportTemplateId;
  citationStyle: ReportCitationStyle;
  createdAt: string;
  updatedAt: string;
  metadata: {
    audience: string;
    useCase: string;
  };
  citations: ReportCitationRecord[];
  sections: ReportSection[];
  sectionOrder: string[];
  linkedRunIds: string[];
}

export interface ReportTemplateDefinition {
  id: ReportTemplateId;
  label: string;
  description: string;
  audience: string;
  useCase: string;
  build: (input: ReportTemplateBuildInput) => ReportDocument;
}

export interface ReportTemplateBuildInput {
  now?: string;
  runs: CompletedAnalysisRun[];
  fallbackRuns?: CompletedAnalysisRun[];
  reportName?: string;
}

export interface CompiledFigureReference {
  assetId: string;
  number: number;
  title: string;
  caption: string;
  sectionId: string;
}

export interface CompiledTableReference {
  assetId: string;
  number: number;
  title: string;
  caption: string;
  sectionId: string;
}

export interface CompiledParagraphBlock {
  kind: "paragraph";
  text: string;
}

export interface CompiledBulletListBlock {
  kind: "bullet_list";
  items: string[];
}

export interface CompiledFigureBlock {
  kind: "figure";
  assetId: string;
  number: number;
  title: string;
  caption: string;
  sourceRunId?: string;
  dataUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface CompiledTableBlock {
  kind: "table";
  assetId: string;
  number: number;
  title: string;
  caption: string;
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  sourceRunId?: string;
}

export type CompiledReportBlock =
  | CompiledParagraphBlock
  | CompiledBulletListBlock
  | CompiledFigureBlock
  | CompiledTableBlock;

export interface CompiledReportSection {
  id: string;
  title: string;
  kind: ReportSectionKind;
  origin: ReportSectionOrigin;
  generated: boolean;
  badgeLabel?: string;
  mapReviewEventIds?: string[];
  blocks: CompiledReportBlock[];
  citationIds: string[];
}

export interface CompiledReport {
  document: ReportDocument;
  sections: CompiledReportSection[];
  figureReferences: CompiledFigureReference[];
  tableReferences: CompiledTableReference[];
  bibliography: string[];
  markdown: string;
  html: string;
}

export interface ReportLibraryState {
  version: 1;
  reports: ReportDocument[];
  activeReportId: string | null;
}

export interface PendingReportInsert {
  id: string;
  insertedAt: string;
  source: string;
  suggestedTitle?: string;
  mapReviewEventIds?: string[];
  citations: ReportCitationRecord[];
  sections: ReportSection[];
}

export interface NarrativeInsertPayload {
  source: string;
  report: NarrativeReport;
  citations?: ReportCitationRecord[];
  suggestedTitle?: string;
}
