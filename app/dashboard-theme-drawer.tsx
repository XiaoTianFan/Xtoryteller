'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  deleteThemePathValue,
  formatThemePathLabel,
  getThemePathValue,
  hasThemePath,
  isRequiredThemePath,
  listThemeEditablePaths,
  setThemePathValue,
  type ThemeEditablePathEntry
} from '@/lib/engine/theme-editor-schema';
import type { BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type { DashboardThemeEntry } from '@/lib/types/dashboard-background';
import type { ThemeSaveResponse } from '@/lib/types/theme-editor';
import type { ThemeConfig } from '@/lib/types/theme';

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function asColorInputValue(value: unknown) {
  return typeof value === 'string' && /^#([\da-f]{3}|[\da-f]{6})$/i.test(value.trim())
    ? value
    : '#000000';
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function asNumberList(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === 'number') : [];
}

function sortPaths(paths: string[]) {
  return [...paths].sort((left, right) => left.localeCompare(right));
}

function getDefaultActivePaths(theme: ThemeConfig) {
  const paths = listThemeEditablePaths(theme)
    .map((entry) => entry.path)
    .filter((path) => path !== 'background.presetRef');

  if (
    theme.background &&
    typeof theme.background === 'object' &&
    !Array.isArray(theme.background) &&
    !paths.includes('background.params')
  ) {
    paths.push('background.params');
  }

  return sortPaths(paths);
}

function getThemeBackgroundPresetRef(theme: ThemeConfig) {
  if (!theme.background || typeof theme.background !== 'object' || Array.isArray(theme.background)) {
    return '';
  }

  return typeof theme.background.presetRef === 'string' ? theme.background.presetRef : '';
}

function getSupplementalBackgroundEntries(theme: ThemeConfig): ThemeEditablePathEntry[] {
  if (!theme.background || typeof theme.background !== 'object' || Array.isArray(theme.background)) {
    return [];
  }

  return [
    {
      path: 'background.params',
      value: getThemePathValue(theme, 'background.params'),
      control: 'json',
      required: false
    }
  ];
}

export function DashboardThemeDrawer({
  open,
  themeSlug,
  theme,
  backgroundPresets,
  onClose,
  onDraftChange,
  onSaved
}: {
  open: boolean;
  themeSlug: string;
  theme: ThemeConfig;
  backgroundPresets: BackgroundPresetDefinitionEntry[];
  onClose: () => void;
  onDraftChange: (draft: ThemeConfig | null) => void;
  onSaved: (theme: DashboardThemeEntry) => void;
}) {
  const [draftTheme, setDraftTheme] = useState(theme);
  const [activePaths, setActivePaths] = useState<string[]>(() =>
    getDefaultActivePaths(theme)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [addPath, setAddPath] = useState('');
  const [jsonDraftValues, setJsonDraftValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const defaultActivePaths = useMemo(() => getDefaultActivePaths(theme), [theme]);

  const allEntries = useMemo(() => {
    const baseEntries = listThemeEditablePaths(theme);
    const knownPaths = new Set(baseEntries.map((entry) => entry.path));
    const supplementalEntries = getSupplementalBackgroundEntries(theme).filter(
      (entry) => !knownPaths.has(entry.path)
    );

    return [...baseEntries, ...supplementalEntries];
  }, [theme]);
  const allPathMap = useMemo(
    () => new Map(allEntries.map((entry) => [entry.path, entry])),
    [allEntries]
  );

  useEffect(() => {
    setDraftTheme(theme);
    setActivePaths(defaultActivePaths);
    setSearchQuery('');
    setAddPath('');
    setJsonDraftValues({});
    setFieldErrors({});
    setSaveError(null);
    setIsSaving(false);
  }, [defaultActivePaths, theme, themeSlug]);

  useEffect(() => {
    if (!open) {
      onDraftChange(null);
      return;
    }

    onDraftChange(draftTheme);
  }, [draftTheme, onDraftChange, open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (!open) {
      return;
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  const filteredPaths = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const entries = activePaths
      .map((path) => {
        const fallback = allPathMap.get(path);
        const value = getThemePathValue(draftTheme, path);
        if (!fallback && !hasThemePath(draftTheme, path)) {
          return null;
        }

        const required = isRequiredThemePath(path, draftTheme);
        return {
          path,
          value,
          required,
          control: fallback?.control ?? 'json',
          label: fallback ? formatThemePathLabel(path) : path
        } satisfies ThemeEditablePathEntry & { label: string };
      })
      .filter(Boolean) as Array<ThemeEditablePathEntry & { label: string }>;

    if (!query) {
      return entries;
    }

    return entries.filter(
      (entry) =>
        entry.path.toLowerCase().includes(query) || entry.label.toLowerCase().includes(query)
    );
  }, [activePaths, allPathMap, draftTheme, searchQuery]);

  const availableEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allEntries.filter((entry) => {
      if (entry.path === 'background.presetRef') {
        return false;
      }

      if (activePaths.includes(entry.path)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        entry.path.toLowerCase().includes(query) ||
        formatThemePathLabel(entry.path).toLowerCase().includes(query)
      );
    });
  }, [activePaths, allEntries, searchQuery]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(draftTheme) !== JSON.stringify(theme) ||
      JSON.stringify(activePaths) !== JSON.stringify(defaultActivePaths),
    [activePaths, defaultActivePaths, draftTheme, theme]
  );

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const updateDraftPath = (path: string, value: unknown) => {
    setDraftTheme((current) => setThemePathValue(current, path, value));
    setSaveError(null);
  };

  const resetDraft = () => {
    setDraftTheme(theme);
    setActivePaths(defaultActivePaths);
    setJsonDraftValues({});
    setFieldErrors({});
    setSaveError(null);
  };

  const selectedBackgroundPresetRef = getThemeBackgroundPresetRef(draftTheme);

  if (!open) {
    return null;
  }

  return (
    <div className="dashboardDrawerBackdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit theme"
        className="dashboardDrawer dashboardThemeDrawer appScrollbarMuted"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboardDrawerHeader">
          <div>
            <strong className="shortcutOverlayTitle">Edit theme</strong>
            <span className="shortcutOverlaySubtitle">
              Tune the active dashboard theme live, then save it back to its YAML file.
            </span>
          </div>
          <button type="button" className="ghostButton" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="dashboardDrawerBody">
          <section className="dashboardDrawerSection">
            <div className="dashboardSectionHeader">
              <strong>{theme.name}</strong>
              <span className="shortcutOverlaySubtitle">{themeSlug}.yaml</span>
            </div>
            <label className="dashboardField">
              <span className="dashboardFieldLabel">Background preset</span>
              <select
                className="dashboardSelect"
                value={selectedBackgroundPresetRef}
                onChange={(event) => {
                  const nextPresetRef = event.target.value;
                  setDraftTheme((current) => {
                    const currentBackground =
                      current.background &&
                      typeof current.background === 'object' &&
                      !Array.isArray(current.background)
                        ? current.background
                        : { type: 'paper-shader' as const };
                    const nextBackground = {
                      ...currentBackground,
                      type: currentBackground.type ?? 'paper-shader'
                    } as Record<string, unknown>;

                    if (nextPresetRef) {
                      nextBackground.presetRef = nextPresetRef;
                    } else {
                      delete nextBackground.presetRef;
                    }

                    return {
                      ...current,
                      background: nextBackground as ThemeConfig['background']
                    };
                  });
                  setSaveError(null);
                }}
              >
                <option value="">Select a background preset</option>
                {backgroundPresets.map((preset) => (
                  <option key={preset.slug} value={preset.slug}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="dashboardFieldHint">
              Choose the base preset here, then tweak `background.*` overrides below.
            </p>
            <label className="dashboardField">
              <span className="dashboardFieldLabel">Filter parameters</span>
              <input
                className="dashboardInput"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by path or label"
              />
            </label>
            <div className="dashboardFieldRow">
              <label className="dashboardField">
                <span className="dashboardFieldLabel">Add parameter</span>
                <select
                  className="dashboardSelect"
                  value={addPath}
                  onChange={(event) => setAddPath(event.target.value)}
                >
                  <option value="">Select a removed parameter</option>
                  {availableEntries.map((entry) => (
                    <option key={entry.path} value={entry.path}>
                      {entry.path}
                    </option>
                  ))}
                </select>
              </label>
              <div className="dashboardThemeDrawerButtonStack">
                <button
                  type="button"
                  className="ghostButton"
                  disabled={!addPath}
                  onClick={() => {
                    const sourceEntry = allPathMap.get(addPath);
                    if (!sourceEntry) {
                      return;
                    }

                    updateDraftPath(addPath, sourceEntry.value);
                    setActivePaths((current) => sortPaths([...current, addPath]));
                    setAddPath('');
                  }}
                >
                  Add parameter
                </button>
                <button
                  type="button"
                  className="ghostButton"
                  disabled={!isDirty}
                  onClick={resetDraft}
                >
                  Reset
                </button>
              </div>
            </div>
            <p className="dashboardFieldHint">
              Showing {filteredPaths.length} active parameters. Required paths cannot be removed.
            </p>
          </section>

          <section className="dashboardDrawerSection">
            <div className="dashboardSectionHeader">
              <strong>Active parameters</strong>
              <span className="shortcutOverlaySubtitle">{activePaths.length} total</span>
            </div>

            <div className="dashboardThemeFieldList">
              {filteredPaths.map((entry) => {
                const pathError = fieldErrors[entry.path];

                if (entry.control === 'color') {
                  const value = typeof entry.value === 'string' ? entry.value : '';
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <button
                          type="button"
                          className="ghostButton"
                          disabled={entry.required}
                          onClick={() => {
                            setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                            setActivePaths((current) => current.filter((path) => path !== entry.path));
                            setJsonDraftValues((current) => {
                              const next = { ...current };
                              delete next[entry.path];
                              return next;
                            });
                            setFieldErrors((current) => {
                              const next = { ...current };
                              delete next[entry.path];
                              return next;
                            });
                          }}
                        >
                          {entry.required ? 'Required' : 'Remove'}
                        </button>
                      </div>
                      <div className="dashboardColorField">
                        <input
                          className="dashboardColorInput"
                          type="color"
                          value={asColorInputValue(value)}
                          onChange={(event) => updateDraftPath(entry.path, event.target.value)}
                        />
                        <input
                          className="dashboardInput"
                          type="text"
                          value={value}
                          onChange={(event) => updateDraftPath(entry.path, event.target.value)}
                        />
                      </div>
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                if (entry.control === 'text') {
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <button
                          type="button"
                          className="ghostButton"
                          disabled={entry.required}
                          onClick={() => {
                            setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                            setActivePaths((current) => current.filter((path) => path !== entry.path));
                          }}
                        >
                          {entry.required ? 'Required' : 'Remove'}
                        </button>
                      </div>
                      <input
                        className="dashboardInput"
                        type="text"
                        value={typeof entry.value === 'string' ? entry.value : ''}
                        onChange={(event) => updateDraftPath(entry.path, event.target.value)}
                      />
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                if (entry.control === 'number') {
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <button
                          type="button"
                          className="ghostButton"
                          disabled={entry.required}
                          onClick={() => {
                            setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                            setActivePaths((current) => current.filter((path) => path !== entry.path));
                          }}
                        >
                          {entry.required ? 'Required' : 'Remove'}
                        </button>
                      </div>
                      <input
                        className="dashboardInput dashboardNumberInput"
                        type="number"
                        value={typeof entry.value === 'number' ? entry.value : 0}
                        onChange={(event) => updateDraftPath(entry.path, Number(event.target.value))}
                      />
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                if (entry.control === 'boolean') {
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <button
                          type="button"
                          className="ghostButton"
                          disabled={entry.required}
                          onClick={() => {
                            setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                            setActivePaths((current) => current.filter((path) => path !== entry.path));
                          }}
                        >
                          {entry.required ? 'Required' : 'Remove'}
                        </button>
                      </div>
                      <label className="dashboardBooleanField">
                        <input
                          type="checkbox"
                          checked={Boolean(entry.value)}
                          onChange={(event) => updateDraftPath(entry.path, event.target.checked)}
                        />
                        <span>{Boolean(entry.value) ? 'Enabled' : 'Disabled'}</span>
                      </label>
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                if (entry.control === 'color-list') {
                  const colors = asStringList(entry.value);
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <div className="dashboardThemeFieldActions">
                          <button
                            type="button"
                            className="ghostButton"
                            onClick={() => updateDraftPath(entry.path, [...colors, '#ffffff'])}
                          >
                            Add color
                          </button>
                          <button
                            type="button"
                            className="ghostButton"
                            disabled={entry.required}
                            onClick={() => {
                              setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                              setActivePaths((current) => current.filter((path) => path !== entry.path));
                            }}
                          >
                            {entry.required ? 'Required' : 'Remove'}
                          </button>
                        </div>
                      </div>
                      <div className="dashboardColorList">
                        {colors.map((color, index) => (
                          <div key={`${entry.path}-${index}`} className="dashboardColorListRow">
                            <input
                              className="dashboardColorInput"
                              type="color"
                              value={asColorInputValue(color)}
                              onChange={(event) => {
                                const nextColors = [...colors];
                                nextColors[index] = event.target.value;
                                updateDraftPath(entry.path, nextColors);
                              }}
                            />
                            <input
                              className="dashboardInput"
                              type="text"
                              value={color}
                              onChange={(event) => {
                                const nextColors = [...colors];
                                nextColors[index] = event.target.value;
                                updateDraftPath(entry.path, nextColors);
                              }}
                            />
                            <button
                              type="button"
                              className="ghostButton"
                              onClick={() => {
                                const nextColors = colors.filter((_, colorIndex) => colorIndex !== index);
                                updateDraftPath(entry.path, nextColors);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                if (entry.control === 'text-list') {
                  const values = asStringList(entry.value);
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <div className="dashboardThemeFieldActions">
                          <button
                            type="button"
                            className="ghostButton"
                            onClick={() => updateDraftPath(entry.path, [...values, ''])}
                          >
                            Add item
                          </button>
                          <button
                            type="button"
                            className="ghostButton"
                            disabled={entry.required}
                            onClick={() => {
                              setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                              setActivePaths((current) => current.filter((path) => path !== entry.path));
                            }}
                          >
                            {entry.required ? 'Required' : 'Remove'}
                          </button>
                        </div>
                      </div>
                      <div className="dashboardThemeListEditor">
                        {values.map((item, index) => (
                          <div key={`${entry.path}-${index}`} className="dashboardFieldRow">
                            <input
                              className="dashboardInput"
                              type="text"
                              value={item}
                              onChange={(event) => {
                                const nextValues = [...values];
                                nextValues[index] = event.target.value;
                                updateDraftPath(entry.path, nextValues);
                              }}
                            />
                            <button
                              type="button"
                              className="ghostButton"
                              onClick={() => updateDraftPath(entry.path, values.filter((_, itemIndex) => itemIndex !== index))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                if (entry.control === 'number-list') {
                  const values = asNumberList(entry.value);
                  return (
                    <div key={entry.path} className="dashboardThemeFieldCard">
                      <div className="dashboardSectionHeader">
                        <div className="dashboardThemeFieldMeta">
                          <span className="dashboardFieldLabel">{entry.label}</span>
                          <code>{entry.path}</code>
                        </div>
                        <div className="dashboardThemeFieldActions">
                          <button
                            type="button"
                            className="ghostButton"
                            onClick={() => updateDraftPath(entry.path, [...values, 0])}
                          >
                            Add item
                          </button>
                          <button
                            type="button"
                            className="ghostButton"
                            disabled={entry.required}
                            onClick={() => {
                              setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                              setActivePaths((current) => current.filter((path) => path !== entry.path));
                            }}
                          >
                            {entry.required ? 'Required' : 'Remove'}
                          </button>
                        </div>
                      </div>
                      <div className="dashboardThemeListEditor">
                        {values.map((item, index) => (
                          <div key={`${entry.path}-${index}`} className="dashboardFieldRow">
                            <input
                              className="dashboardInput dashboardNumberInput"
                              type="number"
                              value={item}
                              onChange={(event) => {
                                const nextValues = [...values];
                                nextValues[index] = Number(event.target.value);
                                updateDraftPath(entry.path, nextValues);
                              }}
                            />
                            <button
                              type="button"
                              className="ghostButton"
                              onClick={() => updateDraftPath(entry.path, values.filter((_, itemIndex) => itemIndex !== index))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      {pathError ? <span className="mapEditError">{pathError}</span> : null}
                    </div>
                  );
                }

                const jsonValue = jsonDraftValues[entry.path] ?? stringifyJson(entry.value ?? null);
                return (
                  <div key={entry.path} className="dashboardThemeFieldCard">
                    <div className="dashboardSectionHeader">
                      <div className="dashboardThemeFieldMeta">
                        <span className="dashboardFieldLabel">{entry.label}</span>
                        <code>{entry.path}</code>
                      </div>
                      <button
                        type="button"
                        className="ghostButton"
                        disabled={entry.required}
                        onClick={() => {
                          setDraftTheme((current) => deleteThemePathValue(current, entry.path));
                          setActivePaths((current) => current.filter((path) => path !== entry.path));
                          setJsonDraftValues((current) => {
                            const next = { ...current };
                            delete next[entry.path];
                            return next;
                          });
                          setFieldErrors((current) => {
                            const next = { ...current };
                            delete next[entry.path];
                            return next;
                          });
                        }}
                      >
                        {entry.required ? 'Required' : 'Remove'}
                      </button>
                    </div>
                    <textarea
                      className="dashboardTextarea dashboardJsonInput"
                      value={jsonValue}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setJsonDraftValues((current) => ({ ...current, [entry.path]: nextValue }));

                        try {
                          const parsed = JSON.parse(nextValue) as unknown;
                          updateDraftPath(entry.path, parsed);
                          setFieldErrors((current) => {
                            const next = { ...current };
                            delete next[entry.path];
                            return next;
                          });
                        } catch {
                          setFieldErrors((current) => ({
                            ...current,
                            [entry.path]: `Invalid JSON for ${entry.path}.`
                          }));
                        }
                      }}
                    />
                    {pathError ? <span className="mapEditError">{pathError}</span> : null}
                  </div>
                );
              })}

              {!filteredPaths.length ? (
                <div className="dashboardThemeEmptyState">
                  <strong>No matching parameters</strong>
                  <span className="shortcutOverlaySubtitle">
                    Clear the filter or re-add one of the removed paths.
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="dashboardDrawerFooter">
          {saveError ? <span className="mapEditError">{saveError}</span> : null}
          {hasFieldErrors ? (
            <span className="mapEditError">Resolve JSON field errors before saving.</span>
          ) : null}
          <button type="button" className="ghostButton" onClick={resetDraft} disabled={!isDirty || isSaving}>
            Reset
          </button>
          <button
            type="button"
            className="ghostButton"
            disabled={!isDirty || hasFieldErrors || isSaving}
            onClick={async () => {
              setIsSaving(true);
              setSaveError(null);

              try {
                const response = await fetch(`/api/themes/${themeSlug}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    theme: draftTheme
                  })
                });
                const payload = (await response.json().catch(() => null)) as
                  | ({ error?: string } & Partial<ThemeSaveResponse>)
                  | null;

                if (!response.ok || !payload?.theme) {
                  throw new Error(payload?.error ?? 'Failed to save theme.');
                }

                onSaved(payload.theme);
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : 'Failed to save theme.');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save theme'}
          </button>
        </div>
      </div>
    </div>
  );
}
