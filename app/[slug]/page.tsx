import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { loadPresentationBySlug, listPresentationSlugs } from '@/lib/engine/presentation-loader';
import { GLOBAL_THEME_COOKIE_NAME, loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PresentationProvider } from '@/lib/runtime/providers/presentation-provider';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { MapRenderer } from '@/lib/runtime/renderers/map-renderer';
import { StageRenderer } from '@/lib/runtime/renderers/stage-renderer';

export async function generateStaticParams() {
  const slugs = await listPresentationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const presentation = await loadPresentationBySlug(slug);
    const modeLabel = presentation.mode === 'map' ? 'Map' : 'Stage';
    return {
      title: `${presentation.meta.title} (${modeLabel})`
    };
  } catch {
    return { title: slug };
  }
}

export default async function PresentationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const cookieStore = await cookies();
    const presentation = await loadPresentationBySlug(slug);
    const { theme } = await loadThemeWithFallback(
      presentation.theme,
      cookieStore.get(GLOBAL_THEME_COOKIE_NAME)?.value
    );

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
