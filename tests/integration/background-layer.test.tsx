/** @vitest-environment jsdom */
import path from 'node:path';

import { act, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@paper-design/shaders-react', () => {
  const createShader = (label: string) => {
    const Component = (props: Record<string, unknown>) => (
      <div
        data-paper-shader={label}
        data-prop-keys={Object.keys(props).sort().join(',')}
      />
    );
    Component.displayName = label;
    return Component;
  };

  return {
    Dithering: createShader('Dithering'),
    ditheringPresets: [
      {
        name: 'Warp',
        params: {
          colorBack: '#1c0f0b',
          colorFront: '#ff7a45',
          frame: 0,
          pxSize: 1,
          scale: 1,
          speed: 0.03,
          type: '8x8'
        }
      }
    ],
    GrainGradient: createShader('GrainGradient'),
    grainGradientPresets: [
      { name: 'Wave', params: { colors: ['#123456', '#abcdef'], intensity: 0.4, noise: 0.2, speed: 1 } }
    ],
    MeshGradient: createShader('MeshGradient'),
    meshGradientPresets: [{ name: 'Beach', params: { colors: ['#123456', '#abcdef'], distortion: 0.4, speed: 1 } }],
    PaperTexture: createShader('PaperTexture'),
    paperTexturePresets: [{ name: 'Default', params: { colorBack: '#f8f5ef', colorFront: '#d6a04d', fiber: 0.5, speed: 1 } }],
    StaticMeshGradient: createShader('StaticMeshGradient'),
    staticMeshGradientPresets: [{ name: 'Default', params: { colors: ['#123456', '#abcdef'], mixing: 0.5, speed: 1 } }],
    StaticRadialGradient: createShader('StaticRadialGradient'),
    staticRadialGradientPresets: [{ name: 'Default', params: { colorBack: '#ffffff', colors: ['#123456'], distortion: 0.2, speed: 1 } }],
    Water: createShader('Water'),
    waterPresets: [{ name: 'Default', params: { colorBack: '#123456', colorHighlight: '#abcdef', highlights: 0.5, speed: 1 } }],
    Warp: createShader('Warp'),
    warpPresets: [
      {
        name: 'Default',
        params: {
          colors: ['#0e1024', '#4d8cff', '#d4ff00'],
          distortion: 0.15,
          frame: 0,
          proportion: 0,
          scale: 1,
          softness: 1,
          speed: 0.04,
          swirl: 1,
          swirlIterations: 8
        }
      }
    ],
    Waves: createShader('Waves'),
    wavesPresets: [
      { name: 'Groovy', params: { colorBack: '#faf7f1', colorFront: '#315c8f', amplitude: 0.3, softness: 0.5 } }
    ]
  };
});

import { loadBackgroundPresetMap } from '@/lib/engine/background-preset-registry';
import { resolvePresentationBackgroundPresetRefs } from '@/lib/engine/background-preset-resolver';
import { parseYamlFile } from '@/lib/engine/yaml';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import type { PresentationConfig } from '@/lib/types/presentation';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

