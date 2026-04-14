/** @vitest-environment jsdom */
import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@paper-design/shaders-react', () => {
  const createShader = (label: string) => {
    const Component = () => <div data-paper-shader={label} />;
    Component.displayName = label;
    return Component;
  };

  return {
    Dithering: createShader('Dithering'),
    ditheringPresets: [{ name: 'Warp', params: { speed: 0.03 } }],
    GrainGradient: createShader('GrainGradient'),
    grainGradientPresets: [{ name: 'Wave', params: { speed: 0.08 } }],
    MeshGradient: createShader('MeshGradient'),
    meshGradientPresets: [{ name: 'Purple', params: { speed: 0.045 } }],
    PaperTexture: createShader('PaperTexture'),
    paperTexturePresets: [{ name: 'Abstract', params: { speed: 0.04, scale: 0.8 } }],
    StaticMeshGradient: createShader('StaticMeshGradient'),
    staticMeshGradientPresets: [{ name: 'Sea', params: { speed: 0.04 } }],
    StaticRadialGradient: createShader('StaticRadialGradient'),
    staticRadialGradientPresets: [{ name: 'Cross Section', params: { speed: 0.035 } }],
    Water: createShader('Water'),
    waterPresets: [{ name: 'Slow-mo', params: { speed: 0.05 } }],
    Warp: createShader('Warp'),
    warpPresets: [{ name: 'Default', params: { speed: 0.04 } }],
    Waves: createShader('Waves'),
    wavesPresets: [{ name: 'Groovy', params: { amplitude: 0.25 } }]
  };
});

const refreshSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshSpy
  })
}));

import { DashboardShell } from '@/app/dashboard-shell';
import type { DashboardThemeEntry } from '@/lib/types/dashboard-background';
import type { BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';

const themeEntries: DashboardThemeEntry[] = [
  {
    slug: 'paper-theme',
    name: 'Paper Theme',
    sourceTheme: {
      name: 'Paper Theme',
      background: {
        type: 'paper-shader',
        presetRef: 'grain-demo',
        params: {
          speed: 0.33
        },
        colorStops: ['#202020', '#f8f8f8'],
        intensity: 0.57
      },
      fonts: {
        heading: { family: 'Georgia' },
        body: { family: 'Arial' },
        mono: { family: 'Courier New' }
      },
      colors: {
        background: '#f6f1e8'
      },
      typography: {
        h1: '1rem',
        h2: '1rem',
        h3: '1rem',
        body: '1rem',
        small: '1rem',
        lead: '1rem',
        code: '1rem',
        components: {}
      },
      spacing: {
        page: '1rem',
        section: '1rem',
        gap: '1rem',
        cluster: '1rem',
        chrome: {},
        components: {},
        layouts: {}
      },
      sizing: {
        components: {},
        layouts: {}
      },
      radii: {
        small: '0',
        medium: '0',
        large: '0',
        pill: '999px'
      },
      shadows: {
        soft: 'none',
        strong: 'none'
      },
      borders: {
        subtle: '1px solid transparent',
        strong: '1px solid transparent'
      },
      motion: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'linear'
      }
    },
    theme: {
      name: 'Paper Theme',
      background: {
        type: 'paper-shader',
        shader: 'grain-gradient',
        preset: 'wave',
        params: {
          colors: ['#202020', '#f8f8f8'],
          speed: 0.33
        },
        colorStops: ['#202020', '#f8f8f8'],
        intensity: 0.57
      },
      fonts: {
        heading: { family: 'Georgia' },
        body: { family: 'Arial' },
        mono: { family: 'Courier New' }
      },
      colors: {
        background: '#f6f1e8'
      },
      typography: {
        h1: '1rem',
        h2: '1rem',
        h3: '1rem',
        body: '1rem',
        small: '1rem',
        lead: '1rem',
        code: '1rem',
        components: {}
      },
      spacing: {
        page: '1rem',
        section: '1rem',
        gap: '1rem',
        cluster: '1rem',
        chrome: {},
        components: {},
        layouts: {}
      },
      sizing: {
        components: {},
        layouts: {}
      },
      radii: {
        small: '0',
        medium: '0',
        large: '0',
        pill: '999px'
      },
      shadows: {
        soft: 'none',
        strong: 'none'
      },
      borders: {
        subtle: '1px solid transparent',
        strong: '1px solid transparent'
      },
      motion: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'linear'
      }
    }
  },
  {
    slug: 'warp-theme',
    name: 'Warp Theme',
    sourceTheme: {
      name: 'Warp Theme',
      background: {
        type: 'paper-shader',
        shader: 'warp',
        preset: 'default',
        params: {
          speed: 0.2
        }
      },
      fonts: {
        heading: { family: 'Georgia' },
        body: { family: 'Arial' },
        mono: { family: 'Courier New' }
      },
      colors: {
        background: '#080808'
      },
      typography: {
        h1: '1rem',
        h2: '1rem',
        h3: '1rem',
        body: '1rem',
        small: '1rem',
        lead: '1rem',
        code: '1rem',
        components: {}
      },
      spacing: {
        page: '1rem',
        section: '1rem',
        gap: '1rem',
        cluster: '1rem',
        chrome: {},
        components: {},
        layouts: {}
      },
      sizing: {
        components: {},
        layouts: {}
      },
      radii: {
        small: '0',
        medium: '0',
        large: '0',
        pill: '999px'
      },
      shadows: {
        soft: 'none',
        strong: 'none'
      },
      borders: {
        subtle: '1px solid transparent',
        strong: '1px solid transparent'
      },
      motion: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'linear'
      }
    },
    theme: {
      name: 'Warp Theme',
      background: {
        type: 'paper-shader',
        shader: 'warp',
        preset: 'default',
        params: {
          speed: 0.2
        }
      },
      fonts: {
        heading: { family: 'Georgia' },
        body: { family: 'Arial' },
        mono: { family: 'Courier New' }
      },
      colors: {
        background: '#080808'
      },
      typography: {
        h1: '1rem',
        h2: '1rem',
        h3: '1rem',
        body: '1rem',
        small: '1rem',
        lead: '1rem',
        code: '1rem',
        components: {}
      },
      spacing: {
        page: '1rem',
        section: '1rem',
        gap: '1rem',
        cluster: '1rem',
        chrome: {},
        components: {},
        layouts: {}
      },
      sizing: {
        components: {},
        layouts: {}
      },
      radii: {
        small: '0',
        medium: '0',
        large: '0',
        pill: '999px'
      },
      shadows: {
        soft: 'none',
        strong: 'none'
      },
      borders: {
        subtle: '1px solid transparent',
        strong: '1px solid transparent'
      },
      motion: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'linear'
      }
    }
  }
];

