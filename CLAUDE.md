# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Xtoryteller** is a self-hosted, agent-first presentation infrastructure that merges persistent component infrastructure with agentic content creation. It enables humans to build, evolve, and share visually rich presentations through conversational AI workflows.

**Example Presentations:**
- `human-ai-and-music-insight-brief` (Stage mode) - Demonstrates sequential presentation
- `human-ai-and-music` (Map mode) - Demonstrates spatial/exploratory presentation

### Key Innovation

Unlike existing agent-based presentation tools that generate throwaway HTML, Xtoryteller provides:
- **Persistent infrastructure** - A durable library of components, layouts, themes, and navigation presets that agents *compose with* rather than regenerate from scratch
- **Agent-first design** - All data structures, file formats, and documentation are optimized for AI agents to read, understand, and produce
- **Declarative orchestration** - Presentations are YAML files, not code - agents generate data reliably

### Core Philosophy

1. **Agent as primary creator, human as director** - Users discuss intent with AI agents; agents compose presentations from infrastructure
2. **Infrastructure over generation** - Presentations reference proven components rather than inventing markup ad-hoc
3. **Gradual aesthetic identity** - Build a personal design system over time through custom components and themes
4. **Leverage the browser** - DOM for content, WebGL shaders for backgrounds, SVG/D3 for diagrams, CSS transforms for navigation
5. **Portability and ownership** - Self-hosted, no vendor lock-in, all presentations are portable artifacts

## Architecture

### Key Architecture Files

**Runtime Core:**
- `lib/machines/presentation-machine.ts` - XState machine definition
- `lib/runtime/use-presentation-machine.ts` - React hook for machine access
- `lib/runtime/build-plan.ts` - Build step sequencing logic
- `lib/runtime/background-config.ts` - Background resolution and interpolation

**Engine Layer:**
- `lib/engine/presentation-loader.ts` - YAML parsing and validation
- `lib/engine/theme-resolver.ts` - Theme resolution and CSS variable generation
- `lib/engine/arrangement.ts` - Map cluster positioning algorithms
- `lib/engine/background-preset-resolver.ts` - Background preset resolution

**Registries:**
- `lib/engine/component-registry.ts` - Component discovery and registration
- `lib/engine/layout-registry.ts` - Layout discovery and registration
- `lib/engine/transition-registry.ts` - Transition discovery and registration
- `lib/engine/theme-registry.ts` - Theme discovery and registration
- `lib/engine/background-preset-registry.ts` - Background preset discovery

**Renderers:**
- `app/[slug]/page.tsx` - Presentation viewer page
- `app/page.tsx` - Dashboard page
- Components in `components/` and `layouts/` - Actual rendering implementations

### Technology Stack

### Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **State Management**: XState v5
- **Presentation Data**: YAML with Markdown content
- **Components**: TSX (React) with YAML manifests
- **Styling**: CSS Modules + CSS Custom Properties
- **Background Rendering**: paper-shader (WebGL)
- **Diagram Layout**: ELK.js
- **Data Visualization**: D3.js
- **Animation**: Framer Motion
- **Deployment**: Vercel (primary) or static export

### Navigation Modes

Presentations support two fundamentally different navigation paradigms:

1. **Stage Mode** - Temporal, sequential navigation where components transition in/out on a fixed stage
   - Steps with build progressions
   - Keyboard navigation (arrows, space, Home/End, 0-9 for jumps)
   - Progress bar and build indicators
   - Transition effects between steps

2. **Map Mode** - Spatial, exploratory navigation with camera pan/zoom across an infinite canvas
   - Clusters with manual or automatic positioning
   - Arrangement modes: flow, radial, grid, tree
   - Free-roam camera (arrow keys, +/- zoom)
   - Guided sequences for curated navigation paths
   - Editable layout in dev mode with save-to-YAML

Both modes share the same component system, theme system, and background shader system.

### Data Architecture

The system follows a hybrid declarative + programmatic approach:

