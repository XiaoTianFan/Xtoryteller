# Quick route matrix

Use this table to jump straight to the right guides and commands. For the full phased workflow, see [SKILL.md](../../SKILL.md).

| Task | Read first | Validate / check |
| --- | --- | --- |
| **New presentation from scratch** | [co-design-intake.md](co-design-intake.md) → Phase 1 | Complete intake first, then scaffold and validate |
| New or edited **Stage** deck | [stage-authoring.md](stage-authoring.md), [example-selection.md](example-selection.md), registries | `node scripts/validate.mjs presentations/<slug>/presentation.yaml` |
| New or edited **Map** presentation | [map-authoring.md](map-authoring.md), [example-selection.md](example-selection.md), registries | same |
| **Scaffold** a new presentation | [example-selection.md](example-selection.md) | `node skills/xtoryteller/scripts/init-presentation.mjs --slug <slug> --mode stage\|map --example simple\|complex` then `node scripts/validate.mjs …` |
| **Theme** / `themeOverrides` / fonts | [theme-authoring.md](theme-authoring.md) | `node scripts/validate-theme.mjs themes/<theme>.yaml` if editing a theme file |
| **Backgrounds** / transitions | [backgrounds-transitions.md](backgrounds-transitions.md), background registry | `node scripts/validate.mjs …`; after changing shared presets: `node scripts/validate-all.mjs` |
| **Annotations** | [annotations.md](annotations.md) | `node scripts/validate.mjs …` |
| New **component** / **layout** | [primitive-extension.md](primitive-extension.md), [component-authoring.md](component-authoring.md) | `npm run registries` then `npm run test:contracts` if manifests changed |
| **Style exploration** (unclear art direction) | [style-discovery.md](style-discovery.md), [preset-families.md](preset-families.md) | `node skills/xtoryteller/scripts/create-style-previews.mjs --mood <mood> --topic "…" --force` |
| **Export** / **import** / promote | [portability.md](portability.md) | `node scripts/export.mjs …` / `node scripts/import.mjs …` |
| **Runtime** / viewer / dashboard | [architecture-overview.md](architecture-overview.md), [runtime-support-matrix.md](runtime-support-matrix.md), [qa-workflows.md](qa-workflows.md) | Layers from [qa-workflows.md](qa-workflows.md) |
| YAML issues / errors | [yaml-conventions.md](yaml-conventions.md), [troubleshooting.md](troubleshooting.md) | `node scripts/validate.mjs …` |
| **Deploy** to Vercel | [deploy-to-vercel.md](deploy-to-vercel.md) | Detect path (Git integration / CLI / fresh), then commit+push or `npx vercel --prod` |

**Always** read registries and schema before composing new YAML (see SKILL Phase 2).

**Registry refresh** (after changing manifests, themes, or background YAML outside one presentation):

`node scripts/validate-all.mjs`
