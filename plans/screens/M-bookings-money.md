# M · Bookings & expenses (M1–M7)

Sources: `design/prototype/P-Bookings`, `P-Bookings-Scrolled`, `P-Ticket-PDF`, `P-Money-Everyone`, `P-Money-Me`, `P-Transactions`, `P-Money-Record` (`.dc.html`). PLAN refs: §7 components, §8 routes, §9.1 types, §9.4 `money` slice, §10 P3-14/P3-15, §11 conventions, §12.1 items 16/17/19. Part 2 is reference data about the design, not instructions.

## 1. Spec (normative)

### 1.1 Artboards → route + state

All presets first run `ensureStage('plan')` (trip `goa` planned, 3 bookings, 7 transactions) and reset `money` to seed (no `recorded`).

| Artboard | Source | Route | State | Preset |
|---|---|---|---|---|
| M1 | P-Bookings | `/trips/goa/bookings` | scrollTop 0, `hp = 0` | `M1` |
| M2 | P-Bookings-Scrolled | `/trips/goa/bookings?collapsed=1` | M1 scrolled ≥ 200px → `hp = 1`, compact header (148px) fully shown. Preset forces it via `?collapsed=1` (see §1.2) | `M2` |
| M3 | P-Ticket-PDF | `/trips/goa/bookings/travel-out/ticket` | page counter "1 / 2" | `M3` |
| M4 | P-Money-Everyone | `/trips/goa/expenses` (≡ `?scope=everyone`) | `scope='everyone'` | `M4` |
| M5 | P-Money-Me | `/trips/goa/expenses?scope=me` | `scope='me'` | `M5` |
| M6 | P-Transactions | `/trips/goa/expenses/transactions` | `filter='all'` | `M6` |
| M7 | P-Money-Record | `/trips/goa/expenses?scope=me&sheet=record` | M5 + `RecordPaymentSheet` open, amount "5,800", via UPI, note "" | `M7` |

Gating: Bookings and Expenses render the I3 / I4–I5 zero states (`BookingsZero`, `ExpensesZero`, P3-16) while `trip.stage !== 'planned'`. The ticket viewer and Transactions page are **not** stage-gated (the ticket is reachable from F7 "Open ticket PDF" and K4 "Download").

No `expenses/record/page.tsx` route: M7 is a sheet state of `/trips/[tripId]/expenses` (PLAN §8, P3-15 Owns). PLAN §2's `expenses/record/page.tsx` line is superseded.

All pages are client components (`"use client"`), rendered after `useHydrated()`.

### 1.2 Bookings page (P3-14) — `app/trips/[tripId]/bookings/page.tsx`

```
<TripShell tripId active="bookings" forceCollapsed={search.collapsed === '1'}>
  <SectionHeader title="Booked" meta={`${bookings.length} bookings`} />   // "3 bookings"
  {bookings.map(b => <BookingTicketCard key={b.id} booking={b} />)}       // selectBookings(tripId), seed order
</TripShell>
```
- Children render in TripShell's content column (`px-4 pt-4 pb-[120px] flex flex-col gap-2.5`). Hero, big tabs (Bookings active), compact header, bottom fade, Chat FAB, share sheet all come from `TripShell` (P2-6). Nothing else renders on the page (no filters, prices, PNRs, chevrons).
- `SectionHeader`: "Booked" 20/600 tracking-h3 leading-[1.3]; meta "3 bookings" 13/600 muted tracking-caption; `px-1`, baseline-aligned, `mt-0`.

**`BookingTicketCard`** (`plan/BookingTicketCard.tsx`, props `{ booking: Booking }`):
- Root `<Link href={booking.href}>`: `relative flex items-stretch min-h-[108px] rounded-5xl bg-white border border-line shadow-float-sm text-ink no-underline transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.985] active:bg-surface-pressed`. **Not** `overflow-hidden` (the stub notches must overhang the edge).
- Media `w-[92px] shrink-0 rounded-l-5xl overflow-hidden flex`, by `media.kind`:
  - `logo`: `items-center justify-center bg-indigo`, `<img src={media.src} alt="IndiGo" className="w-16 h-auto">`.
  - `photo`: `<img src={media.src} alt="" className="size-full object-cover">`.
  - `emoji`: `items-center justify-center bg-[#E3EEFB] text-[34px] leading-none` + `<span aria-hidden>{media.emoji}</span>` (`#E3EEFB` has no token — report).
  - `media.bg` is a key (`'indigo' | 'stay-tint' | 'none'`) mapped to classes inside the component, never a class string in data.
- Body `flex-1 min-w-0 p-3 flex flex-col justify-center gap-px border-l-[3px]` + `border-info` (`accent='info'`) | `border-success` (`'success'`):
  - eyebrow `Eyebrow` 11/700 muted tracking-eyebrow leading-[1.35] (text stored uppercase in seed);
  - title `text-[19px] font-semibold tracking-[-0.016em] leading-[1.2] truncate`;
  - sub `text-13 text-muted tracking-caption truncate`;
  - `AvatarStack users={memberIds} size={22} overlap={-7} ring="white" className="mt-1"`.
- Stub `relative w-20 shrink-0 flex flex-col items-center justify-center gap-1 text-center` with a left `Separator orientation="vertical" variant="dashed"` (1.5px `border-line-2`) and two notches `absolute -left-[9px] size-4 rounded-full bg-canvas` at `-top-[9px]` and `-bottom-[9px]` (`aria-hidden`).
  - `stub.kind==='count'`: `<span className="text-26 font-bold leading-none tabular-nums">{n}</span>` + "TICKETS" (11/700 muted tracking-eyebrow).
  - `stub.kind==='booked'`: `<CheckBadge size={30} />` + "BOOKED" (11/700 **text-success-ink** tracking-eyebrow).
- hrefs: travel cards → `/trips/goa/bookings/<id>/ticket` (both open the K7QX2M PDF, as designed); stay → `/trips/goa?open=stay` (J2).

**Collapsing header (M2).** `TripShell` hook `hp = round(clamp((t−110)/90, 0, 1)·20)/20`; compact header opacity `hp`, `translateY((1−hp)·−14px)`, pointer-events on when `hp > 0.6`, fully shown at t ≥ 200. Compact header = `pt-[46px] px-3 pb-2.5` white, `shadow-header-2`, row (back 40 → `/home`, "Goa" 17/700 + "Fri 6 – Mon 9 Nov" 13 muted, share 40) + compact tabs (Bookings active) → 148px tall. With 3 cards the scroll height is ≈ 778px (hero 236 + tabs 26 + column 516), so live scroll cannot reach 200px on most phones. Preset M2 therefore passes `?collapsed=1` → `TripShell forceCollapsed`: hero and big tabs not rendered, compact header static at `hp=1`, content `pt-[148px]` (the frozen artboard). If P2-6's `TripShell` lacks `forceCollapsed`, P3-14 reports the gap and does not edit `TripShell`.

### 1.3 Ticket viewer (M3, P3-14) — `app/trips/[tripId]/bookings/[bookingId]/ticket/page.tsx`

Page: `useParams<{ tripId: TripId; bookingId: string }>()` → `selectTicket(tripId, bookingId)` (seed lookup, not stage-gated). Unknown id or booking without `ticket` → `notFound()`. Renders `<Screen bg="viewer" scroll="none"><PdfViewer booking ticket /></Screen>`.

**`PdfViewer`** (`plan/PdfViewer.tsx`): root `relative flex h-full flex-col bg-viewer`.
1. Toolbar (local markup; `TopBar` has no subtitle slot or 16px title): `shrink-0 pt-safe px-3 pb-2.5 bg-white flex items-center gap-2 shadow-[0_1px_0_rgb(11_27_63/0.06)]`.
   - Close: `Button variant="ghost" size="icon" asChild` → `<Link href="/trips/[tripId]/bookings" aria-label="Close">`, `X` `size-[22px]` strokeWidth 2.
   - Title block `flex-1 min-w-0 flex flex-col gap-px`: `ticket.title` "IndiGo e-ticket" `text-16 font-semibold tracking-body leading-[1.3] truncate`; `` `${fileName} · ${pages} pages` `` = "6E5313-K7QX2M.pdf · 2 pages" `text-13 text-muted tracking-caption truncate`.
   - `Button ghost icon aria-label="Download"` + `Download` `size-5` → toast "Ticket PDF downloaded".
   - `Button ghost icon aria-label="Share"` + `Share` `size-5` → toast "Ticket shared to Goa crew".
   - No zoom or expand control.
