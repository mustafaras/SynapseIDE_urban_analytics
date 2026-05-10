import type {
  FacilityCandidateSite,
  FacilityDemandPoint,
} from "@/engine/simulation";

export interface FacilityOptimisationDemoDataset {
  demandPoints: FacilityDemandPoint[];
  candidateSites: FacilityCandidateSite[];
  serviceRadiusKm: number;
  recommendedFacilityCount: number;
  bounds: [number, number, number, number];
  defaultScenarioName: string;
}

const DEMAND_POINTS: FacilityDemandPoint[] = [
  { id: "d1", label: "West Core", lng: 28.990, lat: 41.042, demand: 520, equityGroup: "general" },
  { id: "d2", label: "Market District", lng: 29.002, lat: 41.047, demand: 610, equityGroup: "general" },
  { id: "d3", label: "University Edge", lng: 29.017, lat: 41.051, demand: 430, equityGroup: "students" },
  { id: "d4", label: "North Estates", lng: 29.034, lat: 41.053, demand: 390, equityGroup: "general" },
  { id: "d5", label: "Old Harbor", lng: 28.995, lat: 41.030, demand: 470, equityGroup: "seniors" },
  { id: "d6", label: "Civic Spine", lng: 29.010, lat: 41.034, demand: 760, equityGroup: "general" },
  { id: "d7", label: "Midtown South", lng: 29.024, lat: 41.037, demand: 680, equityGroup: "workers" },
  { id: "d8", label: "Garden Blocks", lng: 29.041, lat: 41.040, demand: 340, equityGroup: "general" },
  { id: "d9", label: "Canal West", lng: 28.999, lat: 41.020, demand: 540, equityGroup: "low_income" },
  { id: "d10", label: "Transit Triangle", lng: 29.013, lat: 41.023, demand: 700, equityGroup: "workers" },
  { id: "d11", label: "South Terrace", lng: 29.028, lat: 41.026, demand: 590, equityGroup: "low_income" },
  { id: "d12", label: "East Terrace", lng: 29.043, lat: 41.028, demand: 420, equityGroup: "low_income" },
  { id: "d13", label: "Waterfront West", lng: 29.004, lat: 41.010, demand: 480, equityGroup: "low_income" },
  { id: "d14", label: "School Quarter", lng: 29.018, lat: 41.013, demand: 560, equityGroup: "students" },
  { id: "d15", label: "Hillside South", lng: 29.033, lat: 41.015, demand: 510, equityGroup: "low_income" },
  { id: "d16", label: "Far East Fringe", lng: 29.048, lat: 41.016, demand: 320, equityGroup: "low_income" },
];

const CANDIDATE_SITES: FacilityCandidateSite[] = [
  { id: "s1", label: "Municipal Hall", lng: 28.995, lat: 41.043, category: "public_land", fixedOpen: false },
  { id: "s2", label: "Market Plaza", lng: 29.008, lat: 41.045, category: "co_location", fixedOpen: false },
  { id: "s3", label: "Campus Annex", lng: 29.021, lat: 41.049, category: "public_land", fixedOpen: false },
  { id: "s4", label: "North Hub", lng: 29.038, lat: 41.046, category: "co_location", fixedOpen: false },
  { id: "s5", label: "Civic Depot", lng: 29.010, lat: 41.033, category: "public_land", fixedOpen: true },
  { id: "s6", label: "Transit Court", lng: 29.021, lat: 41.031, category: "co_location", fixedOpen: false },
  { id: "s7", label: "Southwest Clinic Pad", lng: 29.002, lat: 41.019, category: "public_land", fixedOpen: false },
  { id: "s8", label: "Triangle Junction", lng: 29.014, lat: 41.022, category: "co_location", fixedOpen: false },
  { id: "s9", label: "Terrace Reserve", lng: 29.031, lat: 41.024, category: "private_parcel", fixedOpen: false },
  { id: "s10", label: "East Terrace Lot", lng: 29.045, lat: 41.024, category: "private_parcel", fixedOpen: false },
  { id: "s11", label: "School Quarter Yard", lng: 29.020, lat: 41.013, category: "public_land", fixedOpen: false },
  { id: "s12", label: "Fringe Civic Kiosk", lng: 29.047, lat: 41.014, category: "co_location", fixedOpen: false },
];

export function buildFacilityOptimisationDemoDataset(): FacilityOptimisationDemoDataset {
  return {
    demandPoints: DEMAND_POINTS,
    candidateSites: CANDIDATE_SITES,
    serviceRadiusKm: 2.2,
    recommendedFacilityCount: 4,
    bounds: [28.988, 41.008, 29.052, 41.056],
    defaultScenarioName: "Neighbourhood Service Siting",
  };
}
