import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import YAML from 'yaml';

const root = process.cwd();
const MIN_CONTRAST = 4.5;

function parseHex(hex) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    return normalized.split('').map((part) => parseInt(`${part}${part}`, 16));
  }
  if (normalized.length === 6) {
    return [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
  }
  return null;
}

function parseRgb(input) {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
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
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
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

function validateFontRole(roleName, role, issues) {
  if (!role?.family) {
    issues.push(`${roleName} font is missing a family.`);
  }

  if (role?.source && !['local', 'google', 'fontshare', 'system'].includes(role.source)) {
    issues.push(`${roleName} font has unsupported source \"${role.source}\".`);
  }
}

export async function validateTheme(filePath) {
  const theme = await parseYaml(filePath);
  const issues = [];

  validateFontRole('heading', theme.fonts?.heading, issues);
  validateFontRole('body', theme.fonts?.body, issues);
  validateFontRole('mono', theme.fonts?.mono, issues);

  const background = toRgb(theme.colors?.background);
  const surface = toRgb(theme.colors?.surface ?? theme.colors?.background);
  const checks = [
    ['foreground/background', toRgb(theme.colors?.foreground), background],
    ['foreground/surface', toRgb(theme.colors?.foreground), surface],
    ['muted/background', toRgb(theme.colors?.muted), background],
    ['primary/background', toRgb(theme.colors?.primary), background],
    ['secondary/background', toRgb(theme.colors?.secondary), background]
  ];

  for (const [label, left, right] of checks) {
    if (!left || !right) {
      continue;
    }

    const contrast = contrastRatio(left, right);
    if (contrast < MIN_CONTRAST) {
      issues.push(`${label} contrast is ${contrast.toFixed(2)}:1, below ${MIN_CONTRAST}:1.`);
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

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
