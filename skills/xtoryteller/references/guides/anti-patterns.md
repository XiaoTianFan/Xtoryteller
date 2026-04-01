# Anti-Patterns

## Hardcoded Styling

Why: Colors, fonts, and spacing stop responding to the theme system.

Fix: Move repeated styling into the theme or `themeOverrides`.

## Overloaded Layouts

Why: Readability, motion clarity, and responsive behavior all degrade when a step or cluster is too dense.

Fix: Split content across more steps or choose a layout with a better density fit.

## Using Stat Cards For Prose

Why: `stat-card` values render like emphasized metrics, so sentence-like values overflow and distort card balance.

Fix: Keep stat values short and move explanatory phrases into `detail`, `feature-card`, `card`, or `callout`.

## Treating Pyramid Rows Like Normal Cards

Why: `pyramid-layout` is intentionally compact. List-heavy or tall cards push the Stage beyond the viewport and weaken the pyramid read.

Fix: Keep each row to a short title plus a short sentence, or split the roadmap across more steps.

## Assuming List Components Auto-Create Build Steps

Why: Lists only reveal item-by-item when you author `build: sequential`.

Fix: Add `build: sequential` whenever each bullet or numbered point should appear on its own advance.

## Inventing A Primitive Before Checking The Registry

Why: It duplicates work and weakens the cumulative infrastructure model.

Fix: Read the component and layout registries first.

## Treating Xtoryteller Like A Standalone HTML Generator

Why: The platform is built around reusable primitives, YAML orchestration, and validation tooling.

Fix: Generate or edit YAML first; only write new code when the registry cannot express the need.

## Depending On Partial APRD Features Without Verification

Why: Some schema-level or aspirational features still need manual confirmation in the current viewer.

Fix: Use supported paths by default and verify advanced affordances manually.

## Letting Registries Drift From Manifests And Themes

Why: Agents then reason from stale infrastructure snapshots.

Fix: Regenerate registries after shared manifest or theme changes, or use the validation flow that refreshes them automatically.
