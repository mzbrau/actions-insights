---
name: Technical Precision System
colors:
  surface: '#f7f9ff'
  surface-dim: '#d2dbe6'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e6effa'
  surface-container-high: '#e0e9f5'
  surface-container-highest: '#dae3ef'
  on-surface: '#141c25'
  on-surface-variant: '#424753'
  inverse-surface: '#29313a'
  inverse-on-surface: '#e9f2fd'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005bc0'
  primary: '#0051ae'
  on-primary: '#ffffff'
  primary-container: '#0969da'
  on-primary-container: '#ecefff'
  inverse-primary: '#adc6ff'
  secondary: '#5b5f64'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e6'
  on-secondary-container: '#5f6369'
  tertiary: '#913900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b84b00'
  on-tertiary-container: '#ffece5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e0e2e9'
  secondary-fixed-dim: '#c3c6cd'
  on-secondary-fixed: '#181c21'
  on-secondary-fixed-variant: '#43474d'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7a2f00'
  background: '#f7f9ff'
  on-background: '#141c25'
  surface-variant: '#dae3ef'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-xs:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  row-height-sm: 32px
  row-height-md: 48px
---

## Brand & Style

The design system is engineered for developers and DevOps engineers who require immediate, actionable insights from CI/CD pipelines. The brand personality is **utilitarian, precise, and authoritative**, mirroring the reliability of enterprise-grade developer tools. 

The aesthetic draws from **Corporate Modernism** with a heavy emphasis on **Information Density**. It prioritizes "signal over noise" by using a flat UI architecture, purposeful whitespace, and a high-contrast status language. Visual ornamentation is stripped away in favor of structural clarity, ensuring that critical failure data is identified within seconds of page load. The emotional response should be one of confidence and systemic order.

## Colors

The palette is strictly functional, utilizing the familiar color language of version control environments. 

- **Primary:** GitHub-inspired blue for interactive elements, breadcrumbs, and links.
- **Semantic Statuses:** 
    - **Success:** Emerald-derived green for passing states.
    - **Failure:** Rose-derived red for failing states and urgent error messaging.
    - **Warning:** Amber for skipped tests or non-breaking issues.
- **Neutrals:** A sophisticated range of Slates. Use `Slate-50` for background surfaces to reduce eye strain compared to pure white, and `Slate-200` for subtle borders.
- **Dark Mode (Defaulting to light):** In dark mode, shift backgrounds to `Slate-950` and surfaces to `Slate-900` with high-contrast borders (`Slate-800`).

## Typography

This design system utilizes a dual-font strategy to separate narrative UI from technical data.

- **Primary Interface (Inter):** Used for navigation, headings, and status summaries. It provides high legibility at small sizes.
- **Data & Monospace (JetBrains Mono):** Used for test paths, stack traces, and code snippets. The increased character spacing and clear distinctness of symbols (e.g., `0` vs `O`) are critical for debugging.
- **Scale:** Keep body text at `14px` for standard density, dropping to `12px` for metadata and labels to maximize information per screen.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for dashboard views and a **Fluid Content** model for data tables.

- **Grid:** Use a 12-column grid for the summary dashboard. 
- **Density:** Adopt a "Compact" vertical rhythm. List items and table rows should favor a `32px` or `40px` height to allow more results to be visible without scrolling.
- **Breakpoints:**
    - **Desktop (1280px+):** Full 12-column span with side-by-side summary cards.
    - **Tablet (768px - 1279px):** Stacked summary cards, horizontal scroll permitted for wide data tables.
    - **Mobile (<768px):** Single column flow. Table columns are hidden via priority (Status > Name > Duration).

## Elevation & Depth

This system avoids deep shadows to maintain a flat, technical aesthetic. Depth is communicated via **Tonal Layering** and **Subtle Outlines**.

- **Surfaces:** The base background is `Slate-50`. Secondary surfaces (cards, sidebars) use pure `#FFFFFF` with a `1px` border of `Slate-200`.
- **Shadows:** Use a single "Sharp" shadow level for floating elements like dropdowns or tooltips: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Interactivity:** On hover, interactive rows or cards should transition their border color to `Primary-Blue-300` rather than lifting via shadow.

## Shapes

The shape language is **Soft (0.25rem)**, providing a modern feel while maintaining a structured, professional appearance. 

- **Standard Elements:** Buttons, inputs, and cards use a `4px` (0.25rem) radius.
- **Status Badges:** Use a "Squircle" approach (6px) or fully pill-shaped (999px) for clear differentiation from square structural boxes.
- **Code Blocks:** Use consistent `4px` rounding to match the containers they sit within.

## Components

### Status Badges
High-contrast indicators using a solid background for failures (`Error-600`) and subtle tinted backgrounds with dark text for passes (`Success-100` background with `Success-700` text).

### Summary Cards
Large, bold numeric displays (`32px` Display type) centered in cards. Place a small semantic color bar (4px height) at the top of the card to indicate the health of that specific metric.

### Data Tables
Rows must be zebra-striped using `Slate-50` and `#FFFFFF`. Columns should have clear vertical alignment, with the "Status" column always pinned to the left. Failures should have a slightly tinted red background across the entire row to ensure they are impossible to miss.

### Expandable Code Blocks
Used for stack traces. Background: `Slate-900` (Dark) even in Light Mode to provide a clear mental shift to "Code/Terminal" context. Use JetBrains Mono for all content.

### Navigation & Tabs
- **Breadcrumbs:** Use `Primary-Blue` for parent links, separated by a `Slate-400` chevron.
- **Tabs:** Use the GitHub "Underline" style where the active tab has a `2px` primary-colored bottom border. Show a count badge (e.g., "Failures (3)") directly in the tab label.

### Inputs
Search bars and filters should use `Slate-100` backgrounds with a placeholder text color of `Slate-400`. Focus state is a `2px` blue ring.