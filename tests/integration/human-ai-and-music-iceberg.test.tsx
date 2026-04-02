/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadPresentationBySlug } from '@/lib/engine/presentation-loader';
import { loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';

describe('human-ai-and-music iceberg cluster', () => {
  let presentation: Awaited<ReturnType<typeof loadPresentationBySlug>>;
  let theme: Awaited<ReturnType<typeof loadThemeWithFallback>>['theme'];

  beforeAll(async () => {
    presentation = await loadPresentationBySlug('human-ai-and-music');
    theme = (await loadThemeWithFallback(presentation.theme)).theme;
  });

  it('renders the expanded portrait iceberg with all merged question notes', () => {
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
  });
});
