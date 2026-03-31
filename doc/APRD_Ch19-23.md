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

## 19. Anti-Patterns & Guidelines

### 19.1 Purpose

This document serves two audiences:
1. **Agents:** Referenced in the skill system to prevent common mistakes when generating presentations
2. **Humans:** Referenced when manually creating or modifying presentations or components

### 19.2 Presentation Authoring Anti-Patterns

#### ❌ Hardcoding Colors

yaml
# WRONG — colors will not respond to theme changes
- type: headline
  content: "Title"
  style:
    color: "#2c3e50"
    backgroundColor: "#f5f0e8"


yaml
# CORRECT — reference theme variables
- type: headline
  content: "Title"
  style:
    color: "var(--color-primary)"
    backgroundColor: "var(--color-background)"


**Exception:** One-off accent colors that are content-specific (e.g., a brand logo color) may be hardcoded, but only at the component `style` level, never in the theme.

#### ❌ Exceeding Content Density Limits

yaml
# WRONG — 8 bullet points in a two-column layout
- layout: two-column
  components:
    - type: bullet-list
      items: [A, B, C, D, E, F, G, H]
    - type: bullet-list
      items: [I, J, K, L, M, N, O, P]


yaml
# CORRECT — split across multiple steps
- layout: two-column
  components:
    - type: bullet-list
      items: [A, B, C, D]
    - type: image
      props: { src: assets/diagram.png }

- layout: two-column
  components:
    - type: bullet-list
      items: [E, F, G, H]
    - type: callout
      content: "Key takeaway..."


**Rule:** Never cram. Never scroll. Always split.

#### ❌ Using a Non-Existent Component Type

yaml
# WRONG — will fail validation
- type: causal-diagrams    # Typo!
  props: { ... }


**Rule:** Always check the component registry before referencing a type. Run validation after generating.

#### ❌ Creating a New Component When a Preset Works

yaml
# WRONG approach: Agent creates a custom "highlighted-text" component
# when body-text with a callout would work fine


**Rule:** Before creating a custom component, verify that no existing component can achieve the desired result through props or styling. Check the component registry thoroughly.

#### ❌ Omitting Build Steps for Dense Content

yaml
# WRONG — all content appears at once, overwhelming the viewer
- layout: single-content
  components:
    - type: bullet-list
      build: 0              # Everything appears immediately
      items: [A, B, C, D, E]


yaml
# CORRECT — content builds incrementally
- layout: single-content
  components:
    - type: bullet-list
      build: sequential     # Each bullet appears one by one
      items: [A, B, C, D, E]


**Rule:** For content slides with more than 2-3 elements, use build steps to guide the viewer's attention.

#### ❌ Inconsistent Transition Styles

yaml
# WRONG — every step has a different, unrelated transition
steps:
  - transition: fade
  - transition: slide-left
  - transition: scale
  - transition: blur
  - transition: wipe-up
  - transition: slide-right
  - transition: drop


yaml
# CORRECT — consistent base with intentional variation
steps:
  - transition: fade            # Title entrance
  - transition: slide-left      # Content progression (consistent)
  - transition: slide-left      # Content progression (consistent)
  - transition: scale           # Emphasis moment (intentional break)
  - transition: slide-left      # Resume progression
  - transition: slide-left      # Resume progression
  - transition: fade            # Closing


**Rule:** Choose 1-2 primary transitions and use them consistently. Use a contrasting transition only for intentional emphasis — section changes, key reveals, or mood shifts.

#### ❌ Missing Meta Information

yaml
# WRONG — minimal meta, hard to find later
meta:
  title: "Talk"
  slug: talk


yaml
# CORRECT — comprehensive, searchable meta
meta:
  title: "Understanding Causal Systems"
  slug: causal-systems
  description: "A primer on systems thinking and causal loop diagrams for the 2025 workshop series"
  author: "Jane Doe"
  tags: [systems-thinking, workshop, beginner, causality]
  createdAt: 2025-06-20


**Rule:** Always include meaningful title, slug, description, and tags. This makes presentations findable in the dashboard and provides context for agents modifying them later.

### 19.3 Component Development Anti-Patterns

#### ❌ Fixed Pixel Sizes

css
/* WRONG */
.headline {
  font-size: 48px;
  padding: 32px;
  margin-bottom: 24px;
}


css
/* CORRECT */
.headline {
  font-size: var(--text-h1);                        /* Theme variable, uses clamp() */
  padding: var(--spacing-content-gap);               /* Theme variable */
  margin-bottom: var(--spacing-element-gap);         /* Theme variable */
}


**Rule:** Never use fixed pixel values for typography or spacing. Use theme CSS custom properties, which are defined with `clamp()` for responsive scaling.

#### ❌ Hardcoded Colors in Components

tsx
// WRONG
const Card = () => (
  <div style={{ backgroundColor: '#ffffff', color: '#333333', borderColor: '#e0e0e0' }}>
    ...
  </div>
);


css
/* CORRECT */
.card {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}


**Rule:** Components must reference theme CSS custom properties. This ensures they adapt when the theme changes.

#### ❌ Non-Semantic HTML

tsx
// WRONG
const Quote = ({ text, author }) => (
  <div className="quote">
    <div className="quote-text">{text}</div>
    <div className="quote-author">{author}</div>
  </div>
);


tsx
// CORRECT
const Quote = ({ text, author }) => (
  <figure className="quote">
    <blockquote>
      <p>{text}</p>
    </blockquote>
    <figcaption>
      — <cite>{author}</cite>
    </figcaption>
  </figure>
);


**Rule:** Use the most semantically meaningful HTML element. Never use `<div>` when a more specific element exists.

#### ❌ Ignoring Reduced Motion

tsx
// WRONG — animation plays regardless of user preference
const AnimatedChart = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', bounce: 0.5 }}
  >
    ...
  </motion.div>
);


tsx
// CORRECT — respects user preference
const AnimatedChart = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={prefersReducedMotion
        ? { duration: 0.2 }
        : { type: 'spring', bounce: 0.5 }
      }
    >
      ...
    </motion.div>
  );
};


**Rule:** All component-internal animations must check `prefers-reduced-motion` and provide a subdued alternative.

#### ❌ Missing Component Manifest


components/
└── my-widget/
    └── index.tsx           # No manifest.yaml!


**Rule:** Every component must have a `manifest.yaml`. Without it, agents cannot discover or use the component. The component will not appear in the registry.

### 19.4 Map Mode Anti-Patterns

#### ❌ Overlapping Clusters

yaml
# WRONG — clusters too close together
- id: intro
  anchor: origin
- id: details
  anchor:
    relativeTo: intro
    direction: right
    distance: 50        # Way too close


**Rule:** Minimum distance between clusters should be at least `canvas.spacing` (default: 300). Closer clusters risk visual overlap and navigation confusion.

#### ❌ Unresolvable Relative References

yaml
# WRONG — circular or dangling reference
- id: A
  anchor:
    relativeTo: C       # C is defined after A and references B which references A
    direction: right
    distance: 300
- id: B
  anchor:
    relativeTo: A
    direction: below
    distance: 300
- id: C
  anchor:
    relativeTo: B
    direction: left
    distance: 300       # Circular!


**Rule:** Relative positioning must form a directed acyclic graph (DAG) rooted at the `origin` cluster. The validator checks for circular references and dangling references.

### 19.5 Theme Anti-Patterns

#### ❌ Insufficient Contrast

yaml
# WRONG — light gray text on white background
colors:
  text:
    primary: "#cccccc"    # Too light!
  background: "#ffffff"


**Rule:** Run `node scripts/validate-theme.js` to check all contrast ratios. WCAG AA requires 4.5:1 for normal text.

#### ❌ Missing Font Weights

yaml
# WRONG — body font only includes 400, but components use 300 and 600
fonts:
  body:
    family: "Inter"
    weights: [400]        # Missing weights!


**Rule:** Include all font weights that components might use. The default component set uses weights 300 (light), 400 (regular), 500 (medium), and 600 (semi-bold) for body text.

---

## 20. Preset Component & Layout Registry

### 20.1 Overview

This section provides the detailed specification for every built-in component and layout that ships with Xtoryteller. Each entry describes the component's purpose, props, content model, density guidance, and build step behavior.

### 20.2 Basic Content Components

#### `headline`

| Property | Value |
|---|---|
| **Purpose** | Large title text for step headings and section titles |
| **Content** | Plain text (single line recommended) |
| **HTML** | `<h1>`, `<h2>`, or `<h3>` based on `level` prop |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `level` | `1 \| 2 \| 3` | `1` | Heading level (h1, h2, h3) |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |

