# Example Selection

Read this file before scaffolding or when you want the closest trustworthy YAML starting point.

## Example Map

- `skills/xtoryteller/references/examples/simple-stage.yaml`
  Use for a short linear deck, foundational structure, or new-presentation scaffolding.

- `skills/xtoryteller/references/examples/complex-stage.yaml`
  Use for a richer linear deck with more component variety and build choreography.

- `skills/xtoryteller/references/examples/simple-map.yaml`
  Use for a minimal cluster-based story with straightforward anchors.

- `skills/xtoryteller/references/examples/complex-map.yaml`
  Use for richer Map mode authoring, multiple diagram clusters, and guided navigation.

## Heuristic

- If the user is starting from scratch and speed matters, scaffold from a simple example.
- If the user already wants a more expressive deck and the content is varied, inspect the complex example first.
- If the task is mostly about styling rather than structure, use style previews instead of overfitting the first real deck.
- If the task is about annotations, themes, transitions, or runtime behavior, read the matching guide first instead of overloading an example as documentation.

## Deterministic Helper

Use the scaffold script instead of copying YAML by hand:

- Stage:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple`
- Map:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-map --mode map --example simple`
- Complex seed:
  add `--example complex`
