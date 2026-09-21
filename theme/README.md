# CRM Design Theme

A complete, copy-paste-ready design system extracted from the Bansal Geo CRM. Drop this `theme/` folder into any project to get identical fonts, colours, spacing, cards, buttons, and animations.

---

## Folder Structure

```
theme/
├── index.css        ← Single entry-point — import only this
├── tokens.css       ← All CSS custom properties (colours, type, radii, shadows)
├── reset.css        ← Box-sizing, body defaults, focus ring, reduced-motion
├── typography.css   ← Headings, font scales, text helpers
├── animations.css   ← Keyframes (rise / fade / grow-x) + utility classes
├── components.css   ← Cards, buttons, pills, tables, progress, checklist …
├── layout.css       ← App shell, sidebar, topbar, popovers, responsive breakpoints
├── modules.css      ← Feature-specific styles (follow-ups, quotations, reports …)
├── stageColors.js   ← JS colour map for pipeline stage pills
└── README.md        ← This file
```

---

## Quick Start

### 1. Add Google Fonts to your HTML `<head>`

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

### 2. Import the theme

**Plain HTML:**
```html
<link rel="stylesheet" href="./theme/index.css" />
```

**Bundler (Vite / webpack):**
```js
import './theme/index.css'
```

**Partial import (only what you need):**
```js
import './theme/tokens.css'
import './theme/reset.css'
import './theme/components.css'
// skip modules.css if you don't need the feature-specific styles
```

---

## Colour System

### Brand
| Token | Hex | Usage |
|-------|-----|-------|
| `--teal-700` | `#1f6f78` | Primary actions, active nav, links |
| `--teal-900` | `#0e4a52` | Hover state for primary |
| `--teal-50`  | `#eef7f7` | Teal tinted backgrounds |
| `--gold-500` | `#c8943a` | Accents, nav active edge, brand |
| `--gold-600` | `#b07d27` | Gold text on light backgrounds |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `--ink`     | `#0f2a3d` | Primary text |
| `--ink-2`   | `#4a5b68` | Secondary text |
| `--ink-3`   | `#7c8b96` | Muted / placeholder |
| `--bg`      | `#f4f7f8` | Page background |
| `--surface` | `#ffffff` | Cards, inputs |

### Status (semantic)
| Token | Hex | Meaning |
|-------|-----|---------|
| `--blue` / `--blue-bg`   | `#2f6fb3` / `#e6effa` | New / info |
| `--amber` / `--amber-bg` | `#c27a12` / `#fcf0dc` | In progress / attention |
| `--green` / `--green-bg` | `#2e9e6b` / `#e3f4ec` | Success / won |
| `--red` / `--red-bg`     | `#d24c47` / `#fbe5e4` | Danger / lost |

### Tone system
Apply a tone class to a parent to colour all child components that use `--tone` / `--tone-bg`:

```html
<div class="tone-info">     <!-- blue  -->
<div class="tone-attention"> <!-- amber -->
<div class="tone-urgent">   <!-- red   -->
<div class="tone-good">     <!-- green -->
<div class="tone-neutral">  <!-- grey  -->
```

---

## Typography

| Font | Variable | Usage |
|------|----------|-------|
| **Inter** (400 / 500 / 600) | `--font-sans` | Body, UI labels, buttons |
| **Fraunces** (500 / 600)    | `--font-serif` | Page headings, stat values, logo |

Base size: **14px**, line-height: **1.5**

---

## Key Component Classes

### Cards
```html
<div class="card">
  <div class="card-header">
    <h2>Card Title</h2>
    <div class="card-actions">...</div>
  </div>
</div>
```

### Stat (KPI) Cards
```html
<div class="stat-grid">
  <div class="card stat-card tone-good">
    <div class="stat-top">
      <div class="stat-icon"><!-- icon --></div>
      <h3>Revenue</h3>
    </div>
    <div class="stat-value">₹4.2L</div>
    <div class="stat-meta">...</div>
  </div>
</div>
```

### Buttons
```html
<button class="btn btn-primary">Save</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-success">Approve</button>
<button class="btn btn-small">Small</button>
<button class="btn btn-outline-danger">Cancel</button>
```

### Pills / Badges
```html
<span class="pill tone-good status-pill">Won</span>
<span class="pill tone-urgent status-pill">Overdue</span>
<span class="role-badge">Admin</span>
```

### Data Table
```html
<div class="table-wrap">
  <table class="data-table">
    <thead><tr><th>Name</th><th class="num">Amount</th></tr></thead>
    <tbody><tr><td>...</td><td class="num mono">₹1,200</td></tr></tbody>
  </table>
</div>
```

### Page Animations
```html
<!-- Add to page wrapper for staggered card entrance -->
<div class="page-anim">
  <div class="stat-grid">
    <div class="card stat-card">…</div>
    <div class="card stat-card">…</div>
  </div>
</div>
```

---

## Pipeline Stage Colours (JS)

```js
import { STAGE_COLORS } from './theme/stageColors.js'

const { bg, fg, dot } = STAGE_COLORS[lead.stage] ?? {}
// bg  → pill background
// fg  → pill text colour
// dot → dot indicator colour
```

Stages: `New Enquiry`, `Contacted`, `Qualified`, `Proposal Sent`, `Negotiation`, `Won`, `Lost`

---

## Responsive Breakpoints

| Breakpoint | Behaviour |
|------------|-----------|
| `≥ 1024px` | Full sidebar; collapses to icon rail with `.menu-toggled` |
| `< 1024px` | Sidebar becomes an off-canvas drawer |
| `< 760px`  | Module layouts go single-column |
| `< 640px`  | Search bar hidden; page header stacks vertically |
| `< 480px`  | Glance-figures grid tightens |

---

## Shape & Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--radius`    | `8px`  | Buttons, inputs, small cards |
| `--radius-lg` | `14px` | Main content cards |
| `--shadow`    | subtle 2-layer | Cards |
| `--chrome-height` | `68px` | Top bar height |
| `--sidebar-width` | `256px` (default) / `76px` (collapsed) | Layout grid |
