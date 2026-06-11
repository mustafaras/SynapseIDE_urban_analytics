import React from "react";

import {
  type MapActivityItem,
  MapActivityRail,
} from "../MapWorkspaceShell";

interface MapActivityRailPresenterProps {
  items: MapActivityItem[];
  bottomItems: MapActivityItem[];
  style: React.CSSProperties;
}

export const MapActivityRailPresenter: React.FC<MapActivityRailPresenterProps> = ({
  items,
  bottomItems,
  style,
}) => (
  <MapActivityRail
    items={items}
    bottomItems={bottomItems}
    aria-label="Map Explorer activity"
    style={style}
  />
);
