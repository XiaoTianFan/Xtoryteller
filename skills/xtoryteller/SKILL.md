---
name: xtoryteller
description: Create, edit, validate, test, and package Xtoryteller presentations and runtime features. Use when the task involves Stage-mode or Map-mode authoring in this repo, default presentation-storytelling preparation for new presentation generation, optional strategy-consulting deck structure, markdown annotation authoring, theme/background/transition work, dashboard or viewer runtime changes, choosing or refining layouts/components/themes/transitions, creating style previews, scaffolding Xtoryteller primitives, or running portability workflows for export/import/promotion.
---

# Xtoryteller

Use this skill for work inside the Xtoryteller presentation system, not for one-off HTML slide generation.

Follow the phases in order unless the task is trivially local (for example, a one-line YAML fix with no ambiguity).

## Execution flow (phases)

### Phase 0: Detect task type

- **New presentation from scratch** → Phase 1 (co-design intake + [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md) by default unless the user explicitly asks to skip storytelling prep).
- **Editing or enhancing an existing presentation** → Phase 2 (the existing YAML is the source of truth; skip co-design).
- **Story rewrite / speaker-led deck / material-to-presentation task** → read [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md) before writing YAML unless explicitly skipped.
- **Strategy / market / consulting-style research deck** → run [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md), then read [strategy-consulting-mode.md](references/guides/strategy-consulting-mode.md) before writing YAML.
- **Annotations, themes, backgrounds, transitions, runtime, primitives, portability** → Phase 2.

### Phase 1: Co-design intake (new presentations only)

Before touching YAML, co-design the presentation with the user. Read [guides/co-design-intake.md](references/guides/co-design-intake.md) and follow the full intake flow. For new presentation generation, also read [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md) and complete storytelling preparation unless the user explicitly asked to skip it. The intake covers mode, purpose, length/size, content readiness, media and logo assets, style path, content density, and animation tempo; storytelling preparation adds speaking context, scenario routing, material understanding, story spine, and narrative quality checks. On completion you will have a confirmed slug, story/structure outline, and style direction — then continue to Phase 2.

### Phase 2: Classify and load context

**Route to the matching guide(s) first:**

| Task | Read |
| --- | --- |
| Stage deck (new or edited) | [stage-authoring.md](references/guides/stage-authoring.md), [example-selection.md](references/guides/example-selection.md) |
| Map presentation (new or edited) | [map-authoring.md](references/guides/map-authoring.md), [example-selection.md](references/guides/example-selection.md) |
| New presentation / speaker-led story / material-to-deck task | [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md), then the Stage or Map authoring guide |
| Strategy / market / consulting-style research deck | [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md), [strategy-consulting-mode.md](references/guides/strategy-consulting-mode.md), [stage-authoring.md](references/guides/stage-authoring.md), [example-selection.md](references/guides/example-selection.md) |
| Themes / `themeOverrides` / backgrounds / transitions | [theme-authoring.md](references/guides/theme-authoring.md), [backgrounds-transitions.md](references/guides/backgrounds-transitions.md) |
| Markdown annotations | [annotations.md](references/guides/annotations.md) |
| New component / layout / reusable theme | [primitive-extension.md](references/guides/primitive-extension.md), [component-authoring.md](references/guides/component-authoring.md) |
| Export / import / promotion | [portability.md](references/guides/portability.md) |
| Dashboard / viewer / renderer / runtime | [architecture-overview.md](references/guides/architecture-overview.md), [runtime-support-matrix.md](references/guides/runtime-support-matrix.md), [qa-workflows.md](references/guides/qa-workflows.md) |
| YAML issues / errors / recovery | [yaml-conventions.md](references/guides/yaml-conventions.md), [anti-patterns.md](references/guides/anti-patterns.md), [troubleshooting.md](references/guides/troubleshooting.md) |

**Load before writing or restructuring YAML:**

1. Registries: [component](references/registries/component-registry.json), [layout](references/registries/layout-registry.json), [transition](references/registries/transition-registry.json), [theme](references/registries/theme-registry.json), [background](references/registries/background-registry.json).
2. Schema: [schema guide](references/schema/schema.yaml) and [JSON schema](references/schema/schema.json).
3. For a fast task-to-file-to-command reference: [quick-route-matrix.md](references/guides/quick-route-matrix.md).

**Skill package metadata** (versioning, registry freshness): [skill-manifest.json](skill-manifest.json).

### Phase 3: Options and style (when art direction is still unclear)

If the user has not committed to art direction after Phase 1 or needs to compare directions visually, read [guides/style-discovery.md](references/guides/style-discovery.md): generate three distinct previews, then get an explicit choice (including a "mix" branch) before touching the real deck.

### Phase 4: Implement

