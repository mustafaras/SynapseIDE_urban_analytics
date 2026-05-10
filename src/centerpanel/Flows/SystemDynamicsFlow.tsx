import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CompletedAnalysisRun } from '@/features/urbanAnalytics/lib/types';
import {
  DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS,
  DEFAULT_SYSTEM_DYNAMICS_STOCKS,
  simulateSystemDynamics,
  SYSTEM_DYNAMICS_POLICY_LEVERS,
  SYSTEM_DYNAMICS_SCENARIO_PRESETS,
  type SystemDynamicsCausalLoopGraph,
  type SystemDynamicsDiagramLink,
  type SystemDynamicsPolicyLevers,
  type SystemDynamicsResult,
  type SystemDynamicsStockFlowDiagram,
  type SystemDynamicsStockId,
  type SystemDynamicsStocks,
} from '@/engine/simulation';
import { useFlowStore } from '@/stores/useFlowStore';
import { downloadJSON, exportFlowJSON, restoreFormState } from './flowUtils';
import StepPills from './StepPills';
import { FLOW_DEFINITIONS } from './flowTypes';
import styles from '../styles/flows.module.css';
import CrossPanelActions from './rail/CrossPanelActions';
import { MethodologyInfoButton } from '@/features/education/MethodologyInfoButton';

const FLOW_DEF = FLOW_DEFINITIONS.find((definition) => definition.id === 'system_dynamics')!;
const STEPS = FLOW_DEF.steps;
const FORM_KEY = 'system_dynamics_form';
const RESULT_KEY = 'system_dynamics_result';

type DiagramView = 'stock_flow' | 'causal_loop';

interface SystemDynamicsFlowForm {
  scenarioName: string;
  years: number;
  policyLevers: SystemDynamicsPolicyLevers;
  activeDiagram: DiagramView;
}

const DEFAULT_FORM: SystemDynamicsFlowForm = {
  scenarioName: 'Balanced Urban Transition',
  years: 25,
  policyLevers: { ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS },
  activeDiagram: 'stock_flow',
};

const stockCardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
};

const diagramToggleRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const STOCK_META: Array<{
  id: SystemDynamicsStockId;
  label: string;
  unit: string;
  color: string;
  valueFormatter: (value: number) => string;
}> = [
  { id: 'population', label: 'Population', unit: 'residents', color: '#F59E0B', valueFormatter: formatInteger },
  { id: 'housing', label: 'Housing', unit: 'dwellings', color: '#38BDF8', valueFormatter: formatInteger },
  { id: 'employment', label: 'Employment', unit: 'jobs', color: '#22C55E', valueFormatter: formatInteger },
  { id: 'transport_capacity', label: 'Transport Capacity', unit: 'capacity units', color: '#F97316', valueFormatter: formatInteger },
  { id: 'green_space', label: 'Green Space', unit: 'hectares', color: '#84CC16', valueFormatter: formatDecimal },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'system-dynamics';
}

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatDecimal(value: number): string {
  return value.toFixed(1);
}

