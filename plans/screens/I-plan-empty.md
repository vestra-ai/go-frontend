# I · Trip plan shell + empty states (I1–I5)

Sources: `design/prototype/P-TripHome-Zero.dc.html`, `P-Itin-Zero.dc.html`, `P-Bookings-Zero.dc.html`, `P-Budget-Zero.dc.html`, `P-Budget-Zero-Me.dc.html` (canvas section "9 · Trip plan · nothing decided yet"). The populated image-hero values in §1.2 come from the trip-home inventory (`J-triphome-calls.md`). Tokens and classes follow PLAN §3; atoms follow §7.1.

## 1. Spec (normative)

### 1.1 Artboards → route + state

| Artboard | Canvas title | Route | State | Preset id |
|---|---|---|---|---|
| I1 | I1 · Home, empty | `/trips/[tripId]` | trip `college` (always) or `goa` before stage `plan` → `selectTripHomeMode(tripId) === 'zero'`; Home tab | `I1` → `/trips/goa`, goa chat at `kickoff`, `quickStart: 'pending'` (members Aarav + Rahul) |
| I2 | I2 · Itinerary, empty | `/trips/[tripId]/itinerary` | same; Itinerary tab; `?scope`/`?view`/`?area`/`?sel` ignored in zero | `I2` → `/trips/goa/itinerary` (same store patch as I1) |
| I3 | I3 · Bookings, empty | `/trips/[tripId]/bookings` | same; Bookings tab | `I3` → `/trips/goa/bookings` |
| I4 | I4 · Expenses, empty · everyone | `/trips/[tripId]/expenses?scope=everyone` (default when absent) | same; Expenses tab; scope `everyone` | `I4` → `/trips/goa/expenses?scope=everyone` |
| I5 | I5 · Expenses, empty · just me | `/trips/[tripId]/expenses?scope=me` | same; scope `me` | `I5` → `/trips/goa/expenses?scope=me` |

Presets use `goa` at `kickoff` because the design's share sheet ("Join Goa crew on Go", "Goa crew 🌴"), "2 joined" and chat preview match that state. `college` renders the same blocks with its own name and invite strings.

### 1.2 Trip plan shell (contract for P2-6)

Files: `src/components/trip/{TripShell,TripHero,TripTabs,CollapsingTripHeader,ChatFab}.tsx` and `src/components/trip/useCollapsingHeader.ts`. Dependencies: `GlassIconButton`, `ShareInviteSheet` (P2-3); `Avatar`, `AvatarStack`, `Badge` (P1-2); `Button` (P1-1); `Screen` (P0-1); `FadeDock` (P1-5); SegmentedControl list classes (P1-4); icons `ArrowLeft` and `Share`.

```ts
export type TripTab = 'home' | 'itinerary' | 'bookings' | 'expenses';
export type TripHeroMedia = { kind: 'image'; src: string; alt: string } | { kind: 'gradient' };
export interface TripMetaLine { emoji: string; text: string }  // PLAN "meta: string[] with emoji", split so the emoji gets its 18px slot
export interface ChatPreview { avatars: Array<'go' | User>; text: string; unread: number }

export interface TripShellProps {
  trip: Trip;                    // tab hrefs + ShareInviteSheet strings
  active: TripTab;
  hero: TripHeroMedia;           // zero: { kind: 'gradient' }
  title: string;                 // zero: "New trip" (also the collapsed-header title)
  titleEmoji?: string;           // populated: "📍" (J); zero: omitted
  meta: TripMetaLine[];          // zero: [{ emoji: '📍', text: 'Where? Not decided yet' }, { emoji: '👥', text: '2 joined' }]
  collapsedSub: string;          // zero: "Where? Not decided yet"; populated: "Fri 6 – Mon 9 Nov" (J)
  members: User[];               // hero AvatarStack
  chatPreview: ChatPreview;
  onShare?: () => void;          // default: open the built-in ShareInviteSheet
  shareOpen?: boolean;           // optional control, so trip home can honour ?sheet=share
  onShareOpenChange?: (open: boolean) => void;
  children: React.ReactNode;     // content column
}
```

Structure (`"use client"`):

```
<Screen scroll="none">                          relative flex h-full flex-col bg-canvas
  <div onScroll={onScroll} className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none">
    <TripHero … />
    <TripTabs variant="hero" className="relative z-[2] mx-4 -mt-[26px]" … />
    <div className="flex flex-col gap-2.5 px-4 pt-4 pb-[120px]">{children}</div>
  </div>
  <CollapsingTripHeader hp={hp} … />            absolute, z-[4]
  <FadeDock variant="fade" />                    decorative only
  <ChatFab … />
  <ShareInviteSheet trip={trip} open={…} onOpenChange={…} />
</Screen>
```

**TripHero.** `relative h-[236px] shrink-0 overflow-hidden bg-sunset`. `overflow-hidden` is an addition: ring 1 overhangs the right edge by 60px and would otherwise let the scroller pan sideways.
- `gradient` (zero): overlay `absolute inset-0 bg-[linear-gradient(160deg,var(--color-cover-1)_0%,var(--color-cover-2)_45%,var(--color-cover-3)_100%)]`, plus two `aria-hidden` rings:
  - `absolute -right-[60px] top-[30px] size-60 rounded-full border-[1.5px] border-dashed border-white/45`
  - `absolute right-2.5 top-[100px] size-[100px] rounded-full border-[1.5px] border-dashed border-white/35`
- `image` (populated, J): `<img src alt className="absolute inset-0 size-full object-cover">` plus a scrim span `absolute inset-0 bg-[linear-gradient(180deg,rgb(11_27_63/0.25)_0%,rgb(11_27_63/0)_26%,rgb(11_27_63/0.08)_42%,rgb(11_27_63/0.4)_62%,rgb(11_27_63/0.72)_100%)]`. No rings. Design alt: "Palm silhouette against a Goa sunset over the sea".
- Back: `GlassIconButton` (= `Button variant="glass" size="icon-sm"`: 40px, `bg-ink/35 backdrop-blur-[12px] text-white`) rendered as `<Link href="/home" aria-label="Back">` with `ArrowLeft className="size-5"`. Position `absolute left-3.5 top-[max(46px,env(safe-area-inset-top))]`.
- Share: same button as `<button aria-label="Share trip">` with `Share className="size-[18px]"`, at `absolute right-3.5 top-[max(46px,env(safe-area-inset-top))]`. Calls `onShare`.
- Title block: `absolute inset-x-5 bottom-[42px] flex items-end justify-between gap-3 text-white`.
  - Left column `flex min-w-0 flex-col gap-0.5`. Title row `flex items-center gap-1 text-40 font-bold tracking-display` (`text-40` bakes in line-height 1). The optional `titleEmoji` sits in a `w-[30px] text-[30px]` `aria-hidden` slot. Zero shows "New trip" with no emoji.
  - Meta `mt-1 flex flex-col gap-0.5`. Each line is `flex gap-1.5 text-15 font-medium leading-[1.35] whitespace-nowrap`, with the emoji in an `inline-block w-[18px] text-15` `aria-hidden` slot. The 6px gap comes from J; the I inventory gives only the slot.
  - Right `pb-0.5`: `AvatarStack size={28} overlap={-8} ring="white"` (wrapper `pl-2`).

**TripTabs.** Props `{ tripId: TripId; active: TripTab; variant: 'hero' | 'compact'; className?: string }`. Renders `role="tablist" aria-label="Trip sections"` with four text-only `<Link role="tab" aria-selected aria-current={isActive ? 'page' : undefined}>` items:

| Tab | Href |
|---|---|
| Home | `/trips/[id]` |
| Itinerary | `/trips/[id]/itinerary` |
| Bookings | `/trips/[id]/bookings` |
| Expenses | `/trips/[id]/expenses` (no `scope`, so it resets to Everyone, as designed) |

- `hero`: list `flex gap-0.5 rounded-full bg-white p-[5px] shadow-tabs` (52px total). Item `flex h-[42px] flex-1 items-center justify-center rounded-full text-15 font-semibold`.
- `compact`: list `flex gap-0.5 rounded-full bg-surface-2 p-1`. Item `h-9 text-14 font-semibold` (otherwise as hero).
- Active `bg-black text-white`; inactive `bg-transparent text-muted`. Press `active:scale-[0.97]`.

**CollapsingTripHeader.** Props `{ hp: number; tripId: TripId; active: TripTab; title: string; sub: string; onShare: () => void }`.
- Root: `absolute inset-x-0 top-0 z-[4] flex flex-col gap-2 bg-white px-3 pb-2.5 pt-[max(46px,env(safe-area-inset-top))] shadow-header-2 transition-[opacity,transform] duration-[140ms] ease-out will-change-[opacity,transform]`.
- Dynamic style: `style={{ opacity: hp, transform: \`translateY(${(1 - hp) * -14}px)\` }}`. Use `pointer-events-auto` when `hp > 0.6`, else `pointer-events-none`, and set `inert={hp <= 0.6}` (an a11y addition; see §1.6).
- Row 1 `flex items-center gap-1.5`:
  - Back: `<Link href="/home" aria-label="Back">` as `Button variant="ghost" size="icon-sm"`, `text-ink`, `ArrowLeft size-5`.
  - Title column `min-w-0 flex-1`: title `truncate text-17 font-bold tracking-h4 leading-[1.2]`; sub `truncate text-13 text-muted tracking-caption leading-[1.35]`.
  - Share: `<button aria-label="Share trip">` as ghost `icon-sm` with `Share size-[18px]`.
- Row 2: `TripTabs variant="compact"`.

**useCollapsingHeader.**

