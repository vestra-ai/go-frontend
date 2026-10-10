# Go

Go is a mobile-first group-trip planner. A friend group sets up a trip in a chat with "Go", an assistant that proposes dates, places, stays, travel and a budget, and the crew decides together. From there the trip gets a home screen, itinerary, bookings, shared expenses and web check-in. The app talks to the Go Server over HTTP plus one WebSocket, exactly as `docs/CONTRACT-APP.md` (rev 4) describes; sign-in is Supabase Auth. It is built as an installable PWA that renders inside a 450px phone-width frame, centered on desktop.

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

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon key (and, for the dev stack, the Server's base URL). The origin you run on must be in the Server's `APP_ORIGINS`, and `<origin>/auth/callback` must be an allowed redirect URL in the Supabase project.

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
| `/auth/callback` | where Supabase sends the browser back after Google |
| `/home` | `home/page.tsx` (app home) |
| `/profile` | `profile/page.tsx` |
| `/invite/[code]` | the invite link (`/j/[code]`, the shape the contract names, opens the same screen) |
| `/trips/new` | `trips/new/page.tsx` (invite the crew) |
| `/trips/[tripId]` | `trips/[tripId]/page.tsx` (trip home) |
| `/trips/[tripId]/chat` | chat with Go |
| `/trips/[tripId]/itinerary` | itinerary |
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
- `src/api`: the Server contract. `contract.ts` (wire shapes), `http.ts` (bearer token, `Idempotency-Key`, error body, one refresh on 401), `endpoints.ts` (all 70 routes), `live.ts` (the WebSocket: ticket, subscribe, reconnect), `env.ts`.
- `src/state`: what the app holds of the Server's data. `store.ts` (zustand + immer, nothing persisted), `actions.ts` (every read and write), `sync.ts` (session, live frames, re-read on resume), `hooks.ts`, and the `*View.ts` adapters that turn contract objects into what the components draw.
- `src/data`: view-model types, UI copy and static config (`seed/*`), timing constants. No trip data lives here.
- `src/lib`: helpers (`auth`, `supabase`, `links`, `share`, `assets`, `format`, `dates`, `routes`, `toast`, `utils`).

## Design rules

- Atoms first: build in `src/components/ui` with `cva` variants, then compose.
- Tailwind only. No inline style objects or CSS modules for look and feel.
- `src/app/globals.css` holds tokens (`@theme`), base resets and a few global utilities only. No component styling.
- Mobile only. The app lives in `#app-frame`, max 450px wide, at least one viewport tall, and it grows with its content: the document (body) is the only page scroller. Headers are `sticky top-0` (z-30); bottom docks (`FadeDock`, FABs, action bars) go in a `StickyDock`, a zero-height `sticky bottom-0` rail at the end of the `Screen`. Only a long list of cards may own a scroll (a horizontal rail, a sheet body), and a rail bleeds through the page padding (`-mx-4 px-4`). Sheets, menus, tooltips and toasts portal into `#overlay-layer`, a fixed 450px column whose transform contains them. Top insets use `pt-safe` / `pt-safe-hero` (safe-area inset + a small gap), never a fixed 46–60px. Use `min-h-dvh`, not `h-full`. At 451px and wider the frame is centered with a shadow and hairline borders on the `frame-bg` background.

## Auth and sharing

- `src/lib/auth.ts`: the one place that touches the Supabase session. `signInWithGoogle(next)` starts the PKCE redirect; the browser comes back to `/auth/callback`, which routes on to `next`. Every Server call carries the session's access token; a 401 refreshes once, then signs out.
- `src/lib/share.ts`: invites use the Web Share API (`navigator.share`) when available and fall back to `https://wa.me/?text=...`; copy-link uses the Clipboard API.

## Assets to replace

The app's own art (Go's mascot, the destination illustrations used when a trip has no photo) is SVG under `public/images`, mapped in `src/lib/assets.ts`. People's photos, destination and stay photos and carrier wordmarks come from the Server. Swap files in place and keep the key and dimensions (update the extension in `assets.ts` if you switch to PNG/JPG).

- `go-mascot` (80x182) and `go-avatar` (96): Go's mascot and chat avatar.
- `avatars/aarav|rahul|priya|arjun|kabir` (128).
- `illustrations/goa|coorg|gokarna|jaipur|pondy|hampi|manali|kerala|udaipur|ladakh` (152).
- `photos/goa-beach` (800x600), `photos/goa-sunset` (840x500).
- `photos/villa-sol|casa-azul|the-palms` (480x270), `photos/chapora-fort` (120), `photos/goa-pin` (72).
- `photos/day-fri|sat|sun|mon` (240x124).
- `public/icons/brand/indigo.svg`, `air-india.svg` (airline wordmarks, currently text placeholders) and `google.svg` (official "G").
- `public/pwa/icon.svg`: the PWA icon source; rerun `pnpm pwa:icons` after changing it.

## PWA

Serwist (`@serwist/turbopack`) serves the worker from `/serwist/sw.js` (`src/app/sw.ts`), with an offline fallback at `/~offline`. The Server's answers and Supabase are never cached by the worker. The `SerwistProvider` is disabled outside production, so the service worker only runs after `pnpm build && pnpm start`.
