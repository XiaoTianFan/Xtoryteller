# Style Discovery

Read this file when the user does not know the final look yet and would benefit from comparing live Xtoryteller previews.

## Use This Path When

- the user says “show me options”
- the user is unsure about mood or visual direction
- the user wants to compare multiple looks before building the final deck

## Preferred Flow

1. **Mood (single choice or short list)** — Map the user’s intent to one or two of:
   - `confident`
   - `energetic`
   - `calm`
   - `inspired`
2. **Generate three previews** — Run the helper once so outputs are deterministic and comparable:
   `node skills/xtoryteller/scripts/create-style-previews.mjs --mood <mood> --topic "<short topic>" --force`
3. **Acceptance gate** — Before touching the real deck, confirm the user has seen **three visibly distinct** options (different typography, layout motif, surface/background behavior—not only hue shifts). If two previews look interchangeable, regenerate with a stronger spread or adjust topic/mood inputs.
4. **User pick** — Ask explicitly which direction wins:
   - Preview A, B, or C by label, **or**
   - **Mix elements** — Ask what to take from which preview (e.g. “typography from B, background from A”).
5. **Apply to the real presentation** — Carry the winning direction via `theme`, `themeOverrides`, and/or background `presetRef` as appropriate. Prefer preset families from [preset-families.md](preset-families.md) first; use ad-hoc `themeOverrides` when the look should stay local and is not worth naming as a theme.
6. **Optional URLs** — The preview script prints viewer URLs when it finishes. With `npm run dev`, you can also run `node skills/xtoryteller/scripts/print-preview-urls.mjs` (same default prefix `preview`; use `--prefix` if you overrode it when generating).

## Deterministic Helper

Command:
`node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force`

This writes (default prefix `preview`):

- `presentations/preview-a/presentation.yaml`
- `presentations/preview-b/presentation.yaml`
- `presentations/preview-c/presentation.yaml`

You can change the prefix with `--prefix my-preview` (slugs become `my-preview-a`, etc.).

## Rules

- Use live runtime previews instead of abstract style debates when possible.
- Keep the previews visibly distinct. A good style study changes typography, layout motifs, surface treatment, and background behavior, not just colors.
- Avoid generic defaults such as interchangeable sans-serif stacks, timid purple gradients, or repeating the same split layout for every option.
- Use the curated preset families from [preset-families.md](preset-families.md) when the user wants a strong starting point.
- Prefer theme overrides first; create a new reusable theme only when the direction is likely to persist.
- Clean up or overwrite old preview folders intentionally.
