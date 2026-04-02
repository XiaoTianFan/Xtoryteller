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
- Optional Paper Shader legibility overlays through `background.filter` with `radial`, `linear-horizontal`, and `linear-vertical` modes
- Theme-owned dashboard and viewer background rendering
- Portability workflows for export, import, and component promotion
- Markdown hover annotations through `{{hover:key|Label}}` plus `component.annotations`
- Presentation-scoped primitive resolution in the runtime viewer
- Component-level `enter` / `exit` transitions with registry validation
- Dashboard search, filtering, sorting, and viewer navigation

## Partial Or Verify Manually

- APRD-wide `annotation anywhere` behavior beyond markdown-rendered content
- Richer transition semantics than the current named transition surface guarantees
- Subtle background motion choices whose quality depends on shader-specific browser rendering
- Automatic CSS fallback generation for shared shader presets
- Any feature whose value depends on subtle motion or nuanced layout behavior

## Practical Rule

If a feature sits in the second section, call out the limitation plainly, use the nearest supported path when possible, and verify in the browser before promising the result.
