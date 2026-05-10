import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProjectRegistryOptional } from "@/centerpanel/registry/state";
import { saveUrbanToPersist } from "@/centerpanel/registry/storage";
import { useFlowStore } from "@/stores/useFlowStore";
import { buildSectionsFromCompletedRun } from "./AutoNarrative";
import { searchCitations } from "./CitationManager";
import { extractInlineCitationIds, insertCitationToken } from "./citationTokens";
import { compileReport } from "./ReportEngine";
import { downloadCitationExport, downloadReportHtml, downloadReportMarkdown, downloadReportPdf } from "./export";
import { REPORTING_FIXTURE_CITATIONS, REPORTING_FIXTURE_RUNS } from "./fixtures";
import { drainPendingInserts, loadReportLibraryState, mergePendingInserts, saveReportLibraryState } from "./storage";
import { createReportFromTemplate, REPORT_TEMPLATES } from "./templates";
import type {
  ReportCitationAuthor,
  ReportCitationRecord,
  ReportDocument,
  ReportLibraryState,
  ReportParagraphBlock,
  ReportSection,
  ReportSectionKind,
  ReportTemplateId,
} from "./types";
import {
  applyProjectRecordPatch,
  appendProjectHistoryEvent,
  detectCompletedRunSourceMode,
  emitProjectHistoryRefresh,
  emitProjectHistoryEvent,
} from "@/features/collaboration/projectHistory";
import styles from "./reporting.module.css";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseAuthors(raw: string): ReportCitationAuthor[] {
  return raw
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [family, given] = item.split(",").map((part) => part.trim());
      return { family: family || "Unknown", given: given || "" };
    });
}

function formatAuthors(authors: ReportCitationAuthor[]): string {
  return authors.map((author) => `${author.family}, ${author.given}`.trim()).join("; ");
}

function createBlankSection(kind: ReportSectionKind = "analysis"): ReportSection {
  return {
    id: createId("section"),
    title: "New Section",
    kind,
    origin: "user",
    blocks: [{ kind: "paragraph", text: "Write the section narrative here." }],
    citationIds: [],
    generated: false,
  };
}

function mergeCitationPools(report: ReportDocument): ReportCitationRecord[] {
  const merged = new Map<string, ReportCitationRecord>();
  [...REPORTING_FIXTURE_CITATIONS, ...report.citations].forEach((citation) => {
    merged.set(citation.id, citation);
  });
  return Array.from(merged.values());
}

function paragraphKey(sectionId: string, blockIndex: number): string {
  return `${sectionId}::${blockIndex}`;
}

function labelFromSnakeCase(value: string): string {
  return value.replace(/_/g, " ");
}

function parseParagraphKey(value: string): { sectionId: string; blockIndex: number } | null {
  const [sectionId, blockIndexRaw] = value.split("::");
  const blockIndex = Number(blockIndexRaw);
  if (!sectionId || Number.isNaN(blockIndex)) {
    return null;
  }
  return { sectionId, blockIndex };
}

function getActiveReportFromLibrary(state: ReportLibraryState): ReportDocument | null {
  return state.reports.find((report) => report.id === state.activeReportId) ?? state.reports[0] ?? null;
}

function getFirstParagraphKey(section: ReportSection | null): string | null {
  if (!section) {
    return null;
  }
  const paragraphIndex = section.blocks.findIndex((block) => block.kind === "paragraph");
  return paragraphIndex >= 0 ? paragraphKey(section.id, paragraphIndex) : null;
}

function mergeSourceModes(modes: Array<"real" | "demo" | "mixed" | "unknown">): "real" | "demo" | "mixed" | "unknown" {
  const unique = new Set(modes.filter(Boolean));
  if (unique.has("mixed") || (unique.has("real") && unique.has("demo"))) {
    return "mixed";
  }
  if (unique.has("real")) {
    return "real";
  }
  if (unique.has("demo")) {
    return "demo";
  }
  return "unknown";
}

function resolveActiveParagraph(
  section: ReportSection | null,
  activeParagraphId: string | null,
): { key: string; index: number; block: ReportParagraphBlock } | null {
  if (!section || !activeParagraphId) {
    return null;
  }

  const parsed = parseParagraphKey(activeParagraphId);
  if (!parsed || parsed.sectionId !== section.id) {
    return null;
  }

  const block = section.blocks[parsed.blockIndex];
  if (!block || block.kind !== "paragraph") {
    return null;
  }

  return {
    key: activeParagraphId,
    index: parsed.blockIndex,
    block,
  };
}

export function isMapEvidenceReportSection(section: Pick<ReportSection, "badgeLabel" | "generated" | "title">): boolean {
  if (!section.generated) {
    return false;
  }
  const normalizedTitle = section.title.toLowerCase();
  return section.badgeLabel === "Map handoff" || (
    normalizedTitle.includes("map evidence") && normalizedTitle.includes("map finding")
  );
}

function findReproducibilitySection(document: ReportDocument, mapSection: ReportSection): ReportSection | null {
  const directId = mapSection.id.endsWith("-finding-section")
    ? mapSection.id.replace(/-finding-section$/, "-reproducibility-section")
    : null;
  if (directId) {
    const directMatch = document.sections.find((section) => section.id === directId);
    if (directMatch) {
      return directMatch;
    }
  }

  const titleRoot = mapSection.title.replace(/\s+-\s+Map Finding$/i, "");
  return document.sections.find((section) => (
    section.id !== mapSection.id
    && section.generated
    && section.badgeLabel === "Reproducibility block"
    && section.title.startsWith(`${titleRoot} -`)
  )) ?? null;
}

