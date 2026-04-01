# Troubleshooting

## Unknown component, layout, transition, or theme

- Regenerate registries with `node scripts/generate-registries.mjs`.
- Re-run `node scripts/validate.mjs presentations/<slug>/presentation.yaml`.
- Check for typos and confirm the manifest exists in the expected global library directory.

## YAML parse or schema errors

- Check indentation first.
- Expand dense inline objects or arrays into block form.
- Compare the failing section against `skills/xtoryteller/references/schema/schema.yaml`.

## Missing or broken assets

- Confirm the asset exists relative to the presentation directory.
- Prefer references like `assets/hero.svg`, not absolute filesystem paths.
- Re-run validation after moving or renaming assets.

## Empty clicks during Stage mode

- Look for gaps in explicit build indices.
- Use contiguous numbers or simplify back to `build: sequential`.
- Re-run validation; the validator now warns about empty build slots.

## Map navigation breaks or feels wrong

- Check that every `navigation.sequence` id exists in `clusters`.
- Check `anchor.relativeTo` references for typos or cycles.
- Confirm `canvas.minZoom` is not greater than `canvas.maxZoom`.

## Theme issues

- Run `node scripts/validate-theme.mjs themes/<theme>.yaml`.
- Fix contrast failures before compensating with component-level overrides.
- If the theme is new, regenerate registries so agents can discover it.

## Annotations do not show a tooltip

- Confirm the component actually renders markdown through the shared markdown path.
- Confirm the markdown uses `{{hover:key|Label}}` or `{{hover:key}}`.
- Confirm `component.annotations` includes the same key or a normalized equivalent.
- If no matching annotation detail is found, the text falls back to plain inline content.

## APRD feature exists on paper but not fully in the viewer

- Prefer the nearest shipped behavior instead of forcing the aspirational feature.
- Call out the limitation plainly.
- Offer a supported alternative: different component, theme override, step split, or global primitive promotion.
