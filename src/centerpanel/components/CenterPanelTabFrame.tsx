import React from "react";
import styles from "../styles/centerpanel.module.css";

interface CenterPanelTabFrameProps {
  activeTab: string;
  outlineAriaLabel: string;
  outlineClassName?: string;
  panelId?: string;
  railContent: React.ReactNode;
  mainContent: React.ReactNode;
}

function getPanelId(activeTab: string): string {
  return `panel-${activeTab.toLowerCase().replace(/\s+/g, "-")}`;
}

function getTabId(activeTab: string): string {
  return `tab-${activeTab.toLowerCase().replace(/\s+/g, "-")}`;
}

export function CenterPanelTabFrame({
  activeTab,
  outlineAriaLabel,
  outlineClassName,
  panelId,
  railContent,
  mainContent,
}: CenterPanelTabFrameProps): React.ReactElement {
  const resolvedPanelId = panelId ?? getPanelId(activeTab);

  return (
    <>
      <nav
        key={activeTab}
        className={`${styles.outline} ${outlineClassName ?? ""} noPrint ${styles.panelEnter}`.trim()}
        aria-label={outlineAriaLabel}
        data-testid="cp-outline"
      >
        {railContent}
      </nav>
      <main id="cp3-main-scroll-root" className={styles.main} role="main" data-testid="cp-main">
        <section
          key={activeTab}
          className={styles.panelEnter}
          id={resolvedPanelId}
          role="tabpanel"
          aria-labelledby={getTabId(activeTab)}
        >
          {mainContent}
        </section>
      </main>
    </>
  );
}