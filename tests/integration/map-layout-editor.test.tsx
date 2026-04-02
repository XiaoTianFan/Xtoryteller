/** @vitest-environment jsdom */
import { createElement } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

const refreshSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: refreshSpy
  })
}));

import { loadPresentationBySlug } from '@/lib/engine/presentation-loader';
import { loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { MapRenderer } from '@/lib/runtime/renderers/map-renderer';

describe('map layout editor', () => {
  let mapPresentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let mapTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];
  const fetchMock = vi.fn<typeof fetch>();

  beforeAll(async () => {
    mapPresentation = await loadPresentationBySlug('simple-map');
    mapTheme = await loadThemeWithFallback(mapPresentation.theme).then((result) => result.theme);
  });

  beforeEach(() => {
    fetchMock.mockReset();
    refreshSpy.mockReset();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  it('supports selecting, dragging, resizing, and saving manual map layout edits', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ updatedAt: '2026-04-02', clusterCount: 5 })
    } as Response);

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

    const editButton = await screen.findByRole('button', { name: 'Edit layout' });
    fireEvent.click(editButton);

    const saveButton = await screen.findByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    const overviewCluster = screen.getByRole('button', {
      name: /Overview\. The high-level framing cluster for the map runtime\./i
    });

    fireEvent.click(overviewCluster);
    expect(overviewCluster).toHaveAttribute('aria-pressed', 'true');

    const beforeLeft = parseFloat((overviewCluster as HTMLElement).style.left);
    const beforeTop = parseFloat((overviewCluster as HTMLElement).style.top);

    await act(async () => {
      fireEvent.pointerDown(overviewCluster, { button: 0, clientX: 180, clientY: 180 });
      fireEvent.pointerMove(window, { clientX: 300, clientY: 250 });
      fireEvent.pointerUp(window, { clientX: 300, clientY: 250 });
    });

    expect(parseFloat((overviewCluster as HTMLElement).style.left)).not.toBe(beforeLeft);
    expect(parseFloat((overviewCluster as HTMLElement).style.top)).not.toBe(beforeTop);
    expect(screen.getByText('Unsaved edits')).toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    const resizeHandle = screen.getByRole('button', {
      name: /Resize overview width and height/i
    });
    const beforeWidth = parseFloat((overviewCluster as HTMLElement).style.width);
    const beforeHeight = parseFloat((overviewCluster as HTMLElement).style.height);

    await act(async () => {
      fireEvent.pointerDown(resizeHandle, { button: 0, clientX: 420, clientY: 360 });
      fireEvent.pointerMove(window, { clientX: 520, clientY: 460 });
      fireEvent.pointerUp(window, { clientX: 520, clientY: 460 });
    });

    expect(parseFloat((overviewCluster as HTMLElement).style.width)).toBeGreaterThan(beforeWidth);
    expect(parseFloat((overviewCluster as HTMLElement).style.height)).toBeGreaterThan(beforeHeight);
    const editedWidth = parseFloat((overviewCluster as HTMLElement).style.width);
    const editedHeight = parseFloat((overviewCluster as HTMLElement).style.height);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/presentations/simple-map/layout');
    expect(options?.method).toBe('POST');

    const payload = JSON.parse(String(options?.body)) as {
      clusters: Array<{ id: string; x: number; y: number; width: number; height: number }>;
    };
    expect(payload.clusters).toHaveLength(mapPresentation.clusters?.length ?? 0);
    expect(payload.clusters.find((cluster) => cluster.id === 'overview')).toMatchObject({
      width: editedWidth,
      height: editedHeight
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit layout' })).toBeInTheDocument();
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
