/* eslint-disable prefer-template */
/* eslint-disable sort-imports */
import React, { useEffect, useRef } from "react";
import styles from "../styles/note.module.css";
import { useNoteStore, type SlotKey } from "../../stores/useNoteStore";
import { useAccessStore } from "../../stores/useAccessStore";

import { useProjectRegistry } from "../registry/state";
import { saveUrbanToPersist } from "../registry/storage";
import type { ProjectRecord } from "../registry/types";

import { nowStamp } from "../lib/composeToNote";

import * as exp from "../lib/exporters";
import { computeExportGaps } from "./note-heuristics";
import ProjectHeader from "./ProjectHeader";
import { RecentChanges } from "./RecentChanges";
import UrbanContextStrip, { type KvPill, type UrbanInfoMode } from "../UrbanContextStrip";
import NoteSections, { type NoteSectionSlot } from "./NoteSections";
import NoteFooterBar from "./NoteFooterBar";
import { NOTE_GLOBAL_FOOTER } from "../Flows/legalCopy";
import LibraryInsertCard from "./LibraryInsertCard";
import { usePanelBridgeStore } from "../../stores/usePanelBridgeStore";
import { ReportBuilderPanel } from "@/services/reporting/ReportBuilderPanel";
import { useFlowStore } from "@/stores/useFlowStore";
import {
  useCollaborationOptional,
  useScopePresence,
} from "@/features/collaboration/hooks";
import type { ProjectHistoryEventDetail } from "@/features/collaboration/types";
import {
  applyProjectRecordPatch,
  PROJECT_HISTORY_EVENT,
  appendProjectHistoryEvent,
  appendProjectSnapshot,
  createProjectSnapshot,
  detectCompletedRunSourceMode,
  emitProjectHistoryRefresh,
  normalizeProjectSnapshots,
} from "@/features/collaboration/projectHistory";
import {
  CollaborationCommentSidebar,
  CollaborationPresenceStrip,
  CollaborationSessionOverview,
} from "@/features/collaboration/CollaborationUI";



export type NoteSlots = {
  objective?: string;
  methodology?: string;
  findings?: string;
  recommendations?: string;
  dataRefs?: string;
  limitations?: string;
  /** @deprecated legacy compat */
  summary?: string;
  plan?: string;
  refs?: string;
  outcome?: string;
  vitals?: string;
};

const EMPTY_SLOTS: NoteSlots = {
  objective: "",
  methodology: "",
  findings: "",
  recommendations: "",
  dataRefs: "",
  limitations: "",
  summary: "",
  plan: "",
  refs: "",
  outcome: "",
  vitals: "",
};

const REPORT_SLOT_ORDER: SlotKey[] = [
  "objective",
  "methodology",
  "findings",
  "recommendations",
  "dataRefs",
  "limitations",
  "summary",
  "plan",
  "refs",
  "outcome",
  "vitals",
];

const NOTE_PATCH_EVENT = "note/applyPatch";
const NOTE_CITE_EVENT = "note/addCitation";
const NOTE_COMPACT_KEY = "note/compactMode";
const NOTE_CAREPLAN_EVENT = "note/carePlanInserted";

function useDebouncedEffect(effect: () => void, deps: any[], delay = 350) {
  const first = useRef(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      effect();
      first.current = false;
    }, delay);

    return () => window.clearTimeout(id);
  }, deps);
}

function appendText(base: string, add: string, sep = "\n"): string {
  if (!add) return base ?? "";
  const current = String(base ?? "").trimEnd();
  const incoming = String(add ?? "").trimStart();
  if (!current) return incoming;
  if (!incoming) return current;
  return current + sep + incoming;
}

function patchSlots(slots: NoteSlots, patch: Partial<NoteSlots>): NoteSlots {
  const next = { ...slots } as NoteSlots;
  (Object.keys(patch) as (keyof NoteSlots)[]).forEach((key) => {
    const value = patch[key];
    if (typeof value === "string") {
      next[key] = appendText(String(next[key] ?? ""), value);
    }
  });
  return next;
}

const TPL_ANALYSIS_FRAMEWORK = [
  "Objective: Define the spatial extent, temporal window, and key indicators.",
  "Methodology: Outline analytical approach — data acquisition, preprocessing, spatial analysis, and validation steps.",
].join(" ");
const TPL_DATA_INVENTORY = [
  "Data sources: List all datasets with provider, format, CRS, temporal extent, and spatial resolution.",
  "Quality notes: Coverage gaps, known biases, and FAIR compliance status.",
].join(" ");
const TPL_METHODOLOGY = [
  "Methods: Spatial statistics applied (e.g., Moran's I, LISA, kernel density);",
  "network analysis parameters; remote sensing indices used;",
  "simulation model assumptions and boundary conditions documented.",
].join(" ");
const TPL_LIMITATIONS = [
  "Limitations: MAUP sensitivity noted; temporal alignment between datasets verified;",
  "edge effects and boundary assumptions documented; uncertainty bounds reported.",
].join(" ");
const TPL_LIMITATIONS_REF = "Methodology and limitation documentation added.";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };
const I = {
  Copy: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Clear: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 7h16M9 7v12m6-12v12M10 4h4l1 3H9l1-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Export: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v12m0-12 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Camera: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 8h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8l1.5-2h5L16 8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Diff: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M7 4h10M7 10h10M7 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 14v6m3-3h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Wide: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 6h8v12H4zM12 6h8v12h-8z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Narrow: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 6h4v12H4zM16 6h4v12h-4z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Clock: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Risk: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l9 16H3L12 3Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <path d="M12 9v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Badge: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V6h4l3-3Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Id: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

type FlowPreview = { id: string; name: string; summary: string; completedAt: number };

function asTime(value: any): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") return value;
  const time = Date.parse(String(value));
  return Number.isFinite(time) ? time : undefined;
}

function summarize(text: string, n = 120): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}