- Keep work YAML-first under `presentations/<slug>/presentation.yaml`.
- Prefer built-in primitives and theme tokens before inventing new code.
- Prefer shared background presets via `presetRef` from the background registry before inventing a new reusable Paper Shader look.
- When a Paper Shader background needs extra text legibility, prefer the built-in `background.filter` overlay before replacing the preset or flattening the background to CSS.
- **Stage pitch / vision default (Paper Shader themes):** when the deck locks to a named `theme` that uses a Paper Shader `presetRef`, also set presentation-level `background` with the **same** `presetRef` and a **`filter` using `mode: linear-vertical-reverse`** so a vertical dark-gradient veil improves center readability (typical tuning: `opacity` ~0.64–0.72, `linearProportion` ~0.65–0.76). Canonical YAML: `presentations/human-ai-music-insight-brief/presentation.yaml`. Skip only if the brief explicitly wants a flat theme background or a different filter recipe.
- Omit `theme` when the presentation should inherit the dashboard-selected global theme. Add `theme: <slug>` only when the deck must lock to a reusable theme.
- Let the theme own the default background when possible. Add presentation-level `background` only for overrides that should not follow theme switching—**except** follow the Stage pitch / vision default above when generating dense speaker-led decks.
- Treat the shipped demos as canonical references: `simple-stage`, `simple-map`, `complex-stage`, `complex-map`.
- For long Stage decks, treat structure as a first-class task: section resets, legible step purpose, usable navigation at scale.
- For new presentation generation, use [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md) to capture speaking context, route the scenario, understand materials, create a story spine, and score narrative completeness before composing YAML unless the user explicitly skipped this prep.
- For strategy or research decks, use [strategy-consulting-mode.md](references/guides/strategy-consulting-mode.md) to define the decision frame, issue tree, hypotheses, argument plan, and page dependency plan before composing YAML.

See **Theme-System Route** and **Working Rules** below for styling constraints and guardrails.

### Phase 5: Verify and handoff

1. Run validation: `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
2. After substantive YAML or layout-geometry edits, refresh the dashboard card preview by capturing the viewer (dev server must be reachable at the script base URL, default `http://127.0.0.1:3000`): `npm run thumbnail -- --slug <slug> [--base-url http://127.0.0.1:3000]`. In local dev, saving map/stage layout can trigger the same capture automatically.
3. After shared manifests, themes, or background presets changed: `node scripts/validate-all.mjs`
4. When behavior (not just content) changed, run the appropriate layer from [qa-workflows.md](references/guides/qa-workflows.md).
5. For Stage mode, manually verify viewport fit at `1280×720` and `1920×1080`. The page height must stay locked; no vertical growth or rescue scrolling.

### Phase 6: Deploy (optional)

After verification, offer to deploy the Xtoryteller app — including the new or updated presentation — to a live Vercel URL. Read [guides/deploy-to-vercel.md](references/guides/deploy-to-vercel.md) and follow the detection → deploy flow.

---

## Quick Route

- New presentation → Phase 1 ([co-design-intake.md](references/guides/co-design-intake.md) + [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md) by default unless explicitly skipped).
- Story rewrite / material-to-presentation / speaker-led deck → [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md).
- Existing Stage deck → [stage-authoring.md](references/guides/stage-authoring.md).
- Existing Map presentation → [map-authoring.md](references/guides/map-authoring.md).
- Strategy / market / consulting-style deck → [presentation-storytelling-mode.md](references/guides/presentation-storytelling-mode.md), then [strategy-consulting-mode.md](references/guides/strategy-consulting-mode.md), then [stage-authoring.md](references/guides/stage-authoring.md).
- Annotations → [annotations.md](references/guides/annotations.md).
- Themes / backgrounds / transitions → [theme-authoring.md](references/guides/theme-authoring.md), [backgrounds-transitions.md](references/guides/backgrounds-transitions.md).
- New component / layout → [primitive-extension.md](references/guides/primitive-extension.md).
- Export / import / promote → [portability.md](references/guides/portability.md).
- Runtime / viewer / dashboard → [architecture-overview.md](references/guides/architecture-overview.md), [qa-workflows.md](references/guides/qa-workflows.md).
- Visual option generation → [style-discovery.md](references/guides/style-discovery.md).
- Preset families → [preset-families.md](references/guides/preset-families.md).
- Task-to-file-to-command matrix → [quick-route-matrix.md](references/guides/quick-route-matrix.md).
- Coverage / eval checks → [evals/coverage-prompts.md](evals/coverage-prompts.md).
- Deploy to Vercel → [deploy-to-vercel.md](references/guides/deploy-to-vercel.md).

---

## Theme-System Route

Use this decision rule whenever a task touches styling:

- no `theme`: inherit the dashboard-selected global theme, best for canonical demos and presentations that should follow the operator's active shell choice.
- `themeOverrides`: one-off presentation-local visual changes.
- `themes/<slug>.yaml`: reusable visual language that should persist across presentations.
- component/layout CSS: only for structural mechanics, rendering math, breakpoints, viewport rules, or algorithmic placement that should not become part of the reusable theme surface.

Prefer the semantic token families before adding literals:

