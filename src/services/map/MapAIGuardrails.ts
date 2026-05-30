import createDOMPurify from "dompurify";
import type { QueryIntent } from "@/engine/geoai/nlp/types";
import { redact, type GuardResult, type Redaction } from "@/services/ai/guardrails/redact";
import {
  MAP_REGISTERED_COMMAND_KINDS,
  type RoutedCommandKind,
} from "@/services/map/actions/MapActionExecutor";
import { listProcessingToolDescriptors } from "@/services/map/processing";
import type {
  MapReviewContextSnapshot,
  MapReviewTimelineEventInput,
  MapReviewTimelineEventStatus,
} from "./MapReviewSessionService";

export const MAP_AI_GUARDRAILS_VERSION = "map-ai-guardrails/v1";
export const MAP_AI_AUDIT_TAG = "AI-proposed";

export const MAP_AI_NL_QUERY_ACTION_KINDS = [
  "nl-query.preview",
  "nl-query.apply",
] as const;

export type MapAINLQueryActionKind = typeof MAP_AI_NL_QUERY_ACTION_KINDS[number];
export type MapAIActionSource = "nl-query" | "copilot";
export type MapAIGuardrailStatus = "allowed" | "rejected";
export type MapAIConfirmationState = "required" | "confirmed" | "not-required";

export const MAP_AI_ALLOWED_NL_QUERY_INTENTS = [
  "proximity",
  "accessibility",
  "aggregation",
  "filter",
  "hotspot",
  "ranking",
  "spatial_join",
  "buffer",
  "containment",
] as const satisfies readonly QueryIntent[];

export interface MapAIActionAllowlist {
  commandKinds: readonly RoutedCommandKind[];
  processingToolIds: readonly string[];
  nlQueryActionKinds: readonly MapAINLQueryActionKind[];
  nlQueryIntents: readonly QueryIntent[];
}

export interface MapAITextSanitization {
  text: string;
  redactionCount: number;
  redactionKinds: Redaction["kind"][];
  warnings: string[];
  sanitizedMarkup: boolean;
}

export interface MapAIGuardrailDecision {
  version: typeof MAP_AI_GUARDRAILS_VERSION;
  source: MapAIActionSource;
  status: MapAIGuardrailStatus;
  auditTag: typeof MAP_AI_AUDIT_TAG;
  actionKind: string;
  allowlistEntry: string | null;
  commandKind: RoutedCommandKind | null;
  toolId: string | null;
  nlQueryIntent: QueryIntent | null;
  bounded: boolean;
  safeReadOnly: boolean;
  requiresHumanConfirmation: boolean;
  confirmationState: MapAIConfirmationState;
  prompt: MapAITextSanitization;
  output: MapAITextSanitization;
  warnings: string[];
  blockers: string[];
}

export interface GuardMapAIActionProposalInput {
  source: MapAIActionSource;
  actionKind: string;
  title: string;
  prompt?: string;
  output?: string;
  commandKind?: string | null;
  toolId?: string | null;
  nlQueryIntent?: QueryIntent | null;
  bounded?: boolean;
  safeReadOnly?: boolean;
  requiresApply?: boolean;
  confirmed?: boolean;
}

export interface MapAIProposalReviewEventInput {
  proposalId: string;
  title: string;
  layerIds?: readonly string[];
  sourceIds?: readonly string[];
  runIds?: readonly string[];
  evidenceArtifactIds?: readonly string[];
  actionIds?: readonly string[];
  timestamp?: string;
  snapshot?: MapReviewContextSnapshot;
  details?: Record<string, unknown>;
}

export interface MapAIApplyConfirmationResult {
  ok: boolean;
  reason: string | null;
}

interface MinimalDOMPurify {
  sanitize: (dirty: string, config?: { ALLOWED_TAGS?: string[]; ALLOWED_ATTR?: string[] }) => string;
}

type DOMPurifyFactory = ((window: Window) => MinimalDOMPurify) & Partial<MinimalDOMPurify>;

let cachedBrowserPurifier: MinimalDOMPurify | null = null;

function getDomPurifier(): MinimalDOMPurify | null {
  const candidate = createDOMPurify as unknown as DOMPurifyFactory;
  if (typeof candidate.sanitize === "function") {
    return candidate as MinimalDOMPurify;
  }
  if (typeof window === "undefined" || !window.document) {
    return null;
  }
  cachedBrowserPurifier ??= candidate(window);
  return cachedBrowserPurifier;
}

