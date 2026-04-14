'use client';

import Link from 'next/link';
import { startTransition, useDeferredValue, useMemo, useState } from 'react';

import { DASHBOARD_THEME_SPECIFIC_VALUE, type DashboardThemeEntry } from '@/lib/types/dashboard-background';
import { type BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type { PresentationIndexEntry } from '@/lib/types/presentation';

function isVideoAsset(asset: string | undefined) {
  return Boolean(asset && /\.(mp4|webm)$/i.test(asset));
}

type SortMode = 'updated' | 'created' | 'title';
type ViewMode = 'grid' | 'list';

function sortPresentations(items: PresentationIndexEntry[], sortMode: SortMode) {
  const copy = [...items];

  if (sortMode === 'updated') {
    return copy.sort((left, right) => (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '') || left.title.localeCompare(right.title));
  }

  if (sortMode === 'created') {
    return copy.sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? '') || left.title.localeCompare(right.title));
  }

  return copy.sort((left, right) => left.title.localeCompare(right.title));
}

export function DashboardExplorer({
  presentations,
  themes,
  selectedThemeSlug,
  onThemeChange,
  isSavingTheme,
  onOpenThemeEditor,
  backgroundPresets,
  selectedBackgroundPresetSlug,
  onBackgroundChange,
  isSavingBackground,
  onOpenCreatePreset
}: {
  presentations: PresentationIndexEntry[];
  themes: DashboardThemeEntry[];
  selectedThemeSlug: string;
  onThemeChange: (themeSlug: string) => Promise<void>;
  isSavingTheme: boolean;
  onOpenThemeEditor: () => void;
  backgroundPresets: BackgroundPresetDefinitionEntry[];
  selectedBackgroundPresetSlug: string | null;
  onBackgroundChange: (presetSlug: string | null) => Promise<void>;
  isSavingBackground: boolean;
  onOpenCreatePreset: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const tags = useMemo(
    () => ['all', ...new Set(presentations.flatMap((presentation) => presentation.tags).sort((left, right) => left.localeCompare(right)))],
    [presentations]
  );

  const filtered = useMemo(() => {
    const matching = presentations.filter((presentation) => {
      const matchesQuery = !deferredQuery || presentation.searchText?.includes(deferredQuery);
      const matchesTag = selectedTag === 'all' || presentation.tags.includes(selectedTag);
      return matchesQuery && matchesTag;
    });

    return sortPresentations(matching, sortMode);
  }, [deferredQuery, presentations, selectedTag, sortMode]);

  return (
    <section aria-label="Presentations">
      <div className="dashboardTools">
        <label className="dashboardSearch">
          <span className="srOnly">Search presentations</span>
          <input
            className="dashboardInput"
            type="search"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => setQuery(value));
            }}
            placeholder="Search title, tags, descriptions, or content"
          />
        </label>
        <label>
          <span className="srOnly">Filter by tag</span>
          <select
            className="dashboardSelect"
            aria-label="Filter by tag"
            value={selectedTag}
            onChange={(event) => setSelectedTag(event.target.value)}
          >
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag === 'all' ? 'All tags' : tag}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="srOnly">Sort presentations</span>
          <select
            className="dashboardSelect"
            aria-label="Sort presentations"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="updated">Recently updated</option>
            <option value="created">Recently created</option>
            <option value="title">Title A-Z</option>
          </select>
        </label>
        <label>
          <span className="srOnly">Global theme</span>
          <select
            className="dashboardSelect"
            aria-label="Global theme"
            value={selectedThemeSlug}
            disabled={isSavingTheme}
            onChange={(event) => {
              void onThemeChange(event.target.value);
            }}
          >
            {themes.map((theme) => (
              <option key={theme.slug} value={theme.slug}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghostButton" onClick={onOpenThemeEditor}>
          Edit theme
        </button>
        <label>
          <span className="srOnly">Dashboard background preset</span>
          <select
            className="dashboardSelect"
            aria-label="Dashboard background preset"
            value={selectedBackgroundPresetSlug ?? DASHBOARD_THEME_SPECIFIC_VALUE}
            disabled={isSavingBackground}
            onChange={(event) => {
              void onBackgroundChange(
                event.target.value === DASHBOARD_THEME_SPECIFIC_VALUE ? null : event.target.value
              );
            }}
          >
            <option value={DASHBOARD_THEME_SPECIFIC_VALUE}>Theme Specific</option>
            {backgroundPresets.map((preset) => (
              <option key={preset.slug} value={preset.slug}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghostButton" onClick={onOpenCreatePreset}>
          Edit background
        </button>
        <div className="viewToggle" role="group" aria-label="View mode">
          <button
            type="button"
            aria-pressed={viewMode === 'grid'}
            className={`viewToggleButton ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'list'}
            className={`viewToggleButton ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      <p className="dashboardStatLine">
        Showing {filtered.length} of {presentations.length} presentations
      </p>

      <div className={`dashboardGrid appScrollbarMuted ${viewMode === 'list' ? 'dashboardList' : ''}`}>
        {filtered.map((presentation) => (
          <Link href={`/${presentation.slug}`} key={presentation.slug} className={`presentationCard ${viewMode === 'list' ? 'presentationCardList' : ''}`}>
            <div className="thumbnailPlaceholder">
              {presentation.previewAsset ? (
                isVideoAsset(presentation.previewAsset) ? (
                  <video className="cardPreviewMedia" src={presentation.previewAsset} muted playsInline preload="metadata" />
                ) : (
                  <img className="cardPreviewMedia" src={presentation.previewAsset} alt="" />
                )
              ) : (
                <span>{presentation.mode === 'map' ? 'Map' : 'Stage'}</span>
              )}
            </div>
            <div className="cardBody">
              <div className="cardMetaLine">
                <span>{presentation.mode}</span>
                <span>
                  {presentation.stepCount} {presentation.mode === 'map' ? 'clusters' : 'steps'}
                </span>
                {presentation.updatedAt ? <span>Updated {presentation.updatedAt}</span> : null}
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
      </div>
    </section>
  );
}
