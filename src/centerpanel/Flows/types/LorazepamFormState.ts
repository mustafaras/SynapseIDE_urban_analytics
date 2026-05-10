export interface SensitivityAnalysisFormState {

  analysisContext: string;

  baselineParameters: string;

  inputVariations: string;

  observedResponse: string;

  sensitivityDetails: string;

  immediateFindings: string;

  validationObservations: string;

  monitoringPlan: string;

  reassessmentNeeds: string;

}

/** @deprecated Use SensitivityAnalysisFormState */
export type LorazepamFormState = SensitivityAnalysisFormState;
