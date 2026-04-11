# System Upgrade Plan

Last updated: 2026-04-11

## Purpose

This plan records the architectural comparison against reveal.js and Impress.js, then turns the useful lessons into a practical Xtoryteller roadmap.

The conclusion is not that Xtoryteller should become either library. reveal.js and Impress.js are mature web-slide references with different strengths:

- reveal.js is strongest as a polished, plugin-rich HTML/Markdown slide runtime.
- Impress.js is strongest as a compact spatial deck format driven by CSS transforms.
- Xtoryteller is strongest as agent-first presentation infrastructure: YAML orchestration, reusable React primitives, generated registries, validation, themes, backgrounds, dashboard discovery, portability, and two shared navigation modes.

The upgrade direction is to keep Xtoryteller's structured YAML model and borrow the features that improve authoring clarity, presenter workflow, interoperability, and spatial expressiveness.

## Current Xtoryteller Baseline

Current repo snapshot:

- 40 global components
- 21 layouts
- 10 transitions
- 14 themes
- 13 background presets
- Stage mode and Map mode implemented
- XState navigation runtime
- Next.js App Router viewer and dashboard
- YAML presentation loading and schema validation
- generated agent registries for primitives, themes, and backgrounds
- presentation-scoped component/layout/transition overrides
- background system with CSS and Paper Shader presets
- portability export/import/promote workflows
- PDF export route and script present in the working tree
- canonical example decks validating successfully:
  - `presentations/human-ai-and-music-insight-brief/presentation.yaml`
  - `presentations/human-ai-and-music/presentation.yaml`

Important boundary:

- The core value is declarative orchestration over arbitrary HTML generation. Any upgrade should preserve that constraint unless it is explicitly an import/export bridge.

## Reference Deck Formats

### reveal.js

reveal.js organizes decks primarily as HTML sections inside:

```html
<div class="reveal">
  <div class="slides">
    <section>Horizontal slide</section>
    <section>
      <section>Vertical child slide</section>
      <section>Another vertical child slide</section>
    </section>
  </div>
</div>
```

Its deck model is DOM-first:

- A `<section>` is a slide.
- Nested `<section>` elements create vertical slide stacks.
- Incremental reveals use elements with `class="fragment"`.
- Slide behavior is commonly encoded in `data-*` attributes such as `data-background`, `data-transition`, `data-auto-animate`, and `data-state`.
- Markdown can be embedded with `data-markdown` or loaded externally.
- Speaker notes live in `<aside class="notes">`, `data-notes`, or Markdown notes syntax.
- Global runtime behavior lives in `Reveal.initialize({ ... })`.
- Plugins extend the deck without requiring one-off runtime forks.

Lesson for Xtoryteller:

- reveal.js is a model for presentation workflow maturity: notes, fragments, plugin ergonomics, presenter tools, export behavior, and backward-compatible deck extensions.

### Impress.js

Impress.js organizes decks as positioned HTML steps:

```html
<div id="impress"
     data-width="1920"
     data-height="1080"
     data-transition-duration="1000"
     data-perspective="1000">
  <div class="step" id="intro" data-x="0" data-y="0" data-scale="1">
    <h1>Intro</h1>
  </div>
  <div class="step" id="idea" data-x="1200" data-y="600" data-rotate="30" data-scale="2">
    <h2>Spatial idea</h2>
  </div>
</div>
```

Its deck model is also DOM-first, but spatial:

- Each `.step` is a navigable unit.
- `data-x`, `data-y`, `data-z`, `data-rotate`, `data-rotate-x`, `data-rotate-y`, and `data-scale` define the step transform.
- Step `id`s act as navigation anchors.
- Plugins add substeps, progress, speaker console, markdown, and other behaviors.
- Runtime state classes such as `.past`, `.present`, `.future`, and `.active` make navigation state easy to style.

Lesson for Xtoryteller:

- Impress.js is a model for spatial format clarity. Its biggest useful idea is not the exact HTML format, but the immediate readability of position, transform, overview, and navigation state.

## Upgrade Principles

1. Keep YAML as the primary authoring artifact.
2. Prefer schema-backed fields over freeform HTML escape hatches.
3. Treat reveal.js and Impress.js as interoperability and UX references, not as replacement runtimes.
4. Add small, composable declarative fields before adding broad new runtime modes.
5. Every new field should have:
   - schema documentation
   - validation coverage
   - agent skill guidance
   - at least one fixture or canonical example
   - viewer behavior or a documented no-op/export-only boundary

## Proposed Data Model Upgrades

### 1. First-Class Speaker Notes

Borrowed from reveal.js.

Add notes at presentation units:

```yaml
steps:
  - id: market-shift
    title: Market Shift
    notes: |
      Emphasize that the shift is structural, not only technical.
```

For Map mode:

