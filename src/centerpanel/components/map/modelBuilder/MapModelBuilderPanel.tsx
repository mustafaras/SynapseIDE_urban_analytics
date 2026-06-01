import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Braces, GitBranch, Layers3, Play, Save, X } from "lucide-react";
import type { ProcessingToolDescriptor, ToolParameterDescriptor } from "@/services/map/contracts/gisContracts";
import {
  saveMapModel,
  type MapModelBatchResult,
  type MapModelBatchTarget,
  type MapModelDefinition,
  type MapModelLiteralValue,
  type MapModelParameterBinding,
  type MapModelRunResult,
  type MapModelStep,
  type MapSavedModel,
} from "@/services/map/model";
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
    setSteps((current) => [
      ...current,
      defaultStep(descriptor, current.length, current[current.length - 1]?.stepId ?? null),
    ]);
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

  const canRun = sourceLayerId.length > 0 && overlayLayerId.length > 0 && steps.length > 0;
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
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close model builder">
          <X size={16} aria-hidden />
        </button>
      </header>

      <div className={styles.body}>
        <section className={styles.configuration} aria-label="Model definition">
          <label className={styles.field}>
            <span>Model name</span>
            <input data-testid="model-name" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <div className={styles.inputGrid}>
            <label className={styles.field}>
              <span>Primary source</span>
              <select data-testid="model-source-input" value={sourceLayerId} onChange={(event) => setSourceLayerId(event.target.value)}>
                {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Overlay source</span>
              <select data-testid="model-overlay-input" value={overlayLayerId} onChange={(event) => setOverlayLayerId(event.target.value)}>
                {layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.addStepRow}>
            <label className={styles.field}>
              <span>Add processing step</span>
              <select data-testid="model-add-tool" value={selectedToolId} onChange={(event) => setSelectedToolId(event.target.value)}>
                {implementedTools.map((tool) => <option key={tool.toolId} value={tool.toolId}>{tool.title}</option>)}
              </select>
            </label>
            <button type="button" className={styles.secondaryButton} data-testid="model-add-step" onClick={addStep}>
              Add step
            </button>
          </div>

          <div className={styles.stepList} data-testid="model-step-list">
            {steps.length === 0 ? <p className={styles.empty}>Add a processing step to construct an ordered model.</p> : null}
            {steps.map((step, stepIndex) => {
              const descriptor = implementedTools.find((tool) => tool.toolId === step.toolId);
              if (!descriptor) return null;
              const priorSteps = steps.slice(0, stepIndex);
              return (
                <article className={styles.step} key={step.stepId} data-testid={`model-step-${step.toolId}`}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepIndex}>{String(stepIndex + 1).padStart(2, "0")}</span>
                    <strong>{descriptor.title}</strong>
                    <span className={styles.role}>{stepIndex === steps.length - 1 ? "final" : "intermediate"}</span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => setSteps((current) => current.filter((entry) => entry.stepId !== step.stepId))}
                      aria-label={`Remove ${descriptor.title} step`}
                    >
                      Remove
                    </button>
                  </div>
                  <div className={styles.parameters}>
                    {descriptor.parameters.map((parameter) => (
                      <label key={parameter.key} className={styles.field}>
                        <span>{parameter.label}</span>
                        {parameter.type === "layer" ? (
                          <select
                            data-testid={`model-param-${step.stepId}-${parameter.key}`}
                            value={bindingToken(step.parameters[parameter.key])}
                            onChange={(event) => {
                              const [kind, id] = event.target.value.split(":");
                              setSteps((current) => updateParameter(
                                current,
                                step.stepId,
                                parameter.key,
                                kind === "step"
                                  ? { kind: "step-output", stepId: id ?? "" }
                                  : { kind: "source", inputId: id ?? "source" },
                              ));
                            }}
                          >
                            <option value="source:source">Primary source</option>
                            <option value="source:overlay">Overlay source</option>
                            {priorSteps.map((prior) => (
                              <option key={prior.stepId} value={`step:${prior.stepId}`}>Output: {prior.label}</option>
                            ))}
                          </select>
                        ) : parameter.type === "boolean" ? (
                          <input
                            type="checkbox"
                            checked={literalValue(step.parameters[parameter.key]) === true}
                            onChange={(event) => setSteps((current) => updateParameter(current, step.stepId, parameter.key, { kind: "literal", value: event.target.checked }))}
                          />
                        ) : parameter.type === "enum" ? (
                          <select
                            value={String(literalValue(step.parameters[parameter.key]))}
                            onChange={(event) => setSteps((current) => updateParameter(current, step.stepId, parameter.key, { kind: "literal", value: event.target.value }))}
                          >
                            {(parameter.enumValues ?? []).map((value) => <option key={value} value={value}>{value}</option>)}
                          </select>
                        ) : parameter.type === "aoi" ? (
                          <select disabled value="batch-aoi">
                            <option value="batch-aoi">Batch AOI binding</option>
                          </select>
                        ) : (
                          <input
                            type={parameter.type === "number" ? "number" : "text"}
                            value={String(literalValue(step.parameters[parameter.key]))}
                            onChange={(event) => {
                              const value: MapModelLiteralValue = parameter.type === "number"
                                ? Number(event.target.value)
                                : event.target.value;
                              setSteps((current) => updateParameter(current, step.stepId, parameter.key, { kind: "literal", value }));
                            }}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className={styles.runRail} aria-label="Model run and publication">
          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton} disabled={!canRun} onClick={() => runDefinition(buildDefinition())} data-testid="model-run">
              <Play size={13} aria-hidden /> Run model
            </button>
            <button type="button" className={styles.secondaryButton} disabled={!canRun} onClick={handleSave} data-testid="model-save">
              <Save size={13} aria-hidden /> Save and run
            </button>
            <button type="button" className={styles.secondaryButton} disabled={!savedModel} onClick={handleRerun} data-testid="model-rerun">
              Rerun saved
            </button>
          </div>

          <section className={styles.batch}>
            <h3><Layers3 size={13} aria-hidden /> Batch primary source</h3>
            <p>Run this template against selected layer inputs. Each output retains a separate manifest.</p>
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
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={!canRun || batchLayerIds.length === 0}
              onClick={handleBatch}
              data-testid="model-run-batch"
            >
              Run batch ({batchLayerIds.length})
            </button>
          </section>

          {lastRun ? (
            <section className={lastRun.status === "applied" ? styles.result : styles.blocked} data-testid="model-run-result" data-status={lastRun.status}>
              <h3>{lastRun.status === "applied" ? "Model applied" : "Model blocked"}</h3>
              {lastRun.status === "applied" ? (
                <>
                  <span data-testid="model-output-layer">{lastRun.finalOutputLayer?.name}</span>
                  <code data-testid="model-manifest-hash">hash: {lastRun.manifestHash}</code>
                  {deterministicRerun ? <span data-testid="model-determinism">Saved rerun identical</span> : null}
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={() => onExportToIdeAndUrban(lastRun, batchResult)}
                    data-testid="model-export"
                  >
                    <Braces size={13} aria-hidden /> Export to IDE + Urban evidence
                  </button>
                </>
              ) : (
                lastRun.blockers.map((blocker) => <span key={blocker}>{blocker}</span>)
              )}
            </section>
          ) : null}

          {batchResult ? (
            <section className={batchResult.status === "applied" ? styles.result : styles.blocked} data-testid="model-batch-result" data-status={batchResult.status}>
              <h3>Batch {batchResult.status}</h3>
              <span>{batchResult.results.filter((entry) => entry.result.status === "applied").length} output(s) applied</span>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
