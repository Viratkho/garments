---
name: GARMENTFLOW — DP ENTERPRISES
description: Industrial glassmorphic garment manufacturing management system with dual Midnight Black / Pearl White ink-spread themes.
colors:
  midnight-black: "#0B0B0F"
  carbon-black: "#17171D"
  electric-violet: "#8B5CF6"
  pearl-white: "#F5F5F0"
  rosso-corsa: "#D50000"
  semantic-positive: "#22C55E"
typography:
  headline:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  caption:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  micro:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.electric-violet}"
    textColor: "{colors.pearl-white}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  card-glass:
    backgroundColor: "{colors.carbon-black}"
    textColor: "{colors.pearl-white}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.midnight-black}"
    textColor: "{colors.pearl-white}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: GARMENTFLOW — DP ENTERPRISES

## Overview

**Creative North Star: "The Precision Stitch Ledger"**

GARMENTFLOW translates DP ENTERPRISES's daily garment manufacturing operations—bulk stitching contracts, fabric yardage, worker attendance, and profit/loss reconciliation—into an industrial-grade glassmorphic operations cockpit. Rather than borrowing generic pastel SaaS themes, it commits strictly to a five-color material system anchored by Midnight Black and Pearl White grounds, Carbon Black frosted panels, Electric Violet active highlights, and Rosso Corsa critical alerts.

Every surface balances frosted depth with high-contrast legibility. Transitions stay brisk (`150–240ms`), numbers lock into tabular columns, and the signature theme toggle pours an organic ink-spread transition directly from the switch origin across the live DOM.

**Key Characteristics:**
- Strict five-color brand discipline across Dark and Light modes
- Frosted glassmorphism containers with crisp hairline borders
- Tabular numeric alignment for INR (`₹`) valuations, quantities, and working hours
- Organic View-Transition ink-spread theme switching with reduced-motion fallback

## Colors

The palette pairs high-contrast dark and daylight neutral grounds with a single primary action hue (Electric Violet) and a dedicated danger/loss hue (Rosso Corsa).

### Primary
- **Electric Violet** (`#8B5CF6`): Active navigation items, primary CTAs, focus rings, realized revenue chart series, and interactive highlights.

### Secondary
- **Rosso Corsa** (`#D50000`): Low-stock warnings, negative financial indicators, expense breakdowns, wastage metrics, and destructive confirmation actions.

### Neutral
- **Midnight Black** (`#0B0B0F`): Main Dark Mode canvas and input recess surfaces.
- **Carbon Black** (`#17171D`): Frosted Dark Mode cards, sidebar, top navigation bar, and ink toggle pill.
- **Pearl White** (`#F5F5F0`): Main Light Mode canvas, Dark Mode primary typography, and primary button text.

### Named Rules
**The Five-Color Discipline Rule.** Never introduce unanchored accent colors; operational highlights belong exclusively to Electric Violet (`#8B5CF6`), critical/loss states to Rosso Corsa (`#D50000`), and positive financial confirmation to restrained semantic green (`#22C55E`).

## Typography

**Display & Body Font:** Manrope (with `system-ui, -apple-system, sans-serif` fallback)
**Label/Mono Font:** JetBrains Mono (with `ui-monospace, monospace` fallback)

**Character:** Tight, engineered geometric sans-serif with `font-variant-numeric: tabular-nums` enforced across every table, KPI counter, currency cell, and timestamp.

### Hierarchy
- **Headline** (800 weight, `1.125rem`, line-height `1.25`, tracking `-0.02em`): Module headers and primary KPI readouts.
- **Title** (700 weight, `1rem`, line-height `1.35`): Card headers and modal titles.
- **Body** (400 weight, `0.875rem`, line-height `1.5`): Form inputs, descriptions, and operational notes.
- **Label** (600 weight, `0.75rem`, line-height `1.3`): Table column headers, form field labels, and status pills.

## Layout

Desktop viewports (`>= 1024px`) pair a sticky collapsible sidebar (`264px` expanded / `76px` collapsed) with a sticky top bar and a centered `1440px` max-width workspace (`24px` padding). Tablet and mobile viewports collapse the sidebar into a slide-over drawer, stack form columns to single width, and switch dense tables (such as All Orders) to structured summary cards with zero horizontal overflow.

## Elevation & Depth

Surfaces rely on frosted glass translucency (`backdrop-filter: blur(18px) saturate(135%)`) paired with `1px` hairline borders and soft ambient drop shadows (`0 18px 42px -18px rgba(0, 0, 0, 0.7)`) in Dark Mode and crisp elevated white glass (`rgba(255, 255, 255, 0.76)`) in Light Mode.

## Shapes

Containers use `16px` (`rounded-2xl`) outer card radii, `12px` (`rounded-xl`) inner controls/inputs/buttons, and `999px` pill badges and ink-toggle tracks.

## Components

### Buttons
- **Shape:** Gently rounded (`12px` radius)
- **Primary:** Electric Violet (`#8B5CF6`) background, Pearl White (`#F5F5F0`) text, `10px 18px` padding, subtle violet lift shadow on hover (`translateY(-1px)`).
- **Secondary / Ghost:** Translucent subtle fill with `1px` glass border; shifts border to violet on hover.

### Cards / Containers
- **Corner Style:** `16px` radius
- **Background:** Carbon Black translucent (`rgba(23, 23, 29, 0.72)`) in Dark Mode; clean white translucent (`rgba(255, 255, 255, 0.76)`) in Light Mode.
- **Border:** `1px solid` semi-transparent Pearl/Carbon hairline.

### Inputs / Fields
- **Style:** `12px` radius, `1px` glass border, `10px 14px` padding, recessed Midnight Black / white input fill.
- **Focus:** `1px` Electric Violet border with `2px` violet focus ring (`rgba(139, 92, 246, 0.25)`).

### Navigation
- Sticky left sidebar with collapsible Orders submenu; active route highlighted with solid Electric Violet (`#8B5CF6`) fill and Pearl White label.

### Ink-Spread Theme Switch
- Glossy pill switch (`role="switch"`, `66px × 34px`) with morphing sun-to-crescent SVG knob that triggers an organic multi-lobe ink-spread View Transition (`860ms`) originating from the switch coordinates, with reduced-motion and fallback support.

## Do's and Don'ts

### Do:
- **Do** enforce `tabular-nums` on every currency figure, piece count, working-hour readout, and order ID.
- **Do** preserve high text contrast (`>= 4.5:1`) across all seven background presets in both Dark and Light modes.
- **Do** respect `prefers-reduced-motion` on both KPI count-ups and the ink-spread theme transition.

### Don't:
- **Don't** introduce unrelated decorative accent colors outside the five-color system.
- **Don't** add payment gateways, customer checkout flows, or e-commerce tropes.
- **Don't** double-count stock consumption or worker salary ledgers on top of order-level material/labour costs in Profit & Loss.
