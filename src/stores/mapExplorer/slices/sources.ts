import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Sources slice.
 * Persistence: source handle metadata only. Source bytes, local file handles,
 * worker payloads, and layer sourceData stay outside persisted Zustand state.
 */
export const sourcesSlicePolicy = defineMapExplorerSlicePolicy({
  id: "sources",
  label: "Source handles and restore metadata",
  persistence: "persisted",
  stateKeys: ["sourceHandles"],
  actionKeys: ["upsertSourceHandle", "removeSourceHandle", "replaceSourceHandles", "clearSourceHandles"],
  persistedKeys: ["sourceHandles"],
  transientKeys: [],
  heavyGeometryKeys: [],
  rationale: "SourceHandle records are lightweight references used to recover sources; raw sourceData remains owned by transient layer/runtime services.",
});