**Density:** Takes 1 heading slot. Pair with subtitle, body-text, or other components.

---

#### `subtitle`

| Property | Value |
|---|---|
| **Purpose** | Secondary text below a headline |
| **Content** | Plain text or single-line Markdown |
| **HTML** | `<p>` with `role="doc-subtitle"` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |

---

#### `body-text`

| Property | Value |
|---|---|
| **Purpose** | Paragraph text blocks with rich formatting |
| **Content** | Markdown (rendered to HTML: `<p>`, `<strong>`, `<em>`, `<a>`, etc.) |
| **HTML** | Varies by Markdown output |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `align` | `'left' \| 'center' \| 'right' \| 'justify'` | `'left'` | Text alignment |
| `maxWidth` | `string` | `'65ch'` | Maximum width for readability |

**Density:** Maximum 2 short paragraphs per slot.

---

#### `bullet-list`

| Property | Value |
|---|---|
| **Purpose** | Unordered or ordered list with build step support |
| **Content** | Not used — items are provided via `items` prop |
| **HTML** | `<ul>` + `<li>` or `<ol>` + `<li>` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `string[]` | Required | List items (Markdown supported per item) |
| `ordered` | `boolean` | `false` | Render as ordered list |
| `icon` | `string` | `undefined` | Custom bullet icon (emoji or icon reference) |

**Build Behavior:** Supports `build: sequential` — each item appears on a successive build action.

**Density:** Maximum 6 items per list.

---

#### `numbered-list`

Alias for `bullet-list` with `ordered: true`. Same props and behavior.

---

#### `blockquote`

| Property | Value |
|---|---|
| **Purpose** | Styled quotation with optional attribution |
| **Content** | Markdown (the quote text) |
| **HTML** | `<figure>` + `<blockquote>` + `<figcaption>` + `<cite>` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `attribution` | `string` | `undefined` | Quote author or source |
| `variant` | `'default' \| 'large' \| 'minimal'` | `'default'` | Visual style |

**Density:** Maximum 3 lines of quote text.

---

#### `callout`

| Property | Value |
|---|---|
| **Purpose** | Highlighted box for tips, warnings, notes, key insights |
| **Content** | Markdown |
| **HTML** | `<aside>` with `role="note"` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'info' \| 'warning' \| 'tip' \| 'note' \| 'important'` | `'note'` | Visual variant with icon and color |
| `title` | `string` | `undefined` | Optional callout heading |

**Density:** Maximum 3-4 lines of content.

---

#### `footnote`

| Property | Value |
|---|---|
| **Purpose** | Small reference text anchored to the bottom of a step |
| **Content** | Plain text or short Markdown |
| **HTML** | `<footer>` + `<small>` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |

---

#### `label`

| Property | Value |
|---|---|
| **Purpose** | Short text badge or tag for categorization or annotation |
| **Content** | Plain text (short — 1-3 words) |
| **HTML** | `<span>` with badge styling |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'outline'` | `'default'` | Color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Badge size |

---

#### `divider`

| Property | Value |
|---|---|
| **Purpose** | Visual separator between content sections |
| **Content** | None |
| **HTML** | `<hr>` with styled variants |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'line' \| 'dots' \| 'ornamental' \| 'gradient'` | `'line'` | Visual style |
| `spacing` | `'small' \| 'medium' \| 'large'` | `'medium'` | Vertical space around divider |

---

### 20.3 Media Components

#### `image`

| Property | Value |
|---|---|
| **Purpose** | Responsive image with optional caption |
| **Content** | None — image specified via `src` prop |
| **HTML** | `<figure>` + `<img>` + `<figcaption>` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | Required | Image path (relative to presentation assets/) or external URL |
| `alt` | `string` | Required | Alt text for accessibility |
| `caption` | `string` | `undefined` | Caption text below image |
| `fit` | `'contain' \| 'cover' \| 'fill'` | `'contain'` | Object-fit behavior |
| `maxHeight` | `string` | `'min(50vh, 400px)'` | Maximum height constraint |
| `rounded` | `boolean` | `false` | Apply border-radius |
| `shadow` | `boolean` | `false` | Apply drop shadow |

---

#### `video`

| Property | Value |
|---|---|
| **Purpose** | Embedded video player |
| **Content** | None — video specified via `src` prop |
| **HTML** | `<figure>` + `<video>` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | Required | Video path (relative or URL) |
| `poster` | `string` | `undefined` | Poster image before playback |
| `autoplay` | `boolean` | `false` | Auto-play when step is entered |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `true` | Muted by default |
| `controls` | `boolean` | `true` | Show playback controls |
| `maxHeight` | `string` | `'min(60vh, 500px)'` | Maximum height |

---

#### `svg-graphic`

| Property | Value |
|---|---|
| **Purpose** | Inline SVG graphic with optional animation |
| **Content** | None — SVG specified via `src` prop |
| **HTML** | Inline `<svg>` (not `<img>`) for styling and animation access |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | Required | SVG file path |
| `alt` | `string` | Required | Accessible description |
| `animated` | `boolean` | `false` | Enable SVG entrance animation (draw effect) |
| `maxHeight` | `string` | `'min(50vh, 400px)'` | Maximum height |

---

#### `iframe-embed`

| Property | Value |
|---|---|
| **Purpose** | Embed external web content |
| **Content** | None — URL specified via `src` prop |
| **HTML** | `<iframe>` with responsive wrapper |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | Required | URL to embed |
| `title` | `string` | Required | Accessible title for the iframe |
| `aspectRatio` | `string` | `'16/9'` | Aspect ratio of the embed |
| `maxHeight` | `string` | `'min(60vh, 500px)'` | Maximum height |

---

#### `code-block`

| Property | Value |
|---|---|
| **Purpose** | Syntax-highlighted code display |
| **Content** | Code text (provided via `content` field in YAML) |
| **HTML** | `<pre>` + `<code>` |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `language` | `string` | `'text'` | Programming language for syntax highlighting |
| `highlightLines` | `number[]` | `[]` | Line numbers to highlight/emphasize |
| `showLineNumbers` | `boolean` | `false` | Display line numbers |
| `maxLines` | `number` | `15` | Maximum visible lines (truncates with scroll indicator) |
| `filename` | `string` | `undefined` | Optional filename header |

**Density:** Maximum 10-15 lines per code block in a presentation context.

---

#### `icon`

| Property | Value |
|---|---|
| **Purpose** | Decorative or informational icon element |
| **Content** | None |
| **HTML** | `<span>` wrapping SVG icon |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | Required | Lucide icon name in kebab-case (for example `sparkles` or `arrow-right`) |
| `customSvg` | `string` | `undefined` | Optional raw SVG markup for an explicitly requested custom icon. Overrides `name` when present. |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Icon size |
| `color` | `string` | `'var(--color-primary)'` | Icon color |

Built-in presets use Lucide by default. Custom SVG should be treated as an advanced opt-in path for bespoke marks, not the default authoring workflow.

---

### 20.4 Card & Container Components

#### `card`

| Property | Value |
|---|---|
| **Purpose** | General-purpose content card with optional header and footer |
| **Content** | Markdown (renders in the card body) |
| **HTML** | `<article>` with sectioned layout |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `header` | `string` | `undefined` | Card header text |
| `footer` | `string` | `undefined` | Card footer text |
| `variant` | `'default' \| 'elevated' \| 'outlined' \| 'filled'` | `'default'` | Visual variant |
| `accent` | `string` | `undefined` | Optional left/top accent color bar |

---

#### `stat-card`

| Property | Value |
|---|---|
| **Purpose** | Display a large metric/number with label and optional trend |
| **Content** | None — data via props |
| **HTML** | `<article>` with structured layout |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| number` | Required | The primary metric value |
| `label` | `string` | Required | Description of the metric |
| `trend` | `'up' \| 'down' \| 'neutral'` | `undefined` | Trend indicator arrow |
| `trendValue` | `string` | `undefined` | Trend detail (e.g., "+12%") |
| `prefix` | `string` | `undefined` | Value prefix (e.g., "$") |
| `suffix` | `string` | `undefined` | Value suffix (e.g., "%") |

---

#### `profile-card`

| Property | Value |
|---|---|
| **Purpose** | Person/entity card with avatar, name, role |
| **Content** | Markdown (renders as bio/description) |
| **HTML** | `<article>` with avatar and text layout |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | Required | Person's name |
| `role` | `string` | `undefined` | Title or role |
| `avatar` | `string` | `undefined` | Avatar image path or URL |

---

#### `feature-card`

