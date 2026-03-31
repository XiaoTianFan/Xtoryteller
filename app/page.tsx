import Link from 'next/link';

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

      <section className="dashboardGrid" aria-label="Presentations">
        {presentations.map((presentation) => (
          <Link href={`/${presentation.slug}`} key={presentation.slug} className="presentationCard">
            <div className="thumbnailPlaceholder">
              <span>{presentation.mode === 'map' ? 'Map' : 'Stage'}</span>
            </div>
            <div className="cardBody">
              <div className="cardMetaLine">
                <span>{presentation.mode}</span>
                <span>{presentation.stepCount} {presentation.mode === 'map' ? 'clusters' : 'steps'}</span>
              </div>
              <h2>{presentation.title}</h2>
              <p>{presentation.description}</p>
              <div className="tagRow">
                {presentation.tags.map((tag) => (
                  <span key={tag} className="tagChip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