```yaml
clusters:
  - id: creator-economy
    title: Creator Economy
    notes: |
      Use this cluster when the audience asks about incentives.
```

Future extension:

```yaml
components:
  - type: bullet-list
    notes: |
      Pause after the second bullet.
```

Implementation path:

- Add `notes?: string` to `StepDefinition`, `ClusterDefinition`, and optionally `ComponentInstance`.
- Render notes in a presenter view or dev-only notes panel first.
- Include notes in PDF/export metadata only after the runtime UI is stable.
- Add validation warnings for overly long notes only if they affect presenter UI.

### 2. Build/Fragment Semantics

Borrowed from reveal.js fragments.

Xtoryteller already has component-level `build`, including `sequential`. The missing layer is a richer build grammar for order, effect, and notes.

Candidate shape:

```yaml
steps:
  - id: transition-logic
    layout: two-column
    builds:
      - target: component:0
        effect: fade-up
        notes: Introduce the old system.
      - target: component:1
        effect: highlight
        notes: Contrast with the emerging system.
```

Near-term alternative:

```yaml
components:
  - type: bullet-list
    build:
      mode: sequential
      effect: fade-up
```

Implementation path:

- Start with a conservative `build.effect` field before adding cross-component build graphs.
- Validate effects against the transition registry or a dedicated fragment-effect registry.
- Preserve existing numeric and `sequential` semantics.
- Avoid making the build system so expressive that agents produce fragile choreography.

### 3. Runtime State Hooks

Borrowed from reveal.js `data-state` and Impress.js state classes.

Candidate shape:

```yaml
steps:
  - id: platform-lock-in
    state: platform-lock-in
```

For clusters:

```yaml
clusters:
  - id: infrastructure
    state: infrastructure-view
```

Use cases:

- background/theme variants
- analytics hooks
- presenter chrome changes
- custom component behavior
- export labeling

Implementation path:

- Add optional `state?: string | string[]` to steps and clusters.
- Expose state as data attributes on viewer shells, not as arbitrary global CSS mutation.
- Validate state strings as stable slugs.
- Document that state is a runtime hook, not a replacement for semantic fields.

### 4. Declarative Overview Units

Borrowed from Impress.js overview steps.

Map mode currently supports overview camera behavior. Make it authorable:

```yaml
navigation:
  sequence:
    - overview
    - creator-economy
    - platform-power

overviews:
  - id: overview
    title: Whole System
    camera:
      x: 0
      y: 0
      zoom: 0.42
```

Simpler alternative:

```yaml
navigation:
  overview:
    title: Whole System
    camera:
      x: 0
      y: 0
      zoom: 0.42
```

Implementation path:

- Start with `navigation.overview` rather than a full `overviews[]` collection.
- Allow `navigation.sequence` to include a reserved `overview` token only after validation and renderer support exist.
- Add Map keyboard and progress UI affordances for overview.
- Make PDF map export use the same overview camera when present.

### 5. Explicit Spatial Transform Grammar

Borrowed from Impress.js.

Xtoryteller Map mode already has anchors and frames. For advanced authoring, a compact transform field could clarify manual spatial decks:

```yaml
clusters:
  - id: creator-economy
    layout: single-content
    frame:
      width: 640
      height: 420
    transform:
      x: 1200
      y: 400
      z: 0
      scale: 1
      rotate: -4
```

Implementation path:

- Do not add rotation until cluster hit-testing, layout saving, and PDF export can handle it.
- Start with `transform.x`, `transform.y`, and `transform.scale` as aliases or a successor to absolute anchors only if it reduces author confusion.
- Validate that `transform` does not mix with `anchor` unless a clear precedence rule exists.
- Keep `anchor.relativeTo` for agent-friendly relative placement; it is often better than raw coordinates.

### 6. Import/Export Bridges

Borrowed from reveal.js and Impress.js as ecosystem strategy.

Potential export targets:

- `xtoryteller -> reveal.js`
- `xtoryteller -> static HTML bundle`
- `xtoryteller -> impress.js-style spatial HTML` for simple Map decks

Potential import targets:

- Markdown slides -> Xtoryteller Stage YAML
- reveal.js Markdown -> Xtoryteller Stage YAML
- Impress.js steps -> Xtoryteller Map YAML

Implementation path:

- Start with export-only bridges.
- Treat import as best-effort and lossy.
- Preserve Xtoryteller YAML as the source of truth.
- Include an export report that lists unsupported components, downgraded backgrounds, and static media fallbacks.

## Integration Roadmap

### Phase A: Documentation And Schema Design

Goal: capture the new vocabulary without changing runtime behavior prematurely.

Tasks:

