---
name: xtoryteller
description: Create, edit, validate, test, and package Xtoryteller presentations and runtime features. Use when the task involves Stage-mode or Map-mode authoring in this repo, markdown annotation authoring, theme/background/transition work, dashboard or viewer runtime changes, choosing or refining layouts/components/themes/transitions, creating style previews, scaffolding Xtoryteller primitives, or running portability workflows for export/import/promotion.
---

# Xtoryteller

Use this skill for work inside the Xtoryteller presentation system, not for one-off HTML slide generation.

## Quick Route

- For a new or edited linear deck, read [guides/stage-authoring.md](references/guides/stage-authoring.md).
- For a new or edited spatial presentation, read [guides/map-authoring.md](references/guides/map-authoring.md).
- For markdown hover annotations or markdown-rendered copy, read [guides/annotations.md](references/guides/annotations.md).
- For themes, `themeOverrides`, backgrounds, or transitions, read [guides/theme-authoring.md](references/guides/theme-authoring.md) and [guides/backgrounds-transitions.md](references/guides/backgrounds-transitions.md).
- For new components, layouts, or reusable themes, read [guides/primitive-extension.md](references/guides/primitive-extension.md) and [guides/component-authoring.md](references/guides/component-authoring.md).
- For export, import, and promotion work, read [guides/portability.md](references/guides/portability.md).
- For dashboard, viewer, renderer, validation, or runtime work, read [guides/architecture-overview.md](references/guides/architecture-overview.md), [guides/runtime-support-matrix.md](references/guides/runtime-support-matrix.md), and [guides/qa-workflows.md](references/guides/qa-workflows.md).
- For YAML format rules, anti-patterns, and failure recovery, read [guides/yaml-conventions.md](references/guides/yaml-conventions.md), [guides/anti-patterns.md](references/guides/anti-patterns.md), and [guides/troubleshooting.md](references/guides/troubleshooting.md).
- To choose a starting point before writing YAML, read [guides/example-selection.md](references/guides/example-selection.md) and inspect [examples/](references/examples/).
- For visual option generation, read [guides/style-discovery.md](references/guides/style-discovery.md).
- For regression-style prompt checks, read [evals/coverage-prompts.md](evals/coverage-prompts.md).

## Core Workflow

1. Read the generated registries before deciding what to compose:
   [component registry](references/registries/component-registry.json), [layout registry](references/registries/layout-registry.json), [transition registry](references/registries/transition-registry.json), [theme registry](references/registries/theme-registry.json).
2. Read the human-readable schema before writing or restructuring YAML:
   [schema guide](references/schema/schema.yaml) and [JSON schema](references/schema/schema.json).
3. Prefer built-in primitives and theme tokens before inventing new code.
4. Keep work YAML-first: author or edit `presentations/<slug>/presentation.yaml`, then validate.
5. Run validation before handoff:
   `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
6. When shared manifests or themes changed, refresh and validate broadly:
   `node scripts/validate-all.mjs`
7. When the task changes runtime behavior instead of only content, run the appropriate test layer from [guides/qa-workflows.md](references/guides/qa-workflows.md).
8. For Stage mode, manually verify viewport fit after meaningful edits at both `1280x720` and `1920x1080`. The page height must stay locked to the viewport, with no vertical growth or rescue scrolling.

## Theme-System Route

Use this decision rule whenever a task touches styling:

- `themeOverrides`: one-off presentation-local visual changes.
- `themes/<slug>.yaml`: reusable visual language that should persist across presentations.
- component/layout CSS: only for structural mechanics, rendering math, breakpoints, viewport rules, or algorithmic placement that should not become part of the reusable theme surface.

Prefer the semantic token families before adding literals:

- `spacing.chrome.*` for dashboard/viewer shell spacing.
- `spacing.components.*` for reusable component patterns such as cards, lists, callouts, timelines, annotations, code blocks, and media shells.
- `spacing.layouts.*` for reusable layout presentation values like compact padding, divider spacing, and timeline offsets.
- `sizing.components.*` and `sizing.layouts.*` for reusable widths, heights, avatar/icon sizes, tooltip shells, marker sizes, and repeated min/max widths.
- `typography.components.*` for component-specific scales such as hero copy, stat values, and diagram labels.
- `motion.components.*` only for component-specific offsets or delays not already covered by global motion groups.
- matching semantic `radii.*`, `shadows.*`, and `borders.*` groups when shape, elevation, or stroke treatment is part of the visual language.

When refactoring visual styles:

1. Update the shipped themes first.
2. Update validation expectations if a new semantic family becomes required.
3. Replace hardcoded CSS values with semantic token references.
4. Add or update regression tests for the affected shell/component/layout surface.
5. Run the relevant validation and QA layers from [guides/qa-workflows.md](references/guides/qa-workflows.md).

## Helper Scripts

Use these when repeated scaffolding would otherwise become manual and fragile.

- `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple`
- `node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve`
- `node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split`
- `node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force`

## Working Rules

- Never treat Xtoryteller as a generic HTML deck generator when the runtime primitives can express the result.
- Never cram content into a layout; split steps or clusters instead.
- Never rely on page growth, overflow, or scrolling to save a crowded Stage step.
- Never solve repeated visual drift with scattered hardcoded CSS values when the design belongs in the theme token system.
- Never turn intrinsic layout mechanics like `100vh`, `100%`, SVG geometry, or arrangement outputs into theme tokens unless they are clearly intended as reusable visual language.
- Keep `stat-card` values short and metric-like. If the value reads like a sentence fragment, use `card`, `feature-card`, or `callout` instead.
- Use `build: sequential` on bullet or numbered lists when the story expects one item per advance.
- Keep `pyramid-layout` rows compact: one short label plus one short sentence, not list-heavy cards.
- Keep `org-chart` and `sankey-diagram` labels concise. Split dense structures instead of forcing long labels into one step.
- Keep `meta.slug` aligned with the presentation folder.
- Keep asset references relative to the presentation directory, usually under `assets/`.
- Treat markdown hover annotations as supported only within the current markdown annotation model.
- Stay honest about partial features and verify advanced behavior manually when needed.
