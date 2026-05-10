import { safeGet, safeSet } from '@/utils/storage';

import type { UrbanIndicatorKind } from '../lib/types';
import type { ComputedIndicatorRecord } from './types';

export const COMPUTED_INDICATOR_STORAGE_KEY = 'synapse.urban-analytics.additional-indicators.v1';
export const COMPUTED_INDICATOR_STORAGE_EVENT = 'urban-analytics/indicator-records-changed';

function compareComputedAtDesc(left: ComputedIndicatorRecord, right: ComputedIndicatorRecord): number {
  return new Date(right.computedAt).getTime() - new Date(left.computedAt).getTime();
}

function isComputedIndicatorRecord(value: unknown): value is ComputedIndicatorRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ComputedIndicatorRecord>;
  return typeof candidate.kind === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.groupId === 'string'
    && typeof candidate.computedAt === 'string'
    && typeof candidate.inputs === 'object'
    && candidate.inputs !== null
    && typeof candidate.result === 'object'
    && candidate.result !== null;
}

function emitComputedIndicatorStorageEvent(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(COMPUTED_INDICATOR_STORAGE_EVENT));
}

export function loadComputedIndicatorRecords(): ComputedIndicatorRecord[] {
  const result = safeGet<ComputedIndicatorRecord[]>(COMPUTED_INDICATOR_STORAGE_KEY);
  if (!result.ok || !Array.isArray(result.value)) {
    return [];
  }

  return result.value.filter(isComputedIndicatorRecord).sort(compareComputedAtDesc);
}

export function persistComputedIndicatorRecords(records: ComputedIndicatorRecord[]): boolean {
  const ok = safeSet(COMPUTED_INDICATOR_STORAGE_KEY, records).ok;
  if (ok) {
    emitComputedIndicatorStorageEvent();
  }
  return ok;
}

export function upsertComputedIndicatorRecord(record: ComputedIndicatorRecord): ComputedIndicatorRecord[] {
  const existing = loadComputedIndicatorRecords();
  const next = [
    record,
    ...existing.filter(
      (candidate) => !(candidate.kind === record.kind && candidate.computedAt === record.computedAt),
    ),
  ].sort(compareComputedAtDesc);

  persistComputedIndicatorRecords(next);
  return next;
}

export function listLatestComputedIndicatorRecords(): ComputedIndicatorRecord[] {
  const latestByKind = new Map<UrbanIndicatorKind, ComputedIndicatorRecord>();

  for (const record of loadComputedIndicatorRecords()) {
    if (!latestByKind.has(record.kind)) {
      latestByKind.set(record.kind, record);
    }
  }

  return Array.from(latestByKind.values()).sort(compareComputedAtDesc);
}

export function getLatestComputedIndicatorRecord(kind: UrbanIndicatorKind): ComputedIndicatorRecord | null {
  return loadComputedIndicatorRecords().find((record) => record.kind === kind) ?? null;
}