| Concern | Format | Rationale |
|---------|--------|-----------|
| Presentation orchestration | YAML | Agents generate YAML reliably; schema-validatable |
| Content authoring | Markdown within YAML | Natural for agents, rich formatting |
| Component definitions | TSX + YAML manifest | Full programmatic power + agent-readable API |
| Layout definitions | TSX + YAML manifest | Spatial logic requires code + manifest documents slots |
| Theme/styling | YAML configuration | Just data - colors, fonts, spacing |

### Rendering Layers

1. **Background Layer** - WebGL canvas (paper-shader) with procedural textured backgrounds
2. **Content Layer** - React DOM for structured content and accessibility
3. **Diagrams** - Inline SVG within DOM (ELK.js, D3.js, or custom)
4. **UI Overlay** - React DOM for controls, progress indicators

### Directory Structure

```
xtoryteller/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Dashboard/gallery view
│   ├── dashboard-explorer.tsx  # Dashboard logic
│   └── [slug]/page.tsx      # Presentation viewer
├── components/              # Global component library (30+ components)
│   └── [component-name]/
│       ├── index.tsx        # React component
│       ├── manifest.yaml    # Agent-readable API
│       └── styles.module.css
├── layouts/                 # Layout definitions (19 layouts)
│   └── [layout-name]/
│       ├── index.tsx
│       ├── manifest.yaml
│       └── styles.module.css
├── transitions/             # Transition & animation presets
│   └── [transition-name]/
│       ├── index.ts
│       └── manifest.yaml
├── backgrounds/             # Shared background presets
│   └── [preset-name].yaml
├── themes/                  # Theme definitions
│   └── [theme-name].yaml
├── presentations/           # User presentations
│   └── [slug]/
│       ├── presentation.yaml
│       ├── assets/
│       ├── components/      # Presentation-scoped components
│       ├── layouts/         # Presentation-scoped layouts
│       └── transitions/     # Presentation-scoped transitions
├── lib/                     # Core runtime library
│   ├── engine/             # Loaders, registries, resolvers
│   ├── machines/           # XState machines
│   ├── runtime/            # Runtime hooks and utilities
│   └── types/              # TypeScript type definitions
├── skills/                  # Canonical agent skill package
│   └── xtoryteller/
│       ├── SKILL.md
│       ├── references/
│       │   ├── guides/
│       │   ├── registries/
│       │   ├── schema/
│       │   └── examples/
│       ├── evals/
│       └── scripts/
├── scripts/                 # Build, validation, and utility scripts
├── tests/                   # Test suites
│   ├── contracts/
│   ├── unit/
│   ├── integration/
│   ├── portability/
│   └── e2e/
└── docs/                    # Long-form documentation
    ├── APRD_Ch*.md         # Architecture specification
    ├── IMPLEMENTATION_PROGRESS.md
    └── QA_SYSTEM_PLAN.md
```

## Development Workflow

### Common Workflows

**Creating a New Presentation:**
1. Use skill package to understand available primitives
2. Create `presentations/<slug>/presentation.yaml`
3. Add assets to `presentations/<slug>/assets/`
4. Validate with `node scripts/validate.mjs presentations/<slug>/presentation.yaml`
5. Run `npm run dev` to view in browser
6. Iterate based on visual feedback

**Creating a New Component:**
1. Use scaffold script: `node skills/xtoryteller/scripts/init-component.mjs --name my-component`
2. Implement component in `components/my-component/index.tsx`
3. Create manifest in `components/my-component/manifest.yaml`
4. Add styles in `components/my-component/styles.module.css`
5. Registry auto-generates on next build/validation

**Creating a Custom Theme:**
1. Copy existing theme as template
2. Modify colors, fonts, spacing in YAML
3. Validate with `node scripts/validate-theme.mjs themes/<theme>.yaml`
4. Reference in presentation with `theme: <theme-slug>`

**Debugging Navigation Issues:**
1. Check XState machine in `lib/machines/presentation-machine.ts`
2. Verify keyboard controls in `app/[slug]/page.tsx`
3. Test with `npm run test:e2e`
4. Check build/transition logic in `lib/runtime/build-plan.ts`

