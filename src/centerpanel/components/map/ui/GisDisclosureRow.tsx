import React from "react";
import { ChevronRight } from "lucide-react";
import {
  MAP_COLORS,
  MAP_DENSITY,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  mapStyles,
  type GisDensity,
} from "../mapTokens";
import motionStyles from "../design/motion.module.css";
import primitiveStyles from "./GisPrimitive.module.css";

export interface GisDisclosureRowProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  description?: string;
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  expanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabledReason?: string;
  density?: GisDensity;
  children?: React.ReactNode;
  contentId?: string;
}

export const GisDisclosureRow = React.forwardRef<
  HTMLButtonElement,
  GisDisclosureRowProps
>(
  (
    {
      label,
      description,
      leadingIcon,
      trailing,
      expanded,
      onExpandedChange,
      disabled,
      disabledReason,
      density = "compact",
      children,
      contentId,
      className,
      style,
      onClick,
      ...props
    },
    ref,
  ) => {
    const generatedContentId = React.useId();
    const disabledReasonId = React.useId();
    const panelId = contentId ?? `${generatedContentId}-content`;
    const densityPreset = MAP_DENSITY[density];
    const describedBy = disabled && disabledReason ? disabledReasonId : undefined;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented && !disabled) {
        onExpandedChange?.(!expanded);
      }
    };

    return (
      <div data-gis-disclosure-row="true" style={{ minWidth: 0 }}>
        <button
          {...props}
          ref={ref}
          type="button"
          aria-label={label}
          aria-expanded={expanded}
          aria-controls={children ? panelId : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          data-disabled-reason={disabled && disabledReason ? disabledReason : undefined}
          title={disabled && disabledReason ? disabledReason : label}
          className={`${primitiveStyles.focusVisible} ${primitiveStyles.motionFeedback} ${primitiveStyles.disclosureRow}${className ? ` ${className}` : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: densityPreset.gap,
            minHeight: densityPreset.rowHeight,
            padding: densityPreset.cellPadding,
            border: MAP_STROKES.hairlineSubtle,
            borderRadius: MAP_RADIUS.sm,
            background: expanded ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
            color: disabled ? MAP_COLORS.textMuted : MAP_COLORS.textSecondary,
            cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: MAP_TYPOGRAPHY.fontFamily,
            fontSize: densityPreset.fontSize,
            textAlign: "left",
            opacity: disabled ? 0.48 : 1,
            ...style,
          }}
          onClick={handleClick}
        >
          <ChevronRight
            size={MAP_ICON_SIZES.xs}
            aria-hidden="true"
            className={`${primitiveStyles.disclosureChevron}${expanded ? ` ${primitiveStyles.disclosureChevronOpen}` : ""}`}
          />
          <span style={{ display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs, minWidth: 0 }}>
            {leadingIcon ? <span aria-hidden style={{ display: "inline-flex", flexShrink: 0 }}>{leadingIcon}</span> : null}
            <span style={{ display: "grid", gap: "1px", minWidth: 0 }}>
              <span style={{ color: MAP_COLORS.text, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, ...MAP_TEXT_STYLES.valueWrap }}>
                {label}
              </span>
              {description ? (
                <span style={{ color: MAP_COLORS.textMuted, ...MAP_TEXT_STYLES.valueWrap }}>
                  {description}
                </span>
              ) : null}
            </span>
          </span>
          {trailing ? <span style={{ display: "inline-flex", minWidth: 0 }}>{trailing}</span> : <span />}
          {disabled && disabledReason ? (
            <span id={disabledReasonId} style={mapStyles.srOnly}>
              Disabled: {disabledReason}
            </span>
          ) : null}
        </button>
        {children && expanded ? (
          <div
            id={panelId}
            role="region"
            aria-label={label}
            className={motionStyles.fadeIn}
            style={{
              borderRight: MAP_STROKES.hairlineSubtle,
              borderBottom: MAP_STROKES.hairlineSubtle,
              borderLeft: MAP_STROKES.hairlineSubtle,
              borderRadius: `0 0 ${MAP_RADIUS.sm} ${MAP_RADIUS.sm}`,
              padding: densityPreset.cellPadding,
              minWidth: 0,
            }}
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  },
);
GisDisclosureRow.displayName = "GisDisclosureRow";