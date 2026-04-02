import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

import { collectAssetReferences } from './portability-utils.mjs';
import { XTORYTELLER_SCHEMA_DIR } from './skill-paths.mjs';

const root = process.cwd();
const BUILD_SEQUENCE_KEYS = ['items', 'variables', 'nodes', 'layers', 'branches', 'events', 'stages', 'points'];
const PAPER_SHADER_SUPPORT = JSON.parse(
  fsSync.readFileSync(path.join(root, 'lib', 'runtime', 'paper-shader-support.json'), 'utf8')
);
const PAPER_SHADER_NAMES = new Set(Object.keys(PAPER_SHADER_SUPPORT.shaders));
const MARKDOWN_ANNOTATION_COMPONENTS = new Set([
  'body-text',
  'bullet-list',
  'blockquote',
  'callout',
  'comparison-card',
  'card',
  'feature-card',
  'footnote',
  'profile-card',
  'numbered-list',
  'timeline-item'
]);

async function parseYaml(filePath) {
  return YAML.parse(await fs.readFile(filePath, 'utf8'));
}

async function scanManifestEntries(baseDir) {
  return scanManifestEntriesAt(path.join(root, baseDir));
}

async function scanManifestEntriesAt(baseDir) {
  try {
    await fs.access(baseDir);
  } catch {
    return new Map();
  }

  const manifestPaths = await fg('*/manifest.yaml', {
    cwd: baseDir,
    absolute: true,
    onlyFiles: true
  });

  const entries = await Promise.all(
    manifestPaths.map(async (manifestPath) => {
      const manifest = await parseYaml(manifestPath);
      const name = manifest.name || path.basename(path.dirname(manifestPath));
      return [name, manifest];
    })
  );

  return new Map(entries);
}

function mergeManifestMaps(...maps) {
  return new Map(maps.flatMap((map) => [...map.entries()]));
}

async function themeNames() {
  const themePaths = await fg('*.yaml', {
    cwd: path.join(root, 'themes'),
    absolute: true,
    onlyFiles: true
  });
  return new Set(themePaths.map((themePath) => path.basename(themePath, '.yaml')));
}

async function backgroundPresetPaths() {
  return fg('*.yaml', {
    cwd: path.join(root, 'backgrounds'),
    absolute: true,
    onlyFiles: true
  });
}

async function loadBackgroundPresetMap() {
  const presetPaths = await backgroundPresetPaths();
  const entries = await Promise.all(
    presetPaths.map(async (presetPath) => [path.basename(presetPath, '.yaml'), await parseYaml(presetPath)])
  );

  return new Map(entries);
}