**Portability Workflow:**
1. Export: `node scripts/export.mjs presentations/<slug>`
2. Share ZIP file
3. Import: `node scripts/import.mjs exports/<slug>-complete.zip --confirm`
4. Verify all assets and custom primitives are included

### Initial Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# → http://localhost:3000 (dashboard)
```

### Key NPM Scripts

**Development:**
- `npm run dev` - Start development server with hot reload (Next.js + watcher)
- `npm run thumbnail -- --slug <slug>` - Capture viewer screenshot to `assets/thumbnail.png` (requires dev server; Playwright Chromium)
- `npm run build` - Production build (runs validation first)
- `npm run export` - Static export for simple hosting
- `npm run start` - Start production server

**Validation:**
- `npm run validate` - Validate a single presentation YAML
- `npm run validate:all` - Validate all presentations (refreshes registries first)
- `npm run validate:theme` - Validate a theme YAML
- `npm run registries` - Regenerate component/layout/transition/background registries

**Testing:**
- `npm run test` - Run all tests (contracts, unit, integration, portability, e2e)
- `npm run test:contracts` - Contract tests (manifest/runtime parity)
- `npm run test:unit` - Unit tests
- `npm run test:integration` - Integration tests
- `npm run test:portability` - Portability round-trip tests
- `npm run test:e2e` - End-to-end browser tests
- `npm run test:qa` - Full QA suite

**Portability:**
- `npm run presentation:export` - Export a presentation
- `npm run presentation:import` - Import a presentation
- `npm run component:promote` - Promote presentation-scoped component to global library

### Presentation Creation Flow

1. **Agent reads skill files** - Understands available components, layouts, themes
2. **Agent gathers user content** - Text, notes, outline, or topic description
3. **Agent generates presentation.yaml** - References infrastructure, not inventing markup
4. **User reviews in browser** - Hot reload updates within ~500ms
5. **User provides feedback** - Agent makes targeted edits
6. **Validation passes** - Presentation ready for use

### File Watching & Hot Reload

The development server watches:
- `presentations/*/presentation.yaml` → Browser updates without page reload
- `components/*/index.tsx` → React Fast Refresh
- `themes/*.yaml` → CSS custom properties update
- Component manifests → Registry auto-regenerated

## Component System

### Component Structure

Each component has:
- **TSX implementation** - React functional component
- **YAML manifest** - Agent-readable API documentation
- **CSS module** - Scoped styles (optional)

### Component Props Contract

All components receive:
```typescript
interface ComponentProps {
  content?: string;           // Markdown content
  props?: Record<string, any>; // Component-specific props
  style?: React.CSSProperties; // Inline style overrides
  children?: React.ReactNode;  // For layouts
}
```

### Component Guidelines

1. **Use theme CSS custom properties** - Never hardcode colors or fonts
2. **Responsive by default** - Use `clamp()`, viewport units, no fixed pixels
3. **Semantic HTML** - Choose meaningful elements, not just `<div>`
4. **Accessibility** - ARIA attributes, keyboard support, screen reader announcements
5. **Reduced motion** - Check `prefers-reduced-motion` for animations

### Component Registry

The system includes 30+ components across categories:

**Text & Content:**
- `body-text`, `bullet-list`, `callout`, `blockquote`, `footnote`, `stat-card`
- `card`, `feature-card`, `comparison-card`

**Navigation & Structure:**
- `chapter-nav`, `edge-rail`, `divider`

**Code & Media:**
- `code-block`, `image`, `video`

**Diagrams:**
- `causal-diagram`, `flowchart`, `cycle-diagram`
- `org-chart`, `sankey-diagram`, `iceberg-diagram`
- `mind-map`, `quadrant-diagram`, `coordinate-plot`

Components are auto-discovered from:
1. `/components/` - Global components (available to all presentations)
2. `/presentations/[slug]/components/` - Presentation-scoped components (override global when names collide)

Registry generation: `npm run registries`

## Layout System

Layouts define **spatial arrangement templates** with named slots. Components fill slots by order in the YAML `components` array.

### Available Layouts

The system includes 19 layouts covering Stage and Map presentations:

**Stage Layouts:**
- `title-center` - Centered title + subtitle + label
- `two-column`, `three-column` - Multi-column arrangements
- `content-left-media-right`, `media-left-content-right` - Asymmetric splits
- `full-bleed` - Component fills entire viewport
- `stack` - Vertically stacked with consistent spacing
- `section-header` - Large heading with optional subtitle
- `sidebar-main` - Sidebar with main content area
- `comparison-layout` - Side-by-side comparison
- `gallery` - Horizontal scrolling gallery
- `grid-2x2`, `grid-3x2` - Grid arrangements
- `pyramid-layout` - Pyramid-style stacked rows
- `asymmetric-split` - Uneven column splits
- `framed-rail` - Framed content with rail navigation

**Map Layouts:**
- `scattered` - Organic placement for clusters
- `single-content` - Single cluster content wrapper

### Content Density Guidelines

Each layout has density limits documented in its manifest:
- `two-column`: 1 component per column (4-6 bullets OR 1 diagram OR 1 image)
- `three-column`: 1 compact component per column (3-4 bullets OR 1 stat-card)
- `single-content`: 1 heading + 1 primary component

**Rule: Never cram, never scroll, always split.**

## Background System

### Background Types

The system supports multiple background types:

1. **CSS Backgrounds** - Standard CSS values (colors, gradients, images)
2. **Paper Shaders** - WebGL shaders via `@paper-design/shaders-react`
3. **Background Presets** - Reusable configurations in `backgrounds/*.yaml`

### Background Resolution

Backgrounds can be specified:
- **Inline**: Direct CSS or shader config in presentation YAML
- **Theme-owned**: Background defined in theme (responds to theme switching)
- **Preset reference**: `presetRef: preset-name` to use shared presets
- **APRD style**: `background.stages` / `background.regions` for stage/region switching

### Supported Paper Shaders

The runtime includes curated support for Paper shaders with validated parameters:
- Check `lib/engine/background-preset-registry.ts` for supported shaders
- Each shader has specific parameter validation
- Background transitions interpolate compatible numeric/color properties

### Background Presets

Shared presets in `backgrounds/*.yaml` provide:
- Reusable shader configurations
- Named color palettes
- Consistent visual identity across presentations

Registry generation includes background presets in `skills/xtoryteller/references/registries/`.

## Theme System

### Theme Cascade

```
Theme Defaults → Presentation Overrides → Component Inline Styles
```

### Theme File Structure

Themes are YAML files defining:
- Colors (primary, secondary, accent, text, etc.)
- Fonts (heading, body, mono with source: local/google/fontshare)
- Typography scale (clamp-based responsive sizing)
- Spacing scale
- Border radius, shadows
- Animation easing and duration

### CSS Custom Properties

Themes are resolved to CSS custom properties:
```css
:root {
  --color-primary: #2c3e50;
  --font-heading: 'Playfair Display', serif;
  --text-h1: clamp(2rem, 5vw, 4rem);
  --spacing-content-gap: clamp(1rem, 2vw, 2rem);
}
```

Components reference these properties: `color: var(--color-primary)`

## State Management

### XState Architecture

The presentation runtime uses XState v5 with hierarchical parallel machines:

```
PresentationMachine
├── navigation (parallel)
│   ├── stage (entering → building → exiting)
│   └── map (freeRoam ↔ guided → flying)
├── background (stable ↔ interpolating)
└── ui (progressBar, controls, overlays)
```

**Key State:**
- **Stage Mode**: `currentStepIndex`, `currentBuildIndex`, `isTransitioning`
- **Map Mode**: `cameraPosition {x, y, zoom}`, `isFlying`, `guidedSequence`
- **Background**: `currentShader`, `currentParams`, `interpolationProgress`

**Machine File:** `lib/machines/presentation-machine.ts`
**React Hook:** `lib/runtime/use-presentation-machine.ts`

## Agent Skill System

The agent skill system is the **primary interface** for creating presentations. The canonical deliverable is the agent-agnostic `skills/xtoryteller/` package.

**IMPORTANT**: When helping users create presentations, ALWAYS use the skill system. Read the skill files first to understand available components, layouts, themes, and authoring patterns.

### Skill Structure

```text
skills/
└── xtoryteller/
    ├── SKILL.md                 # Trigger + routing entrypoint
    ├── references/
    │   ├── guides/             # Human-readable scenario and workflow guides
    │   ├── registries/         # Generated component/layout/transition/theme registries
    │   ├── schema/             # JSON schema + human-readable schema summary
    │   └── examples/           # Canonical YAML examples
    ├── evals/                  # Prompt-based coverage checks for the skill
    └── scripts/                # Deterministic helper scripts for repeated tasks
```

### Skill Scripts

The skill package includes scaffolding helpers:

```bash
# Initialize a new presentation
node skills/xtoryteller/scripts/init-presentation.mjs --slug my-talk --mode stage --example simple

# Create a new component
node skills/xtoryteller/scripts/init-component.mjs --name maturity-curve

# Create a new layout
node skills/xtoryteller/scripts/init-layout.mjs --name spotlight-split

# Generate style previews for testing
node skills/xtoryteller/scripts/create-style-previews.mjs --mood calm --topic "Systems Story" --force
```

### Before Creating Presentations

Agents MUST:
1. Read `skills/xtoryteller/SKILL.md` - Entry point and routing
2. Read `skills/xtoryteller/references/registries/component-registry.json` - Available components
3. Read `skills/xtoryteller/references/registries/layout-registry.json` - Available layouts
4. Read `skills/xtoryteller/references/registries/theme-registry.json` - Available themes
5. Read `skills/xtoryteller/references/registries/background-preset-registry.json` - Available background presets
6. Read `skills/xtoryteller/references/guides/` - Authoring guides for Stage and Map modes
7. Read `skills/xtoryteller/references/schema/schema.yaml` - Presentation schema

### Skill Resources

The skill package provides:
- **Guides**: Authoring workflows, architecture overview, density rules
- **Registries**: Auto-generated catalogs of available primitives
- **Schema**: YAML schema with validation rules
- **Examples**: Canonical presentation examples
- **Scripts**: Scaffolding helpers for presentations, components, and layouts
- **Evals**: Coverage prompts for skill evaluation

## Anti-Patterns & Guidelines

### Presentation Authoring

❌ **Don't hardcode colors**
```yaml
style:
  color: "#2c3e50"  # WRONG
```
✅ **Use theme variables**
```yaml
style:
  color: "var(--color-primary)"  # CORRECT
```

❌ **Don't exceed content density limits**
```yaml
# 8 bullet points in two-column layout - WRONG
```
✅ **Split across multiple steps**
```yaml
# 4 bullets in first step, 4 in second - CORRECT
```

❌ **Don't omit build steps for dense content**
```yaml
build: 0  # Everything at once - WRONG
```
✅ **Use sequential builds**
```yaml
build: sequential  # Items appear one by one - CORRECT
```

### Component Development

❌ **Fixed pixel sizes**
```css
font-size: 48px;  /* WRONG */
```
✅ **Theme variables with clamp**
```css
font-size: var(--text-h1);  /* CORRECT - uses clamp() */
```

❌ **Non-semantic HTML**
```tsx
<div className="quote">  {/* WRONG */}
```
✅ **Semantic elements**
```tsx
<figure>
  <blockquote>...</blockquote>
  <figcaption><cite>...</cite></figcaption>
