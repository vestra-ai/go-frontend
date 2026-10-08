# Go

Go is a mobile-first group-trip planner prototype. A friend group sets up a trip in a chat with "Go", an assistant that proposes dates, places, stays, travel and a budget, and the crew decides together. From there the trip gets a home screen, itinerary and map, bookings, shared expenses and web check-in. Everything runs on seeded mock data and a scripted chat scenario in a local zustand store, with no backend. It is built as an installable PWA that renders inside a 450px phone-width frame, centered on desktop.

## Stack

| Piece | Version |
| --- | --- |
| Next.js (App Router, Turbopack) | 16.4.0 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| Tailwind CSS (+ `@tailwindcss/postcss`) | 4.3.3 |
| radix-ui / vaul (sheets) / sonner (toasts) | 1.7.0 / 1.1.2 / 2.0.8 |
| class-variance-authority, clsx, tailwind-merge | 0.7.1, 2.1.1, 3.7.0 |
| zustand + immer | 5.0.15 + 11.1.21 |
| Serwist (`serwist`, `@serwist/turbopack`) | 9.5.13 |
| @svgr/cli (icon pipeline) | 8.1.0 |
| ESLint | 10.12.0 |
| pnpm | 12.8.1 |

## Getting started

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm build && pnpm start # production build (the service worker is only active here)
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | `next dev` |
| `pnpm build` | `next build` |
| `pnpm start` | `next start` |
| `pnpm lint` | `eslint` |
| `pnpm typecheck` | `next typegen && tsc --noEmit` |
| `pnpm icons` | Regenerates `src/components/icons/generated` from `public/icons/*.svg` with svgr |
| `pnpm pwa:icons` | Runs `scripts/pwa-icons.mjs` to build the PWA icon set from `public/pwa/icon.svg` |

### Icon pipeline

1. Drop a `.svg` (kebab-case name) into `public/icons`.
2. Run `pnpm icons`. It wipes and rebuilds `src/components/icons/generated`, one PascalCase component per file, using `svgr.config.js` (1em sizing, palette colors mapped to `currentColor`). The `brand` subfolder is excluded from the output.
3. Import from `@/components/icons/generated`, for example `import { ArrowLeft } from "@/components/icons/generated"`, and size/color with `className`.

Icons that depend on state (animated or data-driven, such as `AudioBars`, `Spinner`, `WaxSeal`, `QrBitmap`, `GoaMap`) are hand-written in `src/components/icons/custom` and are not touched by svgr. Do not edit files under `generated/`.

## Project structure

### Routes (`src/app`)

| Route | File |
| --- | --- |
| `/` | `page.tsx` (welcome / sign-in) |
| `/home` | `home/page.tsx` (app home; handles `?preset=`) |
| `/profile` | `profile/page.tsx` (includes Prototype controls) |
| `/invite/[code]` | `invite/[code]/page.tsx` |
| `/trips/new` | `trips/new/page.tsx` (invite the crew) |
| `/trips/[tripId]` | `trips/[tripId]/page.tsx` (trip home) |
| `/trips/[tripId]/chat` | chat with Go |
| `/trips/[tripId]/itinerary` | itinerary and map |
| `/trips/[tripId]/bookings` | bookings |
| `/trips/[tripId]/bookings/[bookingId]/ticket` | ticket |
| `/trips/[tripId]/expenses` | expenses |
| `/trips/[tripId]/expenses/transactions` | transactions |
| `/trips/[tripId]/checkin/pass` | boarding pass |
| `/~offline` | offline fallback |

`manifest.ts`, `sw.ts` and `serwist/[path]` are the PWA plumbing.

### Source folders

