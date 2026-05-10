/**
 * Urban Analytics Workbench — Seed Card Library Builders
 *
 * Aggregates all 15 seed modules (~189 cards) and exports buildFullLibrary()
 * for use by UrbanAnalyticsModal.
 */

import type { Card } from '../lib/types';
import { applyUrbanMethodValidityPreset } from '../context/methodValidity';

export { buildProjectScopingCards } from './projectScoping';
import { buildProjectScopingCards } from './projectScoping';

export { buildUrbanIndicatorCards } from './urbanIndicators';
import { buildUrbanIndicatorCards } from './urbanIndicators';

export { buildAdditionalIndicatorCards } from './additionalIndicators';
import { buildAdditionalIndicatorCards } from './additionalIndicators';

export { buildVulnerabilityCards } from './vulnerability';
import { buildVulnerabilityCards } from './vulnerability';

export { buildTransportCards } from './transportNetworks';
import { buildTransportCards } from './transportNetworks';

export { buildRemoteSensingCards } from './remoteSensing';
import { buildRemoteSensingCards } from './remoteSensing';

export { buildSpatialStatsCards } from './spatialStats';
import { buildSpatialStatsCards } from './spatialStats';

export { buildGISMethodCards } from './gisMethods';
import { buildGISMethodCards } from './gisMethods';

export { buildDataEngineeringCards } from './dataEngineering';
import { buildDataEngineeringCards } from './dataEngineering';

export { buildInterventionCards } from './interventionDesign';
import { buildInterventionCards } from './interventionDesign';

export { buildVoxCityCards } from './voxcity';
import { buildVoxCityCards } from './voxcity';

export { buildTypologyCards } from './typologyClassification';
import { buildTypologyCards } from './typologyClassification';

export { buildPolicyImplementationCards } from './policyImplementation';
import { buildPolicyImplementationCards } from './policyImplementation';

export { buildMonitoringReportingCards } from './monitoringReporting';
import { buildMonitoringReportingCards } from './monitoringReporting';

export { buildThematicDeepDiveCards } from './thematicAnalysis';
import { buildThematicDeepDiveCards } from './thematicAnalysis';

export { buildSupplementaryCards } from './supplementary';
import { buildSupplementaryCards } from './supplementary';

/** Build the full merged library from all seed builders. */
export function buildFullLibrary(): Card[] {
  const existing = new Set<string>();
  const library: Card[] = [];

  const builders = [
    buildProjectScopingCards,
    buildUrbanIndicatorCards,
    buildAdditionalIndicatorCards,
    buildVulnerabilityCards,
    buildTransportCards,
    buildRemoteSensingCards,
    buildSpatialStatsCards,
    buildGISMethodCards,
    buildDataEngineeringCards,
    buildInterventionCards,
    buildVoxCityCards,
    buildTypologyCards,
    buildPolicyImplementationCards,
    buildMonitoringReportingCards,
    buildThematicDeepDiveCards,
    buildSupplementaryCards,
  ];

  for (const build of builders) {
    const cards = build(existing);
    for (const card of cards) {
      if (!existing.has(card.id)) {
        library.push(applyUrbanMethodValidityPreset(card, `card:${card.id}`));
        existing.add(card.id);
      }
    }
  }

  return library;
}