</figure>
```

## Accessibility

Accessibility is non-negotiable. All built-in components:
- Use semantic HTML
- Support keyboard navigation
- Include ARIA attributes
- Ensure 4.5:1 color contrast (WCAG AA)
- Respect `prefers-reduced-motion`
- Provide screen reader announcements

### Keyboard Navigation

**Stage Mode:**
- `→` / `↓` / `Space` - Next build step or next step
- `←` / `↑` - Previous
- `Home` / `End` - Jump to first/last step
- `0-9` - Jump to step N
- `Escape` - Return to dashboard

**Map Mode:**
- Arrow keys - Pan camera
- `+` / `-` - Zoom in/out
- `Tab` - Cycle through clusters
- `Enter` - Navigate to focused cluster
- `G` - Enter guided mode

## Testing & Validation

### Test Structure

The project includes comprehensive testing:

**Contract Tests** (`tests/contracts/`):
- Verify manifest/runtime parity
- Ensure component props match implementations
- Validate layout slot contracts

**Unit Tests** (`tests/unit/`):
- Test individual utilities and functions
- Verify state machine logic
- Test registry generation

**Integration Tests** (`tests/integration/`):
- End-to-end presentation loading
- Navigation workflows
- Theme resolution
- Background rendering

**Portability Tests** (`tests/portability/`):
- Export/import round-trip integrity
- Asset bundling verification
- Component promotion validation

**E2E Tests** (`tests/e2e/`):
- Browser automation with Playwright
- Accessibility testing with axe-core
- Visual regression testing
- Keyboard navigation verification

### Running Tests

```bash
# Run all tests
npm run test:qa

