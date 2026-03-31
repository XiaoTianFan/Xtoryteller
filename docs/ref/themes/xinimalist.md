# Design System Documentation - Journal Site

A comprehensive guide to the visual design language, patterns, and principles of this personal journal website.

---

## Table of Contents

1. [Core Design Principles](#core-design-principles)
2. [Typography System](#typography-system)
3. [Color System](#color-system)
4. [Spacing & Layout](#spacing--layout)
5. [Borders & Shadows](#borders--shadows)
6. [Animation System](#animation-system)
7. [Component Patterns](#component-patterns)
8. [Visual Effects](#visual-effects)
9. [Implementation Guidelines](#implementation-guidelines)

---

## Core Design Principles

### Minimalist Aesthetic

- **No rounded corners** on major UI elements (cards, panels, overlays)
- **Subtle borders** using `border-current/10` to `border-current/30`
- **Minimal shadows** - primarily `shadow-sm` with hover elevation
- **High contrast** between background and foreground colors
- **Monochromatic palette** with opacity variations

### Visual Hierarchy

- **Typography-driven**: EB Garamond for titles, Charter BT for reading
- **Opacity-based depth**: Using foreground/background opacity for layers
- **Backdrop blur** for glassmorphism effects
- **Z-index layering** for proper stacking context

### Responsive Philosophy

- Fluid typography using `clamp()` and scale variables
- Breakpoint-aware spacing and sizing

---

## Typography System

### Font Families


| Font            | Variable             | Primary Usage                                       | Weights                                 |
| --------------- | -------------------- | --------------------------------------------------- | --------------------------------------- |
| **Charter BT**  | `--font-reading`     | Body text, journal content, reading experience      | 400 (regular/italic), 700 (bold/italic) |
| **EB Garamond** | `--font-eb-garamond` | Journal entry titles, card titles, display headings | 400, 500, 600, 700                      |
| **Geist Mono**  | `--font-geist-mono`  | UI elements, code, panels, chat, technical text     | Variable                                |
| **Geist Sans**  | `--font-geist-sans`  | General sans-serif fallback                         | Variable                                |


### Font Loading

```tsx
// From layout.tsx
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-eb-garamond',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
})

const geistSans = Geist_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
})
```

### Font Size Scale

#### Prose Content (`.prose` class)

```css
h1: 2rem (32px), font-weight: 700
h2: 1.6rem (25.6px), font-weight: 600
h3: 1.3rem (20.8px), font-weight: 600
p: line-height: 1.7, font-weight: var(--journal-text-font-weight) /* 400 */
code: border-radius: 4px
pre: border-radius: 10px, font-size: .875em, line-height: 1.6
```

#### UI Elements (Tailwind Scale)

```css
text-[10px]  /* Tiny labels, metadata */
text-[11px]  /* Tags, badges, small UI elements */
text-xs      /* 12px - Small UI text */
text-sm      /* 14px - Standard UI text */
text-base    /* 16px - Body text */
text-lg      /* 18px - Large text */
text-2xl     /* 24px - Display text */
```

### Line Heights


| Context          | Line Height | Usage                      |
| ---------------- | ----------- | -------------------------- |
| Prose paragraphs | 1.7         | Body text, journal entries |
| Code blocks      | 1.6         | Preformatted code          |
| UI elements      | 1.4 - 1.55  | Buttons, labels, panels    |


### Responsive Typography

```css
/* Font scale variable */
--font-reading-scale: 0.94;

/* Applied via clamp() for fluid scaling */
font-size: clamp(/* responsive values */);
```

---

## Color System

### Theme Variants

#### Dark Theme

```css
html[data-theme="dark"] {
  --background: #303428;  /* Dark green-gray */
  --foreground: #c8f2bf;  /* Soft green (inverted) */
  --background-rgb: 48, 52, 40;
  --foreground-rgb: 200, 242, 191;
}
```

#### Paper Theme (Warm Parchment)

```css
html[data-theme="paper"] {
  --background: #f5f2e3;  /* Warm cream */
  --foreground: #22211a;  /* Dark brown */
  --background-rgb: 245, 242, 227;
  --foreground-rgb: 34, 33, 26;
}
```

### Color Usage Patterns

#### Background Opacity Layers

```css
/* Subtle backgrounds */
bg-foreground/5
bg-foreground/10
bg-foreground/15

/* Overlay backgrounds */
bg-background/85
bg-background/90
bg-background/95
```

#### Border Opacity Scale

```css
border-current/10  /* Subtle card borders */
border-current/15  /* Tags, small elements */
border-current/20  /* Panel dividers */
border-current/25  /* Hover states */
border-current/30  /* Panel outlines */
```

#### Text Opacity

```css
text-current/70   /* Muted text */
text-current/80   /* Secondary text */
text-current/90   /* Primary text */
text-foreground   /* Full contrast text */
```

### Accent Colors


| Color          | Hex                            | Usage                              |
| -------------- | ------------------------------ | ---------------------------------- |
| Link Blue      | `#3b82f6`                      | Hyperlinks (light/dark themes)     |
| Link Brown     | `#8b5a2b`                      | Hyperlinks (paper theme)           |
| Error Red      | `text-red-500`, `text-red-400` | Error states, warnings             |
| Positive Green | `emerald-500`                  | Success states, positive sentiment |
| Negative Red   | `red-500`                      | Failure states, negative sentiment |


### Gradient Overlays

#### Landscape Mode Gradient (5-stop)

```css
background: linear-gradient(to right,
  rgba(var(--background-rgb), 0.65),
  rgba(var(--background-rgb), 0.85),
  rgba(var(--background-rgb), 0.95),
  rgba(var(--background-rgb), 0.85),
  rgba(var(--background-rgb), 0.65));
```

#### Fade Gradient (Vertical)

```css
background: linear-gradient(
  to bottom,
  rgba(var(--background-rgb), 0) 0%,
  rgba(var(--background-rgb), 0.55) 55%,
  rgba(var(--background-rgb), 0.92) 88%,
  rgba(var(--background-rgb), 1) 100%
);
```

---

## Spacing & Layout

### Spacing Scale (Tailwind)


| Class   | Value | Common Usage           |
| ------- | ----- | ---------------------- |
| `p-1`   | 4px   | Tight padding          |
| `p-1.5` | 6px   | Icon buttons           |
| `p-2`   | 8px   | Small elements         |
| `p-3`   | 12px  | Buttons, inputs        |
| `p-4`   | 16px  | Standard spacing       |
| `p-5`   | 20px  | Card padding (mobile)  |
| `p-6`   | 24px  | Card padding (tablet)  |
| `p-8`   | 32px  | Card padding (desktop) |


### Gap Scale

```css
gap-0.5  /* 2px */
gap-1    /* 4px */
gap-2    /* 8px */
gap-3    /* 12px */
gap-4    /* 16px */
gap-6    /* 24px */
gap-8    /* 32px */
```

### Z-Index Hierarchy


| Value       | Layer      | Usage                                   |
| ----------- | ---------- | --------------------------------------- |
| `z-0`       | Background | Background shaders, base elements       |
| `z-10`      | Content    | Main content layer                      |
| `z-20`      | Navigation | Floating indicators, nav elements       |
| `z-30`      | Controls   | Interactive controls, buttons           |
| `z-40`      | Panels     | Desktop chat panel, mobile progress bar |
| `z-50`      | Overlays   | Modals, overlays, mobile chat           |
| `z-[85]`    | Previews   | Link preview panels                     |
| `z-[100]`   | Menus      | Context menus, dropdowns                |
| `z-[99999]` | Cursor     | Custom cursor (topmost)                 |


### Layout Dimensions

#### Cards

```css
width: w-full md:w-[420px]
height: h-[190px] sm:h-[210px] md:h-[240px]
padding: p-5 sm:p-6 md:p-8
```

#### Panels

```css
/* Chat Panel (Desktop) */
width: w-[220px]
position: top-24 bottom-16 right-12

/* Corpus Panel */
width: w-[min(30vw,32rem)] lg:max-w-[23vw]

/* Link Preview */
max-width: max-w-[min(92vw,20rem)]  /* Mobile */
           max-w-[min(92vw,28rem)] lg:max-w-[50vw]  /* Desktop */
```

---

## Borders & Shadows

### Border Principles

1. **No rounded corners** on major UI components (cards, panels, overlays)
2. **Minimal border radius** for inline elements only:
  - `border-radius: 1px` - Inline highlights
  - `border-radius: 3px` - Scrollbar thumb
  - `border-radius: 4px` - Inline code
  - `border-radius: 10px` - Code blocks, pre elements
  - `border-radius: 9999px` - Circular elements (profile images, cursor)

### Border Widths

```css
border     /* 1px - standard */
border-2   /* 2px - emphasis */
```

### Border Color Patterns

```css
/* Standard patterns using opacity */
border border-current/10   /* Subtle card borders */
border border-current/15   /* Tags, small elements */
border border-current/20   /* Panel dividers */
border border-current/25   /* Hover states */
border border-current/30   /* Panel outlines, dropdowns */

/* Explicit foreground reference */
border border-[var(--foreground)]/30
```

### Box Shadows

#### Panel Shadow

```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
```

#### Standard Elevation

```css
shadow-sm           /* Base shadow */
hover:shadow        /* Hover elevation */
shadow-xl           /* High elevation (link previews) */
```

#### Modal/Action Button Shadow

```css
/* Default */
shadow-[0_6px_12px_rgba(0,0,0,0.2)]

/* Hover */
hover:shadow-[0_10px_16px_rgba(0,0,0,0.3)]
```

---

## Animation System

### Page Transitions

#### Standard Transition Timing

```typescript
const transition = {
  duration: 0.5,
  ease: [0.6, 0.01, 0.05, 0.9]  // Custom easing curve
};
```

#### Backdrop/Overlay Animation (Slide Up)

```typescript
const backdropVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition },
  exit: { y: '100%', transition }
};
```

#### Content Fade In (with Stagger)

```typescript
const staggerTransition = {
  staggerChildren: 0.1,
  delayChildren: 0.3,
  ...transition
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: staggerTransition
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.3 }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
};
```

### Panel Animations

#### Desktop Panel Slide (Horizontal)

```typescript
animate={open ? { opacity: 1, x: 0 } : { opacity: 0, x: "100%" }}
transition={{ duration: 0.3, ease: "easeInOut" }}
```

#### Mobile Panel Slide (Vertical)

```typescript
animate={open ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
transition={{ duration: 0.5, ease: [0.6, 0.01, 0.05, 0.9] }}
```

### Component Animations

#### Expand/Collapse

```typescript
animate={{
  height: expanded ? 'auto' : 0,
  opacity: expanded ? 1 : 0
}}
transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
```

#### Hover Transitions

```typescript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
transition={{ duration: 0.2 }}
```

### CSS Transitions

```css
/* Standard transitions */
transition: background-color 0.15s ease, box-shadow 0.15s ease;
transition: opacity 0.2s ease;
transition: color 0.2s ease;
transition: opacity 0.16s ease, visibility 0.16s ease;
transition: opacity 0.15s ease;

/* Theme toggle */
transition-all duration-300
```

### Custom Cursor Animation

```css
@keyframes cc-glow-kf {
  0% {
    opacity: 0.25;
    transform: scale(0.3333);
    filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
  }
  60% {
    opacity: 0.18;
    transform: scale(0.9);
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
    filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0));
  }
}

animation: cc-glow-kf 220ms ease-out 1;
```

---

## Component Patterns

### Cards

```jsx
<article className="
  w-full md:w-[420px]
  h-[190px] sm:h-[210px] md:h-[240px]
  box-border overflow-hidden
  bg-foreground/10 backdrop-blur-2xs
  border border-current/10
  p-5 sm:p-6 md:p-8
  shadow-sm hover:shadow transition-shadow
  flex flex-col flex-none justify-center
">
  {/* Card content */}
</article>
```

**Key characteristics:**

- No rounded corners
- Subtle background with backdrop blur
- Minimal border (10% opacity)
- Hover shadow elevation
- Responsive padding

### Panels

```jsx
<div className="
  fixed top-24 bottom-16 right-12 z-40
  hidden lg:flex flex-col min-h-0 overflow-hidden
  border border-current/30
  chat-panel-mobile-background
  backdrop-blur-lg
  font-mono
">
  {/* Panel content */}
</div>
```

**Key characteristics:**

- Fixed positioning
- No rounded corners
- Stronger border (30% opacity)
- Heavy backdrop blur
- Monospace font

### Overlays/Modals

```jsx
{/* Backdrop */}
<div className="
  fixed inset-0 z-50
  about-overlay-background
  backdrop-blur-xs
">

{/* Content Panel */}
<div className="
  relative z-10
  flex max-h-[min(70dvh,70vh)] w-full min-w-0 flex-col
  overflow-hidden
  border border-current/20
  bg-background/95
  text-foreground/90
  shadow-[0_4px_12px_rgba(0,0,0,0.16)]
  backdrop-blur-[2px]
  pointer-events-auto
">
  {/* Modal content */}
</div>
```

**Key characteristics:**

- Full viewport backdrop with blur
- Centered content panel
- No rounded corners
- Semi-transparent background (95%)
- Subtle backdrop blur on panel
- Drop shadow for depth

### Input Boxes

```jsx
<input className="
  w-full
  border border-[var(--foreground)]/30
  px-4 py-3
  bg-transparent
  focus:outline-none
" />
```

**Key characteristics:**

- Transparent background
- 30% opacity border
- Generous padding (16px horizontal, 12px vertical)
- No focus ring (outline-none)

### Dropdown Menus

```jsx
<div className="
  absolute left-0 right-0 mt-1
  max-h-48 overflow-y-auto
  border border-[var(--foreground)]/30
  bg-[var(--background)]/95
  backdrop-blur-sm
  z-20
">
  {/* Dropdown items */}
</div>
```

**Key characteristics:**

- Absolute positioning
- No rounded corners
- Semi-transparent background
- Backdrop blur
- Scrollable with max height

### Scrollbars

```css
/* Standard scrollbar */
.app-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.app-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.app-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--foreground);
  border-radius: 3px;
  border: 1px solid var(--background);
}

/* Muted scrollbar (80% opacity) */
.app-scrollbar-muted::-webkit-scrollbar-thumb {
  background-color: color-mix(
    in srgb,
    var(--foreground) 80%,
    var(--background)
  );
}

/* Hidden scrollbar */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

**Key characteristics:**

- Thin width (6px)
- Minimal border radius (3px)
- Uses foreground/background colors
- Three variants: standard, muted, hidden

### Buttons

#### Standard Button

```jsx
<button className="
  opacity-80 hover:opacity-100
  transition-opacity
  font-mono
  hover:underline
">
  Button Text
</button>
```

#### Icon Button

```jsx
<button className="
  p-1.5
  opacity-70 hover:opacity-100
  hover:bg-current/10
  transition-all
  text-sm
">
  <Icon />
</button>
```

#### Action Button

```jsx
<button className="
  border border-current/20
  bg-background/60
  backdrop-blur-[2px]
  text-current/90
  shadow-[0_6px_12px_rgba(0,0,0,0.2)]
  hover:shadow-[0_10px_16px_rgba(0,0,0,0.3)]
  px-3 py-2
  text-[11px]
  uppercase tracking-[0.14em]
  hover:bg-background/80
  transition-[background-color,box-shadow]
">
  Action
</button>
```

**Key characteristics:**

- Opacity-based hover states
- Minimal borders
- Backdrop blur for depth
- Uppercase tracking for action buttons
- Shadow elevation on hover

### Tags/Badges

```jsx
<span className="
  inline-flex items-center gap-1
  px-2 py-1
  text-[11px]
  border border-current/15
  bg-current/5
">
  Tag Text
</span>
```

**Key characteristics:**

- Inline flex for alignment
- Small padding (8px horizontal, 4px vertical)
- Tiny text (11px)
- Very subtle border and background

### Dividers

```jsx
<hr className="h-px bg-current/20" />  {/* Light divider */}
<hr className="h-px bg-current/30" />  {/* Stronger divider */}
```

---

## Visual Effects

### Paper Shader Background

Using `@paper-design/shaders-react` for dithering effect:

```jsx
<Dithering
  colorBack={glowColor}
  colorFront={gapColor}
  shape="warp"
  type="8x8"
  pxSize={1}
  offsetX={-1}
  offsetY={0.46}
  scale={1.0}
  rotation={random(0, 360)}
  speed={0.03}
/>
```

**Theme-specific colors:**

```typescript
light: { glowColor: "#c8f2bf", gapColor: "#303428" }
dark: { glowColor: "#303428", gapColor: "#c8f2bf" }
paper: { glowColor: "#f5f2e3", gapColor: "#3a3124" }
```

### Custom Cursor

```css
.cc-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--foreground);
}

.cc-glow {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: var(--foreground);
  opacity: 0;
  transform: scale(0.3333);
}
```

**Behavior:**

- Follows pointer with 0.75 ease factor
- Click triggers glow animation (220ms)
- Hides near iframes (14px proximity)

### Backdrop Blur Scale

```css
backdrop-blur-2xs    /* Very subtle */
backdrop-blur-xs
backdrop-blur-[1px]
backdrop-blur-[2px]
backdrop-blur-sm
backdrop-blur-md
backdrop-blur-lg     /* Heavy blur */
```

**Usage patterns:**

- Cards: `backdrop-blur-2xs`
- Panels: `backdrop-blur-lg`
- Overlays: `backdrop-blur-xs`
- Dropdowns: `backdrop-blur-sm`

### Gradient Fades

#### Vertical Fade (Bottom)

```css
background: linear-gradient(
  to bottom,
  rgba(var(--background-rgb), 0) 0%,
  rgba(var(--background-rgb), 0.55) 55%,
  rgba(var(--background-rgb), 0.92) 88%,
  rgba(var(--background-rgb), 1) 100%
);
```

#### Horizontal Fade (Landscape)

```css
background: linear-gradient(
  to right,
  rgba(var(--background-rgb), 0.65),
  rgba(var(--background-rgb), 0.85),
  rgba(var(--background-rgb), 0.95),
  rgba(var(--background-rgb), 0.85),
  rgba(var(--background-rgb), 0.65)
);
```

---

## Implementation Guidelines

### Do's

✅ **Use opacity-based borders and backgrounds**

```jsx
className="border border-current/20 bg-foreground/10"
```

✅ **Apply backdrop blur for depth**

```jsx
className="backdrop-blur-md"
```

✅ **Use semantic typography**

```jsx
<h1 className="font-serif">Title in EB Garamond</h1>
<p className="font-reading">Body in Charter BT</p>
<code className="font-mono">Code in Geist Mono</code>
```

✅ **Follow z-index hierarchy**

```jsx
<div className="z-10">Content</div>
<div className="z-40">Panel</div>
<div className="z-50">Modal</div>
```

✅ **Implement hover states with opacity**

```jsx
className="opacity-80 hover:opacity-100 transition-opacity"
```

✅ **Use Framer Motion for page transitions**

```jsx
<motion.div
  initial="hidden"
  animate="visible"
  exit="exit"
  variants={contentVariants}
>
```

### Don'ts

❌ **Don't use rounded corners on cards, panels, or overlays**

```jsx
// ❌ Wrong
<div className="rounded-lg">

// ✅ Correct
<div className="">
```

❌ **Don't use arbitrary shadow values**

```jsx
// ❌ Wrong
<div className="shadow-lg">

// ✅ Correct
<div className="shadow-sm hover:shadow">
```

❌ **Don't hard-code colors**

```jsx
// ❌ Wrong
<div className="bg-gray-100">

// ✅ Correct
<div className="bg-foreground/10">
```

❌ **Don't skip backdrop blur on overlays**

```jsx
// ❌ Wrong
<div className="fixed inset-0 bg-background/80">

// ✅ Correct
<div className="fixed inset-0 bg-background/80 backdrop-blur-xs">
```

❌ **Don't use generic fonts for titles**

```jsx
// ❌ Wrong
<h1 className="font-sans">Title</h1>

// ✅ Correct
<h1 className="font-serif">Title</h1>
```

### Component Construction Checklist

When creating new components, ensure:

- No rounded corners (unless circular element)
- Border opacity between 10-30%
- Background opacity between 5-15%
- Backdrop blur applied where appropriate
- Proper z-index layer
- Hover states with opacity transitions
- Correct font family (serif, reading, or mono)
- Consistent spacing using Tailwind scale
- Smooth transitions (0.15s - 0.3s)
- Proper overflow handling
- Responsive breakpoints considered

---

## File References


| Design Element               | File Path                                           |
| ---------------------------- | --------------------------------------------------- |
| Global CSS & Theme Variables | `frontend/src/app/globals.css`                      |
| Font Loading                 | `frontend/src/app/layout.tsx`                       |
| Scrollbar Utilities          | `frontend/src/lib/appScrollbar.ts`                  |
| Theme Toggle                 | `frontend/src/components/ThemeToggle.tsx`           |
| Custom Cursor                | `frontend/src/components/CustomCursor.tsx`          |
| Paper Shader                 | `frontend/src/components/PaperShaderBackground.tsx` |
| Card Component               | `frontend/src/components/JournalCard.tsx`           |
| Overlay Pattern              | `frontend/src/components/AboutOverlay.tsx`          |
| Panel Pattern                | `frontend/src/components/ChatPanel.tsx`             |
| Scroll Area                  | `frontend/src/components/ui/ScrollArea.tsx`         |
| Transition Store             | `frontend/src/store/transition.ts`                  |


---

## Summary

This design system emphasizes:

1. **Minimalism** - Clean borders, subtle shadows, no decorative rounding
2. **Typography** - Four distinct fonts with clear purposes
3. **Opacity-based depth** - Using transparency for visual hierarchy
4. **Smooth animations** - Consistent timing and easing functions
5. **Glassmorphism** - Backdrop blur for modern depth effects
6. **Monochromatic palette** - Single color family with theme variants
7. **Accessibility** - High contrast, clear hierarchy, semantic markup

All components should adhere to these principles to maintain visual consistency throughout the application.