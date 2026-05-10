import type {
  CitationExportFormat,
  ReportCitationAuthor,
  ReportCitationRecord,
  ReportCitationStyle,
} from "./types";

function escapeBibValue(value: string): string {
  return value.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function joinAuthors(authors: ReportCitationAuthor[], mode: "inline" | "bibliography"): string {
  if (authors.length === 0) {
    return "Unknown";
  }

  if (mode === "inline") {
    if (authors.length === 1) {
      return authors[0]!.family;
    }
    if (authors.length === 2) {
      return `${authors[0]!.family} and ${authors[1]!.family}`;
    }
    return `${authors[0]!.family} et al.`;
  }

  return authors
    .map((author) => `${author.family}, ${author.given}`)
    .join(authors.length > 1 ? "; " : "");
}

function buildUrlSuffix(citation: ReportCitationRecord): string {
  if (citation.doi) {
    return `https://doi.org/${citation.doi}`;
  }
  if (citation.url) {
    return citation.url;
  }
  return "";
}

export function formatCitationInline(
  citation: ReportCitationRecord,
  style: ReportCitationStyle,
): string {
  const names = joinAuthors(citation.authors, "inline");
  if (style === "chicago") {
    return `${names} ${citation.year}`;
  }
  return `${names}, ${citation.year}`;
}

export function formatCitationBibliography(
  citation: ReportCitationRecord,
  style: ReportCitationStyle,
): string {
  const authorLabel = joinAuthors(citation.authors, "bibliography");
  const urlSuffix = buildUrlSuffix(citation);
  const accessed = citation.accessedAt ? ` Accessed ${citation.accessedAt}.` : "";

  if (style === "chicago") {
    const publisher = citation.publisher ? `${citation.publisher}.` : "";
    const container = citation.journal ? ` ${citation.journal}` : "";
    const issuePart = citation.issue ? `, no. ${citation.issue}` : "";
    const volumePart = citation.volume ? ` ${citation.volume}` : "";
    const pagesPart = citation.pages ? `: ${citation.pages}` : "";
    const location = citation.city ? `${citation.city}: ` : "";
    const locator = urlSuffix ? ` ${urlSuffix}.` : "";
    return `${authorLabel}. "${citation.title}."${container}${volumePart}${issuePart}${pagesPart} (${citation.year}). ${location}${publisher}${locator}${accessed}`.replace(/\s+/g, " ").trim();
  }

  const publisher = citation.publisher ? ` ${citation.publisher}.` : "";
  const container = citation.journal ? ` ${citation.journal}` : "";
  const volumePart = citation.volume ? `, ${citation.volume}` : "";
  const issuePart = citation.issue ? `(${citation.issue})` : "";
  const pagesPart = citation.pages ? `, ${citation.pages}` : "";
  const locator = urlSuffix ? ` ${urlSuffix}` : "";
  return `${authorLabel} (${citation.year}). ${citation.title}.${container}${volumePart}${issuePart}${pagesPart}.${publisher}${locator}${accessed}`.replace(/\s+/g, " ").trim();
}

export function formatCitationAsBibTeX(citation: ReportCitationRecord): string {
  const type = citation.type === "webpage" ? "misc" : citation.type;
  const authorValue = citation.authors
    .map((author) => `${author.family}, ${author.given}`)
    .join(" and ");
  const fields: Array<[string, string | undefined]> = [
    ["author", authorValue || undefined],
    ["title", citation.title],
    ["year", String(citation.year)],
    ["publisher", citation.publisher],
    ["journal", citation.journal],
    ["volume", citation.volume],
    ["number", citation.issue],
    ["pages", citation.pages],
    ["doi", citation.doi],
    ["url", citation.url],
  ];

  const serialized = fields
    .filter(([, value]) => value)
    .map(([key, value]) => `  ${key} = {${escapeBibValue(value!)}}`)
    .join(",\n");

  return `@${type}{${citation.id},\n${serialized}\n}`;
}

export function formatCitationAsRis(citation: ReportCitationRecord): string {
  const typeMap: Record<ReportCitationRecord["type"], string> = {
    article: "JOUR",
    book: "BOOK",
    report: "RPRT",
    webpage: "ELEC",
    dataset: "DATA",
  };
  const lines = [
    `TY  - ${typeMap[citation.type]}`,
    ...citation.authors.flatMap((author) => [`AU  - ${author.family}, ${author.given}`]),
    `TI  - ${citation.title}`,
    `PY  - ${citation.year}`,
    ...(citation.publisher ? [`PB  - ${citation.publisher}`] : []),
    ...(citation.journal ? [`JO  - ${citation.journal}`] : []),
    ...(citation.volume ? [`VL  - ${citation.volume}`] : []),
    ...(citation.issue ? [`IS  - ${citation.issue}`] : []),
    ...(citation.pages ? [`SP  - ${citation.pages}`] : []),
    ...(citation.doi ? [`DO  - ${citation.doi}`] : []),
    ...(citation.url ? [`UR  - ${citation.url}`] : []),
    "ER  -",
  ];
  return lines.join("\n");
}

export function formatCitationRecord(
  citation: ReportCitationRecord,
  format: CitationExportFormat,
): string {
  if (format === "bibtex") {
    return formatCitationAsBibTeX(citation);
  }
  if (format === "ris") {
    return formatCitationAsRis(citation);
  }
  return formatCitationBibliography(citation, format);
}

export function buildBibliography(
  citations: ReportCitationRecord[],
  style: ReportCitationStyle,
): string[] {
  return [...citations]
    .sort((left, right) => {
      const authorLeft = left.authors[0]?.family ?? left.title;
      const authorRight = right.authors[0]?.family ?? right.title;
      return authorLeft.localeCompare(authorRight) || left.year - right.year;
    })
    .map((citation) => formatCitationBibliography(citation, style));
}

export function exportBibliography(
  citations: ReportCitationRecord[],
  format: CitationExportFormat,
): string {
  return citations
    .map((citation) => formatCitationRecord(citation, format))
    .join(format === "ris" ? "\n\n" : "\n\n");
}

export function searchCitations(
  citations: ReportCitationRecord[],
  query: string,
): ReportCitationRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return citations;
  }

  return citations.filter((citation) => {
    const haystack = [
      citation.title,
      citation.publisher,
      citation.journal,
      citation.year,
      citation.authors.map((author) => `${author.given} ${author.family}`).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
