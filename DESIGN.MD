---
name: TeroBytez Core
colors:
  surface: '#061423'
  surface-dim: '#061423'
  surface-bright: '#2d3a4a'
  surface-container-lowest: '#020f1e'
  surface-container-low: '#0f1c2c'
  surface-container: '#132030'
  surface-container-high: '#1e2b3b'
  surface-container-highest: '#283646'
  on-surface: '#d6e4f9'
  on-surface-variant: '#bacac5'
  inverse-surface: '#d6e4f9'
  inverse-on-surface: '#243141'
  outline: '#85948f'
  outline-variant: '#3b4a46'
  surface-tint: '#38ddc4'
  primary: '#44e5cc'
  on-primary: '#003730'
  primary-container: '#00c9b1'
  on-primary-container: '#004f44'
  inverse-primary: '#006b5d'
  secondary: '#b8c8da'
  on-secondary: '#223240'
  secondary-container: '#394857'
  on-secondary-container: '#a7b7c8'
  tertiary: '#ffbfb6'
  on-tertiary: '#690003'
  tertiary-container: '#ff9688'
  on-tertiary-container: '#900005'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#5ffae0'
  primary-fixed-dim: '#38ddc4'
  on-primary-fixed: '#00201b'
  on-primary-fixed-variant: '#005046'
  secondary-fixed: '#d4e4f6'
  secondary-fixed-dim: '#b8c8da'
  on-secondary-fixed: '#0d1d2a'
  on-secondary-fixed-variant: '#394857'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#061423'
  on-background: '#d6e4f9'
  surface-variant: '#283646'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  technical-code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style

The design system is engineered for the high-stakes environment of commercial logistics. The brand personality is **utilitarian, authoritative, and precise**, evoking the feeling of a modern "Dispatch Terminal." It prioritizes rapid information retrieval and "at-a-glance" legibility for drivers who are often in high-glare or high-vibration environments.

The aesthetic follows a **Modern Corporate** approach with a **Technical** edge. It utilizes a dark-mode-first architecture to reduce eye strain during night shifts while maintaining high-contrast ratios for daylight visibility. The UI avoids decorative fluff, focusing instead on structural hierarchy, rigid grids, and clear actionable states.

## Colors

The color palette is built on a foundation of Deep Navy to provide a stable, low-fatigue backdrop. 

- **Primary (Electric Teal):** Reserved for high-priority interactions, active tab indicators, and primary call-to-action buttons.
- **Secondary (Slate Gray):** Used for secondary text, icons, and structural borders to create subtle separation without distracting from primary data.
- **Emergency (Vivid Red):** A dedicated semantic color for SOS actions, critical vehicle alerts, and immediate hazards.
- **Surface Layering:** The background uses the base Deep Navy, while interactive containers and cards use a slightly lighter Navy (#162032) with 1px Slate borders to define depth.

## Typography

Typography is the backbone of this design system’s operational efficiency. 

- **Primary Interface:** Hanken Grotesk is used for all UI elements, offering a sharp, contemporary sans-serif feel that remains legible at various weights.
- **Data & Logistics:** JetBrains Mono is employed for route codes, VIN numbers, timestamps, and technical telemetry. This monospaced choice ensures that alphanumeric strings (where "0" and "O" might be confused) are unmistakable.
- **Hierarchy:** Use `label-caps` for section headers and non-interactive metadata to maintain a clean, organized "manifest" look.

## Layout & Spacing

This design system utilizes a strict **8px linear grid** to ensure consistency across dense data views.

- **Mobile First:** The layout relies on a fluid vertical stack with a fixed 16px outer margin. 
- **Density:** In operational views (like route lists), vertical padding is tightened to 12px to maximize information density, while touch targets (buttons, toggles) never drop below 48px in height.
- **Grid Models:** Use a 4-column grid for mobile and an 8-column grid for tablet-based dispatch units. Cards should span the full width of the container on mobile to maximize horizontal space for monospaced technical data.

## Elevation & Depth

To maintain the "Terminal" aesthetic, this design system avoids soft, organic shadows. Instead, it uses **Tonal Layering** and **Structural Outlines**:

- **Level 0 (Background):** Deep Navy (#0D1B2A).
- **Level 1 (Cards/Plates):** Lighter Navy (#162032) with a 1px solid Slate-gray border (#708090 at 30% opacity).
- **Level 2 (Modals/Pop-overs):** Lighter Navy (#162032) with a 1px Primary Teal border to indicate active focus.

Depth is communicated through contrast rather than diffusion. Background blurs are only used behind global navigation bars to maintain legibility of the content scrolling beneath.

## Shapes

The shape language balances modern mobile conventions with industrial rigidity. 

- **Standard Elements:** Cards, input fields, and containers use a **0.5rem (8px)** corner radius. This provides a professional, "tooled" look that feels sturdy but not sharp.
- **Status Indicators:** Badges and chips must be **pill-shaped** (fully rounded) to immediately distinguish them from interactive buttons or static cards. 
- **Action Icons:** Icons should be housed in square or slightly rounded containers to maintain the technical grid feel.

## Components

### Buttons
- **Primary:** Electric Teal background with Deep Navy text. Bold, all-caps or title case.
- **Secondary:** Transparent background with 1px Slate border and White text.
- **Emergency (SOS):** Solid Vivid Red background with White text. Minimum 56px height for rapid access.

### Cards
- Background: #162032. 
- Border: 1px Slate-gray.
- Content: Headline in White, metadata in Slate-gray. Use JetBrains Mono for any ID numbers or logistics codes within the card.

### Status Badges
- **Pill-shaped.** 
- **Active:** Green (#22C55E) background with white text.
- **Scheduled:** Amber (#F59E0B) background with white text.
- **Alert:** Red (#FF3B30) background with white text.
- **Completed:** Grey (#6B7280) background with white text.

### Input Fields
- Dark backgrounds (#0D1B2A) with 1px Slate borders. 
- On focus, the border transitions to Electric Teal.
- Labels are always visible, using the `label-caps` typography style.

### Lists
- Use "Divided List" items with 1px slate separators. Each row should have a minimum height of 64px for easy thumb-tapping during vehicle operation.