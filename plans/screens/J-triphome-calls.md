# J · Trip home & Go’s live calls (J1–J7, K1 entry)

Populated trip home (`/trips/[tripId]`, trip `goa`, `trip.stage === 'planned'`) with Go’s live vendor calls, the Listen-in sheet and the call-recording sheet. K1 is covered here only as a trip-home state (check-in card in Pending); its sheets (K2/K3) and pass (K4) are in `K-checkin.md`. The hero, tabs, collapsing header, fade and Chat FAB come from `TripShell` (`I-plan-empty.md`). Component names are PLAN §7; tokens are PLAN §3 (note: `Card radius=2xl` = 22px, while the class `rounded-2xl` = 14px; `rounded-3xl` 16, `rounded-4xl` 18, `rounded-6xl` 22, `rounded-xl` 12).

## 1. Spec (normative)

### 1.1 Artboards → route + state

Every row requires `trip.stage === 'planned'` (`ensureStage('plan')`); otherwise `/trips/goa` renders I1. Notation: `villa@01:12` = `ActiveCall {id:'villa', vendor:'villa', asking: VENDOR_CALLS.villa.defaultAsk, startedAt: now − 72 s}`; `indigo@03:40` = startedAt now − 220 s. `pending` is the derived `selectPending('goa')` result (not stored): `checkin` (check-in open), `settle` (You→Rahul settlement open in `money`), `cab` (`chat.cab.booked` unset). `applyPreset(id)` writes the store patch, then `router.replace(route)`.

| Artboard | Canvas title | Route + query | `calls[]` | `openRow` | `askForm` | `lastCall` / `resolved` | `pending` (derived) | `checkin.status` | `daysToGo` | Preset |
|---|---|---|---|---|---|---|---|---|---|---|
| J1 | J1 · Home · one live call, full width · updated | `/trips/goa` | `[villa@01:12]` | `null` | `open:false` (form hidden) | – / `[]` | settle, cab → "2 left" | `not-open` | "in 34 days" | `J1` |
| J2 | J2 · Home · stay row opened · call options + details · new | `/trips/goa?open=stay` | `[]` | `stay` | `open:false` (form shown: no calls) | – / `[]` | settle, cab → "2 left" | `not-open` | "in 34 days" | `J2` (auto-scroll via `?open`) |
| J3 | J3 · Home · flights row opened · call options + details · new | `/trips/goa?open=fly` | `[villa@01:12]` | `fly` | `open:false` (hidden) | – / `[]` | settle, cab → "2 left" | `not-open` | "in 34 days" | `J3` (auto-scroll) |
| J4 | J4 · Home · tapped Call IndiGo · 2 calls, swipe · updated | `/trips/goa?open=fly` | `[villa@01:12, indigo@03:40]` | `fly` | `open:false` (hidden) | – / `[]` | settle, cab → "2 left" | `not-open` | "in 34 days" | `J4` (auto-scroll) |
| J5 | J5 · Listening in · booking details, mute, take over, end · updated | `/trips/goa?sheet=listen&call=villa` | `[villa@01:12]` | `null` | `open:false`; `listen {muted:false, takenOver:false, detailsOpen:false}` | – / `[]` | settle, cab → "2 left" | `not-open` | "in 34 days" | `J5` |
| J6 | J6 · Home · all done · last call recording | `/trips/goa` | `[]` | `null` | `open:false` (form shown: no calls) | `{vendor:'villa', asking: defaultAsk}` / `['villa','indigo']` | none (money You→Rahul settled + `chat.cab.booked` set) → `AllSetCard` | `not-open` | "in 34 days" | `J6` |
| J7 | J7 · Call recording · outcome, player, transcript | `/trips/goa?sheet=recording&call=villa` | `[]` | `null` | as J6; `recording {playing:false, rate:1}` | as J6 | none | `not-open` | "in 34 days" | `J7` |
| K1 | K1 · Home · web check-in open, 2 days before | `/trips/goa` | `[]` | `null` | `open:false` (form shown: no calls) | – / `[]` | checkin, settle, cab → "3 left" | `open` | "in 2 days" | `K1` |

### 1.2 Populated trip home anatomy

Page = `TripHomeScreen` (`trip/TripHomeScreen.tsx`, "use client", P3-17) rendered by `app/trips/[tripId]/page.tsx` inside `TripShell` (I spec: hero 236, tabs −26 overlap, collapsing header 110→200, bottom fade, `ChatFab`; content column `px-4 pt-4 pb-[120px] flex flex-col gap-2.5`). `TripHomeScreen` binds the store and passes props down; every composite below is props-only (PLAN §7 Layer 2), except the two sheets in §1.4. It passes to `TripShell`: hero ⏳ line = `home.daysToGo`; `ChatFab` = `allSet ? {preview:"Rahul: see you all friday 🌴", unread:0} : {preview:"Priya: scuba’s on me 🤿", unread:3}` where `allSet = pending.length === 0`.

Sections, in order (each only when its condition holds):

**A. Pending** (`pending.length > 0`; else **B**)
1. `SectionHeader` title "Pending on you", meta `${n} left` (`mt-0`; `flex items-baseline justify-between px-1`; title `text-20 font-semibold tracking-h3`; meta `text-13 font-semibold text-muted tracking-caption`).
2. `CheckinCard` (only when `checkin.status === 'open'`, K1) — `Card variant=shadow radius=2xl` `p-4 flex flex-col gap-3`:
   - Row `flex items-center gap-3`: logo tile `w-14 h-10 rounded-xl bg-indigo grid place-items-center` with `<img src="/icons/brand/indigo.svg" alt="IndiGo" className="w-[46px] h-auto">`; text col `flex flex-col gap-px`: line `flex items-center gap-2` = "Web check-in is open" `text-16 font-semibold tracking-body` + `Badge variant=success-soft size=xs` "NEW"; sub "6E 5313 · Fri 8:40 pm · closes 1 hr before" `text-13 text-muted tracking-caption`.
   - Companion box `rounded-2xl bg-surface-2 px-3 py-2.5 flex items-center gap-2.5`: `Avatar size=28` (arjun) + "Arjun is on the same flight. Check in now and Go will try to seat you together." `text-14 leading-[1.35]`.
   - `Button variant=primary size=md` `w-full px-[18px]` "Check in now" → push `?sheet=checkin&step=details`.
3. `PendingCard` (rows `settle`, `cab` that are present) — `ListCard padding=rows` (`px-3.5`, card 22, shadow-card). `PendingRow` = `flex items-center gap-3 py-3` (+ `border-t border-line` from the 2nd row); title `text-16 font-semibold tracking-body leading-[1.3]`; sub `text-13 text-muted tracking-caption`; CTA `Button variant=primary size=sm asChild` `px-[18px] tracking-h4` wrapping `<Link>`:
   - settle: `Avatar size=40` (rahul) · "Settle up with Rahul" · "₹5,800 left of your villa share" · "Record" → `/trips/goa/expenses?scope=me&sheet=record`.
   - cab: composite icon `relative size-10 shrink-0` = ✈️ in `size-[30px] rounded-full bg-surface-2 text-14 grid place-items-center` (top-left) + 🏡 in `size-6 rounded-full bg-amber-soft text-12 grid place-items-center absolute right-0 bottom-0` · "Airport cab to Villa Sol" · "Fri 9:55 pm · with Arjun" · "Book ₹1,600" → `/trips/goa/chat?sheet=cab`.

**B. All set** (`pending.length === 0`, J6/J7) — `AllSetCard`: `Card variant=shadow` `rounded-[26px] px-[18px] py-[22px] flex items-center gap-3.5`: disc `size-14 rounded-full bg-success-soft text-success grid place-items-center` with `Check className="size-7" strokeWidth={3}`; col `flex flex-col gap-0.5`: "You’re all set" `text-22 font-semibold tracking-h2`; "Nothing pending on you. Go pings you if plans change." `text-14 text-muted leading-[1.4]`.

**C. Go’s calls** (`calls.length > 0`) — wrapper `flex flex-col gap-2.5`:
1. `SectionHeader live` `mt-2 items-center`: title "Go’s calls" + `LiveDot size=8 pulse` (gap-2); meta `callCount` ("1 live" | "N live · swipe").
2. One call → `flex flex-col gap-2`: `LiveCallCard layout="full"` + `Button variant=dashed size=base` `w-full text-14 gap-1.5` with `Plus className="size-4"` + "Ask Go to make another call" → `openForm()`.
3. Many calls → `CallCarousel`: `HorizontalRail inset` (`-mx-4 px-4 pt-0.5 pb-1.5 gap-2.5 snap-x snap-mandatory scroll-px-4 scrollbar-none`; at 420px a 330px slide leaves ~64px of the next one peeking) containing `LiveCallCard layout="slide"` × N (start order) + `AddCallTile`; then `CarouselDots` (`flex justify-center gap-1.5`, `aria-hidden`; count = N + 1; dot `h-1.5 rounded-full transition-[width,background-color] duration-200`, active `w-[18px] bg-ink`, inactive `w-1.5 bg-line-4`). Active index tracked by an `IntersectionObserver` (root = rail, threshold 0.6, every slide incl. the add tile observed; highest-ratio entry wins; reset to 0 when the call list changes) — **deviation: dots move**.
   - `AddCallTile`: `<button type="button">` `w-[150px] shrink-0 snap-start rounded-6xl border-[1.5px] border-dashed border-line-2 bg-transparent p-4 flex flex-col items-center justify-center gap-2 active:scale-[0.97]` → `size-11 rounded-full bg-white shadow-card grid place-items-center` with `Plus className="size-5"` + "Ask Go to make another call" `text-14 font-semibold text-center leading-[1.3]` → `openForm()`.
4. `LiveCallCard {call, layout, onListen, onEnd}` — `Card variant=shadow radius=2xl` `p-4 flex flex-col gap-3` + `full: w-full` | `slide: w-[330px] shrink-0 snap-start`:
   - Row A `flex items-center gap-2.5`: avatar wrap `relative size-10 shrink-0` = `<span aria-hidden className="absolute inset-0 rounded-full animate-live"/>` (pulse ring) + `Avatar size=40 kind=go` + vendor badge `absolute -right-1 -bottom-1 size-[22px] rounded-full border-2 border-white grid place-items-center text-11` on the vendor tint (villa `bg-amber-soft`, indigo `bg-info-tint-3`*, cab `bg-surface-2`) with the vendor emoji. Text col `flex min-w-0 flex-col gap-px`: line `flex items-center gap-2` = "Go ↔ {who}" `text-16 font-semibold tracking-body` + `Badge variant=success-soft size=sm` `tabular-nums` "LIVE · {mm:ss}"; sub `{phone}` `text-13 text-muted tracking-caption`.
   - ASKING FOR box `rounded-2xl bg-surface-2 px-3 py-2.5 flex flex-col gap-1`: `Eyebrow tone=muted` "ASKING FOR" (11/700 tracking-eyebrow) + `{asking}` `text-15 font-semibold`.
   - Row `flex items-center gap-2.5`: `AudioBars` (14 bars, heights `[8,16,24,12,20,28,14,22,10,18,26,12,16,8]`, `w-[3px] rounded-full bg-success`, container `h-[30px] gap-[3px] items-center`, delays `i × 90ms` via `--d`, `animate-wave`) + quote `{line}` `flex-1 text-14 italic text-muted leading-[1.35]`.
   - Row `flex gap-2`: `Button variant=primary` `h-[46px] flex-1 text-15 font-semibold` "🎧 Listen in" (emoji `<span aria-hidden>`) → `onListen` (push `?sheet=listen&call={id}`) + `Button variant=danger-soft` `h-[46px] px-[18px] text-15` "End call" → `onEnd` (`endCall(id)`).

**D. Ask Go form** (`showForm`) — `AskGoForm {chips, selected, draft, onChip, onDraft, onSubmit, lastCall?}`: `Card variant=shadow radius=2xl` `p-4 flex flex-col gap-3`:
1. Head `flex items-center gap-2.5`: `Avatar size=36 kind=go` + col: "Need something sorted?" `text-16 font-semibold tracking-body`; "Go calls the villa, airline or cab desk and handles it" `text-13 text-muted`.
2. Chips `flex flex-wrap gap-1.5`: `Chip size=xs` × 4 (main table, §1.3), single-select, `pressed` = selected (outline → solid, `aria-pressed`, bg/colour transition 160ms).
3. `InputField shape=ask` `text-15` (h-[52px] rounded-full bg-surface-2 pl-4 pr-1.5 gap-2): sr-only label "What should Go ask for?"; placeholder "e.g. we land at 10 pm, keep the gate open"; trailing `Button variant=primary` `h-10 px-[14px] text-14 font-semibold` "📞 Ask Go to call" → `onSubmit` (`callMain`).
4. `LastCallRow` (only when `home.lastCall`; the row lives inside the form, so it hides whenever the form hides): `border-t border-line pt-2.5 flex items-center gap-2.5` = `CheckBadge size=22` + `flex-1 text-14 leading-[1.35]` "<strong class=font-semibold>Last call · {who}</strong> · {outcome headline with first letter lower-cased}" (villa: "Last call · Villa Sol · late check-in confirmed for 11 pm") + `Button variant=tint size=xs` `gap-[5px]` with `Play className="size-[11px]"` + "Recording" → push `?sheet=recording&call={lastCall.vendor}`.

**E. Done** — `SectionHeader` title "Done", meta `doneLabel` ("4 done" | "All 6"), `mt-2`, `data-anchor="done"` + `scroll-mt-[160px]` (ref used for auto-scroll). Then `DoneList` = `ListCard padding=tight` (`px-3.5 py-0.5`); rows separated by `border-t border-line` (first none):
1. `ExpandableBookingRow {emoji, title, sub, live, open, onToggle, children}` for stay (🏡, vendor villa, row key `stay`) and flights (✈️, vendor indigo, row key `fly`):
   - Header `<button type="button" aria-expanded aria-controls>` `flex w-full items-center gap-2.5 py-[11px] text-left`: `EmojiTile size=36 shape=circle tint=surface-2` (`text-16`) in a `relative` wrap with `CheckBadge size=16` at `absolute -right-[3px] -bottom-[3px]`; text col `flex-1 min-w-0 flex flex-col gap-px`: title `text-15 font-semibold text-muted`, sub `text-13 text-muted`; when `live`: `Badge variant=success-soft size=md-bold` `gap-[5px]` with leading `LiveDot size=7 pulse` + "On a call"; `ChevronDown className="size-[18px] text-muted transition-transform duration-200" strokeWidth={2.4}` + `rotate-180` when open.
   - Body (only when open) `flex flex-col gap-2.5 pt-0.5 pb-3.5` with enter `transition-[opacity,transform] duration-220 ease-[var(--ease-out)] starting:opacity-0 starting:translate-y-1.5`, in order:
     1. live → `VendorLivePanel {who, asking, onListen, onEnd}`: `rounded-4xl bg-success-soft px-3.5 py-3 flex flex-col gap-2.5` (+ same `starting:` enter). Row `flex items-center gap-2.5`: `relative size-9` = pulse ring span + `Avatar size=36 kind=go`; col: line `flex items-center gap-2` = "Go is on a call with {who}" `text-15 font-semibold text-success-ink` + `Badge variant=white size=xs` `border-0 text-success-ink` "LIVE"; "Asking: {asking}" `text-13 text-success-ink`. Row `flex items-center gap-2`: `AudioBars` `h-[26px]` + `flex-1` spacer + `Button variant=success-ink` `h-[38px] px-[14px] text-14 font-semibold` "🎧 Listen in" (→ `?sheet=listen&call={vendor}`) + `Button variant=white` `h-[38px] px-[14px] text-14 text-danger shadow-none` "End call" (→ `endCall(vendor)`).
        idle → `CallOptionsPanel {eyebrow, chips, selected, onChip, draft, onDraft, placeholder, srLabel, onCall}`: `Card variant=outline radius=lg` `p-3 flex flex-col gap-2.5`: `Eyebrow tone=muted` "ASK GO TO CALL VILLA SOL" | "ASK GO TO CALL INDIGO"; chips `flex flex-wrap gap-1.5` × 6 `Chip size=xs` (stay | fly table); `InputField shape=ask` `h-12 pl-[14px] pr-[5px] text-15` with sr-only label "What should Go ask Villa Sol?" | "What should Go ask IndiGo?" and placeholder "e.g. we land at 10 pm, keep the gate open" | "e.g. add 15 kg to my Friday flight"; trailing `Button variant=primary` `h-[38px] px-[14px] text-14 font-semibold` "📞 Call" → `startCall('villa','stay')` | `startCall('indigo','fly')`.
     2. flights only → `CheckinPreviewLink {title, sub, cta, onPreview}`: whole row is a `<button type="button">` `w-full rounded-3xl bg-go-note px-3 py-2.5 flex items-center gap-2.5 text-left active:scale-[0.985]`: 🎫 `text-18`; col `flex-1`: "Web check-in opens Wed 4 Nov" `text-14 font-semibold`, "Go pings you and tries to seat you with Arjun" `text-13 text-muted`; "Preview" rendered as `<span className={buttonVariants({variant:'tint', size:'2xs'})}>` (no nested button) → `onPreview` = `previewCheckin()` + `toggleRow(null)` + scroll the TripShell scroll container to top (K1).
     3. `DetailsList {rows}`: `rounded-3xl bg-canvas px-3 py-0.5`; `KVRow size=14` rows `flex justify-between gap-3 py-[9px] text-14`, label `text-muted`, value `font-semibold text-right`, `border-t border-line` from the 2nd row. Stay = 6 rows, flights = 5 rows (§1.6).
