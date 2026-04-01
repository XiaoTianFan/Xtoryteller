import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import YAML from 'yaml';

const root = process.cwd();
const MIN_CONTRAST = 4.5;
const FONT_SOURCES = ['local', 'google', 'fontshare', 'system'];
const FONT_DISPLAYS = ['auto', 'block', 'swap', 'fallback', 'optional'];
const FONT_STYLES = ['normal', 'italic'];

function parseHex(hex) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    return normalized.split('').map((part) => parseInt(`${part}${part}`, 16));
  }
  if (normalized.length === 6) {
    return [0, 2, 4].map((offset) =>
      parseInt(normalized.slice(offset, offset + 2), 16)
    );
  }
  return null;
}

function parseRgb(input) {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = match[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()));
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }

  return [r, g, b];
}

function toRgb(input) {
  if (typeof input !== 'string') {
    return null;
  }

  if (input.startsWith('#')) {
    return parseHex(input);
  }

  if (input.startsWith('rgb')) {
    return parseRgb(input);
  }

  return null;
}

function channelToLinear(value) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(left, right) {
  const l1 = luminance(left);
  const l2 = luminance(right);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function parseYaml(filePath) {
  return YAML.parse(await fs.readFile(filePath, 'utf8'));
}

function validateRequiredKeys(sectionName, value, requiredKeys, issues) {
  if (!value || typeof value !== 'object') {
    issues.push(`${sectionName} is missing required values.`);
    return;
  }

  for (const key of requiredKeys) {
    if (!(key in value)) {
      issues.push(`${sectionName} is missing required key "${key}".`);
    }
  }
}

function hasNestedKey(value, pathSegments) {
  let current = value;

  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return false;
    }

    current = current[segment];
  }

  return true;
}

function validateRequiredPaths(sectionName, value, requiredPaths, issues) {
  if (!value || typeof value !== 'object') {
    issues.push(`${sectionName} is missing required values.`);
    return;
  }

  for (const keyPath of requiredPaths) {
    if (!hasNestedKey(value, keyPath.split('.'))) {
      issues.push(`${sectionName} is missing required key "${keyPath}".`);
    }
  }
}

const REQUIRED_COLOR_KEYS = [
  'background',
  'surface',
  'panel',
  'foreground',
  'muted',
  'border',
  'primary',
  'secondary',
  'accent',
  'success',
  'warning',
  'error',
  'overlay',
];

const REQUIRED_TYPOGRAPHY_PATHS = [
  'h1',
  'h2',
  'h3',
  'body',
  'small',
  'lead',
  'code',
  'components.shell.eyebrow',
  'components.shell.hero',
  'components.shell.lead',
  'components.shell.card-title',
  'components.feature.title',
  'components.stat.value',
  'components.comparison.divider',
  'components.diagram.label',
];

const REQUIRED_SPACING_PATHS = [
  'page',
  'section',
  'gap',
  'cluster',
  'chrome.page-padding',
  'chrome.tools-gap',
  'chrome.control-height',
  'chrome.card-padding',
  'chrome.dock-open-height',
  'chrome.overlay-panel-padding',
  'components.card.padding',
  'components.list.padding-start',
  'components.timeline.item-padding',
  'components.annotation.popover-padding-y',
  'components.code.body-padding',
  'components.diagram.caption-gap',
  'layouts.compact.padding',
  'layouts.compact.gap',
  'layouts.timeline.gap',
  'layouts.timeline.track-offset',
  'layouts.pyramid.gap',
];

const REQUIRED_SIZING_PATHS = [
  'components.shell.hero-max-width',
  'components.shell.card-grid-min-width',
  'components.shell.shortcut-panel-width',
  'components.feature.icon',
  'components.profile.avatar',
  'components.timeline.marker',
  'components.annotation.popover-width',
  'components.media.image-max-height',
  'components.media.iframe-min-height',
  'components.spectrum.vertical-min-height',
  'layouts.single-content-max-width',
  'layouts.section-header-accent-max-width',
  'layouts.gallery-item-min-width',
  'layouts.scattered-item-width',
  'layouts.timeline-item-min-width',
  'layouts.comparison-divider-min-width',
  'layouts.comparison-divider-badge-size',
  'layouts.pyramid-top-width',
];

const REQUIRED_RADII_PATHS = [
  'small',
  'medium',
  'large',
  'pill',
  'chrome.control',
  'chrome.card',
  'chrome.overlay',
  'components.card',
  'components.code',
  'components.tooltip',
  'components.avatar',
  'layouts.divider-badge',
];

const REQUIRED_SHADOW_PATHS = [
  'soft',
  'strong',
  'chrome.card',
  'chrome.panel',
  'chrome.overlay',
  'components.code',
  'components.tooltip',
];

const REQUIRED_BORDER_PATHS = [
  'subtle',
  'strong',
  'chrome.control',
  'chrome.card',
  'chrome.panel',
  'chrome.overlay',
  'components.card',
  'components.code',
  'components.tooltip',
];

const REQUIRED_MOTION_PATHS = [
  'fast',
  'normal',
  'slow',
  'easing',
  'scene.duration',
  'scene.easing',
  'reveal.duration',
  'reveal.easing',
  'panel.duration',
  'panel.easing',
  'hover.duration',
  'hover.easing',
  'components.list.offset-y',
  'components.timeline.offset-y',
];

