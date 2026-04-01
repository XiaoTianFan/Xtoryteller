# Component Authoring

Read this file when you are implementing or refactoring a component in `components/<name>/` or a presentation-scoped component folder.

## Expected Files

Each component should include:

- `index.tsx`
- `manifest.yaml`
- `styles.module.css` when the component needs scoped styles

## Authoring Pattern

1. Start with the manifest so the public component surface is explicit.
2. Implement semantic HTML in `index.tsx`.
3. Style with theme tokens and shared spacing, radius, and shadow variables.
4. Add or update a real presentation example before treating the component as reusable.
5. Validate a presentation that uses the component.

## Implementation Rules

- Use semantic HTML instead of generic wrapper divs when the content has meaning.
- Reference CSS variables from the active theme instead of hardcoded values.
- Prefer semantic token families over ad hoc variables:
  `spacing.components.*`, `sizing.components.*`, `typography.components.*`, and matching semantic `radii`, `shadows`, and `borders`.
- Only keep literals in CSS when they are intrinsic rendering math, algorithmic geometry, or structural mechanics rather than reusable visual language.
- Keep props concrete and agent-readable in the manifest.
- Follow the existing component prop contract: `content`, `props`, and `style`.
- Prefer CSS modules for component-specific layout and treatment.

## Markdown And Annotation Support

- If the component renders author-provided markdown, use the shared markdown renderer instead of a one-off markdown path.
- If the component should support hover annotations in markdown content, rely on the existing `{{hover:key|Label}}` plus `component.annotations` model documented in [annotations.md](annotations.md).
- Do not promise arbitrary hotspot support inside SVG or diagram internals unless you implement and verify it explicitly.

## Validation And Review

- Scaffold repeated work with `node skills/xtoryteller/scripts/init-component.mjs --name my-component`.
- After manifest changes or new shared components, run `node scripts/validate-all.mjs`.
- For runtime behavior changes, run the relevant checks from [qa-workflows.md](qa-workflows.md).
