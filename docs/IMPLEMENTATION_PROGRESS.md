# APRD Progress Snapshot

Last updated: 2026-04-01

This is a practical implementation audit against APRD phases 1-3. It focuses on what is shipped in the repo today, what was polished in this pass, and what still remains partial.

## Overall Read

Xtoryteller is no longer a Phase 1-only scaffold. The repo already ships the core Stage and Map runtimes, the expanded component/layout registry, portability scripts, dashboard discovery features, validation tooling, and example presentations that exercise much of phases 1-3.

The largest gaps are no longer missing architecture. They are mainly about robustness and support-level clarity:

- Validation needed to cover more of the APRD authoring rules.
- Agent registries needed to stay fresh automatically as manifests and themes changed.
- The skill surface was far too skeletal relative to the implementation.
- A few APRD ideas still exist more in schema or documentation than in fully landed viewer behavior.

## Phase 1

Status: Strongly implemented, with tooling polish added in this pass.

Shipped:

- Next.js app router setup with dashboard and presentation routes
- YAML loading and schema validation
- Component, layout, transition, and theme registries
- Theme provider and runtime providers
- XState-driven Stage runtime with step/build progression
- Core Phase 1 component and layout set, plus example stage presentations
- Keyboard navigation, progress UI, live region, reduced-motion-aware scene transitions
- Dev watcher and dashboard entry flow

Polished in this pass:

- Validation now checks missing assets, build-step gaps, duplicate step or cluster ids, background-section references, map anchor cycles, and navigation sequence integrity.
- Validation now emits density warnings for overloaded layouts, prose-like `stat-card` values, and over-dense `pyramid-layout` rows.
- Shared validation now refreshes agent registries before running.
- The watcher now refreshes registries automatically when manifests or themes change.
- Stage keyboard support now includes `Home`, `End`, numeric step jumps, fullscreen, and a shortcuts overlay.
- The Stage viewer is now explicitly viewport-locked, preventing page-height growth on dense steps.

## Phase 2

Status: Largely implemented.

Shipped:

- Map mode runtime with free-roam and guided navigation
- Cluster positioning with manual anchors plus flow, radial, grid, and tree arrangements
- First-wave diagram components such as causal, mind-map, iceberg, flowchart, and quadrant styles
- Expanded Phase 2 layout and transition set
- Map example presentations and background-section support

Polished in this pass:

- Validation now checks map navigation and anchor reference integrity more directly.
- Skill guidance now treats Map mode as a first-class orchestration path instead of a footnote.
- Map keyboard support now covers guided navigation, free-roam pan/zoom controls, shortcuts help, and consistent Escape behavior.
- Background resolution now supports APRD `background.stages` and `background.regions` plus legacy `backgroundSections`.
- Shared background presets now live in `backgrounds/*.yaml`, generate an agent-facing background registry, and resolve through `presetRef` anywhere object-form backgrounds are supported.
- Diagram fit behavior was tightened so wide `org-chart` and `sankey-diagram` content expands its SVG viewBox instead of clipping against fixed bounds.

## Phase 3

Status: Broadly implemented, with a few partial areas still worth tracking.

Shipped:

- Remaining major content and diagram component suite present in the repo
- Additional Phase 3 layouts
- Portability scripts for export, import, and component promotion
- Dashboard search, tag filter, sorting, and grid/list controls
- Theme validation tooling
- Showcase presentations that exercise Phase 3 primitives
- Skill folders, references, schema, examples, and sub-pipelines

Polished in this pass:

- Import and promotion workflows now regenerate agent registries automatically.
- The skill system was rewritten with fuller phase guidance, supporting-file references, density rules, style-discovery UX, and clearer current-support boundaries.
- Human-facing docs now include this progress snapshot and a presentation-authoring guide.
- Runtime primitive resolution now honors presentation-scoped `components/`, `layouts/`, and `transitions/` ahead of the global libraries for the active presentation.
- The background system now supports both CSS backgrounds and `@paper-design/shaders-react` through a curated adapter layer, with explicit supported shaders, presets, param validation, and CSS gradient normalization.
- The shared preset layer now gives agents a reusable Paper Shader background library without replacing direct CSS or inline shader authoring.
- Validation and portability helpers now understand background assets, background stage/region switching, component enter/exit transition dependencies, and presentation-scoped primitive folders.
- Shared grid, gallery, timeline, and pyramid rendering now stretches card-like components consistently so rows align visually without author-side spacing hacks.

Still partial or worth noting:

- Markdown hover annotations are shipped for markdown-rendered content, but the broader APRD-wide annotation vision still exceeds the current runtime surface.
- Background transitions now interpolate supported numeric and color props for compatible CSS and Paper states, then fall back to cross-fades when renderer types or presets differ.

## Practical Conclusion

Phases 1-3 are best described as implemented with selective partials, not unfinished from scratch. The repo now has a stronger “agent can trust the system” surface because validation is stricter, registries stay fresher, and the skill documentation is much closer to the actual runtime.