2. Page scroller (ref'd) `flex-1 min-h-0 overflow-y-auto scrollbar-none px-3 pt-5 pb-[120px] flex flex-col items-center gap-4`.
3. **`PdfPage`** (`plan/PdfPage.tsx`, props `{ ticket: TicketDoc }`): `w-full max-w-[360px] aspect-[360/509] box-border p-[22px] bg-white shadow-page flex flex-col gap-3.5 font-serif` (square corners; 360×509 at full width).
   - Header `flex items-center justify-between`: chip `h-[26px] px-2 bg-indigo flex items-center` + `<img src={assets IndiGo wordmark} alt="IndiGo" width={50}>`; "E-TICKET / ITINERARY" `text-11 font-bold tracking-badge`.
   - Meta grid `grid grid-cols-2 gap-x-3 gap-y-1.5 text-10 leading-[1.35]`: "PNR: **K7QX2M**" · "Booked: 12 Oct 2026" · "Passenger: **Aarav Shah**" (deviation; design "[YOUR NAME]") · "Seat: **14A**" (labels are UI literals, values from `TicketDoc`).
   - Route band `border-y border-ink py-2.5 flex justify-between text-10 leading-[1.4]`: left `from.code` "BLR" `text-18 font-bold` / "Bengaluru T1" / "Fri 6 Nov, 20:40"; centre `self-center` `ticket.flight` "6E 5313 · Economy"; right `text-right` "GOX" / "Goa, Mopa" / "Fri 6 Nov, 21:55" (24h kept).
   - Skeleton `flex flex-col gap-1.5`: 4 bars `h-2.5 rounded-xs bg-skeleton` at `w-[92%] w-[84%] w-[88%] w-[60%]`.
   - Fare `mt-1 flex flex-col gap-1.5`: "Fare summary" `text-10 font-bold`; 3 bars `h-2 rounded-xs bg-skeleton` at 70% / 66% / 72%.
   - Barcode `mt-auto h-[46px] bg-[repeating-linear-gradient(90deg,var(--color-ink)_0_2px,transparent_2px_4px,var(--color-ink)_4px_5px,transparent_5px_8px)]` (= design `#0B1B3F 0 2px, transparent 2px 4px, #0B1B3F 4px 5px, transparent 5px 8px`).
   - Page 2 peek (rendered by `PdfViewer`): `w-full max-w-[360px] h-[120px] bg-white shadow-[0_2px_6px_rgb(0_0_0/0.12)] p-[22px] flex flex-col gap-1.5 font-sans`, 3 bars `h-2.5 rounded-xs bg-skeleton` at 80% / 70% / 76%.
4. **`PageCounterPill`** (`plan/PageCounterPill.tsx`, props `{ current, total }`): `pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[100px] h-[30px] px-3 rounded-full bg-ink/78 text-white text-13 font-semibold tabular-nums flex items-center`, text `` `${current} / ${total}` ``, `aria-label="Page {current} of {total}"`. Updates on scroll (deviation): on `scroll` (rAF-throttled) `current = scrollTop + clientHeight ≥ scrollHeight − 4 ? total : index of the page box containing the scroller's vertical midpoint` (keep previous if the midpoint falls in a gap). Initial "1 / 2".
5. Bottom bar `absolute inset-x-0 bottom-0 px-4 pt-4 pb-[max(28px,env(safe-area-inset-bottom))] flex gap-2.5 bg-white shadow-[0_-1px_0_rgb(11_27_63/0.06)]` (design `p-[16px_16px_28px]`, solid white, no gradient):
   - "Save" `Button variant="secondary" size="md" className="flex-1 gap-1.5 px-3.5 text-15 tracking-sm"` + `Download` `size-[18px]` → toast "Saved to your phone".
   - "Share" `Button variant="primary" size="md" className="flex-1 gap-2 text-15"` + `Share` `size-[18px]` → toast "Ticket shared to Goa crew".
   - (`md` = h-[50px]; the `text-15` override matches the design's 15px.) Toasts (offset 108) briefly cover the pill, as designed.

### 1.4 Expenses page (P3-15) — `app/trips/[tripId]/expenses/page.tsx`

```
<TripShell tripId active="expenses">
  <ScopeToggle value={scope} onChange={setScope} ariaLabel="Whose view" />
  <SpendSummary view={money} scope={scope} />
  <SectionHeader title="Settle up" meta="Everyone pays Rahul back" className="mt-2" />
  <Card variant="shadow" radius="2xl" className="pt-1.5 px-3.5 pb-0.5">{settlements.map(s => <SettleRow …/>)}</Card>
  <SectionHeader title="Transactions" meta="Visible to everyone" className="mt-2" />
  <Card variant="shadow" radius="2xl" className="px-3.5 py-0.5">{money.rows.map((t,i) => <TransactionRow tx={t} showDate first={i===0}/>)}</Card>
  <Button variant="white" size="base" asChild className="w-full gap-1.5 shadow-card"><Link href={seeAllHref}>{money.seeAll}<ChevronRight className="size-[15px]" strokeWidth={2.4}/></Link></Button>
</TripShell>
<RecordPaymentSheet open={sheet==='record'} onOpenChange={…} />
```
- `money = selectMoney(scope)` (§1.7). `scope` is local state seeded from `?scope=` (default `everyone`), synced back with `history.replaceState` on toggle (PLAN §12.1-19). Toggling swaps only the summary block and the transaction rows; "Settle up" and the "Transactions" header are scope-independent.
- **`ScopeToggle`** (P2-4, `SegmentedControl variant="contained"`, `role=tablist`): full width, `p-1 gap-1 bg-white border border-line`; items `h-10 flex-1 gap-1.5 text-15 font-semibold`, active `bg-black text-white`, inactive `text-muted`. "Everyone" leads with `AvatarStack [rahul, priya, arjun] size=20 overlap=-7 ring=white`; "Just me" leads with `Avatar aarav size=22` (no ring). Buttons (state), not links.
- **`SpendSummary`** (`money/SpendSummary.tsx`), `flex flex-col gap-2.5`:
  - Total row `flex items-center justify-between gap-3 pt-1 pl-1`: left column = amount `text-44 font-bold tracking-display leading-[1.05] tabular-nums` (`inr(total)`) + caption `text-15 text-muted`. Everyone: "₹64,920" / "spent by the crew". Me: "₹18,860" / "₹2,940 left of your ₹21,800" + right `Button variant="white" size="sm" asChild className="h-10 shrink-0 gap-1.5 pl-3 pr-3.5 shadow-card"` → `<Link href="/trips/goa/chat?sheet=budget">` with `Pencil` `size-[15px]` + "Edit budget".
  - **`SplitBar`** (`money/SplitBar.tsx`) `role="img" aria-label={bar.aria}` `my-0.5 h-3 flex gap-[3px] rounded-full overflow-hidden`, segments `rounded-full`: Stay `bg-info` `style={{width: stayPct+'%'}}`; Travel `bg-[#E07A5F]` (coral, no token — report) `flex-1` (everyone) or `style={{width: travelPct+'%'}}` (me). `bar.track` (me) adds `bg-line` to the container. Aria: "Stay ₹43,200, travel ₹21,720" / "86% of your budget used".
  - Tiles `grid grid-cols-2 gap-2.5` of 2 `CategoryTile` (P2-4): `p-3 flex items-center gap-2.5 rounded-4xl bg-white shadow-card`; `EmojiTile size=48 shape=rounded-xl` (Stay 🏡 on `#E3EEFB`, Travel 🧳 on `bg-peach-tint-2`); amount `text-18 font-semibold tabular-nums`; label row `text-13 text-muted flex items-center gap-1.5` with `size-2 rounded-full` dot (`bg-info` / coral). Everyone ₹43,200 / ₹21,720; me ₹10,800 / ₹8,060.
  - Me only: footnote `px-1 text-13 text-muted tracking-caption` "Stay is your share of Villa Sol. Travel is your own flights, both ways. Your budget is only visible to you."
- **`SettleRow`** (`money/SettleRow.tsx`, props `{ settlement, isYou }`): `py-3 flex items-center gap-2.5`, rows 2+ `border-t border-line`.
  - Open: `Avatar from size=36` → arrow `relative flex-1 h-0.5 bg-line-2` (`aria-hidden` decorations) holding the amount `absolute left-1/2 -top-[22px] -translate-x-1/2 text-16 font-bold tabular-nums whitespace-nowrap` (`text-go` when `fromId==='aarav'`, else `text-ink`) and the arrowhead `absolute -right-0.5 -top-1 border-l-[7px] border-l-line-2 border-y-[5px] border-y-transparent` → `Avatar to size=36` → action slot `w-[92px] flex justify-end`:
    - your debt: `Button variant="primary" className="h-[34px] px-[18px] text-13"` "Record" → `openSheet('record')` (state + `replaceState` adding `sheet=record`);
    - others: `Button variant="secondary" className="h-[34px] px-3.5 text-13 tracking-sm"` "Nudge" → toast "Go nudged Priya about her ₹10,800 share" (`copy.toast.nudge[fromId]`).
  - Settled: `Avatar size=36` + `flex-1 text-15 font-semibold` "Arjun is settled up" (`${firstName} is settled up`; for you "You’re settled up") + `CheckBadge size=24`.
  - Seed rows: You → Rahul ₹5,800 (Record) · Priya → Rahul ₹10,800 (Nudge) · Arjun settled.
- **`TransactionRow`** (`money/TransactionRow.tsx`, props `{ tx, showDate, first }`): `py-3 flex items-start gap-3` (+ `border-t border-line` unless `first`).
  - Avatar composite `relative size-10 shrink-0`: `Avatar payer size=40`; corner badge `absolute -right-1 -bottom-1`: `to.kind==='user'` → `Avatar to size=20 ring=white`; merchant with `img` → 20px photo `rounded-full ring-2 ring-white object-cover`; merchant with `emoji` → `size-5 box-border rounded-full border-2 border-white bg-surface-2 text-[10px] leading-none flex items-center justify-center` `<span aria-hidden>`.
  - Text `flex-1 min-w-0 flex flex-col gap-[3px]`: title `text-15 font-semibold leading-[1.3]` `` `${who} ${verb} ${toName}` `` (who = "You" for aarav else `firstName`); meta `flex flex-wrap items-center gap-1.5 text-13 text-muted`: `Badge variant="neutral" size="sm" className="text-ink"` (method) + `“${note}”` (omitted when note is empty).
  - Right `shrink-0 flex flex-col items-end gap-0.5`: `text-15 font-bold tabular-nums` `inr(amount)`; `showDate` → `text-13 text-muted` `dateLabel`.
- Rows: everyone = first 5 transactions; me = `mine` rows (3 in seed). Button: "See all 7 transactions" (everyone) / "See everyone’s transactions" (me), href `/trips/goa/expenses/transactions?scope={scope}`.

### 1.5 Transactions page (M6) — `app/trips/[tripId]/expenses/transactions/page.tsx`

`<Screen scroll="none">`, root `relative flex h-full flex-col bg-canvas`. No hero, tabs, Chat FAB or share sheet.
- Header `shrink-0 pt-[max(46px,env(safe-area-inset-top))] px-3 pb-3 bg-white shadow-[0_1px_0_rgb(11_27_63/0.05)] flex flex-col gap-2.5` (design top padding 46, not `pt-safe`'s 56; built locally because `TopBar` has no subtitle slot):
  - Row `flex items-center gap-1.5`: `Button variant="ghost" size="icon" asChild` → `<Link href={backHref} aria-label="Back">` + `ArrowLeft` `size-[22px]`; title column "Transactions" `text-20 font-bold tracking-h3` + "Every booking and payback, visible to the crew" `text-13 text-muted tracking-caption`.
  - `backHref = /trips/goa/expenses` + (`?scope=me` when this page was opened with `?scope=me`) — returns to the scope you came from (deviation).
  - **`FilterChips`** (`money/FilterChips.tsx`) `role="group" aria-label="Filter"` `flex gap-1.5 px-1 overflow-x-auto scrollbar-none`: `Chip size="lg"` (`h-10 px-3.5 text-14 font-semibold shrink-0`), `aria-pressed`, active `variant="solid"`, inactive `variant="outline"`; labels `All ${transactions.length}` ("All 7"), "Bookings", "Paybacks", "Mine". Filter is local state (default `all`).
- List `flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-3 pb-[120px] flex flex-col gap-2`:
  - **`TransactionGroup`** (`money/TransactionGroup.tsx`, props `{ label, rows }`) `flex flex-col gap-2`: `Eyebrow` `pt-1.5 px-1` (label uppercased, "16 OCT"); `Card variant="shadow" radius="2xl" className="px-3.5 py-0.5"` of `TransactionRow showDate={false}` (amount only on the right).
  - Groups = filtered rows grouped by `dateLabel` in store order (newest first).
  - Empty: `<p className="py-[30px] px-4 text-center text-13 text-muted">Nothing here yet.</p>`.
- Dock `FadeDock variant="gradient"` (design `padding 30 16 24`, gradient to canvas at 40%): `Button variant="primary" size="xl" asChild className="w-full gap-2"` → `<Link href="/trips/goa/expenses?scope=me&sheet=record">` + `Plus` `size-[18px]` + "Record a payment".
- Filter rules: `all` → every row; `booking` → `kind==='booking'`; `payback` → `kind==='payback'`; `mine` → `mine===true`. Seed counts: All 7 rows / 5 groups (16, 15, 14, 13, 12 Oct) · Bookings 5 (14, 13, 13, 12, 12 Oct) · Paybacks 2 (16, 15 Oct) · Mine 3 (You paid Rahul · You booked with IndiGo · Rahul booked with Villa Sol).

### 1.6 `RecordPaymentSheet` (M7) — `sheets/RecordPaymentSheet.tsx`

Props `{ open, onOpenChange }`. Reads the open settlement `fromId==='aarav'` (payee Rahul, `owed` 5,800). On open it resets: amount = `owed` formatted en-IN without "₹" ("5,800"), via `'UPI'`, note `''`. Close (X, scrim, swipe) → `replaceState` dropping `sheet` (stays on Expenses in the current scope).
- `BottomSheet top={120} aria-label="Record a payment"`; `SheetHeader title="Record a payment" subtitle="For money you sent outside Go, like UPI or cash. Nothing is charged here."`; `SheetBody className="pb-[150px]"` (`px-4 pt-2 gap-3`).
- Amount card `Card variant="float-sm" radius="2xl" className="border border-line p-[18px_16px] flex flex-col items-center gap-3.5"`:
  - `self-stretch flex items-center gap-2.5`: column (`Avatar aarav size=48` + "You" `text-13 font-semibold`, `gap-1`) · connector `flex-1 h-0.5 mb-5 bg-line-2` (no arrowhead) · column (`Avatar rahul size=48` + "Rahul"). Static, no payer or payee picker.
  - `<label htmlFor="ramt" className="flex items-baseline gap-1">`: "₹" `text-30 font-bold text-muted`; `<span className="sr-only">Amount</span>`; `<Input id="ramt" shape="bare" type="text" inputMode="numeric" value={amount} onChange=…>` (controlled, deviation): keep digits only, max 6, re-format `en-IN` on every change ("5800" → "5,800"); empty allowed.
  - Status `text-13 text-muted`: `n ≥ owed` → "Settles you up with Rahul"; else `` `${inr(owed − n)} still left to settle` ``.
- "PAID VIA" `Eyebrow px-1` + **`PaidViaChips`** (`money/PaidViaChips.tsx`, props `{ value, onChange }`) `role="radiogroup" aria-label="Paid via"` `flex flex-wrap gap-2`: `Chip size="lg"` `role="radio" aria-checked`, selected `variant="solid"`, unselected `variant="outline" className="border-0 shadow-[inset_0_0_0_1px_var(--color-line-2)]"`; options UPI (default), Cash, Bank transfer, Other.
- `InputField shape="field" label="NOTE (OPTIONAL)" id="rnote" placeholder="e.g. villa + groceries"` (eyebrow caption, `gap-1.5`; field `h-[52px] rounded-3xl border-line-2 px-4 text-16 tracking-body`).
- No date, split or category fields. No partial-payment toggle.
- `SheetFooter` (`pt-10 px-4 pb-safe gap-2.5`, gradient at 35%):
  - `Button variant="primary" size="xl" className="w-full" disabled={n === 0}` label `` `Record ₹${amount || '0'}` `` ("Record ₹5,800") → `recordPayment({ amount: n, via, note: note.trim() })` → toast "Recorded · Rahul gets a ping to confirm" (deviation: toast added) → close.
  - Helper `self-center flex items-center gap-1.5 text-13 text-muted`: `Avatar rahul size=18` + "Rahul gets a ping to confirm he got it".
- Store effects of `recordPayment` (money slice, P2-2):
  1. push `{amount, via, note}` to `recorded`;
  2. prepend `Transaction { id: 'tx-rec-<n>', date: 'today' /* not used for grouping */, dateLabel: 'Today', payerId: 'aarav', verb: 'paid', to: { kind: 'user', id: 'rahul' }, amount, method: via, note, kind: 'payback', mine: true }`;
  3. settlement aarav→rahul: `amount = max(0, owed − n)`, `status = amount === 0 ? 'settled' : 'open'`;
  4. `selectPending(tripId)` drops the trip-home "settle up" pending row (cleared on any recording, PLAN §9.4 "until recorded");
  5. spend totals are unchanged (paybacks are not spend). Counters update: "All 8", "See all 8 transactions".

### 1.7 Data

**Types (§9.1) — required changes (P2-1):** `Transaction.method: 'Cash' | 'UPI' | 'Card' | 'Bank transfer' | 'Other'`; `TicketDoc` gains `title: string`; `TicketDoc.flight` holds the PDF centre label `"6E 5313 · Economy"`. `Booking.media.bg` is a key (§1.2), not a class.

**`src/data/seed/bookings.ts`** (also read by the J spec for `details` / `pnr`; fill those per J):

| id | type | media | accent | eyebrow | title | sub | memberIds | stub | href |
|---|---|---|---|---|---|---|---|---|---|
| `travel-out` | travel-out | logo, IndiGo wordmark, bg `indigo` | info | FRI 6 · GETTING THERE | Everyone to Goa | 2 flights · 1 train · 1 bus | aarav, rahul, priya, arjun | count 4 | `/trips/goa/bookings/travel-out/ticket` |
| `stay` | stay | photo `assets` villa-sol, bg `none` | success | FRI 6 → MON 9 | Villa Sol | Anjuna · 3 nights · late check-in | aarav, rahul, priya, arjun | booked | `/trips/goa?open=stay` |
| `travel-back` | travel-back | emoji 🛬, bg `stay-tint` (#E3EEFB) | info | MON 9 · GETTING BACK | Everyone home | 1 flight · 1 train · 1 bus | aarav, rahul, priya | count 3 | `/trips/goa/bookings/travel-back/ticket` |

Both travel bookings carry the same `ticket` (K4 "Download" targets `travel-out`): `{ title: 'IndiGo e-ticket', fileName: '6E5313-K7QX2M.pdf', pages: 2, pnr: 'K7QX2M', booked: '12 Oct 2026', passenger: 'Aarav Shah', seat: '14A', flight: '6E 5313 · Economy', from: { code: 'BLR', place: 'Bengaluru T1', time: 'Fri 6 Nov, 20:40' }, to: { code: 'GOX', place: 'Goa, Mopa', time: 'Fri 6 Nov, 21:55' } }`.

**`src/data/seed/money.ts`** — `transactions` (store order, newest first; notes verbatim, curly quotes added at render):

| id | date | dateLabel | payerId | verb | to | amount | method | note | kind | mine |
|---|---|---|---|---|---|---|---|---|---|---|
| tx1 | 2026-10-16 | 16 Oct | aarav | paid | user rahul | 5000 | Cash | part of villa, rest on Friday | payback | true |
| tx2 | 2026-10-15 | 15 Oct | arjun | paid | user rahul | 10800 | UPI | villa share 🏡 | payback | false |
| tx3 | 2026-10-14 | 14 Oct | priya | booked with | merchant redBus, emoji 🚌 | 2700 | UPI | Bus both ways | booking | false |
| tx4 | 2026-10-13 | 13 Oct | rahul | booked with | merchant IRCTC, emoji 🚆 | 2900 | UPI | Train both ways | booking | false |
| tx5 | 2026-10-13 | 13 Oct | arjun | booked with | merchant IndiGo, emoji ✈️ | 8060 | Card | Flights both ways | booking | false |
| tx6 | 2026-10-12 | 12 Oct | aarav | booked with | merchant IndiGo, emoji ✈️ | 8060 | UPI | Flights both ways | booking | true |
| tx7 | 2026-10-12 | 12 Oct | rahul | booked with | merchant Villa Sol, img villa-sol | 43200 | Card | Villa Sol, 3 nights · split 4 ways | booking | true |

`settlements`: `{aarav→rahul 5800 open}`, `{priya→rahul 10800 open}`, `{arjun→rahul 0 settled}` (seed order = row order). `spend`: `{ crew: { stay: 43200, travel: 21720 }, me: { stay: 10800, travel: 8060 }, budget: 21800 }` (21,720 = 8,060 + 8,060 + 2,900 + 2,700; budget literal per §12.1-6). P2-2 decides which transactions each chat stage reveals; at stage `plan` all 7 exist.

**`selectMoney(scope)`** (`src/store/selectors.ts`):
```ts
interface MoneyView {
  total: number;          // everyone 64920 = crew.stay + crew.travel · me 18860
  caption: string;        // "spent by the crew" · `${inr(budget − total)} left of your ${inr(budget)}` = "₹2,940 left of your ₹21,800"
  bar: { track: boolean; stayPct: number; travelPct: number | null; aria: string };
                          // everyone: false, 66.5 (=43200/64920, 1 dp), null (flex-1), "Stay ₹43,200, travel ₹21,720"
                          // me: true, 49.5 (=10800/21800), 37 (=8060/21800), `${Math.floor(total/budget*100)}% of your budget used` = "86% …"
  tiles: { stay: number; travel: number };   // 43200/21720 · 10800/8060
  footnote: string | null;                   // me only (verbatim §1.4)
  showEditBudget: boolean;                   // me only
  settlements: Settlement[];                 // scope-independent
  rows: Transaction[];                       // everyone: transactions.slice(0, 5) · me: transactions.filter(t => t.mine)
  seeAll: string;                            // `See all ${transactions.length} transactions` · "See everyone’s transactions"
}
```
Also `selectBookings(tripId)` (`[]` unless planned) and `selectTicket(tripId, bookingId)` (seed lookup, ungated).

**`copy.ts` toasts:** "Ticket PDF downloaded" · "Ticket shared to Goa crew" · "Saved to your phone" · "Go nudged Priya about her ₹10,800 share" · "Recorded · Rahul gets a ping to confirm".

### 1.8 Deviations (flag in code with `// DESIGN-ASSUMPTION`)

1. PLAN §12.1-16: PDF passenger reads "Aarav Shah" (design literal "[YOUR NAME]"); 24h times kept on the PDF.
2. PLAN §12.1-17: record amount is a controlled, en-IN formatted input defaulting to the open debt (5,800). The CTA label and status line track it (design: grey placeholder, uncontrolled). Partial-payment toggle omitted (orphaned `full`/`.knob` in design). A partial amount reduces the You→Rahul settlement, and a full amount settles it.
3. PLAN §12.1-19: Expenses scope is local state synced to `?scope=` via `replaceState`.
4. Page counter pill updates on scroll (design static "1 / 2").
5. Record CTA shows the toast "Recorded · Rahul gets a ping to confirm" and closes (design navigates silently).
6. Status line is computed (design half-mode "₹6,900 still left to settle" is wrong: 5,800 − 2,900 = 2,900).
7. Transactions back returns to the previous scope (`?scope=` carried). The design always goes to Money-Everyone.
8. M7 underlay is the live Expenses page in the current scope; close stays there. The design uses a simplified underlay with a 250px hero, and its close always goes to Money-Me.
9. Counts computed from data: "{n} bookings", "All {n}", "See all {n} transactions" (3 / 7 / 7 in seed).
10. New strings: "You’re settled up" (your debt cleared) and the "Today" date label for recorded payments.
11. M2 preset uses `?collapsed=1` → `TripShell forceCollapsed`. With 3 cards the page is too short to scroll 200px.
12. Token approximations: booking card `shadow-float-sm` (design `0 6px 18px rgb(11 27 63/0.06)`); Transactions dock `FadeDock gradient` 35% (design 40%); `See all` / `Edit budget` use `shadow-card` (design standard card shadow) instead of Button white's `shadow-btn`. Missing tokens used raw (report): coral `#E07A5F`, stay tint `#E3EEFB`.
13. Ticket viewer is not stage-gated, and Close always goes to Bookings (PLAN §8), including when opened from F7/K4.
14. Data kept as designed: "Everyone home" says "1 flight" with 3 avatars (You, Rahul, Priya), though Arjun also flies home.

### 1.9 Acceptance checklist

**M1** — [ ] planned `goa`: hero, big tabs (Bookings active), "Booked" / "3 bookings", 3 cards in seed order with exact eyebrow, title, sub, avatars (4/4/3) and stub (4 TICKETS / ✓ BOOKED green-ink / 3 TICKETS) · [ ] card min-h 108, radius 20, border `line`, accent stripe blue/green/blue 3px, media 92w (IndiGo 64w on `#2B399B` / villa cover / 🛬 34px on `#E3EEFB`), stub 80w with dashed 1.5px divider and two canvas-coloured 16px notches biting the top and bottom edges · [ ] press = scale .985 + `#F5F6F8` · [ ] card 1/3 → ticket viewer, card 2 → `/trips/goa?open=stay` · [ ] stage ≠ planned → I3 zero state.
**M2** — [ ] `?collapsed=1` (and live scroll ≥ 200 when content allows) shows the 148px compact header ("Goa", "Fri 6 – Mon 9 Nov", compact tabs with Bookings active) at opacity 1 with clickable back/share/tabs; between 110 and 200px it fades in 0.05 steps.
**M3** — [ ] viewer canvas `#E4E7EC`; toolbar X / "IndiGo e-ticket" / "6E5313-K7QX2M.pdf · 2 pages" / Download / Share · [ ] page 1 serif 360×509 with `shadow-page`, chip, "E-TICKET / ITINERARY", meta grid (PNR **K7QX2M**, Booked 12 Oct 2026, Passenger **Aarav Shah**, Seat **14A**), route band BLR 20:40 → GOX 21:55 "6E 5313 · Economy", 4+3 skeleton bars, barcode 46px; page 2 peek 120px · [ ] pill "1 / 2" at bottom 100, becomes "2 / 2" when scrolled to the end · [ ] 4 toasts exact; X → `/trips/goa/bookings` · [ ] unknown `bookingId` → 404.
**M4** — [ ] toggle "Everyone" active (3-stack), "₹64,920" / "spent by the crew", split bar 66.5% blue + coral rest with 3px gap and no track, tiles 🏡 ₹43,200 Stay / 🧳 ₹21,720 Travel · [ ] Settle up: You→Rahul "₹5,800" terracotta + black "Record"; Priya→Rahul "₹10,800" ink + grey "Nudge" (toast exact); "Arjun is settled up" + green check 24 · [ ] 5 transaction rows (tx1–tx5) with badges (Rahul photo ×2, 🚌, 🚆, ✈️), method pills, curly-quoted notes, amount + date · [ ] "See all 7 transactions" → `/trips/goa/expenses/transactions?scope=everyone`.
**M5** — [ ] `?scope=me` loads "Just me" active; "₹18,860" / "₹2,940 left of your ₹21,800" + "Edit budget" (→ `/trips/goa/chat?sheet=budget`); bar with grey track, 49.5% + 37%; tiles ₹10,800 / ₹8,060; footnote verbatim · [ ] Settle up identical to M4 · [ ] 3 rows (tx1, tx6, tx7 with villa-photo badge) + "See everyone’s transactions" · [ ] toggling updates `?scope=` without a navigation.
**M6** — [ ] header (back, "Transactions", sub), chips "All 7" active; 5 date groups 16/15/14/13/12 OCT, rows without dates · [ ] Bookings → 5 rows, Paybacks → 2, Mine → 3; chip `aria-pressed` · [ ] back → Expenses in the scope you came from · [ ] dock "Record a payment" → `/trips/goa/expenses?scope=me&sheet=record` (= M7).
**M7** — [ ] sheet top 120 over M5: title, sub, close X; You 48 — line — Rahul 48; "₹" + "5,800" in ink; "Settles you up with Rahul"; PAID VIA UPI selected (radio semantics); note field placeholder; CTA "Record ₹5,800"; helper with Rahul 18 · [ ] typing "2900" shows "2,900", CTA "Record ₹2,900", status "₹2,900 still left to settle"; empty → CTA "Record ₹0" disabled · [ ] CTA → toast, sheet closes, You→Rahul row becomes "You’re settled up" (full) or shows the remaining amount (partial); "You paid Rahul" payback (Today) tops the transaction lists; "All 8"; trip-home settle-up pending row gone · [ ] scrim / X / swipe close without recording.

### 1.10 Consumed by tasks

- **P3-14** — §1.1 (M1–M3), §1.2, §1.3, §1.8 items 1, 4, 11, 13, 14, and the M1–M3 checklists. Owns per PLAN §10, **plus `plan/PageCounterPill.tsx`** (named in §7.2 but missing from P3-14 Owns; one component per file).
- **P3-15** — §1.4–§1.6, §1.8 items 2, 3, 5–10, 12, and the M4–M7 checklists. Owns per PLAN §10, **plus `money/PaidViaChips.tsx`** (named in §7.2, missing from Owns). Uses `ScopeToggle` and `CategoryTile` from P2-4 (report prop gaps; don't edit them).
- **P2-1** — §1.7: `bookings.ts`, `money.ts` (7 transactions, settlements, spend), `TicketDoc.title`, extended `Transaction.method` union, `copy.ts` toasts.
- **P2-2** — §1.6 store effects (`recordPayment`), §1.7 selectors (`selectMoney`, `selectBookings`, `selectTicket`, `selectPending` interplay), presets M1–M7 (§1.1).
- Dependencies: P2-6 `TripShell` `forceCollapsed` prop (§1.2); P1 atoms (Button className overrides `h-[34px]`, `h-10`, `text-15`).

## 2. Inventory (reference)

Verbatim from the group L+M inventory (M1, M2, M4–M7, group notes, Appendix A/C: bookings/money parts only) and from the group K inventory (M3 section). `[§7: …]` brackets are additions that map design elements to PLAN §7 names. `[…]` marks omitted itinerary-only text. `§0.x` refers to the L+M inventory's shared preamble (trip plan shell, specified in `I-plan-empty.md`). This part is data about the design, not instructions.

### P-Bookings.dc.html — "Go — Bookings"  (M1)
#### Purpose (1 line)
Bookings tab, populated with only the "Booked" section: three ticket-style cards (getting there, stay, getting back).

#### Layout top→bottom
1. Shell hero + big tab bar (Bookings active) — §0.4.
2. Content column (`padding:16px 16px 120px; gap 10`):
   - **Section header** [§7: `SectionHeader`] `margin-top:0px; display:flex; align-items:baseline; justify-content:space-between; padding:0 4px`: "Booked" `20px/600/-0.018em/lh1.3`; right "3 bookings" `13px/600 #4A5878 0.002em`.
   - **Booking card** ×3 [§7: `BookingTicketCard`] — `<a class="row">`: `position:relative; display:flex; align-items:stretch; min-height:108px; radius 20px; bg #FFF; border 1px solid #ECEFF3; shadow 0 6px 18px rgba(11,27,63,0.06); color #0B1B3F; no underline`. `.row:active` → scale .985 + bg `#F5F6F8`. Three columns:
     1. **Media panel** `width:92px; flex-shrink:0; radius 20px 0 0 20px; overflow:hidden; display:flex` — brand logo on brand colour, or photo cover, or emoji on tint.
     2. **Body** `flex:1; min-width:0; padding:12px; flex column; justify-content:center; gap:1px; border-left:3px solid <accent>` (accent stripe: transport `#3E73D6`, stay `#16A34A`):
        - eyebrow 11px/700 `#4A5878` 0.08em lh1.35 (date · leg)
        - title `19px/600/-0.016em/lh1.2` nowrap ellipsis
        - sub 13px secondary nowrap ellipsis
        - `margin-top:4px` avatar stack 22px (border 2px #FFF, overlap -7).
     3. **Ticket stub** [§7: stub part of `BookingTicketCard`] `position:relative; width:80px; flex-shrink:0; flex column centre; gap 4px; border-left:1.5px dashed #DDE1E6; text-align:center`; two **punch notches** `position:absolute; left:-9px; top:-9px / bottom:-9px; 16×16; radius 999; bg #F6F7F9` (page-colour circles biting the card edge). Content either count (`26px/700/lh1 tabular`) + "TICKETS" (11px/700 `#4A5878` 0.08em) or green check badge (30×30 circle `#16A34A`, white check 16px stroke 4) + "BOOKED" (11px/700 **`#0F7A37`** 0.08em).
   - Two empty placeholder lines follow (where other sections — e.g. "to book" — would be in other states). No filter UI, no prices, no PNRs, no status pills, no chevrons in this file.
3. Compact header, bottom fade, Chat FAB, share sheet, toast — §0.4.

#### Sheets / overlays
Only shell share sheet + toast (§0.4).

#### State & interactions
`PBase` state `{collapsed:false}` (+ `hp`), `headStyle`/`onScroll` collapsing header (fades in between scrollTop 110→200). Component adds pT/pShare/pSent. Handlers: `pa_0` hero share, `pa_1` compact share → open; `pa_2` Messages, `pa_3` Gmail, `pa_4` Copy link, `pa_5` More → toast+close; `pa_6` backdrop close; `pa_7` Copy → toast. Cards are plain links (press feedback via `.row`).

#### Navigation table
| Element | Target |
|---|---|
| Card "Everyone to Goa" | `P-Ticket-PDF.dc.html` |
| Card "Villa Sol" | `P-Home-StayOpen.dc.html` |
| Card "Everyone home" | `P-Ticket-PDF.dc.html` |
| Back / tabs / Chat FAB / share targets | as §0.4 (Bookings tab → self) |

#### Data shown (seed values)
| # | Media | Accent | Eyebrow | Title | Sub | Avatars | Stub |
|---|---|---|---|---|---|---|---|
| 1 | IndiGo logo `/_blob/7a6cf4a7c21683d8f45d293789e8c8e9` (alt "IndiGo", width 64px, height auto) centred on `#2B399B` | `#3E73D6` | FRI 6 · GETTING THERE | Everyone to Goa | 2 flights · 1 train · 1 bus | You, Rahul, Priya, Arjun | **4** TICKETS |
| 2 | Villa photo `/_blob/87722708aa25c51e09f9d819498d4f74` (alt "", 100%/100% cover) | `#16A34A` | FRI 6 → MON 9 | Villa Sol | Anjuna · 3 nights · late check-in | You, Rahul, Priya, Arjun | ✓ BOOKED |
| 3 | 🛬 34px on `#E3EEFB` | `#3E73D6` | MON 9 · GETTING BACK | Everyone home | 1 flight · 1 train · 1 bus | You, Rahul, Priya (3) | **3** TICKETS |
Header count: "3 bookings".

#### Icons & images
- SVG: check (stroke 4, 16px) in BOOKED badge; shell icons.
- Emoji: 🛬 (return card media), hero/share emoji.
- `/_blob/`: IndiGo logo `7a6cf4a7…` 64px wide; villa photo `87722708…` 92×≥108 cover; avatars 22px; hero; Go avatar; share icon.

---

### P-Bookings-Scrolled.dc.html — "Go — Bookings, scrolled"  (M2)
#### Purpose (1 line)
Static snapshot of M1 after scrolling past the hero: hero + big tab bar gone, compact sticky header pinned on top.

#### Layout top→bottom
1. **Compact header** [§7: `CollapsingTripHeader`] — always visible, static style (no opacity/transform/onScroll binding): `position:absolute; left:0; right:0; top:0; z-index:4; padding:46px 12px 10px; bg #FFF; shadow 0 1px 0 rgba(11,27,63,.05), 0 8px 20px rgba(11,27,63,.08); flex column; gap 8px`. Total height = 46 + 40 (row) + 8 + 44 (tab bar 36+2×4) + 10 = **148px**.
   - Row (gap 6): back 40×40 (→ P-App-Home), "Goa" 17px/700/-0.014em + "Fri 6 – Mon 9 Nov" 13px secondary, share 40×40 (`pa_0`).
   - Compact tab bar (`padding 4; gap 2; radius 999; bg #F4F5F7`; tabs 36px, 14px/600; Bookings active #000/#FFF).
   What remains vs expanded: title + dates only — no hero photo, countdown, avatar stack, or big pill tabs.
2. **Scroller** (no hero): `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; padding:148px 16px 120px; flex column; gap 10px` → identical "Booked" header + 3 booking cards as M1.
3. Bottom fade, Chat FAB, share sheet, toast — §0.4.

#### Sheets / overlays
Shell share sheet + toast only.

#### State & interactions
`PBase` state `{collapsed:false}`; `renderVals` returns `collapsed` and an `onScroll` (`collapsed = scrollTop > 190`) that is **not bound** to any element (scroller has no onScroll attr). Handlers renumbered: `pa_0` share (compact) → open; `pa_1` Messages, `pa_2` Gmail, `pa_3` Copy link, `pa_4` More → toast+close; `pa_5` backdrop; `pa_6` Copy → toast.

#### Navigation table
Same as M1 (cards → `P-Ticket-PDF` / `P-Home-StayOpen` / `P-Ticket-PDF`; compact back → `P-App-Home`; tabs; Chat FAB → `P-Chat-Plan`).

#### Data shown
Identical to M1.

#### Icons & images
Identical to M1 minus hero image and 28px hero avatar stack.

---

### P-Ticket-PDF.dc.html — M3 Ticket PDF viewer

#### Purpose (1 line)
In-app PDF viewer for the IndiGo e-ticket (2 pages) with download/share in top bar and Save/Share bottom bar.

#### Layout top→bottom
**Root** 420×912 flex column, **bg #E4E7EC** (grey viewer canvas).
1. **Toolbar** [§7: `PdfViewer` toolbar] `flex-shrink 0; padding 56px 12px 10px; bg #FFF; flex center; gap 8; shadow 0 1px 0 rgba(11,27,63,.06)`:
   - Close `<a href=P-Bookings aria-label="Close">` 44×44 r999, X SVG 22 sw2.
   - Title block `flex:1; min-width 0; column gap 1`: "IndiGo e-ticket" 16px/600 `-0.011em` lh1.3 ellipsis; "6E5313-K7QX2M.pdf · 2 pages" 13px #4A5878 `0.002em` lh1.35 ellipsis.
   - Download icon btn `role=button onClick=pa_0 aria-label="Download"` 44×44; download SVG 20 (`M12 3v12`, `M7 10l5 5 5-5`, `M5 21h14`, sw2).
   - Share icon btn `onClick=pa_1 aria-label="Share"` 44×44; share SVG 20.
   - **No zoom/expand control** in this file (the `M15 3h6v6…` expand SVG only exists on K2/K3 backdrop rows).
2. **Page scroller** `flex:1; overflow-y:auto; scrollbar none; bg #E4E7EC; padding 20px 0 120px; column gap 16`:
   - **Page 1** [§7: `PdfPage`] `360×509` (≈A4 1:1.414), `align-self center; box-sizing border-box; padding 22px; #FFF; shadow 0 2px 6px rgba(0,0,0,.12), 0 12px 30px rgba(0,0,0,.10); column gap 14; font-family Georgia, 'Times New Roman', serif` (square corners):
     - Header row space-between: logo chip `h26; pad 0 8; bg #2B399B` with IndiGo img width 50; "E-TICKET / ITINERARY" 11px/700 `0.04em`.
     - Meta grid `grid 2 cols minmax(0,1fr); gap 6px 12px; 10px; lh1.35`: "PNR: **K7QX2M**" · "Booked: 12 Oct 2026" · "Passenger: **[YOUR NAME]**" · "Seat: **14A**".
     - Route band `border-top & border-bottom 1px solid #0B1B3F; padding 10px 0; flex space-between; 10px lh1.4`: left "**BLR**"(18px bold)/"Bengaluru T1"/"Fri 6 Nov, 20:40"; centre (align-self center) "6E 5313 · Economy"; right (text-align right) "**GOX**"/"Goa, Mopa"/"Fri 6 Nov, 21:55".
     - Placeholder text block `column gap 6`: 4 bars `h10 r3 #E6E9EE` widths 92% / 84% / 88% / 60%.
     - Fare block `column gap 6; margin-top 4`: "Fare summary" 10px/700; 3 bars `h8 r3 #E6E9EE` widths 70% / 66% / 72%.
     - Barcode `margin-top:auto; h46; background: repeating-linear-gradient(90deg, #0B1B3F 0 2px, transparent 2px 4px, #0B1B3F 4px 5px, transparent 5px 8px)` (full content width ~316px).
   - **Page 2 (peek)** `360×120; align center; #FFF; shadow 0 2px 6px rgba(0,0,0,.12) only; padding 22; column gap 6`: 3 bars `h10 r3 #E6E9EE` widths 80% / 70% / 76%. (Truncated page used as "more below" affordance; system font, not Georgia.)
3. **Page counter pill** [§7: `PageCounterPill`] abs `left 50%; bottom 100px; translateX(-50%); h30; pad 0 12; r999; bg rgba(11,27,63,.78); #FFF; 13px/600; tabular-nums`: "1 / 2" (static).
4. **Bottom bar** abs bottom `padding 16px 16px 28px; flex; gap 10; bg #FFF; shadow 0 -1px 0 rgba(11,27,63,.06)` (solid, not gradient):
   - "Save" `role=button onClick=pa_2` `h50; pad 0 14; flex:1; gap 6; r999; bg #F2F2F2; #0B1B3F; 15px/600; -0.004em; lh1.35` + download SVG 18.
   - "Share" `role=button onClick=pa_3` `h50; pad 0 18; flex:1; gap 8; r999; #000/#FFF; 15px/500; -0.014em; lh1.3` + share SVG 18.
   - Toast (bottom 108) overlaps the "1 / 2" pill zone (bottom 100–130) when shown.

#### Sheets / overlays
- None. Toast only.

#### State & interactions (DCLogic)
- No screen state (PBase returns `{}`); boilerplate `pT, pShare, pSent`.
- pa_0 toolbar Download → "Ticket PDF downloaded"; pa_1 toolbar Share → "Ticket shared to Goa crew"; pa_2 Save → "Saved to your phone"; pa_3 Share → "Ticket shared to Goa crew".
- Page pill doesn't update on scroll; no pinch-zoom, no page thumbnails.

#### Navigation table
| Element | Target |
|---|---|
| Close (X) | P-Bookings.dc.html |
| Download / Share / Save / Share | toasts only |
| Inbound | from P-Bookings & P-Bookings-Scrolled (`.row` links ×2 each) and P-Chat-PrivateSheet |

#### Data shown (seed values)
- File "6E5313-K7QX2M.pdf", 2 pages; title "IndiGo e-ticket".
- PNR **K7QX2M**; Booked 12 Oct 2026; Passenger "[YOUR NAME]" (literal placeholder); Seat 14A; 6E 5313 Economy; BLR Bengaluru T1 Fri 6 Nov 20:40 → GOX Goa, Mopa Fri 6 Nov 21:55; fare summary not filled (skeleton bars).

#### Icons & images
- SVGs: X close (22), download (20 toolbar / 18 Save), share (20 toolbar / 18 Share); all sw2 round.
- Blob: IndiGo logo `7a6cf4a7c21683d8f45d293789e8c8e9` width 50 on #2B399B chip (alt "IndiGo").
- Barcode via CSS repeating-linear-gradient (not an image).

---

### P-Money-Everyone.dc.html — "Go — Expenses, everyone"  (M4)
#### Purpose (1 line)
Expenses tab, crew view: total spent with Stay/Travel split, settle-up debts to Rahul, and latest transactions.

#### Layout top→bottom
1. Shell hero + big tab bar (Expenses active → `P-Money-Everyone.dc.html`) — §0.4.
2. Content column (`padding:16px 16px 120px; gap 10`):
   **2a. "Whose view" toggle** [§7: `ScopeToggle`] `role=tablist aria-label="Whose view"`: full width, `padding:4px; gap:4px; radius 999; bg #FFF; border 1px #ECEFF3`. `sc-for views` buttons (state-driven, **not links** unlike the Plan toggle): `flex:1; height:40px; border:0; radius 999; flex centre; gap 6px; 15px/600`; selected `#000/#FFF`, else `transparent/#4A5878`. "Everyone" with 3-avatar stack 20px (Rahul, Priya, Arjun), "Just me" with You avatar 22px.
   **2b. Summary (sc-if isAllV)** (flex column gap 10):
   - Total block `padding:4px 0 0 4px; flex; space-between; gap 12`: amount "₹64,920" `44px/700/-0.03em/lh1.05 tabular #0B1B3F`; caption "spent by the crew" `15px #4A5878`.
   - **Split bar** [§7: `SplitBar`] `role=img aria-label="Stay ₹43,200, travel ₹21,720"`: `margin:2px 0; height:12px; display:flex; gap:3px; radius 999; overflow:hidden` → segment Stay `width:66.5%; bg #3E73D6; radius 999` + segment Travel `flex:1; bg #E07A5F; radius 999` (two separated rounded pills, no track).
   - **Category tiles** [§7: `CategoryTile`] `grid; 2 cols minmax(0,1fr); gap 10`: tile `padding:12px; flex centre; gap 10; radius 18; bg #FFF; standard card shadow`; icon square 48×48 radius 12 emoji 22px (Stay 🏡 on `#E3EEFB`; Travel 🧳 on `#FBE8DC`); amount `18px/600 tabular`; label row `13px #4A5878 gap 6` with 8px dot (Stay `#3E73D6`, Travel `#E07A5F`).
   **2c. Summary (sc-if isMeV)** — hidden here; see M5.
   **2d. "Settle up" section header** `margin-top:8px; flex; baseline; space-between; padding:0 4px`: "Settle up" 20px/600/-0.018em/lh1.3; right "Everyone pays Rahul back" 13px/600 `#4A5878`. (Shown in both scopes.)
   **2e. Settle card** [§7: `Card` + `SettleRow` ×3] `padding:6px 14px 2px; radius 22; bg #FFF; standard shadow`. Rows `padding:12px 0; flex; align-items:center; gap 10`; rows 2+ have `border-top:1px solid #ECEFF3`.
   - Debt row anatomy: payer avatar 36px → **arrow line** `flex:1; position:relative; height:2px; bg #DDE1E6` containing amount label `position:absolute; left:50%; top:-22px; translateX(-50%); 16px/700 tabular nowrap` and CSS arrowhead `position:absolute; right:-2px; top:-4px; border-left:7px solid #DDE1E6; border-top/bottom:5px solid transparent` → payee avatar 36px → action slot `width:92px; flex; justify-content:flex-end`.
   - Row 1: You → Rahul, amount "₹5,800" in **`#A44F3A`** (your own debt highlighted); action **"Record"** `<a>` `height:34px; padding:0 18px; gap 8; radius 999; bg #000; #FFF; 13px/500; -0.014em; lh1.3; nowrap` → `P-Money-Record.dc.html`.
   - Row 2: Priya → Rahul, "₹10,800" in `#0B1B3F`; action **"Nudge"** `<a role=button>` `height:34px; padding:0 14px; gap 6; radius 999; bg #F2F2F2; #0B1B3F; 13px/600; -0.004em; lh1.35` → `pa_2` toast.
   - Row 3: Arjun avatar 36px + "Arjun is settled up" `flex:1; 15px/600` + green check badge 24×24 circle `#16A34A`, white check 13px stroke 4.
   **2f. "Transactions" header**: "Transactions" 20px/600 + right "Visible to everyone" 13px/600 `#4A5878` (both scopes).
   **2g. Transactions (sc-if isAllV)** (flex column gap 10):
   - Card `padding:2px 14px; radius 22; bg #FFF; standard shadow`. Row `padding:12px 0; display:flex; align-items:flex-start; gap:12px`; rows 2+ `border-top:1px solid #ECEFF3`.
   - Row anatomy [§7: `TransactionRow`]: **avatar composite** 40×40 relative: payer photo 40px circle + corner badge `position:absolute; right:-4px; bottom:-4px` = either payee photo 20px (border 2px #FFF) or emoji disc 20px (`box-sizing:border-box; border 2px #FFF; bg #F4F5F7; font-size 10px`) for merchant categories · **text column** `flex:1; min-width:0; gap:3px`: title `15px/600/lh1.3` ("{who} {verb} {to}") + meta row `flex; align-items:center; gap 6; flex-wrap; 13px #4A5878` with **method pill** (`height:22px; padding:0 8px; radius 999; bg #F4F5F7; inline-flex; 12px/700; #0B1B3F`) followed by curly-quoted note “…” · **right column** `flex column; align-items:flex-end; gap 2; flex-shrink 0`: amount `15px/700 tabular`, date `13px #4A5878`.
   - No split badge on rows (split info, when present, is inside the note: "split 4 ways").
   - **"See all 7 transactions"** button `<a>` `height:44px; flex centre; gap 6; radius 999; bg #FFF; standard shadow; 15px/600` + chevron 15px stroke 2.4 → `P-Transactions.dc.html`.
   **2h. Transactions (sc-if isMeV)** — hidden here; see M5.
3. Compact header, bottom fade, Chat FAB, share sheet, toast — §0.4.

#### Sheets / overlays
Shell share sheet + toast. Nudge toast: "Go nudged Priya about her ₹10,800 share".

#### State & interactions
`PBase` state `{ collapsed:false, view:'all' }` (+ `hp`). Derived: `views` = [['all','Everyone'],['me','Just me']] → `{label,isAll,isMe,sel,pick:()=>setState({view:id}),style}`; `isAllV = view==='all'`, `isMeV = view==='me'`; `headStyle`/`onScroll` as §0.4.
Handlers: `pa_0` hero share → open; `pa_1` compact share → open; `pa_2` Nudge → toast "Go nudged Priya about her ₹10,800 share"; `pa_3` Messages, `pa_4` Gmail, `pa_5` Copy link, `pa_6` More → toast+close; `pa_7` backdrop; `pa_8` Copy → toast "Invite link copied". All numbers are hard-coded (no computed totals).

#### Navigation table
| Element | Target |
|---|---|
| Everyone / Just me toggle | local state (`view`) — no navigation |
| "Record" (settle row 1) | `P-Money-Record.dc.html` |
| "Nudge" (settle row 2) | toast only |
| "See all 7 transactions" | `P-Transactions.dc.html` |
| Back / tabs / Chat FAB / share | as §0.4 (Expenses tab → `P-Money-Everyone.dc.html`) |

#### Data shown (seed values)
- Total crew spend ₹64,920 = Stay ₹43,200 (66.5%) + Travel ₹21,720 (= 8,060 + 8,060 + 2,900 + 2,700).
- Settle up: You owe Rahul ₹5,800 · Priya owes Rahul ₹10,800 · Arjun settled.
- Transactions shown (5 of 7):
  | payer | verb → to | badge | method | note | amount | date |
  |---|---|---|---|---|---|---|
  | You | paid Rahul | Rahul photo | Cash | “part of villa, rest on Friday” | ₹5,000 | 16 Oct |
  | Arjun | paid Rahul | Rahul photo | UPI | “villa share 🏡” | ₹10,800 | 15 Oct |
  | Priya | booked with redBus | 🚌 | UPI | “Bus both ways” | ₹2,700 | 14 Oct |
  | Rahul | booked with IRCTC | 🚆 | UPI | “Train both ways” | ₹2,900 | 13 Oct |
  | Arjun | booked with IndiGo | ✈️ | Card | “Flights both ways” | ₹8,060 | 13 Oct |

#### Icons & images
- SVG: check (settled), chevron-right (see-all), shell icons; pencil only in M5 view.
- Emoji: 🏡 Stay, 🧳 Travel; badge emoji 🚌 🚆 ✈️; 🏡 in note.
- `/_blob/`: avatars 36px (settle), 40px + 20px (tx), 20/22px (toggle); hero; Go; share icon.

---

### P-Money-Me.dc.html — "Go — Expenses, just me"  (M5)
#### Purpose (1 line)
Same Expenses screen with the toggle on "Just me": personal spend vs budget, your share breakdown, and your transactions.

#### Layout top→bottom
Byte-identical to M4 except `<title>` and initial `view:'me'` (only `hint-placeholder-val` flags differ). Rendered differences:
- Toggle: "Just me" selected (`#000/#FFF`), "Everyone" inactive.
- **Summary (isMeV)** (flex column gap 10):
  - Total block (same layout as M4): "₹18,860" 44px/700; caption "₹2,940 left of your ₹21,800" 15px `#4A5878`. Right: **"Edit budget"** pill `<a>` `height:40px; padding:0 14px 0 12px; flex-shrink 0; radius 999; flex centre; gap 6; bg #FFF; standard shadow; #0B1B3F; 14px/600` with pencil SVG 15px (`M4 20h4L19 9l-4-4L4 16z`, stroke 2) → `P-Chat-BudgetSheet-Slider.dc.html`.
  - **Budget bar** [§7: `SplitBar` with track] `role=img aria-label="86% of your budget used"`: `margin:2px 0; height:12px; radius 999; bg #ECEFF3 (track); overflow hidden; display:flex; gap:3px` → Stay `width:49.5%; #3E73D6; radius 999` + Travel `width:37%; #E07A5F; radius 999`; remaining ~13.5% shows grey track.
  - Tiles: 🏡 ₹10,800 Stay · 🧳 ₹8,060 Travel (same tile styling).
  - Footnote `padding:0 4px; 13px #4A5878 0.002em lh1.35`: "Stay is your share of Villa Sol. Travel is your own flights, both ways. Your budget is only visible to you."
- Settle up section: identical to M4 (scope-independent).
- **Transactions (isMeV)**: same card/row anatomy, 3 rows, then button "See everyone’s transactions" (chevron) → `P-Transactions.dc.html`.

#### Sheets / overlays
Same as M4.

#### State & interactions
Initial `{ collapsed:false, view:'me' }`; toggling "Everyone" swaps both the summary and the transaction list in place (M4 content). Handlers identical to M4 (incl. Nudge toast).

#### Navigation table
As M4 plus "Edit budget" → `P-Chat-BudgetSheet-Slider.dc.html`; "See everyone’s transactions" → `P-Transactions.dc.html`.

#### Data shown (seed values)
- Your spend ₹18,860 = Stay ₹10,800 (your ¼ of ₹43,200) + Travel ₹8,060; budget ₹21,800; left ₹2,940; 86% used (bars 49.5% / 37%).
- Transactions (mine):
  | payer | verb → to | badge | method | note | amount | date |
  |---|---|---|---|---|---|---|
  | You | paid Rahul | Rahul photo | Cash | “part of villa, rest on Friday” | ₹5,000 | 16 Oct |
  | You | booked with IndiGo | ✈️ | UPI | “Flights both ways” | ₹8,060 | 12 Oct |
  | Rahul | booked with Villa Sol | villa photo `87722708…` 20px | Card | “Villa Sol, 3 nights · split 4 ways” | ₹43,200 | 12 Oct |

#### Icons & images
As M4 plus pencil SVG; villa photo used as a 20px payee badge.

---

### P-Transactions.dc.html — "Go — All transactions"  (M6)
#### Purpose (1 line)
Full-screen ledger of all 7 crew transactions grouped by date, with filter chips and a "Record a payment" CTA.

#### Layout top→bottom
No hero/tab shell, no Chat FAB, no share sheet/toast.
1. **Fixed header** (non-collapsing, in flow) `flex-shrink:0; padding:46px 12px 12px; bg #FFF; shadow 0 1px 0 rgba(11,27,63,0.05); flex column; gap 10px`:
   - Row (gap 6): back 44×44 circle (no bg), arrow-left 22px → `P-Money-Everyone.dc.html`; title column: "Transactions" `20px/700/-0.018em`; sub "Every booking and payback, visible to the crew" 13px secondary.
   - **Filter chips** [§7: `FilterChips`] `role=group aria-label="Filter"`: `display:flex; gap:6px; padding:0 4px; overflow-x:auto; scrollbar-width:none`. `sc-for filters` → `<button aria-pressed>`: `height:40px; padding:0 14px; radius 999; 14px/600; transition background-color 160ms, color 160ms; flex-shrink:0`; **active** `bg #000; color #FFF; border 0`; **inactive** `bg #FFF; color #0B1B3F; border 1px solid #DDE1E6`. Labels: "All 7", "Bookings", "Paybacks", "Mine".
2. **List scroller** `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; padding:12px 16px 120px; flex column; gap 8px`. `sc-for groups` → group [§7: `TransactionGroup`] `flex column gap 8`:
   - Date label `padding:6px 4px 0`, eyebrow style ("16 OCT").
   - Card `padding:2px 14px; radius 22; bg #FFF; standard shadow`; rows via `t.rowStyle` = (`border-top:1px solid #ECEFF3;` if not first in group) + `padding:12px 0; display:flex; align-items:flex-start; gap:12px`.
   - Row anatomy identical to M4 rows (40px payer photo + 20px badge photo/emoji, title "{who} {verb} {to}", method pill + “note”), **but right column shows amount only (no date)** — date moved to group header.
   - Empty state (`sc-if none`): "Nothing here yet." `padding:30px 16px; centred; 13px #4A5878`.
3. **Bottom CTA bar** [§7: `FadeDock`] `position:absolute; left:0; right:0; bottom:0; padding:30px 16px 24px; background:linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 40%)` → black pill `<a>` `height:56px; padding:0 18px; flex centre; gap 8; radius 999; bg #000; #FFF; 18px/500; -0.014em; lh1.3` with plus SVG 18px: "Record a payment" → `P-Money-Record.dc.html`.

#### Sheets / overlays
None.

#### State & interactions
`class Component extends DCLogic` (no PBase), state `{ f:'all' }`.
- `ok(t)`: `f==='all'` || (`f==='booking'` && kind booking) || (`f==='payback'` && kind payback) || (`f==='mine'` && t.mine).
- `groups`: filtered TX grouped by `date` in source order; each row gets `hasImg=!!toimg`, `hasEmo=!!toemo`, `rowStyle`.
- `none = !shown.length` (never true with seed data).
- `filters` = [['all','All '+TX.length], ['booking','Bookings'], ['payback','Paybacks'], ['mine','Mine']] → `pick:()=>setState({f:id})`.
Results: All → 7 rows / 5 groups; Bookings → 5 (14,13,13,12,12 Oct); Paybacks → 2 (16, 15 Oct); Mine → 3 (You paid Rahul; You booked IndiGo; Rahul booked Villa Sol [mine:true because you're in the split]).

#### Navigation table
| Element | Target |
|---|---|
| Back | `P-Money-Everyone.dc.html` |
| Filter chips | local state |
| "Record a payment" | `P-Money-Record.dc.html` |

#### Data shown (seed values) — TX (exhaustive)
| date | who (pimg) | verb | to | badge | amt | meth | note | kind | mine |
|---|---|---|---|---|---|---|---|---|---|
| 16 OCT | You (c58d) | paid | Rahul | Rahul photo (cb0a) | ₹5,000 | Cash | part of villa, rest on Friday | payback | true |
| 15 OCT | Arjun (8c7b) | paid | Rahul | Rahul photo | ₹10,800 | UPI | villa share 🏡 | payback | false |
| 14 OCT | Priya (234f) | booked with | redBus | 🚌 | ₹2,700 | UPI | Bus both ways | booking | false |
| 13 OCT | Rahul (cb0a) | booked with | IRCTC | 🚆 | ₹2,900 | UPI | Train both ways | booking | false |
| 13 OCT | Arjun | booked with | IndiGo | ✈️ | ₹8,060 | Card | Flights both ways | booking | false |
| 12 OCT | You | booked with | IndiGo | ✈️ | ₹8,060 | UPI | Flights both ways | booking | true |
| 12 OCT | Rahul | booked with | Villa Sol | villa photo (8772) | ₹43,200 | Card | Villa Sol, 3 nights · split 4 ways | booking | true |
No categories beyond kind; no split field other than note text.

#### Icons & images
SVG arrow-left 22px, plus 18px. Emoji badges 🚌🚆✈️, 🏡 in note. Blobs: 4 avatars, villa photo.

---

### P-Money-Record.dc.html — "Go — Record a payment"  (M7)
#### Purpose (1 line)
Bottom sheet over the Expenses (just-me) page to log an off-app payment You → Rahul (default ₹5,800, UPI), notifying Rahul to confirm.

#### Layout top→bottom
**Underlay page** (static, simplified Expenses page):
- Hero **250px** (not 236), same image; overlay first stop `rgba(11,27,63,0.22)` (not .25); back arrow 22px and share 20px glass buttons; title "📍Goa" **44px**/700; date/countdown lines 15px/500 with `letter-spacing:-0.008em`; title block `bottom:44px`.
- Tab bar (not inside a scroller; tabs with `letter-spacing:-0.008em`); Expenses tab active and points to **`P-Money-Me.dc.html`**.
- Scroller with a single placeholder block `height:120px; radius 22; bg #FFF` inside `padding:16px 16px 120px`.
**Backdrop**: `<a href="P-Money-Me.dc.html" aria-label="Close sheet">` `position:absolute; inset:0; z-index:5; bg rgba(11,27,63,0.38)` (covers hero buttons too, so hero share/back are unreachable).
**Sheet** [§7: `RecordPaymentSheet` in `BottomSheet`] `role=dialog aria-label="Record a payment"`: `position:absolute; left:0; right:0; bottom:0; top:120px; z-index:6; flex column; radius 28px 28px 0 0; bg #F6F7F9; shadow 0 -8px 30px rgba(11,27,63,0.18)`.
- Grabber `align-self:center; margin-top:8px; 40×5; radius 999; #DDE1E6`.
- Body scroller `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; padding:8px 16px 150px; flex column; gap 12px`:
  1. Title block `padding:0 4px; gap 2`: row (space-between, gap 12) "Record a payment" `22px/600/-0.02em/lh1.3` + close `<a>` 40×40 circle `bg #FFF; margin-right:-6px; shadow 0 1px 3px rgba(0,0,0,0.08)`, X 18px stroke 2 → `P-Money-Me.dc.html`. Sub "For money you sent outside Go, like UPI or cash. Nothing is charged here." `14px #4A5878 -0.004em lh1.4 text-wrap:pretty`.
  2. **Amount card** `padding:18px 16px; radius 22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.06); flex column; align-items:center; gap 14`:
     - Payer→payee row (`align-self:stretch; flex; center; gap 10`): You (avatar 48px + "You" 13px/600, column gap 4) · connector `flex:1; height:2px; margin-bottom:20px; bg #DDE1E6` (no arrowhead) · Rahul (48px + "Rahul"). Static — no payer/payee selector.
     - Amount `<label for="ramt">` `flex; align-items:baseline; gap 4`: "₹" `30px/700 #4A5878`; visually-hidden "Amount"; `<input id="ramt" type="text" inputmode="numeric" placeholder="{{amount}}">` `width:170px; border 0; outline none; transparent; 44px/700; -0.03em; #0B1B3F; tabular-nums` — value is only the **placeholder** "5,800" (renders in placeholder colour `#4A5878`).
     - Status line `13px #4A5878` (`{{left}}`): "Settles you up with Rahul".
  3. **PAID VIA** [§7: `PaidViaChips`] (eyebrow, `padding:0 4px`) + `role=radiogroup` `flex; flex-wrap; gap 8` of chips (`sc-for vias`, `button role=radio`): `height:40px; padding:0 14px; border 0; radius 999; 14px/600`; selected `bg #000; #FFF`; unselected `bg #FFF; #0B1B3F; box-shadow: inset 0 0 0 1px #DDE1E6`. Options: UPI (default), Cash, Bank transfer, Other.
  4. **NOTE (OPTIONAL)** `<label for="rnote">` column gap 6: eyebrow + field shell `height:52px; padding:0 16px; flex centre; gap 10; radius 16; bg #FFF; border 1px solid #DDE1E6` containing `<input id="rnote" placeholder="e.g. villa + groceries">` `flex 1; 16px; #0B1B3F; -0.011em`.
  - No date field, no split options, no category in this form.
- **Footer** `position:absolute; left:0; right:0; bottom:0; padding:40px 16px 24px; flex column; align-items:stretch; gap 10; background:linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`:
  - CTA `<a>` → `P-Money-Me.dc.html`: `height:56px; flex centre; radius 999; bg #000; #FFF; 18px/500; -0.014em` text `{{cta}}` = "Record ₹5,800".
  - Helper `align-self:center; flex; gap 6; 13px #4A5878`: Rahul avatar 18px + "Rahul gets a ping to confirm he got it".
Share sheet (z 40) + toast (z 60) present (§0.4).

#### Sheets / overlays
The page *is* a sheet: top 120px, radius 28 top, grabber, dim backdrop `rgba(11,27,63,0.38)` that navigates to `P-Money-Me.dc.html`; close X also → `P-Money-Me`; CTA also → `P-Money-Me` (no toast/confirmation). Share sheet as §0.4 (reachable only in theory — its trigger is under the backdrop).

#### State & interactions
`PBase` state `{ via:'upi', full:true }`:
- `vias` = [['upi','UPI'],['cash','Cash'],['bank','Bank transfer'],['other','Other']] → `pick: setState({via:id})`.
- `full` ('true'/'false' string) + `toggle: setState({full:!full})` — **no element binds them** (orphan "pay full amount" toggle; CSS `.knob` rules exist without markup).
- `amount = full ? '5,800' : '2,900'`; `cta = 'Record ₹' + amount`; `left = full ? 'Settles you up with Rahul' : '₹6,900 still left to settle'`.
- Inputs are uncontrolled (typing doesn't update CTA).
Component handlers: `pa_0` hero share → open; `pa_1` Messages, `pa_2` Gmail, `pa_3` Copy link, `pa_4` More → toast+close; `pa_5` backdrop; `pa_6` Copy → toast.

#### Navigation table
| Element | Target |
|---|---|
| Backdrop, close X, "Record ₹5,800" CTA | `P-Money-Me.dc.html` |
| Underlay tabs | Home `P-Home`, Itinerary `P-Plan-Everyone`, Bookings `P-Bookings`, Expenses `P-Money-Me` |
| Underlay back | `P-App-Home.dc.html` (covered by backdrop) |

#### Data shown (seed values)
Payer You, payee Rahul; amount ₹5,800 (half-mode ₹2,900); method default UPI; note placeholder "e.g. villa + groceries"; helper "Rahul gets a ping to confirm he got it".

#### Icons & images
SVG close X 18px (stroke 2), hero arrow 22px, share 20px. Blobs: hero; You + Rahul avatars 48px; Rahul 18px; 4-avatar hero stack 28px; share icon.

---

### Group notes (bookings/money parts)
- **Shared element names (suggested components)**: `TripHero` [§7: `TripHero`], `TripTabBar` (big 42px / compact 36px variants) [§7: `TripTabs`], `CollapsingTripHeader` (opacity/translate from scrollTop 110→200, 0.05 steps) [§7: `CollapsingTripHeader` + `useCollapsingHeader`], `ChatFab` [§7: `ChatFab`], `ShareTripSheet` [§7: `ShareInviteSheet`], `Toast` (2200ms) [§7: Sonner `Toaster` + `toastGo`], `ScopeToggle` ("Everyone" 3-stack / "Just me" own avatar; links on Itinerary, local state on Expenses) [§7: `ScopeToggle`], […], `AvatarStack` (sizes 20/22/28/36, overlap -7/-8/-12, border 2px white or black) [§7: `AvatarStack`], […], `BookingTicketCard` (media | body w/ accent stripe | dashed stub with punch notches; stub = count+TICKETS or ✓BOOKED) [§7: `BookingTicketCard`], `SectionHeader` (20px title + 13px right meta) [§7: `SectionHeader`], `SpendSummary` (big number, split bar, CategoryTile×2) [§7: `SpendSummary` + `SplitBar` + `CategoryTile`], `SettleRow` (avatar → amount-arrow → avatar + Record/Nudge/settled) [§7: `SettleRow`], `TransactionRow` (payer + badge composite, method pill, quoted note, amount ± date) [§7: `TransactionRow` + `TransactionGroup`], `FilterChips` [§7: `FilterChips`], `RecordPaymentSheet` [§7: `RecordPaymentSheet` in `BottomSheet`], `PaidViaChips` [§7: `PaidViaChips`], `EyebrowLabel` [§7: `Eyebrow`].
- **Sibling collapses**:
  - Bookings M1/M2 = one route + scroll state; M2 is a static frozen rendering of the compact header (148px) with the hero removed — the live behaviour is M1's scroll-driven fade.
  - Expenses M4/M5 = one route with local `view: all|me` (initial value is the only diff). Scope swaps summary block and transaction list; "Settle up" section + "Transactions/Visible to everyone" header are shared.
  - M6/M7 are separate routes (M7 = sheet over an Expenses(me) underlay; should be a modal/sheet route over M5).
- **Surprises / ambiguities**:
  4. The Plan "Everyone/Just me" control is navigation (two files) while Expenses' identical-looking control is local state — unify in the port.
  5. Bookings has no price, PNR, status pill, chevron or filter UI; "booked only" just means only the "Booked" section exists. "Everyone home" says "1 flight" with 3 avatars (You, Rahul, Priya) though the itinerary has You + Arjun flying home together — data inconsistency.
  6. Record sheet: `full`/`toggle` + `.knob` CSS are orphaned (no pay-full/partial switch rendered); half-mode copy "₹6,900 still left to settle" doesn't match ₹5,800 − ₹2,900 = ₹2,900. Amount is shown only as an input placeholder (grey `#4A5878`). No payer/payee picker, split options or date. CTA navigates without a success toast.
  7. Record underlay uses a 250px hero / 44px title / extra letter-spacing (differs from 236px / 40px elsewhere) and its Expenses tab links to `P-Money-Me`.
  8. Transactions back goes to `P-Money-Everyone` even when entered from Money-Me; Money-Me rows show dates on the right, Transactions rows don't.
  9. Settle-up arrow is CSS (2px line + border-triangle); "Record" row amount is terracotta (#A44F3A) to mark the user's own debt.
  10. Share targets `P-WA-Compose.dc.html` and `P-WA-Pick.dc.html` don't exist in the prototype folder; `P-Bookings-Scrolled` exposes an unbound `onScroll` (collapsed > 190).
  11. Money values are all hard-coded strings; consistent arithmetic: 64,920 = 43,200 + 21,720; 18,860 = 10,800 + 8,060; 21,800 − 18,860 = 2,940; 18,860/21,800 = 86%.

### Appendix A — Template bindings per file (for the React port)
| File | `sc-if` flags | `sc-for` lists (item fields) | other `{{…}}` |
|---|---|---|---|
| Bookings | `pShare`, `pToast` | — | `onScroll`, `headStyle`, `pa_0…pa_7`, `pToastText` |
| Bookings-Scrolled | `pShare`, `pToast` | — | `pa_0…pa_6`, `pToastText` (no `headStyle`, no bound `onScroll`) |
| Money-Everyone / Money-Me | `v.isAll`, `v.isMe`, `isAllV`, `isMeV`, `pShare`, `pToast` | `views` (label, sel, pick, style, isAll, isMe) | `onScroll`, `headStyle`, `pa_0…pa_8`, `pToastText` |
| Transactions | `t.hasImg`, `t.hasEmo`, `none` | `filters` (label, sel, pick, style) · `groups` (date, rows[]) · `g.rows` (pimg, toimg, toemo, who, verb, to, meth, note, amt, rowStyle) | — |
| Money-Record | `pShare`, `pToast` | `vias` (label, sel, pick, style) | `amount` (input placeholder), `left`, `cta`, `pa_0…pa_6`, `pToastText`; unused: `full`, `toggle` |

### Appendix C — Copy deck (all user-visible strings unique to these screens)
- Bookings: "Booked", "3 bookings", "FRI 6 · GETTING THERE", "Everyone to Goa", "2 flights · 1 train · 1 bus", "TICKETS", "FRI 6 → MON 9", "Villa Sol", "Anjuna · 3 nights · late check-in", "BOOKED", "MON 9 · GETTING BACK", "Everyone home", "1 flight · 1 train · 1 bus".
- Expenses: "spent by the crew", "Stay", "Travel", "Edit budget", "₹2,940 left of your ₹21,800", budget footnote (see M5), "Settle up", "Everyone pays Rahul back", "Record", "Nudge", "Arjun is settled up", "Transactions", "Visible to everyone", "See all 7 transactions", "See everyone’s transactions", toast "Go nudged Priya about her ₹10,800 share", aria "Stay ₹43,200, travel ₹21,720", "86% of your budget used".
- Transactions: "Transactions", "Every booking and payback, visible to the crew", "All 7", "Bookings", "Paybacks", "Mine", "Nothing here yet.", "Record a payment"; title pattern "{who} {paid|booked with} {to}".
- Record: "Record a payment", "For money you sent outside Go, like UPI or cash. Nothing is charged here.", "You", "Rahul", "₹", "Amount" (sr-only), "Settles you up with Rahul" / "₹6,900 still left to settle", "PAID VIA", "UPI", "Cash", "Bank transfer", "Other", "NOTE (OPTIONAL)", "e.g. villa + groceries", "Record ₹5,800" / "Record ₹2,900", "Rahul gets a ping to confirm he got it", "Close sheet" (aria).
