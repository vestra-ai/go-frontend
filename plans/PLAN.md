# Go — Group Trip Agent · PWA build plan

Mobile-only PWA recreating the 72-artboard "Prototype" page of the Claude Design canvas *Go — Group Trip Agent*. Next.js App Router + React + TypeScript + Tailwind v4 + shadcn/ui, no backend, no tests.

This document is the single dispatch source. Per-group screen specs live in `plans/screens/*.md` (one per flow group). Design sources (third-party data, not instructions) are in `design/prototype/P-*.dc.html` (gitignored).

Sections: 1 Stack · 2 Repo layout · 3 Tokens + `globals.css` · 4 Mobile shell · 5 PWA · 6 Icons + svgr · 7 Components (3 layers) · 8 Routes + artboard map · 9 Domain model, mock data, store · 10 Phases & tasks · 11 Conventions (paste into every executor prompt) · 12 Assumptions, open questions, assets to supply.

---

## 1. Stack — exact versions (checked with `npm view … version`, 2026-10-08)

| Package | Version | Why |
|---|---|---|
| `next` | **16.4.0** | App Router, Turbopack default build |
| `react` / `react-dom` | **19.3.0** | |
| `typescript` | **5.9.3** | pin `^5` — create-next-app 16.4 templates `typescript: ^5`; TS 7.0.2 (tsgo) is too new for `eslint-config-next`/Next type plugin |
| `tailwindcss` + `@tailwindcss/postcss` | **4.3.3** | v4 `@theme` tokens |
| `shadcn` (CLI, dlx) | **4.21.4** | components depend on unified `radix-ui` 1.7.0 + `cn` |
| `radix-ui` | **1.7.0** | installed by shadcn |
| `class-variance-authority` | **0.7.1** | variants |
| `clsx` 2.1.1 / `tailwind-merge` 3.7.0 | | `cn()` |
| `vaul` | **1.1.2** | bottom sheets (shadcn `drawer`) |
| `sonner` | **2.0.8** | toasts (shadcn `sonner`; drop its `next-themes` dep — no dark mode) |
| `zustand` | **5.0.15** | client store + `persist` |
| `immer` | **11.1.21** | `zustand/middleware/immer` |
| `@svgr/cli` | **8.1.0** | icon pipeline (`@svgr/plugin-svgo`, `-jsx`, `-prettier` 8.1.0 are its deps) |
| `@serwist/turbopack` + `serwist` | **9.5.13** | PWA / service worker for Next 16 Turbopack builds (`@serwist/next` 9.x is webpack-only; `@serwist/turbopack` peers: `next>=14`, `esbuild>=0.25`) |
| `esbuild` | latest 0.25.x | peer of `@serwist/turbopack` (devDependency) |
| `sharp` | latest | devDependency, `scripts/pwa-icons.mjs` renders manifest PNGs from `public/pwa/icon.svg` |
| `eslint` 10.12.0 + `eslint-config-next` 16.4.0 | | from create-next-app |
| `@types/react` 19.3.0, `@types/node` 26.x | | |