function validateFontMetadata(roleName, role, issues) {
  if (!role?.family) {
    issues.push(`${roleName} font is missing a family.`);
    return false;
  }

  if (role?.source && !FONT_SOURCES.includes(role.source)) {
    issues.push(`${roleName} font has unsupported source "${role.source}".`);
  }

  if (role?.display && !FONT_DISPLAYS.includes(role.display)) {
    issues.push(`${roleName} font has unsupported display "${role.display}".`);
  }

  if (Array.isArray(role?.styles)) {
    for (const style of role.styles) {
      if (!FONT_STYLES.includes(style)) {
        issues.push(`${roleName} font has unsupported style "${style}".`);
      }
    }
  }

  return true;
}

async function validateLocalFontRole(roleName, role, issues) {
  if (!Array.isArray(role.files) || role.files.length === 0) {
    issues.push(
      `${roleName} font at "${role.family}" is local and must declare files.`
    );
    return;
  }

  const fontsRoot = path.join(root, 'public', 'fonts');
  for (const file of role.files) {
    if (!file?.path || typeof file.path !== 'string') {
      issues.push(
        `${roleName} font at "${role.family}" has a file entry without a path.`
      );
      continue;
    }

    if (typeof file.weight !== 'number' || !Number.isFinite(file.weight)) {
      issues.push(
        `${roleName} font at "${role.family}" has a file entry without a numeric weight.`
      );
    }

    if (file.style && !FONT_STYLES.includes(file.style)) {
      issues.push(
        `${roleName} font at "${role.family}" has unsupported file style "${file.style}".`
      );
    }

    const relativePath = file.path
      .replace(/^\//, '')
      .replace(/^fonts[\\/]/, '');
    const resolvedPath = path.resolve(fontsRoot, relativePath);
    if (!resolvedPath.startsWith(fontsRoot)) {
      issues.push(
        `${roleName} font at "${role.family}" references ${file.path}, which is outside public/fonts/.`
      );
      continue;
    }

    try {
      await fs.access(resolvedPath);
    } catch {
      issues.push(
        `${roleName} font at "${role.family}" references missing file ${path.relative(root, resolvedPath)}.`
      );
    }
  }
}

function validateGoogleFontRole(roleName, role, issues) {
  if (!Array.isArray(role.weights) || role.weights.length === 0) {
    issues.push(
      `${roleName} font at "${role.family}" needs explicit weights when source is google.`
    );
  }
}

function validateFontshareRole(roleName, role, issues) {
  if (typeof role.cssUrl !== 'string' || !/^https?:\/\//i.test(role.cssUrl)) {
    issues.push(
      `${roleName} font at "${role.family}" must provide a valid cssUrl when source is fontshare.`
    );
  }
}

async function validateFontRole(roleName, role, issues) {
  if (!validateFontMetadata(roleName, role, issues)) {
    return;
  }

  switch (role?.source) {
    case 'local':
      await validateLocalFontRole(roleName, role, issues);
      break;
    case 'google':
      validateGoogleFontRole(roleName, role, issues);
      break;
    case 'fontshare':
      validateFontshareRole(roleName, role, issues);
      break;
    default:
      break;
  }
}

export async function validateTheme(filePath) {
  const theme = await parseYaml(filePath);
  const issues = [];

  await Promise.all([
    validateFontRole('heading', theme.fonts?.heading, issues),
    validateFontRole('body', theme.fonts?.body, issues),
    validateFontRole('mono', theme.fonts?.mono, issues),
  ]);

  validateRequiredKeys('colors', theme.colors, REQUIRED_COLOR_KEYS, issues);
  validateRequiredPaths(
    'typography',
    theme.typography,
    REQUIRED_TYPOGRAPHY_PATHS,
    issues
  );
  validateRequiredPaths(
    'spacing',
    theme.spacing,
    REQUIRED_SPACING_PATHS,
    issues
  );
  validateRequiredPaths('sizing', theme.sizing, REQUIRED_SIZING_PATHS, issues);
  validateRequiredPaths('radii', theme.radii, REQUIRED_RADII_PATHS, issues);
  validateRequiredPaths(
    'shadows',
    theme.shadows,
    REQUIRED_SHADOW_PATHS,
    issues
  );
  validateRequiredPaths(
    'borders',
    theme.borders,
    REQUIRED_BORDER_PATHS,
    issues
  );
  validateRequiredPaths('motion', theme.motion, REQUIRED_MOTION_PATHS, issues);

  const background = toRgb(theme.colors?.background);
  const surface = toRgb(theme.colors?.surface ?? theme.colors?.background);
  const checks = [
    ['foreground/background', toRgb(theme.colors?.foreground), background],
    ['foreground/surface', toRgb(theme.colors?.foreground), surface],
    ['muted/background', toRgb(theme.colors?.muted), background],
    ['primary/background', toRgb(theme.colors?.primary), background],
    ['secondary/background', toRgb(theme.colors?.secondary), background],
  ];

  for (const [label, left, right] of checks) {
    if (!left || !right) {
      continue;
    }

    const contrast = contrastRatio(left, right);
    if (contrast < MIN_CONTRAST) {
      issues.push(
        `${label} contrast is ${contrast.toFixed(2)}:1, below ${MIN_CONTRAST}:1.`
      );
    }
  }

  if (issues.length) {
    console.error(`Theme validation failed for ${filePath}:`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    throw new Error(`Theme validation failed for ${filePath}`);
  }

  console.log(`OK ${path.relative(root, filePath)}`);
}

async function main() {
  const target = process.argv[2];
  if (target) {
    await validateTheme(path.resolve(target));
    return;
  }

  const themeFiles = await fg('themes/*.yaml', { cwd: root, absolute: true });
  for (const file of themeFiles) {
    await validateTheme(file);
  }
}

const isEntrypoint =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
