import { createContext, ReactNode, useContext } from 'react';

const AnnotationContext = createContext<Record<string, string>>({});

export function normalizeAnnotationKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AnnotationProvider({ annotations, children }: { annotations?: Record<string, string>; children: ReactNode }) {
  return <AnnotationContext.Provider value={annotations ?? {}}>{children}</AnnotationContext.Provider>;
}

export function useAnnotations() {
  return useContext(AnnotationContext);
}