const presets: BackgroundPresetDefinitionEntry[] = [
  {
    slug: 'grain-demo',
    name: 'Grain Demo',
    description: 'Grain gradient demo',
    tags: ['demo'],
    shader: 'grain-gradient',
    preset: 'wave',
    config: {
      name: 'Grain Demo',
      description: 'Grain gradient demo',
      tags: ['demo'],
      shader: 'grain-gradient',
      preset: 'wave',
      params: {
        colors: ['#111111', '#ffffff'],
        speed: 0.08
      },
      colorStops: ['#111111', '#ffffff', '#f6c177'],
      intensity: 0.61
    }
  },
  {
    slug: 'warp-demo',
    name: 'Warp Demo',
    description: 'Warp demo',
    tags: ['demo'],
    shader: 'warp',
    preset: 'default',
    config: {
      name: 'Warp Demo',
      description: 'Warp demo',
      tags: ['demo'],
      shader: 'warp',
      preset: 'default',
      params: {
        speed: 0.2
      },
      colorStops: ['#330066', '#ff6600'],
      intensity: 0.41
    }
  }
];

describe('dashboard background editor', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    refreshSpy.mockReset();
    globalThis.fetch = fetchMock as typeof fetch;

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : null;

      if (url === '/api/dashboard-background') {
        return {
          ok: true,
          json: async () => ({ presetSlug: body?.presetSlug ?? null })
        } as Response;
      }

      if (url === '/api/theme') {
        return {
          ok: true,
          json: async () => ({ themeSlug: body?.themeSlug ?? 'paper-theme' })
        } as Response;
      }

      if (url === '/api/background-presets') {
        return {
          ok: true,
          json: async () => ({
            preset: {
              slug: 'new-dashboard-preset',
              name: body?.name ?? 'New Dashboard Preset',
              description: body?.description,
              tags: body?.tags ?? [],
              shader: body?.shader ?? 'waves',
              preset: body?.preset,
              config: {
                name: body?.name ?? 'New Dashboard Preset',
                description: body?.description,
                tags: body?.tags ?? [],
                shader: body?.shader ?? 'waves',
                preset: body?.preset,
                params: body?.params ?? {}
              }
            }
          })
        } as Response;
      }

      if (url === '/api/background-presets/grain-demo') {
        return {
          ok: true,
          json: async () => ({
            preset: {
              slug: 'grain-demo',
              name: body?.name ?? 'Grain Demo',
              description: body?.description,
              tags: body?.tags ?? [],
              shader: body?.shader ?? 'grain-gradient',
              preset: body?.preset,
              config: {
                name: body?.name ?? 'Grain Demo',
                description: body?.description,
                tags: body?.tags ?? [],
                shader: body?.shader ?? 'grain-gradient',
                preset: body?.preset,
                params: body?.params ?? {},
                colorStops: body?.colorStops ?? [],
                intensity: body?.intensity,
                contrast: body?.contrast,
                speed: body?.speed
              }
            }
          })
        } as Response;
      }

      if (url === '/api/themes/paper-theme') {
        return {
          ok: true,
          json: async () => ({
            theme: {
              slug: 'paper-theme',
              name: body?.theme?.name ?? 'Paper Theme',
              sourceTheme: body?.theme,
              theme: {
                ...body?.theme,
                background:
                  body?.theme?.background?.presetRef === 'warp-demo'
                    ? {
                        type: 'paper-shader',
                        shader: 'warp',
                        preset: 'default',
                        params: {
                          speed: 0.2
                        }
                      }
                    : themeEntries[0].theme.background
              }
            }
          })
        } as Response;
      }

      throw new Error(`Unhandled fetch ${url}`);
    });
  });

  it('edits the active background preset, forks a new preset, and lets the theme editor switch base presets', async () => {
    render(
      createElement(DashboardShell, {
        presentations: [
          {
            slug: 'demo',
            title: 'Demo',
            description: 'Demo presentation',
            tags: ['demo'],
            mode: 'stage',
            stepCount: 3,
            searchText: 'demo presentation'
          }
        ],
        themes: themeEntries,
        initialThemeSlug: 'paper-theme',
        backgroundPresets: presets,
        initialBackgroundPresetSlug: null
      })
    );

    expect(screen.getByRole('option', { name: 'Theme Specific' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Grain Demo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Warp Demo' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('[data-paper-shader="GrainGradient"]')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit background' }));
    expect(await screen.findByRole('dialog', { name: 'Edit background' })).toBeInTheDocument();
    expect((screen.getByLabelText('Preset name') as HTMLInputElement).value).toBe('Grain Demo');
    expect(screen.getAllByDisplayValue('0.33').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('0.57').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('#202020').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Preset name'), {
      target: { value: 'Grain Demo Refined' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/background-presets/grain-demo',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
    expect(
      (screen.getByRole('combobox', { name: 'Dashboard background preset' }) as HTMLSelectElement).value
    ).toBe('__theme_specific__');

    fireEvent.click(screen.getByRole('button', { name: 'Edit background' }));
    expect(await screen.findByRole('dialog', { name: 'Edit background' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Preset name'), {
      target: { value: 'New Dashboard Preset' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save New' }));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'New Dashboard Preset' })).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/background-presets',
      expect.objectContaining({
        method: 'POST'
      })
    );
    expect(
      (screen.getByRole('combobox', { name: 'Dashboard background preset' }) as HTMLSelectElement).value
    ).toBe('new-dashboard-preset');

    fireEvent.change(screen.getByRole('combobox', { name: 'Dashboard background preset' }), {
      target: { value: 'warp-demo' }
    });
    await waitFor(() => {
      expect(document.querySelector('[data-paper-shader="Warp"]')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit background' }));
    expect(await screen.findByRole('dialog', { name: 'Edit background' })).toBeInTheDocument();
    expect((screen.getByLabelText('Preset name') as HTMLInputElement).value).toBe('Warp Demo');
    expect(screen.getAllByDisplayValue('0.41').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('#330066').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.change(screen.getByRole('combobox', { name: 'Dashboard background preset' }), {
      target: { value: '__theme_specific__' }
    });
    await waitFor(() => {
      expect(document.querySelector('[data-paper-shader="GrainGradient"]')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit theme' }));
    expect(await screen.findByRole('dialog', { name: 'Edit theme' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Background preset'), {
      target: { value: 'warp-demo' }
    });

    await waitFor(() => {
      expect(document.querySelector('[data-paper-shader="Warp"]')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save theme' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/themes/paper-theme',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });
});
