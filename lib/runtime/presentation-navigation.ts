import { PresentationConfig } from '@/lib/types/presentation';

export type ParsedPresentationHash =
  | { kind: 'stage-step'; value: string | number }
  | { kind: 'map-cluster'; clusterId: string };

export type PresentationNavigationTarget =
  | { kind: 'stage-step'; stepIndex: number }
  | { kind: 'map-cluster'; clusterId: string };

const COMPACT_STAGE_VIEWPORT_MAX_WIDTH = 900;

export function isCompactStageViewport(viewportWidth: number) {
  return viewportWidth <= COMPACT_STAGE_VIEWPORT_MAX_WIDTH;
}

export function parsePresentationHash(hash: string): ParsedPresentationHash | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('step-')) {
    const rawValue = normalized.slice(5).trim();
    if (!rawValue) {
      return null;
    }

    if (/^\d+$/.test(rawValue)) {
      const parsed = Number.parseInt(rawValue, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
      }

      return {
        kind: 'stage-step',
        value: parsed
      };
    }

    return {
      kind: 'stage-step',
      value: rawValue
    };
  }

  if (normalized.startsWith('cluster-')) {
    const clusterId = normalized.slice(8).trim();
    if (!clusterId) {
      return null;
    }

    return {
      kind: 'map-cluster',
      clusterId
    };
  }

  return null;
}

export function resolvePresentationNavigationTarget(
  presentation: PresentationConfig,
  parsedHash: ParsedPresentationHash
): PresentationNavigationTarget | null {
  if (parsedHash.kind === 'stage-step') {
    const steps = presentation.steps ?? [];
    if (steps.length === 0) {
      return null;
    }

    if (typeof parsedHash.value === 'number') {
      const stepIndex = parsedHash.value - 1;
      return stepIndex >= 0 && stepIndex < steps.length
        ? { kind: 'stage-step', stepIndex }
        : null;
    }

    const stepIndex = steps.findIndex((step) => step.id === parsedHash.value);
    return stepIndex >= 0 ? { kind: 'stage-step', stepIndex } : null;
  }

  const clusters = presentation.clusters ?? [];
  return clusters.some((cluster) => cluster.id === parsedHash.clusterId)
    ? { kind: 'map-cluster', clusterId: parsedHash.clusterId }
    : null;
}

export function serializePresentationHash(
  presentation: PresentationConfig,
  target: PresentationNavigationTarget
): string | null {
  if (target.kind === 'stage-step') {
    const step = presentation.steps?.[target.stepIndex];
    if (!step) {
      return null;
    }

    return step.id ? `#step-${step.id}` : `#step-${target.stepIndex + 1}`;
  }

  if (!(presentation.clusters ?? []).some((cluster) => cluster.id === target.clusterId)) {
    return null;
  }

  return `#cluster-${target.clusterId}`;
}
