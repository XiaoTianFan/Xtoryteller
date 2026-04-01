# Map Authoring

Read this file when the user needs a spatial Xtoryteller presentation or wants to edit an existing Map deck.

## When Map Mode Fits

Choose Map mode when the material benefits from exploration, systems thinking, workshop flow, or spatial grouping.

Good fits:
- system maps
- strategy landscapes
- workshop canvases
- relationship-heavy topics
- clustered research synthesis

## Before Writing YAML

1. Read the registries and schema:
   - `skills/xtoryteller/references/registries/component-registry.json`
   - `skills/xtoryteller/references/registries/layout-registry.json`
   - `skills/xtoryteller/references/registries/transition-registry.json`
   - `skills/xtoryteller/references/registries/theme-registry.json`
   - `skills/xtoryteller/references/registries/background-registry.json`
   - `skills/xtoryteller/references/schema/schema.yaml`
2. Read [current-runtime-limitations.md](current-runtime-limitations.md) and [runtime-support-matrix.md](runtime-support-matrix.md) if the request sounds close to APRD-only features.
3. Read [yaml-conventions.md](yaml-conventions.md) if you are hand-editing complex cluster YAML.
4. Pick the nearest example from [example-selection.md](example-selection.md).

## Authoring Pattern

- Give every cluster a stable `id`.
- Add titles and descriptions so the dashboard and map shell stay legible.
- Choose either:
  - manual relative anchors, or
  - a supported arrangement algorithm.
- Add `navigation.sequence` when guided mode matters.
- Use cluster grouping when background sections or user orientation benefit from it.

## Supported Arrangement Paths

Current runtime support includes:
- manual anchors with `relativeTo`, `direction`, and `distance`
- `flow`
- `radial`
- `grid`
- `tree`

## Cluster Rules

- Keep clusters far enough apart to avoid overlap.
- Make anchor references resolvable and acyclic.
- Prefer one strong layout per cluster rather than many tiny fragments.
- Use built-in diagram components when the map is expressing relationships, processes, or structure.
- Treat annotations as markdown-only unless you have verified a component-specific implementation.

## Deterministic Helpers

- Scaffold a new Map deck:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-map --mode map --example simple`

## Validation

- Validate one deck:
  `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
- The validator now checks:
  - navigation sequence references
  - anchor cycles and missing targets
  - density warnings
  - asset paths

## Example Files

- `skills/xtoryteller/references/examples/simple-map.yaml`
- `skills/xtoryteller/references/examples/complex-map.yaml`
