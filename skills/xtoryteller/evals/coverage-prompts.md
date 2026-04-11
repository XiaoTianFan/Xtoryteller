# Coverage Prompts

Use these prompts to regression-check whether the Xtoryteller skill routes to the right guides and produces grounded repo-aware behavior.

## Stage With Annotations

Prompt:
Create a short Stage presentation about systems leverage points. Use markdown hover annotations for two glossary terms and validate the deck.

Expected evidence:
- reads stage authoring, annotations, schema, and registries
- uses `{{hover:key|Label}}`
- adds matching `component.annotations`
- runs presentation validation

## Default Storytelling Preparation

Prompt:
Create a new Stage presentation from rough notes for a 20-minute internal talk. Do not skip storytelling prep. Build the story spine first, then compose and validate the deck.

Expected evidence:
- reads co-design intake and presentation-storytelling-mode before writing YAML
- captures speaking context or states safe assumptions
- identifies the scenario route and creates a story spine with step roles and key-message titles
- reads stage authoring, schema, and registries before YAML
- validates the deck

## Explicit Storytelling Skip

Prompt:
Create a tiny Stage scaffold about release notes and explicitly skip storytelling prep.

Expected evidence:
- honors the explicit skip
- still reads stage authoring, schema, and registries before YAML
- does not run material understanding or story spine planning
- validates the deck

## Strategy Consulting Mode

Prompt:
Create a Stage presentation for a market-entry recommendation. Use a hypothesis-led consulting structure, plan page dependencies, then validate the deck.

Expected evidence:
- reads presentation-storytelling-mode first unless explicitly skipped
- reads strategy-consulting-mode, stage authoring, schema, and registries
- defines a decision frame before writing YAML
- creates issue-tree / hypothesis-led argument titles rather than topic labels
- uses Xtoryteller primitives instead of PowerPoint-specific instructions
- validates the deck

## Map With Guided Navigation

Prompt:
Author a Map presentation about platform modernization with four clusters, manual anchors or arrangement, and a guided `navigation.sequence`.

Expected evidence:
- reads map authoring, schema, and registries
- uses stable cluster ids
- uses either arrangement or anchors correctly
- validates the deck

## Primitive And Theme Extension

Prompt:
Scaffold a new reusable component and a reusable theme for Xtoryteller, then explain which validation and test commands should run before handoff.

Expected evidence:
- uses primitive extension and component authoring guides
- uses theme authoring guidance
- distinguishes `validate-theme`, `validate-all`, and runtime-oriented tests

## Portability Workflow

Prompt:
Package an existing presentation for export, preview the import, then explain when a presentation-scoped component should be promoted globally.

Expected evidence:
- reads portability and runtime support guidance
- uses export/import preview commands
- explains promotion tradeoffs accurately

## Runtime Change

Prompt:
Update the dashboard or viewer runtime and choose the right validation and test commands for that change.

Expected evidence:
- routes to architecture overview, runtime support matrix, and QA workflows
- chooses contract, integration, and browser coverage where appropriate
