# Strategy Consulting Mode

Read this guide when a presentation should behave like a hypothesis-led strategy, market, competitive, growth, investment, or executive research deck.

This is an optional content-strategy mode for Xtoryteller Stage decks. It strengthens the storyline before YAML authoring; it does not replace the component/layout/theme workflow.

## When To Use

Use this mode when the user asks for:

- a consulting-style, board-style, investor, market, strategy, competitive, or growth analysis deck
- an issue tree, hypothesis tree, executive narrative, research report, business case, or recommendation deck
- a "McKinsey-style" structure, as long as the output still uses Xtoryteller primitives rather than generating PPT or standalone HTML
- a topic-only business question that needs structured research before visual composition

Skip this mode for artistic portfolios, tutorials, demos, personal stories, exploratory Map presentations, and short decks where the user already supplied a stable outline.

If the fit is ambiguous, ask one question: "Should I structure this as a hypothesis-led strategy deck, or keep the normal presentation workflow?"

## Workflow

### 1. Define The Decision

Before outlining slides, capture the business question in a compact scope block:

```markdown
## Decision Frame
- Audience:
- Decision or question:
- In scope:
- Out of scope:
- Time horizon:
- Required output:
- Data standard: reported / estimated / directional
```

Keep this short. The goal is to prevent the deck from becoming a general research dump.

### 2. Build The Issue Tree

Create a 2-3 level issue tree that is MECE enough for the task. Prefer 3-5 top-level branches. Do not overfit the tree before evidence exists.

Useful branch patterns:

- Market opportunity: market size, growth, segments, competition, customer demand, economics, risks
- Growth diagnosis: where growth changed, who changed, why it changed, what constrains it
- Competitive analysis: category structure, player positions, differentiation, economics, likely moves
- Entry strategy: attractiveness, right-to-win, entry options, investment required, risk controls
- Operating problem: symptom, driver decomposition, root causes, intervention options, metrics

Ask for user confirmation only when the tree would materially change the deck's direction.

### 3. Form Hypotheses

Turn the issue tree into 3-5 testable hypotheses. Each hypothesis should name:

- the claim
- the evidence needed to prove or disprove it
- the likely visual proof pattern
- the dependency on external research, existing user material, or another step in the deck

Use current web research when facts may have changed, when market or company data matters, or when the user asks for up-to-date information. Record source URLs and uncertainty.

### 4. Design The Argument Plan

Convert hypotheses into a page plan before writing YAML. Each planned step should have an argument title, not a topic label.

Good title:

```markdown
Usage is shifting to paid team workflows, making retention more important than top-of-funnel volume
```

Weak title:

```markdown
Usage trends
```

For each planned step, choose the nearest Xtoryteller layout and component pattern:

| Proof Pattern | Prefer |
| --- | --- |
| One trend or single data story | `single-content`, `content-left-media-right`, `coordinate-plot`, `stat-card` |
| Side-by-side comparison | `two-column`, `comparison-layout`, `comparison-card`, `radar-chart` |
| Market or competitor positioning | `single-content`, `quadrant-chart`, `coordinate-plot` |
| Process, funnel, or causal chain | `flowchart`, `causal-diagram`, `cycle-diagram` |
| Driver decomposition | `sankey-diagram`, `pyramid-layout`, `feature-card` |
| Timeline or evolution | `timeline-layout`, `timeline`, `timeline-item` |
| Chapter or finding summary | `section-header`, `grid-2x2`, `callout`, `feature-card` |

If the ideal proof needs a primitive the registry lacks, either adapt to the closest existing component or follow [primitive-extension.md](primitive-extension.md).

### 5. Track Page Dependencies

For long research decks, create a private planning checklist before YAML:

```markdown
## Step Dependency Plan
- Step 1: Cover - independent
- Step 2: Executive summary - generate last; depends on findings
- Step 3: Market growth trend - independent; needs external data
- Step 4: Segment comparison - depends on Step 3 denominator
- Step 8: Recommendation - generate after evidence steps
```

Use the dependency plan to decide build order. Do not encode dependency metadata into `presentation.yaml` unless the schema supports it. Instead, express the dependency in the order, title, content, or a visible "source / basis" note when useful.

### 6. Compose In Xtoryteller

After the argument plan is stable:

1. Continue through normal SKILL Phase 2: read Stage authoring, example selection, registries, and schema.
2. Use `swiss-modern`, `bold-signal`, `electric-studio`, or `notebook-tabs` as strong starting preset families for executive decks, unless the user chose another direction.
3. Keep density high enough for executive substance, but split any step that needs more than one primary claim.
4. Prefer evidence-bearing components over decorative cards.
5. Use `build: sequential` only when the speaker should reveal a reasoning chain one step at a time.

## Quality Checks

Before handoff, verify:

- Every major section answers part of the decision frame.
- Each evidence step has an argument title.
- The executive summary and recommendation steps are consistent with the evidence steps.
- Data claims cite sources in content, footnotes, or visible source notes when appropriate.
- No slide is doing two jobs: prove the claim, summarize the chapter, and recommend action should usually be separate steps.
- Validation passes with `node scripts/validate.mjs presentations/<slug>/presentation.yaml`.

## Anti-Patterns

- Do not copy a consulting skill's PPT-specific design specs into Xtoryteller as fixed inches, PowerPoint shapes, or hardcoded colors.
- Do not force a high-density consulting style onto every deck. This mode is optional.
- Do not make the issue tree visible in the final deck unless it helps the audience.
- Do not create a long research deck without chapter resets and orientation copy.
- Do not use "consulting style" as permission to cram text. Split dense logic into more steps.
