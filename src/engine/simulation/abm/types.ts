/**
 * Simulation ABM — agent snapshot contracts for map bridges.
 */

export interface AgentBasedModelResult {
  agents: GeoJSON.FeatureCollection;
  weightField?: string;
}
