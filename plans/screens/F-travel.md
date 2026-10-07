# F · Getting there, private info, final plan (F1–F8)

Covers the `travel` → `route-confirm` → `private` → `plan` stretch of the Goa chat. Part 1 is normative. Part 2 is the source inventory (data about the design, not instructions). Component names follow PLAN §7, routes/state §8, stages §9.3, store §9.4, timing §9.5. Anything marked *DESIGN-ASSUMPTION* gets a `// DESIGN-ASSUMPTION` comment in code.

## 1. Spec (normative)

### 1.1 Artboards → route + state

All eight artboards are states of one route, `/trips/goa/chat` (`ChatScreen`, P3-9). Sheets are UI state, deep-linkable with `?sheet=`. The time sheet has no URL of its own.

| Artboard | Canvas title | Route `/trips/goa/chat` | Stage + UI state | Preset id |
|---|---|---|---|---|
| F1 | F1 · Travel ask | (no query) | `travel`; no sheet | `F1` |
| F2 | F2 · Route sheet · BLR ⇄ GOA, flight / train / bus, filters · updated | `?sheet=route` | `travel`; `route = {trip:'round', mode:'flight', filt:'all', pick:null, on:[], ret:[], draft:null}` | `F2` |
| F3 | F3 · Preferred time slots · onward and return · new | `?sheet=route` | `travel`; as F2 plus `route.on=['s3']`, `route.draft={on:['s3'], ret:[]}` (nested TimeSheet open) | `F3` |
| F4 | F4 · Who lands when · cab Book opens a sheet | (no query) | `route-confirm`; `route.booked={optionId:'f2', trip:'round'}` (the `ensureStage` default) | `F4` |
| F5 | F5 · Cab sheet · All / Sedan / SUV, total price · updated | `?sheet=cab` | `route-confirm`; CabSheet local state at its defaults `{trip:'round', filt:'all', pick:'s1'}` | `F5` |
| F6 | F6 · Private answer in group | (no query) | `private`; `privateViewed:false` | `F6` |
| F7 | F7 · Just-for-me sheet | `?sheet=private` | `private`; `privateViewed:true` | `F7` |
| F8 | F8 · Go’s final plan | (no query) | `plan`; `trips.goa.stage='planned'` | `F8` |

Preset patches (`src/data/presets.ts`, P2-2) are `ensureStage(<stage>)` plus the patch, route and query above. `ensureStage` never books the cab and never sets `privateViewed`, because the trip home J-states need the pending "Airport cab" row.

### 1.2 Stage messages & chips

Common to all four stages (unchanged since `book`):
- Header subtitle "Diwali · 6–9 Nov"; members `['aarav','rahul','priya','arjun']` (stack order You, Rahul, Priya, Arjun).
- Chips, all `set` with a check badge: where "Goa" (📍), when "Nov 6–9" (📅), stay "Villa Sol" (🏡), budget "₹21.8k" (💰), from "Bengaluru" (🛫). Chip actions per PLAN §8.1 and the C spec.
- Text conventions in `scenario/goa.ts`: `\n` stands for the design's `<br>` (render with `whitespace-pre-line`); `**…**` stands for the design's `<b>`; `mention:true` renders `MentionChip` before the text. Message ids are proposals. P2-1 may rename them but must keep them stable.
- Entering a stage appends its messages in order. Go-authored entries append after `GO_TYPING_MS` (600), and the list scrolls to the end after `SCROLL_DELAY_MS` (60). Composer sends get "Got it 👍 I’ll factor that into the plan." after `GO_REPLY_MS` (1200), per the C spec.

#### `travel` (F1–F3)

| # | id | author | kind / card | maxWidth | content (verbatim) |
|---|---|---|---|---|---|
| 1 | `travel-arjun` | arjun | text | 72 | how are we all getting there? |
| 2 | `travel-ask` | go | card `travel-ask` | 80 | text "Everyone picks their own way in ✈️🚆🚌\nAdd where you’re coming from and I’ll find options just for you. The crew only sees when you land." · cta "Add my travel details" · caption "Only you and Go see what you add" |
| 3 | `travel-progress` | system | card `progress-pill` | — | "Rahul and Priya added theirs" (Go avatar 20) |