# Run specific test suites
npm run test:contracts
npm run test:unit
npm run test:integration
npm run test:portability
npm run test:e2e
```

## Deployment

### Portability Workflows

Presentations can be packaged, moved, and promoted:

**Export a presentation:**
```bash
node scripts/export.mjs presentations/<slug>
```
Creates a portable ZIP in `exports/` with:
- presentation.yaml
- Assets
- Custom components/layouts/transitions
- Metadata

**Import a presentation:**
```bash
node scripts/import.mjs exports/<slug>-complete.zip
node scripts/import.mjs exports/<slug>-complete.zip --confirm  # Auto-confirm
```

**Promote presentation-scoped components:**
```bash
node scripts/promote-component.mjs <presentation-slug> <component-name>
```
Moves a component from `presentations/<slug>/components/` to global `components/`.

### Vercel Deployment (Primary)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Build Modes

1. **SSR Mode** (default) - Presentations loaded at request time
2. **Static Export** - All presentations pre-rendered at build time

```bash
npm run export  # Static export to out/
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WS_PORT=3001          # WebSocket for hot reload
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Optional; used as default base URL for dev thumbnail capture

# .env.production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

Dashboard card previews use `meta.thumbnail` or the first image/video in the deck. To capture the live viewer to `presentations/<slug>/assets/thumbnail.png` (Playwright), run `npm run thumbnail -- --slug <slug>` while `npm run dev` is up. Build does not auto-generate thumbnails.

