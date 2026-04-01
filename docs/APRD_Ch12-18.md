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

## 12. Agent Skill System

### 12.1 Philosophy

The agent skill system is the **primary interface** through which presentations are created. It is designed so that any AI coding agent (Claude Code, OpenAI Codex, Gemini CLI, open-code, or others) can:

1. Understand the Xtoryteller infrastructure by reading skill files and documentation
2. Discover available components, layouts, themes, and transitions by reading manifests and registries
3. Generate valid presentation YAML by following the schema
4. Create new custom components when existing presets are insufficient
5. Modify existing presentations by editing YAML fields
6. Guide the user through style and content decisions

The skill system is **agent-agnostic** — it provides structured documentation files that any agent can consume, following the YAML-based skill definition convention with gradual exposure.

### 12.2 Skill File Structure


skills/
├── xtoryteller-skill.yaml          # Master skill definition
├── phases/
│   ├── 00-detect-intent.yaml       # Phase 0: What does the user want?
│   ├── 01-context-gathering.yaml   # Phase 1: Scan existing infrastructure
│   ├── 02-content-style.yaml       # Phase 2: Content & style discovery
│   ├── 03-orchestration.yaml       # Phase 3: Generate presentation YAML
│   ├── 04-validation.yaml          # Phase 4: Validate & preview
│   └── 05-iteration.yaml           # Phase 5: User feedback loop
├── sub-pipelines/
│   ├── style-discovery.yaml        # Multi-variant theme preview workflow
│   ├── component-creation.yaml     # Creating custom TSX components
│   ├── layout-creation.yaml        # Creating custom layouts
│   └── theme-creation.yaml         # Creating custom themes
├── references/
│   ├── schema.yaml                 # Presentation YAML schema
│   ├── component-registry.json     # Auto-generated component list with manifests
│   ├── layout-registry.json        # Auto-generated layout list
│   ├── transition-registry.json    # Auto-generated transition list
│   ├── theme-registry.json         # Available themes
│   ├── anti-patterns.yaml          # What NOT to do
│   └── examples/
│       ├── simple-stage.yaml       # Example: minimal Stage presentation
│       ├── complex-stage.yaml      # Example: full-featured Stage presentation
│       ├── simple-map.yaml         # Example: minimal Map presentation
│       └── complex-map.yaml        # Example: full-featured Map presentation
└── docs/
    ├── architecture-overview.md    # System architecture for agent context
    ├── component-authoring.md      # How to create custom components
    ├── yaml-conventions.md         # YAML formatting conventions
    └── troubleshooting.md          # Common issues and solutions


### 12.3 Master Skill Definition

yaml
# skills/xtoryteller-skill.yaml
---
name: xtoryteller
description: >
  Create, customize, and manage rich presentations using the Xtoryteller
  infrastructure. Compose presentations from reusable components, layouts,
  and themes using YAML configuration files. Supports two navigation modes
  (Stage for sequential, Map for spatial), WebGL shader backgrounds,
  advanced diagram components, and a cascading theme system.
---

# Xtoryteller Presentation Skill

## When to Use
- User wants to create a new presentation
- User wants to modify an existing presentation
- User wants to create a custom component, layout, or theme
- User wants to understand the Xtoryteller system

## Before Starting ANY Task
1. Read `skills/references/component-registry.json` to know available components
2. Read `skills/references/layout-registry.json` to know available layouts
3. Read `skills/references/transition-registry.json` to know available transitions
4. Read `skills/xtoryteller/references/registries/theme-registry.json` to know available themes
5. Understand the project structure by reading `skills/docs/architecture-overview.md`

## Phase 0: Detect Intent
Read `skills/phases/00-detect-intent.yaml` and determine what the user wants:
- **A: Create new presentation** → Phases 1-5
- **B: Create/modify component** → `skills/sub-pipelines/component-creation.yaml`
- **C: Create/modify layout** → `skills/sub-pipelines/layout-creation.yaml`
- **D: Create/modify theme** → `skills/sub-pipelines/theme-creation.yaml`
- **E: Modify existing presentation** → Load YAML, understand, modify, validate
- **F: Import from PPT** → Future feature, not yet supported

## Phase 1: Context Gathering
Read `skills/phases/01-context-gathering.yaml`

## Phase 2: Content & Style Discovery
Read `skills/phases/02-content-style.yaml`
If user wants to explore styles visually:
  → Trigger `skills/sub-pipelines/style-discovery.yaml`

## Phase 3: Orchestration (Generate Presentation)
Read `skills/phases/03-orchestration.yaml`
Read `skills/references/schema.yaml` for the exact YAML schema.
Read relevant example from `skills/references/examples/`

## Phase 4: Validation
Read `skills/phases/04-validation.yaml`
Run: `node scripts/validate.js presentations/<name>/presentation.yaml`

## Phase 5: Iteration
Read `skills/phases/05-iteration.yaml`


### 12.4 Phase Details

#### Phase 0: Detect Intent

yaml
# skills/phases/00-detect-intent.yaml
phase: 0
name: Detect Intent
description: >
  Determine what the user wants to accomplish. Ask a single clarifying
  question if their intent is ambiguous.

actions:
  - If the user provides content (text, notes, outline):
      intent: create-new-presentation

  - If the user asks to modify or update an existing presentation:
      intent: modify-presentation
      action: Read the existing presentation.yaml, understand its structure

  - If the user describes a visual element that doesn't exist in the registry:
      intent: create-component
      action: Follow component-creation sub-pipeline

  - If the user wants to change the look/feel globally:
      intent: create-theme
      action: Follow theme-creation sub-pipeline

  - If intent is unclear:
      action: >
        Ask the user: "I can help you with:
        1. Create a new presentation from your content
        2. Modify an existing presentation
        3. Create a custom component or layout
        4. Design a new theme
        What would you like to do?"


#### Phase 1: Context Gathering

yaml
# skills/phases/01-context-gathering.yaml
phase: 1
name: Context Gathering
description: >
  Before creating anything, understand what infrastructure is already
  available. This prevents recreating existing components and ensures
  the agent uses the right tools.

steps:
  - name: Scan Component Registry
    action: Read `skills/references/component-registry.json`
    purpose: Know all available component types and their props
    note: >
      Pay attention to diagram components — they are a key differentiator.
      If the user's content involves relationships, processes, or structured
      data, consider using causal-diagram, mind-map, flowchart, etc.

  - name: Scan Layout Registry
    action: Read `skills/references/layout-registry.json`
    purpose: Know all available spatial arrangements and their slot counts

  - name: Scan Theme Registry
    action: Read `skills/xtoryteller/references/registries/theme-registry.json`
    purpose: Know available visual themes

  - name: Scan Existing Presentations
    action: List directories in `presentations/`
    purpose: >
      Understand what already exists. If modifying, read the target
      presentation.yaml. If creating new, avoid slug conflicts.

  - name: Check for Presentation-Scoped Components
    action: >
      If modifying an existing presentation, check
      presentations/<name>/components/ for custom components
    purpose: Understand presentation-specific extensions


#### Phase 2: Content & Style Discovery

yaml
# skills/phases/02-content-style.yaml
phase: 2
name: Content & Style Discovery
description: >
  Gather the user's content and determine the visual style.

content_gathering:
  - Ask the user to provide their content in any format:
    - Full text/outline
    - Rough notes
    - Topic description only
    - Existing document or file

  - Once content is received:
    - Identify the natural sections/chapters
    - Estimate the number of steps needed (respecting density limits)
    - Identify content that maps to diagram components
    - Identify content that maps to basic components
    - Propose a high-level outline to the user

  - Ask the user:
    - "What navigation mode do you prefer?"
      - Stage (sequential, like a traditional talk)
      - Map (spatial, exploratory, for workshops or complex topics)

