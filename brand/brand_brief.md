---
name: Broadr Brand Brief v2 — Light Theme
product: Broadr
version: 2.0
revised: 2026-04-10
status: APPROVED DIRECTION
previous-version: Dark theme — REJECTED by owner
canvas-agent: CANVAS
originSessionId: 68694e5f-a195-442e-bf74-cac514ddf430
---
# BROADR — Brand Brief v2 (Light Theme)

## What Broadr Is

A marketing operations platform for a content agency owner who shoots professional photo/video for clients and manages Meta and Google Ads on their behalf. Operator-focused — not client-facing. The person using this is a professional who commands campaigns, manages shoots, tracks performance, and runs a business. The interface must feel like a tool built for someone who knows exactly what they're doing.

---

## 1. Brand Personality

**Precise. Commanding. Luminous. Efficient. Cinematic.**

- **Precise** — Data is dense and accurate. No rounding, no fluff. Numbers mean something.
- **Commanding** — The operator is in control. The UI defers to them, not the other way around.
- **Luminous** — Light, not heavy. The interface breathes. Glass surfaces catch virtual light.
- **Efficient** — Every element earns its space. Density without clutter.
- **Cinematic** — Built by someone who shoots film. The UI has compositional awareness — things are *placed*, not just laid out.

---

## 2. Target Audience

**Primary user:** Agency owner, solo operator or small team. Shoots commercial photo/video. Runs paid media for clients. Thinks in campaigns and deliverables simultaneously. Has high visual standards — they produce content for a living, so they will immediately notice a poorly composed UI. Values speed and clarity over decoration. Responds to interfaces that feel like professional tools, not consumer apps.

**Visual language they respond to:**
- Instruments and dashboards that feel precision-built (think: camera menus, pro audio software, flight management software)
- Light, airy interfaces that still feel *dense with information* — not empty
- Motion that respects their time — snappy, intentional, never decorative
- Typographic hierarchy that lets them scan fast
- Glass surfaces that read as premium without screaming about it

---

## 3. Colour Palette — COMPLETE SPECIFICATION

### Background System

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#F5F6F8` | Global page background — cool off-white, slightly blue-shifted |
| `--bg-surface` | `#FFFFFF` | Solid card surfaces (non-glass) |
| `--bg-subtle` | `#EDEEF1` | Recessed areas, input backgrounds, nested containers |
| `--bg-wash` | `#F0F2F5` | Section dividers, toolbar backgrounds |

The base is **not pure white** — `#F5F6F8` has a very slight cool-blue shift. This gives the glass cards something to contrast against without introducing a visible tint. Think: the exact tone of a MacBook Pro display showing a white page in natural light.

### Glass Card System (see Section 5 for CSS)

Glass cards sit *above* the background. Their apparent colour comes from the backdrop-filter blurring the content beneath them and the subtle tint applied.

### Accent Colours

These are the *only* colours with saturation in the system. Use them sparingly. On a light background, even a small amount of accent reads strongly — don't overuse.

| Token | Hex | Usage |
|---|---|---|
| `--accent-primary` | `#2563EB` | Primary CTAs, active states, selected nav items, key data highlights |
| `--accent-primary-light` | `#DBEAFE` | Accent background chips, badge fills, hover states on ghost buttons |
| `--accent-primary-dim` | `#93C5FD` | Decorative accents, chart lines, subtle highlights |
| `--accent-amber` | `#D97706` | Warnings, budget alerts, time-sensitive items |
| `--accent-amber-light` | `#FEF3C7` | Amber badge fills |
| `--accent-green` | `#059669` | Positive performance, live status, campaign active |
| `--accent-green-light` | `#D1FAE5` | Green badge fills |
| `--accent-red` | `#DC2626` | Errors, paused campaigns, critical alerts |
| `--accent-red-light` | `#FEE2E2` | Red badge fills |

**No purple** — purple is reserved for VSS Command Centre exclusively.

### Neutral Scale

| Token | Hex | Usage |
|---|---|---|
| `--neutral-900` | `#0F1117` | Primary text — near-black with slight blue undertone |
| `--neutral-700` | `#374151` | Secondary text, labels |
| `--neutral-500` | `#6B7280` | Tertiary text, timestamps, metadata |
| `--neutral-400` | `#9CA3AF` | Placeholder text, disabled states |
| `--neutral-200` | `#E5E7EB` | Dividers, borders on solid surfaces |
| `--neutral-100` | `#F3F4F6` | Hover backgrounds on solid surfaces |
| `--neutral-050` | `#F9FAFB` | Zebra stripe, ultra-subtle fills |

