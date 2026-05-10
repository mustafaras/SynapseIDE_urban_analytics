/**
 * Point-cluster layer — Supercluster-based aggregation with smooth zoom transitions.
 */
import Supercluster from 'supercluster';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import type { FeatureCollection, Point } from 'geojson';
import type { RGBA } from '../utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

export interface PointClusterConfig {
  id: string;
  data: FeatureCollection<Point>;
  /** Cluster radius in pixels (default 40). */
  radius?: number;
  /** Maximum zoom at which to cluster (default 16). */
  maxZoom?: number;
  /** Current map zoom level. */
  zoom: number;
  /** Current viewport bounds [west, south, east, north]. */
  bounds: [number, number, number, number];
  /** Colour for individual (unclustered) points. */
  pointColor?: RGBA;
  /** Colour for cluster circles. */
  clusterColor?: RGBA;
  /** [min, max] radius for cluster circles in pixels. */
  clusterRadiusRange?: [number, number];
  visible?: boolean;
  onClickCluster?: (info: PickingInfo) => void;
  onClickPoint?: (info: PickingInfo) => void;
}

/* ------------------------------------------------------------------ */
/*  Reference-based Supercluster cache                                 */
/* ------------------------------------------------------------------ */

let _cachedData: FeatureCollection<Point> | null = null;
let _cachedRadius = 0;
let _cachedMaxZoom = 0;
let _cachedIndex: Supercluster | null = null;

function getIndex(
  data: FeatureCollection<Point>,
  radius: number,
  maxZoom: number,
): Supercluster {
  if (
    _cachedData === data &&
    _cachedRadius === radius &&
    _cachedMaxZoom === maxZoom &&
    _cachedIndex
  ) {
    return _cachedIndex;
  }
  const index = new Supercluster({ radius, maxZoom });
  index.load(
    data.features as Supercluster.PointFeature<Record<string, unknown>>[],
  );
  _cachedData = data;
  _cachedRadius = radius;
  _cachedMaxZoom = maxZoom;
  _cachedIndex = index;
  return index;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/**
 * Create deck.gl layers for clustered point data.
 *
 * Returns `[clusterCircles, clusterLabels, individualPoints]`.
 */
export function createPointClusterLayers(config: PointClusterConfig): Layer[] {
  const {
    id,
    data,
    radius = 40,
    maxZoom = 16,
    zoom,
    bounds,
    pointColor = [30, 130, 200, 220] as RGBA,
    clusterColor = [255, 140, 0, 220] as RGBA,
    clusterRadiusRange = [12, 40],
    visible = true,
    onClickCluster,
    onClickPoint,
  } = config;

  const index = getIndex(data, radius, maxZoom);
  const clusters = index.getClusters(bounds, Math.floor(zoom));

  const clusterFeatures: any[] = [];
  const pointFeatures: any[] = [];
  for (const c of clusters) {
    if ((c.properties as any)?.cluster) {
      clusterFeatures.push(c);
    } else {
      pointFeatures.push(c);
    }
  }

  const maxCount = clusterFeatures.reduce(
    (mx, c) => Math.max(mx, (c.properties as any).point_count ?? 1),
    1,
  );

  const [rMin, rMax] = clusterRadiusRange;

  const clusterLayer = new ScatterplotLayer({
    id: `${id}-clusters`,
    data: clusterFeatures,
    visible,
    pickable: true,
    getPosition: (d: any) => d.geometry.coordinates,
    getRadius: (d: any) => {
      const count = d.properties.point_count ?? 1;
      return rMin + (rMax - rMin) * Math.sqrt(count / maxCount);
    },
    getFillColor: clusterColor,
    radiusUnits: 'pixels' as const,
    ...(onClickCluster ? { onClick: onClickCluster } : {}),
  });

  const labelLayer = new TextLayer({
    id: `${id}-labels`,
    data: clusterFeatures,
    visible,
    pickable: false,
    getPosition: (d: any) => d.geometry.coordinates,
    getText: (d: any) => String(d.properties.point_count ?? ''),
    getSize: 12,
    getColor: [255, 255, 255, 255],
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'center' as const,
  });

  const pointLayer = new ScatterplotLayer({
    id: `${id}-points`,
    data: pointFeatures,
    visible,
    pickable: true,
    getPosition: (d: any) => d.geometry.coordinates,
    getRadius: 5,
    getFillColor: pointColor,
    radiusUnits: 'pixels' as const,
    ...(onClickPoint ? { onClick: onClickPoint } : {}),
  });

  return [clusterLayer, labelLayer, pointLayer];
}
