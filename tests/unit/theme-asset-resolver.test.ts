import { buildGoogleFontStylesheetUrl, resolveThemeAssets } from '@/lib/engine/theme-asset-resolver';
import { ThemeConfig } from '@/lib/types/theme';

const theme: ThemeConfig = {
  name: 'Asset Test',
  fonts: {
    heading: {
      family: 'EB Garamond',
      source: 'google',
      weights: [400, 700],
      styles: ['normal', 'italic'],
      display: 'swap',
      fallbacks: ['serif']
    },
    body: {
      family: 'Test Local',
      source: 'local',
      files: [
        { path: '/fonts/test-local/regular.woff2', weight: 400 },
        { path: '/fonts/test-local/italic.woff2', weight: 400, style: 'italic' }
      ],
      fallbacks: ['serif']
    },
    mono: {
      family: 'Cabinet Grotesk',
      source: 'fontshare',
      cssUrl: 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500',
      fallbacks: ['monospace']
    }
  },
  colors: {
    background: '#ffffff',
    surface: '#fafafa',
    panel: '#f0f0f0',
    foreground: '#111111',
    muted: '#666666',
    border: '#dddddd',
    primary: '#222222',
    secondary: '#333333',
    accent: '#444444',
    success: '#228b22',
    warning: '#ff8c00',
    error: '#cc3333',
    overlay: 'rgba(255,255,255,0.8)'
  },
  typography: { h1: '1rem', h2: '1rem', h3: '1rem', body: '1rem', small: '1rem', lead: '1rem', code: '1rem' },
  spacing: { page: '1rem', section: '1rem', gap: '1rem', cluster: '1rem' },
  radii: { small: '1px', medium: '2px', large: '3px', pill: '999px' },
  shadows: { soft: '0 1px 2px rgba(0,0,0,0.1)', strong: '0 2px 4px rgba(0,0,0,0.2)' },
  borders: { subtle: '1px solid #ddd', strong: '1px solid #999' },
  motion: { fast: '100ms', normal: '200ms', slow: '300ms', easing: 'ease-in-out' }
};

describe('theme asset resolver', () => {
  it('builds stable Google font stylesheet URLs', () => {
    expect(buildGoogleFontStylesheetUrl(theme.fonts.heading)).toBe(
      'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap'
    );
  });

  it('emits font-face css, stylesheets, and preconnect origins', () => {
    const resolved = resolveThemeAssets(theme);

    expect(resolved.cssVariables['--font-heading']).toContain('EB Garamond');
    expect(resolved.fontFaceCss).toContain('@font-face');
    expect(resolved.fontFaceCss).toContain('/fonts/test-local/regular.woff2');
    expect(resolved.stylesheetUrls).toHaveLength(2);
    expect(resolved.stylesheetUrls.some((href) => href.includes('fonts.googleapis.com'))).toBe(true);
    expect(resolved.stylesheetUrls.some((href) => href.includes('fontshare.com'))).toBe(true);
    expect(resolved.preconnectOrigins).toContain('https://fonts.googleapis.com');
    expect(resolved.preconnectOrigins).toContain('https://fonts.gstatic.com');
  });

  it('dedupes repeated remote stylesheet and local font-face assets', () => {
    const duplicateTheme: ThemeConfig = {
      ...theme,
      fonts: {
        heading: theme.fonts.body,
        body: theme.fonts.body,
        mono: theme.fonts.heading
      }
    };

    const resolved = resolveThemeAssets(duplicateTheme);
    expect(resolved.fontFaceCss.match(/@font-face/g)).toHaveLength(2);
    expect(resolved.stylesheetUrls.filter((href) => href.includes('fonts.googleapis.com'))).toHaveLength(1);
  });
});
