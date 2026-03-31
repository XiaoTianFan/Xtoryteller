# APRD — Xtoryteller

> **Agentic Presentation Runtime & Design Infrastructure**
> A self-hosted, agent-first presentation platform that merges persistent component infrastructure with agentic content creation, enabling humans to build, evolve, and share visually rich presentations through conversational AI workflows.

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Data Architecture](#3-data-architecture)
4. [Navigation Modes](#4-navigation-modes)
5. [Component System](#5-component-system)
6. [Layout System](#6-layout-system)
7. [Theme & Styling System](#7-theme--styling-system)
8. [Background & Shader System](#8-background--shader-system)
9. [Transition & Animation System](#9-transition--animation-system)
10. [State Management](#10-state-management)
11. [Dashboard & Multi-Presentation Management](#11-dashboard--multi-presentation-management)
12. [Agent Skill System](#12-agent-skill-system)
13. [Rendering Pipeline](#13-rendering-pipeline)
14. [Portability & Sharing](#14-portability--sharing)
15. [Accessibility](#15-accessibility)
16. [Font Strategy](#16-font-strategy)
17. [Developer Experience & Tooling](#17-developer-experience--tooling)
18. [Deployment](#18-deployment)
19. [Anti-Patterns & Guidelines](#19-anti-patterns--guidelines)
20. [Preset Component & Layout Registry](#20-preset-component--layout-registry)
21. [Project Directory Structure](#21-project-directory-structure)
22. [MVP Scope & Phasing](#22-mvp-scope--phasing)
23. [Future Roadmap](#23-future-roadmap)

---

## 1. Vision & Philosophy

### 1.1 Project Identity

Xtoryteller is a **self-hosted, agent-first presentation infrastructure** — not merely a tool, but a platform for building, evolving, and sharing a personal presentation system over time. It occupies a unique position in the presentation landscape by merging two historically separate paradigms:

- **Agentic generation**: The ability for AI agents to create complete, polished presentations from user content and intent through conversational workflows
- **Persistent infrastructure**: A durable, growing library of components, layouts, themes, and navigation presets that agents *compose with* rather than regenerate from scratch

The result is a system where each presentation created makes the next one better, where personal aesthetics and storytelling patterns accumulate as reusable assets, and where the endpoint for the user is a conversation with an AI agent — not a manual editing GUI.

### 1.2 Core Philosophy

**Agent as primary creator, human as director.** The user discusses intent, content, and vision with an AI agent. The agent understands the available infrastructure — components, layouts, themes, transitions — and composes presentations by generating structured data files. The user reviews in the browser and iterates through conversation.

**Infrastructure over generation.** Existing agent-based presentation tools generate throwaway HTML each time — every presentation starts from zero, results can be buggy, and there is no accumulation of quality. Xtoryteller inverts this by providing reliable, tested, evolving infrastructure that the agent orchestrates. A generated presentation references proven components rather than inventing markup ad-hoc.

**Gradual aesthetic identity.** The system encourages users to build their own visual identity over time. Default presets provide an immediate starting point, but users (through their agents) can create custom components, refine themes, and develop signature layouts that persist across all future presentations. The infrastructure becomes a personal design system.

**Leverage the browser.** Presentations run in the browser, and Xtoryteller exploits this fully — DOM for structured content and accessibility, WebGL shaders for rich procedural backgrounds, SVG and D3 for data visualization, CSS transforms for spatial navigation. This is not a constrained slide format; it is a web application that happens to present content sequentially.

**Portability and ownership.** Every presentation is a portable, self-contained artifact. Users self-host on their own infrastructure. There is no vendor lock-in, no cloud dependency, no subscription. The project is cloned, dependencies are installed, and the user owns everything.

### 1.3 Design Principles

| Principle | Implication |
|---|---|
| **Agent-friendly first** | Data structures, file formats, documentation, and skill definitions are designed for AI agents to read, understand, and produce — not for human manual editing |
| **Declarative orchestration** | Presentations are described as structured YAML data, not programmatic code — agents generate data reliably, not markup |
| **Programmatic extensibility** | Components, layouts, and transitions are actual TSX/TypeScript code — full power for customization |
| **Convention over configuration** | Sensible defaults at every level; override only what you need |
| **Composition over creation** | Assemble presentations from proven presets; create new primitives only when needed |
| **Responsive by nature** | No fixed borders, no fixed sizes; everything is fluid and adapts to any viewport |
| **Incrementally adoptable** | Start with defaults, gradually customize; the system grows with the user |

### 1.4 Target Users

- **Primary:** Knowledge workers, researchers, educators, consultants who frequently create presentations and want to develop a personal visual storytelling system through AI-assisted workflows
- **Secondary:** Developers and designers who want a programmable, extensible presentation platform
- **Usage model:** User clones the project, installs dependencies, invokes an agent skill, and discusses their presentation with the agent in the terminal. The agent generates the presentation files. The user reviews in the browser. Over time, the user's instance accumulates custom components, themes, and layouts that reflect their personal aesthetic.

---

## 2. System Architecture Overview

### 2.1 Architecture Diagram


┌──────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                       │
│                                                                      │
│   ┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐  │
│   │  Agent CLI   │    │  Browser Client   │    │  Direct File Edit │  │
│   │ (Claude Code,│    │  (Next.js SPA)    │    │  (Manual YAML)    │  │
│   │  Codex, etc.)│    │                   │    │                   │  │
│   └──────┬───────┘    └────────┬──────────┘    └────────┬──────────┘  │
│          │                     │                         │            │
├──────────┼─────────────────────┼─────────────────────────┼────────────┤
│          ▼                     ▼                         ▼            │
│                      FILE SYSTEM LAYER                               │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │presentations/│  │ components/  │  │   themes/    │              │
│   │  *.yaml      │  │  *.tsx       │  │   *.yaml     │              │
│   │  assets/     │  │  manifest.   │  │              │              │
│   │              │  │  yaml        │  │              │              │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│          │                 │                  │                       │
├──────────┼─────────────────┼──────────────────┼───────────────────────┤
│          ▼                 ▼                  ▼                       │
│                    INFRASTRUCTURE LAYER                               │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                    Next.js Application                        │   │
│   │                                                              │   │
│   │  ┌────────────┐  ┌─────────────┐  ┌───────────────────────┐ │   │
│   │  │ Dashboard   │  │ Presentation│  │ Preview Route         │ │   │
│   │  │ /           │  │ /[slug]     │  │ /preview/[temp-id]    │ │   │
│   │  └────────────┘  └──────┬──────┘  └───────────────────────┘ │   │
│   │                         │                                    │   │
│   │  ┌──────────────────────▼──────────────────────────────────┐│   │
│   │  │              Presentation Runtime Engine                 ││   │
│   │  │                                                          ││   │
│   │  │  ┌──────────┐ ┌───────────┐ ┌────────────┐             ││   │
│   │  │  │  XState  │ │ Component │ │  Layout    │             ││   │
│   │  │  │  Machine │ │ Registry  │ │  Engine    │             ││   │
│   │  │  └──────────┘ └───────────┘ └────────────┘             ││   │
│   │  │                                                          ││   │
│   │  │  ┌──────────┐ ┌───────────┐ ┌────────────┐             ││   │
│   │  │  │Transition│ │  Theme    │ │ Background │             ││   │
│   │  │  │ Engine   │ │  Resolver │ │ Shader Mgr │             ││   │
│   │  │  └──────────┘ └───────────┘ └────────────┘             ││   │
│   │  │                                                          ││   │
│   │  │  ┌──────────────────────────────────────────────────┐   ││   │
│   │  │  │         Navigation Controller                     │   ││   │
│   │  │  │    ┌──────────────┐    ┌───────────────┐         │   ││   │
│   │  │  │    │  Map Engine  │    │ Stage Engine   │         │   ││   │
│   │  │  │    │ (DOM+CSS     │    │ (Transition    │         │   ││   │
│   │  │  │    │  Transforms) │    │  Sequencer)    │         │   ││   │
│   │  │  │    └──────────────┘    └───────────────┘         │   ││   │
│   │  │  └──────────────────────────────────────────────────┘   ││   │
│   │  └──────────────────────────────────────────────────────────┘│   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                       RENDERING LAYER                                │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│   │  DOM/React   │  │  SVG/D3      │  │  WebGL (Paper Shaders)   │  │
│   │  Components  │  │  Diagrams    │  │  Backgrounds             │  │
│   └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘


### 2.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js (React) | Familiar to user, strong ecosystem, supports both static export and SSR fallback |
| **Language** | TypeScript | Type safety for component APIs, agent-readable type definitions |
| **State Management** | XState v5 | Complex nested/parallel states for presentation runtime (navigation, transitions, build steps) |
| **Presentation Data** | YAML (with Markdown content) | Agent-reliable, schema-validatable, supports comments and multi-line strings |
| **Component Code** | TSX (React components) | Full programmatic power for visual components |
| **Schema Validation** | JSON Schema (via Ajv or Zod) | Validates presentation YAML before rendering |
| **Diagram Layout** | ELK.js | Auto-layout for graph-based diagrams (causal, mind map, flowchart) |
| **Data Visualization** | D3.js | Data-driven diagrams (Sankey, radar, coordinate plots) |
| **Custom Diagrams** | React + SVG | Structured metaphorical diagrams (iceberg, three horizons, funnel, Venn) |
| **Background Rendering** | paper-shader (WebGL) | Procedural paper-like textured backgrounds with live parameter control |
| **Map Pan/Zoom** | DOM + CSS Transforms + @use-gesture + Framer Motion | Infinite canvas via transform: translate/scale on DOM elements |
| **Animation** | Framer Motion + CSS transitions | Component entrance/exit animations, layout transitions |
| **Fonts** | Local-first + Google Fonts / Fontshare fallback | Self-hosted fonts for offline, CDN for discovery |
| **Styling** | CSS Modules + CSS Custom Properties | Scoped styles per component, theming via variables |
| **Development** | Next.js dev server with file watching | Hot reload on YAML/component changes |
| **Deployment** | Vercel (primary), static export compatible | Simple deploy, with SSR fallback for complex components |

### 2.3 Key Architectural Decisions

**Single Page Application.** The presentation viewer is a single-page application that never triggers page refreshes or remounts during navigation. All transitions — between steps, between clusters, between Map and Stage modes — happen within a single mounted React tree.

**File-system as database.** There is no database. Presentations, components, themes, and layouts are files on disk. The file system *is* the data layer. This aligns with self-hosting, git versioning, and agent workflows (agents read and write files).

**Client-side rendering dominant.** The browser does the heavy lifting — parsing YAML, resolving components, running the state machine, rendering shaders. The server (when present) serves files and handles build-time optimizations. Most functionality works with a pure static export.

**Separation of orchestration and implementation.** Presentation YAML describes *what* to show and *when*. Components/layouts (TSX) describe *how* to render. This separation means agents can create presentations without writing code, and developers can improve rendering without touching presentation content.

---

## 3. Data Architecture

### 3.1 Design Decision: Hybrid Declarative + Programmatic

The data architecture follows a **hybrid approach** that optimizes for different concerns:

| Concern | Format | Rationale |
|---|---|---|
| Presentation orchestration | YAML | Agents generate structured YAML with extremely high reliability; schema-validatable; easily diffable; supports Markdown content via `\|` blocks and comments for agent annotation |
| Content authoring | Markdown within YAML | Natural for agents, rich formatting, familiar syntax |
| Component definitions | TSX code + YAML manifest | Full programmatic power for rendering; manifest provides agent-readable API documentation |
| Layout definitions | TSX code + YAML manifest | Spatial arrangement logic requires code; manifest documents available slots |
| Transition definitions | TypeScript + YAML manifest | Animation logic requires code; manifest documents parameters and feeling |
| Theme / styling | YAML configuration | Just data — colors, fonts, spacing values; no logic needed |
| Background shader config | YAML within presentation | Just parameter values for shader algorithms |
| Navigation sequences | YAML within presentation | Ordered list of anchors/steps; purely data |
| Dashboard metadata | YAML within presentation | Tags, slug, description; purely data |

**YAML over JSON** because:
- Multi-line Markdown content is clean with `|` blocks
- Comments are supported — agents can annotate their reasoning
- Less syntactic noise (no brackets, commas, quotes on keys)
- Agents produce valid YAML at very high reliability rates

### 3.2 Presentation File Schema

Each presentation is a self-contained folder:


presentations/
└── my-talk/
    ├── presentation.yaml     # The presentation definition
    ├── assets/               # Images, videos, local media
    │   ├── hero-image.png
    │   └── demo-video.mp4
    └── components/           # Presentation-scoped custom components (if any)
        └── custom-widget/
            ├── index.tsx
            └── manifest.yaml


The `presentation.yaml` is the central file:

yaml
# ============================================================
# Xtoryteller Presentation
# Generated by agent on 2025-06-20
# ============================================================

# --- Metadata ---
meta:
  title: "Understanding Causal Systems"
  slug: causal-systems
  description: "A primer on systems thinking and causal loop diagrams"
  author: "Jane Doe"
  tags: [systems-thinking, workshop, beginner]
  createdAt: 2025-01-15
  updatedAt: 2025-06-20
  thumbnail: assets/thumbnail.png   # Optional override; auto-generated if omitted

# --- Mode & Navigation ---
mode: stage                         # "stage" or "map"
theme: default                      # References themes/default.yaml

# --- Theme Overrides (optional) ---
themeOverrides:
  colors:
    primary: "#2c3e50"
  fonts:
    heading: "Playfair Display"

# --- Background Configuration ---
background:
  stages:
    - steps: [0, 4]
      shader: grain
      params:
        intensity: 0.4
        scale: 2.0
        color: "#f5f0e8"
    - steps: [5, 11]
      shader: watercolor
      params:
        spread: 0.6
        color: "#e8e4df"
  transition:
    duration: 800
    easing: ease-in-out

# --- Stage Mode Steps ---
steps:
  # Step 0: Title
  - layout: title-center
    transition: fade
    components:
      - type: headline
        content: "Understanding Causal Systems"
        build: 0
      - type: subtitle
        content: "A systems thinking primer"
        build: 1
        enter: fade

  # Step 1: Introduction
  - layout: content-left-media-right
    transition: slide-left
    components:
      - type: body-text
        build: 0
        content: |
          ## What is Systems Thinking?

          Systems thinking is an approach to analysis that focuses
          on the way a system's **constituent parts** interrelate
          and work over time within larger systems.
      - type: image
        build: 1
        enter: scale-in
        props:
          src: assets/hero-image.png
          alt: "Systems diagram overview"
          caption: "A high-level view of interconnected systems"

  # Step 2: Causal Diagram
  - layout: two-column
    transition: slide-left
    components:
      - type: causal-diagram
        build: 0
        enter: fade
        props:
          variables:
            - id: population
              label: "Population"
            - id: births
              label: "Birth Rate"
            - id: resources
              label: "Available Resources"
          edges:
            - from: population
              to: births
              polarity: "+"
            - from: births
              to: population
              polarity: "+"
            - from: population
              to: resources
              polarity: "-"
          style:
            nodeColor: var(--color-primary)
            edgeStyle: solid
      - type: card
        build: 1
        enter: slide-up
        content: |
          ## Reinforcing Loops

          When population increases, birth rate increases,
          creating a **reinforcing** feedback dynamic.

  # Step 3: Key Insights
  - layout: single-content
    transition: fade
    components:
      - type: bullet-list
        build: sequential        # Each bullet appears one by one
        props:
          ordered: false
        items:
          - "Feedback loops drive system behavior"
          - "Delays create oscillation and overshoot"
          - "Mental models often miss non-linear effects"
          - "Leverage points are rarely where we expect"


### 3.3 Map Mode Presentation Schema

When `mode: map`, the structure uses clusters instead of steps:

yaml
mode: map

canvas:
  spacing: 300                    # Default gap between clusters (in logical pixels)
  arrangement: flow               # Auto-arrangement algorithm: flow | radial | tree | grid | manual-relative

clusters:
  - id: intro
    anchor: origin                # First cluster, placed at canvas center
    components:
      - type: headline
        content: "Systems Thinking Map"
      - type: subtitle
        content: "Explore the landscape"

  - id: feedback-loops
    anchor:
      relativeTo: intro
      direction: right            # right | left | above | below | above-right | below-left | etc.
      distance: 400               # Logical pixels from reference cluster
    components:
      - type: card
        content: |
          ## Feedback Loops
          Reinforcing and balancing loops...
      - type: causal-diagram
        props:
          variables: [...]
          edges: [...]

  - id: mental-models
    anchor:
      relativeTo: intro
      direction: below
      distance: 350
    components:
      - type: iceberg-diagram
        props:
          layers:
            - depth: surface
              label: "Events"
              items: ["What happened?"]
            - depth: patterns
              label: "Patterns"
              items: ["What trends are there?"]
            - depth: structures
              label: "Structures"
              items: ["What influences these patterns?"]
            - depth: mental-models
              label: "Mental Models"
              items: ["What assumptions create these structures?"]

  - id: leverage-points
    anchor:
      relativeTo: feedback-loops
      direction: below-right
      distance: 500
    components:
      - type: three-horizons
        props:
          horizon1:
            label: "Current System"
            items: ["Linear thinking", "Siloed analysis"]
          horizon2:
            label: "Transition"
            items: ["Cross-functional teams", "Feedback awareness"]
          horizon3:
            label: "Future System"
            items: ["Holistic design", "Adaptive management"]

# Navigation sequence for guided presentation mode
navigation:
  sequence: [intro, feedback-loops, mental-models, leverage-points]
  transition:
    type: pan-zoom
    duration: 1200
    easing: ease-in-out
  freeRoam: true                 # Allow free navigation outside sequence


### 3.4 Automatic Arrangement Algorithms

When `arrangement` is not `manual-relative`, the system computes cluster positions automatically based on the cluster list order and the chosen algorithm:

| Algorithm | Behavior |
|---|---|
| `flow` | Left-to-right placement, wrapping to next row when reaching a configurable width boundary. Natural reading order. |
| `radial` | Clusters arranged in a circle around the first cluster (origin). Even angular distribution. |
| `tree` | Hierarchical top-down or left-right tree. Cluster order implies parent-child relationships, or explicit `parent` references. |
| `grid` | Regular grid arrangement. Configurable columns. |
| `manual-relative` | Each cluster specifies explicit `anchor.relativeTo`, `direction`, and `distance`. |

All algorithms respect the `canvas.spacing` value as minimum gap between clusters. Users can mix automatic and manual by using an auto algorithm and overriding specific cluster positions with explicit anchors.

### 3.5 Schema Validation

A JSON Schema defines the valid structure of `presentation.yaml`. This schema is:
- Used by a validation script (`node scripts/validate.js presentations/my-talk/presentation.yaml`) to catch errors before rendering
- Referenced in the agent skill documentation so agents understand the exact expected format
- Enforced at runtime when the presentation loader parses the YAML

Validation covers:
- Required fields (meta.title, meta.slug, mode)
- Valid component type references (must exist in global or presentation-scoped registry)
- Valid layout references
- Valid transition references
- Build step index consistency (no gaps, no negative values)
- Theme reference existence
- Asset path existence (warning if file not found)

Error messages are precise and actionable:

Error in presentations/my-talk/presentation.yaml:
  steps[2].components[0].type: "causal-diagrams" is not a registered component.
  Did you mean "causal-diagram"?
  Available components: headline, subtitle, body-text, bullet-list, card,
  causal-diagram, mind-map, iceberg-diagram, ...


### 3.6 Template Expressions in YAML

For cases where limited dynamism is needed without jumping to full TSX, the presentation YAML supports a simple template expression syntax:

yaml
# Inline data block
data:
  teamMembers:
    - name: "Alice"
      role: "Designer"
    - name: "Bob"
      role: "Engineer"
    - name: "Carol"
      role: "Researcher"

steps:
  - layout: gallery
    components:
      - type: profile-card
        repeat: "{{ data.teamMembers }}"
        props:
          name: "{{ item.name }}"
          role: "{{ item.role }}"


Template expressions are limited to:
- Data references (`{{ data.key }}`)
- Item references within `repeat` (`{{ item.field }}`)
- Simple string interpolation (`"Hello, {{ data.name }}"`)
- No conditionals, no logic, no function calls

This keeps the format declarative while avoiding verbose repetition.

---

## 4. Navigation Modes

### 4.1 Overview

Xtoryteller supports two fundamentally different navigation paradigms. A presentation declares its mode in the YAML configuration, and the runtime engine activates the corresponding navigation controller.

| Mode | Concept | Navigation | Content Organization |
|---|---|---|---|
| **The Stage** | Temporal, sequential | Components transition in/out on a fixed stage | Steps with build sequences |
| **The Map** | Spatial, exploratory | Camera pans and zooms across an infinite canvas | Clusters at relative positions |

Both modes share the same component system, theme system, and background shader system. The difference is purely in how content is spatially organized and how the user navigates between content groups.

### 4.2 The Stage

**Concept.** The Stage is a borderless, responsive viewport where content appears and disappears through transitions. There is no concept of a "slide" with fixed boundaries. The stage fills whatever viewport it is presented on, with fluid sizing that adapts to any screen size. The background is fixed (rendered by the shader system), and components enter, animate, and exit on top of it.

**No scrolling — ever.** At any given step, all visible content must fit within the viewport without scrolling. If content exceeds the viewport's capacity for a given layout, it must be split across multiple steps. This is enforced by content density guidelines documented in layout manifests and referenced by the agent skill.

**Steps.** The presentation is organized as an ordered sequence of steps. Each step specifies:
- A layout (spatial arrangement of component slots)
- A set of components filling those slots
- A transition from the previous step
- Build sub-steps within the step

**Build steps.** Within a single step, components can appear incrementally. This is controlled by the `build` property:

| Build Value | Behavior |
|---|---|
| `0` or omitted | Visible immediately when step is entered |
| Integer `n` | Appears on the nth build action (keyboard/click) |
| `sequential` | Each child element (e.g., each bullet) appears on successive build actions |
| `with: n` | Appears simultaneously with build step `n` |

Each component can specify its own `enter` and `exit` animation independently:

yaml
- type: card
  build: 2
  enter: slide-up       # How this component enters
  exit: fade-out         # How this component exits (when step changes)


**Step transitions.** When advancing from one step to the next, a transition defines how the outgoing components exit and incoming components enter. Transitions are registered presets (e.g., `fade`, `slide-left`, `slide-up`, `scale`, `blur`). Components without explicit `enter`/`exit` values inherit the step-level transition.

**Navigation controls.** In Stage mode:
- Arrow keys (right/down = next, left/up = previous)
- Space bar (next)
- Click/tap (next)
- Touch swipe (next/previous)
- Persistent bottom progress rail that stays visible at the viewport edge when the dock is hidden, then shifts upward to sit directly above the dock when the dock slides in, with smooth forward and backward interpolation as navigation changes
- Bottom control dock that fully exits the screen when inactive and reappears from a dedicated hover/focus strip to reveal Previous / Next, step metadata, and the dashboard back action
- Keyboard shortcut to jump to specific step number

### 4.3 The Map

**Concept.** The Map is an infinite 2D canvas where content clusters are spatially arranged. The user explores by panning and zooming, either freely or following a guided sequence. This mode is inspired by tools like Prezi but implemented with DOM elements and CSS transforms for full text fidelity and interactivity.

**Implementation.** The canvas is a large DOM container with `transform: translate(x, y) scale(z)` applied via CSS. Clusters are absolutely positioned DOM elements within this container. Pan and zoom are handled by gesture libraries (`@use-gesture/react`) with smooth spring animations (`framer-motion`). This approach is chosen over canvas-based rendering because:
- Presentation content is fundamentally DOM (text, interactive elements, hover effects)
- Canvas rendering would require reimplementing text layout, accessibility, and hover effects
- CSS transforms handle pan/zoom performantly
- Framer Motion provides smooth animated transitions between viewpoints

**Clusters.** Each cluster is a group of components laid out together at a position on the canvas. Clusters are positioned **relatively** to each other using direction and distance, or automatically by an arrangement algorithm. A cluster can use any layout to arrange its internal components.

**Relative positioning model.** Clusters reference each other by ID:

yaml
- id: problem
  anchor:
    relativeTo: intro       # Reference another cluster
    direction: right        # Compass direction
    distance: 400           # Logical pixels


Supported directions: `right`, `left`, `above`, `below`, `above-right`, `above-left`, `below-right`, `below-left`. The positioning engine resolves all relative references into absolute canvas coordinates at load time, starting from the `origin` cluster.

**Guided sequence.** A `navigation.sequence` array defines the order in which clusters are visited during a guided presentation. When in guided mode:
- Right arrow / space / click advances to the next cluster
- The camera smoothly pans and zooms to frame the next cluster
- Transition parameters (duration, easing) are configurable
- A progress indicator shows position in the sequence and animates smoothly as the viewer advances or moves backward

**Free roam.** When `navigation.freeRoam: true` (default), the user can:
- Pan by dragging
- Zoom with scroll wheel or pinch gesture
- Click on any visible cluster to navigate to it
- Enter/exit guided mode at any time via a UI toggle housed in the bottom control dock
- The guided sequence serves as the "presentation mode"; free roam is the "exploration mode"

**Shared viewer dock.** Stage and Map modes share a common bottom-edge control system: a thin progress rail remains visible at the viewport edge while the dock is hidden, then gets pushed upward by the dock as the control surface slides in from below. The dock itself is rectangular and edge-aligned so it visually reads as a panel sitting directly beneath the rail. A dedicated hover/focus strip just above the rail calls the dock back into view. In Map mode, this dock also contains the guided/free-roam toggle, cluster sequence chips, and the back-to-dashboard action aligned on the right.

**Cluster spacing and visual separation.** Clusters are visually separated by default. The `canvas.spacing` parameter defines the minimum gap. Automatic arrangement algorithms enforce spacing. Users can customize spacing per-cluster via the `distance` property in manual-relative mode.

**Viewport framing.** When navigating to a cluster (in guided mode or by clicking), the camera animates to frame that cluster. Framing means:
- The cluster is centered in the viewport
- Zoom level adjusts so the cluster fills approximately 80% of the viewport (configurable)
- Padding around the cluster is consistent

### 4.4 Navigation Controls Summary

| Control | Stage Mode | Map Mode (Guided) | Map Mode (Free Roam) |
|---|---|---|---|
| Right arrow / Space / Click | Next build step or next step | Next cluster in sequence | — |
| Left arrow | Previous build step or previous step | Previous cluster in sequence | — |
| Scroll wheel | — | — | Zoom in/out |
| Drag | — | — | Pan |
| Pinch | — | — | Zoom in/out |
| Click on cluster | — | — | Navigate to cluster |
| Escape | — | Exit guided mode | — |
| Enter / Play button | — | Enter guided mode | Enter guided mode |
| Number keys | Jump to step N | Jump to cluster N in sequence | — |

---

## 5. Component System

### 5.1 Architecture

Components are the atomic visual building blocks of Xtoryteller. Each component is a React (TSX) module paired with a YAML manifest that describes its API for agents and the registry.

**Component structure:**

components/
└── causal-diagram/
    ├── index.tsx              # React component implementation
    ├── manifest.yaml          # Agent-readable API documentation
    ├── styles.module.css      # Scoped styles (optional, can use CSS-in-JS)
    └── README.md              # Human documentation (optional)


**Two scopes:**
- **Global components** (`/components/`): Available to all presentations. Ship with the project as built-in presets. User can add custom components here to make them globally available.
- **Presentation-scoped components** (`/presentations/my-talk/components/`): Bundled with a specific presentation. Used for one-off custom visuals. Can be "promoted" to global by copying to the global directory.

### 5.2 Component Implementation (TSX)

Every component receives a standardized set of props:

tsx
// components/card/index.tsx
import React from 'react';
import styles from './styles.module.css';

export interface CardProps {
  // Content — typically from Markdown in YAML
  content?: string;

  // Component-specific props — defined in manifest
  variant?: 'default' | 'elevated' | 'outlined';
  header?: string;
  footer?: string;

  // Style overrides — passed from presentation YAML
  style?: React.CSSProperties;

  // Theme variables are available via CSS custom properties
  // Components should reference var(--color-primary), etc.
  // NOT hardcode colors

  // Children — for slot-based layouts
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  content,
  variant = 'default',
  header,
  footer,
  style,
  children,
}) => {
  return (
    <div
      className={`${styles.card} ${styles[variant]}`}
      style={style}
    >
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.body}>
        {content && <MarkdownRenderer content={content} />}
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default Card;


**Component contracts:**
- All components must be default-exported React functional components
- All components must accept an optional `style` prop for inline overrides
- All components must reference theme CSS custom properties, never hardcode visual values
- All components must be responsive — use `clamp()`, relative units, no fixed pixel sizes
- All typography within components must use `clamp()` for font sizes
- All components must respect `prefers-reduced-motion` for any internal animations
- All components must use semantic HTML and include appropriate ARIA attributes
- Content text (from Markdown) is rendered through a shared `MarkdownRenderer` utility

### 5.3 Component Manifest (YAML)

The manifest is the **agent-facing API documentation** for a component. Agents read manifests to understand what components are available and how to use them.

yaml
# components/causal-diagram/manifest.yaml
name: causal-diagram
displayName: "Causal Loop Diagram"
description: >
  Renders a causal loop diagram showing variables connected by
  directed edges with polarity labels (+/-). Automatically lays out
  nodes using ELK.js. Supports hover effects on nodes to show
  additional detail.
category: diagram
version: 1.0.0

# Content: does this component accept Markdown content?
content: false        # Causal diagrams use structured props, not free text

# Props schema — this is what the agent uses to generate valid YAML
props:
  variables:
    type: "array<{ id: string, label: string, detail?: string }>"
    required: true
    description: "List of variables (nodes) in the diagram"
    example:
      - id: population
        label: "Population"
        detail: "Total population count in the system"
      - id: births
        label: "Birth Rate"
  edges:
    type: "array<{ from: string, to: string, polarity: '+' | '-', label?: string }>"
    required: true
    description: "Directed edges between variables with polarity"
    example:
      - from: population
        to: births
        polarity: "+"
        label: "drives"
  layoutDirection:
    type: "enum"
    values: [horizontal, vertical, radial]
    default: horizontal
    description: "Primary layout direction for the graph"
  style:
    type: object
    description: "Visual style overrides"
    properties:
      nodeColor:
        type: color
        default: "var(--color-primary)"
      edgeColor:
        type: color
        default: "var(--color-secondary)"
      edgeStyle:
        type: enum
        values: [solid, dashed, dotted]
        default: solid
      nodeRadius:
        type: number
        default: 40
      fontSize:
        type: string
        default: "var(--body-size)"

# Hover behavior
hover:
  supported: true
  description: "Hovering a node shows its 'detail' text in a tooltip"

# Content density guidance for agents
density:
  minWidth: "50%"       # Minimum layout width this component needs
  maxNodes: 12          # Beyond this, diagram becomes cluttered
  recommendation: "Use full-width or two-column layout. For more than 8 variables, consider splitting into sub-diagrams."

# Build step behavior
buildBehavior:
  supported: true
  description: "Can reveal nodes and edges incrementally by build step"
  modes:
    - all-at-once       # Everything appears together
    - nodes-first       # Nodes appear, then edges animate in
    - sequential        # Nodes and their edges appear one by one


### 5.4 Component Registry

At build time (or dev server startup), the system scans both global and presentation-scoped component directories, reads all manifests, and builds a **component registry**. This registry:

- Maps component `name` to its React module and manifest
- Validates that all components referenced in presentation YAML exist in the registry
- Is serialized as a JSON file that agents can read to discover available components
- Resolves naming conflicts (presentation-scoped takes precedence over global for that presentation)

typescript
// Conceptual registry interface
interface ComponentRegistry {
  components: {
    [name: string]: {
      module: React.ComponentType<any>;
      manifest: ComponentManifest;
      scope: 'global' | 'presentation';
      path: string;
    };
  };

  // For agents: returns a simplified list of available components
  getAgentSummary(): ComponentSummary[];

  // Resolve a component type name to its React component
  resolve(typeName: string): React.ComponentType<any> | null;
}


### 5.5 Built-in Component Preset Categories

The following components ship with Xtoryteller as built-in presets. Each follows the TSX + manifest pattern described above. Detailed specifications per component are in [Section 20: Preset Component & Layout Registry](#20-preset-component--layout-registry).

**Basic Content Components:**
`headline`, `subtitle`, `body-text`, `bullet-list`, `numbered-list`, `blockquote`, `callout`, `footnote`, `label`, `divider`

**Media Components:**
`image`, `video`, `svg-graphic`, `iframe-embed`, `code-block`, `icon`

The built-in `icon` preset resolves [Lucide](https://lucide.dev/icons/) icons by name by default. Custom SVG icons are supported only through an explicit override when bespoke artwork is specifically required.

**Card & Container Components:**
`card`, `stat-card`, `profile-card`, `feature-card`, `comparison-card`, `timeline-item`

**Diagram Components (Differentiators):**
`causal-diagram`, `mind-map`, `iceberg-diagram`, `three-horizons`, `quadrant-chart`, `spectrum-bar`, `funnel-diagram`, `venn-diagram`, `flowchart`, `stakeholder-map`, `radar-chart`, `timeline`, `org-chart`, `cycle-diagram`, `sankey-diagram`, `coordinate-plot`

**Interactive / Advanced Components (Future, schema-ready):**
`toggle-reveal`, `tab-group`, `accordion`, `hover-annotation`, `live-counter`, `progress-bar`, `code-runner`

### 5.6 Hover Annotation System

All components — and especially diagram components — support an optional hover annotation system. Any element within a component can be marked as hoverable, triggering a tooltip or popover with additional explanation.

For diagram components, this is built into the node/label data:

yaml
# In presentation YAML
- type: causal-diagram
  props:
    variables:
      - id: population
        label: "Population"
        detail: |
          Total population count. This is the key
          accumulation variable in the system.


For other components, the `hover-annotation` component can wrap any content:

yaml
- type: body-text
  content: |
    The concept of {{hover:leverage points}} is central
    to systems thinking.
  annotations:
    leverage-points: |
      Places in the system where a small change can
      lead to large shifts in behavior. Donella Meadows
      identified 12 leverage points.


The annotation syntax (`{{hover:id}}`) is processed by the Markdown renderer, which replaces it with an interactive hover target linked to the annotation text.

---

## 6. Layout System

### 6.1 Concept

Layouts are **spatial arrangement templates** that define where components are placed within a step (Stage mode) or cluster (Map mode). A layout defines **slots** — named regions that components fill. Layouts handle responsive behavior, ensuring content adapts to any viewport size.

Layouts are distinct from components: a component defines *what* to render; a layout defines *where* to place it.

### 6.2 Layout Implementation

Each layout is a TSX module + YAML manifest:


layouts/
└── two-column/
    ├── index.tsx
    ├── manifest.yaml
    └── styles.module.css


tsx
// layouts/two-column/index.tsx
import React from 'react';
import styles from './styles.module.css';

export interface TwoColumnLayoutProps {
  children: React.ReactNode[];
  ratio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70';
  gap?: string;
  verticalAlign?: 'top' | 'center' | 'bottom';
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  children,
  ratio = '50-50',
  gap,
  verticalAlign = 'center',
}) => {
  const [left, right] = ratio.split('-').map(Number);

  return (
    <div
      className={styles.container}
      style={{
        gridTemplateColumns: `${left}fr ${right}fr`,
        gap: gap || 'var(--content-gap)',
        alignItems: verticalAlign === 'center' ? 'center'
          : verticalAlign === 'top' ? 'start' : 'end',
      }}
    >
      <div className={styles.column}>{children[0]}</div>
      <div className={styles.column}>{children[1]}</div>
    </div>
  );
};

export default TwoColumnLayout;


yaml
# layouts/two-column/manifest.yaml
name: two-column
displayName: "Two Column"
description: "Split content into two columns with configurable ratio"
category: split

slots:
  - name: left
    index: 0
    description: "Left column content"
  - name: right
    index: 1
    description: "Right column content"

props:
  ratio:
    type: enum
    values: ['50-50', '60-40', '40-60', '70-30', '30-70']
    default: '50-50'
    description: "Width ratio between left and right columns"
  gap:
    type: string
    default: "var(--content-gap)"
    description: "Gap between columns (CSS value)"
  verticalAlign:
    type: enum
    values: [top, center, bottom]
    default: center
    description: "Vertical alignment of column content"

# Content density limits for agent guidance
density:
  perSlot:
    - slot: left
      max: "1 heading + 4-6 bullets OR 1 diagram OR 1 image with caption"
    - slot: right
      max: "1 heading + 4-6 bullets OR 1 diagram OR 1 image with caption"
  recommendation: "Each column should contain at most one primary component. Avoid stacking multiple complex components in a single column."

responsive:
  breakpoint: 768px
  behavior: "Columns stack vertically below breakpoint"


### 6.3 Slot Assignment in Presentation YAML

Components are assigned to layout slots by their order in the `components` array. The first component fills slot 0, the second fills slot 1, etc.

yaml
- layout: two-column
  layoutProps:
    ratio: '60-40'
    verticalAlign: top
  components:
    - type: body-text          # Fills slot 0 (left column)
      content: "..."
    - type: causal-diagram     # Fills slot 1 (right column)
      props: { ... }


For layouts with more than two slots (e.g., `grid-2x2` with 4 slots), components are assigned sequentially. If fewer components are provided than slots, remaining slots are empty. If more components are provided, excess components are ignored (with a validation warning).

### 6.4 Built-in Layout Presets

| Layout | Slots | Description |
|---|---|---|
| `title-center` | 1-3 | Centered title + optional subtitle + optional label. Vertically and horizontally centered. |
| `title-left` | 1-3 | Left-aligned title block with optional subtitle and decorative element. |
| `section-header` | 1-2 | Bold section divider with section number/label. Full-width emphasis. |
| `single-content` | 1 | One component, centered with padding. For featured diagrams, images, or text blocks. |
| `two-column` | 2 | Configurable ratio split. Responsive stacking below breakpoint. |
| `three-column` | 3 | Three equal columns. Responsive: 3 → 2 → 1 column at breakpoints. |
| `content-left-media-right` | 2 | Text content on left (60%), media on right (40%). Optimized for text + image/diagram. |
| `media-left-content-right` | 2 | Media on left (40%), text on right (60%). Mirror of above. |
| `top-bottom` | 2 | Stacked vertically, two regions. Configurable ratio. |
| `grid-2x2` | 4 | Four equal quadrants. For card grids, comparison matrices. |
| `grid-3x2` | 6 | Six cells (3 columns × 2 rows). For feature grids. |
| `sidebar-main` | 2 | Narrow sidebar (25-30%) + wide main area (70-75%). |
| `full-bleed` | 1 | Component fills entire viewport edge-to-edge. For full-screen images, videos, diagrams. |
| `gallery` | N | Variable number of items in a responsive CSS grid. Auto-fit columns. |
| `stack` | N | Vertically stacked components with consistent spacing. Simple flow. |
| `scattered` | N | Components placed at specified relative positions. For Map mode clusters with organic placement. |
| `timeline-layout` | N | Horizontal or vertical timeline arrangement with connected events. |
| `comparison-layout` | 2 | Side-by-side with visual divider between panels. |
| `pyramid-layout` | 3-5 | Triangular arrangement with items stacked in widening rows. |

### 6.5 Content Density Guidelines

Each layout manifest includes `density` guidance that agents reference when deciding how to distribute content. These are **defaults** — users can explicitly override them if they accept the risk of viewport overflow.

| Layout | Maximum Content Per Step |
|---|---|
| `title-center` | 1 headline + 1 subtitle + optional label |
| `single-content` | 1 heading + 1 component (diagram, image, or text block) |
| `two-column` | 1 heading + 2 components (each: 4-6 bullets OR 1 diagram OR 1 image + caption) |
| `three-column` | 1 heading + 3 compact components (each: 3-4 bullets OR 1 stat-card) |
| `grid-2x2` | 1 heading + 4 cards (each: title + 2-3 lines) |
| `content-left-media-right` | 1 heading + 4-6 bullets + 1 image/diagram |
| `full-bleed` | 1 image/video OR 1 large diagram (no text overlay by default) |
| `comparison-layout` | 1 heading + 2 comparison panels (each: title + 3-4 points) |
| `gallery` | 1 heading + up to 9 items (3×3 grid) |
| `stack` | Up to 5 stacked components (depends on individual component heights) |

**When content exceeds limits:** The agent must split content across multiple steps. Never cram, never overflow. This is a non-negotiable constraint in Stage mode.

### 6.6 Responsive Behavior

All layouts must implement responsive behavior:
- **Width breakpoints:** 1200px (large), 900px (medium), 600px (small)
- **Height breakpoints:** 700px, 600px, 500px
- **Stacking:** Multi-column layouts stack to single column below their responsive breakpoint
- **Scaling:** All spacing, padding, and gaps use `clamp()` or CSS custom properties that scale
- **Hiding:** Non-essential decorative elements hide at the smallest breakpoints
- **Grid collapse:** Grid layouts reduce column count at narrower viewports

---

## 7. Theme & Styling System

### 7.1 Architecture

The theme system provides a cascading hierarchy of visual configuration:


Theme Defaults → Presentation Overrides → Component Inline Styles


Each layer can override specific values from the layer below. This provides consistency (theme sets the baseline) with flexibility (individual presentations and components can deviate).

### 7.2 Theme File Structure

Themes are YAML files in the `/themes/` directory:

yaml
# themes/default.yaml
name: default
displayName: "Xtoryteller Default"
description: "Clean, warm, professional default theme"
version: 1.0.0

colors:
  primary: "#2c3e50"
  secondary: "#e74c3c"
  accent: "#3498db"
  background: "#faf8f5"
  surface: "#ffffff"
  text:
    primary: "#1a1a1a"
    secondary: "#555555"
    muted: "#999999"
    inverse: "#ffffff"
  border: "#e0ddd8"
  success: "#27ae60"
  warning: "#f39c12"
  error: "#e74c3c"
  info: "#3498db"

fonts:
  heading:
    family: "Playfair Display"
    weights: [400, 700, 900]
    source: local                # local | google | fontshare
  body:
    family: "Inter"
    weights: [300, 400, 500, 600]
    source: local
  mono:
    family: "JetBrains Mono"
    weights: [400, 500]
    source: local

typography:
  scale:
    h1: "clamp(2rem, 5vw, 4rem)"
    h2: "clamp(1.5rem, 3.5vw, 2.5rem)"
    h3: "clamp(1.25rem, 2.5vw, 1.75rem)"
    body: "clamp(0.875rem, 1.5vw, 1.125rem)"
    small: "clamp(0.75rem, 1vw, 0.875rem)"
    caption: "clamp(0.65rem, 0.8vw, 0.75rem)"
  lineHeight:
    heading: 1.2
    body: 1.6
    tight: 1.3
  letterSpacing:
    heading: "-0.02em"
    body: "0"
    wide: "0.05em"

spacing:
  base: 8                       # Base unit in pixels
  scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
  slideP adding: "clamp(1.5rem, 4vw, 4rem)"
  contentGap: "clamp(1rem, 2vw, 2rem)"
  elementGap: "clamp(0.5rem, 1vw, 1rem)"

borders:
  radius:
    small: "4px"
    medium: "8px"
    large: "16px"
    round: "9999px"
  width: "1px"

shadows:
  small: "0 1px 3px rgba(0, 0, 0, 0.08)"
  medium: "0 4px 12px rgba(0, 0, 0, 0.1)"
  large: "0 8px 32px rgba(0, 0, 0, 0.12)"
  glow: "0 0 20px rgba(52, 152, 219, 0.3)"

animation:
  easing:
    default: "cubic-bezier(0.16, 1, 0.3, 1)"      # Expo out
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)"
  duration:
    fast: "200ms"
    normal: "400ms"
    slow: "800ms"
    xslow: "1200ms"


### 7.3 Theme Resolution to CSS Custom Properties

At runtime, the theme YAML is resolved into CSS custom properties injected into the document root. This allows all components to reference theme values without import:

css
/* Auto-generated from themes/default.yaml */
:root {
  --color-primary: #2c3e50;
  --color-secondary: #e74c3c;
  --color-accent: #3498db;
  --color-background: #faf8f5;
  --color-surface: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #555555;
  --color-text-muted: #999999;
  --color-text-inverse: #ffffff;
  --color-border: #e0ddd8;

  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-h1: clamp(2rem, 5vw, 4rem);
  --text-h2: clamp(1.5rem, 3.5vw, 2.5rem);
  --text-h3: clamp(1.25rem, 2.5vw, 1.75rem);
  --text-body: clamp(0.875rem, 1.5vw, 1.125rem);
  --text-small: clamp(0.75rem, 1vw, 0.875rem);

  --line-height-heading: 1.2;
  --line-height-body: 1.6;

  --spacing-slide-padding: clamp(1.5rem, 4vw, 4rem);
  --spacing-content-gap: clamp(1rem, 2vw, 2rem);
  --spacing-element-gap: clamp(0.5rem, 1vw, 1rem);

  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 16px;

  --shadow-small: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.1);

  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-normal: 400ms;
}


### 7.4 Presentation-Level Overrides

A presentation can override specific theme values:

yaml
# In presentation.yaml
theme: default
themeOverrides:
  colors:
    primary: "#1a7f5a"          # Override just this one value
    accent: "#ff6b35"
  fonts:
    heading:
      family: "Cormorant"
      source: google
  typography:
    scale:
      h1: "clamp(2.5rem, 6vw, 5rem)"   # Larger titles for this talk


Overrides are **merged** with the theme defaults — only specified keys are replaced. The theme resolver applies overrides before generating CSS custom properties.

### 7.5 Component Inline Style Overrides

Individual components in the presentation YAML can override styles:

yaml
- type: headline
  content: "Special Emphasis Title"
  style:
    color: "#ff0000"              # One-off override
    fontSize: "clamp(3rem, 8vw, 6rem)"
    textAlign: center


The `style` property maps to React's `CSSProperties` and is applied as inline styles on the component's root element. Inline styles have the highest specificity in the cascade.

**Cascade summary:**
1. **Theme YAML** → CSS custom properties on `:root`
2. **Presentation `themeOverrides`** → Merged into CSS custom properties, overriding specific values
3. **Component `style`** → React inline styles on the element, highest specificity

### 7.6 Theme Creation

Users can create new themes by:
1. Copying an existing theme YAML and modifying values
2. Asking the agent to generate a theme based on a mood/feeling description
3. The agent's style discovery sub-pipeline (generates 3 theme variants, user picks one)

Themes are standalone files. A project can have any number of themes. Different presentations can reference different themes.

---

## 8. Background & Shader System

### 8.1 Overview

Xtoryteller uses the **paper-shader** library to render procedural, WebGL-based textured backgrounds that give presentations a distinctive, crafted visual quality. Unlike static CSS gradients or image backgrounds, paper-shader produces generative textures — grain, watercolor washes, parchment fibers, noise fields — that are rendered in real-time on a WebGL canvas behind the presentation content.

The background system is:
- **Configurable per presentation** — shader algorithm and parameters defined in YAML
- **Dynamic across sections** — different steps/clusters can have different shader configurations
- **Smoothly interpolated** — parameters transition smoothly between sections
- **Customizable in real time** — parameters can be tweaked live during development
- **Extensible** — users can replace paper-shader with custom WebGL backgrounds

### 8.2 Paper Shader Integration

The paper-shader library exposes shader presets, each with numeric parameters that control the visual output. The Xtoryteller background manager wraps this library in a React component that:

1. Renders a full-viewport WebGL canvas behind all presentation content (z-index: -1)
2. Reads shader configuration from the presentation YAML
3. Applies the correct shader preset and parameters for the current step/cluster
4. Interpolates parameters smoothly when transitioning between sections with different configurations

**Background component hierarchy:**


<PresentationRoot>
  <BackgroundLayer>           ← Full-viewport WebGL canvas
    <PaperShaderRenderer />   ← Manages shader lifecycle
  </BackgroundLayer>
  <ContentLayer>              ← DOM content on top
    <NavigationController />
  </ContentLayer>
</PresentationRoot>


### 8.3 Configuration Schema

Background configuration lives within the presentation YAML:

yaml
# Simple: single shader for entire presentation
background:
  shader: grain
  params:
    intensity: 0.4
    scale: 2.0
    color: "#f5f0e8"


yaml
# Advanced: different shaders per section with smooth transitions
background:
  stages:
    - steps: [0, 4]               # Active during steps 0 through 4
      shader: grain
      params:
        intensity: 0.4
        scale: 2.0
        color: "#f5f0e8"
    - steps: [5, 8]               # Active during steps 5 through 8
      shader: watercolor
      params:
        spread: 0.6
        color: "#e8e4df"
    - steps: [9, 12]              # Active during steps 9 through 12
      shader: grain
      params:
        intensity: 0.7
        scale: 1.5
        color: "#d4cfc8"

  transition:
    duration: 800                  # Interpolation duration in ms
    easing: ease-in-out            # Easing function for parameter interpolation


For Map mode, background configuration references cluster IDs instead of step indices:

yaml
background:
  regions:
    - clusters: [intro, problem]
      shader: grain
      params:
        intensity: 0.3
        color: "#f5f0e8"
    - clusters: [solution, conclusion]
      shader: watercolor
      params:
        spread: 0.5
        color: "#e0e8f0"

  transition:
    duration: 1000
    easing: ease-in-out


### 8.4 Parameter Interpolation

When the presentation transitions between sections that have different shader configurations, the background manager smoothly interpolates between parameter sets:

- **Same shader, different params:** Numeric parameters are linearly interpolated over the transition duration. Color parameters are interpolated in LAB color space for perceptual smoothness.
- **Different shaders:** Cross-fade between the two shader outputs. The outgoing shader fades out while the incoming shader fades in, using two shader passes during the transition period.

The interpolation is driven by the XState presentation machine — the background manager subscribes to step/cluster transition events and computes interpolation progress based on elapsed time.

typescript
// Conceptual interpolation logic
interface ShaderState {
  shader: string;
  params: Record<string, number | string>;
}

function interpolateParams(
  from: ShaderState,
  to: ShaderState,
  progress: number // 0 to 1
): ShaderState {
  if (from.shader === to.shader) {
    // Same shader: interpolate each numeric param
    const interpolated = {};
    for (const key of Object.keys(to.params)) {
      if (typeof to.params[key] === 'number') {
        interpolated[key] = lerp(from.params[key], to.params[key], progress);
      } else if (isColor(to.params[key])) {
        interpolated[key] = interpolateColorLAB(from.params[key], to.params[key], progress);
      } else {
        interpolated[key] = progress < 0.5 ? from.params[key] : to.params[key];
      }
    }
    return { shader: to.shader, params: interpolated };
  } else {
    // Different shaders: cross-fade
    return {
      crossFade: true,
      from: { ...from, opacity: 1 - progress },
      to: { ...to, opacity: progress },
    };
  }
}


### 8.5 Background Extensibility

While paper-shader is the default and recommended background system, users can replace or supplement it:

- **Custom shader component:** A user can create a custom background component that implements the same interface (`shader`, `params`, reactive to state changes) and register it as an alternative background renderer.
- **Static backgrounds:** For simplicity, a user can specify a plain CSS background instead of a shader:

yaml
background:
  type: css
  value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"


- **No background:** Set `background: none` to render content on the default theme background color.

The background system checks the `type` field (defaulting to `paper-shader` if absent) and delegates to the appropriate renderer.

### 8.6 Performance Considerations

- The WebGL canvas runs on the GPU; it does not impact DOM rendering performance
- Shader rendering is paused when the browser tab is not visible (`document.hidden`)
- On devices without WebGL support, the system falls back to a static CSS background derived from the shader's `color` parameter
- The background canvas is rendered at a configurable resolution factor (default: 1.0, can be reduced to 0.5 for performance on low-end devices)
- Cross-fade transitions temporarily require two shader passes; this is bounded to the transition duration and should not cause sustained performance issues

---

## 9. Transition & Animation System

### 9.1 Architecture

Transitions define how components and content groups animate when navigating between steps (Stage mode) or clusters (Map mode). The transition system has three layers:

| Layer | Scope | Examples |
|---|---|---|
| **Step transitions** | How one step replaces another | `fade`, `slide-left`, `slide-up`, `scale`, `blur` |
| **Component enter/exit** | How individual components appear/disappear within a step | `fade`, `slide-up`, `scale-in`, `blur-in`, `drop` |
| **Map navigation** | How the camera moves between clusters | `pan-zoom` (with configurable duration and easing) |

### 9.2 Transition Preset Structure

Each transition is a registered preset with implementation code and a YAML manifest:


transitions/
├── fade/
│   ├── index.ts
│   └── manifest.yaml
├── slide-left/
│   ├── index.ts
│   └── manifest.yaml
├── slide-up/
│   ├── index.ts
│   └── manifest.yaml
├── scale-in/
│   ├── index.ts
│   └── manifest.yaml
└── ...


### 9.3 Transition Manifest

yaml
# transitions/slide-up/manifest.yaml
name: slide-up
displayName: "Slide Up"
description: "Content slides upward into view from below, creating a sense of emergence and forward momentum"
category: dynamic
feeling: [energetic, confident, forward-moving]

params:
  duration:
    type: number
    default: 500
    unit: ms
    description: "Animation duration"
  distance:
    type: number
    default: 40
    unit: px
    description: "Distance the element travels"
  easing:
    type: string
    default: "cubic-bezier(0.16, 1, 0.3, 1)"
    description: "CSS easing function"

animation:
  enter:
    from: { opacity: 0, transform: "translateY({{distance}}px)" }
    to: { opacity: 1, transform: "translateY(0)" }
  exit:
    from: { opacity: 1, transform: "translateY(0)" }
    to: { opacity: 0, transform: "translateY(-{{distance}}px)" }


### 9.4 Transition Implementation

typescript
// transitions/slide-up/index.ts
import { TransitionDefinition } from '@/types/transitions';

export const slideUp: TransitionDefinition = {
  name: 'slide-up',

  enter: (element: HTMLElement, params: Record<string, any>) => {
    const { duration = 500, distance = 40, easing = 'cubic-bezier(0.16, 1, 0.3, 1)' } = params;

    return element.animate(
      [
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    );
  },

  exit: (element: HTMLElement, params: Record<string, any>) => {
    const { duration = 500, distance = 40, easing = 'cubic-bezier(0.16, 1, 0.3, 1)' } = params;

    return element.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: `translateY(-${distance}px)` },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    );
  },
};

export default slideUp;


### 9.5 Built-in Transition Presets

#### Step Transitions

| Transition | Category | Feeling | Description |
|---|---|---|---|
| `fade` | Subtle | Calm, professional, minimal | Simple opacity crossfade. Universal default. |
| `slide-left` | Dynamic | Forward-moving, progressive | Content slides in from right, exits to left. Implies progression. |
| `slide-right` | Dynamic | Retrospective, reviewing | Content slides in from left, exits to right. Implies looking back. |
| `slide-up` | Dynamic | Energetic, emerging, building | Content rises from below. Implies growth. |
| `slide-down` | Dynamic | Settling, grounding | Content descends from above. Implies arrival. |
| `scale` | Dramatic | Impactful, focused | Content scales from 90% to 100% with fade. Subtle zoom-in effect. |
| `scale-out` | Dramatic | Expanding, broadening | Content scales from 110% to 100%. Feels like zooming out to see bigger picture. |
| `blur` | Cinematic | Dreamy, reflective, transitional | Content fades in from a blur. Feels like focusing. |
| `wipe-left` | Bold | Decisive, clean | Hard edge wipe from right to left using clip-path. |
| `wipe-up` | Bold | Revealing, unveiling | Hard edge wipe from bottom to top. |
| `none` | — | — | Instant switch, no animation. For rapid builds. |

#### Component Enter Animations

| Animation | Feeling | Description |
|---|---|---|
| `fade` | Neutral | Opacity 0 → 1 |
| `slide-up` | Emergence | Translate Y + fade |
| `slide-down` | Arrival | Translate Y (negative) + fade |
| `slide-left` | Forward | Translate X + fade |
| `slide-right` | Backward | Translate X (negative) + fade |
| `scale-in` | Focus | Scale 0.85 → 1 + fade |
| `scale-up` | Growth | Scale 0 → 1 (from nothing) |
| `blur-in` | Focus | Blur 10px → 0 + fade |
| `drop` | Playful | Translate Y (large negative) with bounce easing |
| `flip` | Reveal | RotateX 90° → 0° + fade |
| `typewriter` | Technical | Characters appear sequentially (text components only) |
| `draw` | Artistic | SVG stroke animation (SVG/diagram components only) |
| `none` | — | Instant appearance |

#### Component Exit Animations

Each enter animation has a corresponding exit animation (the reverse). If a component specifies an `enter` but no `exit`, the exit defaults to the reverse of the enter. If neither is specified, both default to `fade`.

### 9.6 Transition Application Rules

**Step-level transition** sets the default for all components in that step:

yaml
steps:
  - layout: two-column
    transition: slide-left         # Default for all components in this step
    components:
      - type: headline
        content: "Title"           # Inherits slide-left enter
      - type: image
        enter: scale-in            # Overrides with scale-in
        props:
          src: assets/photo.png


**Component-level `enter`/`exit`** overrides the step default for that specific component.

**Build step sequencing:** Components with different `build` values animate independently. A component at `build: 0` animates with the step transition. Components at `build: 1`, `build: 2`, etc., animate with their own `enter` animation when the user advances the build step.

**`sequential` build mode:** For list components (`bullet-list`, `numbered-list`), each item animates in succession with a stagger delay (default: 150ms between items, configurable).

### 9.7 Map Navigation Transitions

Map mode uses a fundamentally different transition: the **camera** moves rather than the content. When navigating between clusters:

yaml
navigation:
  sequence: [intro, problem, solution]
  transition:
    type: pan-zoom
    duration: 1200
    easing: ease-in-out
    zoomOut: 0.6               # Zoom out to this level mid-flight (optional)


The camera transition:
1. **Depart:** Begin at current cluster framing
2. **Mid-flight (optional):** Zoom out to `zoomOut` level to show spatial context
3. **Arrive:** Zoom in and center on destination cluster

This three-phase flight path creates a "pull back → fly → push in" effect that helps the viewer maintain spatial orientation. The mid-flight zoom-out is optional and configurable; setting `zoomOut` to `null` or omitting it creates a direct pan-zoom.

Animation is driven by Framer Motion's spring physics or duration-based animations, applied to the CSS transform of the canvas container.

### 9.8 Reduced Motion Support

All transitions respect `prefers-reduced-motion`:

typescript
function getEffectiveDuration(requestedDuration: number): number {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Math.min(requestedDuration, 200); // Cap at 200ms
  }
  return requestedDuration;
}


When reduced motion is active:
- All transitions fall back to a simple fast fade (200ms)
- Map navigation uses instant teleportation with a brief fade
- Build step animations are replaced with instant appearance
- Background shader transitions are instant (no interpolation)

---

## 10. State Management

### 10.1 XState Architecture

The presentation runtime is managed by **XState v5**, which provides a formal state machine for handling the complex, nested, concurrent states involved in presenting content. XState is chosen because:

- The presentation runtime has genuinely complex state — nested (steps within presentation, build steps within steps), parallel (transitions, background interpolation, and navigation running simultaneously), and guarded (can only advance past a step when build sequence is complete)
- XState machines are **introspectable** — we can inspect, visualize, and debug the state machine
- XState machines are **serializable** — the machine definition can be derived from presentation YAML
- First-class React integration via `@xstate/react`
- Async transitions are native (wait for animation to complete → then advance state)

### 10.2 State Machine Hierarchy

The presentation runtime uses a **hierarchical state machine** with parallel regions:


PresentationMachine
├── navigation (parallel region)
│   ├── stage
│   │   ├── idle
│   │   ├── step
│   │   │   ├── entering          ← Step transition animation playing
│   │   │   ├── building          ← Build steps in progress
│   │   │   │   ├── waitingForInput
│   │   │   │   └── animating     ← Build step animation playing
│   │   │   └── complete          ← All build steps shown
│   │   └── exiting               ← Step exit animation playing
│   │
│   └── map
│       ├── freeRoam
│       │   ├── idle
│       │   ├── panning
│       │   └── zooming
│       └── guided
│           ├── idle
│           ├── flying             ← Camera transition between clusters
│           └── viewing            ← Arrived at cluster
│
├── background (parallel region)
│   ├── stable                     ← Shader rendering current params
│   └── interpolating              ← Transitioning between param sets
│
└── ui (parallel region)
    ├── progressBar
    ├── controls
    └── overlays


### 10.3 Stage Mode State Machine Detail

typescript
// Simplified XState v5 machine definition for Stage mode
import { setup, assign } from 'xstate';

const stageMachine = setup({
  types: {
    context: {} as {
      steps: StepDefinition[];
      currentStepIndex: number;
      currentBuildIndex: number;
      totalBuildSteps: number;      // For current step
    },
    events: {} as
      | { type: 'NEXT' }
      | { type: 'PREV' }
      | { type: 'GO_TO'; stepIndex: number }
      | { type: 'ANIMATION_COMPLETE' }
      | { type: 'BUILD_ANIMATION_COMPLETE' },
  },
  guards: {
    hasBuildStepsRemaining: ({ context }) =>
      context.currentBuildIndex < context.totalBuildSteps - 1,
    hasNextStep: ({ context }) =>
      context.currentStepIndex < context.steps.length - 1,
    hasPrevStep: ({ context }) =>
      context.currentStepIndex > 0,
    isAtFirstBuild: ({ context }) =>
      context.currentBuildIndex === 0,
  },
}).createMachine({
  id: 'stage',
  initial: 'entering',
  context: ({ input }) => ({
    steps: input.steps,
    currentStepIndex: 0,
    currentBuildIndex: 0,
    totalBuildSteps: computeBuildSteps(input.steps[0]),
  }),

  states: {
    entering: {
      // Step transition animation is playing
      entry: ['triggerStepEnterAnimation'],
      on: {
        ANIMATION_COMPLETE: 'building',
      },
    },

    building: {
      initial: 'waitingForInput',
      states: {
        waitingForInput: {
          on: {
            NEXT: [
              {
                guard: 'hasBuildStepsRemaining',
                target: 'animating',
                actions: ['incrementBuild'],
              },
              {
                guard: 'hasNextStep',
                target: '#stage.exiting',
              },
            ],
            PREV: [
              {
                guard: 'isAtFirstBuild',
                actions: ['decrementStep'],
                target: '#stage.entering',
              },
              {
                actions: ['decrementBuild'],
                target: 'animating',
              },
            ],
            GO_TO: {
              target: '#stage.exiting',
              actions: ['setTargetStep'],
            },
          },
        },
        animating: {
          // Build step animation is playing
          entry: ['triggerBuildAnimation'],
          on: {
            BUILD_ANIMATION_COMPLETE: 'waitingForInput',
          },
        },
      },
    },

    exiting: {
      // Step exit animation is playing
      entry: ['triggerStepExitAnimation'],
      on: {
        ANIMATION_COMPLETE: {
          target: 'entering',
          actions: ['advanceStep', 'resetBuild'],
        },
      },
    },
  },
});


### 10.4 Map Mode State Machine Detail

typescript
const mapMachine = setup({
  types: {
    context: {} as {
      clusters: ClusterDefinition[];
      clusterPositions: Map<string, { x: number; y: number }>;
      cameraPosition: { x: number; y: number; zoom: number };
      guidedSequence: string[];
      guidedIndex: number;
    },
    events: {} as
      | { type: 'NEXT' }
      | { type: 'PREV' }
      | { type: 'GO_TO_CLUSTER'; clusterId: string }
      | { type: 'PAN'; delta: { x: number; y: number } }
      | { type: 'ZOOM'; delta: number; center: { x: number; y: number } }
      | { type: 'ENTER_GUIDED' }
      | { type: 'EXIT_GUIDED' }
      | { type: 'FLIGHT_COMPLETE' },
  },
}).createMachine({
  id: 'map',
  initial: 'freeRoam',
  states: {
    freeRoam: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            PAN: {
              actions: ['updateCameraPosition'],
              target: 'panning',
            },
            ZOOM: {
              actions: ['updateCameraZoom'],
              target: 'zooming',
            },
            GO_TO_CLUSTER: {
              target: '#map.flying',
              actions: ['setTargetCluster'],
            },
            ENTER_GUIDED: '#map.guided',
          },
        },
        panning: {
          on: {
            PAN: { actions: ['updateCameraPosition'] },
            'gesture.end': 'idle',
          },
        },
        zooming: {
          on: {
            ZOOM: { actions: ['updateCameraZoom'] },
            'gesture.end': 'idle',
          },
        },
      },
    },

    flying: {
      // Camera is animating to a target cluster
      entry: ['startCameraFlight'],
      on: {
        FLIGHT_COMPLETE: [
          { guard: 'isInGuidedMode', target: 'guided.viewing' },
          { target: 'freeRoam.idle' },
        ],
      },
    },

    guided: {
      initial: 'viewing',
      entry: ['initGuidedSequence'],
      states: {
        viewing: {
          on: {
            NEXT: {
              guard: 'hasNextCluster',
              target: '#map.flying',
              actions: ['advanceGuided'],
            },
            PREV: {
              guard: 'hasPrevCluster',
              target: '#map.flying',
              actions: ['retreatGuided'],
            },
            EXIT_GUIDED: '#map.freeRoam.idle',
          },
        },
      },
    },
  },
});


### 10.5 Background State Machine

typescript
const backgroundMachine = setup({
  types: {
    context: {} as {
      currentShader: string;
      currentParams: Record<string, any>;
      targetShader: string;
      targetParams: Record<string, any>;
      interpolationProgress: number;
    },
    events: {} as
      | { type: 'STEP_CHANGED'; stepIndex: number }
      | { type: 'CLUSTER_CHANGED'; clusterId: string }
      | { type: 'INTERPOLATION_TICK'; progress: number }
      | { type: 'INTERPOLATION_COMPLETE' },
  },
}).createMachine({
  id: 'background',
  initial: 'stable',
  states: {
    stable: {
      on: {
        STEP_CHANGED: {
          guard: 'shaderConfigChanged',
          target: 'interpolating',
          actions: ['setInterpolationTarget'],
        },
        CLUSTER_CHANGED: {
          guard: 'shaderConfigChanged',
          target: 'interpolating',
          actions: ['setInterpolationTarget'],
        },
      },
    },
    interpolating: {
      entry: ['startInterpolation'],
      on: {
        INTERPOLATION_TICK: {
          actions: ['updateInterpolation'],
        },
        INTERPOLATION_COMPLETE: {
          target: 'stable',
          actions: ['finalizeInterpolation'],
        },
      },
    },
  },
});


### 10.6 Machine Composition

The three machines (navigation, background, UI) run as parallel regions within a top-level presentation machine. They communicate through shared events:

- When the navigation machine changes steps, it emits events that the background machine listens to
- When animations complete, the navigation machine advances
- UI state (progress bar position, control visibility) is derived from navigation state

typescript
const presentationMachine = setup({/* ... */}).createMachine({
  id: 'presentation',
  type: 'parallel',
  states: {
    navigation: {
      // Delegates to stageMachine or mapMachine based on presentation mode
    },
    background: {
      // backgroundMachine
    },
    ui: {
      // UI state machine
    },
  },
});


### 10.7 React Integration

The XState machine is consumed in React via `@xstate/react`:

typescript
// hooks/usePresentationMachine.ts
import { useMachine } from '@xstate/react';
import { presentationMachine } from '@/machines/presentation';

export function usePresentationMachine(presentationConfig: PresentationConfig) {
  const [state, send] = useMachine(presentationMachine, {
    input: {
      mode: presentationConfig.mode,
      steps: presentationConfig.steps,
      clusters: presentationConfig.clusters,
      backgroundConfig: presentationConfig.background,
    },
  });

  return {
    // Current state
    currentStepIndex: state.context.currentStepIndex,
    currentBuildIndex: state.context.currentBuildIndex,
    cameraPosition: state.context.cameraPosition,
    isTransitioning: state.matches('navigation.stage.entering') ||
                     state.matches('navigation.stage.exiting'),

    // Actions
    next: () => send({ type: 'NEXT' }),
    prev: () => send({ type: 'PREV' }),
    goToStep: (index: number) => send({ type: 'GO_TO', stepIndex: index }),
    goToCluster: (id: string) => send({ type: 'GO_TO_CLUSTER', clusterId: id }),
    enterGuided: () => send({ type: 'ENTER_GUIDED' }),
    exitGuided: () => send({ type: 'EXIT_GUIDED' }),
  };
}


---

## 11. Dashboard & Multi-Presentation Management

### 11.1 Overview

The dashboard is the entry point of the Xtoryteller application — a gallery UI at the root route (`/`) that displays all presentations in the user's instance, with search and filtering capabilities. Each presentation has a unique slug that forms its URL (`/[slug]`), enabling direct sharing of presentation links.

### 11.2 Dashboard UI

**Route:** `/`

**Features:**
- Grid/list view of all presentations with thumbnails
- Search by title, description, or content keywords
- Filter by tags
- Sort by date created, date updated, or title
- Visual indicator of presentation mode (Stage or Map icon)
- Click to enter a presentation
- Presentation count and tag cloud/summary

**Presentation card in dashboard:**


┌─────────────────────────────┐
│                             │
│        [Thumbnail]          │
│                             │
├─────────────────────────────┤
│ Title of Presentation       │
│ Short description text...   │
│                             │
│ 🎭 Stage  •  12 steps      │
│ Updated: Jun 20, 2025       │
│                             │
│ [tag1] [tag2] [tag3]        │
└─────────────────────────────┘


### 11.3 Presentation Discovery

The dashboard reads presentations from the `/presentations/` directory at build time (static export) or at runtime (dev server / SSR). For each presentation folder:

1. Read `presentation.yaml`
2. Extract `meta` block (title, slug, description, tags, author, dates, thumbnail, mode)
3. Count steps or clusters
4. Check for thumbnail — use provided thumbnail if it exists, otherwise auto-generate

**Auto-generated thumbnails:** At build time, a headless browser (Playwright) renders the first step/cluster of each presentation at a fixed resolution (1280×720) and saves the screenshot as the thumbnail. This runs only when a thumbnail is not provided and the presentation has changed since the last build.

The dashboard data is compiled into a JSON index file (`presentations-index.json`) that the client loads:

json
[
  {
    "slug": "causal-systems",
    "title": "Understanding Causal Systems",
    "description": "A primer on systems thinking and causal loop diagrams",
    "tags": ["systems-thinking", "workshop", "beginner"],
    "author": "Jane Doe",
    "mode": "stage",
    "stepCount": 12,
    "createdAt": "2025-01-15",
    "updatedAt": "2025-06-20",
    "thumbnail": "/presentations/causal-systems/assets/thumbnail.png"
  }
]


### 11.4 URL Structure

| Route | Content |
|---|---|
| `/` | Dashboard gallery |
| `/[slug]` | Presentation viewer (full-screen, no dashboard chrome) |
| `/preview/[temp-id]` | Temporary preview for style discovery workflow |

**Slug uniqueness:** Enforced at validation time. If two presentations have the same slug, the validator reports an error.

**Direct sharing:** After deployment, a user can share `https://my-site.com/causal-systems` and the recipient goes directly to the presentation. No dashboard login or selection required.

### 11.5 Entering and Exiting Presentations

**Entering:** Clicking a presentation card in the dashboard navigates to `/[slug]`. The transition is a client-side route change (no page reload). The presentation viewer takes over the full viewport.

**Exiting:** A subtle, always-accessible back action lives inside the bottom viewer dock, aligned to the right of the navigation controls. The progress rail remains visible at the bottom edge while the dock is hidden, then rides upward with the rest of the control stack as the dock opens. A dedicated hover/focus strip reveals the full control surface when needed. Keyboard shortcut: `Escape` when at the first step/cluster.

**Deep linking into steps:** URLs can include step/cluster anchors:
- Stage mode: `/causal-systems#step-3` (jumps to step 3)
- Map mode: `/causal-systems#cluster-solution` (flies to the solution cluster)

### 11.6 Dashboard Styling

The dashboard itself uses the project's default theme. Its design should be clean and minimal — the presentations are the stars, not the dashboard. The dashboard is a built-in view that is always present; it is not customizable in the same way presentations are (though it respects the project-level theme colors and fonts).

---