2. Static done rows (`ListRow muted` `py-[11px] gap-2.5`): `EmojiTile size=36 shape=circle tint=surface-2` + title/sub as above + trailing `CheckBadge size=22`.

Accordion: one row open at a time (`toggleRow`). `?open=stay|fly` is a one-shot deep link: when the page mounts with it, set `openRow` from the param, then remove it from the URL with `history.replaceState` (other params kept); no auto-scroll. Row toggles never touch the URL, so a refresh never restores an expanded row. The page scrolls only when the user has just expanded a row (the row scrolls itself into view when its expand transition ends). 

### 1.3 Call state machine (`home` slice, P2-2)

```ts
type VendorId = 'villa' | 'indigo' | 'cab';
type AskKey = 'main' | 'stay' | 'fly';
interface ActiveCall { id: VendorId; vendor: VendorId; asking: string; startedAt: number /* epoch ms */ } // id === vendor (one live call per vendor)
interface LastCall { vendor: VendorId; asking: string; endedAt: number }
// home[tripId]
{ calls: ActiveCall[]; lastCall?: LastCall; resolved: VendorId[];
  openRow: 'stay' | 'fly' | null;
  askForm: { open: boolean; chips: Record<AskKey, string | null>; drafts: Record<AskKey, string> };
  listen: { muted: boolean; takenOver: boolean; detailsOpen: boolean };
  recording: { playing: boolean; rate: 1 | 1.5 | 2 };
  checkin: { status: 'not-open' | 'open' | 'done'; digiYatra: boolean; declaration: boolean; seat: string };
  daysToGo: string /* 'in 34 days' | 'in 2 days' */ }
```

Actions:
- `startCall(vendor, key)`:
  ```ts
  const text = askForm.drafts[key].trim()
    || (askForm.chips[key] ? askForm.chips[key]!.replace(/^[^\p{L}]+/u, '') : '');   // "🧳 Extra baggage" → "Extra baggage"
  const asking = text || VENDOR_CALLS[vendor].defaultAsk;
  const live = calls.find(c => c.vendor === vendor);
  if (live) live.asking = asking;                                   // dedupe: never a second card; silent update (as designed)
  else calls.push({ id: vendor, vendor, asking, startedAt: Date.now() });
  askForm.drafts[key] = ''; askForm.chips[key] = null; askForm.open = false;
  ```
- `callMain()` (in `TripHomeScreen`): `startCall(/cab/i.test(askForm.chips.main ?? '') ? 'cab' : 'villa', 'main')` — the main form only ever calls the villa or the cab desk (never IndiGo); free text alone always targets the villa.
- `endCall(id, opts?: { withOutcome?: boolean })`: remove the call. With `withOutcome` (only from the Listen sheet’s "End call"): `lastCall = {vendor, asking, endedAt: Date.now()}` and add the vendor to `resolved` (deduped). Pending items are never touched.
- `toggleRow(row: 'stay' | 'fly' | null)`: `openRow = row === null || openRow === row ? null : row`.
- `setChip(key, label)`: `chips[key] = chips[key] === label ? null : label` (single-select per group, tap again to clear).
- `setDraft(key, text)`, `openForm()` (`askForm.open = true`), `setListen(patch)`, `setRecording(patch)`.
- `previewCheckin()`: `checkin.status = 'open'` (if `not-open`) and `daysToGo = 'in 2 days'`.
- Seeding: when the trip first enters stage `plan` (and in presets J1/J3/J4/J5), `calls = [villa]` with `startedAt = Date.now() − parseClock(VENDOR_CALLS.villa.time) × 1000` (J4 adds indigo the same way). `daysToGo` initial = `trip.dates.countdown` ("in 34 days").
- Persist: `calls`, `lastCall`, `resolved`, `checkin`, `daysToGo`. Transient (excluded by `partialize`): `openRow`, `askForm`, `listen`, `recording`.

Derived (selectors or `TripHomeScreen`):
- `liveCalls = calls.map(c => ({ ...VENDOR_CALLS[c.vendor], asking: c.asking, startedAt: c.startedAt }))`.
- `callCount = n === 1 ? '1 live' : `${n} live · swipe``.
- `showForm = calls.length === 0 || askForm.open`.
- `rowLive('stay') = calls.some(c => c.vendor === 'villa')`; `rowLive('fly') = calls.some(c => c.vendor === 'indigo')` (cab has no row).
- `mm:ss = floor((now − startedAt)/1000)` → minutes and seconds zero-padded to 2 digits ("01:12"); ticks every 1000ms via `useElapsed(startedAt)`.

Chip tables (`CALL_CHIPS`, verbatim):
- `stay`: 🌙 Late check-in · ☀️ Early check-in · 🧳 Late check-out · 🛏️ Extra mattress · 🍳 Breakfast · 🚕 Airport pickup
- `fly`: 🧳 Extra baggage · 💺 Sit with Arjun · 🍱 Pre-book a meal · ♿ Wheelchair help · 🔁 Change flight · 💸 Cancel and refund
- `main`: 🌙 Late check-in · ☀️ Early check-in · 🧳 Late check-out · 🚕 Airport cab

### 1.4 Sheets owned by P3-11

Both sheets self-bind to the store (stated exception to Layer-2 props-only) and are opened by `useTripHomeSheets` (P3-17) from `?sheet=` + `?call=`. Props: `{ callId: VendorId; open: boolean; onOpenChange(open: boolean): void }`. Close = `onOpenChange(false)` → `router.back()` when the sheet was pushed, else `router.replace('/trips/goa')` (PLAN §8). If `callId` is not live (listen) / not `lastCall.vendor` (recording) on open, the sheet closes itself.

**`ListenSheet`** — store: reads `home.calls`, `home.listen`; writes `setListen`, `endCall`. Resets `listen` to all-false each time it opens.
- `BottomSheet top={96}` (`aria-label` "Listening in"); `SheetHeader` title "Listening in", subtitle "Go is handling it. Take over anytime.", close (`aria-label` "Close").
- `SheetBody` `gap-3 pb-[250px]` (clears the action dock):
  1. `CallHeroCard {who, emoji, tint, startedAt}`: `Card variant=navy radius=2xl` `px-4 py-[18px] flex flex-col items-center gap-3`: row `flex items-center gap-[18px]` = `Avatar size=52 kind=go` · `AudioBars` (14, `h-[30px]`, green) · vendor disc `size-[52px] rounded-full grid place-items-center text-24` on the vendor tint (villa `bg-amber-soft` 🏡); "Go ↔ {who}" `text-18 font-semibold`; "Live · {mm:ss} · you’re listening, they can’t hear you" `text-13 opacity-75 tabular-nums`.
  2. `LiveTranscript {lines, who}`: `Card variant=outline radius=2xl` `p-3.5 flex flex-col gap-2.5`: `Eyebrow tone=muted` "LIVE TRANSCRIPT"; `TranscriptBubble {speaker, name, text}` = `flex flex-col gap-0.5` + speaker label `text-12 font-bold text-muted` ("Go" | `{who}`) + bubble `max-w-[82%] rounded-3xl px-3 py-2 text-15 leading-[1.4]` — go: `items-end` + `bg-go-soft`; vendor: `items-start` + `bg-surface-2`. Footer `flex items-center gap-1.5 text-13 text-muted`: `LiveDot size=8 pulse` + "{who} is speaking".
  3. `BookingDetailsAccordion {media, title, sub, rows, open, onToggle}` (not rendered for `cab`): `Card variant=outline radius=2xl overflow-hidden`; header `<button aria-expanded>` `w-full flex items-center gap-3 px-4 py-3.5 text-left`: media 40 `rounded-xl` (villa: `assets` villa-sol photo, `alt=""`; indigo: `size-10 rounded-xl bg-indigo` tile with the IndiGo wordmark); col: "Booking details · {who}" `text-15 font-semibold` + "What Go is working from" `text-13 text-muted`; `ChevronDown size-[18px] text-muted strokeWidth 2.4`, `rotate-180` when open (200ms). Body `px-4 pb-3.5` + `starting:` enter → `DetailsList` (villa: stay 6 rows; indigo: flights 5 rows). Toggle → `setListen({detailsOpen: !detailsOpen})`.
- `SheetFooter` (gradient 35%, `pt-10 px-4 pb-safe gap-2.5`):
  - Row `flex gap-2`: Mute `Button variant=secondary size=lg` `flex-1 text-15 font-semibold` label `muted ? "🔈 Unmute" : "🔇 Mute"`, `aria-pressed`; Take over `Button size=lg` `flex-1 text-15 font-semibold` `variant = takenOver ? 'success-ink' : 'secondary'`, label `takenOver ? "🤖 Hand back to Go" : "🙋 Take over"`, `aria-pressed`.
  - Row `flex gap-2`: "Stop listening" `Button variant=outline size=lg` `flex-1 font-semibold` → close (call keeps running); "End call" `Button variant=danger size=lg` `flex-1 gap-1.5 font-semibold` with `Phone className="size-[18px]"` → `endCall(callId, {withOutcome:true})` then close.
  - Foot note `text-13 text-muted text-center leading-[1.35]`, priority: `takenOver` → "You’re talking to {who} now. Go is listening and taking notes."; else `muted` → "You’re muted. {who} can’t hear you."; else "Ending stops Go’s call with {who}. Stop listening keeps Go talking."

**`RecordingSheet`** — store: reads `home.lastCall`, `home.recording`; writes `setRecording`.
- `BottomSheet top={110}` (`aria-label` "Call with {who}"); `SheetHeader` title "Call with Villa Sol", subtitle "Today, 4:12 pm · 2 min 48 s · recorded with consent".
- `SheetBody` `gap-3` (default `pb-[120px]`):
  1. `OutcomeBanner {headline, body}`: `Note variant=green` `rounded-6xl px-4 py-3.5 flex-col items-stretch gap-2`: row `flex items-center gap-2` = `CheckBadge size=22` + headline `text-16 font-semibold text-success-ink`; body `text-14 leading-[1.45] text-success-ink`. Villa: "Late check-in confirmed for 11 pm" / "Ramesh, the caretaker, will wait at the gate. Call him on +91 ••••• ••611 when you land. No extra charge."
  2. `RecordingPlayer {playing, rate, elapsed, total, onToggle, onSpeed}`: `Card variant=outline radius=2xl` `px-4 py-3.5 flex flex-col gap-3`:
     - Row `flex items-center gap-3`: `Button variant=primary size=icon-lg` `size-[52px]` `aria-label={playing ? "Pause" : "Play"}` → `setRecording({playing: !playing})`; icon `Play className="size-5"` (filled) | `Pause className="size-5" strokeWidth={3}`. Waveform `aria-hidden` `flex flex-1 h-8 items-center gap-[3px] overflow-hidden`: 35 static bars `w-[3px] shrink-0 rounded-full` — 9 played `bg-go` heights `[6,10,16,12,22,18,26,14,20]`, 26 unplayed `bg-[#D5D9E0]`* heights `[28,16,10,18,24,12,8,14,22,26,18,12,20,16,10,24,18,12,8,14,10,18,22,14,10,6]`. Not draggable, not animated.
     - Time row `flex items-center justify-between text-13 text-muted tabular-nums`: "0:42" · `Button variant=soft` `h-7 px-2.5 text-13 font-bold text-ink` `{rate}×` ("1×" → "1.5×" → "2×" → "1×", `setRecording({rate})`) · "2:48".
  3. Transcript card `Card variant=outline radius=2xl` `px-4 py-2 flex flex-col`: `Eyebrow tone=muted` "TRANSCRIPT" `py-1.5`; `TranscriptRow {t, speaker, name, text, current}` = `flex gap-2.5 py-2` (current: `bg-go-note -mx-2.5 px-2.5 rounded-xl`); time `w-9 shrink-0 pt-0.5 text-12 font-semibold text-muted tabular-nums`; col `flex flex-col gap-px`: name `text-12 font-bold` (go `text-go`, vendor `text-muted`) + text `text-15 leading-[1.4]`.
- `SheetFooter` single row `flex gap-2`: "Share in group chat" `Button variant=primary size=lg asChild` `flex-1 px-[18px]` → `<Link href="/trips/goa/chat">`; "Save" `Button variant=secondary size=lg` `shrink-0 px-[18px] gap-1.5` with `Download className="size-[18px]"` → `toast("Saved to your phone")`.

Per-call content (`calls.ts`): villa = design seeds verbatim (live transcript 4 lines; recording title/meta/outcome/6 rows, 0:14 row `current`; elapsed 0:42, total 2:48). indigo/cab = templates filled at render with the call’s `asking`, `who` and `line` (curly quotes stripped from `line` inside bubbles/rows) — `// DESIGN-ASSUMPTION`:
- live transcript: `[{go: asking}, {vendor: line}]`; footer "{who} is speaking".
- recording: title "Call with {who}", meta "Today · recorded with consent", outcome `{headline: "Done · {asking}", body: "Go handled it with {who}. Full transcript below."}`, transcript `[{t:"0:00", go, asking, current:true}, {t:"0:09", vendor, line}]`, player metrics reuse villa’s (0:42 / 2:48, same waveform).

### 1.5 Interactions → actions / toasts