async function extractObjectKeys(filePath, objectName) {
  const content = await fs.readFile(filePath, 'utf8');
  const objectMatch = content.match(new RegExp(objectName + ' = \\{([\\s\\S]*?)\\}\\s*(?:as const|satisfies)'));
  if (!objectMatch) {
    throw new Error(`Could not find ${objectName} in ${filePath}`);
  }

  return objectMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/,$/, ''))
    .filter(Boolean)
    .map((line) => line.match(/^(['"])(.+?)\1\s*:|^([a-z][a-z0-9-]*)\s*:|^([a-z][a-z0-9-]*)$/i))
    .filter((match) => Boolean(match))
    .map((match) => match[2] ?? match[3] ?? match[4])
    .sort();
}

async function runtimeRegistryKeys() {
  const [components, layouts, transitions] = await Promise.all([
    extractObjectKeys(path.join(root, 'lib', 'runtime', 'component-registry.tsx'), 'runtimeComponentMap'),
    extractObjectKeys(path.join(root, 'lib', 'runtime', 'layout-registry.tsx'), 'runtimeLayoutMap'),
    extractObjectKeys(path.join(root, 'lib', 'runtime', 'transition-presets.ts'), 'runtimeTransitionMap')
  ]);

  return { components, layouts, transitions };
}

function createIssue(severity, message) {
  return { severity, message };
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizePaperShaderName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = normalizeKey(value);
  return PAPER_SHADER_SUPPORT.aliases[normalized] ?? (PAPER_SHADER_NAMES.has(normalized) ? normalized : null);
}

function getPaperShaderSupport(shaderName) {
  return shaderName ? PAPER_SHADER_SUPPORT.shaders[shaderName] ?? null : null;
}

function normalizePaperShaderPresetName(shaderName, value) {
  if (!shaderName || typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = normalizeKey(value);
  return getPaperShaderSupport(shaderName)?.presets.find((preset) => normalizeKey(preset) === normalized) ?? null;
}

function looksLikeCssBackground(value) {
  return typeof value === 'string' && /(gradient\(|#|rgb\(|rgba\(|hsl\(|hsla\(|var\(|url\()/i.test(value);
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function validateCssGradient(gradient, label, issues) {
  if (!gradient) {
    return;
  }

  const value = asObject(gradient);
  if (!value) {
    issues.push(createIssue('error', `${label} must be an object.`));
    return;
  }

  if (value.type != null && !['linear', 'radial'].includes(value.type)) {
    issues.push(createIssue('error', `${label}.type must be "linear" or "radial".`));
  }

  if (!Array.isArray(value.stops) || value.stops.length < 2 || !value.stops.every((stop) => typeof stop === 'string')) {
    issues.push(createIssue('error', `${label}.stops must contain at least two color strings.`));
  }
}

function validateBackgroundFilterConfig(filter, label, issues) {
  if (filter == null) {
    return;
  }

  const value = asObject(filter);
  if (!value) {
    issues.push(createIssue('error', `${label} must be an object.`));
    return;
  }

  const allowedKeys = new Set(['mode', 'opacity', 'radialSize', 'linearProportion']);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      issues.push(createIssue('error', `${label}.${key} is not supported.`));
    }
  }

  if (
    ![
      'radial',
      'radial-reverse',
      'linear-horizontal',
      'linear-horizontal-reverse',
      'linear-vertical',
      'linear-vertical-reverse'
    ].includes(value.mode)
  ) {
    issues.push(
      createIssue(
        'error',
        `${label}.mode must be "radial", "radial-reverse", "linear-horizontal", "linear-horizontal-reverse", "linear-vertical", or "linear-vertical-reverse".`
      )
    );
  }

  if (value.opacity != null && (!Number.isFinite(value.opacity) || value.opacity < 0 || value.opacity > 1)) {
    issues.push(createIssue('error', `${label}.opacity must be between 0 and 1.`));
  }

  if (value.linearProportion != null && (!Number.isFinite(value.linearProportion) || value.linearProportion < 0 || value.linearProportion > 1)) {
    issues.push(createIssue('error', `${label}.linearProportion must be between 0 and 1.`));
  }

  if (value.radialSize != null) {
    const radialSize = asObject(value.radialSize);
    if (!radialSize) {
      issues.push(createIssue('error', `${label}.radialSize must be an object.`));
    } else {
      const allowedRadialKeys = new Set(['width', 'height']);
      for (const key of Object.keys(radialSize)) {
        if (!allowedRadialKeys.has(key)) {
          issues.push(createIssue('error', `${label}.radialSize.${key} is not supported.`));
        }
      }

      for (const key of ['width', 'height']) {
        if (radialSize[key] != null && (!Number.isFinite(radialSize[key]) || radialSize[key] < 0 || radialSize[key] > 1)) {
          issues.push(createIssue('error', `${label}.radialSize.${key} must be between 0 and 1.`));
        }
      }
    }
  }
}

function validatePaperShaderConfig(value, label, issues, shaderName) {
  const support = getPaperShaderSupport(shaderName);
  if (!support) {
    issues.push(createIssue('error', `${label} references unsupported Paper shader "${shaderName}".`));
    return;
  }

  const normalizedPreset =
    normalizePaperShaderPresetName(shaderName, value.preset) ??
    normalizePaperShaderPresetName(shaderName, value.variant);
  const declaredPreset = typeof value.preset === 'string' ? value.preset : value.variant;
  if (declaredPreset != null && !normalizedPreset) {
    issues.push(
      createIssue(
        'error',
        `${label} references unsupported preset "${declaredPreset}" for Paper shader "${shaderName}".`
      )
    );
  }

  const params = asObject(value.params) ?? {};
  const allowedParams = new Set(support.allowedParams);
  for (const key of Object.keys(params)) {
    if (!allowedParams.has(key)) {
      issues.push(
        createIssue(
          'error',
          `${label}.params.${key} is not supported for Paper shader "${shaderName}".`
        )
      );
    }
  }

  const genericFields = ['colorStops', 'intensity', 'grain', 'contrast', 'speed'];
  for (const field of genericFields) {
    if (value[field] == null) {
      continue;
    }

    if (!support.genericMappings[field]) {
      issues.push(
        createIssue(
          'error',
          `${label}.${field} is not supported for Paper shader "${shaderName}".`
        )
      );
    }
  }

  if (value.colorStops != null) {
    if (!Array.isArray(value.colorStops) || value.colorStops.length < 2 || !value.colorStops.every((entry) => typeof entry === 'string')) {
      issues.push(createIssue('error', `${label}.colorStops must contain at least two color strings.`));
    }
  }
}

function resolvePresetBackedBackground(value, backgroundPresetMap) {
  const presetRef = typeof value.presetRef === 'string' && value.presetRef.trim() ? value.presetRef.trim() : null;
  const preset = presetRef ? backgroundPresetMap.get(presetRef) ?? null : null;

  if (!preset) {
    return { presetRef, preset: null, effectiveValue: value };
  }

  return {
    presetRef,
    preset,
    effectiveValue: {
      ...preset,
      ...value,
      type: value.type ?? 'paper-shader',
      shader: value.shader ?? preset.shader,
      preset: value.preset ?? preset.preset,
      params: {
        ...(asObject(preset.params) ?? {}),
        ...(asObject(value.params) ?? {})
      },
      colorStops: value.colorStops ?? preset.colorStops,
      intensity: value.intensity ?? preset.intensity,
      grain: value.grain ?? preset.grain,
      contrast: value.contrast ?? preset.contrast,
      speed: value.speed ?? preset.speed,
      opacity: value.opacity ?? preset.opacity,
      filter: preset.filter || value.filter
        ? {
            ...(asObject(preset.filter) ?? {}),
            ...(asObject(value.filter) ?? {}),
            radialSize: {
              ...((asObject(preset.filter)?.radialSize && asObject(asObject(preset.filter).radialSize)) ?? {}),
              ...((asObject(value.filter)?.radialSize && asObject(asObject(value.filter).radialSize)) ?? {})
            }
          }
        : undefined
    }
  };
}

function validateBackgroundPresetDefinition(value, label, issues) {
  const preset = asObject(value);
  if (!preset) {
    issues.push(createIssue('error', `${label} must be an object.`));
    return;
  }

  const allowedKeys = new Set([
    'name',
    'description',
    'tags',
    'shader',
    'preset',
    'params',
    'colorStops',
    'intensity',
    'grain',
    'contrast',
    'speed',
    'opacity',
    'filter'
  ]);

  for (const key of Object.keys(preset)) {
    if (!allowedKeys.has(key)) {
      issues.push(createIssue('error', `${label}.${key} is not supported for background presets.`));
    }
  }

  if (typeof preset.name !== 'string' || !preset.name.trim()) {
    issues.push(createIssue('error', `${label}.name must be a non-empty string.`));
  }

  if (preset.description != null && typeof preset.description !== 'string') {
    issues.push(createIssue('error', `${label}.description must be a string.`));
  }

  if (preset.tags != null) {
    if (!Array.isArray(preset.tags) || !preset.tags.every((tag) => typeof tag === 'string' && tag.trim())) {
      issues.push(createIssue('error', `${label}.tags must be an array of non-empty strings.`));
    }
  }

  const shaderName = normalizePaperShaderName(preset.shader);
  if (!shaderName) {
    issues.push(createIssue('error', `${label}.shader must reference a supported Paper shader.`));
    return;
  }

  validateBackgroundFilterConfig(preset.filter, `${label}.filter`, issues);

  validatePaperShaderConfig(
    {
      ...preset,
      type: 'paper-shader'
    },
    label,
    issues,
    shaderName
  );
}

function validateBackgroundConfig(background, label, config, issues, backgroundPresetMap = new Map()) {
  if (background == null) {
    return;
  }

  if (typeof background === 'string') {
    const normalized = normalizePaperShaderName(background);
    if (normalizeKey(background) === 'none' || looksLikeCssBackground(background) || (normalized && PAPER_SHADER_NAMES.has(normalized))) {
      return;
    }

    issues.push(createIssue('error', `${label} must be "none", a CSS background string, or a supported Paper shader name.`));
    return;
  }

  const value = asObject(background);
  if (!value) {
    issues.push(createIssue('error', `${label} must be a string or object.`));
    return;
  }

  const { presetRef, preset, effectiveValue } = resolvePresetBackedBackground(value, backgroundPresetMap);
  const normalizedType = normalizeKey(effectiveValue.type ?? '');
  const explicitCss = normalizedType === 'css';
  const explicitNone = normalizedType === 'none';
  const shaderName =
    normalizePaperShaderName(effectiveValue.shader) ??
    (normalizedType === 'paper-shader' ? 'paper-texture' : null) ??
    (normalizedType && !['css', 'none', 'paper', 'paper-shader'].includes(normalizedType) ? normalizePaperShaderName(value.type) : null);

  if (value.presetRef != null && !presetRef) {
    issues.push(createIssue('error', `${label}.presetRef must be a non-empty string.`));
  }

  if (presetRef && !preset) {
    issues.push(createIssue('error', `${label}.presetRef references unknown background preset "${presetRef}".`));
  }

  if (presetRef && (value.value != null || value.gradient != null)) {
    issues.push(createIssue('error', `${label}.presetRef cannot be combined with CSS-only fields like value or gradient.`));
  }

  if (presetRef && (explicitCss || explicitNone)) {
    issues.push(createIssue('error', `${label}.presetRef implies a Paper shader background and cannot be combined with type "${value.type}".`));
  }

  if (!explicitCss && !explicitNone && value.type != null && shaderName == null && normalizedType !== 'paper') {
    issues.push(createIssue('error', `${label}.type must be "css", "paper-shader", "none", legacy "paper", or a supported Paper shader alias.`));
  }

  if (
    !explicitCss &&
    !explicitNone &&
    normalizedType !== 'paper' &&
    shaderName == null &&
    effectiveValue.value == null &&
    effectiveValue.gradient == null &&
    effectiveValue.colorStops == null
  ) {
    issues.push(
      createIssue(
        'error',
        `${label} must declare a CSS background, "none", or a supported Paper shader.`
      )
    );
  }

  if (!explicitNone && (explicitCss || normalizedType === 'paper' || (!shaderName && (effectiveValue.value != null || effectiveValue.gradient != null || effectiveValue.colorStops != null)))) {
    if (effectiveValue.filter != null) {
      issues.push(
        createIssue(
          'error',
          `${label}.filter is only supported on Paper shader backgrounds or presetRef-backed Paper shader backgrounds.`
        )
      );
    }

    if (effectiveValue.value != null && typeof effectiveValue.value !== 'string') {
      issues.push(createIssue('error', `${label}.value must be a string.`));
    }

    if (effectiveValue.colorStops != null) {
      if (!Array.isArray(effectiveValue.colorStops) || effectiveValue.colorStops.length < 3 || !effectiveValue.colorStops.every((entry) => typeof entry === 'string')) {
        issues.push(createIssue('error', `${label}.colorStops must contain at least three color strings for CSS backgrounds.`));
      }
    }

    validateCssGradient(effectiveValue.gradient, `${label}.gradient`, issues);
  } else if (!explicitNone) {
    validateBackgroundFilterConfig(effectiveValue.filter, `${label}.filter`, issues);
    validatePaperShaderConfig(effectiveValue, label, issues, shaderName);
  } else if (effectiveValue.filter != null) {
    issues.push(
      createIssue(
        'error',
        `${label}.filter is only supported on Paper shader backgrounds or presetRef-backed Paper shader backgrounds.`
      )
    );
  }

  if (Array.isArray(effectiveValue.stages)) {
    if (config.mode !== 'stage') {
      issues.push(createIssue('warning', `${label}.stages is only used in stage presentations.`));
    }

    for (const [index, stage] of effectiveValue.stages.entries()) {
      const stepCount = config.steps?.length ?? 0;
      const steps = Array.isArray(stage?.steps) ? stage.steps : null;
      if (!steps || steps.length !== 2 || !Number.isInteger(steps[0]) || !Number.isInteger(steps[1]) || steps[0] < 0 || steps[1] < steps[0] || steps[1] >= stepCount) {
        issues.push(createIssue('error', `${label}.stages[${index}].steps must stay within 0..${Math.max(stepCount - 1, 0)}.`));
      }

      validateBackgroundConfig(stage, `${label}.stages[${index}]`, config, issues, backgroundPresetMap);
    }
  }

  if (Array.isArray(effectiveValue.regions)) {
    if (config.mode !== 'map') {
      issues.push(createIssue('warning', `${label}.regions is only used in map presentations.`));
    }

    const clusterIds = new Set((config.clusters ?? []).map((cluster) => cluster.id));
    const clusterGroups = new Set((config.clusters ?? []).map((cluster) => cluster.group).filter(Boolean));
    for (const [index, region] of effectiveValue.regions.entries()) {
      for (const clusterId of region?.clusters ?? []) {
        if (!clusterIds.has(clusterId)) {
          issues.push(createIssue('error', `${label}.regions[${index}].clusters references unknown cluster "${clusterId}".`));
        }
      }

      if (region?.group && !clusterGroups.has(region.group)) {
        issues.push(createIssue('warning', `${label}.regions[${index}].group references unknown group "${region.group}".`));
      }

      validateBackgroundConfig(region, `${label}.regions[${index}]`, config, issues, backgroundPresetMap);
    }
  }

  if (effectiveValue.transition) {
    const duration = effectiveValue.transition.duration;
    if (duration != null && (!Number.isFinite(duration) || duration < 0)) {
      issues.push(createIssue('error', `${label}.transition.duration must be a non-negative number.`));
    }
  }
}

function pushParityIssues(kind, manifestNames, runtimeNames, issues) {
  const manifestSet = new Set(manifestNames);
  const runtimeSet = new Set(runtimeNames);

  for (const name of manifestSet) {
    if (!runtimeSet.has(name)) {
      issues.push(createIssue('error', `Runtime ${kind} map is missing "${name}" from the manifest surface.`));
    }
  }

  for (const name of runtimeSet) {
    if (!manifestSet.has(name)) {
      issues.push(createIssue('error', `Runtime ${kind} map exposes "${name}" without a matching manifest folder.`));
    }
  }
}

function getUnitCount(config) {
  return config.mode === 'map' ? config.clusters?.length ?? 0 : config.steps?.length ?? 0;
}

function getUnitLabel(kind, index, title) {
  const ordinal = index + 1;
  return `${kind} ${ordinal}${title ? ` (${title})` : ''}`;
}

function getSequentialLength(component) {
  const props = component.props ?? {};

  for (const key of BUILD_SEQUENCE_KEYS) {
    if (Array.isArray(props[key])) {
      return Math.max(1, props[key].length);
    }
  }

  return 1;
}

function getBuildAnchor(component) {
  if (typeof component.build === 'number') {
    return component.build;
  }

  if (component.build && typeof component.build === 'object' && 'with' in component.build) {
    return component.build.with;
  }

  return null;
}

function createBuildPlan(step) {
  let cursor = 1;

  return (step.components ?? []).map((component) => {
    const anchored = getBuildAnchor(component);

    if (anchored != null) {
      const sequentialLength = component.build === 'sequential' ? getSequentialLength(component) : 1;
      cursor = Math.max(cursor, anchored + sequentialLength);
      return {
        component,
        start: anchored,
        end: anchored + sequentialLength - 1
      };
    }

    if (component.build === 'sequential') {
      const length = getSequentialLength(component);
      const plan = {
        component,
        start: cursor,
        end: cursor + length - 1
      };
      cursor += length;
      return plan;
    }

    return {
      component,
      start: 0,
      end: 0
    };
  });
}

function validateBuildPlan(step, issues, index) {
  const plan = createBuildPlan(step);
  const occupied = new Set();
  let maxBuild = 0;

  for (const entry of plan) {
    maxBuild = Math.max(maxBuild, entry.end);
    for (let buildIndex = entry.start; buildIndex <= entry.end; buildIndex += 1) {
      occupied.add(buildIndex);
    }
  }

  for (let buildIndex = 0; buildIndex <= maxBuild; buildIndex += 1) {
    if (!occupied.has(buildIndex)) {
      issues.push(
        createIssue(
          'error',
          `${getUnitLabel('Step', index, step.title)} has an empty build slot at index ${buildIndex}. Re-anchor or resequence components so build steps stay contiguous.`
        )
      );
    }
  }
}

function parseDensityLimit(layoutManifest) {
  const recommendation = String(layoutManifest?.density?.recommendation ?? '').trim();
  const slots = Array.isArray(layoutManifest?.slots) ? layoutManifest.slots.length : 0;

  const rangeMatch = recommendation.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return Number(rangeMatch[2]);
  }

  const upToMatch = recommendation.match(/up to\s+(\d+)/i);
  if (upToMatch) {
    return Number(upToMatch[1]);
  }

  if (/one primary component per/i.test(recommendation) && slots > 0) {
    return slots;
  }

  return null;
}

function getMarkdownParagraphCount(content) {
  if (!content) {
    return 0;
  }

  return String(content)
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean).length;
}

function getLineCount(content) {
  if (!content) {
    return 0;
  }

  return String(content)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0).length;
}

function getWordCount(content) {
  if (!content) {
    return 0;
  }

  return String(content)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function validateDensity(unit, layoutManifest, issues, kind, index) {
  const layoutLimit = parseDensityLimit(layoutManifest);
  const unitLabel = getUnitLabel(kind, index, unit.title);

  if (layoutLimit != null && (unit.components?.length ?? 0) > layoutLimit) {
    issues.push(
      createIssue(
        'warning',
        `${unitLabel} uses ${(unit.components ?? []).length} components in layout "${unit.layout}", which exceeds the manifest guidance of ${layoutLimit}. Consider splitting the content.`
      )
    );
  }

  for (const component of unit.components ?? []) {
    const items = component.props?.items;

    if ((component.type === 'bullet-list' || component.type === 'numbered-list') && Array.isArray(items) && items.length > 6) {
      issues.push(
        createIssue('warning', `${unitLabel} includes a ${component.type} with ${items.length} items. Split dense lists across builds or additional steps.`)
      );
    }

    if (component.type === 'body-text' && getMarkdownParagraphCount(component.content) > 2) {
      issues.push(createIssue('warning', `${unitLabel} includes a body-text block longer than two paragraphs.`));
    }

    if (component.type === 'blockquote' && getLineCount(component.content) > 3) {
      issues.push(createIssue('warning', `${unitLabel} includes a blockquote longer than the recommended three lines.`));
    }

    if (component.type === 'code-block' && getLineCount(component.content) > 15) {
      issues.push(createIssue('warning', `${unitLabel} includes a code-block longer than the recommended 15 visible lines.`));
    }

    if (component.type === 'stat-card') {
      const value = typeof component.props?.value === 'string' ? component.props.value.trim() : '';
      if (value && (value.length > 20 || getWordCount(value) > 3)) {
        issues.push(
          createIssue(
            'warning',
            `${unitLabel} uses a stat-card value that reads like long prose. Keep stat-card values short and metric-like; move descriptive phrases into detail text or a different card type.`
          )
        );
      }
    }

    if (unit.layout === 'pyramid-layout') {
      const listItems = Array.isArray(component.props?.items) ? component.props.items.length : 0;
      if (listItems > 0 || getLineCount(component.content) > 1) {
        issues.push(
          createIssue(
            'warning',
            `${unitLabel} uses content that is too dense for pyramid-layout. Keep each pyramid row to a compact label plus one short sentence.`
          )
        );
      }
    }
  }
}

async function pushMissingAssetIssues(config, presentationPath, issues) {
  const presentationDir = path.dirname(presentationPath);

  for (const assetRef of collectAssetReferences(config)) {
    const assetPath = path.join(presentationDir, assetRef);
    try {
      await fs.access(assetPath);
    } catch {
      issues.push(createIssue('error', `Referenced asset "${assetRef}" does not exist relative to ${path.basename(presentationDir)}.`));
    }
  }
}

function validateBackgroundSections(config, issues, backgroundPresetMap) {
  validateBackgroundConfig(config.background, 'background', config, issues, backgroundPresetMap);

  for (const [index, section] of (config.backgroundSections ?? []).entries()) {
    const label = `backgroundSections[${index}]`;

    if (section.match?.stepRange) {
      if (config.mode !== 'stage') {
        issues.push(createIssue('warning', `${label} uses stepRange on a ${config.mode} presentation.`));
      } else {
        const [start, end] = section.match.stepRange;
        const stepCount = config.steps?.length ?? 0;
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > stepCount) {
          issues.push(createIssue('error', `${label}.match.stepRange must stay within 1..${stepCount}.`));
        }
      }
    }

    if (Array.isArray(section.match?.clusterIds)) {
      if (config.mode !== 'map') {
        issues.push(createIssue('warning', `${label} uses clusterIds on a ${config.mode} presentation.`));
      } else {
        const clusterIds = new Set((config.clusters ?? []).map((cluster) => cluster.id));
        for (const clusterId of section.match.clusterIds) {
          if (!clusterIds.has(clusterId)) {
            issues.push(createIssue('error', `${label}.match.clusterIds references unknown cluster "${clusterId}".`));
          }
        }
      }
    }

    if (section.match?.group && config.mode === 'map') {
      const groups = new Set((config.clusters ?? []).map((cluster) => cluster.group).filter(Boolean));
      if (!groups.has(section.match.group)) {
        issues.push(createIssue('warning', `${label}.match.group references unknown group "${section.match.group}".`));
      }
    }

    validateBackgroundConfig(section.shader, `${label}.shader`, config, issues, backgroundPresetMap);
  }
}

function validateStage(config, layoutMap, componentSet, transitionSet, issues, backgroundPresetMap) {
  const seenIds = new Set();

  for (const [index, step] of (config.steps ?? []).entries()) {
    if (step.id) {
      if (seenIds.has(step.id)) {
        issues.push(createIssue('error', `Duplicate step id "${step.id}".`));
      }
      seenIds.add(step.id);
    }

    if (!layoutMap.has(step.layout)) {
      issues.push(createIssue('error', `Unknown layout "${step.layout}" in ${getUnitLabel('Step', index, step.title)}.`));
    }

    if (step.transition && !transitionSet.has(step.transition)) {
      issues.push(createIssue('error', `Unknown transition "${step.transition}" in ${getUnitLabel('Step', index, step.title)}.`));
    }

    validateBackgroundConfig(step.background, `${getUnitLabel('Step', index, step.title)}.background`, config, issues, backgroundPresetMap);

    for (const component of step.components ?? []) {
      if (!componentSet.has(component.type)) {
        issues.push(createIssue('error', `Unknown component "${component.type}" in ${getUnitLabel('Step', index, step.title)}.`));
      }

      if (component.enter && !transitionSet.has(component.enter)) {
        issues.push(createIssue('error', `Unknown component enter transition "${component.enter}" in ${getUnitLabel('Step', index, step.title)}.`));
      }

      if (component.exit && !transitionSet.has(component.exit)) {
        issues.push(createIssue('error', `Unknown component exit transition "${component.exit}" in ${getUnitLabel('Step', index, step.title)}.`));
      }

      if (component.annotations && Object.keys(component.annotations).length > 0 && !MARKDOWN_ANNOTATION_COMPONENTS.has(component.type)) {
        issues.push(
          createIssue(
            'warning',
            `${getUnitLabel('Step', index, step.title)} uses annotations on "${component.type}". Markdown-backed hover annotations are supported on markdown-rendered components, but other surfaces still need manual verification.`
          )
        );
      }
    }

    validateBuildPlan(step, issues, index);
    validateDensity(step, layoutMap.get(step.layout), issues, 'Step', index);
  }
}

function validateClusterFrame(cluster, issues) {
  const frame = asObject(cluster.frame);
  if (!frame) {
    return;
  }

  for (const key of ['width', 'height']) {
    if (frame[key] != null && (!Number.isFinite(frame[key]) || frame[key] <= 0)) {
      issues.push(createIssue('error', `Cluster "${cluster.id}".frame.${key} must be greater than 0.`));
    }
  }
}

function validateClusterAnchor(cluster, issues) {
  const anchor = asObject(cluster.anchor);
  if (!anchor) {
    return;
  }

  const hasX = anchor.x != null;
  const hasY = anchor.y != null;
  const hasAbsolute = hasX || hasY;
  const hasRelativeTo = anchor.relativeTo != null;
  const hasDirection = anchor.direction != null;
  const hasDistance = anchor.distance != null;

  if (hasX !== hasY) {
    issues.push(createIssue('error', `Cluster "${cluster.id}" absolute anchors must provide both x and y.`));
  }

  if (hasAbsolute && (hasRelativeTo || hasDirection || hasDistance)) {
    issues.push(
      createIssue(
        'error',
        `Cluster "${cluster.id}" cannot mix absolute anchor coordinates with relative anchor fields.`
      )
    );
  }

  if (!hasAbsolute && !hasRelativeTo && (hasDirection || hasDistance)) {
    issues.push(
      createIssue(
        'error',
        `Cluster "${cluster.id}" relative anchors require relativeTo when direction or distance is provided.`
      )
    );
  }

  if (typeof anchor.relativeTo === 'string' && !anchor.relativeTo.trim()) {
    issues.push(createIssue('error', `Cluster "${cluster.id}" anchor.relativeTo must not be empty.`));
  }
}

function pushClusterLayoutSizingWarnings(cluster, issues) {
  const layoutProps = asObject(cluster.layoutProps);
  if (!layoutProps) {
    return;
  }

  for (const key of ['width', 'height', 'minHeight']) {
    if (layoutProps[key] != null) {
      issues.push(
        createIssue(
          'warning',
          `Cluster "${cluster.id}" uses deprecated layoutProps.${key} for map sizing. Move outer cluster size to frame.${key === 'minHeight' ? 'height' : key}.`
        )
      );
    }
  }
}

function validateMap(config, layoutMap, componentSet, transitionSet, issues, backgroundPresetMap) {
  const clusters = config.clusters ?? [];
  const clusterIds = new Set();
  const clusterMap = new Map();

  for (const [index, cluster] of clusters.entries()) {
    if (clusterIds.has(cluster.id)) {
      issues.push(createIssue('error', `Duplicate cluster id "${cluster.id}".`));
    }
    clusterIds.add(cluster.id);
    clusterMap.set(cluster.id, cluster);

    if (!layoutMap.has(cluster.layout)) {
      issues.push(createIssue('error', `Unknown layout "${cluster.layout}" in ${getUnitLabel('Cluster', index, cluster.title ?? cluster.id)}.`));
    }

    if (cluster.transition && !transitionSet.has(cluster.transition)) {
      issues.push(createIssue('error', `Unknown transition "${cluster.transition}" in cluster "${cluster.id}".`));
    }

    validateClusterFrame(cluster, issues);
    validateClusterAnchor(cluster, issues);
    pushClusterLayoutSizingWarnings(cluster, issues);

    if (cluster.arrangement) {
      issues.push(
        createIssue(
          'warning',
          config.canvas?.arrangement
            ? `Cluster "${cluster.id}" uses deprecated cluster.arrangement. canvas.arrangement takes precedence.`
            : `Cluster "${cluster.id}" uses deprecated cluster.arrangement. Move it to canvas.arrangement.`
        )
      );
    }

    validateBackgroundConfig(cluster.background, `Cluster "${cluster.id}".background`, config, issues, backgroundPresetMap);

    for (const component of cluster.components ?? []) {
      if (!componentSet.has(component.type)) {
        issues.push(createIssue('error', `Unknown component "${component.type}" in cluster "${cluster.id}".`));
      }

      if (component.enter && !transitionSet.has(component.enter)) {
        issues.push(createIssue('error', `Unknown component enter transition "${component.enter}" in cluster "${cluster.id}".`));
      }

      if (component.exit && !transitionSet.has(component.exit)) {
        issues.push(createIssue('error', `Unknown component exit transition "${component.exit}" in cluster "${cluster.id}".`));
      }

      if (component.annotations && Object.keys(component.annotations).length > 0 && !MARKDOWN_ANNOTATION_COMPONENTS.has(component.type)) {
        issues.push(
          createIssue('warning', `Cluster "${cluster.id}" uses annotations on "${component.type}". Markdown-backed hover annotations are supported on markdown-rendered components, but other surfaces still need manual verification.`)
        );
      }
    }

    validateDensity(cluster, layoutMap.get(cluster.layout), issues, 'Cluster', index);
  }

  const sequence = config.navigation?.sequence ?? [];
  const seenSequence = new Set();
  for (const clusterId of sequence) {
    if (!clusterIds.has(clusterId)) {
      issues.push(createIssue('error', `navigation.sequence references unknown cluster "${clusterId}".`));
    }

    if (seenSequence.has(clusterId)) {
      issues.push(createIssue('warning', `navigation.sequence references cluster "${clusterId}" more than once.`));
    }
    seenSequence.add(clusterId);
  }

  const visitState = new Map();
  const visit = (clusterId) => {
    const state = visitState.get(clusterId);
    if (state === 'visiting') {
      issues.push(createIssue('error', `Cluster anchors form a cycle involving "${clusterId}".`));
      return;
    }

    if (state === 'done') {
      return;
    }

    visitState.set(clusterId, 'visiting');
    const cluster = clusterMap.get(clusterId);
    const relativeTo = cluster?.anchor?.relativeTo;
    if (relativeTo) {
      if (!clusterMap.has(relativeTo)) {
        issues.push(createIssue('error', `Cluster "${clusterId}" references unknown anchor target "${relativeTo}".`));
      } else if (relativeTo === clusterId) {
        issues.push(createIssue('error', `Cluster "${clusterId}" cannot anchor relative to itself.`));
      } else {
        visit(relativeTo);
      }
    }
    visitState.set(clusterId, 'done');
  };

  for (const cluster of clusters) {
    visit(cluster.id);
  }

  if (config.canvas?.minZoom != null && config.canvas?.maxZoom != null && config.canvas.minZoom > config.canvas.maxZoom) {
    issues.push(createIssue('error', 'canvas.minZoom cannot be greater than canvas.maxZoom.'));
  }
}

function reportIssues(targetPath, config, issues) {
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  if (issues.length) {
    const heading = errors.length ? 'Validation failed' : 'Validation completed with warnings';
    const reporter = errors.length ? console.error : console.warn;
    reporter(`${heading} for ${targetPath}:`);
    for (const issue of issues) {
      const log = issue.severity === 'error' ? console.error : console.warn;
      log(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
    }
  }

  if (!errors.length) {
    console.log(`OK ${targetPath} (${config.mode}, ${getUnitCount(config)} units, ${warnings.length} warnings)`);
  }
}

export async function validatePresentation(targetPath, options = {}) {
  const { throwOnError = true, report = true } = options;
  const config = await parseYaml(targetPath);
  const presentationDir = path.dirname(targetPath);
  const [schema, componentMap, layoutMap, transitionMap, localComponentMap, localLayoutMap, localTransitionMap, themeSet, runtimeRegistry, backgroundPresetMap] = await Promise.all([
    JSON.parse(await fs.readFile(path.join(XTORYTELLER_SCHEMA_DIR, 'schema.json'), 'utf8')),
    scanManifestEntries('components'),
    scanManifestEntries('layouts'),
    scanManifestEntries('transitions'),
    scanManifestEntriesAt(path.join(presentationDir, 'components')),
    scanManifestEntriesAt(path.join(presentationDir, 'layouts')),
    scanManifestEntriesAt(path.join(presentationDir, 'transitions')),
    themeNames(),
    runtimeRegistryKeys(),
    loadBackgroundPresetMap()
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const validAgainstSchema = validate(config);
  const issues = [];

  if (!validAgainstSchema && validate.errors) {
    for (const error of validate.errors) {
      issues.push(createIssue('error', `${error.instancePath || '/'} ${error.message}`));
    }
  }

  if (config.theme != null && !themeSet.has(config.theme)) {
    issues.push(createIssue('error', `Unknown theme "${config.theme}".`));
  }

  pushParityIssues('component', [...componentMap.keys()], runtimeRegistry.components, issues);
  pushParityIssues('layout', [...layoutMap.keys()], runtimeRegistry.layouts, issues);
  pushParityIssues('transition', [...transitionMap.keys()], runtimeRegistry.transitions, issues);

  const mergedComponentMap = mergeManifestMaps(componentMap, localComponentMap);
  const mergedLayoutMap = mergeManifestMaps(layoutMap, localLayoutMap);
  const mergedTransitionMap = mergeManifestMaps(transitionMap, localTransitionMap);
  const presentationFolder = path.basename(presentationDir);
  if (presentationFolder !== config.meta.slug) {
    issues.push(
      createIssue(
        'warning',
        `Presentation folder "${presentationFolder}" does not match meta.slug "${config.meta.slug}". Keeping them aligned avoids routing confusion.`
      )
    );
  }

  validateBackgroundSections(config, issues, backgroundPresetMap);

  if (config.mode === 'stage') {
    validateStage(config, mergedLayoutMap, new Set(mergedComponentMap.keys()), new Set(mergedTransitionMap.keys()), issues, backgroundPresetMap);
  }

  if (config.mode === 'map') {
    validateMap(config, mergedLayoutMap, new Set(mergedComponentMap.keys()), new Set(mergedTransitionMap.keys()), issues, backgroundPresetMap);
  }

  await pushMissingAssetIssues(config, targetPath, issues);

  const result = {
    config,
    issues,
    valid: !issues.some((issue) => issue.severity === 'error'),
    summary: {
      mode: config.mode,
      units: getUnitCount(config),
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
      errors: issues.filter((issue) => issue.severity === 'error').length
    }
  };

  if (report) {
    reportIssues(targetPath, config, issues);
  }

  if (!result.valid && throwOnError) {
    throw new Error(`Validation failed for ${targetPath}`);
  }

  return result;
}

export async function validateBackgroundPreset(filePath, options = {}) {
  const { throwOnError = true, report = true } = options;
  const preset = await parseYaml(filePath);
  const issues = [];

  validateBackgroundPresetDefinition(preset, 'background preset', issues);

  if (report && issues.length) {
    console.error(`Validation failed for ${filePath}:`);
    for (const issue of issues) {
      console.error(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
    }
  }

  if (report && !issues.length) {
    console.log(`OK ${filePath} (background preset, 0 warnings)`);
  }

  const result = {
    preset,
    issues,
    valid: !issues.some((issue) => issue.severity === 'error')
  };

  if (!result.valid && throwOnError) {
    throw new Error(`Validation failed for ${filePath}`);
  }

  return result;
}

const target = process.argv[2];
if (target) {
  validatePresentation(path.resolve(target)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