### Data Visualisation Colours

For charts, sparklines, performance graphs. These work on both white and glass surfaces.

| Token | Hex | Usage |
|---|---|---|
| `--chart-blue` | `#3B82F6` | Primary data series |
| `--chart-sky` | `#0EA5E9` | Secondary data series |
| `--chart-teal` | `#14B8A6` | Tertiary data series |
| `--chart-amber` | `#F59E0B` | Spend / budget series |
| `--chart-slate` | `#94A3B8` | Baseline / benchmark |

---

## 4. Typography — UNCHANGED FROM V1

### Font Stack

| Role | Font | Weight(s) | Notes |
|---|---|---|---|
| **Display / Hero** | Space Grotesk | 700 | Large headings, bento card titles, stat callouts |
| **UI / Body** | Inter | 400, 500, 600 | All UI labels, body text, navigation, inputs |
| **Code / Data** | JetBrains Mono | 400, 500 | Ad IDs, campaign codes, metric values in tables, API keys |

### Type Scale

```
--text-2xs:   10px / 1.4 — table micro-labels
--text-xs:    12px / 1.5 — badges, timestamps, captions
--text-sm:    14px / 1.5 — body, UI labels, form fields
--text-base:  16px / 1.6 — primary reading text
--text-lg:    18px / 1.5 — card subtitles, section headers
--text-xl:    22px / 1.3 — bento card primary stat
--text-2xl:   28px / 1.2 — bento card hero number
--text-3xl:   36px / 1.1 — page-level hero metrics
--text-4xl:   48px / 1.0 — display use only
```

### Type Usage Rules

- **Space Grotesk** for any number that is the *subject* of a card (ROAS: 4.2x, Reach: 218K) — this is the moment the font earns its place
- **Inter** for everything operational — labels, nav, inputs, table columns, tooltips
- **JetBrains Mono** for raw data strings — campaign IDs, UTM parameters, API response codes, numeric columns in data tables
- Never mix Space Grotesk and JetBrains Mono in the same typographic context
- Letter-spacing: Space Grotesk display gets `letter-spacing: -0.02em` at large sizes. Inter UI labels get `letter-spacing: 0.01em` at small sizes.

---

## 5. Glassmorphism Specification — LIGHT THEME

Light glassmorphism is fundamentally different from dark. On dark, glass is defined by a bright, slightly luminous tint against a dark background. On light, glass is defined by a *frosted* quality — a soft, almost imperceptible cool tint and a distinct shadow that separates the card from the background below it. The blur is doing the heavy lifting.

### Tier 1 — Primary Bento Cards

The main content containers. Most glass cards on the dashboard are Tier 1.

```css
.glass-tier-1 {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 0.9) inset,   /* top inner highlight */
    0 -1px 0 0 rgba(0, 0, 0, 0.04) inset,         /* bottom inner edge */
    0 4px 6px -1px rgba(0, 0, 0, 0.06),
    0 10px 24px -4px rgba(0, 0, 0, 0.08),
    0 32px 64px -8px rgba(0, 0, 0, 0.06);
}
```

**Why it works:** The inner top highlight (`rgba(255,255,255,0.9)`) simulates light hitting the top rim of a frosted glass surface. The three layered drop shadows create the sense of the card floating cleanly above the background — light and lifted, not heavy.

### Tier 2 — Nested / Secondary Containers

Used inside Tier 1 cards — sub-panels, metric breakdowns, expandable sections.

```css
.glass-tier-2 {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 4px -1px rgba(0, 0, 0, 0.05),
    0 6px 16px -4px rgba(0, 0, 0, 0.07);
}
```

### Tier 3 — Floating UI Elements

Tooltips, dropdowns, command palettes, modals, floating toolbars.

```css
.glass-tier-3 {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(32px) saturate(1.6) brightness(1.02);
  -webkit-backdrop-filter: blur(32px) saturate(1.6) brightness(1.02);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 1.0) inset,
    0 0 0 0.5px rgba(0, 0, 0, 0.08),             /* hairline outer border */
    0 8px 16px -4px rgba(0, 0, 0, 0.10),
    0 20px 48px -8px rgba(0, 0, 0, 0.12);
}
```

