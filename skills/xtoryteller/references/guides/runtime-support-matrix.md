# Runtime Support Matrix

Read this file when you need a quick truth source for what Xtoryteller currently supports.

## Supported Now

- Stage mode and Map mode authoring
- Generated registries for components, layouts, transitions, themes, and shared backgrounds
- `themeOverrides`
- Optional presentation `theme` with fallback to the dashboard-selected global theme
- `background`, APRD-style `background.stages` / `background.regions`, and legacy `backgroundSections`
- `presetRef` inside object-form backgrounds, including top-level, stage/map overrides, step backgrounds, cluster backgrounds, and legacy `backgroundSections[].shader`
- Dual background renderers: CSS plus `@paper-design/shaders-react`
- Optional Paper Shader legibility overlays through `background.filter` with forward and reverse `radial`, `linear-horizontal`, and `linear-vertical` modes
- Theme-owned dashboard and viewer background rendering
- Portability workflows for export, import, and component promotion
- Markdown hover annotations through `{{hover:key|Label}}` plus `component.annotations`
- Presentation-scoped primitive resolution in the runtime viewer
- Component-level `enter` / `exit` transitions with registry validation
- Dashboard search, filtering, sorting, and viewer navigation
- Stage-step `description` support rendered as orientation copy above the active scene
- Clickable Stage progress rail for direct step jumps

## Partial Or Verify Manually

- APRD-wide `annotation anywhere` behavior beyond markdown-rendered content
- Richer transition semantics than the current named transition surface guarantees
- Subtle background motion choices whose quality depends on shader-specific browser rendering
- Automatic CSS fallback generation for shared shader presets
- Any feature whose value depends on subtle motion or nuanced layout behavior

## Practical Rule

If a feature sits in the second section, call out the limitation plainly, use the nearest supported path when possible, and verify in the browser before promising the result.

## Polishing Takeaways

- Validation can confirm structure, but it will not tell you when a long deck feels under-structured. Use browser review to judge chaptering, subtitle clarity, and navigation comfort.
- When a long Stage deck grows beyond a short talk, navigation affordances become part of the reading experience. Treat interactive progress and clear step orientation as core runtime UX, not optional chrome.
