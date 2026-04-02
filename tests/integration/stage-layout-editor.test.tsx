/** @vitest-environment jsdom */
import { createElement } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

const pushSpy = vi.fn();
const refreshSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushSpy,
    refresh: refreshSpy
  })
}));

import { loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { StageRenderer } from '@/lib/runtime/renderers/stage-renderer';
import { PresentationConfig } from '@/lib/types/presentation';

function createRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({ left, top, width, height })
  } as DOMRect;
}

function installStageMeasurementRects() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const element = this as HTMLElement;
    if (element.classList.contains('stepSceneBody')) {
      return createRect(0, 0, 1000, 560);
    }

    switch (element.dataset.layoutItemIndex) {
      case '0':
        return createRect(80, 84, 360, 180);
      case '1':
        return createRect(560, 120, 300, 210);
      default:
        return createRect(0, 0, 0, 0);
    }
  });
}

describe('stage layout editor', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let stageTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];
  let presentation: PresentationConfig;

  beforeAll(async () => {
    stageTheme = await loadThemeWithFallback('xinimalist-paper').then((result) => result.theme);
    presentation = {
      meta: {
        title: 'Stage editor test',
        slug: 'stage-editor-test'
      },
      mode: 'stage',
      theme: 'xinimalist-paper',
      steps: [
        {
          id: 'step-one',
          title: 'Step One',
          description: 'Editable layout test',
          layout: 'two-column',
          layoutProps: {
            gap: '2rem',
            ratio: '60-40'
          },
          components: [
            {
              type: 'headline',
              content: 'Alpha headline'
            },
            {
              type: 'body-text',
              content: 'Beta supporting copy'
            }
          ]
        },
        {
          id: 'step-two',
          title: 'Step Two',
          layout: 'single-content',
          components: [
            {
              type: 'headline',
              content: 'Follow-up step'
            }
          ]
        }
      ]
    };
  });

  beforeEach(() => {
    fetchMock.mockReset();
    pushSpy.mockReset();
    refreshSpy.mockReset();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports measuring, dragging, resizing, and saving stage layout edits', async () => {
    installStageMeasurementRects();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ updatedAt: '2026-04-02', stepIndex: 0, componentCount: 2 })
    } as Response);

    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: presentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation, theme: stageTheme },
          createElement(StageRenderer)
        )
      )
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 360));
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));

    const firstComponent = await screen.findByRole('button', {
      name: /Component 1 \(headline\)/i
    });
    const saveButton = await screen.findByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    fireEvent.click(firstComponent);
    const beforeLeft = parseFloat((firstComponent as HTMLElement).style.left);
    const beforeTop = parseFloat((firstComponent as HTMLElement).style.top);

    await act(async () => {
      fireEvent.pointerDown(firstComponent, { button: 0, clientX: 120, clientY: 120 });
      fireEvent.pointerMove(window, { clientX: 180, clientY: 150 });
    });

    const intermediateLeft = parseFloat((firstComponent as HTMLElement).style.left);
    const intermediateTop = parseFloat((firstComponent as HTMLElement).style.top);

    await act(async () => {
      fireEvent.pointerMove(window, { clientX: 260, clientY: 210 });
      fireEvent.pointerUp(window, { clientX: 260, clientY: 210 });
    });

    const finalLeft = parseFloat((firstComponent as HTMLElement).style.left);
    const finalTop = parseFloat((firstComponent as HTMLElement).style.top);
    expect(finalLeft).toBeCloseTo(beforeLeft + 14, 3);
    expect(finalTop).toBeCloseTo(beforeTop + (90 / 560) * 100, 3);
    expect(finalLeft - beforeLeft).toBeCloseTo((intermediateLeft - beforeLeft) * 140 / 60, 3);
    expect(finalTop - beforeTop).toBeCloseTo((intermediateTop - beforeTop) * 90 / 30, 3);
    expect(screen.getByText('Unsaved edits')).toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    const resizeHandle = screen.getByRole('button', {
      name: /Resize component 1 width and height/i
    });
    const beforeWidth = parseFloat((firstComponent as HTMLElement).style.width);
    const beforeHeight = parseFloat((firstComponent as HTMLElement).style.height);

    await act(async () => {
      fireEvent.pointerDown(resizeHandle, { button: 0, clientX: 420, clientY: 280 });
      fireEvent.pointerMove(window, { clientX: 480, clientY: 320 });
    });

    const intermediateWidth = parseFloat((firstComponent as HTMLElement).style.width);
    const intermediateHeight = parseFloat((firstComponent as HTMLElement).style.height);

    await act(async () => {
      fireEvent.pointerMove(window, { clientX: 560, clientY: 390 });
      fireEvent.pointerUp(window, { clientX: 560, clientY: 390 });
    });

    const finalWidth = parseFloat((firstComponent as HTMLElement).style.width);
    const finalHeight = parseFloat((firstComponent as HTMLElement).style.height);
    expect(finalWidth).toBeCloseTo(beforeWidth + 14, 3);
    expect(finalHeight).toBeCloseTo(beforeHeight + (110 / 560) * 100, 3);
    expect(finalWidth - beforeWidth).toBeCloseTo((intermediateWidth - beforeWidth) * 140 / 60, 3);
    expect(finalHeight - beforeHeight).toBeCloseTo((intermediateHeight - beforeHeight) * 110 / 40, 3);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/presentations/stage-editor-test/layout');
    expect(options?.method).toBe('POST');

    const payload = JSON.parse(String(options?.body)) as {
      stepIndex: number;
      components: Array<{ index: number; x: number; y: number; width: number; height: number }>;
    };
    expect(payload.stepIndex).toBe(0);
    expect(payload.components).toHaveLength(2);
    expect(payload.components[0]).toMatchObject({
      index: 0
    });
    expect(payload.components[0].width).toBeGreaterThan(0.36);
    expect(payload.components[0].height).toBeGreaterThan(0.32);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit layout' })).toBeInTheDocument();
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('prompts to save or stay when navigating away with unsaved stage edits', async () => {
    installStageMeasurementRects();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ updatedAt: '2026-04-02', stepIndex: 0, componentCount: 2 })
    } as Response);

    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: presentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation, theme: stageTheme },
          createElement(StageRenderer)
        )
      )
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 360));
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    const firstComponent = await screen.findByRole('button', {
      name: /Component 1 \(headline\)/i
    });

    await act(async () => {
      fireEvent.pointerDown(firstComponent, { button: 0, clientX: 120, clientY: 120 });
      fireEvent.pointerMove(window, { clientX: 220, clientY: 170 });
      fireEvent.pointerUp(window, { clientX: 220, clientY: 170 });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('dialog', { name: 'Unsaved layout changes' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Unsaved layout changes' })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Step One')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const dialog = await screen.findByRole('dialog', { name: 'Unsaved layout changes' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(
      () => {
        expect(screen.getByText('Step Two')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it('supports discard-on-exit and blocks browser unload while dirty', async () => {
    installStageMeasurementRects();

    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: presentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation, theme: stageTheme },
          createElement(StageRenderer)
        )
      )
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    const firstComponent = await screen.findByRole('button', {
      name: /Component 1 \(headline\)/i
    });

    await act(async () => {
      fireEvent.pointerDown(firstComponent, { button: 0, clientX: 120, clientY: 120 });
      fireEvent.pointerMove(window, { clientX: 220, clientY: 170 });
      fireEvent.pointerUp(window, { clientX: 220, clientY: 170 });
    });

    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true });
    fireEvent(window, beforeUnloadEvent);
    expect(beforeUnloadEvent.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('dialog', { name: 'Unsaved layout changes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith('/');
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('supports delete duplicate undo redo copy paste and add-component insertion while editing a stage', async () => {
    installStageMeasurementRects();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ updatedAt: '2026-04-02', stepIndex: 0, componentCount: 4 })
    } as Response);

    render(
      createElement(
        ThemeProvider,
        { theme: stageTheme, overrides: presentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation, theme: stageTheme },
          createElement(StageRenderer)
        )
      )
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    const firstComponent = await screen.findByRole('button', {
      name: /Component 1 \(headline\)/i
    });

    fireEvent.click(firstComponent);
    fireEvent.keyDown(window, { metaKey: true, key: 'd' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Component \d+ \(/i })).toHaveLength(3);
    });

    fireEvent.keyDown(window, { key: 'Backspace' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Component \d+ \(/i })).toHaveLength(2);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'z' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Component \d+ \(/i })).toHaveLength(3);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'y' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Component \d+ \(/i })).toHaveLength(2);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'c' });
    fireEvent.keyDown(window, { metaKey: true, key: 'v' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Component \d+ \(/i })).toHaveLength(3);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add component' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Subtitle' }));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Component \d+ \(/i })).toHaveLength(4);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(options?.body)) as {
      components: Array<{ type: string }>;
    };
    expect(payload.components).toHaveLength(4);
    expect(payload.components.some((component) => component.type === 'subtitle')).toBe(true);
  });
});
