# K · Web check-in (K1 entry, K2 details, K3 seat, K4 boarding pass)

Sources (`design/prototype/`, third-party data): `P-Home-Checkin.dc.html` (K1), `P-Checkin-Details.dc.html` (K2), `P-Checkin-Seat.dc.html` (K3), `P-Checkin-Pass.dc.html` (K4). The Ticket PDF viewer (M3) is specified in `M-bookings-money.md`. Component names are PLAN §7; tokens are PLAN §3.

## 1. Spec (normative)

### 1.1 Artboards → route + state

| Artboard | Route + query | Store state (`home.goa`) | Preset id |
|---|---|---|---|
| K1 · Home · web check-in open, 2 days before | `/trips/goa` | `checkin.status='open'`, `daysToGo=2`, `calls=[]`, `openRow=null` | `K1` |
| K2 · Check-in 1: details | `/trips/goa?sheet=checkin&step=details` | K1 + `checkin {digiYatra:true, declaration:true, seat:'14A'}` | `K2` |
| K3 · Check-in 2: seat | `/trips/goa?sheet=checkin&step=seat` | same as K2 | `K3` |
| K4 · Check-in 3: boarding pass | `/trips/goa/checkin/pass` | `checkin {status:'done', digiYatra:true, declaration:true, seat:'14A'}` | `K4` |

- Every K preset starts from `ensureStage('plan')` (trip planned → populated trip home).
- `?sheet=checkin` with a missing/unknown `step` = `details`. The check-in sheets render only while `checkin.status==='open'`; otherwise P3-17 drops the params (`replace`).
- PLAN §2's `app/trips/[tripId]/checkin/page.tsx` is **not built**: K2/K3 are query states of the trip-home route (PLAN §8), and no §10 task owns that file.

**K1 entry — summary.** The card is specified in `J-triphome-calls.md` (P3-10 `CheckinCard`, placed by P3-17). K1 is the J1 trip home with these changes: hero ⏳ "in 2 days"; Pending header "3 left"; a `CheckinCard` inserted between the Pending header and the settle/cab `PendingCard`. The card is `Card shadow radius=2xl` p-4 gap-3 and contains:
- an IndiGo tile 56×40 `rounded-xl bg-indigo` (logo 46w);
- "Web check-in is open" 16/600 with a `Badge success-soft xs` "NEW";
- the sub "6E 5313 · Fri 8:40 pm · closes 1 hr before" (13 muted);
- a companion box `rounded-2xl bg-surface-2 p-[10px_12px] gap-2.5` with Arjun’s avatar 28 and "Arjun is on the same flight. Check in now and Go will try to seat you together." (14);
- a full-width `Button primary md` "Check in now" → `?sheet=checkin&step=details`.

There are no live calls, so the "Need something sorted?" form card shows; Done still reads "4 done". To reach K1 from any populated trip-home state, expand the Flights done row and tap `CheckinPreviewLink` "Preview" → `previewCheckin()`. The design's self-link becomes a store action.

### 1.2 `CheckinDetailsSheet` (K2 — owned by P3-12)

- File `src/components/checkin/CheckinDetailsSheet.tsx`, `"use client"`.
- Props `{ tripId: TripId; open: boolean; onClose: () => void; onContinue: () => void }`.
- Reads `home[tripId].checkin` and seed `checkin`; writes `setDigiYatra` and `setDeclaration`.
- Renders `<BottomSheet top={96} open={open} onOpenChange={(o) => !o && onClose()}>`: 816px tall in a 912 frame, `rounded-t-8xl bg-canvas shadow-sheet`, scrim `bg-scrim`, grabber 40×5 `bg-line-2`. The dialog's accessible name is the sheet title.

`SheetBody` (`px-4 pt-2 pb-[120px] gap-3`), top→bottom:
1. **`SheetHeader`**: title "Web check-in · 6E 5313" (22/600 tracking-h2); subtitle "Fri 6 Nov · takes under a minute" (14 muted tracking-sm leading-[1.4]); close `Button white icon-sm -mr-1.5` (`X` 18) → `onClose`.
2. **`StepIndicator step={1}`**: `flex gap-1.5 px-0.5`; 3 segments `flex-1 flex flex-col gap-1.5`.
   - Bars: `h-1 rounded-full`, active `bg-ink`, inactive `bg-line-2`.
   - Labels: 12/700, active `text-ink`, inactive `text-faint`, reading "1 · Details", "2 · Seat", "3 · Boarding pass". Segments up to and including `step` are active.
3. **`RouteRow size="sm"`** inside `Card variant="outline" radius="lg"` (18) `p-[12px_14px]`, row `flex items-center gap-3`:
   - left: "BLR 8:40p" `text-20 font-bold tabular-nums` over "Bengaluru T1" `text-13 text-muted`;
   - middle `flex-1 flex items-center gap-1 text-faint`: rule `flex-1 border-t-[1.5px] border-dashed border-line-4`, `<span aria-hidden>✈️</span>`, rule;
   - right (`items-end text-right`): "GOX 9:55p" over "Goa · Mopa".
4. **Passenger card**, `Card outline radius=lg` `px-3.5 py-1`, read-only (no inputs anywhere in this flow):
   - `ListRow`: leading `Avatar` aarav 40; title "Aarav Shah" (16/600 tracking-body); sub "Adult · name as on your ID" (13 muted); trailing `CheckBadge size={22}`.
   - `KVRow` "Mobile for flight alerts" / "+91 98••• ••210": `border-t border-line py-3 text-14`, label `text-muted`, value `font-semibold`.
   - `KVRow` "Bags" / "7 kg cabin · 15 kg check-in".
5. **DigiYatra row**, `Card outline radius=lg` `p-[12px_14px] flex items-center gap-3`:
   - `<span aria-hidden className="text-20">🙂</span>`;
   - a `flex-1` text column: "Use DigiYatra at the airport" (15/600 tracking-sub) over "Face-based entry at Bengaluru T1" (13 muted);
   - `<Switch checked={digiYatra} onCheckedChange={setDigiYatra} aria-label="Use DigiYatra at the airport">` (52×32, on `bg-success`, off `bg-line-2`; the knob translates 20px).
6. **`CheckboxCard checked={declaration} onCheckedChange={setDeclaration}`**:
   - title "I’m not carrying restricted items" (15/600); sub "Power banks go in your cabin bag, not check-in" (13 muted);
   - card `rounded-4xl bg-white border border-line p-[12px_14px] gap-3 text-left`;
   - box 26 `rounded-md`: off `bg-white border-[1.5px] border-line-4`, on `bg-black` with a white `Check` 14 sw3.
7. **`GoNote variant="peach"`** (Note `bg-go-note rounded-4xl p-[12px_14px] gap-2.5 text-14 leading-[1.4]`, Go avatar 28): "Go filled this in from your booking. Next, pick a seat. Go has one saved next to Arjun."

`SheetFooter` (gradient to canvas at 35%, `pt-10 px-4 pb-safe`) holds `<Button variant="primary" size="xl" className="w-full" disabled={!declaration} onClick={onContinue}>Continue to seats</Button>`.
- It is a real `<button>`, not an `asChild` Link, so `disabled` works. Disabled = `bg-line-2 text-faint-2` with no pointer events.
- It is enabled by default (seed `declaration: true`).

Close paths: X, scrim tap, drag-down and browser Back all call `onClose` → K1 (`/trips/goa`, sheet params removed).

### 1.3 `CheckinSeatSheet` (K3 — owned by P3-12)

- File `src/components/checkin/CheckinSeatSheet.tsx`.
- Props `{ tripId: TripId; open: boolean; onBack: () => void }`.
- Reads `checkin.seat` and seed `seats` / `friendSeat` / `nextToFriend`; writes `setSeat` and `completeCheckin`; navigates with `useRouter`.
- Same `BottomSheet top={96}`. `onOpenChange(false)` → `onBack`, which returns to **step details** (K2), not to home.

Body, top→bottom:
1. **`SheetHeader`**: title "Pick your seat"; sub "6E 5313 · Bengaluru → Goa · Fri 8:40 pm"; close → `onBack`.
2. **`StepIndicator step={2}`**: segments 1–2 active.
3. **`GoNote variant="green"`** (`bg-success-soft text-success-ink`, Go avatar 28, 14 / leading-[1.4]). The bold seat reflects the selection (deviation):
   - `sel ∈ nextToFriend` (`['14A','14C']`): `<b>{sel} is free, right next to Arjun.</b>` + " I’ve picked it. Tap any free seat to change." With the seed default this is the design copy exactly.
   - otherwise: `<b>{sel} is free.</b>` + " Not next to Arjun. Tap any free seat to change." Mark this `// DESIGN-ASSUMPTION`; it uses the design's computed-but-unbound `note` string.
