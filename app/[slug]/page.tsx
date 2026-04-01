import { notFound } from 'next/navigation';

import { loadPresentationBySlug, listPresentationSlugs } from '@/lib/engine/presentation-loader';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { MapRenderer } from '@/lib/runtime/renderers/map-renderer';
import { StageRenderer } from '@/lib/runtime/renderers/stage-renderer';

export async function generateStaticParams() {
  const slugs = await listPresentationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function PresentationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const presentation = await loadPresentationBySlug(slug);
    const theme = await loadThemeBySlug(presentation.theme);

    return (
      <ThemeProvider theme={theme} overrides={presentation.themeOverrides}>
        <PresentationProvider presentation={presentation} theme={theme}>
          {presentation.mode === 'map' ? <MapRenderer /> : <StageRenderer />}
        </PresentationProvider>
      </ThemeProvider>
    );
  } catch {
    notFound();
  }
}
