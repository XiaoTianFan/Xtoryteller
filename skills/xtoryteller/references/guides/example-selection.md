# Example Selection

Read this file before scaffolding or when you want the closest trustworthy YAML starting point.

## Example Map

- `skills/xtoryteller/references/examples/simple-stage.yaml`
  Use for a short linear deck, foundational structure, new-presentation scaffolding, or the simplest inherited-theme example.

- `skills/xtoryteller/references/examples/complex-stage.yaml`
  Use for a richer linear deck with more component variety, build choreography, and local `themeOverrides` without locking the entire deck to a specific theme.

- `skills/xtoryteller/references/examples/simple-map.yaml`
  Use for a minimal cluster-based story with straightforward anchors and inherited theme-owned background behavior.

- `skills/xtoryteller/references/examples/complex-map.yaml`
  Use for richer Map mode authoring, multiple diagram clusters, guided navigation, and local `themeOverrides` without hard-pinning the background system.

## Heuristic

- If the user is starting from scratch and speed matters, scaffold from a simple example.
- If the user already wants a more expressive deck and the content is varied, inspect the complex example first.
- If the task is mostly about styling rather than structure, use style previews instead of overfitting the first real deck.
- If the task needs a reusable Paper Shader look, inspect the background registry before inventing a new inline shader block.
- If the task is a canonical demo or a new presentation that should follow the dashboard theme switcher, omit `theme` and top-level `background`.
- If the task is about annotations, themes, transitions, or runtime behavior, read the matching guide first instead of overloading an example as documentation.

## Deterministic Helper

Use the scaffold script instead of copying YAML by hand:

- Stage:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple`
- Map:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-map --mode map --example simple`
- Complex seed:
  add `--example complex`