| Property | Value |
|---|---|
| **Purpose** | Feature highlight with icon, title, and description |
| **Content** | Markdown (renders as feature description) |
| **HTML** | `<article>` with icon and text |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | Required | Feature name |
| `icon` | `string` | `undefined` | Lucide icon name |

---

#### `comparison-card`

| Property | Value |
|---|---|
| **Purpose** | Side-by-side comparison (before/after, option A vs B) |
| **Content** | None — content via props |
| **HTML** | `<article>` with two panels |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `leftTitle` | `string` | Required | Left panel heading |
| `leftContent` | `string` | Required | Left panel content (Markdown) |
| `rightTitle` | `string` | Required | Right panel heading |
| `rightContent` | `string` | Required | Right panel content (Markdown) |
| `variant` | `'versus' \| 'before-after' \| 'neutral'` | `'neutral'` | Visual treatment |

---

#### `timeline-item`

| Property | Value |
|---|---|
| **Purpose** | Single event in a timeline sequence |
| **Content** | Markdown (event description) |
| **HTML** | `<article>` with date marker |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `date` | `string` | Required | Date or time label |
| `title` | `string` | Required | Event title |
| `marker` | `'dot' \| 'icon' \| 'number'` | `'dot'` | Timeline marker style |
| `markerValue` | `string` | `undefined` | Lucide icon name when `marker: icon`, or literal text when `marker: number` |

---

### 20.5 Diagram Components

#### `causal-diagram`
| Property | Value |
|---|---|
| **Purpose** | Directed graph showing causal relationships between variables with polarity labels |
| **Content** | None — data via props |
| **HTML** | `<svg>` with `role="img"`, `<title>`, `<desc>` |
| **Layout Engine** | ELK.js for automatic node positioning |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `variables` | `array<{ id: string, label: string, detail?: string }>` | Required | Nodes in the diagram |
| `edges` | `array<{ from: string, to: string, polarity: '+' \| '-', label?: string }>` | Required | Directed edges with polarity |
| `layoutDirection` | `'horizontal' \| 'vertical' \| 'radial'` | `'horizontal'` | Primary layout direction |
| `showLoops` | `boolean` | `true` | Highlight detected feedback loops (reinforcing/balancing) |
| `style.nodeColor` | `string` | `'var(--color-primary)'` | Node fill color |
| `style.edgeColor` | `string` | `'var(--color-text-secondary)'` | Edge stroke color |
| `style.positiveColor` | `string` | `'var(--color-success)'` | Color for positive polarity indicators |
| `style.negativeColor` | `string` | `'var(--color-error)'` | Color for negative polarity indicators |
| `style.edgeStyle` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Edge stroke style |
| `style.nodeRadius` | `number` | `40` | Node circle radius |
| `style.fontSize` | `string` | `'var(--text-small)'` | Label font size |

**Build Behavior:**
- `all-at-once` — Everything appears together (default)
- `nodes-first` — Nodes appear, then edges animate in with draw effect
- `sequential` — Nodes and their outgoing edges appear one by one

**Hover Behavior:** Hovering a node shows its `detail` text in a tooltip. Hovering an edge highlights the two connected nodes.

**Accessibility:** SVG has `role="img"` with `<title>` containing the diagram name and `<desc>` containing a text description of all relationships (auto-generated from edges: "Population positively influences Birth Rate. Birth Rate positively influences Population. Population negatively influences Available Resources.").

---

#### `mind-map`
| Property | Value |
|---|---|
| **Purpose** | Radial or hierarchical mind map with expandable nodes |
| **Content** | None — data via props |
| **HTML** | `<svg>` with `role="img"` |
| **Layout Engine** | ELK.js (tree layout) |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `root` | `{ label: string, detail?: string }` | Required | Central/root node |
| `branches` | `array<Branch>` | Required | Top-level branches from root |
| `layoutMode` | `'radial' \| 'tree-horizontal' \| 'tree-vertical'` | `'radial'` | Layout algorithm |
| `maxDepth` | `number` | `4` | Maximum visible depth |
| `style.branchColors` | `string[]` | Theme-derived | Color per top-level branch |
| `style.nodeRadius` | `number` | `30` | Node size |
| `style.connectionStyle` | `'curved' \| 'straight' \| 'organic'` | `'curved'` | Edge curve style |

**Branch type:**
yaml
branches:
  - label: "Core Concepts"
    detail: "Foundational ideas"
    children:
      - label: "Feedback Loops"
        children:
          - label: "Reinforcing"
          - label: "Balancing"
      - label: "Emergence"


**Build Behavior:** Supports `sequential` — branches appear one by one from root outward, depth-first or breadth-first (configurable).

---

#### `iceberg-diagram`
| Property | Value |
|---|---|
| **Purpose** | Layered depth metaphor with SVG water/ice visuals for exploring hidden structures beneath surface observations |
| **Content** | None — data via props |
| **HTML** | `<svg>` with custom iceberg illustration + DOM overlays for text |
| **Rendering** | Custom SVG (no graph layout engine needed) |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `layers` | `array<{ depth: string, label: string, items: string[], detail?: string }>` | Required | Layers from top to bottom |
| `waterlinePosition` | `number` | `0.25` | Fraction from top where the waterline sits (0-1) |
| `style.waterColor` | `string` | `'var(--color-accent)'` | Water/below-surface tint |
| `style.iceColor` | `string` | `'var(--color-surface)'` | Above-surface tint |
| `style.opacity` | `number` | `0.15` | Tint overlay opacity |

**Standard depth names:** `surface`, `patterns`, `structures`, `mental-models` (but users can define custom depth names).

**Build Behavior:**
- `top-down` — Layers reveal from surface downward (default)
- `all-at-once` — Everything appears together

**Hover Behavior:** Hovering a layer highlights it and shows its `detail` text. Hovering an item within a layer shows it in context.

---

#### `three-horizons`
| Property | Value |
|---|---|
| **Purpose** | Three S-curves showing transition from current system through intermediate phase to future system |
| **Content** | None — data via props |
| **HTML** | `<svg>` with custom curve rendering + DOM overlays |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `horizon1` | `{ label: string, items: string[], color?: string }` | Required | Current system (declining curve) |
| `horizon2` | `{ label: string, items: string[], color?: string }` | Required | Intermediate innovations |
| `horizon3` | `{ label: string, items: string[], color?: string }` | Required | Future system (rising curve) |
| `timeLabels` | `{ start: string, mid?: string, end: string }` | `{ start: 'Now', end: 'Future' }` | X-axis labels |
| `style.curve1Color` | `string` | `'var(--color-error)'` | H1 curve color |
| `style.curve2Color` | `string` | `'var(--color-warning)'` | H2 curve color |
| `style.curve3Color` | `string` | `'var(--color-success)'` | H3 curve color |

**Build Behavior:**
- `sequential` — H1 curve appears, then H2, then H3 with their labels
- `all-at-once` — Everything appears together

---

#### `quadrant-chart`
| Property | Value |
|---|---|
| **Purpose** | 2×2 matrix with labeled axes and positioned items |
| **Content** | None — data via props |
| **HTML** | `<svg>` + DOM overlays for labels |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `xAxis` | `{ label: string, low: string, high: string }` | Required | Horizontal axis definition |
| `yAxis` | `{ label: string, low: string, high: string }` | Required | Vertical axis definition |
| `quadrantLabels` | `{ topLeft: string, topRight: string, bottomLeft: string, bottomRight: string }` | `undefined` | Optional labels for each quadrant |
| `items` | `array<{ label: string, x: number, y: number, size?: number, detail?: string }>` | Required | Items positioned by x,y coordinates (0-1 range) |
| `style.quadrantColors` | `string[]` | Theme-derived with varying opacity | Background color per quadrant |
| `style.itemColor` | `string` | `'var(--color-primary)'` | Item dot color |

**Build Behavior:** Supports `sequential` — axes appear first, then items one by one.

**Hover Behavior:** Hovering an item shows its `detail` text and highlights its position.

---

#### `spectrum-bar`
| Property | Value |
|---|---|
| **Purpose** | Linear spectrum with positioned markers and labels |
| **Content** | None — data via props |
| **HTML** | `<svg>` or styled DOM |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `leftLabel` | `string` | Required | Left end label |
| `rightLabel` | `string` | Required | Right end label |
| `markers` | `array<{ label: string, position: number, detail?: string }>` | Required | Markers positioned along spectrum (0-1) |
| `gradient` | `[string, string]` | `['var(--color-primary)', 'var(--color-accent)']` | Gradient from left to right |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Spectrum direction |

