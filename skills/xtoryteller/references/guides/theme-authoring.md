# Theme Authoring

Read this file when you are creating a reusable theme or adjusting `themeOverrides`.

## Theme Files

Themes live in `themes/<slug>.yaml`.

Required core sections:

- `fonts`
- `colors`
- `typography`
- `spacing`
- `radii`
- `shadows`
- `borders`
- `motion`

Presentations select a theme with `theme: <slug>` and can add `themeOverrides` for targeted adjustments.

## Decision Rule

- Use `themeOverrides` when the style change is local to one presentation.
- Create or edit a theme file when the visual language should be reusable across multiple presentations.

## Authoring Rules

- Prefer theme tokens over repeated inline style objects.
- Keep font roles explicit for heading, body, and mono.
- Keep contrast strong enough to pass `validate-theme`.
- Make motion settings deliberate instead of treating them as decorative defaults.

## Font Sources

Each font role supports these sources:

- `system`: emits only `font-family` variables.
- `local`: emits `@font-face` rules from declared `files`.
- `google`: generates Google Fonts stylesheet links from `family`, `weights`, `styles`, and `display`.
- `fontshare`: injects the provided `cssUrl` stylesheet.

### Font Role Fields

- `family`: display family name used in `font-family`.
- `source`: `system | local | google | fontshare`.
- `fallbacks`: fallback stack appended to the family.
- `weights`: required for `google`; optional otherwise.
- `styles`: optional list of `normal` and/or `italic`.
- `display`: optional font-display strategy.
- `cssUrl`: required for `fontshare`.
- `files`: required for `local`.

### Local Font Files

Local font files must live under `public/fonts/` and each file entry should look like:

```yaml
fonts:
  heading:
    family: My Serif
    source: local
    files:
      - path: /fonts/my-serif/regular.woff2
        weight: 400
      - path: /fonts/my-serif/italic.woff2
        weight: 400
        style: italic
```

## Semantic Token Taxonomy

The runtime consumes nested theme token families beyond the basic core sections. These nested values are flattened into CSS variables automatically.

Use generic core tokens when a value truly belongs to the whole theme:

- `typography.h1`, `typography.body`
- `spacing.page`, `spacing.gap`
- `radii.small`, `shadows.soft`, `borders.subtle`
- `motion.fast`, `motion.easing`

Use semantic families when the value belongs to reusable visual language rather than a one-off layout rule:

- `spacing.chrome.*` for dashboard and viewer shell padding, dock spacing, chip spacing, and overlay spacing.
- `spacing.components.*` for card, list, callout, timeline, annotation, code, media, chart, and helper spacing.
- `spacing.layouts.*` for compact layout spacing, timeline offsets, and shared layout presentation gaps.
- `sizing.components.*` for avatars, icons, tooltip widths, shortcut shell widths, media heights, and chart geometry that should be themeable.
- `sizing.layouts.*` for repeated layout min/max widths, scattered widths, divider widths, and pyramid widths.
- `typography.components.*` for component-specific type scales such as shell hero copy, feature-card titles, stat values, and diagram labels.
- `radii.chrome.*`, `radii.components.*`, `radii.layouts.*` when shape is part of the visual language.
- `shadows.chrome.*`, `shadows.components.*` when elevation differs by semantic surface.
- `borders.chrome.*`, `borders.components.*` when border treatments are part of the reusable system.
- `motion.components.*` only for component-specific offsets or delays not already covered by global motion groups.

Supporting color groups still include:

- `colors.chrome.*`
- `colors.code.*`
- `colors.scrollbar.*`
- `colors.progress.*`
- `colors.diagram.*`
- `colors.background-rgb`
- `colors.foreground-rgb`
- `colors.backgroundStops.*`
- `motion.scene.*`
- `motion.reveal.*`
- `motion.panel.*`
- `motion.hover.*`

## Boundary

- Theme YAML controls reusable visual language through CSS variables.
- Runtime code owns behavior, content, layout algorithms, breakpoints, viewport mechanics, and intrinsic rendering math.
- Keep values hard-coded only when they are structural mechanics like `100vh`, `100%`, SVG math, or algorithmic placement outputs rather than theme language.

## Validation

- Validate one theme:
  `node scripts/validate-theme.mjs themes/<theme>.yaml`
- Refresh registries and validate broadly after shared theme changes:
  `node scripts/validate-all.mjs`

## Related Guides

- [backgrounds-transitions.md](backgrounds-transitions.md)
- [runtime-support-matrix.md](runtime-support-matrix.md)
- [qa-workflows.md](qa-workflows.md)