## Documentation References

The `doc/APRD_*.md` files contain the complete architectural specification:
- **APRD_Ch1-11.md** - Vision, architecture, data model, navigation, components, layouts, themes, backgrounds, transitions, state management, dashboard
- **APRD_Ch12-18.md** - Agent skill system, rendering pipeline, portability, accessibility, font strategy, developer experience, deployment
- **APRD_Ch19-23.md** - Anti-patterns, component/layout registry, directory structure, MVP scope, future roadmap

**When implementing features**, refer to the APRD for detailed specifications. The APRD is the source of truth for architecture decisions.

## Implementation Status

This project has **Phases 1-3 implemented** with comprehensive runtime, tooling, and testing infrastructure:

**Core Runtime:**
- ✅ Next.js App Router with dashboard and presentation viewer
- ✅ Stage mode (sequential navigation with builds and transitions)
- ✅ Map mode (spatial canvas with free-roam and guided navigation)
- ✅ XState v5 state machines for both navigation modes
- ✅ Theme system with runtime resolution and CSS custom properties
- ✅ Background system (CSS + Paper Shader with presets)
- ✅ Component registry (20+ components)
- ✅ Layout registry (19 layouts)
- ✅ Transition registry with manifest-driven animations

**Tooling & Validation:**
- ✅ YAML schema validation with comprehensive error messages
- ✅ Theme validation
- ✅ Registry auto-generation from manifests
- ✅ Development watcher with hot reload (WebSocket on port 3001)
- ✅ Content density validation for layouts
- ✅ Asset reference integrity checking