---

#### `funnel-diagram`
| Property | Value |
|---|---|
| **Purpose** | Narrowing stages showing filtering or conversion process |
| **Content** | None — data via props |
| **HTML** | `<svg>` with trapezoid sections |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `stages` | `array<{ label: string, value?: string \| number, detail?: string }>` | Required | Stages from widest (top) to narrowest (bottom) |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Funnel direction |
| `style.colors` | `string[]` | Theme-derived gradient | Color per stage |
| `showValues` | `boolean` | `true` | Display value labels |

**Build Behavior:** Supports `sequential` — stages appear one by one from top to bottom.

---

#### `venn-diagram`
| Property | Value |
|---|---|
| **Purpose** | 2-3 overlapping circles showing set relationships |
| **Content** | None — data via props |
| **HTML** | `<svg>` with circles and text overlays |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `sets` | `array<{ label: string, items?: string[], color?: string }>` | Required (2-3 sets) | The individual sets |
| `intersections` | `array<{ sets: string[], label: string, items?: string[] }>` | `[]` | Labeled intersections |
| `style.opacity` | `number` | `0.3` | Circle fill opacity |

**Build Behavior:** Supports `sequential` — circles appear one by one, then intersections highlight.

---

#### `flowchart`
| Property | Value |
|---|---|
| **Purpose** | Process flow with action and decision nodes |
| **Content** | None — data via props |
| **HTML** | `<svg>` with `role="img"` |
| **Layout Engine** | ELK.js (layered layout) |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodes` | `array<{ id: string, label: string, type: 'action' \| 'decision' \| 'start' \| 'end', detail?: string }>` | Required | Flow nodes |
| `edges` | `array<{ from: string, to: string, label?: string }>` | Required | Connections between nodes |
| `direction` | `'top-bottom' \| 'left-right'` | `'top-bottom'` | Flow direction |
| `style.actionColor` | `string` | `'var(--color-primary)'` | Action node color |
| `style.decisionColor` | `string` | `'var(--color-warning)'` | Decision node color (diamond shape) |

**Build Behavior:** Supports `sequential` — nodes and edges appear following the flow direction.

---

#### `stakeholder-map`
| Property | Value |
|---|---|
| **Purpose** | Concentric circles with positioned stakeholders showing proximity/influence |
| **Content** | None — data via props |
| **HTML** | `<svg>` with concentric circles and positioned labels |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `center` | `string` | Required | Central entity label |
| `rings` | `array<{ label: string, stakeholders: array<{ label: string, angle?: number, detail?: string }> }>` | Required | Concentric rings from inside out |
| `style.ringColors` | `string[]` | Theme-derived with decreasing opacity | Color per ring |

**Build Behavior:** Supports `sequential` — center appears, then rings from inside out.

---

#### `radar-chart`
| Property | Value |
|---|---|
| **Purpose** | Multi-axis spider/radar chart for comparing dimensions |
| **Content** | None — data via props |
| **HTML** | `<svg>` |
| **Rendering** | D3.js → SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `axes` | `array<{ label: string, max?: number }>` | Required | Axis definitions (3-8 recommended) |
| `datasets` | `array<{ label: string, values: number[], color?: string }>` | Required | Data series to plot |
| `showGrid` | `boolean` | `true` | Show radar grid lines |
| `showValues` | `boolean` | `false` | Show numeric values at points |
| `fillOpacity` | `number` | `0.2` | Area fill opacity |

**Build Behavior:** Supports `sequential` — datasets appear one by one with draw animation.

---

#### `timeline`
| Property | Value |
|---|---|
| **Purpose** | Connected sequence of events with dates and descriptions |
| **Content** | None — data via props |
| **HTML** | DOM-based with CSS layout (not SVG) for rich text support |
| **Rendering** | Styled DOM |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `events` | `array<{ date: string, title: string, description?: string, marker?: string }>` | Required | Timeline events in order |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Timeline direction |
| `alternating` | `boolean` | `true` | Alternate events above/below (horizontal) or left/right (vertical) |
| `style.lineColor` | `string` | `'var(--color-border)'` | Timeline line color |
| `style.markerColor` | `string` | `'var(--color-primary)'` | Event marker color |

**Build Behavior:** Supports `sequential` — events appear one by one along the timeline.

**Density:** Maximum 8 events in horizontal mode, 10 in vertical mode.

---

#### `org-chart`
| Property | Value |
|---|---|
| **Purpose** | Hierarchical tree of roles, entities, or concepts |
| **Content** | None — data via props |
| **HTML** | `<svg>` with `role="img"` |
| **Layout Engine** | ELK.js (tree layout) |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `root` | `OrgNode` | Required | Root node of the hierarchy |
| `direction` | `'top-bottom' \| 'left-right'` | `'top-bottom'` | Tree direction |
| `style.nodeColor` | `string` | `'var(--color-surface)'` | Node background color |
| `style.borderColor` | `string` | `'var(--color-border)'` | Node border color |
| `style.connectionStyle` | `'straight' \| 'curved' \| 'step'` | `'step'` | Edge style |

**OrgNode type:**
yaml
root:
  label: "CEO"
  detail: "Chief Executive Officer"
  children:
    - label: "CTO"
      children:
        - label: "Engineering"
        - label: "Research"
    - label: "CFO"
      children:
        - label: "Finance"
        - label: "Legal"


**Build Behavior:** Supports `sequential` — levels appear top-down, one tier at a time.

---

#### `cycle-diagram`
| Property | Value |
|---|---|
| **Purpose** | Circular process diagram with connected stages |
| **Content** | None — data via props |
| **HTML** | `<svg>` |
| **Rendering** | Custom SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `stages` | `array<{ label: string, detail?: string, icon?: string }>` | Required | Stages arranged in a circle. When provided, `icon` should be a Lucide icon name. |
| `direction` | `'clockwise' \| 'counterclockwise'` | `'clockwise'` | Flow direction |
| `style.stageColors` | `string[]` | Theme-derived | Color per stage |
| `style.arrowColor` | `string` | `'var(--color-text-secondary)'` | Arrow/connector color |

**Build Behavior:** Supports `sequential` — stages appear one by one around the cycle.

---

#### `sankey-diagram`
| Property | Value |
|---|---|
| **Purpose** | Flow diagram showing quantity distribution between nodes across stages |
| **Content** | None — data via props |
| **HTML** | `<svg>` |
| **Rendering** | D3.js (d3-sankey plugin) → SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodes` | `array<{ id: string, label: string }>` | Required | All nodes |
| `links` | `array<{ source: string, target: string, value: number }>` | Required | Flows between nodes with magnitude |
| `alignment` | `'left' \| 'right' \| 'center' \| 'justify'` | `'justify'` | Node alignment strategy |
| `style.colorScheme` | `string` | `'categorical'` | Color scheme for flows |
| `style.opacity` | `number` | `0.5` | Flow band opacity |

**Build Behavior:** Supports `nodes-first` — nodes appear, then flow bands animate in.

**Density:** Maximum 15 nodes and 25 links before the diagram becomes unreadable.

---

#### `coordinate-plot`
| Property | Value |
|---|---|
| **Purpose** | X-Y scatter plot with variable-radius circles and labels — a versatile context mapping tool |
| **Content** | None — data via props |
| **HTML** | `<svg>` |
| **Rendering** | D3.js → SVG |

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `xAxis` | `{ label: string, min?: number, max?: number }` | Required | X-axis definition |
| `yAxis` | `{ label: string, min?: number, max?: number }` | Required | Y-axis definition |
| `points` | `array<{ label: string, x: number, y: number, radius?: number, color?: string, detail?: string }>` | Required | Data points |
| `showGrid` | `boolean` | `true` | Show background grid |
| `showLabels` | `boolean` | `true` | Show point labels |
| `style.defaultRadius` | `number` | `20` | Default circle radius |
| `style.defaultColor` | `string` | `'var(--color-primary)'` | Default point color |

**Build Behavior:** Supports `sequential` — points appear one by one.

**Hover Behavior:** Hovering a point shows its `detail` text, highlights it, and shows its exact coordinates.

---

### 20.6 Interactive / Advanced Components (Future — Schema-Ready)

These components are defined in the manifest system but are not part of the MVP implementation. They are documented here so the schema accommodates them, and agents can be aware they are planned.

#### `toggle-reveal`
| Purpose | Click/tap to reveal hidden content |
| Props | `label: string`, `revealContent: string` (Markdown) |
| Interaction | Click toggles visibility of the reveal content |

