# TRYONITY HAUTE COUTURE — 1000% Ultra-Luxury UI/UX Design & Architecture Specification

**Document Version:** 2.0.0 (Luxury Overhaul Edition)  
**Target Architecture:** Next.js 14 App Router, TypeScript, Tailwind CSS, Google Vertex AI, Cloudinary, NextAuth.js v5  
**Aesthetic Vision:** Midnight Onyx & Champagne Gold (Haute Couture Minimalist Luxury)  
**Target Experience Score:** 10 / 10 (Production-Ready Executive & Retail Grade)

---

## Executive Summary & Aesthetic Pivot

Tryonity is evolving from its original Neobrutalist design into an **Ultra-Luxury, High-Fashion Virtual Try-On Platform ("Tryonity Haute Couture")**. 

This specification completely redesigns every single route, component, color token, typography choice, interaction state, and kiosk screen. The goal is to provide a UI/UX that feels like a cross between a high-end luxury fashion house (e.g., Saint Laurent, Chanel, Tom Ford) and an cutting-edge generative AI laboratory.

---

## 1. Global Luxury Design System & Design Tokens

### 1.1 Palette & Color Architecture

The luxury palette replaces harsh black borders and bright neon fills with a rich, dark-mode-first **Midnight Onyx** foundation paired with **Champagne Gold**, **Silk Ivory**, and **Warm Titanium** accents.

| Token Name | Hex Code | Purpose & Semantic Application |
| :--- | :--- | :--- |
| `luxury-obsidian` | `#08080a` | Deepest background for Kiosk screens, landing hero, and dark luxury overlays. |
| `luxury-charcoal` | `#0f0f13` | Dark mode surface background for content cards, navigation bars, and modals. |
| `luxury-surface-elevated` | `#18181f` | Elevated card surfaces, dropdowns, and active states. |
| `luxury-gold-primary` | `#d4af37` | Primary Champagne Gold metallic accent for main CTAs, active pills, and glows. |
| `luxury-gold-light` | `#f3e5ab` | Soft champagne tint for highlighted typography, subheadings, and badges. |
| `luxury-gold-hover` | `#e5c158` | Interactive hover state for champagne gold buttons and icons. |
| `luxury-silk-bg` | `#fbfbfa` | Silk Ivory light-mode background for customer mobile catalogues. |
| `luxury-silk-surface` | `#ffffff` | Pure white light-mode card surfaces and product containers. |
| `luxury-onyx-text` | `#111111` | Primary rich dark text for light-mode screens. |
| `luxury-muted-text` | `#8e8e93` | Muted subtitles, timestamps, and architectural labels. |
| `luxury-hairline` | `rgba(212, 175, 55, 0.2)` | Ultra-thin champagne gold borders (0.5px / 1px). |

---

### 1.2 Typography System

The font pairing merges classic haute couture serif elegance with clean geometric sans-serif controls.

- **Primary Display / Headlines:** *Cormorant Garamond* or *Cinzel* (Google Fonts)
  - Usage: Hero titles, brand titles, kiosk headings, product names (`font-serif`, `tracking-[0.15em]`, `uppercase`).
- **Body & Controls:** *Plus Jakarta Sans* or *Inter*
  - Usage: Navigation links, body paragraphs, form inputs, action buttons (`font-sans`, `tracking-wide`, `font-light` / `font-normal`).
- **Numeric & Code Displays:** *Space Mono* or *JetBrains Mono*
  - Usage: 6-Digit Session codes, prices, live countdown timers (`font-mono`, `tracking-[0.35em]`, `tabular-nums`).

---

### 1.3 Glassmorphism, Hairlines & Elevation Tokens

```css
/* Tailwind Configuration Additions (tailwind.config.ts) */
module.exports = {
  theme: {
    extend: {
      colors: {
        luxury: {
          obsidian: '#08080a',
          charcoal: '#0f0f13',
          elevated: '#18181f',
          gold: '#d4af37',
          'gold-light': '#f3e5ab',
          'gold-hover': '#e5c158',
          silk: '#fbfbfa',
          onyx: '#111111',
          muted: '#8e8e93',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Cinzel', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'luxury-gold': '0 10px 30px -10px rgba(212, 175, 55, 0.25)',
        'luxury-soft': '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        'luxury-glow': '0 0 50px rgba(212, 175, 55, 0.15)',
      },
      borderWidth: {
        'hairline': '0.5px',
      }
    }
  }
}
```

---

## 2. Page-by-Page Exhaustive Architecture & UI/UX Guidelines

### 2.1 Public Landing Page (`app/page.tsx`)

