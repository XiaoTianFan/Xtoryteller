import { DashboardExplorer } from '@/app/dashboard-explorer';
import { loadPresentationIndex } from '@/lib/engine/presentation-loader';

export default async function DashboardPage() {
  const presentations = await loadPresentationIndex();

  return (
    <main className="dashboardPage">
      <section className="dashboardHero">
        <p className="eyebrow">Xtoryteller</p>
        <h1>Agent-first presentation infrastructure for stage and map storytelling.</h1>
        <p className="dashboardLead">
          Browse file-backed presentations, open them instantly, and use the YAML + registry system as the source of truth.
        </p>
      </section>
      <DashboardExplorer presentations={presentations} />
    </main>
  );
}
