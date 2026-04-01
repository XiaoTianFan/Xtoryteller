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

## Helper Scripts

Use these when repeated scaffolding would otherwise become manual and fragile.

- `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple`
- `node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve`
- `node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split`
- `node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force`

## Working Rules

- Never treat Xtoryteller as a generic HTML deck generator when the runtime primitives can express the result.
- Never cram content into a layout; split steps or clusters instead.
- Keep `meta.slug` aligned with the presentation folder.
- Keep asset references relative to the presentation directory, usually under `assets/`.
- Treat markdown hover annotations as supported only within the current markdown annotation model.
- Stay honest about partial features and verify advanced behavior manually when needed.
