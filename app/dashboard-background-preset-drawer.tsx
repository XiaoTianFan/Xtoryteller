'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

import {
  availableBackgroundPresetShaders,
  defaultBackgroundPresetShader,
  getPaperShaderParameterControls,
  getPaperShaderPresetOptions,
  getPaperShaderPresetSeed
} from '@/lib/runtime/background-preset-controls';
import type { SupportedPaperShaderName } from '@/lib/runtime/paper-shaders';
import type {
  CreateBackgroundPresetPayload,
  CreateBackgroundPresetResponse
} from '@/lib/types/dashboard-background';
import type { ThemeConfig } from '@/lib/types/theme';

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJsonInput(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return JSON.parse(value) as unknown;
}

function asColorValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : '#000000';
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export function DashboardBackgroundPresetDrawer({
  open,
  theme,
  onClose,
  onPreviewChange,
  onSaved
}: {
  open: boolean;
  theme: ThemeConfig;
  onClose: () => void;
  onPreviewChange: (draft: CreateBackgroundPresetPayload | null) => void;
  onSaved: (payload: CreateBackgroundPresetResponse['preset']) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [shader, setShader] = useState<SupportedPaperShaderName>(defaultBackgroundPresetShader);
  const presetOptions = useMemo(() => getPaperShaderPresetOptions(shader), [shader]);
  const [preset, setPreset] = useState<string | undefined>(presetOptions[0]?.value);
  const [params, setParams] = useState<Record<string, unknown>>(() =>
    getPaperShaderPresetSeed(defaultBackgroundPresetShader, presetOptions[0]?.value)
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      onPreviewChange(null);
      return;
    }

    onPreviewChange({
      name: name.trim() || 'Untitled Preset',
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(tags.trim()
        ? {
            tags: tags
              .split(',')
              .map((entry) => entry.trim())
              .filter(Boolean)
          }
        : {}),
      shader,
      ...(preset ? { preset } : {}),
      params
    });
  }, [description, name, onPreviewChange, open, params, preset, shader, tags]);

  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setTags('');
      setShader(defaultBackgroundPresetShader);
      setPreset(undefined);
      setParams({});
      setSaveError(null);
      setIsSaving(false);
    }
  }, [open]);

  useEffect(() => {
    const nextPreset = presetOptions[0]?.value;
    setPreset(nextPreset);
    setParams(getPaperShaderPresetSeed(shader, nextPreset));
  }, [presetOptions, shader]);

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

  const controls = useMemo(() => getPaperShaderParameterControls(shader), [shader]);

  if (!open) {
    return null;
  }

  return (
    <div className="dashboardDrawerBackdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create background preset"
        className="dashboardDrawer appScrollbarMuted"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboardDrawerHeader">
          <div>
            <strong className="shortcutOverlayTitle">Create background preset</strong>
            <span className="shortcutOverlaySubtitle">
              Build a shared Paper shader preset and preview it live on the dashboard.
            </span>
          </div>
          <button type="button" className="ghostButton" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="dashboardDrawerBody">
          <section className="dashboardDrawerSection">
            <label className="dashboardField">
              <span className="dashboardFieldLabel">Preset name</span>
              <input
                className="dashboardInput"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Editorial Drift"
              />
            </label>

            <label className="dashboardField">
              <span className="dashboardFieldLabel">Description</span>
              <textarea
                className="dashboardTextarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short summary for the preset list"
              />
            </label>

            <label className="dashboardField">
              <span className="dashboardFieldLabel">Tags</span>
              <input
                className="dashboardInput"
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="paper, warm, editorial"
              />
            </label>
          </section>

          <section className="dashboardDrawerSection">
            <div className="dashboardFieldRow">
              <label className="dashboardField">
                <span className="dashboardFieldLabel">Shader</span>
                <select
                  className="dashboardSelect"
                  value={shader}
                  onChange={(event) => {
                    startTransition(() => {
                      setShader(event.target.value as SupportedPaperShaderName);
                    });
                  }}
                >
                  {availableBackgroundPresetShaders.map((shaderName) => (
                    <option key={shaderName} value={shaderName}>
                      {shaderName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="dashboardField">
                <span className="dashboardFieldLabel">Seed preset</span>
                <select
                  className="dashboardSelect"
                  value={preset ?? ''}
                  onChange={(event) => {
                    const nextPreset = event.target.value || undefined;
                    setPreset(nextPreset);
                    setParams(getPaperShaderPresetSeed(shader, nextPreset));
                  }}
                >
                  {presetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="dashboardFieldHint">
              Theme background color hint: <code>{String(theme.colors.background ?? 'n/a')}</code>
            </p>
          </section>

          <section className="dashboardDrawerSection">
            <div className="dashboardSectionHeader">
              <strong>Parameters</strong>
              <span className="shortcutOverlaySubtitle">{controls.length} controls</span>
            </div>
            <div className="dashboardParamGrid">
              {controls.map((control) => {
                const value = params[control.key];

                if (control.kind === 'color') {
                  return (
                    <label key={control.key} className="dashboardField">
                      <span className="dashboardFieldLabel">{control.label}</span>
                      <div className="dashboardColorField">
                        <input
                          className="dashboardColorInput"
                          type="color"
                          value={asColorValue(value)}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setParams((current) => ({ ...current, [control.key]: nextValue }));
                          }}
                        />
                        <input
                          className="dashboardInput"
                          type="text"
                          value={typeof value === 'string' ? value : ''}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setParams((current) => ({ ...current, [control.key]: nextValue }));
                          }}
                        />
                      </div>
                    </label>
                  );
                }

                if (control.kind === 'color-list') {
                  const colors = asStringList(value);
                  return (
                    <div key={control.key} className="dashboardField">
                      <div className="dashboardSectionHeader">
                        <span className="dashboardFieldLabel">{control.label}</span>
                        <button
                          type="button"
                          className="ghostButton"
                          onClick={() =>
                            setParams((current) => ({
                              ...current,
                              [control.key]: [...colors, '#ffffff']
                            }))
                          }
                        >
                          Add color
                        </button>
                      </div>
                      <div className="dashboardColorList">
                        {colors.map((color, index) => (
                          <div key={`${control.key}-${index}`} className="dashboardColorListRow">
                            <input
                              className="dashboardColorInput"
                              type="color"
                              value={asColorValue(color)}
                              onChange={(event) => {
                                const nextColors = [...colors];
                                nextColors[index] = event.target.value;
                                setParams((current) => ({ ...current, [control.key]: nextColors }));
                              }}
                            />
                            <input
                              className="dashboardInput"
                              type="text"
                              value={color}
                              onChange={(event) => {
                                const nextColors = [...colors];
                                nextColors[index] = event.target.value;
                                setParams((current) => ({ ...current, [control.key]: nextColors }));
                              }}
                            />
                            <button
                              type="button"
                              className="ghostButton"
                              onClick={() => {
                                const nextColors = colors.filter((_, colorIndex) => colorIndex !== index);
                                setParams((current) => ({ ...current, [control.key]: nextColors }));
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (control.kind === 'select') {
                  return (
                    <label key={control.key} className="dashboardField">
                      <span className="dashboardFieldLabel">{control.label}</span>
                      <select
                        className="dashboardSelect"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setParams((current) => ({ ...current, [control.key]: nextValue }));
                        }}
                      >
                        {(control.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (control.kind === 'number') {
                  return (
                    <label key={control.key} className="dashboardField">
                      <span className="dashboardFieldLabel">{control.label}</span>
                      <div className="dashboardRangeField">
                        <input
                          className="dashboardRangeInput"
                          type="range"
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          value={typeof value === 'number' ? value : control.min ?? 0}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setParams((current) => ({ ...current, [control.key]: nextValue }));
                          }}
                        />
                        <input
                          className="dashboardInput dashboardNumberInput"
                          type="number"
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          value={typeof value === 'number' ? value : ''}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setParams((current) => ({ ...current, [control.key]: nextValue }));
                          }}
                        />
                      </div>
                    </label>
                  );
                }

                if (control.kind === 'text') {
                  return (
                    <label key={control.key} className="dashboardField">
                      <span className="dashboardFieldLabel">{control.label}</span>
                      <input
                        className="dashboardInput"
                        type="text"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setParams((current) => ({ ...current, [control.key]: nextValue }));
                        }}
                      />
                    </label>
                  );
                }

                return (
                  <label key={control.key} className="dashboardField">
                    <span className="dashboardFieldLabel">{control.label}</span>
                    <textarea
                      className="dashboardTextarea dashboardJsonInput"
                      value={stringifyJson(value ?? null)}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        try {
                          const parsed = parseJsonInput(nextValue);
                          setParams((current) => ({ ...current, [control.key]: parsed }));
                          setSaveError(null);
                        } catch {
                          setSaveError(`Invalid JSON for ${control.label}.`);
                        }
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <div className="dashboardDrawerFooter">
          {saveError ? <span className="mapEditError">{saveError}</span> : null}
          <button
            type="button"
            className="ghostButton"
            disabled={!name.trim() || isSaving}
            onClick={async () => {
              setIsSaving(true);
              setSaveError(null);

              try {
                const response = await fetch('/api/background-presets', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    name: name.trim(),
                    ...(description.trim() ? { description: description.trim() } : {}),
                    ...(tags.trim()
                      ? {
                          tags: tags
                            .split(',')
                            .map((entry) => entry.trim())
                            .filter(Boolean)
                        }
                      : {}),
                    shader,
                    ...(preset ? { preset } : {}),
                    params
                  } satisfies CreateBackgroundPresetPayload)
                });

                const payload = (await response.json().catch(() => null)) as
                  | ({ error?: string } & Partial<CreateBackgroundPresetResponse>)
                  | null;

                if (!response.ok || !payload?.preset) {
                  throw new Error(payload?.error ?? 'Failed to save preset.');
                }

                onSaved(payload.preset);
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : 'Failed to save preset.');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save preset'}
          </button>
        </div>
      </div>
    </div>
  );
}