function formatPercentFromRatio(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedPercent(changeRatio: number): string {
  const value = changeRatio * 100;
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getStockValue(stocks: SystemDynamicsStocks, stockId: SystemDynamicsStockId): number {
  switch (stockId) {
    case 'population':
      return stocks.population;
    case 'housing':
      return stocks.housing;
    case 'employment':
      return stocks.employment;
    case 'transport_capacity':
      return stocks.transportCapacity;
    case 'green_space':
      return stocks.greenSpace;
    default:
      return 0;
  }
}

function describeStability(result: SystemDynamicsResult): string {
  return result.stability.isStable
    ? `Stable. Max annual stock change ${(result.stability.maxAnnualChangeRatio * 100).toFixed(1)}%.`
    : `Caution. ${result.stability.warnings.join(' ')}`;
}

function buildTraceCsv(result: SystemDynamicsResult): string {
  const header = [
    'year',
    'population',
    'housing',
    'employment',
    'transport_capacity',
    'green_space',
    'housing_adequacy',
    'employment_adequacy',
    'transport_adequacy',
    'green_space_per_capita',
    'quality_of_life',
    'population_growth',
    'population_decline',
    'housing_construction',
    'housing_demolition',
    'employment_growth',
    'employment_decline',
    'network_expansion',
    'network_wear',
    'green_expansion',
    'land_conversion',
  ];

  const rows = result.traces.map((trace) => [
    trace.year,
    trace.stocks.population.toFixed(2),
    trace.stocks.housing.toFixed(2),
    trace.stocks.employment.toFixed(2),
    trace.stocks.transportCapacity.toFixed(2),
    trace.stocks.greenSpace.toFixed(2),
    trace.indicators.housingAdequacy.toFixed(4),
    trace.indicators.employmentAdequacy.toFixed(4),
    trace.indicators.transportAdequacy.toFixed(4),
    trace.indicators.greenSpacePerCapita.toFixed(4),
    trace.indicators.qualityOfLife.toFixed(4),
    trace.flows.populationGrowth.toFixed(4),
    trace.flows.populationDecline.toFixed(4),
    trace.flows.housingConstruction.toFixed(4),
    trace.flows.housingDemolition.toFixed(4),
    trace.flows.employmentGrowth.toFixed(4),
    trace.flows.employmentDecline.toFixed(4),
    trace.flows.networkExpansion.toFixed(4),
    trace.flows.networkWear.toFixed(4),
    trace.flows.greenExpansion.toFixed(4),
    trace.flows.landConversion.toFixed(4),
  ]);

  return `${header.join(',')}\n${rows.map((row) => row.join(',')).join('\n')}\n`;
}

function downloadTextFile(filename: string, content: string, type = 'application/json'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadSvg(svg: SVGSVGElement | null, filename: string): void {
  if (!svg) {
    return;
  }
  downloadTextFile(filename, svg.outerHTML, 'image/svg+xml;charset=utf-8');
}

function buildCompletedRun(form: SystemDynamicsFlowForm, result: SystemDynamicsResult): CompletedAnalysisRun {
  const runId = `system-dynamics-${Date.now()}`;
  const paragraphLines = [result.summary.headline, ...result.summary.keyTensions];

  return {
    runId,
    flowId: 'system_dynamics',
    label: form.scenarioName.trim() || 'System Dynamics Scenario',
    insertedAt: new Date().toISOString(),
    paragraph: paragraphLines.join('\n'),
    paragraphPreview: paragraphLines.slice(0, 2).join('\n'),
    paragraphFull: paragraphLines.join('\n\n'),
    mapOutputs: [],
    chartOutputs: STOCK_META.map((entry) => ({
      id: `${runId}-${entry.id}`,
      type: 'line',
      title: `${entry.label} trajectory`,
      data: result.traces.map((trace) => ({
        year: trace.year,
        value: getStockValue(trace.stocks, entry.id),
      })),
    })),
    dataOutputs: [
      {
        id: `${runId}-traces`,
        format: 'system-dynamics-traces',
        rows: result.traces.length,
        columns: [
          'year',
          'population',
          'housing',
          'employment',
          'transportCapacity',
          'greenSpace',
          'qualityOfLife',
        ],
        preview: result.traces.slice(0, 8).map((trace) => ({
          year: trace.year,
          population: trace.stocks.population,
          housing: trace.stocks.housing,
          employment: trace.stocks.employment,
          transportCapacity: trace.stocks.transportCapacity,
          greenSpace: trace.stocks.greenSpace,
          qualityOfLife: trace.indicators.qualityOfLife,
        })),
      },
      {
        id: `${runId}-levers`,
        format: 'system-dynamics-policy-levers',
        rows: SYSTEM_DYNAMICS_POLICY_LEVERS.length,
        columns: ['lever', 'value'],
        preview: SYSTEM_DYNAMICS_POLICY_LEVERS.map((lever) => ({
          lever: lever.label,
          value: form.policyLevers[lever.id],
        })),
      },
    ],
  };
}

function buildSvgArrowId(id: string): string {
  return `${id}-arrow`;
}

function linePathWidth(value: number, min: number, max: number, width: number): number {
  if (max <= min) {
    return width / 2;
  }
  return ((value - min) / (max - min)) * width;
}

const TrajectoryChart: React.FC<{
  label: string;
  color: string;
  values: Array<{ year: number; value: number }>;
  unit: string;
  valueFormatter: (value: number) => string;
}> = ({ label, color, values, unit, valueFormatter }) => {
  const width = 280;
  const height = 140;
  const padding = 18;
  const minValue = Math.min(...values.map((entry) => entry.value));
  const maxValue = Math.max(...values.map((entry) => entry.value));
  const firstValue = values[0]?.value ?? 0;
  const lastValue = values[values.length - 1]?.value ?? 0;
  const changeRatio = (lastValue - firstValue) / Math.max(firstValue, 1);

  const points = values.map((entry, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - linePathWidth(entry.value, minValue, maxValue, height - padding * 2);
    return { x, y, year: entry.year, value: entry.value };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div style={{ border: '1px solid var(--syn-overlay-light)', borderRadius: 10, padding: 12, background: 'var(--syn-overlay-whisper)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div className={styles.formLabel}>{label}</div>
          <div className={styles.formHint}>{unit}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color }}>{valueFormatter(lastValue)}</div>
          <div className={styles.formHint}>{formatSignedPercent(changeRatio)} vs baseline</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', marginTop: 10 }}>
        <rect x={0} y={0} width={width} height={height} rx={10} fill="rgba(255,255,255,0.02)" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.16)" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.16)" />
        <path d={path} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <circle key={`${label}-${point.year}`} cx={point.x} cy={point.y} r={3.5} fill={color}>
            <title>{`${label} · Year ${point.year}: ${valueFormatter(point.value)}`}</title>
          </circle>
        ))}
        <text x={padding} y={12} style={{ fill: '#A8A29E', fontSize: 10 }}>{valueFormatter(maxValue)}</text>
        <text x={padding} y={height - 4} style={{ fill: '#A8A29E', fontSize: 10 }}>Year 0</text>
        <text x={width - padding} y={height - 4} textAnchor="end" style={{ fill: '#A8A29E', fontSize: 10 }}>Year {values[values.length - 1]?.year ?? 0}</text>
      </svg>
    </div>
  );
};

