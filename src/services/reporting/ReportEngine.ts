import { buildBibliography, formatCitationInline } from "./CitationManager";
import {
  collectReferencedCitationIds,
  extractInlineCitationIds,
  renderInlineCitationTokens,
} from "./citationTokens";
import type {
  CompiledFigureReference,
  CompiledReport,
  CompiledReportBlock,
  CompiledReportSection,
  CompiledTableReference,
  ReportBlock,
  ReportCitationRecord,
  ReportDocument,
  ReportSection,
} from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function labelFromSnakeCase(value: string): string {
  return value.replace(/_/g, " ");
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}

function buildCitationLookup(citations: ReportCitationRecord[]): Map<string, ReportCitationRecord> {
  return new Map(citations.map((citation) => [citation.id, citation]));
}

function buildReferenceMaps(sections: ReportSection[], order: string[]): {
  figureReferences: CompiledFigureReference[];
  tableReferences: CompiledTableReference[];
} {
  const sectionLookup = new Map(sections.map((section) => [section.id, section]));
  const figureReferences: CompiledFigureReference[] = [];
  const tableReferences: CompiledTableReference[] = [];
  let figureCount = 0;
  let tableCount = 0;

  for (const sectionId of order) {
    const section = sectionLookup.get(sectionId);
    if (!section) {
      continue;
    }

    for (const block of section.blocks) {
      if (block.kind === "figure") {
        figureCount += 1;
        figureReferences.push({
          assetId: block.assetId,
          number: figureCount,
          title: block.title,
          caption: block.caption,
          sectionId: section.id,
        });
      }
      if (block.kind === "table") {
        tableCount += 1;
        tableReferences.push({
          assetId: block.assetId,
          number: tableCount,
          title: block.title,
          caption: block.caption,
          sectionId: section.id,
        });
      }
    }
  }

  return { figureReferences, tableReferences };
}

function renderCrossReferences(
  text: string,
  figureReferences: Map<string, CompiledFigureReference>,
  tableReferences: Map<string, CompiledTableReference>,
): string {
  return text
    .replace(/\{\{fig:([^}]+)\}\}/g, (_match, assetId: string) => {
      const ref = figureReferences.get(assetId);
      return ref ? `Figure ${ref.number}` : "Figure ?";
    })
    .replace(/\{\{tbl:([^}]+)\}\}/g, (_match, assetId: string) => {
      const ref = tableReferences.get(assetId);
      return ref ? `Table ${ref.number}` : "Table ?";
    });
}

function renderInlineCitationSuffix(
  citationIds: string[],
  citationLookup: Map<string, ReportCitationRecord>,
  style: ReportDocument["citationStyle"],
): string {
  if (citationIds.length === 0) {
    return "";
  }

  const entries = citationIds
    .map((citationId) => citationLookup.get(citationId))
    .filter((citation): citation is ReportCitationRecord => Boolean(citation))
    .map((citation) => formatCitationInline(citation, style));

  if (entries.length === 0) {
    return "";
  }

  return ` (${entries.join("; ")})`;
}

function compileBlock(
  block: ReportBlock,
  section: ReportSection,
  figureLookup: Map<string, CompiledFigureReference>,
  tableLookup: Map<string, CompiledTableReference>,
  citationLookup: Map<string, ReportCitationRecord>,
  style: ReportDocument["citationStyle"],
): CompiledReportBlock {
  if (block.kind === "paragraph") {
    const inlineCitationIds = extractInlineCitationIds(block.text);
    const legacySectionCitationIds = section.citationIds.filter((citationId) => !inlineCitationIds.includes(citationId));
    const paragraphText = renderInlineCitationTokens(
      renderCrossReferences(block.text, figureLookup, tableLookup),
      citationLookup,
      style,
    );

    return {
      kind: "paragraph",
      text: `${paragraphText}${renderInlineCitationSuffix(legacySectionCitationIds, citationLookup, style)}`,
    };
  }
  if (block.kind === "bullet_list") {
    return { kind: "bullet_list", items: block.items };
  }
  if (block.kind === "figure") {
    const ref = figureLookup.get(block.assetId);
    return {
      kind: "figure",
      assetId: block.assetId,
      number: ref?.number ?? 0,
      title: block.title,
      caption: block.caption,
      ...(block.sourceRunId !== undefined ? { sourceRunId: block.sourceRunId } : {}),
      ...(block.dataUrl !== undefined ? { dataUrl: block.dataUrl } : {}),
      ...(block.mimeType !== undefined ? { mimeType: block.mimeType } : {}),
      ...(block.width !== undefined ? { width: block.width } : {}),
      ...(block.height !== undefined ? { height: block.height } : {}),
    };
  }
  const tableRef = tableLookup.get(block.assetId);
  return {
    kind: "table",
    assetId: block.assetId,
    number: tableRef?.number ?? 0,
    title: block.title,
    caption: block.caption,
    columns: block.columns,
    rows: block.rows,
    ...(block.sourceRunId !== undefined ? { sourceRunId: block.sourceRunId } : {}),
  };
}

