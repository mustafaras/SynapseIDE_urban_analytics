import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Calculator,
  Clock3,
  ExternalLink,
  FilePlus2,
  LayoutDashboard,
  Ruler,
  Search,
  ShieldCheck,
  Sigma,
  Workflow,
} from 'lucide-react';

import { useProjectRegistryOptional } from '@/centerpanel/registry/state';
import { getComputedIndicatorBindingId } from '@/features/dashboard/dataBindings';
import { enqueueIndicatorPendingInsert } from '@/services/reporting/indicatorInserts';
import { useCalcStore } from '@/stores/useCalcStore';

import {
  createComputedIndicatorRecord,
  getIndicatorDefinition,
  getIndicatorGroup,
  INDICATOR_CATALOG,
  INDICATOR_CATALOG_COUNT,
  INDICATOR_CATALOG_GROUPS,
  listIndicatorDefinitionsForGroup,
  searchIndicatorDefinitions,
} from './catalog';
import {
  resolveIndicatorTraceabilityMetadata,
  validateIndicatorTraceabilityMetadata,
} from './shared';
import {
  COMPUTED_INDICATOR_STORAGE_EVENT,
  loadComputedIndicatorRecords,
  upsertComputedIndicatorRecord,
} from './storage';
import type {
  ComputedIndicatorRecord,
  IndicatorCatalogDefinition,
  IndicatorCatalogFocusRequest,
  IndicatorCatalogGroupId,
} from './types';
import type { UrbanIndicatorKind } from '../lib/types';
import styles from './IndicatorCatalogPanel.module.css';

type GroupFilter = IndicatorCatalogGroupId | 'all';

