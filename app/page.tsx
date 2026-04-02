import { cookies } from 'next/headers';

import { DashboardExplorer } from '@/app/dashboard-explorer';
import { loadPresentationIndex } from '@/lib/engine/presentation-loader';
import {
  GLOBAL_THEME_COOKIE_NAME,
  loadThemeBySlug,
  loadThemeRegistry,
  resolveAvailableThemeSlug
} from '@/lib/engine/theme-registry';
import { ThemeBackgroundLayer } from '@/lib/runtime/ui/background-layer';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const preferredThemeSlug = cookieStore.get(GLOBAL_THEME_COOKIE_NAME)?.value;
  const [presentations, themes, activeThemeSlug] = await Promise.all([
    loadPresentationIndex(),
    loadThemeRegistry(),
    resolveAvailableThemeSlug(preferredThemeSlug)
  ]);
  const activeTheme = await loadThemeBySlug(activeThemeSlug);

  return (
    <main className="dashboardPage">
      <ThemeBackgroundLayer theme={activeTheme} slug="dashboard" />
      <div className="dashboardPageContent">
        <section className="dashboardHero">
          <p className="eyebrow">Xtoryteller</p>
          <h1>Agent-first presentation infrastructure for stage and map storytelling.</h1>
          <p className="dashboardLead">
            Browse file-backed presentations, open them instantly, and use the YAML + registry system as the source of truth.
          </p>
        </section>
        <DashboardExplorer presentations={presentations} themes={themes} activeThemeSlug={activeThemeSlug} />
      </div>
    </main>
  );
}
