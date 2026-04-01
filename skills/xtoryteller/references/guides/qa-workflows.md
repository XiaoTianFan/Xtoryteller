# QA Workflows

Read this file when the task changes authoring data, runtime behavior, manifests, themes, or portability tooling.

## Core Validation

- Validate one presentation:
  `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
- Validate one theme:
  `node scripts/validate-theme.mjs themes/<theme>.yaml`
- Refresh registries and validate the repo:
  `node scripts/validate-all.mjs`

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

- YAML-only deck edit: `validate`
- Shared manifest or theme change: `validate:all`
- Validator, registry, or engine logic change: `test:unit` and `test:integration`
- Runtime renderer, dashboard, or viewer interaction change: `test:contracts`, `test:integration`, and `test:e2e`
- Portability workflow change: `test:unit`, `test:integration`, and the relevant package validation flow

## Handoff Rule

Do not stop at `the YAML looks right` when the task changes runtime behavior, motion, or browser interactions. Run the closest matching QA layer and mention what was or was not verified.