Tier 3 gets the most blur and highest opacity — it needs to be fully readable when floating over any content. The `brightness(1.02)` subtly lifts it.

### Glass on Hover (interactive cards)

```css
.glass-tier-1:hover {
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    0 1px 0 0 rgba(255, 255, 255, 0.9) inset,
    0 -1px 0 0 rgba(0, 0, 0, 0.04) inset,
    0 4px 6px -1px rgba(0, 0, 0, 0.07),
    0 12px 28px -4px rgba(0, 0, 0, 0.11),
    0 40px 80px -8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

---

## 6. Background Treatment — What Goes Behind the Glass

On a light theme, the background must do enough work to make the glass readable, but must never compete with the card content. Two layers:

### Layer 1 — Base Canvas

```css
body {
  background-color: #F5F6F8;
  min-height: 100vh;
}
```

That's it. No gradient, no pattern. The background itself is neutral.

### Layer 2 — Ambient Gradient Bloom (optional, used sparingly)

Very large, very soft radial gradients placed behind the bento grid — like a light source behind frosted glass. These are barely visible on their own but give the glass cards something slightly varied to blur against, which makes the glassmorphism more convincing.

```css
.background-bloom {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 800px 600px at 20% 10%, rgba(59, 130, 246, 0.06) 0%, transparent 70%),
    radial-gradient(ellipse 600px 500px at 80% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 70%),
    radial-gradient(ellipse 500px 400px at 55% 40%, rgba(20, 184, 166, 0.04) 0%, transparent 70%);
}
```

These are extremely subtle — `0.04–0.06` opacity. If you screenshot the background alone it looks like near-white. When glass cards are placed over it, the blur picks up the gradient variation and gives each card a very slightly different cast — the left cards feel slightly cool blue, the right cards slightly warmer. This is what makes light glassmorphism feel alive rather than flat.

### Layer 3 — Mesh Texture (optional, one step further)

For a more distinguished look than Apple/Google: a 4% SVG noise texture over the background. This adds tactility without being decorative.

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.4;
  mix-blend-mode: multiply;
}
```

This is the detail that separates Broadr from Apple.com. Apple's backgrounds are flat. This has grain.

---

## 7. Bento Grid Specification — UNCHANGED FROM V1

### Grid Structure

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  padding: 24px;
}
```

### Standard Cell Sizes

| Name | Columns | Rows | Usage |
|---|---|---|---|
| Micro | 3 col | 1 row | Single metric (ROAS, CTR, CPC) |
| Small | 4 col | 1 row | Metric with sparkline |
| Medium | 6 col | 2 row | Chart, campaign card |
| Large | 8 col | 2 row | Primary performance chart |
| Wide | 12 col | 1 row | Section header, timeline strip |
| Hero | 12 col | 3 row | Full-width primary view |

### Bento Card Inner Anatomy

```
┌─────────────────────────────────┐
│ [Icon]  Card Label     [···]    │  ← header: Inter 12px/500, neutral-500
│                                 │
│   $48,291                       │  ← primary stat: Space Grotesk 36px/700
│   ↑ 12.4% vs last week         │  ← delta: Inter 13px/500, accent-green
│                                 │
│   ▁▂▄▃▅▇▆▅  (sparkline)       │  ← chart-blue or chart-sky
│                                 │
└─────────────────────────────────┘
  padding: 20px (micro), 24px (all others)
