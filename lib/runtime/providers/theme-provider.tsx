'use client';

import { ReactNode } from 'react';

import { resolveTheme, themeVariablesToCss } from '@/lib/engine/theme-resolver';
import { PresentationConfig } from '@/lib/types/presentation';
import { ThemeConfig } from '@/lib/types/theme';

export function ThemeProvider({
  presentation,
  theme,
  children
}: {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  children: ReactNode;
}) {
  const resolved = resolveTheme(theme, presentation.themeOverrides);

  return (
    <>
      <style>{themeVariablesToCss(resolved.cssVariables)}</style>
      {children}
    </>
  );
}