const StockFlowDiagramView: React.FC<{
  diagram: SystemDynamicsStockFlowDiagram;
  svgRef: React.RefObject<SVGSVGElement | null>;
}> = ({ diagram, svgRef }) => {
  const markerId = buildSvgArrowId('system-dynamics-stock-flow');

  return (
    <svg ref={svgRef} viewBox={`0 0 ${diagram.width} ${diagram.height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.55)" />
        </marker>
      </defs>
      <rect x={0} y={0} width={diagram.width} height={diagram.height} rx={18} fill="rgba(255,255,255,0.02)" />
      {diagram.feedbackArcs.map((arc) => (
        <g key={arc.id}>
          <path d={arc.path} fill="none" stroke={arc.type === 'reinforcing' ? 'rgba(56,189,248,0.65)' : 'rgba(245,158,11,0.65)'} strokeWidth={2} strokeDasharray="6 5" />
          <text x={arc.labelPoint.x} y={arc.labelPoint.y} textAnchor="middle" style={{ fill: '#E7E5E4', fontSize: 11 }}>
            {arc.label}
          </text>
        </g>
      ))}
      {diagram.links.map((link) => {
        const stroke = link.kind === 'flow' ? 'rgba(255,255,255,0.55)' : (link.polarity === 'negative' ? 'rgba(248,113,113,0.8)' : 'rgba(52,211,153,0.8)');
        const dash = link.kind === 'influence' ? '5 4' : undefined;
        return (
          <g key={link.id}>
            <line
              x1={link.from.x}
              y1={link.from.y}
              x2={link.to.x}
              y2={link.to.y}
              stroke={stroke}
              strokeWidth={link.kind === 'flow' ? 3 : 2}
              strokeDasharray={dash}
              markerEnd={`url(#${markerId})`}
            />
            {link.valve ? (
              <g transform={`translate(${link.valve.x} ${link.valve.y})`}>
                <circle r={8} fill="rgba(15,23,42,0.95)" stroke="rgba(245,158,11,0.85)" strokeWidth={2} />
                <line x1={-4} y1={0} x2={4} y2={0} stroke="#FDE68A" strokeWidth={1.5} />
                <line x1={0} y1={-4} x2={0} y2={4} stroke="#FDE68A" strokeWidth={1.5} />
              </g>
            ) : null}
            <text
              x={link.kind === 'flow' ? (link.valve?.x ?? ((link.from.x + link.to.x) / 2)) : ((link.from.x + link.to.x) / 2)}
              y={link.kind === 'flow' ? (link.valve?.y ?? ((link.from.y + link.to.y) / 2)) - 12 : ((link.from.y + link.to.y) / 2) - 8}
              textAnchor="middle"
              style={{ fill: '#D6D3D1', fontSize: 11 }}
            >
              {link.label}
            </text>
          </g>
        );
      })}
      {diagram.nodes.map((node) => (
        <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
          <rect
            width={node.width}
            height={node.height}
            rx={node.kind === 'stock' ? 12 : 10}
            fill={node.kind === 'stock' ? 'rgba(15,23,42,0.88)' : 'rgba(120,113,108,0.2)'}
            stroke={node.kind === 'stock' ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.24)'}
          />
          <text x={node.width / 2} y={node.height / 2 - 2} textAnchor="middle" style={{ fill: '#FAFAF9', fontSize: 12, fontWeight: 700 }}>
            {node.label}
          </text>
          <text x={node.width / 2} y={node.height / 2 + 14} textAnchor="middle" style={{ fill: '#A8A29E', fontSize: 10 }}>
            {node.kind === 'stock' ? 'Stock' : 'Policy lever'}
          </text>
        </g>
      ))}
    </svg>
  );
};