```

### Border Radius Progression

```
Micro cards:    border-radius: 16px
Small cards:    border-radius: 18px
Medium cards:   border-radius: 20px
Large cards:    border-radius: 22px
Hero:           border-radius: 24px
```

Outer container (page wrapper): `border-radius: 0` — the grid is full-bleed within the app shell.

---

## 8. Motion Personality — UNCHANGED FROM V1

### Core Principle

**Responsive, not performative.** Motion should feel like a direct consequence of the user's action, not a designed sequence they have to watch.

### Easing Curves

```js
const ease = {
  standard:  [0.25, 0.46, 0.45, 0.94],   // most transitions
  decelerate:[0.00, 0.00, 0.20, 1.00],   // elements entering screen
  accelerate:[0.40, 0.00, 1.00, 1.00],   // elements leaving screen
  spring:    { type: 'spring', stiffness: 400, damping: 30 },  // interactive feedback
  snappy:    { type: 'spring', stiffness: 600, damping: 35 },  // toggle, checkbox, tab select
}
```

### Duration Scale

```
Instant:    0ms   — focus rings, border colour changes
Micro:     80ms   — icon swaps, badge number changes
Fast:     150ms   — hover states, small position changes
Base:     200ms   — most UI transitions (card hover, dropdown open)
Moderate: 300ms   — panel slides, tab switches
Slow:     400ms   — page-level transitions, modal entrance
```

### Specific Motion Patterns

- **Bento card hover:** `translateY(-1px)` + shadow deepens — 200ms standard ease. Feels like picking up a card.
- **Card entrance (page load):** Staggered fade-up. `opacity: 0 → 1`, `translateY: 8px → 0`. 300ms decelerate. 40ms stagger between cards. Left-to-right, top-to-bottom.
- **Tab / nav selection:** layoutId pill follows active item — 200ms snappy spring.
- **Modal open:** Scale from `0.96 → 1.0`, fade. 300ms decelerate.
- **Number roll (metrics):** CountUp animation on first render. 600ms. JetBrains Mono. No easing — linear roll, then spring snap to final value.
- **Toast/notification:** Slides in from bottom-right, 300ms decelerate. Auto-dismiss with progress bar.
- **Data refresh indicator:** Subtle pulse on the card border — `border-color` cycles through `rgba(37,99,235,0.2) → rgba(37,99,235,0.5) → rgba(37,99,235,0.2)` over 1200ms.

### Motion Do Not

- No bounce on content cards — only on interactive controls (buttons, toggles)
- No sequential entrance animations longer than 400ms total
- No looping animations unless they indicate live system state
- Always respect `prefers-reduced-motion` — cut all transforms and durations to 0ms

---

## 9. Visual Mood — UPDATED FOR LIGHT THEME

### Aesthetic Positioning

Broadr sits between **Apple's restraint** and **professional tool density**. It is lighter than a Bloomberg terminal, more information-rich than apple.com, and more characterful than Google Material.

The mood is: **a filmmaker's studio that's been redesigned by a systems architect.** Clean lines, quality materials, but everything has a purpose. There are no empty walls — every surface has a function.

### Visual References (what to extract from each, not copy)

- **Apple.com / visionOS** — spatial depth, frosted glass, light backgrounds, the way surfaces stack — but Broadr is denser and more operator-focused
- **Linear** — typographic precision, monochromatic restraint, subtle motion — but Broadr has more colour signal in the data
- **Vercel Dashboard** — dark data density (inverse it) — the grid structure and metric card logic
- **Craft** (the iOS app) — the grain texture, the glass card quality, the sense that the UI has material weight
- **DJI Fly / professional camera apps** — the confidence that professional tool UIs can have without being ugly. Information is king.

### What Makes Broadr Visually Distinctive (compared to Apple/Google)

1. **Grain** — the background texture. Apple is flat. Broadr has tactility.
2. **Typographic contrast** — the jump between JetBrains Mono data and Space Grotesk hero stats is intentional and striking.
3. **Accent discipline** — one accent colour (`#2563EB`) used at high confidence only. Everything else is neutral. When the blue appears, it means something.
4. **Glass variation** — three tiers of glass, each visually distinct. The layering reads as depth.
5. **Data is the art** — charts, sparklines, and metric numbers are treated as visual elements, not just functional readouts. They're sized and positioned with compositional intent.

---

## 10. Component-Level Colour Assignments

| Component | Background | Border | Text | Accent |
|---|---|---|---|---|
| Sidebar / Nav | `rgba(255,255,255,0.85)` + blur(24px) | `rgba(255,255,255,0.9)` | neutral-700 | accent-primary |
| Bento Card (active) | glass-tier-1 | as per tier | neutral-900 | — |
| Bento Card (hover) | glass-tier-1 hover | as per tier | neutral-900 | — |
| Input field | `#FFFFFF` | `#E5E7EB` → `#2563EB` on focus | neutral-900 | accent-primary |
| Button primary | `#2563EB` | none | `#FFFFFF` | — |
| Button secondary | `rgba(37,99,235,0.08)` | `rgba(37,99,235,0.2)` | `#2563EB` | — |
| Button ghost | transparent | transparent | neutral-700 | accent-primary on hover |
| Badge (positive) | accent-green-light | none | `#065F46` | — |
| Badge (warning) | accent-amber-light | none | `#92400E` | — |
| Badge (error) | accent-red-light | none | `#991B1B` | — |
| Badge (neutral) | `#F3F4F6` | none | neutral-500 | — |
| Table row hover | `rgba(37,99,235,0.04)` | — | neutral-900 | — |
| Active nav item | accent-primary-light | none | accent-primary | — |
| Tooltip | glass-tier-3 | as per tier | neutral-900 | — |
| Dropdown | glass-tier-3 | as per tier | neutral-900 | accent-primary on hover |
| Modal overlay | `rgba(15,17,23,0.4)` backdrop | — | — | — |

