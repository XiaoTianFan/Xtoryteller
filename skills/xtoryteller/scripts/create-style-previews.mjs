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

const VARIANTS = {
  confident: [
    {
      key: 'a',
      name: 'Signal Ledger',
      colors: { primary: '#214a8a', secondary: '#1f6a7a', accent: '#d89a4f', background: '#f5f0e6', surface: '#fffaf2' },
      background: ['rgba(245, 240, 230, 0.96)', 'rgba(33, 74, 138, 0.18)', 'rgba(216, 154, 79, 0.16)']
    },
    {
      key: 'b',
      name: 'Boardroom Ember',
      colors: { primary: '#8d4f2d', secondary: '#3f5c4c', accent: '#d1a054', background: '#f7f1e8', surface: '#fff8ef' },
      background: ['rgba(247, 241, 232, 0.96)', 'rgba(141, 79, 45, 0.18)', 'rgba(63, 92, 76, 0.16)']
    },
    {
      key: 'c',
      name: 'Slate Focus',
      colors: { primary: '#385170', secondary: '#2d7a54', accent: '#f0a64b', background: '#f3f4f6', surface: '#ffffff' },
      background: ['rgba(243, 244, 246, 0.97)', 'rgba(56, 81, 112, 0.18)', 'rgba(45, 122, 84, 0.16)']
    }
  ],
  energetic: [
    {
      key: 'a',
      name: 'Voltage Warm',
      colors: { primary: '#c24a2d', secondary: '#1f6a7a', accent: '#f2b33d', background: '#fff4ea', surface: '#fffaf5' },
      background: ['rgba(255, 244, 234, 0.96)', 'rgba(194, 74, 45, 0.22)', 'rgba(31, 106, 122, 0.18)']
    },
    {
      key: 'b',
      name: 'Studio Sprint',
      colors: { primary: '#9a2f5c', secondary: '#334f8d', accent: '#f08c46', background: '#fff2f7', surface: '#fff8fb' },
      background: ['rgba(255, 242, 247, 0.96)', 'rgba(154, 47, 92, 0.22)', 'rgba(51, 79, 141, 0.18)']
    },
    {
      key: 'c',
      name: 'Civic Neon',
      colors: { primary: '#0f766e', secondary: '#1d4ed8', accent: '#f59e0b', background: '#eefcf9', surface: '#f8fffd' },
      background: ['rgba(238, 252, 249, 0.96)', 'rgba(15, 118, 110, 0.2)', 'rgba(29, 78, 216, 0.16)']
    }
  ],
  calm: [
    {
      key: 'a',
      name: 'Paper Current',
      colors: { primary: '#2a6c64', secondary: '#8d4f2d', accent: '#d89a4f', background: '#f6f1e8', surface: '#fff9f0' },
      background: ['rgba(246, 241, 232, 0.96)', 'rgba(42, 108, 100, 0.18)', 'rgba(141, 79, 45, 0.16)']
    },
    {
      key: 'b',
      name: 'Quiet Mineral',
      colors: { primary: '#4b5563', secondary: '#2f6f62', accent: '#c08457', background: '#f5f5f4', surface: '#ffffff' },
      background: ['rgba(245, 245, 244, 0.97)', 'rgba(75, 85, 99, 0.18)', 'rgba(47, 111, 98, 0.14)']
    },
    {
      key: 'c',
      name: 'Blue Editorial',
      colors: { primary: '#315c8f', secondary: '#436b5c', accent: '#d5a24f', background: '#f4f7fb', surface: '#ffffff' },
      background: ['rgba(244, 247, 251, 0.97)', 'rgba(49, 92, 143, 0.16)', 'rgba(67, 107, 92, 0.14)']
    }
  ],
  inspired: [
    {
      key: 'a',
      name: 'Botanical Dawn',
      colors: { primary: '#41644a', secondary: '#8d4f2d', accent: '#d6a04d', background: '#f4f1e8', surface: '#fffaf1' },
      background: ['rgba(244, 241, 232, 0.96)', 'rgba(65, 100, 74, 0.18)', 'rgba(141, 79, 45, 0.16)']
    },
    {
      key: 'b',
      name: 'River Letterpress',
      colors: { primary: '#28536b', secondary: '#7a3f63', accent: '#d89a4f', background: '#f3f6f8', surface: '#ffffff' },
      background: ['rgba(243, 246, 248, 0.97)', 'rgba(40, 83, 107, 0.18)', 'rgba(122, 63, 99, 0.15)']
    },
    {
      key: 'c',
      name: 'Afterglow Study',
      colors: { primary: '#7f5539', secondary: '#2a6c64', accent: '#e09f3e', background: '#fbf5ee', surface: '#fffaf6' },
      background: ['rgba(251, 245, 238, 0.97)', 'rgba(127, 85, 57, 0.18)', 'rgba(42, 108, 100, 0.14)']
    }
  ]
};

