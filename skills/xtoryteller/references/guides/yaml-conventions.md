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
- In Stage mode, the document height must remain equal to the viewport. If the page grows taller, the step is overfilled.
- Split long lists across builds or additional steps.
- Split long prose into multiple steps or a more suitable layout.
- Use layout density guidance from the layout registry and manifests.
- Treat `pyramid-layout` as compact-only: one short heading plus one short line per row.
- Treat `timeline-layout` as equal-density storytelling: if one item needs substantially more copy than its siblings, split it out.
- Keep diagram labels concise enough to fit their containers without relying on clipping.

## Build Steps

- Default-visible components effectively occupy build step `0`.
- Keep explicit build indices contiguous so the user never advances into an empty click.
- Use `build: sequential` when item-by-item reveal improves comprehension.
- Add `build: sequential` explicitly for `bullet-list` or `numbered-list` when each point should get its own viewer advance.

## Assets

- Keep local assets relative to the presentation directory, usually under `assets/`.
- Use clear filenames and keep references stable.
- Prefer local assets for packaged portability when the presentation should travel cleanly.

## Themes And Styles

- Prefer theme tokens and `themeOverrides` over repeated inline style objects.
- Use generic core tokens only for whole-theme values. Use semantic token families when the value belongs to reusable shell, component, or layout visual language.
- Reach for `spacing.chrome.*`, `spacing.components.*`, `spacing.layouts.*`, `sizing.components.*`, `sizing.layouts.*`, and `typography.components.*` before inventing one-off CSS values.
- Avoid hardcoded colors unless they are truly content-specific accents.
- If a change should affect many components, move it into the theme instead of repeating overrides.
- Let component shape follow theme radii. Do not assume decorative pills or rounded capsules unless the theme or component contract calls for them.
- Keep viewport mechanics, SVG math, arrangement outputs, and similar intrinsic rules in code/CSS instead of moving them into YAML by default.
- To float one component out of a layout's flex flow while keeping the remaining components centered, use `style: { position: absolute, bottom: "calc(50% + <offset>)" }` on the component to remove. The standard case is a `section-header` label that should sit just above a vertically centered headline rather than being centered with it. See the `section-header` entry in the Stage authoring layout heuristics.

## Card Selection

- Use `stat-card` for short values with supporting detail.
- Use `feature-card` for a named capability plus explanatory text.
- Use `card` or `callout` when the main payload is prose rather than a metric.
