import { beforeAll } from 'vitest';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { resolveTheme, themeVariablesToCss } from '@/lib/engine/theme-resolver';

describe('theme resolver', () => {
  let paperTheme: Awaited<ReturnType<typeof loadThemeBySlug>>;

  beforeAll(async () => {
    paperTheme = await loadThemeBySlug('xinimalist-paper');
  });

  it('deep merges overrides into the base theme and serializes css variables', () => {
    const resolved = resolveTheme(paperTheme, {
      colors: {
        primary: '#123456',
        chrome: {
          surface: 'rgba(0, 0, 0, 0.8)',
        },
      },
      typography: {
        body: 'clamp(1.1rem, 1.4vw, 1.4rem)',
      },
      spacing: {
        gap: '2rem',
        components: {
          card: {
            padding: '1.75rem',
          },
        },
      },
      sizing: {
        components: {
          feature: {
            icon: '3rem',
          },
        },
      },
      motion: {
        reveal: {
          duration: '500ms',
        },
      },
    });

    expect(resolved.theme.colors.primary).toBe('#123456');
    expect(resolved.theme.typography.body).toBe('clamp(1.1rem, 1.4vw, 1.4rem)');
    expect(resolved.theme.spacing.gap).toBe('2rem');
    expect(resolved.cssVariables['--color-primary']).toBe('#123456');
    expect(resolved.cssVariables['--color-chrome-surface']).toBe(
      'rgba(0, 0, 0, 0.8)'
    );
    expect(resolved.cssVariables['--spacing-components-card-padding']).toBe(
      '1.75rem'
    );
    expect(resolved.cssVariables['--size-components-feature-icon']).toBe(
      '3rem'
    );
    expect(resolved.cssVariables['--motion-reveal-duration']).toBe('500ms');
    expect(resolved.cssVariables['--font-heading']).toContain('EB Garamond');
    expect(
      themeVariablesToCss({
        '--color-primary': '#123456',
        '--font-body': 'Inter',
      })
    ).toContain(':root');
  });
});