```ts
export const collapseProgress = (scrollTop: number) =>
  Math.round(Math.min(Math.max((scrollTop - 110) / 90, 0), 1) * 20) / 20;
export function useCollapsingHeader(): { hp: number; onScroll: React.UIEventHandler<HTMLElement> }
```

`onScroll` sets state only when the stepped value changes. The header starts fading in at 110px and is fully in at 200px, in 0.05 steps. The design's unused `collapsed` flag is dropped.

**FadeDock `variant="fade"`.** `aria-hidden pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-[linear-gradient(180deg,rgb(246_247_249/0)_0%,var(--color-canvas)_70%)]`. No children.

**ChatFab.** Props `{ tripId: TripId; avatars: Array<'go' | User>; preview: string; unread: number }`.
- `Button variant="primary" asChild` wrapping `<Link href="/trips/[id]/chat">`, with classes `absolute left-1/2 bottom-[max(28px,env(safe-area-inset-bottom))] -translate-x-1/2 h-[58px] gap-2.5 pl-2 pr-3 shadow-fab`. The atom supplies `rounded-full`, `bg-black`, `text-white` and the white press wash.
- Avatars: `AvatarStack size={36} overlap={-12} ring="black"` (wrapper `pl-3`), Go first (`kind="go"`, `bg-info-soft`).
- Text column: "Chat" in `text-15 font-semibold tracking-sub leading-[1.25]`; preview in `text-12 text-white/70 tracking-[0.01em] leading-[1.3] whitespace-nowrap`.
- Unread: `Badge variant="terracotta"` with `min-w-6 h-6 px-[7px] text-13 font-bold tabular-nums`. Omit it when `unread === 0`. No Badge size matches (§1.6 #12).

**ShareInviteSheet** (P2-3, rendered by TripShell). Props `trip`, `open`, `onOpenChange`. Strings come from `trip`:
- link card: `Join ${trip.name} on Go` and `trip.inviteUrl`;
- recent-group row: `trip.whatsappGroup` and "WhatsApp group · recent".

Behaviour:
- Copy: toast "Invite link copied"; the sheet stays open.
- Messages, Gmail, Copy link, More: act, then close.
- WhatsApp tile and recent row: `share.inviteViaWhatsApp(trip)`.
- Dialog `aria-label="Share trip invite"`.

Toasts use the global Sonner toaster (PLAN §4), 2200ms.

### 1.3 Zero-state blocks

P3-16 owns `src/components/trip/empty/{TripHomeZero,ItineraryZero,BookingsZero,ExpensesZero}.tsx`. Each renders the children of TripShell's content column (`gap-2.5`). Copy comes from `planZero` in `src/data/seed/copy.ts` (§1.4). Hrefs are built from `tripId` per §1.5.

P2-4 component contracts (plus `SectionHeader`, `ListCard`, `ListRow`, `SegmentedProgress`, `EmojiTile`, `Eyebrow` from Phase 1):

| Component | Props | Classes / metrics |
|---|---|---|
| `GoStatusCard` | `title`, `sub`, `progress?: { filled: number; total: number; label: string }`, `cta?: { label: string; href: string }` | **Card:** `Card variant="shadow" radius="2xl"` + `flex flex-col gap-3 p-4`.<br>**Row** `flex items-center gap-2.5`: `Avatar size={36} kind="go"`, then text `flex flex-col gap-px` with title `text-16 font-semibold tracking-body leading-[1.3]` and sub `text-13 text-muted tracking-caption`.<br>**Progress** `flex flex-col gap-1.5`: `SegmentedProgress segments={total} filled={filled} size="status"` (`h-1.5 flex-1 gap-1`, empty `bg-line`, `role="img" aria-label={label}`), then caption `text-13 text-muted` showing `label`.<br>**CTA:** `Button variant="primary" size="lg" asChild className="w-full px-[18px]"` wrapping a `<Link>`; no avatar. |
| `SectionHeader` (P1-5) | `title`, `meta?`, `className?` | `flex items-baseline justify-between px-1`. Title `text-20 font-semibold tracking-h3`; meta `text-13 font-semibold text-muted`. Callers add `mt-2` (Home) or `mt-2.5` (Expenses). |
| `NextUpRow` | `emoji`, `title`, `sub`, `action: { label: string; href: string }` | **Container:** `ListCard padding="rows"` (shadow card, radius 22, `px-3.5`).<br>**Row:** a `<div>`, `flex items-center gap-3 py-3`, with `border-t border-line` from the second row on.<br>**Leading:** `EmojiTile size={40} shape="circle" tint="surface-2"`, 19px glyph.<br>**Text** `min-w-0 flex-1`: title `text-16 font-semibold tracking-body leading-[1.3]`; sub `text-13 text-muted tracking-caption`.<br>**Trailing** (the only link): `Button variant="tint" size="xs" asChild className="px-3.5 tracking-sm"` (h-8, 13/600). |
| `EmptyHeroCard` | `emoji`, `title`, `body`, `primary: { label: string; href: string; goAvatar?: boolean }`, `secondary?: { label: string; href: string }` | **Card:** `Card variant="shadow" radius="4xl"` + `flex flex-col items-center gap-3 px-5 pt-[26px] pb-5 text-center`.<br>**Tile:** `EmojiTile size={64} shape="circle" tint="go-soft"`, 30px glyph.<br>**Text** `flex flex-col gap-1`: title `text-20 font-semibold tracking-h3 leading-[1.3]`; body `max-w-[300px] text-15 text-muted leading-[1.4] text-pretty`.<br>**Primary** (`mt-1 self-stretch`): `Button variant="primary" size="lg" className="w-full gap-2 px-[18px]"`, with `Avatar size={26} kind="go"` when `goAvatar`.<br>**Secondary** (`self-stretch`): `Button variant="tint" size="base" className="h-12 w-full px-3.5 tracking-sm"` (15/600). |
| `TicketStubPlaceholder` | `emoji`, `eyebrow`, `title`, `action: { label: string; href: string }` | **Container:** `relative flex h-[88px] items-stretch rounded-5xl border-[1.5px] border-dashed border-line-2 bg-white`.<br>**Stub:** `grid w-[84px] shrink-0 place-items-center rounded-l-5xl bg-canvas text-[28px]`, `aria-hidden`.<br>**Middle** `flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3.5 py-3`: `Eyebrow tone="muted"` (11/700, `tracking-eyebrow`, `leading-[1.35]`); title `text-18 font-semibold tracking-h4 leading-[1.25]`.<br>**Action** `grid w-24 shrink-0 place-items-center border-l-[1.5px] border-dashed border-line-2`: `Button variant="tint" size="xs" asChild className="px-3.5 tracking-sm"`.<br>No notches. |
| `DashedNoteRow` | `emoji`, `title`, `sub` | `Card variant="dashed" radius="2xl"` + `flex items-center gap-3 p-4`. Leading `EmojiTile size={40} shape="circle" tint="white"`, 18px glyph. Title `text-15 font-semibold`; sub `text-13 text-muted`. |
| `ZeroAmount` | `amount` ("₹0"), `caption` | Outer `flex items-start justify-between gap-3 pl-1 pt-1`; inner `flex flex-col gap-0.5`. Amount `text-44 font-bold tracking-display leading-[1.05] text-faint tabular-nums`; caption `text-15 text-muted tabular-nums`. |
| `CategoryTile` | `tone: 'stay' \| 'travel'`, `emoji`, `label`, `amount` | **Card:** `Card variant="shadow" radius="lg"` + `flex items-center gap-2.5 p-3`.<br>**Tile:** `EmojiTile size={48} shape="rounded-xl"`, 22px glyph. Tint: stay `bg-[#E3EEFB]`, travel `bg-peach-tint-2`.<br>**Text** `flex flex-col gap-px`: amount `text-18 font-semibold text-faint tabular-nums`; legend `flex items-center gap-1.5 text-13 text-muted` with a `size-2 rounded-full` dot (stay `bg-info`, travel `bg-[#E07A5F]`; token gaps, §1.6 #11). |
| `ScopeToggle` (common) | `value: 'everyone' \| 'me'`, `onValueChange`, `others: User[]`, `me: User`, `ariaLabel = "Whose view"` | **Track** (SegmentedControl `contained`): `flex gap-1 rounded-full border border-line bg-white p-1` (50px total).<br>**Items:** `flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-15 font-semibold`; on `bg-black text-white`, off `text-muted`.<br>**Everyone art:** `AvatarStack size={20} overlap={-7} ring="white"` (`pl-[7px]`) of `others`.<br>**Just me art:** `Avatar size={22}` (no ring) of `me`.<br>**ARIA** as designed: `role="tablist"` with `<button role="tab" aria-selected>`. |

**TripHomeZero** `{ tripId: TripId; onInvite?: () => void }`
1. `GoStatusCard`: title "Nothing’s decided yet", sub "Go fills this page as your crew chats", progress `{ filled: 0, total: 5, label: "0 of 5 decided" }`.
2. `SectionHeader className="mt-2"`: "Next up", meta "5 open" (= `nextUp.length` open).
3. `ListCard padding="rows"` with five `NextUpRow`s:

   | Emoji | Title | Sub | Action |
   |---|---|---|---|
   | 📍 | Pick a place | Go suggests places from everyone’s answers | Ask Go |
   | 📅 | Pick dates | Go finds a weekend that fits everyone | Ask Go |
   | 🏡 | Find a stay | Unlocks once place and dates are set | Ask Go |
   | 💰 | Set your budget | Private to you · Go plans within it | Set |
   | 🧳 | Sort your travel | Each person picks their own route | Book |

4. Invite card: `ListCard padding="rows"` holding one `ListRow` (`href` for goa, `onClick={onInvite}` for college).
   - Card metrics `py-3 px-3.5 gap-3` (= design 12/14).
   - Leading `EmojiTile size={40} shape="circle" tint="go-soft"` holding `Link className="size-5 text-ink"` (the generated icon).
   - Title "Invite more people" (16/600); sub "Share the trip link in your group chat" (13 muted).
   - Trailing `ChevronRight className="size-4 text-faint" strokeWidth={2.4}`.

**ItineraryZero** `{ tripId: TripId }` renders one `EmptyHeroCard`:
- emoji "🗓️", title "No plan yet";
- body "Once place and dates are set, Go drafts each day from what your crew says in chat.";
- primary "Ask Go to draft a plan" (`goAvatar`) → chat;
- secondary "Pick dates first" → chat dates.

**BookingsZero** `{ tripId: TripId }`
1. Intro `flex flex-col gap-0.5 px-1 pt-1 pb-0.5`:
   - "No bookings yet": `text-20 font-semibold tracking-h3`.
   - "Everything Go or your crew books lands here, tickets included.": `text-14 text-muted tracking-caption leading-[1.35]`. The design declares 13 then 14, so 14 wins.
2. Three `TicketStubPlaceholder`s:
   - 🛫 "FLIGHT · TRAIN · BUS" / "Getting there" / Book
   - 🛬 "RETURN TICKET" / "Getting back home" / Book
   - 🏡 "STAY" / "Where you’ll sleep" / Ask Go

**ExpensesZero** `{ tripId: TripId; scope: 'everyone' | 'me'; onScopeChange: (s: 'everyone' | 'me') => void; me: User; others: User[] }`
1. `ScopeToggle`.
2. Scope block (`flex flex-col gap-2.5`); the swap is instant, with no enter animation.
   - **everyone:**
     - `ZeroAmount` "₹0" / "spent by the crew so far";
     - `grid grid-cols-2 gap-2.5` with `CategoryTile` stay 🏡 "Stay" "₹0" and travel 🧳 "Travel" "₹0";
     - footnote "Travel covers flights, trains and buses." in `px-1 text-13 text-muted`.
   - **me:**
     - `ZeroAmount` "₹0" / "your spend so far";
     - the same grid, with no footnote;
     - `GoStatusCard`: title "Set your budget", sub "Only you see it. Go plans your tickets and stay within it.", cta "Set my budget" → budget sheet.
3. Shared by both views:
   - `SectionHeader className="mt-2.5"` "Settle up", then `DashedNoteRow` 🤝 "All square" / "Shared bills get split here as they come in".
   - `SectionHeader className="mt-2.5"` "Transactions", then `DashedNoteRow` 🧾 "No payments yet" / "Every booking and payback shows here, for everyone".

### 1.4 Data bindings

| Field | Source | I1–I5 preset value (goa at kickoff) |
|---|---|---|
| mode | `selectTripHomeMode(tripId)`: `'zero'` iff `trip.stage !== 'planned'` (college always) | `'zero'` |
| hero | `{ kind: 'gradient' }` when zero | gradient |
| title / collapsed title | `planZero.hero.title` | "New trip" |
| meta | `[{ '📍', planZero.hero.where }, { '👥', planZero.hero.joined(members.length) }]` | "Where? Not decided yet", "2 joined" |
| collapsedSub | `planZero.hero.where` | "Where? Not decided yet" |
| members | `selectTripMembers(tripId)`: goa/bali use the current scenario stage's `memberIds`; college uses `trip.memberIds` | Aarav, Rahul |
| chatPreview.avatars | `['go', ...members]` | Go, Aarav, Rahul |
| chatPreview.text / unread | `selectChatPreview(tripId)`; zero uses `planZero.chatPreview` | "Go: What’s the plan, crew? 🌴" / 1 |
| ScopeToggle me / others | session user / members minus session user | Aarav / [Rahul] |
| scope | `useSearchParams().get('scope') ?? 'everyone'` → local state, synced back via `history.replaceState` (PLAN §12.1 #19) | I4 `everyone`, I5 `me` |
| share sheet | `trip.name`, `trip.inviteUrl`, `trip.whatsappGroup` | "Goa crew", "go.vestra.ai/t/goa-k7q", "Goa crew 🌴" |

Trip data:
- `trips.college`: name "College gang", no destination or dates, `stage: 'new'`, `memberIds: ['aarav', 'rahul']`. It renders hero "New trip", "📍 Where? Not decided yet", "👥 2 joined", and the chat pill "Go: What’s the plan, crew? 🌴" with unread 1.
- `trips.goa`: zero on all four tabs until the chat enters stage `plan`.

Inputs requested from Phase 2 (not yet in PLAN):
- **P2-1:**
  - add `planZero` to `src/data/seed/copy.ts` (shape below);
  - set `college.memberIds = ['aarav', 'rahul']`;
  - add a kickoff-only `college` scenario (or get an orchestrator decision; §1.6 #13).
- **P2-2:** add `selectTripMembers(tripId)` and `selectChatPreview(tripId)` to `src/store/selectors.ts`.

```ts
export const planZero = {
  hero: { title: 'New trip', where: 'Where? Not decided yet', joined: (n: number) => `${n} joined` },
  chatPreview: { text: 'Go: What’s the plan, crew? 🌴', unread: 1 },
  home: {
    statusTitle: 'Nothing’s decided yet',
    statusSub: 'Go fills this page as your crew chats',
    decided: (d: number, t: number) => `${d} of ${t} decided`,
    nextUpTitle: 'Next up',
    open: (n: number) => `${n} open`,
    nextUp: [
      { key: 'where', emoji: '📍', title: 'Pick a place', sub: 'Go suggests places from everyone’s answers', action: 'Ask Go' },
      { key: 'when', emoji: '📅', title: 'Pick dates', sub: 'Go finds a weekend that fits everyone', action: 'Ask Go' },
      { key: 'stay', emoji: '🏡', title: 'Find a stay', sub: 'Unlocks once place and dates are set', action: 'Ask Go' },
      { key: 'budget', emoji: '💰', title: 'Set your budget', sub: 'Private to you · Go plans within it', action: 'Set' },
      { key: 'travel', emoji: '🧳', title: 'Sort your travel', sub: 'Each person picks their own route', action: 'Book' },
    ],
    inviteTitle: 'Invite more people',
    inviteSub: 'Share the trip link in your group chat',
  },
  itinerary: {
    emoji: '🗓️', title: 'No plan yet',
    body: 'Once place and dates are set, Go drafts each day from what your crew says in chat.',
    primary: 'Ask Go to draft a plan', secondary: 'Pick dates first',
  },
  bookings: {
    title: 'No bookings yet',
    body: 'Everything Go or your crew books lands here, tickets included.',
    stubs: [
      { key: 'out', emoji: '🛫', eyebrow: 'FLIGHT · TRAIN · BUS', title: 'Getting there', action: 'Book' },
      { key: 'back', emoji: '🛬', eyebrow: 'RETURN TICKET', title: 'Getting back home', action: 'Book' },
      { key: 'stay', emoji: '🏡', eyebrow: 'STAY', title: 'Where you’ll sleep', action: 'Ask Go' },
    ],
  },
  expenses: {
    scopes: { everyone: 'Everyone', me: 'Just me' },
    zero: '₹0',
    everyoneCaption: 'spent by the crew so far',
    meCaption: 'your spend so far',
    categories: [
      { key: 'stay', emoji: '🏡', label: 'Stay' },
      { key: 'travel', emoji: '🧳', label: 'Travel' },
    ],
    footnote: 'Travel covers flights, trains and buses.',
    budget: { title: 'Set your budget', sub: 'Only you see it. Go plans your tickets and stay within it.', cta: 'Set my budget' },
    settle: { title: 'Settle up', emoji: '🤝', rowTitle: 'All square', rowSub: 'Shared bills get split here as they come in' },
    tx: { title: 'Transactions', emoji: '🧾', rowTitle: 'No payments yet', rowSub: 'Every booking and payback shows here, for everyone' },
  },
} as const;
```

### 1.5 Interactions → routes

| Element | Design target | Build |
|---|---|---|
| Hero back / collapsed back | P-App-Home | `<Link href="/home">` |
| Hero share / collapsed share | share sheet | open `ShareInviteSheet`; trip home also honours `?sheet=share` |
| Tabs (both bars) | P-TripHome-Zero / P-Itin-Zero / P-Bookings-Zero / P-Budget-Zero | `/trips/[id]`, `/trips/[id]/itinerary`, `/trips/[id]/bookings`, `/trips/[id]/expenses` |
| Chat FAB | P-Chat-GoA | `/trips/[id]/chat` |
| Pick a place · Ask Go | P-Chat-DestSuggest | `/trips/[id]/chat?stage=places` |
| Pick dates · Ask Go | P-Chat-DatesPoll | `/trips/[id]/chat?stage=dates-poll` |
| Find a stay · Ask Go | P-Chat-StaySuggest | `/trips/[id]/chat?stage=stays` |
| Set your budget · Set | P-Chat-BudgetSheet-Slider | `/trips/[id]/chat?stage=budget&sheet=budget` |
| Sort your travel · Book | P-Chat-Travel | `/trips/[id]/chat?stage=travel` |
| Invite more people | P-Who-Link | goa: `/trips/new`; college: open `ShareInviteSheet` |
| Ask Go to draft a plan | P-Chat-GoA | `/trips/[id]/chat` |
| Pick dates first | P-Chat-DatesPoll | `/trips/[id]/chat?stage=dates-poll` |
| Getting there · Book / Getting back home · Book | P-Chat-Travel | `/trips/[id]/chat?stage=travel` |
| Where you’ll sleep · Ask Go | P-Chat-StaySuggest | `/trips/[id]/chat?stage=stays` |
| Everyone / Just me | in-page state | `onScopeChange` + `history.replaceState` (`?scope=`) |
| Set my budget | P-Chat-BudgetSheet-Slider | `/trips/[id]/chat?stage=budget&sheet=budget` |
| Share: Copy (link card) | toast, sheet stays open | clipboard + toast "Invite link copied" |
| Share: WhatsApp tile / recent group row | P-WA-Pick / P-WA-Compose (both missing) | `share.inviteViaWhatsApp(trip)` |
| Share: Messages / Gmail / More | toast + close | `share.inviteNative(trip)` (toast fallbacks: "Opens Messages with the link filled in" / "Opens Gmail with the link filled in" / "Opens your phone’s share menu"), then close |
| Share: Copy link tile | toast + close | clipboard + "Invite link copied", then close |
| Share backdrop | close | vaul overlay |

The chat page (P3-9) applies `?stage=` with `ensureStage(id)` (PLAN §8, §8.1).

### 1.6 Deviations and decisions (flag in code with `// DESIGN-ASSUMPTION`)
1. **One Goa timeline (PLAN §12.1 #2).** `goa` shows these zero blocks on all four tabs until the chat enters stage `plan` (which sets `trip.stage = 'planned'`). Zero copy stays literal ("New trip", "0 of 5 decided", "5 open") even after place or dates are decided in chat. This matches the design, where H2's back still lands on TripHome-Zero. Only member-derived values are live.
2. **Group name vs hero.** The hero and collapsed header say "New trip" / "Where? Not decided yet" because the destination is unknown. The share sheet uses `trip.name` ("Join Goa crew on Go" / "Join College gang on Go"). Never put `trip.name` in the hero.
3. **Member count.** The design's hero says "2 joined" but its Everyone toggle shows 3 avatars (cb0a, 234f, 8c7b). Use actual members everywhere:
   - hero count and stack: `selectTripMembers`;
   - Everyone art: members minus me (presets I4/I5 show one avatar, Rahul);
   - Chat FAB: Go + members.
4. **Locked rows.** "Find a stay" ("Unlocks once place and dates are set") keeps an enabled "Ask Go" pill with no disabled styling, as designed.
5. **Safe area.** The design hard-codes 46px (glass buttons, collapsed header) and bottom 28 (FAB). The build uses `max(46px,env(safe-area-inset-top))` and `max(28px,env(safe-area-inset-bottom))` as arbitrary values. `pt-safe` is 56px and would shift the header.
6. **Collapsed header is `inert` while `hp <= 0.6`.** The design only toggles pointer-events, which leaves a duplicate tablist for screen readers.
7. **Hero gets `overflow-hidden`** because ring 1 overhangs by 60px.
8. **Missing share targets.** `P-WA-Pick` and `P-WA-Compose` are replaced by `lib/share.ts` (PLAN §8.1).
9. **Tab label vs file name.** The "Expenses" tab maps to `/expenses` (the design files are named Budget). The tab link carries no `scope`, so from I5 it resets to Everyone, as designed.
10. **Travel target differs by entry point.** Home "Sort your travel" goes to the travel-ask stage, while the board's travel row opens the route sheet. Kept as designed.
11. **Token gaps** (report; don't add to `globals.css`):
    - Stay tile `#E3EEFB` (closest token: `info-tint-3` #E6EEFB);
    - Travel dot `#E07A5F`.

    Neither is in PLAN §3. Use `bg-[#E3EEFB]` / `bg-[#E07A5F]` until the orchestrator adds tokens (e.g. `--color-stay-tint`, `--color-travel`); the H3 spend bar and M money screens use the same colours.
12. **Atom gaps vs PLAN §7.1:**
    - Badge has no 24px / 13-700 size; the unread badge uses a className override.
    - Button `xs` is `px-3`, but the Go pill needs `px-3.5`.
    - Button has no `h-12` size; the secondary tint CTA uses `base` + `h-12 px-3.5`.
    - SegmentedProgress needs a named size (`status` = `h-1.5 flex-1 gap-1`).
    - SegmentedControl on Radix ToggleGroup emits radio/group roles, but ScopeToggle must keep `tablist` / `tab` / `aria-selected`.
13. **`college` has no chat scenario** (PLAN §9.3 covers goa and bali), and `/trips/new` is the Goa draft. For `college`:
    - next-up rows and CTAs link to `/trips/college/chat` without `stage`;
    - the invite card opens the share sheet.

    This needs either a kickoff-only college scenario in P2-1 or an orchestrator decision.
14. **Dropped dead code:** `_send`/`pSent` and the `collapsed` state.

### 1.7 Acceptance checklist
Check at 420×912 (plus 360 wide for overflow). Open each state with `/home?preset=I*`.

**I1 · `/trips/goa`**
- [ ] Hero:
  - [ ] 236px warm 160° gradient + 2 dashed rings.
  - [ ] Glass back/share buttons, 40px, at 14px side insets.
  - [ ] "New trip" at 40/700, then "📍 Where? Not decided yet" and "👥 2 joined".
  - [ ] 2 avatars, 28px, white ring, overlap -8.
- [ ] Hero tab bar overlaps the hero by 26px, is 52px tall, and has Home in black.
- [ ] GoStatusCard:
  - [ ] Go avatar 36, "Nothing’s decided yet", "Go fills this page as your crew chats".
  - [ ] 5 empty 6px segments (`aria-label="0 of 5 decided"`) and caption "0 of 5 decided".
- [ ] "Next up" / "5 open", then 5 rows with pills Ask Go · Ask Go · Ask Go · Set · Book. Each navigates per §1.5, and only the pills are links.
- [ ] Invite card navigates to `/trips/new`.
- [ ] Chat FAB, centred at bottom 28:
  - [ ] 3 avatars (Go, Aarav, Rahul), 36px, black ring.
  - [ ] "Chat", "Go: What’s the plan, crew? 🌴", badge "1".
  - [ ] Navigates to chat.
- [ ] Share sheet:
  - [ ] Both share buttons open it.
  - [ ] Copy toasts "Invite link copied" and keeps the sheet open.
  - [ ] The other tiles close it.
- [ ] Content scrolls about 35px; the collapsed header stays invisible and inert.
- [ ] No horizontal scroll at 360px.

**I2 · `/trips/goa/itinerary`**
- [ ] Itinerary tab is active in both bars; the shell is otherwise identical to I1.
- [ ] EmptyHeroCard (radius 28):
  - [ ] 64px go-soft circle with 🗓️, "No plan yet", body copy verbatim.
  - [ ] Black 52px "Ask Go to draft a plan" with a 26px Go avatar → chat.
  - [ ] 48px tint "Pick dates first" → `chat?stage=dates-poll`.
- [ ] The page does not scroll.

**I3 · `/trips/goa/bookings`**
- [ ] Bookings tab is active.
- [ ] "No bookings yet" at 20/600, then the 14px muted body.
- [ ] 3 stubs:
  - [ ] 88px tall with a 1.5px dashed `line-2` border.
  - [ ] 84px canvas stub with a 28px emoji.
  - [ ] Dashed tear line before the 96px action column.
  - [ ] Copy and targets per §1.3 and §1.5.

**I4 · `/trips/goa/expenses` (or `?scope=everyone`)**
- [ ] Expenses tab is active.
- [ ] ScopeToggle: "Everyone" is black with the others' 20px avatars; "Just me" shows my 22px avatar.
- [ ] "₹0" (44/700, faint) + "spent by the crew so far".
- [ ] 2 tiles showing "₹0": Stay (#E3EEFB tile / #3E73D6 dot) and Travel (#FBE8DC / #E07A5F).
- [ ] Footnote present.
- [ ] "Settle up" + 🤝 "All square" dashed row; "Transactions" + 🧾 "No payments yet" dashed row.
- [ ] Tapping "Just me" swaps in the I5 content in place. The URL becomes `?scope=me` with no new history entry.

**I5 · `/trips/goa/expenses?scope=me`**
- [ ] "Just me" is active.
- [ ] "₹0" + "your spend so far", then the tiles, with no footnote.
- [ ] Budget card:
  - [ ] "Set your budget" and "Only you see it. Go plans your tickets and stay within it.".
  - [ ] Full-width black 52px "Set my budget" (no avatar) → `chat?stage=budget&sheet=budget`.
- [ ] Settle up and Transactions are identical to I4.
- [ ] At max scroll the collapsed header is partly visible (opacity ≈0.45) and not interactive.
- [ ] The Expenses tab link resets to Everyone.

**All**
- [ ] Copy is verbatim, with curly apostrophes.
- [ ] `/trips/college` renders the same blocks, with "College gang" in the share sheet.
- [ ] `pnpm exec tsc --noEmit && pnpm lint` is clean.

### 1.8 Consumed by tasks

| Task | Uses | Delivers |
|---|---|---|
| P2-6 | §1.2 | `trip/TripShell.tsx`, `trip/TripHero.tsx`, `trip/TripTabs.tsx`, `trip/CollapsingTripHeader.tsx`, `trip/ChatFab.tsx`, `trip/useCollapsingHeader.ts` |
| P2-4 | §1.3 component table | `trip/GoStatusCard.tsx`, `trip/NextUpRow.tsx`, `trip/EmptyHeroCard.tsx`, `trip/TicketStubPlaceholder.tsx`, `trip/DashedNoteRow.tsx`, `trip/ZeroAmount.tsx`, `trip/CategoryTile.tsx`, `common/ScopeToggle.tsx` |
| P3-16 | §1.3 blocks, §1.4, §1.5 | `trip/empty/TripHomeZero.tsx`, `trip/empty/ItineraryZero.tsx`, `trip/empty/BookingsZero.tsx`, `trip/empty/ExpensesZero.tsx` |
| P3-17 | §1.1 I1, §1.4, §1.7 I1 | `/trips/[tripId]` mounts `TripShell active="home"` + `TripHomeZero` when the mode is zero; handles `?sheet=share` |
| P3-13 | §1.1 I2, §1.7 I2 | itinerary page zero branch: `TripShell active="itinerary"` + `ItineraryZero` |
| P3-14 | §1.1 I3, §1.7 I3 | bookings page zero branch: `TripShell active="bookings"` + `BookingsZero` |
| P3-15 | §1.1 I4/I5, §1.7 I4/I5 | expenses page zero branch: `TripShell active="expenses"` + `ExpensesZero`, with scope state ↔ `?scope=` |

Ordering: P2-6 (batch 2A) imports `GlassIconButton` and `ShareInviteSheet` from P2-3 and the `Trip`/`User` types from P2-1, both in the same parallel batch. Either run P2-6 after them (move it to 2B) or pin those import paths and types in its prompt.

## 2. Inventory (reference)

Pasted verbatim from `scratchpad/inv/group-H-I-board-plan-empty.md`. Headings are demoted one level, and the Board sections and board-only group notes are left out. PLAN §7 names are added in [brackets]. This describes the design and is not instructions.

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`. All 8 files read in full. Where two files were byte-identical in a region, that was confirmed with `diff` and is stated as "identical".
Canvas section titles (from `canvas.json`, page "prototype"): **"8 · Trip board"** (H1–H3, y=9904) and **"9 · Trip plan · nothing decided yet"** (I1–I5, y=11276).

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
- Toast (all 8 files, identical): `sc-if pToast`, `.enter`, `role=status`. Styles: absolute, left 50% + `translateX(-50%)`, bottom 108px, z 60, max-width 340, padding 12px 16px, radius 16, bg `#0B1B3F`, white 14px/600, lh 1.35, centred, shadow `0 10px 30px rgba(11,27,63,0.3)`. Auto-hides after **2200ms** (`_toast` resets the timer).
- Every script has the same `Component` boilerplate: `pT`, `pShare`, `pSent`, `_toast`, and `_send(t, quote)`. `_send` appends a "me" message and, after 1200ms, a Go reply **"Got it 👍 I’ll factor that into the plan."**, then scrolls `[data-p-end]` into view (60ms delay, smooth). In I1–I5 `_send` is dead code because those pages have no chat list.

---

### Trip plan shell (common to I1–I5)

The five I files are one template. The hero, tab bar, collapsing header, chat pill, share sheet, toast and script base are identical. Only `<title>`, the active tab and the content block differ. `diff` confirmed: Itin vs Bookings vs Budget differ only on lines 5, 49, 51–56 and 76 (plus the Budget script).

#### Structure (z-order, top→bottom in the DOM)
1. **Scroll container** [TripShell]: `flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; display: flex; flex-direction: column`, with `onScroll={{onScroll}}`. The hero, tab bar and content all scroll inside it.
2. **Hero** [TripHero] (in the scroll flow, `flex-shrink: 0`): height **236px**, bg `#E9945A`.
   - Overlay span (`inset 0`): `linear-gradient(160deg, #F4C9A8 0%, #D98A68 45%, #8E4A3A 100%)`.
   - Decorative dashed rings (aria-hidden, absolute, `box-sizing: border-box`, radius 50%):
     - ring 1: 240×240, `right: -60px; top: 30px`, `1.5px dashed rgba(255,255,255,0.45)`.
     - ring 2: 100×100, `right: 10px; top: 100px`, `1.5px dashed rgba(255,255,255,0.35)`.
   - **Back** (glass): `<a href="P-App-Home.dc.html" aria-label="Back">`, absolute top 46 / left 14, 40×40 circle. bg `rgba(11,27,63,0.35)` with `backdrop-filter: blur(12px)` (and the -webkit- prefix). White back-arrow SVG at 20px.
   - **Share** (glass): `<a role="button" aria-label="Share trip" onClick=pa_0>`, absolute top 46 / right 14, same glass style, share SVG at 18px. Opens the share sheet.
   - **Title block**: absolute left 20 / right 20 / bottom 42; flex, `align-items: flex-end; justify-content: space-between`, gap 12; white.
     - Left column (gap 2):
       - Title **"New trip"**: 40px/700, ls -0.03em, lh 1.
       - Meta column (margin-top 4, gap 2). Each line is 15px/500, lh 1.35, nowrap, with an 18px-wide emoji slot at 15px:
         - "📍 Where? Not decided yet"
         - "👥 2 joined"
     - Right: avatar stack (padding-bottom 2). Two 28×28 circles, `border: 2px solid #FFFFFF`, overlap `margin-left: -8px` (wrapper padding-left 8). Order: c58d (me), cb0a (Rahul).
   - **No dates line**, because the empty state has none.
3. **Section tab bar (segmented control)** [TripTabs variant=hero; compact copy in the collapsed header], `role="tablist" aria-label="Trip sections"`. Sits in the scroll flow right under the hero, so it scrolls; it is not fixed.
   - Container: `position: relative; z-index: 2; margin: -26px 16px 0` (overlaps the hero bottom by 26px). padding 5, gap 2, radius 999, bg `#FFFFFF`, shadow `0 1px 2px rgba(11,27,63,0.06), 0 8px 24px rgba(11,27,63,0.12)`. Total height 52.
   - 4 tabs, each `<a role="tab">` with flex 1, height **42**, radius 999, centred, 15px/600, no underline. **Text only: no icons or emoji.**
     - Active: `background: #000000; color: #FFFFFF; aria-selected="true"`.
     - Inactive: `background: transparent; color: #4A5878`.
   - Items → targets: **Home** → `P-TripHome-Zero.dc.html`; **Itinerary** → `P-Itin-Zero.dc.html`; **Bookings** → `P-Bookings-Zero.dc.html`; **Expenses** → `P-Budget-Zero.dc.html`. Expenses always goes to the "everyone" file, never `-Me`.
   - Note: the tab label is "Expenses", but the files are named `Budget`.
4. **Content column**: padding **16px 16px 120px**, flex column, gap **10**. The 120px bottom padding clears the chat pill and fade.
5. **Collapsed sticky header** [CollapsingTripHeader + useCollapsingHeader] (outside the scroll container; style from `{{headStyle}}`):
   - Base: `position: absolute; left 0; right 0; top 0; z-index: 4; padding: 46px 12px 10px; background: #FFFFFF; box-shadow: 0 1px 0 rgba(11,27,63,0.05), 0 8px 20px rgba(11,27,63,0.08); display: flex; flex-direction: column; gap: 8px`.
   - Animated by `hp` (0..1): `opacity: hp; transform: translateY((1-hp)*-14 px); pointer-events: hp>0.6 ? auto : none; transition: opacity 140ms ease-out, transform 140ms ease-out; will-change: opacity, transform`.
   - `onScroll`: `hp = round(clamp((scrollTop-110)/90, 0, 1)*20)/20`. Fade starts at 110px, is full at 200px, in 0.05 steps. It also sets `collapsed = hp>=1`, which is unused in the template.
   - Row 1 (flex, gap 6):
     - Back `<a href="P-App-Home.dc.html">` 40×40, ink `#0B1B3F`, arrow 20.
     - Title column (flex 1): "New trip" 17px/700, ls -0.014em, lh 1.2; subtitle "Where? Not decided yet" 13px `#4A5878`, ls 0.002em, lh 1.35.
     - Share `<a role=button onClick=pa_1>` 40×40, share icon 18. Opens the share sheet.
   - Row 2, compact tablist ("Trip sections"): padding 4, gap 2, radius 999, bg `#F4F5F7`. Tabs are height **36**, 14px/600, with the same active/inactive colours and the same hrefs as the main tab bar.
   - Safe area: hard-coded top padding (46px on the glass buttons and the compact header). There is no env() inset.
6. **Bottom fade** [FadeDock variant=fade]: aria-hidden, absolute bottom 0, height 120, `pointer-events: none`, `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 70%)`.
7. **Floating "Chat" pill** [ChatFab] (this is the shell's "Ask Go"/chat entry): `<a href="P-Chat-GoA.dc.html">`.
   - Position: absolute, `left: 50%; bottom: 28px; transform: translateX(-50%)`.
   - Box: height **58**, padding `0 12px 0 8px`, gap 10, radius 999, bg `#000000`, white text, shadow `0 8px 24px rgba(11,27,63,0.25)`.
   - Avatar stack (wrapper padding-left 12): three 36×36 circles, `border: 2px solid #000000`, `margin-left: -12px`. Order: Go (5bda, bg `#DCEBFF`), c58d, cb0a.
   - Text column: "Chat" 15px/600, ls -0.008em, lh 1.25. Preview "Go: What’s the plan, crew? 🌴" 12px `rgba(255,255,255,0.7)`, ls 0.01em, lh 1.3, nowrap.
   - Unread badge: min-width 24, height 24, padding 0 7, radius 999, bg `#A44F3A`, white 13px/700 tabular-nums, shows "1".
   - There is no other FAB and no bottom action bar in the shell.
8. **Share sheet** [ShareInviteSheet] (`sc-if pShare`), wrapper absolute `inset 0; z-index 40`:
   - Backdrop `<button aria-label="Close" onClick=pa_6>`: inset 0, bg `rgba(11,27,63,0.38)`. Tapping it closes the sheet.
   - Dialog (`role="dialog" aria-label="Share trip invite"`, class `.enter`): absolute, bottom-anchored, left/right 0. padding `8px 16px 30px`, radius `28px 28px 0 0`, bg `#F6F7F9`, shadow `0 -8px 30px rgba(11,27,63,0.18)`, flex column, gap 14. Height comes from content (~300px).
   - Grabber: 40×5, radius 999, `#DDE1E6`, centred.
   - Link card: padding 12, radius 18, white, border `1px solid #ECEFF3`, gap 12.
     - Trip image 44×44, radius 12, bg `#FFF1DC` (blob 63e0).
     - "Join Goa crew on Go" 15px/600; "go.vestra.ai/t/goa-k7q" 13px `#4A5878`.
     - **Copy** button: height 36, padding 0 12, radius 999, bg `#F4F5F7`, 13px/600. Calls `pa_7`: toast "Invite link copied" and **the sheet stays open**.
   - Recent-group row: `<a href="P-WA-Compose.dc.html">` (**target file missing in the dir**). padding 10px 12px, radius 18, white, border `#ECEFF3`, gap 12.
     - 44px circle, bg `#FFF1DC`, "🌴" at 20px, with an 18px `#25D366` dot bottom-right (-2/-2) with a 2px white border.
     - "Goa crew 🌴" 15/600; "WhatsApp group · recent" 13 `#4A5878`.
     - Chevron 16px, stroke 2.4, `#A5ACB8`.
   - Target row (`justify-content: space-between`): five items, each 64 wide, column gap 6. Tile 56×56, radius 18, border `1px solid #ECEFF3`, emoji 24px. Label 12px/600 ink.
     - **WhatsApp**: `<a href="P-WA-Pick.dc.html">` (**missing file**). Tile bg `#25D366` with a white chat-bubble SVG at 28px.
     - **Messages** 💬: white tile. `pa_2`: toast "Opens Messages with the link filled in" and the sheet closes.
     - **Gmail** ✉️: `pa_3`: toast "Opens Gmail with the link filled in" and the sheet closes.
     - **Copy link** 🔗: `pa_4`: toast "Invite link copied" and the sheet closes.
     - **More** ⋯: `pa_5`: toast "Opens your phone’s share menu" and the sheet closes.
9. Toast, as in the foundation section.

#### Plan-shell script (PBase), identical I1–I5
- `PBase` constructor: `state = { collapsed: false }`. I4/I5 add `view: 'all' | 'me'`.
- `renderVals` returns `collapsed`, `headStyle` and `onScroll` (formulas above).
- `Component` handlers:
  - `pa_0` (hero share) and `pa_1` (compact-header share) both set `pShare: true`.
  - `pa_2`–`pa_5` are the share targets above.
  - `pa_6` is the backdrop close.
  - `pa_7` is Copy (toast only).

#### Everyone / Just me toggle (Expenses only; I4/I5) [ScopeToggle]
This is not part of the global shell. It is the first item in the Expenses content column.
- Container: `role="tablist" aria-label="Whose view"`, padding 4, **gap 4**, radius 999, bg `#FFFFFF`, border `1px solid #ECEFF3`. No shadow. Total height 50.
- Built with `sc-for views`, where `views = [['all','Everyone'], ['me','Just me']]`. Each is a `<button role="tab" aria-selected>` with `onClick = setState({view:id})`.
- Button style: flex 1, height **40**, border 0, radius 999, centred, gap 6, font inherit 15px/600, cursor pointer.
  - On: `background: #000000; color: #FFFFFF`.
  - Off: `background: transparent; color: #4A5878`.
- "Everyone" leading art: three 20×20 avatars with `border: 2px solid #FFFFFF`, overlap -7 (wrapper padding-left 7). Avatars: cb0a, 234f, 8c7b, which are the **other three members, not me**.
- "Just me" leading art: one 22×22 avatar (c58d, me) with no border.
- Toggling is in-page state only. There is no navigation to `P-Budget-Zero-Me.dc.html`.

#### Empty-state patterns used in the plan area
- **A. Centred hero empty card** (Itinerary) [EmptyHeroCard]:
  - Card: padding `26px 20px 20px`, radius **28**, white, shadow `0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`. Column, centred, gap 12, text-align center.
  - Emoji tile: **64×64 circle, bg `#F6EAE6`**, emoji 30px.
  - Title: 20px/600, ls -0.018em, lh 1.3. Body: 15px `#4A5878`, lh 1.4, max-width 300, text-wrap pretty. Gap between title and body: 4.
  - Primary CTA (wrapper stretches full width, margin-top 4): height **52**, padding 0 18, gap 8, radius 999, bg `#000000`, white 16px/500, ls -0.014em, lh 1.3. Leading 26px Go avatar.
  - Secondary CTA (full width): height **48**, padding 0 14, radius 999, bg `#F6EAE6`, `#A44F3A` 15px/600, ls -0.004em.
- **B. Status card with Go avatar** (Home, Expenses-me) [GoStatusCard]:
  - Card: padding 16, radius 22, white, same shadow, gap 12.
  - Go avatar 36px, then a title 16/600 (ls -0.011em, lh 1.3) and a sub 13px `#4A5878` (ls 0.002em, lh 1.35).
- **C. List card with rows** (Home "Next up") [ListCard + NextUpRow]:
  - Card: padding 0 14, radius 22, white, same shadow.
  - Rows: padding 12px 0, gap 12, `border-top: 1px solid #ECEFF3` from the second row on.
  - Each row: 40px icon circle (bg `#F4F5F7`, emoji 19px); title 16/600 + sub 13; trailing **Go pill**.
- **Go pill** ("Ask Go" style, used on rows) [Button variant=tint size=xs]: height 32, padding 0 14, radius 999, bg `#F6EAE6`, text `#A44F3A` 13px/600, ls -0.004em, lh 1.35, nowrap.
- **D. Dashed ticket stub** (Bookings) [TicketStubPlaceholder]: see I3.
- **E. Dashed note row** (Expenses "Settle up" / "Transactions") [DashedNoteRow]:
  - padding 16, radius 22, `border: 1.5px dashed #DDE1E6`, no bg (sits on the page `#F6F7F9`), gap 12.
  - 40px white circle with an 18px emoji; title 15/600; sub 13 `#4A5878`.
- **Section header** (Home, Expenses) [SectionHeader]: flex, baseline, space-between, padding 0 4. Title 20/600, ls -0.018em, lh 1.3. Optional trailing meta 13/600 `#4A5878`. margin-top is 8 (Home) or 10 (Expenses).
- **Zero amount** [ZeroAmount]: big `₹0` 44px/700, ls -0.03em, lh 1.05, colour **`#A5ACB8`** (greyed), tabular-nums.

---

### P-TripHome-Zero.dc.html — I1 · Home, empty
(`<title>`: "Go — Trip home, empty")

#### Purpose
The trip plan landing tab when nothing is decided. It shows a Go status card with 0/5 progress, a "Next up" checklist of five decisions that each jump to a chat flow, and an invite card.

#### Layout top→bottom
- Plan shell: hero (236), tab bar with **Home active**, then content.
- Content (padding 16/16/120, gap 10):
  1. **Go status card** (pattern B): padding 16, radius 22, white, shadow `0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`, gap 12.
     - Row (gap 10): Go avatar 36 (bg `#DCEBFF`); title **"Nothing’s decided yet"** (16/600, ls -0.011em, lh 1.3); sub **"Go fills this page as your crew chats"** (13 `#4A5878`). Column gap 1.
     - Progress (column gap 6):
       - `role="img" aria-label="0 of 5 decided"`: 5 segments, each flex 1, height 6, radius 999, bg `#ECEFF3`, gap 4. All empty.
       - Caption "0 of 5 decided" (13 `#4A5878`).
  2. **Section header** (margin-top 8): "Next up" (20/600) … "5 open" (13/600 `#4A5878`).
  3. **Next-up list card** (pattern C): padding 0 14, radius 22, white, shadow. Rows are `<div>`s; only the trailing pill is a link. Each row has a 40px `#F4F5F7` circle with a 19px emoji.

     | Emoji | Title | Sub | Pill | → |
     |---|---|---|---|---|
     | 📍 | Pick a place | Go suggests places from everyone’s answers | Ask Go | P-Chat-DestSuggest |
     | 📅 | Pick dates | Go finds a weekend that fits everyone | Ask Go | P-Chat-DatesPoll |
     | 🏡 | Find a stay | Unlocks once place and dates are set | Ask Go | P-Chat-StaySuggest |
     | 💰 | Set your budget | Private to you · Go plans within it | Set | P-Chat-BudgetSheet-Slider |
     | 🧳 | Sort your travel | Each person picks their own route | Book | **P-Chat-Travel** |

     Pills are text-only Go pills (height 32, padding 0 14, `#F6EAE6`/`#A44F3A`, 13/600). "Find a stay" claims to be locked but has **no disabled styling**.
  4. **Invite card**: `<a href="P-Who-Link.dc.html">`, padding 12px 14px, gap 12, radius 22, white, shadow.
     - 40px circle on `#F6EAE6` holding a **link SVG** 20 in ink.
     - "Invite more people" 16/600; "Share the trip link in your group chat" 13 (column gap 1).
     - Chevron 16 `#A5ACB8`.
- Shell overlays: collapsed header (Home active), bottom fade, Chat pill, share sheet, toast.
- Scroll: content is about 950px against a 912px canvas, so the page scrolls about 35px. **The collapsing header (which needs >110px of scroll) never shows on this screen.**

#### Sheets / overlays
- Only the share sheet (opened from the hero share `pa_0` or the header share `pa_1`). Spec in the shell section; handler map `pa_2`–`pa_7` as listed there.

#### State & interactions
- `state = { collapsed: false, pT: null, pShare: false, pSent: [] }`, plus `hp` set on scroll.
- Toasts as in the shell. All rows navigate. There are no local toggles.

#### Navigation table
| Element | Target |
|---|---|
| Hero back (glass) / collapsed back | P-App-Home.dc.html |
| Hero share / collapsed share | share sheet (pa_0 / pa_1) |
| Tab Home / Itinerary / Bookings / Expenses (both bars) | P-TripHome-Zero / P-Itin-Zero / P-Bookings-Zero / P-Budget-Zero |
| Pick a place "Ask Go" | P-Chat-DestSuggest.dc.html |
| Pick dates "Ask Go" | P-Chat-DatesPoll.dc.html |
| Find a stay "Ask Go" | P-Chat-StaySuggest.dc.html |
| Set your budget "Set" | P-Chat-BudgetSheet-Slider.dc.html |
| Sort your travel "Book" | P-Chat-Travel.dc.html |
| Invite more people card | P-Who-Link.dc.html |
| Chat pill | P-Chat-GoA.dc.html |
| Share: group row / WhatsApp | P-WA-Compose / P-WA-Pick (both missing) |

#### Data shown
- Hero: "New trip", "📍 Where? Not decided yet", "👥 2 joined", 2 avatars (c58d, cb0a).
- Status: "Nothing’s decided yet", "Go fills this page as your crew chats", "0 of 5 decided".
- "Next up", "5 open", the five rows above. "Invite more people" / "Share the trip link in your group chat".
- Chat pill: "Chat", "Go: What’s the plan, crew? 🌴", badge "1".
- Share and toasts: as in the shell.

#### Icons & images
- SVGs:
  - Back 20, share 18, chevron 16 (2.4), WhatsApp 28.
  - **Link** 20: `M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1` + `M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1`.
- Emoji: 📍👥 (hero meta, 15px); 📍📅🏡💰🧳 (row circles, 19px); 🌴 (chat preview, share); 💬✉️🔗⋯ (share tiles).
- `/_blob/`:
  - c58d, cb0a: 28px hero avatars with 2px white ring; 36px in the chat pill with 2px black ring.
  - 5bda (Go): 36 in the status card, 36 in the chat pill.
  - 63e0: share card.

---

### P-Itin-Zero.dc.html — I2 · Itinerary, empty
(`<title>`: "Go — Itinerary, empty")

#### Purpose
The Itinerary tab before place and dates exist: one centred empty card that asks Go to draft a plan or pick dates first.

#### Layout top→bottom
- Plan shell, with the **Itinerary tab active** in both tab bars.
- Content: a single **centred hero empty card** (pattern A):
  - Emoji tile: 64px circle on `#F6EAE6` with **"🗓️"** at 30px.
  - Title: **"No plan yet"**.
  - Body: **"Once place and dates are set, Go drafts each day from what your crew says in chat."**
  - Primary CTA (height 52, black, 26px Go avatar): **"Ask Go to draft a plan"** → `P-Chat-GoA.dc.html`.
  - Secondary CTA (height 48, `#F6EAE6`/`#A44F3A` 15/600): **"Pick dates first"** → `P-Chat-DatesPoll.dc.html`.
- Shell overlays (chat pill, fade, collapsed header, share sheet, toast).
- Scroll: total content is about 730px, so the page does not scroll and the collapsed header never shows.

#### Sheets / overlays
Share sheet only (shell).

#### State & interactions
Shell only. No page-specific state.

#### Navigation table
| Element | Target |
|---|---|
| Ask Go to draft a plan | P-Chat-GoA.dc.html |
| Pick dates first | P-Chat-DatesPoll.dc.html |
| Back / tabs / share / Chat pill / share rows | same as I1 |

#### Data shown
- "🗓️", "No plan yet", the body copy and both CTA labels above. Hero and shell copy as in I1.

#### Icons & images
- Shell set, plus a 26px Go avatar (5bda, bg `#DCEBFF`) inside the black CTA. Emoji 🗓️ at 30px.

---

### P-Bookings-Zero.dc.html — I3 · Bookings, empty
(`<title>`: "Go — Bookings, empty")

#### Purpose
The Bookings tab with nothing booked. Three dashed "ticket stub" placeholders (outbound, return, stay) each carry a book or ask CTA.

#### Layout top→bottom
- Plan shell, with the **Bookings tab active**.
- Content (gap 10):
  1. **Intro block**: padding `4px 4px 2px`, column gap 2.
     - **"No bookings yet"**: 20px/600, ls -0.018em (no line-height set).
     - **"Everything Go or your crew books lands here, tickets included."**: the style declares 13px and then 14px, so the effective size is **14px**. Colour `#4A5878`, ls 0.002em, lh 1.35.
  2. **Ticket stubs** (×3), the dashed placeholder pattern:
     - Container: `position: relative; display: flex; align-items: stretch; height: 88px; border-radius: 20px; background: #FFFFFF; border: 1.5px dashed #DDE1E6`.
     - Left stub: width 84, `flex-shrink: 0`, radius `20px 0 0 20px`, bg `#F6F7F9`, centred emoji 28px, aria-hidden.
     - Middle: flex 1, padding 12px 14px, column centred, gap 2.
       - Eyebrow: 11/700 `#4A5878`, ls 0.08em, lh 1.35.
       - Title: 18px/600, ls -0.014em, lh 1.25.
     - Right: width 96, `flex-shrink: 0`, centred, **`border-left: 1.5px dashed #DDE1E6`** (the tear line). Holds a text Go pill (height 32).
     - There are no perforation notches: just the dashed divider.

     | Stub emoji | Eyebrow | Title | Pill | → |
     |---|---|---|---|---|
     | 🛫 | FLIGHT · TRAIN · BUS | Getting there | Book | P-Chat-Travel |
     | 🛬 | RETURN TICKET | Getting back home | Book | P-Chat-Travel |
     | 🏡 | STAY | Where you’ll sleep | Ask Go | P-Chat-StaySuggest |
  3. The column has a trailing empty line after the stubs (whitespace only).
- Shell overlays. Content is about 650px, so the page does not scroll.

#### Sheets / overlays
Share sheet only (shell).

#### State & interactions
Shell only.

#### Navigation table
| Element | Target |
|---|---|
| Getting there "Book" | P-Chat-Travel.dc.html |
| Getting back home "Book" | P-Chat-Travel.dc.html |
| Where you’ll sleep "Ask Go" | P-Chat-StaySuggest.dc.html |
| Shell elements | same as I1 |

#### Data shown
"No bookings yet"; "Everything Go or your crew books lands here, tickets included."; the three stubs above.

#### Icons & images
- Emoji 🛫 🛬 🏡 at 28px in the stubs.
- No images beyond the shell avatars. No Go avatar in the pills.

---

### P-Budget-Zero.dc.html — I4 · Expenses, empty · everyone
(`<title>`: "Go — Expenses, empty")

#### Purpose
The Expenses tab before any money moves, in the crew-wide view. It shows a greyed ₹0 total and per-category tiles, then empty "Settle up" and "Transactions" sections.

#### Layout top→bottom
- Plan shell, with the **Expenses tab active**.
- Content (gap 10):
  1. **Whose-view toggle** ("Everyone" active). Spec in the shell section.
  2. **`sc-if isAllV`** (shown), column gap 10:
     - Total block: padding `4px 0 0 4px`, flex, `align-items: flex-start`, space-between, gap 12.
       - **"₹0"**: 44px/700, ls -0.03em, lh 1.05, **`#A5ACB8`**, tabular.
       - **"spent by the crew so far"**: 15px `#4A5878`, tabular.
       - Column gap 2.
     - Category grid: `grid-template-columns: repeat(2, minmax(0,1fr))`, gap 10. Each tile: padding 12, flex, centred, gap 10, radius 18, white, shadow `0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`.
       - Icon square: 48×48, radius 12, emoji 22.
       - Text column (gap 1): amount "₹0" 18px/600 `#A5ACB8` tabular. Legend line: 8px dot + label, 13px `#4A5878`, gap 6.
       - **Stay**: square bg `#E3EEFB`, 🏡, dot `#3E73D6`.
       - **Travel**: square bg `#FBE8DC`, 🧳, dot `#E07A5F`.
     - Footnote: **"Travel covers flights, trains and buses."** 13px `#4A5878`, padding 0 4.
  3. **`sc-if isMeV`** (hidden here; see I5).
  4. **Section header** (margin-top 10): **"Settle up"** (20/600). No trailing meta.
  5. **Dashed note row** (pattern E): 🤝 in a white 40px circle; **"All square"** (15/600); **"Shared bills get split here as they come in"**.
  6. **Section header** (margin-top 10): **"Transactions"**.
  7. **Dashed note row**: 🧾; **"No payments yet"**; **"Every booking and payback shows here, for everyone"**.
- Shell overlays.
- Scroll: content is about 960px, so the page scrolls about 50px and the collapsed header stays hidden (hp stays 0).

#### Sheets / overlays
Share sheet only (shell).

#### State & interactions
- PBase `state = { collapsed: false, view: 'all' }`.
- Derived values:
  - `views[]` gives each button its `label`, `isAll`, `isMe`, `sel` ('true'/'false'), `pick`, and `style`.
  - `isAllV = view==='all'`, `isMeV = view==='me'`.
- Tapping "Just me" swaps in the I5 content in place. No navigation, no animation (the sc-if blocks have no `.enter`).
- Settle up and Transactions always show, whichever view is active.

#### Navigation table
| Element | Target |
|---|---|
| Toggle Everyone / Just me | in-page `setState({view})` |
| (no other page-specific links in the Everyone view) | — |
| Shell elements | same as I1 |

#### Data shown
- Toggle: "Everyone" (3 avatars: cb0a, 234f, 8c7b) and "Just me" (c58d).
- "₹0", "spent by the crew so far", Stay ₹0, Travel ₹0, "Travel covers flights, trains and buses."
- "Settle up" / "All square" / "Shared bills get split here as they come in".
- "Transactions" / "No payments yet" / "Every booking and payback shows here, for everyone".

#### Icons & images
- Emoji: 🏡 🧳 (22px in tinted squares), 🤝 🧾 (18px in white circles).
- `/_blob/`: 20px toggle avatars cb0a, 234f, 8c7b with a 2px white ring (overlap -7); c58d at 22px.

---

### P-Budget-Zero-Me.dc.html — I5 · Expenses, empty · just me
(`<title>`: "Go — Expenses, empty". This is the same title as I4.)

#### Purpose
The Expenses tab in the private "Just me" view. It shows my ₹0 spend, the category tiles, and a prompt to set my private budget.

#### Layout top→bottom
- **Byte-identical to I4** except for three lines (confirmed with `diff`):
  - The initial state is `view: 'me'`.
  - The `hint-placeholder-val` flags are flipped: `isAllV` false, `isMeV` true.
- Rendered content (gap 10):
  1. Toggle with **"Just me" active** (black) and "Everyone" inactive.
  2. **`sc-if isMeV`** block (column gap 10):
     - Total: **"₹0"** (44/700 `#A5ACB8`) + **"your spend so far"** (15px `#4A5878`).
     - The same 2-up category grid (Stay ₹0 on `#E3EEFB` with 🏡 and dot `#3E73D6`; Travel ₹0 on `#FBE8DC` with 🧳 and dot `#E07A5F`).
     - **No footnote**: "Travel covers…" appears only in the Everyone view.
     - **Set-budget card** (pattern B with a CTA): padding 16, radius 22, white, shadow, gap 12.
       - Row: Go avatar 36; **"Set your budget"** (16/600, ls -0.011em, lh 1.3); **"Only you see it. Go plans your tickets and stay within it."** (13 `#4A5878`).
       - CTA `<a href="P-Chat-BudgetSheet-Slider.dc.html">`: height 52, padding 0 18, radius 999, black, white 16px/500, ls -0.014em. Label **"Set my budget"**, with no avatar.
  3. "Settle up" header + 🤝 "All square" dashed row (same as I4).
  4. "Transactions" header + 🧾 "No payments yet" dashed row (same as I4).
- Scroll: content is about 1,060px, so the page scrolls about 150px. `hp` can reach about 0.45, so **the collapsed header partly fades in (opacity up to ~0.45) but stays non-interactive** (pointer-events only turn on above 0.6).

#### Sheets / overlays
Share sheet only (shell).

#### State & interactions
- Same as I4. Initial `view: 'me'`. Tapping "Everyone" shows the I4 content in place.

#### Navigation table
| Element | Target |
|---|---|
| Set my budget | P-Chat-BudgetSheet-Slider.dc.html |
| Toggle | in-page view switch |
| Expenses tab | P-Budget-Zero.dc.html (the everyone file, so tapping the active tab resets the view to Everyone) |
| Shell elements | same as I1 |

#### Data shown
- "₹0", "your spend so far", Stay ₹0, Travel ₹0.
- "Set your budget" / "Only you see it. Go plans your tickets and stay within it." / "Set my budget".
- Settle up and Transactions copy as in I4.

#### Icons & images
- Same as I4, plus the Go avatar 5bda at 36px in the set-budget card.

---

### Group notes

#### Shared element names (proposed component names)
- **Plan shell:**
  - `TripHero` [TripHero]: 236px gradient, dashed rings, glass back and share buttons, title + meta + avatar stack.
  - `TripSectionTabs` [TripTabs]: segmented control in two sizes, 42px (in-flow) and 36px (compact, `#F4F5F7` track); black active pill; 4 text tabs.
  - `CollapsingTripHeader` [CollapsingTripHeader + useCollapsingHeader]: scroll-linked opacity and translate, from 110 to 200px.
  - `ChatPill` [ChatFab]: black 58px floating pill with avatar stack, preview line and unread badge.
  - `BottomFade` [FadeDock variant=fade]: 120px.
  - `ShareInviteSheet` [ShareInviteSheet]: link card + Copy, recent WhatsApp group row, 5 share tiles.
  - `Toast` [Sonner Toaster + toastGo]: navy, 2200ms.
- **Plan content:**
  - `GoStatusCard` [GoStatusCard]: Go avatar 36 + title/sub, with an optional segmented progress bar or CTA.
  - `SectionHeader` [SectionHeader]: 20/600 title + 13/600 meta.
  - `NextUpRow` [NextUpRow]: 40px grey emoji circle + title/sub + Go pill.
  - `GoPill` [Button variant=tint size=xs]: `#F6EAE6`/`#A44F3A`, h32 13/600; a variant has a 20px Go avatar.
  - `PrimaryButton` [Button variant=primary size=lg]: black, h52 16/500; variant with a 26px Go avatar.
  - `SecondaryTintButton` [Button variant=tint, h-12 override]: `#F6EAE6`, h48 15/600.
  - `EmptyHeroCard` [EmptyHeroCard]: 64px tinted emoji circle, title, body, two CTAs.
  - `TicketStubPlaceholder` [TicketStubPlaceholder]: dashed, 88px tall, 84px stub + 96px action slot.
  - `DashedNoteRow` [DashedNoteRow].
  - `ViewToggle` [ScopeToggle]: Everyone / Just me.
  - `ZeroAmount` [ZeroAmount] (`#A5ACB8`).
  - `CategoryTile` [CategoryTile]: 48px tinted square + amount + coloured legend dot.
- **Avatar convention:** `/_blob/5bda…` = Go (always on `#DCEBFF`); c58d = me; cb0a = Rahul; 234f and 8c7b = the other two members; 63e0 = group/trip avatar (on `#FFF1DC`).

#### Sibling-state collapses
- **Budget-Zero vs Budget-Zero-Me**: one route with a `view: 'all' | 'me'` toggle.
  - Only the initial `view` and the sc-if hint values differ.
  - Everyone view = "₹0 spent by the crew so far" + 2 tiles + footnote "Travel covers flights, trains and buses."
  - Just me view = "₹0 your spend so far" + 2 tiles + "Set your budget" card with a "Set my budget" CTA (→ budget sheet), and no footnote.
  - Settle up and Transactions are shared by both views.
  - Tabs always link to `P-Budget-Zero`.
- **I1–I5 as a whole**: one route, `/trip/:id` with a section param. The shell is identical. Content swaps by active tab (Home / Itinerary / Bookings / Expenses). The empty state is just the `nothing decided` data state of each tab.

#### Navigation graph (summary)
- **Plan tabs:** the four I files link to each other through the tab bars.
- **Plan back:** every I screen goes back to `P-App-Home`.
- **Chat pill:** goes to `P-Chat-GoA` from every I screen. Itinerary's "Ask Go to draft a plan" also goes to `P-Chat-GoA`.
- **Home "Next up" rows:**
  - place → `P-Chat-DestSuggest`
  - dates → `P-Chat-DatesPoll`
  - stay → `P-Chat-StaySuggest`
  - budget → `P-Chat-BudgetSheet-Slider`
  - travel → `P-Chat-Travel`
- **Home invite card** → `P-Who-Link`.
- **Itinerary** "Pick dates first" → `P-Chat-DatesPoll`.
- **Bookings stubs:** "Book" (×2) → `P-Chat-Travel`; "Ask Go" → `P-Chat-StaySuggest`.
- **Expenses-me** "Set my budget" → `P-Chat-BudgetSheet-Slider`.
- **No I screen links to a Board file**, and the I1–I5 shell has no board icon. The board is reachable only from the chat header icon, and each board file's icon links to itself.

#### Surprises and ambiguities
5. **Travel destination differs between Home and the board.** Home "Sort your travel / Book" → `P-Chat-Travel`; board "YOUR TRAVEL / Find routes" → `P-Chat-RouteSheet`.
6. **Missing files:** `P-WA-Compose.dc.html` and `P-WA-Pick.dc.html` (share-sheet targets) do not exist in the prototype dir. `support.js` is absent too.
7. **The empty trip uses the name "Goa crew".** It appears in the board header, the share card ("Join Goa crew on Go") and the WhatsApp row, while the plan hero says "New trip" / "Where? Not decided yet". The group name and the destination are separate fields, and a group name that happens to contain "Goa" makes that confusing.
8. **Member counts disagree in the empty state.** Hero: "2 joined" (2 avatars). Expenses "Everyone" toggle: 3 avatars (cb0a, 234f, 8c7b, the other members in later states).
9. **The plan shell has no everyone/me toggle**, only Expenses does. Populated readers may show it on Itinerary too ("P-Plan-Everyone" / "P-Plan-Mine" exist). This group only shows it on Expenses.
10. **The tab is labelled "Expenses" but the files are named "Budget".** I4 and I5 share the `<title>` "Go — Expenses, empty".
11. **The collapsing header never fully appears** in any I screen (scroll is too short). It can only be seen partly, in I5.
12. **Dead CSS and code:** `.knob` CSS in H2/H3; `.row` and `.tick` unused; `_send`/`pSent` in I-screens; `collapsed` state never read.
13. **Locked items look tappable.** Home "Find a stay — Unlocks once place and dates are set" and H1 board "STAY — Needs a place and dates first" both keep an enabled "Ask Go" pill.
15. **Copy uses curly apostrophes (’) almost everywhere**, except Go's "Here's your Goa." Keep the copy verbatim.
16. **Hard-coded safe area:** 46px or 56px top padding instead of env(safe-area-inset-top). There is no bottom safe-area handling: the chat pill sits at bottom 28 and the composer has padding-bottom 24.
