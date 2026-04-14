'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

import {
  availableBackgroundPresetShaders,
  defaultBackgroundPresetShader,
  getPaperShaderGenericControls,
  getPaperShaderParameterControls,
  getPaperShaderPresetOptions,
  getPaperShaderPresetSeed
} from '@/lib/runtime/background-preset-controls';
import type { SupportedPaperShaderName } from '@/lib/runtime/paper-shaders';
import type { BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type {
  CreateBackgroundPresetPayload,
  CreateBackgroundPresetResponse
} from '@/lib/types/dashboard-background';
import type { BackgroundShaderConfig } from '@/lib/types/presentation';
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

function buildPresetPayload(
  name: string,
  description: string,
  tags: string,
  shader: SupportedPaperShaderName,
  preset: string | undefined,
  params: Record<string, unknown>,
  genericValues: Record<string, unknown>
): CreateBackgroundPresetPayload {
  return {
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
    ...(Object.keys(params).length ? { params } : {}),
    ...(Array.isArray(genericValues.colorStops) && genericValues.colorStops.length
      ? { colorStops: genericValues.colorStops as string[] }
      : {}),
    ...(typeof genericValues.intensity === 'number' ? { intensity: genericValues.intensity } : {}),
    ...(typeof genericValues.grain === 'number' ? { grain: genericValues.grain } : {}),
    ...(typeof genericValues.contrast === 'number' ? { contrast: genericValues.contrast } : {}),
    ...(typeof genericValues.speed === 'number' ? { speed: genericValues.speed } : {}),
    ...(typeof genericValues.opacity === 'number' ? { opacity: genericValues.opacity } : {})
  };
}

function isSupportedShaderName(value: unknown): value is SupportedPaperShaderName {
  return typeof value === 'string' && availableBackgroundPresetShaders.includes(value as SupportedPaperShaderName);
}

function readBackgroundDraftFromConfig(
  background: BackgroundShaderConfig | null | undefined
): CreateBackgroundPresetPayload | null {
  if (!background || typeof background !== 'object' || Array.isArray(background)) {
    return null;
  }

  const config = background as Extract<BackgroundShaderConfig, Record<string, unknown>>;
  const shader = isSupportedShaderName(config.shader) ? config.shader : defaultBackgroundPresetShader;
  const preset =
    typeof config.preset === 'string' && config.preset.trim()
      ? config.preset
      : getPaperShaderPresetOptions(shader)[0]?.value;

  return {
    name: '',
    shader,
    ...(preset ? { preset } : {}),
    ...(config.params && Object.keys(config.params).length ? { params: config.params } : {}),
    ...(Array.isArray(config.colorStops) ? { colorStops: config.colorStops } : {}),
    ...(typeof config.intensity === 'number' ? { intensity: config.intensity } : {}),
    ...(typeof config.grain === 'number' ? { grain: config.grain } : {}),
    ...(typeof config.contrast === 'number' ? { contrast: config.contrast } : {}),
    ...(typeof config.speed === 'number' ? { speed: config.speed } : {}),
    ...(typeof config.opacity === 'number' ? { opacity: config.opacity } : {})
  };
}

export function DashboardBackgroundPresetDrawer({
  open,
  activePreset,
  activePresetSlug,
  effectiveBackground,
  theme,
  onClose,
  onPreviewChange,
  onSaved
}: {
  open: boolean;
  activePreset: BackgroundPresetDefinitionEntry | null;
  activePresetSlug: string | null;
  effectiveBackground: BackgroundShaderConfig | null | undefined;
  theme: ThemeConfig;
  onClose: () => void;
  onPreviewChange: (draft: CreateBackgroundPresetPayload | null) => void;
  onSaved: (
    payload: CreateBackgroundPresetResponse['preset'],
    options: { mode: 'save' | 'saveNew' }
  ) => void;
}) {
  const [currentPresetSlug, setCurrentPresetSlug] = useState<string | null>(activePresetSlug);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [shader, setShader] = useState<SupportedPaperShaderName>(defaultBackgroundPresetShader);
  const presetOptions = useMemo(() => getPaperShaderPresetOptions(shader), [shader]);
  const [preset, setPreset] = useState<string | undefined>(presetOptions[0]?.value);
  const [params, setParams] = useState<Record<string, unknown>>(() =>
    getPaperShaderPresetSeed(defaultBackgroundPresetShader, presetOptions[0]?.value)
  );
  const [genericValues, setGenericValues] = useState<Record<string, unknown>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      onPreviewChange(null);
      return;
    }

    onPreviewChange(buildPresetPayload(name, description, tags, shader, preset, params, genericValues));
  }, [description, genericValues, name, onPreviewChange, open, params, preset, shader, tags]);

  useEffect(() => {
    if (!open) {
      setCurrentPresetSlug(activePresetSlug);
      setName('');
      setDescription('');
      setTags('');
      setShader(defaultBackgroundPresetShader);
      setPreset(undefined);
      setParams({});
      setGenericValues({});
      setSaveError(null);
      setIsSaving(false);
      return;
    }

    const source =
      readBackgroundDraftFromConfig(effectiveBackground) ??
      activePreset?.config ??
      readBackgroundDraftFromConfig(theme.background);
    const sourceShader = isSupportedShaderName(source?.shader) ? source.shader : defaultBackgroundPresetShader;
    const sourcePreset =
      typeof source?.preset === 'string' && source.preset.trim()
        ? source.preset
        : getPaperShaderPresetOptions(sourceShader)[0]?.value;

    setCurrentPresetSlug(activePresetSlug);
    setName(activePreset?.name ?? source?.name ?? '');
    setDescription(activePreset?.description ?? source?.description ?? '');
    setTags((activePreset?.tags ?? source?.tags ?? []).join(', '));
    setShader(sourceShader);
    setPreset(sourcePreset);
    setParams(source?.params ?? getPaperShaderPresetSeed(sourceShader, sourcePreset));
    setGenericValues({
      ...(Array.isArray(source?.colorStops) ? { colorStops: source.colorStops } : {}),
      ...(typeof source?.intensity === 'number' ? { intensity: source.intensity } : {}),
      ...(typeof source?.grain === 'number' ? { grain: source.grain } : {}),
      ...(typeof source?.contrast === 'number' ? { contrast: source.contrast } : {}),
      ...(typeof source?.speed === 'number' ? { speed: source.speed } : {}),
      ...(typeof source?.opacity === 'number' ? { opacity: source.opacity } : {})
    });
    setSaveError(null);
    setIsSaving(false);
  }, [activePreset, activePresetSlug, effectiveBackground, open, theme]);

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
  const genericControls = useMemo(() => getPaperShaderGenericControls(shader), [shader]);

  if (!open) {
    return null;
  }

  return (
    <div className="dashboardDrawerBackdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit background"
        className="dashboardDrawer appScrollbarMuted"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboardDrawerHeader">
          <div>
            <strong className="shortcutOverlayTitle">Edit background</strong>
            <span className="shortcutOverlaySubtitle">
              Edit the active dashboard background preset live, then save over it or fork a new one.
            </span>
          </div>
          <button type="button" className="ghostButton" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="dashboardDrawerBody">
          <section className="dashboardDrawerSection">
            <div className="dashboardSectionHeader">
              <strong>{currentPresetSlug ?? 'Theme background'}</strong>
              <span className="shortcutOverlaySubtitle">
                {currentPresetSlug
                  ? 'Saving will update this shared preset in place.'
                  : 'No shared preset detected. Save New to create one.'}
              </span>
            </div>
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
                    const nextShader = event.target.value as SupportedPaperShaderName;
                    const nextPreset = getPaperShaderPresetOptions(nextShader)[0]?.value;
                    startTransition(() => {
                      setShader(nextShader);
                      setPreset(nextPreset);
                      setParams(getPaperShaderPresetSeed(nextShader, nextPreset));
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
              <strong>Shader settings</strong>
              <span className="shortcutOverlaySubtitle">{genericControls.length} controls</span>
            </div>
            <div className="dashboardParamGrid">
              {genericControls.map((control) => {
                const value = genericValues[control.key];

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
                            setGenericValues((current) => ({
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
                                setGenericValues((current) => ({ ...current, [control.key]: nextColors }));
                              }}
                            />
                            <input
                              className="dashboardInput"
                              type="text"
                              value={color}
                              onChange={(event) => {
                                const nextColors = [...colors];
                                nextColors[index] = event.target.value;
                                setGenericValues((current) => ({ ...current, [control.key]: nextColors }));
                              }}
                            />
                            <button
                              type="button"
                              className="ghostButton"
                              onClick={() => {
                                const nextColors = colors.filter((_, colorIndex) => colorIndex !== index);
                                setGenericValues((current) => ({ ...current, [control.key]: nextColors }));
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
                          setGenericValues((current) => ({ ...current, [control.key]: nextValue }));
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
                          setGenericValues((current) => ({ ...current, [control.key]: nextValue }));
                        }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
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
            disabled={!currentPresetSlug || !name.trim() || isSaving}
            onClick={async () => {
              setIsSaving(true);
              setSaveError(null);

              try {
                const requestPayload = buildPresetPayload(
                  name,
                  description,
                  tags,
                  shader,
                  preset,
                  params,
                  genericValues
                );
                const response = await fetch(`/api/background-presets/${currentPresetSlug}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestPayload)
                });

                const payload = (await response.json().catch(() => null)) as
                  | ({ error?: string } & Partial<CreateBackgroundPresetResponse>)
                  | null;

                if (!response.ok || !payload?.preset) {
                  throw new Error(payload?.error ?? 'Failed to save preset.');
                }

                onSaved(payload.preset, { mode: 'save' });
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : 'Failed to save preset.');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="ghostButton"
            disabled={!name.trim() || isSaving}
            onClick={async () => {
              setIsSaving(true);
              setSaveError(null);

              try {
                const requestPayload = buildPresetPayload(
                  name,
                  description,
                  tags,
                  shader,
                  preset,
                  params,
                  genericValues
                );
                const response = await fetch('/api/background-presets', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestPayload)
                });

                const payload = (await response.json().catch(() => null)) as
                  | ({ error?: string } & Partial<CreateBackgroundPresetResponse>)
                  | null;

                if (!response.ok || !payload?.preset) {
                  throw new Error(payload?.error ?? 'Failed to save preset.');
                }

                onSaved(payload.preset, { mode: 'saveNew' });
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : 'Failed to save preset.');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save New'}
          </button>
        </div>
      </div>
    </div>
  );
}
