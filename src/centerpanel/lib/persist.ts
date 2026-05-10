import type { Patient } from "../registry/types";

export const PERSIST_KEY = "cp3.session";
export const PERSIST_VERSION = 3;
export const LEGACY_COMPAT_REMOVAL_VERSION = 5;

const LEGACY_FLOW_FIELDS = [
  "step",
  "eligibilityAt",
  "baselineAt",
  "doseAt",
  "reassessAt",
  "completedAt",
  "eligible",
  "contraindications",
  "baselineScore",
  "baselineNotes",
  "doseMg",
  "route",
  "responseMinutes",
  "postScore",
  "effect",
  "adverse",
  "outcomeText",
] as const;

export type PersistDeprecationNotice = {
  field: string;
  message: string;
  removeAfterVersion: number;
};

export type PersistMigrationReport = {
  fromVersion: number;
  toVersion: number;
  migrated: boolean;
  notes: string[];
  deprecatedFields: PersistDeprecationNotice[];
};

export type PersistBlob = {
  ver: number;
  name?: string;
  savedAt: number;
  note: any;
  calc: any;
  flow: any;
  access?: { mode?: string; role?: string };


  registry?: {
    projects: Patient[];
  };
  meta?: {
    migratedAt?: number;
    sourceVersion?: number;
    migrationNotes?: string[];
    deprecatedFields?: string[];
  };
};

export type PersistLoadResult = {
  blob: PersistBlob;
  report: PersistMigrationReport;
};

export function safeParse<T>(raw: string | null): T | null {
  try { return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}

function buildEmptyBlob(): PersistBlob {
  return {
    ver: PERSIST_VERSION,
    savedAt: 0,
    note: {},
    calc: {},
    flow: {},
    registry: { projects: [] },
  };
}

export function migratePersistBlob(incoming: any): PersistLoadResult {
  const base: any = { ...(incoming || {}) };
  const notes: string[] = [];
  const deprecatedFields: PersistDeprecationNotice[] = [];
  const sourceVersion = typeof base.ver === "number" ? base.ver : 0;

  if (!base || typeof base !== "object") {
    const blob = buildEmptyBlob();
    return {
      blob,
      report: {
        fromVersion: 0,
        toVersion: PERSIST_VERSION,
        migrated: false,
        notes,
        deprecatedFields,
      },
    };
  }

  if (!base.registry || !Array.isArray(base.registry.projects ?? base.registry.patients)) {
    base.registry = { projects: [] };
  }
  if (base.registry.patients && !base.registry.projects) {
    base.registry.projects = base.registry.patients;
    delete base.registry.patients;
    notes.push("Migrated legacy registry.patients to registry.projects.");
    deprecatedFields.push({
      field: "registry.patients",
      message: "Legacy patient registry alias is preserved only for migration reads.",
      removeAfterVersion: LEGACY_COMPAT_REMOVAL_VERSION,
    });
  }

  base.ver = PERSIST_VERSION;
  if (typeof base.savedAt !== "number") base.savedAt = 0;
  if (!base.note) base.note = {};
  if (!base.calc) base.calc = {};
  if (!base.flow) base.flow = {};
  if (LEGACY_FLOW_FIELDS.some((field) => field in (base.flow as Record<string, unknown>))) {
    notes.push("Legacy flow challenge fields remain readable for backward compatibility.");
    deprecatedFields.push({
      field: "flow.* legacy challenge fields",
      message: "SessionPersistence still reads deprecated challenge-era flow keys. Remove after two release cycles.",
      removeAfterVersion: LEGACY_COMPAT_REMOVAL_VERSION,
    });
  }

  const blob: PersistBlob = {
    ...(base as PersistBlob),
    meta: {
      ...(base.meta ?? {}),
      sourceVersion,
      migratedAt: Date.now(),
      migrationNotes: notes,
      deprecatedFields: deprecatedFields.map((notice) => notice.field),
    },
  };

  return {
    blob,
    report: {
      fromVersion: sourceVersion,
      toVersion: PERSIST_VERSION,
      migrated: sourceVersion !== PERSIST_VERSION || notes.length > 0,
      notes,
      deprecatedFields,
    },
  };
}

export function persistLoad(): PersistBlob {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return buildEmptyBlob();
    const parsed = JSON.parse(raw);
    return migratePersistBlob(parsed).blob;
  } catch {
    return buildEmptyBlob();
  }
}

export function loadPersist(): PersistBlob | null {
  return loadPersistWithReport()?.blob ?? null;
}

export function loadPersistWithReport(): PersistLoadResult | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migratePersistBlob(parsed);
  } catch {
    return null;
  }
}

export function persistSave(blob: PersistBlob) {
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(blob)); } catch {  }
}

export function savePersist(blob: PersistBlob) {
  return persistSave(blob);
}

export function createPersistBlob(
  input: Omit<PersistBlob, "ver" | "savedAt"> & { savedAt?: number },
): PersistBlob {
  return {
    ...input,
    ver: PERSIST_VERSION,
    savedAt: input.savedAt ?? Date.now(),
    meta: {
      ...(input.meta ?? {}),
      sourceVersion: PERSIST_VERSION,
    },
  };
}

export function clearPersist() {
  try { localStorage.removeItem(PERSIST_KEY); } catch {}
}


export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 750) {
  let id: any;
  return (...args: Parameters<T>) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}


export const fmtClock = (t?: number) =>
  (t ? new Date(t).toLocaleTimeString([], { hour12: false }) : "—");