export interface IndicatorCatalogPanelProps {
  focusRequest?: IndicatorCatalogFocusRequest | null;
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

function formatRecordValue(record: ComputedIndicatorRecord): string {
  return record.result.displayValue ?? `${formatNumber(record.result.value)} ${record.result.unit}`.trim();
}

function formatFlowLabel(flowId: string): string {
  return flowId.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatScaleList(values: string[], fallback: string): string {
  return values.length ? values.map((value) => value.replace(/_/g, ' ')).join(', ') : fallback;
}

function formatCapabilityStatus(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function preferredDashboardVariant(
  definition: IndicatorCatalogDefinition,
  record: ComputedIndicatorRecord,
): { bindingId: string; widgetType: 'kpi' | 'chart' | 'text' } {
  const hasComponents = (record.result.components?.length ?? 0) > 0;

  if (definition.dashboardBindingKind === 'text') {
    return {
      bindingId: getComputedIndicatorBindingId(definition.kind, 'text'),
      widgetType: 'text',
    };
  }

  if ((definition.dashboardBindingKind === 'series' || hasComponents) && hasComponents) {
    return {
      bindingId: getComputedIndicatorBindingId(definition.kind, 'series'),
      widgetType: 'chart',
    };
  }

  return {
    bindingId: getComputedIndicatorBindingId(definition.kind, 'metric'),
    widgetType: 'kpi',
  };
}

export default function IndicatorCatalogPanel({ focusRequest = null }: IndicatorCatalogPanelProps) {
  const projectRegistry = useProjectRegistryOptional();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [selectedKind, setSelectedKind] = useState<UrbanIndicatorKind | null>(INDICATOR_CATALOG[0]?.kind ?? null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<ComputedIndicatorRecord[]>(() => loadComputedIndicatorRecords());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredDefinitions = useMemo(() => {
    const base = deferredQuery ? searchIndicatorDefinitions(deferredQuery) : INDICATOR_CATALOG;
    if (groupFilter === 'all') {
      return base;
    }
    return base.filter((definition) => definition.groupId === groupFilter);
  }, [deferredQuery, groupFilter]);

  const selectedDefinition = useMemo(() => {
    if (selectedKind) {
      const direct = getIndicatorDefinition(selectedKind);
      if (direct) {
        return direct;
      }
    }
    return filteredDefinitions[0] ?? null;
  }, [filteredDefinitions, selectedKind]);

  const latestRecordMap = useMemo(() => {
    const next = new Map<UrbanIndicatorKind, ComputedIndicatorRecord>();
    for (const record of records) {
      if (!next.has(record.kind)) {
        next.set(record.kind, record);
      }
    }
    return next;
  }, [records]);

  const selectedRecord = selectedDefinition ? latestRecordMap.get(selectedDefinition.kind) ?? null : null;
  const selectedHistory = useMemo(() => (
    selectedDefinition
      ? records.filter((record) => record.kind === selectedDefinition.kind).slice(0, 4)
      : []
  ), [records, selectedDefinition]);
  const selectedTraceability = useMemo(
    () => selectedDefinition ? resolveIndicatorTraceabilityMetadata(selectedDefinition) : null,
    [selectedDefinition],
  );
  const selectedTraceabilityValidation = useMemo(
    () => selectedDefinition ? validateIndicatorTraceabilityMetadata(selectedDefinition) : null,
    [selectedDefinition],
  );

  const selectedGroup = selectedDefinition ? getIndicatorGroup(selectedDefinition.groupId) : null;
  const selectedProject = useMemo(() => {
    if (!projectRegistry?.state.selectedProjectId) {
      return null;
    }
    return projectRegistry.state.projects.find((project) => project.id === projectRegistry.state.selectedProjectId) ?? null;
  }, [projectRegistry]);

  useEffect(() => {
    const handleStorageUpdate = () => setRecords(loadComputedIndicatorRecords());
    window.addEventListener(COMPUTED_INDICATOR_STORAGE_EVENT, handleStorageUpdate);
    return () => window.removeEventListener(COMPUTED_INDICATOR_STORAGE_EVENT, handleStorageUpdate);
  }, []);

  useEffect(() => {
    if (!filteredDefinitions.length) {
      return;
    }
    if (!selectedDefinition || !filteredDefinitions.some((definition) => definition.kind === selectedDefinition.kind)) {
      setSelectedKind(filteredDefinitions[0].kind);
    }
  }, [filteredDefinitions, selectedDefinition]);

  useEffect(() => {
    if (!selectedDefinition) {
      return;
    }

    const nextValues = Object.fromEntries(
      selectedDefinition.inputFields.map((field) => [
        field.key,
        String(selectedRecord?.inputs[field.key] ?? field.defaultValue),
      ]),
    );

    setFormValues(nextValues);
    setErrorMessage(null);
  }, [selectedDefinition, selectedRecord]);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    if (focusRequest.query !== undefined) {
      setQuery(focusRequest.query);
    }

    if (focusRequest.indicatorKind) {
      const definition = getIndicatorDefinition(focusRequest.indicatorKind);
      setSelectedKind(focusRequest.indicatorKind);
      if (definition) {
        setGroupFilter(definition.groupId);
      }
    } else if (focusRequest.groupId) {
      setGroupFilter(focusRequest.groupId);
      const firstDefinition = listIndicatorDefinitionsForGroup(focusRequest.groupId)[0];
      if (firstDefinition) {
        setSelectedKind(firstDefinition.kind);
      }
    }
  }, [focusRequest]);

  function handleInputChange(key: string, value: string): void {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleCompute(): void {
    if (!selectedDefinition) {
      return;
    }

    const numericInput = Object.fromEntries(
      selectedDefinition.inputFields.map((field) => [field.key, Number(formValues[field.key])]),
    );

    const parsed = selectedDefinition.inputSchema.safeParse(numericInput);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Please review the indicator inputs.');
      setStatusMessage(null);
      return;
    }

    const record = createComputedIndicatorRecord(selectedDefinition.kind, parsed.data as Record<string, number>);
    const nextRecords = upsertComputedIndicatorRecord(record);
    setRecords(nextRecords);
    setErrorMessage(null);
    setStatusMessage(`${selectedDefinition.title} computed successfully.`);

    const calcStore = useCalcStore.getState();
    calcStore.setCalculator(selectedDefinition.kind);
    calcStore.compute(record.result);
    calcStore.addToHistory(record.result);

    if (selectedProject && projectRegistry) {
      const nextIndicators = [
        record.result,
        ...selectedProject.indicators.filter((indicator) => indicator.kind !== record.kind),
      ];
      projectRegistry.actions.updateProject(selectedProject.id, { indicators: nextIndicators });
    }
  }

  function handleAddToReport(): void {
    if (!selectedRecord) {
      return;
    }
    enqueueIndicatorPendingInsert(selectedRecord);
    window.dispatchEvent(new CustomEvent('synapse:navigate', { detail: { tab: 'Report' } }));
  }

  function handleAddToDashboard(): void {
    if (!selectedDefinition || !selectedRecord) {
      return;
    }

    const pending = preferredDashboardVariant(selectedDefinition, selectedRecord);
    window.dispatchEvent(new CustomEvent('synapse:navigate', {
      detail: {
        tab: 'Dashboard',
        dashboardBindingId: pending.bindingId,
        dashboardWidgetType: pending.widgetType,
        dashboardRequestedAt: Date.now(),
      },
    }));
  }

  function handleOpenEducation(): void {
    if (!selectedDefinition) {
      return;
    }

    window.dispatchEvent(new CustomEvent('synapse:navigate', {
      detail: {
        tab: 'Education',
        educationView: 'paths',
        educationPathId: selectedDefinition.education.pathId,
        educationExplainerId: selectedDefinition.education.explainerId,
        educationRequestedAt: Date.now(),
      },
    }));
  }

  function handleOpenFlow(flowId: string): void {
    window.dispatchEvent(new CustomEvent('synapse:navigate', {
      detail: {
        tab: 'Workflows',
        flowId,
      },
    }));
  }

  if (!selectedDefinition) {
    return (
      <div className={styles.emptyState}>
        No indicator definitions matched the current filter.
      </div>
    );
  }

  return (
    <div className={styles.catalogShell} data-testid="indicator-catalog-panel">
      <aside className={styles.browserPane}>
        <div className={styles.introCard}>
          <div className={styles.kicker}>Prompt 36 Indicator Catalog</div>
          <h3 className={styles.introTitle}>Section 11 scientific indicator library</h3>
          <p className={styles.introText}>
            Browse {INDICATOR_CATALOG_COUNT} additional indicators, inspect formulas and references, then compute dashboard- and report-ready results from the Toolbox.
          </p>
        </div>

        <label className={styles.searchField}>
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search formula, flow, tag, or methodology"
            aria-label="Search indicators"
          />
        </label>

        <div className={styles.filterRow}>
          <button
            type="button"
            className={groupFilter === 'all' ? styles.activeChip : styles.filterChip}
            onClick={() => setGroupFilter('all')}
          >
            All groups
          </button>
          {INDICATOR_CATALOG_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              className={groupFilter === group.id ? styles.activeChip : styles.filterChip}
              onClick={() => setGroupFilter(group.id)}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className={styles.resultMeta}>
          <span>{filteredDefinitions.length} visible indicators</span>
          <span>{records.length} stored computations</span>
        </div>

        <div className={styles.cardList}>
          {filteredDefinitions.map((definition) => {
            const latest = latestRecordMap.get(definition.kind);
            return (
              <button
                key={definition.kind}
                type="button"
                className={definition.kind === selectedDefinition.kind ? styles.activeCard : styles.catalogCard}
                onClick={() => setSelectedKind(definition.kind)}
                data-indicator-kind={definition.kind}
              >
                <div className={styles.cardHeaderRow}>
                  <span className={styles.cardTitle}>{definition.title}</span>
                  <span className={styles.cardUnit}>{definition.unit}</span>
                </div>
                <p className={styles.cardSummary}>{definition.summary}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardGroup}>{getIndicatorGroup(definition.groupId)?.label ?? definition.groupId}</span>
                  <span className={styles.cardValue}>{latest ? formatRecordValue(latest) : 'Not yet computed'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={styles.detailPane}>
        <div className={styles.detailHero}>
          <div className={styles.detailEyebrow}>{selectedGroup?.label ?? selectedDefinition.groupId}</div>
          <div className={styles.detailTitleRow}>
            <div>
              <h3 className={styles.detailTitle}>{selectedDefinition.title}</h3>
              <p className={styles.detailSummary}>{selectedDefinition.summary}</p>
            </div>
            <div className={styles.statusColumn}>
              <span className={styles.metricLabel}>Latest result</span>
              <strong className={styles.metricValue}>{selectedRecord ? formatRecordValue(selectedRecord) : 'Pending computation'}</strong>
              <span className={styles.metricClassification}>{selectedRecord?.result.classification ?? 'No classification yet'}</span>
            </div>
          </div>
          {selectedTraceability && selectedTraceabilityValidation ? (
            <div className={styles.traceabilityStrip} aria-label="Indicator scientific metadata">
              <div className={styles.traceabilityItem}>
                <Sigma size={14} />
                <span>Formula</span>
                <strong>{selectedTraceability.formula}</strong>
              </div>
              <div className={styles.traceabilityItem}>
                <BadgeCheck size={14} />
                <span>Unit</span>
                <strong>{selectedTraceability.units}</strong>
              </div>
              <div className={styles.traceabilityItem} title={selectedTraceability.spatialScaleNote}>
                <Ruler size={14} />
                <span>Scale</span>
                <strong>{formatScaleList(selectedTraceability.spatialScale, 'study area')}</strong>
              </div>
              <div className={styles.traceabilityItem} title={selectedTraceability.temporalScaleNote}>
                <Clock3 size={14} />
                <span>Temporal</span>
                <strong>{selectedTraceability.temporalScale.replace(/-/g, ' ')}</strong>
              </div>
              <div className={styles.traceabilityItem}>
                <ShieldCheck size={14} />
                <span>Status</span>
                <strong>
                  {selectedTraceabilityValidation.ok
                    ? formatCapabilityStatus(selectedTraceability.capabilityStatus)
                    : `${selectedTraceabilityValidation.issues.filter((issue) => issue.severity === 'error').length} metadata gaps`}
                </strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.definitionGrid}>
          <div className={styles.definitionCard}>
            <div className={styles.definitionLabel}><Sigma size={15} /> Formula</div>
            <code className={styles.formulaBlock}>{selectedDefinition.formula}</code>
            <p className={styles.definitionBody}>{selectedDefinition.methodSummary}</p>
            {selectedTraceability ? (
              <div className={styles.traceabilityNotes}>
                <span>Normalization: {selectedTraceability.normalizationMethod.replace(/-/g, ' ')}</span>
                <span>Inputs: {selectedTraceability.inputFields.map((field) => `${field.label} (${field.unit})`).join('; ')}</span>
                <span>Limitations: {selectedTraceability.limitations.slice(0, 2).join(' ')}</span>
              </div>
            ) : null}
          </div>

          <div className={styles.definitionCard}>
            <div className={styles.definitionLabel}><BookOpen size={15} /> Reference</div>
            <p className={styles.definitionBody}>{selectedDefinition.methodologicalReference}</p>
            {selectedTraceability ? (
              <p className={styles.sourceNote}>
                {selectedTraceability.sourceNote} Metadata source: {selectedTraceability.metadataSource.replace(/-/g, ' ')}.
              </p>
            ) : null}
            {selectedDefinition.referenceUrl ? (
              <a className={styles.referenceLink} href={selectedDefinition.referenceUrl} target="_blank" rel="noreferrer">
                Open source reference <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        </div>

        <div className={styles.bandPanel}>
          <div className={styles.definitionLabel}>Classification bands</div>
          <div className={styles.bandList}>
            {selectedDefinition.classification.map((band) => (
              <div key={`${selectedDefinition.kind}-${band.label}`} className={styles.bandCard}>
                <strong>{band.label}</strong>
                <span>{band.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.computeGrid}>
          <div className={styles.computeCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h4>Compute</h4>
                <p>Provide study-area inputs and generate a reusable indicator result.</p>
              </div>
              <button type="button" className={styles.computeButton} onClick={handleCompute}>
                <Calculator size={16} /> Compute indicator
              </button>
            </div>

            <div className={styles.formGrid}>
              {selectedDefinition.inputFields.map((field) => (
                <label key={field.key} className={styles.inputField}>
                  <span className={styles.inputLabel}>{field.label}</span>
                  <span className={styles.inputHelp}>{field.description}</span>
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 'any'}
                    value={formValues[field.key] ?? ''}
                    onChange={(event) => handleInputChange(field.key, event.target.value)}
                  />
                  <span className={styles.inputUnit}>{field.unit ?? 'unitless'}</span>
                </label>
              ))}
            </div>

            {errorMessage ? <div className={styles.errorBox}>{errorMessage}</div> : null}
            {statusMessage ? <div className={styles.successBox}>{statusMessage}</div> : null}
          </div>

          <div className={styles.computeCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h4>Result staging</h4>
                <p>Publish the latest computation into reporting, dashboard, or education contexts.</p>
              </div>
            </div>

            <div className={styles.resultPanel}>
              <div className={styles.resultValue}>{selectedRecord ? formatRecordValue(selectedRecord) : 'No result yet'}</div>
              <div className={styles.resultSummary}>{selectedRecord?.result.summary ?? selectedDefinition.summary}</div>
              <div className={styles.resultMetaRow}>
                <span>{selectedRecord?.result.classification ?? 'Awaiting classification'}</span>
                <span>{selectedRecord ? formatTimestamp(selectedRecord.computedAt) : 'Compute to store a timestamp'}</span>
              </div>
              {selectedRecord?.result.components?.length ? (
                <div className={styles.componentGrid}>
                  {selectedRecord.result.components.map((component) => (
                    <div key={component.key} className={styles.componentCard}>
                      <span>{component.label}</span>
                      <strong>{formatNumber(component.value)}{component.unit ? ` ${component.unit}` : ''}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={styles.actionRow}>
              <button type="button" className={styles.actionButton} onClick={handleAddToDashboard} disabled={!selectedRecord}>
                <LayoutDashboard size={16} /> Add to Dashboard
              </button>
              <button type="button" className={styles.actionButton} onClick={handleAddToReport} disabled={!selectedRecord}>
                <FilePlus2 size={16} /> Add to Report
              </button>
              <button type="button" className={styles.actionButton} onClick={handleOpenEducation}>
                <BookOpen size={16} /> Learning context
              </button>
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.bottomCard}>
            <div className={styles.definitionLabel}>Interpretation guidance</div>
            <ul className={styles.guidanceList}>
              {selectedDefinition.interpretationGuidance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.bottomCard}>
            <div className={styles.definitionLabel}><Workflow size={15} /> Related flows</div>
            <div className={styles.flowButtons}>
              {selectedDefinition.relatedFlowIds.map((flowId) => (
                <button key={flowId} type="button" className={styles.flowButton} onClick={() => handleOpenFlow(flowId)}>
                  {formatFlowLabel(flowId)}
                </button>
              ))}
            </div>
            <p className={styles.educationNote}>{selectedDefinition.education.note}</p>
          </div>

          <div className={styles.bottomCard}>
            <div className={styles.definitionLabel}>Recent computations</div>
            <div className={styles.historyList}>
              {selectedHistory.length ? selectedHistory.map((record) => (
                <div key={`${record.kind}-${record.computedAt}`} className={styles.historyItem}>
                  <strong>{formatRecordValue(record)}</strong>
                  <span>{record.result.classification ?? 'Unclassified'}</span>
                  <span>{formatTimestamp(record.computedAt)}</span>
                </div>
              )) : <div className={styles.emptyHistory}>No stored computations yet for this indicator.</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