- `spacing.chrome.*` for dashboard/viewer shell spacing.
- `spacing.components.*` for reusable component patterns such as cards, lists, callouts, timelines, annotations, code blocks, and media shells.
- `spacing.layouts.*` for reusable layout presentation values like compact padding, divider spacing, and timeline offsets.
- `sizing.components.*` and `sizing.layouts.*` for reusable widths, heights, avatar/icon sizes, tooltip shells, marker sizes, and repeated min/max widths.
- `typography.components.*` for component-specific scales such as hero copy, stat values, and diagram labels.
- `motion.components.*` only for component-specific offsets or delays not already covered by global motion groups.
- matching semantic `radii.*`, `shadows.*`, and `borders.*` groups when shape, elevation, or stroke treatment is part of the visual language.

When refactoring visual styles:

1. Update the shipped themes first.
2. Update validation expectations if a new semantic family becomes required.
3. Replace hardcoded CSS values with semantic token references.
4. Add or update regression tests for the affected shell/component/layout surface.
5. Run the relevant validation and QA layers from [guides/qa-workflows.md](references/guides/qa-workflows.md).

---

## Helper Scripts

Use these when repeated scaffolding would otherwise become manual and fragile.

- `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple` — omits `theme` so the deck inherits the dashboard global theme; pass `--theme <slug>` only when locking to a named theme.
- `node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve`
- `node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split`
- `node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force`
- `node skills/xtoryteller/scripts/print-preview-urls.mjs` — prints dev-server viewer URLs for the default preview slugs after style previews are generated.
- `npm run presentation:pdf -- --slug <slug>` — exports `exports/<slug>.pdf` through the dedicated DOM/SVG/text PDF print route; not a screenshot capture, not a semantic PowerPoint object model.

---

## Working Rules

- Never treat Xtoryteller as a generic HTML deck generator when the runtime primitives can express the result.
- Never hardcode a presentation `theme` or `background` in a canonical demo unless the point of that demo is specifically to prove local overrides.
- For non-canonical, speaker-led Stage decks on Paper Shader themes, prefer the **insight-brief vertical gradient veil** (`background.filter.mode: linear-vertical-reverse` on the theme’s `presetRef`) as the default legibility move—see Phase 4 “Stage pitch / vision default.”
- Never cram content into a layout; split steps or clusters instead.
- Never rely on page growth, overflow, or scrolling to save a crowded Stage step.
- Never solve repeated visual drift with scattered hardcoded CSS values when the design belongs in the theme token system.
- Never use `preset` when you mean the shared Xtoryteller background preset name; use `presetRef` for the shared preset and keep `preset` for the upstream Paper Shader preset.
- Never add `background.filter` to CSS or `none` backgrounds; it is only for Paper Shader surfaces and preset-backed Paper Shader backgrounds.
- Never replace a reusable preset just to solve central text legibility until you have considered a theme- or presentation-level `background.filter` overlay first.
- Use the non-reverse filter modes when the center should stay clearer and the reverse modes when the center should be more covered than the edges.
- Never add wrapper-driven Paper Shader motion where the upstream shader already supports built-in animation through `speed` or `frame`.
- Never turn intrinsic layout mechanics like `100vh`, `100%`, SVG geometry, or arrangement outputs into theme tokens unless they are clearly intended as reusable visual language.
- Never settle for generic "AI default" styling when the task clearly needs character. Prefer a named preset family, a deliberate type pairing, and a repeated layout motif.
- Keep `stat-card` values short and metric-like. If the value reads like a sentence fragment, use `card`, `feature-card`, or `callout` instead.
- Split instead of cram, especially when a step is trying to carry both a strong motif and dense explanatory copy.
- When a contrast or surface problem repeats across multiple steps, fix the shared component or theme token path instead of patching each slide with local overrides.
- Do not skip storytelling preparation for new presentation generation unless the user explicitly asks for a fast scaffold or says to skip it.
- Long research decks need visible chaptering. Add section title steps and orientation copy before the deck starts to feel like an unbroken wall of content.
- Consulting-style decks need argument titles, visible evidence, and a recommendation path. Use the optional strategy-consulting mode instead of only making the deck look more corporate.
- Prefer preset-family language such as `bold-signal`, `notebook-tabs`, or `paper-and-ink` over vague requests like "make it nicer" or "slightly more modern."
- Use `build: sequential` on bullet or numbered lists when the story expects one item per advance.
- Do not use `build: sequential` just because a list is long. If the audience needs fast scanning or reference-style reading, reveal the list all at once.
- Keep `pyramid-layout` rows compact: one short label plus one short sentence, not list-heavy cards.
- Keep `org-chart` and `sankey-diagram` labels concise. Split dense structures instead of forcing long labels into one step.
- Keep `meta.slug` aligned with the presentation folder.
- Keep asset references relative to the presentation directory, usually under `assets/`.
- Treat markdown hover annotations as supported only within the current markdown annotation model.
- Stay honest about partial features and verify advanced behavior manually when needed.
