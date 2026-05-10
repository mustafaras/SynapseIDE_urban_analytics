/**
 * Urban Analytics Workbench — Tag Groups
 *
 * Organises UrbanTag values into 12 thematic categories for use in
 * the left-rail tag filter pills and card classification.
 */

import type { UrbanTag } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TagGroup {
  label: string;
  tags: UrbanTag[];
}

// ---------------------------------------------------------------------------
// TAG_GROUPS — 12 categories
// ---------------------------------------------------------------------------

export const TAG_GROUPS: TagGroup[] = [
  {
    label: 'Mobility',
    tags: ['mobility', 'transit', 'pedestrian', 'cycling'],
  },
  {
    label: 'Land Use',
    tags: ['land_use', 'zoning', 'density', 'sprawl'],
  },
  {
    label: 'Green Infrastructure',
    tags: ['green_infra', 'uli', 'canopy', 'biodiversity'],
  },
  {
    label: 'Climate',
    tags: ['climate', 'heat_island', 'flood', 'air_quality'],
  },
  {
    label: 'Equity',
    tags: ['equity', 'gentrification', 'displacement', 'segregation'],
  },
  {
    label: 'Housing',
    tags: ['housing', 'affordability', 'vacancy'],
  },
  {
    label: 'Economic',
    tags: ['economic', 'employment', 'retail', 'innovation'],
  },
  {
    label: 'Health',
    tags: ['health', 'noise', 'safety', 'crime'],
  },
  {
    label: 'Infrastructure',
    tags: ['water', 'energy', 'waste', 'circular'],
  },
  {
    label: 'Heritage',
    tags: ['heritage', 'tourism', 'placemaking'],
  },
  {
    label: 'Governance',
    tags: ['governance', 'participation', 'sdg'],
  },
  {
    label: 'Methods',
    tags: [
      'network_analysis',
      'spatial_stats',
      'remote_sensing',
      'agent_based',
      'cellular_automata',
      'machine_learning',
      'voxcity',
      '3d_modeling',
      'point_cloud',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return every tag across all groups as a flat array (no duplicates). */
export function flatTags(): UrbanTag[] {
  return TAG_GROUPS.flatMap((g) => g.tags);
}