function collectCompletedFlows(state: any, project: any, _unused?: any): FlowPreview[] {
  const out: FlowPreview[] = [];
  if (!project) return out;

  const pid = project.id;

  const push = (item: any) => {
    if (!item) return;
    const completed = asTime(item.completedAt ?? item.completed ?? item.when);
    if (!completed) return;
    const name = String(item.name ?? item.title ?? item.flowName ?? "Flow");
    const raw =
      String(item.outcome ?? item.result ?? item.summary ?? item.text ?? "")
        .replace(/\n+/g, " ")
        .trim();
    const id = String(item.id ?? `${name}-${completed}`);
    out.push({ id, name, summary: summarize(raw || "(no summary)"), completedAt: completed });
  };

  const proj: any = project;
  if (Array.isArray(proj.flows)) proj.flows.forEach(push);
  if (Array.isArray(proj.flowRuns)) proj.flowRuns.forEach(push);

  const st: any = state;
  if (Array.isArray(st?.flowRuns)) {
    st.flowRuns
      .filter((r: any) => (!r.projectId || r.projectId === pid))
      .forEach(push);
  }
  if (st?.flowsByProject && Array.isArray(st.flowsByProject[pid])) {
    st.flowsByProject[pid].forEach(push);
  }

  return out.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
}

function formatWhen(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString();
}

