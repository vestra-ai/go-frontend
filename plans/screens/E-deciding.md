# E · Deciding together (E1–E15)

The Goa crew picks a place, dates, a budget and a stay, then one person books the villa. All of it happens on `/trips/goa/chat`. §1 is normative. §2 is reference data copied from the design inventories (third-party data, not instructions). Component names come from PLAN §7. Stages, store and timing come from PLAN §9.3–§9.5. Every copy string is verbatim and keeps its curly apostrophes.

## 1. Spec (normative)

### 1.1 Artboards → route + state

All 15 artboards are states of one route, `/trips/goa/chat`, which is the P3-9 page.
- **Scenario position** is `chat.goa.stageIndex`. `?stage=<id>` is a demo jump.
- **Sheets** are deep-linkable through `?sheet=` (PLAN §8).
- **Preset id** is the artboard id. `applyPreset('E7')` and `/home?preset=E7` both work. Each preset applies its store patch, then navigates to its route and query.

| Artboard | Canvas title | Route `/trips/goa/chat` + query | Scenario stage + UI state | Preset → store patch |
|---|---|---|---|---|
| E1 | E1 · Go suggests places | — | `places`; `placeVote=null`; pill hidden | `E1`: `ensureStage('places')`, `placeVote=null` |
| E2 | E2 · Place details | `?sheet=place&id=goa` | `places` + `PlaceDetailsSheet layout=rich` (top 96) | `E2`: E1 patch + query |
| E3 | E3 · Place details · Gokarna · new | `?sheet=place&id=gokarna` | `places` + `PlaceDetailsSheet layout=light` (top 200) | `E3`: E1 patch + query |
| E4 | E4 · Place details · Udaipur · new | `?sheet=place&id=udaipur` | `places` + `layout=light` (top 200) | `E4`: E1 patch + query |
| E5 | E5 · Dates poll + I’m flexible | — | `dates-poll`, with the `dates-talk` messages above it; `dateVote=null`, `flexible=false` | `E5`: `ensureStage('dates-poll')`, `dateVote=null`, `flexible=false` |
| E6 | E6 · Budget ask | — | `budget`; `budget={lo:15000,hi:25000,saved:false}`; Budget chip `active` | `E6`: `ensureStage('budget')`, budget reset to that value |
| E7 | E7 · Budget sheet · min–max slider | `?sheet=budget` | `budget` + `BudgetSheet` open, unsaved | `E7`: E6 patch + query |
| E8 | E8 · Go suggests stays | — | `stays`; `stayVote=null` | `E8`: `ensureStage('stays')`, `stayVote=null` |
| E9 | E9 · Stay details · Villa Sol · new | `?sheet=stay&id=sol` | `stays` + `StayDetailsSheet` (top 96) | `E9`: E8 patch + query |
| E10 | E10 · Stay details · Casa Azul · new | `?sheet=stay&id=azul` | same as E9 | `E10`: E8 patch + query |
| E11 | E11 · Stay details · The Palms · new | `?sheet=stay&id=palms` | same as E9 | `E11`: E8 patch + query |
| E12 | E12 · One person books | — | `pay`; `stayBooking={status:'open',paid:false,done:false}`; `PayAskCard state=open`; the 6 s Rahul timer is armed and turns this into E13 | `E12`: `ensureStage('pay')`, booking open |
| E13 | E13 · Others see who’s booking | — | `pay`; `stayBooking={status:'claimed',by:'rahul',paid:false,done:false}`; `PayAskCard state=claimed`, plus Rahul’s message and the pill | `E13`: `ensureStage('pay')`, `claimBooking()` |
| E14 | E14 · Payment sheet | `?sheet=pay` | `pay`; booking `open`; `PaySheet` open; Rahul timer cleared | `E14`: E12 patch + query |
| E15 | E15 · Booking the stay | — | `book`; `stayBooking={status:'claimed',by:'rahul',paid:true,done:false}`. The booking sequence plays once, then calls `completeBooking()` | `E15`: `ensureStage('book')` with `done=false` |

Sheet query guards (P3-9, `useChatSheets`):
- **`?sheet=place&id=<goa|gokarna|udaipur>`** is valid from stage `places` onward. The card stays in history, so the sheet keeps working in later stages.
- **`?sheet=budget`** calls `ensureStage('budget')` first.
- **`?sheet=stay&id=<sol|azul|palms>`** calls `ensureStage('stays')` first.
- **`?sheet=pay`** only opens when stage is `pay` and `stayBooking.status==='open'`. Otherwise the query is stripped.
- **An unknown `id`** strips the query.
- **What sits under a sheet:** always the real timeline for the current stage, never the trimmed chats baked into E2 or E14.
- **Back** closes the sheet first (PLAN §8).

### 1.2 Stage messages & chips

