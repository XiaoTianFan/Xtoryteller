# QA System Plan

Last updated: 2026-03-31

## Status Snapshot

Implemented and now enforced:

- Repo-wide validation via `npm run validate:all`
- Runtime parity checks between filesystem manifests and runtime renderer maps
- Theme validation for required tokens, contrast, and local font availability
- Unit tests for build planning, arrangement, transition presets, markdown annotation parsing, theme resolution, template expansion, asset resolution, and portability helpers
- Integration tests for canonical presentation validation and invalid fixture coverage
- Runtime renderer contract tests for component, layout, stage, map, and theme-provider behavior
- Playwright smoke coverage for dashboard discovery, tag filtering, Stage navigation, Map guided navigation, keyboard-only flow, reduced-motion behavior, accessibility scans, and the not-found route
- Portability round-trip coverage for package export, archive creation, archive extraction, and package validation
- A GitHub Actions QA workflow that runs lint, validation, unit, integration, portability, and browser checks on PRs and nightly

Still intentionally deferred:

- Visual regression baselines
- Broader browser matrix beyond Chromium
- Performance budgets and route-size gating
- Full isolated-workspace CLI mutation coverage for import and promotion workflows

## Purpose

This document keeps the QA system aligned with the repo’s actual architecture and quality risks.

It has four jobs:

1. Record the quality controls that already exist.
2. Identify the gaps that still need automated coverage.
3. Keep partial-support boundaries honest in docs and validation.
4. Define a practical rollout path that fits the current implementation.

## Current Repo Read

Xtoryteller is a real application with a layered QA surface:

- File-system-first presentation loading is implemented.
- Stage mode and Map mode both exist and build successfully.
- The runtime renderer surface is explicit and now cross-checked against filesystem manifests.
- Validation and registry generation scan manifests on disk.
- Browser smoke tests now cover the common dashboard and viewer entry points.

The important split remains:

- Authoring truth: filesystem manifests and schema
- Runtime truth: explicit imports and renderer maps

The QA system now checks both sides instead of trusting either one alone.

## APRD Comparison

### Phase 1

Status: shipped, with QA coverage now in place.

Clearly shipped:

- App Router project structure
- YAML loading and schema validation
- Theme resolution and theme overrides
- XState-driven Stage runtime
- Keyboard navigation, progress UI, and live regions
- Core Phase 1 components and layouts
- Basic dashboard and presentation entry flow
- Build-step sequencing

QA coverage now present:

- Manifest/runtime parity checks for components, layouts, and transitions
- Canonical Stage and Map validation fixtures
- Viewer contract tests for Stage and Map shells
- Dashboard and viewer browser smoke coverage

### Phase 2

Status: shipped, with guided navigation and browser coverage now enforced.

Clearly shipped:

- Map mode runtime
- Guided and free-roam navigation
- Cluster positioning and framing
- Flow, radial, grid, and tree arrangement logic
- First-wave diagram components
- Expanded layouts and transitions

QA coverage now present:

- Guided-map browser flow tests
- Accessibility scans on the canonical viewer flows
- Keyboard-only Stage navigation checks

### Phase 3

Status: broadly shipped, with partial support still called out explicitly.

Clearly shipped:

- Broader component suite
- Broader layout suite
- Theme validation
- Dashboard search, filter, sort, and view toggles
- Portability scripts for export, import, and promotion
- Showcase presentations and agent-facing skill files

Partial or intentionally limited:

- Hover annotations are supported in markdown content, but only within the current annotation model
- Presentation-scoped primitive resolution is represented in portability flows, but full CLI mutation coverage still needs isolated-workspace testing
- Visual regression and performance budgets remain deferred

## What Existing QA Now Covers

### Validation

`scripts/validate.mjs` now checks:

- JSON Schema conformance against `skills/xtoryteller/references/schema/schema.json`
- theme existence
- layout, component, and transition names against manifest directories
- duplicate step ids and duplicate cluster ids
- missing referenced assets
- build-step contiguity
- density warnings for layouts and dense content patterns
- background section references
- map anchor cycles and missing anchor targets
- map navigation sequence integrity
- min/max zoom sanity
- runtime registry parity against the runtime renderer maps

### Theme Validation

`scripts/validate-theme.mjs` now checks:

- font role presence and allowed `source` values
- required theme token coverage for colors, typography, spacing, radii, shadows, borders, and motion
- contrast for key foreground/background pairs
- local font directory presence and WOFF2 availability when a font is marked `local`
- explicit weights for non-system font sources

### Contracts and Runtime Tests

Current runtime coverage includes:

- manifest/runtime parity tests for components, layouts, and transitions
- renderer tests for known and unknown components
- layout resolution tests under the presentation provider
- ThemeProvider CSS-variable output checks
- canonical Stage and Map renderer smoke coverage in jsdom

### Browser QA

Current Playwright coverage includes:

- dashboard discovery and filtering
- Stage navigation with keyboard input
- Stage reduced-motion behavior
- Map guided/free-roam behavior
- Map sequence-chip navigation
- accessibility scans for dashboard, Stage, Map, and not-found flows
- missing-slug behavior

### Portability QA

Current portability coverage includes:

- dependency discovery from presentation manifests
- asset discovery from nested component props
- package directory validation
- archive creation and extraction round-trip checks
- package root discovery after archive extraction
- validation of exported/imported package copies

## Remaining Gaps

The highest-value gaps that still remain are now narrower:

- No visual regression baselines yet
- No route-size or interaction-budget thresholds yet
- No CI matrix beyond Chromium
- No isolated-workspace end-to-end tests for the mutating import and promotion CLIs
- No broad manual screen-reader pass automation, even though the major flows are covered

## QA Rollout

### Completed

- Authoring gates and runtime parity checks
- Core unit and integration tests
- Canonical browser smoke tests
- Portability helper coverage
- QA workflow wiring

### Next

- Add visual baselines for a small, canonical set of decks
- Add isolated-workspace coverage for import and promotion CLIs
- Add lightweight performance guardrails after the visual layer is stable
- Expand browser coverage only if a second browser starts to matter for the product

## Quality Policy

Treat these as release-blocking:

- validation failures
- build failures
- manifest/runtime contract failures
- Stage and Map smoke test failures
- broken export/import package validation for canonical fixtures

Treat these as warning-level until a stronger policy is needed:

- screenshot diffs
- accessibility findings that do not block core flows
- performance drift
- partial-support mismatches that remain documented and non-breaking

## Assumptions

- Partial-feature mismatches stay warning-level unless they become user-facing runtime failures.
- The QA system stays phased so correctness and coverage come before broader visual and performance work.
- Initial browser coverage stays Chromium-first.
- CI covers the same gates as local QA, with heavier layers added only after the new core checks stay stable.

