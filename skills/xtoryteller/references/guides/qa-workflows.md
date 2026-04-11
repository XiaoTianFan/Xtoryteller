# QA Workflows

Read this file when the task changes authoring data, runtime behavior, manifests, themes, or portability tooling.

## Core Validation

- Validate one presentation:
  `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
- Validate one theme:
  `node scripts/validate-theme.mjs themes/<theme>.yaml`
- Validate one shared background preset:
  `node scripts/validate-all.mjs`
- Refresh registries and validate the repo:
  `node scripts/validate-all.mjs`
- Skill bundle consistency (scaffold vs SKILL, manifest presence, quick-route matrix):
  `npm run validate:skill` (also runs automatically at the end of `npm run validate:all`)
- Dashboard thumbnail (viewer screenshot → `presentations/<slug>/assets/thumbnail.png` and `meta.thumbnail`; requires dev server):
  `npm run thumbnail -- --slug <slug> [--base-url http://127.0.0.1:3000]`
- PDF export (DOM/SVG/text print route → `exports/<slug>.pdf`; requires a running Next server):
  `npm run presentation:pdf -- --slug <slug> [--base-url http://127.0.0.1:3000]`

## Test Layers

- Manifest/runtime parity:
  `npm run test:contracts`
- Pure logic and unit tests:
  `npm run test:unit`
- Runtime integration tests:
  `npm run test:integration`
- Browser smoke coverage:
  `npm run test:e2e`
- Combined QA pass:
  `npm run test:qa`

## Which Layer To Run

- YAML-only deck edit: `validate`, and run `thumbnail` when the dashboard card should reflect the current viewer (not automatic on the server)
- Shared background preset change: `validate:all`, and add `test:unit` / `test:integration` if runtime behavior or validation rules changed
- Shared manifest or theme change: `validate:all`
- Shared visual-token or reusable CSS refactor: `validate:all`, `test:unit`, and `test:integration`
- Validator, registry, or engine logic change: `test:unit` and `test:integration`
- Runtime renderer, dashboard, or viewer interaction change: `test:contracts`, `test:integration`, and `test:e2e`
- PDF export change: `test:unit`, `test:integration`, and a targeted browser/PDF smoke check when Chromium is available
- Portability workflow change: `test:unit`, `test:integration`, and the relevant package validation flow

## Visual-System Regression Rule

When changing reusable theme tokens or tokenized shell/component/layout CSS:

- add or update a focused regression check for the affected semantic token surface
- verify the shipped themes still satisfy required token families
- prefer representative checks for shell, card/list/timeline families, and shared layout styles over one assertion per token

## Handoff Rule

Do not stop at `the YAML looks right` when the task changes runtime behavior, motion, or browser interactions. Run the closest matching QA layer and mention what was or was not verified.