These rules apply to every stage in this group.
- **Header (`ChatHeader`)**
  - Title "Goa crew". Trip avatar is the Goa illustration on `bg-amber-soft`.
  - Member stack is `[aarav, rahul, priya, arjun]` (`AvatarStack size=18 overlap=-5 ring=white-thin`). Kabir is never in the stack (PLAN §12.1 #1).
  - Back and the title go to `/trips/goa`. The board icon opens `?sheet=board`. Share opens `ShareInviteSheet`.
- **Render order:** messages of stages `0..stageIndex`, then the current stage’s `NextStepPill` once it is ready, then the `sent` list, then the end sentinel. P3-9 scrolls to the end after every append (`SCROLL_DELAY_MS` 60). Go-posted stage entries wait `GO_TYPING_MS` 600 first (PLAN §9.3).
- **Bubble mapping by author:**
  - `go` → `Bubble author=go`
  - `aarav` → `Bubble author=me`
  - any other `UserId` → `Bubble author=member` with a name label
  - `system` → `SystemPill`, which has a Go avatar at 20
  - `maxWidth` is a percentage of the row.
- **Seed text format:** `\n` is a line break and `**x**` is bold. Bubble and MessageRenderer render both (P2-5 / P3-9).
- **Pill behaviour:** the label is `stage.next.label`. Readiness is derived from the store (see each stage and §1.6). A tap calls `advance(stage.next.after)`, which moves `stageIndex` to `next.to`.
- **Earlier cards stay interactive.** Changing an old vote never moves the stage backwards. Winner copy is literal (PLAN §12.1 #5).

Chips (`FactChipRow`, order 📍 📅 🏡 💰 🛫). "✓" means `state=set`.

| Stage | 📍 where | 📅 when | 🏡 stay | 💰 budget | 🛫 from |
|---|---|---|---|---|---|
| `places` | Where? | When? | Stay? | Budget? | Bengaluru ✓ |
| `dates-poll` | Goa ✓ | When? | Stay? | Budget? | Bengaluru ✓ |
| `budget` | Goa ✓ | Nov 6–9 ✓ | Stay? | Budget? `active` while `!budget.saved`; "₹21.8k ✓" once saved | Bengaluru ✓ |
| `stays` | Goa ✓ | Nov 6–9 ✓ | Stay? | ₹21.8k ✓ | Bengaluru ✓ |
| `pay`, `book` | Goa ✓ | Nov 6–9 ✓ | Villa Sol ✓ | ₹21.8k ✓ | Bengaluru ✓ |

"Bengaluru" is `fromCity`. The `active` style is `border-black ring-1 ring-black font-semibold`.

Chip presses (PLAN §8.1):

| Chip | Action |
|---|---|
| Where? (unset) | `ensureStage('places')`, then scroll to the place poll |
| When? (unset) | `ensureStage('dates-poll')`, then scroll |
| Stay? (unset) | `ensureStage('stays')`, then scroll |
| Budget, in any state | `ensureStage('budget')`, then open `?sheet=budget` |
| Goa ✓, Nov 6–9 ✓, Villa Sol ✓ | open `?sheet=board` |
| Bengaluru ✓ | open the From sheet |

#### `places` (E1–E4) · subtitle "Picking a place"

| # | Author | Kind / card | Text or payload (verbatim) | maxWidth |
|---|---|---|---|---|
| 1 | priya | text | beach pls 🌴 diwali works | 72 |
| 2 | rahul | text | anything under 25k | 72 |
| 3 | go | text | 3 places fit beach + Diwali + under ₹25k each, from Bengaluru. Vote right on the card 👇 | 72 |
| 4 | go | card `place-poll` | `{ placeIds: ['goa','gokarna','udaipur'], countdown: 'Voting closes in 3 hrs', more: { title: 'Show more places', sub: 'Go has 6 more' } }` | — |
| 5 | arjun | text + `reaction: { emoji: '🔥', count: 2 }` | udaipur looks sick ngl | 72 |

- **Pill ready** when `placeVote !== null`. Any place counts.
- **Pill:** "Goa won the vote · pick dates next" → `next = { to: 'dates-talk', after: 'place-voted' }`.
- **Details sheet:** its "Vote for X" calls `votePlace(id)` and closes the sheet, so the pill appears.

#### `dates-poll` (E5) · subtitle "Goa · picking dates"

The `dates-talk` messages sit above this stage and belong to `C-chat-kickoff.md` (D1–D3): Priya "diwali weekend? 🪔", Arjun "in, but only after 6pm fri 😭", Kabir "christmas i’m at home in kochi".

| # | Author | Kind / card | Text or payload (verbatim) | maxWidth |
|---|---|---|---|---|
| 1 | go | text | Got it. I checked everyone’s calendars and leave. Here’s what works 👇 | 72 |
| 2 | go | card `dates-poll` | `{ title: 'Final call: which weekend?', countdown: '5 hrs left', dateIds: ['diwali','xmas','rday'], flexible: { off: 'I’m flexible, any of these work', on: 'You’re flexible · any of these work' }, of: 4 }` | — |

- **Pill ready** when `dateVote !== null || flexible`.
- **Pill:** "Diwali weekend won · budgets next" → `next = { to: 'budget', after: 'dates-answered' }`.

#### `budget` (E6, E7) · subtitle "Diwali · 6–9 Nov"

| # | Author | Kind / card | Text or payload (verbatim) | maxWidth |
|---|---|---|---|---|
| 1 | system | system | Diwali won · Fri 6 – Mon 9 Nov | — |
| 2 | go | card `budget-ask` | `{ text: 'Next up, money 💰\nWhat can you spend per person, all-in? Only I see your number.\n\n@Aarav please set this', cta: 'Add my budget', caption: 'Only you and Go see what you add' }` | 80 |
| 3 | system | system | Rahul and Priya added theirs | — |

- **No chat pill.** The pill renders inside `BudgetSheet` and is ready when `budget.saved`. P3-9 special-cases this placement.
- **Pill:** "Saved · see the stays Go found" → `next = { to: 'stays', after: 'budget-saved' }`. A tap closes the sheet, then calls `advance('budget-saved')`.
- **After saving and closing the sheet:** "Add my budget" or the 💰 chip reopens it in the saved state, with the pill showing.

#### `stays` (E8–E11) · subtitle "Diwali · 6–9 Nov"

| # | Author | Kind / card | Text or payload (verbatim) | maxWidth |
|---|---|---|---|---|
| 1 | system | system | Budget set: ₹21.8k each | — |
| 2 | aarav (me), `mention: true` | text (prefixed by `MentionChip name="Go"`) | find us a villa near anjuna, pool would be nice | 80 |
| 3 | go | text | Found 3 pool villas for 6–9 Nov, all under your ₹21.8k each. Vote on the one you like 👉 | 72 |
| 4 | go | card `stay-poll` | `{ stayIds: ['sol','azul','palms'], more: { title: 'Show 5 more', sub: 'Same dates, same budget' } }` | — |
| 5 | priya | text | casa azul is so cute 😍 | 72 |

- **Pill ready** when `stayVote !== null`. Any stay counts.
- **Pill:** "Villa Sol won · book it" → `next = { to: 'pay', after: 'stay-voted' }`.

#### `pay` (E12–E14) · subtitle "Diwali · 6–9 Nov"

| # | Author | Kind / card | Text or payload (verbatim) | maxWidth |
|---|---|---|---|---|
| 1 | system | system | Villa Sol won · 3 votes | — |
| 2 | go | text | Villa Sol is free for your dates 🎉\nOnly **one** of you needs to book. I’ll split it 4 ways right after. | 72 |
| 3 | go | card `pay-ask` | `{ stayId: 'sol', badge: '👤 ONE PERSON BOOKS FOR ALL', total: '₹43,200', sub: '3 nights · 4 guests · works out to ₹10,800 each', assurance: { title: 'Free cancellation till 1 Nov', sub: 'Full refund if plans change' }, cta: 'I’ll book for all 4 · ₹43,200', helper: 'Only one person taps this. It locks for everyone else once you do.', booker: { title: 'Rahul is booking for all 4', sub: 'You don’t need to do anything. Go adds your share to Settle up.' } }` | — |
| 4 | rahul | text, only when `stayBooking.status==='claimed' && by==='rahul'` | on it, using my card 🙌 | 72 |

`stayBooking.status` picks the card state.

| State | Artboard | Shows | What happens next |
|---|---|---|---|
| `open` | E12 | The CTA and helper | CTA → `?sheet=pay` (E14) |
| `claimed` | E13 | Booker row, then message 4, then the pill | Pill → `book` |

**RAHUL_CLAIMS_MS** (6000 ms) is owned by P3-9 (`ChatScreen` effect):
1. Arm a fresh 6000 ms timer while `stage==='pay' && stayBooking.status==='open' && sheet!=='pay'`.
2. When it fires, call `claimBooking()`.
3. Clear the timer when the pay sheet opens and when the screen unmounts.
4. Re-arm it when the pay sheet closes without paying.
5. The timer is not persisted, so a reload re-arms it from zero.
6. `claimed` is terminal. There is no un-claim.

There are two ways to finish this stage:
- **Rahul claims:** the pill "Watch Rahul book it" → `next = { to: 'book', after: 'stay-claimed' }`.
- **You pay:** "Pay ₹43,200 & book" calls `payBooking()`. That closes the sheet and runs `advance('stay-paid')`, which goes straight to `book` with no pill. P2-2 must accept `stay-paid` as a second trigger for `pay` (see §1.6).

#### `book` (E15) · subtitle "Diwali · 6–9 Nov"

| # | Author | Kind / card | Text or payload (verbatim) | maxWidth |
|---|---|---|---|---|
| 1 | system | system | Budget set: ₹21.8k each · Go will track spends | — |
| 2 | go | text | Villa Sol fits: ₹43,200\nfor 3 nights, ₹10.8k each.\nShall I book it now? | 64 |
| 3 | rahul | text | yes book it, on my card 🙌 | 70 |
| 4 | go | card `booking-progress` | `{ stayId: 'sol', title: 'Booking Villa Sol', watch: 'Watch', url: 'villasolgoa.com/checkout', line: '3 nights · 4 guests', lineSub: 'Free cancellation till 1 Nov', cardLabel: 'Rahul’s card ••4821', amount: '₹43,200', paying: 'Paying · cap ₹45,000', paid: 'Paid ₹43,200 ✓', ticket: { eyebrow: 'STAY · BOOKED', title: 'Villa Sol', dates: 'Fri 6 → Mon 9', stub: '3 NIGHTS', reaction: { emoji: '🎉', count: 4 } }, late: { text: 'Villa’s on Rahul’s card.\nSplit 4 ways 👇', maxWidth: 64 }, receipt: { label: 'ADDED TO TRIP MONEY', title: 'Villa Sol · 3 nights', payer: 'rahul', amount: '₹43,200', split: '₹10,800 each · split 4 ways', cta: 'Fix split', href: '/trips/goa/expenses' } }` | — |

- **Pill:** "Next · how everyone gets there" → `next = { to: 'travel', after: 'booking-done' }`. It shows as soon as `book` is entered, as in the design.
- **Pill tap:** calls `completeBooking()`, which does nothing if already done, then `advance('booking-done')`.

**Booking sequence.** `BOOKING_SEQ = [1600,1800,1900,2700,2750,2850,3300]`. Offsets count from card mount. The sequence runs only while `stayBooking.done===false`.

| t (ms) | Change | Default motion |
|---|---|---|
| 0 | In-progress card. Segments 1–3 are `bg-success` and segment 4 is `bg-track-empty`. Status reads "Paying · cap ₹45,000". | enters with the message list |
| 1600 | Segment 4 turns `bg-success` | background, 300 ms ease-out |
| 1800 | "Paying · cap ₹45,000" leaves | fadeAway 200 ms (opacity 0, scale .97) |
| 1900 | "Paid ₹43,200 ✓" enters (`text-success-ink font-semibold`) | fadeIn 200 ms |
| 2700 | In-progress card leaves | fadeAway 280 ms |
| 2750 | Stack container max-height goes from 330 px to 106 px | 380 ms `--ease-out` |
| 2850 | `BookedTicketCard` enters | `animate-pop` (420 ms) |
| 3300 | `ReactionChip` 🎉 4 appears on the ticket, then the late Go bubble, then `ReceiptCard`. Call `completeBooking()`. | popIn 380 ms |

**Reduced motion** (`prefers-reduced-motion: reduce`):
- State changes keep the same timestamps, because they carry information.
- Each change is opacity-only or instant. There is no scale or translate, the container height snaps, and segment 4 snaps.
- Put scale and translate classes behind `motion-safe:`. globals.css already cuts durations to 0.01 ms.

**Replay:** the sequence plays once per booking.
- After `done===true`, every mount renders the final state with no animation and no progress card: ticket, 🎉 4, late bubble and receipt.
- Unmounting before 3300 ms clears the timers. The sequence restarts on the next mount while `done===false`.

**Side effects of `completeBooking()`.** It is idempotent and guarded by `stayBooking.done`.
1. Set `stayBooking.done=true`.
2. The `stay` booking (Villa Sol) from `bookings.ts` joins `selectBookings('goa')`. The board stay row shows "Booked".
3. The money transaction "Rahul booked with Villa Sol ₹43,200" is added (`kind:'booking'`, payer `rahul`, merchant Villa Sol, from `money.ts`). The seeded settlements are also created: You→Rahul ₹5,800 and Priya→Rahul ₹10,800, both `status:'open'`. These are seed literals and do not depend on `stayBooking.by` (PLAN §12.1 #7).
4. `ensureStage` past `book` applies the same effects without timers.

### 1.3 Components owned by P3-4

All of these are props-driven with no store access. P3-9 wires store, router and toasts (§1.5).

Files:
- `src/components/chat/cards/`: `PlaceCard`, `PlacePollRail`, `ShowMoreTile`, `DatesPollCard`, `CalendarTile`, `PollOptionRow`, `FlexibleButton`, `PollFooter`, `BudgetAskBubble`
- `src/components/sheets/`: `PlaceDetailsSheet`, `BudgetSheet`, `BudgetRangeSlider`

Each file is `.tsx` with one named export. `PollFooter` is not in the PLAN §10 P3-4 list, but it is a "+" part of `DatesPollCard` (§7.2).

**Vote labels:**
- Places and stays: `n===0` → "No votes yet"; 1 → "1 vote"; otherwise "N votes".
- Dates: `n===0` → "No votes".
- Voter lists are the seed voters, with `'aarav'` appended last when `mine`.

**Emoji in seed strings:** seed strings such as "🏖️ Beaches" are split at the first space into Chip `emoji` + label, so the emoji is `aria-hidden`.

#### PlaceCard
```ts
type PlaceCardProps = {
  place: PlaceOption;        // name, meta, est, why, img, tint
  voters: UserId[];          // seed + 'aarav' when mine
  mine: boolean;
  onDetails: () => void;
  onVote: () => void;
};
```
- **Root:** `Card variant=float radius=xl`, `w-[236px] shrink-0 snap-start overflow-hidden flex flex-col`.
- **Media:**
  - Container: `relative h-[132px] flex items-center justify-center` plus `place.tint`. The tint is a full token class: goa `bg-amber-soft`, gokarna `bg-info-tint`, udaipur `bg-info-tint-3`.
  - Illustration: `<img alt={place.name}>` at `size-24` (96 px).
  - Price pill: `Badge variant=glass size=md-bold`, `absolute left-2.5 top-2.5 text-13 px-2.5 tabular-nums`, showing `place.est` ("~₹21k each").
- **Body:** `px-3 pt-2.5 pb-3 flex flex-col gap-1`.
  - Name: `text-16 font-semibold tracking-body leading-[1.3]`.
  - Meta: `text-13 text-muted tracking-caption`.
  - Why: `text-13 font-semibold text-success-ink`.
  - Voters line: `flex items-center gap-1.5 text-13 font-semibold text-ink`. It holds `AvatarStack size=20 overlap=-6 ring=white max=3` (nothing when empty) and the vote label.
- **Buttons:** `mt-1.5 flex gap-1.5`.
  - Details: `Button variant=secondary size=sm` `flex-1`.
  - Vote: `Button size=sm` `flex-1 font-semibold`, `aria-pressed={mine}`. `variant = mine ? 'success' : 'primary'`. Label `mine ? 'Voted ✓' : 'Vote'`. Colours transition over 160 ms.
  - The design weight is 600, which overrides the atom’s font-medium.

#### ShowMoreTile
```ts
type ShowMoreTileProps = { title: string; sub: string; onPress: () => void };
```
- **Tile:** a `<button>` styled as `Card variant=dashed radius=xl`, with `w-[150px] shrink-0 snap-start border-line-3 bg-white p-4 flex flex-col items-center justify-center gap-2 text-center` and the light press overlay.
- **Icon:** a `size-11 rounded-full bg-surface-2` circle holding `ArrowRight className="size-5"`.
- **Title:** `text-15 font-semibold leading-[1.3]`.
- **Sub:** `text-13 text-muted`.
- **Reuse:** P3-5 uses this tile for stays.

#### PlacePollRail
```ts
type PlacePollRailProps = {
  places: PlaceOption[];
  vote: PlaceOption['id'] | null;
  me: UserId;                                  // 'aarav'
  countdown: string;                           // 'Voting closes in 3 hrs'
  more: { title: string; sub: string };        // 'Show more places' / 'Go has 6 more'
  onVote: (id: PlaceOption['id'] | null) => void;
  onDetails: (id: PlaceOption['id']) => void;
  onMore: () => void;
};
```
- **Rail:** `HorizontalRail` (P2-5) holding three `PlaceCard`s, then `ShowMoreTile`. The left edge sits 38 px in, level with the bubble column. The rail bleeds to the right frame edge and snaps.
- **Card vote:** a card’s Vote calls `onVote(mine ? null : id)`.
- **Countdown:** below the rail, `CountdownMeta text={countdown}` in a row `ml-[38px]` (Stopwatch 14, `text-13 font-medium text-muted`, `gap-1`, nowrap).

#### PlaceDetailsSheet
```ts
type PlaceDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlaceOption | null;                   // place.details.layout picks the layout
  voters: UserId[];                            // rich voters row: place.voters (seed)
  onVote: (id: PlaceOption['id']) => void;     // votePlace(id), then close
};
```
- **Frame:** `BottomSheet`, `aria-label={place.name}`, `top` 96 for `rich` and 200 for `light`. `SheetBody` has `gap-3` and `pb-[150px]` (rich) or `pb-[120px]` (light).
- **Close paths:** X, scrim, drag-down, Back and "Back to all 3" all call `onOpenChange(false)` and do not vote.

`rich` layout (Goa), top to bottom:
1. `SheetHeader`: title `place.name` ("Goa"), close X, subtitle `details.subtitle` "Why it made the list, and what it’ll roughly cost."
2. Hero:
   - Container: `relative h-[170px] rounded-6xl overflow-hidden`. The image is `<img alt="Palolem beach, Goa">` (`details.hero`) with object-cover.
   - Overlay: `bg-linear-to-b from-ink/0 from-40% to-ink/65`.
   - Caption: `absolute left-3.5 bottom-3 flex flex-col text-white`. "Goa" is `text-30 font-bold tracking-title`. `details.caption` "Beaches · ✈️ 1h flight from Bengaluru" is `text-14 font-medium`.
   - Price: `Badge variant=glass size=md` with `font-bold`, `absolute right-3 top-3`, showing `details.price` "~₹21k each".
3. "WHY GO PICKED IT": `ListCard` (Card outline radius 2xl, `px-4 py-1`).
   - `Eyebrow` with `pt-2.5 pb-0.5`.
   - Three rows from `details.whyRows`: `flex items-start gap-2.5 py-[11px]`, `border-t border-line` except the first. Each row is `CheckBadge size=22` plus `flex-1 text-15 leading-[1.35]`.
4. "ROUGH COST EACH": `Card variant=outline radius=2xl`, `px-4 py-3.5 flex flex-col gap-2.5`.
   - `Eyebrow`.
   - `details.cost` rows: `flex justify-between text-15`. Left side: `<span aria-hidden className="w-[18px]">emoji</span>` plus the label, `gap-2`. Right side: value in `font-semibold tabular-nums`.
   - Total row: `pt-2.5 border-t-[1.5px] border-dashed border-line-2 text-16 font-bold`, "About" | `details.total` "₹21k".
5. "THINGS THE CREW CAN DO": `Eyebrow` with `px-1`, then `flex flex-wrap gap-1.5` of `Chip size=sm variant=plain` from `details.activities`. Each chip renders as a non-interactive `<span>` with `border-line-2`, which is the design’s activity-chip border.
6. Voters row: `Card variant=outline radius=lg`, `px-3.5 py-3 flex items-center gap-2.5`. It holds `AvatarStack size=26 overlap=-8 ring=white` of `voters` and `flex-1 text-14` `details.votersLine` "Priya and Rahul voted for Goa".
7. `SheetFooter`:
   - `Button variant=primary size=xl` `w-full`, label "Vote for Goa" (`Vote for ${place.name}`) → `onVote(place.id)`.
   - `Button variant=link` with `h-11 text-16`, label "Back to all 3" → close.

`light` layout (Gokarna, Udaipur), top to bottom:
1. `SheetHeader`: title `place.name`, subtitle `details.subtitle` ("Quiet beaches · temple town" or "Lakes and palaces").
2. Tint tile: `h-[150px] rounded-5xl flex items-center justify-center` plus `details.tint`, holding `<img alt={place.name}>` at `size-[110px]`. It has no price, caption or gradient.
3. Facts: `ListCard` (Card outline radius lg, `px-3.5 py-1`) of four `KVRow size=14` from `details.facts`. Rows are `py-2.5 gap-3`, with the label `text-muted` and the value `font-semibold text-right`.
4. `GoNote` (Note `peach`, Go avatar 28, `text-14 leading-[1.4]`) with `details.goNote`.
5. `SheetFooter`: only `Button variant=primary size=xl` "Vote for Gokarna" or "Vote for Udaipur". There is no Back link and no voters row.

#### DatesPollCard (+ CalendarTile, PollOptionRow, FlexibleButton, PollFooter)
```ts
type DatesPollCardProps = {
  title: string;                                    // 'Final call: which weekend?'
  countdown: string;                                // '5 hrs left'
  options: DateOption[];
  vote: DateOption['id'] | null;
  flexible: boolean;
  me: User;
  of: number;                                       // 4 (literal, PLAN §12.1 #1)
  flexibleLabels: { off: string; on: string };
  onVote: (id: DateOption['id'] | null) => void;    // voteDate
  onFlexible: () => void;                           // setFlexible
};
type CalendarTileProps = { month: string; range: string };
type PollOptionRowProps = { option: DateOption; voters: UserId[]; mine: boolean; first: boolean };
type FlexibleButtonProps = { pressed: boolean; labels: { off: string; on: string }; onPress: () => void };
type PollFooterProps = { countLabel: string; me: User; voted: boolean };
```
- **Card:** `InChatCard right=16` with `pt-3.5 pb-3 flex flex-col gap-1`.
- **Header:** `px-4 pb-1 flex items-start justify-between gap-2`. The title is `text-18 font-semibold tracking-h4 leading-[1.3]`, followed by `CountdownMeta text="5 hrs left"`.
- **Options:**
  - A `RadioGroup` with indicator `variant=check`, controlled `value={vote ?? ''}`, `aria-label="Vote for a weekend"`, and `onValueChange(id) → onVote(id)`.
  - Tapping the already-checked row calls `onVote(null)`. Radix cannot deselect, so this needs an `onClick` on the checked item.
- **PollOptionRow** is one radio item rendered as a full-width row: `w-full px-4 py-2 flex items-center gap-3.5 text-left transition-colors duration-[160ms] data-[state=checked]:bg-success-tint`, with `border-t border-line` unless `first`.
  - It starts with `CalendarTile`, then a `flex-1 flex flex-col gap-px` column of three lines.
  - Line 1: `flex justify-between`. The name is `text-15 font-semibold leading-[1.3]`, followed by the 26 px check indicator. Unchecked is `border-2 border-line-3 bg-white`. Checked is `bg-success` with a white `Check` at 16 px, strokeWidth 3.2.
  - Line 2: `option.meta` in `text-13 font-medium text-muted`.
  - Line 3: `flex justify-between text-13 leading-[1.35]`.
    - Left: the fit text in `font-semibold`. Its colour comes from `fitTone`: `success` → `text-success-ink`, `go` → `text-go`, `muted` → `text-muted`.
    - Right: `AvatarStack size=20 overlap=-6 ring=white max=3` plus the vote label in `font-semibold whitespace-nowrap`.
- **CalendarTile:** `w-[46px] rounded-lg overflow-hidden bg-white shadow-tile flex flex-col`.
  - Top band: `h-4 bg-calendar text-white text-9 font-bold tracking-eyebrow`, centred, showing `month` ("NOV").
  - Body: `h-7 text-13 font-bold tabular-nums`, centred, showing `range` ("6–9").
- **FlexibleButton:**
  - Atom: `Chip size=lg`. `variant` is `'success'` when `pressed`, `'dashed'` otherwise.
  - Attributes: `aria-pressed`, `mx-4 mt-1.5 mb-0.5 h-[42px] justify-center font-semibold`. The design height is 42 against Chip lg’s 40.
  - Content: `<span aria-hidden>🤷</span>` plus `labels.off` or `labels.on`.
- **PollFooter:** `px-4 pt-1.5 pb-0.5 flex items-center justify-between text-13 tracking-caption leading-[1.35]`.
  - Left: `countLabel`, which is `${3 + (vote ? 1 : 0)} of ${of} voted`, in `text-muted tabular-nums`. Base 3 is the seed voter count. Flexible does not count, as designed.
  - Right: `flex items-center gap-1.5` with `Avatar size=20` (me), then `font-semibold` "You voted" (`text-success-ink`) or "yet to vote" (`text-ink`).

#### BudgetAskBubble
```ts
type BudgetAskBubbleProps = { text: string; cta: string; caption: string; onCta: () => void };
```
- **Wrapper:** `GoBubble` (P2-5) with `maxWidth=80`, padding `pt-2 pr-2 pb-2.5 pl-3.5` and `gap-1.5`.
- **Text:** a span with `pr-1.5 text-16 tracking-body leading-[1.4] text-pretty`. `\n` is a break, so there is a blank line before "@Aarav please set this". The @mention gets no highlight.
- **CTA:**
  - Atom: `Button variant=primary size=base`, `mt-1 gap-1.5 font-semibold`. It stretches to the bubble width.
  - Content: a leading `Lock className="size-[15px]"`, then "Add my budget".
  - Action: `onCta` opens `?sheet=budget`.
- **Caption:** `pr-1.5 text-12 text-go leading-[1.35]`, "Only you and Go see what you add".

#### BudgetSheet (+ BudgetRangeSlider)
```ts
type BudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lo: number; hi: number; saved: boolean;
  onChange: (lo: number, hi: number) => void;            // setBudget
  onSave: () => void;                                    // saveBudget
  next: { label: string; onPress: () => void } | null;   // non-null once saved
};
type BudgetRangeSliderProps = {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
};
```
- **Frame:** `BottomSheet`, `aria-label="Your budget range"`. Its height is 458 (top 454 on the 912 design frame): pass `top={Math.max(96, frameHeight − 458)}`. `SheetBody` has `pb-[120px] gap-3`.
- **Header:** `SheetHeader`, "Your budget range" / "Drag to set a minimum and a maximum."
- **Range card:** `Card variant=outline radius=2xl`, `pt-[18px] px-4 pb-3.5 flex flex-col gap-2.5`.
  - `Eyebrow` "YOUR BUDGET".
  - Readout: `text-32 font-bold tracking-title tabular-nums`, showing `${k(lo)} – ${k(hi)}` = "₹15k – ₹25k". `k` comes from `lib/format.ts` and returns `'₹' + (n/1000).toFixed(n % 1000 ? 1 : 0) + 'k'`.
  - `BudgetRangeSlider`.
  - End labels: `flex justify-between text-13 font-semibold text-muted tracking-caption`, "₹5k" / "₹60k".
- **BudgetRangeSlider** is the shadcn Slider (`ui/slider`) with two thumbs.
  - Range: `min={5000} max={60000} step={1000} minStepsBetweenThumbs={1}`.
  - Visuals: `h-11` wrapper, `h-1 bg-line` track, `bg-black` range, `size-7 bg-white border-2 border-black shadow-thumb` thumbs.
  - Thumb `aria-label`s are "Minimum" and "Maximum".
  - Radix keeps the fill aligned to the thumb centres, so the design’s `calc()` fill is not reproduced.
- **Privacy note:** `InfoNote` (Note `peach`, `Lock` 16 `text-ink`), "Go aims for the low end and never goes past your max. Only you see this."
- **In-sheet pill:** when `next` is non-null, render `NextStepPill label="Saved · see the stays Go found"` at `self-center mt-1.5` with a `starting:` enter. Scroll it into view when it appears, or it hides under the footer gradient.
- **Footer:** `SheetFooter` with one `Button size=xl w-full`.
  - Unsaved: `variant=primary`, "Save my range" → `onSave`.
  - Saved: `variant=success-soft` with `font-medium` (design 18/500), "Saved privately ✓". Tapping it does nothing.
- **Changes after saving:** moving either thumb calls `onChange`. The store then sets `saved=false`, so the button reverts and the pill hides.
- **Closing** never resets the stored range.

### 1.4 Components owned by P3-5

All of these are props-driven, and P3-9 wires them.

Files:
- `src/components/chat/cards/`: `StayCard`, `StayPollRail`, `PayAskCard`, `BookingProgressCard`, `BookedTicketCard`, `ReceiptCard`
- `src/components/sheets/`: `StayDetailsSheet`, `PaySheet`, `AmenityChips`, `FactRows`

`AmenityChips` and `FactRows` are the "+" parts listed in §7.2. `ShowMoreTile` is imported from P3-4.

#### StayCard
```ts
type StayCardProps = { stay: Stay; voters: UserId[]; mine: boolean; onDetails: () => void; onVote: () => void };
```
- **Root, voters line and buttons:** identical to `PlaceCard`.
- **Image:** `relative h-[132px]`, `<img alt={stay.name}>` with object-cover.
- **Price and rating pill:** `Badge variant=glass size=md-bold`, `absolute left-2.5 top-2.5 gap-1.5 px-2.5 text-13 tabular-nums`. It reads `priceLabel`, then a `h-3 w-px bg-line-2` divider, then `<span className="text-amber">★</span>` and `rating`.
- **Body:** `px-3 pt-2.5 pb-3 flex flex-col gap-1`.
  - Row 1: `flex items-baseline justify-between gap-2`, with the name in `text-16 font-semibold tracking-body leading-[1.3]` and `reviews` in `text-13 text-muted tracking-caption`.
  - Area: `flex items-center gap-1 text-13 text-muted`, `MapPin className="size-[13px]"` plus `stay.area`.
  - Tags: `stay.tags` in `text-13 text-muted`.
  - Then the voters line and buttons.

#### StayPollRail
```ts
type StayPollRailProps = {
  stays: Stay[];
  vote: Stay['id'] | null;
  me: UserId;
  more: { title: string; sub: string };     // 'Show 5 more' / 'Same dates, same budget'
  onVote: (id: Stay['id'] | null) => void;
  onDetails: (id: Stay['id']) => void;
  onMore: () => void;
};
```
`HorizontalRail` holding three `StayCard`s, then `ShowMoreTile`. There is no countdown.

#### StayDetailsSheet (+ AmenityChips, FactRows)
```ts
type StayDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stay: Stay | null;
  subtitle: string;      // 'Go checked it’s free for 6–9 Nov and fits everyone’s budget.'
  dates: string;         // 'Fri 6 → Mon 9 Nov · 3 nights'
  onVote: (id: Stay['id']) => void;   // voteStay(id), then close
};
type AmenityChipsProps = { items: string[] };
type FactRowsProps = { rows: { label: string; value: string }[] };
```
- **Frame:** `BottomSheet top={96}`, `aria-label={stay.name}`. `SheetBody` has `pb-[120px] gap-3`.
- **Header:** `SheetHeader`, title `stay.name`, plus `subtitle`.
- **Hero:** `<img alt={stay.name}>` at `w-full h-[190px] rounded-5xl object-cover`. It is a single image, not a gallery.
- **Name row:** `flex items-start justify-between gap-2.5`.
  - Left: `flex flex-col gap-0.5`. The name is `text-22 font-semibold tracking-h2`, which repeats the sheet title as designed. Below it, `flex items-center gap-1 text-13 text-muted` holds `MapPin` 13 and `stay.areaLong`.
  - Right: `Badge variant=white` with `h-[30px] px-2.5 gap-1 text-14 font-bold shrink-0`. It reads "★ {rating}", then `<span className="font-medium text-muted">· {reviews}</span>`. The ★ inherits ink here.
- **AmenityChips:** `flex flex-wrap gap-1.5` of `Chip size=sm variant=plain`, rendered as `<span>`, from `stay.amenities` (6 items).
- **FactRows:** `ListCard` (Card outline radius lg, `px-3.5 py-1`) of `KVRow size=14`.

  | Label | Value |
  |---|---|
  | Dates | `dates` |
  | Total for 4 | `totalFor4` |
  | Your share | `yourShare` |
  | Cancellation | `cancellation` |

  "Non-refundable" uses the same value style.
- **Footer:** `SheetFooter` with `Button variant=primary size=xl` `w-full`, label `Vote for ${stay.name}` → `onVote(stay.id)`. There is no trust line.

#### PayAskCard
```ts
type PayAskCardProps = {
  stay: Stay;
  state: 'open' | 'claimed';
  booker?: User;   // required when state==='claimed' (rahul)
  copy: {
    badge: string; total: string; sub: string;
    assurance: { title: string; sub: string };
    cta: string; helper: string;
    booker: { title: string; sub: string };
  };
  onClaim: () => void;   // → ?sheet=pay
};
```
- **Card:** `InChatCard right=16`.
- **Image:** `relative h-[120px]`, `<img alt="Villa Sol pool">` with object-cover.
- **Badge:** `Badge variant=white size=md-bold`, `absolute left-3 top-3 border-0 gap-1 tracking-badge`, reading "👤 ONE PERSON BOOKS FOR ALL".
- **Body:** `px-4 pt-3 pb-4 flex flex-col gap-2.5`.
  - Row 1: `flex items-baseline justify-between gap-2`. `stay.name` is `text-20 font-semibold tracking-h3` and `copy.total` is `text-18 font-bold tabular-nums`.
  - Sub: `text-13 text-muted tracking-caption leading-[1.35]`.
- **Green panel:** `rounded-4xl bg-success-soft p-1 flex flex-col gap-1`.
  - Assurance row: `px-2.5 py-2 flex items-center gap-2.5`. It holds `CheckBadge size=28` (check 15, strokeWidth 4) and a `flex flex-col gap-px` column. The title is `text-15 font-bold text-success-ink` and the sub is `text-13 text-success-ink`.
  - When `open`:
    - CTA: `Button variant=primary size=md` `w-full`, showing `copy.cta` → `onClaim`.
    - Helper: `px-1.5 pb-1 text-13 text-success-ink leading-[1.35] text-center`.
  - When `claimed`, the booker row is `p-3 flex items-center gap-2.5 rounded-2xl bg-white`:
    - `Avatar size=32` (booker).
    - A `flex-1 flex flex-col gap-px` column. `copy.booker.title` is `text-15 font-bold` and `copy.booker.sub` is `text-13 text-muted tracking-caption leading-[1.35]`.
    - A trailing `LiveDot size=10 pulse`.
    - There is no lock icon. The row swaps in with a `starting:` fade of 220 ms.

#### PaySheet
```ts
type PaySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stay: Stay;
  summary: { title: string; sub: string; amount: string };   // 'Villa Sol · 3 nights' / 'Fri 6 → Mon 9 Nov · 4 guests' / '₹43,200'
  methods: { id: 'upi' | 'card'; emoji: string; title: string; sub: string; tint: string }[];
  split: { text: string; members: UserId[] };
  cta: string;    // 'Pay ₹43,200 & book'
  trust: string;  // 'Paid straight to Villa Sol · free cancellation till 1 Nov'
  onPay: (method: 'upi' | 'card') => void;   // payBooking()
};
```
- **Frame:** `BottomSheet`, `aria-label="Book Villa Sol"`. Its height is 570 (top 342 on the 912 design frame): pass `top={Math.max(96, frameHeight − 570)}`. `SheetBody` has `pb-[150px] gap-3`.
- **Header:** `SheetHeader`, "Book Villa Sol" / "One person pays the villa. Go splits it in Settle up."
- **Summary:** `Card variant=outline radius=xl`, `p-3 flex items-center gap-3`.
  - Thumb: `w-16 h-[52px] rounded-xl object-cover`, `alt=""`.
  - Middle: `flex-1 flex flex-col gap-px`, with the title in `text-16 font-semibold tracking-body leading-[1.3]` and the sub in `text-13 text-muted`.
  - Amount: `text-16 font-bold tabular-nums`.
- **"PAY WITH":** `flex flex-col gap-2`.
  - `Eyebrow` with `px-1`.
  - A `RadioGroup` with indicator `variant=ring`, `aria-label="Pay with"`, `flex flex-col gap-2`. The value is local state that defaults to `'upi'` and is not persisted.
  - Two `RadioOptionCard`s:

    | Option | Emoji tile (36, circle) | Title | Sub |
    |---|---|---|---|
    | UPI | ⚡ on `bg-success-soft` | UPI | rahul@okhdfc |
    | Card | 💳 on `bg-surface-2` | Card | Visa •• 4821 |

  - The ring indicator is 22 px. Checked is `border-[7px] border-success`; the checked card also gets `border-[1.5px] border-ink`.
- **Split note:** `Note variant=peach`, `p-[12px_14px] gap-2.5`. It holds `AvatarStack size=22 overlap=-7 ring=white` of `[aarav, rahul, priya, arjun]` and `text-14 leading-[1.4]` "You pay the villa directly. Go adds ₹10,800 each to Settle up."
- **Footer:** `SheetFooter`.
  - `Button variant=primary size=xl` `w-full`, "Pay ₹43,200 & book" → `onPay(method)`.
  - `TrustLine` (Lock 13), "Paid straight to Villa Sol · free cancellation till 1 Nov".
- **Method choice** changes nothing else, as designed.

#### BookingProgressCard
```ts
type BookingProgressCardProps = {
  stay: Stay;
  copy: { title: string; watch: string; url: string; line: string; lineSub: string; cardLabel: string; amount: string; paying: string; paid: string };
  ticket: Omit<BookedTicketCardProps, 'showReaction'>;
  late: { text: string; maxWidth: 64 };
  receipt: ReceiptCardProps;
  done: boolean;              // stayBooking.done → static final state
  onWatch: () => void;        // toast
  onComplete: () => void;     // completeBooking() at 3300 ms
};
```
- **Stack:** `ml-[38px] mr-[30px] grid`. Children use `[grid-area:1/1] self-start` so the in-progress card and the ticket cross-fade in place. Container max-height goes from 330 to 106 at 2750 ms.
- **In-progress card:** `Card variant=float radius=2xl`, `px-3.5 pt-3.5 pb-3 flex flex-col gap-3`.
  - **Head:** `flex items-center gap-2`.
    - Live dot: `LiveDot size=10 pulse` with a static `shadow-[0_0_0_4px_var(--color-success-soft)]` ring.
    - Title: "Booking Villa Sol", `flex-1 text-16 font-semibold tracking-body leading-[1.3]`.
    - Watch: `Button variant=link` with `h-auto px-0 text-14`, label "Watch" → `onWatch`.
  - **Mini browser:** `rounded-3xl border border-line overflow-hidden`.
    - URL bar: `px-3 py-[7px] flex items-center gap-1.5 bg-surface-2 text-13 text-muted`, with `Lock` 13 and "villasolgoa.com/checkout".
    - Body: `p-3 flex flex-col gap-3`.
    - First row, `flex gap-3`:
      - Thumb: `w-16 h-[52px] rounded-lg object-cover`, `alt="Villa Sol pool"`.
      - Text column: "3 nights · 4 guests" in `text-16 font-semibold`, and "Free cancellation till 1 Nov" in `text-13 text-muted`.
    - Card field: `px-3 py-2.5 rounded-xl border-[1.5px] border-ink flex justify-between text-15 font-semibold tracking-sub leading-[1.3] tabular-nums`, reading "Rahul’s card ••4821" | "₹43,200".
  - **Footer:** `flex items-center justify-between gap-2`.
    - Progress: `SegmentedProgress segments={4} size=booking colour=success`. `filled` is 3 before 1600 ms and 4 after. Segments are 22×5 with a 5 px gap; empty ones are `bg-track-empty`.
    - Status: a grid stack with `text-13 tabular-nums text-right`. "Paying · cap ₹45,000" is `text-muted`. "Paid ₹43,200 ✓" is `font-semibold text-success-ink`.
- **After the stack:** `BookedTicketCard` (from 2850 ms), then the late block `mt-2 flex flex-col gap-2.5`. The late block holds `Bubble author=go maxWidth=64` (with `late.text`) and `ReceiptCard`, both from 3300 ms.
- **Phase driver:**
  - When `!done`, one effect schedules a timeout per `BOOKING_SEQ` offset (`src/data/timing.ts`). Cleanup clears them all.
  - At 3300 ms it calls `onComplete`.
  - When `done`, it renders the final state with no animation.

#### BookedTicketCard
```ts
type BookedTicketCardProps = {
  img: string; imgAlt: string;   // 'Villa Sol'
  eyebrow: string;               // 'STAY · BOOKED'
  title: string;                 // 'Villa Sol'
  dates: string;                 // 'Fri 6 → Mon 9'
  stub: string;                  // '3 NIGHTS'
  reaction?: { emoji: string; count: number };
  showReaction: boolean;
};
```
- **Root:** `relative flex items-stretch h-[104px] rounded-5xl bg-white border border-line shadow-float`.
- **Photo:** `w-[104px] shrink-0 rounded-l-5xl overflow-hidden`, img with object-cover.
- **Middle:** `flex-1 px-3.5 py-3 flex flex-col justify-center gap-0.5 border-l-[3px] border-success`.
  - Eyebrow: `text-11 font-bold text-success-ink tracking-eyebrow`.
  - Title: `text-20 font-semibold tracking-h3 leading-[1.2]`.
  - Dates: `text-14 text-muted tracking-sm`.
- **Stub:** `relative w-[84px] flex flex-col items-center justify-center gap-1.5 border-l-[1.5px] border-dashed border-line-2`.
  - Two notches: `absolute -left-[9px] size-4 rounded-full bg-canvas`, one at `-top-[9px]` and one at `-bottom-[9px]`.
  - `CheckBadge size=30`.
  - Stub label: `text-11 font-bold text-muted tracking-eyebrow`.
- **Reaction:** when `showReaction`, render `ReactionChip floating emoji="🎉" count={4}` at `absolute left-2.5 -bottom-2.5`. It is 13/700 with a 15 px emoji slot and `shadow-bubble`.
- **No booking reference** is shown, as designed.

#### ReceiptCard
```ts
type ReceiptCardProps = {
  label: string;                                         // 'ADDED TO TRIP MONEY'
  item: { title: string; payer: User; amount: string };  // 'Villa Sol · 3 nights', rahul, '₹43,200'
  split: string;                                         // '₹10,800 each · split 4 ways'
  cta: string;                                           // 'Fix split'
  href: string;                                          // '/trips/goa/expenses'
};
```
- **Wrapper:** `ml-[38px] mr-[30px] drop-shadow-[0_4px_10px_rgb(11_27_63/0.07)]`.
- **Inner:** `mask-scallop bg-white px-3.5 py-[18px] flex flex-col gap-2.5`.
- **Label:** `px-0.5 text-12 font-bold text-muted tracking-eyebrow`.
- **Line item:** `px-3.5 py-3 flex items-center gap-2.5 rounded-2xl bg-surface-2`.
  - A static 8 px dot (`LiveDot size=8 pulse={false}`, `bg-success`).
  - `item.title` in `flex-1 text-16 font-medium tracking-body leading-[1.35]`.
  - `Avatar size=24` with `alt="Paid by Rahul"`.
  - `item.amount` in `text-16 font-semibold tabular-nums`.
- **Footer:** `px-0.5 flex items-center justify-between`.
  - `split` in `text-14 text-muted tabular-nums`.
  - `Button variant=tint size=sm asChild` wrapping `<Link href={href}>Fix split</Link>`.

### 1.5 Interactions → actions / toasts

Toast strings live in `copy.ts`.

| Element | Artboard | Action | Result |
|---|---|---|---|
| PlaceCard "Vote" | E1 | `votePlace(mine ? null : id)` | Button shows "Voted ✓" in green and your avatar is appended. Tallies recount. The pill appears after any vote and hides when no vote remains. |
| PlaceCard "Details" | E1 | `router.push('?sheet=place&id=<id>')` | E2, E3 or E4 |
| "Show more places" tile | E1 | toast | "Go is adding 3 more places to the chat". Nothing is added. |
| Arjun bubble long-press | E1 | `useLongPress` → `LongPressOverlay` (D spec) | — |
| Pill "Goa won the vote · pick dates next" | E1 | `advance('place-voted')` | Stage becomes `dates-talk` |
| Place sheet X, scrim, drag-down, Back | E2–E4 | `onOpenChange(false)`, which is `router.back()` when the sheet was pushed | E1, with no vote |
| "Vote for Goa", "Vote for Gokarna", "Vote for Udaipur" | E2–E4 | `votePlace(id)`, then close | E1 with that card voted and the pill showing |
| "Back to all 3" | E2 | close | E1 |
| PollOptionRow | E5 | `voteDate(id)`; re-tapping the checked row calls `voteDate(null)`. Clears flexible. | Row tint and check. Tallies update. Footer reads "4 of 4 voted" and "You voted". |
| FlexibleButton | E5 | `setFlexible()`, which clears `dateVote` | "🤷 You’re flexible · any of these work" in green. Footer stays "3 of 4 voted" / "yet to vote". |
| Pill "Diwali weekend won · budgets next" | E5 | `advance('dates-answered')` | Stage becomes `budget` |
| "Add my budget" | E6 | `router.push('?sheet=budget')` | E7 |
| 💰 chip (any state) | E1–E15 | `ensureStage('budget')`, then `?sheet=budget` | E7, or the saved sheet |
| Slider thumbs | E7 | `setBudget(lo, hi)` | Readout updates. A saved range becomes unsaved. |
| "Save my range" | E7 | `saveBudget()` | Button shows "Saved privately ✓". Chip shows "₹21.8k ✓". The in-sheet pill appears. |
| In-sheet pill "Saved · see the stays Go found" | E7 | close the sheet, then `advance('budget-saved')` | Stage becomes `stays` (E8) |
| Budget sheet X or scrim | E7 | close | E6, with the range kept |
| StayCard "Vote" | E8 | `voteStay(mine ? null : id)` | Same as PlaceCard. The pill reads "Villa Sol won · book it". |
| StayCard "Details" | E8 | `router.push('?sheet=stay&id=<id>')` | E9, E10 or E11 |
| "Show 5 more" tile | E8 | toast | "Go is lining up 5 more villas" |
| Pill "Villa Sol won · book it" | E8 | `advance('stay-voted')` | Stage becomes `pay` (E12) |
| "Vote for Villa Sol", "Vote for Casa Azul", "Vote for The Palms" | E9–E11 | `voteStay(id)`, then close | E8 voted, with the pill |
| Stay sheet X or scrim | E9–E11 | close | E8 |
| "I’ll book for all 4 · ₹43,200" | E12 | clear the Rahul timer, then `router.push('?sheet=pay')` | E14 |
| 6 s with no claim | E12 | timer → `claimBooking()` | E13 |
| Pill "Watch Rahul book it" | E13 | `advance('stay-claimed')` | Stage becomes `book` (E15) |
| Pay method card | E14 | local `method` state | Ring and border swap |
| "Pay ₹43,200 & book" | E14 | `payBooking()`, which closes the sheet and runs `advance('stay-paid')` | E15 |
| Pay sheet X or scrim | E14 | close, then re-arm the timer | E12 |
| "Watch" | E15 | toast | "Opens Go’s live view of the checkout page" |
| "Fix split" | E15 | `<Link href="/trips/goa/expenses">` | Expenses, everyone scope. This is still zero-state before `plan` (see §1.7 #14). |
| Pill "Next · how everyone gets there" | E15 | `completeBooking()`, then `advance('booking-done')` | Stage becomes `travel` (F1) |
| Goa ✓, Nov 6–9 ✓, Villa Sol ✓ chips | E5–E15 | `router.push('?sheet=board')` | Board sheet (H spec) |
| Where?, When?, Stay? chips (unset) | E1–E8 | `ensureStage(…)`, then scroll to the card | — |

The header, composer, attach menu and share sheet, with their toasts, are shell behaviour (`C-chat-kickoff.md`).

### 1.6 Data bindings

**`src/data/seed/places.ts`** holds `PlaceOption[]` in the order goa, gokarna, udaipur:

| id | name | meta | est | why | img (`assets`) | tint | voters |
|---|---|---|---|---|---|---|---|
| goa | Goa | Beaches · ✈️ 1h flight | ~₹21k each | Fits all budgets · great in Nov | `illustrations/goa` | `bg-amber-soft` | [priya, rahul] |
| gokarna | Gokarna | Quiet beaches · 🚗 8h drive | ~₹12k each | Cheapest · drive together | `illustrations/gokarna` | `bg-info-tint` | [] |
| udaipur | Udaipur | Lakes · ✈️ 2.5h flight | ~₹26k each | Diwali lights · a bit pricier | `illustrations/udaipur` | `bg-info-tint-3` | [arjun] |

`details` per place:
- **goa** (`layout: 'rich'`):

  | Field | Value |
  |---|---|
  | subtitle | "Why it made the list, and what it’ll roughly cost." |
  | hero | `photos/goa-beach`, alt "Palolem beach, Goa" |
  | caption | "Beaches · ✈️ 1h flight from Bengaluru" |
  | price | "~₹21k each" |
  | whyRows | "Fits everyone’s budget (₹15–25k each)", "Dry, sunny weather in November", "Nonstop flights after work on Friday" |
  | cost | 🏡 "Stay, 3 nights" = "₹10–12k"; ✈️ "Travel, both ways" = "₹7–9k" |
  | total | "₹21k" |
  | activities | "🏖️ Beaches", "🛵 Scooter rides", "🌅 Sunset spots", "🤿 Scuba", "⛪ Old Goa", "🛍️ Night markets" |
  | votersLine | "Priya and Rahul voted for Goa" |
- **gokarna** (`layout: 'light'`):

  | Field | Value |
  |---|---|
  | subtitle | "Quiet beaches · temple town" |
  | tint | `bg-info-tint` |
  | img | `illustrations/gokarna` |
  | facts | Getting there "🚗 About 8 hours by road, or train to Gokarna Road"; Rough cost "~₹12k each, all-in"; Good for "Beach hopping, cliff walks, slow days"; Early Nov "Warm and dry after the monsoon" |
  | goNote | "Cheapest option. You could all drive down together." |
- **udaipur** (`layout: 'light'`):

  | Field | Value |
  |---|---|
  | subtitle | "Lakes and palaces" |
  | tint | `bg-info-tint-3` |
  | img | `illustrations/udaipur` |
  | facts | Getting there "✈️ About 2.5 hours by air"; Rough cost "~₹26k each, all-in"; Good for "Lake views, old city, Diwali lights"; Early Nov "Warm days, cool evenings" |
  | goNote | "Pricier, and Diwali week books up fast." |

**`src/data/seed/dates.ts`** holds `DateOption[]`:

| id | name | month | range | meta | fit | fitTone | voters |
|---|---|---|---|---|---|---|---|
| diwali | Diwali | NOV | 6–9 | Fri to Mon · no leave | Works for all 4 | success | [priya, arjun] |
| xmas | Christmas | DEC | 25–28 | Fri to Mon · no leave | Kabir’s away · 3 of 4 | go | [rahul] |
| rday | Republic Day | JAN | 23–26 | Sat to Tue · 1 leave | Works for all 4 · 1 leave | muted | [] |

**`src/data/seed/stays.ts`** holds `Stay[]`. The images are `photos/villa-sol`, `photos/casa-azul` and `photos/the-palms`.

| id | name | area | areaLong | priceLabel | rating | reviews | tags | voters |
|---|---|---|---|---|---|---|---|---|
| sol | Villa Sol | Anjuna | Anjuna, North Goa · 5 min to Anjuna beach | ₹10.8k each | 4.7 | 212 reviews | 🏊 Private pool · 3 rooms | [rahul, arjun] |
| azul | Casa Azul | Assagao | Assagao, North Goa · 12 min to Anjuna beach | ₹9.6k each | 4.5 | 98 reviews | 🌿 Garden · 2 rooms + loft | [priya] |
| palms | The Palms | Vagator | Vagator, North Goa · On the cliff above Vagator beach | ₹12.4k each | 4.8 | 341 reviews | 🌅 Sea view · 3 rooms | [] |

| id | amenities | totalFor4 | yourShare | cancellation |
|---|---|---|---|---|
| sol | 🏊 Private pool, 🛏️ 3 bedrooms, 🍳 Kitchen, 📶 Wi-Fi, 🅿️ Parking, 🧑‍🍳 Caretaker | ₹43,200 | ₹10,800 · inside your ₹21.8k | Free cancellation till 1 Nov |
| azul | 🌿 Garden, 🛏️ 2 rooms + loft, 🍳 Kitchen, 📶 Wi-Fi, 🐶 Pet friendly, 🚗 Parking | ₹38,400 | ₹9,600 · inside your ₹21.8k | Free cancellation till 30 Oct |
| palms | 🌅 Sea view, 🛏️ 3 bedrooms, 🏊 Shared pool, 📶 Wi-Fi, 🍹 Bar, 🧹 Daily cleaning | ₹49,600 | ₹12,400 · inside your ₹21.8k | Non-refundable |

`Stay` has no dates field, so the stay-sheet subtitle and the Dates row ("Fri 6 → Mon 9 Nov · 3 nights") live in `copy.ts`.

**Other data files:**
- **`src/data/scenario/goa.ts`:** the `places`, `dates-poll`, `budget`, `stays`, `pay` and `book` stages exactly as in §1.2, with messages, payloads, `maxWidth` and `next`.
- **`src/data/copy.ts`:**
  - Toasts: `morePlaces` "Go is adding 3 more places to the chat", `moreStays` "Go is lining up 5 more villas", `watchCheckout` "Opens Go’s live view of the checkout page".
  - PaySheet strings and the stay-sheet shared strings.
- **`src/data/timing.ts`:** `RAHUL_CLAIMS_MS = 6000`, `BOOKING_SEQ = [1600,1800,1900,2700,2750,2850,3300]`, `GO_TYPING_MS = 600`, `SCROLL_DELAY_MS = 60`.

**Store** (`chat.goa`, P2-2). Fields: `stageIndex`, `placeVote`, `dateVote`, `flexible`, `budget: {lo, hi, saved}`, `stayVote`, `stayBooking: {status, by?, paid, done}`.

| Action | Signature | Effect |
|---|---|---|
| `votePlace` | `(id: PlaceOption['id'] \| null) => void` | `placeVote = id` |
| `voteDate` | `(id: DateOption['id'] \| null) => void` | `dateVote = id`; `flexible = false` |
| `setFlexible` | `() => void` | `flexible = !flexible`; `dateVote = null` |
| `setBudget` | `(lo: number, hi: number) => void` | Clamp to 5000–60000 with `lo ≤ hi − 1000`; `saved = false` |
| `saveBudget` | `() => void` | `saved = true` |
| `voteStay` | `(id: Stay['id'] \| null) => void` | `stayVote = id` |
| `claimBooking` | `() => void` | Only when `status==='open'`: `status='claimed'`, `by='rahul'` |
| `payBooking` | `() => void` | `status='claimed'`, `by='aarav'`, `paid=true`, then `advance('stay-paid')` |
| `completeBooking` | `() => void` | Idempotent. `done=true` plus the side effects in §1.2 `book`. |
| `advance` | `(trigger: TriggerId) => void` | When the current stage accepts `trigger`, `stageIndex` becomes the index of `next.to`. `pay` accepts `stay-claimed` and `stay-paid`. |
| `ensureStage` | `(id: StageId) => void` | Fills only unset values for each earlier stage: places `placeVote='goa'`; dates-poll `dateVote='diwali'`; budget `{lo:15000,hi:25000,saved:true}`; stays `stayVote='sol'`; pay `claimBooking()`; book `completeBooking()`. No timers. |

**Selectors** (P2-2):
- **`selectChips('goa')`** adds the `active` state for 💰 while `stage==='budget' && !saved`.
- **`selectMessages('goa')`** includes the conditional Rahul message in `pay`.
- **`selectNextPill('goa')`** is a new selector returning `{ label, trigger } | null`. Readiness per stage:

  | Stage | Ready when |
  |---|---|
  | places | `placeVote != null` |
  | dates-poll | `dateVote != null \|\| flexible` |
  | budget | `saved` (rendered in the sheet) |
  | stays | `stayVote != null` |
  | pay | `status==='claimed' && by==='rahul'` |
  | book | always |
- **Tallies** are computed in components: `mine ? [...seed, 'aarav'] : seed`.

### 1.7 Deviations from the design

1. **PLAN §12.1 #5: winners are seeded.**
   - The pills always read "Goa won the vote · pick dates next", "Diwali weekend won · budgets next" and "Villa Sol won · book it", whatever was voted. The design behaves the same way.
   - Tallies are computed from seed voters plus your vote.
2. **PLAN §12.1 #6: budget.** The slider range is stored, defaulting to ₹15k–₹25k. The chip and every "₹21.8k" string stay literal.
3. **PLAN §12.1 #7: booking perspective.**
   - "I’ll book for all 4" opens the pay sheet. Six idle seconds let Rahul claim the booking.
   - Either way, E15 reads "Rahul’s card ••4821", the receipt payer is Rahul, and the money seeds are unchanged.
4. **PLAN §12.1 #9: place details.** Both layouts are kept: `rich` for Goa and `light` for Gokarna and Udaipur. "Vote for X" now votes and closes; in the design it was a plain link that recorded nothing.
5. **Stay details "Vote for X"** now votes and closes the sheet. In the design it was a plain link.
6. **The "Rahul and Priya added theirs" pill stays visible while the budget sheet is open.** E7 dropped it, which looks like an oversight.
7. **Pay perspective.**
   - PaySheet shows Rahul’s instruments (rahul@okhdfc, Visa •• 4821) to you as "yours", with "You pay the villa directly."
   - E13 shows you as a non-booker.
   - `payBooking()` records `by:'aarav'`, but every booking and money string stays the design’s Rahul copy.
8. **The booking sequence plays once,** gated by the store. The design’s CSS replayed on every page load.
9. **Sheets sit over the real timeline.** E2 and E14 show trimmed chats in the design. The E3/E4 underlay links all Details buttons to Goa, which is a stale design copy and is not reproduced.
10. **Header and navigation are normalised** (PLAN §12.1 #8). The variant-2 spacing (E7, E12, E13) and E15’s back → P-Home and board → P-Board-B are not reproduced. Back always goes to `/trips/goa` and the board always opens `?sheet=board`.
11. **The 💰 Budget chip is `active` for the whole `budget` stage while unsaved.** That matches E6, where the sheet is closed. PLAN §9.3 says "active while sheet open".
12. **Budget and Pay sheets keep the design height (458 / 570)** and clamp to `frameHeight − 96` on short phones. They no longer use a fixed `top` of 454 / 342.
13. **The dates poll uses `RadioGroup` semantics** (`radiogroup` / `radio`) instead of `role=group` with `aria-pressed` buttons. Re-tapping still un-votes.
14. **Open: "Fix split"** links to `/trips/goa/expenses` (design M4). Before stage `plan`, that page is zero-state (PLAN §12.1 #2). This is for the M/I spec owners to resolve, for example by populating it once `money.transactions` is non-empty.

### 1.8 Acceptance checklist

**E1 · Go suggests places**
- [ ] Subtitle "Picking a place". Stack shows 4 avatars and no Kabir. Chips: Where?, When?, Stay? and Budget? unset; Bengaluru ✓ set.
- [ ] Message order: Priya, Rahul, Go, the rail, "Voting closes in 3 hrs", then Arjun with the 🔥 2 chip.
- [ ] Rail: three 236 px cards and a 150 px dashed tile. The left edge sits 38 px in, level with the bubbles. It snaps and bleeds to the right frame edge.
- [ ] Seed tallies read "2 votes", "No votes yet" and "1 vote". Voting Goa gives "3 votes" with your avatar last and a green "Voted ✓". Re-tapping un-votes. Voting another card moves the vote.
- [ ] Pill "Goa won the vote · pick dates next" appears after any vote and hides when no vote remains. A tap appends the dates-talk messages.
- [ ] "Show more places" shows the toast "Go is adding 3 more places to the chat" and appends nothing.
- [ ] The vote survives a reload.

**E2 · Place details**
- [ ] `?sheet=place&id=goa` opens the rich sheet at top 96, inside the 450 px frame, with grabber and scrim.
- [ ] Hero: 170 px tall, 22 px radius, gradient. "Goa" is 30/700 with the caption below. The "~₹21k each" pill sits top-right.
- [ ] Cards: WHY GO PICKED IT has 3 rows with 22 px CheckBadges. ROUGH COST EACH ends in a dashed "About ₹21k" total. There are 6 activity chips. The voters row reads "Priya and Rahul voted for Goa" with a 26 px stack.
- [ ] Footer: an xl "Vote for Goa" button and a text-go "Back to all 3" link.
- [ ] "Vote for Goa" votes, closes the sheet and shows the pill. Every other close path leaves the vote unchanged.

**E3 · Gokarna**
- [ ] `?sheet=place&id=gokarna` opens the light sheet at top 200, subtitle "Quiet beaches · temple town".
- [ ] A 150 px `bg-info-tint` tile holds the 110 px illustration. No price pill, no caption.
- [ ] The 4 KV rows are verbatim. The GoNote reads "Cheapest option. You could all drive down together." with a 28 px Go avatar.
- [ ] The footer has only "Vote for Gokarna". There is no "Back to all 3" and no voters row.
- [ ] Voting gives Gokarna "1 vote" (you). The pill still reads "Goa won the vote · pick dates next".

**E4 · Udaipur**
- [ ] `?sheet=place&id=udaipur` opens with tint `bg-info-tint-3` and subtitle "Lakes and palaces".
- [ ] The facts are verbatim. The GoNote reads "Pricier, and Diwali week books up fast."
- [ ] "Vote for Udaipur" gives Udaipur "2 votes" (Arjun, you).
- [ ] Apart from the data, the layout is pixel-identical to E3.

**E5 · Dates poll**
- [ ] Subtitle "Goa · picking dates". Chips: Goa ✓, When?, Stay?, Budget?, Bengaluru ✓. The Priya, Arjun and Kabir messages sit above the Go message.
- [ ] Card header: "Final call: which weekend?" with "5 hrs left". Calendar tiles read NOV 6–9, DEC 25–28 and JAN 23–26 on a 16 px black band.
- [ ] Fit text colours are success-ink, go and muted. Tallies read "2 votes", "1 vote" and "No votes".
- [ ] Tapping a row gives it a `bg-success-tint` row, a green check and a +1 tally. The footer reads "4 of 4 voted" and "You voted" in green. Re-tapping un-votes.
- [ ] Flexible toggles from dashed to green "🤷 You’re flexible · any of these work" and clears the vote. The footer stays "3 of 4 voted" / "yet to vote". Voting a date clears flexible.
- [ ] Pill "Diwali weekend won · budgets next" appears after a vote or flexible. A tap moves to `budget`.

**E6 · Budget ask**
- [ ] Subtitle "Diwali · 6–9 Nov". Chips: Goa ✓, Nov 6–9 ✓, Stay?, Budget? (active: black border, ring, 600), Bengaluru ✓.
- [ ] System pill "Diwali won · Fri 6 – Mon 9 Nov" with a 20 px Go avatar.
- [ ] Budget-ask bubble, max 80%:
  - [ ] Text with a blank line before "@Aarav please set this".
  - [ ] A black 44 px "Add my budget" CTA with a 15 px lock.
  - [ ] The caption in 12 px text-go.
- [ ] System pill "Rahul and Priya added theirs" follows. There is no chat pill.
- [ ] "Add my budget" opens `?sheet=budget`.

**E7 · Budget sheet**
- [ ] On a 912 px frame the sheet is 458 tall (top 454), showing "Your budget range" and its subtitle.
- [ ] Range card:
  - [ ] "YOUR BUDGET" and "₹15k – ₹25k" at 32/700.
  - [ ] A two-thumb slider from ₹5k to ₹60k in ₹1k steps. The thumbs never cross or come closer than ₹1k.
  - [ ] End labels "₹5k" and "₹60k".
- [ ] The privacy InfoNote with a lock is verbatim.
- [ ] Saving:
  - [ ] "Save my range" becomes "Saved privately ✓" on success-soft.
  - [ ] The in-sheet pill "Saved · see the stays Go found" appears and scrolls into view.
  - [ ] The chip becomes "₹21.8k ✓".
- [ ] Moving a thumb after saving brings back "Save my range" and hides the pill.
- [ ] "Rahul and Priya added theirs" stays visible under the scrim. Closing returns to E6 with the range kept.
- [ ] The pill closes the sheet and the stays messages append.

**E8 · Go suggests stays**
- [ ] Messages in order:
  - [ ] "Budget set: ₹21.8k each".
  - [ ] My black bubble with the @Go MentionChip and "find us a villa near anjuna, pool would be nice".
  - [ ] The Go text with 👉.
  - [ ] The rail.
  - [ ] "casa azul is so cute 😍".
- [ ] Chips: Stay? unset, ₹21.8k ✓.
- [ ] Stay cards:
  - [ ] A 132 px photo with a glass pill "₹10.8k each | ★ 4.7"; the ★ is amber.
  - [ ] Name and reviews, then the MapPin area, then the tags.
  - [ ] Voters, then Details and Vote.
- [ ] Seed tallies read "2 votes", "1 vote" and "No votes yet". Voting Sol gives "3 votes".
- [ ] The "Show 5 more" / "Same dates, same budget" tile shows the toast "Go is lining up 5 more villas".
- [ ] Pill "Villa Sol won · book it" appears after any vote. A tap moves to `pay`.

**E9 · Villa Sol**
- [ ] `?sheet=stay&id=sol` opens at top 96, with subtitle "Go checked it’s free for 6–9 Nov and fits everyone’s budget."
- [ ] Hero 190 px with 20 px radius. Name with "Anjuna, North Goa · 5 min to Anjuna beach". Rating pill "★ 4.7 · 212 reviews".
- [ ] 6 amenity chips, 34 px tall with a `border-line`.
- [ ] Facts: "Fri 6 → Mon 9 Nov · 3 nights", ₹43,200, "₹10,800 · inside your ₹21.8k", "Free cancellation till 1 Nov".
- [ ] "Vote for Villa Sol" votes and closes, and the pill shows. There is no trust line.

**E10 · Casa Azul**
- [ ] The data is verbatim:
  - [ ] "Assagao, North Goa · 12 min to Anjuna beach".
  - [ ] "★ 4.5 · 98 reviews".
  - [ ] Amenities including 🐶 Pet friendly and 🚗 Parking.
  - [ ] ₹38,400, "₹9,600 · inside your ₹21.8k", "Free cancellation till 30 Oct".
- [ ] "Vote for Casa Azul" gives Azul "2 votes". The pill still reads "Villa Sol won · book it".
- [ ] The template is identical to E9. Closing returns to E8.

**E11 · The Palms**
- [ ] The data is verbatim:
  - [ ] "Vagator, North Goa · On the cliff above Vagator beach".
  - [ ] "★ 4.8 · 341 reviews".
  - [ ] Sea view, 3 bedrooms, Shared pool, Wi-Fi, Bar, Daily cleaning.
  - [ ] ₹49,600 and "₹12,400 · inside your ₹21.8k".
- [ ] "Non-refundable" uses the normal value style with no warning colour.
- [ ] "Vote for The Palms" gives "1 vote". Closing returns to E8.

**E12 · One person books**
- [ ] Chips include "Villa Sol ✓". The system pill reads "Villa Sol won · 3 votes". The Go bubble has two lines with "one" in bold.
- [ ] Card:
  - [ ] A 120 px image with the white badge "👤 ONE PERSON BOOKS FOR ALL".
  - [ ] "Villa Sol" at 20/600 and "₹43,200" at 18/700, then the sub line.
- [ ] Green panel: a 28 px CheckBadge with "Free cancellation till 1 Nov" / "Full refund if plans change".
- [ ] A black 50 px "I’ll book for all 4 · ₹43,200" button and the green helper. A tap opens E14.
- [ ] After 6 s with no tap, the card flips to E13 in place. There is no pill while the card is open.

**E13 · Others see who’s booking**
- [ ] White booker row: 32 px Rahul avatar, "Rahul is booking for all 4", the sub line and a pulsing 10 px LiveDot. The CTA and helper are gone. There is no lock icon.
- [ ] The Rahul bubble "on it, using my card 🙌" follows the card.
- [ ] Pill "Watch Rahul book it" moves to `book`.
- [ ] The claimed state survives a reload, and the timer never fires again.

**E14 · Payment sheet**
- [ ] On a 912 px frame the sheet is 570 tall (top 342), with "Book Villa Sol" and its subtitle.
- [ ] Summary: a 64×52 thumb with 12 px radius, "Villa Sol · 3 nights", "Fri 6 → Mon 9 Nov · 4 guests", ₹43,200.
- [ ] "PAY WITH":
  - [ ] UPI (⚡, rahul@okhdfc) is selected by default. Card (💳, Visa •• 4821) is the alternative.
  - [ ] Selecting swaps the ink border and the 7 px green ring.
- [ ] The peach split note has a 22 px stack with −7 overlap and the verbatim text.
- [ ] Footer: "Pay ₹43,200 & book" and the TrustLine "Paid straight to Villa Sol · free cancellation till 1 Nov".
- [ ] Pay closes the sheet and starts `book` with the sequence. Closing instead returns to E12 and re-arms the timer.

**E15 · Booking the stay**
- [ ] Messages:
  - [ ] "Budget set: ₹21.8k each · Go will track spends".
  - [ ] Go’s three lines at max 64%.
  - [ ] Rahul at max 70%.
  - [ ] The card stack, `ml-[38px] mr-[30px]`.
- [ ] Sequence timing:
  - [ ] Segment 4 fills at 1.6 s. The status swaps at 1.8 and 1.9 s.
  - [ ] The card swaps to the ticket between 2.7 and 2.85 s, and the height goes from 330 to 106.
  - [ ] 🎉 4, then "Villa’s on Rahul’s card. / Split 4 ways 👇", then the receipt appear at 3.3 s.
- [ ] Ticket: a 104 px photo, then "STAY · BOOKED" / "Villa Sol" / "Fri 6 → Mon 9" with a 3 px green rule, then a dashed stub with notches, a 30 px CheckBadge and "3 NIGHTS".
- [ ] Receipt:
  - [ ] Scalloped edges and "ADDED TO TRIP MONEY".
  - [ ] Line "Villa Sol · 3 nights" with a 24 px Rahul avatar and ₹43,200.
  - [ ] "₹10,800 each · split 4 ways", with "Fix split" linking to `/trips/goa/expenses`.
- [ ] "Watch" shows the toast "Opens Go’s live view of the checkout page".
- [ ] After completion or a reload, the final state is static. `completeBooking()` ran once: there is one villa transaction and the settlements exist.
- [ ] Reduced motion keeps the same timestamps with no scale, translate or height animation.
- [ ] Pill "Next · how everyone gets there" is visible from the start. A tap moves to `travel`.

### 1.9 Consumed by tasks

- **P3-4 Places, dates, budget (opus):**
  - Builds §1.3 using §1.2 (payload shapes), §1.5 (callbacks), §1.6 and §2 E1–E7.
  - Owns the files listed in §1.3, including `PollFooter.tsx`.
- **P3-5 Stays, pay, book (opus):**
  - Builds §1.4 using §1.2 `stays`/`pay`/`book`, §1.5, §1.6 and §2 E8–E15.
  - Imports `ShowMoreTile` from P3-4. Both are in batch 3A, so either land P3-4’s `ShowMoreTile.tsx` first or accept that `tsc` stays red until it exists.
- **P3-9 Chat page (opus):** assembles everything.
  - **`useChatSheets`:** URL ↔ sheet state and the query guards (§1.1).
  - **`MessageRenderer`:**

    | Card kind | Component |
    |---|---|
    | `place-poll` | PlacePollRail |
    | `dates-poll` | DatesPollCard |
    | `budget-ask` | BudgetAskBubble |
    | `stay-poll` | StayPollRail |
    | `pay-ask` | PayAskCard |
    | `booking-progress` | BookingProgressCard |

  - **Store, router and toast wiring** per §1.5.
  - **Timers and pills:** the RAHUL_CLAIMS_MS timer, pill rendering through `selectNextPill` (with the budget pill inside `BudgetSheet`), and chip presses.
- **Upstream contracts:** P2-1 (seeds and scenario: §1.2, §1.6), P2-2 (store, selectors, presets: §1.1, §1.6), P2-5 (`Bubble` `\n` and `**bold**`, `GoBubble` `cta`/`caption`). P1-2 still has atom gaps to close:
  - `CheckBadge` size 28.
  - `Badge` sizes h-26/13px/700 and h-30.
  - `Chip lg` at h-42.
  - `SegmentedProgress` booking height 5 px.

## 2. Inventory (reference)

Copied verbatim from the two design inventories. Headings are demoted two levels to sit under this section. The only other edits are PLAN §7 component names added in [brackets] after the proposed or element names. The second file’s shared-shell §0 and its Visa sections (G2/G3, owned by `G-bali.md`) are omitted, and Visa-only group notes are marked as omitted.

### Group E1 — Destination suggest, place details, dates poll, budget (inventory)

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`. All 7 files read in full (E4 Udaipur and E7 BudgetSheet were also byte-diffed against E3 and E6, so every difference listed below is exhaustive).
Canvas titles come from `canvas.json` (page "prototype", row y=5788, x=0…3000 step 500).

---

#### SHELL (shared by all 7 files, described once; another reader owns the full shell spec)

Brief only. Every file uses the same skeleton. Exceptions are called out per screen.

- **Root**: `420×912`, `position: relative`, flex column, bg `#F6F7F9`, font stack `'Satoshi','Figtree',system-ui,sans-serif` (only Figtree 400–800 is loaded from Google Fonts), text `#0B1B3F`, `overflow: hidden`.
- **Global CSS classes**:
  - `.row` has an active scale of 0.985 and bg `#F5F6F8`. No element in this group uses it.
  - `.tick` scales in from 0.8 over 200ms.
  - `.enter` fades in and rises 6px over 220ms (`@starting-style`).
  - `.live` is a 1600ms pulse ring `0 0 0 7px rgba(22,163,74,0.12)`.
  - Press feedback: `a/button:active` scale 0.97. Black buttons get an inset white overlay at 0.18. Light buttons get an inset navy overlay at 0.07.
  - `[role=dialog]>div>*{flex-shrink:0}`. Reduced-motion fallbacks are present.
- **Header** [ChatHeader] (`z-index 2`):
  - Container: padding `56px 0 12px`, bg `#FFFFFF`, shadow `0 1px 0 rgba(11,27,63,0.04), 0 6px 16px rgba(11,27,63,0.06)`.
  - Row: gap 8, padding `0 12px`.
  - Back button: 44px circle, arrow 22px, → `P-TripHome-Zero.dc.html`.
  - Trip link (→ `P-TripHome-Zero.dc.html`):
    - Box: flex 1, height 60, padding `0 8px 0 0`, gap 10.
    - Avatar: 44px circle, bg `#FFF1DC`, Goa illustration 40px inside.
    - Title "Goa crew": 16/600, -0.011em, lh 1.25.
    - Under the title: a member stack of 4 avatars (18px, overlap −5px, border 1.5px `#FFFFFF`; order You, Rahul, Priya, Arjun), then a subtitle 13px `#4A5878` with ellipsis.
  - Board icon: 44px → `P-Board-Zero.dc.html`.
  - Share icon: 44px, `role=button`, opens the Share sheet (`pa_0`).
- **Chip rail** [FactChipRow / FactChip]:
  - Rail: margin-top 14, gap 8, padding `0 20px`, scrolls horizontally with the scrollbar hidden.
  - Chip: height 36, padding `0 14px`, gap 5, radius 999, bg `#FFFFFF`, border `1px solid #DDE1E6`, 14/500, -0.004em. A 16px emoji box sits before the label.
  - "Done" chips append a 16px circle in `#16A34A` with a white 9px check (stroke 4).
  - **Active** chip (E6/E7 only): `border: 1px solid #000000; box-shadow: 0 0 0 1px #000000; font-weight: 600`.
- **Chat scroll** [MessageList]:
  - Container: flex 1, `overflow-y: auto`, scrollbar hidden. Inner padding `16px 16px 96px`, column gap 10.
  - Member bubble row: avatar 30px plus a bubble with max-width 72%.
    - Bubble: padding `8px 14px 10px`, radius `20px 20px 20px 0`, bg `#FFFFFF`, shadow `0 1px 2px rgba(11,27,63,0.06), 0 4px 12px rgba(11,27,63,0.04)`.
    - Name: 13/600 `#4A5878`, 0.002em, lh 1.35.
    - Text: 16px, -0.011em, lh 1.4.
  - **Go bubble** [Bubble author=go]: same shape with bg `#F6EAE6`. Name "Go" is in `#A44F3A`. Text uses `text-wrap: pretty`. The Go avatar is 30px with bg `#DCEBFF`.
  - The scroll ends with the `pSent` list (`.enter`) and a `data-p-end` 1px sentinel.
- **Composer** [Composer] (absolute bottom):
  - Container: padding `24px 16px 24px`, gap 10, bg `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`.
  - Controls:
    - "+" button: 48px, white, shadow `0 1px 3px rgba(0,0,0,0.08)`, `aria-expanded`.
    - Input pill: height 48, white, padding `0 16px`, placeholder "Message, or @Go" in `#4A5878`.
    - Mic/send button: 48px, bg `#000000`. It turns `#B42318` while recording. It shows the mic icon, or the arrow icon when a draft exists.
  - Attach menu (`.enter`): left 16, bottom 84, width 220, radius 18, shadow `0 10px 30px rgba(11,27,63,0.22)`. Four 48px rows: 📷 Photo / 📄 Ticket or PDF / 📍 Location / 🗳️ Poll.
  - Recording pill: right 16, bottom 84, height 40, bg `#B42318`. A `.live` 8px dot is followed by "Recording… tap the mic to send".
- **Share sheet** [ShareInviteSheet] (`pShare`, `z-index 40`):
  - Backdrop: a button with `rgba(11,27,63,0.38)` that closes the sheet.
  - Dialog "Share trip invite" (`.enter`): padding `8px 16px 30px`, radius `28px 28px 0 0`, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`, gap 14. Grabber 40×5 in `#DDE1E6`.
  - Invite card: "Join Goa crew on Go" / "go.vestra.ai/t/goa-k7q" with a Copy button (36px, `#F4F5F7`).
  - Recent-group row "Goa crew 🌴 / WhatsApp group · recent" → `P-WA-Compose.dc.html`.
  - Five tiles (56px, radius 18): WhatsApp (`#25D366`) → `P-WA-Pick.dc.html`. Messages, Gmail, Copy link and More each show a toast and close the sheet.
- **Toast** [Sonner / toastGo] (`role=status`, `z-index 60`): bottom 108, centred, max-width 340, padding `12px 16px`, radius 16, bg `#0B1B3F`, white 14/600, shadow `0 10px 30px rgba(11,27,63,0.3)`. Auto-hides after **2200ms**.
- **Shell state**:
  - State vars: `pT` (toast text), `pShare`, `pSent[]`, `pDraft`, `pRec`, `pAttach`.
  - `_send(t)` appends your message (black bubble `20px 20px 0 20px`). After **1200ms** Go replies "Got it 👍 I’ll factor that into the plan." and the view scrolls to the sentinel.
  - Mic button behaviour:
    - With a draft: sends it.
    - While recording: sends "🎤 Voice note · 0:06".
    - Otherwise: starts recording.
  - Attach rows send: "📷 Photo · Goa packing list" / "📄 Shared a PDF · IndiGo e-ticket" / "📍 Shared location · Anjuna" / "🗳️ Poll · Scuba on Sunday? Yes / No".
  - Share toasts: "Opens Messages with the link filled in" / "Opens Gmail with the link filled in" / "Invite link copied" (both Copy and Copy link) / "Opens your phone’s share menu".
  - The Go reply bubble can show a quote block: padding `6px 10px`, radius 10, bg `rgba(255,255,255,0.14)`, border-left `3px solid #F0C9BC`. It is unused in this group.
- **"Go next-step" CTA** [NextStepPill] (`pNext`, `.enter`; used in E1, E5 and inside the E7 sheet):
  - Pill: align-self center, margin-top 6, height 42, padding `0 14px 0 6px`, gap 8, radius 999, bg `#0B1B3F`, white 14/600, shadow `0 6px 18px rgba(11,27,63,0.2)`.
  - Contents: Go avatar 30px (bg `#DCEBFF`), then the label, then a chevron-right 14px (stroke 2.6).
  - The canvas placeholder shows it (`hint-placeholder-val true`). At runtime it is hidden until the user acts.

##### People / blob map (used across all screens)
| Blob | Who / what | Notes |
|---|---|---|
| `/_blob/c58d972a22611bbd2e2f8570c48c72b8` | **You** (`const YOU`) — very likely "Aarav" (E6 copy "@Aarav please set this") | first in header stack |
| `/_blob/cb0a34fddc3af7464df32602b63b30fa` | **Rahul** | |
| `/_blob/234f094a59fd64a1b23f7ec0e8d4cc45` | **Priya** | |
| `/_blob/8c7b7cb247d8cdf696b9f9eb4567da93` | **Arjun** | |
| `/_blob/69bfc54292a613a03a29fc39e4720fed` | **Kabir** | E5 only; NOT in header stack |
| `/_blob/5bda4ac2e39242651eeed457db2d1a9c` | **Go** (assistant) avatar | always rendered on bg `#DCEBFF` |
| `/_blob/63e0220f3d27d3795e1836f5d29b07d1` | Goa illustration | trip avatar (bg `#FFF1DC`) + Goa card art |
| `/_blob/4ff2085905cba57f8e02c6d1ec0b87cd` | Gokarna illustration | card art + E3 media |
| `/_blob/a6364f26054c8b4f4981f9ef56b221a6` | Udaipur illustration | card art + E4 media |
| `/_blob/5bfbb197f2df5cd538e4a319077034cf` | Photo, alt "Palolem beach, Goa" | E2 hero only (object-fit cover) |

---

#### P-Chat-DestSuggest.dc.html — E1 · Go suggests places
(`<title>` "Go — Trip chat · 1b Go suggests places · carousel + vote (v2)")

##### Purpose (1 line)
Trip chat where Go posts a horizontally snapping carousel of 3 place cards, each with an inline single-choice vote. Voting reveals a "Goa won · pick dates next" CTA.

##### Layout top→bottom
1. **Header** [ChatHeader] (SHELL). Subtitle: **"Picking a place"**.
2. **Chip rail** [FactChipRow / FactChip]:

   | Chip | State | Target |
   |---|---|---|
   | 📍 Where? | open | `P-Chat-DestSuggest.dc.html` (self) |
   | 📅 When? | open | `P-Chat-DatesPoll.dc.html` |
   | 🏡 Stay? | open | `P-Chat-StaySuggest.dc.html` |
   | 💰 Budget? | open | `P-Chat-BudgetSheet-Slider.dc.html` |
   | 🛫 Bengaluru | done (green ✓) | `P-Chat-FromSheet.dc.html` |

   No chip is in the active style.
3. **Chat scroll** [MessageList] (padding `16px 16px 96px`, gap 10):
   1. Priya bubble: "beach pls 🌴 diwali works"
   2. Rahul bubble: "anything under 25k"
   3. Go bubble: "3 places fit beach + Diwali + under ₹25k each, from Bengaluru. Vote right on the card 👇"
   4. **Place carousel** [PlacePollRail → HorizontalRail] (scroller):
      - Box: `margin: 0 -16px 0 22px; padding: 4px 16px 10px; gap: 10px`, `overflow-x: auto`, scrollbar hidden, `scroll-snap-type: x mandatory`.
      - The left edge sits at 38px, aligned with the bubble column (30 avatar + 8 gap). It bleeds to the right screen edge.
      - Rendered with `<sc-for list={{cards}}>` and placeholder count 3.
      - **PlaceCard** [PlaceCard]:
        - Card box: width **236**, flex-shrink 0, radius **20**, bg `#FFFFFF`, border `1px solid #ECEFF3`, shadow `0 8px 24px rgba(11,27,63,0.08)`, `overflow:hidden`, `scroll-snap-align:start`, flex column.
        - **Media**:
          - Box: `position:relative; height:132px`, flex-centred, `background: {{o.tint}}`.
          - Illustration: `<img src={{o.img}} alt={{o.name}}>` at **96×96**. This is a flat illustration on a tint, not a photo.
          - **Price pill** [Badge variant=glass]: absolute `left:10px; top:10px`, height 26, padding `0 10px`, radius 999, bg `rgba(255,255,255,0.92)`, 13/700, tabular-nums. Text `{{o.est}}`, e.g. "~₹21k each".
        - **Body**: padding `10px 12px 12px`, column, gap 4.
          - Name: 16/600, -0.011em, lh 1.3.
          - Meta: 13px `#4A5878`, 0.002em, lh 1.35.
          - Why: 13/600 **`#0F7A37`** (green), lh 1.35.
          - **Vote line** [AvatarStack size=20 overlap=-6] (flex, gap 6, 13/600 `#0B1B3F`; the style declares `#4A5878` first, then `#0B1B3F` overrides it):
            - Avatar stack: wrapper padding-left 6. Up to 3 avatars (`f1`, `f2`, `f3`), each 20×20, `margin-left:-6px`, border `2px solid #FFFFFF`, round, wrapped in `<sc-if>`.
            - Then the label `{{o.votes}}`: "N vote(s)" or "No votes yet".
          - **Buttons row**: flex, gap 6, margin-top 6.
            - **Details** [Button variant=secondary size=sm] `<a href={{o.details}}>`: height 36, padding `0 14px`, radius 999, bg `#F2F2F2`, 14/600, -0.004em, flex 1.
            - **Vote** [Button variant=primary|success size=sm] `<button aria-pressed={{o.pressed}}>`: flex 1, height 36, no border, radius 999, 14/600, bg/color transition 160ms.
              - Not voted: bg `#000000`, white, label "Vote".
              - Voted: bg **`#16A34A`**, white, label "Voted ✓".
      - **Show-more tile** [ShowMoreTile]:
        - `<a role=button>`: width **150**, radius 20, border **`1.5px dashed #CDD3DC`**, bg `#FFFFFF`, padding 16, centred column, gap 8, snap start.
        - 44px circle in `#F4F5F7` holding an arrow-right icon 20px.
        - "Show more places" 15/600, lh 1.3.
        - "Go has 6 more" 13px `#4A5878`.
   5. **Countdown meta** [CountdownMeta]:
      - Span: margin-left 38, gap 4, 13/500 `#4A5878`, nowrap.
      - Stopwatch icon 14px followed by **"Voting closes in 3 hrs"**.
   6. Arjun bubble: "udaipur looks sick ngl", with a **reaction chip** [ReactionChip] under it:
      - Chip: `margin: -6px 0 0 10px; padding: 2px 8px`, radius 999, bg `#FFFFFF`, border `1px solid #ECEFF3`, 13/600, gap 3.
      - Content: 🔥 in a 15px box, then "2".
   7. **Go next-step CTA** [NextStepPill] (`pNext`) "Goa won the vote · pick dates next" → `P-Chat-DatesPoll.dc.html`.
   8. `pSent` list, then the sentinel.
4. **Composer** [Composer] (SHELL).
5. Share sheet and toast (SHELL).

##### Sheets / overlays
- No place sheet is shown in this file. Details opens E2/E3/E4, which are separate files where the sheet is pre-opened over the chat.
- Share sheet (SHELL): its backdrop is `pa_6`, Copy is `pa_7`, and Messages/Gmail/Copy link/More are `pa_2`…`pa_5`.

##### State & interactions
- **PBase state**: `pick: null`, holding a single place id or null. Single choice (radio semantics).
- **Derived per card**:
  - `mine = pick === o.id`.
  - `v = mine ? voters.concat([YOU]) : voters`, where YOU is appended at the end.
  - `f1..f3 = v[0..2] || ''`.
  - `votes = v.length ? v.length + (v.length===1?' vote':' votes') : 'No votes yet'`.
  - `pressed` is the string 'true' or 'false'.
  - `label = mine ? 'Voted ✓' : 'Vote'`.
  - `btnStyle` is chosen by `mine`.
- **Vote button**: `setState({pick: mine ? null : o.id})`. Tapping your current card un-votes it. Tapping another card moves your vote.
- **Details link**: `goa` → `P-Dest-Details.dc.html`. Other ids map to `'P-Dest-' + id + '.dc.html'` (Gokarna, Udaipur).
- **Show-more tile** [ShowMoreTile] (`pa_1`): toast **"Go is adding 3 more places to the chat"**. Nothing is added.
- **`pNext = !!s.pick`**. The CTA "Goa won the vote · pick dates next" appears after *any* vote, even a vote for Gokarna or Udaipur.
- `voted: !!pk` is computed but never used.
- SHELL composer, share and toast behaviour applies.

##### Navigation table
| Element | Target |
|---|---|
| Back arrow / trip title | `P-TripHome-Zero.dc.html` |
| Board icon | `P-Board-Zero.dc.html` |
| Share icon | opens Share sheet (state) |
| Chip 📍 Where? | `P-Chat-DestSuggest.dc.html` |
| Chip 📅 When? | `P-Chat-DatesPoll.dc.html` |
| Chip 🏡 Stay? | `P-Chat-StaySuggest.dc.html` |
| Chip 💰 Budget? | `P-Chat-BudgetSheet-Slider.dc.html` |
| Chip 🛫 Bengaluru ✓ | `P-Chat-FromSheet.dc.html` |
| Goa card "Details" | `P-Dest-Details.dc.html` |
| Gokarna card "Details" | `P-Dest-gokarna.dc.html` |
| Udaipur card "Details" | `P-Dest-udaipur.dc.html` |
| Card "Vote" | state toggle |
| Show more places | toast only |
| pNext CTA | `P-Chat-DatesPoll.dc.html` |
| Share: WA recent row | `P-WA-Compose.dc.html` |
| Share: WhatsApp tile | `P-WA-Pick.dc.html` |

##### Data shown (seed values)
Place list (exact JSON from the script):

| id | name | meta | est | why | img | tint | voters (seed) |
|---|---|---|---|---|---|---|---|
| goa | Goa | Beaches · ✈️ 1h flight | ~₹21k each | Fits all budgets · great in Nov | 63e0220f… | `#FFF1DC` | Priya, Rahul → "2 votes" |
| gokarna | Gokarna | Quiet beaches · 🚗 8h drive | ~₹12k each | Cheapest · drive together | 4ff20859… | `#E1F0FA` | none → "No votes yet" |
| udaipur | Udaipur | Lakes · ✈️ 2.5h flight | ~₹26k each | Diwali lights · a bit pricier | a6364f26… | `#E6EEFB` | Arjun → "1 vote" |

- After you vote Goa: "3 votes" with avatars Priya, Rahul, You. Gokarna → "1 vote" (You). Udaipur → "2 votes" (Arjun, You).
- Messages:
  - Priya "beach pls 🌴 diwali works"
  - Rahul "anything under 25k"
  - Go "3 places fit beach + Diwali + under ₹25k each, from Bengaluru. Vote right on the card 👇"
  - Arjun "udaipur looks sick ngl" (🔥 2)
- Countdown: "Voting closes in 3 hrs". Show-more: "Show more places" / "Go has 6 more".
- CTA: "Goa won the vote · pick dates next".
- Header: "Goa crew" / "Picking a place". Invite: "Join Goa crew on Go", "go.vestra.ai/t/goa-k7q".

##### Icons & images
- Inline SVGs (24 viewBox, round caps/joins, `currentColor`):
  - Back: `M19 12H5` + `M11 6l-6 6 6 6`, 22px, stroke 2, `#000000`.
  - Board: rect `x4 y3 w16 h18 rx3` + lines `M8 8h8`, `M8 12h8`, `M8 16h5`, 20px, stroke 2.
  - Share/forward: `M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8`, 20px, stroke 2.
  - Chip done check: `M5 12l5 5 9-10`, 9px, stroke 4, white on `#16A34A`.
  - Show-more arrow: `M5 12h14` + `M13 6l6 6-6 6`, 20px, stroke 2. The same arrow is the composer send icon.
  - Stopwatch: circle `cx12 cy13 r8` + `M12 9v4l2.5 2` + `M10 2h4`, 14px, stroke 2, `#4A5878`.
  - CTA chevron: `M9 6l6 6-6 6`, 14px, stroke 2.6, white.
  - Composer: plus `M12 5v14`/`M5 12h14`. Mic: rect `x9 y3 w6 h11 rx3` + `M5 11a7 7 0 0 0 14 0` + `M12 18v3`.
  - WhatsApp bubble: 28px, stroke `#FFFFFF`.
- **Emoji**:
  - Chips: 📍📅🏡💰🛫.
  - Meta text: ✈️ and 🚗 inside card meta strings.
  - Messages: 🌴 (Priya), 👇 (Go). 🔥 in the reaction chip.
  - Share sheet: 🌴, 💬, ✉️, 🔗, ⋯.
  - Attach menu: 📷📄📍🗳️.
- **Images**:
  - Card art: 96×96 illustration, alt = place name.
  - Avatars: 30px in bubbles, 20px in the vote stack, 18px in the header.

---

#### P-Dest-Details.dc.html — E2 · Place details
(`<title>` "Go — Goa details")

##### Purpose (1 line)
Goa place-details **bottom sheet** (tall, starts at `top:96px`) over the trip chat. It shows why Go picked Goa, a cost breakdown, activities and who voted, with a "Vote for Goa" CTA.

##### Layout top→bottom
**Underlying chat** (dimmed by the backdrop):
- Header identical to E1 (subtitle "Picking a place"). The chip rail is identical to E1.
- Chat body holds **only the Go bubble** "3 places fit beach + Diwali + under ₹25k each, from Bengaluru. Vote right on the card 👇". There is no member message, no carousel and no countdown.
- Then `pSent`, the sentinel and the composer.

**Backdrop**: `<a href="P-Chat-DestSuggest.dc.html" aria-label="Close sheet">`, `position:absolute; inset:0; z-index:5; background: rgba(11,27,63,0.38)`.

**Sheet** [PlaceDetailsSheet layout=rich → BottomSheet top=96] `role=dialog aria-label="Goa"`:
- Box: `position:absolute; left:0; right:0; bottom:0; top:96px; z-index:6`, flex column, radius **`28px 28px 0 0`**, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`.
- Grabber: 40×5, radius 999, `#DDE1E6`, margin-top 8, centred.
- **Scroll body**: flex 1, `overflow-y:auto`, scrollbar hidden, padding **`8px 16px 150px`**, column, gap 12.
  1. **Title block**: padding `0 4px`, gap 2.
     - Row with space-between, gap 12:
       - Title "Goa": 22/600, -0.02em, lh 1.3.
       - **Close button** [SheetHeader close · Button variant=white size=icon-sm]: `<a>` → `P-Chat-DestSuggest.dc.html`. 40×40 circle, margin-right −6, bg `#FFFFFF`, shadow `0 1px 3px rgba(0,0,0,0.08)`, X icon 18px.
     - Subtitle: 14px `#4A5878`, -0.004em, lh 1.4. Text "Why it made the list, and what it’ll roughly cost."
  2. **Hero photo**: `position:relative; height:170px; border-radius:22px; overflow:hidden`.
     - Image: `<img alt="Palolem beach, Goa">` at 100%/100%, `object-fit:cover`.
     - Overlay span: `linear-gradient(180deg, rgba(11,27,63,0) 40%, rgba(11,27,63,0.65) 100%)`.
     - Bottom-left caption at `left:14px; bottom:12px`, white, column:
       - "Goa": **30/700**, -0.025em, lh 1.05.
       - "Beaches · ✈️ 1h flight from Bengaluru": 14/500.
     - **Price pill** [Badge variant=glass] at `right:12px; top:12px`: height 28, padding `0 10px`, radius 999, bg `rgba(255,255,255,0.94)`, 13/700. Text "~₹21k each".
  3. **"WHY GO PICKED IT" card** [ListCard + CheckBadge size=22]:
     - Card: padding `4px 16px`, radius 22, bg `#FFFFFF`, border `1px solid #ECEFF3`.
     - **Eyebrow** [Eyebrow]: padding `10px 0 2px`, 11/700 `#4A5878`, letter-spacing **0.08em**, lh 1.35.
     - Three rows: padding `11px 0`, flex, gap 10. Rows 2 and 3 add `border-top: 1px solid #ECEFF3`.
       - Each row starts with a tick circle: 22×22, round, bg `#16A34A`, white check 12px, stroke 4.
       - Text: flex 1, 15px, lh 1.35.
     - Rows: "Fits everyone’s budget (₹15–25k each)" / "Dry, sunny weather in November" / "Nonstop flights after work on Friday".
  4. **"ROUGH COST EACH" card** [Card variant=outline radius=2xl]:
     - Card: padding `14px 16px`, radius 22, white, border `1px solid #ECEFF3`, column, gap 10.
     - Eyebrow: same style as above.
     - Rows: space-between, 15px. Left side is an emoji in an 18px box plus the label (gap 8). Right side is the value, 600, tabular-nums.
       - 🏡 "Stay, 3 nights" — "₹10–12k"
       - ✈️ "Travel, both ways" — "₹7–9k"
     - **Total row**: padding-top 10, border-top **`1.5px dashed #DDE1E6`**, **16/700**. "About" — "₹21k".
  5. **"THINGS THE CREW CAN DO"**:
     - Section: column, gap 8. Eyebrow with padding `0 4px`.
     - Wrap row with gap 6. Each **activity chip** [Chip size=sm variant=plain] is a non-interactive `<span>`: height 34, padding `0 12px`, radius 999, bg `#FFFFFF`, border `1px solid #DDE1E6`, 13/600.
     - Chips: "🏖️ Beaches", "🛵 Scooter rides", "🌅 Sunset spots", "🤿 Scuba", "⛪ Old Goa", "🛍️ Night markets".
  6. **Voters row** [AvatarStack size=26 overlap=-8]:
     - Row: padding `12px 14px`, gap 10, radius 18, white, border `1px solid #ECEFF3`.
     - Avatar stack: wrapper padding-left 8. Priya and Rahul, 26×26, `margin-left:-8px`, border `2px solid #FFFFFF`.
     - Text: 14px, flex 1, "Priya and Rahul voted for Goa".
- **Sticky footer** [SheetFooter] (absolute bottom inside the sheet):
  - Box: padding **`40px 16px 24px`**, column, stretch, gap 10, bg `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`.
  - **Primary** [Button variant=primary size=xl] `<a>` "Vote for Goa": height **56**, padding `0 18px`, centred, gap 8, radius 999, bg `#000000`, white, **18/500**, -0.014em, lh 1.3, nowrap. Goes to `P-Chat-DestSuggest.dc.html`.
  - **Text link** [Button variant=link] "Back to all 3": height 44, centred, **`#A44F3A`**, 16/600. Goes to `P-Chat-DestSuggest.dc.html`.

Share sheet and toast (SHELL) sit above everything at z 40/60.

##### Sheets / overlays
- **Place sheet** [PlaceDetailsSheet] (always open in this file):
  - Geometry: top **96px**, which makes it full height minus the header area. Radius `28px 28px 0 0`. Grabber 40×5 `#DDE1E6`. Backdrop `rgba(11,27,63,0.38)`.
  - Closed by: tapping the backdrop, the X button or "Back to all 3", or tapping "Vote for Goa". All four navigate to E1.
- Share sheet (SHELL): Messages/Gmail/Copy link/More are `pa_1`…`pa_4`, the backdrop is `pa_5`, Copy is `pa_6`. The numbering differs from E1 because E2 has no show-more toast.

##### State & interactions
- PBase is empty (`renderVals(){return {}}`). There is no vote state.
- "Vote for Goa" is a plain link back to E1. It does **not** set `pick`; on E1 the vote starts empty again.
- Only SHELL state applies (composer, share, toast).

##### Navigation table
| Element | Target |
|---|---|
| Backdrop | `P-Chat-DestSuggest.dc.html` |
| Close X | `P-Chat-DestSuggest.dc.html` |
| Vote for Goa | `P-Chat-DestSuggest.dc.html` |
| Back to all 3 | `P-Chat-DestSuggest.dc.html` |
| Header / chips / share (under the backdrop) | same as E1 |

##### Data shown (seed values)
- Name "Goa". Subtitle "Why it made the list, and what it’ll roughly cost."
- Hero caption "Beaches · ✈️ 1h flight from Bengaluru". Price "~₹21k each".
- Why rows: "Fits everyone’s budget (₹15–25k each)", "Dry, sunny weather in November", "Nonstop flights after work on Friday".
- Cost: Stay, 3 nights ₹10–12k; Travel, both ways ₹7–9k; About ₹21k. The ranges sum to ₹17–21k, so the total shows the upper bound.
- Activities: Beaches, Scooter rides, Sunset spots, Scuba, Old Goa, Night markets.
- Voters: Priya and Rahul ("Priya and Rahul voted for Goa").
- Background Go message: same as E1.

##### Icons & images
- Photo `/_blob/5bfbb197f2df5cd538e4a319077034cf`, alt "Palolem beach, Goa", full width × 170, cover.
- Close X: `M6 6l12 12` + `M18 6L6 18`, 18px, stroke 2.
- Tick circles: check `M5 12l5 5 9-10`, 12px, stroke 4.
- Emoji: ✈️ in the caption; 🏡 and ✈️ in cost rows; 🏖️🛵🌅🤿⛪🛍️ on the chips.
- Avatars: 26px voters; 30px Go in the background chat.

---

#### P-Dest-gokarna.dc.html — E3 · Place details · Gokarna · new
(`<title>` "Go — Gokarna details")

##### Purpose (1 line)
Lighter place-details sheet for Gokarna (starts at `top:200px`). It shows a tinted illustration, a 4-row facts table and a Go note, with a "Vote for Gokarna" CTA.

##### Layout top→bottom
**Underlying chat**: a **full copy of E1's chat**, with these differences:
- Header and chips are identical to E1 (subtitle "Picking a place").
- Messages are identical: Priya, Rahul, Go, the carousel, "Voting closes in 3 hrs", Arjun + 🔥 2.
- Every card's "Details" link is **hard-coded to `P-Dest-Details.dc.html`** (Goa) instead of `{{o.details}}`.
- The `pNext` CTA is absent.
- The vote logic (PBase `pick`) still runs under the backdrop.

**Backdrop**: `<a href="P-Chat-DestSuggest.dc.html">` with the same style as E2 (z 5, `rgba(11,27,63,0.38)`).

**Sheet** [PlaceDetailsSheet layout=light → BottomSheet top=200] `role=dialog aria-label="Gokarna"`:
- Box: `top:200px`, bottom 0, z 6, radius `28px 28px 0 0`, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`. Grabber 40×5.
- **Scroll body**: padding **`8px 16px 120px`**, gap 12.
  1. **Title block** (same structure as E2):
     - "Gokarna" 22/600 plus the close X (→ E1).
     - Subtitle **"Quiet beaches · temple town"** (14px `#4A5878`).
  2. **Media tile**:
     - Tile: height **150**, radius **20**, bg **`#E1F0FA`** (same tint as the card), flex-centred.
     - Illustration at **110×110**, alt "Gokarna".
     - No price pill, no gradient, no caption.
  3. **Facts table card** [ListCard + KVRow]:
     - Card: padding `4px 14px`, radius **18**, bg `#FFFFFF`, border `1px solid #ECEFF3`.
     - Four rows: padding `10px 0`, flex, space-between, gap 12, 14px. Rows 2–4 have `border-top: 1px solid #ECEFF3`.
     - Label: `#4A5878`. Value: 600, right-aligned.
       - Getting there — "🚗 About 8 hours by road, or train to Gokarna Road"
       - Rough cost — "~₹12k each, all-in"
       - Good for — "Beach hopping, cliff walks, slow days"
       - Early Nov — "Warm and dry after the monsoon"
  4. **Go note card** [GoNote]:
     - Card: padding `12px 14px`, flex, gap 10, radius 18, bg **`#FFF6F2`**, no border.
     - Go avatar 28px (bg `#DCEBFF`).
     - Text 14px, lh 1.4: "Cheapest option. You could all drive down together."
- **Sticky footer** [SheetFooter]: padding `40px 16px 24px`, same gradient as E2. The only button is "Vote for Gokarna": `<a>` height 56, radius 999, bg `#000000`, white, 18/500. It has no padding, gap, letter-spacing or nowrap. Goes to `P-Chat-DestSuggest.dc.html`.
- **No "Back to all 3" link. No voters row.**

##### Sheets / overlays
- Place sheet at top **200px**, so it is shorter than Goa's at 96. Closed by the backdrop, the X or the CTA, all → E1.
- Share sheet (SHELL) uses E1's numbering: `pa_1` show-more toast, `pa_2`…`pa_5` share items, `pa_6` backdrop, `pa_7` Copy.

##### State & interactions
- PBase is identical to E1 (`pick` with the vote toggles), but the carousel is under the backdrop and can't be reached.
- The sheet itself has no state. "Vote for Gokarna" is a plain link to E1 and does not record a vote.

##### Navigation table
| Element | Target |
|---|---|
| Backdrop / Close X / Vote for Gokarna | `P-Chat-DestSuggest.dc.html` |
| (hidden) carousel "Details" on all cards | `P-Dest-Details.dc.html` |
| Header / chips / share | as E1 |

##### Data shown (seed values)
- Title "Gokarna". Subtitle "Quiet beaches · temple town". Tint `#E1F0FA`.
- Facts: Getting there "🚗 About 8 hours by road, or train to Gokarna Road"; Rough cost "~₹12k each, all-in"; Good for "Beach hopping, cliff walks, slow days"; Early Nov "Warm and dry after the monsoon".
- Go note: "Cheapest option. You could all drive down together."
- CTA: "Vote for Gokarna". Background chat: the full E1 seed.

##### Icons & images
- Gokarna illustration `/_blob/4ff2085905cba57f8e02c6d1ec0b87cd` at 110×110 (alt "Gokarna"). The same image appears at 96px in the background card.
- Go avatar 28px. Close X 18px. 🚗 emoji in the facts value.

---

#### P-Dest-udaipur.dc.html — E4 · Place details · Udaipur · new
(`<title>` "Go — Udaipur details")

##### Purpose (1 line)
Udaipur variant of the E3 light place-details sheet. It is byte-identical to E3 except for the content strings, the tint and the image.

##### Layout top→bottom
Identical to E3 (full E1 chat underneath, backdrop, sheet at `top:200px`). The diff against E3 covers only these lines:
- `aria-label="Udaipur"`. Title **"Udaipur"**. Subtitle **"Lakes and palaces"**.
- Media tile bg **`#E6EEFB`**. Image `/_blob/a6364f26054c8b4f4981f9ef56b221a6`, 110×110, alt "Udaipur".
- Facts:
  - Getting there — **"✈️ About 2.5 hours by air"**
  - Rough cost — **"~₹26k each, all-in"**
  - Good for — **"Lake views, old city, Diwali lights"**
  - Early Nov — **"Warm days, cool evenings"**
- Go note (`#FFF6F2`): **"Pricier, and Diwali week books up fast."**
- CTA: **"Vote for Udaipur"** → `P-Chat-DestSuggest.dc.html`.

##### Sheets / overlays
Same as E3: top 200, backdrop/X/CTA → E1, share sheet `pa_1..pa_7`.

##### State & interactions
Same as E3. The underlying carousel still has hard-coded Details → `P-Dest-Details.dc.html` and no pNext.

##### Navigation table
| Element | Target |
|---|---|
| Backdrop / Close X / Vote for Udaipur | `P-Chat-DestSuggest.dc.html` |
| (hidden) carousel Details | `P-Dest-Details.dc.html` |

##### Data shown (seed values)
- Title "Udaipur". Subtitle "Lakes and palaces". Tint `#E6EEFB`.
- Facts:
  - Getting there "✈️ About 2.5 hours by air"
  - Rough cost "~₹26k each, all-in"
  - Good for "Lake views, old city, Diwali lights"
  - Early Nov "Warm days, cool evenings"
- Go note: "Pricier, and Diwali week books up fast."
- No voters row, even though Arjun voted Udaipur in the seed.

##### Icons & images
Udaipur illustration at 110px. ✈️ emoji in the facts value. Go avatar 28px. Close X.

---

#### P-Chat-DatesPoll.dc.html — E5 · Dates poll + I’m flexible
(`<title>` "Go — Dates talk and final poll")

##### Purpose (1 line)
Trip chat after Goa is chosen. Go posts a "Final call: which weekend?" poll with 3 long-weekend options, inline single-choice voting and an "I’m flexible" alternative. Acting reveals the "budgets next" CTA.

##### Layout top→bottom
1. **Header** [ChatHeader] (SHELL). Subtitle: **"Goa · picking dates"**.
2. **Chip rail** [FactChipRow / FactChip]:

   | Chip | State | Target |
   |---|---|---|
   | 📍 Goa | done ✓ | `P-Board-Zero.dc.html` |
   | 📅 When? | open | `P-Chat-DatesPoll.dc.html` (self) |
   | 🏡 Stay? | open | `P-Chat-StaySuggest.dc.html` |
   | 💰 Budget? | open | `P-Chat-BudgetSheet-Slider.dc.html` |
   | 🛫 Bengaluru | done ✓ | `P-Chat-FromSheet.dc.html` |

   No chip uses the active style.
3. **Chat scroll** [MessageList]:
   1. Priya: "diwali weekend? 🪔"
   2. Arjun: "in, but only after 6pm fri 😭"
   3. **Kabir** (avatar `69bfc542…`): "christmas i’m at home in kochi"
   4. Go: "Got it. I checked everyone’s calendars and leave. Here’s what works 👇"
   5. **Dates poll card** [DatesPollCard]:
      - **Card** [InChatCard right=16]: `margin-left:38px; margin-right:16px; padding:14px 0 12px`, radius **22**, bg `#FFFFFF`, border `1px solid #ECEFF3`, shadow `0 8px 24px rgba(11,27,63,0.08)`, column, gap 4, `overflow:hidden`.
      - **Card header**: padding `0 16px 4px`, flex, space-between, gap 8.
        - Title "Final call: which weekend?": **18/600**, -0.014em, lh 1.3.
        - Right side: stopwatch 14px plus **"5 hrs left"**, 13/500 `#4A5878`, nowrap, gap 4.
      - **Options group** [RadioGroup variant=check]: `role=group aria-label="Vote for a weekend"`, column, rendered with `<sc-for list={{opts}}>`.
        - **Option row** [PollOptionRow] = `<button aria-pressed>` with `rowStyle`:
          - Box: `width:100%; padding:8px 16px; border:0`, flex, align center, **gap 14**, left-aligned, bg transition 160ms.
          - Background: **`#F0FAF3` when mine**, otherwise transparent.
          - Row index > 0 adds `border-top:1px solid #ECEFF3`.
        - **Calendar tile** [CalendarTile]:
          - Tile: width 46, radius 10, overflow hidden, bg `#FFFFFF`, shadow `0 1px 4px rgba(0,0,0,0.12)`, column.
          - Top band: 16px, bg **`#111111`**, white 9/700, letter-spacing 0.08em, text `{{o.month}}` ("NOV").
          - Bottom: 28px, 13/700, tabular-nums, text `{{o.range}}` ("6–9").
        - **Text column** (flex 1, gap 1):
          - Line 1: space-between. Name 15/600, lh 1.3, then the **radio** [RadioGroup variant=check indicator] (`radioStyle`):
            - Radio box: 26×26 circle, border-box, bg/border transition 160ms.
            - Unselected: bg `#FFFFFF`, border `2px solid #CDD3DC`.
            - Selected: bg **`#16A34A`**, no border, white check 16px (stroke 3.2) inside `<sc-if mine>`.
          - Line 2: meta, 13/500 `#4A5878`.
          - Line 3: space-between, 13px, lh 1.35.
            - Left: fit text, 600, `color: {{o.fitColor}}`.
            - Right: avatar stack (`f1..f3`, 20px, −6px overlap, 2px white border) plus `{{o.voteLabel}}` ("N vote(s)" or "No votes"), 600, nowrap.
        - **No vote bars or percentages**. Tallies are avatars plus counts only.
      - **"I’m flexible" button** [FlexibleButton = Chip size=lg variant=dashed→success] (`<button aria-pressed={{flexPressed}}>`, `flexStyle`):
        - Box: `margin:6px 16px 2px; height:42px`, radius 999, centred, gap 8, 14/600.
        - Off: bg `#FFFFFF`, color `#0B1B3F`, border **`1px dashed #A5ACB8`**, label "🤷 I’m flexible, any of these work".
        - On: bg **`#E3F5EA`**, color **`#0F7A37`**, border `1px solid #E3F5EA`, label "🤷 You’re flexible · any of these work".
        - The 🤷 sits in an `aria-hidden` span.
      - **Footer row** [PollFooter]: padding `6px 16px 2px`, space-between, 13px, 0.002em, lh 1.35.
        - Left: `{{pollCount}}`, `#4A5878`, tabular-nums ("3 of 4 voted").
        - Right: your avatar (`c58d…`, 20px), then `{{pollStatus}}`, 600, `color: {{pollStatusColor}}`, gap 6.
   6. **Go next-step CTA** [NextStepPill] (`pNext`): **"Diwali weekend won · budgets next"** → `P-Chat-Budget.dc.html`.
   7. `pSent`, then the sentinel.
4. Composer, share sheet and toast (SHELL).

##### Sheets / overlays
- No screen-specific sheet.
- Share sheet (SHELL): `pa_1..pa_4` share tiles, `pa_5` backdrop, `pa_6` Copy.

##### State & interactions
- **PBase state**: `myVote: null`, `flex: false`.
- **Per option**:
  - `mine = myVote === o.id`.
  - `v = mine ? voters.concat([YOU]) : voters`, `n = v.length`.
  - `voteLabel = n ? n + (n===1?' vote':' votes') : 'No votes'`.
  - Tap: `setState({ myVote: mine ? null : o.id, flex: false })`. The rows are single choice, tapping again un-votes, and voting clears flex.
- **Flexible toggle**: `setState({ flex: !fx, myVote: null })`, which clears any date vote. The button is mutually exclusive with a date vote.
- **Derived values**:
  - `base` = the sum of seed voters = **3**.
  - `pollCount = (base + (my ? 1 : 0)) + ' of 4 voted'` → "3 of 4 voted", or "4 of 4 voted" after you vote. Flexible does **not** increment it.
  - `pollStatus = my ? 'You voted' : 'yet to vote'`, with colour `#0F7A37` or `#0B1B3F`. With flex on, it still reads **"yet to vote"**.
  - `voted = !!my || fx` is computed but unused.
- **`pNext = !!s.myVote || !!s.flex`**. The CTA "Diwali weekend won · budgets next" appears after any vote (even Christmas) or after choosing flexible.

##### Navigation table
| Element | Target |
|---|---|
| Back / trip title | `P-TripHome-Zero.dc.html` |
| Board icon | `P-Board-Zero.dc.html` |
| Chip 📍 Goa ✓ | `P-Board-Zero.dc.html` |
| Chip 📅 When? | `P-Chat-DatesPoll.dc.html` |
| Chip 🏡 Stay? | `P-Chat-StaySuggest.dc.html` |
| Chip 💰 Budget? | `P-Chat-BudgetSheet-Slider.dc.html` |
| Chip 🛫 Bengaluru ✓ | `P-Chat-FromSheet.dc.html` |
| Option rows / flexible | state |
| pNext CTA | `P-Chat-Budget.dc.html` |
| Share WA row / WA tile | `P-WA-Compose.dc.html` / `P-WA-Pick.dc.html` |

##### Data shown (seed values)
| id | name | month | range | meta | fit | fitColor | voters (seed) |
|---|---|---|---|---|---|---|---|
| diwali | Diwali | NOV | 6–9 | Fri to Mon · no leave | Works for all 4 | `#0F7A37` | Priya, Arjun → "2 votes" |
| xmas | Christmas | DEC | 25–28 | Fri to Mon · no leave | Kabir’s away · 3 of 4 | `#A44F3A` | Rahul → "1 vote" |
| rday | Republic Day | JAN | 23–26 | Sat to Tue · 1 leave | Works for all 4 · 1 leave | `#4A5878` | none → "No votes" |

- The calendar matches 2026–27: 6 Nov 2026 is a Friday, 25 Dec 2026 is a Friday, and 23 Jan 2027 is a Saturday.
- Messages:
  - Priya "diwali weekend? 🪔"
  - Arjun "in, but only after 6pm fri 😭"
  - Kabir "christmas i’m at home in kochi"
  - Go "Got it. I checked everyone’s calendars and leave. Here’s what works 👇"
- Poll title "Final call: which weekend?". Countdown "5 hrs left".
- Footer "3 of 4 voted", with your avatar and "yet to vote".
- CTA "Diwali weekend won · budgets next".
- Header subtitle "Goa · picking dates".

##### Icons & images
- Stopwatch 14px (same path as E1).
- Radio check `M5 12l5 5 9-10`, 16px, stroke 3.2, white.
- Chip done check 9px. CTA chevron 14px.
- Emoji: 🪔 (Priya), 😭 (Arjun), 👇 (Go), 🤷 (flex button), plus the chip emoji.
- Avatars: 30px bubbles (Priya, Arjun, Kabir, Go), 20px poll stacks, 20px "you" in the footer.

---

#### P-Chat-Budget.dc.html — E6 · Budget ask
(`<title>` "Go — Budget ask with CTA")

##### Purpose (1 line)
Trip chat after dates are settled. Go asks each person privately for a per-person, all-in budget, with an "Add my budget" CTA that opens the budget sheet (E7).

##### Layout top→bottom
1. **Header** [ChatHeader] (SHELL). Subtitle: **"Diwali · 6–9 Nov"**.
2. **Chip rail** [FactChipRow / FactChip]:

   | Chip | State | Target |
   |---|---|---|
   | 📍 Goa | done ✓ | `P-Board-Zero.dc.html` |
   | 📅 Nov 6–9 | done ✓ | `P-Board-Zero.dc.html` |
   | 🏡 Stay? | open | `P-Chat-StaySuggest.dc.html` |
   | 💰 Budget? | **ACTIVE** (`border:1px solid #000000; box-shadow:0 0 0 1px #000000; font-weight:600`) | `P-Chat-BudgetSheet-Slider.dc.html` |
   | 🛫 Bengaluru | done ✓ | `P-Chat-FromSheet.dc.html` |
3. **Chat scroll** [MessageList]:
   1. **System pill** [SystemPill]:
      - Pill: `align-self:center; margin:2px 0`, flex, gap 6, padding **`5px 12px 5px 5px`**, radius 999, bg `#FFFFFF`, shadow `0 1px 2px rgba(11,27,63,0.06), 0 4px 12px rgba(11,27,63,0.04)`, `#4A5878` 13px, 0.002em, lh 1.35.
      - Go avatar 20px (bg `#DCEBFF`), then **"Diwali won · Fri 6 – Mon 9 Nov"**.
   2. **Go budget-ask bubble** [BudgetAskBubble = GoBubble cta+caption] (Go avatar 30px):
      - Bubble: **max-width 80%**, padding **`8px 8px 10px 14px`**, radius `20px 20px 20px 0`, bg `#F6EAE6`, standard bubble shadow, column, **gap 6**.
      - "Go": 13/600 `#A44F3A`.
      - Text span (`padding-right:6px`, 16px, -0.011em, lh 1.4, `text-wrap: pretty`): "Next up, money 💰" ⏎ "What can you spend per person, all-in? Only I see your number." ⏎⏎ "@Aarav please set this". The last line sits in a span with `letter-spacing:-0.176px`. There is no mention highlight styling.
      - **CTA** [Button variant=primary size=base] `<a>` "Add my budget":
        - Box: margin-top 4, height **44**, padding `0 16px`, centred, gap 6, radius 999, bg `#000000`, white **15/600**, nowrap.
        - Leading **lock** icon, 15px.
        - → `P-Chat-BudgetSheet-Slider.dc.html`.
      - Caption: `padding-right:6px`, **12px `#A44F3A`**, lh 1.35. Text "Only you and Go see what you add".
   3. **System pill** [SystemPill] (same style): **"Rahul and Priya added theirs"**. This is the "who has answered" signal, shown in chat only.
   4. `pSent`, then the sentinel. There is no pNext CTA in E6.
4. Composer, share sheet and toast (SHELL).

##### Sheets / overlays
- No budget sheet in this file. The CTA opens E7.
- Share sheet (SHELL): `pa_1..pa_4`, `pa_5` backdrop, `pa_6` Copy.

##### State & interactions
- PBase is empty. Only SHELL state applies (composer, share, toast).
- "Add my budget" is a link to E7.

##### Navigation table
| Element | Target |
|---|---|
| Back / trip title | `P-TripHome-Zero.dc.html` |
| Board icon | `P-Board-Zero.dc.html` |
| Chips 📍 Goa ✓ / 📅 Nov 6–9 ✓ | `P-Board-Zero.dc.html` |
| Chip 🏡 Stay? | `P-Chat-StaySuggest.dc.html` |
| Chip 💰 Budget? (active) | `P-Chat-BudgetSheet-Slider.dc.html` |
| Chip 🛫 Bengaluru ✓ | `P-Chat-FromSheet.dc.html` |
| "Add my budget" | `P-Chat-BudgetSheet-Slider.dc.html` |
| Share WA row / tile | `P-WA-Compose.dc.html` / `P-WA-Pick.dc.html` |

##### Data shown (seed values)
- System pills: "Diwali won · Fri 6 – Mon 9 Nov"; "Rahul and Priya added theirs".
- Go message: "Next up, money 💰 / What can you spend per person, all-in? Only I see your number. / @Aarav please set this".
- CTA "Add my budget". Caption "Only you and Go see what you add".
- Header subtitle "Diwali · 6–9 Nov". Chip label "Nov 6–9".
- The current user is addressed as **Aarav**.

##### Icons & images
- Lock: rect `x5 y11 w14 h10 rx2` + shackle `M8 11V8a4 4 0 0 1 8 0v3`, 15px, stroke 2, white.
- Go avatar at 20px (pills) and 30px (bubble). Header avatars as in SHELL.
- Emoji: 💰 in the message, plus the chip emoji.

---

#### P-Chat-BudgetSheet-Slider.dc.html — E7 · Budget sheet · min–max slider
(`<title>` "Go — Budget sheet, min-max slider")

##### Purpose (1 line)
E6's chat with a private "Your budget range" bottom sheet open. It has a dual-handle min–max slider (₹5k–₹60k, step ₹1k) and a "Save my range" button. Saving reveals the "see the stays" CTA.

##### Layout top→bottom
**Underlying chat**: E6 with these exact diffs:
- Extra CSS `.rng` for the slider (see below).
- Header row: `gap:4px; padding:0 8px 0 12px` (E6 has gap 8, padding `0 12px`). Trip link: `height:52px; padding:0 4px` (E6 has 60 and `0 8px 0 0`).
- Subtitle "Diwali · 6–9 Nov" loses its letter-spacing and line-height declarations.
- Board and share anchors are split onto separate lines. No visual change.
- In the Go bubble, the "Go" label loses its letter-spacing and line-height. "@Aarav please set this" is no longer wrapped in the `-0.176px` span.
- **The "Rahul and Priya added theirs" pill is removed.**
- The chips match E6, with 💰 Budget? still active.

**Backdrop**: `<a href="P-Chat-Budget.dc.html" aria-label="Close sheet">`, inset 0, z 5, `rgba(11,27,63,0.38)`.

**Sheet** [BudgetSheet → BottomSheet] `role=dialog aria-label="Your budget range"`:
- Box: `position:absolute; left:0; right:0; bottom:0; top:454px; height:458px` (both are declared; 912−454=458), z 6, flex column, radius **`28px 28px 0 0`**, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`.
- Grabber: 40×5 `#DDE1E6`, margin-top 8.
- **Scroll body**: padding `8px 16px 120px`, column, gap 12.
  1. **Title block**:
     - "Your budget range" 22/600, -0.02em, lh 1.3, plus the close X (40px white circle, shadow `0 1px 3px rgba(0,0,0,0.08)`, margin-right −6), → `P-Chat-Budget.dc.html`.
     - Subtitle "Drag to set a minimum and a maximum." (14px `#4A5878`, -0.004em, lh 1.4).
  2. **Range card** [Card variant=outline radius=2xl]: padding **`18px 16px 14px`**, radius 22, bg `#FFFFFF`, border `1px solid #ECEFF3`, column, gap 10.
     - Eyebrow **"YOUR BUDGET"**: 11/700 `#4A5878`, 0.08em.
     - **Value**: `{{rangeText}}` at **32/700**, -0.025em, tabular-nums. Seed "₹15k – ₹25k" (spaced en dash).
     - **Slider `.rng`** [BudgetRangeSlider → ui/slider]: `position:relative; height:44px`.
       - **Base track** span: `left:14px; right:14px; top:20px; height:4px`, radius 999, bg **`#ECEFF3`**.
       - **Fill** span (`fillStyle`): `top:20px; height:4px`, radius 999, bg **`#000000`**. Position: `left: calc(P(lo)% + (14 − P(lo)·0.28)px)`, `right: calc((100−P(hi))% + (14 − (100−P(hi))·0.28)px)`, where `P(n) = (n−5000)/(55000)·100`, rounded to 1dp. This compensates for the 28px thumb so the fill meets the thumb centres. Seed: `left: calc(18.2% + 8.9px); right: calc(63.6% + -3.8px)`.
       - Two **native `<input type=range>`** elements, overlaid:
         - `aria-label="Minimum"`: min 5000, max 60000, step 1000, value `{{lo}}`, `onChange={{onLo}}`.
         - `aria-label="Maximum"`: same bounds, value `{{hi}}`, `onChange={{onHi}}`.
       - CSS for the inputs: `position:absolute; left:0; top:8px; width:100%; height:28px; margin:0; background:transparent; pointer-events:none; appearance:none`. The track is transparent and 28px tall.
       - **Thumb** (webkit): `pointer-events:auto`, **28×28**, round, bg `#FFFFFF`, **border `2px solid #000000`**, shadow `0 2px 6px rgba(11,27,63,.2)`, cursor pointer. Firefox: 24×24, same white with a 2px black border.
     - **End labels** row: space-between, 13/600 `#4A5878`, 0.002em, lh 1.35. **"₹5k"** on the left, **"₹60k"** on the right.
  3. **Privacy note** [InfoNote]:
     - Card: padding `12px 14px`, flex, gap 10, radius 18, bg **`#FFF6F2`**.
     - Lock icon 16px (stroke `currentColor` = `#0B1B3F`).
     - Text 14px, lh 1.4: "Go aims for the low end and never goes past your max. Only you see this."
  4. **Go next-step CTA** [NextStepPill] (`pNext`, inside the scroll body): **"Saved · see the stays Go found"** → `P-Chat-StaySuggest.dc.html`.
- **Sticky footer** [SheetFooter]: absolute bottom, padding `40px 16px 24px`, column, gap 10, gradient `rgba(246,247,249,0) 0%` → `#F6F7F9` 35%.
  - **Save button** [Button size=xl variant=primary→success-soft] (`<button onClick={{send}}>`, `sendStyle`): height **56**, no border, radius 999, 18/500.
    - Unsaved: bg `#000000`, white, label **"Save my range"**.
    - Saved: bg **`#E3F5EA`**, color **`#0F7A37`**, label **"Saved privately ✓"**.

The sheet has **no** per-person/total toggle (the per-person framing exists only in Go's copy). It has **no** list of who has answered, and the E6 chat pill for that is removed here. There is no currency or custom input.

##### Sheets / overlays
- **Budget sheet** [BudgetSheet] (always open in this file):
  - Geometry: `top 454px`, `height 458px`. Radius `28px 28px 0 0`. Grabber 40×5 `#DDE1E6`. Backdrop `rgba(11,27,63,0.38)`.
  - Closed by the backdrop or the X, both → `P-Chat-Budget.dc.html`.
  - Saving does not close the sheet. It flips the button and shows the CTA.
- Share sheet (SHELL): `pa_1..pa_4`, `pa_5` backdrop, `pa_6` Copy.

##### State & interactions
- **PBase state**: `lo: 15000`, `hi: 25000`, `sent: false`. Constants `MIN=5000`, `MAX=60000`.
- **Formatter**: `k(n) = '₹' + (n/1000).toFixed(n % 1000 ? 1 : 0) + 'k'`. With step 1000, values are always whole k, e.g. "₹15k".
- **Derived**: `rangeText = k(lo) + ' – ' + k(hi)`.
- **`onLo`**: `lo = min(value, hi − 1000)`, then `sent=false`. **`onHi`**: `hi = max(value, lo + 1000)`, then `sent=false`. The handles keep at least a ₹1k gap, and any change after saving resets the button to unsaved.
- **`send`**: `setState({sent:true})`.
- **`pNext = !!s.sent`**: shows the "Saved · see the stays Go found" CTA.
- SHELL composer/share/toast still run under the sheet (`Component` merges state).

##### Navigation table
| Element | Target |
|---|---|
| Backdrop | `P-Chat-Budget.dc.html` |
| Close X | `P-Chat-Budget.dc.html` |
| Save my range | state (`sent`) |
| pNext "Saved · see the stays Go found" | `P-Chat-StaySuggest.dc.html` |
| Under the backdrop: "Add my budget" | `P-Chat-BudgetSheet-Slider.dc.html` (self) |
| Under the backdrop: chips / header | as E6 |

##### Data shown (seed values)
- Range: min ₹5k, max ₹60k, step ₹1k. Default ₹15k – ₹25k. This matches Goa's "Fits everyone’s budget (₹15–25k each)" and Rahul's "anything under 25k".
- Strings:
  - "Your budget range"
  - "Drag to set a minimum and a maximum."
  - "YOUR BUDGET"
  - "₹5k" / "₹60k"
  - "Go aims for the low end and never goes past your max. Only you see this."
  - "Save my range" / "Saved privately ✓"
  - "Saved · see the stays Go found"
- Background: E6's Go message and the "Diwali won · Fri 6 – Mon 9 Nov" pill.

##### Icons & images
- Lock 16px in the note and 15px in the background CTA. Close X 18px. CTA chevron 14px.
- The slider thumbs are styled native thumbs, not SVG.
- Go avatar at 30px in the CTA, 20px in the pill and 30px in the bubble.

---

#### Group notes

##### Shared element names (proposed component vocabulary)
- **TripChatHeader** [ChatHeader]: back, trip avatar + name + member AvatarStack(18) + subtitle, board, share.
- **StatusChipRail / StatusChip** [FactChipRow / FactChip]: three states — `open` ("Where?"/"When?"/"Stay?"/"Budget?"), `done` (value + green ✓ badge), and `active` (black 1px border + 1px ring, weight 600; E6/E7 Budget).
  - Each chip deep-links to the step screen. Done chips go to `P-Board-Zero`, except Bengaluru, which goes to `P-Chat-FromSheet`.
- **ChatBubble** [Bubble]: member (white), Go (`#F6EAE6`, name `#A44F3A`), me (black). Plus **ReactionChip** [ReactionChip] (🔥 2).
- **SystemPill** [SystemPill]: Go avatar 20 plus a 13px grey line, centred (E6/E7). Used for decisions ("Diwali won · …") and progress ("Rahul and Priya added theirs").
- **GoNextStepCTA** [NextStepPill] (`pNext` pill, navy `#0B1B3F`, Go avatar + chevron). It appears after the user acts:
  - E1 "Goa won the vote · pick dates next"
  - E5 "Diwali weekend won · budgets next"
  - E7 "Saved · see the stays Go found"
- **CountdownMeta** [CountdownMeta]: stopwatch 14 plus "Voting closes in 3 hrs" / "5 hrs left".
- **AvatarStack** [AvatarStack]: sizes 18 (header, −5, 1.5px border), 20 (votes, −6, 2px), 26 (detail voters, −8, 2px).
- **PlaceCard** [PlaceCard] (236w, 132 media on tint + 96 illustration + price pill + name/meta/green why + vote line + Details/Vote buttons), **ShowMoreTile** [ShowMoreTile] (150w, dashed) and **VoteButton** [Button variant=primary|success size=sm] (black "Vote" ↔ green `#16A34A` "Voted ✓").
- **BottomSheet** [BottomSheet + SheetHeader/SheetBody/SheetFooter] (place / budget / share):
  - Frame: radius `28px 28px 0 0`, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`, grabber 40×5 `#DDE1E6`, backdrop `rgba(11,27,63,0.38)`.
  - Title row: 22/600 title + 40px white close X, then a 14px grey subtitle.
  - Scroll body: padding `8px 16px 120–150px`, gap 12.
  - Sticky footer: gradient, padding `40px 16px 24px`, 56px black primary pill (18/500).
- **SectionCard + Eyebrow** [Card variant=outline + Eyebrow]: white, radius 22, border `#ECEFF3`. Eyebrow is 11/700 `#4A5878`, 0.08em, uppercase.
- **TickList** [ListCard + CheckBadge size=22] (22px green check circles), **CostBreakdown** [PlaceDetailsSheet cost section] (dashed `1.5px #DDE1E6` total rule), **ActivityChips** [Chip size=sm variant=plain] (34px outline pills) and **FactsTable** [ListCard + KVRow] (label/value rows, radius 18).
- **GoNote** [GoNote / InfoNote] (`#FFF6F2`, radius 18, Go avatar 28 or a lock icon, 14px text). It is used in E3/E4 and the E7 privacy note.
- **DatesPollCard** [DatesPollCard]: CalendarTile (46w, black `#111111` month band), PollOptionRow (selected bg `#F0FAF3`), RadioCheck [RadioGroup variant=check] (26px, `#CDD3DC` → `#16A34A`), FlexibleButton (dashed `#A5ACB8` → `#E3F5EA`/`#0F7A37`), and a PollFooter (count + your status).
- **BudgetRangeSlider** [BudgetRangeSlider]: dual native range inputs over a `#ECEFF3` track with a `#000000` fill, 28px white thumbs with a 2px black border, and the big 32/700 value readout.
- **Colour tokens seen**:
  - Text `#0B1B3F`, muted `#4A5878`.
  - Borders `#ECEFF3` / `#DDE1E6` / `#CDD3DC` / `#A5ACB8`.
  - Backgrounds: page `#F6F7F9`, button grey `#F2F2F2` / `#F4F5F7`.
  - Go: bubble `#F6EAE6`, accent `#A44F3A`, note `#FFF6F2`, avatar bg `#DCEBFF`.
  - Success: `#16A34A` (fill), `#0F7A37` (text), `#E3F5EA` / `#F0FAF3` (tints).
  - Recording `#B42318`, navy CTA `#0B1B3F`, WhatsApp `#25D366`.
  - Place tints: `#FFF1DC` (Goa), `#E1F0FA` (Gokarna), `#E6EEFB` (Udaipur).

##### Sibling-state collapses
- **E2 / E3 / E4 = one "place details" sheet route over the trip chat**, e.g. `/trip/:tripId/chat?place=:placeId` or `/trip/:tripId/place/:placeId` presented as a sheet. The backdrop, X and CTA all return to E1. The two layouts in the designs differ as follows:

  | Aspect | Goa (E2, "rich") | Gokarna / Udaipur (E3/E4, "light", "· new") |
  |---|---|---|
  | Sheet top | 96px; body padding-bottom 150 | 200px; padding-bottom 120 |
  | Subtitle | "Why it made the list, and what it’ll roughly cost." | place tagline |
  | Media | 170px **photo** hero, radius 22, gradient overlay, 30/700 name + caption, price pill top-right | 150px **tint + 110px illustration**, radius 20, no pill/caption |
  | Content cards | WHY GO PICKED IT tick list; ROUGH COST EACH breakdown with dashed total; THINGS THE CREW CAN DO chips | 4-row FactsTable (Getting there / Rough cost / Good for / Early Nov) |
  | Extra | Voters row ("Priya and Rahul voted for Goa") | GoNote card in `#FFF6F2` |
  | Footer | "Vote for Goa" (with -0.014em letter-spacing) + "Back to all 3" link (`#A44F3A`) | "Vote for X" only |
  | Background chat | only Go's message | full E1 chat incl. carousel (Details hard-coded to Goa, no pNext) |

  - Recommendation: one component with optional sections (hero photo vs. illustration, `why[]`, `costBreakdown[]`, `activities[]`, `facts[]`, `goNote`, `voters[]`), driven by place data.
  - Mock data needs both shapes for Goa, or a superset for every place.
- **E6 / E7 = same chat state (budget ask) with the budget sheet closed vs. open.** E7's differences are listed exactly in its section (header spacing, the Go label, the removed "Rahul and Priya added theirs" pill, the sheet itself). The pill removal looks like an oversight; keep the pill in the collapsed screen.
- **E1 vs E2/E3/E4**: E1 is the same chat with no sheet. E3/E4 embed the exact E1 chat.
- **E1 → E5 → E6** are chronological slices of one continuous trip-chat timeline. They are not separate screens. Per-stage header subtitles: "Picking a place" → "Goa · picking dates" → "Diwali · 6–9 Nov".
- Chip state also progresses across the stages: Where? → Goa ✓; When? → Nov 6–9 ✓; Budget? goes active in E6/E7.
- The timeline needs these message types: member text, Go text, Go place-carousel (vote), Go dates-poll, Go budget-ask (CTA + private caption), system pill, reaction chip, next-step CTA, and my text/voice/attachment.

##### Navigation graph (this group)
- **E1**:
  - Details → E2 (Goa), E3 (Gokarna), E4 (Udaipur).
  - pNext → E5. Chips → E1, E5, StaySuggest, E7, FromSheet.
- **E2/E3/E4**: every exit → E1.
- **E5**:
  - pNext → E6. Chips → Board-Zero (Goa ✓), E5, StaySuggest, E7, FromSheet.
- **E6**:
  - "Add my budget" → E7.
  - Chips → Board-Zero ×2, StaySuggest, E7, FromSheet.
- **E7**:
  - Backdrop/X → E6.
  - pNext (after save) → `P-Chat-StaySuggest.dc.html`.
- **Everywhere**: back/title → `P-TripHome-Zero`, board → `P-Board-Zero`, share sheet → `P-WA-Compose` / `P-WA-Pick`.

##### Surprises / ambiguities
1. **No vote bars in the dates poll.** Results show as avatar stacks plus "N votes" and "N of 4 voted". There are no percentages, bars or closed/result state. The "result" exists only as the next-step CTA and E6's "Diwali won" pill.
2. **Hard-coded winners**:
   - E1's CTA says "Goa won the vote" after *any* vote.
   - E5's CTA says "Diwali weekend won" after any vote or after choosing flexible.
   - No tally-based winner logic exists, and no closing state for the "3 hrs" or "5 hrs left" countdowns.
3. **Detail-page "Vote for X" is just a link back to E1.** It records no vote, and the vote state does not persist across files.
4. **E3/E4's background carousel Details links all point to `P-Dest-Details.dc.html`** (Goa). This is a stale copy and is invisible behind the backdrop.
5. **Member count mismatch**:
   - The header stack shows 4 people (You, Rahul, Priya, Arjun) and E5 says "of 4".
   - Kabir appears in E5 chat, and the Christmas fit text says "Kabir’s away · 3 of 4", which implies Kabir is one of the 4.
   - The seed voters (Priya, Arjun, Rahul) plus You make "4 of 4", with Kabir excluded.
   - The roster is undefined. The likely intent is 5 members (You/Aarav, Priya, Rahul, Arjun, Kabir), or Kabir replacing someone.
6. **Current user's name is "Aarav"**, known only from "@Aarav please set this". The YOU avatar is `c58d…`. The mention has no highlight style.
7. **Flexible doesn't count as voting.** `pollCount` stays "3 of 4" and the status still says "yet to vote" while flexible is on, even though pNext fires.
8. **Goa cost maths**: line items sum to ₹17–21k, the total shows "About ₹21k", and the card says "~₹21k each". The upper bound is used.
9. **Budget sheet scope**:
   - Only "per person, all-in" in Go's copy. No per-person/total toggle in the sheet.
   - No "who has answered" inside the sheet.
   - Saving doesn't post anything to chat. There is no pSent message and no system pill.
   - Changing a handle after saving silently un-saves.
10. **The "Budget?" chip in E1–E5 skips E6** and opens E7 (the sheet) directly. E6's chip is active and also links to E7.
11. **Budget sheet declares both `top:454px` and `height:458px`**, which is fixed geometry. Its pNext CTA sits inside the scroll body, so after saving it may sit under the 120px footer gradient and need a scroll.
12. **Place sheet heights differ**: top 96 for Goa, top 200 for Gokarna/Udaipur. Pick one, or make the sheet content-sized.
13. **Card "why" vs detail copy differ**: "Fits all budgets · great in Nov" (card) vs "Fits everyone’s budget (₹15–25k each)" (detail). Gokarna's "Cheapest · drive together" maps to the GoNote "Cheapest option. You could all drive down together."
14. **The 'Satoshi' font is listed first but never loaded.** It renders in Figtree unless Satoshi is bundled.
15. **`.live` pulse ring colour is green** `rgba(22,163,74,0.12)` while used on the red recording pill. This belongs to the shell.
16. **Canvas preview vs runtime**: `hint-placeholder-val="{{ true }}"` on the pNext CTAs (E1/E5/E7) means static canvas exports show the CTA. At runtime it's hidden until the user acts.
17. **Unused derived values**: `voted` in E1 and E5. The quote block in pSent bubbles is unused.

---

### Group E2 — Stays, Pay, Book (E8–E15)

From `group-E2-G-stays-pay-visa.md`: the E8–E15 artboard sections and the group notes.

#### P-Chat-StaySuggest.dc.html — "Go — Trip chat · Go suggests stays · rating + vote (v2)"

##### Purpose (1 line)
E8: Go posts a horizontal rail of 3 stay poll cards (price, rating, area, tags, voters) the group votes on; voting reveals a "Villa Sol won · book it" pill.

##### Layout top→bottom
1. Header (variant 1). Back + title → `P-TripHome-Zero.dc.html`. Title "Goa crew", sub "Diwali · 6–9 Nov", avatars You/Rahul/Priya/Arjun. Board → `P-Board-Poll.dc.html`; Share → `pa_0` (open share sheet).
2. Chips: 📍 Goa ✓ → P-Board-Poll; 📅 Nov 6–9 ✓ → P-Board-Poll; 🏡 **Stay?** (no tick, open item) → P-Chat-StaySuggest (self); 💰 ₹21.8k ✓ → P-Chat-BudgetSheet-Slider; 🛫 Bengaluru ✓ → P-Chat-FromSheet.
3. System pill: "Budget set: ₹21.8k each".
4. My bubble (black, max 80%) containing an inline **@Go mention chip** [MentionChip]: `height 24; padding 0 9px 0 2px; gap 5; radius 999; bg rgba(255,255,255,0.16); #FFF; 600; lh 1` with Go avatar 20 (bg #DCEBFF) + "Go"; then text "find us a villa near anjuna, pool would be nice". Text wrapper `flex; flex-wrap; gap 6; 16px ls -0.011em lh 1.4`.
5. Go bubble: "Found 3 pool villas for 6–9 Nov, all under your ₹21.8k each. Vote on the one you like 👉".
6. **Stay poll rail** [StayPollRail → HorizontalRail] (horizontal scroller): `margin 0 -16px 0 22px; padding 4px 16px 10px; flex; gap 10; overflow-x auto; scrollbar none; scroll-snap-type x mandatory`. (Card left edge lands at 16+22+16 = 54px from screen = aligned 38px in from bubble column, same as other in-chat cards.) `sc-for cards as o`:
   - **Stay card** [StayCard]: `width 236; flex-shrink 0; radius 20; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08); overflow hidden; scroll-snap-align start; flex column`.
     - Image block `position relative; height 132px`; `<img src=o.img alt=o.name>` 100%×100% cover.
     - Overlay price/rating pill: `absolute left 10 top 10; height 26; padding 0 10; gap 6; radius 999; bg rgba(255,255,255,0.94); 13/700; tabular-nums`: `{price}` + divider `1px×12px #DDE1E6` + `★` (color #B7791F) + `{rating}`.
     - Body `padding 10px 12px 12px; flex column; gap 4`:
       - Row (baseline, space-between, gap 8): name 16/600 ls -0.011em lh 1.3 | reviews 13px #4A5878 ls 0.002em lh 1.35.
       - Area row 13px #4A5878 gap 4: map-pin svg 13 (path `M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z` + circle cx12 cy9.5 r2.5, stroke 2) + `{area}`.
       - Tags line 13px #4A5878: `{tags}`.
       - Votes row 13px **600 #0B1B3F** gap 6: avatar stack wrapper `padding-left 6px`; up to 3 `sc-if` avatars 20×20, `margin-left -6px; border 2px solid #FFF; radius 999; cover`; then `{votes}` text.
       - Buttons row `flex; gap 6; margin-top 6`:
         - **Details** [Button variant=secondary size=sm] `<a href={o.details}>`: `height 36; padding 0 14; radius 999; bg #F2F2F2; #0B1B3F; 14/600; ls -0.004em; lh 1.35; nowrap; flex 1`.
         - **Vote** [Button variant=primary|success size=sm] `<button aria-pressed={o.pressed}>` style `flex 1; height 36; border 0; radius 999; 14/600; transition bg/color 160ms ease;` + unvoted `bg #000; #FFF` / voted `bg #16A34A; #FFF`. Label "Vote" / "Voted ✓".
   - **"Show 5 more" tile** [ShowMoreTile] (after loop; `<a role=button>` → `pa_1`): `width 150; radius 20; border 1.5px dashed #CDD3DC; bg #FFF; flex column center; gap 8; padding 16; text-align center; scroll-snap-align start`. Icon circle 44 bg #F4F5F7 with arrow-right svg 20 (M5 12h14 + M13 6l6 6-6 6). "Show 5 more" 15/600 lh 1.3; "Same dates, same budget" 13px #4A5878.
7. Priya bubble (white, avatar `/_blob/234f094a…`): name "Priya", text "casa azul is so cute 😍".
8. `sc-if pNext` → **Next pill** [NextStepPill] `<a class="enter" href="P-Chat-PayAsk.dc.html">`: `align-self center; margin-top 6; height 42; padding 0 14px 0 6px; gap 8; radius 999; bg #0B1B3F; #FFF; 14/600; shadow 0 6px 18px rgba(11,27,63,0.2)`; Go avatar 30 + "Villa Sol won · book it" + chevron svg 14 (M9 6l6 6-6 6, stroke 2.6).
9. `pSent` list + `data-p-end`.
10. Composer (standard).

##### Sheets / overlays
- Share-invite sheet (header share icon) — standard. Indices: Messages `pa_2`, Gmail `pa_3`, Copy link `pa_4`, More `pa_5`, backdrop `pa_6`, link Copy `pa_7`.
- Attach popover, recording pill, toast — standard.
- No stay sheet here; Details navigates to separate artboards P-Stay-{id}.

##### State & interactions
- `PBase` state: `{ pick: null }` (single-select vote: one stay id or null). `Component` merges `{pT:null, pShare:false, pSent:[]}`.
- `PBase.renderVals()`: `YOU = '/_blob/c58d972a…'`; for each stay: `mine = pick === o.id`; `v = mine ? voters.concat([YOU]) : voters`; `f1/f2/f3 = v[0..2] || ''`; `votes = v.length ? v.length + (v.length===1 ? ' vote' : ' votes') : 'No votes yet'`; `pressed 'true'/'false'`; `label 'Voted ✓'/'Vote'`; `vote: () => setState({pick: mine ? null : o.id})` (tap again to un-vote; tapping another card moves your vote); `btnStyle` green when mine; also returns `voted: !!pick` (unused in template).
- `Component.renderVals()` adds `details: 'P-Stay-' + id + '.dc.html'` per card; `pNext: !!s.pick` → pill appears as soon as ANY card is voted (even Casa Azul/The Palms) and always reads "Villa Sol won · book it".
- `pa_0` open share; `pa_1` toast "Go is lining up 5 more villas".
- Composer/share/attach as shared.

##### Navigation table
| Element | Target |
|---|---|
| Back arrow, trip title | P-TripHome-Zero.dc.html |
| Board icon | P-Board-Poll.dc.html |
| Chip 📍 Goa, 📅 Nov 6–9 | P-Board-Poll.dc.html |
| Chip 🏡 Stay? | P-Chat-StaySuggest.dc.html (self) |
| Chip 💰 ₹21.8k | P-Chat-BudgetSheet-Slider.dc.html |
| Chip 🛫 Bengaluru | P-Chat-FromSheet.dc.html |
| Card "Details" (sol/azul/palms) | P-Stay-sol / P-Stay-azul / P-Stay-palms .dc.html |
| "Villa Sol won · book it" pill (after vote) | P-Chat-PayAsk.dc.html |
| Share sheet WhatsApp group row | P-WA-Compose.dc.html |
| Share sheet WhatsApp tile | P-WA-Pick.dc.html |

##### Data shown (seed values)
Stays list (in `PBase.renderVals`):
| id | name | area | price | rating | reviews | tags | img | voters (seed) | seed tally |
|---|---|---|---|---|---|---|---|---|---|
| sol | Villa Sol | Anjuna | ₹10.8k each | 4.7 | 212 reviews | 🏊 Private pool · 3 rooms | /_blob/87722708aa25c51e09f9d819498d4f74 | Rahul (cb0a34fd…), Arjun (8c7b7cb2…) | "2 votes" |
| azul | Casa Azul | Assagao | ₹9.6k each | 4.5 | 98 reviews | 🌿 Garden · 2 rooms + loft | /_blob/ce9e919f38d04b6f41fe698dc79f51f3 | Priya (234f094a…) | "1 vote" |
| palms | The Palms | Vagator | ₹12.4k each | 4.8 | 341 reviews | 🌅 Sea view · 3 rooms | /_blob/3f7e7be8b9c684e2cdfea669e92d8ddd | — | "No votes yet" |
- After you vote: You avatar appended → Sol "3 votes" (matches PayAsk's "Villa Sol won · 3 votes"), Azul "2 votes", Palms "1 vote".
- Strings: "Budget set: ₹21.8k each"; me: "@Go find us a villa near anjuna, pool would be nice"; Go: "Found 3 pool villas for 6–9 Nov, all under your ₹21.8k each. Vote on the one you like 👉"; Priya: "casa azul is so cute 😍"; "Show 5 more" / "Same dates, same budget"; pill "Villa Sol won · book it"; toast "Go is lining up 5 more villas".

##### Icons & images
- SVG: back arrow 22; board 20; share 20; chip check 9 (stroke 4); map-pin 13 (stroke 2); arrow-right 20 in Show-more tile; chevron 14 (stroke 2.6) in pill; composer +, mic, send 20 (stroke 2); WhatsApp bubble 28 (white stroke 2); share-row chevron 16 (stroke 2.4, #A5ACB8).
- Emoji: chips 📍📅🏡💰🛫; tags 🏊🌿🌅; 👉 in Go msg; 😍 Priya; ★ (text glyph, #B7791F) in price pill; attach 📷📄📍🗳️; share 🌴💬✉️🔗⋯.
- Blobs: trip avatar 63e0220f… (40px); people c58d972a (You), cb0a34fd (Rahul), 234f094a (Priya), 8c7b7cb2 (Arjun) 18px header / 20px vote stack / 30px bubble; Go 5bda4ac2… (20/30px, bg #DCEBFF); stay images per table (236×132 cover, alt = name).

---

#### P-Stay-sol.dc.html — "Go — Villa Sol details"

##### Purpose (1 line)
E9: Stay details bottom sheet for Villa Sol, overlaid on the StaySuggest chat (sheet-as-artboard).

##### Layout top→bottom
**Underlying chat** = StaySuggest verbatim (header v1, same chips, same messages, same poll rail with live vote logic), EXCEPT: no `pNext` "Villa Sol won" pill (neither template nor renderVals). All covered by the backdrop, so not interactive.

**Backdrop** `<a href="P-Chat-StaySuggest.dc.html" aria-label="Close sheet">` inset 0, z5, rgba(11,27,63,0.38).

**Dialog** [StayDetailsSheet → BottomSheet top=96] `role=dialog aria-label="Villa Sol"`, `top: 96px` (sheet height 816px, near full-screen), standard page-sheet styles. Scroll body padding `8px 16px 120px`, gap 12:
1. Title block: "Villa Sol" (22/600) + close X → P-Chat-StaySuggest. Subtitle: "Go checked it’s free for 6–9 Nov and fits everyone’s budget."
2. **Hero image** `<img alt="Villa Sol">` `width 100%; height 190px; radius 20; cover` (single image; no gallery/carousel).
3. **Name + rating row** `flex; align-items flex-start; space-between; gap 10`:
   - Left column gap 2: "Villa Sol" 22/600 ls -0.02em (no line-height set; duplicates sheet title); location row 13px #4A5878 gap 4 with map-pin svg 13: "Anjuna, North Goa · 5 min to Anjuna beach".
   - Right rating pill: `height 30; padding 0 10; radius 999; bg #FFF; border 1px #ECEFF3; flex-shrink 0; nowrap; gap 4; 14/700`: "★ 4.7" + span 500 #4A5878 "· 212 reviews". (★ uncoloured here, inherits #0B1B3F.)
4. **Amenity chips** [AmenityChips → Chip size=sm variant=plain] `flex wrap; gap 6`; each `height 34; padding 0 12; radius 999; bg #FFF; border 1px #ECEFF3; 13/600`: 🏊 Private pool · 🛏️ 3 bedrooms · 🍳 Kitchen · 📶 Wi-Fi · 🅿️ Parking · 🧑‍🍳 Caretaker.
5. **Facts / price card** [FactRows → ListCard + KVRow] `padding 4px 14px; radius 18; bg #FFF; border 1px #ECEFF3`; rows `padding 10px 0; flex space-between; gap 12; 14px`, rows 2–4 `border-top 1px #ECEFF3`; label #4A5878, value 600 right-aligned:
   - Dates — "Fri 6 → Mon 9 Nov · 3 nights"
   - Total for 4 — "₹43,200"
   - Your share — "₹10,800 · inside your ₹21.8k"
   - Cancellation — "Free cancellation till 1 Nov"
6. **Footer** [SheetFooter] (gradient, padding 40px 16px 24px): CTA `<a href="P-Chat-StaySuggest.dc.html">` 56px #000 18/500 "Vote for Villa Sol" (no letter-spacing set). No trust line.
- NOT present: map, gallery, per-night price, price breakdown beyond total/share, host, reviews list.

##### Sheets / overlays
- Stay sheet (static, always shown). Close paths: backdrop, X, CTA — all → StaySuggest.
- Share sheet/toast/attach exist in markup (z40/z60) but unreachable (triggers are under the z5 backdrop).

##### State & interactions
- Same DCLogic as StaySuggest (PBase `pick`, cards with `details`) minus `pNext`. Sheet itself has no state; "Vote for Villa Sol" does NOT set a vote — it just navigates to StaySuggest, where `pick` resets to null.

##### Navigation table
| Element | Target |
|---|---|
| Backdrop, close X, "Vote for Villa Sol" | P-Chat-StaySuggest.dc.html |
| (underlying, unreachable) header/chips/cards | same as StaySuggest |

##### Data shown (seed values)
Villa Sol: image /_blob/87722708aa25c51e09f9d819498d4f74; "Anjuna, North Goa · 5 min to Anjuna beach"; ★ 4.7 · 212 reviews; amenities 🏊 Private pool, 🛏️ 3 bedrooms, 🍳 Kitchen, 📶 Wi-Fi, 🅿️ Parking, 🧑‍🍳 Caretaker; Dates Fri 6 → Mon 9 Nov · 3 nights; Total for 4 ₹43,200; Your share ₹10,800 · inside your ₹21.8k; Free cancellation till 1 Nov. Subtitle "Go checked it’s free for 6–9 Nov and fits everyone’s budget."

##### Icons & images
Map-pin 13; close X 18; hero blob 100%×190 r20. Emoji amenity glyphs listed above. ★ text glyph.

---

#### P-Stay-azul.dc.html — "Go — Casa Azul details"

##### Purpose (1 line)
E10: identical sheet template to P-Stay-sol, Casa Azul data.

##### Layout top→bottom
Byte-identical to P-Stay-sol except these lines (verified by `diff`):
- `<title>`, dialog `aria-label="Casa Azul"`, sheet title "Casa Azul", name "Casa Azul".
- Hero `/_blob/ce9e919f38d04b6f41fe698dc79f51f3` alt "Casa Azul".
- Location: "Assagao, North Goa · 12 min to Anjuna beach".
- Rating pill: "★ 4.5" "· 98 reviews".
- Amenities: 🌿 Garden · 🛏️ 2 rooms + loft · 🍳 Kitchen · 📶 Wi-Fi · 🐶 Pet friendly · 🚗 Parking (note 🚗 here vs 🅿️ in Sol).
- Facts: Dates "Fri 6 → Mon 9 Nov · 3 nights"; Total for 4 "₹38,400"; Your share "₹9,600 · inside your ₹21.8k"; Cancellation "Free cancellation till 30 Oct".
- CTA "Vote for Casa Azul" → P-Chat-StaySuggest.
- Subtitle unchanged: "Go checked it’s free for 6–9 Nov and fits everyone’s budget."

##### Sheets / overlays
Same as Sol.

##### State & interactions
Same as Sol (no vote side-effect).

##### Navigation table
| Element | Target |
|---|---|
| Backdrop, close X, "Vote for Casa Azul" | P-Chat-StaySuggest.dc.html |

##### Data shown (seed values)
See diff list above.

##### Icons & images
Same as Sol; hero blob ce9e919f….

---

#### P-Stay-palms.dc.html — "Go — The Palms details"

##### Purpose (1 line)
E11: identical sheet template, The Palms data.

##### Layout top→bottom
Differs from P-Stay-sol only in:
- `<title>`, dialog `aria-label="The Palms"`, title + name "The Palms".
- Hero `/_blob/3f7e7be8b9c684e2cdfea669e92d8ddd` alt "The Palms".
- Location: "Vagator, North Goa · On the cliff above Vagator beach".
- Rating: "★ 4.8" "· 341 reviews".
- Amenities: 🌅 Sea view · 🛏️ 3 bedrooms · 🏊 Shared pool · 📶 Wi-Fi · 🍹 Bar · 🧹 Daily cleaning.
- Facts: Total for 4 "₹49,600"; Your share "₹12,400 · inside your ₹21.8k"; Cancellation "Non-refundable"; Dates same.
- CTA "Vote for The Palms".

##### Sheets / overlays
Same as Sol.

##### State & interactions
Same as Sol.

##### Navigation table
| Element | Target |
|---|---|
| Backdrop, close X, "Vote for The Palms" | P-Chat-StaySuggest.dc.html |

##### Data shown (seed values)
See list above. Note "Non-refundable" is rendered with the same 600 #0B1B3F value style (no warning colour).

##### Icons & images
Same as Sol; hero blob 3f7e7be8….

---

#### P-Chat-PayAsk.dc.html — "Go — Go asks one person to book"

##### Purpose (1 line)
E12: after the vote, Go posts a "one person books for all" card; the first person to tap "I’ll book for all 4" opens the pay sheet.

##### Layout top→bottom
1. Header **variant 2** (gap 4, padding 0 8px 0 12px, title link h52 padding 0 4px). Back/title → P-TripHome-Zero; board → P-Board-Poll; share → `pa_0`.
2. Chips: 📍 Goa ✓, 📅 Nov 6–9 ✓, **🏡 Villa Sol ✓** (now done, → P-Board-Poll), 💰 ₹21.8k ✓ → BudgetSheet-Slider, 🛫 Bengaluru ✓ → FromSheet.
3. System pill: "Villa Sol won · 3 votes".
4. Go bubble: "Villa Sol is free for your dates 🎉" `<br>` "Only **one** of you needs to book. I’ll split it 4 ways right after." (`<b>one</b>`).
5. **PAY ASK card** [PayAskCard state=open → InChatCard right=16] `margin-left 38px; margin-right 16px; radius 22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08); overflow hidden`:
   - Image block `relative; height 120px`; img Villa Sol (alt "Villa Sol pool") cover.
   - Badge `absolute left 12 top 12; height 26; padding 0 10; gap 4; radius 999; bg #FFF; 12/700; ls 0.04em`: "👤 ONE PERSON BOOKS FOR ALL".
   - Body `padding 12px 16px 16px; flex column; gap 10`:
     - Row baseline space-between gap 8: "Villa Sol" 20/600 ls -0.018em | "₹43,200" 18/700 tabular-nums.
     - Sub 13px #4A5878 ls 0.002em lh 1.35: "3 nights · 4 guests · works out to ₹10,800 each".
     - **Green action panel** [PayAskCard panel + CheckBadge size=28] `radius 18; bg #E3F5EA; padding 4; flex column; gap 4`:
       - Row `padding 8px 10px; gap 10`: 28px circle #16A34A with check svg 15 (stroke 4, white); text column gap 1: "Free cancellation till 1 Nov" 15/700 #0F7A37; "Full refund if plans change" 13px #0F7A37.
       - **Volunteer CTA** [Button variant=primary size=md] `<a href="P-Chat-PaySheet.dc.html">` `height 50; padding 0 18; gap 8; radius 999; bg #000; #FFF; 16/500; ls -0.014em; lh 1.3; nowrap`: "I’ll book for all 4 · ₹43,200".
       - Helper `padding 0 6px 4px; 13px #0F7A37; lh 1.35; centered`: "Only one person taps this. It locks for everyone else once you do."
   - Only ONE volunteer button (no per-person buttons, no "not me").
6. `pSent` + end marker. No next pill (`pNext` not defined).
7. Composer.

##### Sheets / overlays
Share sheet (indices: Messages `pa_1`, Gmail `pa_2`, Copy link `pa_3`, More `pa_4`, backdrop `pa_5`, link Copy `pa_6`), attach, rec, toast — standard.

##### State & interactions
- `PBase.renderVals()` returns `{}`; only shared composer/share state. No booking state; the lock is simulated by the separate PayLocked artboard.

##### Navigation table
| Element | Target |
|---|---|
| Back, title | P-TripHome-Zero.dc.html |
| Board; chips 📍 📅 🏡 | P-Board-Poll.dc.html |
| 💰 chip | P-Chat-BudgetSheet-Slider.dc.html |
| 🛫 chip | P-Chat-FromSheet.dc.html |
| "I’ll book for all 4 · ₹43,200" | P-Chat-PaySheet.dc.html |
| Share WA row / tile | P-WA-Compose / P-WA-Pick |

##### Data shown (seed values)
"Villa Sol won · 3 votes"; Go msg above; card: Villa Sol, ₹43,200, 3 nights · 4 guests · ₹10,800 each, Free cancellation till 1 Nov / Full refund if plans change; CTA and helper strings above.

##### Icons & images
Check svg 15 stroke 4 in green circle; 👤 badge emoji; 🎉 in Go msg; Villa Sol blob 87722708… (full width × 120).

---

#### P-Chat-PayLocked.dc.html — "Go — Others see who is booking"

##### Purpose (1 line)
E13: same card from a non-booker's view — CTA replaced by "Rahul is booking for all 4" live status; Rahul confirms; pill to watch the booking.

##### Layout top→bottom
1. Header variant 2, chips identical to PayAsk (🏡 Villa Sol ✓).
2. System pill "Villa Sol won · 3 votes"; same Go bubble as PayAsk.
3. **PAY LOCKED card** [PayAskCard state=claimed]: identical shell/image/badge/name/price/sub/green panel and the cancellation row as PayAsk; the CTA + helper are replaced by:
   - **Booker row** [PayAskCard booker row · Avatar 32 + LiveDot size=10] `padding 12px; flex; align-items center; gap 10; radius 14; bg #FFF` (white tile inside the #E3F5EA panel): Rahul avatar 32 (`/_blob/cb0a34fd…`); text column gap 1: "Rahul is booking for all 4" 15/700; "You don’t need to do anything. Go adds your share to Settle up." 13px #4A5878 ls 0.002em lh 1.35; trailing `.live` dot 10×10 #16A34A (pulsing ring).
   - No lock icon anywhere; "locked" is conveyed only by the missing CTA + live status.
4. Rahul bubble (white): "on it, using my card 🙌".
5. `sc-if pNext` (pNext: **true**, hint true) → pill `.enter` → `P-Chat-Book.dc.html`: Go avatar + "Watch Rahul book it" + chevron.
6. `pSent`, composer.

##### Sheets / overlays
Standard share (same indices as PayAsk), attach, rec, toast.

##### State & interactions
`PBase` `{}`; `pNext: true` constant. No timers beyond shared.

##### Navigation table
| Element | Target |
|---|---|
| Back, title | P-TripHome-Zero.dc.html |
| Board; chips 📍 📅 🏡 | P-Board-Poll.dc.html |
| 💰 / 🛫 chips | P-Chat-BudgetSheet-Slider / P-Chat-FromSheet |
| "Watch Rahul book it" pill | P-Chat-Book.dc.html |

##### Data shown (seed values)
Booker: Rahul. Strings: "Rahul is booking for all 4", "You don’t need to do anything. Go adds your share to Settle up.", Rahul "on it, using my card 🙌", pill "Watch Rahul book it". Everything else as PayAsk.

##### Icons & images
`.live` dot (CSS), check svg 15, Rahul blob 32px + 30px bubble avatar.

---

#### P-Chat-PaySheet.dc.html — "Go — Trip chat · Pay sheet · simplified, no escrow (v2)"

##### Purpose (1 line)
E14: booker's payment sheet — villa summary, pick UPI or card, note that Go splits into Settle up, "Pay ₹43,200 & book".

##### Layout top→bottom
**Underlying chat** (header **variant 1**, chips with 🏡 Villa Sol ✓): only one Go bubble "Villa Sol is free for your dates 🎉" (no system pill, no card). Back/title → P-TripHome-Zero; board → P-Board-Poll.

**Backdrop** `<a href="P-Chat-PayAsk.dc.html" aria-label="Close sheet">` z5.

**Dialog** [PaySheet → BottomSheet] `aria-label="Book Villa Sol"`, `top: 342px; height: 570px` (both set; 342+570 = 912). Scroll body padding `8px 16px 150px`, gap 12:
1. Title "Book Villa Sol" + X → P-Chat-PayAsk. Sub: "One person pays the villa. Go splits it in Settle up."
2. **Summary row** [Card variant=outline radius=xl] `padding 12; gap 12; radius 20; bg #FFF; border 1px #ECEFF3`: thumb 64×52 radius 12 cover (Villa Sol, alt ""); column gap 1: "Villa Sol · 3 nights" 16/600 ls -0.011em lh 1.3; "Fri 6 → Mon 9 Nov · 4 guests" 13px #4A5878; trailing "₹43,200" 16/700 tabular.
3. **PAY WITH** [Eyebrow + RadioGroup variant=ring + RadioOptionCard] section `flex column gap 8`: label `padding 0 4px; 11/700; #4A5878; ls 0.08em; lh 1.35` "PAY WITH". `role="radiogroup" aria-label="Pay with"` column gap 8; `sc-for methods`:
   - Option `<button role="radio" aria-checked>`: `width 100%; padding 14px 16px; gap 12; radius 18; bg #FFF; text-align left` + selected `border 1.5px solid #0B1B3F` / unselected `border 1px solid #ECEFF3`.
   - Icon 36 circle bg `{o.bg}` with emoji 16px; text column: title 15/600, sub 13px #4A5878.
   - Radio dot `22×22; border-box; radius 999` + selected `border 7px solid #16A34A` (filled ring) / unselected `border 2px solid #CDD3DC`.
4. **Split note** [Note variant=peach + AvatarStack size=22 overlap=-7] `padding 12px 14px; gap 10; radius 18; bg #FFF6F2`: 4 overlapping avatars 22px (border 2px #FFF, margin-left -7px, wrapper padding-left 7px) You/Rahul/Priya/Arjun + text 14px lh 1.4 "You pay the villa directly. Go adds ₹10,800 each to Settle up."
5. **Footer** [SheetFooter]: CTA `<a href="P-Chat-Book.dc.html">` 56px #000 18/500 ls -0.014em: "Pay ₹43,200 & book" (`&amp;`). Trust line with lock svg 13: "Paid straight to Villa Sol · free cancellation till 1 Nov".
- No success state in this artboard (success is P-Chat-Book). No amount editing, no per-person split control, no escrow.

##### Sheets / overlays
Pay sheet (static). Share sheet etc. in markup but unreachable (behind backdrop). Share indices same as PayAsk.

##### State & interactions
- `PBase` state `{ m: 'upi' }`. `M = [['upi','⚡','UPI','rahul@okhdfc','#E3F5EA'], ['card','💳','Card','Visa •• 4821','#F4F5F7']]`. Each → `{e,t,s,bg, sel:'true'|'false', on, pick: () => setState({m:id}), style, dot}`. Tapping a method switches the radio (border + dot change; no animation beyond global transitions).
- Selected method does not affect CTA text or destination.

##### Navigation table
| Element | Target |
|---|---|
| Backdrop, close X | P-Chat-PayAsk.dc.html |
| "Pay ₹43,200 & book" | P-Chat-Book.dc.html |
| (underlying, unreachable) back/title, board, chips | P-TripHome-Zero / P-Board-Poll / BudgetSheet-Slider / FromSheet |

##### Data shown (seed values)
Villa Sol · 3 nights; Fri 6 → Mon 9 Nov · 4 guests; ₹43,200. Methods: ⚡ UPI — rahul@okhdfc (icon bg #E3F5EA, default selected); 💳 Card — Visa •• 4821 (icon bg #F4F5F7). Split: ₹10,800 each to Settle up (4 people). Trust: "Paid straight to Villa Sol · free cancellation till 1 Nov". Underlying Go: "Villa Sol is free for your dates 🎉".

##### Icons & images
Lock svg 13 (trust line); close X 18; emoji ⚡ 💳; thumb 64×52 r12 Villa Sol blob; avatars 22px ×4.

---

#### P-Chat-Book.dc.html — "Go — Trip chat booking"

##### Purpose (1 line)
E15: Go books the villa on Rahul's card in-chat (live checkout card animates to paid), then swaps to a "STAY · BOOKED" ticket and posts a Trip-money receipt split 4 ways.

##### Layout top→bottom
Extra CSS (Book only):
- `.knob{transition:transform 200ms}` + `button[aria-pressed="true"]>.knob{translateX(20px)}` — defined, unused.
- `.seg4{animation:segfill 300ms ease-out 1600ms forwards}`; `@keyframes segfill{to{background:#16A34A}}`.
- `.pay-out{animation:fadeAway 200ms ease-out 1800ms forwards}`; `.pay-in{opacity:0; animation:fadeIn 200ms ease-out 1900ms forwards}`.
- `.bk-out{animation:fadeAway 280ms ease-out 2700ms forwards}`; `.bk-in{animation:popIn 420ms cubic-bezier(0.23,1,0.32,1) 2850ms both}`.
- `.swap{animation:shrink 380ms cubic-bezier(0.23,1,0.32,1) 2750ms both}`; `@keyframes shrink{from{max-height:330px}to{max-height:106px}}`.
- `.late{animation:popIn 380ms cubic-bezier(0.23,1,0.32,1) 3300ms both}`.
- `fadeAway{to{opacity:0;transform:scale(0.97)}}`, `fadeIn{to{opacity:1}}`, `popIn{from{opacity:0;transform:translateY(6px) scale(0.96)} to{opacity:1;transform:none}}`.
- Reduced motion: `.bk-out,.pay-out` → fadeOnly (opacity only); `.bk-in,.late` → fadeIn starting opacity 0.

1. Header variant 1 but: Back + title → **P-Home.dc.html**; board icon `aria-label="Trip plan"` → **P-Board-B.dc.html**; trip avatar span lacks `overflow:hidden`; subtitle markup split across lines (same visual).
2. Chips: 📍 Goa ✓, 📅 Nov 6–9 ✓, 🏡 Villa Sol ✓ → **P-Board-B.dc.html**; 💰 ₹21.8k ✓ → BudgetSheet-Slider; 🛫 Bengaluru ✓ → FromSheet.
3. System pill (margin `0 0 4px`): "Budget set: ₹21.8k each · Go will track spends".
4. Go bubble (**max-width 64%**): "Villa Sol fits: ₹43,200" `<br>` "for 3 nights, ₹10.8k each." `<br>` "Shall I book it now?".
5. Rahul bubble (white, **max-width 70%**, no column wrapper): "yes book it, on my card 🙌".
6. **BOOK card stack** [BookingProgressCard] `.swap` `margin-left 38; margin-right 30; display grid` (both children `grid-area 1/1; align-self start` — cross-fade in place, container height animates 330→106px at 2750ms):
   - **A. In-progress card** [BookingProgressCard · SegmentedProgress size=booking] `.bk-out`: `padding 14px 14px 12px; radius 22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08); flex column; gap 12`.
     - Head row gap 8: `.live` dot 10px #16A34A with static ring `box-shadow 0 0 0 4px #E3F5EA` (pulse animation overrides to 7px rgba(22,163,74,0.12) at 50%); "Booking Villa Sol" flex 1, 16/600 ls -0.011em lh 1.3; **"Watch"** `<a role=button>` 14/600 #A44F3A → `pa_1`.
     - **Mini browser** `radius 16; border 1px #ECEFF3; overflow hidden`:
       - URL bar `padding 7px 12px; gap 6; bg #F4F5F7; #4A5878; 13px`: lock svg 13 + "villasolgoa.com/checkout".
       - Body `padding 12; gap 12`: row gap 12 thumb 64×52 radius 10 (alt "Villa Sol pool") + column: "3 nights · 4 guests" 16/600; "Free cancellation till 1 Nov" 13px #4A5878.
       - Card field `padding 10px 12px; radius 12; border 1.5px solid #0B1B3F; 15/600; ls -0.008em; lh 1.3; tabular; space-between`: "Rahul’s card ••4821" | "₹43,200".
     - Footer row space-between gap 8:
       - 4-step progress: segments `22×5; radius 999; gap 5`; 1–3 #16A34A; 4th `.seg4` #E3E5E8 → #16A34A at 1.6s.
       - Status (grid stack, 13px, tabular, right): `.pay-out` #4A5878 "Paying · cap ₹45,000" (fades out 1.8s) / `.pay-in` #0F7A37 600 "Paid ₹43,200 ✓" (fades in 1.9s).
   - **B. Booked ticket** [BookedTicketCard] `.bk-in` (appears 2.85s): `position relative; flex; align-items stretch; height 104px; radius 20; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08)`:
     - Left photo 104w, `radius 20px 0 0 20px; overflow hidden`, Villa Sol img cover (alt "Villa Sol").
     - Reaction badge `.late` (3.3s) `absolute left 10; bottom -10; padding 2px 8px; radius 999; bg #FFF; shadow 0 1px 2px rgba(11,27,63,0.06), 0 4px 12px rgba(11,27,63,0.04); 13/700; ls 0.002em; gap 3`: 🎉 (15px slot) + "4".
     - Middle `flex 1; padding 12px 14px; column centered; gap 2; border-left 3px solid #16A34A`: "STAY · BOOKED" 11/700 #0F7A37 ls 0.08em; "Villa Sol" 20/600 ls -0.018em lh 1.2; "Fri 6 → Mon 9" 14px #4A5878 ls -0.004em.
     - Right stub `width 84; column centered; gap 6; border-left 1.5px dashed #DDE1E6`; two notch circles 16px #F6F7F9 at `left -9; top -9` and `left -9; bottom -9` (ticket perforation); check circle 30px #16A34A with check svg 16 (stroke 3.2); "3 NIGHTS" 11/700 #4A5878 ls 0.08em.
     - **No confirmation/booking reference number anywhere.**
7. **Late block** [BookingProgressCard late slot] `.late` (3.3s) `flex column; gap 10; margin-top 8`:
   - Go bubble (max 64%, gap 4): "Villa’s on Rahul’s card." `<br>` "Split 4 ways 👇".
   - **Trip-money receipt** [ReceiptCard] wrapper `margin-left 38; margin-right 30; filter drop-shadow(0 4px 10px rgba(11,27,63,0.07))`; inner `padding 18px 14px; bg #FFF; gap 10` with scalloped top+bottom edges via `mask`/`-webkit-mask`: `radial-gradient(circle 6px at 50% 0, transparent 97%, #000) 50% 0 / 16px 51% repeat-x, radial-gradient(circle 6px at 50% 100%, transparent 97%, #000) 50% 100% / 16px 51% repeat-x`.
     - Label `padding 0 2px; 12/700; #4A5878; ls 0.08em`: "ADDED TO TRIP MONEY".
     - Line item `padding 12px 14px; gap 10; radius 14; bg #F4F5F7`: 8px dot #16A34A; "Villa Sol · 3 nights" 16/500 ls -0.011em lh 1.35 (flex 1); Rahul avatar 24px (alt "Paid by Rahul"); "₹43,200" 16/600 tabular.
     - Footer row `padding 0 2px; space-between`: "₹10,800 each · split 4 ways" 14px #4A5878 tabular; **"Fix split"** `<a>` `height 36; padding 0 14; radius 999; bg #F6EAE6; #A44F3A; 14/600` → P-Money-Everyone.dc.html.
8. `sc-if pNext` (true) → pill `.enter` → **P-Chat-Travel.dc.html**: Go avatar + "Next · how everyone gets there" + chevron. (Renders immediately, not delayed with `.late`.)
9. `pSent`, composer ("+" svg lacks stroke-linejoin; visually same).

##### Sheets / overlays
Share sheet indices: Messages `pa_2`, Gmail `pa_3`, Copy link `pa_4`, More `pa_5`, backdrop `pa_6`, link Copy `pa_7`. Attach/rec/toast standard. No booking sheet.

##### State & interactions
- `PBase` `{}`; `pNext: true`. The whole progress→paid→booked sequence is **pure CSS on page load** (no JS state, no replay):
  - 0–1.6s: 3/4 segments green, "Paying · cap ₹45,000".
  - 1.6–1.9s: 4th segment fills green; status cross-fades to "Paid ₹43,200 ✓".
  - 2.7s: progress card fades/scales out; 2.75s container shrinks 330→106px; 2.85s ticket pops in.
  - 3.3s: 🎉4 badge + Go "Split 4 ways" + receipt pop in.
- `pa_1` "Watch" → toast "Opens Go’s live view of the checkout page".
- `pa_0` open share.

##### Navigation table
| Element | Target |
|---|---|
| Back, title | P-Home.dc.html |
| Board ("Trip plan"); chips 📍 📅 🏡 | P-Board-B.dc.html |
| 💰 chip | P-Chat-BudgetSheet-Slider.dc.html |
| 🛫 chip | P-Chat-FromSheet.dc.html |
| "Watch" | toast only |
| "Fix split" | P-Money-Everyone.dc.html |
| "Next · how everyone gets there" | P-Chat-Travel.dc.html |
| Share WA row / tile | P-WA-Compose / P-WA-Pick |

##### Data shown (seed values)
Budget ₹21.8k each; ₹43,200 total / 3 nights / ₹10.8k each; payer Rahul, "Rahul’s card ••4821"; checkout domain villasolgoa.com/checkout; cap ₹45,000; Paid ₹43,200 ✓; ticket "STAY · BOOKED" Villa Sol Fri 6 → Mon 9, 3 NIGHTS; 🎉 4 reactions; receipt Villa Sol · 3 nights ₹43,200 paid by Rahul, ₹10,800 each · split 4 ways. Messages: Go "Villa Sol fits: ₹43,200 / for 3 nights, ₹10.8k each. / Shall I book it now?"; Rahul "yes book it, on my card 🙌"; Go "Villa’s on Rahul’s card. / Split 4 ways 👇"; system "Budget set: ₹21.8k each · Go will track spends"; toast "Opens Go’s live view of the checkout page".

##### Icons & images
Lock svg 13 (URL bar); check svg 16 stroke 3.2 (ticket stub); chevron 14; emoji 🙌 🎉 👇; Villa Sol blob as 64×52 r10 thumb and 104×104 ticket photo; Rahul blob 24px (receipt), 30px (bubble).

---

#### Group notes

##### Shared element names (proposed component names)
- **ChatHeader** [ChatHeader] (2 spacing variants: v1 gap8/pad 0 12/h60, v2 gap4/pad 0 8 0 12/h52) + **ContextChipRow** [FactChipRow / FactChip] (chip with optional done-tick; chip state progresses `🏡 Stay?` → `🏡 Villa Sol ✓`).
- **SystemPill** [SystemPill] ("Budget set…", "Villa Sol won · 3 votes", "Flights to Denpasar on hold · 4 seats").
- **GoBubble / MemberBubble / MyBubble** [Bubble author=go|member|me · GoBubble] (+ inline **@Go mention chip** [MentionChip] inside MyBubble; Go bubble with embedded CTA + privacy footnote in Visa).
- **InChatCard** [InChatCard] shell: `margin-left 38px; margin-right 16px (30px in Book); radius 22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08)` — used by PayAsk/PayLocked card, Visa status card, Book progress card.
- **StayPollCard** [StayCard] (236w rail card) + **ShowMoreTile** [ShowMoreTile] (dashed) + horizontal snap rail [StayPollRail → HorizontalRail].
- **NextStepPill** [NextStepPill] (navy #0B1B3F, Go avatar, chevron, `.enter`) — "Villa Sol won · book it", "Watch Rahul book it", "Next · how everyone gets there".
- **GreenAssurancePanel** [PayAskCard panel] (#E3F5EA, check-circle + #0F7A37 text) with either volunteer CTA or booker-status row.
- **PageSheet** [BottomSheet + SheetHeader/SheetBody/SheetFooter/TrustLine] (backdrop link + dialog + grabber + title/close + scroll body + gradient footer CTA + lock trust line). Tops: Stay 96px, Pay 342px (+explicit height 570), Visa 250px.
- **FactRows** [FactRows → ListCard + KVRow] card (label #4A5878 / value 600 right, 1px #ECEFF3 dividers) — Stay details.
- **AmenityChip** [Chip size=sm variant=plain] (34h, 13/600) vs **ContextChip** [FactChip] (36h, 14/500).
- **RadioOptionCard** [RadioOptionCard + RadioGroup variant=ring] (pay method) with ring dot (7px #16A34A border when selected).
- [Visa-only item omitted — see `G-bali.md`]
- **SectionCaption** [Eyebrow] 11/700 ls 0.08em #4A5878 ("PAY WITH", field captions); 12px variant "ADDED TO TRIP MONEY".
- [Visa-only item omitted — see `G-bali.md`]
- **TicketCard** [BookedTicketCard] (STAY · BOOKED, dashed stub, notches, reaction badge) and **ReceiptCard** [ReceiptCard] (scalloped mask edges) — Book only.
- `.live` [LiveDot] pulsing green dot used for "someone is acting now" (PayLocked booker row, Book in-progress head, recording pill).
- Colour tokens recurring: ink #0B1B3F, muted #4A5878, page #F6F7F9, card border #ECEFF3, chip border #DDE1E6, dashed #CDD3DC, Go bubble #F6EAE6 / Go accent #A44F3A, green #16A34A / green-ink #0F7A37 / green-bg #E3F5EA / green-pressed #F0FAF3, star #B7791F, warm note #FFF6F2, neutral fill #F4F5F7/#F2F2F2, record red #B42318, progress empty #E3E5E8, Go avatar bg #DCEBFF, Goa avatar bg #FFF1DC, Bali avatar bg #E1F0FA, WhatsApp #25D366.

##### Sibling-state collapses
- **Stay-sol / azul / palms → one route** `stay/:id` (or a sheet over StaySuggest keyed by id). Template identical; differ only in: title/aria-label, hero blob, location line, rating + reviews, 6 amenity chips, Total for 4, Your share, Cancellation text, CTA label "Vote for {name}". Data that should come from the stay model: `{id, name, area, areaLong, distanceNote, rating, reviews, img, amenities[6], totalFor4, perPerson, cancellation, voters[]}`. Note list price ("₹10.8k each") and detail share ("₹10,800") are the same number in two formats.
- **StaySuggest + Stay-* sheets** = one chat screen with a `selectedStay` sheet state; the underlying chat in Stay-* is StaySuggest minus the next-pill.
- **PayAsk → PayLocked → PaySheet → Book** = one Trip-chat screen with a progressing **booking state machine** for the stay:
  - `open` (PayAsk): card with volunteer CTA "I’ll book for all 4 · ₹43,200" + helper text. Viewer-agnostic.
  - `claimed_by_other` (PayLocked): same card, CTA replaced by "Rahul is booking for all 4" + `.live` dot; plus booker's chat msg and "Watch Rahul book it" pill.
  - `claimed_by_me` → PaySheet overlay (payment method radio, "Pay ₹43,200 & book"). Note sheet's methods are Rahul's (rahul@okhdfc, Visa ••4821), i.e. PaySheet is shown from the booker's perspective.
  - `paying` → `paid` → `booked` (Book): in-chat progress card (4 segments, "Paying · cap ₹45,000" → "Paid ₹43,200 ✓") that collapses into the STAY · BOOKED ticket, then Trip-money receipt ("Fix split"). Implemented as a timed CSS sequence (1.6s/1.8s/1.9s/2.7s/2.75s/2.85s/3.3s) — production should drive it from real booking events.
  - Chip 🏡 changes from "Stay?" (open, → StaySuggest) to "Villa Sol ✓" (done) once a winner exists. System pill changes "Budget set…" → "Villa Sol won · 3 votes".
- [Visa-only item omitted — see `G-bali.md`]

##### Navigation graph (this group)
StaySuggest —Details→ Stay-{sol|azul|palms} —(close/backdrop/Vote)→ StaySuggest —(vote any)→ pill → PayAsk —"I’ll book…"→ PaySheet —"Pay & book"→ Book —pill→ P-Chat-Travel; Book —"Fix split"→ P-Money-Everyone. PaySheet close → PayAsk. PayLocked —"Watch Rahul book it"→ Book (PayLocked has no inbound link from these files). Visa —"Add my passport details"→ VisaSheet —(close/backdrop/Send to Go)→ Visa. Outbound: P-TripHome-Zero, P-Board-Poll, P-Board-B, P-Home, P-App-Home, P-Chat-BudgetSheet-Slider, P-Chat-FromSheet, P-WA-Compose, P-WA-Pick.

##### Surprises / ambiguities
1. **Vote pill ignores which stay you voted for**: `pNext = !!pick`, label always "Villa Sol won · book it" even if you pick Casa Azul/The Palms; seed tallies make Sol win only if you vote Sol.
2. **"Vote for X" on detail sheets does not vote** — plain link to StaySuggest, whose `pick` resets to null. Intended behaviour presumably: set pick=id and return.
3. **Narrative inconsistency between PaySheet and Book**: PaySheet defaults to UPI rahul@okhdfc; Book shows "Rahul’s card ••4821". Book's chat ("Shall I book it now?" / "yes book it, on my card") implies Go books on Rahul's behalf, while PaySheet implies Rahul pays himself ("You pay the villa directly"). Book also has a payment "cap ₹45,000" that appears nowhere else. Title of PaySheet says "simplified, no escrow (v2)".
4. **Perspective mismatch**: PaySheet's "You" is Rahul (his UPI/card) while header avatars/YOU blob are the default user; PayLocked's "You" is a non-booker. Decide whose session each state represents.
5. **No lock icon** in PayLocked (brief expected one); lock is only implied. No booking/confirmation number anywhere in Book.
6. [Visa-only item omitted — see `G-bali.md`]
7. **Header/nav drift**: Book's back → P-Home and board → P-Board-B ("Trip plan"), while other Goa screens use P-TripHome-Zero and P-Board-Poll ("Trip board"). Visa back → P-App-Home. PayAsk/PayLocked use header spacing variant 2.
8. [Visa-only item omitted — see `G-bali.md`]
9. **Duplicate stay name** in detail sheet (sheet title 22px + name under hero 22px).
10. **Underlying chats differ per sheet artboard**: Stay-* show the full StaySuggest chat; PaySheet shows only one Go bubble (not the PayAsk card); VisaSheet shows only the Go ask (no status card). Treat as artboard simplification, not a real state.
11. PaySheet dialog has both `top: 342px` and `height: 570px`; Book defines unused `.knob` toggle CSS.
12. The Book 🎉 "4" badge on the ticket reads as a reaction count (4 people) — semantics not labelled.
13. Book's progress-card `.live` dot has a static 4px #E3F5EA ring that the `live` keyframe overrides mid-cycle (pulse to 7px rgba(22,163,74,0.12)).
14. Reduced motion in Book: `.bk-out/.pay-out` become opacity-only and `.bk-in/.late` become `fadeIn` from `opacity:0`. But `.swap` (the 330→106px height shrink) and `.seg4`/`.pay-in` have no reduced-motion override, so they still run.
