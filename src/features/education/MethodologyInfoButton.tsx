import React, { Suspense, useState } from "react";
import { CircleHelp } from "lucide-react";

import styles from "./education.module.css";
import { getMethodologyExplainer } from "./methodologyData";
import type { LearningPathId, MethodologyExplainerId } from "./types";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";

const LazyMethodologyExplainerCard = lazyWithRetry(
  () => import("./MethodologyExplainer").then((module) => ({ default: module.MethodologyExplainerCard })),
  { recoveryPath: "/" },
);

export interface MethodologyInfoButtonProps {
  explainerId: MethodologyExplainerId;
  pathId?: LearningPathId | undefined;
  label?: string;
}

function MethodologyExplainerFallback(): React.ReactElement {
  return (
    <div className={styles.controlGroup} role="status" aria-live="polite">
      Loading methodology explainer...
    </div>
  );
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
            <ChunkLoadBoundary compact title="Methodology explainer unavailable" message="Retry or open the Education workspace to inspect the full explainer.">
              <Suspense fallback={<MethodologyExplainerFallback />}>
                <LazyMethodologyExplainerCard explainerId={explainerId} {...(pathId ? { pathId } : {})} />
              </Suspense>
            </ChunkLoadBoundary>
          </div>
        </div>
      ) : null}
    </>
  );
}
