/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { computeIcebergContainFit } from '@/components/iceberg-diagram';
import { loadPresentationBySlug } from '@/lib/engine/presentation-loader';
import { loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';

const nativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

function mockIcebergBoardRect(width: number, height: number) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this instanceof HTMLElement && this.dataset.icebergBoard === 'true') {
      return {
        x: 0,
        y: 0,
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        toJSON() {
          return this;
        }
      } as DOMRect;
    }

    return nativeGetBoundingClientRect.call(this);
  });
}

describe('human-ai-and-music iceberg cluster', () => {
  let presentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let theme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];

  beforeAll(async () => {
    presentation = await loadPresentationBySlug('human-ai-and-music');
    theme = (await loadThemeWithFallback(presentation.theme)).theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the expanded portrait iceberg with all merged question notes', async () => {
    mockIcebergBoardRect(420, 240);
    const cluster = presentation.clusters?.find((item) => item.id === 'iceberg-questions');

    expect(cluster).toBeTruthy();

    render(
      <ThemeProvider theme={theme} overrides={presentation.themeOverrides}>
        <PresentationProvider presentation={presentation} theme={theme}>
          <LayoutRenderer
            layout={cluster!.layout}
            layoutProps={cluster!.layoutProps}
            items={cluster!.components.map((component) => ({ component, revealCount: 999 }))}
            compact
          />
        </PresentationProvider>
      </ThemeProvider>
    );

    expect(screen.getByRole('img', { name: 'Iceberg diagram' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(24);
    expect(screen.queryByText('LITANY')).not.toBeInTheDocument();
    expect(screen.queryByText('STRUCTURES & SYSTEMS')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Walk me through the last time you discovered/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /If music becomes post-scarce/i })).toBeInTheDocument();

    const fit = computeIcebergContainFit({ containerWidth: 420, containerHeight: 240, visibleWidth: 842 });

    await waitFor(() => {
      const viewport = document.querySelector('[data-iceberg-viewport="true"]');

      expect(viewport).toBeTruthy();
      expect(Number(viewport?.getAttribute('data-fit-left'))).toBe(0);
      expect(Number(viewport?.getAttribute('data-fit-top'))).toBe(0);
      expect(Number(viewport?.getAttribute('data-fit-width'))).toBeCloseTo(fit.renderWidth, 2);
      expect(Number(viewport?.getAttribute('data-fit-height'))).toBeCloseTo(fit.renderHeight, 2);
      expect(Number(viewport?.getAttribute('data-visible-width'))).toBe(842);
    });
  });
});