style_discovery:
  - Ask the user about their preferred theme:
    - Option 1: Use an existing theme (list available themes)
    - Option 2: Explore styles visually → trigger style-discovery sub-pipeline
    - Option 3: Describe a mood/feeling → agent selects closest theme + overrides

  - If existing theme chosen:
    - Ask if any overrides are needed (colors, fonts)

  - Confirm selections before proceeding


#### Phase 3: Orchestration

yaml
# skills/phases/03-orchestration.yaml
phase: 3
name: Orchestration
description: >
  Generate the presentation.yaml file. This is the core creative act.

rules:
  - ALWAYS read `skills/references/schema.yaml` before generating
  - ALWAYS reference an example from `skills/references/examples/`
  - ALWAYS check component props against their manifests
  - NEVER exceed content density limits for any layout
  - NEVER hardcode colors — use theme variable references (var(--color-primary))
  - NEVER use a component type that doesn't exist in the registry
  - ALWAYS include meaningful meta (title, slug, description, tags)
  - ALWAYS specify transitions (don't rely on undefined defaults)
  - ALWAYS use build steps for content that should appear incrementally

generation_steps:
  - Create the presentation directory: `presentations/<slug>/`
  - Create `assets/` subdirectory if media assets exist
  - Generate `presentation.yaml` following the schema
  - Organize content into steps (Stage) or clusters (Map)
  - Assign layouts based on content type and density
  - Set appropriate transitions based on the mood/feeling
  - Configure background shader parameters
  - Define build steps for incremental content reveal
  - Add theme overrides if needed

  - For Map mode specifically:
    - Plan cluster spatial relationships
    - Choose arrangement algorithm or define manual-relative positions
    - Define guided navigation sequence
    - Set camera transition parameters

output:
  - Write `presentations/<slug>/presentation.yaml`
  - Copy any user-provided assets to `presentations/<slug>/assets/`
  - Report the file location and step/cluster count


#### Phase 4: Validation

yaml
# skills/phases/04-validation.yaml
phase: 4
name: Validation
description: >
  Validate the generated presentation before the user reviews it.

steps:
  - name: Schema Validation
    action: Run `node scripts/validate.js presentations/<slug>/presentation.yaml`
    on_error: >
      Read the error messages carefully. They point to the exact issue.
      Fix the YAML and re-validate. Common issues:
      - Misspelled component type names
      - Missing required props
      - Invalid layout references
      - Build step index gaps

  - name: Asset Validation
    action: >
      Check that all referenced asset paths (images, videos) exist
      in the presentation's assets/ directory or are valid external URLs.

  - name: Density Check
    action: >
      Review each step/cluster against layout density limits.
      If any step exceeds its layout's recommended density,
      split into multiple steps.

  - name: Open for Review
    action: >
      Tell the user: "Your presentation is ready for review.
      Open your browser to http://localhost:3000/<slug> to view it."
    note: >
      The dev server watches for file changes. If the user is already
      running `npm run dev`, the presentation will appear automatically.


#### Phase 5: Iteration

yaml
# skills/phases/05-iteration.yaml
phase: 5
name: Iteration
description: >
  The user reviews the presentation in their browser and provides feedback.
  Make targeted modifications to the YAML based on their feedback.

workflow:
  - Listen for user feedback (e.g., "make the title bigger",
    "add a diagram here", "change the transition to something more dynamic")

  - For content changes:
    - Modify the specific step/component in the YAML
    - DO NOT regenerate the entire file — make targeted edits

  - For style changes:
    - Prefer themeOverrides over component-level style changes
    - If the user wants a global change, modify the theme or themeOverrides
    - If the user wants a specific element changed, use component style override

  - For structural changes (reorder, add/remove steps):
    - Carefully restructure the YAML
    - Re-validate build step indices after restructuring
    - Re-check density limits

  - After each modification:
    - Re-run validation
    - The browser will hot-reload to show changes
    - Ask the user if the change looks good

  - When the user is satisfied:
    - Confirm the final presentation
    - Summarize: title, slug, step/cluster count, theme, mode
    - Remind them the URL will be /<slug> after deployment


### 12.5 Style Discovery Sub-Pipeline

yaml
# skills/sub-pipelines/style-discovery.yaml
name: Style Discovery
description: >
  Generate multiple theme variants as temporary preview presentations
  for the user to visually compare. Only triggered when the user
  explicitly wants to explore styles.

trigger: >
  User says something like "show me options", "I'm not sure about the style",
  "help me pick a look", or selects "Explore styles visually" in Phase 2.

steps:
  - name: Mood Selection
    action: >
      Ask the user: "What feeling should your presentation convey?"
      Options (can pick 1-2):
      - Confident / Professional
      - Bold / Energetic
      - Calm / Thoughtful
      - Elegant / Refined
      - Creative / Playful

  - name: Generate Theme Variants
    action: >
      Based on mood, generate 3 distinct theme YAML files:
      - themes/preview-a.yaml
      - themes/preview-b.yaml
      - themes/preview-c.yaml

      Each should have distinctly different color palettes, font pairings,
      and spacing feels while matching the selected mood.

  - name: Generate Preview Presentations
    action: >
      For each theme variant, generate a minimal presentation YAML that
      showcases the theme's typography, colors, component styling, and
      background shader configuration. Use 3-4 representative steps
      covering: title slide, content slide, diagram slide, quote/callout.

      Save to temporary preview locations:
      - presentations/_preview-a/presentation.yaml
      - presentations/_preview-b/presentation.yaml
      - presentations/_preview-c/presentation.yaml

  - name: User Reviews
    action: >
      Tell the user to view each at:
      - http://localhost:3000/_preview-a
      - http://localhost:3000/_preview-b
      - http://localhost:3000/_preview-c

      Ask: "Which style do you prefer? A, B, C, or mix elements?"

  - name: Apply Selection
    action: >
      Based on user choice:
      - If they pick one: use that theme for the actual presentation
      - If they want to mix: create a merged theme YAML from their preferences
      - Save the chosen theme to themes/ with a proper name

  - name: Cleanup
    action: >
      Delete temporary preview files:
      - themes/preview-*.yaml
      - presentations/_preview-*/


### 12.6 Component Creation Sub-Pipeline

yaml
# skills/sub-pipelines/component-creation.yaml
name: Component Creation
description: >
  Guide the agent through creating a new custom TSX component with
  its manifest, styles, and documentation.

steps:
  - name: Understand the Need
    action: >
      Determine what the user needs that doesn't exist:
      - Is it truly new, or can an existing component be used with different props?
      - Check the component registry thoroughly first.

  - name: Define the API
    action: >
      Design the component's props interface:
      - What data does it accept?
      - What style customization does it expose?
      - What content format does it use (Markdown, structured data, both)?
      - Does it support build step animation?
      - Does it support hover annotations?
      Write the manifest.yaml first.

  - name: Determine Scope
    action: >
      Ask: Is this component for one presentation or for all future ones?
      - One presentation: create in presentations/<slug>/components/
      - Global: create in components/

  - name: Implement
    action: >
      Write the TSX component following these rules:
      - Default export a React functional component
      - Accept `style` prop for inline overrides
      - Reference theme CSS variables, never hardcode colors/fonts
      - Use clamp() for all font sizes and spacing
      - Use semantic HTML and ARIA attributes
      - Respect prefers-reduced-motion
      - Use CSS Modules for scoped styles

    references:
      - Read `skills/docs/component-authoring.md` for detailed guidelines
      - Study existing component implementations in components/ for patterns

  - name: Test
    action: >
      Create a minimal test presentation that uses the new component.
      Validate that it renders correctly at various viewport sizes.
      Verify theme variable integration.

  - name: Register
    action: >
      The component is auto-discovered by the registry on dev server restart.
      Verify it appears in `skills/references/component-registry.json`
      after rebuild.


### 12.7 Registry Auto-Generation

The component, layout, transition, and theme registries referenced by the agent skill are **auto-generated** from the filesystem. A build script scans directories, reads manifests, and produces JSON index files:

bash
# Runs at build time and on dev server startup
node scripts/generate-registries.js


This script:
1. Scans `components/*/manifest.yaml` → outputs `skills/references/component-registry.json`
2. Scans `layouts/*/manifest.yaml` → outputs `skills/references/layout-registry.json`
3. Scans `transitions/*/manifest.yaml` → outputs `skills/references/transition-registry.json`
4. Scans `themes/*.yaml` → outputs `skills/xtoryteller/references/registries/theme-registry.json`

The JSON outputs contain the full manifest data for each entry, making them comprehensive references for agents without requiring the agent to read individual files.

---

## 13. Rendering Pipeline

### 13.1 Overview

The rendering pipeline transforms a `presentation.yaml` file into a live, interactive presentation in the browser. It operates in three stages: **Load → Resolve → Render**.

### 13.2 Load Stage


presentation.yaml → YAML Parser → Raw Presentation Object → Schema Validator → Validated Presentation Object


1. **File loading:** The presentation YAML is loaded from the filesystem. In dev mode, this uses Next.js file system APIs. In static export mode, YAML files are pre-compiled to JSON at build time and loaded as static assets.
2. **YAML parsing:** The YAML string is parsed into a JavaScript object using a YAML parser (e.g., `yaml` npm package).
3. **Schema validation:** The parsed object is validated against the presentation JSON Schema. Invalid presentations produce clear error messages displayed in the browser (dev mode) or fail the build (production).
4. **Template expression resolution:** Any template expressions (`` syntax) are evaluated against the `data` block, producing a fully resolved presentation object with all content in place.

### 13.3 Resolve Stage


Validated Presentation Object → Component Resolver → Layout Resolver → Theme Resolver → Transition Resolver → Resolved Presentation


1. **Component resolution:** Each `type` reference in the YAML is resolved to a React component from the registry. Resolution order:
   - Presentation-scoped components (`presentations/<slug>/components/`) — checked first
   - Global components (`components/`) — checked second
   - If not found: render an error placeholder with the component name and a helpful message

2. **Layout resolution:** Each `layout` reference is resolved to a layout React component from the layout registry. Same resolution order (presentation-scoped first, then global).

3. **Theme resolution:** The referenced theme YAML is loaded. Presentation-level `themeOverrides` are merged. The resulting theme object is converted to CSS custom properties and injected into the document.

4. **Transition resolution:** Each `transition`, `enter`, and `exit` reference is resolved to a transition function from the transition registry. Unresolved transitions fall back to `fade`.

5. **Asset path resolution:** All relative asset paths in component props (e.g., `src: assets/hero.png`) are resolved to their runtime URLs (e.g., `/presentations/my-talk/assets/hero.png`).

The result is a **Resolved Presentation** — a complete data structure where every reference has been replaced with its concrete implementation.

### 13.4 Render Stage

The Resolved Presentation is rendered by the **Presentation Runtime** React component tree:


<PresentationProvider>              ← Provides XState machine context
  <ThemeProvider>                   ← Injects CSS custom properties
    <BackgroundLayer>               ← WebGL shader canvas
      <PaperShaderRenderer />
    </BackgroundLayer>
    <ContentLayer>                  ← DOM content
      <NavigationController>        ← Delegates to Stage or Map
        <StageRenderer />           ← OR
        <MapRenderer />
      </NavigationController>
    </ContentLayer>
    <UILayer>                       ← Progress bar, controls, overlays
      <ProgressIndicator />
      <NavigationControls />
    </UILayer>
  </ThemeProvider>
</PresentationProvider>


### 13.5 Stage Renderer

The Stage Renderer is responsible for rendering the current step and managing transitions.

typescript
// Simplified StageRenderer logic
function StageRenderer() {
  const { currentStepIndex, currentBuildIndex, isTransitioning } = usePresentationMachine();
  const { steps } = useResolvedPresentation();

  const currentStep = steps[currentStepIndex];
  const LayoutComponent = currentStep.resolvedLayout;
  const transition = currentStep.resolvedTransition;

  return (
    <div className="stage-viewport">
      <AnimatePresence mode="wait">
        <LayoutComponent key={currentStepIndex}>
          {currentStep.components.map((comp, i) => {
            const Component = comp.resolvedComponent;
            const isVisible = comp.buildIndex <= currentBuildIndex;
            const enterAnim = comp.resolvedEnter;

            return (
              <BuildStepWrapper
                key={i}
                visible={isVisible}
                enter={enterAnim}
                exit={comp.resolvedExit}
              >
                <Component
                  {...comp.props}
                  content={comp.content}
                  style={comp.style}
                />
              </BuildStepWrapper>
            );
          })}
        </LayoutComponent>
      </AnimatePresence>
    </div>
  );
}


**Key behaviors:**
- The entire viewport is a single stage — no slide boundaries
- When a step changes, the outgoing layout exits and the incoming layout enters, animated by the step transition
- Within a step, components appear/disappear based on build step index, animated by their individual `enter`/`exit` animations
- The layout component receives its child components as children and positions them in slots
- All sizing is fluid — `clamp()` values, viewport-relative units, no fixed pixel sizes

### 13.6 Map Renderer

The Map Renderer manages the infinite canvas — a large DOM container with CSS transforms for pan and zoom.

typescript
function MapRenderer() {
  const {
    cameraPosition,
    isFlying,
    goToCluster,
  } = usePresentationMachine();
  const { clusters, clusterPositions } = useResolvedPresentation();

  const bind = useGesture({
    onDrag: ({ delta: [dx, dy] }) => {
      send({ type: 'PAN', delta: { x: dx, y: dy } });
    },
    onPinch: ({ delta: [d], origin }) => {
      send({ type: 'ZOOM', delta: d, center: { x: origin[0], y: origin[1] } });
    },
    onWheel: ({ delta: [, dy], event }) => {
      send({ type: 'ZOOM', delta: -dy * 0.001, center: { x: event.clientX, y: event.clientY } });
    },
  });

  return (
    <div className="map-viewport" {...bind()}>
      <motion.div
        className="map-canvas"
        animate={{
          x: -cameraPosition.x,
          y: -cameraPosition.y,
          scale: cameraPosition.zoom,
        }}
        transition={isFlying ? {
          type: 'spring',
          stiffness: 80,
          damping: 20,
        } : {
          type: 'tween',
          duration: 0,
        }}
      >
        {clusters.map((cluster) => {
          const position = clusterPositions.get(cluster.id);
          const LayoutComponent = cluster.resolvedLayout;

          return (
            <div
              key={cluster.id}
              className="map-cluster"
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
              }}
              onClick={() => goToCluster(cluster.id)}
            >
              <LayoutComponent>
                {cluster.components.map((comp, i) => {
                  const Component = comp.resolvedComponent;
                  return (
                    <Component
                      key={i}
                      {...comp.props}
                      content={comp.content}
                      style={comp.style}
                    />
                  );
                })}
              </LayoutComponent>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}


**Key behaviors:**
- The canvas container has `transform: translate(x, y) scale(zoom)` driven by camera state
- Clusters are absolutely positioned within the canvas at coordinates computed by the position resolver
- Gesture handlers (drag, pinch, wheel) update camera state in the XState machine
- During guided mode, camera transitions use spring physics for organic movement
- Click on any cluster navigates the camera to frame it
- The cluster position resolver runs once at load time, converting relative positioning declarations into absolute coordinates

### 13.7 Cluster Position Resolution

For Map mode, relative cluster positions must be resolved to absolute canvas coordinates before rendering:

typescript
function resolveClusterPositions(
  clusters: ClusterDefinition[],
  arrangement: string,
  spacing: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (arrangement === 'manual-relative') {
    // Resolve relative positions
    for (const cluster of clusters) {
      if (cluster.anchor === 'origin') {
        positions.set(cluster.id, { x: 0, y: 0 });
      } else {
        const ref = positions.get(cluster.anchor.relativeTo);
        if (!ref) throw new Error(`Cluster ${cluster.id} references unresolved cluster ${cluster.anchor.relativeTo}`);

        const offset = directionToOffset(cluster.anchor.direction, cluster.anchor.distance);
        positions.set(cluster.id, {
          x: ref.x + offset.x,
          y: ref.y + offset.y,
        });
      }
    }
  } else {
    // Use automatic arrangement algorithm
    const algorithm = getArrangementAlgorithm(arrangement);
    return algorithm.compute(clusters, spacing);
  }

  return positions;
}

function directionToOffset(
  direction: string,
  distance: number
): { x: number; y: number } {
  const angles: Record<string, number> = {
    'right': 0,
    'below-right': Math.PI / 4,
    'below': Math.PI / 2,
    'below-left': 3 * Math.PI / 4,
    'left': Math.PI,
    'above-left': 5 * Math.PI / 4,
    'above': 3 * Math.PI / 2,
    'above-right': 7 * Math.PI / 4,
  };

  const angle = angles[direction] ?? 0;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}


### 13.8 Rendering Layer Interaction

The three rendering technologies coexist in layers:

| Layer | Technology | Z-Index | Content |
|---|---|---|---|
| Background | WebGL canvas (paper-shader) | -1 | Procedural textured background |
| Content | React DOM | 0 | All presentation components, text, images, interactive elements |
| Diagrams (within content) | SVG (inline in DOM) | 0 | Causal diagrams, mind maps, flowcharts, etc. rendered as inline SVG |
| Data Viz (within content) | SVG (custom and data-driven renderers) | 0 | Sankey, radar, coordinate plots and similar diagrams rendered as inline SVG |
| UI Overlay | React DOM | 1 | Progress bar, navigation controls, tooltips |

The WebGL background canvas is positioned `fixed` behind everything. All content renders as standard DOM elements. SVG diagrams are inline within the DOM tree (not separate canvases), so they participate in normal layout, styling, and accessibility. Some diagrams use custom SVG placement logic while others can use data-driven helpers, but they all render into the same inline SVG surface model.

### 13.9 Hot Reload Pipeline

During development, the rendering pipeline supports hot reload for rapid iteration:

1. **File watcher** monitors the `presentations/` directory for changes to YAML files and assets
2. **WebSocket notification** — when a file changes, the dev server sends a WebSocket message to the client
3. **Selective re-render** — the client re-loads and re-parses only the changed presentation YAML
4. **Diff-based update** — only the changed steps/components are re-rendered; the XState machine state is preserved (current step, build index) if possible
5. **No page reload** — the React tree is not unmounted; state is maintained

This creates a tight loop: agent writes YAML → file saves → browser updates within ~500ms, without losing the user's current position in the presentation.

typescript
// Client-side hot reload listener
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:${WS_PORT}`);

  ws.onmessage = (event) => {
    const { type, path } = JSON.parse(event.data);

    if (type === 'presentation-changed' && path.includes(currentSlug)) {
      // Re-fetch and re-parse the presentation YAML
      reloadPresentation();
    }
  };

  return () => ws.close();
}, [currentSlug]);


---

## 14. Portability & Sharing

### 14.1 Portability Model

Xtoryteller presentations are designed to be portable across instances. The portability model is based on **self-contained folders** that can be zipped and transferred.

### 14.2 Presentation Portability

A presentation folder contains everything needed to render the presentation — **assuming the required components and theme exist in the target instance.**

**Minimal portable presentation (uses only built-in presets):**


my-talk/
├── presentation.yaml
└── assets/
    ├── hero-image.png
    └── chart-data.json


This can be dropped into any Xtoryteller instance's `presentations/` directory and it will work immediately, because it references only built-in components, layouts, and themes.

### 14.3 Complete Portable Package

When a presentation uses custom components, a custom theme, or custom layouts, the full package includes everything:


my-talk-complete/
├── presentation.yaml           # Presentation orchestration
├── assets/                     # Media assets
│   ├── hero-image.png
│   └── demo-video.mp4
├── components/                 # Presentation-scoped custom components
│   └── custom-chart/
│       ├── index.tsx
│       ├── manifest.yaml
│       └── styles.module.css
└── theme.yaml                  # Optional: custom theme used by this presentation


**Sharing workflow:**

1. **Zip the folder:** `zip -r my-talk-complete.zip my-talk-complete/`
2. **Recipient unzips** into their `presentations/` directory
3. **Presentation-scoped components** are automatically discovered — they stay scoped to this presentation
4. **Custom theme:** If `theme.yaml` is present, the recipient copies it to their `themes/` directory (or the import script does this automatically)
5. **Presentation works** on the recipient's instance

### 14.4 Component Promotion

When a recipient imports a presentation with custom components, those components live inside the presentation folder. To reuse a component in other presentations, the user **promotes** it to the global component library:

bash
# Conceptual — could be a script or manual copy
cp -r presentations/my-talk/components/custom-chart/ components/custom-chart/


After promotion:
- The component is available to all presentations
- It appears in the component registry
- Agents can discover and use it for future presentations
- The original presentation continues to work (global components are checked after presentation-scoped)

### 14.5 Import Validation

When importing a presentation package from another instance, a validation step ensures compatibility:

typescript
// scripts/import-presentation.js
function validateImport(packagePath: string): ImportValidationResult {
  const presentation = parseYAML(readFile(`${packagePath}/presentation.yaml`));
  const issues: ValidationIssue[] = [];

  // Check component availability
  for (const step of presentation.steps ?? presentation.clusters ?? []) {
    for (const comp of step.components) {
      const inGlobal = existsSync(`components/${comp.type}/`);
      const inScoped = existsSync(`${packagePath}/components/${comp.type}/`);
      if (!inGlobal && !inScoped) {
        issues.push({
          severity: 'error',
          message: `Component "${comp.type}" not found in global registry or package`,
          suggestion: `This presentation requires a component that is not included. Contact the author for the missing component.`,
        });
      }
    }
  }

  // Check theme availability
  const themeName = presentation.theme;
  const themeInGlobal = existsSync(`themes/${themeName}.yaml`);
  const themeInPackage = existsSync(`${packagePath}/theme.yaml`);
  if (!themeInGlobal && !themeInPackage) {
    issues.push({
      severity: 'warning',
      message: `Theme "${themeName}" not found. Will fall back to xinimalist-paper.`,
      suggestion: `The presentation may look different than intended. Ask the author for their theme file.`,
    });
  }

  // Check layout availability
  for (const step of presentation.steps ?? presentation.clusters ?? []) {
    const layoutName = step.layout;
    if (!existsSync(`layouts/${layoutName}/`)) {
      issues.push({
        severity: 'error',
        message: `Layout "${layoutName}" not found in registry`,
        suggestion: `This presentation uses a custom layout not included in the package.`,
      });
    }
  }

  // Check transition availability
  // ... similar pattern

  // Check asset file existence
  // ... verify all referenced assets exist in assets/

  // Check slug conflict
  if (existsSync(`presentations/${presentation.meta.slug}/`)) {
    issues.push({
      severity: 'warning',
      message: `Slug "${presentation.meta.slug}" already exists. Import will overwrite.`,
      suggestion: `Rename the existing presentation or change the slug in the imported YAML.`,
    });
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  };
}


The import script is run before copying files:

bash
node scripts/import.js path/to/my-talk-complete.zip


Output:


Importing presentation: "Understanding Causal Systems"
Slug: causal-systems

✓ All components resolved (3 global, 1 scoped)
✓ Theme "default" found in global registry
✓ All layouts resolved
✓ All transitions resolved
⚠ Warning: Slug "causal-systems" already exists. Use --force to overwrite.
✓ All assets present (2 files, 3.4 MB)

Import ready. Run with --confirm to proceed.


### 14.6 Export Script

A convenience script packages a presentation for sharing:

bash
node scripts/export.js presentations/my-talk


This script:
1. Reads the presentation YAML
2. Identifies all dependencies (custom components, theme, assets)
3. Copies everything into a clean folder structure
4. Validates completeness — warns if a referenced global component should be included for portability
5. Creates a zip file


Exporting presentation: "Understanding Causal Systems"

Included:
  ✓ presentation.yaml
  ✓ assets/ (2 files, 3.4 MB)
  ✓ components/custom-chart/ (presentation-scoped)
  ⚠ Theme "default" is a built-in theme — not included (available on all instances)

Output: my-talk-complete.zip (3.5 MB)


### 14.7 Embedding

Presentations can be embedded in external websites via iframe. Each presentation at `/<slug>` is a fully self-contained view:

html
<iframe
  src="https://my-xtoryteller.vercel.app/causal-systems"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>


The presentation viewer detects iframe context and adjusts:
- Hides the back-to-dashboard button
- Scales content to fit the iframe dimensions
- Preserves all navigation controls (keyboard, click, touch)

### 14.8 Future Export Formats

Not in MVP scope, but the architecture accommodates future export to:
- **PDF:** Headless browser renders each step as a screenshot, combines into PDF
- **Video:** Records step transitions as a video file
- **Static HTML:** Single self-contained HTML file (like the reference skill's output) for maximum portability outside the Xtoryteller ecosystem

---

## 15. Accessibility

### 15.1 Principles

Accessibility is a non-negotiable baseline for Xtoryteller. Presentations are communication tools — they must be usable by all audience members regardless of ability. The accessibility strategy addresses four areas: perceivable, operable, understandable, and robust (WCAG 2.1 AA compliance target).

### 15.2 Semantic HTML

All built-in components use semantic HTML elements:

| Component | Primary Element(s) | Notes |
|---|---|---|
| `headline` | `<h1>`, `<h2>`, `<h3>` | Level matches `level` prop; never skip heading levels |
| `subtitle` | `<p>` with `role="doc-subtitle"` | |
| `body-text` | `<p>`, `<ul>`, `<ol>`, `<blockquote>` | Markdown renders to appropriate elements |
| `bullet-list` | `<ul>` + `<li>` | |
| `numbered-list` | `<ol>` + `<li>` | |
| `blockquote` | `<blockquote>` + `<cite>` | Attribution uses `<cite>` |
| `callout` | `<aside>` with `role="note"` | |
| `image` | `<figure>` + `<img>` + `<figcaption>` | Alt text required |
| `video` | `<figure>` + `<video>` | Captions track encouraged |
| `code-block` | `<pre>` + `<code>` | Language attribute for screen readers |
| `table` (future) | `<table>` + `<thead>` + `<tbody>` + `<th scope>` | Proper header scoping |
| Diagram components | `<svg>` with `role="img"` + `<title>` + `<desc>` | SVG accessibility described below |

Custom components are expected to follow the same patterns. The component authoring guide documents these requirements explicitly.

### 15.3 Keyboard Navigation

Full keyboard support in both navigation modes:

**Stage Mode:**

| Key | Action |
|---|---|
| `→` / `↓` / `Space` | Next build step or next step |
| `←` / `↑` | Previous build step or previous step |
| `Home` | Jump to first step |
| `End` | Jump to last step |
| `0-9` | Jump to step N (multi-digit: type quickly) |
| `Escape` | Return to dashboard (from step 0) or return to step 0 |
| `F` | Toggle fullscreen |
| `?` | Show keyboard shortcuts overlay |

**Map Mode (Free Roam):**

| Key | Action |
|---|---|
| `→` / `←` / `↑` / `↓` | Pan camera in direction |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom to default |
| `Tab` | Cycle focus through clusters |
| `Enter` | Navigate to focused cluster |
| `G` | Enter guided mode |
| `Escape` | Exit guided mode / return to dashboard |

**Map Mode (Guided):**

| Key | Action |
|---|---|
| `→` / `Space` | Next cluster in sequence |
| `←` | Previous cluster in sequence |
| `Escape` | Exit guided mode to free roam |

All interactive elements (including the revealable bottom control dock, navigation controls, clickable clusters, and hover annotations) are focusable and operable via keyboard.

### 15.4 ARIA Attributes

**Presentation container:**

html
<div role="application" aria-roledescription="presentation" aria-label="Understanding Causal Systems">


**Step/region announcements:**

html
<!-- Stage mode: announce step changes to screen readers -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  Step 3 of 12: Key Insights
</div>


**Build step visibility:**

html
<!-- Hidden content waiting for build step -->
<div aria-hidden="true" class="build-hidden">
  <!-- Content not yet revealed -->
</div>

<!-- Revealed content -->
<div aria-hidden="false" class="build-visible">
  <!-- Visible content -->
</div>


**Diagram components:**

html
<svg role="img" aria-labelledby="diagram-title diagram-desc">
  <title id="diagram-title">Causal Loop Diagram: Population Dynamics</title>
  <desc id="diagram-desc">
    A reinforcing loop where population growth drives birth rate increase,
    which further increases population. Population growth reduces available
    resources through a balancing loop.
  </desc>
  <!-- Visual elements -->
  <g role="group" aria-label="Variable: Population">
    <circle ... />
    <text ...>Population</text>
  </g>
</svg>


**Hover annotations:**

html
<span
  tabindex="0"
  role="button"
  aria-expanded="false"
  aria-describedby="annotation-leverage-points"
>
  leverage points
</span>
<div
  id="annotation-leverage-points"
  role="tooltip"
  hidden
>
  Places in the system where a small change can lead to large shifts...
</div>


### 15.5 Color Contrast

The theme system enforces minimum contrast ratios:
- **Normal text:** 4.5:1 contrast ratio against background (WCAG AA)
- **Large text (≥18pt or ≥14pt bold):** 3:1 contrast ratio (WCAG AA)
- **UI controls and graphical objects:** 3:1 contrast ratio

Theme validation checks these ratios at build time:

typescript
// scripts/validate-theme.js
function validateContrast(theme: Theme): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  const textOnBg = getContrastRatio(theme.colors.text.primary, theme.colors.background);
  if (textOnBg < 4.5) {
    issues.push({
      pair: 'text.primary on background',
      ratio: textOnBg,
      required: 4.5,
      suggestion: `Darken text.primary or lighten background`,
    });
  }

  const textOnSurface = getContrastRatio(theme.colors.text.primary, theme.colors.surface);
  if (textOnSurface < 4.5) {
    issues.push({
      pair: 'text.primary on surface',
      ratio: textOnSurface,
      required: 4.5,
    });
  }

  // Check all color combinations...
  return issues;
}


### 15.6 Reduced Motion

All animations and transitions respect the `prefers-reduced-motion` media query:

css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.2s !important;
  }
}


At the application level:

typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Used in transition engine
function getTransitionDuration(requested: number): number {
  return prefersReducedMotion ? Math.min(requested, 200) : requested;
}

// Used in Map mode
function getCameraTransition(requested: SpringConfig): TransitionConfig {
  return prefersReducedMotion
    ? { type: 'tween', duration: 0.1 }
    : { type: 'spring', ...requested };
}


When reduced motion is active:
- Step transitions use instant cut or brief 200ms fade
- Build step animations are replaced with instant appearance
- Map camera movements are instant with brief fade
- Background shader parameter changes are instant (no interpolation)
- No bouncing, springing, or sliding animations

### 15.7 Focus Management

When navigating between steps or clusters, focus is managed programmatically:

- **Step change:** Focus moves to the step container, and the new step's heading (if present) is announced via `aria-live`
- **Build step reveal:** Focus remains on the step container; newly revealed content is announced
- **Map cluster navigation:** Focus moves to the arrived cluster
- **Modal overlays (tooltips, annotations):** Focus is trapped within the overlay; Escape dismisses and returns focus

typescript
function useStepFocusManagement(currentStepIndex: number) {
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.focus({ preventScroll: true });
    }
  }, [currentStepIndex]);

  return stepRef;
}


### 15.8 Screen Reader Announcements

A dedicated live region announces navigation events:

typescript
function ScreenReaderAnnouncer() {
  const { currentStepIndex, totalSteps, mode } = usePresentationMachine();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (mode === 'stage') {
      const step = steps[currentStepIndex];
      const heading = extractHeading(step); // Gets the first headline component's text
      setAnnouncement(
        `Step ${currentStepIndex + 1} of ${totalSteps}${heading ? `: ${heading}` : ''}`
      );
    }
  }, [currentStepIndex]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}


### 15.9 Component Authoring Requirements

The component authoring guide (`skills/docs/component-authoring.md`) specifies these accessibility requirements for all custom components:

1. **Use semantic HTML** — choose the most meaningful element, not just `<div>`
2. **Provide text alternatives** — all images need `alt`, all SVGs need `<title>` and `<desc>`
3. **Support keyboard interaction** — any clickable element must be focusable and operable via Enter/Space
4. **Use ARIA appropriately** — add roles, labels, and state attributes where semantic HTML is insufficient
5. **Ensure color is not the only differentiator** — use patterns, labels, or icons alongside color
6. **Test with a screen reader** — verify the component makes sense when read aloud
7. **Respect `prefers-reduced-motion`** — any component-internal animation must check this preference

---

## 16. Font Strategy

### 16.1 Resolution Order

Xtoryteller uses a **local-first font resolution** strategy that prioritizes self-hosted fonts for reliability while supporting CDN fonts for discovery and convenience:


1. Local fonts (public/fonts/)     ← Checked first, works offline
2. Google Fonts / Fontshare (CDN)  ← Fallback, requires internet
3. System font stack               ← Emergency fallback


### 16.2 Local Font Hosting

The project includes a `public/fonts/` directory for self-hosted font files:


public/
└── fonts/
    ├── playfair-display/
    │   ├── PlayfairDisplay-Regular.woff2
    │   ├── PlayfairDisplay-Bold.woff2
    │   └── PlayfairDisplay-Black.woff2
    ├── inter/
    │   ├── Inter-Light.woff2
    │   ├── Inter-Regular.woff2
    │   ├── Inter-Medium.woff2
    │   └── Inter-SemiBold.woff2
    └── jetbrains-mono/
        ├── JetBrainsMono-Regular.woff2
        └── JetBrainsMono-Medium.woff2


Local fonts are declared via `@font-face` in a generated CSS file:

css
/* Auto-generated from theme font configuration */
@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/PlayfairDisplay-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display/PlayfairDisplay-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* ... */


### 16.3 Theme Font Configuration

Each theme specifies its fonts and their source:

yaml
# themes/xinimalist-paper.yaml
fonts:
  heading:
    family: "Playfair Display"
    weights: [400, 700, 900]
    source: local               # local | google | fontshare
  body:
    family: "Inter"
    weights: [300, 400, 500, 600]
    source: local
  mono:
    family: "JetBrains Mono"
    weights: [400, 500]
    source: local


The font resolver processes this configuration:

typescript
function resolveFonts(fontConfig: ThemeFonts): FontResolution {
  const localFonts: FontFaceDeclaration[] = [];
  const cdnLinks: string[] = [];

  for (const [role, config] of Object.entries(fontConfig)) {
    const localPath = `public/fonts/${slugify(config.family)}/`;

    if (config.source === 'local' && existsSync(localPath)) {
      // Generate @font-face declarations from local files
      localFonts.push(...generateFontFace(config.family, localPath, config.weights));
    } else if (config.source === 'google' || (config.source === 'local' && !existsSync(localPath))) {
      // Fall back to Google Fonts CDN
      cdnLinks.push(generateGoogleFontsURL(config.family, config.weights));
      if (config.source === 'local') {
        console.warn(
          `Font "${config.family}" not found locally at ${localPath}. Falling back to Google Fonts CDN.`
        );
      }
    } else if (config.source === 'fontshare') {
      cdnLinks.push(generateFontshareURL(config.family, config.weights));
    }
  }

  return { localFonts, cdnLinks };
}


### 16.4 Default Theme Fonts

The global fallback theme ships with these fonts pre-installed or configured:

| Role | Font | Character | Rationale |
|---|---|---|---|
| Heading | Playfair Display | Elegant serif with distinctive character | Sets a warm, intelligent tone distinct from generic sans-serif |
| Body | Inter | Clean, highly legible sans-serif | Optimized for screen reading at all sizes; extensive weight range |
| Mono | JetBrains Mono | Developer-focused monospace | Excellent legibility for code blocks; ligature support |

These fonts can be included in the repository under `public/fonts/` so the global fallback theme works fully offline.

### 16.5 Font Discovery Workflow

When creating a custom theme, the agent can suggest font pairings:

yaml
# In the style-discovery sub-pipeline
font_pairing_suggestions:
  confident_professional:
    heading: { family: "Cormorant", source: google }
    body: { family: "IBM Plex Sans", source: google }
  bold_modern:
    heading: { family: "Syne", source: google }
    body: { family: "Space Grotesk", source: google }
  calm_editorial:
    heading: { family: "Fraunces", source: google }
    body: { family: "Work Sans", source: google }
  creative_playful:
    heading: { family: "Outfit", source: google }
    body: { family: "Plus Jakarta Sans", source: google }
  technical_precise:
    heading: { family: "Archivo", source: google }
    body: { family: "Nunito", source: google }


For CDN-sourced fonts, the agent can suggest downloading them locally for offline reliability:

bash
# Future utility script
node scripts/download-font.js "Cormorant" --weights 400,600,700 --source google


This downloads the WOFF2 files to `public/fonts/cormorant/` and updates the theme to `source: local`.

### 16.6 System Font Fallback

If both local and CDN fonts fail to load, every font declaration includes a system font fallback stack:

css
:root {
  --font-heading: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
}


### 16.7 Font Loading Performance

- All local fonts use `font-display: swap` to prevent invisible text during loading
- CDN font links are placed in `<head>` with `rel="preconnect"` for the font server
- Critical fonts (heading and body) are preloaded: `<link rel="preload" as="font" href="/fonts/..." crossorigin>`
- Font files use WOFF2 format exclusively (best compression, universal browser support)
- Only the weights specified in the theme are loaded — unused weights are not fetched

---

## 17. Developer Experience & Tooling

### 17.1 Getting Started

The project setup is minimal — clone, install, develop:

bash
# Clone the project
git clone https://github.com/user/xtoryteller.git
cd xtoryteller

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# → http://localhost:3000 (dashboard)


### 17.2 NPM Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Start development server with hot reload and file watching |
| `build` | `next build` | Production build (SSR-capable) |
| `export` | `next build && next export` | Static export for simple hosting |
| `start` | `next start` | Start production server (SSR mode) |
| `validate` | `node scripts/validate.js` | Validate a presentation YAML against schema |
| `validate:all` | `node scripts/validate-all.js` | Validate all presentations |
| `registries` | `node scripts/generate-registries.js` | Regenerate component/layout/transition/theme registries |
| `import` | `node scripts/import.js` | Import a presentation package |
| `export:presentation` | `node scripts/export.js` | Export a presentation as a portable zip |
| `thumbnails` | `node scripts/generate-thumbnails.js` | Generate thumbnails for all presentations |
| `validate:theme` | `node scripts/validate-theme.js` | Validate theme contrast ratios and font availability |
| `lint` | `eslint . && prettier --check .` | Lint and format check |

### 17.3 File Watching & Hot Reload

The development server watches the filesystem for changes and provides instant feedback:

**Watched paths and behaviors:**

| Path Pattern | On Change | Behavior |
|---|---|---|
| `presentations/*/presentation.yaml` | YAML re-parsed | Browser updates presentation without page reload; preserves current step/build |
| `presentations/*/assets/*` | Asset re-served | Browser re-fetches changed assets |
| `components/*/index.tsx` | Module hot-replaced | React Fast Refresh updates the component in-place |
| `components/*/manifest.yaml` | Registry regenerated | Agent registry files updated |
| `layouts/*/index.tsx` | Module hot-replaced | React Fast Refresh updates the layout in-place |
| `themes/*.yaml` | Theme re-parsed | CSS custom properties updated; all themed elements re-render |
| `transitions/*/index.ts` | Module hot-replaced | Transition functions updated |

**Implementation:**

The dev server extends Next.js's built-in HMR with a custom WebSocket channel for YAML changes:

typescript
// server/watcher.ts
import { watch } from 'chokidar';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

const watcher = watch([
  'presentations/**/presentation.yaml',
  'themes/*.yaml',
  'components/*/manifest.yaml',
  'layouts/*/manifest.yaml',
  'transitions/*/manifest.yaml',
], {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 300 },
});

watcher.on('change', (path) => {
  const type = inferChangeType(path); // 'presentation-changed' | 'theme-changed' | 'registry-changed'
  const slug = extractSlug(path);

  // Regenerate registries if a manifest changed
  if (type === 'registry-changed') {
    regenerateRegistries();
  }

  // Notify all connected clients
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ type, path, slug }));
  });
});


### 17.4 Validation Tooling

#### Schema Validation CLI

bash
# Validate a single presentation
node scripts/validate.js presentations/my-talk/presentation.yaml

# Validate all presentations
node scripts/validate-all.js

# Validate with verbose output
node scripts/validate.js presentations/my-talk/presentation.yaml --verbose


**Output examples:**

Success:

✓ presentations/my-talk/presentation.yaml is valid
  Mode: stage
  Steps: 12
  Components used: headline, body-text, bullet-list, causal-diagram, card
  Theme: default (with overrides)
  Build steps: 24 total


Failure:

✗ presentations/my-talk/presentation.yaml has 3 issues:

  ERROR  steps[2].components[0].type: "causal-diagrams" is not a registered component
         Did you mean "causal-diagram"?

  ERROR  steps[5].layout: "three-columns" is not a registered layout
         Did you mean "three-column"?

  WARNING  steps[3] has 8 components in a "two-column" layout
           Recommended maximum: 2 components (1 per slot)
           Consider splitting into multiple steps


#### Theme Validation

bash
node scripts/validate-theme.js themes/my-theme.yaml



Validating theme: "My Custom Theme"

Color Contrast:
  ✓ text.primary on background — 8.2:1 (required: 4.5:1)
  ✓ text.primary on surface — 9.1:1 (required: 4.5:1)
  ✓ text.secondary on background — 5.3:1 (required: 4.5:1)
  ✗ text.muted on background — 2.8:1 (required: 4.5:1)
    Suggestion: Darken colors.text.muted from #bbbbbb to at least #767676

Fonts:
  ✓ heading: "Cormorant" — found locally at public/fonts/cormorant/
  ⚠ body: "IBM Plex Sans" — not found locally, will use Google Fonts CDN
    Run: node scripts/download-font.js "IBM Plex Sans" --weights 300,400,500
  ✓ mono: "JetBrains Mono" — found locally at public/fonts/jetbrains-mono/

Typography Scale:
  ✓ All sizes use clamp()
  ✓ Scale progression is consistent


### 17.5 Registry Generation

The registry generator scans the filesystem and produces JSON index files consumed by agents:

bash
node scripts/generate-registries.js



Generating registries...

Components:
  Scanned: components/*/manifest.yaml
  Found: 32 components
  Categories: basic-content (10), media (6), card-container (6), diagram (16)
  Output: skills/references/component-registry.json

Layouts:
  Scanned: layouts/*/manifest.yaml
  Found: 19 layouts
  Categories: title (3), split (4), grid (3), full (2), flow (4), special (3)
  Output: skills/references/layout-registry.json

Transitions:
  Scanned: transitions/*/manifest.yaml
  Found: 12 transitions
  Categories: subtle (2), dynamic (4), dramatic (2), bold (2), special (2)
  Output: skills/references/transition-registry.json

Themes:
  Scanned: themes/*.yaml
  Found: 1 theme
  Output: skills/xtoryteller/references/registries/theme-registry.json

✓ All registries generated


The generated JSON files contain the full manifest data for each entry, structured for agent consumption:

json
// skills/references/component-registry.json (abbreviated)
{
  "generatedAt": "2025-06-20T10:30:00Z",
  "count": 32,
  "components": [
    {
      "name": "headline",
      "displayName": "Headline",
      "description": "Large title text, configurable heading level (h1-h3)",
      "category": "basic-content",
      "content": true,
      "props": {
        "level": {
          "type": "enum",
          "values": [1, 2, 3],
          "default": 1,
          "description": "Heading level (h1, h2, h3)"
        }
      },
      "density": {
        "recommendation": "Use in title-center or section-header layouts"
      }
    },
    {
      "name": "causal-diagram",
      "displayName": "Causal Loop Diagram",
      "description": "Renders a causal loop diagram showing variables connected by directed edges with polarity labels (+/-)",
      "category": "diagram",
      "content": false,
      "props": {
        "variables": {
          "type": "array<{ id: string, label: string, detail?: string }>",
          "required": true,
          "description": "List of variables (nodes) in the diagram"
        },
        "edges": {
          "type": "array<{ from: string, to: string, polarity: '+' | '-', label?: string }>",
          "required": true,
          "description": "Directed edges between variables with polarity"
        }
      }
    }
  ]
}


### 17.6 Error Handling & Developer Feedback

During development, the application provides clear feedback for common issues:

**Missing component:**


┌──────────────────────────────────────────────────────┐
│ ⚠ Component Not Found: "causal-diagrams"            │
│                                                      │
│ Step 3, Component 0 references a component type      │
│ that is not in the registry.                         │
│                                                      │
│ Did you mean: causal-diagram ?                       │
│                                                      │
│ Available diagram components:                        │
│ • causal-diagram                                     │
│ • mind-map                                           │
│ • flowchart                                          │
│ • iceberg-diagram                                    │
│                                                      │
│ File: presentations/my-talk/presentation.yaml:47     │
└──────────────────────────────────────────────────────┘


**Invalid YAML syntax:**


┌──────────────────────────────────────────────────────┐
│ ✗ YAML Parse Error                                   │
│                                                      │
│ presentations/my-talk/presentation.yaml              │
│ Line 23, Column 5:                                   │
│   Bad indentation — expected 4 spaces, found 5       │
│                                                      │
│ Context:                                             │
│   22 │   components:                                 │
│   23 │     - type: headline   ← here                │
│   24 │       content: "Hello"                        │
└──────────────────────────────────────────────────────┘


These errors render as styled overlay components in the browser during development. In production builds, invalid presentations are excluded with a build-time warning.

### 17.7 TypeScript Types

The project exports TypeScript types for all data structures, enabling type-safe development of custom components:

typescript
// types/presentation.ts
export interface PresentationConfig {
  meta: PresentationMeta;
  mode: 'stage' | 'map';
  theme: string;
  themeOverrides?: Partial<ThemeConfig>;
  background?: BackgroundConfig;
  steps?: StepDefinition[];      // Stage mode
  clusters?: ClusterDefinition[]; // Map mode
  canvas?: CanvasConfig;          // Map mode
  navigation?: NavigationConfig;  // Map mode
  data?: Record<string, any>;     // Template expression data
}

export interface StepDefinition {
  layout: string;
  layoutProps?: Record<string, any>;
  transition?: string;
  components: ComponentInstance[];
}

export interface ComponentInstance {
  type: string;
  content?: string;
  props?: Record<string, any>;
  style?: React.CSSProperties;
  build?: number | 'sequential' | { with: number };
  enter?: string;
  exit?: string;
  annotations?: Record<string, string>;
}

// ... and so on for all data structures


---

## 18. Deployment

### 18.1 Deployment Strategy

Xtoryteller is designed for **Vercel deployment** as the primary hosting path, with static export as a compatible alternative for other hosts.

### 18.2 Vercel Deployment (Primary)

**First-time setup:**

bash
# Install Vercel CLI (if not present)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# → Link to existing project? No
# → Project name: my-xtoryteller
# → Framework preset: Next.js (auto-detected)
# → Build settings: default


**Subsequent deployments:**

bash
# Deploy to production
vercel --prod


**Automatic deployments:** If the project is hosted on GitHub, Vercel can be configured for automatic deployment on push:
1. Connect the GitHub repository in the Vercel dashboard
2. Every push to `main` triggers a production build
3. Pull request branches get preview deployments

### 18.3 Build Modes

**SSR Mode (Default for Vercel):**

bash
npm run build   # next build
npm run start   # next start (production server)


- Presentation YAML files are loaded at request time
- New presentations can be added without rebuilding (via ISR or on-demand revalidation)
- Supports API routes if needed in the future
- Best for instances that update frequently

**Static Export Mode:**

bash
npm run export  # next build && next export


- All presentations are pre-rendered at build time
- Output is a static folder (`out/`) that can be hosted anywhere
- No server runtime required — works on any static file host (Vercel, Netlify, GitHub Pages, S3, etc.)
- Must rebuild to add or modify presentations
- Best for instances that update infrequently or need simplest possible hosting

### 18.4 Build-Time Processing

During `next build`, the following build-time processing occurs:

1. **YAML Compilation:** All `presentation.yaml` files are parsed and validated. Invalid presentations fail the build with clear error messages.

2. **Registry Generation:** Component, layout, transition, and theme registries are generated and bundled.

3. **Thumbnail Generation:** For presentations without a provided thumbnail, a headless browser renders the first step and captures a screenshot. This requires Playwright and adds build time; it can be skipped with `SKIP_THUMBNAILS=true`.

4. **Font Resolution:** Font availability is checked. Missing local fonts generate build warnings.

5. **Theme Validation:** All referenced themes are validated for contrast ratios. Failures generate warnings (not errors — imperfect contrast shouldn't block deployment).

6. **Static Route Generation:** Each presentation slug is registered as a static route for the Next.js router.

typescript
// next.config.js
module.exports = {
  // Enable static export when desired
  output: process.env.STATIC_EXPORT ? 'export' : undefined,

  // Generate static paths for all presentations
  async generateStaticParams() {
    const presentations = scanPresentationSlugs();
    return presentations.map((slug) => ({ slug }));
  },
};


### 18.5 Environment Configuration

bash
# .env.local (development)
NEXT_PUBLIC_WS_PORT=3001          # WebSocket port for hot reload
SKIP_THUMBNAILS=false             # Skip thumbnail generation

# .env.production
NEXT_PUBLIC_BASE_URL=https://my-presentations.vercel.app


### 18.6 Performance Optimization

**Bundle optimization:**
- Paper-shader (WebGL) is loaded asynchronously — it doesn't block initial page render
- ELK.js (diagram layout) is loaded only when a presentation uses diagram components
- D3 modules are tree-shaken — only imported modules are bundled
- Component code is dynamically imported per presentation — unused components are not loaded

typescript
// Dynamic component loading
const componentLoaders: Record<string, () => Promise<React.ComponentType>> = {
  'headline': () => import('@/components/headline').then(m => m.default),
  'causal-diagram': () => import('@/components/causal-diagram').then(m => m.default),
  'mind-map': () => import('@/components/mind-map').then(m => m.default),
  // ...
};

async function loadComponents(presentation: PresentationConfig) {
  const usedTypes = new Set(
    presentation.steps?.flatMap(s => s.components.map(c => c.type)) ?? []
  );

  const loaded: Record<string, React.ComponentType> = {};
  for (const type of usedTypes) {
    loaded[type] = await componentLoaders[type]();
  }
  return loaded;
}


**Asset optimization:**
- Images in `assets/` are served through Next.js Image Optimization (in SSR mode) or as static files (in export mode)
- Font files use WOFF2 format (maximum compression)
- CSS custom properties are generated once and cached

**Runtime performance:**
- WebGL shader runs on GPU, independent of DOM rendering
- CSS transforms for Map mode pan/zoom are GPU-accelerated
- Framer Motion uses `transform` and `opacity` for animations (GPU-composited properties)
- XState machine updates are synchronous and lightweight
- Intersection Observer is used for lazy component mounting (only render components near the viewport in Map mode)

### 18.7 CDN & Caching

When deployed to Vercel:
- Static assets (fonts, images) are served from Vercel's Edge Network with long cache TTL
- Presentation YAML (compiled to JSON) is cached at the edge with ISR revalidation
- The SPA shell is cached aggressively; only data changes trigger refetches

---

