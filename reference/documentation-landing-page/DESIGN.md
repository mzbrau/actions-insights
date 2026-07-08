---
name: Obsidian Insight
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
  on-surface-variant: '#c1c6d6'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#8b909f'
  outline-variant: '#414754'
  surface-tint: '#acc7ff'
  primary: '#acc7ff'
  on-primary: '#002f68'
  primary-container: '#498fff'
  on-primary-container: '#00285b'
  inverse-primary: '#005bbf'
  secondary: '#7bdb80'
  on-secondary: '#00390e'
  secondary-container: '#007124'
  on-secondary-container: '#91f294'
  tertiary: '#ffb4ac'
  on-tertiary: '#690007'
  tertiary-container: '#fe554d'
  on-tertiary-container: '#5c0005'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004492'
  secondary-fixed: '#97f999'
  secondary-fixed-dim: '#7bdb80'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#005319'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ac'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000d'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
---

## Brand & Style

The design system is engineered for developers who require high-density information without cognitive fatigue. It adopts a **Corporate Modern** aesthetic with a heavy leaning toward **Minimalism**, stripping away non-functional decor to prioritize data clarity.

The brand personality is authoritative, technical, and precise. It evokes the feeling of a mission control center—dark, focused, and responsive. Visual interest is generated through high-contrast status indicators and subtle tonal layering rather than illustrative elements. This system feels "native" to a developer's environment, bridging the gap between a code editor and a sophisticated analytics dashboard.

## Colors

The palette is optimized for long-duration viewing in dark environments. It utilizes a deep charcoal and navy base to minimize eye strain while allowing vibrant accent colors to "pop" for immediate status recognition.

- **Primary (Blue):** Used for interactive elements, links, and selected states.
- **Success (Green):** Reserved for "Passed" states and healthy metrics.
- **Danger (Red):** Used exclusively for failures, errors, and critical alerts.
- **Warning (Orange):** Used for "Slow" tests or non-critical issues.
- **Neutral/Surface:** A tiered hierarchy of dark grays (`#010409` to `#161B22`) defines depth without the use of shadows.

## Typography

The typographic system balances the legibility of a modern sans-serif with the technical precision of a monospaced font.

- **Hanken Grotesk** is used for page headings and key metrics to provide a sharp, contemporary look.
- **Inter** handles all standard UI text and body copy, ensuring maximum readability across varying pixel densities.
- **JetBrains Mono** is utilized for all data values, test paths, commit IDs, and code snippets, reinforcing the developer-first nature of the product.

For mobile devices, `headline-xl` should scale down to 24px and `headline-lg` to 20px to ensure content fits within narrower viewports.

## Layout & Spacing

This design system uses a **Fluid Grid** model with a standardized 4px base unit. Layouts are constructed using a 12-column system for desktop screens, collapsing to a single-column stack on mobile.

- **Content Reflow:** On desktop, the sidebar is fixed at 260px, with the main content area expanding fluidly. On tablet, the sidebar collapses into a drawer.
- **Rhythm:** Information density is high. Vertical spacing between related items (like test rows) is kept at `sm` (8px), while distinct sections are separated by `xl` (32px).
- **Margins:** Container padding for cards and data tables should strictly follow the `md` (16px) or `lg` (24px) units to maintain a clean internal alignment.

## Elevation & Depth

In keeping with the sleek, dark aesthetic, depth is communicated through **Tonal Layers** and **Low-contrast Outlines** rather than traditional drop shadows.

- **Canvas (`#010409`):** The absolute bottom layer of the UI.
- **Surface (`#0D1117`):** The primary background for content areas and sidebars.
- **Container (`#161B22`):** Used for cards, test result blocks, and input fields.
- **Borders (`#30363D`):** Every container uses a 1px solid border. This creates a crisp "compartmentalized" feel that helps users parse complex data sets. 

Hover states are indicated by a subtle brightening of the border color or background, never by increasing elevation/shadow.

## Shapes

The shape language is disciplined and professional. We use **Soft** roundedness (`0.25rem`) for most standard components like buttons, input fields, and tags. 

Larger structural elements, such as cards and main content containers, utilize `rounded-lg` (`0.5rem`) to provide a subtle visual distinction from smaller UI controls. Icons and status indicators (like the success/fail marks) are kept strictly circular to contrast against the predominantly rectangular layout.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Blue (`#2F81F7`) with white text.
- **Secondary/Ghost:** Transparent background with a subtle border (`#30363D`).
- **Inputs:** Darker background (`#010409`) with a subtle border that glows blue on focus.

### Status Chips
- Small, pill-shaped indicators with low-opacity background tints (e.g., 15% Green background with 100% Green text) for non-critical labels.
- For critical status (Passed/Failed), use solid color icons paired with bold labels.

### Data Tables & Lists
- Rows feature a subtle bottom border. 
- On hover, the entire row should shift to a slightly lighter background (`#161B22`) to guide the user's eye across the data columns.

### Metric Cards
- Large Hanken Grotesk numbers.
- A subtle top-border accent color can be used to categorize metrics (e.g., a green top-border for "Success Rate").

### Code Blocks
- Used for stack traces and logs. These use a darker background (`#010409`), monospaced typography, and a "copy" button in the top-right corner that appears on hover.