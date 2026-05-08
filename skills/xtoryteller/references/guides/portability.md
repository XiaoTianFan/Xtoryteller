# Portability

Read this file when the user needs to export, import, or promote presentation assets and dependencies.

## Export

Use the repo-level export script to package a presentation and its dependencies.

Command:
`node scripts/export.mjs presentations/<slug>`

What it does:
- copies the presentation folder
- bundles needed global components, layouts, and transitions
- copies the active theme when available
- creates a portable zip in `exports/`

## PDF Export

Use the PDF export script when the user wants a shareable PDF rather than a portable Xtoryteller package.

Command:
`npm run presentation:pdf -- --slug <slug> [--output exports] [--base-url http://127.0.0.1:3000] [--raster-scale 1-4]`

What it does:
- loads the dedicated `/<slug>/export/pdf` route from a running Next server
- uses Chromium `page.pdf()` for plain Stage decks
- uses high-resolution captures of browser-rendered pages for shader/WebGL-heavy Stage decks and Map decks so visual appearance survives Chromium's print pipeline
- shader/WebGL-heavy Stage export captures one slide per route load to avoid exhausting Chromium's active WebGL context limit
- writes `exports/<slug>.pdf`
- exports Stage mode as one fully revealed page per step
- exports Map mode as one full-map overview page
- Stage pages lay out on a 1920x1080 CSS canvas at default `--raster-scale 1`, then fit into the 16:9 PDF page
- `--raster-scale` controls rasterized export resolution for Map decks and shader/WebGL-heavy Stage decks; default is `1` for Stage and `2` for Map, and `4` is the sharpest/largest output
- shader-heavy Stage decks use one-page-at-a-time browser capture so each slide keeps its real Paper Shader canvas alive during rasterization
- `--map-scale` remains accepted as a backwards-compatible alias for `--raster-scale`

Fidelity boundary:
- Plain Stage foreground text, SVG diagrams, CSS shapes, and links stay distinct/selectable where Chromium's PDF pipeline preserves them
- Rasterized exports prioritize visual fidelity over selectable text
- decorative Paper Shader/WebGL backgrounds and media fallbacks are rasterized when the exporter detects them
- PDF export is not a semantic PowerPoint object model, even though it is not a scanned-image PDF

## Import

Inspect first, then apply.

Preview import:
`node scripts/import.mjs exports/<slug>-complete.zip`

Apply import:
`node scripts/import.mjs exports/<slug>-complete.zip --confirm`

Force overwrite when truly intended:
`node scripts/import.mjs exports/<slug>-complete.zip --confirm --force`

## Promote A Presentation-Scoped Component

Command:
`node scripts/promote-component.mjs <presentation-slug> <component-name>`

Use this when a local component should become part of the reusable global library.

## Current Guarantees

The portability workflow now refreshes the agent registries automatically after import or promotion.

## What To Check Manually

- Did the imported presentation slug collide with an existing deck?
- Did packaged assets arrive where expected?
- Did the imported theme land correctly?
- Should any imported local primitive now become a global primitive?

## Related Limits

If the workflow depends on presentation-scoped layouts or transitions being first-class in the viewer, read [current-runtime-limitations.md](current-runtime-limitations.md) and [runtime-support-matrix.md](runtime-support-matrix.md) before promising behavior.

