import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Braces, CheckCircle2, FileCode2, GitBranch, Layers3, Play, Save, X } from "lucide-react";
import type { ProcessingToolDescriptor, ToolParameterDescriptor } from "@/services/map/contracts/gisContracts";
import {
  type MapModelBatchResult,
  type MapModelBatchTarget,
  type MapModelDefinition,
  type MapModelLiteralValue,
  type MapModelParameterBinding,
  type MapModelRunResult,
  type MapModelStep,
  type MapSavedModel,
  saveMapModel,
} from "@/services/map/model";
import { GisProgressBar, GisPropertyGrid, GisSectionHeader, GisStatusChip } from "../ui";
import styles from "./MapModelBuilderPanel.module.css";

export interface MapModelBuilderLayerOption {
  id: string;
  name: string;
}

export interface MapModelBuilderPanelProps {
  visible: boolean;
  onClose: () => void;
  tools: readonly ProcessingToolDescriptor[];
  layers: readonly MapModelBuilderLayerOption[];
  onRun: (model: MapModelDefinition) => MapModelRunResult;
  onRunBatch: (model: MapModelDefinition, targets: readonly MapModelBatchTarget[]) => MapModelBatchResult;
  onExportToIdeAndUrban: (result: MapModelRunResult, batchResult: MapModelBatchResult | null) => void;
  presentation?: "floating" | "embedded";
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled-model";
}

function defaultLiteral(parameter: ToolParameterDescriptor): MapModelLiteralValue {
  if (parameter.defaultValue !== undefined) return parameter.defaultValue;
  if (parameter.type === "boolean") return false;
  return "";
}

function defaultStep(
  descriptor: ProcessingToolDescriptor,
  index: number,
  previousStepId: string | null,
): MapModelStep {
  const parameters: Record<string, MapModelParameterBinding> = {};
  for (const parameter of descriptor.parameters) {
    if (parameter.type === "layer") {
      const isPrimary = parameter.key === "layer";
      parameters[parameter.key] = isPrimary && previousStepId
        ? { kind: "step-output", stepId: previousStepId }
        : { kind: "source", inputId: isPrimary ? "source" : "overlay" };
    } else if (parameter.type === "aoi") {
      parameters[parameter.key] = { kind: "batch-aoi" };
    } else {
      parameters[parameter.key] = { kind: "literal", value: defaultLiteral(parameter) };
    }
  }
  return {
    stepId: `step-${index + 1}`,
    toolId: descriptor.toolId,
    label: descriptor.title,
    parameters,
  };
}

interface StepReadiness {
  step: MapModelStep;
  descriptor: ProcessingToolDescriptor | null;
  index: number;
  status: "ready" | "blocked";
  reasons: string[];
  dependencies: string[];
  outputLabel: string;
}

function nextStepIndex(steps: readonly MapModelStep[]): number {
  const existing = new Set(steps.map((step) => step.stepId));
  let index = steps.length + 1;
  while (existing.has(`step-${index}`)) index += 1;
  return index;
}

function updateStepLabel(steps: readonly MapModelStep[], stepId: string, label: string): MapModelStep[] {
  return steps.map((step) => step.stepId === stepId ? { ...step, label } : step);
}

function layerName(layers: readonly MapModelBuilderLayerOption[], layerId: string, fallback: string): string {
  return layers.find((layer) => layer.id === layerId)?.name ?? (layerId.trim() || fallback);
}

function isMissingLiteral(value: MapModelLiteralValue): boolean {
  return typeof value === "string" ? value.trim().length === 0 : typeof value === "number" && Number.isNaN(value);
}

function bindingLabel(
  binding: MapModelParameterBinding | undefined,
  sourceLayerId: string,
  overlayLayerId: string,
  layers: readonly MapModelBuilderLayerOption[],
  priorSteps: readonly MapModelStep[],
): string {
  if (!binding) return "Unbound";
  if (binding.kind === "source") {
    const layerId = binding.inputId === "overlay" ? overlayLayerId : sourceLayerId;
    const label = binding.inputId === "overlay" ? "Overlay" : "Primary";
    return `${label}: ${layerName(layers, layerId, "missing layer")}`;
  }
  if (binding.kind === "step-output") {
    return `Output: ${priorSteps.find((step) => step.stepId === binding.stepId)?.label ?? binding.stepId}`;
  }
  if (binding.kind === "batch-aoi") return "Batch AOI binding";
  return String(binding.value);
}

