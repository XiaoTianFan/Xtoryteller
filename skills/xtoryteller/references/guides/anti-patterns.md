# Anti-Patterns

## Hardcoded Styling

Why: Colors, fonts, and spacing stop responding to the theme system.

Fix: Move repeated styling into the theme or `themeOverrides`.

## Overloaded Layouts

Why: Readability, motion clarity, and responsive behavior all degrade when a step or cluster is too dense.

Fix: Split content across more steps or choose a layout with a better density fit.

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
