'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useMemo, useState } from 'react';

import { DashboardBackgroundPresetDrawer } from '@/app/dashboard-background-preset-drawer';
import { DashboardExplorer } from '@/app/dashboard-explorer';
import { DashboardThemeDrawer } from '@/app/dashboard-theme-drawer';
import {
  resolveBackgroundConfigPresetRefs,
  resolveThemeBackgroundPresetRefs
} from '@/lib/engine/background-preset-resolver';
import { getThemeBackgroundTransition, resolveBackgroundAppearance } from '@/lib/runtime/background-config';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { ResolvedBackgroundLayer } from '@/lib/runtime/ui/background-layer';
import type { BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type {
  CreateBackgroundPresetPayload,
  DashboardThemeEntry
} from '@/lib/types/dashboard-background';
import type { PresentationIndexEntry } from '@/lib/types/presentation';
import type { ThemeConfig } from '@/lib/types/theme';

function findTheme(themes: DashboardThemeEntry[], slug: string) {
  return themes.find((entry) => entry.slug === slug) ?? themes[0];
}

function getThemeBackgroundPresetSlug(theme: ThemeConfig) {
  if (!theme.background || typeof theme.background !== 'object' || Array.isArray(theme.background)) {
    return null;
  }

  return typeof theme.background.presetRef === 'string' && theme.background.presetRef.trim()
    ? theme.background.presetRef
    : null;
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
  const [themeDefinitions, setThemeDefinitions] = useState(themes);
  const [selectedThemeSlug, setSelectedThemeSlug] = useState(initialThemeSlug);
  const [selectedBackgroundPresetSlug, setSelectedBackgroundPresetSlug] = useState<string | null>(initialBackgroundPresetSlug);
  const [presetDefinitions, setPresetDefinitions] = useState(backgroundPresets);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isSavingBackground, setIsSavingBackground] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [draftPreview, setDraftPreview] = useState<CreateBackgroundPresetPayload | null>(null);
  const [draftTheme, setDraftTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    setThemeDefinitions(themes);
  }, [themes]);

  useEffect(() => {
    setPresetDefinitions(backgroundPresets);
  }, [backgroundPresets]);

  const selectedThemeEntry = useMemo(
    () => findTheme(themeDefinitions, selectedThemeSlug),
    [selectedThemeSlug, themeDefinitions]
  );
  const presetMap = useMemo(
    () => new Map(presetDefinitions.map((entry) => [entry.slug, entry.config])),
    [presetDefinitions]
  );
  const previewTheme = useMemo(
    () => resolveThemeBackgroundPresetRefs(draftTheme ?? selectedThemeEntry.sourceTheme, presetMap),
    [draftTheme, presetMap, selectedThemeEntry.sourceTheme]
  );
  const themeBackgroundPresetSlug = useMemo(
    () => getThemeBackgroundPresetSlug(selectedThemeEntry.sourceTheme),
    [selectedThemeEntry.sourceTheme]
  );
  const activeEditablePresetSlug = selectedBackgroundPresetSlug ?? themeBackgroundPresetSlug;
  const activeEditablePreset = useMemo(
    () =>
      presetDefinitions.find((entry) => entry.slug === activeEditablePresetSlug) ?? null,
    [activeEditablePresetSlug, presetDefinitions]
  );
  const activeEditableBackgroundConfig = useMemo(() => {
    if (selectedBackgroundPresetSlug) {
      return resolveBackgroundConfigPresetRefs(
        {
          type: 'paper-shader' as const,
          presetRef: selectedBackgroundPresetSlug
        },
        presetMap
      );
    }

    return previewTheme.background ?? null;
  }, [presetMap, previewTheme.background, selectedBackgroundPresetSlug]);
  const previewConfig = useMemo(() => {
    if (draftPreview) {
      return {
        type: 'paper-shader' as const,
        shader: draftPreview.shader,
        preset: draftPreview.preset,
        params: draftPreview.params,
        colorStops: draftPreview.colorStops,
        intensity: draftPreview.intensity,
        grain: draftPreview.grain,
        contrast: draftPreview.contrast,
        speed: draftPreview.speed,
        opacity: draftPreview.opacity
      };
    }

    if (!selectedBackgroundPresetSlug) {
      return previewTheme.background ?? null;
    }

    return resolveBackgroundConfigPresetRefs(
      {
        type: 'paper-shader' as const,
        presetRef: selectedBackgroundPresetSlug
      },
      presetMap
    );
  }, [draftPreview, presetMap, previewTheme.background, selectedBackgroundPresetSlug]);
  const previewAppearance = useMemo(
    () =>
      resolveBackgroundAppearance(previewConfig, 'dashboard', previewTheme) ??
      resolveBackgroundAppearance(previewTheme.background, 'dashboard', previewTheme),
    [previewConfig, previewTheme]
  );
  const previewTransition = useMemo(
    () => getThemeBackgroundTransition(previewTheme),
    [previewTheme]
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
      <ThemeProvider theme={previewTheme}>
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
              Browse and open your YAML + registry backed presentations instantly.
            </p>
          </section>

          <DashboardExplorer
            presentations={presentations}
            themes={themeDefinitions}
            selectedThemeSlug={selectedThemeSlug}
            onThemeChange={async (nextThemeSlug) => {
              const previousThemeSlug = selectedThemeSlug;
              setSelectedThemeSlug(nextThemeSlug);
              setDraftTheme(null);
              setIsThemeDrawerOpen(false);
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
            onOpenThemeEditor={() => setIsThemeDrawerOpen(true)}
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
          activePreset={activeEditablePreset}
          activePresetSlug={activeEditablePresetSlug}
          effectiveBackground={activeEditableBackgroundConfig}
          theme={previewTheme}
          onClose={() => {
            setIsCreateDrawerOpen(false);
            setDraftPreview(null);
          }}
          onPreviewChange={setDraftPreview}
          onSaved={async (preset, options) => {
            setPresetDefinitions((current) => {
              const existing = current.find((entry) => entry.slug === preset.slug);
              if (existing) {
                return current
                  .map((entry) => (entry.slug === preset.slug ? preset : entry))
                  .sort((left, right) => left.slug.localeCompare(right.slug));
              }

              return [...current, preset].sort((left, right) => left.slug.localeCompare(right.slug));
            });
            setDraftPreview(null);

            const shouldSelectPreset =
              options.mode === 'saveNew' || selectedBackgroundPresetSlug !== null;
            if (!shouldSelectPreset) {
              return;
            }

            setSelectedBackgroundPresetSlug(preset.slug);
            setIsSavingBackground(true);

            try {
              setSelectedBackgroundPresetSlug(await persistDashboardBackground(preset.slug));
            } finally {
              setIsSavingBackground(false);
            }
          }}
        />

        <DashboardThemeDrawer
          open={isThemeDrawerOpen}
          themeSlug={selectedThemeEntry.slug}
          theme={selectedThemeEntry.sourceTheme}
          backgroundPresets={presetDefinitions}
          onClose={() => {
            setIsThemeDrawerOpen(false);
            setDraftTheme(null);
          }}
          onDraftChange={setDraftTheme}
          onSaved={(savedTheme) => {
            setThemeDefinitions((current) =>
              current.map((entry) => (entry.slug === savedTheme.slug ? savedTheme : entry))
            );
            setDraftTheme(null);
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      </ThemeProvider>
    </main>
  );
}
