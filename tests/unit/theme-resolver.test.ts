import { DEFAULT_THEME } from '@/lib/engine/default-theme';
import { resolveTheme, themeVariablesToCss } from '@/lib/engine/theme-resolver';

describe('theme resolver', () => {
  it('deep merges overrides into the base theme and serializes css variables', () => {
    const resolved = resolveTheme(DEFAULT_THEME, {
      colors: {
        primary: '#123456',
        chrome: {
          surface: 'rgba(0, 0, 0, 0.8)'
        }
      },
      typography: {
        body: 'clamp(1.1rem, 1.4vw, 1.4rem)'
      },
      spacing: {
        gap: '2rem'
      },
      motion: {
        reveal: {
          duration: '500ms'
        }
      }
    });

    expect(resolved.theme.colors.primary).toBe('#123456');
    expect(resolved.theme.typography.body).toBe('clamp(1.1rem, 1.4vw, 1.4rem)');
    expect(resolved.theme.spacing.gap).toBe('2rem');
    expect(resolved.cssVariables['--color-primary']).toBe('#123456');
    expect(resolved.cssVariables['--color-chrome-surface']).toBe('rgba(0, 0, 0, 0.8)');
    expect(resolved.cssVariables['--motion-reveal-duration']).toBe('500ms');
    expect(resolved.cssVariables['--font-heading']).toContain('Playfair Display');
    expect(themeVariablesToCss({ '--color-primary': '#123456', '--font-body': 'Inter' })).toContain(':root');
  });
});
