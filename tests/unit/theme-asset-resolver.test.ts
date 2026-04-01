import {
  buildGoogleFontStylesheetUrl,
  resolveThemeAssets,
} from '@/lib/engine/theme-asset-resolver';
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
      fallbacks: ['serif'],
    },
    body: {
      family: 'Test Local',
      source: 'local',
      files: [
        { path: '/fonts/test-local/regular.woff2', weight: 400 },
        {
          path: '/fonts/test-local/italic.woff2',
          weight: 400,
          style: 'italic',
        },
      ],
      fallbacks: ['serif'],
    },
    mono: {
      family: 'Cabinet Grotesk',
      source: 'fontshare',
      cssUrl: 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500',
      fallbacks: ['monospace'],
    },
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
    overlay: 'rgba(255,255,255,0.8)',
  },
  typography: {
    h1: '1rem',
    h2: '1rem',
    h3: '1rem',
    body: '1rem',
    small: '1rem',
    lead: '1rem',
    code: '1rem',
    components: {
      shell: {
        eyebrow: '0.8rem',
        hero: '2rem',
        lead: '1rem',
        'card-title': '1.25rem',
      },
      feature: {
        title: '1.25rem',
      },
      stat: {
        value: '2rem',
      },
      diagram: {
        label: '14px',
      },
    },
  },
  spacing: {
    page: '1rem',
    section: '1rem',
    gap: '1rem',
    cluster: '1rem',
    chrome: {
      'page-padding': '1rem',
      'tools-gap': '1rem',
      'control-height': '3rem',
      'card-padding': '1rem',
      'dock-open-height': '24rem',
      'overlay-panel-padding': '1rem',
    },
    components: {
      card: { padding: '1rem' },
      list: { 'padding-start': '1rem' },
      timeline: { 'item-padding': '1rem' },
      annotation: { 'popover-padding-y': '1rem' },
      code: { 'body-padding': '1rem' },
      diagram: { 'caption-gap': '1rem' },
    },
    layouts: {
      compact: {
        padding: '1rem',
        gap: '1rem',
      },
    },
  },
  sizing: {
    components: {
      shell: {
        'hero-max-width': '60rem',
        'card-grid-min-width': '260px',
        'shortcut-panel-width': '32rem',
      },
      feature: { icon: '2rem' },
      profile: { avatar: '4rem' },
      timeline: { marker: '2rem' },
      annotation: { 'popover-width': '20rem' },
      media: { 'image-max-height': '420px', 'iframe-min-height': '320px' },
      spectrum: { 'vertical-min-height': '18rem' },
    },
    layouts: {
      'single-content-max-width': '78rem',
      'gallery-item-min-width': '220px',
      'scattered-item-width': '320px',
      'timeline-item-min-width': '180px',
      'comparison-divider-min-width': '4rem',
      'pyramid-top-width': '18rem',
    },
  },
  radii: {
    small: '1px',
    medium: '2px',
    large: '3px',
    pill: '999px',
    chrome: {
      control: '2px',
      card: '3px',
      overlay: '3px',
    },
    components: {
      card: '3px',
      code: '4px',
      tooltip: '4px',
      avatar: '999px',
    },
    layouts: {
      'divider-badge': '999px',
    },
  },
  shadows: {
    soft: '0 1px 2px rgba(0,0,0,0.1)',
    strong: '0 2px 4px rgba(0,0,0,0.2)',
    chrome: {
      card: '0 2px 4px rgba(0,0,0,0.2)',
      panel: '0 2px 4px rgba(0,0,0,0.2)',
      overlay: '0 2px 4px rgba(0,0,0,0.2)',
    },
    components: {
      code: '0 2px 4px rgba(0,0,0,0.2)',
      tooltip: '0 1px 2px rgba(0,0,0,0.1)',
    },
  },
  borders: {
    subtle: '1px solid #ddd',
    strong: '1px solid #999',
    chrome: {
      control: '1px solid #ddd',
      card: '1px solid #ddd',
      panel: '1px solid #ddd',
      overlay: '1px solid #ddd',
    },
    components: {
      card: '1px solid #ddd',
      code: '1px solid #ddd',
      tooltip: '1px solid #999',
    },
  },
  motion: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    easing: 'ease-in-out',
    scene: { duration: '200ms', easing: 'ease-in-out' },
    reveal: { duration: '200ms', easing: 'ease-in-out' },
    panel: { duration: '200ms', easing: 'ease-in-out' },
    hover: { duration: '100ms', easing: 'ease-in-out' },
    components: {
      list: { 'offset-y': '0.25rem' },
      timeline: { 'offset-y': '0.35rem' },
    },
  },
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
    expect(
      resolved.stylesheetUrls.some((href) =>
        href.includes('fonts.googleapis.com')
      )
    ).toBe(true);
    expect(
      resolved.stylesheetUrls.some((href) => href.includes('fontshare.com'))
    ).toBe(true);
    expect(resolved.preconnectOrigins).toContain(
      'https://fonts.googleapis.com'
    );
    expect(resolved.preconnectOrigins).toContain('https://fonts.gstatic.com');
  });

  it('dedupes repeated remote stylesheet and local font-face assets', () => {
    const duplicateTheme: ThemeConfig = {
      ...theme,
      fonts: {
        heading: theme.fonts.body,
        body: theme.fonts.body,
        mono: theme.fonts.heading,
      },
    };

    const resolved = resolveThemeAssets(duplicateTheme);
    expect(resolved.fontFaceCss.match(/@font-face/g)).toHaveLength(2);
    expect(
      resolved.stylesheetUrls.filter((href) =>
        href.includes('fonts.googleapis.com')
      )
    ).toHaveLength(1);
  });
});
