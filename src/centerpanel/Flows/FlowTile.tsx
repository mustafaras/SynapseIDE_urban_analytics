import React from "react";
import flowCss from "../styles/flows.module.css";
import type { FlowLibraryItem } from "./flowLibraryMeta";

const FlowTile: React.FC<{
  item: FlowLibraryItem;
  isActive: boolean;
  onSelect: () => void;
  metaLine?: string | undefined;
  statusLine?: string | undefined;
}> = ({ item, isActive, onSelect, metaLine, statusLine }) => {
  const locked = !!item.isLocked;
  const className = locked
    ? flowCss.flowTileLocked
    : isActive
    ? flowCss.flowTileActive
    : flowCss.flowTile;


  return (
    <button
      type="button"
      className={className}
      disabled={locked}
      onClick={onSelect}
      data-testid={`flow-tile-${item.flowId}`}
      aria-disabled={locked || undefined}
      aria-pressed={isActive || undefined}
      title={item.boundary}
    >
      <div className={flowCss.flowTileTitleRow}>
        <span className={flowCss.flowTileTitle}>{item.title}</span>
        {!!locked && (
          <span className={flowCss.flowTileLockBadge}>
            {item.lockReason || "Context required"}
          </span>
        )}
      </div>

      {metaLine ? (
        <div className={flowCss.flowTileBoundaryLine}>{metaLine}</div>
      ) : null}

      <div className={flowCss.flowTileAnalysisFocus}>{item.analysisFocus}</div>

      {statusLine ? (
        <div className={flowCss.flowTileBoundaryLine}>{statusLine}</div>
      ) : null}

      <div className={flowCss.flowTileBoundaryLine}>{item.boundary}</div>
    </button>
  );
};

export default FlowTile;
