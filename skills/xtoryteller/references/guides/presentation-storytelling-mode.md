# Presentation Storytelling Mode

Read this guide by default before generating a new Xtoryteller presentation, unless the user explicitly asks to skip storytelling preparation or the task is a tiny mechanical scaffold.

This mode turns raw intent, notes, source material, or an old deck into a story plan before YAML composition. It is a preparation layer, not a replacement for Stage/Map authoring, registries, schema, validation, or style discovery.

## When To Use

Use this mode for:

- new presentation generation
- speaker-led Stage decks, talks, keynotes, pitches, internal briefings, demos, tutorials, portfolio narratives, and executive updates
- requests like "make this a story", "help me plan the presentation", "turn these materials into a talk", "rewrite this deck in my voice", "what should each slide say", or "fix only these pages"
- rough notes, old decks, documents, links, PDFs, or scattered material that need narrative structure

Skip it only when:

- the user explicitly says to skip narrative/storytelling prep
- the task is a tiny local edit, validation run, export/import, runtime change, primitive change, or pure theme/background tweak
- the user asks for a non-narrative Map reference hub and already supplied the cluster structure

If the user wants a strategy, market, recommendation, or consulting-style deck, run this storytelling prep first and then read [strategy-consulting-mode.md](strategy-consulting-mode.md) for decision framing, issue trees, hypotheses, and evidence planning.

## Core Model

Use four layers, but activate them conditionally:

- **L1A Universal storytelling**: always active. Use audience-first structure, SCQA, STAR, pyramid logic, hero journey, opening hook, clear action close, and honest boundaries.
- **L1B New-technology landing**: activate for AI, automation, cloud, blockchain, IoT, robotics, data platforms, or similar adoption talks. Diagnose the audience's maturity and explain value through specific scenarios, not abstract technical capability.
- **L2 Domain research**: activate when industry, market, customer, or domain context matters. Use current web research when facts may have changed or when the user asks for current information. Search for industry context, audience pain, decision criteria, terminology, and relevant examples.
- **L3 Personalization**: activate when speaker voice or delivery style matters. Tune narrative style, language style, density, emotional intensity, and audience interaction.

Keep the guide's output concise. Do not paste a full hidden planning essay into the final YAML.

## Step 0: Capture Speaking Context

Before designing the story, extract or ask for the minimum viable context:

```markdown
## Speaking Context
- Occasion:
- Audience:
- Purpose:
- Duration:
- Speaker identity:
- Desired action or feeling:
```

Required for a speaker-led deck:

- **Occasion**: where this will be presented
- **Audience**: who will hear it and roughly how many / what role
- **Purpose**: persuade, inform, teach, inspire, get approval, sell, align, or explore

Duration can default to `30 minutes` if missing, but state that assumption. Speaker identity is optional but useful for voice.

Do not stall for perfection. If only one field is missing and a reasonable assumption is safe, note the assumption and keep moving.

## Step 1: Route The Scenario

Pick one scenario before planning:

| Scenario | Trigger | Action |
| --- | --- | --- |
| **A - Material transformation** | scattered notes, docs, PDFs, links, or several sources | understand each source first, then synthesize |
| **B - From scratch** | topic or goal only | build a story from constraints and audience need |
| **C - Polish without story rewrite** | "keep content, improve expression/design" | keep narrative stable; route to Stage/style work as needed |
| **D - Renovation** | old deck or someone else's presentation | recover the old story, then recast it in the speaker's voice |
| **E - Local rewrite** | "only change these slides/pages/steps" | inspect neighboring context and rewrite only the target steps |

Use Skip / Reduce / Adapt controls:

- **Skip**: if the user already has a narrative outline, jump to the story spine. If they already have a story spine, jump to quality scoring and YAML composition.
- **Reduce**: if the user says "quick", "simple", or "short version", use L1A only unless technical/domain context is essential.
- **Adapt**: if the user specifies industry, page count, duration, style, target audience, or exact pages to change, honor those constraints in the story spine.

## Step 2: Understand Materials For A/D

For material transformation or renovation, understand the material before deciding what to use. Do not filter through the event context too early.

Use this compact report:

```markdown
## Material Understanding Report

### Source: <name>
- Topic:
- Core claims:
- Key evidence, data, examples:
- Unique value:
- Gaps or stale information:

### Cross-source synthesis
- Complementary points:
- Overlaps:
- Tensions or contradictions:
- Possible story directions:
- Information gaps:
```

Pause for user correction only when the interpretation may change the narrative direction.

For old-deck renovation, also identify:

- original story arc
- what feels transferable
- what feels misaligned with the new speaker, audience, or purpose
- which claims need updated evidence

## Step 3: Choose Story Shape

Choose one primary narrative structure:

- **SCQA**: situation, complication, question, answer. Best for persuasion, strategy, and executive updates.
- **STAR**: situation, task, action, result. Best for case studies, retrospectives, and project reports.
- **Pyramid logic**: answer first, then supports. Best for busy leadership and decision decks.
- **Hero journey**: call, trial, transformation, return. Best for inspirational talks and personal narratives.
- **Demo-driven arc**: context, promise, proof, live or visual demonstration, implications. Best for product and technology demos.
- **Conflict arc**: expose a tension or misconception, then resolve it. Best for changing minds.

Then define:

```markdown
## Narrative Outline
- Core message:
- Opening hook:
- Main chapters:
- Turning point or key reveal:
- Closing action:
- What to delete:
```

Use the Story Challenge questions:

