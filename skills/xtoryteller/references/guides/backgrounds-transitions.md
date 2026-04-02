# Backgrounds And Transitions

Read this file when a task depends on presentation mood, scene shifts, or background section behavior.

## Background Surface

Xtoryteller supports a top-level `background`, APRD-style `background.stages` / `background.regions`, and legacy `backgroundSections`.

Default behavior:

- If a presentation omits `background`, the active theme background renders instead.
- If a presentation also omits `theme`, it inherits the dashboard-selected global theme and therefore that theme's background.
- Use presentation-level `background` only when the deck truly needs to diverge from theme-owned background behavior.

Authoring choices:

- `background: none`
- `background: "linear-gradient(...)"` for a simple CSS background
- `background: mesh-gradient` or another supported curated Paper shader
- `background: { type: paper-shader, presetRef: editorial-paper }` for a shared repo preset
- `background: { type: css, value: "..." }`
- `background: { type: css, gradient: { type: linear, angle: 135, stops: [...] } }`
- `background: { type: paper-shader, shader: waves, preset: groovy, colorStops: [...], intensity: 0.5 }`

Shared preset references come from `references/registries/background-registry.json`. `presetRef` is Xtoryteller's reusable preset key; `preset` still means the upstream Paper Shader preset such as `groovy` or `wave`.

Currently supported Paper shader targets:

- `paper-texture`
- `dithering`
- `mesh-gradient`
- `grain-gradient`
- `water`
- `warp`
- `waves`
- `static-mesh-gradient`
- `static-radial-gradient`

Aliases:

- `grain` or `paper` -> `paper-texture`
- `mesh` -> `mesh-gradient`
- `noise` -> `grain-gradient`
- `watercolor` -> `water`
- `radial` -> `static-radial-gradient`
- `dither` -> `dithering`

Common pattern:

```yaml
background:
  type: paper-shader
  presetRef: tidal-waves
  stages:
    - steps: [0, 1]
      type: css
      gradient:
        type: linear
        angle: 135
        stops: ['#101820', '#1d3557']
    - steps: [2, 4]
      presetRef: focus-grain
      colorStops: ['#0b132b', '#1c2541', '#5bc0be']
      intensity: 0.7
      grain: 0.25
```

Use `steps` inside `background.stages` for Stage mode. Use `clusters` or `group` inside `background.regions` for Map mode. Keep `backgroundSections` only for backward-compatible legacy decks.

## Motion Guidance

- Prefer the upstream Paper Shader preset's built-in motion when the shader supports `speed` or `frame`.
- Xtoryteller only adds wrapper-driven fallback drift for shaders that do not expose built-in animation channels, such as `waves`.
- Keep motion slow for dashboard and viewer shell backgrounds unless the task explicitly calls for a more active look.
- Reduced-motion still short-circuits the animated behavior.

## Transition Surface

- Step and cluster transitions should come from `references/registries/transition-registry.json`.
- Keep most transitions consistent across a deck unless the story beat truly changes.
- Component-level `enter` and `exit` props are supported and should resolve through the same transition registry surface, including presentation-scoped transition folders.

## Current Support Guidance

- Named transitions, background switching, CSS backgrounds, Paper shader backgrounds, and reduced-motion behavior are shipped.
- Same-renderer compatible states interpolate supported numeric and color props.
- Different renderer types, incompatible presets, and raw CSS background strings cross-fade between layers.
- Paper Shader presets with built-in animation use the library's own timing path; wrapper fallback motion is only used where the library has no native animation channel.
- Reduced-motion mode short-circuits background changes to immediate swaps.
- Unsupported shader names, presets, and params should fail validation instead of being passed through.
- When a motion choice is critical to the experience, validate in the browser instead of trusting the schema alone.

## Related Guides

- [theme-authoring.md](theme-authoring.md)
- [current-runtime-limitations.md](current-runtime-limitations.md)
- [runtime-support-matrix.md](runtime-support-matrix.md)
