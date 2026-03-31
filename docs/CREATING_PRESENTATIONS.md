# Creating Presentations

Presentations live at `presentations/<slug>/presentation.yaml`.

Core rules:

- Use `mode: stage` for sequential talks and `mode: map` for spatial exploration.
- Reference only registered component, layout, transition, and theme names.
- Keep content density low; split dense moments into more steps or clusters.
- Prefer theme variables over hardcoded styling.

Run `npm run validate -- presentations/<slug>/presentation.yaml` after edits.
