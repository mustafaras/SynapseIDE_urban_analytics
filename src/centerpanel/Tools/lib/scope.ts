


import type { Encounter, Filter, Patient, RegistryState } from "../../registry/types";
import { filterProjects } from "../../registry/state";

export type ScopeKind = "session" | "project" | "cohort" | "empty";

export interface ScopeResult {
  scopeKind: ScopeKind;
  scopeLabel: string;
  sessions?: Encounter[];
  projects?: Patient[];
}


export function getDefaultScopeKind(state: RegistryState): ScopeKind {
  const s = state as any;
  const hasSession =
    Boolean(s.selectedSessionId) ||
    (s.selectedProjectId &&
      Array.isArray(findProjectSessions(s, s.selectedProjectId)) &&
      findProjectSessions(s, s.selectedProjectId)!.length > 0);

  if (hasSession) return "session";
  if (s.selectedProjectId) return "project";

  const hasProjects = Array.isArray(s.projects) && s.projects.length > 0;
  return hasProjects ? "cohort" : "empty";
}


function findActiveProject(state: RegistryState): Patient | undefined {
  const s = state as any;
  if (!s.selectedProjectId) return undefined;
  return (s.projects || []).find((p: any) => p.id === s.selectedProjectId);
}


function findProjectSessions(state: RegistryState, projectId: string): Encounter[] {
  const s = state as any;
  const p = (s.projects || []).find((pt: any) => pt.id === projectId);
  const arr = ((p as any)?.sessions || (p as any)?.encounters || []).slice();
  arr.sort((a: any, b: any) => (b.when ?? 0) - (a.when ?? 0));
  return arr;
}


function describeCohort(state: RegistryState, totalCount: number, filteredCount: number): string {
  const s = state as any;
  const isAll = filteredCount === totalCount;
  if (isAll) return "Cohort: All";
  const f: Filter = s.filter || ({} as any);
  const bits: string[] = [];
  if (f.cohorts && f.cohorts.length && !(f.cohorts.length === 1 && f.cohorts[0] === "All")) bits.push(`Scope:${f.cohorts.join("+")}`);
  if (f.risk && f.risk.length) bits.push(`Risk:${f.risk.join(",")}`);
  if (f.tags && f.tags.length) bits.push(`Tags:${f.tags.join(",")}`);
  const q = (f as any).search;
  if (q && String(q).trim()) bits.push(`Search:“${String(q).trim()}”`);
  return bits.length ? `Cohort: ${bits.join(" • ")}` : "Cohort: Filters active";
}


export function resolveScope(state: RegistryState, scopeKind?: ScopeKind): ScopeResult {
  const s = state as any;
  const kind = scopeKind ?? getDefaultScopeKind(state);

  if (kind === "empty") {
    return { scopeKind: "empty", scopeLabel: "Empty", sessions: [], projects: [] };
  }

  if (kind === "session") {

    const projectId = s.selectedProjectId;
    if (!projectId) {
      return { scopeKind: "session", scopeLabel: "Session: none", sessions: [] };
    }
    const encs = findProjectSessions(state, projectId);
    let selected: Encounter[] = [];
    if (s.selectedSessionId) {
      const hit = encs.find((e: any) => e.id === s.selectedSessionId);
      if (hit) selected = [hit];
    }
    if (!selected.length && encs.length) selected = [encs[0]];
    const label = selected.length ? "Session: 1" : "Session: none";
    return { scopeKind: "session", scopeLabel: label, sessions: selected };
  }

  if (kind === "project") {
    const p = findActiveProject(state);
    const label = p ? "Project: 1" : "Project: none";
    return { scopeKind: "project", scopeLabel: label, projects: p ? [p] : [] };
  }


  const all = s.projects || [];
  const filtered = filterProjects(s) || [];
  const label = describeCohort(state, all.length, filtered.length);
  return { scopeKind: "cohort", scopeLabel: label, projects: filtered as unknown as Patient[] };
}


export interface ActiveContext {
  kind: ScopeKind;

  session?: Encounter;
  projectOfSession?: Patient;

  project?: Patient;

  cohort?: Patient[];

  label: string;
}


export function resolveActiveContext(state: RegistryState): ActiveContext {
  const s = state as any;
  const resolved = resolveScope(state);
  if (resolved.scopeKind === "session") {
    const e = (resolved.sessions || [])[0];

    const pId = s.selectedProjectId;
    const owner = pId ? (s.projects || []).find((p: any) => p.id === pId) : undefined;
    const out: ActiveContext = { kind: "session", label: resolved.scopeLabel } as ActiveContext;
    if (e) (out as any).session = e;
    if (owner) (out as any).projectOfSession = owner;
    return out;
  }
  if (resolved.scopeKind === "project") {
    const p = (resolved.projects || [])[0];
    const out: ActiveContext = { kind: "project", label: resolved.scopeLabel } as ActiveContext;
    if (p) (out as any).project = p;
    return out;
  }
  if (resolved.scopeKind === "cohort") {
    return { kind: "cohort", cohort: resolved.projects || [], label: resolved.scopeLabel };
  }
  return { kind: "empty", label: "Empty" };
}


export function getProjectId(p: Patient): string {
  return (p as any).id ?? "";
}


export function getSessionId(e: Encounter): string {
  return (e as any).id ?? "";
}


export function getProjectLastSessionISO(p: Patient): string {
  const encs: Encounter[] = ((p as any).sessions || (p as any).encounters || []).slice().sort((a: any, b: any) => (b.when ?? 0) - (a.when ?? 0));
  const latest = encs[0];
  if (!latest) return "";
  const ts = (latest as any).when;
  if (typeof ts === "number" && isFinite(ts)) return new Date(ts).toISOString();
  const iso = (latest as any).startISO || (latest as any).endISO;
  return typeof iso === "string" ? iso : "";
}


export function getProjectRiskGrade(p: Patient): number {
  const r = (p as any).risk;
  if (r == null) return 0;
  const n = Number(r);
  return Number.isFinite(n) ? n : 0;
}
