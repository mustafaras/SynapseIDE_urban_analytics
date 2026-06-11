import React from "react";

import {
  type MapExplorerModalProps,
  MapExplorerModal as MapExplorerModalRuntime,
} from "./MapExplorerModalRuntime";

export type { MapExplorerModalProps };

export const MapExplorerModal: React.FC<MapExplorerModalProps> = (props) => {
  return <MapExplorerModalRuntime {...props} />;
};
