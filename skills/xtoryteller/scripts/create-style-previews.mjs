import path from 'node:path';

import {
  ensureDir,
  exists,
  parseArgs,
  removeDir,
  resolveWorkspaceRoot,
  todayIsoDate,
  toTitleCase,
  writeYaml
} from './_utils.mjs';

const PRESET_GROUPS = {
  confident: [
    { key: 'a', theme: 'bold-signal', name: 'Bold Signal', recipe: 'signal' },
    { key: 'b', theme: 'electric-studio', name: 'Electric Studio', recipe: 'studio' },
    { key: 'c', theme: 'dark-botanical', name: 'Dark Botanical', recipe: 'botanical' }
  ],
  energetic: [
    { key: 'a', theme: 'creative-voltage', name: 'Creative Voltage', recipe: 'voltage' },
    { key: 'b', theme: 'neon-cyber', name: 'Neon Cyber', recipe: 'cyber' },
    { key: 'c', theme: 'split-pastel', name: 'Split Pastel', recipe: 'split' }
  ],
  calm: [
    { key: 'a', theme: 'notebook-tabs', name: 'Notebook Tabs', recipe: 'notebook' },
    { key: 'b', theme: 'paper-and-ink', name: 'Paper And Ink', recipe: 'paper' },
    { key: 'c', theme: 'swiss-modern', name: 'Swiss Modern', recipe: 'swiss' }
  ],
  inspired: [
    { key: 'a', theme: 'dark-botanical', name: 'Dark Botanical', recipe: 'botanical' },
    { key: 'b', theme: 'vintage-editorial', name: 'Vintage Editorial', recipe: 'editorial' },
    { key: 'c', theme: 'pastel-geometry', name: 'Pastel Geometry', recipe: 'geometry' }
  ]
};

const CHAPTER_ITEMS = ['opening', 'story', 'proof', 'close'];

const { options } = parseArgs(process.argv.slice(2));
const mood = String(options.mood ?? 'calm').toLowerCase();
const variants = PRESET_GROUPS[mood] ?? PRESET_GROUPS.calm;
const prefix = String(options.prefix ?? 'preview');
const topic = String(options.topic ?? 'Your Story');
const title = String(options.title ?? `${toTitleCase(topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase())} Style Study`);
const root = resolveWorkspaceRoot(import.meta.url);
const today = todayIsoDate();

