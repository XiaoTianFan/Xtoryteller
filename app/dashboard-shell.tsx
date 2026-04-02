'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useState } from 'react';

import { DashboardBackgroundPresetDrawer } from '@/app/dashboard-background-preset-drawer';
import { DashboardExplorer } from '@/app/dashboard-explorer';
import { resolveBackgroundConfigPresetRefs } from '@/lib/engine/background-preset-resolver';
import { getThemeBackgroundTransition, resolveBackgroundAppearance } from '@/lib/runtime/background-config';
import { ResolvedBackgroundLayer } from '@/lib/runtime/ui/background-layer';
import type { BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type {
  CreateBackgroundPresetPayload,
  DashboardThemeEntry
} from '@/lib/types/dashboard-background';
import type { PresentationIndexEntry } from '@/lib/types/presentation';

function findTheme(themes: DashboardThemeEntry[], slug: string) {
  return themes.find((entry) => entry.slug === slug) ?? themes[0];
}

export function DashboardShell({
  presentations,
  themes,
  initialThemeSlug,
  backgroundPresets,
  initialBackgroundPresetSlug
}: {
  presentations: PresentationIndexEntry[];
  themes: DashboardThemeEntry[];
  initialThemeSlug: string;
  backgroundPresets: BackgroundPresetDefinitionEntry[];
  initialBackgroundPresetSlug: string | null;
}) {
  const router = useRouter();
  const [selectedThemeSlug, setSelectedThemeSlug] = useState(initialThemeSlug);
  const [selectedBackgroundPresetSlug, setSelectedBackgroundPresetSlug] = useState<string | null>(initialBackgroundPresetSlug);
  const [presetDefinitions, setPresetDefinitions] = useState(backgroundPresets);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isSavingBackground, setIsSavingBackground] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [draftPreview, setDraftPreview] = useState<CreateBackgroundPresetPayload | null>(null);

  const selectedThemeEntry = useMemo(
    () => findTheme(themes, selectedThemeSlug),
    [selectedThemeSlug, themes]
  );
  const presetMap = useMemo(
    () => new Map(presetDefinitions.map((entry) => [entry.slug, entry.config])),
    [presetDefinitions]
  );
  const previewConfig = useMemo(() => {
    if (draftPreview) {
      return {
        type: 'paper-shader' as const,
        shader: draftPreview.shader,
        preset: draftPreview.preset,
        params: draftPreview.params
      };
    }

    if (!selectedBackgroundPresetSlug) {
      return selectedThemeEntry?.theme.background ?? null;
    }

    return resolveBackgroundConfigPresetRefs(
      {
        type: 'paper-shader' as const,
        presetRef: selectedBackgroundPresetSlug
      },
      presetMap
    );
  }, [draftPreview, presetMap, selectedBackgroundPresetSlug, selectedThemeEntry?.theme.background]);
  const previewAppearance = useMemo(
    () =>
      resolveBackgroundAppearance(previewConfig, 'dashboard', selectedThemeEntry?.theme) ??
      resolveBackgroundAppearance(selectedThemeEntry?.theme.background, 'dashboard', selectedThemeEntry?.theme),
    [previewConfig, selectedThemeEntry?.theme]
  );
  const previewTransition = useMemo(
    () => getThemeBackgroundTransition(selectedThemeEntry?.theme),
    [selectedThemeEntry?.theme]
  );

  const persistDashboardBackground = async (presetSlug: string | null) => {
    const response = await fetch('/api/dashboard-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ presetSlug })
    });

    const payload = (await response.json().catch(() => null)) as { presetSlug?: string | null } | null;
    if (!response.ok) {
      throw new Error('Failed to save dashboard background preference.');
    }

    return payload?.presetSlug ?? null;
  };

  return (
    <main className="dashboardPage">
      {previewAppearance ? (
        <ResolvedBackgroundLayer
          targetAppearance={previewAppearance}
          transition={previewTransition}
        />
      ) : null}

      <div className="dashboardPageContent">
        <section className="dashboardHero">
          <p className="eyebrow">Xtoryteller</p>
          <h1>Agent-first storytelling infrastructure/.</h1>
          <p className="dashboardLead">
            Browse file-backed presentations, open them instantly, and use the YAML + registry system as the source of truth.
          </p>
        </section>

        <DashboardExplorer
          presentations={presentations}
          themes={themes}
          selectedThemeSlug={selectedThemeSlug}
          onThemeChange={async (nextThemeSlug) => {
            const previousThemeSlug = selectedThemeSlug;
            setSelectedThemeSlug(nextThemeSlug);
            setIsSavingTheme(true);

            try {
              const response = await fetch('/api/theme', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ themeSlug: nextThemeSlug })
              });

              if (!response.ok) {
                throw new Error('Failed to save theme preference.');
              }

              startTransition(() => {
                router.refresh();
              });
            } catch {
              setSelectedThemeSlug(previousThemeSlug);
            } finally {
              setIsSavingTheme(false);
            }
          }}
          isSavingTheme={isSavingTheme}
          backgroundPresets={presetDefinitions}
          selectedBackgroundPresetSlug={selectedBackgroundPresetSlug}
          onBackgroundChange={async (nextPresetSlug) => {
            const previousPresetSlug = selectedBackgroundPresetSlug;
            setSelectedBackgroundPresetSlug(nextPresetSlug);
            setIsSavingBackground(true);

            try {
              setSelectedBackgroundPresetSlug(await persistDashboardBackground(nextPresetSlug));
            } catch {
              setSelectedBackgroundPresetSlug(previousPresetSlug);
            } finally {
              setIsSavingBackground(false);
            }
          }}
          isSavingBackground={isSavingBackground}
          onOpenCreatePreset={() => setIsCreateDrawerOpen(true)}
        />
      </div>

      <DashboardBackgroundPresetDrawer
        open={isCreateDrawerOpen}
        theme={selectedThemeEntry.theme}
        onClose={() => {
          setIsCreateDrawerOpen(false);
          setDraftPreview(null);
        }}
        onPreviewChange={setDraftPreview}
        onSaved={async (preset) => {
          setPresetDefinitions((current) =>
            [...current, preset].sort((left, right) => left.slug.localeCompare(right.slug))
          );
          setSelectedBackgroundPresetSlug(preset.slug);
          setDraftPreview(null);
          setIsSavingBackground(true);

          try {
            setSelectedBackgroundPresetSlug(await persistDashboardBackground(preset.slug));
          } finally {
            setIsSavingBackground(false);
          }
        }}
      />
    </main>
  );
}
