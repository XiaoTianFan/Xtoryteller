# Co-design intake

Read this guide when creating a new Xtoryteller presentation from scratch (SKILL Phase 1). Its purpose is to gather enough information to produce a well-structured, correctly-styled YAML on the first real attempt — rather than revising blind drafts.

Batch questions to minimize back-and-forth. Complete all steps before writing any YAML.

For new presentation generation, storytelling preparation is the default. Read [presentation-storytelling-mode.md](presentation-storytelling-mode.md) during this intake unless the user explicitly asks to skip narrative/storytelling prep. Treat the story spine as the content structure that Step 4 confirms.

---

## Step 0: Mode

Use the AskQuestion tool with a single question:

**"What kind of presentation do you want to build?"**

| Option | When to pick |
| --- | --- |
| **Stage** — linear, sequential deck | Conference talk, pitch deck, tutorial, internal briefing |
| **Map** — spatial canvas with clusters | Topic exploration, reference hub, concept web, non-linear story |

Store the answer as `mode` for all subsequent steps.

---

## Step 1: Batch intake

Immediately after mode is known, use **one AskQuestion call** covering all of the following. Include an "Other / tell me…" option wherever a freeform answer is useful:

### 1a — Purpose

**"What is this presentation for?"**

- Pitch deck / investor update
- Conference or public talk
- Internal team / stakeholder briefing
- Teaching or tutorial
- Research or reference
- Personal / portfolio
- Other (describe)

### 1b — Length or size

**Stage:** "How many steps (slides) are you targeting?"

- Short — 5–10
- Medium — 10–20
- Long — 20+
- Not sure yet

**Map:** "How many clusters (topic nodes) are you expecting?"

- Small — 3–5
- Medium — 5–10
- Large — 10+
- Not sure yet

### 1c — Content readiness

**"How ready is your content?"**

- All content ready — I can paste or attach it now
- Rough notes — I have bullet points, an outline, or a document draft
- Topic only — I know the subject but need help structuring it

If the answer is "All content ready" or "Rough notes", ask the user to share or paste the material in the next message before moving on.

### 1d — Inline editing in browser

**"Do you need to edit text directly in the browser after generation?"**

- Yes (recommended) — inline editing via dev mode
- No — view only

Store this preference. The Xtoryteller dev mode supports live YAML hot-reload; the presentation.yaml is the source of truth. Inline browser editing is not applicable here (unlike standalone HTML decks), so inform the user if they select Yes: the dev server hot-reloads from the YAML file, which they can edit in any editor.

### 1e — Storytelling preparation

Unless the user explicitly said to skip storytelling prep, follow [presentation-storytelling-mode.md](presentation-storytelling-mode.md) after the core intake is known. Capture or infer:

- occasion
- audience
- purpose
- duration
- speaker identity, if relevant
- scenario route: A material transformation, B from scratch, C polish, D renovation, or E local rewrite

If the user provided material, run the material understanding step before outlining. If the user has only a topic, build the story shape directly. If the user already supplied a narrative outline or story spine, use Skip mode and continue from the next useful step.

---

## Step 1.2: Media and assets

Ask (use AskQuestion tool):

**"Do you have images, logos, or other media for this presentation?"**

- No media — the presentation will use CSS/shader visual treatments
- Yes — I have files I can point you to
- Yes — I'll drop them into the assets folder myself

**If files exist:**

1. Ask the user to provide the file path(s) or drop them into `presentations/<slug>/assets/`. If the slug is not yet decided, prompt them to pick one now: `presentations/my-talk/assets/`.
2. Copy any referenced files there using the Read tool (for text-based assets) or ask the user to copy binary files (images, SVG, video) manually if the agent cannot access the source path.
3. List what was found: file name, type, and a brief note on what it could represent.

**Logo detection (Step 1.3):**

Scan the assets folder for probable logos (files named `logo*`, `brand*`, `icon*`, or `.svg`/`.png` files under ~100 KB).

If a usable logo is found:

