# H · Trip board (H1, H2, H3)

Sources: `design/prototype/P-Board-Zero.dc.html` (H1), `P-Board-Poll.dc.html` (H2), `P-Board-B.dc.html` (H3). Canvas section "8 · Trip board". PLAN refs: §7 (component names), §8 / §8.1 (route, wiring), §9.3 last paragraph + §9.4 (`selectBoard`), §10 (P3-8, P3-9, P1-6, P2-2), §11 (conventions), §12.1 item 20.

## 1. Spec (normative)

### 1.1 Artboards → route + state

| Artboard | Canvas title (source file) | Route | Underlying chat stage · board derived state | Preset id |
|---|---|---|---|---|
| H1 | Board, empty (`P-Board-Zero`) | `/trips/goa/chat?sheet=board` | `kickoff` (`quickStart: 'skipped'`, From chip unset) · nothing decided: 5 not-set rows, no reminder, spend `empty`, subtitle S1 | `H1` |
| H2 | Board, stay poll open (`P-Board-Poll`; its `<title>` "budget vote" is wrong, ignore it) | `/trips/goa/chat?sheet=board` | `stays` (place + dates decided, budget saved, From "Bengaluru ✓", `stayVote: null`) · WHERE / WHEN / BUDGET decided, STAY vote open, TRAVEL not set; spend `filled` ₹0 (D2); subtitle S2 | `H2` |
| H3 | Board · Go reminds you to book your return (`P-Board-B`) | `/trips/goa/chat?sheet=board` | `plan` (`trip.stage = 'planned'`, `stayBooking.done`, `route.booked = { optionId: 'f2', trip: 'one' }`) · reminder row, STAY booked, TRAVEL partial; spend `filled` 10,800 + 3,960; subtitle S3 | `H3` |

Preset rules (P2-2, `src/data/presets.ts`):
- All three set `tripId: 'goa'` and open the route with `?sheet=board`. An explicit `?sheet=` suppresses the C1 QuickStart auto-open (P3-9).
- H3 = `ensureStage('plan')`, then override `chat.route.booked` to one-way f2. Plain `ensureStage('plan')` books round-trip f2 and gives the **round-trip variant**: no reminder, TRAVEL "Booked", spend ₹18,860 of ₹21,800, ₹2,940 left. That variant matches the money totals in PLAN §9.4.

### 1.2 `BoardSheet` anatomy

All five files are owned by P3-8. Layer-1/2 names are from PLAN §7.

**`sheets/BoardSheet.tsx`**
- Props: `{ tripId: TripId; open: boolean; onOpenChange: (open: boolean) => void; onAction: (target: BoardTarget) => void }`. Reads `useBoard(tripId)` (P2-2, see 1.3). Writes nothing to the store.
- `BottomSheet top={150}`: height `calc(100% - 150px)` (design 762 of 912), with BottomSheet defaults for `rounded-t-8xl`, `bg-canvas`, `shadow-sheet`, `bg-scrim` overlay and the 40×5 grabber. Accessible name "Trip board".
- `SheetHeader`: title "Trip board" (22/600 tracking-h2) and close (`Button variant=white size=icon-sm -mr-1.5`, `X` 18, `aria-label="Close"`) → `onOpenChange(false)`. Subtitle = `board.subtitle`, exactly one of:
  - S1 "Nothing’s locked yet. Tap any item and Go gets it moving."
  - S2 "Polls run only on where, when and stay."
  - S3 "Go keeps this current from your chat."
- `SheetBody className="px-4 pt-2 pb-7 gap-3"`. This overrides the default `pb-[120px]`; the board has no `SheetFooter`. Children in order: the decision card, then `SpendVsBudgetCard`.
- Decision card: `Card variant="float-sm" radius="2xl" className="overflow-hidden px-4 divide-y divide-line"` (white, border line, shadow-float-sm, r22). Children: `GoReminderRow` when `board.reminder` is set, then one element per `board.rows` entry (`kind: 'poll'` → `PollRow`, otherwise `BoardRow`). `divide-y` puts `border-t border-line` on every row after the first, so the reminder (always first) has none.
- Fixed row order: WHERE 📍, WHEN 📅, STAY 🏡, YOUR BUDGET 💰, YOUR TRAVEL 🧳. The reminder sits above them.

**`board/BoardRow.tsx`**
- Props: `{ emoji: string; eyebrow: string; value: string; sub: string; trailing: BoardTrailing; onAction?: () => void }`.
- Layout: `flex items-center gap-3 py-3`.
  - Leading: `<span aria-hidden className="w-5 shrink-0 text-center text-16 leading-none">` (emoji 16 in a 20 slot).
  - Text column: `flex min-w-0 flex-1 flex-col gap-0.5`, holding `Eyebrow tone="muted"` (11/700, tracking-eyebrow, uppercase), the value (`text-16 font-semibold tracking-body leading-[1.3]`) and the sub (`text-13 text-muted tracking-caption`).
- Trailing, by `trailing.kind`:
  - `ask` (Go pill with avatar): `Button variant="tint" size="xs" className="gap-1.5 pl-1.5 pr-3"`, leading `Avatar size={20} kind="go"`, label `trailing.label`. Design: h32, padding `0 12px 0 6px`, 13/600, gap 6.
  - `change`: `Button variant="tint" size="xs" className="px-3.5"` "Change". Design: h32, padding 0 14.
  - `status`: `StatusPill`, i.e. Badge `size="md"` (h-7 px-[10px] 13/600 tracking-caption). Tone `success` → Badge `success-soft` "Booked". Tone `amber` → Badge `amber` "1 of 2". Rendered as an inert `<span>`.
- `ask` and `change` call `onAction`. `status` has no handler.

**`board/PollRow.tsx`**
- Props: `{ emoji: string; eyebrow: string; value: string; sub: string; cta: string; options: { id: string; name: string; img: string; votes: number }[]; onAction: () => void }`.
- Layout: `flex flex-col gap-2.5 pt-3 pb-3.5`.
- Top line: same as BoardRow, except:
  - Eyebrow is `tone="go"`: "STAY · VOTE OPEN".
  - Value: "3 villas in the running".
  - Sub: "{voted} of 4 voted · closes in 2 hrs". The design shows "2 of 4 voted · closes in 2 hrs"; see D4.
  - Trailing: black "Vote", `Button variant="primary" size="sm" className="h-[34px] px-[18px] tracking-h4"` (14/500).
- Thumbnail strip: `flex gap-1.5 pl-8`. Each option is a `flex flex-1 flex-col gap-1` column holding:
  - a `next/image` (`width={160} height={52}`, `className="h-[52px] w-full rounded-lg object-cover"`, `alt={name}`);
  - a caption, `text-12 font-semibold`, "{name} · {votes}" (design: "Villa Sol · 2", "Casa Azul · 0", "The Palms · 0").
- Thumbnails are not interactive. Vote calls `onAction` and does **not** vote in place.