describe('background layer integration', () => {
  let stagePresentation: PresentationConfig;
  let mapPresentation: PresentationConfig;
  let paperTheme: Awaited<ReturnType<typeof loadThemeBySlug>>;
  let splitPastelTheme: Awaited<ReturnType<typeof loadThemeBySlug>>;

  beforeAll(async () => {
    const [rawStagePresentation, rawMapPresentation, paperThemeValue, splitPastelThemeValue, presetMap] = await Promise.all([
      parseYamlFile<PresentationConfig>(
        path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'valid', 'background-stage-switch', 'presentation.yaml')
      ),
      parseYamlFile<PresentationConfig>(
        path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'valid', 'background-map-switch', 'presentation.yaml')
      ),
      loadThemeBySlug('xinimalist-paper'),
      loadThemeBySlug('split-pastel'),
      loadBackgroundPresetMap()
    ]);
    stagePresentation = resolvePresentationBackgroundPresetRefs(rawStagePresentation, presetMap);
    mapPresentation = resolvePresentationBackgroundPresetRefs(rawMapPresentation, presetMap);
    paperTheme = paperThemeValue;
    splitPastelTheme = splitPastelThemeValue;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getBackgroundLayers() {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-background-key]'));
  }

  function getBackgroundFilter() {
    return document.querySelector<HTMLElement>('[data-background-filter-mode]');
  }

  function BackgroundHarness({
    onReady
  }: {
    onReady: (machine: ReturnType<typeof usePresentationRuntime>['machine']) => void;
  }) {
    const { machine } = usePresentationRuntime();

    onReady(machine);
    return <BackgroundLayer />;
  }

  it('renders the stage background fixture through the live background layer', () => {
    render(
      <ThemeProvider theme={paperTheme}>
        <PresentationProvider presentation={stagePresentation} theme={paperTheme}>
          <BackgroundHarness onReady={() => undefined} />
        </PresentationProvider>
      </ThemeProvider>
    );

    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-kind', 'css');
  });

  it('uses the theme-owned background when the presentation has no explicit background', () => {
    const presentationWithoutBackground: PresentationConfig = {
      meta: {
        title: 'Theme default background',
        slug: 'theme-default-background'
      },
      mode: 'stage',
      theme: 'xinimalist-paper',
      steps: [{ layout: 'single-content', components: [{ type: 'headline', content: 'Theme background' }] }]
    };

    render(
      <ThemeProvider theme={paperTheme}>
        <PresentationProvider presentation={presentationWithoutBackground} theme={paperTheme}>
          <BackgroundHarness onReady={() => undefined} />
        </PresentationProvider>
      </ThemeProvider>
    );

    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-kind', 'paper-shader');
    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-shader', 'paper-texture');
  });

  it('renders the paper-shader legibility filter overlay and skips it for css backgrounds', () => {
    const filteredPresentation: PresentationConfig = {
      meta: {
        title: 'Filtered background',
        slug: 'filtered-background'
      },
      mode: 'stage',
      steps: [{ layout: 'single-content', components: [{ type: 'headline', content: 'Filtered' }] }]
    };

    const view = render(
      <ThemeProvider theme={splitPastelTheme}>
        <PresentationProvider presentation={filteredPresentation} theme={splitPastelTheme}>
          <BackgroundHarness onReady={() => undefined} />
        </PresentationProvider>
      </ThemeProvider>
    );

    expect(getBackgroundFilter()).toHaveAttribute('data-background-filter-mode', 'radial');
    expect(getBackgroundFilter()?.style.background).toContain('radial-gradient');

    view.unmount();

    render(
      <ThemeProvider theme={paperTheme}>
        <PresentationProvider
          presentation={{
            meta: {
              title: 'Css background',
              slug: 'css-background'
            },
            mode: 'stage',
            background: {
              type: 'css',
              value: 'linear-gradient(180deg, #fff, #eee)'
            },
            steps: [{ layout: 'single-content', components: [{ type: 'headline', content: 'CSS' }] }]
          }}
          theme={paperTheme}
        >
          <BackgroundHarness onReady={() => undefined} />
        </PresentationProvider>
      </ThemeProvider>
    );

    expect(getBackgroundFilter()).toBeNull();
  });

  it('switches map backgrounds by group and cluster rules', async () => {
    vi.useFakeTimers();
    let mapMachine: ReturnType<typeof usePresentationRuntime>['machine'] | null = null;

    render(
      <ThemeProvider theme={paperTheme}>
        <PresentationProvider presentation={mapPresentation} theme={paperTheme}>
          <BackgroundHarness
            onReady={(machine) => {
              mapMachine = machine;
            }}
          />
        </PresentationProvider>
      </ThemeProvider>
    );

    expect(document.querySelector('[data-background-shader="waves"]')).toBeTruthy();

    await act(async () => {
      mapMachine!.flyToCluster('detail-a');
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-shader', 'waves');

    await act(async () => {
      mapMachine!.flyToCluster('detail-b');
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-kind', 'css');
  });
});