4. **`SeatMap`** inside `Card variant="outline" radius="2xl"` (22) `p-[14px_10px] flex flex-col gap-2`:
   - `Eyebrow` "FRONT OF PLANE", `self-center text-11 font-bold text-muted tracking-eyebrow`.
   - Column header row `flex justify-center gap-1.5`: A B C (each `w-10 text-center text-12 font-bold text-muted`), an aisle spacer `w-7`, then D E F.
   - Rows 12→18, each `flex items-center justify-center gap-1.5`: [A B C] (`flex gap-1.5`), then an aisle `w-7 text-center text-12 font-bold text-faint tabular-nums` showing the row number, then [D E F]. Row width is 304px.
   - **`SeatCell`** = `<Toggle variant="seat" seatState={…}>` (a Radix Toggle, rendering `<button type="button" aria-pressed>`), base `size-10 rounded-xl text-11 font-bold p-0 flex items-center justify-center`. State precedence: **selected > taken > paid > free**.

     | `seatState` | Classes | Content | Behaviour |
     |---|---|---|---|
     | `selected` | `bg-black text-white` (no border) | seat id, e.g. "14A" | pressed; re-tap = no-op (no deselect) |
     | `taken` | `bg-line text-line-4 cursor-not-allowed` | "" | `aria-disabled="true"`, **not** `disabled`, so the tap still fires → toast |
     | `paid` | `bg-go-note text-go border-[1.5px] border-go-line` | "₹" | `setSeat(id)` |
     | `free` | `bg-white text-faint border-[1.5px] border-line-2` | "" | `setSeat(id)` |
     | `friend` (14B) | `bg-info-tint-2 border-2 border-info`, applied with `toggleVariants({variant:'seat', seatState:'friend'})` to a `<span role="img">`, not a button | Arjun `Avatar` 28 | none |

     aria-label = `Seat ${id}` + (taken ? ", taken" : paid ? ", ₹450" : ", free"). The selected seat keeps its base label ("Seat 14A, free"); the friend seat is "Seat 14B, Arjun".
   - Tapping a taken seat → `toast("{id} is taken. Pick a free seat.")`, e.g. "12A is taken. Pick a free seat.". The selection is unchanged.
5. **`SeatLegend`**, `flex flex-wrap justify-center gap-3`. Each item is `flex items-center gap-[5px] text-13 text-muted tracking-caption` with a swatch `size-3.5 rounded-sm`. In this order:
   - Free (`bg-white border-[1.5px] border-line-2`)
   - ₹450 (`bg-go-note border-[1.5px] border-go-line`)
   - Taken (`bg-line`)
   - Arjun (`bg-info-tint-2 border-2 border-info`)
   - You (`bg-black`)

`SheetFooter` holds `Button primary xl w-full`, always enabled:
- label = `Check in with seat ${sel}` + (seat.state==='paid' ? " · ₹450" : " · free"); default "Check in with seat 14A · free";
- onClick → `completeCheckin()` then `router.push('/trips/goa/checkin/pass')`.

**Seat occupancy** (seed `checkin.ts`, verbatim from the design). `Y`=you (selected 14A) · `Arjun`=friend · `X`=taken · `₹`=paid free · `.`=free. The aisle is between C and D.

| Row | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 12 | X | ₹ | X | X | ₹ | ₹ |
| 13 | ₹ | X | ₹ | ₹ | X | X |
| 14 | **Y** (default) | **Arjun** | X | . | X | . |
| 15 | X | . | . | . | . | X |
| 16 | . | X | X | X | . | . |
| 17 | X | . | . | . | X | . |
| 18 | . | . | X | X | . | X |

- `TAKEN = [12A,12C,12D,13B,13E,13F,14C,14E,15A,15F,16B,16C,16D,17A,17E,18C,18D,18F]` (18 seats); `ARJ='14B'`; paid = `row <= 13` and not taken; price ₹450.
- Free paid seats: 12B,12E,12F,13A,13C,13D. Free normal seats: 14A,14D,14F,15B,15C,15D,15E,16A,16E,16F,17B,17C,17D,17F,18A,18B,18E.
- The only free seat next to Arjun is **14A** (14C is taken).

### 1.4 Boarding pass page (K4)

- Owned by P3-12: `src/app/trips/[tripId]/checkin/pass/page.tsx` (client, `useHydrated()` guard) and `checkin/BoardingPassCard.tsx`.
- Full page: no trip backdrop, no sheet. It renders from the store regardless of `status`; preset K4 sets `done`.

**`Screen` + `TopBar`** (`pt-safe pb-2 px-3 gap-1.5`):
- back `backHref="/trips/goa"` (`Button ghost icon` 44, `ArrowLeft` 22 sw2, aria-label "Back");
- title "Boarding pass" (20/700 tracking-h3);
- trailing `Button variant="ghost" size="icon" aria-label="Share boarding pass"` with `Share` `size-5` → toast "Boarding pass shared to Goa crew".