export function buildMapEvidenceFocusedReport(document: ReportDocument, sectionId: string): ReportDocument | null {
  const mapSection = document.sections.find((section) => section.id === sectionId);
  if (!mapSection || !isMapEvidenceReportSection(mapSection)) {
    return null;
  }

  const pairedSection = findReproducibilitySection(document, mapSection);
  const sections = [mapSection, pairedSection].filter((section): section is ReportSection => Boolean(section));
  const sectionOrder = sections
    .map((section) => section.id)
    .sort((left, right) => document.sectionOrder.indexOf(left) - document.sectionOrder.indexOf(right));

  return {
    ...document,
    id: `${document.id}-${mapSection.id}-pdf`,
    name: mapSection.title,
    description: pairedSection
      ? "Focused export of the map finding, structured references, caveats, and reproducibility block."
      : "Focused export of the map finding, structured references, and caveats.",
    sections,
    sectionOrder,
    linkedRunIds: [],
    updatedAt: new Date().toISOString(),
  };
}

interface InitialBuilderState {
  libraryState: ReportLibraryState;
  savedReportId: string | null;
  selectedSectionId: string | null;
  selectedCitationId: string | null;
  activeParagraphId: string | null;
}

function createInitialBuilderState(): InitialBuilderState {
  const libraryState = loadReportLibraryState();
  const activeReport = getActiveReportFromLibrary(libraryState);
  const selectedSectionId = activeReport?.sectionOrder[0] ?? activeReport?.sections[0]?.id ?? null;
  const selectedSection = activeReport?.sections.find((section) => section.id === selectedSectionId) ?? null;

  return {
    libraryState,
    savedReportId: libraryState.activeReportId ?? activeReport?.id ?? null,
    selectedSectionId,
    selectedCitationId: activeReport?.citations[0]?.id ?? REPORTING_FIXTURE_CITATIONS[0]?.id ?? null,
    activeParagraphId: getFirstParagraphKey(selectedSection),
  };
}