function renderMarkdownSection(section: CompiledReportSection): string {
  const lines: string[] = [`## ${section.title}`];
  if (section.generated) {
    lines.push(`> ${section.badgeLabel ?? "Generated content"}`);
  }
  if (section.mapReviewEventIds?.length) {
    lines.push(`> Map review event IDs: ${section.mapReviewEventIds.join(", ")}`);
  }

  for (const block of section.blocks) {
    if (block.kind === "paragraph") {
      lines.push(block.text);
      continue;
    }
    if (block.kind === "bullet_list") {
      lines.push(...block.items.map((item) => `- ${item}`));
      continue;
    }
    if (block.kind === "figure") {
      lines.push(`**Figure ${block.number}. ${block.title}.** ${block.caption}`);
      continue;
    }
    const header = `| ${block.columns.join(" | ")} |`;
    const divider = `| ${block.columns.map(() => "---").join(" | ")} |`;
    const rows = block.rows.map((row) => `| ${block.columns.map((column) => String(row[column] ?? "")).join(" | ")} |`);
    lines.push(`**Table ${block.number}. ${block.title}.** ${block.caption}`);
    lines.push(header);
    lines.push(divider);
    lines.push(...rows);
  }

  return lines.join("\n\n");
}

function renderHtmlSection(section: CompiledReportSection): string {
  const reviewEventLink = section.mapReviewEventIds?.length
    ? `<p class="report-review-link">Map review event IDs: ${escapeHtml(section.mapReviewEventIds.join(", "))}</p>`
    : "";
  const blocks = section.blocks.map((block) => {
    if (block.kind === "paragraph") {
      return `<p>${escapeHtml(block.text)}</p>`;
    }
    if (block.kind === "bullet_list") {
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }
    if (block.kind === "figure") {
      const figureBody = block.dataUrl
        ? `<img class="report-figure-image" src="${escapeHtml(block.dataUrl)}" alt="${escapeHtml(block.title)}" />`
        : `<div class="report-placeholder">Figure ${block.number}</div>`;
      return `
        <figure class="report-figure">
          ${figureBody}
          <figcaption><strong>Figure ${block.number}. ${escapeHtml(block.title)}.</strong> ${escapeHtml(block.caption)}</figcaption>
        </figure>
      `;
    }
    return `
      <div class="report-table-wrap">
        <div class="report-table-title"><strong>Table ${block.number}. ${escapeHtml(block.title)}.</strong> ${escapeHtml(block.caption)}</div>
        <table class="report-table">
          <thead><tr>${block.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
          <tbody>
            ${block.rows.map((row) => `<tr>${block.columns.map((column) => `<td>${escapeHtml(String(row[column] ?? ""))}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
  }).join("");

  return `
    <section class="report-section${section.generated ? " generated" : ""}">
      <div class="report-section-head">
        <h2>${escapeHtml(section.title)}</h2>
        ${section.generated ? `<span class="report-badge">${escapeHtml(section.badgeLabel ?? "Generated")}</span>` : ""}
      </div>
      ${reviewEventLink}
      ${blocks}
    </section>
  `;
}

function buildHtmlDocument(document: ReportDocument, sections: CompiledReportSection[], bibliography: string[]): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(document.name)}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f5f1e8; color: #1f2937; font: 15px/1.65 Georgia, "Times New Roman", serif; }
      .page { max-width: 960px; margin: 0 auto; padding: 40px 28px 60px; background: #fffdf8; }
      .hero { border-bottom: 2px solid #d4c7a5; padding-bottom: 18px; margin-bottom: 28px; }
      .hero h1 { margin: 0 0 8px; font-size: 34px; line-height: 1.1; }
      .hero p { margin: 0; color: #5b6472; }
      .hero-meta { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #6b7280; }
      .report-section { border: 1px solid #e5ded0; border-radius: 14px; padding: 18px 18px 16px; margin-bottom: 18px; background: #ffffff; }
      .report-section.generated { background: #fff8ec; border-color: #efc46f; }
      .report-section-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-bottom: 10px; }
      .report-section-head h2 { margin: 0; font-size: 22px; }
      .report-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 10px; background: #f59e0b14; color: #9a6700; font: 600 11px/1.2 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.04em; text-transform: uppercase; }
      .report-review-link { margin: 0 0 10px; color: #7c2d12; font: 600 12px/1.45 ui-sans-serif, system-ui, sans-serif; }
      .report-figure, .report-table-wrap { margin: 16px 0; }
      .report-figure-image { width: 100%; max-height: 520px; object-fit: contain; border: 1px solid #d7dee8; border-radius: 12px; background: #0f172a; }
      .report-placeholder { border: 1px dashed #b7c0d1; border-radius: 12px; min-height: 140px; display: grid; place-items: center; background: linear-gradient(180deg, #f8fafc, #eef2f7); color: #64748b; font: 600 13px/1.2 ui-sans-serif, system-ui, sans-serif; }
      .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .report-table th, .report-table td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
      .report-table th { background: #f8fafc; font: 600 12px/1.2 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
      .bibliography { margin-top: 32px; border-top: 2px solid #d4c7a5; padding-top: 18px; }
      .bibliography h2 { margin: 0 0 10px; font-size: 24px; }
      .bibliography ol { margin: 0; padding-left: 18px; }
      @media print { body { background: #fff; } .page { padding: 18px; } .report-section { break-inside: avoid; } }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="hero">
        <h1>${escapeHtml(document.name)}</h1>
        <p>${escapeHtml(document.description)}</p>
        <div class="hero-meta">
          <span>Template: ${escapeHtml(labelFromSnakeCase(document.templateId))}</span>
          <span>Citation style: ${escapeHtml(document.citationStyle.toUpperCase())}</span>
          <span>Updated: ${escapeHtml(new Date(document.updatedAt).toLocaleString("en-US"))}</span>
        </div>
      </header>
      ${sections.map((section) => renderHtmlSection(section)).join("")}
      <section class="bibliography">
        <h2>Bibliography</h2>
        <ol>${bibliography.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ol>
      </section>
    </div>
  </body>
</html>`;
}

export function compileReport(document: ReportDocument): CompiledReport {
  const sectionLookup = new Map(document.sections.map((section) => [section.id, section]));
  const orderedSections = document.sectionOrder
    .map((sectionId) => sectionLookup.get(sectionId))
    .filter((section): section is ReportSection => Boolean(section));
  const citationLookup = buildCitationLookup(document.citations);
  const { figureReferences, tableReferences } = buildReferenceMaps(orderedSections, document.sectionOrder);
  const figureLookup = new Map(figureReferences.map((reference) => [reference.assetId, reference]));
  const tableLookup = new Map(tableReferences.map((reference) => [reference.assetId, reference]));

  const sections: CompiledReportSection[] = orderedSections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.kind,
    origin: section.origin,
    generated: section.generated,
    citationIds: section.citationIds,
    blocks: section.blocks.map((block) => compileBlock(block, section, figureLookup, tableLookup, citationLookup, document.citationStyle)),
    ...(section.badgeLabel !== undefined ? { badgeLabel: section.badgeLabel } : {}),
    ...(section.mapReviewEventIds !== undefined ? { mapReviewEventIds: section.mapReviewEventIds } : {}),
    ...(section.structuredEvidenceBlockIds !== undefined ? { structuredEvidenceBlockIds: section.structuredEvidenceBlockIds } : {}),
  }));

  const referencedCitationIds = collectReferencedCitationIds({ sections: orderedSections });
  const bibliographyCitations = referencedCitationIds.length > 0
    ? referencedCitationIds
      .map((citationId) => citationLookup.get(citationId))
      .filter((citation): citation is ReportCitationRecord => Boolean(citation))
    : document.citations;
  const bibliography = buildBibliography(bibliographyCitations, document.citationStyle);
  const markdown = [
    `# ${document.name}`,
    document.description,
    ...sections.map((section) => renderMarkdownSection(section)),
    "## Bibliography",
    ...bibliography.map((entry) => `1. ${entry}`),
  ].join("\n\n");
  const html = buildHtmlDocument(document, sections, bibliography);

  return {
    document,
    sections,
    figureReferences,
    tableReferences,
    bibliography,
    markdown,
    html,
  };
}

export function buildReportFilename(document: ReportDocument, extension: string): string {
  return `${slugify(document.name)}.${extension}`;
}
