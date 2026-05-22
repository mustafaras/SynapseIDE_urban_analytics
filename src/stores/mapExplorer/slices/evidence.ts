import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Evidence slice.
 * Persistence: transient. Evidence artifacts are immutable analytical records
 * managed by publication/evidence services, not local UI storage snapshots.
 */
export const evidenceSlicePolicy = defineMapExplorerSlicePolicy({
  id: "evidence",
  label: "Map evidence artifact registry",
  persistence: "transient",
  stateKeys: ["mapEvidenceArtifacts"],
  actionKeys: [
    "registerMapEvidenceArtifact",
    "upsertMapEvidenceArtifact",
    "updateMapEvidenceArtifact",
    "clearMapEvidenceArtifacts",
  ],
  persistedKeys: [],
  transientKeys: ["mapEvidenceArtifacts"],
  heavyGeometryKeys: ["mapEvidenceArtifacts"],
  rationale: "Evidence carries lineage/QA metadata and should be restored through evidence services, not persisted as mutable UI state.",
});