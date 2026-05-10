import type { ProjectRecord } from "./types";

export function seedProjects(): ProjectRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "proj_barcelona_superblocks",
      name: "Barcelona Superblocks Study",
      description:
        "Analysis of the Superblocks urban mobility programme in the Eixample district, assessing impacts on pedestrian accessibility, air quality, green space, and social equity.",
      scale: "neighborhood",
      area_km2: 7.46,
      bbox: [2.1487, 41.3818, 2.1877, 41.4025],
      crs: "EPSG:4326",
      tags: ["mobility", "equity", "green_infra", "pedestrian", "air_quality"],
      priority: 2,
      climateVulnerability: "medium",
      dataCompleteness: 78,
      sessionsCount: 3,
      lastSessionDate: "2025-12-15",
      indicators: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "proj_istanbul_seismic",
      name: "Istanbul Seismic Vulnerability",
      description:
        "City-wide multi-hazard vulnerability assessment for the Istanbul Metropolitan Area, focusing on seismic exposure, building typology fragility, and social vulnerability indices.",
      scale: "city",
      area_km2: 5343,
      bbox: [28.5701, 40.8027, 29.4517, 41.2392],
      crs: "EPSG:4326",
      tags: ["vulnerability", "housing", "climate", "safety"],
      priority: 1,
      climateVulnerability: "critical",
      dataCompleteness: 52,
      sessionsCount: 2,
      lastSessionDate: "2026-01-20",
      indicators: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "proj_tokyo_15min",
      name: "Tokyo 15-Minute City",
      description:
        "Metropolitan-scale evaluation of 15-minute city principles across Tokyo's 23 special wards, measuring accessibility to essential services and transit connectivity.",
      scale: "metropolitan",
      area_km2: 2194,
      bbox: [139.5601, 35.519, 139.92, 35.8178],
      crs: "EPSG:4326",
      tags: ["accessibility", "transit", "pedestrian", "indicators"],
      priority: 3,
      climateVulnerability: "medium",
      dataCompleteness: 65,
      sessionsCount: 1,
      lastSessionDate: "2026-02-03",
      indicators: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}