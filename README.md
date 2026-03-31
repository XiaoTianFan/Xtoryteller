# Xtoryteller

A self-hosted, agent-first presentation infrastructure built on Next.js, YAML-driven presentation files, reusable component/layout registries, and a dual-mode runtime for Stage and Map storytelling.

## Quick start

```bash
npm install
npm run registries
npm run validate:all
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What is implemented here

- Phase 1 foundation: dashboard, Stage mode runtime, YAML loader, schema validation, theme resolution, core components/layouts/transitions, default theme, example Stage presentations.
- Phase 2 differentiators: Map mode runtime, cluster arrangement logic, guided/free-roam navigation, first-wave diagram components, additional layouts/transitions, example Map presentations.
- Phase 3 completion: expanded component suite, richer dashboard search/filter UX, tree arrangement, theme validation, build-time validation, and portability scripts for export/import/promotion.
- Agent-facing surface: skill files, schema references, generated registries, examples, and supporting docs.

## Key directories

- `app/`: Next.js App Router routes
- `components/`: built-in render primitives with manifests
- `layouts/`: layout primitives with manifests
- `transitions/`: transition definitions with manifests
- `lib/`: engine, runtime, machines, and shared types
- `presentations/`: file-backed presentations
- `themes/`: theme YAML files
- `skills/`: agent skill definition and references
- `scripts/`: registry, validation, watch, and portability tooling

## Portability commands

```bash
node scripts/export.mjs presentations/phase3-complete
node scripts/import.mjs exports/phase3-complete.zip
node scripts/import.mjs exports/phase3-complete.zip --confirm
node scripts/promote-component.mjs my-talk custom-chart
```

## Notes

- The repo currently ships system-font fallbacks in the default theme so the app stays runnable before local font binaries are added.
- The watcher publishes YAML/theme/manifest changes over WebSocket on port `3001` while `npm run dev` is running.
- The build script now runs `validate:all` before the Next.js production build so theme and presentation issues fail early.
