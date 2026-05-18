import React from "react";
import { LuMap } from "react-icons/lu";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

interface MapExplorerButtonProps {
  onOpen: () => void;
}

const BTN: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 12px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairlineStrong}`,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  fontSize: 13,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  cursor: "pointer",
  transition: MAP_TRANSITIONS.fast,
  whiteSpace: "nowrap" as const,
};

export const MapExplorerButton: React.FC<MapExplorerButtonProps> = ({ onOpen }) => (
  <button
    type="button"
    style={BTN}
    onClick={onOpen}
    aria-label="Open Map Explorer (Ctrl+Shift+M)"
    title="Map Explorer — Ctrl+Shift+M"
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = MAP_COLORS.selectedSubtle;
      (e.currentTarget as HTMLButtonElement).style.borderColor = MAP_COLORS.focus;
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = MAP_COLORS.transparent;
      (e.currentTarget as HTMLButtonElement).style.borderColor = MAP_COLORS.hairlineStrong;
    }}
    onFocus={(e) => {
      (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${MAP_COLORS.focus}`;
      (e.currentTarget as HTMLButtonElement).style.outlineOffset = "2px";
    }}
    onBlur={(e) => {
      (e.currentTarget as HTMLButtonElement).style.outline = "";
      (e.currentTarget as HTMLButtonElement).style.outlineOffset = "";
    }}
  >
    <LuMap size={15} />
    <span>Map</span>
  </button>
);