| Element | Action | Result / toast |
|---|---|---|
| Pending "Record" | `<Link>` `/trips/goa/expenses?scope=me&sheet=record` | M7 record sheet |
| Pending "Book ₹1,600" | `<Link>` `/trips/goa/chat?sheet=cab` | cab sheet in chat |
| "Check in now" (K1) | push `?sheet=checkin&step=details` | K2 (K spec) |
| Call card / live panel "🎧 Listen in" | push `?sheet=listen&call={vendor}` | J5 for that call |
| Call card / live panel "End call" | `endCall(vendor)` | card removed; `calls` empty → section gone, form shows; badge gone; row body → options panel. No toast |
| "Ask Go to make another call" (pill or tile) | `openForm()` | form card appears below the calls section |
| Form chip | `setChip('main', label)` | chip solid / cleared |
| Form input | `setDraft('main', text)` | – |
| "📞 Ask Go to call" | `callMain()` | new villa or cab card (or silent `asking` update if live); form hides |
| "Recording" (last-call row) | push `?sheet=recording&call={lastCall.vendor}` | J7 |
| Stay / Flights row header | `toggleRow('stay' \| 'fly')` + `replaceState ?open=` | chevron rotates 200ms, body enters 220ms |
| Options chip / input | `setChip('stay'\|'fly', label)` / `setDraft(...)` | – |
| Options "📞 Call" | `startCall('villa','stay')` / `startCall('indigo','fly')` | J3 → J4 for IndiGo |
| "Preview" (flights) | `previewCheckin()` + `toggleRow(null)` + scroll to top | K1 |
| Listen: X / backdrop / drag / "Stop listening" | close sheet | call stays live |
| Listen: Mute / Take over / Booking details | `setListen({muted})` / `setListen({takenOver})` / `setListen({detailsOpen})` | labels + foot note per §1.4 |
| Listen: "End call" | `endCall(callId, {withOutcome:true})` + close | last-call row in the form (if form shows); row sub flips (§1.6). No toast |
| Recording: X / backdrop / drag | close sheet | J6 |
| Recording: play/pause, speed | `setRecording({playing})`, `setRecording({rate})` | icon swap; "1×"/"1.5×"/"2×" |
| Recording: "Share in group chat" | `<Link>` `/trips/goa/chat` | chat |
| Recording: "Save" | `toast("Saved to your phone")` | "Saved to your phone" |
| Hero back/share, tabs, collapsed header, Chat FAB | `TripShell` (I spec); share → `ShareInviteSheet` (`?sheet=share`) | share toasts: "Invite link copied", "Opens Messages with the link filled in", "Opens Gmail with the link filled in", "Opens your phone’s share menu" |

### 1.6 Data bindings

- `src/data/seed/calls.ts` — `VENDOR_CALLS: Record<VendorId, VendorCall>` (PLAN §9.1 type; `time` is the seed elapsed parsed to the `startedAt` offset):
  | id | who | phone | emoji / tint | defaultAsk | line | time |
  |---|---|---|---|---|---|---|
  | `villa` | Villa Sol | +91 ••••• ••420 | 🏡 / `bg-amber-soft` | Late check-in around 11 pm, Fri 6 Nov | “Let me check with the caretaker…” | 01:12 |
  | `indigo` | IndiGo | Customer care · PNR K7QX2M | ✈️ / `bg-info-tint-3`* | Add a 15 kg extra bag on your Fri flight | “Please hold while I check the fee…” | 03:40 |
  | `cab` | Cab desk | Mopa Airport taxi counter | 🚕 / `bg-surface-2` | Airport cab for 2, Fri 9:55 pm landing | “Which terminal gate will you come out of?” | 00:24 |
  - villa `transcriptLive`: Go "Hi, I’m calling about Rahul Verma’s booking, 6 to 9 November." · Villa Sol "Yes, I can see it. Four guests?" · Go "That’s right. The group lands around 10 pm. Could someone be there for check-in at 11?" · Villa Sol "Let me check with the caretaker…".
  - villa `recording`: title "Call with Villa Sol"; meta "Today, 4:12 pm · 2 min 48 s · recorded with consent"; outcome as §1.4; `durationS` 168, `positionS` 42; transcript 0:00 Go "Hi, this is Go, an assistant calling for Rahul Verma. This call is recorded for the group. Is that okay?" · 0:09 Villa Sol "Yes, fine. How can I help?" · 0:14 Go "The group lands around 10 pm on Friday. Could someone be there for check-in at 11?" (`current`) · 0:42 Villa Sol "Ramesh can wait at the gate. Ask them to call when they land." · 1:05 Go "Perfect. Is there any charge for that?" · 1:11 Villa Sol "No charge."
  - indigo/cab templates per §1.4; `CALL_CHIPS` per §1.3; form/panel strings (placeholders, sr-labels, eyebrows, button labels, "ASKING FOR", "On a call", "Go is on a call with", "Asking: ") and listen/recording strings per §1.2/§1.4.
- `src/data/seed/bookings.ts` — details rows (verbatim):
  - stay: Check in "Fri 6 Nov · from 2 pm" · Check out "Mon 9 Nov · by 11 am" · Guests "4 · you, Rahul, Priya, Arjun" · Address "Anjuna, North Goa" · Paid by "Rahul · your share ₹10,800" · Booking ref "VS-24816".
  - flights: Onward "Fri 6 Nov · 6E 5313 · 8:40 pm" · Return "Mon 9 Nov · 6E 6142 · 4:10 pm" · PNR "K7QX2M" · Bags "7 kg cabin · 15 kg check-in" · Paid "₹8,060 · by you".
- `src/data/seed/checkin.ts` — card strings (§1.2 A.2) and preview strings (§1.2 E.1).
- `copy.ts` `tripHome` namespace — section titles ("Pending on you", "Go’s calls", "Done"), all-set strings, pending row strings, static done rows, FAB previews, toast "Saved to your phone".
- `selectPending(tripId)` → ordered `PendingItem[]`: `{kind:'checkin'}` when `checkin.status === 'open'`; `{kind:'settle'}` while the You→Rahul settlement is open (`money.recordPayment` settles it); `{kind:'cab'}` while `chat.cab.booked` is unset. Header meta `${n} left`.
- `selectDone(tripId)` → rows in order: 🏡 "Villa Sol booked" / sub `resolved.includes('villa') ? "Late check-in confirmed by Go" : "Fri 6 → Mon 9 · paid by Rahul"` (expandable `stay`) · ✈️ "Your flights booked" / `resolved.includes('indigo') ? "BLR ⇄ GOX · 15 kg extra bag added" : "BLR ⇄ GOX · both ways"` (expandable `fly`) · 🚕 "Airport cabs booked" / "Fri arrival and Mon drop, with Arjun" (only when cab booked) · 🤝 "Settled up with Rahul" / "Rahul confirmed your payments" (only when settled) · 💰 "Your budget set" / "₹21.8k · only you see it" · 📅 "Dates locked" / "Diwali · Fri 6 – Mon 9 Nov". `doneLabel = pending.length === 0 ? `All ${n}` : `${n} done``.
- `home` slice — §1.3. `daysToGo` feeds the hero ⏳ line.

### 1.7 Deviations

1. PLAN §12.1 item 14: J2 is `?open=stay` with no live call, exactly as the artboard; the Listen sheet is per call (IndiGo/cab content generated from `asking`/`line`, §1.4).
2. Carousel dots track the snapped slide (IntersectionObserver); the design’s dots are static at index 0. Dot count still includes the add tile.
3. Every "🎧 Listen in" opens the sheet for its own call (`?call=`); the design sends all of them, IndiGo’s included, to the Villa Sol sheet.
4. LIVE timers tick from `startedAt` (mm:ss, 1s, tabular-nums) instead of static strings. Seeds start each call at `now − time` (villa 72s, indigo 220s, cab 24s), so J1 shows ~01:12 on load; the Listen hero uses the same clock (the design’s separate "01:34" is dropped). Quotes and transcripts stay static; calls never complete on their own.
5. "End call" in the Listen sheet ends the call and sets `lastCall` + `resolved` with the seeded outcome, which produces J6’s last-call row and the "Late check-in confirmed by Go" sub. Pending items (settle-up, cab, check-in) are independent, so this does not jump to J6’s all-set state (the design navigates to J6). "End call" on cards and live panels ends the call with no outcome.
6. Hero countdown is literal by check-in state: "in 34 days" until `previewCheckin()`, then "in 2 days" (J6/J7 keep "in 34 days" as designed).
7. J5/J7 render the real trip home under the sheet (the design truncates J5’s background and bakes a static J6 copy into J7 with expand-icon links, multi-toggle chips and a no-op call button). Chips are single-select everywhere; the `Expand` icon is not used by this group.
8. Sheets animate and drag-dismiss via vaul (the design’s dialogs are static); everything else matches: the Recording player only swaps icons and cycles the rate (no audio/progress); Mute is offered before Take over; a main-form call to an already-live vendor silently updates its `asking`.
9. Spec ↔ PLAN deltas (orchestrator to reconcile):
   - §2 lists `trips/[tripId]/calls/[callId]/page.tsx` (J7) and `trips/[tripId]/checkin/page.tsx` (K2/K3); §8 and this spec render them as `?sheet=` on `/trips/[tripId]`. Drop those page files.
   - §9.4 `home` slice: this spec adds `resolved: VendorId[]`, defines `ActiveCall`/`LastCall`, changes `startCall(vendor, ask)` → `startCall(vendor, key)`, adds `endCall(id, {withOutcome})`, `toggleRow(null)`, `setDraft`, `setListen`, `setRecording`.
   - §12.1 item 4 ("no clock math") — the ticking call timer is a scoped exception (item 4 above).
   - §7.1 Badge has no `live` variant → "On a call" = `Badge success-soft md-bold` + leading `LiveDot size=7`.
   - Token gaps (* above): IndiGo vendor tint #E8EEFB → nearest `bg-info-tint-3` (#E6EEFB); waveform unplayed #D5D9E0 → no token (raw `bg-[#D5D9E0]` until a `--color-wave` token is added by the owner of `globals.css`); AllSetCard radius 26px → no token (`rounded-[26px]`).
   - Atom size overrides used here: `Button sm` px 14 → `px-[18px]` (pending CTA); `Button base` text-15 → `text-14` (dashed pill); `Button icon-lg` 48 → `size-[52px]` (play); filled buttons default to `font-medium` but Listen in / End call / Call / Ask Go to call are 600 → `font-semibold`; `Button white` drops `shadow-btn` in the live panel; `InputField shape=ask` text 16 → `text-15`; `ListRow` rows here are `py-[11px]`.
   - LiveDot/CheckBadge location: §6.2 + P0-2 put `LiveDot` (and `CheckBadge`) in `icons/custom/`, §7.2 + P1-2’s title put them in `common/`. Pick one path.
   - P3-11’s spec pointer "§J5 §J7" → read §1.4 here (+ §2 inventory J5/J7).

### 1.8 Acceptance checklist

**J1** (`applyPreset('J1')`, `/trips/goa`)
- [ ] Hero ⏳ "in 34 days"; "Pending on you" / "2 left" with the Rahul row ("Record") and the ✈️+🏡 cab row ("Book ₹1,600"); CTAs link to expenses record / chat cab sheet.
- [ ] "Go’s calls" with a pulsing 8px green dot and "1 live"; one full-width card: "Go ↔ Villa Sol", "LIVE · 01:12" ticking every second, "+91 ••••• ••420", ASKING FOR "Late check-in around 11 pm, Fri 6 Nov", 14 waving bars, italic “Let me check with the caretaker…”, "🎧 Listen in" + "End call"; dashed "Ask Go to make another call" below.
- [ ] No form card. "Done" / "4 done": Stay (On a call badge), Flights, Budget ✓, Dates ✓. FAB "Priya: scuba’s on me 🤿" with badge 3.
- [ ] Stay opens the green live panel + 6 details; tapping Flights closes Stay and shows IndiGo options + check-in preview + 5 details.
- [ ] End call → calls section gone, form card shown, Stay badge gone. Ask Go… → form; 🚕 Airport cab + "📞 Ask Go to call" → carousel "2 live · swipe" with the Cab desk card.

**J2** (`/trips/goa?open=stay`)
- [ ] No calls section; form card visible without a last-call row.
- [ ] Stay open (chevron rotated, `aria-expanded="true"`, no badge): "ASK GO TO CALL VILLA SOL", 6 stay chips, placeholder "e.g. we land at 10 pm, keep the gate open", "📞 Call", 6 details. Flights collapsed.
- [ ] ~350ms after load the page scrolls so "Done" sits under the fully shown collapsed header.
- [ ] Pick 🌙 Late check-in + "📞 Call" → villa card with ASKING FOR "Late check-in"; panel turns green; badge appears; form hides.

**J3** (`/trips/goa?open=fly`)
- [ ] One villa card; Stay collapsed with "On a call"; Flights open: "ASK GO TO CALL INDIGO", 6 fly chips, placeholder "e.g. add 15 kg to my Friday flight", check-in preview (🎫, "Web check-in opens Wed 4 Nov", "Preview"), 5 details; auto-scroll to Done.
- [ ] "📞 Call" → J4 state; "Preview" → K1 state scrolled to top.

**J4** (`/trips/goa?open=fly`)
- [ ] Carousel: Villa Sol and IndiGo slides 330px wide, 150px dashed add tile, next slide peeking; snap scrolling; 3 dots, first active, active dot follows the swipe.
- [ ] IndiGo card: ✈️ badge, "Customer care · PNR K7QX2M", timer from ~03:40 ticking, ASKING FOR "Add a 15 kg extra bag on your Fri flight", “Please hold while I check the fee…”.
- [ ] Both rows show "On a call"; Flights shows the green panel "Go is on a call with IndiGo" / "Asking: Add a 15 kg extra bag on your Fri flight".
- [ ] IndiGo’s Listen in opens IndiGo content; ending IndiGo → single full-width villa card, Flights back to options.

**J5** (`/trips/goa?sheet=listen&call=villa`)
- [ ] Sheet from 96px with "Listening in" / "Go is handling it. Take over anytime."; navy hero (Go 52, bars, 🏡 disc 52), "Go ↔ Villa Sol", "Live · mm:ss · you’re listening, they can’t hear you" matching the card’s clock.
- [ ] 4 transcript bubbles (Go right/peach, Villa Sol left/grey) + "Villa Sol is speaking" with pulsing dot; Booking details collapsed → expands to 6 rows.
- [ ] Mute ↔ "🔈 Unmute"; Take over ↔ "🤖 Hand back to Go" (green); foot note follows the priority rule.
- [ ] X / backdrop / Stop listening → J1 with the call still live. End call → sheet closes, no calls, form shows "Last call · Villa Sol · late check-in confirmed for 11 pm" + Recording, Stay sub "Late check-in confirmed by Go".

**J6** (`/trips/goa`)
- [ ] "You’re all set" card instead of Pending; no calls section; form card with the last-call row and "Recording" pill.
- [ ] "Done" / "All 6": Villa Sol booked (Late check-in confirmed by Go), Your flights booked (BLR ⇄ GOX · 15 kg extra bag added), Airport cabs booked, Settled up with Rahul, Your budget set, Dates locked.
- [ ] FAB "Rahul: see you all friday 🌴", no badge; hero "in 34 days"; no auto-scroll.

**J7** (`/trips/goa?sheet=recording&call=villa`)
- [ ] J6 under a sheet from 110px: "Call with Villa Sol" / "Today, 4:12 pm · 2 min 48 s · recorded with consent"; green outcome banner (headline + Ramesh body).
- [ ] Player: 52px play ↔ pause (aria-label swaps); 35 bars, first 9 terracotta; "0:42" · "1×" · "2:48"; speed cycles 1× → 1.5× → 2× → 1×.
- [ ] 6 transcript rows with the 0:14 row highlighted; "Share in group chat" → chat; "Save" → toast "Saved to your phone"; X/backdrop → J6.

**K1** (`/trips/goa`)
- [ ] Hero "in 2 days"; "3 left"; CheckinCard above the 2-row Pending card: IndiGo logo on the 56×40 indigo tile, "Web check-in is open" + NEW, "6E 5313 · Fri 8:40 pm · closes 1 hr before", Arjun companion box, "Check in now" → `?sheet=checkin&step=details`.
- [ ] No calls; form card without a last-call row; "Done" / "4 done" (original subs); FAB Priya + 3.
- [ ] Reached from J1–J4 via Flights "Preview" with the page scrolled to top and the row collapsed.

### 1.9 Consumed by tasks

