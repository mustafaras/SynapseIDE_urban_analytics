import React from "react";

import { IconClose } from "../MapIcons";
import { MAP_DIMENSIONS, MAP_ICON_SIZES, mapStyles } from "../mapTokens";
import { createOpaqueFloatingPanelStyle } from "../useDraggableMapPanel";
import type { SymbolMode } from "../../MapSymbolLayer";

interface MapPointSymbologyFloatingPanelProps {
  controls: React.ReactNode;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
  dragHandleStyle: React.CSSProperties;
  layerName: string;
  mode: SymbolMode;
  onClose: () => void;
  onModeChange: (mode: SymbolMode) => void;
  panelPositionStyle: React.CSSProperties;
  visible: boolean;
}

export const MapPointSymbologyFloatingPanel: React.FC<MapPointSymbologyFloatingPanelProps> = ({
  controls,
  dragHandleProps,
  dragHandleStyle,
  layerName,
  mode,
  onClose,
  onModeChange,
  panelPositionStyle,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        ...createOpaqueFloatingPanelStyle(MAP_DIMENSIONS.symbologyPanelWidth),
        ...panelPositionStyle,
      }}
      role="dialog"
      aria-label="Point symbology configuration"
    >
      <div
        style={{ ...mapStyles.symbologyHeader, ...dragHandleStyle }}
        {...dragHandleProps}
      >
        <div>
          <div style={mapStyles.symbologyEyebrow}>
            Symbology
          </div>
          <div style={mapStyles.symbologyLayerName}>
            {layerName}
          </div>
        </div>

        <button
          type="button"
          style={mapStyles.symbologyCloseButton}
          onClick={onClose}
          aria-label="Close symbology panel"
        >
          <IconClose size={MAP_ICON_SIZES.md} />
        </button>
      </div>

      <div style={mapStyles.symbologyModeGrid}>
        {(["heatmap", "proportional", "graduated"] as const).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            onClick={() => onModeChange(nextMode)}
            style={{
              ...mapStyles.symbologyModeButton,
              ...(mode === nextMode ? mapStyles.symbologyModeButtonActive : {}),
            }}
            aria-pressed={mode === nextMode}
          >
            {nextMode === "heatmap" ? "Heatmap" : nextMode === "proportional" ? "Proportional" : "Graduated"}
          </button>
        ))}
      </div>

      {controls}
    </div>
  );
};