function buildStepReadiness(
  step: MapModelStep,
  index: number,
  steps: readonly MapModelStep[],
  descriptor: ProcessingToolDescriptor | undefined,
  sourceLayerId: string,
  overlayLayerId: string,
  layers: readonly MapModelBuilderLayerOption[],
): StepReadiness {
  const reasons: string[] = [];
  const dependencies: string[] = [];
  const priorSteps = steps.slice(0, index);
  const priorStepIds = new Set(priorSteps.map((prior) => prior.stepId));

  if (!descriptor) {
    reasons.push(`Tool "${step.toolId}" is no longer available in the processing registry.`);
  } else if (!descriptor.implemented) {
    reasons.push(`Tool "${descriptor.title}" is registered but not implemented.`);
  } else {
    for (const parameter of descriptor.parameters) {
      const binding = step.parameters[parameter.key];
      dependencies.push(`${parameter.label}: ${bindingLabel(binding, sourceLayerId, overlayLayerId, layers, priorSteps)}`);
      if (!binding) {
        if (parameter.required && parameter.defaultValue === undefined) {
          reasons.push(`Missing required parameter "${parameter.label}".`);
        }
        continue;
      }
      if (binding.kind === "literal") {
        if (parameter.required && isMissingLiteral(binding.value)) {
          reasons.push(`Set a value for "${parameter.label}".`);
        }
        if (parameter.type === "layer") {
          reasons.push(`Layer parameter "${parameter.label}" must use a source input or earlier step output.`);
        }
      }
      if (binding.kind === "source") {
        const layerId = binding.inputId === "overlay" ? overlayLayerId : binding.inputId === "source" ? sourceLayerId : "";
        if (!layerId || !layers.some((layer) => layer.id === layerId)) {
          reasons.push(`Layer parameter "${parameter.label}" references missing ${binding.inputId} input.`);
        }
      }
      if (binding.kind === "step-output" && !priorStepIds.has(binding.stepId)) {
        reasons.push(`Layer parameter "${parameter.label}" must reference an earlier step output.`);
      }
      if (binding.kind === "batch-aoi" && parameter.type !== "aoi") {
        reasons.push(`Parameter "${parameter.label}" cannot use a batch AOI binding.`);
      }
      if (binding.kind === "batch-aoi" && parameter.type === "aoi") {
        reasons.push(`Parameter "${parameter.label}" requires a batch AOI target before execution.`);
      }
    }
  }

  return {
    step,
    descriptor: descriptor ?? null,
    index,
    status: reasons.length > 0 ? "blocked" : "ready",
    reasons,
    dependencies,
    outputLabel: `${step.label || descriptor?.title || step.toolId} output`,
  };
}

function renderList(values: readonly string[], testId: string): ReactNode {
  return (
    <ul className={styles.reasonList} data-testid={testId}>
      {values.map((value) => <li key={value}>{value}</li>)}
    </ul>
  );
}

function bindingToken(binding: MapModelParameterBinding | undefined): string {
  if (!binding) return "";
  if (binding.kind === "source") return `source:${binding.inputId}`;
  if (binding.kind === "step-output") return `step:${binding.stepId}`;
  if (binding.kind === "batch-aoi") return "batch-aoi";
  return String(binding.value);
}

function literalValue(binding: MapModelParameterBinding | undefined): MapModelLiteralValue {
  return binding?.kind === "literal" ? binding.value : "";
}

function updateParameter(
  steps: readonly MapModelStep[],
  stepId: string,
  key: string,
  binding: MapModelParameterBinding,
): MapModelStep[] {
  return steps.map((step) => step.stepId === stepId
    ? { ...step, parameters: { ...step.parameters, [key]: binding } }
    : step);
}

