# Stage Authoring

Read this file when the user needs a sequential Xtoryteller presentation or wants to edit an existing Stage deck.

## When Stage Mode Fits

Choose Stage mode when the story is speaker-led, linear, or slide-like.

Good fits:
- talks
- walkthroughs
- reports
- pitch narratives
- section-by-section explainers

## Before Writing YAML

1. Read the registries:
   - `skills/xtoryteller/references/registries/component-registry.json`
   - `skills/xtoryteller/references/registries/layout-registry.json`
   - `skills/xtoryteller/references/registries/transition-registry.json`
   - `skills/xtoryteller/references/registries/theme-registry.json`
2. Read the schema:
   - `skills/xtoryteller/references/schema/schema.yaml`
3. Read [yaml-conventions.md](yaml-conventions.md) if you are restructuring dense YAML.
4. Pick the nearest example from [example-selection.md](example-selection.md).

## Authoring Pattern

- Outline the beats first.
- Assign one layout per beat based on density and content shape.
- Use build sequencing for lists or progressive reveals.
- Keep transitions consistent across most steps.
- Put local assets in `presentations/<slug>/assets/`.

## High-Value Layout Heuristics

- `title-center`: opening or section reset
- `single-content`: one dominant idea or diagram
- `two-column`: comparison or text-plus-supporting visual
- `content-left-media-right`: explanation plus visual evidence
- `grid-2x2` / `grid-3x2`: compact cards or stats only
- `stack`: simple vertical rhythm for closing or emphasis

## Content Rules

- Split instead of cram.
- Keep list-heavy steps readable; use `build: sequential` when appropriate.
- Prefer built-in diagrams over forcing relationships into bullets.
- Prefer `themeOverrides` for broad style shifts instead of repeated inline styles.
- Read [annotations.md](annotations.md) when the copy depends on hover annotations inside markdown-rendered content.
- Read [current-runtime-limitations.md](current-runtime-limitations.md) and [runtime-support-matrix.md](runtime-support-matrix.md) before depending on advanced annotation or animation semantics.

## Deterministic Helpers

- Scaffold a new Stage deck:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple`
- Generate style previews:
  `node skills/xtoryteller/scripts/create-style-previews.mjs --mood confident --topic "My Talk" --force`

## Validation

- Validate one deck:
  `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
- Validate the repo after shared changes:
  `node scripts/validate-all.mjs`

## Example Files

- `skills/xtoryteller/references/examples/simple-stage.yaml`
- `skills/xtoryteller/references/examples/complex-stage.yaml`
