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
  let humanAiPresentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let humanAiTheme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];
  const fetchMock = vi.fn<typeof fetch>();

  beforeAll(async () => {
    mapPresentation = await loadPresentationBySlug('human-ai-and-music');
    mapTheme = await loadThemeWithFallback(mapPresentation.theme).then((result) => result.theme);
    humanAiPresentation = await loadPresentationBySlug('human-ai-and-music');
    humanAiTheme = await loadThemeWithFallback(humanAiPresentation.theme).then((result) => result.theme);
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
      name: /Overview\. The project reframes AI music as a system transition/i
    });

    expect(overviewCluster).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(overviewCluster);
    expect(overviewCluster).toHaveAttribute('aria-pressed', 'true');
    const beforeLeft = parseFloat((overviewCluster as HTMLElement).style.left);
    const beforeTop = parseFloat((overviewCluster as HTMLElement).style.top);

    await act(async () => {
      fireEvent.pointerDown(overviewCluster, { button: 0, clientX: 220, clientY: 220 });
      fireEvent.pointerMove(window, { clientX: 250, clientY: 240 });
    });

    const intermediateCluster = screen.getByRole('button', {
      name: /Overview\. The project reframes AI music as a system transition/i
    });
    const intermediateLeft = parseFloat((intermediateCluster as HTMLElement).style.left);
    const intermediateTop = parseFloat((intermediateCluster as HTMLElement).style.top);

    await act(async () => {
      fireEvent.pointerMove(window, { clientX: 280, clientY: 260 });
      fireEvent.pointerUp(window, { clientX: 280, clientY: 260 });
    });

    const movedOverviewCluster = screen.getByRole('button', {
      name: /Overview\. The project reframes AI music as a system transition/i
    });
    const movedLeft = parseFloat((movedOverviewCluster as HTMLElement).style.left);
    const movedTop = parseFloat((movedOverviewCluster as HTMLElement).style.top);
    expect(Math.abs((movedLeft - beforeLeft) - (intermediateLeft - beforeLeft) * 2)).toBeLessThanOrEqual(2);
    expect(Math.abs((movedTop - beforeTop) - (intermediateTop - beforeTop) * 2)).toBeLessThanOrEqual(2);

    const resizeHandle = screen.getByRole('button', {
      name: /Resize overview width and height/i
    });
    const beforeWidth = parseFloat((movedOverviewCluster as HTMLElement).style.width);
    const beforeHeight = parseFloat((movedOverviewCluster as HTMLElement).style.height);

    await act(async () => {
      fireEvent.pointerDown(resizeHandle, { button: 0, clientX: 420, clientY: 360 });
      fireEvent.pointerMove(window, { clientX: 470, clientY: 410 });
    });

    const intermediateResizedCluster = screen.getByRole('button', {
      name: /Overview\. The project reframes AI music as a system transition/i
    });
    const intermediateWidth = parseFloat((intermediateResizedCluster as HTMLElement).style.width);
    const intermediateHeight = parseFloat((intermediateResizedCluster as HTMLElement).style.height);

    await act(async () => {
      fireEvent.pointerMove(window, { clientX: 520, clientY: 460 });
      fireEvent.pointerUp(window, { clientX: 520, clientY: 460 });
    });

    const resizedOverviewCluster = screen.getByRole('button', {
      name: /Overview\. The project reframes AI music as a system transition/i
    });
    expect(screen.getByText('Unsaved edits')).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
    expect(parseFloat((resizedOverviewCluster as HTMLElement).style.width)).toBeGreaterThan(beforeWidth);
    expect(parseFloat((resizedOverviewCluster as HTMLElement).style.height)).toBeGreaterThan(beforeHeight);
    expect(
      Math.abs(
        (parseFloat((resizedOverviewCluster as HTMLElement).style.width) - beforeWidth) -
          (intermediateWidth - beforeWidth) * 2
      )
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs(
        (parseFloat((resizedOverviewCluster as HTMLElement).style.height) - beforeHeight) -
          (intermediateHeight - beforeHeight) * 2
      )
    ).toBeLessThanOrEqual(2);
    const editedWidth = parseFloat((resizedOverviewCluster as HTMLElement).style.width);
    const editedHeight = parseFloat((resizedOverviewCluster as HTMLElement).style.height);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/presentations/human-ai-and-music/layout');
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

  it('supports cluster duplicate delete and wheel zoom while editing', async () => {
    const { container } = render(
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

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: /Overview\. The project reframes AI music as a system transition/i
      })
    );

    const initialClusterCount = container.querySelectorAll('[data-cluster-id]').length;
    fireEvent.keyDown(window, { metaKey: true, key: 'd' });
    await waitFor(() => {
      expect(container.querySelectorAll('[data-cluster-id]')).toHaveLength(initialClusterCount + 1);
    });

    fireEvent.keyDown(window, { key: 'Delete' });
    await waitFor(() => {
      expect(container.querySelectorAll('[data-cluster-id]')).toHaveLength(initialClusterCount);
    });

    const mapViewport = container.querySelector('.mapViewport') as HTMLElement;
    const mapCanvas = container.querySelector('.mapCanvas') as HTMLElement;
    const beforeZoomTransform = mapCanvas.style.transform;
    fireEvent.wheel(mapViewport, { clientX: 160, clientY: 140, deltaY: -120 });

    await waitFor(() => {
      expect(mapCanvas.style.transform).not.toBe(beforeZoomTransform);
    });
  });

  it('relaxes authored text width caps inside compact map clusters so wider cards can reflow text', async () => {
    render(
      createElement(
        ThemeProvider,
        { theme: humanAiTheme, overrides: humanAiPresentation.themeOverrides },
        createElement(
          PresentationProvider,
          { presentation: humanAiPresentation, theme: humanAiTheme },
          createElement(MapRenderer)
        )
      )
    );

    const overviewHeading = await screen.findByRole('heading', {
      name: 'Recalibrating the Music System'
    });
    expect(overviewHeading).toHaveStyle({
      maxWidth: '100%',
      width: '100%'
    });

    const overviewSubtitle = screen.getByText(
      /From extractive AI monoculture toward a pluralistic music ecosystem/i
    );
    expect(overviewSubtitle).toHaveStyle({
      maxWidth: '100%',
      width: '100%'
    });

    const abstractParagraph = screen.getByText(
      /The rapid emergence of generative AI music tools between 2023 and 2025/i
    );
    expect(abstractParagraph.parentElement).toHaveStyle({
      maxWidth: '100%',
      width: '100%'
    });
  });

  it('supports cluster-content delete duplicate copy paste undo redo and add-component insertion', async () => {
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

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    const overviewCluster = screen.getByRole('button', {
      name: /Overview\. The project reframes AI music as a system transition/i
    });

    fireEvent.click(overviewCluster);
    expect(screen.queryByRole('button', { name: 'Back to clusters' })).not.toBeInTheDocument();
    fireEvent.click(overviewCluster);

    await screen.findByRole('button', { name: 'Back to clusters' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBeGreaterThan(0);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'd' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBeGreaterThan(1);
    });

    const afterDuplicateCount = screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length;
    fireEvent.keyDown(window, { key: 'Delete' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterDuplicateCount - 1);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'z' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterDuplicateCount);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'y' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterDuplicateCount - 1);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'c' });
    fireEvent.keyDown(window, { metaKey: true, key: 'v' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterDuplicateCount);
    });

    const afterPasteCount = screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length;
    fireEvent.keyDown(window, { metaKey: true, key: 'z' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterPasteCount - 1);
    });

    fireEvent.keyDown(window, { metaKey: true, key: 'y' });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterPasteCount);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add component' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Headline' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBe(afterPasteCount + 1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(options?.body)) as {
      clusters: Array<{ id: string; layout: string; components: Array<{ type: string }> }>;
    };
    const overviewPayload = payload.clusters.find((cluster) => cluster.id === 'overview');
    expect(overviewPayload?.layout).toBe('scattered');
    expect(overviewPayload?.components.length).toBeGreaterThan(1);
    expect(overviewPayload?.components.some((component) => component.type === 'headline')).toBe(true);
  }, 15000);

  it('exits cluster component edit mode when clicking another cluster or empty canvas', async () => {
    const { container } = render(
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

    fireEvent.click(await screen.findByRole('button', { name: 'Edit layout' }));
    const overviewCluster = screen.getByRole('button', {
      name: /Overview\. The project reframes AI music as a system transition/i
    });
    const abstractCluster = screen.getByRole('button', {
      name: /Abstract\. The core argument is that generative AI music disrupts the music system/i
    });
    const mapViewport = container.querySelector('.mapViewport') as HTMLElement;

    fireEvent.click(overviewCluster);
    expect(overviewCluster).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(mapViewport);
    expect(overviewCluster).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(overviewCluster);
    expect(screen.queryByRole('button', { name: 'Back to clusters' })).not.toBeInTheDocument();
    fireEvent.click(overviewCluster);
    await screen.findByRole('button', { name: 'Back to clusters' });
    expect(screen.getAllByRole('button', { name: /Cluster component \d+ \(/i }).length).toBeGreaterThan(0);

    fireEvent.click(abstractCluster);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Back to clusters' })).not.toBeInTheDocument();
    });
    expect(screen.queryAllByRole('button', { name: /Cluster component \d+ \(/i })).toHaveLength(0);
    expect(abstractCluster).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(abstractCluster);
    await screen.findByRole('button', { name: 'Back to clusters' });

    fireEvent.click(mapViewport);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Back to clusters' })).not.toBeInTheDocument();
    });
    expect(screen.queryAllByRole('button', { name: /Cluster component \d+ \(/i })).toHaveLength(0);
    expect(abstractCluster).toHaveAttribute('aria-pressed', 'false');
    expect(overviewCluster).toHaveAttribute('aria-pressed', 'false');
  }, 15000);
});