function mergeSourceModes(modes: Array<"real" | "demo" | "mixed" | "unknown">): "real" | "demo" | "mixed" | "unknown" {
  const unique = new Set(modes.filter(Boolean));
  if (unique.has("mixed")) {
    return "mixed";
  }
  if (unique.has("real") && unique.has("demo")) {
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

export function composeNote(slots: NoteSlots): string {
  const parts: string[] = [];
  if (slots.objective) parts.push(`Objective\n${slots.objective.trim()}`);
  if (slots.methodology) parts.push(`Methodology\n${slots.methodology.trim()}`);
  if (slots.findings) parts.push(`Findings\n${slots.findings.trim()}`);
  if (slots.recommendations) parts.push(`Recommendations\n${slots.recommendations.trim()}`);
  if (slots.dataRefs) parts.push(`Data References\n${slots.dataRefs.trim()}`);
  if (slots.limitations) parts.push(`Limitations\n${slots.limitations.trim()}`);
  return parts.join("\n\n");
}

const SLOT_TITLES: Record<SlotKey, string> = {
  objective: "Objective",
  methodology: "Methodology",
  findings: "Findings",
  recommendations: "Recommendations",
  dataRefs: "Data References",
  limitations: "Limitations",
  summary: "Summary",
  plan: "Plan",
  refs: "References (APA)",
  outcome: "Flow Outcome",
  vitals: "Vitals / Results",
};

const Note: React.FC = () => {
  const slots = useNoteStore();
  const active = useNoteStore((state) => (state as any).activeSlot as SlotKey);
  const canEdit = useAccessStore((state) => state.canEdit());
  const collaboration = useCollaborationOptional();

  const { state, actions } = useProjectRegistry();
  const completedRuns = useFlowStore((store) => store.completedRuns);
  const project: ProjectRecord | undefined = state.selectedProjectId
    ? state.projects.find((entry) => entry.id === state.selectedProjectId)
    : undefined;
  const projectRef = React.useRef<ProjectRecord | undefined>(project);
  React.useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const noteScopeId = project?.id ? `note:${project.id}` : undefined;
  const notePresence = useScopePresence(noteScopeId);
  const displayProject: ProjectRecord | undefined = project ?? (state.projects[0] ?? undefined);
  const collaborativeNote = collaboration && project?.id ? collaboration.notes.get(project.id) : null;
  const isCollaborativeProject = Boolean(project?.id && collaboration);

  const [buffer, setBuffer] = React.useState<NoteSlots>(EMPTY_SLOTS);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | undefined>(undefined);
  const hasSelection = Boolean(project);

  const [footerMsg, setFooterMsg] = React.useState<string | null>(null);
  const transientFlash = (message: string) => {
    setFooterMsg(message);
    window.setTimeout(() => setFooterMsg(null), 1800);
  };

  const [, setRecentCarePlanInsert] = React.useState(false);
  const [phase, setPhase] = React.useState<"capture" | "polish">("capture");
  const openSlot = active;
  const selectTab = (slot: SlotKey) => useNoteStore.getState().setActiveSlot(slot);
  const toggleSlot = (slot: SlotKey) => selectTab(slot);
  const textRefs = React.useRef<Partial<Record<SlotKey, HTMLTextAreaElement | null>>>({});
  const sectionRefs = React.useRef<Partial<Record<SlotKey, HTMLDivElement | null>>>({});

  const reportSlotPresence = React.useCallback((slot: SlotKey, source?: HTMLTextAreaElement | HTMLElement | null) => {
    if (!collaboration || !project?.id) {
      return;
    }
    const selectionText = source && "value" in source
      ? source.value.slice(
          source.selectionStart ?? 0,
          Math.min(source.selectionEnd ?? 0, (source.selectionStart ?? 0) + 48),
        ).trim()
      : source?.textContent?.trim() ?? "";

    collaboration.updatePresence({
      activeScope: `note:${project.id}`,
      activeSection: slot,
      activeLabel: SLOT_TITLES[slot],
      selectionText: selectionText || SLOT_TITLES[slot],
    });
  }, [collaboration, project?.id]);

  React.useEffect(() => {
    if (!collaboration || !project?.id) {
      return;
    }
    reportSlotPresence(active);
  }, [active, collaboration, project?.id, reportSlotPresence]);

  React.useEffect(() => {
    function onInsert(ev: Event) {
      const detail = (ev as CustomEvent).detail as { markdown: string } | undefined;
      const md = detail?.markdown ?? "";
      if (!md) return;
      try {

        (window as any).editorBridge?.insertMarkdownAtCursor?.(md);
        return;
      } catch {}

      try { navigator.clipboard?.writeText(md); } catch {}
    }
    window.addEventListener("analysis-timer:insert-into-note", onInsert as EventListener);
    return () => window.removeEventListener("analysis-timer:insert-into-note", onInsert as EventListener);
  }, []);


  React.useEffect(() => {
    if (hasSelection && !isCollaborativeProject) {
      setBuffer({ ...EMPTY_SLOTS });
      setLastSavedAt(Date.now());
    }

  }, [hasSelection, isCollaborativeProject, project?.id]);


  // Urban project model: note buffer is local — no session slot sync needed.
  // Auto-save to note store instead.

  useDebouncedEffect(() => {
    if (isCollaborativeProject) return;
    if (!canEdit) return;
    try {
      setLastSavedAt(Date.now());
    } catch (e) {

      console.warn("[Note] auto-save failed:", e);
    }
  }, [buffer, hasSelection, canEdit, isCollaborativeProject, project?.id], 350);


  React.useEffect(() => {
    function onPatch(ev: Event) {
      const e = ev as CustomEvent<Partial<NoteSlots>>;
      if (!e.detail) return;
      if (isCollaborativeProject && collaboration && project?.id) {
        const next = patchSlots({ ...EMPTY_SLOTS, ...(collaborativeNote?.slots ?? {}) }, e.detail!);
        (Object.keys(e.detail) as (keyof NoteSlots)[]).forEach((slot) => {
          const value = next[slot];
          if (typeof value === "string") {
            collaboration.notes.setSlot(project.id!, slot, value);
          }
        });
        return;
      }
      setBuffer(prev => patchSlots(prev, e.detail!));
    }
    window.addEventListener(NOTE_PATCH_EVENT, onPatch as EventListener);
    return () => window.removeEventListener(NOTE_PATCH_EVENT, onPatch as EventListener);
  }, [collaboration, collaborativeNote?.slots, isCollaborativeProject, project?.id]);


  React.useEffect(() => {
    const onCare = () => {
      setRecentCarePlanInsert(true);
      const id = window.setTimeout(() => setRecentCarePlanInsert(false), 60_000);
      return () => window.clearTimeout(id);
    };
    window.addEventListener(NOTE_CAREPLAN_EVENT, onCare);
    return () => window.removeEventListener(NOTE_CAREPLAN_EVENT, onCare);
  }, []);


  const getSlotValue = (slot: SlotKey): string => {
    if (isCollaborativeProject) {
      return String(collaborativeNote?.slots?.[slot] ?? "");
    }
    const bufferVal = (buffer as any)?.[slot] ?? "";
    const localVal = (slots as any)?.[slot] ?? "";
    return hasSelection ? String(bufferVal ?? "") : String(localVal ?? "");
  };
  const setSlotValue = (slot: SlotKey, v: string) => {
    if (!canEdit) return;
    if (isCollaborativeProject && project?.id && collaboration) {
      collaboration.notes.setSlot(project.id, slot, v);
      return;
    }
    if (hasSelection) setBuffer(prev => ({ ...prev, [slot]: v }));
    else slots.setSlot(slot, v);
  };

  const currentProjectSourceMode = React.useMemo(
    () => mergeSourceModes(completedRuns.slice(0, 8).map(detectCompletedRunSourceMode)),
    [completedRuns],
  );

  const projectSnapshots = React.useMemo(
    () => normalizeProjectSnapshots(project?.reportSnapshots),
    [project?.reportSnapshots],
  );

  const [selectedSnapId, setSelectedSnapId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedSnapId) {
      return;
    }
    if (!projectSnapshots.some((snapshot) => snapshot.id === selectedSnapId)) {
      setSelectedSnapId(projectSnapshots[0]?.id ?? null);
    }
  }, [projectSnapshots, selectedSnapId]);

  React.useEffect(() => {
    if (!hasSelection || !project?.id) {
      return;
    }
    const onProjectHistory = (event: Event) => {
      const detail = (event as CustomEvent<ProjectHistoryEventDetail>).detail;
      const currentProject = projectRef.current;
      if (!detail || !currentProject?.id) {
        return;
      }
      const patch = appendProjectHistoryEvent(currentProject, detail);
      actions.updateProject(currentProject.id, patch);
      saveUrbanToPersist(applyProjectRecordPatch(state.projects, currentProject.id, patch));
      emitProjectHistoryRefresh(currentProject.id);
      transientFlash(detail.title);
    };

    window.addEventListener(PROJECT_HISTORY_EVENT, onProjectHistory as EventListener);
    return () => window.removeEventListener(PROJECT_HISTORY_EVENT, onProjectHistory as EventListener);
  }, [actions, hasSelection, project?.id, state.projects]);

  const clear = () => {
    if (!canEdit) return;
    setSlotValue(active, "");
  };

  const copy = async () => { try { await navigator.clipboard.writeText(getSlotValue(active)); } catch {} };


  const updatedLocal = React.useMemo(() => new Date((slots as any).updatedAt).toLocaleString(), [(slots as any).updatedAt]);
  const updatedProject = isCollaborativeProject
    ? (collaborativeNote?.updatedAt ? new Date(collaborativeNote.updatedAt).toLocaleString() : "—")
    : (lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "—");
  const updated = hasSelection ? updatedProject : updatedLocal;


  const charCount = (String(getSlotValue(active) || "")).length;
  const lastSavedHumanTime = React.useMemo(() => {
    const t = hasSelection
      ? (isCollaborativeProject ? collaborativeNote?.updatedAt : lastSavedAt)
      : (slots as any).updatedAt;
    if (!t) return "—";
    try { return new Date(t).toLocaleTimeString(); } catch { return "—"; }
  }, [collaborativeNote?.updatedAt, hasSelection, isCollaborativeProject, lastSavedAt, (slots as any).updatedAt]);


  function dynamicHintForSlot(slot: SlotKey): string {
    switch (slot) {
      case "objective":
        return "Define the research question, study scope, and analysis objectives.";
      case "methodology":
        return "Describe methods, tools, workflows, and analytical approaches used.";
      case "findings":
        return "Key results: metrics, patterns, spatial analysis outputs, indicator values.";
      case "recommendations":
        return "Policy and design recommendations based on analysis findings.";
      case "dataRefs":
        return "Datasets used with citations, sources, and temporal/spatial extents.";
      case "limitations":
        return "Caveats, uncertainty bounds, data quality issues, and assumptions.";
      case "summary":
        return "Brief overview of the analysis and key takeaways.";
      case "plan":
        return "Next steps, follow-up analyses, and coordination tasks.";
      case "refs":
        return "Academic references, guideline citations, methodology sources.";
      case "outcome":
        return "Analysis outcome, deliverables produced, decisions supported.";
      case "vitals":
        return "Key metrics and indicator values from the analysis.";
      default:
        return "Documentation.";
    }
  }


  function renderContextBarForSlot(slot: SlotKey, _slotText: string, _curPhase: "capture"|"polish") {
    const chips: Array<{ key: string; label: string; warn?: boolean; onClick?: () => void; title?: string }>=[];
    if (slot === "objective") {
      chips.push({ key: "scope", label: "Scope defined?" });
      chips.push({ key: "rq", label: "Research question clear?" });
      chips.push({ key: "scale", label: "Scale appropriate?" });
    } else if (slot === "methodology") {
      chips.push({ key: "repro", label: "Reproducible?" });
      chips.push({ key: "crs", label: "CRS documented?", warn: true });
      chips.push({ key: "tools", label: "Tools listed?" });
    } else if (slot === "findings") {
      chips.push({ key: "stat", label: "Statistical significance?" });
      chips.push({ key: "vis", label: "Visualized?" });
      chips.push({ key: "uncert", label: "Uncertainty noted?", warn: true });
    } else if (slot === "recommendations") {
      chips.push({ key: "equity", label: "Equity impact considered?", warn: true });
      chips.push({ key: "feasibility", label: "Feasibility assessed?" });
    } else if (slot === "dataRefs") {
      chips.push({ key: "src", label: "Add dataset source?", onClick: () => {
        const add = "Dataset source: [name], [provider], accessed [date].";
        const prev = getSlotValue("dataRefs");
        setSlotValue("dataRefs", appendText(prev, add));
        transientFlash("Added data reference template");
      }});
      chips.push({ key: "fair", label: "FAIR principles met?" });
    } else if (slot === "limitations") {
      chips.push({ key: "maup", label: "MAUP acknowledged?" });
      chips.push({ key: "temporal", label: "Temporal mismatch?" });
      chips.push({ key: "coverage", label: "Coverage gaps?" });
    }
    return (
      <>
        {chips.map(c => (
          <button
            key={c.key}
            className={c.warn ? styles.contextChipWarn : styles.contextChip}
            onClick={(e) => { e.stopPropagation(); if (c.onClick) c.onClick(); }}
            title={c.title}
            type="button"
          >
            {c.label}
          </button>
        ))}
      </>
    );
  }

  /** Normalize urban-analytics text: standardize terminology. */
  function cleanToneText(raw: string): string {
    let t = String(raw || "");
    t = t.replace(/\bCRS\b/g, "coordinate reference system");
    t = t.replace(/\bMAUP\b/g, "Modifiable Areal Unit Problem");
    t = t.replace(/\bFAIR\b/g, "Findable, Accessible, Interoperable, Reusable");
    return t;
  }

  /** Tighten whitespace and formatting. */
  function tightenText(raw: string): string {
    let t = String(raw || "");
    t = t.split(/\r?\n/).map(l => l.replace(/\s+$/g, "").replace(/^\s+/g, "")).join("\n");
    t = t.replace(/\n{3,}/g, "\n\n");
    t = t.replace(/[ \t]{2,}/g, " ");
    return t.trimEnd();
  }

  const normalizeSlot = (slot: SlotKey) => {
    const currentSlotValue = getSlotValue(slot);
    const updatedText = cleanToneText(currentSlotValue);
    if (updatedText !== currentSlotValue) {
      setSlotValue(slot, updatedText);
      transientFlash("Tone cleaned");
    }
  };
  const tightenSlot = (slot: SlotKey) => {
    const currentSlotValue = getSlotValue(slot);
    const updatedText = tightenText(currentSlotValue);
    if (updatedText !== currentSlotValue) {
      setSlotValue(slot, updatedText);
      transientFlash("Tightened");
    }
  };

  function timeStampStr() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm} — `;
  }
  function insertAtCursor(slot: SlotKey, insertStr: string) {
    const ta = textRefs.current[slot];
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;
    const prev = getSlotValue(slot);
    const next = prev.slice(0, start) + insertStr + prev.slice(end);
    setSlotValue(slot, next);
    requestAnimationFrame(() => {
      try {
        ta.focus();
        const pos = start + insertStr.length;
        ta.setSelectionRange(pos, pos);
      } catch {}
    });

  }

  type DiffSeg = { kind: "same" | "add" | "del"; text: string };
  function lcs(a: string[], b: string[]): number[][] {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
    }
    return dp;
  }
  function diffLines(prev: string, curr: string): DiffSeg[] {
    const A = (prev || "").split(/\r?\n/);
    const B = (curr || "").split(/\r?\n/);
    const dp = lcs(A,B);
    let i=A.length, j=B.length;
    const rev: DiffSeg[] = [];
    while (i>0 && j>0) {
      if (A[i-1] === B[j-1]) { rev.push({kind:"same", text:B[j-1]}); i--; j--; }
      else if (dp[i-1][j] >= dp[i][j-1]) { rev.push({kind:"del", text:A[i-1]}); i--; }
      else { rev.push({kind:"add", text:B[j-1]}); j--; }
    }
    while (i>0) { rev.push({kind:"del", text:A[i-1]}); i--; }
    while (j>0) { rev.push({kind:"add", text:B[j-1]}); j--; }
    return rev.reverse();
  }

  const [expOpen, setExpOpen] = React.useState(false);
  const [diffOpen, setDiffOpen] = React.useState(false);
  const [exportGaps, setExportGaps] = React.useState<{ missingRisk?: boolean; missingFollow?: boolean }>({});

  const [diffForSlot, setDiffForSlot] = React.useState<SlotKey>(active);
  const [diffTwoCol, setDiffTwoCol] = React.useState<boolean>(false);
  const [infoMode, setInfoMode] = React.useState<UrbanInfoMode>("overview");

  React.useEffect(() => {
    if (!expOpen) return;
    const sum = hasSelection ? String(buffer.summary || "") : String((slots as NoteSlots).summary || "");
    const planVal = hasSelection ? String(buffer.plan || "") : String((slots as NoteSlots).plan || "");
    setExportGaps(computeExportGaps({ summary: sum, plan: planVal }));

  }, [expOpen]);

  const snapCount = projectSnapshots.length;

  const lastSnap = React.useMemo(() => projectSnapshots[0], [projectSnapshots]);

  const selectedSnap = React.useMemo(
    () => projectSnapshots.find((snapshot) => snapshot.id === selectedSnapId) ?? null,
    [projectSnapshots, selectedSnapId],
  );
  const comparisonSnapshot = selectedSnap || lastSnap;

  function takeSnapshot() {
    if (hasSelection && canEdit && project?.id) {
      const snapshot = createProjectSnapshot({
        label: `${project.name} snapshot`,
        slots: Object.fromEntries(REPORT_SLOT_ORDER.map((slot) => [slot, getSlotValue(slot)])),
        sourceMode: currentProjectSourceMode,
        artifact: {
          kind: "snapshot",
          label: `${project.name} review snapshot`,
        },
      });
      const patch = appendProjectSnapshot(project, snapshot);
      actions.updateProject(project.id, patch);
      saveUrbanToPersist(applyProjectRecordPatch(state.projects, project.id, patch));
      emitProjectHistoryRefresh(project.id);
      setSelectedSnapId(snapshot.id);
      transientFlash(`Snapshot saved for ${project.name}`);
    }
  }

  const prevText = React.useMemo(
    () => {
      return comparisonSnapshot ? String((comparisonSnapshot.slots as any)[diffForSlot] ?? "") : "";
    },
    [comparisonSnapshot, diffForSlot]
  );
  const currText = React.useMemo(
    () => String((hasSelection ? (buffer as any)[diffForSlot] : (slots as any)[diffForSlot]) ?? ""),
    [hasSelection, buffer, slots, diffForSlot]
  );
  const segs = React.useMemo(() => diffLines(prevText, currText), [prevText, currText]);



  async function doCopyMarkdown() {
    const src: NoteSlots = hasSelection ? buffer : {
      objective: (slots as any).objective, methodology: (slots as any).methodology, findings: (slots as any).findings, recommendations: (slots as any).recommendations, dataRefs: (slots as any).dataRefs, limitations: (slots as any).limitations
    };
  try { await navigator.clipboard.writeText(exp.buildMarkdown(src)); } catch(e) { console.warn("copy md", e); }
    setExpOpen(false);
  }
  async function doCopyHTML() {
    const src: NoteSlots = hasSelection ? buffer : {
      objective: (slots as any).objective, methodology: (slots as any).methodology, findings: (slots as any).findings, recommendations: (slots as any).recommendations, dataRefs: (slots as any).dataRefs, limitations: (slots as any).limitations
    };
  try { await navigator.clipboard.writeText(exp.buildHTML(src)); } catch(e) { console.warn("copy html", e); }
    setExpOpen(false);
  }
  function doDownloadHTML() {
    const src: NoteSlots = hasSelection ? buffer : {
      objective: (slots as any).objective, methodology: (slots as any).methodology, findings: (slots as any).findings, recommendations: (slots as any).recommendations, dataRefs: (slots as any).dataRefs, limitations: (slots as any).limitations
    };
  const blob = new Blob([exp.buildHTML(src)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "urban-analysis-report.html"; a.click();
    URL.revokeObjectURL(url);
    setExpOpen(false);
  }
  function doPrint() {
    const src: NoteSlots = hasSelection ? buffer : {
      objective: (slots as any).objective, methodology: (slots as any).methodology, findings: (slots as any).findings, recommendations: (slots as any).recommendations, dataRefs: (slots as any).dataRefs, limitations: (slots as any).limitations
    };
  const html = exp.buildHTML(src);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
    setExpOpen(false);
  }




  const pillsByMode = React.useMemo(() => {
    const p = displayProject;
    const overviewPills: KvPill[] = [];
    if (p?.name) overviewPills.push({ id: "ov-name", label: "Project", value: p.name });
    if ((p as any)?.scale) overviewPills.push({ id: "ov-scale", label: "Scale", value: String((p as any).scale) });
    if ((p as any)?.area) overviewPills.push({ id: "ov-area", label: "Area", value: String((p as any).area) });

    const dataPills: KvPill[] = [];
    if ((p as any)?.datasetCount != null) dataPills.push({ id: "dt-cnt", label: "Datasets", value: String((p as any).datasetCount) });
    if ((p as any)?.formats) dataPills.push({ id: "dt-fmt", label: "Formats", value: String((p as any).formats) });

    const indicatorPills: KvPill[] = [];
    if ((p as any)?.walkScore != null) indicatorPills.push({ id: "ind-walk", label: "Walk Score", value: String((p as any).walkScore), severity: (p as any).walkScore >= 70 ? "ok" : (p as any).walkScore >= 40 ? "med" : "high" });
    if ((p as any)?.greenRatio != null) indicatorPills.push({ id: "ind-green", label: "Green Ratio", value: String((p as any).greenRatio), severity: (p as any).greenRatio >= 0.3 ? "ok" : "med" });

    const flagPills: KvPill[] = [];
    if ((p as any)?.crsMismatch) flagPills.push({ id: "fl-crs", label: "CRS Mismatch", value: "Yes", severity: "high" });
    if ((p as any)?.temporalGap) flagPills.push({ id: "fl-temp", label: "Temporal Gap", value: String((p as any).temporalGap), severity: "med" });

    const sessionPills: KvPill[] = [];
    sessionPills.push({ id: "ses-mode", label: "Mode", value: hasSelection ? "Project" : "Local", severity: "info" });

    return { overviewPills, dataPills, indicatorPills, flagPills, sessionPills };
  }, [displayProject, hasSelection]);

  return (
    <div className={styles.noteWrap} aria-label="Note composer">
      <section className={styles.editor}>
        <div className={styles.centerWrap}>
          <div className={styles.canvas}>
        <div className={styles.pageWrap}>
        {}
        <ProjectHeader
          projectName={displayProject?.name ?? (hasSelection ? "Project" : "No project selected")}
          {...(hasSelection && project?.id ? { projectId: project.id } : {})}
          tagBadges={displayProject ? ((displayProject as any).tags ?? []) : ["Local report"]}

          lastUpdatedLabel={`Updated: ${updated}`}

          autosaveLabel={hasSelection ? "Autosave" : "Local"}
          actionsNode={isCollaborativeProject ? (
            <CollaborationPresenceStrip
              participants={notePresence}
              compact
              label="Shared note"
              emptyLabel="No collaborators are active in this note yet."
            />
          ) : undefined}
          belowNode={
            <>
              <UrbanContextStrip
                infoMode={infoMode}
                onSelectInfoMode={setInfoMode}
                overviewPills={pillsByMode.overviewPills}
                dataPills={pillsByMode.dataPills}
                indicatorPills={pillsByMode.indicatorPills}
                flagPills={pillsByMode.flagPills}
                sessionPills={pillsByMode.sessionPills}
                stickyEnabled={false}
                tone="in-header"
              />
              {isCollaborativeProject ? (
                <CollaborationPresenceStrip
                  participants={notePresence}
                  label="Active note focus"
                  compact
                  emptyLabel="Presence indicators appear here when another analyst focuses a section."
                />
              ) : null}
            </>
          }
        />

        <div className={styles.mainAndDockWrap}>
          <div className={styles.mainColumn}>
            <ReportBuilderPanel />

            <div className={styles.slotTabs} role="tablist" aria-label="Report sections">
              {(["objective","methodology","findings","recommendations","dataRefs","limitations"] as SlotKey[]).map(s => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={openSlot === s}
                  className={styles.slotTab}
                  data-active={openSlot === s}
                  onClick={() => selectTab(s)}
                  type="button"
                  title={SLOT_TITLES[s]}
                >
                  {SLOT_TITLES[s]}
                </button>
              ))}
            </div>

          {(() => {
            const slotsArr: NoteSectionSlot[] = (["objective","methodology","findings","recommendations","dataRefs","limitations"] as SlotKey[]).map((slot) => {
              const isOpen = openSlot === slot;
              const text = getSlotValue(slot);
              const slotPresence = notePresence.filter((presence) => !presence.isSelf && presence.activeSection === slot);
              return {
                slotId: slot,
                title: SLOT_TITLES[slot],
                description: dynamicHintForSlot(slot),
                isOpen,
                onToggle: () => toggleSlot(slot),
                charCountLabel: `${String(text || "").length} chars`,
                lastSavedLabel: `last saved ${lastSavedHumanTime}`,

                phaseMode: phase === "capture" ? "live" : "polish",
                onTogglePhaseMode: () => setPhase(prev => (prev === "capture" ? "polish" : "capture")),
                onCleanTone: () => { if (canEdit) normalizeSlot(slot); },
                onTighten: () => { if (canEdit) tightenSlot(slot); },
                onInsertTimestamp: () => {
                  if (canEdit) {
                    insertAtCursor(slot, timeStampStr());
                    transientFlash("Timestamp inserted");
                  }
                },

                contextNode: (
                  <div style={{ display: "grid", gap: 8, width: "100%" }}>
                    <span style={{ opacity: phase === "polish" ? 0.7 : 1 }}>{renderContextBarForSlot(slot, text, phase)}</span>
                    <CollaborationPresenceStrip
                      participants={slotPresence}
                      compact
                      label={`${SLOT_TITLES[slot]} focus`}
                      emptyLabel="Section selection indicators will appear here."
                    />
                  </div>
                ),
                editorNode: (
                  <>
                    {hasSelection ? (
                      <RecentChanges
                        slot={slot}
                        {...(project?.id ? { projectId: project.id } : {})}
                        onDiff={(snapId) => {
                          setSelectedSnapId(snapId);
                          setDiffForSlot(slot);
                          setDiffOpen(true);
                        }}
                      />
                    ) : null}
                    <textarea
                      ref={(el) => { textRefs.current[slot] = el; }}
                      className={`${styles.ta} ${styles.editorArea}`}
                      value={text}
                      onChange={(e) => {
                        if (!canEdit) return;
                        setSlotValue(slot, e.target.value);
                        reportSlotPresence(slot, e.currentTarget);
                      }}
                      onFocus={(e) => reportSlotPresence(slot, e.currentTarget)}
                      onClick={(e) => reportSlotPresence(slot, e.currentTarget)}
                      onKeyUp={(e) => reportSlotPresence(slot, e.currentTarget)}
                      onSelect={(e) => reportSlotPresence(slot, e.currentTarget)}
                      readOnly={!canEdit}
                      spellCheck={false}
                      aria-label={`${SLOT_TITLES[slot]} editor`}
                    />
                  </>
                ),
                guidanceNode: (!text || !String(text).trim()) ? (
                  <>
                    This section is empty. Add content from Quick Actions or Templates (left rail), paste citations, or type freely.
                  </>
                ) : undefined,
                containerClassName: styles.slotContainer,
                containerRef: (el) => { sectionRefs.current[slot] = el; },
              } satisfies NoteSectionSlot;
            });
            return <NoteSections slots={slotsArr} />;
          })()}
          {}

        {!!diffOpen && !!lastSnap && (diffTwoCol ? (
            <div>
              <div className={styles.diffHeader}>
                <div>
                  <strong>Diff:</strong> {diffForSlot.toUpperCase()} vs snapshot @ {new Date((comparisonSnapshot ?? lastSnap).createdAt).toLocaleString()}
                </div>
                <div>
                  <select value={diffForSlot} onChange={e => setDiffForSlot(e.target.value as SlotKey)} style={{ marginRight: 8 }}>
                    {(["objective","methodology","findings","recommendations","dataRefs","limitations"] as SlotKey[]).map(k => (
                      <option key={k} value={k}>{SLOT_TITLES[k]}</option>
                    ))}
                  </select>
                  <button className={styles.iBtn} style={{marginRight:8}} onClick={() => setDiffTwoCol(false)} title="Single column"><I.Diff/> 1-col</button>
                  <button className={styles.toolBtn} onClick={() => setDiffOpen(false)}>Close</button>
                </div>
              </div>
              <div className={styles.diffTwoCol}>
                <div className={styles.diffPane}><pre>{
                  prevText.split(/\r?\n/).map((l)=> l).join("\n")
                }</pre></div>
                <div className={styles.diffPane}><pre>{
                  currText.split(/\r?\n/).map((l)=> l).join("\n")
                }</pre></div>
              </div>
            </div>
          ) : (
            <div className={styles.diffWrap} role="region" aria-label="Snapshot diff">
              <div className={styles.diffHeader}>
                <div>
                  <strong>Diff:</strong> {diffForSlot.toUpperCase()} vs snapshot @ {new Date((comparisonSnapshot ?? lastSnap).createdAt).toLocaleString()}
                </div>
                <div>
                  <select value={diffForSlot} onChange={e => setDiffForSlot(e.target.value as SlotKey)} style={{ marginRight: 8 }}>
                    {(["objective","methodology","findings","recommendations","dataRefs","limitations"] as SlotKey[]).map(k => (
                      <option key={k} value={k}>{SLOT_TITLES[k]}</option>
                    ))}
                  </select>
                  <button className={styles.iBtn} style={{marginRight:8}} onClick={() => setDiffTwoCol(true)} title="Side-by-side"><I.Diff/> 2-col</button>
                  <button className={styles.toolBtn} onClick={() => setDiffOpen(false)}>Close</button>
                </div>
              </div>
              <div className={styles.diffBody} aria-live="polite">
                {segs.map((s, idx) => (
                  <div key={idx} className={`${styles.diffLine} ${s.kind==="add"?styles.diffAdd: s.kind==="del"?styles.diffDel:styles.diffSame}`}>
                    {s.kind === "add" ? "+ " : s.kind === "del" ? "− " : "  "}{s.text || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          ))}
        <NoteFooterBar
          activeSlotLabel={`Active slot: ${SLOT_TITLES[active] ?? active}`}
          charCountLabel={`Chars: ${charCount}`}
          updatedLabel={`Updated: ${updated}`}
          projectSessionLabel={hasSelection ? `Project: ${project?.name ?? "—"}` : null}
          snapshotInfoLabel={hasSelection ? `Snapshots: ${snapCount}` : `Local mode`}
          canEdit={canEdit}
          onCopySlot={copy}
          onClearSlot={clear}
          onSnapshot={takeSnapshot}
          onOpenDiff={() => { if (hasSelection && lastSnap) { setDiffForSlot(active); setDiffOpen(o=>!o); } }}
          canOpenDiff={Boolean(hasSelection && lastSnap)}
          exportOpen={expOpen}
          onToggleExport={() => setExpOpen(v => !v)}
          exportGaps={exportGaps}
          onExportCopyMarkdown={doCopyMarkdown}
          onExportCopyHTML={doCopyHTML}
          onExportDownloadHTML={doDownloadHTML}
          onExportPrint={doPrint}
          medicoLegalText={
            <>
              {NOTE_GLOBAL_FOOTER}
            </>
          }
          tipText={<>
            Tip: Use <code>Ctrl/⌘+A</code> then <code>Ctrl/⌘+C</code> to copy the entire slot.
          </>}
          flashMessage={footerMsg}
        />
          </div>

          {}
        </div>

        {isCollaborativeProject && project?.id ? (
          <section className={styles.collaborationSection} aria-label="Note collaboration">
            <CollaborationSessionOverview
              scopeId={`note:${project.id}`}
              title="Shared Note Session"
              description="Track section focus, queued sync state, and open review threads while documenting analytical findings."
              participants={notePresence}
              emptyState="Open the same project note in another tab to validate live section focus and collaborative commentary."
            />
            <CollaborationCommentSidebar
              scopeId={`note:${project.id}`}
              title="Note Threads"
              subtitle="Resolve comments, reply inline, and keep anchored review context per note section."
              defaultAnchorLabel={SLOT_TITLES[active] ?? active}
            />
          </section>
        ) : null}
        </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Note;











export function NoteRail() {
	const slots = useNoteStore();
	const active = useNoteStore(s => (s as any).activeSlot as SlotKey);
	const setActive = (k: SlotKey) => useNoteStore.getState().setActiveSlot(k);
	const canEdit = useAccessStore(s => s.canEdit());

  const { state } = useProjectRegistry();
	const project: ProjectRecord | undefined = state.selectedProjectId
		? state.projects.find(p => p.id === state.selectedProjectId)
		: undefined;

	const hasSelection = Boolean(project);


  const [compact, setCompact] = React.useState<boolean>(() => {
    try { return localStorage.getItem(NOTE_COMPACT_KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try {
      if (compact) localStorage.setItem(NOTE_COMPACT_KEY, "1");
      else localStorage.removeItem(NOTE_COMPACT_KEY);
    } catch {}
  }, [compact]);


  const [openSlots, setOpenSlots] = React.useState(true);
  const [openTemplates, setOpenTemplates] = React.useState(true);
  const [openIndicators, setOpenIndicators] = React.useState(true);
  const [openCites, setOpenCites] = React.useState(true);
  const [openFlows, setOpenFlows] = React.useState(true);


  const railRootClass = compact ? `${styles.rail} ${styles.compact ?? "compact"}` : styles.rail;


  const completedFlows: FlowPreview[] = React.useMemo(
    () => collectCompletedFlows(state, project, project),
    [state, project]
  );

  function sendPatch(p: Partial<NoteSlots>) {
    window.dispatchEvent(new CustomEvent(NOTE_PATCH_EVENT, { detail: p }));
  }

  function applyPatchRail(p: Partial<NoteSlots>) {
    if (!canEdit) return;
    if (hasSelection) {
      sendPatch(p);
    } else {
      (Object.keys(p) as (keyof NoteSlots)[]).forEach(k => {
        const prev = String((slots as any)[k] ?? "");
        const add  = String((p as any)[k] ?? "");
        slots.setSlot(k, appendText(prev, add));
      });
    }
  }

  function _appendToActiveSlotRail(text: string) {
    if (!text || !canEdit) return;
    if (hasSelection) {
      sendPatch({ [active]: text } as Partial<NoteSlots>);
    } else {
      const prev = String((slots as any)[active] ?? "");
      slots.setSlot(active, appendText(prev, text));
    }
  }


  const [citeInput, setCiteInput] = React.useState<string>("");
  const [cites, setCites] = React.useState<string[]>([]);


  React.useEffect(() => {
    const onCite = (ev: Event) => {
      const e = ev as CustomEvent<string | string[]>;
      const d = e.detail;
      if (!d) return;
      setCites(prev => prev.concat(Array.isArray(d) ? d.filter(Boolean) as string[] : [String(d)].filter(Boolean)));
    };
    window.addEventListener(NOTE_CITE_EVENT, onCite as EventListener);
    return () => window.removeEventListener(NOTE_CITE_EVENT, onCite as EventListener);
  }, []);

  function insertCitationsToRefs() {
    if (!canEdit) return;
    const lines = [
      ...cites,
      ...citeInput.split("\n").map(s => s.trim()).filter(Boolean)
    ];
    if (!lines.length) return;
    const block = lines.map(s => `• ${s}`).join("\n");
    if (hasSelection) {
      sendPatch({ dataRefs: block });
    } else {
      const prev = String((slots as any).dataRefs ?? "");
      slots.setSlot("dataRefs" as any, appendText(prev, block));
    }
    setCites([]); setCiteInput("");
  }


	return (
    <div className={`${railRootClass} ${styles.flat ?? ""}`}>
      {}
      <div className={styles.railCard} role="group" aria-label="Display">
        <div className={styles.railTitleRow}>
          <div className={styles.railTitle}>Display</div>
          <button
            className={styles.railToggle}
            aria-expanded={compact}
            onClick={() => setCompact(v => !v)}
            title="Toggle compact density"
          >
            Compact
          </button>
        </div>
      </div>

      <div className={styles.railCard} role="group" aria-label="Slots">
        <div className={styles.railTitleRow}>
          <div className={styles.railTitle}>Report Sections</div>
          <button
            className={styles.railToggle}
            aria-expanded={openSlots}
            onClick={() => setOpenSlots(v => !v)}
            title={openSlots ? "Collapse" : "Expand"}
          >
            Hide
          </button>
        </div>
        <div className={styles.railBody} hidden={!openSlots}>
          <div className={styles.railGroup} role="tablist" aria-label="Report slots">
          {(["objective","methodology","findings","recommendations","dataRefs","limitations"] as SlotKey[]).map(k => (
            <button
              key={k}
              role="tab"
              aria-selected={active === k}
              aria-current={active === k ? true : undefined}
              className={`${styles.pill} ${active === k ? styles.pillActive : ""}`}
        onClick={() => setActive(k)}
        title={SLOT_TITLES[k]}
            >
              {SLOT_TITLES[k]}
            </button>
          ))}
          </div>
        </div>
			</div>

      <div className={styles.railCard} role="group" aria-label="Templates">
        <div className={styles.railTitleRow}>
          <div className={styles.railTitle}>Templates</div>
          <button
            className={styles.railToggle}
            aria-expanded={openTemplates ? "true" : "false"}
            onClick={() => setOpenTemplates(v => !v)}
            title={openTemplates ? "Collapse" : "Expand"}
          >
            Hide
          </button>
        </div>
        <div className={styles.railBody} hidden={!openTemplates}>
          <div className={styles.railGroup}>
          <button className={styles.btn} disabled={!canEdit} onClick={() => applyPatchRail({ objective: TPL_ANALYSIS_FRAMEWORK, methodology: TPL_METHODOLOGY })}>
						Insert Analysis Framework
					</button>
          <button className={styles.btn} disabled={!canEdit} onClick={() => applyPatchRail({ dataRefs: TPL_DATA_INVENTORY })}>
						Insert Data Inventory
					</button>
          <button className={styles.btn} disabled={!canEdit} onClick={() => applyPatchRail({ limitations: TPL_LIMITATIONS, dataRefs: TPL_LIMITATIONS_REF })}>
						Insert Limitations template
					</button>
          </div>
        </div>
			</div>

      <div className={styles.railCard} role="group" aria-label="Indicators">
        <div className={styles.railTitleRow}>
          <div className={styles.railTitle}>Indicators</div>
          <button
            className={styles.railToggle}
            aria-expanded={openIndicators ? "true" : "false"}
            onClick={() => setOpenIndicators(v => !v)}
            title={openIndicators ? "Collapse" : "Expand"}
          >
            Hide
          </button>
        </div>
        <div className={styles.railBody} hidden={!openIndicators}>
        <div className={styles.assessList}>
          <div className={styles.railHint}>
            Run an analytical workflow (Workflows tab) to generate indicators. Completed results such as composite indices, vulnerability scores, and equity metrics will appear here for quick reference and insertion into your report.
          </div>
        </div>
        </div>
				<div className={styles.railHint}>Inserts go to the active slot (default Objective).</div>
			</div>

      {/* Library Insert — context-aware cards from methods library */}
      <LibraryInsertCard
        activeSlot={active}
        canEdit={canEdit}
        onInsert={(text) => {
          _appendToActiveSlotRail(text);
          usePanelBridgeStore.getState().setActiveReportSlot(active);
        }}
      />

      {}
      <div className={styles.railCard} role="group" aria-label="Citations">
        <div className={styles.railTitleRow}>
          <div className={styles.railTitle}>Citations</div>
          <button
            className={styles.railToggle}
            aria-expanded={openCites ? "true" : "false"}
            onClick={() => setOpenCites(v => !v)}
            title={openCites ? "Collapse" : "Expand"}
          >
            Hide
          </button>
        </div>
        <div className={styles.railBody} hidden={!openCites}>
        <div className={styles.railGroupCol}>
          {cites.length > 0 && (
            <ul className={styles.citeList}>
              {cites.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
          <textarea
            className={styles.citeInput}
            value={citeInput}
            onChange={(e) => setCiteInput(e.target.value)}
            placeholder="Paste citation bullets or drop from Guide…"
            rows={3}
          />
          <div className={styles.citeActions}>
            <button
              className={styles.btnSm}
              disabled={!canEdit || (cites.length === 0 && citeInput.trim() === "")}
              onClick={insertCitationsToRefs}
            >
              Insert to Data References
            </button>
            <button className={styles.btnSm} onClick={() => { setCites([]); setCiteInput(""); }}>
              Clear
            </button>
          </div>
        </div>
        </div>
      </div>

      {}
      <div className={styles.railCard} role="group" aria-label="Flows">
        <div className={styles.railTitleRow}>
          <div className={styles.railTitle}>Workflows</div>
          <button
            className={styles.railToggle}
            aria-expanded={openFlows ? "true" : "false"}
            onClick={() => setOpenFlows(v => !v)}
            title={openFlows ? "Collapse" : "Expand"}
          >
            Hide
          </button>
        </div>

        <div className={styles.railBody} hidden={!openFlows}>
        {!hasSelection ? (
          <div className={styles.railHint}>Select a project from the Projects tab to view its completed workflows and insert findings into your report.</div>
        ) : completedFlows.length === 0 ? (
          <div className={styles.railHint}>No completed workflows yet. Go to the Workflows tab to run an analysis — completed results will appear here for insertion into your report sections.</div>
        ) : (
          <div className={styles.railGroupCol}>
            {completedFlows.map(f => (
              <div key={f.id} className={styles.flowRow}>
                <div className={styles.flowMeta}>
                  <div className={styles.flowTitle}>{f.name}</div>
                  <div className={styles.flowTime}>{formatWhen(f.completedAt)}</div>
                  <div className={styles.flowPreview}>{f.summary}</div>
                </div>
                <button
                  className={styles.btnSm}
                  disabled={!canEdit}
                  onClick={() => {
                    const line = `[${nowStamp()}] ${f.name}: ${f.summary}`;
                    if (hasSelection) {
                      sendPatch({ findings: line });
                    } else {
                      const prev = String((slots as any).findings ?? "");
                      slots.setSlot("findings" as any, appendText(prev, line));
                    }
                  }}
                >
                  Insert finding
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
		</div>
	);
}
