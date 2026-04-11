/** @vitest-environment jsdom */
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
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
    waterPresets: [{ name: 'Slow-mo', params: { speed: 0.05 } }],
    Warp: createShader('Warp'),
    warpPresets: [{ name: 'Default', params: { frame: 0, speed: 0.04 } }],
    Waves: createShader('Waves'),
    wavesPresets: [{ name: 'Groovy', params: { amplitude: 0.25 } }]
  };
});

import { loadPresentationBySlug } from '@/lib/engine/presentation-loader';
import { loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PdfExportRenderer } from '@/lib/runtime/renderers/pdf-renderer';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';

describe('PDF export renderer', () => {
  let stagePresentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let mapPresentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let stageTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];
  let mapTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];

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

  it('renders every Stage step as a static PDF page with final-state content', () => {
    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: stagePresentation.themeOverrides },
        createElement(PdfExportRenderer, { presentation: stagePresentation, theme: stageTheme })
      )
    );

    expect(document.querySelector('[data-pdf-ready="true"]')).toBeTruthy();
    expect(document.querySelectorAll('[data-pdf-kind="stage"]')).toHaveLength(stagePresentation.steps?.length ?? 0);
    expect(screen.getByText('Opening')).toBeInTheDocument();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
  });

  it('renders a Map presentation as one overview PDF page with all clusters', () => {
    render(
      createElement(
        ThemeProvider,
        { theme: mapTheme, overrides: mapPresentation.themeOverrides },
        createElement(PdfExportRenderer, { presentation: mapPresentation, theme: mapTheme })
      )
    );

    expect(document.querySelectorAll('[data-pdf-kind="map"]')).toHaveLength(1);
    expect(document.querySelectorAll('.pdfClusterCard')).toHaveLength(mapPresentation.clusters?.length ?? 0);
    expect(document.querySelector('[data-cluster-id="overview"]')).toBeTruthy();
    expect(document.querySelector('[data-cluster-id="context-crisis"]')).toBeTruthy();
  });

  it('renders static placeholders for PDF media fallback components', () => {
    const presentation = {
      ...stagePresentation,
      steps: [
        {
          layout: 'single-content',
          components: [
            { type: 'video', props: { src: 'assets/demo.mp4', caption: 'Demo reel' } },
            { type: 'iframe-embed', props: { src: 'https://example.com', title: 'Reference embed' } }
          ]
        }
      ]
    };

    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: presentation.themeOverrides },
        createElement(PdfExportRenderer, { presentation, theme: stageTheme })
      )
    );

    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Demo reel')).toBeInTheDocument();
    expect(screen.getByText('Reference embed')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-pdf-warning="media-fallback"]')).toHaveLength(2);
  });
});
