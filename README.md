# Xtoryteller

Xtoryteller is a self-hosted presentation system for building rich, reusable decks from YAML, shared components, layouts, themes, transitions, and background presets. It is designed so humans can create and review presentations in the browser while agents work from the same persistent infrastructure.

## At A Glance

- Stage mode for linear, speaker-led presentations
- Map mode for spatial, exploratory presentations
- Persistent components, layouts, themes, transitions, and background presets
- YAML-first presentation authoring with Markdown content
- Shared validation, QA, export, and import tooling
- A canonical agent skill package for repo-aware presentation work

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard.

Useful checks:

```bash
node scripts/validate.mjs presentations/<slug>/presentation.yaml
node scripts/validate-theme.mjs themes/<theme>.yaml
node scripts/validate-all.mjs
```

## How It Works

Presentations live in `presentations/<slug>/presentation.yaml`.
The viewer renders them through a shared Next.js runtime.
Components, layouts, transitions, themes, and backgrounds are reusable project primitives, not one-off slide code.

Stage mode is best for sequential talks, walkthroughs, and reports.
Map mode is best for systems, exploration, and clustered narratives.

## Human Authoring Workflow

1. Pick the right presentation mode.
2. Outline the story before writing YAML.
3. Reuse existing components and layouts when possible.
4. Keep assets under `presentations/<slug>/assets/`.
5. Validate the deck.
6. Review it in the browser and iterate.

Manual Map editing is supported in local/dev mode: use the viewer's `Edit layout` flow to drag, resize, and save cluster geometry back to YAML when you want to refine a spatial deck by hand.

## Repository Map

- `app/` - dashboard and presentation routes
- `components/` - reusable presentation components
- `layouts/` - reusable layout definitions
- `transitions/` - transition presets
- `backgrounds/` - shared background presets
- `themes/` - reusable theme definitions
- `presentations/` - authored decks and local assets
- `lib/` - runtime, engine, and state machine code
- `scripts/` - validation, scaffolding, and packaging tools
- `skills/xtoryteller/` - agent-facing guidance, registries, schemas, and examples
- `docs/` - longer architecture, QA, and implementation notes

## For Agents

The canonical agent entrypoint is [skills/xtoryteller/SKILL.md](skills/xtoryteller/SKILL.md).

If you are creating or editing presentations, use the matching guide in `skills/xtoryteller/references/guides/` instead of relying on this README for operational detail.

## More Docs

- [docs/IMPLEMENTATION_PROGRESS.md](docs/IMPLEMENTATION_PROGRESS.md)
- [docs/QA_SYSTEM_PLAN.md](docs/QA_SYSTEM_PLAN.md)
- [skills/xtoryteller/references/guides/](skills/xtoryteller/references/guides/)
- [skills/xtoryteller/references/registries/](skills/xtoryteller/references/registries/)
