/** @vitest-environment jsdom */
import { createElement } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

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
import { PresentationProvider, usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
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

  function MapHarness({
    onReady
  }: {
    onReady: (machine: ReturnType<typeof usePresentationRuntime>['machine']) => void;
  }) {
    const { machine } = usePresentationRuntime();

    onReady(machine);
    return createElement(MapRenderer);
  }

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    });
    window.dispatchEvent(new Event('resize'));
  });

  beforeAll(async () => {
    [stagePresentation, mapPresentation] = await Promise.all([
      loadPresentationBySlug('human-ai-and-music-insight-brief'),
      loadPresentationBySlug('human-ai-and-music')
    ]);
    [stageTheme, mapTheme] = await Promise.all([
      loadThemeWithFallback(stagePresentation.theme).then((result) => result.theme),
      loadThemeWithFallback(mapPresentation.theme).then((result) => result.theme)
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
        slug: 'human-ai-and-music-insight-brief'
      })
    );

    expect(screen.getByRole('img', { name: 'Runtime image' })).toHaveAttribute(
      'src',
      '/presentations/human-ai-and-music-insight-brief/assets/hero.svg'
    );

    render(
      createElement(ComponentRenderer, {
        component: { type: 'does-not-exist' },
        revealCount: 0,
        slug: 'human-ai-and-music-insight-brief'
      })
    );

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

  it('honors explicit scattered item width and height geometry when provided', () => {
    render(
      createElement(
        PresentationProvider,
        { presentation: stagePresentation, theme: stageTheme },
        createElement(LayoutRenderer, {
          layout: 'scattered',
          items: [
            {
              component: {
                type: 'headline',
                content: 'Pinned geometry',
                position: {
                  x: 0.12,
                  y: 0.18,
                  width: 0.4,
                  height: 0.3
                }
              },
              revealCount: 0
            }
          ]
        })
      )
    );

    const heading = screen.getByRole('heading', { name: 'Pinned geometry' });
    let scatterItem = heading.parentElement as HTMLElement | null;
    while (scatterItem && scatterItem.style.width !== '40%') {
      scatterItem = scatterItem.parentElement as HTMLElement | null;
    }

    expect(scatterItem).toBeTruthy();
    expect(scatterItem.style.left).toBe('12%');
    expect(scatterItem.style.top).toBe('18%');
    expect(scatterItem.style.width).toBe('40%');
    expect(scatterItem.style.height).toBe('30%');
    expect(scatterItem.style.transform).toBe('none');
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

    expect(rootStyles.length).toBeGreaterThanOrEqual(2);
    expect(rootStyles.at(-2)).toContain('--color-background:');
    expect(rootStyles.at(-1)).toContain('--color-background:');
    expect(rootStyles.at(-1)).not.toBe(rootStyles.at(-2));
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
    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(/Step 1 of .*: Opening/i));
  });

  it('mounts the stage viewer from hash-based deep links', async () => {
    window.history.replaceState({}, '', '/human-ai-and-music-insight-brief#step-3');

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

    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(/Step 3 of .*: Executive Summary/i));
  });

  it('mounts the map viewer from a cluster hash', async () => {
    window.history.replaceState({}, '', '/human-ai-and-music#cluster-context-crisis');

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

    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('context-crisis'));
  });

  it('marks narrow stage viewports as compact and passes compact styles to text content', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 840
    });
    window.history.replaceState({}, '', '/human-ai-and-music-insight-brief#step-opening');

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

    await waitFor(() => expect(document.querySelector('[data-stage-compact="true"]')).toBeTruthy());
    const heading = await screen.findByRole('heading', { name: 'Recalibrating the Music System' });
    await waitFor(() => {
      expect(heading).toHaveStyle({ maxWidth: '100%', width: '100%' });
    });
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

    expect(screen.getByRole('button', { name: 'Bounds' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. overview/i })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('overview'));

    fireEvent.click(screen.getByRole('button', { name: 'Bounds' }));
    expect(document.querySelectorAll('.clusterCardBounds').length).toBeGreaterThan(0);

    const clusterSizes = Array.from(document.querySelectorAll('.clusterCard'))
      .map((element) => {
        const node = element as HTMLElement;
        return `${node.style.width}x${node.style.height}`;
      })
      .filter(Boolean);

    expect(new Set(clusterSizes).size).toBeGreaterThan(1);
    const roadmapHeader = document.querySelector(
      '[data-cluster-id="roadmap-transition-graph"] .clusterCardHeader'
    );
    expect(roadmapHeader).toHaveAttribute('data-cluster-label-position', 'bottom-left');
    expect(roadmapHeader?.className).toContain('clusterCardHeaderBottomLeft');
  });

  it('switches between immediate interaction and flight camera behavior', async () => {
    let mapMachine: ReturnType<typeof usePresentationRuntime>['machine'] | null = null;

    render(
      createElement(
        ThemeProvider,
        { theme: mapTheme, overrides: mapPresentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation: mapPresentation, theme: mapTheme },
          createElement(MapHarness, {
            onReady: (machine) => {
              mapMachine = machine;
            }
          })
        )
      )
    );

    await screen.findByRole('button', { name: 'Guided' });
    const mapCanvas = document.querySelector('.mapCanvas') as HTMLElement;
    expect(mapCanvas).toHaveAttribute('data-camera-behavior', 'interactive');

    await act(async () => {
      mapMachine!.beginDirectManipulation();
      mapMachine!.zoomAtViewportPoint(2.1, { x: 980, y: 240 }, { width: 1280, height: 720 });
      mapMachine!.endDirectManipulation();
    });

    expect(mapCanvas).toHaveAttribute('data-camera-behavior', 'interactive');
    await waitFor(() => expect(mapCanvas.style.transform).toContain('scale(2.1)'));

    vi.useFakeTimers();
    await act(async () => {
      mapMachine!.flyToCluster('abstract');
    });

    expect(mapCanvas).toHaveAttribute('data-camera-behavior', 'flight');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(710);
    });

    expect(mapCanvas).toHaveAttribute('data-camera-behavior', 'interactive');
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('abstract');

    vi.useRealTimers();
  });

  it('resets the overview camera through a flight without leaving guided mode', async () => {
    let mapMachine: ReturnType<typeof usePresentationRuntime>['machine'] | null = null;

    render(
      createElement(
        ThemeProvider,
        { theme: mapTheme, overrides: mapPresentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation: mapPresentation, theme: mapTheme },
          createElement(MapHarness, {
            onReady: (machine) => {
              mapMachine = machine;
            }
          })
        )
      )
    );

    await screen.findByRole('button', { name: 'Guided' });

    vi.useFakeTimers();
    await act(async () => {
      mapMachine!.enterGuided();
      mapMachine!.next();
      await vi.advanceTimersByTimeAsync(710);
    });

    await act(async () => {
      mapMachine!.beginDirectManipulation();
      mapMachine!.zoomAtViewportPoint(3.2, { x: 860, y: 260 }, { width: 1280, height: 720 });
      mapMachine!.endDirectManipulation();
    });

    expect(mapMachine!.state.context.guided).toBe(true);
    expect(mapMachine!.state.context.camera.zoom).toBeGreaterThan(mapMachine!.cameraFrame.zoom);

    await act(async () => {
      mapMachine!.resetOverview();
      await vi.advanceTimersByTimeAsync(710);
    });

    expect(mapMachine!.state.context.guided).toBe(true);
    expect(mapMachine!.state.context.camera.zoom).toBeCloseTo(mapMachine!.cameraFrame.zoom, 6);

    vi.useRealTimers();
  });
});