#### Visual & Aesthetic Experience
- **Theme:** Ambient Dark Mode (`bg-luxury-obsidian text-white`).
- **Hero Section:** Ambient background features a subtle floating golden particle mist. The main title is rendered in high-fashion serif: *"THE ART OF VIRTUAL FITTING"*, set in `text-6xl md:text-8xl font-serif tracking-[0.2em] font-extralight text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold-light to-luxury-gold`.
- **Navigation Header:** Floating glassmorphic header (`backdrop-blur-xl bg-luxury-obsidian/70 border-b border-luxury-gold/15 sticky top-0 z-50`). Features an elegant gold brand emblem and delicate gold foil text.

#### Components & Micro-Interactions
1. **Primary CTA Button (`"EXPERIENCE THE SHOWROOM"`):**
   - Solid champagne gold gradient background (`bg-gradient-to-r from-luxury-gold via-[#e5c158] to-luxury-gold`), text in dark onyx (`text-luxury-obsidian font-medium tracking-widest text-xs uppercase`), pill rounded (`rounded-full px-8 py-4`), with a soft golden outer shadow (`shadow-luxury-gold hover:scale-[1.02] transition-all duration-500`).
2. **Interactive 3D Lookbook Preview Card:**
   - Dark glass panel (`bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-3xl backdrop-blur-md p-8 shadow-2xl`). Image displays an elegant model with interactive hover shimmer (`group-hover:opacity-100 duration-700`).
3. **Showroom Metrics Bar:**
   - 3-column stats bar with hairline gold dividers (`divide-x divide-luxury-gold/20`). Displays metrics in elegant gold serif digits (*"99.4% Fitting Accuracy"*, *"0.8s Neural Latency"*, *"150+ Partner Boutiques"*).

---

### 2.2 Customer Showroom Catalogue (`app/shop/[slug]/page.tsx` & `CatalogueClient.tsx`)

#### Visual & Aesthetic Experience
- **Theme:** Silk Ivory Light Mode (`bg-luxury-silk-bg text-luxury-onyx`) with Champagne Gold Accents.
- **Header Banner:** Displays the boutique's title in `font-serif text-3xl md:text-4xl tracking-widest uppercase` above a delicate gold hairline underline. Includes a live green/gold indicator pill reading *"LIVE BOUTIQUE VIRTUAL STUDIO"*.

#### Key Components & Functionality
1. **Luxury Filter Ribbon:**
   - Horizontal scrollable ribbon (`scrollbar-none border-b border-black/5 py-4`).
   - Category chips (`All`, `Haute Couture`, `Tailored Suits`, `Evening Gowns`, `Silk Kurtas`) rendered as minimalist pill buttons. Active chip uses a solid black fill with white text (`bg-black text-white rounded-full px-6 py-2 text-xs tracking-widest uppercase shadow-md`), while inactive chips use delicate champagne gold borders (`border border-luxury-gold/30 hover:border-black`).
2. **Product Grid Layout:**
   - Responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 px-6 py-8`).
   - **Product Card (`.card-luxury`):**
     - Uses portrait aspect ratio (3:4) with clean white background and hairline shadow (`shadow-luxury-soft`).
     - Image container smoothly zooms on hover (`group-hover:scale-105 transition-transform duration-700 ease-out`).
     - Includes a floating top-right **Multi-Select Toggle**: A delicate circular button (`w-8 h-8 rounded-full border border-black/20 bg-white/80 backdrop-blur-sm`). When selected, fills with champagne gold and displays a checkmark.
3. **Floating Multi-Select Outfit Dock:**
   - When 1–3 items are selected, a sleek floating bottom sheet slides up (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/90 text-white backdrop-blur-2xl border border-luxury-gold/30 rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 animate-slide-up`).
   - Displays selected thumbnail circles with a gold border and a primary CTA: `"COMPOSE VIRTUAL LOOK (3 ITEMS) →"` (`bg-luxury-gold text-black rounded-full px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-luxury-gold-hover`).

---

### 2.3 Customer Product Detail View (`app/shop/[slug]/product/[id]/page.tsx`)

#### Visual & Aesthetic Experience
- **Layout:** Editorial magazine-style dual-column split (`max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12`).

#### Left Column (Gallery Showcase)
- Main display image inside a high-aspect ratio container with smooth subtle border (`rounded-2xl overflow-hidden border border-black/5 shadow-2xl`).
- Sub-gallery thumbnail carousel framed with thin gold borders.

#### Right Column (Garment Metadata & Actions)
- Category subtitle in gold tracking text (`text-luxury-gold font-sans text-xs tracking-[0.25em] uppercase`).
- Product title in `font-serif text-4xl lg:text-5xl font-light text-luxury-onyx mb-4`.
- Fabric & Material Craftsmanship details card.
- **Luxury Size Selector:** Horizontal row of minimal circular size badges (`XS` through `3XL`). Selected size features a gold background with black text and ambient shadow.
- **Primary CTA:** Full-width champagne gold pill button: `"TRY ON THIS PIECE IN STUDIO →"`.

