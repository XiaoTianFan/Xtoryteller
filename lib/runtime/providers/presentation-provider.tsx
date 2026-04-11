'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

import { resolveTheme } from '@/lib/engine/theme-resolver';
import {
  PresentationNavigationTarget,
  parsePresentationHash,
  resolvePresentationNavigationTarget,
  serializePresentationHash
} from '@/lib/runtime/presentation-navigation';
import { usePresentationMachine } from '@/lib/runtime/use-presentation-machine';
import { PresentationConfig } from '@/lib/types/presentation';
import { ThemeConfig } from '@/lib/types/theme';

interface PresentationRuntimeValue {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  machine: ReturnType<typeof usePresentationMachine>;
}

const PresentationContext = createContext<PresentationRuntimeValue | null>(null);

function isTargetActive(
  machine: ReturnType<typeof usePresentationMachine>,
  target: PresentationNavigationTarget
) {
  if (target.kind === 'stage-step') {
    return machine.state.context.currentStepIndex === target.stepIndex;
  }

  return machine.state.context.currentClusterId === target.clusterId;
}

function navigateToTarget(
  machine: ReturnType<typeof usePresentationMachine>,
  target: PresentationNavigationTarget
) {
  if (target.kind === 'stage-step') {
    machine.goToStep(target.stepIndex);
    return;
  }

  machine.flyToCluster(target.clusterId);
}

function updateBrowserHash(hash: string, replace: boolean) {
  if (typeof window === 'undefined' || window.location.hash === hash) {
    return;
  }

  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  if (replace) {
    window.history.replaceState(window.history.state, '', nextUrl);
    return;
  }

  window.history.pushState(window.history.state, '', nextUrl);
}

function PresentationLocationSync({
  presentation,
  machine
}: {
  presentation: PresentationConfig;
  machine: ReturnType<typeof usePresentationMachine>;
}) {
  const currentHash = useMemo(() => {
    if (presentation.mode === 'stage') {
      return serializePresentationHash(presentation, {
        kind: 'stage-step',
        stepIndex: machine.state.context.currentStepIndex
      });
    }

    const clusterId = machine.state.context.currentClusterId;
    return clusterId
      ? serializePresentationHash(presentation, {
          kind: 'map-cluster',
          clusterId
        })
      : null;
  }, [
    machine.state.context.currentClusterId,
    machine.state.context.currentStepIndex,
    presentation
  ]);
  const machineRef = useRef(machine);
  const currentHashRef = useRef(currentHash);
  const lastHashRef = useRef<string | null>(currentHash);
  const readyRef = useRef(false);
  const hashDrivenRef = useRef(false);

  useEffect(() => {
    machineRef.current = machine;
    currentHashRef.current = currentHash;
  }, [currentHash, machine, machine.state.context.currentClusterId, machine.state.context.currentStepIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFromHash = () => {
      const activeMachine = machineRef.current;
      const parsed = parsePresentationHash(window.location.hash);
      const target = parsed ? resolvePresentationNavigationTarget(presentation, parsed) : null;
      if (!target) {
        hashDrivenRef.current = false;
        return;
      }

      if (isTargetActive(activeMachine, target)) {
        hashDrivenRef.current = false;
        return;
      }

      hashDrivenRef.current = true;
      navigateToTarget(activeMachine, target);
    };

    syncFromHash();
    const initialHash = currentHashRef.current;
    if (!window.location.hash && initialHash) {
      updateBrowserHash(initialHash, true);
      lastHashRef.current = initialHash;
    }

    readyRef.current = true;
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [presentation]);

  useEffect(() => {
    if (!readyRef.current || !currentHash) {
      return;
    }

    const previousHash = lastHashRef.current;
    lastHashRef.current = currentHash;
    if (previousHash == null || previousHash === currentHash) {
      return;
    }

    if (typeof window === 'undefined' || window.location.hash === currentHash) {
      hashDrivenRef.current = false;
      return;
    }

    updateBrowserHash(currentHash, hashDrivenRef.current);
    hashDrivenRef.current = false;
  }, [currentHash]);

  return null;
}

export function PresentationProvider({
  presentation,
  theme,
  children
}: {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  children: ReactNode;
}) {
  const machine = usePresentationMachine(presentation);
  const resolvedTheme = useMemo(
    () => resolveTheme(theme, presentation.themeOverrides).theme,
    [presentation.themeOverrides, theme]
  );
  const value = useMemo(
    () => ({ presentation, theme: resolvedTheme, machine }),
    [machine, presentation, resolvedTheme]
  );

  return (
    <PresentationContext.Provider value={value}>
      <PresentationLocationSync presentation={presentation} machine={machine} />
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentationRuntime() {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentationRuntime must be used inside PresentationProvider');
  }

  return context;
}
