# YAML Conventions

## Naming

- Use kebab-case for slugs, directory names, component types, layout names, and theme file names.
- Keep `presentations/<slug>/presentation.yaml` aligned with `meta.slug`.
- Give steps and clusters stable ids when they will be referenced, reordered, or revisited.

## Formatting

- Prefer multi-line `|` blocks for paragraphs, speaker-style copy, or code snippets.
- Keep arrays readable. Expand them vertically once they stop being trivially short.
- Use consistent indentation. YAML errors are usually formatting errors before they are data-model errors.

## Content Density

- Never rely on overflow or scrolling to rescue a crowded step.
- Split long lists across builds or additional steps.
- Split long prose into multiple steps or a more suitable layout.
- Use layout density guidance from the layout registry and manifests.

## Build Steps

- Default-visible components effectively occupy build step `0`.
- Keep explicit build indices contiguous so the user never advances into an empty click.
- Use `build: sequential` when item-by-item reveal improves comprehension.

## Assets

- Keep local assets relative to the presentation directory, usually under `assets/`.
- Use clear filenames and keep references stable.
- Prefer local assets for packaged portability when the presentation should travel cleanly.

## Themes And Styles

- Prefer theme tokens and `themeOverrides` over repeated inline style objects.
- Avoid hardcoded colors unless they are truly content-specific accents.
- If a change should affect many components, move it into the theme instead of repeating overrides.