**`board/GoReminderRow.tsx`**
- Props: `{ eyebrow: string; value: string; sub: string; cta: string; onAction: () => void }`.
- Layout: `-mx-4 flex items-center gap-3 bg-go-note px-4 py-3`. The tint runs full-bleed across the card.
  - Leading: `Avatar size={22} kind="go"` (alt "Go").
  - Text column: as BoardRow, with `Eyebrow tone="go"`.
  - Trailing: `Button variant="primary" size="xs" className="px-3.5 font-semibold"` (h32, 13/600; overrides primary's `font-medium`).
- Copy (verbatim): eyebrow "GO · YOUR RETURN ISN’T BOOKED", value "Book your way back on Mon 9 Nov", sub "You’re in on Fri. Evening flights back are filling up.", CTA "Find return". The row cannot be dismissed.

**`board/SpendVsBudgetCard.tsx`**
- Props: `{ spend: BoardSpend }`. Both variants start with `Eyebrow tone="muted"` "YOUR SPEND VS YOUR BUDGET".
- **`empty`** variant:
  - Card: `Card variant="dashed" radius="2xl" className="flex flex-col gap-2.5 px-4 py-3.5"`.
  - Hatched bar: `<div role="img" aria-label="No budget yet" className="h-3 rounded-full bg-[repeating-linear-gradient(135deg,var(--color-line)_0_6px,var(--color-surface-2)_6px_12px)]" />`. This equals `repeating-linear-gradient(135deg,#ECEFF3 0 6px,#F4F5F7 6px 12px)`.
  - Caption: `text-13 text-muted tracking-caption` "Shows up once you set your budget. Only you see it."
- **`filled`** variant:
  - Card: `Card variant="float-sm" radius="2xl" className="flex flex-col gap-2.5 px-4 py-3.5"`.
  - Header: `flex items-baseline justify-between gap-2.5`, with the Eyebrow and `<span className="text-16 font-semibold tracking-body tabular-nums">{inr(stay + travel)}<span className="font-medium text-muted"> of {inr(budget)}</span></span>`. Example: "₹14,760 of ₹21,800".
  - Bar: stacked `SplitBar` (`h-3 gap-[3px] rounded-full overflow-hidden bg-line`; segments `rounded-full`, width via inline ``style={{ width: `${pct}%` }}``, the one allowed dynamic style).
    - Segments: Stay `bg-info` (#3E73D6) with `pct = round1(stay / budget * 100)` (49.5), then Travel `bg-[#E07A5F]` (token gap, see 1.8) with `round1(travel / budget * 100)` (18.2).
    - Zero-value segments are not rendered.
    - `role="img"`, `aria-label` = `Stay {inr(stay)}, travel {inr(travel)}, {inr(left)} left`. Example: "Stay ₹10,800, travel ₹3,960, ₹7,040 left".
  - Legend: `flex items-center gap-3.5 text-13 text-muted`.
    - "Stay" and "Travel", each after a `size-2 rounded-full` dot (`bg-info` / travel colour). The dot-to-label gap is `gap-1.5`; the design does not state it, so this borrows the CategoryTile legend gap.
    - `<span className="ml-auto font-semibold text-success-ink tabular-nums">{inr(left)} left</span>`. Example: "₹7,040 left".
  - `round1 = (x: number) => Math.round(x * 10) / 10`. `inr` comes from `lib/format.ts` (en-IN grouping).

**Mapping rules (decision → row variant)**, computed in `selectBoard` and rendered by BoardSheet:

| Decision state | Row variant | Trailing control |
|---|---|---|
| not set | `BoardRow` | `ask`: tint pill + Go avatar 20 (Ask Go / Find dates / Set / Find routes) |
| decided | `BoardRow` | `change`: tint pill "Change" |
| vote open (STAY only) | `PollRow` | black "Vote" |
| booked | `BoardRow` | `status` success "Booked" (inert) |
| partially booked (TRAVEL one-way) | `BoardRow` + `GoReminderRow` inserted first | `status` amber "1 of 2" (inert) |

### 1.3 Derived state: `selectBoard(tripId)`

Types are exported from `src/store/selectors.ts` (P2-2):

```ts
export type BoardTarget = 'where' | 'when' | 'stay' | 'budget' | 'travel';
export type BoardTrailing =
  | { kind: 'ask'; label: string }                                  // not set
  | { kind: 'change' }                                              // decided
  | { kind: 'status'; tone: 'success' | 'amber'; label: string };   // booked / partial (inert)
export type BoardRowModel =
  | { kind: 'row'; key: BoardTarget; emoji: string; eyebrow: string; value: string; sub: string; trailing: BoardTrailing }
  | { kind: 'poll'; key: 'stay'; emoji: string; eyebrow: string; value: string; sub: string; cta: string;
      options: { id: Stay['id']; name: string; img: string; votes: number }[] };
export interface BoardReminder { eyebrow: string; value: string; sub: string; cta: string; target: 'travel' }
export type BoardSpend =
  | { kind: 'empty' }
  | { kind: 'filled'; stay: number; travel: number; budget: number; left: number };   // whole rupees
export interface BoardModel { subtitle: string; rows: BoardRowModel[]; reminder?: BoardReminder; spend: BoardSpend }
```

- `selectBoard(state, tripId): BoardModel` is pure.
- P2-2 also exports `useBoard(tripId)`: `useShallow` over the inputs below, then `useMemo(selectBoard)`. This is needed because zustand 5 loops on selectors that return fresh objects.
- Every row's action target is its `key`.

**Inputs**
- `chat[tripId]`: `stageIndex`, `stayVote`, `stayBooking.done`, `budget.saved`, `route.booked` (`{ optionId, trip: 'one' | 'round' }`; use P2-2's literal values).
- `selectChips(tripId)`.
- Seeds:
  - `stays.ts`: `name`, `img`, `voters`.
  - `routes.ts`: `one` / `round` fares.
  - `copy.board`: every string below, verbatim.
  - Numeric constants: `MY_BUDGET_INR = 21800` (the literal "₹21.8k", §12.1 #6) and `MY_STAY_SHARE_INR = 10800` (₹43,200 / 4).
- `chat.cab` is ignored. It is not a board row and not part of spend ("Travel covers flights, trains and buses.").

**Row predicates.** Board rows mirror the header chips, so a chip's ✓ and its board row always agree.
- WHERE decided ⟺ `chips.where.state === 'set'` (from `dates-talk` on). The winner is always Goa (§12.1 #5).
- WHEN decided ⟺ `chips.when.state === 'set'` (from `budget` on).
- STAY, first match wins:
  1. `stayBooking.done` → booked;
  2. `chips.stay.state === 'set'` (from `pay` on) → decided;
  3. current stage is `stays` → vote open;
  4. otherwise → not set.
- BUDGET decided ⟺ `budget.saved`.
- TRAVEL: `route.booked?.trip === 'round'` → booked; `=== 'one'` → partial, plus the reminder; `undefined` → not set.

**Copy per row state** (verbatim, curly apostrophes kept; ⚑ marks a state not drawn in H1–H3, coded with `// DESIGN-ASSUMPTION`):

| Row | State | Eyebrow | Value | Sub | Trailing |
|---|---|---|---|---|---|
| 📍 | not set | WHERE | Not decided | Go suggests places from everyone’s answers | ask "Ask Go" |
| 📍 | decided | WHERE | Goa | All four agreed in the chat | change |
| 📅 | not set | WHEN | Not set | No dates shared yet | ask "Find dates" |
| 📅 | decided | WHEN | Fri 6 – Mon 9 Nov | Diwali weekend | change |
| 🏡 | not set | STAY | Not booked | Needs a place and dates first | ask "Ask Go" |
| 🏡 | vote open | STAY · VOTE OPEN (go tone) | 3 villas in the running | {voted} of 4 voted · closes in 2 hrs | PollRow, cta "Vote" |
| 🏡 | decided, not booked ⚑ | STAY | Villa Sol, Anjuna | Won the vote · booking next | change |
| 🏡 | booked | STAY | Villa Sol, Anjuna | Booked by Rahul · ₹10.8k each | status success "Booked" |
| 💰 | not set | YOUR BUDGET | Not set | Only you see it | ask "Set" |
| 💰 | decided | YOUR BUDGET | ₹21.8k, all-in | Only you see this | change |
| 🧳 | not set | YOUR TRAVEL | Not added | Each person picks their own way in | ask "Find routes" |
| 🧳 | partial (one-way) | YOUR TRAVEL | Flight there booked | BLR → GOX · 6E 5313 · return not booked | status amber "1 of 2" |
| 🧳 | booked (round) ⚑ | YOUR TRAVEL | Your flights booked | BLR ⇄ GOX · both ways | status success "Booked" |

Notes on the copy:
- Round-trip strings are borrowed verbatim from the J1 trip-home flights row.
- "Booked by Rahul" stays literal even if you paid (§12.1 #7).
- The TRAVEL strings stay the IndiGo f2 itinerary whatever was picked (§12.1 #12).

**Reminder.** Present ⟺ TRAVEL is partial. It uses the copy in 1.2, with `target: 'travel'`.

**Poll model** (STAY vote open):
- `options = stays.map(s => ({ id: s.id, name: s.name, img: s.img, votes: s.voters.length + (stayVote === s.id ? 1 : 0) }))`.
- `voted = new Set(stays.flatMap(s => s.voters)).size + (stayVote ? 1 : 0)`.
- "4" and "closes in 2 hrs" are literal seed text (§12.1 #1, #4).
- The E8 seed voters are Villa Sol 2 (Rahul, Arjun), Casa Azul 1 (Priya), The Palms 0, so the board shows "3 of 4 voted" before your vote (D4).

**Subtitle**
- S1 when all five rows are not set.
- S3 when WHERE, WHEN and STAY are all decided or booked.
- S2 otherwise.

**Spend**
- `!budget.saved` → `{ kind: 'empty' }`.
- Otherwise `{ kind: 'filled', budget, stay, travel, left }`, where:
  - `budget = MY_BUDGET_INR`;
  - `stay = stayBooking.done ? MY_STAY_SHARE_INR : 0`;
  - `travel = route.booked ? (route.booked.trip === 'one' ? opt.one : opt.round) : 0`, with `opt` = the `routes.ts` option `route.booked.optionId`;
  - `left = budget - stay - travel`.
- **H3**: stay 10,800 + travel 3,960 (f2 one-way) = **14,760**; left 21,800 − 14,760 = **7,040**; segments 10,800 / 21,800 = **49.5%**, 3,960 / 21,800 = **18.2%**.
- Round-trip variant: 10,800 + 8,060 = 18,860; left 2,940; segments 49.5% / 37%. This must equal `selectMoney(tripId, 'me')` (§9.4: mine ₹18,860, left ₹2,940).
- **H2**: 0 + 0, which renders "₹0 of ₹21,800", an empty track and "₹21,800 left".
- **Design contradiction:** the H2 artboard keeps the empty dashed card ("Shows up once you set your budget. Only you see it.") although its own BUDGET row shows ₹21.8k saved. Chosen behaviour: the card is filled as soon as `budget.saved` is true (deviation D2). PLAN §9.3 only requires a filled card for H3, so this is compatible with PLAN.

### 1.4 Interactions

BoardSheet only calls `onAction(target)` / `onOpenChange`. P3-9 implements both in `chat/useChatSheets.ts`, following PLAN §8.1.

| Trigger | Target | Behaviour (P3-9) |
|---|---|---|
| WHERE "Ask Go" / "Change" | `where` | close board → `ensureStage('places')` → scroll `[data-card="place-poll"]` (the places card) into view |
| WHEN "Find dates" / "Change" | `when` | close board → `ensureStage('dates-poll')` → scroll `[data-card="dates-poll"]` |
| STAY "Ask Go" / "Change" / PollRow "Vote" | `stay` | close board → `ensureStage('stays')` → scroll `[data-card="stay-poll"]` (stays rail); no vote is cast |
| YOUR BUDGET "Set" / "Change" | `budget` | `ensureStage('budget')` → replace `?sheet=board` with `?sheet=budget` (BudgetSheet) |
| YOUR TRAVEL "Find routes", reminder "Find return" | `travel` | `ensureStage('travel')` → replace `?sheet=board` with `?sheet=route` (RouteSheet) |
| "Booked" / "1 of 2" chips, poll thumbnails | — | inert |
| Close X, scrim, Esc, drag down | — | `onOpenChange(false)` removes `sheet` (`router.back()` if it was pushed, `replaceState` if opened by tap, per §8). Stage and chat scroll stay as they were. No navigation: the chat under the sheet is the chat the board was opened from. |
| Chat header board icon (`ChatHeader onBoard`) | — | toggles the sheet: opens `?sheet=board` when closed, closes it when open. While the board is open the scrim covers the header, so in practice it only opens (same as the design). |

Rules:
- `ensureStage` only moves forward. For rows that are already decided (H2/H3) it does nothing, and the earlier card is still rendered (the thread shows stages 0..stageIndex), so the scroll lands on it.
- From H1, any row fast-forwards through every earlier default completion. For example, "Find routes" in `kickoff` lands in `travel`. This matches the design, which jumps to `P-Chat-RouteSheet`.
- The scroll runs after the sheet's close transition (~350ms), with `scrollIntoView({ behavior: 'smooth', block: 'center' })`. P3-9's `MessageRenderer` adds `data-card={card.kind}` to each card wrapper.
- Board → budget/route sheet is a single URL replace, with no chat-only entry in between. Back then closes that sheet and lands on the chat.
- The share sheet cannot be reached while the board is open (same as the design).

### 1.5 Underlying chat note

- **H1** underlay: the `kickoff` thread (Go "What’s the plan, crew? 🌴 / Where are we thinking of going?"). Everything below y=150 is covered.
- **H2/H3** underlay in the design: both artboards draw the **`plan`-stage thread**: me (@Go) "can you sort the whole plan?", Go "Here's your Goa…", THE PLAN card, 🔥 4, Rahul "GOOO 😭".
  - In the build, H3 shows that `plan` thread.
  - H2 shows the `stays` thread instead, because the store cannot hold the plan card and an open stay vote at the same time (D5). The H2 header chips (Goa ✓, Nov 6–9 ✓, Stay?, ₹21.8k ✓, Bengaluru ✓) already match `stays`.
- **Stamp on the plan card.** The plan card in the board artboards carries a 76×76 `BoardStamp` at `absolute top-3 right-3 rotate-[-10deg] opacity-[0.92]`. PLAN's `PlanCard` (P3-7, artboard F8) uses `WaxSeal` (92×92) instead.
  - **Decision:** `PlanCard` renders `WaxSeal`.
  - `BoardStamp` is still built (P1-6) and kept as a component, but stays unused unless the user prefers it. This is an **open question** for the user.
- **`BoardStamp` spec for P1-6** (`src/components/icons/custom/BoardStamp.tsx`):
  - Props: `{ ring: string; line1: string; line2: string; className?: string }`. Seed values: ring "GOA · INDIA · GOA · INDIA ·", line1 "NOV 6–9", line2 "2026".
  - Root: `<svg width="76" height="76" viewBox="0 0 76 76" aria-hidden>`, white throughout (`text-white`, `currentColor` for fills and strokes), font inherited from `font-sans` (Figtree).
  - Text path: `<defs><path id={pid} d="M38 38 m-26 0 a26 26 0 1 1 52 0 a26 26 0 1 1 -52 0" /></defs>`, a circle of r=26 used only for the ring text.
  - Rings: outer `<circle cx="38" cy="38" r="35" fill="none" strokeWidth={1.5} />`; inner `<circle cx="38" cy="38" r="19" fill="none" strokeWidth={1} />`.
  - Ring text: ``<text fontSize={8.5} fontWeight={700} letterSpacing={2.6}><textPath href={`#${pid}`}>{ring}</textPath></text>``.
  - Centre text:
    - `line1` at `x=38 y=37`, `textAnchor="middle"`, 9/800.
    - `line2` at `x=38 y=47`, 7.5/600, `letterSpacing={1}`. Its `textAnchor="middle"` is assumed (the design only states it for line 1).
  - ``pid = `stamp-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}` ``. The design's fixed `id="stamp"` would collide when two stamps render on one page.

### 1.6 Deviations from the design

Each is flagged in code with `// DESIGN-ASSUMPTION`.

- **D1 (PLAN §12.1 #20).** The board is a vaul sheet over the live chat route (`?sheet=board`), not a page.
  - Close and scrim only remove the param. The design navigated to the originating chat file, which is the same as the underlay here.
  - Row actions close the sheet and deep-link inside the chat (`ensureStage` + scroll / open a sheet) instead of loading other chat files.
- **D2.** The spend card is filled once `budget.saved` is true, so H2 shows "₹0 of ₹21,800 … ₹21,800 left" instead of the design's self-contradicting empty card. The empty variant shows only while the budget is unset.
- **D3 (not a deviation, recorded for clarity).** PollRow "Vote" does **not** vote in place. As designed, it deep-links to the stay rail (`P-Chat-StaySuggest`). Thumbnails stay inert.
- **D4.** The H2 tally is derived from seed voters plus your vote (§12.1 #5). With the E8 seed that gives "Villa Sol · 2", "Casa Azul · 1", "The Palms · 0" and "3 of 4 voted". The H2 artboard's "Casa Azul · 0" and "2 of 4 voted" disagree with the E8 stay poll.
- **D5.** Underlays:
  - H2 uses the `stays` thread, not the plan card.
  - The H1 header subline uses the `kickoff` stage copy (§9.3), not "Rahul joined". It sits under the scrim either way.
- **D6.** The sheet animates in and supports drag and Esc to dismiss (vaul). The design's sheet is static with no drag handler.
- **D7.** States not drawn in H1–H3 use the ⚑ copy in 1.3 (STAY won but not booked, TRAVEL round trip). STAY's "Needs a place and dates first" stays literal in the `dates-*` / `budget` stages, even though place and dates are set by then.
- **D8.** Chat header (P2-5/P3-9, not the board):
  - Back and title always go to `/trips/[id]` (§8.1), and trip home picks zero or populated itself. This fixes H2's back link to the *empty* home.
  - The header is standardised at 170px (§12.1 #8); H2/H3 are 178px in the design. The sheet top stays 150.
- **D9.** BoardStamp ids are namespaced per instance with `useId`.
- **D10 (kept as designed).** H1's "locked" STAY row keeps an enabled "Ask Go". Tapping it fast-forwards place and dates through `ensureStage('stays')`.

### 1.7 Acceptance checklist

**Common to all three**
- [ ] `pnpm exec tsc --noEmit && pnpm lint` are clean.
- [ ] No inline `style` except segment widths. No raw hex except `#E07A5F` (reported as a token gap).
- [ ] The sheet renders inside the 450px frame at any viewport width.
- [ ] The sheet's top edge is 150px below the frame top. Top corners r28, 40×5 grabber, `bg-canvas`, `shadow-sheet`, scrim `bg-scrim`.
- [ ] Dialog accessible name "Trip board". Close button labelled "Close". Emoji are `aria-hidden`.

**H1 · Board, empty**
- [ ] `/home?preset=H1` opens `/trips/goa/chat?sheet=board` over the `kickoff` thread, with no QuickStart sheet.
- [ ] Subtitle S1 verbatim.
- [ ] Five rows in order with the "not set" strings from 1.3. Every trailing control is a tint pill with a 20px Go avatar: Ask Go / Find dates / Ask Go / Set / Find routes.
- [ ] No reminder row and no PollRow.
- [ ] Dashed spend card: eyebrow, hatched 12px bar (`aria-label="No budget yet"`), and the caption "Shows up once you set your budget. Only you see it."
- [ ] Row actions:
  - WHERE → board closes, stage `places`, place card scrolled into view.
  - WHEN → `dates-poll` card.
  - STAY → stays rail.
  - Set → BudgetSheet open at `budget`.
  - Find routes → RouteSheet open at `travel`.
- [ ] X, scrim and Esc each remove `?sheet=board` and leave the stage at `kickoff`.

**H2 · Board, stay poll open**
- [ ] `/home?preset=H2` opens at stage `stays`. Chips read Goa ✓, Nov 6–9 ✓, Stay?, ₹21.8k ✓, Bengaluru ✓.
- [ ] Subtitle S2.
- [ ] Decided rows, each with a "Change" pill:
  - WHERE "Goa" / "All four agreed in the chat";
  - WHEN "Fri 6 – Mon 9 Nov" / "Diwali weekend";
  - YOUR BUDGET "₹21.8k, all-in" / "Only you see this".
- [ ] YOUR TRAVEL "Not added" / "Each person picks their own way in", with "Find routes" (avatar pill).
- [ ] PollRow:
  - Eyebrow in `text-go`: "STAY · VOTE OPEN".
  - "3 villas in the running" and "3 of 4 voted · closes in 2 hrs" (D4).
  - Black "Vote", h34, 14/500.
  - Strip indented 32px, three thumbnails 52px tall with r10, captioned "Villa Sol · 2", "Casa Azul · 1", "The Palms · 0".
- [ ] Vote closes the board and scrolls to the stay rail. No vote is recorded.
- [ ] After voting Casa Azul in chat and reopening the board: "Casa Azul · 2" and "4 of 4 voted".
- [ ] Spend card is filled (D2): "₹0 of ₹21,800", empty `bg-line` track, Stay/Travel legend, "₹21,800 left".

**H3 · Board · Go reminds you to book your return**
- [ ] `/home?preset=H3` opens at stage `plan` (`trip.stage === 'planned'`). Chips include "Villa Sol ✓". The underlay shows PlanCard with WaxSeal.
- [ ] Subtitle S3.
- [ ] Reminder row:
  - First in the card, full-bleed `bg-go-note` edge to edge, no top border. The WHERE row below it has a `border-line` top border.
  - 22px Go avatar; eyebrow in `text-go` "GO · YOUR RETURN ISN’T BOOKED"; "Book your way back on Mon 9 Nov"; "You’re in on Fri. Evening flights back are filling up."
  - Black "Find return" (h32, 13/600) closes the board and opens RouteSheet.
- [ ] WHERE / WHEN / YOUR BUDGET as in H2.
- [ ] STAY "Villa Sol, Anjuna" / "Booked by Rahul · ₹10.8k each" with a green "Booked" chip (h28, inert).
- [ ] YOUR TRAVEL "Flight there booked" / "BLR → GOX · 6E 5313 · return not booked" with an amber "1 of 2" chip (`bg-amber-soft text-amber-ink`, inert).
- [ ] Spend card:
  - Header "₹14,760 of ₹21,800", with "of ₹21,800" at 500 muted.
  - Segments `bg-info` 49.5% and travel 18.2%, 3px gap, `bg-line` track.
  - `aria-label="Stay ₹10,800, travel ₹3,960, ₹7,040 left"`.
  - Legend ends with a right-aligned "₹7,040 left" in `text-success-ink` 600.
- [ ] Round-trip variant (`ensureStage('plan')` with no override): no reminder; YOUR TRAVEL "Your flights booked" / "BLR ⇄ GOX · both ways" / "Booked"; "₹18,860 of ₹21,800", "₹2,940 left", segments 49.5% + 37%.
- [ ] Close removes `?sheet` and the stage stays `plan`.

### 1.8 Consumed by tasks

- **P3-8 Board sheet** (sonnet, batch 3A).
  - Owns `sheets/BoardSheet.tsx`, `board/BoardRow.tsx`, `board/PollRow.tsx`, `board/GoReminderRow.tsx`, `board/SpendVsBudgetCard.tsx` and, proposed below, `money/SplitBar.tsx`.
  - Builds 1.2 exactly.
  - Consumes Button, Badge/StatusPill, Avatar, Card, Eyebrow, BottomSheet (P1), `inr` (P2-3), and `useBoard` + the types (P2-2).
- **P3-9 Chat page** (opus, batch 3B).
  - Mounts `<BoardSheet tripId open={sheet === 'board'} onOpenChange onAction>` in `ChatScreen` and wires `ChatHeader onBoard`.
  - Implements the 1.4 table in `useChatSheets`.
  - Adds `data-card={kind}` on card wrappers in `MessageRenderer`.
  - An explicit `?sheet=` suppresses the QuickStart auto-open.
- **P1-6 Custom SVGs:** `BoardStamp` per 1.5. It ships unused, pending the open question.
- **P2-2 Store:**
  - `selectBoard`, `useBoard`, and the `Board*` types (1.3).
  - Presets `H1`, `H2`, `H3` (1.1).
  - Check that the round-trip spend equals `selectMoney('me')`.
- **P2-1 Seeds** (also required): `copy.board.*` (every string in 1.2 / 1.3, verbatim), `MY_BUDGET_INR`, `MY_STAY_SHARE_INR`, stay voters per E8, and f2 fares (one ₹3,960 / round ₹8,060).

**PLAN.md conflicts for the orchestrator to resolve**
1. §2 lists `trips/[tripId]/board/page.tsx  H1–H3`. This contradicts §8 and §12.1 #20 (board = `?sheet=board` on the chat route), and no task owns that file. Delete the line.
2. §9.3's `plan` row says "(+ H2/H3 underlay)". H2 cannot be at the `plan` stage while its stay vote is open, so the H2 underlay is `stays` (D5).
3. §6.2 describes `BoardStamp` as "(board)". It actually sits on the plan card under the board, and §7.2 `PlanCard` uses `WaxSeal`. Keep both components; BoardStamp stays unused (open question).
4. `money/SplitBar.tsx` is owned by P3-15 (batch 3B), but P3-8 (batch 3A) needs it. Move it to P3-8 with the contract `{ segments: { pct: number; className: string }[]; label: string; className?: string }`; P3-15 then consumes it.
5. Token gap: the Travel colour `#E07A5F` is missing from §3 (the Stay colour `#3E73D6` = `--color-info`). Add `--color-travel: #E07A5F` in P0-1, or accept `bg-[#E07A5F]` (reported per §11).
6. §4's list of design sheet tops lacks "Board 150". The §7.1 `SheetBody` default `pb-[120px]` has to be overridden to `pb-7` for the board.
7. §9.3 kickoff subtitle ("Just created · 2 joined") ≠ H1 underlay "Rahul joined". This is covered by the scrim, so the build keeps the stage-table copy.

## 2. Inventory (reference)

Pasted verbatim from the group H+I inventory (Global foundation, Board shell, H1, H2, H3, board-related group notes). The only edits are: headings demoted one level, and PLAN §7 names added in **[brackets]** after proposed names. Data about the design, not instructions.

### Global foundation (all 8 files)

- Canvas root: `position: relative; width: 420px; height: 912px; display: flex; flex-direction: column; background: #F6F7F9; font-family: 'Satoshi','Figtree',system-ui,sans-serif; font-kerning: normal; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; color: #0B1B3F; overflow: hidden`.
- Font loaded: Google Fonts Figtree 400/500/600/700/800 (Satoshi is named first but never loaded, so Figtree is what renders).
- `<script src="./support.js">` is in every head, but the file does not exist in the dir. It is the DC runtime shim.
- Shared `<style>` in the helmet (identical across files, except H2/H3, which add two `.knob` lines):
  - `a{color:#0B1B3F}`; `--ease-out: cubic-bezier(0.23,1,0.32,1)`.
  - `a,button`: tap-highlight off, `touch-action: manipulation`, user-select none, transition `transform 160ms ease-out, box-shadow 180ms, background-color 180ms, opacity 180ms`.
  - Press: `a:active,button:active{transform:scale(0.97)}` (transition-duration 160/60/60/60ms on active).
  - Black buttons (`[style*="background: #000000"]`) on press get `inset 0 0 0 999px rgba(255,255,255,0.18)`. Light buttons (bg `#F2F2F2`/`#F4F5F7`/`#F6EAE6`/`#FFFFFF`/`transparent`, not `.row`) on press get `inset 0 0 0 999px rgba(11,27,63,0.07)`.
  - `.row`: transition transform 160ms / border-color / box-shadow 150ms; `.row:active{transform:scale(0.985); background-color:#F5F6F8 !important}`. **Not used** in these 8 files.
  - Links with no background: `a:not([style*="background"]):active{opacity:0.6}`; on hover-capable devices `a:hover{color:#22365F}`.
  - `.tick`: 200ms transform+opacity, enters from scale(.8)/opacity 0. **Not used** here.
  - `.enter`: 220ms opacity+transform, enters from opacity 0 / translateY(6px) via `@starting-style`. Used on the share dialog, toast, attach menu, recording pill and each sent chat message.
  - `.live`: `animation: live 1600ms ease-in-out infinite`, keyframe at 50% `box-shadow: 0 0 0 7px rgba(22,163,74,0.12)`. Used on the recording dot.
  - Reduced motion: no press scale; `.tick`/`.enter` become opacity-only (150ms); `.live` off.
  - `input::placeholder{color:#4A5878}`; `[role="dialog"]>div>*{flex-shrink:0}`.
  - H2/H3 only: `.knob{transition:transform 200ms ease-out}` and `button[aria-pressed="true"]>.knob{transform:translateX(20px)}`. This is **unused** CSS: no `.knob` element exists in either file.
- Palette tokens seen:
  - Ink and surfaces: ink `#0B1B3F`; secondary text `#4A5878`; tertiary text, chevrons and zero amounts `#A5ACB8`; page/sheet bg `#F6F7F9`; card `#FFFFFF`.
  - Lines and greys: hairline `#ECEFF3`; chip border, grabber and dashed borders `#DDE1E6`; grey fill `#F4F5F7`; "Open" button `#F2F2F2`.
  - Go accents: Go tint `#F6EAE6`; Go accent `#A44F3A`; Go avatar bg `#DCEBFF`; quote rule `#F0C9BC`; reminder tint `#FFF6F2`.
  - Status: trip avatar bg / warning pill bg `#FFF1DC`; warning text `#9A5B00`; success pill `#E3F5EA`/`#0F7A37`; check badge `#16A34A`; recording `#B42318`; WhatsApp `#25D366`.
  - Category colours: Stay `#3E73D6` (tile `#E3EEFB`); Travel `#E07A5F` (tile `#FBE8DC`).
  - Primary button `#000000`. Image placeholders `#C9D6E2` and `#E9EDF2`.
- Toast **[Sonner `<Toaster>` / `toastGo`]** (all 8 files, identical): `sc-if pToast`, `.enter`, `role=status`. Styles: absolute, left 50% + `translateX(-50%)`, bottom 108px, z 60, max-width 340, padding 12px 16px, radius 16, bg `#0B1B3F`, white 14px/600, lh 1.35, centred, shadow `0 10px 30px rgba(11,27,63,0.3)`. Auto-hides after **2200ms** (`_toast` resets the timer).
- Every script has the same `Component` boilerplate: `pT`, `pShare`, `pSent`, `_toast`, and `_send(t, quote)`. `_send` appends a "me" message and, after 1200ms, a Go reply **"Got it 👍 I’ll factor that into the plan."**, then scrolls `[data-p-end]` into view (60ms delay, smooth). In I1–I5 `_send` is dead code because those pages have no chat list.

---

### Board shell (common to H1–H3)

**The Trip board is a bottom-sheet dialog layered over the trip chat**, not its own page. Each file draws a full chat screen (header + messages + composer), then a navy backdrop, then the sheet. The sheet covers everything below y=150, so only the chat header is partly visible above it.

The `<script>` is **byte-identical** across H1–H3 (confirmed with `diff`), and so is the share sheet. The files differ in the chat header subtitle and chips, the chat messages, where close/backdrop go, the sheet subtitle, and the rows.

#### Underlying chat header **[ChatHeader]** (z 2, white), `flex-shrink: 0`
- Container: `padding: 56px 0 12px; background: #FFFFFF; box-shadow: 0 1px 0 rgba(11,27,63,0.04), 0 6px 16px rgba(11,27,63,0.06)`.
- Top row:
  - H1: `gap: 4px; padding: 0 8px 0 12px`.
  - H2/H3: `gap: 8px; padding: 0 12px`.
- Back `<a aria-label="Back">`: 44×44 circle, ink `#000000`, arrow 22px.
- Title link (flex 1):
  - H1: height 52, padding 0 4.
  - H2/H3: height 60, padding `0 8px 0 0`.
  - Gap 10.
  - Group avatar: 44 circle, bg `#FFF1DC`, img 40×40 (blob 63e0). H1 also sets overflow hidden.
  - Name "Goa crew" 16px/600, ls -0.011em, lh 1.25.
  - Subline (gap 6): mini avatar stack of 18×18 circles, `1.5px solid #FFFFFF` border, overlap -5 (wrapper padding-left 5), followed by text 13px `#4A5878`.
- Trip-board icon `<a aria-label="Trip board">`: 44×44, board SVG 20. It links to the current board file (self).
- Share `<a role="button" aria-label="Share trip invite" onClick=pa_0>`: 44×44, share SVG 20.
- **Context chip rail** **[FactChipRow / FactChip]**: margin-top 14; flex, gap 8, padding 0 20; `overflow-x: auto; scrollbar-width: none; overscroll-behavior-x: contain`.
  - Chip: height 36, padding 0 14, border-box, flex, gap 5, radius 999, bg `#FFFFFF`, `border: 1px solid #DDE1E6`, ink 14px/500, ls -0.004em, lh 1.35, nowrap. Leading emoji in a 16px slot at 14px.
  - Resolved chips add a trailing **16×16 `#16A34A` circle** holding a white check SVG at 9px (stroke 4).
- Header height: H1 = 56+52+14+36+12 = **170px**; H2/H3 = 56+60+14+36+12 = **178px**. The sheet top at 150 hides the bottom of the chip rail.

#### Underlying message list + composer (fully covered by the sheet)
- Scroll area: `flex: 1; overflow-y: auto; scrollbar-width: none`. Inner padding `16px 16px 96px`, column gap 10.
- Go bubble **[GoBubble / Bubble author=go]**:
  - 30px Go avatar (bg `#DCEBFF`) + bubble: padding `8px 14px 10px`, radius `20px 20px 20px 0`, bg `#F6EAE6`, shadow `0 1px 2px rgba(11,27,63,0.06), 0 4px 12px rgba(11,27,63,0.04)`.
  - Name "Go" 13px/600 `#A44F3A`, ls 0.002em, lh 1.35. Body 16px, ls -0.011em, lh 1.4, text-wrap pretty.
  - max-width is 76% in H1 and 84% in H2/H3.
- Dynamic list `sc-for pSent` (each item `.enter`):
  - Me: black bubble, radius `20 20 0 20`, white text.
  - Go: `#F6EAE6` bubble, radius `20 20 20 0`.
  - Both: max-width 78%, padding 10px 14px, gap 4.
  - Optional quote: padding 6px 10px, radius 10, bg `rgba(255,255,255,0.14)`, `border-left: 3px solid #F0C9BC`, 13px.
  - The list ends with the scroll sentinel `[data-p-end]`.
- Composer **[Composer]**: absolute bottom, padding `24px 16px 24px`, gap 10, bg `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`.
  - Add button: 48 circle, white, shadow `0 1px 3px rgba(0,0,0,0.08)`, plus SVG 20, `aria-expanded`. Toggles `pAttach` and clears `pRec`.
  - Input pill: `<label for=msg>` height 48, padding 0 16, radius 999, white. Visually hidden "Message" label. `<input id=msg>` with placeholder **"Message, or @Go"**, 16px, ls -0.011em, bound to `pDraft`.
  - Mic/Send button: 48 circle. bg `#000000`, or `#B42318` while recording. White SVG: send arrow if there is a draft, otherwise mic. aria-label is "Send", "Stop and send voice note" or "Voice message".
  - Attach menu **[AttachMenu]** (`sc-if pAttach`, `.enter`): absolute left 16, bottom 84, width 220, radius 18, white, shadow `0 10px 30px rgba(11,27,63,0.22)`. Four rows: height 48, padding 0 14, gap 12, 15px/600, 18px emoji, 1px `#ECEFF3` dividers.
    - 📷 Photo → `_send("📷 Photo · Goa packing list")`
    - 📄 Ticket or PDF → `_send("📄 Shared a PDF · IndiGo e-ticket")`
    - 📍 Location → `_send("📍 Shared location · Anjuna")`
    - 🗳️ Poll → `_send("🗳️ Poll · Scuba on Sunday? Yes / No")`
  - Recording pill **[RecordingPill]** (`sc-if pRec`, `.enter`): absolute right 16, bottom 84, height 40, padding 0 14, radius 999, bg `#B42318`, white 14px/600, gap 8. 8px white dot with class `.live`. Text "Recording… tap the mic to send".
  - Mic logic:
    - With a draft: `_send(draft)` and clear the input.
    - While recording: stop, then `_send('🎤 Voice note · 0:06')`.
    - Otherwise: start recording and close the attach menu.
- **Unreachable in practice:** the backdrop (z 5, inset 0) covers the header and composer. The header share button, chips, back link and composer exist in the DOM and script, but a user cannot tap them while the board is open. So **the share sheet (`pShare`) cannot be opened from H1–H3**.

#### Board sheet (the actual board)
- Backdrop: `<a aria-label="Close sheet">`, absolute inset 0, **z 5**, bg `rgba(11,27,63,0.38)`. Tapping it navigates to the chat file the board was opened from (H1 → `P-Chat-GoA`, H2 → `P-Chat-StaySuggest`, H3 → `P-Chat-Plan`).
- Sheet **[BoardSheet → BottomSheet top=150]**: `role="dialog" aria-label="Trip board"`. Absolute, left 0, right 0, bottom 0, **top 150px**, **z 6**. flex column, radius `28px 28px 0 0`, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`. Height 762px. Not animated: no `.enter` class.
- Grabber: centred, margin-top 8, 40×5, radius 999, `#DDE1E6`. Decorative only: no drag handler.
- Scroll body: `flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; padding: 8px 16px 28px`, column gap **12**.
- Sheet header (padding 0 4, column gap 2):
  - Row (space-between, gap 12): title **"Trip board"** 22px/600, ls -0.02em, lh 1.3.
  - Close: `<a aria-label="Close">` 40×40 circle, margin-right -6, white bg, shadow `0 1px 3px rgba(0,0,0,0.08)`, X SVG 18 in `#0B1B3F`. Same target as the backdrop.
  - Subtitle: 14px `#4A5878`, ls -0.004em, lh 1.4, text-wrap pretty. Copy changes per state (see screens).
- **Decision list card** **[Card variant=float-sm radius=2xl]** ("board card"): padding 0 16, radius **22**, bg `#FFFFFF`, `border: 1px solid #ECEFF3`, shadow `0 8px 24px rgba(11,27,63,0.06)`, overflow hidden.
  - **Board row (decision row)** **[BoardRow]**: padding 12px 0, flex, center, gap 12. Rows after the first add `border-top: 1px solid #ECEFF3`.
    - Leading: emoji in a 20px-wide slot at 16px, lh 1, aria-hidden.
    - Text column (flex 1, gap 2):
      - **Eyebrow**: 11px/700 `#4A5878`, ls 0.08em, lh 1.35, UPPERCASE.
      - **Value**: 16px/600, ls -0.011em, lh 1.3.
      - **Sub**: 13px `#4A5878`, ls 0.002em, lh 1.35.
    - Trailing: one of the following.
      - **Go pill with avatar** **[Button variant=tint size=xs + Avatar size=20 kind=go]**: height 32, radius 999, bg `#F6EAE6`, `#A44F3A` 13px/600, ls -0.004em, gap 6. Effective padding `0 12px 0 6px` (an inline `padding: 0 14px` is overridden later in the style). Leading 20px Go avatar.
      - **Go pill, text only** **[Button variant=tint size=xs]** ("Change"): same, padding 0 14, no avatar.
      - **Primary black pill** **[Button variant=primary]**:
        - "Vote": height 34, padding 0 18, gap 8, 14px/500, ls -0.014em, lh 1.3.
        - "Find return": height 32, padding 0 14, 13px/600.
      - **Status chip** **[StatusPill → Badge size=md]** (not a link): height 28, padding 0 10, radius 999, 13px/600, ls 0.002em.
        - Success: bg `#E3F5EA`, text `#0F7A37` ("Booked").
        - Partial: bg `#FFF1DC`, text `#9A5B00` ("1 of 2").
  - Row order is fixed: **WHERE 📍, WHEN 📅, STAY 🏡, YOUR BUDGET 💰, YOUR TRAVEL 🧳**. In H3 a Go reminder row is inserted first.
- **Poll row** **[PollRow]** (H2 STAY): padding `12px 0 14px`, column gap 10.
  - Top line as a board row, except:
    - The eyebrow is coloured `#A44F3A` (the inline style declares `#4A5878` and then `#A44F3A`; the later one wins).
    - The text column has no `min-width: 0`.
    - The trailing control is the black "Vote" pill.
  - Below: thumbnail strip with flex, gap 6, `padding-left: 32px` to align with the text column. Three `flex: 1` columns (gap 4), each holding:
    - an img: width 100%, height 52, radius 10, object-fit cover;
    - a caption 12px/600 "Name · votes".
- **Reminder row** **[GoReminderRow]** (H3, Go nudge): same base row but **full-bleed tinted**: `background: #FFF6F2; margin: 0 -16px; padding-left/right: 16px`.
  - Leading: **22×22 Go avatar** (alt "Go", bg `#DCEBFF`) instead of an emoji.
  - Eyebrow colour `#A44F3A`.
  - Trailing: black "Find return" pill.
- **Spend-vs-budget card** **[SpendVsBudgetCard]** (below the list card):
  - Empty variant (H1, H2): padding 14px 16px, radius 22, **`border: 1.5px dashed #DDE1E6`**, no bg, column gap 10.
    - Eyebrow "YOUR SPEND VS YOUR BUDGET".
    - Placeholder bar: `role="img" aria-label="No budget yet"`, height 12, radius 999, bg `repeating-linear-gradient(135deg, #ECEFF3 0 6px, #F4F5F7 6px 12px)` (hatched).
    - Caption 13 `#4A5878`.
  - Filled variant (H3): white, border `1px solid #ECEFF3`, shadow `0 8px 24px rgba(11,27,63,0.06)`, padding 14px 16px, gap 10.
    - Header row (baseline, space-between, gap 10): eyebrow + amount 16px/600 tabular, with the "of …" part at 500 `#4A5878`.
    - Stacked bar: height 12, flex, gap 3, radius 999, overflow hidden, track `#ECEFF3`. Segments are radius-999 spans sized by %.
    - Legend: 13 `#4A5878`, gap 14. 8px dots. "left" amount pushed right with `margin-left: auto`, 600 `#0F7A37`, tabular.
- **No FAB or add button on the board sheet.** The only "+" is the chat composer's attach button underneath, which the backdrop covers.
- **How the board links back to chat polls:** every row action navigates to a chat file that hosts that decision's poll or sheet:
  - WHERE → `P-Chat-DestSuggest`
  - WHEN → `P-Chat-DatesPoll`
  - STAY / Vote → `P-Chat-StaySuggest` (the villa poll)
  - BUDGET → `P-Chat-BudgetSheet-Slider`
  - TRAVEL / Find return → `P-Chat-RouteSheet`

  Closing the board goes back to the chat state it came from. Subtitle copy: "Polls run only on where, when and stay."
- **Stamp/seal SVG and the plan card** are in the *chat underneath* in H2/H3 (Go's "THE PLAN" card), **not on the board sheet itself**. They render but are hidden behind the sheet. Full spec in the H2 section.

---

### P-Board-Zero.dc.html — H1 · Board, empty
(`<title>`: "Go — Trip board, empty")

#### Purpose
The trip board sheet when nothing is decided: five "not set" rows, each with a Go action, opened over the kick-off chat.

#### Layout top→bottom
- **Chat header** (shell, H1 variant: row gap 4, padding `0 8px 0 12px`, title link height 52 / padding 0 4, group avatar wrapper with `overflow: hidden`).
  - Back → `P-TripHome-Zero`. Title link → `P-TripHome-Zero`.
  - Name "Goa crew". Subline: 2 mini avatars (c58d, cb0a) and **"Rahul joined"** (13px `#4A5878`, ellipsis).
  - Board icon → `P-Board-Zero` (self). Share → `pa_0`.
  - Chip rail, all unresolved (no check badge):
    - "📍 Where?" → `P-Chat-DestSuggest`
    - "📅 When?" → `P-Chat-DatesPoll`
    - "🏡 Stay?" → `P-Chat-StaySuggest`
    - "💰 Budget?" → `P-Chat-BudgetSheet-Slider`
    - "🛫 From?" → `P-Chat-FromSheet`
- **Chat messages** (covered): one Go bubble (max-width 76%, gap 2): "What’s the plan, crew? 🌴" + `<br>` + "Where are we thinking of going?". Then `sc-for pSent`.
- **Composer** (covered): shell.
- **Backdrop** → `P-Chat-GoA`.
- **Board sheet** (top 150):
  - Grabber.
  - Header: "Trip board" + Close (→ `P-Chat-GoA`). Subtitle **"Nothing’s locked yet. Tap any item and Go gets it moving."**
  - Decision list card (5 rows; every trailing action is the **Go pill with 20px avatar**, padding `0 12px 0 6px`):

    | # | Emoji | Eyebrow | Value | Sub | Action | → |
    |---|---|---|---|---|---|---|
    | 1 | 📍 | WHERE | Not decided | Go suggests places from everyone’s answers | Ask Go | P-Chat-DestSuggest |
    | 2 | 📅 | WHEN | Not set | No dates shared yet | Find dates | P-Chat-DatesPoll |
    | 3 | 🏡 | STAY | Not booked | Needs a place and dates first | Ask Go | P-Chat-StaySuggest |
    | 4 | 💰 | YOUR BUDGET | Not set | Only you see it | Set | P-Chat-BudgetSheet-Slider |
    | 5 | 🧳 | YOUR TRAVEL | Not added | Each person picks their own way in | Find routes | P-Chat-RouteSheet |

  - Spend card, **empty dashed variant**: eyebrow "YOUR SPEND VS YOUR BUDGET", hatched bar (aria "No budget yet"), caption "Shows up once you set your budget. Only you see it."
- Share sheet (`sc-if pShare`, z 40; unreachable) and toast (z 60).

#### Sheets / overlays
- **Board sheet**: always shown, top 150 to bottom 0, radius 28 on top corners, bg `#F6F7F9`, grabber 40×5. Backdrop `rgba(11,27,63,0.38)` at z 5. Close X and backdrop both navigate to `P-Chat-GoA`. No drag-to-dismiss.
- **Share sheet**: same as the plan-shell share sheet, but the handler names are shifted: `pa_1` Messages, `pa_2` Gmail, `pa_3` Copy link, `pa_4` More, `pa_5` backdrop close, `pa_6` Copy (toast only, sheet stays open). The "Close" backdrop is a `<button>`. Triggered only by `pa_0` on the covered header Share button.
- **Attach menu / recording pill**: composer popovers (covered).

#### State & interactions
- Initial state: `pT: null, pShare: false, pSent: []`. Implicit: `pDraft ''`, `pRec false`, `pAttach false`.
- Handlers:
  - `pa_0`: open share.
  - `pa_1`–`pa_4`: toast + close share.
  - `pa_5`: close share.
  - `pa_6`: toast "Invite link copied".
  - `pOnDraft`: update draft.
  - `pMic`: send draft / stop recording and send voice note / start recording.
  - `pToggleAttach`.
  - `pAttach_0..3`: canned sends.
- Timers: toast 2200ms. Go auto-reply 1200ms after any send: "Got it 👍 I’ll factor that into the plan."
- Derived values:
  - `pMicStyle`: bg `#B42318` when recording, otherwise `#000000`.
  - `pMicLabel`.
  - `pHasDraft` / `pNoDraft`.
  - `pAttachExp`: "true"/"false".
  - `pSent[].row` and `.bubble`: inline style strings.
- User-visible: every row button and the Close/backdrop are plain navigations. Nothing on the sheet changes state.

#### Navigation table
| Element | Target |
|---|---|
| Header back arrow | P-TripHome-Zero.dc.html |
| Header title (Goa crew) | P-TripHome-Zero.dc.html |
| Header board icon | P-Board-Zero.dc.html (self) |
| Header share | pa_0 → share sheet |
| Chip Where? / When? / Stay? / Budget? / From? | P-Chat-DestSuggest / P-Chat-DatesPoll / P-Chat-StaySuggest / P-Chat-BudgetSheet-Slider / P-Chat-FromSheet |
| Backdrop (Close sheet) | P-Chat-GoA.dc.html |
| Sheet Close X | P-Chat-GoA.dc.html |
| WHERE "Ask Go" | P-Chat-DestSuggest.dc.html |
| WHEN "Find dates" | P-Chat-DatesPoll.dc.html |
| STAY "Ask Go" | P-Chat-StaySuggest.dc.html |
| YOUR BUDGET "Set" | P-Chat-BudgetSheet-Slider.dc.html |
| YOUR TRAVEL "Find routes" | P-Chat-RouteSheet.dc.html |
| Share: Goa crew 🌴 row | P-WA-Compose.dc.html (missing) |
| Share: WhatsApp tile | P-WA-Pick.dc.html (missing) |

#### Data shown
- Group "Goa crew". Joined: me (c58d) and Rahul (cb0a). Subline "Rahul joined".
- Go message: "What’s the plan, crew? 🌴 / Where are we thinking of going?"
- Board subtitle, the five rows and the spend card: as in the table above.
- Share: "Join Goa crew on Go", "go.vestra.ai/t/goa-k7q", "Goa crew 🌴", "WhatsApp group · recent".
- Toasts:
  - "Opens Messages with the link filled in"
  - "Opens Gmail with the link filled in"
  - "Invite link copied"
  - "Opens your phone’s share menu"
- Canned sends:
  - "📷 Photo · Goa packing list"
  - "📄 Shared a PDF · IndiGo e-ticket"
  - "📍 Shared location · Anjuna"
  - "🗳️ Poll · Scuba on Sunday? Yes / No"
  - "🎤 Voice note · 0:06"
- Go reply: "Got it 👍 I’ll factor that into the plan."
- Composer placeholder: "Message, or @Go". Recording pill: "Recording… tap the mic to send".

#### Icons & images
- SVGs (all `viewBox 0 0 24 24`, `fill none`, `stroke currentColor`, width 2, round caps and joins unless noted):
  - Back arrow 22: `M19 12H5` + `M11 6l-6 6 6 6`.
  - Board 20: `rect x4 y3 w16 h18 rx3` + `M8 8h8`, `M8 12h8`, `M8 16h5`.
  - Share 20: `M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8`.
  - Close X 18: `M6 6l12 12` + `M18 6L6 18`.
  - Plus 20: `M12 5v14` + `M5 12h14`.
  - Send 20: `M5 12h14` + `M13 6l6 6-6 6`.
  - Mic 20: `rect x9 y3 w6 h11 rx3` + `M5 11a7 7 0 0 0 14 0` + `M12 18v3`.
  - Chevron 16 (stroke 2.4, `#A5ACB8`): `M9 6l6 6-6 6`.
  - WhatsApp bubble 28 (stroke `#FFFFFF`): `M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z`.
- Emoji:
  - 📍📅🏡💰🛫 on chips (14px).
  - 📍📅🏡💰🧳 on rows (16px).
  - 🌴 in the Go copy and share group.
  - 📷📄📍🗳️ in the attach menu (18px).
  - 💬✉️🔗⋯ on share tiles (24px).
- `/_blob/` (all alt=""):
  - 63e0220f… group avatar: 40×40 in a 44 circle on `#FFF1DC`; also 44×44 radius 12 in the share card.
  - c58d972a…, cb0a34fd…: mini avatars 18×18.
  - 5bda4ac2… Go avatar: 30px on the chat bubble, 20px in the Go pills, bg `#DCEBFF`.

---

### P-Board-Poll.dc.html — H2 · Board, stay poll open
(`<title>`: **"Go — Trip board · budget vote"**. This does not match the canvas title "stay poll open"; the content is a stay vote.)

#### Purpose
The board after place, dates and my budget are decided, with a live 3-villa stay vote; YOUR TRAVEL is still empty.

#### Layout top→bottom
- **Chat header** (H2/H3 variant: row gap 8, padding 0 12, title link height 60 with padding `0 8px 0 0`).
  - Back → `P-TripHome-Zero`. Title → `P-TripHome-Zero`.
  - Subline: 4 mini avatars (c58d, cb0a, 234f, 8c7b) and **"Diwali · 6–9 Nov"** (13px, ls 0.002em, lh 1.35).
  - Board icon → `P-Board-Poll` (self). Share → `pa_0`.
  - Chip rail (✓ = green check badge):
    - "📍 Goa ✓" → `P-Board-Poll` (self)
    - "📅 Nov 6–9 ✓" → `P-Board-Poll` (self)
    - "🏡 Stay?" (no check) → `P-Chat-StaySuggest`
    - "💰 ₹21.8k ✓" → `P-Chat-BudgetSheet-Slider`
    - "🛫 Bengaluru ✓" → `P-Chat-FromSheet`
- **Chat messages** (covered):
  1. **Me bubble** **[Bubble author=me]** (right-aligned): max-width 80%, padding 10px 14px, radius `20 20 0 20`, bg `#000000`, white, same soft shadow. Inline content (flex wrap, gap 6, 16px):
     - **@Go mention chip** **[MentionChip]**: height 24, padding `0 9px 0 2px`, radius 999, bg `rgba(255,255,255,0.16)`, 600, gap 5, 20px Go avatar + "Go";
     - then "can you sort the whole plan?".
  2. **Go bubble** (max-width 84%, gap 4): "Here's your Goa. Pool villa, scooters, everyone in by Friday night." (uses a straight apostrophe).
  3. **"THE PLAN" card** **[PlanCard in InChatCard]** (wrapper `position: relative; margin-left: 38px`):
     - Card: radius 22, white, border `1px solid #ECEFF3`, shadow `0 8px 24px rgba(11,27,63,0.08)`, overflow hidden.
     - Hero: height **176**, bg `#C9D6E2`, img "Palolem beach, Goa" (cover). Overlay gradient `180deg, rgba(11,27,63,0) 35% → rgba(11,27,63,0.62) 100%`.
     - **Stamp SVG** **[BoardStamp]**: absolute top 12 / right 12, `transform: rotate(-10deg)`, opacity 0.92. Spec below.
     - Hero text block: absolute left 16 / right 16 / bottom 14, column gap 2, white.
       - "THE PLAN": 11px/700, ls 0.08em, lh 1.35, opacity 0.9.
       - "Goa": 34px/700, ls -0.025em, lh 1.05.
       - Bottom row (space-between, gap 8): "Fri 6 – Mon 9 Nov · in 34 days" 14px/500, ls -0.004em, opacity 0.92. Avatar stack: four 24×24 circles with `2px solid #FFFFFF` border, overlap -7.
     - Day grid **[DayStrip]**: padding `12px 12px 4px`, `grid-template-columns: repeat(4, minmax(0,1fr))`, gap 8. Each cell is a column (gap 6):
       - Tile: height 62, radius 12, bg `#E9EDF2`, img cover, overlay `180deg rgba(0,0,0,0) 40% → rgba(0,0,0,0.55)`. Day label absolute left 8 / bottom 5, 11px/700 white, ls 0.08em, lh 1.
       - Caption: 12px `#4A5878`, ls 0.01em, lh 1.3, text-wrap balance.
       - Content: **FRI** "Everyone lands" · **SAT** "Scooters & sunset" · **SUN** "Scuba, then open" · **MON** "Panjim, then home".
     - Footer: padding `8px 8px 8px 14px`, gap 8. 22px Go avatar; "Made by Go" 13px/500 `#4A5878` (flex 1); **"Open"** button height 36, padding 0 14, radius 999, bg `#F2F2F2`, ink 15px/600, ls -0.008em → `P-Plan-Everyone.dc.html`.
     - **Reaction pill** **[ReactionChip floating]**: absolute left 14 / bottom -14, height 26, padding 0 9, gap 4, radius 999, white, border `#ECEFF3`, shadow `0 2px 6px rgba(11,27,63,0.08)`, 13px/700 tabular. Shows "🔥 4".
  4. **Rahul bubble** **[Bubble author=member]** (margin-top 18 to clear the reaction pill): 30px avatar (cb0a). Bubble max-width 80%, padding `8px 14px 10px`, radius `20 20 20 0`, **bg `#FFFFFF`**, same shadow. Name "Rahul" 13px/600 `#4A5878`; text "GOOO 😭" 16px.
  5. `sc-for pSent`, then `[data-p-end]`.
- **Composer** (covered).
- **Backdrop** → `P-Chat-StaySuggest`.
- **Board sheet**:
  - Header: "Trip board", Close → `P-Chat-StaySuggest`. Subtitle **"Polls run only on where, when and stay."**
  - Decision list card:

    | # | Emoji | Eyebrow | Value | Sub | Trailing | → |
    |---|---|---|---|---|---|---|
    | 1 | 📍 | WHERE | Goa | All four agreed in the chat | "Change" (text Go pill) | P-Chat-DestSuggest |
    | 2 | 📅 | WHEN | Fri 6 – Mon 9 Nov | Diwali weekend | "Change" | P-Chat-DatesPoll |
    | 3 | 🏡 | **STAY · VOTE OPEN** (`#A44F3A`) | 3 villas in the running | 2 of 4 voted · closes in 2 hrs | **black "Vote"** (h34) | P-Chat-StaySuggest |
    | 3b | — | thumbnails | Villa Sol · 2 / Casa Azul · 0 / The Palms · 0 | — | — | (not links) |
    | 4 | 💰 | YOUR BUDGET | ₹21.8k, all-in | Only you see this | "Change" | P-Chat-BudgetSheet-Slider |
    | 5 | 🧳 | YOUR TRAVEL | Not added | Each person picks their own way in | "Find routes" (Go pill with avatar) | P-Chat-RouteSheet |

  - Spend card: **still the empty dashed variant**, with the same caption "Shows up once you set your budget. Only you see it." This is inconsistent, because the budget is set (₹21.8k) in this state.
- Share sheet and toast: as in H1.

#### Sheets / overlays
- Board sheet: same geometry as H1. Close and backdrop → `P-Chat-StaySuggest`.
- Share sheet, attach menu, recording pill: same as H1 (and the share sheet is just as unreachable).

#### State & interactions
- Script is byte-identical to H1 (same state, handlers, timers, toasts).
- On the board the only interaction is navigation. **Vote does not vote in place**: it navigates to the chat stay poll. Thumbnails are not tappable.

#### Navigation table
| Element | Target |
|---|---|
| Header back / title | P-TripHome-Zero.dc.html (the *empty* home, although the trip is partly decided) |
| Header board icon | P-Board-Poll.dc.html (self) |
| Chip 📍 Goa ✓ / 📅 Nov 6–9 ✓ | P-Board-Poll.dc.html (self) |
| Chip 🏡 Stay? | P-Chat-StaySuggest.dc.html |
| Chip 💰 ₹21.8k ✓ | P-Chat-BudgetSheet-Slider.dc.html |
| Chip 🛫 Bengaluru ✓ | P-Chat-FromSheet.dc.html |
| Plan card "Open" (covered) | P-Plan-Everyone.dc.html |
| Backdrop / Close X | P-Chat-StaySuggest.dc.html |
| WHERE Change | P-Chat-DestSuggest.dc.html |
| WHEN Change | P-Chat-DatesPoll.dc.html |
| STAY Vote | P-Chat-StaySuggest.dc.html |
| YOUR BUDGET Change | P-Chat-BudgetSheet-Slider.dc.html |
| YOUR TRAVEL Find routes | P-Chat-RouteSheet.dc.html |
| Share sheet rows | as H1 (P-WA-Compose / P-WA-Pick, both missing) |

#### Data shown
- Group "Goa crew", 4 members, "Diwali · 6–9 Nov".
- Chips: Goa, Nov 6–9, Stay?, ₹21.8k, Bengaluru.
- Me: "@Go can you sort the whole plan?" Go: "Here's your Goa. Pool villa, scooters, everyone in by Friday night."
- Plan card: "THE PLAN", "Goa", "Fri 6 – Mon 9 Nov · in 34 days", 4 avatars, the 4 days and captions above, "Made by Go", "Open", reaction 🔥 4.
- Rahul: "GOOO 😭".
- **Poll contents**: 3 villas.
  - Votes: **Villa Sol 2, Casa Azul 0, The Palms 0**.
  - **2 of 4 voted**, **closes in 2 hrs**.
  - Eyebrow "STAY · VOTE OPEN".
- Budget "₹21.8k, all-in" / "Only you see this". Travel "Not added".
- Spend card copy: same as H1. Toasts and canned strings: same as H1.

#### Icons & images
- Same SVG set as H1, plus:
  - **Check** 9px (stroke 4): `M5 12l5 5 9-10`, white on a 16px `#16A34A` circle.
  - **Stamp/seal** **[BoardStamp]** (76×76, `viewBox 0 0 76 76`, aria-hidden):
    - `<defs><path id="stamp" d="M38 38 m-26 0 a26 26 0 1 1 52 0 a26 26 0 1 1 -52 0">` (circle path r=26 around the centre, used for the text).
    - Outer ring: `<circle cx38 cy38 r35 fill none stroke #FFFFFF stroke-width 1.5>`.
    - Inner ring: `<circle cx38 cy38 r19 stroke #FFFFFF stroke-width 1>`.
    - Ring text: `<textPath href="#stamp">GOA · INDIA · GOA · INDIA ·</textPath>`, fill white, Figtree 8.5px/700, letter-spacing 2.6.
    - Centre line 1: "NOV 6–9" at x38 y37, text-anchor middle, 9px/800.
    - Centre line 2: "2026" at x38 y47, 7.5px/600, letter-spacing 1.
    - Placement: CSS `position: absolute; top: 12px; right: 12px; transform: rotate(-10deg); opacity: 0.92`.
    - Hazard: the hard-coded `id="stamp"` would collide if two stamps render in one document.
  - The plus SVG here omits `stroke-linejoin` (cosmetic).
- Emoji: 🔥 (reaction), 😭 (Rahul), 📍📅🏡💰🛫 chips, 📍📅🏡💰🧳 rows.
- `/_blob/`:
  - Members: c58d (me), cb0a (Rahul), 234f, 8c7b. 18px in the header, 24px on the plan card.
  - Go 5bda: 20px in the mention chip, 30 on bubbles, 22 in the plan footer, 20 in the "Find routes" pill.
  - **5bfbb197… alt "Palolem beach, Goa"**: plan hero, 100%×176.
  - Day tiles (alt ""; 62px tall, ~1/4 width each): **8422cba1… FRI**, **a76721da… SAT**, **5e6fdc7c… SUN**, **41377a12… MON**.
  - Villa thumbnails (52px tall, radius 10): **87722708… alt "Villa Sol"**, **ce9e919f… alt "Casa Azul"**, **3f7e7be8… alt "The Palms"**.
  - Group 63e0: header and share card.

---

### P-Board-B.dc.html — H3 · Board · Go reminds you to book your return
(`<title>`: "Go — Trip board B")

#### Purpose
The board when everything is decided and booked except my return leg. Go pins a reminder row at the top, and the spend bar is filled.

#### Layout top→bottom
- **Chat header** (H2/H3 variant).
  - Back and title link → **`P-Home.dc.html`** (the populated trip home, unlike H1/H2).
  - Subline: 4 avatars and "Diwali · 6–9 Nov". Board icon → `P-Board-B` (self). Share → `pa_0`.
  - Chips:
    - "📍 Goa ✓", "📅 Nov 6–9 ✓", "🏡 **Villa Sol** ✓" → all `P-Board-B` (self)
    - "💰 ₹21.8k ✓" → `P-Chat-BudgetSheet-Slider`
    - "🛫 Bengaluru ✓" → `P-Chat-FromSheet`
- **Chat messages** (covered): identical to H2 (me @Go message, Go "Here's your Goa…", THE PLAN card with stamp and "Open" → `P-Plan-Everyone`, 🔥 4, Rahul "GOOO 😭").
- **Backdrop** → `P-Chat-Plan`.
- **Board sheet**:
  - Header: "Trip board", Close → `P-Chat-Plan`. Subtitle **"Go keeps this current from your chat."**
  - Decision list card:

    | # | Leading | Eyebrow | Value | Sub | Trailing | → |
    |---|---|---|---|---|---|---|
    | 0 | **Go avatar 22** (alt "Go") | **GO · YOUR RETURN ISN’T BOOKED** (`#A44F3A`) | Book your way back on Mon 9 Nov | You’re in on Fri. Evening flights back are filling up. | **black "Find return"** (h32, 13/600) | P-Chat-RouteSheet |
    | 1 | 📍 | WHERE | Goa | All four agreed in the chat | "Change" | P-Chat-DestSuggest |
    | 2 | 📅 | WHEN | Fri 6 – Mon 9 Nov | Diwali weekend | "Change" | P-Chat-DatesPoll |
    | 3 | 🏡 | STAY | Villa Sol, Anjuna | Booked by Rahul · ₹10.8k each | status **"Booked"** (`#E3F5EA`/`#0F7A37`, h28) | — |
    | 4 | 💰 | YOUR BUDGET | ₹21.8k, all-in | Only you see this | "Change" | P-Chat-BudgetSheet-Slider |
    | 5 | 🧳 | YOUR TRAVEL | Flight there booked | BLR → GOX · 6E 5313 · return not booked | status **"1 of 2"** (`#FFF1DC`/`#9A5B00`, h28) | — |

    Row 0 is the **reminder row**: full-bleed bg `#FFF6F2` (`margin: 0 -16px`, side padding 16), no top border because it is the first row. The next row's border-top `#ECEFF3` separates it.
  - **Spend card, filled variant**:
    - Header: "YOUR SPEND VS YOUR BUDGET" + **"₹14,760 of ₹21,800"** ("of ₹21,800" at 500 `#4A5878`).
    - Bar (`role="img"`, aria "Stay ₹10,800, travel ₹3,960, ₹7,040 left"): Stay segment **49.5%** `#3E73D6`, Travel segment **18.2%** `#E07A5F`, gap 3, track `#ECEFF3`.
    - Legend: ● Stay (`#3E73D6`), ● Travel (`#E07A5F`), right-aligned **"₹7,040 left"** (600 `#0F7A37`).
    - Maths: 10,800 + 3,960 = 14,760; 21,800 − 14,760 = 7,040; 10,800/21,800 = 49.5%; 3,960/21,800 = 18.2%.
- Share sheet and toast: as in H1.

#### Sheets / overlays
- Board sheet: same geometry. Close and backdrop → `P-Chat-Plan`. Share sheet etc.: same as H1.

#### State & interactions
- Script identical to H1/H2. Status chips are inert spans.
- "Find return" navigates to the route sheet in chat. There is no in-place booking or dismissal of the reminder.

#### Navigation table
| Element | Target |
|---|---|
| Header back / title | P-Home.dc.html |
| Header board icon | P-Board-B.dc.html (self) |
| Chips Goa / Nov 6–9 / Villa Sol | P-Board-B.dc.html (self) |
| Chip ₹21.8k | P-Chat-BudgetSheet-Slider.dc.html |
| Chip Bengaluru | P-Chat-FromSheet.dc.html |
| Plan card "Open" (covered) | P-Plan-Everyone.dc.html |
| Backdrop / Close X | P-Chat-Plan.dc.html |
| Reminder "Find return" | P-Chat-RouteSheet.dc.html |
| WHERE / WHEN Change | P-Chat-DestSuggest / P-Chat-DatesPoll |
| YOUR BUDGET Change | P-Chat-BudgetSheet-Slider.dc.html |
| STAY "Booked", TRAVEL "1 of 2" | not interactive |

#### Data shown
- Stay: Villa Sol, Anjuna, booked by Rahul, ₹10.8k each.
- Travel: flight there booked, BLR → GOX, flight **6E 5313**, return not booked, 1 of 2.
- Budget: ₹21,800. Spend: ₹14,760 (stay ₹10,800 + travel ₹3,960). Left: ₹7,040.
- Reminder copy: "GO · YOUR RETURN ISN’T BOOKED" / "Book your way back on Mon 9 Nov" / "You’re in on Fri. Evening flights back are filling up." / CTA "Find return".
- Everything else as H2.

#### Icons & images
- Same as H2, including the stamp on the covered plan card.
- The board uses the Go avatar 5bda at **22px (alt "Go")** on the reminder row.
- No villa thumbnails here.

---

### Group notes (board-related excerpts)

#### Shared element names (proposed component names)
- **Plan content (board-relevant line only):**
  - `GoPill` **[Button variant=tint size=xs (+ Avatar size=20 kind=go)]**: `#F6EAE6`/`#A44F3A`, h32 13/600; a variant has a 20px Go avatar.
- **Board:**
  - `ChatHeader` **[ChatHeader]**: group avatar, name, subline, board/share icons, context chip rail.
  - `ContextChip` **[FactChip in FactChipRow; `check` → CheckBadge 16]**: with an optional green check badge.
  - `BoardSheet` **[BoardSheet on BottomSheet + SheetHeader / SheetBody]**: top 150, radius 28, grabber, title + Close + subtitle.
  - `BoardDecisionCard` **[Card variant=float-sm radius=2xl]** with `BoardRow` **[BoardRow]**: eyebrow, value, sub, and a trailing GoPill, primary pill or status chip.
  - `PollRow` **[PollRow]**: `#A44F3A` eyebrow, Vote button, thumbnail strip with vote counts.
  - `GoReminderRow` **[GoReminderRow]**: `#FFF6F2` full-bleed, Go avatar, black CTA.
  - `StatusChip` **[StatusPill → Badge size=md success-soft / amber]**: success or partial.
  - `SpendVsBudgetCard` **[SpendVsBudgetCard + SplitBar]**: empty hatched or filled stacked bar.
- **Chat pieces seen under the board:**
  - `GoBubble`, `MeBubble`, `MemberBubble` **[GoBubble / Bubble author=go, me, member]** (white).
  - `MentionChip` **[MentionChip]** (@Go).
  - `PlanCard` **[PlanCard]**: hero + `PassportStamp` **[BoardStamp; build renders WaxSeal, see 1.5]** + 4-day grid **[DayStrip]** + "Made by Go" + Open.
  - `ReactionPill` **[ReactionChip floating]**.
  - `Composer` **[Composer + AttachMenu + RecordingPill]**, with the attach menu and recording pill.
- **Avatar convention:** `/_blob/5bda…` = Go (always on `#DCEBFF`); c58d = me; cb0a = Rahul; 234f and 8c7b = the other two members; 63e0 = group/trip avatar (on `#FFF1DC`).

#### Sibling-state collapses
- **Board-Zero / Poll / B**: one board sheet driven by board state; the script is byte-identical in all three. Differences:
  - Chat-header subline: "Rahul joined" with 2 avatars (H1) vs "Diwali · 6–9 Nov" with 4 avatars (H2, H3).
  - Header row metrics: H1 uses gap 4 / pad `0 8 0 12` / title height 52; H2 and H3 use gap 8 / pad `0 12` / title height 60.
  - Chips:
    - H1: all "?".
    - H2: Goa ✓, Nov 6–9 ✓, Stay?, ₹21.8k ✓, Bengaluru ✓.
    - H3: the same but with "Villa Sol ✓".
  - Back target: H1/H2 → `P-TripHome-Zero`; H3 → `P-Home`.
  - Close/backdrop target: H1 → `P-Chat-GoA`; H2 → `P-Chat-StaySuggest`; H3 → `P-Chat-Plan`.
  - Subtitle:
    - H1: "Nothing’s locked yet. Tap any item and Go gets it moving."
    - H2: "Polls run only on where, when and stay."
    - H3: "Go keeps this current from your chat."
  - Rows: per-row value, sub and trailing control follow the decision state:
    - not set → GoPill (with avatar);
    - decided → "Change" text GoPill;
    - vote open → PollRow;
    - booked → status chip;
    - partially booked → partial chip;
    - plus an optional GoReminderRow on top.
  - Spend card: empty (H1, H2) vs filled (H3).
  - Underlying chat: H1 is the single kick-off Go bubble; H2 and H3 show the plan card thread.

#### Navigation graph (summary)
- **Board:**
  - Rows go to the same chat flows as Home, except travel goes to `P-Chat-RouteSheet` (Home uses `P-Chat-Travel`).
  - Close goes to the originating chat.
  - Header back goes to Trip home (empty or populated).
  - The covered plan card's "Open" goes to `P-Plan-Everyone`.
- **No I screen links to a Board file**, and the I1–I5 shell has no board icon. The board is reachable only from the chat header icon, and each board file's icon links to itself.

#### Surprises and ambiguities
1. **The board is an overlay screen.** Each H file bakes in a full chat screen under a 0.38 navy scrim. The chat header controls, chips, composer and share sheet are in the DOM but are **not tappable**. Build the board as a modal sheet over the chat route; don't build it as its own page.
2. **H2 `<title>` says "budget vote", but the content and canvas title are a *stay* poll.** Trust the canvas and the content.
3. **H2 spend card contradicts its budget row.** The budget is set to ₹21.8k, but the card still says "Shows up once you set your budget."
4. **Back targets differ between board states.** H2 (place and dates decided) still goes back to the *empty* trip home; H3 goes to `P-Home`.
5. **Travel destination differs between Home and the board.** Home "Sort your travel / Book" → `P-Chat-Travel`; board "YOUR TRAVEL / Find routes" → `P-Chat-RouteSheet`.
6. **Missing files:** `P-WA-Compose.dc.html` and `P-WA-Pick.dc.html` (share-sheet targets) do not exist in the prototype dir. `support.js` is absent too.
7. **The empty trip uses the name "Goa crew".** It appears in the board header, the share card ("Join Goa crew on Go") and the WhatsApp row, while the plan hero says "New trip" / "Where? Not decided yet". The group name and the destination are separate fields, and a group name that happens to contain "Goa" makes that confusing.
12. **Dead CSS and code:** `.knob` CSS in H2/H3; `.row` and `.tick` unused; `_send`/`pSent` in I-screens; `collapsed` state never read.
13. **Locked items look tappable.** Home "Find a stay — Unlocks once place and dates are set" and H1 board "STAY — Needs a place and dates first" both keep an enabled "Ask Go" pill.
14. **The stamp SVG uses a fixed `id="stamp"`.** That needs a unique id per instance in the real build.
15. **Copy uses curly apostrophes (’) almost everywhere**, except Go's "Here's your Goa." Keep the copy verbatim.
16. **Hard-coded safe area:** 46px or 56px top padding instead of env(safe-area-inset-top). There is no bottom safe-area handling: the chat pill sits at bottom 28 and the composer has padding-bottom 24.