---

## 11. Do / Don't — UPDATED FOR LIGHT THEME

### Do

- Use `#F5F6F8` as the global background base — never pure white for the page canvas
- Layer all glass cards with the inset top highlight (`rgba(255,255,255,0.9)` inset) — this is what makes them feel like glass rather than frosted plastic
- Use the ambient gradient blooms behind the grid — subtle but critical for depth
- Apply the SVG grain texture — this is the differentiator from Apple/Google's sterile flatness
- Use Space Grotesk exclusively for hero metric numbers — the character contrast with Inter is intentional
- Keep `#2563EB` as the single accent colour; let the neutrals do most of the work
- Use JetBrains Mono for any value that is a code string, ID, or raw numeric table value
- Apply `prefers-reduced-motion` to all animations
- Maintain 3 tiers of glass — don't collapse them to one style
- Use the staggered card entrance animation on every page load
- Keep bento grid gap at exactly `16px` — it creates the right visual rhythm

### Don't

- Don't use pure `#FFFFFF` as the page background — it creates no depth for the glass to float against
- Don't use purple anywhere — reserved for VSS Command Centre
- Don't use more than one accent hue in a single view (no combining blue + teal + amber for decoration — only use amber/green/red for status signals)
- Don't use heavy drop shadows (`blur > 40px` on Tier 1) — this is a light theme, shadows should be light
- Don't make glass cards opaque — minimum 55% opacity on Tier 2, 72% on Tier 1
- Don't use decorative motion — every animation must be triggered by user action or system state change
- Don't use rounded corners below 14px on any card surface — Broadr is not a consumer app
- Don't use gradients on text (gradient text is a 2021 trend and conflicts with the precision brand)
- Don't use Tailwind's default blue (`#3B82F6`) for primary CTAs — use `#2563EB` which is one stop richer
- Don't clutter small bento cards with more than one metric — micro cards are for one number plus one delta

---

## 12. Design Brief Summary — REWRITTEN FOR LIGHT THEME

Broadr is a marketing operations platform built for an agency owner who shoots professional photo/video and runs paid media campaigns simultaneously. The UI is operator-focused — dense, precise, and built for daily professional use.

The visual system is built on a light, luminous foundation: a cool off-white background (`#F5F6F8`) overlaid with a barely-perceptible ambient gradient bloom and a fine grain texture. Over this, bento grid cards float as frosted white glass surfaces — three tiers of glassmorphism with distinct blur, opacity, and shadow values that create genuine visual depth without any dark surfaces. The light glass aesthetic is calibrated to feel more premium and more alive than Apple or Google's implementations: where they are flat, Broadr has grain; where they are sparse, Broadr has information density.

The accent colour system is deliberately minimal — a single rich blue (`#2563EB`) handles all interactive and state signals, supported by amber, green, and red only for operational status. Everything else is neutral. When blue appears in the interface, the operator notices — it means something requires action or has been selected.

Typography creates the interface's personality: Space Grotesk at large sizes for hero metrics gives the UI its cinematic weight; Inter handles all operational text with the reliability of a well-maintained workhorse; JetBrains Mono marks data strings and raw values with the precision of a professional instrument. The three fonts never compete — they each own their domain completely.

Motion is purposeful and fast. Cards enter the page on a 40ms stagger. Hover states lift cards 1px with a deepening shadow. Tab selections animate with a spring-following pill. Nothing moves without a reason. Reduced motion is always respected.

FORGE should approach every component as if it is a panel in a precision-engineered dashboard. Every element earns its position. The UI should feel like it was built by someone who understands both cinematic composition and systems engineering.

---

*Brief version 2.0 — Light theme. Approved direction. FORGE builds from this. No dark surfaces.*
