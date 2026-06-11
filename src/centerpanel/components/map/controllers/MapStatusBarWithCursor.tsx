import React, { useImperativeHandle, useState } from "react";

import { MapStatusBar, type MapStatusBarProps } from "../MapStatusBar";

type MapCursorCoordinates = { lng: number; lat: number };

export interface MapStatusBarCursorHandle {
  setCursor: (cursor: MapCursorCoordinates | null) => void;
}

type MapStatusBarWithCursorProps = Omit<MapStatusBarProps, "cursor">;

export const MapStatusBarWithCursor = React.forwardRef<MapStatusBarCursorHandle, MapStatusBarWithCursorProps>(
  (props, ref) => {
    const [cursor, setCursor] = useState<MapCursorCoordinates | null>(null);

    useImperativeHandle(ref, () => ({
      setCursor,
    }), []);

    return <MapStatusBar {...props} cursor={cursor} />;
  },
);

MapStatusBarWithCursor.displayName = "MapStatusBarWithCursor";