- Triggers: the CTA opens the `route` sheet. The RouteSheet Book CTA calls `bookRoute({optionId, trip})`, which closes the sheet, fires trigger `route-booked`, and moves to stage `route-confirm`.
- Next pill: none.
- Side effects of the first `bookRoute` (applied once; a later re-book only overwrites `route.booked`):
  - `route.booked = {optionId, trip}` stores the actual selection.
  - Bookings come from the `bookings.ts` IndiGo seed: 6E 5313 out, plus 6E 6142 back when `trip==='round'`. This holds whatever option was picked (*DESIGN-ASSUMPTION*, PLAN §12.1 #12).
  - A transaction is appended: "You booked with IndiGo ₹8,060" (`kind:'booking'`, `mine:true`). It uses the seed amount whatever was selected, so the PLAN §9.4 money totals hold (*DESIGN-ASSUMPTION*).
  - Board travel row: round trip → "Booked"; one way → the return-not-booked reminder (H3).

#### `route-confirm` (F4–F5)

| # | id | author | kind / card | maxWidth | content (verbatim) |
|---|---|---|---|---|---|
| 1 | `rc-me` | aarav | text | 80 | booked mine ✈️ lands 9:55 fri |
| 2 | `rc-go` | go | text | 72 | Got it. That’s the last one in 🎉 Here’s when everyone reaches Goa: |
| 3 | `rc-who-lands` | go | card `who-lands` | — | title "Who lands when" · status "Everyone’s booked" · rows (below) · suggestion 🚕 "You and Arjun land together. Share a cab?" · cta "Book" |
| 4 | `rc-arjun` | arjun | text, reaction 🙌 2 | 72 | same flight 🤝 |

`who-lands` rows, in this order:

| userId | name | mode line | lands | booked |
|---|---|---|---|---|
| aarav | You | ✈️ Flight · Mopa | Fri 9:55p | ✓ |
| arjun | Arjun | ✈️ Flight · Mopa | Fri 9:55p | ✓ |
| priya | Priya | 🚌 Bus · Mapusa | Sat 9:15a | ✓ |
| rahul | Rahul | 🚆 Train · Thivim | Sat 10:30a | ✓ |

- The rows, "lands 9:55 fri" and the status are literal seed text, whatever was booked (*DESIGN-ASSUMPTION*).
- Triggers: suggestion "Book" opens the `cab` sheet. The CabSheet CTA calls `bookCab({optionId, trip})`, which closes the sheet and fires trigger `cab-booked`. The stage does not change, and no message or toast is added.
- Side effects of `bookCab`: sets `cab.booked = {optionId, trip}`; `selectPending` drops the "Airport cab" row; `selectDone` adds its done row (J spec).
- Next pill: "Next · Priya asks when everyone lands". It shows on stage entry (design `pNext:true`) and leads to stage `private`.

#### `private` (F6–F7)

| # | id | author | kind / card | maxWidth | content (verbatim) |
|---|---|---|---|---|---|
| 1 | `pv-priya` | priya | text | 72 | what time do we all reach? |
| 2 | `pv-me` | aarav | text, `mention:true` | 80 | when’s my flight and what do i owe? |
| 3 | `pv-go` | go | text | 76 | Sent you your flight and money details privately 🔒\nFor everyone: you all land between **9:55 pm Fri** and **10:30 am Sat**. |
| 4 | `pv-teaser` | go | card `private-teaser` | — | label "ONLY YOU CAN SEE THIS" · lines ["6E 5313 · Seat 14A · PNR K7QX2M", "You owe Rahul ₹12,900"] · cta "View my details" |
| 5 | `pv-rahul` | rahul | text | 72 | nice, i’ll wait up with beers 🍻 |

- Triggers: "View my details" calls `markPrivateViewed()` and opens the `private` sheet. The stage does not change.
- Next pill: "Next · Go’s final plan". It shows on stage entry (design `pNext:true`) and is not gated on `private-viewed`. Tapping it fires trigger `plan-asked` and moves to stage `plan`.

#### `plan` (F8)

| # | id | author | kind / card | maxWidth | content (verbatim) |
|---|---|---|---|---|---|
| 1 | `plan-me` | aarav | text, `mention:true` | 70 | can you sort the whole plan? |
| 2 | `plan-go` | go | text | 64 | Here's your Goa.\nPool villa, scooters,\neveryone in by Friday night. (straight apostrophe, as designed) |
| 3 | `plan-card` | go | card `plan`, reaction 🔥 4 (floating) | — | payload below |
| 4 | `plan-rahul` | rahul | text | 70 | GOOO 😭 (this row gets `mt-[26px]`) |

Plan payload:
- eyebrow "THE PLAN"; place 📍 "Goa"; dates 📅 "Fri 6 – Mon 9 Nov"; countdown ⏳ "in 34 days" (literal, §12.1 #4).
- seal: ring "GOA ✦ INDIA ✦ GOA ✦ INDIA ✦", month "NOV", days "6–9".
- members aarav, rahul, priya, arjun.
- days: 1 FRI "Everyone lands" (`day-fri`) · 2 SAT "Scooters & sunset" (`day-sat`) · 3 SUN "Scuba, then open" (`day-sun`) · 4 MON "Panjim, then home" (`day-mon`).
- footer "Made by Go" + cta "Open" → `/trips/goa`. No totals.
- Side effect: entering `plan` sets `trips.goa.stage='planned'` (trip home becomes J1).
- Next pill: none (end of story).

### 1.3 Components owned by P3-6

General rules: one component per file, named exports. Cards are pure: props come from the message payload, callbacks from `MessageRenderer`. `RouteSheet` is store-connected. `CabSheet` keeps local UI state and calls `bookCab`. `TimeSheet` and all rows are pure. This spec adds three files to P3-6's §10 owns list: `sheets/TimeChip.tsx`, `sheets/OptionListCard.tsx`, `chat/cards/SuggestionStrip.tsx`.

#### TravelAskBubble — `chat/cards/TravelAskBubble.tsx`
```ts
interface TravelAskBubbleProps { text: string; cta: string; caption: string; onCta: () => void }
```
- `GoBubble` at maxWidth 80 with `cta`/`caption`. Bubble padding `pt-2 pr-2 pb-2.5 pl-3.5`, column `gap-1.5`.
- Body: `pr-1.5 text-16 tracking-body leading-[1.4] text-pretty whitespace-pre-line`.
- CTA: `Button variant=primary size=base`, full bubble width, `mt-1 gap-1.5 font-semibold`. The design is 15/600 but primary defaults to medium, hence the override. Leading `Lock` `size-[15px]` strokeWidth 2; label "Add my travel details". `onCta` opens the `route` sheet.
- Caption: `pr-1.5 text-12 leading-[1.35] text-go`.

#### ProgressPill — `chat/cards/ProgressPill.tsx`
```ts
interface ProgressPillProps { text: string }
```
`SystemPill` with `avatar` = `Avatar kind=go size=20`. Classes: `self-center my-0.5 py-[5px] pl-[5px] pr-3 gap-1.5 rounded-full bg-white shadow-bubble text-13 tracking-caption leading-[1.35] text-muted`. Not interactive.

#### RouteSheet — `sheets/RouteSheet.tsx`
```ts
interface RouteSheetProps { tripId: TripId; open: boolean; onOpenChange: (open: boolean) => void }
```
`BottomSheet top={96}`; the dialog label is the title. It reads `chat[tripId].route` and seeds from `@/data/seed/routes`, and derives everything with `lib/routes.ts`. Body (`SheetBody`, `px-4 pt-2 pb-[120px] gap-3`), top to bottom:
1. `SheetHeader`. Title: "BLR ⇄ GOA" for round trip, "BLR → GOA" for one way. Sub: "Fri 6 Nov → Mon 9 Nov · just you" / "Fri 6 Nov · one way · just you". Close (`Button white icon-sm`, `X` 18) calls `onOpenChange(false)`.
2. Trip type: `SegmentedControl variant=contained`, aria-label "Trip type", items "One way" (`oneway`) and "Round trip" (`round`) → `setRouteTrip`. Ignore the empty value Radix sends on re-tap, so nothing can be deselected.
3. Mode: `SegmentedControl variant=separated`, aria-label "How you’re travelling", items `<span aria-hidden>✈️</span> Flight`, `🚆 Train`, `🚌 Bus` → `setRouteMode`. Items use `gap-1.5`; inactive `bg-white text-ink border-line-2`; active `bg-black text-white`.
4. `LegSummaryCard` with legs:
   - `{eyebrow:"ONWARD · FRI 6 NOV", value: codes[0], meta: slotText(on)}`;
   - when round, also `{eyebrow:"RETURN · MON 9 NOV", value: codes[1], meta: slotText(ret)}`.
   - `codes = legCodes(mode)`: flight `["BLR → GOX","GOX → BLR"]`; train and bus `["BLR → GOA","GOA → BLR"]`.
5. `FilterChipRow`: full-bleed (`-mx-4 px-4 gap-1.5 overflow-x-auto scrollbar-none`), role group, aria-label "Filter options".
   - One `Chip size=lg` per `filtersFor(mode, trip)`, `pressed = filt===id` (solid vs outline), `transition-colors duration-[160ms]` → `setRouteFilter(id)`.
   - Then `TimeChip count={nTime(route)}` → `openTimeSheet()`.
6. Count line: `px-1 text-13 font-semibold tracking-caption text-muted`, text `countLine(shown.length)`.
7. `OptionListCard` holding one `RouteOptionRow` per `shown` item (`selected = chosen?.id === o.id`, `onSelect` → `pickRoute(o.id)`).
   - When `shown` is empty, show the empty state instead: `px-4 py-5 flex flex-col items-center gap-2.5 text-center`, "Nothing matches these filters" (`text-15 font-semibold`) plus `Button variant=tint size=sm` "Clear filters" → `clearRouteFilters()`.
8. `InfoNote` (Lock 16, `text-ink`): "Only you see these. Go shares just your arrival time with the group."
9. `SheetFooter` with `Button variant=primary size=xl w-full`.
   - Label `ctaLabel(chosen, trip)`; `disabled={!chosen}` shows "No options match" in `bg-line-2 text-faint-2`.
   - Tap → `bookRoute({optionId: chosen.id, trip})`, then `onOpenChange(false)`.
10. `TimeSheet`, rendered nested inside this sheet, with `open = route.draft !== null`.

Closing RouteSheet (X, scrim, drag or back) also calls `closeTimeSheet()` and never changes the stage.

#### LegSummaryCard — `sheets/LegSummaryCard.tsx`
```ts
interface LegSummaryCardProps { legs: { eyebrow: string; value: string; meta: string }[] }
```
- `Card variant=outline radius=lg overflow-hidden` (18px).
- Row: `px-4 py-3 flex items-center gap-3`.
  - Left column (`flex-1`): `Eyebrow` (11/700, `tracking-eyebrow`, muted) over the value (`text-16 font-semibold tracking-body leading-[1.3]`).
  - Right: meta, `text-13 font-semibold tracking-caption text-muted`.
- Every row after the first gets `border-t border-dashed border-line-2`.
- Not interactive. CabSheet reuses it for PICKUP/DROP.

#### TimeChip — `sheets/TimeChip.tsx`
```ts
interface TimeChipProps { count: number; onOpen: () => void }
```
`Chip size=lg`, `pressed={count>0}`, `aria-haspopup="dialog"`. Label is `timeChipLabel(count)`: "🕘 Time" or "🕘 Time · N", with the emoji in `<span aria-hidden>` (no `emoji` slot).

#### OptionListCard — `sheets/OptionListCard.tsx`
```ts
interface OptionListCardProps { children: React.ReactNode }
```
`Card variant=float-sm radius=2xl overflow-hidden` (22px, `border-line`, `shadow-float-sm`) with `divide-y divide-line`. Shared by RouteSheet and CabSheet.

#### RouteOptionRow — `sheets/RouteOptionRow.tsx`
```ts
interface RouteOptionRowProps { option: RouteOption; trip: TripType; selected: boolean; onSelect: () => void }
```
- Element: `<button aria-pressed={selected}>`, `w-full px-3.5 py-3 flex flex-col gap-2 text-left active:scale-[0.985]`; `bg-success-tint` when selected.
- Top line: `flex items-center justify-between gap-2.5`.
  - Tag: `text-11 font-bold tracking-tag uppercase`. Colour by `kind`: `mix` → `text-info` (#3E73D6); `stop` → `text-go` (#A44F3A); anything else → `text-muted`.
  - Price: `Badge size=lg`, `variant = selected ? 'price-selected' : 'price'`, text `inr(priceOf(option, trip))`. The design is h32 at 15/600, so this is `lg`, not `xl`; `xl` (h36/14) is the cab row's size.
- Legs: always `legs[0]`; add `legs[1]` when `trip==='round'`. Each leg is `flex gap-2.5`:
  - Left column (`w-16 shrink-0`): code `text-12 font-bold text-ink whitespace-nowrap`, then day `text-11 font-semibold text-muted` ("Fri 6" / "Mon 9").
  - Carrier tile: `w-[52px] h-[30px] shrink-0 rounded-[9px] grid place-items-center overflow-hidden text-16`.
    - `carrier==='indigo'`: `bg-indigo` + `<img alt="IndiGo" class="w-10 h-auto">`.
    - `carrier==='airindia'`: `bg-white border border-line` + `<img alt="Air India" class="w-[34px] h-auto">`.
    - No carrier: `bg-surface-2` + the mode emoji (✈️/🚆/🚌, `aria-hidden`).
  - Right column (`flex-1 flex flex-col gap-px`):
    - time: `text-15 font-semibold tabular-nums`;
    - meta: `text-13 tracking-caption text-muted`;
    - optional stop line: `flex items-center gap-1 text-12 font-semibold text-go`, `Stopwatch` `size-3` strokeWidth 2.2, then `leg.stop`.

#### TimeSheet — `sheets/TimeSheet.tsx`
```ts
interface TimeSheetProps {
  open: boolean; trip: TripType; codes: [string, string];
  draft: { on: SlotId[]; ret: SlotId[] }; preview: number;
  onToggle: (leg: 'on' | 'ret', id: SlotId) => void;
  onClear: () => void; onApply: () => void; onClose: () => void;
}
```
- Container: `BottomSheet nested maxHeight={760}`, content height, dialog label "Preferred times".
  - The parent route sheet stays put (no scale, no translate). The nested scrim only dims it.
  - Backdrop, X and drag call `onClose`, which discards the drafts.
- Body: `px-4 pt-2 pb-[130px] gap-3.5`.
  - `SheetHeader`: "Preferred times" / "Pick one or more. Go shows trips leaving in them."
  - `Eyebrow` (`px-1`): `ONWARD · ${codes[0]} · FRI 6 NOV`.
  - A 2×2 grid (`grid grid-cols-2 gap-2`) of `Toggle variant=tile`, one per `TIME_SLOTS` in order: 🌙 Early morning / 🌅 Morning / ☀️ Afternoon / 🌆 Evening.
    - Tile content: emoji 18, name 15/600, range 13 at `opacity-75`.
    - `pressed = draft.on.includes(id)`; tap → `onToggle('on', id)`.
  - When `trip==='round'`: a second block (`gap-3.5`) with eyebrow `RETURN · ${codes[1]} · MON 9 NOV` and a grid bound to `draft.ret`.
  - No tabs: onward and return are stacked sections.
- Footer: `SheetFooter`, `flex-row gap-2 pt-[30px]`.
  - "Clear": `Button variant=secondary size=xl px-[22px] text-16 tracking-body font-semibold` → `onClear`. The sheet stays open and nothing is applied.
  - Apply: `Button variant=primary size=xl flex-1 text-17`, label `applyLabel(preview)` → `onApply`. Never disabled.
- RouteSheet wiring:
  - `onToggle` → `toggleDraftSlot`;
  - `onClear` → `clearDraftSlots`;
  - `onApply` → `applyTimeSlots` (commits `on`/`ret`, sets `pick=null`, closes);
  - `onClose` → `closeTimeSheet`;
  - `preview = previewCount(route, draft)`.

#### WhoLandsCard — `chat/cards/WhoLandsCard.tsx`
```ts
interface WhoLandsRow { userId: UserId; name: string; mode: string; lands: string; booked: boolean }
interface WhoLandsCardProps { title: string; status: string; rows: WhoLandsRow[]; suggestion: { emoji: string; text: string; cta: string }; onSuggestion: () => void }
```
- Wrapper: `InChatCard right={16}`, inner `py-3.5 flex flex-col gap-1`.
- Header: `px-4 flex items-center justify-between`. Title `text-18 font-semibold tracking-h4`; status `text-13 font-semibold text-success-ink`.
- Rows sit in `px-4`. Each row is `py-2.5 flex items-center gap-2.5`; rows 2 onward add `border-t border-line`.
  - `Avatar size=32`.
  - Column (`flex-1 gap-px`): name `text-15 font-semibold leading-[1.3]`; mode line `text-13 tracking-caption leading-[1.35] text-muted`.
  - Lands: `text-13 font-semibold tabular-nums whitespace-nowrap`.
  - `CheckBadge size={24}` when booked.
  - Rows are not interactive.
- `SuggestionStrip` below the rows.

#### SuggestionStrip — `chat/cards/SuggestionStrip.tsx`
```ts
interface SuggestionStripProps { emoji: string; text: string; cta: string; onAction: () => void }
```
- Strip: `mx-4 mt-0.5 px-3 py-2.5 flex items-center gap-2 rounded-2xl bg-surface-2 text-14 leading-[1.35]`.
- Emoji: `<span aria-hidden class="w-[18px] text-15">`. Text: `flex-1`.
- Action: `Button variant=tint size=2xs px-[14px] tracking-sm` with the cta label → `onAction`, which opens the `cab` sheet.

#### CabSheet — `sheets/CabSheet.tsx`
```ts
interface CabSheetProps { tripId: TripId; open: boolean; onOpenChange: (open: boolean) => void }
```
Local state, reset on every open: `trip:'round'`, `filt:'all'`, `pick:'s1'`. `BottomSheet top={110}`, dialog label "Cab to Villa Sol". Body:
1. `SheetHeader`: "Cab to Villa Sol" / "Fri 6 Nov pickup, Mon 9 Nov drop. Book one way or both."
2. `SegmentedControl variant=contained`, aria-label "Trip type" (One way / Round trip).
3. `LegSummaryCard`:
   - always `{eyebrow:"PICKUP · FRI 6 NOV", value:"Mopa Airport → Villa Sol", meta:"when you land"}`;
   - when round, also `{eyebrow:"DROP · MON 9 NOV", value:"Villa Sol → Mopa Airport", meta:"1:30 pm"}`.
4. Car chips: plain `flex gap-1.5` (not full-bleed, no transition), role group, aria-label "Filter cars". `Chip size=lg` items "All", "🚗 Sedan", "🚙 SUV" (`all`/`sedan`/`suv`), emoji in `<span aria-hidden>`.
5. Count: `px-1 text-13 font-semibold text-muted`, text `cabCountLine(n)` → "5 options" / "3 options" / "2 options".
6. `OptionListCard` of `CabOptionRow`.
7. `InfoNote` with Lock 16, as designed: "Go tracks your flight and tells the driver if you land late."
8. `SheetFooter` with `Button primary xl w-full`, label `cabCtaLabel(chosen, trip)` → "Book both rides · ₹3,200" / "Book one way · ₹1,600". Never disabled. Tap → `bookCab({optionId: chosen.id, trip})`, then `onOpenChange(false)`.

#### CabOptionRow — `sheets/CabOptionRow.tsx`
```ts
interface CabOptionRowProps { option: CabOption; trip: TripType; selected: boolean; onSelect: () => void }
```
- Element: `<button aria-pressed>`, `w-full px-3.5 py-3 flex items-center gap-2.5 text-left`; `bg-success-tint` when selected.
- `EmojiTile size={48} shape="rounded-xl" className="h-11 text-22"`: a 48×44 tile on `bg-surface-2`.
- Column (`flex-1 gap-px`): title `text-15 font-semibold`; meta `text-13 tracking-caption leading-[1.35] text-muted`.
- Price: `Badge size=xl variant=price|price-selected`, text `inr(trip==='round' ? round : one)`.

#### lib/routes.ts — pure helpers (no React, no store)
```ts
type Mode = RouteOption['mode']; type TripType = 'oneway' | 'round'; type SlotId = TimeSlot['id'];
interface RouteQuery { trip: TripType; mode: Mode; filt: string; on: SlotId[]; ret: SlotId[] }
export function legCodes(mode: Mode): [string, string]
export function filtersFor(mode: Mode, trip: TripType): { id: string; label: string }[]
export function matchRoute(o: RouteOption, q: RouteQuery): boolean
export function visibleRoutes(q: RouteQuery): RouteOption[]
export function chosen(shown: RouteOption[], pick: string | null): RouteOption | null
export function priceOf(o: RouteOption, trip: TripType): number
export function slotText(list: SlotId[]): string
export function countLine(n: number): string
export function nTime(q: Pick<RouteQuery, 'trip' | 'on' | 'ret'>): number
export function timeChipLabel(n: number): string
export function ctaLabel(c: RouteOption | null, trip: TripType): string
export function previewCount(q: RouteQuery, draft: { on: SlotId[]; ret: SlotId[] }): number
export function applyLabel(n: number): string
export function visibleCabs(filt: 'all' | CabOption['kind']): CabOption[]
export function chosenCab(shown: CabOption[], pick: string): CabOption
export function cabCountLine(n: number): string
export function cabCtaLabel(c: CabOption, trip: TripType): string
```
Rules (exactly the design's DCLogic):
- `inSlots(h, list)`: `list.length === 0`, or `list.some(id => slot.from <= h && h < slot.to)`. Slots are half-open.
- `okFilt`:
  - `all` → true;
  - flight: `nonstop` → `kind !== 'stop'` (so the mixed-airline f1 counts as nonstop); `stop` → `kind === 'stop'`; `mix` → `kind === 'mix'`;
  - train and bus: `kind === filt`.
- `matchRoute`: `(trip==='round' || !o.roundOnly) && okFilt && inSlots(legs[0].h, on) && (trip==='oneway' || inSlots(legs[1].h, ret))`.
- `visibleRoutes`: `ROUTE_OPTIONS[mode].filter(matchRoute)`, keeping seed order (flight: f1 f2 f3 f6 f7 f4 f5 f8).
- `chosen`: the option in `shown` with `id===pick`, else `shown[0]`, else `null`. This fallback is silent: `pick` itself is not changed.
- `filtersFor`: `ROUTE_FILTERS[mode]`, minus `mix` when one way.
- `slotText`: `[]` → "Any time"; one slot → that slot's `range` (e.g. "6 pm – 12 am"); several → "n time slots".
- `countLine(n)`: `n + (n===1 ? ' option' : ' options') + (n>2 ? ' · scroll for more' : '')`. The count line always renders, so 0 gives "0 options".
- `nTime`: `on.length + (trip==='round' ? ret.length : 0)`.
- `timeChipLabel(n)`: `🕘 Time · ${n}` when n > 0, else `🕘 Time`.
- `ctaLabel(c, trip)`: when `c` is set, `Book ${round ? 'round trip' : 'one way'} · ${inr(priceOf(c, trip))}`; when null, "No options match".
- `previewCount`: `visibleRoutes({...q, on: draft.on, ret: draft.ret}).length`, using the current trip, mode and filter.
- `applyLabel(n)`: `Show ${n} ${n===1 ? 'option' : 'options'}` when n > 0, else "No options in these slots".
- Cab helpers:
  - `visibleCabs`: all options, or those with `kind===filt`;
  - `chosenCab`: id match, else the first;
  - `cabCountLine(n)`: `${n} options`;
  - `cabCtaLabel`: `Book ${round ? 'both rides' : 'one way'} · ${inr(round ? c.round : c.one)}`.
- `inr` comes from `lib/format.ts` (`'₹' + v.toLocaleString('en-IN')`).

Worked examples. These are expected values: any sequence of state changes that reaches the state gives the same result, with `pick` null.

| # | state (`trip, mode, filt, on, ret`) | `countLine` | `chosen` | `ctaLabel` | also |
|---|---|---|---|---|---|
| 1 | round, flight, all, [], [] | 8 options · scroll for more | f1 | Book round trip · ₹7,840 | — |
| 2 | oneway, flight, all, [], [] | 7 options · scroll for more | f2 | Book one way · ₹3,960 | f1 hidden (`roundOnly`); filters All / Nonstop / With a stop |
| 3 | round, flight, mix, [], [] | 1 option | f1 | Book round trip · ₹7,840 | — |
| 4 | round, flight, stop, [], [] | 3 options · scroll for more | f4 | Book round trip · ₹6,840 | — |
| 5 | round, flight, all, [s3], [] | 5 options · scroll for more | f1 | Book round trip · ₹7,840 | chip "🕘 Time · 1"; ONWARD meta "6 pm – 12 am"; rows f1 f2 f3 f4 f5 |
| 6 | round, flight, all, [s1], [s2] | 1 option | f6 | Book round trip · ₹6,900 | chip "🕘 Time · 2" |
| 7 | round, train, all, [], [] | 4 options · scroll for more | t1 | Book round trip · ₹2,900 | — |
| 8 | round, bus, seater, [], [] | 1 option | b3 | Book round trip · ₹1,900 | — |
| 9 | round, bus, all, [s0], [] | 0 options | null | No options match | empty state shown; CTA disabled grey |
| 10 | oneway, flight, all, [s1, s3], [] | 5 options · scroll for more | f2 | Book one way · ₹3,960 | chip "🕘 Time · 2"; ONWARD meta "2 time slots" |

Additional checks:
- Filter counts: round-trip Nonstop = 5 (f1 f2 f3 f6 f7). Train AC 3-tier = 2, AC 2-tier = 1, Sleeper = 1. Bus Sleeper = 3.
- Time sheet preview: with draft on=[s3] (F3), `previewCount` = 5 → "Show 5 options". After Clear (drafts [] and []) it is 8 → "Show 8 options".
- Pick fallback: pick f2, switch the filter to With a stop → chosen f4; back to All → f2 again.
- Cabs:
  - default → "5 options", s1, "Book both rides · ₹3,200";
  - SUV → "2 options", u1 (pick stays s1), "Book both rides · ₹4,200";
  - Sedan → "3 options";
  - one way with All → "Book one way · ₹1,600".

#### Store contract (implemented by P2-2 in `src/store`; consumed here)
Fields in `chat[tripId]` (actions below omit the trip scoping, which follows the store's convention):
```ts
route: {
  trip: TripType;               // 'round'
  mode: Mode;                   // 'flight'
  filt: string;                 // 'all'
  pick: string | null;          // null
  on: SlotId[]; ret: SlotId[];  // [] / []
  draft: { on: SlotId[]; ret: SlotId[] } | null;  // null; TimeSheet open when non-null; transient (excluded by partialize)
  booked?: { optionId: string; trip: TripType };
};
cab: { booked?: { optionId: string; trip: TripType } };
privateViewed: boolean;          // false
```
Actions:
```ts
setRouteTrip(trip: TripType): void      // if trip==='oneway' && filt==='mix' → filt 'all'; pick kept
setRouteMode(mode: Mode): void          // filt 'all'; pick null; on/ret kept
setRouteFilter(filt: string): void
pickRoute(id: string): void
clearRouteFilters(): void               // filt 'all'; on []; ret []
openTimeSheet(): void                   // draft = copy of {on, ret}
toggleDraftSlot(leg: 'on' | 'ret', id: SlotId): void
clearDraftSlots(): void                 // draft = {on: [], ret: []}
closeTimeSheet(): void                  // draft = null
applyTimeSlots(): void                  // on = draft.on; ret = draft.ret; pick null; draft null
bookRoute(sel: { optionId: string; trip: TripType }): void   // §1.2 travel side effects; advance('route-booked') only while at stage travel
bookCab(sel: { optionId: string; trip: TripType }): void     // cab.booked = sel; trigger 'cab-booked'; no stage change
markPrivateViewed(): void               // privateViewed = true; no stage change
```
`ensureStage('route-confirm')` and every later stage apply `bookRoute({optionId:'f2', trip:'round'})` without timers. They never call `bookCab` or `markPrivateViewed`.

### 1.4 Components owned by P3-7 (this group's part)

This spec adds two files to P3-7's §10 owns list: `sheets/BoardingInfoCard.tsx`, `sheets/ReturnRow.tsx`.

#### PrivateTeaserCard — `chat/cards/PrivateTeaserCard.tsx`
```ts
interface PrivateTeaserCardProps { label: string; lines: string[]; cta: string; onView: () => void }
```
- `Card variant=dashed radius=2xl` with overrides `bg-white border-line-3`. The design is white with a 1.5px dashed #CDD3DC border and no shadow.
- Layout: `ml-[38px] mr-4 p-3.5 flex flex-col gap-2.5`.
- Header (`flex items-center gap-2`):
  - lock badge: `size-7 rounded-full bg-ink text-white grid place-items-center` with `Lock` `size-3.5` strokeWidth 2;
  - label: `flex-1 text-13 font-bold tracking-tag text-ink`, "ONLY YOU CAN SEE THIS".
- Blurred lines: `aria-hidden flex flex-col gap-2 blur-[5px] select-none`, each line `text-15 font-semibold`.
- CTA: `Button variant=primary`, `h-[46px] px-[18px] text-15 tracking-h4 leading-[1.3]` (medium weight). Content: `Eye` `size-[18px]` strokeWidth 2, then "View my details". Tap → `onView`, which calls `markPrivateViewed()` and opens the `private` sheet.

#### PrivateSheet — `sheets/PrivateSheet.tsx`
```ts
interface PrivateDetails {
  airline: { name: string; logo: string };             // "IndiGo", assets brand indigo
  flight: string;                                       // "6E 5313"
  from: { code: string; time: string };                 // "BLR" · "Fri 8:40 pm"
  to: { code: string; time: string };                   // "GOX" · "9:55 pm"
  seat: string; boards: string; pnr: string;            // "14A" · "8:05" · "K7QX2M"
  bookingId: string;                                    // the travel-out booking id in bookings.ts
  ret: { emoji: string; title: string; sub: string };   // 🛬 · "Return · Mon 9 Nov" · "6E 6142 · GOX 4:10 pm → BLR 5:25 pm"
}
interface PrivateSheetProps { open: boolean; onOpenChange: (open: boolean) => void; title: string; sub: string; details: PrivateDetails; ticketHref: string }
```
- `BottomSheet` at content height, with no `top`. At 420×912 that lands at top ≈ 479 / height ≈ 433; see §1.7. Dialog label "Just for you". No footer.
- Body: `px-4 pt-2 pb-7 gap-3`.
- `SheetHeader`: "Just for you" / "🔒 Only you can see this. The group got the summary."
- Then `BoardingInfoCard`, then `ReturnRow`.
- No money appears anywhere in the sheet.

#### BoardingInfoCard — `sheets/BoardingInfoCard.tsx`
```ts
interface BoardingInfoCardProps { details: PrivateDetails; ticketHref: string }
```
- Card: `Card variant=float-sm radius=2xl p-4 flex flex-col gap-3`.
- Top row (`flex items-center justify-between`):
  - airline badge: `h-8 px-2.5 rounded-lg bg-indigo grid place-items-center` containing `<img alt="IndiGo" class="w-14 h-auto">`;
  - flight number: `text-13 font-semibold text-muted`, "6E 5313".
- Route row (`flex items-end justify-between gap-2`):
  - left column: code `text-34 font-bold tracking-display leading-none` "BLR", then `text-13 text-muted` "Fri 8:40 pm";
  - centre: `ArrowRight` `size-5 text-faint mb-3.5`;
  - right column (`items-end`): "GOX", then "9:55 pm".
- Detail grid: `grid grid-cols-3 gap-2 pt-2.5 border-t-[1.5px] border-dashed border-line-2`. Each cell is an `Eyebrow` (11/700, `tracking-eyebrow`, muted) over a value (`text-18 font-bold`): SEAT "14A" · BOARDS "8:05" (`tabular-nums`) · PNR "K7QX2M".
- Ticket link: `Button asChild variant=secondary size=sm`, `w-full h-[42px] gap-1.5`, wrapping `<Link href={ticketHref}>` with `FileText` `size-4` + "Open ticket PDF". `ticketHref = /trips/goa/bookings/${bookingId}/ticket` (M3).

#### ReturnRow — `sheets/ReturnRow.tsx`
```ts
interface ReturnRowProps { emoji: string; title: string; sub: string }
```
- Wrapper: `Card variant=shadow radius=2xl` (no border) around a non-interactive `ListRow` (`px-3.5 py-3 gap-3`).
- Leading: `EmojiTile size={40} shape="circle"`, `bg-surface-2 text-[19px]`, 🛬.
- Title: `text-16 font-semibold tracking-body leading-[1.3]`, "Return · Mon 9 Nov".
- Sub: `text-13 text-muted`, "6E 6142 · GOX 4:10 pm → BLR 5:25 pm".
- No chevron, no href.

#### PlanCard — `chat/cards/PlanCard.tsx`
```ts
interface PlanDay { n: number; weekday: string; caption: string; img: string }
interface PlanCardProps {
  eyebrow: string; place: { emoji: string; label: string }; dates: { emoji: string; label: string }; countdown: { emoji: string; label: string };
  hero: { src: string; alt: string }; seal: { ring: string; month: string; days: string }; memberIds: UserId[];
  days: PlanDay[]; footer: { label: string; cta: string; href: string }; reaction?: { emoji: string; count: number };
}
```
- Structure: an outer `relative` wrapper (no margin) holds `InChatCard right={22}` and the floating `ReactionChip`. The chip sits outside the card's `overflow-hidden` so it isn't clipped.
- Hero: `relative h-[176px] bg-[#C9D6E2]`. There is no token for #C9D6E2, so report it.
  - `<img>`: `size-full object-cover`, alt "Palm silhouette against a Goa sunset over the sea".
  - `ProgressiveBlur` with 4 layers (each transparent → opaque, top to bottom, `pointer-events-none`):
    - blur 2px, mask 52% → 68%;
    - blur 5px, mask 62% → 78%;
    - blur 9px, mask 72% → 88%;
    - blur 16px, mask 82% → 100%.
  - Tint: `absolute inset-0 bg-linear-to-b from-ink/0 from-45% via-ink/20 via-65% to-ink/55`.
  - `WaxSeal`: `absolute top-1 right-1 size-[92px] -rotate-12 overflow-visible`, with `ring`/`month`/`days`.
- Hero text block: `absolute inset-x-4 bottom-3.5 flex flex-col gap-0.5 text-white`.
  - `Eyebrow tone=white` at `opacity-90`: "THE PLAN".
  - Title: `flex items-center gap-1 text-34 font-bold tracking-title leading-[1.05]`, emoji `<span aria-hidden class="w-6 text-24">📍</span>`, then "Goa".
  - Bottom row: `flex items-end justify-between gap-2`.
    - Left column (`gap-0.5`), two lines, each `flex gap-1.5 text-14 font-medium tracking-sm leading-[1.35] whitespace-nowrap` with an emoji span `w-[18px] text-14`: "📅 Fri 6 – Mon 9 Nov" and "⏳ in 34 days".
    - Right: `AvatarStack size=22 overlap=-8 ring=white-thin` with `pl-[7px]`.
- `DayStrip` (below).
- Footer: `pt-3 pr-3 pb-3.5 pl-3.5 flex items-center gap-2`.
  - `Avatar kind=go size=22`;
  - "Made by Go": `flex-1 text-13 font-medium text-muted`;
  - `Button asChild variant=tint size=sm` wrapping `<Link href="/trips/goa">` "Open".
- Reaction: `ReactionChip floating`, `absolute left-[52px] -bottom-3.5` (the card's left edge + 14), `h-[26px] px-[9px] gap-1 shadow-chip text-13 font-bold tabular-nums`, 🔥 4.
- The message after the card gets `mt-[26px]`, on top of the list's `gap-2.5`.

#### DayStrip — `chat/cards/DayStrip.tsx`
```ts
interface DayStripProps { days: PlanDay[] }
```
- Strip: `px-3 pt-3 pb-1 grid grid-cols-4 gap-2`. Each day is `flex flex-col gap-1.5`.
- Tile: `relative h-[62px] rounded-xl overflow-hidden bg-frame-bg` (#E9EDF2).
  - `<img alt="">`, cover.
  - Gradient: `absolute inset-0 bg-linear-to-b from-black/0 from-30% to-black/60`.
  - Label: `absolute left-2 bottom-1.5 flex flex-col gap-0.5 text-white leading-none`, holding `DAY ${n}` (`text-9 font-bold tracking-eyebrow opacity-85`) and the weekday (`text-11 font-bold tracking-eyebrow`).
- Caption below the tile: `text-12 tracking-[0.01em] leading-[1.3] text-balance text-muted`.

#### WaxSeal (owned by P1-6, `icons/custom/WaxSeal.tsx`) — consumed here
```ts
interface WaxSealProps extends React.SVGProps<SVGSVGElement> { ring: string; month: string; days: string }
```
92×92, built per the inventory's P-Chat-Plan "Icons & images" entry. Every gradient, filter and path id is suffixed with `useId()`.

### 1.5 Interactions → actions / toasts

| Where | Element | Action | Result |
|---|---|---|---|
| F1 chat | "Add my travel details" | open `route` sheet (`router.push('?sheet=route')`) | RouteSheet over the current chat |
| Board sheet (H) | travel row | open `route` sheet | as above |
| RouteSheet | One way / Round trip | `setRouteTrip` | title, sub, leg card, filters (Mix hidden one way), rows and CTA update |
| RouteSheet | ✈️ Flight / 🚆 Train / 🚌 Bus | `setRouteMode` | filter → All, pick → null, time slots kept |
| RouteSheet | filter chip | `setRouteFilter` | rows, count, CTA update; selection falls back to first visible |
| RouteSheet | option row | `pickRoute` | row `bg-success-tint`, price `price-selected`, CTA price |
| RouteSheet | "🕘 Time" chip | `openTimeSheet` | TimeSheet opens with drafts = committed slots |
| TimeSheet | slot tile | `toggleDraftSlot` | tile solid; Apply label updates live (`previewCount`) |
| TimeSheet | "Clear" | `clearDraftSlots` | all tiles off; sheet stays open; nothing applied |
| TimeSheet | "Show N options" / "No options in these slots" | `applyTimeSlots` | closes; leg metas, chip, rows update; pick reset |
| TimeSheet | X / backdrop / drag | `closeTimeSheet` | closes; drafts discarded |
| RouteSheet | "Clear filters" (empty state) | `clearRouteFilters` | filter All, slots cleared |
| RouteSheet | X / scrim / drag / back | `closeTimeSheet` + close | same chat stage |
| RouteSheet | "Book … · ₹…" | `bookRoute` + close | stage `route-confirm` (when at `travel`) |
| F4 card | "Book" | open `cab` sheet | CabSheet (re-booking overwrites `cab.booked`) |
| Trip home (J) | "Book ₹1,600" | `/trips/goa/chat?sheet=cab` | CabSheet over the current (`plan`) chat |
| CabSheet | One way / Round trip, chips, rows | local state | DROP row toggles; count and CTA update |
| CabSheet | "Book both rides · ₹3,200" / "Book one way · ₹…" | `bookCab` + close | pending cab row cleared on trip home |
| CabSheet | X / scrim / drag | close | — |
| F4 | "Next · Priya asks when everyone lands" | advance to `next.to` | stage `private` |
| F6 | "Next · Go’s final plan" | advance (`plan-asked`) | stage `plan` |
| F6 card | "View my details" | `markPrivateViewed` + open `private` sheet | PrivateSheet |
| PrivateSheet | "Open ticket PDF" | `<Link>` | `/trips/goa/bookings/<bookingId>/ticket` (M3) |
| PrivateSheet | X / scrim / drag | close | F6 thread |
| F8 card | "Open" | `<Link>` | `/trips/goa` (J1) |

Toasts: the design has none specific to F1–F8, and none are added. Shell toasts (share sheet, composer auto-reply, attach items) follow the C spec.

### 1.6 Data bindings

Export names are proposals; if P2-1 has already landed different names, use those.

| Source | Exports | Feeds |
|---|---|---|
| `data/seed/routes.ts` | `ROUTE_OPTIONS: Record<Mode, RouteOption[]>` — flight f1 f2 f3 f6 f7 f4 f5 f8, train t1–t4, bus b1–b4 (values from the inventory's P-Chat-RouteSheet tables). Each leg carries `RouteLeg.code`/`day`; flights set `carrier` 'indigo' or 'airindia'. `ROUTE_FILTERS` — flight all / nonstop / stop / mix "All · Nonstop · With a stop · Mix airlines"; train all / 3A / 2A / SL "All · AC 3-tier · AC 2-tier · Sleeper"; bus all / sleeper / seater "All · Sleeper · Seater". `TIME_SLOTS` (s0–s3). `ROUTE_MODES` (flight ✈️ Flight, train 🚆 Train, bus 🚌 Bus). `TRIP_TYPES` (oneway One way, round Round trip). `ROUTE_COPY`: titles, subs, eyebrows, privacy note, empty state, "Preferred times" and its sub, "Clear". | RouteSheet, TimeSheet, `lib/routes.ts` |
| `data/seed/cabs.ts` | `CAB_OPTIONS` (s1 s2 s3 u1 u2). `CAB_FILTERS` (all "All", sedan "🚗 Sedan", suv "🚙 SUV"). `CAB_COPY`: title, sub, PICKUP/DROP legs, info note. | CabSheet |
| `data/seed/bookings.ts` | The IndiGo itinerary (6E 5313 out, 6E 6142 back, seat 14A, boards 8:05, PNR K7QX2M, ticket doc K7QX2M). `PRIVATE_DETAILS: PrivateDetails`. `PRIVATE_COPY` (title, sub). | PrivateSheet, `bookRoute` side effects |
| `data/seed/money.ts` | Transaction "You booked with IndiGo ₹8,060" | `bookRoute` side effect |
| `data/scenario/goa.ts` | Stages `travel`, `route-confirm`, `private`, `plan`: messages and payloads from §1.2 | `MessageRenderer` → cards |
| `lib/assets.ts` | `goAvatar`; `avatars/{aarav,rahul,priya,arjun}`; `brand/indigo.svg`; `brand/air-india.svg`; `photos/goa-sunset.jpg` (plan hero); `photos/day-{fri,sat,sun,mon}.jpg` (DayStrip); `illustrations/goa.png` (header trip avatar) | rows, cards, sheets |
| store | `chat.goa.route`, `chat.goa.cab`, `chat.goa.privateViewed`, `trips.goa.stage` | RouteSheet, board (P3-8), trip home (P3-17) |

Blob → asset mapping from the inventory:

| Blob | Asset |
|---|---|
| `7a6cf4a7…` | `brand/indigo` |
| `36d05a72…` | `brand/air-india` |
| `29f7382b…` | `photos/goa-sunset` |
| `8422cba1…` / `a76721da…` / `5e6fdc7c…` / `41377a12…` | `day-fri` / `day-sat` / `day-sun` / `day-mon` |
| `5bda4ac2…` | `goAvatar` |
| `c58d972a…` | aarav |
| `cb0a34fd…` | rahul |
| `234f094a…` | priya |
| `8c7b7cb2…` | arjun |
| `63e0220f…` | trip avatar |

### 1.7 Deviations from the design

1. **Route selection and bookings (PLAN §12.1 #12).**
   - Kept as designed: the default selection is f1, and "Nonstop" includes the mixed-airline f1.
   - `bookRoute` stores the actual selection, which drives the board travel row and H3.
   - These are always the IndiGo f2 seed (`// DESIGN-ASSUMPTION`): the bookings, check-in, the private sheet, the "booked mine ✈️ lands 9:55 fri" message, the who-lands rows and the "You booked with IndiGo ₹8,060" transaction.
2. **Cab sheet (PLAN §12.1 #13).** No per-person split, seat picker or headcount; the CTA shows the total only. The cab InfoNote keeps the lock icon, as designed.
3. **Route sheet close.** It closes to the current chat state, not to F1. Route state (trip, mode, filters, slots, pick) persists between opens. Time-sheet drafts are discarded on close.
4. **TimeSheet.** It is nested UI state (`route.draft`) with no route or URL. F3 is reachable only through its preset; the artboard is unlinked in the prototype too.
5. **Travel copy.** Use F1's "Add where you’re coming from…"; F2's "Add your travel…" is drift. The progress pill stays visible under the route sheet.
6. **Cab sheet context.**
   - It opens over the full route-confirm thread, including the Next pill; F5 drops the pill.
   - Book closes the sheet and records `cab.booked`; the design only navigates back.
   - The trip-home "Book ₹1,600" opens the sheet at its design default, Round trip · ₹3,200.
7. **PrivateSheet context.**
   - It opens over the full `private` thread. F7's background shows only a reworded single Go bubble.
   - The money line stays in the Go message and in the blurred teaser ("You owe Rahul ₹12,900", literal design copy that differs from the money seed's ₹5,800).
   - The sheet itself omits money, as designed ("no money (v2)").
8. **PrivateSheet height.** It uses content height instead of PLAN §4's `top 479`. The two match at 420×912, and content height avoids a ~190px sheet on 667px-tall phones.
9. **Plan "Open".** It goes to `/trips/goa`; the design goes to `P-Home`.
10. **WaxSeal ids.** They are namespaced per instance with `useId`.
11. **Sheet entry.** Sheets slide in via vaul; the artboards show the route, cab and private sheets statically open.
12. **Next pills.** The F4 and F6 pills show on stage entry and advance the scenario rather than navigating.
13. **Header.** Header metrics follow the standardised chat header (PLAN §12.1 #8).

### 1.8 Acceptance checklist

**F1**
- [ ] `?preset=F1` opens the chat at `travel`. Header reads "Goa crew" / "Diwali · 6–9 Nov"; chips read 📍 Goa ✓ 📅 Nov 6–9 ✓ 🏡 Villa Sol ✓ 💰 ₹21.8k ✓ 🛫 Bengaluru ✓.
- [ ] Arjun "how are we all getting there?", then the Go bubble with exact copy.
- [ ] The Go bubble's black CTA is 44px tall at 15/600, with Lock 15 and "Add my travel details". Below it, the caption "Only you and Go see what you add" in `text-go`.
- [ ] Centred white pill with Go avatar 20: "Rahul and Priya added theirs".
- [ ] The CTA opens RouteSheet and the URL gains `?sheet=route`.
- [ ] No Next pill.

**F2**
- [ ] Sheet at top 96, r28, with grabber. Title "BLR ⇄ GOA", sub "Fri 6 Nov → Mon 9 Nov · just you".
- [ ] Round trip and ✈️ Flight selected.
- [ ] Leg card: ONWARD "BLR → GOX" · "Any time", dashed divider, RETURN "GOX → BLR" · "Any time".
- [ ] Chips: All (solid) · Nonstop · With a stop · Mix airlines · 🕘 Time, scrolling full-bleed.
- [ ] Worked examples 1–4 and 7–9 hold: count line, selected row, CTA.
- [ ] Example 9 shows a disabled grey CTA, "Nothing matches these filters" and "Clear filters".
- [ ] f1 row: tag "BEST TIMING · MIXED AIRLINES" in info blue, IndiGo tile outbound, Air India tile (white + border) on return, green row background and green price "₹7,840".
- [ ] f4 shows the stop line with Stopwatch, "Change in Hyderabad · 1h 40m wait", in `text-go`.
- [ ] Train rows show 🚆 tiles and "BLR → GOA".
- [ ] Privacy note text is exact.
- [ ] Book moves to `route-confirm` and closes the sheet.
- [ ] X, scrim and drag return to the same chat with no stage change.

**F3**
- [ ] `?preset=F3` shows the route sheet with the Preferred times sheet on top (content height, max 760). The parent sheet is not scaled.
- [ ] Eyebrows "ONWARD · BLR → GOX · FRI 6 NOV" and "RETURN · GOX → BLR · MON 9 NOV".
- [ ] 2×2 tiles 🌙 🌅 ☀️ 🌆, with Evening solid.
- [ ] Footer: grey "Clear" + "Show 5 options".
- [ ] Clear gives "Show 8 options" and applies nothing. X discards the drafts.
- [ ] Underneath: chip "🕘 Time · 1" solid, ONWARD meta "6 pm – 12 am", "5 options · scroll for more", rows f1–f5.
- [ ] Worked examples 5, 6 and 10 hold after Apply.
- [ ] One way hides the RETURN block.

**F4**
- [ ] Me: "booked mine ✈️ lands 9:55 fri". Go: "Got it. That’s the last one in 🎉 Here’s when everyone reaches Goa:".
- [ ] Card "Who lands when" with "Everyone’s booked" in `text-success-ink`.
- [ ] 4 rows (You, Arjun, Priya, Rahul) with exact mode lines and times, each with CheckBadge 24.
- [ ] Strip: 🚕 "You and Arjun land together. Share a cab?" + 30px tint "Book", which opens `?sheet=cab`.
- [ ] Arjun "same flight 🤝" with a 🙌 2 chip under the bubble.
- [ ] Next pill "Next · Priya asks when everyone lands" leads to `private`.

**F5**
- [ ] Sheet at top 110: "Cab to Villa Sol" + sub; Round trip selected.
- [ ] PICKUP and DROP rows with "when you land" / "1:30 pm".
- [ ] Chips All / 🚗 Sedan / 🚙 SUV give counts 5 / 3 / 2.
- [ ] Rows s1–u2 with 48×44 emoji tiles; s1 selected.
- [ ] CTA "Book both rides · ₹3,200". SUV gives "Book both rides · ₹4,200".
- [ ] One way hides the DROP row and shows "Book one way · ₹1,600" (All).
- [ ] Book closes the sheet and sets `cab.booked`; the trip home no longer lists the Airport cab pending row.
- [ ] InfoNote reads "Go tracks your flight and tells the driver if you land late."

**F6**
- [ ] Priya's question, then my message with the Go mention chip ("when’s my flight and what do i owe?"), then Go's reply with bold "9:55 pm Fri" / "10:30 am Sat".
- [ ] Dashed white card with navy lock badge 28 and "ONLY YOU CAN SEE THIS".
- [ ] The two blurred lines are `aria-hidden` and not selectable.
- [ ] "View my details" (46px, Eye 18) opens PrivateSheet and sets `privateViewed`.
- [ ] Rahul: "nice, i’ll wait up with beers 🍻".
- [ ] Next pill "Next · Go’s final plan" leads to `plan`.

**F7**
- [ ] Content-height sheet (~433px at 420×912): "Just for you" + "🔒 Only you can see this. The group got the summary."
- [ ] IndiGo badge + "6E 5313".
- [ ] BLR / GOX at 34/700 with "Fri 8:40 pm" / "9:55 pm" and a faint arrow between.
- [ ] Dashed grid: SEAT 14A · BOARDS 8:05 · PNR K7QX2M.
- [ ] "Open ticket PDF" goes to M3 for the flight booking.
- [ ] Return row: 🛬 "Return · Mon 9 Nov" / "6E 6142 · GOX 4:10 pm → BLR 5:25 pm".
- [ ] No money anywhere in the sheet.
- [ ] The sheet opens over the full F6 thread and closing returns to it.

**F8**
- [ ] Me: "@Go can you sort the whole plan?" (max 70%). Go: the 3-line "Here's your Goa." (max 64%).
- [ ] Hero: 176px image, progressive blur and tint.
- [ ] Wax seal: 92px, rotated −12°, top-right, with ring text, "NOV" and "6–9".
- [ ] Two seals on one page do not share ids.
- [ ] Hero text: "THE PLAN", "📍 Goa" at 34/700, "📅 Fri 6 – Mon 9 Nov", "⏳ in 34 days", 4 avatars at 22.
- [ ] Day strip runs DAY 1 FRI "Everyone lands" through DAY 4 MON "Panjim, then home".
- [ ] Footer: Go avatar 22, "Made by Go" and tint "Open", which goes to `/trips/goa` (the planned trip home).
- [ ] The 🔥 4 chip overlaps the card's bottom-left without being clipped.
- [ ] Rahul's "GOOO 😭" sits 26px lower.
- [ ] `trips.goa.stage === 'planned'` after entering the stage.

### 1.9 Consumed by tasks

- **P3-6 Travel, route, cab.** Uses §1.2 (`travel`, `route-confirm`), §1.3, §1.5, §1.6 and §1.8 F1–F5. Owns TravelAskBubble, ProgressPill, WhoLandsCard, SuggestionStrip, RouteSheet, TimeSheet, TimeChip, OptionListCard, CabSheet, LegSummaryCard, RouteOptionRow, CabOptionRow and `lib/routes.ts`.
- **P3-7 Private, plan (+ visa from G).** Uses §1.2 (`private`, `plan`), §1.4 and §1.8 F6–F8. Owns PrivateTeaserCard, PrivateSheet, BoardingInfoCard, ReturnRow, PlanCard and DayStrip.
- **P3-9 Chat page.** Uses §1.1 (presets, URL), §1.2 (stage wiring, pills, `mt-[26px]` after the plan card) and §1.5.
  - `MessageRenderer` maps `travel-ask` → TravelAskBubble, `progress-pill` → ProgressPill, `who-lands` → WhoLandsCard, `private-teaser` → PrivateTeaserCard, `plan` → PlanCard.
  - `useChatSheets` maps `route` → RouteSheet (TimeSheet nested inside), `cab` → CabSheet, `private` → PrivateSheet.
- **Also read by:**
  - P2-1: seeds and scenario (§1.2, §1.6);
  - P2-2: store contract and presets (§1.3, §1.1);
  - P1-6: WaxSeal props;
  - P3-8: the board travel row reacts to `route.booked`;
  - P3-17: the pending cab row reacts to `cab.booked`.

## 2. Inventory (reference)

# Group F — Trip chat: travel → route → time → who-lands → cab → private → plan

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`. All 8 files are 420×912 artboards of the SAME trip chat ("Goa crew"). All files read in full; RouteSheet↔TimeSheet and Private↔PrivateSheet were also `diff`ed (differences listed exactly below).

---

## 0. Shared chat shell (brief; documented in depth by the shell reader)

Present identically in all 8 files unless a per-screen note says otherwise.

- **Canvas**: `position:relative; 420×912; flex column; bg #F6F7F9; font-family 'Satoshi','Figtree',system-ui; color #0B1B3F; overflow hidden`. Figtree 400–800 from Google Fonts.
- **Global CSS classes**: `.row` (press scale .985, active bg `#F5F6F8 !important`), `.tick` (@starting-style scale .8/opacity 0, 200ms), `.enter` (@starting-style opacity 0 + translateY(6px), 220ms `cubic-bezier(0.23,1,0.32,1)`), `.live` (1600ms pulse ring `0 0 0 7px rgba(22,163,74,0.12)`), reduced-motion overrides. `a,button:active{scale(.97)}`; black-bg buttons get inset white 18% overlay on press; `#F2F2F2/#F4F5F7/#F6EAE6/#FFFFFF/transparent` buttons get inset `rgba(11,27,63,0.07)` on press. `[role="dialog"]>div>*{flex-shrink:0}`. Plan.dc.html additionally defines `.knob` + `button[aria-pressed="true"]>.knob{translateX(20px)}` (unused there).
- **Header** (z 2, `padding 56px 0 12px`, bg #FFFFFF, shadow `0 1px 0 rgba(11,27,63,.04), 0 6px 16px rgba(11,27,63,.06)`):
  - Row (`gap 8px; padding 0 12px`): Back 44×44 round (arrow-left SVG 22, stroke 2) → `P-Home.dc.html`; identity link (flex 1, h 60, `padding 0 8px 0 0`, gap 10) → `P-Home.dc.html`: 44px circle bg #FFF1DC with `/_blob/63e0220f…` 40×40 (trip avatar); "Goa crew" 16/600 −0.011em lh1.25; below: 4-avatar stack 18px (border 1.5 #FFF, margin-left −5: You `c58d972a…`, Rahul `cb0a34fd…`, Priya `234f094a…`, Arjun `8c7b7cb2…`) + "Diwali · 6–9 Nov" 13 #4A5878; Trip-board icon 44 (rounded rect + 3 lines, SVG 20) → `P-Board-B.dc.html`; Share icon 44 (curved forward arrow SVG 20) `onClick pa_0` → opens share sheet.
  - Context chip row (`margin-top 14; gap 8; padding 0 20; overflow-x auto`): chips h36, pad 0 14, r999, bg #FFF, border 1px #DDE1E6, 14/500, emoji slot 16w + label + green check badge (16 circle #16A34A, white check SVG 9 stroke 4): `📍 Goa` → P-Board-B; `📅 Nov 6–9` → P-Board-B; `🏡 Villa Sol` → P-Board-B; `💰 ₹21.8k` → `P-Chat-BudgetSheet-Slider.dc.html`; `🛫 Bengaluru` → `P-Chat-FromSheet.dc.html`.
- **Message list**: scroll region `flex 1; overflow-y auto`; inner `padding 16px 16px 96px; gap 10px`. Bubbles: incoming member = white, r `20 20 20 0`, name 13/600 #4A5878, avatar 30; Go = bg #F6EAE6, "Go" 13/600 #A44F3A, Go avatar `/_blob/5bda4ac2…` 30 on bg #DCEBFF; outgoing (me) = bg #000 white, r `20 20 0 20`, padding 10 14. Bubble shadow `0 1px 2px rgba(11,27,63,.06), 0 4px 12px rgba(11,27,63,.04)`. Dynamic `pSent` list rendered after static content (`.enter` rows) + `<span data-p-end>` scroll anchor.
- **@Go mention chip** (inside outgoing bubble; used in Private & Plan): h24, `padding 0 9px 0 2px`, r999, bg rgba(255,255,255,.16), white 600, Go avatar 20 + "Go".
- **"Next" story pill** (RouteConfirm, Private): `.enter`, align-self center, margin-top 6, h42, `padding 0 14px 0 6px`, gap 8, r999, bg #0B1B3F, white 14/600, shadow `0 6px 18px rgba(11,27,63,.2)`, Go avatar 30 + text + chevron SVG 14 stroke 2.6. Shown via `pNext: true` (hint true).
- **Composer** (absolute bottom, `padding 24px 16px 24px`, gap 10, gradient `rgba(246,247,249,0)→#F6F7F9 35%`): `+` 48 white round (shadow `0 1px 3px rgba(0,0,0,.08)`) toggles attach menu; input pill 48 white, placeholder "Message, or @Go" (#4A5878); mic/send 48 round black (#B42318 while recording; arrow icon when draft non-empty, mic icon otherwise). Attach menu (`.enter`, abs left 16 bottom 84, 220w, r18, shadow `0 10px 30px rgba(11,27,63,.22)`): 📷 Photo / 📄 Ticket or PDF / 📍 Location / 🗳️ Poll (48h rows, 15/600, dividers #ECEFF3). Recording pill (abs right 16 bottom 84, h40, bg #B42318, `.live` dot 8) "Recording… tap the mic to send".
- **Share sheet** (`pShare`, z 40): backdrop button rgba(11,27,63,.38); dialog `.enter` bottom sheet `padding 8px 16px 30px`, r `28 28 0 0`, bg #F6F7F9, shadow `0 -8px 30px rgba(11,27,63,.18)`, gap 14; grabber 40×5 #DDE1E6; invite card ("Join Goa crew on Go" / "go.vestra.ai/t/goa-k7q" / Copy); WhatsApp group row "Goa crew 🌴 · WhatsApp group · recent" → `P-WA-Compose.dc.html` (**missing file**); app grid: WhatsApp → `P-WA-Pick.dc.html` (**missing file**), 💬 Messages, ✉️ Gmail, 🔗 Copy link, ⋯ More.
- **Toast** (`pToast`, z 60, abs bottom 108 centred, max-w 340, pad 12 16, r16, bg #0B1B3F, white 14/600, shadow `0 10px 30px rgba(11,27,63,.3)`), auto-hide 2200 ms.
- **Shell logic (`Component extends PBase`)**: state `pT:null, pShare:false, pSent:[]` (+ implicit `pDraft, pRec, pAttach`). `_send(t)` appends `{t, me:true}`, scrolls to `[data-p-end]` after 60 ms, then after 1200 ms appends Go reply **"Got it 👍 I’ll factor that into the plan."**. Mic: draft → send; recording → send "🎤 Voice note · 0:06"; else start recording. Attach items send "📷 Photo · Goa packing list" / "📄 Shared a PDF · IndiGo e-ticket" / "📍 Shared location · Anjuna" / "🗳️ Poll · Scuba on Sunday? Yes / No". Share toasts: Messages "Opens Messages with the link filled in"; Gmail "Opens Gmail with the link filled in"; Copy link & Copy "Invite link copied"; More "Opens your phone’s share menu" (each also closes sheet except Copy).
- **Z-stack**: header 2 · screen sheet backdrop 5 · screen sheet 6 · nested time sheet 8 · share 40 · toast 60.

### Shared asset table (`/_blob/` refs)
| blob | used as | size(s) |
|---|---|---|
| `63e0220f3d27d3795e1836f5d29b07d1` | trip avatar (Goa crew) | 40 in 44 circle #FFF1DC; 44 r12 in share card |
| `5bda4ac2e39242651eeed457db2d1a9c` | Go avatar (bg #DCEBFF) | 30 / 20 / 22 |
| `c58d972a22611bbd2e2f8570c48c72b8` | You | 18 / 22 / 32 |
| `cb0a34fddc3af7464df32602b63b30fa` | Rahul | 18 / 22 / 30 / 32 |
| `234f094a59fd64a1b23f7ec0e8d4cc45` | Priya | 18 / 22 / 30 / 32 |
| `8c7b7cb247d8cdf696b9f9eb4567da93` | Arjun | 18 / 22 / 30 / 32 |
| `7a6cf4a7c21683d8f45d293789e8c8e9` | IndiGo logo (white on #2B399B) | w40 in route tile; w56 on PrivateSheet |
| `36d05a721e7bb0381b56492d781633b1` | Air India logo (on #FFFFFF) | w34 in route tile |
| `29f7382bb7229ef7564c96e13fa753df` | Plan hero, alt "Palm silhouette against a Goa sunset over the sea" | 100%×176 cover |
| `8422cba1…`, `a76721da…`, `5e6fdc7c…`, `41377a12…` | Plan day tiles 1–4 (alt "") | ~1fr×62 cover |

All member images use `alt=""`.

---

## P-Chat-Travel.dc.html — "Go — Travel ask with CTA"

### Purpose (1 line)
F1: Go answers Arjun's "how are we getting there?" with a private "Add my travel details" CTA; status pill shows Rahul & Priya already added theirs.

### Layout top→bottom
1. Shell header (standard variant: row gap 8, padding 0 12, identity link h60). Chips as shell.
2. Message list (scroll, `padding 16 16 96`, gap 10):
   - **Arjun incoming**: row `flex; align-items flex-end; gap 8`; avatar Arjun 30; wrapper `max-width 72%`; bubble `padding 8px 14px 10px; r 20 20 20 0; bg #FFF; shadow`; "Arjun" 13/600 #4A5878 0.002em lh1.35; text "how are we all getting there?" 16 −0.011em lh1.4.
   - **Go travel-ask card (bubble with CTA)**: Go avatar 30 (bg #DCEBFF); bubble `max-width 80%; padding 8px 8px 10px 14px; r 20 20 20 0; bg #F6EAE6; shadow; flex column gap 6`:
     - "Go" 13/600 #A44F3A 0.002em lh1.35.
     - Body `padding-right 6; 16px; −0.011em; lh1.4; text-wrap pretty`: "Everyone picks their own way in ✈️🚆🚌" `<br>` "Add where you’re coming from and I’ll find options just for you. The crew only sees when you land."
     - **CTA** `<a>` → `P-Chat-RouteSheet.dc.html`: `margin-top 4; h44; padding 0 16; flex centred gap 6; r999; bg #000; #FFF; 15/600; nowrap`; padlock SVG 15 (rect 5,11 14×10 rx2 + shackle path, stroke 2) + "Add my travel details".
     - Caption `padding-right 6; 12px; #A44F3A; lh1.35`: "Only you and Go see what you add".
   - **Progress status pill** (system-ish, centred): `align-self center; margin 2px 0; padding 5px 12px 5px 5px; r999; bg #FFF; same bubble shadow; gap 6; 13px #4A5878 0.002em lh1.35`; Go avatar 20 (bg #DCEBFF) + "Rahul and Priya added theirs".
   - `pSent` dynamic rows.
3. Composer (shell). No screen sheet open.

NOTE: there is **no per-member from-city list and no "add my route" text** on this card; origin lives only in the header chip `🛫 Bengaluru` (→ P-Chat-FromSheet). The only per-member progress signal is the single pill above.

### Sheets / overlays
Only shell overlays (share sheet, attach menu, recording pill, toast).

### State & interactions
- DCLogic: `PBase.renderVals(){return {}}`; Component = shell only (`pT, pShare, pSent`).
- Tap CTA → navigates to RouteSheet (route sheet open over this same chat).
- Status pill: not interactive.

### Navigation table
| element | target |
|---|---|
| "Add my travel details" CTA | `P-Chat-RouteSheet.dc.html` |
| Back / identity | `P-Home.dc.html` |
| Board icon, 📍/📅/🏡 chips | `P-Board-B.dc.html` |
| 💰 chip | `P-Chat-BudgetSheet-Slider.dc.html` |
| 🛫 chip | `P-Chat-FromSheet.dc.html` |
| Share sheet WhatsApp row / tile | `P-WA-Compose.dc.html` / `P-WA-Pick.dc.html` (both missing) |
Incoming links to this file: `P-Chat-Book`, `P-Bookings-Zero` (×2), `P-TripHome-Zero`, and backdrop/close of RouteSheet & TimeSheet.

### Data shown
- Arjun: "how are we all getting there?"
- Go: "Everyone picks their own way in ✈️🚆🚌 / Add where you’re coming from and I’ll find options just for you. The crew only sees when you land."
- CTA "Add my travel details"; caption "Only you and Go see what you add".
- Pill: "Rahul and Priya added theirs".

### Icons & images
Padlock SVG 15 stroke 2 (white on CTA). Emoji ✈️🚆🚌 inline in Go text. Go avatar 30 & 20; Arjun 30.

---

## P-Chat-RouteSheet.dc.html — "Go — Route sheet"

### Purpose (1 line)
F2: Full-height private bottom sheet over the chat to pick your own BLR⇄GOA flight/train/bus (trip type, mode, filters, time slots, option list, sticky Book CTA).

### Layout top→bottom
**Background chat** (dimmed): shell header **variant**: row `gap 4px; padding 0 8px 0 12px`; identity link `h52; padding 0 4px`; subtitle "Diwali · 6–9 Nov" lacks letter-spacing/line-height. Messages: Arjun "how are we all getting there?"; Go CTA bubble identical to Travel EXCEPT body text "Everyone picks their own way in ✈️🚆🚌<br>Add your travel and I’ll find options just for you. The crew only sees when you land." and "Go" label without letter-spacing/lh. **No** "Rahul and Priya added theirs" pill. Composer present under scrim.

**Scrim**: `<a href="P-Chat-Travel.dc.html" aria-label="Close sheet">` abs inset 0, z5, bg rgba(11,27,63,0.38).

**Route sheet** (`role=dialog aria-label={{title}}`, NO `.enter` class): `position absolute; left/right/bottom 0; top 96px` (→ 816 tall); z6; flex column; r `28px 28px 0 0`; bg #F6F7F9; shadow `0 -8px 30px rgba(11,27,63,.18)`.
1. Grabber: align-self center, margin-top 8, 40×5, r999, #DDE1E6.
2. Scroll body: `flex 1; overflow-y auto; scrollbar none; padding 8px 16px 120px; flex column gap 12px`.
   a. **Header block** `padding 0 4px; gap 2`: row space-between gap 12 → title `{{title}}` 22/600 −0.02em lh1.3 ("BLR ⇄ GOA" round / "BLR → GOA" one-way) + close `<a>` 40×40, margin-right −6, r999, bg #FFF, shadow `0 1px 3px rgba(0,0,0,.08)`, X SVG 18 stroke 2 → `P-Chat-Travel.dc.html`. Sub `{{sub}}` 14 #4A5878 −0.004em lh1.4 pretty: "Fri 6 Nov → Mon 9 Nov · just you" / "Fri 6 Nov · one way · just you".
   b. **Trip-type segmented control** `role=radiogroup aria-label="Trip type"`: container `padding 4; gap 4; r999; bg #FFF; border 1px #ECEFF3`. Segments (`role=radio`, aria-checked): `flex 1; h40; border 0; r999; flex centred gap 6; 15/600`; selected `bg #000; #FFF`; unselected `bg transparent; #4A5878`. Labels: "One way", "Round trip".
   c. **Mode segmented control** `role=radiogroup aria-label="How you’re travelling"`: no container, `gap 6`. Each seg (same base `flex 1; h40; r999; 15/600; gap 6`): selected `bg #000; #FFF; border 0`; unselected `bg #FFF; #0B1B3F; border 1px #DDE1E6`. Content: emoji span (aria-hidden) + label → "✈️ Flight", "🚆 Train", "🚌 Bus".
   d. **Leg summary card**: `r18; bg #FFF; border 1px #ECEFF3; overflow hidden`. Row `padding 12px 16px; gap 12`: left column = eyebrow 11/700 #4A5878 0.08em lh1.35 "ONWARD · FRI 6 NOV" + value 16/600 −0.011em lh1.3 `{{onCode}}`; right `{{onSlot}}` 13/600 #4A5878. If round trip: second row `border-top 1px dashed #DDE1E6` "RETURN · MON 9 NOV" / `{{retCode}}` / `{{retSlot}}`. Not tappable.
   e. **Filter chip row** `role=group aria-label="Filter options"`: `margin 0 -16px; padding 0 16px` (full-bleed), `flex gap 6; overflow-x auto; scrollbar none`. Chips (`aria-pressed`): `h40; padding 0 14; nowrap; r999; 14/600; transition bg/color 160ms`; on `bg #000; #FFF; border 1px #000`; off `bg #FFF; #0B1B3F; border 1px #DDE1E6`. After mode chips, a **Time chip** button (`aria-haspopup=dialog`, same chip style; "on" when any slot chosen): label "🕘 Time" or "🕘 Time · N".
   f. **Count line** `padding 0 4; 13/600 #4A5878`: `{{count}}` e.g. "8 options · scroll for more" (suffix only when >2; singular "1 option").
   g. **Option list card**: `r22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,.06); overflow hidden`. Each **route option row** = `<button aria-pressed>`: `width 100%; padding 12px 14px; border 0; flex column gap 8; text-left`; bg selected `#F0FAF3` else transparent; rows after first get `border-top 1px solid #ECEFF3`.
      - Top line (space-between gap 10): **tag** 11/700 0.06em UPPERCASE, colour by kind: `mix #3E73D6`, `stop #A44F3A`, else `#4A5878`; **price pill** `h32; padding 0 12; r999; 15/600 tabular-nums`; selected `bg #16A34A; #FFF`; else `bg #F2F2F2; #0B1B3F`.
      - One leg line per leg (2 for round trip, 1 for one-way), `flex gap 10`:
        - Left col 64w: code 12/700 #0B1B3F nowrap ("BLR → GOX"/"GOX → BLR" flight; "BLR → GOA"/"GOA → BLR" train/bus); day 11/600 #4A5878 ("Fri 6" / "Mon 9").
        - **Carrier tile** `52×30; r9; flex centred; overflow hidden; 16px`; bg = airline bg (IndiGo #2B399B; Air India #FFFFFF + `border 1px #ECEFF3`) or #F4F5F7 when no logo; content = logo `<img alt={{air}}>` width 40 (IndiGo) / 34 (Air India) height auto, or mode emoji (✈️/🚆/🚌) for train/bus.
        - Right col (flex 1, gap 1): time 15/600 tabular-nums ("8:40 pm → 9:55 pm"); meta 13 #4A5878 0.002em ("IndiGo · nonstop · 1h 15m"); optional **stop line** 12/600 #A44F3A gap 4 with stopwatch SVG 12 (stroke 2.2: circle cx12 cy13 r8, hand `M12 9v4l2.5 2`, top bar `M10 2h4`) + text ("Change in Hyderabad · 1h 40m wait").
      - **Empty state** (`none`): `padding 20px 16px; column centred gap 10`: "Nothing matches these filters" 15/600 + "Clear filters" button `h36; padding 0 14; r999; bg #F6EAE6; #A44F3A; 14/600`.
   h. **Privacy note**: `padding 12px 14px; gap 10; r18; bg #FFF6F2`; padlock SVG 16 (stroke currentColor #0B1B3F) + 14 lh1.4 "Only you see these. Go shares just your arrival time with the group."
3. **Sticky sheet footer**: abs bottom of sheet, `padding 40px 16px 24px; column; gap 10; gradient rgba(246,247,249,0)→#F6F7F9 35%`. CTA `<a href="P-Chat-RouteConfirm.dc.html">`: `h56; flex centred; r999; 18/500`; enabled `bg #000; #FFF`; disabled (no options) `bg #DDE1E6; #8A93A3; pointer-events none`. Label "Book round trip · ₹7,840" / "Book one way · ₹3,960" / "No options match".

### Sheets / overlays
- **Route sheet** (always open in this file): trigger = Travel CTA (cross-file). Dimensions top 96 → bottom, r28 top. Grabber yes. Close = scrim tap or X → P-Chat-Travel. Primary = sticky Book CTA → P-Chat-RouteConfirm (no in-file confirmation).
- **Nested "Preferred times" sheet** (`timeOpen`, z 8, within this file): trigger = Time chip. Layer: `<div abs inset0 z8>` → backdrop `<button aria-label=Close>` rgba(11,27,63,.38) (closes, discards drafts) + dialog `role=dialog aria-label="Preferred times"` `.enter`: `abs left/right/bottom 0; max-height 760px; flex column; r 28 28 0 0; bg #F6F7F9; shadow 0 -8px 30px rgba(11,27,63,.18)`. Grabber (margin-top 8, 40×5 #DDE1E6). Scroll body `padding 8px 16px 130px; gap 14`. Full detail under TimeSheet below (same markup).
- Shell share sheet / toast also present.

### State & interactions
`PBase` state (initial): `trip:'round', mode:'flight', filt:'all', pick:null, timeOpen:false, on:[], ret:[], tOn:[], tRet:[]`.
Constants: `ALL` (routes per mode), `FIL` (filters per mode), `SL` (4 slots), `EMO {flight ✈️, train 🚆, bus 🚌}`.
Derived:
- `rt = trip==='round'`; `fl = mode==='flight'`; `inr(v) = '₹'+v.toLocaleString('en-IN')`.
- `code` = flight `['BLR → GOX','GOX → BLR']`, else `['BLR → GOA','GOA → BLR']`.
- `inSlots(h,list)` = empty list OR h within any selected slot `[start,end)`.
- `okFilt(o)`: `all` → true; flight: `nonstop` = kind≠'stop' (so mixed-airline f1 counts as nonstop), `stop` = kind==='stop', `mix` = kind==='mix'; train/bus: kind===filt.
- `match(o,on,ret)` = `(rt || !o.roundOnly) && okFilt && inSlots(legs[0].h,on) && (!rt || inSlots(legs[1].h,ret))`.
- `shown = ALL[mode].filter(match(s.on,s.ret))`; `chosen = shown.find(id===pick) || shown[0] || null` (selection silently falls back to the first visible row).
- Filters: `FIL[mode]` minus `mix` when one-way.
- `nTime = on.length + (rt ? ret.length : 0)`; time chip label/“on” style from nTime.
- `slotTxt(list)`: none → "Any time"; one → slot range (e.g. "6 pm – 12 am"); many → "N time slots".
- `count` = `N option(s)` + `" · scroll for more"` if N>2.
- `cta` = chosen ? `"Book " + (rt?'round trip':'one way') + " · " + inr(rt?round:one)` : "No options match".
- `preview` = count of `ALL[mode]` matching **draft** `tOn/tRet` (with current filt/trip); `applyLabel` = "Show N options"/"Show 1 option"/"No options in these slots".
Handlers:
- Trip seg: `setState({trip:id, filt: (id==='oneway' && filt==='mix') ? 'all' : filt})` (pick not reset).
- Mode seg: `setState({mode:id, filt:'all', pick:null})` (time slots NOT reset).
- Filter chip: `setState({filt:id})`.
- Row tap: `setState({pick:o.id})` → row green bg + green price pill + CTA price updates.
- Time chip `openTime`: `setState({timeOpen:true, tOn:on, tRet:ret})` (copy committed → drafts).
- Slot tile toggle: adds/removes slot id in `tOn` or `tRet`.
- `closeTime` (X / backdrop): `timeOpen:false` (drafts discarded).
- `resetTime` ("Clear"): `tOn:[], tRet:[]` (stays open, not applied).
- `applyTime`: `timeOpen:false, on:tOn, ret:tRet, pick:null`.
- `clearAll` (empty state): `filt:'all', on:[], ret:[]`.
No toasts/timers specific to the sheet. Apply button is never disabled even with 0 preview.

Default render (this file): title "BLR ⇄ GOA"; Round trip selected; ✈️ Flight selected; ONWARD "BLR → GOX" · "Any time"; RETURN "GOX → BLR" · "Any time"; chips All(on) · Nonstop · With a stop · Mix airlines · 🕘 Time; "8 options · scroll for more"; f1 selected (green); CTA "Book round trip · ₹7,840".

### Navigation table
| element | target |
|---|---|
| Scrim (`aria-label Close sheet`) | `P-Chat-Travel.dc.html` |
| Sheet X | `P-Chat-Travel.dc.html` |
| Sticky CTA "Book … · ₹…" | `P-Chat-RouteConfirm.dc.html` |
| Time chip | in-file nested sheet (`timeOpen`) — NOT a link to P-Chat-TimeSheet |
| Background CTA "Add my travel details" | `P-Chat-RouteSheet.dc.html` (self) |
| Shell header/chips/share | as shell |

### Data shown (seed values) — exhaustive
Price shown = `round` when Round trip, `one` when One way. `h` = departure hour used for slot filtering.

**Flights** (order as rendered; leg 1 = BLR→GOX Fri 6, leg 2 = GOX→BLR Mon 9):
| id | kind | tag | one | round | onward leg (t · meta · stop · h) | return leg (t · meta · stop · h) |
|---|---|---|---|---|---|---|
| f1 | mix, **roundOnly** | Best timing · mixed airlines | ₹3,960 | ₹7,840 | 8:40 pm → 9:55 pm · IndiGo · nonstop · 1h 15m · h20 | 5:30 pm → 6:40 pm · Air India · nonstop · 1h 10m · h17 |
| f2 | nonstop | Same airline | ₹3,960 | ₹8,060 | 8:40 pm → 9:55 pm · IndiGo · nonstop · 1h 15m · h20 | 4:10 pm → 5:25 pm · IndiGo · nonstop · 1h 15m · h16 |
| f3 | nonstop | Same airline | ₹4,180 | ₹8,450 | 9:20 pm → 10:45 pm · Air India · nonstop · 1h 25m · h21 | 5:30 pm → 6:40 pm · Air India · nonstop · 1h 10m · h17 |
| f6 | nonstop | Morning out · same airline | ₹3,450 | ₹6,900 | 6:05 am → 7:20 am · IndiGo · nonstop · 1h 15m · h6 | 1:05 pm → 2:20 pm · IndiGo · nonstop · 1h 15m · h13 |
| f7 | nonstop | Same airline | ₹3,700 | ₹7,500 | 12:30 pm → 1:45 pm · Air India · nonstop · 1h 15m · h12 | 9:30 pm → 10:45 pm · Air India · nonstop · 1h 15m · h21 |
| f4 | stop | Cheaper · 1 stop going | ₹2,880 | ₹6,840 | 6:50 pm → 11:35 pm · IndiGo · 1 stop · 4h 45m · "Change in Hyderabad · 1h 40m wait" · h18 | 4:10 pm → 5:25 pm · IndiGo · nonstop · 1h 15m · h16 |
| f5 | stop | 1 stop both ways | ₹3,300 | ₹7,200 | 7:15 pm → 11:50 pm · Air India · 1 stop · 4h 35m · "Change in Mumbai · 1h 50m wait" · h19 | 2:00 pm → 6:55 pm · Air India · 1 stop · 4h 55m · "Change in Mumbai · 2h 10m wait" · h14 |
| f8 | stop | Cheapest · overnight stop | ₹2,600 | ₹6,100 | 2:10 am → 7:40 am · IndiGo · 1 stop · 5h 30m · "Change in Hyderabad · 2h wait" · h2 | 10:10 pm → 11:25 pm · IndiGo · nonstop · 1h 15m · h22 |
Carrier tiles: IndiGo logo `7a6cf4a7…` bg #2B399B w40; Air India logo `36d05a72…` bg #FFFFFF w34 + border. f1 is the only mixed-carrier row (IndiGo out, Air India back). No flight numbers shown in list.

**Trains** (no carrier logo → 🚆 tile; legs Fri 6 / Mon 9):
| id | kind | tag | one | round | onward | return |
|---|---|---|---|---|---|---|
| t1 | 3A | AC 3-tier · overnight | ₹1,450 | ₹2,900 | 8:00 pm → 10:05 am +1 · Overnight express · 14h · Madgaon · h20 | 4:15 pm → 6:40 am +1 · Overnight express · 14h 25m · Bengaluru · h16 |
| t2 | 2A | AC 2-tier · overnight | ₹2,080 | ₹4,160 | same as t1 | same as t1 |
| t3 | SL | Sleeper · overnight | ₹560 | ₹1,120 | same as t1 | same as t1 |
| t4 | 3A | AC 3-tier · daytime | ₹1,390 | ₹2,780 | 6:30 am → 8:50 pm · Day train · 14h 20m · Madgaon · h6 | 7:20 am → 9:45 pm · Day train · 14h 25m · Bengaluru · h7 |

**Buses** (🚌 tile):
| id | kind | tag | one | round | onward | return |
|---|---|---|---|---|---|---|
| b1 | sleeper | AC sleeper · Mapusa | ₹1,350 | ₹2,700 | 9:00 pm → 9:30 am +1 · 12h 30m · drops at Mapusa · h21 | 8:30 pm → 8:45 am +1 · 12h 15m · Mapusa to Bengaluru · h20 |
| b2 | sleeper | AC sleeper · Panjim | ₹1,180 | ₹2,360 | 10:30 pm → 10:30 am +1 · 12h · drops at Panjim · h22 | 9:00 pm → 9:15 am +1 · 12h 15m · Panjim to Bengaluru · h21 |
| b3 | seater | AC seater · Panjim | ₹950 | ₹1,900 | 1:00 pm → 1:30 am +1 · 12h 30m · drops at Panjim · h13 | 12:30 pm → 12:45 am +1 · 12h 15m · Panjim to Bengaluru · h12 |
| b4 | sleeper | Non-AC sleeper · Mapusa | ₹850 | ₹1,700 | 7:30 pm → 8:00 am +1 · 12h 30m · drops at Mapusa · h19 | 6:30 pm → 7:00 am +1 · 12h 30m · Mapusa to Bengaluru · h18 |
(Train/bus tags render in neutral #4A5878 since kind ≠ mix/stop.)

**Filters**: flight `All · Nonstop · With a stop · Mix airlines` (Mix hidden one-way); train `All · AC 3-tier · AC 2-tier · Sleeper`; bus `All · Sleeper · Seater`. Counts (round trip, any time): flight All 8 / Nonstop 5 (f1,f2,f3,f6,f7) / With a stop 3 / Mix 1; one-way flight All 7 (f1 hidden) → CTA "Book one way · ₹3,960" (f2). Train 4 (3A 2, 2A 1, SL 1); bus 4 (sleeper 3, seater 1).

**Time slots** `SL`: `s0 🌙 Early morning 12 am – 6 am [0,6)`, `s1 🌅 Morning 6 am – 12 pm [6,12)`, `s2 ☀️ Afternoon 12 pm – 6 pm [12,18)`, `s3 🌆 Evening 6 pm – 12 am [18,24)`.

Static strings: "Only you see these. Go shares just your arrival time with the group.", "Nothing matches these filters", "Clear filters", "Preferred times", "Pick one or more. Go shows trips leaving in them.", "Clear".

**Worked derived-state examples (usable as test cases)**
| state | count line | selected | CTA |
|---|---|---|---|
| round, flight, all, any time (default) | 8 options · scroll for more | f1 | Book round trip · ₹7,840 |
| one way, flight, all | 7 options · scroll for more | f2 | Book one way · ₹3,960 |
| round, flight, Mix airlines | 1 option | f1 | Book round trip · ₹7,840 |
| round, flight, With a stop | 3 options · scroll for more | f4 | Book round trip · ₹6,840 |
| round, flight, on=[Evening] | 5 options · scroll for more | f1 | Book round trip · ₹7,840 (chip "🕘 Time · 1", ONWARD "6 pm – 12 am") |
| round, flight, on=[Morning], ret=[Afternoon] | 1 option | f6 | Book round trip · ₹6,900 (chip "🕘 Time · 2") |
| round, train, all | 4 options · scroll for more | t1 | Book round trip · ₹2,900 |
| round, bus, Seater | 1 option | b3 | Book round trip · ₹1,900 |
| round, bus, on=[Early morning] | empty state | none | "No options match" (disabled grey) |
| one way, flight, on=[Morning,Evening] (Time chip shows "🕘 Time · 2"; ONWARD "2 time slots") | 5 options · scroll for more | f2 | Book one way · ₹3,960 |

### Icons & images
X close SVG 18 stroke 2; padlock SVG 16 in privacy note; stopwatch SVG 12 stroke 2.2 (#A44F3A); airline logos (see table); mode emoji ✈️🚆🚌 in mode seg + tiles; 🕘 in Time chip; slot emoji 🌙🌅☀️🌆 (18px) in time sheet.

---

## P-Chat-TimeSheet.dc.html — "Go — Route sheet, preferred times"

### Purpose (1 line)
F3: Same route sheet as F2 with the nested "Preferred times" sheet open and Evening pre-selected for onward.

### Layout top→bottom
**Byte-identical to P-Chat-RouteSheet.dc.html except 2 lines** (`diff`): `<title>` and the PBase initial state:
`{ trip:'round', mode:'flight', filt:'all', pick:null, timeOpen:true, on:['s3'], ret:[], tOn:['s3'], tRet:[] }`.

Resulting background route sheet (dimmed under time sheet): ONWARD slot text "6 pm – 12 am", RETURN "Any time"; Time chip **on** (black) "🕘 Time · 1"; count "5 options · scroll for more"; rows f1, f2, f3, f4, f5 (f6 h6, f7 h12, f8 h2 excluded); f1 selected; CTA "Book round trip · ₹7,840".

**Preferred-times sheet (open)** — z8 layer:
1. Backdrop `<button aria-label="Close">` inset 0, rgba(11,27,63,0.38).
2. Dialog `role=dialog aria-label="Preferred times"` `.enter`: bottom-anchored, `max-height 760px`, content-height, r `28 28 0 0`, bg #F6F7F9, shadow `0 -8px 30px rgba(11,27,63,.18)`.
   - Grabber margin-top 8, 40×5 #DDE1E6.
   - Scroll body `padding 8px 16px 130px; gap 14`.
   - Header `padding 0 4; space-between gap 12`: left column gap 2 → "Preferred times" 22/600 −0.02em; "Pick one or more. Go shows trips leaving in them." 14 #4A5878. Right: close `<button>` 40×40 r999 bg #FFF shadow `0 1px 3px rgba(0,0,0,.08)` X SVG 18.
   - Section eyebrow `padding 0 4; 11/700 #4A5878 0.08em lh1.35`: "ONWARD · BLR → GOX · FRI 6 NOV".
   - **Time-slot grid** `display grid; 2 columns 1fr 1fr; gap 8`. Each slot `<button aria-pressed>`: `padding 12; r16; flex column; align-items flex-start; gap 2; text-left`; selected `bg #000; #FFF; border 1px #000`; unselected `bg #FFF; #0B1B3F; border 1px #DDE1E6`. Content: emoji 18px, name 15/600, range 13 opacity .75. Order: 🌙 Early morning / 🌅 Morning / ☀️ Afternoon / 🌆 Evening (Evening selected here).
   - If round trip: wrapper column gap 14 → eyebrow "RETURN · GOX → BLR · MON 9 NOV" + same 2×2 grid (none selected).
   - **Sticky footer** abs bottom, `padding 30px 16px 24px; flex gap 8; gradient rgba(246,247,249,0)→#F6F7F9 35%`: "Clear" button `h56; padding 0 22; r999; bg #F2F2F2; 16/600 #0B1B3F`; Apply button `flex 1; h56; r999; bg #000; #FFF; 17/500` label "Show 5 options".

There are **no onward/return tabs** — onward and return are stacked sections in one scroll.

### Sheets / overlays
- Route sheet (z6, top 96) underneath; Preferred times sheet (z8) on top. Close → back to route sheet (state only; same file). Apply → closes and applies. No link to/from other files other than those inherited from RouteSheet.

### State & interactions
Identical logic to RouteSheet (see above). Seeded: committed `on=['s3']` and draft `tOn=['s3']`. Tapping Apply here keeps Evening; toggling e.g. Morning updates `tOn` and the Apply label live (preview count). Clear empties drafts (label becomes "Show 8 options").

### Navigation table
Same as RouteSheet (scrim/X → P-Chat-Travel; Book CTA → P-Chat-RouteConfirm). **No file links to P-Chat-TimeSheet.dc.html** (orphan state artboard; in-prototype the Time chip opens the in-file sheet instead).

### Data shown
As RouteSheet. Visible here: 5 flights f1–f5 (see table), slot grid with Evening on.

### Icons & images
As RouteSheet; slot emoji 🌙🌅☀️🌆 at 18px.

---

## P-Chat-RouteConfirm.dc.html — "Go — Trip chat · Who lands when (all booked) (v2)"

### Purpose (1 line)
F4: After the last member books, Go posts the "Who lands when" card (per-member mode, station, arrival time, booked tick) with a shared-cab suggestion + Book.

### Layout top→bottom
1. Shell header (standard variant).
2. Messages:
   - **Me (outgoing)**: right-aligned; bubble `max-width 80%; padding 10 14; r 20 20 0 20; bg #000; #FFF; shadow`; text 16 "booked mine ✈️ lands 9:55 fri".
   - **Go**: avatar 30; bubble `max-width 72%; padding 8 14 10; r 20 20 20 0; bg #F6EAE6; gap 2`; "Go" 13/600 #A44F3A; "Got it. That’s the last one in 🎉 Here’s when everyone reaches Goa:" 16 pretty.
   - **"Who lands when" card**: `margin-left 38px; margin-right 16px; padding 14px 0 14px; r22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,.08); flex column gap 4; overflow hidden`.
     - Header row `padding 0 16; space-between`: "Who lands when" 18/600 −0.014em; status "Everyone’s booked" 13/600 **#0F7A37** (green).
     - Member list wrapper `padding 0 16`; each member row `padding 10px 0; flex; align center; gap 10`; rows 2–4 `border-top 1px solid #ECEFF3`:
       - avatar 32 round cover;
       - text col (flex 1, gap 1): name 15/600 lh1.3; mode line 13 #4A5878 0.002em lh1.35 = "<emoji> <Mode> · <station>";
       - arrival time 13/600 tabular-nums nowrap;
       - booked badge 24×24 r999 bg #16A34A, white check SVG 13 stroke 4.
     - **Cab suggestion strip**: `margin 2px 16px 0; padding 10px 12px; flex gap 8; r14; bg #F4F5F7; 14px lh1.35`: 🚕 (span 18w, 15px) + "You and Arjun land together. Share a cab?" (flex 1) + **Book** `<a>` `h30; padding 0 14; r999; bg #F6EAE6; #A44F3A; 13/600 −0.004em; nowrap` → `P-Chat-CabSheet.dc.html`.
   - **Arjun incoming**: avatar 30; bubble white "same flight 🤝"; **reaction chip** under bubble `margin -6px 0 0 10px; padding 2px 8px; r999; bg #FFF; border 1px #ECEFF3; 13/600; inline-flex gap 3`: 🙌 (15w,13px) + "2".
   - **Next pill** (`pNext`) "Next · Priya asks when everyone lands" → `P-Chat-Private.dc.html`.
   - `pSent`.
3. Composer.

Not a timeline graphic — a plain list; no separate time axis.

### Sheets / overlays
None besides shell. Cab Book is a link to CabSheet (separate artboard).

### State & interactions
Shell only + `pNext: true`. Rows not tappable; only "Book" and "Next" are links.

### Navigation table
| element | target |
|---|---|
| Cab strip "Book" | `P-Chat-CabSheet.dc.html` |
| "Next · Priya asks when everyone lands" | `P-Chat-Private.dc.html` |
| shell elements | as shell |
Incoming: RouteSheet/TimeSheet Book CTA; CabSheet scrim, X and Book CTA.

### Data shown
- Me: "booked mine ✈️ lands 9:55 fri".
- Go: "Got it. That’s the last one in 🎉 Here’s when everyone reaches Goa:".
- Card: "Who lands when" · "Everyone’s booked".
  | member | avatar | mode · station | lands | state |
  |---|---|---|---|---|
  | You | `c58d972a…` | ✈️ Flight · Mopa | Fri 9:55p | booked ✓ |
  | Arjun | `8c7b7cb2…` | ✈️ Flight · Mopa | Fri 9:55p | booked ✓ |
  | Priya | `234f094a…` | 🚌 Bus · Mapusa | Sat 9:15a | booked ✓ |
  | Rahul | `cb0a34fd…` | 🚆 Train · Thivim | Sat 10:30a | booked ✓ |
- Cab: "You and Arjun land together. Share a cab?" + "Book".
- Arjun: "same flight 🤝" · reaction 🙌 2.
- Next: "Next · Priya asks when everyone lands".
- No member origins (all implicitly from Bengaluru per header chip).

### Icons & images
Check SVG 13 stroke 4 in green 24 badge; emoji ✈️🚌🚆 (mode lines), 🚕, 🎉, 🤝, 🙌; chevron SVG 14 stroke 2.6 in Next pill.

---

## P-Chat-CabSheet.dc.html — "Go — Cab sheet"

### Purpose (1 line)
F5: Bottom sheet over the "Who lands when" chat to book an airport cab to Villa Sol (one way / both rides; All/Sedan/SUV filter; option rows with price; Book CTA).

### Layout top→bottom
**Background chat**: identical to RouteConfirm **minus the "Next" pill** (no `pNext`). Header standard variant.

**Scrim** `<a href="P-Chat-RouteConfirm.dc.html" aria-label="Close sheet">` inset 0, z5, rgba(11,27,63,.38).

**Cab sheet** `role=dialog aria-label="Cab to Villa Sol"` (no `.enter`): `abs left/right/bottom 0; top 110px` (→ 802 tall), z6, flex column, r `28 28 0 0`, bg #F6F7F9, shadow `0 -8px 30px rgba(11,27,63,.18)`.
1. Grabber margin-top 8, 40×5 #DDE1E6.
2. Scroll body `padding 8px 16px 120px; gap 12`:
   a. Header `padding 0 4; gap 2`: "Cab to Villa Sol" 22/600 −0.02em lh1.3 + close `<a>` 40×40 (white, shadow, X 18, margin-right −6) → RouteConfirm; sub 14 #4A5878 "Fri 6 Nov pickup, Mon 9 Nov drop. Book one way or both."
   b. **Trip-type segmented control** (same container as route sheet: `padding 4; gap 4; r999; bg #FFF; border #ECEFF3`); segs `flex 1; h40; r999; 15/600` (no gap prop); selected black/white, else transparent/#4A5878: "One way", "Round trip".
   c. **Leg summary card** (r18 white border #ECEFF3): row "PICKUP · FRI 6 NOV" / "Mopa Airport → Villa Sol" / right "when you land"; if round trip, dashed-top row "DROP · MON 9 NOV" / "Villa Sol → Mopa Airport" / "1:30 pm". (Eyebrow 11/700 0.08em #4A5878; value 16/600; right 13/600 #4A5878.)
   d. **Car filter chips** `role=group aria-label="Filter cars"`; plain `flex gap 6` (no full-bleed scroll); chip style = route chip minus transition: `h40; padding 0 14; r999; 14/600`; on black, off white/#DDE1E6. Labels "All", "🚗 Sedan", "🚙 SUV". (This is the All/Sedan/SUV filter — chips, not a segmented control.)
   e. Count 13/600 #4A5878: "5 options" / "3 options" / "2 options" (no "scroll for more").
   f. **Cab option list card** (r22 white border #ECEFF3 shadow `0 8px 24px rgba(11,27,63,.06)` overflow hidden). Row `<button aria-pressed>`: `width 100%; padding 12px 14px; flex row; align center; gap 10`; bg selected #F0FAF3 else transparent; `border-top 1px #ECEFF3` for i>0.
      - Emoji tile `48×44; r12; bg #F4F5F7; 22px`.
      - Text col (flex 1, gap 1): title 15/600; meta 13 #4A5878 0.002em lh1.35.
      - Price pill `h36; padding 0 12; r999; 14/600 tabular; nowrap`; selected `#16A34A`/white, else `#F2F2F2`/#0B1B3F.
   g. Info note (`r18; bg #FFF6F2; padding 12 14; gap 10`): padlock SVG 16 + "Go tracks your flight and tells the driver if you land late." (reuses privacy-note component + lock icon even though content isn't privacy).
3. **Sticky footer** (`padding 40px 16px 24px; gradient`): CTA `<a href="P-Chat-RouteConfirm.dc.html">` h56 r999 bg #000 white 18/500 — "Book both rides · ₹3,200" (default). No disabled state.

### Sheets / overlays
Cab sheet (always open in this file). Close (scrim/X) and Book both return to RouteConfirm. No nested sheet, no confirmation toast/state.

### State & interactions
`PBase` state: `filt:'all', pick:'s1', trip:'round'`.
Derived: `rt`; `shown = ALL.filter(filt==='all' || k===filt)`; `chosen = shown.find(id===pick) || shown[0]`; price per row `inr(rt ? round : one)`; `count = shown.length + ' options'`; `cta = 'Book ' + (rt ? 'both rides' : 'one way') + ' · ' + inr(rt ? chosen.round : chosen.one)`.
Handlers: trip seg `setState({trip})`; chip `setState({filt})`; row `setState({pick})`. Filtering to SUV moves visual selection to u1 (pick stays 's1' in state) → CTA "Book both rides · ₹4,200".
No seat picker, no per-person split, no headcount — "total" is just the CTA price.

### Navigation table
| element | target |
|---|---|
| Scrim, X | `P-Chat-RouteConfirm.dc.html` |
| CTA "Book both rides · ₹…" / "Book one way · ₹…" | `P-Chat-RouteConfirm.dc.html` |
| Background cab "Book" | `P-Chat-CabSheet.dc.html` (self) |

### Data shown
| id | k | emoji | title | meta | one | round |
|---|---|---|---|---|---|---|
| s1 (default) | sedan | 🚗 | Sedan · app cab | Up to 4 · driver waits 45 min after landing | ₹1,600 | ₹3,200 |
| s2 | sedan | 🚕 | Sedan · airport taxi counter | Prepaid at arrivals · no waiting fee | ₹1,800 | ₹3,600 |
| s3 | sedan | 🏡 | Villa pickup | Villa Sol’s own driver · meets you at the gate | ₹2,000 | ₹4,000 |
| u1 | suv | 🚙 | SUV · app cab | Up to 6 · room for big bags | ₹2,100 | ₹4,200 |
| u2 | suv | 🚕 | SUV · airport taxi counter | Prepaid at arrivals | ₹2,400 | ₹4,800 |
Pickup "Mopa Airport → Villa Sol" "when you land"; Drop "Villa Sol → Mopa Airport" "1:30 pm". Background chat strings = RouteConfirm.

### Icons & images
X SVG 18; padlock SVG 16; car emoji 🚗🚕🏡🚙 (22px tiles); 🚗/🚙 inside chips.

---

## P-Chat-Private.dc.html — "Go — Private answer in group chat"

### Purpose (1 line)
F6: Priya asks the group when everyone lands; you @Go a private question; Go replies publicly with the shared arrival window and drops a blurred "only you can see this" card with "View my details".

### Layout top→bottom
1. Shell header (standard).
2. Messages:
   - **Priya incoming**: avatar Priya 30; white bubble; "Priya" / "what time do we all reach?".
   - **Me outgoing** (max-width 80%, black): @Go mention chip + "when’s my flight and what do i owe?".
   - **Go**: avatar 30; bubble `max-width 76%; padding 8 14 10; bg #F6EAE6; gap 2`; "Go"; text 16 pretty: "Sent you your flight and money details privately 🔒" `<br>` "For everyone: you all land between **9:55 pm Fri** and **10:30 am Sat**." (`<b>` bold).
   - **Private answer card**: `margin-left 38px; margin-right 16px; padding 14px; r22; bg #FFF; border 1.5px dashed #CDD3DC; flex column gap 10` (no shadow).
     - Header row gap 8: 28×28 circle bg #0B1B3F white, padlock SVG 14 stroke 2; label "ONLY YOU CAN SEE THIS" 13/700 0.06em #0B1B3F (flex 1).
     - **Blurred preview** `aria-hidden; flex column gap 8; filter blur(5px); user-select none`: "6E 5313 · Seat 14A · PNR K7QX2M" 15/600; "You owe Rahul ₹12,900" 15/600.
     - CTA `<a>` → `P-Chat-PrivateSheet.dc.html`: `h46; padding 0 18; flex centred gap 8; r999; bg #000; #FFF; 15/500; −0.014em; lh1.3; nowrap`; **eye SVG 18** (almond `M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z` + circle r3, stroke 2) + "View my details".
   - **Rahul incoming**: avatar Rahul 30; "nice, i’ll wait up with beers 🍻".
   - **Next pill** "Next · Go’s final plan" → `P-Chat-Plan.dc.html`.
   - `pSent`.
3. Composer.

### Sheets / overlays
Shell only.

### State & interactions
Shell + `pNext:true`. Card body is non-interactive blurred text; only CTA is tappable.

### Navigation table
| element | target |
|---|---|
| "View my details" | `P-Chat-PrivateSheet.dc.html` |
| "Next · Go’s final plan" | `P-Chat-Plan.dc.html` |
Incoming: RouteConfirm Next pill; PrivateSheet scrim & X.

### Data shown
Priya "what time do we all reach?"; me "@Go when’s my flight and what do i owe?"; Go "Sent you your flight and money details privately 🔒 / For everyone: you all land between 9:55 pm Fri and 10:30 am Sat."; card "ONLY YOU CAN SEE THIS", blurred "6E 5313 · Seat 14A · PNR K7QX2M", "You owe Rahul ₹12,900"; CTA "View my details"; Rahul "nice, i’ll wait up with beers 🍻"; Next "Next · Go’s final plan".

### Icons & images
Padlock SVG 14 (white in navy circle); eye SVG 18 (white); 🔒 🍻 emoji; Go avatar 20 in mention chip.

---

## P-Chat-PrivateSheet.dc.html — "Go — Trip chat · Just-for-me details · no money (v2)"

### Purpose (1 line)
F7: Short "Just for you" sheet revealing your private boarding info (IndiGo 6E 5313 BLR→GOX, seat, boarding, PNR, ticket PDF link) + return flight summary; money removed.

### Layout top→bottom
**Background chat (differs from Private, per diff)**: only ONE message — Go bubble (`max-width 72%`) "Sent you your flight details privately 🔒" (no money mention, no "For everyone…" line). Priya question, my @Go message, private card, Rahul reply and Next pill are all **removed**. Header standard.

**Scrim** `<a href="P-Chat-Private.dc.html" aria-label="Close sheet">` inset 0, z5, rgba(11,27,63,.38).

**Sheet** `role=dialog aria-label="Just for you"` (no `.enter`): `abs left/right/bottom 0; top 479px; height 433px` (half-height), z6, flex column, r `28 28 0 0`, bg #F6F7F9, shadow `0 -8px 30px rgba(11,27,63,.18)`.
1. Grabber margin-top 8, 40×5 #DDE1E6.
2. Scroll body `padding 8px 16px 28px; gap 12` (no sticky footer):
   a. Header `padding 0 4; gap 2`: "Just for you" 22/600 −0.02em lh1.3 + close `<a>` 40×40 (white, shadow, X 18, margin-right −6) → P-Chat-Private; sub 14 #4A5878 −0.004em lh1.4: "🔒 Only you can see this. The group got the summary."
   b. **Boarding-pass card**: `padding 16; r22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,.06); flex column gap 12`:
      - Row space-between: airline badge `h32; padding 0 10; r10; bg #2B399B` containing IndiGo logo `<img alt="IndiGo">` width 56; flight no. "6E 5313" 13/600 #4A5878.
      - Route row (`align flex-end; space-between; gap 8`): left "BLR" 34/700 −0.03em lh1 + "Fri 8:40 pm" 13 #4A5878; centre arrow-right SVG 20 #A5ACB8 `padding-bottom 14`; right (align flex-end) "GOX" 34/700 + "9:55 pm" 13 #4A5878.
      - Detail grid `repeat(3, minmax(0,1fr)); gap 8; padding-top 10; border-top 1.5px dashed #DDE1E6`: labels 11/700 #4A5878 0.08em; values 18/700 → SEAT "14A"; BOARDS "8:05" (tabular); PNR "K7QX2M".
      - **Ticket link** `<a href="P-Ticket-PDF.dc.html">` `h42; padding 0 14; r999; bg #F2F2F2; #0B1B3F; 14/600 −0.004em; gap 6` with document SVG 16 (page + folded corner) + "Open ticket PDF".
   c. **Return row** (not tappable): `padding 12px 14px; gap 12; r22; bg #FFF; shadow 0 1px 2px rgba(11,27,63,.05), 0 6px 18px rgba(11,27,63,.06)` (no border): 🛬 in 40 circle #F4F5F7 (19px) + column: "Return · Mon 9 Nov" 16/600 −0.011em lh1.3; "6E 6142 · GOX 4:10 pm → BLR 5:25 pm" 13 #4A5878.

### Sheets / overlays
Single half sheet; close via scrim/X → P-Chat-Private. No buttons besides ticket link.

### State & interactions
Shell only; **`pNext` removed** from renderVals (no Next pill). No local state.

### Navigation table
| element | target |
|---|---|
| Scrim, X | `P-Chat-Private.dc.html` |
| "Open ticket PDF" | `P-Ticket-PDF.dc.html` (exists) |

### Data shown
Go "Sent you your flight details privately 🔒"; "Just for you"; "🔒 Only you can see this. The group got the summary."; IndiGo · 6E 5313; BLR Fri 8:40 pm → GOX 9:55 pm; SEAT 14A; BOARDS 8:05; PNR K7QX2M; "Open ticket PDF"; "Return · Mon 9 Nov"; "6E 6142 · GOX 4:10 pm → BLR 5:25 pm". (Booked itinerary = route option **f2** "Same airline" IndiGo/IndiGo, not the default-selected f1.) No money / "You owe Rahul ₹12,900".

### Icons & images
IndiGo logo `7a6cf4a7…` w56 on #2B399B; arrow SVG 20 #A5ACB8; document SVG 16; X SVG 18; emoji 🔒 🛬.

---

## P-Chat-Plan.dc.html — "Go — Trip chat plan"

### Purpose (1 line)
F8: You ask @Go to "sort the whole plan"; Go posts the final plan card (sunset hero, wax-seal date stamp, 4-day strip, "Made by Go" + Open) and Rahul reacts.

### Layout top→bottom
1. Shell header (standard; trip-avatar span lacks `overflow:hidden`; markup formatted multi-line but same visuals).
2. Messages:
   - **Me outgoing**: `max-width 70%`; @Go chip + "can you sort the whole plan?".
   - **Go**: avatar 30 (no object-fit); bubble `max-width 64%; padding 8 14 10; r 20 20 20 0; bg #F6EAE6; gap 4`; "Go"; text 16 pretty: "Here's your Goa.<br>Pool villa, scooters,<br>everyone in by Friday night." (straight apostrophe).
   - **Final plan card** wrapper `position relative; margin-left 38px; margin-right 22px`; card `r22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,.08); overflow hidden`:
     - **Hero** `relative; h176; bg #C9D6E2`: img `29f7382b…` cover. Progressive-blur stack (4 `aria-hidden` spans, inset 0, pointer-events none): backdrop-filter blur(2px) mask `linear-gradient(180deg, transparent 52%, #000 68%)`; blur(5px) 62%→78%; blur(9px) 72%→88%; blur(16px) 82%→100%. Tint overlay `linear-gradient(180deg, rgba(11,27,63,0) 45%, rgba(11,27,63,.2) 65%, rgba(11,27,63,.55) 100%)`.
     - **Wax seal SVG** (see Icons) abs `top 4; right 4`, 92×92, `transform rotate(-12deg)`, overflow visible.
     - Hero text block abs `left 16; right 16; bottom 14; column gap 2; #FFF`: "THE PLAN" 11/700 0.08em lh1.35 opacity .9; "📍 Goa" 34/700 −0.025em lh1.05 (emoji span 24w, 24px, gap 4); bottom row space-between align flex-end gap 8 → left column gap 2: "📅 Fri 6 – Mon 9 Nov" and "⏳ in 34 days" (each 14/500 −0.004em lh1.35 nowrap; emoji 18w 14px; gap 6); right avatar stack `padding-left 7`, 4 × 22px, margin-left −8, border 1.5 #FFF (You, Rahul, Priya, Arjun).
     - **Day-by-day strip** `padding 12px 12px 4px; grid repeat(4, minmax(0,1fr)); gap 8`. Each day: column gap 6 → tile `relative; h62; r12; overflow hidden; bg #E9EDF2` img cover + gradient `rgba(0,0,0,0) 30% → rgba(0,0,0,.6) 100%` + label abs `left 8; bottom 6; column gap 2; #FFF; lh1`: "DAY n" 9/700 0.08em opacity .85, weekday 11/700 0.08em; caption below 12 #4A5878 0.01em lh1.3 balance.
     - **Card footer** `padding 12px 12px 14px 14px; gap 8`: Go avatar 22; "Made by Go" 13/500 #4A5878 (flex 1); "Open" `<a>` `h36; padding 0 14; r999; bg #F6EAE6; #A44F3A; 14/600` → `P-Home.dc.html`.
     - **Reaction chip** abs `left 14; bottom -14`; `h26; padding 0 9; gap 4; r999; bg #FFF; border 1px #ECEFF3; shadow 0 2px 6px rgba(11,27,63,.08); 13/700 tabular`: 🔥 (15w) + "4".
   - **Rahul incoming** (`margin-top 26` to clear the chip): bubble `max-width 70%` "GOOO 😭".
   - `pSent`.
3. Composer (Add SVG lacks stroke-linejoin — trivial).

### Sheets / overlays
Shell only. No Next pill.

### State & interactions
Shell only. Card not tappable except "Open".

### Navigation table
| element | target |
|---|---|
| Plan card "Open" | `P-Home.dc.html` |
| shell | as shell |
Incoming: Private "Next" pill + ~20 other screens (P-Home*, P-Board-B, P-Bookings*, P-Checkin-*, P-Money-*, P-Plan-*, P-Map-Detail) — Plan is the de-facto "trip chat" entry point.

### Data shown
- Me "@Go can you sort the whole plan?"; Go "Here's your Goa. / Pool villa, scooters, / everyone in by Friday night."
- Hero: "THE PLAN", "📍 Goa", "📅 Fri 6 – Mon 9 Nov", "⏳ in 34 days"; seal "GOA ✦ INDIA ✦ GOA ✦ INDIA ✦", "NOV", "6–9".
- Days: DAY 1 FRI "Everyone lands" (`8422cba1…`); DAY 2 SAT "Scooters & sunset" (`a76721da…`); DAY 3 SUN "Scuba, then open" (`5e6fdc7c…`); DAY 4 MON "Panjim, then home" (`41377a12…`).
- Footer "Made by Go", "Open"; reaction 🔥 4; Rahul "GOOO 😭".
- **No totals / cost / per-person figures** on the card.

### Icons & images
- **Wax seal SVG** (92×92, viewBox 0 0 92 92): defs — `radialGradient#sealWax` (cx35% cy28% r80%: #F0A184 0 → #D4694E 38% → #A9452E 78% → #7E2E1D 100%); `radialGradient#sealWell` (cx62% cy70% r75%: #D97456 → #BC5539 70% → #9C3D27); `linearGradient#sealText` vertical #FFF4EE → #F6C8B6; `linearGradient#sealRim` diagonal #7E2E1D@.75 → #FFD2C2@.8; `filter#sealShadow` feDropShadow dx1.5 dy4 σ3.2 #2A0E07@.45; `filter#sealSoft` blur σ2.2; `path#sealRing` circle r23.5 about (46,46). Layers: irregular wax blob (quadratic-curve outline ~r37) filled sealWax with shadow; same outline stroked #FFD9CB@.35 w0.8 offset (−0.4,−0.6) (edge highlight); well circle r30 fill sealWell; rim circle r30 stroke sealRim w1.6; debossed ring r17.5 stroke #7E2E1D@.45 w1.2 offset (.4,.6) + r17.5 stroke #FFE3D8@.7 w0.9; ring text "GOA ✦ INDIA ✦ GOA ✦ INDIA ✦" on textPath (Figtree 7px/800, ls1.2, textLength 145) — shadow copy #6E2414@.5 offset (.5,.7) + main fill sealText; centre "NOV" 7px/800 (shadow #6E2414@.55 y43.7, highlight #FFE9E0@.5 y42.6, main sealText y43); "6–9" 13px/800 ls −0.3 (shadow y55.7, highlight y54.6, main y55); specular ellipses white @.28 (33,28 rx14 ry7 rot −30) and @.55 (29,24 rx4 ry2 rot −35), both blurred. Fixed SVG ids → collision risk if two seals render on one page.
- Emoji 📍📅⏳🔥😭; Go avatar 22 & 30; member avatars 22 in hero stack.

---

## Group notes

### Shared element names (proposed component vocabulary)
- **ChatShell** [`ChatScreen` = `ChatHeader` + `FactChipRow` + `MessageList` + `Composer` + `ShareInviteSheet` + sonner `Toaster`] (header + context-chip row + message list + composer + share sheet + toast) — identical across all 8; see §0.
- **GoBubble / MemberBubble / MyBubble** [`GoBubble` / `Bubble author=member` / `Bubble author=me`], **GoMentionChip** [`MentionChip`], **ReactionChip** [`ReactionChip`; `floating` for the card-anchored one] (inline under bubble: 🙌 2; card-anchored: 🔥 4), **NextStoryPill** [`NextStepPill`] (prototype-only navigation affordance, navy).
- **InlineActionCTA** [`GoBubble` `cta`/`caption` → `TravelAskBubble`; `Button variant=primary size=base`] inside a Go bubble (black 44h pill with lock icon + caption) — Travel.
- **ProgressPill** [`ProgressPill` = `SystemPill` + Go avatar 20] (centred white pill with avatar + text) — "Rahul and Priya added theirs".
- **BottomSheet** [`BottomSheet`] (r28 top, bg #F6F7F9, grabber 40×5 #DDE1E6, shadow `0 -8px 30px rgba(11,27,63,.18)`, scrim rgba(11,27,63,.38)) with **SheetHeader** [`SheetHeader`] (22/600 title + 40px white round X + 14px #4A5878 sub) and **StickySheetFooter** [`SheetFooter`] (gradient fade, 56h black pill CTA). Heights: Route top 96, Cab top 110, Private top 479/h433, Times content-height ≤760.
- **SegmentedControl** [`SegmentedControl`]: (a) contained pill variant [`variant=contained`] (white track, black thumb) = trip type in Route & Cab; (b) separated pill variant [`variant=separated`] (white bordered vs black) = mode Flight/Train/Bus.
- **FilterChip** [`Chip size=lg` in `FilterChipRow`] (40h, black on / white-bordered off) incl. a **FilterChip-with-popup** [`TimeChip`] (🕘 Time · N).
- **LegSummaryCard** [`LegSummaryCard`] (eyebrow 11/700 caps + 16/600 value + right meta; dashed divider) — Route (ONWARD/RETURN) & Cab (PICKUP/DROP).
- **OptionRow** [`RouteOptionRow` / `CabOptionRow`] in a **OptionListCard** [`OptionListCard` = `Card variant=float-sm radius=2xl`]: selected = row bg #F0FAF3 + **PricePill** [`Badge variant=price-selected` / `variant=price`] #16A34A; unselected price pill #F2F2F2. Route variant = column with tag + legs (carrier tile 52×30); Cab variant = row with emoji tile 48×44.
- **InfoNote** [`InfoNote`] (#FFF6F2, lock icon) — privacy (route) / flight-tracking (cab).
- **SlotTile** [`Toggle variant=tile` in `TimeSheet`] grid (2×2) + **CountLine** [`countLine()` / `cabCountLine()` in `lib/routes.ts`] ("N options · scroll for more").
- **WhoLandsWhenCard** [`WhoLandsCard` in `InChatCard`] (member row: avatar 32, name, mode·station, time, green tick) + **SuggestionStrip** [`SuggestionStrip`] (#F4F5F7, emoji, text, tinted "Book" pill #F6EAE6/#A44F3A).
- **PrivateTeaserCard** [`PrivateTeaserCard`] (dashed #CDD3DC border, navy lock badge, blurred content, eye CTA).
- **BoardingPassCard** [`BoardingInfoCard` in `PrivateSheet` (+ `ReturnRow`); PLAN's `BoardingPassCard` is the K4 check-in pass] (airline badge, big IATA codes, 3-col dashed detail grid, "Open ticket PDF").
- **PlanCard** [`PlanCard` + `DayStrip` + `ProgressiveBlur`] (hero w/ progressive blur + **WaxSeal** [`WaxSeal`] + day strip + "Made by Go" footer).
- Tinted secondary pill [`Button variant=tint`] (#F6EAE6 bg, #A44F3A text) used for "Book", "Open", "Clear filters".

### Sibling-state collapses
1. **Travel → RouteSheet → TimeSheet = ONE chat screen + ONE route sheet with a nested time sheet.**
   - RouteSheet = Travel chat + route sheet open (state `routeSheetOpen`). Background differs from Travel only in copy ("Add your travel…" vs "Add where you’re coming from…"), missing "Rahul and Priya added theirs" pill, and header row spacing (gap 4/padding 0 8 0 12/h52 vs gap 8/padding 0 12/h60) — treat as drift, use Travel's.
   - TimeSheet = RouteSheet with `timeOpen:true, on:['s3'], tOn:['s3']` (only 2 lines differ). The real prototype opens it in-place from the Time chip; P-Chat-TimeSheet is never linked. Build as nested sheet state, not a route.
2. **RouteConfirm ↔ CabSheet = one chat screen + cab sheet state.** CabSheet = RouteConfirm background minus the Next pill + cab sheet. Close/Book both return to RouteConfirm.
3. **Private ↔ PrivateSheet = one chat screen + "Just for you" half-sheet.** BUT the PrivateSheet background is NOT the Private chat: it shows only a reworded Go bubble ("Sent you your flight details privately 🔒") and drops the money line, teaser card, Priya/Rahul messages and Next pill; title says "no money (v2)". Decide whether the sheet opens over the full Private thread (likely intent) and whether money is in or out of the private payload.
4. Plan stands alone (end of story); Travel/RouteConfirm/Private/Plan are sequential snapshots of the same thread (could be one long seeded conversation).

### Nav graph
```
P-Chat-Travel --CTA--> P-Chat-RouteSheet --(Time chip: in-file nested sheet ≈ P-Chat-TimeSheet)
P-Chat-RouteSheet/TimeSheet --scrim/X--> P-Chat-Travel ; --Book CTA--> P-Chat-RouteConfirm
P-Chat-RouteConfirm --cab Book--> P-Chat-CabSheet --scrim/X/Book--> P-Chat-RouteConfirm
P-Chat-RouteConfirm --Next pill--> P-Chat-Private --View my details--> P-Chat-PrivateSheet --scrim/X--> P-Chat-Private
P-Chat-PrivateSheet --Open ticket PDF--> P-Ticket-PDF
P-Chat-Private --Next pill--> P-Chat-Plan --Open--> P-Home
All: back/identity → P-Home; board/📍📅🏡 → P-Board-B; 💰 → P-Chat-BudgetSheet-Slider; 🛫 → P-Chat-FromSheet; share → P-WA-Compose / P-WA-Pick (MISSING files)
```

### Surprises / ambiguities
- **Brief vs design mismatches**: Travel card has no per-member from-city list or "add my route" (origin only in 🛫 header chip → FromSheet). Time sheet has no onward/return **tabs** (stacked sections). Cab sheet has no seats selector, per-person split or headcount (only "Up to 4/6" in meta; CTA shows total). Private card header uses a **lock** icon (eye only on CTA). Plan card has **no totals** and its CTA "Open" goes to `P-Home.dc.html`, not a trip home.
- **Data inconsistencies**: Who-lands-when says Priya 🚌 Mapusa Sat 9:15a and Rahul 🚆 Thivim Sat 10:30a — no bus option arrives Mapusa 9:15 (b1 9:30 am; b2 lands Panjim 10:30 am) and all trains arrive Madgaon 10:05 am / 8:50 pm. Private copy "land between 9:55 pm Fri and 10:30 am Sat" matches the card, not the route data. Booked ticket (6E 5313 out 8:40→9:55, 6E 6142 back 4:10→5:25) = option **f2**, while RouteSheet default selection is f1 (₹7,840, Air India return).
- "Nonstop" filter includes the mixed-airline f1 (kind 'mix'), so Nonstop=5; f1 is `roundOnly` and disappears in One way, and the Mix chip disappears too.
- Train/bus codes use "GOA" while flights use "GOX"; train/bus have no operator names, numbers or logos (emoji tile only).
- Selection fallback: when the picked option is filtered out, the first visible row silently becomes selected (state `pick` unchanged in Cab; reset to null in Route only on mode change/apply time).
- Time "Apply" stays enabled at 0 results ("No options in these slots"); Route CTA becomes disabled grey "No options match". Mode change keeps time-slot filters.
- Route sheet/Cab sheet/PrivateSheet have no `.enter` animation (static open); nested Time sheet and Share sheet do.
- Cab InfoNote reuses the padlock icon for non-privacy text.
- `P-WA-Compose.dc.html` and `P-WA-Pick.dc.html` don't exist in the prototype folder. `P-Chat-TimeSheet.dc.html` has zero incoming links.
- Wax-seal SVG uses fixed ids (`sealWax`, `sealRing`, …) → must be namespaced per instance in a component.
- Plan.dc.html carries an unused `.knob` toggle style (leftover from another screen).