- Add design notes for `notes`, `state`, `build.effect`, `navigation.overview`, and export bridges.
- Update schema drafts in `skills/xtoryteller/references/schema/`.
- Update Stage and Map authoring guides with examples.
- Add anti-pattern notes:
  - Do not use `state` when a typed field exists.
  - Do not use `build.effect` for every component by default.
  - Do not use raw spatial transforms when relative anchors express the intent better.

Exit criteria:

- schema proposal reviewed
- examples added
- no runtime behavior claimed as supported until implemented

### Phase B: Speaker Notes And Presenter Surface

Goal: add the highest-value reveal.js workflow feature.

Tasks:

- Add `notes` to schema and TypeScript types.
- Add validation coverage.
- Add a presenter notes panel or presenter route.
- Add keyboard shortcut documentation.
- Add one Stage example and one Map example.

Exit criteria:

- notes render in a supported UI
- notes do not leak into audience view
- tests cover loading and rendering

### Phase C: State Hooks And Build Effects

Goal: formalize a small safe subset of reveal.js fragment/state ideas.

Tasks:

- Add `state` to steps and clusters.
- Expose state through data attributes.
- Add `build.effect` only after choosing a minimal effect set.
- Connect build effects to the transition registry or a dedicated effect registry.
- Add validation for unknown effects.

Exit criteria:

- existing `build` syntax remains backward-compatible
- unsupported effects fail validation
- reduced-motion behavior remains correct

### Phase D: Map Overview And Spatial Clarity

Goal: learn from Impress.js without making Map mode manually brittle.

Tasks:

- Add `navigation.overview`.
- Use it in guided mode and PDF map export.
- Consider `transform` only after overview lands.
- If `transform` lands, document precedence against `anchor`.
- Add Map editor save behavior for any new spatial fields.

Exit criteria:

- overview is reachable by keyboard and UI
- overview is validated
- PDF/export behavior is deterministic
- no cluster overlap regressions in canonical Map decks

### Phase E: Interoperability Exports

Goal: reduce lock-in and make Xtoryteller easier to adopt.

Tasks:

- Add a static HTML export report format.
- Add `xtoryteller -> reveal.js` export for Stage decks using basic layouts first.
- Add a simple Map-to-spatial-HTML export after the Stage exporter is stable.
- Document unsupported primitives and downgraded features.

Exit criteria:

- exporter never mutates the source deck
- export report is visible in CLI output
- canonical Stage deck exports successfully with documented downgrades
- unsupported features are warnings, not silent failures

### Phase F: Importers And Plugin Packaging

Goal: grow the ecosystem surface only after the core model is stable.

Tasks:

- Add Markdown/reveal.js Markdown import into Stage YAML.
- Add basic Impress.js import into Map YAML.
- Design a package format for components, layouts, transitions, themes, backgrounds, validation hints, and skill docs.
- Keep imported decks marked as generated until reviewed.

Exit criteria:

- importers produce valid YAML
- imports are explicitly lossy
- packages can be validated before installation

## QA And Validation Requirements

Every upgrade should add checks at the right layer:

- schema tests for new YAML fields
- unit tests for parsing and navigation target resolution
- integration tests for renderer behavior
- Playwright coverage for presenter notes, overview navigation, and reduced-motion behavior
- export tests for downgrade reports
- validation tests for bad references and invalid state/effect names

Manual review remains required for:

- subtle build choreography
- Paper Shader background legibility
- spatial Map storytelling quality
- long-deck presenter workflow

## Risks

### Risk: Xtoryteller Becomes Too Much Like HTML Slides

Mitigation:

- Keep arbitrary HTML out of the primary YAML surface.
- Add import/export bridges, not HTML as source of truth.

### Risk: Build Effects Become A Fragile Animation DSL

Mitigation:

- Start with a small effect set.
- Validate effects.
- Respect reduced motion.

### Risk: Spatial Transform Fields Conflict With Anchors

Mitigation:

- Prefer relative anchors for agent-generated maps.
- Add transform only with strict precedence and editor support.

### Risk: Plugin Packaging Expands Too Early

Mitigation:

- Stabilize notes, state, overview, and exporters first.
- Package only existing primitive patterns after validation conventions are clear.

## Recommended Next Step

Start with first-class speaker notes.

Reason:

- It is high value for real presentations.
- It is easy to understand from reveal.js.
- It fits both Stage and Map modes.
- It does not threaten the YAML-first architecture.
- It creates the foundation for presenter view, PDF notes export, and richer build-level guidance.

## References

- reveal.js docs: https://revealjs.com/
- reveal.js Markdown docs: https://revealjs.com/markdown/
- reveal.js markup docs: https://revealjs.com/markup/
- Impress.js repository: https://github.com/impress/impress.js
- Impress.js documentation: https://raw.githubusercontent.com/impress/impress.js/refs/heads/master/DOCUMENTATION.md
- Impress.js getting started: https://raw.githubusercontent.com/impress/impress.js/refs/heads/master/GettingStarted.md
