/** @vitest-environment jsdom */
import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@paper-design/shaders-react', () => {
  const createShader = (label: string) => {
    const Component = () => <div data-paper-shader={label} />;
    Component.displayName = label;
    return Component;
  };

  return {
    Dithering: createShader('Dithering'),
    ditheringPresets: [{ name: 'Warp', params: { frame: 0, speed: 0.03 } }],
    GrainGradient: createShader('GrainGradient'),
    grainGradientPresets: [{ name: 'Wave', params: { frame: 0, speed: 0.08 } }],
    MeshGradient: createShader('MeshGradient'),
    meshGradientPresets: [{ name: 'Purple', params: { frame: 0, speed: 0.045 } }],
    PaperTexture: createShader('PaperTexture'),
    paperTexturePresets: [{ name: 'Abstract', params: { frame: 0, speed: 0.04 } }],
    StaticMeshGradient: createShader('StaticMeshGradient'),
    staticMeshGradientPresets: [{ name: 'Sea', params: { frame: 0, speed: 0.04 } }],
    StaticRadialGradient: createShader('StaticRadialGradient'),
    staticRadialGradientPresets: [{ name: 'Cross Section', params: { frame: 0, speed: 0.035 } }],
    Water: createShader('Water'),
    waterPresets: [{ name: 'Slow-mo', params: { frame: 0, speed: 0.05 } }],
    Warp: createShader('Warp'),
    warpPresets: [{ name: 'Default', params: { frame: 0, speed: 0.04 } }],
    Waves: createShader('Waves'),
    wavesPresets: [{ name: 'Groovy', params: { amplitude: 0.25 } }]
  };
});

import { loadPresentationBySlug } from '@/lib/engine/presentation-loader';
import { loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { ComponentRenderer } from '@/lib/runtime/renderers/component-renderer';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { MapRenderer } from '@/lib/runtime/renderers/map-renderer';
import { StageRenderer } from '@/lib/runtime/renderers/stage-renderer';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

describe('runtime renderers', () => {
  let stagePresentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let mapPresentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let stageTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];
  let mapTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];

  beforeAll(async () => {
    [stagePresentation, mapPresentation] = await Promise.all([
      loadPresentationBySlug('simple-stage'),
      loadPresentationBySlug('complex-map')
    ]);
    [stageTheme, mapTheme] = await Promise.all([
      loadThemeWithFallback(stagePresentation.theme).then((result) => result.theme),
      loadThemeWithFallback('xinimalist-dark').then((result) => result.theme)
    ]);
  });

  it('resolves known components and flags unknown components', () => {
    render(
      createElement(ComponentRenderer, {
        component: {
          type: 'image',
          props: {
            src: 'assets/hero.svg',
            alt: 'Runtime image'
          }
        },
        revealCount: 0,
        slug: 'simple-stage'
      })
    );

    expect(screen.getByRole('img', { name: 'Runtime image' })).toHaveAttribute(
      'src',
      '/presentations/simple-stage/assets/hero.svg'
    );

    render(createElement(ComponentRenderer, { component: { type: 'does-not-exist' }, revealCount: 0, slug: 'simple-stage' }));

    expect(screen.getByText('Unknown component: does-not-exist')).toBeInTheDocument();
  });

  it('renders layouts through the runtime layout registry', () => {
    render(
      createElement(
        PresentationProvider,
        { presentation: stagePresentation, theme: stageTheme },
        createElement(LayoutRenderer, {
          layout: 'single-content',
          items: [
            {
              component: { type: 'headline', content: 'Layout contract' },
              revealCount: 0
            }
          ]
        })
      )
    );

    expect(screen.getByRole('heading', { name: 'Layout contract' })).toBeInTheDocument();
  });

  it('injects resolved theme variables and font assets into the DOM', () => {
    const presentation = {
      ...stagePresentation,
      themeOverrides: {
        colors: {
          primary: '#123456'
        }
      }
    };

    render(createElement(ThemeProvider, { theme: stageTheme, overrides: presentation.themeOverrides }, createElement('div', null, 'Theme contract')));

    expect(screen.getByText('Theme contract')).toBeInTheDocument();
    const themeStyles = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .find((content) => content.includes(':root') && content.includes('--color-primary'));

    expect(themeStyles).toBeDefined();
    expect(themeStyles!).toContain('--color-primary: #123456');
    expect(themeStyles!).toContain('--font-heading:');
    expect(document.querySelector('link[rel="stylesheet"]')).toBeTruthy();
  });

  it('lets a presentation theme override the shell baseline theme', () => {
    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme },
        createElement(
          ThemeProvider,
          { theme: mapTheme },
          createElement('div', null, 'Theme override contract')
        )
      )
    );

    const rootStyles = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .filter((content) => content.includes(':root') && content.includes('--color-background'));

    expect(rootStyles.at(-2)).toContain('--color-background: #f5f2e3');
    expect(rootStyles.at(-1)).toContain('--color-background: #303428');
  });

  it('renders the canonical stage viewer shell', async () => {
    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: stagePresentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation: stagePresentation, theme: stageTheme },
          createElement(StageRenderer)
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Step 1 of 5: Opening'));
  });

  it('renders the canonical map viewer shell', async () => {
    render(
      createElement(
        ThemeProvider,
        { theme: mapTheme, overrides: mapPresentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation: mapPresentation, theme: mapTheme },
          createElement(MapRenderer)
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guided' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /1\. north-star/i })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('north-star'));
  });
});