function stripMarkupFallback(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "");
}

function sanitizeMarkup(value: string): { text: string; sanitizedMarkup: boolean } {
  const purifier = getDomPurifier();
  const sanitized = purifier
    ? purifier.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    : stripMarkupFallback(value);
  return {
    text: sanitized,
    sanitizedMarkup: sanitized !== value,
  };
}

function normalizeWarnings(...groups: readonly string[][]): string[] {
  return Array.from(
    new Set(groups.flat().map((entry) => entry.trim()).filter(Boolean)),
  );
}

function normalizeControlWhitespace(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? " " : char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function redactAndSanitize(value: string | undefined): MapAITextSanitization {
  const guard: GuardResult = redact(value ?? "");
  const markup = sanitizeMarkup(guard.text);
  const warnings = markup.sanitizedMarkup
    ? normalizeWarnings(guard.warnings, ["HTML markup was stripped from the AI prompt/output."])
    : normalizeWarnings(guard.warnings);
  return {
    text: normalizeControlWhitespace(markup.text),
    redactionCount: guard.redactions.length,
    redactionKinds: Array.from(new Set(guard.redactions.map((entry) => entry.kind))),
    warnings,
    sanitizedMarkup: markup.sanitizedMarkup,
  };
}

function isRoutedCommandKind(value: string | null | undefined): value is RoutedCommandKind {
  return MAP_REGISTERED_COMMAND_KINDS.includes(value as RoutedCommandKind);
}

function isNLQueryActionKind(value: string): value is MapAINLQueryActionKind {
  return MAP_AI_NL_QUERY_ACTION_KINDS.includes(value as MapAINLQueryActionKind);
}

function inferAllowlistEntry(input: GuardMapAIActionProposalInput, allowlist: MapAIActionAllowlist): {
  allowlistEntry: string | null;
  commandKind: RoutedCommandKind | null;
  toolId: string | null;
  blockers: string[];
} {
  const blockers: string[] = [];
  const requestedCommand = input.commandKind ?? input.actionKind;
  if (isRoutedCommandKind(requestedCommand) && allowlist.commandKinds.includes(requestedCommand)) {
    return {
      allowlistEntry: `command:${requestedCommand}`,
      commandKind: requestedCommand,
      toolId: null,
      blockers,
    };
  }

  const requestedTool = input.toolId?.trim() || (input.actionKind.startsWith("processing.") ? input.actionKind.replace(/^processing\./, "") : "");
  if (requestedTool && allowlist.processingToolIds.includes(requestedTool)) {
    return {
      allowlistEntry: `tool:${requestedTool}`,
      commandKind: null,
      toolId: requestedTool,
      blockers,
    };
  }

  if (input.source === "nl-query") {
    if (!isNLQueryActionKind(input.actionKind) || !allowlist.nlQueryActionKinds.includes(input.actionKind)) {
      blockers.push(`AI map query action "${input.actionKind}" is not allowlisted.`);
    }
    const intent = input.nlQueryIntent;
    if (!intent || !allowlist.nlQueryIntents.includes(intent)) {
      blockers.push(intent === "unknown" ? "Unknown NL query intent is not allowlisted." : "NL query intent is not allowlisted.");
    }
    return {
      allowlistEntry: blockers.length === 0 ? `nl-query:${input.nlQueryIntent}` : null,
      commandKind: null,
      toolId: null,
      blockers,
    };
  }

  blockers.push(`AI action "${input.actionKind}" is not a registered map command or processing tool.`);
  return {
    allowlistEntry: null,
    commandKind: null,
    toolId: null,
    blockers,
  };
}

export function createDefaultMapAIActionAllowlist(): MapAIActionAllowlist {
  return {
    commandKinds: MAP_REGISTERED_COMMAND_KINDS,
    processingToolIds: listProcessingToolDescriptors()
      .filter((descriptor) => descriptor.implemented)
      .map((descriptor) => descriptor.toolId),
    nlQueryActionKinds: MAP_AI_NL_QUERY_ACTION_KINDS,
    nlQueryIntents: MAP_AI_ALLOWED_NL_QUERY_INTENTS,
  };
}

export function sanitizeMapAIText(value: string | undefined): MapAITextSanitization {
  return redactAndSanitize(value);
}

export function guardMapAIActionProposal(
  input: GuardMapAIActionProposalInput,
  allowlist: MapAIActionAllowlist = createDefaultMapAIActionAllowlist(),
): MapAIGuardrailDecision {
  const prompt = redactAndSanitize(input.prompt);
  const output = redactAndSanitize(input.output);
  const bounded = input.bounded ?? false;
  const safeReadOnly = input.safeReadOnly ?? false;
  const allowlistResult = inferAllowlistEntry(input, allowlist);
  const blockers = [...allowlistResult.blockers];

  if (!bounded) {
    blockers.push("AI-proposed map actions must declare a finite bounded scope.");
  }
  if (input.source === "nl-query" && !safeReadOnly) {
    blockers.push("NL query output must be safe read-only SQL before execution.");
  }

  const requiresHumanConfirmation = input.requiresApply ?? true;
  const confirmationState: MapAIConfirmationState = requiresHumanConfirmation
    ? input.confirmed
      ? "confirmed"
      : "required"
    : "not-required";
  const warnings = normalizeWarnings(prompt.warnings, output.warnings);

  return {
    version: MAP_AI_GUARDRAILS_VERSION,
    source: input.source,
    status: blockers.length === 0 ? "allowed" : "rejected",
    auditTag: MAP_AI_AUDIT_TAG,
    actionKind: input.actionKind,
    allowlistEntry: allowlistResult.allowlistEntry,
    commandKind: allowlistResult.commandKind,
    toolId: allowlistResult.toolId,
    nlQueryIntent: input.nlQueryIntent ?? null,
    bounded,
    safeReadOnly,
    requiresHumanConfirmation,
    confirmationState,
    prompt,
    output,
    warnings,
    blockers: normalizeWarnings(blockers),
  };
}

export function assertMapAIApplyConfirmed(
  decision: Pick<MapAIGuardrailDecision, "status" | "blockers" | "requiresHumanConfirmation">,
  confirmed: boolean,
): MapAIApplyConfirmationResult {
  if (decision.status !== "allowed") {
    return {
      ok: false,
      reason: decision.blockers[0] ?? "AI-proposed action is not allowed.",
    };
  }
  if (decision.requiresHumanConfirmation && !confirmed) {
    return {
      ok: false,
      reason: "AI-proposed map actions require human confirmation before apply.",
    };
  }
  return { ok: true, reason: null };
}

export function mapAIGuardrailDetails(decision: MapAIGuardrailDecision): Record<string, unknown> {
  return {
    version: decision.version,
    auditTag: decision.auditTag,
    source: decision.source,
    status: decision.status,
    actionKind: decision.actionKind,
    allowlistEntry: decision.allowlistEntry,
    commandKind: decision.commandKind,
    toolId: decision.toolId,
    nlQueryIntent: decision.nlQueryIntent,
    bounded: decision.bounded,
    safeReadOnly: decision.safeReadOnly,
    requiresHumanConfirmation: decision.requiresHumanConfirmation,
    confirmationState: decision.confirmationState,
    redactionCount: decision.prompt.redactionCount + decision.output.redactionCount,
    redactionKinds: Array.from(new Set([...decision.prompt.redactionKinds, ...decision.output.redactionKinds])),
    sanitizedMarkup: decision.prompt.sanitizedMarkup || decision.output.sanitizedMarkup,
    warnings: decision.warnings,
    blockers: decision.blockers,
  };
}

export function buildMapAIProposalReviewEvent(
  decision: MapAIGuardrailDecision,
  input: MapAIProposalReviewEventInput,
): MapReviewTimelineEventInput {
  const status: MapReviewTimelineEventStatus = decision.status === "allowed" ? "proposed" : "rejected";
  return {
    type: "action-status",
    category: "action-audit",
    status,
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: `${MAP_AI_AUDIT_TAG} action: ${input.title}`,
    summary: decision.status === "allowed"
      ? `AI-proposed action passed the allowlist and requires confirmation before apply.`
      : `AI-proposed action was rejected by guardrails: ${decision.blockers.join(" ")}`,
    layerIds: [...(input.layerIds ?? [])],
    sourceIds: [...(input.sourceIds ?? [])],
    runIds: [...(input.runIds ?? [])],
    evidenceArtifactIds: [...(input.evidenceArtifactIds ?? [])],
    actionIds: Array.from(new Set([input.proposalId, ...(input.actionIds ?? [])])),
    ...(input.snapshot ? { snapshot: input.snapshot } : {}),
    details: {
      ...mapAIGuardrailDetails(decision),
      proposalId: input.proposalId,
      title: input.title,
      ...(input.details ?? {}),
    },
  };
}
