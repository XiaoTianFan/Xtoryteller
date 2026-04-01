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

## Shell And Chrome Tokens

The runtime consumes additional nested theme token families beyond the basic core sections. Common groups include:

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

These nested values are flattened into CSS variables automatically.

## Validation

- Validate one theme:
  `node scripts/validate-theme.mjs themes/<theme>.yaml`
- Refresh registries and validate broadly after shared theme changes:
  `node scripts/validate-all.mjs`

## Related Guides

- [backgrounds-transitions.md](backgrounds-transitions.md)
- [runtime-support-matrix.md](runtime-support-matrix.md)
- [qa-workflows.md](qa-workflows.md)
