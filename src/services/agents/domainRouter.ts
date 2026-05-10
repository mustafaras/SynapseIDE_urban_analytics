import { searchIndicatorDefinitions } from '@/features/urbanAnalytics/indicators/catalog';
import type {
  AnalyticalFlowId,
  UrbanIndicatorKind,
} from '@/features/urbanAnalytics/lib/types';

export interface AutonomyDispatchPlan {
  action: 'route-flow' | 'route-indicator' | 'manual-review';
  confidence: number;
  suggestedFlowId?: AnalyticalFlowId;
  suggestedIndicators: UrbanIndicatorKind[];
  rationale: string;
  guardrails: string[];
}

type FlowRule = {
  flowId: AnalyticalFlowId;
  keywords: readonly string[];
  rationale: string;
};

const FLOW_RULES: readonly FlowRule[] = [
  {
    flowId: 'site_suitability',
    keywords: ['site suitability', 'weighted overlay', 'candidate site', 'suitability'],
    rationale: 'The prompt is framed as a location-screening or weighted-overlay exercise.',
  },
  {
    flowId: 'accessibility',
    keywords: ['accessibility', 'isochrone', '15-minute', 'service area', 'reachability'],
    rationale: 'The prompt focuses on network reach, service coverage, or travel-time access.',
  },
  {
    flowId: 'vulnerability',
    keywords: ['vulnerability', 'risk', 'hazard', 'resilience', 'exposure'],
    rationale: 'The prompt emphasises exposure, sensitivity, or multi-hazard vulnerability.',
  },
  {
    flowId: 'object_detection',
    keywords: ['object detection', 'vehicle detection', 'tree detection', 'imagery screening', 'yolo'],
    rationale: 'The prompt asks for feature extraction from very-high-resolution imagery.',
  },
  {
    flowId: 'change_detection',
    keywords: ['change detection', 'land cover', 'before and after', 'temporal change'],
    rationale: 'The prompt is about raster comparison, monitoring, or land-cover change.',
  },
  {
    flowId: 'indicator_composite',
    keywords: ['composite indicator', 'index', 'weighted score', 'ranking'],
    rationale: 'The prompt centres on aggregation of indicators into a composite score.',
  },
  {
    flowId: 'scenario_comparison',
    keywords: ['scenario', 'compare scenarios', 'policy option', 'baseline vs'],
    rationale: 'The prompt asks for structured comparison across scenarios or interventions.',
  },
  {
    flowId: 'equity_audit',
    keywords: ['equity', 'distributional', 'justice', 'underserved', 'gap'],
    rationale: 'The prompt points to distributive or procedural equity diagnostics.',
  },
  {
    flowId: 'urban_growth_ca',
    keywords: ['cellular automata', 'urban growth', 'sprawl simulation', 'future growth'],
    rationale: 'The prompt is explicitly about land-use change simulation over time.',
  },
  {
    flowId: 'facility_optimisation',
    keywords: ['facility', 'location-allocation', 'coverage model', 'site allocation'],
    rationale: 'The prompt asks for optimal placement or service catchment allocation.',
  },
  {
    flowId: 'system_dynamics',
    keywords: ['system dynamics', 'stocks and flows', 'feedback loop', 'dynamic simulation'],
    rationale: 'The prompt describes stock-and-flow or feedback-based urban simulation.',
  },
] as const;

function normalizedIncludes(text: string, keyword: string): boolean {
  return text.includes(keyword);
}

export function buildAutonomyDispatchPlan(prompt: string): AutonomyDispatchPlan {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const indicatorHits = searchIndicatorDefinitions(prompt)
    .slice(0, 5)
    .map((definition) => definition.kind);

  const scoredFlows = FLOW_RULES.map((rule) => {
    const score = rule.keywords.reduce((sum, keyword) => (
      normalizedIncludes(normalizedPrompt, keyword.toLowerCase()) ? sum + 1 : sum
    ), 0);
    return { rule, score };
  }).sort((left, right) => right.score - left.score);

  const bestFlow = scoredFlows[0];
  if (bestFlow && bestFlow.score >= 2) {
    return {
      action: 'route-flow',
      confidence: Number(Math.min(0.95, 0.45 + bestFlow.score * 0.18).toFixed(2)),
      suggestedFlowId: bestFlow.rule.flowId,
      suggestedIndicators: indicatorHits,
      rationale: bestFlow.rule.rationale,
      guardrails: [
        'Only recommend flows already implemented in the workspace.',
        'Do not issue tool plans outside the existing allow-list.',
        'Escalate to manual review when prompt intent spans multiple analytical domains.',
      ],
    };
  }

  if (indicatorHits.length > 0) {
    return {
      action: 'route-indicator',
      confidence: 0.58,
      suggestedIndicators: indicatorHits,
      rationale: 'The prompt maps more clearly to indicator definitions than to a single analytical flow.',
      guardrails: [
        'Keep dispatch inside the indicator catalog and deterministic calculators.',
        'Avoid autonomous execution when required data layers are ambiguous.',
      ],
    };
  }

  return {
    action: 'manual-review',
    confidence: 0.3,
    suggestedIndicators: [],
    rationale: 'No high-confidence flow or indicator route was detected from the prompt alone.',
    guardrails: [
      'Require explicit human confirmation before any broad repository mutation.',
      'Prefer transparent manual review over speculative dispatch.',
    ],
  };
}

export function summarizeAutonomyDispatchPlan(plan: AutonomyDispatchPlan): string {
  const indicatorSummary = plan.suggestedIndicators.length
    ? `Suggested indicators: ${plan.suggestedIndicators.join(', ')}.`
    : 'Suggested indicators: none.';
  const flowSummary = plan.suggestedFlowId
    ? `Suggested flow: ${plan.suggestedFlowId}.`
    : 'Suggested flow: none.';

  return [
    `Controlled autonomy action: ${plan.action}.`,
    `Confidence: ${plan.confidence}.`,
    flowSummary,
    indicatorSummary,
    `Rationale: ${plan.rationale}`,
    `Guardrails: ${plan.guardrails.join(' ')}`,
  ].join(' ');
}
