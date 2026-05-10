import { useMemo } from 'react';
import { listGeoAIModelProfiles } from '../models';

export function useGeoAIModelProfiles() {
  return useMemo(() => listGeoAIModelProfiles(), []);
}
