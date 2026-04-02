import { cookies } from 'next/headers';

import { DashboardShell } from '@/app/dashboard-shell';
import { loadBackgroundPresetDefinitionRegistry } from '@/lib/engine/background-preset-registry';
import { resolveAvailableDashboardBackgroundSlug, DASHBOARD_BACKGROUND_COOKIE_NAME } from '@/lib/engine/dashboard-background-preferences';
import { loadPresentationIndex } from '@/lib/engine/presentation-loader';
import {
  GLOBAL_THEME_COOKIE_NAME,
  loadThemeRegistry,
  loadThemeBySlug,
  resolveAvailableThemeSlug
} from '@/lib/engine/theme-registry';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const preferredThemeSlug = cookieStore.get(GLOBAL_THEME_COOKIE_NAME)?.value;
  const preferredBackgroundPresetSlug = cookieStore.get(DASHBOARD_BACKGROUND_COOKIE_NAME)?.value;
  const [presentations, themeRegistry, backgroundPresets, activeThemeSlug, initialBackgroundPresetSlug] = await Promise.all([
    loadPresentationIndex(),
    loadThemeRegistry(),
    loadBackgroundPresetDefinitionRegistry(),
    resolveAvailableThemeSlug(preferredThemeSlug),
    resolveAvailableDashboardBackgroundSlug(preferredBackgroundPresetSlug)
  ]);
  const themes = await Promise.all(
    themeRegistry.map(async (theme) => ({
      slug: theme.slug,
      name: theme.name,
      theme: await loadThemeBySlug(theme.slug)
    }))
  );

  return (
    <DashboardShell
      presentations={presentations}
      themes={themes}
      initialThemeSlug={activeThemeSlug}
      backgroundPresets={backgroundPresets}
      initialBackgroundPresetSlug={initialBackgroundPresetSlug}
    />
  );
}