---

### 2.4 Virtual Try-On Studio (`app/shop/[slug]/tryon/page.tsx` & `CameraCapture.tsx`)

#### Visual & Aesthetic Experience
- **Theme:** Translucent Dark Mode Studio (`bg-luxury-obsidian min-h-screen text-white`).

#### Dual Dropzone Studio Interface
- Left pane: **"PORTRAIT CAPTURE"** dropzone.
- Right pane: **"SELECTED COUTURE GARMENTS"** preview.
- **Dropzone Aesthetics:** Glassmorphic container (`bg-luxury-charcoal/40 border border-luxury-gold/20 rounded-3xl backdrop-blur-md hover:border-luxury-gold/50 transition-all p-8 flex flex-col items-center justify-center min-h-[420px]`).

#### Web Camera Studio Modal (`CameraCapture.tsx`)
- Clicking **"OPEN LIVE WEBCAM STUDIO"** launches a fullscreen dark modal.
- Viewfinder features a hairline golden framing grid to help shoppers center their pose.
- **Front Camera Mirroring:** Automatically applies `scale(-1, 1)` CSS transform for natural reflection.
- **3-2-1 Countdown:** Shutter activation triggers a countdown ring animation rendered in champagne gold text across the center.
- **Shutter Control:** Metallic gold circular shutter button with outer glowing ring (`w-20 h-20 rounded-full border-2 border-luxury-gold bg-luxury-gold/20 flex items-center justify-center hover:scale-105 transition-all`).

---

### 2.5 Session Tracker Screen (`app/shop/[slug]/session/page.tsx` & `session-multi`)

#### Visual & Aesthetic Experience
- Centered luxury card set against a deep obsidian background with ambient golden radial glow (`bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-luxury-gold/10 via-luxury-obsidian to-luxury-obsidian`).

#### Key UX Elements
1. **Status Badge:**
   - **Processing State:** A subtle spinning double-ring in champagne gold with text *"Crafting Your Couture Render..."*.
   - **Done State:** Translucent green/gold badge with a tick mark and *"Renders Completed"*.
2. **The 6-Digit Session Code Display:**
   - Housed inside a dark glass vault card (`bg-luxury-charcoal/80 border border-luxury-gold/40 rounded-3xl px-10 py-8 shadow-luxury-glow backdrop-blur-xl text-center`).
   - Code text rendered in **Champagne Gold Foil Gradient** (`text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold-light via-luxury-gold to-luxury-gold-hover font-mono tracking-[0.4em] text-5xl font-bold select-all`).
3. **Showroom Kiosk Guidance:**
   - Displays clear serif instruction: *"Enter this code on the showroom display terminal to reveal your lookbook."*
4. **Live Expiry Timer:**
   - Sleek golden countdown pill (`border border-luxury-gold/30 text-luxury-gold-light text-xs tracking-widest px-4 py-2 rounded-full`).

---

### 2.6 Showroom Kiosk Screen (`app/kiosk/page.tsx`)

The Showroom Kiosk is the primary physical touchpoint in the store. It operates as a full-screen, dark-mode display (`w-screen h-screen bg-luxury-obsidian fixed inset-0 overflow-hidden`).

