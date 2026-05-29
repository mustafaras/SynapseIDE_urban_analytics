/* ================================================================== */
/*  temporalLayerHandoff — Prompt 46                                    */
/*                                                                      */
/*  Urban handoff helper: merge a `MapTemporalEvidenceMetadata` payload  */
/*  into a layer's `LayerMetadata.temporalEvidence` without mutating any  */
/*  unrelated metadata. Pure — the caller passes the existing metadata    */
/*  and persists the returned patch via `updateLayerMetadata`.            */
/* ================================================================== */

import type {
  LayerMetadata,
  MapTemporalEvidenceMetadata,
} from "@/centerpanel/components/map/mapTypes";

/**
 * Produce an updated `LayerMetadata` that carries the temporal evidence on
 * `temporalEvidence`. All other metadata fields are preserved verbatim.
 */
export function mergeTemporalEvidenceIntoMetadata(
  existing: LayerMetadata | undefined,
  evidence: MapTemporalEvidenceMetadata,
): LayerMetadata {
  return {
    ...(existing ?? {}),
    temporalEvidence: evidence,
  };
}