- `src/components/ui`: atoms (button, chip, input, switch, tabs, ...), built first.
- `src/components/shell`: `AppFrame`, `Screen`, `TopBar`, `BottomSheet`, `FadeDock`, `StickyDock`, share and sign-in pieces.
- `src/components/common`: shared composites used across screens.
- `src/components/chat`, `sheets`, `trip`, `home`, `plan`, `money`, `checkin`, `board`: per-feature sections.
- `src/components/icons`: `generated/` (svgr output) and `custom/` (hand-written).
- `src/store`: zustand + immer store (slices, selectors, persistence, timers, presets).
- `src/data`: types, seed data, the chat scenario engine, timing constants, demo presets.
- `src/lib`: helpers (`auth`, `share`, `assets`, `format`, `dates`, `routes`, `toast`, `utils`).

## Design rules

- Atoms first: build in `src/components/ui` with `cva` variants, then compose.
- Tailwind only. No inline style objects or CSS modules for look and feel.
- `src/app/globals.css` holds tokens (`@theme`), base resets and a few global utilities only. No component styling.
- Mobile only. The app lives in `#app-frame`, max 450px wide, at least one viewport tall, and it grows with its content: the document (body) is the only page scroller. Headers are `sticky top-0` (z-30); bottom docks (`FadeDock`, FABs, action bars) go in a `StickyDock`, a zero-height `sticky bottom-0` rail at the end of the `Screen`. Only a long list of cards may own a scroll (a horizontal rail, a sheet body), and a rail bleeds through the page padding (`-mx-4 px-4`). Sheets, menus, tooltips and toasts portal into `#overlay-layer`, a fixed 450px column whose transform contains them. Top insets use `pt-safe` / `pt-safe-hero` (safe-area inset + a small gap), never a fixed 46–60px. Use `min-h-dvh`, not `h-full`. At 451px and wider the frame is centered with a shadow and hairline borders on the `frame-bg` background.

## Demo presets

Open `/home?preset=<ID>` (handled once), or use Profile, Prototype controls, "Jump to artboard" (and "Reset demo" to clear the persisted store). Every preset resets to the initial store, then applies its state and redirects to its route. Defined in `src/data/presets.ts`; the id letter is the group:

- A Sign in and app home
- B Invite the crew
- C Chat kickoff
- D Message actions
- E Deciding together
- F Travel, private answer, plan
- G Bali invite
- H Trip board
- I Trip plan, nothing decided
- J Trip home and calls
- K Web check-in
- L Itinerary and map
- M Bookings and expenses

Example: `/home?preset=J1`.

## Auth and sharing

- `src/lib/auth.ts`: `signInWithGoogle()` is a stub that resolves after a short delay. TODO: real Google OAuth. Keep the signature; callers await it and then route to `/home`.
- `src/lib/share.ts`: invites use the Web Share API (`navigator.share`) when available and fall back to `https://wa.me/?text=...`; copy-link uses the Clipboard API.

## Assets to replace

All images are SVG placeholders under `public/images`, mapped in `src/lib/assets.ts`. Swap files in place and keep the key and dimensions (update the extension in `assets.ts` if you switch to PNG/JPG).

- `go-mascot` (80x182) and `go-avatar` (96): Go's mascot and chat avatar.
- `avatars/aarav|rahul|priya|arjun|kabir` (128).
- `illustrations/goa|coorg|gokarna|jaipur|pondy|hampi|manali|kerala|udaipur|ladakh` (152).
- `photos/goa-beach` (800x600), `photos/goa-sunset` (840x500).
- `photos/villa-sol|casa-azul|the-palms` (480x270), `photos/chapora-fort` (120), `photos/goa-pin` (72).
- `photos/day-fri|sat|sun|mon` (240x124).
- `public/icons/brand/indigo.svg`, `air-india.svg` (airline wordmarks, currently text placeholders) and `google.svg` (official "G").
- `public/pwa/icon.svg`: the PWA icon source; rerun `pnpm pwa:icons` after changing it.

## PWA

Serwist (`@serwist/turbopack`) serves the worker from `/serwist/sw.js` (`src/app/sw.ts`), with an offline fallback at `/~offline`. The `SerwistProvider` is disabled outside production, so the service worker only runs after `pnpm build && pnpm start`.