- **P3-10 Trip home composites** — §1.2 (A–E), §1.3 derived values, §1.5. Owns the PLAN list plus `trip/PendingRow.tsx`, `trip/AddCallTile.tsx`, `trip/CarouselDots.tsx`, `trip/LastCallRow.tsx`, `trip/useElapsed.ts` (one component per file, §11). All props-only.
- **P3-11 Listen + Recording sheets** — §1.4, §1.5 sheet rows, §1.6 `calls.ts`. Owns the PLAN list plus `trip/CallHeroCard.tsx` and `trip/TranscriptBubble.tsx`; uses `useElapsed` from P3-10.
- **P3-17 Trip home page** — §1.1 (routes, presets), §1.2 section order and conditions, auto-scroll, `ChatFab`/hero bindings, §1.5, §1.8. `useTripHomeSheets.ts` maps `?sheet=listen|recording|checkin|share`, `?call=`, `?step=` and `?open=`.
- **P2-2 Store** — §1.3 `home` slice + actions, §1.6 `selectPending`/`selectDone`, presets J1–J7 + K1 per §1.1, villa-call seeding on entering `plan`.
- **P0-2 Icons** — `AudioBars` (props: `heights` default 14-bar table, `stepMs` 90, `className` for `h-[30px]`/`h-[26px]`) and `LiveDot` (7/8, `pulse`). Generated icons used: `Check`, `ChevronDown`, `Plus`, `Play`, `Pause`, `Phone`, `Download`, `X`. No new icons needed for this group.
- Also: P2-1 writes the §1.6 seeds verbatim; P2-5 implements `HorizontalRail inset` with the §1.2 C.3 classes.

## 2. Inventory (reference)

# Group J + K1 — Trip Home & Go's live vendor calls (inventory)

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`
Canvas titles come from `canvas.json` (all 420×912, `is_interactive: true`, page `prototype`; J row at y=12648, x=0..3000 step 500; K1 at x=0, y=14020).

| File | Canvas title | `<title>` |
|---|---|---|
| P-Home.dc.html | J1 · Home · one live call, full width · updated | Go — Trip home |
| P-Home-StayOpen.dc.html | J2 · Home · stay row opened · call options + details · new | Go — Trip home, stay open |
| P-Home-FlyOpen.dc.html | J3 · Home · flights row opened · call options + details · new | Go — Trip home, flights open |
| P-Home-Calls2.dc.html | J4 · Home · tapped Call IndiGo · 2 calls, swipe · updated | Go — Trip home, two calls |
| P-Home-Listen.dc.html | J5 · Listening in · booking details, mute, take over, end · updated | Go — Listening to Go’s call |
| P-Home-Done.dc.html | J6 · Home · all done · last call recording | Go — Trip home, all done |
| P-Home-Recording.dc.html | J7 · Call recording · outcome, player, transcript | Go — Call recording |
| P-Home-Checkin.dc.html | K1 · Home · web check-in open, 2 days before | Go — Trip home, check-in open |

Key structural fact: J1–J4, J6, K1 are the SAME template + SAME `PBase` logic; they differ only in (a) the initial `this.state` in `PBase` constructor, (b) a 350 ms auto-scroll in J2/J3/J4, and (c) static-markup edits in J6 and K1. J5 and J7 are trimmed copies with a bottom-sheet dialog layered on top (J7 has its own, much smaller `PBase`).

---

## Trip home shell

### Root frame
- Root `div`: `position: relative; width: 420px; height: 912px; display: flex; flex-direction: column; background: #F6F7F9; font-family: 'Satoshi', 'Figtree', system-ui, sans-serif; color: #0B1B3F; overflow: hidden;` + `font-kerning: normal; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased`.
- Font load: Google Fonts **Figtree** 400/500/600/700/800 only (Satoshi is named first but never loaded → Figtree renders).
- Scroll container: `<div onScroll="{{onScroll}}" style="flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; display: flex; flex-direction: column">` (J7 has no `onScroll`).
- Content column under the tabs: `padding: 16px 16px 120px; display: flex; flex-direction: column; gap: 10px` (120 px bottom pad clears the Chat FAB).
- No real safe-area handling: hero buttons and collapsed header use a hard `top/padding-top: 46px` to simulate the status bar. No `env(safe-area-inset-*)` anywhere.

### Hero (header, scrolls away)
- Container: `position: relative; flex-shrink: 0; height: 236px; background: #E9945A` (fallback colour).
- Image: `/_blob/1d74f508f447c4a1bb476cb83c275f7d`, alt "Palm silhouette against a Goa sunset over the sea", `position: absolute; inset: 0; width/height: 100%; object-fit: cover`.
- Scrim span: `linear-gradient(180deg, rgba(11,27,63,0.25) 0%, rgba(11,27,63,0) 26%, rgba(11,27,63,0.08) 42%, rgba(11,27,63,0.4) 62%, rgba(11,27,63,0.72) 100%)`.
- Back button (`<a href="P-App-Home.dc.html" aria-label="Back">`): `position: absolute; top: 46px; left: 14px; 40×40; border-radius: 999px; background: rgba(11,27,63,0.35); backdrop-filter: blur(12px); color: #FFFFFF`. SVG 20×20, stroke 2, round caps/joins: `M19 12H5` + `M11 6l-6 6 6 6` (arrow-left).
- Share button (`<a role="button" onClick="{{pa_0}}" aria-label="Share trip">`): same chip, `top: 46px; right: 14px`. SVG 18×18 stroke 2: `M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8` (curved forward/share arrow). Opens share sheet.
- Title block: `position: absolute; left: 20px; right: 20px; bottom: 42px; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; color: #FFFFFF`.
  - Trip name row: `font-size: 40px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; gap: 4px` → emoji 📍 in 30 px-wide slot (font-size 30px) + "Goa".
  - Meta lines (column, gap 2px, margin-top 4px), each `15px / 500 / line-height 1.35 / nowrap / gap 6px` with an 18 px-wide emoji slot: 📅 "Fri 6 – Mon 9 Nov"; ⏳ "in 34 days" (K1: "in 2 days").
  - Member avatars (right, `padding-bottom: 2px`; stack `padding-left: 8px`): 4 × img 28×28, `border-radius: 999px; border: 2px solid #FFFFFF; box-sizing: border-box; margin-left: -8px; object-fit: cover`. Blobs in order: `c58d972a22611bbd2e2f8570c48c72b8` (you, presumably), `cb0a34fddc3af7464df32602b63b30fa` (Rahul), `234f094a59fd64a1b23f7ec0e8d4cc45` (Priya, inferred), `8c7b7cb247d8cdf696b9f9eb4567da93` (Arjun). All `alt=""`.
- No countdown widget, no checklist/progress bar: "days to go" is only the ⏳ line; "progress" is the "Pending on you · N left" / "Done · N done" section counts.

### Segmented tab bar (in-flow, overlaps hero)
- `role="tablist" aria-label="Trip sections"`; `position: relative; z-index: 2; margin: -26px 16px 0; padding: 5px; display: flex; gap: 2px; border-radius: 999px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(11,27,63,0.06), 0 8px 24px rgba(11,27,63,0.12)`.
- 4 `<a role="tab">`, each `flex: 1; height: 42px; border-radius: 999px; font-size: 15px; font-weight: 600; centered`. No icons/emoji.
  - Active: `background: #000000; color: #FFFFFF; aria-selected="true"`.
  - Inactive: `background: transparent; color: #4A5878`.
- Items/targets: Home → `P-Home.dc.html` (active) · Itinerary → `P-Plan-Everyone.dc.html` · Bookings → `P-Bookings.dc.html` · Expenses → `P-Money-Everyone.dc.html`.
- NOT fixed: it scrolls with the page. A compact copy lives in the collapsed header (below).

### Collapsed (scroll) header — fades in on scroll
- `<div style="{{headStyle}}">` = `position: absolute; left: 0; right: 0; top: 0; z-index: 4; padding: 46px 12px 10px; background: #FFFFFF; box-shadow: 0 1px 0 rgba(11,27,63,0.05), 0 8px 20px rgba(11,27,63,0.08); display: flex; flex-direction: column; gap: 8px;` + `opacity: hp; transform: translateY((1-hp)*-14px); pointer-events: hp > 0.6 ? auto : none; transition: opacity 140ms ease-out, transform 140ms ease-out; will-change: opacity, transform`.
- `hp` from `onScroll`: `p = round(clamp((scrollTop - 110) / 90, 0, 1) * 20) / 20` (0.05 steps); sets `{hp, collapsed: p >= 1}`. So header starts appearing at 110 px scroll, fully in at 200 px.
- Row 1 (`gap: 6px`): back `<a href="P-App-Home.dc.html">` 40×40 transparent, colour #0B1B3F, same arrow SVG; title column flex 1: "Goa" `17px/700, -0.014em, lh 1.2`; "Fri 6 – Mon 9 Nov" `13px #4A5878 0.002em lh 1.35`; share `<a role="button" onClick="{{pa_1}}">` 40×40 transparent, share SVG 18.
- Row 2 compact tablist: `padding: 4px; gap: 2px; border-radius: 999px; background: #F4F5F7`; tabs `height: 36px; font-size: 14px; font-weight: 600`; same active/inactive colours and targets.
- Absent in J7 (no `headStyle`).

### "Pending on you" section (J1–J5; replaced in J6/J7; extended in K1)
- Section header: `margin-top: 0px; display: flex; align-items: baseline; justify-content: space-between; padding: 0 4px`; title `20px/600, -0.018em, lh 1.3`; count `13px/600 #4A5878 0.002em` = "2 left" (K1 "3 left").
- Card: `padding: 0 14px; border-radius: 22px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06); flex column`.
- Row anatomy: `padding: 12px 0; display: flex; align-items: center; gap: 12px`; 2nd row `border-top: 1px solid #ECEFF3`. Title `16px/600 -0.011em lh 1.3`, sub `13px #4A5878 0.002em lh 1.35`. CTA pill: `height: 36px; padding: 0 18px; border-radius: 999px; background: #000000; color: #FFFFFF; font-size: 14px; font-weight: 500; letter-spacing: -0.014em; nowrap`.
  1. Rahul avatar 40×40 (`cb0a34…`) · "Settle up with Rahul" · "₹5,800 left of your villa share" · **Record** → `P-Money-Record.dc.html`.
  2. Composite icon 40×40 (`position: relative`): ✈️ in 30×30 `#F4F5F7` circle (font 14px) top-left + 🏡 in 24×24 `#FFF1DC` circle (font 12px) pinned `right: 0; bottom: 0` · "Airport cab to Villa Sol" · "Fri 9:55 pm · with Arjun" · **Book ₹1,600** → `P-Chat-CabSheet.dc.html`.

### "Go’s calls" section (`sc-if hasCalls`) — the live-call area ("Go is on it")
- Wrapper column gap 10px. Header: `margin-top: 8px; flex; align-items: center; justify-content: space-between; padding: 0 4px`. Title "Go’s calls" `20px/600 -0.018em` + 8×8 `#16A34A` dot with class `live` (gap 8px). Right: `{{callCount}}` `13px/600 #4A5878` = "1 live" or "N live · swipe".
- **Call card** (`style="{{c.slideStyle}}"`): `box-sizing: border-box; padding: 16px; border-radius: 22px; background: #FFFFFF; box-shadow: 0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06); display: flex; flex-direction: column; gap: 12px;` + width: one call → `width: 100%`; many → `width: 330px; flex-shrink: 0; scroll-snap-align: start`.
  - Row A (`gap: 10px`): 40×40 relative avatar = `span.live` (abs inset 0, radius 999 → pulse ring) + Go avatar img `/_blob/5bda4ac2e39242651eeed457db2d1a9c` 40×40 round, `background: #DCEBFF` + vendor badge `position: absolute; right: -4px; bottom: -4px; 22×22; border-radius: 999px; border: 2px solid #FFFFFF; background: {{c.bg}}; font-size: 11px` showing `{{c.icon}}` emoji.
    - Text col (`gap: 1px`): "Go ↔ {{c.who}}" `16px/600 -0.011em` + LIVE pill `height: 22px; padding: 0 8px; border-radius: 999px; background: #E3F5EA; color: #0F7A37; 12px/700; tabular-nums` text "LIVE · {{c.time}}"; sub `{{c.phone}}` `13px #4A5878`.
  - Row B "ASKING FOR" box: `padding: 10px 12px; border-radius: 14px; background: #F4F5F7; column gap 4px`; label `11px/700 #4A5878 letter-spacing 0.08em`; value `{{c.asking}}` `15px/600`.
  - Row C (`gap: 10px`): audio bars container `display: flex; align-items: center; gap: 3px; height: 30px` with **14 `.bar` spans**, each `width: 3px; border-radius: 999px; background: #16A34A`, heights `8,16,24,12,20,28,14,22,10,18,26,12,16,8` px, `--d` delays `0,90,…,1170ms` (step 90). Then quote `{{c.line}}` `flex: 1; 14px; #4A5878; lh 1.35; italic`.
  - Row D (`gap: 8px`): **🎧 Listen in** `<a href="P-Home-Listen.dc.html">` `flex: 1; height: 46px; border-radius: 999px; background: #000000; color: #FFFFFF; 15px/600` · **End call** `<button onClick="{{c.end}}">` `height: 46px; padding: 0 18px; border: 0; border-radius: 999px; background: #FDECEC; color: #B42318; 15px/600`.
- One call (`sc-if oneCall`): column gap 8px → card(s) + dashed button **"Ask Go to make another call"** `height: 44px; border: 1.5px dashed #DDE1E6; border-radius: 999px; background: transparent; 14px/600 #0B1B3F; gap 6px` with plus SVG 16×16 stroke 2 (`M12 5v14`, `M5 12h14`) → `openForm`.
- Many calls (`sc-if manyCalls`) = **carousel**:
  - Scroller: `margin: 0 -16px; padding: 2px 0 6px; display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory; scroll-padding-inline: 16px`. Leading + trailing 6px spacer spans (6 + gap 10 = 16px inset). With 420 px viewport: card 330 → ~64 px of next card peeks.
  - After cards: add-tile button `width: 150px; flex-shrink: 0; scroll-snap-align: start; border: 1.5px dashed #DDE1E6; border-radius: 22px; background: transparent; flex column centered; gap: 8px; padding: 16px` → 44×44 white circle (`box-shadow: 0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`) with plus SVG 20×20 stroke 2 + label "Ask Go to make another call" `14px/600 center lh 1.3` → `openForm`.
  - Dots: `display: flex; justify-content: center; gap: 6px`, `aria-hidden`; count = calls + 1 (includes add tile). Dot 0: `18×6, #0B1B3F`; others `6×6, #C9CED6`; all `border-radius: 999px`. **Static** — index 0 always active; no scroll listener updates it.
- No `.spin` class or spinner anywhere in this file set.

