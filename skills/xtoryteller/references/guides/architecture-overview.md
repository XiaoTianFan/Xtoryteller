# Architecture Overview

Xtoryteller is a file-system-first presentation runtime with an agent-facing orchestration layer.

## What Is Shipped

- Presentation content lives in `presentations/<slug>/presentation.yaml`.
- Components, layouts, and transitions are real code with manifest files that feed the agent registries.
- Themes live in YAML and are resolved into CSS custom properties at runtime.
- The viewer has two modes:
  - Stage mode for sequential step/build storytelling.
  - Map mode for cluster-based spatial storytelling with guided and free-roam navigation.
- The dashboard reads the `presentations/` directory directly and exposes search, filtering, and sort controls.
- Validation and registry generation live in `scripts/`.
- Markdown hover annotations are available inside markdown-rendered content through `{{hover:key|Label}}` plus `component.annotations`.
- Presentation-scoped `components/`, `layouts/`, and `transitions/` can override the global libraries for the active presentation.
- Backgrounds support both CSS and `@paper-design/shaders-react`.

## Working Model For Agents

1. Read the registries and supporting docs.
2. Decide whether the task is presentation work, style exploration, primitive/theme creation, or product/runtime work.
3. Generate or edit YAML first.
4. Touch code only when the registry truly lacks the needed primitive.
5. Validate before asking the user to review.

## Current Runtime Boundaries

These boundaries matter because the APRD is broader than the currently shipped runtime surface.

- Markdown hover annotations are shipped for markdown-rendered content, but the broader APRD-wide `annotation anywhere` model is still broader than the current runtime.
- Component-level `enter` and `exit` animation props are supported, but motion-heavy storytelling changes should still be manually verified.

## File Ownership

- `presentations/`: primary authoring surface for agents
- `themes/`: safe to extend when theme work is requested
- `components/`, `layouts/`, `transitions/`: extend only through the relevant sub-pipelines
- `lib/`, `app/`, `scripts/`: infrastructure work, validation, runtime behavior, and tooling
- `skills/`: agent guidance and generated registries

## Practical Guidance

- Prefer built-in primitives over new code.
- Prefer theme tokens over per-component styling.
- Keep folder names, slugs, and asset paths aligned.
- Split dense content early instead of hoping layout CSS will save it later.
- When the task is about dashboard, viewer, renderer, or validation behavior, read `runtime-support-matrix.md` and `qa-workflows.md` before changing claims about what the product supports.