**Agent Skill System:**
- ✅ Complete skill package in `skills/xtoryteller/`
- ✅ Generated registries for components, layouts, transitions, themes, backgrounds
- ✅ Authoring guides and schema documentation
- ✅ Example presentations
- ✅ Coverage evaluation prompts

**Testing & QA:**
- ✅ Contract tests (manifest/runtime parity)
- ✅ Unit tests
- ✅ Integration tests
- ✅ Portability round-trip tests
- ✅ E2E browser tests with Playwright
- ✅ Accessibility tests with axe-core

**Portability:**
- ✅ Export presentations to portable ZIP archives
- ✅ Import presentations from archives
- ✅ Promote presentation-scoped components to global library

**Dashboard:**
- ✅ Gallery view with search, filtering, and sorting
- ✅ Grid/list toggle
- ✅ Theme switcher integration

See `docs/IMPLEMENTATION_PROGRESS.md` for detailed phase-by-phase status.

## Key Design Principles

1. **Agent-friendly first** - Data structures designed for AI agents to read and produce
2. **Declarative orchestration** - Presentations as data (YAML), not code
3. **Programmatic extensibility** - Components/layouts are TSX - full programming power
4. **Convention over configuration** - Sensible defaults at every level
5. **Composition over creation** - Assemble from proven presets
6. **Responsive by nature** - Fluid sizing, adapts to any viewport
7. **Incrementally adoptable** - Start with defaults, gradually customize
8. **Validation-first** - Trust but verify; comprehensive validation before rendering
9. **File-system as source of truth** - YAML files drive everything; registries are generated, not manual

## Important Development Notes

**Hot Reload:**
- Development server runs on port 3000
- WebSocket server runs on port 3001 for hot reload
- Changes to YAML, themes, manifests auto-reload in browser
- Registry changes trigger automatic regeneration

**Presentation-Scoped Primitives:**
- Components, layouts, and transitions can live in `presentations/<slug>/`
- These override global primitives when names collide
- Use for presentation-specific custom elements
- Promote to global library when reusable across presentations

**Theme System:**
- Presentations can use shared themes (`theme: theme-name`)
- Or omit theme to follow dashboard's active theme
- Or use `themeOverrides` for one-off customization
- Themes resolve to CSS custom properties
- Always use theme tokens (`var(--color-primary)`) instead of hardcoded values

**Content Density:**
- Never cram content - split across steps or clusters
- Stage mode must stay viewport-locked (no scrolling)
- Use `build: sequential` for progressive reveals
- Respect layout density limits (documented in manifests)

**Validation:**
- Always validate before considering a presentation complete
- Use `npm run validate:all` to validate everything with fresh registries
- Validation checks assets, references, density, navigation integrity

**Background System:**
- Supports CSS backgrounds and Paper shaders
- Use `presetRef` for shared presets
- Theme-owned backgrounds follow theme switching
- APRD-style `background.stages` and `background.regions` supported

**Testing:**
- Write contract tests for new primitives (manifest/runtime parity)
- Add integration tests for complex workflows
- E2E tests verify actual browser behavior
- Portability tests ensure export/import integrity

## Current Capabilities

**What's Working:**
- Full Stage and Map navigation runtimes
- 30+ components (text, navigation, diagrams, media, data viz)
- 19 layouts for both Stage and Map modes
- Theme system with validation and runtime switching
- Background shaders with preset system
- Comprehensive validation (content density, asset references, navigation integrity)
- Agent skill package with guides, registries, examples
- Hot reload development workflow
- Testing infrastructure (contracts, unit, integration, e2e, portability)
- Portability workflows (export, import, promotion)
- Feature-rich dashboard (search, filter, sort, grid/list)

**Partial/In Progress:**
- Advanced annotation system (markdown hover annotations work; broader APRD annotation vision is partial)
- Background transitions (interpolation works for compatible shaders; cross-fade fallback for incompatible types)



