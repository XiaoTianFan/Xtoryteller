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

