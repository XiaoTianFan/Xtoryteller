import { ReactNode } from 'react';

import { resolveThemeAssets } from '@/lib/engine/theme-asset-resolver';
import { themeVariablesToCss } from '@/lib/engine/theme-resolver';
import { ThemeConfig } from '@/lib/types/theme';

export function ThemeProvider({
  theme,
  overrides,
  children
}: {
  theme: ThemeConfig;
  overrides?: unknown;
  children: ReactNode;
}) {
  const assets = resolveThemeAssets(theme, overrides);

  return (
    <>
      {assets.preconnectOrigins.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}
      {assets.stylesheetUrls.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style>{themeVariablesToCss(assets.cssVariables)}</style>
      {assets.fontFaceCss ? <style>{assets.fontFaceCss}</style> : null}
      {children}
    </>
  );
}
