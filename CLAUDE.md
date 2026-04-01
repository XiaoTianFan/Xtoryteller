# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Xtoryteller** is a self-hosted, agent-first presentation infrastructure that merges persistent component infrastructure with agentic content creation. It enables humans to build, evolve, and share visually rich presentations through conversational AI workflows.

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
2. **Map Mode** - Spatial, exploratory navigation with camera pan/zoom across an infinite canvas

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
│   └── [slug]/page.tsx      # Presentation viewer
├── components/              # Global component library
│   └── [component-name]/
│       ├── index.tsx        # React component
│       ├── manifest.yaml    # Agent-readable API
│       └── styles.module.css
├── layouts/                 # Layout definitions
│   └── [layout-name]/
│       ├── index.tsx
│       ├── manifest.yaml
│       └── styles.module.css
├── transitions/             # Transition & animation presets
│   └── [transition-name]/
│       ├── index.ts
│       └── manifest.yaml
├── themes/                  # Theme definitions
│   └── [theme-name].yaml
├── presentations/           # User presentations
│   └── [slug]/
│       ├── presentation.yaml
│       ├── assets/
│       └── components/      # Presentation-scoped components
├── lib/                     # Core runtime library
│   ├── engine/             # Loaders, registries, resolvers
│   ├── machines/           # XState machines
│   ├── renderers/          # React rendering components
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Utilities
├── skills/                  # Canonical agent skill package
│   └── xtoryteller/
│       ├── SKILL.md
│       ├── references/
│       └── scripts/
└── public/fonts/           # Self-hosted fonts
```

## Development Workflow

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

- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build
- `npm run export` - Static export for simple hosting
- `npm run validate` - Validate a presentation YAML
- `npm run validate:all` - Validate all presentations
- `npm run registries` - Regenerate component/layout/transition registries

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

Components are auto-discovered from:
1. `/components/` - Global components (available to all presentations)
2. `/presentations/[slug]/components/` - Presentation-scoped components

Registry generation: `node scripts/generate-registries.js`

## Layout System

Layouts define **spatial arrangement templates** with named slots. Components fill slots by order in the YAML `components` array.

### Built-in Layouts

- `title-center` - Centered title + subtitle + label
- `two-column` - Side-by-side with configurable ratio
- `content-left-media-right` - 60/40 text + media split
- `full-bleed` - Component fills entire viewport
- `stack` - Vertically stacked with consistent spacing
- `scattered` - Organic placement (Map mode clusters)

### Content Density Guidelines

Each layout has density limits documented in its manifest:
- `two-column`: 1 component per column (4-6 bullets OR 1 diagram OR 1 image)
- `three-column`: 1 compact component per column (3-4 bullets OR 1 stat-card)
- `single-content`: 1 heading + 1 primary component

**Rule: Never cram, never scroll, always split.**

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

### Key State

- **Stage Mode**: `currentStepIndex`, `currentBuildIndex`, `isTransitioning`
- **Map Mode**: `cameraPosition {x, y, zoom}`, `isFlying`, `guidedSequence`
- **Background**: `currentShader`, `currentParams`, `interpolationProgress`

## Agent Skill System

The agent skill system is the **primary interface** for creating presentations. The canonical deliverable is the agent-agnostic `skills/xtoryteller/` package.

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

### Before Creating Presentations

Agents MUST:
1. Read `skills/xtoryteller/references/registries/component-registry.json`
2. Read `skills/xtoryteller/references/registries/layout-registry.json`
3. Read `skills/xtoryteller/references/registries/theme-registry.json`
4. Read `skills/xtoryteller/references/guides/architecture-overview.md`
5. Read `skills/xtoryteller/references/schema/schema.yaml`

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

## Deployment

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
SKIP_THUMBNAILS=false             # Skip thumbnail generation

# .env.production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Documentation References

The `doc/APRD_*.md` files contain the complete architectural specification:
- **APRD_Ch1-11.md** - Vision, architecture, data model, navigation, components, layouts, themes, backgrounds, transitions, state management, dashboard
- **APRD_Ch12-18.md** - Agent skill system, rendering pipeline, portability, accessibility, font strategy, developer experience, deployment
- **APRD_Ch19-23.md** - Anti-patterns, component/layout registry, directory structure, MVP scope, future roadmap

**When implementing features**, refer to the APRD for detailed specifications. The APRD is the source of truth for architecture decisions.

## Implementation Status

This project is in **Phase 1: Foundation (MVP Core)**. The APRD documents the complete vision, but implementation is staged:

- ✅ Architecture specification (APRD)
- ⏳ Next.js project setup
- ⏳ Core engine (loaders, registries, resolvers)
- ⏳ XState machines
- ⏳ Component library (10 MVP components)
- ⏳ Layout library (6 MVP layouts)
- ⏳ Theme system
- ⏳ Background shaders
- ⏳ Agent skill system

See APRD Chapter 22 (MVP Scope & Phasing) for detailed implementation checklist.

## Key Design Principles

1. **Agent-friendly first** - Data structures designed for AI agents to read and produce
2. **Declarative orchestration** - Presentations as data (YAML), not code
3. **Programmatic extensibility** - Components/layouts are TSX - full programming power
4. **Convention over configuration** - Sensible defaults at every level
5. **Composition over creation** - Assemble from proven presets
6. **Responsive by nature** - Fluid sizing, adapts to any viewport
7. **Incrementally adoptable** - Start with defaults, gradually customize