Body `px-4 pt-1 pb-[130px] flex flex-col gap-3`:
1. **`StepIndicator step={3}`**: all segments active.
2. **Success `Note variant="green"`**, entering with `transition-[opacity,transform] duration-220 starting:opacity-0 starting:translate-y-1.5` (the design's `.enter`):
   - `CheckBadge size={24}` plus text `text-15 font-semibold text-success-ink`;
   - `sel ∈ nextToFriend` → "You’re checked in. Seat {sel}, next to Arjun."; otherwise "You’re checked in. Seat {sel}." (deviation, using the computed note). The seed reads "You’re checked in. Seat 14A, next to Arjun."
3. **`BoardingPassCard({ checkin, seat })`**, `Card variant="shadow" radius="3xl"` (24) `overflow-hidden`:
   - **Band** `bg-indigo text-white px-[18px] py-3.5 flex items-center justify-between`: `<img src={assets.indigo} alt="IndiGo" className="w-[70px] h-auto">` and "6E 5313" `text-14 font-bold tracking-badge`.
   - **Body** `p-[18px] flex flex-col gap-4`:
     - `RouteRow size="lg"` (`gap-2.5`): "BLR" `text-34 font-extrabold tracking-h2` over "Bengaluru · T1" (13 muted); a dashed rule with ✈️ in the centre (`text-faint`, gap-1); right-aligned "GOX" over "Goa · Mopa".
     - **`PassField` grid**: 3 rows `flex gap-2`; each cell `flex-1 flex flex-col gap-0.5` with `align` start|center|end; label `text-11 font-bold text-muted tracking-eyebrow` (written uppercase); value `text-17 font-bold tabular-nums`.

       | Row | start | center | end |
       |---|---|---|---|
       | 1 | PASSENGER "AARAV SHAH" | — | DATE "Fri 6 Nov" |
       | 2 | BOARDING "8:00 pm" | DEPARTS "8:40 pm" | SEAT `{sel}` |
       | 3 | GATE "At airport" | ZONE "2" | SEQ "087" |
   - **Tear line** `<Separator variant="dashed" aria-hidden className="mx-[18px] border-t-2 border-line" />`. The design is a 2px dashed #ECEFF3 line with no notches; the className override is needed because the Separator dashed variant is 1.5px `line-2`.
   - **Stub** `p-[18px] flex items-center gap-4`:
     - `QrBitmap rows={checkin.pass.qr} size={150}`: the 25×25 bitmap from `checkin.ts`, decorative.
     - Right column `flex-1 flex flex-col gap-2`:
       - `Badge variant="success-soft" size="md" className="self-start text-12 font-bold"` "🙂 DigiYatra on" (h-7 px-[10px]);
       - "Show this at security if DigiYatra isn’t working." (13 muted);
       - "7 kg cabin · 15 kg check-in" (13 muted).
4. **`GoNote variant="outline"`** (`bg-white border border-line`, Go avatar 28): "I’ll ping you when the gate is announced and when boarding starts. Arjun’s in 14B." with a trailing Arjun `Avatar` 28.

**Dock** `FadeDock variant="gradient"` (`flex gap-2 px-4 pb-safe`, plus `className="pt-[30px]"`). The design's gradient stop is 40%; the variant's 35% is accepted.
- "Save to wallet": `Button primary xl className="flex-1 text-17"` → toast "Boarding pass added to your wallet".
- "Download": `Button secondary xl asChild className="flex-1 px-3.5 text-16 tracking-sm"` wrapping `` <Link href={`/trips/goa/bookings/${flightBookingId}/ticket`}>Download</Link> ``. This is a deviation from the design's mis-wired link to P-Chat-Plan.
  - `flightBookingId` = the flight booking in the bookings seed that carries `ticket` (PNR K7QX2M). It is the same id the Bookings travel card links to (see `M-bookings-money.md`).

### 1.5 Store

`home[tripId].checkin: { status: 'not-open'|'open'|'done'; digiYatra: boolean; declaration: boolean; seat: string }`
- Defaults come from `checkin.ts`: `'not-open'`, `true`, `true`, `'14A'`.
- Persisted: this state is not transient UI.

| Action | Effect |
|---|---|
| `previewCheckin()` | `status='open'`, `daysToGo=2` → K1 (check-in card, "3 left", "in 2 days") |
| `setDigiYatra(on)` | `digiYatra=on` |
| `setDeclaration(on)` | `declaration=on` (gates "Continue to seats") |
| `setSeat(id)` | `seat=id`; ignored when `id` is taken or is the friend seat |
| `completeCheckin()` | `status='done'` → `selectPending` drops the check-in card (Pending "2 left"). Optional deviation: `selectDone` sets the Flights done-row sub to "Checked in · seat {seat}" |

- Signatures follow the per-trip (tripId-scoped) convention P2-2 picks for the `home` slice.
- PLAN §9.4 lists `checkinSetSeat` and has no DigiYatra/declaration setters. This file is authoritative for the check-in actions: P2-2 implements the five names above.

Seed `src/data/seed/checkin.ts` (P2-1), typed `CheckIn` (§9.1; add any fields it lacks). Seat data and all copy come from here, never from components:
- `flight '6E 5313'`, `date 'Fri 6 Nov'`, `logo` = `assets.indigo`.
- `route`: `{from 'BLR', fromTime '8:40p', fromSub 'Bengaluru T1', to 'GOX', toTime '9:55p', toSub 'Goa · Mopa'}`. Pass subs: `'Bengaluru · T1'` / `'Goa · Mopa'`.
- `passenger`: `{name 'Aarav Shah', sub 'Adult · name as on your ID', mobile '+91 98••• ••210', bags '7 kg cabin · 15 kg check-in'}`.
- `digiYatra true`, `declaration true`, `seat '14A'`, `friendSeat '14B'`, `nextToFriend ['14A','14C']`, `seatPrice '₹450'`.
- `seats`: 42 `Seat` cells (rows 12–18 × A–F) per the §1.3 table; 14B has state `friend`.
- `pass`: `{passenger 'AARAV SHAH', boarding '8:00 pm', departs '8:40 pm', gate 'At airport', zone '2', seq '087', qr}`. `qr` is the 25 bitmap rows from §2 K4, stored **without** the `NN ` row prefixes.
- Every sheet/page string in §1.2–1.4 and every toast lives in `checkin.ts` / `copy.ts`.

### 1.6 Interactions → actions/toasts

| Artboard | Element | Store action | Navigation / toast (verbatim) |
|---|---|---|---|
| K1 | Flights done row → "Preview" (`CheckinPreviewLink`) | `previewCheckin()` | stays on `/trips/goa` (now K1) |
| K1 | "Check in now" | — | push `?sheet=checkin&step=details` |
| K2 | DigiYatra `Switch` | `setDigiYatra(!digiYatra)` | — |
| K2 | Declaration `CheckboxCard` | `setDeclaration(!declaration)` | CTA enables/disables |
| K2 | "Continue to seats" (enabled) | — | push `?sheet=checkin&step=seat` |
| K2 | X / scrim / drag-down / Back | — | close → `/trips/goa` (K1) |
| K3 | free or ₹ seat | `setSeat(id)` | CTA label and green note update |
| K3 | already-selected seat | — | no-op |
| K3 | taken seat | — | toast "{id} is taken. Pick a free seat." |
| K3 | 14B (Arjun) | — | not interactive |
| K3 | X / scrim / drag-down / Back | — | step → `details` (K2); check-in state kept |
| K3 | "Check in with seat {sel} · ₹450" / "· free" | `completeCheckin()` | push `/trips/goa/checkin/pass` |
| K4 | Back arrow | — | `/trips/goa` |
| K4 | Share (top bar) | — | toast "Boarding pass shared to Goa crew" |
| K4 | "Save to wallet" | — | toast "Boarding pass added to your wallet" |
| K4 | "Download" | — | `/trips/goa/bookings/<flightBookingId>/ticket` (M3) |
| K2/K3 backdrop | hero share / collapsed-header share | — | unreachable while a sheet is open (under the overlay), as designed |

History follows PLAN §8: a close calls `router.back()` when the step was pushed in this session, otherwise `replace`. Toasts use sonner (2200ms, navy pill at bottom 108).

### 1.7 Deviations (flag in code with `// DESIGN-ASSUMPTION`)
1. **PLAN §12.1 #15 — seat propagates.** The selection drives the K3 note's bold seat, the K3 CTA, the K4 success note and the K4 SEAT field. The design hardcodes 14A on K4 and keeps the K3 note static. A paid seat only appends " · ₹450"; there is no payment step.
2. **New non-adjacent copy**: K3 "**{sel} is free.** Not next to Arjun. Tap any free seat to change." and K4 "You’re checked in. Seat {sel}." Both come from the design's computed-but-unbound `note`.
3. **PLAN §12.1 #16 — Ticket PDF** shows passenger "Aarav Shah" and keeps 24h times. That is M3's concern; it is now reachable from K4 Download.
4. **Download → ticket viewer** (PLAN §8). The design linked to P-Chat-Plan (mis-wired).
5. **Switch knob moves** (`translate-x-5`); in the design the knob never moves. Switch and Checkbox use Radix `role="switch"` / `role="checkbox"` with `aria-checked` instead of the design's `aria-pressed` buttons.
6. **Taken seats are `aria-disabled` buttons**, so a tap shows the toast. The Arjun cell gets `role="img"` so its aria-label is announced.
7. **K4 Back → `/trips/goa` after `completeCheckin`**: the check-in card is gone and Pending reads "2 left". The design returns to K1 with the card still showing. The done-row sub "Checked in · seat {seat}" is optional.
8. **Share-trip sheet is unreachable** while a check-in sheet is open, as designed (its triggers sit under the overlay). No extra trigger is added.
9. **The grabber drags to dismiss** (vaul) with the same close targets; in the design it is decorative.
10. **K4 buttons get the standard press feedback** (the design's `rgb()` inline styles skipped it). `TopBar` uses `pt-safe` (56) where the design has 46.
11. **Token deltas.** The tear line uses a className override (2px `border-line`). The FadeDock stop is 35% (design 40%). The DigiYatra badge overrides Badge md to 12/700.

### 1.8 Acceptance checklist

**K1**
- [ ] `applyPreset('K1')` → `/trips/goa`. The hero reads "⏳ in 2 days" and Pending reads "3 left".
- [ ] `CheckinCard` is first in Pending: IndiGo tile, "Web check-in is open" + NEW, sub, Arjun note, full-width "Check in now".
- [ ] There is no "Go’s calls" section; the "Need something sorted?" card is visible; Done reads "4 done".
- [ ] From J1, expanding Flights and tapping "Preview" renders the same K1 without a reload.
- [ ] "Check in now" opens K2; the URL has `?sheet=checkin&step=details`.

**K2**
- [ ] The sheet starts 96px below the frame top (816px tall in a 912 frame), with a 28px top radius, a 40×5 grabber, and the scrim over the K1 trip home.
- [ ] Shows the title/sub, step 1 active only, the route card, and the passenger card (avatar 40, tick 22, 2 KV rows). Then the DigiYatra row, the declaration, and the peach Go note. All copy is verbatim.
- [ ] The Switch is on by default; a tap moves the knob 20px, turns it `bg-line-2`, and flips `aria-checked`.
- [ ] The declaration is ticked by default. Unticking it greys the CTA (`bg-line-2 text-faint-2`) and blocks taps; re-ticking re-enables it.
- [ ] Continue → K3 URL. X, scrim and drag-down → `/trips/goa` with no sheet params, and the check-in card is still shown.
- [ ] Switch/declaration values survive a reload.
- [ ] The last content scrolls clear of the footer CTA.

**K3**
- [ ] Steps 1–2 are active. The green note reads "**14A is free, right next to Arjun.** I’ve picked it. Tap any free seat to change."
- [ ] The map shows "FRONT OF PLANE", headers A B C · D E F, and rows 12–18 with aisle numbers. All 41 seat cells plus 14B match the occupancy table:
  - 14A black "14A";
  - 14B with a blue border and Arjun’s avatar;
  - "₹" on 12B,12E,12F,13A,13C,13D;
  - taken cells grey and empty.
- [ ] Tapping 16A makes it black "16A" and 14A reverts to free. The CTA reads "Check in with seat 16A · free"; the note reads "**16A is free.** Not next to Arjun. Tap any free seat to change."
- [ ] Tapping 12B sets the CTA to "Check in with seat 12B · ₹450".
- [ ] Tapping 12A shows the toast "12A is taken. Pick a free seat." and leaves the selection unchanged.
- [ ] aria-labels read "Seat 12B, ₹450", "Seat 12A, taken", "Seat 14B, Arjun"; the selected cell has `aria-pressed="true"`.
- [ ] The legend reads Free, ₹450, Taken, Arjun, You, with the stated swatches.
- [ ] X / scrim → K2 with DigiYatra and declaration kept. The CTA → `/trips/goa/checkin/pass` and `status='done'`.

**K4**
- [ ] The top bar shows back, "Boarding pass" and share; share shows the toast "Boarding pass shared to Goa crew".
- [ ] All 3 steps are active. The green note with a 24px tick reads "You’re checked in. Seat 14A, next to Arjun."; after picking 16A it reads "You’re checked in. Seat 16A."
- [ ] Pass card:
  - indigo band with logo and "6E 5313";
  - BLR/GOX at 34/800;
  - 8 fields verbatim, with SEAT = the selection;
  - dashed tear line;
  - crisp 150×150 QR from the 25×25 bitmap;
  - DigiYatra pill and its two lines.
- [ ] The outline Go note shows the Go avatar on the left and Arjun’s avatar on the right.
- [ ] "Save to wallet" (black, 17px) shows the toast "Boarding pass added to your wallet". "Download" (grey) opens the M3 ticket viewer for the flight booking.
- [ ] Back → `/trips/goa`: the check-in card is gone and Pending reads "2 left".
- [ ] The last content clears the dock (`pb-[130px]`).

### 1.9 Consumed by tasks
- **P3-12**:
  - Owns `checkin/{CheckinDetailsSheet,CheckinSeatSheet,SeatMap,SeatCell,SeatLegend,BoardingPassCard}.tsx` and `app/trips/[tripId]/checkin/pass/page.tsx`.
  - Must also own `checkin/RouteRow.tsx` (`size` sm|lg) and `checkin/PassField.tsx` (`label`, `value`, `align`), because PLAN requires one component per file and these are missing from its §10 OWNS list.
  - Props-driven: `SeatMap({ seats, selected, friendSeat, onPick })`, `SeatCell({ seat, selected, onPick })`, `BoardingPassCard({ checkin, seat })`.
- **P3-17**:
  - Mounts both sheets in `TripHomeScreen` as separate `BottomSheet` instances with mutually exclusive `open`. A step change animates one sheet down and the other up; this is accepted.
  - `useTripHomeSheets` maps `?sheet=checkin&step=` to `open`. It implements `onClose` / `onContinue` / `onBack` per §1.6 and PLAN §8, and drops the params when `status!=='open'`.
  - Places P3-10's `CheckinCard` per K1.
- **P1-6**: `QrBitmap({ rows: string[]; size?: number; className?: string })` renders `<svg viewBox="-1 -1 27 27" width={size} height={size} role="img" aria-label="Boarding pass QR code" shape-rendering="crispEdges" className="block bg-white">` with `<g className="fill-ink">` and one 1×1 `<rect>` per `#` (299 for the seed).
- **P2-1**: `seed/checkin.ts` (§1.5), the toast strings in `copy.ts`, and preset ids `K1`–`K4` in `presets.ts`.
- **P1-4**: `ui/toggle.tsx` gets a `seat` variant plus a `seatState` cva key (`free|paid|taken|selected|friend`) with the §1.3 classes. It exports `toggleVariants` so the friend `<span>` can reuse them.
- **Also relies on:**
  - P2-2: the slice, the five actions, `selectPending`/`selectDone`, and presets K1–K4.
  - P1-3: `Switch`, `CheckboxCard`.
  - P1-5: `BottomSheet` parts, `StepIndicator`, `KVRow`, `ListRow`, `FadeDock`, `TopBar`, `Separator dashed`, and `Note`. `GoNote` needs a `variant` (peach|green|outline) and a `trailing` slot, which PLAN §7.2 does not state.
  - P3-10: `CheckinCard`, `CheckinPreviewLink`.
  - P3-14: the ticket route that Download targets.

## 2. Inventory (reference)

Pasted verbatim from the group inventories. Headings are demoted one level to nest here. PLAN §7 names are added in [brackets] after proposed names.

Sources (all 420×912, `data-props $preview {width:420,height:912}`, Figtree 400–800 from Google Fonts; font stack `'Satoshi','Figtree',system-ui,sans-serif`; `font-kerning: normal; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased`; base text `#0B1B3F`):
- `P-Checkin-Details.dc.html` (title "Go — Web check-in, details")
- `P-Checkin-Seat.dc.html` (title "Go — Web check-in, seat")
- `P-Checkin-Pass.dc.html` (title "Go — Boarding pass")
- `P-Ticket-PDF.dc.html` (title "Go — Ticket PDF viewer")

### Shared global CSS (identical `<helmet>` in all 4)
- `body{margin:0}`, `a{color:#0B1B3F}`, `--ease-out: cubic-bezier(0.23,1,0.32,1)`.
- `a,button`: no tap highlight, `touch-action: manipulation`, no user-select/touch-callout; transition `transform 160ms var(--ease-out), box-shadow 180ms, background-color 180ms, opacity 180ms`. `:active` → `scale(0.97)`, durations 160/60/60/60ms.
- Black-bg press: `[style*="background: #000000"]:active` → `box-shadow: inset 0 0 0 999px rgba(255,255,255,0.18)`.
- Light-bg press (`#F2F2F2|#F4F5F7|#F6EAE6|#FFFFFF|transparent`, not `.row`) → `inset 0 0 0 999px rgba(11,27,63,0.07)`.
- `.row` transition transform/border/box-shadow; `.row:active` scale(0.985) + `background-color:#F5F6F8 !important`.
- `a:not([style*="background"]):active{opacity:.6}`; hover (fine pointer) `a:hover{color:#22365F}`.
- `.tick`: transition 200ms; `@starting-style` scale(0.8) opacity 0.
- `.enter`: transition opacity/transform 220ms; `@starting-style` opacity 0, translateY(6px).
- `.live`: `animation: live 1600ms ease-in-out infinite`, keyframe 50% `box-shadow: 0 0 0 7px rgba(22,163,74,0.12)`.
- reduced-motion: no press scale, `.tick/.enter` opacity-only 150ms, `.live` none.
- `input::placeholder{color:#4A5878}` (no inputs exist in this group).
- `[role="dialog"]>div>*{flex-shrink:0}`.

Shared toast (all 4): `sc-if pToast`; `.enter` `role="status"`; abs `left:50%; bottom:108px; z-index:60; translateX(-50%)`; `max-width:340px; padding:12px 16px; radius:16px; bg #0B1B3F; color #FFF; 14px/600; lh 1.35; center; shadow 0 10px 30px rgba(11,27,63,0.3)`. Text `{{pToastText}}`. `_toast(t)` sets `pT`, clears previous timer, auto-hides after **2200ms**.

Shared boilerplate in every `Component`: state `pT:null, pShare:false, pSent:[]`; `_send()` chat-append helper (fake Go reply "Got it 👍 I’ll factor that into the plan." after 1200ms, scrolls `[data-p-end]`) — **unused in all four screens** (no chat markup). `pSent` mapping produces bubble styles (me: `radius 20 20 0 20; #000/#FFF`; Go: `radius 20 20 20 0; #F6EAE6/#0B1B3F`) — dead code here.

---

### P-Checkin-Details.dc.html — K2 Check-in 1: details

#### Purpose (1 line)
Step 1 of 3 bottom sheet over the trip Home: shows Go-prefilled passenger/flight details, a DigiYatra toggle and a restricted-items declaration gating "Continue to seats".

#### Layout top→bottom
**Root**: `position:relative; 420×912; flex column; bg #F6F7F9; overflow:hidden`.

**A. Backdrop = trip Home screen (static copy, behind scrim)** — scroll container `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; onScroll={{onScroll}}` (no-op).
1. Hero `height:236px; bg #E9945A; position:relative`.
   - `<img src=/_blob/1d74f508f447c4a1bb476cb83c275f7d alt="Palm silhouette against a Goa sunset over the sea">` abs inset 0, cover.
   - Gradient overlay span: `linear-gradient(180deg, rgba(11,27,63,.25) 0%, rgba(11,27,63,0) 26%, rgba(11,27,63,.08) 42%, rgba(11,27,63,.4) 62%, rgba(11,27,63,.72) 100%)`.
   - Back `<a href=P-App-Home>` abs `top:46 left:14; 40×40; r999; bg rgba(11,27,63,.35); backdrop-filter blur(12px); #FFF`; arrow-left SVG 20.
   - Share `<a role=button onClick=pa_0 aria-label="Share trip">` abs `top:46 right:14` same chip; share-arrow SVG 18.
   - Bottom block abs `left/right 20; bottom 42; flex space-between; align flex-end; gap 12; #FFF`:
     - "📍 Goa": 40px/700, `-0.03em`, lh 1; emoji box 30px wide, font 30px; gap 4.
     - Meta lines (margin-top 4, gap 2), each 15px/500 lh1.35 nowrap, emoji box 18px wide: "📅 Fri 6 – Mon 9 Nov", "⏳ in 2 days".
     - Avatar stack (padding-left 8, each `28×28 r999 border 2px #FFF margin-left -8`): c58d97… (Aarav/you), cb0a34… (Rahul), 234f09… (Priya?), 8c7b7c… (Arjun).
2. Segmented tabs `role=tablist aria-label="Trip sections"`: `margin:-26px 16px 0; padding:5px; gap:2px; r999; bg #FFF; z-index 2; shadow 0 1px 2px rgba(11,27,63,.06), 0 8px 24px rgba(11,27,63,.12)`. Tab: `flex:1; h42; r999; 15px/600`. Active "Home" bg #000 / #FFF; others transparent / #4A5878. Home→P-Home, Itinerary→P-Plan-Everyone, Bookings→P-Bookings, Expenses→P-Money-Everyone.
3. Content `padding:16px 16px 120px; column gap 10`:
   - Section header "Pending on you" 20px/600 `-0.018em` lh1.3 + "3 left" 13px/600 #4A5878 `0.002em`; padding 0 4.
   - Check-in card `padding 16; r22; #FFF; shadow 0 1px 2px rgba(11,27,63,.05), 0 6px 18px rgba(11,27,63,.06); gap 12`:
     - Logo tile `56×40 r12 bg #2B399B` with IndiGo img (7a6cf4…, width 46). Title "Web check-in is open" 16px/600 `-0.011em` + NEW pill (`h20; pad 0 7; r999; bg #E3F5EA; #0F7A37; 11px/700`). Sub "6E 5313 · Fri 8:40 pm · closes 1 hr before" 13px #4A5878.
     - Arjun note `padding 10 12; r14; bg #F4F5F7; gap 10`: Arjun avatar 28; "Arjun is on the same flight. Check in now and Go will try to seat you together." 14px lh1.35.
     - CTA "Check in now" `<a href=P-Checkin-Details>` `h50; pad 0 18; r999; #000/#FFF; 16px/500; -0.014em`.
   - Card (pad 0 14, r22, same shadow) two rows (row `padding 12 0; gap 12`, divider `1px #ECEFF3`):
     - Rahul avatar 40 · "Settle up with Rahul" 16/600 · "₹5,800 left of your villa share" 13 · "Record" pill (`h36 pad 0 18 r999 #000 14px/500`) → P-Money-Record.
     - Composite icon (✈️ 30px circle #F4F5F7 + 🏡 24px badge #FFF1DC bottom-right) · "Airport cab to Villa Sol" · "Fri 9:55 pm · with Arjun" · "Book ₹1,600" → P-Chat-CabSheet.
   - "Done" header (margin-top 8) + "4 done".
   - Done card (pad 2 14, r22): rows `padding 11 0; gap 10`; title 15/600 **#4A5878**; sub 13 #4A5878:
     - 🏡 36 circle + green tick badge (16px #16A34A, SVG 9 stroke 4) · "Villa Sol booked" · "Fri 6 → Mon 9 · paid by Rahul" · `sc-if villaLive` "On a call" pill (`h26 pad 0 9 r999 #E3F5EA #0F7A37 12/700`, `.live` dot 7px #16A34A) · expand btn 36×36 #F4F5F7 (SVG `M15 3h6v6 / M9 21H3v-6 / M21 3l-7 7 / M3 21l7-7`, 16px stroke 2.2) → P-Home-StayOpen.
     - ✈️ + tick · "Your flights booked" · "BLR ⇄ GOX · both ways" · `sc-if indigoLive` · expand → P-Home-FlyOpen.
     - 💰 · "Your budget set" · "₹21.8k · only you see it" · tick 22px (SVG 12 stroke 4).
     - 📅 · "Dates locked" · "Diwali · Fri 6 – Mon 9 Nov" · tick 22px.
4. `sc-if collapsed` (always false) collapsed header: abs top, z4, `padding 46 12 10; #FFF; shadow 0 1px 0 rgba(11,27,63,.05), 0 8px 20px rgba(11,27,63,.08)`; back (→P-App-Home), "Goa" 17/700 + "Fri 6 – Mon 9 Nov" 13, share (pa_1); compact tabs `pad 4; bg #F4F5F7; tab h36 14px/600`.
5. Bottom fade `abs bottom; h120; linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 70%); pointer-events none`.
6. Chat pill `<a href=P-Chat-Plan>` abs `left 50%; bottom 28; translateX(-50%); h58; pad 0 12 0 8; gap 10; r999; #000/#FFF; shadow 0 8px 24px rgba(11,27,63,.25)`: avatar stack 36px (border 2px #000, margin-left -12; first = Go avatar 5bda4a… bg #DCEBFF), "Chat" 15/600 + "Priya: scuba’s on me 🤿" 12px rgba(255,255,255,.7); unread badge "3" (`min-w 24 h24 pad 0 7 r999 bg #A44F3A 13px/700 tabular`).

**B. Scrim** `<a href=P-Home-Checkin aria-label="Close sheet">` abs inset 0, z5, `bg rgba(11,27,63,0.38)`.

**C. Sheet** `role=dialog aria-label="Web check-in · 6E 5313"`: abs `left/right/bottom 0; top:96px` (→ 816px tall), z6, flex column, `r 28 28 0 0; bg #F6F7F9; shadow 0 -8px 30px rgba(11,27,63,.18)`.
1. Grabber `40×5 r999 #DDE1E6; margin-top 8; align center`.
2. Scroll body `flex:1; overflow-y:auto; scrollbar none; padding 8px 16px 120px; column gap 12`:
   - **Sheet header** (pad 0 4, gap 2): row space-between gap 12: title "Web check-in · 6E 5313" 22px/600 `-0.02em` lh1.3; Close `<a href=P-Home-Checkin>` `40×40 r999 #FFF margin-right -6; shadow 0 1px 3px rgba(0,0,0,.08)` X SVG 18. Subtitle "Fri 6 Nov · takes under a minute" 14px #4A5878 `-0.004em` lh1.4 `text-wrap: pretty`.
   - **Step indicator** (1 of 3): `flex; gap 6; pad 0 2`; 3 equal segments (`flex:1; column gap 6`): bar `h4 r999`; label 12px/700. State here: seg1 bar #0B1B3F label #0B1B3F "1 · Details"; seg2/3 bar #DDE1E6 label #A5ACB8 "2 · Seat", "3 · Boarding pass".
   - **Route card** `pad 12 14; r18; #FFF; border 1px #ECEFF3; gap 12`: left "BLR 8:40p" 20px/700 tabular + "Bengaluru T1" 13 #4A5878; middle `flex:1` dashed rule (`border-top 1.5px dashed #C9CED6`) ✈️ dashed rule, color #A5ACB8, gap 4; right (align end) "GOX 9:55p" + "Goa · Mopa".
   - **Passenger details card** `pad 4 14; r18; #FFF; border 1px #ECEFF3` — read-only rows, NO inputs:
     - Row `pad 12 0; gap 12`: avatar c58d97… 40px; "Aarav Shah" 16/600 `-0.011em`; "Adult · name as on your ID" 13 #4A5878; green tick 22px.
     - Row (divider #ECEFF3) `pad 12 0; space-between; 14px`: "Mobile for flight alerts" (#4A5878) / "+91 98••• ••210" (600).
     - Row: "Bags" / "7 kg cabin · 15 kg check-in".
   - **DigiYatra toggle row** `pad 12 14; r18; #FFF; border; gap 12`: 🙂 20px; "Use DigiYatra at the airport" 15/600; "Face-based entry at Bengaluru T1" 13 #4A5878; `<button aria-pressed={{digi}} onClick={{flipDigi}} style={{digiStyle}}>` switch: `52×32; padding 4; border 0; r999; flex; align-items center` bg on `#16A34A` / off `#DDE1E6`; knob `span.knob 24×24 r999 #FFF shadow 0 1px 3px rgba(0,0,0,.2)`. **No justify-content change → knob never moves right** (prototype bug; no `.knob` CSS exists).
   - **Declaration checkbox** full-width `<button aria-pressed={{decl}} onClick={{flipDecl}}>` `pad 12 14; r18; #FFF; border 1px #ECEFF3; gap 12; text-align left`: box `{{boxStyle}}` `26×26 r8` on `#000 bg / #FFF check` | off `#FFF bg, color transparent, border 1.5px #C9CED6`; check SVG 14 stroke 3. Text "I’m not carrying restricted items" 15/600 + "Power banks go in your cabin bag, not check-in" 13 #4A5878.
   - **Go note** `pad 12 14; r18; bg #FFF6F2; gap 10`: Go avatar 5bda4a… 28px bg #DCEBFF; "Go filled this in from your booking. Next, pick a seat. Go has one saved next to Arjun." 14px lh1.4.
3. **Sticky CTA bar** abs bottom of sheet `pad 40 16 24; column gap 10; linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`: `<a href=P-Checkin-Seat style={{ctaStyle}}>Continue to seats</a>` — `h56; r999; 18px/500; center`; enabled `#000/#FFF`; disabled (decl=false) `bg #DDE1E6; color #8A93A3; pointer-events:none`.

#### Sheets / overlays (trigger, dimensions, backdrop, grabber, contents, buttons, close behaviour)
- **Check-in sheet** (always open; this screen IS the sheet state): top 96 → 816px; scrim rgba(11,27,63,.38) z5 is a link to P-Home-Checkin (tap-outside closes = navigate back to Home-with-check-in-card); X → P-Home-Checkin. Grabber 40×5 #DDE1E6 (decorative, no drag).
- **Share-trip sheet** `sc-if pShare` z40: scrim `<button>` inset 0 rgba(11,27,63,.38) → pa_6 close. Panel `role=dialog aria-label="Share trip invite"` `.enter`, abs bottom, `pad 8 16 30; r 28 28 0 0; #F6F7F9; shadow 0 -8px 30px rgba(11,27,63,.18); gap 14`; grabber 40×5.
  - Invite card `pad 12; r18; #FFF; border #ECEFF3; gap 12`: img 63e022… 44×44 r12 bg #FFF1DC; "Join Goa crew on Go" 15/600 / "go.vestra.ai/t/goa-k7q" 13; "Copy" btn `h36 pad 0 12 r999 #F4F5F7 13/600` → toast "Invite link copied" (sheet stays open).
  - WhatsApp group row `<a href=P-WA-Compose>` `pad 10 12; r18; #FFF; border`: 44px 🌴 circle #FFF1DC with 18px #25D366 dot (border 2 #FFF); "Goa crew 🌴" / "WhatsApp group · recent"; chevron 16 #A5ACB8 stroke 2.4.
  - 5 share targets (`width 64; gap 6; tile 56×56 r18 border #ECEFF3; label 12/600`): WhatsApp (tile #25D366, speech-bubble SVG 28 white stroke 2) → `<a href=P-WA-Pick>`; 💬 Messages → toast "Opens Messages with the link filled in" + close; ✉️ Gmail → "Opens Gmail with the link filled in"; 🔗 Copy link → "Invite link copied"; ⋯ More → "Opens your phone’s share menu".
  - Trigger: hero share (pa_0) or collapsed-header share (pa_1) — **both sit under the z5 scrim, so unreachable** while the check-in sheet is up.
- Toast: see shared.

#### State & interactions (DCLogic)
- `PBase` state: `digi: true`, `decl: true`. Component adds `pT:null, pShare:false, pSent:[]`.
- Derived: `digi`/`decl` stringified for `aria-pressed`; `digiStyle = tog(digi)`; `boxStyle`; `ctaStyle` (disabled iff `!decl`). Constants: `collapsed:false`, `onScroll:noop`, `villaLive:false`, `indigoLive:false`.
- Handlers: `flipDigi` toggles digi; `flipDecl` toggles decl (only validation in the flow = declaration must be ticked). pa_0/pa_1 open share; pa_2..5 toast + close; pa_6 close; pa_7 toast only.
- No form inputs, no editing, no PNR/passport/ID fields, no focus styles.

#### Navigation table: element → target file
| Element | Target |
|---|---|
| Sheet X / scrim | P-Home-Checkin.dc.html |
| Continue to seats (enabled) | P-Checkin-Seat.dc.html |
| Backdrop hero back / collapsed back | P-App-Home.dc.html |
| Tabs Home/Itinerary/Bookings/Expenses | P-Home / P-Plan-Everyone / P-Bookings / P-Money-Everyone |
| Check in now (backdrop) | P-Checkin-Details.dc.html (self) |
| Record / Book ₹1,600 | P-Money-Record / P-Chat-CabSheet |
| Villa expand / Flights expand | P-Home-StayOpen / P-Home-FlyOpen |
| Chat pill | P-Chat-Plan.dc.html |
| Share sheet: WhatsApp group row / WhatsApp tile | P-WA-Compose / P-WA-Pick (**both files missing** in prototype dir) |

#### Data shown (seed values)
- Trip: Goa, Fri 6 – Mon 9 Nov, "in 2 days", Diwali; Villa Sol (paid by Rahul); budget ₹21.8k; Rahul owed ₹5,800; cab ₹1,600 Fri 9:55 pm with Arjun; chat preview "Priya: scuba’s on me 🤿", 3 unread; invite link go.vestra.ai/t/goa-k7q.
- Flight: IndiGo **6E 5313**, Fri 6 Nov, BLR 8:40p Bengaluru T1 → GOX 9:55p Goa · Mopa; check-in closes 1 hr before.
- Passenger: Aarav Shah, Adult; mobile +91 98••• ••210; bags 7 kg cabin · 15 kg check-in; DigiYatra (on); restricted-items declaration (ticked).
- Arjun on same flight; Go has a seat saved next to Arjun.

#### Icons & images
- SVGs (24 viewBox, stroke currentColor, round caps/joins): back arrow `M19 12H5` + `M11 6l-6 6 6 6` (20px, sw2); share `M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8` (18px, sw2); close X `M6 6l12 12` + `M18 6L6 18` (18, sw2); check `M5 12l5 5 9-10` (9/12/14px, sw 4/4/3); expand `M15 3h6v6, M9 21H3v-6, M21 3l-7 7, M3 21l7-7` (16, sw2.2); chevron `M9 6l6 6-6 6` (16, sw2.4, #A5ACB8); WhatsApp bubble `M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z` (28, white, sw2).
- Emoji: 📍 📅 ⏳ (hero), ✈️ 🏡 💰 📅 (rows), ✈️ (route divider), 🙂 (DigiYatra), 🤿 (chat preview), 🌴 💬 ✉️ 🔗 ⋯ (share sheet).
- Blobs: `1d74f508f447c4a1bb476cb83c275f7d` hero (alt "Palm silhouette against a Goa sunset over the sea", 420×236 cover); `7a6cf4a7c21683d8f45d293789e8c8e9` IndiGo logo (alt "IndiGo", 46w on #2B399B); avatars `c58d972a22611bbd2e2f8570c48c72b8` (Aarav/you), `cb0a34fddc3af7464df32602b63b30fa` (Rahul), `234f094a59fd64a1b23f7ec0e8d4cc45` (4th member, likely Priya), `8c7b7cb247d8cdf696b9f9eb4567da93` (Arjun), `5bda4ac2e39242651eeed457db2d1a9c` (Go assistant, bg #DCEBFF); `63e0220f3d27d3795e1836f5d29b07d1` invite thumbnail 44×44.

---

### P-Checkin-Seat.dc.html — K3 Check-in 2: seat next to Arjun

#### Purpose (1 line)
Step 2 of 3 sheet: interactive 6-across seat map (rows 12–18) with Arjun's seat marked, Go-preselected 14A, paid front rows, and a dynamic "Check in with seat X" CTA.

#### Layout top→bottom
**Backdrop**: byte-identical trip Home copy as K2 (hero, tabs, Pending/Done cards, collapsed header, fade, chat pill) — see K2 §A.

**Scrim** `<a href=P-Checkin-Details aria-label="Close sheet">` z5 rgba(11,27,63,.38) — tapping outside goes BACK to step 1 (not to Home).

**Sheet** `role=dialog aria-label="Pick your seat"`, same geometry as K2 (top 96, r28 top, #F6F7F9, shadow 0 -8px 30px rgba(11,27,63,.18), grabber 40×5 #DDE1E6 mt8; scroll body pad 8 16 120 gap 12).
1. Header: "Pick your seat" 22/600 `-0.02em`; X `<a href=P-Checkin-Details>` 40×40 #FFF shadow. Sub "6E 5313 · Bengaluru → Goa · Fri 8:40 pm" 14 #4A5878.
2. Step indicator: seg1 + seg2 active (#0B1B3F bar & label), seg3 inactive (#DDE1E6 / #A5ACB8).
3. **Go recommendation banner** `pad 12 14; r18; bg #E3F5EA; gap 10`: Go avatar 28 (bg #DCEBFF); text 14px lh1.4 color #0F7A37: **"14A is free, right next to Arjun."** (bold `<b>`) + " I’ve picked it. Tap any free seat to change." — static, does not react to selection.
4. **Seat map card** `pad 14 10; r22; #FFF; border 1px #ECEFF3; column gap 8`:
   - "FRONT OF PLANE" `align-self center; 11px/700; #4A5878; letter-spacing 0.08em; lh1.35`.
   - Column header row `flex center gap 6`: A B C (each `w40; center; 12px/700; #4A5878`), aisle spacer `w28`, D E F.
   - 7 seat rows (12→18), each `flex; align center; justify center; gap 6`: left group `flex gap 6` (A,B,C), aisle `w28; center; 12px/700; #A5ACB8; tabular-nums` showing row number, right group (D,E,F). Row width = 3×40+2×6 + 6 + 28 + 6 + 3×40+2×6 = 304px, centered in ~368px inner. Row gap 8px (card gap).
   - **Seat cell** `<button type=button aria-label={{lbXX}} onClick={{pkXX}} style={{stXX}}>{{txXX}}</button>`; base `40×40; box-sizing border-box; r12; flex center; font-family inherit; 11px/700; padding 0` + state:
     | State | bg | text colour | border | cursor | label text |
     |---|---|---|---|---|---|
     | **You / selected** | `#000000` | `#FFFFFF` | 0 | pointer | seat id e.g. "14A" |
     | **Taken** | `#ECEFF3` | `#C9CED6` | 0 | not-allowed | "" |
     | **Paid free (rows 12–13)** | `#FFF6F2` | `#A44F3A` | `1.5px solid #F0C9BC` | pointer | "₹" |
     | **Free** | `#FFFFFF` | `#A5ACB8` | `1.5px solid #DDE1E6` | pointer | "" |
     | **Friend (Arjun, 14B)** — `<span>` not button, `aria-label="Seat 14B, Arjun"` | `#EAF1FC` | – | `2px solid #3E73D6` | – | Arjun avatar img 28×28 round |
   - Precedence: mine > taken > paid > free. aria-label: `"Seat {id}" + (taken ? ", taken" : paid ? ", ₹450" : ", free")` (selected seat keeps its base label).
   - No exit rows, no wing marks, no extra-legroom tiers, no lavatory/galley glyphs. Single price tier ₹450 (rows 12–13).
5. **Legend** `flex-wrap; justify center; gap 12`; item `gap 5; 13px #4A5878 0.002em lh1.35`; swatch `14×14 r4 border-box`: Free (`#FFF`, `1.5px #DDE1E6`), ₹450 (`#FFF6F2`, `1.5px #F0C9BC`), Taken (`#ECEFF3`, no border), Arjun (`#EAF1FC`, `2px #3E73D6`), You (`#000`).
6. **Sticky CTA bar** (same gradient bar as K2: pad 40 16 24, gradient to #F6F7F9 35%): `<a href=P-Checkin-Pass>` `h56; r999; #000/#FFF; 18px/500` text `{{cta}}` = `"Check in with seat " + sel + (row<=13 ? " · ₹450" : " · free")` → default "Check in with seat 14A · free". Always enabled.

#### Seat map occupancy (seed) — rows 12–18 × A B C | D E F
Legend: `Y`=you (selected 14A) · `Arjun`=friend · `X`=taken · `₹`=paid free · `.`=free. Aisle between C and D.

| Row | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 12 | X | ₹ | X | X | ₹ | ₹ |
| 13 | ₹ | X | ₹ | ₹ | X | X |
| 14 | **Y** (default) | **Arjun** | X | . | X | . |
| 15 | X | . | . | . | . | X |
| 16 | . | X | X | X | . | . |
| 17 | X | . | . | . | X | . |
| 18 | . | . | X | X | . | X |
- `TAKEN = [12A,12C,12D,13B,13E,13F,14C,14E,15A,15F,16B,16C,16D,17A,17E,18C,18D,18F]` (18 seats); `ARJ='14B'`; paid = `row <= 13`.
- Free paid seats: 12B,12E,12F,13A,13C,13D. Free normal seats: 14A,14D,14F,15B,15C,15D,15E,16A,16E,16F,17B,17C,17D,17F,18A,18B,18E.
- Only seat adjacent to Arjun that is free: **14A** (14C is taken).

#### Sheets / overlays
- Check-in sheet (always open): scrim & X → P-Checkin-Details (back one step).
- Share-trip sheet (`pShare`) identical to K2 (same unreachable triggers, same 5 targets/toasts, same missing P-WA-* files).
- Toast: taken-seat tap → "**{id} is taken. Pick a free seat.**" (e.g. "12A is taken. Pick a free seat."), 2200ms.

#### State & interactions (DCLogic)
- `PBase` state: `sel: '14A'`. Component adds `pT, pShare, pSent`.
- `renderVals` loops r=12..18 × c=A..F (skips 14B) emitting `st{id}` style, `tx{id}` text, `lb{id}` aria, `pk{id}` handler: if not taken → `setState({sel:id})`; else `_toast(id+' is taken. Pick a free seat.')`.
- Derived `cta` (see above); `paidSel = parseInt(sel) <= 13`.
- Derived `note = (sel==='14A'||sel==='14C') ? 'Next to Arjun' : 'Not next to Arjun'` — **computed but not bound anywhere** in template.
- Selecting a ₹450 seat changes only CTA text; no payment sheet/step exists. Re-tapping the selected seat keeps it selected (no deselect).
- Selection is NOT passed to the Pass screen (Pass hardcodes 14A).
- Constants `collapsed:false, onScroll:noop, villaLive:false, indigoLive:false`.

#### Navigation table
| Element | Target |
|---|---|
| Scrim / X | P-Checkin-Details.dc.html |
| CTA "Check in with seat …" | P-Checkin-Pass.dc.html |
| Backdrop links | same as K2 (P-App-Home, P-Home, P-Plan-Everyone, P-Bookings, P-Money-Everyone, P-Checkin-Details, P-Money-Record, P-Chat-CabSheet, P-Home-StayOpen, P-Home-FlyOpen, P-Chat-Plan) |
| Share sheet WhatsApp row / tile | P-WA-Compose / P-WA-Pick (missing) |

#### Data shown (seed values)
- Flight 6E 5313 · Bengaluru → Goa · Fri 8:40 pm. Arjun = 14B. You default 14A (free). Paid seat price ₹450 (rows 12–13). Backdrop data identical to K2.

#### Icons & images
- X close SVG (18, sw2). Arjun avatar `8c7b7cb247d8cdf696b9f9eb4567da93` 28px inside 14B cell. Go avatar `5bda4ac2e39242651eeed457db2d1a9c` 28px bg #DCEBFF. "₹" glyph as text in paid seats. Backdrop/share-sheet icons as K2.

---

### P-Checkin-Pass.dc.html — K4 Check-in 3: boarding pass

#### Purpose (1 line)
Full-screen (not a sheet) step 3/3 confirmation: "You're checked in" banner, IndiGo boarding pass card with QR, Go follow-up note, Save to wallet / Download actions.

#### Layout top→bottom
**Root** 420×912 flex column bg #F6F7F9 (no trip backdrop, no scrim).
1. **Top bar** `flex-shrink 0; padding 46px 12px 8px; flex; align center; gap 6`:
   - Back `<a href=P-Home-Checkin>` `44×44 r999` transparent, arrow-left SVG 22 sw2.
   - Title "Boarding pass" `flex:1; 20px/700; -0.018em`.
   - Share `<a role=button onClick=pa_0 aria-label="Share boarding pass">` 44×44, share SVG 20 → toast.
2. **Scroll body** `flex:1; overflow-y:auto; scrollbar none; padding 4px 16px 130px; column gap 12`:
   - **Step indicator**: all 3 segments active (#0B1B3F bars, #0B1B3F labels).
   - **Success banner** `.enter` `pad 12 14; r18; bg #E3F5EA; gap 10`: tick circle `24×24 r999 #16A34A #FFF` (SVG 13 sw4); text "You’re checked in. Seat 14A, next to Arjun." 15px/600 #0F7A37.
   - **BOARDING PASS CARD** `r24; #FFF; shadow 0 1px 2px rgba(11,27,63,.05), 0 6px 18px rgba(11,27,63,.06); overflow hidden`:
     - **Airline band** `pad 14 18; bg #2B399B; #FFF; flex space-between center`: IndiGo logo img width 70 (auto h); "6E 5313" 14px/700 letter-spacing 0.04em.
     - **Body** `pad 18; column gap 16`:
       - Route row `gap 10`: "BLR" 34px/800 `-0.02em` + "Bengaluru · T1" 13 #4A5878; centre dashed `1.5px #C9CED6` + ✈️ (#A5ACB8, gap 4); right-aligned "GOX" 34/800 + "Goa · Mopa".
       - Field grid (3 flex rows, `gap 8`, each cell `flex:1; column; gap 2`): label 11px/700 #4A5878 `0.08em` lh1.35 uppercase-as-written; value 17px/700 tabular-nums.
         - Row 1: PASSENGER "AARAV SHAH" (left) · DATE "Fri 6 Nov" (right-aligned).
         - Row 2: BOARDING "8:00 pm" (left) · DEPARTS "8:40 pm" (centred) · SEAT "14A" (right).
         - Row 3: GATE "At airport" (left) · ZONE "2" (centre) · SEQ "087" (right).
     - **Tear line** `aria-hidden; position relative; height 0; border-top 2px dashed #ECEFF3; margin 0 18px`. **No notch cut-outs / radial-gradient mask** in source (relative positioning suggests notches were intended but none present).
     - **Stub** `pad 18; flex center; gap 16`:
       - QR `<svg viewBox="-1 -1 27 27" width=150 height=150 role=img aria-label="Boarding pass QR code" shape-rendering=crispEdges style="display:block; background:#FFFFFF">` with `<g fill="#0B1B3F">` of **299** `<rect width=1 height=1>` on a 25×25 module grid (x,y 0–24; 1-module quiet zone from viewBox). Decorative (not a valid encoded QR — no proper timing/format rows). Bitmap (row=y, col=x, `#`=dark):
```
00 #######..#####.#..#######
01 #.....#..#..#.....#.....#
02 #.###.#..##...##..#.###.#
03 #.###.#.#..######.#.###.#
04 #.###.#.....###.#.#.###.#
05 #.....#..##.###...#.....#
06 #######..###.#..#.#######
07 ............##.##........
08 ##.#..####.##...####..###
09 .#.###...##.###..##..#...
10 ##..##.#..#.#..#......##.
11 ..#.#.###.#...#.#.###...#
12 .###.#..##......##..##...
13 ....##..#..#.....###.#...
14 .##...###......#..##....#
15 .#..####...##...#....####
16 .........##.....###..#...
17 .........#...#####..##.##
18 #######.####.#.###..#.#.#
19 #.....#.#..#####.....#.#.
20 #.###.#.###...###.#.#..##
21 #.###.#.#.#.#.....##.###.
22 #.###.#.#.#.#..##.##.##..
23 #.....#..#.....#.#...#.##
24 #######.#....#..##..##...
```
         (Finder patterns at TL/TR/BL. Implementation: render a real QR from PNR/seq, or reproduce this bitmap 1:1.)
       - Right column `flex:1; column; gap 8`: pill "🙂 DigiYatra on" (`h28; pad 0 10; align-self flex-start; r999; #E3F5EA; #0F7A37; 12px/700`); "Show this at security if DigiYatra isn’t working." 13 #4A5878; "7 kg cabin · 15 kg check-in" 13 #4A5878.
   - **Go note card** `pad 12 14; r18; #FFF; border 1px #ECEFF3; gap 10`: Go avatar 28 (bg #DCEBFF); "I’ll ping you when the gate is announced and when boarding starts. Arjun’s in 14B." 14px lh1.4; Arjun avatar 28 at right.
3. **Bottom action bar** abs bottom `pad 30 16 24; flex; gap 8; linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 40%)`:
   - "Save to wallet" `<a role=button onClick=pa_1>` `h56; pad 0 18; r999; bg rgb(0,0,0); #FFF; 17px/500; -0.014em; lh1.3; flex 1 1 0%` → toast. (Text only, no wallet icon.)
   - "Download" `<a href=P-Chat-Plan>` `h56; pad 0 14; r999; bg rgb(242,242,242) (#F2F2F2); #0B1B3F; 16px/600; -0.004em; lh1.35; flex 1 1 0%`. (No icon.)
   - Note: styles here are written as `rgb()` so the global `[style*="background: #000000"]` press-overlay selectors do NOT match these two buttons.

#### Sheets / overlays
- None rendered (`pShare` state exists but no share-sheet markup). Toast only.

#### State & interactions (DCLogic)
- `PBase.renderVals` returns `{}` (no state). Component: `pT, pShare, pSent`.
- pa_0 (header share) → toast "Boarding pass shared to Goa crew".
- pa_1 (Save to wallet) → toast "Boarding pass added to your wallet".
- `.enter` on success banner = mount fade/slide-up 6px over 220ms.

#### Navigation table
| Element | Target |
|---|---|
| Back arrow | P-Home-Checkin.dc.html |
| Download | P-Chat-Plan.dc.html (likely mis-wired; expected a download/PDF action) |
| Share (header) | toast only |
| Save to wallet | toast only |

#### Data shown (seed values)
- Airline IndiGo, flight **6E 5313**; BLR Bengaluru · T1 → GOX Goa · Mopa; date Fri 6 Nov; boarding **8:00 pm**; departs **8:40 pm**; seat **14A**; gate "At airport"; zone **2**; sequence **087**; passenger **AARAV SHAH**; DigiYatra on; bags 7 kg cabin · 15 kg check-in; Arjun seat 14B. No PNR, no arrival time, no terminal for GOX on the pass.

#### Icons & images
- SVGs: back arrow (22, sw2), share (20, sw2), check (13, sw4, white on #16A34A).
- Emoji: ✈️ route divider; 🙂 DigiYatra pill.
- Blobs: IndiGo logo `7a6cf4a7c21683d8f45d293789e8c8e9` (alt "IndiGo", width 70 on #2B399B); Go avatar `5bda4ac2e39242651eeed457db2d1a9c` 28; Arjun `8c7b7cb247d8cdf696b9f9eb4567da93` 28.
- QR: inline SVG described above.

---

### P-Ticket-PDF.dc.html — M3 Ticket PDF viewer
Omitted here — see `plans/screens/M-bookings-money.md` §2 (M3).

---

### Group notes

#### Shared element names (proposed components)
- `CheckinSheet` [`BottomSheet top={96}` hosting `CheckinDetailsSheet` / `CheckinSeatSheet`] — bottom sheet: `top:96px` (816h), `r28 28 0 0`, `#F6F7F9`, `shadow 0 -8px 30px rgba(11,27,63,.18)`, grabber `40×5 #DDE1E6 mt8`, scroll body `pad 8 16 120 gap 12`, scrim `rgba(11,27,63,.38)`.
- `SheetHeader` [`SheetHeader`] — 22/600 title + 40px white round X (shadow 0 1px 3px rgba(0,0,0,.08), mr -6) + 14px #4A5878 subtitle.
- `StepIndicator(step: 1|2|3)` [`StepIndicator` (common, on `SegmentedProgress`)] — 3 segments, bar h4 r999 (#0B1B3F active / #DDE1E6), label 12/700 (#0B1B3F / #A5ACB8), labels "1 · Details", "2 · Seat", "3 · Boarding pass". Steps ≤ current are active.
- `RouteRow` [screen-local `checkin/RouteRow`, `size` sm|lg] — code/time + city, dashed 1.5px #C9CED6 rule with ✈️ centre (20px/700 compact on K2; 34px/800 on pass).
- `InfoCard` [`Card variant=outline radius=lg`] — `pad 12 14 (or 4 14); r18; #FFF; border 1px #ECEFF3`; `KVRow` [`KVRow`] (14px, label #4A5878 / value 600, divider #ECEFF3).
- `Toggle` [`Switch`] (52×32, knob 24, on #16A34A / off #DDE1E6) — fix knob position (translateX 20px when on).
- `CheckboxCard` [`CheckboxCard` on `Checkbox`] (26×26 r8 box, black when checked).
- `GoNote` / `GoBanner` [`GoNote` on `Note` variants `peach` / `green` / `outline`] — Go avatar 28 (bg #DCEBFF) + 14px copy; variants: peach `#FFF6F2` (K2), green `#E3F5EA`+`#0F7A37` text (K3, K4 success), white bordered (K4 follow-up).
- `SeatCell(state: free|paid|taken|selected|friend)` [`SeatCell` on `Toggle variant=seat`] + `SeatMap(rows, cols, aisleAfter='C')` [`SeatMap`] + `SeatLegend` [`SeatLegend`].
- `BoardingPassCard` [`BoardingPassCard`] (airline band #2B399B, route, `PassField` [screen-local `checkin/PassField`] label/value grid, dashed tear line [`Separator dashed`], QR stub [`QrBitmap`]).
- `StickyCtaBar` [`SheetFooter` (K2/K3) / `FadeDock variant=gradient` (K4) + `Button primary xl`] — gradient fade bar with 56h pill CTA (black / disabled #DDE1E6 + #8A93A3).
- `PdfViewer` [`PdfViewer` (+`PdfPage`, `PageCounterPill`) — M spec] (toolbar, A4 page 360×509, page pill, Save/Share bar).
- `Toast` [sonner `Toaster` + `toastGo()`] (shared), `ShareTripSheet` [`ShareInviteSheet`] (shared with other trip screens).
- Colour tokens: ink #0B1B3F, muted #4A5878, faint #A5ACB8, line #ECEFF3, track #DDE1E6, dash #C9CED6, bg #F6F7F9, chip #F4F5F7, button-grey #F2F2F2, success #16A34A / #E3F5EA / #0F7A37, IndiGo #2B399B, friend #3E73D6 / #EAF1FC, paid #FFF6F2 / #F0C9BC / #A44F3A (also unread-badge red), viewer bg #E4E7EC, skeleton #E6E9EE.

#### Route proposal
- Sources imply **steps 1–2 are modal sheets over trip Home** (backdrop = Home screen incl. the "Web check-in is open" card; closing returns to `P-Home-Checkin` = Home with check-in card), while **step 3 is a full-screen page** (own top bar, back → Home-Checkin).
- Recommend: `/trips/[tripId]/checkin/[flightId]` as one route with `step` state (`details` → `seat`) rendered as an intercepting/parallel sheet over the trip Home (`@modal` slot), plus `/trips/[tripId]/checkin/[flightId]/pass` (or `/boarding-pass/[flightId]`) as a full page. Seat step's back/scrim returns to details (step state decrement), not to Home. Keep `?step=` in URL so deep links like the Home "Check in now" land on details.
- Ticket viewer: `/trips/[tripId]/bookings/[bookingId]/ticket` full-screen; Close → Bookings.
- Shared check-in state needed across steps: `digiYatra`, `declaration`, `selectedSeat` (feeds pass seat, success banner "Seat X, next to Arjun", Go note). Prototype hardcodes 14A on the pass.

#### Nav graph
Home "Check in now" (P-Home-Checkin) → K2 Details →(Continue, requires declaration)→ K3 Seat →(Check in with seat …)→ K4 Pass → back → P-Home-Checkin.
K2 close/scrim → P-Home-Checkin; K3 close/scrim → K2. K4 Download → P-Chat-Plan (suspicious). Ticket PDF ← P-Bookings / P-Bookings-Scrolled / P-Chat-PrivateSheet; close → P-Bookings.

#### Surprises / ambiguities
1. **No form inputs at all** in step 1: no PNR, passport/ID, DOB, email or editable contact fields — everything is Go-prefilled read-only (name, masked mobile, bags). Brief's "input styles/focus" do not exist; only DigiYatra toggle + declaration checkbox.
2. **Toggle knob never moves** (no justify/translate for on-state) — implement properly.
3. **Seat selection not propagated**: pass/banners hardcode 14A; Go banner on K3 is static even after changing seat; `note` ("Next to Arjun"/"Not next to Arjun") computed but unused; 14C considered "next to Arjun" in logic but is taken.
4. **Paid seats (₹450) have no payment flow**; CTA text only appends "· ₹450".
5. **No exit rows / legroom tiers / multiple price tiers**; only rows 12–18 shown (no scroll of full cabin); single friend marker (Arjun) — other trip members (Rahul, Priya) not on seat map.
6. **Boarding pass has no notch cut-outs / radial-gradient mask** — just a 2px dashed #ECEFF3 line with 18px side margins. QR is a decorative 25×25 bitmap (299 modules), not scannable data.
7. **"Save to wallet" is text-only toast; "Download" on pass links to P-Chat-Plan** (likely wrong). No PNR on the pass; GATE shows "At airport".
8. **Ticket PDF shows "Passenger: [YOUR NAME]"** literal placeholder while pass shows "AARAV SHAH"; PDF times use 24h ("20:40/21:55") vs 12h elsewhere ("8:40 pm/9:55p"). PDF booked date 12 Oct 2026 (implies trip year 2026). No zoom/expand control in the viewer; "1 / 2" static.
9. Share sheet markup exists on K2/K3 but its triggers sit beneath the check-in scrim → unreachable; its WhatsApp targets `P-WA-Compose`/`P-WA-Pick` are **missing files**.
10. Pass bottom buttons use `rgb()` inline styles, so global press-overlay CSS selectors (which match `#000000` / `#F2F2F2` text) don't apply — implementers should apply the same press feedback anyway.
11. Arrival terminal for GOX not given anywhere; departure terminal "T1" (Bengaluru). Boarding 8:00 pm = 40 min before departure; check-in "closes 1 hr before".

---

_From the J + K1 inventory (trip-home entry state):_

### P-Home-Checkin.dc.html — K1 · Home · web check-in open, 2 days before

#### Purpose (1 line)
Trip home two days before departure with a new "Web check-in is open" action card at the top of Pending.

#### What differs from P-Home
- Hero ⏳ "in 2 days" (was "in 34 days").
- Pending count "3 left"; a new check-in card inserted between the Pending header and the existing 2-row card.
- Script: `calls: []`, `open: null` → no Go’s calls; "Need something sorted?" form card visible (no last-call row). No auto-scroll. FAB unchanged (Priya preview, badge 3). Done unchanged ("4 done", original subs).
- No sheet/overlay (despite "check-in open" — it is an inline card).

#### Layout of the differing/overlay parts
- Card [`CheckinCard`]: `padding: 16px; border-radius: 22px; #FFFFFF; card shadow; column gap 12px`.
  - Row (gap 12): airline logo tile `56×40; border-radius: 12px; background: #2B399B; centered` containing `<img src="/_blob/7a6cf4a7c21683d8f45d293789e8c8e9" alt="IndiGo">` `width: 46px; height: auto`. Text col (gap 1): "Web check-in is open" `16px/600 -0.011em` + "NEW" pill `height: 20px; padding: 0 7px; radius 999; #E3F5EA; #0F7A37; 11px/700`; sub "6E 5313 · Fri 8:40 pm · closes 1 hr before" `13px #4A5878`.
  - Companion box: `padding: 10px 12px; border-radius: 14px; background: #F4F5F7; gap: 10px` → Arjun avatar `8c7b7cb2…` 28×28 + "Arjun is on the same flight. Check in now and Go will try to seat you together." `14px lh 1.35`.
  - CTA `<a href="P-Checkin-Details.dc.html">` **Check in now**: `height: 50px; padding: 0 18px; radius 999; background: #000000; color: #FFFFFF; 16px/500 -0.014em` (full width).

#### Sheets / overlays
Share sheet only.

#### State & interactions
- Initial `{calls: [], open: null}`; everything else as PBase. Flights row still opens to IndiGo options + "Web check-in opens Wed 4 Nov · Preview" (links to this same screen — self-link) + details.

#### Navigation table
Same as J1, plus: **Check in now → `P-Checkin-Details.dc.html`** (exists; outside this group).

#### Data shown (seed values)
- "in 2 days"; "3 left".
- "Web check-in is open" · "NEW" · "6E 5313 · Fri 8:40 pm · closes 1 hr before" · "Arjun is on the same flight. Check in now and Go will try to seat you together." · "Check in now".
- Rest as J1 (Settle up with Rahul, Airport cab to Villa Sol, form card, Done 4).

#### Icons & images
- IndiGo logo blob `7a6cf4a7c21683d8f45d293789e8c8e9` (alt "IndiGo", 46 px wide on #2B399B 56×40 tile, radius 12). Arjun avatar 28 px. No new SVGs.
