export const SYNAPSE_BUS_LIMITS = {
  maxPayloadBytes: 64 * 1024,
  maxIdeCodeInsertBytes: 32 * 1024,
} as const;

export type SynapseBusLimits = typeof SYNAPSE_BUS_LIMITS;