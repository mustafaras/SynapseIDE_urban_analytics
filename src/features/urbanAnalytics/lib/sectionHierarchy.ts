/**
 * Urban Analytics Workbench — Section Hierarchy & Navigation Tree
 *
 * Defines the SECTION_TREE used by the left rail navigation,
 * a SECTION_INDEX Map for O(1) lookups, and a resolveSectionFilter
 * utility that expands group nodes into their child section IDs.
 */

import type { SectionId } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectionTreeNode {
  id: string;
  label: string;
  children?: SectionTreeNode[];
}

// ---------------------------------------------------------------------------
// Section Tree (8 groups)
// ---------------------------------------------------------------------------

export const SECTION_TREE: SectionTreeNode[] = [
  {
    id: 'group_scoping',
    label: 'Project Scoping & Data',
    children: [
      { id: 'project_scoping', label: 'Study Area Definition' },
      { id: 'data_engineering', label: 'Data Acquisition & ETL' },
      { id: 'baseline_assessment', label: 'Baseline Conditions' },
    ],
  },
  {
    id: 'group_spatial',
    label: 'Spatial Analysis & Metrics',
    children: [
      { id: 'urban_indicators', label: 'Urban Indicators & Indices' },
      { id: 'gis_methods', label: 'GIS & Spatial Operations' },
      { id: 'spatial_stats', label: 'Spatial Statistics' },
      { id: 'remote_sensing', label: 'Remote Sensing & EO' },
      { id: 'transport_networks', label: 'Network & Mobility Analysis' },
    ],
  },
  {
    id: 'group_vulnerability',
    label: 'Vulnerability & Risk',
    children: [
      { id: 'rapid_assessment', label: 'Rapid Urban Assessment' },
      { id: 'vulnerability', label: 'Multi-Hazard Vulnerability' },
    ],
  },
  {
    id: 'group_typology',
    label: 'Classification & Typology',
    children: [
      { id: 'typology', label: 'Urban Form Classification' },
    ],
  },
  {
    id: 'group_intervention',
    label: 'Intervention & Scenarios',
    children: [
      { id: 'intervention_design', label: 'Planning Interventions' },
      { id: 'policy_instruments', label: 'Policy & Regulatory Tools' },
      { id: 'implementation', label: 'Implementation Specs' },
    ],
  },
  {
    id: 'group_monitoring',
    label: 'Monitoring & Reporting',
    children: [
      { id: 'change_detection', label: 'Change Detection & Temporal' },
      { id: 'kpi_dashboard', label: 'KPI Dashboard & Benchmarking' },
      { id: 'monitoring_eval', label: 'M&E Frameworks' },
      { id: 'reports_briefs', label: 'Reports & Policy Briefs' },
    ],
  },
  {
    id: 'group_thematic',
    label: 'Thematic Deep-Dives',
    children: [
      { id: 'neighborhood_analysis', label: 'Neighborhood Scale' },
      { id: 'regional_analysis', label: 'Metropolitan & Regional' },
      { id: 'stakeholder_engagement', label: 'Participation & Engagement' },
    ],
  },
  {
    id: 'group_3d',
    label: '3D & Simulation',
    children: [
      { id: 'voxcity', label: 'VoxCity 3D Environment' },
      { id: 'simulation', label: 'ABM & Microsimulation' },
    ],
  },
];

// ---------------------------------------------------------------------------
// SECTION_INDEX — O(1) lookup by id (includes both groups and leaves)
// ---------------------------------------------------------------------------

function buildIndex(nodes: SectionTreeNode[]): Map<string, SectionTreeNode> {
  const map = new Map<string, SectionTreeNode>();
  for (const node of nodes) {
    map.set(node.id, node);
    if (node.children) {
      for (const child of node.children) {
        map.set(child.id, child);
      }
    }
  }
  return map;
}

export const SECTION_INDEX: Map<string, SectionTreeNode> = buildIndex(SECTION_TREE);

// ---------------------------------------------------------------------------
// resolveSectionFilter
// ---------------------------------------------------------------------------

/**
 * Given a section id, return an array of leaf SectionId values that match.
 *
 * - If the id is `'all'`, every leaf section is returned.
 * - If the id is a group node, all its children's ids are returned.
 * - If the id is a leaf node, a single-element array is returned.
 * - If the id is unknown, an empty array is returned.
 */
export function resolveSectionFilter(sectionId: string): SectionId[] {
  if (sectionId === 'all') {
    return SECTION_TREE.flatMap(
      (group) => (group.children ?? []).map((c) => c.id as SectionId),
    );
  }

  const node = SECTION_INDEX.get(sectionId);
  if (!node) return [];

  if (node.children && node.children.length > 0) {
    return node.children.map((c) => c.id as SectionId);
  }

  return [node.id as SectionId];
}