### "Need something sorted?" ask-Go form card (`sc-if showForm` = no live calls OR `form` flag)
- Card: `padding: 16px; border-radius: 22px; background: #FFFFFF; same card shadow; column gap 12px`.
- Head (`gap: 10px`): Go avatar 36×36 (`5bda4a…`, bg #DCEBFF) + "Need something sorted?" `16px/600 -0.011em` + "Go calls the villa, airline or cab desk and handles it" `13px #4A5878` (J7 copy: "…cab company…").
- Chips row `flex-wrap: wrap; gap: 6px` (`mainChips`): 🌙 Late check-in · ☀️ Early check-in · 🧳 Late check-out · 🚕 Airport cab. Chip style: `height: 36px; padding: 0 12px; border-radius: 999px; 13px/600; transition: background-color 160ms ease, color 160ms ease;` off = `background: #FFFFFF; color: #0B1B3F; border: 1px solid #DDE1E6`; on = `background: #000000; color: #FFFFFF; border: 1px solid #000000`; `aria-pressed`. Single-select toggle per group.
- Input pill: `<label for="ask">` `height: 52px; padding: 0 6px 0 16px; gap: 8px; border-radius: 999px; background: #F4F5F7`; sr-only text "What should Go ask for?"; `<input id="ask">` 15px transparent, placeholder "e.g. we land at 10 pm, keep the gate open" (placeholder colour #4A5878 via helmet); button **📞 Ask Go to call** `height: 40px; padding: 0 14px; black pill; 14px/600; nowrap` → `callMain`.
- Optional last-call row (`sc-if hasLast`, only true in J6): `padding-top: 10px; border-top: 1px solid #ECEFF3; gap: 10px` → 22×22 #16A34A check circle (SVG 12, stroke 4, `M5 12l5 5 9-10`, white) + `14px lh 1.35` "**Last call · Villa Sol** · late check-in confirmed for 11 pm" + pill `<a href="P-Home-Recording.dc.html">` `height: 32px; padding: 0 12px; gap: 5px; border-radius: 999px; background: #F6EAE6; color: #A44F3A; 13px/600` with play SVG 11×11 filled (`M7 4l13 8-13 8z`) + "Recording".

### "Done" section with expandable rows
- Header `data-anchor="done"`: `margin-top: 8px; scroll-margin-top: 160px; baseline; padding: 0 4px`; "Done" `20px/600`; count `13px/600 #4A5878` "4 done" (J6/J7 "All 6").
- Card: `padding: 2px 14px; border-radius: 22px; background: #FFFFFF; card shadow`. Rows separated by `border-top: 1px solid #ECEFF3`.
- **Expandable row header** (`<button aria-expanded>`): `width: 100%; padding: 11px 0; border: 0; background: transparent; display: flex; align-items: center; gap: 10px; text-align: left`.
  - Icon: 36×36 `#F4F5F7` circle, emoji 16px; done badge 16×16 #16A34A circle at `right: -3px; bottom: -3px` with check SVG 9×9 stroke 4 white.
  - Text col (gap 1px): title `15px/600 color #4A5878` (done items muted), sub `13px #4A5878`.
  - "On a call" badge when that vendor is live: `height: 26px; padding: 0 9px; border-radius: 999px; background: #E3F5EA; color: #0F7A37; 12px/700; gap 5px; nowrap` with 7×7 `#16A34A .live` dot.
  - Chevron span `{{stayChev}}/{{flyChev}}`: `display: flex; color: #4A5878; transition: transform 200ms ease; transform: rotate(0deg | 180deg)`; SVG 18×18 stroke 2.4 `M6 9l6 6 6-6` (chevron-down). Rotated 180 when open.
- **Opened body** (`sc-if stayOpen/flyOpen`): `div.enter` `padding: 2px 0 14px; column; gap: 10px`, containing in order:
  1. Live panel (if vendor live), `div.enter`: `padding: 12px 14px; border-radius: 18px; background: #E3F5EA; column gap 10px` → row: 36×36 Go avatar with `.live` ring; "Go is on a call with {Villa Sol|IndiGo}" `15px/600 #0F7A37` + white LIVE pill `height: 20px; padding: 0 7px; background: #FFFFFF; color: #0F7A37; 11px/700`; "Asking: {{villaAsk|indigoAsk}}" `13px #0F7A37`. Row 2 (gap 8): same 14 bars in a 26px-high container + flex spacer + **🎧 Listen in** `<a href="P-Home-Listen.dc.html">` `height: 38px; padding: 0 14px; background: #0F7A37; color: #FFFFFF; 14px/600` + **End call** button `height: 38px; padding: 0 14px; background: #FFFFFF; color: #B42318; 14px/600` → `end_villa|end_indigo`.
  2. Call options (if vendor idle): `padding: 12px; border-radius: 18px; border: 1px solid #ECEFF3; column gap 10px` → caps label `11px/700 #4A5878 0.08em` ("ASK GO TO CALL VILLA SOL" / "ASK GO TO CALL INDIGO"), chips (same chip style, 6 per row type), input pill `<label for="askstay|askfly">` `height: 48px; padding: 0 5px 0 14px; gap: 8px; #F4F5F7` + sr-only label + input 15px + **📞 Call** `height: 38px; padding: 0 14px; black; 14px/600` → `call_stay|call_fly`.
  3. (flights only) Check-in preview link (see data).
  4. Details list: `padding: 2px 12px; border-radius: 16px; background: #F6F7F9`; rows `padding: 9px 0; flex; justify-content: space-between; gap: 12px; font-size: 14px`; label `#4A5878`; value `font-weight: 600; text-align: right`; dividers `border-top: 1px solid #ECEFF3`.
- Static done rows (not expandable): `border-top; padding: 11px 0; gap: 10px`; 36 px emoji circle; title/sub as above; trailing 22×22 #16A34A check circle (SVG 12 stroke 4).

### Bottom chrome
- Fade: `position: absolute; left: 0; right: 0; bottom: 0; height: 120px; pointer-events: none; background: linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 70%)`.
- **Chat FAB** `<a href="P-Chat-Plan.dc.html">`: `position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%); height: 58px; padding: 0 12px 0 8px; gap: 10px; border-radius: 999px; background: #000000; color: #FFFFFF; box-shadow: 0 8px 24px rgba(11,27,63,0.25)`.
  - Avatar stack (`padding-left: 12px`): 4 × 36×36, `border: 2px solid #000000; margin-left: -12px`: Go (`5bda4a…`, bg #DCEBFF), `cb0a34…`, `234f09…`, `8c7b7c…`.
  - Text: "Chat" `15px/600 -0.008em lh 1.25`; preview `12px rgba(255,255,255,0.7) 0.01em nowrap` = "Priya: scuba’s on me 🤿" (J6/J7: "Rahul: see you all friday 🌴").
  - Unread badge: `min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; background: #A44F3A; 13px/700 tabular` "3" (absent in J6/J7).

### Share-trip sheet (`sc-if pShare`, all 8 files)
- Layer `position: absolute; inset: 0; z-index: 40`; backdrop `<button aria-label="Close">` `inset 0; background: rgba(11,27,63,0.38)` → close.
- Dialog `role="dialog" aria-label="Share trip invite" class="enter"`: `position: absolute; left/right/bottom: 0; padding: 8px 16px 30px; border-radius: 28px 28px 0 0; background: #F6F7F9; box-shadow: 0 -8px 30px rgba(11,27,63,0.18); column gap 14px`. Grabber `40×5 #DDE1E6 radius 999`, centred.
- Invite card: `padding: 12px; border-radius: 18px; #FFFFFF; border: 1px solid #ECEFF3; gap 12px` → img `/_blob/63e0220f3d27d3795e1836f5d29b07d1` 44×44 radius 12 bg #FFF1DC; "Join Goa crew on Go" `15px/600`; "go.vestra.ai/t/goa-k7q" `13px #4A5878`; **Copy** button `height: 36px; padding: 0 12px; #F4F5F7; 13px/600` → toast "Invite link copied" (sheet stays open).
- WhatsApp group row `<a href="P-WA-Compose.dc.html">` (target file MISSING): `padding: 10px 12px; radius 18; white; border #ECEFF3` → 44×44 #FFF1DC circle 🌴 (20px) with 18×18 #25D366 dot (2px white border) at `right/bottom: -2px`; "Goa crew 🌴" / "WhatsApp group · recent"; chevron-right SVG 16 stroke 2.4 `M9 6l6 6-6 6` colour #A5ACB8.
- Target row `justify-content: space-between`, each 64 px wide column gap 6px, 56×56 tile `border-radius: 18px; border: 1px solid #ECEFF3`, label `12px/600`:
  - WhatsApp `<a href="P-WA-Pick.dc.html">` (MISSING) tile `#25D366` + speech-bubble SVG 28 stroke #FFFFFF 2 (`M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z`).
  - 💬 Messages → toast "Opens Messages with the link filled in" + close. ✉️ Gmail → "Opens Gmail with the link filled in" + close. 🔗 Copy link → "Invite link copied" + close. ⋯ More → "Opens your phone’s share menu" + close.

### Toast
- `sc-if pToast`, `div.enter role="status"`: `position: absolute; left: 50%; bottom: 108px; z-index: 60; transform: translateX(-50%); max-width: 340px; padding: 12px 16px; border-radius: 16px; background: #0B1B3F; color: #FFFFFF; 14px/600; lh 1.35; center; box-shadow: 0 10px 30px rgba(11,27,63,0.3)`. Auto-hides after **2200 ms** (`_toast`).

### Helmet CSS (identical in all 8, plus one extra rule in J7)
- `:root{--ease-out: cubic-bezier(0.23,1,0.32,1)}`.
- `a, button`: no tap highlight, `touch-action: manipulation`, no select/callout, `transition: transform 160ms var(--ease-out), box-shadow 180ms ease, background-color 180ms ease, opacity 180ms ease`. `:active` → `transform: scale(0.97)`, transition durations `160ms,60ms,60ms,60ms`.
- Press tint: black-bg buttons `:active` → `box-shadow: inset 0 0 0 999px rgba(255,255,255,0.18)`; light bg (`#F2F2F2`, `#F4F5F7`, `#F6EAE6`, `#FFFFFF`, `transparent`, not `.row`) → `inset 0 0 0 999px rgba(11,27,63,0.07)`. Bare links (no background) `:active` → `opacity: 0.6`. Hover (fine pointer) `a:hover{color:#22365F}`.
- `.row` (scale 0.985 + `#F5F6F8` on active) — defined but **unused** in this group. `.tick` (starting-style scale 0.8/opacity 0, 200ms) — defined, **unused**.
- `.enter`: `transition: opacity 220ms, transform 220ms var(--ease-out)`; `@starting-style{opacity: 0; transform: translateY(6px)}` → used on opened row bodies, live panels, dialogs, toast, Listen details.
- `.live{animation: live 1600ms ease-in-out infinite}` · `@keyframes live{50%{box-shadow: 0 0 0 7px rgba(22,163,74,0.12)}}` (pulse ring on round elements: avatars, 7–8 px dots).
- `.bar{animation: wave 900ms ease-in-out infinite; animation-delay: var(--d); transform-origin: center}` · `@keyframes wave{50%{transform: scaleY(0.4)}}`.
- Reduced motion: no active scale; `.tick/.enter` opacity-only 150ms; `.live` and `.bar` animation `none`.
- `input::placeholder{color:#4A5878}`; `[role="dialog"]>div>*{flex-shrink:0}`.
- J7 only: `button[data-pt][aria-pressed="true"]{background:#000000 !important; color:#FFFFFF !important; border-color:#000000 !important}`.
- **Only two keyframes exist in this set: `live` and `wave`.** No `spin`, no `typing`/dot keyframes (unlike the chat files).

### Shared DCLogic (`PBase`, J1–J6, K1; J5 superset)
- State: `{ collapsed: false, calls: [...], form: false, open: null|'stay'|'fly', asks: {}, chips: {}, drafts: {} }` (+ `hp` set on scroll).
- `ALL` vendor seed table (see J1 data). `CH` chip table: `stay` (6), `fly` (6), `main` (4).
- Derived: `live = calls.map(id => ({...ALL[id], asking: asks[id] || ALL[id].asking}))`; `hasCalls = live.length > 0`; `oneCall = length === 1`; `manyCalls = length > 1`; `callCount = '1 live' | N + ' live · swipe'`; `dots = length+1`; `showForm = live.length === 0 || form`; `hasLast = false` (J6 hard-codes `true`); `villaLive/indigoLive = calls.includes(id)`; `villaIdle/indigoIdle` = negation; `stayOpen/flyOpen = open === key`; `stayExp/flyExp` 'true'/'false'; chevron styles.
- Handlers: `toggle_stay/toggle_fly` (accordion: one row open at a time; tapping open row closes it); chip `pick` toggles `chips[key]` between label and null; `on_stayDraft/on_flyDraft/onMainDraft` store input text in `drafts[key]`; `openForm` → `form: true`; `callMain` → `startCall(mainParty(), 'main')` where `mainParty` = `'cab'` if selected main chip matches `/cab/i` else `'villa'`; `call_stay` → `startCall('villa','stay')`; `call_fly` → `startCall('indigo','fly')`; `c.end / end_villa / end_indigo` → remove id from `calls`.
- `startCall(id, key)`: `text = drafts[key].trim() || (chips[key] ? chip label with leading non-letters stripped : '')`; appends id to `calls` if absent (never duplicates); `asks[id] = text || ALL[id].asking`; clears `drafts[key]` and `chips[key]`; sets `form: false`.
- `Component` layer: `pT` toast text, `pShare`, `pSent` (chat leftover, unused); `pa_0/pa_1` open share; `pa_2..pa_5` share targets (toast + close); `pa_6` close; `pa_7` Copy (toast only).
- **No timers simulate call progress**: LIVE timers ("01:12", "03:40") are static strings, quotes never advance, calls never complete on their own. Only timers: toast 2200 ms; J2/J3/J4 auto-scroll 350 ms.

---

## P-Home.dc.html — J1 · Home · one live call, full width · updated

### Purpose (1 line)
Baseline populated trip home 34 days out, with one Go call (Villa Sol) live as a full-width card.

### What differs from P-Home
It is the baseline. Initial state: `calls: ["villa"], open: null, form: false`. Rows collapsed; Stay row shows "On a call" badge; 1 call card (full width) + dashed "Ask Go to make another call" pill; form card hidden.

### Layout of the differing/overlay parts
See shell. Vertical order: hero 236 → tab bar (−26 overlap) → Pending on you (header + 2-row card) → Go’s calls (header "Go’s calls ●" / "1 live" → full-width Villa card → dashed add pill) → Done (header "Done / 4 done" → card: Stay ▾ [On a call], Flights ▾, Budget ✓, Dates ✓) → 120 px pad. Overlays: fade, Chat FAB, collapsed header (hidden at scrollTop 0).

### Sheets / overlays
Share sheet only (trigger: hero share `pa_0` or collapsed-header share `pa_1`). Backdrop rgba(11,27,63,0.38) closes; target buttons close + toast.

### State & interactions
- Initial: `{collapsed:false, calls:["villa"], form:false, open:null, asks:{}, chips:{}, drafts:{}}` + `{pT:null, pShare:false, pSent:[]}`.
- Tap Stay row → opens (chevron rotates 180°, 200 ms; body fades/slides in 220 ms) showing green live panel (because villa live) + details. Tap Flights → closes Stay, opens Flights showing IndiGo call options (chips + input + Call), check-in preview, details.
- "End call" on card (or in Stay panel) → `calls: []` → Go’s calls section disappears, form card appears ("Need something sorted?"), Stay badge gone, Stay body would show call options.
- "Ask Go to make another call" → form card appears under the calls section; picking "🚕 Airport cab" then "📞 Ask Go to call" adds a `cab` call → 2 calls → carousel. Any other chip/free text → targets villa (already live → only updates `asks.villa`, no new card).
- Call options "📞 Call" in Flights → adds IndiGo (→ J4 state, carousel).
- Scroll → collapsed header fades in 110–200 px.

### Navigation table
| Element | Target |
|---|---|
| Hero back / collapsed-header back | P-App-Home.dc.html |
| Hero share / header share | share sheet (state) |
| Tab Home / Itinerary / Bookings / Expenses (both bars) | P-Home / P-Plan-Everyone / P-Bookings / P-Money-Everyone |
| Pending: Record | P-Money-Record.dc.html |
| Pending: Book ₹1,600 | P-Chat-CabSheet.dc.html |
| Call card 🎧 Listen in | P-Home-Listen.dc.html |
| Call card End call | state (`endCall`) |
| Ask Go to make another call | state (`form:true`) |
| Stay/Flights row header | state (`open`) |
| Live panel 🎧 Listen in (stay or fly) | P-Home-Listen.dc.html (always the Villa Sol listen screen, even for IndiGo) |
| Flights body "Web check-in … Preview" | P-Home-Checkin.dc.html |
| Last-call "Recording" pill (only when hasLast) | P-Home-Recording.dc.html |
| Chat FAB | P-Chat-Plan.dc.html |
| Share sheet: WhatsApp group row / WhatsApp tile | P-WA-Compose.dc.html / P-WA-Pick.dc.html (both MISSING in repo) |

### Data shown (seed values)
- Trip: "Goa", "Fri 6 – Mon 9 Nov", "in 34 days". Members: 4 avatars.
- Pending (2 left): "Settle up with Rahul" / "₹5,800 left of your villa share" / Record; "Airport cab to Villa Sol" / "Fri 9:55 pm · with Arjun" / "Book ₹1,600".
- Vendor seed `ALL`:
  - `villa`: who "Villa Sol", phone "+91 ••••• ••420", icon 🏡, bg #FFF1DC, asking "Late check-in around 11 pm, Fri 6 Nov", line "“Let me check with the caretaker…”", time "01:12".
  - `indigo`: who "IndiGo", phone "Customer care · PNR K7QX2M", icon ✈️, bg #E8EEFB, asking "Add a 15 kg extra bag on your Fri flight", line "“Please hold while I check the fee…”", time "03:40".
  - `cab`: who "Cab desk", phone "Mopa Airport taxi counter", icon 🚕, bg #F4F5F7, asking "Airport cab for 2, Fri 9:55 pm landing", line "“Which terminal gate will you come out of?”", time "00:24" (only reachable via the main form + "🚕 Airport cab" chip; has no Done row).
- Visible card: "Go ↔ Villa Sol" · "LIVE · 01:12" · "+91 ••••• ••420" · ASKING FOR "Late check-in around 11 pm, Fri 6 Nov" · “Let me check with the caretaker…”.
- Chips: stay = 🌙 Late check-in, ☀️ Early check-in, 🧳 Late check-out, 🛏️ Extra mattress, 🍳 Breakfast, 🚕 Airport pickup. fly = 🧳 Extra baggage, 💺 Sit with Arjun, 🍱 Pre-book a meal, ♿ Wheelchair help, 🔁 Change flight, 💸 Cancel and refund. main = 🌙 Late check-in, ☀️ Early check-in, 🧳 Late check-out, 🚕 Airport cab.
- Placeholders: main & stay "e.g. we land at 10 pm, keep the gate open"; fly "e.g. add 15 kg to my Friday flight". SR labels: "What should Go ask for?", "What should Go ask Villa Sol?", "What should Go ask IndiGo?".
- Done (4 done):
  - 🏡 "Villa Sol booked" / "Fri 6 → Mon 9 · paid by Rahul". Details: Check in "Fri 6 Nov · from 2 pm"; Check out "Mon 9 Nov · by 11 am"; Guests "4 · you, Rahul, Priya, Arjun"; Address "Anjuna, North Goa"; Paid by "Rahul · your share ₹10,800"; Booking ref "VS-24816".
  - ✈️ "Your flights booked" / "BLR ⇄ GOX · both ways". Check-in preview: 🎫 "Web check-in opens Wed 4 Nov" / "Go pings you and tries to seat you with Arjun" / pill "Preview" (`height: 30px; padding: 0 10px; #F6EAE6; #A44F3A; 13px/600`), container `padding: 10px 12px; border-radius: 16px; background: #FFF6F2; gap 10`, emoji 18px. Details: Onward "Fri 6 Nov · 6E 5313 · 8:40 pm"; Return "Mon 9 Nov · 6E 6142 · 4:10 pm"; PNR "K7QX2M"; Bags "7 kg cabin · 15 kg check-in"; Paid "₹8,060 · by you".
  - 💰 "Your budget set" / "₹21.8k · only you see it" ✓.
  - 📅 "Dates locked" / "Diwali · Fri 6 – Mon 9 Nov" ✓.
- Live panel strings: "Go is on a call with Villa Sol" / "Go is on a call with IndiGo", "LIVE", "Asking: …", "🎧 Listen in", "End call". Badge "On a call".
- FAB: "Chat", "Priya: scuba’s on me 🤿", badge "3".
- Share sheet: "Join Goa crew on Go", "go.vestra.ai/t/goa-k7q", "Copy", "Goa crew 🌴", "WhatsApp group · recent", "WhatsApp", "Messages", "Gmail", "Copy link", "More". Toasts: "Invite link copied", "Opens Messages with the link filled in", "Opens Gmail with the link filled in", "Opens your phone’s share menu".

### Icons & images
- SVGs (all `viewBox 0 0 24 24`, round caps/joins): arrow-left 20 / stroke 2 (back); share-arrow 18 / stroke 2; plus 16 or 20 / stroke 2; chevron-down 18 / stroke 2.4 / #4A5878; check 9 (stroke 4, row badge), 12 (stroke 4, 22 px circle), white on #16A34A; play 11 filled #A44F3A (Recording pill); chevron-right 16 / stroke 2.4 / #A5ACB8; WhatsApp bubble 28 / stroke 2 / #FFFFFF.
- Emoji: 📍 📅 ⏳ (hero); ✈️+🏡 (cab pending icon); 🏡 ✈️ 🚕 (vendor badges); 🎧 (Listen in); 📞 (Call buttons); 🏡 ✈️ 💰 📅 (Done rows); 🎫 (check-in preview); chip emoji listed above; 🤿 (FAB preview); 🌴 💬 ✉️ 🔗 ⋯ (share sheet).
- Blobs: hero `1d74f508…` (alt "Palm silhouette against a Goa sunset over the sea", full-bleed 420×236); member avatars `c58d972a…`, `cb0a34fd…`, `234f094a…`, `8c7b7cb2…` (28 px hero, 36 px FAB, 40 px Rahul row); Go avatar `5bda4ac2…` (40 card / 36 panel+form / 36 FAB, bg #DCEBFF); invite icon `63e0220f…` 44 px radius 12.

---

## P-Home-StayOpen.dc.html — J2 · Home · stay row opened · call options + details · new

### Purpose (1 line)
Shows the Villa Sol (stay) row expanded with "Ask Go to call Villa Sol" options and booking details when no call is live.

### What differs from P-Home
- Only the script differs. `PBase` initial state: `calls: []`, `open: "stay"`.
- `Component` constructor adds `setTimeout(350ms)` → `document.querySelector('[data-anchor="done"]').scrollIntoView({block:'start'})` (honours `scroll-margin-top: 160px`) → page auto-scrolls so "Done" sits under the collapsed header; scrollTop > 200 so the collapsed header is fully shown (`hp = 1`).
- Consequences: "Go’s calls" section hidden (no calls); "Need something sorted?" form card visible (above Done, `hasLast` false); Stay row open (chevron 180°, `aria-expanded="true"`), no "On a call" badge; Stay body shows **villaIdle** call-options panel (not the green live panel) + details list; Flights collapsed.

### Layout of the differing/overlay parts
- Stay body (`.enter`, `padding: 2px 0 14px; gap: 10px`):
  - Options panel: `padding: 12px; border-radius: 18px; border: 1px solid #ECEFF3; gap: 10px`; label "ASK GO TO CALL VILLA SOL" (11/700, 0.08em, #4A5878); 6 chips wrap (gap 6; 36 px tall); input pill 48 px (`padding: 0 5px 0 14px; #F4F5F7`) + "📞 Call" 38 px black.
  - Details list `#F6F7F9` radius 16, 6 rows (see J1).
- Note: there is NO empty-line slot for the live panel; it is simply not rendered.

### Sheets / overlays
Share sheet only (as J1).

### State & interactions
- Initial `{calls: [], open: 'stay', form: false, …}`.
- Pick chip → black pressed; tap "📞 Call" → `startCall('villa','stay')` → `calls: ['villa']`, `asks.villa` = stripped chip (e.g. "Late check-in") or typed text or default → Go’s calls section appears with the full-width Villa card, form card hides (because calls>0 and `form:false`), Stay body swaps to green live panel, header badge "On a call" appears. Effectively transitions to J1-with-stay-open.
- Tap Stay header → collapse; tap Flights → switch accordion.
- Form card chips/input behave as in J1.

### Navigation table
Same as J1 (no new links). Stay details have no links.

### Data shown (seed values)
As J1, minus any call card. Visible form card: "Need something sorted?" / "Go calls the villa, airline or cab desk and handles it" + 4 main chips + placeholder + "📞 Ask Go to call". Stay row sub "Fri 6 → Mon 9 · paid by Rahul". Pending still "2 left". Done "4 done".

### Icons & images
Same as J1; chevron-down rotated 180° on Stay.

---

## P-Home-FlyOpen.dc.html — J3 · Home · flights row opened · call options + details · new

### Purpose (1 line)
Shows the flights row expanded with "Ask Go to call IndiGo" options, the web-check-in preview and flight details, while the villa call is still live.

### What differs from P-Home
- Script only: initial `calls: ["villa"]`, `open: "fly"`; same 350 ms auto-scroll to `[data-anchor="done"]`.
- Go’s calls section present with 1 full-width Villa card (scrolled mostly above the fold by the auto-scroll); Stay row collapsed with "On a call" badge; Flights row open (chevron 180°) showing **indigoIdle** panel + check-in preview + details. Form card hidden.

### Layout of the differing/overlay parts
- Flights body order: (1) options panel "ASK GO TO CALL INDIGO" — 6 fly chips: 🧳 Extra baggage · 💺 Sit with Arjun · 🍱 Pre-book a meal · ♿ Wheelchair help · 🔁 Change flight · 💸 Cancel and refund; input 48 px placeholder "e.g. add 15 kg to my Friday flight"; "📞 Call" 38 px black. (2) Check-in preview `<a>`: `padding: 10px 12px; border-radius: 16px; background: #FFF6F2; gap 10px` → 🎫 18px; "Web check-in opens Wed 4 Nov" 14/600; "Go pings you and tries to seat you with Arjun" 13 #4A5878; "Preview" pill 30 px #F6EAE6/#A44F3A. (3) Details list (5 rows).

### Sheets / overlays
Share sheet only.

### State & interactions
- Initial `{calls:['villa'], open:'fly'}`.
- Tap "📞 Call" (with/without chip) → `startCall('indigo','fly')` → `calls: ['villa','indigo']` → section switches to **carousel** ("2 live · swipe"), flights header gets "On a call", flights body swaps to green IndiGo live panel ("Asking: Add a 15 kg extra bag on your Fri flight" by default, or e.g. "Extra baggage" if that chip was picked). This is exactly the J4 state (the prototype has no link to P-Home-Calls2; J4 is a snapshot of this transition).
- Tap Preview → K1.

### Navigation table
Same as J1; the visible new link is Preview → `P-Home-Checkin.dc.html`.

### Data shown (seed values)
Flights row "Your flights booked" / "BLR ⇄ GOX · both ways". Details: Onward "Fri 6 Nov · 6E 5313 · 8:40 pm"; Return "Mon 9 Nov · 6E 6142 · 4:10 pm"; PNR "K7QX2M"; Bags "7 kg cabin · 15 kg check-in"; Paid "₹8,060 · by you". SR label "What should Go ask IndiGo?". Villa card as J1.

### Icons & images
Same as J1. 🎫 emoji on check-in preview.

---

## P-Home-Calls2.dc.html — J4 · Home · tapped Call IndiGo · 2 calls, swipe · updated

### Purpose (1 line)
State right after tapping "Call" on IndiGo: two simultaneous Go calls in a horizontal snap carousel, flights row showing its live panel.

### What differs from P-Home
- Script only: initial `calls: ["villa","indigo"]`, `open: "fly"`; 350 ms auto-scroll to Done anchor.
- `manyCalls` branch: carousel with 2 call cards (Villa Sol, then IndiGo) + 150 px dashed add-tile; dots row (3 dots: first active). Header count "2 live · swipe".
- Stay header badge "On a call"; Flights header badge "On a call"; Flights open with green **IndiGo live panel** (instead of options) + check-in preview + details. Form card hidden.

### Layout of the differing/overlay parts
- Carousel scroller: `margin: 0 -16px; padding: 2px 0 6px; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: 16px; scrollbar-width: none`; spacer 6 px | card 330 | 10 | card 330 | 10 | add-tile 150 | spacer 6.
- Each card identical anatomy to J1 but `width: 330px; flex-shrink: 0; scroll-snap-align: start`.
- IndiGo card: badge bg `#E8EEFB` with ✈️; "Go ↔ IndiGo" + "LIVE · 03:40"; sub "Customer care · PNR K7QX2M"; ASKING FOR "Add a 15 kg extra bag on your Fri flight"; quote “Please hold while I check the fee…”.
- Dots: `gap: 6px` centered: [18×6 #0B1B3F][6×6 #C9CED6][6×6 #C9CED6].
- IndiGo live panel in flights body: `#E3F5EA`, "Go is on a call with IndiGo" + white LIVE pill, "Asking: Add a 15 kg extra bag on your Fri flight", 14 bars (26 px), "🎧 Listen in" (#0F7A37) + "End call" (white/#B42318).

### Sheets / overlays
Share sheet only.

### State & interactions
- Swipe: native horizontal scroll with mandatory snapping; no JS. Dots do NOT track position (always first active).
- End call on IndiGo card or flights panel → back to single full-width Villa card, flights body reverts to options panel. End both → no calls → form card.
- Add-tile → `form: true` → form card appears below the carousel section.
- Both "Listen in" buttons go to the same P-Home-Listen (Villa Sol content), including the IndiGo ones.

### Navigation table
Same as J1/J3.

### Data shown (seed values)
Both vendor seeds (villa + indigo) as listed in J1. Count "2 live · swipe". Everything else as J3.

### Icons & images
Same as J1; vendor badges 🏡 (#FFF1DC) and ✈️ (#E8EEFB); plus 20 px in add-tile.

---

## P-Home-Listen.dc.html — J5 · Listening in · booking details, mute, take over, end · updated

### Purpose (1 line)
Bottom-sheet "Listening in" view of Go’s live call with Villa Sol: live transcript, booking details accordion, Mute / Take over / Stop listening / End call.

### What differs from P-Home
- Background page is truncated: hero + tab bar + "Pending on you" (2 rows) only; Go’s calls, form and Done sections removed. Collapsed header, fade, and Chat FAB (Priya preview, badge 3) retained.
- Added: full-screen backdrop link + tall bottom-sheet dialog (z 5/6). Script = full PBase (initial `calls:['villa']`, `open:null`) + listen-specific state/derived values.

### Layout of the differing/overlay parts
- Backdrop: `<a href="P-Home.dc.html" aria-label="Close sheet">` `position: absolute; inset: 0; z-index: 5; background: rgba(11,27,63,0.38)` (covers FAB and header, which have z ≤ 4/none).
- Sheet: `role="dialog" aria-label="Listening in"`, `position: absolute; left: 0; right: 0; bottom: 0; top: 96px; z-index: 6; flex column; border-radius: 28px 28px 0 0; background: #F6F7F9; box-shadow: 0 -8px 30px rgba(11,27,63,0.18)` → height 816 px. No `.enter` on the sheet itself (static).
- Grabber: `align-self: center; margin-top: 8px; 40×5; #DDE1E6; radius 999`.
- Scroll body: `flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; padding: 8px 16px 250px; column; gap: 12px` (250 px bottom pad clears the action dock).
  1. Title block (`padding: 0 4px; gap: 2px`): row `justify-content: space-between; gap 12` → "Listening in" `22px/600 -0.02em lh 1.3` + close `<a href="P-Home.dc.html" aria-label="Close">` `40×40; margin-right: -6px; radius 999; #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.08)` with X SVG 18 stroke 2 (`M6 6l12 12`, `M18 6L6 18`). Subtitle "Go is handling it. Take over anytime." `14px #4A5878 -0.004em lh 1.4 text-wrap: pretty`.
  2. Call hero card: `padding: 18px 16px; border-radius: 22px; background: #0B1B3F; color: #FFFFFF; column; align-items: center; gap: 12px` → row `gap: 18px`: Go avatar 52×52 (bg #DCEBFF) · 14 green `.bar`s (30 px container, same heights/delays) · 52×52 `#FFF1DC` circle with 🏡 24px. Then "Go ↔ Villa Sol" `18px/600`; "Live · 01:34 · you’re listening, they can’t hear you" `13px opacity 0.75 tabular-nums`.
  3. Live transcript card: `padding: 14px; border-radius: 22px; #FFFFFF; border: 1px solid #ECEFF3; column gap 10px`; caps label "LIVE TRANSCRIPT" (11/700 0.08em #4A5878). Each message = column `gap: 2px` with speaker label `12px/700 #4A5878` and bubble `max-width: 82%; padding: 8px 12px; border-radius: 16px; 15px lh 1.4`. Go messages `align-items: flex-end` + bubble `#F6EAE6`; Villa Sol `flex-start` + bubble `#F4F5F7`. Footer `13px #4A5878 gap 6` with 8 px `.live` green dot + "Villa Sol is speaking".
  4. Booking details accordion: container `border-radius: 22px; #FFFFFF; border: 1px solid #ECEFF3; overflow: hidden`. Header `<button aria-expanded="{{detExp}}">` `width: 100%; padding: 14px 16px; gap: 12px; transparent` → villa photo `/_blob/87722708aa25c51e09f9d819498d4f74` 40×40 `border-radius: 12px` (alt "") + "Booking details · Villa Sol" `15px/600` / "What Go is working from" `13px #4A5878` + chevron-down 18 stroke 2.4 rotating 180° (`{{detChev}}`, 200 ms). Body (`sc-if detOpen`, `.enter`, `padding: 0 16px 14px`) = the same 6-row stay details list (#F6F7F9, radius 16).
- Action dock: `position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 16px 24px; column; gap: 10px; background: linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`.
  - Row 1 (`gap: 8px`): Mute `<button>` `flex: 1; height: 52px; border: 0; radius 999; background: #F2F2F2; 15px/600 #0B1B3F` label `{{muteLabel}}`; Take over `<button style="{{takeStyle}}">` `flex: 1; height: 52px; radius 999; 15px/600` + off `background: #F2F2F2; color: #0B1B3F` / on `background: #0F7A37; color: #FFFFFF`.
  - Row 2 (`gap: 8px`): **Stop listening** `<a href="P-Home.dc.html">` `flex: 1; height: 52px; radius 999; #FFFFFF; border: 1px solid #DDE1E6; 16px/600` · **End call** `<a href="P-Home-Done.dc.html">` `flex: 1; height: 52px; gap: 6px; radius 999; background: #B42318; #FFFFFF; 16px/600` with phone SVG 18 stroke 2 (`M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2`).
  - Foot note `{{footNote}}` `13px #4A5878 center lh 1.35`.

### Sheets / overlays
- Listen sheet: always visible (static route state). Trigger = any "🎧 Listen in" link in J1/J3/J4. Close: backdrop tap, X button, or "Stop listening" → P-Home; "End call" → P-Home-Done (call outcome screen). No drag-to-dismiss logic.
- Share sheet still reachable via collapsed-header share (z 40, above listen sheet) — practically hidden because the header sits under the backdrop (z 4 < 5).

### State & interactions
- Extra state (undefined initially = falsy): `det`, `muted`, `took`.
- `toggleDet` → `det = !det` (details open/close; chevron rotates).
- `toggleMute` → `muted = !muted`; `muteLabel` = "🔇 Mute" | "🔈 Unmute".
- `toggleTake` → `took = !took`; `takeLabel` = "🙋 Take over" | "🤖 Hand back to Go"; style green when taken over.
- `footNote` priority: took → "You’re talking to Villa Sol now. Go is listening and taking notes."; else muted → "You’re muted. Villa Sol can’t hear you."; else "Ending stops Go’s call with Villa Sol. Stop listening keeps Go talking."
- Hero text, transcript, timer are static (no ticking, no streaming lines). Bars animate (`wave`), "speaking" dot pulses (`live`).

### Navigation table
| Element | Target |
|---|---|
| Backdrop | P-Home.dc.html |
| X close | P-Home.dc.html |
| Stop listening | P-Home.dc.html |
| End call | P-Home-Done.dc.html |
| Mute / Take over / Booking details | state |
| (behind backdrop) hero back, tabs, Record, Book ₹1,600, FAB | as J1 (unreachable while backdrop covers) |

### Data shown (seed values)
- Header: "Listening in"; "Go is handling it. Take over anytime."
- Call: "Go ↔ Villa Sol"; "Live · 01:34 · you’re listening, they can’t hear you".
- Live transcript (no timestamps):
  1. Go: "Hi, I’m calling about Rahul Verma’s booking, 6 to 9 November."
  2. Villa Sol: "Yes, I can see it. Four guests?"
  3. Go: "That’s right. The group lands around 10 pm. Could someone be there for check-in at 11?"
  4. Villa Sol: "Let me check with the caretaker…"
  - Status: "Villa Sol is speaking".
- Booking details · Villa Sol / "What Go is working from": Check in "Fri 6 Nov · from 2 pm"; Check out "Mon 9 Nov · by 11 am"; Guests "4 · you, Rahul, Priya, Arjun"; Address "Anjuna, North Goa"; Paid by "Rahul · your share ₹10,800"; Booking ref "VS-24816".
- Buttons: "🔇 Mute"/"🔈 Unmute", "🙋 Take over"/"🤖 Hand back to Go", "Stop listening", "End call"; foot notes above.
- Background: Pending (2 left) rows as J1; FAB "Priya: scuba’s on me 🤿" · 3.

### Icons & images
- SVG: X close 18 stroke 2; chevron-down 18 stroke 2.4 (#4A5878); phone handset 18 stroke 2 white (End call).
- Emoji: 🏡 (52 px vendor disc), 🔇/🔈, 🙋/🤖.
- Blobs: Go avatar `5bda4ac2…` 52 px; villa photo `87722708aa25c51e09f9d819498d4f74` 40×40 radius 12 (alt ""); background blobs as J1.
- Animated: 14 `.bar` green waves on navy card; `.live` dot in transcript footer.

---

## P-Home-Done.dc.html — J6 · Home · all done · last call recording

### Purpose (1 line)
Trip home after everything is resolved: "You’re all set", no live calls, ask-Go form with a "Last call · Villa Sol" recording link, 6 done items.

### What differs from P-Home
- "Pending on you" header + 2-row card replaced by a **"You’re all set" hero card**.
- Script: `calls: []`, `open: null`, and `hasLast: true` hard-coded in renderVals. → Go’s calls hidden; form card shown with last-call row + Recording pill.
- Done header count "All 6"; Stay sub "Late check-in confirmed by Go"; Flights sub "BLR ⇄ GOX · 15 kg extra bag added"; two new static done rows inserted after Flights (before Budget): 🚕 "Airport cabs booked" and 🤝 "Settled up with Rahul".
- Chat FAB preview "Rahul: see you all friday 🌴", unread badge removed.
- No auto-scroll.

### Layout of the differing/overlay parts
- All-set card: `padding: 22px 18px; border-radius: 26px; background: #FFFFFF; card shadow; display: flex; align-items: center; gap: 14px` → 56×56 circle `background: #E3F5EA; color: #16A34A` with check SVG 28 stroke 3 (`M5 12l5 5 9-10`) + column gap 2: "You’re all set" `22px/600 -0.02em`; "Nothing pending on you. Go pings you if plans change." `14px #4A5878 lh 1.4`.
- Form card (as J1) + last-call row: `padding-top: 10px; border-top: 1px solid #ECEFF3; gap: 10px` → 22 px green check, "**Last call · Villa Sol** · late check-in confirmed for 11 pm" (14px), "▶ Recording" pill (32 px, #F6EAE6/#A44F3A, 13/600) → J7.
- New done rows use the static-row anatomy (36 px emoji disc #F4F5F7 + muted title + sub + 22 px green check).

### Sheets / overlays
Share sheet only.

### State & interactions
- Initial `{calls:[], open:null}`; `hasLast` constant true.
- Stay/Flights rows still expandable → show call-options panels (idle) + details (+ check-in preview in flights). Stay details still say "paid by Rahul …" etc.
- Calling from form/rows adds a live call (Go’s calls section appears above the form; form hides since `form:false` after `startCall` — the last-call row disappears with it).

### Navigation table
Same as J1, plus: Recording pill → `P-Home-Recording.dc.html`. Pending CTAs (Record, Book) removed.

### Data shown (seed values)
- "You’re all set" / "Nothing pending on you. Go pings you if plans change."
- Last call: "Last call · Villa Sol" · "late check-in confirmed for 11 pm" · "Recording".
- Done (All 6): 🏡 Villa Sol booked / Late check-in confirmed by Go; ✈️ Your flights booked / BLR ⇄ GOX · 15 kg extra bag added; 🚕 Airport cabs booked / Fri arrival and Mon drop, with Arjun; 🤝 Settled up with Rahul / Rahul confirmed your payments; 💰 Your budget set / ₹21.8k · only you see it; 📅 Dates locked / Diwali · Fri 6 – Mon 9 Nov.
- Hero unchanged ("in 34 days" — inconsistent with an "all done" late state; see notes).
- FAB: "Chat" / "Rahul: see you all friday 🌴", no badge.

### Icons & images
Check 28 stroke 3 (#16A34A on #E3F5EA); play 11 filled; emoji 🚕 🤝 added; others as J1.

---

## P-Home-Recording.dc.html — J7 · Call recording · outcome, player, transcript

### Purpose (1 line)
Bottom sheet over the all-done home showing the finished Villa Sol call: outcome summary, audio player with waveform scrubber and speed, timestamped transcript, share/save.

### What differs from P-Home
- Separate, simplified build. Background = J6 content baked as static markup: hero (no `onScroll`, no collapsed header), tabs, "You’re all set" card, form card with **static** chips (`data-pt` + `aria-pressed` toggles `tg1..tg4`), unbound input, "📞 Ask Go to call" → `call: () => {}` (no-op); last-call row where "Recording" is a non-interactive `<span>`; Done "All 6" list where Stay and Flights rows have **expand-icon links** instead of chevrons and no accordion bodies.
- Copy variant: "Go calls the villa, airline or cab company and handles it".
- Helmet adds `button[data-pt][aria-pressed="true"]` pressed style.
- Added backdrop + "Call with Villa Sol" dialog.

### Layout of the differing/overlay parts
- Background Stay/Flights rows: plain `div` `padding: 11px 0; gap: 10px` (first row no border) + trailing `<a>` 36×36 `border-radius: 999px; background: #F4F5F7; color: #0B1B3F` with maximize/expand SVG 16 stroke 2.2 (`M15 3h6v6`, `M9 21H3v-6`, `M21 3l-7 7`, `M3 21l7-7`); aria-labels "Open Villa Sol booked" / "Open Your flights booked".
- Backdrop `<a href="P-Home-Done.dc.html" aria-label="Close sheet">` `inset: 0; z-index: 5; rgba(11,27,63,0.38)`.
- Sheet `role="dialog" aria-label="Call with Villa Sol"`: `position: absolute; left/right/bottom: 0; top: 110px; z-index: 6; flex column; radius 28px 28px 0 0; #F6F7F9; shadow 0 -8px 30px rgba(11,27,63,0.18)` (height 802 px). Grabber 40×5 #DDE1E6 `margin-top: 8px`.
- Scroll body: `padding: 8px 16px 120px; gap: 12px; overflow-y: auto`.
  1. Title row: "Call with Villa Sol" `22px/600 -0.02em` + X close (40 px white, shadow 0 1px 3px rgba(0,0,0,0.08), `margin-right: -6px`) → P-Home-Done. Sub "Today, 4:12 pm · 2 min 48 s · recorded with consent" `14px #4A5878`.
  2. **Outcome badge card**: `padding: 14px 16px; border-radius: 22px; background: #E3F5EA; column gap 8px` → row gap 8: 22 px #16A34A check circle (SVG 12 stroke 4) + "Late check-in confirmed for 11 pm" `16px/600 #0F7A37`; body `14px #0F7A37 lh 1.45`.
  3. **Player card**: `padding: 14px 16px; border-radius: 22px; #FFFFFF; border: 1px solid #ECEFF3; column gap 12px`.
     - Row (gap 12): play/pause `<button aria-label="{{playLabel}}">` 52×52 `border: 0; radius 999; background: #000000; color: #FFFFFF`; paused → play SVG 20 `fill: currentColor` `M7 4l13 8-13 8z`; playing → pause SVG 20 stroke 3 `M8 5v14`, `M16 5v14`.
     - Waveform scrubber (`aria-hidden`): `flex: 1; display: flex; align-items: center; gap: 3px; height: 32px; overflow: hidden` → **35 static bars** 3 px wide radius 999: first 9 "played" `#A44F3A` heights `6,10,16,12,22,18,26,14,20`; remaining 26 `#D5D9E0` heights `28,16,10,18,24,12,8,14,22,26,18,12,20,16,10,24,18,12,8,14,10,18,22,14,10,6`. (9/35 ≈ 0:42/2:48.) No thumb/handle, not draggable, not animated.
     - Time row: `space-between; 13px #4A5878 tabular-nums` → "0:42" · speed pill `<button>` `height: 28px; padding: 0 10px; border: 0; radius 999; #F4F5F7; 13px/700 #0B1B3F` `{{rate}}` · "2:48".
  4. **Transcript card**: `padding: 8px 16px; border-radius: 22px; #FFFFFF; border: 1px solid #ECEFF3; column`. Caps "TRANSCRIPT" `padding: 6px 0`. Rows `padding: 8px 0; display: flex; gap: 10px` → timestamp column `width: 36px; 12px/600 #4A5878; padding-top: 2px; tabular-nums` + column gap 1: speaker `12px/700` (Go `#A44F3A`, Villa Sol `#4A5878`) + text `15px lh 1.4`. Highlighted (current) row: `background: #FFF6F2; margin: 0 -10px; padding: 8px 10px; border-radius: 12px`.
- Action dock: `position: absolute; bottom: 0; padding: 40px 16px 24px; gradient rgba(246,247,249,0)→#F6F7F9 35%` → row gap 8: **Share in group chat** `<a href="P-Chat-Plan.dc.html">` `flex: 1; height: 52px; padding: 0 18px; black; 16px/500 -0.014em` · **Save** `<a role="button" onClick="{{pa_5}}">` `height: 52px; padding: 0 18px; flex-shrink: 0; gap 6; #F2F2F2; 16px/600` with download SVG 18 stroke 2 (`M12 3v12`, `M7 10l5 5 5-5`, `M5 21h14`).

### Sheets / overlays
- Recording sheet: static/always open; trigger = "Recording" pill in J6. Close → backdrop or X → P-Home-Done. No `.enter` on sheet.
- Share sheet (`pa_0` from hero share; handlers renumbered `pa_6..pa_11`).

### State & interactions
- `PBase` state `{ playing: false, rate: 1 }`.
- `toggle` → `playing = !playing` (icon swap only; no audio, no progress, no transcript highlight sync).
- `speed` → rate cycles 1 → 1.5 → 2 → 1; label `rate + '×'` ("1×", "1.5×", "2×").
- `call` → no-op. Chips `pa_1..pa_4` toggle `tg1..tg4` (independent multi-toggle, CSS-only pressed style — differs from single-select in PBase files).
- `pa_5` Save → toast "Saved to your phone". `pa_0` → share sheet; `pa_6` Messages, `pa_7` Gmail, `pa_8` Copy link, `pa_9` More (toasts + close); `pa_10` backdrop close; `pa_11` Copy → "Invite link copied".

### Navigation table
| Element | Target |
|---|---|
| Backdrop / X | P-Home-Done.dc.html |
| Share in group chat | P-Chat-Plan.dc.html |
| Save | toast |
| (background) Stay expand icon | P-Home-StayOpen.dc.html |
| (background) Flights expand icon | P-Home-FlyOpen.dc.html |
| (background) hero back | P-App-Home.dc.html |
| (background) tabs | P-Home / P-Plan-Everyone / P-Bookings / P-Money-Everyone |
| (background) Chat FAB | P-Chat-Plan.dc.html |

### Data shown (seed values)
- "Call with Villa Sol"; "Today, 4:12 pm · 2 min 48 s · recorded with consent".
- Outcome: "Late check-in confirmed for 11 pm" — "Ramesh, the caretaker, will wait at the gate. Call him on +91 ••••• ••611 when you land. No extra charge."
- Player: elapsed "0:42", total "2:48", rate "1×".
- Transcript:
  - 0:00 Go — "Hi, this is Go, an assistant calling for Rahul Verma. This call is recorded for the group. Is that okay?"
  - 0:09 Villa Sol — "Yes, fine. How can I help?"
  - 0:14 Go — "The group lands around 10 pm on Friday. Could someone be there for check-in at 11?" **(highlighted row)**
  - 0:42 Villa Sol — "Ramesh can wait at the gate. Ask them to call when they land."
  - 1:05 Go — "Perfect. Is there any charge for that?"
  - 1:11 Villa Sol — "No charge."
- Buttons "Share in group chat", "Save"; toast "Saved to your phone".
- Background: as J6 (All 6 list, "Rahul: see you all friday 🌴", no badge, "in 34 days").

### Icons & images
- SVG: X 18; check 12 (stroke 4); play 20 filled / pause 20 stroke 3 (two vertical lines); download 18 stroke 2; expand/maximize-2 16 stroke 2.2; play 11 filled (background pill); hero/back/share as J1.
- No blobs beyond background ones (Go avatar in form card 36 px, member avatars, hero). No vendor image in the sheet.

---

## P-Home-Checkin.dc.html — K1 · Home · web check-in open, 2 days before

### Purpose (1 line)
Trip home two days before departure with a new "Web check-in is open" action card at the top of Pending.

### What differs from P-Home
- Hero ⏳ "in 2 days" (was "in 34 days").
- Pending count "3 left"; a new check-in card inserted between the Pending header and the existing 2-row card.
- Script: `calls: []`, `open: null` → no Go’s calls; "Need something sorted?" form card visible (no last-call row). No auto-scroll. FAB unchanged (Priya preview, badge 3). Done unchanged ("4 done", original subs).
- No sheet/overlay (despite "check-in open" — it is an inline card).

### Layout of the differing/overlay parts
- Card: `padding: 16px; border-radius: 22px; #FFFFFF; card shadow; column gap 12px`.
  - Row (gap 12): airline logo tile `56×40; border-radius: 12px; background: #2B399B; centered` containing `<img src="/_blob/7a6cf4a7c21683d8f45d293789e8c8e9" alt="IndiGo">` `width: 46px; height: auto`. Text col (gap 1): "Web check-in is open" `16px/600 -0.011em` + "NEW" pill `height: 20px; padding: 0 7px; radius 999; #E3F5EA; #0F7A37; 11px/700`; sub "6E 5313 · Fri 8:40 pm · closes 1 hr before" `13px #4A5878`.
  - Companion box: `padding: 10px 12px; border-radius: 14px; background: #F4F5F7; gap: 10px` → Arjun avatar `8c7b7cb2…` 28×28 + "Arjun is on the same flight. Check in now and Go will try to seat you together." `14px lh 1.35`.
  - CTA `<a href="P-Checkin-Details.dc.html">` **Check in now**: `height: 50px; padding: 0 18px; radius 999; background: #000000; color: #FFFFFF; 16px/500 -0.014em` (full width).

### Sheets / overlays
Share sheet only.

### State & interactions
- Initial `{calls: [], open: null}`; everything else as PBase. Flights row still opens to IndiGo options + "Web check-in opens Wed 4 Nov · Preview" (links to this same screen — self-link) + details.

### Navigation table
Same as J1, plus: **Check in now → `P-Checkin-Details.dc.html`** (exists; outside this group).

### Data shown (seed values)
- "in 2 days"; "3 left".
- "Web check-in is open" · "NEW" · "6E 5313 · Fri 8:40 pm · closes 1 hr before" · "Arjun is on the same flight. Check in now and Go will try to seat you together." · "Check in now".
- Rest as J1 (Settle up with Rahul, Airport cab to Villa Sol, form card, Done 4).

### Icons & images
- IndiGo logo blob `7a6cf4a7c21683d8f45d293789e8c8e9` (alt "IndiGo", 46 px wide on #2B399B 56×40 tile, radius 12). Arjun avatar 28 px. No new SVGs.

---

## Group notes

### Shared element names (proposed components)
- `TripHero` [§7 `TripHero`] (image, scrim, back/share glass buttons, title/date/countdown, member stack).
- `TripTabs` [§7 `TripTabs`] (variant `hero` 42 px/15 px on white with shadow; variant `compact` 36 px/14 px on #F4F5F7).
- `CollapsingTripHeader` [§7 `CollapsingTripHeader` + `useCollapsingHeader`] (opacity/translate driven by scrollTop 110→200).
- `SectionHeader` [§7 `SectionHeader`] (20/600 title + 13/600 count; optional live dot).
- `PendingCard` / `PendingRow` [§7 `PendingCard` / `PendingRow` on `ListCard`] (avatar|composite icon, title/sub, black 36 px CTA).
- `AllSetCard` [§7 `AllSetCard`] (56 px green check disc).
- `CheckinCard` [§7 `CheckinCard`] (airline logo tile, NEW pill, companion note, 50 px CTA).
- `LiveCallCard` [§7 `LiveCallCard`] (Go avatar + live ring + vendor badge, LIVE·mm:ss pill, ASKING FOR box, `AudioBars` [§6.2 `AudioBars`], quote, Listen in / End call).
- `CallCarousel` [§7 `CallCarousel` on `HorizontalRail inset`] (snap scroller, 330 px slides, `AddCallTile` [§7 `AddCallTile`], `Dots` [§7 `CarouselDots`]).
- `AddCallPill` [§7.1 `Button variant=dashed size=base`] (dashed 44 px).
- `AskGoForm` [§7 `AskGoForm`] (Go header, `ChipGroup` [§7.1 `Chip size=xs`] single-select, `AskInput` [§7.1 `InputField shape=ask`] pill with call button, optional `LastCallRow` [§7 `LastCallRow`]).
- `DoneList` / `ExpandableBookingRow` [§7 `DoneList` / `ExpandableBookingRow`] (icon + done badge, muted title, `OnACallBadge` [§7.1 `Badge success-soft md-bold` + §7.2 `LiveDot`], rotating chevron) with body: `VendorLivePanel` [§7 `VendorLivePanel`] (green) | `CallOptionsPanel` [§7 `CallOptionsPanel`] (bordered, label, chips, input) + `CheckinPreviewLink` [§7 `CheckinPreviewLink`] + `DetailsList` [§7 `DetailsList` of §7.2 `KVRow`] (key/value rows).
- `StaticDoneRow` [§7.2 `ListRow muted` + `EmojiTile` + `CheckBadge`] (emoji disc + 22 px check).
- `AudioBars` [§6.2 `AudioBars`] (14 bars, heights/delays fixed, colour #16A34A, container 30 or 26 px).
- `ChatFab` [§7 `ChatFab`] (avatar stack, preview, unread badge).
- `BottomSheet` [§7.1 `BottomSheet` + `SheetHeader`/`SheetBody`/`SheetFooter`] (backdrop rgba(11,27,63,0.38); radius 28 top; #F6F7F9; grabber 40×5; title 22/600 + 40 px close; scroll body; gradient action dock). Instances: `ShareTripSheet` [§7.2 `ShareInviteSheet`] (auto-height), `ListenInSheet` [§7 `ListenSheet`] (top 96), `CallRecordingSheet` [§7 `RecordingSheet`] (top 110).
- `TranscriptBubble` [§7 `LiveTranscript` item] (live: bubbles, Go right #F6EAE6 / vendor left #F4F5F7) vs `TranscriptRow` [§7 `TranscriptRow`] (recording: timestamp column, speaker colour, highlight #FFF6F2).
- `RecordingPlayer` [§7 `RecordingPlayer`] (52 px play/pause, static waveform 35 bars played #A44F3A / rest #D5D9E0, elapsed/speed/total).
- `OutcomeBanner` [§7 `OutcomeBanner` on §7.1 `Note green`] (#E3F5EA, check + 16/600 headline + body, all #0F7A37).
- `Toast` [§7.1 Sonner `Toaster` / `toastGo`] (#0B1B3F, bottom 108, 2200 ms).
- Colour tokens used: ink #0B1B3F, muted #4A5878, bg #F6F7F9, surface #FFFFFF, subtle #F4F5F7 / #F2F2F2, hairline #ECEFF3, border #DDE1E6, dot-inactive #C9CED6, wave-unplayed #D5D9E0, green #16A34A / deep green #0F7A37 / green-tint #E3F5EA, danger #B42318 / danger-tint #FDECEC, terracotta #A44F3A / tint #F6EAE6 / warm-tint #FFF6F2, sand #FFF1DC, sky #DCEBFF, indigo-tint #E8EEFB, IndiGo brand #2B399B, WhatsApp #25D366, chevron-right #A5ACB8, hover #22365F, hero fallback #E9945A.

### State model proposal (one `/trip/:id/home` route renders all 8)
```ts
type VendorId = 'villa' | 'indigo' | 'cab';
type CallStatus = 'live' | 'ended';
interface VendorCall {
  id: string; vendor: VendorId; who: string; phone: string; icon: string; badgeBg: string;
  asking: string; lastLine: string; startedAt: Date /* drives LIVE · mm:ss */; status: CallStatus;
  transcript: { speaker: 'go' | 'vendor'; text: string; t?: number /* s */ }[];
  outcome?: { headline: string; body: string }; recording?: { durationS: number; at: Date; consent: boolean };
}
interface TripHomeState {
  daysToGo: number;                      // 34 (J1–J7) | 2 (K1)
  pending: PendingItem[];                // [] → AllSetCard (J6/J7); K1 adds {kind:'checkin', flight:'6E 5313', ...}
  calls: VendorCall[];                   // live ones: J1 [villa], J2 [], J3 [villa], J4 [villa, indigo], J5 [villa], J6/J7/K1 []
  lastCall?: VendorCall;                 // ended villa call with outcome (J6/J7) → hasLast
  openRow: 'stay' | 'fly' | null;        // J2 'stay', J3/J4 'fly', else null (single-open accordion)
  askForm: { open: boolean; chips: Record<'main'|'stay'|'fly', string|null>; drafts: Record<..., string> };
  overlay: null | { kind: 'listen'; callId: string; detailsOpen: boolean; muted: boolean; takenOver: boolean }   // J5
               | { kind: 'recording'; callId: string; playing: boolean; rate: 1 | 1.5 | 2; positionS: number }   // J7
               | { kind: 'share' };
  headerProgress: number;                // 0..1 from scroll
  done: DoneItem[];                      // 4 (J1–J5, K1) | 6 (J6/J7) with updated subs
  toast?: string;
}
```
Derived: `showForm = calls.filter(live).length === 0 || askForm.open`; `carousel = liveCalls.length > 1`; `rowLive(vendor)`; `callCount` label. Artboard mapping: J1 `{calls:[villa]}`; J2 `{calls:[], openRow:'stay'}` + scroll to Done; J3 `{calls:[villa], openRow:'fly'}` + scroll; J4 `{calls:[villa,indigo], openRow:'fly'}` + scroll; J5 `{calls:[villa], overlay:listen}`; J6 `{calls:[], pending:[], lastCall:villa, done:6}`; J7 = J6 + `overlay:recording`; K1 `{calls:[], daysToGo:2, pending:[checkin, settle, cab]}`. Use query/sub-routes (`?sheet=listen&call=…`, `?sheet=recording&call=…`, `?open=stay|fly`) so prototype deep links (J7 → StayOpen/FlyOpen, Listen End call → Done) map cleanly.

### Navigation graph (this group)
- J1/J3/J4 —🎧 Listen in (card or row panel)→ J5 —X/backdrop/Stop listening→ J1; —End call→ J6 —Recording pill→ J7 —X/backdrop→ J6.
- J7 background expand icons → J2 (stay) / J3 (fly).
- Flights body "Preview" (J1/J2/J3/J4/J6/K1 when flights open) → K1 —Check in now→ P-Checkin-Details.
- J3 —📞 Call (IndiGo)→ J4 (in-page state; no `<a>` to P-Home-Calls2 anywhere).
- Every screen: back → P-App-Home; tabs → P-Plan-Everyone / P-Bookings / P-Money-Everyone; FAB → P-Chat-Plan; Record → P-Money-Record; Book ₹1,600 → P-Chat-CabSheet; share sheet → P-WA-Compose / P-WA-Pick (**both files missing**).

### Surprises / ambiguities
1. **J2 has no live call** (`calls: []`) although the series reads as continuous with J1 (one villa call). Its stay row therefore shows call options, not the live panel, and the form card appears. Decide whether J2 should be "call ended" or the canvas title just means "stay row with options".
2. **All "Listen in" buttons (including IndiGo’s) go to the Villa Sol listen screen** — J5 is hard-coded to Villa Sol. Real app needs per-call listen state.
3. **LIVE timers are inconsistent and static**: card "01:12" vs listen sheet "01:34"; IndiGo "03:40". No ticking, no simulated progress or auto-complete; ending a call never produces an outcome (hasLast is hard-coded only in J6).
4. **Transcript mismatch**: J5 live line 1 is "Hi, I’m calling about Rahul Verma’s booking, 6 to 9 November." while J7’s 0:00 line is a consent disclosure ("…This call is recorded for the group. Is that okay?"). J5 never shows the consent line → recording-consent flow undefined. J7 highlights the 0:14 row while playhead is 0:42 (the 0:42 row is not highlighted).
5. **Mute semantics**: J5 says "you’re listening, they can’t hear you", yet offers Mute ("You’re muted. Villa Sol can’t hear you.") before taking over. Mute only makes sense after Take over; state combos (muted + took) collapse to the take-over foot note.
6. **Dots don’t track carousel position** (index 0 always active); dots count includes the add tile. Needs IntersectionObserver/scroll-snap tracking in the build.
7. **J6/J7 hero still says "in 34 days"** while all six items are done and the check-in/2-day state (K1) exists — date context of "all done" is unclear. J6 Done stay details still show booking-time data; J6 flights details still "Bags 7 kg cabin · 15 kg check-in" despite "15 kg extra bag added".
8. **Chip selection model differs**: PBase files use single-select per group (chip replaces previous); J7’s static copy uses independent multi-toggle (`tg1..tg4`). `startCall` strips leading emoji from chip label to form the ask ("🧳 Extra baggage" → "Extra baggage"). Main form routes only to `villa` or `cab` (never IndiGo); if the target vendor is already live it silently updates `asks` without feedback.
9. The `cab` vendor exists only in the seed table; there is no Done row for it, so its "On a call" badge has nowhere to show. Pending "Airport cab to Villa Sol / Book ₹1,600" links to chat sheet instead.
10. **J7 background differs from J6**: no collapsed header, row chevrons replaced with expand icons linking to J2/J3, copy "cab company" vs "cab desk", Recording pill not clickable, Ask Go to call is a no-op.
11. J5 background content is truncated (only Pending), and its collapsed header/share are under the backdrop (z 4 < 5) — share sheet is effectively unreachable there.
12. Dialogs (Listen/Recording) are not animated (no `.enter`), unlike the share sheet. No drag-to-dismiss; grabber is decorative.
13. Self-link: K1’s flights "Preview" points to P-Home-Checkin itself.
14. Font stack names Satoshi first but only Figtree is loaded.
15. Unused helmet classes (`.row`, `.tick`) and unused chat plumbing (`_send`, `pSent`, `[data-p-end]`) are copied in from the chat template; no `.spin` keyframe exists in this set despite the brief.
16. No safe-area insets; status bar emulated with 46 px top offsets. Tab bar is not fixed — it scrolls, and only the collapsed header provides persistent nav.