#### `tab-group`
| Purpose | Tabbed content panels |
| Props | `tabs: array<{ label: string, content: string }>` |
| Interaction | Click tab to switch visible panel |

#### `accordion`
| Purpose | Expandable/collapsible sections |
| Props | `sections: array<{ title: string, content: string }>`, `allowMultiple: boolean` |
| Interaction | Click section header to expand/collapse |

#### `hover-annotation`
| Purpose | Hotspot that shows tooltip/popover on hover |
| Props | `target: string` (text to annotate), `annotation: string` (tooltip content) |
| Interaction | Hover/focus shows annotation popover |

#### `live-counter`
| Purpose | Animated number counting up to a target value |
| Props | `from: number`, `to: number`, `duration: number`, `prefix: string`, `suffix: string` |
| Interaction | Counts on enter animation |

#### `progress-bar`
| Purpose | Visual progress/completion indicator |
| Props | `value: number`, `max: number`, `label: string`, `showPercentage: boolean` |

#### `code-runner`
| Purpose | Executable code block with output panel |
| Props | `language: string`, `code: string`, `editable: boolean` |
| Interaction | Run button executes code and displays output |

---

### 20.7 Layout Registry Detail

Detailed specifications for all built-in layouts. Each layout describes its slot structure, responsive behavior, and density limits.

#### `title-center`
| Slots | 1-3 (heading, subtitle, label) |
| Arrangement | All content centered horizontally and vertically |
| Responsive | Scales down font sizes at smaller viewports |
| Density | 1 headline + 1 subtitle + 1 optional label |

#### `title-left`
| Slots | 1-3 (heading, subtitle, decorative element) |
| Arrangement | Left-aligned with generous padding. Optional decorative element right-aligned. |
| Responsive | Decorative element hides below 600px width |
| Density | 1 headline + 1 subtitle + 1 optional element |

#### `section-header`
| Slots | 1-2 (section number/label, section title) |
| Arrangement | Large section number top-left, title centered or bottom-left |
| Responsive | Number scales down at smaller viewports |
| Density | 1 section identifier + 1 title |

#### `single-content`
| Slots | 1 |
| Arrangement | Centered with max-width constraint and comfortable padding |
| Responsive | Max-width reduces at smaller viewports |
| Density | 1 heading + 1 component |

#### `two-column`
| Slots | 2 |
| Arrangement | Side-by-side columns with configurable ratio |
| Props | `ratio: '50-50' \| '60-40' \| '40-60' \| '70-30' \| '30-70'`, `gap`, `verticalAlign` |
| Responsive | Stacks to single column below 768px |
| Density | 1 component per column (each: 4-6 bullets OR 1 diagram OR 1 image + caption) |

#### `three-column`
| Slots | 3 |
| Arrangement | Three equal-width columns |
| Responsive | 3 → 2 → 1 columns at breakpoints 900px and 600px |
| Density | 1 compact component per column (3-4 bullets OR 1 stat-card) |

#### `content-left-media-right`
| Slots | 2 |
| Arrangement | 60% text left, 40% media right |
| Responsive | Stacks with media below text at 768px |
| Density | Left: 1 heading + 4-6 bullets. Right: 1 image/diagram |

#### `media-left-content-right`
| Slots | 2 |
| Arrangement | 40% media left, 60% text right |
| Responsive | Stacks with media above text at 768px |
| Density | Left: 1 image/diagram. Right: 1 heading + 4-6 bullets |

#### `top-bottom`
| Slots | 2 |
| Arrangement | Vertically stacked, configurable ratio |
| Props | `ratio: '50-50' \| '60-40' \| '40-60' \| '70-30' \| '30-70'` |
| Responsive | Both regions shrink proportionally |
| Density | 1 component per region |

#### `grid-2x2`
| Slots | 4 |
| Arrangement | 2×2 grid with equal cells |
| Responsive | 2×2 → 2×1 stack → 1×4 stack at breakpoints |
| Density | 1 card per cell (title + 2-3 lines) |

#### `grid-3x2`
| Slots | 6 |
| Arrangement | 3 columns × 2 rows |
| Responsive | 3×2 → 2×3 → 1×6 at breakpoints |
| Density | 1 compact card per cell |

#### `sidebar-main`
| Slots | 2 |
| Arrangement | Narrow sidebar (25-30%) + wide main area (70-75%) |
| Responsive | Sidebar collapses above main content below 768px |
| Density | Sidebar: navigation/labels/small components. Main: primary content component |

#### `full-bleed`
| Slots | 1 |
| Arrangement | Component fills entire viewport edge-to-edge, no padding |
| Responsive | Component handles its own responsive behavior |
| Density | 1 image, video, or large diagram |

#### `gallery`
| Slots | N (variable) |
| Arrangement | Responsive CSS grid with auto-fit columns (min 250px) |
| Responsive | Column count reduces automatically |
| Density | Up to 9 items (3×3) |

#### `stack`
| Slots | N (variable) |
| Arrangement | Vertically stacked with consistent spacing |
| Responsive | Spacing reduces at smaller viewports |
| Density | Up to 5 stacked components |

#### `scattered`
| Slots | N (variable, with position data) |
| Arrangement | Components placed at specified relative positions within the slot area. Intended for organic Map mode clusters. |
| Props | Each component can have `position: { x: number, y: number }` (0-1 normalized coordinates) |
| Responsive | Positions scale proportionally |
| Density | Context-dependent; avoid overlap |

#### `timeline-layout`
| Slots | N (variable) |
| Arrangement | Horizontal or vertical timeline with connected events |
| Props | `orientation: 'horizontal' \| 'vertical'`, `alternating: boolean` |
| Responsive | Horizontal → vertical below 768px |
| Density | Maximum 8 events (horizontal) or 10 (vertical) |

#### `comparison-layout`
| Slots | 2 |
| Arrangement | Side-by-side with visual divider (vertical line or "vs" badge) |
| Props | `divider: 'line' \| 'vs' \| 'arrow'` |
| Responsive | Stacks vertically with horizontal divider below 768px |
| Density | 1 panel per side (title + 3-4 points each) |

#### `pyramid-layout`
| Slots | 3-5 |
| Arrangement | Triangular arrangement — first slot narrow at top, widening rows below |
| Responsive | Collapses to vertical stack below 600px |
| Density | 1 component per row, compact (label + short text) |

---

## 21. Project Directory Structure

### 21.1 Complete Directory Tree


