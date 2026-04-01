# Backgrounds And Transitions

Read this file when a task depends on presentation mood, scene shifts, or background section behavior.

## Background Surface

Xtoryteller supports a top-level `background`, APRD-style `background.stages` / `background.regions`, and legacy `backgroundSections`.

Authoring choices:

- `background: none`
- `background: "linear-gradient(...)"` for a simple CSS background
- `background: mesh-gradient` or another supported curated Paper shader
- `background: { type: css, value: "..." }`
- `background: { type: css, gradient: { type: linear, angle: 135, stops: [...] } }`
- `background: { type: paper-shader, shader: waves, preset: groovy, colorStops: [...], intensity: 0.5 }`

Currently supported Paper shader targets:

- `paper-texture`
- `mesh-gradient`
- `grain-gradient`
- `water`
- `waves`
- `static-mesh-gradient`
- `static-radial-gradient`

Aliases:

- `grain` or `paper` -> `paper-texture`
- `mesh` -> `mesh-gradient`
- `noise` -> `grain-gradient`
- `watercolor` -> `water`
- `radial` -> `static-radial-gradient`

Common pattern:

```yaml
background:
  type: paper-shader
  shader: waves
  preset: groovy
  colorStops: ['#faf7f1', '#315c8f', '#d5a24f']
  stages:
    - steps: [0, 1]
      type: css
      gradient:
        type: linear
        angle: 135
        stops: ['#101820', '#1d3557']
    - steps: [2, 4]
      shader: grain-gradient
      preset: wave
      colorStops: ['#0b132b', '#1c2541', '#5bc0be']
      intensity: 0.7
      grain: 0.25
```

Use `steps` inside `background.stages` for Stage mode. Use `clusters` or `group` inside `background.regions` for Map mode. Keep `backgroundSections` only for backward-compatible legacy decks.

## Transition Surface

- Step and cluster transitions should come from `references/registries/transition-registry.json`.
- Keep most transitions consistent across a deck unless the story beat truly changes.
- Component-level `enter` and `exit` props are supported and should resolve through the same transition registry surface, including presentation-scoped transition folders.

## Current Support Guidance

- Named transitions, background switching, CSS backgrounds, Paper shader backgrounds, and reduced-motion behavior are shipped.
- Same-renderer compatible states interpolate supported numeric and color props.
- Different renderer types, incompatible presets, and raw CSS background strings cross-fade between layers.
- Reduced-motion mode short-circuits background changes to immediate swaps.
- Unsupported shader names, presets, and params should fail validation instead of being passed through.
- When a motion choice is critical to the experience, validate in the browser instead of trusting the schema alone.

## Related Guides

- [theme-authoring.md](theme-authoring.md)
- [current-runtime-limitations.md](current-runtime-limitations.md)
- [runtime-support-matrix.md](runtime-support-matrix.md)
