export type MapTelemetryEventKind =
  | "command.run"
  | "worker.failure"
  | "external-service.error"
  | "performance.budget"
  | "panel.error";

export type MapTelemetrySeverity = "info" | "warning" | "error";

export type MapTelemetrySource =
  | "map-command"
  | "worker-pool"
  | "external-service"
  | "performance-diagnostics"
  | "map-panel"
  | "error-bus";

export type MapTelemetryPrimitive = string | number | boolean | null;
export type MapTelemetryDetailValue =
  | MapTelemetryPrimitive
  | readonly MapTelemetryPrimitive[]
  | { readonly [key: string]: MapTelemetryDetailValue };

export type MapTelemetryDetails = Readonly<Record<string, MapTelemetryDetailValue>>;

export interface MapTelemetryEventInput {
  kind: MapTelemetryEventKind;
  severity: MapTelemetrySeverity;
  source: MapTelemetrySource;
  message: string;
  details?: MapTelemetryDetails;
  entityIds?: Readonly<Record<string, string>>;
  code?: string;
  recoverable?: boolean;
  recoveryLabel?: string;
  fingerprint?: string;
}

export interface MapTelemetryEvent {
  id: string;
  kind: MapTelemetryEventKind;
  severity: MapTelemetrySeverity;
  source: MapTelemetrySource;
  message: string;
  createdAt: string;
  details: MapTelemetryDetails;
  entityIds: Readonly<Record<string, string>>;
  code?: string;
  recoverable: boolean;
  recoveryLabel?: string;
  fingerprint: string;
}

export interface MapTelemetryRecordOptions {
  now?: () => string;
  idFactory?: () => string;
  dedupeKey?: string;
  dedupeMs?: number;
}

export interface MapTelemetrySummary {
  totalCount: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  recoverableCount: number;
  latestErrorAt?: string;
}

const MAX_TELEMETRY_EVENTS = 200;
const REDACTED = "[REDACTED]";
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const BEARER_PATTERN = /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{10,}/gi;
const INLINE_SECRET_PATTERN = /\b(api[_-]?key|access[_-]?token|token|password|secret|signature|sig|client[_-]?secret)=([^\s&]+)/gi;
const SECRET_FIELD_PATTERN = /^(api[_-]?key|access[_-]?token|token|password|secret|signature|sig|client[_-]?secret|authorization)$/i;
const LONG_TOKEN_PATTERN = /\b[A-Za-z0-9_]{40,}\b/g;

let telemetryEvents: MapTelemetryEvent[] = [];
let eventCounter = 0;
const listeners = new Set<() => void>();
const dedupeLedger = new Map<string, number>();

function createTelemetryId(): string {
  eventCounter += 1;
  return `mapobs-${Date.now().toString(36)}-${eventCounter.toString(36)}`;
}

function notifyTelemetryListeners(): void {
  listeners.forEach((listener) => listener());
}

function sanitizeUrlLikeString(value: string): string {
  return value.replace(/https?:\/\/[^\s)]+/gi, (match) => {
    try {
      const url = new URL(match);
      url.username = "";
      url.password = "";
      url.searchParams.forEach((_paramValue, key) => {
        if (SECRET_FIELD_PATTERN.test(key)) {
          url.searchParams.set(key, REDACTED);
        }
      });
      return url.toString();
    } catch {
      return match.replace(INLINE_SECRET_PATTERN, (_whole, key: string) => `${key}=${REDACTED}`);
    }
  });
}

export function redactMapTelemetryString(value: string): string {
  const normalized = sanitizeUrlLikeString(value);
  return normalized
    .replace(BEARER_PATTERN, `$1${REDACTED}`)
    .replace(INLINE_SECRET_PATTERN, (_whole, key: string) => `${key}=${REDACTED}`)
    .replace(LONG_TOKEN_PATTERN, REDACTED)
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(PHONE_PATTERN, REDACTED)
    .slice(0, 700);
}

function redactEntityIds(entityIds?: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  if (!entityIds) return {};
  return Object.fromEntries(
    Object.entries(entityIds).map(([key, value]) => [key, redactMapTelemetryString(value)]),
  );
}

export function redactMapTelemetryValue(value: MapTelemetryDetailValue, keyHint?: string): MapTelemetryDetailValue {
  if (keyHint && SECRET_FIELD_PATTERN.test(keyHint)) {
    return REDACTED;
  }
  if (typeof value === "string") {
    return redactMapTelemetryString(value);
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? redactMapTelemetryString(item) : item));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, redactMapTelemetryValue(nestedValue, key)]),
  );
}

export function redactMapTelemetryDetails(details?: MapTelemetryDetails): MapTelemetryDetails {
  if (!details) return {};
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, redactMapTelemetryValue(value, key)]),
  );
}

export function buildMapTelemetrySummary(events: readonly MapTelemetryEvent[]): MapTelemetrySummary {
  let infoCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let recoverableCount = 0;
  let latestErrorAt: string | undefined;

  events.forEach((event) => {
    if (event.severity === "info") infoCount += 1;
    if (event.severity === "warning") warningCount += 1;
    if (event.severity === "error") {
      errorCount += 1;
      latestErrorAt ??= event.createdAt;
    }
    if (event.recoverable) recoverableCount += 1;
  });

  return {
    totalCount: events.length,
    infoCount,
    warningCount,
    errorCount,
    recoverableCount,
    ...(latestErrorAt ? { latestErrorAt } : {}),
  };
}

export function getMapTelemetryEvents(): readonly MapTelemetryEvent[] {
  return telemetryEvents;
}

export function subscribeMapTelemetryEvents(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearMapTelemetryEvents(): void {
  telemetryEvents = [];
  dedupeLedger.clear();
  notifyTelemetryListeners();
}

export function recordMapTelemetryEvent(
  input: MapTelemetryEventInput,
  options: MapTelemetryRecordOptions = {},
): MapTelemetryEvent | null {
  const createdAt = options.now?.() ?? new Date().toISOString();
  const createdAtMs = Date.parse(createdAt);
  const rawFingerprint = input.fingerprint ?? `${input.kind}:${input.source}:${input.message}`;
  const fingerprint = redactMapTelemetryString(rawFingerprint);
  const dedupeKey = options.dedupeKey ?? input.fingerprint;
  const dedupeMs = options.dedupeMs ?? 0;

  if (dedupeKey && dedupeMs > 0) {
    const normalizedDedupeKey = redactMapTelemetryString(dedupeKey);
    const previousAt = dedupeLedger.get(normalizedDedupeKey);
    if (previousAt != null && createdAtMs - previousAt < dedupeMs) {
      return null;
    }
    dedupeLedger.set(normalizedDedupeKey, createdAtMs);
  }

  const event: MapTelemetryEvent = {
    id: options.idFactory?.() ?? createTelemetryId(),
    kind: input.kind,
    severity: input.severity,
    source: input.source,
    message: redactMapTelemetryString(input.message.trim() || input.kind),
    createdAt,
    details: redactMapTelemetryDetails(input.details),
    entityIds: redactEntityIds(input.entityIds),
    ...(input.code ? { code: redactMapTelemetryString(input.code) } : {}),
    recoverable: input.recoverable ?? false,
    ...(input.recoveryLabel ? { recoveryLabel: redactMapTelemetryString(input.recoveryLabel) } : {}),
    fingerprint,
  };

  telemetryEvents = [event, ...telemetryEvents].slice(0, MAX_TELEMETRY_EVENTS);
  notifyTelemetryListeners();
  return event;
}
