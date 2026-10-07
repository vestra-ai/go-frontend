# QA — P3-18 flow pass

Branch `feat/go-pwa` (base `f5a306b`), shared dev server `http://localhost:3200`, headless Chromium (playwright-core 1.63) with the Next dev-tools badge hidden. Run on 2026-10-08.

## Results at a glance

| Check | Result |
|---|---|
| 72 presets at 420×912 (`/home?preset=<id>`) | **72/72 PASS** |
| Representative subset at 360×912 | **41/41 PASS** |
| Desktop 1280×900 (centred ≤450 px column, nothing escapes) | **26/26 PASS** |
| End-to-end click-through, part 1 (Welcome → plan) | **35/35 OK** |
| End-to-end click-through, part 2 (trip home → Bali visa → sign out) | **41/41 OK** |
| Internal links rendered on any preset page (28 unique) | **28/28 resolve**, no 404 / not-found |
| Dead-click audit (457 controls clicked, each on a fresh preset) | 449 had a visible effect; the 8 without one are explained below |
| `pnpm exec tsc --noEmit` · `pnpm lint` | 0 errors · 0 warnings |
| `scripts/check-store.ts` · `scripts/check-seed.ts` | pass · pass |

## How each preset is checked

Each preset opens at `/home?preset=<id>` on a clean page. The run then waits for the redirect and checks six things:

1. **URL.** The landing path matches the preset `href`, and every query param in the `href` is present with the same value.
2. **Errors.** There are zero console errors, zero `pageerror`s, and zero same-origin HTTP ≥400 responses.
3. **Key copy.** Two to six strings taken from that artboard's `design/prototype/P-*.dc.html` are present in the rendered text.
4. **Frame.** Every visible dialog, vaul overlay, toast, fade dock and `position:fixed` element sits inside `#app-frame`, both in the DOM and in its bounding box.
5. **Images.** No `<img>` is broken: no image has `complete && naturalWidth === 0`.
6. **Overflow.** The page never scrolls horizontally.

A separate coverage pass compared every design string per artboard with the rendered text. Every string it reported missing turned out to belong to a hidden state of the same artboard file: the attach menu, the share sheet, the other scope, the list under the map, or a closed form. The only other misses are the copy deviations listed below.

## Presets (id → title → URL → result)

"–" = not part of that viewport's subset.