xtoryteller/
│
├── app/                                    # Next.js App Router
│   ├── layout.tsx                         # Root layout (fonts, global providers)
│   ├── page.tsx                           # Dashboard / gallery view
│   ├── [slug]/
│   │   └── page.tsx                       # Presentation viewer
│   ├── preview/
│   │   └── [tempId]/
│   │       └── page.tsx                   # Temporary preview for style discovery
│   └── globals.css                        # Global base styles
│
├── components/                            # Global component library (built-in presets)
│   ├── headline/
│   │   ├── index.tsx                      # React component
│   │   ├── manifest.yaml                  # Agent-readable API doc
│   │   └── styles.module.css              # Scoped styles
│   ├── subtitle/
│   │   ├── index.tsx
│   │   ├── manifest.yaml
│   │   └── styles.module.css
│   ├── body-text/
│   │   └── ...
│   ├── bullet-list/
│   │   └── ...
│   ├── numbered-list/
│   │   └── ...
│   ├── blockquote/
│   │   └── ...
│   ├── callout/
│   │   └── ...
│   ├── footnote/
│   │   └── ...
│   ├── label/
│   │   └── ...
│   ├── divider/
│   │   └── ...
│   ├── image/
│   │   └── ...
│   ├── video/
│   │   └── ...
│   ├── svg-graphic/
│   │   └── ...
│   ├── iframe-embed/
│   │   └── ...
│   ├── code-block/
│   │   └── ...
│   ├── icon/
│   │   └── ...
│   ├── card/
│   │   └── ...
│   ├── stat-card/
│   │   └── ...
│   ├── profile-card/
│   │   └── ...
│   ├── feature-card/
│   │   └── ...
│   ├── comparison-card/
│   │   └── ...
│   ├── timeline-item/
│   │   └── ...
│   ├── causal-diagram/
│   │   └── ...
│   ├── mind-map/
│   │   └── ...
│   ├── iceberg-diagram/
│   │   └── ...
│   ├── three-horizons/
│   │   └── ...
│   ├── quadrant-chart/
│   │   └── ...
│   ├── spectrum-bar/
│   │   └── ...
│   ├── funnel-diagram/
│   │   └── ...
│   ├── venn-diagram/
│   │   └── ...
│   ├── flowchart/
│   │   └── ...
│   ├── stakeholder-map/
│   │   └── ...
│   ├── radar-chart/
│   │   └── ...
│   ├── timeline/
│   │   └── ...
│   ├── org-chart/
│   │   └── ...
│   ├── cycle-diagram/
│   │   └── ...
│   ├── sankey-diagram/
│   │   └── ...
│   └── coordinate-plot/
│       └── ...
│
├── layouts/                               # Layout definitions
│   ├── title-center/
│   │   ├── index.tsx
│   │   ├── manifest.yaml
│   │   └── styles.module.css
│   ├── title-left/
│   │   └── ...
│   ├── section-header/
│   │   └── ...
│   ├── single-content/
│   │   └── ...
│   ├── two-column/
│   │   └── ...
│   ├── three-column/
│   │   └── ...
│   ├── content-left-media-right/
│   │   └── ...
│   ├── media-left-content-right/
│   │   └── ...
│   ├── top-bottom/
│   │   └── ...
│   ├── grid-2x2/
│   │   └── ...
│   ├── grid-3x2/
│   │   └── ...
│   ├── sidebar-main/
│   │   └── ...
│   ├── full-bleed/
│   │   └── ...
│   ├── gallery/
│   │   └── ...
│   ├── stack/
│   │   └── ...
│   ├── scattered/
│   │   └── ...
│   ├── timeline-layout/
│   │   └── ...
│   ├── comparison-layout/
│   │   └── ...
│   └── pyramid-layout/
│       └── ...
│
├── transitions/                           # Transition & animation presets
│   ├── fade/
│   │   ├── index.ts
│   │   └── manifest.yaml
│   ├── slide-left/
│   │   └── ...
│   ├── slide-right/
│   │   └── ...
│   ├── slide-up/
│   │   └── ...
│   ├── slide-down/
│   │   └── ...
│   ├── scale/
│   │   └── ...
│   ├── scale-out/
│   │   └── ...
│   ├── blur/
│   │   └── ...
│   ├── wipe-left/
│   │   └── ...
│   ├── wipe-up/
│   │   └── ...
│   └── none/
│       └── ...
│
├── themes/                                # Theme definitions
│   └── default.yaml                       # Default theme (ships with project)
│
├── presentations/                         # User's presentations
│   ├── example-stage/                    # Example Stage mode presentation
│   │   ├── presentation.yaml
│   │   └── assets/
│   │       └── thumbnail.png
│   ├── example-map/                      # Example Map mode presentation
│   │   ├── presentation.yaml
│   │   └── assets/
│   │       └── thumbnail.png
│   └── .gitkeep
│
├── lib/                                   # Core runtime library
│   ├── engine/
│   │   ├── presentation-loader.ts        # YAML parsing, validation, resolution
│   │   ├── component-registry.ts         # Component discovery and resolution
│   │   ├── layout-registry.ts            # Layout discovery and resolution
│   │   ├── transition-registry.ts        # Transition discovery and resolution
│   │   ├── theme-resolver.ts             # Theme loading, merging, CSS variable generation
│   │   ├── template-engine.ts            # Template expression evaluation
│   │   ├── asset-resolver.ts             # Asset path resolution
│   │   └── cluster-position-resolver.ts  # Map mode position computation
│   │
│   ├── machines/                         # XState state machines
│   │   ├── presentation.ts              # Top-level parallel machine
│   │   ├── stage.ts                     # Stage mode navigation
│   │   ├── map.ts                       # Map mode navigation
│   │   └── background.ts               # Background shader state
│   │
│   ├── renderers/                        # Rendering components
│   │   ├── PresentationProvider.tsx      # Top-level context provider
│   │   ├── ThemeProvider.tsx             # CSS custom property injection
│   │   ├── BackgroundLayer.tsx           # WebGL shader canvas
│   │   ├── ContentLayer.tsx             # DOM content container
│   │   ├── UILayer.tsx                  # Overlay controls
│   │   ├── StageRenderer.tsx            # Stage mode renderer
│   │   ├── MapRenderer.tsx              # Map mode renderer
│   │   ├── BuildStepWrapper.tsx         # Component visibility & animation
│   │   ├── NavigationControls.tsx       # Progress bar, nav dots, back button
│   │   ├── ScreenReaderAnnouncer.tsx    # Accessibility announcements
│   │   └── ErrorBoundary.tsx            # Graceful error display
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── usePresentationMachine.ts    # XState machine consumer
│   │   ├── useKeyboardNavigation.ts     # Keyboard event handlers
│   │   ├── useGestureNavigation.ts      # Touch/mouse gesture handlers
│   │   ├── useReducedMotion.ts          # prefers-reduced-motion detection
│   │   ├── useHotReload.ts             # WebSocket file change listener
│   │   └── useViewportSize.ts          # Responsive viewport tracking
│   │
│   ├── utils/                           # Shared utilities
│   │   ├── markdown-renderer.ts         # Markdown → React component conversion
│   │   ├── color-utils.ts              # Color interpolation, contrast checking
│   │   ├── yaml-parser.ts              # YAML parsing wrapper
│   │   ├── schema-validator.ts         # JSON Schema validation
│   │   └── font-resolver.ts            # Font loading and resolution
│   │
│   └── types/                           # TypeScript type definitions
│       ├── presentation.ts              # Presentation data types
│       ├── components.ts                # Component prop types
│       ├── layouts.ts                   # Layout types
│       ├── transitions.ts              # Transition types
│       ├── themes.ts                   # Theme types
│       └── machines.ts                 # State machine context/event types
│
├── server/                               # Development server extensions
│   └── watcher.ts                       # File system watcher + WebSocket
│
├── scripts/                              # CLI utility scripts
│   ├── validate.js                      # Validate single presentation YAML
│   ├── validate-all.js                  # Validate all presentations
│   ├── validate-theme.js               # Validate theme contrast & fonts
│   ├── generate-registries.js          # Generate agent-readable registry JSON
│   ├── generate-thumbnails.js          # Auto-generate presentation thumbnails
│   ├── import.js                       # Import presentation package
│   ├── export.js                       # Export presentation as zip
│   └── download-font.js               # Download CDN font to local
│
├── skills/                               # Agent skill definitions
│   ├── xtoryteller-skill.yaml          # Master skill definition
│   ├── phases/
│   │   ├── 00-detect-intent.yaml
│   │   ├── 01-context-gathering.yaml
│   │   ├── 02-content-style.yaml
│   │   ├── 03-orchestration.yaml
│   │   ├── 04-validation.yaml
│   │   └── 05-iteration.yaml
│   ├── sub-pipelines/
│   │   ├── style-discovery.yaml
│   │   ├── component-creation.yaml
│   │   ├── layout-creation.yaml
│   │   └── theme-creation.yaml
│   ├── references/
│   │   ├── schema.yaml                 # Presentation YAML schema (human-readable)
│   │   ├── schema.json                 # JSON Schema (machine-validatable)
│   │   ├── component-registry.json     # Auto-generated
│   │   ├── layout-registry.json        # Auto-generated
│   │   ├── transition-registry.json    # Auto-generated
│   │   ├── theme-registry.json         # Auto-generated
│   │   ├── anti-patterns.yaml          # What NOT to do
│   │   └── examples/
│   │       ├── simple-stage.yaml
│   │       ├── complex-stage.yaml
│   │       ├── simple-map.yaml
│   │       └── complex-map.yaml
│   └── docs/
│       ├── architecture-overview.md
│       ├── component-authoring.md
│       ├── yaml-conventions.md
│       └── troubleshooting.md
│
├── public/                               # Static assets
│   └── fonts/                           # Self-hosted fonts
│       ├── playfair-display/
│       │   ├── PlayfairDisplay-Regular.woff2
│       │   ├── PlayfairDisplay-Bold.woff2
│       │   └── PlayfairDisplay-Black.woff2
│       ├── inter/
│       │   ├── Inter-Light.woff2
│       │   ├── Inter-Regular.woff2
│       │   ├── Inter-Medium.woff2
│       │   └── Inter-SemiBold.woff2
│       └── jetbrains-mono/
│           ├── JetBrainsMono-Regular.woff2
│           └── JetBrainsMono-Medium.woff2
│
├── docs/                                 # Project documentation (for humans)
│   ├── README.md                        # Project overview
│   ├── GETTING_STARTED.md              # Setup guide
│   ├── CREATING_PRESENTATIONS.md       # How to create presentations
│   ├── CREATING_COMPONENTS.md          # How to create custom components
│   ├── CREATING_THEMES.md             # How to create themes
│   └── ARCHITECTURE.md                # Technical architecture overview
│
├── next.config.js                        # Next.js configuration
├── tsconfig.json                         # TypeScript configuration
├── package.json                          # Dependencies and scripts
├── .eslintrc.js                          # ESLint configuration
├── .prettierrc                           # Prettier configuration
├── .gitignore
└── README.md                            # Repository README


