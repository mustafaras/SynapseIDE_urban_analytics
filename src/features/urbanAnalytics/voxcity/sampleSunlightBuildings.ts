// Sample building volumes for sunlight simulation demo
import type { BuildingVolume } from "./sunlightTypes";

/**
 * 12 demo buildings arranged in a neighborhood grid pattern.
 * Coordinates in metres, local Cartesian (origin at SW corner).
 * Heights vary from 8m (low-rise) to 60m (tower).
 */
export const SAMPLE_SUNLIGHT_BUILDINGS: readonly BuildingVolume[] = [
  // Row 1 (south)
  { id: "B01", label: "Residential A",   bbox: [10, 10, 30, 25],   height: 12 },
  { id: "B02", label: "Residential B",   bbox: [40, 10, 60, 25],   height: 15 },
  { id: "B03", label: "Commercial C",    bbox: [70, 10, 95, 30],   height: 25 },

  // Row 2
  { id: "B04", label: "Office Tower D",  bbox: [10, 45, 28, 65],   height: 60 },
  { id: "B05", label: "School E",        bbox: [38, 45, 62, 60],   height: 10 },
  { id: "B06", label: "Parking F",       bbox: [70, 45, 95, 60],   height: 8  },

  // Row 3
  { id: "B07", label: "Residential G",   bbox: [10, 80, 30, 95],   height: 18 },
  { id: "B08", label: "Mixed-use H",     bbox: [40, 80, 65, 100],  height: 35 },
  { id: "B09", label: "Clinic I",        bbox: [75, 80, 95, 95],   height: 14 },

  // Row 4 (north)
  { id: "B10", label: "Tower J",         bbox: [15, 120, 30, 140], height: 50 },
  { id: "B11", label: "Retail K",        bbox: [45, 120, 70, 135], height: 8  },
  { id: "B12", label: "Warehouse L",     bbox: [80, 115, 100, 140],height: 10 },
];