const { options } = parseArgs(process.argv.slice(2));
const mood = String(options.mood ?? 'calm').toLowerCase();
const variants = VARIANTS[mood] ?? VARIANTS.calm;
const prefix = String(options.prefix ?? '_preview');
const topic = String(options.topic ?? 'Your Story');
const title = String(options.title ?? `${toTitleCase(topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase())} Style Study`);
const root = resolveWorkspaceRoot(import.meta.url);
const today = todayIsoDate();

function previewPresentation(variant) {
  return {
    meta: {
      title: `${title}: ${variant.name}`,
      slug: `${prefix}-${variant.key}`,
      description: `Style preview ${variant.key.toUpperCase()} for ${topic}.`,
      author: 'Xtoryteller skill scaffold',
      tags: ['preview', 'style-study', mood],
      createdAt: today,
      updatedAt: today
    },
    mode: 'stage',
    theme: 'default',
    themeOverrides: {
      colors: variant.colors
    },
    background: {
      type: 'paper',
      colorStops: variant.background
    },
    steps: [
      {
        id: 'title',
        title: 'Title',
        layout: 'title-center',
        transition: 'fade',
        components: [
          { type: 'label', content: mood, props: { tone: 'primary' } },
          { type: 'headline', content: topic, props: { align: 'center' } },
          { type: 'subtitle', content: `${variant.name} explores the ${mood} direction in the live Xtoryteller runtime.`, props: { align: 'center' } }
        ]
      },
      {
        id: 'structure',
        title: 'Structure',
        layout: 'two-column',
        transition: 'slide-left',
        components: [
          {
            type: 'bullet-list',
            props: {
              items: [
                'Heading rhythm and hierarchy',
                'Surface/background relationship',
                'Card tone and accent use'
              ]
            }
          },
          {
            type: 'callout',
            content: `Use this preview when the user says they want to **see options** instead of choosing a style abstractly.`,
            props: { title: 'Why this exists', variant: 'info' }
          }
        ]
      },
      {
        id: 'cards',
        title: 'Cards',
        layout: 'grid-2x2',
        transition: 'scale',
        components: [
          { type: 'feature-card', props: { eyebrow: 'Tone', title: 'Typography' }, content: 'Check heading character, body texture, and spacing comfort.' },
          { type: 'feature-card', props: { eyebrow: 'Tone', title: 'Color' }, content: 'Notice whether the palette feels grounded, bright, restrained, or dramatic.' },
          { type: 'feature-card', props: { eyebrow: 'Tone', title: 'Motion' }, content: 'Use a restrained transition set so the mood reads clearly without noise.' },
          { type: 'feature-card', props: { eyebrow: 'Tone', title: 'Fit' }, content: 'Decide whether this direction fits the audience and the narrative stakes.' }
        ]
      },
      {
        id: 'close',
        title: 'Close',
        layout: 'stack',
        transition: 'fade',
        components: [
          { type: 'blockquote', content: 'Pick the direction that changes how the story feels, not just how it looks.', props: { attribution: 'Xtoryteller skill workflow' } },
          { type: 'footnote', content: `Preview ${variant.key.toUpperCase()} of 3 for ${topic}.` }
        ]
      }
    ]
  };
}

for (const variant of variants) {
  const slug = `${prefix}-${variant.key}`;
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

console.log(`Created ${variants.length} preview presentations for mood "${mood}" with prefix "${prefix}".`);
for (const variant of variants) {
  console.log(`- http://localhost:3000/${prefix}-${variant.key}`);
}

