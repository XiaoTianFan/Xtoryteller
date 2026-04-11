import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { loadPresentationBySlug, listPresentationSlugs } from '@/lib/engine/presentation-loader';
import { GLOBAL_THEME_COOKIE_NAME, loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { PdfExportRenderer } from '@/lib/runtime/renderers/pdf-renderer';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';

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
    return {
      title: `${presentation.meta.title} (PDF Export)`
    };
  } catch {
    return { title: `${slug} PDF Export` };
  }
}

export default async function PresentationPdfExportPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const [cookieStore, presentation] = await Promise.all([
      cookies(),
      loadPresentationBySlug(slug)
    ]);
    const { theme } = await loadThemeWithFallback(
      presentation.theme,
      cookieStore.get(GLOBAL_THEME_COOKIE_NAME)?.value
    );

    return (
      <ThemeProvider theme={theme} overrides={presentation.themeOverrides}>
        <PdfExportRenderer presentation={presentation} theme={theme} />
      </ThemeProvider>
    );
  } catch {
    notFound();
  }
}