const CausalLoopDiagramView: React.FC<{
  graph: SystemDynamicsCausalLoopGraph;
  svgRef: React.RefObject<SVGSVGElement | null>;
}> = ({ graph, svgRef }) => {
  const markerId = buildSvgArrowId('system-dynamics-causal-loop');
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

  return (
    <svg ref={svgRef} viewBox={`0 0 ${graph.width} ${graph.height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.55)" />
        </marker>
      </defs>
      <rect x={0} y={0} width={graph.width} height={graph.height} rx={18} fill="rgba(255,255,255,0.02)" />
      {graph.edges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        const labelX = ((fromNode?.x ?? 0) + (toNode?.x ?? 0)) / 2;
        const labelY = ((fromNode?.y ?? 0) + (toNode?.y ?? 0)) / 2;
        return (
          <g key={edge.id}>
            <path d={edge.path} fill="none" stroke={edge.polarity === 'positive' ? 'rgba(52,211,153,0.85)' : 'rgba(248,113,113,0.85)'} strokeWidth={2.2} markerEnd={`url(#${markerId})`} />
            <g transform={`translate(${labelX} ${labelY})`}>
              <circle r={10} fill="rgba(15,23,42,0.95)" stroke="rgba(255,255,255,0.25)" />
              <text textAnchor="middle" dominantBaseline="middle" style={{ fill: '#FAFAF9', fontSize: 11, fontWeight: 700 }}>
                {edge.polarity === 'positive' ? '+' : '−'}
              </text>
            </g>
          </g>
        );
      })}
      {graph.nodes.map((node) => {
        const fill = node.group === 'lever'
          ? 'rgba(120,113,108,0.24)'
          : node.group === 'pressure'
            ? 'rgba(56,189,248,0.14)'
            : 'rgba(15,23,42,0.92)';
        const stroke = node.group === 'lever'
          ? 'rgba(255,255,255,0.24)'
          : node.group === 'pressure'
            ? 'rgba(56,189,248,0.65)'
            : 'rgba(245,158,11,0.8)';
        return (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <circle r={34} fill={fill} stroke={stroke} strokeWidth={2} />
            <text textAnchor="middle" y={-4} style={{ fill: '#FAFAF9', fontSize: 11, fontWeight: 700 }}>
              {node.label}
            </text>
            <text textAnchor="middle" y={12} style={{ fill: '#A8A29E', fontSize: 10 }}>
              {node.group.replace(/_/g, ' ')}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LinkLegend: React.FC<{ links: SystemDynamicsDiagramLink[] }> = ({ links }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {links.slice(0, 6).map((link) => (
      <span
        key={link.id}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          border: '1px solid var(--syn-overlay-light)',
          padding: '4px 8px',
          fontSize: 10,
          color: 'var(--syn-text-muted)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 999, background: link.kind === 'flow' ? '#F59E0B' : (link.polarity === 'negative' ? '#F87171' : '#34D399') }} />
        {link.label}
      </span>
    ))}
  </div>
);

const SystemDynamicsFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const { stepData, setStepData, upsertCompletedRun } = useFlowStore();

  const initialForm = useMemo(
    () => restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
    [stepData],
  );
  const storedResult = stepData[RESULT_KEY] as SystemDynamicsResult | undefined;

  const [form, setForm] = useState<SystemDynamicsFlowForm>(initialForm);
  const [result, setResult] = useState<SystemDynamicsResult>(() => (
    storedResult ?? simulateSystemDynamics({
      scenarioName: initialForm.scenarioName,
      years: initialForm.years,
      policyLevers: initialForm.policyLevers,
    })
  ));
  const [isSimulating, setIsSimulating] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastSimulatedAt, setLastSimulatedAt] = useState<string>(() => new Date().toISOString());

  const stockFlowSvgRef = useRef<SVGSVGElement | null>(null);
  const causalLoopSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setStepData(FORM_KEY, form);
  }, [form, setStepData]);

  useEffect(() => {
    setIsSimulating(true);
    setRunError(null);

    const handle = window.setTimeout(() => {
      try {
        const nextResult = simulateSystemDynamics({
          scenarioName: form.scenarioName,
          years: form.years,
          policyLevers: form.policyLevers,
        });
        setResult(nextResult);
        setStepData(RESULT_KEY, nextResult);
        setLastSimulatedAt(new Date().toISOString());
      } catch (error) {
        setRunError(error instanceof Error ? error.message : 'System dynamics simulation failed.');
      } finally {
        setIsSimulating(false);
      }
    }, 90);

    return () => window.clearTimeout(handle);
  }, [form, setStepData]);

  const updateForm = <K extends keyof SystemDynamicsFlowForm>(key: K, value: SystemDynamicsFlowForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateLever = (leverId: keyof SystemDynamicsPolicyLevers, value: number) => {
    setForm((previous) => {
      return {
        ...previous,
        policyLevers: {
          ...previous.policyLevers,
          [leverId]: value,
        },
      };
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = SYSTEM_DYNAMICS_SCENARIO_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    setForm((previous) => {
      return {
        ...previous,
        scenarioName: preset.label,
        policyLevers: { ...preset.policyLevers },
      };
    });
  };

  const exportWorkflowJson = () => {
    downloadJSON(exportFlowJSON('system_dynamics', form as unknown as Record<string, unknown>, {
      summary: result.summary,
      stability: result.stability,
      finalStocks: result.finalStocks,
      policyLevers: result.policyLevers,
    }));
  };

  const exportTraces = () => {
    downloadTextFile(`${slugify(form.scenarioName)}-traces.csv`, buildTraceCsv(result), 'text/csv;charset=utf-8');
  };

  const exportParameters = () => {
    downloadTextFile(
      `${slugify(form.scenarioName)}-parameters.json`,
      JSON.stringify({
        scenarioName: form.scenarioName,
        years: form.years,
        policyLevers: form.policyLevers,
        baselineStocks: DEFAULT_SYSTEM_DYNAMICS_STOCKS,
      }, null, 2),
    );
  };

  const publishRunToReview = () => {
    upsertCompletedRun(buildCompletedRun(form, result));
  };

  const baselineTrace = result.traces[0] ?? null;
  const finalTrace = result.traces[result.traces.length - 1] ?? null;
  const currentDiagram = form.activeDiagram;
  const maxStep = STEPS.length - 1;

  return (
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>{FLOW_DEF.icon} {FLOW_DEF.label}</div>
          <div className={styles.flowTitleMeta}>Step {step + 1} of {STEPS.length}</div>
          <div style={{ marginLeft: 'auto' }}>
            <MethodologyInfoButton explainerId="system_dynamics" pathId="scenario_planning_decision_support" label="Methodology note" />
          </div>
        </div>
        <div className={styles.flowSubtitle}>{FLOW_DEF.description}</div>
      </header>

      <StepPills
        steps={STEPS.map((entry) => ({ key: entry.key, label: entry.label }))}
        currentIndex={step}
        onSelect={(index) => setStep(clamp(index, 0, maxStep))}
      />

      {isSimulating ? (
        <div className={styles.warnBlock}>
          Re-simulating annual stock trajectories from the current policy levers. The diagram and charts refresh automatically when the integration completes.
        </div>
      ) : null}

      {runError ? <div className={styles.warn}>{runError}</div> : null}

      <div className={styles.flowBodyArea}>
        {step === 0 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Baseline Stocks & Simulation Horizon</div>
            <p className={styles.formHint}>
              This module starts from a teaching-scale urban baseline and simulates annual change using explicit Euler integration. Horizon length and policy levers drive the projected trajectories.
            </p>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Scenario name
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.scenarioName}
                  onChange={(event) => updateForm('scenarioName', event.target.value)}
                  style={{ marginTop: 6 }}
                />
              </label>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formLabel}>Simulation horizon</div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={form.years}
                onChange={(event) => updateForm('years', Number(event.target.value))}
                style={{ width: '100%' }}
              />
              <div className={styles.formHint}>{form.years} years with annual time steps.</div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formLabel}>Scenario presets</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SYSTEM_DYNAMICS_SCENARIO_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" className={styles.outlineBtn} onClick={() => applyPreset(preset.id)}>
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className={styles.formHint}>Presets set the policy levers immediately and trigger a fresh simulation.</div>
            </div>

            <div className={styles.readonlyBlock}>
              {result.summary.headline}
              {'\n'}{describeStability(result)}
              {'\n'}Last simulated: {new Date(lastSimulatedAt).toLocaleString()}
            </div>

            <div style={stockCardGridStyle}>
              {STOCK_META.map((entry) => {
                const baselineValue = baselineTrace ? getStockValue(baselineTrace.stocks, entry.id) : getStockValue(DEFAULT_SYSTEM_DYNAMICS_STOCKS, entry.id);
                const finalValue = finalTrace ? getStockValue(finalTrace.stocks, entry.id) : baselineValue;
                const changeRatio = (finalValue - baselineValue) / Math.max(baselineValue, 1);
                return (
                  <div key={entry.id} style={{ border: '1px solid var(--syn-overlay-light)', borderRadius: 10, padding: 12, background: 'var(--syn-overlay-whisper)' }}>
                    <div className={styles.formLabel}>{entry.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: entry.color }}>{entry.valueFormatter(baselineValue)}</div>
                    <div className={styles.formHint}>Baseline {entry.unit}</div>
                    <div className={styles.formHint}>End-state {entry.valueFormatter(finalValue)} ({formatSignedPercent(changeRatio)})</div>
                  </div>
                );
              })}
            </div>

            {baselineTrace ? (
              <div style={{ ...stockCardGridStyle, marginTop: 12 }}>
                {[
                  { label: 'Housing adequacy', value: formatPercentFromRatio(Math.min(1, baselineTrace.indicators.housingAdequacy / 1.1)) },
                  { label: 'Employment adequacy', value: formatPercentFromRatio(Math.min(1, baselineTrace.indicators.employmentAdequacy / 1.1)) },
                  { label: 'Transport adequacy', value: formatPercentFromRatio(Math.min(1, baselineTrace.indicators.transportAdequacy / 1.1)) },
                  { label: 'Green space / capita', value: `${baselineTrace.indicators.greenSpacePerCapita.toFixed(1)} m²` },
                ].map((metric) => (
                  <div key={metric.label} style={{ border: '1px solid var(--syn-overlay-light)', borderRadius: 10, padding: 12, background: 'var(--syn-overlay-whisper)' }}>
                    <div className={styles.formHint}>{metric.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--syn-text-primary)' }}>{metric.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Policy Lever Sliders</div>
            <p className={styles.formHint}>
              Each slider functions as a policy lever. Every change immediately re-runs the simulation, updates the final stocks, and refreshes the downstream diagrams and charts.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => updateForm('policyLevers', { ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS })}
              >
                Reset levers
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => setStep(2)}
              >
                Open system diagrams
              </button>
            </div>

            {SYSTEM_DYNAMICS_POLICY_LEVERS.map((lever) => (
              <div key={lever.id} className={styles.formSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div className={styles.formLabel}>{lever.label}</div>
                    <div className={styles.formHint}>{lever.description}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--syn-text-primary)' }}>{form.policyLevers[lever.id]}</span>
                </div>
                <input
                  type="range"
                  min={lever.min}
                  max={lever.max}
                  step={lever.step}
                  value={form.policyLevers[lever.id]}
                  onChange={(event) => updateLever(lever.id, Number(event.target.value))}
                  style={{ width: '100%', marginTop: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span className={styles.formHint}>{lever.lowLabel}</span>
                  <span className={styles.formHint}>{lever.highLabel}</span>
                </div>
              </div>
            ))}

            <div className={styles.readonlyBlock}>
              {result.summary.keyTensions.join('\n')}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Stock-and-Flow Diagram</div>
            <p className={styles.formHint}>
              Stocks are rendered as boxes, flows as valves, and feedback loops as arcs. This view is intended to explain the structural logic behind the annual simulation results.
            </p>

            <div style={diagramToggleRowStyle}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => updateForm('activeDiagram', 'stock_flow')}
                style={{ borderColor: currentDiagram === 'stock_flow' ? 'var(--syn-accent-primary)' : undefined }}
              >
                Stock-and-flow
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => {
                  updateForm('activeDiagram', 'causal_loop');
                  setStep(4);
                }}
              >
                Open causal loop view
              </button>
            </div>

            <div style={{ marginTop: 12, border: '1px solid var(--syn-overlay-light)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.02)' }}>
              <StockFlowDiagramView diagram={result.stockFlowDiagram} svgRef={stockFlowSvgRef} />
            </div>

            <div style={{ marginTop: 12 }}>
              <LinkLegend links={result.stockFlowDiagram.links} />
            </div>

            <div className={styles.readonlyBlock}>
              {result.stockFlowDiagram.feedbackArcs.map((arc) => `${arc.label}: ${arc.description}`).join('\n')}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Timeline Charts</div>
            <p className={styles.formHint}>
              These trajectories show how each stock evolves through the simulated horizon under the active policy mix.
            </p>

            <div style={stockCardGridStyle}>
              {STOCK_META.map((entry) => (
                <TrajectoryChart
                  key={entry.id}
                  label={entry.label}
                  color={entry.color}
                  unit={entry.unit}
                  valueFormatter={entry.valueFormatter}
                  values={result.traces.map((trace) => ({ year: trace.year, value: getStockValue(trace.stocks, entry.id) }))}
                />
              ))}
            </div>

            {finalTrace ? (
              <div style={{ ...stockCardGridStyle, marginTop: 12 }}>
                {[
                  { label: 'Quality of life', value: finalTrace.indicators.qualityOfLife.toFixed(2) },
                  { label: 'Jobs / resident', value: finalTrace.indicators.jobsPerResident.toFixed(3) },
                  { label: 'Jobs / housing', value: finalTrace.indicators.jobsHousingBalance.toFixed(3) },
                  { label: 'Transport adequacy', value: finalTrace.indicators.transportAdequacy.toFixed(2) },
                  { label: 'Green space / capita', value: `${finalTrace.indicators.greenSpacePerCapita.toFixed(1)} m²` },
                ].map((metric) => (
                  <div key={metric.label} style={{ border: '1px solid var(--syn-overlay-light)', borderRadius: 10, padding: 12, background: 'var(--syn-overlay-whisper)' }}>
                    <div className={styles.formHint}>{metric.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--syn-text-primary)' }}>{metric.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Causal Loop View & Export</div>
            <p className={styles.formHint}>
              The causal loop view focuses on reinforcing and balancing feedback structure for teaching and diagnosis. Export controls package traces, parameters, and diagram images directly from the module.
            </p>

            <div style={diagramToggleRowStyle}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => updateForm('activeDiagram', 'causal_loop')}
                style={{ borderColor: currentDiagram === 'causal_loop' ? 'var(--syn-accent-primary)' : undefined }}
              >
                Causal loop diagram
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => {
                  updateForm('activeDiagram', 'stock_flow');
                  setStep(2);
                }}
              >
                Return to stock-flow view
              </button>
            </div>

            <div style={{ marginTop: 12, border: '1px solid var(--syn-overlay-light)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.02)' }}>
              <CausalLoopDiagramView graph={result.causalLoopGraph} svgRef={causalLoopSvgRef} />
            </div>

            <div className={styles.readonlyBlock}>
              {result.causalLoopGraph.loops.map((loop) => `${loop.label}: ${loop.description}`).join('\n')}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className={styles.outlineBtn} onClick={exportTraces}>Export traces CSV</button>
              <button type="button" className={styles.outlineBtn} onClick={exportParameters}>Export parameters JSON</button>
              <button type="button" className={styles.outlineBtn} onClick={() => downloadSvg(stockFlowSvgRef.current, `${slugify(form.scenarioName)}-stock-flow.svg`)}>Export stock-flow SVG</button>
              <button type="button" className={styles.outlineBtn} onClick={() => downloadSvg(causalLoopSvgRef.current, `${slugify(form.scenarioName)}-causal-loop.svg`)}>Export causal-loop SVG</button>
              <button type="button" className={styles.outlineBtn} onClick={exportWorkflowJson}>Export workflow JSON</button>
              <button type="button" className={styles.outlineBtn} onClick={publishRunToReview}>Publish to review</button>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formLabel}>Trace preview</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Year', 'Population', 'Housing', 'Employment', 'Transport', 'Green Space', 'QoL'].map((header) => (
                        <th key={header} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)', color: 'var(--syn-text-primary)' }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.traces.slice(0, 10).map((trace) => (
                      <tr key={`trace-row-${trace.year}`}>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{trace.label}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{formatInteger(trace.stocks.population)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{formatInteger(trace.stocks.housing)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{formatInteger(trace.stocks.employment)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{formatInteger(trace.stocks.transportCapacity)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{formatDecimal(trace.stocks.greenSpace)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--syn-overlay-light)' }}>{trace.indicators.qualityOfLife.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <CrossPanelActions flowId="system_dynamics" stepLabel={STEPS[step]!.label} />

      <footer className={styles.flowFooter}>
        <button type="button" className={styles.outlineBtn} disabled={step === 0} onClick={() => setStep((previous) => clamp(previous - 1, 0, maxStep))}>
          ← Previous
        </button>
        <button type="button" className={styles.outlineBtn} disabled={step === maxStep} onClick={() => setStep((previous) => clamp(previous + 1, 0, maxStep))}>
          Next →
        </button>
      </footer>
    </section>
  );
};

export default SystemDynamicsFlow;