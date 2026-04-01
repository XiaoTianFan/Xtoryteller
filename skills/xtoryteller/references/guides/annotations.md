# Annotations

Read this file when markdown content needs inline hover help or glossary-style explanation.

## Supported Model

Xtoryteller currently supports hover annotations inside markdown-rendered content.

Use this syntax inside markdown:

- `{{hover:key}}`
- `{{hover:key|Visible label}}`

Back it with `component.annotations` on the same component instance:

```yaml
- type: body-text
  content: |
    The concept of {{hover:leverage-points|leverage points}} matters here.
  annotations:
    leverage-points: Small interventions can create outsized systemic change.
```

## Lookup Behavior

The renderer looks up annotation text in this order:

1. exact key
2. normalized key
3. label text

That means `{{hover:Leverage Points|leverage points}}` can still resolve if the annotation key is stored as `leverage-points`.

## Interaction Behavior

- Hover reveals the tooltip.
- Keyboard focus reveals the tooltip.
- Click toggles a pinned state.
- `Escape` closes the pinned state.
- If no annotation detail matches, the content falls back to plain inline text.

## Where To Use It

- body copy that needs a short glossary note
- subtle clarifications inside cards or text blocks
- speaker-led decks where extra detail should not stay permanently visible

## Important Limits

- This support depends on the component rendering markdown through the shared markdown path.
- Do not assume arbitrary SVG, diagram node, or non-markdown hotspot support.
- Treat the broader APRD-wide `annotation anywhere` model as unshipped unless you verify a component-specific implementation.

## Related Guides

- [stage-authoring.md](stage-authoring.md)
- [current-runtime-limitations.md](current-runtime-limitations.md)
- [runtime-support-matrix.md](runtime-support-matrix.md)
