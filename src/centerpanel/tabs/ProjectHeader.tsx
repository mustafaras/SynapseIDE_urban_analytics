import React from "react";
import styles from "../styles/project-header.module.css";

export interface ProjectHeaderProps {

  projectName: string;
  projectId?: string;
  ageSexLabel?: string;
  tagBadges?: string[];


  sessionLabel?: string;
  lastUpdatedLabel: string;
  snapshotInfo?: string;


  autosaveLabel?: string;
  actionsNode?: React.ReactNode;


  safetyAlertText?: string;
  safetyAlertSeverity?: "med" | "high";


  belowNode?: React.ReactNode;
}

export default function ProjectHeader(props: ProjectHeaderProps) {
  const {
    projectName,
    projectId,
    ageSexLabel,
    tagBadges = [],
    sessionLabel,
    lastUpdatedLabel,
    snapshotInfo,
    autosaveLabel,
    actionsNode,
    safetyAlertText,
    safetyAlertSeverity,
    belowNode,
  } = props;

  const alertStyle: React.CSSProperties | undefined = safetyAlertText
    ? {
        backgroundColor:
          safetyAlertSeverity === "high"
            ? "var(--risk-high-bg)"
            : "var(--risk-med-bg)",
        color:
          safetyAlertSeverity === "high"
            ? "var(--risk-high-fg)"
            : "var(--risk-med-fg)",
      }
    : undefined;


  const rootRef = React.useRef<HTMLDivElement | null>(null);
  React.useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const setVar = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      try {
        document.documentElement.style.setProperty("--projectHeaderHeight", `${h}px`);
      } catch {}
    };
    setVar();
    let ro: ResizeObserver | undefined;
    try {
      ro = new ResizeObserver(() => setVar());
      ro.observe(el);
    } catch {

    }
    window.addEventListener("resize", setVar);
    return () => {
      window.removeEventListener("resize", setVar);
      try { ro?.disconnect(); } catch {}
    };
  }, []);

  return (
    <div ref={rootRef} className={`${styles.headerWrap} ${styles.projectHeaderWrap}`} role="region" aria-label="Project header">
      <div className={styles.headerRow}>
        {}
        <div className={styles.zoneLeft}>
          <span className={styles.hName}>{projectName || "Project"}</span>
          {!!projectId && <span className={styles.headerPill} title="Project ID">{String(projectId)}</span>}
          {!!ageSexLabel && <span className={styles.headerPill}>{String(ageSexLabel)}</span>}
          {tagBadges.map((t) => (
            <span key={t} className={styles.headerPill} aria-label="Tag">
              {String(t)}
            </span>
          ))}
        </div>

        {}
        <div className={styles.zoneCenter}>
          {!!sessionLabel && <span className={styles.metaTextLocal}>{String(sessionLabel)}</span>}
          <span className={styles.metaTextLocal}>{String(lastUpdatedLabel)}</span>
          {!!snapshotInfo && <span className={styles.metaTextLocal}>{String(snapshotInfo)}</span>}
        </div>

        {}
        <div className={styles.zoneRight}>
          {!!autosaveLabel && <span className={styles.metaTextLocal}>{String(autosaveLabel)}</span>}
          {!!actionsNode && <div className={styles.actions}>{actionsNode}</div>}
        </div>
      </div>

      {!!safetyAlertText && (
        <div className={styles.projectHeaderAlert} style={alertStyle} role="alert" aria-live="polite">
          {String(safetyAlertText)}
        </div>
      )}
      {belowNode ? (
        <div>{belowNode}</div>
      ) : null}
    </div>
  );
}