export const ReportBuilderPanel: React.FC = () => {
  const initialBuilderRef = useRef<InitialBuilderState | null>(null);
  if (!initialBuilderRef.current) {
    initialBuilderRef.current = createInitialBuilderState();
  }

  const initialBuilder = initialBuilderRef.current;
  const completedRuns = useFlowStore((state) => state.completedRuns);
  const effectiveRuns = completedRuns.length > 0 ? completedRuns : REPORTING_FIXTURE_RUNS;
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewSectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const paragraphRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const paragraphSelectionRef = useRef<Record<string, { start: number; end: number }>>({});
  const [libraryState, setLibraryState] = useState(initialBuilder.libraryState);
  const [savedReportId, setSavedReportId] = useState<string | null>(initialBuilder.savedReportId);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialBuilder.selectedSectionId);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(initialBuilder.selectedCitationId);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(initialBuilder.activeParagraphId);
  const [citationQuery, setCitationQuery] = useState("");
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const projectRegistry = useProjectRegistryOptional();

  const activeReport = useMemo(() => {
    return getActiveReportFromLibrary(libraryState);
  }, [libraryState]);
  const selectedProject = useMemo(
    () => (projectRegistry?.state.selectedProjectId
      ? projectRegistry.state.projects.find((project) => project.id === projectRegistry.state.selectedProjectId) ?? null
      : null),
    [projectRegistry?.state.projects, projectRegistry?.state.selectedProjectId],
  );
  const selectedProjectRef = useRef(selectedProject);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  useEffect(() => {
    if (!activeReport) {
      return;
    }
    if (!selectedSectionId || !activeReport.sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(activeReport.sectionOrder[0] ?? activeReport.sections[0]?.id ?? null);
    }
    if (!selectedCitationId || !activeReport.citations.some((citation) => citation.id === selectedCitationId)) {
      setSelectedCitationId(activeReport.citations[0]?.id ?? REPORTING_FIXTURE_CITATIONS[0]?.id ?? null);
    }
    setSavedReportId(activeReport.id);
  }, [activeReport, selectedCitationId, selectedSectionId]);

  useEffect(() => {
    saveReportLibraryState(libraryState);
  }, [libraryState]);

  useEffect(() => {
    const applyPending = () => {
      const pending = drainPendingInserts();
      if (pending.length === 0) {
        return;
      }
      const insertedSections = pending.flatMap((insert) => insert.sections);
      const focusSection = [...insertedSections]
        .reverse()
        .find(isMapEvidenceReportSection) ?? insertedSections[insertedSections.length - 1] ?? null;
      setLibraryState((prev) => {
        const target = prev.reports.find((report) => report.id === prev.activeReportId) ?? prev.reports[0];
        if (!target) {
          return prev;
        }
        const merged = mergePendingInserts(target, pending);
        return {
          ...prev,
          reports: prev.reports.map((report) => (report.id === merged.id ? merged : report)),
          activeReportId: merged.id,
        };
      });
      if (focusSection) {
        setSelectedSectionId(focusSection.id);
        setActiveParagraphId(getFirstParagraphKey(focusSection));
      }
    };

    applyPending();
    window.addEventListener("reporting/pending-changed", applyPending);
    return () => window.removeEventListener("reporting/pending-changed", applyPending);
  }, []);

  const compiled = useMemo(() => (activeReport ? compileReport(activeReport) : null), [activeReport]);
  const activeSection = useMemo(
    () => activeReport?.sections.find((section) => section.id === selectedSectionId) ?? null,
    [activeReport, selectedSectionId],
  );
  const activeParagraph = useMemo(
    () => resolveActiveParagraph(activeSection, activeParagraphId),
    [activeParagraphId, activeSection],
  );
  const citationPool = useMemo(() => (activeReport ? mergeCitationPools(activeReport) : REPORTING_FIXTURE_CITATIONS), [activeReport]);
  const citationResults = useMemo(() => searchCitations(citationPool, citationQuery), [citationPool, citationQuery]);
  const selectedCitation = useMemo(
    () => citationPool.find((citation) => citation.id === selectedCitationId) ?? null,
    [citationPool, selectedCitationId],
  );
  const activeParagraphCitationIds = useMemo(
    () => (activeParagraph ? extractInlineCitationIds(activeParagraph.block.text) : []),
    [activeParagraph],
  );
  const activeReportSourceMode = useMemo(() => {
    const linkedRuns = effectiveRuns.filter((run) => activeReport?.linkedRunIds.includes(run.runId));
    return mergeSourceModes((linkedRuns.length > 0 ? linkedRuns : effectiveRuns).map(detectCompletedRunSourceMode));
  }, [activeReport?.linkedRunIds, effectiveRuns]);

  function recordProjectHistory(detail: Parameters<typeof emitProjectHistoryEvent>[0]) {
    const currentProject = selectedProjectRef.current;
    if (projectRegistry?.actions && currentProject?.id) {
      const patch = appendProjectHistoryEvent(currentProject, detail);
      projectRegistry.actions.updateProject(currentProject.id, patch);
      saveUrbanToPersist(applyProjectRecordPatch(projectRegistry.state.projects, currentProject.id, patch));
      emitProjectHistoryRefresh(currentProject.id);
      return;
    }
    emitProjectHistoryEvent(detail);
  }

  useEffect(() => {
    const nextParagraphKey = activeParagraph ? activeParagraph.key : getFirstParagraphKey(activeSection);
    if (nextParagraphKey !== activeParagraphId) {
      setActiveParagraphId(nextParagraphKey);
    }
  }, [activeParagraph, activeParagraphId, activeSection]);

  function updateReport(mutator: (current: ReportDocument) => ReportDocument) {
    if (!activeReport) {
      return;
    }
    setLibraryState((prev) => ({
      ...prev,
      reports: prev.reports.map((report) => (report.id === activeReport.id ? mutator(report) : report)),
    }));
  }

  function loadTemplate(templateId: ReportTemplateId) {
    const next = createReportFromTemplate(templateId, {
      runs: effectiveRuns,
      fallbackRuns: REPORTING_FIXTURE_RUNS,
    });
    setLibraryState((prev) => ({
      ...prev,
      reports: [next, ...prev.reports],
      activeReportId: next.id,
    }));
    setExportStatus(`Loaded ${REPORT_TEMPLATES.find((template) => template.id === templateId)?.label ?? "template"}.`);
    recordProjectHistory({
      kind: "report-updated",
      title: `Loaded ${next.name}`,
      description: "Switched the report workspace to a fresh template-backed document.",
      sourceMode: activeReportSourceMode,
      artifact: { kind: "report", label: next.name, id: next.id },
      preview: next.description,
    });
  }

  function addBlankSection() {
    if (!activeReport) {
      return;
    }
    const nextSection = createBlankSection();
    updateReport((report) => {
      return {
        ...report,
        sections: [...report.sections, nextSection],
        sectionOrder: [...report.sectionOrder, nextSection.id],
        updatedAt: new Date().toISOString(),
      };
    });
    recordProjectHistory({
      kind: "report-updated",
      title: "Added report section",
      description: `Added ${nextSection.title} to ${activeReport.name}.`,
      sourceMode: activeReportSourceMode,
      artifact: { kind: "report", label: activeReport.name, id: activeReport.id },
      preview: nextSection.title,
    });
  }

  function insertRunSections() {
    if (!activeReport) {
      return;
    }
    const linked = new Set(activeReport.linkedRunIds);
    const runSections = effectiveRuns
      .filter((run) => !linked.has(run.runId))
      .flatMap((run) => buildSectionsFromCompletedRun(run));

    updateReport((report) => {
      if (runSections.length === 0) {
        return report;
      }

      return {
        ...report,
        sections: [...report.sections, ...runSections],
        sectionOrder: [...report.sectionOrder, ...runSections.map((section) => section.id)],
        linkedRunIds: Array.from(new Set([...report.linkedRunIds, ...effectiveRuns.map((run) => run.runId)])),
        updatedAt: new Date().toISOString(),
      };
    });
    if (runSections.length > 0) {
      recordProjectHistory({
        kind: "report-updated",
        title: "Inserted analytical evidence",
        description: `Added ${runSections.length} generated evidence section${runSections.length === 1 ? "" : "s"} from completed runs.`,
        sourceMode: activeReportSourceMode,
        artifact: { kind: "report", label: activeReport.name, id: activeReport.id },
        preview: runSections[0]?.title,
      });
    }
  }

  function renameReport(name: string) {
    updateReport((report) => ({
      ...report,
      name,
      updatedAt: new Date().toISOString(),
    }));
  }

  function restoreSavedReport() {
    if (!savedReportId || !activeReport) {
      return;
    }
    const restored = libraryState.reports.find((report) => report.id === savedReportId);
    setLibraryState((prev) => ({
      ...prev,
      activeReportId: savedReportId,
    }));
    recordProjectHistory({
      kind: "report-restored",
      title: `Restored ${restored?.name ?? "saved report"}`,
      description: "Loaded a saved report into the active review workspace.",
      sourceMode: activeReportSourceMode,
      artifact: { kind: "report", label: restored?.name ?? activeReport.name, id: restored?.id ?? savedReportId },
      ...(restored?.description ? { preview: restored.description } : {}),
    });
  }

  function handleSaveReport() {
    if (!activeReport) {
      return;
    }
    setExportStatus(`Saved ${activeReport.name}`);
    recordProjectHistory({
      kind: "report-saved",
      title: `Saved ${activeReport.name}`,
      description: "Persisted the current report structure and review narrative.",
      sourceMode: activeReportSourceMode,
      artifact: { kind: "report", label: activeReport.name, id: activeReport.id },
      preview: activeSection?.title ?? activeReport.description,
    });
  }

  function moveSection(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }
    updateReport((report) => {
      const order = [...report.sectionOrder];
      const sourceIndex = order.indexOf(sourceId);
      const targetIndex = order.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return report;
      }
      order.splice(sourceIndex, 1);
      order.splice(targetIndex, 0, sourceId);
      return {
        ...report,
        sectionOrder: order,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function updateSection(mutator: (section: ReportSection) => ReportSection) {
    if (!activeSection) {
      return;
    }
    updateReport((report) => ({
      ...report,
      sections: report.sections.map((section) => (section.id === activeSection.id ? mutator(section) : section)),
      updatedAt: new Date().toISOString(),
    }));
  }

  function addCitationToReport(citation: ReportCitationRecord) {
    updateReport((report) => {
      if (report.citations.some((item) => item.id === citation.id)) {
        return report;
      }
      return {
        ...report,
        citations: [...report.citations, citation],
        updatedAt: new Date().toISOString(),
      };
    });
    setSelectedCitationId(citation.id);
  }

  function attachCitationToSection(citationId: string) {
    if (!activeSection) {
      return;
    }
    updateSection((section) => ({
      ...section,
      citationIds: section.citationIds.includes(citationId)
        ? section.citationIds
        : [...section.citationIds, citationId],
    }));
  }

  function detachCitationFromSection(citationId: string) {
    if (!activeSection) {
      return;
    }
    updateSection((section) => ({
      ...section,
      citationIds: section.citationIds.filter((item) => item !== citationId),
    }));
  }

  function rememberParagraphSelection(sectionId: string, blockIndex: number, element: HTMLTextAreaElement) {
    const key = paragraphKey(sectionId, blockIndex);
    paragraphRefs.current[key] = element;
    paragraphSelectionRef.current[key] = {
      start: element.selectionStart ?? element.value.length,
      end: element.selectionEnd ?? element.value.length,
    };
    setActiveParagraphId(key);
  }

  function insertCitationIntoBody(citation: ReportCitationRecord) {
    if (!activeSection || !activeParagraph) {
      setExportStatus("Select a paragraph before inserting an inline citation.");
      return;
    }

    let nextSelection: { start: number; end: number } | null = null;
    const targetParagraphKey = activeParagraph.key;

    updateReport((report) => ({
      ...report,
      citations: report.citations.some((entry) => entry.id === citation.id)
        ? report.citations
        : [...report.citations, citation],
      sections: report.sections.map((section) => {
        if (section.id !== activeSection.id) {
          return section;
        }

        return {
          ...section,
          blocks: section.blocks.map((block, blockIndex) => {
            if (blockIndex !== activeParagraph.index || block.kind !== "paragraph") {
              return block;
            }

            const inserted = insertCitationToken(
              block.text,
              citation.id,
              paragraphSelectionRef.current[targetParagraphKey],
            );
            nextSelection = inserted.selection;
            return {
              ...block,
              text: inserted.text,
            };
          }),
        };
      }),
      updatedAt: new Date().toISOString(),
    }));

    setSelectedCitationId(citation.id);
    setExportStatus(`Inserted ${citation.title} into paragraph ${activeParagraph.index + 1}.`);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const element = paragraphRefs.current[targetParagraphKey];
        if (!element || !nextSelection) {
          return;
        }
        element.focus();
        element.setSelectionRange(nextSelection.start, nextSelection.end);
        paragraphSelectionRef.current[targetParagraphKey] = nextSelection;
      });
    }
  }

  async function handlePdfExport() {
    if (!activeReport || !previewRef.current) {
      return;
    }
    try {
      const filename = await downloadReportPdf(previewRef.current, activeReport);
      setExportStatus(`Exported ${filename}`);
    } catch {
      setExportStatus("PDF export could not complete.");
    }
  }

  function buildMapEvidencePdfNode(focusedReport: ReportDocument): HTMLDivElement | null {
    if (typeof window === "undefined") {
      return null;
    }

    const browserDocument = window.document;
    const focusedCompiled = compileReport(focusedReport);
    const node = browserDocument.createElement("div");
    node.className = `${styles.previewPaper} ${styles.mapEvidencePdfPaper}`;
    node.setAttribute("aria-hidden", "true");
    node.style.position = "absolute";
    node.style.left = "-10000px";
    node.style.top = "0";
    node.style.width = "920px";

    const header = browserDocument.createElement("header");
    header.className = styles.previewHero;
    const title = browserDocument.createElement("h1");
    title.textContent = focusedReport.name;
    const description = browserDocument.createElement("p");
    description.textContent = focusedReport.description;
    const meta = browserDocument.createElement("div");
    meta.className = styles.previewMeta;
    ["Map evidence PDF", focusedReport.citationStyle.toUpperCase(), new Date(focusedReport.updatedAt).toLocaleString()].forEach((value) => {
      const item = browserDocument.createElement("span");
      item.textContent = value;
      meta.appendChild(item);
    });
    header.append(title, description, meta);
    node.appendChild(header);

    for (const sectionId of focusedReport.sectionOrder) {
      const sourceSection = previewSectionRefs.current[sectionId];
      if (!sourceSection) {
        return null;
      }
      const clonedSection = sourceSection.cloneNode(true) as HTMLElement;
      clonedSection.querySelectorAll("button").forEach((button) => button.remove());
      node.appendChild(clonedSection);
    }

    if (focusedCompiled.bibliography.length > 0) {
      const bibliography = browserDocument.createElement("section");
      bibliography.className = styles.previewBibliography;
      const heading = browserDocument.createElement("h4");
      heading.textContent = "Bibliography";
      const list = browserDocument.createElement("ol");
      focusedCompiled.bibliography.forEach((entry, index) => {
        const item = browserDocument.createElement("li");
        item.textContent = entry;
        item.setAttribute("data-bibliography-index", String(index + 1));
        list.appendChild(item);
      });
      bibliography.append(heading, list);
      node.appendChild(bibliography);
    }

    return node;
  }

  async function handleMapEvidencePdfExport(sectionId: string) {
    if (!activeReport || typeof window === "undefined") {
      return;
    }

    const focusedReport = buildMapEvidenceFocusedReport(activeReport, sectionId);
    if (!focusedReport) {
      setExportStatus("Select a map evidence section before exporting a focused PDF.");
      return;
    }

    const pdfNode = buildMapEvidencePdfNode(focusedReport);
    if (!pdfNode) {
      setExportStatus("Map evidence PDF preview is not ready yet.");
      return;
    }

    window.document.body.appendChild(pdfNode);
    try {
      const filename = await downloadReportPdf(pdfNode, focusedReport);
      setExportStatus(`Exported ${filename}`);
    } catch {
      setExportStatus("Map evidence PDF export could not complete.");
    } finally {
      pdfNode.remove();
    }
  }

  if (!activeReport || !compiled) {
    return null;
  }

  return (
    <section className={styles.shell} aria-label="Structured report builder" data-testid="report-builder">
      <header className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <label className={styles.control}>
            <span>Template</span>
            <select value={activeReport.templateId} onChange={(event) => loadTemplate(event.target.value as ReportTemplateId)}>
              {REPORT_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.control}>
            <span>Saved Reports</span>
            <select value={savedReportId ?? ""} onChange={(event) => setSavedReportId(event.target.value || null)}>
              {libraryState.reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.controlWide}>
            <span>Report Name</span>
            <input type="text" value={activeReport.name} onChange={(event) => renameReport(event.target.value)} />
          </label>
          <label className={styles.control}>
            <span>Citation Style</span>
            <select
              value={activeReport.citationStyle}
              onChange={(event) =>
                updateReport((report) => ({
                  ...report,
                  citationStyle: event.target.value as ReportDocument["citationStyle"],
                  updatedAt: new Date().toISOString(),
                }))
              }
            >
              <option value="apa7">APA 7th</option>
              <option value="chicago">Chicago</option>
            </select>
          </label>
        </div>
        <div className={styles.toolbarGroup}>
          <button type="button" className={styles.ghostBtn} onClick={restoreSavedReport}>Restore</button>
          <button type="button" className={styles.ghostBtn} onClick={addBlankSection}>Add Section</button>
          <button type="button" className={styles.ghostBtn} onClick={insertRunSections}>Insert Run Evidence</button>
          <button type="button" className={styles.primaryBtn} onClick={handleSaveReport}>Save</button>
          <button type="button" className={styles.ghostBtn} onClick={() => setExportStatus(`Exported ${downloadReportMarkdown(activeReport)}`)}>Markdown</button>
          <button type="button" className={styles.ghostBtn} onClick={() => setExportStatus(`Exported ${downloadReportHtml(activeReport)}`)}>PDF-ready HTML</button>
          <button type="button" className={styles.primaryBtn} onClick={handlePdfExport}>PDF</button>
        </div>
      </header>

      <div className={styles.metaBar}>
        <span>{activeReport.metadata.audience}</span>
        <span>{activeReport.metadata.useCase}</span>
        <span>{compiled.figureReferences.length} figure(s)</span>
        <span>{compiled.tableReferences.length} table(s)</span>
        <span>{compiled.bibliography.length} reference(s)</span>
        <span>{exportStatus || "Live preview updates as sections move or references change."}</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.builderColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Section Order</h3>
                <p>Drag sections to reorder the report. Generated sections remain clearly labeled.</p>
              </div>
            </div>
            <div className={styles.sectionList}>
              {activeReport.sectionOrder.map((sectionId) => {
                const section = activeReport.sections.find((item) => item.id === sectionId);
                if (!section) {
                  return null;
                }
                const active = selectedSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    draggable
                    className={`${styles.sectionCard} ${active ? styles.sectionCardActive : ""}`}
                    onClick={() => setSelectedSectionId(section.id)}
                    onDragStart={() => setDraggedSectionId(section.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedSectionId) {
                        moveSection(draggedSectionId, section.id);
                      }
                      setDraggedSectionId(null);
                    }}
                  >
                    <span className={styles.dragHandle}>⋮⋮</span>
                    <span className={styles.sectionMeta}>
                      <strong>{section.title}</strong>
                      <span>{labelFromSnakeCase(section.kind)}</span>
                      {section.mapReviewEventIds?.length ? <span>Review event linked</span> : null}
                    </span>
                    {section.generated ? <span className={styles.generatedBadge}>{section.badgeLabel ?? "Generated"}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Section Editor</h3>
                <p>Edit section titles, narrative text, and captions without breaking report numbering.</p>
              </div>
            </div>
            {activeSection ? (
              <div className={styles.editorGrid}>
                {isMapEvidenceReportSection(activeSection) ? (
                  <div className={styles.mapEvidenceExportStrip}>
                    <span>
                      <strong>Current map evidence PDF</strong>
                      <small>Exports this map finding with its reproducibility block, references, caveats, and snapshot.</small>
                    </span>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => void handleMapEvidencePdfExport(activeSection.id)}
                    >
                      Download PDF
                    </button>
                  </div>
                ) : null}
                {activeSection.mapReviewEventIds?.length ? (
                  <div className={styles.reviewEventLinkStrip}>
                    <strong>Review timeline link</strong>
                    <span>{activeSection.mapReviewEventIds.join(", ")}</span>
                  </div>
                ) : null}
                <label className={styles.controlWide}>
                  <span>Title</span>
                  <input type="text" value={activeSection.title} onChange={(event) => updateSection((section) => ({ ...section, title: event.target.value }))} />
                </label>
                {activeSection.blocks.map((block, index) => {
                  if (block.kind === "paragraph") {
                    const currentParagraphKey = paragraphKey(activeSection.id, index);
                    return (
                      <label key={`${activeSection.id}-paragraph-${index}`} className={styles.controlBlock}>
                        <span>Paragraph {index + 1}</span>
                        <textarea
                          ref={(node) => {
                            paragraphRefs.current[currentParagraphKey] = node;
                          }}
                          rows={4}
                          value={block.text}
                          onFocus={(event) => rememberParagraphSelection(activeSection.id, index, event.currentTarget)}
                          onClick={(event) => rememberParagraphSelection(activeSection.id, index, event.currentTarget)}
                          onKeyUp={(event) => rememberParagraphSelection(activeSection.id, index, event.currentTarget)}
                          onSelect={(event) => rememberParagraphSelection(activeSection.id, index, event.currentTarget)}
                          onChange={(event) =>
                            updateSection((section) => ({
                              ...section,
                              blocks: section.blocks.map((item, itemIndex) =>
                                itemIndex === index && item.kind === "paragraph" ? { ...item, text: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </label>
                    );
                  }
                  if (block.kind === "bullet_list") {
                    return (
                      <label key={`${activeSection.id}-list-${index}`} className={styles.controlBlock}>
                        <span>Bullet List</span>
                        <textarea
                          rows={4}
                          value={block.items.join("\n")}
                          onChange={(event) =>
                            updateSection((section) => ({
                              ...section,
                              blocks: section.blocks.map((item, itemIndex) =>
                                itemIndex === index && item.kind === "bullet_list"
                                  ? { ...item, items: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </label>
                    );
                  }
                  if (block.kind === "figure") {
                    return (
                      <div key={`${activeSection.id}-figure-${index}`} className={styles.assetEditor}>
                        <label className={styles.controlWide}>
                          <span>Figure Title</span>
                          <input
                            type="text"
                            value={block.title}
                            onChange={(event) =>
                              updateSection((section) => ({
                                ...section,
                                blocks: section.blocks.map((item, itemIndex) => itemIndex === index && item.kind === "figure" ? { ...item, title: event.target.value } : item),
                              }))
                            }
                          />
                        </label>
                        <label className={styles.controlBlock}>
                          <span>Figure Caption</span>
                          <textarea
                            rows={3}
                            value={block.caption}
                            onChange={(event) =>
                              updateSection((section) => ({
                                ...section,
                                blocks: section.blocks.map((item, itemIndex) => itemIndex === index && item.kind === "figure" ? { ...item, caption: event.target.value } : item),
                              }))
                            }
                          />
                        </label>
                      </div>
                    );
                  }
                  return (
                    <div key={`${activeSection.id}-table-${index}`} className={styles.assetEditor}>
                      <label className={styles.controlWide}>
                        <span>Table Title</span>
                        <input
                          type="text"
                          value={block.title}
                          onChange={(event) =>
                            updateSection((section) => ({
                              ...section,
                              blocks: section.blocks.map((item, itemIndex) => itemIndex === index && item.kind === "table" ? { ...item, title: event.target.value } : item),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.controlBlock}>
                        <span>Table Caption</span>
                        <textarea
                          rows={3}
                          value={block.caption}
                          onChange={(event) =>
                            updateSection((section) => ({
                              ...section,
                              blocks: section.blocks.map((item, itemIndex) => itemIndex === index && item.kind === "table" ? { ...item, caption: event.target.value } : item),
                            }))
                          }
                        />
                      </label>
                    </div>
                  );
                })}
                <div className={styles.attachedList}>
                  <strong>Inline citation target</strong>
                  {activeParagraph ? (
                    <>
                      <span className={styles.emptyState}>
                        Cursor is set to paragraph {activeParagraph.index + 1}. Use Insert in Body to place the selected reference at the last caret position.
                      </span>
                      {activeParagraphCitationIds.length > 0 ? (
                        <div className={styles.inlineActions}>
                          {activeParagraphCitationIds.map((citationId) => {
                            const citation = citationPool.find((item) => item.id === citationId);
                            return (
                              <button
                                type="button"
                                key={citationId}
                                className={styles.attachedCitation}
                                onClick={() => setSelectedCitationId(citationId)}
                              >
                                {citation?.title ?? citationId}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={styles.emptyInline}>No inline citations in this paragraph yet.</span>
                      )}
                    </>
                  ) : (
                    <span className={styles.emptyInline}>Select a paragraph to place inline citations in the report body.</span>
                  )}
                </div>
              </div>
            ) : (
              <p className={styles.emptyState}>Select a section to edit its content and citations.</p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Citations</h3>
                <p>Search, attach, edit, and export references without leaving the builder.</p>
              </div>
            </div>
            <div className={styles.citationLayout}>
              <div className={styles.citationBrowser}>
                <label className={styles.controlWide}>
                  <span>Search References</span>
                  <input type="search" value={citationQuery} onChange={(event) => setCitationQuery(event.target.value)} placeholder="Search by author, title, year, publisher…" />
                </label>
                <div className={styles.citationResults}>
                  {citationResults.map((citation) => (
                    <button type="button" key={citation.id} className={`${styles.citationRow} ${selectedCitationId === citation.id ? styles.citationRowActive : ""}`} onClick={() => setSelectedCitationId(citation.id)}>
                      <span>
                        <strong>{citation.title}</strong>
                        <small>{citation.authors[0]?.family ?? "Unknown"} · {citation.year}</small>
                      </span>
                      <span className={styles.citationActions}>
                        <span>{activeReport.citations.some((item) => item.id === citation.id) ? "In report" : "Library"}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() =>
                      addCitationToReport({
                        id: createId("citation"),
                        type: "report",
                        title: "New reference",
                        authors: [{ family: "Author", given: "First" }],
                        year: new Date().getFullYear(),
                      })
                    }
                  >
                    New Citation
                  </button>
                  {selectedCitation ? (
                    <>
                      <button type="button" className={styles.ghostBtn} onClick={() => addCitationToReport(selectedCitation)}>Add to Report</button>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => insertCitationIntoBody(selectedCitation)}
                        disabled={!activeParagraph}
                      >
                        Insert in Body
                      </button>
                      <button type="button" className={styles.primaryBtn} onClick={() => attachCitationToSection(selectedCitation.id)}>Attach to Section</button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className={styles.citationEditor}>
                {selectedCitation ? (
                  <>
                    <label className={styles.controlWide}>
                      <span>Title</span>
                      <input
                        type="text"
                        value={selectedCitation.title}
                        onChange={(event) =>
                          updateReport((report) => ({
                            ...report,
                            citations: report.citations.map((citation) => citation.id === selectedCitation.id ? { ...citation, title: event.target.value } : citation),
                            updatedAt: new Date().toISOString(),
                          }))
                        }
                      />
                    </label>
                    <label className={styles.controlWide}>
                      <span>Authors</span>
                      <input
                        type="text"
                        value={formatAuthors(selectedCitation.authors)}
                        onChange={(event) =>
                          updateReport((report) => ({
                            ...report,
                            citations: report.citations.map((citation) => citation.id === selectedCitation.id ? { ...citation, authors: parseAuthors(event.target.value) } : citation),
                            updatedAt: new Date().toISOString(),
                          }))
                        }
                      />
                    </label>
                    <div className={styles.inlineGrid}>
                      <label className={styles.control}>
                        <span>Year</span>
                        <input
                          type="number"
                          value={selectedCitation.year}
                          onChange={(event) =>
                            updateReport((report) => ({
                              ...report,
                              citations: report.citations.map((citation) => citation.id === selectedCitation.id ? { ...citation, year: Number(event.target.value) || citation.year } : citation),
                              updatedAt: new Date().toISOString(),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.control}>
                        <span>Publisher</span>
                        <input
                          type="text"
                          value={selectedCitation.publisher ?? ""}
                          onChange={(event) =>
                            updateReport((report) => ({
                              ...report,
                              citations: report.citations.map((citation) => citation.id === selectedCitation.id ? { ...citation, publisher: event.target.value } : citation),
                              updatedAt: new Date().toISOString(),
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label className={styles.controlWide}>
                      <span>URL</span>
                      <input
                        type="text"
                        value={selectedCitation.url ?? ""}
                        onChange={(event) =>
                          updateReport((report) => ({
                            ...report,
                            citations: report.citations.map((citation) => citation.id === selectedCitation.id ? { ...citation, url: event.target.value } : citation),
                            updatedAt: new Date().toISOString(),
                          }))
                        }
                      />
                    </label>
                    <div className={styles.exportChips}>
                      <button type="button" className={styles.ghostBtn} onClick={() => setExportStatus(`Exported ${downloadCitationExport(activeReport, "apa7")}`)}>APA</button>
                      <button type="button" className={styles.ghostBtn} onClick={() => setExportStatus(`Exported ${downloadCitationExport(activeReport, "chicago")}`)}>Chicago</button>
                      <button type="button" className={styles.ghostBtn} onClick={() => setExportStatus(`Exported ${downloadCitationExport(activeReport, "bibtex")}`)}>BibTeX</button>
                      <button type="button" className={styles.ghostBtn} onClick={() => setExportStatus(`Exported ${downloadCitationExport(activeReport, "ris")}`)}>RIS</button>
                    </div>
                  </>
                ) : (
                  <p className={styles.emptyState}>Select a citation to edit its fields.</p>
                )}
                {activeSection ? (
                  <div className={styles.attachedList}>
                    <strong>Attached to “{activeSection.title}”</strong>
                    {activeSection.citationIds.length > 0 ? (
                      activeSection.citationIds.map((citationId) => {
                        const citation = citationPool.find((item) => item.id === citationId);
                        return (
                          <button type="button" key={citationId} className={styles.attachedCitation} onClick={() => detachCitationFromSection(citationId)}>
                            {citation?.title ?? citationId}
                          </button>
                        );
                      })
                    ) : (
                      <span className={styles.emptyInline}>No references attached yet.</span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <section className={styles.previewColumn}>
          <div className={styles.previewHeader}>
            <div>
              <h3>Live Preview</h3>
              <p>Preview refreshes immediately when sections, captions, references, or citation style change.</p>
            </div>
          </div>
          <div ref={previewRef} className={styles.previewPaper} data-testid="report-preview">
            <header className={styles.previewHero}>
              <h1>{activeReport.name}</h1>
              <p>{activeReport.description}</p>
              <div className={styles.previewMeta}>
                <span>{labelFromSnakeCase(activeReport.templateId)}</span>
                <span>{activeReport.citationStyle.toUpperCase()}</span>
                <span>{new Date(activeReport.updatedAt).toLocaleString()}</span>
              </div>
            </header>
            {compiled.sections.map((section) => (
              <article
                key={section.id}
                ref={(node) => {
                  previewSectionRefs.current[section.id] = node;
                }}
                className={`${styles.previewSection} ${section.generated ? styles.previewSectionGenerated : ""}`}
              >
                <div className={styles.previewSectionHead}>
                  <h4>{section.title}</h4>
                  <div className={styles.previewSectionActions}>
                    {isMapEvidenceReportSection(section) ? (
                      <button
                        type="button"
                        className={styles.previewPdfButton}
                        onClick={() => void handleMapEvidencePdfExport(section.id)}
                        aria-label={`Download PDF for ${section.title}`}
                      >
                        Download PDF
                      </button>
                    ) : null}
                    {section.generated ? <span className={styles.generatedBadge}>{section.badgeLabel ?? "Generated"}</span> : null}
                  </div>
                </div>
                {section.mapReviewEventIds?.length ? (
                  <div className={styles.previewReviewLink}>Review timeline event IDs: {section.mapReviewEventIds.join(", ")}</div>
                ) : null}
                {section.blocks.map((block, index) => {
                  if (block.kind === "paragraph") {
                    return <p key={`${section.id}-p-${index}`}>{block.text}</p>;
                  }
                  if (block.kind === "bullet_list") {
                    return (
                      <ul key={`${section.id}-list-${index}`}>
                        {block.items.map((item, itemIndex) => <li key={`${section.id}-item-${itemIndex}`}>{item}</li>)}
                      </ul>
                    );
                  }
                  if (block.kind === "figure") {
                    return (
                      <figure key={`${section.id}-fig-${index}`} className={styles.previewFigure}>
                        {block.dataUrl ? (
                          <img className={styles.previewFigureImage} src={block.dataUrl} alt={block.title} />
                        ) : (
                          <div className={styles.previewPlaceholder}>Figure {block.number}</div>
                        )}
                        <figcaption><strong>Figure {block.number}. {block.title}.</strong> {block.caption}</figcaption>
                      </figure>
                    );
                  }
                  return (
                    <div key={`${section.id}-tbl-${index}`} className={styles.previewTableWrap}>
                      <div className={styles.previewTableTitle}><strong>Table {block.number}. {block.title}.</strong> {block.caption}</div>
                      <table className={styles.previewTable}>
                        <thead>
                          <tr>{block.columns.map((column) => <th key={`${section.id}-${column}`}>{column}</th>)}</tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, rowIndex) => (
                            <tr key={`${section.id}-row-${rowIndex}`}>
                              {block.columns.map((column) => <td key={`${section.id}-${rowIndex}-${column}`}>{String(row[column] ?? "")}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </article>
            ))}
            <section className={styles.previewBibliography}>
              <h4>Bibliography</h4>
              <ol>
                {compiled.bibliography.map((entry, index) => <li key={`bib-${index}`}>{entry}</li>)}
              </ol>
            </section>
          </div>
        </section>
      </div>
    </section>
  );
};

export default ReportBuilderPanel;
