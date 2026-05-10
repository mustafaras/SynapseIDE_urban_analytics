



export const GLOBAL_FLOW_SUBTITLE =
  "This structured flow supports analysis documentation and does not constitute policy directives.";

export const GLOBAL_WARN_NEUTRAL_LANGUAGE =
  "Use precise, verifiable language. Document methodology and assumptions clearly.";



export const GLOBAL_FLOW_BOUNDARY_LINE =
  "This documentation supports analytical communication and quality assurance. It is not a policy directive, regulatory determination, or binding recommendation.";


export const GLOBAL_BOUNDARY_LINE = GLOBAL_FLOW_BOUNDARY_LINE;


export const NOTE_GLOBAL_FOOTER =
  "This session note is prepared to support communication and continuity of analysis. It is not a policy directive or binding recommendation.";


export const NOTE_SECTION_DISCLAIMER =
  "Section content supports analytical communication and continuity. It is not a policy directive or binding recommendation.";




export const SAFETY_WARN =
  "If data quality or integrity concerns are identified, escalate review per team lead and established protocols. Use precise, verifiable language. This documentation does not replace real-time quality checks.";

export const ANOMALY_WARN =
  "Use precise, observable language when documenting data anomalies. Document potential contributing factors evaluated (sensor drift, collection error, temporal mismatch). Describe quality assurance steps attempted and rationale for any data exclusion. This documentation does not itself authorize data removal or modification. Escalate per team lead and established protocols.";

/** @deprecated Use ANOMALY_WARN */
export const AGITATION_WARN = ANOMALY_WARN;

export const CAPACITY_WARN =
  "This assessment documents the project's data fitness across four domains: (1) Completeness of spatial coverage; (2) Temporal resolution relative to analysis requirements; (3) Consistency with established data standards; and (4) Documented provenance and chain of custody.\nThis note supports analytical communication and handoff. It is not, by itself, a regulatory determination or binding recommendation. Escalate data quality concerns per team lead and established protocols.";

export const SPATIAL_PATTERN_WARN =
  "Document observable spatial patterns and statistical indicators in precise, descriptive language. Consider methodological contributors (edge effects, modifiable areal unit problem, ecological fallacy). This form supports communication and ongoing monitoring and does not, by itself, constitute a final determination.";

/** @deprecated Use SPATIAL_PATTERN_WARN */
export const CATATONIA_WARN = SPATIAL_PATTERN_WARN;

export const OBSERVATION_WARN =
  "Use precise, time-linked, observable language when describing anomalies and outliers. Document validation strategies attempted (cross-referencing, ground truth comparison) and why those were insufficient for resolution. Describe current data status as a provisional, time-limited classification pending further review. This form supports communication and quality monitoring.";

export const SENSITIVITY_WARN =
  "If a sensitivity analysis is conducted, document the analytical rationale, baseline parameters, tested variations, observed response, and confidence intervals. This documentation does not itself constitute a final recommendation. Escalate per team lead and established protocols.";

/** @deprecated Use SENSITIVITY_WARN */
export const LORAZEPAM_WARN = SENSITIVITY_WARN;


export const FLOW_LABELS = {
  safety: "Data Quality Review",
  change_detection: "Anomaly Detection & Resolution",
  capacity: "Data Fitness Assessment",
  urban_morphology: "Spatial Pattern Analysis",
  scenario_comparison: "Sensitivity Analysis",
  observation: "Monitoring & Validation",
  /** @deprecated */ agitation: "Anomaly Detection & Resolution",
  /** @deprecated */ catatonia: "Spatial Pattern Analysis",
  /** @deprecated */ lorazepam: "Sensitivity Analysis",
} as const;
