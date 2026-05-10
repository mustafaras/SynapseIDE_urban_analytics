/**
 * Urban Analytics Workbench — Right Panel Registry
 *
 * Derived from the live seed library so the exported registry stays aligned
 * with the actual right-panel content instead of drifting into empty sections.
 */

import { SECTION_TREE } from './lib/sectionHierarchy';
import type { Card } from './lib/types';
import { buildFullLibrary } from './seeds';

export type RightPanelRegistry = Record<string, Record<string, Card[]>>;

function createEmptyRegistry(): RightPanelRegistry {
  return SECTION_TREE.reduce<RightPanelRegistry>((registry, group) => {
    registry[group.label] = {};
    for (const section of group.children ?? []) {
      registry[group.label]![section.label] = [];
    }
    return registry;
  }, {});
}

function buildRegistry(): RightPanelRegistry {
  const registry = createEmptyRegistry();
  const sectionLookup = new Map(
    SECTION_TREE.flatMap((group) =>
      (group.children ?? []).map((section) => [
        section.id,
        { groupLabel: group.label, sectionLabel: section.label },
      ] as const),
    ),
  );

  for (const card of buildFullLibrary()) {
    const target = sectionLookup.get(card.sectionId);
    if (!target) {
      continue;
    }
    registry[target.groupLabel]![target.sectionLabel]!.push(card);
  }

  for (const sections of Object.values(registry)) {
    for (const cards of Object.values(sections)) {
      cards.sort((left, right) => left.title.localeCompare(right.title));
    }
  }

  return registry;
}

export const RIGHT_PANEL_REGISTRY: RightPanelRegistry = buildRegistry();
