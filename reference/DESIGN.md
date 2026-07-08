---
name: Actions Insight
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4ae176'
  on-secondary: '#003915'
  secondary-container: '#00b954'
  on-secondary-container: '#004119'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  container-max: 1280px
---

## Brand & Style

The design system is built for high-velocity engineering teams. It prioritizes technical clarity, dense data visualization, and immediate status recognition. The personality is professional, utilitarian, and developer-centric.

The aesthetic follows a **Modern Corporate** style with **Developer Tooling** influences. It utilizes a deep monochromatic foundation to allow vibrant status indicators to command attention. High information density is balanced by a strict grid and subtle elevation, ensuring that complex CI/CD data remains scannable and actionable.

## Colors

The palette is optimized for a dark-first experience to reduce eye strain during long debugging sessions.

- **Background:** A deep charcoal/slate (#10141a) serves as the base.
- **Surfaces:** Subtle shifts in value define hierarchy. Cards use a slightly lighter slate to pull forward from the background.
- **Status Semantic Colors:** 
    - **Success (Vibrant Green):** Used for passed tests and healthy builds.
    - **Failure (Bold Red):** High-contrast red for immediate error identification.
    - **Running (Blue):** Clear, active blue for in-progress workflows.
    - **Skipped (Muted Slate):** Neutral tones for non-actionable or bypassed items.
- **Borders:** Thin, low-contrast borders (#30363d) define structure without adding visual noise.

## Typography

This design system employs a dual-font strategy to separate UI navigation from technical content.

- **UI Elements:** **Inter** is used for all headers, navigation, and standard interface text. Its neutral, clean shapes ensure legibility at small sizes in dense tables.
- **Technical Content:** **JetBrains Mono** (or a system monospaced font) is used for test names, commit hashes, log outputs, and file paths. This provides the necessary character alignment for reading technical strings.
- **Hierarchy:** Strong weight contrasts (Bold for run numbers, Medium for labels) differentiate data keys from values.

## Layout & Spacing

The layout uses a **fluid grid** system with a fixed maximum container width for desktop readability. 

- **Density:** The system utilizes a high-density 4px base unit. 
- **Structure:** Content is organized into clear vertical sections (Breadcrumbs > Header > Summary Cards > Data Tables).
- **Tables:** Rows have tight vertical padding (8px) to maximize the number of visible records.
- **Footer:** A fixed global footer (40px height) houses persistent keyboard shortcut hints and search triggers.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** rather than heavy shadows.

- **Layer 0 (Background):** #10141a.
- **Layer 1 (Cards/Containers):** #161b22 with a 1px solid border (#30363d).
- **Layer 2 (Hover States):** When hovering over list items or cards, the background shifts to #21262d to provide tactile feedback.
- **Interactives:** Buttons and inputs use a subtle inner glow or slightly lighter border to indicate interactivity.

## Shapes

The shape language is disciplined and functional. 

- **Standard Radius:** 4px (Soft) is applied to cards, buttons, and input fields to maintain a modern but structured feel.
- **Status Icons:** Small 16x16px squares with 2px rounding for checkmarks and 'X' icons.
- **Breadcrumbs & Chips:** Pill shapes are avoided in favor of slightly rounded rectangles to maintain the professional, technical aesthetic.

## Components

### Summary Cards
Large numeric displays for "Total," "Passed," and "Failed." These cards use a background color of #161b22 and include a prominent status icon paired with a large bold headline font for the count.

### Data Tables
Tables are the primary interface. They feature:
- Headers in `label-caps` with a bottom border.
- Row hover states that lighten the background.
- Status icons in the first column for quick scanning.
- Monospaced text for technical identifiers (Commits, Runs).

### Input Fields
Search bars use a dark fill (#0d1117), a 1px border (#30363d), and `body-md` Inter text. The placeholder text is muted.

### Footer Bar
A fixed #0d1117 bar at the bottom of the viewport. It contains "Keyboard:" hints where specific keys (e.g., `/`, `g`, `r`) are styled inside small, light-bordered boxes to resemble physical keys.

### Navigation Breadcrumbs
Located at the top left, prefixed with a back arrow (`←`). These use `body-md` text with primary color (#3b82f6) for links and neutral white/grey for the current page.