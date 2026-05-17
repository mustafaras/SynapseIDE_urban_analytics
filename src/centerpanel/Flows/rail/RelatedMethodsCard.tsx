/**
 * RelatedMethodsCard — Shows right-panel methodology cards relevant to the active flow.
 *
 * Appears in FlowsRail below the FlowLibraryCard. When a flow is active,
 * it filters the right-panel registry for cards matching that flow's domain tags
 * and renders clickable cards that open the right panel to that item.
 */

import React, { useMemo } from 'react';
import flowCss from '../../styles/flows.module.css';
import { usePanelBridgeStore } from '@/stores/usePanelBridgeStore';
import { useUrbanStore } from '@/features/urbanAnalytics/store';
import type { FlowId } from '../flowTypes';

interface CardLite {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  sectionId?: string;
  methodology?: string;
}

// Flow → card section mapping for relevance matching
const FLOW_SECTIONS: Record<string, string[]> = {
  site_suitability: ['spatial_stats', 'gis_methods', 'urban_indicators'],
  accessibility: ['transport_networks', 'spatial_stats', 'urban_indicators'],
  vulnerability: ['vulnerability', 'spatial_stats', 'rapid_assessment'],
  object_detection: ['remote_sensing', 'data_engineering', 'spatial_stats'],
  indicator_composite: ['urban_indicators', 'spatial_stats'],
  scenario_comparison: ['urban_indicators', 'spatial_stats'],
  equity_audit: ['urban_indicators', 'spatial_stats', 'vulnerability'],
  change_detection: ['remote_sensing', 'change_detection', 'data_engineering'],
  voxcity_3d: ['voxcity', 'simulation'],
  cityjson_loader: ['voxcity', 'data_engineering'],
  sunlight_sim: ['voxcity', 'simulation'],
  facility_optimisation: ['transport_networks', 'urban_indicators', 'vulnerability'],
  urban_growth_ca: ['simulation', 'change_detection', 'remote_sensing'],
  system_dynamics: ['simulation', 'urban_indicators', 'transport_networks'],
};

// Flow → keyword matching for card text
const FLOW_KEYWORDS: Record<string, string[]> = {
  site_suitability: ['suitability', 'overlay', 'criteria', 'weighting', 'ahp', 'mcda'],
  accessibility: ['accessibility', 'isochrone', 'network', 'travel time', 'walk', 'transit'],
  vulnerability: ['vulnerability', 'hazard', 'exposure', 'risk', 'sensitivity', 'adaptive'],
  object_detection: ['object detection', 'yolo', 'geoai', 'imagery', 'bounding box', 'solar panel', 'tree canopy'],
  indicator_composite: ['composite', 'indicator', 'index', 'normalization', 'aggregation'],
  scenario_comparison: ['scenario', 'comparison', 'baseline', 'alternative'],
  equity_audit: ['equity', 'distribution', 'gini', 'disaggregation', 'demographic'],
  change_detection: ['change detection', 'temporal', 'satellite', 'land use', 'ndvi', 'sentinel'],
  voxcity_3d: ['3d', 'building', 'extrusion', 'lod', 'height', 'geometry'],
  cityjson_loader: ['cityjson', 'semantic', 'roof', 'wall', '3d city'],
  sunlight_sim: ['sunlight', 'solar', 'shadow', 'sun position', 'exposure'],
  facility_optimisation: ['facility siting', 'location-allocation', 'p-median', 'lscp', 'mclp', 'catchment', 'service area'],
  urban_growth_ca: ['cellular automata', 'urban growth', 'sleuth', 'flus', 'sprawl', 'land use'],
  system_dynamics: ['system dynamics', 'stock and flow', 'causal loop', 'policy levers', 'feedback structure', 'urban growth'],
};

function getRelatedCards(
  flowId: FlowId | null,
  allCards: CardLite[],
  maxCards = 6,
): CardLite[] {
  if (!flowId || !allCards.length) return [];

  const sections = new Set(FLOW_SECTIONS[flowId] ?? []);
  const keywords = FLOW_KEYWORDS[flowId] ?? [];
  const contextTags = new Set(
    usePanelBridgeStore.getState().contextTags.map((t) => t.toLowerCase()),
  );

  type ScoredCard = CardLite & { _score: number };

  const scored: ScoredCard[] = allCards.map((c) => {
    let score = 0;
    // Section match
    if (c.sectionId && sections.has(c.sectionId)) score += 3;
    // Tag match
    const cTags = (c.tags ?? []).map((t) => t.toLowerCase());
    for (const t of cTags) {
      if (contextTags.has(t)) score += 2;
    }
    // Keyword match in title + summary
    const hay = `${c.title} ${c.summary} ${c.methodology ?? ''}`.toLowerCase();
    for (const kw of keywords) {
      if (hay.includes(kw)) score += 1;
    }
    return { ...c, _score: score };
  });

  return scored
    .filter((c) => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, maxCards);
}

const RelatedMethodsCard: React.FC<{
  activeFlowId: FlowId;
}> = ({ activeFlowId }) => {
  // Access the full card library via the store
  const visibleCardsFn = useUrbanStore((s) => s.visibleCards);

  const allCards: CardLite[] = useMemo(() => {
    try {
      const cards = visibleCardsFn?.() ?? [];
      return cards as CardLite[];
    } catch {
      return [];
    }
  }, [visibleCardsFn]);

  const related = useMemo(
    () => getRelatedCards(activeFlowId, allCards),
    [activeFlowId, allCards],
  );

  const selectCard = useUrbanStore((s) => s.selectCard);

  if (related.length === 0) return null;

  return (
    <section
      className={flowCss.railCard}
      aria-label="Related Methods"
      style={{ marginTop: 0 }}
    >
      <div className={flowCss.railCardHeader}>
        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'var(--syn-text-muted, rgba(255,255,255,0.55))',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          Related Methods
        </div>
        <div
          style={{
            fontSize: '0.68rem',
            color: 'rgba(255,255,255,0.45)',
            marginTop: 2,
          }}
        >
          Cards from the methods library matching this workflow
        </div>
      </div>

      <div className={flowCss.relatedMethodList}>
        {related.map((card) => (
          <button
            key={card.id}
            onClick={() => {
              try {
                selectCard(card.id);
                usePanelBridgeStore.getState().recordInsertedCard(card.id);
              } catch { /* noop */ }
            }}
            className={flowCss.relatedMethodButton}
            title={`View "${card.title}" in the right panel`}
          >
            <span className={flowCss.relatedMethodTitle}>
              {card.title}
            </span>
            <span className={flowCss.relatedMethodSummary}>
              {card.summary.length > 100
                ? `${card.summary.slice(0, 100)}...`
                : card.summary}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default RelatedMethodsCard;