| # | Id | Title | URL (landed) | 420 | 360 | 1280 | Notes |
|---|---|---|---|---|---|---|---|
| 1 | A1 | Welcome | `/` | PASS | PASS | PASS |  |
| 2 | A4 | Home, first sign-up · ideas carousel | `/home` | PASS | PASS | PASS |  |
| 3 | A5 | Profile · first sign-up · new | `/profile` | PASS | – | – |  |
| 4 | A6 | App home · your trips + invites | `/home` | PASS | PASS | PASS | Goa card stack now You · Rahul · Priya · Arjun (was 3) — fix 3c |
| 5 | A7 | Profile · from app home · new | `/profile` | PASS | – | – |  |
| 6 | B1 | Who’s coming, empty | `/trips/new` | PASS | – | – |  |
| 7 | B2 | Share sheet · invite link · new | `/trips/new?sheet=share` | PASS | PASS | PASS |  |
| 8 | B6 | Who’s coming, link | `/trips/new?joined=2` | PASS | PASS | – |  |
| 9 | B7 | Friend taps the link · join Goa crew · updated | `/invite/goa-k7q` | PASS | – | – |  |
| 10 | C1 | Quick start · cities in one line, Other city searches inline · updated | `/trips/goa/chat` | PASS | PASS | PASS |  |
| 11 | C2 | Go opens · variant A | `/trips/goa/chat` | PASS | – | – | From chip reads “Bengaluru ✓” after Quick start (design shows “From?”) — PLAN §9.3 |
| 12 | C3 | After skipping quick start | `/trips/goa/chat` | PASS | – | – |  |
| 13 | C4 | From sheet · cities in one line + Other city · updated | `/trips/goa/chat?sheet=from` | PASS | – | PASS |  |
| 14 | C5 | From sheet · Other city expanded with search · updated | `/trips/goa/chat?sheet=from&q=Ind` | PASS | PASS | – | One clear “×” (native search cancel hidden) — fix 3a |
| 15 | D1 | Long-press · reactions and copy work · updated | `/trips/goa/chat?mode=longpress&msg=dt-arjun` | PASS | PASS | PASS |  |
| 16 | D2 | Replying · send posts the reply · updated | `/trips/goa/chat?mode=reply&msg=dt-arjun` | PASS | – | – |  |
| 17 | D3 | Ask Go · suggestions fill the box · updated | `/trips/goa/chat?mode=askGo&msg=dt-arjun` | PASS | – | – |  |
| 18 | E1 | Go suggests places | `/trips/goa/chat` | PASS | PASS | – |  |
| 19 | E2 | Place details | `/trips/goa/chat?sheet=place&id=goa` | PASS | PASS | PASS |  |
| 20 | E3 | Place details · Gokarna · new | `/trips/goa/chat?sheet=place&id=gokarna` | PASS | – | – |  |
| 21 | E4 | Place details · Udaipur · new | `/trips/goa/chat?sheet=place&id=udaipur` | PASS | – | – |  |
| 22 | E5 | Dates poll + I’m flexible | `/trips/goa/chat` | PASS | – | – |  |
| 23 | E6 | Budget ask | `/trips/goa/chat` | PASS | – | – |  |
| 24 | E7 | Budget sheet · min–max slider | `/trips/goa/chat?sheet=budget` | PASS | PASS | PASS |  |
| 25 | E8 | Go suggests stays | `/trips/goa/chat` | PASS | – | – |  |
| 26 | E9 | Stay details · Villa Sol · new | `/trips/goa/chat?sheet=stay&id=sol` | PASS | PASS | – |  |
| 27 | E10 | Stay details · Casa Azul · new | `/trips/goa/chat?sheet=stay&id=azul` | PASS | – | – |  |
| 28 | E11 | Stay details · The Palms · new | `/trips/goa/chat?sheet=stay&id=palms` | PASS | – | – |  |
| 29 | E12 | One person books | `/trips/goa/chat` | PASS | – | – |  |
| 30 | E13 | Others see who’s booking | `/trips/goa/chat` | PASS | – | – |  |
| 31 | E14 | Payment sheet | `/trips/goa/chat?sheet=pay` | PASS | PASS | PASS |  |
| 32 | E15 | Booking the stay | `/trips/goa/chat` | PASS | PASS | – | Booking sequence plays once (~3.3 s); copy asserted after it settles |
| 33 | F1 | Travel ask | `/trips/goa/chat` | PASS | – | – |  |
| 34 | F2 | Route sheet · BLR ⇄ GOA, flight / train / bus, filters · updated | `/trips/goa/chat?sheet=route` | PASS | PASS | PASS | Travel-ask bubble keeps F1’s copy (“Add where you’re coming from…”); F2/F3 artboards say “Add your travel…” |
| 35 | F3 | Preferred time slots · onward and return · new | `/trips/goa/chat?sheet=route` | PASS | PASS | – | Same bubble-copy note as F2 |
| 36 | F4 | Who lands when · cab Book opens a sheet | `/trips/goa/chat` | PASS | PASS | – |  |
| 37 | F5 | Cab sheet · All / Sedan / SUV, total price · updated | `/trips/goa/chat?sheet=cab` | PASS | PASS | PASS |  |
| 38 | F6 | Private answer in group | `/trips/goa/chat` | PASS | – | – |  |
| 39 | F7 | Just-for-me sheet | `/trips/goa/chat?sheet=private` | PASS | PASS | – | Go line keeps F6’s “flight and money details” (F7 artboard: “flight details”) |
| 40 | F8 | Go’s final plan | `/trips/goa/chat` | PASS | PASS | – |  |
| 41 | G1 | Bali invite from app home · join · new | `/invite/bali-x9m` | PASS | PASS | – |  |
| 42 | G2 | Visa ask | `/trips/bali/chat` | PASS | – | – |  |
| 43 | G3 | Visa details sheet | `/trips/bali/chat?sheet=visa` | PASS | PASS | PASS |  |
| 44 | H1 | Board, empty | `/trips/goa/chat?sheet=board` | PASS | – | – |  |
| 45 | H2 | Board, stay poll open | `/trips/goa/chat?sheet=board` | PASS | PASS | – | Underlay is the `stays` thread with live tallies (PLAN §12.1 #24), not the artboard’s plan card |
| 46 | H3 | Board · Go reminds you to book your return | `/trips/goa/chat?sheet=board` | PASS | PASS | PASS |  |
| 47 | I1 | Home, empty | `/trips/goa` | PASS | PASS | PASS |  |
| 48 | I2 | Itinerary, empty | `/trips/goa/itinerary` | PASS | – | – |  |
| 49 | I3 | Bookings, empty | `/trips/goa/bookings` | PASS | – | – |  |
| 50 | I4 | Expenses, empty · everyone | `/trips/goa/expenses?scope=everyone` | PASS | PASS | – |  |
| 51 | I5 | Expenses, empty · just me | `/trips/goa/expenses?scope=me` | PASS | – | – |  |
| 52 | J1 | Home · one live call, full width · updated | `/trips/goa` | PASS | PASS | PASS | Hero placeholder no longer draws “Goa sunset” under the title — coordinator item |
| 53 | J2 | Home · stay row opened · call options + details · new | `/trips/goa?open=stay` | PASS | – | – |  |
| 54 | J3 | Home · flights row opened · call options + details · new | `/trips/goa?open=fly` | PASS | – | – |  |
| 55 | J4 | Home · tapped Call IndiGo · 2 calls, swipe · updated | `/trips/goa?open=fly` | PASS | PASS | – |  |
| 56 | J5 | Listening in · booking details, mute, take over, end · updated | `/trips/goa?sheet=listen&call=villa` | PASS | PASS | PASS | Live clock ticks from the seeded start (artboard 01:34) |
| 57 | J6 | Home · all done · last call recording | `/trips/goa` | PASS | – | – |  |
| 58 | J7 | Call recording · outcome, player, transcript | `/trips/goa?sheet=recording&call=villa` | PASS | PASS | PASS |  |
| 59 | K1 | Home · web check-in open, 2 days before | `/trips/goa` | PASS | PASS | – |  |
| 60 | K2 | Check-in 1 · details | `/trips/goa?sheet=checkin&step=details` | PASS | – | – |  |
| 61 | K3 | Check-in 2 · seat next to Arjun | `/trips/goa?sheet=checkin&step=seat` | PASS | PASS | PASS | “Check in with seat …” keeps the sheet up until the pass renders — fix 3d |
| 62 | K4 | Check-in 3 · boarding pass | `/trips/goa/checkin/pass` | PASS | PASS | PASS |  |
| 63 | L1 | Itinerary · everyone · full-height map, route tapped | `/trips/goa/itinerary?scope=everyone&view=map&area=trip&sel=blr` | PASS | PASS | PASS | ≤390 px: Everyone avatars drop so the view toggle fits |
| 64 | L2 | Itinerary · just me · list, same map on toggle | `/trips/goa/itinerary?scope=me&view=list&area=trip&sel=none` | PASS | PASS | – | Same toolbar note as L1 |
| 65 | L3 | Itinerary map · In Goa · Villa Sol tapped | `/trips/goa/itinerary?scope=everyone&view=map&area=goa&sel=villa` | PASS | PASS | PASS | Same toolbar note as L1; re-tapping the selected pin is a no-op (spec) |
| 66 | M1 | Bookings · booked only | `/trips/goa/bookings` | PASS | PASS | PASS | Titles wrap to 2 lines at narrow widths instead of truncating |
| 67 | M2 | Bookings · scrolled, header collapsed | `/trips/goa/bookings?collapsed=1` | PASS | – | – |  |
| 68 | M3 | Ticket PDF viewer | `/trips/goa/bookings/travel-out/ticket` | PASS | PASS | PASS | Passenger “Aarav Shah” instead of “[YOUR NAME]” (PLAN §12.1 #16) |
| 69 | M4 | Expenses · everyone + transactions | `/trips/goa/expenses` | PASS | PASS | – |  |
| 70 | M5 | Expenses · just me + transactions | `/trips/goa/expenses?scope=me` | PASS | – | – |  |
| 71 | M6 | All transactions · filters work · updated | `/trips/goa/expenses/transactions` | PASS | PASS | PASS |  |
| 72 | M7 | Record a payment | `/trips/goa/expenses?scope=me&sheet=record` | PASS | PASS | PASS |  |


## End-to-end walk (clicks only, no presets)

Part 1 starts from a cleared store. Part 2 restores the store that part 1 ended with and carries on from the trip home. Nothing else is injected. The Bali invite → visa flow is steps 34–39 of part 2.

**Part 1 — Welcome → Goa plan (fresh store, clicks only): 35/35 steps OK**

| # | Step | Landed on | Result |
|---|---|---|---|
| 1 | Open Welcome (A1) | `/` | OK |
| 2 | Terms → toast | `/` | OK |
| 3 | Continue with Google → /home (A4) | `/home` | OK |
| 4 | Create a trip → /trips/new (B1) | `/trips/new` | OK |
| 5 | Share in WhatsApp group → share sheet (B2) | `/trips/new` | OK |
| 6 | Copy link tile → toast, sheet closes | `/trips/new` | OK |
| 7 | Wait for Rahul + Priya to join (B6) | `/trips/new` | OK |
| 8 | Next · open trip chat → chat, quick start opens (C1) | `/trips/goa/chat` | OK |
| 9 | Quick start: Beach, ₹15–25k, Bengaluru, Done (C2) | `/trips/goa/chat` | OK |
| 10 | Tap 🏖️ Beach → places (E1) | `/trips/goa/chat` | OK |
| 11 | Place Details → Goa sheet (E2) | `/trips/goa/chat?sheet=place&id=goa` | OK |
| 12 | Vote for Goa → closes, pill | `/trips/goa/chat` | OK |
| 13 | Pill → dates talk (D1 state) | `/trips/goa/chat` | OK |
| 14 | Long-press Arjun → overlay (D1) | `/trips/goa/chat?mode=longpress&msg=dt-arjun` | OK |
| 15 | Reply → reply mode (D2) → send | `/trips/goa/chat` | OK |
| 16 | Vote Diwali (E5) → pill | `/trips/goa/chat` | OK |
| 17 | Pill → budget ask (E6) | `/trips/goa/chat` | OK |
| 18 | Add my budget → budget sheet (E7) | `/trips/goa/chat?sheet=budget` | OK |
| 19 | Save my range → in-sheet pill | `/trips/goa/chat?sheet=budget` | OK |
| 20 | In-sheet pill → stays (E8) | `/trips/goa/chat` | OK |
| 21 | Stay Details → stay sheet (E9–E11; the walk opened The Palms) | `/trips/goa/chat?sheet=stay&id=palms` | OK |
| 22 | Vote for stay → pill Villa Sol won (winners are seeded, PLAN §12.1 #5) | `/trips/goa/chat` | OK |
| 23 | Pill → pay ask (E12) | `/trips/goa/chat` | OK |
| 24 | I’ll book for all 4 → pay sheet (E14) | `/trips/goa/chat?sheet=pay` | OK |
| 25 | Pay & book → booking progress (E15) | `/trips/goa/chat` | OK |
| 26 | Pill Next · how everyone gets there → travel (F1) | `/trips/goa/chat` | OK |
| 27 | Add my travel details → route sheet (F2) | `/trips/goa/chat?sheet=route` | OK |
| 28 | Time chip → preferred times (F3), pick Evening, apply | `/trips/goa/chat?sheet=route` | OK |
| 29 | Book round trip → who lands (F4) | `/trips/goa/chat` | OK |
| 30 | Cab Book → cab sheet (F5) → Book both rides | `/trips/goa/chat` | OK |
| 31 | Pill → private (F6) | `/trips/goa/chat` | OK |
| 32 | View my details → private sheet (F7) | `/trips/goa/chat?sheet=private` | OK |
| 33 | Close private sheet | `/trips/goa/chat` | OK |
| 34 | Pill → plan (F8) | `/trips/goa/chat` | OK |
| 35 | Plan Open → trip home | `/trips/goa` | OK |

**Part 2 — trip home → Bali visa → sign out (continues from part 1’s saved store): 41/41 steps OK**

| # | Step | Landed on | Result |
|---|---|---|---|
| 1 | Restore story state → trip home | `/trips/goa` | OK |
| 2 | Listen in → listen sheet (J5) | `/trips/goa?sheet=listen&call=villa` | OK |
| 3 | Mute → Unmute label + note | `/trips/goa?sheet=listen&call=villa` | OK |
| 4 | Take over → Hand back | `/trips/goa?sheet=listen&call=villa` | OK |
| 5 | End call → sheet closes, last call row | `/trips/goa` | OK |
| 6 | Recording pill → recording sheet (J7) | `/trips/goa?sheet=recording&call=villa` | OK |
| 7 | Play → pause toggles | `/trips/goa?sheet=recording&call=villa` | OK |
| 8 | Close recording sheet (Escape) | `/trips/goa` | OK |
| 9 | Stay row → expands (J2) with call options | `/trips/goa?open=stay` | OK |
| 10 | Pick chip + Call → live call starts | `/trips/goa?open=stay` | OK |
| 11 | Flights row → expands (J3), Preview check-in | `/trips/goa` | OK |
| 12 | Check in now → details sheet (K2) | `/trips/goa?sheet=checkin&step=details` | OK |
| 13 | Continue to seats → seat sheet (K3) | `/trips/goa?sheet=checkin&step=seat` | OK |
| 14 | Tap taken 14C → toast; pick 15B → CTA updates | `/trips/goa?sheet=checkin&step=seat` | OK |
| 15 | Check in → pass (K4) with no sheet slide-out | `/trips/goa/checkin/pass` | OK — 5 frames before the pass, sheet stayed open |
| 16 | Save to wallet → toast | `/trips/goa/checkin/pass` | OK |
| 17 | Download → ticket viewer (M3) | `/trips/goa/bookings/travel-out/ticket` | OK |
| 18 | Ticket close → bookings (M1) | `/trips/goa/bookings` | OK |
| 19 | Stay booking card → trip home ?open=stay | `/trips/goa?open=stay` | OK |
| 20 | Bookings tab → travel card → ticket | `/trips/goa/bookings/travel-out/ticket` | OK |
| 21 | Back to trip → Itinerary tab (L1 map) | `/trips/goa/itinerary?scope=everyone&view=map&area=trip&sel=blr` | OK |
| 22 | Tap a route pin → detail card | `/trips/goa/itinerary?scope=everyone&view=map&area=trip&sel=blr` | OK |
| 23 | Flight details → trip home ?open=fly | `/trips/goa?open=fly` | OK |
| 24 | Itinerary → Just me list (L2) | `/trips/goa/itinerary?scope=me&view=list&area=trip&sel=none` | OK |
| 25 | Map view → In Goa → Villa Sol pin (L3) → Directions toast | `/trips/goa/itinerary?scope=me&view=map&area=goa&sel=villa` | OK |
| 26 | Expenses tab (M4) | `/trips/goa/expenses` | OK |
| 27 | Nudge → toast | `/trips/goa/expenses` | OK |
| 28 | Record → record sheet (M7) → Record ₹5,800 | `/trips/goa/expenses` | OK |
| 29 | See all → transactions (M6), filter Paybacks | `/trips/goa/expenses/transactions?scope=everyone` | OK |
| 30 | Record a payment → expenses ?scope=me&sheet=record | `/trips/goa/expenses?scope=me` | OK |
| 31 | Edit budget → chat budget sheet | `/trips/goa/chat` | OK |
| 32 | Chat back → trip home → Chat FAB → chat | `/trips/goa/chat` | OK |
| 33 | Board icon → board sheet | `/trips/goa/chat` | OK |
| 34 | Header back → trip home → back → /home (A6) | `/home` | OK |
| 35 | Bali invite Accept → /invite/bali-x9m (G1) | `/invite/bali-x9m` | OK |
| 36 | Accept & join → Bali chat (G2) | `/trips/bali/chat` | OK |
| 37 | Bali chip → toast | `/trips/bali/chat` | OK |
| 38 | Add my passport details → visa sheet (G3) | `/trips/bali/chat?sheet=visa` | OK |
| 39 | Upload passport + photo, fill fields, Send to Go | `/trips/bali/chat` | OK — 4 inputs |
| 40 | Bali chat Back → /home → avatar → Profile (A7) → Back | `/home` | OK |
| 41 | Profile → Sign out → Welcome | `/` | OK |

Also checked during the walk:

- **Seat sheet.** After "Check in with seat 15B" (K3 → K4), the seat sheet was sampled every frame until the pass rendered. It stayed `data-state="open"` at `top: 96` the whole time. The original code fails this same sampling (`closed` with `top` 96 → 161 before the pass appears).
- **Seat sheet close paths.** X, Escape and the pushed details → seat → X path each still return to step `details`.
- **Taken seat.** Tapping taken seat 14C shows the toast and leaves the selection unchanged.
- **Call options.** In J2, the call-options chip and "📞 Call" start a call that asks "Late check-out".

## Dead-click audit and links

Every visible, enabled `button`, `a[href]`, tab, radio, switch and option in each preset's first viewport was clicked once, after a fresh preset load each time. A click counted when it did at least one of these: changed the URL, opened a popup, or mutated the DOM (ticking live-call clocks ignored). The run made 457 clicks: 227 changed the URL, 222 changed the DOM, and 8 had no effect. Each of those 8 is expected:

| Preset · control | Why nothing happened | Verified instead |
|---|---|---|
| A5 · Back, B1 · Back | `router.back()` returns to the preset's own `/home?preset=` entry, which re-applies the preset (test artefact) | Story part 2 step 40: Home → avatar → Profile → Back lands on `/home` |
| J2 · 🌙 Late check-in, ☀️ Early check-in (re-run: also 🧳 Late check-out) | The audit's hit test picked the Ask-Go form's chip of the same name, which is scrolled under the collapsed header | A targeted probe flips `aria-pressed` on the stay-row chip, and "📞 Call" then asks "Late check-out" |
| L1 · Bengaluru route ×2, L3 · Villa Sol | Re-tapping the already-selected spot is a no-op by spec (L-itinerary-map.md: "re-tap: no change") | — |
| M6 · All 7 | Re-tapping the active filter | — |

Two J1/J2 clicks during the run logged `Module not found: ./src/app/dev/cleanup/page.tsx`. That was a transient file from another process; it is not in the tree. A re-run of J1/J2 logged no errors.

**Links.** All 28 unique internal `href`s rendered on any preset page were opened from the state they were rendered in. Every one landed on a real screen with no 404 and no console errors. These include `/trips/college`, the Bali tabs, the I1 "Ask Go" `?stage=` deep links, the ticket viewer for both travel bookings, and transactions with `?scope=`.

## Fixes made in this pass

| File | Change | Why |
|---|---|---|
| `src/components/ui/input.tsx` | `[&::-webkit-search-cancel-button]:appearance-none` in the input atom's base classes | C5 showed two clear "×" buttons, the native one plus SearchField's. Fixed in the atom so every `type="search"` input gets it. (3a) |
| `src/components/checkin/BoardingPassCard.tsx` | `{/* eslint-disable-next-line @next/next/no-img-element -- SVG brand logo */}` above the IndiGo `<img>` | This was the only lint warning. The suppression matches how every other SVG `<img>` in the codebase is handled (BoardingInfoCard, TripCard, …). (3b) |
| `src/components/home/AppHomeView.tsx` | The A6 trip cards take their stack from `selectTripMembers` (per trip, via `useShallow`) instead of `trip.memberIds` | The design's Goa card shows 4 avatars (Arjun included). The trip-home hero and FAB already read the stage header members, so A6 now shows the same people on the preset and on the click path. College stays You + Rahul; joined Bali shows You, Rahul, Priya, Arjun. (3c) |
| `src/components/checkin/CheckinSeatSheet.tsx` | A local `leaving` flag keeps the BottomSheet open (and ignores `onOpenChange`) from the "Check in with seat …" tap until the pass route replaces the page | `completeCheckin()` flips the trip-home check-in guard, so the sheet used to slide closed before navigation finished. (3d) |
| `src/components/sheets/TimeChip.tsx`, `sheets/AmenityChips.tsx`, `sheets/InviteSheet.tsx`, `chat/cards/PayAskCard.tsx`, `chat/cards/StayCard.tsx`, `trip/ListenSheet.tsx` | Ad-hoc `indexOf(" ")`/`slice` emoji splitting replaced with `splitEmoji()` from `lib/emoji.ts` | Same output, one helper. (3e) |
| `public/images/photos/*.svg` (11), `public/images/illustrations/*.svg` (10) | Removed the centred `<text>` caption. `<title>`/`aria-label`, sizes, file names and `assets.ts` keys unchanged. Avatar initials and the Go avatar/mascot glyphs kept on purpose | The caption ("Goa sunset", "Villa Sol", "Fri", …) collided with overlaid UI such as the trip-hero title, card overlays, day tiles and map pins. The placeholders now read as plain gradient imagery. (coordinator item) |
| `src/components/common/ScopeToggle.tsx`, `src/app/trips/[tripId]/itinerary/page.tsx` | The itinerary toolbar row is an `@container`. The "Everyone" avatar stack gets `@max-[360px]:hidden` | Below ~392 px viewport (360/375/390 phones), the list/map ViewToggle was pushed past the frame edge (16 px off-screen at 360). Expenses' ScopeToggle has no container ancestor, so it is unchanged. (found at 360 px) |
| `src/components/plan/BookingTicketCard.tsx` | Booking title `truncate` → `line-clamp-2` | At 360 px the titles cut to "Everyone to …" / "Everyone ho…". The 420 px layout is unchanged: titles still fit on one line. (found at 360 px) |

## Remaining deviations from the design

- **Copy kept from one artboard where they disagree.**
  - The travel-ask bubble uses F1's "Add where you're coming from and I'll find options…". F2/F3 say "Add your travel and I'll find options…".
  - The private reply uses F6's "Sent you your flight and money details privately 🔒". F7's underlay says "flight details".
  - C2's From chip reads "Bengaluru ✓" after Quick start (PLAN §9.3). The artboard still shows "From?".
- **Documented decisions, still visible.**
  - H2's board underlay is the `stays` thread with live tallies (3 of 4 voted · 2/1/0) instead of the artboard's plan card with 2/0/0 (§12.1 #24).
  - M3's passenger reads "Aarav Shah" (§12.1 #16).
  - The Bali chat Back goes to `/home`, as in the design (G-bali.md).
  - Re-tapping a selected map pin does nothing.
- **Static App-home status lines.** "2 things pending on you" (Goa) and "Visa details pending on you" (Bali) are seed copy (§12.1 #2). They don't change after you settle up, book the cab or send the visa.
- **Live timers.** Listen/live-call clocks tick from the seeded start, so the exact `mm:ss` differs from the artboards' 01:13 / 01:34.
- **Narrow widths.**
  - At ≤390 px, the itinerary "Everyone" segment drops its avatar stack.
  - At 360 px, booking titles wrap to two lines.
  - Under 360 px (e.g. 320) the itinerary toolbar still overflows. 320 px is not a supported width.
- **Placeholders.** All design photos and illustrations are still gradient placeholders with no caption (PLAN §12.3 asset list). Real images drop in under the same file names.
- **Toasts.** At the bottom of the frame they can sit close to the Chat FAB or a dock while they show for 2.2 s. They stay inside the frame at every width tested.

## Not verified here

- `pnpm build`: the orchestrator runs it.
- Real devices and iOS Safari: vaul inside the transformed frame, safe-area insets, native `navigator.share`. Headless Chromium has no `navigator.share`, so the share tiles were exercised through the copy/toast fallback.
- Offline/PWA install (P4-1).
- Scripts (`walk.cjs`, `story*.cjs`, `audit.cjs`, `links.cjs`, `desk.cjs`, `keys.cjs`) and screenshots are in the session scratchpad, not the repo.
