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
    Waves: createShader('Waves'),
    wavesPresets: [
      { name: 'Groovy', params: { colorBack: '#faf7f1', colorFront: '#315c8f', amplitude: 0.3, softness: 0.5 } }
    ]
  };
});

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

  beforeAll(async () => {
    [stagePresentation, mapPresentation, paperTheme] = await Promise.all([
      parseYamlFile<PresentationConfig>(
        path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'valid', 'background-stage-switch', 'presentation.yaml')
      ),
      parseYamlFile<PresentationConfig>(
        path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'valid', 'background-map-switch', 'presentation.yaml')
      ),
      loadThemeBySlug('xinimalist-paper')
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getBackgroundLayers() {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-background-key]'));
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
      mapMachine!.goToCluster('detail-a');
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-shader', 'waves');

    await act(async () => {
      mapMachine!.goToCluster('detail-b');
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(getBackgroundLayers().at(-1)).toHaveAttribute('data-background-kind', 'css');
  });
});
