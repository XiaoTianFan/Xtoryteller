# Primitive Extension

Read this file when the registry cannot already express the requested result and you need a new component, layout, or theme.

## Decision Rule

Create a new primitive only after checking the current registries first.

- New component: when the visual primitive itself is missing.
- New layout: when the arrangement pattern is reusable and existing layouts cannot express it cleanly.
- New theme: when the visual language should be reusable across multiple presentations.

## Preferred Scope

Default to:

- `components/<name>/`
- `layouts/<name>/`
- `themes/<name>.yaml`

Use presentation-scoped folders when the primitive is intentionally deck-specific or should ship with a portable presentation package. The viewer resolves those local folders ahead of the global libraries for that presentation.

## Deterministic Helpers

- Component scaffold:
  `node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve`
- Presentation-scoped component scaffold:
  `node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve --scope presentation --presentation my-talk`
- Layout scaffold:
  `node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split`

## Component Rules

- Write `manifest.yaml` first or immediately after scaffolding.
- Use semantic HTML.
- Use theme variables, not hardcoded palette values.
- Keep the manifest agent-readable and concrete.
- Reuse the shared markdown renderer when the component should support rich markdown content or hover annotations.
- Test with a real presentation, not just placeholder data.

## Layout Rules

- Treat density guidance as part of the layout contract.
- Make mobile behavior deliberate.
- Use realistic sample content before trusting the layout.

## Theme Rules

- Prefer `themeOverrides` for one-off or local adjustments.
- Create a full theme only when the style should be reusable.
- When creating or extending a theme, add semantic token families instead of a flat pile of one-off replacements.
- Use component/layout CSS literals only for structural mechanics or rendering math that should not be reused across themes.
- Read [theme-authoring.md](theme-authoring.md) and [backgrounds-transitions.md](backgrounds-transitions.md) before changing shared theme or motion behavior.
- Validate new themes with:
  `node scripts/validate-theme.mjs themes/<theme>.yaml`

## After Extension Work

1. Regenerate or refresh registries:
   `node scripts/validate-all.mjs`
2. Validate a presentation that uses the new primitive.
3. If a presentation-scoped component becomes broadly useful, promote it with:
   `node scripts/promote-component.mjs <presentation-slug> <component-name>`
