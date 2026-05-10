import type { Card } from '../lib/types';

/**
 * Policy Instruments & Implementation seed cards.
 * Covers regulatory tools, financing mechanisms, design codes,
 * and implementation planning methods for urban interventions.
 */
export function buildPolicyImplementationCards(_existing?: Set<string>): Card[] {
  return [
    // ── Policy Instruments ───────────────────────────────────
    {
      id: 'pol-zoning-regulatory',
      title: 'Zoning & Land-Use Regulation',
      sectionId: 'policy_instruments',
      summary:
        'Analyse and model the effects of zoning regulations on urban density, mixed-use development, ' +
        'and spatial equity. Covers FAR/height limits, overlay districts, form-based codes, and ' +
        'inclusionary zoning provisions.',
      tags: ['policy', 'zoning', 'land_use', 'density', 'equity'],
      methodology:
        '1. Digitise or import zoning map with attribute table (zone type, FAR, height limit, use permissions).\n' +
        '2. Overlay with parcels and building footprints.\n' +
        '3. Compute development capacity (allowed minus built) per parcel.\n' +
        '4. Identify under-utilised parcels and up-zoning candidates.\n' +
        '5. Model scenario: what if FAR increased by 50% in transit corridors?\n' +
        '6. Map development potential as 3D capacity surface.',
      tools: ['geopandas', 'PostGIS', 'QGIS', 'Mapbox GL'],
      datasets: [
        'Municipal zoning map with zone attributes (FAR, height, uses)',
        'Parcel boundaries with building footprint and GFA data',
        'Transit station locations for corridor overlay analysis',
        'Census or tax assessor land value data',
      ],
      examples: [
        'Minneapolis 2040 Plan: eliminated single-family zoning citywide, allowing 2-3 unit buildings in all residential zones',
        'Tokyo: flexible use-based zoning across 12 categories enabling 4x higher housing production per capita than London',
        'São Paulo 2014 Master Plan: up-zoning along transit corridors (FAR 4.0) with inclusionary housing requirement',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Development capacity analysis under current zoning\nparcels = gpd.read_file("parcels.gpkg")  # fields: parcel_id, zone_type, far_allowed, area_m2, gfa_built\n\n# Calculate unused development capacity\nparcels["gfa_allowed"] = parcels["far_allowed"] * parcels["area_m2"]\nparcels["gfa_remaining"] = parcels["gfa_allowed"] - parcels["gfa_built"]\nparcels["utilisation_pct"] = (parcels["gfa_built"] / parcels["gfa_allowed"] * 100).clip(0, 100)\n\nprint("Development Capacity Summary:")\nprint(f"Total parcels: {len(parcels):,}")\nprint(f"Total allowed GFA: {parcels['gfa_allowed'].sum():,.0f} m\u00b2")\nprint(f"Total built GFA: {parcels['gfa_built'].sum():,.0f} m\u00b2")\nprint(f"Remaining capacity: {parcels['gfa_remaining'].sum():,.0f} m\u00b2")\nprint(f"\\nMean utilisation: {parcels['utilisation_pct'].mean():.1f}%")\n\n# Under-utilised parcels (built < 30% of allowed)\nunder = parcels[parcels["utilisation_pct"] < 30]\nprint(f"Under-utilised parcels (<30%): {len(under):,} ({len(under)/len(parcels)*100:.1f}%)")\n\n# Scenario: increase FAR by 50% in transit corridors\ntransit_buffer = gpd.read_file("transit_stations.gpkg").buffer(800)  # 800m walk\ntransit_union = transit_buffer.unary_union\nparcels["in_transit_corridor"] = parcels.geometry.centroid.within(transit_union)\nparcels.loc[parcels["in_transit_corridor"], "far_scenario"] = parcels["far_allowed"] * 1.5\nparcels.loc[~parcels["in_transit_corridor"], "far_scenario"] = parcels["far_allowed"]\nadditional = (parcels["far_scenario"] * parcels["area_m2"] - parcels["gfa_allowed"]).clip(lower=0).sum()\nprint(f"\\nScenario: +50% FAR in transit corridors adds {additional:,.0f} m\u00b2 capacity")\nparcels.to_file("zoning_capacity.gpkg", driver="GPKG")`,
      ],
      evidence: [
        'Pendall, R. et al. (2006). From Traditional to Reformed: A Review of the Land Use Regulation Literature. Cityscape, 8(1), 5–31.',
        'Bertaud, A. (2018). Order without Design: How Markets Shape Cities. MIT Press.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 11.a'],
      limitations:
        'Zoning does not capture informal development or market dynamics. ' +
        'Data availability varies greatly between jurisdictions.',
    },
    {
      id: 'pol-transfer-development-rights',
      title: 'Transfer of Development Rights (TDR)',
      sectionId: 'policy_instruments',
      summary:
        'Model TDR programmes that redirect growth from sensitive areas (sending zones) to ' +
        'designated growth areas (receiving zones) through tradeable development credits.',
      tags: ['policy', 'zoning', 'density', 'heritage', 'green_infra'],
      methodology:
        '1. Define sending zones (heritage, farmland, hazard areas) and receiving zones (transit corridors, infill areas).\n' +
        '2. Assign development credit value per sending parcel.\n' +
        '3. Calculate absorption capacity of receiving zones.\n' +
        '4. Model credit supply-demand balance.\n' +
        '5. Simulate spatial outcomes under different uptake scenarios.\n' +
        '6. Map credit flows and density redistribution.',
      tools: ['geopandas', 'network analysis', 'scenario modelling'],
      datasets: [
        'Parcel boundaries with existing and allowed development levels',
        'Sending zone designations (heritage, agricultural, hazard)',
        'Receiving zone designations (transit corridors, growth areas)',
        'Real estate transaction data for credit valuation',
      ],
      examples: [
        'New Jersey Pinelands TDR: 48-year programme preserving 53 000 acres with 4 700+ development credits transferred',
        'São Paulo CEPAC: securitised development rights generating $3.4 billion for urban infrastructure',
        'Montgomery County MD: TDR programme preserving 93 000 acres of farmland since 1980',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# TDR supply-demand balance analysis\nsending = gpd.read_file("sending_zones.gpkg")  # fields: parcel_id, area_ha, credits_assigned\nreceiving = gpd.read_file("receiving_zones.gpkg")  # fields: parcel_id, area_ha, credits_absorbable\n\n# Supply\ntotal_supply = sending["credits_assigned"].sum()\nprint(f"TDR Credit Supply: {total_supply:,.0f} credits from {len(sending)} sending parcels")\nprint(f"Sending zone area: {sending['area_ha'].sum():,.0f} ha")\n\n# Demand\ntotal_demand = receiving["credits_absorbable"].sum()\nprint(f"TDR Credit Demand: {total_demand:,.0f} credits in {len(receiving)} receiving parcels")\nprint(f"Receiving zone area: {receiving['area_ha'].sum():,.0f} ha")\n\n# Balance\nratio = total_supply / total_demand if total_demand > 0 else float("inf")\nprint(f"\\nSupply-Demand Ratio: {ratio:.2f}")\nif ratio > 1.5:\n    print("WARNING: Supply exceeds demand — risk of depressed credit prices")\nelif ratio < 0.5:\n    print("WARNING: Demand exceeds supply — potential for speculative inflation")\nelse:\n    print("Market balance appears healthy")\n\n# Scenario: 50%, 75%, 100% uptake\nfor uptake in [0.5, 0.75, 1.0]:\n    credits_used = min(total_supply * uptake, total_demand)\n    area_preserved = (credits_used / total_supply) * sending["area_ha"].sum()\n    print(f"\\n{uptake*100:.0f}% uptake: {credits_used:,.0f} credits, {area_preserved:,.0f} ha preserved")`,
      ],
      evidence: [
        'Pruetz, R. & Standridge, N. (2009). What makes transfer of development rights work? Journal of the American Planning Association, 75(1), 78–87.',
        'Tavares, A. (2003). Can the market be used to preserve land? The case for transfer of development rights. European Planning Studies, 11(8), 915–928.',
      ],
      sdgAlignment: ['SDG 11.a', 'SDG 15.1'],
      limitations:
        'TDR markets often lack liquidity. Success depends on political will and market conditions.',
    },
    {
      id: 'pol-value-capture',
      title: 'Land Value Capture Mechanisms',
      sectionId: 'policy_instruments',
      summary:
        'Assess instruments that allow public authorities to recover a share of land value ' +
        'increases arising from planning decisions or infrastructure investment. Covers betterment ' +
        'levies, tax increment financing, and developer contributions.',
      tags: ['policy', 'economic', 'equity', 'governance'],
      methodology:
        '1. Identify value uplift zones around planned infrastructure.\n' +
        '2. Estimate before/after land values using hedonic models or sales data.\n' +
        '3. Calculate potential capture revenue under different levy rates.\n' +
        '4. Model fiscal impact on project financing.\n' +
        '5. Compare equity implications across income groups.\n' +
        '6. Map value uplift contours.',
      tools: ['hedonic regression', 'geopandas', 'PostgreSQL'],
      datasets: [
        'Real estate sales transaction records with geocoded locations',
        'Infrastructure investment locations and completion dates',
        'Property tax assessment records for before/after comparison',
        'Census socio-economic data for equity analysis',
      ],
      examples: [
        'Bogotá "contribución por valorización": capturing $1.2 billion value uplift from TransMilenio BRT corridor',
        'Hong Kong MTR: rail-plus-property model capturing $20 billion+ over 40 years, financing 50% of rail construction',
        'London Crossrail: Community Infrastructure Levy and business rates supplement raising £4.4 billion towards project cost',
      ],
      prompts: [
        `import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

# Hedonic pricing model to estimate infrastructure value uplift
sales = pd.read_csv("property_sales.csv")
# fields: price, area_m2, bedrooms, age_yrs, dist_station_m, post_infra (0/1)

# Log-linear hedonic model
sales["log_price"] = np.log(sales["price"])
sales["log_area"] = np.log(sales["area_m2"])

X = sales[["log_area", "bedrooms", "age_yrs", "dist_station_m", "post_infra"]]
y = sales["log_price"]

model = LinearRegression().fit(X, y)
print("Hedonic Model Coefficients:")
for name, coef in zip(X.columns, model.coef_):
    print(f"  {name:20s}: {coef:+.4f}")
print(f"  R\u00b2: {model.score(X, y):.3f}")

# Infrastructure premium
infra_premium = (np.exp(model.coef_[4]) - 1) * 100
print(f"\\nInfrastructure value uplift: {infra_premium:+.1f}%")

# Distance decay
prox_effect = model.coef_[3] * 100  # per 100m distance
print(f"Distance decay: {prox_effect:.2f}% per 100m from station")

# Capture revenue estimation
avg_price = sales["price"].mean()
n_properties_in_zone = 5000
capture_rate = 0.20  # 20% capture rate
revenue = n_properties_in_zone * avg_price * (infra_premium / 100) * capture_rate
print(f"\\nEstimated capture revenue ({capture_rate*100:.0f}% rate): \${revenue:,.0f}")`,
      ],
      evidence: [
        'Smolka, M. O. (2013). Implementing Value Capture in Latin America: Policies and Tools for Urban Development. Lincoln Institute of Land Policy.',
        'Suzuki, H. et al. (2015). Financing Transit-Oriented Development with Land Values. World Bank.',
      ],
      limitations:
        'Land value data is often proprietary or incomplete. Political feasibility varies.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.a'],
    },
    {
      id: 'pol-impact-fee',
      title: 'Impact Fee & Developer Obligations',
      sectionId: 'policy_instruments',
      summary:
        'Calculate proportional infrastructure impact fees for new development based on trip ' +
        'generation, utility demand, and social infrastructure need.',
      tags: ['policy', 'economic', 'governance', 'water', 'energy'],
      methodology:
        '1. Forecast demand from proposed development (trips, water, school seats).\n' +
        '2. Determine unit cost of additional infrastructure.\n' +
        '3. Calculate proportional fee per dwelling or m² GFA.\n' +
        '4. Compare with neighbouring jurisdictions for competitiveness.\n' +
        '5. Model cumulative revenue under projected growth rates.',
      tools: ['spreadsheet modelling', 'geopandas', 'scenario comparison'],
      datasets: [
        'Trip generation rates by land use type (ITE manual)',
        'Municipal infrastructure unit cost schedules',
        'School capacity and enrollment data by district',
        'Water/sewer capacity models with projected demand',
      ],
      examples: [
        'Austin TX: impact fee study calculating $12 500 per single-family unit across water, wastewater, roads, and parks',
        'Vancouver: Development Cost Charges raising $180M/year for infrastructure from 25 component fee schedule',
        'UK Community Infrastructure Levy: standardised levy in 130+ local authorities charging £100-400/m² for residential',
      ],
      prompts: [
        `import pandas as pd
import numpy as np

# Impact fee calculation model
# Service categories and unit costs
service_costs = pd.DataFrame([
    {"service": "Roads", "unit": "peak-hour trip", "cost_per_unit": 3200,
     "generation_rate_sfh": 1.01, "generation_rate_apt": 0.62},
    {"service": "Water supply", "unit": "GPD", "cost_per_unit": 12.50,
     "generation_rate_sfh": 250, "generation_rate_apt": 180},
    {"service": "Sewer", "unit": "GPD", "cost_per_unit": 15.00,
     "generation_rate_sfh": 200, "generation_rate_apt": 150},
    {"service": "Parks", "unit": "person", "cost_per_unit": 2800,
     "generation_rate_sfh": 2.5, "generation_rate_apt": 1.8},
    {"service": "Schools", "unit": "student", "cost_per_unit": 25000,
     "generation_rate_sfh": 0.45, "generation_rate_apt": 0.15},
])

# Calculate fee per unit by building type
for btype in ["sfh", "apt"]:
    col = f"generation_rate_{btype}"
    service_costs[f"fee_{btype}"] = service_costs[col] * service_costs["cost_per_unit"]

print("Impact Fee Schedule:")
print(service_costs[["service", "fee_sfh", "fee_apt"]].to_markdown(index=False))
print(f"\\nTotal fee per single-family home: \${service_costs['fee_sfh'].sum():,.0f}")
print(f"Total fee per apartment unit: \${service_costs['fee_apt'].sum():,.0f}")

# Revenue projection
new_sfh_units = 500
new_apt_units = 2000
revenue = new_sfh_units * service_costs["fee_sfh"].sum() + new_apt_units * service_costs["fee_apt"].sum()
print(f"\\n5-year projected revenue: \${revenue:,.0f}")`,
      ],
      evidence: [
        'Nelson, A. C. et al. (2009). A New Generation of Development Impact Fee Research. Lincoln Institute of Land Policy.',
        'Burchell, R. W. & Mukherji, S. (2003). Conventional Development Versus Managed Growth: The Costs of Sprawl. American Journal of Public Health, 93(9), 1534–1540.',
      ],
      sdgAlignment: ['SDG 11.a'],
      limitations:
        'Fee levels must balance infrastructure cost recovery against housing affordability.',
    },
    {
      id: 'pol-design-code',
      title: 'Design Code & Form-Based Regulation',
      sectionId: 'policy_instruments',
      summary:
        'Develop and evaluate form-based codes that regulate building form, massing, and frontage ' +
        'instead of prescribing use. Supports predictable street-facing outcomes and walkable urbanism.',
      tags: ['policy', 'morphology', 'placemaking', 'pedestrian'],
      methodology:
        '1. Survey existing built form conditions per transect zone.\n' +
        '2. Define regulating plan with frontage types, building envelope standards, and public space requirements.\n' +
        '3. Code building types: shop-front, rowhouse, apartment, civic.\n' +
        '4. 3D-model compliant massing envelopes.\n' +
        '5. Test code against proposed developments.\n' +
        '6. Visualise as interactive regulating map.',
      tools: ['SketchUp', 'Rhino/Grasshopper', 'CityEngine', 'Three.js'],
      datasets: [
        'Building footprint and height data for existing conditions survey',
        'Street right-of-way widths and frontage typology mapping',
        'Transect zone classification for study area',
        'Precedent form-based code documents (SmartCode, Miami 21)',
      ],
      examples: [
        'Miami 21: first citywide form-based code in a US major city, replacing Euclidean zoning with 9 transect zones',
        'Seaside FL: original New Urbanist code regulating building placement, architectural standards across 80-acre town',
        'LBCS (Land Based Classification Standards): APA standard enabling consistent form-based coding across jurisdictions',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\nimport matplotlib.patches as mpatches\n\n# Assess compliance with form-based code standards\nbuildings = gpd.read_file("buildings.gpkg")  # fields: height_m, setback_m, frontage_type, ground_floor_use\ncode_standards = {\n    "T4 General Urban": {"min_height": 7, "max_height": 15, "max_setback": 3, "min_frontage_pct": 60},\n    "T5 Urban Centre": {"min_height": 12, "max_height": 25, "max_setback": 0, "min_frontage_pct": 80},\n    "T6 Urban Core": {"min_height": 20, "max_height": 60, "max_setback": 0, "min_frontage_pct": 90},\n}\n\nresults = []\nfor zone, stds in code_standards.items():\n    zone_bldgs = buildings[buildings["transect_zone"] == zone]\n    if len(zone_bldgs) == 0:\n        continue\n    compliant = zone_bldgs[\n        (zone_bldgs["height_m"] >= stds["min_height"]) &\n        (zone_bldgs["height_m"] <= stds["max_height"]) &\n        (zone_bldgs["setback_m"] <= stds["max_setback"])\n    ]\n    pct = len(compliant) / len(zone_bldgs) * 100\n    results.append({"zone": zone, "total": len(zone_bldgs), "compliant": len(compliant), "pct": pct})\n    print(f"{zone}: {pct:.1f}% compliant ({len(compliant)}/{len(zone_bldgs)})")\n\ndf = pd.DataFrame(results)\nfig, ax = plt.subplots(figsize=(10, 5))\nax.bar(df["zone"], df["pct"], color="#F59E0B")\nax.set_ylabel("Compliance %")\nax.set_title("Form-Based Code Compliance by Transect Zone")\nax.set_ylim(0, 100)\nplt.tight_layout()\nplt.savefig("code_compliance.png", dpi=150)`,
      ],
      evidence: [
        'Parolek, D. G. et al. (2008). Form-Based Codes: A Guide for Planners, Urban Designers, Municipalities, and Developers. Wiley.',
        'Talen, E. (2009). Design by the Rules: The Historical Underpinnings of Form-Based Codes. Journal of the American Planning Association, 75(2), 144–160.',
      ],
      sdgAlignment: ['SDG 11.3'],
      limitations:
        'Form-based codes are more labour-intensive to draft than conventional zoning. ' +
        'Enforcement requires trained staff.',
    },
    {
      id: 'pol-green-building-incentive',
      title: 'Green Building Incentive Programme',
      sectionId: 'policy_instruments',
      summary:
        'Model incentive programmes (density bonuses, tax abatements, expedited permitting) ' +
        'that encourage green building certification (LEED, BREEAM, national standards).',
      tags: ['policy', 'energy', 'carbon', 'climate', 'economic'],
      methodology:
        '1. Inventory current green-certified buildings in study area.\n' +
        '2. Estimate marginal cost of certification for typical building types.\n' +
        '3. Model incentive value (density bonus m², tax savings) against cost premium.\n' +
        '4. Project uptake rates under different incentive levels.\n' +
        '5. Calculate aggregate energy/carbon savings from projected uptake.\n' +
        '6. Map spatial distribution of certified vs. eligible buildings.',
      tools: ['scenario modelling', 'geopandas', 'energy simulation'],
      datasets: [
        'Green building certification database (LEED, BREEAM, local rating)',
        'Building permit and construction cost data',
        'Energy consumption records for certified vs. non-certified buildings',
        'Property tax assessment data for incentive modelling',
      ],
      examples: [
        'Singapore BCA Green Mark: mandatory green building standard achieving 40% energy reduction across 4 400+ certified buildings',
        'Arlington County VA: density bonus programme adding 3 million ft² LEED-certified space in Rosslyn-Ballston corridor',
        'Abu Dhabi Estidama: Pearl Rating System requiring 1-Pearl minimum for all new buildings emirate-wide',
      ],
      prompts: [
        `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Green building incentive cost-benefit model
cert_levels = pd.DataFrame([
    {"level": "LEED Certified", "cost_premium_pct": 1.0, "energy_savings_pct": 15, "density_bonus_pct": 5},
    {"level": "LEED Silver", "cost_premium_pct": 2.5, "energy_savings_pct": 25, "density_bonus_pct": 10},
    {"level": "LEED Gold", "cost_premium_pct": 4.0, "energy_savings_pct": 35, "density_bonus_pct": 15},
    {"level": "LEED Platinum", "cost_premium_pct": 6.5, "energy_savings_pct": 45, "density_bonus_pct": 20},
])

# Baseline assumptions
base_cost_per_m2 = 2500  # USD
base_gfa = 10000  # m\u00b2
annual_energy_cost = 35  # USD per m\u00b2
base_rent = 300  # USD per m\u00b2/year
green_rent_premium_pct = 8  # percent

for _, row in cert_levels.iterrows():
    cost_premium = base_cost_per_m2 * base_gfa * (row["cost_premium_pct"] / 100)
    bonus_gfa = base_gfa * (row["density_bonus_pct"] / 100)
    bonus_rent_revenue = bonus_gfa * base_rent
    energy_savings = base_gfa * annual_energy_cost * (row["energy_savings_pct"] / 100)
    rent_premium = base_gfa * base_rent * (green_rent_premium_pct / 100)
    annual_benefit = energy_savings + rent_premium + bonus_rent_revenue
    payback = cost_premium / annual_benefit if annual_benefit > 0 else float("inf")
    print(f"{row['level']:20s} | Premium: \${cost_premium:>10,.0f} | Annual benefit: \${annual_benefit:>10,.0f} | Payback: {payback:.1f} yr")`,
      ],
      evidence: [
        'Chegut, A. et al. (2014). Supply, Demand and the Value of Green Buildings. Urban Studies, 51(1), 22–43.',
        'Eichholtz, P., Kok, N. & Quigley, J. M. (2010). Doing Well by Doing Good? Green Office Buildings. American Economic Review, 100(5), 2492–2509.',
      ],
      limitations:
        'Green premiums and incentive effectiveness vary by market. Certification alone ' +
        'does not guarantee operational savings.',
      sdgAlignment: ['SDG 7.3', 'SDG 11.6'],
    },

    // ── Implementation ───────────────────────────────────────
    {
      id: 'impl-phasing-timeline',
      title: 'Project Phasing & Timeline',
      sectionId: 'implementation',
      summary:
        'Develop phased implementation timelines for urban interventions, coordinating infrastructure, ' +
        'regulatory changes, and stakeholder engagement across short-term (0–2 yr), medium-term ' +
        '(2–5 yr), and long-term (5–15 yr) horizons.',
      tags: ['governance', 'policy', 'scenario'],
      methodology:
        '1. List intervention components and dependencies.\n' +
        '2. Assign each to a time horizon based on complexity and prerequisites.\n' +
        '3. Identify critical path and parallel workstreams.\n' +
        '4. Build Gantt chart with milestone markers.\n' +
        '5. Attach budget estimates per phase.\n' +
        '6. Review with stakeholders and iterate.',
      tools: ['project management tools', 'Gantt charting', 'scenario comparison'],
      datasets: [
        'Project component list with dependencies',
        'Budget estimates per component (CAPEX + OPEX)',
        'Political and fiscal cycle calendar',
        'Stakeholder availability and approval timelines',
      ],
      examples: [
        'Medellín PUI: 10-year phased urban upgrading across 12 zones, coordinating infrastructure with social programmes',
        'London Olympic Park Legacy: 25-year phased regeneration plan from 2012 Games through 2037 community development',
        'Curitiba BRT: phased rollout of 5 corridor lines over 20 years, each phase building on previous infrastructure',
      ],
      prompts: [
        `import pandas as pd\nimport matplotlib.pyplot as plt\nimport matplotlib.dates as mdates\nfrom datetime import datetime, timedelta\n\n# Project phasing Gantt chart generator\nphases = pd.DataFrame([\n    {"task": "Stakeholder consultation", "phase": "Short-term", "start": "2024-07-01", "end": "2024-12-31", "budget_m": 0.2},\n    {"task": "Detailed design", "phase": "Short-term", "start": "2024-10-01", "end": "2025-06-30", "budget_m": 1.5},\n    {"task": "Regulatory approvals", "phase": "Short-term", "start": "2025-01-01", "end": "2025-09-30", "budget_m": 0.3},\n    {"task": "Phase 1 construction: streets", "phase": "Medium-term", "start": "2025-07-01", "end": "2026-12-31", "budget_m": 8.0},\n    {"task": "Phase 2 construction: buildings", "phase": "Medium-term", "start": "2026-06-01", "end": "2028-06-30", "budget_m": 25.0},\n    {"task": "Public space activation", "phase": "Medium-term", "start": "2027-01-01", "end": "2028-12-31", "budget_m": 3.0},\n    {"task": "Phase 3: transit connection", "phase": "Long-term", "start": "2028-01-01", "end": "2031-12-31", "budget_m": 45.0},\n    {"task": "Monitoring & evaluation", "phase": "Long-term", "start": "2025-01-01", "end": "2032-12-31", "budget_m": 1.0},\n])\nphases["start"] = pd.to_datetime(phases["start"])\nphases["end"] = pd.to_datetime(phases["end"])\nphases["duration_days"] = (phases["end"] - phases["start"]).dt.days\n\n# Gantt chart\ncolours = {"Short-term": "#F59E0B", "Medium-term": "#4299E1", "Long-term": "#48BB78"}\nfig, ax = plt.subplots(figsize=(14, 6))\nfor i, row in phases.iterrows():\n    ax.barh(i, row["duration_days"], left=row["start"], color=colours[row["phase"]], edgecolor="white")\n    ax.text(row["start"] + timedelta(days=10), i, f"{row['task']} (€{row['budget_m']:.1f}M)", va="center", fontsize=8)\n\nax.set_yticks(range(len(phases)))\nax.set_yticklabels([""] * len(phases))\nax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))\nax.set_title("Project Phasing & Timeline")\nprint(f"Total budget: €{phases['budget_m'].sum():.1f}M across {len(phases)} tasks")\nplt.tight_layout()\nplt.savefig("project_gantt.png", dpi=150)`,
      ],
      evidence: [
        'UN-Habitat (2015). International Guidelines on Urban and Territorial Planning.',
        'Project Management Institute (2021). A Guide to the Project Management Body of Knowledge (PMBOK Guide), 7th ed.',
      ],
      sdgAlignment: ['SDG 11.a'],
      limitations:
        'Phasing depends on political and fiscal cycles that may shift. Long-term phases are inherently uncertain.',
    },
    {
      id: 'impl-cost-benefit',
      title: 'Cost-Benefit Analysis (CBA)',
      sectionId: 'implementation',
      summary:
        'Conduct spatial cost-benefit analysis for proposed urban projects, comparing monetised ' +
        'benefits (health, mobility, property values, emissions reduction) against investment ' +
        'and operating costs over a defined appraisal period.',
      tags: ['economic', 'policy', 'health', 'mobility', 'climate'],
      methodology:
        '1. Define project scope, base case, and appraisal period (20–30 yr).\n' +
        '2. Estimate capital and operating costs.\n' +
        '3. Quantify benefits: travel time savings, accident reduction, air quality improvement, property uplift.\n' +
        '4. Apply discount rate (social or market).\n' +
        '5. Compute NPV, BCR, and IRR.\n' +
        '6. Sensitivity analysis on key assumptions.\n' +
        '7. Present distributional analysis by income group.',
      tools: ['spreadsheet modelling', 'Python (numpy)', 'scenario comparison'],
      datasets: [
        'Project cost estimates (CAPEX, OPEX) from feasibility study',
        'Travel time and accident data for transport projects',
        'Health impact valuation data (QALY, VSL estimates)',
        'Property transaction data for value uplift assessment',
      ],
      examples: [
        'London Crossrail: £42 billion CBA showing BCR of 2.5:1 over 60-year appraisal period',
        'Copenhagen cycling infrastructure: CBA showing €0.16/km net benefit per cyclist-km (health + congestion + emissions)',
        'Bogotá TransMilenio: World Bank CBA demonstrating BCR 3.2:1 from travel time savings and accident reduction',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Cost-Benefit Analysis for urban cycling infrastructure\nappraisal_years = 30\ndiscount_rate = 0.035  # 3.5% social discount rate\n\n# Costs (\u20ac millions)\ncapex = 45  # capital cost\nannual_opex = 1.5  # annual maintenance\n\n# Annual benefits (\u20ac millions)\ntravel_time_savings = 8.0\naccident_reduction = 2.5\nhealth_benefits = 4.0  # reduced mortality, morbidity\nemission_reduction = 1.2\nproperty_uplift = 3.0\n\ntotal_annual_benefit = travel_time_savings + accident_reduction + health_benefits + emission_reduction + property_uplift\n\n# NPV calculation\nyears = np.arange(appraisal_years)\ndiscount_factors = 1 / (1 + discount_rate) ** years\n\n# Year 0: CAPEX; Years 1+: annual benefits minus OPEX\ncashflows = np.zeros(appraisal_years)\ncashflows[0] = -capex\ncashflows[1:] = total_annual_benefit - annual_opex\n\nnpv = np.sum(cashflows * discount_factors)\nbcr = np.sum((total_annual_benefit * discount_factors)[1:]) / (capex + np.sum((annual_opex * discount_factors)[1:]))\nirr = np.irr(cashflows) if hasattr(np, 'irr') else None\n\nprint("Cost-Benefit Analysis: Urban Cycling Infrastructure")\nprint("=" * 55)\nprint(f"Capital cost: \u20ac{capex:.1f}M")\nprint(f"Annual operating cost: \u20ac{annual_opex:.1f}M")\nprint(f"Annual benefits: \u20ac{total_annual_benefit:.1f}M")\nprint(f"  - Travel time savings: \u20ac{travel_time_savings:.1f}M")\nprint(f"  - Accident reduction: \u20ac{accident_reduction:.1f}M")\nprint(f"  - Health benefits: \u20ac{health_benefits:.1f}M")\nprint(f"  - Emission reduction: \u20ac{emission_reduction:.1f}M")\nprint(f"  - Property uplift: \u20ac{property_uplift:.1f}M")\nprint(f"\\nDiscount rate: {discount_rate*100:.1f}%")\nprint(f"Appraisal period: {appraisal_years} years")\nprint(f"NPV: \u20ac{npv:.1f}M")\nprint(f"BCR: {bcr:.2f}:1")\n\n# Sensitivity analysis\nfig, ax = plt.subplots(figsize=(10, 6))\nfor dr in [0.01, 0.035, 0.06, 0.08]:\n    dfs = 1 / (1 + dr) ** years\n    cumulative = np.cumsum(cashflows * dfs)\n    ax.plot(years, cumulative, label=f"Discount rate {dr*100:.0f}%")\nax.axhline(0, color="gray", linestyle="--")\nax.set_xlabel("Year")\nax.set_ylabel("Cumulative NPV (\u20acM)")\nax.set_title("CBA Sensitivity to Discount Rate")\nax.legend()\nplt.savefig("cba_sensitivity.png", dpi=150)`,
      ],
      evidence: [
        'Boardman, A. E. et al. (2017). Cost-Benefit Analysis: Concepts and Practice, 5th ed. Cambridge University Press.',
        'HM Treasury (2022). The Green Book: Central Government Guidance on Appraisal and Evaluation.',
      ],
      limitations:
        'Monetisation of non-market benefits is contentious. Discount rate choice strongly affects results.',
      sdgAlignment: ['SDG 11.a'],
    },
    {
      id: 'impl-stakeholder-mapping',
      title: 'Stakeholder Mapping & RACI',
      sectionId: 'implementation',
      summary:
        'Identify, classify, and map stakeholders by influence and interest. Produce a RACI matrix ' +
        '(Responsible, Accountable, Consulted, Informed) for each implementation component.',
      tags: ['governance', 'participation', 'policy'],
      methodology:
        '1. Brainstorm stakeholder list with project team.\n' +
        '2. Classify by power/interest quadrant.\n' +
        '3. Assign RACI roles per project component.\n' +
        '4. Identify potential blockers and champions.\n' +
        '5. Design engagement strategy per stakeholder group.\n' +
        '6. Document in a stakeholder register visualised as a matrix chart.',
      tools: ['matrix charting', 'collaborative workshop tools'],
      datasets: [
        'Project team brainstorm output of stakeholder list',
        'Organisational charts for relevant government agencies',
        'Community group directory and civil society registry',
        'Previous project stakeholder registers for reference',
      ],
      examples: [
        'World Bank Dar es Salaam DMDP: stakeholder mapping across 5 municipal councils, 12 government agencies, 40+ CBOs',
        'London Crossrail: RACI matrix for 130 organisations managing 42 km of tunnel and 10 new stations',
        'Paris Reinventing Cities: stakeholder engagement framework for 23 urban redevelopment sites with 350+ bidder teams',
      ],
      prompts: [
        `import pandas as pd\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# Stakeholder power-interest mapping\nstakeholders = pd.DataFrame([\n    {"name": "Municipal planning dept", "power": 5, "interest": 5, "role": "Accountable"},\n    {"name": "Mayor's office", "power": 5, "interest": 4, "role": "Accountable"},\n    {"name": "National transport ministry", "power": 4, "interest": 3, "role": "Consulted"},\n    {"name": "Local residents association", "power": 2, "interest": 5, "role": "Consulted"},\n    {"name": "Property developers", "power": 4, "interest": 4, "role": "Responsible"},\n    {"name": "Environmental NGO", "power": 2, "interest": 4, "role": "Consulted"},\n    {"name": "Transit operator", "power": 3, "interest": 5, "role": "Responsible"},\n    {"name": "Utility companies", "power": 3, "interest": 3, "role": "Informed"},\n    {"name": "Media", "power": 3, "interest": 2, "role": "Informed"},\n    {"name": "Academic institutions", "power": 1, "interest": 3, "role": "Consulted"},\n])\n\n# Power-Interest quadrant plot\nfig, ax = plt.subplots(figsize=(10, 8))\ncolours = {"Accountable": "#E53E3E", "Responsible": "#F59E0B", "Consulted": "#4299E1", "Informed": "#48BB78"}\nfor _, s in stakeholders.iterrows():\n    ax.scatter(s["interest"], s["power"], c=colours[s["role"]], s=200, zorder=3)\n    ax.annotate(s["name"], (s["interest"] + 0.1, s["power"] + 0.1), fontsize=8)\n\nax.axhline(3, color="gray", linestyle="--", alpha=0.5)\nax.axvline(3, color="gray", linestyle="--", alpha=0.5)\nax.set_xlabel("Interest", fontsize=12)\nax.set_ylabel("Power", fontsize=12)\nax.set_xlim(0, 6)\nax.set_ylim(0, 6)\nax.set_title("Stakeholder Power-Interest Matrix")\nax.text(1.5, 5.5, "Keep Satisfied", ha="center", fontsize=9, style="italic")\nax.text(4.5, 5.5, "Manage Closely", ha="center", fontsize=9, style="italic")\nax.text(1.5, 0.5, "Monitor", ha="center", fontsize=9, style="italic")\nax.text(4.5, 0.5, "Keep Informed", ha="center", fontsize=9, style="italic")\nplt.tight_layout()\nplt.savefig("stakeholder_matrix.png", dpi=150)`,
      ],
      evidence: [
        'Freeman, R. E. (2010). Strategic Management: A Stakeholder Approach. Cambridge University Press.',
        'Bryson, J. M. (2004). What to Do When Stakeholders Matter: Stakeholder Identification and Analysis Techniques. Public Management Review, 6(1), 21–53.',
      ],
      sdgAlignment: ['SDG 16.7', 'SDG 17.17'],
      limitations:
        'Power dynamics shift over time. Static maps need periodic updating.',
    },
    {
      id: 'impl-procurement-delivery',
      title: 'Procurement & Delivery Model',
      sectionId: 'implementation',
      summary:
        'Select and design the project delivery model — traditional design-bid-build, design-build, ' +
        'PPP/concession, or community-led — with criteria for transparency, risk allocation, ' +
        'and value for money.',
      tags: ['governance', 'economic', 'policy'],
      methodology:
        '1. Profile project characteristics: scale, complexity, risk.\n' +
        '2. Score candidate delivery models against criteria (speed, cost certainty, innovation, equity).\n' +
        '3. Assess legal and institutional prerequisites.\n' +
        '4. Draft procurement timeline and evaluation criteria.\n' +
        '5. Compare lifecycle cost estimates per model.\n' +
        '6. Present comparative summary to decision-makers.',
      tools: ['multi-criteria analysis', 'spreadsheet modelling'],
      datasets: [
        'Project risk profile and complexity assessment',
        'Legal framework for procurement in jurisdiction',
        'PPP pipeline database (World Bank PPI, EPEC)',
        'Comparable project delivery performance data',
      ],
      examples: [
        'London Thames Tideway Tunnel: regulated utility model (PPP) for £4.2 billion super-sewer project',
        'Busan-Gimhae LRT: design-build-operate PPP with 30-year concession for 24 km light rail',
        'Medellín Metrocable: public delivery model (METRO de Medellín) for 4 cable car lines serving 300 000 daily trips',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Multi-criteria delivery model comparison\nmodels = pd.DataFrame([\n    {"model": "Design-Bid-Build", "cost_certainty": 3, "speed": 2, "innovation": 2,\n     "risk_transfer": 2, "transparency": 5, "complexity": 2},\n    {"model": "Design-Build", "cost_certainty": 4, "speed": 4, "innovation": 3,\n     "risk_transfer": 3, "transparency": 4, "complexity": 3},\n    {"model": "PPP/Concession", "cost_certainty": 3, "speed": 3, "innovation": 4,\n     "risk_transfer": 5, "transparency": 2, "complexity": 5},\n    {"model": "Community-Led", "cost_certainty": 2, "speed": 2, "innovation": 4,\n     "risk_transfer": 1, "transparency": 5, "complexity": 3},\n])\n\ncriteria = ["cost_certainty", "speed", "innovation", "risk_transfer", "transparency"]\nweights = [0.25, 0.15, 0.20, 0.20, 0.20]\n\nmodels["weighted_score"] = sum(models[c] * w for c, w in zip(criteria, weights))\nprint("Delivery Model Comparison:")\nprint(models[["model", "weighted_score"] + criteria].to_markdown(index=False))\n\n# Radar chart comparison\nfrom math import pi\nfig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))\nangles = [n / float(len(criteria)) * 2 * pi for n in range(len(criteria))]\nangles += angles[:1]\n\nfor _, row in models.iterrows():\n    values = [row[c] for c in criteria]\n    values += values[:1]\n    ax.plot(angles, values, "o-", linewidth=2, label=row["model"])\n    ax.fill(angles, values, alpha=0.1)\n\nax.set_xticks(angles[:-1])\nax.set_xticklabels(criteria, fontsize=9)\nax.set_ylim(0, 5)\nax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1))\nax.set_title("Procurement Model Comparison")\nplt.tight_layout()\nplt.savefig("procurement_radar.png", dpi=150)`,
      ],
      evidence: [
        'World Bank (2017). Public-Private Partnerships Reference Guide, Version 3.0.',
        'European PPP Expertise Centre (2015). PPP Motivations and Challenges for the Public Sector. EPEC.',
      ],
      sdgAlignment: ['SDG 16.6'],
      limitations:
        'Optimal delivery model depends on institutional capacity, which varies widely.',
    },
    {
      id: 'impl-risk-register',
      title: 'Implementation Risk Register',
      sectionId: 'implementation',
      summary:
        'Establish a structured risk register for urban project implementation, covering technical, ' +
        'financial, social, environmental, and political risks with mitigation strategies.',
      tags: ['governance', 'scenario', 'policy'],
      methodology:
        '1. Conduct risk identification workshop with stakeholders.\n' +
        '2. Categorise risks: technical, financial, social, environmental, political.\n' +
        '3. Assess likelihood and impact (5×5 matrix).\n' +
        '4. Calculate risk score; rank in priority order.\n' +
        '5. Assign risk owners and mitigation actions.\n' +
        '6. Schedule review cadence (monthly during active implementation).',
      tools: ['risk matrix tools', 'spreadsheet', 'workshop facilitation'],
      datasets: [
        'Project component list and timeline',
        'Historical risk databases from comparable projects',
        'Climate hazard data for environmental risk assessment',
        'Stakeholder concern register from consultation process',
      ],
      examples: [
        'Crossrail UK: 1 400-entry risk register actively managed across 12 contract packages over 12 years',
        'World Bank Afghanistan Urban WASH: risk register tracking security, procurement, and climate risks across 34 provinces',
        'Singapore MRT Thomson-East Coast Line: geotechnical risk register for 43 km tunnel with 285 risk items',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Risk register with scoring and visualisation\nrisks = pd.DataFrame([\n    {"id": "R01", "category": "Technical", "risk": "Unexpected ground conditions",\n     "likelihood": 3, "impact": 5, "owner": "Project engineer",\n     "mitigation": "Additional geotechnical survey before Phase 2"},\n    {"id": "R02", "category": "Financial", "risk": "Construction cost overrun >20%",\n     "likelihood": 3, "impact": 4, "owner": "Finance manager",\n     "mitigation": "15% contingency budget; value engineering review"},\n    {"id": "R03", "category": "Social", "risk": "Community opposition to land acquisition",\n     "likelihood": 4, "impact": 4, "owner": "Stakeholder manager",\n     "mitigation": "Early engagement; fair compensation; livelihood restoration plan"},\n    {"id": "R04", "category": "Environmental", "risk": "Flood event during construction",\n     "likelihood": 2, "impact": 4, "owner": "Site manager",\n     "mitigation": "Seasonal construction schedule; temporary flood barriers"},\n    {"id": "R05", "category": "Political", "risk": "Change of government delays approvals",\n     "likelihood": 2, "impact": 5, "owner": "Project director",\n     "mitigation": "Multi-party support; lock in approvals before election"},\n    {"id": "R06", "category": "Technical", "risk": "Utility relocation delays",\n     "likelihood": 4, "impact": 3, "owner": "Utilities coordinator",\n     "mitigation": "Early utility survey; parallel relocation works"},\n])\n\nrisks["score"] = risks["likelihood"] * risks["impact"]\nrisks["rating"] = pd.cut(risks["score"], bins=[0, 6, 12, 25], labels=["Low", "Medium", "High"])\n\nprint("Risk Register:")\nprint(risks[["id", "category", "risk", "score", "rating", "owner"]].to_markdown(index=False))\n\n# Risk matrix heatmap\nmatrix = np.zeros((5, 5))\nfor _, r in risks.iterrows():\n    matrix[r["likelihood"] - 1, r["impact"] - 1] += 1\n\nfig, ax = plt.subplots(figsize=(8, 6))\nim = ax.imshow(matrix, cmap="YlOrRd", origin="lower", vmin=0, vmax=max(3, matrix.max()))\nfor i in range(5):\n    for j in range(5):\n        if matrix[i, j] > 0:\n            ax.text(j, i, f"{int(matrix[i, j])}", ha="center", va="center", fontsize=14, fontweight="bold")\nax.set_xticks(range(5))\nax.set_yticks(range(5))\nax.set_xticklabels(["Very Low", "Low", "Medium", "High", "Very High"])\nax.set_yticklabels(["Very Low", "Low", "Medium", "High", "Very High"])\nax.set_xlabel("Impact")\nax.set_ylabel("Likelihood")\nax.set_title("Risk Matrix")\nplt.colorbar(im, label="Number of risks")\nplt.tight_layout()\nplt.savefig("risk_matrix.png", dpi=150)`,
      ],
      evidence: [
        'ISO 31000:2018. Risk Management — Guidelines. International Organization for Standardization.',
        'Chapman, R. J. (2011). Simple Tools and Techniques for Enterprise Risk Management, 2nd ed. Wiley.',
      ],
      sdgAlignment: ['SDG 11.a'],
      limitations:
        'Risk registers are only useful if actively maintained. Unknown-unknowns are inherently uncaptured.',
    },
  ];
}
