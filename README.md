# Xtoryteller

Xtoryteller is a self-hosted, agent-first presentation system built around reusable primitives instead of one-off slide generation. Presentations are authored as YAML, rendered through a shared Next.js runtime, and composed from persistent components, layouts, themes, transitions, and validation tooling that both humans and agents can work with reliably.

## Table of Contents

- [What It Is](#what-it-is)
- [Core Capabilities](#core-capabilities)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Authoring Workflow](#authoring-workflow)
- [Extending The System](#extending-the-system)
- [Agent Skill Package](#agent-skill-package)
- [Validation, QA, And Testing](#validation-qa-and-testing)
- [Portability Workflows](#portability-workflows)
- [Development Notes](#development-notes)
- [Additional Docs](#additional-docs)

## What It Is

Xtoryteller is designed for a workflow where agents compose with stable presentation infrastructure instead of regenerating ad-hoc HTML for every deck.

The system combines:

- declarative presentation orchestration in YAML
- reusable TSX component, layout, and transition libraries with manifests
- theme-driven styling through YAML and CSS custom properties
- dual navigation modes for linear and spatial storytelling
- validation and packaging workflows that keep decks portable and repo-safe

## Core Capabilities

- **Stage mode** for sequential, speaker-led narratives with step and build progression
- **Map mode** for spatial storytelling with clusters, guided sequences, and free-roam navigation
- **Reusable primitives** in `components/`, `layouts/`, `transitions/`, and `themes/`
- **Agent-readable registries** generated from manifests and theme files
- **Markdown-rich content** including markdown-scoped hover annotations via `{{hover:key|Label}}` plus `component.annotations`
- **Validation tooling** for presentations, themes, runtime parity, density guidance, and asset references
- **Portability tooling** for export, import, and promotion of presentation-scoped components
- **Canonical agent skill package** under `skills/xtoryteller/`

## Architecture Overview

Xtoryteller is a file-system-first runtime.

- Presentation content lives in `presentations/<slug>/presentation.yaml`.
- Components, layouts, and transitions are real code with manifests that feed registries and validation.
- Themes live in YAML and resolve to CSS custom properties at runtime.
- The dashboard reads directly from `presentations/`.
- Stage and Map rendering sit on top of shared runtime and state-management infrastructure in `lib/`.
- Validation and registry generation live in `scripts/`.

### Navigation Modes

| Mode | Best For | Key Concepts |
| --- | --- | --- |
| `stage` | linear talks, walkthroughs, reports | steps, builds, transitions |
| `map` | systems thinking, canvases, exploratory narratives | clusters, anchors, arrangement, navigation sequences |

## Project Structure

```text
xtoryteller/
├── app/                        # Next.js routes: dashboard and presentation viewer
├── components/                 # Global presentation primitives with manifests
├── layouts/                    # Layout primitives with manifests
├── transitions/                # Transition definitions with manifests
├── themes/                     # Theme YAML files
├── presentations/              # File-backed presentations and local assets
├── lib/                        # Runtime, renderers, engine logic, shared types
├── scripts/                    # Validation, registries, watch, and portability tooling
├── skills/xtoryteller/         # Canonical agent skill package
├── tests/                      # Contracts, unit, integration, and browser coverage
└── docs/                       # Longer-form QA, skill-evaluation, and APRD reference docs
```

## Quick Start

### Requirements

- Node.js
- npm

### Install And Run

```bash
npm install
npm run validate:all
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The root route shows the dashboard. Each presentation is routed by slug at `/<slug>`.

## Authoring Workflow

1. Start with the Xtoryteller skill package in `skills/xtoryteller/`.
2. Read the generated registries in `skills/xtoryteller/references/registries/`.
3. Decide whether the story is better as Stage mode or Map mode.
4. Outline the beats or clusters before writing YAML.
5. Choose a theme or a small set of `themeOverrides`.
6. Author `presentations/<slug>/presentation.yaml` and place local assets under `presentations/<slug>/assets/`.
7. Validate the presentation.
8. Review it in the browser while `npm run dev` is running.

### Stage Or Map

Use Stage mode when the presentation is mostly sequential.

Use Map mode when the material benefits from spatial exploration, systems views, or guided cluster navigation.

### Core Authoring Rules

- Keep the folder name and `meta.slug` aligned.
- Prefer built-in components and layouts before creating new primitives.
- Split dense content across more steps or clusters instead of cramming.
- Keep assets relative to the presentation folder, usually under `assets/`.
- Prefer theme tokens and `themeOverrides` over repeated inline style.
- Treat markdown hover annotations as supported inside markdown-rendered content, not as a universal `annotation anywhere` surface.
- Verify advanced motion or component-level animation hints in the browser.

### Helpful Commands

```bash
node scripts/validate.mjs presentations/<slug>/presentation.yaml
node scripts/validate-theme.mjs themes/<theme>.yaml
node scripts/validate-all.mjs
```

`validate-all` refreshes the canonical skill registries before it runs.

### Current Support Notes

- Markdown-rendered content supports hover annotations through `{{hover:key|Label}}` plus `component.annotations`.
- Presentation-scoped `components/`, `layouts/`, and `transitions/` are valid runtime inputs for that presentation and override global libraries when names collide.
- Backgrounds support both simple CSS values and Paper shaders. The runtime accepts object configs, APRD-style `background.stages` / `background.regions`, legacy `backgroundSections`, and short string forms such as `background: none` or `background: mesh-gradient`.
- Component-level animation hints are shipped and validated, but motion-heavy changes should still be reviewed in the browser.

## Extending The System

### Components

Each component typically lives in `components/<name>/` and includes:

- `index.tsx`
- `manifest.yaml`
- `styles.module.css` when needed

Guidelines:

- use semantic HTML
- reference theme CSS variables instead of hardcoded values
- keep props agent-readable in the manifest
- add a real presentation example before relying on the component broadly
- reuse the shared markdown renderer when a component should support markdown content or markdown annotations

### Themes

Themes live in `themes/<slug>.yaml`.

Common sections:

- `fonts`
- `colors`
- `typography`
- `spacing`
- `radii`
- `shadows`
- `borders`
- `motion`

Use `themeOverrides` for one-off presentation-specific adjustments. Create a full theme when the visual language should be reusable.

Advanced theme support includes:

- font sources: `system`, `local`, `google`, and `fontshare`
- local font files declared from `public/fonts/`
- nested shell and chrome token families such as `colors.chrome.*`, `colors.code.*`, `colors.scrollbar.*`, `colors.progress.*`, `colors.diagram.*`, `colors.backgroundStops.*`, and matching `motion.*` groups

Validate themes with:

```bash
node scripts/validate-theme.mjs themes/<theme>.yaml
```

### Scaffolding Helpers

```bash
node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple
node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve
node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split
node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force
```

## Agent Skill Package

The canonical agent-facing package lives in [skills/xtoryteller](/F:/Project/Xtoryteller/skills/xtoryteller).

### Skill Layout

```text
skills/xtoryteller/
├── SKILL.md
├── evals/
│   └── coverage-prompts.md
├── references/
│   ├── guides/
│   ├── registries/
│   ├── schema/
│   └── examples/
└── scripts/
```

### What The Skill Covers

- Stage and Map authoring
- markdown annotations
- theme, background, and transition work
- component, layout, and primitive extension
- dashboard and viewer runtime tasks
- validation and QA workflows
- export, import, and promotion workflows

### Entry Points

- [SKILL.md](/F:/Project/Xtoryteller/skills/xtoryteller/SKILL.md)
- [guides](/F:/Project/Xtoryteller/skills/xtoryteller/references/guides)
- [registries](/F:/Project/Xtoryteller/skills/xtoryteller/references/registries)
- [schema](/F:/Project/Xtoryteller/skills/xtoryteller/references/schema)
- [examples](/F:/Project/Xtoryteller/skills/xtoryteller/references/examples)
- [eval prompts](/F:/Project/Xtoryteller/skills/xtoryteller/evals/coverage-prompts.md)

## Validation, QA, And Testing

### Validation And Build

```bash
npm run validate:all
npm run build
```

### Test Commands

```bash
npm run test:contracts
npm run test:unit
npm run test:integration
npm run test:portability
npm run test:e2e
npm run test:qa
```

### What The QA Surface Covers

- manifest/runtime parity
- presentation and theme validation
- runtime integration coverage
- browser smoke coverage
- portability round-trip checks

## Portability Workflows

Use the repo-level scripts to package or move presentations safely.

```bash
node scripts/export.mjs presentations/<slug>
node scripts/import.mjs exports/<slug>-complete.zip
node scripts/import.mjs exports/<slug>-complete.zip --confirm
node scripts/promote-component.mjs <presentation-slug> <component-name>
```

Use promotion when a presentation-scoped component should become part of the reusable global component library.

## Development Notes

- `npm run validate:all` refreshes agent registries before validating the repo.
- `npm run dev` runs the Next.js app and the watcher together.
- The watcher refreshes registries when manifests or themes change.
- The watcher publishes YAML, theme, manifest, and asset changes over WebSocket on port `3001`.
- The runtime primarily assumes global components, layouts, and transitions for routine authoring.

## Additional Docs

The remaining `docs/` folder is for longer-form or audit-style material rather than quick-start summaries.

- [IMPLEMENTATION_PROGRESS.md](/F:/Project/Xtoryteller/docs/IMPLEMENTATION_PROGRESS.md)
- [QA_SYSTEM_PLAN.md](/F:/Project/Xtoryteller/docs/QA_SYSTEM_PLAN.md)
- [SKILL_EVALUATION_REPORT.md](/F:/Project/Xtoryteller/docs/SKILL_EVALUATION_REPORT.md)
- APRD reference chapters under `docs/`

