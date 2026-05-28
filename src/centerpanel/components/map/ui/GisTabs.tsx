/**
 * Prompt 36 — accessible tab set primitive.
 * Uses role="tablist" / role="tab" / role="tabpanel" per ARIA authoring practices.
 * Arrow-key navigation between tabs is handled internally.
 */
import React, { useCallback, useRef } from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
} from "../mapTokens";

export interface GisTab {
  id: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
}

export interface GisTabsProps {
  tabs: GisTab[];
  activeId: string;
  onTabChange: (id: string) => void;
  "aria-label": string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  "data-testid"?: string;
  /** Prefix for per-tab data-testid attributes: `${tabTestIdPrefix}-${tab.id}` */
  tabTestIdPrefix?: string;
}

const tabListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-end",
  borderBottom: MAP_STROKES.hairline,
  gap: "2px",
  padding: `0 ${MAP_SPACING.sm}`,
  background: MAP_COLORS.bgHeader,
  flexShrink: 0,
};

function buildTabStyle(active: boolean, disabled: boolean | undefined): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    border: "none",
    borderBottom: active
      ? `2px solid ${MAP_COLORS.interaction}`
      : "2px solid transparent",
    borderRadius: `${MAP_RADIUS.sm} ${MAP_RADIUS.sm} 0 0`,
    background: "transparent",
    color: active
      ? MAP_COLORS.interaction
      : disabled
        ? MAP_COLORS.textMuted
        : MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: active ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.normal,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: MAP_TRANSITIONS.fast,
    outline: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
    marginBottom: "-1px",
  };
}

export const GisTabs: React.FC<GisTabsProps> = ({
  tabs,
  activeId,
  onTabChange,
  "aria-label": ariaLabel,
  children,
  style,
  "data-testid": testId,
  tabTestIdPrefix,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
      const enabledIndices = tabs
        .map((t, i) => (t.disabled ? -1 : i))
        .filter((i) => i !== -1);
      const posInEnabled = enabledIndices.indexOf(currentIdx);

      let targetIdx: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        targetIdx = enabledIndices[(posInEnabled + 1) % enabledIndices.length] ?? null;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        targetIdx =
          enabledIndices[
            (posInEnabled - 1 + enabledIndices.length) % enabledIndices.length
          ] ?? null;
      } else if (event.key === "Home") {
        targetIdx = enabledIndices[0] ?? null;
      } else if (event.key === "End") {
        targetIdx = enabledIndices[enabledIndices.length - 1] ?? null;
      }

      if (targetIdx !== null) {
        event.preventDefault();
        tabRefs.current[targetIdx]?.focus();
        onTabChange(tabs[targetIdx]!.id);
      }
    },
    [tabs, onTabChange],
  );

  return (
    <div
      data-testid={testId}
      style={{ display: "flex", flexDirection: "column", minHeight: 0, ...style }}
    >
      <div role="tablist" aria-label={ariaLabel} style={tabListStyle}>
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[idx] = el; }}
            role="tab"
            id={`gis-tab-${tab.id}`}
            aria-controls={`gis-tabpanel-${tab.id}`}
            aria-selected={activeId === tab.id}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            title={tab.disabled && tab.disabledReason ? tab.disabledReason : tab.label}
            data-disabled-reason={tab.disabled && tab.disabledReason ? tab.disabledReason : undefined}
            data-testid={tabTestIdPrefix ? `${tabTestIdPrefix}-${tab.id}` : undefined}
            tabIndex={activeId === tab.id ? 0 : -1}
            style={buildTabStyle(activeId === tab.id, tab.disabled)}
            onClick={() => { if (!tab.disabled) onTabChange(tab.id); }}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`gis-tabpanel-${activeId}`}
        aria-labelledby={`gis-tab-${activeId}`}
        style={{ flex: 1, overflow: "auto", minHeight: 0 }}
      >
        {children}
      </div>
    </div>
  );
};
