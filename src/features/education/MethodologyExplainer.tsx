import React, { useMemo, useState } from "react";
import katex from "katex";
import { CircleHelp, ExternalLink } from "lucide-react";
import flowStyles from "../../centerpanel/styles/flows.module.css";
import styles from "./education.module.css";
import { getMethodologyExplainer } from "./methodologyData";
import { dispatchCenterPanelNavigation, openEducationWorkspace } from "./navigation";
import type { LearningPathId, MethodologyExplainerId } from "./types";
import "katex/dist/katex.min.css";

interface FormulaBlockProps {
  label: string;
  latex: string;
}

function FormulaBlock({ label, latex }: FormulaBlockProps): React.ReactElement {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: true,
        output: "html",
        throwOnError: false,
        strict: "warn",
      }),
    [latex],
  );

  return (
    <div className={styles.formulaBlock}>
      <div className={styles.formulaLabel}>{label}</div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export interface MethodologyExplainerCardProps {
  explainerId: MethodologyExplainerId;
  pathId?: LearningPathId | undefined;
  onRelatedSelect?: (explainerId: MethodologyExplainerId) => void;
}

export function MethodologyExplainerCard({
  explainerId,
  pathId,
  onRelatedSelect,
}: MethodologyExplainerCardProps): React.ReactElement | null {
  const explainer = getMethodologyExplainer(explainerId);
  if (!explainer) {
    return null;
  }

  return (
    <article className={styles.explainerCard}>
      <div className={styles.explainerHeader}>
        <div>
          <div className={styles.sectionTitle}>{explainer.title}</div>
          <div className={styles.muted}>{explainer.shortDefinition}</div>
        </div>
        <div className={styles.chipRow}>
          {explainer.relatedPathIds.map((relatedPathId) => (
            <span key={relatedPathId} className={styles.chip}>
              {relatedPathId.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.subSectionTitle}>Formulas</div>
        {explainer.formulas.map((formula) => (
          <FormulaBlock key={`${explainer.id}-${formula.label}`} label={formula.label} latex={formula.latex} />
        ))}
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.subSectionTitle}>Assumptions</div>
        <ul className={styles.listPlain}>
          {explainer.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.subSectionTitle}>Limitations</div>
        <ul className={styles.listPlain}>
          {explainer.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.subSectionTitle}>Misuse Warnings</div>
        <ul className={styles.listPlain}>
          {explainer.misuseWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.subSectionTitle}>Appropriate Use Cases</div>
        <ul className={styles.listPlain}>
          {explainer.useCases.map((useCase) => (
            <li key={useCase}>{useCase}</li>
          ))}
        </ul>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.subSectionTitle}>Linked Platform Tools</div>
        <div className={styles.smallActionRow}>
          {explainer.linkedTools.map((tool) => (
            <button
              key={`${explainer.id}-${tool.label}`}
              type="button"
              className={flowStyles.outlineBtn}
              onClick={() => dispatchCenterPanelNavigation(tool.target)}
            >
              {tool.label} <ExternalLink size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.smallActionRow}>
        <button
          type="button"
          className={flowStyles.outlineBtn}
          onClick={() => openEducationWorkspace({ view: "paths", explainerId, ...(pathId ? { pathId } : {}) })}
        >
          Open in Education Workspace
        </button>
        {explainer.relatedExplainerIds?.map((relatedExplainerId) => (
          <button
            key={`${explainer.id}-related-${relatedExplainerId}`}
            type="button"
            className={flowStyles.outlineBtn}
            onClick={() => onRelatedSelect?.(relatedExplainerId)}
          >
            Related: {getMethodologyExplainer(relatedExplainerId)?.title ?? relatedExplainerId}
          </button>
        ))}
      </div>
    </article>
  );
}

export interface MethodologyInfoButtonProps {
  explainerId: MethodologyExplainerId;
  pathId?: LearningPathId | undefined;
  label?: string;
}

export function MethodologyInfoButton({
  explainerId,
  pathId,
  label = "Method note",
}: MethodologyInfoButtonProps): React.ReactElement {
  const explainer = getMethodologyExplainer(explainerId);
  const [open, setOpen] = useState(false);

  if (!explainer) {
    return <></>;
  }

  return (
    <>
      <button type="button" className={styles.inlineInfoButton} onClick={() => setOpen(true)}>
        <CircleHelp size={14} />
        {label}
      </button>
      {open ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-label={explainer.title}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.eyebrow}>Methodology explainer</div>
                <div className={styles.heroTitle} style={{ fontSize: 24 }}>
                  {explainer.title}
                </div>
                <div className={styles.heroText}>{explainer.shortDefinition}</div>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Close explainer">
                ×
              </button>
            </div>
            <MethodologyExplainerCard explainerId={explainerId} {...(pathId ? { pathId } : {})} />
          </div>
        </div>
      ) : null}
    </>
  );
}