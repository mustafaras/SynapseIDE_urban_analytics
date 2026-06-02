/**
 * Prompt 36 — accessible tab set primitive.
 * Uses role="tablist" / role="tab" / role="tabpanel" per ARIA authoring practices.
 * Arrow-key navigation between tabs is handled internally.
 */
import React, { useCallback, useRef } from "react";
import {
  MAP_COLORS,
  MAP_DENSITY,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  type GisDensity,
  mapStyles,
} from "../mapTokens";
import primitiveStyles from "./GisPrimitive.module.css";

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
  /** Compact tab geometry for dense sidebar/inspector surfaces. */
  variant?: "default" | "compact";
  density?: GisDensity;
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
  minWidth: 0,
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  scrollbarGutter: "stable",
  scrollbarWidth: "thin",
};

function buildTabStyle(
  active: boolean,
  disabled: boolean | undefined,
  variant: "default" | "compact",
  density: GisDensity,
): React.CSSProperties {
  const densityPreset = MAP_DENSITY[density];
  const compact = variant === "compact";
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: compact ? MAP_SPACING.xs : densityPreset.gap,
    minHeight: compact ? MAP_DENSITY.compact.rowHeight : densityPreset.rowHeight,
    maxWidth: compact ? "9rem" : "11rem",
    padding: compact ? `2px ${MAP_SPACING.sm}` : densityPreset.cellPadding,
    border: "1px solid transparent",
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
    fontSize: densityPreset.fontSize,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: active ? MAP_TYPOGRAPHY.fontWeight.semibold : 400,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: MAP_TRANSITIONS.fast,
    ...MAP_TEXT_STYLES.chipLabel,
    overflow: "visible",
    textOverflow: "clip",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
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
  variant = "default",
  density,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const disabledReasonBaseId = React.useId();
  const effectiveDensity = density ?? (variant === "compact" ? "compact" : "default");

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
      data-gis-tabs="true"
      style={{ display: "flex", flexDirection: "column", minHeight: 0, ...style }}
    >
      <div role="tablist" aria-label={ariaLabel} style={tabListStyle}>
        {tabs.map((tab, idx) => {
          const disabledReasonId = tab.disabled && tab.disabledReason
            ? `${disabledReasonBaseId}-${tab.id}-disabled-reason`
            : undefined;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              role="tab"
              id={`gis-tab-${tab.id}`}
              aria-controls={`gis-tabpanel-${tab.id}`}
              aria-label={tab.label}
              aria-selected={activeId === tab.id}
              aria-disabled={tab.disabled}
              aria-describedby={disabledReasonId}
              disabled={tab.disabled}
              title={tab.disabled && tab.disabledReason ? tab.disabledReason : tab.label}
              data-disabled-reason={tab.disabled && tab.disabledReason ? tab.disabledReason : undefined}
              data-gis-tab="true"
              data-gis-tab-variant={variant}
              data-testid={tabTestIdPrefix ? `${tabTestIdPrefix}-${tab.id}` : undefined}
              tabIndex={activeId === tab.id ? 0 : -1}
              className={`${primitiveStyles.focusVisible} ${primitiveStyles.motionFeedback}`}
              style={buildTabStyle(activeId === tab.id, tab.disabled, variant, effectiveDensity)}
              onClick={() => { if (!tab.disabled) onTabChange(tab.id); }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              {tab.icon}
              {tab.label}
              {disabledReasonId ? (
                <span id={disabledReasonId} style={mapStyles.srOnly}>
                  Disabled: {tab.disabledReason}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`gis-tabpanel-${activeId}`}
        aria-labelledby={`gis-tab-${activeId}`}
        style={{ flex: 1, overflow: "auto", minHeight: 0, overscrollBehavior: "contain", scrollbarGutter: "stable" }}
      >
        {children}
      </div>
    </div>
  );
};
