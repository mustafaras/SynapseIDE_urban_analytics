export interface SpatialPatternFormState {

  observedFeatures: {
    spatialClustering: boolean;
    hotspotDetected: boolean;
    coldspotDetected: boolean;
    linearPattern: boolean;
    dispersedPattern: boolean;
    edgeEffect: boolean;
    scaleDependent: boolean;
    temporalShift: boolean;
    outlierPresent: boolean;
    boundaryEffect: boolean;
  };
  observedNarrative: string;

  methodologicalConsiderations: string;
  dataQualityStatus: string;
  validationNotes: string;

  severityLevel: string;

  functionalImpact: string;

  riskFactors: string;

  monitoringPlan: string;

  handoffCommunication: string;

}

/** @deprecated Use SpatialPatternFormState */
export type CatatoniaFormState = SpatialPatternFormState;