### 21.2 Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Component directory | `kebab-case` | `causal-diagram/` |
| Component TSX file | `index.tsx` | `components/causal-diagram/index.tsx` |
| Component manifest | `manifest.yaml` | `components/causal-diagram/manifest.yaml` |
| Component CSS module | `styles.module.css` | `components/causal-diagram/styles.module.css` |
| Layout directory | `kebab-case` | `two-column/` |
| Transition directory | `kebab-case` | `slide-up/` |
| Theme file | `kebab-case.yaml` | `themes/dark-botanical.yaml` |
| Presentation directory | `kebab-case` (matches slug) | `presentations/causal-systems/` |
| Presentation file | `presentation.yaml` | Always this name within its directory |
| Type references in YAML | `kebab-case` | `type: causal-diagram` |
| TypeScript type names | `PascalCase` | `PresentationConfig`, `StepDefinition` |
| React component exports | `PascalCase` | `export const CausalDiagram` |
| CSS custom properties | `--kebab-case` | `--color-primary`, `--text-h1` |
| Registry JSON files | `kebab-case.json` | `component-registry.json` |
| Skill YAML files | `kebab-case.yaml` | `style-discovery.yaml` |

### 21.3 File Ownership

| Directory | Managed By | Modified By |
|---|---|---|
| `app/` | Core project | Developers only (not agents) |
| `components/` (built-in) | Core project + user extensions | Developers, agents (component creation sub-pipeline) |
| `layouts/` | Core project + user extensions | Developers, agents (layout creation sub-pipeline) |
| `transitions/` | Core project + user extensions | Developers, agents |
| `themes/` | Core project + user extensions | Agents (style discovery), developers |
| `presentations/` | Users | Agents (primary), manual editing (secondary) |
| `lib/` | Core project | Developers only |
| `scripts/` | Core project | Developers only |
| `skills/` | Core project | Developers (skill definition), auto-generated (registries) |
| `public/fonts/` | Core project + user | Developers, font download script |
| `docs/` | Core project | Developers |

---

## 22. MVP Scope & Phasing

### 22.1 MVP Definition

The MVP delivers a functional, end-to-end system where a user can clone the project, invoke an agent, and produce a working presentation. The MVP prioritizes breadth of the architecture over depth of any single feature — establishing all the key patterns and interfaces so that incremental improvement is straightforward.

### 22.2 Phase 1: Foundation (MVP Core)

**Goal:** A working system where an agent can generate a Stage-mode presentation from YAML and the user can view it in the browser.

**Infrastructure:**
- [ ] Next.js project setup with App Router, TypeScript, ESLint, Prettier
- [ ] YAML parsing and presentation loader (`lib/engine/presentation-loader.ts`)
- [ ] JSON Schema for `presentation.yaml` and validation script (`scripts/validate.js`)
- [ ] Component registry with manifest scanning (`lib/engine/component-registry.ts`)
- [ ] Layout registry with manifest scanning (`lib/engine/layout-registry.ts`)
- [ ] Transition registry with manifest scanning (`lib/engine/transition-registry.ts`)
- [ ] Theme resolver — YAML to CSS custom properties (`lib/engine/theme-resolver.ts`)
- [ ] Template expression engine for basic data references (`lib/engine/template-engine.ts`)
- [ ] Asset path resolution (`lib/engine/asset-resolver.ts`)
- [ ] TypeScript type definitions for all data structures (`lib/types/`)

**State Machine:**
- [ ] XState v5 Stage mode machine (step navigation, build steps, transition states)
- [ ] XState v5 Background state machine (stable/interpolating)
- [ ] Top-level parallel presentation machine
- [ ] React integration via `@xstate/react`

**Rendering:**
- [ ] `PresentationProvider` context with machine
- [ ] `ThemeProvider` with CSS custom property injection
- [ ] `StageRenderer` with step transitions and build step sequencing
- [ ] `BuildStepWrapper` with enter/exit animations
- [ ] `ContentLayer` and `UILayer` separation
- [ ] Keyboard navigation (arrow keys, space, escape)
- [ ] Progress indicator (step counter or progress bar)
- [ ] Screen reader announcements
- [ ] `prefers-reduced-motion` support

**Components (Minimum Viable Set — 10):**
- [ ] `headline`
- [ ] `subtitle`
- [ ] `body-text`
- [ ] `bullet-list`
- [ ] `blockquote`
- [ ] `callout`
- [ ] `image`
- [ ] `code-block`
- [ ] `card`
- [ ] `divider`

Each with: TSX implementation, manifest.yaml, styles.module.css, semantic HTML, theme variable references, responsive sizing.

**Layouts (Minimum Viable Set — 6):**
- [ ] `title-center`
- [ ] `single-content`
- [ ] `two-column`
- [ ] `content-left-media-right`
- [ ] `full-bleed`
- [ ] `stack`

Each with: TSX implementation, manifest.yaml, slot definitions, responsive behavior, density guidelines.

**Transitions (Minimum Viable Set — 5):**
- [ ] `fade`
- [ ] `slide-left`
- [ ] `slide-up`
- [ ] `scale`
- [ ] `none`

Each with: TypeScript implementation, manifest.yaml, enter/exit functions, configurable parameters.

**Theme:**
- [ ] Default theme YAML with full color, font, typography, spacing, border, shadow, animation definitions
- [ ] Default fonts shipped locally (Playfair Display, Inter, JetBrains Mono)
- [ ] Theme override support in presentation YAML
- [ ] Component inline style overrides

**Background:**
- [ ] Paper-shader integration with single-shader-per-presentation support
- [ ] Background rendered on WebGL canvas behind content
- [ ] Fallback to CSS background on devices without WebGL

**Dashboard:**
- [ ] Gallery view at `/` showing all presentations
- [ ] Presentation metadata display (title, description, tags, mode, step count)
- [ ] Click to enter presentation at `/[slug]`
- [ ] Back button from presentation to dashboard
- [ ] Auto-generated thumbnail (or placeholder)

**Developer Experience:**
- [ ] `npm run dev` with hot reload
- [ ] File watcher + WebSocket for YAML changes → browser update
- [ ] Error overlay for invalid YAML or missing components
- [ ] `npm run validate` for CLI validation
- [ ] `npm run registries` for registry generation

**Agent Skill (MVP):**
- [ ] Master skill YAML (`xtoryteller-skill.yaml`)
- [ ] Phase 0-5 YAML definitions
- [ ] Schema reference file for agents
- [ ] 2 example presentations (simple and complex Stage mode)
- [ ] Component, layout, transition, and theme registry JSON files (auto-generated)
- [ ] Architecture overview doc for agent context
- [ ] Anti-patterns reference

**Deliverable:** A user can clone the repo, run `npm install && npm run dev`, invoke an agent (Claude Code, Codex, etc.) with the skill, discuss a presentation, and the agent generates a working `presentation.yaml` that renders in the browser with transitions, build steps, and a styled theme.

### 22.3 Phase 2: Map Mode & Diagrams

**Goal:** Add the Map navigation mode and the first wave of diagram components — the key differentiators.

**Map Mode:**
- [ ] XState Map mode machine (free roam, guided, flying states)
- [ ] `MapRenderer` with DOM + CSS transforms
- [ ] Gesture handling via `@use-gesture/react` (drag/pan, pinch/wheel zoom)
- [ ] Camera flight animations via Framer Motion
- [ ] Cluster position resolver (manual-relative + `flow` algorithm)
- [ ] Guided sequence navigation
- [ ] Free roam ↔ guided mode toggle
- [ ] Cluster click-to-navigate
- [ ] Viewport framing logic (center + zoom to fit cluster)

**Automatic Arrangement Algorithms:**
- [ ] `flow` (left-to-right, wrapping)
- [ ] `radial` (circular around center)
- [ ] `grid` (regular grid)

**Diagram Components (First Wave — 5):**
- [ ] `causal-diagram` (ELK.js layout, polarity labels, loop detection)
- [ ] `mind-map` (ELK.js tree/radial layout, expandable branches)
- [ ] `iceberg-diagram` (custom SVG, layered depth metaphor)
- [ ] `flowchart` (ELK.js layered layout, decision nodes)
- [ ] `quadrant-chart` (custom SVG, 2×2 with positioned items)

