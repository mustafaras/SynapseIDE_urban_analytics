import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Bridge slice.
 * Persistence: transient. Copilot/Urban bridge snapshots and proposals are
 * runtime coordination metadata and must not become stale persisted context.
 */
export const bridgeSlicePolicy = defineMapExplorerSlicePolicy({
  id: "bridge",
  label: "Copilot and cross-panel bridge metadata",
  persistence: "transient",
  stateKeys: [
    "lastContextSnapshotId",
    "lastCopilotContextSnapshot",
    "copilotActionProposals",
    "copilotAuditTrail",
    "pendingCopilotActionCount",
  ],
  actionKeys: [
    "emitCopilotContextSnapshot",
    "queueCopilotActionProposal",
    "previewCopilotActionProposal",
    "applyCopilotActionProposal",
    "rejectCopilotActionProposal",
  ],
  persistedKeys: [],
  transientKeys: [
    "lastContextSnapshotId",
    "lastCopilotContextSnapshot",
    "copilotActionProposals",
    "copilotAuditTrail",
    "pendingCopilotActionCount",
  ],
  heavyGeometryKeys: [],
  rationale: "Bridge payloads must be rebuilt from current map/Urban state so stale localStorage never masquerades as live context.",
});