```
+-----------------------------------------------------------------------------------+
|                   TRYONITY HAUTE COUTURE — KIOSK SCREEN (/kiosk)                  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                           TRYONITY HAUTE COUTURE                                  |
|                         Neural Virtual Fitting Studio                             |
|                                                                                   |
|          +--------------------------+    |    +-----------------------------+     |
|          |                          |    |    |     ENTER 6-DIGIT CODE      |     |
|          |   +------------------+   |    |    |                             |     |
|          |   |   GOLD EMBEDDED  |   |    |    |    +-------------------+    |     |
|          |   |     QR CODE      |   |    |    |    |  4  8  2   9  1  0 |    |     |
|          |   |                  |   |    |    |    +-------------------+    |     |
|          |   +------------------+   |    |    |                             |     |
|          |   📱 SCAN TO BROWSE      |    |    |   [ REVEAL LOOKBOOK (->) ]  |     |
|          +--------------------------+    |    +-----------------------------+     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

#### 4 Reactive Kiosk States

##### 1. Idle State (`IdleState`)
- **Brand Title:** Top champagne gold logo icon with serif header *"TRYONITY HAUTE COUTURE"* (`tracking-[0.3em] uppercase text-xs text-luxury-gold`).
- **Left Panel (QR Scanner Card):**
  - Crisp white card framed by a 1px gold outline (`bg-white p-6 rounded-3xl shadow-luxury-glow border border-luxury-gold/40`).
  - Houses the 200x200px generated boutique QR code.
  - Subtitle: *"Scan to open catalogue on your smartphone"*.
- **Right Panel (6-Digit Terminal Input):**
  - Dark glass container with 6 input indicator pills.
  - Typing highlights input fields with golden neon outlines.
  - Primary button: `"REVEAL LOOKBOOK →"` ignites in solid champagne gold (`bg-luxury-gold text-luxury-obsidian font-medium tracking-widest text-lg rounded-full py-5 shadow-luxury-gold`) once 6 digits are entered.

##### 2. Processing State (`ProcessingState`)
- **Liquid Gold Particle Loader:** Central spinning double-ring in champagne gold.
- **Typography:** Serif title *"Synthesizing Neural Fitting..."* above a muted countdown indicator (*"Estimated time: ~8 seconds"*).

##### 3. Result State (`ResultState` - Multi-Look Gallery)
- **Fullscreen Gallery Carousel:** High-resolution edge-to-edge look display (`object-contain max-h-screen`).
- **Navigation Controls:** Circular glassmorphic arrow buttons with gold hover rings.
- **Top Badge:** Floating pill reading *"LOOK 1 OF 3 — COUTURE COMPOSITE"*.
- **Bottom Control Bar:** Dark glass pill containing the session code, remaining time countdown, and dual CTAs:
  1. `"TRY ANOTHER LOOK"` (Gold secondary button).
  2. `"SEND TO PHONE / POS CHECKOUT"` (Gold gradient primary button).

##### 4. Error State (`ErrorState`)
- Minimalist gold alert emblem with text *"Session code expired or not found"* and a sleek `"TRY AGAIN"` button.

---

### 2.7 Showroom Owner Dashboard Suite (`app/dashboard/*`)

#### Visual & Aesthetic Experience
- **Theme:** Professional Executive Dark Mode (`bg-luxury-obsidian text-white`).
- **Stat Cards Grid:** 3 elevated dark glass cards with gold hairline borders (`bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-3xl p-6 shadow-xl`):
  1. **Total Catalogue Products:** Gold serif numeral.
  2. **Active Try-On Sessions:** Ambient glowing indicator.
  3. **Try-Ons Completed Today:** Performance meter.
- **QR Code Exporter (`/dashboard/shop`):**
  - Renders the shop QR code on a luxury printable template featuring the boutique's name, champagne gold borders, and a high-resolution PNG download action button.

---

## 3. Step-by-Step Implementation Guide for Developers & MCP Agents

### Step 1: Update Font Imports in `app/layout.tsx`
Add Google Fonts for **Cormorant Garamond**, **Plus Jakarta Sans**, and **Space Mono**:

```tsx
import { Cormorant_Garamond, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google'

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700'] 
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'] 
})

const spaceMono = Space_Mono({ 
  subsets: ['latin'], 
  variable: '--font-mono',
  weight: ['400', '700'] 
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable} ${spaceMono.variable}`}>
      <body className="font-sans bg-luxury-obsidian text-white antialiased">
        {children}
      </body>
    </html>
  )
}
```

### Step 2: Global CSS Utilities (`app/globals.css`)
Replace Neobrutalist classes with Luxury Glassmorphism & Gold Gradient utilities:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .gold-gradient-text {
    @apply text-transparent bg-clip-text bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#e5c158];
  }

  .btn-luxury-gold {
    @apply bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#d4af37] text-[#08080a] font-sans font-medium text-xs uppercase tracking-[0.2em] rounded-full px-8 py-4 shadow-luxury-gold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300;
  }

  .btn-luxury-glass {
    @apply bg-white/5 backdrop-blur-md border border-[#d4af37]/30 text-white font-sans text-xs uppercase tracking-[0.2em] rounded-full px-8 py-4 hover:border-[#d4af37] hover:bg-white/10 transition-all duration-300;
  }

  .card-luxury-glass {
    @apply bg-[#0f0f13]/60 backdrop-blur-xl border border-[#d4af37]/20 rounded-3xl shadow-2xl;
  }
}
```

---

## 4. Verification & QA Checklist

- [x] All 4px solid black borders removed and replaced with 0.5px/1px champagne gold or translucent hairlines.
- [x] Font hierarchy correctly applies *Cormorant Garamond* for titles and *Plus Jakarta Sans* for controls.
- [x] Kiosk screen (`/kiosk`) transitions cleanly between all 4 reactive states in dark mode.
- [x] Mobile web catalogue (`/shop/[slug]`) offers multi-selection up to 3 garments with the floating gold outfit dock.
- [x] Camera capture (`CameraCapture.tsx`) features front camera mirroring and 3-2-1 countdown ring animation.
- [x] Session tracker displays the 6-digit code in monospaced gold foil gradient text.

---

*Tryonity Haute Couture Specification v2.0.0 — Ultimate Luxury Release*
