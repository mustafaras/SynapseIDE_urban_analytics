import { describe, expect, it } from 'vitest';

import { FLOW_LIBRARY_ITEMS } from '../../../centerpanel/Flows/flowLibraryMeta';
import {
  validateUrbanMethodMetadata,
  validateUrbanMethodValidityEnvelope,
} from '../context/methodValidity';
import { getIndicatorDefinition } from '../indicators/catalog';
import { buildFullLibrary } from '../seeds';

describe('Urban method validity metadata', () => {
  it('attaches a complete validity envelope to the representative method card preset', () => {
    const library = buildFullLibrary();
    const card = library.find((candidate) => candidate.id === 'ss-morans-i');

    if (!card) {
      throw new Error('Representative Moran method card is missing');
    }

    expect(card?.validityEnvelope?.methodFamily).toBe('spatial-statistics');
    expect(card?.capabilityStatus).toBe('implemented');

    const validation = validateUrbanMethodMetadata({
      id: card.id,
      title: card.title,
      sourceKind: 'method-card',
      ...(card.validityEnvelope ? { validityEnvelope: card.validityEnvelope } : {}),
      ...(card.capabilityStatus ? { capabilityStatus: card.capabilityStatus } : {}),
    });

    expect(validation.ok).toBe(true);
    expect(validation.status).toBe('complete');
    expect(validation.readinessStatus).toBe('ready');
    expect(validation.missingFields).toEqual([]);
  });

  it('keeps unannotated method cards truthful through a missing-metadata fallback', () => {
    const library = buildFullLibrary();
    const card = library.find((candidate) => candidate.id === 'ss-lisa-clusters');

    if (!card) {
      throw new Error('Representative unannotated LISA method card is missing');
    }

    expect(card?.validityEnvelope).toBeUndefined();

    const validation = validateUrbanMethodMetadata({
      id: card.id,
      title: card.title,
      sourceKind: 'method-card',
      ...(card.validityEnvelope ? { validityEnvelope: card.validityEnvelope } : {}),
      ...(card.capabilityStatus ? { capabilityStatus: card.capabilityStatus } : {}),
    });

    expect(validation.ok).toBe(false);
    expect(validation.status).toBe('missing');
    expect(validation.capabilityStatus).toBe('residual_gap');
    expect(validation.readinessStatus).toBe('needs-context');
    expect(validation.missingFields).toContain('validityEnvelope');
    expect(validation.envelope.interpretationWarnings[0]).toContain('Method validity metadata is missing');
  });

  it('attaches representative indicator metadata without changing catalog lookup behavior', () => {
    const definition = getIndicatorDefinition('modeSplit');

    if (!definition) {
      throw new Error('Representative modeSplit indicator is missing');
    }

    expect(definition?.validityEnvelope?.methodFamily).toBe('indicator');
    expect(definition?.validityEnvelope?.requiredFields).toEqual([
      'walkTrips',
      'cycleTrips',
      'transitTrips',
      'carTrips',
    ]);
    expect(definition?.capabilityStatus).toBe('implemented');

    const validation = validateUrbanMethodMetadata({
      id: definition.kind,
      title: definition.title,
      sourceKind: 'indicator',
      ...(definition.validityEnvelope ? { validityEnvelope: definition.validityEnvelope } : {}),
      ...(definition.capabilityStatus ? { capabilityStatus: definition.capabilityStatus } : {}),
    });

    expect(validation.status).toBe('complete');
    expect(validation.readinessStatus).toBe('ready');
  });

  it('attaches representative workflow metadata in the flow library', () => {
    const workflow = FLOW_LIBRARY_ITEMS.find((item) => item.flowId === 'accessibility');

    if (!workflow) {
      throw new Error('Representative accessibility workflow is missing');
    }

    expect(workflow?.validityEnvelope?.methodFamily).toBe('network-analysis');
    expect(workflow?.validityEnvelope?.requiresProjectedCrs).toBe(true);
    expect(workflow?.capabilityStatus).toBe('implemented');

    const validation = validateUrbanMethodMetadata({
      id: workflow.flowId,
      title: workflow.title,
      sourceKind: 'workflow',
      ...(workflow.validityEnvelope ? { validityEnvelope: workflow.validityEnvelope } : {}),
      ...(workflow.capabilityStatus ? { capabilityStatus: workflow.capabilityStatus } : {}),
    });

    expect(validation.ok).toBe(true);
    expect(validation.status).toBe('complete');
    expect(validation.readinessStatus).toBe('ready');
  });

  it('labels partial metadata as incomplete instead of silently treating it as ready', () => {
    const validation = validateUrbanMethodValidityEnvelope({
      validSpatialScales: ['city'],
      capabilityStatus: 'demo_mode',
    });

    expect(validation.ok).toBe(false);
    expect(validation.status).toBe('partial');
    expect(validation.readinessStatus).toBe('demo-only');
    expect(validation.missingFields).toContain('requiredDataTypes');
    expect(validation.missingFields).toContain('requiredFields');
    expect(validation.warnings.some((warning) => warning.includes('incomplete method validity metadata'))).toBe(true);
  });
});