- Confirm with the user: "I found `logo.svg` — should I feature it on the title and closing steps?"
- If yes, note this: the logo will be embedded in each style preview (Step 2) and placed in the intro and close steps of the final YAML.
- If the logo is a raster image, note the path for use as `src: assets/logo.png` in an `image` component.

---

## Step 2: Style path

Ask (use AskQuestion tool):

**"How would you like to choose the visual style?"**

- **Show me options** (recommended) — I'll generate three distinct live previews based on the mood you pick, and you choose what resonates.
- **I know what I want** — I'll show you the available preset families and you pick directly.

### Path A: Show me options

1. Ask the mood (use AskQuestion, allow up to 2 selections):
   - Confident / bold — professional, high-impact
   - Energetic / expressive — bold, creative, fast
   - Calm / focused — clear, thoughtful, editorial
   - Inspired / emotive — literary, warm, memorable

2. Generate three previews:
   `node skills/xtoryteller/scripts/create-style-previews.mjs --mood <mood> --topic "<topic>" --force`

   With `npm run dev` running, viewer URLs will be printed. Share them.

3. **Acceptance gate** — Confirm the three previews look genuinely distinct (different typography family, layout motif, and background treatment — not just color variation). If two options look interchangeable, regenerate with a different `--mood` or a different topic description.

4. Ask for pick: Preview A / Preview B / Preview C / Mix elements.
   - If "Mix elements": ask what to take from which preview (e.g. "fonts from A, background from C").

### Path B: Direct selection

Show the available preset families grouped by mood (from [preset-families.md](preset-families.md)):

- **confident**: `bold-signal`, `electric-studio`, `dark-botanical`
- **energetic**: `creative-voltage`, `neon-cyber`, `split-pastel`
- **calm**: `notebook-tabs`, `paper-and-ink`, `swiss-modern`
- **inspired**: `dark-botanical`, `vintage-editorial`, `pastel-geometry`

Ask them to pick one by name. Accept free-form responses (e.g. "something dark and clean" → map to `electric-studio` or `dark-botanical`).

---

## Step 3: Content density and animation tempo

Ask (use AskQuestion tool, one call for both):

### Content density

**"How much content per step (Stage) or cluster (Map)?"**

| Option | What it means in YAML |
| --- | --- |
| **Compact** — one idea, room to breathe | 1–2 components per step; bullet lists capped at 3–4 items; prefer `callout` or `stat-card` for single-idea steps |
| **Balanced** — standard density | 2–3 components; bullet lists up to 5–6 items; mix of `bullet-list`, `body-text`, supporting visuals |
| **Rich** — dense reference material | Up to layout density limit; use `build: sequential` to reveal progressively; requires close review at verify step |

Store as a density preference and apply it consistently when generating step content.

### Animation tempo

**"How should the presentation feel in motion?"**

| Option | What it means in YAML |
| --- | --- |
| **Subtle** — minimal movement | Prefer `fade` transitions; avoid `build: sequential` except on key reveal lists; no enter/exit per component |
| **Balanced** — moderate animation | Mix `fade` and `slide-left`/`slide-right`; `build: sequential` on primary bullet lists |
| **Dynamic** — energetic, choreographed | `slide-*` or `scale` transitions; `build: sequential` on most lists; enter/exit props on emphasis components |

---

## Step 4: Outline confirmation

Synthesize what you know into a proposed structure:

- Mode, slug, title
- Number of steps (Stage) or clusters (Map), with a brief title for each
- Story spine summary: chapters, step roles, key-message titles, and estimated timing when Stage mode is speaker-led
- Any asset/logo placements noted
- Style choice and density/tempo preferences

Present the outline to the user and ask for confirmation via AskQuestion:

**"Does this outline look right?"**

- Looks good — start building
- Adjust a few things — (describe in chat)
- Rethink the structure — let's talk it through

Do not write YAML until you have explicit confirmation. Once confirmed, proceed to Phase 2 (load context + registries) and then Phase 4 (implement).
