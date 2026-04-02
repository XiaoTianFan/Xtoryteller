# Stage Authoring

Read this file when the user needs a sequential Xtoryteller presentation or wants to edit an existing Stage deck.

## When Stage Mode Fits

Choose Stage mode when the story is speaker-led, linear, or slide-like.

Good fits:
- talks
- walkthroughs
- reports
- pitch narratives
- section-by-section explainers

## Before Writing YAML

1. Read the registries:
   - `skills/xtoryteller/references/registries/component-registry.json`
   - `skills/xtoryteller/references/registries/layout-registry.json`
   - `skills/xtoryteller/references/registries/transition-registry.json`
   - `skills/xtoryteller/references/registries/theme-registry.json`
   - `skills/xtoryteller/references/registries/background-registry.json`
2. Read the schema:
   - `skills/xtoryteller/references/schema/schema.yaml`
3. Read [yaml-conventions.md](yaml-conventions.md) if you are restructuring dense YAML.
4. Pick the nearest example from [example-selection.md](example-selection.md).

## Authoring Pattern

- Outline the beats first.
- For long decks, outline the chapters too, not just the slides. Add section-reset steps so the audience can feel where the story is turning.
- Assign one layout per beat based on density and content shape.
- Prefer a live preset-family direction before polishing edge cases. Distinctive decks usually begin with a strong theme-plus-layout motif, not last-minute color edits.
- Use build sequencing for lists or progressive reveals.
- Keep transitions consistent across most steps.
- Add a short orientation subtitle or description to each step when the deck is dense or research-heavy. The title should name the slide; the subtitle should explain why the slide exists.
- Put local assets in `presentations/<slug>/assets/`.
- Re-check viewport fit after edits at `1280x720` and `1920x1080`; Stage steps must stay fixed to the viewport with no page-height growth.

## High-Value Layout Heuristics

- `title-center`: opening or section reset
- `single-content`: one dominant idea or diagram
- `two-column`: comparison or text-plus-supporting visual
- `content-left-media-right`: explanation plus visual evidence
- `grid-2x2` / `grid-3x2`: compact cards or stats only
- `gallery`: mixed compact cards are fine, but keep card density balanced inside each row
- `timeline-layout`: timeline items should be similarly dense; split outliers into a separate step
- `pyramid-layout`: 3-5 compact rows only, each row with a short title and short supporting line
- `stack`: simple vertical rhythm for closing or emphasis

## Content Rules

- Split instead of cram.
- Split instead of cram, especially when a step tries to combine a strong motif, long copy, and dense supporting detail.
- Keep list-heavy steps readable; use `build: sequential` when appropriate.
- If you want list items or numbered points to reveal one-by-one, explicitly add `build: sequential`.
- Do not default to `build: sequential` on research decks. If the slide is meant to be scanned, compared, or revisited while speaking, render the list all at once.
- Keep `stat-card.value` short. Use it for compact metrics like `38`, `4 demos`, or `Automatic`, not long phrases.
- Prefer `feature-card`, `card`, or `callout` when the primary message is explanatory text rather than a metric.
- Keep diagram labels concise, especially in `org-chart` and `sankey-diagram`.
- Prefer built-in diagrams over forcing relationships into bullets.
- Prefer `themeOverrides` for broad style shifts instead of repeated inline styles.
- Prefer named preset families or reusable themes over vague palette nudges when the deck should feel intentionally designed.
- Avoid generic styling patterns: repeated interchangeable card grids, default font stacks, or timid accent usage that does not reinforce the story mood.
- Long-form Stage decks need structural breathing room. Use section-title slides, title resets, and occasional motif changes so thirty-step decks do not read like one continuous document dump.
- If the same visual failure appears on multiple slides, such as washed-out callouts or weak contrast, treat it as an infrastructure problem first. Fix the component or theme path before adding one-off slide styles.
- Read [annotations.md](annotations.md) when the copy depends on hover annotations inside markdown-rendered content.
- Read [current-runtime-limitations.md](current-runtime-limitations.md) and [runtime-support-matrix.md](runtime-support-matrix.md) before depending on advanced annotation or animation semantics.

## Polishing Takeaways

- Structural polish is not optional on research decks. Once a presentation becomes long, section-title slides and step-level orientation copy become part of comprehension, not decoration.
- Browser review catches issues the validator will not: weak contrast, under-structured flow, and missing navigation affordances all showed up during presentation polishing rather than schema validation.
- Bottom-of-screen progress is valuable, but on long decks it should help navigation too. Prefer interactive progress affordances over passive indicators when the runtime supports direct jumps.

## Deterministic Helpers

- Scaffold a new Stage deck:
  `node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple`
- Generate style previews:
  `node skills/xtoryteller/scripts/create-style-previews.mjs --mood confident --topic "My Talk" --force`

## Validation

- Validate one deck:
  `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
- Validate the repo after shared changes:
  `node scripts/validate-all.mjs`

## Example Files

- `skills/xtoryteller/references/examples/simple-stage.yaml`
- `skills/xtoryteller/references/examples/complex-stage.yaml`