1. Who is the audience and what do they care about?
2. Can the core message fit in one sentence?
3. Does the first 30 seconds create attention?
4. Can the audience follow the logic?
5. Does the close tell them what to do, believe, or remember?
6. What can be deleted?

## Step 4: Budget Time And Steps

For Stage decks, map duration to a step budget. Treat this as a starting point, not a hard rule.

| Duration | Stage Steps | Rhythm |
| --- | --- | --- |
| 10 min | 8-12 | fast, one idea per step |
| 15 min | 12-18 | standard talk |
| 20 min | 18-25 | paced explainer |
| 30 min | 25-35 | deeper keynote or briefing |
| 45 min | 35-50 | long-form with interaction or Q&A |

Typical timing:

- hook: 30-45s
- data shock or reveal: 30-45s
- core insight: 60-90s
- scenario or case: 60-90s
- transition: 15-20s
- action close: 30-45s

When compressing, cut in this order:

1. decorative transitions
2. secondary examples
3. repeated evidence
4. one of several scenarios

Do not cut the opening hook, core message, proof of the central claim, or closing action.

For Map presentations, translate this into cluster roles and an optional guided path instead of slide timing.

## Step 5: Write The Story Spine

Before YAML, create a concise story spine:

```markdown
# Story Spine - <title>

> Duration: <minutes> | Target steps: <count> | Structure: <SCQA/STAR/etc.>

## Chapter 1 - <name> (<minutes>)
### Step 1 - Hook - 30s
<one-sentence key message>

### Step 2 - Data shock - 45s
<one-sentence key message>

## Chapter 2 - <name> (<minutes>)
### Step N - Scenario deepening - 75s
<one-sentence key message>

## Closing
### Step N - Action close - 45s
<one-sentence key message>
```

Each step's sentence must be a key message, not a topic label or speaker aside.

Good:

```markdown
In the first month, the pilot should prove repeatable time savings in one workflow rather than promise full automation.
```

Weak:

```markdown
Pilot plan
```

Use page roles deliberately:

- hook
- data shock
- core promise
- context reset
- problem diagnosis
- paradox
- reversal
- analogy
- architecture view
- product definition
- scenario opening
- scenario deepening
- scenario summary
- evidence proof
- honest boundary
- capability comparison
- trust building
- recommendation
- core restatement
- action close
- transition

## Step 6: Local Rewrite For E

When the user wants only a few steps changed:

1. Identify target steps and why they need work.
2. Read the preceding and following step context.
3. Preserve the global story unless the requested change contradicts it.
4. Rewrite only target steps.
5. Check the new steps still bridge cleanly to neighbors.

Use this output:

```markdown
## Local Story Rewrite
- Target steps:
- Neighboring context:
- New key message per target step:
- Transition notes:
- Risk to global story:
```

If the local change would alter the core message, ask whether to escalate to a full story rewrite.

## Step 7: Story Completeness Score

Before final YAML or before handoff, score the story plan quickly:

| Dimension | Check |
| --- | --- |
| Narrative completeness | clear beginning, development, turn, close |
| Audience relevance | speaks to the audience's real concern |
| Core message | one-sentence claim is memorable |
| Opening hook | first 30 seconds create attention |
| Logic flow | each step leads to the next |
| Scenario value | concrete situations, not generic feature lists |
| Honest boundary | uncertainty and limits are not hidden |
| Style fit | tone matches speaker, audience, and occasion |
| Information density | enough substance without cramming |
| Close | asks the audience to do, believe, or remember something |

If any major dimension is weak, fix the story spine before composing YAML.

For new-technology talks, also check:

- audience maturity: concept, pilot, or scale-up
- whether the deck corrects "magic automation" expectations
- whether the deck explains why scenarios create value
- whether it avoids "our technology is strongest" claims without proof
- whether it names what still needs humans in the loop

## Step 8: Compose In Xtoryteller

After the story spine is stable:

1. Continue through [stage-authoring.md](stage-authoring.md) or [map-authoring.md](map-authoring.md).
2. Load registries and schema before writing YAML.
3. Map step roles to layouts and components:

| Story Role | Good Xtoryteller Fits |
| --- | --- |
| Hook / core promise | `title-center`, `section-header`, `callout` |
| Data shock | `stat-card`, `coordinate-plot`, `quadrant-chart`, `callout` |
| Problem diagnosis | `two-column`, `flowchart`, `causal-diagram`, `feature-card` |
| Scenario deepening | `content-left-media-right`, `stack`, `card`, `image` |
| Architecture view | `flowchart`, `org-chart`, `single-content` |
| Comparison / boundary | `comparison-layout`, `comparison-card`, `radar-chart` |
| Recommendation / action close | `section-header`, `grid-2x2`, `callout`, `feature-card` |

Keep `build: sequential` for reveals where the speaker should control the reasoning beat. Do not use it for reference-style slides that should be scanned.

## Anti-Patterns

- Do not write YAML before the narrative spine exists, unless the user explicitly skipped storytelling prep.
- Do not confuse a topic label with a key message.
- Do not turn every deck into a strategy deck; storytelling mode is broader than consulting mode.
- Do not force the old skill's "planner -> scriptwriter -> designer" handoff language into Xtoryteller. Xtoryteller composes the deck directly.
- Do not ask a long questionnaire if the context can be inferred safely.
- Do not overfit to famous speaker templates. Use Jobs-style reveal, demo-driven arcs, or conflict arcs only when they serve the user's audience.
- Do not hide uncertainty, technical limits, or human-in-the-loop requirements.
- Do not use storytelling prep as an excuse to delay implementation once the story spine is clear.
