# Style Discovery

Read this file when the user does not know the final look yet and would benefit from comparing live Xtoryteller previews.

## Use This Path When

- the user says “show me options”
- the user is unsure about mood or visual direction
- the user wants to compare multiple looks before building the final deck

## Preferred Flow

1. Determine the broad mood:
   - `confident`
   - `energetic`
   - `calm`
   - `inspired`
2. Generate three preview presentations with the helper script.
3. Ask the user to review the previews in the browser.
4. Carry the winning direction into the real presentation through the theme or `themeOverrides`.
5. Prefer preset families first. Reach for ad-hoc `themeOverrides` only when the winning direction is intentionally local and not worth naming.

## Deterministic Helper

Command:
`node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force`

This writes:
- `presentations/_preview-a/presentation.yaml`
- `presentations/_preview-b/presentation.yaml`
- `presentations/_preview-c/presentation.yaml`

You can change the prefix with `--prefix my-preview`.

## Rules

- Use live runtime previews instead of abstract style debates when possible.
- Keep the previews visibly distinct. A good style study changes typography, layout motifs, surface treatment, and background behavior, not just colors.
- Avoid generic defaults such as interchangeable sans-serif stacks, timid purple gradients, or repeating the same split layout for every option.
- Use the curated preset families from [preset-families.md](preset-families.md) when the user wants a strong starting point.
- Prefer theme overrides first; create a new reusable theme only when the direction is likely to persist.
- Clean up or overwrite old preview folders intentionally.