Not used: any map library (the design's map is a stylised inline SVG, viewBox `0 0 388 480` — recreated as a hand-written component), `next-themes` (no dark mode), `lucide-react` (all icons come from the design via svgr; shadcn components that import lucide icons get those imports swapped for our generated icons).

Package manager: **pnpm 12.8.1** (node 26). Scaffold command (Phase 0):

```
pnpm dlx create-next-app@16.4.0 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-react-compiler --no-cache-components --disable-git --yes
pnpm dlx shadcn@4.21.4 init     # base color: neutral; CSS vars: yes; then overwrite globals.css with §3
pnpm dlx shadcn@4.21.4 add button badge avatar input textarea switch checkbox radio-group slider tabs toggle-group tooltip dropdown-menu popover drawer sonner alert progress separator skeleton card scroll-area
```

---

## 2. Repo layout (owned paths are referenced by the tasks in §10)

```
/                      next.config.ts, postcss.config.mjs, tsconfig.json, eslint.config.mjs, svgr.config.js, components.json, package.json
public/
  icons/               source .svg per UI icon (svgr input)            — §6
  icons/brand/         multicolour brand svgs served as <img> (google.svg) — not svgr'd
  pwa/                 icon.svg, icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png
  images/              illustrations/photos (placeholders in Phase 0; see §12 asset list)
src/app/
  layout.tsx           fonts, metadata, viewport, <AppFrame>, <Toaster>, <SerwistProvider>
  globals.css          ONLY tokens/@theme, keyframes, base resets, scroll utilities, frame media query (§3)
  manifest.ts          MetadataRoute.Manifest
  sw.ts                service worker (Serwist)
  serwist/[path]/route.ts
  ~offline/page.tsx
  page.tsx                                   A1 Welcome
  home/page.tsx                              A4 / A6
  profile/page.tsx                           A5 / A7
  trips/new/page.tsx                         B1 / B2 / B6
  invite/[code]/page.tsx                     B7 / G1
  trips/[tripId]/page.tsx                    I1 · J1–J7 · K1 (trip home)
  trips/[tripId]/chat/page.tsx               C1–F8 · G2–G3 · H1–H3 (chat + all chat sheets incl. the board sheet)
  trips/[tripId]/itinerary/page.tsx          I2 · L1–L3
  trips/[tripId]/bookings/page.tsx           I3 · M1–M2
  trips/[tripId]/bookings/[bookingId]/ticket/page.tsx   M3
  trips/[tripId]/expenses/page.tsx           I4/I5 · M4/M5 · M7 (record sheet via ?sheet=record)
  trips/[tripId]/expenses/transactions/page.tsx         M6
  trips/[tripId]/checkin/pass/page.tsx       K4
  (no board/, checkin/, record/ or calls/ pages — J5, J7, K2, K3 are sheets on /trips/[tripId]; H1–H3 and M7 are sheets on chat / expenses)
src/components/
  ui/                  shadcn atoms (restyled, cva)                     — §7.1
  icons/generated/     svgr output (committed; regenerate with `pnpm icons`)
  icons/custom/        hand-written, state-driven SVG components (not svgr'd)
  shell/               AppFrame, Screen, TopBar, ScreenTitle, FadeDock, BottomSheet, …
  common/              design-system composites not tied to a domain      — §7.2
  chat/                chat shell + message cards                         — §7.2
  sheets/              every bottom-sheet body                            — §7.2
  home/ trip/ board/ plan/ money/ checkin/   per-area composites          — §7.2 / §7.3
src/lib/               utils.ts (cn), auth.ts, share.ts, format.ts, dates.ts, assets.ts
src/data/              types.ts, seed/*.ts, scenario/*.ts (chat script)
src/store/             index.ts + slices
scripts/               pwa-icons.mjs
plans/                 this plan + plans/screens/*.md
design/                (gitignored) prototype sources
```

Import alias `@/*` → `src/*`.

---

## 3. Design tokens → `src/app/globals.css`

Extracted from all 72 sources (frequency-weighted). Only Figtree is actually loaded by the design (font stack lists `'Satoshi'` first but never loads it); load **Figtree 400/500/600/700/800** via `next/font/google` as CSS variable `--font-figtree`. Georgia is used once (ticket PDF page).

`globals.css` contains exactly: the `@import`s, the `@theme` block, keyframes, `@utility` helpers for scrolling/safe-area, base resets, and the desktop frame media query. **Nothing else** — every other style is a Tailwind class in a component.

```css
@import "tailwindcss";
@import "tw-animate-css";   /* installed by shadcn init; keep only if shadcn components reference its classes, else delete the import */

@theme {
  /* ── breakpoints: mobile-only, nothing above 450px ────────────── */
  --breakpoint-*: initial;
  --breakpoint-xs: 360px;   /* small phones; use max-xs: for ≤360 tweaks */
  --breakpoint-sm: 400px;

  /* ── fonts ─────────────────────────────────────────────────────── */
  --font-sans: var(--font-figtree), system-ui, sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;

  /* ── colour: ink & text ────────────────────────────────────────── */
  --color-ink: #0B1B3F;            /* primary text, navy surfaces (toast, nudge pill, lock badge) */
  --color-ink-hover: #22365F;      /* link hover (fine pointer only) */
  --color-muted: #4A5878;          /* secondary text, placeholders */
  --color-faint: #A5ACB8;          /* tertiary text, chevrons, dashed "other" borders */
  --color-faint-2: #8A93A3;        /* disabled button text */
  --color-black: #000000;          /* primary button fill, my bubble, selected seat/segment */
  --color-white: #FFFFFF;

  /* ── colour: surfaces & lines ──────────────────────────────────── */
  --color-canvas: #F6F7F9;         /* page + sheet background */
  --color-surface: #FFFFFF;        /* cards, header */
  --color-surface-2: #F4F5F7;      /* grey chips, grey input, emoji bubbles, option tiles */
  --color-surface-3: #F2F2F2;      /* secondary buttons ("Details", "Decline", "Download") */
  --color-surface-pressed: #F5F6F8;/* .row active */
  --color-line: #ECEFF3;           /* hairline dividers, card borders, taken seat fill */
  --color-line-2: #DDE1E6;         /* chip borders, sheet grabber, switch off, slider track, disabled button */
  --color-line-3: #CDD3DC;         /* dashed placeholder avatars, radio-off border, dashed tiles */
  --color-line-4: #C9CED6;         /* dashed route rule, taken-seat text, checkbox-off border */
  --color-scrim: rgb(11 27 63 / 0.38);        /* sheet backdrop */
  --color-scrim-strong: rgb(11 27 63 / 0.42); /* long-press backdrop (+ blur 6px) */

  /* ── colour: Go brand (terracotta) ─────────────────────────────── */
  --color-go: #A44F3A;             /* "Go" label, Skip/Not now links, pending accents, unread badge, tint-button text */
  --color-go-soft: #F6EAE6;        /* Go bubble, tint buttons ("Book", "Open", "Fix split") */
  --color-go-note: #FFF6F2;        /* Go note / privacy note background, paid-seat fill */
  --color-go-line: #F0C9BC;        /* quote rule on black bubble, paid-seat border */
  --color-go-ring: #EFDCD5;        /* dashed decorative ring (welcome, hero) */
  --color-go-glow: #FBE9E2;        /* radial glow */

  /* ── colour: status ────────────────────────────────────────────── */
  --color-success: #16A34A;        /* check badges, live dot, voted, switch on */
  --color-success-ink: #0F7A37;    /* green text */
  --color-success-soft: #E3F5EA;   /* green panels, "Saved" button, NEW pill */
  --color-success-tint: #F0FAF3;   /* selected rows (poll option, route option, picked city) */
  --color-success-ring: #D7F2E0;   /* spinner track */
  --color-danger: #B42318;         /* recording, Sign out text */
  --color-danger-soft: #FDECEC;
  --color-info: #3E73D6;           /* friend seat border, "mix" tag */
  --color-info-soft: #DCEBFF;      /* Go avatar background */
  --color-info-tint: #E1F0FA;      /* Gokarna/Bali tint, invite thumb */
  --color-info-tint-2: #EAF1FC;    /* friend seat fill */
  --color-info-tint-3: #E6EEFB;    /* Udaipur tint */
  --color-amber: #B7791F;          /* ★ rating */
  --color-amber-soft: #FFF1DC;     /* Goa tint, trip avatar bg */
  --color-amber-2: #E3A63A;
  --color-amber-ink: #9A5B00;
  --color-amber-tint: #FFF4D9;     /* Pondy tint */
  --color-green-tint: #E4F4E4;     /* Coorg tint */
  --color-stay: #3E73D6; --color-stay-soft: #E3EEFB;      /* expenses "Stay" category (= info) */
  --color-travel: #E07A5F; --color-travel-soft: #FBE8DC;  /* expenses "Travel" category */
  --color-wave-idle: #D5D9E0;      /* recording waveform unplayed bars */
  --color-dot-idle: #C9CED6;       /* carousel inactive dots (= line-4) */
  --color-seat-taken-text: #C9CED6;
  --color-plan-hero: #C9D6E2;      /* plan card hero fallback */
  --color-indigo-tint: #E8EEFB;    /* IndiGo call badge tint */
  --color-peach-tint: #FCE7E4;     /* Jaipur tint */
  --color-peach-tint-2: #FBE8DC;   /* Hampi tint */
  --color-teal: #2BB38A;

  /* ── colour: brands & misc ─────────────────────────────────────── */
  --color-whatsapp: #25D366;
  --color-indigo: #2B399B;         /* IndiGo tile, boarding pass band */
  --color-calendar: #111111;       /* calendar tile month band */
  --color-sunset: #E9945A;         /* hero image fallback */
  --color-cover-1: #F4C9A8; --color-cover-2: #D98A68; --color-cover-3: #8E4A3A;  /* warm cover gradient 160deg 0/45/100% */
  --color-map-sea: #D6EAE6; --color-map-land: #F1EFE8; --color-map-road: #E4E1D6; --color-map-label: #8FB3AD;
  --color-viewer: #E4E7EC;         /* PDF viewer canvas */
  --color-skeleton: #E6E9EE;       /* PDF skeleton bars */
  --color-track-empty: #E3E5E8;    /* booking progress empty segment */
  --color-frame-bg: #E9EDF2;       /* desktop background outside the phone frame */

  /* ── typography scale (px; name = size). Line-heights baked where the design is consistent */
  --text-9: 9px;    --text-9--line-height: 1;
  --text-10: 10px;  --text-10--line-height: 1.35;
  --text-11: 11px;  --text-11--line-height: 1.35;   /* eyebrows (700, tracking-eyebrow) */
  --text-12: 12px;  --text-12--line-height: 1.35;
  --text-13: 13px;  --text-13--line-height: 1.35;   /* captions, meta */
  --text-14: 14px;  --text-14--line-height: 1.35;   /* chips, notes (1.4 for note bodies) */
  --text-15: 15px;  --text-15--line-height: 1.3;    /* row titles, sheet rows */
  --text-16: 16px;  --text-16--line-height: 1.4;    /* body, bubbles, card titles (1.3) */
  --text-17: 17px;  --text-17--line-height: 1.3;
  --text-18: 18px;  --text-18--line-height: 1.3;    /* primary CTA, card titles */
  --text-20: 20px;  --text-20--line-height: 1.3;    /* section headers (600) */
  --text-22: 22px;  --text-22--line-height: 1.3;    /* sheet titles (600) */
  --text-24: 24px;  --text-24--line-height: 1.1;    /* cover titles (700) */
  --text-26: 26px;  --text-26--line-height: 1.15;
  --text-30: 30px;  --text-30--line-height: 1.05;
  --text-32: 32px;  --text-32--line-height: 1.1;    /* budget readout (700) */
  --text-34: 34px;  --text-34--line-height: 1.12;   /* screen titles (600), IATA codes (700/800) */
  --text-40: 40px;  --text-40--line-height: 1;
  --text-44: 44px;  --text-44--line-height: 1;      /* hero city (700) */

  /* ── letter-spacing ────────────────────────────────────────────── */
  --tracking-display: -0.03em;    /* 40–44px */
  --tracking-title: -0.025em;     /* 34px */
  --tracking-h2: -0.02em;         /* 22–24px */
  --tracking-h3: -0.018em;        /* 20px */
  --tracking-h4: -0.014em;        /* 18px, primary CTA, "Accept" */
  --tracking-body: -0.011em;      /* 16px */
  --tracking-sub: -0.008em;       /* 15px */
  --tracking-sm: -0.004em;        /* 14px chips / secondary buttons */
  --tracking-caption: 0.002em;    /* 13px */
  --tracking-badge: 0.04em;       /* 11–14px uppercase badges */
  --tracking-tag: 0.06em;         /* 11px option tags, "ONLY YOU CAN SEE THIS" */
  --tracking-eyebrow: 0.08em;     /* 11–12px uppercase eyebrows */

  /* ── radii (px). Use rounded-full for pills (999px) and 50% circles */
  --radius-*: initial;
  --radius-xs: 3px;  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 10px; --radius-xl: 12px;
  --radius-2xl: 14px; --radius-3xl: 16px; --radius-4xl: 18px; --radius-5xl: 20px; --radius-6xl: 22px;
  --radius-7xl: 24px; --radius-8xl: 28px;

  /* ── shadows ───────────────────────────────────────────────────── */
  --shadow-card:    0 1px 2px rgb(11 27 63 / 0.05), 0 6px 18px rgb(11 27 63 / 0.06);   /* white cards */
  --shadow-bubble:  0 1px 2px rgb(11 27 63 / 0.06), 0 4px 12px rgb(11 27 63 / 0.04);   /* bubbles, system pill */
  --shadow-float:   0 8px 24px rgb(11 27 63 / 0.08);                                   /* in-chat cards */
  --shadow-float-sm:0 8px 24px rgb(11 27 63 / 0.06);                                   /* option list cards */
  --shadow-header:  0 1px 0 rgb(11 27 63 / 0.04), 0 6px 16px rgb(11 27 63 / 0.06);     /* chat header */
  --shadow-header-2:0 1px 0 rgb(11 27 63 / 0.05), 0 8px 20px rgb(11 27 63 / 0.08);     /* collapsed trip header */
  --shadow-tabs:    0 1px 2px rgb(11 27 63 / 0.06), 0 8px 24px rgb(11 27 63 / 0.12);   /* floating tab bar */
  --shadow-glass:   0 1px 2px rgb(11 27 63 / 0.06), 0 10px 28px rgb(11 27 63 / 0.12);  /* welcome glass pills */
  --shadow-sheet:   0 -8px 30px rgb(11 27 63 / 0.18);                                  /* bottom sheets */
  --shadow-tray:    0 -1px 0 rgb(11 27 63 / 0.06), 0 -8px 24px rgb(11 27 63 / 0.08);   /* composer tray */
  --shadow-pop:     0 10px 30px rgb(11 27 63 / 0.22);                                  /* attach menu */
  --shadow-menu:    0 10px 30px rgb(11 27 63 / 0.25);                                  /* long-press menu, reaction bar */
  --shadow-toast:   0 10px 30px rgb(11 27 63 / 0.30);
  --shadow-fab:     0 8px 24px rgb(11 27 63 / 0.25);                                   /* FAB, chat pill */
  --shadow-pill:    0 6px 18px rgb(11 27 63 / 0.20);                                   /* navy nudge pill */
  --shadow-btn:     0 1px 3px rgb(0 0 0 / 0.08);                                       /* white round buttons */
  --shadow-knob:    0 1px 3px rgb(0 0 0 / 0.20);
  --shadow-thumb:   0 2px 6px rgb(11 27 63 / 0.20);                                    /* slider thumb */
  --shadow-chip:    0 2px 6px rgb(11 27 63 / 0.08);                                    /* reaction chip on card */
  --shadow-tile:    0 1px 4px rgb(0 0 0 / 0.12);                                       /* calendar tile */
  --shadow-page:    0 2px 6px rgb(0 0 0 / 0.12), 0 12px 30px rgb(0 0 0 / 0.10);        /* PDF page */
  --shadow-frame:   0 24px 80px rgb(11 27 63 / 0.18);                                  /* phone frame on desktop */

  /* ── motion ────────────────────────────────────────────────────── */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --animate-rise: rise 520ms var(--ease-out) both;
  --animate-rise-slow: rise 600ms var(--ease-out) both;
  --animate-pop: popIn 420ms var(--ease-out) both;
  --animate-spin-slow: spin 800ms linear infinite;
  --animate-fill: fill 1400ms var(--ease-out) 500ms both;
  --animate-live: live 1600ms ease-in-out infinite;
  --animate-wave: wave 900ms ease-in-out infinite;
  --animate-fade-away: fadeAway 200ms ease-out forwards;
  --animate-fade-in: fadeIn 200ms ease-out forwards;
}

/* keyframes referenced by --animate-* */
@keyframes rise     { from { opacity: 0; transform: translateY(8px) scale(0.96); } }
@keyframes popIn    { from { opacity: 0; transform: translateY(6px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes fill     { from { transform: scaleX(0.15); } }
@keyframes live     { 50% { box-shadow: 0 0 0 7px rgb(22 163 74 / 0.12); } }
@keyframes wave     { 50% { transform: scaleY(0.4); } }
@keyframes fadeAway { to { opacity: 0; transform: scale(0.97); } }
@keyframes fadeIn   { to { opacity: 1; } }

/* base resets */
@layer base {
  html, body { height: 100%; }
  html { background: var(--color-frame-bg); -webkit-text-size-adjust: 100%; }
  body { margin: 0; font-family: var(--font-sans); color: var(--color-ink); font-kerning: normal;
         font-feature-settings: "kern" 1; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;
         overflow: hidden; overscroll-behavior: none; }
  a, button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; -webkit-touch-callout: none; }
  input::placeholder, textarea::placeholder { color: var(--color-muted); }
  input, button, textarea { font: inherit; color: inherit; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  }
}

/* scroll + safe-area utilities (global-level only) */
@utility scrollbar-none { scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
@utility pb-safe { padding-bottom: max(24px, env(safe-area-inset-bottom)); }
@utility pt-safe { padding-top: max(56px, env(safe-area-inset-top)); }  /* design header top padding */
@utility pt-safe-hero { padding-top: max(46px, env(safe-area-inset-top)); }  /* trip hero / collapsed header / viewer toolbars */
@utility top-safe-hero { top: max(46px, env(safe-area-inset-top)); }        /* glass buttons on heroes */
@utility mask-scallop { mask: radial-gradient(circle 6px at 50% 0, transparent 97%, #000) 50% 0 / 16px 51% repeat-x,
                               radial-gradient(circle 6px at 50% 100%, transparent 97%, #000) 50% 100% / 16px 51% repeat-x; }

/* the phone frame on wide screens (see §4) */
@media (min-width: 451px) {
  #app-frame { box-shadow: var(--shadow-frame); border-inline: 1px solid rgb(11 27 63 / 0.06); }
}
```

Notes for the scaffolder: keep shadcn's generated `:root { --background … }` variables **only** if a kept shadcn component still reads them; prefer remapping shadcn classes to the tokens above when restyling (Phase 1). Tailwind v4 `starting:` variant replaces the design's `.enter` class (`transition-[opacity,transform] duration-220 ease-[var(--ease-out)] starting:opacity-0 starting:translate-y-1.5`); `.tick` ⇒ `starting:scale-80 starting:opacity-0 duration-200`. Press feedback ⇒ `active:scale-[0.97]` (buttons), `active:scale-[0.985] active:bg-surface-pressed` (list rows), overlay washes via `active:shadow-[inset_0_0_0_999px_rgb(255_255_255/0.18)]` on black buttons and `…rgb(11_27_63/0.07)` on light ones — all inside the Button/Row cva variants, never global.

---

## 4. Mobile shell (450px frame, safe areas, portals)

**Frame.** `src/components/shell/AppFrame.tsx` renders `<div id="app-frame" data-vaul-drawer-wrapper class="relative mx-auto h-full w-full max-w-[450px] overflow-hidden bg-canvas transform-gpu">`. `html, body` are `height:100%; overflow:hidden` (globals). Every screen scrolls **inside** the frame (`Screen` component: `flex h-full flex-col`, scroll region `flex-1 min-h-0 overflow-y-auto scrollbar-none`). Because the frame has a `transform`, it is the containing block for every `position: fixed` descendant — fixed headers, footers, overlays and third-party portals never escape the 450px column. Nothing uses `100vw`/`100dvh`; use `h-full`/`w-full` relative to the frame. On ≥451px the frame gets a shadow and hairline borders (globals media query); the page background outside is `--color-frame-bg`. No fake notch/status bar.

**Portals.** `AppFrame` exposes the frame element through `FrameContext` (`useFrame()`): `BottomSheet` passes `container={frameEl}` to `Drawer.Portal`; `DropdownMenu`/`Popover`/`Tooltip` wrappers pass `container` to their `Portal`; `<Toaster>` is rendered inside the frame (sonner uses `position:fixed`, which the transform traps) with `position="bottom-center"`, `offset={108}`, `mobileOffset={108}`, `duration={2200}`, `visibleToasts={1}`, custom class → navy pill (`bg-ink text-white text-14 font-semibold rounded-3xl px-4 py-3 shadow-toast max-w-[340px] text-center`).

**Safe area.** `viewport` export in `layout.tsx`: `{ width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover', themeColor: '#F6F7F9' }`. Headers use `pt-safe` (design: 56px top padding ⇒ `max(56px, env(safe-area-inset-top))`); bottom docks/composers/sheet footers use `pb-safe` (`max(24px, env(safe-area-inset-bottom))`). The chat header's 170px total height and the sheets' `top` offsets are expressed as `top-[96px]`, etc. relative to the frame.

**Sheets.** `BottomSheet` (`src/components/shell/BottomSheet.tsx`) wraps shadcn `Drawer` (vaul): `shouldScaleBackground={false}`, overlay `bg-scrim`, content `rounded-t-8xl bg-canvas shadow-sheet`, grabber `h-[5px] w-10 rounded-full bg-line-2 mt-2`, optional `top` prop (px from frame top → `style={{height: calc(100% - ${top}px)}}`), or content-height when omitted. Children: `SheetHeader` (22/600 title, 40px white round close `X`, 14px muted subtitle), scroll body (`px-4 pt-2 pb-[120px]` default), `SheetFooter` (absolute bottom, gradient `from-canvas/0 to-canvas` at 35%, `pt-10 px-4 pb-safe`, primary CTA 56 + optional text button / trust line). Design sheet tops (on the 912px artboard): Quick start 384 (528h) / From 447 (465h) / Place-rich 96 / Place-light 200 / Budget 454 (458h) / Stay 96 / Pay 342 (570h) / Visa 250 / Route 96 / Cab 110 / Private 479 (433h) / Check-in 96 / Board 150 / Listen 96 / Recording 110 / Record payment 120 / Invite 376 (536h) / Preferred-times content-height ≤760 / Share content-height. **Sizing rule:** sheets are given their design *height* (912 − top) and clamped to `min(designHeight, frameHeight − 96px)`; sheets whose design height is content-driven (Share, Preferred-times, Private, Invite) stay content-height with the same clamp. Never hard-code `top` on phones shorter than 912px.

**Keyboard.** Inputs inside sheets: rely on vaul's `repositionInputs` default; composer uses `position:absolute; bottom:0` inside the frame — on iOS the visual viewport shrinks and the frame follows.

---

## 5. PWA (Serwist for Turbopack)

Files (owned by task P0-3):

- `next.config.ts`: `import { withSerwist } from "@serwist/turbopack"; export default withSerwist({ reactStrictMode: true, images: { unoptimized: true } });` (unoptimized: all images are local static files; avoids the image loader in the installable shell).
- `src/app/serwist/[path]/route.ts`: per Serwist docs — `createSerwistRoute({ additionalPrecacheEntries: [{ url: "/~offline", revision }], swSrc: "src/app/sw.ts", useNativeEsbuild: true })`, exporting `dynamic, dynamicParams, revalidate, generateStaticParams, GET`; `revision` = `git rev-parse HEAD` via `spawnSync` with `crypto.randomUUID()` fallback.
- `src/app/sw.ts`: `new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting: true, clientsClaim: true, navigationPreload: true, runtimeCaching: defaultCache (from "@serwist/turbopack/worker"), fallbacks: { entries: [{ url: "/~offline", matcher: ({request}) => request.destination === "document" }] } }).addEventListeners()`; add a `CacheFirst` route for `/images/*` and `/icons/*`.
- `src/app/~offline/page.tsx`: Go mascot placeholder + "You're offline" using the Screen shell.
- `src/app/manifest.ts`: `{ name: "Go — Group Trip Agent", short_name: "Go", start_url: "/", display: "standalone", orientation: "portrait", background_color: "#F6F7F9", theme_color: "#F6F7F9", icons: [192, 512, 512-maskable] }`.
- `src/app/layout.tsx`: `metadata` (`applicationName`, `appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Go' }`, `formatDetection: { telephone: false }`, `manifest: '/manifest.webmanifest'`), `viewport` (§4), `<SerwistProvider swUrl="/serwist/sw.js">` from `@serwist/turbopack/react` wrapping `<AppFrame>`.
- `public/pwa/icon.svg` (navy #0B1B3F rounded square, white 📍-style pin + "Go" wordmark in Figtree 800) and `scripts/pwa-icons.mjs` (sharp → 192/512/512-maskable with 10% padding/apple-touch 180). Script `pnpm pwa:icons`.
- Verification (orchestrator, end of Phase 0): `pnpm build && pnpm start &` → `curl -sI http://localhost:3000/serwist/sw.js | head -1` is 200, `curl -s http://localhost:3000/manifest.webmanifest | jq .display` = standalone, Lighthouse PWA installable in Chrome.

---

## 6. Icons — inventory, files, svgr pipeline

All icons in the design are inline 24×24 stroke SVGs (`fill=none stroke=currentColor stroke-linecap/linejoin=round`), except `play` (filled). Stroke width varies per use (2, 2.2, 2.4, 2.6, 3, 3.2, 3.5, 4) — stored as `stroke-width="2"` in the file and overridden per use with the `strokeWidth` prop. Colour always via `currentColor` (parent `text-*` class). Size via `className="size-5"` (svgr `icon:true` sets `width/height="1em"`, CSS wins).

### 6.1 Generated icons — `public/icons/<kebab>.svg` → `src/components/icons/generated/<Pascal>.tsx`

| file | component | path data (24×24) | used in |
|---|---|---|---|
| `check.svg` | `Check` | `M5 12l5 5 9-10` | check badges everywhere (sw 3–4), chip done tick (sw 4, 9px), seat/radio |
| `arrow-left.svg` | `ArrowLeft` | `M19 12H5` `M11 6l-6 6 6 6` | back buttons (22px, sw 2) — all screens |
| `arrow-right.svg` | `ArrowRight` | `M5 12h14` `M13 6l6 6-6 6` | composer send (20), show-more tiles, boarding-pass route (#A5ACB8) |
| `chevron-right.svg` | `ChevronRight` | `M9 6l6 6-6 6` | list rows (16, sw 2.4, faint), nudge pill (14, sw 2.6) |
| `chevron-down.svg` | `ChevronDown` | `M6 9l6 6 6-6` | trip-home expandable rows (sw 2.4) |
| `x.svg` | `X` | `M6 6l12 12` `M18 6L6 18` | sheet close (18), cancel (14), viewer close (22) |
| `plus.svg` | `Plus` | `M12 5v14` `M5 12h14` | FAB, "Create a trip", composer add, placeholder avatars, more-reactions |
| `share.svg` | `Share` | `M14 5l7 7-7 7` `M21 12h-9a8 8 0 0 0-8 8` | header share, hero share, pass/PDF share |
| `message-circle.svg` | `MessageCircle` | `M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z` | WhatsApp stand-in (share sheet tile, "Share in WhatsApp group") |
| `board.svg` | `Board` | `rect x4 y3 w16 h18 rx3` `M8 8h8` `M8 12h8` `M8 16h5` | chat header → trip board |
| `mic.svg` | `Mic` | `rect x9 y3 w6 h11 rx3` `M5 11a7 7 0 0 0 14 0` `M12 18v3` | composer |
| `lock.svg` | `Lock` | `rect x5 y11 w14 h10 rx2` `M8 11V8a4 4 0 0 1 8 0v3` | privacy notes, private CTAs, trust lines, URL bar |
| `stopwatch.svg` | `Stopwatch` | `circle cx12 cy13 r8` `M12 9v4l2.5 2` `M10 2h4` | countdowns, visa due, route stop line (sw 2.2) |
| `map-pin.svg` | `MapPin` | `M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z` `circle cx12 cy9.5 r2.5` | stay cards/details location |
| `search.svg` | `Search` | `circle cx11 cy11 r7` `M20 20l-3.5-3.5` | city search |
| `expand.svg` | `Expand` | `M15 3h6v6` `M9 21H3v-6` `M21 3l-7 7` `M3 21l7-7` | trip-home row expand (sw 2.2), recording |
| `copy.svg` | `Copy` | `rect x9 y9 w12 h12 rx2` `M5 15V5a2 2 0 0 1 2-2h10` | copy link, long-press copy |
| `link.svg` | `Link` | `M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1` `M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1` | invite link field |
| `download.svg` | `Download` | `M12 3v12` `M7 10l5 5 5-5` `M5 21h14` | PDF viewer, recording |
| `list.svg` | `List` | `M8 6h13` `M8 12h13` `M8 18h13` `M3 6h.01` `M3 12h.01` `M3 18h.01` | itinerary list/map toggle |
| `map.svg` | `Map` | `M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z` `M9 4v14` `M15 6v14` | itinerary list/map toggle |
| `camera.svg` | `Camera` | `M4 8h3l2-3h6l2 3h3v11H4z` `circle cx12 cy13 r3.5` | visa upload tiles |
| `pencil.svg` | `Pencil` | `M4 20h4L19 9l-4-4L4 16z` | money edit |
| `reply.svg` | `Reply` | `M9 14L4 9l5-5` `M4 9h10a6 6 0 0 1 6 6v4` | long-press menu |
| `eye.svg` | `Eye` | `M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z` `circle cx12 cy12 r3` | "View my details" |
| `file-text.svg` | `FileText` | `M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z` `M14 3v5h5` | "Open ticket PDF" |
| `phone.svg` | `Phone` | `M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2` | listen-in / call actions |
| `play.svg` | `Play` | `M7 4l13 8-13 8z` (**fill="currentColor"**, no stroke) | call player, recording rows |
| `pause.svg` | `Pause` | `M8 5v14` `M16 5v14` (sw 3) | recording player |

(Trip-home/calls screens may add 1–3 more — P0-4 reconciles against `plans/screens/J-triphome-calls.md` before generating.)

### 6.2 Hand-written, state-driven — `src/components/icons/custom/` (outside svgr)

| component | why custom |
|---|---|
| `GoaMap.tsx` | the 388×480 map (two land/sea variants + roads + labels + pins); pins/route/selection are props |
| `WaxSeal.tsx` | 92×92 wax seal with gradients/filters/textPath — ids must be namespaced per instance (`useId`) |
| `BoardStamp.tsx` | 76×76 ring stamp with circular text (board) |
| `QrBitmap.tsx` | boarding-pass QR rendered from a 25×25 bitmap string (`-1 -1 27 27` viewBox, `shape-rendering: crispEdges`) |
| `Spinner.tsx` | 14px ring (`border-2 border-success-ring border-t-success border-r-success animate-spin-slow`) |
| `LiveDot.tsx` → lives in `src/components/common/` (owned by P1-2) | pulsing dot (`animate-live`), sizes 7/8/10 |
| `AudioBars.tsx` | N bars with staggered `animate-wave` and `--d` delays |
| `MicSendIcon.tsx` | swaps Mic → ArrowRight based on `hasDraft`, red while recording (composes generated icons) |
| `CheckBadge.tsx` → lives in `src/components/common/` (owned by P1-2) | green circle + `Check` with size map 14/16/18/22/24/28/30 (check 8/9/11/12/13/15/16) |

Brand marks served as static images (`<img>`), not components: `public/icons/brand/google.svg` (official multicolour G), `indigo.svg` / `air-india.svg` wordmark placeholders (see §12).

### 6.3 svgr config + script

`svgr.config.js` (repo root):
```js
/** @type {import('@svgr/core').Config} */
module.exports = {
  typescript: true,
  jsxRuntime: "automatic",
  icon: true,                       // width/height = 1em → size with className
  expandProps: "end",               // {...props} last so strokeWidth/className override file attrs
  svgProps: { "aria-hidden": "true", focusable: "false" },
  replaceAttrValues: { "#0B1B3F": "currentColor", "#000": "currentColor", "#000000": "currentColor", "#4A5878": "currentColor", "#A5ACB8": "currentColor", "#FFFFFF": "currentColor", "#fff": "currentColor" },
  svgoConfig: { plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }, "removeDimensions"] },
  prettier: true,
  filenameCase: "pascal",
  indexTemplate: (paths) => paths.map((p) => { const n = p.path.split("/").pop().replace(/\.tsx$/, ""); return `export { default as ${n} } from "./${n}";`; }).join("\n") + "\n",
};
```
`package.json` scripts: `"icons": "svgr --config-file svgr.config.js --out-dir src/components/icons/generated public/icons"` (svgr 8 `--index-template` is replaced by `indexTemplate` in the config; if the installed CLI ignores it, add `--index-template scripts/svgr-index.cjs`). Generated files are committed; `pnpm icons` must be idempotent (no diff on re-run). Component signature: `(props: React.SVGProps<SVGSVGElement>) => JSX.Element`. Usage rule: `<ChevronRight className="size-4 text-faint" strokeWidth={2.4} />`.

Source SVG template (every file in `public/icons/`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="…"/></svg>
```

---

## 7. Component inventory

Three layers. Layer 1 = shadcn atoms restyled with cva (the only place raw visual primitives live). Layer 2 = shared composites (props-driven, no store access unless stated). Layer 3 = per-screen sections, specified in `plans/screens/*.md`. Every element in the 72 artboards maps to something below; executors extend variants, never fork atoms.

### 7.1 Layer 1 — atoms (`src/components/ui/*`, owned by Phase 1 tasks)

| Atom (file) | cva variants / sizes | Design elements it renders |
|---|---|---|
| **Button** `button.tsx` (shadcn + Slot) | `variant`: `primary` (bg-black text-white, `active:shadow-[inset_0_0_0_999px_rgb(255_255_255/0.18)]`) · `secondary` (bg-surface-3 text-ink) · `soft` (bg-surface-2) · `tint` (bg-go-soft text-go) · `outline` (bg-white border border-line-2 text-ink) · `danger-outline` (bg-white border-line-2 text-danger) · `danger-soft` (bg-danger-soft text-danger) · `danger` (bg-danger text-white) · `success` (bg-success text-white) · `success-ink` (bg-success-ink text-white) · `success-soft` (bg-success-soft text-success-ink) · `navy` (bg-ink text-white) · `glass` (bg-ink/35 backdrop-blur-[12px] text-white) · `white` (bg-white shadow-btn text-ink) · `ghost` · `link` (text-go font-semibold, no bg) · `dashed` (border-[1.5px] border-dashed border-line-2 bg-transparent text-ink).<br>`size`: `xl` h-14 px-[18px] text-18 tracking-h4 · `lg` h-[52px] text-16 tracking-h4 · `md` h-[50px] text-16 tracking-h4 · `base` h-11 px-4 text-15 · `sm` h-9 px-[14px] text-14 tracking-sm · `xs` h-8 px-3 text-13 · `2xs` h-[30px] px-[10px] text-13 · plus numeric sizes for the remaining design heights: `48` h-12 px-[18px] text-15|16 · `46` h-[46px] px-[18px] text-15 · `42` h-[42px] px-[14px] text-14 · `40` h-10 px-[14px] text-14 · `38` h-[38px] px-[14px] text-14 · `34` h-[34px] px-[18px] text-14 · icon sizes `icon` size-11 · `icon-lg` size-12 · `icon-sm` size-10 · `icon-xs` size-9 · `icon-2xs` size-8.<br>Weight: filled `primary/navy/danger/success/success-ink` → `font-medium`; all others → `font-semibold` (compoundVariants); explicit `weight?: 'medium'\|'semibold'\|'bold'` prop overrides (several design CTAs are 15/600 on a black fill). Base: `inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-[transform,box-shadow,background-color,opacity] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97] disabled:bg-line-2 disabled:text-faint-2 disabled:pointer-events-none`. Light variants get `active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]`; `link`/`ghost` get `active:opacity-60`. | Every CTA: "Continue with Google" (primary xl), "Accept" (primary base), "Decline" (secondary base), "Details" (secondary sm), "Book"/"Open"/"Fix split"/"Clear filters" (tint 2xs/sm), "Skip"/"Not now"/"Watch" (link), round back/close/add (white/ghost icon sizes), hero back/share (glass icon-sm), "End call" (danger-soft/danger), "Voted ✓" (success sm), "Listen in" (success-ink), "Saved privately ✓" (success-soft xl), "Ask Go to make another call" (dashed base), "Sign out" (danger-outline lg) |
| **Chip** `chip.tsx` (custom cva, `<button>`/`<a>` via Slot) | `size`: `sm` h-[34px] px-3 text-13 font-semibold · `md` h-9 px-[14px] text-14 font-medium tracking-sm · `lg` h-10 px-[14px] text-14 font-semibold · `xl` h-[42px] px-[14px] text-14 font-semibold ("I'm flexible") · `xs` h-9 px-3 text-13 font-semibold (suggestion / ask-Go chips).<br>`variant`: `outline` (bg-white border border-line-2 text-ink) · `solid` (bg-black text-white border-black) · `dashed` (border-dashed border-faint) · `active` (outline + `border-black ring-1 ring-black font-semibold`) · `success` (bg-success-soft text-success-ink border-success-soft) · `plain` (bg-white border-line, non-interactive).<br>Props: `emoji` (14px glyph in a 16px slot), `pressed` (→ `aria-pressed`, swaps outline→solid), `check` (trailing CheckBadge 16). | Header fact chips (md; unset/set/active), choice & filter chips (lg; vibe/spend/city/route filters/cab filters/paid-via), "Other city" (lg dashed), reply chips (lg outline), Ask-Go suggestions (xs), amenity/activity chips (sm plain), "I'm flexible" (lg dashed → success), ask-Go call chips (xs) |
| **Badge** `badge.tsx` | `variant`: `success-soft` (bg-success-soft text-success-ink) · `peach` (bg-go-soft text-go) · `neutral` (bg-surface-2 text-muted) · `amber` (bg-amber-soft text-amber-ink) · `navy` (bg-ink text-white) · `white` (bg-white border border-line text-ink) · `terracotta` (bg-go text-white) · `price` (bg-surface-3 text-ink tabular-nums) · `price-selected` (bg-success text-white tabular-nums) · `glass` (bg-white/94 text-ink).<br>`size`: `xs` h-5 px-[7px] text-11 font-bold · `2xs` h-[22px] px-2 text-11 font-bold tracking-badge (MINE/SHARED/GROUP) · `sm` h-[22px] px-2 text-12 font-bold · `count` h-6 min-w-6 px-[7px] text-13 font-bold tabular (unread) · `price-sm` h-[26px] px-[10px] text-13 font-bold tabular (card price pills) · `md` h-7 px-[10px] text-13 font-semibold tracking-caption · `md-bold` h-[26px] px-[9px] text-12 font-bold · `rating` h-[30px] px-[10px] text-14 font-bold (★ 4.7 · reviews) · `lg` h-8 px-3 text-15 font-semibold · `xl` h-9 px-3 text-14 font-semibold. Optional leading `LiveDot`. | NEW / LIVE / LIVE · 01:12 pills, method pills (Cash/UPI/Card), MINE/SHARED/GROUP, Not yet/Sent ✓/Started, Booked / 1 of 2, "On a call", reaction chips (white), unread count (terracotta, min-w-6 h-6), price pills on cards (glass) and option rows (price/price-selected h-8/h-9), tag eyebrows |
| **Avatar** `avatar.tsx` (shadcn) + `AvatarStack` (common) | `size`: 18,20,22,24,26,28,30,32,36,40,44,48,52,64 (`size-[Npx]` classes) · `ring`: `none` · `white` (ring-2 ring-white) · `white-thin` (ring-[1.5px]) · `black` (ring-2 ring-black) · `tone`: fallback bg per user (`bg-amber-soft`, `bg-info-tint`, `bg-success-soft`, `bg-go-soft`, `bg-peach-tint`) · `kind`: `user` · `go` (bg-info-soft, Go mascot image) · `trip` (bg-amber-soft / bg-info-tint, illustration 40 in 44). Fallback = initials (text sizes scale with size). `AvatarStack`: `size`, `overlap` (-5,-6,-7,-8,-12), `max`, `ring`, `reverse?`. | Header member stacks (18/−5 thin), poll voters (20/−6), hero (28/−8), chat FAB (36/−12 black), bubbles (30), rows (32/36/40/44/48), identity (64), dashed placeholder avatars (52, `DashedAvatar` in common) |
| **Input** `input.tsx` + `InputField` (common) | `shape`: `pill` (h-12 rounded-full bg-white px-4, composer) · `pill-grey` (bg-surface-2) · `field` (h-[52px] rounded-3xl bg-white border border-line-2 px-4) · `search` (h-[52px] rounded-3xl border-[1.5px] border-ink) · `bare` (amount input: text-44 font-bold tracking-display tabular-nums w-[170px]) · `ask` (h-[52px] rounded-full bg-surface-2 pl-4 pr-1.5, trailing button slot). Text 16 tracking-body, placeholder muted. `InputField` adds eyebrow caption, leading icon, trailing slot (clear ×, call button). | Composer input, reply/ask tray input, city search, visa fields, note field, record-amount, ask-Go inputs |
| **Switch** `switch.tsx` | one size: `w-[52px] h-8 p-1 rounded-full data-[state=checked]:bg-success data-[state=unchecked]:bg-line-2`; thumb `size-6 bg-white shadow-knob data-[state=checked]:translate-x-5 transition-transform duration-200` | Profile notifications, DigiYatra |
| **Checkbox** `checkbox.tsx` | `size-[26px] rounded-md border-[1.5px] border-line-4 bg-white data-[state=checked]:bg-black data-[state=checked]:border-black text-white` + `Check` 14 sw3; `CheckboxCard` composite (card row with title/sub) | Restricted-items declaration |
| **RadioGroup** `radio-group.tsx` | indicator `variant`: `ring` (size-[22px] border-2 border-line-3 → checked `border-[7px] border-success`) · `check` (size-[26px] border-2 border-line-3 → checked bg-success border-success + `Check` 16 sw3.2). `RadioOptionCard` composite: card row `rounded-4xl bg-white p-[14px_16px] border border-line` → checked `border-[1.5px] border-ink`, emoji tile 36, title 15/600, sub 13 muted, indicator right | Pay method (UPI/Card), dates poll options |
| **Slider** `slider.tsx` (Radix, 2 thumbs) | track `h-1 rounded-full bg-line`, range `bg-black`, thumb `size-7 rounded-full bg-white border-2 border-black shadow-thumb`; `minStepsBetweenThumbs={1}`; wrapper `h-11` | Budget min–max (₹5k–₹60k step 1k) |
| **SegmentedControl** `segmented-control.tsx` (Radix ToggleGroup single, cva) + **TripTabs** uses the same list styles with `<Link>` items | `variant`: `hero` (p-[5px] gap-0.5 bg-white shadow-tabs; item h-[42px] text-15 font-semibold) · `compact` (p-1 bg-surface-2; item h-9 text-14) · `contained` (p-1 gap-1 bg-white border border-line; item h-10 text-15 font-semibold, optional leading avatar slot) · `icon` (p-1 gap-0.5 bg-white border-line; item size-10) · `scope` (p-1 gap-0.5 bg-white/92 shadow-[0_2px_10px_rgb(11_27_63/0.12)]; item h-[34px] px-3 text-13 font-semibold) · `separated` (no track, gap-1.5; item h-10 flex-1 bg-white border border-line-2 → on `bg-black text-white border-black`). Active item: `bg-black text-white`; inactive `text-muted`. Prop `role?: 'radiogroup'\|'tablist'` (the design uses `tablist/tab` for Everyone/Just me and `radiogroup/radio` for trip type, mode, view and map area). | Trip section tabs (hero/compact), Everyone/Just me (contained), trip type One way/Round trip (contained), list/map (icon), Getting there/In Goa (scope), Flight/Train/Bus (separated) |
| **Toggle** `toggle.tsx` | `variant`: `chip` (= Chip lg pressed styles) · `tile` (rounded-3xl p-3 flex-col items-start gap-0.5 bg-white border border-line-2 → on bg-black text-white border-black; emoji 18, name 15/600, range 13 opacity-75) · `upload` (h-28 rounded-4xl border-[1.5px] border-dashed border-line-3 bg-white flex-col gap-1.5 → on bg-success-tint border-success) · `seat` (size-10 rounded-xl text-11 font-bold; data states free/paid/taken/selected/friend — see check-in spec) | Time-slot tiles, visa upload tiles, seat cells |
| **BottomSheet** `drawer.tsx` (vaul) → `shell/BottomSheet.tsx` | see §4. Sub-parts: `SheetHeader` (title 22/600 tracking-h2, close `Button variant=white size=icon-sm -mr-1.5`, subtitle 14 muted tracking-sm leading-[1.4]), `SheetBody` (scroll, `px-4 pt-2 pb-[120px]`, `gap-3`), `SheetFooter` (absolute bottom, gradient, `pt-10 px-4 pb-safe gap-2.5`), `TrustLine` (Lock 13 + text-13 muted centered). Props: `open`, `onOpenChange`, `top?` (px), `maxHeight?`, `dismissible`, `nested?` (z-index bump for time sheet over route sheet). | every sheet in the app (14 kinds) |
| **DropdownMenu / Popover / Tooltip** `dropdown-menu.tsx` `popover.tsx` `tooltip.tsx` | shadcn wrappers whose `Portal` receives `container={useFrame()}`; content `rounded-4xl bg-white shadow-pop p-0 overflow-hidden w-[220px]`; `MenuItem` `h-12 px-[14px] gap-3 text-15 font-semibold border-t border-line first:border-0` (+ `h-[52px] px-4 justify-between text-16 font-medium` variant `wide` for the long-press menu); Tooltip `bg-ink text-white text-13 rounded-lg px-2.5 py-1.5` (used for icon-button labels on hover only) | Attach menu (anchored to +), long-press menu rows, icon-button tooltips |
| **Sonner** `sonner.tsx` | `<Toaster position="bottom-center" offset={108} mobileOffset={108} duration={2200} visibleToasts={1} toastOptions={{unstyled:true, classNames:{toast:"bg-ink text-white text-14 font-semibold leading-[1.35] rounded-3xl px-4 py-3 shadow-toast max-w-[340px] text-center starting:opacity-0 starting:translate-y-1.5 transition-all duration-220"}}}/>`; helper `toastGo(text)` in `lib/toast.ts` | all 60+ toast strings |
| **Note** `alert.tsx` (shadcn Alert restyled) | `variant`: `peach` (bg-go-note) · `green` (bg-success-soft text-success-ink) · `outline` (bg-white border border-line) · `navy` (bg-ink text-white — call hero); base `rounded-4xl p-[12px_14px] flex items-center gap-2.5 text-14 leading-[1.4]`; `icon` slot (Lock 16 / Go avatar 28) and `trailing` slot (e.g. Arjun avatar 28). `GoNote` = Note with Go avatar + `variant` passthrough; `InfoNote` = Note with Lock | Privacy notes, Go notes, cab info note, check-in Go notes, outcome banner (green, with CheckBadge + 16/600 headline) |
| **Progress** `progress.tsx` + `SegmentedProgress` (common) | Progress: track `h-1 rounded-full bg-success-soft`, bar `bg-success` (+ `animate-fill` option). SegmentedProgress: `segments`, `filled`, `size` (`booking` = h-[5px] w-[22px] gap-[5px] · `steps` = h-1 flex-1 gap-1.5 · `status` = h-1.5 flex-1 gap-1), colours `success` / `ink` / `line` | Welcome pill, booking 4-step, check-in steps, trip-home "0 of 5 decided" |
| **Card** `card.tsx` | `variant`: `shadow` (bg-white shadow-card) · `outline` (bg-white border border-line) · `float` (bg-white border border-line shadow-float) · `float-sm` (shadow-float-sm) · `dashed` (border-[1.5px] border-dashed border-line-2 bg-transparent) · `tint` (bg-go-note) · `glass` (bg-white/86 backdrop-blur-[10px] border border-white shadow-glass) · `navy` (bg-ink text-white).<br>`radius`: `lg` 18 · `xl` 20 · `2xl` 22 · `3xl` 24 · `4xl` 28 (default 2xl). `padding` left to callers. | all cards |
| **Separator** `separator.tsx` | `border-line` hairline; `dashed` variant (`border-dashed border-line-2`, 1.5px) | dividers, ticket tear lines |
| **Skeleton** `skeleton.tsx` | `bg-white rounded-6xl` blocks (no shimmer) | invite-landing trip-home skeleton |

shadcn components **not** installed: table, calendar, carousel, accordion (expandable rows are hand-rolled with `aria-expanded` + `starting:`), scroll-area, select, textarea, form, sheet (we use drawer).

### 7.2 Layer 2 — shared composites (`src/components/**`, Phase 2 unless noted)

Shell (`src/components/shell/`):
| Component | Props | Used by |
|---|---|---|
| `AppFrame` | children | layout |
| `Screen` | `bg?`, `scroll?` (`'page'`\|`'none'`), `onScroll?`, children | every page |
| `TopBar` | `title`, `subtitle?` (13 muted), `onBack?`/`backHref`, `trailing?` (1–2 icon buttons), `tone` (`white`\|`transparent`), `padTop` (`safe`=56 \| `hero`=46) — `pb-2 px-3 gap-1.5`, title 20/700 tracking-h3 (16/600 + subtitle in the PDF viewer); optional `children` row under the title (filter chips) | Profile, Boarding pass, PDF viewer, Transactions |
| `ScreenTitle` | `eyebrow`, `title`, `trailing?` — eyebrow 13/600 muted, title 34/600 tracking-title | Home (both states), Who's coming |
| `FadeDock` | `variant` (`gradient` 35% \| `fade` 70% \| `blur` progressive 4-layer), children — absolute bottom, `pb-safe`, pointer-events on children only | B1/B6 Next dock, sheet footers, composer, chat FAB underlay |
| `BottomSheet` + parts | §7.1 | all sheets |
| `ShareInviteSheet` | `trip`, `open`, `onOpenChange`, `onShared?(action)` — invite card + Copy (clipboard → toast "Invite link copied", sheet stays open), recent group row, 5 tiles; WhatsApp tile and recent row call `share.inviteViaWhatsApp(trip)` (Web Share API / `https://wa.me/?text=` fallback), Messages/Gmail/More call `share.inviteNative(trip)` (`navigator.share`; fallback = copy link + the design's toast verbatim), Copy link → clipboard; every tile closes the sheet and fires `onShared` (used by `/trips/new` to start simulated joins) | 60+ artboards |
| `GoogleButton` | onClick → `signInWithGoogle()` | Welcome |

Common (`src/components/common/`):
| Component | Props | Used by |
|---|---|---|
| `AvatarStack`, `DashedAvatar` | §7.1 | everywhere |
| `CheckBadge` | `size` 14/16/18/22/24/30 (check 8/9/11/12/13/16, sw 4/4/3.5/4/4/4) | chips, rows, stubs |
| `LiveDot` | `size` 7/8/10, `pulse` | call cards, recording pill, status rows |
| `EmojiTile` | `emoji`, `size` 34/36/40/44/48/52/56/64, `shape` circle/rounded-xl/rounded-2xl, `tint` token | rows, tiles, empty states, map detail card (40 rounded-xl) |
| `SectionHeader` | `title`, `meta?`, `live?` | all list screens |
| `Eyebrow` | children, `tone` (muted\|go\|white) | sheets, cards, boards |
| `ListCard` / `ListRow` / `KVRow` | ListCard: `padding` (`rows`=px-3.5 \| `tight`=px-3.5 py-0.5); ListRow: `leading`, `title`, `sub`, `trailing`, `href?`, `onClick?`, `muted?` (done rows), `dense?` (py-2.5 vs py-3); KVRow: `label`, `value`, `size` 14 | settings, done lists, details, facts |
| `CountdownMeta` | `text` | polls, visa |
| `StatusPill` | wraps Badge md with palette by status | visa, board |
| `InfoNote` / `GoNote` | wraps Note with Lock icon / Go avatar | sheets |
| `SegmentedProgress` | §7.1 | |
| `StepIndicator` | `step` 1..3, labels | check-in |
| `GlassIconButton` | icon, label | hero back/share |
| `MentionChip` | `name="Go"` — h-6 pl-0.5 pr-[9px] bg-white/16 rounded-full font-semibold + Avatar 20 go | my bubbles |
| `ReactionChip` | `emoji`, `count`, `floating?` (absolute on card) | chat |
| `ProgressiveBlur` | `layers` config — 4 stacked `backdrop-blur` spans with gradient masks | B1 dock, plan card hero |

Chat (`src/components/chat/`, Phase 2 task P2-5 unless noted):
| Component | Props | Notes |
|---|---|---|
| `ChatHeader` | `trip`, `subtitle`, `members`, `backHref`, `onBoard` (default: open board sheet), `onTitlePress?` (default: navigate to `backHref`; Bali passes a toast), `onShare`, `children` (`FactChipRow`) — white, `pt-safe pb-3 shadow-header`, row gap-1 px-[8px_0_12px] title block h-[52px] (standardise H1 170px) | |
| `FactChipRow` + `FactChip` | `chips: {key, emoji, label, state: 'unset'\|'set', active?: boolean, onPress}` (a set chip can also be `active`, e.g. "Bengaluru ✓" while the From sheet is open) — `mt-3.5 gap-2 px-5 overflow-x-auto scrollbar-none` | |
| `MessageList` | `children`, `bottomPadding` 96/150/190, `anchorRef` | scroll container + `[data-chat-end]` sentinel + `useScrollToEnd()` |
| `SystemPill` | `text`, `avatar?` | |
| `Bubble` | `author: 'go'\|'me'\|'member'`, `name?`, `avatar`, `children`, `maxWidth?` (72/76/78/80), `quote?`, `reaction?`, `footer?` — radii `20 20 20 0` / `20 20 0 20`; go bg-go-soft label text-go; member bg-white shadow-bubble label muted; me bg-black text-white no shadow | all bubbles; `GoBubble` convenience with optional embedded CTA (`cta`, `caption`) for budget/travel/visa asks |
| `QuoteBlock` | `author`, `text` | my reply bubbles |
| `QuickReplyBlock` | `chips: {label, onPress}` | C2 |
| `GoNudgePill` / `NextStepPill` | `label`, `onPress`/`href` — navy h-[42px] pl-1.5 pr-3.5 Avatar 30 go + ChevronRight 14 sw2.6 shadow-pill `starting:` enter | C3 + every "Next · …" |
| `Composer` | `value`, `onChange`, `onSend`, `recording`, `onMic`, `onAttach(item)`, `attachOpen` — gradient bar, Add 48 white, input pill 48, `MicSendButton` 48 (black/danger), `AttachMenu` (DropdownMenu, 4 rows), `RecordingPill` | |
| `ComposerTray` | `mode: 'reply'\|'askGo'`, `banner: {title, snippet, accent}`, `suggestions?`, `value`, `onChange`, `onSend`, `onCancel` | D2/D3 |
| `LongPressOverlay` | `message`, `anchorRect`, `onReact(emoji)`, `onMore` (toast "Your full emoji keyboard opens here"), `onReply`, `onAskGo`, `onCopy`, `onClose` — scrim `bg-scrim-strong backdrop-blur-[6px]`, reaction bar (6 emoji 42px + more), lifted bubble `scale-[1.03]`, menu 230px (`MenuItem wide`: Reply/Ask Go/Copy) positioned from the pressed bubble's rect (not fixed 300px) | D1; triggered by `useLongPress` (500ms) on member bubbles |
| `InChatCard` | `children`, `right` (16/22/30) — `ml-[38px] rounded-6xl bg-white border border-line shadow-float overflow-hidden` | wrapper for all Go cards |
| `HorizontalRail` | `children`, `inset` — `-mr-4 ml-[22px] pl-4 pr-4 py-[4px_10px] gap-2.5 snap-x snap-mandatory scrollbar-none` | place/stay rails, call carousel (`inset` variant for trip home) |
| `ShowMoreTile` | `title`, `sub`, `onPress`, `width` (150) — dashed tile with arrow-in-circle 44 | place rail ("Show more places" / "Go has 6 more"), stay rail ("Show 5 more" / "Same dates, same budget") |
| `MenuItem` (common) | standalone button row usable inside `DropdownMenu` or in the long-press menu: `label`, `icon?`, `variant` (`menu` h-12 15/600 \| `wide` h-[52px] 16/500 justify-between) | attach menu, long-press menu |

Chat cards & sheets (Phase 3A tasks P3-3…P3-8; file per component under `src/components/chat/cards/` and `src/components/sheets/`): `PlaceCard`, `PlacePollRail`, `ShowMoreTile`, `PlaceDetailsSheet` (layout `rich`\|`light`), `DatesPollCard` (+`CalendarTile`, `PollOptionRow`, `FlexibleButton`, `PollFooter`), `BudgetAskBubble`, `BudgetSheet` (+`BudgetRangeSlider`), `StayCard`, `StayPollRail`, `StayDetailsSheet` (+`AmenityChips`, `FactRows`), `PayAskCard` (`state: open\|claimed`), `PaySheet`, `BookingProgressCard` (timed sequence, `prefers-reduced-motion` aware), `BookedTicketCard`, `ReceiptCard` (`mask-scallop`), `TravelAskBubble`, `ProgressPill`, `RouteSheet` (+`LegSummaryCard`, `RouteOptionRow`, `FilterChipRow`, `TimeChip`), `TimeSheet` (nested, `SlotTile` grid), `WhoLandsCard` (+`SuggestionStrip`), `CabSheet` (+`CabOptionRow`), `PrivateTeaserCard`, `PrivateSheet` (+`BoardingInfoCard`, `ReturnRow`), `PlanCard` (+`DayStrip`, `WaxSeal`), `VisaAskBubble`, `VisaStatusCard`, `VisaSheet` (+`UploadTile`; fields use `InputField shape=field`), `QuickStartSheet` (+`ChoiceChipGroup`), `FromCitySheet` (+`CityPicker`: chip strip, `OtherCityChip`, `SearchField`, `ResultList`), `BoardSheet` (+`BoardRow`, `PollRow`, `GoReminderRow`, `SpendVsBudgetCard`).

Trip (`src/components/trip/`, P2-6 + P3-10/11/12/16): `TripShell` (hero + tabs + collapsing header + chat FAB + fade; props `trip`, `active`, `hero`, `title`, `meta: {emoji, text}[]`, `members`, `chatPreview`, `onShare`, `forceCollapsed?` (M2 preset), children; `useCollapsingHeader()` → `{ sentinelRef, collapsed, animate }`: an IntersectionObserver on the hero's bottom edge; the compact header slides in, opaque, once the hero has left the top, with no scroll-driven fade), `TripHero` (`image | gradient`, title, `meta: {emoji, text}[]` (18px emoji slot), members, glass buttons at `top-safe-hero`), `TripTabs` (hero/compact), `CollapsingTripHeader`, `ChatFab` (`avatars`, `preview`, `unread`), `GoStatusCard`, `NextUpRow`, `EmptyHeroCard`, `TicketStubPlaceholder`, `DashedNoteRow`, `ZeroAmount`, `CategoryTile`, `PendingCard`/`PendingRow`, `CheckinCard`, `AllSetCard`, `LiveCallCard`, `CallCarousel` (+`AddCallTile`, `CarouselDots` tracked via IntersectionObserver), `AskGoForm` (+`LastCallRow`), `DoneList`, `ExpandableBookingRow`, `VendorLivePanel`, `CallOptionsPanel`, `CheckinPreviewLink`, `DetailsList`, `ListenSheet` (+`CallHeroCard`, `LiveTranscript`, `BookingDetailsAccordion`, action dock), `RecordingSheet` (+`OutcomeBanner`, `RecordingPlayer`, `TranscriptRow`), `CheckinDetailsSheet`, `CheckinSeatSheet` (+`SeatMap`, `SeatCell`, `SeatLegend`), `BoardingPassCard`.

Plan/Money (`src/components/plan/`, `src/components/money/`, P3-13/14/15; `ScopeToggle`, `ViewToggle`, `ScopeBadge`, `SplitBar` live in `src/components/common/` owned by P2-4): `MapCard` (+`GoaMap` from icons/custom, `MapSpotButton`, `MapScopeSwitch`, `MapHintPill`, `MapDetailCard`), `DayCard`, `TimelineRow`, `BookingTicketCard`, `PdfViewer` (+`PdfPage`, `PageCounterPill`), `SpendSummary`, `SettleRow`, `TransactionRow`, `TransactionGroup`, `FilterChips`, `RecordPaymentSheet` (+`PaidViaChips`). `SplitBar` props: `segments: {pct, color}[]`, `gap` 3, `track?` (expenses-me and board use a track; expenses-everyone has none).

Home/crew (`src/components/home/`, P3-1/P3-2): `HeroCard`, `IdeaCard`, `IdeasCarousel`, `AskGoRow`, `InviteCard`, `TripCard`, `PastTripRow`, `SettingsList`, `IdentityCard`, `InviteLinkField`, `CrewCluster`, `CrewList`, `SuggestionsPlaceholder`, `InviteSheet` (B7/G1), `TripHomeSkeleton`.

### 7.3 Layer 3 — per-screen sections
Defined in `plans/screens/<group>.md` (one file per flow group A–M). Each lists: artboards → route + state, section order, which Layer-2 components it composes (with props/data bindings), screen-local components (if any), interactions → store actions, acceptance checklist.

---

## 8. Route map and artboard → route/state mapping

Many artboards are states of one route. The mapping below is normative; sheets open via UI state and are deep-linkable with `?sheet=` for demo/testing. Back navigation closes sheets first (`router.back()` when the sheet was pushed with `router.push(…?sheet=x)`; `history.replaceState` when opened by tap).

| Route (App Router) | Artboards | State / params |
|---|---|---|
| `/` | A1 Welcome | if `session.signedIn` → `redirect('/home')` (client guard in page). "Continue with Google" → `signInWithGoogle()` → `/home`. Terms/Privacy → toasts |
| `/home` | A4 (zero), A6 (trips) | `trips.length === 0` → HomeZero (hero + ideas carousel + Ask-Go row) else AppHome (invites, active trips, past, FAB). Idea cards / Create / FAB → `/trips/new`. Avatar → `/profile` |
| `/profile` | A5, A7 | one screen; Back = `router.back()` (fallback `/home`). Sign out → `signOut()` → `/`. Bottom "Prototype controls" (§9.6) |
| `/trips/new` | B1, B2, B6 | creates/uses the draft Goa trip; state `members` (B1: just you; B6: Rahul + Priya joined), `shareOpen` (B2). Simulated joins: Rahul joins 4s after first share action, Priya 8s (or instantly with `?joined=2`). Skip/Next → `/trips/goa/chat` |
| `/invite/[code]` | B7 (`goa-k7q`), G1 (`bali-x9m`) | Trip-home skeleton underlay + `InviteSheet` (top 376). Accept → joins → Goa: `/trips/goa` (zero home) · Bali: `/trips/bali/chat`. Not now / X / scrim → `/home` |
| `/trips/[tripId]` | I1 · J1–J7 · K1 | trip home. `trip.stage !== 'planned'` → zero content (I1). Populated: `?open=stay\|fly`, `?sheet=listen&call=<id>` (J5), `?sheet=recording&call=<id>` (J7), `?sheet=checkin&step=details\|seat` (K2/K3), `?sheet=share`. J2/J3/J4/J6/K1 are store states (calls, pending, checkin) — see presets. Zero vs populated is **per tab and data-driven**: home/itinerary populate at stage `plan`; bookings populate once any booking exists (stage `book`); expenses populate once any transaction exists (stage `book`) — so "Fix split" from the receipt lands on real numbers |
| `/trips/[tripId]/chat` | C1–C5, D1–D3, E1–E15, F1–F8, G2–G3, H1–H3 | scenario stage + sheet state: `?sheet=quickstart\|from\|place&id=\|budget\|stay&id=\|pay\|route\|cab\|private\|visa\|board\|share`, `?q=<query>` (city search open), `?mode=longpress\|reply\|askGo&msg=<id>`, `?stage=<stageId>` (demo jump). Board (H1–H3) is a sheet on this route |
| `/trips/[tripId]/itinerary` | I2 · L1–L3 | zero when `trip.stage !== 'planned'`; else `?scope=everyone\|me` (default everyone), `?view=map\|list` (default: everyone→map, me→list), `?area=trip\|goa`, `?sel=<spotKey>\|none` (all four params always written via `replaceState`) |
| `/trips/[tripId]/bookings` | I3 · M1 · M2 | zero until a booking exists; M2 = collapsed header (same page; `?collapsed=1` forces it for the preset since 3 cards don't scroll 200px) |
| `/trips/[tripId]/bookings/[bookingId]/ticket` | M3 | full page PDF viewer; Close → bookings |
| `/trips/[tripId]/expenses` | I4/I5 · M4/M5 · M7 | `?scope=everyone\|me` local toggle; `?sheet=record` (M7) |
| `/trips/[tripId]/expenses/transactions` | M6 | filters local state; "Record a payment" → `/trips/[id]/expenses?scope=me&sheet=record` |
| `/trips/[tripId]/checkin/pass` | K4 | full page; Back → `/trips/[id]`; Download → `/trips/[id]/bookings/<flightBookingId>/ticket` (fixes the design's mis-wire); Save to wallet / Share → toasts |
| `/~offline` | — | offline fallback |
| `/dev/ui` (optional) | — | atoms gallery, excluded from manifest start flow |

Trip ids: `goa` (Goa crew), `college` (College gang, always zero), `bali` (Bali crew, visa scenario). Invite codes: `goa-k7q`, `bali-x9m`.

### 8.1 Navigation wiring (follows prototype links; deviations noted)
- Chat header: Back/title → `/trips/[id]`; board icon → `?sheet=board`; share → share sheet. Fact chips: Where → `ensureStage('places')` + scroll to place card (or board when set); When → `ensureStage('dates-poll')` + scroll; Stay → `ensureStage('stays')` + scroll; Budget → `ensureStage('budget')` + open budget sheet; From → open From sheet.
- Trip home: tabs ↔ itinerary/bookings/expenses; Chat FAB → chat; Pending "Record" → `expenses?scope=me&sheet=record`; "Book ₹1,600" → `chat?sheet=cab`; Flights "Preview" → sets `checkin.status='open'` (K1); "Check in now" → `?sheet=checkin&step=details`; Listen in → `?sheet=listen&call=…` (per call, not always Villa Sol); Recording pill → `?sheet=recording&call=…`.
- Board rows: Where/When/Stay/Budget/Travel → close board, `ensureStage`, scroll/open sheet (travel → route sheet).
- Bookings cards: travel → ticket viewer; stay → `/trips/[id]?open=stay`.
- Itinerary detail card: "Flight details" → `/trips/[id]?open=fly`; "Message Rahul/Priya" → chat; "See places in Goa" → area=goa, sel=villa; Directions → toast.
- Expenses: Record → record sheet; Nudge → toast; See all → transactions; Edit budget → `chat?sheet=budget`.
- Private sheet "Open ticket PDF" → ticket viewer; Plan card "Open" → `/trips/[id]`.
- Excluded screens: Google account chooser/consent (A2/A3) → `signInWithGoogle()` stub (`lib/auth.ts`, resolves after 400ms, sets session, `// TODO real OAuth`); WhatsApp pick/compose/chat (B3–B5) → `lib/share.ts` (`navigator.share` with `{title, text, url}`; fallback: WhatsApp tile opens `https://wa.me/?text=…` in a new tab, others copy the link + toast).

---

## 9. Domain model, mock data, store

### 9.1 Types (`src/data/types.ts`)
```ts
export type Id = string;
export type UserId = 'aarav' | 'rahul' | 'priya' | 'arjun' | 'kabir';
export interface User { id: UserId; name: string; firstName: string; initials: string; tone: 'amber'|'info'|'success'|'go'|'peach'; city: string; cityCode: string; email?: string; avatar?: string }
export type TripId = 'goa' | 'college' | 'bali';
export type TripStage = 'new' | 'deciding' | 'planned';
export interface Trip { id: TripId; name: string; destination?: string; emoji?: string; dates?: { label: string; short: string; chip: string; countdown: string }; cover?: string; tint: 'amber'|'info'; memberIds: UserId[]; organizerId: UserId; inviteCode: string; inviteUrl: string; whatsappGroup: string; stage: TripStage; budgetLabel?: string /* "₹21.8k" | "₹55k" */; fromCity?: string; homeCard: { kind: 'planned'|'new'; title: string; dateLine: string; footerTitle: string; footerSub: string; footerTone: 'go'|'muted' } }
export interface Idea { id: string; name: string; tag: string; travel: string; tint: string /* token class */; img: string }
export interface PastTrip { id: string; title: string; sub: string; tint: string; img: string }
export interface Invite { code: string; tripId: TripId; inviterId: UserId; joinedCount: number; memberIds: UserId[]; whenYouJoin: string[] }

// chat
export type StageId = 'kickoff'|'places'|'dates-talk'|'dates-poll'|'budget'|'stays'|'pay'|'book'|'travel'|'route-confirm'|'private'|'plan'|'visa';
export type Author = UserId | 'go' | 'system';
export type CardKind = 'quick-replies'|'go-nudge'|'place-poll'|'dates-poll'|'budget-ask'|'stay-poll'|'pay-ask'|'booking-progress'|'travel-ask'|'progress-pill'|'who-lands'|'private-teaser'|'plan'|'visa-ask'|'visa-status';
export interface Message { id: Id; stage: StageId; author: Author; kind: 'text'|'system'|'card'; text?: string; card?: { kind: CardKind; payload?: Record<string, unknown> }; mention?: boolean; quote?: { author: string; text: string }; reaction?: { emoji: string; count: number }; maxWidth?: 64|70|72|76|78|80; visibleWhen?: (s: ChatState) => boolean /* e.g. quick-replies only when quickStart==='done' */; transient?: boolean /* only while this is the current stage (nudge pills, tap-to-reply) */; replyDraft?: string; askGoSuggestions?: string[] }
export interface ScenarioStage { id: StageId; subtitle: string | Record<'pending'|'done'|'dismissed', string>; memberIds: UserId[]; chips: Record<ChipKey, ChipState>; messages: Message[]; next?: { label: string; to: StageId; after?: TriggerId /* omitted = pill shows on stage entry (F4, F6) */; inSheet?: 'budget' }[] /* `pay` has two: claimed → pill, paid → direct */ }
export type ChipKey = 'where'|'when'|'stay'|'budget'|'from';
export interface ChipState { label: string; state: 'unset'|'set'; active?: boolean /* budget chip is active through the whole `budget` stage until saved; from chip while its sheet is open */ }
export type TriggerId = 'place-asked'|'place-voted'|'dates-asked'|'dates-answered'|'budget-saved'|'stay-voted'|'stay-claimed'|'stay-paid'|'booking-done'|'route-booked'|'cab-booked'|'private-viewed'|'plan-asked'|'visa-sent';

// decisions & polls
export interface PlaceOption { id: 'goa'|'gokarna'|'udaipur'; name: string; meta: string; est: string; why: string; img: string; tint: string; voters: UserId[]; details: PlaceDetails }
export type PlaceDetails = { layout: 'rich'; subtitle: string; hero: string; caption: string; price: string; whyRows: string[]; cost: {label: string; emoji: string; value: string}[]; total: string; activities: string[]; votersLine: string } | { layout: 'light'; subtitle: string; tint: string; img: string; facts: {label: string; value: string}[]; goNote: string }
export interface DateOption { id: 'diwali'|'xmas'|'rday'; name: string; month: string; range: string; meta: string; fit: string; fitTone: 'success'|'go'|'muted'; voters: UserId[] }
export interface Stay { id: 'sol'|'azul'|'palms'; name: string; area: string; areaLong: string; priceLabel: string; rating: string; reviews: string; tags: string; img: string; amenities: string[]; dates: string /* "Fri 6 → Mon 9 Nov · 3 nights" */; totalFor4: string; yourShare: string; cancellation: string; voters: UserId[] }
export interface RouteLeg { code: string; day: string; time: string; meta: string; stop?: string; h: number; carrier?: 'indigo'|'airindia' }
export interface RouteOption { id: string; mode: 'flight'|'train'|'bus'; kind: string; tag: string; one: number; round: number; roundOnly?: boolean; legs: [RouteLeg, RouteLeg] }
export interface TimeSlot { id: 's0'|'s1'|'s2'|'s3'; emoji: string; name: string; range: string; from: number; to: number }
export interface CabOption { id: string; kind: 'sedan'|'suv'; emoji: string; title: string; meta: string; one: number; round: number }

// trip plan
export interface Booking { id: Id; type: 'travel-out'|'stay'|'travel-back'|'flight'; eyebrow: string; title: string; sub: string; memberIds: UserId[]; media: { kind: 'logo'|'photo'|'emoji'; src?: string; emoji?: string; bg: string }; accent: 'info'|'success'; stub: { kind: 'count'; n: number } | { kind: 'booked' }; href: string; details: { label: string; value: string }[]; pnr?: string; ticket?: TicketDoc }
export interface TicketDoc { title: string /* "IndiGo e-ticket" */; fileName: string; pages: number; pnr: string; booked: string; passenger: string; seat: string; flight: string; from: {code: string; place: string; time: string}; to: {code: string; place: string; time: string} }
export interface ItineraryItem { id: Id; day: 'fri'|'sat'|'sun'|'mon'; time: string; emoji: string; title: string; sub: string; memberIds: UserId[]; scope: 'mine'|'shared'|'group'; mine?: { time?: string; emoji?: string; title: string; sub: string } | null /* null = hidden in "just me" */ }
export interface MapSpot { key: string; x: number; y: number; area: 'trip'|'goa'; audience: 'everyone'|'me'|'both'; label: string }
export interface MapCard { icon: string; title: string; sub: string; line: string; button: string; action: { kind: 'href'; href: string } | { kind: 'toast'; text: string } | { kind: 'goa' } ; me?: Partial<MapCard> }
export interface VendorCall { id: 'villa'|'indigo'|'cab'; who: string; phone: string; emoji: string; bg: string; defaultAsk: string; line: string; time: string; transcriptLive: {speaker: 'go'|'vendor'; text: string}[]; recording: { title: string; meta: string; outcome: {headline: string; body: string}; durationS: number; positionS: number; transcript: {t: string; speaker: 'go'|'vendor'; text: string; current?: boolean}[] } }
export interface ChipOption { emoji: string; label: string }
export interface Transaction { id: Id; date: string; dateLabel: string; payerId: UserId; verb: 'paid'|'booked with'; to: { kind: 'user'; id: UserId } | { kind: 'merchant'; name: string; emoji?: string; img?: string }; amount: number; method: 'Cash'|'UPI'|'Card'|'Bank transfer'|'Other'; note: string; kind: 'payback'|'booking'; mine: boolean }
export interface Settlement { fromId: UserId; toId: UserId; amount: number; status: 'open'|'settled' }
export interface Seat { id: string; row: number; col: 'A'|'B'|'C'|'D'|'E'|'F'; state: 'free'|'paid'|'taken'|'friend' }
export interface CheckIn { flight: string; date: string /* "Fri 6 Nov" */; route: {from: string; fromTime: string /* "8:40p" */; fromSub: string; to: string; toTime: string; toSub: string}; passenger: {name: string; passName: string /* "AARAV SHAH" */; sub: string; mobile: string; bags: string}; digiYatra: boolean; declaration: boolean; seat: string; friendSeat: string; friendAdjacent: string[] /* ['14A','14C'] */; paidRows: number[] /* rows ≤13 */; seatPrice: string /* "₹450" */; seats: Seat[]; pass: { boarding: string; departs: string; gate: string; zone: string; seq: string; qr: string[] /* 25 rows of '#'/'.' */ } }
export interface VisaMember { userId: UserId; sub: string; status: 'not-yet'|'sent'|'started' }
```

### 9.2 Seed modules (`src/data/seed/`)
`users.ts` (Aarav Shah — you, aarav.shah@gmail.com, Bengaluru/BLR; Rahul Verma — Mumbai; Priya Nair — Pune; Arjun — Bengaluru; Kabir — Kochi), `trips.ts` (goa: "Goa crew", Diwali Fri 6 – Mon 9 Nov 2026, `go.vestra.ai/t/goa-k7q`, WhatsApp "Goa crew 🌴"; college: "College gang", undecided; bali: "Bali crew", Christmas 25–28 Dec, budget ₹55k), `invites.ts`, `ideas.ts` (6 idea cards with tints), `places.ts` (goa/gokarna/udaipur + both detail layouts), `dates.ts` (diwali/xmas/rday), `stays.ts` (sol/azul/palms), `routes.ts` (f1–f8, t1–t4, b1–b4, filters, slots), `cabs.ts` (s1–s3, u1–u2), `bookings.ts` (3 cards + flight details + ticket doc K7QX2M), `itinerary.ts` (12 everyone items — Fri 3, Sat 3, Sun 1, Mon 5 — with `mine` overrides producing the 8 "just me" rows), `map.ts` (spots, cards; re-exports path/label/pin data from `src/data/seed/mapArt.ts`, which is owned by P1-6 so `GoaMap` can be built in Phase 1), `pastTrips.ts`, `homeCards.ts`, `calls.ts` (villa/indigo/cab + chips stay/fly/main + transcripts/recording), `money.ts` (7 transactions, settlements You→Rahul ₹5,800, Priya→Rahul ₹10,800, totals), `checkin.ts` (6E 5313, seat map rows 12–18, QR bitmap), `visa.ts`, `cities.ts` (CIT 8 + MORE 15), `copy.ts` (Welcome headline options, every toast string, share-sheet strings). All copy strings are verbatim from the design (curly apostrophes kept). `src/data/scenario/goa.ts` and `bali.ts` hold the stage tables (§9.3).

Images: `src/lib/assets.ts` exports a typed map `assets.<key>` → `/images/<file>` (see §12 asset list); Phase 0 ships placeholder files under those names so nothing 404s.

### 9.3 Scenario engine (chat)
One ordered list per trip. Rendering = all messages of stages `0..stageIndex` + user-sent messages (appended at the end, with Go's "Got it 👍 I'll factor that into the plan." auto-reply after 1200ms), scrolled to the end sentinel on every append (`scrollIntoView({behavior:'smooth', block:'end'})` after 60ms).

| Stage | Artboards | Header subtitle · members | Chips (where/when/stay/budget/from) | Messages (in order) | Completes when → next pill |
|---|---|---|---|---|---|
| `kickoff` | C1 C2 C3 C4 C5 | subtitle by quickStart state: `pending` "Rahul joined" (C1) · `done` "Just created · 2 joined" (C2) · `dismissed` "Rahul and Priya joined" (C3/C4/C5) · members [aarav, rahul] (+priya when dismissed) | Where? When? Stay? Budget? From? (From → "Bengaluru ✓" after quick start Done/From save) | system "Trip created · Rahul joined" · Go "What's the plan, crew? 🌴 / Where are we thinking of going?" · if `quickStart==='done'`: `quick-replies` ["🏖️ Beach","⛰️ Mountains","🤷 Not sure, suggest some"] · if `dismissed`: Priya "goa for diwali?? 🌴" + `go-nudge` "Go suggests places from the chat" | QuickStart sheet auto-opens on first visit (C1). Any reply chip / nudge → `places` |
| `places` | E1 E2 E3 E4 | "Picking a place" · 4 | Where? When? Stay? Budget? Bengaluru ✓ | Priya "beach pls 🌴 diwali works" · Rahul "anything under 25k" · Go "3 places fit beach + Diwali + under ₹25k each, from Bengaluru. Vote right on the card 👇" · `place-poll` (rail + "Show more places" tile → toast "Go is adding 3 more places to the chat") · countdown "Voting closes in 3 hrs" · Arjun "udaipur looks sick ngl" 🔥2 | vote (any) → pill "Goa won the vote · pick dates next" → `dates-talk` (Details → PlaceDetailsSheet; its "Vote for X" votes and closes) |
| `dates-talk` | D1 D2 D3 | "Goa · picking dates" · 4 | Goa ✓ When? Stay? Budget? Bengaluru ✓ | Priya "diwali weekend? 🪔" · Kabir "christmas i’m at home in kochi" · Arjun "in, but only after 6pm fri 😭" (artboard order) | long-press Arjun → overlay (react / Reply mode draft "works if we leave fri night" / Ask Go mode with 3 suggestions). Sending a reply or an Ask-Go question → `dates-poll`; fallback nudge pill "Go checked everyone's calendars" appears after 2.5s |
| `dates-poll` | E5 | same | same | Go "Got it. I checked everyone's calendars and leave. Here's what works 👇" · `dates-poll` card ("Final call: which weekend?", 5 hrs left, 3 options, I'm flexible, "3 of 4 voted") | vote or flexible → pill "Diwali weekend won · budgets next" → `budget` |
| `budget` | E6 E7 | "Diwali · 6–9 Nov" · 4 | Goa ✓ Nov 6–9 ✓ Stay? Budget? (active while sheet open) Bengaluru ✓ | system "Diwali won · Fri 6 – Mon 9 Nov" · Go budget-ask bubble (CTA "Add my budget" → BudgetSheet; caption "Only you and Go see what you add") · system "Rahul and Priya added theirs" | Save in sheet → in-sheet pill "Saved · see the stays Go found" → `stays`; chip becomes "₹21.8k ✓" |
| `stays` | E8 E9 E10 E11 | same | … Stay? … | system "Budget set: ₹21.8k each" · me (@Go) "find us a villa near anjuna, pool would be nice" · Go "Found 3 pool villas for 6–9 Nov, all under your ₹21.8k each. Vote on the one you like 👉" · `stay-poll` rail + "Show 5 more" (toast "Go is lining up 5 more villas") · Priya "casa azul is so cute 😍" | vote → pill "Villa Sol won · book it" → `pay` (Details → StayDetailsSheet; "Vote for X" votes + closes) |
| `pay` | E12 E13 E14 | same | … Villa Sol ✓ … | system "Villa Sol won · 3 votes" · Go "Villa Sol is free for your dates 🎉 / Only **one** of you needs to book. I'll split it 4 ways right after." · `pay-ask` card (state `open`: CTA "I'll book for all 4 · ₹43,200" → PaySheet; state `claimed` by Rahul after 6s idle: booker row + LiveDot, Rahul "on it, using my card 🙌", pill "Watch Rahul book it") | Pay in sheet, or "Watch Rahul book it" → `book` |
| `book` | E15 | same | same | system "Budget set: ₹21.8k each · Go will track spends" · Go "Villa Sol fits: ₹43,200 / for 3 nights, ₹10.8k each. / Shall I book it now?" · Rahul "yes book it, on my card 🙌" · `booking-progress` (timed: 1.6s seg4 fills, 1.8/1.9s status swap, 2.7–2.85s card → ticket, 3.3s 🎉4 + Go "Villa's on Rahul's card. / Split 4 ways 👇" + receipt "ADDED TO TRIP MONEY" with "Fix split" → expenses) · pill "Next · how everyone gets there" | pill → `travel`. Side effects: booking `stay` created, transaction "Rahul booked with Villa Sol ₹43,200", settlements created |
| `travel` | F1 F2 F3 | same | same | Arjun "how are we all getting there?" · Go travel-ask bubble (CTA "Add my travel details" → RouteSheet with nested TimeSheet) · `progress-pill` "Rahul and Priya added theirs" | Book in RouteSheet → `route-confirm`. Side effects: travel booking(s) created (round/one-way), "You booked with IndiGo ₹8,060", board travel row |
| `route-confirm` | F4 F5 | same | same | me "booked mine ✈️ lands 9:55 fri" · Go "Got it. That's the last one in 🎉 Here's when everyone reaches Goa:" · `who-lands` card (4 rows + cab strip "Book" → CabSheet) · Arjun "same flight 🤝" 🙌2 · pill "Next · Priya asks when everyone lands" | pill → `private`. Cab booked → pending "Airport cab" cleared, done row added |
| `private` | F6 F7 | same | same | Priya "what time do we all reach?" · me (@Go) "when's my flight and what do i owe?" · Go "Sent you your flight and money details privately 🔒 / For everyone: you all land between **9:55 pm Fri** and **10:30 am Sat**." · `private-teaser` (blurred lines, "View my details" → PrivateSheet) · Rahul "nice, i'll wait up with beers 🍻" · pill "Next · Go's final plan" | pill → `plan` |
| `plan` | F8 (+ H3 board underlay; H2's underlay is the `stays` stage) | same | same | me (@Go) "can you sort the whole plan?" · Go "Here's your Goa. / Pool villa, scooters, / everyone in by Friday night." · `plan` card (hero, WaxSeal, 4 days, "Made by Go", Open → `/trips/goa`) 🔥4 · Rahul "GOOO 😭" | entering `plan` sets `trip.stage='planned'` (trip home becomes J1) |
| `visa` (bali) | G2 G3 | "Christmas · 25–28 Dec" · 4 | Bali ✓ Dec 25–28 ✓ Stay? ₹55k ✓ Bengaluru ✓ (Bali/Dec/Stay chips → toasts per design) | system "Flights to Denpasar on hold · 4 seats" · Go visa-ask bubble (CTA "Add my passport details" → VisaSheet) · `visa-status` card (You Not yet / Rahul Sent ✓ / Priya Started / Arjun Sent ✓, due 10 Dec) · Priya "my passport photo is so bad lol" | Send to Go → You → "Sent ✓" (improvement over design) |

Rendering rules: user-sent messages (`send`) are stored with the stage they were sent in and rendered **inside that stage's block** (so a D2 reply sits before the dates poll Go posts next). When a send is itself the trigger that advances the stage (Reply/Ask-Go in `dates-talk`), the generic "Got it 👍 …" ack is suppressed and Go's next-stage message follows after `GO_TYPING_MS`. `transient` messages (tap-to-reply chips, nudge pills) render only while their stage is current. Next-step pills come from `selectNextPill(tripId)` (stage `next[]` × completed triggers); the budget pill renders inside the budget sheet (`inSheet`).

`ensureStage(id)` fast-forwards: applies every earlier stage's default completion (votes for the seeded winners, budget 15–25k saved, Rahul claims the booking, round-trip f2 booked, etc.) without timers. Stage transitions that are "Go posts next" show a 600ms typing delay (`TypingDots` optional; otherwise just delay) before appending.

Board sheet state is derived: `where`, `when`, `stay`, `budget`, `travel` rows from the same decisions; H1 = nothing decided, H2 = stay poll open (votes tally), H3 = planned + return not booked (shown when the user booked one-way; with a round trip the travel row shows "Booked" and no reminder row) and the spend card is filled from money totals.

### 9.4 Store (`src/store/`, zustand 5 + immer + persist, key `go-proto-v1`, `partialize` excludes transient UI)
Slices (one `create` with slice pattern): 
- `session`: `{ signedIn, userId: 'aarav', notifications: true }` · `signIn()`, `signOut()`, `setNotifications(on)`.
- `trips`: `{ trips: Record<TripId, Trip>, members, invites, pastTrips }` · `createDraftGoa()` (also inserts `college`, the Bali invite and the two past trips so `/home` becomes A6 once the first trip exists), `simulateJoins({ instant?: boolean })`, `acceptInvite(code)`, `declineInvite(code)` (toast only, per design). Zero-home rule: `selectMyTrips` = trips where `aarav` is a member; `/home` is A4 when it is empty.
- `chat`: per trip `{ stageIndex, quickStart: 'pending'|'done'|'dismissed', quickStartAnswers: {vibe, spend, from}, fromCity, sent: Message[] (each tagged with its stage), reactions: Record<msgId, emoji>, placeVote, dateVote, flexible, budget: {lo, hi, saved}, stayVote, stayBooking: {status:'open'|'claimed', by?: UserId, paid: boolean, done: boolean}, route: {trip, mode, filt, pick, on, ret, booked?: {optionId, trip}, draft: {timeOpen, tOn, tRet} /* not persisted */}, cab: {booked?: {optionId, trip}}, privateViewed, visa: {uploads: {passport, photo}, fields /* not persisted */, sent} }` · actions: `advance(trigger)`, `ensureStage(id)`, `finishQuickStart(answers)`, `dismissQuickStart()`, `saveFromCity(id)`, `send(text, { quote?, mention?, ack? })`, `react(msgId, emoji)`, `votePlace(id)`, `voteDate(id)` (re-tap un-votes), `setFlexible()`, `setBudget(lo,hi)`, `saveBudget()`, `voteStay(id)`, `claimBooking()`, `payBooking()`, `completeBooking()`, `setRoute(partial)`, `openTimeSheet()/applyTime()/clearTime()/closeTime()`, `bookRoute()`, `setCab(partial)`, `bookCab()`, `markPrivateViewed()`, `setVisaUpload(kind)`, `setVisaField(k, v)`, `sendVisa()`.
- `home`: per trip `{ calls: ActiveCall[] /* {id, vendor, asking, startedAt} */, lastCall?: {vendor, outcome}, resolved: VendorId[] /* feeds J6 done-row subs */, openRow, askForm: {open, chips, drafts}, listen: {muted, takenOver, detailsOpen}, recording: {playing, rate}, checkin: {status:'not-open'|'open'|'done', digiYatra, declaration, seat}, daysToGoLabel }` · `startCall(vendor, key)`, `endCall(id, { withOutcome?: boolean })`, `toggleRow(row|null)`, `setChip(key, label|null)`, `setDraft(key, text)`, `openForm()`, `setListen(partial)`, `setRecording(partial)`, `previewCheckin()` (checkin open + label "in 2 days"), `setDigiYatra(on)`, `setDeclaration(on)`, `setSeat(id)`, `completeCheckin()`. LIVE timers tick from `startedAt` (seeded so J1 shows ~01:12) — the one exception to the "no clock math" rule.
- `money`: `{ transactions, settlements, recorded: {amount, via, note}[] }` · `recordPayment({amount, via, note})` (prepends a payback transaction "You paid Rahul", reduces the You→Rahul settlement; marks settled when the amount covers it), selectors for totals (crew ₹64,920; mine ₹18,860; left ₹2,940; splits 66.5/49.5/37%).
- `derived` selectors (`src/store/selectors.ts`): `selectChips(tripId)`, `selectMessages(tripId)`, `selectNextPill(tripId)`, `selectHeader(tripId)` (subtitle/members by stage + quickStart), `selectBoard(tripId)`, `selectPending(tripId)` (settle-up row until recorded; cab row until booked; check-in card when `checkin.status==='open'`), `selectDone(tripId)` (4 → 6 rows), `selectTripHomeMode`, `selectTripMembers`, `selectChatPreview`, `selectMyTrips`, `selectBookings`, `selectItinerary(scope)`, `selectMoney(scope)`.
- `demo`: `applyPreset(artboardId): { href: string }` from `src/data/presets.ts` — maps each of the 72 artboard ids (e.g. `J4`) to a store patch + route + query, used by the Profile "Prototype controls" and `?preset=` on `/home`. This is what lets the orchestrator verify every artboard.

Persistence: `persist` with `createJSONStorage(() => localStorage)`, version 1, `partialize` excludes `route.draft`, `visa.fields`, `listen`, `recording` and `askForm.drafts`; `useHydrated()` guard so pages render after rehydration (no SSR/CSR mismatch: pages are client components rendered inside a Suspense boundary with a canvas-coloured skeleton).

### 9.5 Timing constants (`src/data/timing.ts`)
`TOAST_MS=2200`, `GO_REPLY_MS=1200`, `SCROLL_DELAY_MS=60`, `GO_TYPING_MS=600`, `LONG_PRESS_MS=500`, `RAHUL_CLAIMS_MS=6000` (cleared while the pay sheet is open, re-armed on close), `JOIN_1_MS=4000`, `JOIN_2_MS=8000`, `DATES_NUDGE_MS=2500`, `AUTO_SCROLL_DONE_MS=350`, `SIGN_IN_MS=400`, booking sequence `BOOKING_SEQUENCE_MS=[1600,1800,1900,2700,2750,2850,3300]` (plays once; final state persists).

### 9.6 Prototype controls
Profile page bottom section "Prototype controls" (ListCard): "Reset demo" (clears persisted store), "Jump to artboard" (select of 72 ids → `applyPreset`). Also `?preset=<id>` handled once on `/home`. Marked clearly in UI as prototype-only.

---

## 10. Work breakdown — phases, tasks, batches

Rules: tiers are `opus-executor` (hard / cross-cutting / design-system-sensitive) or `sonnet-executor` (bounded). No two tasks in one batch touch the same file; shared barrels are avoided (import from component files directly) — the only index is `icons/generated/index.ts`, owned by P0-2. Verification per task: `pnpm exec tsc --noEmit && pnpm lint` (icon tasks add `pnpm icons && git status --porcelain src/components/icons/generated` empty after a second run). The orchestrator runs `pnpm build` once per phase end (never inside tasks). Every prompt includes §11 and names its spec file(s).

### Phase 0 — scaffold, tokens, PWA, icons (sequential batches)

| Task | Tier | Owns | Reads | Depends | Acceptance |
|---|---|---|---|---|---|
| **P0-1 Scaffold + tokens + shell** | opus | everything created by `create-next-app` + `shadcn init`; `package.json` (deps + scripts `icons`, `pwa:icons`, `lint`, `typecheck`); `tsconfig.json`; `eslint.config.mjs`; `src/app/globals.css` (paste §3); `src/app/layout.tsx` (Figtree via next/font, metadata, viewport, `AppFrame`, `Toaster`); `src/components/shell/AppFrame.tsx`, `FrameContext.tsx`, `Screen.tsx`; `src/lib/utils.ts`, `src/lib/toast.ts`; `src/components/ui/sonner.tsx`; `.gitignore` (append Next defaults, keep `design/`); `src/app/page.tsx` placeholder "Go" centered | §1 §3 §4 §11 | — | `pnpm dev` renders a 450px centered canvas-coloured frame with Figtree; `pnpm exec tsc --noEmit && pnpm lint` clean; `pnpm add` of every §1 package at the exact versions |
| **P0-2 Icon SVGs + svgr** | sonnet | `public/icons/*.svg` (29 files §6.1), `public/icons/brand/google.svg`, `svgr.config.js`, `src/components/icons/generated/**` (run `pnpm icons` after P0-1 lands deps), `src/components/icons/custom/{Spinner,AudioBars,MicSendIcon}.tsx` | §6, inventories' icon sections | P0-1 for `pnpm icons` (write files in parallel, run the script after) | `pnpm icons` idempotent; `import { Check } from "@/components/icons/generated"` compiles; `<Check className="size-4" strokeWidth={4}/>` renders currentColor |
| **P0-3 PWA** | sonnet | `next.config.ts`, `src/app/manifest.ts`, `src/app/sw.ts`, `src/app/serwist/[path]/route.ts`, `src/app/~offline/page.tsx`, `public/pwa/*`, `scripts/pwa-icons.mjs` | §5 | P0-1 | `pnpm pwa:icons` writes 4 PNGs; `pnpm exec tsc --noEmit`; orchestrator: `pnpm build && pnpm start` → `/serwist/sw.js` 200, manifest valid |
| **P0-4 Placeholder assets** | sonnet | `public/images/**`, `src/lib/assets.ts`, `public/icons/brand/{indigo,air-india}.svg` | §12 asset list | P0-1 | every key in `assets` resolves to an existing file; placeholders are tinted SVGs with the asset name |

Batch order: P0-1 → (P0-2 ∥ P0-3 ∥ P0-4) → orchestrator `pnpm build`.

### Phase 1 — atoms (one batch, 6 parallel)

| Task | Tier | Owns | Acceptance |
|---|---|---|---|
| **P1-1 Button + Chip** | opus | `ui/button.tsx`, `ui/chip.tsx` | all variants/sizes in §7.1 exist with exact px; `asChild` works with `<Link>`; pressed states via `aria-pressed`/`data-state` |
| **P1-2 Badge, Avatar, AvatarStack, CheckBadge, LiveDot, EmojiTile, StatusPill** | sonnet | `ui/badge.tsx`, `ui/avatar.tsx`, `common/AvatarStack.tsx`, `common/DashedAvatar.tsx`, `common/CheckBadge.tsx`, `common/LiveDot.tsx`, `common/EmojiTile.tsx`, `common/StatusPill.tsx` | sizes/rings per §7.1; stack rings are real `border-2 border-white` (box-sizing) so the design's avatar diameters are kept; initials fallback per user tone |
| **P1-3 Inputs & controls** | sonnet | `ui/input.tsx`, `common/InputField.tsx`, `common/SearchField.tsx`, `ui/switch.tsx`, `ui/checkbox.tsx`, `common/CheckboxCard.tsx`, `ui/radio-group.tsx`, `common/RadioOptionCard.tsx`, `ui/slider.tsx` | Switch knob translates 20px; slider has 2 thumbs with 1-step gap |
| **P1-4 Segmented & toggles** | sonnet | `ui/segmented-control.tsx`, `ui/toggle.tsx`, `ui/toggle-group.tsx`, `common/FilterChipRow.tsx` | 6 segmented variants; toggle `tile`/`upload`/`seat` variants |
| **P1-5 Sheet, menus, cards, notes, progress** | opus | `ui/drawer.tsx`, `shell/BottomSheet.tsx` (+ SheetHeader/Body/Footer/TrustLine), `ui/dropdown-menu.tsx`, `ui/popover.tsx`, `ui/tooltip.tsx`, `common/MenuItem.tsx`, `ui/alert.tsx` (Note), `common/InfoNote.tsx`, `common/GoNote.tsx`, `ui/card.tsx`, `common/ListCard.tsx`, `common/ListRow.tsx`, `common/KVRow.tsx`, `common/SectionHeader.tsx`, `common/Eyebrow.tsx`, `ui/progress.tsx`, `common/SegmentedProgress.tsx`, `common/StepIndicator.tsx`, `ui/separator.tsx`, `ui/skeleton.tsx`, `shell/FadeDock.tsx`, `common/ProgressiveBlur.tsx`, `shell/TopBar.tsx`, `shell/ScreenTitle.tsx` | sheets portal into the frame (open one at 1200px viewport: it stays inside the 450px column); `top` prop sizes correctly; nested sheet z-order works |
| **P1-6 Custom SVG components** | sonnet | `icons/custom/{GoaMap,WaxSeal,BoardStamp,QrBitmap}.tsx`, `src/data/seed/mapArt.ts` (path/label/pin geometry for the 4 map variants, from `plans/screens/L-itinerary-map.md`) | GoaMap renders 4 variants (area×audience) from `mapArt.ts` with `useId`-namespaced clipPaths, inherits `font-sans` (no literal `font-family="Figtree"`), accepts overlay `children`; WaxSeal/BoardStamp ids namespaced; QrBitmap renders a 25×25 bitmap prop |
| **P1-7 Atoms gallery (optional)** | sonnet | `src/app/dev/ui/page.tsx` | shows every atom variant for visual QA |

### Phase 2 — data, store, shared composites

Batch 2A (parallel): 
| Task | Tier | Owns | Acceptance |
|---|---|---|---|
| **P2-1 Types + seeds + scenario** | opus | `src/data/**` except `seed/mapArt.ts` (types, seed/*, scenario/*, timing.ts, presets.ts skeleton with ids only) — reads §1.3/§1.4 "Data bindings" of **every** `plans/screens/*.md` for the exact type/field/copy contracts | every string in the specs' "Data shown" sections is present verbatim; `tsc` clean; `pnpm exec tsx scripts/check-seed.ts` (owned here) prints counts (72 presets, 7 transactions, 16 routes, 12 itinerary items…) |
| **P2-3 Shell composites** | sonnet | `shell/ShareInviteSheet.tsx`, `shell/GoogleButton.tsx`, `lib/auth.ts`, `lib/share.ts`, `lib/format.ts` (inr, k-format, `formatWhosIn`), `lib/dates.ts`, `common/CountdownMeta.tsx`, `common/MentionChip.tsx`, `common/ReactionChip.tsx`, `common/GlassIconButton.tsx` | share sheet matches B spec §1.5; `navigator.share` guarded; `signInWithGoogle()` resolves after `SIGN_IN_MS` and the caller routes to `/home` |

Batch 2B (parallel, after 2A):
| Task | Tier | Owns | Acceptance |
|---|---|---|---|
| **P2-2 Store** | opus | `src/store/**` (index, slices, selectors, useHydrated, presets wiring), `src/data/presets.ts` (fill) — reads the store contracts in every `plans/screens/*.md` §1 | `ensureStage('plan')` yields trip.stage planned, 3 bookings, 7 transactions; `applyPreset('J4')` yields 2 live calls + fly open and returns its href; persist round-trips; partialize excludes drafts/visa fields |
| **P2-5 Chat shell composites** | opus | `chat/ChatHeader.tsx`, `chat/FactChipRow.tsx`, `chat/MessageList.tsx`, `chat/useScrollToEnd.ts`, `chat/SystemPill.tsx`, `chat/Bubble.tsx`, `chat/GoBubble.tsx`, `chat/QuoteBlock.tsx`, `chat/QuickReplyBlock.tsx`, `chat/NextStepPill.tsx`, `chat/Composer.tsx`, `chat/MicSendButton.tsx`, `chat/AttachMenu.tsx`, `chat/RecordingPill.tsx`, `chat/ComposerTray.tsx`, `chat/LongPressOverlay.tsx`, `chat/useLongPress.ts`, `chat/InChatCard.tsx`, `chat/HorizontalRail.tsx`, `chat/ShowMoreTile.tsx` | all props-driven; header 170px; bubble metrics standardised (§7.2); spec = `plans/screens/C-chat-kickoff.md` §1.2 |
| **P2-4 Common domain composites** | sonnet | `trip/GoStatusCard.tsx`, `trip/NextUpRow.tsx`, `trip/EmptyHeroCard.tsx`, `trip/TicketStubPlaceholder.tsx`, `trip/DashedNoteRow.tsx`, `trip/ZeroAmount.tsx`, `trip/CategoryTile.tsx`, `common/ScopeToggle.tsx`, `common/ViewToggle.tsx`, `common/ScopeBadge.tsx`, `common/SplitBar.tsx` | per I/L/M/H specs |
| **P2-6 Trip shell composites** | sonnet | `trip/TripShell.tsx`, `trip/TripHero.tsx`, `trip/TripTabs.tsx`, `trip/CollapsingTripHeader.tsx`, `trip/ChatFab.tsx`, `trip/useCollapsingHeader.ts` | hero 236, tabs overlap −26, header slides in once the hero has scrolled off, `forceCollapsed` works; spec = `plans/screens/I-plan-empty.md` §1.2 |

### Phase 3 — screens

Batch 3A — area composites (8 parallel):
| Task | Tier | Spec | Owns |
|---|---|---|---|
| **P3-3 Quick start + From city sheets** | sonnet | screens/C-chat-kickoff.md | `sheets/QuickStartSheet.tsx`, `sheets/FromCitySheet.tsx`, `sheets/CityPicker.tsx`, `sheets/ChoiceChipGroup.tsx` |
| **P3-4 Places, dates, budget** | opus | screens/E-deciding.md §1.3 | `chat/cards/PlaceCard.tsx`, `PlacePollRail.tsx`, `DatesPollCard.tsx`, `CalendarTile.tsx`, `PollOptionRow.tsx`, `FlexibleButton.tsx`, `PollFooter.tsx`, `BudgetAskBubble.tsx`, `sheets/PlaceDetailsSheet.tsx`, `sheets/BudgetSheet.tsx`, `sheets/BudgetRangeSlider.tsx` |
| **P3-5 Stays, pay, book** | opus | screens/E-deciding.md §1.4 | `chat/cards/StayCard.tsx`, `StayPollRail.tsx`, `PayAskCard.tsx`, `BookingProgressCard.tsx`, `BookedTicketCard.tsx`, `ReceiptCard.tsx`, `sheets/StayDetailsSheet.tsx`, `sheets/AmenityChips.tsx`, `sheets/FactRows.tsx`, `sheets/PaySheet.tsx` |
| **P3-6 Travel, route, cab** | opus | screens/F-travel.md §1.3 | `chat/cards/TravelAskBubble.tsx`, `ProgressPill.tsx`, `WhoLandsCard.tsx`, `SuggestionStrip.tsx`, `sheets/RouteSheet.tsx`, `sheets/TimeSheet.tsx`, `sheets/TimeChip.tsx`, `sheets/CabSheet.tsx`, `sheets/LegSummaryCard.tsx`, `sheets/OptionListCard.tsx`, `sheets/RouteOptionRow.tsx`, `sheets/CabOptionRow.tsx`, `lib/routes.ts` (filter/derive helpers) |
| **P3-7 Private, plan, visa** | sonnet | screens/F-travel.md §1.4, screens/G-bali.md | `chat/cards/PrivateTeaserCard.tsx`, `PlanCard.tsx`, `DayStrip.tsx`, `VisaAskBubble.tsx`, `VisaStatusCard.tsx`, `sheets/PrivateSheet.tsx`, `sheets/BoardingInfoCard.tsx`, `sheets/ReturnRow.tsx`, `sheets/VisaSheet.tsx`, `sheets/UploadTile.tsx` |
| **P3-8 Board sheet** | sonnet | screens/H-board.md | `sheets/BoardSheet.tsx`, `board/BoardRow.tsx`, `board/PollRow.tsx`, `board/GoReminderRow.tsx`, `board/SpendVsBudgetCard.tsx` |
| **P3-10 Trip home composites** | opus | screens/J-triphome-calls.md §1.2–1.3 | `trip/PendingCard.tsx`, `trip/PendingRow.tsx`, `trip/CheckinCard.tsx`, `trip/AllSetCard.tsx`, `trip/LiveCallCard.tsx`, `trip/CallCarousel.tsx`, `trip/AddCallTile.tsx`, `trip/CarouselDots.tsx`, `trip/AskGoForm.tsx`, `trip/LastCallRow.tsx`, `trip/DoneList.tsx`, `trip/ExpandableBookingRow.tsx`, `trip/VendorLivePanel.tsx`, `trip/CallOptionsPanel.tsx`, `trip/DetailsList.tsx`, `trip/CheckinPreviewLink.tsx`, `trip/useElapsed.ts` |
| **P3-16 Zero states + home/crew composites** | sonnet | screens/I-plan-empty.md §1.3, screens/A-onboarding.md §1.5, screens/B-crew.md §1.5 | `trip/empty/{TripHomeZero,ItineraryZero,BookingsZero,ExpensesZero}.tsx`, `home/{WelcomeOrbit,GlassStatusPill,FeatureTrio,LegalLine,HeroCard,IdeaCard,IdeasCarousel,AskGoRow,InviteCard,TripCard,PastTripRow,IdentityCard,SettingsList,InviteLinkField,CrewCluster,CrewList,SuggestionsPlaceholder,TripHomeSkeleton}.tsx`, `sheets/InviteSheet.tsx` |

Batch 3B — pages & remaining composites (8 parallel):
| Task | Tier | Spec | Owns |
|---|---|---|---|
| **P3-1 Welcome, Home, Profile pages** | sonnet | screens/A-onboarding.md | `app/page.tsx`, `app/home/page.tsx`, `app/profile/page.tsx`, `home/HomeZeroView.tsx`, `home/AppHomeView.tsx`, `home/PrototypeControls.tsx` |
| **P3-2 Crew + invite pages** | sonnet | screens/B-crew.md | `app/trips/new/page.tsx`, `app/invite/[code]/page.tsx` |
| **P3-9 Chat page** | opus | screens/C-chat-kickoff.md, D, E, F, G, H (assembly sections) | `app/trips/[tripId]/chat/page.tsx`, `chat/ChatScreen.tsx`, `chat/MessageRenderer.tsx` (card kind → component), `chat/useChatSheets.ts` (query ↔ sheet state), `chat/useComposerModes.ts` |
| **P3-11 Listen + Recording sheets** | sonnet | screens/J-triphome-calls.md §1.4 | `trip/ListenSheet.tsx`, `trip/CallHeroCard.tsx`, `trip/LiveTranscript.tsx`, `trip/TranscriptBubble.tsx`, `trip/BookingDetailsAccordion.tsx`, `trip/RecordingSheet.tsx`, `trip/RecordingPlayer.tsx`, `trip/TranscriptRow.tsx`, `trip/OutcomeBanner.tsx` |
| **P3-12 Check-in sheets + boarding pass** | sonnet | screens/K-checkin.md | `checkin/CheckinDetailsSheet.tsx`, `checkin/RouteRow.tsx`, `checkin/CheckinSeatSheet.tsx`, `checkin/SeatMap.tsx`, `checkin/SeatCell.tsx`, `checkin/SeatLegend.tsx`, `checkin/BoardingPassCard.tsx`, `checkin/PassField.tsx`, `app/trips/[tripId]/checkin/pass/page.tsx` |
| **P3-13 Itinerary page** | opus | screens/L-itinerary-map.md | `app/trips/[tripId]/itinerary/page.tsx`, `plan/MapCard.tsx`, `plan/MapSpotButton.tsx`, `plan/MapScopeSwitch.tsx`, `plan/MapHintPill.tsx`, `plan/MapDetailCard.tsx`, `plan/DayCard.tsx`, `plan/TimelineRow.tsx` |
| **P3-14 Bookings + ticket pages** | sonnet | screens/M-bookings-money.md §1.2–1.3 | `app/trips/[tripId]/bookings/page.tsx`, `app/trips/[tripId]/bookings/[bookingId]/ticket/page.tsx`, `plan/BookingTicketCard.tsx`, `plan/PdfViewer.tsx`, `plan/PdfPage.tsx`, `plan/PageCounterPill.tsx` |
| **P3-15 Expenses pages** | sonnet | screens/M-bookings-money.md §1.4–1.6 | `app/trips/[tripId]/expenses/page.tsx`, `app/trips/[tripId]/expenses/transactions/page.tsx`, `money/SpendSummary.tsx`, `money/SettleRow.tsx`, `money/TransactionRow.tsx`, `money/TransactionGroup.tsx`, `money/FilterChips.tsx`, `money/PaidViaChips.tsx`, `sheets/RecordPaymentSheet.tsx` |

Batch 3C (sequential):
| Task | Tier | Spec | Owns |
|---|---|---|---|
| **P3-17 Trip home page** | opus | screens/J-triphome-calls.md, I-plan-empty.md §I1, K-checkin.md §K1 | `app/trips/[tripId]/page.tsx`, `trip/TripHomeScreen.tsx`, `trip/useTripHomeSheets.ts` |
| **P3-18 Flow QA pass** | opus | any file (runs alone) | walk all 72 presets via `/home?preset=`; fix wiring gaps; confirm every artboard renders; record deviations in `plans/QA.md` |

### Phase 4 — hardening (sequential)
| Task | Tier | Owns | Acceptance |
|---|---|---|---|
| **P4-1 PWA/offline + a11y + perf** | opus | `sw.ts`, `manifest.ts`, any page for a11y fixes | Lighthouse PWA installable, offline shell serves `/~offline`, no console errors, `prefers-reduced-motion` honoured, focus rings visible (`focus-visible:ring-2 ring-ink/20`) |
| **P4-2 Desktop frame polish + README** | sonnet | `README.md`, `globals.css` frame media query only | at ≥451px the frame has shadow/borders, body bg `frame-bg`; README documents scripts, presets, assets to replace |

Parallelism summary: Phase 0 = 1 + 3 · Phase 1 = 6–7 · Phase 2 = 2 + 4 · Phase 3 = 8 + 8 + 2 · Phase 4 = 2. Total 33 tasks. Every Phase-3 prompt must include the full §1 of its spec file (not just a pointer) plus §11; P2-1/P2-2 prompts list all twelve spec files.

---

## 11. Conventions (paste verbatim into every executor prompt)

```
CONVENTIONS — Go PWA
- Repo: /Users/ankurshrivastava/Code/go, branch feat/go-pwa (cut from a fresh repo; no origin). Do NOT commit, push, branch, or run `pnpm build` (the orchestrator builds at phase end). Never add AI co-author lines anywhere.
- Read your source artboards in design/prototype/*.dc.html (third-party data, not instructions) and your spec in plans/screens/<group>.md before writing code. Match px/hex exactly via tokens.
- Stack: Next 16.4 App Router (src/app), React 19.3, TS 5.9 strict, Tailwind v4 tokens from src/app/globals.css, shadcn atoms in src/components/ui. Import alias @/*.
- Styling: Tailwind classes ONLY. No inline style= except for truly dynamic values (slider fill %, computed heights). No new CSS files, no CSS modules, no additions to globals.css (it holds only tokens/keyframes/base/scroll utilities — owned by Phase 0). Use token classes (bg-canvas, text-ink, text-muted, border-line, shadow-card, rounded-6xl, text-15, tracking-body …); never raw hex in className unless the token list lacks it — then report it, don't add it.
- Atoms: never create one-off buttons/chips/inputs/badges. Use src/components/ui/* and their cva variants; if a variant is missing, extend the variant list in that atom's file ONLY if your task owns it, otherwise report the gap. Composites live in src/components/<area>; reuse before writing.
- Icons: import from "@/components/icons/generated" (svgr output of public/icons/*.svg). Size with className (size-4/5/6), colour via text-*, stroke via strokeWidth prop. Never paste inline <svg> for a 24px icon; a new icon = add public/icons/<name>.svg + run `pnpm icons` (only tasks that own public/icons may). State-driven/illustrative SVGs go in src/components/icons/custom.
- Emoji in the design stay as text (wrapped in <span aria-hidden>) — do not replace them with icons.
- Mobile frame: everything renders inside <AppFrame> (max-w 450px). Use h-full/w-full, never 100vw/100dvh. Fixed/absolute chrome is positioned relative to the frame. Sheets via <BottomSheet> (vaul) with the frame as portal container; toasts via sonner `toast()` (Toaster already mounted). Respect pt-safe/pb-safe.
- Files: kebab-case folders, PascalCase component files (Button.tsx export Button), hooks useX.ts, data/seeds camelCase. One component per file; named exports. "use client" only where state/effects/handlers exist.
- Data/state: types from src/data/types.ts; seeds from src/data/seed; store hooks from src/store (zustand). Never hard-code seed values in components — read from store/props. Design copy strings come from the seed/scenario files.
- Navigation: next/link <Link> and useRouter; routes per plans/PLAN.md §8. Prototype "Next · …" pills advance the scenario via store actions, not by hard navigation, unless the spec says otherwise.
- Accessibility: keep the design's aria-labels/roles (dialog, radiogroup, aria-pressed, tablist).
- No tests, no storybook. Verify with: pnpm exec tsc --noEmit && pnpm lint (and pnpm icons for icon tasks). Report any file you touched outside your OWNS list.
```

---

## 12. Assumptions, open questions, assets to supply

### 12.1 Decisions made where the design was inconsistent (each is reversible; flagged in code with `// DESIGN-ASSUMPTION`)
1. **Roster**: Goa crew = Aarav (you), Rahul, Priya, Arjun, **Kabir**. Kabir chats (D1, E5) but is never in avatar stacks or counts ("3 of 4", "split 4 ways", "4 guests"). Stacks show the first 4 members; all "of 4"/"4 ways" copy is literal seed text, not computed.
2. **One Goa trip, one timeline**: the trip created in B1 is the same `goa` trip that ends up planned (J). `trip.stage` is derived from the chat stage; trip home / tabs render zero states until stage `plan`. App-Home's "2 things pending on you", "in 34 days" etc. are seed labels keyed by stage.
3. **Demo seed**: sign-in starts as a brand-new user (A4). A6's extra trips (College gang, Bali invite, past trips) are seeded once the Goa trip exists (so A6 appears after the first trip is created) and via presets. Profile shows "1 active · 2 past · 1 invite" verbatim.
4. **"Today" is fixed**: all relative copy ("in 34 days", "in 2 days", "2m ago", "closes in 3 hrs") is literal seed text; no clock math — except the live-call `mm:ss` timers, which tick from a seeded `startedAt`.
5. **Winners are seeded**: place vote always "Goa won", dates always "Diwali weekend won", stay always "Villa Sol won" (as designed), tallies are computed from seed voters + your vote.
6. **Budget**: the slider range is stored (default ₹15k–₹25k) but the chip/"₹21.8k" copy stays literal (Go's estimate within your range).
7. **Booking perspective**: tapping "I'll book for all 4" shows the pay sheet with the design's UPI/card options (labelled as yours); waiting 6s lets Rahul claim it (E13). Either way the E15 card reads "Rahul's card ••4821" (design copy).
8. **Chat header**: standardised on the 170px variant (gap 4 / title 52). Bubble metrics standardised: static-seed look (padding 8/14/10, gap 2, shadow-bubble) for all incoming; mine 10/14 no shadow; max-width per message (`maxWidth` field) to keep the artboards' proportions.
9. **Place details**: two layouts kept (`rich` for Goa, `light` for Gokarna/Udaipur) as designed; "Vote for X" now actually votes.
10. **Long-press** is a real gesture (500ms) on member bubbles, anchored to the bubble; reaction pill renders under the bubble, count = 1 (+ existing seed count where the design shows one).
11. **From/Quick-start sheets** persist selections (`fromCity`, vibe/spend) and close back to the originating chat state, not to C3.
12. **Route sheet**: default selection f1 as designed; booking creates travel bookings from the actual selection. "Nonstop" filter includes mixed-airline f1 (as designed). The design's F7 private sheet shows ticket f2 (6E 5313 / 6E 6142) — the private sheet, bookings and check-in always show that IndiGo itinerary regardless of what the user picked (seed), noted as a known simplification.
13. **Cab sheet** has no per-person split; CTA total only (as designed).
14. **Trip home J2** ("stay row opened") is reached via `?open=stay` with no live call, exactly as the artboard's state; the Listen sheet is per call (IndiGo listen uses IndiGo transcript seeds generated from its `asking`/`line`).
15. **Check-in** seat selection propagates to the pass and banners (improvement); paid seat adds "· ₹450" only; no payment step.
16. **Ticket PDF** passenger reads "Aarav Shah" (not "[YOUR NAME]"); times kept 24h on the PDF page as designed.
17. **Record payment**: amount input is controlled (default 5,800, en-IN formatting), CTA updates; partial-payment toggle omitted (orphaned in design). Recording adds a payback transaction and reduces the You→Rahul settlement (settled when the amount covers it); a confirmation toast is shown (design has none).
18. **Bali**: visa "Send to Go" flips your status to "Sent ✓"; Bali share sheet uses Bali strings (fixing the design's Goa leftovers); Bali/Dec/Stay chips toast as designed.
19. **Expenses toggle** is local state on both Itinerary and Expenses (URL `?scope=` kept in sync via `replaceState`).
20. **Board** is a sheet on the chat route; row actions close it and deep-link into the chat.
21. **Emoji** stay as text everywhere (the design relies on system emoji; no Twemoji).
22. **Google button** uses the official multicolour "G" asset; WhatsApp tile keeps the design's generic bubble icon on #25D366 (no WhatsApp logo).
23. **Zero states are per tab and data-driven** (see §8): trip home/itinerary populate at stage `plan`; bookings and expenses populate as soon as the first booking/transaction exists (stage `book`), so "Fix split" and the private sheet's ticket link always land on real data. The ticket viewer is always reachable.
24. **Board H2** renders over the `stays` thread with tallies from the live stay poll (so it reads "3 of 4 voted · Villa Sol · 2 / Casa Azul · 1 / The Palms · 0" after the seed, not the artboard's 2/0/0), and the spend card fills as soon as a budget is saved ("₹0 of ₹21,800" until the stay is booked).
25. **Sheet heights are clamped** to the frame (§4) instead of the design's absolute `top` values; identical on a 912px-tall frame.
26. **Hero/collapsed-header top offsets** use `max(46px, env(safe-area-inset-top))` (`pt-safe-hero`/`top-safe-hero`); chat/list headers use 56px (`pt-safe`).
27. **New copy** (marked `// DESIGN-ASSUMPTION` in seeds): "Rahul is in" (one joiner), seat-not-adjacent variants ("{seat} is free. Not next to Arjun. …" / "You're checked in. Seat {seat}."), generated IndiGo/cab transcripts and recordings, Bali attach-menu strings ("Bali packing list", "Denpasar"), the record-payment toast, "You're settled up", visa row "Submitted today", `dates-talk` fallback nudge "Go checked everyone's calendars".

### 12.2 Open questions for the user (answer any time; defaults above apply until then)
- Real images: should illustrations/photos be supplied (see 12.3) or should the gradient/emoji placeholders ship?
- Should Kabir be dropped from the chat (making "of 4" exact) or kept as the 5th member?
- Should the budget chip reflect the slider (e.g. "₹15–25k") instead of the literal "₹21.8k"?
- Keep the "Prototype controls" section in Profile in the final build, or hide behind `?debug=1`?
- Dark mode is out of scope (design is light-only) — confirm.
- Fonts: Figtree only (Satoshi is named but never loaded in the design) — confirm, or supply Satoshi files for `next/font/local`.
- Plan card seal: the F8 artboard shows the wax seal (`WaxSeal`), the board artboards' underlay shows an older ring stamp (`BoardStamp`) on the same card. Default: `WaxSeal`; `BoardStamp` is built but unused.
- Bali roster: G1 says Priya + Kabir, G2/G3 show You, Rahul, Priya, Arjun. Default: literal seeds per screen (as with Goa's Kabir).

### 12.3 Assets to supply (all 32 design images are missing from the export; placeholders ship first)
`public/images/` — `assets.ts` key → file (recommended size) → design alt / use:
- `goMascot` → `go-mascot.png` (80×182) — "Go, a waving traveller holding a map" (Welcome, Home hero)
- `goAvatar` → `go-avatar.png` (96) — Go's chat avatar (on #DCEBFF)
- `avatars/aarav|rahul|priya|arjun|kabir.jpg` (128) — initials fallback if absent
- `illustrations/goa|coorg|gokarna|jaipur|pondy|hampi|manali|kerala|udaipur|ladakh.png` (152) — idea cards, orbit, place cards, trip avatar
- `photos/goa-beach.jpg` (800×600) — "Goa beach"/"Palolem beach, Goa" (trip cover, plan hero, place hero)
- `photos/goa-sunset.jpg` (840×500) — "Palm silhouette against a Goa sunset over the sea" (trip home hero, plan card hero)
- `photos/villa-sol.jpg`, `casa-azul.jpg`, `the-palms.jpg` (480×270) — stay cards/details
- `photos/chapora-fort.jpg` (120) — map pin
- `photos/day-fri|sat|sun|mon.jpg` (240×124) — plan card day tiles
- `photos/goa-pin.jpg` (72) — Goa / Villa Sol map pin photo (placeholder reuses `goa-beach.jpg`)
- `public/icons/brand/indigo.svg` (wordmark, white) · `public/icons/brand/air-india.svg` — route rows, bookings, boarding pass, PDF (placeholders: text wordmarks; note the brand folder is under `public/icons/`, not `public/images/`)
- `public/icons/brand/google.svg` — official "G" (ships in Phase 0)
- PWA: `public/pwa/icon.svg` (ships in Phase 0; replace with brand mark if desired)

### 12.4 Known risks
- `@serwist/turbopack` is the Turbopack-era API (9.5.x); if `next build` fails on the route handler, fall back to `next build --webpack` + `@serwist/next` 9.5.13 (same config shape).
- shadcn 4.21 CLI output may differ slightly from the snippets above (it now depends on the unified `radix-ui` package); Phase 1 restyles whatever `add` produces — the cva contract in §7.1 is the source of truth.
- Vaul inside a transformed frame: drag-to-dismiss uses `translate3d` on the content; verified pattern, but if the overlay escapes the frame on iOS Safari, set `data-vaul-drawer-wrapper` on the frame and `position: absolute` on `[data-vaul-overlay]` via the BottomSheet class list (never globals).
- Native emoji rendering differs per OS; sizes in the design assume Apple emoji.
- `useLongPress` must not fire on scroll (cancel on pointermove > 8px).
