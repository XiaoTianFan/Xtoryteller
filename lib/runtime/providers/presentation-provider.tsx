'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';

import { usePresentationMachine } from '@/lib/runtime/use-presentation-machine';
import { PresentationConfig } from '@/lib/types/presentation';
import { ThemeConfig } from '@/lib/types/theme';

interface PresentationRuntimeValue {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  machine: ReturnType<typeof usePresentationMachine>;
}

const PresentationContext = createContext<PresentationRuntimeValue | null>(null);

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
  const value = useMemo(
    () => ({ presentation, theme, machine }),
    [machine, presentation, theme]
  );

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

export function usePresentationRuntime() {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentationRuntime must be used inside PresentationProvider');
  }

  return context;
}
