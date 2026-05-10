/* ================================================================== */
/*  Map Explorer — Inline SVG Icons                                    */
/*  Lightweight, crisp, monochrome icons for scientific/pro UI.        */
/*  Each icon is a pure functional component returning inline SVG.     */
/*  All icons accept size (default 14) and color (default currentColor)*/
/* ================================================================== */

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const defaults = { size: 14, color: "currentColor" };

/** Filled circle — point marker */
export const IconPoint: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill={color} opacity="0.9" />
    <circle cx="8" cy="8" r="3" fill={color} />
  </svg>
);

/** Polyline — linestring */
export const IconLine: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M2 13L7 6L10 9L14 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Pentagon — polygon */
export const IconPolygon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M8 1.5L14.5 5.5L12.5 13H3.5L1.5 5.5Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
  </svg>
);

/** Rectangle outline */
export const IconRectangle: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <rect x="2" y="4" width="12" height="8" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
  </svg>
);

/** Circle outline */
export const IconCircle: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
  </svg>
);

/** Ruler — distance measurement */
export const IconRuler: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M2 14L14 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 12L5.5 10.5M7 9L8.5 7.5M10 6L11.5 4.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/** Area measurement — polygon with dashed interior lines */
export const IconArea: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M3 12L2 5L8 2L14 5L13 12Z" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.12" />
    <path d="M5 10L8 4L11 10" stroke={color} strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.5" />
  </svg>
);

/** Map pin / location marker */
export const IconPin: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M8 1C5.24 1 3 3.13 3 5.75C3 9.5 8 15 8 15C8 15 13 9.5 13 5.75C13 3.13 10.76 1 8 1Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.3" />
    <circle cx="8" cy="5.75" r="2" fill={color} />
  </svg>
);

/** Layers stack */
export const IconLayers: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M8 2L2 5.5L8 9L14 5.5Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill={color} fillOpacity="0.08" />
    <path d="M2 8L8 11.5L14 8" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M2 10.5L8 14L14 10.5" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/** Pencil / edit */
export const IconPencil: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M11.5 2.5L13.5 4.5L5 13H3V11Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill={color} fillOpacity="0.1" />
    <path d="M10 4L12 6" stroke={color} strokeWidth="1.2" />
  </svg>
);

/** Trash / delete */
export const IconTrash: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M5 3V2.5C5 2.22 5.22 2 5.5 2H10.5C10.78 2 11 2.22 11 2.5V3" stroke={color} strokeWidth="1.2" />
    <path d="M3 4H13L12 14H4Z" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.06" />
    <path d="M2.5 4H13.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Eye open — visible */
export const IconEyeOpen: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M1 8C1 8 4 3 8 3C12 3 15 8 15 8C15 8 12 13 8 13C4 13 1 8 1 8Z" stroke={color} strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.15" />
  </svg>
);

/** Eye closed — hidden */
export const IconEyeClosed: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M1 8C1 8 4 3 8 3C12 3 15 8 15 8" stroke={color} strokeWidth="1.3" />
    <path d="M3 12L13 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Globe / map */
export const IconGlobe: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.2" />
    <ellipse cx="8" cy="8" rx="3" ry="6.5" stroke={color} strokeWidth="0.8" />
    <path d="M2 6H14M2 10H14" stroke={color} strokeWidth="0.8" />
  </svg>
);

/** X / close */
export const IconClose: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M4 4L12 12M12 4L4 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Question mark — unknown */
export const IconUnknown: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.2" />
    <path d="M6 6.5C6 5.12 7.12 4.5 8 4.5C8.88 4.5 10 5.12 10 6.5C10 7.5 8.5 7.8 8.5 9" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <circle cx="8.5" cy="11" r="0.7" fill={color} />
  </svg>
);

/** Measurement panel icon — caliper-like */
export const IconMeasure: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M2 14L14 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="2" cy="14" r="1.5" fill={color} />
    <circle cx="14" cy="2" r="1.5" fill={color} />
    <path d="M6 10L7.5 8.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <path d="M9 7L10.5 5.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/** Import / upload arrow */
export const IconImport: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M8 11V3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 6L8 3L11 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12.5H13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Export / download arrow */
export const IconExport: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M8 3V11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 8L8 11L11 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12.5H13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Landscape / image export */
export const IconImage: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <rect x="2" y="3" width="12" height="10" rx="1.2" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.06" />
    <circle cx="5.25" cy="6" r="1.15" fill={color} />
    <path d="M4 11L7.1 8L9 9.8L10.5 8.4L12 11" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Save / disk */
export const IconSave: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M3 2.5H11.5L13.5 4.5V13.5H3Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill={color} fillOpacity="0.08" />
    <path d="M5 2.5V6H10.5V2.5" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="5" y="9" width="6" height="3" rx="0.8" stroke={color} strokeWidth="1.1" />
  </svg>
);

/** Load / restore */
export const IconLoad: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} aria-hidden="true">
    <path d="M8 3.25A4.75 4.75 0 1 1 4.1 5.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M3.25 2.75V5.75H6.25" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 5.25V8L10.25 9.25" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