**Additional Layouts:**
- [ ] `three-column`
- [ ] `grid-2x2`
- [ ] `media-left-content-right`
- [ ] `sidebar-main`
- [ ] `gallery`
- [ ] `scattered` (for Map mode clusters)

**Additional Transitions:**
- [ ] `slide-right`
- [ ] `slide-down`
- [ ] `scale-out`
- [ ] `blur`
- [ ] `wipe-left`

**Background Enhancement:**
- [ ] Per-section shader configuration (different params per step range or cluster group)
- [ ] Smooth parameter interpolation between sections
- [ ] Cross-fade between different shader algorithms

**Agent Skill Updates:**
- [ ] Map mode examples (simple and complex)
- [ ] Diagram component documentation in registry
- [ ] Updated skill phases for Map mode orchestration

### 22.4 Phase 3: Full Component Suite & Portability

**Goal:** Complete the component and layout libraries. Implement portability (import/export/sharing).

**Remaining Diagram Components:**
- [ ] `three-horizons`
- [ ] `spectrum-bar`
- [ ] `funnel-diagram`
- [ ] `venn-diagram`
- [ ] `stakeholder-map`
- [ ] `radar-chart` (D3)
- [ ] `timeline`
- [ ] `org-chart`
- [ ] `cycle-diagram`
- [ ] `sankey-diagram` (D3)
- [ ] `coordinate-plot` (D3)

**Remaining Content Components:**
- [ ] `numbered-list`
- [ ] `footnote`
- [ ] `label`
- [ ] `icon`
- [ ] `video`
- [ ] `svg-graphic`
- [ ] `iframe-embed`
- [ ] `stat-card`
- [ ] `profile-card`
- [ ] `feature-card`
- [ ] `comparison-card`
- [ ] `timeline-item`

**Remaining Layouts:**
- [ ] `title-left`
- [ ] `section-header`
- [ ] `top-bottom`
- [ ] `grid-3x2`
- [ ] `timeline-layout`
- [ ] `comparison-layout`
- [ ] `pyramid-layout`

**Remaining Arrangement Algorithms:**
- [ ] `tree` (hierarchical)

**Portability:**
- [ ] Export script (`scripts/export.js`) — zip presentation with dependencies
- [ ] Import script (`scripts/import.js`) — validate and unpack presentation
- [ ] Import validation (component resolution, theme availability, slug conflicts)
- [ ] Component promotion workflow (presentation-scoped → global)

**Agent Sub-Pipelines:**
- [ ] Style discovery sub-pipeline (generate 3 theme variants, preview, pick)
- [ ] Component creation sub-pipeline (guided custom component authoring)
- [ ] Layout creation sub-pipeline
- [ ] Theme creation sub-pipeline

**Dashboard Enhancements:**
- [ ] Tag-based filtering
- [ ] Search by title, description, content
- [ ] Sort by date created, updated, title
- [ ] Grid/list view toggle

**Hover Annotation System:**
- [ ] Global annotation syntax in Markdown (`<annotate>` markers)
- [ ] Tooltip rendering component
- [ ] Keyboard-accessible annotation reveal (focus + Enter)

**Theme Validation:**
- [ ] `scripts/validate-theme.js` — contrast ratio checking
- [ ] Font availability checking
- [ ] Build-time theme validation

### 22.5 Phase 4: Polish & Advanced Features

**Goal:** Refinements, advanced features, and production-readiness.

**Additional Features:**
- [ ] Deep linking into steps (`/slug#step-3`) and clusters (`/slug#cluster-name`)
- [ ] Fullscreen mode (F key)
- [ ] Keyboard shortcuts overlay (? key)
- [ ] Touch/swipe navigation for mobile
- [ ] Iframe embedding detection and UI adjustment
- [ ] Font download script (`scripts/download-font.js`)
- [ ] Auto-thumbnail generation via Playwright
- [ ] `npm run export` static site export mode
- [ ] Production deployment documentation for Vercel

**Component Enhancements:**
- [ ] Hover annotations on all diagram components
- [ ] Build step `sequential` mode for diagram components (nodes-first, etc.)
- [ ] SVG draw animation for diagram edges
- [ ] Animated number counting for stat-card

**Map Mode Enhancements:**
- [ ] Mid-flight zoom-out during camera transitions
- [ ] Minimap overlay showing canvas overview
- [ ] Cluster proximity loading (lazy-mount distant clusters)

**Performance:**
- [ ] Dynamic component imports (code-split per presentation)
- [ ] D3 and ELK.js lazy loading
- [ ] Paper-shader resolution scaling for low-end devices
- [ ] Font preloading
- [ ] Image optimization via Next.js Image component (SSR mode)

---

## 23. Future Roadmap

### 23.1 Near-Term (Post-MVP)

**PPT/PPTX Import**
- Python script to extract content from PowerPoint files (`python-pptx`)
- Agent skill to map extracted content to Xtoryteller components and layouts
- Generate `presentation.yaml` from extracted content
- Preserve slide order, text, images, and speaker notes

**Interactive Components**
- `toggle-reveal` — click to show hidden content
- `tab-group` — tabbed panels
- `accordion` — expandable sections
- `code-runner` — executable code blocks with output display
- `live-counter` — animated counting numbers
- `progress-bar` — visual progress indicators

**Presenter Mode**
- Split view: presenter sees current step + next step + speaker notes
- Timer and clock display
- Private notes field in presentation YAML (not rendered in viewer mode)
- Remote control support (phone as remote via WebSocket)

**Agent Preview Loop**
- Agent can invoke a screenshot tool (via MCP or direct Playwright call) to preview generated presentations
- Agent reviews the screenshot, identifies issues, and self-corrects
- Reduces the human review cycle for iterative refinement
- Implemented in the skill layer, not the infrastructure

### 23.2 Medium-Term

**Branching / Non-Linear Navigation**
- Steps can define conditional branches ("If the audience asks about X, go to step 12")
- Agent can create choose-your-own-adventure style presentations
- Map mode naturally supports non-linear exploration; this adds it to Stage mode
- Navigation UI shows branch points

**Real-Time Data Integration**
- Components can fetch data from APIs at render time
- Live dashboards embedded in presentations
- WebSocket-driven live updating components
- Data sources defined in presentation YAML

**Collaborative Editing**
- Multiple users editing the same presentation YAML simultaneously
- Conflict resolution (CRDT or operational transform on YAML)
- Real-time cursor presence
- Requires server component (not static export compatible)

**Animation Timeline Editor**
- Visual timeline for orchestrating component animations
- Drag-and-drop sequencing of build steps
- Preview animations in real time
- Export timeline back to YAML

**Component Marketplace**
- Public registry of community-contributed components
- npm-like install mechanism: `node scripts/install-component.js @community/gantt-chart`
- Version management for shared components
- Preview gallery of available components

### 23.3 Long-Term

**Cloud-Hosted Version**
- Multi-tenant SaaS deployment
- User accounts with private and public presentations
- Component sandboxing (iframe-based isolation for untrusted components)
- CDN-hosted presentation delivery
- Usage analytics (view count, average view duration, drop-off points)

**Export Formats**
- PDF export (headless browser screenshot per step → combined PDF)
- Video export (recorded step transitions as MP4/WebM)
- Static HTML export (single self-contained HTML file for maximum portability)
- Image export (individual step screenshots as PNG/SVG)

**AI-Enhanced Features**
- Auto-layout suggestions based on content analysis
- Content summarization for speaker notes
- Automatic diagram generation from text descriptions
- Style transfer — apply the aesthetic of one presentation to another
- Accessibility audit — AI reviews the presentation for a11y issues
- Translation — auto-translate presentation content to other languages

**Advanced Rendering**
- 3D components (Three.js integration for spatial data visualization)
- Particle effects and generative art components
- Custom shader components (user-authored GLSL for component backgrounds)
- Lottie animation component
- WebGPU support for next-generation shader performance

**Presentation Analytics**
- Heatmaps showing which steps viewers spend most time on
- Navigation path analysis (for Map mode — which clusters are most visited)
- A/B testing different presentation versions
- Engagement scoring

**Offline / PWA Support**
- Service worker for offline presentation viewing
- Progressive Web App manifest
- Cache presentations locally for offline access
- Sync changes when back online

---

*End of APRD — Xtoryteller v1.0*

*This document represents the complete architectural specification as discussed and agreed upon between the system designer and the project owner. All locked decisions are reflected. The MVP (Phase 1) is the immediate implementation target, with Phases 2-4 and the Future Roadmap providing a clear path for incremental evolution.*