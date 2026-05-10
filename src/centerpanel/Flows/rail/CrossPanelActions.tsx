/**
 * CrossPanelActions — Flow-footer toolbar with cross-panel navigation.
 *
 * Shows contextual action buttons at the bottom of each flow:
 * - "View Methods": opens right panel Urban Analytics modal with context tags
 * - "Add to Report": inserts a summary of the current flow step into the report
 */

import { useCallback } from 'react';
import type { IndicatorCatalogGroupId } from '@/features/urbanAnalytics/indicators/types';
import type { SectionId } from '@/features/urbanAnalytics/lib/types';
import { useUrbanStore } from '@/features/urbanAnalytics/store';
import { enqueuePendingInsert } from '@/services/reporting/storage';
import type { PendingReportInsert } from '@/services/reporting/types';
import styles from '../../styles/flows.module.css';

interface CrossPanelActionsProps {
  flowId: string;
  stepLabel: string;
}

interface IndicatorCatalogLink {
  groupId: IndicatorCatalogGroupId;
  query: string;
  title: string;
}

/** Maps flow IDs to the most relevant sectionIds in the right-panel card registry. */
const FLOW_SECTION_HINTS: Record<string, string[]> = {
  site_suitability: ['gis_methods', 'indicators'],
  accessibility: ['accessibility', 'network_analysis'],
  vulnerability: ['climate_risk', 'indicators'],
  object_detection: ['remote_sensing', 'data_engineering'],
  indicator_composite: ['indicators', 'spatial_stats'],
  scenario_comparison: ['policy_analysis', 'indicators'],
  equity_audit: ['equity', 'accessibility'],
  change_detection: ['remote_sensing', 'land_use'],
  emerging_hot_spot: ['spatial_stats', 'monitoring_eval'],
  voxcity_3d: ['urban_morphology', '3d_modeling'],
  cityjson_loader: ['urban_morphology', '3d_modeling'],
  sunlight_sim: ['climate_risk', '3d_modeling'],
  facility_optimisation: ['accessibility', 'equity'],
  urban_growth_ca: ['simulation', 'change_detection'],
  system_dynamics: ['simulation', 'urban_indicators'],
};

const FLOW_INDICATOR_LINKS: Partial<Record<string, IndicatorCatalogLink>> = {
  accessibility: { groupId: 'transport_mobility', query: 'access', title: 'Accessibility and mobility indicators' },
  site_suitability: { groupId: 'transport_mobility', query: 'service access', title: 'Service access indicators' },
  vulnerability: { groupId: 'energy_climate', query: 'risk', title: 'Climate and resilience indicators' },
  object_detection: { groupId: 'energy_climate', query: 'land cover', title: 'Remote sensing indicators' },
  indicator_composite: { groupId: 'governance_innovation', query: 'composite', title: 'Composite and benchmarking indicators' },
  scenario_comparison: { groupId: 'governance_innovation', query: 'scenario', title: 'Scenario comparison indicators' },
  equity_audit: { groupId: 'social_liveability', query: 'equity', title: 'Equity and liveability indicators' },
  change_detection: { groupId: 'energy_climate', query: 'change', title: 'Change detection indicators' },
  voxcity_3d: { groupId: 'urban_form_landscape', query: 'morphology', title: 'Urban morphology indicators' },
  cityjson_loader: { groupId: 'urban_form_landscape', query: 'height', title: 'Urban morphology indicators' },
  sunlight_sim: { groupId: 'urban_form_landscape', query: 'sky view', title: 'Urban morphology indicators' },
  facility_optimisation: { groupId: 'transport_mobility', query: 'catchment', title: 'Catchment and accessibility indicators' },
  urban_growth_ca: { groupId: 'urban_form_landscape', query: 'density', title: 'Urban form indicators' },
  system_dynamics: { groupId: 'governance_innovation', query: 'systems', title: 'Policy and systems indicators' },
};

export default function CrossPanelActions({ flowId, stepLabel }: CrossPanelActionsProps) {
  const relatedIndicator = FLOW_INDICATOR_LINKS[flowId] ?? null;
  const relatedSection = (FLOW_SECTION_HINTS[flowId]?.[0] ?? null) as SectionId | null;

  const openInRightPanel = useCallback(() => {
    if (!relatedSection) {
      return;
    }

    const urbanStore = useUrbanStore.getState();
    urbanStore.navClearFilters();
    urbanStore.setSection(relatedSection);
    urbanStore.clearSelection();
    urbanStore.open();
  }, [relatedSection]);

  const openIndicatorCatalog = useCallback(() => {
    if (!relatedIndicator) {
      return;
    }
    window.dispatchEvent(new CustomEvent('synapse:navigate', {
      detail: {
        tab: 'Toolbox',
        indicatorGroupId: relatedIndicator.groupId,
        indicatorQuery: relatedIndicator.query,
        indicatorRequestedAt: Date.now(),
      },
    }));
  }, [relatedIndicator]);

  const insertToReport = useCallback(() => {
    const insert: PendingReportInsert = {
      id: `flow-step-${flowId}-${stepLabel}`.replace(/\s+/g, '-').toLowerCase(),
      insertedAt: new Date().toISOString(),
      source: flowId,
      suggestedTitle: stepLabel,
      citations: [],
      sections: [
        {
          id: `section-${flowId}-${stepLabel}`.replace(/\s+/g, '-').toLowerCase(),
          title: `${stepLabel} — Workflow Context`,
          kind: 'methodology',
          origin: 'generated',
          generated: true,
          badgeLabel: 'Workflow note',
          citationIds: [],
          blocks: [
            {
              kind: 'paragraph',
              text: `[${stepLabel}] Analysis step from ${flowId.replace(/_/g, ' ')} workflow.`,
            },
          ],
        },
      ],
    };
    enqueuePendingInsert(insert);
    window.dispatchEvent(new CustomEvent('reporting/pending-changed'));
    window.dispatchEvent(new CustomEvent('synapse:navigate', { detail: { tab: 'Report' } }));
  }, [flowId, stepLabel]);

    if (!relatedSection && !relatedIndicator) return null;

  return (
    <div className={styles.crossPanelBar}>
        {relatedSection ? (
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={openInRightPanel}
            title="Open related methods in the Urban Analytics library"
        >
            View Methods
        </button>
      ) : null}
      {relatedIndicator ? (
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={openIndicatorCatalog}
          title={`Open ${relatedIndicator.title} in the Toolbox indicator catalog`}
        >
          Indicator Catalog
        </button>
      ) : null}
      <button
        type="button"
        className={styles.outlineBtn}
        onClick={insertToReport}
        title="Insert current step context to report"
      >
        Add to Report
      </button>
    </div>
  );
}
