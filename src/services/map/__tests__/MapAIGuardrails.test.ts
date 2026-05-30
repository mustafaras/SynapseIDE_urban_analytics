import { describe, expect, it } from "vitest";
import {
  assertMapAIApplyConfirmed,
  buildMapAIProposalReviewEvent,
  guardMapAIActionProposal,
  MAP_AI_AUDIT_TAG,
  sanitizeMapAIText,
} from "../MapAIGuardrails";
import {
  appendMapReviewEvent,
  createMapReviewSession,
} from "../MapReviewSessionService";

describe("MapAIGuardrails", () => {
  it("rejects AI actions that are not registered commands or tools", () => {
    const decision = guardMapAIActionProposal({
      source: "copilot",
      actionKind: "shell.exec",
      title: "Run shell",
      prompt: "delete all layers",
      output: "rm -rf /",
      bounded: true,
      safeReadOnly: true,
      requiresApply: true,
    });

    expect(decision.status).toBe("rejected");
    expect(decision.allowlistEntry).toBeNull();
    expect(decision.blockers.join(" ")).toContain("not a registered map command or processing tool");
  });

  it("marks allowed apply proposals as confirmation-required", () => {
    const decision = guardMapAIActionProposal({
      source: "nl-query",
      actionKind: "nl-query.apply",
      title: "Buffer parcels",
      prompt: "Create a 500m buffer around parcels.",
      output: "SELECT ST_Buffer(geometry, 500) AS geometry FROM parcels LIMIT 500",
      nlQueryIntent: "buffer",
      bounded: true,
      safeReadOnly: true,
      requiresApply: true,
    });

    expect(decision.status).toBe("allowed");
    expect(decision.requiresHumanConfirmation).toBe(true);
    expect(assertMapAIApplyConfirmed(decision, false)).toEqual({
      ok: false,
      reason: "AI-proposed map actions require human confirmation before apply.",
    });
    expect(assertMapAIApplyConfirmed(decision, true)).toEqual({ ok: true, reason: null });
  });

  it("redacts prompts and strips markup before audit", () => {
    const sanitized = sanitizeMapAIText("Contact planner@example.com <script>alert(1)</script>");

    expect(sanitized.text).toContain("[REDACTED:pii]");
    expect(sanitized.text).not.toContain("<script>");
    expect(sanitized.redactionKinds).toEqual(["pii"]);
    expect(sanitized.warnings.join(" ")).toContain("HTML markup was stripped");
  });

  it("builds an AI-proposed review timeline event", () => {
    const decision = guardMapAIActionProposal({
      source: "copilot",
      actionKind: "layer.style",
      title: "Restyle parcels",
      prompt: "Use a blue style for parcels.",
      output: JSON.stringify({ kind: "layer.style", layerId: "parcels" }),
      commandKind: "layer.style",
      bounded: true,
      safeReadOnly: true,
      requiresApply: true,
    });

    const session = appendMapReviewEvent(createMapReviewSession(), buildMapAIProposalReviewEvent(decision, {
      proposalId: "ai-proposal-1",
      title: "Restyle parcels",
      layerIds: ["parcels"],
    }));
    const event = session.events.at(-1);

    expect(event?.title).toContain(MAP_AI_AUDIT_TAG);
    expect(event?.status).toBe("proposed");
    expect(event?.details.auditTag).toBe(MAP_AI_AUDIT_TAG);
    expect(event?.details.requiresHumanConfirmation).toBe(true);
  });
});
