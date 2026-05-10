export interface AnomalyResolutionFormState {

  objectiveBehavior: string;
  severityProfile: "" | "minor_deviation" | "moderate_anomaly" | "significant_outlier" | "critical_error" | "not_assessed";
  contributorsConsidered: string;

  resolutionTechniques: {
    dataReview: boolean;
    crossValidation: boolean;
    sensorRecalibration: boolean;
    sourceVerification: boolean;
    interpolation: boolean;
    boundaryAdjustment: boolean;
    otherMethodological: boolean;
  };
  resolutionNarrative: string;
  responseToResolution: "" | "resolved" | "partially_resolved" | "no_effect" | "escalated";

  escalationTypeDiscussed: "" | "methodology_review" | "additional_data_collection" | "expert_consultation" | "data_exclusion" | "not_applicable";
  leastDisruptiveSummary: string;
  escalationRationale: string;

  postResolutionStatus: string;
  reassessmentPlan: string;
  teamNotified: string;
}

/** @deprecated Use AnomalyResolutionFormState */
export type AgitationFormState = AnomalyResolutionFormState;