function toSlugSegment(value, fallback) {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

const safePrefix = toSlugSegment(prefix, 'preview');

function railItems(style) {
  switch (style) {
    case 'notebook':
      return [
        { label: 'intro', height: 'short', active: true },
        { label: 'story', height: 'medium' },
        { label: 'proof', height: 'tall' },
        { label: 'close', height: 'medium' }
      ];
    case 'geometry':
      return [
        { label: '', height: 'short', tone: 'accent' },
        { label: '', height: 'medium', tone: 'success' },
        { label: '', height: 'tall', tone: 'primary', active: true },
        { label: '', height: 'medium', tone: 'secondary' },
        { label: '', height: 'short', color: 'var(--color-decor-rail-5)' }
      ];
    case 'split':
      return [
        { label: 'mood', height: 'short', color: 'var(--color-decor-rail-1)' },
        { label: 'voice', height: 'medium', color: 'var(--color-decor-rail-3)', active: true },
        { label: 'pace', height: 'short', color: 'var(--color-decor-rail-5)' }
      ];
    default:
      return [
        { label: '01', height: 'short', active: true },
        { label: '02', height: 'medium' },
        { label: '03', height: 'tall' }
      ];
  }
}

function backgroundFor(recipe) {
  switch (recipe) {
    case 'signal':
      return { type: 'css', gradient: { type: 'linear', angle: 135, stops: ['#1a1a1a', '#2d2d2d', '#161616'] } };
    case 'studio':
      return { type: 'css', value: 'linear-gradient(180deg, #ffffff 0%, #ffffff 49%, #4361ee 49%, #4361ee 100%)' };
    case 'voltage':
      return { type: 'paper-shader', shader: 'mesh-gradient', preset: 'purple', colorStops: ['#1a1a2e', '#0066ff', '#d4ff00'] };
    case 'cyber':
      return { type: 'paper-shader', shader: 'grain-gradient', preset: 'wave', colorStops: ['#0a0f1c', '#00ffcc', '#ff00aa'] };
    case 'split':
      return { type: 'css', value: 'linear-gradient(90deg, #f5e6dc 0%, #f5e6dc 50%, #e4dff0 50%, #e4dff0 100%)' };
    case 'notebook':
      return { type: 'paper-shader', shader: 'paper-texture', preset: 'details', colorStops: ['#f8f6f1', '#efe9dd', '#fffaf2'] };
    case 'paper':
      return { type: 'paper-shader', shader: 'paper-texture', preset: 'cardboard', colorStops: ['#faf9f7', '#efe3d3', '#fffdf8'] };
    case 'swiss':
      return { type: 'css', gradient: { type: 'linear', angle: 180, stops: ['#ffffff', '#f5f5f5'] } };
    case 'editorial':
      return { type: 'paper-shader', shader: 'static-radial-gradient', preset: 'cross-section', colorStops: ['#f5f3ee', '#e8d4c0', '#fbf8f1'] };
    case 'geometry':
      return { type: 'css', gradient: { type: 'radial', position: '20% 20%', stops: ['#faf9f7', '#c8d9e6', '#f3f1ec'] } };
    case 'botanical':
      return { type: 'paper-shader', shader: 'static-radial-gradient', preset: 'lo-fi', colorStops: ['#0f0f0f', '#d4a574', '#e8b4b8'] };
    default:
      return { type: 'paper-shader', shader: 'paper-texture', preset: 'default' };
  }
}

function heroStep(variant) {
  if (['notebook', 'geometry', 'paper', 'editorial', 'split'].includes(variant.recipe)) {
    return {
      id: 'hero',
      title: 'Hero',
      layout: 'framed-rail',
      layoutProps: { railSide: 'right', contentAlign: variant.recipe === 'paper' ? 'left' : 'center' },
      transition: 'fade',
      components: [
        { type: 'label', slot: 'main', content: mood, props: { tone: 'primary' } },
        { type: 'headline', slot: 'main', content: topic, props: { align: variant.recipe === 'paper' ? 'left' : 'center' } },
        {
          type: variant.recipe === 'paper' ? 'body-text' : 'subtitle',
          slot: 'main',
          content:
            variant.recipe === 'paper'
              ? `${variant.name} uses a quieter editorial rhythm so the audience can settle into the story before the proof points arrive.`
              : `${variant.name} turns the ${mood} direction into a live runtime composition instead of a palette swap.`,
          props: variant.recipe === 'paper' ? { dropCap: true, dropCapLines: 3 } : { align: 'center' }
        },
        {
          type: 'edge-rail',
          slot: 'rail',
          props: {
            items: railItems(variant.recipe),
            variant: variant.recipe === 'geometry' ? 'pills' : 'tabs',
            side: 'right',
            orientation: 'vertical'
          }
        },
        {
          type: 'chapter-nav',
          slot: 'accent',
          props: { items: CHAPTER_ITEMS, active: 0, orientation: 'horizontal' }
        }
      ]
    };
  }

  return {
    id: 'hero',
    title: 'Hero',
    layout: 'asymmetric-split',
    layoutProps: { ratio: variant.recipe === 'studio' ? '40-60' : '60-40', ornamentAnchor: 'top-right' },
    transition: 'fade',
    components: [
      { type: 'label', slot: 'main', content: mood, props: { tone: 'primary' } },
      { type: 'headline', slot: 'main', content: topic },
      { type: 'subtitle', slot: 'main', content: `${variant.name} explores the ${mood} direction with a real preset theme and composition recipe.` },
      { type: 'chapter-nav', slot: 'support', props: { items: CHAPTER_ITEMS, active: 0, orientation: 'vertical' } },
      {
        type: 'edge-rail',
        slot: 'ornament',
        props: {
          items: railItems(variant.recipe),
          variant: variant.recipe === 'cyber' ? 'pills' : 'tabs',
          side: 'right',
          orientation: variant.recipe === 'cyber' ? 'horizontal' : 'vertical'
        }
      }
    ]
  };
}

function structureStep(variant) {
  return {
    id: 'structure',
    title: 'Structure',
    layout: variant.recipe === 'studio' || variant.recipe === 'swiss' ? 'two-column' : 'asymmetric-split',
    layoutProps: variant.recipe === 'studio' || variant.recipe === 'swiss' ? { ratio: '60-40' } : { ratio: '70-30' },
    transition: 'slide-left',
    components: [
      {
        type: 'bullet-list',
        slot: 'main',
        props: {
          items: [
            'Typography carries character first.',
            'Layout motifs repeat on purpose.',
            'Background and chrome reinforce the same mood.'
          ]
        }
      },
      {
        type: 'callout',
        slot: 'support',
        content: `This preview is built with the **${variant.theme}** theme plus a preset-specific layout recipe, so it reflects the reusable system rather than a one-off mockup.`,
        props: { title: 'Why it feels different', variant: 'important' }
      },
      ...(variant.recipe === 'editorial' || variant.recipe === 'paper'
        ? [
            {
              type: 'blockquote',
              slot: 'ornament',
              content: 'Let the form teach the mood before the explanation arrives.',
              props: { variant: 'large', attribution: variant.name }
            }
          ]
        : [])
    ]
  };
}

function closeStep(variant) {
  return {
    id: 'close',
    title: 'Close',
    layout: 'stack',
    transition: 'fade',
    components: [
      {
        type: 'blockquote',
        content: `Choose **${variant.name}** if you want the presentation to feel ${mood} through typography, surfaces, and recurring structure instead of vague color tweaks.`,
        props: {
          attribution: 'Xtoryteller style discovery',
          variant: ['editorial', 'paper', 'botanical'].includes(variant.recipe) ? 'large' : 'default'
        }
      },
      {
        type: 'footnote',
        content: `Preview ${variant.key.toUpperCase()} of 3 for ${topic}. Theme: ${variant.theme}.`
      }
    ]
  };
}

function previewPresentation(variant) {
  return {
    meta: {
      title: `${title}: ${variant.name}`,
      slug: `${safePrefix}-${variant.key}`,
      description: `Style preview ${variant.key.toUpperCase()} for ${topic}.`,
      author: 'Xtoryteller skill scaffold',
      tags: ['preview', 'style-study', mood, variant.theme],
      createdAt: today,
      updatedAt: today
    },
    mode: 'stage',
    theme: variant.theme,
    background: backgroundFor(variant.recipe),
    steps: [heroStep(variant), structureStep(variant), closeStep(variant)]
  };
}

for (const variant of variants) {
  const slug = `${safePrefix}-${variant.key}`;
  const targetDir = path.join(root, 'presentations', slug);

  if ((await exists(targetDir)) && !options.force) {
    console.error(`Preview directory already exists: presentations/${slug}. Re-run with --force to overwrite.`);
    process.exit(1);
  }

  if (options.force) {
    await removeDir(targetDir);
  }

  await ensureDir(targetDir);
  await writeYaml(path.join(targetDir, 'presentation.yaml'), previewPresentation(variant));
}

console.log(`Created ${variants.length} preset-driven preview presentations for mood "${mood}" with prefix "${safePrefix}".`);
for (const variant of variants) {
  console.log(`- http://localhost:3000/${safePrefix}-${variant.key} (${variant.theme})`);
}
