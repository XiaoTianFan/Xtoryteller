import { describe, expect, it } from 'vitest';

import {
  isCompactStageViewport,
  parsePresentationHash,
  resolvePresentationNavigationTarget,
  serializePresentationHash
} from '@/lib/runtime/presentation-navigation';
import { PresentationConfig } from '@/lib/types/presentation';

const presentation: PresentationConfig = {
  meta: {
    title: 'Test deck',
    slug: 'test-deck'
  },
  mode: 'stage',
  steps: [
    { id: 'opening', layout: 'stack', components: [] },
    { layout: 'stack', components: [] },
    { id: 'closing', layout: 'stack', components: [] }
  ],
  clusters: [
    { id: 'overview', layout: 'stack', components: [] },
    { id: 'context', layout: 'stack', components: [] }
  ]
};

describe('presentation navigation helpers', () => {
  it('parses supported hash formats and rejects invalid values', () => {
    expect(parsePresentationHash('#step-opening')).toEqual({ kind: 'stage-step', value: 'opening' });
    expect(parsePresentationHash('#step-3')).toEqual({ kind: 'stage-step', value: 3 });
    expect(parsePresentationHash('#cluster-overview')).toEqual({ kind: 'map-cluster', clusterId: 'overview' });
    expect(parsePresentationHash('#step-0')).toBeNull();
    expect(parsePresentationHash('#unknown-target')).toBeNull();
    expect(parsePresentationHash('')).toBeNull();
  });

  it('resolves parsed hashes against presentation content', () => {
    expect(resolvePresentationNavigationTarget(presentation, { kind: 'stage-step', value: 'opening' })).toEqual({ kind: 'stage-step', stepIndex: 0 });
    expect(resolvePresentationNavigationTarget(presentation, { kind: 'stage-step', value: 2 })).toEqual({ kind: 'stage-step', stepIndex: 1 });
    expect(resolvePresentationNavigationTarget(presentation, { kind: 'map-cluster', clusterId: 'context' })).toEqual({ kind: 'map-cluster', clusterId: 'context' });
    expect(resolvePresentationNavigationTarget(presentation, { kind: 'stage-step', value: 'missing' })).toBeNull();
    expect(resolvePresentationNavigationTarget(presentation, { kind: 'map-cluster', clusterId: 'missing' })).toBeNull();
  });

  it('serializes canonical stage and map hashes', () => {
    expect(serializePresentationHash(presentation, { kind: 'stage-step', stepIndex: 0 })).toBe('#step-opening');
    expect(serializePresentationHash(presentation, { kind: 'stage-step', stepIndex: 1 })).toBe('#step-2');
    expect(serializePresentationHash(presentation, { kind: 'map-cluster', clusterId: 'overview' })).toBe('#cluster-overview');
    expect(serializePresentationHash(presentation, { kind: 'map-cluster', clusterId: 'missing' })).toBeNull();
  });

  it('detects compact stage viewport widths around the 900px breakpoint', () => {
    expect(isCompactStageViewport(900)).toBe(true);
    expect(isCompactStageViewport(899)).toBe(true);
    expect(isCompactStageViewport(901)).toBe(false);
  });
});