export function MapModelBuilderPanel({
  visible,
  onClose,
  tools,
  layers,
  onRun,
  onRunBatch,
  onExportToIdeAndUrban,
  presentation = "floating",
}: MapModelBuilderPanelProps): ReactElement | null {
  const implementedTools = useMemo(() => tools.filter((tool) => tool.implemented), [tools]);
  const [title, setTitle] = useState("Transit access coverage");
  const [sourceLayerId, setSourceLayerId] = useState("");
  const [overlayLayerId, setOverlayLayerId] = useState("");
  const [selectedToolId, setSelectedToolId] = useState("buffer");
  const [steps, setSteps] = useState<MapModelStep[]>([]);
  const [savedModel, setSavedModel] = useState<MapSavedModel | null>(null);
  const [lastRun, setLastRun] = useState<MapModelRunResult | null>(null);
  const [lastSavedRunHash, setLastSavedRunHash] = useState<string | null>(null);
  const [batchLayerIds, setBatchLayerIds] = useState<string[]>([]);
  const [batchResult, setBatchResult] = useState<MapModelBatchResult | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  useEffect(() => {
    if (layers.length === 0) return;
    setSourceLayerId((current) => layers.some((layer) => layer.id === current) ? current : layers[0]!.id);
    setOverlayLayerId((current) => layers.some((layer) => layer.id === current) ? current : (layers[1]?.id ?? layers[0]!.id));
  }, [layers]);

  useEffect(() => {
    if (!implementedTools.some((tool) => tool.toolId === selectedToolId)) {
      setSelectedToolId(implementedTools[0]?.toolId ?? "");
    }
  }, [implementedTools, selectedToolId]);

  useEffect(() => {
    if (steps.length === 0) {
      setSelectedStepId(null);
      return;
    }
    if (!steps.some((step) => step.stepId === selectedStepId)) {
      setSelectedStepId(steps[0]!.stepId);
    }
  }, [selectedStepId, steps]);

  if (!visible) return null;

  const buildDefinition = (): MapModelDefinition => ({
    version: 1,
    modelId: slug(title),
    title: title.trim() || "Untitled model",
    inputs: [
      { inputId: "source", label: "Primary source", layerId: sourceLayerId },
      { inputId: "overlay", label: "Overlay source", layerId: overlayLayerId },
    ],
    steps,
  });

  const addStep = (): void => {
    const descriptor = implementedTools.find((tool) => tool.toolId === selectedToolId);
    if (!descriptor) return;
    setSteps((current) => {
      const index = nextStepIndex(current);
      const step = defaultStep(descriptor, index - 1, current[current.length - 1]?.stepId ?? null);
      setSelectedStepId(step.stepId);
      return [...current, step];
    });
  };

  const removeStep = (stepId: string): void => {
    const nextSelected = steps.find((entry) => entry.stepId !== stepId)?.stepId ?? null;
    setSteps((current) => current.filter((entry) => entry.stepId !== stepId));
    if (selectedStepId === stepId) setSelectedStepId(nextSelected);
  };

  const runDefinition = (definition: MapModelDefinition): void => {
    setBatchResult(null);
    setLastRun(onRun(definition));
  };

  const handleSave = (): void => {
    const saved = saveMapModel(buildDefinition());
    setSavedModel(saved);
    const result = onRun(saved.definition);
    setLastRun(result);
    setLastSavedRunHash(result.manifestHash);
    setBatchResult(null);
  };

  const handleRerun = (): void => {
    if (!savedModel) return;
    setBatchResult(null);
    setLastRun(onRun(savedModel.definition));
  };

  const handleBatch = (): void => {
    const targets = batchLayerIds.map((layerId) => ({
      targetId: `batch-${layerId}`,
      label: layers.find((layer) => layer.id === layerId)?.name ?? layerId,
      layerBindings: { source: layerId },
    }));
    const result = onRunBatch(buildDefinition(), targets);
    setBatchResult(result);
    const lastApplied = [...result.results].reverse().find((entry) => entry.result.status === "applied");
    if (lastApplied) setLastRun(lastApplied.result);
  };

  const stepReadiness = steps.map((step, index) => buildStepReadiness(
    step,
    index,
    steps,
    implementedTools.find((tool) => tool.toolId === step.toolId),
    sourceLayerId,
    overlayLayerId,
    layers,
  ));
  const blockedSteps = stepReadiness.filter((entry) => entry.status === "blocked");
  const modelBlockers = [
    ...(layers.length === 0 ? ["Add at least one map layer before running the model."] : []),
    ...(sourceLayerId.length > 0 ? [] : ["Select a primary source layer."]),
    ...(overlayLayerId.length > 0 ? [] : ["Select an overlay source layer."]),
    ...(steps.length > 0 ? [] : ["Add at least one processing step."]),
    ...blockedSteps.flatMap((entry) => entry.reasons.map((reason) => `${entry.step.label}: ${reason}`)),
  ];
  const canRun = modelBlockers.length === 0;
  const draftDefinition = buildDefinition();
  const selectedStep = steps.find((step) => step.stepId === selectedStepId) ?? null;
  const selectedDescriptor = selectedStep ? implementedTools.find((tool) => tool.toolId === selectedStep.toolId) : undefined;
  const selectedIndex = selectedStep ? steps.findIndex((step) => step.stepId === selectedStep.stepId) : -1;
  const selectedPriorSteps = selectedIndex >= 0 ? steps.slice(0, selectedIndex) : [];
  const runDisabledReason = modelBlockers[0] ?? "Ready to run.";
  const runProgress = lastRun ? Math.round((lastRun.stepRuns.length / Math.max(steps.length, 1)) * 100) : 0;
  const batchProgress = batchResult ? Math.round((batchResult.results.length / Math.max(batchLayerIds.length, 1)) * 100) : 0;
  const outputLabel = `${draftDefinition.title} · result`;
  const deterministicRerun = Boolean(
    savedModel
    && lastSavedRunHash
    && lastRun?.manifestHash
    && lastSavedRunHash === lastRun.manifestHash,
  );

  return (
    <section
      className={presentation === "embedded" ? `${styles.panel} ${styles.panelEmbedded}` : styles.panel}
      role={presentation === "embedded" ? "region" : "dialog"}
      aria-label="Model builder"
      data-testid="map-model-builder"
      data-presentation={presentation}
    >
      <header className={styles.header}>
        <h2><GitBranch size={16} aria-hidden /> Model builder</h2>
        <div className={styles.headerChips} aria-label="Model builder readiness">
          <span
            className={styles.readinessLine}
            data-status={canRun ? "ready" : "blocked"}
            data-testid="model-readiness"
          >
            {canRun ? "All steps ready" : "Blocked"}
          </span>
          <span className={styles.stepCount}>{steps.length} step{steps.length === 1 ? "" : "s"}</span>
        </div>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close model builder">
          <X size={16} aria-hidden />
        </button>
      </header>

      <div className={styles.body}>
        <section className={styles.configuration} aria-label="Model builder workflow" data-left-workspace-layout="single-column">
          <div className={styles.definitionBar} data-testid="model-section-define">
            <GisSectionHeader title="Define" level={4} compact separator={false} />
            <label className={styles.field}>
              <span>Model name</span>
              <input data-testid="model-name" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Primary source</span>
              <select data-testid="model-source-input" value={sourceLayerId} onChange={(event) => setSourceLayerId(event.target.value)}>
                {layers.length === 0 ? <option value="">No layer available</option> : null}
                {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Overlay source</span>
              <select data-testid="model-overlay-input" value={overlayLayerId} onChange={(event) => setOverlayLayerId(event.target.value)}>
                {layers.length === 0 ? <option value="">No layer available</option> : null}
                {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.addStepRow} data-testid="model-section-steps">
            <GisSectionHeader title="Steps" level={4} compact separator={false} badge={<span>{steps.length} step{steps.length === 1 ? "" : "s"}</span>} />
            <label className={styles.field}>
              <span>Add processing step</span>
              <select data-testid="model-add-tool" value={selectedToolId} onChange={(event) => setSelectedToolId(event.target.value)}>
                {implementedTools.map((tool) => <option key={tool.toolId} value={tool.toolId}>{tool.title}</option>)}
              </select>
            </label>
            <button type="button" className={styles.secondaryButton} data-testid="model-add-step" onClick={addStep} disabled={!selectedToolId}>
              Add step
            </button>
          </div>

          <div className={styles.workflowGrid} data-testid="model-section-workflow">
            <section className={styles.stepGraph} aria-label="Model step graph">
              <div className={styles.sectionTitleRow}>
                <GisSectionHeader title="Workflow graph" level={4} compact separator={false} />
                <span className={styles.readinessLine} data-status={blockedSteps.length === 0 ? "ready" : "blocked"}>
                  {blockedSteps.length === 0 ? "All steps ready" : `${blockedSteps.length} blocked`}
                </span>
              </div>
              <div className={styles.stepList} data-testid="model-step-list">
                {steps.length === 0 ? <p className={styles.empty}>Add a processing step to construct an ordered model.</p> : null}
                {stepReadiness.map((entry) => (
                  <article
                    className={`${styles.step} ${entry.step.stepId === selectedStepId ? styles.stepSelected : ""}`}
                    key={entry.step.stepId}
                    data-testid={`model-step-${entry.step.toolId}`}
                    data-status={entry.status}
                  >
                    <div className={styles.stepHeaderRow}>
                      <button
                        type="button"
                        className={styles.stepSelect}
                        onClick={() => setSelectedStepId(entry.step.stepId)}
                        aria-pressed={entry.step.stepId === selectedStepId}
                      >
                        <span className={styles.stepIndex}>{String(entry.index + 1).padStart(2, "0")}</span>
                        <span className={styles.stepMain}>
                          <strong>{entry.step.label}</strong>
                          <small>{entry.descriptor?.summary ?? entry.step.toolId}</small>
                        </span>
                        <span
                          className={styles.readinessLine}
                          data-status={entry.status === "ready" ? "ready" : "blocked"}
                          data-testid={`model-step-status-${entry.step.stepId}`}
                        >
                          {entry.status === "ready" ? "Ready" : "Blocked"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeStep(entry.step.stepId)}
                        aria-label={`Remove ${entry.step.label} step`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className={styles.stepMeta}>
                      <span className={styles.role}>{entry.index === steps.length - 1 ? "final output" : "passes output"}</span>
                      <span>{entry.outputLabel}</span>
                    </div>
                    {entry.reasons.length > 0 ? renderList(entry.reasons, `model-step-blockers-${entry.step.stepId}`) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.stepEditor} aria-label="Selected step editor" data-testid="model-step-editor">
              <div className={styles.sectionTitleRow}>
                <GisSectionHeader title="Selected step editor" level={4} compact separator={false} />
                {selectedStep ? <GisStatusChip status={blockedSteps.some((entry) => entry.step.stepId === selectedStep.stepId) ? "blocked" : "ready"} label={selectedStep.stepId} density="compact" /> : null}
              </div>
              {selectedStep && selectedDescriptor ? (
                <>
                  <label className={styles.field}>
                    <span>Step label</span>
                    <input
                      data-testid={`model-step-label-${selectedStep.stepId}`}
                      value={selectedStep.label}
                      onChange={(event) => setSteps((current) => updateStepLabel(current, selectedStep.stepId, event.target.value))}
                    />
                  </label>
                  <GisPropertyGrid
                    density="compact"
                    rows={[
                      { key: "Tool", value: selectedDescriptor.title },
                      { key: "Execution", value: selectedDescriptor.executionMode },
                      {
                        key: "CRS gate",
                        value: selectedDescriptor.requiresCrs ? "Projected CRS required" : "No CRS gate",
                        ...(selectedDescriptor.requiresCrs ? { highlight: "warn" as const } : {}),
                      },
                      { key: "QA", value: selectedDescriptor.qaGated ? "QA-gated" : "No QA gate" },
                    ]}
                  />
                  <div className={styles.parameters}>
                    {selectedDescriptor.parameters.map((parameter) => (
                      <label key={parameter.key} className={styles.field}>
                        <span>{parameter.label}</span>
                        {parameter.type === "layer" ? (
                          <select
                            data-testid={`model-param-${selectedStep.stepId}-${parameter.key}`}
                            value={bindingToken(selectedStep.parameters[parameter.key])}
                            onChange={(event) => {
                              const [kind, id] = event.target.value.split(":");
                              setSteps((current) => updateParameter(
                                current,
                                selectedStep.stepId,
                                parameter.key,
                                kind === "step"
                                  ? { kind: "step-output", stepId: id ?? "" }
                                  : { kind: "source", inputId: id ?? "source" },
                              ));
                            }}
                          >
                            <option value="source:source">Primary source</option>
                            <option value="source:overlay">Overlay source</option>
                            {selectedPriorSteps.map((prior) => (
                              <option key={prior.stepId} value={`step:${prior.stepId}`}>Output: {prior.label}</option>
                            ))}
                          </select>
                        ) : parameter.type === "boolean" ? (
                          <input
                            type="checkbox"
                            checked={literalValue(selectedStep.parameters[parameter.key]) === true}
                            onChange={(event) => setSteps((current) => updateParameter(current, selectedStep.stepId, parameter.key, { kind: "literal", value: event.target.checked }))}
                          />
                        ) : parameter.type === "enum" ? (
                          <select
                            value={String(literalValue(selectedStep.parameters[parameter.key]))}
                            onChange={(event) => setSteps((current) => updateParameter(current, selectedStep.stepId, parameter.key, { kind: "literal", value: event.target.value }))}
                          >
                            {(parameter.enumValues ?? []).map((value) => <option key={value} value={value}>{value}</option>)}
                          </select>
                        ) : parameter.type === "aoi" ? (
                          <select disabled value="batch-aoi" aria-label={`${parameter.label} uses batch AOI binding`}>
                            <option value="batch-aoi">Batch AOI binding</option>
                          </select>
                        ) : (
                          <input
                            type={parameter.type === "number" ? "number" : "text"}
                            value={String(literalValue(selectedStep.parameters[parameter.key]))}
                            onChange={(event) => {
                              const value: MapModelLiteralValue = parameter.type === "number"
                                ? Number(event.target.value)
                                : event.target.value;
                              setSteps((current) => updateParameter(current, selectedStep.stepId, parameter.key, { kind: "literal", value }));
                            }}
                          />
                        )}
                        {parameter.help ? <small className={styles.helpText}>{parameter.help}</small> : null}
                      </label>
                    ))}
                  </div>
                  <div className={styles.dependencyList}>
                    {buildStepReadiness(selectedStep, selectedIndex, steps, selectedDescriptor, sourceLayerId, overlayLayerId, layers).dependencies.map((dependency) => (
                      <span key={dependency}>{dependency}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.empty}>Select or add a step to edit its bindings.</p>
              )}
            </section>
          </div>

          <section className={styles.runRail} aria-label="Model run and publication">
            <section className={styles.runPreview} aria-label="Run preview" data-testid="model-run-preview" data-model-flow-section="run-preview">
            <div className={styles.sectionTitleRow}>
              <GisSectionHeader title="Run preview" level={4} compact separator={false} badge={<CheckCircle2 size={13} aria-hidden />} />
              <span className={styles.readinessLine} data-status={canRun ? "ready" : "blocked"}>
                {canRun ? "Executable" : "Needs input"}
              </span>
            </div>
            <GisPropertyGrid
              density="compact"
              rows={[
                { key: "Model ID", value: draftDefinition.modelId },
                {
                  key: "Inputs",
                  value: `${layerName(layers, sourceLayerId, "missing primary")} + ${layerName(layers, overlayLayerId, "missing overlay")}`,
                  ...(sourceLayerId && overlayLayerId ? {} : { highlight: "warn" as const }),
                },
                {
                  key: "Chain",
                  value: `${steps.length} step${steps.length === 1 ? "" : "s"}, ${blockedSteps.length} blocked`,
                  ...(blockedSteps.length > 0 ? { highlight: "warn" as const } : {}),
                },
                { key: "Output", value: outputLabel },
              ]}
            />
            <GisProgressBar value={runProgress} label="Model run progress" data-testid="model-run-progress" />
            {modelBlockers.length > 0 ? renderList(modelBlockers, "model-blocking-reasons") : <p className={styles.readyText}>Chain is ready for deterministic execution.</p>}
          </section>

            <div className={styles.actions} data-model-flow-section="run-actions">
              <GisSectionHeader title="Run controls" level={4} compact separator={false} />
              <button type="button" className={styles.primaryButton} disabled={!canRun} onClick={() => runDefinition(buildDefinition())} data-testid="model-run" title={!canRun ? runDisabledReason : undefined}>
                <Play size={13} aria-hidden /> Run model
              </button>
              <button type="button" className={styles.secondaryButton} disabled={!canRun} onClick={handleSave} data-testid="model-save" title={!canRun ? runDisabledReason : undefined}>
                <Save size={13} aria-hidden /> Save and run
              </button>
              <button type="button" className={styles.secondaryButton} disabled={!savedModel} onClick={handleRerun} data-testid="model-rerun">
                Rerun saved
              </button>
            </div>

            <section className={styles.batch} aria-label="Batch targets" data-testid="model-section-batch" data-model-flow-section="batch-targets">
            <div className={styles.sectionTitleRow}>
              <GisSectionHeader title="Batch targets" level={4} compact separator={false} badge={<Layers3 size={13} aria-hidden />} />
              <span className={styles.stepCount}>{batchLayerIds.length} selected</span>
            </div>
            <p>Run this template against selected layer inputs. Each output retains a separate manifest.</p>
            <GisProgressBar value={batchProgress} label="Batch run progress" data-testid="model-batch-progress" />
            <div className={styles.batchLayers}>
              {layers.map((layer) => (
                <label key={layer.id}>
                  <input
                    type="checkbox"
                    data-testid={`model-batch-layer-${layer.id}`}
                    checked={batchLayerIds.includes(layer.id)}
                    onChange={(event) => setBatchLayerIds((current) => event.target.checked
                      ? [...current, layer.id]
                      : current.filter((id) => id !== layer.id))}
                  />
                  <span>{layer.name}</span>
                </label>
              ))}
              {layers.length === 0 ? <span className={styles.empty}>No layer targets are available.</span> : null}
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={!canRun || batchLayerIds.length === 0}
              onClick={handleBatch}
              data-testid="model-run-batch"
              title={!canRun ? runDisabledReason : batchLayerIds.length === 0 ? "Select at least one batch target." : undefined}
            >
              Run batch ({batchLayerIds.length})
            </button>
            {batchResult ? (
              <section className={batchResult.status === "applied" ? styles.result : styles.blocked} data-testid="model-batch-result" data-status={batchResult.status}>
                <GisSectionHeader title={`Batch ${batchResult.status}`} level={4} compact separator={false} />
                <span>{batchResult.results.filter((entry) => entry.result.status === "applied").length} output(s) applied</span>
                {batchResult.blockers.length > 0 ? renderList(batchResult.blockers, "model-batch-blockers") : null}
              </section>
            ) : null}
          </section>

            {lastRun ? (
              <section className={lastRun.status === "applied" ? styles.result : styles.blocked} aria-label="Output and evidence" data-testid="model-run-result" data-status={lastRun.status} data-model-flow-section="output-evidence">
              <GisSectionHeader
                title={lastRun.status === "applied" ? "Output and evidence" : "Model blocked"}
                level={4}
                compact
                separator={false}
                badge={<FileCode2 size={13} aria-hidden />}
              />
              {lastRun.status === "applied" ? (
                <>
                  <GisPropertyGrid
                    density="compact"
                    rows={[
                      { key: "Output layer", value: <span data-testid="model-output-layer">{lastRun.finalOutputLayer?.name}</span>, highlight: "success" },
                      { key: "Artifact label", value: `${lastRun.model.title} final model result` },
                      { key: "Workflow", value: lastRun.manifest?.workflowId ?? "Missing manifest" },
                    ]}
                  />
                  <code data-testid="model-manifest-hash">hash: {lastRun.manifestHash}</code>
                  {deterministicRerun ? <span data-testid="model-determinism">Saved rerun identical</span> : null}
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={() => onExportToIdeAndUrban(lastRun, batchResult)}
                    data-testid="model-export"
                    aria-label={`Export ${lastRun.model.title} final model result to IDE and Urban evidence`}
                  >
                    <Braces size={13} aria-hidden /> Export final result to IDE + Urban
                  </button>
                </>
              ) : (
                renderList(lastRun.blockers, "model-run-blockers")
              )}
              </section>
            ) : (
              <section className={styles.outputPlaceholder} aria-label="Output and evidence" data-testid="model-output-evidence" data-model-flow-section="output-evidence">
                <GisSectionHeader title="Output and evidence" level={4} compact separator={false} badge={<FileCode2 size={13} aria-hidden />} />
                <p>Run the chain to create a derived layer, model manifest, IDE workflow script request, and Urban evidence handoff label.</p>
                {modelBlockers.length > 0 ? <span><AlertTriangle size={12} aria-hidden /> Resolve blocked steps before export.</span> : <span>Artifact label: {outputLabel}</span>}
              </section>
            )}
          </section>
        </section>
      </div>
    </section>
  );
}
