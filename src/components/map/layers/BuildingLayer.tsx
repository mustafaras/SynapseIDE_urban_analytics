/**
 * 3D extruded building layer — polygons lifted by height / floor-count attribute.
 */
import { GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { FeatureCollection } from 'geojson';
import {
  getQualitativeScale,
  getSequentialScale,
  type InterpolatorName,
  type QualitativeName,
  type RGBA,
} from '../utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

export type BuildingColorMode = 'height' | 'attribute';

export interface BuildingConfig {
  id: string;
  data: FeatureCollection;
  /** Property with floor count (default `'building:levels'`). Height = levels × metersPerLevel. */
  levelsProperty?: string;
  /** Direct height property in metres — overrides levels when set. */
  heightProperty?: string;
  /** Metres per level (default 3). */
  metersPerLevel?: number;
  /** Colour mode — by computed height or by a categorical attribute. */
  colorBy?: BuildingColorMode;
  /** Attribute property used when `colorBy === 'attribute'`. */
  colorAttribute?: string;
  /** Sequential colour scale for height-based colouring. */
  colorScale?: InterpolatorName;
  /** Qualitative colour scale for categorical attribute colouring. */
  categoricalScale?: QualitativeName;
  opacity?: number;
  visible?: boolean;
  onHover?: (info: PickingInfo) => void;
  onClick?: (info: PickingInfo) => void;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/** Create a 3D extruded GeoJsonLayer for building footprints. */
export function createBuildingLayer(config: BuildingConfig) {
  const {
    id,
    data,
    levelsProperty = 'building:levels',
    heightProperty,
    metersPerLevel = 3,
    colorBy = 'height',
    colorAttribute,
    colorScale = 'YlOrRd',
    categoricalScale = 'Tableau10',
    opacity = 0.85,
    visible = true,
    onHover,
    onClick,
  } = config;

  /* Pre-compute height range for colour scale */
  const heights = data.features.map((f) => {
    if (heightProperty) return Number(f.properties?.[heightProperty]) || 0;
    return (Number(f.properties?.[levelsProperty]) || 1) * metersPerLevel;
  });
  const maxH = Math.max(...heights, 1);
  const heightScale = getSequentialScale(colorScale, [0, maxH]);

  /* Categorical colour mapping */
  const categories =
    colorBy === 'attribute' && colorAttribute
      ? [
          ...new Set(
            data.features.map((f) =>
              String(f.properties?.[colorAttribute] ?? 'unknown'),
            ),
          ),
        ]
      : [];
  const catColors = getQualitativeScale(
    categoricalScale,
    Math.max(categories.length, 1),
  );
  const catMap = new Map(categories.map((c, i) => [c, catColors[i]]));
  const FALLBACK: RGBA = [180, 180, 180, 255];

  return new GeoJsonLayer({
    id,
    data,
    visible,
    opacity,
    pickable: true,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: (f: any) => {
      if (heightProperty) return Number(f.properties?.[heightProperty]) || 3;
      return (Number(f.properties?.[levelsProperty]) || 1) * metersPerLevel;
    },
    getFillColor: (f: any) => {
      if (colorBy === 'attribute' && colorAttribute) {
        return (
          catMap.get(String(f.properties?.[colorAttribute])) ?? FALLBACK
        );
      }
      const h = heightProperty
        ? Number(f.properties?.[heightProperty]) || 0
        : (Number(f.properties?.[levelsProperty]) || 1) * metersPerLevel;
      return heightScale(h);
    },
    getLineColor: [60, 60, 60, 80],
    material: {
      ambient: 0.4,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [60, 64, 70],
    },
    updateTriggers: {
      getElevation: [levelsProperty, heightProperty, metersPerLevel],
      getFillColor: [colorBy, colorAttribute, colorScale, categoricalScale],
    },
    ...(onHover ? { onHover } : {}),
    ...(onClick ? { onClick } : {}),
  });
}
